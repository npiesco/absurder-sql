//! Tests for BroadcastChannel notification system
//! Tests cross-tab change notifications

#![cfg(target_arch = "wasm32")]
#![allow(unused_imports)]

use wasm_bindgen_test::*;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use absurder_sql::storage::broadcast_notifications::{
    BroadcastNotification, 
    send_change_notification,
    register_change_listener,
};
use std::rc::Rc;
use std::cell::RefCell;

wasm_bindgen_test_configure!(run_in_browser);

/// Test Phase 1.2: Send and receive DataChanged notification
#[wasm_bindgen_test]
async fn test_send_data_changed_notification() {
    let db_name = "test_broadcast_db";
    
    // Create a received message tracker
    let received = Rc::new(RefCell::new(false));
    let received_clone = received.clone();
    
    // Register listener
    let callback = Closure::wrap(Box::new(move |_notification: JsValue| {
        log::debug!("Received notification");
        *received_clone.borrow_mut() = true;
    }) as Box<dyn FnMut(JsValue)>);
    
    register_change_listener(db_name, callback.as_ref().unchecked_ref())
        .expect("Should register listener");
    
    // Send notification
    let notification = BroadcastNotification::DataChanged {
        db_name: db_name.to_string(),
        timestamp: 123456789,
    };
    
    send_change_notification(&notification)
        .expect("Should send notification");
    
    // Wait for message to propagate
    sleep_ms(50).await;
    
    // Verify message was received
    assert!(*received.borrow(), "Should receive DataChanged notification");
    
    // Keep closure alive
    callback.forget();
    
    web_sys::console::log_1(&"DataChanged notification test passed".into());
}

/// Test Phase 1.2: Notification serialization/deserialization
#[wasm_bindgen_test]
fn test_notification_serialization() {
    let notification = BroadcastNotification::DataChanged {
        db_name: "test_db".to_string(),
        timestamp: 987654321,
    };
    
    // Serialize to JSON
    let json = serde_json::to_string(&notification)
        .expect("Should serialize to JSON");
    
    web_sys::console::log_1(&format!("Serialized: {}", json).into());
    
    // Deserialize back
    let deserialized: BroadcastNotification = serde_json::from_str(&json)
        .expect("Should deserialize from JSON");
    
    // Verify round-trip
    match deserialized {
        BroadcastNotification::DataChanged { db_name, timestamp } => {
            assert_eq!(db_name, "test_db");
            assert_eq!(timestamp, 987654321);
        },
        _ => panic!("Wrong notification type after deserialization"),
    }
    
    web_sys::console::log_1(&"Notification serialization test passed".into());
}

/// Test Phase 1.2: Multiple notification types
#[wasm_bindgen_test]
async fn test_multiple_notification_types() {
    let db_name = "test_multi_notif";
    let received_types = Rc::new(RefCell::new(Vec::new()));
    let received_clone = received_types.clone();
    
    let callback = Closure::wrap(Box::new(move |notification_js: JsValue| {
        // Parse notification
        if let Ok(json_str) = js_sys::JSON::stringify(&notification_js) {
            let json_str = json_str.as_string().unwrap();
            web_sys::console::log_1(&format!("Received: {}", json_str).into());
            
            if let Ok(notification) = serde_json::from_str::<BroadcastNotification>(&json_str) {
                match notification {
                    BroadcastNotification::DataChanged { .. } => {
                        received_clone.borrow_mut().push("DataChanged");
                    },
                    BroadcastNotification::SchemaChanged { .. } => {
                        received_clone.borrow_mut().push("SchemaChanged");
                    },
                    BroadcastNotification::LeaderChanged { .. } => {
                        received_clone.borrow_mut().push("LeaderChanged");
                    },
                }
            }
        }
    }) as Box<dyn FnMut(JsValue)>);
    
    register_change_listener(db_name, callback.as_ref().unchecked_ref())
        .expect("Should register listener");
    
    // Send different notification types
    send_change_notification(&BroadcastNotification::DataChanged {
        db_name: db_name.to_string(),
        timestamp: 111,
    }).expect("Should send DataChanged");
    
    sleep_ms(50).await;
    
    send_change_notification(&BroadcastNotification::SchemaChanged {
        db_name: db_name.to_string(),
        timestamp: 222,
    }).expect("Should send SchemaChanged");
    
    sleep_ms(50).await;
    
    send_change_notification(&BroadcastNotification::LeaderChanged {
        db_name: db_name.to_string(),
        new_leader: "instance_123".to_string(),
    }).expect("Should send LeaderChanged");
    
    sleep_ms(50).await;
    
    // Verify all types were received
    let types = received_types.borrow();
    assert!(types.contains(&"DataChanged"), "Should receive DataChanged");
    assert!(types.contains(&"SchemaChanged"), "Should receive SchemaChanged");
    assert!(types.contains(&"LeaderChanged"), "Should receive LeaderChanged");
    
    callback.forget();
    
    web_sys::console::log_1(&"Multiple notification types test passed".into());
}

// Helper function for async sleep
async fn sleep_ms(ms: i32) {
    let promise = js_sys::Promise::new(&mut |resolve, _| {
        let window = web_sys::window().expect("should have window");
        let _ = window.set_timeout_with_callback_and_timeout_and_arguments_0(
            &resolve,
            ms
        );
    });
    let _ = wasm_bindgen_futures::JsFuture::from(promise).await;
}
