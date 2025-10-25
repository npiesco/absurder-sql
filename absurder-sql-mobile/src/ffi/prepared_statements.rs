//! Prepared statements FFI functions
//!
//! Prepared statement management for parameterized queries

use std::ffi::{CStr, CString, c_char};
use std::sync::Arc;
use absurder_sql::DatabaseError;

use crate::registry::{
    DB_REGISTRY, STMT_REGISTRY, STMT_HANDLE_COUNTER, RUNTIME,
    PreparedStatementWrapper,
    set_last_error, clear_last_error,
};

/// Prepare a SQL statement for repeated execution
/// 
/// # Safety
/// - db_handle must be a valid database handle
/// - sql must be a valid null-terminated UTF-8 C string or null
/// - Returns 0 on error
/// - Caller must eventually call absurder_stmt_finalize to clean up
#[unsafe(no_mangle)]
pub unsafe extern "C" fn absurder_db_prepare(
    db_handle: u64,
    sql: *const c_char,
) -> u64 {
    clear_last_error();
    
    // Validate db_handle
    if db_handle == 0 {
        let err = "Invalid database handle".to_string();
        log::error!("absurder_db_prepare: {}", err);
        set_last_error(err);
        return 0;
    }

    // Validate SQL pointer
    if sql.is_null() {
        let err = "SQL string cannot be null".to_string();
        log::error!("absurder_db_prepare: {}", err);
        set_last_error(err);
        return 0;
    }

    // Convert C string to Rust String
    let sql_str = match unsafe { CStr::from_ptr(sql) }.to_str() {
        Ok(s) => s,
        Err(e) => {
            let err = format!("Invalid UTF-8 in SQL: {}", e);
            log::error!("absurder_db_prepare: {}", err);
            set_last_error(err);
            return 0;
        }
    };

    // Get database from registry
    let db = {
        let registry = DB_REGISTRY.lock();
        match registry.get(&db_handle) {
            Some(db) => Arc::clone(db),
            None => {
                let err = format!("Database handle {} not found", db_handle);
                log::error!("absurder_db_prepare: {}", err);
                set_last_error(err);
                return 0;
            }
        }
    };

    // Validate SQL by attempting to prepare it
    // This ensures the SQL is valid before we store it
    {
        let mut db_guard = db.lock();
        match db_guard.prepare(sql_str) {
            Ok(stmt) => {
                // SQL is valid, finalize the test statement
                let _ = stmt.finalize();
            }
            Err(e) => {
                let err = format!("Failed to prepare statement: {:?}", e);
                log::error!("absurder_db_prepare: {}", err);
                set_last_error(err);
                return 0;
            }
        }
    }

    // Generate unique statement handle
    let mut counter = STMT_HANDLE_COUNTER.lock();
    let stmt_handle = *counter;
    *counter += 1;
    drop(counter);

    // Store SQL and database handle for on-demand preparation
    let wrapper = PreparedStatementWrapper {
        db_handle,
        sql: sql_str.to_string(),
    };

    let mut stmt_registry = STMT_REGISTRY.lock();
    stmt_registry.insert(stmt_handle, wrapper);
    drop(stmt_registry);

    log::info!("absurder_db_prepare: created statement handle {} for SQL: {}", stmt_handle, sql_str);
    stmt_handle
}

/// Execute a prepared statement with parameters
/// 
/// # Safety
/// - stmt_handle must be a valid statement handle from absurder_db_prepare
/// - params_json must be a valid null-terminated UTF-8 JSON array string
/// - Caller must free the returned string with absurder_free_string
/// - Returns null on error
/// 
/// # Parameters Format
/// params_json should be a JSON array of ColumnValue objects, e.g.:
/// `[{"Integer": 1}, {"Text": "hello"}]`
#[unsafe(no_mangle)]
pub unsafe extern "C" fn absurder_stmt_execute(
    stmt_handle: u64,
    params_json: *const c_char,
) -> *mut c_char {
    use absurder_sql::types::ColumnValue;
    
    clear_last_error();
    
    // Validate stmt_handle
    if stmt_handle == 0 {
        let err = "Invalid statement handle".to_string();
        log::error!("absurder_stmt_execute: {}", err);
        set_last_error(err);
        return std::ptr::null_mut();
    }

    // Validate params_json pointer
    if params_json.is_null() {
        let err = "Parameters JSON cannot be null".to_string();
        log::error!("absurder_stmt_execute: {}", err);
        set_last_error(err);
        return std::ptr::null_mut();
    }

    // Convert C string to Rust String
    let params_str = match unsafe { CStr::from_ptr(params_json) }.to_str() {
        Ok(s) => s,
        Err(e) => {
            let err = format!("Invalid UTF-8 in parameters JSON: {}", e);
            log::error!("absurder_stmt_execute: {}", err);
            set_last_error(err);
            return std::ptr::null_mut();
        }
    };

    // Deserialize params from JSON
    let params: Vec<ColumnValue> = match serde_json::from_str(params_str) {
        Ok(p) => p,
        Err(e) => {
            let err = format!("Failed to parse parameters JSON: {}", e);
            log::error!("absurder_stmt_execute: {}", err);
            set_last_error(err);
            return std::ptr::null_mut();
        }
    };

    // Get SQL and database handle from statement registry
    let (db_handle, sql) = {
        let stmt_registry = STMT_REGISTRY.lock();
        match stmt_registry.get(&stmt_handle) {
            Some(wrapper) => (wrapper.db_handle, wrapper.sql.clone()),
            None => {
                drop(stmt_registry);
                let err = format!("Statement handle {} not found", stmt_handle);
                log::error!("absurder_stmt_execute: {}", err);
                set_last_error(err);
                return std::ptr::null_mut();
            }
        }
    };

    // Get database from registry
    let db = {
        let registry = DB_REGISTRY.lock();
        match registry.get(&db_handle) {
            Some(db) => Arc::clone(db),
            None => {
                let err = format!("Database handle {} not found", db_handle);
                log::error!("absurder_stmt_execute: {}", err);
                set_last_error(err);
                return std::ptr::null_mut();
            }
        }
    };

    // Prepare and execute statement
    let result = RUNTIME.block_on(async {
        let mut db_guard = db.lock();
        let mut stmt = db_guard.prepare(&sql).map_err(|e| DatabaseError::from(e))?;
        let result = stmt.execute(&params).await;
        let _ = stmt.finalize(); // Clean up
        result
    });

    let query_result = match result {
        Ok(r) => r,
        Err(e) => {
            let err = format!("Statement execution failed: {:?}", e);
            log::error!("absurder_stmt_execute: {}", err);
            set_last_error(err);
            return std::ptr::null_mut();
        }
    };

    // Serialize to JSON
    let json = match serde_json::to_string(&query_result) {
        Ok(j) => j,
        Err(e) => {
            log::error!("absurder_stmt_execute: JSON serialization failed: {}", e);
            return std::ptr::null_mut();
        }
    };

    // Convert to C string
    match CString::new(json) {
        Ok(c_str) => c_str.into_raw(),
        Err(e) => {
            log::error!("absurder_stmt_execute: CString conversion failed: {}", e);
            std::ptr::null_mut()
        }
    }
}

/// Finalize a prepared statement and free its resources
/// 
/// # Safety
/// - stmt_handle can be any u64 value
/// - Returns 0 on success, -1 on error
/// - After calling this, stmt_handle is invalid
#[unsafe(no_mangle)]
pub unsafe extern "C" fn absurder_stmt_finalize(stmt_handle: u64) -> i32 {
    clear_last_error();
    
    if stmt_handle == 0 {
        let err = "Invalid statement handle".to_string();
        log::error!("absurder_stmt_finalize: {}", err);
        set_last_error(err);
        return -1;
    }

    let mut stmt_registry = STMT_REGISTRY.lock();
    match stmt_registry.remove(&stmt_handle) {
        Some(_wrapper) => {
            // Statement wrapper removed, resources freed
            log::info!("absurder_stmt_finalize: finalized statement {}", stmt_handle);
            0
        }
        None => {
            let err = format!("Statement handle {} not found", stmt_handle);
            log::error!("absurder_stmt_finalize: {}", err);
            set_last_error(err);
            -1
        }
    }
}
