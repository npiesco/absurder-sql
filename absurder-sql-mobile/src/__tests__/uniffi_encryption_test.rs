/// Tests for UniFFI encryption functions
/// 
/// Tests database encryption with SQLCipher

#[cfg(test)]
mod uniffi_encryption_tests {
    use crate::uniffi_api::*;
    use serial_test::serial;

    #[test]
    #[serial]
    fn test_create_encrypted_database() {
        let _ = env_logger::builder().is_test(true).try_init();
        
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_encrypted_{:?}.db", thread_id),
            encryption_key: Some("test_password_12345".to_string()),
        };
        
        let handle = create_encrypted_database(config).expect("Failed to create encrypted database");
        assert!(handle > 0, "Handle should be valid");
        
        // Verify we can execute queries
        execute(handle, "DROP TABLE IF EXISTS test".to_string()).ok();
        execute(handle, "CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT)".to_string())
            .expect("Failed to create table");
        
        execute(handle, "INSERT INTO test (data) VALUES ('encrypted_data')".to_string())
            .expect("Failed to insert");
        
        let result = execute(handle, "SELECT * FROM test".to_string())
            .expect("Failed to query");
        assert_eq!(result.rows.len(), 1, "Should have 1 row");
        
        close_database(handle).expect("Failed to close database");
        
        // Cleanup: delete test database file
        let db_path = format!("uniffi_encrypted_{:?}.db", thread_id);
        let _ = std::fs::remove_file(&db_path);
    }

    #[test]
    #[serial]
    fn test_encrypted_database_key_required() {
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_encrypted_nokey_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let result = create_encrypted_database(config);
        assert!(result.is_err(), "Should fail without encryption key");
    }

    #[test]
    #[serial]
    fn test_encrypted_database_short_key() {
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_encrypted_short_{:?}.db", thread_id),
            encryption_key: Some("short".to_string()),
        };
        
        let result = create_encrypted_database(config);
        assert!(result.is_err(), "Should fail with short key");
    }

    #[test]
    #[serial]
    fn test_rekey_database() {
        let _ = env_logger::builder().is_test(true).try_init();
        
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_rekey_{:?}.db", thread_id),
            encryption_key: Some("original_password_123".to_string()),
        };
        
        let handle = create_encrypted_database(config).expect("Failed to create encrypted database");
        
        // Create table and insert data
        execute(handle, "DROP TABLE IF EXISTS users".to_string()).ok();
        execute(handle, "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)".to_string())
            .expect("Failed to create table");
        execute(handle, "INSERT INTO users (name) VALUES ('Alice')".to_string())
            .expect("Failed to insert");
        
        // Rekey the database
        rekey_database(handle, "new_password_456".to_string())
            .expect("Failed to rekey database");
        
        // Verify data is still accessible
        let result = execute(handle, "SELECT * FROM users".to_string())
            .expect("Failed to query after rekey");
        assert_eq!(result.rows.len(), 1, "Should still have 1 row after rekey");
        
        close_database(handle).expect("Failed to close database");
        
        // Cleanup: delete test database file
        let db_path = format!("uniffi_rekey_{:?}.db", thread_id);
        let _ = std::fs::remove_file(&db_path);
    }

    #[test]
    #[serial]
    fn test_rekey_invalid_handle() {
        let result = rekey_database(999999, "new_password_123".to_string());
        assert!(result.is_err(), "Should fail with invalid handle");
    }

    #[test]
    #[serial]
    fn test_rekey_short_key() {
        let _ = env_logger::builder().is_test(true).try_init();
        
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_rekey_short_{:?}.db", thread_id),
            encryption_key: Some("original_pass_123".to_string()),
        };
        
        let handle = create_encrypted_database(config).expect("Failed to create encrypted database");
        
        let result = rekey_database(handle, "short".to_string());
        assert!(result.is_err(), "Should fail with short key");
        
        close_database(handle).expect("Failed to close database");
        
        // Cleanup: delete test database file
        let db_path = format!("uniffi_rekey_short_{:?}.db", thread_id);
        let _ = std::fs::remove_file(&db_path);
    }

    #[test]
    #[serial]
    fn test_encrypted_database_isolation() {
        let _ = env_logger::builder().is_test(true).try_init();
        
        let thread_id = std::thread::current().id();
        
        // Create first encrypted database
        let config1 = DatabaseConfig {
            name: format!("uniffi_enc1_{:?}.db", thread_id),
            encryption_key: Some("password_one_123".to_string()),
        };
        let handle1 = create_encrypted_database(config1).expect("Failed to create db1");
        
        execute(handle1, "DROP TABLE IF EXISTS data1".to_string()).ok();
        execute(handle1, "CREATE TABLE data1 (value TEXT)".to_string()).expect("Failed to create table");
        execute(handle1, "INSERT INTO data1 VALUES ('secret1')".to_string()).expect("Failed to insert");
        
        // Create second encrypted database with different key
        let config2 = DatabaseConfig {
            name: format!("uniffi_enc2_{:?}.db", thread_id),
            encryption_key: Some("password_two_456".to_string()),
        };
        let handle2 = create_encrypted_database(config2).expect("Failed to create db2");
        
        execute(handle2, "DROP TABLE IF EXISTS data2".to_string()).ok();
        execute(handle2, "CREATE TABLE data2 (value TEXT)".to_string()).expect("Failed to create table");
        execute(handle2, "INSERT INTO data2 VALUES ('secret2')".to_string()).expect("Failed to insert");
        
        // Verify each database has its own data
        let result1 = execute(handle1, "SELECT * FROM data1".to_string()).expect("Failed to query db1");
        assert_eq!(result1.rows.len(), 1, "DB1 should have 1 row");
        
        let result2 = execute(handle2, "SELECT * FROM data2".to_string()).expect("Failed to query db2");
        assert_eq!(result2.rows.len(), 1, "DB2 should have 1 row");
        
        close_database(handle1).expect("Failed to close db1");
        close_database(handle2).expect("Failed to close db2");
        
        // Cleanup: delete test database files
        let db_path1 = format!("uniffi_enc1_{:?}.db", thread_id);
        let db_path2 = format!("uniffi_enc2_{:?}.db", thread_id);
        let _ = std::fs::remove_file(&db_path1);
        let _ = std::fs::remove_file(&db_path2);
    }

    #[test]
    #[serial]
    fn test_encrypted_with_transactions() {
        let _ = env_logger::builder().is_test(true).try_init();
        
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_enc_txn_{:?}.db", thread_id),
            encryption_key: Some("transaction_key_123".to_string()),
        };
        
        let handle = create_encrypted_database(config).expect("Failed to create encrypted database");
        
        execute(handle, "DROP TABLE IF EXISTS items".to_string()).ok();
        execute(handle, "CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)".to_string())
            .expect("Failed to create table");
        
        // Test transaction
        begin_transaction(handle).expect("Failed to begin transaction");
        execute(handle, "INSERT INTO items (name) VALUES ('item1')".to_string())
            .expect("Failed to insert");
        commit(handle).expect("Failed to commit");
        
        let result = execute(handle, "SELECT * FROM items".to_string())
            .expect("Failed to query");
        assert_eq!(result.rows.len(), 1, "Should have 1 row after commit");
        
        close_database(handle).expect("Failed to close database");
        
        // Cleanup: delete test database file
        let db_path = format!("uniffi_enc_txn_{:?}.db", thread_id);
        let _ = std::fs::remove_file(&db_path);
    }
}
