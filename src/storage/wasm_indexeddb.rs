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

/// Helper: Safely get IndexedDB factory
/// Works in both Window and Worker contexts by using js_sys::global()
#[cfg(target_arch = "wasm32")]
fn get_indexeddb_factory() -> Result<web_sys::IdbFactory, DatabaseError> {
    use wasm_bindgen::JsCast;
    
    // Get the global object (works in both Window and Worker contexts)
    let global = js_sys::global();
    
    // Try to get indexedDB from the global object
    // In Window: window.indexedDB
    // In Worker: self.indexedDB or globalThis.indexedDB
    let indexed_db_value = js_sys::Reflect::get(&global, &wasm_bindgen::JsValue::from_str("indexedDB"))
        .map_err(|e| DatabaseError::new("INDEXEDDB_ACCESS_ERROR", 
            &format!("Failed to access indexedDB property: {:?}", e)))?;
    
    // Check if indexedDB is null/undefined
    if indexed_db_value.is_null() || indexed_db_value.is_undefined() {
        return Err(DatabaseError::new("INDEXEDDB_UNAVAILABLE", 
            "IndexedDB is not supported in this environment"));
    }
    
    // Cast to IdbFactory
    let indexed_db = indexed_db_value.dyn_into::<web_sys::IdbFactory>()
        .map_err(|_| DatabaseError::new("INDEXEDDB_TYPE_ERROR", 
            "indexedDB property is not an IdbFactory"))?;
    
    Ok(indexed_db)
}

/// Helper: Open IndexedDB database
#[cfg(target_arch = "wasm32")]
fn open_indexeddb(db_name: &str, version: u32) -> Result<web_sys::IdbOpenDbRequest, DatabaseError> {
    let factory = get_indexeddb_factory()?;
    
    factory.open_with_u32(db_name, version)
        .map_err(|e| DatabaseError::new("INDEXEDDB_OPEN_ERROR",
            &format!("Failed to open IndexedDB '{}': {:?}", db_name, e)))
}

/// Check if IndexedDB recovery is needed for a database
/// 
/// This performs a lightweight check to determine if the database has existing state
/// that may need recovery. It does NOT perform actual crash recovery.
/// 
/// For actual crash recovery (rollback/finalize), call `BlockStorage::perform_crash_recovery()`.
#[cfg(target_arch = "wasm32")]
pub async fn perform_indexeddb_recovery_scan(db_name: &str) -> Result<bool, DatabaseError> {
    log::debug!("Starting IndexedDB recovery scan for {}", db_name);
    
    // Check if we have any existing commit marker in global state
    // This indicates the database has been used before and may have persisted state
    let has_existing_marker = vfs_sync::with_global_commit_marker(|cm| {
        cm.borrow().contains_key(db_name)
    });
    
    if has_existing_marker {
        log::debug!("Recovery scan - found existing commit marker for {}", db_name);
        return Ok(true);
    }
    
    log::debug!("Recovery scan - no existing state found for {}", db_name);
    Ok(false)
}

/// Restore BlockStorage state from IndexedDB with retry logic
#[cfg(target_arch = "wasm32")]
pub async fn restore_from_indexeddb(db_name: &str) -> Result<(), DatabaseError> {
    use super::retry_logic::with_retry;
    
    let db_name = db_name.to_string();
    
    with_retry("restore_from_indexeddb", || {
        let db_name = db_name.clone();
        async move {
            restore_from_indexeddb_internal(&db_name).await
        }
    }).await
}

/// Internal implementation of IndexedDB restoration (without retry logic)
#[cfg(target_arch = "wasm32")]
async fn restore_from_indexeddb_internal(db_name: &str) -> Result<(), DatabaseError> {
    use wasm_bindgen::JsValue;
    use wasm_bindgen::JsCast;
    
    log::debug!("Starting restoration for {}", db_name);
    
    // First check if commit marker already exists in global state (cross-instance sharing)
    let existing_marker = vfs_sync::with_global_commit_marker(|cm| {
        cm.borrow().get(db_name).copied()
    });
    
    // Check if blocks are already loaded (regardless of commit marker)
    let has_blocks = vfs_sync::with_global_storage(|gs| {
        gs.borrow().get(db_name).map(|db_storage| !db_storage.is_empty()).unwrap_or(false)
    });
    
    if let Some(_marker) = existing_marker {
        log::debug!("Found existing commit marker for {}", db_name);
        
        if has_blocks {
            log::debug!("Blocks already loaded for {}, skipping restoration", db_name);
            return Ok(());
        }
        
        log::debug!("Commit marker exists but no blocks - opening IndexedDB to restore blocks");
        
        // Open IndexedDB to restore blocks
        let open_req = open_indexeddb("block_storage", 2)?;
        
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
            restore_blocks_from_indexeddb(&db, db_name).await?;
            return Ok(());
        }
        
        return Err(DatabaseError::new("INDEXEDDB_OPEN_FAILED", 
            "Failed to open IndexedDB for block restoration"));
    } else {
        log::debug!("No existing commit marker found for {}, trying IndexedDB restoration", db_name);
    }
    
    // Try to open existing database
    let open_req = open_indexeddb("block_storage", 2)?;
    
    // Add upgrade handler to create object stores if needed
    let upgrade_closure = wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
        log::debug!("Upgrade handler called in restore_from_indexeddb");
        let target = event.target().unwrap();
        let request: web_sys::IdbOpenDbRequest = target.unchecked_into();
        let result = request.result().unwrap();
        let db: web_sys::IdbDatabase = result.unchecked_into();
        
        if !db.object_store_names().contains("blocks") {
            let _ = db.create_object_store("blocks");
            log::info!("Created blocks store in restore upgrade");
        }
        if !db.object_store_names().contains("metadata") {
            let _ = db.create_object_store("metadata");
            log::info!("Created metadata store in restore upgrade");
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
            log::info!("Successfully opened IndexedDB");
            if let Ok(db) = db_value.dyn_into::<web_sys::IdbDatabase>() {
                // Check if metadata store exists
                let store_names = db.object_store_names();
                #[cfg(target_arch = "wasm32")]
            log::debug!("Available stores: {:?}", store_names.length());
                
                if store_names.contains("metadata") {
                    log::debug!("Found metadata store");
                    let transaction = db.transaction_with_str("metadata")
                        .map_err(|e| DatabaseError::new("TRANSACTION_ERROR", 
                            &format!("Failed to create transaction: {:?}", e)))?;
                    let store = transaction.object_store("metadata")
                        .map_err(|e| DatabaseError::new("STORE_ERROR", 
                            &format!("Failed to access metadata store: {:?}", e)))?;
                    let commit_key = format!("{}:commit_marker", db_name);
                    
                    log::debug!("Looking for key: {}", commit_key);
                    let get_req = store.get(&JsValue::from_str(&commit_key))
                        .map_err(|e| DatabaseError::new("GET_ERROR", 
                            &format!("Failed to create get request: {:?}", e)))?;
                    
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
            log::debug!("Get request succeeded");
                            if !result.is_undefined() && !result.is_null() {
                                #[cfg(target_arch = "wasm32")]
            log::debug!("Result is not null/undefined");
                                if let Some(commit_marker) = result.as_f64() {
                                    let commit_u64 = commit_marker as u64;
                                    vfs_sync::with_global_commit_marker(|cm| {
                                        cm.borrow_mut().insert(db_name.to_string(), commit_u64);
                                    });
                                    #[cfg(target_arch = "wasm32")]
            log::debug!("Restored commit marker {} for {}", commit_u64, db_name);
                                    
                                    // NOW RESTORE THE ACTUAL BLOCKS FROM INDEXEDDB
                                    #[cfg(target_arch = "wasm32")]
                                    log::debug!("About to call restore_blocks_from_indexeddb");
                                    
                                    restore_blocks_from_indexeddb(&db, db_name).await?;
                                    log::info!("Successfully restored blocks");
                                    return Ok(());
                                } else {
                                    #[cfg(target_arch = "wasm32")]
            log::debug!("Result is not a number: {:?}", result);
                                }
                            } else {
                                #[cfg(target_arch = "wasm32")]
            log::debug!("Result is null or undefined");
                            }
                        }
                        Ok(Err(e)) => {
                            #[cfg(target_arch = "wasm32")]
            log::error!("Get request failed: {}", e);
                        }
                        Err(_) => {
                            #[cfg(target_arch = "wasm32")]
            log::error!("Get request channel failed");
                        }
                    }
                } else {
                    #[cfg(target_arch = "wasm32")]
            log::debug!("No metadata store found");
                }
            } else {
                #[cfg(target_arch = "wasm32")]
            log::error!("Failed to cast to IdbDatabase");
            }
        }
        Ok(Err(e)) => {
            #[cfg(target_arch = "wasm32")]
            log::error!("Failed to open IndexedDB: {}", e);
        }
        Err(_) => {
            #[cfg(target_arch = "wasm32")]
            log::error!("IndexedDB open channel failed");
        }
    }
    
    log::debug!("No commit marker found for {} in IndexedDB", db_name);
    Ok(())
}

/// Restore blocks from IndexedDB into global storage
#[cfg(target_arch = "wasm32")]
async fn restore_blocks_from_indexeddb(db: &web_sys::IdbDatabase, db_name: &str) -> Result<(), DatabaseError> {
    use wasm_bindgen::JsValue;
    use wasm_bindgen::JsCast;
    
    log::debug!("Restoring blocks for {} from IndexedDB", db_name);
    
    // Create transaction for both blocks and metadata
    let store_names = js_sys::Array::new();
    store_names.push(&JsValue::from_str("blocks"));
    store_names.push(&JsValue::from_str("metadata"));
    
    let transaction = db.transaction_with_str_sequence(&store_names)
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to create transaction"))?;
    
    let blocks_store = transaction.object_store("blocks")
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to get blocks store"))?;
    
    let metadata_store = transaction.object_store("metadata")
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
    log::info!("Restored {} blocks from IndexedDB", restored_blocks.len());
    
    for (block_id, data) in &restored_blocks {
        vfs_sync::with_global_storage(|gs| {
            let mut storage_map = gs.borrow_mut();
            let db_storage = storage_map.entry(db_name.to_string()).or_insert_with(HashMap::new);
            db_storage.insert(*block_id, data.clone());
        });
    }
    
    // FIXED TODO #1: Restore metadata from metadata store
    // Iterate through metadata store to restore block metadata (checksums, versions, algorithms)
    let metadata_cursor_req = metadata_store.open_cursor_with_range(&key_range)
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to open metadata cursor"))?;
    
    let (meta_tx, meta_rx) = futures::channel::oneshot::channel::<Result<(), String>>();
    let meta_tx = std::rc::Rc::new(std::cell::RefCell::new(Some(meta_tx)));
    let metadata_data = std::rc::Rc::new(std::cell::RefCell::new(Vec::new()));
    
    let metadata_data_clone = metadata_data.clone();
    let meta_tx_clone = meta_tx.clone();
    let metadata_success_closure = wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
        let target = event.target().unwrap();
        let request: web_sys::IdbRequest = target.unchecked_into();
        let result = request.result().unwrap();
        
        if !result.is_null() {
            let cursor: web_sys::IdbCursorWithValue = result.unchecked_into();
            let key = cursor.key().unwrap().as_string().unwrap();
            let value = cursor.value().unwrap();
            
            // Parse key: "db_name:block_id:version" or "db_name:commit_marker"
            if !key.contains("commit_marker") {
                let parts: Vec<&str> = key.split(':').collect();
                if parts.len() >= 3 {
                    if let Ok(block_id) = parts[1].parse::<u64>() {
                        if let Ok(version) = parts[2].parse::<u32>() {
                            // Get the version value (stored as Number)
                            if let Some(version_f64) = value.as_f64() {
                                metadata_data_clone.borrow_mut().push((block_id, version, version_f64 as u32));
                            }
                        }
                    }
                }
            }
            
            // Continue to next
            let _ = cursor.continue_();
        } else {
            // Done iterating
            if let Some(sender) = meta_tx_clone.borrow_mut().take() {
                let _ = sender.send(Ok(()));
            }
        }
    }) as Box<dyn FnMut(_)>);
    
    metadata_cursor_req.set_onsuccess(Some(metadata_success_closure.as_ref().unchecked_ref()));
    metadata_success_closure.forget();
    
    // Wait for metadata cursor iteration to complete
    let _ = meta_rx.await;
    
    let restored_metadata = metadata_data.borrow().clone();
    log::info!("Restored {} metadata entries from IndexedDB", restored_metadata.len());
    
    // Restore metadata to global metadata storage
    // Note: We compute checksums from the restored block data since IndexedDB only stores versions
    vfs_sync::with_global_metadata(|gm| {
        let mut meta_map = gm.borrow_mut();
        let db_meta = meta_map.entry(db_name.to_string()).or_insert_with(HashMap::new);
        
        for (block_id, _key_version, stored_version) in &restored_metadata {
            // Find the corresponding block data to compute checksum
            if let Some((_, data)) = restored_blocks.iter().find(|(bid, _)| bid == block_id) {
                let checksum = {
                    use std::collections::hash_map::DefaultHasher;
                    use std::hash::{Hash, Hasher};
                    let mut hasher = DefaultHasher::new();
                    data.hash(&mut hasher);
                    hasher.finish()
                };
                
                db_meta.insert(*block_id, BlockMetadataPersist {
                    checksum,
                    version: *stored_version,
                    last_modified_ms: 0, // Will be updated on next write
                    algo: ChecksumAlgorithm::FastHash,
                });
            }
        }
    });
    
    log::info!("Successfully restored blocks and metadata for {}", db_name);
    Ok(())
}

/// Event-based async IndexedDB persistence with retry logic
#[cfg(target_arch = "wasm32")]
pub async fn persist_to_indexeddb_event_based(
    db_name: &str,
    blocks: Vec<(u64, Vec<u8>)>,
    metadata: Vec<(u64, u64)>,
    commit_marker: u64,
    #[cfg(feature = "telemetry")]
    span_recorder: Option<crate::telemetry::SpanRecorder>,
    #[cfg(feature = "telemetry")]
    parent_span_id: Option<String>,
) -> Result<(), DatabaseError> {
    use super::retry_logic::with_retry;
    
    // Create child span for IndexedDB persistence
    #[cfg(feature = "telemetry")]
    let span = if span_recorder.is_some() {
        let mut builder = crate::telemetry::SpanBuilder::new("persist_indexeddb".to_string())
            .with_attribute("blocks_count", blocks.len().to_string())
            .with_attribute("metadata_count", metadata.len().to_string());
        
        if let Some(ref parent_id) = parent_span_id {
            builder = builder.with_parent(parent_id.clone());
        }
        
        Some(builder.build())
    } else {
        None
    };
    
    // Clone data for retry attempts
    let db_name = db_name.to_string();
    let blocks_clone = blocks.clone();
    let metadata_clone = metadata.clone();
    
    let result = with_retry("persist_to_indexeddb", || {
        let db_name = db_name.clone();
        let blocks = blocks_clone.clone();
        let metadata = metadata_clone.clone();
        async move {
            persist_to_indexeddb_event_based_internal(&db_name, blocks, metadata, commit_marker).await
        }
    }).await;
    
    // Finish span
    #[cfg(feature = "telemetry")]
    if let Some(mut s) = span {
        s.end_time_ms = Some(js_sys::Date::now());
        let duration_ms = s.end_time_ms.unwrap() - s.start_time_ms;
        s.attributes.insert("duration_ms".to_string(), duration_ms.to_string());
        
        if result.is_ok() {
            s.status = crate::telemetry::SpanStatus::Ok;
        } else {
            s.status = crate::telemetry::SpanStatus::Error("IndexedDB persistence failed".to_string());
        }
        
        if let Some(recorder) = span_recorder {
            recorder.record_span(s);
        }
    }
    
    result
}

/// Internal implementation of IndexedDB persistence (without retry logic)
#[cfg(target_arch = "wasm32")]
async fn persist_to_indexeddb_event_based_internal(db_name: &str, blocks: Vec<(u64, Vec<u8>)>, metadata: Vec<(u64, u64)>, commit_marker: u64) -> Result<(), DatabaseError> {
    use wasm_bindgen::JsCast;
    use wasm_bindgen::closure::Closure;
    use futures::channel::oneshot;
    
    log::debug!("persist_to_indexeddb_event_based starting");
    
    let open_req = open_indexeddb("block_storage", 2)?;
    log::info!("Created open request for version 2");
    
    // Set up upgrade handler
    let upgrade_closure = Closure::wrap(Box::new(move |event: web_sys::Event| {
        log::debug!("IndexedDB upgrade handler called");
        
        match (|| -> Result<(), Box<dyn std::error::Error>> {
            let target = event.target().ok_or("No event target")?;
            log::debug!("Got event target in upgrade handler");
            
            let request: web_sys::IdbOpenDbRequest = target.dyn_into().map_err(|_| "Failed to cast to IdbOpenDbRequest")?;
            log::debug!("Cast to IdbOpenDbRequest in upgrade handler");
            
            let result = request.result().map_err(|_| "Failed to get result from request")?;
            log::debug!("Got result from request in upgrade handler");
            
            let db: web_sys::IdbDatabase = result.dyn_into().map_err(|_| "Failed to cast result to IdbDatabase")?;
            log::debug!("Cast result to IdbDatabase in upgrade handler");
            
            if !db.object_store_names().contains("blocks") {
                db.create_object_store("blocks").map_err(|_| "Failed to create blocks store")?;
                log::info!("Created blocks object store");
            }
            if !db.object_store_names().contains("metadata") {
                db.create_object_store("metadata").map_err(|_| "Failed to create metadata store")?;
                log::info!("Created metadata object store");
            }
            
            log::info!("Upgrade handler completed successfully");
            Ok(())
        })() {
            Ok(_) => {},
            Err(e) => {
                log::error!("Upgrade handler error: {}", e);
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
            log::info!("IndexedDB open success handler called");
            if let Some(sender) = open_tx.borrow_mut().take() {
                log::debug!("Got sender from RefCell");
                let target = event.target().unwrap();
                log::debug!("Got event target");
                let request: web_sys::IdbOpenDbRequest = target.dyn_into().unwrap();
                log::debug!("Cast to IdbOpenDbRequest");
                let result = request.result().unwrap();
                log::debug!("Got result from request");
                let db: web_sys::IdbDatabase = result.dyn_into().unwrap();
                log::debug!("Cast result to IdbDatabase");
                log::debug!("Sending database to channel");
                let send_result = sender.send(Ok(db));
                log::debug!("Channel send result: {:?}", send_result.is_ok());
            } else {
                log::debug!("No sender available in RefCell");
            }
        }) as Box<dyn FnMut(_)>)
    };
    
    let error_closure = {
        let open_tx = open_tx.clone();
        Closure::wrap(Box::new(move |_event: web_sys::Event| {
            log::error!("IndexedDB open error handler called");
            if let Some(sender) = open_tx.borrow_mut().take() {
                let _ = sender.send(Err("Failed to open IndexedDB".to_string()));
            }
        }) as Box<dyn FnMut(_)>)
    };
    
    open_req.set_onsuccess(Some(success_closure.as_ref().unchecked_ref()));
    open_req.set_onerror(Some(error_closure.as_ref().unchecked_ref()));
    success_closure.forget();
    error_closure.forget();
    
    log::debug!("About to await open_rx channel");
    let db = match open_rx.await {
        Ok(Ok(db)) => {
            log::info!("Successfully received database from channel");
            db
        },
        Ok(Err(e)) => {
            log::error!("Database open error: {}", e);
            return Err(DatabaseError::new("INDEXEDDB_ERROR", &e));
        },
        Err(_) => {
            log::error!("Channel error while waiting for database");
            return Err(DatabaseError::new("INDEXEDDB_ERROR", "Channel error"));
        },
    };
    
    log::debug!("Starting IndexedDB transaction");
    
    // Check if object stores exist
    let store_names_list = db.object_store_names();
    log::debug!("Available object stores: {}", store_names_list.length());
    for i in 0..store_names_list.length() {
        if let Some(name) = store_names_list.get(i) {
            log::debug!("Store {}: {:?}", i, name);
        }
    }
    
    // Check if required stores exist
    if !store_names_list.contains("blocks") || !store_names_list.contains("metadata") {
        log::debug!("Required object stores missing, cannot create transaction");
        return Err(DatabaseError::new("INDEXEDDB_ERROR", "Required object stores not found"));
    }
    
    // Start transaction
    let store_names = js_sys::Array::new();
    store_names.push(&"blocks".into());
    store_names.push(&"metadata".into());
    let transaction = db.transaction_with_str_sequence_and_mode(&store_names, web_sys::IdbTransactionMode::Readwrite)
        .map_err(|e| DatabaseError::new("TRANSACTION_ERROR", 
            &format!("Failed to create transaction: {:?}", e)))?;
    log::info!("Created IndexedDB transaction");
    
    let blocks_store = transaction.object_store("blocks")
        .map_err(|e| DatabaseError::new("STORE_ERROR", 
            &format!("Failed to access blocks store: {:?}", e)))?;
    let metadata_store = transaction.object_store("metadata")
        .map_err(|e| DatabaseError::new("STORE_ERROR", 
            &format!("Failed to access metadata store: {:?}", e)))?;
    
    // Store blocks with idempotent keys: (db_name, block_id, version)
    for (block_id, block_data) in &blocks {
        // Find the corresponding version for this block_id
        if let Some((_, version)) = metadata.iter().find(|(id, _)| *id == *block_id) {
            let key = format!("{}:{}:{}", db_name, block_id, version);
            let value = js_sys::Uint8Array::from(&block_data[..]);
            #[cfg(target_arch = "wasm32")]
            log::debug!("Storing block with idempotent key: {}", key);
            let _ = blocks_store.put_with_key(&value, &key.into());
        }
    }
    
    // Store metadata with idempotent keys: (db_name, block_id, version)
    for (block_id, version) in metadata {
        let key = format!("{}:{}:{}", db_name, block_id, version);
        let value = js_sys::Number::from(version as f64);
        #[cfg(target_arch = "wasm32")]
        log::debug!("Storing metadata with idempotent key: {}", key);
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
    log::info!("IndexedDB persistence completed successfully");
    
    Ok(())
}

/// Async version of sync for WASM that properly awaits IndexedDB persistence
#[cfg(target_arch = "wasm32")]
pub async fn sync_async(storage: &mut BlockStorage) -> Result<(), DatabaseError> {
    log::debug!("Using ASYNC sync_async method");
    // Get current commit marker
    let current_commit = vfs_sync::with_global_commit_marker(|cm| {
        let cm = cm.borrow();
        cm.get(&storage.db_name).copied().unwrap_or(0)
    });
    
    let next_commit = current_commit + 1;
    log::debug!("Current commit marker for {}: {}", storage.db_name, current_commit);
    log::debug!("Next commit marker for {}: {}", storage.db_name, next_commit);
    
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
        log::debug!("SYNC updating metadata for block {} to version {}", block_id, next_commit);
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
        log::debug!("Awaiting IndexedDB persistence for {} blocks", to_persist.len());
        persist_to_indexeddb_event_based(
            &storage.db_name,
            to_persist,
            metadata_to_persist,
            next_commit,
            #[cfg(feature = "telemetry")]
            None,
            #[cfg(feature = "telemetry")]
            None,
        ).await?;
    }
    
    // Clear dirty blocks
    {
        let mut dirty = storage.dirty_blocks.lock();
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
    log::debug!("persist_to_indexeddb called for {} blocks", blocks.len());
    
    // Convert HashMap to Vec for the existing function
    let blocks_vec: Vec<(u64, Vec<u8>)> = blocks.into_iter().collect();
    log::debug!("Converted HashMap to Vec, now have {} block entries", blocks_vec.len());
    
    log::debug!("About to call persist_to_indexeddb_event_based");
    
    // For crash simulation, we'll use the existing event-based persistence
    // but without advancing the commit marker (that's handled by the caller)
    let result = persist_to_indexeddb_event_based(
        db_name,
        blocks_vec,
        metadata,
        0,
        #[cfg(feature = "telemetry")]
        None,
        #[cfg(feature = "telemetry")]
        None,
    ).await;
    
    log::debug!("persist_to_indexeddb_event_based completed with result: {:?}", result.is_ok());
    
    result
}

/// Delete blocks from IndexedDB (used during crash recovery rollback)
/// Physically removes blocks to avoid accumulating orphaned data
#[cfg(target_arch = "wasm32")]
pub async fn delete_blocks_from_indexeddb(
    db_name: &str,
    block_ids: &[u64],
) -> Result<(), DatabaseError> {
    use wasm_bindgen::JsCast;
    use wasm_bindgen::closure::Closure;
    use futures::channel::oneshot;
    
    if block_ids.is_empty() {
        return Ok(());
    }
    
    log::debug!("delete_blocks_from_indexeddb - deleting {} blocks for {}", block_ids.len(), db_name);
    
    let open_req = open_indexeddb("block_storage", 2)?;
    
    // Set up upgrade handler (should not be needed, but included for safety)
    let upgrade_closure = Closure::wrap(Box::new(move |event: web_sys::Event| {
        log::debug!("IndexedDB upgrade handler called during delete");
        
        match (|| -> Result<(), Box<dyn std::error::Error>> {
            let target = event.target().ok_or("No event target")?;
            let request: web_sys::IdbOpenDbRequest = target.dyn_into().map_err(|_| "Failed to cast to IdbOpenDbRequest")?;
            let result = request.result().map_err(|_| "Failed to get result from request")?;
            let db: web_sys::IdbDatabase = result.dyn_into().map_err(|_| "Failed to cast result to IdbDatabase")?;
            
            if !db.object_store_names().contains("blocks") {
                db.create_object_store("blocks").map_err(|_| "Failed to create blocks store")?;
            }
            if !db.object_store_names().contains("metadata") {
                db.create_object_store("metadata").map_err(|_| "Failed to create metadata store")?;
            }
            
            Ok(())
        })() {
            Ok(_) => {},
            Err(e) => {
                log::error!("Upgrade handler error: {}", e);
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
            if let Some(sender) = open_tx.borrow_mut().take() {
                let target = event.target().unwrap();
                let request: web_sys::IdbOpenDbRequest = target.dyn_into().unwrap();
                let result = request.result().unwrap();
                let db: web_sys::IdbDatabase = result.dyn_into().unwrap();
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
    let transaction = db.transaction_with_str_sequence_and_mode(&store_names, web_sys::IdbTransactionMode::Readwrite)
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to create delete transaction"))?;
    
    let blocks_store = transaction.object_store("blocks")
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to get blocks store"))?;
    let metadata_store = transaction.object_store("metadata")
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to get metadata store"))?;
    
    // Delete all blocks and their metadata
    // We need to delete all versions of each block (keys are "db_name:block_id:version")
    for block_id in block_ids {
        // Delete blocks with this block_id (all versions)
        // Use key range to delete all entries matching "db_name:block_id:*"
        let key_prefix_start = format!("{}:{}:", db_name, block_id);
        let key_prefix_end = format!("{}:{}:\u{FFFF}", db_name, block_id);
        
        let key_range = web_sys::IdbKeyRange::bound(
            &key_prefix_start.into(),
            &key_prefix_end.into()
        ).map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to create key range for deletion"))?;
        
        // Open cursor to delete all matching entries
        let blocks_cursor_req = blocks_store.open_cursor_with_range(&key_range)
            .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to open cursor for deletion"))?;
        
        // Use event-based approach to iterate and delete
        let (delete_tx, delete_rx) = oneshot::channel::<Result<(), String>>();
        let delete_tx = std::rc::Rc::new(std::cell::RefCell::new(Some(delete_tx)));
        
        let delete_closure = {
            let delete_tx = delete_tx.clone();
            Closure::wrap(Box::new(move |event: web_sys::Event| {
                let target = event.target().unwrap();
                let request: web_sys::IdbRequest = target.unchecked_into();
                let result = request.result().unwrap();
                
                if !result.is_null() {
                    let cursor: web_sys::IdbCursorWithValue = result.unchecked_into();
                    
                    // Delete this entry
                    let _ = cursor.delete();
                    
                    // Continue to next
                    let _ = cursor.continue_();
                } else {
                    // Done iterating
                    if let Some(sender) = delete_tx.borrow_mut().take() {
                        let _ = sender.send(Ok(()));
                    }
                }
            }) as Box<dyn FnMut(_)>)
        };
        
        blocks_cursor_req.set_onsuccess(Some(delete_closure.as_ref().unchecked_ref()));
        delete_closure.forget();
        
        // Wait for deletion to complete
        let _ = delete_rx.await;
        
        // Also delete metadata entries
        let metadata_cursor_req = metadata_store.open_cursor_with_range(&key_range)
            .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to open metadata cursor for deletion"))?;
        
        let (meta_delete_tx, meta_delete_rx) = oneshot::channel::<Result<(), String>>();
        let meta_delete_tx = std::rc::Rc::new(std::cell::RefCell::new(Some(meta_delete_tx)));
        
        let meta_delete_closure = {
            let meta_delete_tx = meta_delete_tx.clone();
            Closure::wrap(Box::new(move |event: web_sys::Event| {
                let target = event.target().unwrap();
                let request: web_sys::IdbRequest = target.unchecked_into();
                let result = request.result().unwrap();
                
                if !result.is_null() {
                    let cursor: web_sys::IdbCursorWithValue = result.unchecked_into();
                    
                    // Delete this entry
                    let _ = cursor.delete();
                    
                    // Continue to next
                    let _ = cursor.continue_();
                } else {
                    // Done iterating
                    if let Some(sender) = meta_delete_tx.borrow_mut().take() {
                        let _ = sender.send(Ok(()));
                    }
                }
            }) as Box<dyn FnMut(_)>)
        };
        
        metadata_cursor_req.set_onsuccess(Some(meta_delete_closure.as_ref().unchecked_ref()));
        meta_delete_closure.forget();
        
        // Wait for metadata deletion to complete
        let _ = meta_delete_rx.await;
        
        log::debug!("Deleted block {} (all versions) from IndexedDB", block_id);
    }
    
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
                let _ = sender.send(Err("Delete transaction failed".to_string()));
            }
        }) as Box<dyn FnMut(_)>)
    };
    
    transaction.set_oncomplete(Some(complete_closure.as_ref().unchecked_ref()));
    transaction.set_onerror(Some(tx_error_closure.as_ref().unchecked_ref()));
    complete_closure.forget();
    tx_error_closure.forget();
    
    match tx_rx.await {
        Ok(Ok(())) => {
            log::info!("Successfully deleted {} blocks from IndexedDB", block_ids.len());
            Ok(())
        },
        Ok(Err(e)) => Err(DatabaseError::new("INDEXEDDB_ERROR", &e)),
        Err(_) => Err(DatabaseError::new("INDEXEDDB_ERROR", "Channel error during deletion")),
    }
}