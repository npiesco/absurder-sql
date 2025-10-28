use serial_test::serial;
use std::ffi::{CStr, CString};
use std::thread;
use crate::*;

#[test]
#[serial]
fn test_create_single_column_index() {
    unsafe {
        let thread_id = thread::current().id();
        let db_name = format!("test_index_single_{:?}.db", thread_id);
        let name = CString::new(db_name).unwrap();
        let handle = absurder_db_new(name.as_ptr());
        assert_ne!(handle, 0);
        
        // Drop table if exists for clean test state
        let drop_sql = CString::new("DROP TABLE IF EXISTS users").unwrap();
        let result = absurder_db_execute(handle, drop_sql.as_ptr());
        if !result.is_null() {
            absurder_free_string(result);
        }
        
        // Create table
        let create_sql = CString::new("CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, name TEXT)").unwrap();
        let result = absurder_db_execute(handle, create_sql.as_ptr());
        assert!(!result.is_null());
        absurder_free_string(result);
        
        // Create index on email column
        let table = CString::new("users").unwrap();
        let column = CString::new("email").unwrap();
        let result = absurder_create_index(handle, table.as_ptr(), column.as_ptr());
        assert_eq!(result, 0, "Index creation should succeed");
        
        // Verify index exists by checking sqlite_master
        let check_sql = CString::new("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_users_email'").unwrap();
        let result = absurder_db_execute(handle, check_sql.as_ptr());
        let result_str = CStr::from_ptr(result).to_str().unwrap();
        assert!(result_str.contains("idx_users_email"), "Index should exist");
        absurder_free_string(result);
        
        absurder_db_close(handle);
    }
}

#[test]
#[serial]
fn test_create_multi_column_index() {
    unsafe {
        let thread_id = thread::current().id();
        let db_name = format!("test_index_multi_{:?}.db", thread_id);
        let name = CString::new(db_name).unwrap();
        let handle = absurder_db_new(name.as_ptr());
        assert_ne!(handle, 0);
        
        // Drop table if exists for clean test state
        let drop_sql = CString::new("DROP TABLE IF EXISTS orders").unwrap();
        let result = absurder_db_execute(handle, drop_sql.as_ptr());
        if !result.is_null() {
            absurder_free_string(result);
        }
        
        // Create table
        let create_sql = CString::new("CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, product_id INTEGER, created_at TEXT)").unwrap();
        let result = absurder_db_execute(handle, create_sql.as_ptr());
        assert!(!result.is_null());
        absurder_free_string(result);
        
        // Create composite index on user_id and product_id
        let table = CString::new("orders").unwrap();
        let columns = CString::new("user_id,product_id").unwrap();
        let result = absurder_create_index(handle, table.as_ptr(), columns.as_ptr());
        assert_eq!(result, 0, "Composite index creation should succeed");
        
        // Verify index exists
        let check_sql = CString::new("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_orders_user_id_product_id'").unwrap();
        let result = absurder_db_execute(handle, check_sql.as_ptr());
        let result_str = CStr::from_ptr(result).to_str().unwrap();
        assert!(result_str.contains("idx_orders_user_id_product_id"), "Composite index should exist");
        absurder_free_string(result);
        
        absurder_db_close(handle);
    }
}

#[test]
#[serial]
fn test_create_index_invalid_handle() {
    unsafe {
        let table = CString::new("users").unwrap();
        let column = CString::new("email").unwrap();
        let result = absurder_create_index(99999, table.as_ptr(), column.as_ptr());
        assert_eq!(result, -1, "Should return error for invalid handle");
    }
}

#[test]
#[serial]
fn test_create_index_invalid_table() {
    unsafe {
        let thread_id = thread::current().id();
        let db_name = format!("test_index_invalid_table_{:?}.db", thread_id);
        let name = CString::new(db_name).unwrap();
        let handle = absurder_db_new(name.as_ptr());
        assert_ne!(handle, 0);
        
        // Try to create index on non-existent table
        let table = CString::new("nonexistent_table").unwrap();
        let column = CString::new("email").unwrap();
        let result = absurder_create_index(handle, table.as_ptr(), column.as_ptr());
        assert_eq!(result, -1, "Should return error for invalid table");
        
        absurder_db_close(handle);
    }
}

#[test]
#[serial]
fn test_create_index_null_inputs() {
    unsafe {
        let thread_id = thread::current().id();
        let db_name = format!("test_index_null_{:?}.db", thread_id);
        let name = CString::new(db_name).unwrap();
        let handle = absurder_db_new(name.as_ptr());
        assert_ne!(handle, 0);
        
        let table = CString::new("users").unwrap();
        let column = CString::new("email").unwrap();
        
        // Null table name
        let result = absurder_create_index(handle, std::ptr::null(), column.as_ptr());
        assert_eq!(result, -1, "Should return error for null table");
        
        // Null column name
        let result = absurder_create_index(handle, table.as_ptr(), std::ptr::null());
        assert_eq!(result, -1, "Should return error for null columns");
        
        absurder_db_close(handle);
    }
}
