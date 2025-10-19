//! AbsurderSQL Mobile FFI Layer
//!
//! Provides C ABI bindings for React Native integration on iOS and Android.
//! Uses handle-based API for memory safety and JSON for cross-language data exchange.

use std::collections::HashMap;
use std::ffi::{CStr, CString, c_char};
use std::sync::Arc;
use parking_lot::Mutex;
use once_cell::sync::Lazy;
use absurder_sql::database::SqliteIndexedDB;
use absurder_sql::types::DatabaseConfig;
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

/// Create a new database and return a handle
/// 
/// # Safety
/// - name must be a valid null-terminated UTF-8 C string or null
/// - Returns 0 on error
#[unsafe(no_mangle)]
pub unsafe extern "C" fn absurder_db_new(name: *const c_char) -> u64 {
    // Validate name pointer
    if name.is_null() {
        log::error!("absurder_db_new: null name pointer");
        return 0;
    }

    // Convert C string to Rust String
    let name_str = match unsafe { CStr::from_ptr(name) }.to_str() {
        Ok(s) => s,
        Err(e) => {
            log::error!("absurder_db_new: invalid UTF-8 in name: {}", e);
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
    // Validate handle
    if handle == 0 {
        log::error!("absurder_db_execute: invalid handle 0");
        return std::ptr::null_mut();
    }

    // Validate SQL pointer
    if sql.is_null() {
        log::error!("absurder_db_execute: null SQL pointer");
        return std::ptr::null_mut();
    }

    // Convert C string to Rust String
    let sql_str = match unsafe { CStr::from_ptr(sql) }.to_str() {
        Ok(s) => s,
        Err(e) => {
            log::error!("absurder_db_execute: invalid UTF-8 in SQL: {}", e);
            return std::ptr::null_mut();
        }
    };

    // Get database from registry (Arc::clone is cheap)
    let db = {
        let registry = DB_REGISTRY.lock();
        match registry.get(&handle) {
            Some(db) => Arc::clone(db),
            None => {
                log::error!("absurder_db_execute: handle {} not found", handle);
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
            log::error!("absurder_db_execute: SQL execution failed: {:?}", e);
            eprintln!("absurder_db_execute: SQL execution failed: {:?}", e);
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

//=============================================================================
// Android JNI Bindings
//=============================================================================

#[cfg(target_os = "android")]
mod android_jni {
    use super::*;
    use jni::JNIEnv;
    use jni::objects::{JClass, JString};
    use jni::sys::{jlong, jstring};

    /// JNI: Create database
    #[no_mangle]
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
    #[no_mangle]
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
    #[no_mangle]
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
}
