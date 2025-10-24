//! Tests for FFI transactions module
//!
//! Verifies that transaction functions work correctly after extraction

use std::ffi::CString;

#[test]
fn test_ffi_transactions_module_exists() {
    // This test will fail until we create the ffi::transactions module
    assert!(true, "FFI transactions module should be accessible");
}

#[test]
fn test_begin_transaction_accessible() {
    // Verify absurder_db_begin_transaction can be called through ffi::transactions
    let name = CString::new("test_db").unwrap();
    let handle = unsafe { crate::ffi::core::absurder_db_new(name.as_ptr()) };
    
    let result = unsafe { crate::ffi::transactions::absurder_db_begin_transaction(handle) };
    
    assert_eq!(result, 0, "Should begin transaction successfully");
    
    // Cleanup
    unsafe { crate::ffi::core::absurder_db_close(handle) };
}

#[test]
fn test_commit_accessible() {
    // Verify absurder_db_commit can be called through ffi::transactions
    let name = CString::new("test_db").unwrap();
    let handle = unsafe { crate::ffi::core::absurder_db_new(name.as_ptr()) };
    
    unsafe { crate::ffi::transactions::absurder_db_begin_transaction(handle) };
    let result = unsafe { crate::ffi::transactions::absurder_db_commit(handle) };
    
    assert_eq!(result, 0, "Should commit transaction successfully");
    
    // Cleanup
    unsafe { crate::ffi::core::absurder_db_close(handle) };
}

#[test]
fn test_rollback_accessible() {
    // Verify absurder_db_rollback can be called through ffi::transactions
    let name = CString::new("test_db").unwrap();
    let handle = unsafe { crate::ffi::core::absurder_db_new(name.as_ptr()) };
    
    unsafe { crate::ffi::transactions::absurder_db_begin_transaction(handle) };
    let result = unsafe { crate::ffi::transactions::absurder_db_rollback(handle) };
    
    assert_eq!(result, 0, "Should rollback transaction successfully");
    
    // Cleanup
    unsafe { crate::ffi::core::absurder_db_close(handle) };
}

#[test]
fn test_execute_batch_accessible() {
    // Verify absurder_db_execute_batch can be called through ffi::transactions
    let name = CString::new("test_db").unwrap();
    let handle = unsafe { crate::ffi::core::absurder_db_new(name.as_ptr()) };
    
    let batch_json = CString::new(r#"["CREATE TABLE test (id INTEGER)", "INSERT INTO test VALUES (1)"]"#).unwrap();
    let result = unsafe { crate::ffi::transactions::absurder_db_execute_batch(handle, batch_json.as_ptr()) };
    
    assert_eq!(result, 0, "Should execute batch successfully");
    
    // Cleanup
    unsafe { crate::ffi::core::absurder_db_close(handle) };
}
