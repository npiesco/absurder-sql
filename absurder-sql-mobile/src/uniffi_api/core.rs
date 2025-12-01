/// UniFFI core database operations
/// 
/// These functions are automatically exported to TypeScript, Swift, and Kotlin
/// using the #[uniffi::export] macro.

use super::types::{DatabaseConfig, DatabaseError, QueryResult};
use crate::registry::{DB_REGISTRY, HANDLE_COUNTER, RUNTIME};
#[cfg(target_os = "android")]
use crate::registry::ANDROID_DATA_DIR;
use absurder_sql::{SqliteIndexedDB, DatabaseConfig as CoreDatabaseConfig, ColumnValue as CoreColumnValue};
use std::sync::Arc;
use std::path::Path;
#[cfg(any(target_os = "android", target_os = "ios"))]
use std::path::PathBuf;
use parking_lot::Mutex;
use serde_json;

/// Convert a core Row to a JSON string for UniFFI transport
fn row_to_json(core_row: &absurder_sql::Row) -> String {
    let values: Vec<serde_json::Value> = core_row.values.iter().map(|cv| {
        match cv {
            CoreColumnValue::Null => serde_json::json!({"type": "Null", "value": null}),
            CoreColumnValue::Integer(i) => serde_json::json!({"type": "Integer", "value": i}),
            CoreColumnValue::Real(r) => serde_json::json!({"type": "Real", "value": r}),
            CoreColumnValue::Text(s) => serde_json::json!({"type": "Text", "value": s}),
            CoreColumnValue::Blob(b) => serde_json::json!({"type": "Blob", "value": b}),
            CoreColumnValue::Date(d) => serde_json::json!({"type": "Integer", "value": d}),
            CoreColumnValue::BigInt(s) => serde_json::json!({"type": "Text", "value": s}),
        }
    }).collect();
    serde_json::json!({"values": values}).to_string()
}

/// Resolve database path to an absolute path appropriate for the platform
/// 
/// - Android: Resolves relative paths to /data/data/{package}/files/databases/
/// - iOS: Resolves relative paths to ~/Documents/
/// - Other: Returns path as-is (may be relative)
pub fn resolve_db_path(path: &str) -> String {
    // If already absolute, return as-is
    if path.starts_with('/') {
        return path.to_string();
    }
    
    // Platform-specific resolution for relative paths
    #[cfg(target_os = "android")]
    {
        let android_dir = ANDROID_DATA_DIR.lock();
        if let Some(ref base_dir) = *android_dir {
            let databases_dir = PathBuf::from(base_dir).join("databases");
            let full_path = databases_dir.join(path);
            return full_path.to_string_lossy().to_string();
        } else {
            log::warn!("Android data directory not set! Relative path will not be resolved: {}", path);
            log::warn!("Call AbsurderSqlInitializer.initialize() before creating databases");
            return path.to_string();
        }
    }
    
    #[cfg(target_os = "ios")]
    {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        let docs = PathBuf::from(home).join("Documents").join(path);
        return docs.to_string_lossy().to_string();
    }
    
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        // Desktop platforms: keep relative paths as-is
        path.to_string()
    }
}

/// Create a new database and return a handle
/// 
/// This function creates a database with the given configuration.
/// Returns a unique handle that can be used for subsequent operations.
/// 
/// # Arguments
/// * `config` - Database configuration including name and optional encryption
/// 
/// # Returns
/// * `u64` - Database handle (0 indicates error)
#[uniffi::export(async_runtime = "tokio")]
pub async fn create_database(config: DatabaseConfig) -> Result<u64, DatabaseError> {
    log::info!("UniFFI: Creating database: {}", config.name);
    
    // Resolve path using platform-specific logic
    let resolved_path = resolve_db_path(&config.name);
    
    log::info!("UniFFI: Resolved database path: {}", resolved_path);
    
    // Ensure parent directory exists (especially for Android databases directory)
    if let Some(parent) = Path::new(&resolved_path).parent() {
        if let Err(e) = std::fs::create_dir_all(parent) {
            log::error!("Failed to create parent directory {:?}: {}", parent, e);
            return Err(DatabaseError::SqlError {
                message: format!("Failed to create directory: {}", e),
            });
        }
    }
    
    // Create core database config with mobile settings
    let core_config = CoreDatabaseConfig {
        name: resolved_path,
        cache_size: config.cache_size.map(|c| c as usize),
        page_size: config.page_size.map(|p| p as usize),
        journal_mode: config.journal_mode,
        auto_vacuum: config.auto_vacuum,
        ..Default::default()
    };

    // Create database asynchronously - no blocking!
    let db_result = SqliteIndexedDB::new(core_config).await;
    
    match db_result {
        Ok(db) => {
            // Generate handle - HANDLE_COUNTER is now Arc<Mutex<u64>>
            let mut counter = HANDLE_COUNTER.lock();
            *counter += 1;
            let handle = *counter;
            drop(counter);
            
            // Store in registry
            DB_REGISTRY.lock().insert(handle, Arc::new(Mutex::new(db)));
            
            log::info!("UniFFI: Database created with handle: {}", handle);
            Ok(handle)
        }
        Err(e) => {
            log::error!("UniFFI: Failed to create database: {}", e);
            Err(DatabaseError::from(e))
        }
    }
}

/// Execute SQL query on a database
/// 
/// # Arguments
/// * `handle` - Database handle
/// * `sql` - SQL query to execute
/// 
/// # Returns
/// * `QueryResult` - Query results with columns and rows
#[uniffi::export]
pub fn execute(handle: u64, sql: String) -> Result<QueryResult, DatabaseError> {
    log::info!("UniFFI: Executing SQL on handle {}: {}", handle, sql);
    
    // Get database from registry
    let db_arc = {
        let registry = DB_REGISTRY.lock();
        registry.get(&handle)
            .ok_or(DatabaseError::DatabaseClosed)?
            .clone()
    };
    
    // Execute query using async runtime
    let result = RUNTIME.block_on(async {
        let mut db = db_arc.lock();
        db.execute(&sql).await
    });
    
    match result {
        Ok(query_result) => {
            // Convert rows to JSON strings for UniFFI transport
            let json_rows: Vec<String> = query_result.rows.iter()
                .map(row_to_json)
                .collect();

            Ok(QueryResult {
                columns: query_result.columns,
                rows: json_rows,
                rows_affected: query_result.affected_rows as u64,
                last_insert_id: query_result.last_insert_id,
                execution_time_ms: query_result.execution_time_ms,
            })
        }
        Err(e) => {
            log::error!("UniFFI: Failed to execute SQL: {}", e);
            Err(DatabaseError::SqlError {
                message: e.to_string(),
            })
        }
    }
}

/// Close a database
/// 
/// # Arguments
/// * `handle` - Database handle to close
#[uniffi::export]
pub fn close_database(handle: u64) -> Result<(), DatabaseError> {
    log::info!("UniFFI: Closing database handle: {}", handle);
    
    let mut registry = DB_REGISTRY.lock();
    if registry.remove(&handle).is_some() {
        Ok(())
    } else {
        Err(DatabaseError::DatabaseClosed)
    }
}

/// Execute SQL query with parameters on a database
/// 
/// This function provides parameterized query execution to prevent SQL injection.
/// Parameters are passed as a vector of strings and bound to ? placeholders in the SQL.
/// 
/// # Arguments
/// * `handle` - Database handle
/// * `sql` - SQL query with ? placeholders for parameters
/// * `params` - Vector of parameter values as strings
/// 
/// # Returns
/// * `QueryResult` - Query results with columns and rows
#[uniffi::export]
pub fn execute_with_params(handle: u64, sql: String, params: Vec<String>) -> Result<QueryResult, DatabaseError> {
    log::info!("UniFFI: Executing SQL with {} params on handle {}: {}", params.len(), handle, sql);
    
    // Get database from registry
    let db_arc = {
        let registry = DB_REGISTRY.lock();
        registry.get(&handle)
            .ok_or(DatabaseError::DatabaseClosed)?
            .clone()
    };
    
    // Convert string params to core ColumnValue
    let column_params: Vec<CoreColumnValue> = params.into_iter()
        .map(|s| CoreColumnValue::Text(s))
        .collect();
    
    // Execute parameterized query using async runtime
    let result = RUNTIME.block_on(async {
        let mut db = db_arc.lock();
        db.execute_with_params(&sql, &column_params).await
    });
    
    match result {
        Ok(query_result) => {
            // Convert rows to JSON strings for UniFFI transport
            let json_rows: Vec<String> = query_result.rows.iter()
                .map(row_to_json)
                .collect();

            Ok(QueryResult {
                columns: query_result.columns,
                rows: json_rows,
                rows_affected: query_result.affected_rows as u64,
                last_insert_id: query_result.last_insert_id,
                execution_time_ms: query_result.execution_time_ms,
            })
        }
        Err(e) => {
            log::error!("UniFFI: Failed to execute SQL with params: {}", e);
            Err(DatabaseError::SqlError {
                message: e.to_string(),
            })
        }
    }
}

/// Begin a database transaction
/// 
/// Starts a new transaction. All subsequent operations will be part of this transaction
/// until commit() or rollback() is called.
/// 
/// # Arguments
/// * `handle` - Database handle
/// 
/// # Returns
/// * `Result<(), DatabaseError>` - Ok if transaction started successfully
#[uniffi::export]
pub fn begin_transaction(handle: u64) -> Result<(), DatabaseError> {
    log::info!("UniFFI: Beginning transaction on handle {}", handle);
    
    // Get database from registry
    let db_arc = {
        let registry = DB_REGISTRY.lock();
        registry.get(&handle)
            .ok_or(DatabaseError::DatabaseClosed)?
            .clone()
    };
    
    // Begin transaction using async runtime
    let result = RUNTIME.block_on(async {
        let mut db = db_arc.lock();
        db.execute("BEGIN TRANSACTION").await
    });
    
    match result {
        Ok(_) => {
            log::info!("UniFFI: Transaction begun on handle {}", handle);
            Ok(())
        }
        Err(e) => {
            log::error!("UniFFI: Failed to begin transaction: {}", e);
            Err(DatabaseError::SqlError {
                message: e.to_string(),
            })
        }
    }
}

/// Commit the current database transaction
/// 
/// Commits all changes made within the current transaction to the database.
/// 
/// # Arguments
/// * `handle` - Database handle
/// 
/// # Returns
/// * `Result<(), DatabaseError>` - Ok if transaction committed successfully
#[uniffi::export]
pub fn commit(handle: u64) -> Result<(), DatabaseError> {
    log::info!("UniFFI: Committing transaction on handle {}", handle);
    
    // Get database from registry
    let db_arc = {
        let registry = DB_REGISTRY.lock();
        registry.get(&handle)
            .ok_or(DatabaseError::DatabaseClosed)?
            .clone()
    };
    
    // Commit transaction using async runtime
    let result = RUNTIME.block_on(async {
        let mut db = db_arc.lock();
        db.execute("COMMIT").await
    });
    
    match result {
        Ok(_) => {
            log::info!("UniFFI: Transaction committed on handle {}", handle);
            Ok(())
        }
        Err(e) => {
            log::error!("UniFFI: Failed to commit transaction: {}", e);
            Err(DatabaseError::SqlError {
                message: e.to_string(),
            })
        }
    }
}

/// Rollback the current database transaction
/// 
/// Discards all changes made within the current transaction.
/// 
/// # Arguments
/// * `handle` - Database handle
/// 
/// # Returns
/// * `Result<(), DatabaseError>` - Ok if transaction rolled back successfully
#[uniffi::export]
pub fn rollback(handle: u64) -> Result<(), DatabaseError> {
    log::info!("UniFFI: Rolling back transaction on handle {}", handle);
    
    // Get database from registry
    let db_arc = {
        let registry = DB_REGISTRY.lock();
        registry.get(&handle)
            .ok_or(DatabaseError::DatabaseClosed)?
            .clone()
    };
    
    // Rollback transaction using async runtime
    let result = RUNTIME.block_on(async {
        let mut db = db_arc.lock();
        db.execute("ROLLBACK").await
    });
    
    match result {
        Ok(_) => {
            log::info!("UniFFI: Transaction rolled back on handle {}", handle);
            Ok(())
        }
        Err(e) => {
            log::error!("UniFFI: Failed to rollback transaction: {}", e);
            Err(DatabaseError::SqlError {
                message: e.to_string(),
            })
        }
    }
}

/// Export database to file using VACUUM INTO (async, non-blocking)
/// 
/// Creates a backup of the database at the specified path.
/// This is an async function that won't block the calling thread.
/// 
/// # Arguments
/// * `handle` - Database handle
/// * `path` - File path where the backup will be created
/// 
/// # Returns
/// * `Result<(), DatabaseError>` - Ok if export succeeded
#[uniffi::export(async_runtime = "tokio")]
pub async fn export_database_async(handle: u64, path: String) -> Result<(), DatabaseError> {
    log::info!("UniFFI: Async exporting database handle {} to {}", handle, path);
    
    // Resolve path using platform-specific logic
    let resolved_path = resolve_db_path(&path);
    
    log::info!("UniFFI: Resolved export path to: {}", resolved_path);
    
    // Get database from registry
    let db_arc = {
        let registry = DB_REGISTRY.lock();
        registry.get(&handle)
            .ok_or(DatabaseError::DatabaseClosed)?
            .clone()
    };
    
    // Delete export file if it exists (VACUUM INTO fails if file exists)
    if let Ok(canonical_path) = std::path::Path::new(&resolved_path).canonicalize() {
        let _ = std::fs::remove_file(canonical_path);
    } else {
        // If canonicalize fails, try to delete anyway
        let _ = std::fs::remove_file(&resolved_path);
    }
    
    // Escape single quotes in path for SQL
    let escaped_path = resolved_path.replace("'", "''");
    let export_sql = format!("VACUUM INTO '{}'", escaped_path);
    
    // Execute export asynchronously
    let mut db = db_arc.lock();
    db.execute(&export_sql).await.map_err(|e| {
        log::error!("UniFFI: Failed to export database: {}", e);
        DatabaseError::SqlError {
            message: e.to_string(),
        }
    })?;
    
    log::info!("UniFFI: Database exported successfully to {}", resolved_path);
    Ok(())
}

/// Export database to file using VACUUM INTO (sync, blocking)
/// 
/// Creates a backup of the database at the specified path.
/// This is a synchronous function - use export_database_async for non-blocking operation.
/// 
/// # Arguments
/// * `handle` - Database handle
/// * `path` - File path where the backup will be created
/// 
/// # Returns
/// * `Result<(), DatabaseError>` - Ok if export succeeded
#[uniffi::export]
pub fn export_database(handle: u64, path: String) -> Result<(), DatabaseError> {
    log::info!("UniFFI: Exporting database handle {} to {}", handle, path);
    
    // Resolve path using platform-specific logic
    let resolved_path = resolve_db_path(&path);
    
    log::info!("UniFFI: Resolved export path to: {}", resolved_path);
    
    // Get database from registry
    let db_arc = {
        let registry = DB_REGISTRY.lock();
        registry.get(&handle)
            .ok_or(DatabaseError::DatabaseClosed)?
            .clone()
    };
    
    // Delete export file if it exists (VACUUM INTO fails if file exists)
    if let Ok(canonical_path) = std::path::Path::new(&resolved_path).canonicalize() {
        let _ = std::fs::remove_file(canonical_path);
    } else {
        // If canonicalize fails, try to delete anyway
        let _ = std::fs::remove_file(&resolved_path);
    }
    
    // Escape single quotes in path for SQL
    let escaped_path = resolved_path.replace("'", "''");
    let export_sql = format!("VACUUM INTO '{}'", escaped_path);
    
    // Execute export using async runtime
    let result = RUNTIME.block_on(async move {
        let mut db = db_arc.lock();
        db.execute(&export_sql).await
    });
    
    match result {
        Ok(_) => {
            log::info!("UniFFI: Database exported successfully to {}", resolved_path);
            Ok(())
        }
        Err(e) => {
            log::error!("UniFFI: Failed to export database: {}", e);
            Err(DatabaseError::SqlError {
                message: e.to_string(),
            })
        }
    }
}

/// Import database from file
/// 
/// Restores a database from a backup file created by export_database.
/// This will copy all tables and data from the backup into the current database.
/// 
/// # Arguments
/// * `handle` - Database handle
/// * `path` - File path of the backup to import
/// 
/// # Returns
/// * `Result<(), DatabaseError>` - Ok if import succeeded
#[uniffi::export]
pub fn import_database(handle: u64, path: String) -> Result<(), DatabaseError> {
    log::info!("UniFFI: Importing database from {} to handle {}", path, handle);
    
    // Resolve path using platform-specific logic
    let resolved_path = resolve_db_path(&path);
    log::info!("UniFFI: Resolved import path to: {}", resolved_path);
    
    // Get database from registry
    let db_arc = {
        let registry = DB_REGISTRY.lock();
        registry.get(&handle)
            .ok_or(DatabaseError::DatabaseClosed)?
            .clone()
    };
    
    // Verify the import file exists
    if !std::path::Path::new(&resolved_path).exists() {
        let error_msg = format!("Import file does not exist: {}", resolved_path);
        log::error!("UniFFI: {}", error_msg);
        return Err(DatabaseError::SqlError {
            message: error_msg,
        });
    }
    
    use absurder_sql::rusqlite::Connection;
    
    // Execute import using async runtime
    let result = RUNTIME.block_on(async {
        let mut dest_guard = db_arc.lock();
        
        // Open the export file as a native SQLite connection
        let source_conn = Connection::open(&resolved_path)
            .map_err(|e| absurder_sql::DatabaseError::new("SQLITE_ERROR", &format!("Failed to open export file: {}", e)))?;
        
        // Get list of tables
        let mut stmt = source_conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
            .map_err(|e| absurder_sql::DatabaseError::new("SQLITE_ERROR", &format!("Failed to query tables: {}", e)))?;
        
        let table_names: Vec<String> = stmt.query_map([], |row| row.get(0))
            .map_err(|e| absurder_sql::DatabaseError::new("SQLITE_ERROR", &format!("Failed to get table names: {}", e)))?
            .collect::<Result<Vec<String>, _>>()
            .map_err(|e| absurder_sql::DatabaseError::new("SQLITE_ERROR", &format!("Failed to collect table names: {}", e)))?;
        
        for table_name in table_names {
            log::info!("UniFFI: Importing table: {}", table_name);
            
            // Get CREATE TABLE statement
            let create_sql: String = source_conn.query_row(
                "SELECT sql FROM sqlite_master WHERE type='table' AND name=?",
                [&table_name],
                |row| row.get(0)
            ).map_err(|e| absurder_sql::DatabaseError::new("SQLITE_ERROR", &format!("Failed to get schema for {}: {}", table_name, e)))?;
            
            // Drop and recreate table in destination
            let _ = dest_guard.execute(&format!("DROP TABLE IF EXISTS {}", table_name)).await;
            dest_guard.execute(&create_sql).await?;
            
            // Get all data from source table
            let mut data_stmt = source_conn.prepare(&format!("SELECT * FROM {}", table_name))
                .map_err(|e| absurder_sql::DatabaseError::new("SQLITE_ERROR", &format!("Failed to select from {}: {}", table_name, e)))?;
            
            let column_count = data_stmt.column_count();
            let mut rows = data_stmt.query([])
                .map_err(|e| absurder_sql::DatabaseError::new("SQLITE_ERROR", &format!("Failed to query {}: {}", table_name, e)))?;
            
            // Begin transaction for bulk insert
            dest_guard.execute("BEGIN TRANSACTION").await?;
            
            let mut row_count = 0;
            while let Some(row) = rows.next()
                .map_err(|e| absurder_sql::DatabaseError::new("SQLITE_ERROR", &format!("Failed to fetch row from {}: {}", table_name, e)))? {
                
                // Build INSERT VALUES string
                let mut values = Vec::new();
                for i in 0..column_count {
                    let value_str = match row.get_ref(i)
                        .map_err(|e| absurder_sql::DatabaseError::new("SQLITE_ERROR", &format!("Failed to get column {}: {}", i, e)))? {
                        absurder_sql::rusqlite::types::ValueRef::Null => "NULL".to_string(),
                        absurder_sql::rusqlite::types::ValueRef::Integer(n) => n.to_string(),
                        absurder_sql::rusqlite::types::ValueRef::Real(r) => r.to_string(),
                        absurder_sql::rusqlite::types::ValueRef::Text(t) => {
                            let text = String::from_utf8_lossy(t);
                            format!("'{}'", text.replace("'", "''"))
                        }
                        absurder_sql::rusqlite::types::ValueRef::Blob(b) => {
                            format!("X'{}'", b.iter().map(|byte| format!("{:02x}", byte)).collect::<String>())
                        }
                    };
                    values.push(value_str);
                }
                
                let insert_sql = format!("INSERT INTO {} VALUES ({})", table_name, values.join(", "));
                dest_guard.execute(&insert_sql).await?;
                row_count += 1;
            }
            
            // Commit transaction
            dest_guard.execute("COMMIT").await?;
            log::info!("UniFFI: Imported {} rows into table {}", row_count, table_name);
        }
        
        Ok::<(), absurder_sql::DatabaseError>(())
    });
    
    match result {
        Ok(_) => {
            log::info!("UniFFI: Database imported successfully from {}", resolved_path);
            Ok(())
        }
        Err(e) => {
            log::error!("UniFFI: Failed to import database: {}", e);
            Err(DatabaseError::SqlError {
                message: e.to_string(),
            })
        }
    }
}

/// Execute a batch of SQL statements in a transaction
/// 
/// Executes multiple SQL statements atomically. If any statement fails,
/// the entire batch is rolled back.
/// 
/// # Arguments
/// * `handle` - Database handle
/// * `statements` - Vector of SQL statements to execute
/// 
/// # Returns
/// * `Result<(), DatabaseError>` - Ok if all statements executed successfully
#[uniffi::export]
pub fn execute_batch(handle: u64, statements: Vec<String>) -> Result<(), DatabaseError> {
    log::info!("UniFFI: Executing batch of {} statements on handle {}", statements.len(), handle);
    
    // Get database from registry
    let db_arc = {
        let registry = DB_REGISTRY.lock();
        registry.get(&handle)
            .ok_or(DatabaseError::DatabaseClosed)?
            .clone()
    };
    
    // Execute batch using async runtime
    let result = RUNTIME.block_on(async {
        let mut db = db_arc.lock();
        db.execute_batch(&statements).await
    });
    
    match result {
        Ok(_) => {
            log::info!("UniFFI: Batch executed successfully on handle {}", handle);
            Ok(())
        }
        Err(e) => {
            log::error!("UniFFI: Failed to execute batch: {}", e);
            Err(DatabaseError::SqlError {
                message: e.to_string(),
            })
        }
    }
}

/// Prepare a SQL statement for repeated execution
/// 
/// Creates a prepared statement that can be executed multiple times with different parameters.
/// This is more efficient than calling execute_with_params() repeatedly for the same SQL.
/// 
/// # Arguments
/// * `db_handle` - Database handle
/// * `sql` - SQL statement with ? placeholders for parameters
/// 
/// # Returns
/// * `Result<u64, DatabaseError>` - Statement handle on success
#[uniffi::export]
pub fn prepare_statement(db_handle: u64, sql: String) -> Result<u64, DatabaseError> {
    use crate::registry::{STMT_REGISTRY, STMT_HANDLE_COUNTER, PreparedStatementWrapper};
    
    log::info!("UniFFI: Preparing statement for db handle {}: {}", db_handle, sql);
    
    // Get database from registry
    let db_arc = {
        let registry = DB_REGISTRY.lock();
        registry.get(&db_handle)
            .ok_or(DatabaseError::DatabaseClosed)?
            .clone()
    };
    
    // Validate SQL by attempting to prepare it
    {
        let mut db = db_arc.lock();
        match db.prepare(&sql) {
            Ok(stmt) => {
                // SQL is valid, finalize the test statement
                let _ = stmt.finalize();
            }
            Err(e) => {
                log::error!("UniFFI: Failed to prepare statement: {}", e);
                return Err(DatabaseError::SqlError {
                    message: e.to_string(),
                });
            }
        }
    }
    
    // Generate unique statement handle
    let stmt_handle = {
        let mut counter = STMT_HANDLE_COUNTER.lock();
        let handle = *counter;
        *counter += 1;
        handle
    };
    
    // Store SQL and database handle for on-demand preparation
    let wrapper = PreparedStatementWrapper {
        db_handle,
        sql: sql.clone(),
    };
    
    let mut stmt_registry = STMT_REGISTRY.lock();
    stmt_registry.insert(stmt_handle, wrapper);
    
    log::info!("UniFFI: Created statement handle {} for SQL: {}", stmt_handle, sql);
    Ok(stmt_handle)
}

/// Execute a prepared statement with parameters
///
/// Executes a previously prepared statement with the given parameters.
/// Parameters are passed as strings and will be converted to appropriate types.
///
/// # Arguments
/// * `stmt_handle` - Statement handle from prepare_statement()
/// * `params` - Vector of parameter values as strings
///
/// # Returns
/// * `Result<QueryResult, DatabaseError>` - Query results including columns, rows,
///   rows_affected, last_insert_id, and execution_time_ms
#[uniffi::export]
pub fn execute_statement(stmt_handle: u64, params: Vec<String>) -> Result<QueryResult, DatabaseError> {
    use crate::registry::STMT_REGISTRY;
    
    log::info!("UniFFI: Executing statement {} with {} params", stmt_handle, params.len());
    
    // Get statement info from registry
    let (db_handle, sql) = {
        let stmt_registry = STMT_REGISTRY.lock();
        match stmt_registry.get(&stmt_handle) {
            Some(wrapper) => (wrapper.db_handle, wrapper.sql.clone()),
            None => {
                log::error!("UniFFI: Statement handle {} not found", stmt_handle);
                return Err(DatabaseError::SqlError {
                    message: format!("Invalid statement handle: {}", stmt_handle),
                });
            }
        }
    };
    
    // Get database from registry
    let db_arc = {
        let registry = DB_REGISTRY.lock();
        registry.get(&db_handle)
            .ok_or(DatabaseError::DatabaseClosed)?
            .clone()
    };
    
    // Convert string params to ColumnValue
    let column_params: Vec<absurder_sql::ColumnValue> = params.into_iter()
        .map(|s| absurder_sql::ColumnValue::Text(s))
        .collect();
    
    // Execute with params
    let result = RUNTIME.block_on(async {
        let mut db = db_arc.lock();
        db.execute_with_params(&sql, &column_params).await
    });
    
    match result {
        Ok(query_result) => {
            log::info!("UniFFI: Statement {} executed successfully", stmt_handle);

            // Convert rows to JSON strings for UniFFI transport
            let json_rows: Vec<String> = query_result.rows.iter()
                .map(row_to_json)
                .collect();

            Ok(QueryResult {
                columns: query_result.columns,
                rows: json_rows,
                rows_affected: query_result.affected_rows as u64,
                last_insert_id: query_result.last_insert_id,
                execution_time_ms: query_result.execution_time_ms,
            })
        }
        Err(e) => {
            log::error!("UniFFI: Failed to execute statement {}: {}", stmt_handle, e);
            Err(DatabaseError::SqlError {
                message: e.to_string(),
            })
        }
    }
}

/// Finalize a prepared statement and free its resources
/// 
/// Removes the statement from the registry and frees associated resources.
/// The statement handle becomes invalid after this call.
/// 
/// # Arguments
/// * `stmt_handle` - Statement handle to finalize
/// 
/// # Returns
/// * `Result<(), DatabaseError>` - Ok if finalization succeeded
#[uniffi::export]
pub fn finalize_statement(stmt_handle: u64) -> Result<(), DatabaseError> {
    use crate::registry::STMT_REGISTRY;
    
    log::info!("UniFFI: Finalizing statement {}", stmt_handle);
    
    let mut stmt_registry = STMT_REGISTRY.lock();
    match stmt_registry.remove(&stmt_handle) {
        Some(_) => {
            log::info!("UniFFI: Statement {} finalized successfully", stmt_handle);
            Ok(())
        }
        None => {
            log::error!("UniFFI: Statement handle {} not found", stmt_handle);
            Err(DatabaseError::SqlError {
                message: format!("Invalid statement handle: {}", stmt_handle),
            })
        }
    }
}

/// Prepare a streaming statement for cursor-based iteration
/// 
/// Creates a streaming statement that can fetch results in batches,
/// avoiding memory issues with large result sets.
/// 
/// # Arguments
/// * `db_handle` - Database handle
/// * `sql` - SQL SELECT statement
/// 
/// # Returns
/// * `Result<u64, DatabaseError>` - Stream handle on success
#[uniffi::export]
pub fn prepare_stream(db_handle: u64, sql: String) -> Result<u64, DatabaseError> {
    use crate::registry::{STREAM_REGISTRY, STREAM_HANDLE_COUNTER, StreamingStatement};
    
    log::info!("UniFFI: Preparing stream for db handle {}: {}", db_handle, sql);
    
    // Get database from registry
    let db_arc = {
        let registry = DB_REGISTRY.lock();
        registry.get(&db_handle)
            .ok_or(DatabaseError::DatabaseClosed)?
            .clone()
    };
    
    // Validate SQL by attempting to execute with LIMIT 0
    // This ensures the SQL is valid before we store it
    {
        let validation_sql = format!("{} LIMIT 0", sql);
        let result = RUNTIME.block_on(async {
            let mut db = db_arc.lock();
            db.execute(&validation_sql).await
        });
        
        if let Err(e) = result {
            log::error!("UniFFI: Invalid SQL for stream: {}", e);
            return Err(DatabaseError::SqlError {
                message: e.to_string(),
            });
        }
    }
    
    // Generate unique stream handle
    let stream_handle = {
        let mut counter = STREAM_HANDLE_COUNTER.lock();
        let handle = *counter;
        *counter += 1;
        handle
    };
    
    // Create streaming statement
    let stream = StreamingStatement {
        db_handle,
        sql: sql.clone(),
        last_rowid: 0, // Assumes rowids start >= 1 (SQLite default)
    };
    
    // Register stream
    let mut stream_registry = STREAM_REGISTRY.lock();
    stream_registry.insert(stream_handle, stream);
    
    log::info!("UniFFI: Created stream handle {} for SQL: {}", stream_handle, sql);
    Ok(stream_handle)
}

/// Fetch next batch of rows from streaming statement
/// 
/// Fetches the next batch of rows from the stream using cursor-based pagination (WHERE rowid > last_rowid).
/// This provides O(n) complexity instead of O(n²) OFFSET pagination.
/// Returns an empty result when no more rows are available.
/// 
/// # Arguments
/// * `stream_handle` - Stream handle from prepare_stream()
/// * `batch_size` - Number of rows to fetch (must be > 0)
/// 
/// # Returns
/// * `Result<QueryResult, DatabaseError>` - Batch of rows
#[uniffi::export]
pub fn fetch_next(stream_handle: u64, batch_size: i32) -> Result<QueryResult, DatabaseError> {
    use crate::registry::STREAM_REGISTRY;
    
    log::info!("UniFFI: Fetching next {} rows from stream {}", batch_size, stream_handle);
    
    if batch_size <= 0 {
        log::error!("UniFFI: Invalid batch size: {}", batch_size);
        return Err(DatabaseError::SqlError {
            message: format!("Batch size must be > 0, got {}", batch_size),
        });
    }
    
    // Get stream from registry
    let (db_handle, sql, last_rowid) = {
        let stream_registry = STREAM_REGISTRY.lock();
        match stream_registry.get(&stream_handle) {
            Some(stream) => {
                let db_handle = stream.db_handle;
                let sql = stream.sql.clone();
                let last_rowid = stream.last_rowid;
                
                (db_handle, sql, last_rowid)
            }
            None => {
                log::error!("UniFFI: Invalid stream handle: {}", stream_handle);
                return Err(DatabaseError::SqlError {
                    message: format!("Invalid stream handle: {}", stream_handle),
                });
            }
        }
    };
    
    // Get database from registry
    let db_arc = {
        let registry = DB_REGISTRY.lock();
        registry.get(&db_handle)
            .ok_or(DatabaseError::DatabaseClosed)?
            .clone()
    };
    
    // Build cursor-based paginated query
    // Inject rowid selection into original query, then apply cursor filtering
    let paginated_sql = if last_rowid == 0 {
        // First fetch: add rowid to selection
        let with_rowid = if sql.trim().to_uppercase().starts_with("SELECT *") {
            sql.replacen("SELECT *", "SELECT *, rowid as _rowid", 1)
        } else if sql.trim().to_uppercase().starts_with("SELECT") {
            let parts: Vec<&str> = sql.splitn(2, " FROM ").collect();
            if parts.len() == 2 {
                format!("{}, rowid as _rowid FROM {}", parts[0], parts[1])
            } else {
                sql.to_string()
            }
        } else {
            sql.to_string()
        };
        format!("{} LIMIT {}", with_rowid, batch_size)
    } else {
        // Subsequent fetches: add rowid and cursor condition
        let with_rowid = if sql.trim().to_uppercase().starts_with("SELECT *") {
            sql.replacen("SELECT *", "SELECT *, rowid as _rowid", 1)
        } else if sql.trim().to_uppercase().starts_with("SELECT") {
            let parts: Vec<&str> = sql.splitn(2, " FROM ").collect();
            if parts.len() == 2 {
                format!("{}, rowid as _rowid FROM {}", parts[0], parts[1])
            } else {
                sql.to_string()
            }
        } else {
            sql.to_string()
        };
        // Add WHERE clause for cursor
        if with_rowid.to_uppercase().contains(" WHERE ") {
            format!("{} AND rowid > {} LIMIT {}", with_rowid, last_rowid, batch_size)
        } else if with_rowid.to_uppercase().contains(" ORDER BY") {
            let parts: Vec<&str> = with_rowid.splitn(2, " ORDER BY ").collect();
            format!("{} WHERE rowid > {} ORDER BY {} LIMIT {}", parts[0], last_rowid, parts[1], batch_size)
        } else {
            format!("{} WHERE rowid > {} LIMIT {}", with_rowid, last_rowid, batch_size)
        }
    };
    
    // Execute query
    let result = RUNTIME.block_on(async {
        let mut db = db_arc.lock();
        db.execute(&paginated_sql).await
    });
    
    match result {
        Ok(query_result) => {
            log::info!("UniFFI: Fetched {} rows from stream {}", query_result.rows.len(), stream_handle);
            
            // Update last_rowid by extracting max _rowid from results
            if !query_result.rows.is_empty() {
                // Find _rowid column index
                if let Some(rowid_idx) = query_result.columns.iter().position(|c| c == "_rowid") {
                    if let Some(last_row) = query_result.rows.last() {
                        if let Some(rowid_value) = last_row.values.get(rowid_idx) {
                            use absurder_sql::ColumnValue;
                            if let ColumnValue::Integer(rowid) = rowid_value {
                                let mut stream_registry = STREAM_REGISTRY.lock();
                                if let Some(stream) = stream_registry.get_mut(&stream_handle) {
                                    stream.last_rowid = *rowid;
                                }
                            }
                        }
                    }
                }
            }
            
            // Convert rows to JSON strings for UniFFI transport
            let json_rows: Vec<String> = query_result.rows.iter()
                .map(row_to_json)
                .collect();

            // Convert to UniFFI QueryResult
            let uniffi_result = QueryResult {
                columns: query_result.columns,
                rows: json_rows,
                rows_affected: query_result.affected_rows as u64,
                last_insert_id: query_result.last_insert_id,
                execution_time_ms: query_result.execution_time_ms,
            };

            Ok(uniffi_result)
        }
        Err(e) => {
            log::error!("UniFFI: Failed to fetch from stream {}: {}", stream_handle, e);
            Err(DatabaseError::SqlError {
                message: e.to_string(),
            })
        }
    }
}

/// Close a streaming statement and free its resources
/// 
/// Removes the stream from the registry and frees associated resources.
/// The stream handle becomes invalid after this call.
/// 
/// # Arguments
/// * `stream_handle` - Stream handle to close
/// 
/// # Returns
/// * `Result<(), DatabaseError>` - Ok if close succeeded
#[uniffi::export]
pub fn close_stream(stream_handle: u64) -> Result<(), DatabaseError> {
    use crate::registry::STREAM_REGISTRY;
    
    log::info!("UniFFI: Closing stream {}", stream_handle);
    
    let mut stream_registry = STREAM_REGISTRY.lock();
    match stream_registry.remove(&stream_handle) {
        Some(_) => {
            log::info!("UniFFI: Stream {} closed successfully", stream_handle);
            Ok(())
        }
        None => {
            log::error!("UniFFI: Stream handle {} not found", stream_handle);
            Err(DatabaseError::SqlError {
                message: format!("Invalid stream handle: {}", stream_handle),
            })
        }
    }
}

/// Create an encrypted database with SQLCipher
/// 
/// Creates a new encrypted database using AES-256 encryption.
/// The encryption key must be at least 8 characters long.
/// 
/// # Arguments
/// * `config` - Database configuration with name and encryption_key
/// 
/// # Returns
/// * `Result<u64, DatabaseError>` - Database handle on success
#[cfg(any(feature = "encryption", feature = "encryption-ios"))]
#[uniffi::export(async_runtime = "tokio")]
pub async fn create_encrypted_database(config: DatabaseConfig) -> Result<u64, DatabaseError> {
    log::info!("UniFFI: Creating encrypted database: {}", config.name);
    
    // Validate encryption key is provided
    let key = config.encryption_key.as_ref()
        .ok_or_else(|| DatabaseError::InvalidParameter {
            message: "Encryption key is required for encrypted database".to_string(),
        })?;
    
    // Validate key length (minimum 8 characters)
    if key.len() < 8 {
        log::error!("UniFFI: Encryption key too short: {} characters", key.len());
        return Err(DatabaseError::InvalidParameter {
            message: "Encryption key must be at least 8 characters long".to_string(),
        });
    }
    
    // Resolve path using platform-specific logic
    let resolved_path = resolve_db_path(&config.name);
    
    log::info!("UniFFI: Resolved encrypted database path: {}", resolved_path);
    
    // Ensure parent directory exists (especially for Android databases directory)
    if let Some(parent) = Path::new(&resolved_path).parent() {
        if let Err(e) = std::fs::create_dir_all(parent) {
            log::error!("Failed to create parent directory {:?}: {}", parent, e);
            return Err(DatabaseError::SqlError {
                message: format!("Failed to create directory: {}", e),
            });
        }
    }
    
    // Create core database config
    let core_config = CoreDatabaseConfig {
        name: resolved_path,
        ..Default::default()
    };
    
    // Create encrypted database asynchronously - no blocking!
    let db_result = SqliteIndexedDB::new_encrypted(core_config, key).await;
    
    match db_result {
        Ok(db) => {
            // Generate handle
            let mut counter = HANDLE_COUNTER.lock();
            *counter += 1;
            let handle = *counter;
            drop(counter);
            
            // Store in registry
            DB_REGISTRY.lock().insert(handle, Arc::new(Mutex::new(db)));
            
            log::info!("UniFFI: Encrypted database created with handle: {}", handle);
            Ok(handle)
        }
        Err(e) => {
            log::error!("UniFFI: Failed to create encrypted database: {}", e);
            Err(DatabaseError::from(e))
        }
    }
}

/// Change the encryption key of an open encrypted database
/// 
/// Updates the encryption key for an encrypted database.
/// The new key must be at least 8 characters long.
/// 
/// # Arguments
/// * `handle` - Database handle
/// * `new_key` - New encryption key
/// 
/// # Returns
/// * `Result<(), DatabaseError>` - Ok if rekey succeeded
#[cfg(any(feature = "encryption", feature = "encryption-ios"))]
#[uniffi::export]
pub fn rekey_database(handle: u64, new_key: String) -> Result<(), DatabaseError> {
    log::info!("UniFFI: Rekeying database handle {}", handle);
    
    // Validate key length (minimum 8 characters)
    if new_key.len() < 8 {
        log::error!("UniFFI: New encryption key too short: {} characters", new_key.len());
        return Err(DatabaseError::InvalidParameter {
            message: "New encryption key must be at least 8 characters long".to_string(),
        });
    }
    
    // Get database from registry
    let db_arc = {
        let registry = DB_REGISTRY.lock();
        registry.get(&handle)
            .ok_or(DatabaseError::DatabaseClosed)?
            .clone()
    };
    
    // Rekey the database
    let result = RUNTIME.block_on(async {
        let db = db_arc.lock();
        db.rekey(&new_key).await
    });
    
    match result {
        Ok(()) => {
            log::info!("UniFFI: Successfully rekeyed database handle {}", handle);
            Ok(())
        }
        Err(e) => {
            log::error!("UniFFI: Failed to rekey database: {}", e);
            Err(DatabaseError::from(e))
        }
    }
}

/// Get the UniFFI version being used
/// 
/// This is a simple test function to verify UniFFI is working
#[uniffi::export]
pub fn get_uniffi_version() -> String {
    "0.29".to_string()
}

/// Create an index on a table for improved query performance
/// 
/// # Arguments
/// * `handle` - Database handle from create_database()
/// * `table` - Table name
/// * `columns` - Comma-separated column names (e.g., "email" or "user_id,product_id")
/// 
/// # Returns
/// * Ok(()) on success
/// * Err(DatabaseError) on failure
/// 
/// # Index Naming
/// Automatically generates index name as `idx_{table}_{columns}` where columns are joined with underscores
/// 
/// # Examples
/// - Single column: `create_index(handle, "users", "email")` creates `idx_users_email`
/// - Multiple columns: `create_index(handle, "orders", "user_id,product_id")` creates `idx_orders_user_id_product_id`
#[uniffi::export]
pub fn create_index(
    handle: u64,
    table: String,
    columns: String,
) -> Result<(), DatabaseError> {
    // Validate inputs
    if table.is_empty() {
        return Err(DatabaseError::InvalidParameter {
            message: "Table name cannot be empty".to_string(),
        });
    }

    if columns.is_empty() {
        return Err(DatabaseError::InvalidParameter {
            message: "Column names cannot be empty".to_string(),
        });
    }

    // Get database from registry
    let db_arc = {
        let registry = DB_REGISTRY.lock();
        registry.get(&handle)
            .ok_or(DatabaseError::NotFound {
                message: format!("Database handle {} not found", handle),
            })?
            .clone()
    };

    // Generate index name: idx_{table}_{col1}_{col2}
    let columns_normalized = columns.replace(",", "_").replace(" ", "");
    let index_name = format!("idx_{}_{}", table, columns_normalized);

    // Build CREATE INDEX SQL
    let sql = format!(
        "CREATE INDEX IF NOT EXISTS {} ON {} ({})",
        index_name, table, columns
    );

    log::info!("UniFFI: Creating index: {}", sql);

    // Execute CREATE INDEX
    RUNTIME.block_on(async {
        let mut db = db_arc.lock();
        db.execute(&sql).await
    })?;

    log::info!("UniFFI: Successfully created index: {}", index_name);
    Ok(())
}
