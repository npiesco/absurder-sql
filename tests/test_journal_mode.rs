/// Test to check journal mode and schema visibility
#[cfg(target_arch = "wasm32")]
mod journal_mode_tests {
    use wasm_bindgen_test::*;
    use absurder_sql::{Database, DatabaseConfig};

    wasm_bindgen_test_configure!(run_in_browser);

    #[wasm_bindgen_test]
    async fn test_journal_mode() {
        console_log::init_with_level(log::Level::Debug).ok();

        let db_name = format!("journal_test_{}", js_sys::Date::now() as u64);

        // Create first database
        let config1 = DatabaseConfig {
            name: db_name.clone(),
            ..Default::default()
        };
        let mut db1 = Database::new(config1).await.expect("Failed to create db1");

        // Check journal mode
        let mode_result = db1.execute("PRAGMA journal_mode").await.expect("Failed to get journal mode");
        web_sys::console::log_1(&format!("db1 journal_mode: {:?}", mode_result).into());

        // Create table
        db1.execute("CREATE TABLE test (id INTEGER)").await.expect("Failed to create table");

        // Force checkpoint if in WAL mode
        let checkpoint = db1.execute("PRAGMA wal_checkpoint(FULL)").await;
        web_sys::console::log_1(&format!("Checkpoint result: {:?}", checkpoint).into());

        // Create second database
        let config2 = DatabaseConfig {
            name: db_name.clone(),
            ..Default::default()
        };
        let mut db2 = Database::new(config2).await.expect("Failed to create db2");

        // Check db2's journal mode
        let mode2_result = db2.execute("PRAGMA journal_mode").await.expect("Failed to get journal mode");
        web_sys::console::log_1(&format!("db2 journal_mode: {:?}", mode2_result).into());

        // Force db2 to reload schema
        let schema_result = db2.execute("PRAGMA schema_version").await;
        web_sys::console::log_1(&format!("db2 schema_version: {:?}", schema_result).into());

        // Try to access table
        let result = db2.execute("SELECT * FROM test").await;
        web_sys::console::log_1(&format!("db2 SELECT result: {:?}", result.is_ok()).into());

        if let Err(e) = &result {
            web_sys::console::log_1(&format!("db2 error: {:?}", e).into());
        }

        assert!(result.is_ok(), "db2 should see table after checkpoint");
    }
}