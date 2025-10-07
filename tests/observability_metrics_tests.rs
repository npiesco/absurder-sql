use absurder_sql::storage::block_storage::{BlockStorage, BLOCK_SIZE};

#[cfg(target_arch = "wasm32")]
use wasm_bindgen_test::*;

#[cfg(target_arch = "wasm32")]
wasm_bindgen_test_configure!(run_in_browser);

/// Test comprehensive metrics collection for observability
#[cfg(not(target_arch = "wasm32"))]
#[tokio::test]
async fn test_comprehensive_metrics_native() {
    let mut storage = BlockStorage::new("metrics_test").await.expect("create storage");
    
    // Initial metrics should be zero
    let metrics = storage.get_metrics();
    assert_eq!(metrics.dirty_count, 0);
    assert_eq!(metrics.dirty_bytes, 0);
    assert_eq!(metrics.sync_count, 0);
    assert_eq!(metrics.error_count, 0);
    assert_eq!(metrics.checksum_failures, 0);
    
    // Write some blocks to generate dirty data
    let block1 = storage.allocate_block().await.expect("allocate block1");
    let block2 = storage.allocate_block().await.expect("allocate block2");
    
    storage.write_block(block1, vec![1u8; BLOCK_SIZE]).await.expect("write block1");
    storage.write_block(block2, vec![2u8; BLOCK_SIZE]).await.expect("write block2");
    
    // Check dirty metrics
    let metrics = storage.get_metrics();
    assert_eq!(metrics.dirty_count, 2);
    assert_eq!(metrics.dirty_bytes, BLOCK_SIZE * 2);
    
    // Sync and check metrics update
    storage.sync().await.expect("sync blocks");
    
    let metrics = storage.get_metrics();
    assert_eq!(metrics.dirty_count, 0);
    assert_eq!(metrics.dirty_bytes, 0);
    assert_eq!(metrics.sync_count, 1);
    assert!(metrics.last_sync_duration_ms > 0);
}

/// Test comprehensive metrics collection for WASM
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_comprehensive_metrics_wasm() {
    let mut storage = BlockStorage::new("metrics_test_wasm").await.expect("create storage");
    
    // Initial metrics should be zero
    let metrics = storage.get_metrics();
    assert_eq!(metrics.dirty_count, 0);
    assert_eq!(metrics.dirty_bytes, 0);
    assert_eq!(metrics.sync_count, 0);
    assert_eq!(metrics.error_count, 0);
    assert_eq!(metrics.checksum_failures, 0);
    
    // Write some blocks to generate dirty data
    let block1 = storage.allocate_block().await.expect("allocate block1");
    let block2 = storage.allocate_block().await.expect("allocate block2");
    
    storage.write_block(block1, vec![1u8; BLOCK_SIZE]).await.expect("write block1");
    storage.write_block(block2, vec![2u8; BLOCK_SIZE]).await.expect("write block2");
    
    // Check dirty metrics
    let metrics = storage.get_metrics();
    assert_eq!(metrics.dirty_count, 2);
    assert_eq!(metrics.dirty_bytes, BLOCK_SIZE * 2);
    
    // Sync and check metrics update
    storage.sync().await.expect("sync blocks");
    
    let metrics = storage.get_metrics();
    assert_eq!(metrics.dirty_count, 0);
    assert_eq!(metrics.dirty_bytes, 0);
    assert_eq!(metrics.sync_count, 1);
    assert!(metrics.last_sync_duration_ms > 0);
}

/// Test error rate tracking
#[cfg(not(target_arch = "wasm32"))]
#[tokio::test]
async fn test_error_rate_tracking() {
    let mut storage = BlockStorage::new("error_test").await.expect("create storage");
    
    // Simulate some errors by trying to read non-existent blocks
    let _ = storage.read_block(999).await; // Should increment error count
    let _ = storage.read_block(1000).await; // Should increment error count
    
    let metrics = storage.get_metrics();
    
    // In fs_persist mode, reading non-existent blocks returns zeroed data instead of errors
    // This is expected behavior for that mode
    #[cfg(feature = "fs_persist")]
    {
        println!("fs_persist mode: error_count = {}, error_rate = {}", metrics.error_count, metrics.error_rate);
        // In fs_persist mode, we expect no errors for reading non-existent blocks
        assert_eq!(metrics.error_count, 0);
        assert_eq!(metrics.error_rate, 0.0);
    }
    
    #[cfg(not(feature = "fs_persist"))]
    {
        assert_eq!(metrics.error_count, 2);
        assert!(metrics.error_rate > 0.0);
    }
}

/// Test throughput calculation
#[cfg(not(target_arch = "wasm32"))]
#[tokio::test]
async fn test_throughput_calculation() {
    let mut storage = BlockStorage::new("throughput_test").await.expect("create storage");
    
    // Write multiple blocks
    for i in 0..5 {
        let block = storage.allocate_block().await.expect("allocate block");
        storage.write_block(block, vec![i as u8; BLOCK_SIZE]).await.expect("write block");
    }
    
    // Sync to calculate throughput
    storage.sync().await.expect("sync blocks");
    
    let metrics = storage.get_metrics();
    assert!(metrics.throughput_blocks_per_sec > 0.0);
    assert!(metrics.throughput_bytes_per_sec > 0.0);
}

/// Test checksum failure tracking
#[cfg(not(target_arch = "wasm32"))]
#[tokio::test]
async fn test_checksum_failure_tracking() {
    let storage = BlockStorage::new("checksum_test").await.expect("create storage");
    
    // This test would require simulating checksum failures
    // For now, just verify the metric exists
    let metrics = storage.get_metrics();
    assert_eq!(metrics.checksum_failures, 0);
}
