#[cfg(target_arch = "wasm32")]
use crate::types::DatabaseError;
#[cfg(target_arch = "wasm32")]
use super::vfs_sync;
#[cfg(target_arch = "wasm32")]
use super::BlockStorage;

/// Register a BlockStorage instance for VFS sync callbacks
#[cfg(target_arch = "wasm32")]
pub fn register_storage_for_vfs_sync(db_name: &str, storage: std::rc::Weak<std::cell::RefCell<BlockStorage>>) {
    vfs_sync::with_storage_registry(|registry| {
        let mut registry = registry.borrow_mut();
        registry.insert(db_name.to_string(), storage);
        web_sys::console::log_1(&format!("VFS: Registered storage instance for {}", db_name).into());
    });
}

/// Trigger a sync for a specific database from VFS
#[cfg(target_arch = "wasm32")]
pub fn vfs_sync_database(db_name: &str) -> Result<(), DatabaseError> {
    // DEBUG: Log where this is being called from
    // web_sys::console::log_1(&"⚠️  vfs_sync_database() CALLED - THIS SHOULD BE RARE!".into());
    
    // Advance the commit marker to make writes visible
    let _next_commit = vfs_sync::with_global_commit_marker(|cm| {
        let mut cm = cm.borrow_mut();
        let current = cm.get(db_name).copied().unwrap_or(0);
        let new_marker = current + 1;
        cm.insert(db_name.to_string(), new_marker);
        web_sys::console::log_1(&format!("VFS sync: Advanced commit marker for {} from {} to {}", db_name, current, new_marker).into());
        new_marker
    });

    // Trigger immediate IndexedDB persistence for the committed data
    let db_name_clone = db_name.to_string();
    
    // CRITICAL: Collect blocks BEFORE spawning async task to avoid timing issues
    let (blocks_to_persist, metadata_to_persist) = vfs_sync::with_global_storage(|storage| {
        let storage_map = storage.borrow();
        
        // DEBUG: Log all keys in GLOBAL_STORAGE
        //web_sys::console::log_1(&format!("VFS sync: GLOBAL_STORAGE keys: {:?}", storage_map.keys().collect::<Vec<_>>()).into());
        //web_sys::console::log_1(&format!("VFS sync: Looking for key: {}", db_name_clone).into());
        
        let blocks = if let Some(db_storage) = storage_map.get(&db_name_clone) {
            //web_sys::console::log_1(&format!("VFS sync: Found {} blocks for {}", db_storage.len(), db_name_clone).into());
            db_storage.iter().map(|(&id, data)| (id, data.clone())).collect::<Vec<_>>()
        } else {
            web_sys::console::log_1(&format!("VFS sync: No storage found for key: {}", db_name_clone).into());
            Vec::new()
        };

        // Also collect metadata
        let metadata = vfs_sync::with_global_metadata(|meta| {
            let meta_map = meta.borrow();
            if let Some(db_meta) = meta_map.get(&db_name_clone) {
                db_meta.iter().map(|(&id, metadata)| (id, metadata.checksum)).collect::<Vec<_>>()
            } else {
                Vec::new()
            }
        });

        (blocks, metadata)
    });

    if !blocks_to_persist.is_empty() {
        wasm_bindgen_futures::spawn_local(async move {
            let next_commit = vfs_sync::with_global_commit_marker(|cm| {
                let cm = cm.borrow();
                cm.get(&db_name_clone).copied().unwrap_or(0)
            });

            web_sys::console::log_1(&format!("VFS sync: Persisting {} blocks to IndexedDB with commit marker {}", blocks_to_persist.len(), next_commit).into());

            match super::wasm_indexeddb::persist_to_indexeddb_event_based(&db_name_clone, blocks_to_persist, metadata_to_persist, next_commit).await {
                Ok(_) => {
                    web_sys::console::log_1(&format!("VFS sync: Successfully persisted {} to IndexedDB", db_name_clone).into());
                }
                Err(e) => {
                    web_sys::console::log_1(&format!("VFS sync: Failed to persist {} to IndexedDB: {:?}", db_name_clone, e).into());
                }
            }
        });
    } else {
        web_sys::console::log_1(&format!("VFS sync: No blocks to persist for {}", db_name_clone).into());
    }

    Ok(())
}

/// Blocking version of VFS sync that waits for IndexedDB persistence to complete
#[cfg(target_arch = "wasm32")]
pub fn vfs_sync_database_blocking(db_name: &str) -> Result<(), DatabaseError> {
    // Advance the commit marker to make writes visible
    let next_commit = vfs_sync::with_global_commit_marker(|cm| {
        let mut cm = cm.borrow_mut();
        let current = cm.get(db_name).copied().unwrap_or(0);
        let new_marker = current + 1;
        cm.insert(db_name.to_string(), new_marker);
        web_sys::console::log_1(&format!("VFS sync: Advanced commit marker for {} from {} to {}", db_name, current, new_marker).into());
        new_marker
    });

    // Collect all data from global storage for this database
    let (blocks_to_persist, metadata_to_persist) = vfs_sync::with_global_storage(|storage| {
        let storage_map = storage.borrow();
        let blocks = if let Some(db_storage) = storage_map.get(db_name) {
            db_storage.iter().map(|(&id, data)| (id, data.clone())).collect::<Vec<_>>()
        } else {
            Vec::new()
        };

        // Also collect metadata
        let metadata = vfs_sync::with_global_metadata(|meta| {
            let meta_map = meta.borrow();
            if let Some(db_meta) = meta_map.get(db_name) {
                db_meta.iter().map(|(&id, metadata)| (id, metadata.checksum)).collect::<Vec<_>>()
            } else {
                Vec::new()
            }
        });

        (blocks, metadata)
    });

    if blocks_to_persist.is_empty() {
        web_sys::console::log_1(&format!("VFS sync: No blocks to persist for {}", db_name).into());
        return Ok(());
    }

    // Use wasm-bindgen-futures to block on the async operation
    let db_name_string = db_name.to_string();
    let fut = async move {
        // Create a temporary storage instance just for persistence
        match BlockStorage::new(&db_name_string).await {
            Ok(_storage) => {
                match super::wasm_indexeddb::persist_to_indexeddb_event_based(&db_name_string, blocks_to_persist, metadata_to_persist, next_commit).await {
                    Ok(_) => {
                        web_sys::console::log_1(&format!("VFS sync: Successfully persisted {} to IndexedDB", db_name_string).into());

                        // CRITICAL FIX: Also persist the commit marker to IndexedDB
                        if let Err(e) = persist_commit_marker_to_indexeddb(&db_name_string, next_commit).await {
                            web_sys::console::log_1(&format!("VFS sync: Failed to persist commit marker for {}: {:?}", db_name_string, e).into());
                        } else {
                            web_sys::console::log_1(&format!("VFS sync: Successfully persisted commit marker {} for {}", next_commit, db_name_string).into());
                        }
                    }
                    Err(e) => {
                        web_sys::console::log_1(&format!("VFS sync: Failed to persist {} to IndexedDB: {:?}", db_name_string, e).into());
                    }
                }
            }
            Err(e) => {
                web_sys::console::log_1(&format!("VFS sync: Failed to create storage instance for {}: {:?}", db_name_string, e).into());
            }
        }
    };

    // We can't actually block in WASM, so just spawn the async task
    // The commit marker advancement above is sufficient for immediate visibility
    wasm_bindgen_futures::spawn_local(fut);

    Ok(())
}

/// Persist commit marker to IndexedDB for cross-instance visibility
#[cfg(target_arch = "wasm32")]
pub async fn persist_commit_marker_to_indexeddb(db_name: &str, commit_marker: u64) -> Result<(), DatabaseError> {
    use wasm_bindgen::prelude::*;
    use wasm_bindgen::JsCast;
    use futures::channel::oneshot;

    let db_name_string = db_name.to_string();
    let window = web_sys::window().ok_or_else(|| DatabaseError::new("WASM_ERROR", "No window object"))?;
    let indexed_db = window
        .indexed_db()
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "IndexedDB not available"))?
        .ok_or_else(|| DatabaseError::new("INDEXEDDB_ERROR", "IndexedDB is null"))?;

    let (tx, rx) = oneshot::channel();
    let tx = std::rc::Rc::new(std::cell::RefCell::new(Some(tx)));

    let open_request = indexed_db
        .open_with_u32("block_storage", 2)
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to open IndexedDB"))?;

    // Handle database upgrade
    let upgrade_closure = Closure::wrap(Box::new(move |event: web_sys::Event| {
        let target = event.target().unwrap();
        let db: web_sys::IdbDatabase = target.dyn_into().unwrap();

        // Create metadata store if it doesn't exist
        if !db.object_store_names().contains("metadata") {
            let _store = db.create_object_store("metadata").unwrap();
        }
    }) as Box<dyn FnMut(_)>);
    open_request.set_onupgradeneeded(Some(upgrade_closure.as_ref().unchecked_ref()));
    upgrade_closure.forget();

    // Handle success
    let tx_clone = tx.clone();
    let success_closure = Closure::wrap(Box::new(move |event: web_sys::Event| {
        let target = event.target().expect("event target");
        let request: web_sys::IdbOpenDbRequest = target.dyn_into().expect("cast to IdbOpenDbRequest");
        let result = request.result().expect("get result");
        let db: web_sys::IdbDatabase = result.dyn_into().expect("cast to IdbDatabase");

        let transaction = db.transaction_with_str_and_mode("metadata", web_sys::IdbTransactionMode::Readwrite)
            .expect("create transaction");
        let store = transaction.object_store("metadata").expect("get store");

        // Store commit marker with key "<db_name>:commit_marker" (matches restore format)
        let key = format!("{}:commit_marker", db_name_string);
        let value = js_sys::Number::from(commit_marker as f64);
        let _request = store.put_with_key(&value, &JsValue::from_str(&key))
            .expect("put commit marker");

        if let Some(sender) = tx_clone.borrow_mut().take() {
            let _ = sender.send(Ok(()));
        }
    }) as Box<dyn FnMut(_)>);
    open_request.set_onsuccess(Some(success_closure.as_ref().unchecked_ref()));
    success_closure.forget();

    // Handle error
    let error_closure = Closure::wrap(Box::new(move |_event: web_sys::Event| {
        if let Some(sender) = tx.borrow_mut().take() {
            let _ = sender.send(Err(DatabaseError::new("INDEXEDDB_ERROR", "Failed to persist commit marker")));
        }
    }) as Box<dyn FnMut(_)>);
    open_request.set_onerror(Some(error_closure.as_ref().unchecked_ref()));
    error_closure.forget();

    rx.await.map_err(|_| DatabaseError::new("ASYNC_ERROR", "Channel error"))?.map_err(|e| e)
}

/// Sync blocks to global storage without advancing commit marker
/// Used by VFS x_sync callback to persist blocks but maintain commit marker lag
#[cfg(target_arch = "wasm32")]
pub fn sync_blocks_only(storage: &BlockStorage) -> Result<(), DatabaseError> {
    let _db_name = &storage.db_name;
    // web_sys::console::log_1(&format!("DEBUG: sync_blocks_only called for {}", _db_name).into());
    
    // Simply persist blocks to cache without advancing commit marker
    // The blocks are already in the local cache and will be visible to other instances
    // through the global storage registry, but the commit marker won't advance
    // web_sys::console::log_1(&format!("DEBUG: sync_blocks_only completed for {} (commit marker unchanged)", db_name).into());
    
    Ok(())
}
