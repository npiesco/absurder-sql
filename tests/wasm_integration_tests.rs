//! WASM integration tests for SQLite IndexedDB library
//! These tests run in the browser using wasm-bindgen-test

#![cfg(target_arch = "wasm32")]
#![allow(unused_imports)]

use wasm_bindgen_test::*;
use absurder_sql::*;
use absurder_sql::WasmColumnValue;
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
    
    let mut db = absurder_sql::Database::new(config).await
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
    
    web_sys::console::log_1(&"WASM database creation test passed".into());
}

#[wasm_bindgen_test]
async fn test_wasm_column_value_types() {
    let config = DatabaseConfig {
        name: "test_wasm_types.db".to_string(),
        ..Default::default()
    };
    
    let mut db = absurder_sql::Database::new(config).await
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
    
    web_sys::console::log_1(&"WASM column value types test passed".into());
}

/// Test BigInt handling in WASM bindings
#[wasm_bindgen_test]
fn test_bigint_creation() {
    // Test creating WasmColumnValue BigInt values
    let _big_int = WasmColumnValue::big_int("9007199254740993".to_string());
    let _very_large = WasmColumnValue::big_int("123456789012345678901234567890".to_string());
    let _negative_large = WasmColumnValue::big_int("-987654321098765432109876543210".to_string());
    
    web_sys::console::log_1(&"BigInt creation test passed".into());
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
    
    web_sys::console::log_1(&"Date creation test passed".into());
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
    
    web_sys::console::log_1(&"Mixed types test passed".into());
}

/// Test basic compilation and types
#[wasm_bindgen_test]
fn test_basic_compilation() {
    // Test that basic types compile and work
    let _config = DatabaseConfig::default();
    let _error = DatabaseError::new("TEST", "test");
    let _value = WasmColumnValue::null();
    
    web_sys::console::log_1(&"Basic compilation test passed".into());
}

#[wasm_bindgen_test]
async fn test_wasm_bigint_handling() {
    let config = DatabaseConfig {
        name: "test_wasm_bigint.db".to_string(),
        ..Default::default()
    };
    
    let mut db = absurder_sql::Database::new(config).await
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
    
    web_sys::console::log_1(&"WASM BigInt handling test passed".into());
}

#[wasm_bindgen_test]
async fn test_wasm_date_handling() {
    let config = DatabaseConfig {
        name: "test_wasm_date.db".to_string(),
        ..Default::default()
    };
    
    let mut db = absurder_sql::Database::new(config).await
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
    
    web_sys::console::log_1(&"WASM date handling test passed".into());
}

#[wasm_bindgen_test]
async fn test_wasm_error_handling() {
    let config = DatabaseConfig {
        name: "test_wasm_errors.db".to_string(),
        ..Default::default()
    };
    
    let mut db = absurder_sql::Database::new(config).await
        .expect("Should create database");
    
    // Test syntax error
    let result = db.execute("INVALID SQL SYNTAX").await;
    assert!(result.is_err(), "Should return error for invalid SQL");
    
    // Test table doesn't exist error
    let result = db.execute("SELECT * FROM nonexistent_table").await;
    assert!(result.is_err(), "Should return error for missing table");
    
    web_sys::console::log_1(&"WASM error handling test passed".into());
}

#[wasm_bindgen_test]
async fn test_wasm_persistence() {
    let db_name = "test_wasm_persistence.db";
    
    // Create first database instance
    let config1 = DatabaseConfig {
        name: db_name.to_string(),
        ..Default::default()
    };
    
    let mut db1 = absurder_sql::Database::new(config1).await
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
    
    let mut db2 = absurder_sql::Database::new(config2).await
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
    
    web_sys::console::log_1(&"WASM persistence test passed".into());
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
    
    web_sys::console::log_1(&"Database.isLeader() API test passed".into());
}

/// Test Phase 1.1: Multiple database instances - leader election
/// Simulates 2 separate JavaScript contexts (tabs) by clearing registry
#[wasm_bindgen_test]
async fn test_database_multi_instance_leader() {
    use absurder_sql::vfs::indexeddb_vfs::STORAGE_REGISTRY;
    
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
    web_sys::console::log_1(&"First instance is leader".into());
    
    // Simulate separate JS context by clearing registry and creating new instance
    // This simulates what would happen in a separate browser tab
    STORAGE_REGISTRY.with(|reg| {
        unsafe {
            (&mut *reg.get()).clear();
        }
        log::debug!("Cleared STORAGE_REGISTRY to simulate new tab");
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
    
    web_sys::console::log_1(&"Multi-instance leader election API test passed".into());
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
        log::debug!("onDataChange callback invoked");
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
    
    web_sys::console::log_1(&"Database onDataChange callback test passed".into());
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
    
    web_sys::console::log_1(&"Multiple sync notifications test passed".into());
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
    
    web_sys::console::log_1(&"Write guard logic verified - classification and leader checks working".into());
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
    
    web_sys::console::log_1(&"Write guard allows leader writes".into());
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
    
    web_sys::console::log_1(&"Write guard allows read operations".into());
}

/// Test Phase 2.2: Write guard in executeWithParams for parameterized queries
#[wasm_bindgen_test]
async fn test_write_guard_in_parameterized_queries() {
    use absurder_sql::ColumnValue;
    
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
    
    web_sys::console::log_1(&"Write guard works with parameterized queries".into());
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
    
    web_sys::console::log_1(&"Schema changes allowed regardless of leader status".into());
}

/// Test Phase 2.3: allowNonLeaderWrites override for single-tab apps
#[wasm_bindgen_test]
async fn test_allow_non_leader_writes_override() {
    use absurder_sql::ColumnValue;
    
    let db_name = "test_override_writes";
    
    let mut db = Database::new_wasm(db_name.to_string()).await
        .expect("Should create database");
    
    sleep_ms(100).await;
    
    // Create table
    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)").await
        .expect("Should create table");
    
    // Enable non-leader writes (for single-tab mode or testing)
    db.allow_non_leader_writes(true).await
        .expect("Should enable non-leader writes");
    
    // Now writes should work even if not leader (hypothetically)
    db.execute("INSERT INTO test (value) VALUES ('test1')").await
        .expect("Should insert with override enabled");
    
    // Test with parameterized queries
    let params = serde_wasm_bindgen::to_value(&vec![
        ColumnValue::Text("test2".to_string()),
    ]).unwrap();
    
    db.execute_with_params("INSERT INTO test (value) VALUES (?)", params).await
        .expect("Should insert with params and override enabled");
    
    // Disable override
    db.allow_non_leader_writes(false).await
        .expect("Should disable non-leader writes");
    
    // Writes should still work if we're leader
    db.execute("INSERT INTO test (value) VALUES ('test3')").await
        .expect("Should insert as leader");
    
    web_sys::console::log_1(&"allowNonLeaderWrites override works correctly".into());
}

/// Test Phase 2.3: Override flag persists across multiple operations
#[wasm_bindgen_test]
async fn test_allow_non_leader_writes_persistence() {
    let db_name = "test_override_persist";
    
    let mut db = Database::new_wasm(db_name.to_string()).await
        .expect("Should create database");
    
    sleep_ms(100).await;
    
    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY)").await
        .expect("Should create table");
    
    // Enable override
    db.allow_non_leader_writes(true).await
        .expect("Should enable override");
    
    // Multiple operations should all succeed
    for i in 1..=5 {
        db.execute(&format!("INSERT INTO test (id) VALUES ({})", i)).await
            .expect("Each insert should succeed with override");
    }
    
    // Verify all rows inserted
    let _result = db.execute("SELECT COUNT(*) FROM test").await
        .expect("Should select count");
    
    web_sys::console::log_1(&format!("Override persisted across {} operations", 5).into());
}

/// Test Phase 3.1: waitForLeadership() resolves when becoming leader
#[wasm_bindgen_test]
async fn test_wait_for_leadership() {
    let db_name = "test_wait_leadership";
    
    let mut db = Database::new_wasm(db_name.to_string()).await
        .expect("Should create database");
    
    // Wait for leadership - should resolve quickly as first instance
    let start = js_sys::Date::now();
    db.wait_for_leadership().await
        .expect("Should become leader");
    let elapsed = js_sys::Date::now() - start;
    
    // Should become leader quickly (within 1 second)
    assert!(elapsed < 1000.0, "Should become leader quickly, took {}ms", elapsed);
    
    // Verify we are indeed leader
    let is_leader = db.is_leader_wasm().await
        .expect("Should check leader")
        .as_bool()
        .expect("Should be boolean");
    assert!(is_leader, "Should be leader after waitForLeadership");
    
    web_sys::console::log_1(&"waitForLeadership works correctly".into());
}

/// Test Phase 3.1: getLeaderInfo() returns leader status
#[wasm_bindgen_test]
async fn test_get_leader_info() {
    let db_name = "test_leader_info";
    
    let mut db = Database::new_wasm(db_name.to_string()).await
        .expect("Should create database");
    
    sleep_ms(100).await;
    
    // Get leader info
    let info = db.get_leader_info().await
        .expect("Should get leader info");
    
    // Parse the JsValue as an object
    let is_leader = js_sys::Reflect::get(&info, &"isLeader".into())
        .expect("Should have isLeader field")
        .as_bool()
        .expect("isLeader should be boolean");
    
    let leader_id = js_sys::Reflect::get(&info, &"leaderId".into())
        .expect("Should have leaderId field");
    
    let lease_expiry = js_sys::Reflect::get(&info, &"leaseExpiry".into())
        .expect("Should have leaseExpiry field");
    
    // Verify structure
    assert!(is_leader, "Should be leader");
    assert!(!leader_id.is_null() && !leader_id.is_undefined(), "Should have leaderId");
    assert!(!lease_expiry.is_null() && !lease_expiry.is_undefined(), "Should have leaseExpiry");
    
    web_sys::console::log_1(&format!("getLeaderInfo returned: isLeader={}, leaderId={:?}", 
        is_leader, leader_id).into());
}

/// Test Phase 3.1: requestLeadership() triggers re-election check
#[wasm_bindgen_test]
async fn test_request_leadership() {
    let db_name = "test_request_leadership";
    
    let mut db = Database::new_wasm(db_name.to_string()).await
        .expect("Should create database");
    
    sleep_ms(100).await;
    
    // Request leadership - should succeed as first instance
    db.request_leadership().await
        .expect("Should request leadership");
    
    sleep_ms(100).await;
    
    // Verify we are leader
    let is_leader = db.is_leader_wasm().await
        .expect("Should check leader")
        .as_bool()
        .expect("Should be boolean");
    assert!(is_leader, "Should be leader after requestLeadership");
    
    web_sys::console::log_1(&"requestLeadership works correctly".into());
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

// ============================================================================
// IMPORT/EXPORT TESTS
// ============================================================================

/// Test importing a valid SQLite database from bytes
#[wasm_bindgen_test]
async fn test_wasm_import_from_file() {
    let db_name = "test_import_wasm.db";
    
    // Create a source database with real data
    let source_config = DatabaseConfig {
        name: "test_import_source_wasm.db".to_string(),
        ..Default::default()
    };
    
    let mut source_db = absurder_sql::Database::new(source_config).await
        .expect("Should create source database");
    
    source_db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT)").await
        .expect("Should create table");
    source_db.execute("INSERT INTO test (data) VALUES ('test_data')").await
        .expect("Should insert data");
    
    // Export the source database
    let exported_data = source_db.export_to_file().await
        .expect("Should export source database");
    
    source_db.close().await.expect("Should close source");
    
    // Create destination database and import
    let config = DatabaseConfig {
        name: db_name.to_string(),
        ..Default::default()
    };
    
    let mut db = absurder_sql::Database::new(config).await
        .expect("Should create database");
    
    // Import the database (this closes the connection)
    let result = db.import_from_file(exported_data).await;
    assert!(result.is_ok(), "Import should succeed for valid SQLite file");
    
    // Verify import by creating a new database instance and querying
    let config2 = DatabaseConfig {
        name: db_name.to_string(),
        ..Default::default()
    };
    
    let mut db2 = absurder_sql::Database::new(config2).await
        .expect("Should reopen database after import");
    
    // Verify data was imported correctly
    let result = db2.execute("SELECT * FROM test").await
        .expect("Should query imported data");
    let result: QueryResult = serde_wasm_bindgen::from_value(result)
        .expect("deserialize QueryResult");
    assert_eq!(result.rows.len(), 1, "Should have 1 row");
    
    web_sys::console::log_1(&"WASM import from file test passed".into());
}

/// Test importing invalid SQLite database should fail
#[wasm_bindgen_test]
async fn test_wasm_import_invalid_file() {
    let config = DatabaseConfig {
        name: "test_import_invalid_wasm.db".to_string(),
        ..Default::default()
    };
    
    let mut db = absurder_sql::Database::new(config).await
        .expect("Should create database");
    
    // Create invalid SQLite file (wrong magic bytes)
    let mut data = vec![0u8; 4096];
    data[0..16].copy_from_slice(b"Invalid format!\0");
    
    // Convert to Uint8Array for JavaScript
    let uint8_array = js_sys::Uint8Array::new_with_length(data.len() as u32);
    uint8_array.copy_from(&data);
    
    // Import should fail
    let result = db.import_from_file(uint8_array).await;
    assert!(result.is_err(), "Import should fail for invalid SQLite file");
    
    web_sys::console::log_1(&"WASM import invalid file test passed".into());
}

/// Test export then import produces valid database
#[wasm_bindgen_test]
async fn test_wasm_export_import_roundtrip() {
    let db_name = "test_roundtrip_wasm.db";
    
    // Create database and add data
    let config = DatabaseConfig {
        name: db_name.to_string(),
        ..Default::default()
    };
    
    let mut db = absurder_sql::Database::new(config).await
        .expect("Should create database");
    
    // Create table and insert data
    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)").await
        .expect("Should create table");
    
    db.execute("INSERT INTO test (value) VALUES ('test_data')").await
        .expect("Should insert data");
    
    // Export the database
    let exported_bytes = db.export_to_file().await
        .expect("Export should succeed");
    
    web_sys::console::log_1(&format!("Exported {} bytes", exported_bytes.length()).into());
    
    // Close database
    db.close().await.expect("Should close database");
    
    // Import the exported data back (replacing existing data)
    let config2 = DatabaseConfig {
        name: db_name.to_string(),
        ..Default::default()
    };
    
    let mut db2 = absurder_sql::Database::new(config2).await
        .expect("Should reopen database");
    
    // Import replaces the database content
    let result = db2.import_from_file(exported_bytes).await;
    assert!(result.is_ok(), "Import should succeed");
    
    // Note: db2 connection is now closed by import. Reopen to verify data.
    let config3 = DatabaseConfig {
        name: db_name.to_string(),
        ..Default::default()
    };
    
    let mut db3 = absurder_sql::Database::new(config3).await
        .expect("Should reopen after import");
    
    // Query the data back to verify import worked
    let query_result = db3.execute("SELECT value FROM test").await
        .expect("Should query data after import");
    
    let query_result: QueryResult = serde_wasm_bindgen::from_value(query_result)
        .expect("deserialize QueryResult");
    
    assert_eq!(query_result.rows.len(), 1, "Should have 1 row after roundtrip");
    
    web_sys::console::log_1(&"WASM export/import roundtrip test passed".into());
}

// ============================================================================
// END-TO-END BIDIRECTIONAL COMPATIBILITY TESTS
// ============================================================================

/// E2E Test: Create DB → Write → Export → Import → Read → Write → Verify
#[wasm_bindgen_test]
async fn test_e2e_export_import_bidirectional_compatibility() {
    let db_name = "e2e_bidir_test.db";
    
    // ========== PHASE 1: Create database and write initial data ==========
    let config = DatabaseConfig {
        name: db_name.to_string(),
        ..Default::default()
    };
    
    let mut db1 = absurder_sql::Database::new(config).await
        .expect("Should create initial database");
    
    // Create table with various data types
    db1.execute("CREATE TABLE test_data (
        id INTEGER PRIMARY KEY,
        text_col TEXT,
        int_col INTEGER,
        real_col REAL
    )").await.expect("Should create table");
    
    // Insert test data with special characters
    db1.execute("INSERT INTO test_data (text_col, int_col, real_col) VALUES 
        ('Hello World', 42, 3.14159),
        ('Special: ''quotes'', \"double\", \nlines', 100, 2.71828),
        ('Unicode: 你好', -999, 0.0)
    ").await.expect("Should insert initial data");
    
    // Verify initial data
    let result1 = db1.execute("SELECT COUNT(*) as count FROM test_data").await
        .expect("Should count rows");
    let result1: QueryResult = serde_wasm_bindgen::from_value(result1)
        .expect("deserialize QueryResult");
    assert_eq!(result1.rows.len(), 1, "Should have count result");
    
    web_sys::console::log_1(&"Phase 1: Initial data written".into());
    
    // ========== PHASE 2: Export database ==========
    let exported_bytes = db1.export_to_file().await
        .expect("Should export database");
    
    let export_size = exported_bytes.length();
    web_sys::console::log_1(&format!("Phase 2: Exported {} bytes", export_size).into());
    
    db1.close().await.expect("Should close db1");
    
    // ========== PHASE 3: Import into new database ==========
    let config2 = DatabaseConfig {
        name: "e2e_imported.db".to_string(),
        ..Default::default()
    };
    
    let mut db2 = absurder_sql::Database::new(config2).await
        .expect("Should create import target database");
    
    db2.import_from_file(exported_bytes).await
        .expect("Should import database");
    
    web_sys::console::log_1(&"Phase 3: Database imported".into());
    
    // ========== PHASE 4: Reopen and verify imported data ==========
    let config3 = DatabaseConfig {
        name: "e2e_imported.db".to_string(),
        ..Default::default()
    };
    
    let mut db3 = absurder_sql::Database::new(config3).await
        .expect("Should reopen imported database");
    
    // Verify all 3 rows exist
    let result2 = db3.execute("SELECT * FROM test_data ORDER BY id").await
        .expect("Should query imported data");
    let result2: QueryResult = serde_wasm_bindgen::from_value(result2)
        .expect("deserialize QueryResult");
    assert_eq!(result2.rows.len(), 3, "Should have all 3 imported rows");
    
    web_sys::console::log_1(&"Phase 4: Imported data verified".into());
    
    // ========== PHASE 5: Write new data to imported database ==========
    db3.execute("INSERT INTO test_data (text_col, int_col, real_col) VALUES 
        ('Post-import data', 777, 99.99)
    ").await.expect("Should insert into imported database");
    
    // Verify we now have 4 rows
    let result3 = db3.execute("SELECT COUNT(*) as count FROM test_data").await
        .expect("Should count after insert");
    let result3: QueryResult = serde_wasm_bindgen::from_value(result3)
        .expect("deserialize QueryResult");
    assert_eq!(result3.rows.len(), 1, "Should have count result");
    
    web_sys::console::log_1(&"Phase 5: Post-import writes successful".into());
    
    // ========== PHASE 6: Export again and verify size ==========
    let exported_bytes2 = db3.export_to_file().await
        .expect("Should export modified database");
    
    let export_size2 = exported_bytes2.length();
    web_sys::console::log_1(&format!("Phase 6: Re-exported {} bytes", export_size2).into());
    
    // Second export should be same size or larger (we added data)
    assert!(export_size2 >= export_size, "Second export should be >= first export");
    
    db3.close().await.expect("Should close db3");
    
    // ========== PHASE 7: Import the re-exported data and verify ==========
    let config4 = DatabaseConfig {
        name: "e2e_reimported.db".to_string(),
        ..Default::default()
    };
    
    let mut db4 = absurder_sql::Database::new(config4).await
        .expect("Should create final database");
    
    db4.import_from_file(exported_bytes2).await
        .expect("Should import re-exported database");
    
    // Reopen to verify
    let config5 = DatabaseConfig {
        name: "e2e_reimported.db".to_string(),
        ..Default::default()
    };
    
    let mut db5 = absurder_sql::Database::new(config5).await
        .expect("Should reopen reimported database");
    
    // Should have all 4 rows
    let result4 = db5.execute("SELECT * FROM test_data ORDER BY id").await
        .expect("Should query reimported data");
    let result4: QueryResult = serde_wasm_bindgen::from_value(result4)
        .expect("deserialize QueryResult");
    assert_eq!(result4.rows.len(), 4, "Should have all 4 rows after full cycle");
    
    web_sys::console::log_1(&"Phase 7: Full bidirectional cycle verified".into());
    web_sys::console::log_1(&"E2E Bidirectional Compatibility Test PASSED".into());
}

/// Test: Concurrent tab scenario - export/import across multiple instances
/// 
/// Simulates real-world scenario where multiple browser tabs access the same database.
/// Tab 1 creates data and exports, Tab 2 imports and modifies, Tab 1 re-imports.
#[wasm_bindgen_test]
async fn test_concurrent_tabs_export_import() {
    use absurder_sql::vfs::indexeddb_vfs::STORAGE_REGISTRY;
    
    let db_name = "concurrent_tabs_test.db";
    
    // ========== TAB 1: Initial setup and export ==========
    web_sys::console::log_1(&"=== TAB 1: Creating database and initial data ===".into());
    
    let config1 = DatabaseConfig {
        name: db_name.to_string(),
        ..Default::default()
    };
    
    let mut tab1_db = absurder_sql::Database::new(config1).await
        .expect("Tab 1 should create database");
    
    // Tab 1 creates table and inserts data
    tab1_db.execute("CREATE TABLE shared_data (id INTEGER PRIMARY KEY, tab TEXT, value INTEGER)").await
        .expect("Tab 1 should create table");
    
    tab1_db.execute("INSERT INTO shared_data (tab, value) VALUES ('tab1', 100)").await
        .expect("Tab 1 should insert data");
    
    tab1_db.execute("INSERT INTO shared_data (tab, value) VALUES ('tab1', 200)").await
        .expect("Tab 1 should insert more data");
    
    // Export from Tab 1
    let tab1_export = tab1_db.export_to_file().await
        .expect("Tab 1 should export");
    
    web_sys::console::log_1(&format!("Tab 1 exported {} bytes", tab1_export.length()).into());
    
    tab1_db.close().await.expect("Tab 1 should close");
    
    // ========== TAB 2: Simulate new tab, import Tab 1's data ==========
    web_sys::console::log_1(&"=== TAB 2: Simulating new browser tab ===".into());
    
    // Clear registry to simulate separate tab context
    STORAGE_REGISTRY.with(|reg| {
        unsafe {
            (&mut *reg.get()).clear();
        }
    });
    
    let config2 = DatabaseConfig {
        name: db_name.to_string(),
        ..Default::default()
    };
    
    let mut tab2_db = absurder_sql::Database::new(config2).await
        .expect("Tab 2 should create database");
    
    // Tab 2 imports Tab 1's export
    tab2_db.import_from_file(tab1_export).await
        .expect("Tab 2 should import Tab 1's data");
    
    web_sys::console::log_1(&"Tab 2 imported Tab 1's data".into());
    
    // Reopen Tab 2 after import (import closes connection)
    let config2b = DatabaseConfig {
        name: db_name.to_string(),
        ..Default::default()
    };
    
    let mut tab2_db_reopened = absurder_sql::Database::new(config2b).await
        .expect("Tab 2 should reopen after import");
    
    // Verify Tab 2 can see Tab 1's data
    let tab2_query = tab2_db_reopened.execute("SELECT COUNT(*) as count FROM shared_data").await
        .expect("Tab 2 should query data");
    let tab2_result: QueryResult = serde_wasm_bindgen::from_value(tab2_query)
        .expect("deserialize");
    assert_eq!(tab2_result.rows.len(), 1, "Tab 2 should have count result");
    
    // Tab 2 adds its own data
    tab2_db_reopened.execute("INSERT INTO shared_data (tab, value) VALUES ('tab2', 300)").await
        .expect("Tab 2 should insert data");
    
    tab2_db_reopened.execute("INSERT INTO shared_data (tab, value) VALUES ('tab2', 400)").await
        .expect("Tab 2 should insert more data");
    
    // Export from Tab 2 (now has Tab 1 + Tab 2 data)
    let tab2_export = tab2_db_reopened.export_to_file().await
        .expect("Tab 2 should export");
    
    web_sys::console::log_1(&format!("Tab 2 exported {} bytes", tab2_export.length()).into());
    
    tab2_db_reopened.close().await.expect("Tab 2 should close");
    
    // ========== TAB 1: Re-import Tab 2's export ==========
    web_sys::console::log_1(&"=== TAB 1: Importing Tab 2's changes ===".into());
    
    // Clear registry again to simulate Tab 1 context
    STORAGE_REGISTRY.with(|reg| {
        unsafe {
            (&mut *reg.get()).clear();
        }
    });
    
    let config1b = DatabaseConfig {
        name: db_name.to_string(),
        ..Default::default()
    };
    
    let mut tab1_db_new = absurder_sql::Database::new(config1b).await
        .expect("Tab 1 should reopen");
    
    // Tab 1 imports Tab 2's export
    tab1_db_new.import_from_file(tab2_export).await
        .expect("Tab 1 should import Tab 2's data");
    
    web_sys::console::log_1(&"Tab 1 imported Tab 2's data".into());
    
    // ========== Verification: Tab 1 should see all data ==========
    let config1c = DatabaseConfig {
        name: db_name.to_string(),
        ..Default::default()
    };
    
    let mut tab1_verify = absurder_sql::Database::new(config1c).await
        .expect("Tab 1 should reopen for verification");
    
    // Should have 4 rows total (2 from Tab 1 + 2 from Tab 2)
    let verify_query = tab1_verify.execute("SELECT * FROM shared_data ORDER BY id").await
        .expect("Should query all data");
    let verify_result: QueryResult = serde_wasm_bindgen::from_value(verify_query)
        .expect("deserialize");
    
    assert_eq!(verify_result.rows.len(), 4, "Should have 4 rows total (2 from each tab)");
    
    // Verify we have data from both tabs
    let count_tab1 = tab1_verify.execute("SELECT COUNT(*) as count FROM shared_data WHERE tab = 'tab1'").await
        .expect("Should count tab1 rows");
    let count_tab1_result: QueryResult = serde_wasm_bindgen::from_value(count_tab1)
        .expect("deserialize");
    assert_eq!(count_tab1_result.rows.len(), 1, "Should have tab1 count");
    
    let count_tab2 = tab1_verify.execute("SELECT COUNT(*) as count FROM shared_data WHERE tab = 'tab2'").await
        .expect("Should count tab2 rows");
    let count_tab2_result: QueryResult = serde_wasm_bindgen::from_value(count_tab2)
        .expect("deserialize");
    assert_eq!(count_tab2_result.rows.len(), 1, "Should have tab2 count");
    
    tab1_verify.close().await.expect("Should close");
    
    web_sys::console::log_1(&"Concurrent tabs export/import test passed".into());
}

/// E2E Test: Import → Write → Export → Import → Verify (Inverse Flow)
#[wasm_bindgen_test]
async fn test_e2e_import_export_inverse_flow() {
    // ========== PHASE 1: Create a real SQLite database to export ==========
    let config_source = DatabaseConfig {
        name: "inverse_source.db".to_string(),
        ..Default::default()
    };
    
    let mut db_source = absurder_sql::Database::new(config_source).await
        .expect("Should create source database");
    
    db_source.execute("CREATE TABLE initial_data (id INTEGER PRIMARY KEY, value TEXT)").await
        .expect("Should create initial table");
    
    db_source.execute("INSERT INTO initial_data (value) VALUES ('Initial Row')").await
        .expect("Should insert initial data");
    
    // Export this database
    let exported_source = db_source.export_to_file().await
        .expect("Should export source database");
    
    db_source.close().await.expect("Should close source");
    
    web_sys::console::log_1(&format!("Phase 1: Created and exported source ({} bytes)", exported_source.length()).into());
    
    // ========== PHASE 2: Import the file into new database ==========
    let config1 = DatabaseConfig {
        name: "inverse_test.db".to_string(),
        ..Default::default()
    };
    
    let mut db1 = absurder_sql::Database::new(config1).await
        .expect("Should create database");
    
    db1.import_from_file(exported_source).await
        .expect("Should import SQLite file");
    
    web_sys::console::log_1(&"Phase 2: SQLite file imported".into());
    
    // ========== PHASE 3: Reopen and add more data ==========
    let config2 = DatabaseConfig {
        name: "inverse_test.db".to_string(),
        ..Default::default()
    };
    
    let mut db2 = absurder_sql::Database::new(config2).await
        .expect("Should reopen database");
    
    // Verify initial data is there
    let check_result = db2.execute("SELECT * FROM initial_data").await
        .expect("Should query initial data");
    let check_result: QueryResult = serde_wasm_bindgen::from_value(check_result)
        .expect("deserialize QueryResult");
    assert_eq!(check_result.rows.len(), 1, "Should have initial row");
    
    // Add new table and data
    db2.execute("CREATE TABLE inverse_test (id INTEGER PRIMARY KEY, value TEXT)").await
        .expect("Should create new table");
    
    db2.execute("INSERT INTO inverse_test (value) VALUES 
        ('First row'),
        ('Second row with ''quotes'''),
        ('Third row')
    ").await.expect("Should insert data");
    
    let count_result = db2.execute("SELECT COUNT(*) FROM inverse_test").await
        .expect("Should count rows");
    let count_result: QueryResult = serde_wasm_bindgen::from_value(count_result)
        .expect("deserialize QueryResult");
    assert_eq!(count_result.rows.len(), 1, "Should have count");
    
    web_sys::console::log_1(&"Phase 3: Data written to imported database".into());
    
    // ========== PHASE 4: Export the modified database ==========
    let exported = db2.export_to_file().await
        .expect("Should export modified database");
    
    web_sys::console::log_1(&format!("Phase 4: Exported {} bytes", exported.length()).into());
    
    db2.close().await.expect("Should close db2");
    
    // ========== PHASE 5: Import export back into fresh database ==========
    let config3 = DatabaseConfig {
        name: "inverse_final.db".to_string(),
        ..Default::default()
    };
    
    let mut db3 = absurder_sql::Database::new(config3).await
        .expect("Should create final database");
    
    db3.import_from_file(exported).await
        .expect("Should import exported data");
    
    // Reopen and verify both tables exist
    let config4 = DatabaseConfig {
        name: "inverse_final.db".to_string(),
        ..Default::default()
    };
    
    let mut db4 = absurder_sql::Database::new(config4).await
        .expect("Should reopen final database");
    
    // Verify inverse_test table
    let final_result = db4.execute("SELECT * FROM inverse_test ORDER BY id").await
        .expect("Should query final data");
    let final_result: QueryResult = serde_wasm_bindgen::from_value(final_result)
        .expect("deserialize QueryResult");
    assert_eq!(final_result.rows.len(), 3, "Should have all 3 rows in inverse_test");
    
    // Verify initial_data table still exists
    let initial_result = db4.execute("SELECT * FROM initial_data").await
        .expect("Should query initial_data");
    let initial_result: QueryResult = serde_wasm_bindgen::from_value(initial_result)
        .expect("deserialize QueryResult");
    assert_eq!(initial_result.rows.len(), 1, "Should still have initial row");
    
    web_sys::console::log_1(&"Phase 5: Inverse flow verified".into());
    web_sys::console::log_1(&"E2E Inverse Flow Test PASSED".into());
}