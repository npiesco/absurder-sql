//! Test to reproduce the VFS persistence corruption bug
//!
//! This test reproduces the issue reported in GitHub where:
//! 1. User creates table and inserts data
//! 2. Checkpoints WAL and syncs to IndexedDB
//! 3. Refreshes page (simulated by closing and reopening DB)
//! 4. Tries to query data
//! 5. Gets "database disk image is malformed" error
//!
//! Expected: Data persists correctly across close/reopen
//! Actual: Database corruption after reopen

#[cfg(target_arch = "wasm32")]
mod wasm_tests {
    use absurder_sql::{ColumnValue, Database, DatabaseConfig};
    use wasm_bindgen_test::*;

    wasm_bindgen_test_configure!(run_in_browser);

    #[wasm_bindgen_test]
    async fn test_persistence_corruption_bug() {
        console_log::init_with_level(log::Level::Debug).ok();

        let db_name = format!("test_corruption_{}.db", js_sys::Date::now());

        // Step 1: Create database and table
        log::info!("=== Step 1: Creating database and table ===");
        let config = DatabaseConfig {
            name: db_name.clone(),
            ..Default::default()
        };
        let mut db = Database::new(config).await.unwrap();

        let create_result = db
            .execute("CREATE TABLE test_users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)")
            .await;
        assert!(
            create_result.is_ok(),
            "CREATE TABLE failed: {:?}",
            create_result.err()
        );

        // Step 2: Insert data
        log::info!("=== Step 2: Inserting data ===");
        let insert_result = db
            .execute("INSERT INTO test_users (name, email) VALUES ('Alice', 'alice@test.com')")
            .await;
        assert!(
            insert_result.is_ok(),
            "INSERT failed: {:?}",
            insert_result.err()
        );

        let insert_result2 = db
            .execute("INSERT INTO test_users (name, email) VALUES ('Bob', 'bob@test.com')")
            .await;
        assert!(
            insert_result2.is_ok(),
            "INSERT 2 failed: {:?}",
            insert_result2.err()
        );

        // Step 3: Verify data is there before checkpoint
        log::info!("=== Step 3: Verifying data before checkpoint ===");
        let query_js = db
            .execute("SELECT * FROM test_users ORDER BY id")
            .await
            .unwrap();
        let query_result: absurder_sql::QueryResult =
            serde_wasm_bindgen::from_value(query_js).unwrap();
        assert_eq!(
            query_result.rows.len(),
            2,
            "Should have 2 rows before checkpoint"
        );

        // Step 4: Checkpoint WAL (this is what the demo does)
        log::info!("=== Step 4: Checkpointing WAL ===");
        let checkpoint_result = db.execute("PRAGMA wal_checkpoint(TRUNCATE)").await;
        assert!(
            checkpoint_result.is_ok(),
            "WAL checkpoint failed: {:?}",
            checkpoint_result.err()
        );

        // Step 5: Sync to IndexedDB (this is what the demo does)
        log::info!("=== Step 5: Syncing to IndexedDB ===");
        let sync_result = db.sync().await;
        assert!(sync_result.is_ok(), "Sync failed: {:?}", sync_result.err());

        // Step 6: Close database (simulates page unload)
        log::info!("=== Step 6: Closing database ===");
        db.close().await.unwrap();

        // Step 7: Reopen database (simulates page refresh/reload)
        log::info!("=== Step 7: Reopening database (simulating refresh) ===");
        let config2 = DatabaseConfig {
            name: db_name.clone(),
            ..Default::default()
        };
        let mut db2 = Database::new(config2).await.unwrap();

        // Step 8: Try to query the data (THIS IS WHERE IT FAILS WITH CORRUPTION)
        log::info!("=== Step 8: Querying data after reopen ===");
        let query_js = db2.execute("SELECT * FROM test_users ORDER BY id").await;

        // This assertion FAILS with "database disk image is malformed"
        assert!(
            query_js.is_ok(),
            "Query after reopen failed with corruption: {:?}",
            query_js.err()
        );

        let query_result: absurder_sql::QueryResult =
            serde_wasm_bindgen::from_value(query_js.unwrap()).unwrap();
        assert_eq!(
            query_result.rows.len(),
            2,
            "Should have 2 rows after reopen"
        );

        // Verify the actual data
        assert_eq!(query_result.columns, vec!["id", "name", "email"]);
        let first_row = &query_result.rows[0];
        match &first_row.values[1] {
            ColumnValue::Text(name) => assert_eq!(name, "Alice"),
            _ => panic!("Expected text value for name"),
        }

        // Cleanup
        db2.close().await.unwrap();

        log::info!("=== Test passed! No corruption ===");
    }

    #[wasm_bindgen_test]
    async fn test_sync_captures_all_blocks() {
        console_log::init_with_level(log::Level::Debug).ok();

        let db_name = format!("test_blocks_{}.db", js_sys::Date::now());

        let config = DatabaseConfig {
            name: db_name.clone(),
            ..Default::default()
        };
        let mut db = Database::new(config).await.unwrap();

        // Create table
        db.execute("CREATE TABLE test_data (id INTEGER PRIMARY KEY, data TEXT)")
            .await
            .unwrap();

        // Insert enough data to span multiple blocks
        for i in 0..100 {
            let sql = format!(
                "INSERT INTO test_data (data) VALUES ('Row {} with some data to fill blocks')",
                i
            );
            db.execute(&sql).await.unwrap();
        }

        // Checkpoint and sync
        db.execute("PRAGMA wal_checkpoint(TRUNCATE)").await.unwrap();
        db.sync().await.unwrap();

        // The sync should have captured MORE than just block 0
        // This is where we need to verify that multiple blocks are synced
        // (This requires access to internals - for now we verify by querying after reopen)

        db.close().await.unwrap();

        // Reopen and query
        let config2 = DatabaseConfig {
            name: db_name.clone(),
            ..Default::default()
        };
        let mut db2 = Database::new(config2).await.unwrap();
        let result_js = db2.execute("SELECT COUNT(*) FROM test_data").await;

        assert!(
            result_js.is_ok(),
            "Query failed after reopen: {:?}",
            result_js.err()
        );

        let result: absurder_sql::QueryResult =
            serde_wasm_bindgen::from_value(result_js.unwrap()).unwrap();
        let count = match &result.rows[0].values[0] {
            ColumnValue::Integer(n) => *n,
            _ => panic!("Expected integer count"),
        };

        assert_eq!(count, 100, "Should have all 100 rows after reopen");

        db2.close().await.unwrap();
    }
}
