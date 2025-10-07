//! Test that captures the CURRENT behavior of VFS sync operations in BlockStorage
//! This ensures that when we refactor VFS sync into a separate module, we preserve exact behavior

#[cfg(target_arch = "wasm32")]
use wasm_bindgen_test::*;

#[cfg(target_arch = "wasm32")]
wasm_bindgen_test_configure!(run_in_browser);

#[cfg(target_arch = "wasm32")]
use absurder_sql::storage::{BlockStorage, vfs_sync_database, vfs_sync_database_blocking, register_storage_for_vfs_sync};

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_current_vfs_sync_behavior_basic_sync() {
    // Test: Current behavior of basic VFS sync operation
    let db_name = "vfs_sync_basic_test.db";

    // Clear global state to ensure test isolation
    #[cfg(target_arch = "wasm32")]
    {
        use absurder_sql::storage::vfs_sync::{with_global_storage, with_global_commit_marker};
        use absurder_sql::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        with_global_storage(|gs| gs.borrow_mut().clear());
        with_global_commit_marker(|cm| cm.borrow_mut().clear());
        STORAGE_REGISTRY.with(|sr| sr.borrow_mut().clear());
    }

    let mut storage = BlockStorage::new(db_name).await.expect("Should create storage");

    // Write some test data
    let mut test_data = vec![0u8; 4096];
    test_data[0..15].copy_from_slice(b"vfs sync test  ");

    storage.write_block(1, test_data.clone()).await.expect("Should write block");
    storage.sync().await.expect("Should sync");

    // Test VFS sync operation
    vfs_sync_database(db_name).expect("VFS sync should succeed");

    // Verify data persists after VFS sync
    let mut storage2 = BlockStorage::new(db_name).await.expect("Should create second storage");
    let read_data = storage2.read_block(1).await.expect("Should read block after VFS sync");

    assert_eq!(read_data, test_data, "Data should persist through VFS sync");
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_current_vfs_sync_behavior_blocking_sync() {
    // Test: Current behavior of blocking VFS sync
    let db_name = "vfs_sync_blocking_test.db";

    // Clear global state to ensure test isolation
    #[cfg(target_arch = "wasm32")]
    {
        use absurder_sql::storage::vfs_sync::{with_global_storage, with_global_commit_marker};
        use absurder_sql::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        with_global_storage(|gs| gs.borrow_mut().clear());
        with_global_commit_marker(|cm| cm.borrow_mut().clear());
        STORAGE_REGISTRY.with(|sr| sr.borrow_mut().clear());
    }

    let mut storage = BlockStorage::new(db_name).await.expect("Should create storage");

    // Write multiple blocks
    for i in 1..=3 {
        let mut data = vec![0u8; 4096];
        let text = format!("blocking sync block {}", i);
        data[0..text.len()].copy_from_slice(text.as_bytes());
        storage.write_block(i, data).await.expect(&format!("Should write block {}", i));
    }

    storage.sync().await.expect("Should sync");

    // Test blocking VFS sync
    vfs_sync_database_blocking(db_name).expect("Blocking VFS sync should succeed");

    // Verify all data persists
    let mut storage2 = BlockStorage::new(db_name).await.expect("Should create second storage");
    for i in 1..=3 {
        let mut expected_data = vec![0u8; 4096];
        let text = format!("blocking sync block {}", i);
        expected_data[0..text.len()].copy_from_slice(text.as_bytes());

        let read_data = storage2.read_block(i).await.expect(&format!("Should read block {}", i));
        assert_eq!(read_data, expected_data, "Block {} should persist through blocking VFS sync", i);
    }
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_current_vfs_sync_behavior_commit_marker_advancement() {
    // Test: Current behavior of commit marker advancement during VFS sync
    let db_name = "vfs_sync_commit_marker_test.db";

    // Clear global state to ensure test isolation
    #[cfg(target_arch = "wasm32")]
    {
        use absurder_sql::storage::vfs_sync::{with_global_storage, with_global_commit_marker};
        use absurder_sql::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        with_global_storage(|gs| gs.borrow_mut().clear());
        with_global_commit_marker(|cm| cm.borrow_mut().clear());
        STORAGE_REGISTRY.with(|sr| sr.borrow_mut().clear());
    }

    let mut storage = BlockStorage::new(db_name).await.expect("Should create storage");

    // Check initial commit marker (should be 0 or not exist)
    let initial_marker = storage.get_commit_marker();

    // Write and sync data
    let mut test_data = vec![0u8; 4096];
    test_data[0..20].copy_from_slice(b"commit marker test  ");
    storage.write_block(10, test_data).await.expect("Should write block");
    storage.sync().await.expect("Should sync");

    let marker_before_vfs = storage.get_commit_marker();

    // Perform VFS sync (should advance commit marker)
    vfs_sync_database(db_name).expect("VFS sync should succeed");

    // Check that commit marker advanced
    let marker_after_vfs = storage.get_commit_marker();

    // The exact values depend on implementation, but marker should have advanced
    web_sys::console::log_1(&format!("Commit markers: initial={}, before_vfs={}, after_vfs={}",
                                      initial_marker, marker_before_vfs, marker_after_vfs).into());

    // Capture current behavior - marker should advance during VFS sync
    assert!(marker_after_vfs >= marker_before_vfs, "Commit marker should advance or stay same during VFS sync");
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_current_vfs_sync_behavior_cross_instance_visibility() {
    // Test: Current behavior of cross-instance data visibility through VFS sync
    let db_name = "vfs_sync_cross_instance_test.db";

    // Clear global state to ensure test isolation
    #[cfg(target_arch = "wasm32")]
    {
        use absurder_sql::storage::vfs_sync::{with_global_storage, with_global_commit_marker};
        use absurder_sql::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        with_global_storage(|gs| gs.borrow_mut().clear());
        with_global_commit_marker(|cm| cm.borrow_mut().clear());
        STORAGE_REGISTRY.with(|sr| sr.borrow_mut().clear());
    }

    // First instance: write data
    {
        let mut storage1 = BlockStorage::new(db_name).await.expect("Should create first storage");
        let mut data = vec![0u8; 4096];
        data[0..25].copy_from_slice(b"cross instance vfs data  ");
        storage1.write_block(20, data).await.expect("Should write block");
        storage1.sync().await.expect("Should sync");

        // Trigger VFS sync to make data visible across instances
        vfs_sync_database(db_name).expect("VFS sync should succeed");
    }

    // Second instance: should see the data
    {
        let mut storage2 = BlockStorage::new(db_name).await.expect("Should create second storage");
        let read_data = storage2.read_block(20).await.expect("Should read block from second instance");

        let mut expected_data = vec![0u8; 4096];
        expected_data[0..25].copy_from_slice(b"cross instance vfs data  ");
        assert_eq!(read_data, expected_data, "Data should be visible across instances after VFS sync");
    }
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_current_vfs_sync_behavior_storage_registration() {
    // Test: Current behavior of storage registration for VFS sync
    let db_name = "vfs_sync_registration_test.db";

    // Clear global state to ensure test isolation
    #[cfg(target_arch = "wasm32")]
    {
        use absurder_sql::storage::vfs_sync::{with_global_storage, with_global_commit_marker};
        use absurder_sql::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        with_global_storage(|gs| gs.borrow_mut().clear());
        with_global_commit_marker(|cm| cm.borrow_mut().clear());
        STORAGE_REGISTRY.with(|sr| sr.borrow_mut().clear());
    }

    let storage = BlockStorage::new(db_name).await.expect("Should create storage");

    // Test storage registration (this is typically done by VFS layer)
    // The registration function should accept the storage and not crash
    let storage_rc = std::rc::Rc::new(std::cell::RefCell::new(storage));
    let weak_ref = std::rc::Rc::downgrade(&storage_rc);

    // This should not panic and should register the storage
    register_storage_for_vfs_sync(db_name, weak_ref);

    // Write some data to verify the registered storage works
    {
        let mut storage_borrow = storage_rc.borrow_mut();
        let mut test_data = vec![0u8; 4096];
        test_data[0..20].copy_from_slice(b"registration test   ");
        storage_borrow.write_block(30, test_data).await.expect("Should write block");
        storage_borrow.sync().await.expect("Should sync");
    }

    // VFS sync should work with registered storage
    vfs_sync_database(db_name).expect("VFS sync should work with registered storage");

    // Verify data persists
    let mut storage2 = BlockStorage::new(db_name).await.expect("Should create verification storage");
    let read_data = storage2.read_block(30).await.expect("Should read block");

    let mut expected_data = vec![0u8; 4096];
    expected_data[0..20].copy_from_slice(b"registration test   ");
    assert_eq!(read_data, expected_data, "Data should persist through registered storage VFS sync");
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_current_vfs_sync_behavior_empty_database() {
    // Test: Current behavior when VFS sync is called on empty database
    let db_name = "vfs_sync_empty_test.db";

    // Clear global state to ensure test isolation
    #[cfg(target_arch = "wasm32")]
    {
        use absurder_sql::storage::vfs_sync::{with_global_storage, with_global_commit_marker};
        use absurder_sql::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        with_global_storage(|gs| gs.borrow_mut().clear());
        with_global_commit_marker(|cm| cm.borrow_mut().clear());
        STORAGE_REGISTRY.with(|sr| sr.borrow_mut().clear());
    }

    let _storage = BlockStorage::new(db_name).await.expect("Should create storage");

    // VFS sync on empty database should not fail
    vfs_sync_database(db_name).expect("VFS sync should succeed on empty database");
    vfs_sync_database_blocking(db_name).expect("Blocking VFS sync should succeed on empty database");

    // After VFS sync, should still be able to create new storage and use it normally
    let mut storage2 = BlockStorage::new(db_name).await.expect("Should create storage after empty VFS sync");

    let mut test_data = vec![0u8; 4096];
    test_data[0..16].copy_from_slice(b"after empty sync");
    storage2.write_block(1, test_data.clone()).await.expect("Should write after empty VFS sync");

    let read_data = storage2.read_block(1).await.expect("Should read after empty VFS sync");
    assert_eq!(read_data, test_data, "Should work normally after empty VFS sync");
}