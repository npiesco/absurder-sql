//! Tests for WASM string safety and error handling
//! Validates that null bytes and invalid strings are handled gracefully

#![cfg(target_arch = "wasm32")]

use absurder_sql::*;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_string_with_null_byte_in_insert() {
    let config = DatabaseConfig {
        name: "test_null_byte_insert.db".to_string(),
        ..Default::default()
    };

    let mut db = Database::new(config).await.expect("Should create database");

    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)")
        .await
        .expect("Should create table");

    // Test 1: String with null byte in the middle
    let result = db
        .execute("INSERT INTO test (id, value) VALUES (1, 'hello\0world')")
        .await;

    // Should either succeed (null byte stripped) or fail gracefully with clear error
    match result {
        Ok(_) => {
            // If it succeeds, verify the data was inserted (possibly sanitized)
            let select_result = db
                .execute("SELECT value FROM test WHERE id = 1")
                .await
                .expect("Should select data");
            let query_result: QueryResult =
                serde_wasm_bindgen::from_value(select_result).expect("Should deserialize");
            assert_eq!(query_result.rows.len(), 1, "Should have 1 row");
            web_sys::console::log_1(&"Null byte handled gracefully (sanitized)".into());
        }
        Err(e) => {
            // If it fails, error should be clear
            let error_str = format!("{:?}", e);
            web_sys::console::log_1(
                &format!("Null byte rejected with error: {}", error_str).into(),
            );
            assert!(
                !error_str.contains("unwrap"),
                "Error should not contain 'unwrap'"
            );
        }
    }
}

#[wasm_bindgen_test]
async fn test_string_with_null_byte_in_select() {
    let config = DatabaseConfig {
        name: "test_null_byte_select.db".to_string(),
        ..Default::default()
    };

    let mut db = Database::new(config).await.expect("Should create database");

    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)")
        .await
        .expect("Should create table");

    // Insert normal data first
    db.execute("INSERT INTO test (id, value) VALUES (1, 'test')")
        .await
        .expect("Should insert data");

    // Try to query with null byte in WHERE clause
    let result = db
        .execute("SELECT * FROM test WHERE value = 'test\0data'")
        .await;

    // Should handle gracefully
    match result {
        Ok(result) => {
            let query_result: QueryResult =
                serde_wasm_bindgen::from_value(result).expect("Should deserialize");
            web_sys::console::log_1(
                &format!(
                    "Query with null byte succeeded, rows: {}",
                    query_result.rows.len()
                )
                .into(),
            );
        }
        Err(e) => {
            let error_str = format!("{:?}", e);
            web_sys::console::log_1(&format!("Query with null byte handled: {}", error_str).into());
            assert!(
                !error_str.contains("unwrap"),
                "Error should not contain 'unwrap'"
            );
        }
    }
}

#[wasm_bindgen_test]
async fn test_empty_string_handling() {
    let config = DatabaseConfig {
        name: "test_empty_string.db".to_string(),
        ..Default::default()
    };

    let mut db = Database::new(config).await.expect("Should create database");

    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)")
        .await
        .expect("Should create table");

    // Empty strings should work fine
    db.execute("INSERT INTO test (id, value) VALUES (1, '')")
        .await
        .expect("Should insert empty string");

    let result = db
        .execute("SELECT value FROM test WHERE id = 1")
        .await
        .expect("Should select data");

    let query_result: QueryResult =
        serde_wasm_bindgen::from_value(result).expect("Should deserialize");

    assert_eq!(query_result.rows.len(), 1, "Should have 1 row");
    web_sys::console::log_1(&"Empty string handled correctly".into());
}

#[wasm_bindgen_test]
async fn test_special_characters_in_string() {
    let config = DatabaseConfig {
        name: "test_special_chars.db".to_string(),
        ..Default::default()
    };

    let mut db = Database::new(config).await.expect("Should create database");

    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)")
        .await
        .expect("Should create table");

    // Test various special characters (but not null bytes)
    let test_strings = vec![
        "hello'world",  // Single quote
        "hello\"world", // Double quote
        "hello\nworld", // Newline
        "hello\tworld", // Tab
        "hello\\world", // Backslash
        "helloworld",   // Emoji
        "日本語テスト", // Unicode
    ];

    for (idx, test_str) in test_strings.iter().enumerate() {
        let sql = format!(
            "INSERT INTO test (id, value) VALUES ({}, '{}')",
            idx + 1,
            test_str.replace("'", "''")
        );
        db.execute(&sql)
            .await
            .expect(&format!("Should insert special string: {}", test_str));
    }

    let result = db
        .execute("SELECT COUNT(*) as count FROM test")
        .await
        .expect("Should count rows");

    let query_result: QueryResult =
        serde_wasm_bindgen::from_value(result).expect("Should deserialize");

    assert_eq!(query_result.rows.len(), 1, "Should have count result");
    web_sys::console::log_1(&"Special characters handled correctly".into());
}

#[wasm_bindgen_test]
async fn test_very_long_string() {
    let config = DatabaseConfig {
        name: "test_long_string.db".to_string(),
        ..Default::default()
    };

    let mut db = Database::new(config).await.expect("Should create database");

    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)")
        .await
        .expect("Should create table");

    // Create a very long string (10KB)
    let long_string = "a".repeat(10_000);
    let sql = format!("INSERT INTO test (id, value) VALUES (1, '{}')", long_string);

    db.execute(&sql).await.expect("Should insert long string");

    let result = db
        .execute("SELECT LENGTH(value) as len FROM test WHERE id = 1")
        .await
        .expect("Should get length");

    let query_result: QueryResult =
        serde_wasm_bindgen::from_value(result).expect("Should deserialize");

    assert_eq!(query_result.rows.len(), 1, "Should have length result");
    web_sys::console::log_1(&"Long string handled correctly".into());
}
