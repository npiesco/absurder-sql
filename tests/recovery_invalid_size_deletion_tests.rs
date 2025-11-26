#[cfg(feature = "fs_persist")]
use absurder_sql::storage::block_storage::{BLOCK_SIZE, BlockStorage};
#[cfg(feature = "fs_persist")]
use serial_test::serial;
#[cfg(feature = "fs_persist")]
use tempfile::TempDir;

#[cfg(feature = "fs_persist")]
mod common;

#[cfg(feature = "fs_persist")]
#[tokio::test]
#[serial]
async fn test_recovery_deletes_invalid_sized_files_in_same_pass() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());
    let db = "test_recovery_deletes_invalid_sized_files_in_same_pass";

    // Create a valid block and persist it
    let id1;
    {
        let mut a = BlockStorage::new_with_capacity(db, 4)
            .await
            .expect("create A");
        id1 = a.allocate_block().await.expect("alloc 1");
        let data1 = vec![0xAAu8; BLOCK_SIZE];
        a.write_block(id1, data1).await.expect("write 1");
        a.sync().await.expect("sync A");
    }

    // Corrupt the on-disk block file by changing its size
    let block_path = {
        let mut blocks_dir = tmp.path().to_path_buf();
        blocks_dir.push(db);
        blocks_dir.push("blocks");
        let p = blocks_dir.join(format!("block_{}.bin", id1));
        assert!(p.exists(), "block file should exist before corruption");
        // Write an invalid size (shorter than BLOCK_SIZE)
        std::fs::write(&p, vec![0xBBu8; BLOCK_SIZE - 7]).expect("truncate block file");
        let meta = std::fs::metadata(&p).expect("metadata after corruption");
        assert_ne!(
            meta.len() as usize,
            BLOCK_SIZE,
            "file size must be invalid for the test"
        );
        p
    };

    // Startup recovery should drop the metadata entry AND delete the invalid-sized file in the same run
    {
        let mut b = BlockStorage::new_with_recovery_options(db, Default::default())
            .await
            .expect("create B");
        let meta = b.get_block_metadata_for_testing();
        assert!(
            !meta.contains_key(&id1),
            "metadata for invalid-sized block should be dropped during recovery"
        );
        assert!(
            !block_path.exists(),
            "invalid-sized block file should be deleted during the same recovery pass"
        );
    }
}
