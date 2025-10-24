/// PreparedStatement FFI Tests
/// Tests the C FFI layer for prepared statements

#[cfg(test)]
mod tests {
    use super::super::*;
    use std::ffi::CString;

    #[test]
    fn test_prepare_and_execute_select() {
        // Create database
        let db_name = CString::new("test_prepare.db").unwrap();
        let handle = unsafe { absurder_db_new(db_name.as_ptr()) };
        assert_ne!(handle, 0, "Database creation should succeed");

        // Drop table if exists
        let drop_sql = CString::new("DROP TABLE IF EXISTS users").unwrap();
        let result_ptr = unsafe { absurder_db_execute(handle, drop_sql.as_ptr()) };
        assert!(!result_ptr.is_null());
        unsafe { absurder_free_string(result_ptr); }

        // Create table
        let create_sql = CString::new("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)").unwrap();
        let result_ptr = unsafe { absurder_db_execute(handle, create_sql.as_ptr()) };
        assert!(!result_ptr.is_null(), "CREATE TABLE should succeed");
        unsafe { absurder_free_string(result_ptr); }

        // Insert test data
        let insert1 = CString::new("INSERT INTO users VALUES (1, 'Alice', 30)").unwrap();
        let result_ptr = unsafe { absurder_db_execute(handle, insert1.as_ptr()) };
        assert!(!result_ptr.is_null());
        unsafe { absurder_free_string(result_ptr); }

        let insert2 = CString::new("INSERT INTO users VALUES (2, 'Bob', 25)").unwrap();
        let result_ptr = unsafe { absurder_db_execute(handle, insert2.as_ptr()) };
        assert!(!result_ptr.is_null());
        unsafe { absurder_free_string(result_ptr); }

        // Prepare statement
        let prepare_sql = CString::new("SELECT * FROM users WHERE id = ?").unwrap();
        let stmt_handle = unsafe { absurder_db_prepare(handle, prepare_sql.as_ptr()) };
        assert_ne!(stmt_handle, 0, "Prepare statement should succeed");

        // Execute with parameter id=1
        let params_json = CString::new(r#"[{"type":"Integer","value":1}]"#).unwrap();
        let result_ptr = unsafe { absurder_stmt_execute(stmt_handle, params_json.as_ptr()) };
        if result_ptr.is_null() {
            let error_ptr = unsafe { absurder_get_error() };
            if !error_ptr.is_null() {
                let error_msg = unsafe { CStr::from_ptr(error_ptr) }.to_str().unwrap();
                panic!("Execute prepared statement failed: {}", error_msg);
            } else {
                panic!("Execute prepared statement failed with no error message");
            }
        }
        assert!(!result_ptr.is_null(), "Execute prepared statement should succeed");
        
        let result_str = unsafe { CStr::from_ptr(result_ptr) }.to_str().unwrap();
        assert!(result_str.contains("Alice"), "Should return Alice's record");
        unsafe { absurder_free_string(result_ptr); }

        // Execute again with parameter id=2
        let params_json2 = CString::new(r#"[{"type":"Integer","value":2}]"#).unwrap();
        let result_ptr2 = unsafe { absurder_stmt_execute(stmt_handle, params_json2.as_ptr()) };
        assert!(!result_ptr2.is_null());
        
        let result_str2 = unsafe { CStr::from_ptr(result_ptr2) }.to_str().unwrap();
        assert!(result_str2.contains("Bob"), "Should return Bob's record");
        unsafe { absurder_free_string(result_ptr2); }

        // Finalize statement
        let finalize_result = unsafe { absurder_stmt_finalize(stmt_handle) };
        assert_eq!(finalize_result, 0, "Finalize should succeed");

        // Clean up
        unsafe { absurder_db_close(handle); }
    }

    #[test]
    fn test_prepare_insert_statement() {
        // Create database
        let db_name = CString::new("test_prepare_insert.db").unwrap();
        let handle = unsafe { absurder_db_new(db_name.as_ptr()) };
        assert_ne!(handle, 0);

        // Drop table if exists
        let drop_sql = CString::new("DROP TABLE IF EXISTS products").unwrap();
        let result_ptr = unsafe { absurder_db_execute(handle, drop_sql.as_ptr()) };
        assert!(!result_ptr.is_null());
        unsafe { absurder_free_string(result_ptr); }

        // Create table
        let create_sql = CString::new("CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL)").unwrap();
        let result_ptr = unsafe { absurder_db_execute(handle, create_sql.as_ptr()) };
        assert!(!result_ptr.is_null());
        unsafe { absurder_free_string(result_ptr); }

        // Prepare INSERT statement
        let prepare_sql = CString::new("INSERT INTO products (name, price) VALUES (?, ?)").unwrap();
        let stmt_handle = unsafe { absurder_db_prepare(handle, prepare_sql.as_ptr()) };
        assert_ne!(stmt_handle, 0);

        // Execute multiple times with different parameters
        let params1 = CString::new(r#"[{"type":"Text","value":"Widget"},{"type":"Real","value":9.99}]"#).unwrap();
        let result1 = unsafe { absurder_stmt_execute(stmt_handle, params1.as_ptr()) };
        assert!(!result1.is_null());
        unsafe { absurder_free_string(result1); }

        let params2 = CString::new(r#"[{"type":"Text","value":"Gadget"},{"type":"Real","value":19.99}]"#).unwrap();
        let result2 = unsafe { absurder_stmt_execute(stmt_handle, params2.as_ptr()) };
        assert!(!result2.is_null());
        unsafe { absurder_free_string(result2); }

        // Finalize
        let finalize_result = unsafe { absurder_stmt_finalize(stmt_handle) };
        assert_eq!(finalize_result, 0);

        // Verify inserts worked
        let count_sql = CString::new("SELECT COUNT(*) FROM products").unwrap();
        let count_result = unsafe { absurder_db_execute(handle, count_sql.as_ptr()) };
        assert!(!count_result.is_null());
        let count_str = unsafe { CStr::from_ptr(count_result) }.to_str().unwrap();
        assert!(count_str.contains("2"), "Should have 2 rows");
        unsafe { absurder_free_string(count_result); }

        // Clean up
        unsafe { absurder_db_close(handle); }
    }

    #[test]
    fn test_prepare_invalid_sql() {
        let db_name = CString::new("test_prepare_invalid.db").unwrap();
        let handle = unsafe { absurder_db_new(db_name.as_ptr()) };
        assert_ne!(handle, 0);

        // Try to prepare invalid SQL
        let invalid_sql = CString::new("SELECT * FROM nonexistent_table").unwrap();
        let stmt_handle = unsafe { absurder_db_prepare(handle, invalid_sql.as_ptr()) };
        
        // Should return 0 (error) since table doesn't exist
        // Note: SQLite may allow preparing the statement, but execution will fail
        // So we test execution failure instead
        if stmt_handle != 0 {
            let params = CString::new("[]").unwrap();
            let result = unsafe { absurder_stmt_execute(stmt_handle, params.as_ptr()) };
            // Execution should fail
            assert!(result.is_null(), "Executing statement on nonexistent table should fail");
            unsafe { absurder_stmt_finalize(stmt_handle); }
        }

        unsafe { absurder_db_close(handle); }
    }

    #[test]
    fn test_finalize_twice() {
        let db_name = CString::new("test_finalize_twice.db").unwrap();
        let handle = unsafe { absurder_db_new(db_name.as_ptr()) };
        assert_ne!(handle, 0);

        let drop_sql = CString::new("DROP TABLE IF EXISTS test").unwrap();
        let result = unsafe { absurder_db_execute(handle, drop_sql.as_ptr()) };
        assert!(!result.is_null());
        unsafe { absurder_free_string(result); }

        let create_sql = CString::new("CREATE TABLE test (id INTEGER)").unwrap();
        let result = unsafe { absurder_db_execute(handle, create_sql.as_ptr()) };
        assert!(!result.is_null());
        unsafe { absurder_free_string(result); }

        let prepare_sql = CString::new("SELECT * FROM test").unwrap();
        let stmt_handle = unsafe { absurder_db_prepare(handle, prepare_sql.as_ptr()) };
        assert_ne!(stmt_handle, 0);

        // First finalize should succeed
        let finalize1 = unsafe { absurder_stmt_finalize(stmt_handle) };
        assert_eq!(finalize1, 0);

        // Second finalize should fail (handle no longer valid)
        let finalize2 = unsafe { absurder_stmt_finalize(stmt_handle) };
        assert_ne!(finalize2, 0, "Finalizing twice should fail");

        unsafe { absurder_db_close(handle); }
    }
}
