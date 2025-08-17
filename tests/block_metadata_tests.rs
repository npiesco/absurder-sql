// Block metadata tracking tests for BlockStorage

#![cfg(not(target_arch = "wasm32"))]
use sqlite_indexeddb_rs::storage::{BlockStorage, BLOCK_SIZE};

#[tokio::test(flavor = "current_thread")]
async fn test_checksum_created_on_write_and_changes_with_data() {
    let mut storage = BlockStorage::new_with_capacity("test_meta_checksum", 4)
        .await
        .expect("create storage");

    // Write block 100 with all 7s
    let d1 = vec![7u8; BLOCK_SIZE];
    storage.write_block(100, d1.clone()).await.expect("write 100 d1");
    let c1 = storage.get_block_checksum(100).expect("checksum present after write");

    // Write block 100 with different contents
    let mut d2 = vec![0u8; BLOCK_SIZE];
    d2[0] = 1; // small change
    storage.write_block(100, d2.clone()).await.expect("write 100 d2");
    let c2 = storage.get_block_checksum(100).expect("checksum present after second write");

    assert_ne!(c1, c2, "checksum should change when data changes");
}

#[tokio::test(flavor = "current_thread")]
async fn test_checksum_removed_on_deallocate() {
    let mut storage = BlockStorage::new_with_capacity("test_meta_dealloc", 2)
        .await
        .expect("create storage");

    // Allocate a real block ID before writing and deallocating
    let id = storage.allocate_block().await.expect("allocate block");
    let data = vec![9u8; BLOCK_SIZE];
    storage.write_block(id, data).await.expect("write to allocated id");
    assert!(storage.get_block_checksum(id).is_some());

    storage.deallocate_block(id).await.expect("deallocate allocated id");
    assert!(storage.get_block_checksum(id).is_none(), "checksum should be removed on deallocate");
}

#[tokio::test(flavor = "current_thread")]
async fn test_no_checksum_for_unwritten_block() {
    let mut storage = BlockStorage::new_with_capacity("test_meta_unwritten", 2)
        .await
        .expect("create storage");

    // Simply allocate and read an empty block; no metadata should exist until a write
    let _ = storage.read_block(42).await.expect("read 42");
    assert!(storage.get_block_checksum(42).is_none(), "no checksum tracked for unread/unwritten block");
}
