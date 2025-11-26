//! Isolated test for cross-connection persistence
//!
//! Tests that when a Database is closed and synced, and then a new Database
//! instance is created with the same name, the schema persists.

#![cfg(target_arch = "wasm32")]

use absurder_sql::{Database, DatabaseConfig};
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_cross_connection_simple() {
    let db_name = "cross_conn_test";

    // First connection: create schema
    {
        let mut config = DatabaseConfig::default();
        config.name = db_name.to_string();
        let mut db = Database::new(config).await.unwrap();

        db.execute("CREATE TABLE test (id INTEGER)").await.unwrap();
        db.execute("INSERT INTO test VALUES (1)").await.unwrap();

        db.close().await.unwrap();
        web_sys::console::log_1(&"First connection closed".into());
    }

    // Wait for IndexedDB
    let promise = js_sys::Promise::new(&mut |resolve, _reject| {
        web_sys::window()
            .unwrap()
            .set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, 2000)
            .unwrap();
    });
    wasm_bindgen_futures::JsFuture::from(promise).await.unwrap();

    // Second connection: query schema
    {
        let mut config = DatabaseConfig::default();
        config.name = db_name.to_string();
        let mut db = Database::new(config).await.unwrap();

        let result = db.execute("SELECT * FROM test").await;

        match result {
            Ok(_) => web_sys::console::log_1(&"TEST PASSED: Schema persisted!".into()),
            Err(e) => {
                web_sys::console::log_1(&format!("TEST FAILED: {:?}", e).into());
                panic!("Schema did not persist: {:?}", e);
            }
        }

        db.close().await.unwrap();
    }
}
