//! Multi-Tab Leader Election Tests (TDD - expected to FAIL initially)

#![cfg(target_arch = "wasm32")]
#![allow(unused_imports)]

use wasm_bindgen_test::*;
use wasm_bindgen::JsCast;
use sqlite_indexeddb_rs::storage::{BlockStorage, BLOCK_SIZE};
use sqlite_indexeddb_rs::types::DatabaseError;
use std::time::Duration;
use js_sys::Date;

wasm_bindgen_test_configure!(run_in_browser);

/// Test basic leader election between two instances
/// First instance should become leader, second should be follower
#[wasm_bindgen_test]
async fn test_basic_leader_election() {
    let db_name = "leader_election_test";
    
    // Create first instance - should become leader
    let mut storage1 = BlockStorage::new(db_name).await.expect("create storage1");
    
    // Wait a moment for leader election to complete
    sleep_ms(100).await;
    
    // First instance should be leader
    assert!(storage1.is_leader().await, "First instance should become leader");
    
    // Create second instance - should become follower
    let mut storage2 = BlockStorage::new(db_name).await.expect("create storage2");
    
    // Wait a moment for leader election to complete
    sleep_ms(100).await;
    
    // First instance should still be leader
    assert!(storage1.is_leader().await, "First instance should remain leader");
    
    // Second instance should be follower
    assert!(!storage2.is_leader().await, "Second instance should be follower");
    
    web_sys::console::log_1(&"✅ Basic leader election test completed".into());
}

/// Test leader lease expiry and handover
/// When leader stops renewing lease, another instance should take over
#[wasm_bindgen_test]
async fn test_leader_lease_expiry_handover() {
    let db_name = "lease_expiry_test";
    
    // Create first instance - should become leader
    let mut storage1 = BlockStorage::new(db_name).await.expect("create storage1");
    sleep_ms(100).await;
    assert!(storage1.is_leader().await, "First instance should become leader");
    
    // Create second instance - should be follower
    let mut storage2 = BlockStorage::new(db_name).await.expect("create storage2");
    sleep_ms(100).await;
    assert!(!storage2.is_leader().await, "Second instance should be follower");
    
    // Stop first instance (simulate tab close/crash)
    storage1.stop_leader_election().await.expect("stop leader election");
    
    // Wait for lease to expire (should be ~5 seconds)
    sleep_ms(6000).await;
    
    // Second instance should now be leader
    assert!(storage2.is_leader().await, "Second instance should become leader after lease expiry");
    
    web_sys::console::log_1(&"✅ Leader lease expiry handover test completed".into());
}

/// Test leader election with multiple instances
/// Only one should be leader at any time
#[wasm_bindgen_test]
async fn test_multiple_instances_single_leader() {
    let db_name = "multiple_instances_test";
    
    // Create multiple instances
    let mut storage1 = BlockStorage::new(db_name).await.expect("create storage1");
    let mut storage2 = BlockStorage::new(db_name).await.expect("create storage2");
    let mut storage3 = BlockStorage::new(db_name).await.expect("create storage3");
    
    // Wait for leader election to stabilize
    sleep_ms(200).await;
    
    // Count leaders
    let mut leader_count = 0;
    if storage1.is_leader().await { leader_count += 1; }
    if storage2.is_leader().await { leader_count += 1; }
    if storage3.is_leader().await { leader_count += 1; }
    
    // Exactly one should be leader
    assert_eq!(leader_count, 1, "Exactly one instance should be leader");
    
    web_sys::console::log_1(&format!("✅ Multiple instances test completed - {} leaders found", leader_count).into());
}

/// Test BroadcastChannel communication between instances
/// Leader should broadcast heartbeats, followers should receive them
#[wasm_bindgen_test]
async fn test_broadcast_channel_communication() {
    let db_name = "broadcast_test";
    
    // Create leader instance
    let mut storage1 = BlockStorage::new(db_name).await.expect("create storage1");
    sleep_ms(100).await;
    assert!(storage1.is_leader().await, "First instance should become leader");
    
    // Create follower instance
    let mut storage2 = BlockStorage::new(db_name).await.expect("create storage2");
    sleep_ms(100).await;
    assert!(!storage2.is_leader().await, "Second instance should be follower");
    
    // Leader should send heartbeat
    storage1.send_leader_heartbeat().await.expect("send heartbeat");
    
    // Wait for message propagation
    sleep_ms(50).await;
    
    // Follower should have received heartbeat
    let last_heartbeat = storage2.get_last_leader_heartbeat().await.expect("get last heartbeat");
    assert!(last_heartbeat > 0, "Follower should have received leader heartbeat");
    
    web_sys::console::log_1(&"✅ BroadcastChannel communication test completed".into());
}

/// Helper function to sleep for specified milliseconds
async fn sleep_ms(ms: u32) {
    use wasm_bindgen_futures::JsFuture;
    use web_sys::js_sys;
    
    let promise = js_sys::Promise::new(&mut |resolve, _| {
        let closure = wasm_bindgen::closure::Closure::wrap(Box::new(move || {
            resolve.call0(&wasm_bindgen::JsValue::NULL).unwrap();
        }) as Box<dyn FnMut()>);
        
        web_sys::window()
            .unwrap()
            .set_timeout_with_callback_and_timeout_and_arguments_0(
                closure.as_ref().unchecked_ref(),
                ms as i32,
            )
            .unwrap();
        
        closure.forget();
    });
    
    JsFuture::from(promise).await.unwrap();
}
