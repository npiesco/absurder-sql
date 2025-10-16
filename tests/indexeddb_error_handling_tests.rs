//! Tests for IndexedDB error handling
//! 
//! This test suite validates that IndexedDB operations properly handle
//! and report errors instead of panicking on unwrap()

#![cfg(target_arch = "wasm32")]

use wasm_bindgen_test::*;
use absurder_sql::storage::wasm_indexeddb::{restore_from_indexeddb, persist_to_indexeddb_event_based};

wasm_bindgen_test_configure!(run_in_browser);

/// Test that restore_from_indexeddb returns a Result instead of bool
#[wasm_bindgen_test]
async fn test_restore_returns_result_type() {
    let db_name = "test_error_handling_db";
    
    // Now returns Result<(), DatabaseError> as desired
    let result: Result<(), absurder_sql::types::DatabaseError> = restore_from_indexeddb(db_name).await;
    
    // Should return a Result type
    match result {
        Ok(_) => web_sys::console::log_1(&"Restore returned Ok".into()),
        Err(e) => web_sys::console::log_1(&format!("Restore returned Err: {}", e.message).into()),
    }
}

/// Test that persist operations handle transaction failures gracefully
#[wasm_bindgen_test]
async fn test_persist_handles_transaction_errors() {
    let db_name = "test_persist_error_db";
    let blocks = vec![(1u64, vec![1u8, 2, 3, 4])];
    let metadata = vec![(1u64, 100u64)];
    
    // This should not panic even if there are issues
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
    
    // Should return either Ok or Err, not panic
    match result {
        Ok(_) => {
            web_sys::console::log_1(&"Persist succeeded".into());
        }
        Err(e) => {
            web_sys::console::log_1(&format!("Persist failed gracefully with error: {}", e.message).into());
            // Error should have a proper code
            assert!(!e.code.is_empty(), "Error code should be set");
            // Error message should be descriptive
            assert!(e.message.len() > 10, "Error message should be descriptive");
        }
    }
}

/// Test persist operations with empty data
#[wasm_bindgen_test]
async fn test_persist_empty_data() {
    let db_name = "test_persist_empty_db";
    let blocks = vec![];
    let metadata = vec![];
    
    // Should handle empty data without panicking
    let result = persist_to_indexeddb_event_based(
        db_name,
        blocks,
        metadata,
        0,
        #[cfg(feature = "telemetry")]
        None,
        #[cfg(feature = "telemetry")]
        None,
    ).await;
    
    match result {
        Ok(_) => web_sys::console::log_1(&"Empty persist succeeded".into()),
        Err(e) => {
            web_sys::console::log_1(&format!("Empty persist handled: {}", e.message).into());
            assert!(!e.code.is_empty());
        }
    }
}

/// Test persist with large blocks
#[wasm_bindgen_test]
async fn test_persist_large_blocks() {
    let db_name = "test_persist_large_db";
    // Create a large block (1MB)
    let large_data = vec![0u8; 1024 * 1024];
    let blocks = vec![(1u64, large_data)];
    let metadata = vec![(1u64, 1000u64)];
    
    // Should handle large data without panicking
    let result = persist_to_indexeddb_event_based(
        db_name,
        blocks,
        metadata,
        1000,
        #[cfg(feature = "telemetry")]
        None,
        #[cfg(feature = "telemetry")]
        None,
    ).await;
    
    match result {
        Ok(_) => web_sys::console::log_1(&"Large block persist succeeded".into()),
        Err(e) => {
            web_sys::console::log_1(&format!("Large block error handled: {}", e.message).into());
        }
    }
}

/// Test error messages are descriptive
#[wasm_bindgen_test]
async fn test_error_messages_are_descriptive() {
    // Test that when errors occur, they have meaningful messages
    let db_name = "test_descriptive_errors";
    let blocks = vec![];
    let metadata = vec![];
    
    let result = persist_to_indexeddb_event_based(
        db_name,
        blocks,
        metadata,
        0,
        #[cfg(feature = "telemetry")]
        None,
        #[cfg(feature = "telemetry")]
        None,
    ).await;
    
    if let Err(e) = result {
        // Error message should be more than just "error"
        assert!(
            e.message.len() > 5,
            "Error message should be descriptive, got: {}",
            e.message
        );
        // Error code should be set
        assert!(!e.code.is_empty(), "Error code should not be empty");
    }
}

/// Test that missing IndexedDB support is handled gracefully
/// (This is theoretical since we're running in a browser, but tests the code path)
#[wasm_bindgen_test]
async fn test_missing_indexeddb_support_handled() {
    // In a real scenario where IndexedDB is not available,
    // the code should return an error, not panic
    
    let db_name = "test_no_indexeddb";
    
    // Now returns Result - no panic on missing IndexedDB
    let result = restore_from_indexeddb(db_name).await;
    
    // Should handle gracefully whether IndexedDB is available or not
    match result {
        Ok(_) => web_sys::console::log_1(&"IndexedDB available and handled".into()),
        Err(e) => {
            web_sys::console::log_1(&format!("IndexedDB error handled gracefully: {}", e.code).into());
            // If it fails, it should have proper error codes
            assert!(!e.code.is_empty(), "Error code should be set");
        }
    }
}

/// Test concurrent access errors are handled
#[wasm_bindgen_test]
async fn test_concurrent_access_errors() {
    use absurder_sql::Database;
    
    let db_name = "test_concurrent_db";
    
    // Create database instance
    let _db = Database::new_wasm(db_name.to_string()).await
        .expect("Should create database");
    
    // Try to perform operations that might have concurrent access issues
    // This should not panic but return meaningful errors
    let result = persist_to_indexeddb_event_based(
        db_name,
        vec![(1, vec![1, 2, 3])],
        vec![(1, 1)],
        1,
        #[cfg(feature = "telemetry")]
        None,
        #[cfg(feature = "telemetry")]
        None,
    ).await;
    
    // Should handle gracefully
    match result {
        Ok(_) => web_sys::console::log_1(&"Handled concurrent access successfully".into()),
        Err(_) => web_sys::console::log_1(&"Handled concurrent access error gracefully".into()),
    }
}
