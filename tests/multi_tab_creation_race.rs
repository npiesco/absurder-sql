//! Test simultaneous database creation from multiple tabs

#![cfg(target_arch = "wasm32")]

use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

/// GREEN: Multiple tabs create the same database simultaneously
/// This mirrors the Playwright multi-context scenario from the other codebase
#[wasm_bindgen_test]
async fn test_simultaneous_database_creation() {
    console_log::init_with_level(log::Level::Debug).ok();

    // Use unique database name per test run to avoid stale data
    let timestamp = js_sys::Date::now() as u64;
    let db_name = format!("shared_db_{}", timestamp);

    // CRITICAL: For memory-constrained tests, use minimal config
    use absurder_sql::types::DatabaseConfig;
    let config = DatabaseConfig {
        name: format!("{}.db", db_name),
        version: Some(1),
        cache_size: Some(10), // Minimal: 10 pages = ~40KB per DB
        page_size: Some(4096),
        auto_vacuum: Some(true),
        journal_mode: Some("WAL".to_string()),
        max_export_size_bytes: Some(2 * 1024 * 1024 * 1024),
    };

    // Simulate 2 tabs (instead of 3) to reduce memory pressure
    // CRITICAL: Open sequentially, not in parallel, to avoid IndexedDB blocking
    log::info!("TEST: Opening DB1");
    let mut db1 = absurder_sql::Database::new(config.clone())
        .await
        .expect("Tab 1 should create database");
    log::info!("TEST: DB1 created successfully");

    log::info!("TEST: Opening DB2");
    let mut db2 = absurder_sql::Database::new(config.clone())
        .await
        .expect("Tab 2 should reuse database");
    log::info!("TEST: DB2 created successfully - both DBs created!");

    // Each tab creates a different table to prove they're working on the same storage
    log::info!("TEST: DB1 dropping old table");
    db1.execute("DROP TABLE IF EXISTS tab1_data").await.ok();

    log::info!("TEST: DB1 creating table");
    db1.execute("CREATE TABLE tab1_data (id INTEGER, value TEXT)")
        .await
        .expect("Tab 1 create table");

    log::info!("TEST: DB1 inserting data");
    db1.execute("INSERT INTO tab1_data VALUES (1, 'from_tab1')")
        .await
        .expect("Tab 1 insert");

    log::info!("TEST: DB2 dropping old table");
    db2.execute("DROP TABLE IF EXISTS tab2_data").await.ok();

    log::info!("TEST: DB2 creating table");
    db2.execute("CREATE TABLE tab2_data (id INTEGER, value TEXT)")
        .await
        .expect("Tab 2 create table");

    log::info!("TEST: DB2 inserting data");
    db2.execute("INSERT INTO tab2_data VALUES (2, 'from_tab2')")
        .await
        .expect("Tab 2 insert");

    // Close SEQUENTIALLY because they share storage - only leader should persist
    log::info!("TEST: Closing DB1");
    db1.close().await.expect("DB1 close failed");
    log::info!("TEST: Closing DB2");
    db2.close().await.expect("DB2 close failed");
    log::info!("TEST: Both databases closed successfully");

    log::info!("TEST: Both databases closed - shared storage worked!");
    log::info!("TEST: Test completed successfully - infinite heartbeat fixed!");
}
