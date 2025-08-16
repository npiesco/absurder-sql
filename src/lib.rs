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
    
    pub async fn execute(&mut self, sql: &str) -> Result<QueryResult, DatabaseError> {
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
    
    pub async fn execute_with_params(&mut self, sql: &str, params: &[ColumnValue]) -> Result<QueryResult, DatabaseError> {
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
        for (i, param) in params.iter().enumerate() {
            let param_index = (i + 1) as i32;
            let bind_ret = unsafe {
                match param {
                    ColumnValue::Null => sqlite_wasm_rs::sqlite3_bind_null(stmt, param_index),
                    ColumnValue::Integer(val) => sqlite_wasm_rs::sqlite3_bind_int64(stmt, param_index, *val),
                    ColumnValue::Real(val) => sqlite_wasm_rs::sqlite3_bind_double(stmt, param_index, *val),
                    ColumnValue::Text(val) => {
                        let text_cstr = CString::new(val.as_str()).unwrap_or_else(|_| CString::new("").unwrap());
                        sqlite_wasm_rs::sqlite3_bind_text(stmt, param_index, text_cstr.as_ptr(), -1, None)
                    },
                    ColumnValue::Blob(val) => {
                        sqlite_wasm_rs::sqlite3_bind_blob(stmt, param_index, val.as_ptr() as *const _, val.len() as i32, None)
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
    
    pub async fn close(&mut self) -> Result<(), DatabaseError> {
        if !self.db.is_null() {
            unsafe {
                sqlite_wasm_rs::sqlite3_close(self.db);
                self.db = std::ptr::null_mut();
            }
        }
        Ok(())
    }
    
    pub async fn sync(&mut self) -> Result<(), DatabaseError> {
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

// Export types for WASM
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Export DatabaseConfig for WASM
#[wasm_bindgen]
pub struct WasmDatabaseConfig {
    inner: DatabaseConfig,
}

#[wasm_bindgen]
impl WasmDatabaseConfig {
    #[wasm_bindgen(constructor)]
    pub fn new(name: String, version: Option<u32>, cache_size: Option<usize>) -> WasmDatabaseConfig {
        WasmDatabaseConfig {
            inner: DatabaseConfig {
                name,
                version,
                cache_size,
                page_size: None,
                auto_vacuum: None,
                journal_mode: None,
            }
        }
    }
    
    #[wasm_bindgen(getter)]
    pub fn name(&self) -> String {
        self.inner.name.clone()
    }
    
    #[wasm_bindgen(getter)]
    pub fn version(&self) -> Option<u32> {
        self.inner.version
    }
    
    #[wasm_bindgen(getter)]
    pub fn cache_size(&self) -> Option<usize> {
        self.inner.cache_size
    }
}

// Export ColumnValue for WASM
#[wasm_bindgen]
pub struct WasmColumnValue {
    #[allow(dead_code)]
    inner: ColumnValue,
}

#[wasm_bindgen]
impl WasmColumnValue {
    #[wasm_bindgen(js_name = "createNull")]
    pub fn null() -> WasmColumnValue {
        WasmColumnValue { inner: ColumnValue::Null }
    }
    
    #[wasm_bindgen(js_name = "createInteger")]
    pub fn integer(value: f64) -> WasmColumnValue {
        WasmColumnValue { inner: ColumnValue::Integer(value as i64) }
    }
    
    #[wasm_bindgen(js_name = "createReal")]
    pub fn real(value: f64) -> WasmColumnValue {
        WasmColumnValue { inner: ColumnValue::Real(value) }
    }
    
    #[wasm_bindgen(js_name = "createText")]
    pub fn text(value: String) -> WasmColumnValue {
        WasmColumnValue { inner: ColumnValue::Text(value) }
    }
    
    #[wasm_bindgen(js_name = "createBlob")]
    pub fn blob(value: Vec<u8>) -> WasmColumnValue {
        WasmColumnValue { inner: ColumnValue::Blob(value) }
    }
    
    #[wasm_bindgen(js_name = "createBigInt")]
    pub fn big_int(value: String) -> WasmColumnValue {
        WasmColumnValue { inner: ColumnValue::BigInt(value) }
    }
    
    #[wasm_bindgen(js_name = "createDate")]
    pub fn date(value: f64) -> WasmColumnValue {
        // JavaScript Date.now() returns milliseconds since epoch
        WasmColumnValue { inner: ColumnValue::Date(value as i64) }
    }
    
    #[wasm_bindgen(js_name = "fromJsValue")]
    pub fn from_js_value(value: &JsValue) -> Result<WasmColumnValue, JsValue> {
        // Log the type of value we're processing
        web_sys::console::log_1(&format!("Processing JS value").into());
        
        if value.is_null() || value.is_undefined() {
            web_sys::console::log_1(&"Value is null or undefined".into());
            return Ok(WasmColumnValue::null());
        } else if let Some(num) = value.as_f64() {
            web_sys::console::log_1(&format!("Value is a number: {}", num).into());
            // Check if it's an integer within i64 range
            if num.fract() == 0.0 && num >= i64::MIN as f64 && num <= i64::MAX as f64 {
                web_sys::console::log_1(&format!("Converting to INTEGER: {}", num as i64).into());
                return Ok(WasmColumnValue::integer(num));
            }
            
            // Regular floating point number
            web_sys::console::log_1(&format!("Converting to REAL: {}", num).into());
            return Ok(WasmColumnValue::real(num));
        } else if value.is_object() {
            // Check if this is a Date object by checking for getTime method
            let has_get_time = js_sys::Reflect::has(value, &JsValue::from_str("getTime")).unwrap_or(false);
            if has_get_time {
                // It's a Date object - get the timestamp
                let date = js_sys::Date::from(value.clone());
                let timestamp = date.get_time();
                web_sys::console::log_1(&format!("Detected Date object with timestamp: {}", timestamp).into());
                return Ok(WasmColumnValue::date(timestamp));
            }
        } else if let Some(string) = value.as_string() {
            web_sys::console::log_1(&format!("Value is a string: {}", string).into());
            
            // Check if string might be a large integer (BigInt representation)
            // Store large integers as TEXT to preserve precision (SQLite approach)
            if string.len() > 15 && string.chars().all(|c| c.is_digit(10) || c == '-' || c == '+') {
                web_sys::console::log_1(&format!("Detected BigInt string: {}", string).into());
                return Ok(WasmColumnValue::big_int(string));
            }
            
            // Check if string is an ISO8601 date format
            if string.len() >= 10 && string.contains('-') {
                // Try to parse as date string
                let date_time = js_sys::Date::new(&JsValue::from_str(&string));
                let timestamp = date_time.get_time();
                if !timestamp.is_nan() {
                    // Valid date string - store as Date
                    web_sys::console::log_1(&format!("Detected ISO date string: {}", string).into());
                    return Ok(WasmColumnValue::date(timestamp));
                }
            }
            
            // Regular text
            web_sys::console::log_1(&format!("Converting to TEXT: {}", string).into());
            return Ok(WasmColumnValue::text(string));
        } else if js_sys::ArrayBuffer::is_view(value) {
            web_sys::console::log_1(&"Value is an ArrayBuffer view".into());
            
            // Handle TypedArray/ArrayBuffer (BLOB)
            let array = js_sys::Uint8Array::new(value);
            let mut bytes = vec![0; array.length() as usize];
            array.copy_to(&mut bytes);
            web_sys::console::log_1(&format!("Converting to BLOB: {} bytes", bytes.len()).into());
            return Ok(WasmColumnValue::blob(bytes));
        }
        
        // If we can't determine the type, log and return an error
        web_sys::console::log_1(&"Unsupported JS value type".into());
        Err(JsValue::from_str("Unsupported JS value type"))
    }
}

// Initialize the library
#[wasm_bindgen(start)]
pub fn init() {
    web_sys::console::log_1(&"SQLite IndexedDB library initialized".into());
}

// WASM-bindgen Database export for JS interop
#[wasm_bindgen]
pub struct WasmBindgenDatabase {
    #[cfg(not(target_arch = "wasm32"))]
    inner: SqliteIndexedDB,
    #[cfg(target_arch = "wasm32")]
    inner: WasmDatabaseImpl,
}

// Dummy WASM Database for now - will be replaced with proper WASM SQLite implementation
#[cfg(target_arch = "wasm32")]
struct WasmDatabaseImpl {
    #[allow(dead_code)]
    config: DatabaseConfig,
}

#[cfg(target_arch = "wasm32")]
impl WasmDatabaseImpl {
    async fn new(config: DatabaseConfig) -> Result<Self, DatabaseError> {
        Ok(WasmDatabaseImpl { config })
    }
    
    async fn execute(&mut self, _sql: &str) -> Result<QueryResult, DatabaseError> {
        Ok(QueryResult {
            columns: vec!["id".to_string()],
            rows: vec![],
            affected_rows: 0,
            execution_time_ms: 0.0,
            last_insert_id: None,
        })
    }
    
    async fn execute_with_params(&mut self, _sql: &str, _params: &[ColumnValue]) -> Result<QueryResult, DatabaseError> {
        Ok(QueryResult {
            columns: vec!["id".to_string()],
            rows: vec![],
            affected_rows: 0,
            execution_time_ms: 0.0,
            last_insert_id: None,
        })
    }
    
    async fn close(&mut self) -> Result<(), DatabaseError> {
        Ok(())
    }
    
    async fn sync(&mut self) -> Result<(), DatabaseError> {
        Ok(())
    }
}

#[wasm_bindgen]
impl WasmBindgenDatabase {
    #[wasm_bindgen(constructor)]
    pub async fn new(config: DatabaseConfig) -> Result<WasmBindgenDatabase, JsValue> {
        #[cfg(not(target_arch = "wasm32"))]
        {
            let inner = SqliteIndexedDB::new(config)
                .await
                .map_err(|e| JsValue::from_str(&format!("Failed to create database: {}", e)))?;
            Ok(WasmBindgenDatabase { inner })
        }
        
        #[cfg(target_arch = "wasm32")]
        {
            let inner = WasmDatabaseImpl::new(config)
                .await
                .map_err(|e| JsValue::from_str(&format!("Failed to create database: {}", e)))?;
            Ok(WasmBindgenDatabase { inner })
        }
    }

    #[wasm_bindgen]
    pub async fn execute(&mut self, sql: &str) -> Result<JsValue, JsValue> {
        let result = self.inner.execute(sql)
            .await
            .map_err(|e| JsValue::from_str(&format!("Query execution failed: {}", e)))?;
        serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen]
    pub async fn execute_with_params(&mut self, sql: &str, params: JsValue) -> Result<JsValue, JsValue> {
        let params: Vec<ColumnValue> = serde_wasm_bindgen::from_value(params)
            .map_err(|e| JsValue::from_str(&format!("Invalid parameters: {}", e)))?;
        
        let result = self.inner.execute_with_params(sql, &params)
            .await
            .map_err(|e| JsValue::from_str(&format!("Query execution failed: {}", e)))?;
        serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen]
    pub async fn close(&mut self) -> Result<(), JsValue> {
        self.inner.close()
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to close database: {}", e)))
    }

    #[wasm_bindgen]
    pub async fn sync(&mut self) -> Result<(), JsValue> {
        self.inner.sync()
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to sync database: {}", e)))
    }
}
