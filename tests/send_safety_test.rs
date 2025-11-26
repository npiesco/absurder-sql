/// Tests for Send trait implementation on SqliteIndexedDB
/// This ensures the database can be safely sent between threads (required for Tauri commands)

#[cfg(feature = "fs_persist")]
use serial_test::serial;

#[cfg(feature = "fs_persist")]
#[tokio::test]
#[serial]
async fn test_sqlite_indexeddb_is_send() {
    use absurder_sql::{DatabaseConfig, SqliteIndexedDB};
    use tempfile::TempDir;

    // This test will fail to compile if SqliteIndexedDB is not Send
    fn assert_send<T: Send>() {}
    assert_send::<SqliteIndexedDB>();

    // Setup isolated filesystem for this test
    let temp_dir = TempDir::new().expect("Failed to create temp dir");
    unsafe {
        std::env::set_var("ABSURDERSQL_FS_BASE", temp_dir.path());
    }

    // Also test that we can actually send it across threads
    let config = DatabaseConfig {
        name: "test_send.db".to_string(),
        cache_size: Some(2000),
        ..Default::default()
    };

    let db = SqliteIndexedDB::new(config)
        .await
        .expect("Failed to create database");

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
#[serial]
async fn test_database_operations_across_threads() {
    use absurder_sql::{DatabaseConfig, SqliteIndexedDB};
    use tempfile::TempDir;

    // Setup isolated filesystem for this test
    let _temp_dir = TempDir::new().expect("Failed to create temp dir");
    let temp_path = _temp_dir.path().to_path_buf();
    unsafe {
        std::env::set_var("ABSURDERSQL_FS_BASE", &temp_path);
    }

    // Test that we can create a database in one task and use it in another
    let config = DatabaseConfig {
        name: "test_thread_ops.db".to_string(),
        cache_size: Some(2000),
        journal_mode: Some("DELETE".to_string()), // Use DELETE mode for thread-safe testing
        ..Default::default()
    };

    let mut db = SqliteIndexedDB::new(config)
        .await
        .expect("Failed to create database");

    // Create a table and insert in same context to avoid journal lock issues
    db.execute("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, value TEXT)")
        .await
        .expect("Failed to create table");

    db.execute("INSERT INTO test (value) VALUES ('test_value')")
        .await
        .expect("Failed to insert");

    // Now test that we can send to another thread for query
    let handle = tokio::task::spawn(async move {
        let result = db
            .execute("SELECT * FROM test")
            .await
            .expect("Failed to select");
        (db, result)
    });

    let (_db, result) = handle.await.expect("Task failed");

    assert_eq!(result.rows.len(), 1);

    // Keep temp_dir alive until end
    drop(_temp_dir);
}
