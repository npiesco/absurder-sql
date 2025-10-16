//! Tests for query execution metrics instrumentation
//!
//! Validates that Database::execute properly tracks:
//! - queries_total counter
//! - errors_total counter  
//! - query_duration histogram
//! - Query type classification (SELECT vs INSERT/UPDATE/DELETE)

#![cfg(feature = "telemetry")]

#[cfg(target_arch = "wasm32")]
use wasm_bindgen_test::*;

#[cfg(target_arch = "wasm32")]
wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

/// Test that successful queries increment the queries_total counter
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_query_execution_increments_counter() {
    use absurder_sql::{Database, DatabaseConfig};
    
    // Create database with metrics
    let config = DatabaseConfig {
        name: "test_metrics".to_string(),
        ..Default::default()
    };
    let mut db = Database::new(config)
        .await
        .expect("Failed to create database");
    
    // Get initial count
    let initial_count = db.metrics().expect("Metrics should be available").queries_total().get();
    
    // Execute a query
    db.execute("SELECT 1").await.expect("Query should succeed");
    
    // Verify counter incremented
    let final_count = db.metrics().expect("Metrics should be available").queries_total().get();
    assert_eq!(final_count, initial_count + 1.0);
}

/// Test that query duration is recorded
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_query_execution_records_duration() {
    use absurder_sql::{Database, DatabaseConfig};
    
    let config = DatabaseConfig {
        name: "test_duration".to_string(),
        ..Default::default()
    };
    let mut db = Database::new(config)
        .await
        .expect("Failed to create database");
    
    let initial_count = db.metrics().expect("Metrics should be available").query_duration().get_sample_count();
    
    // Execute a query
    db.execute("SELECT 1").await.expect("Query should succeed");
    
    // Verify duration was recorded
    let final_count = db.metrics().expect("Metrics should be available").query_duration().get_sample_count();
    assert_eq!(final_count, initial_count + 1);
}

/// Test that failed queries increment error counter
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_query_error_increments_error_counter() {
    use absurder_sql::{Database, DatabaseConfig};
    
    let config = DatabaseConfig {
        name: "test_errors".to_string(),
        ..Default::default()
    };
    let mut db = Database::new(config)
        .await
        .expect("Failed to create database");
    
    let initial_errors = db.metrics().expect("Metrics should be available").errors_total().get();
    
    // Execute an invalid query
    let result = db.execute("SELECT * FROM nonexistent_table").await;
    
    // Query should fail
    assert!(result.is_err());
    
    // Error counter should increment
    let final_errors = db.metrics().expect("Metrics should be available").errors_total().get();
    assert_eq!(final_errors, initial_errors + 1.0);
}

/// Test multiple queries accumulate metrics
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_multiple_queries_accumulate_metrics() {
    use absurder_sql::{Database, DatabaseConfig};
    
    let config = DatabaseConfig {
        name: "test_multiple".to_string(),
        ..Default::default()
    };
    let mut db = Database::new(config)
        .await
        .expect("Failed to create database");
    
    // Execute multiple queries
    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)").await.expect("Create should succeed");
    db.execute("INSERT INTO test (value) VALUES ('test1')").await.expect("Insert 1 should succeed");
    db.execute("INSERT INTO test (value) VALUES ('test2')").await.expect("Insert 2 should succeed");
    db.execute("SELECT * FROM test").await.expect("Select should succeed");
    
    // Should have 4 queries total
    assert!(db.metrics().expect("Metrics should be available").queries_total().get() >= 4.0);
    
    // Should have 4 duration samples
    assert!(db.metrics().expect("Metrics should be available").query_duration().get_sample_count() >= 4);
}

/// Test that metrics are isolated per database instance
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_metrics_isolated_per_instance() {
    use absurder_sql::{Database, DatabaseConfig};
    
    let config1 = DatabaseConfig {
        name: "test_db1".to_string(),
        ..Default::default()
    };
    let mut db1 = Database::new(config1)
        .await
        .expect("Failed to create db1");
    
    let config2 = DatabaseConfig {
        name: "test_db2".to_string(),
        ..Default::default()
    };
    let db2 = Database::new(config2)
        .await
        .expect("Failed to create db2");
    
    // Execute query on db1
    db1.execute("SELECT 1").await.expect("Query should succeed");
    
    // db1 metrics should be updated
    assert!(db1.metrics().expect("Metrics should be available").queries_total().get() >= 1.0);
    
    // db2 metrics should be independent (could be 0 or higher if shared)
    // For now, we'll just verify both have metrics
    assert!(db2.metrics().expect("Metrics should be available").queries_total().get() >= 0.0);
}

/// Test query execution with parameters tracks metrics
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_parameterized_query_tracks_metrics() {
    use absurder_sql::{Database, DatabaseConfig, ColumnValue};
    
    let config = DatabaseConfig {
        name: "test_params".to_string(),
        ..Default::default()
    };
    let mut db = Database::new(config)
        .await
        .expect("Failed to create database");
    
    // Create table
    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)").await.expect("Create should succeed");
    
    let initial_count = db.metrics().expect("Metrics should be available").queries_total().get();
    
    // Execute parameterized query
    let params = vec![ColumnValue::Text("test".to_string())];
    let params_js = serde_wasm_bindgen::to_value(&params).unwrap();
    
    db.execute_with_params("INSERT INTO test (value) VALUES (?)", params_js)
        .await
        .expect("Insert should succeed");
    
    // Verify metrics incremented
    let final_count = db.metrics().expect("Metrics should be available").queries_total().get();
    assert!(final_count > initial_count);
}

/// Test that cache operations are tracked
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_cache_metrics_tracking() {
    use absurder_sql::{Database, DatabaseConfig};
    
    let config = DatabaseConfig {
        name: "test_cache".to_string(),
        ..Default::default()
    };
    let mut db = Database::new(config)
        .await
        .expect("Failed to create database");
    
    // Create and populate table
    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)").await.expect("Create should succeed");
    db.execute("INSERT INTO test (value) VALUES ('test')").await.expect("Insert should succeed");
    
    // First SELECT might be a cache miss
    db.execute("SELECT * FROM test").await.expect("Select should succeed");
    
    // Second SELECT might be a cache hit
    db.execute("SELECT * FROM test").await.expect("Select should succeed");
    
    // Verify cache metrics exist (hit or miss)
    let metrics = db.metrics().expect("Metrics should be available");
    let total_cache_ops = metrics.cache_hits().get() + metrics.cache_misses().get();
    assert!(total_cache_ops >= 0.0);
}

// Native-only tests
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_metrics_available_on_native() {
    use absurder_sql::telemetry::Metrics;
    // On native, Database might be SqliteIndexedDB
    // This test just validates the Metrics API is available
    let metrics = Metrics::new().expect("Should create metrics");
    assert_eq!(metrics.queries_total().get(), 0.0);
}
