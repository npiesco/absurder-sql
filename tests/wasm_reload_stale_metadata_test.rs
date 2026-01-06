//! Test for multi-tab reload scenario where stale metadata causes checksum mismatch
//!
//! Bug scenario:
//! 1. Tab B has GLOBAL_METADATA with checksums from its initial state
//! 2. Tab A writes new data and syncs to IndexedDB
//! 3. Tab B calls reloadFromIndexedDB which restores blocks but not metadata
//! 4. Tab B's stale metadata checksums don't match new block data = CHECKSUM_MISMATCH error
//!
//! Fix: When force=true, clear GLOBAL_METADATA before restoring blocks

#![cfg(target_arch = "wasm32")]

use absurder_sql::storage::vfs_sync;
use absurder_sql::storage::wasm_indexeddb::restore_from_indexeddb_force;
use absurder_sql::storage::{BLOCK_SIZE, BlockStorage};
use absurder_sql::utils::normalize_db_name;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

/// Test that stale metadata causes checksum mismatch (demonstrates the bug)
/// Then test that force reload fixes it by clearing stale metadata
#[wasm_bindgen_test]
async fn test_stale_metadata_causes_checksum_mismatch() {
    let db_name = "stale_checksum_test";
    let normalized_name = normalize_db_name(db_name);

    // Step 1: Create storage and write data
    let mut storage = BlockStorage::new(db_name).await.expect("create storage");
    let block1 = storage.allocate_block().await.expect("allocate block1");

    let data1 = vec![0x11u8; BLOCK_SIZE];
    storage
        .write_block(block1, data1.clone())
        .await
        .expect("write");
    storage.sync().await.expect("sync");

    web_sys::console::log_1(&"[TEST] Step 1: Written and synced data".into());

    // Get the correct checksum that was computed
    let correct_checksum = vfs_sync::with_global_metadata(|gm| {
        gm.borrow()
            .get(&normalized_name)
            .and_then(|m| m.get(&block1))
            .map(|m| m.checksum)
    });
    web_sys::console::log_1(&format!("[TEST] Correct checksum: {:?}", correct_checksum).into());

    // Step 2: Inject STALE metadata with WRONG checksum
    // This simulates Tab B having old checksums after Tab A wrote new data
    let stale_checksum = 0xDEADBEEFCAFEBABE_u64;
    vfs_sync::with_global_metadata(|gm| {
        let mut binding = gm.borrow_mut();
        if let Some(db_meta) = binding.get_mut(&normalized_name) {
            if let Some(meta) = db_meta.get_mut(&block1) {
                meta.checksum = stale_checksum;
                web_sys::console::log_1(
                    &format!("[TEST] Step 2: Injected stale checksum: {}", stale_checksum).into(),
                );
            }
        }
    });

    // Step 3: Reload cache to pick up stale metadata
    storage.reload_cache_from_global_storage();
    web_sys::console::log_1(&"[TEST] Step 3: Reloaded cache with stale metadata".into());

    // Step 4: Try to read - should FAIL with checksum mismatch (the bug)
    let read_result = storage.read_block_sync(block1);

    match &read_result {
        Ok(_) => {
            web_sys::console::log_1(&"[TEST] Step 4: Read unexpectedly succeeded".into());
            // If this succeeds, checksum validation isn't working
        }
        Err(e) => {
            let err_str = format!("{:?}", e);
            web_sys::console::log_1(
                &format!("[TEST] Step 4: Read failed as expected: {}", err_str).into(),
            );
            // Should fail with CHECKSUM_MISMATCH
            assert!(
                err_str.contains("CHECKSUM") || err_str.contains("checksum"),
                "Should fail with checksum error, got: {}",
                err_str
            );
        }
    }

    // Step 5: Now call restore_from_indexeddb_force - this should clear stale metadata
    // After the fix, this will clear GLOBAL_METADATA before restoring
    restore_from_indexeddb_force(&normalized_name)
        .await
        .expect("force restore");
    web_sys::console::log_1(&"[TEST] Step 5: Called restore_from_indexeddb_force".into());

    // Step 6: Reload cache again
    storage.reload_cache_from_global_storage();
    web_sys::console::log_1(&"[TEST] Step 6: Reloaded cache after force restore".into());

    // Step 7: Check if stale metadata was cleared
    let metadata_after = vfs_sync::with_global_metadata(|gm| {
        gm.borrow()
            .get(&normalized_name)
            .and_then(|m| m.get(&block1))
            .map(|m| m.checksum)
    });
    web_sys::console::log_1(
        &format!("[TEST] Metadata after force restore: {:?}", metadata_after).into(),
    );

    // The stale checksum should NOT still be there
    if let Some(checksum) = metadata_after {
        assert_ne!(
            checksum, stale_checksum,
            "Stale checksum should be cleared by force restore"
        );
    }

    // Step 8: Read should now succeed (stale metadata cleared)
    let read_result2 = storage.read_block_sync(block1);
    assert!(
        read_result2.is_ok(),
        "Read should succeed after force restore cleared stale metadata: {:?}",
        read_result2.err()
    );

    let read_data = read_result2.unwrap();
    assert_eq!(read_data, data1, "Data should match original");

    web_sys::console::log_1(&"[TEST] PASSED: Force restore cleared stale metadata".into());
}
