use serde::{Deserialize, Serialize};
use tsify::Tsify;
use wasm_bindgen::prelude::*;

// Database configuration - automatically generates TypeScript interface
#[derive(Tsify, Serialize, Deserialize, Debug, Clone)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct DatabaseConfig {
    pub name: String,
    pub version: Option<u32>,
    pub cache_size: Option<usize>,
    pub page_size: Option<usize>,
    pub auto_vacuum: Option<bool>,
    /// Journal mode for SQLite transactions
    ///
    /// Options:
    /// - "MEMORY" (default): Fast in-memory journaling, optimal browser performance
    /// - "WAL": Write-Ahead Logging with full shared memory support
    ///          Set `journal_mode: Some("WAL".to_string())` to enable
    ///          Note: WAL has overhead in concurrent operations but provides
    ///          better crash recovery and allows concurrent reads
    /// - "DELETE": Traditional rollback journal
    ///
    /// Example enabling WAL:
    /// ```
    /// use absurder_sql::DatabaseConfig;
    /// let config = DatabaseConfig {
    ///     name: "mydb".to_string(),
    ///     journal_mode: Some("WAL".to_string()),
    ///     ..Default::default()
    /// };
    /// ```
    pub journal_mode: Option<String>,
    /// Maximum database size for export operations (in bytes).
    /// Default: 2GB (2_147_483_648 bytes)
    /// Rationale: Balances IndexedDB capacity (10GB+) with browser memory limits (~2-4GB/tab)
    /// Set to None for no limit (not recommended - may cause OOM errors)
    pub max_export_size_bytes: Option<u64>,
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        Self {
            name: "default.db".to_string(),
            version: Some(1),
            cache_size: Some(10_000),
            page_size: Some(4096),
            auto_vacuum: Some(true),
            // MEMORY mode: optimal browser performance (absurd-sql approach)
            // WAL mode is fully supported - explicitly set journal_mode to enable
            journal_mode: Some("MEMORY".to_string()),
            max_export_size_bytes: Some(2 * 1024 * 1024 * 1024), // 2GB default
        }
    }
}

impl DatabaseConfig {
    /// Create mobile-optimized database configuration
    ///
    /// Optimizations:
    /// - WAL mode: Better concurrency, crash recovery, and write performance
    /// - Larger cache: 20K pages (~80MB with 4KB pages) for better read performance
    /// - 4KB pages: Optimal for mobile storage
    /// - Auto vacuum: Keeps database size manageable
    ///
    /// Use this for React Native, Flutter, or other mobile applications.
    ///
    /// # Examples
    /// ```
    /// use absurder_sql::types::DatabaseConfig;
    ///
    /// let config = DatabaseConfig::mobile_optimized("myapp.db");
    /// assert_eq!(config.journal_mode, Some("WAL".to_string()));
    /// ```
    pub fn mobile_optimized(name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            version: Some(1),
            cache_size: Some(20_000), // ~80MB cache with 4KB pages
            page_size: Some(4096),
            auto_vacuum: Some(true),
            journal_mode: Some("WAL".to_string()), // WAL for mobile performance
            max_export_size_bytes: Some(2 * 1024 * 1024 * 1024),
        }
    }
}
// Query result types with proper TypeScript mapping
#[derive(Tsify, Serialize, Deserialize, Debug)]
#[tsify(into_wasm_abi, from_wasm_abi)]
#[serde(rename_all = "camelCase")]
pub struct QueryResult {
    pub columns: Vec<String>,
    pub rows: Vec<Row>,
    pub affected_rows: u32,
    pub last_insert_id: Option<i64>,
    pub execution_time_ms: f64,
}

#[derive(Tsify, Serialize, Deserialize, Debug, Clone)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct Row {
    pub values: Vec<ColumnValue>,
}

#[derive(Tsify, Serialize, Deserialize, Debug, Clone, PartialEq)]
#[tsify(into_wasm_abi, from_wasm_abi)]
#[serde(tag = "type", content = "value")]
pub enum ColumnValue {
    Null,
    Integer(i64),
    Real(f64),
    Text(String),
    Blob(Vec<u8>),
    Date(i64),      // Store as UTC timestamp (milliseconds since epoch)
    BigInt(String), // Store as string to handle large integers beyond i64
}

impl ColumnValue {
    #[cfg(not(target_arch = "wasm32"))]
    pub fn from_rusqlite_value(value: &rusqlite::types::Value) -> Self {
        match value {
            rusqlite::types::Value::Null => ColumnValue::Null,
            rusqlite::types::Value::Integer(i) => ColumnValue::Integer(*i),
            rusqlite::types::Value::Real(f) => ColumnValue::Real(*f),
            rusqlite::types::Value::Text(s) => {
                // Check if the text might be a date in ISO format
                if s.len() >= 20 && s.starts_with("20") && s.contains('T') && s.contains('Z') {
                    if let Ok(dt) = time::OffsetDateTime::parse(
                        s,
                        &time::format_description::well_known::Rfc3339,
                    ) {
                        return ColumnValue::Date((dt.unix_timestamp_nanos() / 1_000_000) as i64);
                    }
                }
                // Check if it might be a BigInt (large number as string)
                if s.len() > 18 && s.chars().all(|c| c.is_digit(10) || c == '-' || c == '+') {
                    return ColumnValue::BigInt(s.clone());
                }
                ColumnValue::Text(s.clone())
            }
            rusqlite::types::Value::Blob(b) => ColumnValue::Blob(b.clone()),
        }
    }

    #[cfg(not(target_arch = "wasm32"))]
    pub fn to_rusqlite_value(&self) -> rusqlite::types::Value {
        match self {
            ColumnValue::Null => rusqlite::types::Value::Null,
            ColumnValue::Integer(i) => rusqlite::types::Value::Integer(*i),
            ColumnValue::Real(f) => rusqlite::types::Value::Real(*f),
            ColumnValue::Text(s) => rusqlite::types::Value::Text(s.clone()),
            ColumnValue::Blob(b) => rusqlite::types::Value::Blob(b.clone()),
            ColumnValue::Date(ts) => {
                // Convert timestamp to ISO string
                let dt = time::OffsetDateTime::from_unix_timestamp_nanos((*ts as i128) * 1_000_000)
                    .unwrap_or_else(|_| time::OffsetDateTime::UNIX_EPOCH);
                let formatted = dt
                    .format(&time::format_description::well_known::Rfc3339)
                    .unwrap_or_else(|_| "1970-01-01T00:00:00Z".to_string());
                rusqlite::types::Value::Text(formatted)
            }
            ColumnValue::BigInt(s) => rusqlite::types::Value::Text(s.clone()),
        }
    }
}

// Transaction options
#[derive(Tsify, Serialize, Deserialize, Debug)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct TransactionOptions {
    pub isolation_level: IsolationLevel,
    pub timeout_ms: Option<u32>,
}

#[derive(Tsify, Serialize, Deserialize, Debug)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub enum IsolationLevel {
    ReadUncommitted,
    ReadCommitted,
    RepeatableRead,
    Serializable,
}

// Error types
#[derive(Tsify, Serialize, Deserialize, Debug, Clone, thiserror::Error)]
#[tsify(into_wasm_abi, from_wasm_abi)]
#[error("Database error: {message}")]
pub struct DatabaseError {
    pub code: String,
    pub message: String,
    pub sql: Option<String>,
}

impl DatabaseError {
    pub fn new(code: &str, message: &str) -> Self {
        Self {
            code: code.to_string(),
            message: message.to_string(),
            sql: None,
        }
    }

    pub fn with_sql(mut self, sql: &str) -> Self {
        self.sql = Some(sql.to_string());
        self
    }
}

#[cfg(not(target_arch = "wasm32"))]
impl From<rusqlite::Error> for DatabaseError {
    fn from(err: rusqlite::Error) -> Self {
        DatabaseError::new("SQLITE_ERROR", &err.to_string())
    }
}

impl From<JsValue> for DatabaseError {
    fn from(err: JsValue) -> Self {
        let message = err
            .as_string()
            .unwrap_or_else(|| "Unknown JavaScript error".to_string());
        DatabaseError::new("JS_ERROR", &message)
    }
}
