//! I/O operations for BlockStorage
//! This module contains block reading and writing functionality

#[cfg(not(target_arch = "wasm32"))]
use std::sync::atomic::Ordering;
use crate::types::DatabaseError;
use super::block_storage::{BlockStorage, BLOCK_SIZE};
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
        log::debug!("Reading block {} from cache or storage", block_id);
        #[cfg(target_arch = "wasm32")]
        web_sys::console::log_1(&format!("DEBUG: READ REQUEST for block {} in database {}", block_id, storage.db_name).into());
        storage.maybe_auto_sync();
        
        // For WASM, skip cache for now to ensure we always check global storage for cross-instance data
        // This prevents stale cache data from hiding committed blocks
        #[cfg(not(target_arch = "wasm32"))]
        {
            // Check cache first
            if let Some(data) = storage.cache.get(&block_id).cloned() {
                log::debug!("Block {} found in cache (sync)", block_id);
                // Verify checksum if we have one
                if let Err(e) = storage.verify_against_stored_checksum(block_id, &data) {
                    log::error!(
                        "Checksum verification failed for block {} (cache): {}",
                        block_id, e.message
                    );
                    return Err(e);
                }
                storage.touch_lru(block_id);
                return Ok(data);
            }
        }

        // For WASM, check global storage for persistence across instances
        #[cfg(target_arch = "wasm32")]
        {
            // Enforce commit gating: only expose data whose metadata version <= commit marker
            let committed: u64 = vfs_sync::with_global_commit_marker(|cm| {
                let cm = cm.borrow();
                let marker = cm.get(&storage.db_name).copied().unwrap_or(0);
                #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Current commit marker for {} during read: {}", storage.db_name, marker).into());
                marker
            });
            // Check if block should be visible based on commit marker gating
            // Only allow the database header block (0) to be always visible to prevent SQLite panics
            // Other blocks should be subject to commit marker gating
            let is_structural_block = block_id == 0;
            let is_visible: bool = if is_structural_block {
                #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Block {} is structural, always visible", block_id).into());
                true
            } else {
                vfs_sync::with_global_metadata(|meta| {
                    let meta_map = meta.borrow();
                    if let Some(db_meta) = meta_map.get(&storage.db_name) {
                        if let Some(m) = db_meta.get(&block_id) {
                            let visible = (m.version as u64) <= committed;
                            #[cfg(target_arch = "wasm32")]
                    web_sys::console::log_1(&format!("DEBUG: Block {} visibility check - version: {}, committed: {}, visible: {}", block_id, m.version, committed, visible).into());
                            return visible;
                        }
                    }
                    // If block has no metadata but exists in global storage, make it visible
                    // This handles blocks written before metadata tracking
                    let exists_in_storage = vfs_sync::with_global_storage(|gs| {
                        let storage_map = gs.borrow();
                        storage_map.get(&storage.db_name)
                            .map(|db_storage| db_storage.contains_key(&block_id))
                            .unwrap_or(false)
                    });
                    
                    if exists_in_storage {
                        #[cfg(target_arch = "wasm32")]
                    web_sys::console::log_1(&format!("DEBUG: Block {} has no metadata but exists in storage, making visible", block_id).into());
                        true
                    } else {
                        #[cfg(target_arch = "wasm32")]
                    web_sys::console::log_1(&format!("DEBUG: Block {} has no metadata and doesn't exist in storage, allowing read (will return zeros)", block_id).into());
                        true  // Always allow reads to proceed
                    }
                })
            };
            let data = if is_visible {
                // First try to get from global storage (cross-instance data)
                let global_data = vfs_sync::with_global_storage(|gs| {
                    let storage_map = gs.borrow();
                    #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Checking global storage for block {} in database {} (total dbs: {})", block_id, storage.db_name, storage_map.len()).into());
                    if let Some(db_storage) = storage_map.get(&storage.db_name) {
                        #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Found database {} in global storage with {} blocks", storage.db_name, db_storage.len()).into());
                        if let Some(data) = db_storage.get(&block_id) {
                            // Log the first few bytes to see what data we're returning
                            let preview = if data.len() >= 16 {
                                format!("{:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x}", 
                                    data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7],
                                    data[8], data[9], data[10], data[11], data[12], data[13], data[14], data[15])
                            } else {
                                "short block".to_string()
                            };
                            #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: SUCCESS! Returning block {} from global storage: {}", block_id, preview).into());
                            log::debug!(
                                "Block {} found in global storage (sync, committed visible)",
                                block_id
                            );
                            return Some(data.clone());
                        } else {
                            let block_ids: Vec<String> = db_storage.keys().map(|k| k.to_string()).collect();
                            #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Block {} not found in database storage (has blocks: {})", block_id, block_ids.join(", ")).into());
                        }
                    } else {
                        let available_dbs: Vec<String> = storage_map.keys().cloned().collect();
                        #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Database {} not found in global storage (available: {})", storage.db_name, available_dbs.join(", ")).into());
                    }
                    None
                });
                
                if let Some(data) = global_data {
                    data
                } else {
                    #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Block {} not found in global storage, returning zeros", block_id).into());
                    vec![0; BLOCK_SIZE]
                }
            } else {
                log::debug!(
                    "Block {} not visible due to commit gating (committed={}, treating as zeroed)",
                    block_id,
                    committed
                );
                #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Block {} not visible due to commit gating, returning zeros", block_id).into());
                vec![0; BLOCK_SIZE]
            };
            
            // Cache for future reads
            storage.cache.insert(block_id, data.clone());
            log::debug!("Block {} cached from global storage (sync)", block_id);
            // Verify checksum only if the block is visible under the commit marker
            if is_visible {
                if let Err(e) = storage.verify_against_stored_checksum(block_id, &data) {
                    log::error!(
                        "Checksum verification failed for block {} (wasm storage): {}",
                        block_id, e.message
                    );
                    return Err(e);
                }
            }
            storage.touch_lru(block_id);
            storage.evict_if_needed();
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

            storage.cache.insert(block_id, data.clone());
            log::debug!("[test] Block {} cached from global storage (sync)", block_id);
            // Verify checksum only if the block is visible under the commit marker
            if is_visible {
                if let Err(e) = storage.verify_against_stored_checksum(block_id, &data) {
                    log::error!(
                        "[test] Checksum verification failed for block {} (test storage): {}",
                        block_id, e.message
                    );
                    return Err(e);
                }
            }
            storage.touch_lru(block_id);
            storage.evict_if_needed();
            return Ok(data);
        }

        // For native non-test, return empty block - will implement file-based storage later
        #[cfg(all(not(target_arch = "wasm32"), not(any(test, debug_assertions))))]
        {
            let data = vec![0; BLOCK_SIZE];
            log::debug!("Block {} not found, returning empty block (sync)", block_id);

            // Cache for future reads
            storage.cache.insert(block_id, data.clone());
            log::debug!("Block {} cached (sync)", block_id);
            // Verify checksum if tracked (typically none for empty native block)
            if let Err(e) = storage.verify_against_stored_checksum(block_id, &data) {
                log::error!(
                    "Checksum verification failed for block {} (native fallback): {}",
                    block_id, e.message
                );
                return Err(e);
            }
            storage.touch_lru(block_id);
            storage.evict_if_needed();
            
            Ok(data)
        }
    }

/// Synchronous block write implementation
pub fn write_block_sync_impl(storage: &mut BlockStorage, block_id: u64, data: Vec<u8>) -> Result<(), DatabaseError> {
    log::debug!("Writing block (sync): {} ({} bytes)", block_id, data.len());
    storage.maybe_auto_sync();
            
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
                        // The previous logic was incorrectly skipping writes when data appeared the same
                        #[cfg(target_arch = "wasm32")]
                    web_sys::console::log_1(&format!("DEBUG: Block {} has committed metadata, allowing write to ensure schema persistence", block_id).into());
                        true  // Always allow writes when there's committed metadata
                    } else {
                        // Check if the new data is richer (has more non-zero bytes) than existing
                        let existing_non_zero = existing.iter().filter(|&&b| b != 0).count();
                        let new_non_zero = data.iter().filter(|&&b| b != 0).count();
                        
                        if new_non_zero > existing_non_zero {
                            #[cfg(target_arch = "wasm32")]
                    web_sys::console::log_1(&format!("DEBUG: Block {} exists but new data is richer ({} vs {} non-zero bytes), allowing overwrite", block_id, new_non_zero, existing_non_zero).into());
                            true
                        } else if new_non_zero < existing_non_zero {
                            #[cfg(target_arch = "wasm32")]
                    web_sys::console::log_1(&format!("DEBUG: Block {} exists and existing data is richer ({} vs {} non-zero bytes), SKIPPING to preserve richer data", block_id, existing_non_zero, new_non_zero).into());
                            false
                        } else {
                            #[cfg(target_arch = "wasm32")]
                    web_sys::console::log_1(&format!("DEBUG: Block {} exists but has no committed metadata, allowing overwrite", block_id).into());
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
                        #[cfg(target_arch = "wasm32")]
                    web_sys::console::log_1(&format!("DEBUG: Block {} has committed metadata in global storage, allowing transactional write", block_id).into());
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
                        if let Some(existing) = db_storage.get(&block_id) {
                            let existing_preview = if existing.len() >= 16 {
                                format!("{:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x}", 
                                    existing[0], existing[1], existing[2], existing[3], existing[4], existing[5], existing[6], existing[7])
                            } else {
                                "short".to_string()
                            };
                            let new_preview = if data.len() >= 16 {
                                format!("{:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x}", 
                                    data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7])
                            } else {
                                "short".to_string()
                            };
                            #[cfg(target_arch = "wasm32")]
                    web_sys::console::log_1(&format!("DEBUG: Overwriting block {} - existing: {}, new: {}", block_id, existing_preview, new_preview).into());
                        }
                        
                        db_storage.insert(block_id, data.clone());
                        #[cfg(target_arch = "wasm32")]
                    web_sys::console::log_1(&format!("DEBUG: Persisted block {} to global storage (new/updated)", block_id).into());
                    });
                }
                
                // Always ensure metadata exists for the block, even if we skipped the write
                vfs_sync::with_global_metadata(|meta| {
                    let mut meta_map = meta.borrow_mut();
                    let db_meta = meta_map.entry(storage.db_name.clone()).or_insert_with(HashMap::new);
                    if !db_meta.contains_key(&block_id) {
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
                        db_meta.insert(block_id, BlockMetadataPersist {
                            checksum,
                            version: 1,  // Start at version 1 so uncommitted data is hidden (commit marker starts at 0)
                            last_modified_ms: 0, // Will be updated during sync
                            algo: ChecksumAlgorithm::CRC32,
                        });
                        #[cfg(target_arch = "wasm32")]
                    web_sys::console::log_1(&format!("DEBUG: Created metadata for block {} with checksum {}", block_id, checksum).into());
                    }
                });
                
                // Also create metadata for native test path
                #[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions), not(feature = "fs_persist")))]
                GLOBAL_METADATA_TEST.with(|meta| {
                    let mut meta_map = meta.borrow_mut();
                    let db_meta = meta_map.entry(storage.db_name.clone()).or_insert_with(HashMap::new);
                    if !db_meta.contains_key(&block_id) {
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
                        db_meta.insert(block_id, BlockMetadataPersist {
                            checksum,
                            version: 1,  // Start at version 1 so uncommitted data is hidden (commit marker starts at 0)
                            last_modified_ms: 0, // Will be updated during sync
                            algo: ChecksumAlgorithm::CRC32,
                        });
                        log::debug!("Created test metadata for block {} with checksum {}", block_id, checksum);
                    }
                });
            }
            
            // Update cache and mark as dirty
            storage.cache.insert(block_id, data.clone());
            {
                let mut dirty = storage.dirty_blocks.lock().unwrap();
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
                let cur = storage.dirty_blocks.lock().unwrap().len();
                if cur >= max_dirty { threshold_reached = true; }
            }
            if let Some(max_bytes) = max_bytes_opt {
                let cur_bytes: usize = {
                    let m = storage.dirty_blocks.lock().unwrap();
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
            
            log::debug!("Block {} marked as dirty (sync)", block_id);
            storage.touch_lru(block_id);
            storage.evict_if_needed();
            Ok(())
}
    