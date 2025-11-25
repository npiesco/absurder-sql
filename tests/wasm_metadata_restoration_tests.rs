// FIXED TODO #1: Test metadata restoration from IndexedDB
// This test was written to verify that metadata (checksums, versions, algorithms)
// are properly restored from IndexedDB along with block data.

#![cfg(target_arch = "wasm32")]

use wasm_bindgen_test::*;
use absurder_sql::storage::{BlockStorage, BLOCK_SIZE};

wasm_bindgen_test_configure!(run_in_browser);

/// Test that metadata is restored from IndexedDB on database reopening
#[wasm_bindgen_test]
async fn test_metadata_restoration_from_indexeddb() {
    let db_name = "metadata_restoration_test";
    
    // Step 1: Create storage, write blocks, and sync
    let mut storage1 = BlockStorage::new(db_name).await.expect("create storage1");
    let block1 = storage1.allocate_block().await.expect("allocate block1");
    let block2 = storage1.allocate_block().await.expect("allocate block2");
    
    let data1 = vec![0xAAu8; BLOCK_SIZE];
    let data2 = vec![0xBBu8; BLOCK_SIZE];
    
    storage1.write_block(block1, data1.clone()).await.expect("write block1");
    storage1.write_block(block2, data2.clone()).await.expect("write block2");
    storage1.sync().await.expect("sync");
    
    // Get metadata before closing
    let all_metadata = storage1.get_block_metadata_for_testing();
    let metadata1 = all_metadata.get(&block1).expect("get metadata1");
    let metadata2 = all_metadata.get(&block2).expect("get metadata2");
    
    web_sys::console::log_1(&format!("Original metadata1: checksum={}, version={}", 
        metadata1.0, metadata1.1).into());
    web_sys::console::log_1(&format!("Original metadata2: checksum={}, version={}", 
        metadata2.0, metadata2.1).into());
    
    // Step 2: Drop storage and create new instance (simulating app restart)
    drop(storage1);
    
    let mut storage2 = BlockStorage::new(db_name).await.expect("create storage2");
    
    // Step 3: Verify metadata was restored correctly
    let restored_all_metadata = storage2.get_block_metadata_for_testing();
    let restored_metadata1 = restored_all_metadata.get(&block1)
        .expect("metadata1 should be restored");
    let restored_metadata2 = restored_all_metadata.get(&block2)
        .expect("metadata2 should be restored");
    
    web_sys::console::log_1(&format!("Restored metadata1: checksum={}, version={}", 
        restored_metadata1.0, restored_metadata1.1).into());
    web_sys::console::log_1(&format!("Restored metadata2: checksum={}, version={}", 
        restored_metadata2.0, restored_metadata2.1).into());
    
    // Verify checksums match (tuple.0 is checksum)
    assert_eq!(restored_metadata1.0, metadata1.0, 
        "Block1 checksum should be restored");
    assert_eq!(restored_metadata2.0, metadata2.0, 
        "Block2 checksum should be restored");
    
    // Verify versions match (tuple.1 is version)
    assert_eq!(restored_metadata1.1, metadata1.1,
        "Block1 version should be restored");
    assert_eq!(restored_metadata2.1, metadata2.1,
        "Block2 version should be restored");
    
    // Verify last_modified_ms match (tuple.2 is last_modified_ms)
    assert_eq!(restored_metadata1.2, metadata1.2,
        "Block1 last_modified_ms should be restored");
    assert_eq!(restored_metadata2.2, metadata2.2,
        "Block2 last_modified_ms should be restored");
    
    // Verify data is still readable and correct
    let read_data1 = storage2.read_block(block1).await.expect("read block1");
    let read_data2 = storage2.read_block(block2).await.expect("read block2");
    
    assert_eq!(read_data1, data1, "Block1 data should match");
    assert_eq!(read_data2, data2, "Block2 data should match");
}

/// Test that metadata restoration works across multiple sync cycles
#[wasm_bindgen_test]
async fn test_metadata_restoration_multiple_syncs() {
    let db_name = "metadata_multi_sync_test";
    
    // Step 1: Create storage and write initial data
    let mut storage1 = BlockStorage::new(db_name).await.expect("create storage1");
    let block_id = storage1.allocate_block().await.expect("allocate block");
    
    let data_v1 = vec![0x11u8; BLOCK_SIZE];
    storage1.write_block(block_id, data_v1).await.expect("write v1");
    storage1.sync().await.expect("sync v1");
    
    let all_metadata_v1 = storage1.get_block_metadata_for_testing();
    let metadata_v1 = all_metadata_v1.get(&block_id).expect("get metadata v1");
    let version_1 = metadata_v1.1;  // tuple.1 is version
    
    // Step 2: Update block and sync again
    let data_v2 = vec![0x22u8; BLOCK_SIZE];
    storage1.write_block(block_id, data_v2).await.expect("write v2");
    storage1.sync().await.expect("sync v2");
    
    let all_metadata_v2 = storage1.get_block_metadata_for_testing();
    let metadata_v2 = all_metadata_v2.get(&block_id).expect("get metadata v2");
    let version_2 = metadata_v2.1;  // tuple.1 is version
    
    assert!(version_2 > version_1, "Version should increment after sync");
    
    // Step 3: Restart and verify latest metadata is restored
    drop(storage1);
    
    let mut storage2 = BlockStorage::new(db_name).await.expect("create storage2");
    let restored_all_metadata = storage2.get_block_metadata_for_testing();
    let restored_metadata = restored_all_metadata.get(&block_id)
        .expect("metadata should be restored");
    
    assert_eq!(restored_metadata.1, version_2, 
        "Latest version should be restored");
    assert_eq!(restored_metadata.0, metadata_v2.0,
        "Latest checksum should be restored");
}
