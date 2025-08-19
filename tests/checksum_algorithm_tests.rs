// Checksum algorithm selection, persistence, and cleanup tests

#![cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]

use sqlite_indexeddb_rs::storage::{BlockStorage, BLOCK_SIZE};
use serial_test::serial;
#[path = "common/mod.rs"]
mod common;
use tempfile::TempDir;
// removed unused tokio::time imports
use std::{fs, path::PathBuf, collections::hash_map::DefaultHasher, hash::{Hash, Hasher}};

#[cfg(feature = "fs_persist")]
#[derive(serde::Deserialize)]
struct TestMetaEntry { checksum: u64, last_modified_ms: u64, version: u32, algo: String }

#[cfg(feature = "fs_persist")]
#[derive(serde::Deserialize)]
struct TestFsMeta { entries: Vec<(u64, TestMetaEntry)> }

// Helper to compute DefaultHasher checksum like current implementation
fn default_hasher_checksum(data: &[u8]) -> u64 {
    let mut h = DefaultHasher::new();
    data.hash(&mut h);
    h.finish()
}

#[tokio::test(flavor = "current_thread")]
#[serial]
#[cfg(feature = "fs_persist")]
async fn test_default_algo_is_fasthash_and_persisted() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let db = "test_default_algo_persist";
    let mut s = BlockStorage::new_with_capacity(db, 4).await.expect("create storage");

    let payload = vec![0xABu8; BLOCK_SIZE];
    s.write_block(1, payload).await.expect("write");
    s.sync().await.expect("sync");

    // metadata.json should include algo FastHash
    let mut meta_path = PathBuf::from(tmp.path());
    meta_path.push(db);
    meta_path.push("metadata.json");
    let text = fs::read_to_string(&meta_path).expect("read metadata.json");
    let parsed: TestFsMeta = serde_json::from_str(&text).expect("parse FsMeta");
    let entry = &parsed.entries.iter().find(|(bid, _)| *bid == 1).expect("entry for block 1").1;
    assert_eq!(entry.algo.as_str(), "FastHash", "default algo should be FastHash");
    assert!(entry.checksum > 0);
    // Mark unused fields as read to satisfy -D warnings while keeping schema intact
    let _ = entry.last_modified_ms;
    let _ = entry.version;
}

#[tokio::test(flavor = "current_thread")]
#[serial]
#[cfg(feature = "fs_persist")]
async fn test_crc32_algo_selection_persisted_and_used_across_instances() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    common::set_var("DATASYNC_CHECKSUM_ALGO", "CRC32");

    let db = "test_crc32_algo_persist_and_recover";

    // Instance A: write with CRC32 selected
    {
        let mut a = BlockStorage::new_with_capacity(db, 4).await.expect("create A");
        let mut data = vec![0u8; BLOCK_SIZE];
        data[0] = 1; data[1] = 2; data[2] = 3; data[3] = 4;
        a.write_block(1, data.clone()).await.expect("write block 1");
        a.sync().await.expect("sync A");

        // Verify metadata shows algo CRC32 and checksum differs from DefaultHasher
        let mut meta_path = PathBuf::from(tmp.path());
        meta_path.push(db);
        meta_path.push("metadata.json");
        let text = fs::read_to_string(&meta_path).expect("read metadata.json");
        let parsed: TestFsMeta = serde_json::from_str(&text).expect("parse FsMeta");
        let entry = &parsed.entries.iter().find(|(bid, _)| *bid == 1).expect("entry for block 1").1;
        assert_eq!(entry.algo.as_str(), "CRC32", "algo should be CRC32 when selected via env");
        let dh = default_hasher_checksum(&data);
        assert_ne!(entry.checksum, dh, "CRC32 checksum should differ from DefaultHasher for known data");
        let _ = entry.last_modified_ms;
        let _ = entry.version;
    }

    // Clear env so instance B must rely on persisted algorithm (synchronized)
    {
        let _g = common::ENV_LOCK.lock().expect("env lock poisoned");
        unsafe { std::env::remove_var("DATASYNC_CHECKSUM_ALGO") }
        drop(_g);
    }

    // Instance B: read and verify should succeed using persisted algorithm from metadata
    {
        let mut b = BlockStorage::new_with_capacity(db, 4).await.expect("create B");
        // A simple read triggers verification in read path
        let bytes = b.read_block(1).await.expect("read block 1 in B");
        assert_eq!(bytes.len(), BLOCK_SIZE);
    }
}

#[tokio::test(flavor = "current_thread")]
#[serial]
#[cfg(feature = "fs_persist")]
async fn test_tempdir_based_fs_base_is_cleaned_up_after_drop() {
    let base_path: PathBuf;
    {
        let tmp = TempDir::new().expect("tempdir");
        base_path = tmp.path().to_path_buf();
        common::set_var("DATASYNC_FS_BASE", &base_path);
        let db = "test_cleanup_tempdir";
        let mut s = BlockStorage::new_with_capacity(db, 4).await.expect("create storage");
        s.write_block(1, vec![7u8; BLOCK_SIZE]).await.expect("write");
        s.sync().await.expect("sync");
        // tmp dropped here when going out of scope
    }
    // After TempDir drop, the directory should not exist
    assert!(!base_path.exists(), "TempDir-based DATASYNC_FS_BASE should be removed after drop");
}
