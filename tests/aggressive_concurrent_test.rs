//! RED Phase: Aggressive test to trigger RefCell panic in STORAGE_REGISTRY
//!
//! This test simulates the exact PWA regex search scenario:
//! - Multiple databases (6 workers)
//! - Each performing 30+ rapid consecutive queries (regex search pattern)
//! - All happening simultaneously
//!
//! Expected RED: RefCell borrow panic "Failed to prepare statement"
//! Expected GREEN: All queries succeed

#![cfg(target_arch = "wasm32")]

use absurder_sql::Database;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

/// RED: Simulate multiple databases with concurrent isLeader() calls
/// This hits the direct reg.borrow() calls in lib.rs lines 127, 2088, 2205
#[wasm_bindgen_test]
async fn test_concurrent_is_leader_calls() {
    console_log::init_with_level(log::Level::Debug).ok();

    // Create 6 databases (6 Playwright workers)
    let mut db1 = Database::new_wasm("concurrent_1".to_string())
        .await
        .unwrap();
    let mut db2 = Database::new_wasm("concurrent_2".to_string())
        .await
        .unwrap();
    let mut db3 = Database::new_wasm("concurrent_3".to_string())
        .await
        .unwrap();
    let mut db4 = Database::new_wasm("concurrent_4".to_string())
        .await
        .unwrap();
    let mut db5 = Database::new_wasm("concurrent_5".to_string())
        .await
        .unwrap();
    let mut db6 = Database::new_wasm("concurrent_6".to_string())
        .await
        .unwrap();

    // All 6 call isLeader() simultaneously - this hits STORAGE_REGISTRY.with(|reg| reg.borrow())
    // RED: Should trigger RefCell borrow panic
    let (r1, r2, r3, r4, r5, r6) = futures::join!(
        db1.is_leader(),
        db2.is_leader(),
        db3.is_leader(),
        db4.is_leader(),
        db5.is_leader(),
        db6.is_leader(),
    );

    // Check results
    let results = vec![r1, r2, r3, r4, r5, r6];
    let failures: Vec<_> = results
        .iter()
        .enumerate()
        .filter_map(|(i, r)| {
            if r.is_err() {
                Some((i, r.as_ref().unwrap_err()))
            } else {
                None
            }
        })
        .collect();

    if !failures.is_empty() {
        panic!(
            "RED PHASE CONFIRMED: {} isLeader() calls failed:\n{:?}",
            failures.len(),
            failures
        );
    }

    // Cleanup
    db1.close().await.ok();
    db2.close().await.ok();
    db3.close().await.ok();
    db4.close().await.ok();
    db5.close().await.ok();
    db6.close().await.ok();
    Database::delete_database("concurrent_1".to_string())
        .await
        .ok();
    Database::delete_database("concurrent_2".to_string())
        .await
        .ok();
    Database::delete_database("concurrent_3".to_string())
        .await
        .ok();
    Database::delete_database("concurrent_4".to_string())
        .await
        .ok();
    Database::delete_database("concurrent_5".to_string())
        .await
        .ok();
    Database::delete_database("concurrent_6".to_string())
        .await
        .ok();
}
