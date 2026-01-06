#[cfg(target_arch = "wasm32")]
use std::rc::Rc;
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

// Conditional rusqlite import: same crate, different features
// Make this public so child crates can use it
// When encryption is enabled, rusqlite uses bundled-sqlcipher-vendored-openssl feature
// When bundled-sqlite is enabled, rusqlite uses bundled feature
#[cfg(all(
    not(target_arch = "wasm32"),
    any(
        feature = "bundled-sqlite",
        feature = "encryption",
        feature = "encryption-commoncrypto",
        feature = "encryption-ios"
    )
))]
pub extern crate rusqlite;

// Enable better panic messages and memory allocation
#[cfg(feature = "console_error_panic_hook")]
pub use console_error_panic_hook::set_once as set_panic_hook;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// Initialize logging infrastructure for WASM
#[cfg(all(target_arch = "wasm32", feature = "console_log"))]
#[wasm_bindgen(start)]
pub fn init_logger() {
    // Initialize console_log for browser logging
    // Use Info level for production, Debug for development
    #[cfg(debug_assertions)]
    let log_level = log::Level::Debug;
    #[cfg(not(debug_assertions))]
    let log_level = log::Level::Info;

    console_log::init_with_level(log_level).expect("Failed to initialize console_log");

    log::info!("AbsurderSQL logging initialized at level: {:?}", log_level);
}

// Use centralized normalize_db_name from utils - SINGLE SOURCE OF TRUTH
// See utils.rs for documentation and rationale
#[cfg(target_arch = "wasm32")]
use crate::utils::normalize_db_name;

// Module declarations
mod cleanup;
#[cfg(target_arch = "wasm32")]
pub mod connection_pool;
#[cfg(not(target_arch = "wasm32"))]
pub mod database;
pub mod storage;
pub mod types;
pub mod vfs;
#[cfg(not(target_arch = "wasm32"))]
pub use database::PreparedStatement;
pub mod utils;

#[cfg(feature = "telemetry")]
pub mod telemetry;

// Re-export main public API
#[cfg(not(target_arch = "wasm32"))]
pub use database::SqliteIndexedDB;

// WASM: Track databases currently being opened to serialize SQLite connection initialization
#[cfg(target_arch = "wasm32")]
thread_local! {
    static DB_OPEN_IN_PROGRESS: std::cell::RefCell<std::collections::HashSet<String>> =
        std::cell::RefCell::new(std::collections::HashSet::new());
}

// Type alias for native platforms
#[cfg(not(target_arch = "wasm32"))]
pub type Database = SqliteIndexedDB;

pub use types::DatabaseConfig;
pub use types::{ColumnValue, DatabaseError, QueryResult, Row, TransactionOptions};

// Re-export VFS
pub use vfs::indexeddb_vfs::IndexedDBVFS;

/// DRY macro for async storage operations with interior mutability
#[cfg(target_arch = "wasm32")]
macro_rules! with_storage_async {
    ($storage:expr, $operation:expr, |$s:ident| $body:expr) => {{
        // BlockStorage uses RefCell for interior mutability, no outer borrow needed
        let $s = &*$storage;
        Some($body.await)
    }};
}

// WASM Database implementation using sqlite-wasm-rs
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub struct Database {
    #[wasm_bindgen(skip)]
    connection_state: Rc<crate::connection_pool::ConnectionState>,
    #[allow(dead_code)]
    name: String,
    #[wasm_bindgen(skip)]
    on_data_change_callback: Option<js_sys::Function>,
    #[wasm_bindgen(skip)]
    allow_non_leader_writes: bool,
    #[wasm_bindgen(skip)]
    optimistic_updates_manager:
        std::cell::RefCell<crate::storage::optimistic_updates::OptimisticUpdatesManager>,
    #[wasm_bindgen(skip)]
    coordination_metrics_manager:
        std::cell::RefCell<crate::storage::coordination_metrics::CoordinationMetricsManager>,
    #[wasm_bindgen(skip)]
    #[cfg(feature = "telemetry")]
    metrics: Option<crate::telemetry::Metrics>,
    #[wasm_bindgen(skip)]
    #[cfg(feature = "telemetry")]
    span_recorder: Option<crate::telemetry::SpanRecorder>,
    #[wasm_bindgen(skip)]
    #[cfg(feature = "telemetry")]
    span_context: Option<crate::telemetry::SpanContext>,
    #[wasm_bindgen(skip)]
    max_export_size_bytes: Option<u64>,
}

#[cfg(target_arch = "wasm32")]
impl Database {
    /// Get the SQLite database pointer from the shared connection
    /// Uses Cell::get() to avoid RefCell borrow checking - eliminates reentrancy panics
    fn db(&self) -> *mut sqlite_wasm_rs::sqlite3 {
        let db_ptr = self.connection_state.db.get();
        if db_ptr.is_null() {
            panic!("Database connection is null for {}", self.name);
        }
        db_ptr
    }

    /// Check if a SQL statement is a write operation
    fn is_write_operation(sql: &str) -> bool {
        let upper = sql.trim().to_uppercase();
        upper.starts_with("INSERT")
            || upper.starts_with("UPDATE")
            || upper.starts_with("DELETE")
            || upper.starts_with("REPLACE")
    }

    /// Get metrics for observability
    ///
    /// Returns a reference to the Metrics instance for tracking queries, errors, and performance
    #[cfg(feature = "telemetry")]
    pub fn metrics(&self) -> Option<&crate::telemetry::Metrics> {
        self.metrics.as_ref()
    }

    /// Check write permission - only leader can write (unless override enabled)
    async fn check_write_permission(&mut self, sql: &str) -> Result<(), DatabaseError> {
        if !Self::is_write_operation(sql) {
            // Not a write operation, allow it
            return Ok(());
        }

        // Check if non-leader writes are allowed
        if self.allow_non_leader_writes {
            log::info!("WRITE_ALLOWED: Non-leader writes enabled for {}", self.name);
            return Ok(());
        }

        // Check if this instance is the leader
        use crate::vfs::indexeddb_vfs::get_storage_with_fallback;

        let db_name = &self.name;
        let storage_rc = get_storage_with_fallback(db_name);

        if let Some(storage) = storage_rc {
            let is_leader = with_storage_async!(storage, "check_write_permission", |s| s
                .is_leader())
            .ok_or_else(|| {
                DatabaseError::new("BORROW_CONFLICT", "Failed to check leader status")
            })?;

            if !is_leader {
                log::error!("WRITE_DENIED: Instance is not leader for {}", db_name);
                return Err(DatabaseError::new(
                    "WRITE_PERMISSION_DENIED",
                    "Only the leader tab can write to this database. Use db.isLeader() to check status or call db.allowNonLeaderWrites(true) for single-tab mode.",
                ));
            }

            log::info!("WRITE_ALLOWED: Instance is leader for {}", db_name);
            Ok(())
        } else {
            // No storage found - allow by default (single-instance mode)
            log::info!(
                "WRITE_ALLOWED: No storage found for {} (single-instance mode)",
                db_name
            );
            Ok(())
        }
    }

    pub async fn new(config: DatabaseConfig) -> Result<Self, DatabaseError> {
        use std::ffi::{CStr, CString};

        log::info!("Database::new called for {}", config.name);

        // CRITICAL: Use DRY helper to normalize name WITH .db extension
        // This ensures Database.name, GLOBAL_STORAGE keys, and IndexedDB keys all match
        let normalized_name = normalize_db_name(&config.name);

        // Use a unique VFS name per database to avoid interference
        let vfs_name = format!("vfs_{}", normalized_name.trim_end_matches(".db"));
        let vfs_name_cstr = CString::new(vfs_name.as_str())
            .map_err(|_| DatabaseError::new("INVALID_VFS_NAME", "Invalid VFS name"))?;
        let vfs_exists = unsafe {
            let existing_vfs = sqlite_wasm_rs::sqlite3_vfs_find(vfs_name_cstr.as_ptr());
            !existing_vfs.is_null()
        };

        if !vfs_exists {
            // Create and register VFS only if it doesn't exist
            log::debug!("Creating IndexedDBVFS for: {}", normalized_name);
            let vfs = crate::vfs::IndexedDBVFS::new(&normalized_name).await?;
            log::debug!("Registering VFS as '{}'", vfs_name);
            vfs.register(&vfs_name)?;
            log::info!("VFS registered successfully");
        } else {
            log::info!("VFS '{}' already registered, reusing existing", vfs_name);
            // Ensure BlockStorage exists for this database in the registry
            // The existing VFS will find it via STORAGE_REGISTRY
            let _vfs = crate::vfs::IndexedDBVFS::new(&normalized_name).await?;
            log::info!("BlockStorage ensured for {}", normalized_name);
        }

        // CRITICAL: Synchronize SQLite connection opening to prevent WAL initialization conflicts
        // Wait if another task is currently opening a connection to this database
        #[cfg(target_arch = "wasm32")]
        {
            const MAX_OPEN_WAIT_MS: u32 = 1000; // Reduced from 5000 - 1s is sufficient
            const OPEN_POLL_MS: u32 = 10;
            let max_open_attempts = MAX_OPEN_WAIT_MS / OPEN_POLL_MS;

            for attempt in 0..max_open_attempts {
                let can_open = DB_OPEN_IN_PROGRESS.with(|opens| {
                    let mut set = opens.borrow_mut();
                    if set.contains(&config.name) {
                        false // Someone else is opening
                    } else {
                        set.insert(config.name.clone());
                        true // We got it
                    }
                });

                if can_open {
                    web_sys::console::log_1(
                        &format!("[DB] {} - ACQUIRED sqlite open lock", config.name).into(),
                    );
                    break;
                } else {
                    web_sys::console::log_1(
                        &format!(
                            "[DB] {} - Waiting for sqlite open (attempt {})",
                            config.name, attempt
                        )
                        .into(),
                    );
                    use wasm_bindgen_futures::JsFuture;
                    let promise = js_sys::Promise::new(&mut |resolve, _| {
                        web_sys::window()
                            .unwrap()
                            .set_timeout_with_callback_and_timeout_and_arguments_0(
                                &resolve,
                                OPEN_POLL_MS as i32,
                            )
                            .unwrap();
                    });
                    JsFuture::from(promise).await.ok();
                    continue;
                }
            }
        }

        // Use connection pooling to share connections between instances
        let (connection_state, db) = {
            let vfs_name_str = vfs_name.clone(); // Capture the VFS name to use in closure
            let filename_copy = normalized_name.clone(); // Capture filename for logging
            let pool_key = normalized_name.trim_end_matches(".db").to_string(); // Pool uses name without .db
            let state = crate::connection_pool::get_or_create_connection(&pool_key, || {
                let mut db = std::ptr::null_mut();
                let db_name = CString::new(normalized_name.clone())
                    .map_err(|_| "Invalid database name".to_string())?;
                let vfs_cstr = CString::new(vfs_name_str.as_str())
                    .map_err(|_| "Invalid VFS name".to_string())?;

                log::info!(
                    "Opening database: {} with VFS: {}",
                    filename_copy,
                    vfs_name_str
                );

                #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(&format!("[OPEN] About to call sqlite3_open_v2...").into());

                let ret = unsafe {
                    sqlite_wasm_rs::sqlite3_open_v2(
                        db_name.as_ptr(),
                        &mut db as *mut _,
                        sqlite_wasm_rs::SQLITE_OPEN_READWRITE | sqlite_wasm_rs::SQLITE_OPEN_CREATE,
                        vfs_cstr.as_ptr(),
                    )
                };

                #[cfg(target_arch = "wasm32")]
                web_sys::console::log_1(
                    &format!("[OPEN] sqlite3_open_v2 returned: {}", ret).into(),
                );

                log::info!(
                    "sqlite3_open_v2 returned: {} for database: {}",
                    ret,
                    filename_copy
                );

                if ret != sqlite_wasm_rs::SQLITE_OK {
                    let err_msg = unsafe {
                        let msg_ptr = sqlite_wasm_rs::sqlite3_errmsg(db);
                        if !msg_ptr.is_null() {
                            CStr::from_ptr(msg_ptr).to_string_lossy().into_owned()
                        } else {
                            "Unknown error".to_string()
                        }
                    };

                    #[cfg(target_arch = "wasm32")]
                    web_sys::console::log_1(
                        &format!(
                            "[OPEN] ERROR - sqlite3_open_v2 FAILED: ret={}, err={}",
                            ret, err_msg
                        )
                        .into(),
                    );

                    return Err(format!(
                        "Failed to open database with IndexedDB VFS: {}",
                        err_msg
                    ));
                }

                log::info!("Database opened successfully with IndexedDB VFS");
                Ok(db)
            })
            .map_err(|e| DatabaseError::new("CONNECTION_POOL_ERROR", &e))?;
            let db_ptr = state.db.get();
            (state, db_ptr)
        };

        // Apply configuration options via PRAGMA statements
        let exec_sql = |db: *mut sqlite_wasm_rs::sqlite3, sql: &str| -> Result<(), DatabaseError> {
            let c_sql = CString::new(sql)
                .map_err(|_| DatabaseError::new("INVALID_SQL", "Invalid SQL statement"))?;

            let ret = unsafe {
                sqlite_wasm_rs::sqlite3_exec(
                    db,
                    c_sql.as_ptr(),
                    None,
                    std::ptr::null_mut(),
                    std::ptr::null_mut(),
                )
            };

            if ret != sqlite_wasm_rs::SQLITE_OK {
                let err_msg = unsafe {
                    let msg_ptr = sqlite_wasm_rs::sqlite3_errmsg(db);
                    if !msg_ptr.is_null() {
                        CStr::from_ptr(msg_ptr).to_string_lossy().into_owned()
                    } else {
                        "Unknown error".to_string()
                    }
                };
                log::warn!("Failed to execute SQL '{}': {}", sql, err_msg);
                return Err(DatabaseError::new(
                    "SQLITE_ERROR",
                    &format!("Failed to execute: {}", err_msg),
                ));
            }
            Ok(())
        };

        // CRITICAL: Set busy_timeout FIRST to handle concurrent access
        // This makes SQLite wait and retry for up to 10 seconds when the database is locked
        // instead of immediately returning SQLITE_BUSY errors during parallel operations
        log::debug!("Setting busy_timeout to 10000ms for concurrent access handling");
        exec_sql(db, "PRAGMA busy_timeout = 10000")?;

        // Apply page_size (must be set before any tables are created)
        if let Some(page_size) = config.page_size {
            log::debug!("Setting page_size to {}", page_size);
            exec_sql(db, &format!("PRAGMA page_size = {}", page_size))?;
        }

        // Apply cache_size
        if let Some(cache_size) = config.cache_size {
            log::debug!("Setting cache_size to {}", cache_size);
            exec_sql(db, &format!("PRAGMA cache_size = {}", cache_size))?;
        }

        // Apply journal_mode
        // WAL mode is now fully supported via shared memory (xShm*) implementation
        if let Some(ref journal_mode) = config.journal_mode {
            log::debug!("Setting journal_mode to {}", journal_mode);

            let pragma_sql = format!("PRAGMA journal_mode = {}", journal_mode);
            let c_sql = CString::new(pragma_sql.as_str())
                .map_err(|_| DatabaseError::new("INVALID_SQL", "Invalid SQL statement"))?;

            let mut stmt: *mut sqlite_wasm_rs::sqlite3_stmt = std::ptr::null_mut();
            let ret = unsafe {
                sqlite_wasm_rs::sqlite3_prepare_v2(
                    db,
                    c_sql.as_ptr(),
                    -1,
                    &mut stmt as *mut _,
                    std::ptr::null_mut(),
                )
            };

            if ret == sqlite_wasm_rs::SQLITE_OK && !stmt.is_null() {
                let step_ret = unsafe { sqlite_wasm_rs::sqlite3_step(stmt) };
                if step_ret == sqlite_wasm_rs::SQLITE_ROW {
                    let result_ptr = unsafe { sqlite_wasm_rs::sqlite3_column_text(stmt, 0) };
                    if !result_ptr.is_null() {
                        let result_mode = unsafe {
                            std::ffi::CStr::from_ptr(result_ptr as *const i8)
                                .to_string_lossy()
                                .to_uppercase()
                        };

                        if result_mode != journal_mode.to_uppercase() {
                            log::warn!(
                                "journal_mode {} requested but SQLite set {}",
                                journal_mode,
                                result_mode
                            );
                        } else {
                            log::info!("journal_mode successfully set to {}", result_mode);
                        }
                    }
                }
                unsafe { sqlite_wasm_rs::sqlite3_finalize(stmt) };
            } else {
                log::warn!("Failed to prepare journal_mode PRAGMA");
            }
        }

        // Apply auto_vacuum (must be set before any tables are created)
        if let Some(auto_vacuum) = config.auto_vacuum {
            let vacuum_mode = if auto_vacuum { 1 } else { 0 }; // 0=none, 1=full, 2=incremental
            log::debug!("Setting auto_vacuum to {}", vacuum_mode);
            exec_sql(db, &format!("PRAGMA auto_vacuum = {}", vacuum_mode))?;
        }

        log::info!("Database configuration applied successfully");

        // Initialize metrics for telemetry
        #[cfg(feature = "telemetry")]
        let metrics = crate::telemetry::Metrics::new().map_err(|e| {
            DatabaseError::new(
                "METRICS_ERROR",
                &format!("Failed to initialize metrics: {}", e),
            )
        })?;

        let database = Database {
            connection_state,
            name: normalized_name.clone(), // CRITICAL: Use normalized name WITH .db to match registry
            on_data_change_callback: None,
            allow_non_leader_writes: false,
            optimistic_updates_manager: std::cell::RefCell::new(
                crate::storage::optimistic_updates::OptimisticUpdatesManager::new(),
            ),
            coordination_metrics_manager: std::cell::RefCell::new(
                crate::storage::coordination_metrics::CoordinationMetricsManager::new(),
            ),
            #[cfg(feature = "telemetry")]
            metrics: Some(metrics),
            #[cfg(feature = "telemetry")]
            span_recorder: None,
            #[cfg(feature = "telemetry")]
            span_context: Some(crate::telemetry::SpanContext::new()),
            max_export_size_bytes: config.max_export_size_bytes,
        };

        // CRITICAL: Release the SQLite open lock ONLY after Database is fully constructed
        // This ensures WAL initialization and all setup completes before another instance can start
        #[cfg(target_arch = "wasm32")]
        {
            DB_OPEN_IN_PROGRESS.with(|opens| {
                opens.borrow_mut().remove(&config.name);
            });
            web_sys::console::log_1(
                &format!("[DB] {} - RELEASED sqlite open lock", config.name).into(),
            );
        }

        Ok(database)
    }

    /// Open a database with a specific VFS using connection pooling
    pub async fn open_with_vfs(filename: &str, vfs_name: &str) -> Result<Self, DatabaseError> {
        use std::ffi::CString;

        log::info!("Opening database {} with VFS {}", filename, vfs_name);

        // Normalize the database name WITH .db extension
        let normalized_name = normalize_db_name(filename);
        let pool_key = normalized_name.trim_end_matches(".db").to_string();

        // Use connection pooling with custom VFS
        let connection_state = crate::connection_pool::get_or_create_connection(&pool_key, || {
            let mut db: *mut sqlite_wasm_rs::sqlite3 = std::ptr::null_mut();
            let db_name = CString::new(normalized_name.clone())
                .map_err(|_| "Invalid database name".to_string())?;
            let vfs_cstr = CString::new(vfs_name).map_err(|_| "Invalid VFS name".to_string())?;

            let ret = unsafe {
                sqlite_wasm_rs::sqlite3_open_v2(
                    db_name.as_ptr(),
                    &mut db as *mut _,
                    sqlite_wasm_rs::SQLITE_OPEN_READWRITE | sqlite_wasm_rs::SQLITE_OPEN_CREATE,
                    vfs_cstr.as_ptr(),
                )
            };

            if ret != sqlite_wasm_rs::SQLITE_OK {
                let err_msg = if !db.is_null() {
                    unsafe {
                        let msg_ptr = sqlite_wasm_rs::sqlite3_errmsg(db);
                        if !msg_ptr.is_null() {
                            std::ffi::CStr::from_ptr(msg_ptr)
                                .to_string_lossy()
                                .into_owned()
                        } else {
                            "Unknown error".to_string()
                        }
                    }
                } else {
                    "Failed to open database".to_string()
                };
                return Err(format!("SQLITE_ERROR: {}", err_msg));
            }

            Ok(db)
        })
        .map_err(|e| DatabaseError::new("OPEN_ERROR", &e))?;

        log::info!(
            "Successfully opened database {} with VFS {}",
            normalized_name,
            vfs_name
        );

        // Initialize metrics for telemetry
        #[cfg(feature = "telemetry")]
        let metrics = crate::telemetry::Metrics::new().map_err(|e| {
            DatabaseError::new(
                "METRICS_ERROR",
                &format!("Failed to initialize metrics: {}", e),
            )
        })?;

        Ok(Database {
            connection_state,
            name: normalized_name, // CRITICAL: Store normalized name WITH .db
            on_data_change_callback: None,
            allow_non_leader_writes: false,
            optimistic_updates_manager: std::cell::RefCell::new(
                crate::storage::optimistic_updates::OptimisticUpdatesManager::new(),
            ),
            coordination_metrics_manager: std::cell::RefCell::new(
                crate::storage::coordination_metrics::CoordinationMetricsManager::new(),
            ),
            #[cfg(feature = "telemetry")]
            metrics: Some(metrics),
            #[cfg(feature = "telemetry")]
            span_recorder: None,
            #[cfg(feature = "telemetry")]
            span_context: Some(crate::telemetry::SpanContext::new()),
            max_export_size_bytes: Some(2 * 1024 * 1024 * 1024), // Default 2GB limit
        })
    }

    pub async fn execute_internal(&mut self, sql: &str) -> Result<QueryResult, DatabaseError> {
        use std::ffi::{CStr, CString};
        let start_time = js_sys::Date::now();

        // Create span for query execution and enter context
        #[cfg(feature = "telemetry")]
        let span = if self.span_recorder.is_some() {
            let query_type = sql
                .trim()
                .split_whitespace()
                .next()
                .unwrap_or("UNKNOWN")
                .to_uppercase();
            let mut builder = crate::telemetry::SpanBuilder::new("execute_query".to_string())
                .with_attribute("query_type", query_type.clone())
                .with_attribute("sql", sql.to_string());

            // Attach baggage from context
            if let Some(ref context) = self.span_context {
                builder = builder.with_baggage_from_context(context);
            }

            let span = builder.build();

            // Enter span context
            if let Some(ref context) = self.span_context {
                context.enter_span(span.span_id.clone());
            }

            Some(span)
        } else {
            None
        };

        // Track query execution metrics
        #[cfg(feature = "telemetry")]
        #[cfg(feature = "telemetry")]
        if let Some(metrics) = &self.metrics {
            metrics.queries_total().inc();
        }

        // Validate connection pointer before using it
        if self.db().is_null() {
            return Err(DatabaseError::new(
                "NULL_CONNECTION",
                "Database connection is null",
            ));
        }

        let sql_cstr = CString::new(sql)
            .map_err(|_| DatabaseError::new("INVALID_SQL", "Invalid SQL string"))?;

        if sql.trim().to_uppercase().starts_with("SELECT") {
            let mut stmt = std::ptr::null_mut();
            let ret = unsafe {
                sqlite_wasm_rs::sqlite3_prepare_v2(
                    self.db(),
                    sql_cstr.as_ptr(),
                    -1,
                    &mut stmt,
                    std::ptr::null_mut(),
                )
            };

            if ret != sqlite_wasm_rs::SQLITE_OK {
                // Get actual error message from SQLite
                let err_msg = unsafe {
                    let msg_ptr = sqlite_wasm_rs::sqlite3_errmsg(self.db());
                    if !msg_ptr.is_null() {
                        CStr::from_ptr(msg_ptr).to_string_lossy().into_owned()
                    } else {
                        format!("Unknown error (code: {})", ret)
                    }
                };

                // Track error
                #[cfg(feature = "telemetry")]
                #[cfg(feature = "telemetry")]
                if let Some(metrics) = &self.metrics {
                    metrics.errors_total().inc();
                }

                // Finish span with error
                #[cfg(feature = "telemetry")]
                if let Some(mut s) = span {
                    s.status = crate::telemetry::SpanStatus::Error(format!(
                        "Failed to prepare: {}",
                        err_msg
                    ));
                    s.end_time_ms = Some(js_sys::Date::now());
                    if let Some(recorder) = &self.span_recorder {
                        recorder.record_span(s);
                    }

                    // Exit span context
                    if let Some(ref context) = self.span_context {
                        context.exit_span();
                    }
                }

                return Err(DatabaseError::new(
                    "SQLITE_ERROR",
                    &format!("Failed to prepare statement: {}", err_msg),
                )
                .with_sql(sql));
            }

            let column_count = unsafe { sqlite_wasm_rs::sqlite3_column_count(stmt) };
            let mut columns = Vec::new();
            let mut rows = Vec::new();

            // Get column names
            for i in 0..column_count {
                let col_name = unsafe {
                    let name_ptr = sqlite_wasm_rs::sqlite3_column_name(stmt, i);
                    if name_ptr.is_null() {
                        format!("col_{}", i)
                    } else {
                        std::ffi::CStr::from_ptr(name_ptr)
                            .to_string_lossy()
                            .into_owned()
                    }
                };
                columns.push(col_name);
            }

            // Execute and fetch rows
            loop {
                let step_ret = unsafe { sqlite_wasm_rs::sqlite3_step(stmt) };
                if step_ret == sqlite_wasm_rs::SQLITE_ROW {
                    let mut values = Vec::new();
                    for i in 0..column_count {
                        let value = unsafe {
                            let col_type = sqlite_wasm_rs::sqlite3_column_type(stmt, i);
                            match col_type {
                                sqlite_wasm_rs::SQLITE_NULL => ColumnValue::Null,
                                sqlite_wasm_rs::SQLITE_INTEGER => {
                                    let val = sqlite_wasm_rs::sqlite3_column_int64(stmt, i);
                                    ColumnValue::Integer(val)
                                }
                                sqlite_wasm_rs::SQLITE_FLOAT => {
                                    let val = sqlite_wasm_rs::sqlite3_column_double(stmt, i);
                                    ColumnValue::Real(val)
                                }
                                sqlite_wasm_rs::SQLITE_TEXT => {
                                    let text_ptr = sqlite_wasm_rs::sqlite3_column_text(stmt, i);
                                    if text_ptr.is_null() {
                                        ColumnValue::Null
                                    } else {
                                        let text = std::ffi::CStr::from_ptr(text_ptr as *const i8)
                                            .to_string_lossy()
                                            .into_owned();
                                        ColumnValue::Text(text)
                                    }
                                }
                                sqlite_wasm_rs::SQLITE_BLOB => {
                                    let blob_ptr = sqlite_wasm_rs::sqlite3_column_blob(stmt, i);
                                    let blob_size = sqlite_wasm_rs::sqlite3_column_bytes(stmt, i);
                                    if blob_ptr.is_null() || blob_size == 0 {
                                        ColumnValue::Blob(vec![])
                                    } else {
                                        let blob_slice = std::slice::from_raw_parts(
                                            blob_ptr as *const u8,
                                            blob_size as usize,
                                        );
                                        ColumnValue::Blob(blob_slice.to_vec())
                                    }
                                }
                                _ => ColumnValue::Null,
                            }
                        };
                        values.push(value);
                    }
                    rows.push(Row { values });
                } else if step_ret == sqlite_wasm_rs::SQLITE_DONE {
                    break;
                } else {
                    // Get SQLite error message before finalizing
                    let err_msg = unsafe {
                        let err_ptr = sqlite_wasm_rs::sqlite3_errmsg(self.db());
                        if !err_ptr.is_null() {
                            std::ffi::CStr::from_ptr(err_ptr)
                                .to_string_lossy()
                                .to_string()
                        } else {
                            "Unknown SQLite error".to_string()
                        }
                    };
                    unsafe { sqlite_wasm_rs::sqlite3_finalize(stmt) };
                    // Track error
                    #[cfg(feature = "telemetry")]
                    if let Some(metrics) = &self.metrics {
                        metrics.errors_total().inc();
                    }
                    return Err(DatabaseError::new(
                        "SQLITE_ERROR",
                        &format!("Error executing SELECT statement: {}", err_msg),
                    )
                    .with_sql(sql));
                }
            }

            unsafe { sqlite_wasm_rs::sqlite3_finalize(stmt) };
            let execution_time_ms = js_sys::Date::now() - start_time;

            // Track query duration
            #[cfg(feature = "telemetry")]
            if let Some(metrics) = &self.metrics {
                metrics.query_duration().observe(execution_time_ms);
            }

            Ok(QueryResult {
                columns,
                rows,
                affected_rows: 0,
                last_insert_id: None,
                execution_time_ms,
            })
        } else {
            // Non-SELECT statements - Use prepare/step to properly handle PRAGMA results
            let mut stmt: *mut sqlite_wasm_rs::sqlite3_stmt = std::ptr::null_mut();
            let ret = unsafe {
                sqlite_wasm_rs::sqlite3_prepare_v2(
                    self.db(),
                    sql_cstr.as_ptr(),
                    -1,
                    &mut stmt,
                    std::ptr::null_mut(),
                )
            };

            if ret != sqlite_wasm_rs::SQLITE_OK {
                // Get actual error message from SQLite
                let err_msg = unsafe {
                    let msg_ptr = sqlite_wasm_rs::sqlite3_errmsg(self.db());
                    if !msg_ptr.is_null() {
                        CStr::from_ptr(msg_ptr).to_string_lossy().into_owned()
                    } else {
                        format!("Unknown error (code: {})", ret)
                    }
                };

                // Track error
                #[cfg(feature = "telemetry")]
                if let Some(metrics) = &self.metrics {
                    metrics.errors_total().inc();
                }
                return Err(DatabaseError::new(
                    "SQLITE_ERROR",
                    &format!("Failed to prepare statement: {}", err_msg),
                )
                .with_sql(sql));
            }

            // Get column info for PRAGMA statements that return results
            let column_count = unsafe { sqlite_wasm_rs::sqlite3_column_count(stmt) };
            let mut columns = Vec::new();
            let mut rows = Vec::new();

            if column_count > 0 {
                // This is a PRAGMA or other statement that returns rows
                for i in 0..column_count {
                    let col_name = unsafe {
                        let name_ptr = sqlite_wasm_rs::sqlite3_column_name(stmt, i);
                        if name_ptr.is_null() {
                            format!("column_{}", i)
                        } else {
                            std::ffi::CStr::from_ptr(name_ptr)
                                .to_string_lossy()
                                .into_owned()
                        }
                    };
                    columns.push(col_name);
                }

                // Fetch all rows
                loop {
                    let step_ret = unsafe { sqlite_wasm_rs::sqlite3_step(stmt) };
                    if step_ret == sqlite_wasm_rs::SQLITE_ROW {
                        let mut values = Vec::new();
                        for i in 0..column_count {
                            let value = unsafe {
                                let col_type = sqlite_wasm_rs::sqlite3_column_type(stmt, i);
                                match col_type {
                                    sqlite_wasm_rs::SQLITE_TEXT => {
                                        let text_ptr = sqlite_wasm_rs::sqlite3_column_text(stmt, i);
                                        if text_ptr.is_null() {
                                            ColumnValue::Null
                                        } else {
                                            let text =
                                                std::ffi::CStr::from_ptr(text_ptr as *const i8)
                                                    .to_string_lossy()
                                                    .into_owned();
                                            ColumnValue::Text(text)
                                        }
                                    }
                                    sqlite_wasm_rs::SQLITE_INTEGER => ColumnValue::Integer(
                                        sqlite_wasm_rs::sqlite3_column_int64(stmt, i),
                                    ),
                                    _ => ColumnValue::Null,
                                }
                            };
                            values.push(value);
                        }
                        rows.push(Row { values });
                    } else if step_ret == sqlite_wasm_rs::SQLITE_DONE {
                        break;
                    } else {
                        // Get SQLite error message before finalizing
                        let err_msg = unsafe {
                            let err_ptr = sqlite_wasm_rs::sqlite3_errmsg(self.db());
                            if !err_ptr.is_null() {
                                std::ffi::CStr::from_ptr(err_ptr)
                                    .to_string_lossy()
                                    .to_string()
                            } else {
                                "Unknown SQLite error".to_string()
                            }
                        };
                        unsafe { sqlite_wasm_rs::sqlite3_finalize(stmt) };
                        // Track error
                        #[cfg(feature = "telemetry")]
                        if let Some(metrics) = &self.metrics {
                            metrics.errors_total().inc();
                        }
                        return Err(DatabaseError::new(
                            "SQLITE_ERROR",
                            &format!("Failed to execute statement: {}", err_msg),
                        )
                        .with_sql(sql));
                    }
                }
            } else {
                // Regular non-SELECT statement
                let step_ret = unsafe { sqlite_wasm_rs::sqlite3_step(stmt) };
                if step_ret != sqlite_wasm_rs::SQLITE_DONE {
                    // Get SQLite error message before finalizing
                    let err_msg = unsafe {
                        let err_ptr = sqlite_wasm_rs::sqlite3_errmsg(self.db());
                        if !err_ptr.is_null() {
                            std::ffi::CStr::from_ptr(err_ptr)
                                .to_string_lossy()
                                .to_string()
                        } else {
                            "Unknown SQLite error".to_string()
                        }
                    };
                    unsafe { sqlite_wasm_rs::sqlite3_finalize(stmt) };
                    // Track error
                    #[cfg(feature = "telemetry")]
                    if let Some(metrics) = &self.metrics {
                        metrics.errors_total().inc();
                    }
                    return Err(DatabaseError::new(
                        "SQLITE_ERROR",
                        &format!("Failed to execute statement: {}", err_msg),
                    )
                    .with_sql(sql));
                }
            }

            // Finalize to complete the statement
            unsafe { sqlite_wasm_rs::sqlite3_finalize(stmt) };

            let affected_rows = unsafe { sqlite_wasm_rs::sqlite3_changes(self.db()) } as u32;
            let last_insert_id = if sql.trim().to_uppercase().starts_with("INSERT") {
                Some(unsafe { sqlite_wasm_rs::sqlite3_last_insert_rowid(self.db()) })
            } else {
                None
            };

            let execution_time_ms = js_sys::Date::now() - start_time;

            // Track query duration
            #[cfg(feature = "telemetry")]
            if let Some(metrics) = &self.metrics {
                metrics.query_duration().observe(execution_time_ms);
            }

            // Finish span successfully
            #[cfg(feature = "telemetry")]
            if let Some(mut s) = span {
                s.status = crate::telemetry::SpanStatus::Ok;
                s.end_time_ms = Some(js_sys::Date::now());
                s.attributes
                    .insert("duration_ms".to_string(), execution_time_ms.to_string());
                s.attributes
                    .insert("affected_rows".to_string(), affected_rows.to_string());
                s.attributes
                    .insert("row_count".to_string(), rows.len().to_string());
                if let Some(recorder) = &self.span_recorder {
                    recorder.record_span(s);
                }

                // Exit span context
                if let Some(ref context) = self.span_context {
                    context.exit_span();
                }
            }

            Ok(QueryResult {
                columns,
                rows,
                affected_rows,
                last_insert_id,
                execution_time_ms,
            })
        }
    }

    pub async fn execute_with_params_internal(
        &mut self,
        sql: &str,
        params: &[ColumnValue],
    ) -> Result<QueryResult, DatabaseError> {
        use std::ffi::{CStr, CString};
        let start_time = js_sys::Date::now();

        // Create span for query execution
        #[cfg(feature = "telemetry")]
        let span = if self.span_recorder.is_some() {
            let query_type = sql
                .trim()
                .split_whitespace()
                .next()
                .unwrap_or("UNKNOWN")
                .to_uppercase();
            let span = crate::telemetry::SpanBuilder::new("execute_query".to_string())
                .with_attribute("query_type", query_type.clone())
                .with_attribute("sql", sql.to_string())
                .build();
            Some(span)
        } else {
            None
        };

        // Ensure metrics are propagated to BlockStorage before execution
        #[cfg(feature = "telemetry")]
        self.ensure_metrics_propagated();

        // Track query execution metrics
        #[cfg(feature = "telemetry")]
        if let Some(metrics) = &self.metrics {
            metrics.queries_total().inc();
        }

        let sql_cstr = CString::new(sql)
            .map_err(|_| DatabaseError::new("INVALID_SQL", "Invalid SQL string"))?;

        let mut stmt = std::ptr::null_mut();
        let ret = unsafe {
            sqlite_wasm_rs::sqlite3_prepare_v2(
                self.db(),
                sql_cstr.as_ptr(),
                -1,
                &mut stmt,
                std::ptr::null_mut(),
            )
        };

        if ret != sqlite_wasm_rs::SQLITE_OK {
            // Get actual error message from SQLite
            let err_msg = unsafe {
                let msg_ptr = sqlite_wasm_rs::sqlite3_errmsg(self.db());
                if !msg_ptr.is_null() {
                    CStr::from_ptr(msg_ptr).to_string_lossy().into_owned()
                } else {
                    format!("Unknown error (code: {})", ret)
                }
            };

            // Track error
            #[cfg(feature = "telemetry")]
            if let Some(metrics) = &self.metrics {
                metrics.errors_total().inc();
            }

            // Finish span with error
            #[cfg(feature = "telemetry")]
            if let Some(mut s) = span {
                s.status =
                    crate::telemetry::SpanStatus::Error(format!("Failed to prepare: {}", err_msg));
                s.end_time_ms = Some(js_sys::Date::now());
                if let Some(recorder) = &self.span_recorder {
                    recorder.record_span(s);
                }
            }

            return Err(DatabaseError::new(
                "SQLITE_ERROR",
                &format!("Failed to prepare statement: {}", err_msg),
            )
            .with_sql(sql));
        }

        // Bind parameters
        let mut text_cstrings = Vec::new(); // Keep CStrings alive
        for (i, param) in params.iter().enumerate() {
            let param_index = (i + 1) as i32;
            let bind_ret = unsafe {
                match param {
                    ColumnValue::Null => sqlite_wasm_rs::sqlite3_bind_null(stmt, param_index),
                    ColumnValue::Integer(val) => {
                        sqlite_wasm_rs::sqlite3_bind_int64(stmt, param_index, *val)
                    }
                    ColumnValue::Real(val) => {
                        sqlite_wasm_rs::sqlite3_bind_double(stmt, param_index, *val)
                    }
                    ColumnValue::Text(val) => {
                        // Sanitize string by removing null bytes (SQLite text shouldn't contain them)
                        let sanitized = val.replace('\0', "");
                        // Safe: after removing null bytes, CString::new cannot fail
                        let text_cstr = CString::new(sanitized.as_str())
                            .expect("CString::new should not fail after null byte removal");
                        let result = sqlite_wasm_rs::sqlite3_bind_text(
                            stmt,
                            param_index,
                            text_cstr.as_ptr(),
                            sanitized.len() as i32,
                            sqlite_wasm_rs::SQLITE_TRANSIENT(),
                        );
                        text_cstrings.push(text_cstr); // Keep alive
                        result
                    }
                    ColumnValue::Blob(val) => sqlite_wasm_rs::sqlite3_bind_blob(
                        stmt,
                        param_index,
                        val.as_ptr() as *const _,
                        val.len() as i32,
                        sqlite_wasm_rs::SQLITE_TRANSIENT(),
                    ),
                    _ => sqlite_wasm_rs::sqlite3_bind_null(stmt, param_index),
                }
            };

            if bind_ret != sqlite_wasm_rs::SQLITE_OK {
                unsafe { sqlite_wasm_rs::sqlite3_finalize(stmt) };
                // Track error
                #[cfg(feature = "telemetry")]
                if let Some(metrics) = &self.metrics {
                    metrics.errors_total().inc();
                }
                return Err(
                    DatabaseError::new("SQLITE_ERROR", "Failed to bind parameter").with_sql(sql),
                );
            }
        }

        if sql.trim().to_uppercase().starts_with("SELECT") {
            let column_count = unsafe { sqlite_wasm_rs::sqlite3_column_count(stmt) };
            let mut columns = Vec::new();
            let mut rows = Vec::new();

            // Get column names
            for i in 0..column_count {
                let col_name = unsafe {
                    let name_ptr = sqlite_wasm_rs::sqlite3_column_name(stmt, i);
                    if name_ptr.is_null() {
                        format!("col_{}", i)
                    } else {
                        std::ffi::CStr::from_ptr(name_ptr)
                            .to_string_lossy()
                            .into_owned()
                    }
                };
                columns.push(col_name);
            }

            // Execute and fetch rows
            loop {
                let step_ret = unsafe { sqlite_wasm_rs::sqlite3_step(stmt) };
                if step_ret == sqlite_wasm_rs::SQLITE_ROW {
                    let mut values = Vec::new();
                    for i in 0..column_count {
                        let value = unsafe {
                            let col_type = sqlite_wasm_rs::sqlite3_column_type(stmt, i);
                            match col_type {
                                sqlite_wasm_rs::SQLITE_NULL => ColumnValue::Null,
                                sqlite_wasm_rs::SQLITE_INTEGER => {
                                    let val = sqlite_wasm_rs::sqlite3_column_int64(stmt, i);
                                    ColumnValue::Integer(val)
                                }
                                sqlite_wasm_rs::SQLITE_FLOAT => {
                                    let val = sqlite_wasm_rs::sqlite3_column_double(stmt, i);
                                    ColumnValue::Real(val)
                                }
                                sqlite_wasm_rs::SQLITE_TEXT => {
                                    let text_ptr = sqlite_wasm_rs::sqlite3_column_text(stmt, i);
                                    if text_ptr.is_null() {
                                        ColumnValue::Null
                                    } else {
                                        let text = std::ffi::CStr::from_ptr(text_ptr as *const i8)
                                            .to_string_lossy()
                                            .into_owned();
                                        ColumnValue::Text(text)
                                    }
                                }
                                sqlite_wasm_rs::SQLITE_BLOB => {
                                    let blob_ptr = sqlite_wasm_rs::sqlite3_column_blob(stmt, i);
                                    let blob_size = sqlite_wasm_rs::sqlite3_column_bytes(stmt, i);
                                    if blob_ptr.is_null() || blob_size == 0 {
                                        ColumnValue::Blob(vec![])
                                    } else {
                                        let blob_slice = std::slice::from_raw_parts(
                                            blob_ptr as *const u8,
                                            blob_size as usize,
                                        );
                                        ColumnValue::Blob(blob_slice.to_vec())
                                    }
                                }
                                _ => ColumnValue::Null,
                            }
                        };
                        values.push(value);
                    }
                    rows.push(Row { values });
                } else if step_ret == sqlite_wasm_rs::SQLITE_DONE {
                    break;
                } else {
                    // Get SQLite error message before finalizing
                    let err_msg = unsafe {
                        let err_ptr = sqlite_wasm_rs::sqlite3_errmsg(self.db());
                        if !err_ptr.is_null() {
                            std::ffi::CStr::from_ptr(err_ptr)
                                .to_string_lossy()
                                .to_string()
                        } else {
                            "Unknown SQLite error".to_string()
                        }
                    };
                    unsafe { sqlite_wasm_rs::sqlite3_finalize(stmt) };
                    // Track error
                    #[cfg(feature = "telemetry")]
                    if let Some(metrics) = &self.metrics {
                        metrics.errors_total().inc();
                    }
                    return Err(DatabaseError::new(
                        "SQLITE_ERROR",
                        &format!("Error executing SELECT statement: {}", err_msg),
                    )
                    .with_sql(sql));
                }
            }

            unsafe { sqlite_wasm_rs::sqlite3_finalize(stmt) };

            let execution_time_ms = js_sys::Date::now() - start_time;

            // Track query duration
            #[cfg(feature = "telemetry")]
            if let Some(metrics) = &self.metrics {
                metrics.query_duration().observe(execution_time_ms);
            }

            // Finish span successfully for SELECT query
            #[cfg(feature = "telemetry")]
            if let Some(mut s) = span {
                s.status = crate::telemetry::SpanStatus::Ok;
                s.end_time_ms = Some(js_sys::Date::now());
                s.attributes
                    .insert("duration_ms".to_string(), execution_time_ms.to_string());
                s.attributes
                    .insert("row_count".to_string(), rows.len().to_string());
                if let Some(recorder) = &self.span_recorder {
                    recorder.record_span(s);
                }
            }

            Ok(QueryResult {
                columns,
                rows,
                affected_rows: 0,
                last_insert_id: None,
                execution_time_ms,
            })
        } else {
            // Non-SELECT statements
            let step_ret = unsafe { sqlite_wasm_rs::sqlite3_step(stmt) };
            // Track error
            #[cfg(feature = "telemetry")]
            if let Some(metrics) = &self.metrics {
                metrics.errors_total().inc();
            }
            unsafe { sqlite_wasm_rs::sqlite3_finalize(stmt) };

            if step_ret != sqlite_wasm_rs::SQLITE_DONE {
                let err_msg = unsafe {
                    let err_ptr = sqlite_wasm_rs::sqlite3_errmsg(self.db());
                    if !err_ptr.is_null() {
                        std::ffi::CStr::from_ptr(err_ptr)
                            .to_string_lossy()
                            .to_string()
                    } else {
                        "Unknown SQLite error".to_string()
                    }
                };
                return Err(DatabaseError::new(
                    "SQLITE_ERROR",
                    &format!("Failed to execute statement: {}", err_msg),
                )
                .with_sql(sql));
            }

            let execution_time_ms = js_sys::Date::now() - start_time;

            // Track query duration
            #[cfg(feature = "telemetry")]
            if let Some(metrics) = &self.metrics {
                metrics.query_duration().observe(execution_time_ms);
            }
            let affected_rows = unsafe { sqlite_wasm_rs::sqlite3_changes(self.db()) } as u32;
            let last_insert_id = if sql.trim().to_uppercase().starts_with("INSERT") {
                Some(unsafe { sqlite_wasm_rs::sqlite3_last_insert_rowid(self.db()) })
            } else {
                None
            };

            // Finish span successfully
            #[cfg(feature = "telemetry")]
            if let Some(mut s) = span {
                s.status = crate::telemetry::SpanStatus::Ok;
                s.end_time_ms = Some(js_sys::Date::now());
                s.attributes
                    .insert("duration_ms".to_string(), execution_time_ms.to_string());
                s.attributes
                    .insert("affected_rows".to_string(), affected_rows.to_string());
                if let Some(recorder) = &self.span_recorder {
                    recorder.record_span(s);
                }
            }

            Ok(QueryResult {
                columns: vec![],
                rows: vec![],
                affected_rows,
                last_insert_id,
                execution_time_ms,
            })
        }
    }

    /// Set telemetry metrics for this database instance
    #[cfg(feature = "telemetry")]
    pub fn set_metrics(&mut self, metrics: Option<crate::telemetry::Metrics>) {
        self.metrics = metrics.clone();
        self.ensure_metrics_propagated();
    }

    /// Set span recorder for distributed tracing
    #[cfg(feature = "telemetry")]
    pub fn set_span_recorder(&mut self, recorder: Option<crate::telemetry::SpanRecorder>) {
        self.span_recorder = recorder;
    }

    /// Get span context for distributed tracing
    #[cfg(feature = "telemetry")]
    pub fn get_span_context(&self) -> Option<&crate::telemetry::SpanContext> {
        self.span_context.as_ref()
    }

    /// Get span recorder for distributed tracing
    #[cfg(feature = "telemetry")]
    pub fn get_span_recorder(&self) -> Option<&crate::telemetry::SpanRecorder> {
        self.span_recorder.as_ref()
    }
    /// Ensure metrics are propagated to BlockStorage
    #[cfg(feature = "telemetry")]
    fn ensure_metrics_propagated(&self) {
        // Propagate metrics to BlockStorage via STORAGE_REGISTRY
        #[cfg(target_arch = "wasm32")]
        {
            use crate::vfs::indexeddb_vfs::get_storage_with_fallback;

            if self.metrics.is_none() {
                return;
            }

            let db_name = &self.name;

            if let Some(storage_rc) = get_storage_with_fallback(db_name) {
                use crate::vfs::indexeddb_vfs::with_storage_borrow_mut;
                let _ = with_storage_borrow_mut(&storage_rc, "set_metrics", |storage| {
                    storage.set_metrics(self.metrics.clone());
                    Ok(())
                });
            }
        }
    }

    pub async fn close_internal(&mut self) -> Result<(), DatabaseError> {
        log::info!("CLOSE_INTERNAL STARTED for: {}", self.name);

        // Check if connection is already null (e.g., after import force-close)
        if self.connection_state.db.get().is_null() {
            log::info!(
                "Connection already null for {}, skipping close operations",
                self.name
            );
            return Ok(());
        }

        // Checkpoint WAL data before close using PASSIVE mode (non-blocking)
        log::info!("Checkpointing WAL before close: {}", self.name);
        let _ = self
            .execute_internal("PRAGMA wal_checkpoint(PASSIVE)")
            .await;
        log::info!("WAL checkpoint completed for: {}", self.name);

        // Sync to IndexedDB before closing to ensure data persists
        log::info!("Syncing database before close: {}", self.name);
        self.sync_internal().await?;
        log::info!("Sync completed for: {}", self.name);

        web_sys::console::log_1(
            &format!("CLOSE: About to stop leader election for {}", self.name).into(),
        );

        // Stop leader election before closing
        #[cfg(target_arch = "wasm32")]
        {
            use crate::vfs::indexeddb_vfs::get_storage_with_fallback;

            let db_name = &self.name;
            web_sys::console::log_1(
                &format!("STOP_ELECTION: Getting storage for {}", db_name).into(),
            );
            log::info!("STOP_ELECTION: Getting storage for {}", db_name);
            let storage_rc = get_storage_with_fallback(db_name);

            if let Some(storage_rc) = storage_rc {
                log::info!("STOP_ELECTION: Found storage for {}, calling stop", db_name);
                match with_storage_async!(storage_rc, "stop_leader_election", |storage| storage
                    .stop_leader_election())
                {
                    Some(Ok(())) => {
                        log::info!("STOP_ELECTION: Successfully stopped for {}", db_name);
                    }
                    Some(Err(e)) => {
                        log::warn!("STOP_ELECTION: Failed for {}: {:?}", db_name, e);
                    }
                    None => {
                        log::warn!("STOP_ELECTION: Borrow failed for {}", db_name);
                    }
                }
            } else {
                log::warn!("STOP_ELECTION: No storage found for {}", db_name);
            }
            log::info!("STOP_ELECTION: Completed section for {}", db_name);
        }

        // NOTE: Do NOT call release_connection here
        // The Drop impl will handle releasing the connection when the Database instance is dropped
        // Calling it here would cause a double-release when both close() and Drop are called

        log::info!(
            "Closed database: {} (connection will be released on Drop)",
            self.name
        );
        Ok(())
    }

    /// Query database and return rows (alias for execute that returns rows)
    pub async fn query(&mut self, sql: &str) -> Result<Vec<Row>, DatabaseError> {
        let result = self.execute_internal(sql).await?;
        Ok(result.rows)
    }

    pub async fn sync_internal(&mut self) -> Result<(), DatabaseError> {
        // Start timing for telemetry
        #[cfg(all(target_arch = "wasm32", feature = "telemetry"))]
        let start_time = js_sys::Date::now();

        // Create span for VFS sync operation with automatic context linking
        #[cfg(feature = "telemetry")]
        let span = if self.span_recorder.is_some() {
            let mut builder = crate::telemetry::SpanBuilder::new("vfs_sync".to_string())
                .with_attribute("operation", "sync");

            // Automatically link to parent span via context and copy baggage
            if let Some(ref context) = self.span_context {
                builder = builder
                    .with_context(context)
                    .with_baggage_from_context(context);
            }

            let span = builder.build();

            // Enter this span's context
            if let Some(ref context) = self.span_context {
                context.enter_span(span.span_id.clone());
            }

            Some(span)
        } else {
            None
        };

        // Track sync operation start
        #[cfg(feature = "telemetry")]
        if let Some(ref metrics) = self.metrics {
            metrics.sync_operations_total().inc();
        }

        // Track blocks persisted for span attributes
        #[cfg(feature = "telemetry")]
        let mut blocks_count = 0;

        // Trigger VFS sync to persist all blocks to IndexedDB
        #[cfg(target_arch = "wasm32")]
        {
            use crate::storage::vfs_sync;

            // CRITICAL: Checkpoint WAL and flush page cache to ensure all data is in GLOBAL_STORAGE
            let db_ptr = self.connection_state.db.get();
            if !db_ptr.is_null() {
                // Step 1: Checkpoint WAL to write all WAL data to main database
                // TRUNCATE mode ensures WAL is cleared after checkpoint
                let checkpoint_sql =
                    std::ffi::CString::new("PRAGMA wal_checkpoint(TRUNCATE)").expect("valid SQL");
                let mut stmt: *mut sqlite_wasm_rs::sqlite3_stmt = std::ptr::null_mut();
                let prepare_result = unsafe {
                    sqlite_wasm_rs::sqlite3_prepare_v2(
                        db_ptr,
                        checkpoint_sql.as_ptr(),
                        -1,
                        &mut stmt,
                        std::ptr::null_mut(),
                    )
                };
                if prepare_result == sqlite_wasm_rs::SQLITE_OK && !stmt.is_null() {
                    unsafe {
                        sqlite_wasm_rs::sqlite3_step(stmt);
                        sqlite_wasm_rs::sqlite3_finalize(stmt);
                    }
                    log::debug!("WAL checkpoint completed");
                }

                // Step 2: Flush page cache to VFS
                let flush_result = unsafe { sqlite_wasm_rs::sqlite3_db_cacheflush(db_ptr) };
                if flush_result != sqlite_wasm_rs::SQLITE_OK {
                    log::warn!("sqlite3_db_cacheflush returned {}", flush_result);
                }
            }

            // Collect blocks from GLOBAL_STORAGE (where VFS writes them)
            // CRITICAL: Use self.name WITH .db - matches main branch behavior
            // Database.name already normalized by normalize_db_name() in Database::new()
            let storage_name = &self.name;

            // Advance commit marker
            let next_commit = vfs_sync::with_global_commit_marker(|cm| {
                #[cfg(target_arch = "wasm32")]
                let mut cm_ref = cm.borrow_mut();
                #[cfg(not(target_arch = "wasm32"))]
                let mut cm_ref = cm.lock();

                let current = cm_ref.get(storage_name).copied().unwrap_or(0);
                let new_marker = current + 1;
                cm_ref.insert(storage_name.to_string(), new_marker);
                log::debug!(
                    "Advanced commit marker for {} from {} to {}",
                    storage_name,
                    current,
                    new_marker
                );
                new_marker
            });

            web_sys::console::log_1(
                &format!(
                    "[SYNC] Collecting blocks from GLOBAL_STORAGE for: {}",
                    storage_name
                )
                .into(),
            );
            let (blocks_to_persist, metadata_to_persist) =
                vfs_sync::with_global_storage(|storage| {
                    #[cfg(target_arch = "wasm32")]
                    let storage_map = storage.borrow();
                    #[cfg(not(target_arch = "wasm32"))]
                    let storage_map = storage.lock();

                    let blocks = if let Some(db_storage) = storage_map.get(storage_name) {
                        let count = db_storage.len();
                        web_sys::console::log_1(
                            &format!("[SYNC] Found {} blocks in GLOBAL_STORAGE", count).into(),
                        );
                        db_storage
                            .iter()
                            .map(|(&id, data)| (id, data.clone()))
                            .collect::<Vec<_>>()
                    } else {
                        web_sys::console::log_1(
                            &format!(
                                "[SYNC] No blocks found in GLOBAL_STORAGE for {}",
                                storage_name
                            )
                            .into(),
                        );
                        Vec::new()
                    };

                    let metadata = vfs_sync::with_global_metadata(|meta| {
                        #[cfg(target_arch = "wasm32")]
                        let meta_map = meta.borrow();
                        #[cfg(not(target_arch = "wasm32"))]
                        let meta_map = meta.lock();
                        if let Some(db_meta) = meta_map.get(storage_name) {
                            let count = db_meta.len();
                            web_sys::console::log_1(
                                &format!("[SYNC] Found {} metadata entries", count).into(),
                            );
                            db_meta
                                .iter()
                                .map(|(&id, metadata)| (id, metadata.checksum))
                                .collect::<Vec<_>>()
                        } else {
                            web_sys::console::log_1(&format!("[SYNC] No metadata found").into());
                            Vec::new()
                        }
                    });

                    (blocks, metadata)
                });

            web_sys::console::log_1(
                &format!(
                    "[SYNC] Preparing to persist {} blocks to IndexedDB",
                    blocks_to_persist.len()
                )
                .into(),
            );

            if !blocks_to_persist.is_empty() {
                #[cfg(feature = "telemetry")]
                {
                    blocks_count = blocks_to_persist.len();
                }
                web_sys::console::log_1(
                    &format!(
                        "[SYNC] Persisting {} blocks to IndexedDB",
                        blocks_to_persist.len()
                    )
                    .into(),
                );
                crate::storage::wasm_indexeddb::persist_to_indexeddb_event_based(
                    storage_name,
                    blocks_to_persist,
                    metadata_to_persist,
                    next_commit,
                    #[cfg(feature = "telemetry")]
                    self.span_recorder.clone(),
                    #[cfg(feature = "telemetry")]
                    span.as_ref().map(|s| s.span_id.clone()),
                )
                .await?;
                web_sys::console::log_1(
                    &format!("[SYNC] Successfully persisted to IndexedDB").into(),
                );
            } else {
                web_sys::console::log_1(
                    &format!("[SYNC] WARNING: No blocks to persist - GLOBAL_STORAGE is empty!")
                        .into(),
                );
            }

            // Send notification after successful sync
            use crate::storage::broadcast_notifications::{
                BroadcastNotification, send_change_notification,
            };

            let notification = BroadcastNotification::DataChanged {
                db_name: self.name.clone(),
                timestamp: js_sys::Date::now() as u64,
            };

            log::debug!("Sending DataChanged notification for {}", self.name);

            if let Err(e) = send_change_notification(&notification) {
                log::warn!("Failed to send change notification: {}", e);
                // Don't fail the sync if notification fails
            }
        }

        // Record sync duration
        #[cfg(all(target_arch = "wasm32", feature = "telemetry"))]
        if let Some(ref metrics) = self.metrics {
            let duration_ms = js_sys::Date::now() - start_time;
            metrics.sync_duration().observe(duration_ms);
        }

        // Finish span successfully
        #[cfg(feature = "telemetry")]
        if let Some(mut s) = span {
            s.status = crate::telemetry::SpanStatus::Ok;
            #[cfg(target_arch = "wasm32")]
            {
                s.end_time_ms = Some(js_sys::Date::now());
                let duration_ms = s.end_time_ms.unwrap() - s.start_time_ms;
                s.attributes
                    .insert("duration_ms".to_string(), duration_ms.to_string());
            }
            #[cfg(not(target_arch = "wasm32"))]
            {
                let now = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_millis() as f64;
                s.end_time_ms = Some(now);
                let duration_ms = s.end_time_ms.unwrap() - s.start_time_ms;
                s.attributes
                    .insert("duration_ms".to_string(), duration_ms.to_string());
            }
            s.attributes
                .insert("blocks_persisted".to_string(), blocks_count.to_string());
            if let Some(recorder) = &self.span_recorder {
                recorder.record_span(s);
            }

            // Exit span context
            if let Some(ref context) = self.span_context {
                context.exit_span();
            }
        }

        Ok(())
    }
}

#[cfg(target_arch = "wasm32")]
impl Drop for Database {
    fn drop(&mut self) {
        web_sys::console::log_1(&format!("DROP: Releasing connection for {}", self.name).into());

        // Release the connection back to the pool
        // The pool will close it if this was the last reference
        // Pool uses name without .db, so strip it
        let pool_key = self.name.trim_end_matches(".db");
        crate::connection_pool::release_connection(pool_key);

        web_sys::console::log_1(&format!("DROP: Connection released for {}", self.name).into());

        // CRITICAL: Stop heartbeat interval synchronously to prevent leaks
        use crate::vfs::indexeddb_vfs::get_storage_with_fallback;
        if let Some(storage_rc) = get_storage_with_fallback(&self.name) {
            // No outer borrow needed - BlockStorage uses RefCell for interior mutability
            let storage = &*storage_rc;
            // Try to borrow manager - if it fails, skip (already being cleaned)
            if let Ok(mut manager_ref) = storage.leader_election.try_borrow_mut() {
                if let Some(ref mut manager) = *manager_ref {
                    // Clear interval if it exists (idempotent)
                    if let Some(interval_id) = manager.heartbeat_interval.take() {
                        if let Some(window) = web_sys::window() {
                            window.clear_interval_with_handle(interval_id);
                            web_sys::console::log_1(
                                &format!(
                                    "DROP: Cleared heartbeat interval {} for {}",
                                    interval_id, self.name
                                )
                                .into(),
                            );
                        }
                    }
                    // Note: heartbeat closure is intentionally leaked (via forget())
                    // and becomes a no-op when heartbeat_valid is set to false
                }
            } else {
                // Manager already borrowed - skip (first DB is cleaning up)
                web_sys::console::log_1(
                    &format!(
                        "[DROP] Skipping {} (heartbeat already stopped by shared DB)",
                        self.name
                    )
                    .into(),
                );
            }
        }

        // Keep BlockStorage in STORAGE_REGISTRY so multiple Database instances
        // with the same name share the same BlockStorage and leader election state
        // Blocks persist in GLOBAL_STORAGE across Database instances
        log::debug!(
            "Closed database: {} (BlockStorage remains in registry)",
            self.name
        );
    }
}

// Add wasm_bindgen exports for the main Database struct
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
impl Database {
    #[wasm_bindgen(js_name = "newDatabase")]
    pub async fn new_wasm(name: String) -> Result<Database, JsValue> {
        // Normalize database name: ensure it has .db suffix
        let normalized_name = if name.ends_with(".db") {
            name.clone()
        } else {
            format!("{}.db", name)
        };

        let config = DatabaseConfig {
            name: normalized_name.clone(),
            version: Some(1),
            cache_size: Some(10_000),
            page_size: Some(4096),
            auto_vacuum: Some(true),
            journal_mode: Some("WAL".to_string()),
            max_export_size_bytes: Some(2 * 1024 * 1024 * 1024), // 2GB default
        };

        let db = Database::new(config)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to create database: {}", e)))?;

        // Start listening for write queue requests (leader will process them)
        Self::start_write_queue_listener(&normalized_name)?;

        Ok(db)
    }

    /// Get the database name
    #[wasm_bindgen(getter)]
    pub fn name(&self) -> String {
        self.name.clone()
    }

    /// Get all database names stored in IndexedDB
    ///
    /// Returns an array of database names (sorted alphabetically)
    #[wasm_bindgen(js_name = "getAllDatabases")]
    pub async fn get_all_databases() -> Result<JsValue, JsValue> {
        use crate::storage::vfs_sync::with_global_storage;
        use crate::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        use std::collections::HashSet;

        log::info!("getAllDatabases called");
        let mut db_names = HashSet::new();

        // Get databases from persistent list (localStorage)
        match Self::get_persistent_database_list() {
            Ok(persistent_list) => {
                log::info!("Persistent list has {} entries", persistent_list.len());
                for name in persistent_list {
                    log::info!("Found in persistent list: {}", name);
                    db_names.insert(name);
                }
            }
            Err(e) => {
                log::warn!("Failed to get persistent list: {:?}", e);
            }
        }

        // Get databases from STORAGE_REGISTRY (currently open)
        // SAFETY: WASM is single-threaded, no concurrent access possible
        STORAGE_REGISTRY.with(|reg| unsafe {
            let registry = &*reg.get();
            log::info!("STORAGE_REGISTRY has {} entries", registry.len());
            for key in registry.keys() {
                log::info!("Found in STORAGE_REGISTRY: {}", key);
                db_names.insert(key.clone());
            }
        });

        // Get databases from GLOBAL_STORAGE (in-memory persistent storage)
        with_global_storage(|storage| {
            let storage_borrow = storage.borrow();
            log::info!("GLOBAL_STORAGE has {} entries", storage_borrow.len());
            for key in storage_borrow.keys() {
                log::info!("Found in GLOBAL_STORAGE: {}", key);
                db_names.insert(key.clone());
            }
        });

        log::info!("Total unique databases found: {}", db_names.len());

        // Convert to sorted vector
        let mut result_vec: Vec<String> = db_names.into_iter().collect();
        result_vec.sort();

        // Convert to JavaScript array
        let js_array = js_sys::Array::new();
        for name in &result_vec {
            log::info!("Returning database: {}", name);
            js_array.push(&JsValue::from_str(name));
        }

        log::info!("getAllDatabases returning {} databases", result_vec.len());

        Ok(js_array.into())
    }

    /// Delete a database from storage
    ///
    /// Removes database from both STORAGE_REGISTRY and GLOBAL_STORAGE
    #[wasm_bindgen(js_name = "deleteDatabase")]
    pub async fn delete_database(name: String) -> Result<(), JsValue> {
        use crate::storage::vfs_sync::{
            with_global_commit_marker, with_global_metadata, with_global_storage,
        };

        // Normalize database name
        let normalized_name = if name.ends_with(".db") {
            name.clone()
        } else {
            format!("{}.db", name)
        };

        log::info!("Deleting database: {}", normalized_name);

        // Remove from STORAGE_REGISTRY
        use crate::vfs::indexeddb_vfs::remove_storage_from_registry;
        remove_storage_from_registry(&normalized_name);

        // Remove from GLOBAL_STORAGE
        with_global_storage(|gs| {
            #[cfg(target_arch = "wasm32")]
            let mut storage = gs.borrow_mut();
            #[cfg(not(target_arch = "wasm32"))]
            let mut storage = gs.lock();
            storage.remove(&normalized_name);
        });

        // Remove from GLOBAL_METADATA
        with_global_metadata(|gm| {
            #[cfg(target_arch = "wasm32")]
            let mut metadata = gm.borrow_mut();
            #[cfg(not(target_arch = "wasm32"))]
            let mut metadata = gm.lock();
            metadata.remove(&normalized_name);
        });

        // Remove from commit markers
        with_global_commit_marker(|cm| {
            #[cfg(target_arch = "wasm32")]
            let mut markers = cm.borrow_mut();
            #[cfg(not(target_arch = "wasm32"))]
            let mut markers = cm.lock();
            log::info!(
                "Cleared commit marker for {} from GLOBAL storage",
                normalized_name
            );
            markers.remove(&normalized_name);
        });

        // Delete from IndexedDB
        let idb_name = format!("absurder_{}", normalized_name);
        let _delete_promise = js_sys::eval(&format!("indexedDB.deleteDatabase('{}')", idb_name))
            .map_err(|e| JsValue::from_str(&format!("Failed to delete IndexedDB: {:?}", e)))?;

        log::info!("Database deleted: {}", normalized_name);

        // Remove from persistent list
        Self::remove_database_from_persistent_list(&normalized_name)?;

        Ok(())
    }

    /// Add database name to persistent list in localStorage
    #[allow(dead_code)]
    fn add_database_to_persistent_list(db_name: &str) -> Result<(), JsValue> {
        log::info!("add_database_to_persistent_list called for: {}", db_name);

        let window = web_sys::window().ok_or_else(|| {
            log::error!("No window object");
            JsValue::from_str("No window")
        })?;

        let storage = window
            .local_storage()
            .map_err(|e| {
                log::error!("Failed to get localStorage: {:?}", e);
                JsValue::from_str("No localStorage")
            })?
            .ok_or_else(|| {
                log::error!("localStorage not available");
                JsValue::from_str("localStorage not available")
            })?;

        let key = "absurder_db_list";
        let existing = storage.get_item(key).map_err(|e| {
            log::error!("Failed to read localStorage key {}: {:?}", key, e);
            JsValue::from_str("Failed to read localStorage")
        })?;

        log::debug!("Existing localStorage value: {:?}", existing);

        let mut db_list: Vec<String> = if let Some(json_str) = existing {
            match serde_json::from_str(&json_str) {
                Ok(list) => {
                    log::debug!("Parsed existing list: {:?}", list);
                    list
                }
                Err(e) => {
                    log::warn!("Failed to parse localStorage JSON: {}, starting fresh", e);
                    Vec::new()
                }
            }
        } else {
            log::debug!("No existing list, creating new");
            Vec::new()
        };

        if !db_list.contains(&db_name.to_string()) {
            db_list.push(db_name.to_string());
            db_list.sort();
            log::debug!("Updated list: {:?}", db_list);

            let json_str = serde_json::to_string(&db_list).map_err(|e| {
                log::error!("Failed to serialize list: {}", e);
                JsValue::from_str("Failed to serialize")
            })?;

            log::debug!("Writing to localStorage: {}", json_str);

            storage.set_item(key, &json_str).map_err(|e| {
                log::error!("Failed to write to localStorage: {:?}", e);
                JsValue::from_str("Failed to write localStorage")
            })?;

            log::info!("Successfully added {} to persistent database list", db_name);
        } else {
            log::info!("{} already in persistent list", db_name);
        }

        Ok(())
    }

    /// Remove database name from persistent list in localStorage
    fn remove_database_from_persistent_list(db_name: &str) -> Result<(), JsValue> {
        let window = web_sys::window().ok_or_else(|| JsValue::from_str("No window"))?;
        let storage = window
            .local_storage()
            .map_err(|_| JsValue::from_str("No localStorage"))?
            .ok_or_else(|| JsValue::from_str("localStorage not available"))?;

        let key = "absurder_db_list";
        let existing = storage
            .get_item(key)
            .map_err(|_| JsValue::from_str("Failed to read localStorage"))?;

        if let Some(json_str) = existing {
            let mut db_list: Vec<String> =
                serde_json::from_str(&json_str).unwrap_or_else(|_| Vec::new());
            db_list.retain(|name| name != db_name);
            let json_str = serde_json::to_string(&db_list)
                .map_err(|_| JsValue::from_str("Failed to serialize"))?;
            storage
                .set_item(key, &json_str)
                .map_err(|_| JsValue::from_str("Failed to write localStorage"))?;
            log::info!("Removed {} from persistent database list", db_name);
        }

        Ok(())
    }

    /// Get database names from persistent list in localStorage
    fn get_persistent_database_list() -> Result<Vec<String>, JsValue> {
        log::info!("get_persistent_database_list called");

        let window = web_sys::window().ok_or_else(|| {
            log::error!("No window object");
            JsValue::from_str("No window")
        })?;

        let storage = window
            .local_storage()
            .map_err(|e| {
                log::error!("Failed to get localStorage: {:?}", e);
                JsValue::from_str("No localStorage")
            })?
            .ok_or_else(|| {
                log::error!("localStorage not available");
                JsValue::from_str("localStorage not available")
            })?;

        let key = "absurder_db_list";
        let existing = storage.get_item(key).map_err(|e| {
            log::error!("Failed to read localStorage key {}: {:?}", key, e);
            JsValue::from_str("Failed to read localStorage")
        })?;

        log::debug!("Read from localStorage: {:?}", existing);

        if let Some(json_str) = existing {
            match serde_json::from_str::<Vec<String>>(&json_str) {
                Ok(db_list) => {
                    log::info!(
                        "Successfully parsed {} databases from localStorage",
                        db_list.len()
                    );
                    log::debug!("Database list: {:?}", db_list);
                    Ok(db_list)
                }
                Err(e) => {
                    log::error!("Failed to parse localStorage JSON: {}", e);
                    Ok(Vec::new())
                }
            }
        } else {
            log::info!("No persistent database list in localStorage");
            Ok(Vec::new())
        }
    }

    /// Start listening for write queue requests (leader processes these)
    fn start_write_queue_listener(db_name: &str) -> Result<(), JsValue> {
        use crate::storage::write_queue::{
            WriteQueueMessage, WriteResponse, register_write_queue_listener,
        };
        use crate::vfs::indexeddb_vfs::get_storage_with_fallback;

        let db_name_clone = db_name.to_string();

        let callback = Closure::wrap(Box::new(move |msg: JsValue| {
            let db_name_inner = db_name_clone.clone();

            // Parse the message
            if let Ok(json_str) = js_sys::JSON::stringify(&msg) {
                if let Some(json_str) = json_str.as_string() {
                    if let Ok(message) = serde_json::from_str::<WriteQueueMessage>(&json_str) {
                        if let WriteQueueMessage::WriteRequest(request) = message {
                            log::debug!("Leader received write request: {}", request.request_id);

                            // Check if we're the leader
                            let storage_rc = get_storage_with_fallback(&db_name_inner);

                            if let Some(storage) = storage_rc {
                                // Spawn async task to process the write
                                wasm_bindgen_futures::spawn_local(async move {
                                    let is_leader = with_storage_async!(
                                        storage,
                                        "write_queue_is_leader",
                                        |s| s.is_leader()
                                    );
                                    if is_leader.is_none() {
                                        log::error!("Failed to check leader status");
                                        return;
                                    }
                                    let is_leader = is_leader.unwrap();

                                    if !is_leader {
                                        log::error!("Not leader, ignoring write request");
                                        return;
                                    }

                                    log::debug!("Processing write request as leader");

                                    // Create a temporary database instance to execute the SQL
                                    match Database::new_wasm(db_name_inner.clone()).await {
                                        Ok(mut db) => {
                                            // Execute the SQL
                                            match db.execute_internal(&request.sql).await {
                                                Ok(result) => {
                                                    // Send success response
                                                    let response = WriteResponse::Success {
                                                        request_id: request.request_id.clone(),
                                                        affected_rows: result.affected_rows
                                                            as usize,
                                                    };

                                                    use crate::storage::write_queue::send_write_response;
                                                    if let Err(e) = send_write_response(
                                                        &db_name_inner,
                                                        response,
                                                    ) {
                                                        log::error!(
                                                            "Failed to send response: {}",
                                                            e
                                                        );
                                                    } else {
                                                        log::info!(
                                                            "Write response sent successfully"
                                                        );
                                                    }
                                                }
                                                Err(e) => {
                                                    // Send error response
                                                    let response = WriteResponse::Error {
                                                        request_id: request.request_id.clone(),
                                                        error_message: e.to_string(),
                                                    };

                                                    use crate::storage::write_queue::send_write_response;
                                                    if let Err(e) = send_write_response(
                                                        &db_name_inner,
                                                        response,
                                                    ) {
                                                        log::error!(
                                                            "Failed to send error response: {}",
                                                            e
                                                        );
                                                    }
                                                }
                                            }
                                        }
                                        Err(e) => {
                                            log::error!(
                                                "Failed to create db for write processing: {:?}",
                                                e
                                            );
                                        }
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }) as Box<dyn FnMut(JsValue)>);

        let callback_fn = callback.as_ref().unchecked_ref();
        register_write_queue_listener(db_name, callback_fn).map_err(|e| {
            JsValue::from_str(&format!("Failed to register write queue listener: {}", e))
        })?;

        callback.forget();

        Ok(())
    }

    #[wasm_bindgen]
    pub async fn execute(&mut self, sql: &str) -> Result<JsValue, JsValue> {
        // Check write permission before executing
        self.check_write_permission(sql)
            .await
            .map_err(|e| JsValue::from_str(&format!("Write permission denied: {}", e)))?;

        let result = self
            .execute_internal(sql)
            .await
            .map_err(|e| JsValue::from_str(&format!("Query execution failed: {}", e)))?;
        serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen(js_name = "executeWithParams")]
    pub async fn execute_with_params(
        &mut self,
        sql: &str,
        params: JsValue,
    ) -> Result<JsValue, JsValue> {
        let params: Vec<ColumnValue> = serde_wasm_bindgen::from_value(params)
            .map_err(|e| JsValue::from_str(&format!("Invalid parameters: {}", e)))?;

        // Check write permission before executing
        self.check_write_permission(sql)
            .await
            .map_err(|e| JsValue::from_str(&format!("Write permission denied: {}", e)))?;

        let result = self
            .execute_with_params_internal(sql, &params)
            .await
            .map_err(|e| JsValue::from_str(&format!("Query execution failed: {}", e)))?;
        serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen]
    pub async fn close(&mut self) -> Result<(), JsValue> {
        self.close_internal()
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to close database: {}", e)))
    }

    /// Force close connection and remove from pool (for test cleanup)
    #[wasm_bindgen(js_name = "forceCloseConnection")]
    pub async fn force_close_connection(&mut self) -> Result<(), JsValue> {
        // First do normal close to cleanup
        let _ = self.close_internal().await;

        // Then force-remove from connection pool
        // Pool uses name without .db, so strip it
        let pool_key = self.name.trim_end_matches(".db");
        crate::connection_pool::force_close_connection(pool_key);

        // CRITICAL: Single source of truth for ALL cleanup
        #[cfg(target_arch = "wasm32")]
        {
            crate::cleanup::cleanup_all_state(pool_key)
                .await
                .map_err(|e| JsValue::from_str(&format!("Cleanup failed: {}", e)))?;
        }
        log::info!("Force closed and removed connection for: {}", self.name);
        Ok(())
    }

    #[wasm_bindgen]
    pub async fn sync(&mut self) -> Result<(), JsValue> {
        self.sync_internal()
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to sync database: {}", e)))
    }

    /// Allow non-leader writes (for single-tab apps or testing)
    #[wasm_bindgen(js_name = "allowNonLeaderWrites")]
    pub async fn allow_non_leader_writes(&mut self, allow: bool) -> Result<(), JsValue> {
        log::debug!("Setting allowNonLeaderWrites = {} for {}", allow, self.name);
        self.allow_non_leader_writes = allow;
        Ok(())
    }

    /// Export database to SQLite .db file format
    ///
    /// Returns the complete database as a Uint8Array that can be downloaded
    /// or saved as a standard SQLite .db file.
    ///
    /// # Example
    /// ```javascript
    /// const dbBytes = await db.exportToFile();
    /// const blob = new Blob([dbBytes], { type: 'application/x-sqlite3' });
    /// const url = URL.createObjectURL(blob);
    /// const a = document.createElement('a');
    /// a.href = url;
    /// a.download = 'database.db';
    /// a.click();
    /// ```
    #[wasm_bindgen(js_name = "exportToFile")]
    pub async fn export_to_file(&self) -> Result<js_sys::Uint8Array, JsValue> {
        let db_name = self.name.clone();
        let max_export_size = self.max_export_size_bytes;

        log::info!("[EXPORT] ===== Step 1: Acquiring lock");

        // Acquire lock FIRST to serialize operations
        let _guard = weblocks::acquire(&db_name, weblocks::AcquireOptions::exclusive()).await?;
        log::info!("[EXPORT] ===== Step 2: Lock acquired");

        // Get storage and sync AFTER lock - this ensures only one export syncs at a time
        use crate::vfs::indexeddb_vfs::get_storage_with_fallback;
        log::info!("[EXPORT] ===== Step 3: Getting storage");
        let storage_rc = get_storage_with_fallback(&db_name).ok_or_else(|| {
            JsValue::from_str(&format!("Storage not found for database: {}", db_name))
        })?;
        log::info!("[EXPORT] ===== Step 4: Got storage, reloading cache");

        // Reload cache from GLOBAL_STORAGE
        #[cfg(target_arch = "wasm32")]
        {
            storage_rc.reload_cache_from_global_storage();
        }

        // CRITICAL: Checkpoint WAL to flush SQLite data to VFS blocks before export
        // Without this, data stays in SQLite's WAL buffer and doesn't appear in exported bytes
        log::info!("[EXPORT] ===== Step 5: Checkpointing WAL");
        if !self.connection_state.db.get().is_null() {
            // Use raw SQLite call since export_to_file takes &self, not &mut self
            use std::ffi::CString;
            let pragma = CString::new("PRAGMA wal_checkpoint(PASSIVE)").unwrap();
            unsafe {
                let mut stmt = std::ptr::null_mut();
                let rc = sqlite_wasm_rs::sqlite3_prepare_v2(
                    self.connection_state.db.get(),
                    pragma.as_ptr(),
                    -1,
                    &mut stmt,
                    std::ptr::null_mut(),
                );
                if rc == sqlite_wasm_rs::SQLITE_OK && !stmt.is_null() {
                    sqlite_wasm_rs::sqlite3_step(stmt);
                    sqlite_wasm_rs::sqlite3_finalize(stmt);
                    log::info!("[EXPORT] WAL checkpoint completed");
                } else {
                    log::warn!("[EXPORT] WAL checkpoint failed with rc: {}", rc);
                }
            }
        }

        log::info!("[EXPORT] ===== Step 6: Starting sync");
        // Sync to ensure all data is persisted before export
        storage_rc
            .sync()
            .await
            .map_err(|e| JsValue::from_str(&format!("Sync failed: {}", e)))?;
        log::info!("[EXPORT] ===== Step 7: Sync complete");

        // Export with configured size limit
        log::info!("[EXPORT] Calling export_database_to_bytes");
        let db_bytes = {
            let storage = &*storage_rc;
            crate::storage::export::export_database_to_bytes(storage, max_export_size)
                .await
                .map_err(|e| {
                    log::error!("[EXPORT] Export failed: {}", e);
                    JsValue::from_str(&format!("Export failed: {}", e))
                })?
        };

        log::info!("[EXPORT] Export complete: {} bytes", db_bytes.len());

        let uint8_array = js_sys::Uint8Array::new_with_length(db_bytes.len() as u32);
        uint8_array.copy_from(&db_bytes);

        Ok(uint8_array)
    }

    /// Test method for concurrent locking - simple increment counter
    #[wasm_bindgen(js_name = "testLock")]
    pub async fn test_lock(&self, value: u32) -> Result<u32, JsValue> {
        let lock_name = format!("{}.lock_test", self.name);

        log::info!(
            "[LOCK-TEST] Acquiring lock: {} with value: {}",
            lock_name,
            value
        );
        let _guard = weblocks::acquire(&lock_name, weblocks::AcquireOptions::exclusive()).await?;
        log::info!("[LOCK-TEST] Lock acquired, processing value: {}", value);

        // Simulate some work
        let result = value + 1;

        // Small delay to test serialization
        let delay_promise = js_sys::Promise::new(&mut |resolve, _reject| {
            let window = web_sys::window().unwrap();
            let _ = window
                .set_timeout_with_callback_and_timeout_and_arguments_0(resolve.unchecked_ref(), 10);
        });
        wasm_bindgen_futures::JsFuture::from(delay_promise).await?;

        log::info!(
            "[LOCK-TEST] Lock releasing for: {} with result: {}",
            lock_name,
            result
        );
        Ok(result)
    }

    /// Import SQLite database from .db file bytes
    ///
    /// Replaces the current database contents with the imported data.
    /// This will close the current database connection and clear all existing data.
    ///
    /// # Arguments
    /// * `file_data` - SQLite .db file as Uint8Array
    ///
    /// # Returns
    /// * `Ok(())` - Import successful
    /// * `Err(JsValue)` - Import failed (invalid file, validation error, etc.)
    ///
    /// # Example
    /// ```javascript
    /// // From file input
    /// const fileInput = document.getElementById('dbFile');
    /// const file = fileInput.files[0];
    /// const arrayBuffer = await file.arrayBuffer();
    /// const uint8Array = new Uint8Array(arrayBuffer);
    ///
    /// await db.importFromFile(uint8Array);
    ///
    /// // Database is immediately usable after import (no reopen needed)
    /// const result = await db.execute('SELECT * FROM imported_table');
    /// ```
    ///
    /// # Warning
    /// This operation is destructive and will replace all existing database data.
    #[wasm_bindgen(js_name = "importFromFile")]
    pub async fn import_from_file(&mut self, file_data: js_sys::Uint8Array) -> Result<(), JsValue> {
        log::info!("[IMPORT] Starting import with lock for: {}", self.name);
        let db_name = self.name.clone();
        let data = file_data.to_vec();

        // Acquire lock FIRST to serialize operations
        let _guard = weblocks::acquire(&db_name, weblocks::AcquireOptions::exclusive()).await?;
        log::info!("[IMPORT] Lock acquired for: {}", db_name);

        log::debug!("Import data size: {} bytes", data.len());

        // CRITICAL: Force-close database connection BEFORE import
        // Must use force_close to remove from connection pool, not just decrement ref_count
        // Otherwise new Database instances will reuse stale SQLite connection
        log::debug!("Force-closing database connection before import");

        // First do normal close to cleanup leader election etc
        self.close_internal()
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to close before import: {}", e)))?;

        // Then force-remove from connection pool
        let pool_key = self.name.trim_end_matches(".db");
        crate::connection_pool::force_close_connection(pool_key);

        // Mark our connection as null since we force-closed it
        self.connection_state.db.set(std::ptr::null_mut());
        log::debug!("Removed connection from pool for import");

        // Call the import function with full name (WITH .db)
        crate::storage::import::import_database_from_bytes(&db_name, data)
            .await
            .map_err(|e| {
                log::error!("Import failed for {}: {}", db_name, e);
                JsValue::from_str(&format!("Import failed: {}", e))
            })?;

        log::info!("[IMPORT] Import complete for: {}", db_name);

        // Reopen the SQLite connection so this Database instance is usable after import
        // The VFS should already exist from when the Database was first created
        log::info!("[IMPORT] Reopening connection for: {}", db_name);

        use std::ffi::CString;

        let vfs_name = format!("vfs_{}", db_name.trim_end_matches(".db"));
        let pool_key = db_name.trim_end_matches(".db").to_string();
        let db_name_for_closure = db_name.clone();
        let vfs_name_for_closure = vfs_name.clone();

        let new_state = crate::connection_pool::get_or_create_connection(&pool_key, || {
            let mut db = std::ptr::null_mut();
            let db_name_cstr = CString::new(db_name_for_closure.clone())
                .map_err(|_| "Invalid database name".to_string())?;
            let vfs_cstr = CString::new(vfs_name_for_closure.as_str())
                .map_err(|_| "Invalid VFS name".to_string())?;

            log::info!(
                "[IMPORT] Reopening database: {} with VFS: {}",
                db_name_for_closure,
                vfs_name_for_closure
            );

            let ret = unsafe {
                sqlite_wasm_rs::sqlite3_open_v2(
                    db_name_cstr.as_ptr(),
                    &mut db as *mut _,
                    sqlite_wasm_rs::SQLITE_OPEN_READWRITE | sqlite_wasm_rs::SQLITE_OPEN_CREATE,
                    vfs_cstr.as_ptr(),
                )
            };

            if ret != sqlite_wasm_rs::SQLITE_OK {
                let err_msg = unsafe {
                    let msg_ptr = sqlite_wasm_rs::sqlite3_errmsg(db);
                    if !msg_ptr.is_null() {
                        std::ffi::CStr::from_ptr(msg_ptr)
                            .to_string_lossy()
                            .into_owned()
                    } else {
                        "Unknown error".to_string()
                    }
                };
                return Err(format!(
                    "Failed to reopen database after import: {}",
                    err_msg
                ));
            }

            log::info!("[IMPORT] Database reopened successfully");
            Ok(db)
        })
        .map_err(|e| {
            JsValue::from_str(&format!("Failed to reopen connection after import: {}", e))
        })?;

        // Update our connection state to use the new connection
        self.connection_state = new_state;
        log::info!("[IMPORT] Connection state updated for: {}", db_name);

        Ok(())
    }

    /// Wait for this instance to become leader
    #[wasm_bindgen(js_name = "waitForLeadership")]
    pub async fn wait_for_leadership(&mut self) -> Result<(), JsValue> {
        use crate::vfs::indexeddb_vfs::get_storage_with_fallback;

        // Track leader election attempt
        #[cfg(feature = "telemetry")]
        if let Some(ref metrics) = self.metrics {
            metrics.leader_election_attempts_total().inc();
        }

        let db_name = &self.name;
        let start_time = js_sys::Date::now();

        let timeout_ms = 5000.0; // 5 second timeout

        loop {
            let storage_rc = get_storage_with_fallback(db_name);

            if let Some(storage) = storage_rc {
                let is_leader =
                    match with_storage_async!(storage, "wait_for_leadership", |s| s.is_leader()) {
                        Some(v) => v,
                        None => continue,
                    };

                if is_leader {
                    log::info!("Became leader for {}", db_name);

                    // Record telemetry on successful leadership acquisition
                    #[cfg(feature = "telemetry")]
                    if let Some(ref metrics) = self.metrics {
                        let duration_ms = js_sys::Date::now() - start_time;
                        metrics.leader_election_duration().observe(duration_ms);
                        metrics.is_leader().set(1.0);
                        metrics.leadership_changes_total().inc();
                    }

                    return Ok(());
                }
            }

            // Check timeout
            if js_sys::Date::now() - start_time > timeout_ms {
                // Record telemetry on timeout
                #[cfg(feature = "telemetry")]
                if let Some(ref metrics) = self.metrics {
                    let duration_ms = js_sys::Date::now() - start_time;
                    metrics.leader_election_duration().observe(duration_ms);
                }

                return Err(JsValue::from_str("Timeout waiting for leadership"));
            }

            // Wait a bit before checking again
            let promise = js_sys::Promise::new(&mut |resolve, _| {
                let window = web_sys::window().expect("should have window");
                let _ = window.set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, 100);
            });
            let _ = wasm_bindgen_futures::JsFuture::from(promise).await;
        }
    }

    /// Request leadership (triggers re-election check)
    #[wasm_bindgen(js_name = "requestLeadership")]
    pub async fn request_leadership(&mut self) -> Result<(), JsValue> {
        use crate::vfs::indexeddb_vfs::get_storage_with_fallback;

        let db_name = &self.name;
        log::debug!("Requesting leadership for {}", db_name);

        // Record telemetry data before the request
        #[cfg(feature = "telemetry")]
        let telemetry_data = if self.metrics.is_some() {
            let start_time = js_sys::Date::now();
            let was_leader = self
                .is_leader_wasm()
                .await
                .ok()
                .and_then(|v| v.as_bool())
                .unwrap_or(false);

            if let Some(ref metrics) = self.metrics {
                metrics.leader_elections_total().inc();
            }

            Some((start_time, was_leader))
        } else {
            None
        };

        let storage_rc = get_storage_with_fallback(db_name);

        if let Some(storage) = storage_rc {
            {
                // Trigger leader election
                let result = with_storage_async!(storage, "request_leadership", |s| s
                    .start_leader_election())
                .ok_or_else(|| {
                    JsValue::from_str("Failed to acquire storage lock for leadership request")
                })?;
                result.map_err(|e| {
                    JsValue::from_str(&format!("Failed to request leadership: {}", e))
                })?;

                log::debug!("Re-election triggered for {}", db_name);
            } // Drop the borrow here

            // Record telemetry after election (after dropping borrow)
            #[cfg(feature = "telemetry")]
            if let Some((start_time, was_leader)) = telemetry_data {
                if let Some(ref metrics) = self.metrics {
                    // Record election duration
                    let duration_ms = js_sys::Date::now() - start_time;
                    metrics.leader_election_duration().observe(duration_ms);

                    // Check if leadership status changed
                    let is_leader_now = self
                        .is_leader_wasm()
                        .await
                        .ok()
                        .and_then(|v| v.as_bool())
                        .unwrap_or(false);

                    // Update is_leader gauge
                    metrics
                        .is_leader()
                        .set(if is_leader_now { 1.0 } else { 0.0 });

                    // Track leadership changes
                    if was_leader != is_leader_now {
                        metrics.leadership_changes_total().inc();
                    }
                }
            }

            Ok(())
        } else {
            Err(JsValue::from_str(&format!(
                "No storage found for database: {}",
                db_name
            )))
        }
    }

    /// Get leader information
    #[wasm_bindgen(js_name = "getLeaderInfo")]
    pub async fn get_leader_info(&mut self) -> Result<JsValue, JsValue> {
        use crate::vfs::indexeddb_vfs::get_storage_with_fallback;

        let db_name = &self.name;

        let storage_rc = get_storage_with_fallback(db_name);

        if let Some(storage) = storage_rc {
            let is_leader = with_storage_async!(storage, "get_leader_info", |s| s.is_leader())
                .ok_or_else(|| {
                    JsValue::from_str(&format!(
                        "Failed to access storage for database: {}",
                        db_name
                    ))
                })?;

            // Get leader info - we'll use simpler data for now
            // Real implementation would need public getters on BlockStorage
            let leader_id_str = if is_leader {
                format!("leader_{}", db_name)
            } else {
                "unknown".to_string()
            };

            // Create JavaScript object
            let obj = js_sys::Object::new();
            js_sys::Reflect::set(&obj, &"isLeader".into(), &JsValue::from_bool(is_leader))?;
            js_sys::Reflect::set(&obj, &"leaderId".into(), &JsValue::from_str(&leader_id_str))?;
            js_sys::Reflect::set(
                &obj,
                &"leaseExpiry".into(),
                &JsValue::from_f64(js_sys::Date::now()),
            )?;

            Ok(obj.into())
        } else {
            Err(JsValue::from_str(&format!(
                "No storage found for database: {}",
                db_name
            )))
        }
    }

    /// Queue a write operation to be executed by the leader
    ///
    /// Non-leader tabs can use this to request writes from the leader.
    /// The write is forwarded via BroadcastChannel and executed by the leader.
    ///
    /// # Arguments
    /// * `sql` - SQL statement to execute (must be a write operation)
    ///
    /// # Returns
    /// Result indicating success or failure
    #[wasm_bindgen(js_name = "queueWrite")]
    pub async fn queue_write(&mut self, sql: String) -> Result<(), JsValue> {
        self.queue_write_with_timeout(sql, 5000).await
    }

    /// Queue a write operation with a specific timeout
    ///
    /// # Arguments
    /// * `sql` - SQL statement to execute
    /// * `timeout_ms` - Timeout in milliseconds
    #[wasm_bindgen(js_name = "queueWriteWithTimeout")]
    pub async fn queue_write_with_timeout(
        &mut self,
        sql: String,
        timeout_ms: u32,
    ) -> Result<(), JsValue> {
        use crate::storage::write_queue::{WriteQueueMessage, WriteResponse, send_write_request};
        use std::cell::RefCell;
        use std::rc::Rc;

        log::debug!("Queuing write: {}", sql);

        // Check if we're the leader - if so, just execute directly
        use crate::vfs::indexeddb_vfs::get_storage_with_fallback;
        let is_leader = {
            let storage_rc = get_storage_with_fallback(&self.name);

            if let Some(storage) = storage_rc {
                with_storage_async!(storage, "queue_write_is_leader", |s| s.is_leader())
                    .unwrap_or(false)
            } else {
                false
            }
        };

        if is_leader {
            log::debug!("We are leader, executing directly");
            return self
                .execute_internal(&sql)
                .await
                .map(|_| ())
                .map_err(|e| JsValue::from_str(&format!("Execute failed: {}", e)));
        }

        // Send write request to leader
        let request_id = send_write_request(&self.name, &sql)
            .map_err(|e| JsValue::from_str(&format!("Failed to send write request: {}", e)))?;

        log::debug!("Write request sent with ID: {}", request_id);

        // Wait for response with timeout
        let response_received = Rc::new(RefCell::new(false));
        let response_error = Rc::new(RefCell::new(None::<String>));

        let response_received_clone = response_received.clone();
        let response_error_clone = response_error.clone();
        let request_id_clone = request_id.clone();

        // Set up listener for response
        let callback = Closure::wrap(Box::new(move |msg: JsValue| {
            // Parse the message
            if let Ok(json_str) = js_sys::JSON::stringify(&msg) {
                if let Some(json_str) = json_str.as_string() {
                    if let Ok(message) = serde_json::from_str::<WriteQueueMessage>(&json_str) {
                        if let WriteQueueMessage::WriteResponse(response) = message {
                            match response {
                                WriteResponse::Success { request_id, .. } => {
                                    if request_id == request_id_clone {
                                        *response_received_clone.borrow_mut() = true;
                                        log::debug!("Write response received: Success");
                                    }
                                }
                                WriteResponse::Error {
                                    request_id,
                                    error_message,
                                } => {
                                    if request_id == request_id_clone {
                                        *response_received_clone.borrow_mut() = true;
                                        *response_error_clone.borrow_mut() = Some(error_message);
                                        log::debug!("Write response received: Error");
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }) as Box<dyn FnMut(JsValue)>);

        // Register listener
        use crate::storage::write_queue::register_write_queue_listener;
        let callback_fn = callback.as_ref().unchecked_ref();
        register_write_queue_listener(&self.name, callback_fn)
            .map_err(|e| JsValue::from_str(&format!("Failed to register listener: {}", e)))?;

        // Keep callback alive
        callback.forget();

        // Wait for response with polling (timeout_ms)
        let start_time = js_sys::Date::now();
        let timeout_f64 = timeout_ms as f64;

        loop {
            // Check if response received
            if *response_received.borrow() {
                if let Some(error_msg) = response_error.borrow().as_ref() {
                    return Err(JsValue::from_str(&format!("Write failed: {}", error_msg)));
                }
                log::info!("Write completed successfully");
                return Ok(());
            }

            // Check timeout
            let elapsed = js_sys::Date::now() - start_time;
            if elapsed > timeout_f64 {
                return Err(JsValue::from_str("Write request timed out"));
            }

            // Wait a bit before checking again
            wasm_bindgen_futures::JsFuture::from(js_sys::Promise::new(&mut |resolve, _reject| {
                if let Some(window) = web_sys::window() {
                    let _ =
                        window.set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, 100);
                } else {
                    log::error!("Window unavailable in timeout handler");
                }
            }))
            .await
            .ok();
        }
    }

    #[wasm_bindgen(js_name = "isLeader")]
    pub async fn is_leader_wasm(&self) -> Result<JsValue, JsValue> {
        // Get the storage from STORAGE_REGISTRY
        use crate::vfs::indexeddb_vfs::get_storage_with_fallback;

        let db_name = &self.name;
        log::debug!("isLeader() called for database: {} (self.name)", db_name);

        let storage_rc = get_storage_with_fallback(db_name);

        if let Some(storage) = storage_rc {
            log::debug!("Found storage for {}, calling is_leader()", db_name);
            let is_leader = with_storage_async!(storage, "is_leader_wasm", |s| s.is_leader())
                .ok_or_else(|| {
                    JsValue::from_str(&format!(
                        "Failed to access storage for database: {}",
                        db_name
                    ))
                })?;
            log::debug!("is_leader() = {} for {}", is_leader, db_name);

            // Return as JsValue boolean
            Ok(JsValue::from_bool(is_leader))
        } else {
            log::error!("ERROR: No storage found for database: {}", db_name);
            Err(JsValue::from_str(&format!(
                "No storage found for database: {}",
                db_name
            )))
        }
    }

    /// Check if this instance is the leader (non-wasm version for internal use/tests)
    pub async fn is_leader(&self) -> Result<bool, JsValue> {
        let result = self.is_leader_wasm().await?;
        Ok(result.as_bool().unwrap_or(false))
    }

    #[wasm_bindgen(js_name = "onDataChange")]
    pub fn on_data_change_wasm(&mut self, callback: &js_sys::Function) -> Result<(), JsValue> {
        log::debug!("Registering onDataChange callback for {}", self.name);

        // Store the callback
        self.on_data_change_callback = Some(callback.clone());

        // Register listener for BroadcastChannel notifications from other tabs
        use crate::storage::broadcast_notifications::register_change_listener;

        let db_name = &self.name;
        register_change_listener(db_name, callback).map_err(|e| {
            JsValue::from_str(&format!("Failed to register change listener: {}", e))
        })?;

        log::debug!("onDataChange callback registered for {}", self.name);
        Ok(())
    }

    /// Reload data from IndexedDB into memory
    /// Call this when another tab has written data and you need to see the changes
    /// This closes and reopens the SQLite connection to invalidate its page cache
    #[wasm_bindgen(js_name = "reloadFromIndexedDB")]
    pub async fn reload_from_indexed_db(&mut self) -> Result<(), JsValue> {
        log::info!("Reloading data from IndexedDB for {}", self.name);

        let db_name = self.name.clone();

        // Step 1: Close the SQLite connection to invalidate page cache
        let pool_key = db_name.trim_end_matches(".db");
        crate::connection_pool::force_close_connection(pool_key);
        self.connection_state.db.set(std::ptr::null_mut());
        log::info!("[RELOAD] Closed SQLite connection for {}", db_name);

        // Step 2: Restore from IndexedDB into global storage (force reload)
        crate::storage::wasm_indexeddb::restore_from_indexeddb_force(&db_name)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to restore from IndexedDB: {}", e)))?;
        log::info!("[RELOAD] Restored from IndexedDB for {}", db_name);

        // Step 3: Reload BlockStorage cache from global storage
        use crate::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        STORAGE_REGISTRY.with(|reg| unsafe {
            let registry = &*reg.get();
            if let Some(storage_rc) = registry.get(&db_name) {
                storage_rc.reload_cache_from_global_storage();
                log::info!("[RELOAD] Reloaded BlockStorage cache for {}", db_name);
            }
        });

        // Step 4: Reopen the SQLite connection
        use std::ffi::CString;

        let vfs_name = format!("vfs_{}", db_name.trim_end_matches(".db"));
        let pool_key = db_name.trim_end_matches(".db").to_string();
        let db_name_for_closure = db_name.clone();
        let vfs_name_for_closure = vfs_name.clone();

        let new_state = crate::connection_pool::get_or_create_connection(&pool_key, || {
            let mut db = std::ptr::null_mut();
            let db_name_cstr = CString::new(db_name_for_closure.clone())
                .map_err(|_| "Invalid database name".to_string())?;
            let vfs_cstr = CString::new(vfs_name_for_closure.as_str())
                .map_err(|_| "Invalid VFS name".to_string())?;

            log::info!(
                "[RELOAD] Reopening database: {} with VFS: {}",
                db_name_for_closure,
                vfs_name_for_closure
            );

            let ret = unsafe {
                sqlite_wasm_rs::sqlite3_open_v2(
                    db_name_cstr.as_ptr(),
                    &mut db as *mut _,
                    sqlite_wasm_rs::SQLITE_OPEN_READWRITE | sqlite_wasm_rs::SQLITE_OPEN_CREATE,
                    vfs_cstr.as_ptr(),
                )
            };

            if ret != sqlite_wasm_rs::SQLITE_OK {
                let err_msg = unsafe {
                    let msg_ptr = sqlite_wasm_rs::sqlite3_errmsg(db);
                    if !msg_ptr.is_null() {
                        std::ffi::CStr::from_ptr(msg_ptr)
                            .to_string_lossy()
                            .into_owned()
                    } else {
                        "Unknown error".to_string()
                    }
                };
                return Err(format!("Failed to reopen database: {}", err_msg));
            }

            log::info!("[RELOAD] Database reopened successfully");
            Ok(db)
        })
        .map_err(|e| JsValue::from_str(&format!("Failed to reopen connection: {}", e)))?;

        self.connection_state = new_state;
        log::info!("[RELOAD] Connection state updated for {}", db_name);

        Ok(())
    }

    /// Enable or disable optimistic updates mode
    #[wasm_bindgen(js_name = "enableOptimisticUpdates")]
    pub async fn enable_optimistic_updates(&mut self, enabled: bool) -> Result<(), JsValue> {
        self.optimistic_updates_manager
            .borrow_mut()
            .set_enabled(enabled);
        log::debug!(
            "Optimistic updates {}",
            if enabled { "enabled" } else { "disabled" }
        );
        Ok(())
    }

    /// Check if optimistic mode is enabled
    #[wasm_bindgen(js_name = "isOptimisticMode")]
    pub async fn is_optimistic_mode(&self) -> bool {
        self.optimistic_updates_manager.borrow().is_enabled()
    }

    /// Track an optimistic write
    #[wasm_bindgen(js_name = "trackOptimisticWrite")]
    pub async fn track_optimistic_write(&mut self, sql: String) -> Result<String, JsValue> {
        let id = self
            .optimistic_updates_manager
            .borrow_mut()
            .track_write(sql);
        Ok(id)
    }

    /// Get count of pending writes
    #[wasm_bindgen(js_name = "getPendingWritesCount")]
    pub async fn get_pending_writes_count(&self) -> usize {
        self.optimistic_updates_manager.borrow().get_pending_count()
    }

    /// Clear all optimistic writes
    #[wasm_bindgen(js_name = "clearOptimisticWrites")]
    pub async fn clear_optimistic_writes(&mut self) -> Result<(), JsValue> {
        self.optimistic_updates_manager.borrow_mut().clear_all();
        Ok(())
    }

    /// Enable or disable coordination metrics tracking
    #[wasm_bindgen(js_name = "enableCoordinationMetrics")]
    pub async fn enable_coordination_metrics(&mut self, enabled: bool) -> Result<(), JsValue> {
        self.coordination_metrics_manager
            .borrow_mut()
            .set_enabled(enabled);
        Ok(())
    }

    /// Check if coordination metrics tracking is enabled
    #[wasm_bindgen(js_name = "isCoordinationMetricsEnabled")]
    pub async fn is_coordination_metrics_enabled(&self) -> bool {
        self.coordination_metrics_manager.borrow().is_enabled()
    }

    /// Record a leadership change
    #[wasm_bindgen(js_name = "recordLeadershipChange")]
    pub async fn record_leadership_change(&mut self, became_leader: bool) -> Result<(), JsValue> {
        self.coordination_metrics_manager
            .borrow_mut()
            .record_leadership_change(became_leader);
        Ok(())
    }

    /// Record a notification latency in milliseconds
    #[wasm_bindgen(js_name = "recordNotificationLatency")]
    pub async fn record_notification_latency(&mut self, latency_ms: f64) -> Result<(), JsValue> {
        self.coordination_metrics_manager
            .borrow_mut()
            .record_notification_latency(latency_ms);
        Ok(())
    }

    /// Record a write conflict (non-leader write attempt)
    #[wasm_bindgen(js_name = "recordWriteConflict")]
    pub async fn record_write_conflict(&mut self) -> Result<(), JsValue> {
        self.coordination_metrics_manager
            .borrow_mut()
            .record_write_conflict();
        Ok(())
    }

    /// Record a follower refresh
    #[wasm_bindgen(js_name = "recordFollowerRefresh")]
    pub async fn record_follower_refresh(&mut self) -> Result<(), JsValue> {
        self.coordination_metrics_manager
            .borrow_mut()
            .record_follower_refresh();
        Ok(())
    }

    /// Get coordination metrics as JSON string
    #[wasm_bindgen(js_name = "getCoordinationMetrics")]
    pub async fn get_coordination_metrics(&self) -> Result<String, JsValue> {
        self.coordination_metrics_manager
            .borrow()
            .get_metrics_json()
            .map_err(|e| JsValue::from_str(&e))
    }

    /// Reset all coordination metrics
    #[wasm_bindgen(js_name = "resetCoordinationMetrics")]
    pub async fn reset_coordination_metrics(&mut self) -> Result<(), JsValue> {
        self.coordination_metrics_manager.borrow_mut().reset();
        Ok(())
    }
}

// Export WasmColumnValue for WASM
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub struct WasmColumnValue {
    #[allow(dead_code)]
    inner: ColumnValue,
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
impl WasmColumnValue {
    #[wasm_bindgen(js_name = "createNull")]
    pub fn create_null() -> WasmColumnValue {
        WasmColumnValue {
            inner: ColumnValue::Null,
        }
    }

    #[wasm_bindgen(js_name = "createInteger")]
    pub fn create_integer(value: i64) -> WasmColumnValue {
        WasmColumnValue {
            inner: ColumnValue::Integer(value),
        }
    }

    #[wasm_bindgen(js_name = "createReal")]
    pub fn create_real(value: f64) -> WasmColumnValue {
        WasmColumnValue {
            inner: ColumnValue::Real(value),
        }
    }

    #[wasm_bindgen(js_name = "createText")]
    pub fn create_text(value: String) -> WasmColumnValue {
        WasmColumnValue {
            inner: ColumnValue::Text(value),
        }
    }

    #[wasm_bindgen(js_name = "createBlob")]
    pub fn create_blob(value: &[u8]) -> WasmColumnValue {
        WasmColumnValue {
            inner: ColumnValue::Blob(value.to_vec()),
        }
    }

    #[wasm_bindgen(js_name = "createBigInt")]
    pub fn create_bigint(value: &str) -> WasmColumnValue {
        WasmColumnValue {
            inner: ColumnValue::BigInt(value.to_string()),
        }
    }

    #[wasm_bindgen(js_name = "createDate")]
    pub fn create_date(timestamp: f64) -> WasmColumnValue {
        WasmColumnValue {
            inner: ColumnValue::Date(timestamp as i64),
        }
    }

    #[wasm_bindgen(js_name = "fromJsValue")]
    pub fn from_js_value(value: &JsValue) -> WasmColumnValue {
        if value.is_null() || value.is_undefined() {
            WasmColumnValue {
                inner: ColumnValue::Null,
            }
        } else if let Some(s) = value.as_string() {
            // Check if it's a large number string
            if let Ok(parsed) = s.parse::<i64>() {
                WasmColumnValue {
                    inner: ColumnValue::Integer(parsed),
                }
            } else {
                WasmColumnValue {
                    inner: ColumnValue::Text(s),
                }
            }
        } else if let Some(n) = value.as_f64() {
            if n.fract() == 0.0 && n >= i64::MIN as f64 && n <= i64::MAX as f64 {
                WasmColumnValue {
                    inner: ColumnValue::Integer(n as i64),
                }
            } else {
                WasmColumnValue {
                    inner: ColumnValue::Real(n),
                }
            }
        } else if value.is_object() {
            // Check if it's a Date
            if js_sys::Date::new(value).get_time().is_finite() {
                let timestamp = js_sys::Date::new(value).get_time() as i64;
                WasmColumnValue {
                    inner: ColumnValue::Date(timestamp),
                }
            } else {
                // Convert to string for other objects
                WasmColumnValue {
                    inner: ColumnValue::Text(format!("{:?}", value)),
                }
            }
        } else {
            WasmColumnValue {
                inner: ColumnValue::Null,
            }
        }
    }

    // --- Rust-friendly alias constructors used in wasm tests ---
    // These mirror the create* methods but with simpler names and
    // argument types matching test usage.
    pub fn null() -> WasmColumnValue {
        Self::create_null()
    }

    // Tests call integer(42.0), so accept f64 and cast to i64.
    pub fn integer(value: f64) -> WasmColumnValue {
        Self::create_integer(value as i64)
    }

    pub fn real(value: f64) -> WasmColumnValue {
        Self::create_real(value)
    }

    pub fn text(value: String) -> WasmColumnValue {
        Self::create_text(value)
    }

    pub fn blob(value: Vec<u8>) -> WasmColumnValue {
        Self::create_blob(&value)
    }

    pub fn big_int(value: String) -> WasmColumnValue {
        Self::create_bigint(&value)
    }

    pub fn date(timestamp_ms: f64) -> WasmColumnValue {
        Self::create_date(timestamp_ms)
    }
}
