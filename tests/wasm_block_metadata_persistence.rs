// WASM metadata persistence tests for BlockStorage

#![cfg(target_arch = "wasm32")]

use wasm_bindgen_test::*;
use absurder_sql::storage::{BlockStorage, BLOCK_SIZE};

// Use the shared wasm-bindgen test configuration defined elsewhere
// wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_wasm_metadata_persists_across_instances() {
    // Create first instance and write a block, then sync to persist data + metadata
    let mut s1 = BlockStorage::new_with_capacity("wasm_meta_persist_db", 8)
        .await
        .expect("create storage s1");

    let data = vec![0xABu8; BLOCK_SIZE];
    s1.write_block(10, data).await.expect("write block 10");
    s1.sync().await.expect("sync s1");

    // Drop first instance by ending scope
    drop(s1);

    // Create second instance with same DB name; it should restore checksum metadata
    let s2 = BlockStorage::new("wasm_meta_persist_db").await.expect("create storage s2");

    // On startup, get_block_checksum should be populated from persisted metadata
    let restored = s2.get_block_checksum(10);
    assert!(restored.is_some(), "checksum should be restored for block 10");

    // Verify API should succeed using the restored checksum + data from GLOBAL_STORAGE
    // Note: verify_block_checksum will read the block and compare against stored checksum
    let mut s2_mut = s2; // take mutable
    s2_mut.verify_block_checksum(10).await.expect("verify ok after restore");
}

#[wasm_bindgen_test]
async fn test_wasm_metadata_removed_on_deallocate() {
    let mut s = BlockStorage::new_with_capacity("wasm_meta_dealloc_db", 4)
        .await
        .expect("create storage");

    // Allocate, write, and sync so metadata is persisted
    let id = s.allocate_block().await.expect("alloc block");
    let data = vec![0xCDu8; BLOCK_SIZE];
    s.write_block(id, data).await.expect("write block");
    s.sync().await.expect("sync ok");

    // Sanity: metadata present before deallocation
    assert!(s.get_block_checksum(id).is_some(), "metadata present before dealloc");

    // Deallocate should remove metadata
    s.deallocate_block(id).await.expect("deallocate ok");
    assert!(s.get_block_checksum(id).is_none(), "metadata removed on dealloc");
}
