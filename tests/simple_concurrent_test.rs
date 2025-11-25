/// Simple test to verify concurrent database operations work
#[cfg(target_arch = "wasm32")]
mod simple_concurrent_tests {
    use wasm_bindgen_test::*;
    use absurder_sql::{Database, DatabaseConfig};

    wasm_bindgen_test_configure!(run_in_browser);

    #[wasm_bindgen_test]
    async fn test_two_databases_same_file() {
        console_log::init_with_level(log::Level::Debug).ok();

        let db_name = format!("simple_test_{}", js_sys::Date::now() as u64);
        web_sys::console::log_1(&format!("Testing two databases on {}", db_name).into());

        // Create first database
        let config1 = DatabaseConfig {
            name: db_name.clone(),
            ..Default::default()
        };
        let mut db1 = Database::new(config1).await.expect("Failed to create db1");
        web_sys::console::log_1(&"Created db1".into());

        // Create table with first database
        db1.execute("CREATE TABLE test (id INTEGER)")
            .await
            .expect("Failed to create table");
        web_sys::console::log_1(&"Created table with db1".into());

        // Create second database pointing to same file
        let config2 = DatabaseConfig {
            name: db_name.clone(),
            ..Default::default()
        };
        let mut db2 = Database::new(config2).await.expect("Failed to create db2");
        web_sys::console::log_1(&"Created db2".into());

        // Try to read from second database
        let result = db2.execute("SELECT * FROM test").await;
        web_sys::console::log_1(&format!("db2 SELECT result: {:?}", result.is_ok()).into());

        assert!(result.is_ok(), "db2 should be able to read table created by db1");

        // Now try concurrent reads
        web_sys::console::log_1(&"Starting concurrent reads...".into());
        let read1 = db1.execute("SELECT * FROM test");
        let read2 = db2.execute("SELECT * FROM test");

        let (r1, r2) = futures::join!(read1, read2);

        web_sys::console::log_1(&format!("Concurrent read results: db1={:?}, db2={:?}", r1.is_ok(), r2.is_ok()).into());

        assert!(r1.is_ok(), "db1 concurrent read should succeed");
        assert!(r2.is_ok(), "db2 concurrent read should succeed");

        // Test concurrent writes
        web_sys::console::log_1(&"Starting concurrent writes...".into());

        // Need to check if non-leader writes are allowed
        db1.allow_non_leader_writes(true).await.expect("Failed to allow non-leader writes for db1");
        db2.allow_non_leader_writes(true).await.expect("Failed to allow non-leader writes for db2");

        let write1 = db1.execute("INSERT INTO test VALUES (1)");
        let write2 = db2.execute("INSERT INTO test VALUES (2)");

        let (w1, w2) = futures::join!(write1, write2);

        web_sys::console::log_1(&format!("Concurrent write results: db1={:?}, db2={:?}", w1.is_ok(), w2.is_ok()).into());

        assert!(w1.is_ok(), "db1 write should succeed: {:?}", w1.err());
        assert!(w2.is_ok(), "db2 write should succeed: {:?}", w2.err());

        web_sys::console::log_1(&"Test passed!".into());
    }
}