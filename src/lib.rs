#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

// Enable better panic messages and memory allocation
#[cfg(feature = "console_error_panic_hook")]
pub use console_error_panic_hook::set_once as set_panic_hook;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// Module declarations
pub mod types;
pub mod storage;
pub mod vfs;
#[cfg(not(target_arch = "wasm32"))]
pub mod database;
pub mod utils;

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
    
    /// Check write permission - only leader can write (unless override enabled)
    async fn check_write_permission(&mut self, sql: &str) -> Result<(), DatabaseError> {
        if !Self::is_write_operation(sql) {
            // Not a write operation, allow it
            return Ok(());
        }
        
        // Check if non-leader writes are allowed
        if self.allow_non_leader_writes {
            web_sys::console::log_1(&format!("WRITE_ALLOWED: Non-leader writes enabled for {}", self.name).into());
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
                web_sys::console::log_1(&format!("WRITE_DENIED: Instance is not leader for {}", db_name).into());
                return Err(DatabaseError::new(
                    "WRITE_PERMISSION_DENIED",
                    "Only the leader tab can write to this database. Use db.isLeader() to check status or call db.allowNonLeaderWrites(true) for single-tab mode."
                ));
            }
            
            web_sys::console::log_1(&format!("WRITE_ALLOWED: Instance is leader for {}", db_name).into());
            Ok(())
        } else {
            // No storage found - allow by default (single-instance mode)
            web_sys::console::log_1(&format!("WRITE_ALLOWED: No storage found for {} (single-instance mode)", db_name).into());
            Ok(())
        }
    }
    
    pub async fn new(config: DatabaseConfig) -> Result<Self, DatabaseError> {
        use std::ffi::{CString, CStr};
        
        // Use IndexedDB VFS for persistent storage
        web_sys::console::log_1(&format!("🔧 Creating IndexedDBVFS for: {}", config.name).into());
        let vfs = crate::vfs::IndexedDBVFS::new(&config.name).await?;
        web_sys::console::log_1(&"🔧 Registering VFS as 'indexeddb'".into());
        vfs.register("indexeddb")?;
        web_sys::console::log_1(&"✅ VFS registered successfully".into());
        
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
        
        web_sys::console::log_1(&format!("🔧 Opening database: {} with VFS: indexeddb", filename).into());
        let ret = unsafe {
            sqlite_wasm_rs::sqlite3_open_v2(
                db_name.as_ptr(),
                &mut db as *mut _,
                sqlite_wasm_rs::SQLITE_OPEN_READWRITE | sqlite_wasm_rs::SQLITE_OPEN_CREATE,
                vfs_name.as_ptr()
            )
        };
        web_sys::console::log_1(&format!("🔧 sqlite3_open_v2 returned: {}", ret).into());
        
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
        
        web_sys::console::log_1(&"✅ Database opened successfully with IndexedDB VFS".into());
        
        Ok(Database {
            db,
            name: config.name,
            on_data_change_callback: None,
            allow_non_leader_writes: false,
            optimistic_updates_manager: std::cell::RefCell::new(crate::storage::optimistic_updates::OptimisticUpdatesManager::new()),
            coordination_metrics_manager: std::cell::RefCell::new(crate::storage::coordination_metrics::CoordinationMetricsManager::new()),
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
        
        Ok(Database {
            db,
            name,
            on_data_change_callback: None,
            allow_non_leader_writes: false,
            optimistic_updates_manager: std::cell::RefCell::new(crate::storage::optimistic_updates::OptimisticUpdatesManager::new()),
            coordination_metrics_manager: std::cell::RefCell::new(crate::storage::coordination_metrics::CoordinationMetricsManager::new()),
        })
    }
    
    pub async fn execute_internal(&mut self, sql: &str) -> Result<QueryResult, DatabaseError> {
        use std::ffi::CString;
        let start_time = js_sys::Date::now();
        
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
                    unsafe { sqlite_wasm_rs::sqlite3_finalize(stmt) };
                    return Err(DatabaseError::new("SQLITE_ERROR", "Error executing SELECT statement").with_sql(sql));
                }
            }
            
            unsafe { sqlite_wasm_rs::sqlite3_finalize(stmt) };
            
            Ok(QueryResult {
                columns,
                rows,
                affected_rows: 0,
                last_insert_id: None,
                execution_time_ms: js_sys::Date::now() - start_time,
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
                        unsafe { sqlite_wasm_rs::sqlite3_finalize(stmt) };
                        return Err(DatabaseError::new("SQLITE_ERROR", "Failed to execute statement").with_sql(sql));
                    }
                }
            } else {
                // Regular non-SELECT statement
                let step_ret = unsafe { sqlite_wasm_rs::sqlite3_step(stmt) };
                if step_ret != sqlite_wasm_rs::SQLITE_DONE {
                    unsafe { sqlite_wasm_rs::sqlite3_finalize(stmt) };
                    return Err(DatabaseError::new("SQLITE_ERROR", "Failed to execute statement").with_sql(sql));
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
            
            Ok(QueryResult {
                columns,
                rows,
                affected_rows,
                last_insert_id,
                execution_time_ms: js_sys::Date::now() - start_time,
            })
        }
    }
    
    pub async fn execute_with_params_internal(&mut self, sql: &str, params: &[ColumnValue]) -> Result<QueryResult, DatabaseError> {
        use std::ffi::CString;
        let start_time = js_sys::Date::now();
        
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
                        let text_cstr = CString::new(val.as_str()).unwrap_or_else(|_| CString::new("").unwrap());
                        let result = sqlite_wasm_rs::sqlite3_bind_text(
                            stmt, 
                            param_index, 
                            text_cstr.as_ptr(), 
                            val.len() as i32, 
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
                    unsafe { sqlite_wasm_rs::sqlite3_finalize(stmt) };
                    return Err(DatabaseError::new("SQLITE_ERROR", "Error executing SELECT statement").with_sql(sql));
                }
            }
            
            unsafe { sqlite_wasm_rs::sqlite3_finalize(stmt) };
            
            Ok(QueryResult {
                columns,
                rows,
                affected_rows: 0,
                last_insert_id: None,
                execution_time_ms: js_sys::Date::now() - start_time,
            })
        } else {
            // Non-SELECT statements
            let step_ret = unsafe { sqlite_wasm_rs::sqlite3_step(stmt) };
            unsafe { sqlite_wasm_rs::sqlite3_finalize(stmt) };
            
            if step_ret != sqlite_wasm_rs::SQLITE_DONE {
                return Err(DatabaseError::new("SQLITE_ERROR", "Failed to execute statement").with_sql(sql));
            }
            
            let affected_rows = unsafe { sqlite_wasm_rs::sqlite3_changes(self.db) } as u32;
            let last_insert_id = if sql.trim().to_uppercase().starts_with("INSERT") {
                Some(unsafe { sqlite_wasm_rs::sqlite3_last_insert_rowid(self.db) })
            } else {
                None
            };
            
            Ok(QueryResult {
                columns: vec![],
                rows: vec![],
                affected_rows,
                last_insert_id,
                execution_time_ms: js_sys::Date::now() - start_time,
            })
        }
    }
    
    pub async fn close_internal(&mut self) -> Result<(), DatabaseError> {
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
                    web_sys::console::log_1(&format!("Stopping leader election for {}", db_name).into());
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
        // Trigger VFS sync to persist all blocks to IndexedDB
        #[cfg(target_arch = "wasm32")]
        {
            crate::storage::vfs_sync_database_blocking(&self.name)?;
            
            // Send notification after successful sync
            use crate::storage::broadcast_notifications::{BroadcastNotification, send_change_notification};
            
            let notification = BroadcastNotification::DataChanged {
                db_name: self.name.clone(),
                timestamp: js_sys::Date::now() as u64,
            };
            
            web_sys::console::log_1(&format!("DEBUG: Sending DataChanged notification for {}", self.name).into());
            
            if let Err(e) = send_change_notification(&notification) {
                web_sys::console::log_1(&format!("WARNING: Failed to send change notification: {}", e).into());
                // Don't fail the sync if notification fails
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
                            web_sys::console::log_1(&format!("Leader received write request: {}", request.request_id).into());
                            
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
                                        web_sys::console::log_1(&"Not leader, ignoring write request".into());
                                        return;
                                    }
                                    
                                    web_sys::console::log_1(&"Processing write request as leader".into());
                                    
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
                                                        web_sys::console::log_1(&format!("Failed to send response: {}", e).into());
                                                    } else {
                                                        web_sys::console::log_1(&"Write response sent successfully".into());
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
                                                        web_sys::console::log_1(&format!("Failed to send error response: {}", e).into());
                                                    }
                                                }
                                            }
                                        }
                                        Err(e) => {
                                            web_sys::console::log_1(&format!("Failed to create db for write processing: {:?}", e).into());
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
        web_sys::console::log_1(&format!("Setting allowNonLeaderWrites = {} for {}", allow, self.name).into());
        self.allow_non_leader_writes = allow;
        Ok(())
    }

    /// Wait for this instance to become leader
    #[wasm_bindgen(js_name = "waitForLeadership")]
    pub async fn wait_for_leadership(&mut self) -> Result<(), JsValue> {
        use crate::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        
        let db_name = &self.name;
        web_sys::console::log_1(&format!("Waiting for leadership for {}", db_name).into());
        
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
                    web_sys::console::log_1(&format!("✓ Became leader for {}", db_name).into());
                    return Ok(());
                }
            }
            
            // Check timeout
            if js_sys::Date::now() - start_time > timeout_ms {
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
        web_sys::console::log_1(&format!("Requesting leadership for {}", db_name).into());
        
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
            
            // Trigger leader election
            storage_mut.start_leader_election().await
                .map_err(|e| JsValue::from_str(&format!("Failed to request leadership: {}", e)))?;
                    
            web_sys::console::log_1(&format!("✓ Re-election triggered for {}", db_name).into());
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
        
        web_sys::console::log_1(&format!("Queuing write: {}", sql).into());
        
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
            web_sys::console::log_1(&"We are leader, executing directly".into());
            return self.execute_internal(&sql).await
                .map(|_| ())
                .map_err(|e| JsValue::from_str(&format!("Execute failed: {}", e)));
        }
        
        // Send write request to leader
        let request_id = send_write_request(&self.name, &sql)
            .map_err(|e| JsValue::from_str(&format!("Failed to send write request: {}", e)))?;
        
        web_sys::console::log_1(&format!("Write request sent with ID: {}", request_id).into());
        
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
                                        web_sys::console::log_1(&"Write response received: Success".into());
                                    }
                                }
                                WriteResponse::Error { request_id, error_message } => {
                                    if request_id == request_id_clone {
                                        *response_received_clone.borrow_mut() = true;
                                        *response_error_clone.borrow_mut() = Some(error_message);
                                        web_sys::console::log_1(&"Write response received: Error".into());
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
                web_sys::console::log_1(&"Write completed successfully".into());
                return Ok(());
            }
            
            // Check timeout
            let elapsed = js_sys::Date::now() - start_time;
            if elapsed > timeout_f64 {
                return Err(JsValue::from_str("Write request timed out"));
            }
            
            // Wait a bit before checking again
            wasm_bindgen_futures::JsFuture::from(js_sys::Promise::new(&mut |resolve, _reject| {
                web_sys::window()
                    .unwrap()
                    .set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, 100)
                    .unwrap();
            })).await.ok();
        }
    }

    #[wasm_bindgen(js_name = "isLeader")]
    pub async fn is_leader_wasm(&self) -> Result<JsValue, JsValue> {
        // Get the storage from STORAGE_REGISTRY
        use crate::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        
        let db_name = &self.name;
        web_sys::console::log_1(&format!("DEBUG: isLeader() called for database: {} (self.name)", db_name).into());
        
        // Show what's in the registry
        STORAGE_REGISTRY.with(|reg| {
            let registry = reg.borrow();
            web_sys::console::log_1(&format!("DEBUG: STORAGE_REGISTRY keys: {:?}", registry.keys().collect::<Vec<_>>()).into());
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
            web_sys::console::log_1(&format!("DEBUG: Found storage for {}, calling is_leader()", db_name).into());
            let mut storage_mut = storage.borrow_mut();
            let is_leader = storage_mut.is_leader().await;
            web_sys::console::log_1(&format!("DEBUG: is_leader() = {} for {}", is_leader, db_name).into());
            
            // Return as JsValue boolean
            Ok(JsValue::from_bool(is_leader))
        } else {
            web_sys::console::log_1(&format!("ERROR: No storage found for database: {}", db_name).into());
            Err(JsValue::from_str(&format!("No storage found for database: {}", db_name)))
        }
    }

    #[wasm_bindgen(js_name = "onDataChange")]
    pub fn on_data_change_wasm(&mut self, callback: &js_sys::Function) -> Result<(), JsValue> {
        web_sys::console::log_1(&format!("DEBUG: Registering onDataChange callback for {}", self.name).into());
        
        // Store the callback
        self.on_data_change_callback = Some(callback.clone());
        
        // Register listener for BroadcastChannel notifications from other tabs
        use crate::storage::broadcast_notifications::register_change_listener;
        
        let db_name = &self.name;
        register_change_listener(db_name, callback)
            .map_err(|e| JsValue::from_str(&format!("Failed to register change listener: {}", e)))?;
        
        web_sys::console::log_1(&format!("DEBUG: onDataChange callback registered for {}", self.name).into());
        Ok(())
    }

    /// Enable or disable optimistic updates mode
    #[wasm_bindgen(js_name = "enableOptimisticUpdates")]
    pub async fn enable_optimistic_updates(&mut self, enabled: bool) -> Result<(), JsValue> {
        self.optimistic_updates_manager.borrow_mut().set_enabled(enabled);
        web_sys::console::log_1(&format!("Optimistic updates {}", if enabled { "enabled" } else { "disabled" }).into());
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
