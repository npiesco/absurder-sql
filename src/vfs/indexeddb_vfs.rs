use crate::storage::BlockStorage;
use crate::storage::SyncPolicy;
#[cfg(target_arch = "wasm32")]
use crate::storage::BLOCK_SIZE;
use crate::types::DatabaseError;
use std::cell::RefCell;
#[cfg(target_arch = "wasm32")]
use std::ffi::{CStr, CString};
#[cfg(target_arch = "wasm32")]
use std::mem::size_of;
#[cfg(target_arch = "wasm32")]
use std::os::raw::{c_char, c_int, c_void};
use std::rc::Rc;
#[cfg(target_arch = "wasm32")]
use std::sync::OnceLock;

#[cfg(target_arch = "wasm32")]
thread_local! {
    // Registry of per-db BlockStorage so VFS callbacks can locate storage by db name
    static STORAGE_REGISTRY: RefCell<std::collections::HashMap<String, Rc<RefCell<BlockStorage>>>> = RefCell::new(std::collections::HashMap::new());
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
        
        let storage = BlockStorage::new(db_name).await?;
        
        let rc = Rc::new(RefCell::new(storage));
        #[cfg(target_arch = "wasm32")]
        STORAGE_REGISTRY.with(|reg| {
            reg.borrow_mut().insert(db_name.to_string(), rc.clone());
        });

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

            // Build io_methods once
            let _ = IO_METHODS.get_or_init(|| sqlite_wasm_rs::sqlite3_io_methods {
                iVersion: 3,
                xClose: Some(x_close),
                xRead: Some(x_read),
                xWrite: Some(x_write),
                xTruncate: Some(x_truncate),
                xSync: Some(x_sync),
                xFileSize: Some(x_file_size),
                // Provide stubs for required methods in single-process WASM
                xLock: Some(x_lock),
                xUnlock: Some(x_unlock),
                xCheckReservedLock: Some(x_check_reserved_lock),
                xFileControl: Some(x_file_control),
                xSectorSize: Some(x_sector_size),
                xDeviceCharacteristics: Some(x_device_characteristics),
                xShmMap: None,
                xShmLock: None,
                xShmBarrier: None,
                xShmUnmap: None,
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
            let block_data = storage_rc.borrow_mut().read_block_sync(block_id)?;
            let block_start = if block_id == start_block { (offset % BLOCK_SIZE as u64) as usize } else { 0 };
            let block_end = if block_id == end_block { let remaining = buffer.len() - buffer_offset; std::cmp::min(BLOCK_SIZE, block_start + remaining) } else { BLOCK_SIZE };
            let copy_len = block_end - block_start;
            let dest_end = buffer_offset + copy_len;
            if dest_end <= buffer.len() {
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
        let storage_rc = STORAGE_REGISTRY.with(|reg| reg.borrow().get(&self.filename).cloned());
        let Some(storage_rc) = storage_rc else {
            return Err(DatabaseError::new("OPEN_ERROR", &format!("No storage found for {}", self.filename)));
        };
        let start_block = offset / BLOCK_SIZE as u64;
        let end_block = (offset + data.len() as u64 - 1) / BLOCK_SIZE as u64;
        let mut bytes_written = 0;
        let mut data_offset = 0;
        for block_id in start_block..=end_block {
            let mut block_data = storage_rc.borrow_mut().read_block_sync(block_id)?;
            let block_start = if block_id == start_block { (offset % BLOCK_SIZE as u64) as usize } else { 0 };
            let block_end = if block_id == end_block { let remaining = data.len() - data_offset; std::cmp::min(BLOCK_SIZE, block_start + remaining) } else { BLOCK_SIZE };
            let copy_len = block_end - block_start;
            let src_end = data_offset + copy_len;
            if src_end <= data.len() {
                block_data[block_start..block_end].copy_from_slice(&data[data_offset..src_end]);
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

    // Ensure storage exists for base db (created via IndexedDBVFS::new), otherwise error
    let has_storage = STORAGE_REGISTRY.with(|reg| reg.borrow().contains_key(&db_name));
    if !has_storage {
        log::error!("xOpen: no storage registered for base db '{}'. Call IndexedDBVFS::new(db).await first.", db_name);
        return sqlite_wasm_rs::SQLITE_CANTOPEN;
    }

    // Initialize our VfsFile in the buffer provided by SQLite
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    let methods_ptr = IO_METHODS.get().unwrap() as *const _;
    unsafe {
        std::ptr::write(
            vf,
            VfsFile {
                base: sqlite_wasm_rs::sqlite3_file { pMethods: methods_ptr },
                handle: IndexedDBFile::new(&db_name, ephemeral),
            },
        );
    }
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
unsafe extern "C" fn x_close(p_file: *mut sqlite_wasm_rs::sqlite3_file) -> c_int {
    // Drop our VfsFile in place
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    unsafe { std::ptr::drop_in_place(vf); }
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
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
                sqlite_wasm_rs::SQLITE_IOERR_SHORT_READ
            } else {
                sqlite_wasm_rs::SQLITE_OK
            }
        }
        Err(_) => sqlite_wasm_rs::SQLITE_IOERR,    
    }
}

#[cfg(target_arch = "wasm32")]
unsafe extern "C" fn x_write(
    p_file: *mut sqlite_wasm_rs::sqlite3_file,
    buf: *const c_void,
    amt: c_int,
    offset: i64,
) -> c_int {
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    let slice = unsafe { std::slice::from_raw_parts(buf as *const u8, amt as usize) };
    let res = unsafe { (*vf).handle.write(slice, offset as u64) };
    match res {
        Ok(_n) => sqlite_wasm_rs::SQLITE_OK,
        Err(_) => sqlite_wasm_rs::SQLITE_IOERR,
    }
}

#[cfg(target_arch = "wasm32")]
unsafe extern "C" fn x_truncate(p_file: *mut sqlite_wasm_rs::sqlite3_file, size: i64) -> c_int {
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    unsafe {
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
unsafe extern "C" fn x_sync(p_file: *mut sqlite_wasm_rs::sqlite3_file, _flags: c_int) -> c_int {
    // No-op for commit marker advancement. We only advance the commit marker
    // via explicit IndexedDBVFS::sync(), which enforces cross-instance
    // visibility gating until an application-controlled sync occurs.
    // For ephemeral aux files, this remains a no-op as well.
    let _vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
unsafe extern "C" fn x_file_size(p_file: *mut sqlite_wasm_rs::sqlite3_file, p_size: *mut i64) -> c_int {
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    unsafe {
        let sz = if (*vf).handle.ephemeral {
            (*vf).handle.ephemeral_buf.len() as i64
        } else {
            (*vf).handle.file_size as i64
        };
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
    // Nothing to delete in our model; journals/WAL are ephemeral.
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
unsafe extern "C" fn x_access(
    _p_vfs: *mut sqlite_wasm_rs::sqlite3_vfs,
    _z_name: *const c_char,
    _flags: c_int,
    p_res_out: *mut c_int,
) -> c_int {
    // Report "not exists" by default; SQLite will create as needed.
    unsafe { *p_res_out = 0; }
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
unsafe extern "C" fn x_lock(_p_file: *mut sqlite_wasm_rs::sqlite3_file, _e_lock: c_int) -> c_int {
    // No-op locking in single-threaded WASM
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
unsafe extern "C" fn x_unlock(_p_file: *mut sqlite_wasm_rs::sqlite3_file, _e_lock: c_int) -> c_int {
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
unsafe extern "C" fn x_check_reserved_lock(_p_file: *mut sqlite_wasm_rs::sqlite3_file, p_res_out: *mut c_int) -> c_int {
    unsafe { *p_res_out = 0; }
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
unsafe extern "C" fn x_file_control(_p_file: *mut sqlite_wasm_rs::sqlite3_file, _op: c_int, _p_arg: *mut c_void) -> c_int {
    // Not supported; report as OK/no-op
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
unsafe extern "C" fn x_sector_size(_p_file: *mut sqlite_wasm_rs::sqlite3_file) -> c_int {
    4096
}

#[cfg(target_arch = "wasm32")]
unsafe extern "C" fn x_device_characteristics(_p_file: *mut sqlite_wasm_rs::sqlite3_file) -> c_int {
    0
}
