use sqlite_indexeddb_rs::storage::{BlockStorage, SyncPolicy, BLOCK_SIZE};

#[tokio::test(start_paused = true, flavor = "current_thread")]
async fn test_tokio_interval_triggers_flush_on_time_advance() {
    // Arrange: create storage and write a dirty block
    let mut storage = BlockStorage::new("manager_test_db").await.unwrap();
    let block_id = storage.allocate_block().await.unwrap();
    let data = vec![7u8; BLOCK_SIZE];
    storage.write_block(block_id, data).await.unwrap();

    // Ensure we have one dirty block
    assert_eq!(storage.get_dirty_count(), 1, "precondition: one dirty block");

    // Enable auto-sync with interval; debounce disabled to make timer the trigger
    let policy = SyncPolicy {
        interval_ms: Some(200),
        max_dirty: None,
        max_dirty_bytes: None,
        debounce_ms: None,
        verify_after_write: false,
    };
    storage.enable_auto_sync_with_policy(policy);

    // Act: advance Tokio time beyond the interval and yield to run spawned tasks
    tokio::time::advance(std::time::Duration::from_millis(250)).await;
    tokio::task::yield_now().await;
    // Advance a bit more to ensure the interval tick is processed
    tokio::time::advance(std::time::Duration::from_millis(1)).await;
    tokio::task::yield_now().await;

    // Assert: dirty blocks flushed and timer sync counter incremented
    assert_eq!(storage.get_dirty_count(), 0, "dirty blocks should be flushed by tokio interval");
    assert!(storage.get_timer_sync_count() >= 1, "timer sync count should increment");
}

#[tokio::test(flavor = "current_thread")]
async fn test_threshold_triggers_immediate_flush_without_debounce() {
    // Arrange
    let mut storage = BlockStorage::new("threshold_immediate_db").await.unwrap();
    let block_id = storage.allocate_block().await.unwrap();
    let data = vec![1u8; BLOCK_SIZE];

    // Enable policy: max_dirty=1, no debounce => immediate flush on threshold
    let policy = SyncPolicy {
        interval_ms: None,
        max_dirty: Some(1),
        max_dirty_bytes: None,
        debounce_ms: None,
        verify_after_write: false,
    };
    storage.enable_auto_sync_with_policy(policy);

    // Act: first write reaches threshold and should flush immediately
    storage.write_block(block_id, data).await.unwrap();

    // Assert: no dirty blocks remain; debounce/timer counters unchanged
    assert_eq!(storage.get_dirty_count(), 0, "threshold should flush immediately without debounce");
    assert_eq!(storage.get_timer_sync_count(), 0, "timer syncs should not be used");
    assert_eq!(storage.get_debounce_sync_count(), 0, "debounce syncs should not be used");
}

#[tokio::test(flavor = "current_thread")]
async fn test_debounce_flushes_after_idle_following_threshold() {
    // Arrange
    let mut storage = BlockStorage::new("debounce_after_idle_db").await.unwrap();
    let b1 = storage.allocate_block().await.unwrap();
    let b2 = storage.allocate_block().await.unwrap();
    let data1 = vec![2u8; BLOCK_SIZE];
    let data2 = vec![3u8; BLOCK_SIZE];

    // Enable policy: threshold at 2 dirty blocks with small debounce window
    let policy = SyncPolicy {
        interval_ms: None,
        max_dirty: Some(2),
        max_dirty_bytes: None,
        debounce_ms: Some(20),
        verify_after_write: false,
    };
    storage.enable_auto_sync_with_policy(policy);

    // Act: reach threshold with two writes
    storage.write_block(b1, data1).await.unwrap();
    storage.write_block(b2, data2).await.unwrap();

    // Debounce uses system time for idle detection; wait a bit in real time
    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    tokio::task::yield_now().await;

    // Assert: dirty blocks flushed and debounce metric incremented
    assert_eq!(storage.get_dirty_count(), 0, "debounce should flush after idle period following threshold");
    assert!(storage.get_debounce_sync_count() >= 1, "debounce sync count should increment");
}
