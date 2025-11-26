#![cfg(target_arch = "wasm32")]

use absurder_sql::DatabaseConfig;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_partial_block_write_with_small_page_size() {
    web_sys::console::log_1(&"=== Testing partial block writes with page_size=1024 ===".into());

    // page_size=1024 means SQLite will write 1024 bytes to a 4096 byte block
    // This is a partial block write and requires read-modify-write
    let config = DatabaseConfig {
        name: "test_partial_write.db".to_string(),
        page_size: Some(1024),
        ..Default::default()
    };

    let mut db = absurder_sql::Database::new(config)
        .await
        .expect("Should create database with page_size=1024");

    // This will trigger partial block writes to block 0
    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT)")
        .await
        .expect("Should create table with partial block writes");

    // This INSERT will also require partial block writes
    let insert_result = db
        .execute("INSERT INTO test (data) VALUES ('test_data')")
        .await;
    if let Err(e) = &insert_result {
        web_sys::console::log_1(&format!("INSERT failed: {:?}", e).into());
    }
    insert_result.expect("Should insert with partial block writes");

    // Verify data persisted correctly
    let result = db
        .execute("SELECT * FROM test")
        .await
        .expect("Should query data");

    let result: serde_json::Value =
        serde_wasm_bindgen::from_value(result).expect("deserialize result");

    assert_eq!(
        result["rows"].as_array().unwrap().len(),
        1,
        "Should have 1 row"
    );

    web_sys::console::log_1(&"Partial block writes work correctly with page_size=1024".into());
}
