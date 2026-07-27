//! Sync operations for BlockStorage
//! This module contains the core sync implementation logic

// Reentrancy-safe lock macros
#[cfg(target_arch = "wasm32")]
macro_rules! lock_mutex {
    ($mutex:expr) => {
        $mutex
            .try_borrow_mut()
            .expect("RefCell borrow failed - reentrancy detected in sync_operations.rs")
    };
}

#[cfg(not(target_arch = "wasm32"))]
macro_rules! lock_mutex {
    ($mutex:expr) => {
        $mutex.lock()
    };
}

#[allow(unused_macros)]
#[cfg(target_arch = "wasm32")]
macro_rules! try_lock_mutex {
    ($mutex:expr) => {
        $mutex
    };
}

#[allow(unused_macros)]
#[cfg(not(target_arch = "wasm32"))]
macro_rules! try_lock_mutex {
    ($mutex:expr) => {
        $mutex.lock()
    };
}

use super::block_storage::BlockStorage;
use crate::types::DatabaseError;

#[cfg(all(not(target_arch = "wasm32"), not(feature = "fs_persist")))]
use std::collections::HashMap;
#[cfg(all(not(target_arch = "wasm32"), not(feature = "fs_persist")))]
use std::sync::atomic::Ordering;

#[cfg(any(
    target_arch = "wasm32",
    all(not(target_arch = "wasm32"), not(feature = "fs_persist"))
))]
use super::metadata::BlockMetadataPersist;
#[cfg(any(
    target_arch = "wasm32",
    all(not(target_arch = "wasm32"), not(feature = "fs_persist"))
))]
use super::vfs_sync;

#[cfg(target_arch = "wasm32")]
use std::collections::HashMap;

#[cfg(all(not(target_arch = "wasm32"), not(feature = "fs_persist")))]
use super::block_storage::GLOBAL_METADATA_TEST;

/// Internal sync implementation shared by sync() and sync_now()
pub fn sync_implementation_impl(storage: &mut BlockStorage) -> Result<(), DatabaseError> {
    #[cfg(all(not(target_arch = "wasm32"), not(feature = "fs_persist")))]
    let start = std::time::Instant::now();

    let dirty_count = lock_mutex!(storage.dirty_blocks).len();
    let dirty_bytes = dirty_count * super::block_storage::BLOCK_SIZE;
    storage
        .observability
        .record_sync_start(dirty_count, dirty_bytes);

    #[cfg(not(target_arch = "wasm32"))]
    if let Some(ref callback) = storage.observability.sync_start_callback {
        callback(dirty_count, dirty_bytes);
    }

    #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
    {
        storage.fs_persist_sync()
    }

    #[cfg(all(not(target_arch = "wasm32"), not(feature = "fs_persist")))]
    {
        let current_dirty = lock_mutex!(storage.dirty_blocks).len();
        log::info!(
            "Syncing {} dirty blocks (native non-fs_persist)",
            current_dirty
        );

        let to_persist: Vec<(u64, Vec<u8>)> = {
            let dirty = lock_mutex!(storage.dirty_blocks);
            dirty.iter().map(|(k, v)| (*k, v.clone())).collect()
        };
        let ids: Vec<u64> = to_persist.iter().map(|(k, _)| *k).collect();
        let blocks_synced = ids.len();

        let next_commit: u64 = vfs_sync::with_global_commit_marker(|cm| {
            let cm = cm.borrow();
            let current = cm.get(&storage.db_name).copied().unwrap_or(0);
            current + 1
        });

        vfs_sync::with_global_storage(|gs| {
            let mut storage_map = gs.borrow_mut();
            let db_storage = storage_map
                .entry(storage.db_name.clone())
                .or_insert_with(HashMap::new);
            for (block_id, data) in to_persist {
                db_storage.insert(block_id, data);
            }
        });

        GLOBAL_METADATA_TEST.with(|meta| {
            let mut meta_map = meta.lock();
            let db_meta = meta_map
                .entry(storage.db_name.clone())
                .or_insert_with(HashMap::new);
            for block_id in ids {
                if let Some(checksum) = storage.checksum_manager.get_checksum(block_id) {
                    db_meta.insert(
                        block_id,
                        BlockMetadataPersist {
                            checksum,
                            last_modified_ms: std::time::SystemTime::now()
                                .duration_since(std::time::UNIX_EPOCH)
                                .unwrap_or_default()
                                .as_millis() as u64,
                            version: next_commit as u32,
                            algo: storage.checksum_manager.get_algorithm(block_id),
                        },
                    );
                }
            }
        });

        vfs_sync::with_global_commit_marker(|cm| {
            let mut cm_map = cm.borrow_mut();
            cm_map.insert(storage.db_name.clone(), next_commit);
        });

        lock_mutex!(storage.dirty_blocks).clear();

        storage.sync_count.fetch_add(1, Ordering::SeqCst);
        let ms = (start.elapsed().as_millis() as u64).max(1);
        storage.last_sync_duration_ms.store(ms, Ordering::SeqCst);
        storage.observability.record_sync_success(ms, blocks_synced);

        if let Some(ref callback) = storage.observability.sync_success_callback {
            callback(ms, blocks_synced);
        }

        storage.evict_if_needed();
        return Ok(());
    }

    #[cfg(target_arch = "wasm32")]
    {
        let current_dirty = lock_mutex!(storage.dirty_blocks).len();
        log::info!("Syncing {} dirty blocks (WASM)", current_dirty);

        let to_persist: Vec<(u64, Vec<u8>)> = {
            let dirty = lock_mutex!(storage.dirty_blocks);
            dirty.iter().map(|(k, v)| (*k, v.clone())).collect()
        };
        let ids: Vec<u64> = to_persist.iter().map(|(k, _)| *k).collect();
        let next_commit: u64 = vfs_sync::with_global_commit_marker(|cm| {
            let current = cm.borrow().get(&storage.db_name).copied().unwrap_or(0);
            current + 1
        });
        let metadata_to_persist: Vec<(u64, BlockMetadataPersist)> = ids
            .iter()
            .filter_map(|block_id| {
                storage
                    .checksum_manager
                    .get_checksum(*block_id)
                    .map(|checksum| {
                        (
                            *block_id,
                            BlockMetadataPersist {
                                checksum,
                                last_modified_ms: BlockStorage::now_millis(),
                                version: next_commit as u32,
                                algo: storage.checksum_manager.get_algorithm(*block_id),
                            },
                        )
                    })
            })
            .collect();

        vfs_sync::with_global_storage(|gs| {
            let mut storage_map = gs.borrow_mut();
            let db_storage = storage_map
                .entry(storage.db_name.clone())
                .or_insert_with(HashMap::new);
            for (block_id, data) in &to_persist {
                let should_update = if let Some(existing) = db_storage.get(block_id) {
                    if existing != data {
                        !vfs_sync::with_global_metadata(|meta| {
                            meta.borrow()
                                .get(&storage.db_name)
                                .and_then(|db_meta| db_meta.get(block_id))
                                .is_some_and(|metadata| metadata.version > 0)
                        })
                    } else {
                        true
                    }
                } else {
                    true
                };

                if should_update {
                    db_storage.insert(*block_id, data.clone());
                }
            }
        });

        vfs_sync::with_global_metadata(|meta| {
            let mut meta_guard = meta.borrow_mut();
            let db_meta = meta_guard
                .entry(storage.db_name.clone())
                .or_insert_with(HashMap::new);
            for (block_id, metadata) in &metadata_to_persist {
                db_meta.insert(*block_id, metadata.clone());
            }
        });
        vfs_sync::with_global_commit_marker(|cm| {
            cm.borrow_mut().insert(storage.db_name.clone(), next_commit);
        });

        if !to_persist.is_empty() {
            let db_name = storage.db_name.clone();
            let backend = storage.storage_backend();
            wasm_bindgen_futures::spawn_local(async move {
                let persist_result = match backend {
                    super::block_storage::StorageBackend::IndexedDb => {
                        super::wasm_indexeddb::persist_to_indexeddb_event_based(
                            &db_name,
                            to_persist,
                            metadata_to_persist,
                            next_commit,
                            #[cfg(feature = "telemetry")]
                            None,
                            #[cfg(feature = "telemetry")]
                            None,
                        )
                        .await
                    }
                    super::block_storage::StorageBackend::Opfs
                    | super::block_storage::StorageBackend::Hybrid => {
                        super::hybrid_store::hybrid_persist(
                            &db_name,
                            to_persist,
                            metadata_to_persist,
                            next_commit,
                            #[cfg(feature = "telemetry")]
                            None,
                            #[cfg(feature = "telemetry")]
                            None,
                        )
                        .await
                    }
                };

                if let Err(error) = persist_result {
                    log::error!(
                        "Failed to persist {} using backend {}: {}",
                        db_name,
                        backend.as_str(),
                        error
                    );
                }
            });
        }

        lock_mutex!(storage.dirty_blocks).clear();
        storage.observability.record_sync_success(1, current_dirty);

        if let Some(ref callback) = storage.observability.wasm_sync_success_callback {
            callback(1, current_dirty);
        }

        storage.evict_if_needed();
        Ok(())
    }
}
