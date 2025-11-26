// WASM checksum mismatch detection across instances

#![cfg(target_arch = "wasm32")]

use absurder_sql::storage::{BLOCK_SIZE, BlockStorage};
use wasm_bindgen_test::*;

// wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_wasm_checksum_mismatch_after_restart() {
    // Instance 1: write and sync to persist data + metadata
    let s1 = BlockStorage::new_with_capacity("wasm_meta_mismatch_db", 8)
        .await
        .expect("create storage s1");

    let block_id = 7u64;
    let data = vec![0xEEu8; BLOCK_SIZE];
    s1.write_block(block_id, data).await.expect("write block");
    s1.sync().await.expect("sync s1");

    // Drop first instance
    drop(s1);

    // Instance 2: restore metadata; then corrupt the stored checksum in-memory for testing
    let mut s2 = BlockStorage::new("wasm_meta_mismatch_db")
        .await
        .expect("create storage s2");

    // Sanity: checksum restored
    let restored = s2.get_block_checksum(block_id);
    assert!(
        restored.is_some(),
        "checksum should be restored after restart"
    );

    // Corrupt the checksum to simulate metadata corruption
    s2.set_block_checksum_for_testing(block_id, 123456789);

    // Now a read should verify and fail due to mismatch
    let err = s2
        .read_block(block_id)
        .await
        .expect_err("expected checksum mismatch after corruption");
    assert_eq!(err.code, "CHECKSUM_MISMATCH");
}
