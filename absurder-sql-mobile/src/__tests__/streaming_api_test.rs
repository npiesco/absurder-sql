//! Tests for Streaming Results API
//! 
//! Tests cursor-based pagination for large result sets

use crate::*;
use std::ffi::CString;

#[test]
fn test_streaming_statement_basic() {
    // Create database
    let name = CString::new("test_streaming.db").unwrap();
    let handle = unsafe { absurder_db_new(name.as_ptr()) };
    assert_ne!(handle, 0, "Failed to create database");

    // Drop and recreate table for clean test state
    let drop_sql = CString::new("DROP TABLE IF EXISTS test_stream").unwrap();
    let drop_result = unsafe { absurder_db_execute(handle, drop_sql.as_ptr()) };
    if !drop_result.is_null() {
        unsafe { absurder_free_string(drop_result) };
    }

    // Create table and insert test data
    let create_sql = CString::new("CREATE TABLE test_stream (id INTEGER PRIMARY KEY, value TEXT)").unwrap();
    let create_result = unsafe { absurder_db_execute(handle, create_sql.as_ptr()) };
    assert!(!create_result.is_null(), "Failed to create table");
    unsafe { absurder_free_string(create_result) };

    // Insert 1000 rows
    for i in 0..1000 {
        let insert_sql = CString::new(format!("INSERT INTO test_stream VALUES ({}, 'value{}')", i, i)).unwrap();
        let result = unsafe { absurder_db_execute(handle, insert_sql.as_ptr()) };
        assert!(!result.is_null(), "Failed to insert row {}", i);
        unsafe { absurder_free_string(result) };
    }

    // Prepare streaming statement
    let select_sql = CString::new("SELECT * FROM test_stream ORDER BY id").unwrap();
    let stream_handle = unsafe { absurder_stmt_prepare_stream(handle, select_sql.as_ptr()) };
    assert_ne!(stream_handle, 0, "Failed to prepare streaming statement");

    // Fetch in batches of 100
    let mut total_rows = 0;
    loop {
        let batch_json = unsafe { absurder_stmt_fetch_next(stream_handle, 100) };
        assert!(!batch_json.is_null(), "fetch_next returned null");

        let batch_str = unsafe { CStr::from_ptr(batch_json) }.to_str().unwrap();
        let batch: Vec<serde_json::Value> = serde_json::from_str(batch_str).unwrap();
        
        unsafe { absurder_free_string(batch_json) };

        if batch.is_empty() {
            break;
        }

        total_rows += batch.len();
    }

    assert_eq!(total_rows, 1000, "Expected 1000 rows, got {}", total_rows);

    // Close stream
    let close_result = unsafe { absurder_stmt_stream_close(stream_handle) };
    assert_eq!(close_result, 0, "Failed to close stream");

    // Cleanup
    unsafe { absurder_db_close(handle) };
}

#[test]
fn test_streaming_statement_early_break() {
    // Create database
    let name = CString::new("test_streaming_break.db").unwrap();
    let handle = unsafe { absurder_db_new(name.as_ptr()) };
    assert_ne!(handle, 0);

    // Drop and recreate table for clean test state
    let drop_sql = CString::new("DROP TABLE IF EXISTS test_stream").unwrap();
    let drop_result = unsafe { absurder_db_execute(handle, drop_sql.as_ptr()) };
    if !drop_result.is_null() {
        unsafe { absurder_free_string(drop_result) };
    }

    // Create table and insert test data
    let create_sql = CString::new("CREATE TABLE test_stream (id INTEGER PRIMARY KEY, value TEXT)").unwrap();
    let create_result = unsafe { absurder_db_execute(handle, create_sql.as_ptr()) };
    assert!(!create_result.is_null());
    unsafe { absurder_free_string(create_result) };

    // Insert 1000 rows
    for i in 0..1000 {
        let insert_sql = CString::new(format!("INSERT INTO test_stream VALUES ({}, 'value{}')", i, i)).unwrap();
        let result = unsafe { absurder_db_execute(handle, insert_sql.as_ptr()) };
        assert!(!result.is_null());
        unsafe { absurder_free_string(result) };
    }

    // Prepare streaming statement
    let select_sql = CString::new("SELECT * FROM test_stream ORDER BY id").unwrap();
    let stream_handle = unsafe { absurder_stmt_prepare_stream(handle, select_sql.as_ptr()) };
    assert_ne!(stream_handle, 0);

    // Fetch only 2 batches (200 rows) then close
    let mut total_rows = 0;
    for _ in 0..2 {
        let batch_json = unsafe { absurder_stmt_fetch_next(stream_handle, 100) };
        assert!(!batch_json.is_null());

        let batch_str = unsafe { CStr::from_ptr(batch_json) }.to_str().unwrap();
        let batch: Vec<serde_json::Value> = serde_json::from_str(batch_str).unwrap();
        
        unsafe { absurder_free_string(batch_json) };
        total_rows += batch.len();
    }

    assert_eq!(total_rows, 200, "Expected 200 rows, got {}", total_rows);

    // Close stream early (should cleanup remaining rows)
    let close_result = unsafe { absurder_stmt_stream_close(stream_handle) };
    assert_eq!(close_result, 0);

    // Cleanup
    unsafe { absurder_db_close(handle) };
}

#[test]
fn test_streaming_statement_empty_result() {
    // Create database
    let name = CString::new("test_streaming_empty.db").unwrap();
    let handle = unsafe { absurder_db_new(name.as_ptr()) };
    assert_ne!(handle, 0);

    // Drop and recreate table for clean test state
    let drop_sql = CString::new("DROP TABLE IF EXISTS test_stream").unwrap();
    let drop_result = unsafe { absurder_db_execute(handle, drop_sql.as_ptr()) };
    if !drop_result.is_null() {
        unsafe { absurder_free_string(drop_result) };
    }

    // Create table (no data)
    let create_sql = CString::new("CREATE TABLE test_stream (id INTEGER PRIMARY KEY, value TEXT)").unwrap();
    let create_result = unsafe { absurder_db_execute(handle, create_sql.as_ptr()) };
    assert!(!create_result.is_null());
    unsafe { absurder_free_string(create_result) };

    // Prepare streaming statement on empty table
    let select_sql = CString::new("SELECT * FROM test_stream").unwrap();
    let stream_handle = unsafe { absurder_stmt_prepare_stream(handle, select_sql.as_ptr()) };
    assert_ne!(stream_handle, 0);

    // First fetch should return empty array
    let batch_json = unsafe { absurder_stmt_fetch_next(stream_handle, 100) };
    assert!(!batch_json.is_null());

    let batch_str = unsafe { CStr::from_ptr(batch_json) }.to_str().unwrap();
    let batch: Vec<serde_json::Value> = serde_json::from_str(batch_str).unwrap();
    
    unsafe { absurder_free_string(batch_json) };
    assert_eq!(batch.len(), 0, "Expected empty result");

    // Close stream
    let close_result = unsafe { absurder_stmt_stream_close(stream_handle) };
    assert_eq!(close_result, 0);

    // Cleanup
    unsafe { absurder_db_close(handle) };
}

#[test]
fn test_streaming_statement_invalid_handle() {
    // Try to fetch from non-existent stream
    let batch_json = unsafe { absurder_stmt_fetch_next(99999, 100) };
    assert!(batch_json.is_null(), "Expected null for invalid handle");

    // Try to close non-existent stream
    let close_result = unsafe { absurder_stmt_stream_close(99999) };
    assert_eq!(close_result, -1, "Expected -1 for invalid handle");
}

#[test]
fn test_streaming_statement_configurable_batch_size() {
    // Create database
    let name = CString::new("test_streaming_batch.db").unwrap();
    let handle = unsafe { absurder_db_new(name.as_ptr()) };
    assert_ne!(handle, 0);

    // Drop and recreate table for clean test state
    let drop_sql = CString::new("DROP TABLE IF EXISTS test_stream").unwrap();
    let drop_result = unsafe { absurder_db_execute(handle, drop_sql.as_ptr()) };
    if !drop_result.is_null() {
        unsafe { absurder_free_string(drop_result) };
    }

    // Create table and insert test data
    let create_sql = CString::new("CREATE TABLE test_stream (id INTEGER PRIMARY KEY, value TEXT)").unwrap();
    let create_result = unsafe { absurder_db_execute(handle, create_sql.as_ptr()) };
    assert!(!create_result.is_null());
    unsafe { absurder_free_string(create_result) };

    // Insert 500 rows
    for i in 0..500 {
        let insert_sql = CString::new(format!("INSERT INTO test_stream VALUES ({}, 'value{}')", i, i)).unwrap();
        let result = unsafe { absurder_db_execute(handle, insert_sql.as_ptr()) };
        assert!(!result.is_null());
        unsafe { absurder_free_string(result) };
    }

    // Prepare streaming statement
    let select_sql = CString::new("SELECT * FROM test_stream ORDER BY id").unwrap();
    let stream_handle = unsafe { absurder_stmt_prepare_stream(handle, select_sql.as_ptr()) };
    assert_ne!(stream_handle, 0);

    // Fetch with batch size of 50
    let batch_json = unsafe { absurder_stmt_fetch_next(stream_handle, 50) };
    assert!(!batch_json.is_null());

    let batch_str = unsafe { CStr::from_ptr(batch_json) }.to_str().unwrap();
    let batch: Vec<serde_json::Value> = serde_json::from_str(batch_str).unwrap();
    
    unsafe { absurder_free_string(batch_json) };
    assert_eq!(batch.len(), 50, "Expected batch size of 50");

    // Close stream
    let close_result = unsafe { absurder_stmt_stream_close(stream_handle) };
    assert_eq!(close_result, 0);

    // Cleanup
    unsafe { absurder_db_close(handle) };
}
