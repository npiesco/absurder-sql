//! FFI Encryption Tests
//!
//! Tests for SQLCipher encryption FFI functions

#![cfg(all(test, not(target_arch = "wasm32"), feature = "encryption"))]

use std::ffi::CString;
use crate::ffi::encryption::{absurder_db_new_encrypted, absurder_db_rekey};
use crate::ffi::core::{absurder_db_execute, absurder_db_close, absurder_get_error, absurder_free_string};

fn unique_db_name(prefix: &str) -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    format!("{}_{}.db", prefix, timestamp)
}

#[test]
fn test_ffi_create_encrypted_database() {
    let name = CString::new(unique_db_name("test_encrypted_ffi")).unwrap();
    let key = CString::new("test_key_12345678").unwrap();
    
    // Create encrypted database
    let handle = unsafe { absurder_db_new_encrypted(name.as_ptr(), key.as_ptr()) };
    assert_ne!(handle, 0, "Should create encrypted database");
    
    // Drop and recreate table for clean test state
    let drop_sql = CString::new("DROP TABLE IF EXISTS test").unwrap();
    let drop_result = unsafe { absurder_db_execute(handle, drop_sql.as_ptr()) };
    if !drop_result.is_null() {
        unsafe { absurder_free_string(drop_result) };
    }
    
    // Execute SQL to verify it works
    let sql = CString::new("CREATE TABLE test (id INTEGER, data TEXT)").unwrap();
    let result = unsafe { absurder_db_execute(handle, sql.as_ptr()) };
    assert!(!result.is_null(), "Should execute SQL on encrypted database");
    
    // Cleanup
    unsafe { absurder_free_string(result) };
    unsafe { absurder_db_close(handle) };
}

#[test]
fn test_ffi_encrypted_database_with_null_key() {
    let name = CString::new(unique_db_name("test_null_key")).unwrap();
    
    // Try to create encrypted database with null key
    let handle = unsafe { absurder_db_new_encrypted(name.as_ptr(), std::ptr::null()) };
    assert_eq!(handle, 0, "Should fail with null key");
    
    // Check error message
    let error = unsafe { absurder_get_error() };
    assert!(!error.is_null(), "Should have error message");
    
    let error_str = unsafe { std::ffi::CStr::from_ptr(error) }.to_str().unwrap();
    assert!(error_str.contains("key"), "Error should mention key");
}

#[test]
fn test_ffi_encrypted_database_with_short_key() {
    let name = CString::new(unique_db_name("test_short_key")).unwrap();
    let short_key = CString::new("short").unwrap();
    
    // Try to create encrypted database with short key (< 8 chars)
    let handle = unsafe { absurder_db_new_encrypted(name.as_ptr(), short_key.as_ptr()) };
    assert_eq!(handle, 0, "Should fail with short key");
    
    // Check error message
    let error = unsafe { absurder_get_error() };
    assert!(!error.is_null(), "Should have error message");
    
    let error_str = unsafe { std::ffi::CStr::from_ptr(error) }.to_str().unwrap();
    assert!(error_str.contains("8 characters") || error_str.contains("too short"), 
            "Error should mention minimum key length");
}

#[test]
fn test_ffi_rekey_database() {
    let name = CString::new(unique_db_name("test_rekey_ffi")).unwrap();
    let old_key = CString::new("old_key_12345678").unwrap();
    let new_key = CString::new("new_key_87654321").unwrap();
    
    // Create encrypted database
    let handle = unsafe { absurder_db_new_encrypted(name.as_ptr(), old_key.as_ptr()) };
    assert_ne!(handle, 0, "Should create encrypted database");
    
    // Drop and recreate table for clean test state
    let drop_sql = CString::new("DROP TABLE IF EXISTS rekey_test").unwrap();
    let drop_result = unsafe { absurder_db_execute(handle, drop_sql.as_ptr()) };
    if !drop_result.is_null() {
        unsafe { absurder_free_string(drop_result) };
    }
    
    // Create table and insert data
    let sql = CString::new("CREATE TABLE rekey_test (id INTEGER, value TEXT)").unwrap();
    let result = unsafe { absurder_db_execute(handle, sql.as_ptr()) };
    assert!(!result.is_null());
    unsafe { absurder_free_string(result) };
    
    let sql = CString::new("INSERT INTO rekey_test VALUES (1, 'test')").unwrap();
    let result = unsafe { absurder_db_execute(handle, sql.as_ptr()) };
    assert!(!result.is_null());
    unsafe { absurder_free_string(result) };
    
    // Rekey the database
    let rekey_result = unsafe { absurder_db_rekey(handle, new_key.as_ptr()) };
    assert_eq!(rekey_result, 0, "Rekey should succeed");
    
    // Verify data still accessible
    let sql = CString::new("SELECT * FROM rekey_test").unwrap();
    let result = unsafe { absurder_db_execute(handle, sql.as_ptr()) };
    assert!(!result.is_null(), "Should query after rekey");
    
    let result_str = unsafe { std::ffi::CStr::from_ptr(result) }.to_str().unwrap();
    assert!(result_str.contains("test"), "Data should be preserved after rekey");
    
    // Cleanup
    unsafe { absurder_free_string(result) };
    unsafe { absurder_db_close(handle) };
}

#[test]
fn test_ffi_rekey_with_invalid_handle() {
    let new_key = CString::new("new_key_12345678").unwrap();
    
    // Try to rekey with invalid handle
    let result = unsafe { absurder_db_rekey(999999, new_key.as_ptr()) };
    assert_ne!(result, 0, "Should fail with invalid handle");
    
    // Check error message
    let error = unsafe { absurder_get_error() };
    assert!(!error.is_null(), "Should have error message");
}

#[test]
fn test_ffi_rekey_with_null_key() {
    let name = CString::new(unique_db_name("test_rekey_null")).unwrap();
    let key = CString::new("initial_key_12345678").unwrap();
    
    // Create encrypted database
    let handle = unsafe { absurder_db_new_encrypted(name.as_ptr(), key.as_ptr()) };
    assert_ne!(handle, 0);
    
    // Try to rekey with null key
    let result = unsafe { absurder_db_rekey(handle, std::ptr::null()) };
    assert_ne!(result, 0, "Should fail with null key");
    
    // Cleanup
    unsafe { absurder_db_close(handle) };
}

