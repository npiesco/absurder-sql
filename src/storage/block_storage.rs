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
use super::metadata::{ChecksumManager, ChecksumAlgorithm};
#[cfg(any(all(not(target_arch = "wasm32"), feature = "fs_persist"), all(not(target_arch = "wasm32"), any(test, debug_assertions))))]
use super::metadata::BlockMetadataPersist;
#[cfg(any(target_arch = "wasm32", all(not(target_arch = "wasm32"), any(test, debug_assertions), not(feature = "fs_persist"))))]
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
use std::{fs, io::Read, path::PathBuf};

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
    pub(super) static GLOBAL_METADATA_TEST: RefCell<HashMap<String, HashMap<u64, BlockMetadataPersist>>> = RefCell::new(HashMap::new());
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
pub(super) const DEFAULT_CACHE_CAPACITY: usize = 128;
#[allow(dead_code)]
const STORE_NAME: &str = "sqlite_blocks";
#[allow(dead_code)]
const METADATA_STORE: &str = "metadata";

pub struct BlockStorage {
    pub(super) cache: HashMap<u64, Vec<u8>>,
    pub(super) dirty_blocks: Arc<Mutex<HashMap<u64, Vec<u8>>>>,
    pub(super) allocated_blocks: HashSet<u64>,
    #[allow(dead_code)]
    pub(super) deallocated_blocks: HashSet<u64>,
    pub(super) next_block_id: u64,
    pub(super) capacity: usize,
    pub(super) lru_order: VecDeque<u64>,
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
    pub(super) recovery_report: RecoveryReport,
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
        super::constructors::new_wasm(db_name).await
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
        
        storage.perform_startup_recovery(recovery_opts).await?;
        
        Ok(storage)
    }

    pub fn get_recovery_report(&self) -> &RecoveryReport {
        &self.recovery_report
    }

    async fn perform_startup_recovery(&mut self, opts: RecoveryOptions) -> Result<(), DatabaseError> {
        super::recovery::perform_startup_recovery(self, opts).await
    }

    pub(super) async fn get_blocks_for_verification(&self, mode: &RecoveryMode) -> Result<Vec<u64>, DatabaseError> {
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

    pub(super) async fn verify_block_integrity(&mut self, block_id: u64) -> Result<bool, DatabaseError> {
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

    pub(super) async fn repair_corrupted_block(&mut self, block_id: u64) -> Result<bool, DatabaseError> {
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

    pub(super) fn touch_lru(&mut self, block_id: u64) {
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
    pub fn now_millis() -> u64 {
        // Date::now() returns milliseconds since UNIX epoch as f64
        Date::now() as u64
    }

    #[inline]
    #[cfg(not(target_arch = "wasm32"))]
    pub fn now_millis() -> u64 {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_else(|_| Duration::from_millis(0));
        now.as_millis() as u64
    }

    // compute_checksum_with moved to ChecksumManager


    pub(super) fn verify_against_stored_checksum(
        &self,
        block_id: u64,
        data: &[u8],
    ) -> Result<(), DatabaseError> {
        self.checksum_manager.validate_checksum(block_id, data)
    }

    /// Synchronous block read for environments that require sync access (e.g., VFS callbacks)
    pub fn read_block_sync(&mut self, block_id: u64) -> Result<Vec<u8>, DatabaseError> {
        // Implementation moved to io_operations module
        super::io_operations::read_block_sync_impl(self, block_id)
    }

    pub async fn read_block(&mut self, block_id: u64) -> Result<Vec<u8>, DatabaseError> {
        // Delegate to synchronous implementation (immediately ready)
        self.read_block_sync(block_id)
    }

    /// Synchronous block write for environments that require sync access (e.g., VFS callbacks)
    pub fn write_block_sync(&mut self, block_id: u64, data: Vec<u8>) -> Result<(), DatabaseError> {
        // Implementation moved to io_operations module
        super::io_operations::write_block_sync_impl(self, block_id, data)
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

    /// Synchronous version of sync() for immediate persistence
    pub fn sync_now(&mut self) -> Result<(), DatabaseError> {
        self.sync_implementation()
    }

    /// Internal sync implementation shared by sync() and sync_now()
    fn sync_implementation(&mut self) -> Result<(), DatabaseError> {
        super::sync_operations::sync_implementation_impl(self)
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
        super::wasm_indexeddb::sync_async(self).await
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
        super::allocation::allocate_block_impl(self).await
    }

    /// Deallocate a block and mark it as available for reuse
    pub async fn deallocate_block(&mut self, block_id: u64) -> Result<(), DatabaseError> {
        super::allocation::deallocate_block_impl(self, block_id).await
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