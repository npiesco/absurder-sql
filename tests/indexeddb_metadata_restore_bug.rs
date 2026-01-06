//! Test to demonstrate IndexedDB metadata restoration bugs
//!
//! BUG 1: Commit marker format inconsistency
//! - persist uses "db_name:commit_marker" (colon)
//! - delete_all uses "db_name_commit_marker" (underscore)
//!
//! BUG 2: Metadata restore expects old 3-part keys
//! - Restore code checks `parts.len() >= 3` for "db_name:block_id:version"
//! - But current keys are "db_name:block_id" (only 2 parts)
//! - Result: metadata is never restored, causing potential issues
//!
//! This test will FAIL with current code and PASS after fix.

#[cfg(target_arch = "wasm32")]
mod wasm_tests {
    use absurder_sql::{ColumnValue, Database, DatabaseConfig};
    use wasm_bindgen_test::*;

    wasm_bindgen_test_configure!(run_in_browser);

    /// Test that metadata is properly restored after close/reopen
    /// This specifically tests the 2-part key parsing bug in restore_blocks_from_indexeddb
    #[wasm_bindgen_test]
    async fn test_metadata_restore_with_two_part_keys() {
        console_log::init_with_level(log::Level::Debug).ok();

        let db_name = format!("metadata_restore_bug_{}.db", js_sys::Date::now());

        web_sys::console::log_1(
            &format!(
                "=== Starting metadata restore test with db: {} ===",
                db_name
            )
            .into(),
        );

        // Step 1: Create database, insert data, sync multiple times
        // Each sync updates metadata with new version numbers
        let config = DatabaseConfig {
            name: db_name.clone(),
            ..Default::default()
        };
        let mut db = Database::new(config).await.unwrap();

        db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value INTEGER)")
            .await
            .unwrap();

        // Do multiple updates and syncs to exercise metadata versioning
        for i in 1..=5 {
            db.execute(&format!(
                "INSERT OR REPLACE INTO test (id, value) VALUES (1, {})",
                i * 100
            ))
            .await
            .unwrap();
            db.execute("PRAGMA wal_checkpoint(TRUNCATE)").await.unwrap();
            db.sync().await.unwrap();
            web_sys::console::log_1(&format!("=== Sync {} complete ===", i).into());
        }

        // Verify value is 500 before close
        let query_js = db
            .execute("SELECT value FROM test WHERE id = 1")
            .await
            .unwrap();
        let result: absurder_sql::QueryResult = serde_wasm_bindgen::from_value(query_js).unwrap();
        let value_before = match &result.rows[0].values[0] {
            ColumnValue::Integer(n) => *n,
            _ => panic!("Expected integer"),
        };
        assert_eq!(value_before, 500, "Value should be 500 before close");

        // Close database
        web_sys::console::log_1(&"=== Closing database ===".into());
        db.close().await.unwrap();

        // Reopen database - this triggers restore_from_indexeddb
        // BUG: Metadata restoration fails because it expects 3-part keys but we have 2-part keys
        web_sys::console::log_1(&"=== Reopening database ===".into());
        let config2 = DatabaseConfig {
            name: db_name.clone(),
            ..Default::default()
        };
        let mut db2 = Database::new(config2).await.unwrap();

        // Query the data
        let query_js = db2.execute("SELECT value FROM test WHERE id = 1").await;

        assert!(
            query_js.is_ok(),
            "Query failed after reopen: {:?}",
            query_js.err()
        );

        let result: absurder_sql::QueryResult =
            serde_wasm_bindgen::from_value(query_js.unwrap()).unwrap();
        let value_after = match &result.rows[0].values[0] {
            ColumnValue::Integer(n) => *n,
            _ => panic!("Expected integer"),
        };

        assert_eq!(
            value_after, 500,
            "Value should be 500 after reopen, but got {}. Metadata may not have been restored correctly.",
            value_after
        );

        db2.close().await.unwrap();
        web_sys::console::log_1(&"=== Test passed! ===".into());
    }

    /// Test that exercises the full persistence cycle multiple times
    /// to expose any race conditions or state inconsistencies
    #[wasm_bindgen_test]
    async fn test_multiple_close_reopen_cycles() {
        console_log::init_with_level(log::Level::Debug).ok();

        let db_name = format!("multi_cycle_bug_{}.db", js_sys::Date::now());

        web_sys::console::log_1(
            &format!("=== Starting multi-cycle test with db: {} ===", db_name).into(),
        );

        // Cycle 1: Create and populate
        {
            let config = DatabaseConfig {
                name: db_name.clone(),
                ..Default::default()
            };
            let mut db = Database::new(config).await.unwrap();

            db.execute("CREATE TABLE counter (id INTEGER PRIMARY KEY, count INTEGER)")
                .await
                .unwrap();
            db.execute("INSERT INTO counter (id, count) VALUES (1, 10)")
                .await
                .unwrap();
            db.execute("PRAGMA wal_checkpoint(TRUNCATE)").await.unwrap();
            db.sync().await.unwrap();

            web_sys::console::log_1(&"=== Cycle 1: Created table, count=10 ===".into());
            db.close().await.unwrap();
        }

        // Cycle 2: Update
        {
            let config = DatabaseConfig {
                name: db_name.clone(),
                ..Default::default()
            };
            let mut db = Database::new(config).await.unwrap();

            // Verify we can read the data
            let query_js = db.execute("SELECT count FROM counter WHERE id = 1").await;
            assert!(
                query_js.is_ok(),
                "Cycle 2 read failed: {:?}",
                query_js.err()
            );

            let result: absurder_sql::QueryResult =
                serde_wasm_bindgen::from_value(query_js.unwrap()).unwrap();
            let count = match &result.rows[0].values[0] {
                ColumnValue::Integer(n) => *n,
                _ => panic!("Expected integer"),
            };
            assert_eq!(count, 10, "Cycle 2: Expected count=10, got {}", count);

            // Update
            db.execute("UPDATE counter SET count = 20 WHERE id = 1")
                .await
                .unwrap();
            db.execute("PRAGMA wal_checkpoint(TRUNCATE)").await.unwrap();
            db.sync().await.unwrap();

            web_sys::console::log_1(&"=== Cycle 2: Updated count=20 ===".into());
            db.close().await.unwrap();
        }

        // Cycle 3: Update again
        {
            let config = DatabaseConfig {
                name: db_name.clone(),
                ..Default::default()
            };
            let mut db = Database::new(config).await.unwrap();

            let query_js = db.execute("SELECT count FROM counter WHERE id = 1").await;
            assert!(
                query_js.is_ok(),
                "Cycle 3 read failed: {:?}",
                query_js.err()
            );

            let result: absurder_sql::QueryResult =
                serde_wasm_bindgen::from_value(query_js.unwrap()).unwrap();
            let count = match &result.rows[0].values[0] {
                ColumnValue::Integer(n) => *n,
                _ => panic!("Expected integer"),
            };
            assert_eq!(count, 20, "Cycle 3: Expected count=20, got {}", count);

            db.execute("UPDATE counter SET count = 30 WHERE id = 1")
                .await
                .unwrap();
            db.execute("PRAGMA wal_checkpoint(TRUNCATE)").await.unwrap();
            db.sync().await.unwrap();

            web_sys::console::log_1(&"=== Cycle 3: Updated count=30 ===".into());
            db.close().await.unwrap();
        }

        // Cycle 4: Final verification
        {
            let config = DatabaseConfig {
                name: db_name.clone(),
                ..Default::default()
            };
            let mut db = Database::new(config).await.unwrap();

            let query_js = db.execute("SELECT count FROM counter WHERE id = 1").await;
            assert!(
                query_js.is_ok(),
                "Cycle 4 read failed: {:?}",
                query_js.err()
            );

            let result: absurder_sql::QueryResult =
                serde_wasm_bindgen::from_value(query_js.unwrap()).unwrap();
            let count = match &result.rows[0].values[0] {
                ColumnValue::Integer(n) => *n,
                _ => panic!("Expected integer"),
            };

            assert_eq!(
                count, 30,
                "Cycle 4: Expected count=30, got {}. Data corruption across cycles!",
                count
            );

            web_sys::console::log_1(&"=== Cycle 4: Verified count=30 ===".into());
            db.close().await.unwrap();
        }

        web_sys::console::log_1(&"=== Multi-cycle test passed! ===".into());
    }

    /// Test rapid sync cycles to expose timing issues
    #[wasm_bindgen_test]
    async fn test_rapid_sync_cycles() {
        console_log::init_with_level(log::Level::Debug).ok();

        let db_name = format!("rapid_sync_bug_{}.db", js_sys::Date::now());

        let config = DatabaseConfig {
            name: db_name.clone(),
            ..Default::default()
        };
        let mut db = Database::new(config).await.unwrap();

        db.execute("CREATE TABLE rapid (id INTEGER PRIMARY KEY, val INTEGER)")
            .await
            .unwrap();

        // Rapid fire updates and syncs
        for i in 1..=10 {
            db.execute(&format!(
                "INSERT OR REPLACE INTO rapid (id, val) VALUES (1, {})",
                i
            ))
            .await
            .unwrap();
            db.execute("PRAGMA wal_checkpoint(TRUNCATE)").await.unwrap();
            db.sync().await.unwrap();
        }

        // Verify final value
        let query_js = db
            .execute("SELECT val FROM rapid WHERE id = 1")
            .await
            .unwrap();
        let result: absurder_sql::QueryResult = serde_wasm_bindgen::from_value(query_js).unwrap();
        let val_before = match &result.rows[0].values[0] {
            ColumnValue::Integer(n) => *n,
            _ => panic!("Expected integer"),
        };
        assert_eq!(val_before, 10);

        db.close().await.unwrap();

        // Reopen and verify
        let config2 = DatabaseConfig {
            name: db_name.clone(),
            ..Default::default()
        };
        let mut db2 = Database::new(config2).await.unwrap();

        let query_js = db2.execute("SELECT val FROM rapid WHERE id = 1").await;
        assert!(query_js.is_ok(), "Query failed: {:?}", query_js.err());

        let result: absurder_sql::QueryResult =
            serde_wasm_bindgen::from_value(query_js.unwrap()).unwrap();
        let val_after = match &result.rows[0].values[0] {
            ColumnValue::Integer(n) => *n,
            _ => panic!("Expected integer"),
        };

        assert_eq!(
            val_after, 10,
            "Expected val=10 after rapid syncs and reopen, got {}",
            val_after
        );

        db2.close().await.unwrap();
    }
}
