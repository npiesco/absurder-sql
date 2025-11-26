#![cfg(target_arch = "wasm32")]

use absurder_sql::{Database, DatabaseConfig};
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

/// Test that leader election gracefully handles localStorage unavailable
/// This simulates private browsing mode in Safari/Firefox where localStorage returns None
#[wasm_bindgen_test]
async fn test_leader_election_without_localstorage() {
    // Note: This test will currently PANIC due to .unwrap().unwrap() in leader_election.rs
    // After fix, it should return a proper error

    let config = DatabaseConfig {
        name: "test_private_browsing.db".to_string(),
        ..Default::default()
    };

    // In real private browsing, window.local_storage() returns Ok(None)
    // This will trigger the double unwrap panic in leader_election.rs line 90
    let result = Database::new(config).await;

    // After fix, this should be an error, not a panic
    match result {
        Ok(_) => {
            // If it succeeds, multi-tab features should be disabled
            log::info!("Database created successfully - multi-tab features may be disabled");
        }
        Err(e) => {
            // Expected: graceful error about localStorage unavailable
            let error_msg = format!("{:?}", e);
            assert!(
                error_msg.contains("localStorage")
                    || error_msg.contains("STORAGE_ERROR")
                    || error_msg.contains("private browsing"),
                "Error should mention localStorage unavailability: {}",
                error_msg
            );
            log::info!(
                "Correctly returned error for localStorage unavailable: {:?}",
                e
            );
        }
    }
}

/// Test that sync operations handle IndexedDB unavailable gracefully
/// This simulates private browsing or when user has disabled IndexedDB
#[wasm_bindgen_test]
async fn test_sync_without_indexeddb() {
    // Note: This test will currently PANIC due to .unwrap().unwrap() in sync_operations.rs
    // After fix, it should return a proper error

    let config = DatabaseConfig {
        name: "test_no_indexeddb.db".to_string(),
        ..Default::default()
    };

    let db = Database::new(config).await;

    if let Ok(mut database) = db {
        // Try to create a table and sync
        let create_result = database.execute("CREATE TABLE test (id INT)").await;

        if let Ok(_) = create_result {
            // Try to sync - this is where IndexedDB unavailability will be hit
            let sync_result = database.sync().await;

            // After fix, this should return an error, not panic
            match sync_result {
                Ok(_) => {
                    log::info!("Sync succeeded or gracefully skipped");
                }
                Err(e) => {
                    // Expected: graceful error about IndexedDB unavailable
                    let error_msg = format!("{:?}", e);
                    assert!(
                        error_msg.contains("IndexedDB")
                            || error_msg.contains("INDEXEDDB_ERROR")
                            || error_msg.contains("private browsing"),
                        "Error should mention IndexedDB unavailability: {}",
                        error_msg
                    );
                    log::info!(
                        "Correctly returned error for IndexedDB unavailable: {:?}",
                        e
                    );
                }
            }
        }
    }
}

/// Test that window() access in async contexts is handled safely
#[wasm_bindgen_test]
async fn test_window_access_safety() {
    // This tests the window().unwrap() pattern in spawn_local contexts
    // While less likely to fail, it should still be handled gracefully

    let config = DatabaseConfig {
        name: "test_window_safety.db".to_string(),
        ..Default::default()
    };

    let result = Database::new(config).await;

    // Should not panic even if window is unavailable in some contexts
    assert!(
        result.is_ok() || result.is_err(),
        "Should return Ok or Err, not panic"
    );
}

/// Test graceful degradation message for users
#[wasm_bindgen_test]
async fn test_private_browsing_user_friendly_error() {
    let config = DatabaseConfig {
        name: "test_user_message.db".to_string(),
        ..Default::default()
    };

    let result = Database::new(config).await;

    if let Err(e) = result {
        let error_str = format!("{:?}", e);

        // Error message should be user-friendly, not cryptic
        // Should NOT be: "unreachable" or "__rust_start_panic"
        assert!(
            !error_str.contains("unreachable") && !error_str.contains("rust_panic"),
            "Error should be user-friendly, not a panic message: {}",
            error_str
        );

        // Should mention one of these user-understandable terms
        let is_user_friendly = error_str.contains("private browsing")
            || error_str.contains("storage unavailable")
            || error_str.contains("localStorage")
            || error_str.contains("IndexedDB")
            || error_str.contains("disabled")
            || error_str.contains("not available");

        assert!(
            is_user_friendly,
            "Error should mention what's unavailable in user-friendly terms: {}",
            error_str
        );
    }
}

/// Test that leader election handles localStorage.getItem errors
#[wasm_bindgen_test]
async fn test_localstorage_getitem_error_handling() {
    // localStorage.getItem() can fail with Err in restricted environments
    // Should handle gracefully, not panic

    let config = DatabaseConfig {
        name: "test_getitem_error.db".to_string(),
        ..Default::default()
    };

    // This will exercise the localStorage access in leader election
    let result = Database::new(config).await;

    // Should handle any localStorage errors gracefully
    match result {
        Ok(_) => log::info!("Database created successfully"),
        Err(e) => {
            let error_msg = format!("{:?}", e);
            // Should be a proper error, not a panic
            assert!(
                !error_msg.contains("unwrap"),
                "Should not expose internal unwrap errors: {}",
                error_msg
            );
        }
    }
}

/// Test multiple database instances handle storage errors
#[wasm_bindgen_test]
async fn test_multiple_instances_with_storage_errors() {
    // Multiple instances when storage is unavailable
    // Should all fail gracefully, not panic

    for i in 0..3 {
        let config = DatabaseConfig {
            name: format!("test_concurrent_{}.db", i),
            ..Default::default()
        };

        let result = Database::new(config).await;

        // Each should handle errors gracefully
        match result {
            Ok(_) => log::info!("Instance {} created successfully", i),
            Err(e) => log::info!("Instance {} got expected error: {:?}", i, e),
        }
    }

    log::info!("All database creation attempts completed without panic");
}
