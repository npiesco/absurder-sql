#![cfg(target_arch = "wasm32")]

use wasm_bindgen_test::*;

#[cfg(target_arch = "wasm32")]
wasm_bindgen_test_configure!(run_in_browser);

#[cfg(target_arch = "wasm32")]
use absurder_sql::Database;

/// Test basic optimistic update tracking
/// This tests that we can enable optimistic mode and track writes
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_enable_optimistic_mode() {
    use web_sys::console;
    console::log_1(&"TEST: Enable optimistic mode".into());

    // Create database
    let mut db = Database::new_wasm("optimistic_mode_test".to_string())
        .await
        .unwrap();

    // Enable optimistic updates mode
    db.enable_optimistic_updates(true).await.unwrap();

    // Verify it's enabled
    let is_enabled = db.is_optimistic_mode().await;
    assert!(is_enabled, "Optimistic mode should be enabled");

    console::log_1(&"TEST PASSED: Optimistic mode enabled".into());
}

/// Test tracking pending writes in optimistic mode
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_track_pending_writes() {
    use web_sys::console;
    console::log_1(&"TEST: Track pending writes".into());

    let mut db = Database::new_wasm("optimistic_track_test".to_string())
        .await
        .unwrap();

    // Enable optimistic mode
    db.enable_optimistic_updates(true).await.unwrap();

    // Setup table
    db.execute("CREATE TABLE IF NOT EXISTS items (id INT PRIMARY KEY, name TEXT)")
        .await
        .unwrap();
    db.sync().await.unwrap();

    // Wait for leader election
    wasm_bindgen_futures::JsFuture::from(js_sys::Promise::new(&mut |resolve, _reject| {
        web_sys::window()
            .unwrap()
            .set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, 500)
            .unwrap();
    }))
    .await
    .unwrap();

    // Track a pending write
    db.track_optimistic_write("INSERT INTO items VALUES (1, 'pending')".to_string())
        .await
        .unwrap();

    // Should have 1 pending write
    let pending_count = db.get_pending_writes_count().await;
    assert_eq!(pending_count, 1, "Should have 1 pending write");

    console::log_1(&"TEST PASSED: Pending writes tracked".into());
}

/// Test clearing pending writes after confirmation
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_clear_pending_writes() {
    use web_sys::console;
    console::log_1(&"TEST: Clear pending writes".into());

    let mut db = Database::new_wasm("optimistic_clear_test".to_string())
        .await
        .unwrap();

    // Enable optimistic mode
    db.enable_optimistic_updates(true).await.unwrap();

    // Track some writes
    db.track_optimistic_write("INSERT INTO items VALUES (1, 'item1')".to_string())
        .await
        .unwrap();
    db.track_optimistic_write("INSERT INTO items VALUES (2, 'item2')".to_string())
        .await
        .unwrap();

    // Should have 2 pending
    let pending_count = db.get_pending_writes_count().await;
    assert_eq!(pending_count, 2, "Should have 2 pending writes");

    // Clear all pending
    db.clear_optimistic_writes().await.unwrap();

    // Should have 0 pending
    let pending_count_after = db.get_pending_writes_count().await;
    assert_eq!(
        pending_count_after, 0,
        "Should have 0 pending writes after clear"
    );

    console::log_1(&"TEST PASSED: Pending writes cleared".into());
}
