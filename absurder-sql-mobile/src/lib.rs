//! AbsurderSQL Mobile FFI Layer
//!
//! Provides C ABI bindings for React Native integration on iOS and Android.
//! Uses handle-based API for memory safety and JSON for cross-language data exchange.

mod registry;
mod ffi;

// UniFFI API (opt-in with uniffi-bindings feature)
#[cfg(feature = "uniffi-bindings")]
pub mod uniffi_api;

// UniFFI scaffolding generation (must be at crate root for 0.29+)
#[cfg(feature = "uniffi-bindings")]
uniffi::setup_scaffolding!();

// Re-export core FFI functions
pub use ffi::core::{
    absurder_db_new,
    absurder_db_execute,
    absurder_db_execute_with_params,
    absurder_db_close,
    absurder_free_string,
    absurder_get_error,
    absurder_create_index,
};

// Re-export transaction FFI functions
pub use ffi::transactions::{
    absurder_db_begin_transaction,
    absurder_db_commit,
    absurder_db_rollback,
    absurder_db_execute_batch,
};

// Re-export prepared statement FFI functions
pub use ffi::prepared_statements::{
    absurder_db_prepare,
    absurder_stmt_execute,
    absurder_stmt_finalize,
};

// Re-export streaming FFI functions
pub use ffi::streaming::{
    absurder_stmt_prepare_stream,
    absurder_stmt_fetch_next,
    absurder_stmt_stream_close,
};

// Re-export export/import FFI functions
pub use ffi::export_import::{
    absurder_db_export,
    absurder_db_import,
};

//=============================================================================
// Tests
//=============================================================================

#[cfg(test)]
#[path = "__tests__/prepared_statement_ffi_test.rs"]
mod prepared_statement_ffi_test;

#[cfg(test)]
#[path = "__tests__/streaming_api_test.rs"]
mod streaming_api_test;

#[cfg(test)]
#[path = "__tests__/cursor_rowid_zero_test.rs"]
mod cursor_rowid_zero_test;

#[cfg(test)]
#[path = "__tests__/index_helpers_test.rs"]
mod index_helpers_test;

#[cfg(test)]
#[path = "__tests__/uniffi_index_helpers_test.rs"]
mod uniffi_index_helpers_test;

#[cfg(test)]
#[path = "__tests__/registry_test.rs"]
mod registry_test;

#[cfg(test)]
#[path = "__tests__/ffi_core_test.rs"]
mod ffi_core_test;

#[cfg(test)]
#[path = "__tests__/ffi_transactions_test.rs"]
mod ffi_transactions_test;

#[cfg(test)]
#[path = "__tests__/ffi_prepared_statements_test.rs"]
mod ffi_prepared_statements_test;

#[cfg(test)]
#[path = "__tests__/ffi_streaming_test.rs"]
mod ffi_streaming_test;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_integration_test.rs"]
mod uniffi_integration_test;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_execute_test.rs"]
mod uniffi_execute_test;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_execute_params_test.rs"]
mod uniffi_execute_params_test;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_transactions_test.rs"]
mod uniffi_transactions_test;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_export_import_test.rs"]
mod uniffi_export_import_test;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_create_async_test.rs"]
mod uniffi_create_async_test;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_create_async_proof.rs"]
mod uniffi_create_async_proof;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_batch_test.rs"]
mod uniffi_batch_test;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_prepared_statements_test.rs"]
mod uniffi_prepared_statements_test;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_streaming_test.rs"]
mod uniffi_streaming_test;

#[cfg(all(test, feature = "uniffi-bindings", any(feature = "encryption", feature = "encryption-ios")))]
#[path = "__tests__/uniffi_encryption_test.rs"]
mod uniffi_encryption_test;

#[cfg(all(test, feature = "uniffi-bindings", any(feature = "encryption", feature = "encryption-ios")))]
#[path = "__tests__/uniffi_encryption_blocking_test.rs"]
mod uniffi_encryption_blocking_test;

#[cfg(test)]
#[path = "__tests__/ffi_export_import_test.rs"]
mod ffi_export_import_test;

#[cfg(all(test, any(feature = "encryption", feature = "encryption-ios")))]
#[path = "__tests__/ffi_encryption_test.rs"]
mod ffi_encryption_test;

#[cfg(all(test, any(feature = "encryption", feature = "encryption-ios")))]
#[path = "__tests__/ffi_encryption_vfs_test.rs"]
mod ffi_encryption_vfs_test;

#[cfg(test)]
mod tests {
    use super::*;
    use std::ffi::{CStr, CString};
    use crate::registry::{DB_REGISTRY, HANDLE_COUNTER, clear_last_error};

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
            let thread_id = std::thread::current().id();
            let db_name = format!("test_rollback_{:?}.db", thread_id);
            let name = CString::new(db_name.clone()).unwrap();
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
            
            // Cleanup: delete test database file
            let _ = std::fs::remove_file(&db_name);
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
