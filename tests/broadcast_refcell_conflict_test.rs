//! Test for BroadcastChannel RefCell borrow conflict
//! This test should reproduce the "recursive use of an object detected" error
//! that occurs when a tab receives its own BroadcastChannel messages during writes

#![cfg(target_arch = "wasm32")]

use absurder_sql::{Database, types::ColumnValue};
use wasm_bindgen::JsCast;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

/// Test that rapid writes don't cause RefCell borrow conflicts from BroadcastChannel
/// This reproduces the error: "recursive use of an object detected which would lead to unsafe aliasing in rust"
#[wasm_bindgen_test]
async fn test_broadcast_channel_refcell_conflict() {
    web_sys::console::log_1(&"=== Testing BroadcastChannel RefCell conflict ===".into());

    let db_name = "broadcast_conflict_test";

    // Create database
    web_sys::console::log_1(&"Creating database...".into());
    let mut db = Database::new_wasm(db_name.to_string())
        .await
        .expect("create db");
    sleep_ms(100).await;

    // Create test table
    db.execute("CREATE TABLE IF NOT EXISTS test (id INT, value TEXT)")
        .await
        .expect("create table");

    // Register onDataChange callback that logs
    web_sys::console::log_1(&"Registering onDataChange callback...".into());
    let callback =
        wasm_bindgen::closure::Closure::wrap(Box::new(move |_change_type: wasm_bindgen::JsValue| {
            web_sys::console::log_1(&"📢 Data change notification received".into());
        }) as Box<dyn FnMut(wasm_bindgen::JsValue)>);

    db.on_data_change_wasm(callback.as_ref().unchecked_ref())
        .expect("register callback");
    callback.forget(); // Keep callback alive

    web_sys::console::log_1(&"Performing rapid writes WITH concurrent status checks...".into());

    // Perform multiple rapid writes while also checking leader status
    // This simulates the vite app's polling behavior that triggers the RefCell conflict
    for i in 0..5 {
        web_sys::console::log_1(&format!("Write {}", i).into());

        let params = vec![
            ColumnValue::Integer(i as i64),
            ColumnValue::Text(format!("test{}", i)),
        ];

        match db
            .execute_with_params(
                "INSERT INTO test VALUES (?, ?)",
                serde_wasm_bindgen::to_value(&params).unwrap(),
            )
            .await
        {
            Ok(_) => {
                web_sys::console::log_1(&format!("Write {} succeeded", i).into());

                // Check leader status DURING sync (this triggers the conflict)
                match db.is_leader().await {
                    Ok(is_leader) => {
                        web_sys::console::log_1(
                            &format!("Leader status check: {}", is_leader).into(),
                        );
                    }
                    Err(e) => {
                        let err_str = format!("{:?}", e);
                        if err_str.contains("recursive use") || err_str.contains("borrow") {
                            web_sys::console::log_1(
                                &"🐛 REPRODUCED: RefCell conflict during isLeader check!".into(),
                            );
                            panic!("RefCell borrow conflict in isLeader: {}", err_str);
                        }
                    }
                }

                // Sync to trigger BroadcastChannel notification
                if let Err(e) = db.sync().await {
                    let err_str = format!("{:?}", e);
                    if err_str.contains("recursive use") || err_str.contains("borrow") {
                        web_sys::console::log_1(
                            &"🐛 REPRODUCED: RefCell conflict during sync!".into(),
                        );
                        panic!("RefCell borrow conflict in sync: {}", err_str);
                    }
                    web_sys::console::log_1(&format!("Sync {} failed: {}", i, err_str).into());
                    panic!("Sync failed: {}", err_str);
                }
                web_sys::console::log_1(&format!("Sync {} succeeded", i).into());

                // Check status again right after sync (when BroadcastChannel fires)
                match db.is_leader().await {
                    Ok(is_leader) => {
                        web_sys::console::log_1(
                            &format!("Post-sync leader check: {}", is_leader).into(),
                        );
                    }
                    Err(e) => {
                        let err_str = format!("{:?}", e);
                        if err_str.contains("recursive use") || err_str.contains("borrow") {
                            web_sys::console::log_1(
                                &"🐛 REPRODUCED: RefCell conflict in post-sync isLeader!".into(),
                            );
                            panic!("RefCell borrow conflict in post-sync isLeader: {}", err_str);
                        }
                    }
                }
            }
            Err(e) => {
                let err_str = format!("{:?}", e);
                web_sys::console::log_1(&format!("Write {} failed: {}", i, err_str).into());

                // Check if it's a RefCell borrow error
                if err_str.contains("recursive use") || err_str.contains("borrow") {
                    web_sys::console::log_1(
                        &"🐛 REPRODUCED: RefCell borrow conflict from BroadcastChannel!".into(),
                    );
                    panic!("RefCell borrow conflict detected: {}", err_str);
                }
                panic!("Write failed: {}", err_str);
            }
        }

        // NO delay - keep it rapid to increase chance of conflict
    }

    web_sys::console::log_1(&"All writes completed without RefCell conflicts".into());
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
