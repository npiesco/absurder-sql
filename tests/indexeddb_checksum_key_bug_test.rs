//! Test to demonstrate the IndexedDB checksum key bug
//!
//! BUG: IndexedDB keys include checksums (e.g., "demo.db:1:1018362130")
//! When a block is updated, it creates a NEW key instead of overwriting the old one.
//! Multiple versions accumulate, and on restore, the wrong version may be loaded.
//!
//! This test will FAIL with current code and PASS after fix.

#[cfg(target_arch = "wasm32")]
mod wasm_tests {
    use absurder_sql::{ColumnValue, Database, DatabaseConfig};
    use wasm_bindgen_test::*;

    wasm_bindgen_test_configure!(run_in_browser);

    #[wasm_bindgen_test]
    async fn test_checksum_key_bug_multiple_syncs() {
        console_log::init_with_level(log::Level::Debug).ok();

        let db_name = format!("checksum_bug_{}.db", js_sys::Date::now());

        // Step 1: Create database and insert initial data
        log::info!("=== Step 1: Create table and insert row with value=100 ===");
        let config = DatabaseConfig {
            name: db_name.clone(),
            ..Default::default()
        };
        let mut db = Database::new(config).await.unwrap();

        db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value INTEGER)")
            .await
            .unwrap();
        db.execute("INSERT INTO test (id, value) VALUES (1, 100)")
            .await
            .unwrap();

        // Step 2: Checkpoint and sync (this creates block with checksum A)
        log::info!("=== Step 2: First sync (checksum A) ===");
        db.execute("PRAGMA wal_checkpoint(TRUNCATE)").await.unwrap();
        db.sync().await.unwrap();

        // Step 3: Update the row (this modifies the same block, new checksum B)
        log::info!("=== Step 3: Update row to value=200 ===");
        db.execute("UPDATE test SET value = 200 WHERE id = 1")
            .await
            .unwrap();

        // Step 4: Checkpoint and sync again (this creates ANOTHER block with checksum B)
        // BUG: This creates a NEW IndexedDB key instead of overwriting the old one
        log::info!("=== Step 4: Second sync (checksum B) ===");
        db.execute("PRAGMA wal_checkpoint(TRUNCATE)").await.unwrap();
        db.sync().await.unwrap();

        // Verify data is correct before close
        let query_js = db
            .execute("SELECT value FROM test WHERE id = 1")
            .await
            .unwrap();
        let result: absurder_sql::QueryResult = serde_wasm_bindgen::from_value(query_js).unwrap();
        let value_before = match &result.rows[0].values[0] {
            ColumnValue::Integer(n) => *n,
            _ => panic!("Expected integer"),
        };
        assert_eq!(value_before, 200, "Value should be 200 before close");

        // Step 5: Close database
        log::info!("=== Step 5: Close database ===");
        db.close().await.unwrap();

        // Step 6: Reopen database (this triggers restore from IndexedDB)
        // BUG: Multiple keys exist in IndexedDB (demo.db:1:checksumA and demo.db:1:checksumB)
        // Restore iterates by lexicographic order and keeps LAST, which may be wrong version
        log::info!("=== Step 6: Reopen database (restore from IndexedDB) ===");
        let config2 = DatabaseConfig {
            name: db_name.clone(),
            ..Default::default()
        };
        let mut db2 = Database::new(config2).await.unwrap();

        // Step 7: Query the data - THIS IS WHERE THE BUG MANIFESTS
        log::info!("=== Step 7: Query data after reopen ===");
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

        // THIS ASSERTION WILL FAIL WITH THE BUG
        // Expected: 200 (latest value)
        // Actual: 100 (old value) or corruption error
        assert_eq!(
            value_after, 200,
            "Value should be 200 after reopen, but got {}. This indicates the wrong block version was restored from IndexedDB.",
            value_after
        );

        // Cleanup
        db2.close().await.unwrap();

        log::info!("=== Test passed! ===");
    }

    #[wasm_bindgen_test]
    async fn test_checksum_key_bug_many_updates() {
        console_log::init_with_level(log::Level::Debug).ok();

        let db_name = format!("checksum_many_{}.db", js_sys::Date::now());

        let config = DatabaseConfig {
            name: db_name.clone(),
            ..Default::default()
        };
        let mut db = Database::new(config).await.unwrap();

        db.execute("CREATE TABLE counter (id INTEGER PRIMARY KEY, count INTEGER)")
            .await
            .unwrap();
        db.execute("INSERT INTO counter (id, count) VALUES (1, 0)")
            .await
            .unwrap();

        // Perform many updates with syncs
        // Each update creates a NEW IndexedDB key with different checksum
        // BUG: IndexedDB accumulates many versions of the same block
        for i in 1..=5 {
            log::info!("=== Update {} ===", i);
            db.execute(&format!("UPDATE counter SET count = {} WHERE id = 1", i))
                .await
                .unwrap();
            db.execute("PRAGMA wal_checkpoint(TRUNCATE)").await.unwrap();
            db.sync().await.unwrap();
        }

        // Verify final value is 5
        let query_js = db
            .execute("SELECT count FROM counter WHERE id = 1")
            .await
            .unwrap();
        let result: absurder_sql::QueryResult = serde_wasm_bindgen::from_value(query_js).unwrap();
        let count_before = match &result.rows[0].values[0] {
            ColumnValue::Integer(n) => *n,
            _ => panic!("Expected integer"),
        };
        assert_eq!(count_before, 5);

        db.close().await.unwrap();

        // Reopen and verify
        let config2 = DatabaseConfig {
            name: db_name.clone(),
            ..Default::default()
        };
        let mut db2 = Database::new(config2).await.unwrap();

        let query_js = db2.execute("SELECT count FROM counter WHERE id = 1").await;
        assert!(query_js.is_ok(), "Query failed: {:?}", query_js.err());

        let result: absurder_sql::QueryResult =
            serde_wasm_bindgen::from_value(query_js.unwrap()).unwrap();
        let count_after = match &result.rows[0].values[0] {
            ColumnValue::Integer(n) => *n,
            _ => panic!("Expected integer"),
        };

        // THIS WILL FAIL - might get 0, 1, 2, 3, 4, or 5 depending on lexicographic order
        assert_eq!(
            count_after, 5,
            "Count should be 5 after reopen, but got {}. IndexedDB has {} versions of the same block!",
            count_after, 5
        );

        db2.close().await.unwrap();
    }
}
