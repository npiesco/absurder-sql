//! Sync operations for BlockStorage
//! This module contains the core sync implementation logic

use crate::types::DatabaseError;
use super::block_storage::BlockStorage;

#[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions), not(feature = "fs_persist")))]
use std::collections::HashMap;
#[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions), not(feature = "fs_persist")))]
use std::sync::atomic::Ordering;
#[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions), not(feature = "fs_persist")))]
use super::metadata::BlockMetadataPersist;

#[cfg(target_arch = "wasm32")]
use std::collections::HashMap;
#[cfg(target_arch = "wasm32")]
use super::metadata::BlockMetadataPersist;

#[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions), not(feature = "fs_persist")))]
use super::block_storage::GLOBAL_METADATA_TEST;

#[cfg(any(target_arch = "wasm32", all(not(target_arch = "wasm32"), any(test, debug_assertions), not(feature = "fs_persist"))))]
use super::vfs_sync;

/// Internal sync implementation shared by sync() and sync_now()
pub fn sync_implementation_impl(storage: &mut BlockStorage) -> Result<(), DatabaseError> {
        #[cfg(target_arch = "wasm32")]
        use wasm_bindgen::JsCast;
        #[cfg(all(not(target_arch = "wasm32"), not(feature = "fs_persist")))]
        let start = std::time::Instant::now();
        
        // Record sync start for observability
        let dirty_count = storage.dirty_blocks.lock().unwrap().len();
        let dirty_bytes = dirty_count * super::block_storage::BLOCK_SIZE;
        storage.observability.record_sync_start(dirty_count, dirty_bytes);
        
        // Invoke sync start callback if set
        #[cfg(not(target_arch = "wasm32"))]
        if let Some(ref callback) = storage.observability.sync_start_callback {
            callback(dirty_count, dirty_bytes);
        }
        
        // Call the existing fs_persist implementation for native builds
        #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
        {
            return storage.fs_persist_sync();
        }
        
        // For native non-fs_persist builds, use simple in-memory sync with commit marker handling
        #[cfg(all(not(target_arch = "wasm32"), not(feature = "fs_persist")))]
        {
            let current_dirty = storage.dirty_blocks.lock().unwrap().len();
            log::info!("Syncing {} dirty blocks (native non-fs_persist)", current_dirty);
            
            let to_persist: Vec<(u64, Vec<u8>)> = {
                let dirty = storage.dirty_blocks.lock().unwrap();
                dirty.iter().map(|(k,v)| (*k, v.clone())).collect()
            };
            let ids: Vec<u64> = to_persist.iter().map(|(k, _)| *k).collect();
            let blocks_synced = ids.len(); // Capture length before moving ids
            
            // Determine next commit version for native test path
            let next_commit: u64 = vfs_sync::with_global_commit_marker(|cm| {
                let cm = cm.borrow();
                let current = cm.get(&storage.db_name).copied().unwrap_or(0);
                current + 1
            });
            
            // Store blocks in global test storage with versioning
            vfs_sync::with_global_storage(|gs| {
                let mut storage_map = gs.borrow_mut();
                let db_storage = storage_map.entry(storage.db_name.clone()).or_insert_with(HashMap::new);
                for (block_id, data) in to_persist {
                    db_storage.insert(block_id, data);
                    log::debug!("Persisted block {} to global storage (native test path)", block_id);
                }
            });
            
            // Store metadata with per-commit versioning
            GLOBAL_METADATA_TEST.with(|meta| {
                let mut meta_map = meta.borrow_mut();
                let db_meta = meta_map.entry(storage.db_name.clone()).or_insert_with(HashMap::new);
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
                        log::debug!("Persisted metadata for block {} in native test path", block_id);
                    }
                }
            });
            
            // Atomically advance the commit marker after all data and metadata are persisted
            vfs_sync::with_global_commit_marker(|cm| {
                let mut cm_map = cm.borrow_mut();
                cm_map.insert(storage.db_name.clone(), next_commit);
                log::debug!("Advanced commit marker for {} to {}", storage.db_name, next_commit);
            });
            
            // Clear dirty blocks
            {
                let mut dirty = storage.dirty_blocks.lock().unwrap();
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
            let current_dirty = storage.dirty_blocks.lock().unwrap().len();
            log::info!("Syncing {} dirty blocks (WASM)", current_dirty);
            
            // For WASM, persist dirty blocks to global storage
            let to_persist: Vec<(u64, Vec<u8>)> = {
                let dirty = storage.dirty_blocks.lock().unwrap();
                dirty.iter().map(|(k,v)| (*k, v.clone())).collect()
            };
            let ids: Vec<u64> = to_persist.iter().map(|(k, _)| *k).collect();
            // Determine next commit version so that all metadata written in this sync share the same version
            let next_commit: u64 = vfs_sync::with_global_commit_marker(|cm| {
                let cm = cm.borrow();
                let current = cm.get(&storage.db_name).copied().unwrap_or(0);
                current + 1
            });
            vfs_sync::with_global_storage(|gs| {
                let mut storage_map = gs.borrow_mut();
                let db_storage = storage_map.entry(storage.db_name.clone()).or_insert_with(HashMap::new);
                for (block_id, data) in &to_persist {
                    // Check if block already exists in global storage with committed data
                    let should_update = if let Some(existing) = db_storage.get(block_id) {
                        if existing != data {
                            // Check if existing data has committed metadata (version > 0)
                            let has_committed_metadata = vfs_sync::with_global_metadata(|meta| {
                                let meta_map = meta.borrow();
                                if let Some(db_meta) = meta_map.get(&storage.db_name) {
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
                        log::debug!("Persisted block {} to global storage", block_id);
                    }
                }
            });
            // Persist corresponding metadata entries
            vfs_sync::with_global_metadata(|meta| {
                let mut meta_map = meta.borrow_mut();
                let db_meta = meta_map.entry(storage.db_name.clone()).or_insert_with(HashMap::new);
                for block_id in ids {
                    if let Some(checksum) = storage.checksum_manager.get_checksum(block_id) {
                        // Use the per-commit version so entries remain invisible until the commit marker advances
                        let version = next_commit as u32;
                        db_meta.insert(
                            block_id,
                            BlockMetadataPersist {
                                checksum,
                                last_modified_ms: BlockStorage::now_millis(),
                                version,
                                algo: storage.checksum_manager.get_algorithm(block_id),
                            },
                        );
                        log::debug!("Persisted metadata for block {}", block_id);
                    }
                }
            });
            // Atomically advance the commit marker after all data and metadata are persisted
            vfs_sync::with_global_commit_marker(|cm| {
                let mut cm_map = cm.borrow_mut();
                cm_map.insert(storage.db_name.clone(), next_commit);
            });
            
            // Spawn async IndexedDB persistence (fire and forget for sync compatibility)
            let db_name = storage.db_name.clone();
            wasm_bindgen_futures::spawn_local(async move {
                let window = web_sys::window().unwrap();
                let idb_factory = window.indexed_db().unwrap().unwrap();
                let open_req = idb_factory.open_with_u32("block_storage", 2).unwrap();
                
                // Set up upgrade handler to create object stores if needed
                let upgrade_handler = js_sys::Function::new_no_args(&format!(
                    "
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains('blocks')) {{
                        db.createObjectStore('blocks');
                    }}
                    if (!db.objectStoreNames.contains('metadata')) {{
                        db.createObjectStore('metadata');
                    }}
                    "
                ));
                open_req.set_onupgradeneeded(Some(&upgrade_handler));
                
                // Use event-based approach for opening database
                let (tx, rx) = futures::channel::oneshot::channel();
                let tx = std::rc::Rc::new(std::cell::RefCell::new(Some(tx)));
                
                let success_tx = tx.clone();
                let success_callback = wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
                    if let Some(tx) = success_tx.borrow_mut().take() {
                        let target = event.target().unwrap();
                        let request: web_sys::IdbOpenDbRequest = target.unchecked_into();
                        let result = request.result().unwrap();
                        let _ = tx.send(Ok(result));
                    }
                }) as Box<dyn FnMut(_)>);
                
                let error_tx = tx.clone();
                let error_callback = wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
                    if let Some(tx) = error_tx.borrow_mut().take() {
                        let _ = tx.send(Err(format!("IndexedDB open failed: {:?}", event)));
                    }
                }) as Box<dyn FnMut(_)>);
                
                open_req.set_onsuccess(Some(success_callback.as_ref().unchecked_ref()));
                open_req.set_onerror(Some(error_callback.as_ref().unchecked_ref()));
                
                let db_result = rx.await;
                
                // Keep closures alive
                success_callback.forget();
                error_callback.forget();
                
                match db_result {
                    Ok(Ok(db_value)) => {
                        if let Ok(db) = db_value.dyn_into::<web_sys::IdbDatabase>() {
                            // Start transaction for both blocks and metadata
                            let store_names = js_sys::Array::new();
                            store_names.push(&wasm_bindgen::JsValue::from_str("blocks"));
                            store_names.push(&wasm_bindgen::JsValue::from_str("metadata"));
                            
                            let transaction = db.transaction_with_str_sequence_and_mode(
                                &store_names,
                                web_sys::IdbTransactionMode::Readwrite
                            ).unwrap();
                            
                            let blocks_store = transaction.object_store("blocks").unwrap();
                            let metadata_store = transaction.object_store("metadata").unwrap();
                            
                            // Persist all blocks
                            for (block_id, data) in &to_persist {
                                let key = wasm_bindgen::JsValue::from_str(&format!("{}_{}", db_name, block_id));
                                let value = js_sys::Uint8Array::from(&data[..]);
                                blocks_store.put_with_key(&value, &key).unwrap();
                            }
                            
                            // Persist commit marker
                            let commit_key = wasm_bindgen::JsValue::from_str(&format!("{}_commit_marker", db_name));
                            let commit_value = wasm_bindgen::JsValue::from_f64(next_commit as f64);
                            metadata_store.put_with_key(&commit_value, &commit_key).unwrap();
                            
                            // Use event-based approach for transaction completion
                            let (tx_tx, tx_rx) = futures::channel::oneshot::channel();
                            let tx_tx = std::rc::Rc::new(std::cell::RefCell::new(Some(tx_tx)));
                            
                            let tx_complete_tx = tx_tx.clone();
                            let tx_complete_callback = wasm_bindgen::closure::Closure::wrap(Box::new(move |_event: web_sys::Event| {
                                if let Some(tx) = tx_complete_tx.borrow_mut().take() {
                                    let _ = tx.send(Ok(()));
                                }
                            }) as Box<dyn FnMut(_)>);
                            
                            let tx_error_tx = tx_tx.clone();
                            let tx_error_callback = wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
                                if let Some(tx) = tx_error_tx.borrow_mut().take() {
                                    let _ = tx.send(Err(format!("Transaction failed: {:?}", event)));
                                }
                            }) as Box<dyn FnMut(_)>);
                            
                            transaction.set_oncomplete(Some(tx_complete_callback.as_ref().unchecked_ref()));
                            transaction.set_onerror(Some(tx_error_callback.as_ref().unchecked_ref()));
                            
                            let _ = tx_rx.await;
                            
                            // Keep closures alive
                            tx_complete_callback.forget();
                            tx_error_callback.forget();
                        }
                    }
                    _ => {}
                    // Silently ignore errors in background persistence
                }
            });
            // Clear dirty blocks after successful persistence
            {
                let mut dirty = storage.dirty_blocks.lock().unwrap();
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
