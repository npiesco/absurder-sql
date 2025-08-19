// Native tests for metadata persistence across instances and mismatch detection after restart

#![cfg(not(target_arch = "wasm32"))]
use sqlite_indexeddb_rs::storage::{BlockStorage, BLOCK_SIZE};
use tempfile::TempDir;
use serial_test::serial;
#[path = "common/mod.rs"]
mod common;

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_native_metadata_persists_across_instances() {
    let db_name = "native_meta_persist_db";
    let tmp = TempDir::new().expect("tempdir");
    // Safety: per-test isolated env var, tests are serialized
    common::set_var("DATASYNC_FS_BASE", tmp.path());

    // Instance 1: write and sync to persist data + metadata
    let mut s1 = BlockStorage::new_with_capacity(db_name, 8)
        .await
        .expect("create storage s1");

    let block_id = 7u64;
    let data = vec![0xABu8; BLOCK_SIZE];
    s1.write_block(block_id, data.clone()).await.expect("write block");
    s1.sync().await.expect("sync s1");

    // Drop first instance
    drop(s1);

    // Instance 2: metadata should be restored from native test globals
    let mut s2 = BlockStorage::new(db_name)
        .await
        .expect("create storage s2");

    let restored = s2.get_block_checksum(block_id);
    assert!(restored.is_some(), "checksum should be restored after restart");

    // Read should succeed and verify against restored checksum
    let out = s2.read_block(block_id).await.expect("read after restart ok");
    assert_eq!(out, data, "data should match across instances");
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_native_checksum_mismatch_after_restart() {
    let db_name = "native_meta_mismatch_db";
    let tmp = TempDir::new().expect("tempdir");
    // Safety: per-test isolated env var, tests are serialized
    common::set_var("DATASYNC_FS_BASE", tmp.path());

    // Instance 1: write and sync
    let mut s1 = BlockStorage::new_with_capacity(db_name, 8)
        .await
        .expect("create storage s1");

    let block_id = 11u64;
    let data = vec![0xEEu8; BLOCK_SIZE];
    s1.write_block(block_id, data).await.expect("write block");
    s1.sync().await.expect("sync s1");

    // Drop first instance
    drop(s1);

    // Instance 2: restore, then corrupt stored checksum via test-only hook
    let mut s2 = BlockStorage::new(db_name)
        .await
        .expect("create storage s2");

    // Sanity: checksum restored
    assert!(s2.get_block_checksum(block_id).is_some());

    // Corrupt checksum to simulate mismatch on read
    s2.set_block_checksum_for_testing(block_id, 123456789);

    let err = s2
        .read_block(block_id)
        .await
        .expect_err("expected checksum mismatch after corruption");
    assert_eq!(err.code, "CHECKSUM_MISMATCH");
}
