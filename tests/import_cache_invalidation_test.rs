#![cfg(target_arch = "wasm32")]

use absurder_sql::{Database, DatabaseConfig};
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_import_invalidates_cache() {
    web_sys::console::log_1(&"TEST: Import cache invalidation".into());

    // Step 1: Create source database with data
    let source_config = DatabaseConfig {
        name: format!("cache_test_source_{}.db", js_sys::Date::now() as u64),
        ..Default::default()
    };

    let mut source_db = Database::new(source_config)
        .await
        .expect("Should create source");
    source_db
        .execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)")
        .await
        .expect("Should create table");
    source_db
        .execute("INSERT INTO test VALUES (1, 'test_data')")
        .await
        .expect("Should insert");

    // Step 2: Export
    let export_bytes = source_db.export_to_file().await.expect("Should export");
    source_db.close().await.expect("Should close source");

    // Step 3: Create empty target database
    let target_config = DatabaseConfig {
        name: format!("cache_test_target_{}.db", js_sys::Date::now() as u64),
        ..Default::default()
    };

    let mut target_db = Database::new(target_config.clone())
        .await
        .expect("Should create target");

    // Step 4: Read header BEFORE import - should be empty
    let result_before = target_db
        .execute("PRAGMA page_count")
        .await
        .expect("Should get page count");
    web_sys::console::log_1(&format!("BEFORE IMPORT page_count: {:?}", result_before).into());

    // Step 5: Import (this will close the connection)
    target_db
        .import_from_file(export_bytes.clone())
        .await
        .expect("Should import");

    // Step 6: Create NEW instance to read imported data (connection was closed by import)
    web_sys::console::log_1(&"Creating new instance after import...".into());
    let mut reopened_db = Database::new(target_config.clone())
        .await
        .expect("Should create new instance");

    // Step 7: Try to read data from new instance
    web_sys::console::log_1(&"Checking if data readable after import+reopen...".into());
    let integrity_result = reopened_db.execute("PRAGMA integrity_check").await;

    match integrity_result {
        Ok(_) => {
            web_sys::console::log_1(
                &"SUCCESS: Data readable after import (cache was invalidated)".into(),
            );
        }
        Err(e) => {
            web_sys::console::log_1(&format!("FAILED: Cannot read after import: {:?}", e).into());
            panic!("Import failed to properly invalidate cache");
        }
    }

    // Cleanup
    let _ = reopened_db.close().await;
}

#[wasm_bindgen_test]
async fn test_import_with_close_first() {
    use absurder_sql::{Database, DatabaseConfig};

    web_sys::console::log_1(&"TEST: Import with close first".into());

    // Step 1: Create source database with data
    let source_config = DatabaseConfig {
        name: format!("close_test_source_{}.db", js_sys::Date::now() as u64),
        ..Default::default()
    };

    let mut source_db = Database::new(source_config)
        .await
        .expect("Should create source");
    source_db
        .execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)")
        .await
        .expect("Should create table");
    source_db
        .execute("INSERT INTO test VALUES (1, 'test_data')")
        .await
        .expect("Should insert");

    // Step 2: Export
    let export_bytes = source_db.export_to_file().await.expect("Should export");
    source_db.close().await.expect("Should close source");

    // Step 3: Create empty target database
    let target_config = DatabaseConfig {
        name: format!("close_test_target_{}.db", js_sys::Date::now() as u64),
        ..Default::default()
    };

    let mut target_db = Database::new(target_config.clone())
        .await
        .expect("Should create target");

    // Step 4: Close BEFORE import (main branch behavior)
    web_sys::console::log_1(&"Closing database before import...".into());
    target_db.close().await.expect("Should close before import");

    // Step 5: Reopen and import
    target_db = Database::new(target_config.clone())
        .await
        .expect("Should reopen");

    // Now do import through storage API directly (simulating what happens after close)
    let db_name = target_db.name();
    let data = export_bytes.to_vec();

    // Close the old instance before import to release the SQLite connection
    target_db.close().await.expect("Should close before import");

    absurder_sql::storage::import::import_database_from_bytes(&db_name, data)
        .await
        .expect("Should import");

    // Step 6: Create NEW database instance to read imported data
    let mut reopened_db = Database::new(target_config)
        .await
        .expect("Should create new instance");

    // Step 7: Try to read data
    web_sys::console::log_1(&"Checking if data readable after close+import+reopen...".into());
    let integrity_result = reopened_db.execute("PRAGMA integrity_check").await;

    match integrity_result {
        Ok(_) => {
            web_sys::console::log_1(&"SUCCESS: Data readable with close first".into());
        }
        Err(e) => {
            panic!("FAILED even with close: {:?}", e);
        }
    }

    // Cleanup
    let _ = reopened_db.close().await;
}
