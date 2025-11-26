#![cfg(not(target_arch = "wasm32"))]
use absurder_sql::storage::BlockStorage;
use serial_test::serial;
use tempfile::TempDir;
#[path = "common/mod.rs"]
mod common;

#[tokio::test]
#[serial]
async fn test_block_allocation_and_deallocation() {
    // Test that we can allocate and deallocate blocks properly
    let tmp = TempDir::new().expect("tempdir");
    // Safety: per-test isolated env var, tests are serialized
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());
    let mut storage = BlockStorage::new("test_allocation")
        .await
        .expect("Should create storage");

    // Test allocating new blocks
    let block1 = storage
        .allocate_block()
        .await
        .expect("Should allocate first block");
    let block2 = storage
        .allocate_block()
        .await
        .expect("Should allocate second block");

    // Blocks should be different
    assert_ne!(block1, block2, "Allocated blocks should have different IDs");

    // Test writing to allocated blocks
    let test_data = vec![42u8; 4096];
    storage
        .write_block(block1, test_data.clone())
        .await
        .expect("Should write to allocated block");

    // Test reading from allocated block
    let read_data = storage
        .read_block(block1)
        .await
        .expect("Should read from allocated block");
    assert_eq!(read_data, test_data, "Read data should match written data");

    // Test deallocating blocks
    storage
        .deallocate_block(block1)
        .await
        .expect("Should deallocate block");

    // After deallocation, the block should be available for reuse
    let block3 = storage
        .allocate_block()
        .await
        .expect("Should allocate block after deallocation");

    // The deallocated block should be reused
    assert_eq!(block1, block3, "Deallocated block should be reused");
}

#[tokio::test]
#[serial]
async fn test_block_allocation_tracking() {
    // Test that allocation tracking works correctly
    let tmp = TempDir::new().expect("tempdir");
    // Safety: per-test isolated env var, tests are serialized
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());
    let mut storage = BlockStorage::new("test_tracking")
        .await
        .expect("Should create storage");

    // Initially no blocks should be allocated
    assert_eq!(
        storage.get_allocated_count(),
        0,
        "Should start with 0 allocated blocks"
    );

    // Allocate some blocks
    let _block1 = storage.allocate_block().await.expect("Should allocate");
    assert_eq!(
        storage.get_allocated_count(),
        1,
        "Should have 1 allocated block"
    );

    let _block2 = storage.allocate_block().await.expect("Should allocate");
    assert_eq!(
        storage.get_allocated_count(),
        2,
        "Should have 2 allocated blocks"
    );

    // Deallocate one block
    storage
        .deallocate_block(_block1)
        .await
        .expect("Should deallocate");
    assert_eq!(
        storage.get_allocated_count(),
        1,
        "Should have 1 allocated block after deallocation"
    );
}

#[tokio::test]
#[serial]
async fn test_block_allocation_errors() {
    // Test error conditions for block allocation
    let tmp = TempDir::new().expect("tempdir");
    // Safety: per-test isolated env var, tests are serialized
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());
    let mut storage = BlockStorage::new("test_errors")
        .await
        .expect("Should create storage");

    // Test deallocating non-existent block
    let result = storage.deallocate_block(999999).await;
    assert!(
        result.is_err(),
        "Should error when deallocating non-existent block"
    );

    // Test double deallocation
    let block = storage.allocate_block().await.expect("Should allocate");
    storage
        .deallocate_block(block)
        .await
        .expect("Should deallocate first time");

    let result = storage.deallocate_block(block).await;
    assert!(result.is_err(), "Should error on double deallocation");
}
