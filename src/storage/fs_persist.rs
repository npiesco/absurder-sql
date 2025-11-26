// Reentrancy-safe lock macros
#[allow(unused_macros)]
#[cfg(target_arch = "wasm32")]
macro_rules! lock_mutex {
    ($mutex:expr) => {
        $mutex
            .try_borrow_mut()
            .expect("RefCell borrow failed - reentrancy detected in fs_persist.rs")
    };
}

#[allow(unused_macros)]
#[cfg(not(target_arch = "wasm32"))]
macro_rules! lock_mutex {
    ($mutex:expr) => {
        $mutex.lock()
    };
}

#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
use super::metadata::{BlockMetadataPersist, ChecksumAlgorithm};
#[cfg(any(
    target_arch = "wasm32",
    all(
        not(target_arch = "wasm32"),
        any(test, debug_assertions),
        not(feature = "fs_persist")
    )
))]
#[allow(unused_imports)]
use super::vfs_sync;
#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
use crate::types::DatabaseError;
#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
use std::collections::HashMap;
#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
use std::sync::atomic::Ordering;
#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
use std::time::Instant;
#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
use std::{
    env, fs,
    io::{Read, Write},
    path::PathBuf,
};

// On-disk JSON schema for fs_persist
#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
#[derive(serde::Serialize, serde::Deserialize, Default)]
#[allow(dead_code)]
pub(super) struct FsMeta {
    pub entries: Vec<(u64, BlockMetadataPersist)>,
}

#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
#[derive(serde::Serialize, serde::Deserialize, Default)]
#[allow(dead_code)]
pub(super) struct FsAlloc {
    pub allocated: Vec<u64>,
}

#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
#[derive(serde::Serialize, serde::Deserialize, Default)]
#[allow(dead_code)]
pub(super) struct FsDealloc {
    pub tombstones: Vec<u64>,
}

impl super::BlockStorage {
    /// Native fs_persist sync implementation
    #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
    pub(super) fn fs_persist_sync(&mut self) -> Result<(), DatabaseError> {
        // Record sync start for observability
        let dirty_count = lock_mutex!(self.dirty_blocks).len();
        let dirty_bytes = dirty_count * super::BLOCK_SIZE;
        self.observability
            .record_sync_start(dirty_count, dirty_bytes);

        // Invoke sync start callback if set
        if let Some(ref callback) = self.observability.sync_start_callback {
            callback(dirty_count, dirty_bytes);
        }

        // In fs_persist mode, proactively ensure directory structure and empty metadata.json exists
        // even if there are no dirty blocks, to satisfy filesystem expectations in tests.
        #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
        {
            let base: PathBuf = self.base_dir.clone();
            let mut db_dir = base.clone();
            db_dir.push(&self.db_name);
            let mut blocks_dir = db_dir.clone();
            blocks_dir.push("blocks");
            let _ = fs::create_dir_all(&blocks_dir);
            let mut meta_path = db_dir.clone();
            meta_path.push("metadata.json");
            if fs::metadata(&meta_path).is_err() {
                if let Ok(mut f) = fs::File::create(&meta_path) {
                    let _ = f.write_all(br#"{"entries":[]}"#);
                }
            }
        }

        if self.get_dirty_blocks().lock().is_empty() {
            log::debug!("No dirty blocks to sync");
            #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
            {
                // Cleanup-only sync: reconcile on-disk state with current allocations
                let base: PathBuf = self.base_dir.clone();
                let mut db_dir = base.clone();
                db_dir.push(&self.db_name);
                let mut blocks_dir = db_dir.clone();
                blocks_dir.push("blocks");
                // Load metadata.json (do not prune based on allocated; retain all persisted entries),
                // normalize invalid/missing algo values to the current default
                let mut meta_path = db_dir.clone();
                meta_path.push("metadata.json");
                let mut meta_val: serde_json::Value = serde_json::json!({"entries": []});
                if let Ok(mut f) = fs::File::open(&meta_path) {
                    let mut s = String::new();
                    if f.read_to_string(&mut s).is_ok() {
                        if let Ok(v) = serde_json::from_str::<serde_json::Value>(&s) {
                            meta_val = v;
                        }
                    }
                }
                // Ensure structure exists
                if !meta_val.is_object() {
                    meta_val = serde_json::json!({"entries": []});
                }
                // Normalize per-entry algo values if missing/invalid
                if let Some(entries) = meta_val.get_mut("entries").and_then(|e| e.as_array_mut()) {
                    for ent in entries.iter_mut() {
                        if let Some(arr) = ent.as_array_mut() {
                            if arr.len() == 2 {
                                if let Some(obj) = arr.get_mut(1).and_then(|v| v.as_object_mut()) {
                                    let ok = obj
                                        .get("algo")
                                        .and_then(|v| v.as_str())
                                        .map(|s| s == "FastHash" || s == "CRC32")
                                        .unwrap_or(false);
                                    if !ok {
                                        let def = match self.checksum_manager.default_algorithm() {
                                            ChecksumAlgorithm::CRC32 => "CRC32",
                                            _ => "FastHash",
                                        };
                                        obj.insert(
                                            "algo".into(),
                                            serde_json::Value::String(def.into()),
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
                let meta_string = serde_json::to_string(&meta_val).unwrap_or_else(|_| "{}".into());
                let allocated: std::collections::HashSet<u64> =
                    lock_mutex!(self.allocated_blocks).clone();
                // Write metadata via commit marker: metadata.json.pending -> metadata.json
                let mut meta_pending = db_dir.clone();
                meta_pending.push("metadata.json.pending");
                log::debug!(
                    "[fs_persist] cleanup-only: writing pending metadata at {:?}",
                    meta_pending
                );
                if let Ok(mut f) = fs::File::create(&meta_pending) {
                    let _ = f.write_all(meta_string.as_bytes());
                    let _ = f.sync_all();
                }
                let _ = fs::rename(&meta_pending, &meta_path);
                log::debug!(
                    "[fs_persist] cleanup-only: finalized metadata rename to {:?}",
                    meta_path
                );
                let mut alloc_path = db_dir.clone();
                alloc_path.push("allocations.json");
                let mut alloc = FsAlloc::default();
                alloc.allocated = allocated.iter().cloned().collect();
                alloc.allocated.sort_unstable();
                if let Ok(mut f) = fs::File::create(&alloc_path) {
                    let _ = f.write_all(
                        serde_json::to_string(&alloc)
                            .unwrap_or_else(|_| "{}".into())
                            .as_bytes(),
                    );
                }
                log::info!("wrote allocations.json at {:?}", alloc_path);
                // Remove stray block files not allocated
                // Determine valid block ids from metadata; remove files that have no metadata entry
                let valid_ids: std::collections::HashSet<u64> =
                    if let Some(entries) = meta_val.get("entries").and_then(|e| e.as_array()) {
                        entries
                            .iter()
                            .filter_map(|ent| {
                                ent.as_array()
                                    .and_then(|arr| arr.get(0))
                                    .and_then(|v| v.as_u64())
                            })
                            .collect()
                    } else {
                        std::collections::HashSet::new()
                    };
                if let Ok(entries) = fs::read_dir(&blocks_dir) {
                    for entry in entries.flatten() {
                        if let Ok(ft) = entry.file_type() {
                            if ft.is_file() {
                                if let Some(name) = entry.file_name().to_str() {
                                    if let Some(id_str) = name
                                        .strip_prefix("block_")
                                        .and_then(|s| s.strip_suffix(".bin"))
                                    {
                                        if let Ok(id) = id_str.parse::<u64>() {
                                            if !valid_ids.contains(&id) {
                                                let _ = fs::remove_file(entry.path());
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Also mirror cleanup to the current ABSURDERSQL_FS_BASE at sync-time to avoid env var race conditions across tests
                let alt_base: PathBuf = {
                    if let Ok(p) = env::var("ABSURDERSQL_FS_BASE") {
                        PathBuf::from(p)
                    } else if cfg!(any(test, debug_assertions)) {
                        PathBuf::from(format!(".absurdersql_fs/run_{}", std::process::id()))
                    } else {
                        PathBuf::from(".absurdersql_fs")
                    }
                };
                if alt_base != self.base_dir {
                    let mut alt_db_dir = alt_base.clone();
                    alt_db_dir.push(&self.db_name);
                    let mut alt_blocks_dir = alt_db_dir.clone();
                    alt_blocks_dir.push("blocks");
                    let _ = fs::create_dir_all(&alt_blocks_dir);
                    // alt metadata via commit marker
                    let mut alt_meta_pending = alt_db_dir.clone();
                    alt_meta_pending.push("metadata.json.pending");
                    log::debug!(
                        "[fs_persist] cleanup-only (alt): writing pending metadata at {:?}",
                        alt_meta_pending
                    );
                    if let Ok(mut f) = fs::File::create(&alt_meta_pending) {
                        let _ = f.write_all(meta_string.as_bytes());
                        let _ = f.sync_all();
                    }
                    let mut alt_meta_path = alt_db_dir.clone();
                    alt_meta_path.push("metadata.json");
                    let _ = fs::rename(&alt_meta_pending, &alt_meta_path);
                    log::debug!(
                        "[fs_persist] cleanup-only (alt): finalized metadata rename to {:?}",
                        alt_meta_path
                    );
                    let mut alt_alloc_path = alt_db_dir.clone();
                    alt_alloc_path.push("allocations.json");
                    if let Ok(mut f) = fs::File::create(&alt_alloc_path) {
                        let _ = f.write_all(
                            serde_json::to_string(&alloc)
                                .unwrap_or_else(|_| "{}".into())
                                .as_bytes(),
                        );
                    }
                    log::info!("(alt) wrote allocations.json at {:?}", alt_alloc_path);
                    if let Ok(entries) = fs::read_dir(&alt_blocks_dir) {
                        for entry in entries.flatten() {
                            if let Ok(ft) = entry.file_type() {
                                if ft.is_file() {
                                    if let Some(name) = entry.file_name().to_str() {
                                        if let Some(id_str) = name
                                            .strip_prefix("block_")
                                            .and_then(|s| s.strip_suffix(".bin"))
                                        {
                                            if let Ok(id) = id_str.parse::<u64>() {
                                                if !valid_ids.contains(&id) {
                                                    let _ = fs::remove_file(entry.path());
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return Ok(());
        }

        let current_dirty = self.get_dirty_blocks().lock().len();
        log::info!("Syncing {} dirty blocks", current_dirty);

        // For WASM, persist dirty blocks to global storage
        #[cfg(target_arch = "wasm32")]
        {
            let to_persist: Vec<(u64, Vec<u8>)> = {
                let dirty = self.get_dirty_blocks().lock();
                dirty.iter().map(|(k, v)| (*k, v.clone())).collect()
            };
            let ids: Vec<u64> = to_persist.iter().map(|(k, _)| *k).collect();
            // Determine next commit version so that all metadata written in this sync share the same version
            let next_commit: u64 = vfs_sync::with_global_commit_marker(|cm| {
                let cm = cm;
                let current = cm.get(&self.db_name).copied().unwrap_or(0);
                #[cfg(target_arch = "wasm32")]
                log::debug!("Current commit marker for {}: {}", self.db_name, current);
                current + 1
            });
            #[cfg(target_arch = "wasm32")]
            log::debug!("Next commit marker for {}: {}", self.db_name, next_commit);
            vfs_sync::with_global_storage(|storage| {
                let mut storage_map = storage.lock();
                let db_storage = storage_map
                    .entry(self.db_name.clone())
                    .or_insert_with(HashMap::new);
                for (block_id, data) in &to_persist {
                    // Check if block already exists in global storage with committed data
                    let should_update = if let Some(existing) = db_storage.get(block_id) {
                        if existing != data {
                            // Check if existing data has committed metadata (version > 0)
                            let has_committed_metadata = vfs_sync::with_global_metadata(|meta| {
                                let meta_map = meta.borrow_mut();
                                if let Some(db_meta) = meta_map.get(&self.db_name) {
                                    if let Some(metadata) = db_meta.get(block_id) {
                                        metadata.version > 0
                                    } else {
                                        false
                                    }
                                } else {
                                    false
                                }
                            });

                            let existing_preview = if existing.len() >= 8 {
                                format!(
                                    "{:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x}",
                                    existing[0],
                                    existing[1],
                                    existing[2],
                                    existing[3],
                                    existing[4],
                                    existing[5],
                                    existing[6],
                                    existing[7]
                                )
                            } else {
                                "short".to_string()
                            };
                            let new_preview = if data.len() >= 8 {
                                format!(
                                    "{:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x}",
                                    data[0],
                                    data[1],
                                    data[2],
                                    data[3],
                                    data[4],
                                    data[5],
                                    data[6],
                                    data[7]
                                )
                            } else {
                                "short".to_string()
                            };

                            if has_committed_metadata {
                                // CRITICAL FIX: Never overwrite committed data to prevent corruption
                                // Once data is committed, it should be immutable to maintain data integrity
                                #[cfg(target_arch = "wasm32")]
                                log::debug!(
                                    "SYNC preserving committed block {} - existing: {}, cache: {} - NEVER OVERWRITE COMMITTED DATA",
                                    block_id,
                                    existing_preview,
                                    new_preview
                                );
                                false // Never overwrite committed data
                            } else {
                                #[cfg(target_arch = "wasm32")]
                                log::debug!(
                                    "SYNC updating uncommitted block {} - existing: {}, new: {}",
                                    block_id,
                                    existing_preview,
                                    new_preview
                                );
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
                let db_meta = meta_map
                    .entry(self.db_name.clone())
                    .or_insert_with(HashMap::new);
                for block_id in ids {
                    if let Some(checksum) = self.checksum_manager.get_checksum(block_id) {
                        // Use the per-commit version so entries remain invisible until the commit marker advances
                        let version = next_commit as u32;
                        db_meta.insert(
                            block_id,
                            BlockMetadataPersist {
                                checksum,
                                last_modified_ms: Self::now_millis(),
                                version,
                                algo: self.checksum_manager.get_algorithm(block_id),
                            },
                        );
                        log::debug!("Persisted metadata for block {}", block_id);
                    }
                }
            });
            // Atomically advance the commit marker after all data and metadata are persisted
            vfs_sync::with_global_commit_marker(|cm| {
                let cm_map = cm;
                cm_map.insert(self.db_name.clone(), next_commit);
            });

            // Spawn async IndexedDB persistence (fire and forget for sync compatibility)
            #[cfg(target_arch = "wasm32")]
            log::debug!(
                "Spawning IndexedDB persistence for {} blocks",
                to_persist.len()
            );
            let db_name = self.db_name.clone();
            wasm_bindgen_futures::spawn_local(async move {
                use wasm_bindgen::JsCast;

                // Get IndexedDB factory (works in both Window and Worker contexts)
                let global = js_sys::global();
                let indexed_db_value = match js_sys::Reflect::get(
                    &global,
                    &wasm_bindgen::JsValue::from_str("indexedDB"),
                ) {
                    Ok(val) => val,
                    Err(_) => {
                        log::error!("IndexedDB property access failed - cannot persist");
                        return;
                    }
                };

                if indexed_db_value.is_null() || indexed_db_value.is_undefined() {
                    log::warn!(
                        "IndexedDB unavailable for persistence (private browsing?) - data not persisted to IndexedDB"
                    );
                    return;
                }

                let idb_factory = match indexed_db_value.dyn_into::<web_sys::IdbFactory>() {
                    Ok(factory) => factory,
                    Err(_) => {
                        log::error!("IndexedDB property is not an IdbFactory - cannot persist");
                        return;
                    }
                };

                let open_req = match idb_factory.open_with_u32("block_storage", 2) {
                    Ok(req) => req,
                    Err(e) => {
                        log::error!("Failed to open IndexedDB for persistence: {:?}", e);
                        return;
                    }
                };

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
                let success_callback =
                    wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
                        if let Some(tx) = success_tx.lock().take() {
                            let target = event.target().unwrap();
                            let request: web_sys::IdbOpenDbRequest = target.unchecked_into();
                            let result = request.result().unwrap();
                            let _ = tx.send(Ok(result));
                        }
                    })
                        as Box<dyn FnMut(_)>);

                let error_tx = tx.clone();
                let error_callback =
                    wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
                        if let Some(tx) = error_tx.lock().take() {
                            let _ = tx.send(Err(format!("IndexedDB open failed: {:?}", event)));
                        }
                    })
                        as Box<dyn FnMut(_)>);

                open_req.set_onsuccess(Some(success_callback.as_ref().unchecked_ref()));
                open_req.set_onerror(Some(error_callback.as_ref().unchecked_ref()));

                let db_result = rx.await;

                // Keep closures alive
                success_callback.forget();
                error_callback.forget();

                match db_result {
                    Ok(Ok(db_value)) => {
                        #[cfg(target_arch = "wasm32")]
                        log::info!("Successfully opened IndexedDB for persistence");
                        if let Ok(db) = db_value.dyn_into::<web_sys::IdbDatabase>() {
                            // Start transaction for both blocks and metadata
                            let store_names = js_sys::Array::new();
                            store_names.push(&wasm_bindgen::JsValue::from_str("blocks"));
                            store_names.push(&wasm_bindgen::JsValue::from_str("metadata"));

                            let transaction = db
                                .transaction_with_str_sequence_and_mode(
                                    &store_names,
                                    web_sys::IdbTransactionMode::Readwrite,
                                )
                                .unwrap();

                            let blocks_store = transaction.object_store("blocks").unwrap();
                            let metadata_store = transaction.object_store("metadata").unwrap();

                            // Persist all blocks
                            for (block_id, data) in &to_persist {
                                let key = wasm_bindgen::JsValue::from_str(&format!(
                                    "{}_{}",
                                    db_name, block_id
                                ));
                                let value = js_sys::Uint8Array::from(&data[..]);
                                blocks_store.put_with_key(&value, &key).unwrap();
                                #[cfg(target_arch = "wasm32")]
                                log::debug!("Persisted block {} to IndexedDB", block_id);
                            }

                            // Persist commit marker
                            let commit_key = wasm_bindgen::JsValue::from_str(&format!(
                                "{}_commit_marker",
                                db_name
                            ));
                            let commit_value = wasm_bindgen::JsValue::from_f64(next_commit as f64);
                            metadata_store
                                .put_with_key(&commit_value, &commit_key)
                                .unwrap();
                            #[cfg(target_arch = "wasm32")]
                            log::info!("Persisted commit marker {} to IndexedDB", next_commit);

                            // Use event-based approach for transaction completion
                            let (tx_tx, tx_rx) = futures::channel::oneshot::channel();
                            let tx_tx = std::rc::Rc::new(std::cell::RefCell::new(Some(tx_tx)));

                            let tx_complete_tx = tx_tx.clone();
                            let tx_complete_callback = wasm_bindgen::closure::Closure::wrap(
                                Box::new(move |_event: web_sys::Event| {
                                    if let Some(tx) = tx_complete_tx.lock().take() {
                                        let _ = tx.send(Ok(()));
                                    }
                                }) as Box<dyn FnMut(_)>,
                            );

                            let tx_error_tx = tx_tx.clone();
                            let tx_error_callback = wasm_bindgen::closure::Closure::wrap(Box::new(
                                move |event: web_sys::Event| {
                                    if let Some(tx) = tx_error_tx.lock().take() {
                                        let _ = tx
                                            .send(Err(format!("Transaction failed: {:?}", event)));
                                    }
                                },
                            )
                                as Box<dyn FnMut(_)>);

                            transaction.set_oncomplete(Some(
                                tx_complete_callback.as_ref().unchecked_ref(),
                            ));
                            transaction
                                .set_onerror(Some(tx_error_callback.as_ref().unchecked_ref()));

                            match tx_rx.await {
                                Ok(Ok(_)) => {
                                    #[cfg(target_arch = "wasm32")]
                                    log::info!("IndexedDB transaction completed successfully");
                                }
                                Ok(Err(e)) => {
                                    #[cfg(target_arch = "wasm32")]
                                    log::error!("IndexedDB transaction failed: {}", e);
                                }
                                Err(_) => {
                                    #[cfg(target_arch = "wasm32")]
                                    log::error!("IndexedDB transaction channel failed");
                                }
                            }

                            // Keep closures alive
                            tx_complete_callback.forget();
                            tx_error_callback.forget();
                        } else {
                            #[cfg(target_arch = "wasm32")]
                            log::error!("Failed to cast to IdbDatabase for persistence");
                        }
                    }
                    Ok(Err(e)) => {
                        #[cfg(target_arch = "wasm32")]
                        log::error!("Failed to open IndexedDB for persistence: {}", e);
                    }
                    Err(_) => {
                        #[cfg(target_arch = "wasm32")]
                        log::error!("IndexedDB open channel failed");
                    }
                }
            });
        }

        // For native fs_persist, write dirty blocks to disk and update metadata.json
        #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
        {
            let to_persist: Vec<(u64, Vec<u8>)> = {
                let dirty = self.get_dirty_blocks().lock();
                dirty.iter().map(|(k, v)| (*k, v.clone())).collect()
            };
            let now_ms = Self::now_millis();
            let base: PathBuf = self.base_dir.clone();
            let mut db_dir = base.clone();
            db_dir.push(&self.db_name);
            let mut blocks_dir = db_dir.clone();
            blocks_dir.push("blocks");
            let mut meta_path = db_dir.clone();
            meta_path.push("metadata.json");
            // Ensure dirs exist
            let _ = fs::create_dir_all(&blocks_dir);
            // Load existing metadata tolerantly and build a JSON object map keyed by id
            let mut meta_val: serde_json::Value = serde_json::json!({"entries": []});
            if let Ok(mut f) = fs::File::open(&meta_path) {
                let mut s = String::new();
                if f.read_to_string(&mut s).is_ok() {
                    if let Ok(v) = serde_json::from_str::<serde_json::Value>(&s) {
                        meta_val = v;
                    }
                }
            }
            if !meta_val.is_object() {
                meta_val = serde_json::json!({"entries": []});
            }
            let mut map: HashMap<u64, serde_json::Map<String, serde_json::Value>> = HashMap::new();
            if let Some(entries) = meta_val.get("entries").and_then(|e| e.as_array()) {
                for ent in entries.iter() {
                    if let Some(arr) = ent.as_array() {
                        if arr.len() == 2 {
                            if let (Some(id), Some(obj)) = (
                                arr.get(0).and_then(|v| v.as_u64()),
                                arr.get(1).and_then(|v| v.as_object()),
                            ) {
                                map.insert(id, obj.clone());
                            }
                        }
                    }
                }
            }
            for (block_id, data) in &to_persist {
                // write block file
                let mut block_file = blocks_dir.clone();
                block_file.push(format!("block_{}.bin", block_id));
                if let Ok(mut f) = fs::File::create(&block_file) {
                    let _ = f.write_all(data);
                }
                // update metadata
                if let Some(checksum) = self.checksum_manager.get_checksum(*block_id) {
                    let version_u64 = map
                        .get(block_id)
                        .and_then(|m| m.get("version"))
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0)
                        .saturating_add(1);
                    let algo = self.checksum_manager.get_algorithm(*block_id);
                    let algo_str = match algo {
                        ChecksumAlgorithm::CRC32 => "CRC32",
                        _ => "FastHash",
                    };
                    let mut obj = serde_json::Map::new();
                    obj.insert("checksum".into(), serde_json::Value::from(checksum));
                    obj.insert("last_modified_ms".into(), serde_json::Value::from(now_ms));
                    obj.insert(
                        "version".into(),
                        serde_json::Value::from(version_u64 as u64),
                    );
                    obj.insert("algo".into(), serde_json::Value::String(algo_str.into()));
                    map.insert(*block_id, obj);
                }
            }
            // Normalize any remaining entries with missing/invalid algo
            for (_id, obj) in map.iter_mut() {
                let ok = obj
                    .get("algo")
                    .and_then(|v| v.as_str())
                    .map(|s| s == "FastHash" || s == "CRC32")
                    .unwrap_or(false);
                if !ok {
                    let def = match self.checksum_manager.default_algorithm() {
                        ChecksumAlgorithm::CRC32 => "CRC32",
                        _ => "FastHash",
                    };
                    obj.insert("algo".into(), serde_json::Value::String(def.into()));
                }
            }
            // Do not prune metadata based on allocated set; preserve entries for all persisted blocks
            let allocated: std::collections::HashSet<u64> =
                lock_mutex!(self.allocated_blocks).clone();
            // Save metadata (build entries array [[id, obj], ...])
            let mut entries_vec: Vec<serde_json::Value> = Vec::new();
            for (id, obj) in map.iter() {
                entries_vec.push(serde_json::Value::Array(vec![
                    serde_json::Value::from(*id),
                    serde_json::Value::Object(obj.clone()),
                ]));
            }
            let meta_out = serde_json::json!({"entries": entries_vec});
            let meta_string = serde_json::to_string(&meta_out).unwrap_or_else(|_| "{}".into());
            // Write metadata via commit marker: metadata.json.pending -> metadata.json
            let mut meta_pending = db_dir.clone();
            meta_pending.push("metadata.json.pending");
            log::debug!(
                "[fs_persist] writing pending metadata at {:?}",
                meta_pending
            );
            if let Ok(mut f) = fs::File::create(&meta_pending) {
                let _ = f.write_all(meta_string.as_bytes());
                let _ = f.sync_all();
            }
            let _ = fs::rename(&meta_pending, &meta_path);
            log::debug!("[fs_persist] finalized metadata rename to {:?}", meta_path);
            // Mirror allocations.json to current allocated set
            let mut alloc_path = db_dir.clone();
            alloc_path.push("allocations.json");
            let mut alloc = FsAlloc::default();
            alloc.allocated = allocated.iter().cloned().collect();
            alloc.allocated.sort_unstable();
            if let Ok(mut f) = fs::File::create(&alloc_path) {
                let _ = f.write_all(
                    serde_json::to_string(&alloc)
                        .unwrap_or_else(|_| "{}".into())
                        .as_bytes(),
                );
            }
            log::info!("wrote allocations.json at {:?}", alloc_path);
            // Remove any stray block files for deallocated blocks
            // Determine valid ids from metadata; remove files without a metadata entry
            let valid_ids: std::collections::HashSet<u64> = map.keys().cloned().collect();
            if let Ok(entries) = fs::read_dir(&blocks_dir) {
                for entry in entries.flatten() {
                    if let Ok(ft) = entry.file_type() {
                        if ft.is_file() {
                            if let Some(name) = entry.file_name().to_str() {
                                if let Some(id_str) = name
                                    .strip_prefix("block_")
                                    .and_then(|s| s.strip_suffix(".bin"))
                                {
                                    if let Ok(id) = id_str.parse::<u64>() {
                                        if !valid_ids.contains(&id) {
                                            let _ = fs::remove_file(entry.path());
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Also mirror persistence to the current ABSURDERSQL_FS_BASE at sync-time, to avoid env var race issues
            let alt_base: PathBuf = {
                if let Ok(p) = env::var("ABSURDERSQL_FS_BASE") {
                    PathBuf::from(p)
                } else if cfg!(any(test, debug_assertions)) {
                    PathBuf::from(format!(".absurdersql_fs/run_{}", std::process::id()))
                } else {
                    PathBuf::from(".absurdersql_fs")
                }
            };
            if alt_base != self.base_dir {
                let mut alt_db_dir = alt_base.clone();
                alt_db_dir.push(&self.db_name);
                let mut alt_blocks_dir = alt_db_dir.clone();
                alt_blocks_dir.push("blocks");
                let _ = fs::create_dir_all(&alt_blocks_dir);
                // Write blocks
                let alt_to_persist: Vec<(u64, Vec<u8>)> = {
                    let dirty = self.get_dirty_blocks().lock();
                    dirty.iter().map(|(k, v)| (*k, v.clone())).collect()
                };
                for (block_id, data) in alt_to_persist.iter() {
                    let mut alt_block_file = alt_blocks_dir.clone();
                    alt_block_file.push(format!("block_{}.bin", block_id));
                    if let Ok(mut f) = fs::File::create(&alt_block_file) {
                        let _ = f.write_all(&data);
                    }
                }
                // Save metadata mirror
                let mut alt_meta_pending = alt_db_dir.clone();
                alt_meta_pending.push("metadata.json.pending");
                log::debug!(
                    "[fs_persist] (alt) writing pending metadata at {:?}",
                    alt_meta_pending
                );
                if let Ok(mut f) = fs::File::create(&alt_meta_pending) {
                    let _ = f.write_all(meta_string.as_bytes());
                    let _ = f.sync_all();
                }
                let mut alt_meta_path = alt_db_dir.clone();
                alt_meta_path.push("metadata.json");
                let _ = fs::rename(&alt_meta_pending, &alt_meta_path);
                log::debug!(
                    "[fs_persist] (alt) finalized metadata rename to {:?}",
                    alt_meta_path
                );
                // allocations mirror
                let mut alt_alloc_path = alt_db_dir.clone();
                alt_alloc_path.push("allocations.json");
                if let Ok(mut f) = fs::File::create(&alt_alloc_path) {
                    let _ = f.write_all(
                        serde_json::to_string(&alloc)
                            .unwrap_or_else(|_| "{}".into())
                            .as_bytes(),
                    );
                }
                log::info!("(alt) wrote allocations.json at {:?}", alt_alloc_path);
                // cleanup stray files
                if let Ok(entries) = fs::read_dir(&alt_blocks_dir) {
                    for entry in entries.flatten() {
                        if let Ok(ft) = entry.file_type() {
                            if ft.is_file() {
                                if let Some(name) = entry.file_name().to_str() {
                                    if let Some(id_str) = name
                                        .strip_prefix("block_")
                                        .and_then(|s| s.strip_suffix(".bin"))
                                    {
                                        if let Ok(id) = id_str.parse::<u64>() {
                                            if !valid_ids.contains(&id) {
                                                let _ = fs::remove_file(entry.path());
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // For native tests, persist dirty blocks and metadata to test globals (when fs_persist disabled)
        #[cfg(all(
            not(target_arch = "wasm32"),
            any(test, debug_assertions),
            not(feature = "fs_persist")
        ))]
        {
            let to_persist: Vec<(u64, Vec<u8>)> = {
                let dirty = self.get_dirty_blocks().lock();
                dirty.iter().map(|(k, v)| (*k, v.clone())).collect()
            };
            let ids: Vec<u64> = to_persist.iter().map(|(k, _)| *k).collect();
            // Determine next commit version for the test-global path
            let next_commit: u64 = vfs_sync::with_global_commit_marker(|cm| {
                let cm = cm;
                cm.get(&self.db_name).copied().unwrap_or(0) + 1
            });
            vfs_sync::with_global_storage(|storage| {
                let mut storage_map = storage.lock();
                let db_storage = storage_map
                    .entry(self.db_name.clone())
                    .or_insert_with(HashMap::new);
                for (block_id, data) in &to_persist {
                    db_storage.insert(*block_id, data.clone());
                    log::debug!("[test] Persisted block {} to test-global storage", block_id);
                }
            });
            // Persist corresponding metadata entries
            GLOBAL_METADATA_TEST.with(|meta| {
                let mut meta_map = meta.borrow_mut();
                let db_meta = meta_map
                    .entry(self.db_name.clone())
                    .or_insert_with(HashMap::new);
                for block_id in ids {
                    if let Some(checksum) = self.checksum_manager.get_checksum(block_id) {
                        let version = next_commit as u32;
                        db_meta.insert(
                            block_id,
                            BlockMetadataPersist {
                                checksum,
                                last_modified_ms: Self::now_millis(),
                                version,
                                algo: self.checksum_manager.get_algorithm(block_id),
                            },
                        );
                        log::debug!("[test] Persisted metadata for block {}", block_id);
                    }
                }
            });
            // Advance commit marker after persisting all entries
            vfs_sync::with_global_commit_marker(|cm| {
                let cm_map = cm;
                cm_map.insert(self.db_name.clone(), next_commit);
            });
        }

        #[cfg(not(target_arch = "wasm32"))]
        let start = Instant::now();
        let dirty_count = {
            let mut dirty = self.get_dirty_blocks().lock();
            let count = dirty.len();
            dirty.clear();
            count
        };
        log::info!(
            "Successfully synced {} blocks to global storage",
            dirty_count
        );
        #[cfg(not(target_arch = "wasm32"))]
        {
            self.sync_count.fetch_add(1, Ordering::SeqCst);
            let elapsed = start.elapsed();
            let ms = elapsed.as_millis() as u64;
            let ms = if ms == 0 { 1 } else { ms };
            self.last_sync_duration_ms.store(ms, Ordering::SeqCst);

            // Record sync success for observability
            self.observability.record_sync_success(ms, dirty_count);

            // Invoke sync success callback if set
            if let Some(ref callback) = self.observability.sync_success_callback {
                callback(ms, dirty_count);
            }
        }
        // Now that everything is clean, enforce capacity again
        self.evict_if_needed();
        Ok(())
    }
}
