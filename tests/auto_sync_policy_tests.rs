// Threshold-based auto-sync tests using SyncPolicy

#![cfg(not(target_arch = "wasm32"))]
use sqlite_indexeddb_rs::storage::{BlockStorage, BLOCK_SIZE, SyncPolicy};
use std::env;
use tempfile::TempDir;
use serial_test::serial;

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_threshold_based_flush_on_max_dirty() {
    let tmp = TempDir::new().expect("tempdir");
    unsafe { env::set_var("DATASYNC_FS_BASE", tmp.path()); }
    let mut storage = BlockStorage::new_with_capacity("test_policy_threshold", 8)
        .await
        .expect("create storage");

    // Policy: no timer (huge interval), flush when >= 2 dirty blocks
    let policy = SyncPolicy {
        interval_ms: Some(10_000),
        max_dirty: Some(2),
        max_dirty_bytes: None,
        debounce_ms: None,
        verify_after_write: false,
    };
    storage.enable_auto_sync_with_policy(policy);

    // First dirty block -> should not flush yet
    storage
        .write_block(100, vec![9u8; BLOCK_SIZE])
        .await
        .expect("write block 100");
    assert_eq!(storage.get_dirty_count(), 1);

    // Second dirty block -> should hit threshold and flush immediately
    storage
        .write_block(101, vec![8u8; BLOCK_SIZE])
        .await
        .expect("write block 101");

    // Expect flush without waiting or follow-up op
    assert_eq!(storage.get_dirty_count(), 0);
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_max_dirty_bytes_flush_respects_debounce() {
    let tmp = TempDir::new().expect("tempdir");
    unsafe { env::set_var("DATASYNC_FS_BASE", tmp.path()); }
    let mut storage = BlockStorage::new_with_capacity("test_policy_bytes", 8)
        .await
        .expect("create storage");

    // Policy: no timer, flush when >= 2*BLOCK_SIZE bytes, with debounce of 120ms
    let policy = SyncPolicy {
        interval_ms: None,
        max_dirty: None,
        max_dirty_bytes: Some(BLOCK_SIZE * 2),
        debounce_ms: Some(120),
        verify_after_write: false,
    };
    storage.enable_auto_sync_with_policy(policy);

    // Two writes exceed bytes threshold, but debounce should delay flush
    storage
        .write_block(200, vec![1u8; BLOCK_SIZE])
        .await
        .expect("write block 200");
    storage
        .write_block(201, vec![2u8; BLOCK_SIZE])
        .await
        .expect("write block 201");

    // Immediately after, should not flush
    assert_eq!(storage.get_dirty_count(), 2);
    tokio::time::sleep(std::time::Duration::from_millis(60)).await;
    // Still within debounce window
    assert_eq!(storage.get_dirty_count(), 2);
    tokio::time::sleep(std::time::Duration::from_millis(100)).await;
    // After debounce window of inactivity, dirty set should be flushed
    assert_eq!(storage.get_dirty_count(), 0);
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_debounce_resets_on_continued_writes() {
    let tmp = TempDir::new().expect("tempdir");
    unsafe { env::set_var("DATASYNC_FS_BASE", tmp.path()); }
    let mut storage = BlockStorage::new_with_capacity("test_policy_debounce", 8)
        .await
        .expect("create storage");

    let policy = SyncPolicy {
        interval_ms: None,
        max_dirty: Some(1),
        max_dirty_bytes: None,
        debounce_ms: Some(80),
        verify_after_write: false,
    };
    storage.enable_auto_sync_with_policy(policy);

    // First write hits threshold, but debounce delays flush
    storage
        .write_block(300, vec![7u8; BLOCK_SIZE])
        .await
        .expect("write block 300");
    assert_eq!(storage.get_dirty_count(), 1);

    // Keep writing within debounce window to reset debounce
    tokio::time::sleep(std::time::Duration::from_millis(40)).await;
    storage
        .write_block(301, vec![6u8; BLOCK_SIZE])
        .await
        .expect("write block 301");
    assert!(storage.get_dirty_count() >= 1);

    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    // Another write before debounce expires
    storage
        .write_block(302, vec![5u8; BLOCK_SIZE])
        .await
        .expect("write block 302");

    // Still within reset debounce window
    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    assert!(storage.get_dirty_count() >= 1);

    // Now allow debounce to pass with no writes
    tokio::time::sleep(std::time::Duration::from_millis(120)).await;
    assert_eq!(storage.get_dirty_count(), 0);
}
