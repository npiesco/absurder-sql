//! Test for requestLeadership regression
//! This test should FAIL until we fix start_leader_election to trigger re-election

#![cfg(target_arch = "wasm32")]

use wasm_bindgen_test::*;
use wasm_bindgen::JsCast;
use absurder_sql::storage::BlockStorage;

wasm_bindgen_test_configure!(run_in_browser);

/// Test that requestLeadership actually triggers re-election
/// Reproduces the issue where follower clicks "Request Leadership" but nothing happens
#[wasm_bindgen_test]
async fn test_request_leadership_forces_reelection() {
    web_sys::console::log_1(&"=== Testing requestLeadership regression ===".into());
    
    let db_name = "request_leadership_test";
    
    // Create first instance - becomes leader
    web_sys::console::log_1(&"Creating leader instance...".into());
    let mut storage1 = BlockStorage::new(db_name).await.expect("create storage1");
    sleep_ms(200).await;
    
    assert!(storage1.is_leader().await, "First instance should be leader");
    web_sys::console::log_1(&"First instance is leader".into());
    
    // Create second instance - becomes follower
    web_sys::console::log_1(&"Creating follower instance...".into());
    let mut storage2 = BlockStorage::new(db_name).await.expect("create storage2");
    sleep_ms(200).await;
    
    assert!(!storage2.is_leader().await, "Second instance should be follower");
    web_sys::console::log_1(&"Second instance is follower".into());
    
    // Now follower calls start_leader_election (what requestLeadership does)
    web_sys::console::log_1(&"Follower requesting leadership...".into());
    storage2.start_leader_election().await.expect("request leadership");
    
    // Wait a moment for election to process
    sleep_ms(300).await;
    
    // Check if follower tried to become leader
    let is_leader2 = storage2.is_leader().await;
    web_sys::console::log_1(&format!("After requestLeadership - follower is_leader: {}", is_leader2).into());
    
    // The bug: start_leader_election returns early if leader_election.is_some()
    // So the follower never actually tries to become leader
    // This test will FAIL until we fix it
    
    // Expected: follower should attempt to become leader (may or may not win, but should try)
    // With the bug: follower stays follower because start_leader_election does nothing
    
    // For now, we just log - this test documents the regression
    if is_leader2 {
        web_sys::console::log_1(&"PASS: Follower attempted leadership (may have won or lost)".into());
    } else {
        // Check if there's any attempt - we can check localStorage for recent activity
        web_sys::console::log_1(&"FAIL: Follower did not attempt to become leader - requestLeadership broken".into());
        panic!("requestLeadership regression: follower never attempted election");
    }
}

async fn sleep_ms(ms: u32) {
    use wasm_bindgen_futures::JsFuture;
    use js_sys;
    
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
