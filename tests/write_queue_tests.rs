//! Tests for write queuing system for non-leader tabs
//!
//! This allows non-leaders to queue writes that are forwarded to the leader

#[cfg(target_arch = "wasm32")]
use wasm_bindgen_test::*;

#[cfg(target_arch = "wasm32")]
wasm_bindgen_test_configure!(run_in_browser);

#[cfg(target_arch = "wasm32")]
use absurder_sql::Database;

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_leader_can_queue_write_directly() {
    use web_sys::console;
    console::log_1(&"TEST: Leader can queue write (executes directly)".into());
    
    // Create database instance (will be leader)
    let mut db = Database::new_wasm("write_queue_direct_test".to_string()).await.unwrap();
    
    // Create table
    db.execute("CREATE TABLE IF NOT EXISTS queue_test (id INT, value TEXT)").await.unwrap();
    
    // Wait for leader election
    wasm_bindgen_futures::JsFuture::from(js_sys::Promise::new(&mut |resolve, _reject| {
        web_sys::window()
            .unwrap()
            .set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, 500)
            .unwrap();
    })).await.unwrap();
    
    // Leader queues a write (should execute directly, not via BroadcastChannel)
    let result = db.queue_write("INSERT INTO queue_test VALUES (1, 'direct')".to_string()).await;
    
    // Should succeed
    assert!(result.is_ok(), "Leader's queue_write should succeed");
    
    // Verify the data was written
    let result = db.query("SELECT * FROM queue_test").await.unwrap();
    assert_eq!(result.len(), 1, "Should see the written data");
    
    console::log_1(&"TEST PASSED: Leader can queue write directly".into());
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_write_queue_infrastructure_exists() {
    use web_sys::console;
    console::log_1(&"TEST: Write queue infrastructure exists".into());
    
    // Create database
    let mut db = Database::new_wasm("write_queue_infra_test".to_string()).await.unwrap();
    
    // Set up table
    db.execute("CREATE TABLE IF NOT EXISTS infra_test (id INT, value TEXT)").await.unwrap();
    
    // Wait for leader election
    wasm_bindgen_futures::JsFuture::from(js_sys::Promise::new(&mut |resolve, _reject| {
        web_sys::window()
            .unwrap()
            .set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, 500)
            .unwrap();
    })).await.unwrap();
    
    // Test that queue_write method exists and works (leader will execute directly)
    let result = db.queue_write("INSERT INTO infra_test VALUES (1, 'test')".to_string()).await;
    assert!(result.is_ok(), "queue_write should work");
    
    // Test with timeout variant
    let result2 = db.queue_write_with_timeout("INSERT INTO infra_test VALUES (2, 'test2')".to_string(), 5000).await;
    assert!(result2.is_ok(), "queue_write_with_timeout should work");
    
    // Verify data was written
    let rows = db.query("SELECT * FROM infra_test").await.unwrap();
    assert_eq!(rows.len(), 2, "Should have 2 rows");
    
    console::log_1(&"TEST PASSED: Write queue infrastructure verified".into());
}
