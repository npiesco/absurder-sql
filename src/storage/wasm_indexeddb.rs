//! WASM IndexedDB operations extracted from BlockStorage
//! This module contains WASM-specific IndexedDB functionality

#[cfg(target_arch = "wasm32")]
use crate::types::DatabaseError;
#[cfg(target_arch = "wasm32")]
use super::{vfs_sync, BlockStorage};
#[cfg(target_arch = "wasm32")]
use super::metadata::{BlockMetadataPersist, ChecksumAlgorithm};

/// Perform IndexedDB recovery scan to detect and handle incomplete transactions
#[cfg(target_arch = "wasm32")]
pub async fn perform_indexeddb_recovery_scan(db_name: &str) -> Result<bool, DatabaseError> {
    web_sys::console::log_1(&format!("DEBUG: Starting IndexedDB recovery scan for {}", db_name).into());
    
    // For now, implement a simple recovery check
    // TODO: Add more sophisticated recovery logic later
    
    // Check if we have any existing commit marker in global state
    let has_existing_marker = vfs_sync::with_global_commit_marker(|cm| {
        cm.borrow().contains_key(db_name)
    });
    
    if has_existing_marker {
        web_sys::console::log_1(&format!("DEBUG: Recovery scan - found existing commit marker for {}", db_name).into());
        return Ok(true);
    }
    
    web_sys::console::log_1(&format!("DEBUG: Recovery scan - no existing state found for {}", db_name).into());
    Ok(false)
}

/// Restore BlockStorage state from IndexedDB
#[cfg(target_arch = "wasm32")]
pub async fn restore_from_indexeddb(db_name: &str) -> bool {
    use wasm_bindgen::JsValue;
    use wasm_bindgen::JsCast;
    
    #[cfg(target_arch = "wasm32")]
    web_sys::console::log_1(&format!("DEBUG: Starting restoration for {}", db_name).into());
    
    // First check if commit marker already exists in global state (cross-instance sharing)
    let existing_marker = vfs_sync::with_global_commit_marker(|cm| {
        cm.borrow().get(db_name).copied()
    });
    
    if let Some(marker) = existing_marker {
        #[cfg(target_arch = "wasm32")]
        web_sys::console::log_1(&format!("DEBUG: Found existing commit marker {} in global state for {}", marker, db_name).into());
        return true;
    }
    
    #[cfg(target_arch = "wasm32")]
    web_sys::console::log_1(&format!("DEBUG: No existing commit marker found, trying IndexedDB restoration for {}", db_name).into());
    
    let window = web_sys::window().unwrap();
    let idb_factory = window.indexed_db().unwrap().unwrap();
    
    // Try to open existing database
    let open_req = idb_factory.open_with_u32("sqlite_storage", 1).unwrap();
    
    // Use proper event-based approach instead of Promise conversion
    let (tx, rx) = futures::channel::oneshot::channel();
    let tx = std::rc::Rc::new(std::cell::RefCell::new(Some(tx)));
    
    // Success callback
    let success_tx = tx.clone();
    let success_callback = wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
        if let Some(tx) = success_tx.borrow_mut().take() {
            let target = event.target().unwrap();
            let request: web_sys::IdbOpenDbRequest = target.unchecked_into();
            let result = request.result().unwrap();
            let _ = tx.send(Ok(result));
        }
    }) as Box<dyn FnMut(_)>);
    
    // Error callback
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
            #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: Successfully opened IndexedDB").into());
            if let Ok(db) = db_value.dyn_into::<web_sys::IdbDatabase>() {
                // Check if metadata store exists
                let store_names = db.object_store_names();
                #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: Available stores: {:?}", store_names.length()).into());
                
                if store_names.contains("metadata") {
                    #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: Found metadata store").into());
                    let transaction = db.transaction_with_str("metadata").unwrap();
                    let store = transaction.object_store("metadata").unwrap();
                    let commit_key = format!("{}:commit_marker", db_name);
                    
                    #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: Looking for key: {}", commit_key).into());
                    let get_req = store.get(&JsValue::from_str(&commit_key)).unwrap();
                    
                    // Use event-based approach for get request too
                    let (get_tx, get_rx) = futures::channel::oneshot::channel();
                    let get_tx = std::rc::Rc::new(std::cell::RefCell::new(Some(get_tx)));
                    
                    let get_success_tx = get_tx.clone();
                    let get_success_callback = wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
                        if let Some(tx) = get_success_tx.borrow_mut().take() {
                            let target = event.target().unwrap();
                            let request: web_sys::IdbRequest = target.unchecked_into();
                            let result = request.result().unwrap();
                            let _ = tx.send(Ok(result));
                        }
                    }) as Box<dyn FnMut(_)>);
                    
                    let get_error_tx = get_tx.clone();
                    let get_error_callback = wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
                        if let Some(tx) = get_error_tx.borrow_mut().take() {
                            let _ = tx.send(Err(format!("Get request failed: {:?}", event)));
                        }
                    }) as Box<dyn FnMut(_)>);
                    
                    get_req.set_onsuccess(Some(get_success_callback.as_ref().unchecked_ref()));
                    get_req.set_onerror(Some(get_error_callback.as_ref().unchecked_ref()));
                    
                    let get_result = get_rx.await;
                    
                    // Keep closures alive
                    get_success_callback.forget();
                    get_error_callback.forget();
                    
                    match get_result {
                        Ok(Ok(result)) => {
                            #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: Get request succeeded").into());
                            if !result.is_undefined() && !result.is_null() {
                                #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: Result is not null/undefined").into());
                                if let Some(commit_marker) = result.as_f64() {
                                    let commit_u64 = commit_marker as u64;
                                    vfs_sync::with_global_commit_marker(|cm| {
                                        cm.borrow_mut().insert(db_name.to_string(), commit_u64);
                                    });
                                    #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: Restored commit marker {} for {}", commit_u64, db_name).into());
                                    return true;
                                } else {
                                    #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: Result is not a number: {:?}", result).into());
                                }
                            } else {
                                #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: Result is null or undefined").into());
                            }
                        }
                        Ok(Err(e)) => {
                            #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: Get request failed: {}", e).into());
                        }
                        Err(_) => {
                            #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: Get request channel failed").into());
                        }
                    }
                } else {
                    #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: No metadata store found").into());
                }
            } else {
                #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: Failed to cast to IdbDatabase").into());
            }
        }
        Ok(Err(e)) => {
            #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: Failed to open IndexedDB: {}", e).into());
        }
        Err(_) => {
            #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: IndexedDB open channel failed").into());
        }
    }
    
    #[cfg(target_arch = "wasm32")]
    web_sys::console::log_1(&format!("DEBUG: No commit marker found for {} in IndexedDB", db_name).into());
    false
}

/// Event-based async IndexedDB persistence
#[cfg(target_arch = "wasm32")]
pub async fn persist_to_indexeddb_event_based(db_name: &str, blocks: Vec<(u64, Vec<u8>)>, metadata: Vec<(u64, u64)>, commit_marker: u64) -> Result<(), DatabaseError> {
    use wasm_bindgen::JsCast;
    use wasm_bindgen::closure::Closure;
    use futures::channel::oneshot;
    
    let window = web_sys::window().unwrap();
    let idb_factory = window.indexed_db().unwrap().unwrap();
    let open_req = idb_factory.open_with_u32("sqlite_storage", 1).unwrap();
    
    // Set up upgrade handler
    let upgrade_closure = Closure::wrap(Box::new(move |event: web_sys::Event| {
        let target = event.target().unwrap();
        let db: web_sys::IdbDatabase = target.dyn_into().unwrap();
        if !db.object_store_names().contains("blocks") {
            db.create_object_store("blocks").unwrap();
        }
        if !db.object_store_names().contains("metadata") {
            db.create_object_store("metadata").unwrap();
        }
    }) as Box<dyn FnMut(_)>);
    open_req.set_onupgradeneeded(Some(upgrade_closure.as_ref().unchecked_ref()));
    upgrade_closure.forget();
    
    // Wait for database to open
    let (open_tx, open_rx) = oneshot::channel();
    let open_tx = std::rc::Rc::new(std::cell::RefCell::new(Some(open_tx)));
    
    let success_closure = {
        let open_tx = open_tx.clone();
        Closure::wrap(Box::new(move |event: web_sys::Event| {
            if let Some(sender) = open_tx.borrow_mut().take() {
                let target = event.target().unwrap();
                let db: web_sys::IdbDatabase = target.dyn_into().unwrap();
                let _ = sender.send(Ok(db));
            }
        }) as Box<dyn FnMut(_)>)
    };
    
    let error_closure = {
        let open_tx = open_tx.clone();
        Closure::wrap(Box::new(move |_event: web_sys::Event| {
            if let Some(sender) = open_tx.borrow_mut().take() {
                let _ = sender.send(Err("Failed to open IndexedDB".to_string()));
            }
        }) as Box<dyn FnMut(_)>)
    };
    
    open_req.set_onsuccess(Some(success_closure.as_ref().unchecked_ref()));
    open_req.set_onerror(Some(error_closure.as_ref().unchecked_ref()));
    success_closure.forget();
    error_closure.forget();
    
    let db = match open_rx.await {
        Ok(Ok(db)) => db,
        Ok(Err(e)) => return Err(DatabaseError::new("INDEXEDDB_ERROR", &e)),
        Err(_) => return Err(DatabaseError::new("INDEXEDDB_ERROR", "Channel error")),
    };
    
    // Start transaction
    let store_names = js_sys::Array::new();
    store_names.push(&"blocks".into());
    store_names.push(&"metadata".into());
    let transaction = db.transaction_with_str_sequence_and_mode(&store_names, web_sys::IdbTransactionMode::Readwrite).unwrap();
    
    let blocks_store = transaction.object_store("blocks").unwrap();
    let metadata_store = transaction.object_store("metadata").unwrap();
    
    // Store blocks with idempotent keys: (db_name, block_id, version)
    for (block_id, block_data) in &blocks {
        // Find the corresponding version for this block_id
        if let Some((_, version)) = metadata.iter().find(|(id, _)| *id == *block_id) {
            let key = format!("{}:{}:{}", db_name, block_id, version);
            let value = js_sys::Uint8Array::from(&block_data[..]);
            #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: Storing block with idempotent key: {}", key).into());
            let _ = blocks_store.put_with_key(&value, &key.into());
        }
    }
    
    // Store metadata with idempotent keys: (db_name, block_id, version)
    for (block_id, version) in metadata {
        let key = format!("{}:{}:{}", db_name, block_id, version);
        let value = js_sys::Number::from(version as f64);
        #[cfg(target_arch = "wasm32")]
        web_sys::console::log_1(&format!("DEBUG: Storing metadata with idempotent key: {}", key).into());
        let _ = metadata_store.put_with_key(&value, &key.into());
    }
    
    // Store commit marker
    let commit_key = format!("{}:commit_marker", db_name);
    let commit_value = js_sys::Number::from(commit_marker as f64);
    let _ = metadata_store.put_with_key(&commit_value, &commit_key.into());
    
    // Wait for transaction to complete
    let (tx_tx, tx_rx) = oneshot::channel();
    let tx_tx = std::rc::Rc::new(std::cell::RefCell::new(Some(tx_tx)));
    
    let complete_closure = {
        let tx_tx = tx_tx.clone();
        Closure::wrap(Box::new(move |_event: web_sys::Event| {
            if let Some(sender) = tx_tx.borrow_mut().take() {
                let _ = sender.send(Ok(()));
            }
        }) as Box<dyn FnMut(_)>)
    };
    
    let tx_error_closure = {
        let tx_tx = tx_tx.clone();
        Closure::wrap(Box::new(move |_event: web_sys::Event| {
            if let Some(sender) = tx_tx.borrow_mut().take() {
                let _ = sender.send(Err("Transaction failed".to_string()));
            }
        }) as Box<dyn FnMut(_)>)
    };
    
    transaction.set_oncomplete(Some(complete_closure.as_ref().unchecked_ref()));
    transaction.set_onerror(Some(tx_error_closure.as_ref().unchecked_ref()));
    complete_closure.forget();
    tx_error_closure.forget();
    
    match tx_rx.await {
        Ok(Ok(())) => {},
        Ok(Err(e)) => return Err(DatabaseError::new("INDEXEDDB_ERROR", &e)),
        Err(_) => return Err(DatabaseError::new("INDEXEDDB_ERROR", "Channel error")),
    }
    web_sys::console::log_1(&"DEBUG: IndexedDB persistence completed successfully".into());
    
    Ok(())
}

/// Async version of sync for WASM that properly awaits IndexedDB persistence
#[cfg(target_arch = "wasm32")]
pub async fn sync_async(storage: &mut BlockStorage) -> Result<(), DatabaseError> {
    web_sys::console::log_1(&"DEBUG: Using ASYNC sync_async method".into());
    // Get current commit marker
    let current_commit = vfs_sync::with_global_commit_marker(|cm| {
        let cm = cm.borrow();
        cm.get(&storage.db_name).copied().unwrap_or(0)
    });
    
    let next_commit = current_commit + 1;
    web_sys::console::log_1(&format!("DEBUG: Current commit marker for {}: {}", storage.db_name, current_commit).into());
    web_sys::console::log_1(&format!("DEBUG: Next commit marker for {}: {}", storage.db_name, next_commit).into());
    
    // Collect blocks to persist with commit marker gating and richer cache data logic
    let mut to_persist = Vec::new();
    let mut metadata_to_persist = Vec::new();
    
    for (&block_id, block_data) in &storage.cache {
        let should_update = vfs_sync::with_global_storage(|storage_global| {
            let storage_global = storage_global.borrow();
            if let Some(db_storage) = storage_global.get(&storage.db_name) {
                if let Some(existing_data) = db_storage.get(&block_id) {
                    // Check if cache has richer data (more non-zero bytes)
                    let existing_non_zero = existing_data.iter().filter(|&&b| b != 0).count();
                    let cache_non_zero = block_data.iter().filter(|&&b| b != 0).count();
                    
                    if cache_non_zero > existing_non_zero {
                        #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!(
                            "DEBUG: SYNC updating committed block {} with richer cache data - existing: {}, cache: {}",
                            block_id,
                            existing_data.iter().take(8).map(|b| format!("{:02x}", b)).collect::<Vec<_>>().join(" "),
                            block_data.iter().take(8).map(|b| format!("{:02x}", b)).collect::<Vec<_>>().join(" ")
                        ).into());
                        true
                    } else {
                        #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!(
                            "DEBUG: SYNC preserving committed block {} - existing: {}, cache: {} - SKIPPING",
                            block_id,
                            existing_data.iter().take(8).map(|b| format!("{:02x}", b)).collect::<Vec<_>>().join(" "),
                            block_data.iter().take(8).map(|b| format!("{:02x}", b)).collect::<Vec<_>>().join(" ")
                        ).into());
                        false
                    }
                } else {
                    true // New block
                }
            } else {
                true // New database
            }
        });
        
        if should_update {
            to_persist.push((block_id, block_data.clone()));
        }
        
        // ALWAYS update metadata when commit marker advances, regardless of data changes
        metadata_to_persist.push((block_id, next_commit));
        #[cfg(target_arch = "wasm32")]
        web_sys::console::log_1(&format!("DEBUG: SYNC updating metadata for block {} to version {}", block_id, next_commit).into());
    }
    
    // Update global storage
    vfs_sync::with_global_storage(|storage_global| {
        let mut storage_global = storage_global.borrow_mut();
        let db_storage = storage_global.entry(storage.db_name.clone()).or_insert_with(std::collections::HashMap::new);
        for (block_id, block_data) in &to_persist {
            db_storage.insert(*block_id, block_data.clone());
        }
    });
    
    // Update global metadata
    vfs_sync::with_global_metadata(|metadata| {
        let mut metadata = metadata.borrow_mut();
        let db_metadata = metadata.entry(storage.db_name.clone()).or_insert_with(std::collections::HashMap::new);
        for (block_id, version) in &metadata_to_persist {
            db_metadata.insert(*block_id, BlockMetadataPersist {
                version: *version as u32,
                checksum: 0,
                algo: ChecksumAlgorithm::FastHash,
                last_modified_ms: js_sys::Date::now() as u64,
            });
        }
    });
    
    // Update commit marker AFTER data and metadata are persisted
    vfs_sync::with_global_commit_marker(|cm| {
        let mut cm_map = cm.borrow_mut();
        cm_map.insert(storage.db_name.clone(), next_commit);
    });
    
    // Perform IndexedDB persistence with proper event-based waiting
    if !to_persist.is_empty() {
        #[cfg(target_arch = "wasm32")]
        web_sys::console::log_1(&format!("DEBUG: Awaiting IndexedDB persistence for {} blocks", to_persist.len()).into());
        persist_to_indexeddb_event_based(&storage.db_name, to_persist, metadata_to_persist, next_commit).await?;
    }
    
    // Clear dirty blocks
    {
        let mut dirty = storage.dirty_blocks.lock().unwrap();
        dirty.clear();
    }
    
    Ok(())
}