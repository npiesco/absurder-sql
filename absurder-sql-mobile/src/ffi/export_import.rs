//! Export/Import FFI functions
//!
//! Database backup and restore functionality

use std::ffi::{CStr, c_char};
use absurder_sql::DatabaseError;

use crate::registry::{
    DB_REGISTRY, RUNTIME,
    set_last_error, clear_last_error,
};

/// Export database to file using VACUUM INTO
///
/// # Safety
/// - handle must be a valid database handle
/// - path must be a valid null-terminated UTF-8 C string
/// - Returns 0 on success, -1 on error
#[unsafe(no_mangle)]
pub unsafe extern "C" fn absurder_db_export(handle: u64, path: *const c_char) -> i32 {
    clear_last_error();
    if path.is_null() {
        set_last_error("Export path cannot be null".to_string());
        return -1;
    }
    let path_str = match unsafe { CStr::from_ptr(path) }.to_str() {
        Ok(s) => s,
        Err(e) => {
            set_last_error(format!("Invalid UTF-8 in path: {}", e));
            return -1;
        }
    };
    let registry = DB_REGISTRY.lock();
    let db = match registry.get(&handle) {
        Some(db) => db.clone(),
        None => {
            set_last_error(format!("Invalid database handle: {}", handle));
            return -1;
        }
    };
    drop(registry);
    
    // Delete export file if it exists (VACUUM INTO fails if file exists)
    if let Ok(path) = std::path::Path::new(path_str).canonicalize() {
        let _ = std::fs::remove_file(path);
    } else {
        // If canonicalize fails, try to delete anyway
        let _ = std::fs::remove_file(path_str);
    }
    
    let export_sql = format!("VACUUM INTO '{}'", path_str.replace("'", "''"));
    let result = RUNTIME.block_on(async {
        let mut db_guard = db.lock();
        db_guard.execute(&export_sql).await
    });
    match result {
        Ok(_) => {
            log::info!("Export successful");
            0
        },
        Err(e) => {
            let error_msg = format!("Export failed: {:?}", e);
            log::error!("{}", error_msg);
            set_last_error(error_msg);
            -1
        }
    }
}

/// Import database from file using ATTACH DATABASE
///
/// # Safety
/// - handle must be a valid database handle
/// - path must be a valid null-terminated UTF-8 C string
/// - Returns 0 on success, -1 on error
#[unsafe(no_mangle)]
pub unsafe extern "C" fn absurder_db_import(handle: u64, path: *const c_char) -> i32 {
    clear_last_error();
    if path.is_null() {
        set_last_error("Import path cannot be null".to_string());
        return -1;
    }
    let path_str = match unsafe { CStr::from_ptr(path) }.to_str() {
        Ok(s) => s,
        Err(e) => {
            set_last_error(format!("Invalid UTF-8 in path: {}", e));
            return -1;
        }
    };
    let registry = DB_REGISTRY.lock();
    let db = match registry.get(&handle) {
        Some(db) => db.clone(),
        None => {
            set_last_error(format!("Invalid database handle: {}", handle));
            return -1;
        }
    };
    drop(registry);
    // Use rusqlite to read the native SQLite export file
    use absurder_sql::rusqlite::Connection;
    
    let result = RUNTIME.block_on(async {
        let mut dest_guard = db.lock();
        
        // Open the export file as a native SQLite connection
        let source_conn = Connection::open(path_str)
            .map_err(|e| DatabaseError::new("SQLITE_ERROR", &format!("Failed to open export file: {}", e)))?;
        
        // Get list of tables
        let mut stmt = source_conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
            .map_err(|e| DatabaseError::new("SQLITE_ERROR", &format!("Failed to query tables: {}", e)))?;
        
        let table_names: Vec<String> = stmt.query_map([], |row| row.get(0))
            .map_err(|e| DatabaseError::new("SQLITE_ERROR", &format!("Failed to get table names: {}", e)))?
            .collect::<Result<Vec<String>, _>>()
            .map_err(|e| DatabaseError::new("SQLITE_ERROR", &format!("Failed to collect table names: {}", e)))?;
        
        for table_name in table_names {
            log::info!("Importing table: {}", table_name);
            
            // Get CREATE TABLE statement
            let create_sql: String = source_conn.query_row(
                "SELECT sql FROM sqlite_master WHERE type='table' AND name=?",
                [&table_name],
                |row| row.get(0)
            ).map_err(|e| DatabaseError::new("SQLITE_ERROR", &format!("Failed to get schema for {}: {}", table_name, e)))?;
            
            // Drop and recreate table in destination
            let _ = dest_guard.execute(&format!("DROP TABLE IF EXISTS {}", table_name)).await;
            dest_guard.execute(&create_sql).await?;
            
            // Get all data from source table
            let mut data_stmt = source_conn.prepare(&format!("SELECT * FROM {}", table_name))
                .map_err(|e| DatabaseError::new("SQLITE_ERROR", &format!("Failed to select from {}: {}", table_name, e)))?;
            
            let column_count = data_stmt.column_count();
            let mut rows = data_stmt.query([])
                .map_err(|e| DatabaseError::new("SQLITE_ERROR", &format!("Failed to query {}: {}", table_name, e)))?;
            
            // Begin transaction for bulk insert
            dest_guard.execute("BEGIN TRANSACTION").await?;
            
            let mut row_count = 0;
            while let Some(row) = rows.next()
                .map_err(|e| DatabaseError::new("SQLITE_ERROR", &format!("Failed to fetch row from {}: {}", table_name, e)))? {
                
                // Build INSERT VALUES string
                let mut values = Vec::new();
                for i in 0..column_count {
                    let value_str = match row.get_ref(i)
                        .map_err(|e| DatabaseError::new("SQLITE_ERROR", &format!("Failed to get column {}: {}", i, e)))? {
                        absurder_sql::rusqlite::types::ValueRef::Null => "NULL".to_string(),
                        absurder_sql::rusqlite::types::ValueRef::Integer(n) => n.to_string(),
                        absurder_sql::rusqlite::types::ValueRef::Real(r) => r.to_string(),
                        absurder_sql::rusqlite::types::ValueRef::Text(t) => {
                            let s = String::from_utf8_lossy(t);
                            let escaped = s.replace("'", "''");
                            format!("'{}'", escaped)
                        }
                        absurder_sql::rusqlite::types::ValueRef::Blob(b) => {
                            // Encode blob as hex string using SQLite's X'...' syntax
                            let hex: String = b.iter()
                                .map(|byte| format!("{:02X}", byte))
                                .collect();
                            format!("X'{}'", hex)
                        }
                    };
                    values.push(value_str);
                }
                
                dest_guard.execute(&format!("INSERT INTO {} VALUES ({})", table_name, values.join(", "))).await?;
                row_count += 1;
            }
            
            // Commit transaction
            dest_guard.execute("COMMIT").await?;
            
            log::info!("Successfully imported table: {} ({} rows)", table_name, row_count);
        }
        
        Ok::<(), DatabaseError>(())
    });
    match result {
        Ok(_) => {
            log::info!("Import successful");
            0
        },
        Err(e) => {
            let error_msg = format!("Import failed: {:?}", e);
            log::error!("{}", error_msg);
            set_last_error(error_msg);
            -1
        }
    }
}
