#![cfg(target_arch = "wasm32")]

use absurder_sql::*;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_pragma_journal_mode_returns_value() {
    // Test that PRAGMA journal_mode=MEMORY actually returns a result row
    let mut db = Database::new_wasm("test_pragma_returns".to_string()).await
        .expect("Failed to create database");
    
    // Try to set journal_mode to MEMORY
    let result = db.execute_internal("PRAGMA journal_mode=MEMORY").await
        .expect("Failed to set journal_mode");
    
    web_sys::console::log_1(&format!("PRAGMA journal_mode=MEMORY result:").into());
    web_sys::console::log_1(&format!("  columns: {:?}", result.columns).into());
    web_sys::console::log_1(&format!("  rows.len(): {}", result.rows.len()).into());
    
    // CRITICAL ASSERTION: PRAGMA should return a row with the mode
    assert_eq!(result.columns.len(), 1, "Should have 1 column");
    assert_eq!(result.rows.len(), 1, "PRAGMA journal_mode=MEMORY MUST return 1 row, got 0 - SQLite rejected the setting!");
    
    if result.rows.len() > 0 {
        match &result.rows[0].values[0] {
            ColumnValue::Text(s) => {
                web_sys::console::log_1(&format!("  value: '{}'", s).into());
                assert_eq!(s, "memory", "Expected 'memory', got '{}'", s);
            },
            other => panic!("Expected Text value, got {:?}", other),
        }
    }
}

#[wasm_bindgen_test]
async fn test_vfs_device_characteristics() {
    let mut db = Database::new_wasm("test_device_chars".to_string()).await
        .expect("Failed to create database");
    
    // Log VFS device characteristics
    web_sys::console::log_1(&"VFS Device Characteristics Test:".into());
    web_sys::console::log_1(&"Expected flags: ATOMIC | SAFE_APPEND | SEQUENTIAL | UNDELETABLE_WHEN_OPEN | POWERSAFE_OVERWRITE".into());
    web_sys::console::log_1(&"Expected value: 0x1E01 (7681)".into());
    
    // Check compile options
    let result = db.execute_internal("PRAGMA compile_options").await
        .expect("Failed to query compile_options");
    
    web_sys::console::log_1(&"\nSQLite compile options:".into());
    for row in &result.rows {
        if let ColumnValue::Text(opt) = &row.values[0] {
            web_sys::console::log_1(&format!("  {}", opt).into());
        }
    }
}
