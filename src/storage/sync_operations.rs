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

    // Record sync start for observability
    let dirty_count = lock_mutex!(storage.dirty_blocks).len();
    let dirty_bytes = dirty_count * super::block_storage::BLOCK_SIZE;
    storage
        .observability
        .record_sync_start(dirty_count, dirty_bytes);

    // Invoke sync start callback if set
    #[cfg(not(target_arch = "wasm32"))]
    if let Some(ref callback) = storage.observability.sync_start_callback {
        callback(dirty_count, dirty_bytes);
    }

    // Call the existing fs_persist implementation for native builds
    #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
    {
        storage.fs_persist_sync()
    }

    // For native non-fs_persist builds, use simple in-memory sync with commit marker handling
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
        let blocks_synced = ids.len(); // Capture length before moving ids

        // Determine next commit version for native path
        let next_commit: u64 = vfs_sync::with_global_commit_marker(|cm| {
            let cm = cm.borrow();
            let current = cm.get(&storage.db_name).copied().unwrap_or(0);
            current + 1
        });

        // Store blocks in global storage with versioning
        vfs_sync::with_global_storage(|gs| {
            let mut storage_map = gs.borrow_mut();
            let db_storage = storage_map
                .entry(storage.db_name.clone())
                .or_insert_with(HashMap::new);
            for (block_id, data) in to_persist {
                db_storage.insert(block_id, data);
            }
        });

        // Store metadata with per-commit versioning
        GLOBAL_METADATA_TEST.with(|meta| {
            let mut meta_map = meta.lock();
            let db_meta = meta_map
                .entry(storage.db_name.clone())
                .or_insert_with(HashMap::new);
            for block_id in ids {
                if let Some(checksum) = storage.checksum_manager.get_checksum(block_id) {
                    // Use the per-commit version so entries remain invisible until the commit marker advances
                    let version = next_commit as u32;
                    db_meta.insert(
                        block_id,
                        BlockMetadataPersist {
                            checksum,
                            last_modified_ms: std::time::SystemTime::now()
                                .duration_since(std::time::UNIX_EPOCH)
                                .unwrap_or_default()
                                .as_millis() as u64,
                            version,
                            algo: storage.checksum_manager.get_algorithm(block_id),
                        },
                    );
                }
            }
        });

        // Atomically advance the commit marker after all data and metadata are persisted
        vfs_sync::with_global_commit_marker(|cm| {
            let mut cm_map = cm.borrow_mut();
            cm_map.insert(storage.db_name.clone(), next_commit);
        });

        // Clear dirty blocks
        {
            let mut dirty = lock_mutex!(storage.dirty_blocks);
            dirty.clear();
        }

        // Update sync metrics
        storage.sync_count.fetch_add(1, Ordering::SeqCst);
        let elapsed = start.elapsed();
        let ms = elapsed.as_millis() as u64;
        let ms = if ms == 0 { 1 } else { ms };
        storage.last_sync_duration_ms.store(ms, Ordering::SeqCst);

        // Record sync success for observability
        storage.observability.record_sync_success(ms, blocks_synced);

        // Invoke sync success callback if set
        if let Some(ref callback) = storage.observability.sync_success_callback {
            callback(ms, blocks_synced);
        }

        storage.evict_if_needed();
        return Ok(());
    }

    #[cfg(target_arch = "wasm32")]
    {
        // WASM implementation
        let current_dirty = lock_mutex!(storage.dirty_blocks).len();
        log::info!("Syncing {} dirty blocks (WASM)", current_dirty);

        // For WASM, persist dirty blocks to global storage
        let to_persist: Vec<(u64, Vec<u8>)> = {
            let dirty = lock_mutex!(storage.dirty_blocks);
            dirty.iter().map(|(k, v)| (*k, v.clone())).collect()
        };
        let ids: Vec<u64> = to_persist.iter().map(|(k, _)| *k).collect();
        // Determine next commit version so that all metadata written in this sync share the same version
        let next_commit: u64 = vfs_sync::with_global_commit_marker(|cm| {
            let cm = cm;
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
                // Check if block already exists in global storage with committed data
                let should_update = if let Some(existing) = db_storage.get(block_id) {
                    if existing != data {
                        // Check if existing data has committed metadata (version > 0)
                        let has_committed_metadata = vfs_sync::with_global_metadata(|meta| {
                            if let Some(db_meta) = meta.borrow().get(&storage.db_name) {
                                if let Some(metadata) = db_meta.get(block_id) {
                                    metadata.version > 0
                                } else {
                                    false
                                }
                            } else {
                                false
                            }
                        });

                        if has_committed_metadata {
                            // CRITICAL FIX: Never overwrite committed data to prevent corruption
                            false // Never overwrite committed data
                        } else {
                            true // Update uncommitted data
                        }
                    } else {
                        true // Same data, safe to update
                    }
                } else {
                    true // No existing data, safe to insert
                };

                if should_update {
                    db_storage.insert(*block_id, data.clone());
                }
            }
        });
        // Persist corresponding metadata entries
        vfs_sync::with_global_metadata(|meta| {
            let mut meta_guard = meta.borrow_mut();
            let db_meta = meta_guard
                .entry(storage.db_name.clone())
                .or_insert_with(HashMap::new);
            for (block_id, metadata) in &metadata_to_persist {
                db_meta.insert(*block_id, metadata.clone());
            }
        });
        // Atomically advance the commit marker after all data and metadata are persisted
        vfs_sync::with_global_commit_marker(|cm| {
            let cm_map = cm;
            cm_map
                .borrow_mut()
                .insert(storage.db_name.clone(), next_commit);
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
        // Clear dirty blocks after successful persistence
        {
            let mut dirty = lock_mutex!(storage.dirty_blocks);
            dirty.clear();
        }

        // Record sync success for observability (WASM)
        // For WASM, we don't have precise timing, so use a default duration
        storage.observability.record_sync_success(1, current_dirty);

        // Invoke WASM sync success callback if set
        #[cfg(target_arch = "wasm32")]
        if let Some(ref callback) = storage.observability.wasm_sync_success_callback {
            callback(1, current_dirty);
        }

        storage.evict_if_needed();
        Ok(())
    }
}
