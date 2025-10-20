use std::collections::{HashMap, HashSet, VecDeque};
use std::sync::Arc;
use parking_lot::Mutex;
use std::time::Duration;
#[cfg(not(target_arch = "wasm32"))]
use std::time::{Instant, SystemTime, UNIX_EPOCH};
#[cfg(target_arch = "wasm32")]
use js_sys::Date;
#[cfg(not(target_arch = "wasm32"))]
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use crate::types::DatabaseError;
use super::metadata::{ChecksumManager, ChecksumAlgorithm};
#[allow(unused_imports)]
use super::metadata::BlockMetadataPersist;
#[cfg(any(target_arch = "wasm32", all(not(target_arch = "wasm32"), any(test, debug_assertions), not(feature = "fs_persist"))))]
use super::vfs_sync;
#[cfg(not(target_arch = "wasm32"))]
use tokio::task::JoinHandle as TokioJoinHandle;
#[cfg(not(target_arch = "wasm32"))]
use tokio::sync::mpsc;

#[allow(unused_imports)]
use std::cell::RefCell;

// FS persistence imports (native only when feature is enabled)
#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
use std::path::PathBuf;

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

#[derive(Clone, Debug, PartialEq)]
pub enum CrashRecoveryAction {
    NoActionNeeded,
    Rollback,
    Finalize,
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
#[allow(dead_code)]
struct FsMeta { entries: Vec<(u64, BlockMetadataPersist)> }

#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
#[derive(serde::Serialize, serde::Deserialize, Default)]
#[allow(dead_code)]
struct FsAlloc { allocated: Vec<u64> }

#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
#[derive(serde::Serialize, serde::Deserialize, Default)]
#[allow(dead_code)]
struct FsDealloc { tombstones: Vec<u64> }

// Metadata mirror for native builds
#[cfg(not(target_arch = "wasm32"))]
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
    
    // Leader election manager (WASM only)
    #[cfg(target_arch = "wasm32")]
    pub(super) leader_election: Option<super::leader_election::LeaderElectionManager>,
    
    // Observability manager
    pub(super) observability: super::observability::ObservabilityManager,
    
    // Telemetry metrics (optional)
    #[cfg(feature = "telemetry")]
    pub(super) metrics: Option<crate::telemetry::Metrics>,
}

impl BlockStorage {
    /// Create a new BlockStorage synchronously without IndexedDB restoration
    /// Used for auto-registration in VFS when existing data is detected
    #[cfg(target_arch = "wasm32")]
    pub fn new_sync(db_name: &str) -> Self {
        log::info!("Creating BlockStorage synchronously for database: {}", db_name);
        
        // Load existing data from GLOBAL_STORAGE to support multi-connection scenarios
        use crate::storage::vfs_sync::with_global_storage;
        let (cache, allocated_blocks, max_block_id) = with_global_storage(|gs| {
            let storage_map = gs.borrow();
            if let Some(db_storage) = storage_map.get(db_name) {
                let cache = db_storage.clone();
                let allocated = db_storage.keys().copied().collect::<HashSet<_>>();
                let max_id = db_storage.keys().max().copied().unwrap_or(0);
                (cache, allocated, max_id)
            } else {
                (HashMap::new(), HashSet::new(), 0)
            }
        });
        
        log::info!("Loaded {} blocks from GLOBAL_STORAGE for {} (max_block_id={})", cache.len(), db_name, max_block_id);
        
        // CRITICAL: Always reload checksums from GLOBAL_METADATA since cache might be stale
        // This handles the case where import writes new data after close() reloaded cache
        use crate::storage::vfs_sync::with_global_metadata;
        let checksum_manager = with_global_metadata(|gm| {
            let metadata_map = gm.borrow();
            if let Some(db_metadata) = metadata_map.get(db_name) {
                let mut checksums = HashMap::new();
                let mut algos = HashMap::new();
                for (block_id, meta) in db_metadata {
                    checksums.insert(*block_id, meta.checksum);
                    algos.insert(*block_id, meta.algo);
                }
                ChecksumManager::with_data(checksums, algos, ChecksumAlgorithm::FastHash)
            } else {
                ChecksumManager::new(ChecksumAlgorithm::FastHash)
            }
        });
        
        Self {
            cache,
            dirty_blocks: Arc::new(Mutex::new(HashMap::new())),
            allocated_blocks,
            deallocated_blocks: HashSet::new(),
            next_block_id: max_block_id + 1,
            capacity: 128,
            lru_order: VecDeque::new(),
            checksum_manager,
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
            base_dir: std::path::PathBuf::from(std::env::var("ABSURDERSQL_FS_BASE").unwrap_or_else(|_| "./test_storage".to_string())),
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
            #[cfg(feature = "telemetry")]
            metrics: None,
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
                
                let base_path = std::env::var("ABSURDERSQL_FS_BASE").unwrap_or_else(|_| "./test_storage".to_string());
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
                let base_path = std::env::var("ABSURDERSQL_FS_BASE").unwrap_or_else(|_| "./test_storage".to_string());
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
                #[allow(unused_mut)]
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
                let base_path = std::env::var("ABSURDERSQL_FS_BASE").unwrap_or_else(|_| "./test_storage".to_string());
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
                #[allow(unused_mut)]
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
                let base_path = std::env::var("ABSURDERSQL_FS_BASE").unwrap_or_else(|_| "./test_storage".to_string());
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
            base_dir: std::path::PathBuf::from(std::env::var("ABSURDERSQL_FS_BASE").unwrap_or_else(|_| "./test_storage".to_string())),
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
            observability: super::observability::ObservabilityManager::new(),
            #[cfg(feature = "telemetry")]
            metrics: None,
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
            let dirty_guard = self.dirty_blocks.lock();
            let victim_pos = self
                .lru_order
                .iter()
                .position(|id| !dirty_guard.contains_key(id));

            match victim_pos {
                Some(pos) => {
                    let victim = self.lru_order.remove(pos).expect("valid pos");
                    self.cache.remove(&victim);
                }
                None => {
                    // All blocks are dirty; cannot evict. Allow temporary overflow.
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
            use std::io::Read;
            let mut out = HashMap::new();
            let base: PathBuf = self.base_dir.clone();
            let mut db_dir = base.clone();
            db_dir.push(&self.db_name);
            let mut meta_path = db_dir.clone();
            meta_path.push("metadata.json");
            if let Ok(mut f) = std::fs::File::open(&meta_path) {
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
        self.cache.clear();
        self.lru_order.clear();
    }
    
    /// Handle notification that the database has been imported
    /// 
    /// This method should be called after a database import to ensure
    /// that any cached data is invalidated and fresh data is read from storage.
    /// 
    /// # Returns
    /// * `Ok(())` - Cache cleared successfully
    /// * `Err(DatabaseError)` - If cache clearing fails
    /// 
    /// # Example
    /// ```rust,no_run
    /// # use absurder_sql::storage::block_storage::BlockStorage;
    /// # async fn example() -> Result<(), absurder_sql::types::DatabaseError> {
    /// let mut storage = BlockStorage::new("mydb").await?;
    /// // ... database is imported externally ...
    /// storage.on_database_import().await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn on_database_import(&mut self) -> Result<(), DatabaseError> {
        log::info!("Clearing cache for database '{}' after import", self.db_name);
        
        // Clear the LRU cache to force re-reading from storage
        self.clear_cache();
        
        // Also clear dirty blocks since they're now stale
        self.dirty_blocks.lock().clear();
        
        // Clear checksum manager's cache to reload from new metadata
        self.checksum_manager.clear_checksums();
        
        // Reload allocated blocks from global storage/allocation map
        #[cfg(target_arch = "wasm32")]
        {
            use super::vfs_sync::with_global_allocation_map;
            self.allocated_blocks = with_global_allocation_map(|gam| {
                gam.borrow()
                    .get(&self.db_name)
                    .cloned()
                    .unwrap_or_else(std::collections::HashSet::new)
            });
            log::debug!("Reloaded {} allocated blocks from global allocation map", self.allocated_blocks.len());
            
            // Checksums are now managed by ChecksumManager, which loads from metadata on demand
            log::debug!("Checksum data will be reloaded from metadata on next verification");
        }
        
        #[cfg(not(target_arch = "wasm32"))]
        {
            #[cfg(feature = "fs_persist")]
            {
                // Reload from filesystem allocations.json
                let mut alloc_path = self.base_dir.clone();
                alloc_path.push(&self.db_name);
                alloc_path.push("allocations.json");
                
                if let Ok(content) = std::fs::read_to_string(&alloc_path) {
                    if let Ok(alloc_data) = serde_json::from_str::<serde_json::Value>(&content) {
                        if let Some(allocated_array) = alloc_data["allocated"].as_array() {
                            self.allocated_blocks.clear();
                            for block_id_val in allocated_array {
                                if let Some(block_id) = block_id_val.as_u64() {
                                    self.allocated_blocks.insert(block_id);
                                }
                            }
                            log::debug!("Reloaded {} allocated blocks from filesystem", self.allocated_blocks.len());
                        }
                    }
                }
                
                // Reload checksums from filesystem metadata.json
                let mut meta_path = self.base_dir.clone();
                meta_path.push(&self.db_name);
                meta_path.push("metadata.json");
                
                if let Ok(content) = std::fs::read_to_string(&meta_path) {
                    if let Ok(meta_data) = serde_json::from_str::<serde_json::Value>(&content) {
                        if let Some(entries) = meta_data["entries"].as_array() {
                            let mut new_checksums = HashMap::new();
                            let mut new_algos = HashMap::new();
                            
                            for entry in entries {
                                if let (Some(block_id), Some(checksum), Some(algo_str)) = (
                                    entry[0].as_u64(),
                                    entry[1]["checksum"].as_u64(),
                                    entry[1]["algo"].as_str(),
                                ) {
                                    new_checksums.insert(block_id, checksum);
                                    
                                    let algo = match algo_str {
                                        "CRC32" => super::metadata::ChecksumAlgorithm::CRC32,
                                        _ => super::metadata::ChecksumAlgorithm::FastHash,
                                    };
                                    new_algos.insert(block_id, algo);
                                }
                            }
                            
                            self.checksum_manager.replace_all(new_checksums.clone(), new_algos);
                            log::debug!("Reloaded {} checksums from filesystem metadata", new_checksums.len());
                        }
                    }
                } else {
                    log::debug!("No metadata file found, checksums will be empty after import");
                }
            }
            
            #[cfg(not(feature = "fs_persist"))]
            {
                // Native test mode: reload from GLOBAL_ALLOCATION_MAP
                use super::vfs_sync::with_global_allocation_map;
                
                self.allocated_blocks = with_global_allocation_map(|gam| {
                    gam.borrow()
                        .get(&self.db_name)
                        .cloned()
                        .unwrap_or_else(std::collections::HashSet::new)
                });
                log::debug!("Reloaded {} allocated blocks from global allocation map (native test)", self.allocated_blocks.len());
                
                // Checksums are managed by ChecksumManager, loaded from metadata on demand
                log::debug!("Checksum data will be reloaded from metadata on next verification");
            }
        }
        
        log::info!("Cache and allocation state refreshed for '{}'", self.db_name);
        
        Ok(())
    }
    
    /// Reload cache from GLOBAL_STORAGE (WASM only, for multi-connection support)
    #[cfg(target_arch = "wasm32")]
    pub fn reload_cache_from_global_storage(&mut self) {
        use crate::storage::vfs_sync::{with_global_storage, with_global_metadata};
        let fresh_cache = with_global_storage(|gs| {
            let storage_map = gs.borrow();
            if let Some(db_storage) = storage_map.get(&self.db_name) {
                db_storage.clone()
            } else {
                std::collections::HashMap::new()
            }
        });
        
        // CRITICAL: Also reload checksums from GLOBAL_METADATA to match the fresh cache
        // Without this, cached reads will verify against stale checksums (e.g., after import)
        with_global_metadata(|gm| {
            let metadata_map = gm.borrow();
            if let Some(db_metadata) = metadata_map.get(&self.db_name) {
                // Clear existing checksums
                self.checksum_manager.clear_checksums();
                
                // Load checksums from metadata
                let mut new_checksums = std::collections::HashMap::new();
                let mut new_algos = std::collections::HashMap::new();
                for (block_id, meta) in db_metadata {
                    new_checksums.insert(*block_id, meta.checksum);
                    new_algos.insert(*block_id, meta.algo);
                }
                self.checksum_manager.replace_all(new_checksums, new_algos);
            } else {
                // No metadata exists, clear checksums
                self.checksum_manager.clear_checksums();
            }
        });
        
        // Replace cache contents while preserving LRU order for blocks that still exist
        let old_lru = std::mem::replace(&mut self.lru_order, std::collections::VecDeque::new());
        self.cache.clear();
        
        // Insert new cache data
        for (block_id, block_data) in fresh_cache {
            self.cache.insert(block_id, block_data);
        }
        
        // Restore LRU order for blocks that still exist, then add new blocks
        for block_id in old_lru {
            if self.cache.contains_key(&block_id) {
                self.lru_order.push_back(block_id);
            }
        }
        
        // Add any new blocks not in the old LRU order
        for &block_id in self.cache.keys() {
            if !self.lru_order.contains(&block_id) {
                self.lru_order.push_back(block_id);
            }
        }
    }

    pub fn get_cache_size(&self) -> usize {
        self.cache.len()
    }

    pub fn get_dirty_count(&self) -> usize {
        self.dirty_blocks.lock().len()
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

    /// Crash simulation: simulate crash during IndexedDB commit
    /// If `blocks_written` is true, blocks are written to IndexedDB but commit marker doesn't advance
    /// If `blocks_written` is false, crash occurs before blocks are written
    #[cfg(target_arch = "wasm32")]
    pub async fn crash_simulation_sync(&mut self, blocks_written: bool) -> Result<(), DatabaseError> {
        log::info!("CRASH SIMULATION: Starting crash simulation with blocks_written={}", blocks_written);
        
        if blocks_written {
            // Simulate crash after blocks are written but before commit marker advances
            // This is the most critical crash scenario to test
            
            // Step 1: Write blocks to IndexedDB (simulate partial transaction completion)
            let dirty_blocks = {
                let dirty = self.dirty_blocks.lock();
                dirty.clone()
            };
            
            if !dirty_blocks.is_empty() {
                log::info!("CRASH SIMULATION: Writing {} blocks to IndexedDB before crash", dirty_blocks.len());
                
                // Use the existing IndexedDB persistence logic but don't advance commit marker
                let metadata_to_persist: Vec<(u64, u64)> = dirty_blocks
                    .keys()
                    .map(|&block_id| {
                        let next_commit = self.get_commit_marker() + 1;
                        (block_id, next_commit)
                    })
                    .collect();
                
                log::debug!("CRASH SIMULATION: About to call persist_to_indexeddb for {} blocks", dirty_blocks.len());
                
                // Write blocks and metadata to IndexedDB
                super::wasm_indexeddb::persist_to_indexeddb(
                    &self.db_name,
                    dirty_blocks,
                    metadata_to_persist,
                ).await?;
                
                log::info!("CRASH SIMULATION: persist_to_indexeddb completed successfully");
                log::info!("CRASH SIMULATION: Blocks written to IndexedDB, simulating crash before commit marker advance");
                
                // Clear dirty blocks (they're now in IndexedDB)
                self.dirty_blocks.lock().clear();
                
                // DON'T advance commit marker - this simulates the crash
                // In a real crash, the commit marker update would fail
                
                return Ok(());
            } else {
                log::info!("CRASH SIMULATION: No dirty blocks to write");
                return Ok(());
            }
        } else {
            // Simulate crash before blocks are written
            log::info!("CRASH SIMULATION: Simulating crash before blocks are written to IndexedDB");
            
            // Just return success - blocks remain dirty, nothing written to IndexedDB
            return Ok(());
        }
    }

    /// Crash simulation: simulate partial block writes during IndexedDB commit
    /// Only specified blocks are written to IndexedDB before crash
    #[cfg(target_arch = "wasm32")]
    pub async fn crash_simulation_partial_sync(&mut self, blocks_to_write: &[u64]) -> Result<(), DatabaseError> {
        log::info!("CRASH SIMULATION: Starting partial crash simulation for {} blocks", blocks_to_write.len());
        
        let dirty_blocks = {
            let dirty = self.dirty_blocks.lock();
            dirty.clone()
        };
        
        // Filter to only the blocks we want to "successfully" write before crash
        let partial_blocks: std::collections::HashMap<u64, Vec<u8>> = dirty_blocks
            .into_iter()
            .filter(|(block_id, _)| blocks_to_write.contains(block_id))
            .collect();
        
        if !partial_blocks.is_empty() {
            log::info!("CRASH SIMULATION: Writing {} out of {} blocks before crash", 
                      partial_blocks.len(), blocks_to_write.len());
            
            let metadata_to_persist: Vec<(u64, u64)> = partial_blocks
                .keys()
                .map(|&block_id| {
                    let next_commit = self.get_commit_marker() + 1;
                    (block_id, next_commit)
                })
                .collect();
            
            // Write only the partial blocks to IndexedDB
            super::wasm_indexeddb::persist_to_indexeddb(
                &self.db_name,
                partial_blocks.clone(),
                metadata_to_persist,
            ).await?;
            
            // Remove only the written blocks from dirty_blocks
            {
                let mut dirty = self.dirty_blocks.lock();
                for block_id in partial_blocks.keys() {
                    dirty.remove(block_id);
                }
            }
            
            log::info!("CRASH SIMULATION: Partial blocks written, simulating crash before commit marker advance");
            
            // DON'T advance commit marker - simulates crash during transaction
        }
        
        Ok(())
    }

    /// Perform crash recovery: detect and handle incomplete IndexedDB transactions
    /// This method detects inconsistencies between IndexedDB state and commit markers
    /// and either finalizes or rolls back incomplete transactions
    #[cfg(target_arch = "wasm32")]
    pub async fn perform_crash_recovery(&mut self) -> Result<CrashRecoveryAction, DatabaseError> {
        log::info!("CRASH RECOVERY: Starting crash recovery scan for database: {}", self.db_name);
        
        // Step 1: Get current commit marker
        let current_marker = self.get_commit_marker();
        log::info!("CRASH RECOVERY: Current commit marker: {}", current_marker);
        
        // Step 2: Scan IndexedDB for blocks with versions > commit marker
        // These represent incomplete transactions that need recovery
        let inconsistent_blocks = self.scan_for_inconsistent_blocks(current_marker).await?;
        
        if inconsistent_blocks.is_empty() {
            log::info!("CRASH RECOVERY: No inconsistent blocks found, system is consistent");
            return Ok(CrashRecoveryAction::NoActionNeeded);
        }
        
        log::info!("CRASH RECOVERY: Found {} inconsistent blocks that need recovery", inconsistent_blocks.len());
        
        // Step 3: Determine recovery action based on transaction completeness
        let recovery_action = self.determine_recovery_action(&inconsistent_blocks).await?;
        
        match recovery_action {
            CrashRecoveryAction::Rollback => {
                log::info!("CRASH RECOVERY: Performing rollback of incomplete transaction");
                self.rollback_incomplete_transaction(&inconsistent_blocks).await?;
            }
            CrashRecoveryAction::Finalize => {
                log::info!("CRASH RECOVERY: Performing finalization of complete transaction");
                self.finalize_complete_transaction(&inconsistent_blocks).await?;
            }
            CrashRecoveryAction::NoActionNeeded => {
                // Already handled above
            }
        }
        
        log::info!("CRASH RECOVERY: Recovery completed successfully");
        Ok(recovery_action)
    }

    /// Scan IndexedDB for blocks with versions greater than the commit marker
    #[cfg(target_arch = "wasm32")]
    async fn scan_for_inconsistent_blocks(&self, commit_marker: u64) -> Result<Vec<(u64, u64)>, DatabaseError> {
        log::info!("CRASH RECOVERY: Scanning for blocks with version > {}", commit_marker);
        
        // This is a simplified implementation - in a real system we'd scan IndexedDB directly
        // For now, we'll check the global metadata storage
        let mut inconsistent_blocks = Vec::new();
        
        vfs_sync::with_global_metadata(|meta| {
            let meta_map = meta.borrow();
            if let Some(db_meta) = meta_map.get(&self.db_name) {
                for (block_id, metadata) in db_meta.iter() {
                    if metadata.version as u64 > commit_marker {
                        log::info!("CRASH RECOVERY: Found inconsistent block {} with version {} > marker {}", 
                                  block_id, metadata.version, commit_marker);
                        inconsistent_blocks.push((*block_id, metadata.version as u64));
                    }
                }
            }
        });
        
        Ok(inconsistent_blocks)
    }

    /// Determine whether to rollback or finalize based on transaction completeness
    #[cfg(target_arch = "wasm32")]
    async fn determine_recovery_action(&self, inconsistent_blocks: &[(u64, u64)]) -> Result<CrashRecoveryAction, DatabaseError> {
        // Simple heuristic: if all inconsistent blocks have the same version (next expected commit),
        // then the transaction was likely complete and should be finalized.
        // Otherwise, rollback to maintain consistency.
        
        let expected_next_commit = self.get_commit_marker() + 1;
        let all_same_version = inconsistent_blocks
            .iter()
            .all(|(_, version)| *version == expected_next_commit);
        
        if all_same_version && !inconsistent_blocks.is_empty() {
            log::info!("CRASH RECOVERY: All inconsistent blocks have expected version {}, finalizing transaction", expected_next_commit);
            Ok(CrashRecoveryAction::Finalize)
        } else {
            log::info!("CRASH RECOVERY: Inconsistent block versions detected, rolling back transaction");
            Ok(CrashRecoveryAction::Rollback)
        }
    }

    /// Rollback incomplete transaction by removing inconsistent blocks
    #[cfg(target_arch = "wasm32")]
    async fn rollback_incomplete_transaction(&mut self, inconsistent_blocks: &[(u64, u64)]) -> Result<(), DatabaseError> {
        log::info!("CRASH RECOVERY: Rolling back {} inconsistent blocks", inconsistent_blocks.len());
        
        // Remove inconsistent blocks from global metadata
        vfs_sync::with_global_metadata(|meta| {
            let mut meta_map = meta.borrow_mut();
            if let Some(db_meta) = meta_map.get_mut(&self.db_name) {
                for (block_id, _) in inconsistent_blocks {
                    log::info!("CRASH RECOVERY: Removing inconsistent block {} from metadata", block_id);
                    db_meta.remove(block_id);
                }
            }
        });
        
        // Remove inconsistent blocks from global storage
        vfs_sync::with_global_storage(|gs| {
            let mut storage_map = gs.borrow_mut();
            if let Some(db_storage) = storage_map.get_mut(&self.db_name) {
                for (block_id, _) in inconsistent_blocks {
                    log::info!("CRASH RECOVERY: Removing inconsistent block {} from global storage", block_id);
                    db_storage.remove(block_id);
                }
            }
        });
        
        // Clear any cached data for these blocks
        for (block_id, _) in inconsistent_blocks {
            self.cache.remove(block_id);
            // Remove from LRU order
            self.lru_order.retain(|&id| id != *block_id);
        }
        
        // Remove inconsistent blocks from IndexedDB to avoid accumulating orphaned data
        let block_ids_to_delete: Vec<u64> = inconsistent_blocks.iter().map(|(id, _)| *id).collect();
        if !block_ids_to_delete.is_empty() {
            log::info!("CRASH RECOVERY: Deleting {} blocks from IndexedDB", block_ids_to_delete.len());
            super::wasm_indexeddb::delete_blocks_from_indexeddb(&self.db_name, &block_ids_to_delete).await?;
            log::info!("CRASH RECOVERY: Successfully deleted blocks from IndexedDB");
        }
        
        log::info!("CRASH RECOVERY: Rollback completed");
        Ok(())
    }

    /// Finalize complete transaction by advancing commit marker
    #[cfg(target_arch = "wasm32")]
    async fn finalize_complete_transaction(&mut self, inconsistent_blocks: &[(u64, u64)]) -> Result<(), DatabaseError> {
        log::info!("CRASH RECOVERY: Finalizing transaction for {} blocks", inconsistent_blocks.len());
        
        // Find the target commit marker (should be consistent across all blocks)
        if let Some((_, target_version)) = inconsistent_blocks.first() {
            let new_commit_marker = *target_version;
            
            // Advance the commit marker to make the blocks visible
            vfs_sync::with_global_commit_marker(|cm| {
                cm.borrow_mut().insert(self.db_name.clone(), new_commit_marker);
            });
            
            log::info!("CRASH RECOVERY: Advanced commit marker from {} to {}", 
                      self.get_commit_marker(), new_commit_marker);
            
            // Update checksums for the finalized blocks
            for (block_id, _) in inconsistent_blocks {
                // Read the block data to compute and store checksum
                if let Ok(data) = self.read_block_sync(*block_id) {
                    self.checksum_manager.store_checksum(*block_id, &data);
                    log::info!("CRASH RECOVERY: Updated checksum for finalized block {}", block_id);
                }
            }
        }
        
        log::info!("CRASH RECOVERY: Finalization completed");
        Ok(())
    }

    // Leader Election Methods (WASM only)
    
    /// Start leader election process
    #[cfg(target_arch = "wasm32")]
    pub async fn start_leader_election(&mut self) -> Result<(), DatabaseError> {
        if self.leader_election.is_none() {
            let mut manager = super::leader_election::LeaderElectionManager::new(self.db_name.clone());
            manager.start_election().await?;
            self.leader_election = Some(manager);
        } else {
            // If election is already running, force leadership takeover (requestLeadership)
            if let Some(ref mut manager) = self.leader_election {
                manager.force_become_leader().await?;
            }
        }
        Ok(())
    }
    
    /// Check if this instance is the leader (with re-election on lease expiry)
    #[cfg(target_arch = "wasm32")]
    pub async fn is_leader(&mut self) -> bool {
        // Start leader election if not already started
        if self.leader_election.is_none() {
            log::debug!("Starting leader election for {}", self.db_name);
            if let Err(e) = self.start_leader_election().await {
                log::error!("Failed to start leader election: {:?}", e);
                return false;
            }
        }
        
        if let Some(ref mut manager) = self.leader_election {
            let is_leader = manager.is_leader().await;
            
            // If no current leader (lease expired), trigger re-election
            if !is_leader {
                let state = manager.state.borrow();
                if state.leader_id.is_none() {
                    log::debug!("No current leader for {} - triggering re-election", self.db_name);
                    drop(state);
                    let _ = manager.try_become_leader().await;
                    
                    // Start heartbeat if we became leader
                    let new_is_leader = manager.state.borrow().is_leader;
                    if new_is_leader && manager.heartbeat_interval.is_none() {
                        let _ = manager.start_heartbeat();
                    }
                    
                    log::debug!("is_leader() for {} = {} (after re-election)", self.db_name, new_is_leader);
                    return new_is_leader;
                }
            }
            
            log::debug!("is_leader() for {} = {}", self.db_name, is_leader);
            is_leader
        } else {
            log::debug!("No leader election manager for {}", self.db_name);
            false
        }
    }
    
    /// Stop leader election (e.g., when tab is closing)
    #[cfg(target_arch = "wasm32")]
    pub async fn stop_leader_election(&mut self) -> Result<(), DatabaseError> {
        if let Some(mut manager) = self.leader_election.take() {
            manager.stop_election().await?;
        }
        Ok(())
    }
    
    /// Send a leader heartbeat (for testing)
    #[cfg(target_arch = "wasm32")]
    pub async fn send_leader_heartbeat(&self) -> Result<(), DatabaseError> {
        if let Some(ref manager) = self.leader_election {
            manager.send_heartbeat().await
        } else {
            Err(DatabaseError::new("LEADER_ELECTION_ERROR", "Leader election not started"))
        }
    }
    
    /// Get timestamp of last received leader heartbeat
    #[cfg(target_arch = "wasm32")]
    pub async fn get_last_leader_heartbeat(&self) -> Result<u64, DatabaseError> {
        if let Some(ref manager) = self.leader_election {
            Ok(manager.get_last_heartbeat().await)
        } else {
            Err(DatabaseError::new("LEADER_ELECTION_ERROR", "Leader election not started"))
        }
    }

    // Observability Methods

    /// Get comprehensive metrics for observability
    pub fn get_metrics(&self) -> super::observability::StorageMetrics {
        let dirty_count = self.get_dirty_count();
        let dirty_bytes = dirty_count * BLOCK_SIZE;
        
        #[cfg(not(target_arch = "wasm32"))]
        let (sync_count, timer_sync_count, debounce_sync_count, last_sync_duration_ms) = {
            (
                self.sync_count.load(Ordering::SeqCst),
                self.timer_sync_count.load(Ordering::SeqCst),
                self.debounce_sync_count.load(Ordering::SeqCst),
                self.last_sync_duration_ms.load(Ordering::SeqCst),
            )
        };
        
        #[cfg(target_arch = "wasm32")]
        let (sync_count, timer_sync_count, debounce_sync_count, last_sync_duration_ms) = {
            // For WASM, use observability manager for sync_count tracking
            (self.observability.get_sync_count(), 0, 0, 1)
        };
        
        let error_count = self.observability.get_error_count();
        let checksum_failures = self.observability.get_checksum_failures();
        
        // Calculate throughput and error rate
        let total_operations = sync_count + error_count;
        let (throughput_blocks_per_sec, throughput_bytes_per_sec) = 
            self.observability.calculate_throughput(last_sync_duration_ms);
        let error_rate = self.observability.calculate_error_rate(total_operations);
        
        super::observability::StorageMetrics {
            dirty_count,
            dirty_bytes,
            sync_count,
            timer_sync_count,
            debounce_sync_count,
            error_count,
            checksum_failures,
            last_sync_duration_ms,
            throughput_blocks_per_sec,
            throughput_bytes_per_sec,
            error_rate,
        }
    }

    /// Set sync event callbacks
    #[cfg(not(target_arch = "wasm32"))]
    pub fn set_sync_callbacks(
        &mut self,
        on_sync_start: super::observability::SyncStartCallback,
        on_sync_success: super::observability::SyncSuccessCallback,
        on_sync_failure: super::observability::SyncFailureCallback,
    ) {
        self.observability.sync_start_callback = Some(on_sync_start);
        self.observability.sync_success_callback = Some(on_sync_success);
        self.observability.sync_failure_callback = Some(on_sync_failure);
    }

    /// Set backpressure callback
    #[cfg(not(target_arch = "wasm32"))]
    pub fn set_backpressure_callback(&mut self, callback: super::observability::BackpressureCallback) {
        self.observability.backpressure_callback = Some(callback);
    }

    /// Set error callback
    #[cfg(not(target_arch = "wasm32"))]
    pub fn set_error_callback(&mut self, callback: super::observability::ErrorCallback) {
        self.observability.error_callback = Some(callback);
    }

    /// Set WASM sync success callback
    #[cfg(target_arch = "wasm32")]
    pub fn set_sync_success_callback(&mut self, callback: super::observability::WasmSyncSuccessCallback) {
        self.observability.wasm_sync_success_callback = Some(callback);
    }
    
    /// Check if auto-sync is currently enabled
    pub fn is_auto_sync_enabled(&self) -> bool {
        self.auto_sync_interval.is_some()
    }
    
    /// Get the current sync policy (if any)
    pub fn get_sync_policy(&self) -> Option<super::SyncPolicy> {
        self.policy.clone()
    }
    
    /// Force synchronization with durability guarantees
    /// 
    /// This method ensures that all dirty blocks are persisted to durable storage
    /// (IndexedDB in WASM, filesystem in native) and waits for the operation to complete.
    /// This is called by VFS xSync to provide SQLite's durability guarantees.
    pub async fn force_sync(&mut self) -> Result<(), DatabaseError> {
        log::info!("force_sync: Starting forced synchronization with durability guarantees");
        
        let dirty_count = self.get_dirty_count();
        if dirty_count == 0 {
            log::debug!("force_sync: No dirty blocks to sync");
            return Ok(());
        }
        
        log::info!("force_sync: Syncing {} dirty blocks with durability guarantee", dirty_count);
        
        // Just use the regular sync - it already waits for persistence in WASM
        self.sync().await?;
        
        log::info!("force_sync: Successfully completed forced synchronization");
        Ok(())
    }
    
    /// Set telemetry metrics (used for instrumentation)
    #[cfg(feature = "telemetry")]
    pub fn set_metrics(&mut self, metrics: Option<crate::telemetry::Metrics>) {
        self.metrics = metrics;
    }
    
    /// Get telemetry metrics
    #[cfg(feature = "telemetry")]
    pub fn metrics(&self) -> Option<&crate::telemetry::Metrics> {
        self.metrics.as_ref()
    }
    
    /// Create a test instance with minimal setup
    #[cfg(feature = "telemetry")]
    pub fn new_for_test() -> Self {
        Self {
            cache: HashMap::new(),
            dirty_blocks: Arc::new(parking_lot::Mutex::new(HashMap::new())),
            allocated_blocks: HashSet::new(),
            deallocated_blocks: HashSet::new(),
            next_block_id: 1,
            capacity: 128,
            lru_order: VecDeque::new(),
            checksum_manager: crate::storage::metadata::ChecksumManager::new(
                crate::storage::metadata::ChecksumAlgorithm::FastHash
            ),
            #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
            base_dir: std::path::PathBuf::from("/tmp/test"),
            db_name: "test.db".to_string(),
            auto_sync_interval: None,
            #[cfg(not(target_arch = "wasm32"))]
            last_auto_sync: std::time::Instant::now(),
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
            last_write_ms: Arc::new(std::sync::atomic::AtomicU64::new(0)),
            #[cfg(not(target_arch = "wasm32"))]
            threshold_hit: Arc::new(std::sync::atomic::AtomicBool::new(false)),
            #[cfg(not(target_arch = "wasm32"))]
            sync_count: Arc::new(std::sync::atomic::AtomicU64::new(0)),
            #[cfg(not(target_arch = "wasm32"))]
            timer_sync_count: Arc::new(std::sync::atomic::AtomicU64::new(0)),
            #[cfg(not(target_arch = "wasm32"))]
            debounce_sync_count: Arc::new(std::sync::atomic::AtomicU64::new(0)),
            #[cfg(not(target_arch = "wasm32"))]
            last_sync_duration_ms: Arc::new(std::sync::atomic::AtomicU64::new(0)),
            #[cfg(not(target_arch = "wasm32"))]
            sync_sender: None,
            #[cfg(not(target_arch = "wasm32"))]
            sync_receiver: None,
            recovery_report: RecoveryReport::default(),
            #[cfg(target_arch = "wasm32")]
            leader_election: None,
            observability: super::observability::ObservabilityManager::new(),
            metrics: None,
        }
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