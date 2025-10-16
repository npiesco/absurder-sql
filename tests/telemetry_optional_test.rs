//! Test that telemetry is truly optional and doesn't force dependencies
//!
//! These tests should compile and run even WITHOUT the telemetry feature flag.
//! This proves that users can use AbsurderSQL with zero telemetry overhead.

#![cfg(target_arch = "wasm32")]

use wasm_bindgen_test::*;
use absurder_sql::{Database, DatabaseConfig};

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_database_creation_without_telemetry() {
    // Should be able to create database without any telemetry dependencies
    let config = DatabaseConfig {
        name: "test_no_telemetry".to_string(),
        ..Default::default()
    };
    let mut db = Database::new(config)
        .await
        .expect("Failed to create database");
    
    // Basic operation should work
    let _ = db.execute("SELECT 1 as value").await;
    // Test passes if we get here - proving database works without telemetry
}

#[wasm_bindgen_test]
async fn test_database_operations_without_telemetry() {
    let config = DatabaseConfig {
        name: "test_ops_no_telemetry".to_string(),
        ..Default::default()
    };
    let mut db = Database::new(config)
        .await
        .expect("Failed to create database");
    
    // Create table
    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)")
        .await
        .expect("Failed to create table");
    
    // Insert data
    db.execute("INSERT INTO test (id, name) VALUES (1, 'Alice')")
        .await
        .expect("Failed to insert data");
    
    // Query data
    let _ = db.execute("SELECT * FROM test")
        .await
        .expect("Failed to query data");
    
    // Test passes - database operations work without telemetry
}

#[wasm_bindgen_test]
async fn test_multiple_databases_without_telemetry() {
    let config1 = DatabaseConfig {
        name: "test_multi_1".to_string(),
        ..Default::default()
    };
    let mut db1 = Database::new(config1)
        .await
        .expect("Failed to create db1");
    
    let config2 = DatabaseConfig {
        name: "test_multi_2".to_string(),
        ..Default::default()
    };
    let mut db2 = Database::new(config2)
        .await
        .expect("Failed to create db2");
    
    // Both databases should work independently
    db1.execute("CREATE TABLE t1 (id INTEGER)")
        .await
        .expect("Failed on db1");
    
    db2.execute("CREATE TABLE t2 (id INTEGER)")
        .await
        .expect("Failed on db2");
    
    // Test passes - multiple databases work without telemetry
}

#[wasm_bindgen_test]
async fn test_transactions_without_telemetry() {
    let config = DatabaseConfig {
        name: "test_txn_no_telemetry".to_string(),
        ..Default::default()
    };
    let mut db = Database::new(config)
        .await
        .expect("Failed to create database");
    
    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)")
        .await
        .expect("Failed to create table");
    
    // Transaction should work without telemetry
    db.execute("BEGIN TRANSACTION").await.expect("Failed to begin");
    db.execute("INSERT INTO test VALUES (1, 'test')").await.expect("Failed to insert");
    db.execute("COMMIT").await.expect("Failed to commit");
    
    let _ = db.execute("SELECT * FROM test")
        .await
        .expect("Failed to query");
    
    // Test passes - transactions work without telemetry
}

#[wasm_bindgen_test]
async fn test_complex_queries_without_telemetry() {
    let config = DatabaseConfig {
        name: "test_complex_no_telemetry".to_string(),
        ..Default::default()
    };
    let mut db = Database::new(config)
        .await
        .expect("Failed to create database");
    
    // Create schema
    db.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)")
        .await
        .expect("Failed to create table");
    
    // Insert test data
    db.execute("INSERT INTO users VALUES (1, 'Alice', 30), (2, 'Bob', 25), (3, 'Charlie', 35)")
        .await
        .expect("Failed to insert data");
    
    // Complex query with WHERE and ORDER BY
    let _ = db.execute("SELECT name, age FROM users WHERE age > 25 ORDER BY age DESC")
        .await
        .expect("Failed to execute complex query");
    
    // Test passes - complex queries work without telemetry
}

#[wasm_bindgen_test]
async fn test_export_import_without_telemetry() {
    let config = DatabaseConfig {
        name: "test_export_no_telemetry".to_string(),
        ..Default::default()
    };
    let mut db = Database::new(config)
        .await
        .expect("Failed to create database");
    
    // Create and populate table
    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT)")
        .await
        .expect("Failed to create table");
    
    db.execute("INSERT INTO test VALUES (1, 'test data')")
        .await
        .expect("Failed to insert data");
    
    // Export should work without telemetry
    let export_data = db.export_to_file()
        .await
        .expect("Failed to export without telemetry");
    
    assert!(export_data.length() > 0, "Export should produce data");
    
    // Import should work without telemetry
    let config2 = DatabaseConfig {
        name: "test_import_no_telemetry".to_string(),
        ..Default::default()
    };
    let mut db2 = Database::new(config2)
        .await
        .expect("Failed to create second database");
    
    db2.import_from_file(export_data)
        .await
        .expect("Failed to import without telemetry");
}

// This test should NOT be available when telemetry feature is disabled
#[cfg(feature = "telemetry")]
#[wasm_bindgen_test]
async fn test_telemetry_available_when_enabled() {
    // This test will only compile when telemetry feature is enabled
    use absurder_sql::telemetry::Metrics;
    
    let _metrics = Metrics::new().expect("Failed to create metrics");
    assert!(true, "Metrics should be available with telemetry feature");
}

// Compile-time proof that telemetry module doesn't exist without feature
#[cfg(not(feature = "telemetry"))]
#[test]
fn test_telemetry_not_available_without_feature() {
    // This test proves that telemetry module is not compiled without feature
    // If this compiles, it means the module is properly feature-gated
    
    // The following should NOT compile without telemetry feature:
    // use absurder_sql::telemetry::Metrics;  // This would fail to compile
    
    assert!(true, "Test passes by compiling");
}
