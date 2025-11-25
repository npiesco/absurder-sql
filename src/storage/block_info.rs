//! Block storage information API for the AbsurderSQL Viewer
//! Provides read-only access to block metadata and cache statistics

// Reentrancy-safe lock macros
#[cfg(target_arch = "wasm32")]
macro_rules! lock_mutex {
    ($mutex:expr) => {
        $mutex.try_borrow()
            .expect("RefCell borrow failed - reentrancy detected in block_info.rs")
    };
}

#[cfg(not(target_arch = "wasm32"))]
macro_rules! lock_mutex {
    ($mutex:expr) => {
        $mutex.lock()
    };
}

use serde::{Serialize, Deserialize};
use super::block_storage::BlockStorage;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockInfo {
    pub block_id: u64,
    pub checksum: u64,
    pub version: u32,
    pub last_modified_ms: u64,
    pub is_cached: bool,
    pub is_dirty: bool,
    pub is_allocated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockStorageInfo {
    pub db_name: String,
    pub total_allocated_blocks: usize,
    pub total_cached_blocks: usize,
    pub total_dirty_blocks: usize,
    pub cache_capacity: usize,
    pub next_block_id: u64,
    pub blocks: Vec<BlockInfo>,
}

impl BlockStorage {
    /// Get comprehensive block storage information for the viewer
    pub fn get_storage_info(&mut self) -> BlockStorageInfo {
        // Get metadata for all allocated blocks
        let metadata = self.get_block_metadata_for_testing();
        
        let dirty_guard = lock_mutex!(self.dirty_blocks);
        let mut blocks: Vec<BlockInfo> = Vec::new();
        
        for &block_id in lock_mutex!(self.allocated_blocks).iter() {
            let is_cached = lock_mutex!(self.cache).contains_key(&block_id);
            let is_dirty = dirty_guard.contains_key(&block_id);
            
            let (checksum, version, last_modified_ms) = metadata
                .get(&block_id)
                .copied()
                .unwrap_or((0, 0, 0));
            
            blocks.push(BlockInfo {
                block_id,
                checksum,
                version,
                last_modified_ms,
                is_cached,
                is_dirty,
                is_allocated: true,
            });
        }
        
        // Sort by block_id for consistent display
        blocks.sort_by_key(|b| b.block_id);
        
        BlockStorageInfo {
            db_name: self.db_name.clone(),
            total_allocated_blocks: lock_mutex!(self.allocated_blocks).len(),
            total_cached_blocks: lock_mutex!(self.cache).len(),
            total_dirty_blocks: dirty_guard.len(),
            cache_capacity: self.capacity,
            next_block_id: self.next_block_id.load(std::sync::atomic::Ordering::SeqCst),
            blocks,
        }
    }
}
