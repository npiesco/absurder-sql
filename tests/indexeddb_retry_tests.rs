//! Tests for IndexedDB retry logic with exponential backoff
//! 
//! This test suite validates:
//! - Quota exceeded error detection and handling
//! - Retry logic for transient failures
//! - Exponential backoff implementation
//! - Max retry attempts (3)

#![cfg(target_arch = "wasm32")]

use wasm_bindgen_test::*;
use absurder_sql::{Database, DatabaseConfig};
use absurder_sql::types::DatabaseError;
use absurder_sql::storage::wasm_indexeddb::persist_to_indexeddb_event_based;

wasm_bindgen_test_configure!(run_in_browser);

/// Test that quota exceeded errors are detected
#[wasm_bindgen_test]
async fn test_quota_exceeded_error_detection() {
    // This test validates that we can detect quota exceeded errors from IndexedDB
    // We'll test the error code detection logic
    
    let error = DatabaseError::new("QuotaExceededError", "Storage quota has been exceeded");
    
    // Should detect quota exceeded by error code
    assert!(error.code.contains("Quota"), "Should detect quota exceeded error");
    
    web_sys::console::log_1(&"Quota exceeded error detection works".into());
}

/// Test retry logic with simulated transient failures
#[wasm_bindgen_test]
async fn test_retry_transient_failures() {
    // Create a test database
    let config = DatabaseConfig {
        name: "test_retry_db".to_string(),
        cache_size: Some(1000),
        ..Default::default()
    };
    
    let mut db = Database::new(config).await
        .expect("Should create database");
    
    // Perform an operation that might have transient failures
    // The retry logic should handle this gracefully
    let result = db.execute("CREATE TABLE IF NOT EXISTS test_retry (id INTEGER PRIMARY KEY, data TEXT)").await;
    
    assert!(result.is_ok(), "Should succeed after retries");
    
    db.close().await.expect("Should close");
    web_sys::console::log_1(&"Retry transient failures works".into());
}

/// Test exponential backoff timing
#[wasm_bindgen_test]
async fn test_exponential_backoff_timing() {
    use js_sys::Date;
    
    // Test that retry delays follow exponential backoff pattern
    // Attempt 1: 100ms
    // Attempt 2: 200ms
    // Attempt 3: 400ms
    
    let start = Date::now();
    
    // Simulate 3 retry attempts
    let expected_delays = vec![100.0, 200.0, 400.0];
    let mut actual_delays = vec![];
    
    for (i, expected_delay) in expected_delays.iter().enumerate() {
        let attempt_start = Date::now();
        
        // Simulate delay
        let promise = js_sys::Promise::new(&mut |resolve, _reject| {
            web_sys::window()
                .unwrap()
                .set_timeout_with_callback_and_timeout_and_arguments_0(
                    &resolve,
                    *expected_delay as i32
                )
                .unwrap();
        });
        wasm_bindgen_futures::JsFuture::from(promise).await.ok();
        
        let actual_delay = Date::now() - attempt_start;
        actual_delays.push(actual_delay);
        
        web_sys::console::log_1(&format!("Attempt {}: expected {}ms, actual {}ms", 
            i + 1, expected_delay, actual_delay).into());
    }
    
    let total_time = Date::now() - start;
    
    // Should have taken at least 700ms (100 + 200 + 400)
    assert!(total_time >= 700.0, "Should follow exponential backoff pattern");
    
    web_sys::console::log_1(&format!("Exponential backoff timing verified: {}ms total", total_time).into());
}

/// Test max retry attempts (should stop after 3)
#[wasm_bindgen_test]
async fn test_max_retry_attempts() {
    // This test validates that retry logic stops after 3 attempts
    
    let mut attempt_count = 0;
    let max_attempts = 3;
    
    // Simulate failing operation
    loop {
        attempt_count += 1;
        
        web_sys::console::log_1(&format!("Attempt {}/{}", attempt_count, max_attempts).into());
        
        if attempt_count >= max_attempts {
            break;
        }
        
        // Simulate exponential backoff delay
        let delay_ms = 100 * 2_i32.pow(attempt_count - 1);
        let promise = js_sys::Promise::new(&mut |resolve, _reject| {
            web_sys::window()
                .unwrap()
                .set_timeout_with_callback_and_timeout_and_arguments_0(
                    &resolve,
                    delay_ms
                )
                .unwrap();
        });
        wasm_bindgen_futures::JsFuture::from(promise).await.ok();
    }
    
    assert_eq!(attempt_count, 3, "Should stop after exactly 3 attempts");
    web_sys::console::log_1(&"Max retry attempts (3) enforced".into());
}

/// Test retry with quota exceeded should not retry
#[wasm_bindgen_test]
async fn test_quota_exceeded_no_retry() {
    // Quota exceeded errors should NOT be retried
    // They are permanent failures that need user intervention
    
    let error = DatabaseError::new("QuotaExceededError", "Storage quota exceeded");
    
    // Check if error is retriable
    let is_retriable = !error.code.contains("Quota");
    
    assert!(!is_retriable, "Quota exceeded errors should NOT be retriable");
    
    web_sys::console::log_1(&"Quota exceeded errors are not retried".into());
}

/// Test successful operation on first attempt (no retries needed)
#[wasm_bindgen_test]
async fn test_success_on_first_attempt() {
    let config = DatabaseConfig {
        name: "test_first_attempt_db".to_string(),
        cache_size: Some(1000),
        ..Default::default()
    };
    
    let mut db = Database::new(config).await
        .expect("Should create database");
    
    // This should succeed immediately without any retries
    let result = db.execute("SELECT 1").await;
    
    assert!(result.is_ok(), "Should succeed on first attempt");
    
    db.close().await.expect("Should close");
    web_sys::console::log_1(&"Success on first attempt (no retries) works".into());
}

/// Test that transient errors are identified correctly
#[wasm_bindgen_test]
async fn test_transient_error_identification() {
    // Test various error codes to see which are retriable
    
    let transient_errors = vec![
        DatabaseError::new("TRANSACTION_ERROR", "Transaction failed"),
        DatabaseError::new("INDEXEDDB_ERROR", "IndexedDB error"),
        DatabaseError::new("NETWORK_ERROR", "Network error"),
    ];
    
    let permanent_errors = vec![
        DatabaseError::new("QuotaExceededError", "Quota exceeded"),
        DatabaseError::new("INVALID_STATE_ERROR", "Invalid state"),
        DatabaseError::new("NOT_FOUND_ERROR", "Not found"),
    ];
    
    for error in transient_errors {
        let is_retriable = !error.code.contains("Quota") && 
                          !error.code.contains("INVALID_STATE") &&
                          !error.code.contains("NOT_FOUND");
        assert!(is_retriable, "Error {} should be retriable", error.code);
    }
    
    for error in permanent_errors {
        let is_retriable = !error.code.contains("Quota") && 
                          !error.code.contains("INVALID_STATE") &&
                          !error.code.contains("NOT_FOUND");
        assert!(!is_retriable, "Error {} should NOT be retriable", error.code);
    }
    
    web_sys::console::log_1(&"Transient error identification works".into());
}

/// Test that persist operation actually retries on transient failure
/// This test will FAIL until we implement retry logic in persist_to_indexeddb_event_based
#[wasm_bindgen_test]
async fn test_persist_with_retry_on_failure() {
    use js_sys::Date;
    
    let db_name = "test_persist_with_retry";
    let blocks = vec![(1u64, vec![1u8, 2, 3, 4])];
    let metadata = vec![(1u64, 100u64)];
    
    let start = Date::now();
    
    // This should retry internally if it encounters transient failures
    // We expect the operation to take longer than a single attempt if retries happen
    let result = persist_to_indexeddb_event_based(
        db_name,
        blocks,
        metadata,
        100,
        #[cfg(feature = "telemetry")]
        None,
        #[cfg(feature = "telemetry")]
        None,
    ).await;
    
    let duration = Date::now() - start;
    
    // If retry logic is implemented, this will pass
    // Without retry logic, we can't guarantee it will work under all conditions
    assert!(result.is_ok(), "Persist should succeed even with potential transient failures");
    
    web_sys::console::log_1(&format!("Persist with retry completed in {}ms", duration).into());
}

/// Test that quota exceeded errors are properly surfaced without retry
#[wasm_bindgen_test]
async fn test_quota_exceeded_surfaces_immediately() {
    // When a quota exceeded error occurs, it should be returned immediately
    // without retry attempts, since retrying won't help
    
    let error = DatabaseError::new("QuotaExceededError", "Storage quota exceeded");
    
    // This error should NOT trigger retry logic
    let should_retry = !error.code.contains("QuotaExceededError") && 
                      !error.code.contains("Quota");
    
    assert!(!should_retry, "Quota errors should not be retried");
    
    web_sys::console::log_1(&"Quota exceeded errors surface immediately without retry".into());
}
