// Background (auto) sync tests using idle-time trigger

#![cfg(not(target_arch = "wasm32"))]
use absurder_sql::storage::{BlockStorage, BLOCK_SIZE};
use tempfile::TempDir;
use serial_test::serial;
#[path = "common/mod.rs"]
mod common;

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_auto_sync_clears_dirty_blocks_on_next_op() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());
    let mut storage = BlockStorage::new_with_capacity("test_auto_sync", 8)
        .await
        .expect("create storage");

    // Enable auto-sync every 50ms
    storage.enable_auto_sync(50);

    // Make a block dirty
    let data = vec![1u8; BLOCK_SIZE];
    storage.write_block(10, data).await.expect("write block 10");
    assert_eq!(storage.get_dirty_count(), 1);

    // Wait longer than the interval
    tokio::time::sleep(std::time::Duration::from_millis(120)).await;

    // Next operation should trigger auto-sync
    let _ = storage.read_block(10).await.expect("read triggers auto sync");

    // Dirty set should now be cleared by auto sync
    assert_eq!(storage.get_dirty_count(), 0);
}
