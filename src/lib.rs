#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

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
    
    console_log::init_with_level(log_level)
        .expect("Failed to initialize console_log");
    
    log::info!("AbsurderSQL logging initialized at level: {:?}", log_level);
}

// Module declarations
pub mod types;
pub mod storage;
pub mod vfs;
#[cfg(not(target_arch = "wasm32"))]
pub mod database;
#[cfg(not(target_arch = "wasm32"))]
pub use database::PreparedStatement;
pub mod utils;
#[cfg(feature = "telemetry")]
pub mod telemetry;

// Re-export main public API
#[cfg(not(target_arch = "wasm32"))]
pub use database::SqliteIndexedDB;
pub use types::DatabaseConfig;
pub use types::{QueryResult, ColumnValue, DatabaseError, TransactionOptions, Row};


// WASM Database implementation using sqlite-wasm-rs
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub struct Database {
    db: *mut sqlite_wasm_rs::sqlite3,
    #[allow(dead_code)]
    name: String,
    #[wasm_bindgen(skip)]
    on_data_change_callback: Option<js_sys::Function>,
    #[wasm_bindgen(skip)]
    allow_non_leader_writes: bool,
    #[wasm_bindgen(skip)]
    optimistic_updates_manager: std::cell::RefCell<crate::storage::optimistic_updates::OptimisticUpdatesManager>,
    #[wasm_bindgen(skip)]
    coordination_metrics_manager: std::cell::RefCell<crate::storage::coordination_metrics::CoordinationMetricsManager>,
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
        use crate::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        
        let db_name = &self.name;
        let storage_rc = STORAGE_REGISTRY.with(|reg| {
            let registry = reg.borrow();
            registry.get(db_name).cloned()
                .or_else(|| registry.get(&format!("{}.db", db_name)).cloned())
                .or_else(|| {
                    if db_name.ends_with(".db") {
                        registry.get(&db_name[..db_name.len()-3]).cloned()
                    } else {
                        None
                    }
                })
        });
        
        if let Some(storage) = storage_rc {
            let mut storage_mut = storage.borrow_mut();
            let is_leader = storage_mut.is_leader().await;
            
            if !is_leader {
                log::error!("WRITE_DENIED: Instance is not leader for {}", db_name);
                return Err(DatabaseError::new(
                    "WRITE_PERMISSION_DENIED",
                    "Only the leader tab can write to this database. Use db.isLeader() to check status or call db.allowNonLeaderWrites(true) for single-tab mode."
                ));
            }
            
            log::info!("WRITE_ALLOWED: Instance is leader for {}", db_name);
            Ok(())
        } else {
            // No storage found - allow by default (single-instance mode)
            log::info!("WRITE_ALLOWED: No storage found for {} (single-instance mode)", db_name);
            Ok(())
        }
    }
    
    pub async fn new(config: DatabaseConfig) -> Result<Self, DatabaseError> {
        use std::ffi::{CString, CStr};
        
        // Use IndexedDB VFS for persistent storage
        log::debug!("Creating IndexedDBVFS for: {}", config.name);
        let vfs = crate::vfs::IndexedDBVFS::new(&config.name).await?;
        log::debug!("Registering VFS as 'indexeddb'");
        vfs.register("indexeddb")?;
        log::info!("VFS registered successfully");
        
        let mut db = std::ptr::null_mut();
        let filename = if config.name.ends_with(".db") {
            config.name.clone()
        } else {
            format!("{}.db", config.name)
        };
        
        let db_name = CString::new(filename.clone())
            .map_err(|_| DatabaseError::new("INVALID_NAME", "Invalid database name"))?;
        let vfs_name = CString::new("indexeddb")
            .map_err(|_| DatabaseError::new("INVALID_VFS", "Invalid VFS name"))?;
        
        log::debug!("Opening database: {} with VFS: indexeddb", filename);
        let ret = unsafe {
            sqlite_wasm_rs::sqlite3_open_v2(
                db_name.as_ptr(),
                &mut db as *mut _,
                sqlite_wasm_rs::SQLITE_OPEN_READWRITE | sqlite_wasm_rs::SQLITE_OPEN_CREATE,
                vfs_name.as_ptr()
            )
        };
        log::debug!("sqlite3_open_v2 returned: {}", ret);
        
        if ret != sqlite_wasm_rs::SQLITE_OK {
            let err_msg = unsafe {
                let msg_ptr = sqlite_wasm_rs::sqlite3_errmsg(db);
                if !msg_ptr.is_null() {
                    CStr::from_ptr(msg_ptr).to_string_lossy().into_owned()
                } else {
                    "Unknown error".to_string()
                }
            };
            return Err(DatabaseError::new("SQLITE_ERROR", &format!("Failed to open database with IndexedDB VFS: {}", err_msg)));
        }
        
        log::info!("Database opened successfully with IndexedDB VFS");
        
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
                    std::ptr::null_mut()
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
                return Err(DatabaseError::new("SQLITE_ERROR", &format!("Failed to execute: {}", err_msg)));
            }
            Ok(())
        };
        
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
                    std::ptr::null_mut()
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
                                journal_mode, result_mode
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
        let metrics = crate::telemetry::Metrics::new()
            .map_err(|e| DatabaseError::new("METRICS_ERROR", &format!("Failed to initialize metrics: {}", e)))?;
        
        Ok(Database {
            db,
            name: config.name.clone(),
            on_data_change_callback: None,
            allow_non_leader_writes: false,
            optimistic_updates_manager: std::cell::RefCell::new(crate::storage::optimistic_updates::OptimisticUpdatesManager::new()),
            coordination_metrics_manager: std::cell::RefCell::new(crate::storage::coordination_metrics::CoordinationMetricsManager::new()),
            #[cfg(feature = "telemetry")]
            metrics: Some(metrics),
            #[cfg(feature = "telemetry")]
            span_recorder: None,
            #[cfg(feature = "telemetry")]
            span_context: Some(crate::telemetry::SpanContext::new()),
            max_export_size_bytes: config.max_export_size_bytes,
        })
    }
    
    /// Open a database with a specific VFS
    pub async fn open_with_vfs(filename: &str, vfs_name: &str) -> Result<Self, DatabaseError> {
        use std::ffi::CString;
        
        log::info!("Opening database {} with VFS {}", filename, vfs_name);
        
        let mut db: *mut sqlite_wasm_rs::sqlite3 = std::ptr::null_mut();
        let db_name = CString::new(filename)
            .map_err(|_| DatabaseError::new("INVALID_NAME", "Invalid database name"))?;
        let vfs_cstr = CString::new(vfs_name)
            .map_err(|_| DatabaseError::new("INVALID_VFS", "Invalid VFS name"))?;
        
        let ret = unsafe {
            sqlite_wasm_rs::sqlite3_open_v2(
                db_name.as_ptr(),
                &mut db as *mut _,
                sqlite_wasm_rs::SQLITE_OPEN_READWRITE | sqlite_wasm_rs::SQLITE_OPEN_CREATE,
                vfs_cstr.as_ptr()
            )
        };
        
        if ret != sqlite_wasm_rs::SQLITE_OK {
            let err_msg = if !db.is_null() {
                unsafe {
                    let msg_ptr = sqlite_wasm_rs::sqlite3_errmsg(db);
                    if !msg_ptr.is_null() {
                        std::ffi::CStr::from_ptr(msg_ptr).to_string_lossy().into_owned()
                    } else {
                        "Unknown error".to_string()
                    }
                }
            } else {
                "Failed to open database".to_string()
            };
            return Err(DatabaseError::new("SQLITE_ERROR", &err_msg));
        }
        
        // Extract database name from filename (strip "file:" prefix if present)
        let name = filename.strip_prefix("file:").unwrap_or(filename)
            .strip_suffix(".db").unwrap_or(filename)
            .to_string();
        
        log::info!("Successfully opened database {} with VFS {}", name, vfs_name);
        
        // Initialize metrics for telemetry
        #[cfg(feature = "telemetry")]
        let metrics = crate::telemetry::Metrics::new()
            .map_err(|e| DatabaseError::new("METRICS_ERROR", &format!("Failed to initialize metrics: {}", e)))?;
        
        Ok(Database {
            db,
            name,
            on_data_change_callback: None,
            allow_non_leader_writes: false,
            optimistic_updates_manager: std::cell::RefCell::new(crate::storage::optimistic_updates::OptimisticUpdatesManager::new()),
            coordination_metrics_manager: std::cell::RefCell::new(crate::storage::coordination_metrics::CoordinationMetricsManager::new()),
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
        use std::ffi::CString;
        let start_time = js_sys::Date::now();
        
        // Create span for query execution and enter context
        #[cfg(feature = "telemetry")]
        let span = if self.span_recorder.is_some() {
            let query_type = sql.trim().split_whitespace().next().unwrap_or("UNKNOWN").to_uppercase();
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
        
        let sql_cstr = CString::new(sql)
            .map_err(|_| DatabaseError::new("INVALID_SQL", "Invalid SQL string"))?;
        
        if sql.trim().to_uppercase().starts_with("SELECT") {
            let mut stmt = std::ptr::null_mut();
            let ret = unsafe {
                sqlite_wasm_rs::sqlite3_prepare_v2(
                    self.db,
                    sql_cstr.as_ptr(),
                    -1,
                    &mut stmt,
                    std::ptr::null_mut()
                )
            };
            
            if ret != sqlite_wasm_rs::SQLITE_OK {
                // Track error
                #[cfg(feature = "telemetry")]
        #[cfg(feature = "telemetry")]
                if let Some(metrics) = &self.metrics {
                    metrics.errors_total().inc();
                }
                
                // Finish span with error
                #[cfg(feature = "telemetry")]
                if let Some(mut s) = span {
                    s.status = crate::telemetry::SpanStatus::Error("Failed to prepare statement".to_string());
                    s.end_time_ms = Some(js_sys::Date::now());
                    if let Some(recorder) = &self.span_recorder {
                        recorder.record_span(s);
                    }
                    
                    // Exit span context
                    if let Some(ref context) = self.span_context {
                        context.exit_span();
                    }
                }
                
                return Err(DatabaseError::new("SQLITE_ERROR", "Failed to prepare statement").with_sql(sql));
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
                        std::ffi::CStr::from_ptr(name_ptr).to_string_lossy().into_owned()
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
                                },
                                sqlite_wasm_rs::SQLITE_FLOAT => {
                                    let val = sqlite_wasm_rs::sqlite3_column_double(stmt, i);
                                    ColumnValue::Real(val)
                                },
                                sqlite_wasm_rs::SQLITE_TEXT => {
                                    let text_ptr = sqlite_wasm_rs::sqlite3_column_text(stmt, i);
                                    if text_ptr.is_null() {
                                        ColumnValue::Null
                                    } else {
                                        let text = std::ffi::CStr::from_ptr(text_ptr as *const i8).to_string_lossy().into_owned();
                                        ColumnValue::Text(text)
                                    }
                                },
                                sqlite_wasm_rs::SQLITE_BLOB => {
                                    let blob_ptr = sqlite_wasm_rs::sqlite3_column_blob(stmt, i);
                                    let blob_size = sqlite_wasm_rs::sqlite3_column_bytes(stmt, i);
                                    if blob_ptr.is_null() || blob_size == 0 {
                                        ColumnValue::Blob(vec![])
                                    } else {
                                        let blob_slice = std::slice::from_raw_parts(blob_ptr as *const u8, blob_size as usize);
                                        ColumnValue::Blob(blob_slice.to_vec())
                                    }
                                },
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
                        let err_ptr = sqlite_wasm_rs::sqlite3_errmsg(self.db);
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
                    return Err(DatabaseError::new("SQLITE_ERROR", &format!("Error executing SELECT statement: {}", err_msg)).with_sql(sql));
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
                    self.db,
                    sql_cstr.as_ptr(),
                    -1,
                    &mut stmt,
                    std::ptr::null_mut()
                )
            };
            
            if ret != sqlite_wasm_rs::SQLITE_OK {
                // Track error
        #[cfg(feature = "telemetry")]
                if let Some(metrics) = &self.metrics {
                    metrics.errors_total().inc();
                }
                return Err(DatabaseError::new("SQLITE_ERROR", "Failed to prepare statement").with_sql(sql));
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
                            std::ffi::CStr::from_ptr(name_ptr).to_string_lossy().into_owned()
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
                                            let text = std::ffi::CStr::from_ptr(text_ptr as *const i8).to_string_lossy().into_owned();
                                            ColumnValue::Text(text)
                                        }
                                    },
                                    sqlite_wasm_rs::SQLITE_INTEGER => {
                                        ColumnValue::Integer(sqlite_wasm_rs::sqlite3_column_int64(stmt, i))
                                    },
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
                            let err_ptr = sqlite_wasm_rs::sqlite3_errmsg(self.db);
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
                        return Err(DatabaseError::new("SQLITE_ERROR", &format!("Failed to execute statement: {}", err_msg)).with_sql(sql));
                    }
                }
            } else {
                // Regular non-SELECT statement
                let step_ret = unsafe { sqlite_wasm_rs::sqlite3_step(stmt) };
                if step_ret != sqlite_wasm_rs::SQLITE_DONE {
                    // Get SQLite error message before finalizing
                    let err_msg = unsafe {
                        let err_ptr = sqlite_wasm_rs::sqlite3_errmsg(self.db);
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
                    return Err(DatabaseError::new("SQLITE_ERROR", &format!("Failed to execute statement: {}", err_msg)).with_sql(sql));
                }
            }
            
            // Finalize to complete the statement
            unsafe { sqlite_wasm_rs::sqlite3_finalize(stmt) };
            
            let affected_rows = unsafe { sqlite_wasm_rs::sqlite3_changes(self.db) } as u32;
            let last_insert_id = if sql.trim().to_uppercase().starts_with("INSERT") {
                Some(unsafe { sqlite_wasm_rs::sqlite3_last_insert_rowid(self.db) })
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
                s.attributes.insert("duration_ms".to_string(), execution_time_ms.to_string());
                s.attributes.insert("affected_rows".to_string(), affected_rows.to_string());
                s.attributes.insert("row_count".to_string(), rows.len().to_string());
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
    
    pub async fn execute_with_params_internal(&mut self, sql: &str, params: &[ColumnValue]) -> Result<QueryResult, DatabaseError> {
        use std::ffi::CString;
        let start_time = js_sys::Date::now();
        
        // Create span for query execution
        #[cfg(feature = "telemetry")]
        let span = if self.span_recorder.is_some() {
            let query_type = sql.trim().split_whitespace().next().unwrap_or("UNKNOWN").to_uppercase();
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
                self.db,
                sql_cstr.as_ptr(),
                -1,
                &mut stmt,
                std::ptr::null_mut()
            )
        };
        
        if ret != sqlite_wasm_rs::SQLITE_OK {
            // Track error
        #[cfg(feature = "telemetry")]
            if let Some(metrics) = &self.metrics {
                metrics.errors_total().inc();
            }
            
            // Finish span with error
            #[cfg(feature = "telemetry")]
            if let Some(mut s) = span {
                s.status = crate::telemetry::SpanStatus::Error("Failed to prepare statement".to_string());
                s.end_time_ms = Some(js_sys::Date::now());
                if let Some(recorder) = &self.span_recorder {
                    recorder.record_span(s);
                }
            }
            
            return Err(DatabaseError::new("SQLITE_ERROR", "Failed to prepare statement").with_sql(sql));
        }
        
        // Bind parameters
        let mut text_cstrings = Vec::new(); // Keep CStrings alive
        for (i, param) in params.iter().enumerate() {
            let param_index = (i + 1) as i32;
            let bind_ret = unsafe {
                match param {
                    ColumnValue::Null => sqlite_wasm_rs::sqlite3_bind_null(stmt, param_index),
                    ColumnValue::Integer(val) => sqlite_wasm_rs::sqlite3_bind_int64(stmt, param_index, *val),
                    ColumnValue::Real(val) => sqlite_wasm_rs::sqlite3_bind_double(stmt, param_index, *val),
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
                            sqlite_wasm_rs::SQLITE_TRANSIENT()
                        );
                        text_cstrings.push(text_cstr); // Keep alive
                        result
                    },
                    ColumnValue::Blob(val) => {
                        sqlite_wasm_rs::sqlite3_bind_blob(
                            stmt, 
                            param_index, 
                            val.as_ptr() as *const _, 
                            val.len() as i32, 
                            sqlite_wasm_rs::SQLITE_TRANSIENT()
                        )
                    },
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
                return Err(DatabaseError::new("SQLITE_ERROR", "Failed to bind parameter").with_sql(sql));
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
                        std::ffi::CStr::from_ptr(name_ptr).to_string_lossy().into_owned()
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
                                },
                                sqlite_wasm_rs::SQLITE_FLOAT => {
                                    let val = sqlite_wasm_rs::sqlite3_column_double(stmt, i);
                                    ColumnValue::Real(val)
                                },
                                sqlite_wasm_rs::SQLITE_TEXT => {
                                    let text_ptr = sqlite_wasm_rs::sqlite3_column_text(stmt, i);
                                    if text_ptr.is_null() {
                                        ColumnValue::Null
                                    } else {
                                        let text = std::ffi::CStr::from_ptr(text_ptr as *const i8).to_string_lossy().into_owned();
                                        ColumnValue::Text(text)
                                    }
                                },
                                sqlite_wasm_rs::SQLITE_BLOB => {
                                    let blob_ptr = sqlite_wasm_rs::sqlite3_column_blob(stmt, i);
                                    let blob_size = sqlite_wasm_rs::sqlite3_column_bytes(stmt, i);
                                    if blob_ptr.is_null() || blob_size == 0 {
                                        ColumnValue::Blob(vec![])
                                    } else {
                                        let blob_slice = std::slice::from_raw_parts(blob_ptr as *const u8, blob_size as usize);
                                        ColumnValue::Blob(blob_slice.to_vec())
                                    }
                                },
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
                        let err_ptr = sqlite_wasm_rs::sqlite3_errmsg(self.db);
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
                    return Err(DatabaseError::new("SQLITE_ERROR", &format!("Error executing SELECT statement: {}", err_msg)).with_sql(sql));
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
                s.attributes.insert("duration_ms".to_string(), execution_time_ms.to_string());
                s.attributes.insert("row_count".to_string(), rows.len().to_string());
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
                    let err_ptr = sqlite_wasm_rs::sqlite3_errmsg(self.db);
                    if !err_ptr.is_null() {
                        std::ffi::CStr::from_ptr(err_ptr)
                            .to_string_lossy()
                            .to_string()
                    } else {
                        "Unknown SQLite error".to_string()
                    }
                };
                return Err(DatabaseError::new("SQLITE_ERROR", &format!("Failed to execute statement: {}", err_msg)).with_sql(sql));
            }
            
            
            let execution_time_ms = js_sys::Date::now() - start_time;
            
            // Track query duration
        #[cfg(feature = "telemetry")]
            if let Some(metrics) = &self.metrics {
                metrics.query_duration().observe(execution_time_ms);
            }
            let affected_rows = unsafe { sqlite_wasm_rs::sqlite3_changes(self.db) } as u32;
            let last_insert_id = if sql.trim().to_uppercase().starts_with("INSERT") {
                Some(unsafe { sqlite_wasm_rs::sqlite3_last_insert_rowid(self.db) })
            } else {
                None
            };
            
            // Finish span successfully
            #[cfg(feature = "telemetry")]
            if let Some(mut s) = span {
                s.status = crate::telemetry::SpanStatus::Ok;
                s.end_time_ms = Some(js_sys::Date::now());
                s.attributes.insert("duration_ms".to_string(), execution_time_ms.to_string());
                s.attributes.insert("affected_rows".to_string(), affected_rows.to_string());
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
            use crate::vfs::indexeddb_vfs::STORAGE_REGISTRY;
            
            if self.metrics.is_none() {
                return;
            }
            
            let db_name = &self.name;
            
            STORAGE_REGISTRY.with(|reg| {
                let registry = reg.borrow();
                if let Some(storage_rc) = registry.get(db_name)
                    .or_else(|| registry.get(&format!("{}.db", db_name)))
                    .or_else(|| {
                        if db_name.ends_with(".db") {
                            registry.get(&db_name[..db_name.len()-3])
                        } else {
                            None
                        }
                    })
                {
                    let mut storage = storage_rc.borrow_mut();
                    storage.set_metrics(self.metrics.clone());
                }
            });
        }
    }
    
    pub async fn close_internal(&mut self) -> Result<(), DatabaseError> {
        // Checkpoint WAL data before close using PASSIVE mode (non-blocking)
        // This ensures we don't block other database instances in concurrent scenarios
        log::debug!("Checkpointing WAL before close: {}", self.name);
        let _ = self.execute_internal("PRAGMA wal_checkpoint(PASSIVE)").await;
        
        // Sync to IndexedDB before closing to ensure schema persists
        log::debug!("Syncing database before close: {}", self.name);
        self.sync_internal().await?;
        
        // Stop leader election before closing
        #[cfg(target_arch = "wasm32")]
        {
            use crate::vfs::indexeddb_vfs::STORAGE_REGISTRY;
            
            let db_name = &self.name;
            let storage_rc = STORAGE_REGISTRY.with(|reg| {
                let registry = reg.borrow();
                registry.get(db_name).cloned()
                    .or_else(|| registry.get(&format!("{}.db", db_name)).cloned())
            });
            
            if let Some(storage_rc) = storage_rc {
                if let Ok(mut storage) = storage_rc.try_borrow_mut() {
                    log::debug!("Stopping leader election for {}", db_name);
                    let _ = storage.stop_leader_election().await;
                }
            }
        }
        
        if !self.db.is_null() {
            unsafe {
                sqlite_wasm_rs::sqlite3_close(self.db);
                self.db = std::ptr::null_mut();
            }
        }
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
                builder = builder.with_context(context).with_baggage_from_context(context);
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
            
            // Advance commit marker
            let next_commit = vfs_sync::with_global_commit_marker(|cm| {
                let mut cm = cm.borrow_mut();
                let current = cm.get(&self.name).copied().unwrap_or(0);
                let new_marker = current + 1;
                cm.insert(self.name.clone(), new_marker);
                log::debug!("Advanced commit marker for {} from {} to {}", self.name, current, new_marker);
                new_marker
            });
            
            // Collect blocks from GLOBAL_STORAGE (where VFS writes them)
            let (blocks_to_persist, metadata_to_persist) = vfs_sync::with_global_storage(|storage| {
                let storage_map = storage.borrow();
                let blocks = if let Some(db_storage) = storage_map.get(&self.name) {
                    db_storage.iter().map(|(&id, data)| (id, data.clone())).collect::<Vec<_>>()
                } else {
                    Vec::new()
                };
                
                let metadata = vfs_sync::with_global_metadata(|meta| {
                    let meta_map = meta.borrow();
                    if let Some(db_meta) = meta_map.get(&self.name) {
                        db_meta.iter().map(|(&id, metadata)| (id, metadata.checksum)).collect::<Vec<_>>()
                    } else {
                        Vec::new()
                    }
                });
                
                (blocks, metadata)
            });
            
            if !blocks_to_persist.is_empty() {
                #[cfg(feature = "telemetry")]
                {
                    blocks_count = blocks_to_persist.len();
                }
                log::debug!("Persisting {} blocks to IndexedDB for {}", blocks_to_persist.len(), self.name);
                crate::storage::wasm_indexeddb::persist_to_indexeddb_event_based(
                    &self.name,
                    blocks_to_persist,
                    metadata_to_persist,
                    next_commit,
                    #[cfg(feature = "telemetry")]
                    self.span_recorder.clone(),
                    #[cfg(feature = "telemetry")]
                    span.as_ref().map(|s| s.span_id.clone()),
                ).await?;
                log::debug!("Successfully persisted {} to IndexedDB (awaited)", self.name);
            } else {
                log::debug!("No blocks to persist for {}", self.name);
            }
            
            // Send notification after successful sync
            use crate::storage::broadcast_notifications::{BroadcastNotification, send_change_notification};
            
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
                s.attributes.insert("duration_ms".to_string(), duration_ms.to_string());
            }
            #[cfg(not(target_arch = "wasm32"))]
            {
                let now = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_millis() as f64;
                s.end_time_ms = Some(now);
                let duration_ms = s.end_time_ms.unwrap() - s.start_time_ms;
                s.attributes.insert("duration_ms".to_string(), duration_ms.to_string());
            }
            s.attributes.insert("blocks_persisted".to_string(), blocks_count.to_string());
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
        if !self.db.is_null() {
            unsafe {
                sqlite_wasm_rs::sqlite3_close(self.db);
            }
        }
        
        // Keep BlockStorage in STORAGE_REGISTRY so multiple Database instances
        // with the same name share the same BlockStorage and leader election state
        // Blocks persist in GLOBAL_STORAGE across Database instances
        log::debug!("Closed database: {} (BlockStorage remains in registry)", self.name);
    }
}

// Add wasm_bindgen exports for the main Database struct
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
impl Database {
    #[wasm_bindgen(js_name = "newDatabase")]
    pub async fn new_wasm(name: String) -> Result<Database, JsValue> {
        let config = DatabaseConfig {
            name: name.clone(),
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
        Self::start_write_queue_listener(&name)?;
        
        Ok(db)
    }
    
    /// Start listening for write queue requests (leader processes these)
    fn start_write_queue_listener(db_name: &str) -> Result<(), JsValue> {
        use crate::storage::write_queue::{register_write_queue_listener, WriteQueueMessage, WriteResponse};
        use crate::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        
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
                            let storage_rc = STORAGE_REGISTRY.with(|reg| {
                                let registry = reg.borrow();
                                registry.get(&db_name_inner).cloned()
                                    .or_else(|| registry.get(&format!("{}.db", &db_name_inner)).cloned())
                            });
                            
                            if let Some(storage) = storage_rc {
                                // Spawn async task to process the write
                                wasm_bindgen_futures::spawn_local(async move {
                                    let is_leader = {
                                        let mut storage_mut = storage.borrow_mut();
                                        storage_mut.is_leader().await
                                    };
                                    
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
                                                        affected_rows: result.affected_rows as usize,
                                                    };
                                                    
                                                    use crate::storage::write_queue::send_write_response;
                                                    if let Err(e) = send_write_response(&db_name_inner, response) {
                                                        log::error!("Failed to send response: {}", e);
                                                    } else {
                                                        log::info!("Write response sent successfully");
                                                    }
                                                }
                                                Err(e) => {
                                                    // Send error response
                                                    let response = WriteResponse::Error {
                                                        request_id: request.request_id.clone(),
                                                        error_message: e.to_string(),
                                                    };
                                                    
                                                    use crate::storage::write_queue::send_write_response;
                                                    if let Err(e) = send_write_response(&db_name_inner, response) {
                                                        log::error!("Failed to send error response: {}", e);
                                                    }
                                                }
                                            }
                                        }
                                        Err(e) => {
                                            log::error!("Failed to create db for write processing: {:?}", e);
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
        register_write_queue_listener(db_name, callback_fn)
            .map_err(|e| JsValue::from_str(&format!("Failed to register write queue listener: {}", e)))?;
        
        callback.forget();
        
        Ok(())
    }

    #[wasm_bindgen]
    pub async fn execute(&mut self, sql: &str) -> Result<JsValue, JsValue> {
        // Check write permission before executing
        self.check_write_permission(sql)
            .await
            .map_err(|e| JsValue::from_str(&format!("Write permission denied: {}", e)))?;
        
        let result = self.execute_internal(sql)
            .await
            .map_err(|e| JsValue::from_str(&format!("Query execution failed: {}", e)))?;
        serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen(js_name = "executeWithParams")]
    pub async fn execute_with_params(&mut self, sql: &str, params: JsValue) -> Result<JsValue, JsValue> {
        let params: Vec<ColumnValue> = serde_wasm_bindgen::from_value(params)
            .map_err(|e| JsValue::from_str(&format!("Invalid parameters: {}", e)))?;
        
        // Check write permission before executing
        self.check_write_permission(sql)
            .await
            .map_err(|e| JsValue::from_str(&format!("Write permission denied: {}", e)))?;
        
        let result = self.execute_with_params_internal(sql, &params)
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
    pub async fn export_to_file(&mut self) -> Result<js_sys::Uint8Array, JsValue> {
        log::info!("Exporting database: {}", self.name);
        
        // Acquire export/import lock to prevent concurrent operations
        let _lock_guard = crate::storage::export_import_lock::acquire_export_import_lock(&self.name)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to acquire export lock: {}", e)))?;
        
        log::debug!("Export lock acquired for: {}", self.name);
        
        // Trigger a non-blocking WAL checkpoint to ensure we get latest data
        // Use PASSIVE mode so it doesn't block other connections
        let _ = self.execute("PRAGMA wal_checkpoint(PASSIVE)").await;
        
        // Get storage from registry
        use crate::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        
        let storage_rc = STORAGE_REGISTRY.with(|reg| {
            let registry = reg.borrow();
            registry.get(&self.name).cloned()
                .or_else(|| registry.get(&format!("{}.db", &self.name)).cloned())
                .or_else(|| {
                    if self.name.ends_with(".db") {
                        registry.get(&self.name[..self.name.len()-3]).cloned()
                    } else {
                        None
                    }
                })
        });
        
        let storage_rc = storage_rc.ok_or_else(|| {
            JsValue::from_str(&format!("Storage not found for database: {}", self.name))
        })?;
        
        // Call export function
        let mut storage = storage_rc.borrow_mut();
        
        // Reload cache from GLOBAL_STORAGE to ensure we have latest data
        #[cfg(target_arch = "wasm32")]
        storage.reload_cache_from_global_storage();
        
        // Export with configured size limit from DatabaseConfig
        let db_bytes = crate::storage::export::export_database_to_bytes(&mut *storage, self.max_export_size_bytes)
            .await
            .map_err(|e| JsValue::from_str(&format!("Export failed: {}", e)))?;
        
        log::info!("Export complete: {} bytes", db_bytes.len());
        
        // Convert to Uint8Array for JavaScript
        let uint8_array = js_sys::Uint8Array::new_with_length(db_bytes.len() as u32);
        uint8_array.copy_from(&db_bytes);
        
        Ok(uint8_array)
        // Lock automatically released when _lock_guard is dropped
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
    /// // Database is now replaced - you may need to reopen connections
    /// ```
    /// 
    /// # Warning
    /// This operation is destructive and will replace all existing database data.
    /// The database connection will be closed and must be reopened after import.
    #[wasm_bindgen(js_name = "importFromFile")]
    pub async fn import_from_file(&mut self, file_data: js_sys::Uint8Array) -> Result<(), JsValue> {
        log::info!("Importing database: {}", self.name);
        
        // Acquire export/import lock to prevent concurrent operations
        let _lock_guard = crate::storage::export_import_lock::acquire_export_import_lock(&self.name)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to acquire import lock: {}", e)))?;
        
        log::debug!("Import lock acquired for: {}", self.name);
        
        // Convert Uint8Array to Vec<u8>
        let data = file_data.to_vec();
        log::debug!("Import data size: {} bytes", data.len());
        
        // Close the database connection first
        log::debug!("Closing database connection before import");
        self.close().await?;
        
        // Call the import function from storage module
        crate::storage::import::import_database_from_bytes(&self.name, data)
            .await
            .map_err(|e| {
                log::error!("Import failed for {}: {}", self.name, e);
                JsValue::from_str(&format!("Import failed: {}", e))
            })?;
        
        log::info!("Import complete for: {}", self.name);
        
        // Note: The user will need to create a new Database instance to use the imported data
        // We don't automatically reopen here to give the user control
        
        Ok(())
        // Lock automatically released when _lock_guard is dropped
    }

    /// Wait for this instance to become leader
    #[wasm_bindgen(js_name = "waitForLeadership")]
    pub async fn wait_for_leadership(&mut self) -> Result<(), JsValue> {
        use crate::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        
        // Track leader election attempt
        #[cfg(feature = "telemetry")]
        if let Some(ref metrics) = self.metrics {
            metrics.leader_elections_total().inc();
        }
        
        let db_name = &self.name;
        log::debug!("Waiting for leadership for {}", db_name);
        
        // Poll until we become leader (with timeout)
        let start_time = js_sys::Date::now();
        let timeout_ms = 5000.0; // 5 second timeout
        
        loop {
            let storage_rc = STORAGE_REGISTRY.with(|reg| {
                let registry = reg.borrow();
                registry.get(db_name).cloned()
                    .or_else(|| registry.get(&format!("{}.db", db_name)).cloned())
                    .or_else(|| {
                        if db_name.ends_with(".db") {
                            registry.get(&db_name[..db_name.len()-3]).cloned()
                        } else {
                            None
                        }
                    })
            });
            
            if let Some(storage) = storage_rc {
                let mut storage_mut = storage.borrow_mut();
                let is_leader = storage_mut.is_leader().await;
                
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
        use crate::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        
        let db_name = &self.name;
        log::debug!("Requesting leadership for {}", db_name);
        
        // Telemetry setup
        #[cfg(feature = "telemetry")]
        let telemetry_data = if self.metrics.is_some() {
            let start_time = js_sys::Date::now();
            let was_leader = self.is_leader_wasm().await.ok()
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            
            if let Some(ref metrics) = self.metrics {
                metrics.leader_elections_total().inc();
            }
            
            Some((start_time, was_leader))
        } else {
            None
        };
        
        let storage_rc = STORAGE_REGISTRY.with(|reg| {
            let registry = reg.borrow();
            registry.get(db_name).cloned()
                .or_else(|| registry.get(&format!("{}.db", db_name)).cloned())
                .or_else(|| {
                    if db_name.ends_with(".db") {
                        registry.get(&db_name[..db_name.len()-3]).cloned()
                    } else {
                        None
                    }
                })
        });
        
        if let Some(storage) = storage_rc {
            {
                let mut storage_mut = storage.borrow_mut();
                
                // Trigger leader election
                storage_mut.start_leader_election().await
                    .map_err(|e| JsValue::from_str(&format!("Failed to request leadership: {}", e)))?;
                        
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
                    let is_leader_now = self.is_leader_wasm().await.ok()
                        .and_then(|v| v.as_bool())
                        .unwrap_or(false);
                    
                    // Update is_leader gauge
                    metrics.is_leader().set(if is_leader_now { 1.0 } else { 0.0 });
                    
                    // Track leadership changes
                    if was_leader != is_leader_now {
                        metrics.leadership_changes_total().inc();
                    }
                }
            }
            
            Ok(())
        } else {
            Err(JsValue::from_str(&format!("No storage found for database: {}", db_name)))
        }
    }

    /// Get leader information
    #[wasm_bindgen(js_name = "getLeaderInfo")]
    pub async fn get_leader_info(&mut self) -> Result<JsValue, JsValue> {
        use crate::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        
        let db_name = &self.name;
        
        let storage_rc = STORAGE_REGISTRY.with(|reg| {
            let registry = reg.borrow();
            registry.get(db_name).cloned()
                .or_else(|| registry.get(&format!("{}.db", db_name)).cloned())
                .or_else(|| {
                    if db_name.ends_with(".db") {
                        registry.get(&db_name[..db_name.len()-3]).cloned()
                    } else {
                        None
                    }
                })
        });
        
        if let Some(storage) = storage_rc {
            let mut storage_mut = storage.borrow_mut();
            let is_leader = storage_mut.is_leader().await;
            
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
            js_sys::Reflect::set(&obj, &"leaseExpiry".into(), &JsValue::from_f64(js_sys::Date::now()))?;
            
            Ok(obj.into())
        } else {
            Err(JsValue::from_str(&format!("No storage found for database: {}", db_name)))
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
    pub async fn queue_write_with_timeout(&mut self, sql: String, timeout_ms: u32) -> Result<(), JsValue> {
        use crate::storage::write_queue::{send_write_request, WriteResponse, WriteQueueMessage};
        use std::cell::RefCell;
        use std::rc::Rc;
        
        log::debug!("Queuing write: {}", sql);
        
        // Check if we're the leader - if so, just execute directly
        use crate::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        let is_leader = {
            let storage_rc = STORAGE_REGISTRY.with(|reg| {
                let registry = reg.borrow();
                registry.get(&self.name).cloned()
                    .or_else(|| registry.get(&format!("{}.db", &self.name)).cloned())
            });
            
            if let Some(storage) = storage_rc {
                let mut storage_mut = storage.borrow_mut();
                storage_mut.is_leader().await
            } else {
                false
            }
        };
        
        if is_leader {
            log::debug!("We are leader, executing directly");
            return self.execute_internal(&sql).await
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
                                WriteResponse::Error { request_id, error_message } => {
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
                    let _ = window.set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, 100);
                } else {
                    log::error!("Window unavailable in timeout handler");
                }
            })).await.ok();
        }
    }

    #[wasm_bindgen(js_name = "isLeader")]
    pub async fn is_leader_wasm(&self) -> Result<JsValue, JsValue> {
        // Get the storage from STORAGE_REGISTRY
        use crate::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        
        let db_name = &self.name;
        log::debug!("isLeader() called for database: {} (self.name)", db_name);
        
        // Show what's in the registry
        STORAGE_REGISTRY.with(|reg| {
            let registry = reg.borrow();
            log::debug!("STORAGE_REGISTRY keys: {:?}", registry.keys().collect::<Vec<_>>());
        });
        
        let storage_rc = STORAGE_REGISTRY.with(|reg| {
            let registry = reg.borrow();
            // Try both with and without .db extension
            registry.get(db_name).cloned()
                .or_else(|| registry.get(&format!("{}.db", db_name)).cloned())
                .or_else(|| {
                    if db_name.ends_with(".db") {
                        registry.get(&db_name[..db_name.len()-3]).cloned()
                    } else {
                        None
                    }
                })
        });
        
        if let Some(storage) = storage_rc {
            log::debug!("Found storage for {}, calling is_leader()", db_name);
            let mut storage_mut = storage.borrow_mut();
            let is_leader = storage_mut.is_leader().await;
            log::debug!("is_leader() = {} for {}", is_leader, db_name);
            
            // Return as JsValue boolean
            Ok(JsValue::from_bool(is_leader))
        } else {
            log::error!("ERROR: No storage found for database: {}", db_name);
            Err(JsValue::from_str(&format!("No storage found for database: {}", db_name)))
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
        register_change_listener(db_name, callback)
            .map_err(|e| JsValue::from_str(&format!("Failed to register change listener: {}", e)))?;
        
        log::debug!("onDataChange callback registered for {}", self.name);
        Ok(())
    }

    /// Enable or disable optimistic updates mode
    #[wasm_bindgen(js_name = "enableOptimisticUpdates")]
    pub async fn enable_optimistic_updates(&mut self, enabled: bool) -> Result<(), JsValue> {
        self.optimistic_updates_manager.borrow_mut().set_enabled(enabled);
        log::debug!("Optimistic updates {}", if enabled { "enabled" } else { "disabled" });
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
        let id = self.optimistic_updates_manager.borrow_mut().track_write(sql);
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
        self.coordination_metrics_manager.borrow_mut().set_enabled(enabled);
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
        self.coordination_metrics_manager.borrow_mut().record_leadership_change(became_leader);
        Ok(())
    }

    /// Record a notification latency in milliseconds
    #[wasm_bindgen(js_name = "recordNotificationLatency")]
    pub async fn record_notification_latency(&mut self, latency_ms: f64) -> Result<(), JsValue> {
        self.coordination_metrics_manager.borrow_mut().record_notification_latency(latency_ms);
        Ok(())
    }

    /// Record a write conflict (non-leader write attempt)
    #[wasm_bindgen(js_name = "recordWriteConflict")]
    pub async fn record_write_conflict(&mut self) -> Result<(), JsValue> {
        self.coordination_metrics_manager.borrow_mut().record_write_conflict();
        Ok(())
    }

    /// Record a follower refresh
    #[wasm_bindgen(js_name = "recordFollowerRefresh")]
    pub async fn record_follower_refresh(&mut self) -> Result<(), JsValue> {
        self.coordination_metrics_manager.borrow_mut().record_follower_refresh();
        Ok(())
    }

    /// Get coordination metrics as JSON string
    #[wasm_bindgen(js_name = "getCoordinationMetrics")]
    pub async fn get_coordination_metrics(&self) -> Result<String, JsValue> {
        self.coordination_metrics_manager.borrow().get_metrics_json()
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
    pub fn null() -> WasmColumnValue { Self::create_null() }

    // Tests call integer(42.0), so accept f64 and cast to i64.
    pub fn integer(value: f64) -> WasmColumnValue { Self::create_integer(value as i64) }

    pub fn real(value: f64) -> WasmColumnValue { Self::create_real(value) }

    pub fn text(value: String) -> WasmColumnValue { Self::create_text(value) }

    pub fn blob(value: Vec<u8>) -> WasmColumnValue { Self::create_blob(&value) }

    pub fn big_int(value: String) -> WasmColumnValue { Self::create_bigint(&value) }

    pub fn date(timestamp_ms: f64) -> WasmColumnValue { Self::create_date(timestamp_ms) }
}
