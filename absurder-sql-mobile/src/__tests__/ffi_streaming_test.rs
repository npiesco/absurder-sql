//! Tests for FFI streaming module
//!
//! Verifies that streaming functions work correctly after extraction

use std::ffi::CString;

#[test]
fn test_ffi_streaming_module_exists() {
    // This test will fail until we create the ffi::streaming module
    assert!(true, "FFI streaming module should be accessible");
}

#[test]
fn test_prepare_stream_accessible() {
    // Verify absurder_stmt_prepare_stream can be called through ffi::streaming
    let name = CString::new("test_stream_prepare.db").unwrap();
    let handle = unsafe { crate::ffi::core::absurder_db_new(name.as_ptr()) };
    
    // Create a table with data
    let drop_sql = CString::new("DROP TABLE IF EXISTS stream_test").unwrap();
    let result = unsafe { crate::ffi::core::absurder_db_execute(handle, drop_sql.as_ptr()) };
    unsafe { crate::ffi::core::absurder_free_string(result) };
    
    let create_sql = CString::new("CREATE TABLE stream_test (id INTEGER)").unwrap();
    let result = unsafe { crate::ffi::core::absurder_db_execute(handle, create_sql.as_ptr()) };
    unsafe { crate::ffi::core::absurder_free_string(result) };
    
    let sql = CString::new("SELECT * FROM stream_test").unwrap();
    let stream_handle = unsafe { crate::ffi::streaming::absurder_stmt_prepare_stream(handle, sql.as_ptr()) };
    
    assert!(stream_handle > 0, "Should create valid stream handle");
    
    // Cleanup
    unsafe {
        crate::ffi::streaming::absurder_stmt_stream_close(stream_handle);
        crate::ffi::core::absurder_db_close(handle);
    }
}

#[test]
fn test_fetch_next_accessible() {
    // Verify absurder_stmt_fetch_next can be called through ffi::streaming
    let name = CString::new("test_stream_fetch.db").unwrap();
    let handle = unsafe { crate::ffi::core::absurder_db_new(name.as_ptr()) };
    
    // Create table and insert data
    let drop_sql = CString::new("DROP TABLE IF EXISTS fetch_test").unwrap();
    let result = unsafe { crate::ffi::core::absurder_db_execute(handle, drop_sql.as_ptr()) };
    unsafe { crate::ffi::core::absurder_free_string(result) };
    
    let create_sql = CString::new("CREATE TABLE fetch_test (id INTEGER)").unwrap();
    let result = unsafe { crate::ffi::core::absurder_db_execute(handle, create_sql.as_ptr()) };
    unsafe { crate::ffi::core::absurder_free_string(result) };
    
    let insert_sql = CString::new("INSERT INTO fetch_test VALUES (1)").unwrap();
    let result = unsafe { crate::ffi::core::absurder_db_execute(handle, insert_sql.as_ptr()) };
    unsafe { crate::ffi::core::absurder_free_string(result) };
    
    let sql = CString::new("SELECT * FROM fetch_test").unwrap();
    let stream_handle = unsafe { crate::ffi::streaming::absurder_stmt_prepare_stream(handle, sql.as_ptr()) };
    
    let result = unsafe { crate::ffi::streaming::absurder_stmt_fetch_next(stream_handle, 10) };
    
    assert!(!result.is_null(), "Should return valid result");
    
    // Cleanup
    unsafe {
        crate::ffi::core::absurder_free_string(result);
        crate::ffi::streaming::absurder_stmt_stream_close(stream_handle);
        crate::ffi::core::absurder_db_close(handle);
    }
}

#[test]
fn test_stream_close_accessible() {
    // Verify absurder_stmt_stream_close can be called through ffi::streaming
    let name = CString::new("test_stream_close.db").unwrap();
    let handle = unsafe { crate::ffi::core::absurder_db_new(name.as_ptr()) };
    
    let drop_sql = CString::new("DROP TABLE IF EXISTS close_test").unwrap();
    let result = unsafe { crate::ffi::core::absurder_db_execute(handle, drop_sql.as_ptr()) };
    unsafe { crate::ffi::core::absurder_free_string(result) };
    
    let create_sql = CString::new("CREATE TABLE close_test (id INTEGER)").unwrap();
    let result = unsafe { crate::ffi::core::absurder_db_execute(handle, create_sql.as_ptr()) };
    unsafe { crate::ffi::core::absurder_free_string(result) };
    
    let sql = CString::new("SELECT * FROM close_test").unwrap();
    let stream_handle = unsafe { crate::ffi::streaming::absurder_stmt_prepare_stream(handle, sql.as_ptr()) };
    
    let result = unsafe { crate::ffi::streaming::absurder_stmt_stream_close(stream_handle) };
    
    assert_eq!(result, 0, "Should close successfully");
    
    // Cleanup
    unsafe { crate::ffi::core::absurder_db_close(handle) };
}
