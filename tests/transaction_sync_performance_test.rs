/// Test to verify that sync operations are deferred during transactions
/// This test SHOULD FAIL initially, proving the performance issue
#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
#[cfg(test)]
mod transaction_sync_tests {
    use absurder_sql::{DatabaseConfig, SqliteIndexedDB};
    use serial_test::serial;
    use std::time::Instant;

    #[tokio::test]
    #[serial]
    async fn test_transaction_should_defer_sync_operations() {
        // This test proves the bug: syncs happen after EVERY insert in a transaction
        // Expected: sync only on COMMIT
        // Actual: sync after each INSERT

        let config = DatabaseConfig {
            name: "test_transaction_sync.db".to_string(),
            ..Default::default()
        };

        let mut db = SqliteIndexedDB::new(config).await.unwrap();

        // CoRT: Drop then Create for clean test state
        db.execute("DROP TABLE IF EXISTS test").await.unwrap();
        db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)")
            .await
            .unwrap();

        // Start transaction
        db.execute("BEGIN TRANSACTION").await.unwrap();

        // Measure time for 100 inserts in transaction
        let start = Instant::now();
        for i in 1..=100 {
            db.execute(&format!("INSERT INTO test VALUES ({}, 'value_{}')", i, i))
                .await
                .unwrap();
        }
        let insert_duration = start.elapsed();

        // Commit
        db.execute("COMMIT").await.unwrap();

        println!("100 inserts in transaction took: {:?}", insert_duration);

        // ASSERTION: If syncing after every insert, this will be VERY slow (> 500ms)
        // If syncing only on commit, should be fast (< 50ms)
        assert!(
            insert_duration.as_millis() < 50,
            "Transaction with 100 inserts took {}ms - sync operations are NOT being deferred! \
             Expected < 50ms if sync only happens on COMMIT.",
            insert_duration.as_millis()
        );
    }

    #[tokio::test]
    #[serial]
    async fn test_sync_happens_outside_transaction() {
        // Verify that sync DOES happen for writes outside transactions

        let config = DatabaseConfig {
            name: "test_sync_outside_tx.db".to_string(),
            ..Default::default()
        };

        let mut db = SqliteIndexedDB::new(config).await.unwrap();

        // CoRT: Drop then Create
        db.execute("DROP TABLE IF EXISTS test").await.unwrap();
        db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)")
            .await
            .unwrap();

        // Insert outside transaction - should sync
        db.execute("INSERT INTO test VALUES (1, 'test')")
            .await
            .unwrap();

        // Verify data persisted
        let result = db.execute("SELECT * FROM test").await.unwrap();
        assert_eq!(result.rows.len(), 1);
    }

    #[tokio::test]
    #[serial]
    async fn test_nested_transactions_defer_sync() {
        // Verify nested transactions also defer sync

        let config = DatabaseConfig {
            name: "test_nested_tx_sync.db".to_string(),
            ..Default::default()
        };

        let mut db = SqliteIndexedDB::new(config).await.unwrap();

        // CoRT: Drop then Create
        db.execute("DROP TABLE IF EXISTS test").await.unwrap();
        db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)")
            .await
            .unwrap();

        db.execute("BEGIN TRANSACTION").await.unwrap();

        let start = Instant::now();
        for i in 1..=50 {
            db.execute(&format!("INSERT INTO test VALUES ({}, 'value_{}')", i, i))
                .await
                .unwrap();
        }

        // Nested savepoint
        db.execute("SAVEPOINT sp1").await.unwrap();
        for i in 51..=100 {
            db.execute(&format!("INSERT INTO test VALUES ({}, 'value_{}')", i, i))
                .await
                .unwrap();
        }
        db.execute("RELEASE SAVEPOINT sp1").await.unwrap();

        let duration = start.elapsed();

        db.execute("COMMIT").await.unwrap();

        // Should still be fast with nested transactions
        assert!(
            duration.as_millis() < 50,
            "Nested transaction inserts took {}ms - sync not properly deferred",
            duration.as_millis()
        );
    }
}
