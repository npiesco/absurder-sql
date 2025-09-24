// Metrics tests: sync counter increments on timer and debounce-driven flushes

#![cfg(not(target_arch = "wasm32"))]
use sqlite_indexeddb_rs::storage::{BlockStorage, BLOCK_SIZE, SyncPolicy};
use tempfile::TempDir;
use serial_test::serial;
#[path = "common/mod.rs"]
mod common;

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_sync_counter_increments_on_timer_flush() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let mut storage = BlockStorage::new_with_capacity("test_metrics_timer", 8)
        .await
        .expect("create storage");

    // Enable short-interval auto-sync
    storage.enable_auto_sync(50);

    // Make a block dirty
    storage
        .write_block(10, vec![1u8; BLOCK_SIZE])
        .await
        .expect("write block 10");

    // Wait for the timer to flush
    tokio::time::sleep(std::time::Duration::from_millis(150)).await;
    // Additional yield to ensure background tasks run
    tokio::task::yield_now().await;

    // Wait a bit more to ensure background sync completes
    tokio::time::sleep(std::time::Duration::from_millis(50)).await;

    // Expect at least one background sync and no dirty blocks
    assert_eq!(storage.get_dirty_count(), 0);
    // New API under test
    assert!(storage.get_sync_count() >= 1, "expected sync counter to increment after timer flush");
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_sync_counter_increments_on_debounce_flush() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let mut storage = BlockStorage::new_with_capacity("test_metrics_debounce", 8)
        .await
        .expect("create storage");

    let policy = SyncPolicy {
        interval_ms: None,
        max_dirty: None,
        max_dirty_bytes: Some(BLOCK_SIZE * 2),
        debounce_ms: Some(80),
        verify_after_write: false,
    };
    storage.enable_auto_sync_with_policy(policy);

    // Two writes exceed threshold; debounce will delay flush
    storage
        .write_block(20, vec![5u8; BLOCK_SIZE])
        .await
        .expect("write block 20");
    storage
        .write_block(21, vec![6u8; BLOCK_SIZE])
        .await
        .expect("write block 21");

    // Wait beyond debounce window
    tokio::time::sleep(std::time::Duration::from_millis(150)).await;

    // Expect a debounce-triggered flush and a recorded sync count
    assert_eq!(storage.get_dirty_count(), 0);
    assert!(storage.get_sync_count() >= 1, "expected sync counter to increment after debounce flush");
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_timer_vs_debounce_counters() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let mut storage = BlockStorage::new_with_capacity("test_metrics_split_counters", 8)
        .await
        .expect("create storage");

    // Use basic interval API
    storage.enable_auto_sync(40);
    storage
        .write_block(30, vec![7u8; BLOCK_SIZE])
        .await
        .expect("write block 30");
    tokio::time::sleep(std::time::Duration::from_millis(120)).await;
    assert_eq!(storage.get_dirty_count(), 0);
    // New granular APIs under test
    assert!(storage.get_timer_sync_count() >= 1, "expected timer counter to increment");
    assert_eq!(storage.get_debounce_sync_count(), 0, "debounce counter should remain zero");
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_last_sync_duration_is_set() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let mut storage = BlockStorage::new_with_capacity("test_metrics_duration", 8)
        .await
        .expect("create storage");

    let policy = SyncPolicy {
        interval_ms: None,
        max_dirty: None,
        max_dirty_bytes: Some(BLOCK_SIZE * 2),
        debounce_ms: Some(60),
        verify_after_write: false,
    };
    storage.enable_auto_sync_with_policy(policy);

    storage
        .write_block(40, vec![9u8; BLOCK_SIZE])
        .await
        .expect("write block 40");
    storage
        .write_block(41, vec![9u8; BLOCK_SIZE])
        .await
        .expect("write block 41");
    tokio::time::sleep(std::time::Duration::from_millis(140)).await;

    assert_eq!(storage.get_dirty_count(), 0);
    assert!(storage.get_debounce_sync_count() >= 1);
    assert!(storage.get_last_sync_duration_ms() > 0, "expected last sync duration to be recorded");
}
