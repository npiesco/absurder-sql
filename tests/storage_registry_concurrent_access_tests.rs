//! RED Phase: Test to demonstrate RefCell race condition in STORAGE_REGISTRY
//! 
//! This test MUST FAIL initially, showing that concurrent async access to
//! STORAGE_REGISTRY causes RefCell borrow panics under parallel load.
//! 
//! After implementing async-safe access (GREEN phase), these tests should PASS.

#![cfg(target_arch = "wasm32")]

use wasm_bindgen_test::*;
use absurder_sql::Database;

wasm_bindgen_test_configure!(run_in_browser);

/// RED: This test demonstrates the race condition when 6 parallel workers
/// (simulating Playwright --workers=6) access STORAGE_REGISTRY simultaneously.
/// 
/// Expected RED behavior: Random failures with "Failed to prepare statement"
/// Expected GREEN behavior: All 6 operations complete successfully
#[wasm_bindgen_test]
async fn test_concurrent_database_operations_no_panic() {
    console_log::init_with_level(log::Level::Debug).ok();
    
    // Test just 2 workers accessing same tables (mirrors full-text-search scenario)
    // Worker 1
    let db1_name = "concurrent_worker_0".to_string();
    let mut db1 = Database::new_wasm(db1_name.clone())
        .await
        .expect("Worker 0 failed to create database");
    
    db1.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)")
        .await
        .expect("Worker 0 failed to create table");
    
    // Worker 2 - accessing concurrently
    let db2_name = "concurrent_worker_1".to_string();
    let mut db2 = Database::new_wasm(db2_name.clone())
        .await
        .expect("Worker 1 failed to create database");
    
    db2.execute("CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT)")
        .await
        .expect("Worker 1 failed to create table");
    
    // Both query PRAGMA concurrently - this is where RED phase fails
    let pragma1 = db1.execute("PRAGMA table_info(users)");
    let pragma2 = db2.execute("PRAGMA table_info(products)");
    
    // RED: One of these will fail with "Failed to prepare statement"
    // GREEN: Both succeed
    let (r1, r2) = futures::future::join(pragma1, pragma2).await;
    r1.expect("Worker 0 PRAGMA failed");
    r2.expect("Worker 1 PRAGMA failed");
    
    // Cleanup
    db1.close().await.ok();
    db2.close().await.ok();
    Database::delete_database(db1_name).await.ok();
    Database::delete_database(db2_name).await.ok();
}

/// RED: Multiple separate databases querying concurrently
/// This mirrors 6 Playwright workers all hitting the Next.js server at once
#[wasm_bindgen_test]
async fn test_six_databases_concurrent_queries() {
    console_log::init_with_level(log::Level::Debug).ok();
    
    // Create 6 databases (like 6 Playwright workers)
    let mut dbs = vec![];
    for i in 0..6 {
        let db_name = format!("worker_{}", i);
        let mut db = Database::new_wasm(db_name.clone())
            .await
            .expect(&format!("Failed to create database {}", i));
        
        db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)")
            .await
            .expect(&format!("Worker {} failed to create table", i));
        
        dbs.push((db_name, db));
    }
    
    // All 6 query PRAGMA concurrently - this triggers STORAGE_REGISTRY RefCell panic
    let mut futures = vec![];
    for (i, (_name, db)) in dbs.iter_mut().enumerate() {
        futures.push(async move {
            db.execute("PRAGMA table_info(test)")
                .await
                .expect(&format!("Worker {} PRAGMA failed", i))
        });
    }
    
    // RED: This will cause RefCell borrow panic in STORAGE_REGISTRY
    // GREEN: All 6 complete successfully
    let results = futures::future::join_all(futures).await;
    assert_eq!(results.len(), 6, "All 6 workers should complete");
    
    // Cleanup
    for (db_name, mut db) in dbs {
        db.close().await.ok();
        Database::delete_database(db_name).await.ok();
    }
}
