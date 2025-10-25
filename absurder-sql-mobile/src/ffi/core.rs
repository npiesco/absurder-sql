//! Core FFI functions
//!
//! Basic database operations: create, execute, close, error handling

use std::ffi::{CStr, CString, c_char};
use std::sync::Arc;
use parking_lot::Mutex;
use absurder_sql::{SqliteIndexedDB, DatabaseConfig};

use crate::registry::{
    DB_REGISTRY, HANDLE_COUNTER, RUNTIME,
    set_last_error, clear_last_error,
};

/// Create a new database and return a handle
/// 
/// # Safety
/// - name must be a valid null-terminated UTF-8 C string or null
/// - Returns 0 on error
#[unsafe(no_mangle)]
pub unsafe extern "C" fn absurder_db_new(name: *const c_char) -> u64 {
    clear_last_error();
    
    // Validate name pointer
    if name.is_null() {
        let err = "Database name cannot be null".to_string();
        log::error!("absurder_db_new: {}", err);
        set_last_error(err);
        return 0;
    }

    // Convert C string to Rust String
    let name_str = match unsafe { CStr::from_ptr(name) }.to_str() {
        Ok(s) => s,
        Err(e) => {
            let err = format!("Invalid UTF-8 in database name: {}", e);
            log::error!("absurder_db_new: {}", err);
            set_last_error(err);
            return 0;
        }
    };

    // Create database config
    let config = DatabaseConfig {
        name: name_str.to_string(),
        ..Default::default()
    };

    // Create database using blocking on Tokio runtime
    let db_result = RUNTIME.block_on(async {
        SqliteIndexedDB::new(config).await
    });

    let db = match db_result {
        Ok(db) => db,
        Err(e) => {
            log::error!("absurder_db_new: failed to create database: {:?}", e);
            return 0;
        }
    };

    // Generate unique handle
    let mut counter = HANDLE_COUNTER.lock();
    let handle = *counter;
    *counter += 1;
    drop(counter);

    // Store in registry (wrapped in Arc<Mutex> for thread-safety and interior mutability)
    let mut registry = DB_REGISTRY.lock();
    registry.insert(handle, Arc::new(Mutex::new(db)));
    drop(registry);

    log::info!("absurder_db_new: created database '{}' with handle {}", name_str, handle);
    handle
}

/// Execute SQL and return JSON result
/// 
/// # Safety
/// - handle must be a valid database handle
/// - sql must be a valid null-terminated UTF-8 C string or null
/// - Caller must free the returned string with absurder_free_string
/// - Returns null on error
#[unsafe(no_mangle)]
pub unsafe extern "C" fn absurder_db_execute(
    handle: u64,
    sql: *const c_char,
) -> *mut c_char {
    clear_last_error();
    
    // Validate handle
    if handle == 0 {
        let err = "Invalid database handle".to_string();
        log::error!("absurder_db_execute: {}", err);
        set_last_error(err);
        return std::ptr::null_mut();
    }

    // Validate SQL pointer
    if sql.is_null() {
        let err = "SQL string cannot be null".to_string();
        log::error!("absurder_db_execute: {}", err);
        set_last_error(err);
        return std::ptr::null_mut();
    }

    // Convert C string to Rust String
    let sql_str = match unsafe { CStr::from_ptr(sql) }.to_str() {
        Ok(s) => s,
        Err(e) => {
            let err = format!("Invalid UTF-8 in SQL: {}", e);
            log::error!("absurder_db_execute: {}", err);
            set_last_error(err);
            return std::ptr::null_mut();
        }
    };

    // Get database from registry (Arc::clone is cheap)
    let db = {
        let registry = DB_REGISTRY.lock();
        match registry.get(&handle) {
            Some(db) => Arc::clone(db),
            None => {
                let err = format!("Database handle {} not found", handle);
                log::error!("absurder_db_execute: {}", err);
                set_last_error(err);
                return std::ptr::null_mut();
            }
        }
    };

    // Execute SQL (lock the inner Mutex to get &mut access)
    let result = RUNTIME.block_on(async {
        let mut db_guard = db.lock();
        db_guard.execute(sql_str).await
    });

    let query_result = match result {
        Ok(r) => r,
        Err(e) => {
            let err = format!("SQL execution failed: {:?}", e);
            log::error!("absurder_db_execute: {}", err);
            eprintln!("absurder_db_execute: {}", err);
            set_last_error(err);
            return std::ptr::null_mut();
        }
    };

    // Serialize to JSON
    let json = match serde_json::to_string(&query_result) {
        Ok(j) => j,
        Err(e) => {
            log::error!("absurder_db_execute: JSON serialization failed: {}", e);
            return std::ptr::null_mut();
        }
    };

    // Convert to C string
    match CString::new(json) {
        Ok(c_str) => c_str.into_raw(),
        Err(e) => {
            log::error!("absurder_db_execute: CString conversion failed: {}", e);
            std::ptr::null_mut()
        }
    }
}

/// Close database and remove from registry
/// 
/// # Safety
/// - handle can be any u64 value (safe to call with invalid handle)
#[unsafe(no_mangle)]
pub unsafe extern "C" fn absurder_db_close(handle: u64) {
    if handle == 0 {
        return;
    }

    let mut registry = DB_REGISTRY.lock();
    if let Some(_) = registry.remove(&handle) {
        log::info!("absurder_db_close: closed database with handle {}", handle);
    }
}

/// Free a string returned by FFI functions
/// 
/// # Safety
/// - s must be a string previously returned by an FFI function or null
#[unsafe(no_mangle)]
pub unsafe extern "C" fn absurder_free_string(s: *mut c_char) {
    if !s.is_null() {
        unsafe {
            drop(CString::from_raw(s));
        }
    }
}

/// Get the last error message for the current thread
/// 
/// # Safety
/// - Returns a pointer to a static string that should NOT be freed
/// - Returns null if there is no error
/// - The pointer is valid until the next error occurs on this thread
/// 
/// # Thread Safety
/// Each thread has its own error message, so this is thread-safe
#[unsafe(no_mangle)]
pub unsafe extern "C" fn absurder_get_error() -> *const c_char {
    match crate::registry::get_last_error_internal() {
        Some(err_msg) => {
            // Create a CString and leak it to get a stable pointer
            // This is safe because we'll replace it on the next error
            match CString::new(err_msg.as_str()) {
                Ok(c_str) => c_str.into_raw() as *const c_char,
                Err(_) => std::ptr::null(),
            }
        }
        None => std::ptr::null(),
    }
}

/// Execute SQL with parameterized query support
/// 
/// # Safety
/// - handle must be a valid database handle
/// - sql must be a valid null-terminated UTF-8 C string or null
/// - params_json must be a valid null-terminated JSON array string or null
/// - Caller must free the returned string with absurder_free_string
/// - Returns null on error
/// 
/// # Parameters Format
/// params_json should be a JSON array of values, e.g.:
/// `[{"type": "Integer", "value": 42}, {"type": "Text", "value": "hello"}]`
/// 
/// # SQL Injection Prevention
/// This function uses parameterized queries which automatically escape values
/// and prevent SQL injection attacks. Never concatenate user input into SQL strings.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn absurder_db_execute_with_params(
    handle: u64,
    sql: *const c_char,
    params_json: *const c_char,
) -> *mut c_char {
    use absurder_sql::types::ColumnValue;

    // Validate handle
    if handle == 0 {
        log::error!("absurder_db_execute_with_params: invalid handle 0");
        return std::ptr::null_mut();
    }

    // Validate SQL pointer
    if sql.is_null() {
        log::error!("absurder_db_execute_with_params: null SQL pointer");
        return std::ptr::null_mut();
    }

    // Validate params pointer
    if params_json.is_null() {
        log::error!("absurder_db_execute_with_params: null params_json pointer");
        return std::ptr::null_mut();
    }

    // Convert SQL C string to Rust String
    let sql_str = match unsafe { CStr::from_ptr(sql) }.to_str() {
        Ok(s) => s,
        Err(e) => {
            log::error!("absurder_db_execute_with_params: invalid UTF-8 in SQL: {}", e);
            return std::ptr::null_mut();
        }
    };

    // Convert params C string to Rust String
    let params_str = match unsafe { CStr::from_ptr(params_json) }.to_str() {
        Ok(s) => s,
        Err(e) => {
            log::error!("absurder_db_execute_with_params: invalid UTF-8 in params: {}", e);
            return std::ptr::null_mut();
        }
    };

    // Deserialize params from JSON
    let params: Vec<ColumnValue> = match serde_json::from_str(params_str) {
        Ok(p) => p,
        Err(e) => {
            log::error!("absurder_db_execute_with_params: failed to parse params JSON: {}", e);
            return std::ptr::null_mut();
        }
    };

    // Get database from registry
    let db = {
        let registry = DB_REGISTRY.lock();
        match registry.get(&handle) {
            Some(db) => Arc::clone(db),
            None => {
                log::error!("absurder_db_execute_with_params: handle {} not found", handle);
                return std::ptr::null_mut();
            }
        }
    };

    // Execute SQL with parameters
    let result = RUNTIME.block_on(async {
        let mut db_guard = db.lock();
        db_guard.execute_with_params(sql_str, &params).await
    });

    let query_result = match result {
        Ok(r) => r,
        Err(e) => {
            log::error!("absurder_db_execute_with_params: SQL execution failed: {:?}", e);
            return std::ptr::null_mut();
        }
    };

    // Serialize to JSON
    let json = match serde_json::to_string(&query_result) {
        Ok(j) => j,
        Err(e) => {
            log::error!("absurder_db_execute_with_params: JSON serialization failed: {}", e);
            return std::ptr::null_mut();
        }
    };

    // Convert to C string
    match CString::new(json) {
        Ok(c_str) => c_str.into_raw(),
        Err(e) => {
            log::error!("absurder_db_execute_with_params: CString conversion failed: {}", e);
            std::ptr::null_mut()
        }
    }
}
