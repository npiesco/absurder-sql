//! Global registries and handle management
//!
//! This module contains all global state for the FFI layer:
//! - Database registry (handle -> SqliteIndexedDB mapping)
//! - Prepared statement registry
//! - Streaming statement registry
//! - Handle counters for generating unique IDs
//! - Tokio runtime for async operations
//! - Thread-local error handling

use std::collections::HashMap;
use std::sync::Arc;
use std::cell::RefCell;
use parking_lot::Mutex;
use once_cell::sync::Lazy;
use absurder_sql::SqliteIndexedDB;
use tokio::runtime::Runtime;

/// Wrapper for PreparedStatement that stores SQL for on-demand preparation
/// We store the SQL and database handle, then prepare fresh on each execute
/// This avoids lifetime issues while still providing the prepared statement API
pub struct PreparedStatementWrapper {
    pub db_handle: u64,
    pub sql: String,
}

/// Streaming statement wrapper for cursor-based iteration
/// Stores the database handle and prepared SQL for on-demand execution
/// Uses rowid-based cursor pagination for O(n) complexity instead of O(n²) OFFSET
/// Note: Assumes rowids start >= 1 (SQLite default with AUTOINCREMENT)
pub struct StreamingStatement {
    pub db_handle: u64,
    pub sql: String,
    pub last_rowid: i64,
}

/// Global database registry
/// Maps handles (u64) to Arc<Mutex<SqliteIndexedDB>> instances
/// We need Mutex because SqliteIndexedDB::execute() requires &mut self
pub static DB_REGISTRY: Lazy<Arc<Mutex<HashMap<u64, Arc<Mutex<SqliteIndexedDB>>>>>> = Lazy::new(|| {
    Arc::new(Mutex::new(HashMap::new()))
});

/// Global prepared statement registry
/// Maps statement handles (u64) to PreparedStatementWrapper instances
pub static STMT_REGISTRY: Lazy<Arc<Mutex<HashMap<u64, PreparedStatementWrapper>>>> = Lazy::new(|| {
    Arc::new(Mutex::new(HashMap::new()))
});

/// Global streaming statement registry
/// Maps stream handles (u64) to StreamingStatement instances
pub static STREAM_REGISTRY: Lazy<Arc<Mutex<HashMap<u64, StreamingStatement>>>> = Lazy::new(|| {
    Arc::new(Mutex::new(HashMap::new()))
});

/// Counter for generating unique stream handles
pub static STREAM_HANDLE_COUNTER: Lazy<Arc<Mutex<u64>>> = Lazy::new(|| {
    Arc::new(Mutex::new(1))
});

/// Counter for generating unique database handles
pub static HANDLE_COUNTER: Lazy<Arc<Mutex<u64>>> = Lazy::new(|| {
    Arc::new(Mutex::new(1))
});

/// Counter for generating unique statement handles
pub static STMT_HANDLE_COUNTER: Lazy<Arc<Mutex<u64>>> = Lazy::new(|| {
    Arc::new(Mutex::new(1))
});

/// Global Tokio runtime for executing async database operations
pub static RUNTIME: Lazy<Runtime> = Lazy::new(|| {
    Runtime::new().expect("Failed to create Tokio runtime")
});

/// Android data directory path (set during initialization)
/// On Android, this is typically "/data/data/{package}/files"
pub static ANDROID_DATA_DIR: Lazy<Mutex<Option<String>>> = Lazy::new(|| {
    Mutex::new(None)
});

/// Set the Android data directory path
/// This function is called from JNI during app initialization
#[unsafe(no_mangle)]
pub extern "C" fn absurdersql_set_android_data_directory(path: *const std::os::raw::c_char) -> bool {
    if path.is_null() {
        log::error!("absurdersql_set_android_data_directory: received null path");
        return false;
    }
    
    let c_str = unsafe { std::ffi::CStr::from_ptr(path) };
    match c_str.to_str() {
        Ok(path_str) => {
            let mut dir = ANDROID_DATA_DIR.lock();
            *dir = Some(path_str.to_string());
            log::info!("Android data directory set to: {}", path_str);
            true
        }
        Err(e) => {
            log::error!("Failed to convert Android data directory path to string: {}", e);
            false
        }
    }
}

// Thread-local storage for the last error message
// This allows each thread to have its own error state without requiring synchronization
thread_local! {
    static LAST_ERROR: RefCell<Option<String>> = RefCell::new(None);
}

/// Set the last error message for this thread
pub fn set_last_error(msg: String) {
    LAST_ERROR.with(|e| {
        *e.borrow_mut() = Some(msg);
    });
}

/// Clear the last error message for this thread
pub fn clear_last_error() {
    LAST_ERROR.with(|e| {
        *e.borrow_mut() = None;
    });
}

/// Get the last error message for this thread (for internal use)
pub fn get_last_error_internal() -> Option<String> {
    LAST_ERROR.with(|e| e.borrow().clone())
}
