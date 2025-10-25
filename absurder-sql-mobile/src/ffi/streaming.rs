//! Streaming FFI functions
//!
//! Cursor-based streaming for memory-efficient large result sets

use std::ffi::{CStr, CString, c_char};
use std::sync::Arc;

use crate::registry::{
    DB_REGISTRY, STREAM_REGISTRY, STREAM_HANDLE_COUNTER, RUNTIME,
    StreamingStatement,
    set_last_error, clear_last_error,
};

/// Prepare a streaming statement for cursor-based iteration
///
/// # Safety
/// - db_handle must be a valid database handle
/// - sql must be a valid null-terminated UTF-8 C string
/// - Returns 0 on error
#[unsafe(no_mangle)]
pub unsafe extern "C" fn absurder_stmt_prepare_stream(
    db_handle: u64,
    sql: *const c_char,
) -> u64 {
    clear_last_error();

    // Validate SQL pointer
    if sql.is_null() {
        let err = "SQL cannot be null".to_string();
        log::error!("absurder_stmt_prepare_stream: {}", err);
        set_last_error(err);
        return 0;
    }

    // Convert C string to Rust String
    let sql_str = match unsafe { CStr::from_ptr(sql) }.to_str() {
        Ok(s) => s.to_string(),
        Err(e) => {
            let err = format!("Invalid UTF-8 in SQL: {}", e);
            log::error!("absurder_stmt_prepare_stream: {}", err);
            set_last_error(err);
            return 0;
        }
    };

    // Validate database handle
    let db_registry = DB_REGISTRY.lock();
    if !db_registry.contains_key(&db_handle) {
        let err = format!("Invalid database handle: {}", db_handle);
        log::error!("absurder_stmt_prepare_stream: {}", err);
        set_last_error(err);
        return 0;
    }
    drop(db_registry);

    // Generate unique stream handle
    let stream_handle = {
        let mut counter = STREAM_HANDLE_COUNTER.lock();
        let handle = *counter;
        *counter += 1;
        handle
    };

    // Create streaming statement
    let stream = StreamingStatement {
        db_handle,
        sql: sql_str,
        current_offset: 0,
    };

    // Register stream
    STREAM_REGISTRY.lock().insert(stream_handle, stream);

    log::info!("Created streaming statement with handle: {}", stream_handle);
    stream_handle
}

/// Fetch next batch of rows from streaming statement
///
/// # Safety
/// - stream_handle must be a valid stream handle
/// - batch_size must be > 0
/// - Returns null on error or if stream doesn't exist
/// - Returns empty JSON array "[]" when no more rows
/// - Caller must free returned string with absurder_free_string
#[unsafe(no_mangle)]
pub unsafe extern "C" fn absurder_stmt_fetch_next(
    stream_handle: u64,
    batch_size: i32,
) -> *mut c_char {
    clear_last_error();

    if batch_size <= 0 {
        let err = format!("Invalid batch size: {}", batch_size);
        log::error!("absurder_stmt_fetch_next: {}", err);
        set_last_error(err);
        return std::ptr::null_mut();
    }

    // Get stream from registry
    let mut stream_registry = STREAM_REGISTRY.lock();
    let stream = match stream_registry.get_mut(&stream_handle) {
        Some(s) => s,
        None => {
            let err = format!("Invalid stream handle: {}", stream_handle);
            log::error!("absurder_stmt_fetch_next: {}", err);
            set_last_error(err);
            return std::ptr::null_mut();
        }
    };

    let db_handle = stream.db_handle;
    let sql = stream.sql.clone();
    let offset = stream.current_offset;
    let limit = batch_size as usize;

    // Update offset for next fetch
    stream.current_offset += limit;
    drop(stream_registry);

    // Get database
    let db_registry = DB_REGISTRY.lock();
    let db_arc = match db_registry.get(&db_handle) {
        Some(db) => Arc::clone(db),
        None => {
            let err = format!("Database handle {} no longer valid", db_handle);
            log::error!("absurder_stmt_fetch_next: {}", err);
            set_last_error(err);
            return std::ptr::null_mut();
        }
    };
    drop(db_registry);

    // Build paginated query
    let paginated_sql = format!("{} LIMIT {} OFFSET {}", sql, limit, offset);

    // Execute query
    let result = RUNTIME.block_on(async {
        let mut db = db_arc.lock();
        db.execute(&paginated_sql).await
    });

    match result {
        Ok(query_result) => {
            // Serialize QueryResult to JSON then parse to extract rows
            let result_json = match serde_json::to_string(&query_result) {
                Ok(j) => j,
                Err(e) => {
                    let err = format!("Failed to serialize QueryResult: {}", e);
                    log::error!("absurder_stmt_fetch_next: {}", err);
                    set_last_error(err);
                    return std::ptr::null_mut();
                }
            };
            
            match serde_json::from_str::<serde_json::Value>(&result_json) {
                Ok(json) => {
                    let empty_vec = vec![];
                    let rows = json.get("rows").and_then(|r| r.as_array()).unwrap_or(&empty_vec);
                    let rows_json = serde_json::to_string(rows).unwrap_or_else(|_| "[]".to_string());
                    
                    match CString::new(rows_json) {
                        Ok(c_str) => c_str.into_raw(),
                        Err(e) => {
                            let err = format!("Failed to create C string: {}", e);
                            log::error!("absurder_stmt_fetch_next: {}", err);
                            set_last_error(err);
                            std::ptr::null_mut()
                        }
                    }
                }
                Err(e) => {
                    let err = format!("Failed to parse result JSON: {}", e);
                    log::error!("absurder_stmt_fetch_next: {}", err);
                    set_last_error(err);
                    std::ptr::null_mut()
                }
            }
        }
        Err(e) => {
            let err = format!("Failed to fetch rows: {}", e);
            log::error!("absurder_stmt_fetch_next: {}", err);
            set_last_error(err);
            std::ptr::null_mut()
        }
    }
}

/// Close streaming statement and free resources
///
/// # Safety
/// - stream_handle must be a valid stream handle
/// - Returns 0 on success, -1 on error
#[unsafe(no_mangle)]
pub unsafe extern "C" fn absurder_stmt_stream_close(stream_handle: u64) -> i32 {
    clear_last_error();

    let mut stream_registry = STREAM_REGISTRY.lock();
    match stream_registry.remove(&stream_handle) {
        Some(_) => {
            log::info!("Closed streaming statement with handle: {}", stream_handle);
            0
        }
        None => {
            let err = format!("Invalid stream handle: {}", stream_handle);
            log::error!("absurder_stmt_stream_close: {}", err);
            set_last_error(err);
            -1
        }
    }
}
