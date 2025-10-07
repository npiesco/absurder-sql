//! Tests that blocks are restored from IndexedDB on page reload

#[cfg(target_arch = "wasm32")]
use wasm_bindgen_test::*;

#[cfg(target_arch = "wasm32")]
use absurder_sql::storage::BlockStorage;

#[cfg(target_arch = "wasm32")]
wasm_bindgen_test_configure!(run_in_browser);

/// Test that blocks persist to IndexedDB and are restored on reopen
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_blocks_restore_from_indexeddb() {
    let db_name = "test_block_restore";
    
    // First session: Write blocks
    {
        let mut storage = BlockStorage::new(db_name).await.expect("create storage");
        
        let block_id = storage.allocate_block().await.expect("allocate");
        let mut data = vec![0u8; 4096];
        data[0] = 1;
        data[1] = 2;
        data[2] = 3;
        data[3] = 4;
        storage.write_block(block_id, data.clone()).await.expect("write");
        storage.sync().await.expect("sync");
        
        // Wait for IndexedDB persistence to complete
        wasm_bindgen_futures::JsFuture::from(
            js_sys::Promise::new(&mut |resolve, _reject| {
                web_sys::window().unwrap().set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, 100).unwrap();
            })
        ).await.ok();
        
        // Verify block is in memory
        let read_data = storage.read_block(block_id).await.expect("read");
        assert_eq!(read_data[0..4], data[0..4], "Data should match in first session");
    }
    
    // Second session: Blocks should be restored from IndexedDB
    {
        let mut storage = BlockStorage::new(db_name).await.expect("reopen storage");
        
        // Block should be restored from IndexedDB
        let block_id = 1; // First allocated block
        let read_data = storage.read_block(block_id).await.expect("read after restore");
        
        assert_eq!(read_data[0], 1, "First byte should be 1");
        assert_eq!(read_data[1], 2, "Second byte should be 2");
        assert_eq!(read_data[2], 3, "Third byte should be 3");
        assert_eq!(read_data[3], 4, "Fourth byte should be 4");
    }
}

/// Test that multiple blocks persist
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_multiple_blocks_restore() {
    let db_name = "test_multi_block_restore";
    
    // First session: Write multiple blocks
    {
        let mut storage = BlockStorage::new(db_name).await.expect("create storage");
        
        for i in 0..5 {
            let block_id = storage.allocate_block().await.expect("allocate");
            let data = vec![i as u8; 4096];
            storage.write_block(block_id, data).await.expect("write");
        }
        
        storage.sync().await.expect("sync");
        
        // Wait for IndexedDB persistence to complete
        wasm_bindgen_futures::JsFuture::from(
            js_sys::Promise::new(&mut |resolve, _reject| {
                web_sys::window().unwrap().set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, 100).unwrap();
            })
        ).await.ok();
    }
    
    // Second session: All blocks should be restored
    {
        let mut storage = BlockStorage::new(db_name).await.expect("reopen storage");
        
        for i in 1..=5 {
            let read_data = storage.read_block(i).await.expect(&format!("read block {}", i));
            assert_eq!(read_data[0], (i - 1) as u8, "Block {} should have correct data", i);
        }
    }
}
