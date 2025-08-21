#![cfg(not(target_arch = "wasm32"))]

// These tests exercise crash consistency: simulate a crash mid-commit by leaving a
// metadata commit marker and verify startup recovery finalizes or rolls back.

#[cfg(feature = "fs_persist")]
use sqlite_indexeddb_rs::storage::block_storage::{
    BlockStorage, BLOCK_SIZE, RecoveryOptions, RecoveryMode, CorruptionAction,
};
#[cfg(feature = "fs_persist")]
use serial_test::serial;
#[cfg(feature = "fs_persist")]
use tempfile::TempDir;
#[cfg(feature = "fs_persist")]
use std::fs;
#[cfg(feature = "fs_persist")]
use std::path::PathBuf;

#[cfg(feature = "fs_persist")]
#[path = "common/mod.rs"]
mod common;

#[tokio::test(flavor = "current_thread")]
#[serial]
#[cfg(feature = "fs_persist")]
async fn test_crash_finalize_pending_metadata_when_data_present() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let db = "test_crash_finalize_pending";

    // Instance 1: baseline v1
    let mut s = BlockStorage::new_with_capacity(db, 8)
        .await
        .expect("create storage");
    let bid = s.allocate_block().await.expect("alloc");
    assert_eq!(bid, 1);
    let data_v1 = vec![1u8; BLOCK_SIZE];
    s.write_block(bid, data_v1.clone()).await.expect("write v1");
    s.sync().await.expect("sync v1");

    // Paths
    let base: PathBuf = tmp.path().into();
    let db_dir = base.join(db);
    let blocks_dir = db_dir.join("blocks");
    let meta_path = db_dir.join("metadata.json");
    let meta_pending_path = db_dir.join("metadata.json.pending");

    // Save v1 metadata
    let meta_v1 = fs::read_to_string(&meta_path).expect("read meta v1");

    // Produce v2 by actually committing via the API
    let data_v2 = vec![2u8; BLOCK_SIZE];
    s.write_block(bid, data_v2.clone()).await.expect("write v2");
    s.sync().await.expect("sync v2");

    // Capture v2 metadata then transform it into a pending marker state
    let meta_v2 = fs::read_to_string(&meta_path).expect("read meta v2");
    fs::rename(&meta_path, &meta_pending_path).expect("rename meta -> pending");
    fs::write(&meta_path, &meta_v1).expect("restore meta v1");

    drop(s); // simulate crash/restart boundary

    // Restart with startup recovery: expect it to finalize the pending commit
    let opts = RecoveryOptions { mode: RecoveryMode::Full, on_corruption: CorruptionAction::Report };
    let mut s2 = BlockStorage::new_with_recovery_options(db, opts)
        .await
        .expect("reopen with recovery");

    // Assert: pending removed, metadata finalized to v2, data readable as v2
    assert!(!meta_pending_path.exists(), "pending metadata should be removed (finalized)");
    let meta_now = fs::read_to_string(&meta_path).expect("read meta after recovery");
    assert_eq!(meta_now, meta_v2, "metadata should be finalized to v2");

    let read_back = s2.read_block_sync(bid).expect("read block after recovery");
    assert_eq!(read_back, data_v2, "block contents should reflect v2");

    // And the block file exists
    assert!(blocks_dir.join(format!("block_{}.bin", bid)).exists());
}

#[tokio::test(flavor = "current_thread")]
#[serial]
#[cfg(feature = "fs_persist")]
async fn test_crash_rollback_pending_metadata_when_data_missing() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let db = "test_crash_rollback_pending";

    // Instance 1: baseline v1 with one block
    let mut s = BlockStorage::new_with_capacity(db, 8)
        .await
        .expect("create storage");
    let bid1 = s.allocate_block().await.expect("alloc1");
    assert_eq!(bid1, 1);
    let data1 = vec![9u8; BLOCK_SIZE];
    s.write_block(bid1, data1.clone()).await.expect("write v1");
    s.sync().await.expect("sync v1");

    // Paths
    let base: PathBuf = tmp.path().into();
    let db_dir = base.join(db);
    let blocks_dir = db_dir.join("blocks");
    let meta_path = db_dir.join("metadata.json");
    let meta_pending_path = db_dir.join("metadata.json.pending");

    // Save v1 metadata
    let meta_v1 = fs::read_to_string(&meta_path).expect("read meta v1");

    // Produce v2 that introduces a new block (id 2)
    let bid2 = s.allocate_block().await.expect("alloc2");
    assert_eq!(bid2, 2);
    let data2 = vec![7u8; BLOCK_SIZE];
    s.write_block(bid2, data2.clone()).await.expect("write v2 b2");
    s.sync().await.expect("sync v2");

    // Capture v2 metadata as pending, but remove the newly introduced data file to simulate partial commit
    let _meta_v2 = fs::read_to_string(&meta_path).expect("read meta v2");
    let b2_path = blocks_dir.join(format!("block_{}.bin", bid2));
    assert!(b2_path.exists());
    fs::remove_file(&b2_path).expect("remove new block file to simulate crash before data persisted");

    fs::rename(&meta_path, &meta_pending_path).expect("rename meta -> pending");
    fs::write(&meta_path, &meta_v1).expect("restore meta v1");

    drop(s); // simulate crash/restart boundary

    // Restart with startup recovery: expect it to roll back the pending commit
    let opts = RecoveryOptions { mode: RecoveryMode::Full, on_corruption: CorruptionAction::Report };
    let _s2 = BlockStorage::new_with_recovery_options(db, opts)
        .await
        .expect("reopen with recovery");

    // Assert: pending removed, metadata remains v1, and missing block2 file not recreated
    assert!(!meta_pending_path.exists(), "pending metadata should be removed (rolled back)");
    let meta_now = fs::read_to_string(&meta_path).expect("read meta after recovery");
    assert_eq!(meta_now, meta_v1, "metadata should remain at v1 after rollback");
    assert!(!blocks_dir.join(format!("block_{}.bin", bid2)).exists(), "no stray file for missing block");
}

#[tokio::test(flavor = "current_thread")]
#[serial]
#[cfg(feature = "fs_persist")]
async fn test_crash_rollback_on_malformed_pending_metadata() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let db = "test_crash_malformed_pending";

    // Instance 1: baseline v1
    let mut s = BlockStorage::new_with_capacity(db, 8)
        .await
        .expect("create storage");
    let bid = s.allocate_block().await.expect("alloc");
    assert_eq!(bid, 1);
    let data_v1 = vec![1u8; BLOCK_SIZE];
    s.write_block(bid, data_v1.clone()).await.expect("write v1");
    s.sync().await.expect("sync v1");

    // Paths
    let base: PathBuf = tmp.path().into();
    let db_dir = base.join(db);
    let meta_path = db_dir.join("metadata.json");
    let meta_pending_path = db_dir.join("metadata.json.pending");

    // Save v1 metadata
    let meta_v1 = fs::read_to_string(&meta_path).expect("read meta v1");

    // Produce v2 via normal API
    let data_v2 = vec![2u8; BLOCK_SIZE];
    s.write_block(bid, data_v2).await.expect("write v2");
    s.sync().await.expect("sync v2");

    // Create a malformed pending metadata file and restore v1 to metadata.json
    fs::write(&meta_pending_path, b"not-json").expect("write malformed pending");
    fs::write(&meta_path, &meta_v1).expect("restore meta v1");

    drop(s); // simulate crash/restart boundary

    // Restart with startup recovery: expect rollback (remove pending, keep v1)
    let opts = RecoveryOptions { mode: RecoveryMode::Full, on_corruption: CorruptionAction::Report };
    let _s2 = BlockStorage::new_with_recovery_options(db, opts)
        .await
        .expect("reopen with recovery");

    assert!(!meta_pending_path.exists(), "pending metadata should be removed on rollback for malformed file");
    let meta_now = fs::read_to_string(&meta_path).expect("read meta after recovery");
    assert_eq!(meta_now, meta_v1, "metadata should remain at v1 after rollback of malformed pending");
}

#[tokio::test(flavor = "current_thread")]
#[serial]
#[cfg(feature = "fs_persist")]
async fn test_crash_rollback_on_invalid_block_size_in_pending() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let db = "test_crash_invalid_size_pending";

    // Instance 1: baseline v1 with one block
    let mut s = BlockStorage::new_with_capacity(db, 8)
        .await
        .expect("create storage");
    let bid1 = s.allocate_block().await.expect("alloc1");
    assert_eq!(bid1, 1);
    let data1 = vec![9u8; BLOCK_SIZE];
    s.write_block(bid1, data1.clone()).await.expect("write v1");
    s.sync().await.expect("sync v1");

    // Paths
    let base: PathBuf = tmp.path().into();
    let db_dir = base.join(db);
    let blocks_dir = db_dir.join("blocks");
    let meta_path = db_dir.join("metadata.json");
    let meta_pending_path = db_dir.join("metadata.json.pending");

    // Save v1 metadata
    let meta_v1 = fs::read_to_string(&meta_path).expect("read meta v1");

    // Produce v2 introducing a new block (id 2)
    let bid2 = s.allocate_block().await.expect("alloc2");
    assert_eq!(bid2, 2);
    let data2 = vec![7u8; BLOCK_SIZE];
    s.write_block(bid2, data2.clone()).await.expect("write v2 b2");
    s.sync().await.expect("sync v2");

    // Corrupt the new block file to an invalid size and synthesize a pending commit
    let b2_path = blocks_dir.join(format!("block_{}.bin", bid2));
    assert!(b2_path.exists());
    fs::write(&b2_path, vec![0u8; BLOCK_SIZE - 1]).expect("truncate/corrupt block file size");

    // Move current metadata to pending and restore v1 to metadata.json
    fs::rename(&meta_path, &meta_pending_path).expect("rename meta -> pending");
    fs::write(&meta_path, &meta_v1).expect("restore meta v1");

    drop(s); // simulate crash/restart boundary

    // Restart with startup recovery: expect rollback (invalid file size)
    let opts = RecoveryOptions { mode: RecoveryMode::Full, on_corruption: CorruptionAction::Report };
    let _s2 = BlockStorage::new_with_recovery_options(db, opts)
        .await
        .expect("reopen with recovery");

    // Assert: pending removed, metadata remains v1, and invalid file removed by reconciliation
    assert!(!meta_pending_path.exists(), "pending metadata should be removed (rolled back) due to invalid block size");
    let meta_now = fs::read_to_string(&meta_path).expect("read meta after recovery");
    assert_eq!(meta_now, meta_v1, "metadata should remain at v1 after rollback");
    assert!(!b2_path.exists(), "invalid-size block file should be removed during reconciliation");
}

#[tokio::test(flavor = "current_thread")]
#[serial]
#[cfg(feature = "fs_persist")]
async fn test_crash_finalize_pending_atomic_multi_block() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let db = "test_crash_finalize_atomic_multi";

    // Instance 1: baseline v1 with two blocks
    let mut s = BlockStorage::new_with_capacity(db, 8)
        .await
        .expect("create storage");
    let b1 = s.allocate_block().await.expect("alloc1");
    let b2 = s.allocate_block().await.expect("alloc2");
    assert_eq!((b1, b2), (1, 2));
    s.write_block(b1, vec![1u8; BLOCK_SIZE]).await.expect("write b1 v1");
    s.write_block(b2, vec![2u8; BLOCK_SIZE]).await.expect("write b2 v1");
    s.sync().await.expect("sync v1");

    // Paths
    let base: PathBuf = tmp.path().into();
    let db_dir = base.join(db);
    let meta_path = db_dir.join("metadata.json");
    let meta_pending_path = db_dir.join("metadata.json.pending");

    // Save v1 metadata
    let meta_v1 = fs::read_to_string(&meta_path).expect("read meta v1");

    // Produce v2 updating both blocks
    s.write_block(b1, vec![9u8; BLOCK_SIZE]).await.expect("write b1 v2");
    s.write_block(b2, vec![8u8; BLOCK_SIZE]).await.expect("write b2 v2");
    s.sync().await.expect("sync v2");

    // Capture v2 metadata, transform into pending, and restore v1
    let meta_v2 = fs::read_to_string(&meta_path).expect("read meta v2");
    fs::rename(&meta_path, &meta_pending_path).expect("rename meta -> pending");
    fs::write(&meta_path, &meta_v1).expect("restore meta v1");

    drop(s);

    // Restart: expect finalize to v2 (both blocks)
    let opts = RecoveryOptions { mode: RecoveryMode::Full, on_corruption: CorruptionAction::Report };
    let mut s2 = BlockStorage::new_with_recovery_options(db, opts)
        .await
        .expect("reopen with recovery");

    assert!(!meta_pending_path.exists(), "pending metadata should be removed (finalized)");
    let meta_now = fs::read_to_string(&meta_path).expect("read meta after recovery");
    assert_eq!(meta_now, meta_v2, "metadata should be finalized to v2 atomically");

    let rb1 = s2.read_block_sync(b1).expect("read b1");
    let rb2 = s2.read_block_sync(b2).expect("read b2");
    assert_eq!(rb1, vec![9u8; BLOCK_SIZE]);
    assert_eq!(rb2, vec![8u8; BLOCK_SIZE]);
}
