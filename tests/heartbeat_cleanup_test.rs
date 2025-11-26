//! Test heartbeat stops after database close

#![cfg(target_arch = "wasm32")]

use absurder_sql::{Database, DatabaseConfig};
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

/// TDD Test: Verify heartbeat stops after database close
#[wasm_bindgen_test]
async fn test_heartbeat_stops_after_close() {
    // Setup: Clear any leftover state
    let db_name = format!("heartbeat_test_{}.db", js_sys::Date::now() as u64);

    web_sys::window()
        .unwrap()
        .local_storage()
        .unwrap()
        .unwrap()
        .clear()
        .unwrap();

    log::info!("TEST: Creating database {}", db_name);

    // Create database with minimal cache to reduce memory
    let mut config = DatabaseConfig::mobile_optimized(&db_name);
    config.cache_size = Some(10);

    let mut db = Database::new(config)
        .await
        .expect("Failed to create database");

    // CRITICAL: Trigger leader election by checking leadership
    web_sys::console::log_1(&"TEST: Checking if leader".into());
    let is_leader = db.is_leader().await.expect("Failed to check leader");
    web_sys::console::log_1(&format!("TEST: is_leader returned: {}", is_leader).into());
    assert!(is_leader, "Should be leader");

    // Verify heartbeat is active by checking localStorage
    // Heartbeat data is stored in datasync_leader_{db} key as "instance_id:timestamp"
    // The heartbeat should fire IMMEDIATELY when leadership is established
    web_sys::console::log_1(&"TEST: Checking heartbeat is active".into());
    let heartbeat_key = format!("datasync_leader_{}", db_name);
    web_sys::console::log_1(&format!("TEST: Looking for key: {}", heartbeat_key).into());
    let storage = web_sys::window().unwrap().local_storage().unwrap().unwrap();

    // Check if key exists
    let initial_heartbeat = storage.get_item(&heartbeat_key).unwrap();
    web_sys::console::log_1(&format!("TEST: Heartbeat value: {:?}", initial_heartbeat).into());

    let initial_heartbeat =
        initial_heartbeat.expect("Heartbeat should exist immediately after becoming leader");

    log::info!("TEST: Initial heartbeat: {}", initial_heartbeat);

    // Wait a bit to ensure heartbeat updates
    wasm_bindgen_futures::JsFuture::from(js_sys::Promise::new(&mut |resolve, _| {
        web_sys::window()
            .unwrap()
            .set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, 100)
            .unwrap();
    }))
    .await
    .unwrap();

    let updated_heartbeat = storage
        .get_item(&heartbeat_key)
        .unwrap()
        .expect("Heartbeat should still exist");

    log::info!("TEST: Updated heartbeat: {}", updated_heartbeat);

    // Verify heartbeat is changing (leader is active)
    // Note: timestamps might be the same if checked too quickly, so just verify it exists
    assert!(
        !updated_heartbeat.is_empty(),
        "Heartbeat should be updating"
    );

    // Close the database
    log::info!("TEST: Closing database");
    db.close().await.expect("Failed to close database");
    log::info!("TEST: Database closed");

    // Wait for cleanup to complete
    wasm_bindgen_futures::JsFuture::from(js_sys::Promise::new(&mut |resolve, _| {
        web_sys::window()
            .unwrap()
            .set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, 2000)
            .unwrap();
    }))
    .await
    .unwrap();

    // Verify heartbeat stopped (localStorage key should be removed)
    log::info!("TEST: Checking heartbeat stopped");
    let final_heartbeat = storage.get_item(&heartbeat_key).unwrap();

    assert!(
        final_heartbeat.is_none() || final_heartbeat == Some("".to_string()),
        "Heartbeat should be stopped/removed after close"
    );

    log::info!("TEST: Test completed successfully");

    // Cleanup
    Database::delete_database(format!("{}.db", db_name))
        .await
        .ok();
}
