//! Test that leader maintains lease with heartbeat after force takeover
//! This test should FAIL until we properly start heartbeat after force_become_leader

#![cfg(target_arch = "wasm32")]

use absurder_sql::storage::BlockStorage;
use wasm_bindgen::JsCast;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

/// Test that after forcing leadership, the leader maintains its lease via heartbeat
#[wasm_bindgen_test]
async fn test_forced_leader_maintains_lease() {
    web_sys::console::log_1(&"=== Testing forced leadership lease maintenance ===".into());

    let db_name = "forced_leader_lease_test";

    // Create first instance - becomes leader
    web_sys::console::log_1(&"Creating first instance (will be leader)...".into());
    let storage1 = BlockStorage::new(db_name).await.expect("create storage1");
    sleep_ms(200).await;

    assert!(
        storage1.is_leader().await,
        "First instance should be leader"
    );
    web_sys::console::log_1(&"First instance is leader".into());

    // Create second instance - becomes follower
    web_sys::console::log_1(&"Creating second instance (will be follower)...".into());
    let storage2 = BlockStorage::new(db_name).await.expect("create storage2");
    sleep_ms(200).await;

    assert!(
        !storage2.is_leader().await,
        "Second instance should be follower"
    );
    web_sys::console::log_1(&"Second instance is follower".into());

    // Follower forces leadership
    web_sys::console::log_1(&"Follower forcing leadership takeover...".into());
    storage2
        .start_leader_election()
        .await
        .expect("force leadership");
    sleep_ms(300).await;

    // Verify follower is now leader
    assert!(
        storage2.is_leader().await,
        "Second instance should be leader after forcing"
    );
    web_sys::console::log_1(&"Second instance forced leadership successfully".into());

    // Wait 6 seconds (longer than 5 second lease)
    web_sys::console::log_1(
        &"Waiting 6 seconds to test if lease is maintained via heartbeat...".into(),
    );
    sleep_ms(6000).await;

    // Check if still leader (should be true if heartbeat is working)
    let still_leader = storage2.is_leader().await;
    web_sys::console::log_1(&format!("After 6 seconds - still leader: {}", still_leader).into());

    if still_leader {
        web_sys::console::log_1(&"PASS: Leader maintained lease via heartbeat".into());
    } else {
        web_sys::console::log_1(&"FAIL: Leader lost lease - heartbeat not running".into());
        panic!("Leader lease expired - heartbeat not started after force_become_leader");
    }
}

async fn sleep_ms(ms: u32) {
    use js_sys;
    use wasm_bindgen_futures::JsFuture;

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
