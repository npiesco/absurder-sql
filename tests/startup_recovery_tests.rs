#[cfg(feature = "fs_persist")]
use absurder_sql::storage::block_storage::{BlockStorage, BLOCK_SIZE, RecoveryOptions, RecoveryMode, CorruptionAction};

#[cfg(feature = "fs_persist")]
use tempfile::TempDir;
#[cfg(feature = "fs_persist")]
use serial_test::serial;

#[cfg(feature = "fs_persist")]
mod common;

#[cfg(feature = "fs_persist")]
#[tokio::test]
#[serial]
async fn test_startup_recovery_detects_corrupted_blocks() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let db = "test_startup_recovery_corruption";

    // Create instance A: write and sync some blocks
    {
        let mut a = BlockStorage::new_with_capacity(db, 4).await.expect("create A");
        let id1 = a.allocate_block().await.expect("alloc 1");
        let id2 = a.allocate_block().await.expect("alloc 2");
        
        let data1 = vec![0x11u8; BLOCK_SIZE];
        let data2 = vec![0x22u8; BLOCK_SIZE];
        
        a.write_block(id1, data1).await.expect("write 1");
        a.write_block(id2, data2).await.expect("write 2");
        a.sync().await.expect("sync A");
    }

    // Manually corrupt block file on disk
    {
        let mut blocks_dir = tmp.path().to_path_buf();
        blocks_dir.push(db);
        blocks_dir.push("blocks");
        let block_file = blocks_dir.join("block_1.bin");
        
        // Corrupt the first few bytes
        std::fs::write(&block_file, vec![0xFFu8; BLOCK_SIZE]).expect("corrupt block");
    }

    // Create instance B: should detect corruption during startup recovery
    {
        let result = BlockStorage::new_with_recovery_options(db, Default::default()).await;
        match result {
            Ok(storage) => {
                let report = storage.get_recovery_report();
                assert!(!report.corrupted_blocks.is_empty(), "Should detect corrupted blocks");
                assert!(report.corrupted_blocks.contains(&1), "Should detect block 1 corruption");
                assert_eq!(report.total_blocks_verified, 2, "Should verify 2 blocks");
                assert_eq!(report.corrupted_blocks.len(), 1, "Should find 1 corrupted block");
            }
            Err(e) => panic!("Startup recovery should succeed but report corruption: {}", e.message),
        }
    }
}

#[cfg(feature = "fs_persist")]
#[tokio::test]
#[serial]
async fn test_startup_recovery_sample_mode() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let db = "test_startup_recovery_sample";

    // Create instance A: write many blocks
    {
        let mut a = BlockStorage::new_with_capacity(db, 20).await.expect("create A");
        for i in 0..10 {
            let id = a.allocate_block().await.expect("alloc");
            let data = vec![i as u8 + 1; BLOCK_SIZE];
            a.write_block(id, data).await.expect("write");
        }
        a.sync().await.expect("sync A");
    }

    // Create instance B with sample recovery (verify only 3 blocks)
    {
        let recovery_opts = RecoveryOptions {
            mode: RecoveryMode::Sample { count: 3 },
            on_corruption: CorruptionAction::Report,
        };
        
        let storage = BlockStorage::new_with_recovery_options(db, recovery_opts).await.expect("create B");
        let report = storage.get_recovery_report();
        
        assert_eq!(report.total_blocks_verified, 3, "Should verify exactly 3 blocks in sample mode");
        assert!(report.corrupted_blocks.is_empty(), "Should find no corruption in clean data");
    }
}

#[cfg(feature = "fs_persist")]
#[tokio::test]
#[serial]
async fn test_startup_recovery_repair_mode() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let db = "test_startup_recovery_repair";

    // Create instance A: write blocks
    {
        let mut a = BlockStorage::new_with_capacity(db, 4).await.expect("create A");
        let id1 = a.allocate_block().await.expect("alloc 1");
        let data1 = vec![0x33u8; BLOCK_SIZE];
        a.write_block(id1, data1.clone()).await.expect("write 1");
        a.sync().await.expect("sync A");
    }

    // Corrupt block file
    {
        let mut blocks_dir = tmp.path().to_path_buf();
        blocks_dir.push(db);
        blocks_dir.push("blocks");
        let block_file = blocks_dir.join("block_1.bin");
        std::fs::write(&block_file, vec![0xAAu8; BLOCK_SIZE]).expect("corrupt block");
    }

    // Create instance B with repair mode
    {
        let recovery_opts = RecoveryOptions {
            mode: RecoveryMode::Full,
            on_corruption: CorruptionAction::Repair,
        };
        
        let storage = BlockStorage::new_with_recovery_options(db, recovery_opts).await.expect("create B");
        let report = storage.get_recovery_report();
        
        assert!(!report.corrupted_blocks.is_empty(), "Should detect corruption");
        assert!(!report.repaired_blocks.is_empty(), "Should repair corrupted blocks");
        assert!(report.repaired_blocks.contains(&1), "Should repair block 1");
    }
}

