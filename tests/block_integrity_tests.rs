// Block integrity verification tests for BlockStorage

#![cfg(not(target_arch = "wasm32"))]
use absurder_sql::storage::{BlockStorage, BLOCK_SIZE};
use tempfile::TempDir;
use serial_test::serial;
#[path = "common/mod.rs"]
mod common;

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_read_verifies_checksum_and_errors_on_mismatch() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let mut storage = BlockStorage::new_with_capacity("test_integrity_mismatch", 4)
        .await
        .expect("create storage");

    // Write known data
    let data = vec![5u8; BLOCK_SIZE];
    storage.write_block(1, data.clone()).await.expect("write block 1");

    // Ensure checksum exists
    let old_csum = storage.get_block_checksum(1).expect("checksum stored after write");
    assert!(old_csum > 0);

    // Intentionally set wrong checksum to simulate corruption detection path
    #[allow(unused_variables)]
    {
        // Only available in tests/debug builds; ignored in release
        storage.set_block_checksum_for_testing(1, old_csum.wrapping_add(12345).into());
    }

    // Now a read should verify checksum and return an error
    let err = storage.read_block(1).await.expect_err("expected checksum mismatch error");
    assert_eq!(err.code, "CHECKSUM_MISMATCH");
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_read_ok_when_checksum_matches() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let mut storage = BlockStorage::new_with_capacity("test_integrity_ok", 4)
        .await
        .expect("create storage");

    let data = vec![9u8; BLOCK_SIZE];
    storage.write_block(2, data.clone()).await.expect("write block 2");

    // Normal read should succeed and return the same data
    let out = storage.read_block(2).await.expect("read block 2 ok");
    assert_eq!(out, data);
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_verify_block_checksum_api() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let mut storage = BlockStorage::new_with_capacity("test_integrity_api", 4)
        .await
        .expect("create storage");

    let data = vec![1u8; BLOCK_SIZE];
    storage.write_block(3, data).await.expect("write block 3");

    // Sanity: explicit verify passes initially
    storage.verify_block_checksum(3).await.expect("verify ok initially");

    // Corrupt the stored checksum value to simulate mismatch
    let wrong = 42u64;
    storage.set_block_checksum_for_testing(3, wrong);

    let err = storage.verify_block_checksum(3).await.expect_err("expected mismatch from API");
    assert_eq!(err.code, "CHECKSUM_MISMATCH");
}
