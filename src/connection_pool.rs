use std::cell::{Cell, RefCell};
/// Connection pool for sharing SQLite connections between Database instances
///
/// This ensures multiple Database instances accessing the same database file
/// share the same underlying SQLite connection, preventing corruption and
/// ensuring consistent schema visibility.
use std::collections::HashMap;
use std::rc::Rc;

thread_local! {
    /// Global registry of shared SQLite connections
    /// CRITICAL: ConnectionState no longer wrapped in RefCell to prevent reentrancy panics
    static CONNECTION_POOL: RefCell<HashMap<String, Rc<ConnectionState>>> = RefCell::new(HashMap::new());
}

/// State of a shared connection
/// Uses Cell for interior mutability without RefCell borrow checking
pub struct ConnectionState {
    pub db: Cell<*mut sqlite_wasm_rs::sqlite3>,
    pub ref_count: Cell<usize>,
    pub db_name: String,
}

impl ConnectionState {
    pub fn new(db: *mut sqlite_wasm_rs::sqlite3, db_name: String) -> Self {
        Self {
            db: Cell::new(db),
            ref_count: Cell::new(1),
            db_name,
        }
    }
}

/// Get or create a shared connection for the given database
pub fn get_or_create_connection<F>(
    db_name: &str,
    create_fn: F,
) -> Result<Rc<ConnectionState>, String>
where
    F: FnOnce() -> Result<*mut sqlite_wasm_rs::sqlite3, String>,
{
    CONNECTION_POOL.with(|pool| {
        let mut pool = pool.borrow_mut();

        // Check if connection already exists
        if let Some(conn) = pool.get(db_name) {
            // Increment reference count using Cell
            let current = conn.ref_count.get();
            conn.ref_count.set(current + 1);
            log::info!(
                "Reusing existing connection for {} (ref_count: {})",
                db_name,
                current + 1
            );
            return Ok(conn.clone());
        }

        // Create new connection
        let db = create_fn()?;
        let state = ConnectionState::new(db, db_name.to_string());
        let rc = Rc::new(state);
        pool.insert(db_name.to_string(), rc.clone());
        log::debug!("Created new shared connection for {}", db_name);
        Ok(rc)
    })
}

/// Release a connection reference
pub fn release_connection(db_name: &str) {
    CONNECTION_POOL.with(|pool| {
        let mut pool = pool.borrow_mut();

        let should_remove = if let Some(conn) = pool.get(db_name) {
            let current = conn.ref_count.get();
            if current > 0 {
                conn.ref_count.set(current - 1);
                log::debug!(
                    "Released connection for {} (ref_count: {})",
                    db_name,
                    current - 1
                );
            } else {
                log::warn!(
                    "Attempt to release connection with ref_count 0 for {}",
                    db_name
                );
            }

            if conn.ref_count.get() == 0 {
                // Close the SQLite connection
                let db_ptr = conn.db.get();
                unsafe {
                    if !db_ptr.is_null() {
                        log::debug!("Closing SQLite connection for {}", db_name);
                        sqlite_wasm_rs::sqlite3_close(db_ptr);
                        conn.db.set(std::ptr::null_mut());
                    }
                }
                true
            } else {
                false
            }
        } else {
            log::debug!("Connection not found in pool for {}", db_name);
            false
        };

        if should_remove {
            pool.remove(db_name);
            log::debug!("Removed connection for {} from pool", db_name);
        }
    });
}

/// Check if a connection exists for the given database
pub fn connection_exists(db_name: &str) -> bool {
    CONNECTION_POOL.with(|pool| pool.borrow().contains_key(db_name))
}

/// Force close a connection, regardless of reference count
/// Used during import operations to ensure clean state
pub fn force_close_connection(db_name: &str) {
    CONNECTION_POOL.with(|pool| {
        let mut pool = pool.borrow_mut();

        if let Some(conn) = pool.remove(db_name) {
            let db_ptr = conn.db.get();
            let ref_count = conn.ref_count.get();
            // Close the SQLite connection regardless of ref_count
            unsafe {
                if !db_ptr.is_null() {
                    log::info!(
                        "Force closing connection for {} (had {} references)",
                        db_name,
                        ref_count
                    );
                    sqlite_wasm_rs::sqlite3_close(db_ptr);
                    conn.db.set(std::ptr::null_mut());
                }
            }
            log::debug!("Force removed connection for {} from pool", db_name);
        } else {
            log::debug!("No connection to force close for {}", db_name);
        }
    });
}
