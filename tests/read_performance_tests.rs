//! Read performance optimization tests

#[cfg(target_arch = "wasm32")]
use wasm_bindgen_test::*;

#[cfg(target_arch = "wasm32")]
use absurder_sql::storage::BlockStorage;

#[cfg(target_arch = "wasm32")]
wasm_bindgen_test_configure!(run_in_browser);

/// Benchmark: Sequential reads
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_sequential_read_performance() {
    let db_name = "perf_test_sequential";
    let mut storage = BlockStorage::new(db_name).await.expect("create storage");
    
    // Write 100 blocks
    let mut block_ids = Vec::new();
    for i in 0..100 {
        let block_id = storage.allocate_block().await.expect("allocate");
        let mut data = vec![0u8; 4096];
        data[0] = i as u8;
        storage.write_block(block_id, data).await.expect("write");
        block_ids.push(block_id);
    }
    storage.sync().await.expect("sync");
    
    // Wait for IndexedDB persistence
    wasm_bindgen_futures::JsFuture::from(
        js_sys::Promise::new(&mut |resolve, _reject| {
            web_sys::window().unwrap().set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, 100).unwrap();
        })
    ).await.ok();
    
    // Benchmark: Read all blocks sequentially
    let start = js_sys::Date::now();
    for block_id in &block_ids {
        let _data = storage.read_block(*block_id).await.expect("read");
    }
    let duration = js_sys::Date::now() - start;
    
    web_sys::console::log_1(&format!("Sequential read of 100 blocks: {:.2}ms ({:.2}ms per block)", 
        duration, duration / 100.0).into());
    
    // Should be fast - under 5ms per block
    assert!(duration < 500.0, "Sequential reads too slow: {}ms", duration);
}

/// Benchmark: Random reads
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_random_read_performance() {
    let db_name = "perf_test_random";
    let mut storage = BlockStorage::new(db_name).await.expect("create storage");
    
    // Write 100 blocks
    let mut block_ids = Vec::new();
    for i in 0..100 {
        let block_id = storage.allocate_block().await.expect("allocate");
        let mut data = vec![0u8; 4096];
        data[0] = i as u8;
        storage.write_block(block_id, data).await.expect("write");
        block_ids.push(block_id);
    }
    storage.sync().await.expect("sync");
    
    // Wait for IndexedDB persistence
    wasm_bindgen_futures::JsFuture::from(
        js_sys::Promise::new(&mut |resolve, _reject| {
            web_sys::window().unwrap().set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, 100).unwrap();
        })
    ).await.ok();
    
    // Benchmark: Read blocks in random order
    let start = js_sys::Date::now();
    for i in (0..100).rev() {
        let _data = storage.read_block(block_ids[i]).await.expect("read");
    }
    let duration = js_sys::Date::now() - start;
    
    web_sys::console::log_1(&format!("Random read of 100 blocks: {:.2}ms ({:.2}ms per block)", 
        duration, duration / 100.0).into());
    
    // Should be fast - under 5ms per block
    assert!(duration < 500.0, "Random reads too slow: {}ms", duration);
}

/// Benchmark: Repeated reads (cache test)
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_repeated_read_performance() {
    let db_name = "perf_test_repeated";
    let mut storage = BlockStorage::new(db_name).await.expect("create storage");
    
    // Write 10 blocks
    let mut block_ids = Vec::new();
    for i in 0..10 {
        let block_id = storage.allocate_block().await.expect("allocate");
        let mut data = vec![0u8; 4096];
        data[0] = i as u8;
        storage.write_block(block_id, data).await.expect("write");
        block_ids.push(block_id);
    }
    storage.sync().await.expect("sync");
    
    // Benchmark: Read same blocks 10 times each (should hit cache)
    let start = js_sys::Date::now();
    for _ in 0..10 {
        for block_id in &block_ids {
            let _data = storage.read_block(*block_id).await.expect("read");
        }
    }
    let duration = js_sys::Date::now() - start;
    
    web_sys::console::log_1(&format!("Repeated read of 10 blocks x10: {:.2}ms ({:.2}ms per block)", 
        duration, duration / 100.0).into());
    
    // Should be very fast with caching - under 2ms per block
    assert!(duration < 200.0, "Repeated reads too slow (cache not working?): {}ms", duration);
}
