#![cfg(target_arch = "wasm32")]

use absurder_sql::{Database, DatabaseConfig};
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

/// Test that import properly invalidates connection pool
#[wasm_bindgen_test]
async fn test_import_connection_pool_isolation() {
    web_sys::console::log_1(&"TEST: Import should invalidate connection pool".into());

    let unique_id = js_sys::Date::now() as u64;
    let source_name = format!("pool_source_{}.db", unique_id);
    let target_name = format!("pool_target_{}.db", unique_id);

    // Step 1: Create source database
    let mut source_db = Database::new(DatabaseConfig {
        name: source_name.clone(),
        ..Default::default()
    })
    .await
    .expect("Should create source");

    source_db
        .execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)")
        .await
        .expect("Should create table");
    source_db
        .execute("INSERT INTO test VALUES (1, 'data')")
        .await
        .expect("Should insert");

    let export_bytes = source_db.export_to_file().await.expect("Should export");
    source_db.close().await.expect("Should close source");

    // Step 2: Create target database (establishes connection in pool)
    let mut target_db = Database::new(DatabaseConfig {
        name: target_name.clone(),
        ..Default::default()
    })
    .await
    .expect("Should create target");

    // Check if connection exists in pool BEFORE import
    let pool_key = target_name.trim_end_matches(".db");
    let exists_before = absurder_sql::connection_pool::connection_exists(pool_key);
    web_sys::console::log_1(
        &format!("Connection exists in pool before import: {}", exists_before).into(),
    );

    // Step 3: Import (calls close() which might just decrement ref_count)
    target_db
        .import_from_file(export_bytes)
        .await
        .expect("Should import");

    // Check if connection still exists in pool AFTER import
    let exists_after_import = absurder_sql::connection_pool::connection_exists(pool_key);
    web_sys::console::log_1(
        &format!(
            "Connection exists in pool after import: {}",
            exists_after_import
        )
        .into(),
    );

    if exists_after_import {
        web_sys::console::log_1(
            &"BUG CONFIRMED: Connection pool still has entry after import!".into(),
        );
        web_sys::console::log_1(
            &"This means new Database instances will reuse stale SQLite connection".into(),
        );
    }

    // Step 4: Create new Database instance - test if it works
    let mut target_db_new = Database::new(DatabaseConfig {
        name: target_name.clone(),
        ..Default::default()
    })
    .await
    .expect("Should create after import");

    // Try to read imported data
    let result = target_db_new
        .execute("SELECT * FROM test WHERE id = 1")
        .await;

    match result {
        Ok(_) => {
            web_sys::console::log_1(&"SUCCESS: Can read imported data".into());
        }
        Err(e) => {
            web_sys::console::log_1(&format!("FAILED: Cannot read data: {:?}", e).into());
            if exists_after_import {
                panic!("BUG: Connection pool kept stale connection, causing corruption");
            } else {
                panic!("Different issue - connection was cleared but still fails");
            }
        }
    }

    // Cleanup
    let _ = target_db_new.close().await;
}
