// Batch block operations tests for BlockStorage

#![cfg(not(target_arch = "wasm32"))]
use absurder_sql::storage::{BlockStorage, BLOCK_SIZE};
use tempfile::TempDir;
use serial_test::serial;
#[path = "common/mod.rs"]
mod common;

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_batch_write_and_read_basic() {
    let tmp = TempDir::new().expect("tempdir");
    // Safety: per-test isolated env var, tests are serialized
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let mut storage = BlockStorage::new_with_capacity("test_batch_basic", 3)
        .await
        .expect("Should create storage");

    // Prepare distinct data for blocks 1,2,3
    let d1 = vec![1u8; BLOCK_SIZE];
    let d2 = vec![2u8; BLOCK_SIZE];
    let d3 = vec![3u8; BLOCK_SIZE];

    // Batch write
    storage
        .write_blocks(vec![(1, d1.clone()), (2, d2.clone()), (3, d3.clone())])
        .await
        .expect("batch write");
    storage.sync().await.expect("sync to clear dirty");

    // Batch read
    let out = storage
        .read_blocks(&[1, 2, 3])
        .await
        .expect("batch read");

    assert_eq!(out.len(), 3);
    assert_eq!(out[0], d1);
    assert_eq!(out[1], d2);
    assert_eq!(out[2], d3);

    assert!(storage.is_cached(1));
    assert!(storage.is_cached(2));
    assert!(storage.is_cached(3));
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_batch_respects_lru_and_dirty() {
    // capacity = 2
    let tmp = TempDir::new().expect("tempdir");
    // Safety: per-test isolated env var, tests are serialized
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let mut storage = BlockStorage::new_with_capacity("test_batch_lru_dirty", 2)
        .await
        .expect("Should create storage");

    let d1 = vec![1u8; BLOCK_SIZE];
    let d2 = vec![2u8; BLOCK_SIZE];
    let d3 = vec![3u8; BLOCK_SIZE];

    // Batch write 1 and 2 (dirty)
    storage
        .write_blocks(vec![(1, d1.clone()), (2, d2.clone())])
        .await
        .expect("batch write 1,2");

    // Touch 1 to be MRU
    let _ = storage.read_block(1).await.expect("read 1");

    // Write 3 (dirty). Since 1 and 2 are dirty, no eviction should occur now
    storage
        .write_blocks(vec![(3, d3.clone())])
        .await
        .expect("write 3");

    assert!(storage.is_cached(1));
    assert!(storage.is_cached(2));
    assert!(storage.is_cached(3));
    assert!(storage.get_cache_size() >= 3);

    // Now sync; all become clean, eviction should kick in to enforce capacity
    storage.sync().await.expect("sync");

    // Expect LRU clean (block 2) to be evicted; 1 was MRU before 3 was written
    assert!(storage.is_cached(1), "block 1 should remain cached");
    assert!(storage.is_cached(3), "block 3 should remain cached");
    assert!(!storage.is_cached(2), "block 2 should be evicted as LRU clean after sync");
}
