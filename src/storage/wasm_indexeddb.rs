//! WASM IndexedDB operations extracted from BlockStorage
//! This module contains WASM-specific IndexedDB functionality

#[cfg(target_arch = "wasm32")]
use crate::types::DatabaseError;
#[cfg(target_arch = "wasm32")]
use super::{vfs_sync, BlockStorage};
#[cfg(target_arch = "wasm32")]
use super::metadata::{BlockMetadataPersist, ChecksumAlgorithm};
#[cfg(target_arch = "wasm32")]
use std::collections::HashMap;

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
    
    // Check if blocks are already loaded (regardless of commit marker)
    let has_blocks = vfs_sync::with_global_storage(|gs| {
        gs.borrow().get(db_name).map(|db_storage| !db_storage.is_empty()).unwrap_or(false)
    });
    
    if let Some(_marker) = existing_marker {
        #[cfg(target_arch = "wasm32")]
        web_sys::console::log_1(&format!("DEBUG: Found existing commit marker in global state for {}", db_name).into());
        
        if has_blocks {
            #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: Blocks already loaded, skipping restoration").into());
            return true;
        }
        
        #[cfg(target_arch = "wasm32")]
        web_sys::console::log_1(&format!("DEBUG: Commit marker exists but no blocks - opening IndexedDB to restore blocks").into());
        
        // Open IndexedDB to restore blocks
        let window = web_sys::window().unwrap();
        let idb_factory = window.indexed_db().unwrap().unwrap();
        let open_req = idb_factory.open_with_u32("block_storage", 2).unwrap();
        
        let (tx, rx) = futures::channel::oneshot::channel::<Result<web_sys::IdbDatabase, String>>();
        let tx = std::rc::Rc::new(std::cell::RefCell::new(Some(tx)));
        
        let success_tx = tx.clone();
        let success_callback = wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
            if let Some(tx) = success_tx.borrow_mut().take() {
                let target = event.target().unwrap();
                let request: web_sys::IdbOpenDbRequest = target.unchecked_into();
                let result = request.result().unwrap();
                let db: web_sys::IdbDatabase = result.unchecked_into();
                let _ = tx.send(Ok(db));
            }
        }) as Box<dyn FnMut(_)>);
        
        open_req.set_onsuccess(Some(success_callback.as_ref().unchecked_ref()));
        success_callback.forget();
        
        if let Ok(Ok(db)) = rx.await {
            if let Err(e) = restore_blocks_from_indexeddb(&db, db_name).await {
                #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Failed to restore blocks: {:?}", e).into());
                return false;
            }
            return true;
        }
        
        return false;
    } else {
        #[cfg(target_arch = "wasm32")]
        web_sys::console::log_1(&format!("DEBUG: No existing commit marker found, trying IndexedDB restoration for {}", db_name).into());
    }
    
    let window = web_sys::window().unwrap();
    let idb_factory = window.indexed_db().unwrap().unwrap();
    
    // Try to open existing database
    let open_req = idb_factory.open_with_u32("block_storage", 2).unwrap();
    
    // Add upgrade handler to create object stores if needed
    let upgrade_closure = wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
        web_sys::console::log_1(&"DEBUG: Upgrade handler called in restore_from_indexeddb".into());
        let target = event.target().unwrap();
        let request: web_sys::IdbOpenDbRequest = target.unchecked_into();
        let result = request.result().unwrap();
        let db: web_sys::IdbDatabase = result.unchecked_into();
        
        if !db.object_store_names().contains("blocks") {
            let _ = db.create_object_store("blocks");
            web_sys::console::log_1(&"DEBUG: Created blocks store in restore upgrade".into());
        }
        if !db.object_store_names().contains("metadata") {
            let _ = db.create_object_store("metadata");
            web_sys::console::log_1(&"DEBUG: Created metadata store in restore upgrade".into());
        }
    }) as Box<dyn FnMut(_)>);
    open_req.set_onupgradeneeded(Some(upgrade_closure.as_ref().unchecked_ref()));
    upgrade_closure.forget();
    
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
                                    
                                    // NOW RESTORE THE ACTUAL BLOCKS FROM INDEXEDDB
                                    #[cfg(target_arch = "wasm32")]
                                    web_sys::console::log_1(&format!("DEBUG: About to call restore_blocks_from_indexeddb").into());
                                    
                                    match restore_blocks_from_indexeddb(&db, db_name).await {
                                        Ok(_) => {
                                            #[cfg(target_arch = "wasm32")]
                                            web_sys::console::log_1(&format!("DEBUG: Successfully restored blocks").into());
                                        }
                                        Err(e) => {
                                            #[cfg(target_arch = "wasm32")]
                                            web_sys::console::log_1(&format!("DEBUG: Failed to restore blocks: {:?}", e).into());
                                            return false;
                                        }
                                    }
                                    
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

/// Restore blocks from IndexedDB into global storage
#[cfg(target_arch = "wasm32")]
async fn restore_blocks_from_indexeddb(db: &web_sys::IdbDatabase, db_name: &str) -> Result<(), DatabaseError> {
    use wasm_bindgen::JsValue;
    use wasm_bindgen::JsCast;
    
    web_sys::console::log_1(&format!("DEBUG: Restoring blocks for {} from IndexedDB", db_name).into());
    
    // Create transaction for both blocks and metadata
    let store_names = js_sys::Array::new();
    store_names.push(&JsValue::from_str("blocks"));
    store_names.push(&JsValue::from_str("metadata"));
    
    let transaction = db.transaction_with_str_sequence(&store_names)
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to create transaction"))?;
    
    let blocks_store = transaction.object_store("blocks")
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to get blocks store"))?;
    
    let _metadata_store = transaction.object_store("metadata")
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to get metadata store"))?;
    
    // Get all blocks for this database (keys start with "db_name:")
    let key_range = web_sys::IdbKeyRange::bound(
        &JsValue::from_str(&format!("{}:", db_name)),
        &JsValue::from_str(&format!("{}:\u{FFFF}", db_name))
    ).map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to create key range"))?;
    
    let blocks_cursor_req = blocks_store.open_cursor_with_range(&key_range)
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to open blocks cursor"))?;
    
    // Use event-based approach to iterate cursor
    let (tx, rx) = futures::channel::oneshot::channel::<Result<(), String>>();
    let tx = std::rc::Rc::new(std::cell::RefCell::new(Some(tx)));
    let blocks_data = std::rc::Rc::new(std::cell::RefCell::new(Vec::new()));
    
    let blocks_data_clone = blocks_data.clone();
    let tx_clone = tx.clone();
    let success_closure = wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
        let target = event.target().unwrap();
        let request: web_sys::IdbRequest = target.unchecked_into();
        let result = request.result().unwrap();
        
        if !result.is_null() {
            let cursor: web_sys::IdbCursorWithValue = result.unchecked_into();
            let key = cursor.key().unwrap().as_string().unwrap();
            let value = cursor.value().unwrap();
            
            // Parse key: "db_name:block_id:checksum"
            let parts: Vec<&str> = key.split(':').collect();
            if parts.len() >= 2 {
                if let Ok(block_id) = parts[1].parse::<u64>() {
                    // Get the block data (Uint8Array)
                    if let Ok(array) = value.dyn_into::<js_sys::Uint8Array>() {
                        let mut data = vec![0u8; array.length() as usize];
                        array.copy_to(&mut data);
                        blocks_data_clone.borrow_mut().push((block_id, data));
                    }
                }
            }
            
            // Continue to next
            let _ = cursor.continue_();
        } else {
            // Done iterating
            if let Some(sender) = tx_clone.borrow_mut().take() {
                let _ = sender.send(Ok(()));
            }
        }
    }) as Box<dyn FnMut(_)>);
    
    blocks_cursor_req.set_onsuccess(Some(success_closure.as_ref().unchecked_ref()));
    success_closure.forget();
    
    // Wait for cursor iteration to complete
    let _ = rx.await;
    
    // Now restore blocks to global storage
    let restored_blocks = blocks_data.borrow().clone();
    web_sys::console::log_1(&format!("DEBUG: Restored {} blocks from IndexedDB", restored_blocks.len()).into());
    
    for (block_id, data) in restored_blocks {
        vfs_sync::with_global_storage(|gs| {
            let mut storage_map = gs.borrow_mut();
            let db_storage = storage_map.entry(db_name.to_string()).or_insert_with(HashMap::new);
            db_storage.insert(block_id, data.clone());
        });
        
        // Also restore metadata
        // TODO: Restore metadata from metadata store similarly
    }
    
    web_sys::console::log_1(&format!("DEBUG: Successfully restored blocks for {}", db_name).into());
    Ok(())
}

/// Event-based async IndexedDB persistence
#[cfg(target_arch = "wasm32")]
pub async fn persist_to_indexeddb_event_based(db_name: &str, blocks: Vec<(u64, Vec<u8>)>, metadata: Vec<(u64, u64)>, commit_marker: u64) -> Result<(), DatabaseError> {
    use wasm_bindgen::JsCast;
    use wasm_bindgen::closure::Closure;
    use futures::channel::oneshot;
    
    web_sys::console::log_1(&"DEBUG: persist_to_indexeddb_event_based starting".into());
    
    let window = web_sys::window().unwrap();
    let idb_factory = window.indexed_db().unwrap().unwrap();
    web_sys::console::log_1(&"DEBUG: Got IndexedDB factory".into());
    
    let open_req = idb_factory.open_with_u32("block_storage", 2).unwrap();
    web_sys::console::log_1(&"DEBUG: Created open request for version 2".into());
    
    // Set up upgrade handler
    let upgrade_closure = Closure::wrap(Box::new(move |event: web_sys::Event| {
        web_sys::console::log_1(&"DEBUG: IndexedDB upgrade handler called".into());
        
        match (|| -> Result<(), Box<dyn std::error::Error>> {
            let target = event.target().ok_or("No event target")?;
            web_sys::console::log_1(&"DEBUG: Got event target in upgrade handler".into());
            
            let request: web_sys::IdbOpenDbRequest = target.dyn_into().map_err(|_| "Failed to cast to IdbOpenDbRequest")?;
            web_sys::console::log_1(&"DEBUG: Cast to IdbOpenDbRequest in upgrade handler".into());
            
            let result = request.result().map_err(|_| "Failed to get result from request")?;
            web_sys::console::log_1(&"DEBUG: Got result from request in upgrade handler".into());
            
            let db: web_sys::IdbDatabase = result.dyn_into().map_err(|_| "Failed to cast result to IdbDatabase")?;
            web_sys::console::log_1(&"DEBUG: Cast result to IdbDatabase in upgrade handler".into());
            
            if !db.object_store_names().contains("blocks") {
                db.create_object_store("blocks").map_err(|_| "Failed to create blocks store")?;
                web_sys::console::log_1(&"DEBUG: Created blocks object store".into());
            }
            if !db.object_store_names().contains("metadata") {
                db.create_object_store("metadata").map_err(|_| "Failed to create metadata store")?;
                web_sys::console::log_1(&"DEBUG: Created metadata object store".into());
            }
            
            web_sys::console::log_1(&"DEBUG: Upgrade handler completed successfully".into());
            Ok(())
        })() {
            Ok(_) => {},
            Err(e) => {
                web_sys::console::log_1(&format!("DEBUG: Upgrade handler error: {}", e).into());
            }
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
            web_sys::console::log_1(&"DEBUG: IndexedDB open success handler called".into());
            if let Some(sender) = open_tx.borrow_mut().take() {
                web_sys::console::log_1(&"DEBUG: Got sender from RefCell".into());
                let target = event.target().unwrap();
                web_sys::console::log_1(&"DEBUG: Got event target".into());
                let request: web_sys::IdbOpenDbRequest = target.dyn_into().unwrap();
                web_sys::console::log_1(&"DEBUG: Cast to IdbOpenDbRequest".into());
                let result = request.result().unwrap();
                web_sys::console::log_1(&"DEBUG: Got result from request".into());
                let db: web_sys::IdbDatabase = result.dyn_into().unwrap();
                web_sys::console::log_1(&"DEBUG: Cast result to IdbDatabase".into());
                web_sys::console::log_1(&"DEBUG: Sending database to channel".into());
                let send_result = sender.send(Ok(db));
                web_sys::console::log_1(&format!("DEBUG: Channel send result: {:?}", send_result.is_ok()).into());
            } else {
                web_sys::console::log_1(&"DEBUG: No sender available in RefCell".into());
            }
        }) as Box<dyn FnMut(_)>)
    };
    
    let error_closure = {
        let open_tx = open_tx.clone();
        Closure::wrap(Box::new(move |_event: web_sys::Event| {
            web_sys::console::log_1(&"DEBUG: IndexedDB open error handler called".into());
            if let Some(sender) = open_tx.borrow_mut().take() {
                let _ = sender.send(Err("Failed to open IndexedDB".to_string()));
            }
        }) as Box<dyn FnMut(_)>)
    };
    
    open_req.set_onsuccess(Some(success_closure.as_ref().unchecked_ref()));
    open_req.set_onerror(Some(error_closure.as_ref().unchecked_ref()));
    success_closure.forget();
    error_closure.forget();
    
    web_sys::console::log_1(&"DEBUG: About to await open_rx channel".into());
    let db = match open_rx.await {
        Ok(Ok(db)) => {
            web_sys::console::log_1(&"DEBUG: Successfully received database from channel".into());
            db
        },
        Ok(Err(e)) => {
            web_sys::console::log_1(&format!("DEBUG: Database open error: {}", e).into());
            return Err(DatabaseError::new("INDEXEDDB_ERROR", &e));
        },
        Err(_) => {
            web_sys::console::log_1(&"DEBUG: Channel error while waiting for database".into());
            return Err(DatabaseError::new("INDEXEDDB_ERROR", "Channel error"));
        },
    };
    
    web_sys::console::log_1(&"DEBUG: Starting IndexedDB transaction".into());
    
    // Check if object stores exist
    let store_names_list = db.object_store_names();
    web_sys::console::log_1(&format!("DEBUG: Available object stores: {}", store_names_list.length()).into());
    for i in 0..store_names_list.length() {
        if let Some(name) = store_names_list.get(i) {
            web_sys::console::log_1(&format!("DEBUG: Store {}: {:?}", i, name).into());
        }
    }
    
    // Check if required stores exist
    if !store_names_list.contains("blocks") || !store_names_list.contains("metadata") {
        web_sys::console::log_1(&"DEBUG: Required object stores missing, cannot create transaction".into());
        return Err(DatabaseError::new("INDEXEDDB_ERROR", "Required object stores not found"));
    }
    
    // Start transaction
    let store_names = js_sys::Array::new();
    store_names.push(&"blocks".into());
    store_names.push(&"metadata".into());
    let transaction = db.transaction_with_str_sequence_and_mode(&store_names, web_sys::IdbTransactionMode::Readwrite).unwrap();
    web_sys::console::log_1(&"DEBUG: Created IndexedDB transaction".into());
    
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

/// Simplified IndexedDB persistence for crash simulation
/// Writes blocks and metadata to IndexedDB without advancing commit marker
#[cfg(target_arch = "wasm32")]
pub async fn persist_to_indexeddb(
    db_name: &str,
    blocks: std::collections::HashMap<u64, Vec<u8>>,
    metadata: Vec<(u64, u64)>,
) -> Result<(), DatabaseError> {
    web_sys::console::log_1(&format!("DEBUG: persist_to_indexeddb called for {} blocks", blocks.len()).into());
    
    // Convert HashMap to Vec for the existing function
    let blocks_vec: Vec<(u64, Vec<u8>)> = blocks.into_iter().collect();
    web_sys::console::log_1(&format!("DEBUG: Converted HashMap to Vec, now have {} block entries", blocks_vec.len()).into());
    
    web_sys::console::log_1(&"DEBUG: About to call persist_to_indexeddb_event_based".into());
    
    // For crash simulation, we'll use the existing event-based persistence
    // but without advancing the commit marker (that's handled by the caller)
    let result = persist_to_indexeddb_event_based(db_name, blocks_vec, metadata, 0).await;
    
    web_sys::console::log_1(&format!("DEBUG: persist_to_indexeddb_event_based completed with result: {:?}", result.is_ok()).into());
    
    result
}