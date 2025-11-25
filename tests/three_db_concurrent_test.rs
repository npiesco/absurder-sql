/// Test with three databases like the original failing test
#[cfg(target_arch = "wasm32")]
mod three_db_concurrent_tests {
    use wasm_bindgen_test::*;
    use absurder_sql::{Database, DatabaseConfig};

    wasm_bindgen_test_configure!(run_in_browser);

    #[wasm_bindgen_test]
    async fn test_three_databases_concurrent_writes() {
        console_log::init_with_level(log::Level::Debug).ok();

        let db_name = format!("three_db_{}", js_sys::Date::now() as u64);
        web_sys::console::log_1(&format!("Testing three databases on {}", db_name).into());

        // Create three databases pointing to same file
        let config1 = DatabaseConfig {
            name: db_name.clone(),
            cache_size: Some(10),
            ..Default::default()
        };
        let config2 = DatabaseConfig {
            name: db_name.clone(),
            cache_size: Some(10),
            ..Default::default()
        };
        let config3 = DatabaseConfig {
            name: db_name.clone(),
            cache_size: Some(10),
            ..Default::default()
        };

        let mut db1 = Database::new(config1).await.expect("Failed to create db1");
        let mut db2 = Database::new(config2).await.expect("Failed to create db2");
        let mut db3 = Database::new(config3).await.expect("Failed to create db3");

        web_sys::console::log_1(&"Created all three databases".into());

        // Create table with first database
        db1.execute("CREATE TABLE IF NOT EXISTS test_data (id INTEGER PRIMARY KEY, value TEXT)")
            .await
            .expect("Failed to create table");

        // Sync to ensure table is visible to other databases
        db1.sync().await.expect("Failed to sync after table creation");

        web_sys::console::log_1(&"Created table and synced".into());

        // Test if db2 can see the table
        let test_read = db2.execute("SELECT * FROM test_data").await;
        web_sys::console::log_1(&format!("db2 can see table: {:?}", test_read.is_ok()).into());
        if test_read.is_err() {
            web_sys::console::log_1(&format!("db2 error: {:?}", test_read.err()).into());
        }

        // Test if db3 can see the table
        let test_read3 = db3.execute("SELECT * FROM test_data").await;
        web_sys::console::log_1(&format!("db3 can see table: {:?}", test_read3.is_ok()).into());
        if test_read3.is_err() {
            web_sys::console::log_1(&format!("db3 error: {:?}", test_read3.err()).into());
        }

        // Don't force non-leader writes - let normal leader election work
        web_sys::console::log_1(&"Starting concurrent writes (without forcing non-leader writes)...".into());

        // Execute concurrent INSERTs
        let insert1 = db1.execute("INSERT INTO test_data (value) VALUES ('value1')");
        let insert2 = db2.execute("INSERT INTO test_data (value) VALUES ('value2')");
        let insert3 = db3.execute("INSERT INTO test_data (value) VALUES ('value3')");

        let (r1, r2, r3) = futures::join!(insert1, insert2, insert3);

        web_sys::console::log_1(&format!("Results: db1={:?}, db2={:?}, db3={:?}", r1.is_ok(), r2.is_ok(), r3.is_ok()).into());

        // Check results
        assert!(r1.is_ok(), "db1 insert should succeed: {:?}", r1.err());
        assert!(r2.is_ok(), "db2 insert should succeed: {:?}", r2.err());
        assert!(r3.is_ok(), "db3 insert should succeed: {:?}", r3.err());

        web_sys::console::log_1(&"All concurrent operations succeeded!".into());
    }
}