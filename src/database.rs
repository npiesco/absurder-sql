use crate::types::{DatabaseConfig, QueryResult, ColumnValue, Row, DatabaseError};
use crate::vfs::IndexedDBVFS;
use rusqlite::{Connection, params_from_iter, Statement};
use std::time::Instant;

#[cfg(feature = "fs_persist")]
use crate::storage::BlockStorage;
#[cfg(feature = "fs_persist")]
use std::path::PathBuf;

/// Prepared statement wrapper for efficient repeated execution
pub struct PreparedStatement<'conn> {
    stmt: Statement<'conn>,
}

impl<'conn> PreparedStatement<'conn> {
    /// Execute the prepared statement with given parameters
    pub async fn execute(&mut self, params: &[ColumnValue]) -> Result<QueryResult, DatabaseError> {
        log::debug!("Executing prepared statement with {} parameters", params.len());
        let start_time = Instant::now();
        
        // Convert parameters to rusqlite format
        let rusqlite_params: Vec<rusqlite::types::Value> = params.iter()
            .map(|p| p.to_rusqlite_value())
            .collect();
        
        let mut result = QueryResult {
            columns: Vec::new(),
            rows: Vec::new(),
            affected_rows: 0,
            last_insert_id: None,
            execution_time_ms: 0.0,
        };
        
        // Get column names
        result.columns = self.stmt.column_names().iter()
            .map(|name| name.to_string())
            .collect();
        
        // Check if this is a SELECT query (has columns)
        let is_select = !result.columns.is_empty();
        
        if is_select {
            // Execute query and collect rows
            let rows = self.stmt.query_map(params_from_iter(rusqlite_params.iter()), |row| {
                let mut values = Vec::new();
                for i in 0..result.columns.len() {
                    let value = row.get_ref(i)?;
                    values.push(ColumnValue::from_rusqlite_value(&value.into()));
                }
                Ok(Row { values })
            }).map_err(|e| DatabaseError::from(e))?;
            
            for row in rows {
                result.rows.push(row.map_err(|e| DatabaseError::from(e))?);
            }
        } else {
            // Execute non-SELECT query (INSERT, UPDATE, DELETE)
            self.stmt.execute(params_from_iter(rusqlite_params.iter()))
                .map_err(|e| DatabaseError::from(e))?;
            
            // Note: Cannot get affected_rows or last_insert_id from Statement
            // These require access to the Connection which we don't have here
        }
        
        result.execution_time_ms = start_time.elapsed().as_secs_f64() * 1000.0;
        log::debug!("Prepared statement executed in {:.2}ms, {} rows returned", 
                   result.execution_time_ms, result.rows.len());
        
        Ok(result)
    }
    
    /// Finalize the statement and release resources
    /// This is called automatically when the PreparedStatement is dropped,
    /// but calling it explicitly allows error handling
    pub fn finalize(self) -> Result<(), DatabaseError> {
        // Statement is dropped here, rusqlite handles cleanup
        Ok(())
    }
}

/// Main database interface that combines SQLite with IndexedDB persistence
pub struct SqliteIndexedDB {
    connection: Connection,
    #[allow(dead_code)]
    vfs: IndexedDBVFS,
    config: DatabaseConfig,
    #[cfg(feature = "fs_persist")]
    storage: BlockStorage,
    /// Track transaction depth to defer sync operations during transactions
    transaction_depth: u32,
}

impl SqliteIndexedDB {
    pub async fn new(config: DatabaseConfig) -> Result<Self, DatabaseError> {
        log::info!("Creating SQLiteIndexedDB with config: {:?}", config);
        
        // Create the IndexedDB VFS
        let vfs = IndexedDBVFS::new(&config.name).await?;
        
        // With fs_persist: use real filesystem persistence
        #[cfg(feature = "fs_persist")]
        {
            // Remove .db extension for storage name
            let storage_name = config.name.strip_suffix(".db")
                .unwrap_or(&config.name)
                .to_string();
            
            // Create BlockStorage for filesystem persistence
            let storage = BlockStorage::new(&storage_name).await
                .map_err(|e| DatabaseError::new("BLOCKSTORAGE_ERROR", &e.to_string()))?;
            
            // Get base directory
            let base_dir = std::env::var("ABSURDERSQL_FS_BASE")
                .unwrap_or_else(|_| "./absurdersql_storage".to_string());
            
            // Create database file path
            let db_file_path = PathBuf::from(base_dir)
                .join(&storage_name)
                .join("database.sqlite");
            
            // Ensure directory exists
            if let Some(parent) = db_file_path.parent() {
                std::fs::create_dir_all(parent)
                    .map_err(|e| DatabaseError::new("IO_ERROR", &format!("Failed to create directory: {}", e)))?;
            }
            
            // Open SQLite connection with real file
            let connection = Connection::open(&db_file_path)
                .map_err(|e| DatabaseError::from(e))?;
            
            log::info!("Native database opened with filesystem persistence: {:?}", db_file_path);
            
            return Self::configure_connection(connection, vfs, config, storage);
        }
        
        // Without fs_persist: use in-memory database
        #[cfg(not(feature = "fs_persist"))]
        {
            let connection = Connection::open_in_memory()
                .map_err(|e| DatabaseError::from(e))?;
            
            return Self::configure_connection(connection, vfs, config);
        }
    }
    
    #[cfg(feature = "fs_persist")]
    fn configure_connection(
        connection: Connection,
        vfs: IndexedDBVFS,
        config: DatabaseConfig,
        storage: BlockStorage,
    ) -> Result<Self, DatabaseError> {
        let mut instance = Self {
            connection,
            vfs,
            config,
            storage,
            transaction_depth: 0,
        };
        instance.apply_pragmas()?;
        Ok(instance)
    }
    
    #[cfg(not(feature = "fs_persist"))]
    fn configure_connection(
        connection: Connection,
        vfs: IndexedDBVFS,
        config: DatabaseConfig,
    ) -> Result<Self, DatabaseError> {
        let mut instance = Self {
            connection,
            vfs,
            config,
            transaction_depth: 0,
        };
        instance.apply_pragmas()?;
        Ok(instance)
    }
    
    fn apply_pragmas(&mut self) -> Result<(), DatabaseError> {
        // Configure SQLite based on config using proper PRAGMA handling
        if let Some(cache_size) = self.config.cache_size {
            let sql = format!("PRAGMA cache_size = {}", cache_size);
            log::debug!("Setting cache_size: {}", sql);
            let mut stmt = self.connection.prepare(&sql)
                .map_err(|e| {
                    log::warn!("Failed to prepare cache_size statement: {:?}", e);
                    DatabaseError::from(e)
                })?;
            let _ = stmt.query_map([], |_| Ok(()))
                .map_err(|e| {
                    log::warn!("Failed to set cache_size: {:?}", e);
                    DatabaseError::from(e)
                })?;
        }
        
        if let Some(page_size) = self.config.page_size {
            let sql = format!("PRAGMA page_size = {}", page_size);
            log::debug!("Setting page_size: {}", sql);
            let mut stmt = self.connection.prepare(&sql)
                .map_err(|e| {
                    log::warn!("Failed to prepare page_size statement: {:?}", e);
                    DatabaseError::from(e)
                })?;
            let _ = stmt.query_map([], |_| Ok(()))
                .map_err(|e| {
                    log::warn!("Failed to set page_size: {:?}", e);
                    DatabaseError::from(e)
                })?;
        }
        
        if let Some(journal_mode) = &self.config.journal_mode {
            let sql = format!("PRAGMA journal_mode = {}", journal_mode);
            log::debug!("Setting journal_mode: {}", sql);
            let mut stmt = self.connection.prepare(&sql)
                .map_err(|e| {
                    log::warn!("Failed to prepare journal_mode statement: {:?}", e);
                    DatabaseError::from(e)
                })?;
            let _ = stmt.query_map([], |_| Ok(()))
                .map_err(|e| {
                    log::warn!("Failed to set journal_mode: {:?}", e);
                    DatabaseError::from(e)
                })?;
        }
        
        log::info!("SQLiteIndexedDB configured successfully");
        Ok(())
    }

    pub async fn execute(&mut self, sql: &str) -> Result<QueryResult, DatabaseError> {
        self.execute_with_params(sql, &[]).await
    }
    
    /// Prepare a SQL statement for efficient repeated execution
    /// 
    /// # Example
    /// ```no_run
    /// # use absurder_sql::database::SqliteIndexedDB;
    /// # use absurder_sql::types::{DatabaseConfig, ColumnValue};
    /// # async {
    /// # let mut db = SqliteIndexedDB::new(DatabaseConfig::default()).await.unwrap();
    /// let mut stmt = db.prepare("SELECT * FROM users WHERE id = ?").unwrap();
    /// for i in 1..=100 {
    ///     let result = stmt.execute(&[ColumnValue::Integer(i)]).await.unwrap();
    /// }
    /// stmt.finalize().unwrap();
    /// # };
    /// ```
    pub fn prepare(&mut self, sql: &str) -> Result<PreparedStatement<'_>, DatabaseError> {
        log::debug!("Preparing SQL statement: {}", sql);
        let stmt = self.connection.prepare(sql)
            .map_err(|e| DatabaseError::from(e).with_sql(sql))?;
        Ok(PreparedStatement { stmt })
    }

    pub async fn execute_with_params(&mut self, sql: &str, params: &[ColumnValue]) -> Result<QueryResult, DatabaseError> {
        log::debug!("Executing SQL: {}", sql);
        let start_time = Instant::now();
        
        // Convert parameters to rusqlite format
        let rusqlite_params: Vec<rusqlite::types::Value> = params.iter()
            .map(|p| p.to_rusqlite_value())
            .collect();
        
        // Check if this is a SELECT query
        let trimmed_sql = sql.trim_start().to_lowercase();
        let is_select = trimmed_sql.starts_with("select") || 
                       trimmed_sql.starts_with("with") ||
                       trimmed_sql.starts_with("pragma");
        
        let mut result = QueryResult {
            columns: Vec::new(),
            rows: Vec::new(),
            affected_rows: 0,
            last_insert_id: None,
            execution_time_ms: 0.0,
        };
        
        if is_select {
            // Handle SELECT queries
            let mut stmt = self.connection.prepare(sql)
                .map_err(|e| DatabaseError::from(e).with_sql(sql))?;
            
            // Get column names
            result.columns = stmt.column_names().iter()
                .map(|name| name.to_string())
                .collect();
            
            // Execute query and collect rows
            let rows = stmt.query_map(params_from_iter(rusqlite_params.iter()), |row| {
                let mut values = Vec::new();
                for i in 0..result.columns.len() {
                    let value = row.get_ref(i)?;
                    values.push(ColumnValue::from_rusqlite_value(&value.into()));
                }
                Ok(Row { values })
            }).map_err(|e| DatabaseError::from(e).with_sql(sql))?;
            
            for row in rows {
                result.rows.push(row.map_err(|e| DatabaseError::from(e).with_sql(sql))?);
            }
        } else {
            // Handle INSERT/UPDATE/DELETE queries
            let changes = self.connection.execute(sql, params_from_iter(rusqlite_params.iter()))
                .map_err(|e| DatabaseError::from(e).with_sql(sql))?;
            
            result.affected_rows = changes as u32;
            
            // Get last insert ID for INSERT queries
            if trimmed_sql.starts_with("insert") {
                result.last_insert_id = Some(self.connection.last_insert_rowid());
            }
        }
        
        result.execution_time_ms = start_time.elapsed().as_secs_f64() * 1000.0;
        
        log::debug!("SQL executed in {:.2}ms, {} rows affected/returned", 
                   result.execution_time_ms, 
                   if is_select { result.rows.len() } else { result.affected_rows as usize });
        
        // Track transaction boundaries
        if trimmed_sql.starts_with("begin") {
            self.transaction_depth += 1;
            log::debug!("Transaction BEGIN, depth now: {}", self.transaction_depth);
        } else if trimmed_sql.starts_with("commit") || trimmed_sql.starts_with("end") {
            if self.transaction_depth > 0 {
                self.transaction_depth -= 1;
                log::debug!("Transaction COMMIT, depth now: {}", self.transaction_depth);
            }
        } else if trimmed_sql.starts_with("rollback") {
            if self.transaction_depth > 0 {
                self.transaction_depth -= 1;
                log::debug!("Transaction ROLLBACK, depth now: {}", self.transaction_depth);
            }
        }
        
        // Sync to IndexedDB after write operations, but ONLY if not in a transaction
        if !is_select && self.transaction_depth == 0 {
            self.sync().await?;
        }
        
        Ok(result)
    }

    /// Execute multiple SQL statements as a batch
    /// This is more efficient than calling execute() multiple times when crossing FFI boundaries
    /// as it reduces the number of bridge calls from N to 1
    pub async fn execute_batch(&mut self, statements: &[String]) -> Result<(), DatabaseError> {
        log::debug!("Executing batch of {} statements", statements.len());
        let start_time = Instant::now();
        
        for (i, sql) in statements.iter().enumerate() {
            self.execute(sql).await.map_err(|e| {
                log::error!("Batch execution failed at statement {}: {}", i, sql);
                e.with_sql(sql)
            })?;
        }
        
        let duration = start_time.elapsed().as_secs_f64() * 1000.0;
        log::debug!("Batch of {} statements executed in {:.2}ms", statements.len(), duration);
        
        Ok(())
    }

    pub async fn sync(&mut self) -> Result<(), DatabaseError> {
        #[cfg(feature = "fs_persist")]
        {
            log::debug!("Syncing database to filesystem");
            self.storage.sync().await
                .map_err(|e| DatabaseError::new("SYNC_ERROR", &e.to_string()))?;
        }
        
        #[cfg(not(feature = "fs_persist"))]
        {
            // Native mode without fs_persist uses in-memory SQLite only
            // No persistence layer to sync to
            log::debug!("Native mode without fs_persist - no sync needed");
        }
        
        Ok(())
    }

    pub async fn close(&mut self) -> Result<(), DatabaseError> {
        log::info!("Closing database");
        self.sync().await?;
        // Connection will be closed when dropped
        Ok(())
    }

    pub fn get_connection(&self) -> &Connection {
        &self.connection
    }
    
    /// Get access to the underlying BlockStorage for inspection
    #[cfg(feature = "fs_persist")]
    pub fn get_storage(&self) -> &BlockStorage {
        &self.storage
    }

    /// Create a new encrypted database with SQLCipher
    /// 
    /// # Arguments
    /// * `config` - Database configuration
    /// * `key` - Encryption key (minimum 8 characters recommended)
    /// 
    /// # Security Notes
    /// - Keys should be stored in secure storage (iOS Keychain, Android Keystore)
    /// - Uses SQLCipher's PRAGMA key for encryption
    /// - Data is encrypted at rest using AES-256
    #[cfg(all(not(target_arch = "wasm32"), any(feature = "encryption", feature = "encryption-commoncrypto", feature = "encryption-ios")))]
    pub async fn new_encrypted(config: DatabaseConfig, key: &str) -> Result<Self, DatabaseError> {
        log::info!("Creating encrypted SQLiteIndexedDB with config: {:?}", config);
        
        // Validate key length
        if key.len() < 8 {
            return Err(DatabaseError::new(
                "ENCRYPTION_ERROR",
                "Encryption key must be at least 8 characters long"
            ));
        }
        
        // For encrypted databases, VFS and BlockStorage use separate paths
        // to avoid conflicting with the native SQLite .db file
        let vfs_name = format!("{}_vfs_metadata", config.name);
        let vfs = IndexedDBVFS::new(&vfs_name).await?;
        
        // With fs_persist: use real filesystem persistence with encryption
        #[cfg(feature = "fs_persist")]
        {
            // Storage name for VFS metadata (not the actual db file)
            let storage_name = format!("{}_vfs_storage", 
                config.name.strip_suffix(".db").unwrap_or(&config.name));
            
            // Create BlockStorage for VFS metadata persistence
            let storage = BlockStorage::new(&storage_name).await
                .map_err(|e| DatabaseError::new("BLOCKSTORAGE_ERROR", &e.to_string()))?;
            
            // Use config.name directly as the SQLite file path
            let db_file_path = PathBuf::from(&config.name);
            
            // Ensure parent directory exists for the db file
            if let Some(parent) = db_file_path.parent() {
                std::fs::create_dir_all(parent)
                    .map_err(|e| DatabaseError::new("IO_ERROR", &format!("Failed to create directory: {}", e)))?;
            }
            
            // Clean up old VFS directories if they exist at the db file path
            // This fixes conflicts from previous VFS-based implementations
            // Note: Don't remove existing .db files - those are valid encrypted databases to reopen
            if db_file_path.exists() && db_file_path.is_dir() {
                std::fs::remove_dir_all(&db_file_path)
                    .map_err(|e| DatabaseError::new("IO_ERROR", &format!("Failed to remove existing VFS directory: {}", e)))?;
            }
            
            // Open SQLite connection with encrypted file
            let connection = Connection::open(&db_file_path)
                .map_err(|e| DatabaseError::from(e))?;
            
            // Set encryption key using PRAGMA key
            // Escape single quotes in the key
            let escaped_key = key.replace("'", "''");
            connection.execute_batch(&format!("PRAGMA key = '{}';", escaped_key))
                .map_err(|e| DatabaseError::new("ENCRYPTION_ERROR", &format!("Failed to set encryption key: {}", e)))?;
            
            // Test that encryption is working by creating a test table
            connection.execute("CREATE TABLE IF NOT EXISTS _encryption_check (id INTEGER PRIMARY KEY)", [])
                .map_err(|e| DatabaseError::new("ENCRYPTION_ERROR", &format!("Failed to verify encryption: {}", e)))?;
            
            // Drop the test table
            connection.execute("DROP TABLE _encryption_check", [])
                .map_err(|e| DatabaseError::new("ENCRYPTION_ERROR", &format!("Failed to cleanup test table: {}", e)))?;
            
            log::info!("Encrypted native database opened with filesystem persistence: {:?}", db_file_path);
            
            return Self::configure_connection(connection, vfs, config, storage);
        }
        
        // Without fs_persist: use in-memory database with encryption
        #[cfg(not(feature = "fs_persist"))]
        {
            let connection = Connection::open_in_memory()
                .map_err(|e| DatabaseError::from(e))?;
            
            // Set encryption key
            let escaped_key = key.replace("'", "''");
            connection.execute_batch(&format!("PRAGMA key = '{}';", escaped_key))
                .map_err(|e| DatabaseError::new("ENCRYPTION_ERROR", &format!("Failed to set encryption key: {}", e)))?;
            
            return Self::configure_connection(connection, vfs, config);
        }
    }

    /// Change the encryption key of an open encrypted database
    /// 
    /// # Arguments
    /// * `new_key` - New encryption key (minimum 8 characters recommended)
    /// 
    /// # Security Notes
    /// - Database remains accessible with the new key after successful rekey
    /// - Old key will no longer work after this operation
    /// - Operation is atomic - either succeeds completely or fails without changes
    #[cfg(all(not(target_arch = "wasm32"), any(feature = "encryption", feature = "encryption-commoncrypto", feature = "encryption-ios")))]
    pub async fn rekey(&self, new_key: &str) -> Result<(), DatabaseError> {
        log::info!("Rekeying encrypted database");
        
        // Validate new key length
        if new_key.len() < 8 {
            return Err(DatabaseError::new(
                "ENCRYPTION_ERROR",
                "New encryption key must be at least 8 characters long"
            ));
        }
        
        // Escape single quotes in the key
        let escaped_key = new_key.replace("'", "''");
        
        // Use PRAGMA rekey to change the encryption key
        self.connection.execute_batch(&format!("PRAGMA rekey = '{}';", escaped_key))
            .map_err(|e| DatabaseError::new("ENCRYPTION_ERROR", &format!("Failed to rekey database: {}", e)))?;
        
        // Verify new key works by executing a test pragma
        self.connection.execute_batch("PRAGMA cipher_version;")
            .map_err(|e| DatabaseError::new("ENCRYPTION_ERROR", &format!("New key verification failed: {}", e)))?;
        
        log::info!("Successfully rekeyed database");
        Ok(())
    }
}
