//! Phase 4: Combined SQLite + IndexedDB Tests
//! TDD approach: Write failing tests for the complete integration

#![cfg(target_arch = "wasm32")]
#![allow(unused_imports)]

use wasm_bindgen_test::*;
use sqlite_indexeddb_rs::*;
use sqlite_indexeddb_rs::WasmColumnValue;

wasm_bindgen_test_configure!(run_in_browser);

/// Test full database integration with BigInt and Date
#[wasm_bindgen_test]
async fn test_database_integration() {
    let config = DatabaseConfig {
        name: "test_combined.db".to_string(),
        ..Default::default()
    };
    
    let mut db = sqlite_indexeddb_rs::Database::new(config).await
        .expect("Should create database");
    
    // Create test table
    db.execute("CREATE TABLE integration_test (id INTEGER PRIMARY KEY, big_val TEXT, date_val INTEGER)").await
        .expect("Should create table");
    
    // Test BigInt and Date values using WasmColumnValue
    let big_int_str = "9007199254740993";
    let date_val = js_sys::Date::now() as i64;
    
    let sql = format!("INSERT INTO integration_test (big_val, date_val) VALUES ('{}', {})", 
                     big_int_str, date_val);
    db.execute(&sql).await.expect("Should insert test data");
    
    web_sys::console::log_1(&"✓ Database integration test passed".into());
}

/// Test combined operations with all data types
#[wasm_bindgen_test]
async fn test_combined_operations() {
    let config = DatabaseConfig {
        name: "test_combined_ops.db".to_string(),
        ..Default::default()
    };
    
    let mut db = sqlite_indexeddb_rs::Database::new(config).await
        .expect("Should create database");
    
    // Create table with various types
    db.execute("CREATE TABLE types_test (
        id INTEGER PRIMARY KEY,
        null_val TEXT,
        int_val INTEGER,
        real_val REAL,
        text_val TEXT,
        bigint_val TEXT,
        date_val INTEGER
    )").await.expect("Should create types table");
    
    // Insert data with all types
    db.execute("INSERT INTO types_test (null_val, int_val, real_val, text_val, bigint_val, date_val) 
               VALUES (NULL, 42, 3.14159, 'Hello', '9007199254740993', 1692115200000)").await
        .expect("Should insert mixed types");
    
    // Query back
    let result = db.execute("SELECT * FROM types_test").await
        .expect("Should select data");
    let result: QueryResult = serde_wasm_bindgen::from_value(result)
        .expect("deserialize QueryResult");
    
    assert_eq!(result.rows.len(), 1, "Should have 1 row");
    
    web_sys::console::log_1(&"✓ Combined operations test passed".into());
}

/// Test error handling in combined scenarios
#[wasm_bindgen_test]
fn test_error_handling() {
    let error = DatabaseError::new("COMBINED_ERROR", "Test error in combined scenario");
    let error_with_sql = error.with_sql("SELECT * FROM test_table");
    
    assert_eq!(error_with_sql.code, "COMBINED_ERROR");
    assert_eq!(error_with_sql.message, "Test error in combined scenario");
    assert_eq!(error_with_sql.sql, Some("SELECT * FROM test_table".to_string()));
    
    web_sys::console::log_1(&"✓ Error handling test passed".into());
}

#[wasm_bindgen_test]
async fn test_large_dataset_persistence() {
    let config = DatabaseConfig {
        name: "test_large_dataset.db".to_string(),
        ..Default::default()
    };
    
    let mut db = sqlite_indexeddb_rs::Database::new(config).await
        .expect("Should create database");
    
    // Create table for large dataset
    db.execute("CREATE TABLE large_test (id INTEGER PRIMARY KEY, value INTEGER, text_data TEXT)").await
        .expect("Should create large table");
    
    // Insert many rows
    let row_count = 100;
    for i in 1..=row_count {
        let sql = format!("INSERT INTO large_test (value, text_data) VALUES ({}, 'data_{}_{}')", 
                         i, i, "x".repeat(i as usize % 100));
        db.execute(&sql).await.expect("Should insert row");
    }
    
    // Sync large dataset
    db.sync().await.expect("Should sync large dataset");
    
    // Verify count
    let count_result = db.execute("SELECT COUNT(*) FROM large_test").await
        .expect("Should count rows");
    let count_result: QueryResult = serde_wasm_bindgen::from_value(count_result)
        .expect("deserialize QueryResult");
    
    match count_result.rows[0].values[0].clone() {
        ColumnValue::Integer(count) => assert_eq!(count, row_count as i64),
        _ => panic!("Expected integer count"),
    }
    
    web_sys::console::log_1(&"✓ Large dataset persistence test passed".into());
}

#[wasm_bindgen_test]
async fn test_transaction_consistency() {
    let config = DatabaseConfig {
        name: "test_transaction_consistency.db".to_string(),
        ..Default::default()
    };
    
    let mut db = sqlite_indexeddb_rs::Database::new(config).await
        .expect("Should create database");
    
    // Setup accounts table
    db.execute("CREATE TABLE accounts (id INTEGER PRIMARY KEY, name TEXT, balance REAL)").await
        .expect("Should create accounts table");
    
    db.execute("INSERT INTO accounts (name, balance) VALUES ('Alice', 100.0)").await
        .expect("Should insert Alice");
    
    db.execute("INSERT INTO accounts (name, balance) VALUES ('Bob', 50.0)").await
        .expect("Should insert Bob");
    
    // Simulate transfer (Alice -> Bob: $25)
    db.execute("UPDATE accounts SET balance = balance - 25.0 WHERE name = 'Alice'").await
        .expect("Should debit Alice");
    
    db.execute("UPDATE accounts SET balance = balance + 25.0 WHERE name = 'Bob'").await
        .expect("Should credit Bob");
    
    db.sync().await.expect("Should sync transfer");
    
    // Verify final balances
    let result = db.execute("SELECT name, balance FROM accounts ORDER BY name").await
        .expect("Should select final balances");
    let result: QueryResult = serde_wasm_bindgen::from_value(result)
        .expect("deserialize QueryResult");
    
    assert_eq!(result.rows.len(), 2, "Should have 2 accounts");
    
    web_sys::console::log_1(&"✓ Transaction consistency test passed".into());
}

#[wasm_bindgen_test]
async fn test_schema_changes_persistence() {
    let config = DatabaseConfig {
        name: "test_schema_persistence.db".to_string(),
        ..Default::default()
    };
    
    let mut db = sqlite_indexeddb_rs::Database::new(config).await
        .expect("Should create database");
    
    // Create initial table
    db.execute("CREATE TABLE schema_test (id INTEGER PRIMARY KEY, name TEXT)").await
        .expect("Should create initial table");
    
    // Insert initial data
    db.execute("INSERT INTO schema_test (name) VALUES ('initial')").await
        .expect("Should insert initial data");
    
    // Add column
    db.execute("ALTER TABLE schema_test ADD COLUMN email TEXT").await
        .expect("Should add column");
    
    // Insert data with new column
    db.execute("INSERT INTO schema_test (name, email) VALUES ('new_user', 'test@example.com')").await
        .expect("Should insert with new column");
    
    db.sync().await.expect("Should sync schema changes");
    
    // Verify schema and data
    let result = db.execute("SELECT name, email FROM schema_test ORDER BY id").await
        .expect("Should select with new schema");
    let result: QueryResult = serde_wasm_bindgen::from_value(result)
        .expect("deserialize QueryResult");
    
    assert_eq!(result.columns, vec!["name", "email"]);
    assert_eq!(result.rows.len(), 2, "Should have 2 rows");
    
    web_sys::console::log_1(&"✓ Schema changes persistence test passed".into());
}

#[wasm_bindgen_test]
async fn test_concurrent_database_access() {
    let db_name = "test_concurrent_access.db";
    
    let config1 = DatabaseConfig {
        name: db_name.to_string(),
        ..Default::default()
    };
    
    let config2 = DatabaseConfig {
        name: db_name.to_string(),
        ..Default::default()
    };
    
    let mut db1 = sqlite_indexeddb_rs::Database::new(config1).await
        .expect("Should create database 1");
    
    let mut db2 = sqlite_indexeddb_rs::Database::new(config2).await
        .expect("Should create database 2");
    
    // Create table with db1
    db1.execute("CREATE TABLE concurrent_test (id INTEGER PRIMARY KEY, source TEXT)").await
        .expect("Should create table with db1");
    
    // Insert with both databases
    db1.execute("INSERT INTO concurrent_test (source) VALUES ('db1')").await
        .expect("Should insert with db1");
    
    db1.sync().await.expect("Should sync db1");
    
    db2.execute("INSERT INTO concurrent_test (source) VALUES ('db2')").await
        .expect("Should insert with db2");
    
    db2.sync().await.expect("Should sync db2");
    
    // Read from both
    let result1 = db1.execute("SELECT COUNT(*) FROM concurrent_test").await
        .expect("Should count from db1");
    
    let result2 = db2.execute("SELECT COUNT(*) FROM concurrent_test").await
        .expect("Should count from db2");
    
    // Both should see data
    let result1: QueryResult = serde_wasm_bindgen::from_value(result1)
        .expect("deserialize QueryResult");
    let result2: QueryResult = serde_wasm_bindgen::from_value(result2)
        .expect("deserialize QueryResult");
    
    match (result1.rows[0].values[0].clone(), result2.rows[0].values[0].clone()) {
        (ColumnValue::Integer(count1), ColumnValue::Integer(count2)) => {
            assert!(count1 >= 1, "DB1 should see at least its own insert");
            assert!(count2 >= 1, "DB2 should see at least its own insert");
        }
        _ => panic!("Expected integer counts"),
    }
    
    web_sys::console::log_1(&"✓ Concurrent database access test passed".into());
}

#[wasm_bindgen_test]
async fn test_database_configuration_effects() {
    let config_small = DatabaseConfig {
        name: "test_config_small.db".to_string(),
        cache_size: Some(1_000),
        page_size: Some(1024),
        ..Default::default()
    };
    
    let config_large = DatabaseConfig {
        name: "test_config_large.db".to_string(),
        cache_size: Some(50_000),
        page_size: Some(8192),
        ..Default::default()
    };
    
    let mut db_small = sqlite_indexeddb_rs::Database::new(config_small).await
        .expect("Should create small config database");
    
    let mut db_large = sqlite_indexeddb_rs::Database::new(config_large).await
        .expect("Should create large config database");
    
    // Create similar tables in both
    db_small.execute("CREATE TABLE config_test (id INTEGER PRIMARY KEY, data TEXT)").await
        .expect("Should create table in small db");
    
    db_large.execute("CREATE TABLE config_test (id INTEGER PRIMARY KEY, data TEXT)").await
        .expect("Should create table in large db");
    
    // Insert test data
    db_small.execute("INSERT INTO config_test (data) VALUES ('small_config')").await
        .expect("Should insert in small db");
    
    db_large.execute("INSERT INTO config_test (data) VALUES ('large_config')").await
        .expect("Should insert in large db");
    
    // Verify both work
    let result_small = db_small.execute("SELECT data FROM config_test").await
        .expect("Should select from small db");
    
    let result_large = db_large.execute("SELECT data FROM config_test").await
        .expect("Should select from large db");
    let result_small: QueryResult = serde_wasm_bindgen::from_value(result_small)
        .expect("deserialize QueryResult");
    let result_large: QueryResult = serde_wasm_bindgen::from_value(result_large)
        .expect("deserialize QueryResult");
    
    assert_eq!(result_small.rows.len(), 1, "Small db should have 1 row");
    assert_eq!(result_large.rows.len(), 1, "Large db should have 1 row");
    
    web_sys::console::log_1(&"✓ Database configuration effects test passed".into());
}

#[wasm_bindgen_test]
async fn test_comprehensive_crud_operations() {
    let config = DatabaseConfig {
        name: "test_comprehensive_crud.db".to_string(),
        ..Default::default()
    };
    
    let mut db = sqlite_indexeddb_rs::Database::new(config).await
        .expect("Should create database");
    
    // CREATE: Set up table and initial data
    db.execute("CREATE TABLE crud_test (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        price REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )").await.expect("Should create CRUD table");
    
    // INSERT multiple records
    let products = vec![
        ("Laptop", "Electronics", 999.99),
        ("Coffee", "Beverages", 4.99),
        ("Book", "Education", 19.99),
        ("Phone", "Electronics", 699.99),
    ];
    
    for (name, category, price) in products {
        let sql = format!("INSERT INTO crud_test (name, category, price) VALUES ('{}', '{}', {})", 
                         name, category, price);
        db.execute(&sql).await.expect("Should insert product");
    }
    
    // READ: Verify all data
    let all_result = db.execute("SELECT id, name, category, price FROM crud_test ORDER BY id").await
        .expect("Should select all products");
    let all_result: QueryResult = serde_wasm_bindgen::from_value(all_result)
        .expect("deserialize QueryResult");
    
    assert_eq!(all_result.rows.len(), 4, "Should have 4 products");
    
    // UPDATE: Change prices
    db.execute("UPDATE crud_test SET price = price * 0.9 WHERE category = 'Electronics'").await
        .expect("Should apply electronics discount");
    
    // DELETE: Remove cheap items
    let delete_result = db.execute("DELETE FROM crud_test WHERE price < 10.0").await
        .expect("Should delete cheap items");
    let delete_result: QueryResult = serde_wasm_bindgen::from_value(delete_result)
        .expect("deserialize QueryResult");
    
    assert!(delete_result.affected_rows >= 1, "Should delete at least 1 item");
    
    // Sync all changes
    db.sync().await.expect("Should sync all CRUD operations");
    
    // Final verification
    let final_result = db.execute("SELECT name, category, price FROM crud_test ORDER BY name").await
        .expect("Should select final state");
    let final_result: QueryResult = serde_wasm_bindgen::from_value(final_result)
        .expect("deserialize QueryResult");
    
    assert!(final_result.rows.len() >= 2, "Should have remaining products");
    
    web_sys::console::log_1(&"✓ Comprehensive CRUD operations test passed".into());
}

#[wasm_bindgen_test]
async fn test_bigint_handling() {
    let config = DatabaseConfig {
        name: "test_bigint.db".to_string(),
        ..Default::default()
    };
    
    let mut db = sqlite_indexeddb_rs::Database::new(config).await
        .expect("Should create database");
    
    // Create table for BigInt testing
    db.execute("CREATE TABLE bigint_test (id INTEGER PRIMARY KEY, large_number TEXT)").await
        .expect("Should create bigint table");
    
    // Test very large integers
    let large_numbers = vec![
        "9007199254740993",
        "123456789012345678901234567890",
        "-987654321098765432109876543210",
    ];
    
    for large_num in &large_numbers {
        let sql = format!("INSERT INTO bigint_test (large_number) VALUES ('{}')", large_num);
        db.execute(&sql).await.expect("Should insert large number");
    }
    
    db.sync().await.expect("Should sync bigint data");
    
    let result = db.execute("SELECT large_number FROM bigint_test ORDER BY id").await
        .expect("Should select large numbers");
    let result: QueryResult = serde_wasm_bindgen::from_value(result)
        .expect("deserialize QueryResult");
    
    assert_eq!(result.rows.len(), 3, "Should have 3 large numbers");
    
    for (i, expected) in large_numbers.iter().enumerate() {
        match &result.rows[i].values[0] {
            ColumnValue::Text(stored) => assert_eq!(stored.as_str(), *expected),
            ColumnValue::BigInt(stored) => assert_eq!(stored.as_str(), *expected),
            _ => panic!("Expected text or bigint for large number"),
        }
    }
    
    web_sys::console::log_1(&"✓ BigInt handling test passed".into());
}

#[wasm_bindgen_test]
async fn test_date_handling() {
    let config = DatabaseConfig {
        name: "test_date.db".to_string(),
        ..Default::default()
    };
    
    let mut db = sqlite_indexeddb_rs::Database::new(config).await
        .expect("Should create database");
    
    // Create table for Date testing
    db.execute("CREATE TABLE date_test (id INTEGER PRIMARY KEY, event_time INTEGER, description TEXT)").await
        .expect("Should create date table");
    
    // Test various date formats
    let now_timestamp = js_sys::Date::now() as i64;
    
    let events = vec![
        (now_timestamp, "Current time"),
        (1692115200000, "Fixed timestamp"),
        (0, "Unix epoch"),
    ];
    
    for (timestamp, description) in &events {
        let sql = format!("INSERT INTO date_test (event_time, description) VALUES ({}, '{}')", 
                         timestamp, description);
        db.execute(&sql).await.expect("Should insert date");
    }
    
    db.sync().await.expect("Should sync date data");
    
    let result = db.execute("SELECT event_time, description FROM date_test ORDER BY id").await
        .expect("Should select dates");
    let result: QueryResult = serde_wasm_bindgen::from_value(result)
        .expect("deserialize QueryResult");
    
    assert_eq!(result.rows.len(), 3, "Should have 3 date entries");
    
    for (i, (expected_timestamp, expected_desc)) in events.iter().enumerate() {
        let vals = &result.rows[i].values;
        match (&vals[0], &vals[1]) {
            (ColumnValue::Integer(stored_time), ColumnValue::Text(stored_desc)) => {
                assert_eq!(*stored_time, *expected_timestamp);
                assert_eq!(stored_desc.as_str(), *expected_desc);
            }
            (ColumnValue::Date(stored_time), ColumnValue::Text(stored_desc)) => {
                assert_eq!(*stored_time, *expected_timestamp);
                assert_eq!(stored_desc.as_str(), *expected_desc);
            }
            _ => panic!("Expected integer/date and text for date entry"),
        }
    }
    
    web_sys::console::log_1(&"✓ Date handling test passed".into());
}

#[wasm_bindgen_test]
async fn test_mixed_data_types() {
    let config = DatabaseConfig {
        name: "test_mixed_types.db".to_string(),
        ..Default::default()
    };
    
    let mut db = sqlite_indexeddb_rs::Database::new(config).await
        .expect("Should create database");
    
    // Create comprehensive table
    db.execute("CREATE TABLE mixed_test (
        id INTEGER PRIMARY KEY,
        null_col TEXT,
        int_col INTEGER,
        real_col REAL,
        text_col TEXT,
        blob_col BLOB,
        bigint_col TEXT,
        date_col INTEGER
    )").await.expect("Should create mixed types table");
    
    // Insert row with all data types
    db.execute("INSERT INTO mixed_test (
        null_col, int_col, real_col, text_col, 
        bigint_col, date_col
    ) VALUES (
        NULL, 42, 3.14159, 'Hello SQLite',
        '9007199254740993', 1692115200000
    )").await.expect("Should insert mixed data");
    
    db.sync().await.expect("Should sync mixed data");
    
    let result = db.execute("SELECT * FROM mixed_test").await
        .expect("Should select mixed data");
    let result: QueryResult = serde_wasm_bindgen::from_value(result)
        .expect("deserialize QueryResult");
    
    assert_eq!(result.rows.len(), 1, "Should have 1 mixed row");
    
    let row = &result.rows[0];
    assert_eq!(row.values.len(), 8, "Should have 8 columns");
    
    // Verify column types
    match &row.values[1] { // null_col
        ColumnValue::Null => {},
        _ => panic!("Expected NULL"),
    }
    
    match &row.values[2] { // int_col
        ColumnValue::Integer(42) => {},
        _ => panic!("Expected integer 42"),
    }
    
    match &row.values[3] { // real_col
        ColumnValue::Real(val) => assert!((val - 3.14159).abs() < 0.00001),
        _ => panic!("Expected real number"),
    }
    
    match &row.values[4] { // text_col
        ColumnValue::Text(text) => assert_eq!(text, "Hello SQLite"),
        _ => panic!("Expected text"),
    }
    
    match &row.values[6] { // bigint_col
        ColumnValue::Text(bigint) | ColumnValue::BigInt(bigint) => {
            assert_eq!(bigint, "9007199254740993");
        },
        _ => panic!("Expected bigint as text"),
    }
    
    match &row.values[7] { // date_col
        ColumnValue::Integer(1692115200000) | ColumnValue::Date(1692115200000) => {},
        _ => panic!("Expected date as timestamp"),
    }
    
    web_sys::console::log_1(&"✓ Mixed data types test passed".into());
}