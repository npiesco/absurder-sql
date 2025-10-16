// Auto-sync disable behavior: after disabling, timer thread should not flush

#![cfg(not(target_arch = "wasm32"))]
use absurder_sql::storage::{BlockStorage, BLOCK_SIZE};
use tempfile::TempDir;
use serial_test::serial;
#[path = "common/mod.rs"]
mod common;

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_disable_stops_timer_flush() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());
    let mut storage = BlockStorage::new_with_capacity("test_disable_autosync", 8)
        .await
        .expect("create storage");

    // Enable auto-sync with a short interval
    storage.enable_auto_sync(50);

    // Make a block dirty
    let data = vec![1u8; BLOCK_SIZE];
    storage
        .write_block(1, data)
        .await
        .expect("write block 1");
    assert_eq!(storage.get_dirty_count(), 1);

    // Disable auto-sync immediately
    storage.disable_auto_sync();

    // Wait longer than the interval; background thread should be stopped, so no flush should occur
    tokio::time::sleep(std::time::Duration::from_millis(200)).await;

    // Dirty set should remain until an explicit sync
    assert_eq!(storage.get_dirty_count(), 1);
}
