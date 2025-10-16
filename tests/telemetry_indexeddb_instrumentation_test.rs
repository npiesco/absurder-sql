// Test for Phase 2: IndexedDB Operations Instrumentation
// This test verifies that BlockStorage operations are properly instrumented with telemetry

#![cfg(feature = "telemetry")]

#[cfg(feature = "telemetry")]
mod telemetry_indexeddb_tests {
    use absurder_sql::storage::BlockStorage;
    use absurder_sql::telemetry::Metrics;
    
    #[test]
    fn test_indexeddb_read_block_increments_metrics() {
        // Setup: Create a BlockStorage with metrics enabled
        let metrics = Metrics::new().expect("Failed to create metrics");
        
        let mut storage = BlockStorage::new_for_test();
        storage.set_metrics(Some(metrics.clone()));
        
        // Get initial IndexedDB operation count (before any operations)
        let initial_count = metrics.indexeddb_operations_total().get();
        
        // Action: Read a non-existent block (cache miss, triggers IndexedDB)
        let _ = storage.read_block_sync(9999); // This will fail but should increment counter
        
        // Assert: IndexedDB operation counter incremented for cache miss
        let final_count = metrics.indexeddb_operations_total().get();
        assert!(final_count > initial_count, 
            "IndexedDB read operation (cache miss) should increment metrics counter. Initial: {}, Final: {}", 
            initial_count, final_count);
    }
    
    #[test]
    fn test_indexeddb_write_block_increments_metrics() {
        let metrics = Metrics::new().expect("Failed to create metrics");
        
        let mut storage = BlockStorage::new_for_test();
        storage.set_metrics(Some(metrics.clone()));
        
        let initial_count = metrics.indexeddb_operations_total().get();
        
        // Action: Write a block
        let test_data = vec![1u8; 4096];
        storage.write_block_sync(1, test_data.clone()).expect("Failed to write block");
        
        // Assert: IndexedDB operation counter incremented
        let final_count = metrics.indexeddb_operations_total().get();
        assert!(final_count > initial_count, 
            "IndexedDB write operation should increment metrics counter. Initial: {}, Final: {}", 
            initial_count, final_count);
    }
    
    #[test]
    fn test_indexeddb_operations_counter() {
        let metrics = Metrics::new().expect("Failed to create metrics");
        
        let mut storage = BlockStorage::new_for_test();
        storage.set_metrics(Some(metrics.clone()));
        
        let initial_count = metrics.indexeddb_operations_total().get();
        
        // Action: Perform multiple IndexedDB operations
        let test_data = vec![1u8; 4096];
        storage.write_block_sync(1, test_data.clone()).expect("Failed to write block");
        storage.write_block_sync(2, test_data.clone()).expect("Failed to write block");
        storage.write_block_sync(3, test_data.clone()).expect("Failed to write block");
        
        // Assert: Operations counter incremented for each write
        let final_count = metrics.indexeddb_operations_total().get();
        assert_eq!(final_count - initial_count, 3.0,
            "Should count 3 IndexedDB operations. Initial: {}, Final: {}, Diff: {}",
            initial_count, final_count, final_count - initial_count);
    }
    
    #[test]
    fn test_cache_hit_increments_metrics() {
        let metrics = Metrics::new().expect("Failed to create metrics");
        
        
        
        let mut storage = BlockStorage::new_for_test();
        storage.set_metrics(Some(metrics.clone()));
        
        // Write and read once to populate cache
        let test_data = vec![1u8; 4096];
        storage.write_block_sync(1, test_data.clone()).expect("Failed to write block");
        storage.read_block_sync(1).expect("Failed to read block");
        
        let initial_hits = metrics.cache_hits().get();
        
        // Action: Read from cache
        storage.read_block_sync(1).expect("Failed to read from cache");
        
        // Assert: Cache hit counter incremented
        let final_hits = metrics.cache_hits().get();
        assert!(final_hits > initial_hits,
            "Cache hit should increment metrics. Initial: {}, Final: {}",
            initial_hits, final_hits);
    }
    
    #[test]
    fn test_cache_miss_increments_metrics() {
        let metrics = Metrics::new().expect("Failed to create metrics");
        
        
        
        let mut storage = BlockStorage::new_for_test();
        storage.set_metrics(Some(metrics.clone()));
        
        let initial_misses = metrics.cache_misses().get();
        
        // Action: Read a block that's not in cache (will fail, but miss should still be recorded)
        let _ = storage.read_block_sync(9999); // Non-existent block
        
        // Assert: Cache miss counter incremented
        let final_misses = metrics.cache_misses().get();
        assert!(final_misses > initial_misses,
            "Cache miss should increment metrics. Initial: {}, Final: {}",
            initial_misses, final_misses);
    }
    
    #[test]
    fn test_storage_bytes_gauge_tracks_size() {
        let metrics = Metrics::new().expect("Failed to create metrics");
        
        
        
        let mut storage = BlockStorage::new_for_test();
        storage.set_metrics(Some(metrics.clone()));
        
        let initial_size = metrics.storage_bytes().get();
        
        // Action: Write multiple blocks
        let test_data = vec![1u8; 4096]; // 4KB block
        for i in 1..=5 {
            storage.write_block_sync(i, test_data.clone()).expect("Failed to write block");
        }
        
        // Assert: Storage size gauge increased
        let final_size = metrics.storage_bytes().get();
        assert!(final_size >= initial_size + (4096.0 * 5.0),
            "Storage bytes should track size. Initial: {}, Final: {}, Expected >= {}",
            initial_size, final_size, initial_size + (4096.0 * 5.0));
    }
    
    #[test]
    fn test_cache_size_bytes_gauge_tracks_cache() {
        let metrics = Metrics::new().expect("Failed to create metrics");
        
        
        
        let mut storage = BlockStorage::new_for_test();
        storage.set_metrics(Some(metrics.clone()));
        
        let initial_cache_size = metrics.cache_size_bytes().get();
        
        // Action: Write blocks to populate cache
        let test_data = vec![1u8; 4096]; // 4KB blocks
        for i in 1..=10 {
            storage.write_block_sync(i, test_data.clone()).expect("Failed to write block");
        }
        
        // Assert: Cache size gauge increased
        let final_cache_size = metrics.cache_size_bytes().get();
        assert!(final_cache_size > initial_cache_size,
            "Cache size bytes should track cache. Initial: {}, Final: {}",
            initial_cache_size, final_cache_size);
    }
}

#[cfg(not(feature = "telemetry"))]
fn main() {
    println!("Telemetry feature not enabled. Skipping IndexedDB instrumentation tests.");
}
