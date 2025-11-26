//! Isolated test proving VFS layer reentrancy causes Rc<RefCell<BlockStorage>> panic
//!
//! This test demonstrates the EXACT call chain:
//! 1. VFS x_read() → try_borrow_mut() → Holds exclusive lock on ENTIRE BlockStorage
//! 2. BlockStorage.read_block_sync() executes
//! 3. SQLite triggers ANOTHER VFS callback (nested)
//! 4. Second try_borrow_mut() FAILS → Panic
//!
//! Expected RED: "cannot recursively acquire mutex" or "already borrowed: BorrowMutError"
//! Expected GREEN: Both operations succeed with interior mutability

#![cfg(target_arch = "wasm32")]

use absurder_sql::Database;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

/// RED: Prove VFS reentrancy with nested read operations
/// This simulates SQLite's internal behavior where one read triggers another
#[wasm_bindgen_test]
async fn test_vfs_reentrancy_during_read() {
    console_log::init_with_level(log::Level::Debug).ok();

    let mut db = Database::new_wasm("vfs_reentrancy_test".to_string())
        .await
        .expect("create database");

    // Create a table to ensure we have data in storage
    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT)")
        .await
        .expect("create table");

    // Insert data that spans multiple blocks to force multiple VFS reads
    db.execute("INSERT INTO test (id, data) VALUES (1, 'x')")
        .await
        .expect("insert 1");
    db.execute("INSERT INTO test (id, data) VALUES (2, 'y')")
        .await
        .expect("insert 2");

    // Sync to flush to storage
    db.sync().await.expect("sync");

    // This query will trigger:
    // 1. VFS x_read() for table header → try_borrow_mut()
    // 2. SQLite parses schema
    // 3. SQLite triggers ANOTHER x_read() for data pages
    // 4. Nested try_borrow_mut() → PANIC (with RefCell wrapper)
    //
    // RED: Should panic with "already borrowed"
    // GREEN: Should succeed with interior mutability
    let result = db.query("SELECT * FROM test ORDER BY id").await;

    assert!(
        result.is_ok(),
        "Query should succeed without reentrancy panic: {:?}",
        result
    );

    let rows = result.unwrap();
    assert_eq!(rows.len(), 2, "Should return 2 rows");

    // Cleanup
    db.close().await.ok();
    Database::delete_database("vfs_reentrancy_test".to_string())
        .await
        .ok();
}

/// RED: Prove schema operation triggers reentrancy
/// CREATE TABLE requires reading existing schema while writing new schema
#[wasm_bindgen_test]
async fn test_schema_operation_reentrancy() {
    console_log::init_with_level(log::Level::Debug).ok();

    let mut db = Database::new_wasm("schema_reentrancy_test".to_string())
        .await
        .expect("create database");

    // First table creation - establishes schema
    db.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)")
        .await
        .expect("create first table");

    db.sync().await.expect("sync");

    // Second table creation triggers:
    // 1. VFS x_write() for new schema → try_borrow_mut()
    // 2. SQLite reads existing schema to validate
    // 3. VFS x_read() → try_borrow_mut() AGAIN
    // 4. Nested borrow → PANIC
    //
    // RED: Should panic with reentrancy error
    // GREEN: Interior mutability allows nested access
    let result = db
        .execute("CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT)")
        .await;

    assert!(
        result.is_ok(),
        "Second table creation should succeed: {:?}",
        result
    );

    // Cleanup
    db.close().await.ok();
    Database::delete_database("schema_reentrancy_test".to_string())
        .await
        .ok();
}

/// RED: Prove write-during-read reentrancy
/// Write operation triggers read for partial block update
#[wasm_bindgen_test]
async fn test_write_triggers_read_reentrancy() {
    console_log::init_with_level(log::Level::Debug).ok();

    let mut db = Database::new_wasm("write_read_reentrancy".to_string())
        .await
        .expect("create database");

    // Create table with data
    db.execute("CREATE TABLE data (id INTEGER PRIMARY KEY, value TEXT)")
        .await
        .expect("create table");

    // Insert initial data
    db.execute("INSERT INTO data (id, value) VALUES (1, 'initial')")
        .await
        .expect("insert");

    db.sync().await.expect("sync");

    // Update operation requires:
    // 1. VFS x_write() → try_borrow_mut()
    // 2. For partial block write, must READ existing block first
    // 3. VFS x_read() → try_borrow_mut() AGAIN
    // 4. Nested borrow → PANIC
    //
    // RED: Should panic
    // GREEN: Interior mutability allows nested access
    let result = db
        .execute("UPDATE data SET value = 'updated' WHERE id = 1")
        .await;

    assert!(
        result.is_ok(),
        "Update should succeed without reentrancy panic: {:?}",
        result
    );

    // Verify update worked
    let rows = db
        .query("SELECT value FROM data WHERE id = 1")
        .await
        .expect("query");
    assert_eq!(rows.len(), 1);

    // Cleanup
    db.close().await.ok();
    Database::delete_database("write_read_reentrancy".to_string())
        .await
        .ok();
}
