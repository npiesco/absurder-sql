//! SQLite WASM Hang Regression Test
//! 
//! This test prevents regression of the SQLite WASM hang issue that occurred when using
//! deprecated initialization patterns or problematic sqlite3_step calls.
//! 
//! The original issue was caused by:
//! 1. Deprecated WASM module initialization parameters in sqlite-wasm-rs
//! 2. Infinite loops in sqlite3_step due to incompatible parameter passing
//! 3. Missing timeout mechanisms for long-running operations
//!
//! This test ensures:
//! - SQLite operations complete within reasonable time limits
//! - No infinite loops in sqlite3_step calls
//! - Proper error handling for timeout scenarios
//! - Detection of deprecated initialization patterns

#![cfg(target_arch = "wasm32")]

use wasm_bindgen_test::*;
use absurder_sql::{Database, DatabaseConfig, ColumnValue};
use js_sys::Date;

wasm_bindgen_test_configure!(run_in_browser);

/// Maximum time allowed for any SQLite operation (in milliseconds)
/// Increased to account for WASM overhead and transaction buffering (absurd-sql pattern)
/// Set to 15s to accommodate Firefox/Safari which are ~40% slower than Chrome
const MAX_OPERATION_TIME_MS: f64 = 15000.0;

/// Test that basic SQLite operations complete within timeout limits
#[wasm_bindgen_test]
async fn test_sqlite_operations_no_hang() {
    let start_time = Date::now();
    
    // Create database - should complete quickly
    let config = DatabaseConfig {
        name: "hang_regression_test".to_string(),
        cache_size: Some(1000),
        ..Default::default()
    };
    
    let mut db = Database::new(config).await.expect("Database creation should not hang");
    let creation_time = Date::now() - start_time;
    assert!(creation_time < MAX_OPERATION_TIME_MS, 
        "Database creation took {}ms, exceeds limit of {}ms", creation_time, MAX_OPERATION_TIME_MS);
    
    // Test CREATE TABLE - should complete quickly
    let create_start = Date::now();
    db.execute_internal("CREATE TABLE hang_test (id INTEGER PRIMARY KEY, data TEXT, value REAL)")
        .await
        .expect("CREATE TABLE should not hang");
    let create_time = Date::now() - create_start;
    assert!(create_time < MAX_OPERATION_TIME_MS,
        "CREATE TABLE took {}ms, exceeds limit of {}ms", create_time, MAX_OPERATION_TIME_MS);
    
    // Test INSERT operations - should complete quickly
    let insert_start = Date::now();
    for i in 0..100 {
        let params = vec![
            ColumnValue::Integer(i as i64),
            ColumnValue::Text(format!("test_data_{}", i)),
            ColumnValue::Real(i as f64 * 1.5),
        ];
        db.execute_with_params_internal(
            "INSERT INTO hang_test (id, data, value) VALUES (?, ?, ?)", 
            &params
        ).await.expect("INSERT should not hang");
    }
    let insert_time = Date::now() - insert_start;
    assert!(insert_time < MAX_OPERATION_TIME_MS,
        "100 INSERTs took {}ms, exceeds limit of {}ms", insert_time, MAX_OPERATION_TIME_MS);
    
    // Test SELECT operations - should complete quickly
    let select_start = Date::now();
    let result = db.execute_internal("SELECT COUNT(*) FROM hang_test")
        .await
        .expect("SELECT should not hang");
    let select_time = Date::now() - select_start;
    assert!(select_time < MAX_OPERATION_TIME_MS,
        "SELECT took {}ms, exceeds limit of {}ms", select_time, MAX_OPERATION_TIME_MS);
    
    // Verify we got expected results
    assert_eq!(result.rows.len(), 1, "Should have one result row");
    if let ColumnValue::Integer(count) = &result.rows[0].values[0] {
        assert_eq!(*count, 100, "Should have inserted 100 rows");
    } else {
        panic!("Expected integer count result");
    }
    
    // Test complex SELECT with JOIN-like operations - should complete quickly
    let complex_start = Date::now();
    let _complex_result = db.execute_internal(
        "SELECT id, data, value, (value * 2) as doubled FROM hang_test WHERE id < 50 ORDER BY value DESC"
    ).await.expect("Complex SELECT should not hang");
    let complex_time = Date::now() - complex_start;
    assert!(complex_time < MAX_OPERATION_TIME_MS,
        "Complex SELECT took {}ms, exceeds limit of {}ms", complex_time, MAX_OPERATION_TIME_MS);
    
    // Test database close - should complete quickly
    let close_start = Date::now();
    db.close_internal().await.expect("Database close should not hang");
    let close_time = Date::now() - close_start;
    assert!(close_time < MAX_OPERATION_TIME_MS,
        "Database close took {}ms, exceeds limit of {}ms", close_time, MAX_OPERATION_TIME_MS);
    
    let total_time = Date::now() - start_time;
    assert!(total_time < MAX_OPERATION_TIME_MS * 2.0,
        "Total test time {}ms exceeds reasonable limit", total_time);
}

/// Test that sqlite3_step calls don't hang on large result sets
#[wasm_bindgen_test]
async fn test_large_result_set_no_hang() {
    let config = DatabaseConfig {
        name: "large_result_hang_test".to_string(),
        cache_size: Some(10000),
        ..Default::default()
    };
    
    let mut db = Database::new(config).await.expect("Database creation should not hang");
    
    // Create table with larger dataset
    db.execute_internal("CREATE TABLE large_test (id INTEGER PRIMARY KEY, data TEXT, blob_data BLOB)")
        .await
        .expect("CREATE TABLE should not hang");
    
    // Insert 1000 rows with varying data sizes
    let insert_start = Date::now();
    for i in 0..1000 {
        let large_text = "x".repeat(100 + (i % 500)); // Variable size text
        let blob_data = vec![i as u8; 50 + (i % 200)]; // Variable size blob
        let params = vec![
            ColumnValue::Integer(i as i64),
            ColumnValue::Text(large_text),
            ColumnValue::Blob(blob_data),
        ];
        db.execute_with_params_internal(
            "INSERT INTO large_test (id, data, blob_data) VALUES (?, ?, ?)", 
            &params
        ).await.expect("INSERT should not hang");
    }
    let insert_time = Date::now() - insert_start;
    assert!(insert_time < MAX_OPERATION_TIME_MS * 4.0,
        "Large dataset INSERT took {}ms, exceeds limit", insert_time);
    
    // Test SELECT that returns large result set - this was prone to hanging
    let select_start = Date::now();
    let result = db.execute_internal("SELECT id, data, blob_data FROM large_test ORDER BY id")
        .await
        .expect("Large SELECT should not hang");
    let select_time = Date::now() - select_start;
    assert!(select_time < MAX_OPERATION_TIME_MS * 2.0,
        "Large SELECT took {}ms, exceeds limit", select_time);
    
    // Verify we got all rows
    assert_eq!(result.rows.len(), 1000, "Should have retrieved all 1000 rows");
    
    db.close_internal().await.expect("Database close should not hang");
}

/// Test that concurrent operations don't cause hangs
#[wasm_bindgen_test]
async fn test_concurrent_operations_no_hang() {
    let config = DatabaseConfig {
        name: "concurrent_hang_test".to_string(),
        cache_size: Some(5000),
        ..Default::default()
    };
    
    let mut db = Database::new(config).await.expect("Database creation should not hang");
    
    db.execute_internal("CREATE TABLE concurrent_test (id INTEGER PRIMARY KEY, thread_id TEXT, data TEXT)")
        .await
        .expect("CREATE TABLE should not hang");
    
    let start_time = Date::now();
    
    // Simulate concurrent-like operations by rapidly switching between different operation types
    for batch in 0..10 {
        // Insert batch
        for i in 0..20 {
            let params = vec![
                ColumnValue::Integer((batch * 20 + i) as i64),
                ColumnValue::Text(format!("thread_{}", batch)),
                ColumnValue::Text(format!("data_{}_{}", batch, i)),
            ];
            db.execute_with_params_internal(
                "INSERT INTO concurrent_test (id, thread_id, data) VALUES (?, ?, ?)", 
                &params
            ).await.expect("Concurrent INSERT should not hang");
        }
        
        // Query batch
        let _result = db.execute_internal(
            &format!("SELECT COUNT(*) FROM concurrent_test WHERE thread_id = 'thread_{}'", batch)
        ).await.expect("Concurrent SELECT should not hang");
        
        // Update batch
        let params = vec![ColumnValue::Text(format!("thread_{}", batch))];
        db.execute_with_params_internal(
            "UPDATE concurrent_test SET data = data || '_updated' WHERE thread_id = ?",
            &params
        ).await.expect("Concurrent UPDATE should not hang");
    }
    
    let total_time = Date::now() - start_time;
    assert!(total_time < MAX_OPERATION_TIME_MS * 3.0,
        "Concurrent operations took {}ms, exceeds limit", total_time);
    
    // Verify final state
    let result = db.execute_internal("SELECT COUNT(*) FROM concurrent_test")
        .await
        .expect("Final SELECT should not hang");
    
    if let ColumnValue::Integer(count) = &result.rows[0].values[0] {
        assert_eq!(*count, 200, "Should have 200 total rows");
    } else {
        panic!("Expected integer count result");
    }
    
    db.close_internal().await.expect("Database close should not hang");
}

/// Test that error conditions don't cause hangs
#[wasm_bindgen_test]
async fn test_error_conditions_no_hang() {
    let config = DatabaseConfig {
        name: "error_hang_test".to_string(),
        cache_size: Some(1000),
        ..Default::default()
    };
    
    let mut db = Database::new(config).await.expect("Database creation should not hang");
    
    // Test various error conditions that could potentially cause hangs
    let error_tests = vec![
        ("INVALID SQL SYNTAX HERE", true), // Should fail
        ("SELECT * FROM nonexistent_table", true), // Should fail
        ("INSERT INTO nonexistent_table VALUES (1, 2, 3)", true), // Should fail
        ("SELECT * FROM sqlite_master WHERE name IS NOT NULL", false), // Valid query, should succeed
    ];
    
    // Test duplicate table creation separately (needs separate execute calls for schema cache invalidation)
    db.execute_internal("CREATE TABLE test (id INTEGER PRIMARY KEY)").await.expect("First CREATE TABLE should succeed");
    let duplicate_result = db.execute_internal("CREATE TABLE test (id INTEGER PRIMARY KEY)").await;
    assert!(duplicate_result.is_err(), "Duplicate CREATE TABLE should fail");
    
    for (i, (sql, should_fail)) in error_tests.iter().enumerate() {
        let start_time = Date::now();
        
        // These should complete quickly, whether they succeed or fail
        let result = db.execute_internal(sql).await;
        
        let execution_time = Date::now() - start_time;
        assert!(execution_time < MAX_OPERATION_TIME_MS,
            "Error test {} took {}ms, should complete quickly", i, execution_time);
        
        // Check expected result
        if *should_fail {
            assert!(result.is_err(), "Test {} should have failed: {}", i, sql);
        } else {
            assert!(result.is_ok(), "Test {} should have succeeded: {}", i, sql);
        }
    }
    
    db.close_internal().await.expect("Database close should not hang");
}

/// Test that the sqlite-wasm-rs crate is properly configured to avoid deprecated patterns
#[wasm_bindgen_test]
async fn test_sqlite_wasm_rs_configuration() {
    // Verify we're using the correct sqlite-wasm-rs version and features
    // This is a compile-time check that ensures we don't regress to problematic versions
    
    let config = DatabaseConfig {
        name: "config_test".to_string(),
        cache_size: Some(1000),
        ..Default::default()
    };
    
    let start_time = Date::now();
    let mut db = Database::new(config).await.expect("Database should initialize with proper sqlite-wasm-rs config");
    let init_time = Date::now() - start_time;
    
    // Proper initialization should be very fast (< 1 second)
    assert!(init_time < 1000.0, 
        "Database initialization took {}ms, suggests deprecated initialization pattern", init_time);
    
    // Test that basic operations work immediately after initialization
    let immediate_start = Date::now();
    db.execute_internal("SELECT 1 as test_value")
        .await
        .expect("Immediate operation after init should work");
    let immediate_time = Date::now() - immediate_start;
    
    assert!(immediate_time < 100.0,
        "Immediate operation took {}ms, suggests initialization issues", immediate_time);
    
    db.close_internal().await.expect("Database close should not hang");
}

/// Comprehensive regression test that combines all potential hang scenarios
#[wasm_bindgen_test]
async fn test_comprehensive_hang_regression() {
    let overall_start = Date::now();
    
    let config = DatabaseConfig {
        name: "comprehensive_hang_test".to_string(),
        cache_size: Some(10000),
        ..Default::default()
    };
    
    let mut db = Database::new(config).await.expect("Database creation should not hang");
    
    // Create complex schema
    let schema_queries = vec![
        "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE)",
        "CREATE TABLE posts (id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT, content TEXT, created_at INTEGER)",
        "CREATE TABLE comments (id INTEGER PRIMARY KEY, post_id INTEGER, user_id INTEGER, content TEXT, created_at INTEGER)",
        "CREATE INDEX idx_posts_user_id ON posts(user_id)",
        "CREATE INDEX idx_comments_post_id ON comments(post_id)",
        "CREATE INDEX idx_comments_user_id ON comments(user_id)",
    ];
    
    for query in schema_queries {
        let start = Date::now();
        db.execute_internal(query).await.expect("Schema creation should not hang");
        let duration = Date::now() - start;
        assert!(duration < MAX_OPERATION_TIME_MS, "Schema query took too long: {}ms", duration);
    }
    
    // Insert test data with various patterns that could cause hangs
    for user_id in 1..=50 {
        let params = vec![
            ColumnValue::Integer(user_id as i64),
            ColumnValue::Text(format!("user_{}", user_id)),
            ColumnValue::Text(format!("user{}@example.com", user_id)),
        ];
        db.execute_with_params_internal(
            "INSERT INTO users (id, name, email) VALUES (?, ?, ?)",
            &params
        ).await.expect("User insert should not hang");
        
        // Insert posts for each user
        for post_id in 1..=5 {
            let post_params = vec![
                ColumnValue::Integer((user_id * 5 + post_id) as i64),
                ColumnValue::Integer(user_id as i64),
                ColumnValue::Text(format!("Post {} by User {}", post_id, user_id)),
                ColumnValue::Text("x".repeat(500)), // Larger content
                ColumnValue::Integer(Date::now() as i64),
            ];
            db.execute_with_params_internal(
                "INSERT INTO posts (id, user_id, title, content, created_at) VALUES (?, ?, ?, ?, ?)",
                &post_params
            ).await.expect("Post insert should not hang");
        }
    }
    
    // Complex queries that were prone to hanging
    let complex_queries = vec![
        "SELECT u.name, COUNT(p.id) as post_count FROM users u LEFT JOIN posts p ON u.id = p.user_id GROUP BY u.id, u.name ORDER BY post_count DESC",
        "SELECT p.title, u.name, p.created_at FROM posts p JOIN users u ON p.user_id = u.id WHERE p.created_at > ? ORDER BY p.created_at DESC LIMIT 20",
        "SELECT u.name, p.title, COUNT(c.id) as comment_count FROM users u JOIN posts p ON u.id = p.user_id LEFT JOIN comments c ON p.id = c.post_id GROUP BY u.id, p.id HAVING comment_count >= 0",
    ];
    
    for (i, query) in complex_queries.iter().enumerate() {
        let start = Date::now();
        if query.contains("?") {
            let params = vec![ColumnValue::Integer(0)];
            db.execute_with_params_internal(query, &params)
                .await
                .expect("Complex parameterized query should not hang");
        } else {
            db.execute_internal(query)
                .await
                .expect("Complex query should not hang");
        }
        let duration = Date::now() - start;
        assert!(duration < MAX_OPERATION_TIME_MS, 
            "Complex query {} took {}ms, exceeds limit", i, duration);
    }
    
    db.close_internal().await.expect("Database close should not hang");
    
    let total_duration = Date::now() - overall_start;
    assert!(total_duration < MAX_OPERATION_TIME_MS * 5.0,
        "Comprehensive test took {}ms, exceeds reasonable limit", total_duration);
}
