//! Integration test for import -> close -> reopen persistence flow
//!
//! This test verifies that:
//! 1. importFromFile updates global storage
//! 2. close() persists to IndexedDB
//! 3. Reopening the database loads from IndexedDB correctly

#![cfg(target_arch = "wasm32")]

use absurder_sql::*;
use absurder_sql::{ColumnValue, QueryResult};
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_import_close_reopen_persistence() {
    web_sys::console::log_1(&"[TEST] Import -> Close -> Reopen Persistence".into());

    let unique_id = js_sys::Date::now().to_string();
    let source_db_name = format!("import_persist_source_{}", unique_id);
    let target_db_name = format!("import_persist_target_{}", unique_id);

    // CRITICAL: Clean up localStorage leader keys at START
    Database::delete_database(format!("{}.db", source_db_name))
        .await
        .ok();
    Database::delete_database(format!("{}.db", target_db_name))
        .await
        .ok();

    use web_sys::window;
    if let Some(window) = window() {
        if let Ok(Some(storage)) = window.local_storage() {
            for db in &[&source_db_name, &target_db_name] {
                let db_key = format!("{}.db", db);
                storage
                    .remove_item(&format!("datasync_leader_{}", db_key))
                    .ok();
                storage
                    .remove_item(&format!("datasync_instances_{}", db_key))
                    .ok();
                storage
                    .remove_item(&format!("datasync_heartbeat_{}", db_key))
                    .ok();
            }
        }
    }

    // Step 1: Create source database with test data
    web_sys::console::log_1(&"Step 1: Creating source database".into());
    let config1 = DatabaseConfig {
        name: format!("{}.db", source_db_name),
        cache_size: Some(10), // Minimal cache for tests
        ..Default::default()
    };

    let mut source_db = Database::new(config1)
        .await
        .expect("Should create source database");

    source_db
        .execute("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)")
        .await
        .expect("Should create table");
    source_db
        .execute("INSERT INTO test (id, name) VALUES (1, 'Alice'), (2, 'Bob')")
        .await
        .expect("Should insert data");

    // Verify source data
    let result_js = source_db
        .execute("SELECT COUNT(*) as count FROM test")
        .await
        .expect("Should query source");
    let result: QueryResult =
        serde_wasm_bindgen::from_value(result_js).expect("Should deserialize");
    let count = match &result.rows[0].values[0] {
        ColumnValue::Integer(n) => *n,
        _ => panic!("Expected integer count"),
    };
    web_sys::console::log_1(&format!("Source has {} rows", count).into());

    // DEBUG: Check what blocks exist in source database before export
    web_sys::console::log_1(&"Checking source database blocks before export".into());
    let page_count_result = source_db
        .execute("PRAGMA page_count")
        .await
        .expect("Should get page count");
    web_sys::console::log_1(&format!("Source page_count: {:?}", page_count_result).into());
    let page_size_result = source_db
        .execute("PRAGMA page_size")
        .await
        .expect("Should get page size");
    web_sys::console::log_1(&format!("Source page_size: {:?}", page_size_result).into());

    // Sync before export to ensure all writes are flushed
    web_sys::console::log_1(&"Syncing source database before export".into());
    source_db
        .sync()
        .await
        .expect("Should sync source before export");

    // DEBUG: Check GLOBAL_STORAGE block count before export
    #[cfg(target_arch = "wasm32")]
    {
        use absurder_sql::storage::vfs_sync::with_global_storage;
        with_global_storage(|storage_map| {
            if let Some(db_storage) = storage_map.borrow().get(&format!("{}.db", source_db_name)) {
                web_sys::console::log_1(
                    &format!(
                        "DEBUG: Source GLOBAL_STORAGE has {} blocks before export",
                        db_storage.len()
                    )
                    .into(),
                );
                web_sys::console::log_1(
                    &format!(
                        "DEBUG: Source block IDs: {:?}",
                        db_storage.keys().collect::<Vec<_>>()
                    )
                    .into(),
                );
            }
        });
    }

    // Step 2: Export source database
    web_sys::console::log_1(&"Step 2: Exporting source database".into());
    let export_bytes = source_db
        .export_to_file()
        .await
        .expect("Should export source database");
    web_sys::console::log_1(&format!("Exported {} bytes", export_bytes.length()).into());

    source_db.close().await.expect("Should close source");

    // Step 3: Create target database and import
    web_sys::console::log_1(&"Step 3: Creating target database and importing".into());
    let config2 = DatabaseConfig {
        name: format!("{}.db", target_db_name),
        cache_size: Some(10), // Minimal cache for tests
        ..Default::default()
    };

    let mut target_db = Database::new(config2.clone())
        .await
        .expect("Should create target database");

    // Import the data (NOTE: this closes target_db)
    target_db
        .import_from_file(export_bytes)
        .await
        .expect("Should import successfully");

    web_sys::console::log_1(&"Import complete. Creating new database instance...".into());

    // Re-create database instance after import (import closed it)
    let mut target_db = Database::new(config2)
        .await
        .expect("Should reopen target database");

    // Check database integrity
    web_sys::console::log_1(&"Running integrity check on imported database".into());
    let integrity_result = target_db
        .execute("PRAGMA integrity_check")
        .await
        .expect("Should run integrity check");
    web_sys::console::log_1(&format!("Integrity check result: {:?}", integrity_result).into());

    // Step 4: Close target database (this should persist to IndexedDB)
    web_sys::console::log_1(&"Step 4: Closing target database to persist".into());
    target_db
        .close()
        .await
        .expect("Should close target database");

    web_sys::console::log_1(&"Target database closed".into());

    // Step 5: Reopen target database and verify data persisted
    web_sys::console::log_1(&"Step 5: Reopening target database to verify persistence".into());
    let config3 = DatabaseConfig {
        name: format!("{}.db", target_db_name),
        cache_size: Some(10), // Minimal cache for tests
        ..Default::default()
    };

    let mut reopened_db = Database::new(config3)
        .await
        .expect("Should reopen target database");

    // Query the data
    let result_js = reopened_db
        .execute("SELECT * FROM test ORDER BY id")
        .await
        .expect("Should query reopened database");
    let result: QueryResult =
        serde_wasm_bindgen::from_value(result_js).expect("Should deserialize");

    web_sys::console::log_1(&format!("Reopened database has {} rows", result.rows.len()).into());

    // Verify we have the expected data
    assert_eq!(result.rows.len(), 2, "Should have 2 rows after reopen");

    // First row: id=1, name=Alice
    match &result.rows[0].values[0] {
        ColumnValue::Integer(n) => assert_eq!(*n, 1),
        _ => panic!("Expected integer id"),
    }
    match &result.rows[0].values[1] {
        ColumnValue::Text(s) => assert_eq!(s, "Alice"),
        _ => panic!("Expected text name"),
    }

    // Second row: id=2, name=Bob
    match &result.rows[1].values[0] {
        ColumnValue::Integer(n) => assert_eq!(*n, 2),
        _ => panic!("Expected integer id"),
    }
    match &result.rows[1].values[1] {
        ColumnValue::Text(s) => assert_eq!(s, "Bob"),
        _ => panic!("Expected text name"),
    }

    reopened_db.close().await.expect("Should close reopened db");

    web_sys::console::log_1(
        &"[PASS] Data persisted correctly through import -> close -> reopen".into(),
    );
}

#[wasm_bindgen_test]
async fn test_concurrent_import_close_reopen() {
    web_sys::console::log_1(&"[TEST] Concurrent Import -> Close -> Reopen".into());

    let unique_id = js_sys::Date::now().to_string();
    let source_db_name = format!("concurrent_import_source_{}", unique_id);

    // CRITICAL: Clean up localStorage at START
    Database::delete_database(format!("{}.db", source_db_name))
        .await
        .ok();

    use web_sys::window;
    if let Some(window) = window() {
        if let Ok(Some(storage)) = window.local_storage() {
            // Clean source + 3 target databases
            for i in 0..4 {
                let db_name = if i == 0 {
                    format!("{}.db", source_db_name)
                } else {
                    format!("concurrent_import_target_{}_{}.db", i - 1, unique_id)
                };
                storage
                    .remove_item(&format!("datasync_leader_{}", db_name))
                    .ok();
                storage
                    .remove_item(&format!("datasync_instances_{}", db_name))
                    .ok();
                storage
                    .remove_item(&format!("datasync_heartbeat_{}", db_name))
                    .ok();
                Database::delete_database(db_name).await.ok();
            }
        }
    }

    // Create source database
    let config_source = DatabaseConfig {
        name: format!("{}.db", source_db_name),
        cache_size: Some(10), // Minimal cache for multi-DB test
        ..Default::default()
    };

    let mut source_db = Database::new(config_source)
        .await
        .expect("Should create source database");

    source_db
        .execute("CREATE TABLE test (id INTEGER, data TEXT)")
        .await
        .expect("Should create table");
    source_db
        .execute("INSERT INTO test VALUES (100, 'test data')")
        .await
        .expect("Should insert");

    let export_bytes = source_db.export_to_file().await.expect("Should export");
    source_db.close().await.expect("Should close source");

    // Import into 3 different databases concurrently
    let mut futures = vec![];

    for i in 0..3 {
        let target_name = format!("concurrent_import_target_{}_{}.db", i, unique_id);
        let bytes_clone = export_bytes.clone();

        let fut = async move {
            web_sys::console::log_1(&format!("[DB {}] Creating", i).into());

            let config = DatabaseConfig {
                name: target_name.clone(),
                cache_size: Some(10), // Minimal cache for multi-DB test
                ..Default::default()
            };

            let mut db = Database::new(config).await.expect("Should create database");

            web_sys::console::log_1(&format!("[DB {}] Importing", i).into());
            db.import_from_file(bytes_clone)
                .await
                .expect("Should import");

            web_sys::console::log_1(&format!("[DB {}] Closing", i).into());
            db.close().await.expect("Should close");

            web_sys::console::log_1(&format!("[DB {}] Reopening", i).into());
            let config2 = DatabaseConfig {
                name: target_name.clone(),
                cache_size: Some(10), // Minimal cache for multi-DB test
                ..Default::default()
            };

            let mut reopened = Database::new(config2).await.expect("Should reopen");

            let result_js = reopened
                .execute("SELECT * FROM test")
                .await
                .expect("Should query");
            let result: QueryResult =
                serde_wasm_bindgen::from_value(result_js).expect("Should deserialize");

            reopened.close().await.expect("Should close reopened");

            web_sys::console::log_1(
                &format!("[DB {}] Verified {} rows", i, result.rows.len()).into(),
            );

            result.rows.len() == 1
        };

        futures.push(fut);
    }

    // Run all imports concurrently
    let results = futures::future::join_all(futures).await;

    // All should succeed
    for (i, success) in results.iter().enumerate() {
        assert!(*success, "Database {} should have persisted correctly", i);
    }

    web_sys::console::log_1(&"[PASS] All concurrent imports persisted correctly".into());
}
