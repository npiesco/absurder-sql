#[cfg(feature = "fs_persist")]
use sqlite_indexeddb_rs::storage::block_storage::{BlockStorage, BLOCK_SIZE};
#[cfg(feature = "fs_persist")]
use tempfile::TempDir;
#[cfg(feature = "fs_persist")]
use serial_test::serial;

#[cfg(feature = "fs_persist")]
mod common;

#[cfg(feature = "fs_persist")]
#[tokio::test]
#[serial]
async fn test_recovery_removes_stray_files() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let db = "test_recovery_removes_stray_files";

    // Initialize storage to create db structure
    {
        let mut a = BlockStorage::new_with_capacity(db, 4).await.expect("create A");
        a.sync().await.expect("sync A");
    }

    // Create stray block file not present in metadata
    {
        let mut blocks_dir = tmp.path().to_path_buf();
        blocks_dir.push(db);
        blocks_dir.push("blocks");
        std::fs::create_dir_all(&blocks_dir).expect("create blocks dir");
        let stray = blocks_dir.join("block_9999.bin");
        std::fs::write(&stray, vec![0xABu8; BLOCK_SIZE]).expect("write stray");
        assert!(stray.exists(), "stray file should exist before recovery");
    }

    // Startup recovery should remove stray
    {
        let _b = BlockStorage::new_with_recovery_options(db, Default::default()).await.expect("create B");
    }

    // Assert stray file removed
    {
        let mut blocks_dir = tmp.path().to_path_buf();
        blocks_dir.push(db);
        blocks_dir.push("blocks");
        let stray = blocks_dir.join("block_9999.bin");
        assert!(!stray.exists(), "stray file should be removed by recovery");
    }
}

#[cfg(feature = "fs_persist")]
#[tokio::test]
#[serial]
async fn test_recovery_drops_metadata_for_missing_files() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let db = "test_recovery_drops_metadata_for_missing_files";

    let id1;
    // Create a block and persist metadata
    {
        let mut a = BlockStorage::new_with_capacity(db, 4).await.expect("create A");
        id1 = a.allocate_block().await.expect("alloc 1");
        let data1 = vec![0x55u8; BLOCK_SIZE];
        a.write_block(id1, data1).await.expect("write 1");
        a.sync().await.expect("sync A");
    }

    // Delete the backing file, leaving metadata entry dangling
    {
        let mut blocks_dir = tmp.path().to_path_buf();
        blocks_dir.push(db);
        blocks_dir.push("blocks");
        let p = blocks_dir.join(format!("block_{}.bin", id1));
        assert!(p.exists(), "block file should exist before deletion");
        std::fs::remove_file(&p).expect("remove block file");
        assert!(!p.exists(), "block file should be gone");
    }

    // Startup recovery should drop the metadata entry
    {
        let b = BlockStorage::new_with_recovery_options(db, Default::default()).await.expect("create B");
        let meta = b.get_block_metadata_for_testing();
        assert!(!meta.contains_key(&id1), "metadata for missing block should be dropped");
    }
}

#[cfg(feature = "fs_persist")]
#[tokio::test]
#[serial]
async fn test_recovery_idempotent_on_second_run() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let db = "test_recovery_idempotent_on_second_run";

    // Setup: create a valid block and a stray file, then delete the valid block's file to cause dangling metadata
    let id1;
    {
        let mut a = BlockStorage::new_with_capacity(db, 4).await.expect("create A");
        id1 = a.allocate_block().await.expect("alloc 1");
        let data1 = vec![0x77u8; BLOCK_SIZE];
        a.write_block(id1, data1).await.expect("write 1");
        a.sync().await.expect("sync A");
    }
    {
        let mut blocks_dir = tmp.path().to_path_buf();
        blocks_dir.push(db);
        blocks_dir.push("blocks");
        // stray
        let stray = blocks_dir.join("block_4242.bin");
        std::fs::write(&stray, vec![0xCDu8; BLOCK_SIZE]).expect("write stray");
        // delete valid file to make metadata dangling
        let p = blocks_dir.join(format!("block_{}.bin", id1));
        std::fs::remove_file(&p).expect("remove block file");
    }

    // First recovery run
    {
        let b1 = BlockStorage::new_with_recovery_options(db, Default::default()).await.expect("create B1");
        let meta1 = b1.get_block_metadata_for_testing();
        assert!(!meta1.contains_key(&id1), "first recovery should drop dangling metadata");
        // ensure stray removed
        let mut blocks_dir = tmp.path().to_path_buf();
        blocks_dir.push(db);
        blocks_dir.push("blocks");
        let stray = blocks_dir.join("block_4242.bin");
        assert!(!stray.exists(), "stray should be removed on first recovery");
    }

    // Second recovery run should be a no-op and succeed
    {
        let b2 = BlockStorage::new_with_recovery_options(db, Default::default()).await.expect("create B2");
        let meta2 = b2.get_block_metadata_for_testing();
        assert!(!meta2.contains_key(&id1), "second recovery should remain without the dropped entry");
        // no stray should reappear
        let mut blocks_dir = tmp.path().to_path_buf();
        blocks_dir.push(db);
        blocks_dir.push("blocks");
        let stray = blocks_dir.join("block_4242.bin");
        assert!(!stray.exists(), "stray should remain absent after second recovery");
    }
}
