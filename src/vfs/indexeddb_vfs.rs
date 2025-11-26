use crate::DatabaseError;
#[cfg(target_arch = "wasm32")]
use crate::storage::BLOCK_SIZE;
use crate::storage::BlockStorage;
#[cfg(target_arch = "wasm32")]
use crate::storage::SyncPolicy;

#[cfg(target_arch = "wasm32")]
use std::cell::RefCell;
#[cfg(target_arch = "wasm32")]
use std::rc::Rc;

#[cfg(not(target_arch = "wasm32"))]
use std::sync::{Arc, Mutex};

#[cfg(target_arch = "wasm32")]
use std::collections::HashMap;
#[cfg(target_arch = "wasm32")]
use std::sync::OnceLock;

#[cfg(target_arch = "wasm32")]
use std::ffi::{CStr, CString};
#[cfg(target_arch = "wasm32")]
use std::os::raw::{c_char, c_int, c_void};
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
use std::cell::UnsafeCell;

#[cfg(target_arch = "wasm32")]
thread_local! {
    // Registry of per-db BlockStorage so VFS callbacks can locate storage by db name
    // CRITICAL: Uses UnsafeCell to eliminate registry access reentrancy
    // BlockStorage itself uses RefCell for interior mutability of its fields - no outer RefCell needed!
    // SAFETY: WASM is single-threaded, no concurrent access possible
    pub static STORAGE_REGISTRY: UnsafeCell<std::collections::HashMap<String, Rc<BlockStorage>>> = UnsafeCell::new(std::collections::HashMap::new());

    // Track databases currently being initialized to prevent concurrent BlockStorage::new() calls
    static INIT_IN_PROGRESS: RefCell<std::collections::HashSet<String>> = RefCell::new(std::collections::HashSet::new());
}

#[cfg(target_arch = "wasm32")]
/// Get storage from registry - no outer borrow checking needed!
/// BlockStorage uses RefCell for interior mutability of its fields
/// SAFETY: WASM is single-threaded, no concurrent access possible
pub(crate) fn try_get_storage_from_registry(db_name: &str) -> Option<Rc<BlockStorage>> {
    STORAGE_REGISTRY.with(|reg| {
        // SAFETY: WASM is single-threaded
        unsafe {
            let registry = &*reg.get();
            registry.get(db_name).cloned()
        }
    })
}

#[cfg(target_arch = "wasm32")]
/// Helper to get storage with fallback - used by Database methods
pub fn get_storage_with_fallback(db_name: &str) -> Option<Rc<BlockStorage>> {
    try_get_storage_from_registry(db_name)
}

#[cfg(target_arch = "wasm32")]
/// Helper to remove storage from registry
/// SAFETY: WASM is single-threaded, no concurrent access possible
pub fn remove_storage_from_registry(db_name: &str) {
    STORAGE_REGISTRY.with(|reg| {
        // SAFETY: WASM is single-threaded
        unsafe {
            let registry = &mut *reg.get();
            registry.remove(db_name);
            // Also remove .db variant
            if !db_name.ends_with(".db") {
                registry.remove(&format!("{}.db", db_name));
            }
        }
    });
}

#[cfg(target_arch = "wasm32")]
/// Check if storage exists in registry
/// SAFETY: WASM is single-threaded, no concurrent access possible
pub(crate) fn registry_contains_key(db_name: &str) -> bool {
    STORAGE_REGISTRY.with(|reg| {
        // SAFETY: WASM is single-threaded
        unsafe {
            let registry = &*reg.get();
            registry.contains_key(db_name)
        }
    })
}

/// Custom SQLite VFS implementation that uses IndexedDB for storage
pub struct IndexedDBVFS {
    #[cfg(target_arch = "wasm32")]
    storage: Rc<BlockStorage>,
    #[cfg(not(target_arch = "wasm32"))]
    _storage: Arc<Mutex<BlockStorage>>, // Not used in native mode (direct file I/O instead)
    #[allow(dead_code)]
    name: String,
}

impl IndexedDBVFS {
    pub async fn new(db_name: &str) -> Result<Self, DatabaseError> {
        log::info!("Creating IndexedDBVFS for database: {}", db_name);

        #[cfg(target_arch = "wasm32")]
        {
            // Loop until we either get existing storage or successfully create new one
            const MAX_WAIT_MS: u32 = 10000;
            const POLL_INTERVAL_MS: u32 = 10;
            let max_attempts = MAX_WAIT_MS / POLL_INTERVAL_MS;

            for attempt in 0..max_attempts {
                // CRITICAL: Try to atomically reserve init slot FIRST, then double-check registry
                // This prevents the race where all tasks check registry (empty), then all try to reserve
                let (reserved, existing_after_reserve) = INIT_IN_PROGRESS.with(|init| {
                    let mut set = init.borrow_mut();
                    if set.contains(db_name) {
                        // Already being initialized by another task
                        return (false, None);
                    }

                    // Not currently initializing - reserve the slot
                    set.insert(db_name.to_string());
                    drop(set); // Release mut borrow before checking registry

                    // Double-check registry in case someone registered between our last check
                    let existing = STORAGE_REGISTRY.with(|reg| {
                        // SAFETY: WASM is single-threaded
                        unsafe {
                            let registry = &*reg.get();
                            registry.get(db_name).cloned()
                        }
                    });

                    (true, existing)
                });

                if let Some(existing) = existing_after_reserve {
                    // Someone registered while we were reserving - clear our reservation and use theirs
                    INIT_IN_PROGRESS.with(|init| {
                        let mut set = init.borrow_mut();
                        set.remove(db_name);
                    });
                    log::info!("Reusing existing BlockStorage for database: {}", db_name);
                    existing.reload_cache_from_global_storage();
                    return Ok(Self {
                        storage: existing,
                        name: db_name.to_string(),
                    });
                }

                if !reserved {
                    // Someone else is initializing - wait
                    web_sys::console::log_1(
                        &format!(
                            "[VFS] {} - INIT already in progress, waiting (attempt {})",
                            db_name, attempt
                        )
                        .into(),
                    );
                    use wasm_bindgen_futures::JsFuture;
                    let promise = js_sys::Promise::new(&mut |resolve, _| {
                        web_sys::window()
                            .unwrap()
                            .set_timeout_with_callback_and_timeout_and_arguments_0(
                                &resolve,
                                POLL_INTERVAL_MS as i32,
                            )
                            .unwrap();
                    });
                    JsFuture::from(promise).await.ok();
                    continue;
                }

                // We got the reservation - create BlockStorage
                web_sys::console::log_1(
                    &format!(
                        "[VFS] {} - ACQUIRED init reservation (attempt {})",
                        db_name, attempt
                    )
                    .into(),
                );

                // We have the reservation - create BlockStorage
                log::info!("Creating new BlockStorage for database: {}", db_name);
                web_sys::console::log_1(
                    &format!("[VFS] {} - START BlockStorage::new()", db_name).into(),
                );
                let storage_result = BlockStorage::new(db_name).await;
                web_sys::console::log_1(
                    &format!("[VFS] {} - END BlockStorage::new()", db_name).into(),
                );

                let storage = storage_result?;
                let rc = Rc::new(storage);

                // Try to register - CRITICAL: Keep INIT_IN_PROGRESS set until AFTER registration
                let registration_result = STORAGE_REGISTRY.with(|reg| {
                    // SAFETY: WASM is single-threaded
                    unsafe {
                        let registry = &mut *reg.get();

                        // Check if someone else registered while we were creating
                        if let Some(winner) = registry.get(db_name).cloned() {
                            web_sys::console::log_1(
                                &format!(
                                    "[VFS] {} - Someone else registered first, using theirs",
                                    db_name
                                )
                                .into(),
                            );
                            return Err(winner); // Someone else won - use theirs
                        }

                        // We won - register ours
                        web_sys::console::log_1(
                            &format!("[VFS] {} - REGISTERED in STORAGE_REGISTRY", db_name).into(),
                        );
                        registry.insert(db_name.to_string(), rc.clone());
                        if !db_name.ends_with(".db") {
                            registry.insert(format!("{}.db", db_name), rc.clone());
                        }
                        Ok(())
                    }
                });

                // NOW clear the reservation flag AFTER registration is complete
                INIT_IN_PROGRESS.with(|init| {
                    let mut set = init.borrow_mut();
                    set.remove(db_name);
                });

                return match registration_result {
                    Ok(()) => {
                        // We successfully registered our storage
                        log::info!("Successfully registered new BlockStorage for {}", db_name);
                        Ok(Self {
                            storage: rc,
                            name: db_name.to_string(),
                        })
                    }
                    Err(winner) => {
                        // Someone else won - drop ours and use theirs
                        log::info!(
                            "Lost registration race for {}, using winner's storage",
                            db_name
                        );
                        drop(rc);
                        winner.reload_cache_from_global_storage();
                        Ok(Self {
                            storage: winner,
                            name: db_name.to_string(),
                        })
                    }
                };
            }

            // If we get here, we timed out waiting
            Err(DatabaseError::new(
                "INIT_TIMEOUT",
                "Timed out waiting for database initialization",
            ))
        }

        #[cfg(not(target_arch = "wasm32"))]
        {
            // Native: Use Arc<Mutex<>> for thread-safe Send implementation
            // Note: Storage not actually used in native mode (direct file I/O instead)
            log::info!("Creating new BlockStorage for database: {}", db_name);
            let storage = BlockStorage::new(db_name).await?;
            let arc = Arc::new(Mutex::new(storage));

            Ok(Self {
                _storage: arc,
                name: db_name.to_string(),
            })
        }
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

            // Build io_methods once - use version 2 to support WAL mode via shared memory
            let _ = IO_METHODS.get_or_init(|| sqlite_wasm_rs::sqlite3_io_methods {
                iVersion: 2, // Version 2 adds shared memory support for WAL mode
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
                // Version 2 methods - implement for WAL mode support
                xShmMap: Some(x_shm_map),
                xShmLock: Some(x_shm_lock),
                xShmBarrier: Some(x_shm_barrier),
                xShmUnmap: Some(x_shm_unmap),
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
                return Err(DatabaseError::new(
                    "SQLITE_ERROR",
                    "Failed to register custom VFS",
                ));
            }
        }

        // Native: no-op for now
        Ok(())
    }

    /// Read a block from storage synchronously (called by SQLite) - WASM only
    #[cfg(target_arch = "wasm32")]
    pub fn read_block_sync(&self, block_id: u64) -> Result<Vec<u8>, DatabaseError> {
        log::debug!("Sync read request for block: {}", block_id);

        // No outer borrow needed - BlockStorage uses RefCell for interior mutability
        self.storage.read_block_sync(block_id)
    }

    /// Write a block to storage synchronously (called by SQLite) - WASM only
    #[cfg(target_arch = "wasm32")]
    pub fn write_block_sync(&self, block_id: u64, data: Vec<u8>) -> Result<(), DatabaseError> {
        log::debug!("Sync write request for block: {}", block_id);

        // No outer borrow needed - BlockStorage uses RefCell for interior mutability
        self.storage.write_block_sync(block_id, data)
    }

    /// Synchronize all dirty blocks to IndexedDB - WASM only
    #[cfg(target_arch = "wasm32")]
    pub async fn sync(&self) -> Result<(), DatabaseError> {
        vfs_log!("{}", "=== DEBUG: VFS SYNC METHOD CALLED ===");
        log::info!("Syncing VFS storage");
        vfs_log!("{}", "DEBUG: VFS using WASM async sync path");
        let result = self.storage.sync_async().await;
        vfs_log!("{}", "DEBUG: VFS async sync completed");
        result
    }

    /// Enable periodic auto-sync with a simple interval (ms) - WASM only
    #[cfg(target_arch = "wasm32")]
    pub fn enable_auto_sync(&self, interval_ms: u64) {
        self.storage.enable_auto_sync(interval_ms);
    }

    /// Enable auto-sync with a detailed policy - WASM only
    #[cfg(target_arch = "wasm32")]
    pub fn enable_auto_sync_with_policy(&self, policy: SyncPolicy) {
        self.storage.enable_auto_sync_with_policy(policy);
    }

    /// Disable any active auto-sync - WASM only
    #[cfg(target_arch = "wasm32")]
    pub fn disable_auto_sync(&self) {
        self.storage.disable_auto_sync();
    }

    /// Drain pending dirty blocks and stop background workers - WASM only
    #[cfg(target_arch = "wasm32")]
    pub fn drain_and_shutdown(&self) {
        self.storage.drain_and_shutdown();
    }

    /// Batch read helper - WASM only
    #[cfg(target_arch = "wasm32")]
    pub fn read_blocks_sync(&self, block_ids: &[u64]) -> Result<Vec<Vec<u8>>, DatabaseError> {
        self.storage.read_blocks_sync(block_ids)
    }

    /// Batch write helper - WASM only
    #[cfg(target_arch = "wasm32")]
    pub fn write_blocks_sync(&self, items: Vec<(u64, Vec<u8>)>) -> Result<(), DatabaseError> {
        self.storage.write_blocks_sync(items)
    }

    /// Inspect current dirty block count - WASM only
    #[cfg(target_arch = "wasm32")]
    pub fn get_dirty_count(&self) -> usize {
        self.storage.get_dirty_count()
    }

    /// Inspect current cache size - WASM only
    #[cfg(target_arch = "wasm32")]
    pub fn get_cache_size(&self) -> usize {
        self.storage.get_cache_size()
    }

    /// Metrics: total syncs (native only)
    #[cfg(not(target_arch = "wasm32"))]
    pub fn get_sync_count(&self) -> u64 {
        let storage = self._storage.lock().expect("Failed to lock storage");
        storage.get_sync_count()
    }

    /// Metrics: timer-based syncs (native only)
    #[cfg(not(target_arch = "wasm32"))]
    pub fn get_timer_sync_count(&self) -> u64 {
        let storage = self._storage.lock().expect("Failed to lock storage");
        storage.get_timer_sync_count()
    }

    /// Metrics: debounce-based syncs (native only)
    #[cfg(not(target_arch = "wasm32"))]
    pub fn get_debounce_sync_count(&self) -> u64 {
        let storage = self._storage.lock().expect("Failed to lock storage");
        storage.get_debounce_sync_count()
    }

    /// Metrics: last sync duration in ms (native only)
    #[cfg(not(target_arch = "wasm32"))]
    pub fn get_last_sync_duration_ms(&self) -> u64 {
        let storage = self._storage.lock().expect("Failed to lock storage");
        storage.get_last_sync_duration_ms()
    }
}

impl Drop for IndexedDBVFS {
    fn drop(&mut self) {
        #[cfg(target_arch = "wasm32")]
        {
            self.storage.drain_and_shutdown();
        }

        #[cfg(not(target_arch = "wasm32"))]
        {
            // For native, shutdown via mutex lock
            if let Ok(mut storage) = self._storage.lock() {
                storage.drain_and_shutdown();
            }
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
    // Ephemeral files cover SQLite aux files like "-journal" only (WAL uses shared storage)
    ephemeral: bool,
    ephemeral_buf: Vec<u8>,
    // Write buffering for transaction performance (absurd-sql inspired)
    write_buffer: HashMap<u64, Vec<u8>>, // block_id -> data (O(1) lookup)
    transaction_active: bool,
    current_lock_level: i32, // Track SQLite lock level
    // Track if this is a WAL file (uses WAL_STORAGE instead of BlockStorage)
    is_wal: bool,
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
impl IndexedDBFile {
    fn new(filename: &str, ephemeral: bool, is_wal: bool) -> Self {
        Self {
            filename: filename.to_string(),
            file_size: 0,
            current_position: 0,
            ephemeral,
            ephemeral_buf: Vec::new(),
            write_buffer: HashMap::new(),
            transaction_active: false,
            current_lock_level: 0, // SQLITE_LOCK_NONE
            is_wal,
        }
    }

    /// Read data from the file at the current position
    fn read(&mut self, buffer: &mut [u8], offset: u64) -> Result<usize, DatabaseError> {
        if buffer.is_empty() {
            return Ok(0);
        }
        if self.ephemeral {
            let off = offset as usize;
            if off >= self.ephemeral_buf.len() {
                return Ok(0);
            }
            let available = self.ephemeral_buf.len() - off;
            let to_copy = std::cmp::min(available, buffer.len());
            buffer[..to_copy].copy_from_slice(&self.ephemeral_buf[off..off + to_copy]);
            self.current_position = offset + to_copy as u64;
            return Ok(to_copy);
        }

        // WAL files use dedicated WAL_STORAGE (bounded memory)
        if self.is_wal {
            return WAL_STORAGE.with(|wal| {
                let wal_map = wal.borrow();
                if let Some(wal_data) = wal_map.get(&self.filename) {
                    let off = offset as usize;
                    if off >= wal_data.len() {
                        return Ok(0);
                    }
                    let available = wal_data.len() - off;
                    let to_copy = std::cmp::min(available, buffer.len());
                    buffer[..to_copy].copy_from_slice(&wal_data[off..off + to_copy]);
                    self.current_position = offset + to_copy as u64;
                    Ok(to_copy)
                } else {
                    Ok(0) // WAL not yet created
                }
            });
        }

        // Non-WAL files use BlockStorage
        let Some(storage_rc) = try_get_storage_from_registry(&self.filename) else {
            return Err(DatabaseError::new(
                "OPEN_ERROR",
                &format!("No storage found for {}", self.filename),
            ));
        };
        let start_block = offset / BLOCK_SIZE as u64;
        let end_block = (offset + buffer.len() as u64 - 1) / BLOCK_SIZE as u64;
        let mut bytes_read = 0;
        let mut buffer_offset = 0;
        for block_id in start_block..=end_block {
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
                // Read directly from shared storage
                let block_data = storage_rc.read_block_sync(block_id)?;
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

        // WAL files use dedicated WAL_STORAGE (bounded memory, max 16MB per WAL)
        // SQLite auto-checkpoints at default ~1000 pages, but bulk inserts can exceed this
        // 16MB allows ~4000 rows of 4KB data between checkpoints
        if self.is_wal {
            const MAX_WAL_SIZE: usize = 16 * 1024 * 1024; // 16MB limit
            return WAL_STORAGE.with(|wal| {
                let mut wal_map = wal.borrow_mut();
                let wal_data = wal_map
                    .entry(self.filename.clone())
                    .or_insert_with(Vec::new);

                let end = offset as usize + data.len();
                // Enforce max size to prevent OOM with multiple concurrent databases
                if end > MAX_WAL_SIZE {
                    return Err(DatabaseError::new(
                        "WAL_TOO_LARGE",
                        &format!(
                            "WAL file {} exceeds {}MB limit (checkpoint required)",
                            self.filename,
                            MAX_WAL_SIZE / 1024 / 1024
                        ),
                    ));
                }

                if end > wal_data.len() {
                    wal_data.resize(end, 0);
                }
                wal_data[offset as usize..end].copy_from_slice(data);
                self.current_position = end as u64;
                self.file_size = std::cmp::max(self.file_size, self.current_position);
                Ok(data.len())
            });
        }

        // KEY OPTIMIZATION: Buffer writes during transactions (absurd-sql strategy)
        // CRITICAL: Only for ephemeral files. Non-ephemeral files share BlockStorage across
        // multiple connections, so buffering breaks multi-connection visibility.
        if self.transaction_active && false {
            // DISABLED for multi-connection support
            #[cfg(target_arch = "wasm32")]
            vfs_log!(
                "BUFFERED WRITE: offset={} len={} (transaction active)",
                offset,
                data.len()
            );

            let Some(storage_rc) = try_get_storage_from_registry(&self.filename) else {
                return Err(DatabaseError::new(
                    "OPEN_ERROR",
                    &format!("No storage found for {}", self.filename),
                ));
            };
            let start_block = offset / BLOCK_SIZE as u64;
            let end_block = (offset + data.len() as u64 - 1) / BLOCK_SIZE as u64;
            let mut bytes_written = 0;
            let mut data_offset = 0;
            for block_id in start_block..=end_block {
                let block_start = if block_id == start_block {
                    (offset % BLOCK_SIZE as u64) as usize
                } else {
                    0
                };
                let remaining_data = data.len() - data_offset;
                let available_space = BLOCK_SIZE - block_start;
                let copy_len = std::cmp::min(remaining_data, available_space);
                let block_end = block_start + copy_len;
                let src_end = data_offset + copy_len;

                if src_end <= data.len() && block_end <= BLOCK_SIZE {
                    // Check if this is a full block write (no need to read existing data)
                    let is_full_block_write = block_start == 0 && copy_len == BLOCK_SIZE;

                    let mut block_data = if is_full_block_write {
                        // Full block write - just use new data directly
                        data[data_offset..src_end].to_vec()
                    } else {
                        // Partial block write - check write_buffer first, then read from storage
                        let existing = if let Some(buffered) = self.write_buffer.get(&block_id) {
                            // Block was already written in this transaction, use buffered data
                            buffered.clone()
                        } else {
                            // Read from storage
                            storage_rc.read_block_sync(block_id)?
                        };
                        let mut block_data = existing;
                        block_data[block_start..block_end]
                            .copy_from_slice(&data[data_offset..src_end]);
                        block_data
                    };

                    // Ensure block is exactly BLOCK_SIZE (pad with zeros if needed)
                    if block_data.len() < BLOCK_SIZE {
                        block_data.resize(BLOCK_SIZE, 0);
                    }

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
        let Some(storage_rc) = try_get_storage_from_registry(&self.filename) else {
            return Err(DatabaseError::new(
                "OPEN_ERROR",
                &format!("No storage found for {}", self.filename),
            ));
        };
        let start_block = offset / BLOCK_SIZE as u64;
        let end_block = (offset + data.len() as u64 - 1) / BLOCK_SIZE as u64;
        let mut bytes_written = 0;
        let mut data_offset = 0;
        for block_id in start_block..=end_block {
            // Read existing block data
            let mut block_data = storage_rc.read_block_sync(block_id)?;
            let block_start = if block_id == start_block {
                (offset % BLOCK_SIZE as u64) as usize
            } else {
                0
            };
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
                        format!(
                            "{:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x}",
                            block_data[0],
                            block_data[1],
                            block_data[2],
                            block_data[3],
                            block_data[4],
                            block_data[5],
                            block_data[6],
                            block_data[7]
                        )
                    } else {
                        "short".to_string()
                    };
                    let new_data_preview = if data.len() >= data_offset + 8 {
                        format!(
                            "{:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x} {:02x}",
                            data[data_offset],
                            data[data_offset + 1],
                            data[data_offset + 2],
                            data[data_offset + 3],
                            data[data_offset + 4],
                            data[data_offset + 5],
                            data[data_offset + 6],
                            data[data_offset + 7]
                        )
                    } else {
                        "short".to_string()
                    };
                    web_sys::console::log_1(&format!("DEBUG: VFS write block {} offset={} len={} block_start={} block_end={} copy_len={} - existing: {}, new_data: {}", 
                        block_id, offset, data.len(), block_start, block_end, copy_len, existing_preview, new_data_preview).into());
                }

                block_data[block_start..block_end].copy_from_slice(&data[data_offset..src_end]);

                // Write block
                storage_rc.write_block_sync(block_id, block_data)?;
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
            Err(_) => String::from("unknown"),
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

    // Determine if this is an ephemeral file (journal only, WAL uses shared storage)
    let ephemeral = db_name.contains("-journal");
    let is_wal = db_name.contains("-wal");

    // Simple VFS open - just initialize the file structure with our methods
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    let methods_ptr = IO_METHODS.get().unwrap() as *const _;

    unsafe {
        (*vf).base.pMethods = methods_ptr;
        std::ptr::write(
            &mut (*vf).handle,
            IndexedDBFile::new(&db_name, ephemeral, is_wal),
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
                    0 // New database, size is 0
                }
            });
            (*vf).handle.file_size = calculated_size;

            #[cfg(target_arch = "wasm32")]
            vfs_log!(
                "VFS x_open_simple: Set file_size to {} for database {}",
                calculated_size,
                db_name
            );
        }
    }

    #[cfg(target_arch = "wasm32")]
    vfs_log!("{}", "VFS x_open_simple: SUCCESS");

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
        match unsafe { CStr::from_ptr(z_name) }.to_str() {
            Ok(s) => s.to_string(),
            Err(_) => String::from(""),
        }
    } else {
        String::from("")
    };
    let mut norm = name_str
        .strip_prefix("file:")
        .unwrap_or(&name_str)
        .to_string();

    #[cfg(target_arch = "wasm32")]
    vfs_log!(
        "VFS xOpen: Attempting to open file: '{}' (flags: {})",
        name_str,
        _flags
    );
    // Detect auxiliary files and map to base db
    // CRITICAL: WAL uses shared WAL_STORAGE, SHM uses shared SHARED_MEMORY
    // Only rollback journal is ephemeral (not used in WAL mode anyway)
    let mut ephemeral = false;
    let mut is_wal = false;
    for suf in ["-journal", "-wal", "-shm"].iter() {
        if norm.ends_with(suf) {
            if *suf == "-wal" {
                is_wal = true;
            }
            norm.truncate(norm.len() - suf.len());
            // Only rollback journal is ephemeral; WAL and SHM must be shared
            ephemeral = *suf == "-journal";
            break;
        }
    }
    let db_name = norm;

    // Ensure storage exists for base db - create if needed for existing databases
    let has_storage = registry_contains_key(&db_name);
    #[cfg(target_arch = "wasm32")]
    vfs_log!(
        "VFS xOpen: Checking storage for {} (ephemeral={}), has_storage={}",
        db_name,
        ephemeral,
        has_storage
    );

    if !has_storage {
        // Check if this database has existing data in global storage
        use crate::storage::vfs_sync::{with_global_commit_marker, with_global_storage};
        let has_existing_data = with_global_storage(|gs| gs.borrow().contains_key(&db_name))
            || with_global_commit_marker(|cm| cm.borrow().contains_key(&db_name));

        if has_existing_data {
            // Auto-register storage for existing database
            #[cfg(target_arch = "wasm32")]
            vfs_log!(
                "VFS xOpen: Auto-registering storage for existing database: {}",
                db_name
            );

            // Create BlockStorage synchronously for existing database
            let storage = BlockStorage::new_sync(&db_name);
            let rc = Rc::new(storage);
            STORAGE_REGISTRY.with(|reg| {
                // SAFETY: WASM is single-threaded
                unsafe {
                    let registry = &mut *reg.get();
                    registry.insert(db_name.clone(), rc);
                }
            });
        } else {
            log::error!(
                "xOpen: no storage registered for base db '{}' and no existing data found. Call IndexedDBVFS::new(db).await first.",
                db_name
            );
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
            IndexedDBFile::new(&db_name, ephemeral, is_wal),
        );

        // For non-ephemeral files, calculate and set correct file size based on existing data
        if !ephemeral {
            use crate::storage::vfs_sync::with_global_storage;

            // Normalize db_name: blocks may be stored under "name" or "name.db"
            let normalized_name = if db_name.ends_with(".db") {
                &db_name[..db_name.len() - 3]
            } else {
                &db_name
            };

            // Check both with and without .db suffix
            let has_existing_blocks = with_global_storage(|gs| {
                let storage = gs.borrow();
                storage
                    .get(normalized_name)
                    .map(|db| !db.is_empty())
                    .unwrap_or(false)
                    || storage
                        .get(&db_name)
                        .map(|db| !db.is_empty())
                        .unwrap_or(false)
            });

            if has_existing_blocks {
                let max_block_id = with_global_storage(|gs| {
                    let storage = gs.borrow();
                    storage
                        .get(normalized_name)
                        .or_else(|| storage.get(&db_name))
                        .map(|db| db.keys().max().copied().unwrap_or(0))
                        .unwrap_or(0)
                });

                // SQLite uses 4KB blocks, so file_size is (max_block_id + 1) * 4096
                let calculated_size = (max_block_id + 1) * 4096;
                (*vf).handle.file_size = calculated_size;

                #[cfg(target_arch = "wasm32")]
                vfs_log!(
                    "VFS xOpen: Set file_size to {} for existing database {} (max_block_id={})",
                    calculated_size,
                    db_name,
                    max_block_id
                );
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
    vfs_log!("{}", "VFS x_close_stub: called");
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
                for b in &mut slice[n..] {
                    *b = 0;
                }
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
unsafe extern "C" fn x_truncate_stub(
    p_file: *mut sqlite_wasm_rs::sqlite3_file,
    size: i64,
) -> c_int {
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    let vf_ref = unsafe { &*vf };

    #[cfg(target_arch = "wasm32")]
    vfs_log!(
        "VFS x_truncate_stub: truncating {} to size {}",
        vf_ref.handle.filename,
        size
    );

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
    let last_block = if new_size == 0 {
        0
    } else {
        (new_size - 1) / 4096
    };
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
unsafe extern "C" fn x_sync_stub(
    p_file: *mut sqlite_wasm_rs::sqlite3_file,
    _flags: c_int,
) -> c_int {
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    let vf_ref = unsafe { &*vf };

    // Skip sync for ephemeral auxiliary files (WAL, journal, etc.)
    if vf_ref.handle.ephemeral {
        #[cfg(target_arch = "wasm32")]
        vfs_log!("{}", "VFS x_sync_stub: skipping ephemeral file");
        return sqlite_wasm_rs::SQLITE_OK;
    }

    // For main database files, perform sync to advance commit marker and trigger persistence
    // Sync logging removed for performance
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_file_size_stub(
    p_file: *mut sqlite_wasm_rs::sqlite3_file,
    p_size: *mut i64,
) -> c_int {
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
unsafe extern "C" fn x_lock_stub(
    _p_file: *mut sqlite_wasm_rs::sqlite3_file,
    _lock_type: c_int,
) -> c_int {
    // vfs_log!("VFS x_lock_stub: lock_type={}", _lock_type);
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_unlock_stub(
    _p_file: *mut sqlite_wasm_rs::sqlite3_file,
    _lock_type: c_int,
) -> c_int {
    // vfs_log!("VFS x_unlock_stub: lock_type={}", _lock_type);
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_check_reserved_lock_stub(
    _p_file: *mut sqlite_wasm_rs::sqlite3_file,
    p_res_out: *mut c_int,
) -> c_int {
    #[cfg(target_arch = "wasm32")]
    vfs_log!("{}", "VFS x_check_reserved_lock_stub: called");
    unsafe {
        *p_res_out = 0;
    }
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_file_control_stub(
    _p_file: *mut sqlite_wasm_rs::sqlite3_file,
    _op: c_int,
    _p_arg: *mut c_void,
) -> c_int {
    #[cfg(target_arch = "wasm32")]
    vfs_log!("VFS x_file_control_stub: op={}", _op);
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_sector_size_stub(_p_file: *mut sqlite_wasm_rs::sqlite3_file) -> c_int {
    #[cfg(target_arch = "wasm32")]
    vfs_log!("{}", "VFS x_sector_size_stub: called");
    4096
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_device_characteristics_stub(
    _p_file: *mut sqlite_wasm_rs::sqlite3_file,
) -> c_int {
    #[cfg(target_arch = "wasm32")]
    vfs_log!("{}", "VFS x_device_characteristics_stub: called");
    0
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_close(_p_file: *mut sqlite_wasm_rs::sqlite3_file) -> c_int {
    let vf: *mut VfsFile = unsafe { file_from_ptr(_p_file) };

    #[cfg(target_arch = "wasm32")]
    vfs_log!("{}", "VFS x_close: called");

    // Reload the cache from GLOBAL_STORAGE so next connection sees fresh data
    unsafe {
        if let Some(storage_rc) = try_get_storage_from_registry(&(*vf).handle.filename) {
            storage_rc.reload_cache_from_global_storage();
            #[cfg(target_arch = "wasm32")]
            vfs_log!(
                "VFS x_close: reloaded cache from GLOBAL_STORAGE for {}",
                (*vf).handle.filename
            );
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

    // CRITICAL DEBUG: Log ALL reads during database open
    #[cfg(target_arch = "wasm32")]
    {
        let block_id = offset / 4096;
        let page_id = offset / 4096;
        web_sys::console::log_1(
            &format!(
                "[VFS x_read] offset={}, amt={}, page={}, block={}",
                offset, amt, page_id, block_id
            )
            .into(),
        );
    }

    let res = unsafe { (*vf).handle.read(slice, offset as u64) };
    match res {
        Ok(n) => {
            // CRITICAL DEBUG: Check what data was actually read
            #[cfg(target_arch = "wasm32")]
            {
                let block_id = offset / 4096;
                web_sys::console::log_1(
                    &format!(
                        "[VFS x_read] SUCCESS - read {} bytes from block {}",
                        n, block_id
                    )
                    .into(),
                );

                if offset == 0 && n >= 16 {
                    let header_valid = &slice[0..16] == b"SQLite format 3\0";
                    web_sys::console::log_1(
                        &format!(
                            "[VFS x_read] Block 0 header valid: {}, bytes: {:02x?}",
                            header_valid,
                            &slice[0..16]
                        )
                        .into(),
                    );
                    if n >= 100 {
                        web_sys::console::log_1(
                            &format!("[VFS x_read] Block 0 bytes[28-39]: {:02x?}", &slice[28..40])
                                .into(),
                        );
                        web_sys::console::log_1(
                            &format!("[VFS x_read] Block 0 bytes[40-60]: {:02x?}", &slice[40..60])
                                .into(),
                        );
                        web_sys::console::log_1(
                            &format!("[VFS x_read] Block 0 bytes[60-80]: {:02x?}", &slice[60..80])
                                .into(),
                        );
                        web_sys::console::log_1(
                            &format!(
                                "[VFS x_read] Block 0 bytes[80-100]: {:02x?}",
                                &slice[80..100]
                            )
                            .into(),
                        );
                    }
                }
            }

            // If short read, zero-fill the remainder per SQLite contract
            if n < amt as usize {
                for b in &mut slice[n..] {
                    *b = 0;
                }
            }
            // Always return OK for successful reads, even if short
            sqlite_wasm_rs::SQLITE_OK
        }
        Err(e) => {
            #[cfg(target_arch = "wasm32")]
            {
                let block_id = offset / 4096;
                let page_id = offset / 4096;
                web_sys::console::log_1(
                    &format!(
                        "[VFS x_read] ERROR reading page {} (block {}) at offset {}: {:?}",
                        page_id, block_id, offset, e
                    )
                    .into(),
                );
                web_sys::console::log_1(
                    &format!(
                        "[VFS x_read] Requested {} bytes from offset {}",
                        amt, offset
                    )
                    .into(),
                );
            }
            sqlite_wasm_rs::SQLITE_IOERR_READ
        }
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
    vfs_log!(
        "VFS x_write: offset={} amt={} ephemeral={}",
        offset,
        amt,
        unsafe { (*vf).handle.ephemeral }
    );

    let res = unsafe { (*vf).handle.write(slice, offset as u64) };
    match res {
        Ok(_n) => {
            vfs_log!("VFS x_write: SUCCESS wrote {} bytes", _n);
            sqlite_wasm_rs::SQLITE_OK
        }
        Err(_e) => {
            vfs_log!("VFS x_write: ERROR {:?}", _e);
            sqlite_wasm_rs::SQLITE_IOERR_WRITE
        }
    }
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_truncate(p_file: *mut sqlite_wasm_rs::sqlite3_file, size: i64) -> c_int {
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    unsafe {
        #[cfg(target_arch = "wasm32")]
        vfs_log!(
            "VFS x_truncate: size={} ephemeral={}",
            size,
            (*vf).handle.ephemeral
        );

        if (*vf).handle.ephemeral {
            let new_len = size as usize;
            if new_len < (*vf).handle.ephemeral_buf.len() {
                (*vf).handle.ephemeral_buf.truncate(new_len);
            } else if new_len > (*vf).handle.ephemeral_buf.len() {
                (*vf).handle.ephemeral_buf.resize(new_len, 0);
            }
            (*vf).handle.file_size = size as u64;
        } else if (*vf).handle.is_wal {
            // WAL file truncate - actually truncate WAL_STORAGE
            let new_len = size as usize;
            WAL_STORAGE.with(|wal| {
                let mut wal_map = wal.borrow_mut();
                if let Some(wal_data) = wal_map.get_mut(&(*vf).handle.filename) {
                    if new_len < wal_data.len() {
                        wal_data.truncate(new_len);
                    } else if new_len > wal_data.len() {
                        wal_data.resize(new_len, 0);
                    }
                }
            });
            (*vf).handle.file_size = size as u64;
        } else {
            // Non-ephemeral non-WAL file (main DB, SHM) - update size
            // Blocks beyond new size remain in storage but are ignored during reads
            // This is more efficient than deleting blocks, and SQLite will overwrite them later
            let new_size = size as u64;

            #[cfg(target_arch = "wasm32")]
            if new_size < (*vf).handle.file_size {
                vfs_log!(
                    "VFS x_truncate: {} truncated from {} to {} bytes",
                    (*vf).handle.filename,
                    (*vf).handle.file_size,
                    new_size
                );
            }

            (*vf).handle.file_size = new_size;
        }
    }
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_sync(p_file: *mut sqlite_wasm_rs::sqlite3_file, _flags: c_int) -> c_int {
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    let vf_ref = unsafe { &*vf };

    // Skip sync for ephemeral auxiliary files (rollback journal only now)
    if vf_ref.handle.ephemeral {
        return sqlite_wasm_rs::SQLITE_OK;
    }

    // For main database files, advance commit marker in memory
    // For WAL/SHM files, this is a no-op (they're already in shared BlockStorage)
    // Don't persist to IndexedDB on every sync - that's too slow
    // Auto-sync will handle periodic persistence
    let db_name = &vf_ref.handle.filename;

    // Only advance commit marker for main database file (not WAL or SHM)
    if !db_name.ends_with("-wal") && !db_name.ends_with("-shm") {
        use crate::storage::vfs_sync::with_global_commit_marker;
        with_global_commit_marker(|cm| {
            let current = cm.borrow().get(db_name).copied().unwrap_or(0);
            cm.borrow_mut().insert(db_name.to_string(), current + 1);
        });
    }

    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_file_size(
    p_file: *mut sqlite_wasm_rs::sqlite3_file,
    p_size: *mut i64,
) -> c_int {
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
    let name_str = if !_z_name.is_null() {
        match unsafe { std::ffi::CStr::from_ptr(_z_name) }.to_str() {
            Ok(s) => s.to_string(),
            Err(_) => String::from(""),
        }
    } else {
        String::from("")
    };

    vfs_log!("VFS x_delete: file='{}'", name_str);

    // Clean up WAL_STORAGE if deleting a WAL file
    if name_str.ends_with("-wal") {
        let db_name = name_str.strip_suffix("-wal").unwrap_or(&name_str);
        WAL_STORAGE.with(|wal| {
            let mut wal_map = wal.borrow_mut();
            wal_map.remove(db_name);
        });
        vfs_log!("VFS x_delete: removed WAL storage for {}", db_name);
    }

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
        match unsafe { CStr::from_ptr(z_name) }.to_str() {
            Ok(s) => s.to_string(),
            Err(_) => String::from(""),
        }
    } else {
        String::from("")
    };
    let mut norm = name_str
        .strip_prefix("file:")
        .unwrap_or(&name_str)
        .to_string();

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
    let exists = if name_str.ends_with("-journal")
        || name_str.ends_with("-wal")
        || name_str.ends_with("-shm")
    {
        // Auxiliary files are ephemeral and should be reported as not existing
        // unless they are actually open in the registry
        false
    } else {
        // For main database files, check if they exist in storage
        STORAGE_REGISTRY.with(|reg| {
            // SAFETY: WASM is single-threaded
            unsafe {
                let registry = &*reg.get();
                registry.contains_key(&db_name)
            }
        }) || with_global_storage(|gs| {
            gs.borrow()
                .get(&db_name)
                .map(|db| !db.is_empty())
                .unwrap_or(false)
        })
    };

    #[cfg(target_arch = "wasm32")]
    vfs_log!(
        "VFS x_access: file='{}' db_name='{}' exists={}",
        name_str,
        db_name,
        exists
    );

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
    if z_name.is_null() || z_out.is_null() || n_out <= 0 {
        return sqlite_wasm_rs::SQLITE_ERROR;
    }
    let src = unsafe { CStr::from_ptr(z_name) };
    let bytes = src.to_bytes();
    let to_copy = std::cmp::min(bytes.len(), (n_out - 1) as usize);
    unsafe {
        std::ptr::copy_nonoverlapping(bytes.as_ptr(), z_out as *mut u8, to_copy);
    }
    unsafe {
        *z_out.add(to_copy) = 0;
    }
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
            vfs_log!("{}", "TRANSACTION STARTED: Write buffering activated");
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
            vfs_log!(
                "TRANSACTION COMMIT: Flushing {} buffered writes to memory",
                (*vf).handle.write_buffer.len()
            );

            // Flush all buffered writes to GLOBAL_STORAGE (in-memory)
            if let Some(storage_rc) = try_get_storage_from_registry(&(*vf).handle.filename) {
                for (block_id, block_data) in (*vf).handle.write_buffer.drain() {
                    // Write buffered block to GLOBAL_STORAGE (memory only)
                    if let Err(_e) = storage_rc.write_block_sync(block_id, block_data) {
                        vfs_log!("ERROR flushing block {}: {:?}", block_id, _e);
                    }
                }

                // Clear the cache so subsequent reads see the fresh data
                storage_rc.clear_cache();

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
unsafe extern "C" fn x_check_reserved_lock(
    _p_file: *mut sqlite_wasm_rs::sqlite3_file,
    p_res_out: *mut c_int,
) -> c_int {
    unsafe {
        *p_res_out = 0;
    }
    sqlite_wasm_rs::SQLITE_OK
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_file_control(
    _p_file: *mut sqlite_wasm_rs::sqlite3_file,
    op: c_int,
    _p_arg: *mut c_void,
) -> c_int {
    vfs_log!("VFS x_file_control: op={}", op);

    // Handle specific file control operations that SQLite expects
    match op {
        // SQLITE_FCNTL_LOCKSTATE - SQLite is asking for lock state
        10 => {
            if !_p_arg.is_null() {
                // Return "no locks held" (0)
                unsafe {
                    *(_p_arg as *mut c_int) = 0;
                }
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
                unsafe {
                    *(_p_arg as *mut u32) = 1;
                }
            }
            sqlite_wasm_rs::SQLITE_OK
        }
        // For other operations, return SQLITE_NOTFOUND to indicate we don't support them
        // This allows SQLite to use fallback behavior instead of assuming we handle it
        _ => {
            #[cfg(target_arch = "wasm32")]
            vfs_log!(
                "VFS x_file_control: Unknown op={}, returning SQLITE_NOTFOUND",
                op
            );
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

// Shared memory support for WAL mode
// Global shared memory regions stored per database
// Use Box to ensure stable heap pointers that don't move on reallocation
#[cfg(target_arch = "wasm32")]
thread_local! {
    static SHARED_MEMORY: std::cell::RefCell<std::collections::HashMap<String, Box<Vec<u8>>>> =
        std::cell::RefCell::new(std::collections::HashMap::new());
    // Track locks with (owner_pointer, flags) to allow same connection to reacquire but block others
    static SHARED_LOCKS: std::cell::RefCell<std::collections::HashMap<String, (usize, i32)>> =
        std::cell::RefCell::new(std::collections::HashMap::new());
    // Shared WAL storage - simple Vec<u8> per database, max 8MB per WAL
    // This is separate from BlockStorage to control memory usage
    static WAL_STORAGE: std::cell::RefCell<std::collections::HashMap<String, Vec<u8>>> =
        std::cell::RefCell::new(std::collections::HashMap::new());
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_shm_map(
    p_file: *mut sqlite_wasm_rs::sqlite3_file,
    i_region: c_int,
    sz_region: c_int,
    _b_extend: c_int,
    pp: *mut *mut c_void,
) -> c_int {
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    let _vf_ref = unsafe { &*vf };
    let db_name = &_vf_ref.handle.filename;

    vfs_log!(
        "VFS xShmMap: region={} size={} extend={} for {}",
        i_region,
        sz_region,
        _b_extend,
        db_name
    );

    // Ensure shared memory exists for this database
    let result = SHARED_MEMORY.with(|shm| {
        let mut shm_map = shm.borrow_mut();
        let key = format!("{}_region_{}", db_name, i_region);

        let entry = shm_map.entry(key).or_insert_with(|| {
            vfs_log!("Creating shared memory region {} for {}", i_region, db_name);
            // Allocate WAL shared memory: standard size is 32KB, but allocate what's requested
            // CRITICAL: Use with_capacity and then resize to ensure stable pointer
            // The capacity ensures the Vec won't reallocate on the resize
            let size = std::cmp::max(sz_region as usize, 32 * 1024);
            let mut vec = Vec::with_capacity(size);
            vec.resize(size, 0);
            Box::new(vec)
        });

        // Never resize after creation - this would invalidate pointers returned to SQLite
        if entry.len() < sz_region as usize {
            vfs_log!(
                "ERROR: Shared memory region {} too small ({} < {})",
                i_region,
                entry.len(),
                sz_region
            );
            return sqlite_wasm_rs::SQLITE_ERROR;
        }

        // Return pointer to the shared memory region
        // The Box keeps the Vec at a stable location
        unsafe {
            *pp = entry.as_mut_ptr() as *mut c_void;
        }
        sqlite_wasm_rs::SQLITE_OK
    });

    result
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_shm_lock(
    p_file: *mut sqlite_wasm_rs::sqlite3_file,
    offset: c_int,
    _n: c_int,
    flags: c_int,
) -> c_int {
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    let vf_ref = unsafe { &*vf };
    let db_name = &vf_ref.handle.filename;

    // SQLITE_SHM_LOCK = 2, SQLITE_SHM_SHARED = 4, SQLITE_SHM_EXCLUSIVE = 8, SQLITE_SHM_UNLOCK = 1
    let _lock_type = if (flags & 8) != 0 {
        "EXCLUSIVE"
    } else if (flags & 4) != 0 {
        "SHARED"
    } else if (flags & 2) != 0 {
        "PENDING"
    } else if (flags & 1) != 0 {
        "UNLOCK"
    } else {
        "NONE"
    };

    vfs_log!(
        "VFS xShmLock: offset={} n={} flags={} ({}) for {}",
        offset,
        _n,
        flags,
        _lock_type,
        db_name
    );

    // CRITICAL: Even in single-threaded JS, async tasks create concurrency
    // Multiple Database instances (separate sqlite3* handles) can access same BlockStorage
    // Must enforce mutual exclusion to prevent WAL corruption
    let file_ptr = p_file as usize;

    SHARED_LOCKS.with(|locks| -> c_int {
        let mut lock_map = locks.borrow_mut();
        let key = format!("{}_{}", db_name, offset);

        if (flags & 1) != 0 {  // UNLOCK
            // Only unlock if this connection owns the lock
            if let Some(&(owner, _)) = lock_map.get(&key) {
                if owner == file_ptr {
                    lock_map.remove(&key);
                }
            }
            return sqlite_wasm_rs::SQLITE_OK;
        }

        // Check for conflicting locks held by OTHER connections
        if let Some(&(owner, existing_flags)) = lock_map.get(&key) {
            if owner != file_ptr {
                // Different connection holds the lock
                // SQLITE_SHM_LOCK=2, SQLITE_SHM_SHARED=4, SQLITE_SHM_EXCLUSIVE=8
                let is_lock_request = (flags & 2) != 0;
                let is_shared_request = (flags & 4) != 0;
                let is_exclusive_request = (flags & 8) != 0;

                let is_lock_held = (existing_flags & 2) != 0;
                let is_shared_held = (existing_flags & 4) != 0;
                let is_exclusive_held = (existing_flags & 8) != 0;

                // EXCLUSIVE conflicts with ANY existing lock
                // SHARED conflicts with EXCLUSIVE
                // LOCK conflicts with EXCLUSIVE
                if is_exclusive_request {
                    if is_lock_held || is_shared_held || is_exclusive_held {
                        vfs_log!("VFS xShmLock: BLOCKED at offset {} - owner={:x} holder={:x} existing={} requested={}", 
                                 offset, file_ptr, owner, existing_flags, flags);
                        return sqlite_wasm_rs::SQLITE_BUSY;
                    }
                } else if is_exclusive_held {
                    if is_lock_request || is_shared_request {
                        vfs_log!("VFS xShmLock: BLOCKED at offset {} - owner={:x} holder={:x} existing={} requested={}", 
                                 offset, file_ptr, owner, existing_flags, flags);
                        return sqlite_wasm_rs::SQLITE_BUSY;
                    }
                }
            }
            // Same connection can upgrade/downgrade its own lock
        }

        lock_map.insert(key, (file_ptr, flags));
        sqlite_wasm_rs::SQLITE_OK
    })
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_shm_barrier(p_file: *mut sqlite_wasm_rs::sqlite3_file) {
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    let _vf_ref = unsafe { &*vf };
    vfs_log!("VFS xShmBarrier for {}", _vf_ref.handle.filename);

    // Memory barrier - in single-threaded JavaScript this is a no-op
    // But we'll add it for completeness
    std::sync::atomic::compiler_fence(std::sync::atomic::Ordering::SeqCst);
}

#[cfg(target_arch = "wasm32")]
#[allow(dead_code)]
unsafe extern "C" fn x_shm_unmap(
    p_file: *mut sqlite_wasm_rs::sqlite3_file,
    delete_flag: c_int,
) -> c_int {
    let vf: *mut VfsFile = unsafe { file_from_ptr(p_file) };
    let vf_ref = unsafe { &*vf };
    let db_name = &vf_ref.handle.filename;

    vfs_log!("VFS xShmUnmap: delete={} for {}", delete_flag, db_name);

    if delete_flag != 0 {
        // Delete all shared memory regions for this database
        SHARED_MEMORY.with(|shm| {
            let mut shm_map = shm.borrow_mut();
            shm_map.retain(|k, _| !k.starts_with(db_name));
        });

        SHARED_LOCKS.with(|locks| {
            let mut lock_map = locks.borrow_mut();
            lock_map.retain(|k, _| !k.starts_with(db_name));
        });

        vfs_log!("Deleted all shared memory regions for {}", db_name);
    }

    sqlite_wasm_rs::SQLITE_OK
}
