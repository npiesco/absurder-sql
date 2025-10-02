use crate::storage::SyncPolicy;
use crate::DatabaseError;
#[cfg(target_arch = "wasm32")]
use crate::storage::BLOCK_SIZE;
use crate::storage::BlockStorage;
use std::cell::RefCell;
use std::rc::Rc;

#[cfg(target_arch = "wasm32")]
use std::collections::HashMap;
#[cfg(target_arch = "wasm32")]
use std::sync::OnceLock;

#[cfg(target_arch = "wasm32")]
use std::os::raw::{c_char, c_int, c_void};
#[cfg(target_arch = "wasm32")]
use std::ffi::{CString, CStr};
// Macro to conditionally log only in debug builds
#[cfg(all(target_arch = "wasm32", debug_assertions))]
#[allow(unused_macros)]
macro_rules! vfs_log {
    ($($arg:tt)*) => {
        web_sys::console::log_1(&format!($($arg)*).into());
    };
}

#[cfg(not(all(target_arch = "wasm32", debug_assertions)))]
#[allow(unused_macros)]
macro_rules! vfs_log {
    ($($arg:tt)*) => {};
}

#[cfg(target_arch = "wasm32")]
thread_local! {
    // Registry of per-db BlockStorage so VFS callbacks can locate storage by db name
    pub static STORAGE_REGISTRY: RefCell<std::collections::HashMap<String, Rc<RefCell<BlockStorage>>>> = RefCell::new(std::collections::HashMap::new());
}

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
        
        // First check if there's already a BlockStorage instance for this database
        #[cfg(target_arch = "wasm32")]
        let existing_storage = STORAGE_REGISTRY.with(|reg| {
            reg.borrow().get(db_name).cloned()
        });
        
        #[cfg(not(target_arch = "wasm32"))]
        let existing_storage: Option<Rc<RefCell<BlockStorage>>> = None;
        
        let rc = if let Some(existing) = existing_storage {
            log::info!("Reusing existing BlockStorage for database: {}", db_name);
            existing
        } else {
            log::info!("Creating new BlockStorage for database: {}", db_name);
            let storage = BlockStorage::new(db_name).await?;
            let rc = Rc::new(RefCell::new(storage));
            
            #[cfg(target_arch = "wasm32")]
            STORAGE_REGISTRY.with(|reg| {
                let mut registry = reg.borrow_mut();
                // Register with both "name" and "name.db" to handle both cases
                registry.insert(db_name.to_string(), rc.clone());
                if !db_name.ends_with(".db") {
                    registry.insert(format!("{}.db", db_name), rc.clone());
                }
            });
            
            rc
        };

        Ok(Self { storage: rc, name: db_name.to_string() })
    }

    pub fn register(&self, vfs_name: &str) -> Result<(), DatabaseError> {
        log::info!("Registering VFS: {}", vfs_name);
        
        // Register a custom VFS on WASM that routes file IO to BlockStorage and defers commit via commit-marker
        #[cfg(target_arch = "wasm32")]
        unsafe {
            // Base on default VFS for utility callbacks
            let default_vfs = sqlite_wasm_rs::sqlite3_vfs_find(std::ptr::null());
            if default_vfs.is_null() {
                return Err(DatabaseError::new("SQLITE_ERROR", "Default VFS not found"));
            }

            // Build io_methods once - use original VFS methods
            let _ = IO_METHODS.get_or_init(|| sqlite_wasm_rs::sqlite3_io_methods {
                iVersion: 1,
                xClose: Some(x_close),
                xRead: Some(x_read),
                xWrite: Some(x_write),
                xTruncate: Some(x_truncate),
                xSync: Some(x_sync),
                xFileSize: Some(x_file_size),
                xLock: Some(x_lock),
                xUnlock: Some(x_unlock),
                xCheckReservedLock: Some(x_check_reserved_lock),
                xFileControl: Some(x_file_control),
                xSectorSize: Some(x_sector_size),
                xDeviceCharacteristics: Some(x_device_characteristics),
                // Version 2+ methods - set to None for version 1 compatibility
                xShmMap: None,
                xShmLock: None,
                xShmBarrier: None,
                xShmUnmap: None,
                // Version 3+ methods
                xFetch: None,
                xUnfetch: None,
            });

            // Allocate and register sqlite3_vfs
            let mut vfs = *default_vfs; // start with defaults
            vfs.pNext = std::ptr::null_mut();
            let name_c = CString::new(vfs_name)
                .map_err(|_| DatabaseError::new("INVALID_VFS_NAME", "Invalid VFS name"))?;
            let name_ptr = name_c.into_raw(); // leak on success
            vfs.zName = name_ptr as *const c_char;
            vfs.szOsFile = size_of::<VfsFile>() as c_int; // ensure SQLite allocates enough space for our file
            // Forward most methods to default, but override xOpen/xDelete/xAccess/xFullPathname if needed
            vfs.xOpen = Some(x_open);
            vfs.xDelete = Some(x_delete);
            vfs.xAccess = Some(x_access);
            vfs.xFullPathname = Some(x_full_pathname);
            vfs.xRandomness = (*default_vfs).xRandomness;
            vfs.xSleep = (*default_vfs).xSleep;
            vfs.xCurrentTime = (*default_vfs).xCurrentTime;
            vfs.xGetLastError = (*default_vfs).xGetLastError;
            vfs.xCurrentTimeInt64 = (*default_vfs).xCurrentTimeInt64;
            vfs.xDlOpen = (*default_vfs).xDlOpen;
            vfs.xDlError = (*default_vfs).xDlError;
            vfs.xDlSym = (*default_vfs).xDlSym;
            vfs.xDlClose = (*default_vfs).xDlClose;
            vfs.pAppData = default_vfs as *mut c_void; // stash default for forwarding where needed

            let vfs_box = Box::new(vfs);
            let vfs_ptr = Box::into_raw(vfs_box);
            let rc = sqlite_wasm_rs::sqlite3_vfs_register(vfs_ptr, 0);
            if rc != sqlite_wasm_rs::SQLITE_OK {
                // cleanup on failure
                let _ = Box::from_raw(vfs_ptr);
                let _ = CString::from_raw(name_ptr);
                return Err(DatabaseError::new("SQLITE_ERROR", "Failed to register custom VFS"));
            }
        }

        // Native: no-op for now
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
        #[cfg(target_arch = "wasm32")]
        vfs_log!("{}","=== DEBUG: VFS SYNC METHOD CALLED ===");
        log::info!("Syncing VFS storage");
        // Use async sync for WASM to properly await IndexedDB persistence
        #[cfg(target_arch = "wasm32")]
        {
            vfs_log!("{}","DEBUG: VFS using WASM async sync path");
            let mut storage = self.storage.borrow_mut();
            let result = storage.sync_async().await;
            vfs_log!("{}","DEBUG: VFS async sync completed");
            result
        }
        #[cfg(not(target_arch = "wasm32"))]
        {
            #[cfg(target_arch = "wasm32")]
            vfs_log!("{}","DEBUG: VFS using native sync path");
            let mut storage = self.storage.borrow_mut();
            storage.sync_now()
        }
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

/// Represents an open file in the IndexedDB VFS (WASM only)
#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
struct IndexedDBFile {
    filename: String,
    file_size: u64,
    current_position: u64,
    // Ephemeral files cover SQLite aux files like "-journal", "-wal", "-shm"
    ephemeral: bool,
    ephemeral_buf: Vec<u8>,
    // Write buffering for transaction performance (absurd-sql inspired)
    write_buffer: HashMap<u64, Vec<u8>>,  // block_id -> data (O(1) lookup)
    transaction_active: bool,
    current_lock_level: i32,  // Track SQLite lock level
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
impl IndexedDBFile {
    fn new(filename: &str, ephemeral: bool) -> Self {
        Self {
            filename: filename.to_string(),
            file_size: 0,
            current_position: 0,
            ephemeral,
            ephemeral_buf: Vec::new(),
            write_buffer: HashMap::new(),
            transaction_active: false,
            current_lock_level: 0,  // SQLITE_LOCK_NONE
        }
    }

    /// Read data from the file at the current position
    fn read(&mut self, buffer: &mut [u8], offset: u64) -> Result<usize, DatabaseError> {
        if buffer.is_empty() { return Ok(0); }
        if self.ephemeral {
            let off = offset as usize;
            if off >= self.ephemeral_buf.len() { return Ok(0); }
            let available = self.ephemeral_buf.len() - off;
            let to_copy = std::cmp::min(available, buffer.len());
            buffer[..to_copy].copy_from_slice(&self.ephemeral_buf[off..off + to_copy]);
            self.current_position = offset + to_copy as u64;
            return Ok(to_copy);
        }
        let storage_rc = STORAGE_REGISTRY.with(|reg| reg.borrow().get(&self.filename).cloned());
        let Some(storage_rc) = storage_rc else {
            return Err(DatabaseError::new("OPEN_ERROR", &format!("No storage found for {}", self.filename)));
        };
        let start_block = offset / BLOCK_SIZE as u64;
        let end_block = (offset + buffer.len() as u64 - 1) / BLOCK_SIZE as u64;
        let mut bytes_read = 0;
        let mut buffer_offset = 0;
        for block_id in start_block..=end_block {
            let block_start = if block_id == start_block { (offset % BLOCK_SIZE as u64) as usize } else { 0 };
            let block_end = if block_id == end_block { let remaining = buffer.len() - buffer_offset; std::cmp::min(BLOCK_SIZE, block_start + remaining) } else { BLOCK_SIZE };
            let copy_len = block_end - block_start;
            let dest_end = buffer_offset + copy_len;
            
            if dest_end <= buffer.len() {
                // Check write buffer first (absurd-sql pattern)
                if let Some(buffered_data) = self.write_buffer.get(&block_id) {
                    buffer[buffer_offset..dest_end].copy_from_slice(&buffered_data[block_start..block_end]);
                    bytes_read += copy_len;
                    buffer_offset += copy_len;
                    continue;
                }
                // Not in buffer, read from storage
                let block_data = storage_rc.borrow_mut().read_block_sync(block_id)?;
                buffer[buffer_offset..dest_end].copy_from_slice(&block_data[block_start..block_end]);
                bytes_read += copy_len;
                buffer_offset += copy_len;
            }
        }
        self.current_position = offset + bytes_read as u64;
        Ok(bytes_read)
    }

    /// Write data to the file at the current position
    fn write(&mut self, data: &[u8], offset: u64) -> Result<usize, DatabaseError> {
        if data.is_empty() { return Ok(0); }
        if self.ephemeral {
            let end = offset as usize + data.len();
            if end > self.ephemeral_buf.len() {
                self.ephemeral_buf.resize(end, 0);
            }
            self.ephemeral_buf[offset as usize..end].copy_from_slice(data);
            self.current_position = end as u64;
            self.file_size = std::cmp::max(self.file_size, self.current_position);
            return Ok(data.len());
        }
        
        // KEY OPTIMIZATION: Buffer writes during transactions (absurd-sql strategy)
        // Only persist to GLOBAL_STORAGE when transaction commits (on unlock)
        if self.transaction_active {
            #[cfg(target_arch = "wasm32")]
            vfs_log!("BUFFERED WRITE: offset={} len={} (transaction active)", offset, data.len());
            
            let storage_rc = STORAGE_REGISTRY.with(|reg| reg.borrow().get(&self.filename).cloned());
            let Some(storage_rc) = storage_rc else {
                return Err(DatabaseError::new("OPEN_ERROR", &format!("No storage found for {}", self.filename)));
            };
            
            let start_block = offset / BLOCK_SIZE as u64;
            let end_block = (offset + data.len() as u64 - 1) / BLOCK_SIZE as u64;
            let mut bytes_written = 0;
            let mut data_offset = 0;
            
            // Buffer the write for later
            for block_id in start_block..=end_block {
                let block_start = if block_id == start_block { (offset % BLOCK_SIZE as u64) as usize } else { 0 };
                let remaining_data = data.len() - data_offset;
                let available_space = BLOCK_SIZE - block_start;
                let copy_len = std::cmp::min(remaining_data, available_space);
                let block_end = block_start + copy_len;
                let src_end = data_offset + copy_len;
                
                if src_end <= data.len() && block_end <= BLOCK_SIZE {
                    // Check if this is a full block write (no need to read existing data)
                    let is_full_block_write = block_start == 0 && copy_len == BLOCK_SIZE;
                    
                    let block_data = if is_full_block_write {
                        // Full block write - just use new data directly
                        data[data_offset..src_end].to_vec()
                    } else {
                        // Partial block write - need to read existing data first
                        let existing = {
                            let mut storage_mut = storage_rc.borrow_mut();
                            storage_mut.read_block_sync(block_id)?
                        };
                        let mut block_data = existing;
                        block_data[block_start..block_end].copy_from_slice(&data[data_offset..src_end]);
                        block_data
                    };
                    
                    self.write_buffer.insert(block_id, block_data);
                    bytes_written += copy_len;
                    data_offset += copy_len;
                }
            }
            
            self.current_position = offset + bytes_written as u64;
            self.file_size = std::cmp::max(self.file_size, self.current_position);
            return Ok(bytes_written);
        }
        
        // Non-transactional write: persist immediately (old behavior)
        let storage_rc = STORAGE_REGISTRY.with(|reg| reg.borrow().get(&self.filename).cloned());
        let Some(storage_rc) = storage_rc else {
            return Err(DatabaseError::new("OPEN_ERROR", &format!("No storage found for {}", self.filename)));
        };
        let start_block = offset / BLOCK_SIZE as u64;
        let end_block = (offset + data.len() as u64 - 1) / BLOCK_SIZE as u64;
        let mut bytes_written = 0;
        let mut data_offset = 0;
        for block_id in start_block..=end_block {
            // Scope the borrow to avoid "already borrowed" panic
            let mut block_data = {
                storage_rc.borrow_mut().read_block_sync(block_id)?
            };
            let block_start = if block_id == start_block { (offset % BLOCK_SIZE as u64) as usize } else { 0 };
            let remaining_data = data.len() - data_offset;
            let available_space = BLOCK_SIZE - block_start;
            let copy_len = std::cmp::min(remaining_data, available_space);
            let block_end = block_start + copy_len;
            let src_end = data_offset + copy_len;
            
            if src_end <= data.len() && block_end <= BLOCK_SIZE {
                // Debug: Log the write operation details
                #[cfg(target_arch = "wasm32")]
                {
                    let existing_preview = if block_data.len() >= 8 {
                        format!("{:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x}", 
                            block_data[0], block_data[1], block_data[2], block_data[3], block_data[4], block_data[5], block_data[6], block_data[7])
                    } else { "short".to_string() };
                    let new_data_preview = if data.len() >= data_offset + 8 {
                        format!("{:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x}", 
                            data[data_offset], data[data_offset+1], data[data_offset+2], data[data_offset+3], 
                            data[data_offset+4], data[data_offset+5], data[data_offset+6], data[data_offset+7])
                    } else { "short".to_string() };
                    web_sys::console::log_1(&format!("DEBUG: VFS write block {} offset={} len={} block_start={} block_end={} copy_len={} - existing: {}, new_data: {}", 
                        block_id, offset, data.len(), block_start, block_end, copy_len, existing_preview, new_data_preview).into());
                }
                
                block_data[block_start..block_end].copy_from_slice(&data[data_offset..src_end]);
                
                // Debug: Log the final block data after modification (removed for performance)
                
                storage_rc.borrow_mut().write_block_sync(block_id, block_data)?;
                bytes_written += copy_len;
                data_offset += copy_len;
            }
        }
        self.current_position = offset + bytes_written as u64;
        self.file_size = std::cmp::max(self.file_size, self.current_position);
        Ok(bytes_written)
    }
}

// ----------------------------- WASM VFS glue -------------------------------

#[cfg(target_arch = "wasm32")]
#[repr(C)]
struct VfsFile {
    base: sqlite_wasm_rs::sqlite3_file,
    // Our state follows the base header (SQLite allocates szOsFile bytes)
    handle: IndexedDBFile,
}

#[cfg(target_arch = "wasm32")]
static IO_METHODS: OnceLock<sqlite_wasm_rs::sqlite3_io_methods> = OnceLock::new();

#[cfg(target_arch = "wasm32")]
unsafe fn file_from_ptr(p_file: *mut sqlite_wasm_rs::sqlite3_file) -> *mut VfsFile {
    p_file as *mut VfsFile
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_open_simple(
    _p_vfs: *mut sqlite_wasm_rs::sqlite3_vfs,
    z_name: *const c_char,
    p_file: *mut sqlite_wasm_rs::sqlite3_file,
    _flags: c_int,
    _p_out_flags: *mut c_int,
) -> c_int {
    // Extract database name from path
    let name_str = if !z_name.is_null() {
        match unsafe { CStr::from_ptr(z_name) }.to_str() { 
            Ok(s) => s.to_string(), 
            Err(_) => String::from("unknown") 
        }
    } else {
        String::from("unknown")
    };
    
    // Strip "file:" prefix if present
    let db_name = if name_str.starts_with("file:") {
        name_str[5..].to_string()
    } else {
        name_str
    };
    
    // Determine if this is an ephemeral file (journal, WAL, etc.)
    let ephemeral = db_name.contains("-journal") || db_name.contains("-wal") || db_name.contains("-shm");
    
    // Simple VFS open - just initialize the file structure with our methods
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    let methods_ptr = IO_METHODS.get().unwrap() as *const _;
    
    unsafe {
        (*vf).base.pMethods = methods_ptr;
        std::ptr::write(
            &mut (*vf).handle,
            IndexedDBFile::new(&db_name, ephemeral),
        );
        
        // For non-ephemeral files, calculate and set correct file size based on existing data
        if !ephemeral {
            use crate::storage::vfs_sync::with_global_storage;
            let calculated_size = with_global_storage(|gs| {
                if let Some(db) = gs.borrow().get(&db_name) {
                    if db.is_empty() {
                        0
                    } else {
                        let max_block_id = db.keys().max().copied().unwrap_or(0);
                        (max_block_id + 1) * 4096
                    }
                } else {
                    0  // New database, size is 0
                }
            });
            (*vf).handle.file_size = calculated_size;
            
            #[cfg(target_arch = "wasm32")]
            vfs_log!("VFS x_open_simple: Set file_size to {} for database {}", calculated_size, db_name);
        }
    }
    
    #[cfg(target_arch = "wasm32")]
    vfs_log!("{}","VFS x_open_simple: SUCCESS");
    
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_open(
    _p_vfs: *mut sqlite_wasm_rs::sqlite3_vfs,
    z_name: *const c_char,
    p_file: *mut sqlite_wasm_rs::sqlite3_file,
    _flags: c_int,
    _p_out_flags: *mut c_int,
) -> c_int {
    // Normalize filename: strip leading "file:" if present
    let name_str = if !z_name.is_null() {
        match unsafe { CStr::from_ptr(z_name) }.to_str() { Ok(s) => s.to_string(), Err(_) => String::from("") }
    } else { String::from("") };
    let mut norm = name_str.strip_prefix("file:").unwrap_or(&name_str).to_string();
    
    #[cfg(target_arch = "wasm32")]
    vfs_log!("VFS xOpen: Attempting to open file: '{}' (flags: {})", name_str, _flags);
    // Detect auxiliary files and map to base db
    let mut ephemeral = false;
    for suf in ["-journal", "-wal", "-shm"].iter() {
        if norm.ends_with(suf) {
            norm.truncate(norm.len() - suf.len());
            ephemeral = true;
            break;
        }
    }
    let db_name = norm;

    // Ensure storage exists for base db - create if needed for existing databases
    let has_storage = STORAGE_REGISTRY.with(|reg| reg.borrow().contains_key(&db_name));
    #[cfg(target_arch = "wasm32")]
    vfs_log!("VFS xOpen: Checking storage for {} (ephemeral={}), has_storage={}", db_name, ephemeral, has_storage);
    
    if !has_storage {
        // Check if this database has existing data in global storage
        use crate::storage::vfs_sync::{with_global_storage, with_global_commit_marker};
        let has_existing_data = with_global_storage(|gs| gs.borrow().contains_key(&db_name)) ||
                               with_global_commit_marker(|cm| cm.borrow().contains_key(&db_name));
        
        if has_existing_data {
            // Auto-register storage for existing database
            #[cfg(target_arch = "wasm32")]
            vfs_log!("VFS xOpen: Auto-registering storage for existing database: {}", db_name);
            
            // Create BlockStorage synchronously for existing database
            let storage = BlockStorage::new_sync(&db_name);
            let rc = Rc::new(RefCell::new(storage));
            STORAGE_REGISTRY.with(|reg| {
                reg.borrow_mut().insert(db_name.clone(), rc);
            });
        } else {
            log::error!("xOpen: no storage registered for base db '{}' and no existing data found. Call IndexedDBVFS::new(db).await first.", db_name);
            return sqlite_wasm_rs::SQLITE_CANTOPEN;
        }
    }
    
    // Debug logging removed for performance

    // Initialize our VfsFile in the buffer provided by SQLite
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    let methods_ptr = IO_METHODS.get().unwrap() as *const _;
    unsafe {
        // Initialize the base sqlite3_file structure first
        (*vf).base.pMethods = methods_ptr;
        
        // Then initialize our handle
        std::ptr::write(
            &mut (*vf).handle,
            IndexedDBFile::new(&db_name, ephemeral),
        );
        
        // For non-ephemeral files, calculate and set correct file size based on existing data
        if !ephemeral {
            use crate::storage::vfs_sync::with_global_storage;
            let has_existing_blocks = with_global_storage(|gs| {
                gs.borrow().get(&db_name).map(|db| !db.is_empty()).unwrap_or(false)
            });
            
            if has_existing_blocks {
                let max_block_id = with_global_storage(|gs| {
                    gs.borrow().get(&db_name).map(|db| {
                        db.keys().max().copied().unwrap_or(0)
                    }).unwrap_or(0)
                });
                
                // SQLite uses 4KB blocks, so file size is (max_block_id + 1) * 4096
                let calculated_size = (max_block_id + 1) * 4096;
                (*vf).handle.file_size = calculated_size;
                
                #[cfg(target_arch = "wasm32")]
                vfs_log!("VFS xOpen: Set file_size to {} for existing database {} (max_block_id={})", calculated_size, db_name, max_block_id);
            } else {
                // New database starts with file_size = 0
                (*vf).handle.file_size = 0;
                
                #[cfg(target_arch = "wasm32")]
                vfs_log!("VFS xOpen: Set file_size to 0 for new database {}", db_name);
            }
        }
    }
    sqlite_wasm_rs::SQLITE_OK
}

// Minimal stub methods for debugging
#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_close_stub(_p_file: *mut sqlite_wasm_rs::sqlite3_file) -> c_int {
    #[cfg(target_arch = "wasm32")]
    vfs_log!("{}","VFS x_close_stub: called");
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_read_stub(
    p_file: *mut sqlite_wasm_rs::sqlite3_file,
    buf: *mut c_void,
    amt: c_int,
    offset: i64,
) -> c_int {
    // vfs_log!("VFS x_read_stub: amt={} offset={}", amt, offset);
    
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    let slice = unsafe { std::slice::from_raw_parts_mut(buf as *mut u8, amt as usize) };
    let res = unsafe { (*vf).handle.read(slice, offset as u64) };
    match res {
        Ok(n) => {
            if n < amt as usize {
                // Zero-fill the remaining buffer for short reads
                for b in &mut slice[n..] { *b = 0; }
            }
            sqlite_wasm_rs::SQLITE_OK
        }
        Err(_) => sqlite_wasm_rs::SQLITE_IOERR_READ,    
    }
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_write_stub(
    p_file: *mut sqlite_wasm_rs::sqlite3_file,
    buf: *const c_void,
    amt: c_int,
    offset: i64,
) -> c_int {
    // Logging disabled for performance
    // vfs_log!("VFS x_write_stub: amt={} offset={}", amt, offset);
    
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    let vf_ref = unsafe { &*vf };
    let data = unsafe { std::slice::from_raw_parts(buf as *const u8, amt as usize) };

    // Handle ephemeral files (journal, WAL, etc.) in memory
    if vf_ref.handle.ephemeral {
        unsafe {
            let file_end = offset as usize + amt as usize;
            if (*vf).handle.ephemeral_buf.len() < file_end {
                (*vf).handle.ephemeral_buf.resize(file_end, 0);
            }
            (&mut (*vf).handle.ephemeral_buf)[offset as usize..file_end].copy_from_slice(data);
        }
        
        // vfs_log!("VFS x_write_stub: SUCCESS wrote {} bytes to ephemeral file", amt);
        return sqlite_wasm_rs::SQLITE_OK;
    }

    // For main database files, use the block-based write approach from the original VFS
    let db_name = &vf_ref.handle.filename;
    let mut bytes_written = 0;
    let mut data_offset = 0;
    
    while bytes_written < amt as usize {
        let file_offset = offset as u64 + bytes_written as u64;
        let block_id = file_offset / 4096;
        let block_offset = (file_offset % 4096) as usize;
        let remaining = amt as usize - bytes_written;
        let copy_len = std::cmp::min(remaining, 4096 - block_offset);
        
        // Read existing block data
        use crate::storage::vfs_sync::with_global_storage;
        let mut block_data = with_global_storage(|gs| {
            gs.borrow()
                .get(db_name)
                .and_then(|db| db.get(&block_id))
                .cloned()
                .unwrap_or_else(|| vec![0; 4096])
        });
        
        // Update the block with new data
        block_data[block_offset..block_offset + copy_len]
            .copy_from_slice(&data[data_offset..data_offset + copy_len]);
        
        // Store the updated block
        with_global_storage(|gs| {
            gs.borrow_mut()
                .entry(db_name.clone())
                .or_insert_with(std::collections::HashMap::new)
                .insert(block_id, block_data);
        });
        
        bytes_written += copy_len;
        data_offset += copy_len;
    }
    
    // Update file size if this write extends the file
    let new_end = offset as u64 + amt as u64;
    unsafe {
        if new_end > (*vf).handle.file_size {
            (*vf).handle.file_size = new_end;
            // vfs_log!("VFS x_write_stub: Updated file_size to {}", new_end);
        }
    }
    
    // vfs_log!("VFS x_write_stub: SUCCESS wrote {} bytes", amt);
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_truncate_stub(p_file: *mut sqlite_wasm_rs::sqlite3_file, size: i64) -> c_int {
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    let vf_ref = unsafe { &*vf };
    
    #[cfg(target_arch = "wasm32")]
    vfs_log!("VFS x_truncate_stub: truncating {} to size {}", vf_ref.handle.filename, size);
    
    // Handle ephemeral files
    if vf_ref.handle.ephemeral {
        unsafe {
            if size >= 0 {
                (*vf).handle.ephemeral_buf.resize(size as usize, 0);
            }
        }
        return sqlite_wasm_rs::SQLITE_OK;
    }
    
    // For main database files, update file size and remove blocks beyond the truncation point
    let new_size = size as u64;
    unsafe {
        (*vf).handle.file_size = new_size;
    }
    
    // Remove blocks beyond the truncation point
    let last_block = if new_size == 0 { 0 } else { (new_size - 1) / 4096 };
    let db_name = &vf_ref.handle.filename;
    
    use crate::storage::vfs_sync::with_global_storage;
    with_global_storage(|gs| {
        if let Some(db) = gs.borrow_mut().get_mut(db_name) {
            db.retain(|&block_id, _| block_id <= last_block);
        }
    });
    
    #[cfg(target_arch = "wasm32")]
    vfs_log!("VFS x_truncate_stub: SUCCESS truncated to size {}", size);
    
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_sync_stub(p_file: *mut sqlite_wasm_rs::sqlite3_file, _flags: c_int) -> c_int {
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    let vf_ref = unsafe { &*vf };
    
    // Skip sync for ephemeral auxiliary files (WAL, journal, etc.)
    if vf_ref.handle.ephemeral {
        #[cfg(target_arch = "wasm32")]
        vfs_log!("{}","VFS x_sync_stub: skipping ephemeral file");
        return sqlite_wasm_rs::SQLITE_OK;
    }
    
    // For main database files, perform sync to advance commit marker and trigger persistence
    // Sync logging removed for performance
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_file_size_stub(p_file: *mut sqlite_wasm_rs::sqlite3_file, p_size: *mut i64) -> c_int {
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    unsafe {
        let sz = if (*vf).handle.ephemeral {
            (*vf).handle.ephemeral_buf.len() as i64
        } else {
            (*vf).handle.file_size as i64
        };
        
        // vfs_log!("VFS x_file_size_stub: returning size={} ephemeral={}", sz, (*vf).handle.ephemeral);
        
        *p_size = sz;
    }
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_lock_stub(_p_file: *mut sqlite_wasm_rs::sqlite3_file, _lock_type: c_int) -> c_int {
    // vfs_log!("VFS x_lock_stub: lock_type={}", _lock_type);
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_unlock_stub(_p_file: *mut sqlite_wasm_rs::sqlite3_file, _lock_type: c_int) -> c_int {
    // vfs_log!("VFS x_unlock_stub: lock_type={}", _lock_type);
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_check_reserved_lock_stub(_p_file: *mut sqlite_wasm_rs::sqlite3_file, p_res_out: *mut c_int) -> c_int {
    #[cfg(target_arch = "wasm32")]
    vfs_log!("{}","VFS x_check_reserved_lock_stub: called");
    unsafe {
        *p_res_out = 0;
    }
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_file_control_stub(_p_file: *mut sqlite_wasm_rs::sqlite3_file, _op: c_int, _p_arg: *mut c_void) -> c_int {
    #[cfg(target_arch = "wasm32")]
    vfs_log!("VFS x_file_control_stub: op={}", _op);
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_sector_size_stub(_p_file: *mut sqlite_wasm_rs::sqlite3_file) -> c_int {
    #[cfg(target_arch = "wasm32")]
    vfs_log!("{}","VFS x_sector_size_stub: called");
    4096
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_device_characteristics_stub(_p_file: *mut sqlite_wasm_rs::sqlite3_file) -> c_int {
    #[cfg(target_arch = "wasm32")]
    vfs_log!("{}","VFS x_device_characteristics_stub: called");
    0
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_close(_p_file: *mut sqlite_wasm_rs::sqlite3_file) -> c_int {
    let vf: *mut VfsFile = unsafe { file_from_ptr(_p_file) };
    
    #[cfg(target_arch = "wasm32")]
    vfs_log!("{}","VFS x_close: called");
    
    // Reload the cache from GLOBAL_STORAGE so next connection sees fresh data
    unsafe {
        let storage_rc = STORAGE_REGISTRY.with(|reg| reg.borrow().get(&(*vf).handle.filename).cloned());
        if let Some(storage_rc) = storage_rc {
            storage_rc.borrow_mut().reload_cache_from_global_storage();
            
            #[cfg(target_arch = "wasm32")]
            vfs_log!("VFS x_close: reloaded cache from GLOBAL_STORAGE for {}", (*vf).handle.filename);
        }
    }
    
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_read(
    p_file: *mut sqlite_wasm_rs::sqlite3_file,
    buf: *mut c_void,
    amt: c_int,
    offset: i64,
) -> c_int {
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    let slice = unsafe { std::slice::from_raw_parts_mut(buf as *mut u8, amt as usize) };
    let res = unsafe { (*vf).handle.read(slice, offset as u64) };
    match res {
        Ok(n) => {
            // If short read, zero-fill the remainder per SQLite contract
            if n < amt as usize {
                for b in &mut slice[n..] { *b = 0; }
            }
            // Always return OK for successful reads, even if short
            sqlite_wasm_rs::SQLITE_OK
        }
        Err(_) => sqlite_wasm_rs::SQLITE_IOERR_READ,    
    }
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_write(
    p_file: *mut sqlite_wasm_rs::sqlite3_file,
    buf: *const c_void,
    amt: c_int,
    offset: i64,
) -> c_int {
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    let slice = unsafe { std::slice::from_raw_parts(buf as *const u8, amt as usize) };
    
    #[cfg(target_arch = "wasm32")]
    vfs_log!("VFS x_write: offset={} amt={} ephemeral={}", offset, amt, unsafe { (*vf).handle.ephemeral });
    
    let res = unsafe { (*vf).handle.write(slice, offset as u64) };
    match res {
        Ok(_n) => {
            vfs_log!("VFS x_write: SUCCESS wrote {} bytes", _n);
            sqlite_wasm_rs::SQLITE_OK
        },
        Err(_e) => {
            vfs_log!("VFS x_write: ERROR {:?}", _e);
            sqlite_wasm_rs::SQLITE_IOERR_WRITE
        },
    }
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_truncate(p_file: *mut sqlite_wasm_rs::sqlite3_file, size: i64) -> c_int {
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    unsafe {
        #[cfg(target_arch = "wasm32")]
        vfs_log!("VFS x_truncate: size={} ephemeral={}", size, (*vf).handle.ephemeral);
        
        if (*vf).handle.ephemeral {
            let new_len = size as usize;
            if new_len < (*vf).handle.ephemeral_buf.len() {
                (*vf).handle.ephemeral_buf.truncate(new_len);
            } else if new_len > (*vf).handle.ephemeral_buf.len() {
                (*vf).handle.ephemeral_buf.resize(new_len, 0);
            }
            (*vf).handle.file_size = size as u64;
        } else {
            (*vf).handle.file_size = size as u64;
        }
    }
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_sync(p_file: *mut sqlite_wasm_rs::sqlite3_file, _flags: c_int) -> c_int {
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    let vf_ref = unsafe { &*vf };
    
    // Skip sync for ephemeral auxiliary files (WAL, journal, etc.)
    if vf_ref.handle.ephemeral {
        return sqlite_wasm_rs::SQLITE_OK;
    }
    
    // For main database files, just advance commit marker in memory
    // Don't persist to IndexedDB on every sync - that's too slow
    // Auto-sync will handle periodic persistence
    let db_name = &vf_ref.handle.filename;
    
    // Just advance the commit marker in memory
    use crate::storage::vfs_sync::with_global_commit_marker;
    with_global_commit_marker(|cm| {
        let mut markers = cm.borrow_mut();
        let current = markers.get(db_name).copied().unwrap_or(0);
        markers.insert(db_name.to_string(), current + 1);
    });
    
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_file_size(p_file: *mut sqlite_wasm_rs::sqlite3_file, p_size: *mut i64) -> c_int {
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    unsafe {
        let sz = if (*vf).handle.ephemeral {
            (*vf).handle.ephemeral_buf.len() as i64
        } else {
            (*vf).handle.file_size as i64
        };
        
        // vfs_log!("VFS x_file_size: returning size={} ephemeral={}", sz, (*vf).handle.ephemeral);
        
        *p_size = sz;
    }
    sqlite_wasm_rs::SQLITE_OK
}

// VFS-level stubs -------------------------------------------------------------
#[cfg(target_arch = "wasm32")]
unsafe extern "C" fn x_delete(
    _p_vfs: *mut sqlite_wasm_rs::sqlite3_vfs,
    _z_name: *const c_char,
    _sync_dir: c_int,
) -> c_int {
    #[cfg(debug_assertions)]
    let name_str = if !_z_name.is_null() {
        match unsafe { std::ffi::CStr::from_ptr(_z_name) }.to_str() { 
            Ok(s) => s.to_string(), 
            Err(_) => String::from("") 
        }
    } else { 
        String::from("") 
    };
    
    vfs_log!("VFS x_delete: file='{}'", name_str);
    
    // Nothing to delete in our model; journals/WAL are ephemeral.
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
unsafe extern "C" fn x_access(
    _p_vfs: *mut sqlite_wasm_rs::sqlite3_vfs,
    z_name: *const c_char,
    _flags: c_int,
    p_res_out: *mut c_int,
) -> c_int {
    // Normalize filename: strip leading "file:" if present
    let name_str = if !z_name.is_null() {
        match unsafe { CStr::from_ptr(z_name) }.to_str() { Ok(s) => s.to_string(), Err(_) => String::from("") }
    } else { String::from("") };
    let mut norm = name_str.strip_prefix("file:").unwrap_or(&name_str).to_string();
    
    // Detect auxiliary files and map to base db
    for suf in ["-journal", "-wal", "-shm"].iter() {
        if norm.ends_with(suf) {
            norm.truncate(norm.len() - suf.len());
            break;
        }
    }
    let db_name = norm;

    // Check if specific file exists
    use crate::storage::vfs_sync::with_global_storage;
    let exists = if name_str.ends_with("-journal") || name_str.ends_with("-wal") || name_str.ends_with("-shm") {
        // Auxiliary files are ephemeral and should be reported as not existing
        // unless they are actually open in the registry
        false
    } else {
        // For main database files, check if they exist in storage
        STORAGE_REGISTRY.with(|reg| {
            reg.borrow().contains_key(&db_name)
        }) || with_global_storage(|gs| {
            gs.borrow().get(&db_name).map(|db| !db.is_empty()).unwrap_or(false)
        })
    };
    
    #[cfg(target_arch = "wasm32")]
    vfs_log!("VFS x_access: file='{}' db_name='{}' exists={}", name_str, db_name, exists);
    
    unsafe {
        *p_res_out = if exists { 1 } else { 0 };
    }
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
unsafe extern "C" fn x_full_pathname(
    _p_vfs: *mut sqlite_wasm_rs::sqlite3_vfs,
    z_name: *const c_char,
    n_out: c_int,
    z_out: *mut c_char,
) -> c_int {
    if z_name.is_null() || z_out.is_null() || n_out <= 0 { return sqlite_wasm_rs::SQLITE_ERROR; }
    let src = unsafe { CStr::from_ptr(z_name) };
    let bytes = src.to_bytes();
    let to_copy = std::cmp::min(bytes.len(), (n_out - 1) as usize);
    unsafe { std::ptr::copy_nonoverlapping(bytes.as_ptr(), z_out as *mut u8, to_copy); }
    unsafe { *z_out.add(to_copy) = 0; }
    sqlite_wasm_rs::SQLITE_OK
}

// ---- Required IO stubs for single-process WASM ----
#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_lock(_p_file: *mut sqlite_wasm_rs::sqlite3_file, e_lock: c_int) -> c_int {
    let vf: *mut VfsFile = unsafe { file_from_ptr(_p_file) };
    
    #[cfg(target_arch = "wasm32")]
    vfs_log!("VFS x_lock: lock_type={}", e_lock);
    
    // SQLite lock levels: 0=NONE, 1=SHARED, 2=RESERVED, 3=PENDING, 4=EXCLUSIVE
    // Activate write buffering when acquiring RESERVED (2) or EXCLUSIVE (4) lock
    unsafe {
        (*vf).handle.current_lock_level = e_lock;
        
        if e_lock >= 2 && !(*vf).handle.transaction_active {
            // Starting a write transaction - activate buffering
            (*vf).handle.transaction_active = true;
            (*vf).handle.write_buffer.clear();
            
            #[cfg(target_arch = "wasm32")]
            vfs_log!("{}","🔒 TRANSACTION STARTED: Write buffering activated");
        }
    }
    
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_unlock(_p_file: *mut sqlite_wasm_rs::sqlite3_file, e_lock: c_int) -> c_int {
    let vf: *mut VfsFile = unsafe { file_from_ptr(_p_file) };
    
    #[cfg(target_arch = "wasm32")]
    vfs_log!("VFS x_unlock: lock_type={}", e_lock);
    
    unsafe {
        // absurd-sql pattern: if we had a write lock (RESERVED=2 or higher), flush on unlock
        if (*vf).handle.current_lock_level >= 2 && (*vf).handle.transaction_active {
            #[cfg(target_arch = "wasm32")]
            vfs_log!("🔓 TRANSACTION COMMIT: Flushing {} buffered writes to memory", (*vf).handle.write_buffer.len());
            
            // Flush all buffered writes to GLOBAL_STORAGE (in-memory)
            let storage_rc = STORAGE_REGISTRY.with(|reg| reg.borrow().get(&(*vf).handle.filename).cloned());
            if let Some(storage_rc) = storage_rc {
                for (block_id, block_data) in (*vf).handle.write_buffer.drain() {
                    // Write buffered block to GLOBAL_STORAGE (memory only)
                    if let Err(_e) = storage_rc.borrow_mut().write_block_sync(block_id, block_data) {
                        vfs_log!("ERROR flushing block {}: {:?}", block_id, _e);
                    }
                }
                
                // Clear the cache so subsequent reads see the fresh data
                storage_rc.borrow_mut().clear_cache();
                
                // NOTE: We do NOT sync to IndexedDB here!
                // IndexedDB sync only happens on explicit x_sync() calls.
                // This is the key optimization that makes absurd-sql fast.
            }
            
            // Deactivate buffering
            (*vf).handle.transaction_active = false;
            (*vf).handle.write_buffer.clear();
        }
        
        (*vf).handle.current_lock_level = e_lock;
    }
    
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_check_reserved_lock(_p_file: *mut sqlite_wasm_rs::sqlite3_file, p_res_out: *mut c_int) -> c_int {
    unsafe { *p_res_out = 0; }
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_file_control(_p_file: *mut sqlite_wasm_rs::sqlite3_file, op: c_int, _p_arg: *mut c_void) -> c_int {
    vfs_log!("VFS x_file_control: op={}", op);
    
    // Handle specific file control operations that SQLite expects
    match op {
        // SQLITE_FCNTL_LOCKSTATE - SQLite is asking for lock state
        10 => {
            if !_p_arg.is_null() {
                // Return "no locks held" (0)
                unsafe { *(_p_arg as *mut c_int) = 0; }
            }
            sqlite_wasm_rs::SQLITE_OK
        }
        // SQLITE_FCNTL_SIZE_HINT - SQLite is providing a size hint
        5 => sqlite_wasm_rs::SQLITE_OK,
        // SQLITE_FCNTL_CHUNK_SIZE - SQLite is setting chunk size
        6 => sqlite_wasm_rs::SQLITE_OK,
        // SQLITE_FCNTL_SYNC_OMITTED - SQLite is notifying that sync was omitted
        8 => sqlite_wasm_rs::SQLITE_OK,
        // SQLITE_FCNTL_COMMIT_PHASETWO - SQLite is in commit phase two
        21 => sqlite_wasm_rs::SQLITE_OK,
        // SQLITE_FCNTL_ROLLBACK_ATOMIC_WRITE - SQLite is rolling back atomic write
        22 => sqlite_wasm_rs::SQLITE_OK,
        // SQLITE_FCNTL_LOCK_TIMEOUT - SQLite is setting lock timeout
        34 => sqlite_wasm_rs::SQLITE_OK,
        // SQLITE_FCNTL_DATA_VERSION - SQLite is asking for data version
        35 => {
            if !_p_arg.is_null() {
                // Return a simple version number
                unsafe { *(_p_arg as *mut u32) = 1; }
            }
            sqlite_wasm_rs::SQLITE_OK
        }
        // For other operations, return SQLITE_NOTFOUND to indicate we don't support them
        // This allows SQLite to use fallback behavior instead of assuming we handle it
        _ => {
            #[cfg(target_arch = "wasm32")]
            vfs_log!("VFS x_file_control: Unknown op={}, returning SQLITE_NOTFOUND", op);
            sqlite_wasm_rs::SQLITE_NOTFOUND
        }
    }
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_sector_size(_p_file: *mut sqlite_wasm_rs::sqlite3_file) -> c_int {
    4096
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_device_characteristics(_p_file: *mut sqlite_wasm_rs::sqlite3_file) -> c_int {
    // IndexedDB provides atomic writes and safe append semantics
    // SQLITE_IOCAP_ATOMIC (0x00000001): All writes are atomic
    // SQLITE_IOCAP_SAFE_APPEND (0x00000200): Data is appended before file size is extended
    // SQLITE_IOCAP_SEQUENTIAL (0x00000400): Writes happen in order
    // SQLITE_IOCAP_UNDELETABLE_WHEN_OPEN (0x00000800): Files cannot be deleted when open
    // SQLITE_IOCAP_POWERSAFE_OVERWRITE (0x00001000): CRITICAL - Overwrites are atomic and power-safe
    //   This flag tells SQLite it can skip the rollback journal when journal_mode=MEMORY is set!
    0x00000001 | 0x00000200 | 0x00000400 | 0x00000800 | 0x00001000
}
