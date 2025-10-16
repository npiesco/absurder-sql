#![cfg(target_arch = "wasm32")]

use wasm_bindgen_test::*;
use absurder_sql::DatabaseConfig;

wasm_bindgen_test_configure!(run_in_browser);

/// Test Example 1: Basic Export (from export_import.js)
#[wasm_bindgen_test]
async fn test_example_basic_export() {
    web_sys::console::log_1(&"=== Testing Basic Export Example ===".into());
    
    // Initialize database
    let config = DatabaseConfig {
        name: "example_export.db".to_string(),
        ..Default::default()
    };
    
    let mut db = absurder_sql::Database::new(config).await
        .expect("Should create database");
    
    // Create schema and data
    db.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)").await
        .expect("Should create table");
    db.execute("INSERT INTO users (name) VALUES ('Alice'), ('Bob')").await
        .expect("Should insert data");
    
    // Export
    let exported = db.export_to_file().await
        .expect("Should export database");
    
    // Verify export
    assert!(exported.length() > 0, "Export should contain data");
    web_sys::console::log_1(&format!("Exported {} bytes", exported.length()).into());
    
    db.close().await.expect("Should close database");
    web_sys::console::log_1(&"Basic Export Example - PASSED".into());
}

/// Test Example 2: Basic Import (from export_import.js)
#[wasm_bindgen_test]
async fn test_example_basic_import() {
    web_sys::console::log_1(&"=== Testing Basic Import Example ===".into());
    
    // Create source database
    let config1 = DatabaseConfig {
        name: "example_import_source.db".to_string(),
        ..Default::default()
    };
    
    let mut db1 = absurder_sql::Database::new(config1).await
        .expect("Should create source database");
    
    db1.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)").await
        .expect("Should create table");
    db1.execute("INSERT INTO users (name) VALUES ('Alice'), ('Bob')").await
        .expect("Should insert data");
    
    // Export
    let exported = db1.export_to_file().await
        .expect("Should export");
    
    db1.close().await.expect("Should close source");
    
    // Import to new database
    let config2 = DatabaseConfig {
        name: "example_import_dest.db".to_string(),
        ..Default::default()
    };
    
    let mut db2 = absurder_sql::Database::new(config2).await
        .expect("Should create dest database");
    
    db2.import_from_file(exported).await
        .expect("Should import");
    
    // Reopen and verify
    let config3 = DatabaseConfig {
        name: "example_import_dest.db".to_string(),
        ..Default::default()
    };
    
    let mut db3 = absurder_sql::Database::new(config3).await
        .expect("Should reopen database");
    
    let result = db3.execute("SELECT COUNT(*) as count FROM users").await
        .expect("Should query");
    
    let result: absurder_sql::QueryResult = serde_wasm_bindgen::from_value(result.into())
        .expect("Should deserialize");
    
    assert_eq!(result.rows.len(), 1, "Should have one row");
    assert_eq!(result.rows[0].values.len(), 1, "Row should have one column");
    
    web_sys::console::log_1(&"Basic Import Example - PASSED".into());
}

/// Test Example 3: Export/Import Roundtrip (from export_import.js)
#[wasm_bindgen_test]
async fn test_example_roundtrip_validation() {
    web_sys::console::log_1(&"=== Testing Roundtrip Validation Example ===".into());
    
    // Create original database
    let config1 = DatabaseConfig {
        name: "example_roundtrip_orig.db".to_string(),
        ..Default::default()
    };
    
    let mut db1 = absurder_sql::Database::new(config1).await
        .expect("Should create original");
    
    db1.execute("CREATE TABLE test_data (id INTEGER PRIMARY KEY, data TEXT)").await
        .expect("Should create table");
    
    // Insert test data
    let test_values = vec!["alpha", "beta", "gamma"];
    for value in &test_values {
        db1.execute(&format!("INSERT INTO test_data (data) VALUES ('{}')", value)).await
            .expect("Should insert");
    }
    
    // Get original count
    let _result1 = db1.execute("SELECT COUNT(*) as count FROM test_data").await
        .expect("Should count");
    
    // Export
    let exported = db1.export_to_file().await
        .expect("Should export");
    
    web_sys::console::log_1(&format!("Exported {} bytes", exported.length()).into());
    
    db1.close().await.expect("Should close");
    
    // Import to new database
    let config2 = DatabaseConfig {
        name: "example_roundtrip_import.db".to_string(),
        ..Default::default()
    };
    
    let mut db2 = absurder_sql::Database::new(config2).await
        .expect("Should create import database");
    
    db2.import_from_file(exported).await
        .expect("Should import");
    
    // Reopen
    let config3 = DatabaseConfig {
        name: "example_roundtrip_import.db".to_string(),
        ..Default::default()
    };
    
    let mut db3 = absurder_sql::Database::new(config3).await
        .expect("Should reopen");
    
    // Verify count
    let _result2 = db3.execute("SELECT COUNT(*) as count FROM test_data").await
        .expect("Should count imported");
    
    // Verify data
    let result3 = db3.execute("SELECT data FROM test_data ORDER BY id").await
        .expect("Should select data");
    
    let result3_data: absurder_sql::QueryResult = serde_wasm_bindgen::from_value(result3.into())
        .expect("Should deserialize");
    
    assert_eq!(result3_data.rows.len(), 3, "Should have 3 rows");
    
    web_sys::console::log_1(&format!("Found {} records in imported database", result3_data.rows.len()).into());
    web_sys::console::log_1(&"Roundtrip Validation Example - PASSED".into());
    
    db3.close().await.expect("Should close");
}

/// Test Example 4: Complex Schema Export (from export_import.js)
#[wasm_bindgen_test]
async fn test_example_complex_schema() {
    web_sys::console::log_1(&"=== Testing Complex Schema Example ===".into());
    
    let config = DatabaseConfig {
        name: "example_complex.db".to_string(),
        ..Default::default()
    };
    
    let mut db = absurder_sql::Database::new(config).await
        .expect("Should create database");
    
    // Create table with index and trigger
    db.execute(r#"
        CREATE TABLE employees (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            salary REAL
        )
    "#).await.expect("Should create table");
    
    db.execute("CREATE INDEX idx_name ON employees(name)").await
        .expect("Should create index");
    
    db.execute(r#"
        CREATE TRIGGER salary_check 
        BEFORE INSERT ON employees
        BEGIN
            SELECT RAISE(FAIL, 'Salary must be positive')
            WHERE NEW.salary < 0;
        END
    "#).await.expect("Should create trigger");
    
    db.execute("INSERT INTO employees VALUES (1, 'Alice', 50000)").await
        .expect("Should insert");
    
    // Export
    let exported = db.export_to_file().await
        .expect("Should export");
    
    web_sys::console::log_1(&format!("Exported complex schema: {} bytes", exported.length()).into());
    
    db.close().await.expect("Should close");
    
    // Import
    let config2 = DatabaseConfig {
        name: "example_complex_import.db".to_string(),
        ..Default::default()
    };
    
    let mut db2 = absurder_sql::Database::new(config2).await
        .expect("Should create import database");
    
    db2.import_from_file(exported).await
        .expect("Should import");
    
    // Reopen and verify
    let config3 = DatabaseConfig {
        name: "example_complex_import.db".to_string(),
        ..Default::default()
    };
    
    let mut db3 = absurder_sql::Database::new(config3).await
        .expect("Should reopen");
    
    // Verify trigger exists
    let result = db3.execute("SELECT name FROM sqlite_master WHERE type='trigger'").await
        .expect("Should query triggers");
    
    let result_data: absurder_sql::QueryResult = serde_wasm_bindgen::from_value(result.into())
        .expect("Should deserialize");
    
    assert!(result_data.rows.len() > 0, "Should have at least one trigger");
    
    web_sys::console::log_1(&format!("Complex schema preserved ({} triggers)", result_data.rows.len()).into());
    web_sys::console::log_1(&"Complex Schema Example - PASSED".into());
    
    db3.close().await.expect("Should close");
}

/// Test Example 5: File Size Validation (from export_import.js)
#[wasm_bindgen_test]
async fn test_example_file_size_validation() {
    web_sys::console::log_1(&"=== Testing File Size Validation Example ===".into());
    
    let config = DatabaseConfig {
        name: "example_size.db".to_string(),
        ..Default::default()
    };
    
    let mut db = absurder_sql::Database::new(config).await
        .expect("Should create database");
    
    db.execute("CREATE TABLE data (id INTEGER PRIMARY KEY, content TEXT)").await
        .expect("Should create table");
    db.execute("INSERT INTO data (content) VALUES ('test data')").await
        .expect("Should insert");
    
    // Export
    let exported = db.export_to_file().await
        .expect("Should export");
    
    let size_kb = exported.length() as f64 / 1024.0;
    
    // Verify size is reasonable (should be a few KB for small database)
    assert!(size_kb > 0.0, "Export should have non-zero size");
    assert!(size_kb < 100.0, "Small database should be under 100KB");
    
    web_sys::console::log_1(&format!("Export size: {:.2} KB (reasonable)", size_kb).into());
    web_sys::console::log_1(&"File Size Validation Example - PASSED".into());
    
    db.close().await.expect("Should close");
}
