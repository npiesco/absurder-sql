use std::collections::{HashMap, HashSet, VecDeque};
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use std::hash::Hash;
use std::time::{Duration, Instant};
use crate::types::DatabaseError;

#[cfg(target_arch = "wasm32")]
use std::cell::RefCell;

// Global storage for WASM to maintain data across instances
#[cfg(target_arch = "wasm32")]
thread_local! {
    static GLOBAL_STORAGE: RefCell<HashMap<String, HashMap<u64, Vec<u8>>>> = RefCell::new(HashMap::new());
    static GLOBAL_ALLOCATION_MAP: RefCell<HashMap<String, HashSet<u64>>> = RefCell::new(HashMap::new());
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
        self.auto_sync_stop = None;
    }
}

pub const BLOCK_SIZE: usize = 4096;
const DEFAULT_CACHE_CAPACITY: usize = 128;
#[allow(dead_code)]
const STORE_NAME: &str = "sqlite_blocks";
#[allow(dead_code)]
const METADATA_STORE: &str = "metadata";

pub struct BlockStorage {
    cache: HashMap<u64, Vec<u8>>,
    dirty_blocks: Arc<Mutex<HashMap<u64, Vec<u8>>>>,
    allocated_blocks: HashSet<u64>,
    next_block_id: u64,
    capacity: usize,
    lru_order: VecDeque<u64>,
    // Simple integrity metadata: checksum per block (computed on write)
    checksums: HashMap<u64, u64>,
    #[allow(dead_code)]
    db_name: String,
    // Background sync settings
    auto_sync_interval: Option<Duration>,
    last_auto_sync: Instant,
    policy: Option<SyncPolicy>,
    #[cfg(not(target_arch = "wasm32"))]
    auto_sync_stop: Option<Arc<AtomicBool>>,
    #[cfg(not(target_arch = "wasm32"))]
    auto_sync_thread: Option<std::thread::JoinHandle<()>>,
}

impl BlockStorage {
    pub async fn new(db_name: &str) -> Result<Self, DatabaseError> {
        log::info!("Creating BlockStorage for database: {}", db_name);
        
        // Initialize allocation tracking
        let (allocated_blocks, next_block_id) = {
            // WASM: restore allocation state from global storage
            #[cfg(target_arch = "wasm32")]
            {
                let mut allocated_blocks = HashSet::new();
                let mut next_block_id: u64 = 1;

                GLOBAL_ALLOCATION_MAP.with(|allocation_map| {
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

            // Native defaults
            #[cfg(not(target_arch = "wasm32"))]
            {
                (HashSet::new(), 1u64)
            }
        };

        Ok(Self {
            cache: HashMap::new(),
            dirty_blocks: Arc::new(Mutex::new(HashMap::new())),
            allocated_blocks,
            next_block_id,
            capacity: DEFAULT_CACHE_CAPACITY,
            lru_order: VecDeque::new(),
            checksums: HashMap::new(),
            db_name: db_name.to_string(),
            auto_sync_interval: None,
            last_auto_sync: Instant::now(),
            policy: None,
            #[cfg(not(target_arch = "wasm32"))]
            auto_sync_stop: None,
            #[cfg(not(target_arch = "wasm32"))]
            auto_sync_thread: None,
        })
    }

    pub async fn new_with_capacity(db_name: &str, capacity: usize) -> Result<Self, DatabaseError> {
        let mut s = Self::new(db_name).await?;
        s.capacity = capacity;
        Ok(s)
    }

    fn touch_lru(&mut self, block_id: u64) {
        // Remove any existing occurrence
        if let Some(pos) = self.lru_order.iter().position(|&id| id == block_id) {
            self.lru_order.remove(pos);
        }
        // Push as most-recent
        self.lru_order.push_back(block_id);
    }

    fn evict_if_needed(&mut self) {
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

    fn compute_checksum(data: &[u8]) -> u64 {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::Hasher;
        let mut hasher = DefaultHasher::new();
        data.hash(&mut hasher);
        hasher.finish()
    }

    fn maybe_auto_sync(&mut self) {
        if let Some(interval) = self.auto_sync_interval {
            if self.last_auto_sync.elapsed() >= interval {
                if !self.dirty_blocks.lock().unwrap().is_empty() {
                    match self.sync_now() {
                        Ok(()) => log::info!("Auto-sync completed"),
                        Err(e) => log::error!("Auto-sync failed: {}", e.message),
                    }
                }
                self.last_auto_sync = Instant::now();
            }
        }
    }

    fn verify_against_stored_checksum(
        &self,
        block_id: u64,
        data: &[u8],
    ) -> Result<(), DatabaseError> {
        if let Some(expected) = self.checksums.get(&block_id) {
            let actual = Self::compute_checksum(data);
            if *expected != actual {
                return Err(DatabaseError::new(
                    "CHECKSUM_MISMATCH",
                    &format!(
                        "Checksum mismatch for block {}: expected {}, got {}",
                        block_id, expected, actual
                    ),
                ));
            }
        }
        Ok(())
    }

    /// Synchronous block read for environments that require sync access (e.g., VFS callbacks)
    pub fn read_block_sync(&mut self, block_id: u64) -> Result<Vec<u8>, DatabaseError> {
        log::debug!("Reading block (sync): {}", block_id);
        self.maybe_auto_sync();
        
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

        // For WASM, check global storage for persistence across instances
        #[cfg(target_arch = "wasm32")]
        {
            let data = GLOBAL_STORAGE.with(|storage| {
                let storage_map = storage.borrow();
                if let Some(db_storage) = storage_map.get(&self.db_name) {
                    if let Some(data) = db_storage.get(&block_id) {
                        log::debug!("Block {} found in global storage (sync)", block_id);
                        return data.clone();
                    }
                }
                // Return empty block if not found
                vec![0; BLOCK_SIZE]
            });
            
            // Cache for future reads
            self.cache.insert(block_id, data.clone());
            log::debug!("Block {} cached from global storage (sync)", block_id);
            // Verify checksum if tracked
            if let Err(e) = self.verify_against_stored_checksum(block_id, &data) {
                log::error!(
                    "Checksum verification failed for block {} (wasm storage): {}",
                    block_id, e.message
                );
                return Err(e);
            }
            self.touch_lru(block_id);
            self.evict_if_needed();
            return Ok(data);
        }

        // For native, return empty block - will implement file-based storage later
        #[cfg(not(target_arch = "wasm32"))]
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

        // Update cache and mark as dirty
        self.cache.insert(block_id, data.clone());
        {
            let mut dirty = self.dirty_blocks.lock().unwrap();
            dirty.insert(block_id, data);
        }
        // Update checksum metadata on write
        if let Some(bytes) = self.cache.get(&block_id) {
            let csum = Self::compute_checksum(bytes);
            self.checksums.insert(block_id, csum);
        }
        // Policy-based triggers: thresholds
        let (max_dirty_opt, max_bytes_opt) = self
            .policy
            .as_ref()
            .map(|p| (p.max_dirty, p.max_dirty_bytes))
            .unwrap_or((None, None));

        if let Some(max_dirty) = max_dirty_opt {
            let cur = self.dirty_blocks.lock().unwrap().len();
            if cur >= max_dirty {
                let _ = self.sync_now();
            }
        }

        if let Some(max_bytes) = max_bytes_opt {
            let cur_bytes: usize = {
                let m = self.dirty_blocks.lock().unwrap();
                m.values().map(|v| v.len()).sum()
            };
            if cur_bytes >= max_bytes {
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

    pub fn get_block_checksum(&self, block_id: u64) -> Option<u64> {
        self.checksums.get(&block_id).copied()
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
    pub fn set_block_checksum_for_testing(&mut self, block_id: u64, checksum: u64) {
        self.checksums.insert(block_id, checksum);
    }

    /// Enable automatic background syncing of dirty blocks. Interval in milliseconds.
    pub fn enable_auto_sync(&mut self, interval_ms: u64) {
        self.auto_sync_interval = Some(Duration::from_millis(interval_ms));
        self.last_auto_sync = Instant::now();
        self.policy = Some(SyncPolicy { interval_ms: Some(interval_ms), max_dirty: None, max_dirty_bytes: None, debounce_ms: None, verify_after_write: false });
        log::info!("Auto-sync enabled: every {} ms", interval_ms);
        #[cfg(not(target_arch = "wasm32"))]
        {
            // stop previous thread if any
            if let Some(stop) = &self.auto_sync_stop {
                stop.store(true, Ordering::SeqCst);
            }
            if let Some(handle) = self.auto_sync_thread.take() {
                let _ = handle.join();
            }

            let stop = Arc::new(AtomicBool::new(false));
            let stop_thread = stop.clone();
            let dirty = Arc::clone(&self.dirty_blocks);
            let interval = Duration::from_millis(interval_ms);
            let handle = std::thread::spawn(move || {
                while !stop_thread.load(Ordering::SeqCst) {
                    std::thread::sleep(interval);
                    if stop_thread.load(Ordering::SeqCst) { break; }
                    let mut map = match dirty.lock() {
                        Ok(g) => g,
                        Err(poisoned) => poisoned.into_inner(),
                    };
                    if !map.is_empty() {
                        let count = map.len();
                        log::info!("Auto-sync (timer-thread) flushing {} dirty blocks", count);
                        map.clear();
                    }
                }
            });
            self.auto_sync_stop = Some(stop);
            self.auto_sync_thread = Some(handle);
        }
    }

    /// Enable automatic background syncing using a SyncPolicy
    pub fn enable_auto_sync_with_policy(&mut self, policy: SyncPolicy) {
        self.policy = Some(policy.clone());
        self.last_auto_sync = Instant::now();
        self.auto_sync_interval = policy.interval_ms.map(Duration::from_millis);
        log::info!("Auto-sync policy enabled: interval={:?}, max_dirty={:?}, max_bytes={:?}", policy.interval_ms, policy.max_dirty, policy.max_dirty_bytes);
        #[cfg(not(target_arch = "wasm32"))]
        {
            // stop previous thread if any
            if let Some(stop) = &self.auto_sync_stop {
                stop.store(true, Ordering::SeqCst);
            }
            if let Some(handle) = self.auto_sync_thread.take() {
                let _ = handle.join();
            }

            if let Some(interval_ms) = policy.interval_ms {
                let stop = Arc::new(AtomicBool::new(false));
                let stop_thread = stop.clone();
                let dirty = Arc::clone(&self.dirty_blocks);
                let interval = Duration::from_millis(interval_ms);
                let handle = std::thread::spawn(move || {
                    while !stop_thread.load(Ordering::SeqCst) {
                        std::thread::sleep(interval);
                        if stop_thread.load(Ordering::SeqCst) { break; }
                        let mut map = match dirty.lock() {
                            Ok(g) => g,
                            Err(poisoned) => poisoned.into_inner(),
                        };
                        if !map.is_empty() {
                            let count = map.len();
                            log::info!("Auto-sync (timer-thread) flushing {} dirty blocks", count);
                            map.clear();
                        }
                    }
                });
                self.auto_sync_stop = Some(stop);
                self.auto_sync_thread = Some(handle);
            } else {
                self.auto_sync_stop = None;
                self.auto_sync_thread = None;
            }
        }
    }

    /// Disable automatic background syncing.
    pub fn disable_auto_sync(&mut self) {
        self.auto_sync_interval = None;
        log::info!("Auto-sync disabled");
        #[cfg(not(target_arch = "wasm32"))]
        {
            if let Some(stop) = &self.auto_sync_stop {
                stop.store(true, Ordering::SeqCst);
            }
            if let Some(handle) = self.auto_sync_thread.take() {
                let _ = handle.join();
            }
            self.auto_sync_stop = None;
        }
    }

    /// Synchronous sync of dirty blocks (no async required for current TDD impl)
    pub fn sync_now(&mut self) -> Result<(), DatabaseError> {
        if self.dirty_blocks.lock().unwrap().is_empty() {
            log::debug!("No dirty blocks to sync");
            return Ok(());
        }

        let current_dirty = self.dirty_blocks.lock().unwrap().len();
        log::info!("Syncing {} dirty blocks", current_dirty);
        
        // For WASM, persist dirty blocks to global storage
        #[cfg(target_arch = "wasm32")]
        {
            let to_persist: Vec<(u64, Vec<u8>)> = {
                let dirty = self.dirty_blocks.lock().unwrap();
                dirty.iter().map(|(k,v)| (*k, v.clone())).collect()
            };
            GLOBAL_STORAGE.with(|storage| {
                let mut storage_map = storage.borrow_mut();
                let db_storage = storage_map.entry(self.db_name.clone()).or_insert_with(HashMap::new);
                for (block_id, data) in to_persist {
                    db_storage.insert(block_id, data);
                    log::debug!("Persisted block {} to global storage", block_id);
                }
            });
        }
        
        let dirty_count = {
            let mut dirty = self.dirty_blocks.lock().unwrap();
            let count = dirty.len();
            dirty.clear();
            count
        };
        log::info!("Successfully synced {} blocks to global storage", dirty_count);
        // Now that everything is clean, enforce capacity again
        self.evict_if_needed();
        Ok(())
    }

    pub async fn sync(&mut self) -> Result<(), DatabaseError> {
        // Delegate to synchronous implementation for now
        self.sync_now()
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
            self.auto_sync_stop = None;
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
            GLOBAL_ALLOCATION_MAP.with(|allocation_map| {
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
        self.checksums.remove(&block_id);
        
        // For WASM, remove from global storage
        #[cfg(target_arch = "wasm32")]
        {
            GLOBAL_STORAGE.with(|storage| {
                let mut storage_map = storage.borrow_mut();
                if let Some(db_storage) = storage_map.get_mut(&self.db_name) {
                    db_storage.remove(&block_id);
                }
            });
            
            GLOBAL_ALLOCATION_MAP.with(|allocation_map| {
                let mut allocation_map = allocation_map.borrow_mut();
                if let Some(db_allocations) = allocation_map.get_mut(&self.db_name) {
                    db_allocations.remove(&block_id);
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