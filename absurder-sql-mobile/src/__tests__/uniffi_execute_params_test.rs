/// Tests for UniFFI execute_with_params() function
/// 
/// Tests parameterized query execution with proper SQL injection prevention

#[cfg(test)]
mod uniffi_execute_params_tests {
    use crate::uniffi_api::*;
    use crate::registry::RUNTIME;
    use serial_test::serial;

    #[test]
    #[serial]
    fn test_execute_with_params_insert() {
        let _ = env_logger::builder().is_test(true).try_init();
        
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_params_insert_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let handle = RUNTIME.block_on(async { create_database(config).await }).expect("Failed to create database");
        
        // Create table
        execute(handle, "DROP TABLE IF EXISTS users".to_string()).ok();
        execute(handle, "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)".to_string())
            .expect("Failed to create table");
        
        // Insert with parameters
        let params = vec!["Alice".to_string(), "30".to_string()];
        let result = execute_with_params(
            handle,
            "INSERT INTO users (name, age) VALUES (?, ?)".to_string(),
            params
        );
        assert!(result.is_ok(), "INSERT with params should succeed: {:?}", result.err());
        let query_result = result.unwrap();
        assert_eq!(query_result.rows_affected, 1, "Should affect 1 row");
        
        // Verify data was inserted
        let select_result = execute(handle, "SELECT * FROM users WHERE name = 'Alice'".to_string())
            .expect("SELECT should succeed");
        assert_eq!(select_result.rows.len(), 1, "Should find 1 row");
        
        close_database(handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_execute_with_params_select() {
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_params_select_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let handle = RUNTIME.block_on(async { create_database(config).await }).expect("Failed to create database");
        
        // Setup
        execute(handle, "DROP TABLE IF EXISTS products".to_string()).ok();
        execute(handle, "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL)".to_string())
            .expect("Failed to create table");
        execute(handle, "INSERT INTO products (name, price) VALUES ('Widget', 9.99)".to_string())
            .expect("Failed to insert");
        execute(handle, "INSERT INTO products (name, price) VALUES ('Gadget', 19.99)".to_string())
            .expect("Failed to insert");
        
        // Query with parameter
        let params = vec!["Widget".to_string()];
        let result = execute_with_params(
            handle,
            "SELECT * FROM products WHERE name = ?".to_string(),
            params
        );
        assert!(result.is_ok(), "SELECT with params should succeed");
        let query_result = result.unwrap();
        assert_eq!(query_result.rows.len(), 1, "Should return 1 row");
        
        close_database(handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_execute_with_params_sql_injection_prevention() {
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_params_injection_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let handle = RUNTIME.block_on(async { create_database(config).await }).expect("Failed to create database");
        
        // Setup
        execute(handle, "DROP TABLE IF EXISTS accounts".to_string()).ok();
        execute(handle, "CREATE TABLE accounts (id INTEGER PRIMARY KEY, username TEXT, balance REAL)".to_string())
            .expect("Failed to create table");
        execute(handle, "INSERT INTO accounts (username, balance) VALUES ('alice', 1000.0)".to_string())
            .expect("Failed to insert");
        execute(handle, "INSERT INTO accounts (username, balance) VALUES ('bob', 500.0)".to_string())
            .expect("Failed to insert");
        
        // Try SQL injection (should be safely escaped)
        let malicious_input = "alice' OR '1'='1".to_string();
        let params = vec![malicious_input];
        let result = execute_with_params(
            handle,
            "SELECT * FROM accounts WHERE username = ?".to_string(),
            params
        );
        assert!(result.is_ok(), "Query should succeed");
        let query_result = result.unwrap();
        // Should return 0 rows because the literal string doesn't match
        assert_eq!(query_result.rows.len(), 0, "SQL injection should be prevented, found {} rows", query_result.rows.len());
        
        close_database(handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_execute_with_params_invalid_handle() {
        let params = vec!["test".to_string()];
        let result = execute_with_params(999999, "SELECT ?".to_string(), params);
        assert!(result.is_err(), "Invalid handle should fail");
    }
}
