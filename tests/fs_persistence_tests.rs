#![cfg(feature = "fs_persist")]

use absurder_sql::storage::BlockStorage;
use std::fs;
use std::path::PathBuf;
use tempfile::TempDir;
use serial_test::serial;
#[path = "common/mod.rs"]
mod common;

fn make_bytes(val: u8) -> Vec<u8> { vec![val; 4096] }

#[tokio::test]
#[serial]
async fn fs_persist_metadata_and_data_across_instances() {
    // Use a temp base dir to isolate on-disk persistence per test
    let tmp = TempDir::new().expect("tempdir");
    // Safety: tests operate in isolated tempdirs; we intentionally set a process var.
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());

    // Instance 1: write a block and sync
    let mut s1 = BlockStorage::new("fs_meta_data_test").await.expect("create s1");
    let b1 = s1.allocate_block().await.expect("alloc1");
    let d1 = make_bytes(7);
    s1.write_block(b1, d1.clone()).await.expect("write1");
    s1.sync().await.expect("sync1");

    // Expect filesystem artifacts to exist
    let mut base: PathBuf = tmp.path().into();
    base.push("fs_meta_data_test");
    let mut blocks_dir = base.clone();
    blocks_dir.push("blocks");
    let mut block_path = blocks_dir.clone();
    block_path.push(format!("block_{}.bin", b1));
    let mut meta_path = base.clone();
    meta_path.push("metadata.json");
    assert!(fs::metadata(&blocks_dir).is_ok(), "blocks dir should exist: {:?}", blocks_dir);
    assert!(fs::metadata(&block_path).is_ok(), "block file should exist: {:?}", block_path);
    assert!(fs::metadata(&meta_path).is_ok(), "metadata file should exist: {:?}", meta_path);

    // Drop s1 to force reload
    drop(s1);

    // Instance 2: verify data and metadata are restored
    let mut s2 = BlockStorage::new("fs_meta_data_test").await.expect("create s2");
    let read_back = s2.read_block(b1).await.expect("read back");
    assert_eq!(read_back, d1, "block data should persist across instances");

    // metadata should contain our block with version >= 1 and matching checksum
    let meta2 = s2.get_block_metadata_for_testing();
    let (checksum2, version2, last_ms2) = meta2.get(&b1).copied().expect("meta exists after reload");
    assert!(version2 >= 1, "version should be at least 1 after first sync");
    assert!(last_ms2 > 0, "have last_modified_ms");
    let expected_checksum = s2.get_block_checksum(b1).expect("checksum present");
    assert_eq!(checksum2 as u32, expected_checksum, "checksum should match computed");

    // Write again and sync to bump version, then ensure it persists to next instance
    s2.write_block(b1, d1.clone()).await.expect("rewrite same-data");
    s2.sync().await.expect("sync2");
    drop(s2);

    let s3 = BlockStorage::new("fs_meta_data_test").await.expect("create s3");
    let meta3 = s3.get_block_metadata_for_testing();
    let (_, version3, _) = meta3.get(&b1).copied().expect("meta still exists");
    assert!(version3 >= version2 + 1, "version should bump across instances after second sync");
}

#[tokio::test]
#[serial]
async fn fs_persist_deallocate_removes_data_and_metadata() {
    let tmp = TempDir::new().expect("tempdir");
    // Safety: tests operate in isolated tempdirs; we intentionally set a process var.
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());

    // Instance 1: allocate, write, sync
    let mut s1 = BlockStorage::new("fs_dealloc_test").await.expect("create s1");
    let b1 = s1.allocate_block().await.expect("alloc1");
    s1.write_block(b1, make_bytes(9)).await.expect("write1");
    s1.sync().await.expect("sync1");
    drop(s1);

    // Instance 2: deallocate and sync
    let mut s2 = BlockStorage::new("fs_dealloc_test").await.expect("create s2");
    s2.deallocate_block(b1).await.expect("dealloc");
    s2.sync().await.expect("sync2");
    // After deallocation, block file should be removed and metadata should update
    let mut base: PathBuf = tmp.path().into();
    base.push("fs_dealloc_test");
    let mut blocks_dir = base.clone();
    blocks_dir.push("blocks");
    let mut block_path = blocks_dir.clone();
    block_path.push(format!("block_{}.bin", b1));
    let mut meta_path = base.clone();
    meta_path.push("metadata.json");
    assert!(fs::metadata(&meta_path).is_ok(), "metadata file should exist after dealloc: {:?}", meta_path);
    assert!(fs::metadata(&block_path).is_err(), "block file should be removed after dealloc: {:?}", block_path);
    drop(s2);

    // Instance 3: data and metadata should be gone
    let mut s3 = BlockStorage::new("fs_dealloc_test").await.expect("create s3");
    let meta3 = s3.get_block_metadata_for_testing();
    assert!(meta3.get(&b1).is_none(), "metadata removed after deallocation");
    let read_err = s3.read_block(b1).await;
    assert!(read_err.is_err(), "reading deallocated block should error");
}
