// Checksum algorithm selection, persistence, and cleanup tests

#![cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]

use absurder_sql::storage::{BLOCK_SIZE, BlockStorage};
use serial_test::serial;
#[path = "common/mod.rs"]
mod common;
use tempfile::TempDir;
// removed unused tokio::time imports
use std::{
    collections::hash_map::DefaultHasher,
    fs,
    hash::{Hash, Hasher},
    path::PathBuf,
};

#[cfg(feature = "fs_persist")]
#[derive(serde::Deserialize)]
struct TestMetaEntry {
    checksum: u64,
    last_modified_ms: u64,
    version: u32,
    algo: String,
}

#[cfg(feature = "fs_persist")]
#[derive(serde::Deserialize)]
struct TestFsMeta {
    entries: Vec<(u64, TestMetaEntry)>,
}

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
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());

    // Ensure no checksum algorithm is set in environment to test default behavior
    {
        let _g = common::ENV_LOCK.lock().expect("env lock poisoned");
        unsafe { std::env::remove_var("DATASYNC_CHECKSUM_ALGO") }
        drop(_g);
    }
    let db = "test_default_algo_persist";
    let mut s = BlockStorage::new_with_capacity(db, 4)
        .await
        .expect("create storage");

    let payload = vec![0xABu8; BLOCK_SIZE];
    s.write_block(1, payload).await.expect("write");
    s.sync().await.expect("sync");

    // metadata.json should include algo FastHash
    let mut meta_path = PathBuf::from(tmp.path());
    meta_path.push(db);
    meta_path.push("metadata.json");
    let text = fs::read_to_string(&meta_path).expect("read metadata.json");
    let parsed: TestFsMeta = serde_json::from_str(&text).expect("parse FsMeta");
    let entry = &parsed
        .entries
        .iter()
        .find(|(bid, _)| *bid == 1)
        .expect("entry for block 1")
        .1;
    assert_eq!(
        entry.algo.as_str(),
        "FastHash",
        "default algo should be FastHash"
    );
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
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());
    common::set_var("DATASYNC_CHECKSUM_ALGO", "CRC32");

    let db = "test_crc32_algo_persist_and_recover";

    // Instance A: write with CRC32 selected
    {
        let mut a = BlockStorage::new_with_capacity(db, 4)
            .await
            .expect("create A");
        let mut data = vec![0u8; BLOCK_SIZE];
        data[0] = 1;
        data[1] = 2;
        data[2] = 3;
        data[3] = 4;
        a.write_block(1, data.clone()).await.expect("write block 1");
        a.sync().await.expect("sync A");

        // Verify metadata shows algo CRC32 and checksum differs from DefaultHasher
        let mut meta_path = PathBuf::from(tmp.path());
        meta_path.push(db);
        meta_path.push("metadata.json");
        let text = fs::read_to_string(&meta_path).expect("read metadata.json");
        let parsed: TestFsMeta = serde_json::from_str(&text).expect("parse FsMeta");
        let entry = &parsed
            .entries
            .iter()
            .find(|(bid, _)| *bid == 1)
            .expect("entry for block 1")
            .1;
        assert_eq!(
            entry.algo.as_str(),
            "CRC32",
            "algo should be CRC32 when selected via env"
        );
        let dh = default_hasher_checksum(&data);
        assert_ne!(
            entry.checksum, dh,
            "CRC32 checksum should differ from DefaultHasher for known data"
        );
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
        let b = BlockStorage::new_with_capacity(db, 4)
            .await
            .expect("create B");
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
        common::set_var("ABSURDERSQL_FS_BASE", &base_path);
        let db = "test_cleanup_tempdir";
        let mut s = BlockStorage::new_with_capacity(db, 4)
            .await
            .expect("create storage");
        s.write_block(1, vec![7u8; BLOCK_SIZE])
            .await
            .expect("write");
        s.sync().await.expect("sync");
        // tmp dropped here when going out of scope
    }
    // After TempDir drop, the directory should not exist
    assert!(
        !base_path.exists(),
        "TempDir-based ABSURDERSQL_FS_BASE should be removed after drop"
    );
}

#[tokio::test(flavor = "current_thread")]
#[serial]
#[cfg(feature = "fs_persist")]
async fn test_algo_removed_on_deallocate_and_reuse_picks_new_default() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());
    common::set_var("DATASYNC_CHECKSUM_ALGO", "CRC32");
    let db = "test_algo_reuse_new_default";

    // Instance A: CRC32 default, write then deallocate block 3
    {
        let mut a = BlockStorage::new_with_capacity(db, 4)
            .await
            .expect("create A");
        // Explicitly allocate block 3 before writing/deallocating to match allocation semantics
        let _ = a.allocate_block().await.expect("alloc 1");
        let _ = a.allocate_block().await.expect("alloc 2");
        let id3 = a.allocate_block().await.expect("alloc 3");
        assert_eq!(id3, 3, "expected third allocation to be block 3");
        let data = vec![0x11u8; BLOCK_SIZE];
        a.write_block(3, data).await.expect("write A");
        a.sync().await.expect("sync A");
        a.deallocate_block(3).await.expect("dealloc 3");
        a.sync().await.expect("sync A2");
    }

    // Switch default to FastHash for new instance reuse
    {
        let _g = common::ENV_LOCK.lock().expect("env lock");
        unsafe { std::env::set_var("DATASYNC_CHECKSUM_ALGO", "FastHash") }
        drop(_g);
    }

    // Instance B: reuse block 3; metadata algo should now be FastHash
    {
        let mut b = BlockStorage::new_with_capacity(db, 4)
            .await
            .expect("create B");
        let data2 = vec![0x22u8; BLOCK_SIZE];
        b.write_block(3, data2).await.expect("write B");
        b.sync().await.expect("sync B");

        let mut meta_path = PathBuf::from(tmp.path());
        meta_path.push(db);
        meta_path.push("metadata.json");
        let text = fs::read_to_string(&meta_path).expect("read metadata.json");
        let parsed: TestFsMeta = serde_json::from_str(&text).expect("parse FsMeta");
        let entry = &parsed
            .entries
            .iter()
            .find(|(bid, _)| *bid == 3)
            .expect("entry for block 3")
            .1;
        assert_eq!(
            entry.algo.as_str(),
            "FastHash",
            "reused block should use current default algo after deallocation"
        );
    }
}

#[tokio::test(flavor = "current_thread")]
#[serial]
#[cfg(feature = "fs_persist")]
async fn test_missing_algo_field_fallbacks_to_default_on_next_write() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());
    let db = "test_missing_algo_fallback";

    // Instance A: write with default FastHash
    {
        let mut a = BlockStorage::new_with_capacity(db, 4)
            .await
            .expect("create A");
        a.write_block(1, vec![0x33u8; BLOCK_SIZE])
            .await
            .expect("write A");
        a.sync().await.expect("sync A");
    }

    // Corrupt metadata: remove 'algo' for block 1
    let mut meta_path = PathBuf::from(tmp.path());
    meta_path.push(db);
    meta_path.push("metadata.json");
    let text = fs::read_to_string(&meta_path).expect("read meta");
    let mut v: serde_json::Value = serde_json::from_str(&text).expect("json");
    if let Some(entries) = v.get_mut("entries").and_then(|e| e.as_array_mut()) {
        for ent in entries.iter_mut() {
            if let Some(arr) = ent.as_array_mut() {
                if let (Some(id), Some(obj)) = (
                    arr.first().and_then(|x| x.as_u64()),
                    arr.get_mut(1).and_then(|x| x.as_object_mut()),
                ) {
                    if id == 1 {
                        obj.remove("algo");
                    }
                }
            }
        }
    }
    fs::write(&meta_path, serde_json::to_string(&v).unwrap()).expect("write meta");

    // Instance B: can read, then rewrite and metadata should regain default algo
    {
        let mut b = BlockStorage::new_with_capacity(db, 4)
            .await
            .expect("create B");
        let bytes = b.read_block(1).await.expect("read B");
        // rewrite same contents to persist fresh metadata with default algo
        b.write_block(1, bytes).await.expect("rewrite B");
        b.sync().await.expect("sync B");

        let text2 = fs::read_to_string(&meta_path).expect("read meta2");
        let parsed: TestFsMeta = serde_json::from_str(&text2).expect("parse FsMeta after");
        let entry = &parsed
            .entries
            .iter()
            .find(|(bid, _)| *bid == 1)
            .expect("entry for block 1")
            .1;
        assert_eq!(
            entry.algo.as_str(),
            "FastHash",
            "missing algo should fall back to default on next write"
        );
    }
}

#[tokio::test(flavor = "current_thread")]
#[serial]
#[cfg(feature = "fs_persist")]
async fn test_invalid_algo_string_tolerant_restore_and_fallback_per_entry() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());
    let db = "test_invalid_algo_tolerant";

    // Instance A: write two blocks with default FastHash
    {
        let mut a = BlockStorage::new_with_capacity(db, 4)
            .await
            .expect("create A");
        a.write_block(10, vec![0x44u8; BLOCK_SIZE])
            .await
            .expect("w10");
        a.write_block(11, vec![0x55u8; BLOCK_SIZE])
            .await
            .expect("w11");
        a.sync().await.expect("sync A");
    }

    // Corrupt metadata: set block 10 algo to invalid string, keep block 11 valid
    let mut meta_path = PathBuf::from(tmp.path());
    meta_path.push(db);
    meta_path.push("metadata.json");
    let text = fs::read_to_string(&meta_path).expect("read meta");
    let mut v: serde_json::Value = serde_json::from_str(&text).expect("json");
    if let Some(entries) = v.get_mut("entries").and_then(|e| e.as_array_mut()) {
        for ent in entries.iter_mut() {
            if let Some(arr) = ent.as_array_mut() {
                if let (Some(id), Some(obj)) = (
                    arr.first().and_then(|x| x.as_u64()),
                    arr.get_mut(1).and_then(|x| x.as_object_mut()),
                ) {
                    if id == 10 {
                        obj.insert("algo".into(), serde_json::Value::String("BAD".into()));
                    }
                }
            }
        }
    }
    fs::write(&meta_path, serde_json::to_string(&v).unwrap()).expect("write meta");

    // Instance B: tolerant restore should retain checksums, fall back algo for id 10 only.
    {
        let mut b = BlockStorage::new_with_capacity(db, 4)
            .await
            .expect("create B");
        // Ensure other entries restored unaffected
        assert!(
            b.get_block_checksum(11).is_some(),
            "valid entries should still restore"
        );
        // Verify id 10 is readable and verifiable (fallback to default algorithm)
        b.verify_block_checksum(10)
            .await
            .expect("verify id10 with fallback algo");
        // Sync to rewrite normalized metadata for id 10
        b.sync().await.expect("sync B");
        let text2 = fs::read_to_string(&meta_path).expect("read meta2");
        let parsed: TestFsMeta = serde_json::from_str(&text2).expect("parse FsMeta after");
        let entry10 = &parsed
            .entries
            .iter()
            .find(|(bid, _)| *bid == 10)
            .expect("entry for block 10")
            .1;
        assert_eq!(
            entry10.algo.as_str(),
            "FastHash",
            "invalid algo should be normalized to default after sync"
        );
    }
}

#[tokio::test(flavor = "current_thread")]
#[serial]
#[cfg(feature = "fs_persist")]
async fn test_algo_mismatch_triggers_verification_error() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());
    let db = "test_algo_mismatch_error";

    // Instance A: write with default FastHash
    {
        let mut a = BlockStorage::new_with_capacity(db, 4)
            .await
            .expect("create A");
        a.write_block(5, vec![0x66u8; BLOCK_SIZE])
            .await
            .expect("write A");
        a.sync().await.expect("sync A");
    }

    // Tamper metadata: switch algo to CRC32 but keep checksum (from FastHash)
    let mut meta_path = PathBuf::from(tmp.path());
    meta_path.push(db);
    meta_path.push("metadata.json");
    let text = fs::read_to_string(&meta_path).expect("read meta");
    let mut v: serde_json::Value = serde_json::from_str(&text).expect("json");
    if let Some(entries) = v.get_mut("entries").and_then(|e| e.as_array_mut()) {
        for ent in entries.iter_mut() {
            if let Some(arr) = ent.as_array_mut() {
                if let (Some(id), Some(obj)) = (
                    arr.first().and_then(|x| x.as_u64()),
                    arr.get_mut(1).and_then(|x| x.as_object_mut()),
                ) {
                    if id == 5 {
                        obj.insert("algo".into(), serde_json::Value::String("CRC32".into()));
                    }
                }
            }
        }
    }
    fs::write(&meta_path, serde_json::to_string(&v).unwrap()).expect("write meta");

    // Instance B: read should now fail checksum verification due to algo mismatch
    {
        let b = BlockStorage::new_with_capacity(db, 4)
            .await
            .expect("create B");
        let res = b.read_block(5).await;
        assert!(
            res.is_err(),
            "expected checksum verification error after algo tamper"
        );
    }
}
