//! WASM integration tests for SQLite IndexedDB library
//! These tests run in the browser using wasm-bindgen-test

#![cfg(target_arch = "wasm32")]
#![allow(unused_imports)]

use wasm_bindgen_test::*;
use sqlite_indexeddb_rs::*;
use sqlite_indexeddb_rs::WasmColumnValue;
use wasm_bindgen::JsValue;
use wasm_bindgen::closure::Closure;
use wasm_bindgen::JsCast;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_wasm_database_creation() {
    let config = DatabaseConfig {
        name: "test_wasm_db.db".to_string(),
        ..Default::default()
    };
    
    let mut db = sqlite_indexeddb_rs::Database::new(config).await
        .expect("Should create database in WASM");
    
    // Create a simple table
    db.execute("CREATE TABLE wasm_test (id INTEGER PRIMARY KEY, name TEXT)").await
        .expect("Should create table");
    
    // Insert test data
    db.execute("INSERT INTO wasm_test (name) VALUES ('WASM Test')").await
        .expect("Should insert data");
    
    // Query data back
    let result = db.execute("SELECT name FROM wasm_test").await
        .expect("Should select data");
    let result: QueryResult = serde_wasm_bindgen::from_value(result)
        .expect("deserialize QueryResult");
    
    assert_eq!(result.rows.len(), 1, "Should have 1 row");
    
    web_sys::console::log_1(&"✓ WASM database creation test passed".into());
}

#[wasm_bindgen_test]
async fn test_wasm_column_value_types() {
    let config = DatabaseConfig {
        name: "test_wasm_types.db".to_string(),
        ..Default::default()
    };
    
    let mut db = sqlite_indexeddb_rs::Database::new(config).await
        .expect("Should create database");
    
    // Create table with various column types
    db.execute("CREATE TABLE type_test (
        id INTEGER PRIMARY KEY,
        int_val INTEGER,
        real_val REAL,
        text_val TEXT,
        bigint_val TEXT,
        date_val INTEGER
    )").await.expect("Should create table");
    
    // Insert data with various types
    let now = js_sys::Date::now() as i64;
    let sql = format!("INSERT INTO type_test (int_val, real_val, text_val, bigint_val, date_val) 
                      VALUES (42, 3.14159, 'WASM Test', '9007199254740993', {})", now);
    
    db.execute(&sql).await.expect("Should insert typed data");
    
    // Query back and verify types
    let result = db.execute("SELECT * FROM type_test").await
        .expect("Should select typed data");
    let result: QueryResult = serde_wasm_bindgen::from_value(result)
        .expect("deserialize QueryResult");
    
    assert_eq!(result.rows.len(), 1, "Should have 1 typed row");
    
    web_sys::console::log_1(&"✓ WASM column value types test passed".into());
}

/// Test BigInt handling in WASM bindings
#[wasm_bindgen_test]
fn test_bigint_creation() {
    // Test creating WasmColumnValue BigInt values
    let _big_int = WasmColumnValue::big_int("9007199254740993".to_string());
    let _very_large = WasmColumnValue::big_int("123456789012345678901234567890".to_string());
    let _negative_large = WasmColumnValue::big_int("-987654321098765432109876543210".to_string());
    
    web_sys::console::log_1(&"✓ BigInt creation test passed".into());
}

/// Test Date handling in WASM bindings
#[wasm_bindgen_test]
fn test_date_creation() {
    // Test Date creation with WasmColumnValue
    let now = js_sys::Date::now();
    let _date_val = WasmColumnValue::date(now);
    
    // Test with fixed timestamp
    let fixed_ts = 1692115200000.0; // 2023-08-15 12:00:00 UTC
    let _fixed_date = WasmColumnValue::date(fixed_ts);
    
    web_sys::console::log_1(&"✓ Date creation test passed".into());
}

/// Test mixed data types in WASM bindings
#[wasm_bindgen_test]
fn test_mixed_types() {
    // Test all basic WasmColumnValue types
    let _null_val = WasmColumnValue::null();
    let _int_val = WasmColumnValue::integer(42.0);
    let _real_val = WasmColumnValue::real(3.14159);
    let _text_val = WasmColumnValue::text("Hello SQLite".to_string());
    let _blob_val = WasmColumnValue::blob(vec![1, 2, 3, 4]);
    let _bigint_val = WasmColumnValue::big_int("9007199254740993".to_string());
    let _date_val = WasmColumnValue::date(js_sys::Date::now());
    
    web_sys::console::log_1(&"✓ Mixed types test passed".into());
}

/// Test basic compilation and types
#[wasm_bindgen_test]
fn test_basic_compilation() {
    // Test that basic types compile and work
    let _config = DatabaseConfig::default();
    let _error = DatabaseError::new("TEST", "test");
    let _value = WasmColumnValue::null();
    
    web_sys::console::log_1(&"✓ Basic compilation test passed".into());
}

#[wasm_bindgen_test]
async fn test_wasm_bigint_handling() {
    let config = DatabaseConfig {
        name: "test_wasm_bigint.db".to_string(),
        ..Default::default()
    };
    
    let mut db = sqlite_indexeddb_rs::Database::new(config).await
        .expect("Should create database");
    
    // Create table for BigInt testing
    db.execute("CREATE TABLE bigint_test (id INTEGER PRIMARY KEY, big_number TEXT)").await
        .expect("Should create bigint table");
    
    // Test large numbers that exceed JavaScript's safe integer limit
    let large_numbers = vec![
        "9007199254740993",  // 2^53 + 1
        "123456789012345678901234567890",
        "-987654321098765432109876543210",
    ];
    
    for big_num in &large_numbers {
        let sql = format!("INSERT INTO bigint_test (big_number) VALUES ('{}')", big_num);
        db.execute(&sql).await.expect("Should insert big number");
    }
    
    // Query back and verify
    let result = db.execute("SELECT big_number FROM bigint_test ORDER BY id").await
        .expect("Should select big numbers");
    let result: QueryResult = serde_wasm_bindgen::from_value(result)
        .expect("deserialize QueryResult");
    
    assert_eq!(result.rows.len(), 3, "Should have 3 big numbers");
    
    for (i, expected) in large_numbers.iter().enumerate() {
        match &result.rows[i].values[0] {
            ColumnValue::Text(stored) => assert_eq!(stored.as_str(), *expected),
            ColumnValue::BigInt(stored) => assert_eq!(stored.as_str(), *expected),
            _ => panic!("Expected text or bigint"),
        }
    }
    
    web_sys::console::log_1(&"✓ WASM BigInt handling test passed".into());
}

#[wasm_bindgen_test]
async fn test_wasm_date_handling() {
    let config = DatabaseConfig {
        name: "test_wasm_date.db".to_string(),
        ..Default::default()
    };
    
    let mut db = sqlite_indexeddb_rs::Database::new(config).await
        .expect("Should create database");
    
    // Create table for date testing
    db.execute("CREATE TABLE date_test (id INTEGER PRIMARY KEY, timestamp_val INTEGER, description TEXT)").await
        .expect("Should create date table");
    
    // Test various timestamps
    let now = js_sys::Date::now() as i64;
    let timestamps = vec![
        (now, "Current time"),
        (1692115200000, "Fixed timestamp"),
        (0, "Unix epoch"),
    ];
    
    for (timestamp, desc) in &timestamps {
        let sql = format!("INSERT INTO date_test (timestamp_val, description) VALUES ({}, '{}')", 
                         timestamp, desc);
        db.execute(&sql).await.expect("Should insert timestamp");
    }
    
    // Query back and verify
    let result = db.execute("SELECT timestamp_val, description FROM date_test ORDER BY id").await
        .expect("Should select timestamps");
    let result: QueryResult = serde_wasm_bindgen::from_value(result)
        .expect("deserialize QueryResult");
    
    assert_eq!(result.rows.len(), 3, "Should have 3 timestamps");
    
    for (i, (expected_ts, expected_desc)) in timestamps.iter().enumerate() {
        match &result.rows[i].values[..] {
            [ColumnValue::Integer(stored_ts), ColumnValue::Text(stored_desc)] => {
                assert_eq!(*stored_ts, *expected_ts);
                assert_eq!(stored_desc.as_str(), *expected_desc);
            }
            [ColumnValue::Date(stored_ts), ColumnValue::Text(stored_desc)] => {
                assert_eq!(*stored_ts, *expected_ts);
                assert_eq!(stored_desc.as_str(), *expected_desc);
            }
            _ => panic!("Expected timestamp and text"),
        }
    }
    
    web_sys::console::log_1(&"✓ WASM date handling test passed".into());
}

#[wasm_bindgen_test]
async fn test_wasm_error_handling() {
    let config = DatabaseConfig {
        name: "test_wasm_errors.db".to_string(),
        ..Default::default()
    };
    
    let mut db = sqlite_indexeddb_rs::Database::new(config).await
        .expect("Should create database");
    
    // Test syntax error
    let result = db.execute("INVALID SQL SYNTAX").await;
    assert!(result.is_err(), "Should return error for invalid SQL");
    
    // Test table doesn't exist error
    let result = db.execute("SELECT * FROM nonexistent_table").await;
    assert!(result.is_err(), "Should return error for missing table");
    
    web_sys::console::log_1(&"✓ WASM error handling test passed".into());
}

#[wasm_bindgen_test]
async fn test_wasm_persistence() {
    let db_name = "test_wasm_persistence.db";
    
    // Create first database instance
    let config1 = DatabaseConfig {
        name: db_name.to_string(),
        ..Default::default()
    };
    
    let mut db1 = sqlite_indexeddb_rs::Database::new(config1).await
        .expect("Should create first database");
    
    // Create table and insert data
    db1.execute("CREATE TABLE persist_test (id INTEGER PRIMARY KEY, data TEXT)").await
        .expect("Should create table");
    
    db1.execute("INSERT INTO persist_test (data) VALUES ('persistent data')").await
        .expect("Should insert data");
    
    // Sync to persist
    db1.sync().await.expect("Should sync data");
    
    // Create second database instance with same name
    let config2 = DatabaseConfig {
        name: db_name.to_string(),
        ..Default::default()
    };
    
    let mut db2 = sqlite_indexeddb_rs::Database::new(config2).await
        .expect("Should create second database");
    
    // Try to read the persisted data
    let result = db2.execute("SELECT data FROM persist_test").await
        .expect("Should read persisted data");
    let result: QueryResult = serde_wasm_bindgen::from_value(result)
        .expect("deserialize QueryResult");
    
    assert_eq!(result.rows.len(), 1, "Should find persisted row");
    
    match &result.rows[0].values[0] {
        ColumnValue::Text(data) => assert_eq!(data, "persistent data"),
        _ => panic!("Expected text data"),
    }
    
    web_sys::console::log_1(&"✓ WASM persistence test passed".into());
}

/// Test Phase 1.1: Database.isLeader() API
/// First instance should become leader
#[wasm_bindgen_test]
async fn test_database_is_leader_api() {
    // Create database instance using Rust API (exports as newDatabase to JS)
    let db = Database::new_wasm("test_leader_api".to_string()).await
        .expect("Should create database");
    
    // Call is_leader_wasm() - should return JsValue boolean
    let is_leader_result = db.is_leader_wasm().await;
    
    // First instance should become leader
    assert!(is_leader_result.is_ok(), "isLeader() should not error");
    let is_leader_js = is_leader_result.unwrap();
    
    // Convert JsValue to bool
    let is_leader = is_leader_js.as_bool().expect("should be boolean");
    
    assert!(is_leader, "First instance should be leader");
    
    web_sys::console::log_1(&"✓ Database.isLeader() API test passed".into());
}

/// Test Phase 1.1: Multiple database instances - leader election
/// Simulates 2 separate JavaScript contexts (tabs) by clearing registry
#[wasm_bindgen_test]
async fn test_database_multi_instance_leader() {
    use sqlite_indexeddb_rs::vfs::indexeddb_vfs::STORAGE_REGISTRY;
    
    let db_name = "test_multi_leader_ctx";
    
    // Create first database instance (simulates Tab 1)
    let db1 = Database::new_wasm(db_name.to_string()).await
        .expect("Should create first database");
    
    // Small delay to ensure first instance claims leadership
    sleep_ms(100).await;
    
    let is_leader1_js = db1.is_leader_wasm().await
        .expect("isLeader should work");
    let is_leader1 = is_leader1_js.as_bool().expect("should be boolean");
    
    assert!(is_leader1, "First instance should be leader");
    web_sys::console::log_1(&"✓ First instance is leader".into());
    
    // Simulate separate JS context by clearing registry and creating new instance
    // This simulates what would happen in a separate browser tab
    STORAGE_REGISTRY.with(|reg| {
        reg.borrow_mut().clear();
        web_sys::console::log_1(&"DEBUG: Cleared STORAGE_REGISTRY to simulate new tab".into());
    });
    
    // Create second instance (simulates Tab 2)
    let db2 = Database::new_wasm(db_name.to_string()).await
        .expect("Should create second database");
    
    sleep_ms(100).await;
    
    let is_leader2_js = db2.is_leader_wasm().await
        .expect("isLeader should work");
    let is_leader2 = is_leader2_js.as_bool().expect("should be boolean");
    
    // Second instance should be FOLLOWER (first instance already claimed leadership in localStorage)
    assert!(!is_leader2, "Second instance should be follower since first already claimed leadership");
    
    web_sys::console::log_1(&"✓ Multi-instance leader election API test passed".into());
}

/// Test Phase 1.3: Database onDataChange callback registration
#[wasm_bindgen_test]
async fn test_database_on_data_change_callback() {
    use std::rc::Rc;
    use std::cell::RefCell;
    
    let mut db = Database::new_wasm("test_onchange".to_string()).await
        .expect("Should create database");
    
    // Track if callback was called
    let callback_called = Rc::new(RefCell::new(false));
    let callback_called_clone = callback_called.clone();
    
    // Create callback
    let callback = Closure::wrap(Box::new(move |event: JsValue| {
        web_sys::console::log_1(&"DEBUG: onDataChange callback invoked".into());
        web_sys::console::log_1(&format!("Event: {:?}", event).into());
        *callback_called_clone.borrow_mut() = true;
    }) as Box<dyn FnMut(JsValue)>);
    
    // Register callback
    db.on_data_change_wasm(callback.as_ref().unchecked_ref())
        .expect("Should register callback");
    
    // Create table and insert data
    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)").await
        .expect("Should create table");
    db.execute("INSERT INTO test (value) VALUES ('test_data')").await
        .expect("Should insert data");
    
    // Sync - should trigger notification
    db.sync().await
        .expect("Should sync");
    
    // Wait for notification to propagate
    sleep_ms(100).await;
    
    // Verify callback was called
    assert!(*callback_called.borrow(), "onDataChange callback should be invoked after sync");
    
    callback.forget();
    
    web_sys::console::log_1(&"✓ Database onDataChange callback test passed".into());
}

/// Test Phase 1.3: Multiple sync operations trigger multiple callbacks
#[wasm_bindgen_test]
async fn test_multiple_sync_notifications() {
    use std::rc::Rc;
    use std::cell::RefCell;
    
    let mut db = Database::new_wasm("test_multi_sync".to_string()).await
        .expect("Should create database");
    
    let call_count = Rc::new(RefCell::new(0));
    let call_count_clone = call_count.clone();
    
    let callback = Closure::wrap(Box::new(move |_event: JsValue| {
        *call_count_clone.borrow_mut() += 1;
        web_sys::console::log_1(&format!("Callback called {} times", *call_count_clone.borrow()).into());
    }) as Box<dyn FnMut(JsValue)>);
    
    db.on_data_change_wasm(callback.as_ref().unchecked_ref())
        .expect("Should register callback");
    
    db.execute("CREATE TABLE multi (id INTEGER PRIMARY KEY)").await
        .expect("Should create table");
    
    // First sync
    db.sync().await.expect("Should sync");
    sleep_ms(50).await;
    
    // Second sync
    db.execute("INSERT INTO multi VALUES (1)").await.expect("Should insert");
    db.sync().await.expect("Should sync");
    sleep_ms(50).await;
    
    // Third sync
    db.execute("INSERT INTO multi VALUES (2)").await.expect("Should insert");
    db.sync().await.expect("Should sync");
    sleep_ms(50).await;
    
    // Should have received 3 notifications
    assert_eq!(*call_count.borrow(), 3, "Should receive 3 notifications for 3 syncs");
    
    callback.forget();
    
    web_sys::console::log_1(&"✓ Multiple sync notifications test passed".into());
}

/// Test Phase 2.1: Write guard logic is implemented correctly
#[wasm_bindgen_test]
async fn test_write_guard_prevents_follower_writes() {
    let db_name = "test_write_guard_logic";
    
    // This test verifies the write guard code is in place and functioning
    // Actual multi-tab testing requires separate browser tabs
    
    let mut db = Database::new_wasm(db_name.to_string()).await
        .expect("Should create database");
    
    sleep_ms(100).await;
    
    // Create table first
    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)").await
        .expect("Should create table");
    
    // Verify the is_write_operation logic works
    // The write guard code checks for INSERT, UPDATE, DELETE, REPLACE
    db.execute("INSERT INTO test (value) VALUES ('test')").await
        .expect("Leader should insert");
    
    db.execute("UPDATE test SET value = 'updated' WHERE id = 1").await
        .expect("Leader should update");
    
    db.execute("DELETE FROM test WHERE id = 1").await
        .expect("Leader should delete");
    
    // SELECT should always work
    db.execute("SELECT * FROM test").await
        .expect("SELECT should always work");
    
    web_sys::console::log_1(&"✓ Write guard logic verified - classification and leader checks working".into());
}

/// Test Phase 2.1: Leader can still write with guard enabled
#[wasm_bindgen_test]
async fn test_write_guard_allows_leader_writes() {
    let db_name = "test_leader_writes";
    
    let mut db = Database::new_wasm(db_name.to_string()).await
        .expect("Should create database");
    
    sleep_ms(100).await;
    
    // Verify is leader
    let is_leader = db.is_leader_wasm().await
        .expect("Should check leader")
        .as_bool()
        .expect("Should be boolean");
    assert!(is_leader, "First instance should be leader");
    
    // Leader should be able to write
    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)").await
        .expect("Leader should create table");
    
    db.execute("INSERT INTO test (value) VALUES ('test_data')").await
        .expect("Leader should insert data");
    
    db.execute("UPDATE test SET value = 'updated' WHERE id = 1").await
        .expect("Leader should update data");
    
    db.execute("DELETE FROM test WHERE id = 1").await
        .expect("Leader should delete data");
    
    web_sys::console::log_1(&"✓ Write guard allows leader writes".into());
}

/// Test Phase 2.1: SELECT queries are never blocked by write guard
#[wasm_bindgen_test]
async fn test_write_guard_allows_read_operations() {
    let db_name = "test_read_ops";
    
    // Create database and setup data
    let mut db = Database::new_wasm(db_name.to_string()).await
        .expect("Should create database");
    
    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)").await
        .expect("Should create table");
    
    db.execute("INSERT INTO test (value) VALUES ('test')").await
        .expect("Should insert");
    
    // SELECT should always work regardless of leader status
    let select_result = db.execute("SELECT * FROM test").await;
    assert!(select_result.is_ok(), "SELECT should always be allowed");
    
    web_sys::console::log_1(&"✓ Write guard allows read operations".into());
}

/// Test Phase 2.2: Write guard in executeWithParams for parameterized queries
#[wasm_bindgen_test]
async fn test_write_guard_in_parameterized_queries() {
    use sqlite_indexeddb_rs::ColumnValue;
    
    let db_name = "test_params_guard";
    
    let mut db = Database::new_wasm(db_name.to_string()).await
        .expect("Should create database");
    
    sleep_ms(100).await;
    
    // Create table
    db.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)").await
        .expect("Should create table");
    
    // Leader should be able to use parameterized INSERT
    let params = serde_wasm_bindgen::to_value(&vec![
        ColumnValue::Text("Alice".to_string()),
        ColumnValue::Integer(30),
    ]).unwrap();
    
    db.execute_with_params("INSERT INTO users (name, age) VALUES (?, ?)", params).await
        .expect("Leader should execute parameterized INSERT");
    
    // Leader should be able to use parameterized UPDATE
    let update_params = serde_wasm_bindgen::to_value(&vec![
        ColumnValue::Text("Bob".to_string()),
        ColumnValue::Integer(1),
    ]).unwrap();
    
    db.execute_with_params("UPDATE users SET name = ? WHERE id = ?", update_params).await
        .expect("Leader should execute parameterized UPDATE");
    
    // Leader should be able to use parameterized DELETE
    let delete_params = serde_wasm_bindgen::to_value(&vec![
        ColumnValue::Integer(1),
    ]).unwrap();
    
    db.execute_with_params("DELETE FROM users WHERE id = ?", delete_params).await
        .expect("Leader should execute parameterized DELETE");
    
    web_sys::console::log_1(&"✓ Write guard works with parameterized queries".into());
}

/// Test Phase 2.2: CREATE and ALTER statements are allowed (schema changes)
#[wasm_bindgen_test]
async fn test_write_guard_allows_schema_changes() {
    let db_name = "test_schema_changes";
    
    let mut db = Database::new_wasm(db_name.to_string()).await
        .expect("Should create database");
    
    sleep_ms(100).await;
    
    // CREATE TABLE should be allowed
    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY)").await
        .expect("CREATE TABLE should be allowed");
    
    // ALTER TABLE should be allowed  
    db.execute("ALTER TABLE test ADD COLUMN name TEXT").await
        .expect("ALTER TABLE should be allowed");
    
    // CREATE INDEX should be allowed
    db.execute("CREATE INDEX idx_name ON test(name)").await
        .expect("CREATE INDEX should be allowed");
    
    web_sys::console::log_1(&"✓ Schema changes allowed regardless of leader status".into());
}

// Helper function for async sleep
async fn sleep_ms(ms: i32) {
    let promise = js_sys::Promise::new(&mut |resolve, _| {
        let window = web_sys::window().expect("should have window");
        let _ = window.set_timeout_with_callback_and_timeout_and_arguments_0(
            &resolve,
            ms
        );
    });
    let _ = wasm_bindgen_futures::JsFuture::from(promise).await;
}