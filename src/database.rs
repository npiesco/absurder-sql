use crate::types::{DatabaseConfig, QueryResult, ColumnValue, Row, DatabaseError};
use crate::vfs::IndexedDBVFS;
use rusqlite::{Connection, params_from_iter};
use std::time::Instant;

#[cfg(feature = "fs_persist")]
use crate::storage::BlockStorage;
#[cfg(feature = "fs_persist")]
use std::path::PathBuf;

/// Main database interface that combines SQLite with IndexedDB persistence
pub struct SqliteIndexedDB {
    connection: Connection,
    #[allow(dead_code)]
    vfs: IndexedDBVFS,
    config: DatabaseConfig,
    #[cfg(feature = "fs_persist")]
    storage: BlockStorage,
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
            let base_dir = std::env::var("DATASYNC_FS_BASE")
                .unwrap_or_else(|_| "./datasync_storage".to_string());
            
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
                    log::warn!("Failed to prepare cache_size statement: {}", e);
                    DatabaseError::from(e)
                })?;
            let _ = stmt.query_map([], |_| Ok(()))
                .map_err(|e| {
                    log::warn!("Failed to set cache_size: {}", e);
                    DatabaseError::from(e)
                })?;
        }
        
        if let Some(page_size) = self.config.page_size {
            let sql = format!("PRAGMA page_size = {}", page_size);
            log::debug!("Setting page_size: {}", sql);
            let mut stmt = self.connection.prepare(&sql)
                .map_err(|e| {
                    log::warn!("Failed to prepare page_size statement: {}", e);
                    DatabaseError::from(e)
                })?;
            let _ = stmt.query_map([], |_| Ok(()))
                .map_err(|e| {
                    log::warn!("Failed to set page_size: {}", e);
                    DatabaseError::from(e)
                })?;
        }
        
        if let Some(journal_mode) = &self.config.journal_mode {
            let sql = format!("PRAGMA journal_mode = {}", journal_mode);
            log::debug!("Setting journal_mode: {}", sql);
            let mut stmt = self.connection.prepare(&sql)
                .map_err(|e| {
                    log::warn!("Failed to prepare journal_mode statement: {}", e);
                    DatabaseError::from(e)
                })?;
            let _ = stmt.query_map([], |_| Ok(()))
                .map_err(|e| {
                    log::warn!("Failed to set journal_mode: {}", e);
                    DatabaseError::from(e)
                })?;
        }
        
        log::info!("SQLiteIndexedDB configured successfully");
        Ok(())
    }

    pub async fn execute(&mut self, sql: &str) -> Result<QueryResult, DatabaseError> {
        self.execute_with_params(sql, &[]).await
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
        
        // Sync to IndexedDB after write operations
        if !is_select {
            self.sync().await?;
        }
        
        Ok(result)
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

    pub fn get_config(&self) -> &DatabaseConfig {
        &self.config
    }
}
