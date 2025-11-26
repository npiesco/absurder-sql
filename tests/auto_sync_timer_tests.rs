// Timer-based background auto-sync test (no follow-up operation)

#![cfg(not(target_arch = "wasm32"))]
use absurder_sql::storage::{BLOCK_SIZE, BlockStorage};
use serial_test::serial;
use tempfile::TempDir;
#[path = "common/mod.rs"]
mod common;

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_timer_based_auto_sync_without_followup_op() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());
    let mut storage = BlockStorage::new_with_capacity("test_timer_auto_sync", 8)
        .await
        .expect("create storage");

    // Enable auto-sync every 50ms
    storage.enable_auto_sync(50);

    // Make a block dirty
    let data = vec![3u8; BLOCK_SIZE];
    storage.write_block(42, data).await.expect("write block 42");
    assert_eq!(storage.get_dirty_count(), 1);

    // Wait longer than the interval and expect background sync to flush automatically
    tokio::time::sleep(std::time::Duration::from_millis(150)).await;

    // Without any follow-up read/write, dirty blocks should still be flushed
    assert_eq!(storage.get_dirty_count(), 0);
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_drain_and_shutdown_flushes_dirty_blocks() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());
    let mut storage = BlockStorage::new_with_capacity("test_drain_shutdown", 8)
        .await
        .expect("create storage");

    // Enable auto-sync but we won't wait for it
    storage.enable_auto_sync(10_000);

    // Make a block dirty
    let data = vec![4u8; BLOCK_SIZE];
    storage.write_block(7, data).await.expect("write block 7");
    assert_eq!(storage.get_dirty_count(), 1);

    // Immediately drain and shutdown
    storage.drain_and_shutdown();

    // Dirty set should now be cleared
    assert_eq!(storage.get_dirty_count(), 0);
}
