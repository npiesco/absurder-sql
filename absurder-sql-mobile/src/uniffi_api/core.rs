/// UniFFI core database operations
/// 
/// These functions are automatically exported to TypeScript, Swift, and Kotlin
/// using the #[uniffi::export] macro.

use super::types::{DatabaseConfig, DatabaseError, QueryResult};
use crate::registry::{DB_REGISTRY, HANDLE_COUNTER, RUNTIME};
use absurder_sql::{SqliteIndexedDB, DatabaseConfig as CoreDatabaseConfig};
use std::sync::Arc;
use parking_lot::Mutex;

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
#[uniffi::export]
pub fn create_database(config: DatabaseConfig) -> Result<u64, DatabaseError> {
    log::info!("UniFFI: Creating database: {}", config.name);
    
    // Create core database config
    let core_config = CoreDatabaseConfig {
        name: config.name.clone(),
        ..Default::default()
    };
    
    // Create database using async runtime
    let db_result = RUNTIME.block_on(async {
        SqliteIndexedDB::new(core_config).await
    });
    
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
            // Convert to QueryResult
            let rows_json: Vec<String> = query_result.rows.iter()
                .map(|row| serde_json::to_string(row).unwrap_or_default())
                .collect();
            
            Ok(QueryResult {
                columns: query_result.columns,
                rows: rows_json,
                rows_affected: query_result.affected_rows as u64,
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

/// Get the UniFFI version being used
/// 
/// This is a simple test function to verify UniFFI is working
#[uniffi::export]
pub fn get_uniffi_version() -> String {
    "0.29".to_string()
}
