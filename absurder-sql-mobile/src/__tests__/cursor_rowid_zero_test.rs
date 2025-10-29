use serial_test::serial;
use std::ffi::{CStr, CString};
use crate::*;

/// Test that cursor pagination handles rowid=0 correctly
/// This MUST NOT skip rowid=0
#[test]
#[serial]
fn test_cursor_handles_rowid_zero() {
    unsafe {
        let name = CString::new("test_rowid_zero.db").unwrap();
        let handle = absurder_db_new(name.as_ptr());
        
        let drop_sql = CString::new("DROP TABLE IF EXISTS test").unwrap();
        let result = absurder_db_execute(handle, drop_sql.as_ptr());
        absurder_free_string(result);
        
        let create_sql = CString::new("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)").unwrap();
        let result = absurder_db_execute(handle, create_sql.as_ptr());
        absurder_free_string(result);
        
        // Insert rows starting from ID 0 (rowids will be 0-999)
        for i in 0..1000 {
            let insert_sql = CString::new(format!("INSERT INTO test VALUES ({}, 'value_{}')", i, i)).unwrap();
            let result = absurder_db_execute(handle, insert_sql.as_ptr());
            absurder_free_string(result);
        }
        
        // Verify all rows are there
        let count_sql = CString::new("SELECT COUNT(*) as count FROM test").unwrap();
        let count_result = absurder_db_execute(handle, count_sql.as_ptr());
        let count_str = CStr::from_ptr(count_result).to_str().unwrap();
        println!("Count query result: {}", count_str);
        absurder_free_string(count_result);
        
        // Stream in batches of 100
        let select_sql = CString::new("SELECT * FROM test ORDER BY id").unwrap();
        let stream_handle = absurder_stmt_prepare_stream(handle, select_sql.as_ptr());
        
        let mut total_rows = 0;
        let mut first_id = None;
        let mut last_id = None;
        
        loop {
            let batch_json = absurder_stmt_fetch_next(stream_handle, 100);
            let batch_str = CStr::from_ptr(batch_json).to_str().unwrap();
            
            // Parse as Row array: [{values: [{type, value}, ...]}, ...]
            let batch: Vec<serde_json::Value> = serde_json::from_str(batch_str).unwrap();
            
            if batch.is_empty() {
                break;
            }
            
            // Track first and last IDs from values array (id is first column, index 0)
            if first_id.is_none() && !batch.is_empty() {
                if let Some(values) = batch[0].get("values").and_then(|v| v.as_array()) {
                    if let Some(id_value) = values.get(0) {
                        if let Some(id) = id_value.get("value").and_then(|v| v.as_i64()) {
                            first_id = Some(id);
                        }
                    }
                }
            }
            if let Some(last_row) = batch.last() {
                if let Some(values) = last_row.get("values").and_then(|v| v.as_array()) {
                    if let Some(id_value) = values.get(0) {
                        if let Some(id) = id_value.get("value").and_then(|v| v.as_i64()) {
                            last_id = Some(id);
                        }
                    }
                }
            }
            
            absurder_free_string(batch_json);
            total_rows += batch.len();
        }
        
        println!("Total rows fetched: {}", total_rows);
        println!("First ID: {:?}", first_id);
        println!("Last ID: {:?}", last_id);
        
        // MUST fetch all 1000 rows, starting from ID 0
        assert_eq!(first_id, Some(0), "First row must have ID 0, not {:?}", first_id);
        assert_eq!(last_id, Some(999), "Last row must have ID 999, not {:?}", last_id);
        assert_eq!(total_rows, 1000, "Expected 1000 rows, got {} - rowid 0 was skipped!", total_rows);
        
        absurder_stmt_stream_close(stream_handle);
        absurder_db_close(handle);
    }
}
