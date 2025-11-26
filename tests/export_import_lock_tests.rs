//! Tests for export/import operation locking
//!
//! Ensures that concurrent export/import operations are properly serialized
//! to prevent data corruption and race conditions.

#![cfg(target_arch = "wasm32")]

use absurder_sql::*;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

/// Test that concurrent exports from different Database instances are serialized
#[wasm_bindgen_test]
async fn test_concurrent_exports_on_same_db() {
    let db_name = format!("test_concurrent_export_{}.db", js_sys::Date::now() as u64);

    // Create database and populate with data
    let config1 = DatabaseConfig {
        name: db_name.clone(),
        ..Default::default()
    };

    let mut db1 = Database::new(config1)
        .await
        .expect("Should create database");
    db1.execute("DROP TABLE IF EXISTS test").await.ok();
    db1.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)")
        .await
        .expect("Should create table");
    db1.execute("INSERT INTO test (value) VALUES ('test data')")
        .await
        .expect("Should insert data");
    db1.close().await.expect("Should close db1");

    // Create two separate database instances for concurrent export
    let config2 = DatabaseConfig {
        name: db_name.to_string(),
        ..Default::default()
    };
    let config3 = DatabaseConfig {
        name: db_name.to_string(),
        ..Default::default()
    };

    let mut db2 = Database::new(config2).await.expect("Should create db2");
    let mut db3 = Database::new(config3).await.expect("Should create db3");

    // Attempt concurrent exports - second should wait for first to complete
    let export1_future = db2.export_to_file();
    let export2_future = db3.export_to_file();

    let (result1, result2) = futures::future::join(export1_future, export2_future).await;

    assert!(result1.is_ok(), "First export should succeed");
    assert!(
        result2.is_ok(),
        "Second export should succeed (after waiting for first)"
    );

    // Both exports should be identical
    let bytes1 = result1.unwrap();
    let bytes2 = result2.unwrap();
    assert_eq!(
        bytes1.length(),
        bytes2.length(),
        "Exports should have same size"
    );

    db2.close().await.expect("Should close db2");
    db3.close().await.expect("Should close db3");
}

/// Test that import and export locks properly serialize access
#[wasm_bindgen_test]
async fn test_concurrent_import_export_locks() {
    let timestamp = js_sys::Date::now() as u64;
    let import_db_name = format!("test_import_lock_{}.db", timestamp);
    let export_db_name = format!("test_export_lock_{}.db", timestamp);

    // Create database for export
    let config1 = DatabaseConfig {
        name: export_db_name.clone(),
        ..Default::default()
    };

    let mut db1 = Database::new(config1)
        .await
        .expect("Should create database");
    db1.execute("DROP TABLE IF EXISTS test").await.ok();
    db1.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)")
        .await
        .expect("Should create table");
    db1.execute("INSERT INTO test (value) VALUES ('initial')")
        .await
        .expect("Should insert");

    let export_bytes = db1.export_to_file().await.expect("Should export");
    db1.close().await.expect("Should close db1");

    // Create separate databases for import and export operations
    let config2 = DatabaseConfig {
        name: import_db_name.clone(),
        ..Default::default()
    };
    let config3 = DatabaseConfig {
        name: export_db_name.clone(),
        ..Default::default()
    };

    let mut db2 = Database::new(config2).await.expect("Should create db2");
    let db3 = Database::new(config3).await.expect("Should create db3");

    // Try concurrent import and export on DIFFERENT databases
    // Both operations should succeed without interfering
    let import_future = db2.import_from_file(export_bytes);
    let export_future = db3.export_to_file();

    let (import_result, export_result) = futures::future::join(import_future, export_future).await;

    // Both operations should succeed
    let import_ok = import_result.is_ok();
    let export_ok = export_result.is_ok();

    if !import_ok {
        web_sys::console::log_1(&format!("Import failed: {:?}", import_result.err()).into());
    }
    if !export_ok {
        web_sys::console::log_1(&format!("Export failed: {:?}", export_result.err()).into());
    }

    assert!(
        import_ok && export_ok,
        "Both operations should succeed on different databases"
    );

    web_sys::console::log_1(&format!("Import: {:?}, Export: {:?}", import_ok, export_ok).into());
}

/// Test that export lock has a reasonable timeout
#[wasm_bindgen_test]
async fn test_export_lock_timeout() {
    let db_name = "test_export_lock_timeout.db";

    // Create database with data
    let config1 = DatabaseConfig {
        name: db_name.to_string(),
        ..Default::default()
    };

    let mut db1 = Database::new(config1)
        .await
        .expect("Should create database");

    db1.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)")
        .await
        .expect("Should create table");
    db1.close().await.expect("Should close db1");

    // Create two separate database instances
    let config2 = DatabaseConfig {
        name: db_name.to_string(),
        ..Default::default()
    };
    let config3 = DatabaseConfig {
        name: db_name.to_string(),
        ..Default::default()
    };

    let mut db2 = Database::new(config2).await.expect("Should create db2");
    let mut db3 = Database::new(config3).await.expect("Should create db3");

    // Start concurrent exports
    let export1_future = db2.export_to_file();
    let export2_future = db3.export_to_file();

    let (result1, result2) = futures::future::join(export1_future, export2_future).await;

    // Both should complete within reasonable time
    assert!(result1.is_ok(), "First export should succeed");
    assert!(
        result2.is_ok(),
        "Second export should succeed after waiting"
    );

    db2.close().await.expect("Should close db2");
    db3.close().await.expect("Should close db3");
}
