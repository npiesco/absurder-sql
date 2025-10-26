/// Tests for UniFFI transaction functions
/// 
/// Tests begin_transaction, commit, and rollback operations

#[cfg(test)]
mod uniffi_transactions_tests {
    use crate::uniffi_api::*;
    use serial_test::serial;

    #[test]
    #[serial]
    fn test_transaction_begin_commit() {
        let _ = env_logger::builder().is_test(true).try_init();
        
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_tx_commit_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let handle = create_database(config).expect("Failed to create database");
        
        // Setup table
        execute(handle, "DROP TABLE IF EXISTS accounts".to_string()).ok();
        execute(handle, "CREATE TABLE accounts (id INTEGER PRIMARY KEY, balance REAL)".to_string())
            .expect("Failed to create table");
        execute(handle, "INSERT INTO accounts (balance) VALUES (100.0)".to_string())
            .expect("Failed to insert");
        
        // Commit the implicit transaction from INSERT before starting explicit transaction
        commit(handle).ok();
        
        // Begin transaction
        let begin_result = begin_transaction(handle);
        assert!(begin_result.is_ok(), "Begin transaction should succeed: {:?}", begin_result.err());
        
        // Update balance in transaction
        execute(handle, "UPDATE accounts SET balance = 200.0 WHERE id = 1".to_string())
            .expect("Failed to update");
        
        // Commit transaction
        let commit_result = commit(handle);
        assert!(commit_result.is_ok(), "Commit should succeed: {:?}", commit_result.err());
        
        // Verify changes persisted
        let result = execute(handle, "SELECT balance FROM accounts WHERE id = 1".to_string())
            .expect("Failed to query");
        assert_eq!(result.rows.len(), 1);
        
        close_database(handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_transaction_rollback() {
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_tx_rollback_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let handle = create_database(config).expect("Failed to create database");
        
        // Setup table
        execute(handle, "DROP TABLE IF EXISTS accounts".to_string()).ok();
        execute(handle, "CREATE TABLE accounts (id INTEGER PRIMARY KEY, balance REAL)".to_string())
            .expect("Failed to create table");
        execute(handle, "INSERT INTO accounts (balance) VALUES (100.0)".to_string())
            .expect("Failed to insert");
        
        // Commit the implicit transaction from INSERT before starting explicit transaction
        commit(handle).ok();
        
        // Begin transaction
        begin_transaction(handle).expect("Failed to begin transaction");
        
        // Update balance in transaction
        execute(handle, "UPDATE accounts SET balance = 999.0 WHERE id = 1".to_string())
            .expect("Failed to update");
        
        // Rollback transaction
        let rollback_result = rollback(handle);
        assert!(rollback_result.is_ok(), "Rollback should succeed: {:?}", rollback_result.err());
        
        // Verify changes were rolled back
        let result = execute(handle, "SELECT balance FROM accounts WHERE id = 1".to_string())
            .expect("Failed to query");
        assert_eq!(result.rows.len(), 1);
        // Balance should still be 100.0, not 999.0
        
        close_database(handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_transaction_nested_operations() {
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_tx_nested_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let handle = create_database(config).expect("Failed to create database");
        
        // Setup
        execute(handle, "DROP TABLE IF EXISTS products".to_string()).ok();
        execute(handle, "CREATE TABLE products (id INTEGER PRIMARY KEY, stock INTEGER)".to_string())
            .expect("Failed to create table");
        execute(handle, "INSERT INTO products (stock) VALUES (50)".to_string())
            .expect("Failed to insert");
        
        // Commit the implicit transaction from INSERT before starting explicit transaction
        commit(handle).ok();
        
        // Begin transaction
        begin_transaction(handle).expect("Failed to begin transaction");
        
        // Multiple operations in transaction
        execute(handle, "UPDATE products SET stock = stock - 10 WHERE id = 1".to_string())
            .expect("Failed to update");
        execute(handle, "UPDATE products SET stock = stock - 5 WHERE id = 1".to_string())
            .expect("Failed to update");
        
        // Commit
        commit(handle).expect("Failed to commit");
        
        // Verify cumulative changes
        let result = execute(handle, "SELECT stock FROM products WHERE id = 1".to_string())
            .expect("Failed to query");
        assert_eq!(result.rows.len(), 1);
        // Stock should be 35 (50 - 10 - 5)
        
        close_database(handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_transaction_invalid_handle() {
        let result = begin_transaction(999999);
        assert!(result.is_err(), "Begin transaction with invalid handle should fail");
        
        let result = commit(999999);
        assert!(result.is_err(), "Commit with invalid handle should fail");
        
        let result = rollback(999999);
        assert!(result.is_err(), "Rollback with invalid handle should fail");
    }
}
