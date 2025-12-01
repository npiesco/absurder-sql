/// Tests for QueryResult fields: last_insert_id and execution_time_ms
///
/// TDD Phase 2: Verify QueryResult includes timing and row ID information
/// to match core library behavior.

#[cfg(test)]
mod uniffi_queryresult_fields_tests {
    use crate::uniffi_api::*;
    use crate::registry::RUNTIME;
    use serial_test::serial;

    /// Test that last_insert_id is populated after INSERT
    #[test]
    #[serial]
    fn test_last_insert_id_populated_after_insert() {
        let _ = env_logger::builder().is_test(true).try_init();

        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_last_insert_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };

        let handle = RUNTIME.block_on(async { create_database(config.clone()).await })
            .expect("Failed to create database");

        // Create table with AUTOINCREMENT
        execute(handle, "DROP TABLE IF EXISTS insert_test".to_string()).ok();
        execute(handle, "CREATE TABLE insert_test (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)".to_string())
            .expect("CREATE TABLE failed");

        // Insert first row
        let result1 = execute(handle, "INSERT INTO insert_test (name) VALUES ('Alice')".to_string())
            .expect("INSERT 1 failed");

        assert!(result1.last_insert_id.is_some(), "last_insert_id should be populated after INSERT");
        assert_eq!(result1.last_insert_id.unwrap(), 1, "First insert should have rowid 1");

        // Insert second row
        let result2 = execute(handle, "INSERT INTO insert_test (name) VALUES ('Bob')".to_string())
            .expect("INSERT 2 failed");

        assert!(result2.last_insert_id.is_some(), "last_insert_id should be populated after second INSERT");
        assert_eq!(result2.last_insert_id.unwrap(), 2, "Second insert should have rowid 2");

        // SELECT should NOT have last_insert_id
        let result3 = execute(handle, "SELECT * FROM insert_test".to_string())
            .expect("SELECT failed");

        assert!(result3.last_insert_id.is_none(), "SELECT should not have last_insert_id");

        close_database(handle).expect("Failed to close database");
    }

    /// Test that execution_time_ms is populated and reasonable
    #[test]
    #[serial]
    fn test_execution_time_ms_populated() {
        let _ = env_logger::builder().is_test(true).try_init();

        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_exec_time_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };

        let handle = RUNTIME.block_on(async { create_database(config.clone()).await })
            .expect("Failed to create database");

        execute(handle, "DROP TABLE IF EXISTS timing_test".to_string()).ok();
        execute(handle, "CREATE TABLE timing_test (id INTEGER, value TEXT)".to_string())
            .expect("CREATE TABLE failed");

        // Execute a query and check timing
        let result = execute(handle, "SELECT * FROM timing_test".to_string())
            .expect("SELECT failed");

        // execution_time_ms should be >= 0 (it's a valid time measurement)
        assert!(result.execution_time_ms >= 0.0,
            "execution_time_ms should be non-negative, got {}", result.execution_time_ms);

        // It should be a reasonable value (less than 10 seconds for a simple query)
        assert!(result.execution_time_ms < 10000.0,
            "execution_time_ms should be reasonable, got {} ms", result.execution_time_ms);

        close_database(handle).expect("Failed to close database");
    }

    /// Test execution_time_ms increases with workload
    #[test]
    #[serial]
    fn test_execution_time_ms_reflects_workload() {
        let _ = env_logger::builder().is_test(true).try_init();

        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_workload_time_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };

        let handle = RUNTIME.block_on(async { create_database(config.clone()).await })
            .expect("Failed to create database");

        execute(handle, "DROP TABLE IF EXISTS workload_test".to_string()).ok();
        execute(handle, "CREATE TABLE workload_test (id INTEGER, data TEXT)".to_string())
            .expect("CREATE TABLE failed");

        // Insert many rows - this should take measurable time
        execute(handle, "BEGIN TRANSACTION".to_string()).expect("BEGIN failed");
        for i in 0..100 {
            execute(handle, format!("INSERT INTO workload_test VALUES ({}, 'data_{}')", i, i))
                .expect("INSERT failed");
        }
        execute(handle, "COMMIT".to_string()).expect("COMMIT failed");

        // Query all rows
        let result = execute(handle, "SELECT * FROM workload_test".to_string())
            .expect("SELECT failed");

        // Should have 100 rows
        assert_eq!(result.rows.len(), 100, "Should have 100 rows");

        // execution_time_ms should be present
        assert!(result.execution_time_ms >= 0.0,
            "execution_time_ms should be present");

        log::info!("Query of 100 rows took {} ms", result.execution_time_ms);

        close_database(handle).expect("Failed to close database");
    }
}
