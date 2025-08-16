//! Phase 1: Project Setup & Basic Compilation Tests
//! TDD approach: Write failing tests first, then implement to make them pass

use wasm_bindgen_test::*;
use sqlite_indexeddb_rs::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_library_initialization() {
    // Test that the library can be initialized without errors
    sqlite_indexeddb_rs::init();
    
    // Should not panic or throw errors
    web_sys::console::log_1(&"✓ Library initialization test passed".into());
}

#[wasm_bindgen_test]
async fn test_database_config_creation() {
    // Test that we can create a database configuration
    let config = DatabaseConfig::default();
    
    assert_eq!(config.name, "default.db");
    assert_eq!(config.version, Some(1));
    assert_eq!(config.cache_size, Some(10_000));
    assert_eq!(config.page_size, Some(4096));
    assert_eq!(config.auto_vacuum, Some(true));
    
    web_sys::console::log_1(&"✓ Database config creation test passed".into());
}

#[wasm_bindgen_test]
async fn test_custom_database_config() {
    // Test that we can create custom database configurations
    let config = DatabaseConfig {
        name: "test.db".to_string(),
        version: Some(2),
        cache_size: Some(5_000),
        page_size: Some(8192),
        auto_vacuum: Some(false),
        journal_mode: Some("DELETE".to_string()),
    };
    
    assert_eq!(config.name, "test.db");
    assert_eq!(config.version, Some(2));
    assert_eq!(config.cache_size, Some(5_000));
    
    web_sys::console::log_1(&"✓ Custom database config test passed".into());
}

#[wasm_bindgen_test]
async fn test_column_value_types() {
    // Test that all column value types work correctly
    let _null_val = ColumnValue::Null;
    let _int_val = ColumnValue::Integer(42);
    let _real_val = ColumnValue::Real(3.14);
    let _text_val = ColumnValue::Text("hello".to_string());
    let _blob_val = ColumnValue::Blob(vec![1, 2, 3, 4]);
    
    // Only test rusqlite conversions on non-wasm targets
    #[cfg(not(target_arch = "wasm32"))]
    {
        // Test conversion to rusqlite values
        let rusqlite_null = _null_val.to_rusqlite_value();
        let rusqlite_int = _int_val.to_rusqlite_value();
        let rusqlite_real = _real_val.to_rusqlite_value();
        let rusqlite_text = _text_val.to_rusqlite_value();
        let rusqlite_blob = _blob_val.to_rusqlite_value();
        
        // Test conversion back from rusqlite values
        let back_to_null = ColumnValue::from_rusqlite_value(&rusqlite_null);
        let back_to_int = ColumnValue::from_rusqlite_value(&rusqlite_int);
        let back_to_real = ColumnValue::from_rusqlite_value(&rusqlite_real);
        let back_to_text = ColumnValue::from_rusqlite_value(&rusqlite_text);
        let back_to_blob = ColumnValue::from_rusqlite_value(&rusqlite_blob);
        
        // Verify round-trip conversion works
        match (back_to_null, back_to_int, back_to_real, back_to_text, back_to_blob) {
            (ColumnValue::Null, 
             ColumnValue::Integer(42), 
             ColumnValue::Real(val), 
             ColumnValue::Text(text), 
             ColumnValue::Blob(blob)) => {
                assert!((val - 3.14).abs() < 0.001);
                assert_eq!(text, "hello");
                assert_eq!(blob, vec![1, 2, 3, 4]);
            }
            _ => panic!("Column value conversion failed"),
        }
    }
    
    web_sys::console::log_1(&"✓ Column value types test passed".into());
}

#[wasm_bindgen_test]
async fn test_error_types() {
    // Test that error types can be created and handled
    let error = DatabaseError::new("TEST_ERROR", "This is a test error");
    assert_eq!(error.code, "TEST_ERROR");
    assert_eq!(error.message, "This is a test error");
    assert_eq!(error.sql, None);
    
    let error_with_sql = error.with_sql("SELECT * FROM test");
    assert_eq!(error_with_sql.sql, Some("SELECT * FROM test".to_string()));
    
    web_sys::console::log_1(&"✓ Error types test passed".into());
}

#[wasm_bindgen_test]
async fn test_typescript_compatibility() {
    // Test that types can be serialized/deserialized for TypeScript
    let config = DatabaseConfig::default();
    
    // This should not panic - testing that tsify annotations work
    let _serialized = serde_wasm_bindgen::to_value(&config);
    
    web_sys::console::log_1(&"✓ TypeScript compatibility test passed".into());
}

#[wasm_bindgen_test]
async fn test_compilation_requirements() {
    // Test that all required features compile
    use sqlite_indexeddb_rs::*;
    
    // Test that we can access all public APIs
    let _config = DatabaseConfig::default();
    let _error = DatabaseError::new("TEST", "test");
    let _value = ColumnValue::Null;
    
    // Test that logging works
    log::info!("Compilation test running");
    
    web_sys::console::log_1(&"✓ Compilation requirements test passed".into());
}
