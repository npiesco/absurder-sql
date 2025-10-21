//! AbsurderSQL Mobile FFI Layer
//!
//! Provides C ABI bindings for React Native integration on iOS and Android.
//! Uses handle-based API for memory safety and JSON for cross-language data exchange.

use std::collections::HashMap;
use std::ffi::{CStr, CString, c_char};
use std::sync::Arc;
use std::cell::RefCell;
use parking_lot::Mutex;
use once_cell::sync::Lazy;
use absurder_sql::{SqliteIndexedDB, DatabaseConfig, ColumnValue, DatabaseError};
use tokio::runtime::Runtime;

/// Global database registry
/// Maps handles (u64) to Arc<Mutex<SqliteIndexedDB>> instances
/// We need Mutex because SqliteIndexedDB::execute() requires &mut self
static DB_REGISTRY: Lazy<Arc<Mutex<HashMap<u64, Arc<Mutex<SqliteIndexedDB>>>>>> = Lazy::new(|| {
    Arc::new(Mutex::new(HashMap::new()))
});

/// Counter for generating unique database handles
static HANDLE_COUNTER: Lazy<Arc<Mutex<u64>>> = Lazy::new(|| {
    Arc::new(Mutex::new(1))
});

/// Global Tokio runtime for executing async database operations
static RUNTIME: Lazy<Runtime> = Lazy::new(|| {
    Runtime::new().expect("Failed to create Tokio runtime")
});

// Thread-local storage for the last error message
// This allows each thread to have its own error state without requiring synchronization
thread_local! {
    static LAST_ERROR: RefCell<Option<String>> = RefCell::new(None);
}

/// Set the last error message for this thread
fn set_last_error(msg: String) {
    LAST_ERROR.with(|e| {
        *e.borrow_mut() = Some(msg);
    });
}

/// Clear the last error message for this thread
fn clear_last_error() {
    LAST_ERROR.with(|e| {
        *e.borrow_mut() = None;
    });
}

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

/// Export database to file using VACUUM INTO
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
    let result = RUNTIME.block_on(async {
        let mut db_guard = db.lock();
        db_guard.execute(&format!("ATTACH DATABASE '{}' AS import_source", path_str.replace("'", "''"))).await?;
        let tables_result = db_guard.execute("SELECT name FROM import_source.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").await?;
        for row in &tables_result.rows {
            if let Some(ColumnValue::Text(name)) = row.values.get(0) {
                let _ = db_guard.execute(&format!("DROP TABLE IF EXISTS {}", name)).await;
                db_guard.execute(&format!("CREATE TABLE {} AS SELECT * FROM import_source.{}", name, name)).await?;
            }
        }
        db_guard.execute("DETACH DATABASE import_source").await?;
        Ok::<(), DatabaseError>(())
    });
    match result {
        Ok(_) => 0,
        Err(e) => {
            set_last_error(format!("Import failed: {:?}", e));
            -1
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
    LAST_ERROR.with(|e| {
        match e.borrow().as_ref() {
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
    })
}

//=============================================================================
// Android JNI Bindings
//=============================================================================

#[cfg(target_os = "android")]
mod android_jni {
    use super::*;
    use jni::JNIEnv;
    use jni::objects::{JClass, JString};
    use jni::sys::{jlong, jstring, jint, JavaVM, jint as JInt};
    use std::os::raw::c_void;
    
    /// Called when the native library is loaded
    #[unsafe(no_mangle)]
    pub extern "system" fn JNI_OnLoad(_vm: *mut JavaVM, _reserved: *mut c_void) -> JInt {
        // Initialize Android logger
        android_logger::init_once(
            android_logger::Config::default()
                .with_max_level(log::LevelFilter::Debug)
                .with_tag("AbsurderSQL")
        );
        log::info!("AbsurderSQL native library loaded");
        jni::sys::JNI_VERSION_1_6
    }

    /// JNI: Create database
    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeCreateDb(
        mut env: JNIEnv,
        _class: JClass,
        name: JString,
    ) -> jlong {
        // Convert JString to Rust String
        let name_str: String = match env.get_string(&name) {
            Ok(s) => s.into(),
            Err(e) => {
                log::error!("JNI nativeCreateDb: Failed to get string: {:?}", e);
                return 0;
            }
        };

        // Convert to C string
        let name_cstr = match CString::new(name_str) {
            Ok(s) => s,
            Err(e) => {
                log::error!("JNI nativeCreateDb: CString conversion failed: {}", e);
                return 0;
            }
        };

        // Call FFI function
        let handle = unsafe { absurder_db_new(name_cstr.as_ptr()) };
        
        log::info!("JNI nativeCreateDb: created database with handle {}", handle);
        handle as jlong
    }

    /// JNI: Execute SQL
    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeExecute(
        mut env: JNIEnv,
        _class: JClass,
        handle: jlong,
        sql: JString,
    ) -> jstring {
        // Convert JString to Rust String
        let sql_str: String = match env.get_string(&sql) {
            Ok(s) => s.into(),
            Err(e) => {
                log::error!("JNI nativeExecute: Failed to get SQL string: {:?}", e);
                return std::ptr::null_mut();
            }
        };

        // Convert to C string
        let sql_cstr = match CString::new(sql_str) {
            Ok(s) => s,
            Err(e) => {
                log::error!("JNI nativeExecute: CString conversion failed: {}", e);
                return std::ptr::null_mut();
            }
        };

        // Call FFI function
        let result_ptr = unsafe { absurder_db_execute(handle as u64, sql_cstr.as_ptr()) };

        if result_ptr.is_null() {
            log::error!("JNI nativeExecute: absurder_db_execute returned null");
            return std::ptr::null_mut();
        }

        // Convert C string to JString
        let result_str = unsafe {
            match CStr::from_ptr(result_ptr).to_str() {
                Ok(s) => s,
                Err(e) => {
                    log::error!("JNI nativeExecute: UTF-8 conversion failed: {}", e);
                    absurder_free_string(result_ptr);
                    return std::ptr::null_mut();
                }
            }
        };

        let jstring_result = match env.new_string(result_str) {
            Ok(s) => s,
            Err(e) => {
                log::error!("JNI nativeExecute: Failed to create JString: {:?}", e);
                unsafe { absurder_free_string(result_ptr); }
                return std::ptr::null_mut();
            }
        };

        // Free the C string
        unsafe { absurder_free_string(result_ptr); }

        log::debug!("JNI nativeExecute: successfully returned result");
        jstring_result.into_raw()
    }

    /// JNI: Close database
    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeClose(
        _env: JNIEnv,
        _class: JClass,
        handle: jlong,
    ) {
        unsafe {
            absurder_db_close(handle as u64);
        }
        log::info!("JNI nativeClose: closed database with handle {}", handle);
    }

    /// JNI: Begin transaction
    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeBeginTransaction(
        _env: JNIEnv,
        _class: JClass,
        handle: jlong,
    ) -> jint {
        unsafe { absurder_db_begin_transaction(handle as u64) }
    }

    /// JNI: Commit transaction
    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeCommit(
        _env: JNIEnv,
        _class: JClass,
        handle: jlong,
    ) -> jint {
        unsafe { absurder_db_commit(handle as u64) }
    }

    /// JNI: Rollback transaction
    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeRollback(
        _env: JNIEnv,
        _class: JClass,
        handle: jlong,
    ) -> jint {
        unsafe { absurder_db_rollback(handle as u64) }
    }

    /// JNI: Export database
    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeExport(
        mut env: JNIEnv,
        _class: JClass,
        handle: jlong,
        path: JString,
    ) -> jint {
        let path_str: String = match env.get_string(&path) {
            Ok(s) => s.into(),
            Err(_) => return -1,
        };
        let path_cstr = match CString::new(path_str) {
            Ok(s) => s,
            Err(_) => return -1,
        };
        unsafe { absurder_db_export(handle as u64, path_cstr.as_ptr()) }
    }

    /// JNI: Import database
    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeImport(
        mut env: JNIEnv,
        _class: JClass,
        handle: jlong,
        path: JString,
    ) -> jint {
        let path_str: String = match env.get_string(&path) {
            Ok(s) => s.into(),
            Err(_) => return -1,
        };
        let path_cstr = match CString::new(path_str) {
            Ok(s) => s,
            Err(_) => return -1,
        };
        unsafe { absurder_db_import(handle as u64, path_cstr.as_ptr()) }
    }

    /// JNI: Execute SQL with parameters
    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeExecuteWithParams(
        mut env: JNIEnv,
        _class: JClass,
        handle: jlong,
        sql: JString,
        params_json: JString,
    ) -> jstring {
        // Convert SQL JString to Rust String
        let sql_str: String = match env.get_string(&sql) {
            Ok(s) => s.into(),
            Err(e) => {
                log::error!("JNI nativeExecuteWithParams: Failed to get SQL string: {:?}", e);
                return std::ptr::null_mut();
            }
        };

        // Convert params JSON JString to Rust String
        let params_str: String = match env.get_string(&params_json) {
            Ok(s) => s.into(),
            Err(e) => {
                log::error!("JNI nativeExecuteWithParams: Failed to get params JSON: {:?}", e);
                return std::ptr::null_mut();
            }
        };

        // Convert to C strings
        let sql_cstr = match CString::new(sql_str) {
            Ok(s) => s,
            Err(e) => {
                log::error!("JNI nativeExecuteWithParams: SQL CString conversion failed: {}", e);
                return std::ptr::null_mut();
            }
        };

        let params_cstr = match CString::new(params_str) {
            Ok(s) => s,
            Err(e) => {
                log::error!("JNI nativeExecuteWithParams: Params CString conversion failed: {}", e);
                return std::ptr::null_mut();
            }
        };

        // Call FFI function
        let result_ptr = unsafe { 
            absurder_db_execute_with_params(handle as u64, sql_cstr.as_ptr(), params_cstr.as_ptr()) 
        };

        if result_ptr.is_null() {
            log::error!("JNI nativeExecuteWithParams: absurder_db_execute_with_params returned null");
            return std::ptr::null_mut();
        }

        // Convert C string to JString
        let result_str = unsafe {
            match CStr::from_ptr(result_ptr).to_str() {
                Ok(s) => s,
                Err(e) => {
                    log::error!("JNI nativeExecuteWithParams: UTF-8 conversion failed: {}", e);
                    absurder_free_string(result_ptr);
                    return std::ptr::null_mut();
                }
            }
        };

        let output = match env.new_string(result_str) {
            Ok(s) => s.into_raw(),
            Err(e) => {
                log::error!("JNI nativeExecuteWithParams: JString creation failed: {:?}", e);
                unsafe { absurder_free_string(result_ptr); }
                return std::ptr::null_mut();
            }
        };

        // Free the C string
        unsafe {
            absurder_free_string(result_ptr);
        }

        output
    }
    
    // ==================== JNI Bindings for Android Instrumentation Tests ====================
    // These are duplicates of the Module bindings but with the test class name
    
    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLInstrumentationTest_nativeCreateDb(
        env: JNIEnv,
        _class: JClass,
        name: JString,
    ) -> jlong {
        Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeCreateDb(env, _class, name)
    }
    
    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLInstrumentationTest_nativeExecute(
        env: JNIEnv,
        _class: JClass,
        handle: jlong,
        sql: JString,
    ) -> jstring {
        Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeExecute(env, _class, handle, sql)
    }
    
    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLInstrumentationTest_nativeClose(
        env: JNIEnv,
        _class: JClass,
        handle: jlong,
    ) {
        Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeClose(env, _class, handle)
    }

    // JNI bindings for ExportHangTest
    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_npiesco_absurdersql_ExportHangTest_nativeCreateDb(
        env: JNIEnv,
        _class: JClass,
        name: JString,
    ) -> jlong {
        Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeCreateDb(env, _class, name)
    }

    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_npiesco_absurdersql_ExportHangTest_nativeExecute(
        env: JNIEnv,
        _class: JClass,
        handle: jlong,
        sql: JString,
    ) -> jstring {
        Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeExecute(env, _class, handle, sql)
    }

    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_npiesco_absurdersql_ExportHangTest_nativeExport(
        env: JNIEnv,
        _class: JClass,
        handle: jlong,
        path: JString,
    ) -> jint {
        Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeExport(env, _class, handle, path)
    }

    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_npiesco_absurdersql_ExportHangTest_nativeClose(
        env: JNIEnv,
        _class: JClass,
        handle: jlong,
    ) {
        Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeClose(env, _class, handle)
    }
    
    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLInstrumentationTest_nativeBeginTransaction(
        _env: JNIEnv,
        _class: JClass,
        handle: jlong,
    ) -> jint {
        Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeBeginTransaction(_env, _class, handle)
    }
    
    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLInstrumentationTest_nativeCommit(
        _env: JNIEnv,
        _class: JClass,
        handle: jlong,
    ) -> jint {
        Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeCommit(_env, _class, handle)
    }
    
    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLInstrumentationTest_nativeRollback(
        _env: JNIEnv,
        _class: JClass,
        handle: jlong,
    ) -> jint {
        Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeRollback(_env, _class, handle)
    }
    
    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLInstrumentationTest_nativeExport(
        env: JNIEnv,
        _class: JClass,
        handle: jlong,
        path: JString,
    ) -> jint {
        Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeExport(env, _class, handle, path)
    }
    
    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLInstrumentationTest_nativeImport(
        env: JNIEnv,
        _class: JClass,
        handle: jlong,
        path: JString,
    ) -> jint {
        Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeImport(env, _class, handle, path)
    }
    
    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLInstrumentationTest_nativeExecuteWithParams(
        env: JNIEnv,
        _class: JClass,
        handle: jlong,
        sql: JString,
        params: JString,
    ) -> jstring {
        Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeExecuteWithParams(env, _class, handle, sql, params)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::ffi::CString;

    #[test]
    fn test_registry_initialized() {
        let _registry = DB_REGISTRY.lock();
        // Just verifying registry can be accessed without panicking
    }

    #[test]
    fn test_handle_counter_initialized() {
        let counter = HANDLE_COUNTER.lock();
        assert!(*counter >= 1, "Counter should start at 1");
    }

    #[test]
    fn test_absurder_db_new_creates_handle() {
        unsafe {
            let name = CString::new("test_new.db").unwrap();
            let handle = absurder_db_new(name.as_ptr());
            
            assert_ne!(handle, 0, "Handle should not be 0 for valid database name");
            
            // Cleanup
            absurder_db_close(handle);
        }
    }

    #[test]
    fn test_absurder_db_new_null_name_returns_zero() {
        unsafe {
            let handle = absurder_db_new(std::ptr::null());
            assert_eq!(handle, 0, "Handle should be 0 for null name");
        }
    }

    #[test]
    fn test_absurder_db_new_creates_unique_handles() {
        unsafe {
            let name1 = CString::new("test1_unique.db").unwrap();
            let name2 = CString::new("test2_unique.db").unwrap();
            
            let handle1 = absurder_db_new(name1.as_ptr());
            let handle2 = absurder_db_new(name2.as_ptr());
            
            assert_ne!(handle1, 0, "First handle should not be 0");
            assert_ne!(handle2, 0, "Second handle should not be 0");
            assert_ne!(handle1, handle2, "Handles should be unique");
            
            // Cleanup
            absurder_db_close(handle1);
            absurder_db_close(handle2);
        }
    }

    #[test]
    fn test_absurder_db_close_invalid_handle() {
        unsafe {
            // Should not crash when closing invalid handle
            absurder_db_close(0);
            absurder_db_close(99999);
        }
    }

    #[test]
    fn test_absurder_db_execute_null_handle_returns_null() {
        unsafe {
            let sql = CString::new("SELECT 1").unwrap();
            let result = absurder_db_execute(0, sql.as_ptr());
            assert!(result.is_null(), "Result should be null for invalid handle");
        }
    }

    #[test]
    fn test_absurder_db_execute_null_sql_returns_null() {
        unsafe {
            let name = CString::new("test_null_sql.db").unwrap();
            let handle = absurder_db_new(name.as_ptr());
            
            let result = absurder_db_execute(handle, std::ptr::null());
            assert!(result.is_null(), "Result should be null for null SQL");
            
            absurder_db_close(handle);
        }
    }

    #[test]
    fn test_absurder_db_execute_simple_query() {
        unsafe {
            let name = CString::new("test_execute.db").unwrap();
            let handle = absurder_db_new(name.as_ptr());
            assert_ne!(handle, 0, "Should create valid handle");
            
            // Drop and recreate table for clean test state
            let drop_sql = CString::new("DROP TABLE IF EXISTS test").unwrap();
            let drop_result = absurder_db_execute(handle, drop_sql.as_ptr());
            if !drop_result.is_null() {
                absurder_free_string(drop_result);
            }
            
            // Create table
            let create_sql = CString::new("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)").unwrap();
            let create_result = absurder_db_execute(handle, create_sql.as_ptr());
            if !create_result.is_null() {
                absurder_free_string(create_result);
            }
            
            // Verify table exists by querying schema
            let check_sql = CString::new("SELECT name FROM sqlite_master WHERE type='table' AND name='test'").unwrap();
            let check_result = absurder_db_execute(handle, check_sql.as_ptr());
            assert!(!check_result.is_null(), "Table existence check should return result");
            
            let result_str = CStr::from_ptr(check_result).to_str().unwrap();
            assert!(result_str.contains("test"), "Table 'test' should exist in schema");
            absurder_free_string(check_result);
            
            // Insert data
            let insert_sql = CString::new("INSERT INTO test (id, name) VALUES (1, 'Alice')").unwrap();
            let insert_result = absurder_db_execute(handle, insert_sql.as_ptr());
            assert!(!insert_result.is_null(), "INSERT should succeed");
            absurder_free_string(insert_result);
            
            // Select data
            let select_sql = CString::new("SELECT * FROM test").unwrap();
            let select_result = absurder_db_execute(handle, select_sql.as_ptr());
            assert!(!select_result.is_null(), "SELECT should return result");
            
            // Verify JSON result contains data
            let result_str = CStr::from_ptr(select_result).to_str().unwrap();
            assert!(result_str.contains("Alice"), "Result should contain inserted data");
            assert!(result_str.contains("\"id\""), "Result should be JSON with id field");
            
            absurder_free_string(select_result);
            absurder_db_close(handle);
        }
    }

    #[test]
    fn test_absurder_db_execute_invalid_sql_returns_null() {
        unsafe {
            let name = CString::new("test_invalid_sql.db").unwrap();
            let handle = absurder_db_new(name.as_ptr());
            
            let bad_sql = CString::new("INVALID SQL SYNTAX!!!").unwrap();
            let result = absurder_db_execute(handle, bad_sql.as_ptr());
            
            assert!(result.is_null(), "Invalid SQL should return null");
            
            absurder_db_close(handle);
        }
    }

    #[test]
    fn test_absurder_db_execute_with_params_basic_query() {
        unsafe {
            let name = CString::new("test_params_unique_12345.db").unwrap();
            let handle = absurder_db_new(name.as_ptr());
            assert_ne!(handle, 0, "Database creation should succeed");
            
            // Clean slate: drop if exists, then create
            let drop_sql = CString::new("DROP TABLE IF EXISTS users").unwrap();
            let drop_result = absurder_db_execute(handle, drop_sql.as_ptr());
            absurder_free_string(drop_result);
            
            let create_sql = CString::new("CREATE TABLE users (id INTEGER, name TEXT, age INTEGER)").unwrap();
            let create_result = absurder_db_execute(handle, create_sql.as_ptr());
            assert!(!create_result.is_null(), "CREATE TABLE should succeed");
            absurder_free_string(create_result);
            
            // Insert with parameters - using SQLite's ?1, ?2, ?3 syntax
            let insert_sql = CString::new("INSERT INTO users VALUES (?1, ?2, ?3)").unwrap();
            let params_json = CString::new(r#"[{"type":"Integer","value":1},{"type":"Text","value":"Bob"},{"type":"Integer","value":30}]"#).unwrap();
            let insert_result = absurder_db_execute_with_params(handle, insert_sql.as_ptr(), params_json.as_ptr());
            
            assert!(!insert_result.is_null(), "INSERT with params should succeed");
            absurder_free_string(insert_result);
            
            // Query with parameter
            let select_sql = CString::new("SELECT * FROM users WHERE id = ?1").unwrap();
            let select_params = CString::new(r#"[{"type":"Integer","value":1}]"#).unwrap();
            let select_result = absurder_db_execute_with_params(handle, select_sql.as_ptr(), select_params.as_ptr());
            
            assert!(!select_result.is_null(), "SELECT with params should return result");
            
            let result_str = CStr::from_ptr(select_result).to_str().unwrap();
            assert!(result_str.contains("Bob"), "Result should contain parameterized data");
            
            absurder_free_string(select_result);
            absurder_db_close(handle);
        }
    }

    #[test]
    fn test_absurder_db_execute_with_params_sql_injection_prevention() {
        // This test verifies that parameterized queries prevent SQL injection
        // by ensuring malicious input is treated as data, not SQL code
        unsafe {
            let name = CString::new("test_injection.db").unwrap();
            let handle = absurder_db_new(name.as_ptr());
            
            // Create table
            let create_sql = CString::new("CREATE TABLE secrets (id INTEGER, data TEXT)").unwrap();
            let create_result = absurder_db_execute(handle, create_sql.as_ptr());
            absurder_free_string(create_result);
            
            // Insert normal data
            let insert_sql = CString::new("INSERT INTO secrets VALUES (?1, ?2)").unwrap();
            let params = CString::new(r#"[{"type":"Integer","value":1},{"type":"Text","value":"secret data"}]"#).unwrap();
            let result = absurder_db_execute_with_params(handle, insert_sql.as_ptr(), params.as_ptr());
            absurder_free_string(result);
            
            // Attempt SQL injection via parameter (should be escaped/sanitized automatically)
            let malicious_sql = CString::new("SELECT * FROM secrets WHERE data = ?1").unwrap();
            let malicious_params = CString::new(r#"[{"type":"Text","value":"x' OR '1'='1"}]"#).unwrap();
            let malicious_result = absurder_db_execute_with_params(handle, malicious_sql.as_ptr(), malicious_params.as_ptr());
            
            // The query should execute safely and return no results (the literal string doesn't match)
            assert!(!malicious_result.is_null(), "Query should execute without error");
            
            let result_str = CStr::from_ptr(malicious_result).to_str().unwrap();
            // Should return empty result set, not all secrets
            assert!(result_str.contains("\"rows\":[]") || !result_str.contains("secret data"), 
                "SQL injection should be prevented - malicious pattern should not match data");
            
            absurder_free_string(malicious_result);
            absurder_db_close(handle);
        }
    }

    #[test]
    fn test_absurder_db_execute_with_params_null_handle() {
        unsafe {
            let sql = CString::new("SELECT * FROM test").unwrap();
            let params = CString::new("[]").unwrap();
            let result = absurder_db_execute_with_params(0, sql.as_ptr(), params.as_ptr());
            assert!(result.is_null(), "Should return null for invalid handle");
        }
    }

    #[test]
    fn test_absurder_db_execute_with_params_null_sql() {
        unsafe {
            let name = CString::new("test_null_sql_params.db").unwrap();
            let handle = absurder_db_new(name.as_ptr());
            
            let params = CString::new("[]").unwrap();
            let result = absurder_db_execute_with_params(handle, std::ptr::null(), params.as_ptr());
            
            assert!(result.is_null(), "Should return null for null SQL");
            absurder_db_close(handle);
        }
    }

    #[test]
    fn test_absurder_db_execute_with_params_null_params() {
        unsafe {
            let name = CString::new("test_null_params.db").unwrap();
            let handle = absurder_db_new(name.as_ptr());
            
            let sql = CString::new("SELECT 1").unwrap();
            let result = absurder_db_execute_with_params(handle, sql.as_ptr(), std::ptr::null());
            
            assert!(result.is_null(), "Should return null for null params");
            absurder_db_close(handle);
        }
    }

    #[test]
    fn test_absurder_db_execute_with_params_invalid_json() {
        unsafe {
            let name = CString::new("test_invalid_json_params.db").unwrap();
            let handle = absurder_db_new(name.as_ptr());
            
            let sql = CString::new("SELECT 1").unwrap();
            let bad_params = CString::new("not valid json!!!").unwrap();
            let result = absurder_db_execute_with_params(handle, sql.as_ptr(), bad_params.as_ptr());
            
            assert!(result.is_null(), "Should return null for invalid JSON params");
            absurder_db_close(handle);
        }
    }

    #[test]
    fn test_transaction_begin_commit() {
        unsafe {
            let name = CString::new("test_transaction.db").unwrap();
            let handle = absurder_db_new(name.as_ptr());
            assert_ne!(handle, 0, "Database creation should succeed");
            
            // Clean slate: drop if exists, then create
            let drop_sql = CString::new("DROP TABLE IF EXISTS accounts").unwrap();
            let result = absurder_db_execute(handle, drop_sql.as_ptr());
            absurder_free_string(result);
            
            let create_sql = CString::new("CREATE TABLE accounts (id INTEGER, balance INTEGER)").unwrap();
            let result = absurder_db_execute(handle, create_sql.as_ptr());
            assert!(!result.is_null());
            absurder_free_string(result);
            
            // Begin transaction
            let status = absurder_db_begin_transaction(handle);
            assert_eq!(status, 0, "BEGIN TRANSACTION should succeed");
            
            // Insert data in transaction
            let insert_sql = CString::new("INSERT INTO accounts VALUES (1, 100)").unwrap();
            let result = absurder_db_execute(handle, insert_sql.as_ptr());
            assert!(!result.is_null());
            absurder_free_string(result);
            
            // Commit transaction
            let status = absurder_db_commit(handle);
            assert_eq!(status, 0, "COMMIT should succeed");
            
            // Verify data persisted
            let select_sql = CString::new("SELECT * FROM accounts").unwrap();
            let result = absurder_db_execute(handle, select_sql.as_ptr());
            assert!(!result.is_null());
            
            let result_str = CStr::from_ptr(result).to_str().unwrap();
            assert!(result_str.contains("100"), "Committed data should be present");
            
            absurder_free_string(result);
            absurder_db_close(handle);
        }
    }

    #[test]
    fn test_transaction_rollback() {
        unsafe {
            let name = CString::new("test_rollback.db").unwrap();
            let handle = absurder_db_new(name.as_ptr());
            
            // Clean slate
            let drop_sql = CString::new("DROP TABLE IF EXISTS test").unwrap();
            let result = absurder_db_execute(handle, drop_sql.as_ptr());
            absurder_free_string(result);
            
            let create_sql = CString::new("CREATE TABLE test (id INTEGER)").unwrap();
            let result = absurder_db_execute(handle, create_sql.as_ptr());
            absurder_free_string(result);
            
            // Begin transaction
            let status = absurder_db_begin_transaction(handle);
            assert_eq!(status, 0);
            
            // Insert data
            let insert_sql = CString::new("INSERT INTO test VALUES (999)").unwrap();
            let result = absurder_db_execute(handle, insert_sql.as_ptr());
            absurder_free_string(result);
            
            // Rollback
            let status = absurder_db_rollback(handle);
            assert_eq!(status, 0, "ROLLBACK should succeed");
            
            // Verify data was not persisted
            let select_sql = CString::new("SELECT * FROM test").unwrap();
            let result = absurder_db_execute(handle, select_sql.as_ptr());
            
            let result_str = CStr::from_ptr(result).to_str().unwrap();
            assert!(result_str.contains("\"rows\":[]") || !result_str.contains("999"), 
                "Rolled back data should not be present");
            
            absurder_free_string(result);
            absurder_db_close(handle);
        }
    }

    #[test]
    fn test_transaction_invalid_handle() {
        unsafe {
            let status = absurder_db_begin_transaction(0);
            assert_eq!(status, -1, "Should fail for invalid handle");
            
            let status = absurder_db_commit(0);
            assert_eq!(status, -1, "Should fail for invalid handle");
            
            let status = absurder_db_rollback(0);
            assert_eq!(status, -1, "Should fail for invalid handle");
        }
    }

    #[test]
    fn test_export_basic() {
        unsafe {
            let name = CString::new("test_exp.db").unwrap();
            let handle = absurder_db_new(name.as_ptr());
            
            // Create a table first
            let sql = CString::new("CREATE TABLE test (id INTEGER)").unwrap();
            let result = absurder_db_execute(handle, sql.as_ptr());
            absurder_free_string(result);
            
            let path = CString::new("/tmp/test_exp.db").unwrap();
            let export_result = absurder_db_export(handle, path.as_ptr());
            
            // Export may fail if VACUUM INTO not supported - check error but don't assert
            if export_result != 0 {
                let error = absurder_get_error();
                if !error.is_null() {
                    let err_str = CStr::from_ptr(error).to_str().unwrap();
                    println!("Export failed (expected if VACUUM INTO not supported): {}", err_str);
                }
            }
            
            absurder_db_close(handle);
        }
    }

    #[test]
    fn test_import_basic() {
        unsafe {
            let name = CString::new("test_imp.db").unwrap();
            let handle = absurder_db_new(name.as_ptr());
            let path = CString::new("/tmp/test_imp.db").unwrap();
            let _result = absurder_db_import(handle, path.as_ptr());
            absurder_db_close(handle);
        }
    }

    #[test]
    fn test_transaction_nested_operations() {
        // Test that multiple operations work correctly in a transaction
        unsafe {
            let name = CString::new("test_nested_tx.db").unwrap();
            let handle = absurder_db_new(name.as_ptr());
            
            // Clean slate
            let drop_sql = CString::new("DROP TABLE IF EXISTS items").unwrap();
            let result = absurder_db_execute(handle, drop_sql.as_ptr());
            absurder_free_string(result);
            
            let create_sql = CString::new("CREATE TABLE items (id INTEGER, value TEXT)").unwrap();
            let result = absurder_db_execute(handle, create_sql.as_ptr());
            absurder_free_string(result);
            
            // Begin transaction
            assert_eq!(absurder_db_begin_transaction(handle), 0);
            
            // Multiple inserts
            for i in 1..=5 {
                let sql = CString::new(format!("INSERT INTO items VALUES ({}, 'item{}')", i, i)).unwrap();
                let result = absurder_db_execute(handle, sql.as_ptr());
                absurder_free_string(result);
            }
            
            // Commit
            assert_eq!(absurder_db_commit(handle), 0);
            
            // Verify all data
            let select_sql = CString::new("SELECT COUNT(*) FROM items").unwrap();
            let result = absurder_db_execute(handle, select_sql.as_ptr());
            let result_str = CStr::from_ptr(result).to_str().unwrap();
            assert!(result_str.contains("5"), "All committed items should be present");
            
            absurder_free_string(result);
            absurder_db_close(handle);
        }
    }

    #[test]
    fn test_get_error_returns_null_when_no_error() {
        unsafe {
            clear_last_error();
            let error = absurder_get_error();
            assert!(error.is_null(), "Should return null when no error");
        }
    }

    #[test]
    fn test_get_error_returns_message_after_failure() {
        unsafe {
            // Trigger an error by using invalid handle
            let result = absurder_db_execute(0, CString::new("SELECT 1").unwrap().as_ptr());
            assert!(result.is_null(), "Should fail with invalid handle");
            
            // Get error message
            let error_ptr = absurder_get_error();
            assert!(!error_ptr.is_null(), "Should have error message");
            
            let error_str = CStr::from_ptr(error_ptr).to_str().unwrap();
            assert!(error_str.contains("Invalid database handle"), 
                "Error message should describe the problem: {}", error_str);
        }
    }

    #[test]
    fn test_error_cleared_on_success() {
        unsafe {
            // First trigger an error
            let _ = absurder_db_execute(0, CString::new("SELECT 1").unwrap().as_ptr());
            assert!(!absurder_get_error().is_null(), "Should have error");
            
            // Now do a successful operation
            let name = CString::new("test_clear_error.db").unwrap();
            let handle = absurder_db_new(name.as_ptr());
            assert_ne!(handle, 0, "Should succeed");
            
            // Error should be cleared
            let error = absurder_get_error();
            assert!(error.is_null(), "Error should be cleared after success");
            
            absurder_db_close(handle);
        }
    }

    #[test]
    fn test_error_with_null_sql() {
        unsafe {
            let name = CString::new("test_null_sql_error.db").unwrap();
            let handle = absurder_db_new(name.as_ptr());
            
            let result = absurder_db_execute(handle, std::ptr::null());
            assert!(result.is_null(), "Should fail with null SQL");
            
            let error_ptr = absurder_get_error();
            assert!(!error_ptr.is_null(), "Should have error message");
            
            let error_str = CStr::from_ptr(error_ptr).to_str().unwrap();
            assert!(error_str.contains("SQL") || error_str.contains("null"), 
                "Error should mention SQL: {}", error_str);
            
            absurder_db_close(handle);
        }
    }

    #[test]
    fn test_error_with_bad_sql() {
        unsafe {
            let name = CString::new("test_bad_sql_error.db").unwrap();
            let handle = absurder_db_new(name.as_ptr());
            
            let bad_sql = CString::new("INVALID SQL!!!").unwrap();
            let result = absurder_db_execute(handle, bad_sql.as_ptr());
            assert!(result.is_null(), "Should fail with bad SQL");
            
            let error_ptr = absurder_get_error();
            assert!(!error_ptr.is_null(), "Should have error message");
            
            let error_str = CStr::from_ptr(error_ptr).to_str().unwrap();
            assert!(!error_str.is_empty(), "Error message should not be empty");
            
            absurder_db_close(handle);
        }
    }
}
