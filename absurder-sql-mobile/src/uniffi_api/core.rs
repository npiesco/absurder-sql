/// UniFFI core database operations
/// 
/// These functions are automatically exported to TypeScript, Swift, and Kotlin
/// using the #[uniffi::export] macro.

use super::types::{DatabaseConfig, DatabaseError, QueryResult};
use crate::registry::{DB_REGISTRY, HANDLE_COUNTER, RUNTIME};
use absurder_sql::{SqliteIndexedDB, DatabaseConfig as CoreDatabaseConfig, ColumnValue};
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
    
    // Convert string params to ColumnValue
    let column_params: Vec<ColumnValue> = params.into_iter()
        .map(|s| ColumnValue::Text(s))
        .collect();
    
    // Execute parameterized query using async runtime
    let result = RUNTIME.block_on(async {
        let mut db = db_arc.lock();
        db.execute_with_params(&sql, &column_params).await
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

/// Get the UniFFI version being used
/// 
/// This is a simple test function to verify UniFFI is working
#[uniffi::export]
pub fn get_uniffi_version() -> String {
    "0.29".to_string()
}
