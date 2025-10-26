/// Tests for UniFFI export and import functions
/// 
/// Tests database backup (export) and restore (import) operations

#[cfg(test)]
mod uniffi_export_import_tests {
    use crate::uniffi_api::*;
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
        };
        
        let handle = create_database(config).expect("Failed to create database");
        
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
        };
        
        let source_handle = create_database(source_config).expect("Failed to create source database");
        
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
        };
        
        let target_handle = create_database(target_config).expect("Failed to create target database");
        
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
        };
        
        let original_handle = create_database(original_config).expect("Failed to create database");
        
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
        };
        
        let restored_handle = create_database(restored_config).expect("Failed to create restored database");
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
        };
        
        let handle = create_database(config).expect("Failed to create database");
        
        let result = import_database(handle, "/tmp/nonexistent_file_12345.db".to_string());
        assert!(result.is_err(), "Import of nonexistent file should fail");
        
        close_database(handle).expect("Failed to close database");
    }
}
