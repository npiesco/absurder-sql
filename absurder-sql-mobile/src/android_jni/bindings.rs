//! Android JNI bindings
//!
//! Provides JNI wrappers for all FFI functions to enable Android Kotlin bridge.

use std::ffi::{CStr, CString};
use jni::JNIEnv;
use jni::objects::{JClass, JString};
use jni::sys::{jlong, jstring, jint, JavaVM, jint as JInt};
use std::os::raw::c_void;

use crate::{
    absurder_db_new, absurder_db_execute, absurder_db_close, absurder_free_string,
    absurder_db_begin_transaction, absurder_db_commit, absurder_db_rollback,
    absurder_db_execute_batch, absurder_db_export, absurder_db_import,
    absurder_db_prepare, absurder_stmt_execute, absurder_stmt_finalize,
    absurder_db_execute_with_params,
    absurder_stmt_prepare_stream, absurder_stmt_fetch_next, absurder_stmt_stream_close,
};

#[cfg(feature = "encryption")]
use crate::ffi::encryption::{absurder_db_new_encrypted, absurder_db_rekey};

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

/// JNI: Execute batch
#[unsafe(no_mangle)]
pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeExecuteBatch(
    mut env: JNIEnv,
    _class: JClass,
    handle: jlong,
    statements_json: JString,
) -> jint {
    // Convert JString to Rust String
    let statements_str: String = match env.get_string(&statements_json) {
        Ok(s) => s.into(),
        Err(e) => {
            log::error!("JNI nativeExecuteBatch: Failed to get statements JSON: {:?}", e);
            return -1;
        }
    };

    // Convert to C string
    let statements_cstr = match CString::new(statements_str) {
        Ok(s) => s,
        Err(e) => {
            log::error!("JNI nativeExecuteBatch: CString conversion failed: {}", e);
            return -1;
        }
    };

    // Call FFI function
    unsafe { absurder_db_execute_batch(handle as u64, statements_cstr.as_ptr()) }
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

/// JNI: Prepare statement
#[unsafe(no_mangle)]
pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLModule_nativePrepare(
    mut env: JNIEnv,
    _class: JClass,
    db_handle: jlong,
    sql: JString,
) -> jlong {
    // Convert JString to Rust String
    let sql_str: String = match env.get_string(&sql) {
        Ok(s) => s.into(),
        Err(e) => {
            log::error!("JNI nativePrepare: Failed to get SQL string: {:?}", e);
            return 0;
        }
    };

    // Convert to C string
    let sql_cstr = match CString::new(sql_str) {
        Ok(s) => s,
        Err(e) => {
            log::error!("JNI nativePrepare: CString conversion failed: {}", e);
            return 0;
        }
    };

    // Call FFI function
    let stmt_handle = unsafe { absurder_db_prepare(db_handle as u64, sql_cstr.as_ptr()) };
    
    log::info!("JNI nativePrepare: prepared statement with handle {}", stmt_handle);
    stmt_handle as jlong
}

/// JNI: Execute prepared statement
#[unsafe(no_mangle)]
pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeStmtExecute(
    mut env: JNIEnv,
    _class: JClass,
    stmt_handle: jlong,
    params_json: JString,
) -> jstring {
    // Convert JString to Rust String
    let params_str: String = match env.get_string(&params_json) {
        Ok(s) => s.into(),
        Err(e) => {
            log::error!("JNI nativeStmtExecute: Failed to get params JSON: {:?}", e);
            return std::ptr::null_mut();
        }
    };

    // Convert to C string
    let params_cstr = match CString::new(params_str) {
        Ok(s) => s,
        Err(e) => {
            log::error!("JNI nativeStmtExecute: CString conversion failed: {}", e);
            return std::ptr::null_mut();
        }
    };

    // Call FFI function
    let result_ptr = unsafe { absurder_stmt_execute(stmt_handle as u64, params_cstr.as_ptr()) };

    if result_ptr.is_null() {
        log::error!("JNI nativeStmtExecute: absurder_stmt_execute returned null");
        return std::ptr::null_mut();
    }

    // Convert C string to JString
    let result_str = unsafe {
        match CStr::from_ptr(result_ptr).to_str() {
            Ok(s) => s,
            Err(e) => {
                log::error!("JNI nativeStmtExecute: UTF-8 conversion failed: {}", e);
                absurder_free_string(result_ptr);
                return std::ptr::null_mut();
            }
        }
    };

    let jstring_result = match env.new_string(result_str) {
        Ok(s) => s,
        Err(e) => {
            log::error!("JNI nativeStmtExecute: Failed to create JString: {:?}", e);
            unsafe { absurder_free_string(result_ptr); }
            return std::ptr::null_mut();
        }
    };

    // Free the C string
    unsafe { absurder_free_string(result_ptr); }

    log::debug!("JNI nativeStmtExecute: successfully returned result");
    jstring_result.into_raw()
}

/// JNI: Finalize prepared statement
#[unsafe(no_mangle)]
pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeStmtFinalize(
    _env: JNIEnv,
    _class: JClass,
    stmt_handle: jlong,
) -> jint {
    let result = unsafe { absurder_stmt_finalize(stmt_handle as u64) };
    log::info!("JNI nativeStmtFinalize: finalized statement {} with result {}", stmt_handle, result);
    result
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

/// JNI: Prepare streaming statement
#[unsafe(no_mangle)]
pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLModule_nativePrepareStream(
    mut env: JNIEnv,
    _class: JClass,
    db_handle: jlong,
    sql: JString,
) -> jlong {
    let sql_str: String = match env.get_string(&sql) {
        Ok(s) => s.into(),
        Err(e) => {
            log::error!("JNI nativePrepareStream: Failed to get SQL string: {:?}", e);
            return 0;
        }
    };

    let sql_cstr = match CString::new(sql_str) {
        Ok(s) => s,
        Err(e) => {
            log::error!("JNI nativePrepareStream: Failed to create CString: {:?}", e);
            return 0;
        }
    };

    unsafe { absurder_stmt_prepare_stream(db_handle as u64, sql_cstr.as_ptr()) as jlong }
}

/// JNI: Fetch next batch from stream
#[unsafe(no_mangle)]
pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeFetchNext(
    env: JNIEnv,
    _class: JClass,
    stream_handle: jlong,
    batch_size: jint,
) -> jstring {
    let result_ptr = unsafe { absurder_stmt_fetch_next(stream_handle as u64, batch_size) };

    if result_ptr.is_null() {
        log::error!("JNI nativeFetchNext: absurder_stmt_fetch_next returned null");
        return std::ptr::null_mut();
    }

    // Convert C string to Java string
    let c_str = unsafe { CStr::from_ptr(result_ptr) };
    let output = match env.new_string(c_str.to_str().unwrap_or("[]")) {
        Ok(s) => s.into_raw(),
        Err(e) => {
            log::error!("JNI nativeFetchNext: JString creation failed: {:?}", e);
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

/// JNI: Close streaming statement
#[unsafe(no_mangle)]
pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeCloseStream(
    _env: JNIEnv,
    _class: JClass,
    stream_handle: jlong,
) -> jint {
    unsafe { absurder_stmt_stream_close(stream_handle as u64) }
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

// ============================================================
// Encryption JNI Functions
// ============================================================

/// JNI: Create encrypted database
#[cfg(feature = "encryption")]
#[unsafe(no_mangle)]
pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeCreateEncryptedDb(
    mut env: JNIEnv,
    _class: JClass,
    name: JString,
    key: JString,
) -> jlong {
    // Convert name JString to Rust String
    let name_str: String = match env.get_string(&name) {
        Ok(s) => s.into(),
        Err(e) => {
            log::error!("JNI nativeCreateEncryptedDb: Failed to get name string: {:?}", e);
            return 0;
        }
    };

    // Convert key JString to Rust String
    let key_str: String = match env.get_string(&key) {
        Ok(s) => s.into(),
        Err(e) => {
            log::error!("JNI nativeCreateEncryptedDb: Failed to get key string: {:?}", e);
            return 0;
        }
    };

    // Convert to C strings
    let name_cstr = match CString::new(name_str) {
        Ok(s) => s,
        Err(e) => {
            log::error!("JNI nativeCreateEncryptedDb: Name CString conversion failed: {}", e);
            return 0;
        }
    };

    let key_cstr = match CString::new(key_str) {
        Ok(s) => s,
        Err(e) => {
            log::error!("JNI nativeCreateEncryptedDb: Key CString conversion failed: {}", e);
            return 0;
        }
    };

    // Call FFI function
    let handle = unsafe { absurder_db_new_encrypted(name_cstr.as_ptr(), key_cstr.as_ptr()) };
    
    log::info!("JNI nativeCreateEncryptedDb: created encrypted database with handle {}", handle);
    handle as jlong
}

/// JNI: Rekey encrypted database
#[cfg(feature = "encryption")]
#[unsafe(no_mangle)]
pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeRekey(
    mut env: JNIEnv,
    _class: JClass,
    handle: jlong,
    new_key: JString,
) -> jint {
    // Convert new_key JString to Rust String
    let key_str: String = match env.get_string(&new_key) {
        Ok(s) => s.into(),
        Err(e) => {
            log::error!("JNI nativeRekey: Failed to get key string: {:?}", e);
            return -1;
        }
    };

    // Convert to C string
    let key_cstr = match CString::new(key_str) {
        Ok(s) => s,
        Err(e) => {
            log::error!("JNI nativeRekey: Key CString conversion failed: {}", e);
            return -1;
        }
    };

    // Call FFI function
    let result = unsafe { absurder_db_rekey(handle as u64, key_cstr.as_ptr()) };
    
    log::info!("JNI nativeRekey: rekey result={}", result);
    result
}

// Test class wrappers for encryption functions
#[cfg(feature = "encryption")]
#[unsafe(no_mangle)]
pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLInstrumentationTest_nativeCreateEncryptedDb(
    env: JNIEnv,
    _class: JClass,
    name: JString,
    key: JString,
) -> jlong {
    Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeCreateEncryptedDb(env, _class, name, key)
}

#[cfg(feature = "encryption")]
#[unsafe(no_mangle)]
pub extern "system" fn Java_com_npiesco_absurdersql_AbsurderSQLInstrumentationTest_nativeRekey(
    env: JNIEnv,
    _class: JClass,
    handle: jlong,
    new_key: JString,
) -> jint {
    Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeRekey(env, _class, handle, new_key)
}
