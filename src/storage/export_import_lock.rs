//! Export/Import Operation Locking
//! 
//! Provides per-database locking to serialize export/import operations and prevent
//! concurrent access that could lead to data corruption or `BorrowMutError` panics.

use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use crate::types::DatabaseError;

const LOCK_TIMEOUT_RETRIES: u32 = 3000; // 3000 retries * 10ms = 30 seconds max wait

/// Represents a lock for a specific database's export/import operations
struct ExportImportLock {
    /// Whether the lock is currently held
    locked: bool,
}

impl ExportImportLock {
    fn new() -> Self {
        Self {
            locked: false,
        }
    }
    
    /// Try to acquire the lock. Returns true if successful.
    fn try_acquire(&mut self) -> bool {
        if !self.locked {
            self.locked = true;
            true
        } else {
            false
        }
    }
    
    /// Release the lock
    fn release(&mut self) {
        self.locked = false;
    }
}

thread_local! {
    /// Global registry of per-database export/import locks
    static EXPORT_IMPORT_LOCKS: RefCell<HashMap<String, Rc<RefCell<ExportImportLock>>>> = 
        RefCell::new(HashMap::new());
}

/// Acquire export/import lock for a database
/// 
/// This will block (via polling) until the lock is available or timeout is reached.
/// 
/// # Arguments
/// * `db_name` - Name of the database to lock
/// 
/// # Returns
/// * `Ok(LockGuard)` - Lock acquired successfully
/// * `Err(DatabaseError)` - Failed to acquire lock (timeout)
pub async fn acquire_export_import_lock(db_name: &str) -> Result<LockGuard, DatabaseError> {
    let db_name_owned = db_name.to_string();
    let mut retries = 0u32;
    
    loop {
        // Try to acquire the lock
        let acquired = EXPORT_IMPORT_LOCKS.with(|locks| {
            let mut locks_map = locks.borrow_mut();
            let lock_rc = locks_map
                .entry(db_name_owned.clone())
                .or_insert_with(|| Rc::new(RefCell::new(ExportImportLock::new())));
            
            let mut lock = lock_rc.borrow_mut();
            lock.try_acquire()
        });
        
        if acquired {
            log::debug!("Acquired export/import lock for: {}", db_name);
            return Ok(LockGuard {
                db_name: db_name_owned,
            });
        }
        
        // Check timeout
        retries += 1;
        if retries >= LOCK_TIMEOUT_RETRIES {
            return Err(DatabaseError::new(
                "LOCK_TIMEOUT",
                &format!("Failed to acquire export/import lock for {} after {} seconds", 
                        db_name, LOCK_TIMEOUT_RETRIES * 10 / 1000)
            ));
        }
        
        // Wait a bit before retrying
        #[cfg(target_arch = "wasm32")]
        {
            // Use setTimeout to yield to browser event loop
            let promise = js_sys::Promise::new(&mut |resolve, _reject| {
                web_sys::window()
                    .unwrap()
                    .set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, 10)
                    .unwrap();
            });
            wasm_bindgen_futures::JsFuture::from(promise).await.ok();
        }
        
        #[cfg(not(target_arch = "wasm32"))]
        {
            use std::time::Duration;
            tokio::time::sleep(Duration::from_millis(10)).await;
        }
    }
}

/// RAII guard that automatically releases the lock when dropped
pub struct LockGuard {
    db_name: String,
}

impl Drop for LockGuard {
    fn drop(&mut self) {
        // Release the lock
        EXPORT_IMPORT_LOCKS.with(|locks| {
            let locks_map = locks.borrow();
            if let Some(lock_rc) = locks_map.get(&self.db_name) {
                let mut lock = lock_rc.borrow_mut();
                lock.release();
                log::debug!("Released export/import lock for: {}", self.db_name);
            }
        });
    }
}

// Tests are in the export_import_lock_tests.rs integration test file
// since they need to test WASM async behavior properly
