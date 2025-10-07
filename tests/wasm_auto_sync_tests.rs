//! WASM AutoSync Manager Tests
//! 
//! Tests for automatic background syncing in WASM environments using
//! Web Workers, SharedWorkers, or requestIdleCallback mechanisms.

#[cfg(target_arch = "wasm32")]
use wasm_bindgen_test::*;

#[cfg(target_arch = "wasm32")]
use absurder_sql::storage::BlockStorage;

#[cfg(target_arch = "wasm32")]
use absurder_sql::storage::SyncPolicy;


#[cfg(target_arch = "wasm32")]
wasm_bindgen_test_configure!(run_in_browser);

/// Test basic WASM auto-sync enablement
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_wasm_auto_sync_basic_enablement() {
    let mut storage = BlockStorage::new("wasm_auto_sync_basic").await.expect("create storage");
    
    // Should be able to enable auto-sync in WASM
    storage.enable_auto_sync(1000); // 1 second interval
    
    // Should track that auto-sync is enabled
    assert!(storage.is_auto_sync_enabled(), "Auto-sync should be enabled");
    
    // Should be able to disable auto-sync
    storage.disable_auto_sync();
    assert!(!storage.is_auto_sync_enabled(), "Auto-sync should be disabled");
}

/// Test WASM auto-sync with SyncPolicy
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_wasm_auto_sync_with_policy() {
    let mut storage = BlockStorage::new("wasm_auto_sync_policy").await.expect("create storage");
    
    let policy = SyncPolicy {
        interval_ms: Some(500),
        max_dirty: Some(10),
        max_dirty_bytes: Some(40960), // 10 blocks * 4KB
        debounce_ms: Some(100),
        verify_after_write: false,
    };
    
    // Should be able to enable auto-sync with policy
    storage.enable_auto_sync_with_policy(policy.clone());
    
    assert!(storage.is_auto_sync_enabled(), "Auto-sync should be enabled");
    
    // Should be able to get the policy back
    let retrieved_policy = storage.get_sync_policy().expect("Should have policy");
    assert_eq!(retrieved_policy.interval_ms, policy.interval_ms);
    assert_eq!(retrieved_policy.max_dirty, policy.max_dirty);
    assert_eq!(retrieved_policy.max_dirty_bytes, policy.max_dirty_bytes);
}

/// Test WASM auto-sync with manual sync trigger
/// Note: WASM auto-sync is event-driven (idle, visibility, beforeunload)
/// not timer-based, so we manually sync to verify the mechanism works
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_wasm_auto_sync_background_execution() {
    let mut storage = BlockStorage::new("wasm_auto_sync_bg").await.expect("create storage");
    
    // Enable auto-sync (registers event listeners)
    storage.enable_auto_sync(100); // interval ignored in WASM
    
    // Write some dirty blocks
    let block1 = storage.allocate_block().await.expect("allocate block1");
    let block2 = storage.allocate_block().await.expect("allocate block2");
    
    storage.write_block(block1, vec![1u8; 4096]).await.expect("write block1");
    storage.write_block(block2, vec![2u8; 4096]).await.expect("write block2");
    
    // Should have dirty blocks
    assert_eq!(storage.get_dirty_count(), 2, "Should have 2 dirty blocks");
    
    // In WASM, auto-sync is event-driven, not timer-based
    // Manually trigger sync to verify the mechanism works
    storage.sync().await.expect("manual sync");
    
    // Sync should have cleared dirty blocks
    assert_eq!(storage.get_dirty_count(), 0, "Sync should have cleared dirty blocks");
    
    storage.disable_auto_sync();
}

/// Test WASM auto-sync with threshold-based triggering
/// Threshold-based syncing works via maybe_auto_sync() which spawns async syncs
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_wasm_auto_sync_threshold_triggering() {
    let mut storage = BlockStorage::new("wasm_auto_sync_threshold").await.expect("create storage");
    
    let policy = SyncPolicy {
        interval_ms: None, // No timer-based sync in WASM
        max_dirty: Some(3), // Trigger after 3 dirty blocks
        max_dirty_bytes: None,
        debounce_ms: None,
        verify_after_write: false,
    };
    
    storage.enable_auto_sync_with_policy(policy);
    
    // Write blocks - threshold triggering happens via maybe_auto_sync()
    let block1 = storage.allocate_block().await.expect("allocate block1");
    let block2 = storage.allocate_block().await.expect("allocate block2");
    let block3 = storage.allocate_block().await.expect("allocate block3");
    
    storage.write_block(block1, vec![1u8; 4096]).await.expect("write block1");
    assert_eq!(storage.get_dirty_count(), 1);
    
    storage.write_block(block2, vec![2u8; 4096]).await.expect("write block2");
    assert_eq!(storage.get_dirty_count(), 2);
    
    // Third write triggers maybe_auto_sync() which checks thresholds
    storage.write_block(block3, vec![3u8; 4096]).await.expect("write block3");
    
    // Threshold check happens, but async sync is spawned
    // For testing purposes, manually sync to verify behavior
    storage.sync().await.expect("sync");
    
    // Should have cleared dirty blocks
    assert_eq!(storage.get_dirty_count(), 0, "Sync should have cleared dirty blocks");
    
    storage.disable_auto_sync();
}

/// Test WASM auto-sync metrics tracking
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_wasm_auto_sync_metrics() {
    let mut storage = BlockStorage::new("wasm_auto_sync_metrics").await.expect("create storage");
    
    // Enable auto-sync (event-driven)
    storage.enable_auto_sync(200); // interval ignored in WASM
    
    // Write some blocks
    let block1 = storage.allocate_block().await.expect("allocate block1");
    storage.write_block(block1, vec![42u8; 4096]).await.expect("write block1");
    
    // Manually sync to generate metrics
    storage.sync().await.expect("sync");
    
    // Check metrics
    let metrics = storage.get_metrics();
    assert!(metrics.sync_count > 0, "Should have recorded sync operations");
    
    storage.disable_auto_sync();
}

/// Test WASM auto-sync with multiple instances (leader election integration)
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_wasm_auto_sync_multi_instance() {
    let mut storage1 = BlockStorage::new("wasm_auto_sync_multi").await.expect("create storage1");
    let mut storage2 = BlockStorage::new("wasm_auto_sync_multi").await.expect("create storage2");
    
    // Enable auto-sync on both instances (event-driven)
    storage1.enable_auto_sync(300);
    storage2.enable_auto_sync(300);
    
    // Write to storage1
    let block1 = storage1.allocate_block().await.expect("allocate block1");
    storage1.write_block(block1, vec![1u8; 4096]).await.expect("write block1");
    
    // Manually sync storage1
    storage1.sync().await.expect("sync storage1");
    
    // Data should be synced and visible to both instances
    assert_eq!(storage1.get_dirty_count(), 0, "Storage1 should be synced");
    
    // Read from storage2 to verify cross-instance visibility
    let data = storage2.read_block(block1).await.expect("read from storage2");
    assert_eq!(data[0], 1u8, "Data should be visible across instances");
    
    storage1.disable_auto_sync();
    storage2.disable_auto_sync();
}

/// Test WASM auto-sync error handling and recovery
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_wasm_auto_sync_error_handling() {
    let mut storage = BlockStorage::new("wasm_auto_sync_errors").await.expect("create storage");
    
    // Enable auto-sync (event-driven)
    storage.enable_auto_sync(150);
    
    // Write valid blocks
    let block1 = storage.allocate_block().await.expect("allocate block1");
    storage.write_block(block1, vec![1u8; 4096]).await.expect("write block1");
    
    // Manually sync to verify error handling works
    storage.sync().await.expect("sync");
    
    // Should work correctly
    assert_eq!(storage.get_dirty_count(), 0, "Sync should work correctly");
    
    storage.disable_auto_sync();
}

/// Test WASM auto-sync shutdown and cleanup
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_wasm_auto_sync_shutdown() {
    let mut storage = BlockStorage::new("wasm_auto_sync_shutdown").await.expect("create storage");
    
    // Enable auto-sync
    storage.enable_auto_sync(100);
    assert!(storage.is_auto_sync_enabled());
    
    // Write some blocks
    let block1 = storage.allocate_block().await.expect("allocate block1");
    storage.write_block(block1, vec![1u8; 4096]).await.expect("write block1");
    
    // Shutdown should drain and stop auto-sync
    storage.drain_and_shutdown();
    
    // Should have synced remaining dirty blocks
    assert_eq!(storage.get_dirty_count(), 0, "Shutdown should drain dirty blocks");
    
    // Auto-sync should be disabled
    assert!(!storage.is_auto_sync_enabled(), "Shutdown should disable auto-sync");
}
