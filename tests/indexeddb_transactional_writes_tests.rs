//! IndexedDB transactional writes tests (TDD - expected to FAIL initially)
//! Tests atomic writes of {blocks + metadata} with commit marker advancement

#![cfg(target_arch = "wasm32")]
#![allow(unused_imports)]

use wasm_bindgen_test::*;
use absurder_sql::storage::{BlockStorage, BLOCK_SIZE};
use std::collections::HashMap;

wasm_bindgen_test_configure!(run_in_browser);

/// Test that sync operations are atomic: either all blocks+metadata are written together
/// or none are visible. This test simulates a crash mid-sync to verify atomicity.
#[wasm_bindgen_test]
async fn test_indexeddb_atomic_sync_all_or_nothing() {
    let db_name = "atomic_sync_test";
    let mut storage = BlockStorage::new(db_name).await.expect("create storage");
    
    // Allocate and write multiple blocks
    let block1 = storage.allocate_block().await.expect("alloc block1");
    let block2 = storage.allocate_block().await.expect("alloc block2");
    let block3 = storage.allocate_block().await.expect("alloc block3");
    
    let data1 = vec![0x11u8; BLOCK_SIZE];
    let data2 = vec![0x22u8; BLOCK_SIZE];
    let data3 = vec![0x33u8; BLOCK_SIZE];
    
    storage.write_block(block1, data1.clone()).await.expect("write block1");
    storage.write_block(block2, data2.clone()).await.expect("write block2");
    storage.write_block(block3, data3.clone()).await.expect("write block3");
    
    // Get initial commit marker
    let initial_marker = storage.get_commit_marker();
    
    // Perform sync - this should be atomic
    storage.sync().await.expect("sync blocks");
    
    // Verify commit marker advanced
    let post_sync_marker = storage.get_commit_marker();
    assert!(post_sync_marker > initial_marker, "Commit marker should advance after sync");
    
    // Create new instance to verify cross-instance visibility
    let storage2 = BlockStorage::new(db_name).await.expect("create storage2");
    
    // All blocks should be visible with correct data
    let read1 = storage2.read_block_sync(block1).expect("read block1");
    let read2 = storage2.read_block_sync(block2).expect("read block2");
    let read3 = storage2.read_block_sync(block3).expect("read block3");
    
    assert_eq!(read1, data1, "Block1 data should match");
    assert_eq!(read2, data2, "Block2 data should match");
    assert_eq!(read3, data3, "Block3 data should match");
}

/// Test that partial sync failures don't advance commit marker
/// This simulates IndexedDB transaction failures during sync
#[wasm_bindgen_test]
async fn test_indexeddb_sync_failure_no_commit_marker_advance() {
    let db_name = "sync_failure_test";
    let mut storage = BlockStorage::new(db_name).await.expect("create storage");
    
    // Write a block
    let block_id = storage.allocate_block().await.expect("alloc block");
    let data = vec![0xAAu8; BLOCK_SIZE];
    storage.write_block(block_id, data.clone()).await.expect("write block");
    
    let initial_marker = storage.get_commit_marker();
    
    // This test will initially pass because we don't have transaction failure simulation yet
    // But it establishes the contract: sync failures should not advance commit marker
    storage.sync().await.expect("sync should succeed for now");
    
    let post_sync_marker = storage.get_commit_marker();
    assert!(post_sync_marker > initial_marker, "Successful sync should advance marker");
}

/// Test commit marker consistency across multiple syncs
#[wasm_bindgen_test]
async fn test_indexeddb_commit_marker_monotonic_advance() {
    let db_name = "monotonic_marker_test";
    let mut storage = BlockStorage::new(db_name).await.expect("create storage");
    
    let mut previous_marker = storage.get_commit_marker();
    
    // Perform multiple sync operations
    for i in 0..5 {
        let block_id = storage.allocate_block().await.expect("alloc block");
        let data = vec![i as u8; BLOCK_SIZE];
        storage.write_block(block_id, data).await.expect("write block");
        
        storage.sync().await.expect("sync");
        
        let current_marker = storage.get_commit_marker();
        assert!(current_marker > previous_marker, 
                "Commit marker should monotonically increase, iteration {}", i);
        previous_marker = current_marker;
    }
}

/// Test that reads are properly gated by commit marker across instances
#[wasm_bindgen_test]
async fn test_indexeddb_read_gating_by_commit_marker() {
    let db_name = "read_gating_test";
    let mut storage1 = BlockStorage::new(db_name).await.expect("create storage1");
    
    // Write data in first instance
    let block_id = storage1.allocate_block().await.expect("alloc block");
    let data = vec![0xBBu8; BLOCK_SIZE];
    storage1.write_block(block_id, data.clone()).await.expect("write block");
    
    // Before sync, data should not be visible in new instance
    let storage2 = BlockStorage::new(db_name).await.expect("create storage2");
    let read_before_sync = storage2.read_block_sync(block_id);
    
    // Should return zeroed data or error since commit marker hasn't advanced
    match read_before_sync {
        Ok(zeroed_data) => {
            assert_eq!(zeroed_data, vec![0u8; BLOCK_SIZE], "Should return zeroed data before sync");
        }
        Err(_) => {
            // Also acceptable - block not visible before commit
        }
    }
    
    // After sync, data should be visible
    storage1.sync().await.expect("sync");
    
    let storage3 = BlockStorage::new(db_name).await.expect("create storage3");
    let read_after_sync = storage3.read_block_sync(block_id).expect("read after sync");
    assert_eq!(read_after_sync, data, "Data should be visible after sync");
}

/// Test cross-instance IndexedDB persistence (this will fail until IndexedDB is implemented)
#[wasm_bindgen_test]
async fn test_indexeddb_cross_instance_persistence() {
    let db_name = "cross_instance_test";
    
    // Write data in first instance and sync
    {
        let mut storage1 = BlockStorage::new(db_name).await.expect("create storage1");
        let block_id = storage1.allocate_block().await.expect("alloc block");
        let data = vec![0xCCu8; BLOCK_SIZE];
        storage1.write_block(block_id, data.clone()).await.expect("write block");
        storage1.sync().await.expect("sync storage1");
        
        // Verify data is visible in same instance
        let read_same_instance = storage1.read_block_sync(block_id).expect("read same instance");
        assert_eq!(read_same_instance, data, "Data should be visible in same instance");
        
        web_sys::console::log_1(&format!("Storage1 commit marker: {}", storage1.get_commit_marker()).into());
    } // storage1 goes out of scope
    
    // Create completely new instance - should load data from IndexedDB
    {
        let storage2 = BlockStorage::new(db_name).await.expect("create storage2");
        web_sys::console::log_1(&format!("Storage2 commit marker: {}", storage2.get_commit_marker()).into());
        
        // This will fail until we implement IndexedDB persistence
        // Currently only in-memory thread-locals are used
        let read_cross_instance = storage2.read_block_sync(1);
        match read_cross_instance {
            Ok(data) => {
                web_sys::console::log_1(&format!("Cross-instance read succeeded: {} bytes", data.len()).into());
                // This assertion will fail until IndexedDB persistence is implemented
                assert_ne!(data, vec![0u8; BLOCK_SIZE], "Data should persist across instances via IndexedDB");
            }
            Err(e) => {
                web_sys::console::log_1(&format!("Cross-instance read failed: {}", e.message).into());
                panic!("Cross-instance read should succeed with IndexedDB persistence");
            }
        }
    }
}

