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
pub use types::{QueryResult, ColumnValue, DatabaseError, TransactionOptions};

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

// Temporarily disable JS/TS Database export on wasm32 while rusqlite-backed
// SQLite integration is not compiled for wasm in this TDD stage.
#[cfg(not(target_arch = "wasm32"))]
#[wasm_bindgen]
pub struct Database {
    inner: SqliteIndexedDB,
}

#[cfg(not(target_arch = "wasm32"))]
#[wasm_bindgen]
impl Database {
    #[wasm_bindgen(constructor)]
    pub async fn new(config: DatabaseConfig) -> Result<Database, JsValue> {
        let inner = SqliteIndexedDB::new(config)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to create database: {}", e)))?;
        
        Ok(Database { inner })
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
