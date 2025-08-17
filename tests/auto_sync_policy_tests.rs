// Threshold-based auto-sync tests using SyncPolicy

#![cfg(not(target_arch = "wasm32"))]
use sqlite_indexeddb_rs::storage::{BlockStorage, BLOCK_SIZE, SyncPolicy};

#[tokio::test(flavor = "current_thread")]
async fn test_threshold_based_flush_on_max_dirty() {
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
