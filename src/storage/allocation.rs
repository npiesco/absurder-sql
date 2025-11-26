//! Block allocation and deallocation operations
//! This module handles the lifecycle management of blocks

// Reentrancy-safe lock macros
#[cfg(target_arch = "wasm32")]
macro_rules! lock_mutex {
    ($mutex:expr) => {
        $mutex
            .try_borrow_mut()
            .expect("RefCell borrow failed - reentrancy detected in allocation.rs")
    };
}

#[cfg(not(target_arch = "wasm32"))]
macro_rules! lock_mutex {
    ($mutex:expr) => {
        $mutex.lock()
    };
}

use super::block_storage::BlockStorage;
use crate::types::DatabaseError;
#[cfg(any(
    target_arch = "wasm32",
    all(
        not(target_arch = "wasm32"),
        any(test, debug_assertions),
        not(feature = "fs_persist")
    )
))]
use std::collections::HashSet;
use std::sync::atomic::Ordering;

#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
use std::{
    fs,
    io::{Read, Write},
    path::PathBuf,
};

#[cfg(target_arch = "wasm32")]
use super::vfs_sync;

#[cfg(all(
    not(target_arch = "wasm32"),
    any(test, debug_assertions),
    not(feature = "fs_persist")
))]
use super::vfs_sync;

#[cfg(all(
    not(target_arch = "wasm32"),
    any(test, debug_assertions),
    not(feature = "fs_persist")
))]
use super::block_storage::GLOBAL_METADATA_TEST;

// On-disk JSON schema for fs_persist
#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
#[derive(serde::Serialize, serde::Deserialize, Default)]
#[allow(dead_code)]
struct FsAlloc {
    allocated: Vec<u64>,
}

#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
#[derive(serde::Serialize, serde::Deserialize, Default)]
#[allow(dead_code)]
struct FsDealloc {
    tombstones: Vec<u64>,
}

/// Allocate a new block and return its ID
pub async fn allocate_block_impl(storage: &mut BlockStorage) -> Result<u64, DatabaseError> {
    // Find the next available block ID and atomically increment
    let block_id = storage.next_block_id.fetch_add(1, Ordering::SeqCst);

    // Mark block as allocated
    lock_mutex!(storage.allocated_blocks).insert(block_id);

    // For WASM, persist allocation state to global storage
    #[cfg(target_arch = "wasm32")]
    {
        vfs_sync::with_global_allocation_map(|allocation_map| {
            let mut map = allocation_map.borrow_mut();
            let db_allocations = map
                .entry(storage.db_name.clone())
                .or_insert_with(HashSet::new);
            db_allocations.insert(block_id);
        });
    }

    // fs_persist: mirror allocation to allocations.json
    #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
    {
        let base: PathBuf = storage.base_dir.clone();
        let mut db_dir = base.clone();
        db_dir.push(&storage.db_name);
        let _ = fs::create_dir_all(&db_dir);
        // Proactively ensure blocks directory exists so tests can observe it immediately after first sync
        let mut blocks_dir = db_dir.clone();
        blocks_dir.push("blocks");
        let _ = fs::create_dir_all(&blocks_dir);
        let mut alloc_path = db_dir.clone();
        alloc_path.push("allocations.json");
        // load existing
        let mut alloc = FsAlloc::default();
        if let Ok(mut f) = fs::File::open(&alloc_path) {
            let mut s = String::new();
            if f.read_to_string(&mut s).is_ok() {
                let _ = serde_json::from_str::<FsAlloc>(&s).map(|a| {
                    alloc = a;
                });
            }
        }
        if !alloc.allocated.contains(&block_id) {
            alloc.allocated.push(block_id);
        }
        if let Ok(mut f) = fs::File::create(&alloc_path) {
            let _ = f.write_all(
                serde_json::to_string(&alloc)
                    .unwrap_or_else(|_| "{}".into())
                    .as_bytes(),
            );
        }

        // Remove any tombstone (block was reallocated) and persist deallocated.json
        let mut dealloc_path = db_dir.clone();
        dealloc_path.push("deallocated.json");
        lock_mutex!(storage.deallocated_blocks).remove(&block_id);
        let mut dealloc = FsDealloc::default();
        // best effort read to preserve any existing entries
        if let Ok(mut f) = fs::File::open(&dealloc_path) {
            let mut s = String::new();
            if f.read_to_string(&mut s).is_ok() {
                let _ = serde_json::from_str::<FsDealloc>(&s).map(|d| {
                    dealloc = d;
                });
            }
        }
        dealloc.tombstones = lock_mutex!(storage.deallocated_blocks)
            .iter()
            .cloned()
            .collect();
        dealloc.tombstones.sort_unstable();
        if let Ok(mut f) = fs::File::create(&dealloc_path) {
            let _ = f.write_all(
                serde_json::to_string(&dealloc)
                    .unwrap_or_else(|_| "{}".into())
                    .as_bytes(),
            );
        }
    }

    // For native tests, mirror allocation state to test-global (when fs_persist disabled)
    #[cfg(all(
        not(target_arch = "wasm32"),
        any(test, debug_assertions),
        not(feature = "fs_persist")
    ))]
    {
        vfs_sync::with_global_allocation_map(|allocation_map| {
            let mut map = allocation_map.borrow_mut();
            let db_allocations = map
                .entry(storage.db_name.clone())
                .or_insert_with(HashSet::new);
            db_allocations.insert(block_id);
        });
    }

    // Track allocation in telemetry
    #[cfg(feature = "telemetry")]
    if let Some(ref metrics) = storage.metrics {
        metrics.blocks_allocated_total().inc();
        // Update memory gauge: total allocated blocks × BLOCK_SIZE
        let total_memory = (lock_mutex!(storage.allocated_blocks).len() as f64)
            * (super::block_storage::BLOCK_SIZE as f64);
        metrics.memory_bytes().set(total_memory);
    }

    log::info!(
        "Allocated block: {} (total allocated: {})",
        block_id,
        lock_mutex!(storage.allocated_blocks).len()
    );
    Ok(block_id)
}

/// Deallocate a block and mark it as available for reuse
pub async fn deallocate_block_impl(
    storage: &mut BlockStorage,
    block_id: u64,
) -> Result<(), DatabaseError> {
    // Check if block is actually allocated
    if !lock_mutex!(storage.allocated_blocks).contains(&block_id) {
        return Err(DatabaseError::new(
            "BLOCK_NOT_ALLOCATED",
            &format!("Block {} is not allocated", block_id),
        ));
    }

    // Remove from allocated set
    lock_mutex!(storage.allocated_blocks).remove(&block_id);

    // Clear from cache and dirty blocks
    lock_mutex!(storage.cache).remove(&block_id);
    lock_mutex!(storage.dirty_blocks).remove(&block_id);
    // Remove checksum metadata
    storage.checksum_manager.remove_checksum(block_id);

    // For WASM, remove from global storage
    #[cfg(target_arch = "wasm32")]
    {
        vfs_sync::with_global_storage(|storage_map| {
            if let Some(db_storage) = storage_map.borrow_mut().get_mut(&storage.db_name) {
                db_storage.remove(&block_id);
            }
        });

        vfs_sync::with_global_allocation_map(|allocation_map| {
            if let Some(db_allocations) = allocation_map.borrow_mut().get_mut(&storage.db_name) {
                db_allocations.remove(&block_id);
            }
        });

        // Remove persisted metadata entry as well
        vfs_sync::with_global_metadata(|meta_map| {
            if let Some(db_meta) = meta_map.borrow_mut().get_mut(&storage.db_name) {
                db_meta.remove(&block_id);
            }
        });
    }

    // For native fs_persist, remove files and update JSON stores
    #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
    {
        let base: PathBuf = storage.base_dir.clone();
        let mut db_dir = base.clone();
        db_dir.push(&storage.db_name);
        let mut blocks_dir = db_dir.clone();
        blocks_dir.push("blocks");
        let mut block_path = blocks_dir.clone();
        block_path.push(format!("block_{}.bin", block_id));
        let _ = fs::remove_file(&block_path);

        // update allocations.json
        let mut alloc_path = db_dir.clone();
        alloc_path.push("allocations.json");
        let mut alloc = FsAlloc::default();
        if let Ok(mut f) = fs::File::open(&alloc_path) {
            let mut s = String::new();
            if f.read_to_string(&mut s).is_ok() {
                let _ = serde_json::from_str::<FsAlloc>(&s).map(|a| {
                    alloc = a;
                });
            }
        }
        alloc.allocated.retain(|&id| id != block_id);
        if let Ok(mut f) = fs::File::create(&alloc_path) {
            let _ = f.write_all(
                serde_json::to_string(&alloc)
                    .unwrap_or_else(|_| "{}".into())
                    .as_bytes(),
            );
        }

        // update metadata.json (remove entry)
        let mut meta_path = db_dir.clone();
        meta_path.push("metadata.json");
        // Tolerant JSON handling: remove entry with matching id from entries array
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
        if let Some(entries) = meta_val.get_mut("entries").and_then(|v| v.as_array_mut()) {
            entries.retain(|ent| {
                ent.as_array()
                    .and_then(|arr| arr.first())
                    .and_then(|v| v.as_u64())
                    .map(|bid| bid != block_id)
                    .unwrap_or(true)
            });
        }
        let meta_string = serde_json::to_string(&meta_val).unwrap_or_else(|_| "{}".into());
        if let Ok(mut f) = fs::File::create(&meta_path) {
            let _ = f.write_all(meta_string.as_bytes());
        }

        // Append to deallocated tombstones and persist deallocated.json
        let mut dealloc_path = db_dir.clone();
        dealloc_path.push("deallocated.json");
        lock_mutex!(storage.deallocated_blocks).insert(block_id);
        let mut dealloc = FsDealloc::default();
        if let Ok(mut f) = fs::File::open(&dealloc_path) {
            let mut s = String::new();
            if f.read_to_string(&mut s).is_ok() {
                let _ = serde_json::from_str::<FsDealloc>(&s).map(|d| {
                    dealloc = d;
                });
            }
        }
        dealloc.tombstones = lock_mutex!(storage.deallocated_blocks)
            .iter()
            .cloned()
            .collect();
        dealloc.tombstones.sort_unstable();
        if let Ok(mut f) = fs::File::create(&dealloc_path) {
            let _ = f.write_all(
                serde_json::to_string(&dealloc)
                    .unwrap_or_else(|_| "{}".into())
                    .as_bytes(),
            );
        }
    }

    // For native tests, mirror removal from test-globals (when fs_persist disabled)
    #[cfg(all(
        not(target_arch = "wasm32"),
        any(test, debug_assertions),
        not(feature = "fs_persist")
    ))]
    {
        vfs_sync::with_global_storage(|gs| {
            let mut storage_map = gs.borrow_mut();
            if let Some(db_storage) = storage_map.get_mut(&storage.db_name) {
                db_storage.remove(&block_id);
            }
        });

        vfs_sync::with_global_allocation_map(|allocation_map| {
            if let Some(db_allocations) = allocation_map.borrow_mut().get_mut(&storage.db_name) {
                db_allocations.remove(&block_id);
            }
        });

        GLOBAL_METADATA_TEST.with(|meta| {
            let mut meta_map = meta.lock();
            if let Some(db_meta) = meta_map.get_mut(&storage.db_name) {
                db_meta.remove(&block_id);
            }
        });
    }

    // Update next_block_id to reuse deallocated blocks
    let current = storage.next_block_id.load(Ordering::SeqCst);
    if block_id < current {
        storage.next_block_id.store(block_id, Ordering::SeqCst);
    }

    // Track deallocation in telemetry
    #[cfg(feature = "telemetry")]
    if let Some(ref metrics) = storage.metrics {
        metrics.blocks_deallocated_total().inc();
        // Update memory gauge: total allocated blocks × BLOCK_SIZE
        let total_memory = (lock_mutex!(storage.allocated_blocks).len() as f64)
            * (super::block_storage::BLOCK_SIZE as f64);
        metrics.memory_bytes().set(total_memory);
    }

    log::info!(
        "Deallocated block: {} (total allocated: {})",
        block_id,
        lock_mutex!(storage.allocated_blocks).len()
    );
    Ok(())
}
