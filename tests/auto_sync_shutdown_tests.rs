// Auto-sync shutdown behavior and idempotency tests

#![cfg(not(target_arch = "wasm32"))]
use absurder_sql::storage::{BLOCK_SIZE, BlockStorage, SyncPolicy};
use serial_test::serial;
use tempfile::TempDir;
#[path = "common/mod.rs"]
mod common;

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_drain_and_shutdown_stops_timer_and_prevents_future_flushes() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());

    let mut storage = BlockStorage::new_with_capacity("test_shutdown_timer_stop", 8)
        .await
        .expect("create storage");

    // Enable short-interval timer
    storage.enable_auto_sync(30);

    // Make a block dirty and then drain immediately
    storage
        .write_block(1, vec![1u8; BLOCK_SIZE])
        .await
        .expect("write block 1");
    assert_eq!(storage.get_dirty_count(), 1);

    storage.drain_and_shutdown();
    assert_eq!(
        storage.get_dirty_count(),
        0,
        "drain should flush immediately"
    );

    // Record counters post-drain
    let timer_syncs_after_drain = storage.get_timer_sync_count();
    let syncs_after_drain = storage.get_sync_count();

    // Write another block after shutdown; no background timer should flush it
    storage
        .write_block(2, vec![2u8; BLOCK_SIZE])
        .await
        .expect("write block 2 post-shutdown");
    assert_eq!(
        storage.get_dirty_count(),
        1,
        "second write should be dirty initially"
    );

    // Wait longer than the timer interval
    tokio::time::sleep(std::time::Duration::from_millis(120)).await;

    // Dirty block should remain since the timer worker was stopped
    assert_eq!(
        storage.get_dirty_count(),
        1,
        "no timer-based flush should occur after shutdown"
    );
    assert_eq!(
        storage.get_timer_sync_count(),
        timer_syncs_after_drain,
        "timer sync counter should not change after shutdown"
    );
    assert_eq!(
        storage.get_sync_count(),
        syncs_after_drain,
        "overall sync counter should not change after shutdown"
    );
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_drain_and_shutdown_is_idempotent_and_stops_debounce_worker() {
    let tmp = TempDir::new().expect("tempdir");
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());

    let mut storage = BlockStorage::new_with_capacity("test_shutdown_debounce_stop", 8)
        .await
        .expect("create storage");

    // Policy: trigger on first dirty block, but only flush after debounce idle window
    let policy = SyncPolicy {
        interval_ms: None,
        max_dirty: Some(1),
        max_dirty_bytes: None,
        debounce_ms: Some(60),
        verify_after_write: false,
    };
    storage.enable_auto_sync_with_policy(policy);

    // First write reaches threshold; debounce worker would normally flush after idle
    storage
        .write_block(10, vec![3u8; BLOCK_SIZE])
        .await
        .expect("write block 10");
    assert_eq!(storage.get_dirty_count(), 1);

    // Immediately drain and shutdown, then call again to verify idempotency
    storage.drain_and_shutdown();
    storage.drain_and_shutdown();

    // After explicit drain, no dirty blocks remain
    assert_eq!(storage.get_dirty_count(), 0);

    // Write again after shutdown; with workers stopped, no debounce-based flush should happen
    storage
        .write_block(11, vec![4u8; BLOCK_SIZE])
        .await
        .expect("write block 11 post-shutdown");
    assert_eq!(storage.get_dirty_count(), 1);

    // Wait beyond debounce window; still should not flush automatically
    tokio::time::sleep(std::time::Duration::from_millis(150)).await;
    assert_eq!(
        storage.get_dirty_count(),
        1,
        "no debounce-based flush should occur after shutdown"
    );
}
