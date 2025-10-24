//! Transaction FFI functions
//!
//! Transaction management and batch execution operations

use std::ffi::{CStr, c_char};
use std::sync::Arc;

use crate::registry::{
    DB_REGISTRY, RUNTIME,
    set_last_error, clear_last_error,
};

/// Begin a database transaction
/// 
/// # Safety
/// - handle must be a valid database handle
/// 
/// # Returns
/// - 0 on success
/// - -1 on error (invalid handle or SQL execution failure)
#[unsafe(no_mangle)]
pub unsafe extern "C" fn absurder_db_begin_transaction(handle: u64) -> i32 {
    if handle == 0 {
        log::error!("absurder_db_begin_transaction: invalid handle 0");
        return -1;
    }

    // Get database from registry
    let db = {
        let registry = DB_REGISTRY.lock();
        match registry.get(&handle) {
            Some(db) => Arc::clone(db),
            None => {
                log::error!("absurder_db_begin_transaction: handle {} not found", handle);
                return -1;
            }
        }
    };

    // Execute BEGIN TRANSACTION
    let result = RUNTIME.block_on(async {
        let mut db_guard = db.lock();
        db_guard.execute("BEGIN TRANSACTION").await
    });

    match result {
        Ok(_) => {
            log::info!("absurder_db_begin_transaction: started transaction for handle {}", handle);
            0
        }
        Err(e) => {
            log::error!("absurder_db_begin_transaction: failed to begin transaction: {:?}", e);
            -1
        }
    }
}

/// Commit the current transaction
/// 
/// # Safety
/// - handle must be a valid database handle
/// 
/// # Returns
/// - 0 on success
/// - -1 on error (invalid handle or SQL execution failure)
#[unsafe(no_mangle)]
pub unsafe extern "C" fn absurder_db_commit(handle: u64) -> i32 {
    if handle == 0 {
        log::error!("absurder_db_commit: invalid handle 0");
        return -1;
    }

    // Get database from registry
    let db = {
        let registry = DB_REGISTRY.lock();
        match registry.get(&handle) {
            Some(db) => Arc::clone(db),
            None => {
                log::error!("absurder_db_commit: handle {} not found", handle);
                return -1;
            }
        }
    };

    // Execute COMMIT
    let result = RUNTIME.block_on(async {
        let mut db_guard = db.lock();
        db_guard.execute("COMMIT").await
    });

    match result {
        Ok(_) => {
            log::info!("absurder_db_commit: committed transaction for handle {}", handle);
            0
        }
        Err(e) => {
            log::error!("absurder_db_commit: failed to commit transaction: {:?}", e);
            -1
        }
    }
}

/// Rollback the current transaction
/// 
/// # Safety
/// - handle must be a valid database handle
/// 
/// # Returns
/// - 0 on success
/// - -1 on error (invalid handle or SQL execution failure)
#[unsafe(no_mangle)]
pub unsafe extern "C" fn absurder_db_rollback(handle: u64) -> i32 {
    if handle == 0 {
        log::error!("absurder_db_rollback: invalid handle 0");
        return -1;
    }

    // Get database from registry
    let db = {
        let registry = DB_REGISTRY.lock();
        match registry.get(&handle) {
            Some(db) => Arc::clone(db),
            None => {
                log::error!("absurder_db_rollback: handle {} not found", handle);
                return -1;
            }
        }
    };

    // Execute ROLLBACK
    let result = RUNTIME.block_on(async {
        let mut db_guard = db.lock();
        db_guard.execute("ROLLBACK").await
    });

    match result {
        Ok(_) => {
            log::info!("absurder_db_rollback: rolled back transaction for handle {}", handle);
            0
        }
        Err(e) => {
            log::error!("absurder_db_rollback: failed to rollback transaction: {:?}", e);
            -1
        }
    }
}

/// Execute multiple SQL statements as a batch
/// Reduces bridge overhead from N calls to 1 call
/// 
/// # Safety
/// - handle must be a valid database handle
/// - statements_json must be a valid null-terminated UTF-8 JSON array string
/// 
/// # Parameters
/// statements_json should be a JSON array of SQL strings, e.g.:
/// `["INSERT INTO users VALUES (1, 'Alice')", "INSERT INTO users VALUES (2, 'Bob')"]`
/// 
/// # Returns
/// - 0 on success
/// - -1 on error
#[unsafe(no_mangle)]
pub unsafe extern "C" fn absurder_db_execute_batch(
    handle: u64,
    statements_json: *const c_char,
) -> i32 {
    clear_last_error();
    
    // Validate handle
    if handle == 0 {
        let err = "Invalid database handle".to_string();
        log::error!("absurder_db_execute_batch: {}", err);
        set_last_error(err);
        return -1;
    }

    // Validate statements_json pointer
    if statements_json.is_null() {
        let err = "Statements JSON cannot be null".to_string();
        log::error!("absurder_db_execute_batch: {}", err);
        set_last_error(err);
        return -1;
    }

    // Convert C string to Rust String
    let statements_str = match unsafe { CStr::from_ptr(statements_json) }.to_str() {
        Ok(s) => s,
        Err(e) => {
            let err = format!("Invalid UTF-8 in statements JSON: {}", e);
            log::error!("absurder_db_execute_batch: {}", err);
            set_last_error(err);
            return -1;
        }
    };

    // Deserialize JSON array of statements
    let statements: Vec<String> = match serde_json::from_str(statements_str) {
        Ok(s) => s,
        Err(e) => {
            let err = format!("Failed to parse statements JSON: {}", e);
            log::error!("absurder_db_execute_batch: {}", err);
            set_last_error(err);
            return -1;
        }
    };

    log::info!("absurder_db_execute_batch: executing batch of {} statements", statements.len());

    // Get database from registry
    let db = {
        let registry = DB_REGISTRY.lock();
        match registry.get(&handle) {
            Some(db) => Arc::clone(db),
            None => {
                let err = format!("Database handle {} not found", handle);
                log::error!("absurder_db_execute_batch: {}", err);
                set_last_error(err);
                return -1;
            }
        }
    };

    // Execute batch
    let result = RUNTIME.block_on(async {
        let mut db_guard = db.lock();
        db_guard.execute_batch(&statements).await
    });

    match result {
        Ok(_) => {
            log::info!("absurder_db_execute_batch: successfully executed batch of {} statements", statements.len());
            0
        }
        Err(e) => {
            let err = format!("Batch execution failed: {:?}", e);
            log::error!("absurder_db_execute_batch: {}", err);
            set_last_error(err);
            -1
        }
    }
}
