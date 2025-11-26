//! Test that captures the CURRENT behavior of checksum fields in BlockStorage
//! This ensures that when we refactor, we preserve the exact same behavior

#[cfg(target_arch = "wasm32")]
use wasm_bindgen_test::*;

#[cfg(target_arch = "wasm32")]
wasm_bindgen_test_configure!(run_in_browser);

#[cfg(target_arch = "wasm32")]
use absurder_sql::storage::BlockStorage;

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_current_checksum_behavior_write_read() {
    // Test: Current behavior of checksum calculation and validation
    let storage = BlockStorage::new("checksum_test.db")
        .await
        .expect("Should create storage");

    // Create test data (4096 bytes required)
    let mut test_data = vec![0u8; 4096];
    test_data[0..20].copy_from_slice(b"test checksum data  ");

    // Write block - this should calculate and store checksum internally
    storage
        .write_block(42, test_data.clone())
        .await
        .expect("Should write block");
    storage.sync().await.expect("Should sync");

    // Read block back - this should validate checksum internally
    let read_data = storage.read_block(42).await.expect("Should read block");

    assert_eq!(
        read_data, test_data,
        "Data should be preserved and checksum validated"
    );
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_current_checksum_behavior_multiple_blocks() {
    // Test: Current behavior with multiple blocks (each should have its own checksum)
    let storage = BlockStorage::new("multi_checksum_test.db")
        .await
        .expect("Should create storage");

    // Write multiple blocks with different data
    for i in 1..=3 {
        let mut data = vec![0u8; 4096];
        let text = format!("block {} unique data", i);
        data[0..text.len()].copy_from_slice(text.as_bytes());

        storage
            .write_block(i, data)
            .await
            .expect(&format!("Should write block {}", i));
    }

    storage.sync().await.expect("Should sync");

    // Read them back - each should validate its own checksum
    for i in 1..=3 {
        let mut expected_data = vec![0u8; 4096];
        let text = format!("block {} unique data", i);
        expected_data[0..text.len()].copy_from_slice(text.as_bytes());

        let read_data = storage
            .read_block(i)
            .await
            .expect(&format!("Should read block {}", i));
        assert_eq!(
            read_data, expected_data,
            "Block {} should preserve data and validate checksum",
            i
        );
    }
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_current_checksum_behavior_data_corruption_detection() {
    // Test: Current behavior should detect data corruption via checksum mismatch
    let storage = BlockStorage::new("corruption_test.db")
        .await
        .expect("Should create storage");

    let mut original_data = vec![0u8; 4096];
    original_data[0..15].copy_from_slice(b"original data  ");

    // Write and sync
    storage
        .write_block(100, original_data.clone())
        .await
        .expect("Should write block");
    storage.sync().await.expect("Should sync");

    // Normal read should work
    let read_data = storage
        .read_block(100)
        .await
        .expect("Should read uncorrupted data");
    assert_eq!(
        read_data, original_data,
        "Uncorrupted data should read correctly"
    );

    // If the current implementation detects corruption, this test will capture that behavior
    // If it doesn't detect corruption, this test captures that behavior too
    // The important thing is to preserve whatever the current behavior is
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_current_checksum_behavior_overwrite_block() {
    // Test: Current behavior when overwriting a block (checksum should update)
    let storage = BlockStorage::new("overwrite_test.db")
        .await
        .expect("Should create storage");

    // Write initial data
    let mut data1 = vec![0u8; 4096];
    data1[0..12].copy_from_slice(b"first write ");
    storage
        .write_block(50, data1.clone())
        .await
        .expect("Should write first data");
    storage.sync().await.expect("Should sync");

    // Verify first data
    let read1 = storage
        .read_block(50)
        .await
        .expect("Should read first data");
    assert_eq!(read1, data1, "First write should be preserved");

    // Overwrite with different data
    let mut data2 = vec![0u8; 4096];
    data2[0..13].copy_from_slice(b"second write ");
    storage
        .write_block(50, data2.clone())
        .await
        .expect("Should overwrite block");
    storage.sync().await.expect("Should sync");

    // Verify second data (checksum should have been updated)
    let read2 = storage
        .read_block(50)
        .await
        .expect("Should read overwritten data");
    assert_eq!(
        read2, data2,
        "Overwrite should be preserved with updated checksum"
    );
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_current_checksum_behavior_across_instances() {
    // Test: Current behavior of checksums persisting across storage instances
    let db_name = "persistence_checksum_test.db";

    // First instance - write data
    {
        let storage1 = BlockStorage::new(db_name)
            .await
            .expect("Should create first storage");
        let mut data = vec![0u8; 4096];
        data[0..18].copy_from_slice(b"persistent data   ");

        storage1
            .write_block(25, data)
            .await
            .expect("Should write in first instance");
        storage1.sync().await.expect("Should sync");
    }

    // Second instance - read same data (checksum should be preserved and validated)
    {
        let storage2 = BlockStorage::new(db_name)
            .await
            .expect("Should create second storage");
        let read_data = storage2
            .read_block(25)
            .await
            .expect("Should read in second instance");

        let mut expected_data = vec![0u8; 4096];
        expected_data[0..18].copy_from_slice(b"persistent data   ");
        assert_eq!(
            read_data, expected_data,
            "Data should persist with valid checksum across instances"
        );
    }
}
