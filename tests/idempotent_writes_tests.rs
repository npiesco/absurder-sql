//! Idempotent writes tests - keyed by (block_id, version)
//! Tests that writes with the same (block_id, version) are safe to retry

#![cfg(target_arch = "wasm32")]
#![allow(unused_imports)]

use absurder_sql::storage::{BLOCK_SIZE, BlockStorage};
use std::collections::HashMap;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

/// Test that writing the same (block_id, version) multiple times is idempotent
#[wasm_bindgen_test]
async fn test_idempotent_writes_same_block_version() {
    let db_name = "idempotent_same_version";
    let mut storage = BlockStorage::new(db_name).await.expect("create storage");

    // Allocate and write a block
    let block_id = storage.allocate_block().await.expect("alloc block");
    let data = vec![0xAAu8; BLOCK_SIZE];

    storage
        .write_block(block_id, data.clone())
        .await
        .expect("write block first time");
    storage.sync().await.expect("sync first time");

    let marker1 = storage.get_commit_marker();
    web_sys::console::log_1(&format!("First sync commit marker: {}", marker1).into());

    // Write the same block again with same data - should be idempotent
    storage
        .write_block(block_id, data.clone())
        .await
        .expect("write block second time");
    storage.sync().await.expect("sync second time");

    let marker2 = storage.get_commit_marker();
    web_sys::console::log_1(&format!("Second sync commit marker: {}", marker2).into());

    // Commit marker should advance (new version) but data should be the same
    assert!(marker2 > marker1, "Commit marker should advance on sync");

    // Data should be identical
    let read_data = storage.read_block_sync(block_id).expect("read block");
    assert_eq!(
        read_data, data,
        "Data should be identical after idempotent write"
    );

    // Create new instance to verify cross-instance consistency
    let storage2 = BlockStorage::new(db_name).await.expect("create storage2");
    let read_data2 = storage2
        .read_block_sync(block_id)
        .expect("read block from new instance");
    assert_eq!(
        read_data2, data,
        "Data should be consistent across instances"
    );
}

/// Test that writing different data to the same block_id with different versions works correctly
#[wasm_bindgen_test]
async fn test_idempotent_writes_different_versions() {
    let db_name = "idempotent_diff_versions";
    let mut storage = BlockStorage::new(db_name).await.expect("create storage");

    let block_id = storage.allocate_block().await.expect("alloc block");

    // First write
    let data1 = vec![0x11u8; BLOCK_SIZE];
    storage
        .write_block(block_id, data1.clone())
        .await
        .expect("write block v1");
    storage.sync().await.expect("sync v1");

    let marker1 = storage.get_commit_marker();
    web_sys::console::log_1(&format!("Version 1 commit marker: {}", marker1).into());

    // Second write with different data
    let data2 = vec![0x22u8; BLOCK_SIZE];
    storage
        .write_block(block_id, data2.clone())
        .await
        .expect("write block v2");
    storage.sync().await.expect("sync v2");

    let marker2 = storage.get_commit_marker();
    web_sys::console::log_1(&format!("Version 2 commit marker: {}", marker2).into());

    assert!(
        marker2 > marker1,
        "Commit marker should advance for new version"
    );

    // Should read the latest data
    let read_data = storage.read_block_sync(block_id).expect("read latest");
    assert_eq!(read_data, data2, "Should read the latest version of data");
}

/// Test that concurrent writes to the same (block_id, version) are handled safely
#[wasm_bindgen_test]
async fn test_idempotent_writes_concurrent_same_version() {
    let db_name = "idempotent_concurrent";

    // Create two storage instances
    let mut storage1 = BlockStorage::new(db_name).await.expect("create storage1");
    let storage2 = BlockStorage::new(db_name).await.expect("create storage2");

    // Allocate block in first instance
    let block_id = storage1.allocate_block().await.expect("alloc block");
    let data = vec![0xBBu8; BLOCK_SIZE];

    // Write and sync from first instance
    storage1
        .write_block(block_id, data.clone())
        .await
        .expect("write from storage1");
    storage1.sync().await.expect("sync from storage1");

    let _marker1 = storage1.get_commit_marker();

    // Second instance should see the data
    let read_data = storage2
        .read_block_sync(block_id)
        .expect("read from storage2");
    assert_eq!(read_data, data, "Storage2 should see data from storage1");

    // Both instances write the same data (simulate retry scenario)
    storage1
        .write_block(block_id, data.clone())
        .await
        .expect("write again from storage1");
    storage2
        .write_block(block_id, data.clone())
        .await
        .expect("write same from storage2");

    // Both sync (this tests idempotent behavior)
    storage1.sync().await.expect("sync again from storage1");
    storage2.sync().await.expect("sync from storage2");

    let marker1_final = storage1.get_commit_marker();
    let marker2_final = storage2.get_commit_marker();

    web_sys::console::log_1(
        &format!(
            "Final markers - storage1: {}, storage2: {}",
            marker1_final, marker2_final
        )
        .into(),
    );

    // Both should have consistent state
    let data1_final = storage1
        .read_block_sync(block_id)
        .expect("final read storage1");
    let data2_final = storage2
        .read_block_sync(block_id)
        .expect("final read storage2");

    assert_eq!(data1_final, data, "Storage1 final data should be correct");
    assert_eq!(data2_final, data, "Storage2 final data should be correct");
    assert_eq!(
        data1_final, data2_final,
        "Both storages should have identical data"
    );
}

/// Test idempotent writes with checksum verification
#[wasm_bindgen_test]
async fn test_idempotent_writes_checksum_consistency() {
    let db_name = "idempotent_checksum";
    let mut storage = BlockStorage::new(db_name).await.expect("create storage");

    let block_id = storage.allocate_block().await.expect("alloc block");
    let data = vec![0xCCu8; BLOCK_SIZE];

    // Write and sync multiple times
    for i in 0..3 {
        web_sys::console::log_1(&format!("Idempotent write iteration: {}", i).into());

        storage
            .write_block(block_id, data.clone())
            .await
            .expect("write block");
        storage.sync().await.expect("sync block");

        // Verify data is consistent
        let read_data = storage.read_block_sync(block_id).expect("read block");
        assert_eq!(
            read_data, data,
            "Data should be consistent on iteration {}",
            i
        );
    }

    // Final verification with new instance
    let storage2 = BlockStorage::new(db_name).await.expect("create storage2");
    let final_data = storage2.read_block_sync(block_id).expect("final read");
    assert_eq!(
        final_data, data,
        "Final data should be consistent across instances"
    );
}

/// Test that idempotent writes handle metadata correctly
#[wasm_bindgen_test]
async fn test_idempotent_writes_metadata_handling() {
    let db_name = "idempotent_metadata";
    let mut storage = BlockStorage::new(db_name).await.expect("create storage");

    let block_id = storage.allocate_block().await.expect("alloc block");
    let data = vec![0xDDu8; BLOCK_SIZE];

    // First write and sync
    storage
        .write_block(block_id, data.clone())
        .await
        .expect("write block");
    storage.sync().await.expect("sync block");

    let marker_after_first = storage.get_commit_marker();

    // Write same data again (idempotent)
    storage
        .write_block(block_id, data.clone())
        .await
        .expect("write block again");
    storage.sync().await.expect("sync block again");

    let marker_after_second = storage.get_commit_marker();

    // Commit marker should advance even for idempotent writes (new version)
    assert!(
        marker_after_second > marker_after_first,
        "Commit marker should advance for idempotent writes"
    );

    // But data should remain the same
    let read_data = storage.read_block_sync(block_id).expect("read block");
    assert_eq!(read_data, data, "Data should remain consistent");

    web_sys::console::log_1(
        &format!(
            "Metadata test - markers: {} -> {}",
            marker_after_first, marker_after_second
        )
        .into(),
    );
}

/// Test true idempotent writes with explicit (block_id, version) keying
/// This test verifies that writing to the same (block_id, version) multiple times
/// produces identical results and doesn't cause conflicts in IndexedDB
#[wasm_bindgen_test]
async fn test_explicit_block_id_version_idempotency() {
    let db_name = "explicit_idempotent";

    // Simulate a scenario where the same (block_id, version) write might be retried
    // This could happen during IndexedDB transaction retries or network issues

    let mut storage1 = BlockStorage::new(db_name).await.expect("create storage1");
    let block_id = storage1.allocate_block().await.expect("alloc block");
    let data = vec![0xEEu8; BLOCK_SIZE];

    // Write and sync to establish version 1
    storage1
        .write_block(block_id, data.clone())
        .await
        .expect("write v1");
    storage1.sync().await.expect("sync v1");

    let version1_marker = storage1.get_commit_marker();
    web_sys::console::log_1(
        &format!("Established version 1 with marker: {}", version1_marker).into(),
    );

    // Now simulate a retry scenario where we might try to write the same (block_id, version) again
    // In a proper idempotent system, this should not cause issues

    // Create another instance that might try to write the same version
    let storage2 = BlockStorage::new(db_name).await.expect("create storage2");

    // Both instances should see the same committed state
    let data1 = storage1
        .read_block_sync(block_id)
        .expect("read from storage1");
    let data2 = storage2
        .read_block_sync(block_id)
        .expect("read from storage2");
    assert_eq!(data1, data2, "Both instances should see identical data");

    // If we write the same data again, it should be truly idempotent
    // The key insight: the system should handle this gracefully without version conflicts
    storage1
        .write_block(block_id, data.clone())
        .await
        .expect("retry write storage1");
    storage2
        .write_block(block_id, data.clone())
        .await
        .expect("retry write storage2");

    // Both sync - this tests the core idempotency requirement
    storage1.sync().await.expect("retry sync storage1");
    storage2.sync().await.expect("retry sync storage2");

    // Verify final state is consistent
    let final_data1 = storage1
        .read_block_sync(block_id)
        .expect("final read storage1");
    let final_data2 = storage2
        .read_block_sync(block_id)
        .expect("final read storage2");

    assert_eq!(final_data1, data, "Storage1 should have correct final data");
    assert_eq!(final_data2, data, "Storage2 should have correct final data");
    assert_eq!(
        final_data1, final_data2,
        "Both instances should converge to same state"
    );

    let final_marker1 = storage1.get_commit_marker();
    let final_marker2 = storage2.get_commit_marker();

    web_sys::console::log_1(
        &format!(
            "Final state - marker1: {}, marker2: {}",
            final_marker1, final_marker2
        )
        .into(),
    );

    // The system should handle the idempotent writes without corruption
    assert!(
        final_marker1 >= version1_marker,
        "Marker should not go backwards"
    );
    assert!(
        final_marker2 >= version1_marker,
        "Marker should not go backwards"
    );
}
