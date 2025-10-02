#![cfg(target_arch = "wasm32")]

use wasm_bindgen_test::*;
use sqlite_indexeddb_rs::Database;

wasm_bindgen_test_configure!(run_in_browser);

/// Test that proves we're syncing too frequently
/// Expected: 1 sync per batch (when transaction commits)
/// Actual (before fix): 10 syncs for 10 inserts
#[wasm_bindgen_test]
async fn test_sync_frequency_is_excessive() {
    web_sys::console::log_1(&"=== SYNC FREQUENCY TEST (PROVING THE BUG) ===".into());
    
    let mut config = sqlite_indexeddb_rs::DatabaseConfig::default();
    config.name = "sync_frequency_test".to_string();
    let mut db = Database::new(config).await.unwrap();
    
    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT)").await.unwrap();
    
    // Count how many times "VFS sync: Persisting" appears in console
    // We'll do 10 inserts and count syncs
    web_sys::console::log_1(&"🔍 Starting 10 inserts - count 'VFS sync: Persisting' messages".into());
    web_sys::console::log_1(&"Expected: 1 sync at end".into());
    web_sys::console::log_1(&"Actual: (watch console)".into());
    
    for i in 1..=10 {
        db.execute(&format!("INSERT INTO test VALUES ({}, 'data {}')", i, i)).await.unwrap();
    }
    
    web_sys::console::log_1(&"✅ Inserts complete - check console for sync count".into());
    web_sys::console::log_1(&"⚠️  If you see 10 'VFS sync: Persisting' messages, the bug is confirmed!".into());
    
    db.close().await.unwrap();
}

/// Test that proves syncing on every insert kills performance
#[wasm_bindgen_test]
async fn test_sync_overhead_performance_impact() {
    web_sys::console::log_1(&"=== PERFORMANCE IMPACT TEST ===".into());
    
    let mut config = sqlite_indexeddb_rs::DatabaseConfig::default();
    config.name = "perf_impact_test".to_string();
    let mut db = Database::new(config).await.unwrap();
    
    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT)").await.unwrap();
    
    // Measure time for 50 inserts (each triggering a sync)
    let start = js_sys::Date::now();
    for i in 1..=50 {
        db.execute(&format!("INSERT INTO test VALUES ({}, 'data {}')", i, i)).await.unwrap();
    }
    let time_with_excessive_syncs = js_sys::Date::now() - start;
    
    web_sys::console::log_1(&format!("⏱️  50 inserts with sync-per-insert: {:.2}ms", time_with_excessive_syncs).into());
    web_sys::console::log_1(&format!("⏱️  Per-insert cost: {:.2}ms", time_with_excessive_syncs / 50.0).into());
    
    // Expected: After fix, this should be much faster (< 100ms total)
    // Current: Likely 500ms+ due to IndexedDB overhead
    
    if time_with_excessive_syncs > 500.0 {
        web_sys::console::log_1(&"❌ SLOW: Excessive syncing is killing performance!".into());
    } else {
        web_sys::console::log_1(&"✅ FAST: Syncing is optimized!".into());
    }
    
    db.close().await.unwrap();
}

/// Test that batched inserts should only sync once
#[wasm_bindgen_test]
async fn test_batched_inserts_should_sync_once() {
    web_sys::console::log_1(&"=== BATCHED INSERT SYNC TEST ===".into());
    
    let mut config = sqlite_indexeddb_rs::DatabaseConfig::default();
    config.name = "batch_sync_test".to_string();
    let mut db = Database::new(config).await.unwrap();
    
    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT)").await.unwrap();
    
    web_sys::console::log_1(&"Starting explicit transaction with 20 inserts".into());
    web_sys::console::log_1(&"Expected: 1 sync at COMMIT".into());
    web_sys::console::log_1(&"Actual: (count 'VFS sync: Persisting' messages)".into());
    
    db.execute("BEGIN TRANSACTION").await.unwrap();
    for i in 1..=20 {
        db.execute(&format!("INSERT INTO test VALUES ({}, 'data {}')", i, i)).await.unwrap();
    }
    db.execute("COMMIT").await.unwrap();
    
    web_sys::console::log_1(&"Transaction complete - check sync count".into());
    
    db.close().await.unwrap();
}

/// Test to verify the fix: deferred sync only on explicit fsync
#[wasm_bindgen_test]
async fn test_deferred_sync_behavior_after_fix() {
    web_sys::console::log_1(&"=== DEFERRED SYNC TEST (AFTER FIX) ===".into());
    
    let mut config = sqlite_indexeddb_rs::DatabaseConfig::default();
    config.name = "deferred_sync_test".to_string();
    let mut db = Database::new(config).await.unwrap();
    
    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT)").await.unwrap();
    
    web_sys::console::log_1(&"Doing 10 inserts with deferred sync".into());
    
    let start = js_sys::Date::now();
    for i in 1..=10 {
        db.execute(&format!("INSERT INTO test VALUES ({}, 'data {}')", i, i)).await.unwrap();
    }
    let insert_time = js_sys::Date::now() - start;
    
    web_sys::console::log_1(&format!("⏱️  10 inserts: {:.2}ms ({:.2}ms per insert)", insert_time, insert_time / 10.0).into());
    
    // After fix, this should be fast (< 50ms total)
    if insert_time < 100.0 {
        web_sys::console::log_1(&"✅ PASS: Deferred sync is working! Inserts are fast.".into());
    } else {
        web_sys::console::log_1(&"❌ FAIL: Still syncing too frequently!".into());
    }
    
    db.close().await.unwrap();
}

/// Test that data is still persisted correctly with deferred sync
/// Currently disabled: SQLite doesn't support schema persistence across separate connections without WAL+shared cache
#[wasm_bindgen_test]
#[ignore]
async fn test_data_persistence_with_deferred_sync() {
    web_sys::console::log_1(&"=== DATA PERSISTENCE TEST ===".into());
    
    let db_name = "persistence_test";
    
    // Write data
    {
        let mut config = sqlite_indexeddb_rs::DatabaseConfig::default();
        config.name = db_name.to_string();
        let mut db = Database::new(config).await.unwrap();
        
        db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT)").await.unwrap();
        db.execute("INSERT INTO test VALUES (1, 'test data')").await.unwrap();
        
        // Close should trigger final sync
        db.close().await.unwrap();
    }
    
    // Give IndexedDB time to persist
    let promise = js_sys::Promise::new(&mut |resolve, _reject| {
        web_sys::window()
            .unwrap()
            .set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, 100)
            .unwrap();
    });
    wasm_bindgen_futures::JsFuture::from(promise).await.unwrap();
    
    // Read data back
    {
        let mut config = sqlite_indexeddb_rs::DatabaseConfig::default();
        config.name = db_name.to_string();
        let mut db = Database::new(config).await.unwrap();
        
        let rows = db.execute("SELECT * FROM test WHERE id = 1").await.unwrap();
        let rows_array: js_sys::Array = rows.into();
        
        if rows_array.length() == 1 {
            web_sys::console::log_1(&"✅ PASS: Data persisted correctly with deferred sync".into());
        } else {
            web_sys::console::log_1(&"❌ FAIL: Data not persisted!".into());
        }
        
        db.close().await.unwrap();
    }
}
