//! Test that DatabaseConfig.max_export_size_bytes is respected during export

#![cfg(target_arch = "wasm32")]

use wasm_bindgen_test::*;
use absurder_sql::{Database, DatabaseConfig};

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_export_respects_config_size_limit() {
    // Create database with a very small export limit (1KB)
    let mut config = DatabaseConfig::default();
    config.name = "export_config_test".to_string();
    config.max_export_size_bytes = Some(1024); // 1KB limit
    
    let mut db = Database::new(config).await.unwrap();
    
    // Create a table and insert enough data to exceed 1KB
    db.execute("CREATE TABLE large_data (id INTEGER PRIMARY KEY, data TEXT)").await.unwrap();
    
    // Insert data that will make the DB larger than 1KB
    for i in 0..100 {
        let query = format!("INSERT INTO large_data (id, data) VALUES ({}, '{}')", 
            i, "x".repeat(100)); // 100 char string per row = ~10KB total
        db.execute(&query).await.unwrap();
    }
    
    // Try to export - should fail because DB is larger than 1KB limit
    let result = db.export_to_file().await;
    
    match result {
        Err(e) => {
            let error_str = format!("{:?}", e);
            assert!(error_str.contains("exceeds") || error_str.contains("size limit"),
                "Expected size limit error, got: {}", error_str);
            web_sys::console::log_1(&"Export correctly rejected oversized database".into());
        }
        Ok(_) => {
            panic!("Export should have failed due to size limit, but succeeded");
        }
    }
    
    db.close().await.unwrap();
}

#[wasm_bindgen_test]
async fn test_export_succeeds_within_size_limit() {
    // Create database with a generous export limit (10MB)
    let mut config = DatabaseConfig::default();
    config.name = "export_config_small_test".to_string();
    config.max_export_size_bytes = Some(10 * 1024 * 1024); // 10MB limit
    
    let mut db = Database::new(config).await.unwrap();
    
    // Create a small table
    db.execute("CREATE TABLE small_data (id INTEGER PRIMARY KEY, data TEXT)").await.unwrap();
    db.execute("INSERT INTO small_data VALUES (1, 'test data')").await.unwrap();
    
    // Export should succeed
    let result = db.export_to_file().await;
    
    assert!(result.is_ok(), "Export should succeed for small database");
    
    let bytes = result.unwrap();
    assert!(bytes.length() > 0, "Export should produce non-empty data");
    
    web_sys::console::log_1(&format!("Export succeeded: {} bytes", bytes.length()).into());
    
    db.close().await.unwrap();
}

#[wasm_bindgen_test]
async fn test_export_with_none_limit_allows_large_exports() {
    // Create database with no export limit
    let mut config = DatabaseConfig::default();
    config.name = "export_config_unlimited_test".to_string();
    config.max_export_size_bytes = None; // No limit
    
    let mut db = Database::new(config).await.unwrap();
    
    // Create a table with some data
    db.execute("CREATE TABLE data (id INTEGER PRIMARY KEY, data TEXT)").await.unwrap();
    
    for i in 0..50 {
        let query = format!("INSERT INTO data VALUES ({}, '{}')", i, "x".repeat(100));
        db.execute(&query).await.unwrap();
    }
    
    // Export should succeed regardless of size
    let result = db.export_to_file().await;
    
    assert!(result.is_ok(), "Export should succeed when no limit is set");
    
    web_sys::console::log_1(&"Export succeeded with no size limit".into());
    
    db.close().await.unwrap();
}
