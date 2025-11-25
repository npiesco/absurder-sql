/**
 * TDD Test: Concurrent operations should work without errors
 *
 * This test verifies that multiple Database instances can perform
 * concurrent operations on the same database without failing.
 */

#[cfg(target_arch = "wasm32")]
mod concurrent_operations_tests {
    use wasm_bindgen_test::*;
    use absurder_sql::{Database, DatabaseConfig};

    wasm_bindgen_test_configure!(run_in_browser);

    /// TEST SPECIFICATION:
    /// Multiple Database instances should be able to perform concurrent
    /// INSERT operations without errors. The system should handle
    /// reentrancy gracefully by queuing or retrying operations.
    #[wasm_bindgen_test]
    async fn test_concurrent_inserts_should_succeed() {
        console_log::init_with_level(log::Level::Debug).ok();

        let db_name = format!("concurrent_fix_{}", js_sys::Date::now() as u64);
        web_sys::console::log_1(&format!("Testing concurrent operations on {}", db_name).into());

        // Create 3 Database instances with same database name
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

        // Create table
        db1.execute("CREATE TABLE IF NOT EXISTS test_data (id INTEGER PRIMARY KEY, value TEXT)")
            .await
            .expect("Failed to create table");

        // Execute concurrent INSERTs - THIS MUST SUCCEED
        let insert1 = db1.execute("INSERT INTO test_data (value) VALUES ('value1')");
        let insert2 = db2.execute("INSERT INTO test_data (value) VALUES ('value2')");
        let insert3 = db3.execute("INSERT INTO test_data (value) VALUES ('value3')");

        // All operations MUST succeed
        let (r1, r2, r3) = futures::join!(insert1, insert2, insert3);

        // ASSERTIONS: All must pass
        assert!(r1.is_ok(), "db1 insert MUST succeed but failed: {:?}", r1.err());
        assert!(r2.is_ok(), "db2 insert MUST succeed but failed: {:?}", r2.err());
        assert!(r3.is_ok(), "db3 insert MUST succeed but failed: {:?}", r3.err());

        // Verify data was actually inserted
        // For now just check operations succeeded - we can enhance verification later
        web_sys::console::log_1(&format!("All inserts completed successfully").into());

        web_sys::console::log_1(&format!("All concurrent operations succeeded!").into());
    }

    /// TEST SPECIFICATION:
    /// Concurrent reads should never fail due to reentrancy
    #[wasm_bindgen_test]
    async fn test_concurrent_reads_should_succeed() {
        console_log::init_with_level(log::Level::Debug).ok();

        let db_name = format!("concurrent_read_{}", js_sys::Date::now() as u64);

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

        // Setup data
        db1.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)")
            .await
            .expect("Failed to create table");
        db1.execute("INSERT INTO users (name) VALUES ('Alice'), ('Bob'), ('Charlie')")
            .await
            .expect("Failed to insert data");

        // Concurrent reads - MUST ALL SUCCEED
        let read1 = db1.execute("SELECT * FROM users");
        let read2 = db2.execute("SELECT * FROM users");
        let read3 = db3.execute("SELECT * FROM users");

        let (r1, r2, r3) = futures::join!(read1, read2, read3);

        assert!(r1.is_ok(), "db1 read MUST succeed but failed: {:?}", r1.err());
        assert!(r2.is_ok(), "db2 read MUST succeed but failed: {:?}", r2.err());
        assert!(r3.is_ok(), "db3 read MUST succeed but failed: {:?}", r3.err());

        web_sys::console::log_1(&format!("All concurrent reads succeeded!").into());
    }
}