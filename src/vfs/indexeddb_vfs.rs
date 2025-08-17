use crate::storage::{BlockStorage, BLOCK_SIZE, SyncPolicy};
use crate::types::DatabaseError;
// use rusqlite::ffi; // Will be used when VFS is fully implemented
// use std::collections::HashMap; // Will be used when file handles are implemented
// use std::ffi::{CStr, CString}; // Will be used when VFS is fully implemented
// use std::os::raw::{c_char, c_int, c_void}; // Will be used when VFS is fully implemented
// use std::ptr; // Will be used when VFS is fully implemented
use std::rc::Rc;
use std::cell::RefCell;

/// Custom SQLite VFS implementation that uses IndexedDB for storage
pub struct IndexedDBVFS {
    storage: Rc<RefCell<BlockStorage>>,
    #[allow(dead_code)]
    name: String,
    // file_handles: Arc<Mutex<HashMap<String, IndexedDBFile>>>, // Will be implemented later
}

impl IndexedDBVFS {
    pub async fn new(db_name: &str) -> Result<Self, DatabaseError> {
        log::info!("Creating IndexedDBVFS for database: {}", db_name);
        
        let storage = BlockStorage::new(db_name).await?;
        
        Ok(Self {
            storage: Rc::new(RefCell::new(storage)),
            name: db_name.to_string(),
            // file_handles: Arc::new(Mutex::new(HashMap::new())), // Will be implemented later
        })
    }

    pub fn register(&self, vfs_name: &str) -> Result<(), DatabaseError> {
        log::info!("Registering VFS: {}", vfs_name);
        
        // For this simplified implementation, we'll register a basic VFS
        // In a full implementation, you would need to implement all VFS methods
        // and register with SQLite's VFS system
        
        // This is a placeholder - actual VFS registration would require
        // implementing the full sqlite3_vfs interface
        Ok(())
    }

    /// Read a block from storage synchronously (called by SQLite)
    pub fn read_block_sync(&self, block_id: u64) -> Result<Vec<u8>, DatabaseError> {
        log::debug!("Sync read request for block: {}", block_id);
        
        let mut storage = self.storage.borrow_mut();
        storage.read_block_sync(block_id)
    }

    /// Write a block to storage synchronously (called by SQLite)
    pub fn write_block_sync(&self, block_id: u64, data: Vec<u8>) -> Result<(), DatabaseError> {
        log::debug!("Sync write request for block: {}", block_id);
        
        let mut storage = self.storage.borrow_mut();
        storage.write_block_sync(block_id, data)
    }

    /// Synchronize all dirty blocks to IndexedDB
    pub async fn sync(&self) -> Result<(), DatabaseError> {
        log::info!("Syncing VFS storage");
        // Perform synchronous sync to avoid holding RefCell borrow across await
        let mut storage = self.storage.borrow_mut();
        storage.sync_now()
    }

    /// Enable periodic auto-sync with a simple interval (ms)
    pub fn enable_auto_sync(&self, interval_ms: u64) {
        let mut storage = self.storage.borrow_mut();
        storage.enable_auto_sync(interval_ms);
    }

    /// Enable auto-sync with a detailed policy
    pub fn enable_auto_sync_with_policy(&self, policy: SyncPolicy) {
        let mut storage = self.storage.borrow_mut();
        storage.enable_auto_sync_with_policy(policy);
    }

    /// Disable any active auto-sync
    pub fn disable_auto_sync(&self) {
        let mut storage = self.storage.borrow_mut();
        storage.disable_auto_sync();
    }

    /// Drain pending dirty blocks and stop background workers
    pub fn drain_and_shutdown(&self) {
        let mut storage = self.storage.borrow_mut();
        storage.drain_and_shutdown();
    }

    /// Batch read helper
    pub fn read_blocks_sync(&self, block_ids: &[u64]) -> Result<Vec<Vec<u8>>, DatabaseError> {
        let mut storage = self.storage.borrow_mut();
        storage.read_blocks_sync(block_ids)
    }

    /// Batch write helper
    pub fn write_blocks_sync(&self, items: Vec<(u64, Vec<u8>)>) -> Result<(), DatabaseError> {
        let mut storage = self.storage.borrow_mut();
        storage.write_blocks_sync(items)
    }

    /// Inspect current dirty block count
    pub fn get_dirty_count(&self) -> usize {
        let storage = self.storage.borrow();
        storage.get_dirty_count()
    }

    /// Inspect current cache size
    pub fn get_cache_size(&self) -> usize {
        let storage = self.storage.borrow();
        storage.get_cache_size()
    }

    /// Metrics: total syncs (native only)
    #[cfg(not(target_arch = "wasm32"))]
    pub fn get_sync_count(&self) -> u64 {
        let storage = self.storage.borrow();
        storage.get_sync_count()
    }

    /// Metrics: timer-based syncs (native only)
    #[cfg(not(target_arch = "wasm32"))]
    pub fn get_timer_sync_count(&self) -> u64 {
        let storage = self.storage.borrow();
        storage.get_timer_sync_count()
    }

    /// Metrics: debounce-based syncs (native only)
    #[cfg(not(target_arch = "wasm32"))]
    pub fn get_debounce_sync_count(&self) -> u64 {
        let storage = self.storage.borrow();
        storage.get_debounce_sync_count()
    }

    /// Metrics: last sync duration in ms (native only)
    #[cfg(not(target_arch = "wasm32"))]
    pub fn get_last_sync_duration_ms(&self) -> u64 {
        let storage = self.storage.borrow();
        storage.get_last_sync_duration_ms()
    }
}

impl Drop for IndexedDBVFS {
    fn drop(&mut self) {
        // Avoid panicking in Drop if there's an outstanding borrow
        if let Ok(mut storage) = self.storage.try_borrow_mut() {
            storage.drain_and_shutdown();
        }
    }
}

/// Represents an open file in the IndexedDB VFS
#[allow(dead_code)]
struct IndexedDBFile {
    filename: String,
    vfs: *const IndexedDBVFS,
    file_size: u64,
    current_position: u64,
}

#[allow(dead_code)]
impl IndexedDBFile {
    fn new(filename: &str, vfs: *const IndexedDBVFS) -> Self {
        Self {
            filename: filename.to_string(),
            vfs,
            file_size: 0,
            current_position: 0,
        }
    }

    /// Read data from the file at the current position
    fn read(&mut self, buffer: &mut [u8], offset: u64) -> Result<usize, DatabaseError> {
        if buffer.is_empty() {
            return Ok(0);
        }

        let vfs = unsafe { &*self.vfs };
        let start_block = offset / BLOCK_SIZE as u64;
        let end_block = (offset + buffer.len() as u64 - 1) / BLOCK_SIZE as u64;
        
        let mut bytes_read = 0;
        let mut buffer_offset = 0;
        
        for block_id in start_block..=end_block {
            let block_data = vfs.read_block_sync(block_id)?;
            
            let block_start = if block_id == start_block {
                (offset % BLOCK_SIZE as u64) as usize
            } else {
                0
            };
            
            let block_end = if block_id == end_block {
                let remaining = buffer.len() - buffer_offset;
                std::cmp::min(BLOCK_SIZE, block_start + remaining)
            } else {
                BLOCK_SIZE
            };
            
            let copy_len = block_end - block_start;
            let dest_end = buffer_offset + copy_len;
            
            if dest_end <= buffer.len() {
                buffer[buffer_offset..dest_end]
                    .copy_from_slice(&block_data[block_start..block_end]);
                bytes_read += copy_len;
                buffer_offset += copy_len;
            }
        }
        
        self.current_position = offset + bytes_read as u64;
        Ok(bytes_read)
    }

    /// Write data to the file at the current position
    fn write(&mut self, data: &[u8], offset: u64) -> Result<usize, DatabaseError> {
        if data.is_empty() {
            return Ok(0);
        }

        let vfs = unsafe { &*self.vfs };
        let start_block = offset / BLOCK_SIZE as u64;
        let end_block = (offset + data.len() as u64 - 1) / BLOCK_SIZE as u64;
        
        let mut bytes_written = 0;
        let mut data_offset = 0;
        
        for block_id in start_block..=end_block {
            let mut block_data = vfs.read_block_sync(block_id)?;
            
            let block_start = if block_id == start_block {
                (offset % BLOCK_SIZE as u64) as usize
            } else {
                0
            };
            
            let block_end = if block_id == end_block {
                let remaining = data.len() - data_offset;
                std::cmp::min(BLOCK_SIZE, block_start + remaining)
            } else {
                BLOCK_SIZE
            };
            
            let copy_len = block_end - block_start;
            let src_end = data_offset + copy_len;
            
            if src_end <= data.len() {
                block_data[block_start..block_end]
                    .copy_from_slice(&data[data_offset..src_end]);
                
                vfs.write_block_sync(block_id, block_data)?;
                bytes_written += copy_len;
                data_offset += copy_len;
            }
        }
        
        self.current_position = offset + bytes_written as u64;
        self.file_size = std::cmp::max(self.file_size, self.current_position);
        
        Ok(bytes_written)
    }
}
