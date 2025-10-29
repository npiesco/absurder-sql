//! I/O operations for BlockStorage
//! This module contains block reading and writing functionality

#[cfg(not(target_arch = "wasm32"))]
use std::sync::atomic::Ordering;
use crate::types::DatabaseError;
use super::block_storage::{BlockStorage, BLOCK_SIZE};

#[cfg(any(target_arch = "wasm32", all(not(target_arch = "wasm32"), any(test, debug_assertions))))]
use super::vfs_sync;

#[cfg(target_arch = "wasm32")]
use std::collections::HashMap;
#[cfg(target_arch = "wasm32")]
use super::metadata::{BlockMetadataPersist, ChecksumAlgorithm};

#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
use std::{fs, io::Read, path::PathBuf};

#[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions), not(feature = "fs_persist")))]
use super::block_storage::GLOBAL_METADATA_TEST;

/// Synchronous block read implementation
pub fn read_block_sync_impl(storage: &mut BlockStorage, block_id: u64) -> Result<Vec<u8>, DatabaseError> {
        // Skip auto_sync check for reads - only writes trigger sync
        
        // Check cache first (both native and WASM)
        if let Some(data) = storage.cache.get(&block_id).cloned() {
            // Record cache hit
            #[cfg(feature = "telemetry")]
            if let Some(ref metrics) = storage.metrics {
                metrics.cache_hits().inc();
            }
            // Verify checksum even for cached data to catch corruption
            // Skip block 0 as it's the SQLite header which can be modified by SQLite
            if block_id != 0 {
                if let Err(e) = storage.verify_against_stored_checksum(block_id, &data) {
                    return Err(e);
                }
            }
            // Only update LRU when close to capacity to avoid O(n) overhead on every read
            // This maintains correctness for eviction while optimizing hot-path performance
            if storage.cache.len() > (storage.capacity * 4 / 5) {
                storage.touch_lru(block_id);
            }
            
            return Ok(data);
        }
        
        // Record cache miss
        #[cfg(feature = "telemetry")]
        if let Some(ref metrics) = storage.metrics {
            metrics.cache_misses().inc();
            metrics.indexeddb_operations_total().inc();
        }

        // For WASM, check global storage for persistence across instances
        #[cfg(target_arch = "wasm32")]
        {
            // Single combined lookup for commit marker, visibility, and data
            let (data, is_visible) = vfs_sync::with_global_commit_marker(|cm| {
                let committed = cm.borrow().get(&storage.db_name).copied().unwrap_or(0);
                
                // Block 0 (database header) is always visible
                if block_id == 0 {
                    let data = vfs_sync::with_global_storage(|gs| {
                        gs.borrow()
                            .get(&storage.db_name)
                            .and_then(|db_storage| db_storage.get(&block_id))
                            .cloned()
                            .unwrap_or_else(|| vec![0; BLOCK_SIZE])
                    });
                    return (data, true);
                }
                
                // For other blocks, check visibility and get data in one pass
                vfs_sync::with_global_metadata(|meta| {
                    let has_metadata = meta.borrow()
                        .get(&storage.db_name)
                        .and_then(|db_meta| db_meta.get(&block_id))
                        .is_some();
                    
                    if has_metadata {
                        // Has metadata - check if visible based on commit marker
                        let is_visible = meta.borrow()
                            .get(&storage.db_name)
                            .and_then(|db_meta| db_meta.get(&block_id))
                            .map(|m| (m.version as u64) <= committed)
                            .unwrap_or(false);
                        
                        if is_visible {
                            // Visible - return actual data
                            let data = vfs_sync::with_global_storage(|gs| {
                                gs.borrow()
                                    .get(&storage.db_name)
                                    .and_then(|db_storage| db_storage.get(&block_id))
                                    .cloned()
                                    .unwrap_or_else(|| vec![0; BLOCK_SIZE])
                            });
                            (data, true)
                        } else {
                            // Not visible (version > commit marker) - return zeroed data for SQLite
                            (vec![0; BLOCK_SIZE], false)
                        }
                    } else {
                        // No metadata - check if data exists in global storage
                        let data = vfs_sync::with_global_storage(|gs| {
                            gs.borrow()
                                .get(&storage.db_name)
                                .and_then(|db_storage| db_storage.get(&block_id))
                                .cloned()
                        });
                        
                        match data {
                            Some(data) => (data, true), // Old data before metadata tracking
                            None => (vec![0; BLOCK_SIZE], true) // Return zeros for RMW (read-modify-write)
                        }
                    }
                })
            });
            
            // Verify checksum ONLY for visible blocks in WASM
            // Skip block 0 as it's the SQLite header which can be modified by SQLite
            if is_visible && block_id != 0 {
                if let Err(e) = storage.verify_against_stored_checksum(block_id, &data) {
                    return Err(e);
                }
            }
            
            // Cache for future reads (skip eviction check for performance)
            storage.cache.insert(block_id, data.clone());
            return Ok(data);
        }

        // For native fs_persist, read from filesystem if allocated
        #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
        {
            let base: PathBuf = storage.base_dir.clone();
            let mut dir = base.clone();
            dir.push(&storage.db_name);
            let mut blocks = dir.clone();
            blocks.push("blocks");
            let mut block_path = blocks.clone();
            block_path.push(format!("block_{}.bin", block_id));
            // If the block was explicitly deallocated (tombstoned), refuse reads
            if storage.deallocated_blocks.contains(&block_id) {
                return Err(DatabaseError::new(
                    "BLOCK_NOT_ALLOCATED",
                    &format!("Block {} is not allocated", block_id),
                ));
            }
            if let Ok(mut f) = fs::File::open(&block_path) {
                let mut data = vec![0u8; BLOCK_SIZE];
                f.read_exact(&mut data).map_err(|e| DatabaseError::new("IO_ERROR", &format!("read block {} failed: {}", block_id, e)))?;
                storage.cache.insert(block_id, data.clone());
                if let Err(e) = storage.verify_against_stored_checksum(block_id, &data) { return Err(e); }
                storage.touch_lru(block_id);
                storage.evict_if_needed();
                return Ok(data);
            }
            // If file missing, treat as zeroed data (compat). This covers never-written blocks
            // and avoids depending on allocated_blocks for read behavior.
            let data = vec![0; BLOCK_SIZE];
            storage.cache.insert(block_id, data.clone());
            if let Err(e) = storage.verify_against_stored_checksum(block_id, &data) { return Err(e); }
            storage.touch_lru(block_id);
            storage.evict_if_needed();
            return Ok(data);
        }

        // For native tests, check test-global storage for persistence across instances (when fs_persist disabled)
        #[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions), not(feature = "fs_persist")))]
        {
            // Enforce commit gating in native test path as well
            let committed: u64 = vfs_sync::with_global_commit_marker(|cm| {
                let cm = cm.borrow();
                cm.get(&storage.db_name).copied().unwrap_or(0)
            });
            let is_visible: bool = GLOBAL_METADATA_TEST.with(|meta| {
                let meta_map = meta.borrow();
                if let Some(db_meta) = meta_map.get(&storage.db_name) {
                    if let Some(m) = db_meta.get(&block_id) {
                        return (m.version as u64) <= committed;
                    }
                }
                false
            });
            let data = if is_visible {
                vfs_sync::with_global_storage(|gs| {
                    let storage_map = gs.borrow();
                    if let Some(db_storage) = storage_map.get(&storage.db_name) {
                        if let Some(data) = db_storage.get(&block_id) {
                            log::debug!("[test] Block {} found in global storage (sync, committed visible)", block_id);
                            return data.clone();
                        }
                    }
                    vec![0; BLOCK_SIZE]
                })
            } else {
                log::debug!(
                    "[test] Block {} not visible due to commit gating (committed={}, treating as zeroed)",
                    block_id,
                    committed
                );
                vec![0; BLOCK_SIZE]
            };

            // Check if block is actually allocated before returning zeroed data
            if !storage.allocated_blocks.contains(&block_id) && !is_visible {
                let error = DatabaseError::new(
                    "BLOCK_NOT_FOUND",
                    &format!("Block {} not found in storage", block_id)
                );
                // Record error for observability
                storage.observability.record_error(&error);
                return Err(error);
            }
            
            storage.cache.insert(block_id, data.clone());
            log::debug!("[test] Block {} cached from global storage (sync)", block_id);
            // Verify checksum only if the block is visible under the commit marker
            if is_visible {
                if let Err(e) = storage.verify_against_stored_checksum(block_id, &data) {
                    log::error!(
                        "[test] Checksum verification failed for block {} (test storage): {}",
                        block_id, e.message
                    );
                    storage.observability.record_error(&e);
                    return Err(e);
                }
            }
            storage.touch_lru(block_id);
            storage.evict_if_needed();
            return Ok(data);
        }
    }

/// Synchronous block write implementation
pub fn write_block_sync_impl(storage: &mut BlockStorage, block_id: u64, data: Vec<u8>) -> Result<(), DatabaseError> {
    // Record IndexedDB write operation
    #[cfg(feature = "telemetry")]
    if let Some(ref metrics) = storage.metrics {
        metrics.indexeddb_operations_total().inc();
    }
    
    storage.maybe_auto_sync();
    
    // Check for backpressure conditions
    let dirty_count = storage.get_dirty_count();
    if dirty_count > 100 { // Threshold for backpressure
        storage.observability.record_backpressure("high", "too_many_dirty_blocks");
    }
            
            if data.len() != BLOCK_SIZE {
                return Err(DatabaseError::new(
                    "INVALID_BLOCK_SIZE", 
                    &format!("Block size must be {} bytes, got {}", BLOCK_SIZE, data.len())
                ));
            }
    
            // If requested by policy, verify existing data integrity BEFORE accepting the new write.
            // This prevents overwriting a block whose prior contents no longer match the stored checksum.
            let verify_before = storage
                .policy
                .as_ref()
                .map(|p| p.verify_after_write)
                .unwrap_or(false);
            if verify_before {
                #[cfg(not(target_arch = "wasm32"))]
                {
                    if let Some(bytes) = storage.cache.get(&block_id).cloned() {
                        if let Err(e) = storage.verify_against_stored_checksum(block_id, &bytes) {
                            log::error!(
                                "verify_after_write: pre-write checksum verification failed for block {}: {}",
                                block_id, e.message
                            );
                            return Err(e);
                        }
                    }
                }
                #[cfg(target_arch = "wasm32")]
                {
                    if let Some(bytes) = storage.cache.get(&block_id).cloned() {
                        if let Err(e) = storage.verify_against_stored_checksum(block_id, &bytes) {
                            log::error!(
                                "verify_after_write: pre-write checksum verification failed for block {}: {}",
                                block_id, e.message
                            );
                            return Err(e);
                        }
                    } else {
                        let maybe_bytes = vfs_sync::with_global_storage(|gs| {
                            let storage_map = gs.borrow();
                            storage_map
                                .get(&storage.db_name)
                                .and_then(|db| db.get(&block_id))
                                .cloned()
                        });
                        if let Some(bytes) = maybe_bytes {
                            if let Err(e) = storage.verify_against_stored_checksum(block_id, &bytes) {
                                log::error!(
                                    "verify_after_write: pre-write checksum verification failed for block {}: {}",
                                    block_id, e.message
                                );
                                return Err(e);
                            }
                        }
                    }
                }
                #[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions)))]
                {
                    if let Some(bytes) = storage.cache.get(&block_id).cloned() {
                        if let Err(e) = storage.verify_against_stored_checksum(block_id, &bytes) {
                            log::error!(
                                "[test] verify_after_write: pre-write checksum verification failed for block {}: {}",
                                block_id, e.message
                            );
                            return Err(e);
                        }
                    } else {
                        let maybe_bytes = vfs_sync::with_global_storage(|gs| {
                            let storage_map = gs.borrow();
                            storage_map
                                .get(&storage.db_name)
                                .and_then(|db| db.get(&block_id))
                                .cloned()
                        });
                        if let Some(bytes) = maybe_bytes {
                            if let Err(e) = storage.verify_against_stored_checksum(block_id, &bytes) {
                                log::error!(
                                    "[test] verify_after_write: pre-write checksum verification failed for block {}: {}",
                                    block_id, e.message
                                );
                                return Err(e);
                            }
                        }
                    }
                }
            }
    
            // For WASM, immediately persist to global storage FIRST for cross-instance visibility
            #[cfg(target_arch = "wasm32")]
            {
                // Check if this block already exists in global storage with committed data
                let existing_data = vfs_sync::with_global_storage(|gs| {
                    let storage_map = gs.borrow();
                    if let Some(db_storage) = storage_map.get(&storage.db_name) {
                        db_storage.get(&block_id).cloned()
                    } else {
                        None
                    }
                });
                
                // Check if there's existing metadata for this block
                let has_committed_metadata = vfs_sync::with_global_metadata(|meta| {
                    let meta_map = meta.borrow();
                    if let Some(db_meta) = meta_map.get(&storage.db_name) {
                        if let Some(metadata) = db_meta.get(&block_id) {
                            // If version > 0, this block has been committed before
                            metadata.version > 0
                        } else {
                            false
                        }
                    } else {
                        false
                    }
                });
                
                // Only overwrite if there's no committed data or if this is a legitimate update
                let should_write = if let Some(existing) = existing_data {
                    if has_committed_metadata {
                        // CRITICAL FIX: Always allow writes during transactions to ensure schema changes persist
                        true  // Always allow writes when there's committed metadata
                    } else if existing.iter().zip(data.iter()).all(|(a, b)| a == b) {
                        // If the data is identical, skip the write
                        false
                    } else {
                        // Check if the new data is richer (has more non-zero bytes) than existing
                        let existing_non_zero = existing.iter().filter(|&&b| b != 0).count();
                        let new_non_zero = data.iter().filter(|&&b| b != 0).count();
                        
                        if new_non_zero > existing_non_zero {
                            true
                        } else if new_non_zero < existing_non_zero {
                            false
                        } else {
                            true
                        }
                    }
                } else {
                    // Check if there's committed data in global storage that we haven't seen yet
                    let has_global_committed_data = vfs_sync::with_global_metadata(|meta| {
                        let meta_map = meta.borrow();
                        if let Some(db_meta) = meta_map.get(&storage.db_name) {
                            if let Some(metadata) = db_meta.get(&block_id) {
                                metadata.version > 0
                            } else {
                                false
                            }
                        } else {
                            false
                        }
                    });
                    
                    if has_global_committed_data {
                        true  // Allow transactional writes even when committed data exists
                    } else {
                        // No existing data and no committed metadata, safe to write
                        true
                    }
                };
                
                if should_write {
                    vfs_sync::with_global_storage(|gs| {
                        let mut storage_map = gs.borrow_mut();
                        let db_storage = storage_map.entry(storage.db_name.clone()).or_insert_with(HashMap::new);
                        
                        // Log what we're about to write vs what exists
                        // Block overwrite (debug logging removed for performance)
                        
                        db_storage.insert(block_id, data.clone());
                    });
                }
                
                // Always ensure metadata exists for the block, and UPDATE checksum if we wrote new data
                vfs_sync::with_global_metadata(|meta| {
                    let mut meta_map = meta.borrow_mut();
                    let db_meta = meta_map.entry(storage.db_name.clone()).or_insert_with(HashMap::new);
                    
                    // Calculate checksum for the data that will be stored (either new or existing)
                    let stored_data = if should_write {
                        data.clone()
                    } else {
                        // Use existing data from global storage
                        vfs_sync::with_global_storage(|gs| {
                            let storage_map = gs.borrow();
                            if let Some(db_storage) = storage_map.get(&storage.db_name) {
                                if let Some(existing) = db_storage.get(&block_id) {
                                    existing.clone()
                                } else {
                                    data.clone() // Fallback to new data
                                }
                            } else {
                                data.clone() // Fallback to new data
                            }
                        })
                    };
                    
                    let checksum = {
                        let mut hasher = crc32fast::Hasher::new();
                        hasher.update(&stored_data);
                        hasher.finalize() as u64
                    };
                    
                    // If metadata exists, preserve the version number but update the checksum
                    let version = if let Some(existing_meta) = db_meta.get(&block_id) {
                        existing_meta.version
                    } else {
                        1  // Start at version 1 so uncommitted data is hidden (commit marker starts at 0)
                    };
                    
                    db_meta.insert(block_id, BlockMetadataPersist {
                        checksum,
                        version,
                        last_modified_ms: 0, // Will be updated during sync
                        algo: ChecksumAlgorithm::CRC32,
                    });
                });
                
                // Also create/update metadata for native test path
                #[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions), not(feature = "fs_persist")))]
                GLOBAL_METADATA_TEST.with(|meta| {
                    let mut meta_map = meta.borrow_mut();
                    let db_meta = meta_map.entry(storage.db_name.clone()).or_insert_with(HashMap::new);
                    
                    // Calculate checksum for the data that will be stored (either new or existing)
                    let stored_data = if should_write {
                        data.clone()
                    } else {
                        // Use existing data from global test storage
                        vfs_sync::with_global_storage(|gs| {
                            let storage_map = gs.borrow();
                            if let Some(db_storage) = storage_map.get(&storage.db_name) {
                                if let Some(existing) = db_storage.get(&block_id) {
                                    existing.clone()
                                } else {
                                    data.clone() // Fallback to new data
                                }
                            } else {
                                data.clone() // Fallback to new data
                            }
                        })
                    };
                    
                    let checksum = {
                        let mut hasher = crc32fast::Hasher::new();
                        hasher.update(&stored_data);
                        hasher.finalize() as u64
                    };
                    
                    // If metadata exists, preserve the version number but update the checksum
                    let version = if let Some(existing_meta) = db_meta.get(&block_id) {
                        existing_meta.version
                    } else {
                        1  // Start at version 1 so uncommitted data is hidden (commit marker starts at 0)
                    };
                    
                    db_meta.insert(block_id, BlockMetadataPersist {
                        checksum,
                        version,
                        last_modified_ms: 0, // Will be updated during sync
                        algo: ChecksumAlgorithm::CRC32,
                    });
                    log::debug!("Updated test metadata for block {} with checksum {} (version {})", block_id, checksum, version);
                });
            }
            
            // Update cache and mark as dirty
            storage.cache.insert(block_id, data.clone());
            {
                let mut dirty = storage.dirty_blocks.lock();
                dirty.insert(block_id, data);
            }
            // Update checksum metadata on write
            if let Some(bytes) = storage.cache.get(&block_id) {
                storage.checksum_manager.store_checksum(block_id, bytes);
            }
            // Record write time for debounce tracking (native)
            #[cfg(not(target_arch = "wasm32"))]
            {
                storage.last_write_ms.store(BlockStorage::now_millis(), Ordering::SeqCst);
            }
    
            // Policy-based triggers: thresholds
            let (max_dirty_opt, max_bytes_opt) = storage
                .policy
                .as_ref()
                .map(|p| (p.max_dirty, p.max_dirty_bytes))
                .unwrap_or((None, None));
    
            let mut threshold_reached = false;
            if let Some(max_dirty) = max_dirty_opt {
                let cur = storage.dirty_blocks.lock().len();
                if cur >= max_dirty { threshold_reached = true; }
            }
            if let Some(max_bytes) = max_bytes_opt {
                let cur_bytes: usize = {
                    let m = storage.dirty_blocks.lock();
                    m.values().map(|v| v.len()).sum()
                };
                if cur_bytes >= max_bytes { threshold_reached = true; }
            }
    
            if threshold_reached {
                let debounce_ms_opt = storage.policy.as_ref().and_then(|p| p.debounce_ms);
                if let Some(_debounce) = debounce_ms_opt {
                    // Debounce enabled: mark threshold and let debounce thread flush after inactivity
                    #[cfg(not(target_arch = "wasm32"))]
                    {
                        storage.threshold_hit.store(true, Ordering::SeqCst);
                    }
                } else {
                    // No debounce: flush immediately
                    let _ = storage.sync_now();
                }
            }
            
            storage.touch_lru(block_id);
            storage.evict_if_needed();
            
            // Update storage and cache size gauges
            #[cfg(feature = "telemetry")]
            if let Some(ref metrics) = storage.metrics {
                // Update storage bytes gauge
                let total_bytes: usize = storage.cache.values().map(|v| v.len()).sum();
                metrics.storage_bytes().set(total_bytes as f64);
                
                // Update cache size bytes gauge
                let cache_bytes: usize = storage.cache.len() * BLOCK_SIZE;
                metrics.cache_size_bytes().set(cache_bytes as f64);
            }
            
            Ok(())
}
    