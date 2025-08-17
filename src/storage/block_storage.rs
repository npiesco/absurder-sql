use std::collections::{HashMap, HashSet};
use crate::types::DatabaseError;

#[cfg(target_arch = "wasm32")]
use std::cell::RefCell;

// Global storage for WASM to maintain data across instances
#[cfg(target_arch = "wasm32")]
thread_local! {
    static GLOBAL_STORAGE: RefCell<HashMap<String, HashMap<u64, Vec<u8>>>> = RefCell::new(HashMap::new());
    static GLOBAL_ALLOCATION_MAP: RefCell<HashMap<String, HashSet<u64>>> = RefCell::new(HashMap::new());
}

pub const BLOCK_SIZE: usize = 4096;
#[allow(dead_code)]
const STORE_NAME: &str = "sqlite_blocks";
#[allow(dead_code)]
const METADATA_STORE: &str = "metadata";

pub struct BlockStorage {
    cache: HashMap<u64, Vec<u8>>,
    dirty_blocks: HashMap<u64, Vec<u8>>,
    allocated_blocks: HashSet<u64>,
    next_block_id: u64,
    #[allow(dead_code)]
    db_name: String,
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
            dirty_blocks: HashMap::new(),
            allocated_blocks,
            next_block_id,
            db_name: db_name.to_string(),
        })
    }

    /// Synchronous block read for environments that require sync access (e.g., VFS callbacks)
    pub fn read_block_sync(&mut self, block_id: u64) -> Result<Vec<u8>, DatabaseError> {
        log::debug!("Reading block (sync): {}", block_id);
        
        // Check cache first
        if let Some(data) = self.cache.get(&block_id) {
            log::debug!("Block {} found in cache (sync)", block_id);
            return Ok(data.clone());
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
        
        if data.len() != BLOCK_SIZE {
            return Err(DatabaseError::new(
                "INVALID_BLOCK_SIZE", 
                &format!("Block size must be {} bytes, got {}", BLOCK_SIZE, data.len())
            ));
        }

        // Update cache and mark as dirty
        self.cache.insert(block_id, data.clone());
        self.dirty_blocks.insert(block_id, data);
        
        log::debug!("Block {} marked as dirty (sync)", block_id);
        Ok(())
    }

    pub async fn write_block(&mut self, block_id: u64, data: Vec<u8>) -> Result<(), DatabaseError> {
        // Delegate to synchronous implementation (immediately ready)
        self.write_block_sync(block_id, data)
    }

    /// Synchronous sync of dirty blocks (no async required for current TDD impl)
    pub fn sync_now(&mut self) -> Result<(), DatabaseError> {
        if self.dirty_blocks.is_empty() {
            log::debug!("No dirty blocks to sync");
            return Ok(());
        }

        log::info!("Syncing {} dirty blocks", self.dirty_blocks.len());
        
        // For WASM, persist dirty blocks to global storage
        #[cfg(target_arch = "wasm32")]
        {
            GLOBAL_STORAGE.with(|storage| {
                let mut storage_map = storage.borrow_mut();
                let db_storage = storage_map.entry(self.db_name.clone()).or_insert_with(HashMap::new);
                
                for (block_id, data) in &self.dirty_blocks {
                    db_storage.insert(*block_id, data.clone());
                    log::debug!("Persisted block {} to global storage", block_id);
                }
            });
        }
        
        let dirty_count = self.dirty_blocks.len();
        self.dirty_blocks.clear();
        log::info!("Successfully synced {} blocks to global storage", dirty_count);
        Ok(())
    }

    pub async fn sync(&mut self) -> Result<(), DatabaseError> {
        // Delegate to synchronous implementation for now
        self.sync_now()
    }

    pub fn clear_cache(&mut self) {
        log::debug!("Clearing cache ({} blocks)", self.cache.len());
        self.cache.clear();
    }

    pub fn get_cache_size(&self) -> usize {
        self.cache.len()
    }

    pub fn get_dirty_count(&self) -> usize {
        self.dirty_blocks.len()
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
        self.dirty_blocks.remove(&block_id);
        
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