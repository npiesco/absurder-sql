/// Tests for UniFFI export and import functions
/// 
/// Tests database backup (export) and restore (import) operations

#[cfg(test)]
mod uniffi_export_import_tests {
    use crate::uniffi_api::*;
    use crate::registry::RUNTIME;
    use serial_test::serial;
    use std::path::PathBuf;

    #[test]
    #[serial]
    fn test_export_database() {
        let _ = env_logger::builder().is_test(true).try_init();
        
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_export_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };
        
        let handle = RUNTIME.block_on(async { create_database(config).await }).expect("Failed to create database");
        
        // Create table and insert data
        execute(handle, "DROP TABLE IF EXISTS users".to_string()).ok();
        execute(handle, "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)".to_string())
            .expect("Failed to create table");
        execute(handle, "INSERT INTO users (name) VALUES ('Alice')".to_string())
            .expect("Failed to insert");
        execute(handle, "INSERT INTO users (name) VALUES ('Bob')".to_string())
            .expect("Failed to insert");
        
        // Export database
        let export_path = format!("/tmp/uniffi_export_{:?}.db", thread_id);
        let export_result = export_database(handle, export_path.clone());
        assert!(export_result.is_ok(), "Export should succeed: {:?}", export_result.err());
        
        // Verify export file exists
        let path = PathBuf::from(&export_path);
        assert!(path.exists(), "Export file should exist");
        
        // Clean up
        close_database(handle).expect("Failed to close database");
        std::fs::remove_file(export_path).ok();
    }

    #[test]
    #[serial]
    fn test_import_database() {
        let thread_id = std::thread::current().id();
        
        // First, create and export a database
        let source_config = DatabaseConfig {
            name: format!("uniffi_import_source_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };
        
        let source_handle = RUNTIME.block_on(async { create_database(source_config).await }).expect("Failed to create source database");
        
        // Create table and insert data
        execute(source_handle, "DROP TABLE IF EXISTS products".to_string()).ok();
        execute(source_handle, "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL)".to_string())
            .expect("Failed to create table");
        execute(source_handle, "INSERT INTO products (name, price) VALUES ('Widget', 9.99)".to_string())
            .expect("Failed to insert");
        execute(source_handle, "INSERT INTO products (name, price) VALUES ('Gadget', 19.99)".to_string())
            .expect("Failed to insert");
        
        // Export to file
        let backup_path = format!("/tmp/uniffi_import_{:?}.db", thread_id);
        export_database(source_handle, backup_path.clone())
            .expect("Failed to export");
        close_database(source_handle).expect("Failed to close source");
        
        // Now create a new database and import
        let target_config = DatabaseConfig {
            name: format!("uniffi_import_target_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };
        
        let target_handle = RUNTIME.block_on(async { create_database(target_config).await }).expect("Failed to create target database");
        
        // Import from backup
        let import_result = import_database(target_handle, backup_path.clone());
        assert!(import_result.is_ok(), "Import should succeed: {:?}", import_result.err());
        
        // Verify data was imported
        let result = execute(target_handle, "SELECT COUNT(*) FROM products".to_string())
            .expect("Failed to query");
        assert_eq!(result.rows.len(), 1, "Should have 1 row");
        
        // Clean up
        close_database(target_handle).expect("Failed to close target");
        std::fs::remove_file(backup_path).ok();
    }

    #[test]
    #[serial]
    fn test_export_import_round_trip() {
        let thread_id = std::thread::current().id();
        
        // Create original database
        let original_config = DatabaseConfig {
            name: format!("uniffi_roundtrip_orig_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };
        
        let original_handle = RUNTIME.block_on(async { create_database(original_config).await }).expect("Failed to create database");
        
        // Create schema and data
        execute(original_handle, "DROP TABLE IF EXISTS items".to_string()).ok();
        execute(original_handle, "CREATE TABLE items (id INTEGER PRIMARY KEY, value TEXT)".to_string())
            .expect("Failed to create table");
        for i in 0..100 {
            execute(original_handle, format!("INSERT INTO items (value) VALUES ('item_{}')", i))
                .expect("Failed to insert");
        }
        
        // Export
        let backup_path = format!("/tmp/uniffi_roundtrip_{:?}.db", thread_id);
        export_database(original_handle, backup_path.clone())
            .expect("Failed to export");
        
        // Get count from original
        let original_count = execute(original_handle, "SELECT COUNT(*) FROM items".to_string())
            .expect("Failed to query original");
        
        close_database(original_handle).expect("Failed to close original");
        
        // Create new database and import
        let restored_config = DatabaseConfig {
            name: format!("uniffi_roundtrip_restored_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };
        
        let restored_handle = RUNTIME.block_on(async { create_database(restored_config).await }).expect("Failed to create restored database");
        import_database(restored_handle, backup_path.clone())
            .expect("Failed to import");
        
        // Verify data matches
        let restored_count = execute(restored_handle, "SELECT COUNT(*) FROM items".to_string())
            .expect("Failed to query restored");
        
        assert_eq!(original_count.rows.len(), restored_count.rows.len(), "Row counts should match");
        
        // Clean up
        close_database(restored_handle).expect("Failed to close restored");
        std::fs::remove_file(backup_path).ok();
    }

    #[test]
    #[serial]
    fn test_export_invalid_handle() {
        let result = export_database(999999, "/tmp/invalid.db".to_string());
        assert!(result.is_err(), "Export with invalid handle should fail");
    }

    #[test]
    #[serial]
    fn test_import_invalid_handle() {
        let result = import_database(999999, "/tmp/invalid.db".to_string());
        assert!(result.is_err(), "Import with invalid handle should fail");
    }

    #[test]
    #[serial]
    fn test_import_nonexistent_file() {
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_import_nofile_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };
        
        let handle = RUNTIME.block_on(async { create_database(config).await }).expect("Failed to create database");
        
        let result = import_database(handle, "/tmp/nonexistent_file_12345.db".to_string());
        assert!(result.is_err(), "Import of nonexistent file should fail");
        
        close_database(handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_export_import_with_blobs() {
        let _ = env_logger::builder().is_test(true).try_init();
        
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_blobs_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };
        
        let handle = RUNTIME.block_on(async { create_database(config).await }).expect("Failed to create database");
        
        // Create table with BLOB column
        execute(handle, "DROP TABLE IF EXISTS blob_test".to_string()).ok();
        execute(handle, "CREATE TABLE blob_test (id INTEGER PRIMARY KEY, data BLOB)".to_string())
            .expect("Failed to create table");
        
        // Insert blob data using SQLite's hex literal format
        execute(handle, "INSERT INTO blob_test (data) VALUES (X'48656C6C6F')".to_string())
            .expect("Failed to insert blob 1"); // "Hello" in hex
        execute(handle, "INSERT INTO blob_test (data) VALUES (X'576F726C64')".to_string())
            .expect("Failed to insert blob 2"); // "World" in hex
        execute(handle, "INSERT INTO blob_test (data) VALUES (X'DEADBEEF')".to_string())
            .expect("Failed to insert blob 3"); // Random bytes
        
        // Export database
        let backup_path = format!("/tmp/uniffi_blob_backup_{:?}.db", thread_id);
        export_database(handle, backup_path.clone())
            .expect("Failed to export database with blobs");
        
        close_database(handle).expect("Failed to close original database");
        
        // Import to new database
        let restored_config = DatabaseConfig {
            name: format!("uniffi_blobs_restored_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };
        
        let restored_handle = RUNTIME.block_on(async { create_database(restored_config).await }).expect("Failed to create restored database");
        import_database(restored_handle, backup_path.clone())
            .expect("Failed to import database with blobs");
        
        // Verify blob data is preserved
        let result = execute(restored_handle, "SELECT hex(data) as hex_data FROM blob_test ORDER BY id".to_string())
            .expect("Failed to query restored blobs");
        
        assert_eq!(result.rows.len(), 3, "Should have 3 blob rows");
        
        // Verify the hex values match what we inserted (typed rows)
        use crate::uniffi_api::ColumnValue;
        fn get_text_value(row: &crate::uniffi_api::Row, idx: usize) -> String {
            match &row.values[idx] {
                ColumnValue::Text { value } => value.clone(),
                _ => String::new(),
            }
        }
        assert!(get_text_value(&result.rows[0], 0).contains("48656C6C6F"), "First blob should be 'Hello' in hex");
        assert!(get_text_value(&result.rows[1], 0).contains("576F726C64"), "Second blob should be 'World' in hex");
        assert!(get_text_value(&result.rows[2], 0).contains("DEADBEEF"), "Third blob should be DEADBEEF");
        
        // Clean up
        close_database(restored_handle).expect("Failed to close restored database");
        std::fs::remove_file(backup_path).ok();
        
        let db_path1 = format!("uniffi_blobs_{:?}.db", thread_id);
        let db_path2 = format!("uniffi_blobs_restored_{:?}.db", thread_id);
        let _ = std::fs::remove_file(&db_path1);
        let _ = std::fs::remove_file(&db_path2);
    }

    /// Test export/import round-trip with ENCRYPTED database
    /// 
    /// This is the critical test for vault backup/restore functionality.
    /// When a database is encrypted with SQLCipher, the exported file (via VACUUM INTO)
    /// is also encrypted with the same key. The import function must be able to
    /// read this encrypted backup file.
    #[test]
    #[serial]
    fn test_encrypted_export_import_round_trip() {
        let _ = env_logger::builder().is_test(true).try_init();
        
        let thread_id = std::thread::current().id();
        let encryption_key = "test-vault-password-123!";
        
        // Create encrypted database (simulating a vault)
        let original_config = DatabaseConfig {
            name: format!("uniffi_encrypted_roundtrip_orig_{:?}.db", thread_id),
            encryption_key: Some(encryption_key.to_string()),
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };
        
        let original_handle = RUNTIME.block_on(async { create_database(original_config).await })
            .expect("Failed to create encrypted database");
        
        // Create schema and data (simulating vault credentials)
        execute(original_handle, "DROP TABLE IF EXISTS credentials".to_string()).ok();
        execute(original_handle, "CREATE TABLE credentials (id INTEGER PRIMARY KEY, name TEXT, username TEXT, password TEXT)".to_string())
            .expect("Failed to create credentials table");
        execute(original_handle, "INSERT INTO credentials (name, username, password) VALUES ('GitHub', 'user1', 'secret123')".to_string())
            .expect("Failed to insert credential 1");
        execute(original_handle, "INSERT INTO credentials (name, username, password) VALUES ('Gmail', 'user2', 'password456')".to_string())
            .expect("Failed to insert credential 2");
        execute(original_handle, "INSERT INTO credentials (name, username, password) VALUES ('AWS', 'admin', 'aws-key-789')".to_string())
            .expect("Failed to insert credential 3");
        
        // Export encrypted database
        let backup_path = format!("/tmp/uniffi_encrypted_roundtrip_{:?}.db", thread_id);
        export_database(original_handle, backup_path.clone())
            .expect("Failed to export encrypted database");
        
        // Verify export file exists
        let path = PathBuf::from(&backup_path);
        assert!(path.exists(), "Encrypted export file should exist");
        
        // Get count from original before closing
        let original_result = execute(original_handle, "SELECT COUNT(*) as cnt FROM credentials".to_string())
            .expect("Failed to query original");
        assert_eq!(original_result.rows.len(), 1, "Should have count row");
        
        close_database(original_handle).expect("Failed to close original");
        
        // Create NEW encrypted database with SAME key and import
        // This simulates restoring a vault backup
        let restored_config = DatabaseConfig {
            name: format!("uniffi_encrypted_roundtrip_restored_{:?}.db", thread_id),
            encryption_key: Some(encryption_key.to_string()),
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };
        
        let restored_handle = RUNTIME.block_on(async { create_database(restored_config).await })
            .expect("Failed to create restored encrypted database");
        
        // Import from encrypted backup - THIS IS THE KEY TEST
        // The backup file is encrypted, so import_database must handle this
        let import_result = import_database(restored_handle, backup_path.clone());
        assert!(import_result.is_ok(), "Import of encrypted backup should succeed: {:?}", import_result.err());
        
        // Verify data was imported correctly
        let restored_result = execute(restored_handle, "SELECT COUNT(*) as cnt FROM credentials".to_string())
            .expect("Failed to query restored");
        assert_eq!(restored_result.rows.len(), 1, "Should have count row");
        
        // Verify actual credential data
        let credentials = execute(restored_handle, "SELECT name, username, password FROM credentials ORDER BY id".to_string())
            .expect("Failed to query credentials");
        assert_eq!(credentials.rows.len(), 3, "Should have 3 credentials");
        
        // Clean up
        close_database(restored_handle).expect("Failed to close restored");
        std::fs::remove_file(&backup_path).ok();
    }
}
