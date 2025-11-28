/// UniFFI type definitions
///
/// These types are automatically bridged to TypeScript, Swift, and Kotlin
/// by UniFFI's code generation.

use serde::{Deserialize, Serialize};

/// A single column value from a query result
///
/// Represents all SQLite column types with proper type safety.
/// Maps to native types in TypeScript, Swift, and Kotlin.
#[derive(uniffi::Enum, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ColumnValue {
    /// SQL NULL value
    Null,
    /// 64-bit signed integer
    Integer { value: i64 },
    /// 64-bit floating point
    Real { value: f64 },
    /// UTF-8 text string
    Text { value: String },
    /// Binary data
    Blob { value: Vec<u8> },
}

/// A single row from a query result
///
/// Contains a vector of column values in the same order as QueryResult.columns
#[derive(uniffi::Record, Debug, Clone, Serialize, Deserialize)]
pub struct Row {
    /// Column values in order
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
}

/// Database configuration
#[derive(uniffi::Record, Debug, Clone)]
pub struct DatabaseConfig {
    /// Database name/path
    pub name: String,
    /// Optional encryption key
    pub encryption_key: Option<String>,
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
