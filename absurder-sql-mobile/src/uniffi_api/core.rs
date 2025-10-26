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
            // Generate handle
            let handle = HANDLE_COUNTER.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
            
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
