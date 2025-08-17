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
}

#[cfg(target_arch = "wasm32")]
impl Database {
    pub async fn new(config: DatabaseConfig) -> Result<Self, DatabaseError> {
        use std::ffi::CString;
        
        let mut db = std::ptr::null_mut();
        let db_name = CString::new(format!("mem:{}", config.name))
            .map_err(|_| DatabaseError::new("INVALID_NAME", "Invalid database name"))?;
        
        let ret = unsafe {
            sqlite_wasm_rs::sqlite3_open_v2(
                db_name.as_ptr(),
                &mut db as *mut _,
                sqlite_wasm_rs::SQLITE_OPEN_READWRITE | sqlite_wasm_rs::SQLITE_OPEN_CREATE,
                std::ptr::null()
            )
        };
        
        if ret != sqlite_wasm_rs::SQLITE_OK {
            return Err(DatabaseError::new("SQLITE_ERROR", "Failed to open database"));
        }
        
        Ok(Database {
            db,
            name: config.name,
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
            // Non-SELECT statements
            let ret = unsafe {
                sqlite_wasm_rs::sqlite3_exec(
                    self.db,
                    sql_cstr.as_ptr(),
                    None,
                    std::ptr::null_mut(),
                    std::ptr::null_mut()
                )
            };
            
            if ret != sqlite_wasm_rs::SQLITE_OK {
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
        if !self.db.is_null() {
            unsafe {
                sqlite_wasm_rs::sqlite3_close(self.db);
                self.db = std::ptr::null_mut();
            }
        }
        Ok(())
    }
    
    pub async fn sync_internal(&mut self) -> Result<(), DatabaseError> {
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
            name,
            version: Some(1),
            cache_size: Some(10_000),
            page_size: Some(4096),
            auto_vacuum: Some(true),
            journal_mode: Some("WAL".to_string()),
        };
        
        Database::new(config)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to create database: {}", e)))
    }

    #[wasm_bindgen]
    pub async fn execute(&mut self, sql: &str) -> Result<JsValue, JsValue> {
        let result = self.execute_internal(sql)
            .await
            .map_err(|e| JsValue::from_str(&format!("Query execution failed: {}", e)))?;
        serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen(js_name = "executeWithParams")]
    pub async fn execute_with_params(&mut self, sql: &str, params: JsValue) -> Result<JsValue, JsValue> {
        let params: Vec<ColumnValue> = serde_wasm_bindgen::from_value(params)
            .map_err(|e| JsValue::from_str(&format!("Invalid parameters: {}", e)))?;
        
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
}
