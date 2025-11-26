/// Debug test to understand concurrent storage issues
#[cfg(target_arch = "wasm32")]
mod debug_concurrent {
    use absurder_sql::{Database, DatabaseConfig};
    use wasm_bindgen_test::*;

    wasm_bindgen_test_configure!(run_in_browser);

    #[wasm_bindgen_test]
    async fn test_debug_concurrent() {
        console_log::init_with_level(log::Level::Debug).ok();

        let db_name = format!("debug_concurrent_{}", js_sys::Date::now() as u64);
        web_sys::console::log_1(&format!("=== Testing with db_name: {} ===", db_name).into());

        // Create all databases first
        web_sys::console::log_1(&"Creating three databases...".into());

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

        web_sys::console::log_1(&"All databases created".into());

        // Create table with db1
        web_sys::console::log_1(&"db1: Creating table...".into());
        db1.execute("CREATE TABLE test_table (id INTEGER)")
            .await
            .expect("Failed to create table");
        web_sys::console::log_1(&"db1: Table created".into());

        // Check what db1 sees
        let db1_check = db1
            .execute("SELECT name FROM sqlite_master WHERE type='table'")
            .await;
        web_sys::console::log_1(&format!("db1 sees tables: {:?}", db1_check).into());

        // Force WAL checkpoint
        web_sys::console::log_1(&"db1: Forcing WAL checkpoint...".into());
        let checkpoint = db1.execute("PRAGMA wal_checkpoint(FULL)").await;
        web_sys::console::log_1(&format!("Checkpoint result: {:?}", checkpoint).into());

        // Force sync
        web_sys::console::log_1(&"db1: Syncing...".into());
        db1.sync().await.expect("Failed to sync");
        web_sys::console::log_1(&"db1: Sync complete".into());

        // Check what db2 sees
        web_sys::console::log_1(&"db2: Checking tables...".into());
        let db2_check = db2
            .execute("SELECT name FROM sqlite_master WHERE type='table'")
            .await;
        web_sys::console::log_1(&format!("db2 sees tables: {:?}", db2_check).into());

        // Try to select from table with db2
        web_sys::console::log_1(&"db2: Trying SELECT...".into());
        let result2 = db2.execute("SELECT * FROM test_table").await;
        web_sys::console::log_1(&format!("db2 SELECT result: {:?}", result2.is_ok()).into());
        if let Err(e) = &result2 {
            web_sys::console::log_1(&format!("db2 error: {:?}", e).into());
        }

        // Check what db3 sees
        web_sys::console::log_1(&"db3: Checking tables...".into());
        let db3_check = db3
            .execute("SELECT name FROM sqlite_master WHERE type='table'")
            .await;
        web_sys::console::log_1(&format!("db3 sees tables: {:?}", db3_check).into());

        assert!(result2.is_ok(), "db2 should see table");
    }
}
