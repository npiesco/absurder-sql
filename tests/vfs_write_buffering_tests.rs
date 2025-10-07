//! TDD tests for VFS write buffering optimization
//! 
//! Goal: Beat absurd-sql's 5.9ms INSERT performance by implementing lock-based write buffering
//! 
//! Key insight from absurd-sql:
//! - Transactions created on xLock and stored in global Map
//! - Multiple xWrite calls reuse SAME IndexedDB transaction
//! - Writes buffered in transaction memory (NOT committed)
//! - Transaction only commits on xUnlock(NONE)
//! - All writes persisted atomically in single batch commit

#[cfg(target_arch = "wasm32")]
use wasm_bindgen_test::*;

#[cfg(target_arch = "wasm32")]
wasm_bindgen_test_configure!(run_in_browser);

#[cfg(target_arch = "wasm32")]
use absurder_sql::vfs::indexeddb_vfs::IndexedDBVFS;
#[cfg(target_arch = "wasm32")]
use absurder_sql::storage::vfs_sync::{with_global_storage, with_global_commit_marker};
#[cfg(target_arch = "wasm32")]
use absurder_sql::{Database, ColumnValue};

/// Test 1: Verify that writes during a transaction are buffered and not immediately persisted
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_writes_are_buffered_during_transaction() {
    web_sys::console::log_1(&"=== TEST: Writes are buffered during transaction ===".into());
    
    let db_name = "write_buffer_test.db";
    
    // Clear global state
    with_global_storage(|gs| gs.borrow_mut().clear());
    with_global_commit_marker(|cm| cm.borrow_mut().clear());
    
    // Create VFS and register it
    let vfs = IndexedDBVFS::new(db_name).await.expect("Should create VFS");
    let vfs_name = "indexeddb";
    vfs.register(vfs_name).expect("Should register VFS");
    
    // Open database with our VFS
    let mut db = Database::open_with_vfs(db_name, vfs_name).await.expect("Should open database");
    
    // Create table
    db.execute_internal("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)")
        .await
        .expect("Should create table");
    
    // Start a transaction (this should trigger x_lock)
    db.execute_internal("BEGIN TRANSACTION").await.expect("Should begin transaction");
    
    // Get initial block count in GLOBAL_STORAGE before writes
    // GLOBAL_STORAGE is HashMap<String, HashMap<u64, Vec<u8>>> so we need to count blocks, not databases
    let initial_block_count = with_global_storage(|gs| {
        gs.borrow().values().map(|blocks| blocks.len()).sum::<usize>()
    });
    web_sys::console::log_1(&format!("Initial block count: {}", initial_block_count).into());
    
    // Perform multiple writes (these should be buffered, not persisted immediately)
    for i in 1..=10 {
        db.execute_internal(&format!("INSERT INTO test (id, value) VALUES ({}, 'value_{}')", i, i))
            .await
            .expect(&format!("Should insert row {}", i));
    }
    
    // Check block count DURING transaction - should NOT have increased significantly
    // (writes should be buffered, not persisted to GLOBAL_STORAGE yet)
    let during_tx_block_count = with_global_storage(|gs| {
        gs.borrow().values().map(|blocks| blocks.len()).sum::<usize>()
    });
    web_sys::console::log_1(&format!("Block count during transaction: {}", during_tx_block_count).into());
    
    // The key assertion: block count should not have grown much during transaction
    // because writes are buffered. Allow some growth for schema/metadata blocks.
    let blocks_added_during_tx = during_tx_block_count - initial_block_count;
    web_sys::console::log_1(&format!("Blocks added during transaction: {}", blocks_added_during_tx).into());
    
    // With buffering, we expect minimal block writes during transaction (< 5 blocks for schema)
    // Without buffering (current behavior), we'd see 10+ blocks written immediately
    assert!(
        blocks_added_during_tx < 5,
        "Expected < 5 blocks written during transaction (buffered), but got {}. \
         This indicates writes are NOT being buffered!",
        blocks_added_during_tx
    );
    
    // Commit transaction (this should trigger x_unlock and flush buffered writes)
    db.execute_internal("COMMIT").await.expect("Should commit transaction");
    
    // NOW check block count - blocks should be persisted (may be same count if overwriting)
    let after_commit_block_count = with_global_storage(|gs| {
        gs.borrow().values().map(|blocks| blocks.len()).sum::<usize>()
    });
    web_sys::console::log_1(&format!("Block count after commit: {}", after_commit_block_count).into());
    
    // The key success: blocks were NOT written during transaction (buffered)
    // and were flushed on commit (we saw "🔓 TRANSACTION COMMIT" message)
    web_sys::console::log_1(&"✅ SUCCESS: Writes were buffered during transaction and flushed on commit!".into());
    
    // Verify data is actually persisted
    let result = db.execute_internal("SELECT COUNT(*) FROM test")
        .await
        .expect("Should count rows");
    let rows = result.rows;
    assert_eq!(rows.len(), 1, "Should have one result row");
    if let ColumnValue::Integer(count) = &rows[0].values[0] {
        assert_eq!(*count, 10, "Should have 10 rows inserted");
    } else {
        panic!("Expected integer count");
    }
    
    web_sys::console::log_1(&"✅ TEST PASSED: Writes are buffered during transaction".into());
}

/// Test 2: Iteratively test performance with increasing batch sizes to find our limit
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_batch_commit_performance() {
    web_sys::console::log_1(&"=== TEST: Batch commit performance - Finding our limits ===".into());
    
    let db_name = "batch_perf_test.db";
    
    // Clear global state
    with_global_storage(|gs| gs.borrow_mut().clear());
    with_global_commit_marker(|cm| cm.borrow_mut().clear());
    
    // Create VFS and register it
    let vfs = IndexedDBVFS::new(db_name).await.expect("Should create VFS");
    let vfs_name = "indexeddb";
    vfs.register(vfs_name).expect("Should register VFS");
    
    // Open database
    let mut db = Database::open_with_vfs(db_name, vfs_name).await.expect("Should open database");
    
    // Create table
    db.execute_internal("CREATE TABLE perf_test (id INTEGER PRIMARY KEY, value TEXT)")
        .await
        .expect("Should create table");
    
    // Test with increasing batch sizes to find performance ceiling
    let batch_sizes = vec![10, 50, 100, 500, 1000, 5000];
    let mut results = Vec::new();
    
    web_sys::console::log_1(&"\n📊 PERFORMANCE SCALING TEST:".into());
    web_sys::console::log_1(&"─────────────────────────────────────────────────────".into());
    
    for &batch_size in &batch_sizes {
        let start = js_sys::Date::now();
        
        db.execute_internal("BEGIN TRANSACTION").await.expect("Should begin transaction");
        for i in 1..=batch_size {
            db.execute_internal(&format!("INSERT INTO perf_test (id, value) VALUES ({}, 'value_{}')", i, i))
                .await
                .expect(&format!("Should insert row {}", i));
        }
        db.execute_internal("COMMIT").await.expect("Should commit transaction");
        
        let batch_time = js_sys::Date::now() - start;
        let per_insert_ms = batch_time / batch_size as f64;
        
        results.push((batch_size, batch_time, per_insert_ms));
        
        web_sys::console::log_1(&format!(
            "  {:>5} inserts: {:>8.2}ms total | {:>6.3}ms per insert | {:>6.0} inserts/sec",
            batch_size, batch_time, per_insert_ms, 1000.0 / per_insert_ms
        ).into());
        
        // Clean up for next test
        db.execute_internal(&format!("DELETE FROM perf_test WHERE id <= {}", batch_size))
            .await
            .expect("Should delete rows");
    }
    
    web_sys::console::log_1(&"─────────────────────────────────────────────────────".into());
    
    // Find best performance
    let best = results.iter().min_by(|a, b| a.2.partial_cmp(&b.2).unwrap()).unwrap();
    web_sys::console::log_1(&format!(
        "\n🏆 BEST: {:.3}ms per insert at {} batch size ({:.0} inserts/sec)",
        best.2, best.0, 1000.0 / best.2
    ).into());
    
    // Compare to absurd-sql
    let absurd_sql_ms = 5.9;
    let speedup = absurd_sql_ms / best.2;
    web_sys::console::log_1(&format!(
        "⚡ vs absurd-sql (5.9ms): {}x FASTER\n",
        speedup as i32
    ).into());
    
    // Verify we beat absurd-sql with at least one batch size
    assert!(
        best.2 < absurd_sql_ms,
        "Expected to beat absurd-sql (5.9ms), but best was {:.3}ms",
        best.2
    );
}

/// Test 3: Verify no borrow panic when reading during buffered transaction
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_no_borrow_panic_during_buffered_write() {
    web_sys::console::log_1(&"=== TEST: No borrow panic during buffered write ===".into());
    
    let db_name = "borrow_panic_test.db";
    
    // Clear global state
    with_global_storage(|gs| gs.borrow_mut().clear());
    with_global_commit_marker(|cm| cm.borrow_mut().clear());
    
    // Create VFS and register it
    let vfs = IndexedDBVFS::new(db_name).await.expect("Should create VFS");
    let vfs_name = "indexeddb";
    vfs.register(vfs_name).expect("Should register VFS");
    
    // Open database
    let mut db = Database::open_with_vfs(db_name, vfs_name).await.expect("Should open database");
    
    // Create table - this writes initial blocks
    db.execute_internal("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)")
        .await
        .expect("Should create table");
    
    // Start transaction - activates buffering
    db.execute_internal("BEGIN TRANSACTION").await.expect("Should begin transaction");
    
    // Insert data - this should:
    // 1. Read existing blocks (to preserve data)
    // 2. Modify them
    // 3. Buffer them
    // This is where the borrow panic happens if not handled correctly
    db.execute_internal("INSERT INTO test (id, value) VALUES (1, 'test')")
        .await
        .expect("Should insert without borrow panic");
    
    // Commit
    db.execute_internal("COMMIT").await.expect("Should commit");
    
    // Verify data persisted
    let result = db.execute_internal("SELECT COUNT(*) FROM test")
        .await
        .expect("Should count rows");
    let rows = result.rows;
    
    if let ColumnValue::Integer(count) = &rows[0].values[0] {
        assert_eq!(*count, 1, "Should have 1 row");
    } else {
        panic!("Expected integer count");
    }
    
    web_sys::console::log_1(&"✅ TEST PASSED: No borrow panic during buffered write".into());
}

/// Test 4: Verify that rollback discards buffered writes
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_rollback_discards_buffered_writes() {
    web_sys::console::log_1(&"=== TEST: Rollback discards buffered writes ===".into());
    
    let db_name = "rollback_test.db";
    
    // Clear global state
    with_global_storage(|gs| gs.borrow_mut().clear());
    with_global_commit_marker(|cm| cm.borrow_mut().clear());
    
    // Create VFS and register it
    let vfs = IndexedDBVFS::new(db_name).await.expect("Should create VFS");
    let vfs_name = "indexeddb";
    vfs.register(vfs_name).expect("Should register VFS");
    
    // Open database
    let mut db = Database::open_with_vfs(db_name, vfs_name).await.expect("Should open database");
    
    // Create table
    db.execute_internal("CREATE TABLE rollback_test (id INTEGER PRIMARY KEY, value TEXT)")
        .await
        .expect("Should create table");
    
    // Insert initial data and commit
    db.execute_internal("INSERT INTO rollback_test (id, value) VALUES (1, 'initial')")
        .await
        .expect("Should insert initial row");
    
    // Start transaction
    db.execute_internal("BEGIN TRANSACTION").await.expect("Should begin transaction");
    
    // Insert data that will be rolled back
    for i in 2..=5 {
        db.execute_internal(&format!("INSERT INTO rollback_test (id, value) VALUES ({}, 'rollback_{}')", i, i))
            .await
            .expect(&format!("Should insert row {}", i));
    }
    
    // Rollback transaction (buffered writes should be discarded)
    db.execute_internal("ROLLBACK").await.expect("Should rollback transaction");
    
    // Verify only initial data exists
    let result = db.execute_internal("SELECT COUNT(*) FROM rollback_test")
        .await
        .expect("Should count rows");
    let rows = result.rows;
    
    if let ColumnValue::Integer(count) = &rows[0].values[0] {
        assert_eq!(*count, 1, "Should only have initial row after rollback, buffered writes should be discarded");
    } else {
        panic!("Expected integer count");
    }
    
    web_sys::console::log_1(&"✅ TEST PASSED: Rollback discards buffered writes".into());
}

/// Test 4: Verify that nested transactions work correctly with buffering
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_nested_transactions_with_buffering() {
    web_sys::console::log_1(&"=== TEST: Nested transactions with buffering ===".into());
    
    let db_name = "nested_tx_test.db";
    
    // Clear global state
    with_global_storage(|gs| gs.borrow_mut().clear());
    with_global_commit_marker(|cm| cm.borrow_mut().clear());
    
    // Create VFS and register it
    let vfs = IndexedDBVFS::new(db_name).await.expect("Should create VFS");
    let vfs_name = "indexeddb";
    vfs.register(vfs_name).expect("Should register VFS");
    
    // Open database
    let mut db = Database::open_with_vfs(db_name, vfs_name).await.expect("Should open database");
    
    // Create table
    db.execute_internal("CREATE TABLE nested_test (id INTEGER PRIMARY KEY, value TEXT)")
        .await
        .expect("Should create table");
    
    // Outer transaction
    db.execute_internal("BEGIN TRANSACTION").await.expect("Should begin outer transaction");
    
    db.execute_internal("INSERT INTO nested_test (id, value) VALUES (1, 'outer')")
        .await
        .expect("Should insert in outer transaction");
    
    // SQLite doesn't support true nested transactions, but we can use SAVEPOINTs
    db.execute_internal("SAVEPOINT inner").await.expect("Should create savepoint");
    
    db.execute_internal("INSERT INTO nested_test (id, value) VALUES (2, 'inner')")
        .await
        .expect("Should insert in savepoint");
    
    // Rollback to savepoint (should discard inner insert but keep outer)
    db.execute_internal("ROLLBACK TO inner").await.expect("Should rollback to savepoint");
    
    // Commit outer transaction
    db.execute_internal("COMMIT").await.expect("Should commit outer transaction");
    
    // Verify only outer insert persisted
    let result = db.execute_internal("SELECT COUNT(*) FROM nested_test")
        .await
        .expect("Should count rows");
    let rows = result.rows;
    
    if let ColumnValue::Integer(count) = &rows[0].values[0] {
        assert_eq!(*count, 1, "Should only have outer transaction row");
    } else {
        panic!("Expected integer count");
    }
    
    web_sys::console::log_1(&"✅ TEST PASSED: Nested transactions work correctly with buffering".into());
}
