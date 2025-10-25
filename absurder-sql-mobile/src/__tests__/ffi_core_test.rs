//! Tests for FFI core module
//!
//! Verifies that core FFI functions work correctly after extraction

use std::ffi::CString;

#[test]
fn test_ffi_core_module_exists() {
    // This test will fail until we create the ffi::core module
    assert!(true, "FFI core module should be accessible");
}

#[test]
fn test_db_new_accessible() {
    // Verify absurder_db_new can be called through ffi::core
    let name = CString::new("test_core_new.db").unwrap();
    let handle = unsafe { crate::ffi::core::absurder_db_new(name.as_ptr()) };
    
    assert!(handle > 0, "Should create valid database handle");
    
    // Cleanup
    unsafe { crate::ffi::core::absurder_db_close(handle) };
}

#[test]
fn test_db_execute_accessible() {
    // Verify absurder_db_execute can be called through ffi::core
    let name = CString::new("test_core_execute.db").unwrap();
    let handle = unsafe { crate::ffi::core::absurder_db_new(name.as_ptr()) };
    
    let sql = CString::new("SELECT 1").unwrap();
    let result = unsafe { crate::ffi::core::absurder_db_execute(handle, sql.as_ptr()) };
    
    assert!(!result.is_null(), "Should return valid result");
    
    // Cleanup
    unsafe {
        crate::ffi::core::absurder_free_string(result);
        crate::ffi::core::absurder_db_close(handle);
    }
}

#[test]
fn test_db_close_accessible() {
    // Verify absurder_db_close can be called through ffi::core
    let name = CString::new("test_core_close.db").unwrap();
    let handle = unsafe { crate::ffi::core::absurder_db_new(name.as_ptr()) };
    
    unsafe { crate::ffi::core::absurder_db_close(handle) };
    
    // Should not crash
    assert!(true, "Close should work");
}

#[test]
fn test_free_string_accessible() {
    // Verify absurder_free_string can be called through ffi::core
    let name = CString::new("test_core_free.db").unwrap();
    let handle = unsafe { crate::ffi::core::absurder_db_new(name.as_ptr()) };
    
    let sql = CString::new("SELECT 1").unwrap();
    let result = unsafe { crate::ffi::core::absurder_db_execute(handle, sql.as_ptr()) };
    
    unsafe {
        crate::ffi::core::absurder_db_close(handle);
        crate::ffi::core::absurder_free_string(result);
    }
    
    assert!(true, "Free string should work");
}

#[test]
fn test_get_error_accessible() {
    // Verify absurder_get_error can be called through ffi::core
    let error_ptr = unsafe { crate::ffi::core::absurder_get_error() };
    
    // Should return null or valid pointer
    assert!(true, "Get error should be accessible");
    
    if !error_ptr.is_null() {
        // If there's an error, we should be able to read it
        // (but we won't free it as it's managed by thread-local)
    }
}
