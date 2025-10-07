/// Tests for Send trait implementation on SqliteIndexedDB
/// This ensures the database can be safely sent between threads (required for Tauri commands)

#[cfg(feature = "fs_persist")]
#[tokio::test]
async fn test_sqlite_indexeddb_is_send() {
    use absurder_sql::{SqliteIndexedDB, DatabaseConfig};
    use tempfile::TempDir;
    
    // This test will fail to compile if SqliteIndexedDB is not Send
    fn assert_send<T: Send>() {}
    assert_send::<SqliteIndexedDB>();
    
    // Setup isolated filesystem for this test
    let temp_dir = TempDir::new().expect("Failed to create temp dir");
    unsafe {
        std::env::set_var("DATASYNC_FS_BASE", temp_dir.path());
    }
    
    // Also test that we can actually send it across threads
    let config = DatabaseConfig {
        name: "test_send.db".to_string(),
        version: Some(1),
        cache_size: Some(2000),
        page_size: None,
        auto_vacuum: None,
        journal_mode: None,
    };
    
    let db = SqliteIndexedDB::new(config).await.expect("Failed to create database");
    
    // Try to send the database to another task
    let handle = tokio::task::spawn(async move {
        let _db = db; // Move db into this task
        "Database successfully sent across threads"
    });
    
    let result = handle.await.expect("Task failed");
    assert_eq!(result, "Database successfully sent across threads");
}

#[cfg(feature = "fs_persist")]
#[tokio::test]
async fn test_database_operations_across_threads() {
    use absurder_sql::{SqliteIndexedDB, DatabaseConfig};
    use tempfile::TempDir;
    
    // Setup isolated filesystem for this test
    let temp_dir = TempDir::new().expect("Failed to create temp dir");
    unsafe {
        std::env::set_var("DATASYNC_FS_BASE", temp_dir.path());
    }
    
    // Test that we can create a database in one task and use it in another
    let config = DatabaseConfig {
        name: "test_thread_ops.db".to_string(),
        version: Some(1),
        cache_size: Some(2000),
        page_size: None,
        auto_vacuum: None,
        journal_mode: None,
    };
    
    let mut db = SqliteIndexedDB::new(config).await.expect("Failed to create database");
    
    // Create a table
    db.execute("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, value TEXT)")
        .await
        .expect("Failed to create table");
    
    // Send to another thread for insert
    let handle = tokio::task::spawn(async move {
        db.execute("INSERT INTO test (value) VALUES ('test_value')")
            .await
            .expect("Failed to insert");
        db // Return the database
    });
    
    let mut db = handle.await.expect("Task failed");
    
    // Query from main thread
    let result = db.execute("SELECT * FROM test")
        .await
        .expect("Failed to select");
    
    assert_eq!(result.rows.len(), 1);
}
