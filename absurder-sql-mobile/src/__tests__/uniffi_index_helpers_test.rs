#[cfg(feature = "uniffi-bindings")]
use serial_test::serial;
#[cfg(feature = "uniffi-bindings")]
use crate::uniffi_api::core::*;
#[cfg(feature = "uniffi-bindings")]
use crate::uniffi_api::types::*;
#[cfg(feature = "uniffi-bindings")]
use crate::registry::RUNTIME;

#[cfg(all(test, feature = "uniffi-bindings"))]
mod uniffi_index_helpers_tests {
    use super::*;
    use std::thread;

    #[test]
    #[serial]
    fn test_create_single_column_index() {
        let thread_id = thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_index_single_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let handle = RUNTIME.block_on(async { create_database(config).await }).unwrap();
        
        // Drop and create table
        let _ = execute(handle, "DROP TABLE IF EXISTS users".to_string());
        execute(handle, "CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, name TEXT)".to_string()).unwrap();
        
        // Create index on email column
        let result = create_index(handle, "users".to_string(), "email".to_string());
        assert!(result.is_ok(), "Index creation should succeed");
        
        // Verify index exists
        let query_result = execute(handle, "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_users_email'".to_string()).unwrap();
        assert_eq!(query_result.rows.len(), 1, "Index should exist");
        
        close_database(handle).unwrap();
    }

    #[test]
    #[serial]
    fn test_create_multi_column_index() {
        let thread_id = thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_index_multi_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let handle = RUNTIME.block_on(async { create_database(config).await }).unwrap();
        
        // Drop and create table
        let _ = execute(handle, "DROP TABLE IF EXISTS orders".to_string());
        execute(handle, "CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, product_id INTEGER, created_at TEXT)".to_string()).unwrap();
        
        // Create composite index
        let result = create_index(handle, "orders".to_string(), "user_id,product_id".to_string());
        assert!(result.is_ok(), "Composite index creation should succeed");
        
        // Verify index exists
        let query_result = execute(handle, "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_orders_user_id_product_id'".to_string()).unwrap();
        assert_eq!(query_result.rows.len(), 1, "Composite index should exist");
        
        close_database(handle).unwrap();
    }

    #[test]
    #[serial]
    fn test_create_index_invalid_handle() {
        let result = create_index(99999, "users".to_string(), "email".to_string());
        assert!(result.is_err(), "Should return error for invalid handle");
        match result.unwrap_err() {
            DatabaseError::NotFound { message } => {
                assert!(message.contains("not found"), "Error message should mention 'not found'");
            },
            _ => panic!("Expected NotFound error"),
        }
    }

    #[test]
    #[serial]
    fn test_create_index_invalid_table() {
        let thread_id = thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_index_invalid_table_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let handle = RUNTIME.block_on(async { create_database(config).await }).unwrap();
        
        // Try to create index on non-existent table
        let result = create_index(handle, "nonexistent_table".to_string(), "email".to_string());
        assert!(result.is_err(), "Should return error for invalid table");
        
        close_database(handle).unwrap();
    }

    #[test]
    #[serial]
    fn test_create_index_empty_inputs() {
        let thread_id = thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_index_empty_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let handle = RUNTIME.block_on(async { create_database(config).await }).unwrap();
        
        // Empty table name
        let result = create_index(handle, "".to_string(), "email".to_string());
        assert!(result.is_err(), "Should return error for empty table");
        
        // Empty column name
        let result = create_index(handle, "users".to_string(), "".to_string());
        assert!(result.is_err(), "Should return error for empty columns");
        
        close_database(handle).unwrap();
    }
}
