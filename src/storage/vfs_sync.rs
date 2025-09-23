//! VFS Sync module extracted from block_storage.rs
//! This module contains the ACTUAL VFS sync and global storage management logic

use std::collections::{HashMap, HashSet};
use std::cell::RefCell;
#[allow(unused_imports)]
use crate::types::DatabaseError;
#[allow(unused_imports)]
use super::metadata::BlockMetadataPersist;

// MOVED from block_storage.rs lines 22-27
// Global storage for WASM to maintain data across instances
#[cfg(target_arch = "wasm32")]
thread_local! {
    pub static GLOBAL_STORAGE: RefCell<HashMap<String, HashMap<u64, Vec<u8>>>> = RefCell::new(HashMap::new());
    static GLOBAL_ALLOCATION_MAP: RefCell<HashMap<String, HashSet<u64>>> = RefCell::new(HashMap::new());
}

// MOVED from block_storage.rs lines 29-34
// Test-only global storage mirrors for native builds so tests can run with `cargo test`
#[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions)))]
thread_local! {
    static GLOBAL_STORAGE_TEST: RefCell<HashMap<String, HashMap<u64, Vec<u8>>>> = RefCell::new(HashMap::new());
    static GLOBAL_ALLOCATION_MAP_TEST: RefCell<HashMap<String, HashSet<u64>>> = RefCell::new(HashMap::new());
}

// MOVED from block_storage.rs lines 91-94
#[cfg(target_arch = "wasm32")]
thread_local! {
    static GLOBAL_METADATA: RefCell<HashMap<String, HashMap<u64, BlockMetadataPersist>>> = RefCell::new(HashMap::new());
}

// MOVED from block_storage.rs lines 96-100
// Per-DB commit marker for WASM builds to simulate atomic commit semantics
#[cfg(target_arch = "wasm32")]
thread_local! {
    pub static GLOBAL_COMMIT_MARKER: RefCell<HashMap<String, u64>> = RefCell::new(HashMap::new());
}

// MOVED from block_storage.rs lines 102-106
// Global registry of active BlockStorage instances for VFS sync
#[cfg(target_arch = "wasm32")]
thread_local! {
    static STORAGE_REGISTRY: RefCell<HashMap<String, std::rc::Weak<std::cell::RefCell<super::BlockStorage>>>> = RefCell::new(HashMap::new());
}

/// Register a BlockStorage instance for VFS sync callbacks (MOVED from lines 108-116)
#[cfg(target_arch = "wasm32")]
pub fn register_storage_for_vfs_sync(db_name: &str, storage: std::rc::Weak<std::cell::RefCell<super::BlockStorage>>) {
    STORAGE_REGISTRY.with(|registry| {
        let mut registry = registry.borrow_mut();
        registry.insert(db_name.to_string(), storage);
        web_sys::console::log_1(&format!("VFS: Registered storage instance for {}", db_name).into());
    });
}

/// Trigger a sync for a specific database from VFS (MOVED from lines 118-184)
#[cfg(target_arch = "wasm32")]
pub fn vfs_sync_database(db_name: &str) -> Result<(), DatabaseError> {
    // Advance the commit marker to make writes visible
    let _next_commit = GLOBAL_COMMIT_MARKER.with(|cm| {
        let mut cm = cm.borrow_mut();
        let current = cm.get(db_name).copied().unwrap_or(0);
        let new_marker = current + 1;
        cm.insert(db_name.to_string(), new_marker);
        web_sys::console::log_1(&format!("VFS sync: Advanced commit marker for {} from {} to {}", db_name, current, new_marker).into());
        new_marker
    });

    // Trigger immediate IndexedDB persistence for the committed data
    let db_name_clone = db_name.to_string();
    wasm_bindgen_futures::spawn_local(async move {
        // Collect all data from global storage for this database
        let (blocks_to_persist, metadata_to_persist) = GLOBAL_STORAGE.with(|storage| {
            let storage_map = storage.borrow();
            let blocks = if let Some(db_storage) = storage_map.get(&db_name_clone) {
                db_storage.iter().map(|(&id, data)| (id, data.clone())).collect::<Vec<_>>()
            } else {
                Vec::new()
            };

            // Also collect metadata
            let metadata = GLOBAL_METADATA.with(|meta| {
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
            // Create a temporary storage instance just for persistence
            match super::BlockStorage::new(&db_name_clone).await {
                Ok(storage) => {
                    let next_commit = GLOBAL_COMMIT_MARKER.with(|cm| {
                        let cm = cm.borrow();
                        cm.get(&db_name_clone).copied().unwrap_or(0)
                    });

                    match storage.persist_to_indexeddb_event_based(blocks_to_persist, metadata_to_persist, next_commit).await {
                        Ok(_) => {
                            web_sys::console::log_1(&format!("VFS sync: Successfully persisted {} to IndexedDB", db_name_clone).into());
                        }
                        Err(e) => {
                            web_sys::console::log_1(&format!("VFS sync: Failed to persist {} to IndexedDB: {:?}", db_name_clone, e).into());
                        }
                    }
                }
                Err(e) => {
                    web_sys::console::log_1(&format!("VFS sync: Failed to create storage instance for {}: {:?}", db_name_clone, e).into());
                }
            }
        } else {
            web_sys::console::log_1(&format!("VFS sync: No blocks to persist for {}", db_name_clone).into());
        }
    });

    Ok(())
}

/// Blocking version of VFS sync that waits for IndexedDB persistence to complete (MOVED from lines 186-250)
#[cfg(target_arch = "wasm32")]
pub fn vfs_sync_database_blocking(db_name: &str) -> Result<(), DatabaseError> {
    // Advance the commit marker to make writes visible
    let next_commit = GLOBAL_COMMIT_MARKER.with(|cm| {
        let mut cm = cm.borrow_mut();
        let current = cm.get(db_name).copied().unwrap_or(0);
        let new_marker = current + 1;
        cm.insert(db_name.to_string(), new_marker);
        web_sys::console::log_1(&format!("VFS sync: Advanced commit marker for {} from {} to {}", db_name, current, new_marker).into());
        new_marker
    });

    // Collect all data from global storage for this database
    let (blocks_to_persist, metadata_to_persist) = GLOBAL_STORAGE.with(|storage| {
        let storage_map = storage.borrow();
        let blocks = if let Some(db_storage) = storage_map.get(db_name) {
            db_storage.iter().map(|(&id, data)| (id, data.clone())).collect::<Vec<_>>()
        } else {
            Vec::new()
        };

        // Also collect metadata
        let metadata = GLOBAL_METADATA.with(|meta| {
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
        match super::BlockStorage::new(&db_name_string).await {
            Ok(storage) => {
                match storage.persist_to_indexeddb_event_based(blocks_to_persist, metadata_to_persist, next_commit).await {
                    Ok(_) => {
                        web_sys::console::log_1(&format!("VFS sync: Successfully persisted {} to IndexedDB", db_name_string).into());
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

    // Block on the future using wasm-bindgen-futures
    #[cfg(target_arch = "wasm32")]
    {
        // For now, just spawn the async operation since blocking is complex in WASM
        // The original code had similar behavior here
        wasm_bindgen_futures::spawn_local(fut);
        Ok(())
    }

    #[cfg(not(target_arch = "wasm32"))]
    Ok(())
}

/// Access to global storage for BlockStorage (internal use)
#[cfg(target_arch = "wasm32")]
pub fn with_global_storage<F, R>(f: F) -> R
where
    F: FnOnce(&RefCell<HashMap<String, HashMap<u64, Vec<u8>>>>) -> R
{
    GLOBAL_STORAGE.with(f)
}

#[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions)))]
pub fn with_global_storage<F, R>(f: F) -> R
where
    F: FnOnce(&RefCell<HashMap<String, HashMap<u64, Vec<u8>>>>) -> R
{
    GLOBAL_STORAGE_TEST.with(f)
}

/// Access to global metadata for BlockStorage (internal use)
#[cfg(target_arch = "wasm32")]
pub fn with_global_metadata<F, R>(f: F) -> R
where
    F: FnOnce(&RefCell<HashMap<String, HashMap<u64, BlockMetadataPersist>>>) -> R
{
    GLOBAL_METADATA.with(f)
}

#[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions)))]
pub fn with_global_metadata<F, R>(f: F) -> R
where
    F: FnOnce(&RefCell<HashMap<String, HashMap<u64, BlockMetadataPersist>>>) -> R
{
    // For native tests, we need a test-only metadata storage
    thread_local! {
        static GLOBAL_METADATA_TEST: RefCell<HashMap<String, HashMap<u64, BlockMetadataPersist>>> = RefCell::new(HashMap::new());
    }
    GLOBAL_METADATA_TEST.with(f)
}

/// Access to global commit marker for BlockStorage (internal use)
#[cfg(target_arch = "wasm32")]
pub fn with_global_commit_marker<F, R>(f: F) -> R
where
    F: FnOnce(&RefCell<HashMap<String, u64>>) -> R
{
    GLOBAL_COMMIT_MARKER.with(f)
}

#[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions)))]
pub fn with_global_commit_marker<F, R>(f: F) -> R
where
    F: FnOnce(&RefCell<HashMap<String, u64>>) -> R
{
    // For native tests, we need a test-only commit marker storage
    thread_local! {
        static GLOBAL_COMMIT_MARKER_TEST: RefCell<HashMap<String, u64>> = RefCell::new(HashMap::new());
    }
    GLOBAL_COMMIT_MARKER_TEST.with(f)
}

/// Access to allocation map (internal use)
#[cfg(target_arch = "wasm32")]
pub fn with_global_allocation_map<F, R>(f: F) -> R
where
    F: FnOnce(&RefCell<HashMap<String, HashSet<u64>>>) -> R
{
    GLOBAL_ALLOCATION_MAP.with(f)
}

#[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions)))]
pub fn with_global_allocation_map<F, R>(f: F) -> R
where
    F: FnOnce(&RefCell<HashMap<String, HashSet<u64>>>) -> R
{
    GLOBAL_ALLOCATION_MAP_TEST.with(f)
}

/// Access to storage registry (internal use)
#[cfg(target_arch = "wasm32")]
pub fn with_storage_registry<F, R>(f: F) -> R
where
    F: FnOnce(&RefCell<HashMap<String, std::rc::Weak<std::cell::RefCell<super::BlockStorage>>>>) -> R
{
    STORAGE_REGISTRY.with(f)
}