/// Debug test to verify BlockStorage sharing
#[cfg(target_arch = "wasm32")]
mod debug_storage_tests {
    use wasm_bindgen_test::*;
    use absurder_sql::{Database, DatabaseConfig};

    wasm_bindgen_test_configure!(run_in_browser);

    #[wasm_bindgen_test]
    async fn test_storage_sharing() {
        console_log::init_with_level(log::Level::Debug).ok();

        let db_name = format!("debug_storage_{}", js_sys::Date::now() as u64);
        web_sys::console::log_1(&format!("Testing storage sharing for {}", db_name).into());

        // Create first database
        let config1 = DatabaseConfig {
            name: db_name.clone(),
            ..Default::default()
        };
        let mut db1 = Database::new(config1).await.expect("Failed to create db1");
        web_sys::console::log_1(&"Created db1".into());

        // Create table with db1
        db1.execute("CREATE TABLE test (id INTEGER)")
            .await
            .expect("Failed to create table");
        web_sys::console::log_1(&"Created table with db1".into());

        // Explicitly sync to ensure data is in storage
        db1.sync().await.expect("Failed to sync db1");
        web_sys::console::log_1(&"Synced db1".into());

        // Create second database AFTER table creation and sync
        let config2 = DatabaseConfig {
            name: db_name.clone(),
            ..Default::default()
        };
        let mut db2 = Database::new(config2).await.expect("Failed to create db2");
        web_sys::console::log_1(&"Created db2".into());

        // Check if db2 can see the table
        let result = db2.execute("SELECT * FROM test").await;
        web_sys::console::log_1(&format!("db2 SELECT result: {:?}", result.is_ok()).into());

        if let Err(e) = &result {
            web_sys::console::log_1(&format!("db2 error: {:?}", e).into());
        }

        assert!(result.is_ok(), "db2 should see table created by db1 after sync");
    }
}