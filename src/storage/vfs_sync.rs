//! VFS Sync module extracted from block_storage.rs
//! This module contains the ACTUAL VFS sync and global storage management logic

use std::collections::{HashMap, HashSet};
use std::cell::RefCell;
#[allow(unused_imports)]
use crate::types::DatabaseError;
#[allow(unused_imports)]
use super::metadata::BlockMetadataPersist;

// Global storage for WASM to maintain data across instances
#[cfg(target_arch = "wasm32")]
thread_local! {
    pub static GLOBAL_STORAGE: RefCell<HashMap<String, HashMap<u64, Vec<u8>>>> = RefCell::new(HashMap::new());
    static GLOBAL_ALLOCATION_MAP: RefCell<HashMap<String, HashSet<u64>>> = RefCell::new(HashMap::new());
}

// Global storage mirrors for native builds
#[cfg(not(target_arch = "wasm32"))]
thread_local! {
    static GLOBAL_STORAGE_TEST: RefCell<HashMap<String, HashMap<u64, Vec<u8>>>> = RefCell::new(HashMap::new());
    static GLOBAL_ALLOCATION_MAP_TEST: RefCell<HashMap<String, HashSet<u64>>> = RefCell::new(HashMap::new());
}

#[cfg(target_arch = "wasm32")]
thread_local! {
    static GLOBAL_METADATA: RefCell<HashMap<String, HashMap<u64, BlockMetadataPersist>>> = RefCell::new(HashMap::new());
}
// Per-DB commit marker for WASM builds to simulate atomic commit semantics
#[cfg(target_arch = "wasm32")]
thread_local! {
    pub static GLOBAL_COMMIT_MARKER: RefCell<HashMap<String, u64>> = RefCell::new(HashMap::new());
}

// Global registry of active BlockStorage instances for VFS sync
#[cfg(target_arch = "wasm32")]
thread_local! {
    static STORAGE_REGISTRY: RefCell<HashMap<String, std::rc::Weak<std::cell::RefCell<super::BlockStorage>>>> = RefCell::new(HashMap::new());
}

/// Access to global storage for BlockStorage (internal use)
#[cfg(target_arch = "wasm32")]
pub fn with_global_storage<F, R>(f: F) -> R
where
    F: FnOnce(&RefCell<HashMap<String, HashMap<u64, Vec<u8>>>>) -> R
{
    GLOBAL_STORAGE.with(f)
}

#[cfg(not(target_arch = "wasm32"))]
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

#[cfg(not(target_arch = "wasm32"))]
pub fn with_global_metadata<F, R>(f: F) -> R
where
    F: FnOnce(&RefCell<HashMap<String, HashMap<u64, BlockMetadataPersist>>>) -> R
{
    // For native tests, use the shared GLOBAL_METADATA_TEST from block_storage
    use super::block_storage::GLOBAL_METADATA_TEST;
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

#[cfg(not(target_arch = "wasm32"))]
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

#[cfg(not(target_arch = "wasm32"))]
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