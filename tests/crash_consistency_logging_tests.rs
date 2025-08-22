// Crash consistency logging tests for fs_persist
//
// Ensures we emit clear, production-grade log messages around sync/commit and
// startup recovery operations.

#![cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]

use sqlite_indexeddb_rs::storage::{BlockStorage, BLOCK_SIZE};
use sqlite_indexeddb_rs::storage::block_storage::{RecoveryMode, RecoveryOptions, CorruptionAction};
use tempfile::TempDir;
use serial_test::serial;
use std::fs;
use std::io::Write;
use std::path::PathBuf;

#[path = "common/mod.rs"]
mod common;

fn setup_env_and_logger(tmp: &TempDir) {
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    common::init_test_logger();
    common::clear_logs();
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn logs_alt_mirror_on_sync_dirty() {
    let tmp_base = TempDir::new().expect("tempdir base");
    // Set base to tmp_base for construction
    common::set_var("DATASYNC_FS_BASE", tmp_base.path());
    common::init_test_logger();
    common::clear_logs();

    let mut storage = BlockStorage::new_with_capacity("alt_mirror_db", 8)
        .await
        .expect("create storage");

    // Make a block dirty
    storage
        .write_block(2, vec![0xCD; BLOCK_SIZE])
        .await
        .expect("write block");

    // Switch DATASYNC_FS_BASE to a different directory to trigger (alt) mirror path
    let tmp_alt = TempDir::new().expect("tempdir alt");
    common::set_var("DATASYNC_FS_BASE", tmp_alt.path());
    common::clear_logs();

    storage.sync().await.expect("sync");

    let logs = common::take_logs_joined();
    assert!(logs.contains("Syncing 1 dirty blocks"), "missing sync start log. logs=\n{}", logs);
    assert!(logs.contains("[fs_persist] (alt) writing pending metadata"), "missing (alt) pending write log. logs=\n{}", logs);
    assert!(logs.contains("[fs_persist] (alt) finalized metadata rename"), "missing (alt) finalize log. logs=\n{}", logs);
    assert!(logs.contains("Successfully synced 1 blocks"), "missing sync success log. logs=\n{}", logs);
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn logs_startup_recovery_stray_cleanup_and_summary() {
    let tmp = TempDir::new().expect("tempdir");
    setup_env_and_logger(&tmp);

    // Create a stray block file without metadata
    let mut db_dir = PathBuf::from(tmp.path());
    db_dir.push("recover_stray_cleanup");
    let blocks_dir = db_dir.join("blocks");
    fs::create_dir_all(&blocks_dir).expect("mkdirs");
    let stray_id = 99u64;
    let stray_path = blocks_dir.join(format!("block_{}.bin", stray_id));
    {
        let mut f = fs::File::create(&stray_path).expect("stray create");
        f.write_all(&vec![0u8; BLOCK_SIZE]).expect("stray write");
    }

    // Construct with recovery which should detect and remove the stray
    let _storage = BlockStorage::new_with_recovery_options(
        "recover_stray_cleanup",
        RecoveryOptions { mode: RecoveryMode::Full, on_corruption: CorruptionAction::Report }
    ).await.expect("create with recovery");

    let logs = common::take_logs_joined();
    assert!(logs.contains("[fs] Found 1 stray block files with no metadata"), "missing stray-detected log. logs=\n{}", logs);
    assert!(logs.contains("[fs] Removed stray block file"), "missing stray-removed log. logs=\n{}", logs);
    assert!(logs.contains("Startup recovery completed:"), "missing recovery summary log. logs=\n{}", logs);
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn logs_sync_pending_commit_and_finalize() {
    let tmp = TempDir::new().expect("tempdir");
    setup_env_and_logger(&tmp);

    let mut storage = BlockStorage::new_with_capacity("log_sync_commit", 8)
        .await
        .expect("create storage");

    // Make a block dirty and sync
    storage
        .write_block(1, vec![0xAB; BLOCK_SIZE])
        .await
        .expect("write block");

    storage.sync().await.expect("sync");

    let logs = common::take_logs_joined();
    assert!(logs.contains("Syncing 1 dirty blocks"), "missing sync start log. logs=\n{}", logs);
    assert!(logs.contains("[fs_persist] writing pending metadata"), "missing pending metadata write log. logs=\n{}", logs);
    assert!(logs.contains("[fs_persist] finalized metadata rename"), "missing metadata finalize log. logs=\n{}", logs);
    assert!(logs.contains("Successfully synced 1 blocks"), "missing sync success log. logs=\n{}", logs);
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn logs_cleanup_only_when_no_dirty() {
    let tmp = TempDir::new().expect("tempdir");
    setup_env_and_logger(&tmp);

    let mut storage = BlockStorage::new_with_capacity("log_cleanup_only", 8)
        .await
        .expect("create storage");

    // No dirty blocks; sync should perform cleanup-only commit path
    storage.sync().await.expect("sync");

    let logs = common::take_logs_joined();
    assert!(logs.contains("No dirty blocks to sync"), "missing 'no dirty' log. logs=\n{}", logs);
    assert!(logs.contains("[fs_persist] cleanup-only: writing pending metadata"), "missing cleanup-only pending write log. logs=\n{}", logs);
    assert!(logs.contains("[fs_persist] cleanup-only: finalized metadata rename"), "missing cleanup-only finalize log. logs=\n{}", logs);
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn logs_startup_recovery_finalizes_pending() {
    let tmp = TempDir::new().expect("tempdir");
    setup_env_and_logger(&tmp);

    // Pre-create a pending metadata commit with a valid referenced block
    let mut db_dir = PathBuf::from(tmp.path());
    db_dir.push("recover_finalizes");
    let blocks_dir = db_dir.join("blocks");
    fs::create_dir_all(&blocks_dir).expect("mkdirs");

    // Create a valid block file of correct size
    let block_id = 5u64;
    let bpath = blocks_dir.join(format!("block_{}.bin", block_id));
    {
        let mut f = fs::File::create(&bpath).expect("block create");
        f.write_all(&vec![0u8; BLOCK_SIZE]).expect("block write");
    }

    // Write metadata.json.pending referencing the block
    let meta_pending = db_dir.join("metadata.json.pending");
    let pending_json = serde_json::json!({
        "entries": [[block_id, {
            "checksum": 0u64,
            "last_modified_ms": 0u64,
            "version": 1u64,
            "algo": "FastHash"
        }]]
    });
    {
        let mut f = fs::File::create(&meta_pending).expect("pending create");
        f.write_all(serde_json::to_string(&pending_json).unwrap().as_bytes()).expect("pending write");
    }

    // Construct with recovery options (mode doesn't matter for pending handling)
    let _storage = BlockStorage::new_with_recovery_options(
        "recover_finalizes",
        RecoveryOptions { mode: RecoveryMode::Full, on_corruption: CorruptionAction::Report }
    ).await.expect("create with recovery");

    let logs = common::take_logs_joined();
    assert!(logs.contains("Found pending metadata commit marker at startup"), "missing pending-detected log. logs=\n{}", logs);
    assert!(logs.contains("Finalized pending metadata commit to"), "missing finalize-pending log. logs=\n{}", logs);
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn logs_startup_recovery_rolls_back_invalid_pending() {
    let tmp = TempDir::new().expect("tempdir");
    setup_env_and_logger(&tmp);

    // Pending references a missing block -> should rollback
    let mut db_dir = PathBuf::from(tmp.path());
    db_dir.push("recover_rolls_back");
    let blocks_dir = db_dir.join("blocks");
    fs::create_dir_all(&blocks_dir).expect("mkdirs");

    let meta_pending = db_dir.join("metadata.json.pending");
    let pending_json = serde_json::json!({
        "entries": [[7u64, {
            "checksum": 0u64,
            "last_modified_ms": 0u64,
            "version": 1u64,
            "algo": "FastHash"
        }]]
    });
    {
        let mut f = fs::File::create(&meta_pending).expect("pending create");
        f.write_all(serde_json::to_string(&pending_json).unwrap().as_bytes()).expect("pending write");
    }

    let _storage = BlockStorage::new_with_recovery_options(
        "recover_rolls_back",
        RecoveryOptions { mode: RecoveryMode::Full, on_corruption: CorruptionAction::Report }
    ).await.expect("create with recovery");

    let logs = common::take_logs_joined();
    assert!(logs.contains("Found pending metadata commit marker at startup"), "missing pending-detected log. logs=\n{}", logs);
    assert!(logs.contains("Pending commit references missing block file"), "missing missing-block warn log. logs=\n{}", logs);
    assert!(logs.contains("Rolled back pending metadata commit; kept"), "missing rollback log. logs=\n{}", logs);
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn logs_allocations_write_cleanup_only() {
    let tmp = TempDir::new().expect("tempdir");
    setup_env_and_logger(&tmp);

    let mut storage = BlockStorage::new_with_capacity("log_alloc_cleanup", 8)
        .await
        .expect("create storage");

    // No dirty blocks; cleanup-only path
    storage.sync().await.expect("sync");

    let logs = common::take_logs_joined();
    assert!(logs.contains("No dirty blocks to sync"), "missing 'no dirty' log. logs=\n{}", logs);
    assert!(logs.contains("wrote allocations.json"), "missing primary allocations write log. logs=\n{}", logs);
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn logs_allocations_write_sync_dirty_alt() {
    let tmp_base = TempDir::new().expect("tempdir base");
    // Construct with base A
    common::set_var("DATASYNC_FS_BASE", tmp_base.path());
    common::init_test_logger();
    common::clear_logs();

    let mut storage = BlockStorage::new_with_capacity("log_alloc_dirty_alt", 8)
        .await
        .expect("create storage");

    // Make a block dirty
    storage
        .write_block(3, vec![0xEE; BLOCK_SIZE])
        .await
        .expect("write block");

    // Switch to base B before sync to trigger (alt) mirror path
    let tmp_alt = TempDir::new().expect("tempdir alt");
    common::set_var("DATASYNC_FS_BASE", tmp_alt.path());
    common::clear_logs();

    storage.sync().await.expect("sync");

    let logs = common::take_logs_joined();
    assert!(logs.contains("Syncing 1 dirty blocks"), "missing sync start log. logs=\n{}", logs);
    assert!(logs.contains("wrote allocations.json"), "missing primary allocations write log. logs=\n{}", logs);
    assert!(logs.contains("(alt) wrote allocations.json"), "missing alt allocations write log. logs=\n{}", logs);
}
