//! WASM IndexedDB operations extracted from BlockStorage
//! This module contains WASM-specific IndexedDB functionality

#[cfg(target_arch = "wasm32")]
use super::metadata::{BlockMetadataPersist, ChecksumAlgorithm};
#[cfg(target_arch = "wasm32")]
use super::{BlockStorage, vfs_sync};
#[cfg(target_arch = "wasm32")]
use crate::types::DatabaseError;
#[cfg(target_arch = "wasm32")]
use futures::channel::oneshot;
#[cfg(target_arch = "wasm32")]
use futures::lock::Mutex;
#[cfg(target_arch = "wasm32")]
use std::cell::RefCell;
#[cfg(target_arch = "wasm32")]
use std::collections::HashMap;
#[cfg(target_arch = "wasm32")]
use std::sync::Arc;
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::JsValue;

#[cfg(target_arch = "wasm32")]
thread_local! {
    /// Global mutex to serialize IndexedDB open operations
    /// Chrome blocks concurrent opens even after close(), so we must serialize all IndexedDB access
    static INDEXEDDB_MUTEX: RefCell<Arc<Mutex<()>>> = RefCell::new(Arc::new(Mutex::new(())));
}

// Reentrancy-safe lock macros
#[allow(unused_macros)]
macro_rules! lock_mutex {
    ($mutex:expr) => {
        $mutex
            .try_borrow_mut()
            .expect("RefCell borrow failed - reentrancy issue")
    };
}

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
    let indexed_db_value =
        js_sys::Reflect::get(&global, &wasm_bindgen::JsValue::from_str("indexedDB")).map_err(
            |e| {
                DatabaseError::new(
                    "INDEXEDDB_ACCESS_ERROR",
                    &format!("Failed to access indexedDB property: {:?}", e),
                )
            },
        )?;

    // Check if indexedDB is null/undefined
    if indexed_db_value.is_null() || indexed_db_value.is_undefined() {
        return Err(DatabaseError::new(
            "INDEXEDDB_UNAVAILABLE",
            "IndexedDB is not supported in this environment",
        ));
    }

    // Cast to IdbFactory
    let indexed_db = indexed_db_value
        .dyn_into::<web_sys::IdbFactory>()
        .map_err(|_| {
            DatabaseError::new(
                "INDEXEDDB_TYPE_ERROR",
                "indexedDB property is not an IdbFactory",
            )
        })?;

    Ok(indexed_db)
}

/// Helper: Open IndexedDB database
#[cfg(target_arch = "wasm32")]
fn open_indexeddb(db_name: &str, version: u32) -> Result<web_sys::IdbOpenDbRequest, DatabaseError> {
    let factory = get_indexeddb_factory()?;

    factory.open_with_u32(db_name, version).map_err(|e| {
        DatabaseError::new(
            "INDEXEDDB_OPEN_ERROR",
            &format!("Failed to open IndexedDB '{}': {:?}", db_name, e),
        )
    })
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
    let has_existing_marker =
        vfs_sync::with_global_commit_marker(|cm| cm.borrow().contains_key(db_name));

    if has_existing_marker {
        log::debug!(
            "Recovery scan - found existing commit marker for {}",
            db_name
        );
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
        async move { restore_from_indexeddb_internal(&db_name, false).await }
    })
    .await
}

/// Force restore variant that always loads from IndexedDB even if blocks exist
#[cfg(target_arch = "wasm32")]
pub async fn restore_from_indexeddb_force(db_name: &str) -> Result<(), DatabaseError> {
    use super::retry_logic::with_retry;

    let db_name = db_name.to_string();

    with_retry("restore_from_indexeddb_force", || {
        let db_name = db_name.clone();
        async move { restore_from_indexeddb_internal(&db_name, true).await }
    })
    .await
}

/// Internal implementation of IndexedDB restoration (without retry logic)
#[cfg(target_arch = "wasm32")]
async fn restore_from_indexeddb_internal(db_name: &str, force: bool) -> Result<(), DatabaseError> {
    use wasm_bindgen::JsCast;
    use wasm_bindgen::JsValue;

    web_sys::console::log_1(
        &format!(
            "[RESTORE] restore_from_indexeddb_internal called for: {} (force={})",
            db_name, force
        )
        .into(),
    );

    // CRITICAL: Acquire mutex to serialize IndexedDB operations
    // Chrome blocks concurrent opens even after close()
    let mutex = INDEXEDDB_MUTEX.with(|m| m.borrow().clone());
    #[cfg(target_arch = "wasm32")]
    web_sys::console::log_1(&format!("[RESTORE] Acquiring IndexedDB mutex...").into());
    let _guard = mutex.lock().await;
    #[cfg(target_arch = "wasm32")]
    web_sys::console::log_1(
        &format!("[RESTORE] Mutex acquired, proceeding with restoration").into(),
    );

    log::debug!("Starting restoration for {}", db_name);

    // First check if commit marker already exists in global state (cross-instance sharing)
    let existing_marker =
        vfs_sync::with_global_commit_marker(|cm| cm.borrow().get(db_name).copied());

    // Check if blocks are already loaded (regardless of commit marker)
    let (has_blocks, block_count, block_0_size) = vfs_sync::with_global_storage(|gs| {
        if let Some(db_storage) = gs.borrow().get(db_name) {
            let count = db_storage.len();
            let b0_size = db_storage.get(&0).map(|d| d.len()).unwrap_or(0);
            (!db_storage.is_empty(), count, b0_size)
        } else {
            (false, 0, 0)
        }
    });

    #[cfg(target_arch = "wasm32")]
    web_sys::console::log_1(
        &format!(
            "[RESTORE] Commit marker: {:?}, Has blocks: {} (count={}, block_0_size={})",
            existing_marker, has_blocks, block_count, block_0_size
        )
        .into(),
    );

    if let Some(_marker) = existing_marker {
        log::debug!("Found existing commit marker for {}", db_name);

        if has_blocks && !force {
            log::debug!(
                "Blocks already loaded for {}, skipping restoration",
                db_name
            );
            #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(
                &format!("[RESTORE] Blocks already loaded, skipping IndexedDB restore").into(),
            );
            return Ok(());
        } else if has_blocks && force {
            #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(
                &format!("[RESTORE] Blocks exist but force=true, reloading from IndexedDB").into(),
            );
        }

        log::debug!("Commit marker exists but no blocks - opening IndexedDB to restore blocks");
        #[cfg(target_arch = "wasm32")]
        web_sys::console::log_1(&format!("[RESTORE] Opening IndexedDB to restore blocks").into());

        // Open IndexedDB to restore blocks
        let open_req = open_indexeddb("block_storage", 2)?;

        let (tx, rx) = futures::channel::oneshot::channel::<Result<web_sys::IdbDatabase, String>>();
        let tx = std::rc::Rc::new(std::cell::RefCell::new(Some(tx)));

        let success_tx = tx.clone();
        let success_callback =
            wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
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
            #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(
                &format!("[RESTORE] IndexedDB opened, starting block restoration").into(),
            );
            restore_blocks_from_indexeddb(&db, db_name, force).await?;
            #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("[RESTORE] Block restoration complete").into());
            return Ok(());
        }

        return Err(DatabaseError::new(
            "INDEXEDDB_OPEN_FAILED",
            "Failed to open IndexedDB for block restoration",
        ));
    } else {
        log::debug!(
            "No existing commit marker found for {}, trying IndexedDB restoration",
            db_name
        );
    }

    // Try to open existing database
    let open_req = open_indexeddb("block_storage", 2)?;

    // Add upgrade handler to create object stores if needed
    let upgrade_closure =
        wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
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
    let success_callback =
        wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
            if let Some(tx) = success_tx.borrow_mut().take() {
                let target = event.target().unwrap();
                let request: web_sys::IdbOpenDbRequest = target.unchecked_into();
                let result = request.result().unwrap();
                let _ = tx.send(Ok(result));
            }
        }) as Box<dyn FnMut(_)>);

    // Error callback
    let error_tx = tx.clone();
    let error_callback =
        wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
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
                    let transaction = db.transaction_with_str("metadata").map_err(|e| {
                        DatabaseError::new(
                            "TRANSACTION_ERROR",
                            &format!("Failed to create transaction: {:?}", e),
                        )
                    })?;
                    let store = transaction.object_store("metadata").map_err(|e| {
                        DatabaseError::new(
                            "STORE_ERROR",
                            &format!("Failed to access metadata store: {:?}", e),
                        )
                    })?;
                    let commit_key = format!("{}:commit_marker", db_name);

                    log::debug!("Looking for key: {}", commit_key);
                    let get_req = store.get(&JsValue::from_str(&commit_key)).map_err(|e| {
                        DatabaseError::new(
                            "GET_ERROR",
                            &format!("Failed to create get request: {:?}", e),
                        )
                    })?;

                    // Use event-based approach for get request too
                    let (get_tx, get_rx) = futures::channel::oneshot::channel();
                    let get_tx = std::rc::Rc::new(std::cell::RefCell::new(Some(get_tx)));

                    let get_success_tx = get_tx.clone();
                    let get_success_callback = wasm_bindgen::closure::Closure::wrap(Box::new(
                        move |event: web_sys::Event| {
                            if let Some(tx) = get_success_tx.borrow_mut().take() {
                                let target = event.target().unwrap();
                                let request: web_sys::IdbRequest = target.unchecked_into();
                                let result = request.result().unwrap();
                                let _ = tx.send(Ok(result));
                            }
                        },
                    )
                        as Box<dyn FnMut(_)>);

                    let get_error_tx = get_tx.clone();
                    let get_error_callback = wasm_bindgen::closure::Closure::wrap(Box::new(
                        move |event: web_sys::Event| {
                            if let Some(tx) = get_error_tx.borrow_mut().take() {
                                let _ = tx.send(Err(format!("Get request failed: {:?}", event)));
                            }
                        },
                    )
                        as Box<dyn FnMut(_)>);

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
                                    log::debug!(
                                        "Restored commit marker {} for {}",
                                        commit_u64,
                                        db_name
                                    );

                                    // NOW RESTORE THE ACTUAL BLOCKS FROM INDEXEDDB
                                    #[cfg(target_arch = "wasm32")]
                                    log::debug!("About to call restore_blocks_from_indexeddb");

                                    restore_blocks_from_indexeddb(&db, db_name, force).await?;
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
/// When force=true, overwrite existing blocks and clear stale metadata
#[cfg(target_arch = "wasm32")]
async fn restore_blocks_from_indexeddb(
    db: &web_sys::IdbDatabase,
    db_name: &str,
    force: bool,
) -> Result<(), DatabaseError> {
    use wasm_bindgen::JsCast;
    use wasm_bindgen::JsValue;

    log::debug!("Restoring blocks for {} from IndexedDB", db_name);

    // Create transaction for both blocks and metadata
    let store_names = js_sys::Array::new();
    store_names.push(&JsValue::from_str("blocks"));
    store_names.push(&JsValue::from_str("metadata"));

    let transaction = db
        .transaction_with_str_sequence(&store_names)
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to create transaction"))?;

    let blocks_store = transaction
        .object_store("blocks")
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to get blocks store"))?;

    let metadata_store = transaction
        .object_store("metadata")
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to get metadata store"))?;

    // Get all blocks for this database (keys start with "db_name:")
    let key_start = format!("{}:", db_name);
    let key_end = format!("{}:\u{FFFF}", db_name);
    #[cfg(target_arch = "wasm32")]
    web_sys::console::log_1(
        &format!(
            "[RESTORE] Searching IndexedDB for keys from '{}' to '{}'",
            key_start, key_end
        )
        .into(),
    );

    let key_range =
        web_sys::IdbKeyRange::bound(&JsValue::from_str(&key_start), &JsValue::from_str(&key_end))
            .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to create key range"))?;

    let blocks_cursor_req = blocks_store
        .open_cursor_with_range(&key_range)
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to open blocks cursor"))?;

    // Use event-based approach to iterate cursor
    let (tx, rx) = futures::channel::oneshot::channel::<Result<(), String>>();
    let tx = std::rc::Rc::new(std::cell::RefCell::new(Some(tx)));
    let blocks_data = std::rc::Rc::new(std::cell::RefCell::new(Vec::new()));

    let blocks_data_clone = blocks_data.clone();
    let tx_clone = tx.clone();
    let success_closure =
        wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
            let target = event.target().unwrap();
            let request: web_sys::IdbRequest = target.unchecked_into();
            let result = request.result().unwrap();

            if !result.is_null() {
                let cursor: web_sys::IdbCursorWithValue = result.unchecked_into();
                let key = cursor.key().unwrap().as_string().unwrap();
                let value = cursor.value().unwrap();

                #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(
                    &format!("[RESTORE] Found key in IndexedDB: {}", key).into(),
                );

                // Parse key: "db_name:block_id" (FIX: no more checksum in key)
                let parts: Vec<&str> = key.split(':').collect();
                if parts.len() >= 2 {
                    if let Ok(block_id) = parts[1].parse::<u64>() {
                        // Get the block data (Uint8Array)
                        if let Ok(array) = value.dyn_into::<js_sys::Uint8Array>() {
                            let mut data = vec![0u8; array.length() as usize];
                            array.copy_to(&mut data);
                            #[cfg(target_arch = "wasm32")]
                            web_sys::console::log_1(
                                &format!("[RESTORE] Block {} has {} bytes", block_id, data.len())
                                    .into(),
                            );
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
    // CRITICAL: De-duplicate by block_id, keeping only the LAST occurrence (highest version)
    let restored_blocks = blocks_data.borrow().clone();
    let mut deduped_blocks: HashMap<u64, Vec<u8>> = HashMap::new();
    for (block_id, data) in &restored_blocks {
        deduped_blocks.insert(*block_id, data.clone());
    }

    log::info!(
        "Restored {} unique blocks from IndexedDB (after deduplication)",
        deduped_blocks.len()
    );
    #[cfg(target_arch = "wasm32")]
    web_sys::console::log_1(
        &format!(
            "[RESTORE] Restored {} unique blocks from IndexedDB for {}",
            deduped_blocks.len(),
            db_name
        )
        .into(),
    );

    // CRITICAL: When force=true (multi-tab reload), clear stale metadata BEFORE restoring blocks
    // This prevents checksum mismatches from old metadata that doesn't match new block data
    if force {
        vfs_sync::with_global_metadata(|gm| {
            gm.borrow_mut().remove(db_name);
        });
        #[cfg(target_arch = "wasm32")]
        web_sys::console::log_1(
            &format!(
                "[RESTORE] Cleared stale GLOBAL_METADATA for {} (force=true)",
                db_name
            )
            .into(),
        );
    }

    // Write blocks to GLOBAL_STORAGE
    // When force=true, overwrite existing blocks with fresh IndexedDB data
    // When force=false, only write blocks that don't exist (respects fresh imports)
    let total_deduped = deduped_blocks.len();
    let blocks_written = vfs_sync::with_global_storage(|gs| {
        let mut storage_map = gs.borrow_mut();
        let db_storage = storage_map
            .entry(db_name.to_string())
            .or_insert_with(HashMap::new);
        let mut count = 0;
        for (block_id, data) in deduped_blocks {
            let already_exists = db_storage.contains_key(&block_id);
            let should_write = force || !already_exists;
            if should_write {
                #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(
                    &format!(
                        "[RESTORE] Writing block {} to GLOBAL_STORAGE[{}] (force={}, existed={})",
                        block_id, db_name, force, already_exists
                    )
                    .into(),
                );
                db_storage.insert(block_id, data);
                count += 1;
            } else {
                #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(
                    &format!(
                        "[RESTORE] Skipping block {} - already in GLOBAL_STORAGE (force=false)",
                        block_id
                    )
                    .into(),
                );
            }
        }
        count
    });

    #[cfg(target_arch = "wasm32")]
    web_sys::console::log_1(
        &format!(
            "[RESTORE] Wrote {} new blocks to GLOBAL_STORAGE (skipped {} existing)",
            blocks_written,
            total_deduped - blocks_written
        )
        .into(),
    );

    // CRITICAL: Update allocation map with the blocks that are NOW in GLOBAL_STORAGE
    use std::collections::HashSet;
    let allocated_ids = vfs_sync::with_global_storage(|gs| {
        let storage_map = gs.borrow();
        storage_map
            .get(db_name)
            .map(|db_storage| db_storage.keys().copied().collect::<HashSet<u64>>())
            .unwrap_or_default()
    });

    vfs_sync::with_global_allocation_map(|gam| {
        gam.borrow_mut()
            .insert(db_name.to_string(), allocated_ids.clone());
    });
    #[cfg(target_arch = "wasm32")]
    web_sys::console::log_1(
        &format!(
            "[RESTORE] Updated allocation map with {} blocks",
            allocated_ids.len()
        )
        .into(),
    );

    // FIXED TODO #1: Restore metadata from metadata store
    // Iterate through metadata store to restore block metadata (checksums, versions, algorithms)
    let metadata_cursor_req = metadata_store
        .open_cursor_with_range(&key_range)
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to open metadata cursor"))?;

    let (meta_tx, meta_rx) = futures::channel::oneshot::channel::<Result<(), String>>();
    let meta_tx = std::rc::Rc::new(std::cell::RefCell::new(Some(meta_tx)));
    let metadata_data = std::rc::Rc::new(std::cell::RefCell::new(Vec::new()));

    let metadata_data_clone = metadata_data.clone();
    let meta_tx_clone = meta_tx.clone();
    let metadata_success_closure =
        wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
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
                                    metadata_data_clone.borrow_mut().push((
                                        block_id,
                                        version,
                                        version_f64 as u32,
                                    ));
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
    log::info!(
        "Restored {} metadata entries from IndexedDB",
        restored_metadata.len()
    );

    // Restore metadata to global metadata storage
    // Note: We compute checksums from the restored block data since IndexedDB only stores versions
    vfs_sync::with_global_metadata(|gm| {
        let mut meta_map = gm.borrow_mut();
        let db_meta = meta_map
            .entry(db_name.to_string())
            .or_insert_with(HashMap::new);

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

                db_meta.insert(
                    *block_id,
                    BlockMetadataPersist {
                        checksum,
                        version: *stored_version,
                        last_modified_ms: 0, // Will be updated on next write
                        algo: ChecksumAlgorithm::FastHash,
                    },
                );
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
    #[cfg(feature = "telemetry")] span_recorder: Option<crate::telemetry::SpanRecorder>,
    #[cfg(feature = "telemetry")] parent_span_id: Option<String>,
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
            persist_to_indexeddb_event_based_internal(&db_name, blocks, metadata, commit_marker)
                .await
        }
    })
    .await;

    // Finish span
    #[cfg(feature = "telemetry")]
    if let Some(mut s) = span {
        s.end_time_ms = Some(js_sys::Date::now());
        let duration_ms = s.end_time_ms.unwrap() - s.start_time_ms;
        s.attributes
            .insert("duration_ms".to_string(), duration_ms.to_string());

        if result.is_ok() {
            s.status = crate::telemetry::SpanStatus::Ok;
        } else {
            s.status =
                crate::telemetry::SpanStatus::Error("IndexedDB persistence failed".to_string());
        }

        if let Some(recorder) = span_recorder {
            recorder.record_span(s);
        }
    }

    result
}

/// Internal implementation of IndexedDB persistence (without retry logic)
#[cfg(target_arch = "wasm32")]
async fn persist_to_indexeddb_event_based_internal(
    db_name: &str,
    blocks: Vec<(u64, Vec<u8>)>,
    metadata: Vec<(u64, u64)>,
    commit_marker: u64,
) -> Result<(), DatabaseError> {
    use wasm_bindgen::JsCast;
    use wasm_bindgen::closure::Closure;

    // CRITICAL: Acquire mutex to serialize IndexedDB operations
    // Chrome blocks concurrent opens even after close()
    let mutex = INDEXEDDB_MUTEX.with(|m| m.borrow().clone());
    log::debug!("PERSIST: Acquiring IndexedDB mutex...");
    let _guard = mutex.lock().await;
    log::debug!("PERSIST: Mutex acquired, proceeding with persistence");

    log::debug!("persist_to_indexeddb_event_based starting");

    // Use shared block_storage database for all SQLite databases
    let open_req = open_indexeddb("block_storage", 2)?;
    log::info!("Created open request for block_storage version 2");

    // Set up upgrade handler
    let upgrade_closure = Closure::wrap(Box::new(move |event: web_sys::Event| {
        log::debug!("IndexedDB upgrade handler called");

        match (|| -> Result<(), Box<dyn std::error::Error>> {
            let target = event.target().ok_or("No event target")?;
            log::debug!("Got event target in upgrade handler");

            let request: web_sys::IdbOpenDbRequest = target
                .dyn_into()
                .map_err(|_| "Failed to cast to IdbOpenDbRequest")?;
            log::debug!("Cast to IdbOpenDbRequest in upgrade handler");

            let result = request
                .result()
                .map_err(|_| "Failed to get result from request")?;
            log::debug!("Got result from request in upgrade handler");

            let db: web_sys::IdbDatabase = result
                .dyn_into()
                .map_err(|_| "Failed to cast result to IdbDatabase")?;
            log::debug!("Cast result to IdbDatabase in upgrade handler");

            if !db.object_store_names().contains("blocks") {
                db.create_object_store("blocks")
                    .map_err(|_| "Failed to create blocks store")?;
                log::info!("Created blocks object store");
            }
            if !db.object_store_names().contains("metadata") {
                db.create_object_store("metadata")
                    .map_err(|_| "Failed to create metadata store")?;
                log::info!("Created metadata object store");
            }

            log::info!("Upgrade handler completed successfully");
            Ok(())
        })() {
            Ok(_) => {}
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
        }
        Ok(Err(e)) => {
            log::error!("Database open error: {}", e);
            return Err(DatabaseError::new("INDEXEDDB_ERROR", &e));
        }
        Err(_) => {
            log::error!("Channel error while waiting for database");
            return Err(DatabaseError::new("INDEXEDDB_ERROR", "Channel error"));
        }
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
        return Err(DatabaseError::new(
            "INDEXEDDB_ERROR",
            "Required object stores not found",
        ));
    }

    // Acquire queue slot to prevent browser-level IndexedDB contention
    super::indexeddb_queue::acquire_indexeddb_slot().await;
    log::info!("Acquired IndexedDB transaction slot");

    // Guard to ensure slot is released on all exit paths (including errors)
    struct SlotGuard;
    impl Drop for SlotGuard {
        fn drop(&mut self) {
            super::indexeddb_queue::release_indexeddb_slot();
            web_sys::console::log_1(&"[GUARD] Released IndexedDB slot via guard".into());
        }
    }
    let _slot_guard = SlotGuard;

    // Start transaction
    let store_names = js_sys::Array::new();
    store_names.push(&"blocks".into());
    store_names.push(&"metadata".into());
    let transaction = db
        .transaction_with_str_sequence_and_mode(
            &store_names,
            web_sys::IdbTransactionMode::Readwrite,
        )
        .map_err(|e| {
            DatabaseError::new(
                "TRANSACTION_ERROR",
                &format!("Failed to create transaction: {:?}", e),
            )
        })?;
    log::info!("Created IndexedDB transaction");

    let blocks_store = transaction.object_store("blocks").map_err(|e| {
        DatabaseError::new(
            "STORE_ERROR",
            &format!("Failed to access blocks store: {:?}", e),
        )
    })?;
    let metadata_store = transaction.object_store("metadata").map_err(|e| {
        DatabaseError::new(
            "STORE_ERROR",
            &format!("Failed to access metadata store: {:?}", e),
        )
    })?;

    // Store blocks with truly idempotent keys: (db_name, block_id)
    // FIX: Removed checksum from key - updates now OVERWRITE instead of creating duplicates
    for (block_id, block_data) in &blocks {
        let key = format!("{}:{}", db_name, block_id);
        let value = js_sys::Uint8Array::from(&block_data[..]);
        #[cfg(target_arch = "wasm32")]
        {
            log::debug!("Storing block with idempotent key: {}", key);
            web_sys::console::log_1(
                &format!("[PERSIST] Writing block to IndexedDB with key: {}", key).into(),
            );
        }
        let _ = blocks_store.put_with_key(&value, &key.into());
    }

    // Store metadata with truly idempotent keys: (db_name, block_id)
    // Store the version/checksum as the VALUE, not in the KEY
    for (block_id, version) in metadata {
        let key = format!("{}:{}", db_name, block_id);
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

    // CRITICAL: Keep closures alive until await completes, then drop them
    // This allows proper cleanup of IDBDatabase reference
    // Note: _done_guard will drop when function returns, signaling next operation

    let result = match tx_rx.await {
        Ok(Ok(())) => {
            log::info!("IndexedDB persistence completed successfully");
            Ok(())
        }
        Ok(Err(e)) => Err(DatabaseError::new("INDEXEDDB_ERROR", &e)),
        Err(_) => Err(DatabaseError::new("INDEXEDDB_ERROR", "Channel error")),
    };

    // CRITICAL: Drop closures first to release references
    drop(complete_closure);
    drop(tx_error_closure);

    // CRITICAL: Close the IDBDatabase connection to allow subsequent opens
    // This MUST be done after tx_rx.await resolves (transaction complete)
    db.close();
    log::debug!("Closed IndexedDB connection after transaction completion");

    // Note: my_done_tx already sent signal right after DB opened (line 730)
    // This allows concurrent transactions while serializing DB opens

    result
}

/// Async version of sync for WASM that properly awaits IndexedDB persistence
#[cfg(target_arch = "wasm32")]
pub async fn sync_async(storage: &BlockStorage) -> Result<(), DatabaseError> {
    log::debug!("Using ASYNC sync_async method");
    // Get current commit marker
    let current_commit = vfs_sync::with_global_commit_marker(|cm| {
        let cm = cm;
        cm.borrow().get(&storage.db_name).copied().unwrap_or(0)
    });

    let next_commit = current_commit + 1;
    log::debug!(
        "Current commit marker for {}: {}",
        storage.db_name,
        current_commit
    );
    log::debug!(
        "Next commit marker for {}: {}",
        storage.db_name,
        next_commit
    );

    // Collect blocks to persist with commit marker gating and richer cache data logic
    let mut to_persist = Vec::new();
    let mut metadata_to_persist = Vec::new();

    // Collect cache data to iterate over (can't iterate over Mutex directly)
    let cache_snapshot: Vec<(u64, Vec<u8>)> = lock_mutex!(storage.cache)
        .iter()
        .map(|(k, v)| (*k, v.clone()))
        .collect();

    for (block_id, block_data) in cache_snapshot {
        let should_update = vfs_sync::with_global_storage(|storage_global| {
            let storage_global = storage_global;
            if let Some(db_storage) = storage_global.borrow().get(&storage.db_name) {
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
        log::debug!(
            "SYNC updating metadata for block {} to version {}",
            block_id,
            next_commit
        );
    }

    // Update global storage
    vfs_sync::with_global_storage(|storage_global| {
        let mut guard = storage_global.borrow_mut();
        let db_storage = guard
            .entry(storage.db_name.clone())
            .or_insert_with(std::collections::HashMap::new);
        for (block_id, block_data) in &to_persist {
            db_storage.insert(*block_id, block_data.clone());
        }
    });

    // Update global metadata
    vfs_sync::with_global_metadata(|metadata| {
        let mut guard = metadata.borrow_mut();
        let db_metadata = guard
            .entry(storage.db_name.clone())
            .or_insert_with(std::collections::HashMap::new);
        for (block_id, version) in &metadata_to_persist {
            db_metadata.insert(
                *block_id,
                BlockMetadataPersist {
                    version: *version as u32,
                    checksum: 0,
                    algo: ChecksumAlgorithm::FastHash,
                    last_modified_ms: js_sys::Date::now() as u64,
                },
            );
        }
    });

    // Update commit marker AFTER data and metadata are persisted
    vfs_sync::with_global_commit_marker(|cm| {
        let cm_map = cm;
        cm_map
            .borrow_mut()
            .insert(storage.db_name.clone(), next_commit);
    });

    // Perform IndexedDB persistence with proper event-based waiting
    if !to_persist.is_empty() {
        #[cfg(target_arch = "wasm32")]
        log::debug!(
            "Awaiting IndexedDB persistence for {} blocks",
            to_persist.len()
        );
        persist_to_indexeddb_event_based(
            &storage.db_name,
            to_persist,
            metadata_to_persist,
            next_commit,
            #[cfg(feature = "telemetry")]
            None,
            #[cfg(feature = "telemetry")]
            None,
        )
        .await?;
    }

    // Clear dirty blocks
    {
        let mut dirty = lock_mutex!(storage.dirty_blocks);
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
    log::debug!(
        "Converted HashMap to Vec, now have {} block entries",
        blocks_vec.len()
    );

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
    )
    .await;

    log::debug!(
        "persist_to_indexeddb_event_based completed with result: {:?}",
        result.is_ok()
    );

    result
}

/// Delete blocks from IndexedDB (used during crash recovery rollback)
/// Physically removes blocks to avoid accumulating orphaned data
#[cfg(target_arch = "wasm32")]
pub async fn delete_blocks_from_indexeddb(
    db_name: &str,
    block_ids: &[u64],
) -> Result<(), DatabaseError> {
    use futures::channel::oneshot;
    use wasm_bindgen::JsCast;
    use wasm_bindgen::closure::Closure;

    if block_ids.is_empty() {
        return Ok(());
    }

    log::debug!(
        "delete_blocks_from_indexeddb - deleting {} blocks for {}",
        block_ids.len(),
        db_name
    );

    let open_req = open_indexeddb("block_storage", 2)?;

    // Set up upgrade handler (should not be needed, but included for safety)
    let upgrade_closure = Closure::wrap(Box::new(move |event: web_sys::Event| {
        log::debug!("IndexedDB upgrade handler called during delete");

        match (|| -> Result<(), Box<dyn std::error::Error>> {
            let target = event.target().ok_or("No event target")?;
            let request: web_sys::IdbOpenDbRequest = target
                .dyn_into()
                .map_err(|_| "Failed to cast to IdbOpenDbRequest")?;
            let result = request
                .result()
                .map_err(|_| "Failed to get result from request")?;
            let db: web_sys::IdbDatabase = result
                .dyn_into()
                .map_err(|_| "Failed to cast result to IdbDatabase")?;

            if !db.object_store_names().contains("blocks") {
                db.create_object_store("blocks")
                    .map_err(|_| "Failed to create blocks store")?;
            }
            if !db.object_store_names().contains("metadata") {
                db.create_object_store("metadata")
                    .map_err(|_| "Failed to create metadata store")?;
            }

            Ok(())
        })() {
            Ok(_) => {}
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

    // Acquire queue slot to prevent browser-level IndexedDB contention
    super::indexeddb_queue::acquire_indexeddb_slot().await;
    log::info!("Acquired IndexedDB transaction slot for delete");

    // Guard to ensure slot is released on all exit paths
    struct SlotGuard;
    impl Drop for SlotGuard {
        fn drop(&mut self) {
            super::indexeddb_queue::release_indexeddb_slot();
            web_sys::console::log_1(&"[GUARD] Released IndexedDB slot via guard (delete)".into());
        }
    }
    let _slot_guard = SlotGuard;

    // Start transaction
    let store_names = js_sys::Array::new();
    store_names.push(&"blocks".into());
    store_names.push(&"metadata".into());
    let transaction = db
        .transaction_with_str_sequence_and_mode(
            &store_names,
            web_sys::IdbTransactionMode::Readwrite,
        )
        .map_err(|_| {
            DatabaseError::new("INDEXEDDB_ERROR", "Failed to create delete transaction")
        })?;

    let blocks_store = transaction
        .object_store("blocks")
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to get blocks store"))?;
    let metadata_store = transaction
        .object_store("metadata")
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to get metadata store"))?;

    // Delete all blocks and their metadata
    // FIX: Keys are now "db_name:block_id" (no version), so just delete directly
    for block_id in block_ids {
        let key = format!("{}:{}", db_name, block_id);

        #[cfg(target_arch = "wasm32")]
        web_sys::console::log_1(&format!("[DELETE] Deleting block key: {}", key).into());

        // Delete block
        let delete_result = blocks_store.delete(&JsValue::from_str(&key));
        if delete_result.is_err() {
            log::warn!("Failed to delete block key: {}", key);
        }

        // Delete metadata
        let meta_delete_result = metadata_store.delete(&JsValue::from_str(&key));
        if meta_delete_result.is_err() {
            log::warn!("Failed to delete metadata key: {}", key);
        }

        log::debug!("Deleted block {} from IndexedDB", block_id);
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
            log::info!(
                "Successfully deleted {} blocks from IndexedDB",
                block_ids.len()
            );
            Ok(())
        }
        Ok(Err(e)) => Err(DatabaseError::new("INDEXEDDB_ERROR", &e)),
        Err(_) => Err(DatabaseError::new(
            "INDEXEDDB_ERROR",
            "Channel error during deletion",
        )),
    }
}

/// Delete ALL blocks and metadata for a database from IndexedDB
///
/// Unlike `delete_blocks_from_indexeddb`, this function does NOT require knowing
/// the block IDs beforehand. It scans IndexedDB for all keys matching the database
/// name prefix and deletes them. This is essential for import operations where
/// the database was closed (clearing the allocation map) before import.
///
/// # Arguments
/// * `db_name` - Name of the database (without .db extension)
///
/// # Returns
/// * `Ok(())` - All blocks deleted successfully
/// * `Err(DatabaseError)` - If deletion fails
///
/// # Key Format
/// Blocks are stored with keys: `{db_name}:{block_id}`
/// This function deletes all keys starting with `{db_name}:`
#[cfg(target_arch = "wasm32")]
pub async fn delete_all_database_blocks_from_indexeddb(db_name: &str) -> Result<(), DatabaseError> {
    use futures::channel::oneshot;
    use wasm_bindgen::JsCast;
    use wasm_bindgen::closure::Closure;

    log::info!(
        "[DELETE_ALL] Starting deletion of ALL blocks for database: {}",
        db_name
    );
    web_sys::console::log_1(
        &format!(
            "[DELETE_ALL] Deleting all IndexedDB entries for: {}",
            db_name
        )
        .into(),
    );

    let open_req = open_indexeddb("block_storage", 2)?;

    // Set up upgrade handler (should not be needed, but included for safety)
    let upgrade_closure = Closure::wrap(Box::new(move |event: web_sys::Event| {
        match (|| -> Result<(), Box<dyn std::error::Error>> {
            let target = event.target().ok_or("No event target")?;
            let request: web_sys::IdbOpenDbRequest =
                target.dyn_into().map_err(|_| "Cast failed")?;
            let result = request.result().map_err(|_| "No result")?;
            let db: web_sys::IdbDatabase = result
                .dyn_into()
                .map_err(|_| "Cast to IdbDatabase failed")?;

            if !db.object_store_names().contains("blocks") {
                db.create_object_store("blocks")
                    .map_err(|_| "Create blocks store failed")?;
            }
            if !db.object_store_names().contains("metadata") {
                db.create_object_store("metadata")
                    .map_err(|_| "Create metadata store failed")?;
            }
            Ok(())
        })() {
            Ok(_) => {}
            Err(e) => log::error!("[DELETE_ALL] Upgrade handler error: {}", e),
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
        Err(_) => {
            return Err(DatabaseError::new(
                "INDEXEDDB_ERROR",
                "Channel error opening DB",
            ));
        }
    };

    // Acquire queue slot to prevent browser-level IndexedDB contention
    super::indexeddb_queue::acquire_indexeddb_slot().await;
    web_sys::console::log_1(&"[DELETE_ALL] Acquired IndexedDB slot".into());

    // Guard to ensure slot is released on all exit paths
    struct SlotGuard;
    impl Drop for SlotGuard {
        fn drop(&mut self) {
            super::indexeddb_queue::release_indexeddb_slot();
            web_sys::console::log_1(&"[DELETE_ALL] Released IndexedDB slot via guard".into());
        }
    }
    let _slot_guard = SlotGuard;

    // Start readwrite transaction on both stores
    let store_names = js_sys::Array::new();
    store_names.push(&"blocks".into());
    store_names.push(&"metadata".into());
    let transaction = db
        .transaction_with_str_sequence_and_mode(
            &store_names,
            web_sys::IdbTransactionMode::Readwrite,
        )
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to create transaction"))?;

    let blocks_store = transaction
        .object_store("blocks")
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to get blocks store"))?;
    let metadata_store = transaction
        .object_store("metadata")
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to get metadata store"))?;

    // Create key range for all entries with this database prefix
    // Keys are formatted as: {db_name}:{block_id}:{checksum}
    let key_prefix_start = format!("{}:", db_name);
    let key_prefix_end = format!("{}:\u{FFFF}", db_name);

    let key_range = web_sys::IdbKeyRange::bound(
        &key_prefix_start.clone().into(),
        &key_prefix_end.clone().into(),
    )
    .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to create key range"))?;

    web_sys::console::log_1(
        &format!(
            "[DELETE_ALL] Key range: {} to {}",
            key_prefix_start, key_prefix_end
        )
        .into(),
    );

    // Delete from blocks store using cursor
    let blocks_cursor_req = blocks_store
        .open_cursor_with_range(&key_range)
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to open blocks cursor"))?;

    let (blocks_tx, blocks_rx) = oneshot::channel::<Result<u32, String>>();
    let blocks_tx = std::rc::Rc::new(std::cell::RefCell::new(Some(blocks_tx)));
    let blocks_deleted = std::rc::Rc::new(std::cell::RefCell::new(0u32));

    let blocks_closure = {
        let blocks_tx = blocks_tx.clone();
        let blocks_deleted = blocks_deleted.clone();
        Closure::wrap(Box::new(move |event: web_sys::Event| {
            let target = event.target().unwrap();
            let request: web_sys::IdbRequest = target.unchecked_into();
            let result = request.result().unwrap();

            if !result.is_null() && !result.is_undefined() {
                let cursor: web_sys::IdbCursorWithValue = result.unchecked_into();

                // Log the key being deleted
                if let Ok(key) = cursor.key() {
                    if let Some(key_str) = key.as_string() {
                        web_sys::console::log_1(
                            &format!("[DELETE_ALL] Deleting block key: {}", key_str).into(),
                        );
                    }
                }

                // Delete and continue
                let _ = cursor.delete();
                *blocks_deleted.borrow_mut() += 1;
                let _ = cursor.continue_();
            } else {
                // Done iterating
                let count = *blocks_deleted.borrow();
                if let Some(sender) = blocks_tx.borrow_mut().take() {
                    let _ = sender.send(Ok(count));
                }
            }
        }) as Box<dyn FnMut(_)>)
    };

    let blocks_error_closure = {
        let blocks_tx = blocks_tx.clone();
        Closure::wrap(Box::new(move |_event: web_sys::Event| {
            if let Some(sender) = blocks_tx.borrow_mut().take() {
                let _ = sender.send(Err("Blocks cursor error".to_string()));
            }
        }) as Box<dyn FnMut(_)>)
    };

    blocks_cursor_req.set_onsuccess(Some(blocks_closure.as_ref().unchecked_ref()));
    blocks_cursor_req.set_onerror(Some(blocks_error_closure.as_ref().unchecked_ref()));
    blocks_closure.forget();
    blocks_error_closure.forget();

    let blocks_result = blocks_rx.await;
    let blocks_count = match blocks_result {
        Ok(Ok(count)) => count,
        Ok(Err(e)) => {
            log::error!("[DELETE_ALL] Error deleting blocks: {}", e);
            0
        }
        Err(_) => 0,
    };

    web_sys::console::log_1(&format!("[DELETE_ALL] Deleted {} blocks", blocks_count).into());

    // Delete from metadata store using same key range
    let metadata_cursor_req = metadata_store
        .open_cursor_with_range(&key_range)
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to open metadata cursor"))?;

    let (meta_tx, meta_rx) = oneshot::channel::<Result<u32, String>>();
    let meta_tx = std::rc::Rc::new(std::cell::RefCell::new(Some(meta_tx)));
    let meta_deleted = std::rc::Rc::new(std::cell::RefCell::new(0u32));

    let meta_closure = {
        let meta_tx = meta_tx.clone();
        let meta_deleted = meta_deleted.clone();
        Closure::wrap(Box::new(move |event: web_sys::Event| {
            let target = event.target().unwrap();
            let request: web_sys::IdbRequest = target.unchecked_into();
            let result = request.result().unwrap();

            if !result.is_null() && !result.is_undefined() {
                let cursor: web_sys::IdbCursorWithValue = result.unchecked_into();

                if let Ok(key) = cursor.key() {
                    if let Some(key_str) = key.as_string() {
                        web_sys::console::log_1(
                            &format!("[DELETE_ALL] Deleting metadata key: {}", key_str).into(),
                        );
                    }
                }

                let _ = cursor.delete();
                *meta_deleted.borrow_mut() += 1;
                let _ = cursor.continue_();
            } else {
                let count = *meta_deleted.borrow();
                if let Some(sender) = meta_tx.borrow_mut().take() {
                    let _ = sender.send(Ok(count));
                }
            }
        }) as Box<dyn FnMut(_)>)
    };

    let meta_error_closure = {
        let meta_tx = meta_tx.clone();
        Closure::wrap(Box::new(move |_event: web_sys::Event| {
            if let Some(sender) = meta_tx.borrow_mut().take() {
                let _ = sender.send(Err("Metadata cursor error".to_string()));
            }
        }) as Box<dyn FnMut(_)>)
    };

    metadata_cursor_req.set_onsuccess(Some(meta_closure.as_ref().unchecked_ref()));
    metadata_cursor_req.set_onerror(Some(meta_error_closure.as_ref().unchecked_ref()));
    meta_closure.forget();
    meta_error_closure.forget();

    let meta_result = meta_rx.await;
    let meta_count = match meta_result {
        Ok(Ok(count)) => count,
        Ok(Err(e)) => {
            log::error!("[DELETE_ALL] Error deleting metadata: {}", e);
            0
        }
        Err(_) => 0,
    };

    web_sys::console::log_1(
        &format!("[DELETE_ALL] Deleted {} metadata entries", meta_count).into(),
    );

    // Also delete the commit marker (stored with key "{db_name}_commit_marker")
    let commit_marker_key = format!("{}_commit_marker", db_name);
    web_sys::console::log_1(
        &format!("[DELETE_ALL] Deleting commit marker: {}", commit_marker_key).into(),
    );
    let _ = metadata_store.delete(&commit_marker_key.into());

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
        Ok(Ok(())) => {
            log::info!(
                "[DELETE_ALL] Successfully deleted all IndexedDB data for {}: {} blocks, {} metadata entries",
                db_name,
                blocks_count,
                meta_count
            );
            web_sys::console::log_1(
                &format!(
                    "[DELETE_ALL] Complete: {} blocks, {} metadata for {}",
                    blocks_count, meta_count, db_name
                )
                .into(),
            );
            Ok(())
        }
        Ok(Err(e)) => Err(DatabaseError::new("INDEXEDDB_ERROR", &e)),
        Err(_) => Err(DatabaseError::new(
            "INDEXEDDB_ERROR",
            "Channel error during delete all",
        )),
    }
}
