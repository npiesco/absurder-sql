/// Tests for UniFFI execute() function
/// 
/// Tests that the execute function works correctly with UniFFI exports

#[cfg(test)]
mod uniffi_execute_tests {
    use crate::uniffi_api::*;
    use crate::registry::RUNTIME;
    use serial_test::serial;

    #[test]
    #[serial]
    fn test_execute_simple_query() {
        let _ = env_logger::builder().is_test(true).try_init();
        
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_exec_simple_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let handle = RUNTIME.block_on(async { create_database(config.clone()).await })
            .unwrap_or_else(|e| panic!("Failed to create database {}: {:?}", config.name, e));
        assert!(handle > 0, "Database handle should be non-zero");
        
        // Drop and recreate table for clean test state
        let drop_result = execute(handle, "DROP TABLE IF EXISTS uniffi_execute_simple".to_string());
        assert!(drop_result.is_ok(), "DROP TABLE IF EXISTS failed: {:?}", drop_result.err());
        
        let create_result = execute(handle, "CREATE TABLE uniffi_execute_simple (id INTEGER PRIMARY KEY, value TEXT)".to_string());
        assert!(create_result.is_ok(), "CREATE TABLE failed: {:?}", create_result.err());
        
        // Insert data
        let insert_result = execute(handle, "INSERT INTO uniffi_execute_simple (value) VALUES ('hello')".to_string());
        assert!(insert_result.is_ok(), "INSERT should succeed");
        let insert_query = insert_result.unwrap();
        assert_eq!(insert_query.rows_affected, 1, "Should affect 1 row");
        
        // Query data
        let select_result = execute(handle, "SELECT * FROM uniffi_execute_simple".to_string());
        assert!(select_result.is_ok(), "SELECT should succeed");
        let select_query = select_result.unwrap();
        assert_eq!(select_query.rows.len(), 1, "Should return 1 row");
        
        // Clean up
        close_database(handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_execute_invalid_sql() {
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_exec_invalid_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let handle = RUNTIME.block_on(async { create_database(config).await }).expect("Failed to create database");
        
        // Try invalid SQL
        let result = execute(handle, "INVALID SQL STATEMENT".to_string());
        assert!(result.is_err(), "Invalid SQL should fail");
        
        // Clean up
        close_database(handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_execute_with_invalid_handle() {
        let result = execute(999999, "SELECT 1".to_string());
        assert!(result.is_err(), "Invalid handle should fail");
    }
}
