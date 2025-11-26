#![cfg(target_arch = "wasm32")]

use absurder_sql::Database;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

/// Performance profiling test to identify bottlenecks
/// This test measures time spent in different operations during a batch insert
#[wasm_bindgen_test]
async fn profile_insert_performance() {
    web_sys::console::log_1(&"=== PERFORMANCE PROFILING TEST ===".into());

    let db_name = "profile_test";
    let mut config = absurder_sql::DatabaseConfig::default();
    config.name = db_name.to_string();
    let mut db = Database::new(config).await.unwrap();

    // Create table
    let start = js_sys::Date::now();
    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT)")
        .await
        .unwrap();
    let create_time = js_sys::Date::now() - start;
    web_sys::console::log_1(&format!(" CREATE TABLE: {:.2}ms", create_time).into());

    // Measure single insert
    let start = js_sys::Date::now();
    db.execute("INSERT INTO test VALUES (1, 'test data 1')")
        .await
        .unwrap();
    let single_insert_time = js_sys::Date::now() - start;
    web_sys::console::log_1(&format!(" SINGLE INSERT: {:.2}ms", single_insert_time).into());

    // Measure batch insert (10 rows)
    let start = js_sys::Date::now();
    for i in 2..12 {
        db.execute(&format!(
            "INSERT INTO test VALUES ({}, 'test data {}')",
            i, i
        ))
        .await
        .unwrap();
    }
    let batch_10_time = js_sys::Date::now() - start;
    web_sys::console::log_1(
        &format!(
            " BATCH 10 INSERTS: {:.2}ms ({:.2}ms per insert)",
            batch_10_time,
            batch_10_time / 10.0
        )
        .into(),
    );

    // Measure batch insert with explicit transaction (10 rows)
    let start = js_sys::Date::now();
    db.execute("BEGIN TRANSACTION").await.unwrap();
    for i in 12..22 {
        db.execute(&format!(
            "INSERT INTO test VALUES ({}, 'test data {}')",
            i, i
        ))
        .await
        .unwrap();
    }
    db.execute("COMMIT").await.unwrap();
    let batch_txn_time = js_sys::Date::now() - start;
    web_sys::console::log_1(
        &format!(
            " BATCH 10 INSERTS (explicit txn): {:.2}ms ({:.2}ms per insert)",
            batch_txn_time,
            batch_txn_time / 10.0
        )
        .into(),
    );

    // Measure read performance
    let start = js_sys::Date::now();
    let _rows = db.execute("SELECT * FROM test").await.unwrap();
    let read_time = js_sys::Date::now() - start;
    web_sys::console::log_1(&format!(" SELECT ALL: {:.2}ms", read_time).into());

    // Summary
    web_sys::console::log_1(&"".into());
    web_sys::console::log_1(&"=== PERFORMANCE SUMMARY ===".into());
    web_sys::console::log_1(&format!("Single insert: {:.2}ms", single_insert_time).into());
    web_sys::console::log_1(
        &format!(
            "Batch insert (no txn): {:.2}ms per insert",
            batch_10_time / 10.0
        )
        .into(),
    );
    web_sys::console::log_1(
        &format!(
            "Batch insert (with txn): {:.2}ms per insert",
            batch_txn_time / 10.0
        )
        .into(),
    );
    web_sys::console::log_1(&format!("Read all: {:.2}ms", read_time).into());

    // Expected behavior:
    // - If we're syncing on every insert, batch_10_time should be ~10x single_insert_time
    // - If we're batching properly, batch_txn_time should be much less than batch_10_time

    if batch_10_time / 10.0 > single_insert_time * 0.8 {
        web_sys::console::log_1(
            &" WARNING: Each insert in batch takes similar time to single insert".into(),
        );
        web_sys::console::log_1(&" This suggests we're NOT batching writes efficiently!".into());
    }

    if batch_txn_time < batch_10_time * 0.5 {
        web_sys::console::log_1(
            &"GOOD: Explicit transaction is faster than individual inserts".into(),
        );
    } else {
        web_sys::console::log_1(&" WARNING: Explicit transaction not significantly faster".into());
        web_sys::console::log_1(
            &" This suggests we're syncing on every operation regardless of transaction!".into(),
        );
    }

    db.close().await.unwrap();
}

/// Test to count how many times vfs_sync_database is called during batch operations
#[wasm_bindgen_test]
async fn count_sync_calls_during_batch() {
    web_sys::console::log_1(&"=== SYNC CALL COUNTING TEST ===".into());

    let db_name = "sync_count_test";
    let mut config = absurder_sql::DatabaseConfig::default();
    config.name = db_name.to_string();
    let mut db = Database::new(config).await.unwrap();

    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT)")
        .await
        .unwrap();

    web_sys::console::log_1(&"Starting batch insert - watch for 'VFS sync:' messages".into());
    web_sys::console::log_1(&"Expected: 1 sync at end of transaction".into());
    web_sys::console::log_1(&"Actual: (count the 'VFS sync:' messages below)".into());

    // Do batch insert and count sync messages in console
    db.execute("BEGIN TRANSACTION").await.unwrap();
    for i in 1..11 {
        db.execute(&format!("INSERT INTO test VALUES ({}, 'data {}')", i, i))
            .await
            .unwrap();
    }
    db.execute("COMMIT").await.unwrap();

    web_sys::console::log_1(&"Batch insert complete - check console for sync count".into());

    db.close().await.unwrap();
}

/// Compare absurd-sql's approach: journal_mode=MEMORY vs default
#[wasm_bindgen_test]
async fn test_journal_mode_impact() {
    web_sys::console::log_1(&"=== JOURNAL MODE COMPARISON ===".into());

    // Test 1: Default journal mode
    let mut config1 = absurder_sql::DatabaseConfig::default();
    config1.name = "journal_default".to_string();
    let mut db1 = Database::new(config1).await.unwrap();
    db1.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT)")
        .await
        .unwrap();

    let start = js_sys::Date::now();
    for i in 1..51 {
        db1.execute(&format!("INSERT INTO test VALUES ({}, 'data {}')", i, i))
            .await
            .unwrap();
    }
    let default_time = js_sys::Date::now() - start;
    web_sys::console::log_1(
        &format!(
            " Default journal mode: {:.2}ms for 50 inserts",
            default_time
        )
        .into(),
    );
    db1.close().await.unwrap();

    // Test 2: MEMORY journal mode (absurd-sql's approach)
    let mut config2 = absurder_sql::DatabaseConfig::default();
    config2.name = "journal_memory".to_string();
    config2.journal_mode = Some("MEMORY".to_string());
    let mut db2 = Database::new(config2).await.unwrap();
    db2.execute("PRAGMA journal_mode=MEMORY").await.unwrap();
    db2.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT)")
        .await
        .unwrap();

    let start = js_sys::Date::now();
    for i in 1..51 {
        db2.execute(&format!("INSERT INTO test VALUES ({}, 'data {}')", i, i))
            .await
            .unwrap();
    }
    let memory_time = js_sys::Date::now() - start;
    web_sys::console::log_1(
        &format!(" MEMORY journal mode: {:.2}ms for 50 inserts", memory_time).into(),
    );
    db2.close().await.unwrap();

    let speedup = default_time / memory_time;
    web_sys::console::log_1(&format!("Speedup with MEMORY journal: {:.2}x", speedup).into());

    if speedup > 1.5 {
        web_sys::console::log_1(&"MEMORY journal mode provides significant speedup!".into());
    } else {
        web_sys::console::log_1(
            &" MEMORY journal mode doesn't help much - bottleneck is elsewhere".into(),
        );
    }
}
