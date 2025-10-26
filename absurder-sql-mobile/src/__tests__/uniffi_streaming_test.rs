/// Tests for UniFFI streaming statement functions
/// 
/// Tests cursor-based streaming for memory-efficient large result sets

#[cfg(test)]
mod uniffi_streaming_tests {
    use crate::uniffi_api::*;
    use serial_test::serial;

    #[test]
    #[serial]
    fn test_stream_basic() {
        let _ = env_logger::builder().is_test(true).try_init();
        
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_stream_basic_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let db_handle = create_database(config).expect("Failed to create database");
        
        // Create table and insert data
        execute(db_handle, "DROP TABLE IF EXISTS items".to_string()).ok();
        execute(db_handle, "CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)".to_string())
            .expect("Failed to create table");
        
        for i in 1..=10 {
            execute(db_handle, format!("INSERT INTO items (name) VALUES ('item_{}')", i))
                .expect("Failed to insert");
        }
        
        // Prepare streaming statement
        let stream_handle = prepare_stream(db_handle, "SELECT * FROM items ORDER BY id".to_string())
            .expect("Failed to prepare stream");
        
        assert!(stream_handle > 0, "Stream handle should be valid");
        
        // Fetch first batch
        let batch1 = fetch_next(stream_handle, 5).expect("Failed to fetch batch");
        assert_eq!(batch1.rows.len(), 5, "First batch should have 5 rows");
        
        // Fetch second batch
        let batch2 = fetch_next(stream_handle, 5).expect("Failed to fetch batch");
        assert_eq!(batch2.rows.len(), 5, "Second batch should have 5 rows");
        
        // Fetch third batch (should be empty)
        let batch3 = fetch_next(stream_handle, 5).expect("Failed to fetch batch");
        assert_eq!(batch3.rows.len(), 0, "Third batch should be empty");
        
        close_stream(stream_handle).expect("Failed to close stream");
        close_database(db_handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_stream_large_dataset() {
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_stream_large_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let db_handle = create_database(config).expect("Failed to create database");
        
        // Create table and insert large dataset
        execute(db_handle, "DROP TABLE IF EXISTS data".to_string()).ok();
        execute(db_handle, "CREATE TABLE data (id INTEGER PRIMARY KEY, value TEXT)".to_string())
            .expect("Failed to create table");
        
        // Insert 100 rows
        for i in 1..=100 {
            execute(db_handle, format!("INSERT INTO data (value) VALUES ('value_{}')", i))
                .expect("Failed to insert");
        }
        
        // Stream with batch size of 10
        let stream_handle = prepare_stream(db_handle, "SELECT * FROM data".to_string())
            .expect("Failed to prepare stream");
        
        let mut total_rows = 0;
        let mut batch_count = 0;
        
        loop {
            let batch = fetch_next(stream_handle, 10).expect("Failed to fetch batch");
            if batch.rows.len() == 0 {
                break;
            }
            total_rows += batch.rows.len();
            batch_count += 1;
        }
        
        assert_eq!(total_rows, 100, "Should fetch all 100 rows");
        assert_eq!(batch_count, 10, "Should have 10 batches");
        
        close_stream(stream_handle).expect("Failed to close stream");
        close_database(db_handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_stream_with_where_clause() {
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_stream_where_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let db_handle = create_database(config).expect("Failed to create database");
        
        // Create and populate table
        execute(db_handle, "DROP TABLE IF EXISTS products".to_string()).ok();
        execute(db_handle, "CREATE TABLE products (id INTEGER PRIMARY KEY, price REAL)".to_string())
            .expect("Failed to create table");
        
        for i in 1..=50 {
            execute(db_handle, format!("INSERT INTO products (price) VALUES ({})", i * 10))
                .expect("Failed to insert");
        }
        
        // Stream with WHERE clause
        let stream_handle = prepare_stream(db_handle, "SELECT * FROM products WHERE price > 250".to_string())
            .expect("Failed to prepare stream");
        
        let batch = fetch_next(stream_handle, 100).expect("Failed to fetch batch");
        assert_eq!(batch.rows.len(), 25, "Should fetch 25 rows (price 260-500)");
        
        close_stream(stream_handle).expect("Failed to close stream");
        close_database(db_handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_stream_empty_result() {
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_stream_empty_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let db_handle = create_database(config).expect("Failed to create database");
        
        // Create empty table
        execute(db_handle, "DROP TABLE IF EXISTS empty".to_string()).ok();
        execute(db_handle, "CREATE TABLE empty (id INTEGER)".to_string())
            .expect("Failed to create table");
        
        let stream_handle = prepare_stream(db_handle, "SELECT * FROM empty".to_string())
            .expect("Failed to prepare stream");
        
        let batch = fetch_next(stream_handle, 10).expect("Failed to fetch batch");
        assert_eq!(batch.rows.len(), 0, "Batch should be empty");
        
        close_stream(stream_handle).expect("Failed to close stream");
        close_database(db_handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_stream_invalid_db_handle() {
        let result = prepare_stream(999999, "SELECT 1".to_string());
        assert!(result.is_err(), "Invalid db handle should fail");
    }

    #[test]
    #[serial]
    fn test_stream_invalid_sql() {
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_stream_invalid_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let db_handle = create_database(config).expect("Failed to create database");
        
        let result = prepare_stream(db_handle, "INVALID SQL".to_string());
        assert!(result.is_err(), "Invalid SQL should fail");
        
        close_database(db_handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_fetch_invalid_stream_handle() {
        let result = fetch_next(999999, 10);
        assert!(result.is_err(), "Invalid stream handle should fail");
    }

    #[test]
    #[serial]
    fn test_fetch_invalid_batch_size() {
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_stream_batch_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let db_handle = create_database(config).expect("Failed to create database");
        
        execute(db_handle, "DROP TABLE IF EXISTS test".to_string()).ok();
        execute(db_handle, "CREATE TABLE test (id INTEGER)".to_string())
            .expect("Failed to create table");
        
        let stream_handle = prepare_stream(db_handle, "SELECT * FROM test".to_string())
            .expect("Failed to prepare stream");
        
        let result = fetch_next(stream_handle, 0);
        assert!(result.is_err(), "Batch size 0 should fail");
        
        let result = fetch_next(stream_handle, -1);
        assert!(result.is_err(), "Negative batch size should fail");
        
        close_stream(stream_handle).expect("Failed to close stream");
        close_database(db_handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_close_invalid_stream_handle() {
        let result = close_stream(999999);
        assert!(result.is_err(), "Invalid stream handle should fail");
    }

    #[test]
    #[serial]
    fn test_close_stream_twice() {
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_stream_close_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let db_handle = create_database(config).expect("Failed to create database");
        
        execute(db_handle, "DROP TABLE IF EXISTS test".to_string()).ok();
        execute(db_handle, "CREATE TABLE test (id INTEGER)".to_string())
            .expect("Failed to create table");
        
        let stream_handle = prepare_stream(db_handle, "SELECT * FROM test".to_string())
            .expect("Failed to prepare stream");
        
        close_stream(stream_handle).expect("First close should succeed");
        
        let result = close_stream(stream_handle);
        assert!(result.is_err(), "Second close should fail");
        
        close_database(db_handle).expect("Failed to close database");
    }
}
