/// Tests for UniFFI execute_batch function
/// 
/// Tests batch SQL execution for improved performance

#[cfg(test)]
mod uniffi_batch_tests {
    use crate::uniffi_api::*;
    use crate::registry::RUNTIME;
    use serial_test::serial;

    #[test]
    #[serial]
    fn test_execute_batch_multiple_inserts() {
        let _ = env_logger::builder().is_test(true).try_init();
        
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_batch_insert_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let handle = RUNTIME.block_on(async { create_database(config).await }).expect("Failed to create database");
        
        // Create table
        execute(handle, "DROP TABLE IF EXISTS items".to_string()).ok();
        execute(handle, "CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)".to_string())
            .expect("Failed to create table");
        
        // Execute batch of inserts
        let statements = vec![
            "INSERT INTO items (name) VALUES ('item1')".to_string(),
            "INSERT INTO items (name) VALUES ('item2')".to_string(),
            "INSERT INTO items (name) VALUES ('item3')".to_string(),
            "INSERT INTO items (name) VALUES ('item4')".to_string(),
            "INSERT INTO items (name) VALUES ('item5')".to_string(),
        ];
        
        let result = execute_batch(handle, statements);
        assert!(result.is_ok(), "Batch insert should succeed: {:?}", result.err());
        
        // Verify all rows were inserted
        let select_result = execute(handle, "SELECT COUNT(*) FROM items".to_string())
            .expect("Failed to query");
        assert_eq!(select_result.rows.len(), 1, "Should have count result");
        
        close_database(handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_execute_batch_mixed_operations() {
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_batch_mixed_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let handle = RUNTIME.block_on(async { create_database(config).await }).expect("Failed to create database");
        
        // Execute batch with mixed operations
        let statements = vec![
            "DROP TABLE IF EXISTS users".to_string(),
            "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)".to_string(),
            "INSERT INTO users (name, age) VALUES ('Alice', 30)".to_string(),
            "INSERT INTO users (name, age) VALUES ('Bob', 25)".to_string(),
            "UPDATE users SET age = 31 WHERE name = 'Alice'".to_string(),
        ];
        
        let result = execute_batch(handle, statements);
        assert!(result.is_ok(), "Mixed batch should succeed: {:?}", result.err());
        
        // Verify data
        let select_result = execute(handle, "SELECT name, age FROM users WHERE name = 'Alice'".to_string())
            .expect("Failed to query");
        assert_eq!(select_result.rows.len(), 1, "Should find Alice");
        
        close_database(handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_execute_batch_transaction_rollback_on_error() {
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_batch_error_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let handle = RUNTIME.block_on(async { create_database(config).await }).expect("Failed to create database");
        
        // Create table
        execute(handle, "DROP TABLE IF EXISTS products".to_string()).ok();
        execute(handle, "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT UNIQUE)".to_string())
            .expect("Failed to create table");
        
        // First batch succeeds
        let statements1 = vec![
            "INSERT INTO products (name) VALUES ('widget')".to_string(),
            "INSERT INTO products (name) VALUES ('gadget')".to_string(),
        ];
        execute_batch(handle, statements1).expect("First batch should succeed");
        
        // Second batch should fail due to UNIQUE constraint and rollback all changes
        let statements2 = vec![
            "INSERT INTO products (name) VALUES ('tool')".to_string(),
            "INSERT INTO products (name) VALUES ('widget')".to_string(), // Duplicate - should fail
            "INSERT INTO products (name) VALUES ('device')".to_string(),
        ];
        
        let result = execute_batch(handle, statements2);
        assert!(result.is_err(), "Batch with duplicate should fail");
        
        // Verify only first batch succeeded (2 rows)
        let count_result = execute(handle, "SELECT COUNT(*) FROM products".to_string())
            .expect("Failed to query");
        assert_eq!(count_result.rows.len(), 1, "Should have count");
        // Should still have exactly 2 rows (widget, gadget) - no partial insert from failed batch
        
        close_database(handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_execute_batch_empty_array() {
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_batch_empty_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let handle = RUNTIME.block_on(async { create_database(config).await }).expect("Failed to create database");
        
        let statements: Vec<String> = vec![];
        let result = execute_batch(handle, statements);
        assert!(result.is_ok(), "Empty batch should succeed");
        
        close_database(handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_execute_batch_invalid_handle() {
        let statements = vec!["SELECT 1".to_string()];
        let result = execute_batch(999999, statements);
        assert!(result.is_err(), "Invalid handle should fail");
    }

    #[test]
    #[serial]
    fn test_execute_batch_invalid_sql() {
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_batch_invalid_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let handle = RUNTIME.block_on(async { create_database(config).await }).expect("Failed to create database");
        
        let statements = vec![
            "DROP TABLE IF EXISTS test".to_string(),
            "CREATE TABLE test (id INTEGER)".to_string(),
            "INVALID SQL STATEMENT".to_string(),
        ];
        
        let result = execute_batch(handle, statements);
        assert!(result.is_err(), "Invalid SQL in batch should fail");
        
        close_database(handle).expect("Failed to close database");
    }
}
