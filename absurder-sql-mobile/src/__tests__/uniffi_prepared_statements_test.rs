/// Tests for UniFFI prepared statement functions
/// 
/// Tests prepared statement creation, execution, and cleanup

#[cfg(test)]
mod uniffi_prepared_statements_tests {
    use crate::uniffi_api::*;
    use crate::registry::RUNTIME;
    use serial_test::serial;

    #[test]
    #[serial]
    fn test_prepare_statement_simple() {
        let _ = env_logger::builder().is_test(true).try_init();
        
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_prepare_simple_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };
        
        let db_handle = RUNTIME.block_on(async { create_database(config).await }).expect("Failed to create database");
        
        // Create table
        execute(db_handle, "DROP TABLE IF EXISTS test".to_string()).ok();
        execute(db_handle, "CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)".to_string())
            .expect("Failed to create table");
        
        // Prepare statement
        let stmt_handle = prepare_statement(db_handle, "INSERT INTO test (value) VALUES (?)".to_string())
            .expect("Failed to prepare statement");
        
        assert!(stmt_handle > 0, "Statement handle should be valid");
        
        // Finalize statement
        finalize_statement(stmt_handle).expect("Failed to finalize statement");
        close_database(db_handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_prepare_and_execute_insert() {
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_prepare_insert_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };
        
        let db_handle = RUNTIME.block_on(async { create_database(config).await }).expect("Failed to create database");
        
        // Create table
        execute(db_handle, "DROP TABLE IF EXISTS users".to_string()).ok();
        execute(db_handle, "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)".to_string())
            .expect("Failed to create table");
        
        // Prepare statement
        let stmt_handle = prepare_statement(db_handle, "INSERT INTO users (name, age) VALUES (?, ?)".to_string())
            .expect("Failed to prepare statement");
        
        // Execute with params
        let params = vec!["Alice".to_string(), "30".to_string()];
        execute_statement(stmt_handle, params).expect("Failed to execute statement");
        
        // Verify insertion
        let result = execute(db_handle, "SELECT name, age FROM users".to_string())
            .expect("Failed to query");
        assert_eq!(result.rows.len(), 1, "Should have 1 row");
        
        finalize_statement(stmt_handle).expect("Failed to finalize statement");
        close_database(db_handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_prepare_and_execute_select() {
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_prepare_select_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };
        
        let db_handle = RUNTIME.block_on(async { create_database(config).await }).expect("Failed to create database");
        
        // Create and populate table
        execute(db_handle, "DROP TABLE IF EXISTS products".to_string()).ok();
        execute(db_handle, "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL)".to_string())
            .expect("Failed to create table");
        execute(db_handle, "INSERT INTO products (name, price) VALUES ('Widget', 10.50)".to_string())
            .expect("Failed to insert");
        execute(db_handle, "INSERT INTO products (name, price) VALUES ('Gadget', 20.99)".to_string())
            .expect("Failed to insert");
        
        // Prepare select statement
        let stmt_handle = prepare_statement(db_handle, "SELECT name, price FROM products WHERE price > ?".to_string())
            .expect("Failed to prepare statement");
        
        // Execute with param
        let params = vec!["15.00".to_string()];
        execute_statement(stmt_handle, params).expect("Failed to execute statement");
        
        finalize_statement(stmt_handle).expect("Failed to finalize statement");
        close_database(db_handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_prepare_statement_reuse() {
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_prepare_reuse_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };
        
        let db_handle = RUNTIME.block_on(async { create_database(config).await }).expect("Failed to create database");
        
        // Create table
        execute(db_handle, "DROP TABLE IF EXISTS items".to_string()).ok();
        execute(db_handle, "CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)".to_string())
            .expect("Failed to create table");
        
        // Prepare statement once
        let stmt_handle = prepare_statement(db_handle, "INSERT INTO items (name) VALUES (?)".to_string())
            .expect("Failed to prepare statement");
        
        // Execute multiple times with different params
        for i in 1..=5 {
            let params = vec![format!("item_{}", i)];
            execute_statement(stmt_handle, params)
                .expect(&format!("Failed to execute statement {}", i));
        }
        
        // Verify all insertions
        let result = execute(db_handle, "SELECT COUNT(*) FROM items".to_string())
            .expect("Failed to query");
        assert_eq!(result.rows.len(), 1, "Should have count result");
        
        finalize_statement(stmt_handle).expect("Failed to finalize statement");
        close_database(db_handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_prepare_invalid_sql() {
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_prepare_invalid_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };
        
        let db_handle = RUNTIME.block_on(async { create_database(config).await }).expect("Failed to create database");
        
        let result = prepare_statement(db_handle, "INVALID SQL STATEMENT".to_string());
        assert!(result.is_err(), "Invalid SQL should fail to prepare");
        
        close_database(db_handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_prepare_invalid_db_handle() {
        let result = prepare_statement(999999, "SELECT 1".to_string());
        assert!(result.is_err(), "Invalid db handle should fail");
    }

    #[test]
    #[serial]
    fn test_execute_statement_invalid_handle() {
        let params = vec!["test".to_string()];
        let result = execute_statement(999999, params);
        assert!(result.is_err(), "Invalid statement handle should fail");
    }

    #[test]
    #[serial]
    fn test_finalize_invalid_handle() {
        let result = finalize_statement(999999);
        assert!(result.is_err(), "Invalid statement handle should fail");
    }

    #[test]
    #[serial]
    fn test_finalize_twice() {
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_prepare_finalize_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };
        
        let db_handle = RUNTIME.block_on(async { create_database(config).await }).expect("Failed to create database");
        
        execute(db_handle, "DROP TABLE IF EXISTS test".to_string()).ok();
        execute(db_handle, "CREATE TABLE test (id INTEGER)".to_string())
            .expect("Failed to create table");
        
        let stmt_handle = prepare_statement(db_handle, "SELECT * FROM test".to_string())
            .expect("Failed to prepare statement");
        
        finalize_statement(stmt_handle).expect("First finalize should succeed");
        
        let result = finalize_statement(stmt_handle);
        assert!(result.is_err(), "Second finalize should fail");
        
        close_database(db_handle).expect("Failed to close database");
    }
}
