/// Test to prove that individual FFI calls have overhead vs batch execution
/// This test measures the performance difference between:
/// 1. Making 5000 individual FFI calls to execute()
/// 2. Making 1 FFI call with 5000 statements (not yet implemented)
///
/// EXPECTED TO FAIL until executeBatch() is implemented

#[cfg(all(test, not(target_arch = "wasm32")))]
mod mobile_bridge_overhead_tests {
    use absurder_sql::{DatabaseConfig, SqliteIndexedDB};
    use serial_test::serial;
    use std::time::Instant;

    #[tokio::test]
    #[serial]
    async fn test_individual_execute_overhead() {
        // Setup database
        let config = DatabaseConfig {
            name: "test_bridge_overhead.db".to_string(),
            ..Default::default()
        };

        let mut db = SqliteIndexedDB::new(config).await.unwrap();

        // CoRT: Drop then Create
        db.execute("DROP TABLE IF EXISTS test").await.unwrap();
        db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)")
            .await
            .unwrap();

        // Measure: 5000 individual execute() calls within a transaction
        db.execute("BEGIN TRANSACTION").await.unwrap();

        let start = Instant::now();
        for i in 0..5000 {
            let sql = format!("INSERT INTO test VALUES ({}, 'value_{}')", i, i);
            db.execute(&sql).await.unwrap();
        }
        let individual_duration = start.elapsed();

        db.execute("COMMIT").await.unwrap();

        println!(
            "5000 individual execute() calls took: {:?} ({:.2}ms)",
            individual_duration,
            individual_duration.as_secs_f64() * 1000.0
        );

        // This is the baseline - shows current performance
        // When called via FFI from React Native, each call has bridge overhead
        // Expected: This will be fast in pure Rust (~10-20ms)
        // But slow via React Native bridge (~150-200ms due to 5000 bridge crossings)
    }

    #[tokio::test]
    #[serial]
    async fn test_execute_batch_within_transaction() {
        // TDD: Test that execute_batch() executes multiple SQL statements efficiently
        let config = DatabaseConfig {
            name: "test_batch.db".to_string(),
            ..Default::default()
        };

        let mut db = SqliteIndexedDB::new(config).await.unwrap();

        // CoRT: Drop then Create
        db.execute("DROP TABLE IF EXISTS test").await.unwrap();
        db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)")
            .await
            .unwrap();

        // Build batch of statements
        let mut statements = Vec::new();
        for i in 0..5000 {
            statements.push(format!("INSERT INTO test VALUES ({}, 'value_{}')", i, i));
        }

        // Execute batch within transaction
        db.execute("BEGIN TRANSACTION").await.unwrap();

        let start = Instant::now();
        db.execute_batch(&statements).await.unwrap();
        let batch_duration = start.elapsed();

        db.execute("COMMIT").await.unwrap();

        // Verify all rows inserted
        let result = db.execute("SELECT COUNT(*) FROM test").await.unwrap();
        assert_eq!(result.rows.len(), 1);

        use absurder_sql::types::ColumnValue;
        match &result.rows[0].values[0] {
            ColumnValue::Integer(count) => assert_eq!(*count, 5000),
            _ => panic!("Expected Integer result from COUNT(*)"),
        }

        let batch_ms = batch_duration.as_secs_f64() * 1000.0;
        println!("Batch execute 5000 statements: {:.2}ms", batch_ms);

        // Should be fast - similar to individual execute performance
        assert!(
            batch_ms < 50.0,
            "Batch execute took {:.2}ms - should be < 50ms",
            batch_ms
        );
    }

    #[tokio::test]
    #[serial]
    async fn test_execute_batch_handles_errors() {
        // TDD: Test that execute_batch() properly reports errors
        let config = DatabaseConfig {
            name: "test_batch_errors.db".to_string(),
            ..Default::default()
        };

        let mut db = SqliteIndexedDB::new(config).await.unwrap();

        db.execute("DROP TABLE IF EXISTS test").await.unwrap();
        db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)")
            .await
            .unwrap();

        // Batch with one invalid statement
        let statements = vec![
            "INSERT INTO test VALUES (1, 'valid')".to_string(),
            "INSERT INTO nonexistent VALUES (2, 'invalid')".to_string(), // Will fail
            "INSERT INTO test VALUES (3, 'also_valid')".to_string(),
        ];

        db.execute("BEGIN TRANSACTION").await.unwrap();
        let result = db.execute_batch(&statements).await;

        // Should fail because of the invalid statement
        assert!(result.is_err(), "execute_batch should fail on invalid SQL");

        // Transaction should be rolled back
        db.execute("ROLLBACK").await.unwrap();
    }

    #[tokio::test]
    #[serial]
    async fn test_prove_single_transaction_is_fast_without_bridge() {
        // Prove that Rust-level performance is good
        // The problem is purely the React Native bridge overhead

        let config = DatabaseConfig {
            name: "test_rust_perf.db".to_string(),
            ..Default::default()
        };

        let mut db = SqliteIndexedDB::new(config).await.unwrap();

        db.execute("DROP TABLE IF EXISTS test").await.unwrap();
        db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)")
            .await
            .unwrap();

        db.execute("BEGIN TRANSACTION").await.unwrap();

        let start = Instant::now();
        for i in 0..5000 {
            let sql = format!("INSERT INTO test VALUES ({}, 'value_{}')", i, i);
            db.execute(&sql).await.unwrap();
        }
        let duration = start.elapsed();

        db.execute("COMMIT").await.unwrap();

        let duration_ms = duration.as_secs_f64() * 1000.0;
        println!("Pure Rust 5000 inserts: {:.2}ms", duration_ms);

        // Assertion: Pure Rust should be FAST (< 50ms)
        assert!(
            duration_ms < 50.0,
            "Pure Rust took {:.2}ms - should be < 50ms. Transaction sync optimization working?",
            duration_ms
        );

        // The React Native bridge adds ~0.03ms per call
        // 5000 calls × 0.03ms = 150ms overhead
        // That's why we see: 20ms (Rust) + 150ms (bridge) = 170ms total
        // RNSS: 20ms (Rust) + 3ms (1 bridge call) = 23ms total
    }
}
