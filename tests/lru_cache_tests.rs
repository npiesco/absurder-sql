// LRU cache behavior tests for BlockStorage

#![cfg(not(target_arch = "wasm32"))]
use absurder_sql::storage::{BLOCK_SIZE, BlockStorage};
use serial_test::serial;
use tempfile::TempDir;
#[path = "common/mod.rs"]
mod common;

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_lru_eviction_of_clean_blocks() {
    // capacity = 2
    let tmp = TempDir::new().expect("tempdir");
    // Safety: per-test isolated env var, tests are serialized
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());
    let mut storage = BlockStorage::new_with_capacity("test_lru_clean", 2)
        .await
        .expect("Should create storage");

    // Write blocks 1 and 2 (both clean after write but marked dirty until sync)
    // For eviction test of clean blocks, we will sync after writes to make them clean in cache
    let data1 = vec![1u8; BLOCK_SIZE];
    let data2 = vec![2u8; BLOCK_SIZE];
    storage.write_block(1, data1).await.expect("write 1");
    storage.write_block(2, data2).await.expect("write 2");
    storage.sync().await.expect("sync to clear dirty");

    // Access block 1 to make it most-recently used
    let _ = storage.read_block(1).await.expect("read 1");

    // Insert block 3, should evict least-recent clean (block 2)
    let data3 = vec![3u8; BLOCK_SIZE];
    storage.write_block(3, data3).await.expect("write 3");
    storage.sync().await.expect("sync to clear dirty");

    assert!(storage.is_cached(1), "block 1 should remain cached as MRU");
    assert!(
        storage.is_cached(3),
        "block 3 should be cached after insert"
    );
    assert!(
        !storage.is_cached(2),
        "block 2 should be evicted as LRU clean block"
    );
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_lru_does_not_evict_dirty_blocks() {
    // capacity = 2
    let tmp = TempDir::new().expect("tempdir");
    // Safety: per-test isolated env var, tests are serialized
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());
    let mut storage = BlockStorage::new_with_capacity("test_lru_dirty", 2)
        .await
        .expect("Should create storage");

    // Write blocks 10 and 11 and DO NOT sync, keeping them dirty
    let data10 = vec![10u8; BLOCK_SIZE];
    let data11 = vec![11u8; BLOCK_SIZE];
    storage.write_block(10, data10).await.expect("write 10");
    storage.write_block(11, data11).await.expect("write 11");

    // Insert block 12 (would exceed capacity if evicting is required)
    let data12 = vec![12u8; BLOCK_SIZE];
    storage.write_block(12, data12).await.expect("write 12");

    // Expectation: dirty blocks are not evicted. Cache may temporarily exceed capacity.
    assert!(storage.is_cached(10), "dirty block 10 must not be evicted");
    assert!(storage.is_cached(11), "dirty block 11 must not be evicted");
    assert!(storage.is_cached(12), "new block 12 should be cached");

    // Optionally, ensure at least 3 items present now
    assert!(
        storage.get_cache_size() >= 3,
        "cache should hold all three blocks since two are dirty"
    );
}
