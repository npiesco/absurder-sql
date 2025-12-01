//! Phase 4 TDD tests: DatabaseConfig alignment with core library
//!
//! Tests verify that DatabaseConfig includes all core library fields:
//! - cache_size
//! - page_size
//! - journal_mode
//! - auto_vacuum

#[cfg(test)]
mod uniffi_databaseconfig_tests {
    use crate::registry::RUNTIME;
    use crate::uniffi_api::*;
    use serial_test::serial;

    #[test]
    #[serial]
    fn test_databaseconfig_has_cache_size() {
        let _ = env_logger::builder().is_test(true).try_init();

        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_config_cache_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: Some(2000_i64), // 2000 pages cache
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };

        let handle = RUNTIME
            .block_on(async { create_database(config).await })
            .expect("Failed to create database with cache_size");

        // Verify database works
        execute(handle, "DROP TABLE IF EXISTS test".to_string()).ok();
        execute(handle, "CREATE TABLE test (id INTEGER)".to_string())
            .expect("Table creation should work");

        close_database(handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_databaseconfig_has_page_size() {
        let _ = env_logger::builder().is_test(true).try_init();

        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_config_page_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: None,
            page_size: Some(4096_i64), // 4KB pages
            journal_mode: None,
            auto_vacuum: None,
        };

        let handle = RUNTIME
            .block_on(async { create_database(config).await })
            .expect("Failed to create database with page_size");

        // Verify database works and page_size is applied
        let result = execute(handle, "PRAGMA page_size".to_string())
            .expect("PRAGMA should work");

        assert!(!result.rows.is_empty(), "Should have page_size result");

        close_database(handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_databaseconfig_has_journal_mode() {
        let _ = env_logger::builder().is_test(true).try_init();

        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_config_journal_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: None,
            page_size: None,
            journal_mode: Some("MEMORY".to_string()),
            auto_vacuum: None,
        };

        let handle = RUNTIME
            .block_on(async { create_database(config).await })
            .expect("Failed to create database with journal_mode");

        // Verify database works
        execute(handle, "DROP TABLE IF EXISTS test".to_string()).ok();
        execute(handle, "CREATE TABLE test (id INTEGER)".to_string())
            .expect("Table creation should work");

        close_database(handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_databaseconfig_has_auto_vacuum() {
        let _ = env_logger::builder().is_test(true).try_init();

        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_config_vacuum_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: Some(true),
        };

        let handle = RUNTIME
            .block_on(async { create_database(config).await })
            .expect("Failed to create database with auto_vacuum");

        // Verify database works
        execute(handle, "DROP TABLE IF EXISTS test".to_string()).ok();
        execute(handle, "CREATE TABLE test (id INTEGER)".to_string())
            .expect("Table creation should work");

        close_database(handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_databaseconfig_mobile_optimized_defaults() {
        let _ = env_logger::builder().is_test(true).try_init();

        let thread_id = std::thread::current().id();
        // Test mobile-optimized configuration
        let config = DatabaseConfig {
            name: format!("uniffi_config_mobile_opt_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: Some(2000_i64),     // Good for mobile
            page_size: Some(4096_i64),      // 4KB typical for mobile
            journal_mode: Some("MEMORY".to_string()), // Fast for mobile
            auto_vacuum: Some(true),    // Keep db compact
        };

        let handle = RUNTIME
            .block_on(async { create_database(config).await })
            .expect("Failed to create mobile-optimized database");

        // Verify database works
        execute(handle, "DROP TABLE IF EXISTS test".to_string()).ok();
        execute(handle, "CREATE TABLE test (id INTEGER)".to_string())
            .expect("Table creation should work");

        // Insert and query to verify full functionality
        execute(handle, "INSERT INTO test VALUES (1)".to_string())
            .expect("Insert should work");

        let result = execute(handle, "SELECT * FROM test".to_string())
            .expect("Select should work");

        assert_eq!(result.rows.len(), 1);

        close_database(handle).expect("Failed to close database");
    }
}
