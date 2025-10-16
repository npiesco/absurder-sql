#![cfg(not(target_arch = "wasm32"))]

// Covers mixed presence during a multi-block pending commit (fs_persist):
// - v2 metadata introduces/updates multiple blocks
// - at crash boundary, some new/updated files are present, others missing
// Expectation: startup recovery rolls back to v1, removes stray files not in v1,
// and leaves missing files absent.

#[cfg(feature = "fs_persist")]
use absurder_sql::storage::block_storage::{
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
async fn test_crash_rollback_pending_partial_multiblock_mixed_presence() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());
    let db = "test_crash_partial_multi_mixed";

    // Instance 1: baseline v1 with one block (b1)
    let mut s = BlockStorage::new_with_capacity(db, 8)
        .await
        .expect("create storage");
    let b1 = s.allocate_block().await.expect("alloc b1");
    assert_eq!(b1, 1);
    let b1_v1 = vec![0x11u8; BLOCK_SIZE];
    s.write_block(b1, b1_v1.clone()).await.expect("write b1 v1");
    s.sync().await.expect("sync v1");

    // Paths
    let base: PathBuf = tmp.path().into();
    let db_dir = base.join(db);
    let blocks_dir = db_dir.join("blocks");
    let meta_path = db_dir.join("metadata.json");
    let meta_pending_path = db_dir.join("metadata.json.pending");

    // Save v1 metadata text for later comparison
    let meta_v1 = fs::read_to_string(&meta_path).expect("read meta v1");

    // Produce v2: update b1 and introduce b2, b3
    let b2 = s.allocate_block().await.expect("alloc b2");
    let b3 = s.allocate_block().await.expect("alloc b3");
    assert_eq!((b2, b3), (2, 3));
    s.write_block(b1, vec![0x21u8; BLOCK_SIZE]).await.expect("write b1 v2");
    s.write_block(b2, vec![0x22u8; BLOCK_SIZE]).await.expect("write b2 v2");
    s.write_block(b3, vec![0x23u8; BLOCK_SIZE]).await.expect("write b3 v2");
    s.sync().await.expect("sync v2");

    // Capture v2 metadata as pending, but create mixed presence:
    // - keep b2 file present
    // - remove b3 file to simulate missing
    let _meta_v2 = fs::read_to_string(&meta_path).expect("read meta v2");
    let b2_path = blocks_dir.join(format!("block_{}.bin", b2));
    let b3_path = blocks_dir.join(format!("block_{}.bin", b3));
    assert!(b2_path.exists(), "b2 file should exist prior to crash simulation");
    assert!(b3_path.exists(), "b3 file should exist prior to crash simulation");

    // Move current metadata to pending and restore v1 to metadata.json
    fs::rename(&meta_path, &meta_pending_path).expect("rename meta -> pending");
    fs::write(&meta_path, &meta_v1).expect("restore meta v1");

    // Remove one of the newly introduced files to simulate partial persistence
    fs::remove_file(&b3_path).expect("remove b3 to simulate missing new file");
    assert!(!b3_path.exists(), "b3 should be missing at crash boundary");

    drop(s); // crash/restart boundary

    // Restart with startup recovery: expect rollback to v1 and cleanup of stray b2
    let opts = RecoveryOptions { mode: RecoveryMode::Full, on_corruption: CorruptionAction::Report };
    let _s2 = BlockStorage::new_with_recovery_options(db, opts)
        .await
        .expect("reopen with recovery");

    // Pending should be removed
    assert!(
        !meta_pending_path.exists(),
        "pending metadata should be removed (rolled back)"
    );

    // Metadata should remain at v1
    let meta_now = fs::read_to_string(&meta_path).expect("read meta after recovery");
    assert_eq!(meta_now, meta_v1, "metadata should remain at v1 after rollback");

    // Stray file for newly introduced b2 (not in v1) should be removed by reconciliation
    assert!(
        !b2_path.exists(),
        "stray file for b2 (introduced only in pending v2) should be removed"
    );

    // Missing b3 should remain absent
    assert!(
        !b3_path.exists(),
        "b3 should remain absent after rollback"
    );
}
