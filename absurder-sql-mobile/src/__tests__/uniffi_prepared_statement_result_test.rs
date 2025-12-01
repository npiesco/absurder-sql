//! Phase 3 TDD tests: PreparedStatement execute_statement must return QueryResult
//!
//! Tests verify that execute_statement returns QueryResult with:
//! - columns
//! - rows (typed Row/ColumnValue)
//! - rows_affected
//! - last_insert_id
//! - execution_time_ms

#[cfg(test)]
mod uniffi_prepared_statement_result_tests {
    use crate::registry::RUNTIME;
    use crate::uniffi_api::*;
    use serial_test::serial;

    #[test]
    #[serial]
    fn test_execute_statement_returns_queryresult_with_rows() {
        let _ = env_logger::builder().is_test(true).try_init();

        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_stmt_result_rows_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };

        let handle = RUNTIME
            .block_on(async { create_database(config).await })
            .expect("Failed to create database");

        execute(
            handle,
            "DROP TABLE IF EXISTS products".to_string(),
        )
        .ok();
        execute(
            handle,
            "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL)".to_string(),
        )
        .expect("Failed to create table");

        execute(
            handle,
            "INSERT INTO products (name, price) VALUES ('Widget', 9.99)".to_string(),
        )
        .expect("Failed to insert");
        execute(
            handle,
            "INSERT INTO products (name, price) VALUES ('Gadget', 19.99)".to_string(),
        )
        .expect("Failed to insert");

        // Prepare a SELECT statement
        let stmt_handle = prepare_statement(
            handle,
            "SELECT id, name, price FROM products WHERE price > ?".to_string(),
        )
        .expect("Failed to prepare statement");

        // Execute with parameter - THIS SHOULD RETURN QueryResult
        let result = execute_statement(stmt_handle, vec!["5.0".to_string()])
            .expect("Failed to execute statement");

        // Verify QueryResult has proper structure
        assert_eq!(result.columns.len(), 3, "Should have 3 columns");
        assert_eq!(result.columns[0], "id");
        assert_eq!(result.columns[1], "name");
        assert_eq!(result.columns[2], "price");

        // Verify rows are returned with typed values
        assert_eq!(
            result.rows.len(),
            2,
            "Should have 2 rows matching price > 5.0"
        );

        // Check first row values
        let row1 = &result.rows[0];
        assert_eq!(row1.values.len(), 3);

        // id should be Integer
        match &row1.values[0] {
            ColumnValue::Integer { value } => assert_eq!(*value, 1),
            other => panic!("Expected Integer for id, got {:?}", other),
        }

        // name should be Text
        match &row1.values[1] {
            ColumnValue::Text { value } => assert_eq!(value, "Widget"),
            other => panic!("Expected Text for name, got {:?}", other),
        }

        // price should be Real
        match &row1.values[2] {
            ColumnValue::Real { value } => assert!((value - 9.99).abs() < 0.001),
            other => panic!("Expected Real for price, got {:?}", other),
        }

        // Cleanup
        finalize_statement(stmt_handle).expect("Failed to finalize");
        close_database(handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_execute_statement_returns_last_insert_id() {
        let _ = env_logger::builder().is_test(true).try_init();

        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_stmt_result_insert_id_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };

        let handle = RUNTIME
            .block_on(async { create_database(config).await })
            .expect("Failed to create database");

        execute(handle, "DROP TABLE IF EXISTS items".to_string()).ok();
        execute(
            handle,
            "CREATE TABLE items (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT)".to_string(),
        )
        .expect("Failed to create table");

        // Prepare INSERT statement
        let stmt_handle =
            prepare_statement(handle, "INSERT INTO items (data) VALUES (?)".to_string())
                .expect("Failed to prepare statement");

        // Execute INSERT - should return QueryResult with last_insert_id
        let result = execute_statement(stmt_handle, vec!["first".to_string()])
            .expect("Failed to execute insert");

        assert!(
            result.last_insert_id.is_some(),
            "INSERT should populate last_insert_id"
        );
        assert_eq!(result.last_insert_id.unwrap(), 1);

        // Execute another INSERT
        let result2 = execute_statement(stmt_handle, vec!["second".to_string()])
            .expect("Failed to execute second insert");

        assert_eq!(result2.last_insert_id.unwrap(), 2);

        // Verify rows_affected
        assert_eq!(result.rows_affected, 1);
        assert_eq!(result2.rows_affected, 1);

        // Cleanup
        finalize_statement(stmt_handle).expect("Failed to finalize");
        close_database(handle).expect("Failed to close database");
    }

    #[test]
    #[serial]
    fn test_execute_statement_returns_execution_time() {
        let _ = env_logger::builder().is_test(true).try_init();

        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("uniffi_stmt_result_time_{:?}.db", thread_id),
            encryption_key: None,
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };

        let handle = RUNTIME
            .block_on(async { create_database(config).await })
            .expect("Failed to create database");

        execute(handle, "DROP TABLE IF EXISTS timing".to_string()).ok();
        execute(
            handle,
            "CREATE TABLE timing (id INTEGER PRIMARY KEY, val TEXT)".to_string(),
        )
        .expect("Failed to create table");

        let stmt_handle = prepare_statement(handle, "SELECT * FROM timing".to_string())
            .expect("Failed to prepare statement");

        let result =
            execute_statement(stmt_handle, vec![]).expect("Failed to execute statement");

        // execution_time_ms should be populated (>= 0)
        assert!(
            result.execution_time_ms >= 0.0,
            "execution_time_ms should be non-negative"
        );

        // Cleanup
        finalize_statement(stmt_handle).expect("Failed to finalize");
        close_database(handle).expect("Failed to close database");
    }
}
