//! Constructor functions for BlockStorage
//! This module contains platform-specific constructor implementations

#[cfg(target_arch = "wasm32")]
use std::collections::{HashMap, HashSet, VecDeque};
#[cfg(target_arch = "wasm32")]
use std::sync::{Arc, Mutex};
#[cfg(target_arch = "wasm32")]
use crate::types::DatabaseError;
#[cfg(target_arch = "wasm32")]
use super::metadata::{ChecksumManager, ChecksumAlgorithm};
#[cfg(target_arch = "wasm32")]
use super::block_storage::{BlockStorage, RecoveryReport, DEFAULT_CACHE_CAPACITY};
#[cfg(target_arch = "wasm32")]
use super::vfs_sync;


// On-disk JSON schema for fs_persist
#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
#[derive(serde::Serialize, serde::Deserialize, Default)]
struct FsAlloc { allocated: Vec<u64> }

#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
#[derive(serde::Serialize, serde::Deserialize, Default)]
struct FsDealloc { tombstones: Vec<u64> }

/// Create a new BlockStorage instance for WASM platform
#[cfg(target_arch = "wasm32")]
pub async fn new_wasm(db_name: &str) -> Result<BlockStorage, DatabaseError> {
    log::info!("Creating BlockStorage for database: {}", db_name);
    
    // Perform IndexedDB recovery scan first
    let recovery_performed = super::wasm_indexeddb::perform_indexeddb_recovery_scan(db_name).await
        .unwrap_or(false);
    if recovery_performed {
        log::info!("IndexedDB recovery scan completed for: {}", db_name);
    }
    
    // Try to restore from IndexedDB
    let restored = super::wasm_indexeddb::restore_from_indexeddb(db_name).await;
    if restored {
        log::info!("Successfully restored BlockStorage from IndexedDB for: {}", db_name);
    } else {
        log::info!("No existing data found in IndexedDB for: {}", db_name);
    }
    
    // Debug: Log what's in global storage after restoration
    vfs_sync::with_global_storage(|storage| {
        let storage_map = storage.borrow();
        if let Some(db_storage) = storage_map.get(db_name) {
            #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: After restoration, database {} has {} blocks in global storage", db_name, db_storage.len()).into());
            for (block_id, data) in db_storage.iter() {
                let preview = if data.len() >= 8 {
                    format!("{:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x}", 
                        data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7])
                } else {
                    "short".to_string()
                };
                #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: Block {} preview after restoration: {}", block_id, preview).into());
            }
            
            #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: Found {} blocks in global storage for pre-population", db_storage.len()).into());
        } else {
            #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: After restoration, no blocks found for database {}", db_name).into());
        }
    });

    // In fs_persist mode, proactively ensure the on-disk structure exists for this DB
    // so tests that inspect the filesystem right after first sync can find the blocks dir.
    #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
    {
        let mut db_dir = fs_base_dir.clone();
        db_dir.push(db_name);
        let _ = fs::create_dir_all(&db_dir);
        let mut blocks_dir = db_dir.clone();
        blocks_dir.push("blocks");
        let _ = fs::create_dir_all(&blocks_dir);
        println!("[fs] init base_dir={:?}, db_dir={:?}, blocks_dir={:?}", fs_base_dir, db_dir, blocks_dir);
        // Ensure metadata.json exists
        let mut meta_path = db_dir.clone();
        meta_path.push("metadata.json");
        if fs::metadata(&meta_path).is_err() {
            if let Ok(mut f) = fs::File::create(&meta_path) {
                let _ = f.write_all(br#"{"entries":[]}"#);
            }
        }
        // Ensure allocations.json exists
        let mut alloc_path = db_dir.clone();
        alloc_path.push("allocations.json");
        if fs::metadata(&alloc_path).is_err() {
            if let Ok(mut f) = fs::File::create(&alloc_path) {
                let _ = f.write_all(br#"{"allocated":[]}"#);
            }
        }
        // Ensure deallocated.json exists
        let mut dealloc_path = db_dir.clone();
        dealloc_path.push("deallocated.json");
        if fs::metadata(&dealloc_path).is_err() {
            if let Ok(mut f) = fs::File::create(&dealloc_path) {
                let _ = f.write_all(br#"{"tombstones":[]}"#);
            }
        }
    }

    // Initialize allocation tracking
    let (allocated_blocks, next_block_id) = {
        // WASM: restore allocation state from global storage
        #[cfg(target_arch = "wasm32")]
        {
            let mut allocated_blocks = HashSet::new();
            let mut next_block_id: u64 = 1;

            vfs_sync::with_global_allocation_map(|allocation_map| {
                let allocation_map = allocation_map.borrow();
                if let Some(existing_allocations) = allocation_map.get(db_name) {
                    allocated_blocks = existing_allocations.clone();
                    next_block_id = allocated_blocks.iter().max().copied().unwrap_or(0) + 1;
                    log::info!(
                        "Restored {} allocated blocks for database: {}",
                        allocated_blocks.len(),
                        db_name
                    );
                }

            });

            (allocated_blocks, next_block_id)
        }

        // fs_persist (native): restore allocation from filesystem
        #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
        {
            let mut path = fs_base_dir.clone();
            path.push(db_name);
            let mut alloc_path = path.clone();
            alloc_path.push("allocations.json");
            let (mut allocated_blocks, mut next_block_id) = (HashSet::new(), 1u64);
            if let Ok(mut f) = fs::File::open(&alloc_path) {
                let mut s = String::new();
                if f.read_to_string(&mut s).is_ok() {
                    if let Ok(parsed) = serde_json::from_str::<FsAlloc>(&s) {
                        for id in parsed.allocated { allocated_blocks.insert(id); }
                        next_block_id = allocated_blocks.iter().max().copied().unwrap_or(0) + 1;
                        log::info!("[fs] Restored {} allocated blocks for database: {}", allocated_blocks.len(), db_name);
                    }
                }
            }
            (allocated_blocks, next_block_id)
        }

        // Native tests: restore allocation from test-global (when fs_persist is disabled)
        #[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions), not(feature = "fs_persist")))]
        {
            let mut allocated_blocks = HashSet::new();
            let mut next_block_id: u64 = 1;

            vfs_sync::with_global_allocation_map(|allocation_map| {
                let allocation_map = allocation_map.borrow();
                if let Some(existing_allocations) = allocation_map.get(db_name) {
                    allocated_blocks = existing_allocations.clone();
                    next_block_id = allocated_blocks.iter().max().copied().unwrap_or(0) + 1;
                    log::info!(
                        "[test] Restored {} allocated blocks for database: {}",
                        allocated_blocks.len(),
                        db_name
                    );
                }
            });

            (allocated_blocks, next_block_id)
        }

        // Native defaults
        #[cfg(all(not(target_arch = "wasm32"), not(any(test, debug_assertions))))]
        {
            (HashSet::new(), 1u64)
        }
    };

    // Initialize checksum map, restoring persisted metadata in WASM builds
    #[cfg(target_arch = "wasm32")]
    let checksums_init: HashMap<u64, u64> = {
        // First, try to load commit marker and data from IndexedDB
        let restored_from_indexeddb = super::wasm_indexeddb::restore_from_indexeddb(db_name).await;
        
        let mut map = HashMap::new();
        let committed = vfs_sync::with_global_commit_marker(|cm| {
            let cm = cm.borrow();
            cm.get(db_name).copied().unwrap_or(0)
        });
        vfs_sync::with_global_metadata(|meta| {
            let meta_map = meta.borrow();
            if let Some(db_meta) = meta_map.get(db_name) {
                for (bid, m) in db_meta.iter() {
                    if (m.version as u64) <= committed {
                        map.insert(*bid, m.checksum);
                    }
                }
                log::info!(
                    "Restored {} checksum entries for database: {} (IndexedDB restore: {})",
                    map.len(),
                    db_name,
                    restored_from_indexeddb
                );
            }
        });
        map
    };

    // fs_persist: restore from metadata.json
    #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
    let checksums_init: HashMap<u64, u64> = {
        let mut map = HashMap::new();
        let mut path = fs_base_dir.clone();
        path.push(db_name);
        let mut meta_path = path.clone();
        meta_path.push("metadata.json");
        if let Ok(mut f) = fs::File::open(&meta_path) {
            let mut s = String::new();
            if f.read_to_string(&mut s).is_ok() {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&s) {
                    if let Some(entries) = val.get("entries").and_then(|v| v.as_array()) {
                        for entry in entries.iter() {
                            if let Some(arr) = entry.as_array() {
                                if arr.len() == 2 {
                                    let id_opt = arr.get(0).and_then(|v| v.as_u64());
                                    let meta_opt = arr.get(1).and_then(|v| v.as_object());
                                    if let (Some(bid), Some(meta)) = (id_opt, meta_opt) {
                                        if let Some(csum) = meta.get("checksum").and_then(|v| v.as_u64()) {
                                            map.insert(bid, csum);
                                        }
                                    }
                                }
                            }
                        }
                        log::info!("[fs] Restored checksum metadata for database: {}", db_name);
                    }
                }
            }
        }
        map
    };

    // fs_persist: restore per-block checksum algorithms from metadata.json
    #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
    let checksum_algos_init: HashMap<u64, ChecksumAlgorithm> = {
        let mut map = HashMap::new();
        let mut path = fs_base_dir.clone();
        path.push(db_name);
        let mut meta_path = path.clone();
        meta_path.push("metadata.json");
        if let Ok(mut f) = fs::File::open(&meta_path) {
            let mut s = String::new();
            if f.read_to_string(&mut s).is_ok() {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&s) {
                    if let Some(entries) = val.get("entries").and_then(|v| v.as_array()) {
                        for entry in entries.iter() {
                            if let Some(arr) = entry.as_array() {
                                if arr.len() == 2 {
                                    let id_opt = arr.get(0).and_then(|v| v.as_u64());
                                    let meta_opt = arr.get(1).and_then(|v| v.as_object());
                                    if let (Some(bid), Some(meta)) = (id_opt, meta_opt) {
                                        let algo_opt = meta.get("algo").and_then(|v| v.as_str());
                                        let algo = match algo_opt {
                                            Some("FastHash") => Some(ChecksumAlgorithm::FastHash),
                                            Some("CRC32") => Some(ChecksumAlgorithm::CRC32),
                                            _ => None, // tolerate invalid/missing by not inserting; will fallback to default later
                                        };
                                        if let Some(a) = algo { map.insert(bid, a); }
                                    }
                                }
                            }
                        }
                        log::info!("[fs] Restored checksum algorithms for database: {}", db_name);
                    }
                }
            }
        }
        map
    };

    // fs_persist: restore deallocation tombstones
    #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
    let deallocated_init: HashSet<u64> = {
        let mut set = HashSet::new();
        let mut path = fs_base_dir.clone();
        path.push(db_name);
        let mut dealloc_path = path.clone();
        dealloc_path.push("deallocated.json");
        if let Ok(mut f) = fs::File::open(&dealloc_path) {
            let mut s = String::new();
            if f.read_to_string(&mut s).is_ok() {
                if let Ok(parsed) = serde_json::from_str::<FsDealloc>(&s) {
                    for id in parsed.tombstones { set.insert(id); }
                    log::info!("[fs] Restored {} deallocation tombstones for database: {}", set.len(), db_name);
                }
            }
        }
        set
    };

    // Native tests: restore from test-global metadata (when fs_persist is disabled)
    #[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions), not(feature = "fs_persist")))]
    let checksums_init: HashMap<u64, u64> = {
        let mut map = HashMap::new();
        let committed = vfs_sync::with_global_commit_marker(|cm| {
            let cm = cm.borrow();
            cm.get(db_name).copied().unwrap_or(0)
        });
        GLOBAL_METADATA_TEST.with(|meta| {
            let meta_map = meta.borrow();
            if let Some(db_meta) = meta_map.get(db_name) {
                for (bid, m) in db_meta.iter() {
                    if (m.version as u64) <= committed {
                        map.insert(*bid, m.checksum);
                    }
                }
                log::info!(
                    "[test] Restored {} checksum entries for database: {}",
                    db_meta.len(),
                    db_name
                );
            }
        });
        map
    };

    // Native tests: restore per-block algorithms (when fs_persist is disabled)
    #[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions), not(feature = "fs_persist")))]
    let checksum_algos_init: HashMap<u64, ChecksumAlgorithm> = {
        let mut map = HashMap::new();
        let committed = vfs_sync::with_global_commit_marker(|cm| {
            let cm = cm.borrow();
            cm.get(db_name).copied().unwrap_or(0)
        });
        GLOBAL_METADATA_TEST.with(|meta| {
            let meta_map = meta.borrow();
            if let Some(db_meta) = meta_map.get(db_name) {
                for (bid, m) in db_meta.iter() {
                    if (m.version as u64) <= committed {
                        map.insert(*bid, m.algo);
                    }
                }
            }
        });
        map
    };

    // Native non-test: start empty
    #[cfg(all(not(target_arch = "wasm32"), not(any(test, debug_assertions))))]
    let checksums_init: HashMap<u64, u64> = HashMap::new();

    // Native non-test: start empty for algorithms
    #[cfg(all(not(target_arch = "wasm32"), not(any(test, debug_assertions))))]
    let checksum_algos_init: HashMap<u64, ChecksumAlgorithm> = HashMap::new();

    // WASM: restore per-block algorithms
    #[cfg(target_arch = "wasm32")]
    let checksum_algos_init: HashMap<u64, ChecksumAlgorithm> = {
        let mut map = HashMap::new();
        let committed = vfs_sync::with_global_commit_marker(|cm| {
            let cm = cm.borrow();
            cm.get(db_name).copied().unwrap_or(0)
        });
        vfs_sync::with_global_metadata(|meta| {
            let meta_map = meta.borrow();
            if let Some(db_meta) = meta_map.get(db_name) {
                for (bid, m) in db_meta.iter() {
                    if (m.version as u64) <= committed {
                        map.insert(*bid, m.algo);
                    }
                }
            }
        });
        map
    };

    // Determine default checksum algorithm from environment (fs_persist native), fallback to FastHash
    #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
    let checksum_algo_default = match env::var("DATASYNC_CHECKSUM_ALGO").ok().as_deref() {
        Some("CRC32") => ChecksumAlgorithm::CRC32,
        _ => ChecksumAlgorithm::FastHash,
    };
    #[cfg(not(all(not(target_arch = "wasm32"), feature = "fs_persist")))]
    let checksum_algo_default = ChecksumAlgorithm::FastHash;

    Ok(BlockStorage {
        cache: HashMap::new(),
        dirty_blocks: Arc::new(Mutex::new(HashMap::new())),
        allocated_blocks,
        next_block_id,
        capacity: DEFAULT_CACHE_CAPACITY,
        lru_order: VecDeque::new(),
        checksum_manager: ChecksumManager::with_data(
            checksums_init,
            checksum_algos_init,
            checksum_algo_default,
        ),
        db_name: db_name.to_string(),
        #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
        base_dir: fs_base_dir,
        #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
        deallocated_blocks: deallocated_init,
        #[cfg(any(target_arch = "wasm32", not(feature = "fs_persist")))]
        deallocated_blocks: HashSet::new(),
        auto_sync_interval: None,
        #[cfg(not(target_arch = "wasm32"))]
        last_auto_sync: Instant::now(),
        policy: None,
        #[cfg(not(target_arch = "wasm32"))]
        auto_sync_stop: None,
        #[cfg(not(target_arch = "wasm32"))]
        auto_sync_thread: None,
        #[cfg(not(target_arch = "wasm32"))]
        debounce_thread: None,
        #[cfg(not(target_arch = "wasm32"))]
        tokio_timer_task: None,
        #[cfg(not(target_arch = "wasm32"))]
        tokio_debounce_task: None,
        #[cfg(not(target_arch = "wasm32"))]
        last_write_ms: Arc::new(AtomicU64::new(0)),
        #[cfg(not(target_arch = "wasm32"))]
        threshold_hit: Arc::new(AtomicBool::new(false)),
        #[cfg(not(target_arch = "wasm32"))]
        sync_count: Arc::new(AtomicU64::new(0)),
        #[cfg(not(target_arch = "wasm32"))]
        timer_sync_count: Arc::new(AtomicU64::new(0)),
        #[cfg(not(target_arch = "wasm32"))]
        debounce_sync_count: Arc::new(AtomicU64::new(0)),
        #[cfg(not(target_arch = "wasm32"))]
        last_sync_duration_ms: Arc::new(AtomicU64::new(0)),
        #[cfg(not(target_arch = "wasm32"))]
        sync_sender: None,
        #[cfg(not(target_arch = "wasm32"))]
        sync_receiver: None,
        recovery_report: RecoveryReport::default(),
        #[cfg(target_arch = "wasm32")]
        leader_election: None,
        observability: super::observability::ObservabilityManager::new(),
    })
}