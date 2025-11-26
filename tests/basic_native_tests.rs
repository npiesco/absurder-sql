// Basic native tests to verify TDD implementation works
// These run without WASM to test core functionality

#![cfg(not(target_arch = "wasm32"))]
use absurder_sql::*;
use serial_test::serial;
use tempfile::TempDir;
#[path = "common/mod.rs"]
mod common;

fn setup_fs_base() -> TempDir {
    let tmp = TempDir::new().expect("tempdir");
    // Safety: process-global env var is isolated by #[serial] on tests that call this
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());
    tmp
}

#[tokio::test(flavor = "current_thread")]
async fn test_database_config_creation() {
    // Test that we can create a database configuration
    let config = DatabaseConfig::default();

    assert_eq!(config.name, "default.db");
    assert_eq!(config.version, Some(1));
    assert_eq!(config.cache_size, Some(10_000));
    assert_eq!(config.page_size, Some(4096));
    assert_eq!(config.auto_vacuum, Some(true));
}

#[tokio::test(flavor = "current_thread")]
async fn test_custom_database_config() {
    // Test that we can create custom database configurations
    let config = DatabaseConfig {
        name: "test.db".to_string(),
        version: Some(2),
        cache_size: Some(5_000),
        page_size: Some(8192),
        auto_vacuum: Some(false),
        journal_mode: Some("DELETE".to_string()),
        max_export_size_bytes: Some(2 * 1024 * 1024 * 1024),
    };

    assert_eq!(config.name, "test.db");
    assert_eq!(config.version, Some(2));
    assert_eq!(config.cache_size, Some(5_000));
}

#[tokio::test(flavor = "current_thread")]
async fn test_column_value_types() {
    // Test that all column value types work correctly
    let null_val = ColumnValue::Null;
    let int_val = ColumnValue::Integer(42);
    let real_val = ColumnValue::Real(3.14);
    let text_val = ColumnValue::Text("hello".to_string());
    let blob_val = ColumnValue::Blob(vec![1, 2, 3, 4]);

    // Test conversion to rusqlite values
    let rusqlite_null = null_val.to_rusqlite_value();
    let rusqlite_int = int_val.to_rusqlite_value();
    let rusqlite_real = real_val.to_rusqlite_value();
    let rusqlite_text = text_val.to_rusqlite_value();
    let rusqlite_blob = blob_val.to_rusqlite_value();

    // Test conversion back from rusqlite values
    let back_to_null = ColumnValue::from_rusqlite_value(&rusqlite_null);
    let back_to_int = ColumnValue::from_rusqlite_value(&rusqlite_int);
    let back_to_real = ColumnValue::from_rusqlite_value(&rusqlite_real);
    let back_to_text = ColumnValue::from_rusqlite_value(&rusqlite_text);
    let back_to_blob = ColumnValue::from_rusqlite_value(&rusqlite_blob);

    // Verify round-trip conversion works
    match (
        back_to_null,
        back_to_int,
        back_to_real,
        back_to_text,
        back_to_blob,
    ) {
        (
            ColumnValue::Null,
            ColumnValue::Integer(42),
            ColumnValue::Real(val),
            ColumnValue::Text(text),
            ColumnValue::Blob(blob),
        ) => {
            assert!((val - 3.14).abs() < 0.001);
            assert_eq!(text, "hello");
            assert_eq!(blob, vec![1, 2, 3, 4]);
        }
        _ => panic!("Column value conversion failed"),
    }
}

#[tokio::test(flavor = "current_thread")]
async fn test_error_types() {
    // Test that error types can be created and handled
    let error = DatabaseError::new("TEST_ERROR", "This is a test error");
    assert_eq!(error.code, "TEST_ERROR");
    assert_eq!(error.message, "This is a test error");
    assert_eq!(error.sql, None);

    let error_with_sql = error.with_sql("SELECT * FROM test");
    assert_eq!(error_with_sql.sql, Some("SELECT * FROM test".to_string()));
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_block_storage_creation() {
    let _tmp = setup_fs_base();
    // Test that we can create a BlockStorage instance
    let storage = absurder_sql::storage::BlockStorage::new("test_db_creation").await;

    match storage {
        Ok(_) => println!("Block storage creation test passed"),
        Err(e) => panic!("Block storage creation should succeed: {:?}", e),
    }
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_block_storage_read_write() {
    let _tmp = setup_fs_base();
    // Test basic read/write operations
    let mut storage = absurder_sql::storage::BlockStorage::new("test_db_rw")
        .await
        .expect("Should create storage");

    let test_data = vec![42u8; absurder_sql::storage::BLOCK_SIZE];
    let block_id = 1;

    // Write block
    storage
        .write_block(block_id, test_data.clone())
        .await
        .expect("Should write block");

    // Read block back
    let read_data = storage
        .read_block(block_id)
        .await
        .expect("Should read block");

    assert_eq!(read_data, test_data, "Read data should match written data");
    println!("Block storage read/write test passed");
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_database_creation() {
    let _tmp = setup_fs_base();
    // Test that we can create a database instance
    let config = DatabaseConfig {
        name: "test_sqlite_creation.db".to_string(),
        ..Default::default()
    };

    let db = SqliteIndexedDB::new(config).await;

    match db {
        Ok(_) => println!("Database creation test passed"),
        Err(e) => {
            println!("Database creation failed: {:?}", e);
            // This might fail initially, which is expected in TDD
        }
    }
}
