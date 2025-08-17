// verify_after_write behavior tests

#![cfg(not(target_arch = "wasm32"))]
use sqlite_indexeddb_rs::storage::{BlockStorage, BLOCK_SIZE, SyncPolicy};

#[tokio::test(flavor = "current_thread")]
async fn test_verify_after_write_success_on_clean_state() {
    let mut storage = BlockStorage::new_with_capacity("test_vaw_success", 8)
        .await
        .expect("create storage");

    let policy = SyncPolicy {
        interval_ms: None,
        max_dirty: None,
        max_dirty_bytes: None,
        debounce_ms: None,
        verify_after_write: true,
    };
    storage.enable_auto_sync_with_policy(policy);

    // First write should succeed and internal verify should pass
    let data1 = vec![3u8; BLOCK_SIZE];
    storage.write_block(1, data1).await.expect("first write ok");

    // Second write to same block should also pass (pre-write verify succeeds)
    let data2 = vec![4u8; BLOCK_SIZE];
    storage.write_block(1, data2).await.expect("second write ok");
}

#[tokio::test(flavor = "current_thread")]
async fn test_verify_after_write_blocks_write_on_prior_checksum_mismatch() {
    let mut storage = BlockStorage::new_with_capacity("test_vaw_fail", 8)
        .await
        .expect("create storage");

    // Start without verification and perform an initial write
    let policy_off = SyncPolicy {
        interval_ms: None,
        max_dirty: None,
        max_dirty_bytes: None,
        debounce_ms: None,
        verify_after_write: false,
    };
    storage.enable_auto_sync_with_policy(policy_off);

    let data = vec![7u8; BLOCK_SIZE];
    storage.write_block(2, data).await.expect("initial write ok");

    // Corrupt the stored checksum to simulate prior data corruption
    let wrong = 123456789u64;
    storage.set_block_checksum_for_testing(2, wrong);

    // Enable verify_after_write: the next write should first verify current cached bytes
    let policy_on = SyncPolicy {
        interval_ms: None,
        max_dirty: None,
        max_dirty_bytes: None,
        debounce_ms: None,
        verify_after_write: true,
    };
    storage.enable_auto_sync_with_policy(policy_on);

    let new_data = vec![8u8; BLOCK_SIZE];
    let err = storage
        .write_block(2, new_data)
        .await
        .expect_err("expected checksum mismatch preventing write");
    assert_eq!(err.code, "CHECKSUM_MISMATCH");

    // Since write failed early, dirty set should not grow
    assert_eq!(storage.get_dirty_count(), 1, "dirty set should still reflect the prior write only");
}
