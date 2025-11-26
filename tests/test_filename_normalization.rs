/// Test to debug filename normalization issues
#[cfg(target_arch = "wasm32")]
mod filename_tests {
    use absurder_sql::{Database, DatabaseConfig};
    use wasm_bindgen_test::*;

    wasm_bindgen_test_configure!(run_in_browser);

    #[wasm_bindgen_test]
    async fn test_filename_normalization() {
        console_log::init_with_level(log::Level::Debug).ok();

        // Test with a simple name (no .db extension)
        let db_name = format!("test_{}", js_sys::Date::now() as u64);
        web_sys::console::log_1(&format!("Testing with db_name: {}", db_name).into());

        // Create three databases with the same name
        let config1 = DatabaseConfig {
            name: db_name.clone(),
            ..Default::default()
        };
        let config2 = DatabaseConfig {
            name: db_name.clone(),
            ..Default::default()
        };
        let config3 = DatabaseConfig {
            name: db_name.clone(),
            ..Default::default()
        };

        let mut db1 = Database::new(config1).await.expect("Failed to create db1");
        let mut db2 = Database::new(config2).await.expect("Failed to create db2");
        let mut db3 = Database::new(config3).await.expect("Failed to create db3");

        web_sys::console::log_1(&"All three databases created".into());

        // Create table with db1 and sync immediately
        db1.execute("CREATE TABLE test_table (id INTEGER)")
            .await
            .expect("Failed to create table");

        web_sys::console::log_1(&"Table created with db1".into());

        // Sync db1 to ensure data is persisted
        db1.sync().await.expect("Failed to sync db1");
        web_sys::console::log_1(&"db1 synced".into());

        // Small delay to ensure sync completes
        use wasm_bindgen_futures::JsFuture;
        let promise = js_sys::Promise::new(&mut |resolve, _| {
            web_sys::window()
                .unwrap()
                .set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, 100)
                .unwrap();
        });
        JsFuture::from(promise).await.ok();

        // Try to read from db2
        let result2 = db2.execute("SELECT * FROM test_table").await;
        web_sys::console::log_1(&format!("db2 SELECT result: {:?}", result2.is_ok()).into());
        if let Err(e) = &result2 {
            web_sys::console::log_1(&format!("db2 error: {:?}", e).into());
        }

        // Try to read from db3
        let result3 = db3.execute("SELECT * FROM test_table").await;
        web_sys::console::log_1(&format!("db3 SELECT result: {:?}", result3.is_ok()).into());
        if let Err(e) = &result3 {
            web_sys::console::log_1(&format!("db3 error: {:?}", e).into());
        }

        assert!(result2.is_ok(), "db2 should see table after sync");
        assert!(result3.is_ok(), "db3 should see table after sync");
    }
}
