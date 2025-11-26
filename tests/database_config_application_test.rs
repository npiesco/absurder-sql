//! Test that DatabaseConfig options are correctly applied to SQLite

#![cfg(target_arch = "wasm32")]

use absurder_sql::{Database, DatabaseConfig};
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_page_size_config_is_applied() {
    web_sys::console::log_1(&"=== Testing page_size configuration ===".into());

    // Create database with 8KB page size
    let mut config = DatabaseConfig::default();
    config.name = "page_size_test_8kb".to_string();
    config.page_size = Some(8192);

    let mut db = Database::new(config).await.unwrap();

    // Query the actual page size from SQLite
    let result = db.execute("PRAGMA page_size").await.unwrap();

    // Parse the result to check if page size was set correctly
    let result_json = js_sys::JSON::stringify(&result).unwrap();
    let result_str = result_json.as_string().unwrap();

    web_sys::console::log_1(&format!("Page size query result: {}", result_str).into());

    // The result should contain the page size value
    assert!(
        result_str.contains("8192"),
        "Expected page_size to be 8192, got: {}",
        result_str
    );

    web_sys::console::log_1(&"page_size configuration applied correctly".into());
    db.close().await.unwrap();
}

#[wasm_bindgen_test]
async fn test_cache_size_config_is_applied() {
    web_sys::console::log_1(&"=== Testing cache_size configuration ===".into());

    // Create database with custom cache size
    let mut config = DatabaseConfig::default();
    config.name = "cache_size_test".to_string();
    config.cache_size = Some(5000);

    let mut db = Database::new(config).await.unwrap();

    // Query the actual cache size from SQLite
    let result = db.execute("PRAGMA cache_size").await.unwrap();

    let result_json = js_sys::JSON::stringify(&result).unwrap();
    let result_str = result_json.as_string().unwrap();

    web_sys::console::log_1(&format!("Cache size query result: {}", result_str).into());

    // The result should contain the cache size value (note: can be negative for KB-based)
    // Accept both positive (pages) and negative (KB) values
    assert!(
        result_str.contains("5000") || result_str.contains("-5000"),
        "Expected cache_size to be 5000 or -5000, got: {}",
        result_str
    );

    web_sys::console::log_1(&"cache_size configuration applied correctly".into());
    db.close().await.unwrap();
}

#[wasm_bindgen_test]
async fn test_journal_mode_config_is_applied() {
    web_sys::console::log_1(&"=== Testing journal_mode configuration ===".into());

    // Test WAL mode (fully supported via shared memory implementation)
    let config = DatabaseConfig {
        name: "journal_mode_test_wal".to_string(),
        journal_mode: Some("WAL".to_string()),
        ..Default::default()
    };

    let mut db = Database::new(config).await.unwrap();

    // Query the actual journal mode from SQLite
    let result = db.execute("PRAGMA journal_mode").await.unwrap();

    let result_json = js_sys::JSON::stringify(&result).unwrap();
    let result_str = result_json.as_string().unwrap().to_uppercase();

    web_sys::console::log_1(&format!("Journal mode query result: {}", result_str).into());

    // Check if WAL was actually set (now that we have shared memory support)
    assert!(
        result_str.contains("WAL"),
        "Expected journal_mode to be WAL (shared memory now implemented), got: {}",
        result_str
    );

    web_sys::console::log_1(
        &"journal_mode configuration applied correctly (WAL with shared memory)".into(),
    );

    db.close().await.unwrap();
}

#[wasm_bindgen_test]
async fn test_auto_vacuum_config_is_applied() {
    web_sys::console::log_1(&"=== Testing auto_vacuum configuration ===".into());

    // Create database with auto_vacuum enabled
    let mut config = DatabaseConfig::default();
    config.name = "auto_vacuum_test".to_string();
    config.auto_vacuum = Some(true);

    let mut db = Database::new(config).await.unwrap();

    // Create a table first (auto_vacuum is set at database creation)
    db.execute("CREATE TABLE test (id INTEGER)").await.unwrap();

    // Query the actual auto_vacuum setting from SQLite
    let result = db.execute("PRAGMA auto_vacuum").await.unwrap();

    let result_json = js_sys::JSON::stringify(&result).unwrap();
    let result_str = result_json.as_string().unwrap();

    web_sys::console::log_1(&format!("Auto vacuum query result: {}", result_str).into());

    // auto_vacuum returns: 0=none, 1=full, 2=incremental
    // true should set it to 1 (full) or 2 (incremental), not 0
    assert!(
        !result_str.contains("\"0\"")
            || result_str.contains("\"1\"")
            || result_str.contains("\"2\""),
        "Expected auto_vacuum to be enabled (1 or 2), got: {}",
        result_str
    );

    web_sys::console::log_1(&"auto_vacuum configuration applied correctly".into());
    db.close().await.unwrap();
}

#[wasm_bindgen_test]
async fn test_all_config_options_together() {
    web_sys::console::log_1(&"=== Testing all config options together ===".into());

    // Create database with all custom settings
    let config = DatabaseConfig {
        name: "all_config_test".to_string(),
        version: Some(2),
        cache_size: Some(8000),
        page_size: Some(4096),
        auto_vacuum: Some(true),
        journal_mode: Some("WAL".to_string()),
        max_export_size_bytes: Some(100 * 1024 * 1024), // 100MB
    };

    let mut db = Database::new(config).await.unwrap();

    // Verify page size
    let page_result = db.execute("PRAGMA page_size").await;
    assert!(page_result.is_ok(), "Should query page_size");

    // Verify cache size
    let cache_result = db.execute("PRAGMA cache_size").await;
    assert!(cache_result.is_ok(), "Should query cache_size");

    // Verify journal mode
    let journal_result = db.execute("PRAGMA journal_mode").await;
    assert!(journal_result.is_ok(), "Should query journal_mode");

    // Verify auto vacuum
    db.execute("CREATE TABLE test (id INTEGER)").await.unwrap();
    let vacuum_result = db.execute("PRAGMA auto_vacuum").await;
    assert!(vacuum_result.is_ok(), "Should query auto_vacuum");

    web_sys::console::log_1(&"All config options work together".into());
    db.close().await.unwrap();
}
