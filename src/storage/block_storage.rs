use std::collections::{HashMap, HashSet, VecDeque};
use std::sync::{Arc, Mutex};
use std::time::Duration;
#[cfg(not(target_arch = "wasm32"))]
use std::time::{Instant, SystemTime, UNIX_EPOCH};
#[cfg(target_arch = "wasm32")]
use js_sys::Date;
#[cfg(not(target_arch = "wasm32"))]
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use crate::types::DatabaseError;
use super::metadata::{ChecksumManager, ChecksumAlgorithm, BlockMetadataPersist};
use super::vfs_sync;
#[cfg(not(target_arch = "wasm32"))]
use tokio::task::JoinHandle as TokioJoinHandle;
#[cfg(not(target_arch = "wasm32"))]
use tokio::sync::mpsc;

#[cfg(any(target_arch = "wasm32", all(not(target_arch = "wasm32"), any(test, debug_assertions))))]
#[allow(unused_imports)]
use std::cell::RefCell;

// FS persistence imports (native only when feature is enabled)
#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
use std::{fs, io::{Read, Write}, path::PathBuf};

// Global storage management moved to vfs_sync module

// Persistent metadata storage moved to metadata module

// Auto-sync messaging
#[cfg(not(target_arch = "wasm32"))]
#[derive(Debug)]
pub(super) enum SyncRequest {
    Timer(tokio::sync::oneshot::Sender<()>),
    Debounce(tokio::sync::oneshot::Sender<()>),
}

#[derive(Clone, Debug, Default)]
pub struct RecoveryOptions {
    pub mode: RecoveryMode,
    pub on_corruption: CorruptionAction,
}

#[derive(Clone, Debug)]
pub enum RecoveryMode {
    Full,
    Sample { count: usize },
    Skip,
}

impl Default for RecoveryMode {
    fn default() -> Self {
        RecoveryMode::Full
    }
}

#[derive(Clone, Debug)]
pub enum CorruptionAction {
    Report,
    Repair,
    Fail,
}

impl Default for CorruptionAction {
    fn default() -> Self {
        CorruptionAction::Report
    }
}

#[derive(Clone, Debug, Default)]
pub struct RecoveryReport {
    pub total_blocks_verified: usize,
    pub corrupted_blocks: Vec<u64>,
    pub repaired_blocks: Vec<u64>,
    pub verification_duration_ms: u64,
}

// On-disk JSON schema for fs_persist
#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
#[derive(serde::Serialize, serde::Deserialize, Default)]
struct FsMeta { entries: Vec<(u64, BlockMetadataPersist)> }

#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
#[derive(serde::Serialize, serde::Deserialize, Default)]
struct FsAlloc { allocated: Vec<u64> }

#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
#[derive(serde::Serialize, serde::Deserialize, Default)]
struct FsDealloc { tombstones: Vec<u64> }

// Global metadata and commit marker management moved to vfs_sync module

// Test-only metadata mirror for native builds
#[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions)))]
thread_local! {
    static GLOBAL_METADATA_TEST: RefCell<HashMap<String, HashMap<u64, BlockMetadataPersist>>> = RefCell::new(HashMap::new());
}

// Test-only commit marker mirror for native builds (when fs_persist is disabled)
#[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions)))]
thread_local! {
    static GLOBAL_COMMIT_MARKER_TEST: RefCell<HashMap<String, u64>> = RefCell::new(HashMap::new());
}

#[derive(Clone, Debug)]
pub struct SyncPolicy {
    pub interval_ms: Option<u64>,
    pub max_dirty: Option<usize>,
    pub max_dirty_bytes: Option<usize>,
    pub debounce_ms: Option<u64>,
    pub verify_after_write: bool,
}

#[cfg(not(target_arch = "wasm32"))]
impl Drop for BlockStorage {
    fn drop(&mut self) {
        if let Some(stop) = &self.auto_sync_stop {
            stop.store(true, Ordering::SeqCst);
        }
        if let Some(handle) = self.auto_sync_thread.take() {
            let _ = handle.join();
        }
        if let Some(handle) = self.debounce_thread.take() {
            let _ = handle.join();
        }
        if let Some(task) = self.tokio_timer_task.take() {
            task.abort();
        }
        if let Some(task) = self.tokio_debounce_task.take() {
            task.abort();
        }
        self.auto_sync_stop = None;
    }
}

pub const BLOCK_SIZE: usize = 4096;
#[allow(dead_code)]
const DEFAULT_CACHE_CAPACITY: usize = 128;
#[allow(dead_code)]
const STORE_NAME: &str = "sqlite_blocks";
#[allow(dead_code)]
const METADATA_STORE: &str = "metadata";

pub struct BlockStorage {
    cache: HashMap<u64, Vec<u8>>,
    dirty_blocks: Arc<Mutex<HashMap<u64, Vec<u8>>>>,
    pub(super) allocated_blocks: HashSet<u64>,
    #[allow(dead_code)]
    deallocated_blocks: HashSet<u64>,
    next_block_id: u64,
    capacity: usize,
    lru_order: VecDeque<u64>,
    // Checksum management (moved to metadata module)
    pub(super) checksum_manager: ChecksumManager,
    #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
    pub(super) base_dir: PathBuf,
    pub(super) db_name: String,
    // Background sync settings
    pub(super) auto_sync_interval: Option<Duration>,
    #[cfg(not(target_arch = "wasm32"))]
    pub(super) last_auto_sync: Instant,
    pub(super) policy: Option<SyncPolicy>,
    #[cfg(not(target_arch = "wasm32"))]
    pub(super) auto_sync_stop: Option<Arc<AtomicBool>>,
    #[cfg(not(target_arch = "wasm32"))]
    pub(super) auto_sync_thread: Option<std::thread::JoinHandle<()>>,
    #[cfg(not(target_arch = "wasm32"))]
    pub(super) debounce_thread: Option<std::thread::JoinHandle<()>>,
    #[cfg(not(target_arch = "wasm32"))]
    pub(super) tokio_timer_task: Option<TokioJoinHandle<()>>,
    #[cfg(not(target_arch = "wasm32"))]
    pub(super) tokio_debounce_task: Option<TokioJoinHandle<()>>,
    #[cfg(not(target_arch = "wasm32"))]
    pub(super) last_write_ms: Arc<AtomicU64>,
    #[cfg(not(target_arch = "wasm32"))]
    pub(super) threshold_hit: Arc<AtomicBool>,
    #[cfg(not(target_arch = "wasm32"))]
    pub(super) sync_count: Arc<AtomicU64>,
    #[cfg(not(target_arch = "wasm32"))]
    pub(super) timer_sync_count: Arc<AtomicU64>,
    #[cfg(not(target_arch = "wasm32"))]
    pub(super) debounce_sync_count: Arc<AtomicU64>,
    #[cfg(not(target_arch = "wasm32"))]
    pub(super) last_sync_duration_ms: Arc<AtomicU64>,

    // Auto-sync channel for real sync operations
    #[cfg(not(target_arch = "wasm32"))]
    pub(super) sync_sender: Option<mpsc::UnboundedSender<SyncRequest>>,
    #[cfg(not(target_arch = "wasm32"))]
    pub(super) sync_receiver: Option<mpsc::UnboundedReceiver<SyncRequest>>,

    // Startup recovery report
    recovery_report: RecoveryReport,
}

impl BlockStorage {
    /// Create a new BlockStorage synchronously without IndexedDB restoration
    /// Used for auto-registration in VFS when existing data is detected
    #[cfg(target_arch = "wasm32")]
    pub fn new_sync(db_name: &str) -> Self {
        log::info!("Creating BlockStorage synchronously for database: {}", db_name);
        
        Self {
            cache: HashMap::new(),
            dirty_blocks: Arc::new(Mutex::new(HashMap::new())),
            allocated_blocks: HashSet::new(),
            deallocated_blocks: HashSet::new(),
            next_block_id: 1,
            capacity: 128,
            lru_order: VecDeque::new(),
            checksum_manager: ChecksumManager::new(ChecksumAlgorithm::FastHash),
            db_name: db_name.to_string(),
            auto_sync_interval: None,
            policy: None,
            #[cfg(not(target_arch = "wasm32"))]
            last_auto_sync: Instant::now(),
            #[cfg(not(target_arch = "wasm32"))]
            auto_sync_stop: None,
            #[cfg(not(target_arch = "wasm32"))]
            auto_sync_thread: None,
            #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
            base_dir: std::path::PathBuf::from(std::env::var("DATASYNC_FS_BASE").unwrap_or_else(|_| "./test_storage".to_string())),
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
        }
    }
    
    #[cfg(target_arch = "wasm32")]
    pub async fn new(db_name: &str) -> Result<Self, DatabaseError> {
        log::info!("Creating BlockStorage for database: {}", db_name);
        
        // Try to restore from IndexedDB first
        let restored = Self::restore_from_indexeddb(db_name).await;
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
            let restored_from_indexeddb = Self::restore_from_indexeddb(db_name).await;
            
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

        Ok(Self {
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
        })
    }

    #[cfg(target_arch = "wasm32")]
    async fn restore_from_indexeddb(db_name: &str) -> bool {
        use wasm_bindgen::JsValue;
        use wasm_bindgen::JsCast;
        
        #[cfg(target_arch = "wasm32")]
        web_sys::console::log_1(&format!("DEBUG: Starting restoration for {}", db_name).into());
        
        // First check if commit marker already exists in global state (cross-instance sharing)
        let existing_marker = vfs_sync::with_global_commit_marker(|cm| {
            cm.borrow().get(db_name).copied()
        });
        
        if let Some(marker) = existing_marker {
            #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: Found existing commit marker {} in global state for {}", marker, db_name).into());
            return true;
        }
        
        #[cfg(target_arch = "wasm32")]
        web_sys::console::log_1(&format!("DEBUG: No existing commit marker found, trying IndexedDB restoration for {}", db_name).into());
        
        let window = web_sys::window().unwrap();
        let idb_factory = window.indexed_db().unwrap().unwrap();
        
        // Try to open existing database
        let open_req = idb_factory.open_with_u32("sqlite_storage", 1).unwrap();
        
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
                        let commit_key = format!("{}_commit_marker", db_name);
                        
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

    #[cfg(not(target_arch = "wasm32"))]
    pub async fn new(db_name: &str) -> Result<Self, DatabaseError> {
        log::info!("Creating BlockStorage for database: {}", db_name);
        
        // Initialize allocation tracking for native
        let (allocated_blocks, next_block_id) = {
            #[cfg(feature = "fs_persist")]
            {
                // fs_persist: restore allocation from filesystem
                let mut allocated_blocks = HashSet::new();
                let mut next_block_id: u64 = 1;
                
                let base_path = std::env::var("DATASYNC_FS_BASE").unwrap_or_else(|_| "./test_storage".to_string());
                let mut alloc_path = std::path::PathBuf::from(base_path);
                alloc_path.push(db_name);
                alloc_path.push("allocations.json");
                
                if let Ok(content) = std::fs::read_to_string(&alloc_path) {
                    if let Ok(alloc_data) = serde_json::from_str::<serde_json::Value>(&content) {
                        if let Some(allocated_array) = alloc_data["allocated"].as_array() {
                            for block_id_val in allocated_array {
                                if let Some(block_id) = block_id_val.as_u64() {
                                    allocated_blocks.insert(block_id);
                                }
                            }
                            next_block_id = allocated_blocks.iter().max().copied().unwrap_or(0) + 1;
                        }
                    }
                }
                
                (allocated_blocks, next_block_id)
            }
            
            #[cfg(not(feature = "fs_persist"))]
            {
                // Native test mode: use default allocation
                (HashSet::new(), 1)
            }
        };

        // Initialize checksums and checksum algorithms
        let checksums_init: HashMap<u64, u64> = {
            #[cfg(feature = "fs_persist")]
            {
                let mut map = HashMap::new();
                let base_path = std::env::var("DATASYNC_FS_BASE").unwrap_or_else(|_| "./test_storage".to_string());
                let mut meta_path = std::path::PathBuf::from(base_path);
                meta_path.push(db_name);
                meta_path.push("metadata.json");
                
                if let Ok(content) = std::fs::read_to_string(&meta_path) {
                    if let Ok(meta_data) = serde_json::from_str::<serde_json::Value>(&content) {
                        if let Some(entries) = meta_data["entries"].as_array() {
                            for entry in entries {
                                if let Some(arr) = entry.as_array() {
                                    if let (Some(block_id), Some(obj)) = (arr.get(0).and_then(|v| v.as_u64()), arr.get(1).and_then(|v| v.as_object())) {
                                        if let Some(checksum) = obj.get("checksum").and_then(|v| v.as_u64()) {
                                            map.insert(block_id, checksum);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                map
            }
            
            #[cfg(not(feature = "fs_persist"))]
            {
                // Native test mode: restore checksums from global test storage
                let mut map = HashMap::new();
                #[cfg(any(test, debug_assertions))]
                GLOBAL_METADATA_TEST.with(|meta| {
                    let meta_map = meta.borrow();
                    if let Some(db_meta) = meta_map.get(db_name) {
                        for (block_id, metadata) in db_meta.iter() {
                            map.insert(*block_id, metadata.checksum);
                        }
                    }
                });
                map
            }
        };

        let checksum_algos_init: HashMap<u64, ChecksumAlgorithm> = {
            #[cfg(feature = "fs_persist")]
            {
                let mut map = HashMap::new();
                let base_path = std::env::var("DATASYNC_FS_BASE").unwrap_or_else(|_| "./test_storage".to_string());
                let mut meta_path = std::path::PathBuf::from(base_path);
                meta_path.push(db_name);
                meta_path.push("metadata.json");
                
                if let Ok(content) = std::fs::read_to_string(&meta_path) {
                    if let Ok(meta_data) = serde_json::from_str::<serde_json::Value>(&content) {
                        if let Some(entries) = meta_data["entries"].as_array() {
                            for entry in entries {
                                if let Some(arr) = entry.as_array() {
                                    if let (Some(block_id), Some(obj)) = (arr.get(0).and_then(|v| v.as_u64()), arr.get(1).and_then(|v| v.as_object())) {
                                        let algo = obj.get("algo").and_then(|v| v.as_str())
                                            .and_then(|s| match s {
                                                "CRC32" => Some(ChecksumAlgorithm::CRC32),
                                                "FastHash" => Some(ChecksumAlgorithm::FastHash),
                                                _ => None,
                                            })
                                            .unwrap_or(ChecksumAlgorithm::FastHash);
                                        map.insert(block_id, algo);
                                    }
                                }
                            }
                        }
                    }
                }
                map
            }
            
            #[cfg(not(feature = "fs_persist"))]
            {
                // Native test mode: restore algorithms from global test storage
                let mut map = HashMap::new();
                #[cfg(any(test, debug_assertions))]
                GLOBAL_METADATA_TEST.with(|meta| {
                    let meta_map = meta.borrow();
                    if let Some(db_meta) = meta_map.get(db_name) {
                        for (block_id, metadata) in db_meta.iter() {
                            map.insert(*block_id, metadata.algo);
                        }
                    }
                });
                map
            }
        };

        // Determine default checksum algorithm from environment (fs_persist native), fallback to FastHash
        #[cfg(feature = "fs_persist")]
        let checksum_algo_default = match std::env::var("DATASYNC_CHECKSUM_ALGO").ok().as_deref() {
            Some("CRC32") => ChecksumAlgorithm::CRC32,
            _ => ChecksumAlgorithm::FastHash,
        };
        #[cfg(not(feature = "fs_persist"))]
        let checksum_algo_default = ChecksumAlgorithm::FastHash;

        // Load deallocated blocks from filesystem
        let deallocated_blocks_init: HashSet<u64> = {
            #[cfg(feature = "fs_persist")]
            {
                let mut set = HashSet::new();
                let base_path = std::env::var("DATASYNC_FS_BASE").unwrap_or_else(|_| "./test_storage".to_string());
                let mut path = std::path::PathBuf::from(base_path);
                path.push(db_name);
                let mut dealloc_path = path.clone();
                dealloc_path.push("deallocated.json");
                if let Ok(content) = std::fs::read_to_string(&dealloc_path) {
                    if let Ok(dealloc_data) = serde_json::from_str::<serde_json::Value>(&content) {
                        if let Some(tombstones_array) = dealloc_data["tombstones"].as_array() {
                            for tombstone_val in tombstones_array {
                                if let Some(block_id) = tombstone_val.as_u64() {
                                    set.insert(block_id);
                                }
                            }
                        }
                    }
                }
                set
            }
            #[cfg(not(feature = "fs_persist"))]
            {
                HashSet::new()
            }
        };

        Ok(BlockStorage {
            db_name: db_name.to_string(),
            cache: HashMap::new(),
            lru_order: VecDeque::new(),
            capacity: 1000,
            checksum_manager: ChecksumManager::with_data(
                checksums_init,
                checksum_algos_init,
                checksum_algo_default,
            ),
            dirty_blocks: Arc::new(Mutex::new(HashMap::new())),
            allocated_blocks,
            next_block_id,
            deallocated_blocks: deallocated_blocks_init,
            policy: None,
            auto_sync_interval: None,
            #[cfg(not(target_arch = "wasm32"))]
            last_auto_sync: Instant::now(),
            #[cfg(not(target_arch = "wasm32"))]
            auto_sync_stop: None,
            #[cfg(not(target_arch = "wasm32"))]
            auto_sync_thread: None,
            #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
            base_dir: std::path::PathBuf::from(std::env::var("DATASYNC_FS_BASE").unwrap_or_else(|_| "./test_storage".to_string())),
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
        })
    }

    pub async fn new_with_capacity(db_name: &str, capacity: usize) -> Result<Self, DatabaseError> {
        let mut s = Self::new(db_name).await?;
        s.capacity = capacity;
        Ok(s)
    }

    pub async fn new_with_recovery_options(db_name: &str, recovery_opts: RecoveryOptions) -> Result<Self, DatabaseError> {
        let mut storage = Self::new(db_name).await?;
        
        // Perform startup recovery verification
        storage.perform_startup_recovery(recovery_opts).await?;
        
        Ok(storage)
    }

    pub fn get_recovery_report(&self) -> &RecoveryReport {
        &self.recovery_report
    }

    async fn perform_startup_recovery(&mut self, opts: RecoveryOptions) -> Result<(), DatabaseError> {
        let start_time = Self::now_millis();
        log::info!("Starting startup recovery with mode: {:?}", opts.mode);

        // Handle pending metadata commit markers (fs_persist only)
        #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
        {
            use std::io::Write;

            let mut db_dir = self.base_dir.clone();
            db_dir.push(&self.db_name);
            let meta_path = db_dir.join("metadata.json");
            let meta_pending_path = db_dir.join("metadata.json.pending");
            let blocks_dir = db_dir.join("blocks");

            if let Ok(pending_content) = std::fs::read_to_string(&meta_pending_path) {
                log::warn!(
                    "Found pending metadata commit marker at startup: {:?}",
                    meta_pending_path
                );

                let mut finalize = true;
                let mut parsed_val: Option<serde_json::Value> = None;
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&pending_content) {
                    parsed_val = Some(val.clone());
                    if let Some(entries) = val.get("entries").and_then(|v| v.as_array()) {
                        for entry in entries {
                            if let Some(arr) = entry.as_array() {
                                if arr.len() == 2 {
                                    if let Some(block_id) = arr.get(0).and_then(|v| v.as_u64()) {
                                        let bpath = blocks_dir.join(format!("block_{}.bin", block_id));
                                        match std::fs::metadata(&bpath) {
                                            Ok(meta) => {
                                                if !meta.is_file() || meta.len() as usize != BLOCK_SIZE {
                                                    log::warn!(
                                                        "Pending commit references block {} but file invalid: {:?}",
                                                        block_id, bpath
                                                    );
                                                    finalize = false;
                                                    break;
                                                }
                                            }
                                            Err(_) => {
                                                log::warn!(
                                                    "Pending commit references missing block file for id {}: {:?}",
                                                    block_id, bpath
                                                );
                                                finalize = false;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    // Malformed pending file -> rollback
                    log::error!("Malformed metadata.json.pending; rolling back");
                    finalize = false;
                }

                if finalize {
                    // Finalize: write pending content to metadata.json and remove pending
                    if let Ok(mut f) = std::fs::File::create(&meta_path) {
                        let _ = f.write_all(pending_content.as_bytes());
                    }
                    let _ = std::fs::remove_file(&meta_pending_path);
                    log::info!("Finalized pending metadata commit to {:?}", meta_path);

                    // Update in-memory checksum and algo maps from finalized metadata
                    if let Some(val) = parsed_val {
                        let mut checksums_new: std::collections::HashMap<u64, u64> = std::collections::HashMap::new();
                        let mut algos_new: std::collections::HashMap<u64, ChecksumAlgorithm> = std::collections::HashMap::new();
                        if let Some(entries) = val.get("entries").and_then(|v| v.as_array()) {
                            for entry in entries.iter() {
                                if let Some(arr) = entry.as_array() {
                                    if arr.len() == 2 {
                                        if let (Some(bid), Some(meta)) = (
                                            arr.get(0).and_then(|v| v.as_u64()),
                                            arr.get(1).and_then(|v| v.as_object()),
                                        ) {
                                            if let Some(csum) = meta.get("checksum").and_then(|v| v.as_u64()) {
                                                checksums_new.insert(bid, csum);
                                            }
                                            let algo_str = meta.get("algo").and_then(|v| v.as_str()).unwrap_or("");
                                            let algo = match algo_str {
                                                "CRC32" => Some(ChecksumAlgorithm::CRC32),
                                                "FastHash" => Some(ChecksumAlgorithm::FastHash),
                                                _ => None,
                                            };
                                            if let Some(a) = algo { algos_new.insert(bid, a); }
                                        }
                                    }
                                }
                            }
                        }
                        self.checksum_manager.replace_all(checksums_new, algos_new);
                    }
                } else {
                    // Rollback: just remove the pending file, retain existing metadata.json
                    let _ = std::fs::remove_file(&meta_pending_path);
                    log::info!("Rolled back pending metadata commit; kept {:?}", meta_path);
                }
            }
        }

        // Extended scan/reconciliation of blocks vs metadata (fs_persist only)
        #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
        {
            use std::collections::HashSet as Set;

            let mut db_dir = self.base_dir.clone();
            db_dir.push(&self.db_name);
            let meta_path = db_dir.join("metadata.json");
            let meta_pending_path = db_dir.join("metadata.json.pending");
            let blocks_dir = db_dir.join("blocks");

            // Load current metadata entries (preserve fields to keep version/last_modified)
            let mut entries_val: Vec<serde_json::Value> = Vec::new();
            let mut meta_ids: Set<u64> = Set::new();
            if let Ok(mut f) = fs::File::open(&meta_path) {
                let mut s = String::new();
                if f.read_to_string(&mut s).is_ok() {
                    if let Ok(val) = serde_json::from_str::<serde_json::Value>(&s) {
                        if let Some(entries) = val.get("entries").and_then(|v| v.as_array()).cloned() {
                            entries_val = entries;
                            for entry in entries_val.iter() {
                                if let Some(arr) = entry.as_array() {
                                    if let Some(id) = arr.get(0).and_then(|v| v.as_u64()) {
                                        meta_ids.insert(id);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Collect block file IDs from disk
            let mut file_ids: Set<u64> = Set::new();
            if let Ok(entries) = fs::read_dir(&blocks_dir) {
                for entry in entries.flatten() {
                    if let Ok(ft) = entry.file_type() {
                        if ft.is_file() {
                            if let Some(name) = entry.file_name().to_str() {
                                if let Some(id_str) = name.strip_prefix("block_").and_then(|s| s.strip_suffix(".bin")) {
                                    if let Ok(id) = id_str.parse::<u64>() { file_ids.insert(id); }
                                }
                            }
                        }
                    }
                }
            }

            // Remove stray files without metadata
            let stray: Vec<u64> = file_ids.difference(&meta_ids).copied().collect();
            if !stray.is_empty() {
                log::warn!("[fs] Found {} stray block files with no metadata: {:?}", stray.len(), stray);
                for id in &stray {
                    let p = blocks_dir.join(format!("block_{}.bin", id));
                    match fs::remove_file(&p) {
                        Ok(()) => log::info!("[fs] Removed stray block file {:?}", p),
                        Err(e) => log::error!("[fs] Failed to remove stray block file {:?}: {}", p, e),
                    }
                }
                // Fsync blocks directory to persist deletions (best-effort on Unix)
                #[cfg(unix)]
                if let Ok(dirf) = fs::OpenOptions::new().read(true).open(&blocks_dir) {
                    let _ = dirf.sync_all();
                }
            }

            // Remove metadata entries whose files are missing/invalid
            let before_len = entries_val.len();
            // Track deletions of invalid-sized files to fsync directory after
            let mut deleted_invalid_files: usize = 0;
            if before_len > 0 {
                entries_val.retain(|entry| {
                    if let Some(arr) = entry.as_array() {
                        if let Some(id) = arr.get(0).and_then(|v| v.as_u64()) {
                            let p = blocks_dir.join(format!("block_{}.bin", id));
                            match fs::metadata(&p) {
                                Ok(meta) => {
                                    if meta.is_file() && meta.len() as usize == BLOCK_SIZE {
                                        true
                                    } else {
                                        // Invalid-sized or non-regular file: drop metadata and delete file now
                                        log::warn!(
                                            "[fs] Removing metadata for block {} due to invalid file (len={} bytes); deleting {:?}",
                                            id, meta.len(), p
                                        );
                                        match fs::remove_file(&p) {
                                            Ok(()) => {
                                                deleted_invalid_files += 1;
                                                log::info!("[fs] Deleted invalid-sized block file {:?}", p);
                                            }
                                            Err(e) => {
                                                log::error!("[fs] Failed to delete invalid-sized block file {:?}: {}", p, e);
                                            }
                                        }
                                        false
                                    }
                                }
                                Err(_) => {
                                    log::warn!("[fs] Removing metadata entry for block {} due to missing file {:?}", id, p);
                                    false
                                }
                            }
                        } else {
                            true
                        }
                    } else {
                        true
                    }
                });
            }
            // If we deleted any invalid-sized files, fsync the blocks directory (best-effort on Unix)
            if deleted_invalid_files > 0 {
                #[cfg(unix)]
                if let Ok(dirf) = fs::OpenOptions::new().read(true).open(&blocks_dir) {
                    let _ = dirf.sync_all();
                }
                log::info!("[fs] Deleted {} invalid-sized block file(s) during reconciliation", deleted_invalid_files);
            }
            let meta_changed = entries_val.len() != before_len;

            // If metadata changed, rewrite atomically and update in-memory maps
            let mut kept_ids: Set<u64> = Set::new();
            if meta_changed {
                for entry in entries_val.iter() {
                    if let Some(arr) = entry.as_array() {
                        if let Some(id) = arr.get(0).and_then(|v| v.as_u64()) { kept_ids.insert(id); }
                    }
                }
                let new_val = serde_json::json!({ "entries": entries_val });
                if let Ok(mut f) = fs::File::create(&meta_pending_path) {
                    let _ = f.write_all(serde_json::to_string(&new_val).unwrap_or_else(|_| "{\"entries\":[]}".into()).as_bytes());
                    let _ = f.sync_all();
                }
                let _ = fs::rename(&meta_pending_path, &meta_path);
                // Fsync metadata.json and its parent dir
                if let Ok(f) = fs::File::open(&meta_path) { let _ = f.sync_all(); }
                #[cfg(unix)]
                if let Ok(dirf) = fs::OpenOptions::new().read(true).open(&db_dir) { let _ = dirf.sync_all(); }
                log::info!("[fs] Rewrote metadata.json after reconciliation; entries={} ", kept_ids.len());

                // Update in-memory checksum and algo maps to match filtered metadata
                let mut checksums_new: HashMap<u64, u64> = HashMap::new();
                let mut algos_new: HashMap<u64, ChecksumAlgorithm> = HashMap::new();
                if let Some(entries) = new_val.get("entries").and_then(|v| v.as_array()) {
                    for entry in entries.iter() {
                        if let Some(arr) = entry.as_array() {
                            if let (Some(bid), Some(meta)) = (arr.get(0).and_then(|v| v.as_u64()), arr.get(1).and_then(|v| v.as_object())) {
                                if let Some(csum) = meta.get("checksum").and_then(|v| v.as_u64()) { checksums_new.insert(bid, csum); }
                                let algo = match meta.get("algo").and_then(|v| v.as_str()) {
                                    Some("CRC32") => Some(ChecksumAlgorithm::CRC32),
                                    Some("FastHash") => Some(ChecksumAlgorithm::FastHash),
                                    _ => None,
                                };
                                if let Some(a) = algo { algos_new.insert(bid, a); }
                            }
                        }
                    }
                }
                self.checksum_manager.replace_all(checksums_new, algos_new);
            } else {
                kept_ids = meta_ids;
            }

            // Reconcile allocations to the metadata IDs
            if self.allocated_blocks != kept_ids {
                self.allocated_blocks = kept_ids.clone();
                self.next_block_id = self.allocated_blocks.iter().copied().max().unwrap_or(0) + 1;

                // Persist allocations.json atomically via temp rename
                let alloc_path = db_dir.join("allocations.json");
                let alloc_tmp = db_dir.join("allocations.json.tmp");
                let mut allocated_vec: Vec<u64> = self.allocated_blocks.iter().copied().collect();
                allocated_vec.sort_unstable();
                let alloc_json = serde_json::json!({ "allocated": allocated_vec });
                if let Ok(mut f) = fs::File::create(&alloc_tmp) {
                    let _ = f.write_all(serde_json::to_string(&alloc_json).unwrap_or_else(|_| "{\"allocated\":[]}".into()).as_bytes());
                    let _ = f.sync_all();
                }
                let _ = fs::rename(&alloc_tmp, &alloc_path);
                // Fsync allocations.json and directory (best-effort)
                if let Ok(f) = fs::File::open(&alloc_path) { let _ = f.sync_all(); }
                #[cfg(unix)]
                if let Ok(dirf) = fs::OpenOptions::new().read(true).open(&db_dir) { let _ = dirf.sync_all(); }
                log::info!("[fs] Rewrote allocations.json after reconciliation; allocated={}", self.allocated_blocks.len());
            }
        }

        let mut corrupted_blocks = Vec::new();
        let mut repaired_blocks = Vec::new();

        // Skip recovery if requested
        if matches!(opts.mode, RecoveryMode::Skip) {
            log::info!("Startup recovery skipped by configuration");
            self.recovery_report = RecoveryReport {
                total_blocks_verified: 0,
                corrupted_blocks: Vec::new(),
                repaired_blocks: Vec::new(),
                verification_duration_ms: Self::now_millis() - start_time,
            };
            return Ok(());
        }

        // Get list of blocks to verify based on mode
        let blocks_to_verify = self.get_blocks_for_verification(&opts.mode).await?;
        let total_verified = blocks_to_verify.len();

        log::info!("Verifying {} blocks during startup recovery", total_verified);

        // Verify each block
        for block_id in blocks_to_verify {
            match self.verify_block_integrity(block_id).await {
                Ok(true) => {
                    log::debug!("Block {} passed integrity check", block_id);
                }
                Ok(false) => {
                    log::warn!("Block {} failed integrity check", block_id);
                    corrupted_blocks.push(block_id);
                    
                    // Handle corruption based on policy
                    match opts.on_corruption {
                        CorruptionAction::Report => {
                            log::info!("Corruption in block {} reported", block_id);
                        }
                        CorruptionAction::Repair => {
                            if self.repair_corrupted_block(block_id).await? {
                                log::info!("Successfully repaired block {}", block_id);
                                repaired_blocks.push(block_id);
                            } else {
                                log::error!("Failed to repair block {}", block_id);
                            }
                        }
                        CorruptionAction::Fail => {
                            return Err(DatabaseError::new(
                                "STARTUP_RECOVERY_FAILED",
                                &format!("Corrupted block {} detected and failure policy is active", block_id)
                            ));
                        }
                    }
                }
                Err(e) => {
                    log::error!("Error verifying block {}: {}", block_id, e.message);
                    if matches!(opts.on_corruption, CorruptionAction::Fail) {
                        return Err(e);
                    }
                }
            }
        }

        let duration = Self::now_millis() - start_time;
        log::info!(
            "Startup recovery completed: {} blocks verified, {} corrupted, {} repaired in {}ms",
            total_verified, corrupted_blocks.len(), repaired_blocks.len(), duration
        );

        self.recovery_report = RecoveryReport {
            total_blocks_verified: total_verified,
            corrupted_blocks,
            repaired_blocks,
            verification_duration_ms: duration,
        };

        Ok(())
    }

    async fn get_blocks_for_verification(&self, mode: &RecoveryMode) -> Result<Vec<u64>, DatabaseError> {
        let all_blocks: Vec<u64> = self.allocated_blocks.iter().copied().collect();
        
        match mode {
            RecoveryMode::Full => Ok(all_blocks),
            RecoveryMode::Sample { count } => {
                let sample_count = (*count).min(all_blocks.len());
                let mut sampled = all_blocks;
                sampled.sort_unstable(); // Deterministic sampling
                sampled.truncate(sample_count);
                Ok(sampled)
            }
            RecoveryMode::Skip => Ok(Vec::new()),
        }
    }

    async fn verify_block_integrity(&mut self, block_id: u64) -> Result<bool, DatabaseError> {
        // Read the block data
        let data = match self.read_block_from_storage(block_id).await {
            Ok(data) => data,
            Err(_) => {
                log::warn!("Could not read block {} for integrity verification", block_id);
                return Ok(false);
            }
        };

        // Verify against stored checksum
        match self.verify_against_stored_checksum(block_id, &data) {
            Ok(()) => Ok(true),
            Err(e) => {
                log::warn!("Block {} failed checksum verification: {}", block_id, e.message);
                Ok(false)
            }
        }
    }

    async fn read_block_from_storage(&mut self, block_id: u64) -> Result<Vec<u8>, DatabaseError> {
        // Try to read from filesystem first (fs_persist mode)
        #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
        {
            let mut blocks_dir = self.base_dir.clone();
            blocks_dir.push(&self.db_name);
            blocks_dir.push("blocks");
            let block_file = blocks_dir.join(format!("block_{}.bin", block_id));
            
            if let Ok(data) = std::fs::read(&block_file) {
                if data.len() == BLOCK_SIZE {
                    return Ok(data);
                }
            }
        }

        // Fallback to test storage for native tests
        #[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions), not(feature = "fs_persist")))]
        {
            let mut found_data = None;
            vfs_sync::with_global_storage(|storage| {
                let storage_map = storage.borrow();
                if let Some(db_storage) = storage_map.get(&self.db_name) {
                    if let Some(data) = db_storage.get(&block_id) {
                        found_data = Some(data.clone());
                    }
                }
            });
            if let Some(data) = found_data {
                return Ok(data);
            }
        }

        // WASM global storage
        #[cfg(target_arch = "wasm32")]
        {
            let mut found_data = None;
            vfs_sync::with_global_storage(|storage| {
                let storage_map = storage.borrow();
                if let Some(db_storage) = storage_map.get(&self.db_name) {
                    if let Some(data) = db_storage.get(&block_id) {
                        found_data = Some(data.clone());
                    }
                }
            });
            if let Some(data) = found_data {
                return Ok(data);
            }
        }

        Err(DatabaseError::new(
            "BLOCK_NOT_FOUND",
            &format!("Block {} not found in storage", block_id)
        ))
    }

    async fn repair_corrupted_block(&mut self, block_id: u64) -> Result<bool, DatabaseError> {
        log::info!("Attempting to repair corrupted block {}", block_id);
        
        // For now, repair by removing the corrupted block and clearing its metadata
        // In a real implementation, this might involve restoring from backup or rebuilding
        
        // Remove from cache
        self.cache.remove(&block_id);
        
        // Remove checksum metadata
        self.checksum_manager.remove_checksum(block_id);
        
        // Remove from filesystem if fs_persist is enabled
        #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
        {
            let mut blocks_dir = self.base_dir.clone();
            blocks_dir.push(&self.db_name);
            blocks_dir.push("blocks");
            let block_file = blocks_dir.join(format!("block_{}.bin", block_id));
            let _ = std::fs::remove_file(&block_file);
        }
        
        // Remove from test storage
        #[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions), not(feature = "fs_persist")))]
        {
            vfs_sync::with_global_storage(|storage| {
                let mut storage_map = storage.borrow_mut();
                if let Some(db_storage) = storage_map.get_mut(&self.db_name) {
                    db_storage.remove(&block_id);
                }
            });
        }
        
        // Remove from WASM storage
        #[cfg(target_arch = "wasm32")]
        {
            vfs_sync::with_global_storage(|storage| {
                let mut storage_map = storage.borrow_mut();
                if let Some(db_storage) = storage_map.get_mut(&self.db_name) {
                    db_storage.remove(&block_id);
                }
            });
        }
        
        log::info!("Corrupted block {} has been removed (repair completed)", block_id);
        Ok(true)
    }

    fn touch_lru(&mut self, block_id: u64) {
        // Remove any existing occurrence
        if let Some(pos) = self.lru_order.iter().position(|&id| id == block_id) {
            self.lru_order.remove(pos);
        }
        // Push as most-recent
        self.lru_order.push_back(block_id);
    }

    pub(super) fn evict_if_needed(&mut self) {
        // Evict clean LRU blocks until within capacity. Never evict dirty blocks.
        while self.cache.len() > self.capacity {
            // Find the least-recent block that is NOT dirty
            let dirty_guard = self.dirty_blocks.lock().unwrap();
            let victim_pos = self
                .lru_order
                .iter()
                .position(|id| !dirty_guard.contains_key(id));

            match victim_pos {
                Some(pos) => {
                    let victim = self.lru_order.remove(pos).expect("valid pos");
                    if self.cache.remove(&victim).is_some() {
                        log::debug!("Evicted clean block {} from cache due to capacity", victim);
                    }
                }
                None => {
                    // All blocks are dirty; cannot evict. Allow temporary overflow.
                    log::debug!(
                        "Cache over capacity ({}>{}) but all blocks are dirty; skipping eviction",
                        self.cache.len(),
                        self.capacity
                    );
                    break;
                }
            }
        }
    }

    #[inline]
    #[cfg(target_arch = "wasm32")]
    fn now_millis() -> u64 {
        // Date::now() returns milliseconds since UNIX epoch as f64
        Date::now() as u64
    }

    #[inline]
    #[cfg(not(target_arch = "wasm32"))]
    pub(super) fn now_millis() -> u64 {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_else(|_| Duration::from_millis(0));
        now.as_millis() as u64
    }

    // compute_checksum_with moved to ChecksumManager


    fn verify_against_stored_checksum(
        &self,
        block_id: u64,
        data: &[u8],
    ) -> Result<(), DatabaseError> {
        self.checksum_manager.validate_checksum(block_id, data)
    }

    /// Synchronous block read for environments that require sync access (e.g., VFS callbacks)
    pub fn read_block_sync(&mut self, block_id: u64) -> Result<Vec<u8>, DatabaseError> {
        log::debug!("Reading block {} from cache or storage", block_id);
        #[cfg(target_arch = "wasm32")]
        web_sys::console::log_1(&format!("DEBUG: READ REQUEST for block {} in database {}", block_id, self.db_name).into());
        self.maybe_auto_sync();
        
        // For WASM, skip cache for now to ensure we always check global storage for cross-instance data
        // This prevents stale cache data from hiding committed blocks
        #[cfg(not(target_arch = "wasm32"))]
        {
            // Check cache first
            if let Some(data) = self.cache.get(&block_id).cloned() {
                log::debug!("Block {} found in cache (sync)", block_id);
                // Verify checksum if we have one
                if let Err(e) = self.verify_against_stored_checksum(block_id, &data) {
                    log::error!(
                        "Checksum verification failed for block {} (cache): {}",
                        block_id, e.message
                    );
                    return Err(e);
                }
                self.touch_lru(block_id);
                return Ok(data);
            }
        }

        // For WASM, check global storage for persistence across instances
        #[cfg(target_arch = "wasm32")]
        {
            // Enforce commit gating: only expose data whose metadata version <= commit marker
            let committed: u64 = vfs_sync::with_global_commit_marker(|cm| {
                let cm = cm.borrow();
                let marker = cm.get(&self.db_name).copied().unwrap_or(0);
                #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Current commit marker for {} during read: {}", self.db_name, marker).into());
                marker
            });
            // Check if block should be visible based on commit marker gating
            // Only allow the database header block (0) to be always visible to prevent SQLite panics
            // Other blocks should be subject to commit marker gating
            let is_structural_block = block_id == 0;
            let is_visible: bool = if is_structural_block {
                #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Block {} is structural, always visible", block_id).into());
                true
            } else {
                vfs_sync::with_global_metadata(|meta| {
                    let meta_map = meta.borrow();
                    if let Some(db_meta) = meta_map.get(&self.db_name) {
                        if let Some(m) = db_meta.get(&block_id) {
                            let visible = (m.version as u64) <= committed;
                            #[cfg(target_arch = "wasm32")]
                    web_sys::console::log_1(&format!("DEBUG: Block {} visibility check - version: {}, committed: {}, visible: {}", block_id, m.version, committed, visible).into());
                            return visible;
                        }
                    }
                    // If block has no metadata but exists in global storage, make it visible
                    // This handles blocks written before metadata tracking
                    let exists_in_storage = vfs_sync::with_global_storage(|storage| {
                        let storage_map = storage.borrow();
                        storage_map.get(&self.db_name)
                            .map(|db_storage| db_storage.contains_key(&block_id))
                            .unwrap_or(false)
                    });
                    
                    if exists_in_storage {
                        #[cfg(target_arch = "wasm32")]
                    web_sys::console::log_1(&format!("DEBUG: Block {} has no metadata but exists in storage, making visible", block_id).into());
                        true
                    } else {
                        #[cfg(target_arch = "wasm32")]
                    web_sys::console::log_1(&format!("DEBUG: Block {} has no metadata and doesn't exist in storage, allowing read (will return zeros)", block_id).into());
                        true  // Always allow reads to proceed
                    }
                })
            };
            let data = if is_visible {
                // First try to get from global storage (cross-instance data)
                let global_data = vfs_sync::with_global_storage(|storage| {
                    let storage_map = storage.borrow();
                    #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Checking global storage for block {} in database {} (total dbs: {})", block_id, self.db_name, storage_map.len()).into());
                    if let Some(db_storage) = storage_map.get(&self.db_name) {
                        #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Found database {} in global storage with {} blocks", self.db_name, db_storage.len()).into());
                        if let Some(data) = db_storage.get(&block_id) {
                            // Log the first few bytes to see what data we're returning
                            let preview = if data.len() >= 16 {
                                format!("{:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x}", 
                                    data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7],
                                    data[8], data[9], data[10], data[11], data[12], data[13], data[14], data[15])
                            } else {
                                "short block".to_string()
                            };
                            #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: SUCCESS! Returning block {} from global storage: {}", block_id, preview).into());
                            log::debug!(
                                "Block {} found in global storage (sync, committed visible)",
                                block_id
                            );
                            return Some(data.clone());
                        } else {
                            let block_ids: Vec<String> = db_storage.keys().map(|k| k.to_string()).collect();
                            #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Block {} not found in database storage (has blocks: {})", block_id, block_ids.join(", ")).into());
                        }
                    } else {
                        let available_dbs: Vec<String> = storage_map.keys().cloned().collect();
                        #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Database {} not found in global storage (available: {})", self.db_name, available_dbs.join(", ")).into());
                    }
                    None
                });
                
                if let Some(data) = global_data {
                    data
                } else {
                    #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Block {} not found in global storage, returning zeros", block_id).into());
                    vec![0; BLOCK_SIZE]
                }
            } else {
                log::debug!(
                    "Block {} not visible due to commit gating (committed={}, treating as zeroed)",
                    block_id,
                    committed
                );
                #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Block {} not visible due to commit gating, returning zeros", block_id).into());
                vec![0; BLOCK_SIZE]
            };
            
            // Cache for future reads
            self.cache.insert(block_id, data.clone());
            log::debug!("Block {} cached from global storage (sync)", block_id);
            // Verify checksum only if the block is visible under the commit marker
            if is_visible {
                if let Err(e) = self.verify_against_stored_checksum(block_id, &data) {
                    log::error!(
                        "Checksum verification failed for block {} (wasm storage): {}",
                        block_id, e.message
                    );
                    return Err(e);
                }
            }
            self.touch_lru(block_id);
            self.evict_if_needed();
            return Ok(data);
        }

        // For native fs_persist, read from filesystem if allocated
        #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
        {
            let base: PathBuf = self.base_dir.clone();
            let mut dir = base.clone();
            dir.push(&self.db_name);
            let mut blocks = dir.clone();
            blocks.push("blocks");
            let mut block_path = blocks.clone();
            block_path.push(format!("block_{}.bin", block_id));
            // If the block was explicitly deallocated (tombstoned), refuse reads
            if self.deallocated_blocks.contains(&block_id) {
                return Err(DatabaseError::new(
                    "BLOCK_NOT_ALLOCATED",
                    &format!("Block {} is not allocated", block_id),
                ));
            }
            if let Ok(mut f) = fs::File::open(&block_path) {
                let mut data = vec![0u8; BLOCK_SIZE];
                f.read_exact(&mut data).map_err(|e| DatabaseError::new("IO_ERROR", &format!("read block {} failed: {}", block_id, e)))?;
                self.cache.insert(block_id, data.clone());
                if let Err(e) = self.verify_against_stored_checksum(block_id, &data) { return Err(e); }
                self.touch_lru(block_id);
                self.evict_if_needed();
                return Ok(data);
            }
            // If file missing, treat as zeroed data (compat). This covers never-written blocks
            // and avoids depending on allocated_blocks for read behavior.
            let data = vec![0; BLOCK_SIZE];
            self.cache.insert(block_id, data.clone());
            if let Err(e) = self.verify_against_stored_checksum(block_id, &data) { return Err(e); }
            self.touch_lru(block_id);
            self.evict_if_needed();
            return Ok(data);
        }

        // For native tests, check test-global storage for persistence across instances (when fs_persist disabled)
        #[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions), not(feature = "fs_persist")))]
        {
            // Enforce commit gating in native test path as well
            let committed: u64 = vfs_sync::with_global_commit_marker(|cm| {
                let cm = cm.borrow();
                cm.get(&self.db_name).copied().unwrap_or(0)
            });
            let is_visible: bool = GLOBAL_METADATA_TEST.with(|meta| {
                let meta_map = meta.borrow();
                if let Some(db_meta) = meta_map.get(&self.db_name) {
                    if let Some(m) = db_meta.get(&block_id) {
                        return (m.version as u64) <= committed;
                    }
                }
                false
            });
            let data = if is_visible {
                vfs_sync::with_global_storage(|storage| {
                    let storage_map = storage.borrow();
                    if let Some(db_storage) = storage_map.get(&self.db_name) {
                        if let Some(data) = db_storage.get(&block_id) {
                            log::debug!("[test] Block {} found in global storage (sync, committed visible)", block_id);
                            return data.clone();
                        }
                    }
                    vec![0; BLOCK_SIZE]
                })
            } else {
                log::debug!(
                    "[test] Block {} not visible due to commit gating (committed={}, treating as zeroed)",
                    block_id,
                    committed
                );
                vec![0; BLOCK_SIZE]
            };

            self.cache.insert(block_id, data.clone());
            log::debug!("[test] Block {} cached from global storage (sync)", block_id);
            // Verify checksum only if the block is visible under the commit marker
            if is_visible {
                if let Err(e) = self.verify_against_stored_checksum(block_id, &data) {
                    log::error!(
                        "[test] Checksum verification failed for block {} (test storage): {}",
                        block_id, e.message
                    );
                    return Err(e);
                }
            }
            self.touch_lru(block_id);
            self.evict_if_needed();
            return Ok(data);
        }

        // For native non-test, return empty block - will implement file-based storage later
        #[cfg(all(not(target_arch = "wasm32"), not(any(test, debug_assertions))))]
        {
            let data = vec![0; BLOCK_SIZE];
            log::debug!("Block {} not found, returning empty block (sync)", block_id);

            // Cache for future reads
            self.cache.insert(block_id, data.clone());
            log::debug!("Block {} cached (sync)", block_id);
            // Verify checksum if tracked (typically none for empty native block)
            if let Err(e) = self.verify_against_stored_checksum(block_id, &data) {
                log::error!(
                    "Checksum verification failed for block {} (native fallback): {}",
                    block_id, e.message
                );
                return Err(e);
            }
            self.touch_lru(block_id);
            self.evict_if_needed();
            
            Ok(data)
        }
    }

    pub async fn read_block(&mut self, block_id: u64) -> Result<Vec<u8>, DatabaseError> {
        // Delegate to synchronous implementation (immediately ready)
        self.read_block_sync(block_id)
    }

    /// Synchronous block write for environments that require sync access (e.g., VFS callbacks)
    pub fn write_block_sync(&mut self, block_id: u64, data: Vec<u8>) -> Result<(), DatabaseError> {
        log::debug!("Writing block (sync): {} ({} bytes)", block_id, data.len());
        self.maybe_auto_sync();
        
        if data.len() != BLOCK_SIZE {
            return Err(DatabaseError::new(
                "INVALID_BLOCK_SIZE", 
                &format!("Block size must be {} bytes, got {}", BLOCK_SIZE, data.len())
            ));
        }

        // If requested by policy, verify existing data integrity BEFORE accepting the new write.
        // This prevents overwriting a block whose prior contents no longer match the stored checksum.
        let verify_before = self
            .policy
            .as_ref()
            .map(|p| p.verify_after_write)
            .unwrap_or(false);
        if verify_before {
            #[cfg(not(target_arch = "wasm32"))]
            {
                if let Some(bytes) = self.cache.get(&block_id).cloned() {
                    if let Err(e) = self.verify_against_stored_checksum(block_id, &bytes) {
                        log::error!(
                            "verify_after_write: pre-write checksum verification failed for block {}: {}",
                            block_id, e.message
                        );
                        return Err(e);
                    }
                }
            }
            #[cfg(target_arch = "wasm32")]
            {
                if let Some(bytes) = self.cache.get(&block_id).cloned() {
                    if let Err(e) = self.verify_against_stored_checksum(block_id, &bytes) {
                        log::error!(
                            "verify_after_write: pre-write checksum verification failed for block {}: {}",
                            block_id, e.message
                        );
                        return Err(e);
                    }
                } else {
                    let maybe_bytes = vfs_sync::with_global_storage(|storage| {
                        let storage_map = storage.borrow();
                        storage_map
                            .get(&self.db_name)
                            .and_then(|db| db.get(&block_id))
                            .cloned()
                    });
                    if let Some(bytes) = maybe_bytes {
                        if let Err(e) = self.verify_against_stored_checksum(block_id, &bytes) {
                            log::error!(
                                "verify_after_write: pre-write checksum verification failed for block {}: {}",
                                block_id, e.message
                            );
                            return Err(e);
                        }
                    }
                }
            }
            #[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions)))]
            {
                if let Some(bytes) = self.cache.get(&block_id).cloned() {
                    if let Err(e) = self.verify_against_stored_checksum(block_id, &bytes) {
                        log::error!(
                            "[test] verify_after_write: pre-write checksum verification failed for block {}: {}",
                            block_id, e.message
                        );
                        return Err(e);
                    }
                } else {
                    let maybe_bytes = vfs_sync::with_global_storage(|storage| {
                        let storage_map = storage.borrow();
                        storage_map
                            .get(&self.db_name)
                            .and_then(|db| db.get(&block_id))
                            .cloned()
                    });
                    if let Some(bytes) = maybe_bytes {
                        if let Err(e) = self.verify_against_stored_checksum(block_id, &bytes) {
                            log::error!(
                                "[test] verify_after_write: pre-write checksum verification failed for block {}: {}",
                                block_id, e.message
                            );
                            return Err(e);
                        }
                    }
                }
            }
        }

        // For WASM, immediately persist to global storage FIRST for cross-instance visibility
        #[cfg(target_arch = "wasm32")]
        {
            // Check if this block already exists in global storage with committed data
            let existing_data = vfs_sync::with_global_storage(|storage| {
                let storage_map = storage.borrow();
                if let Some(db_storage) = storage_map.get(&self.db_name) {
                    db_storage.get(&block_id).cloned()
                } else {
                    None
                }
            });
            
            // Check if there's existing metadata for this block
            let has_committed_metadata = vfs_sync::with_global_metadata(|meta| {
                let meta_map = meta.borrow();
                if let Some(db_meta) = meta_map.get(&self.db_name) {
                    if let Some(metadata) = db_meta.get(&block_id) {
                        // If version > 0, this block has been committed before
                        metadata.version > 0
                    } else {
                        false
                    }
                } else {
                    false
                }
            });
            
            // Only overwrite if there's no committed data or if this is a legitimate update
            let should_write = if let Some(existing) = existing_data {
                if has_committed_metadata {
                    // CRITICAL FIX: Always allow writes during transactions to ensure schema changes persist
                    // The previous logic was incorrectly skipping writes when data appeared the same
                    #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Block {} has committed metadata, allowing write to ensure schema persistence", block_id).into());
                    true  // Always allow writes when there's committed metadata
                } else {
                    // Check if the new data is richer (has more non-zero bytes) than existing
                    let existing_non_zero = existing.iter().filter(|&&b| b != 0).count();
                    let new_non_zero = data.iter().filter(|&&b| b != 0).count();
                    
                    if new_non_zero > existing_non_zero {
                        #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Block {} exists but new data is richer ({} vs {} non-zero bytes), allowing overwrite", block_id, new_non_zero, existing_non_zero).into());
                        true
                    } else if new_non_zero < existing_non_zero {
                        #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Block {} exists and existing data is richer ({} vs {} non-zero bytes), SKIPPING to preserve richer data", block_id, existing_non_zero, new_non_zero).into());
                        false
                    } else {
                        #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Block {} exists but has no committed metadata, allowing overwrite", block_id).into());
                        true
                    }
                }
            } else {
                // Check if there's committed data in global storage that we haven't seen yet
                let has_global_committed_data = vfs_sync::with_global_metadata(|meta| {
                    let meta_map = meta.borrow();
                    if let Some(db_meta) = meta_map.get(&self.db_name) {
                        if let Some(metadata) = db_meta.get(&block_id) {
                            metadata.version > 0
                        } else {
                            false
                        }
                    } else {
                        false
                    }
                });
                
                if has_global_committed_data {
                    #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Block {} has committed metadata in global storage, allowing transactional write", block_id).into());
                    true  // Allow transactional writes even when committed data exists
                } else {
                    // No existing data and no committed metadata, safe to write
                    true
                }
            };
            
            if should_write {
                vfs_sync::with_global_storage(|storage| {
                    let mut storage_map = storage.borrow_mut();
                    let db_storage = storage_map.entry(self.db_name.clone()).or_insert_with(HashMap::new);
                    
                    // Log what we're about to write vs what exists
                    if let Some(existing) = db_storage.get(&block_id) {
                        let existing_preview = if existing.len() >= 16 {
                            format!("{:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x}", 
                                existing[0], existing[1], existing[2], existing[3], existing[4], existing[5], existing[6], existing[7])
                        } else {
                            "short".to_string()
                        };
                        let new_preview = if data.len() >= 16 {
                            format!("{:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x}", 
                                data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7])
                        } else {
                            "short".to_string()
                        };
                        #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Overwriting block {} - existing: {}, new: {}", block_id, existing_preview, new_preview).into());
                    }
                    
                    db_storage.insert(block_id, data.clone());
                    #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Persisted block {} to global storage (new/updated)", block_id).into());
                });
            }
            
            // Always ensure metadata exists for the block, even if we skipped the write
            vfs_sync::with_global_metadata(|meta| {
                let mut meta_map = meta.borrow_mut();
                let db_meta = meta_map.entry(self.db_name.clone()).or_insert_with(HashMap::new);
                if !db_meta.contains_key(&block_id) {
                    // Calculate checksum for the data that will be stored (either new or existing)
                    let stored_data = if should_write {
                        data.clone()
                    } else {
                        // Use existing data from global storage
                        vfs_sync::with_global_storage(|storage| {
                            let storage_map = storage.borrow();
                            if let Some(db_storage) = storage_map.get(&self.db_name) {
                                if let Some(existing) = db_storage.get(&block_id) {
                                    existing.clone()
                                } else {
                                    data.clone() // Fallback to new data
                                }
                            } else {
                                data.clone() // Fallback to new data
                            }
                        })
                    };
                    
                    let checksum = {
                        let mut hasher = crc32fast::Hasher::new();
                        hasher.update(&stored_data);
                        hasher.finalize() as u64
                    };
                    db_meta.insert(block_id, BlockMetadataPersist {
                        checksum,
                        version: 1,  // Start at version 1 so uncommitted data is hidden (commit marker starts at 0)
                        last_modified_ms: 0, // Will be updated during sync
                        algo: ChecksumAlgorithm::CRC32,
                    });
                    #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Created metadata for block {} with checksum {}", block_id, checksum).into());
                }
            });
            
            // Also create metadata for native test path
            #[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions), not(feature = "fs_persist")))]
            GLOBAL_METADATA_TEST.with(|meta| {
                let mut meta_map = meta.borrow_mut();
                let db_meta = meta_map.entry(self.db_name.clone()).or_insert_with(HashMap::new);
                if !db_meta.contains_key(&block_id) {
                    // Calculate checksum for the data that will be stored (either new or existing)
                    let stored_data = if should_write {
                        data.clone()
                    } else {
                        // Use existing data from global test storage
                        vfs_sync::with_global_storage(|storage| {
                            let storage_map = storage.borrow();
                            if let Some(db_storage) = storage_map.get(&self.db_name) {
                                if let Some(existing) = db_storage.get(&block_id) {
                                    existing.clone()
                                } else {
                                    data.clone() // Fallback to new data
                                }
                            } else {
                                data.clone() // Fallback to new data
                            }
                        })
                    };
                    
                    let checksum = {
                        let mut hasher = crc32fast::Hasher::new();
                        hasher.update(&stored_data);
                        hasher.finalize() as u64
                    };
                    db_meta.insert(block_id, BlockMetadataPersist {
                        checksum,
                        version: 1,  // Start at version 1 so uncommitted data is hidden (commit marker starts at 0)
                        last_modified_ms: 0, // Will be updated during sync
                        algo: ChecksumAlgorithm::CRC32,
                    });
                    log::debug!("Created test metadata for block {} with checksum {}", block_id, checksum);
                }
            });
        }
        
        // Update cache and mark as dirty
        self.cache.insert(block_id, data.clone());
        {
            let mut dirty = self.dirty_blocks.lock().unwrap();
            dirty.insert(block_id, data);
        }
        // Update checksum metadata on write
        if let Some(bytes) = self.cache.get(&block_id) {
            self.checksum_manager.store_checksum(block_id, bytes);
        }
        // Record write time for debounce tracking (native)
        #[cfg(not(target_arch = "wasm32"))]
        {
            self.last_write_ms.store(Self::now_millis(), Ordering::SeqCst);
        }

        // Policy-based triggers: thresholds
        let (max_dirty_opt, max_bytes_opt) = self
            .policy
            .as_ref()
            .map(|p| (p.max_dirty, p.max_dirty_bytes))
            .unwrap_or((None, None));

        let mut threshold_reached = false;
        if let Some(max_dirty) = max_dirty_opt {
            let cur = self.dirty_blocks.lock().unwrap().len();
            if cur >= max_dirty { threshold_reached = true; }
        }
        if let Some(max_bytes) = max_bytes_opt {
            let cur_bytes: usize = {
                let m = self.dirty_blocks.lock().unwrap();
                m.values().map(|v| v.len()).sum()
            };
            if cur_bytes >= max_bytes { threshold_reached = true; }
        }

        if threshold_reached {
            let debounce_ms_opt = self.policy.as_ref().and_then(|p| p.debounce_ms);
            if let Some(_debounce) = debounce_ms_opt {
                // Debounce enabled: mark threshold and let debounce thread flush after inactivity
                #[cfg(not(target_arch = "wasm32"))]
                {
                    self.threshold_hit.store(true, Ordering::SeqCst);
                }
            } else {
                // No debounce: flush immediately
                let _ = self.sync_now();
            }
        }
        
        log::debug!("Block {} marked as dirty (sync)", block_id);
        self.touch_lru(block_id);
        self.evict_if_needed();
        Ok(())
    }

    pub async fn write_block(&mut self, block_id: u64, data: Vec<u8>) -> Result<(), DatabaseError> {
        // Delegate to synchronous implementation (immediately ready)
        self.write_block_sync(block_id, data)
    }

    /// Synchronous batch write of blocks
    pub fn write_blocks_sync(&mut self, items: Vec<(u64, Vec<u8>)>) -> Result<(), DatabaseError> {
        self.maybe_auto_sync();
        for (block_id, data) in items {
            self.write_block_sync(block_id, data)?;
        }
        Ok(())
    }

    /// Async batch write wrapper
    pub async fn write_blocks(&mut self, items: Vec<(u64, Vec<u8>)>) -> Result<(), DatabaseError> {
        self.write_blocks_sync(items)
    }

    /// Synchronous batch read of blocks, preserving input order
    pub fn read_blocks_sync(&mut self, block_ids: &[u64]) -> Result<Vec<Vec<u8>>, DatabaseError> {
        self.maybe_auto_sync();
        let mut results = Vec::with_capacity(block_ids.len());
        for &id in block_ids {
            results.push(self.read_block_sync(id)?);
        }
        Ok(results)
    }

    /// Async batch read wrapper
    pub async fn read_blocks(&mut self, block_ids: &[u64]) -> Result<Vec<Vec<u8>>, DatabaseError> {
        self.read_blocks_sync(block_ids)
    }

    /// Get block checksum for verification
    pub fn get_block_checksum(&self, block_id: u64) -> Option<u32> {
        self.checksum_manager.get_checksum(block_id).map(|checksum| checksum as u32)
    }

    /// Get current commit marker for this database (WASM only, for testing)
    #[cfg(target_arch = "wasm32")]
    pub fn get_commit_marker(&self) -> u64 {
        vfs_sync::with_global_commit_marker(|cm| {
            cm.borrow().get(&self.db_name).copied().unwrap_or(0)
        })
    }

    /// Check if this database has any blocks in storage (WASM only)
    #[cfg(target_arch = "wasm32")]
    pub fn has_any_blocks(&self) -> bool {
        vfs_sync::with_global_storage(|gs| {
            gs.borrow().get(&self.db_name).map_or(false, |blocks| !blocks.is_empty())
        })
    }

    pub async fn verify_block_checksum(&mut self, block_id: u64) -> Result<(), DatabaseError> {
        // If cached, verify directly against cached bytes
        if let Some(bytes) = self.cache.get(&block_id).cloned() {
            return self.verify_against_stored_checksum(block_id, &bytes);
        }
        // Otherwise, a read will populate cache and also verify
        let data = self.read_block_sync(block_id)?;
        self.verify_against_stored_checksum(block_id, &data)
    }

    #[cfg(any(test, debug_assertions))]
    pub fn get_block_metadata_for_testing(&self) -> HashMap<u64, (u64, u32, u64)> {
        // Returns map of block_id -> (checksum, version, last_modified_ms)
        #[cfg(target_arch = "wasm32")]
        {
            let mut out = HashMap::new();
            vfs_sync::with_global_metadata(|meta| {
                let meta_map = meta.borrow();
                if let Some(db_meta) = meta_map.get(&self.db_name) {
                    for (bid, m) in db_meta.iter() {
                        out.insert(*bid, (m.checksum, m.version, m.last_modified_ms));
                    }
                }
            });
            out
        }
        #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
        {
            let mut out = HashMap::new();
            let base: PathBuf = self.base_dir.clone();
            let mut db_dir = base.clone();
            db_dir.push(&self.db_name);
            let mut meta_path = db_dir.clone();
            meta_path.push("metadata.json");
            if let Ok(mut f) = fs::File::open(&meta_path) {
                let mut s = String::new();
                if f.read_to_string(&mut s).is_ok() {
                    if let Ok(parsed) = serde_json::from_str::<FsMeta>(&s) {
                        for (bid, m) in parsed.entries.into_iter() { out.insert(bid, (m.checksum, m.version, m.last_modified_ms)); }
                    }
                }
            }
            out
        }
        #[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions), not(feature = "fs_persist")))]
        {
            let mut out = HashMap::new();
            GLOBAL_METADATA_TEST.with(|meta| {
                let meta_map = meta.borrow();
                if let Some(db_meta) = meta_map.get(&self.db_name) {
                    for (bid, m) in db_meta.iter() {
                        out.insert(*bid, (m.checksum, m.version, m.last_modified_ms));
                    }
                }
            });
            out
        }
    }

    #[cfg(any(test, debug_assertions))]
    pub fn set_block_checksum_for_testing(&mut self, block_id: u64, checksum: u64) {
        self.checksum_manager.set_checksum_for_testing(block_id, checksum);
    }

    /// Getter for dirty_blocks for fs_persist and auto_sync modules
    #[cfg(not(target_arch = "wasm32"))]
    pub(super) fn get_dirty_blocks(&self) -> &Arc<Mutex<HashMap<u64, Vec<u8>>>> {
        &self.dirty_blocks
    }


    pub async fn sync(&mut self) -> Result<(), DatabaseError> {
        // For WASM, we need to handle the async IndexedDB operations properly
        #[cfg(target_arch = "wasm32")]
        {
            // Call the sync implementation but handle the spawned async operations
            let result = self.sync_implementation();
            // Give time for the spawned IndexedDB operations to complete
            wasm_bindgen_futures::JsFuture::from(js_sys::Promise::resolve(&wasm_bindgen::JsValue::UNDEFINED)).await.ok();
            result
        }
        #[cfg(not(target_arch = "wasm32"))]
        {
            self.sync_implementation()
        }
    }

    /// Synchronous sync method for VFS compatibility
    pub fn sync_now(&mut self) -> Result<(), DatabaseError> {
        self.sync_implementation()
    }

    /// Sync blocks to global storage without advancing commit marker
    /// Used by VFS x_sync callback to persist blocks but maintain commit marker lag
    #[cfg(target_arch = "wasm32")]
    pub fn sync_blocks_only(&mut self) -> Result<(), DatabaseError> {
        super::wasm_vfs_sync::sync_blocks_only(self)
    }


    /// Async version of sync for WASM that properly awaits IndexedDB persistence
    #[cfg(target_arch = "wasm32")]
    pub async fn sync_async(&mut self) -> Result<(), DatabaseError> {
        web_sys::console::log_1(&"DEBUG: Using ASYNC sync_async method".into());
        // Get current commit marker
        let current_commit = vfs_sync::with_global_commit_marker(|cm| {
            let cm = cm.borrow();
            cm.get(&self.db_name).copied().unwrap_or(0)
        });
        
        let next_commit = current_commit + 1;
        web_sys::console::log_1(&format!("DEBUG: Current commit marker for {}: {}", self.db_name, current_commit).into());
        web_sys::console::log_1(&format!("DEBUG: Next commit marker for {}: {}", self.db_name, next_commit).into());
        
        // Collect blocks to persist with commit marker gating and richer cache data logic
        let mut to_persist = Vec::new();
        let mut metadata_to_persist = Vec::new();
        
        for (&block_id, block_data) in &self.cache {
            let should_update = vfs_sync::with_global_storage(|storage| {
                let storage = storage.borrow();
                if let Some(db_storage) = storage.get(&self.db_name) {
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
        vfs_sync::with_global_storage(|storage| {
            let mut storage = storage.borrow_mut();
            let db_storage = storage.entry(self.db_name.clone()).or_insert_with(std::collections::HashMap::new);
            for (block_id, block_data) in &to_persist {
                db_storage.insert(*block_id, block_data.clone());
            }
        });
        
        // Update global metadata
        vfs_sync::with_global_metadata(|metadata| {
            let mut metadata = metadata.borrow_mut();
            let db_metadata = metadata.entry(self.db_name.clone()).or_insert_with(std::collections::HashMap::new);
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
            cm_map.insert(self.db_name.clone(), next_commit);
        });
        
        // Perform IndexedDB persistence with proper event-based waiting
        if !to_persist.is_empty() {
            #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: Awaiting IndexedDB persistence for {} blocks", to_persist.len()).into());
            self.persist_to_indexeddb_event_based(to_persist, metadata_to_persist, next_commit).await?;
        }
        
        // Clear dirty blocks
        {
            let mut dirty = self.dirty_blocks.lock().unwrap();
            dirty.clear();
        }
        
        Ok(())
    }

    /// Event-based async IndexedDB persistence
    #[cfg(target_arch = "wasm32")]
    pub async fn persist_to_indexeddb_event_based(&self, blocks: Vec<(u64, Vec<u8>)>, metadata: Vec<(u64, u64)>, commit_marker: u64) -> Result<(), DatabaseError> {
        use wasm_bindgen::JsCast;
        use wasm_bindgen::closure::Closure;
        use futures::channel::oneshot;
        
        let window = web_sys::window().unwrap();
        let idb_factory = window.indexed_db().unwrap().unwrap();
        let open_req = idb_factory.open_with_u32("sqlite_storage", 1).unwrap();
        
        // Set up upgrade handler
        let upgrade_closure = Closure::wrap(Box::new(move |event: web_sys::Event| {
            let target = event.target().unwrap();
            let db: web_sys::IdbDatabase = target.dyn_into().unwrap();
            if !db.object_store_names().contains("blocks") {
                db.create_object_store("blocks").unwrap();
            }
            if !db.object_store_names().contains("metadata") {
                db.create_object_store("metadata").unwrap();
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
                    let db: web_sys::IdbDatabase = target.dyn_into().unwrap();
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
        let transaction = db.transaction_with_str_sequence_and_mode(&store_names, web_sys::IdbTransactionMode::Readwrite).unwrap();
        
        let blocks_store = transaction.object_store("blocks").unwrap();
        let metadata_store = transaction.object_store("metadata").unwrap();
        
        // Store blocks
        for (block_id, block_data) in blocks {
            let key = format!("{}:{}", self.db_name, block_id);
            let value = js_sys::Uint8Array::from(&block_data[..]);
            let _ = blocks_store.put_with_key(&value, &key.into());
        }
        
        // Store metadata
        for (block_id, version) in metadata {
            let key = format!("{}:{}", self.db_name, block_id);
            let value = js_sys::Number::from(version as f64);
            let _ = metadata_store.put_with_key(&value, &key.into());
        }
        
        // Store commit marker
        let commit_key = format!("{}:commit_marker", self.db_name);
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

    /// Internal sync implementation shared by sync() and sync_now()
    fn sync_implementation(&mut self) -> Result<(), DatabaseError> {
        #[cfg(target_arch = "wasm32")]
        use wasm_bindgen::JsCast;
        #[cfg(all(not(target_arch = "wasm32"), not(feature = "fs_persist")))]
        let start = std::time::Instant::now();
        
        // Call the existing fs_persist implementation for native builds
        #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
        {
            return self.fs_persist_sync();
        }
        
        // For native non-fs_persist builds, use simple in-memory sync with commit marker handling
        #[cfg(all(not(target_arch = "wasm32"), not(feature = "fs_persist")))]
        {
            let current_dirty = self.dirty_blocks.lock().unwrap().len();
            log::info!("Syncing {} dirty blocks (native non-fs_persist)", current_dirty);
            
            // Get dirty blocks to persist
            let to_persist: Vec<(u64, Vec<u8>)> = {
                let dirty = self.dirty_blocks.lock().unwrap();
                dirty.iter().map(|(k,v)| (*k, v.clone())).collect()
            };
            let ids: Vec<u64> = to_persist.iter().map(|(k, _)| *k).collect();
            
            // Determine next commit version for native test path
            let next_commit: u64 = vfs_sync::with_global_commit_marker(|cm| {
                let cm = cm.borrow();
                let current = cm.get(&self.db_name).copied().unwrap_or(0);
                log::debug!("DEBUG: Current commit marker for {}: {}", self.db_name, current);
                current + 1
            });
            log::debug!("DEBUG: Next commit marker for {}: {}", self.db_name, next_commit);
            
            // Persist to native test global storage
            vfs_sync::with_global_storage(|storage| {
                let mut storage_map = storage.borrow_mut();
                let db_storage = storage_map.entry(self.db_name.clone()).or_insert_with(HashMap::new);
                for (block_id, data) in &to_persist {
                    db_storage.insert(*block_id, data.clone());
                    log::debug!("Persisted block {} to native test global storage", block_id);
                }
            });
            
            // Persist corresponding metadata entries for native test path
            GLOBAL_METADATA_TEST.with(|meta| {
                let mut meta_map = meta.borrow_mut();
                let db_meta = meta_map.entry(self.db_name.clone()).or_insert_with(HashMap::new);
                for block_id in ids {
                    if let Some(checksum) = self.checksum_manager.get_checksum(block_id) {
                        // Use the per-commit version so entries remain invisible until the commit marker advances
                        let version = next_commit as u32;
                        db_meta.insert(
                            block_id,
                            BlockMetadataPersist {
                                checksum,
                                last_modified_ms: std::time::SystemTime::now()
                                    .duration_since(std::time::UNIX_EPOCH)
                                    .unwrap_or_default()
                                    .as_millis() as u64,
                                version,
                                algo: self.checksum_manager.get_algorithm(block_id),
                            },
                        );
                        log::debug!("Persisted metadata for block {} in native test path", block_id);
                    }
                }
            });
            
            // Atomically advance the commit marker after all data and metadata are persisted
            vfs_sync::with_global_commit_marker(|cm| {
                let mut cm_map = cm.borrow_mut();
                cm_map.insert(self.db_name.clone(), next_commit);
                log::debug!("Advanced commit marker for {} to {}", self.db_name, next_commit);
            });
            
            // Clear dirty blocks
            {
                let mut dirty = self.dirty_blocks.lock().unwrap();
                dirty.clear();
            }
            
            // Update sync metrics
            self.sync_count.fetch_add(1, Ordering::SeqCst);
            let elapsed = start.elapsed();
            let ms = elapsed.as_millis() as u64;
            let ms = if ms == 0 { 1 } else { ms };
            self.last_sync_duration_ms.store(ms, Ordering::SeqCst);
            self.evict_if_needed();
            return Ok(());
        }
        
        #[cfg(target_arch = "wasm32")]
        {
            // WASM implementation
            let current_dirty = self.dirty_blocks.lock().unwrap().len();
            log::info!("Syncing {} dirty blocks (WASM)", current_dirty);
            
            // For WASM, persist dirty blocks to global storage
            let to_persist: Vec<(u64, Vec<u8>)> = {
                let dirty = self.dirty_blocks.lock().unwrap();
                dirty.iter().map(|(k,v)| (*k, v.clone())).collect()
            };
            let ids: Vec<u64> = to_persist.iter().map(|(k, _)| *k).collect();
            // Determine next commit version so that all metadata written in this sync share the same version
            let next_commit: u64 = vfs_sync::with_global_commit_marker(|cm| {
                let cm = cm.borrow();
                let current = cm.get(&self.db_name).copied().unwrap_or(0);
                #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Current commit marker for {}: {}", self.db_name, current).into());
                current + 1
            });
            #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: Next commit marker for {}: {}", self.db_name, next_commit).into());
            vfs_sync::with_global_storage(|storage| {
                let mut storage_map = storage.borrow_mut();
                let db_storage = storage_map.entry(self.db_name.clone()).or_insert_with(HashMap::new);
                for (block_id, data) in &to_persist {
                    // Check if block already exists in global storage with committed data
                    let should_update = if let Some(existing) = db_storage.get(block_id) {
                        if existing != data {
                            // Check if existing data has committed metadata (version > 0)
                            let has_committed_metadata = vfs_sync::with_global_metadata(|meta| {
                                let meta_map = meta.borrow();
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
                                format!("{:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x}", 
                                    existing[0], existing[1], existing[2], existing[3], existing[4], existing[5], existing[6], existing[7])
                            } else { "short".to_string() };
                            let new_preview = if data.len() >= 8 {
                                format!("{:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x}", 
                                    data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7])
                            } else { "short".to_string() };
                            
                            if has_committed_metadata {
                                // CRITICAL FIX: Never overwrite committed data to prevent corruption
                                // Once data is committed, it should be immutable to maintain data integrity
                                #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: SYNC preserving committed block {} - existing: {}, cache: {} - NEVER OVERWRITE COMMITTED DATA", block_id, existing_preview, new_preview).into());
                                false // Never overwrite committed data
                            } else {
                                #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: SYNC updating uncommitted block {} - existing: {}, new: {}", block_id, existing_preview, new_preview).into());
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
                let db_meta = meta_map.entry(self.db_name.clone()).or_insert_with(HashMap::new);
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
                let mut cm_map = cm.borrow_mut();
                cm_map.insert(self.db_name.clone(), next_commit);
            });
            
            // Spawn async IndexedDB persistence (fire and forget for sync compatibility)
            #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("DEBUG: Spawning IndexedDB persistence for {} blocks", to_persist.len()).into());
            let db_name = self.db_name.clone();
            wasm_bindgen_futures::spawn_local(async move {
                let window = web_sys::window().unwrap();
                let idb_factory = window.indexed_db().unwrap().unwrap();
                let open_req = idb_factory.open_with_u32("sqlite_storage", 1).unwrap();
                
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
                let success_callback = wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
                    if let Some(tx) = success_tx.borrow_mut().take() {
                        let target = event.target().unwrap();
                        let request: web_sys::IdbOpenDbRequest = target.unchecked_into();
                        let result = request.result().unwrap();
                        let _ = tx.send(Ok(result));
                    }
                }) as Box<dyn FnMut(_)>);
                
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
                web_sys::console::log_1(&format!("DEBUG: Successfully opened IndexedDB for persistence").into());
                        if let Ok(db) = db_value.dyn_into::<web_sys::IdbDatabase>() {
                            // Start transaction for both blocks and metadata
                            let store_names = js_sys::Array::new();
                            store_names.push(&wasm_bindgen::JsValue::from_str("blocks"));
                            store_names.push(&wasm_bindgen::JsValue::from_str("metadata"));
                            
                            let transaction = db.transaction_with_str_sequence_and_mode(
                                &store_names,
                                web_sys::IdbTransactionMode::Readwrite
                            ).unwrap();
                            
                            let blocks_store = transaction.object_store("blocks").unwrap();
                            let metadata_store = transaction.object_store("metadata").unwrap();
                            
                            // Persist all blocks
                            for (block_id, data) in &to_persist {
                                let key = wasm_bindgen::JsValue::from_str(&format!("{}_{}", db_name, block_id));
                                let value = js_sys::Uint8Array::from(&data[..]);
                                blocks_store.put_with_key(&value, &key).unwrap();
                                #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Persisted block {} to IndexedDB", block_id).into());
                            }
                            
                            // Persist commit marker
                            let commit_key = wasm_bindgen::JsValue::from_str(&format!("{}_commit_marker", db_name));
                            let commit_value = wasm_bindgen::JsValue::from_f64(next_commit as f64);
                            metadata_store.put_with_key(&commit_value, &commit_key).unwrap();
                            #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Persisted commit marker {} to IndexedDB", next_commit).into());
                            
                            // Use event-based approach for transaction completion
                            let (tx_tx, tx_rx) = futures::channel::oneshot::channel();
                            let tx_tx = std::rc::Rc::new(std::cell::RefCell::new(Some(tx_tx)));
                            
                            let tx_complete_tx = tx_tx.clone();
                            let tx_complete_callback = wasm_bindgen::closure::Closure::wrap(Box::new(move |_event: web_sys::Event| {
                                if let Some(tx) = tx_complete_tx.borrow_mut().take() {
                                    let _ = tx.send(Ok(()));
                                }
                            }) as Box<dyn FnMut(_)>);
                            
                            let tx_error_tx = tx_tx.clone();
                            let tx_error_callback = wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
                                if let Some(tx) = tx_error_tx.borrow_mut().take() {
                                    let _ = tx.send(Err(format!("Transaction failed: {:?}", event)));
                                }
                            }) as Box<dyn FnMut(_)>);
                            
                            transaction.set_oncomplete(Some(tx_complete_callback.as_ref().unchecked_ref()));
                            transaction.set_onerror(Some(tx_error_callback.as_ref().unchecked_ref()));
                            
                            match tx_rx.await {
                                Ok(Ok(_)) => {
                                    #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: IndexedDB transaction completed successfully").into());
                                }
                                Ok(Err(e)) => {
                                    #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: IndexedDB transaction failed: {}", e).into());
                                }
                                Err(_) => {
                                    #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: IndexedDB transaction channel failed").into());
                                }
                            }
                            
                            // Keep closures alive
                            tx_complete_callback.forget();
                            tx_error_callback.forget();
                        } else {
                            #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Failed to cast to IdbDatabase for persistence").into());
                        }
                    }
                    Ok(Err(e)) => {
                        #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: Failed to open IndexedDB for persistence: {}", e).into());
                    }
                    Err(_) => {
                        #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("DEBUG: IndexedDB open channel failed").into());
                    }
                }
            });
            // Clear dirty blocks after successful persistence
            {
                let mut dirty = self.dirty_blocks.lock().unwrap();
                dirty.clear();
            }
            
            // Update sync metrics (WASM only)
            self.evict_if_needed();
            Ok(())
        }
    }

    /// Drain all pending dirty blocks and stop background auto-sync (if enabled).
    /// Safe to call multiple times.
    pub fn drain_and_shutdown(&mut self) {
        if let Err(e) = self.sync_now() {
            log::error!("drain_and_shutdown: sync_now failed: {}", e.message);
        }
        self.auto_sync_interval = None;
        #[cfg(not(target_arch = "wasm32"))]
        {
            if let Some(stop) = &self.auto_sync_stop {
                stop.store(true, Ordering::SeqCst);
            }
            if let Some(handle) = self.auto_sync_thread.take() {
                let _ = handle.join();
            }
            if let Some(handle) = self.debounce_thread.take() {
                let _ = handle.join();
            }
            if let Some(task) = self.tokio_timer_task.take() { task.abort(); }
            if let Some(task) = self.tokio_debounce_task.take() { task.abort(); }
            self.auto_sync_stop = None;
            self.threshold_hit.store(false, Ordering::SeqCst);
        }
    }

    pub fn clear_cache(&mut self) {
        log::debug!("Clearing cache ({} blocks)", self.cache.len());
        self.cache.clear();
        self.lru_order.clear();
    }

    pub fn get_cache_size(&self) -> usize {
        self.cache.len()
    }

    pub fn get_dirty_count(&self) -> usize {
        self.dirty_blocks.lock().unwrap().len()
    }

    pub fn is_cached(&self, block_id: u64) -> bool {
        self.cache.contains_key(&block_id)
    }


    /// Allocate a new block and return its ID
    pub async fn allocate_block(&mut self) -> Result<u64, DatabaseError> {
        log::debug!("Allocating new block");
        
        // Find the next available block ID
        let block_id = self.next_block_id;
        
        // Mark block as allocated
        self.allocated_blocks.insert(block_id);
        self.next_block_id += 1;
        
        // For WASM, persist allocation state to global storage
        #[cfg(target_arch = "wasm32")]
        {
            vfs_sync::with_global_allocation_map(|allocation_map| {
                let mut allocation_map = allocation_map.borrow_mut();
                let db_allocations = allocation_map.entry(self.db_name.clone()).or_insert_with(HashSet::new);
                db_allocations.insert(block_id);
            });
        }
        
        // fs_persist: mirror allocation to allocations.json
        #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
        {
            let base: PathBuf = self.base_dir.clone();
            let mut db_dir = base.clone();
            db_dir.push(&self.db_name);
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
                if f.read_to_string(&mut s).is_ok() { let _ = serde_json::from_str::<FsAlloc>(&s).map(|a| { alloc = a; }); }
            }
            if !alloc.allocated.contains(&block_id) { alloc.allocated.push(block_id); }
            if let Ok(mut f) = fs::File::create(&alloc_path) { let _ = f.write_all(serde_json::to_string(&alloc).unwrap_or_else(|_| "{}".into()).as_bytes()); }

            // Remove any tombstone (block was reallocated) and persist deallocated.json
            let mut dealloc_path = db_dir.clone();
            dealloc_path.push("deallocated.json");
            self.deallocated_blocks.remove(&block_id);
            let mut dealloc = FsDealloc::default();
            // best effort read to preserve any existing entries
            if let Ok(mut f) = fs::File::open(&dealloc_path) {
                let mut s = String::new();
                if f.read_to_string(&mut s).is_ok() { let _ = serde_json::from_str::<FsDealloc>(&s).map(|d| { dealloc = d; }); }
            }
            dealloc.tombstones = self.deallocated_blocks.iter().cloned().collect();
            dealloc.tombstones.sort_unstable();
            if let Ok(mut f) = fs::File::create(&dealloc_path) { let _ = f.write_all(serde_json::to_string(&dealloc).unwrap_or_else(|_| "{}".into()).as_bytes()); }
        }

        // For native tests, mirror allocation state to test-global (when fs_persist disabled)
        #[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions), not(feature = "fs_persist")))]
        {
            vfs_sync::with_global_allocation_map(|allocation_map| {
                let mut allocation_map = allocation_map.borrow_mut();
                let db_allocations = allocation_map.entry(self.db_name.clone()).or_insert_with(HashSet::new);
                db_allocations.insert(block_id);
            });
        }
        
        log::info!("Allocated block: {} (total allocated: {})", block_id, self.allocated_blocks.len());
        Ok(block_id)
    }

    /// Deallocate a block and mark it as available for reuse
    pub async fn deallocate_block(&mut self, block_id: u64) -> Result<(), DatabaseError> {
        log::debug!("Deallocating block: {}", block_id);
        
        // Check if block is actually allocated
        if !self.allocated_blocks.contains(&block_id) {
            return Err(DatabaseError::new(
                "BLOCK_NOT_ALLOCATED",
                &format!("Block {} is not allocated", block_id)
            ));
        }
        
        // Remove from allocated set
        self.allocated_blocks.remove(&block_id);
        
        // Clear from cache and dirty blocks
        self.cache.remove(&block_id);
        self.dirty_blocks.lock().unwrap().remove(&block_id);
        // Remove checksum metadata
        self.checksum_manager.remove_checksum(block_id);
        
        // For WASM, remove from global storage
        #[cfg(target_arch = "wasm32")]
        {
            vfs_sync::with_global_storage(|storage| {
                let mut storage_map = storage.borrow_mut();
                if let Some(db_storage) = storage_map.get_mut(&self.db_name) {
                    db_storage.remove(&block_id);
                }
            });
            
            vfs_sync::with_global_allocation_map(|allocation_map| {
                let mut allocation_map = allocation_map.borrow_mut();
                if let Some(db_allocations) = allocation_map.get_mut(&self.db_name) {
                    db_allocations.remove(&block_id);
                }
            });

            // Remove persisted metadata entry as well
            vfs_sync::with_global_metadata(|meta| {
                let mut meta_map = meta.borrow_mut();
                if let Some(db_meta) = meta_map.get_mut(&self.db_name) {
                    db_meta.remove(&block_id);
                }
            });
        }
        
        // For native fs_persist, remove files and update JSON stores
        #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
        {
            let base: PathBuf = self.base_dir.clone();
            let mut db_dir = base.clone();
            db_dir.push(&self.db_name);
            let mut blocks_dir = db_dir.clone();
            blocks_dir.push("blocks");
            let mut block_path = blocks_dir.clone();
            block_path.push(format!("block_{}.bin", block_id));
            let _ = fs::remove_file(&block_path);

            // update allocations.json
            let mut alloc_path = db_dir.clone();
            alloc_path.push("allocations.json");
            let mut alloc = FsAlloc::default();
            if let Ok(mut f) = fs::File::open(&alloc_path) { let mut s = String::new(); if f.read_to_string(&mut s).is_ok() { let _ = serde_json::from_str::<FsAlloc>(&s).map(|a| { alloc = a; }); } }
            alloc.allocated.retain(|&id| id != block_id);
            if let Ok(mut f) = fs::File::create(&alloc_path) { let _ = f.write_all(serde_json::to_string(&alloc).unwrap_or_else(|_| "{}".into()).as_bytes()); }

            // update metadata.json (remove entry)
            let mut meta_path = db_dir.clone();
            meta_path.push("metadata.json");
            // Tolerant JSON handling: remove entry with matching id from entries array
            let mut meta_val: serde_json::Value = serde_json::json!({"entries": []});
            if let Ok(mut f) = fs::File::open(&meta_path) {
                let mut s = String::new();
                if f.read_to_string(&mut s).is_ok() { if let Ok(v) = serde_json::from_str::<serde_json::Value>(&s) { meta_val = v; } }
            }
            if !meta_val.is_object() { meta_val = serde_json::json!({"entries": []}); }
            if let Some(entries) = meta_val.get_mut("entries").and_then(|v| v.as_array_mut()) {
                entries.retain(|ent| {
                    ent.as_array()
                        .and_then(|arr| arr.get(0))
                        .and_then(|v| v.as_u64())
                        .map(|bid| bid != block_id)
                        .unwrap_or(true)
                });
            }
            let meta_string = serde_json::to_string(&meta_val).unwrap_or_else(|_| "{}".into());
            if let Ok(mut f) = fs::File::create(&meta_path) { let _ = f.write_all(meta_string.as_bytes()); }

            // Append to deallocated tombstones and persist deallocated.json
            let mut dealloc_path = db_dir.clone();
            dealloc_path.push("deallocated.json");
            self.deallocated_blocks.insert(block_id);
            let mut dealloc = FsDealloc::default();
            if let Ok(mut f) = fs::File::open(&dealloc_path) { let mut s = String::new(); if f.read_to_string(&mut s).is_ok() { let _ = serde_json::from_str::<FsDealloc>(&s).map(|d| { dealloc = d; }); } }
            dealloc.tombstones = self.deallocated_blocks.iter().cloned().collect();
            dealloc.tombstones.sort_unstable();
            if let Ok(mut f) = fs::File::create(&dealloc_path) { let _ = f.write_all(serde_json::to_string(&dealloc).unwrap_or_else(|_| "{}".into()).as_bytes()); }
        }

        // For native tests, mirror removal from test-globals (when fs_persist disabled)
        #[cfg(all(not(target_arch = "wasm32"), any(test, debug_assertions), not(feature = "fs_persist")))]
        {
            vfs_sync::with_global_storage(|storage| {
                let mut storage_map = storage.borrow_mut();
                if let Some(db_storage) = storage_map.get_mut(&self.db_name) {
                    db_storage.remove(&block_id);
                }
            });
            
            vfs_sync::with_global_allocation_map(|allocation_map| {
                let mut allocation_map = allocation_map.borrow_mut();
                if let Some(db_allocations) = allocation_map.get_mut(&self.db_name) {
                    db_allocations.remove(&block_id);
                }
            });

            GLOBAL_METADATA_TEST.with(|meta| {
                let mut meta_map = meta.borrow_mut();
                if let Some(db_meta) = meta_map.get_mut(&self.db_name) {
                    db_meta.remove(&block_id);
                }
            });
        }
        
        // Update next_block_id to reuse deallocated blocks
        if block_id < self.next_block_id {
            self.next_block_id = block_id;
        }
        
        log::info!("Deallocated block: {} (total allocated: {})", block_id, self.allocated_blocks.len());
        Ok(())
    }

    /// Get the number of currently allocated blocks
    pub fn get_allocated_count(&self) -> usize {
        self.allocated_blocks.len()
    }
}

#[cfg(all(test, target_arch = "wasm32"))]
mod wasm_commit_marker_tests {
    use super::*;
    use wasm_bindgen_test::*;

    wasm_bindgen_test_configure!(run_in_browser);

    // Helper: set commit marker for a db name in WASM global
    fn set_commit_marker(db: &str, v: u64) {
        super::vfs_sync::with_global_commit_marker(|cm| {
            cm.borrow_mut().insert(db.to_string(), v);
        });
    }

    // Helper: get commit marker for a db name in WASM global
    fn get_commit_marker(db: &str) -> u64 {
        vfs_sync::with_global_commit_marker(|cm| cm.borrow().get(db).copied().unwrap_or(0))
    }

    #[wasm_bindgen_test]
    async fn gating_returns_zeroed_until_marker_catches_up_wasm() {
        let db = "cm_gating_wasm";
        let mut s = BlockStorage::new(db).await.expect("create storage");

        // Write a block (starts at version 1, uncommitted)
        let bid = s.allocate_block().await.expect("alloc block");
        let data_v1 = vec![0x33u8; BLOCK_SIZE];
        s.write_block(bid, data_v1.clone()).await.expect("write v1");
        
        // Before sync, commit marker is 0, block version is 1, so should be invisible
        s.clear_cache();
        let out0 = s.read_block(bid).await.expect("read before commit");
        assert_eq!(out0, vec![0u8; BLOCK_SIZE], "uncommitted data must read as zeroed");

        // After sync, commit marker advances to 1, block version is 1, so should be visible
        s.sync().await.expect("sync v1");
        s.clear_cache();
        let out1 = s.read_block(bid).await.expect("read after commit");
        assert_eq!(out1, data_v1, "committed data should be visible");
    }

    #[wasm_bindgen_test]
    async fn invisible_blocks_skip_checksum_verification_wasm() {
        let db = "cm_checksum_skip_wasm";
        let mut s = BlockStorage::new(db).await.expect("create storage");

        let bid = s.allocate_block().await.expect("alloc block");
        let data = vec![0x44u8; BLOCK_SIZE];
        s.write_block(bid, data).await.expect("write v1");
        s.sync().await.expect("sync v1"); // commit marker advances to 1, block version is 1

        // Make the block invisible by moving commit marker back to 0
        set_commit_marker(db, 0);

        // Corrupt the stored checksum; invisible reads must NOT verify checksum
        s.set_block_checksum_for_testing(bid, 1234567);
        s.clear_cache();
        let out = s.read_block(bid).await.expect("read while invisible should not error");
        assert_eq!(out, vec![0u8; BLOCK_SIZE], "invisible block reads as zeroed");

        // Now make it visible again; checksum verification should trigger and fail
        set_commit_marker(db, 1);
        s.clear_cache();
        let err = s
            .read_block(bid)
            .await
            .expect_err("expected checksum mismatch once visible");
        assert_eq!(err.code, "CHECKSUM_MISMATCH");
    }

    #[wasm_bindgen_test]
    async fn commit_marker_advances_and_versions_track_syncs_wasm() {
        let db = "cm_versions_wasm";
        let mut s = BlockStorage::new_with_capacity(db, 8)
            .await
            .expect("create storage");

        let b1 = s.allocate_block().await.expect("alloc b1");
        let b2 = s.allocate_block().await.expect("alloc b2");

        s.write_block(b1, vec![1u8; BLOCK_SIZE]).await.expect("write b1 v1");
        s.write_block(b2, vec![2u8; BLOCK_SIZE]).await.expect("write b2 v1");
        s.sync().await.expect("sync #1");

        let cm1 = get_commit_marker(db);
        assert_eq!(cm1, 1, "first sync should advance commit marker to 1");
        let meta1 = s.get_block_metadata_for_testing();
        assert_eq!(meta1.get(&b1).unwrap().1 as u64, cm1);
        assert_eq!(meta1.get(&b2).unwrap().1 as u64, cm1);

        // Update only b1 and sync again; only b1's version should bump
        s.write_block(b1, vec![3u8; BLOCK_SIZE]).await.expect("write b1 v2");
        s.sync().await.expect("sync #2");

        let cm2 = get_commit_marker(db);
        assert_eq!(cm2, 2, "second sync should advance commit marker to 2");
        let meta2 = s.get_block_metadata_for_testing();
        assert_eq!(meta2.get(&b1).unwrap().1 as u64, cm2, "updated block tracks new version");
        assert_eq!(meta2.get(&b2).unwrap().1 as u64, 1, "unchanged block retains prior version");
    }
}

#[cfg(all(test, not(target_arch = "wasm32"), not(feature = "fs_persist")))]
mod commit_marker_tests {
    use super::*;

    // Helper: set commit marker for a db name in test-global mirror
    fn set_commit_marker(db: &str, v: u64) {
        super::vfs_sync::with_global_commit_marker(|cm| {
            cm.borrow_mut().insert(db.to_string(), v);
        });
    }

    // Helper: get commit marker for a db name in test-global mirror
    fn get_commit_marker(db: &str) -> u64 {
        super::vfs_sync::with_global_commit_marker(|cm| cm.borrow().get(db).copied().unwrap_or(0))
    }

    #[tokio::test(flavor = "current_thread")]
    async fn gating_returns_zeroed_until_marker_catches_up() {
        let db = "cm_gating_basic";
        println!("DEBUG: Creating BlockStorage for {}", db);
        let mut s = BlockStorage::new(db).await.expect("create storage");
        println!("DEBUG: BlockStorage created successfully");

        // Write a block (starts at version 1, uncommitted)
        let bid = s.allocate_block().await.expect("alloc block");
        println!("DEBUG: Allocated block {}", bid);
        let data_v1 = vec![0x11u8; BLOCK_SIZE];
        s.write_block(bid, data_v1.clone()).await.expect("write v1");
        println!("DEBUG: Wrote block {} with data", bid);
        
        // Before sync, commit marker is 0, block version is 1, so should be invisible
        s.clear_cache();
        let out0 = s.read_block(bid).await.expect("read before commit");
        assert_eq!(out0, vec![0u8; BLOCK_SIZE], "uncommitted data must read as zeroed");
        println!("DEBUG: Pre-sync read returned zeroed data as expected");

        // After sync, commit marker advances to 1, block version is 1, so should be visible
        println!("DEBUG: About to call sync");
        s.sync().await.expect("sync v1");
        println!("DEBUG: Sync completed successfully");
        
        // Debug: Check commit marker and metadata after sync
        let commit_marker = get_commit_marker(db);
        println!("DEBUG: Commit marker after sync: {}", commit_marker);
        
        s.clear_cache();
        let out1 = s.read_block(bid).await.expect("read after commit");
        
        // Debug: Print what we got vs what we expected
        println!("DEBUG: Expected data: {:?}", &data_v1[..8]);
        println!("DEBUG: Actual data: {:?}", &out1[..8]);
        println!("DEBUG: Data lengths - expected: {}, actual: {}", data_v1.len(), out1.len());
        
        // Check if data matches without panicking
        let data_matches = out1 == data_v1;
        println!("DEBUG: Data matches: {}", data_matches);
        
        if !data_matches {
            println!("DEBUG: Data mismatch detected - investigating further");
            // Check if it's all zeros (uncommitted)
            let is_all_zeros = out1.iter().all(|&b| b == 0);
            println!("DEBUG: Is all zeros: {}", is_all_zeros);
            
            // Check metadata and commit marker state
            println!("DEBUG: Final commit marker: {}", get_commit_marker(db));
            
            panic!("Data mismatch: expected committed data to be visible after sync");
        }
        
        println!("DEBUG: Test passed - data is visible after commit");
    }

    #[tokio::test(flavor = "current_thread")]
    async fn invisible_blocks_skip_checksum_verification() {
        let db = "cm_checksum_skip";
        let mut s = BlockStorage::new(db).await.expect("create storage");

        let bid = s.allocate_block().await.expect("alloc block");
        let data = vec![0xAAu8; BLOCK_SIZE];
        s.write_block(bid, data.clone()).await.expect("write v1");
        s.sync().await.expect("sync v1"); // commit marker advances to 1, block version is 1

        // Make the block invisible by moving commit marker back to 0
        set_commit_marker(db, 0);

        // Corrupt the stored checksum; invisible reads must NOT verify checksum
        s.set_block_checksum_for_testing(bid, 1234567);
        s.clear_cache();
        let out = s.read_block(bid).await.expect("read while invisible should not error");
        assert_eq!(out, vec![0u8; BLOCK_SIZE], "invisible block reads as zeroed");

        // Now make it visible again; checksum verification should trigger and fail
        set_commit_marker(db, 1);
        s.clear_cache();
        let err = s
            .read_block(bid)
            .await
            .expect_err("expected checksum mismatch once visible");
        assert_eq!(err.code, "CHECKSUM_MISMATCH");
    }

    #[tokio::test(flavor = "current_thread")]
    async fn commit_marker_advances_and_versions_track_syncs() {
        let db = "cm_versions";
        let mut s = BlockStorage::new_with_capacity(db, 8)
            .await
            .expect("create storage");

        let b1 = s.allocate_block().await.expect("alloc b1");
        let b2 = s.allocate_block().await.expect("alloc b2");

        s.write_block(b1, vec![1u8; BLOCK_SIZE]).await.expect("write b1 v1");
        s.write_block(b2, vec![2u8; BLOCK_SIZE]).await.expect("write b2 v1");
        s.sync().await.expect("sync #1");

        let cm1 = get_commit_marker(db);
        assert_eq!(cm1, 1, "first sync should advance commit marker to 1");
        let meta1 = s.get_block_metadata_for_testing();
        assert_eq!(meta1.get(&b1).unwrap().1 as u64, cm1);
        assert_eq!(meta1.get(&b2).unwrap().1 as u64, cm1);

        // Update only b1 and sync again; only b1's version should bump
        s.write_block(b1, vec![3u8; BLOCK_SIZE]).await.expect("write b1 v2");
        s.sync().await.expect("sync #2");

        let cm2 = get_commit_marker(db);
        assert_eq!(cm2, 2, "second sync should advance commit marker to 2");
        let meta2 = s.get_block_metadata_for_testing();
        assert_eq!(meta2.get(&b1).unwrap().1 as u64, cm2, "updated block tracks new version");
        assert_eq!(meta2.get(&b2).unwrap().1 as u64, 1, "unchanged block retains prior version");
    }
}