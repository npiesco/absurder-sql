// Versioning and last_modified_ms metadata tests for BlockStorage

#![cfg(not(target_arch = "wasm32"))]
use absurder_sql::storage::{BlockStorage, BLOCK_SIZE};
use tokio::time::{sleep, Duration};
use tempfile::TempDir;
use serial_test::serial;
#[path = "common/mod.rs"]
mod common;

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_version_and_last_modified_progression_across_syncs() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let mut storage = BlockStorage::new_with_capacity("test_meta_version_ts_progression", 4)
        .await
        .expect("create storage");

    // Initial write, but before sync there should be no persisted metadata
    let d1 = vec![1u8; BLOCK_SIZE];
    storage
        .write_block(1, d1)
        .await
        .expect("write 1 d1");

    let meta_pre = storage.get_block_metadata_for_testing();
    assert!(meta_pre.get(&1).is_none(), "metadata should not be persisted before sync");

    // First sync should persist metadata with version 1
    storage.sync().await.expect("first sync");

    let meta1 = storage.get_block_metadata_for_testing();
    let (cs1, ver1, ts1) = meta1.get(&1).copied().expect("metadata for block 1 after first sync");
    assert!(cs1 > 0, "checksum should be non-zero after write");
    assert_eq!(ver1, 1, "version should start at 1 after first persisted write");
    assert!(ts1 > 0, "last_modified_ms should be set");

    // Wait to ensure timestamp progresses across syncs
    sleep(Duration::from_millis(5)).await;

    // Second write and sync should bump version and update timestamp
    let mut d2 = vec![0u8; BLOCK_SIZE];
    d2[0] = 2;
    storage
        .write_block(1, d2)
        .await
        .expect("write 1 d2");

    storage.sync().await.expect("second sync");

    let meta2 = storage.get_block_metadata_for_testing();
    let (_cs2, ver2, ts2) = meta2.get(&1).copied().expect("metadata after second sync");
    assert_eq!(ver2, 2, "version should increment to 2 after second persisted write");
    assert!(ts2 > ts1, "last_modified_ms should increase after subsequent syncs");
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_metadata_persists_across_instances_with_version_retained() {
    let db_name = "test_meta_version_ts_across_instances";
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());

    // Instance A: write and sync once
    {
        let mut storage_a = BlockStorage::new_with_capacity(db_name, 4)
            .await
            .expect("create storage A");
        let d = vec![7u8; BLOCK_SIZE];
        storage_a.write_block(1, d).await.expect("write 1");
        storage_a.sync().await.expect("sync A");

        let meta_a = storage_a.get_block_metadata_for_testing();
        let (_cs_a, ver_a, _ts_a) = meta_a.get(&1).copied().expect("metadata in A");
        assert_eq!(ver_a, 1, "version should be 1 after first sync in instance A");
    }

    // Instance B: restore, confirm metadata visible, then write again and verify version increments
    {
        let mut storage_b = BlockStorage::new_with_capacity(db_name, 4)
            .await
            .expect("create storage B");

        // Metadata should be visible from globals via test getter
        let meta_b1 = storage_b.get_block_metadata_for_testing();
        let (_cs_b1, ver_b1, _ts_b1) = meta_b1.get(&1).copied().expect("restored metadata in B");
        assert_eq!(ver_b1, 1, "restored version should be 1 in new instance");

        // Second write and sync: expect version to bump to 2
        let mut d2 = vec![0u8; BLOCK_SIZE];
        d2[1] = 3;
        storage_b.write_block(1, d2).await.expect("write 1 in B");
        storage_b.sync().await.expect("sync B");

        let meta_b2 = storage_b.get_block_metadata_for_testing();
        let (_cs_b2, ver_b2, _ts_b2) = meta_b2.get(&1).copied().expect("metadata in B after second sync");
        assert_eq!(ver_b2, 2, "version should increment across instances after new persisted write");
    }
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_sync_without_new_writes_does_not_bump_version_or_timestamp() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let mut storage = BlockStorage::new_with_capacity("test_meta_no_bump_on_idle_sync", 4)
        .await
        .expect("create storage");

    // Initial write and sync
    storage
        .write_block(11, vec![2u8; BLOCK_SIZE])
        .await
        .expect("write 11");
    storage.sync().await.expect("sync");

    let meta1 = storage.get_block_metadata_for_testing();
    let (_c1, v1, t1) = meta1.get(&11).copied().expect("meta after first sync");

    // Perform another sync without any new writes
    sleep(Duration::from_millis(5)).await; // ensure time passes, but no writes occur
    storage.sync().await.expect("second sync without writes");

    let meta2 = storage.get_block_metadata_for_testing();
    let (_c2, v2, t2) = meta2.get(&11).copied().expect("meta after second sync");
    assert_eq!(v1, v2, "version should not change when no new writes occurred");
    assert_eq!(t1, t2, "timestamp should not change when no new writes occurred");
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_metadata_removed_on_deallocate_persists_across_instances() {
    let db_name = "test_meta_remove_on_deallocate";
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());

    // Instance A: allocate, write, sync, then deallocate and ensure metadata removed
    let dealloc_id: u64 = {
        let mut a = BlockStorage::new_with_capacity(db_name, 4)
            .await
            .expect("create A");
        let id = a.allocate_block().await.expect("allocate");
        a.write_block(id, vec![3u8; BLOCK_SIZE]).await.expect("write");
        a.sync().await.expect("sync A");

        let meta_a_before = a.get_block_metadata_for_testing();
        assert!(meta_a_before.get(&id).is_some(), "metadata present before deallocate");

        a.deallocate_block(id).await.expect("deallocate");

        let meta_a_after = a.get_block_metadata_for_testing();
        assert!(meta_a_after.get(&id).is_none(), "metadata should be removed after deallocate");
        id
    };

    // Instance B: ensure metadata remains removed across instances
    let b_meta = {
        let b = BlockStorage::new_with_capacity(db_name, 4)
            .await
            .expect("create B");
        b.get_block_metadata_for_testing()
    };
    assert!(b_meta.get(&dealloc_id).is_none(), "metadata removal should persist across instances");
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_same_data_write_still_bumps_version_and_timestamp() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let mut storage = BlockStorage::new_with_capacity("test_meta_same_data_bumps", 4)
        .await
        .expect("create storage");

    let payload = vec![9u8; BLOCK_SIZE];
    storage
        .write_block(5, payload.clone())
        .await
        .expect("initial write");
    storage.sync().await.expect("first sync");

    let meta1 = storage.get_block_metadata_for_testing();
    let (_c1, v1, t1) = meta1.get(&5).copied().expect("meta after first sync");

    // Same data write; should still count as a new persisted version per current semantics
    tokio::time::sleep(Duration::from_millis(5)).await; // ensure timestamp can progress
    storage
        .write_block(5, payload.clone())
        .await
        .expect("same data write");
    storage.sync().await.expect("second sync");

    let meta2 = storage.get_block_metadata_for_testing();
    let (_c2, v2, t2) = meta2.get(&5).copied().expect("meta after second sync");
    assert_eq!(v2, v1 + 1, "version should increment even when data is unchanged");
    assert!(t2 > t1, "last_modified_ms should update on persisted write");
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_batch_write_only_updates_touched_blocks() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("DATASYNC_FS_BASE", tmp.path());
    let mut storage = BlockStorage::new_with_capacity("test_meta_batch_updates", 4)
        .await
        .expect("create storage");

    // Initialize two blocks and persist
    storage
        .write_block(21, vec![1u8; BLOCK_SIZE])
        .await
        .expect("write 21");
    storage
        .write_block(22, vec![2u8; BLOCK_SIZE])
        .await
        .expect("write 22");
    storage.sync().await.expect("first sync");

    let meta1 = storage.get_block_metadata_for_testing();
    let (_c21_1, v21_1, t21_1) = meta1.get(&21).copied().expect("meta 21 after first sync");
    let (_c22_1, v22_1, t22_1) = meta1.get(&22).copied().expect("meta 22 after first sync");

    // Touch only block 21
    tokio::time::sleep(Duration::from_millis(5)).await;
    let mut new21 = vec![1u8; BLOCK_SIZE];
    new21[0] = 3; // change content to differentiate
    storage
        .write_block(21, new21)
        .await
        .expect("rewrite 21");
    storage.sync().await.expect("second sync");

    let meta2 = storage.get_block_metadata_for_testing();
    let (_c21_2, v21_2, t21_2) = meta2.get(&21).copied().expect("meta 21 after second sync");
    let (_c22_2, v22_2, t22_2) = meta2.get(&22).copied().expect("meta 22 after second sync");

    assert_eq!(v21_2, v21_1 + 1, "touched block 21 should bump version");
    assert!(t21_2 > t21_1, "touched block 21 should update timestamp");

    assert_eq!(v22_2, v22_1, "untouched block 22 version should remain unchanged");
    assert_eq!(t22_2, t22_1, "untouched block 22 timestamp should remain unchanged");
}
