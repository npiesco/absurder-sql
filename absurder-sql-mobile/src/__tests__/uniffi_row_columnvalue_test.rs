/// Tests for UniFFI Row and ColumnValue type exports
///
/// TDD Phase 1: Verify Row and ColumnValue types are properly exported via UniFFI
/// and that execute() returns typed rows instead of JSON strings.

#[cfg(test)]
mod uniffi_row_columnvalue_tests {
    use crate::uniffi_api::*;
    use crate::registry::RUNTIME;
    use serial_test::serial;

    /// Test that Row type exists and can be used
    #[test]
    #[serial]
    fn test_row_type_exists() {
        // This test verifies Row is exported via UniFFI
        // It should compile and run once Row is added to types.rs
        let row = Row {
            values: vec![
                ColumnValue::Integer { value: 42 },
                ColumnValue::Text { value: "hello".to_string() },
            ],
        };

        assert_eq!(row.values.len(), 2);
    }

    /// Test that all ColumnValue variants exist
    #[test]
    #[serial]
    fn test_columnvalue_variants() {
        // Test all variants exist and can be created (UniFFI uses struct variants)
        let null_val = ColumnValue::Null;
        let int_val = ColumnValue::Integer { value: 42 };
        let real_val = ColumnValue::Real { value: 3.14 };
        let text_val = ColumnValue::Text { value: "hello".to_string() };
        let blob_val = ColumnValue::Blob { value: vec![0x01, 0x02, 0x03] };

        // Verify we can match on variants
        match null_val {
            ColumnValue::Null => assert!(true),
            _ => panic!("Expected Null variant"),
        }

        match int_val {
            ColumnValue::Integer { value } => assert_eq!(value, 42),
            _ => panic!("Expected Integer variant"),
        }

        match real_val {
            ColumnValue::Real { value } => assert!((value - 3.14).abs() < 0.001),
            _ => panic!("Expected Real variant"),
        }

        match text_val {
            ColumnValue::Text { value } => assert_eq!(value, "hello"),
            _ => panic!("Expected Text variant"),
        }

        match blob_val {
            ColumnValue::Blob { value } => assert_eq!(value, vec![0x01, 0x02, 0x03]),
            _ => panic!("Expected Blob variant"),
        }
    }

    /// Test that QueryResult contains typed rows (Vec<Row>) not JSON strings
    #[test]
    #[serial]
    fn test_query_result_returns_typed_rows() {
        let _ = env_logger::builder().is_test(true).try_init();

        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_typed_rows_{:?}.db", thread_id),
            encryption_key: None,
        };

        let handle = RUNTIME.block_on(async { create_database(config.clone()).await })
            .unwrap_or_else(|e| panic!("Failed to create database {}: {:?}", config.name, e));

        // Create table and insert data
        execute(handle, "DROP TABLE IF EXISTS typed_rows_test".to_string()).ok();
        execute(handle, "CREATE TABLE typed_rows_test (id INTEGER PRIMARY KEY, name TEXT, score REAL, data BLOB)".to_string())
            .expect("CREATE TABLE failed");

        execute(handle, "INSERT INTO typed_rows_test (id, name, score, data) VALUES (1, 'Alice', 95.5, X'DEADBEEF')".to_string())
            .expect("INSERT failed");

        // Query and verify typed rows
        let result = execute(handle, "SELECT * FROM typed_rows_test".to_string())
            .expect("SELECT failed");

        assert_eq!(result.columns.len(), 4, "Should have 4 columns");
        assert_eq!(result.rows.len(), 1, "Should have 1 row");

        // Verify rows are typed Row structs, not JSON strings
        let row = &result.rows[0];
        assert_eq!(row.values.len(), 4, "Row should have 4 values");

        // Verify column values have correct types (UniFFI uses struct variants)
        match &row.values[0] {
            ColumnValue::Integer { value } => assert_eq!(*value, 1),
            other => panic!("Expected Integer for id, got {:?}", other),
        }

        match &row.values[1] {
            ColumnValue::Text { value } => assert_eq!(value, "Alice"),
            other => panic!("Expected Text for name, got {:?}", other),
        }

        match &row.values[2] {
            ColumnValue::Real { value } => assert!((*value - 95.5).abs() < 0.001),
            other => panic!("Expected Real for score, got {:?}", other),
        }

        match &row.values[3] {
            ColumnValue::Blob { value } => assert_eq!(value, &vec![0xDE, 0xAD, 0xBE, 0xEF]),
            other => panic!("Expected Blob for data, got {:?}", other),
        }

        // Clean up
        close_database(handle).expect("Failed to close database");
    }

    /// Test NULL values are properly typed
    #[test]
    #[serial]
    fn test_null_values_typed() {
        let _ = env_logger::builder().is_test(true).try_init();

        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_null_typed_{:?}.db", thread_id),
            encryption_key: None,
        };

        let handle = RUNTIME.block_on(async { create_database(config.clone()).await })
            .expect("Failed to create database");

        execute(handle, "DROP TABLE IF EXISTS null_test".to_string()).ok();
        execute(handle, "CREATE TABLE null_test (id INTEGER, value TEXT)".to_string())
            .expect("CREATE TABLE failed");

        // Insert NULL value
        execute(handle, "INSERT INTO null_test (id, value) VALUES (1, NULL)".to_string())
            .expect("INSERT failed");

        let result = execute(handle, "SELECT * FROM null_test".to_string())
            .expect("SELECT failed");

        let row = &result.rows[0];

        match &row.values[1] {
            ColumnValue::Null => assert!(true, "NULL correctly typed"),
            other => panic!("Expected Null variant, got {:?}", other),
        }

        close_database(handle).expect("Failed to close database");
    }
}
