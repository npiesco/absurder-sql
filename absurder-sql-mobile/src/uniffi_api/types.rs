/// UniFFI type definitions
/// 
/// These types are automatically bridged to TypeScript, Swift, and Kotlin
/// by UniFFI's code generation.

use serde::{Deserialize, Serialize};

/// Result of a database query
#[derive(uniffi::Record, Debug, Clone, Serialize, Deserialize)]
pub struct QueryResult {
    /// Column names
    pub columns: Vec<String>,
    /// Rows as JSON objects
    pub rows: Vec<String>,
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
