//! WASM IndexedDB operations extracted from BlockStorage
//! This module contains WASM-specific IndexedDB functionality

#[cfg(target_arch = "wasm32")]
use super::metadata::{BlockMetadataPersist, ChecksumAlgorithm, ChecksumManager};
#[cfg(target_arch = "wasm32")]
use super::{BlockStorage, vfs_sync};
#[cfg(target_arch = "wasm32")]
use crate::types::DatabaseError;
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

#[cfg(target_arch = "wasm32")]
#[derive(Clone, Debug)]
pub(crate) struct PersistedMetadataEntry {
    pub metadata: BlockMetadataPersist,
    pub authoritative_checksum: bool,
}

#[cfg(target_arch = "wasm32")]
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
struct IndexedDbMetadataRecord {
    checksum: String,
    last_modified_ms: u64,
    version: u32,
    algo: ChecksumAlgorithm,
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

#[cfg(target_arch = "wasm32")]
fn parse_persisted_metadata_entry(value: &JsValue) -> Option<PersistedMetadataEntry> {
    if let Ok(record) = serde_wasm_bindgen::from_value::<IndexedDbMetadataRecord>(value.clone()) {
        if let Ok(checksum) = record.checksum.parse::<u64>() {
            return Some(PersistedMetadataEntry {
                metadata: BlockMetadataPersist {
                    checksum,
                    last_modified_ms: record.last_modified_ms,
                    version: record.version,
                    algo: record.algo,
                },
                authoritative_checksum: true,
            });
        }
    }

    if let Ok(metadata) = serde_wasm_bindgen::from_value::<BlockMetadataPersist>(value.clone()) {
        return Some(PersistedMetadataEntry {
            metadata,
            authoritative_checksum: true,
        });
    }

    value.as_f64().map(|version| PersistedMetadataEntry {
        metadata: BlockMetadataPersist {
            checksum: 0,
            last_modified_ms: 0,
            version: version as u32,
            algo: ChecksumAlgorithm::FastHash,
        },
        authoritative_checksum: false,
    })
}

#[cfg(target_arch = "wasm32")]
async fn await_open_db_request(
    request: web_sys::IdbOpenDbRequest,
) -> Result<web_sys::IdbDatabase, DatabaseError> {
    js_await_open(&request)
        .await
        .map_err(|error| indexeddb_error("Opening IndexedDB", error))
}

#[cfg(target_arch = "wasm32")]
fn indexeddb_error(operation: &str, error: JsValue) -> DatabaseError {
    let code = js_sys::Reflect::get(&error, &JsValue::from_str("name"))
        .ok()
        .and_then(|name| name.as_string())
        .unwrap_or_else(|| "INDEXEDDB_ERROR".to_string());
    DatabaseError::new(&code, &format!("{operation}: {error:?}"))
}

#[cfg(target_arch = "wasm32")]
struct OpenDatabase(web_sys::IdbDatabase);

#[cfg(target_arch = "wasm32")]
impl std::ops::Deref for OpenDatabase {
    type Target = web_sys::IdbDatabase;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[cfg(target_arch = "wasm32")]
impl Drop for OpenDatabase {
    fn drop(&mut self) {
        self.0.close();
    }
}

#[cfg(target_arch = "wasm32")]
async fn await_request_result(request: web_sys::IdbRequest) -> Result<JsValue, DatabaseError> {
    js_await_request(&request)
        .await
        .map_err(|error| indexeddb_error("Reading IndexedDB", error))
}

#[cfg(target_arch = "wasm32")]
pub(crate) async fn restore_metadata_from_indexeddb(
    db_name: &str,
    overwrite_existing: bool,
) -> Result<HashMap<u64, PersistedMetadataEntry>, DatabaseError> {
    use wasm_bindgen::JsCast;

    let mutex = INDEXEDDB_MUTEX.with(|m| m.borrow().clone());
    let _guard = mutex.lock().await;

    let open_req = open_indexeddb("block_storage", 2)?;
    let upgrade_closure =
        wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
            let target = event.target().unwrap();
            let request: web_sys::IdbOpenDbRequest = target.unchecked_into();
            let result = request.result().unwrap();
            let db: web_sys::IdbDatabase = result.unchecked_into();

            if !db.object_store_names().contains("blocks") {
                let _ = db.create_object_store("blocks");
            }
            if !db.object_store_names().contains("metadata") {
                let _ = db.create_object_store("metadata");
            }
        }) as Box<dyn FnMut(_)>);
    open_req.set_onupgradeneeded(Some(upgrade_closure.as_ref().unchecked_ref()));
    let db = OpenDatabase(await_open_db_request(open_req.clone()).await?);
    open_req.set_onupgradeneeded(None);
    let transaction = db.transaction_with_str("metadata").map_err(|_| {
        DatabaseError::new("INDEXEDDB_ERROR", "Failed to create metadata transaction")
    })?;
    let metadata_store = transaction
        .object_store("metadata")
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to get metadata store"))?;

    let commit_key = format!("{}:commit_marker", db_name);
    let commit_value = await_request_result(
        metadata_store
            .get(&commit_key.clone().into())
            .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to get commit marker"))?,
    )
    .await?;
    let commit_marker = commit_value.as_f64().map(|value| value as u64);

    let key_start = format!("{}:", db_name);
    let key_end = format!("{}:{}", db_name, char::from_u32(0xFFFF).unwrap());

    let key_range =
        web_sys::IdbKeyRange::bound(&JsValue::from_str(&key_start), &JsValue::from_str(&key_end))
            .map_err(|_| {
            DatabaseError::new("INDEXEDDB_ERROR", "Failed to create metadata key range")
        })?;

    let cursor_request = metadata_store
        .open_cursor_with_range(&key_range)
        .map_err(|_| DatabaseError::new("INDEXEDDB_ERROR", "Failed to open metadata cursor"))?;

    let (tx, rx) = futures::channel::oneshot::channel::<
        Result<HashMap<u64, PersistedMetadataEntry>, String>,
    >();
    let tx = std::rc::Rc::new(std::cell::RefCell::new(Some(tx)));
    let metadata_entries = std::rc::Rc::new(std::cell::RefCell::new(HashMap::new()));

    let entries_clone = metadata_entries.clone();
    let success_tx = tx.clone();
    let success_callback =
        wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
            let target = event.target().unwrap();
            let request: web_sys::IdbRequest = target.unchecked_into();
            let result = request.result().unwrap();

            if result.is_null() || result.is_undefined() {
                if let Some(tx) = success_tx.borrow_mut().take() {
                    let _ = tx.send(Ok(entries_clone.borrow().clone()));
                }
                return;
            }

            let cursor: web_sys::IdbCursorWithValue = result.unchecked_into();
            let key = cursor
                .key()
                .ok()
                .and_then(|value| value.as_string())
                .unwrap_or_default();

            if !key.ends_with(":commit_marker") {
                let parts: Vec<&str> = key.split(':').collect();
                if parts.len() >= 2 {
                    if let Ok(block_id) = parts[1].parse::<u64>() {
                        if let Some(entry) =
                            parse_persisted_metadata_entry(&cursor.value().unwrap())
                        {
                            entries_clone.borrow_mut().insert(block_id, entry);
                        }
                    }
                }
            }

            let _ = cursor.continue_();
        }) as Box<dyn FnMut(_)>);

    let error_tx = tx.clone();
    let error_callback =
        wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
            if let Some(tx) = error_tx.borrow_mut().take() {
                let _ = tx.send(Err(format!("Metadata cursor failed: {:?}", event)));
            }
        }) as Box<dyn FnMut(_)>);

    cursor_request.set_onsuccess(Some(success_callback.as_ref().unchecked_ref()));
    cursor_request.set_onerror(Some(error_callback.as_ref().unchecked_ref()));
    success_callback.forget();
    error_callback.forget();

    let metadata_entries = match rx.await {
        Ok(Ok(entries)) => entries,
        Ok(Err(error)) => return Err(DatabaseError::new("INDEXEDDB_ERROR", &error)),
        Err(_) => {
            return Err(DatabaseError::new(
                "INDEXEDDB_ERROR",
                "Channel error restoring metadata from IndexedDB",
            ));
        }
    };

    db.close();

    if let Some(commit_marker) = commit_marker {
        vfs_sync::with_global_commit_marker(|cm| {
            cm.borrow_mut().insert(db_name.to_string(), commit_marker);
        });
    }

    if !metadata_entries.is_empty() {
        let storage_snapshot = vfs_sync::with_global_storage(|storage_map| {
            storage_map
                .borrow()
                .get(db_name)
                .cloned()
                .unwrap_or_default()
        });

        let resolved_metadata = metadata_entries
            .iter()
            .map(|(&block_id, entry)| {
                let mut metadata = entry.metadata.clone();
                if !entry.authoritative_checksum {
                    if let Some(data) = storage_snapshot.get(&block_id) {
                        metadata.checksum =
                            ChecksumManager::compute_checksum_with(data, metadata.algo);
                    }
                }
                (block_id, metadata)
            })
            .collect::<HashMap<_, _>>();

        vfs_sync::with_global_metadata(|gm| {
            let mut metadata_map = gm.borrow_mut();
            if overwrite_existing {
                metadata_map.insert(db_name.to_string(), resolved_metadata.clone());
            } else {
                metadata_map
                    .entry(db_name.to_string())
                    .or_insert_with(HashMap::new)
                    .extend(resolved_metadata.clone());
            }
        });
    }

    Ok(metadata_entries)
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
    web_sys::console::log_1(&"[RESTORE] Acquiring IndexedDB mutex...".to_string().into());
    let _guard = mutex.lock().await;
    #[cfg(target_arch = "wasm32")]
    web_sys::console::log_1(
        &"[RESTORE] Mutex acquired, proceeding with restoration"
            .to_string()
            .into(),
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

    if existing_marker.is_some() && has_blocks && !force {
        log::debug!(
            "Blocks already loaded for {}, skipping restoration",
            db_name
        );
        return Ok(());
    }

    let open_req = open_indexeddb("block_storage", 2)?;
    let upgrade = wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
        let request: web_sys::IdbOpenDbRequest =
            event.target().expect("upgrade request").unchecked_into();
        let db: web_sys::IdbDatabase = request.result().expect("upgrade database").unchecked_into();
        for name in ["blocks", "metadata"] {
            if !db.object_store_names().contains(name) {
                if let Err(error) = db.create_object_store(name) {
                    log::error!("Cannot create IndexedDB store {}: {:?}", name, error);
                    if let Some(transaction) = request.transaction() {
                        if let Err(abort_error) = transaction.abort() {
                            log::error!("Cannot abort failed IndexedDB upgrade: {:?}", abort_error);
                        }
                    }
                }
            }
        }
    }) as Box<dyn FnMut(_)>);
    open_req.set_onupgradeneeded(Some(upgrade.as_ref().unchecked_ref()));
    let db = OpenDatabase(await_open_db_request(open_req.clone()).await?);
    open_req.set_onupgradeneeded(None);
    let transaction = db
        .transaction_with_str("metadata")
        .map_err(|error| indexeddb_error("Opening metadata transaction", error))?;
    let store = transaction
        .object_store("metadata")
        .map_err(|error| indexeddb_error("Opening metadata store", error))?;
    let request = store
        .get(&JsValue::from_str(&format!("{db_name}:commit_marker")))
        .map_err(|error| indexeddb_error("Reading commit marker", error))?;
    let value = await_request_result(request).await?;
    if value.is_undefined() || value.is_null() {
        if existing_marker.is_none() {
            log::debug!("No committed state found for {}", db_name);
            return Ok(());
        }
    } else {
        let marker = value
            .as_f64()
            .filter(|value| value.is_finite() && *value >= 0.0 && value.fract() == 0.0)
            .ok_or_else(|| {
                DatabaseError::new("INVALID_STATE_ERROR", "Invalid IndexedDB commit marker")
            })?;
        vfs_sync::with_global_commit_marker(|markers| {
            markers
                .borrow_mut()
                .insert(db_name.to_string(), marker as u64);
        });
    }
    restore_blocks_from_indexeddb(&db, db_name, force).await
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
                    if parts.len() >= 2 {
                        if let Ok(block_id) = parts[1].parse::<u64>() {
                            if let Some(entry) = parse_persisted_metadata_entry(&value) {
                                metadata_data_clone
                                    .borrow_mut()
                                    .push((block_id, entry.metadata));
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
    vfs_sync::with_global_metadata(|gm| {
        let mut meta_map = gm.borrow_mut();
        let db_meta = meta_map
            .entry(db_name.to_string())
            .or_insert_with(HashMap::new);

        for (block_id, restored_metadata) in &restored_metadata {
            let mut metadata = restored_metadata.clone();
            if metadata.checksum == 0 {
                if let Some((_, data)) = restored_blocks.iter().find(|(bid, _)| bid == block_id) {
                    metadata.checksum = ChecksumManager::compute_checksum_with(data, metadata.algo);
                }
            }
            db_meta.insert(*block_id, metadata);
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
    metadata: Vec<(u64, BlockMetadataPersist)>,
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

    let result = with_retry("persist_to_indexeddb", || {
        persist_to_indexeddb_event_based_internal(db_name, &blocks, &metadata, Some(commit_marker))
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
    blocks: &[(u64, Vec<u8>)],
    metadata: &[(u64, BlockMetadataPersist)],
    commit_marker: Option<u64>,
) -> Result<(), DatabaseError> {
    let mutex = INDEXEDDB_MUTEX.with(|m| m.borrow().clone());
    let _guard = mutex.lock().await;
    let factory = get_indexeddb_factory()?;
    let block_records = js_sys::Array::new();
    for (block_id, data) in blocks {
        let entry = js_sys::Array::new();
        entry.push(&format!("{db_name}:{block_id}").into());
        entry.push(&js_sys::Uint8Array::from(data.as_slice()));
        block_records.push(&entry);
    }
    let metadata_records = js_sys::Array::new();
    for (block_id, metadata) in metadata {
        let mut metadata = metadata.clone();
        if let Some(marker) = commit_marker {
            metadata.version = u32::try_from(marker).unwrap_or(u32::MAX);
        }
        if metadata.last_modified_ms == 0 {
            metadata.last_modified_ms = js_sys::Date::now() as u64;
        }
        let record = IndexedDbMetadataRecord {
            checksum: metadata.checksum.to_string(),
            last_modified_ms: metadata.last_modified_ms,
            version: metadata.version,
            algo: metadata.algo,
        };
        let value = serde_wasm_bindgen::to_value(&record).map_err(|error| {
            DatabaseError::new(
                "INDEXEDDB_ERROR",
                &format!("Cannot serialize metadata for {db_name}:{block_id}: {error}"),
            )
        })?;
        let entry = js_sys::Array::new();
        entry.push(&format!("{db_name}:{block_id}").into());
        entry.push(&value);
        metadata_records.push(&entry);
    }
    if let Some(marker) = commit_marker {
        let entry = js_sys::Array::new();
        entry.push(&format!("{db_name}:commit_marker").into());
        entry.push(&JsValue::from_f64(marker as f64));
        metadata_records.push(&entry);
    }
    super::indexeddb_queue::acquire_indexeddb_slot().await;
    struct SlotGuard;
    impl Drop for SlotGuard {
        fn drop(&mut self) {
            super::indexeddb_queue::release_indexeddb_slot();
        }
    }
    let _slot = SlotGuard;
    js_write_batch(&factory, &block_records, &metadata_records)
        .await
        .map_err(|error| indexeddb_error(&format!("Failed to persist {db_name}"), error))
}

/// Async version of sync for WASM that properly awaits IndexedDB persistence
#[cfg(target_arch = "wasm32")]
pub async fn sync_async(storage: &BlockStorage) -> Result<(), DatabaseError> {
    log::debug!("Using ASYNC sync_async method");
    let sync_started_ms = js_sys::Date::now();
    // Get current commit marker
    let current_commit = vfs_sync::with_global_commit_marker(|cm| {
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

    // Persist the actual dirty set. Global storage is only the in-memory mirror,
    // so equality with cache must not suppress durable backend writes.
    let to_persist: Vec<(u64, Vec<u8>)> = lock_mutex!(storage.dirty_blocks)
        .iter()
        .map(|(k, v)| (*k, v.clone()))
        .collect();
    let blocks_synced = to_persist.len();
    storage.observability.record_sync_start(
        blocks_synced,
        blocks_synced * super::block_storage::BLOCK_SIZE,
    );

    let metadata_to_persist: Vec<(u64, BlockMetadataPersist)> = to_persist
        .iter()
        .map(|(block_id, block_data)| {
            let checksum = storage
                .checksum_manager
                .get_checksum(*block_id)
                .unwrap_or_else(|| {
                    ChecksumManager::compute_checksum_with(
                        block_data,
                        storage.checksum_manager.get_algorithm(*block_id),
                    )
                });
            (
                *block_id,
                BlockMetadataPersist {
                    version: next_commit as u32,
                    checksum,
                    algo: storage.checksum_manager.get_algorithm(*block_id),
                    last_modified_ms: js_sys::Date::now() as u64,
                },
            )
        })
        .collect();

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
        for (block_id, metadata) in &metadata_to_persist {
            db_metadata.insert(*block_id, metadata.clone());
        }
    });

    // Update commit marker AFTER data and metadata are persisted
    vfs_sync::with_global_commit_marker(|cm| {
        let cm_map = cm;
        cm_map
            .borrow_mut()
            .insert(storage.db_name.clone(), next_commit);
    });

    // Persist to the active browser backend and await completion.
    if !to_persist.is_empty() {
        let backend = storage.storage_backend();
        #[cfg(target_arch = "wasm32")]
        log::debug!(
            "Awaiting {} persistence for {} blocks",
            backend.as_str(),
            to_persist.len()
        );
        match backend {
            crate::storage::StorageBackend::IndexedDb => {
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
                .await
                .inspect_err(|error| {
                    storage.observability.record_sync_failure(error);
                })?;
            }
            crate::storage::StorageBackend::Opfs | crate::storage::StorageBackend::Hybrid => {
                super::hybrid_store::hybrid_persist(
                    &storage.db_name,
                    to_persist,
                    metadata_to_persist,
                    next_commit,
                    #[cfg(feature = "telemetry")]
                    None,
                    #[cfg(feature = "telemetry")]
                    None,
                )
                .await
                .inspect_err(|error| {
                    storage.observability.record_sync_failure(error);
                })?;
            }
        }
    }

    // Clear dirty blocks
    {
        let mut dirty = lock_mutex!(storage.dirty_blocks);
        dirty.clear();
    }

    let duration_ms = ((js_sys::Date::now() - sync_started_ms).ceil() as u64).max(1);
    storage
        .observability
        .record_sync_success(duration_ms, blocks_synced);

    Ok(())
}

/// Simplified IndexedDB persistence for crash simulation
/// Writes blocks and metadata to IndexedDB without advancing commit marker
#[cfg(target_arch = "wasm32")]
pub async fn persist_to_indexeddb(
    db_name: &str,
    blocks: std::collections::HashMap<u64, Vec<u8>>,
    metadata: Vec<(u64, BlockMetadataPersist)>,
) -> Result<(), DatabaseError> {
    log::debug!("persist_to_indexeddb called for {} blocks", blocks.len());

    // Convert HashMap to Vec for the existing function
    let blocks_vec: Vec<(u64, Vec<u8>)> = blocks.into_iter().collect();
    log::debug!(
        "Converted HashMap to Vec, now have {} block entries",
        blocks_vec.len()
    );

    log::debug!("About to persist crash simulation data without a commit marker");

    let result =
        super::retry_logic::with_retry("persist_to_indexeddb_without_commit_marker", || {
            persist_to_indexeddb_event_based_internal(db_name, &blocks_vec, &metadata, None)
        })
        .await;

    log::debug!(
        "Crash simulation persistence completed with result: {:?}",
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

// Keep cursor callbacks in one browser task chain: awaiting between stores can
// let IndexedDB auto-commit before the second cursor is queued.
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen::prelude::wasm_bindgen(inline_js = r#"
export function absurd_idb_await_open(request) {
  return new Promise((resolve, reject) => {
    let settled = false;
    request.addEventListener('upgradeneeded', () => {
      if (settled) request.transaction.abort();
    });
    request.onsuccess = () => {
      try {
        const db = request.result;
        if (settled) db.close();
        else { settled = true; resolve(db); }
      } catch (error) { settled = true; reject(error); }
    };
    request.onerror = () => { settled = true; reject(request.error); };
    request.onblocked = () => {
      settled = true;
      request.onupgradeneeded = null;
      const error = new Error('IndexedDB open blocked by another connection');
      error.name = 'IndexedDBBlockedError';
      reject(error);
    };
  });
}

export function absurd_idb_await_request(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      try { resolve(request.result); } catch (error) { reject(error); }
    };
    request.onerror = () => reject(request.error);
  });
}

function absurd_idb_transaction(factory, enqueue) {
  return new Promise((resolve, reject) => {
    const request = factory.open('block_storage', 2);
    let settled = false;
    let failure;
    const fail = error => {
      settled = true;
      reject(error);
    };
    request.onblocked = () => fail(new Error('IndexedDB transaction blocked by an open connection'));
    request.onerror = () => fail(failure || request.error);
    request.onupgradeneeded = () => {
      if (settled) {
        request.transaction.abort();
        return;
      }
      try {
        const db = request.result;
        if (!db.objectStoreNames.contains('blocks')) db.createObjectStore('blocks');
        if (!db.objectStoreNames.contains('metadata')) db.createObjectStore('metadata');
      } catch (error) {
        failure = error;
        request.transaction.abort();
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      if (settled) {
        db.close();
        return;
      }
      let transaction;
      const abort = error => {
        failure ||= error;
        if (transaction) {
          try {
            transaction.abort();
            return;
          } catch (abortError) {
            failure = new Error(String(error) + '; abort failed: ' + String(abortError));
          }
        }
        db.close();
        fail(failure);
      };
      try {
        transaction = db.transaction(['blocks', 'metadata'], 'readwrite');
        transaction.oncomplete = () => {
          db.close();
          settled = true;
          resolve();
        };
        transaction.onerror = event => {
          failure ||= event.target.error || new Error('IndexedDB request failed');
        };
        transaction.onabort = () => {
          db.close();
          fail(failure || transaction.error || new Error('IndexedDB transaction aborted'));
        };
        enqueue(transaction, abort);
      } catch (error) {
        abort(error);
      }
    };
  });
}

export function absurd_idb_write_batch(factory, blocks, metadata) {
  return absurd_idb_transaction(factory, transaction => {
    const blockStore = transaction.objectStore('blocks');
    const metadataStore = transaction.objectStore('metadata');
    for (const [key, value] of blocks) blockStore.put(value, key);
    for (const [key, value] of metadata) metadataStore.put(value, key);
  });
}

export function absurd_idb_delete_namespace(factory, dbName) {
  return absurd_idb_transaction(factory, (transaction, abort) => {
        const prefix = dbName + ':';
        const range = IDBKeyRange.bound(prefix, prefix + '\uffff');
        for (const storeName of ['blocks', 'metadata']) {
          const store = transaction.objectStore(storeName);
          const cursorRequest = store.openCursor(range);
          cursorRequest.onsuccess = () => {
            try {
              const cursor = cursorRequest.result;
              if (!cursor) return;
              const suffix = cursor.key.slice(prefix.length);
              // Numeric block IDs, including legacy checksum/version suffixes.
              // A neighboring database name may itself contain the ':' separator.
              if (/^[0-9]+(?::[0-9]+)?$/.test(suffix) ||
                  (storeName === 'metadata' && suffix === 'commit_marker')) {
                cursor.delete();
              }
              cursor.continue();
            } catch (error) {
              abort(error);
            }
          };
        }
        transaction.objectStore('metadata').delete(dbName + '_commit_marker');
  });
}
"#)]
extern "C" {
    #[wasm_bindgen::prelude::wasm_bindgen(js_name = absurd_idb_await_open, catch)]
    async fn js_await_open(
        request: &web_sys::IdbOpenDbRequest,
    ) -> Result<web_sys::IdbDatabase, JsValue>;

    #[wasm_bindgen::prelude::wasm_bindgen(js_name = absurd_idb_await_request, catch)]
    async fn js_await_request(request: &web_sys::IdbRequest) -> Result<JsValue, JsValue>;

    #[wasm_bindgen::prelude::wasm_bindgen(js_name = absurd_idb_write_batch, catch)]
    async fn js_write_batch(
        factory: &web_sys::IdbFactory,
        blocks: &js_sys::Array,
        metadata: &js_sys::Array,
    ) -> Result<(), JsValue>;

    #[wasm_bindgen::prelude::wasm_bindgen(js_name = absurd_idb_delete_namespace, catch)]
    async fn js_delete_namespace(
        factory: &web_sys::IdbFactory,
        db_name: &str,
    ) -> Result<(), JsValue>;
}

/// Atomically delete a database's blocks, metadata, and commit markers.
///
/// Uses the normalized `.db` namespace, independently of the in-memory allocation
/// map. Both stores are queued before yielding; only transaction completion can
/// acknowledge erasure. Neighboring namespaces, including prefix matches, survive.
#[cfg(target_arch = "wasm32")]
pub async fn delete_all_database_blocks_from_indexeddb(db_name: &str) -> Result<(), DatabaseError> {
    let db_name = crate::utils::normalize_db_name(db_name);
    let factory = get_indexeddb_factory()?;
    super::indexeddb_queue::acquire_indexeddb_slot().await;
    struct SlotGuard;
    impl Drop for SlotGuard {
        fn drop(&mut self) {
            super::indexeddb_queue::release_indexeddb_slot();
        }
    }
    let _slot_guard = SlotGuard;
    js_delete_namespace(&factory, &db_name)
        .await
        .map_err(|error| {
            DatabaseError::new(
                "INDEXEDDB_ERROR",
                &format!("Failed to delete {}: {:?}", db_name, error),
            )
        })?;
    log::info!("Deleted all IndexedDB data for {}", db_name);
    Ok(())
}
