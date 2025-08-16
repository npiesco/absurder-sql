//! Phase 2: IndexedDB Integration Tests
//! TDD approach: Write failing tests first for IndexedDB functionality

use wasm_bindgen_test::*;

#[cfg(target_arch = "wasm32")]
use sqlite_indexeddb_rs::storage::{BlockStorage, BLOCK_SIZE};

wasm_bindgen_test_configure!(run_in_browser);

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_indexeddb_availability() {
    // Test that IndexedDB is available in the browser
    let window = web_sys::window().expect("Should have window object");
    let _indexed_db = window.indexed_db().expect("Should have IndexedDB").expect("IndexedDB should be supported");
    
    web_sys::console::log_1(&"✓ IndexedDB availability test passed".into());
}

#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_indexeddb_availability() {
    // This test is only relevant for WASM, so we'll just pass it in native
    println!("✓ IndexedDB availability test skipped (native only)");
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_block_storage_creation() {
    // Test that we can create a BlockStorage instance
    let storage = BlockStorage::new("test_db_creation").await;
    
    match storage {
        Ok(_) => web_sys::console::log_1(&"✓ Block storage creation test passed".into()),
        Err(e) => {
            web_sys::console::log_1(&format!("✗ Block storage creation failed: {:?}", e).into());
            panic!("Block storage creation should succeed");
        }
    }
}

#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_block_storage_creation() {
    // This test is only relevant for WASM, so we'll just pass it in native
    println!("✓ Block storage creation test skipped (native only)");
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_block_storage_read_write() {
    // Test basic read/write operations
    let mut storage = BlockStorage::new("test_db_rw").await
        .expect("Should create storage");
    
    let test_data = vec![42u8; BLOCK_SIZE];
    let block_id = 1;
    
    // Write block
    storage.write_block(block_id, test_data.clone()).await
        .expect("Should write block");
    
    // Read block back
    let read_data = storage.read_block(block_id).await
        .expect("Should read block");
    
    assert_eq!(read_data, test_data, "Read data should match written data");
    
    web_sys::console::log_1(&"✓ Block storage read/write test passed".into());
}

#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_block_storage_read_write() {
    // This test is only relevant for WASM, so we'll just pass it in native
    println!("✓ Block storage read/write test skipped (native only)");
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_block_storage_cache() {
    // Test that caching works correctly
    let mut storage = BlockStorage::new("test_db_cache").await
        .expect("Should create storage");
    
    let test_data = vec![123u8; BLOCK_SIZE];
    let block_id = 2;
    
    // Write and sync
    storage.write_block(block_id, test_data.clone()).await
        .expect("Should write block");
    storage.sync().await.expect("Should sync");
    
    // Clear cache and read again
    storage.clear_cache();
    let read_data = storage.read_block(block_id).await
        .expect("Should read block from IndexedDB");
    
    assert_eq!(read_data, test_data, "Data should persist after cache clear");
    
    web_sys::console::log_1(&"✓ Block storage cache test passed".into());
}

#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_block_storage_cache() {
    // This test is only relevant for WASM, so we'll just pass it in native
    println!("✓ Block storage cache test skipped (native only)");
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_block_storage_sync() {
    // Test synchronization of dirty blocks
    let mut storage = BlockStorage::new("test_db_sync").await
        .expect("Should create storage");
    
    let test_data1 = vec![1u8; BLOCK_SIZE];
    let test_data2 = vec![2u8; BLOCK_SIZE];
    
    // Write multiple blocks
    storage.write_block(10, test_data1.clone()).await
        .expect("Should write block 10");
    storage.write_block(11, test_data2.clone()).await
        .expect("Should write block 11");
    
    assert_eq!(storage.get_dirty_count(), 2, "Should have 2 dirty blocks");
    
    // Sync to IndexedDB
    storage.sync().await.expect("Should sync");
    
    assert_eq!(storage.get_dirty_count(), 0, "Should have no dirty blocks after sync");
    
    web_sys::console::log_1(&"✓ Block storage sync test passed".into());
}

#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_block_storage_sync() {
    // This test is only relevant for WASM, so we'll just pass it in native
    println!("✓ Block storage sync test skipped (native only)");
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_block_storage_invalid_size() {
    // Test that invalid block sizes are rejected
    let mut storage = BlockStorage::new("test_db_invalid").await
        .expect("Should create storage");
    
    let invalid_data = vec![1u8; BLOCK_SIZE - 1]; // Wrong size
    let result = storage.write_block(1, invalid_data).await;
    
    match result {
        Err(_) => web_sys::console::log_1(&"✓ Block storage invalid size test passed".into()),
        Ok(_) => panic!("Should reject invalid block size"),
    }
}

#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_block_storage_invalid_size() {
    // This test is only relevant for WASM, so we'll just pass it in native
    println!("✓ Block storage invalid size test skipped (native only)");
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_multiple_databases() {
    // Test that multiple databases can coexist
    let mut storage1 = BlockStorage::new("test_db_multi1").await
        .expect("Should create storage1");
    let mut storage2 = BlockStorage::new("test_db_multi2").await
        .expect("Should create storage2");
    
    let data1 = vec![11u8; BLOCK_SIZE];
    let data2 = vec![22u8; BLOCK_SIZE];
    
    // Write to different databases
    storage1.write_block(1, data1.clone()).await
        .expect("Should write to db1");
    storage2.write_block(1, data2.clone()).await
        .expect("Should write to db2");
    
    storage1.sync().await.expect("Should sync db1");
    storage2.sync().await.expect("Should sync db2");
    
    // Verify data is separate
    let read1 = storage1.read_block(1).await.expect("Should read from db1");
    let read2 = storage2.read_block(1).await.expect("Should read from db2");
    
    assert_eq!(read1, data1, "DB1 should have correct data");
    assert_eq!(read2, data2, "DB2 should have correct data");
    assert_ne!(read1, read2, "DBs should have different data");
    
    web_sys::console::log_1(&"✓ Multiple databases test passed".into());
}

#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_multiple_databases() {
    // This test is only relevant for WASM, so we'll just pass it in native
    println!("✓ Multiple databases test skipped (native only)");
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_large_block_operations() {
    // Test operations with multiple blocks
    let mut storage = BlockStorage::new("test_db_large").await
        .expect("Should create storage");
    
    let num_blocks = 10;
    let mut test_data = Vec::new();
    
    // Write multiple blocks
    for i in 0..num_blocks {
        let data = vec![(i as u8 + 1) * 10; BLOCK_SIZE];
        storage.write_block(i as u64, data.clone()).await
            .expect("Should write block");
        test_data.push(data);
    }
    
    storage.sync().await.expect("Should sync all blocks");
    
    // Verify all blocks
    for i in 0..num_blocks {
        let read_data = storage.read_block(i as u64).await
            .expect("Should read block");
        assert_eq!(read_data, test_data[i], "Block {} should have correct data", i);
    }
    
    web_sys::console::log_1(&"✓ Large block operations test passed".into());
}

#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_large_block_operations() {
    // This test is only relevant for WASM, so we'll just pass it in native
    println!("✓ Large block operations test skipped (native only)");
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_persistence_across_instances() {
    // Test that data persists when creating new storage instances
    let db_name = "test_db_persistence";
    let test_data = vec![99u8; BLOCK_SIZE];
    let block_id = 42;
    
    // Write with first instance
    {
        let mut storage1 = BlockStorage::new(db_name).await
            .expect("Should create storage1");
        storage1.write_block(block_id, test_data.clone()).await
            .expect("Should write block");
        storage1.sync().await.expect("Should sync");
    }
    
    // Read with second instance
    {
        let mut storage2 = BlockStorage::new(db_name).await
            .expect("Should create storage2");
        let read_data = storage2.read_block(block_id).await
            .expect("Should read block");
        assert_eq!(read_data, test_data, "Data should persist across instances");
    }
    
    web_sys::console::log_1(&"✓ Persistence across instances test passed".into());
}

#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_persistence_across_instances() {
    // This test is only relevant for WASM, so we'll just pass it in native
    println!("✓ Persistence across instances test skipped (native only)");
}
