// Test that native Database API actually persists to filesystem

#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
mod native_persistence_tests {
    use absurder_sql::{database::SqliteIndexedDB, types::DatabaseConfig};
    use serial_test::serial;
    use std::fs;
    use tempfile::TempDir;

    #[tokio::test]
    #[serial]
    async fn test_native_database_creates_filesystem_storage() {
        // Setup temp directory
        let temp_dir = TempDir::new().unwrap();
        unsafe {
            std::env::set_var("ABSURDERSQL_FS_BASE", temp_dir.path().to_str().unwrap());
        }

        let config = DatabaseConfig {
            name: "test_native_persist.db".to_string(),
            cache_size: Some(2000),
            ..Default::default()
        };

        // Create database and execute commands
        let mut db = SqliteIndexedDB::new(config).await.unwrap();
        db.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)")
            .await
            .unwrap();
        db.execute("INSERT INTO users (name) VALUES ('Alice')")
            .await
            .unwrap();
        db.sync().await.unwrap();
        db.close().await.unwrap();

        // Verify filesystem structure exists
        let storage_path = temp_dir.path().join("test_native_persist");
        assert!(storage_path.exists(), "Storage directory should exist");

        // Verify SQLite database file exists
        let db_file_path = storage_path.join("database.sqlite");
        assert!(db_file_path.exists(), "SQLite database file should exist");

        // Verify database file has content
        let file_size = fs::metadata(&db_file_path).unwrap().len();
        assert!(file_size > 0, "Database file should not be empty");

        // Verify BlockStorage structure exists
        let blocks_path = storage_path.join("blocks");
        assert!(blocks_path.exists(), "Blocks directory should exist");

        let metadata_path = storage_path.join("metadata.json");
        assert!(metadata_path.exists(), "Metadata file should exist");

        unsafe {
            std::env::remove_var("ABSURDERSQL_FS_BASE");
        }
    }

    #[tokio::test]
    #[serial]
    async fn test_native_database_persists_data_across_restarts() {
        // Setup temp directory
        let temp_dir = TempDir::new().unwrap();
        unsafe {
            std::env::set_var("ABSURDERSQL_FS_BASE", temp_dir.path().to_str().unwrap());
        }

        let config = DatabaseConfig {
            name: "test_restart.db".to_string(),
            cache_size: Some(2000),
            ..Default::default()
        };

        // First session: create and insert data
        {
            let mut db = SqliteIndexedDB::new(config.clone()).await.unwrap();
            db.execute("CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT)")
                .await
                .unwrap();
            db.execute("INSERT INTO products (name) VALUES ('Laptop')")
                .await
                .unwrap();
            db.execute("INSERT INTO products (name) VALUES ('Mouse')")
                .await
                .unwrap();
            db.sync().await.unwrap();
            db.close().await.unwrap();
        }

        // Second session: reopen and verify data persisted
        {
            let mut db = SqliteIndexedDB::new(config).await.unwrap();
            let result = db
                .execute("SELECT name FROM products ORDER BY id")
                .await
                .unwrap();

            assert_eq!(result.rows.len(), 2, "Should have 2 rows");
            assert_eq!(result.columns, vec!["name"]);

            // Verify data
            if let absurder_sql::types::ColumnValue::Text(name) = &result.rows[0].values[0] {
                assert_eq!(name, "Laptop");
            } else {
                panic!("Expected Text column value");
            }

            if let absurder_sql::types::ColumnValue::Text(name) = &result.rows[1].values[0] {
                assert_eq!(name, "Mouse");
            } else {
                panic!("Expected Text column value");
            }

            db.close().await.unwrap();
        }

        unsafe {
            std::env::remove_var("ABSURDERSQL_FS_BASE");
        }
    }

    #[tokio::test]
    #[serial]
    async fn test_native_database_sync_writes_to_disk() {
        // Setup temp directory
        let temp_dir = TempDir::new().unwrap();
        unsafe {
            std::env::set_var("ABSURDERSQL_FS_BASE", temp_dir.path().to_str().unwrap());
        }

        let config = DatabaseConfig {
            name: "test_sync.db".to_string(),
            cache_size: Some(2000),
            ..Default::default()
        };

        let mut db = SqliteIndexedDB::new(config).await.unwrap();
        db.execute("CREATE TABLE items (id INTEGER PRIMARY KEY)")
            .await
            .unwrap();

        // Before sync - might not be on disk yet
        let storage_path = temp_dir.path().join("test_sync");

        // After sync - must be on disk
        db.sync().await.unwrap();

        let metadata_path = storage_path.join("metadata.json");
        assert!(metadata_path.exists(), "Metadata should exist after sync");

        // Metadata should have content
        let metadata_content = fs::read_to_string(metadata_path).unwrap();
        assert!(metadata_content.len() > 0, "Metadata should not be empty");

        db.close().await.unwrap();
        unsafe {
            std::env::remove_var("ABSURDERSQL_FS_BASE");
        }
    }
}
