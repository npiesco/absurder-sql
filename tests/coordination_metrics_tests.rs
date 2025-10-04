#![cfg(target_arch = "wasm32")]

use wasm_bindgen_test::*;

#[cfg(target_arch = "wasm32")]
wasm_bindgen_test_configure!(run_in_browser);

#[cfg(target_arch = "wasm32")]
use sqlite_indexeddb_rs::Database;

/// Test that coordination metrics can be enabled
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_enable_coordination_metrics() {
    use web_sys::console;
    console::log_1(&"TEST: Enable coordination metrics".into());
    
    let mut db = Database::new_wasm("coord_metrics_enable_test".to_string()).await.unwrap();
    
    // Enable coordination metrics tracking
    db.enable_coordination_metrics(true).await.unwrap();
    
    // Verify it's enabled
    let is_enabled = db.is_coordination_metrics_enabled().await;
    assert!(is_enabled, "Coordination metrics should be enabled");
    
    console::log_1(&"TEST PASSED: Coordination metrics enabled".into());
}

/// Test tracking leadership changes
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_track_leadership_changes() {
    use web_sys::console;
    console::log_1(&"TEST: Track leadership changes".into());
    
    let mut db = Database::new_wasm("coord_metrics_leadership_test".to_string()).await.unwrap();
    
    // Enable metrics
    db.enable_coordination_metrics(true).await.unwrap();
    
    // Wait for initial leader election
    wasm_bindgen_futures::JsFuture::from(js_sys::Promise::new(&mut |resolve, _reject| {
        web_sys::window()
            .unwrap()
            .set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, 500)
            .unwrap();
    })).await.unwrap();
    
    // Track a leadership change
    db.record_leadership_change(true).await.unwrap();
    
    // Get metrics
    let metrics = db.get_coordination_metrics().await.unwrap();
    
    // Parse the JSON string
    let metrics_obj: serde_json::Value = serde_json::from_str(&metrics).unwrap();
    
    // Should have at least 1 leadership change
    let leadership_changes = metrics_obj["leadership_changes"].as_u64().unwrap();
    assert!(leadership_changes >= 1, "Should have at least 1 leadership change");
    
    console::log_1(&"TEST PASSED: Leadership changes tracked".into());
}

/// Test tracking notification latency
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_track_notification_latency() {
    use web_sys::console;
    console::log_1(&"TEST: Track notification latency".into());
    
    let mut db = Database::new_wasm("coord_metrics_latency_test".to_string()).await.unwrap();
    
    // Enable metrics
    db.enable_coordination_metrics(true).await.unwrap();
    
    // Record some notification latencies (in milliseconds)
    db.record_notification_latency(10.5).await.unwrap();
    db.record_notification_latency(15.2).await.unwrap();
    db.record_notification_latency(12.8).await.unwrap();
    
    // Get metrics
    let metrics = db.get_coordination_metrics().await.unwrap();
    let metrics_obj: serde_json::Value = serde_json::from_str(&metrics).unwrap();
    
    // Should have average latency calculated
    let avg_latency = metrics_obj["avg_notification_latency_ms"].as_f64().unwrap();
    assert!(avg_latency > 0.0, "Should have positive average latency");
    
    // Should be around 12.83ms average
    assert!((avg_latency - 12.83).abs() < 1.0, "Average should be around 12.83ms");
    
    console::log_1(&"TEST PASSED: Notification latency tracked".into());
}

/// Test tracking write conflicts
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_track_write_conflicts() {
    use web_sys::console;
    console::log_1(&"TEST: Track write conflicts".into());
    
    let mut db = Database::new_wasm("coord_metrics_conflicts_test".to_string()).await.unwrap();
    
    // Enable metrics
    db.enable_coordination_metrics(true).await.unwrap();
    
    // Record some write conflicts
    db.record_write_conflict().await.unwrap();
    db.record_write_conflict().await.unwrap();
    
    // Get metrics
    let metrics = db.get_coordination_metrics().await.unwrap();
    let metrics_obj: serde_json::Value = serde_json::from_str(&metrics).unwrap();
    
    // Should have 2 write conflicts
    let write_conflicts = metrics_obj["write_conflicts"].as_u64().unwrap();
    assert_eq!(write_conflicts, 2, "Should have 2 write conflicts");
    
    console::log_1(&"TEST PASSED: Write conflicts tracked".into());
}

/// Test tracking follower refreshes
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_track_follower_refreshes() {
    use web_sys::console;
    console::log_1(&"TEST: Track follower refreshes".into());
    
    let mut db = Database::new_wasm("coord_metrics_refresh_test".to_string()).await.unwrap();
    
    // Enable metrics
    db.enable_coordination_metrics(true).await.unwrap();
    
    // Record some follower refreshes
    db.record_follower_refresh().await.unwrap();
    db.record_follower_refresh().await.unwrap();
    db.record_follower_refresh().await.unwrap();
    
    // Get metrics
    let metrics = db.get_coordination_metrics().await.unwrap();
    let metrics_obj: serde_json::Value = serde_json::from_str(&metrics).unwrap();
    
    // Should have 3 follower refreshes
    let follower_refreshes = metrics_obj["follower_refreshes"].as_u64().unwrap();
    assert_eq!(follower_refreshes, 3, "Should have 3 follower refreshes");
    
    console::log_1(&"TEST PASSED: Follower refreshes tracked".into());
}

/// Test resetting metrics
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_reset_coordination_metrics() {
    use web_sys::console;
    console::log_1(&"TEST: Reset coordination metrics".into());
    
    let mut db = Database::new_wasm("coord_metrics_reset_test".to_string()).await.unwrap();
    
    // Enable metrics
    db.enable_coordination_metrics(true).await.unwrap();
    
    // Record some metrics
    db.record_leadership_change(true).await.unwrap();
    db.record_write_conflict().await.unwrap();
    db.record_follower_refresh().await.unwrap();
    
    // Reset metrics
    db.reset_coordination_metrics().await.unwrap();
    
    // Get metrics
    let metrics = db.get_coordination_metrics().await.unwrap();
    let metrics_obj: serde_json::Value = serde_json::from_str(&metrics).unwrap();
    
    // All should be zero
    assert_eq!(metrics_obj["leadership_changes"].as_u64().unwrap(), 0);
    assert_eq!(metrics_obj["write_conflicts"].as_u64().unwrap(), 0);
    assert_eq!(metrics_obj["follower_refreshes"].as_u64().unwrap(), 0);
    
    console::log_1(&"TEST PASSED: Coordination metrics reset".into());
}
