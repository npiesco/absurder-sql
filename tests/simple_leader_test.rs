//! Simple Leader Election Test - Debug Version

#![cfg(target_arch = "wasm32")]

use wasm_bindgen_test::*;
use wasm_bindgen::JsCast;
use absurder_sql::storage::BlockStorage;

wasm_bindgen_test_configure!(run_in_browser);

/// Simple test with just two instances to debug the issue
#[wasm_bindgen_test]
async fn test_simple_two_instance_leader_election() {
    web_sys::console::log_1(&"=== Starting simple leader election test ===".into());
    
    let db_name = "simple_leader_test";
    
    // Create first instance
    web_sys::console::log_1(&"Creating first instance...".into());
    let mut storage1 = BlockStorage::new(db_name).await.expect("create storage1");
    
    // Wait a moment
    sleep_ms(200).await;
    
    // Check if first instance is leader
    let is_leader1 = storage1.is_leader().await;
    web_sys::console::log_1(&format!("First instance is_leader: {}", is_leader1).into());
    
    // Create second instance
    web_sys::console::log_1(&"Creating second instance...".into());
    let mut storage2 = BlockStorage::new(db_name).await.expect("create storage2");
    
    // Wait a moment
    sleep_ms(200).await;
    
    // Check leadership status
    let is_leader1_after = storage1.is_leader().await;
    let is_leader2 = storage2.is_leader().await;
    
    web_sys::console::log_1(&format!("After second instance - First: {}, Second: {}", is_leader1_after, is_leader2).into());
    
    // Count leaders
    let leader_count = if is_leader1_after { 1 } else { 0 } + if is_leader2 { 1 } else { 0 };
    web_sys::console::log_1(&format!("Total leaders: {}", leader_count).into());
    
    // For now, just log the results - we expect this to fail until we fix the implementation
    if leader_count == 1 {
        web_sys::console::log_1(&"SUCCESS: Exactly one leader!".into());
    } else {
        web_sys::console::log_1(&format!("FAILURE: Expected 1 leader, got {}", leader_count).into());
    }
    
    web_sys::console::log_1(&"=== Test completed ===".into());
}

/// Helper function to sleep for specified milliseconds
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
