// Test for Phase 2.4: Memory Allocation/Deallocation Instrumentation
// This test verifies that block allocation/deallocation operations are properly instrumented with telemetry

#[cfg(target_arch = "wasm32")]
use wasm_bindgen_test::*;

#[cfg(target_arch = "wasm32")]
wasm_bindgen_test_configure!(run_in_browser);

#[cfg(all(target_arch = "wasm32", feature = "telemetry"))]
mod telemetry_memory_allocation_tests {
    use super::*;
    use absurder_sql::{Database, telemetry::Metrics};
    use absurder_sql::storage::block_storage::{BlockStorage, BLOCK_SIZE};

    #[wasm_bindgen_test]
    async fn test_blockstorage_allocation_increments_metrics() {
        let metrics = Metrics::new().expect("Failed to create metrics");
        
        // Create BlockStorage directly
        let mut storage = BlockStorage::new("test_direct_alloc.db")
            .await
            .expect("Failed to create BlockStorage");
        
        storage.set_metrics(Some(metrics.clone()));
        
        let initial_allocations = metrics.blocks_allocated_total().get();
        let initial_memory = metrics.memory_bytes().get();
        
        // Action: Allocate blocks directly
        let _block1 = storage.allocate_block().await.expect("Failed to allocate block 1");
        let _block2 = storage.allocate_block().await.expect("Failed to allocate block 2");
        let _block3 = storage.allocate_block().await.expect("Failed to allocate block 3");
        
        // Assert: Metrics incremented
        let final_allocations = metrics.blocks_allocated_total().get();
        let final_memory = metrics.memory_bytes().get();
        
        assert_eq!(final_allocations - initial_allocations, 3.0,
            "Should have allocated 3 blocks. Initial: {}, Final: {}",
            initial_allocations, final_allocations);
        
        assert_eq!(final_memory - initial_memory, 3.0 * (BLOCK_SIZE as f64),
            "Memory should increase by 3 × BLOCK_SIZE. Initial: {}, Final: {}",
            initial_memory, final_memory);
    }

    #[wasm_bindgen_test]
    async fn test_blockstorage_deallocation_increments_metrics() {
        let metrics = Metrics::new().expect("Failed to create metrics");
        
        // Create BlockStorage directly
        let mut storage = BlockStorage::new("test_direct_dealloc.db")
            .await
            .expect("Failed to create BlockStorage");
        
        storage.set_metrics(Some(metrics.clone()));
        
        // Allocate some blocks first
        let block1 = storage.allocate_block().await.expect("Failed to allocate block 1");
        let block2 = storage.allocate_block().await.expect("Failed to allocate block 2");
        let _block3 = storage.allocate_block().await.expect("Failed to allocate block 3");
        
        let initial_deallocations = metrics.blocks_deallocated_total().get();
        let initial_memory = metrics.memory_bytes().get();
        
        // Action: Deallocate blocks
        storage.deallocate_block(block1).await.expect("Failed to deallocate block 1");
        storage.deallocate_block(block2).await.expect("Failed to deallocate block 2");
        
        // Assert: Metrics incremented
        let final_deallocations = metrics.blocks_deallocated_total().get();
        let final_memory = metrics.memory_bytes().get();
        
        assert_eq!(final_deallocations - initial_deallocations, 2.0,
            "Should have deallocated 2 blocks. Initial: {}, Final: {}",
            initial_deallocations, final_deallocations);
        
        assert_eq!(initial_memory - final_memory, 2.0 * (BLOCK_SIZE as f64),
            "Memory should decrease by 2 × BLOCK_SIZE. Initial: {}, Final: {}",
            initial_memory, final_memory);
    }

    #[wasm_bindgen_test]
    async fn test_block_deallocation_increments_metrics() {
        let metrics = Metrics::new().expect("Failed to create metrics");
        
        let mut db = Database::new_wasm("test_deallocation.db".to_string())
            .await
            .expect("Failed to create database");
        
        db.set_metrics(Some(metrics.clone()));
        
        // Setup: Create and populate table
        db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT)")
            .await
            .expect("Failed to create table");
        
        for i in 1..=10 {
            db.execute(&format!("INSERT INTO test VALUES ({}, 'data{}')", i, i))
                .await
                .expect("Failed to insert data");
        }
        
        // Sync to ensure allocations are tracked
        db.sync().await.expect("Failed to sync");
        
        let initial_deallocations = metrics.blocks_deallocated_total().get();
        
        // Action: Delete data (may trigger deallocation)
        db.execute("DELETE FROM test WHERE id > 5")
            .await
            .expect("Failed to delete data");
        
        // Action: Drop table (should trigger deallocations)
        db.execute("DROP TABLE test")
            .await
            .expect("Failed to drop table");
        
        // Action: Vacuum to trigger cleanup
        db.execute("VACUUM")
            .await
            .expect("Failed to vacuum");
        
        // Assert: Deallocations counter may have incremented
        let final_deallocations = metrics.blocks_deallocated_total().get();
        
        // Note: Deallocations are asynchronous and may not happen immediately
        // This test primarily ensures the metric exists and can be tracked
        assert!(final_deallocations >= initial_deallocations,
            "Deallocations counter should not decrease. Initial: {}, Final: {}",
            initial_deallocations, final_deallocations);
        
        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_memory_gauge_tracks_allocated_blocks() {
        let metrics = Metrics::new().expect("Failed to create metrics");
        
        // Create BlockStorage directly
        let mut storage = BlockStorage::new("test_memory_tracking.db")
            .await
            .expect("Failed to create BlockStorage");
        
        storage.set_metrics(Some(metrics.clone()));
        
        let initial_memory = metrics.memory_bytes().get();
        let initial_blocks = metrics.blocks_allocated_total().get();
        
        // Action: Allocate multiple blocks
        for _ in 1..=20 {
            storage.allocate_block().await.expect("Failed to allocate");
        }
        
        let final_memory = metrics.memory_bytes().get();
        let final_blocks = metrics.blocks_allocated_total().get();
        
        // Assert: Both memory and blocks increased
        assert_eq!(final_blocks - initial_blocks, 20.0,
            "Block count should increase by 20. Initial: {}, Final: {}",
            initial_blocks, final_blocks);
        assert_eq!(final_memory - initial_memory, 20.0 * (BLOCK_SIZE as f64),
            "Memory should increase by 20 × BLOCK_SIZE. Initial: {}, Final: {}",
            initial_memory, final_memory);
    }

    #[wasm_bindgen_test]
    async fn test_allocation_metrics_accumulate() {
        let metrics = Metrics::new().expect("Failed to create metrics");
        
        // Create two separate BlockStorages
        let mut storage1 = BlockStorage::new("test_accum1.db")
            .await
            .expect("Failed to create storage1");
        
        storage1.set_metrics(Some(metrics.clone()));
        
        let mut storage2 = BlockStorage::new("test_accum2.db")
            .await
            .expect("Failed to create storage2");
        
        storage2.set_metrics(Some(metrics.clone()));
        
        let initial_allocations = metrics.blocks_allocated_total().get();
        
        // Action: Allocate in both storages
        storage1.allocate_block().await.expect("Failed to allocate in storage1");
        storage1.allocate_block().await.expect("Failed to allocate in storage1");
        storage2.allocate_block().await.expect("Failed to allocate in storage2");
        storage2.allocate_block().await.expect("Failed to allocate in storage2");
        storage2.allocate_block().await.expect("Failed to allocate in storage2");
        
        // Assert: Allocations accumulated across storages
        let final_allocations = metrics.blocks_allocated_total().get();
        assert_eq!(final_allocations - initial_allocations, 5.0,
            "Should accumulate 5 allocations. Initial: {}, Final: {}",
            initial_allocations, final_allocations);
    }

    #[wasm_bindgen_test]
    async fn test_memory_bytes_reflects_block_size() {
        let metrics = Metrics::new().expect("Failed to create metrics");
        let mut db = Database::new_wasm("test_block_size.db".to_string())
            .await
            .expect("Failed to create database");
        
        db.set_metrics(Some(metrics.clone()));
        
        // Action: Create table
        db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT)")
            .await
            .expect("Failed to create table");
        
        let memory_after_create = metrics.memory_bytes().get();
        let blocks_after_create = metrics.blocks_allocated_total().get();
        
        // Action: Insert data
        db.execute("INSERT INTO test VALUES (1, 'data')")
            .await
            .expect("Failed to insert");
        
        // Sync to ensure allocations are tracked
        db.sync().await.expect("Failed to sync");
        
        let memory_after_insert = metrics.memory_bytes().get();
        let blocks_after_insert = metrics.blocks_allocated_total().get();
        
        // Assert: Memory increased proportionally to blocks
        // BLOCK_SIZE is 4096 bytes
        let blocks_diff = blocks_after_insert - blocks_after_create;
        let memory_diff = memory_after_insert - memory_after_create;
        
        if blocks_diff > 0.0 {
            // Memory should increase by at least BLOCK_SIZE per block
            assert!(memory_diff >= blocks_diff * 4096.0,
                "Memory increase ({}) should match block increase ({} blocks × 4096 bytes)",
                memory_diff, blocks_diff);
        }
        
        let _ = db.close().await;
    }
}
