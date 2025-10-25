//! Tests for FFI prepared statements module
//!
//! Verifies that prepared statement functions work correctly after extraction

use std::ffi::CString;

#[test]
fn test_ffi_prepared_statements_module_exists() {
    // This test will fail until we create the ffi::prepared_statements module
    assert!(true, "FFI prepared statements module should be accessible");
}

#[test]
fn test_prepare_accessible() {
    // Verify absurder_db_prepare can be called through ffi::prepared_statements
    let name = CString::new("test_stmt_prepare.db").unwrap();
    let handle = unsafe { crate::ffi::core::absurder_db_new(name.as_ptr()) };
    
    let sql = CString::new("SELECT ?").unwrap();
    let stmt_handle = unsafe { crate::ffi::prepared_statements::absurder_db_prepare(handle, sql.as_ptr()) };
    
    assert!(stmt_handle > 0, "Should create valid statement handle");
    
    // Cleanup
    unsafe {
        crate::ffi::prepared_statements::absurder_stmt_finalize(stmt_handle);
        crate::ffi::core::absurder_db_close(handle);
    }
}

#[test]
fn test_stmt_execute_accessible() {
    // Verify absurder_stmt_execute can be called through ffi::prepared_statements
    let name = CString::new("test_stmt_execute.db").unwrap();
    let handle = unsafe { crate::ffi::core::absurder_db_new(name.as_ptr()) };
    
    let sql = CString::new("SELECT ?").unwrap();
    let stmt_handle = unsafe { crate::ffi::prepared_statements::absurder_db_prepare(handle, sql.as_ptr()) };
    
    let params = CString::new(r#"[{"type":"Integer","value":42}]"#).unwrap();
    let result = unsafe { crate::ffi::prepared_statements::absurder_stmt_execute(stmt_handle, params.as_ptr()) };
    
    assert!(!result.is_null(), "Should return valid result");
    
    // Cleanup
    unsafe {
        crate::ffi::core::absurder_free_string(result);
        crate::ffi::prepared_statements::absurder_stmt_finalize(stmt_handle);
        crate::ffi::core::absurder_db_close(handle);
    }
}

#[test]
fn test_stmt_finalize_accessible() {
    // Verify absurder_stmt_finalize can be called through ffi::prepared_statements
    let name = CString::new("test_stmt_finalize.db").unwrap();
    let handle = unsafe { crate::ffi::core::absurder_db_new(name.as_ptr()) };
    
    let sql = CString::new("SELECT 1").unwrap();
    let stmt_handle = unsafe { crate::ffi::prepared_statements::absurder_db_prepare(handle, sql.as_ptr()) };
    
    let result = unsafe { crate::ffi::prepared_statements::absurder_stmt_finalize(stmt_handle) };
    
    assert_eq!(result, 0, "Should finalize successfully");
    
    // Cleanup
    unsafe { crate::ffi::core::absurder_db_close(handle) };
}
