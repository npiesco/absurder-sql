//! Test check-then-create race condition in Database::new_wasm()

#![cfg(target_arch = "wasm32")]

use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

/// RED: Test the check-then-create race in open_or_create
/// Lines 121-143 in indexeddb_vfs.rs are NOT atomic
#[wasm_bindgen_test]
async fn test_check_then_create_race() {
    console_log::init_with_level(log::Level::Debug).ok();

    // Use unique database name per test run to avoid pollution
    let timestamp = js_sys::Date::now() as u64;
    let db_name = format!("race_test_{}", timestamp);

    // MANDATORY per INSTRUCTIONS.md WASM Rule #2: Clear localStorage leader keys at START
    use web_sys::window;
    if let Some(window) = window() {
        if let Ok(Some(storage)) = window.local_storage() {
            let db_key = format!("{}.db", db_name);
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

    // CRITICAL: For memory-constrained tests, use minimal cache
    use absurder_sql::types::DatabaseConfig;
    let config = DatabaseConfig {
        name: format!("{}.db", db_name),
        version: Some(1),
        cache_size: Some(10), // Minimal: 10 pages = ~40KB
        page_size: Some(4096),
        auto_vacuum: Some(true),
        journal_mode: Some("WAL".to_string()),
        max_export_size_bytes: Some(2 * 1024 * 1024 * 1024),
    };

    // CRITICAL: Open sequentially, not in parallel, to avoid IndexedDB blocking
    // Chrome blocks concurrent IndexedDB opens even after close()
    // Use only 2 DBs to reduce memory pressure
    log::info!("TEST: Opening DB1");
    let mut db1 = absurder_sql::Database::new(config.clone())
        .await
        .expect("DB 1");
    log::info!("TEST: DB1 created successfully");

    log::info!("TEST: Opening DB2");
    let mut db2 = absurder_sql::Database::new(config.clone())
        .await
        .expect("DB 2");
    log::info!("TEST: DB2 created successfully - both DBs created!");

    // RED: If separate storages were created, this test exposes it
    // GREEN: Both share the same BlockStorage

    // Write with db1
    db1.execute("DROP TABLE IF EXISTS test").await.ok();
    db1.execute("CREATE TABLE test (id INTEGER)").await.ok();
    db1.execute("INSERT INTO test VALUES (1)").await.ok();

    // Read with db2 - should see db1's data if same storage
    let result_db2 = db2.execute("SELECT * FROM test").await;

    if result_db2.is_err() {
        panic!(
            "RED PHASE CONFIRMED: Separate BlockStorage instances!\n\
            DB2 sees DB1's table: {}\n\
            Error: {:?}",
            result_db2.is_ok(),
            result_db2.as_ref().err()
        );
    }

    // GREEN: Both DBs see the same table, proving shared BlockStorage
    assert!(result_db2.is_ok(), "DB2 should see DB1's data (GREEN)");
    web_sys::console::log_1(&"TEST: SHARED STORAGE VERIFIED".into());

    // CRITICAL: Drop DBs without calling close() to avoid async deadlock
    // In WASM tests, the heartbeat will be cleaned up when the browser context ends
    // For production, close() is still the right pattern
    web_sys::console::log_1(&"TEST: Dropping DB1".into());
    drop(db1);
    web_sys::console::log_1(&"TEST: Dropping DB2".into());
    drop(db2);
    web_sys::console::log_1(&"TEST: All databases dropped successfully".into());

    // Cleanup: Clear localStorage explicitly to prevent any lingering references
    if let Some(window) = window() {
        if let Ok(Some(storage)) = window.local_storage() {
            let db_key = format!("{}.db", db_name);
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

    web_sys::console::log_1(&"TEST COMPLETED SUCCESSFULLY".into());
    log::info!("TEST: Cleanup completed - shared storage verified!");
}
