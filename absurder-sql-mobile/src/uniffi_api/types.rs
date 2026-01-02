/// UniFFI type definitions
///
/// These types are automatically bridged to TypeScript, Swift, and Kotlin
/// by UniFFI's code generation.

use serde::{Deserialize, Serialize};

/// Column value types matching SQLite's type system
#[derive(uniffi::Enum, Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ColumnValue {
    Null,
    Integer { value: i64 },
    Real { value: f64 },
    Text { value: String },
    Blob { value: Vec<u8> },
}

/// A single row of query results
#[derive(uniffi::Record, Debug, Clone, Serialize, Deserialize)]
pub struct Row {
    pub values: Vec<ColumnValue>,
}

/// Result of a database query
#[derive(uniffi::Record, Debug, Clone, Serialize, Deserialize)]
pub struct QueryResult {
    /// Column names
    pub columns: Vec<String>,
    /// Typed rows with column values
    pub rows: Vec<Row>,
    /// Number of rows affected
    pub rows_affected: u64,
    /// Last inserted row ID (populated for INSERT statements)
    pub last_insert_id: Option<i64>,
    /// Query execution time in milliseconds
    pub execution_time_ms: f64,
}

/// Database configuration
#[derive(uniffi::Record, Debug, Clone)]
pub struct DatabaseConfig {
    /// Database name/path
    pub name: String,
    /// Optional encryption key
    pub encryption_key: Option<String>,
    /// Cache size in pages (default: SQLite default)
    pub cache_size: Option<i64>,
    /// Page size in bytes (default: SQLite default, typically 4096)
    pub page_size: Option<i64>,
    /// Journal mode: "MEMORY", "WAL", "DELETE", etc.
    pub journal_mode: Option<String>,
    /// Enable auto-vacuum to keep database compact
    pub auto_vacuum: Option<bool>,
}

/// Error type for database operations
#[derive(uniffi::Error, Debug, thiserror::Error)]
pub enum DatabaseError {
    #[error("Database not found: {message}")]
    NotFound { message: String },
    
    #[error("SQL error: {message}")]
    SqlError { message: String },
    
    #[error("IO error: {message}")]
    IoError { message: String },
    
    #[error("Invalid parameter: {message}")]
    InvalidParameter { message: String },
    
    #[error("Database is closed")]
    DatabaseClosed,
}

// Implement conversion from absurder-sql errors
impl From<absurder_sql::DatabaseError> for DatabaseError {
    fn from(err: absurder_sql::DatabaseError) -> Self {
        DatabaseError::SqlError {
            message: err.to_string(),
        }
    }
}
