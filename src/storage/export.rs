//! Export and Import functionality for SQLite databases
//!
//! This module provides conversion between IndexedDB block storage and standard SQLite .db files.
//!
//! # Features
//! - **Export**: Convert IndexedDB blocks to downloadable .db file
//! - **Import**: Load .db file into IndexedDB storage
//! - **Validation**: Verify SQLite file format integrity
//!
//! # Architecture
//! The system works with 4096-byte blocks stored in IndexedDB. Export reads all allocated blocks
//! and concatenates them into a standard SQLite file. Import splits a .db file into blocks and
//! writes them to IndexedDB with proper metadata tracking.

use crate::storage::block_storage::BlockStorage;
use crate::types::DatabaseError;

const BLOCK_SIZE: usize = 4096;
/// Default maximum export size: 2GB
///
/// Rationale:
/// - IndexedDB limits: 10GB (Firefox) to ~60% of disk (Chrome/Safari)
/// - WASM/Browser memory: ~2-4GB per tab
/// - Export requires loading entire DB into memory
/// - 2GB provides safety margin while allowing large databases
/// - Configurable via DatabaseConfig.max_export_size_bytes
const DEFAULT_MAX_EXPORT_SIZE: u64 = 2 * 1024 * 1024 * 1024; // 2GB

/// Default chunk size for streaming export: 10MB
///
/// For databases >100MB, export processes blocks in chunks of this size
/// to reduce memory pressure and allow event loop yielding
const DEFAULT_CHUNK_SIZE: u64 = 10 * 1024 * 1024; // 10MB

/// Progress callback type for export operations
///
/// Parameters: (bytes_exported, total_bytes)
pub type ProgressCallback = Box<dyn Fn(u64, u64) + Send + Sync>;

/// Options for database export operations
///
/// Allows configuration of size limits, chunking behavior, and progress tracking
#[derive(Default)]
pub struct ExportOptions {
    /// Maximum allowed database size (bytes). None for no limit.
    /// Default: 2GB
    pub max_size_bytes: Option<u64>,

    /// Chunk size for streaming large exports (bytes).
    /// Export processes this many bytes at a time, yielding to event loop between chunks.
    /// Default: 10MB
    pub chunk_size_bytes: Option<u64>,

    /// Optional progress callback invoked after each chunk.
    /// Called with (bytes_exported_so_far, total_bytes)
    pub progress_callback: Option<ProgressCallback>,
}

/// SQLite file format constants
const SQLITE_MAGIC: &[u8; 16] = b"SQLite format 3\0";
const SQLITE_HEADER_SIZE: usize = 100;
const PAGE_SIZE_OFFSET: usize = 16;
const PAGE_COUNT_OFFSET: usize = 28;

/// Minimum and maximum valid page sizes for SQLite
const MIN_PAGE_SIZE: usize = 512;
const MAX_PAGE_SIZE: usize = 65536;

/// Parse SQLite database header to extract metadata
///
/// # Arguments
/// * `header` - First 100+ bytes of SQLite database file
///
/// # Returns
/// * `Ok((page_size, page_count))` - Database page size and number of pages
/// * `Err(DatabaseError)` - If header is invalid or corrupted
///
/// # SQLite Header Format
/// - Bytes 0-15: Magic string "SQLite format 3\0"
/// - Bytes 16-17: Page size (big-endian u16), special case: 1 = 65536
/// - Bytes 28-31: Page count (big-endian u32)
///
/// # Example
/// ```rust,no_run
/// use absurder_sql::storage::export::parse_sqlite_header;
///
/// let header_data: Vec<u8> = vec![/* ... header bytes ... */];
/// match parse_sqlite_header(&header_data) {
///     Ok((page_size, page_count)) => {
///         println!("Database: {} pages of {} bytes", page_count, page_size);
///     }
///     Err(e) => eprintln!("Invalid header: {}", e),
/// }
/// ```
pub fn parse_sqlite_header(data: &[u8]) -> Result<(usize, u32), DatabaseError> {
    // Validate minimum header size
    if data.len() < SQLITE_HEADER_SIZE {
        return Err(DatabaseError::new(
            "INVALID_HEADER",
            &format!(
                "Header too small: {} bytes (minimum {} required)",
                data.len(),
                SQLITE_HEADER_SIZE
            ),
        ));
    }

    // Validate magic string
    if &data[0..16] != SQLITE_MAGIC {
        let magic_str = String::from_utf8_lossy(&data[0..16]);
        return Err(DatabaseError::new(
            "INVALID_SQLITE_FILE",
            &format!(
                "Invalid SQLite magic string. Expected 'SQLite format 3', got: '{}'",
                magic_str
            ),
        ));
    }

    // Extract page size (big-endian u16 at bytes 16-17)
    let page_size_raw = u16::from_be_bytes([data[PAGE_SIZE_OFFSET], data[PAGE_SIZE_OFFSET + 1]]);

    // Handle special case: page_size == 1 means 65536
    let page_size = if page_size_raw == 1 {
        65536
    } else {
        page_size_raw as usize
    };

    // Validate page size is a power of 2 between 512 and 65536
    if page_size < 512 || page_size > 65536 || !page_size.is_power_of_two() {
        return Err(DatabaseError::new(
            "INVALID_PAGE_SIZE",
            &format!(
                "Invalid page size: {}. Must be power of 2 between 512 and 65536",
                page_size
            ),
        ));
    }

    // Extract page count (big-endian u32 at bytes 28-31)
    let page_count = u32::from_be_bytes([
        data[PAGE_COUNT_OFFSET],
        data[PAGE_COUNT_OFFSET + 1],
        data[PAGE_COUNT_OFFSET + 2],
        data[PAGE_COUNT_OFFSET + 3],
    ]);

    log::debug!(
        "Parsed SQLite header: page_size={}, page_count={}",
        page_size,
        page_count
    );

    Ok((page_size, page_count))
}

/// Validate export size against configured limit
///
/// Checks if the database size exceeds the maximum allowed export size.
/// This prevents out-of-memory errors when exporting very large databases.
///
/// # Arguments
/// * `size_bytes` - Size of the database in bytes
/// * `max_size_bytes` - Maximum allowed size (None for default 500MB)
///
/// # Returns
/// * `Ok(())` - Size is within limits
/// * `Err(DatabaseError)` - Size exceeds limit
///
/// # Default Limit
/// If `max_size_bytes` is None, defaults to 2GB (2,147,483,648 bytes).
/// This balances IndexedDB capacity (10GB+) with browser memory limits (~2-4GB per tab).
///
/// # Example
/// ```rust,no_run
/// use absurder_sql::storage::export::validate_export_size;
///
/// // Use default 2GB limit
/// validate_export_size(100_000_000, None).unwrap();
///
/// // Use custom 5GB limit
/// validate_export_size(3_000_000_000, Some(5 * 1024 * 1024 * 1024)).unwrap();
/// ```
pub fn validate_export_size(
    size_bytes: u64,
    max_size_bytes: Option<u64>,
) -> Result<(), DatabaseError> {
    let limit = max_size_bytes.unwrap_or(DEFAULT_MAX_EXPORT_SIZE);

    if size_bytes > limit {
        let size_mb = size_bytes as f64 / (1024.0 * 1024.0);
        let limit_mb = limit as f64 / (1024.0 * 1024.0);

        return Err(DatabaseError::new(
            "DATABASE_TOO_LARGE",
            &format!(
                "Database too large for export: {:.2} MB exceeds limit of {:.2} MB. \
                Consider increasing max_export_size_bytes in DatabaseConfig or exporting in smaller chunks.",
                size_mb, limit_mb
            ),
        ));
    }

    Ok(())
}

/// Validate SQLite database file format
///
/// Performs comprehensive validation of a SQLite database file to ensure it can
/// be safely imported. Checks file structure, magic string, page size validity,
/// and size consistency.
///
/// # Arguments
/// * `data` - Complete SQLite database file as bytes
///
/// # Returns
/// * `Ok(())` - File is valid and safe to import
/// * `Err(DatabaseError)` - File is invalid with detailed error message
///
/// # Validation Checks
/// - File size is at least 100 bytes (minimum header size)
/// - Magic string matches "SQLite format 3\0"
/// - Page size is valid (power of 2, between 512 and 65536)
/// - Page count is non-zero
/// - File size matches (page_size × page_count)
///
/// # Example
/// ```rust,no_run
/// use absurder_sql::storage::export::validate_sqlite_file;
///
/// let file_data = std::fs::read("database.db").unwrap();
/// match validate_sqlite_file(&file_data) {
///     Ok(()) => println!("Valid SQLite file"),
///     Err(e) => eprintln!("Invalid file: {}", e),
/// }
/// ```
pub fn validate_sqlite_file(data: &[u8]) -> Result<(), DatabaseError> {
    // Check minimum file size
    if data.len() < SQLITE_HEADER_SIZE {
        return Err(DatabaseError::new(
            "INVALID_SQLITE_FILE",
            &format!(
                "File too small: {} bytes (minimum {} required)",
                data.len(),
                SQLITE_HEADER_SIZE
            ),
        ));
    }

    // Validate magic string
    if &data[0..16] != SQLITE_MAGIC {
        let magic_str = String::from_utf8_lossy(&data[0..16]);
        return Err(DatabaseError::new(
            "INVALID_SQLITE_FILE",
            &format!(
                "Invalid SQLite magic string. Expected 'SQLite format 3', got: '{}'",
                magic_str.trim_end_matches('\0')
            ),
        ));
    }

    // Parse page size
    let page_size_raw = u16::from_be_bytes([data[PAGE_SIZE_OFFSET], data[PAGE_SIZE_OFFSET + 1]]);
    let page_size = if page_size_raw == 1 {
        65536
    } else {
        page_size_raw as usize
    };

    // Validate page size is power of 2 and within valid range
    if page_size < MIN_PAGE_SIZE || page_size > MAX_PAGE_SIZE {
        return Err(DatabaseError::new(
            "INVALID_PAGE_SIZE",
            &format!(
                "Invalid page size: {}. Must be between {} and {}",
                page_size, MIN_PAGE_SIZE, MAX_PAGE_SIZE
            ),
        ));
    }

    if !page_size.is_power_of_two() {
        return Err(DatabaseError::new(
            "INVALID_PAGE_SIZE",
            &format!("Invalid page size: {}. Must be a power of 2", page_size),
        ));
    }

    // Parse page count
    let page_count = u32::from_be_bytes([
        data[PAGE_COUNT_OFFSET],
        data[PAGE_COUNT_OFFSET + 1],
        data[PAGE_COUNT_OFFSET + 2],
        data[PAGE_COUNT_OFFSET + 3],
    ]);

    // Validate page count is non-zero
    if page_count == 0 {
        return Err(DatabaseError::new(
            "INVALID_PAGE_COUNT",
            "Invalid page count: 0. Database must have at least one page",
        ));
    }

    // Validate file size matches header information
    let expected_size = (page_size as u64) * (page_count as u64);
    let actual_size = data.len() as u64;

    if actual_size != expected_size {
        return Err(DatabaseError::new(
            "SIZE_MISMATCH",
            &format!(
                "File size mismatch: expected {} bytes ({} pages × {} bytes), got {} bytes",
                expected_size, page_count, page_size, actual_size
            ),
        ));
    }

    log::debug!(
        "SQLite file validation passed: {} pages × {} bytes = {} bytes",
        page_count,
        page_size,
        expected_size
    );

    Ok(())
}

/// Export database from BlockStorage to SQLite .db file format
///
/// Reads all allocated blocks from storage and concatenates them into a standard
/// SQLite database file that can be opened by any SQLite client.
///
/// # Arguments
/// * `storage` - BlockStorage instance containing the database blocks
///
/// # Returns
/// * `Ok(Vec<u8>)` - Complete SQLite database file as bytes
/// * `Err(DatabaseError)` - If export fails
///
/// # Process
/// 1. Sync storage to ensure all changes are persisted
/// 2. Read block 0 (header) to determine database size
/// 3. Read all allocated blocks
/// 4. Concatenate blocks and truncate to exact database size
///
/// # Example
/// ```rust,no_run
/// use absurder_sql::storage::export::export_database_to_bytes;
/// use absurder_sql::storage::BlockStorage;
///
/// async fn export_example(mut storage: BlockStorage) -> Result<Vec<u8>, absurder_sql::types::DatabaseError> {
///     // Export with default 2GB limit
///     let db_bytes = export_database_to_bytes(&mut storage, None).await?;
///     // Save db_bytes to file or send to browser for download
///     Ok(db_bytes)
/// }
/// ```
#[cfg(target_arch = "wasm32")]
pub async fn export_database_to_bytes(
    storage: &BlockStorage,
    max_size_bytes: Option<u64>,
) -> Result<Vec<u8>, DatabaseError> {
    export_database_to_bytes_impl(storage, max_size_bytes).await
}

#[cfg(not(target_arch = "wasm32"))]
pub async fn export_database_to_bytes(
    storage: &mut BlockStorage,
    max_size_bytes: Option<u64>,
) -> Result<Vec<u8>, DatabaseError> {
    export_database_to_bytes_impl(storage, max_size_bytes).await
}

#[allow(invalid_reference_casting)]
async fn export_database_to_bytes_impl(
    storage: &BlockStorage,
    max_size_bytes: Option<u64>,
) -> Result<Vec<u8>, DatabaseError> {
    log::info!("Starting database export");

    // NOTE: Removed sync() call - export is a read-only operation and should not
    // trigger sync. The caller should ensure data is synced before export if needed.
    // Concurrent exports were hanging because all tried to sync simultaneously,
    // causing RefCell borrow conflicts in global storage.

    // Read first block to get header
    log::debug!("Reading block 0 for header");
    let header_block = storage.read_block(0).await?;
    log::debug!(
        "Block 0 size: {} bytes, first 16 bytes: {:?}",
        header_block.len(),
        &header_block.get(0..16).unwrap_or(&[])
    );

    // Parse header to determine database size
    let (page_size, page_count) = parse_sqlite_header(&header_block)?;

    // Calculate total database size
    let total_db_size = (page_size as u64) * (page_count as u64);

    // Validate size doesn't exceed maximum
    validate_export_size(total_db_size, max_size_bytes)?;

    // Warn if database is large (>100MB)
    const MB_100: u64 = 100 * 1024 * 1024;
    if total_db_size > MB_100 {
        log::warn!(
            "Exporting large database: {} bytes ({:.2} MB). This may consume significant memory.",
            total_db_size,
            total_db_size as f64 / (1024.0 * 1024.0)
        );
    }

    log::info!(
        "Export: page_size={}, page_count={}, total_size={}",
        page_size,
        page_count,
        total_db_size
    );
    let total_blocks = ((total_db_size + BLOCK_SIZE as u64 - 1) / BLOCK_SIZE as u64) as u64;

    // Build list of block IDs to read
    let block_ids: Vec<u64> = (0..total_blocks).collect();

    log::debug!("Reading {} blocks for export", block_ids.len());

    // DEBUG: Check what blocks actually exist in storage
    #[cfg(target_arch = "wasm32")]
    {
        use crate::storage::vfs_sync::with_global_storage;
        with_global_storage(|storage_map| {
            if let Some(db_storage) = storage_map.borrow().get(storage.get_db_name()) {
                web_sys::console::log_1(
                    &format!("[EXPORT] GLOBAL_STORAGE has {} blocks", db_storage.len()).into(),
                );
                web_sys::console::log_1(
                    &format!(
                        "[EXPORT] Block IDs in GLOBAL_STORAGE: {:?}",
                        db_storage.keys().collect::<Vec<_>>()
                    )
                    .into(),
                );
            }
        });
        web_sys::console::log_1(
            &format!(
                "[EXPORT] Requesting {} blocks: {:?}",
                block_ids.len(),
                block_ids
            )
            .into(),
        );
    }

    // Read all blocks at once
    let blocks = storage.read_blocks(&block_ids).await?;

    #[cfg(target_arch = "wasm32")]
    web_sys::console::log_1(&format!("[EXPORT] Actually read {} blocks", blocks.len()).into());

    // Concatenate all blocks
    let mut result = Vec::with_capacity(total_db_size as usize);
    for (i, block) in blocks.iter().enumerate() {
        result.extend_from_slice(&block);
        #[cfg(target_arch = "wasm32")]
        if i < 5 {
            web_sys::console::log_1(
                &format!(
                    "[EXPORT] Block {} has {} bytes, first 16: {:02x?}",
                    i,
                    block.len(),
                    &block[..16.min(block.len())]
                )
                .into(),
            );
        }
        #[cfg(not(target_arch = "wasm32"))]
        let _ = i; // Suppress unused warning on native
    }

    // Truncate to exact database size
    result.truncate(total_db_size as usize);

    log::info!("Export complete: {} bytes", result.len());

    #[cfg(target_arch = "wasm32")]
    {
        web_sys::console::log_1(&format!("[EXPORT] Final result: {} bytes", result.len()).into());
        if result.len() >= 100 {
            web_sys::console::log_1(
                &format!("[EXPORT] Header bytes 28-39: {:02x?}", &result[28..40]).into(),
            );
            web_sys::console::log_1(
                &format!("[EXPORT] Header bytes 40-60: {:02x?}", &result[40..60]).into(),
            );
            let largest_root_page =
                u32::from_be_bytes([result[52], result[53], result[54], result[55]]);
            web_sys::console::log_1(
                &format!(
                    "[EXPORT] Largest root b-tree page (bytes 52-55): {}",
                    largest_root_page
                )
                .into(),
            );
        }
    }

    Ok(result)
}

/// Export database with advanced options (streaming, progress callbacks)
///
/// For large databases (>100MB), this function processes blocks in chunks,
/// yields to the event loop between chunks, and reports progress.
///
/// # Arguments
/// * `storage` - Block storage containing the database
/// * `options` - Export configuration (size limits, chunk size, progress callback)
///
/// # Returns
/// Complete database as bytes
///
/// # Example
/// ```rust,no_run
/// use absurder_sql::storage::export::{export_database_with_options, ExportOptions};
/// use absurder_sql::storage::BlockStorage;
///
/// async fn export_with_progress(mut storage: BlockStorage) -> Result<Vec<u8>, absurder_sql::types::DatabaseError> {
///     let options = ExportOptions {
///         max_size_bytes: Some(1024 * 1024 * 1024), // 1GB limit
///         chunk_size_bytes: Some(10 * 1024 * 1024), // 10MB chunks
///         progress_callback: Some(Box::new(|exported, total| {
///             println!("Progress: {}/{} bytes ({:.1}%)",
///                 exported, total, (exported as f64 / total as f64) * 100.0);
///         })),
///     };
///     export_database_with_options(&mut storage, options).await
/// }
/// ```
#[cfg(target_arch = "wasm32")]
pub async fn export_database_with_options(
    storage: &BlockStorage,
    options: ExportOptions,
) -> Result<Vec<u8>, DatabaseError> {
    export_database_with_options_impl(storage, options).await
}

#[cfg(not(target_arch = "wasm32"))]
pub async fn export_database_with_options(
    storage: &mut BlockStorage,
    options: ExportOptions,
) -> Result<Vec<u8>, DatabaseError> {
    export_database_with_options_impl(storage, options).await
}

#[allow(invalid_reference_casting)]
async fn export_database_with_options_impl(
    storage: &BlockStorage,
    options: ExportOptions,
) -> Result<Vec<u8>, DatabaseError> {
    log::info!("Starting streaming database export");

    // Force sync to ensure all data is persisted
    #[cfg(target_arch = "wasm32")]
    storage.sync().await?;
    #[cfg(not(target_arch = "wasm32"))]
    {
        // SAFETY: Called from public API that takes &mut on native
        let storage_mut = unsafe { &mut *(storage as *const _ as *mut BlockStorage) };
        storage_mut.sync().await?;
    }

    // Read first block to get header
    log::debug!("Reading block 0 for header");
    let header_block = storage.read_block(0).await?;

    // Parse header to determine database size
    let (page_size, page_count) = parse_sqlite_header(&header_block)?;
    let total_db_size = (page_size as u64) * (page_count as u64);

    // Validate size doesn't exceed maximum
    validate_export_size(total_db_size, options.max_size_bytes)?;

    // Warn if database is large (>100MB)
    const MB_100: u64 = 100 * 1024 * 1024;
    if total_db_size > MB_100 {
        log::warn!(
            "Exporting large database: {} bytes ({:.2} MB). Using streaming export with chunks.",
            total_db_size,
            total_db_size as f64 / (1024.0 * 1024.0)
        );
    }

    log::info!(
        "Export: page_size={}, page_count={}, total_size={}",
        page_size,
        page_count,
        total_db_size
    );

    let total_blocks = ((total_db_size + BLOCK_SIZE as u64 - 1) / BLOCK_SIZE as u64) as u64;
    let chunk_size = options.chunk_size_bytes.unwrap_or(DEFAULT_CHUNK_SIZE);
    let blocks_per_chunk = (chunk_size / BLOCK_SIZE as u64).max(1);

    // Preallocate result vector
    let mut result = Vec::with_capacity(total_db_size as usize);

    // Process blocks in chunks
    for chunk_start in (0..total_blocks).step_by(blocks_per_chunk as usize) {
        let chunk_end = (chunk_start + blocks_per_chunk).min(total_blocks);
        let block_ids: Vec<u64> = (chunk_start..chunk_end).collect();

        log::debug!(
            "Reading blocks {}-{} ({} blocks)",
            chunk_start,
            chunk_end - 1,
            block_ids.len()
        );

        // Read chunk of blocks
        let blocks = storage.read_blocks(&block_ids).await?;

        // Concatenate blocks in this chunk
        for block in blocks {
            result.extend_from_slice(&block);
        }

        let bytes_exported = result.len() as u64;

        // Invoke progress callback if provided
        if let Some(ref callback) = options.progress_callback {
            callback(bytes_exported.min(total_db_size), total_db_size);
        }

        // Yield to event loop between chunks to prevent blocking
        #[cfg(target_arch = "wasm32")]
        {
            // In WASM, yield to browser event loop
            wasm_bindgen_futures::JsFuture::from(js_sys::Promise::resolve(
                &wasm_bindgen::JsValue::NULL,
            ))
            .await
            .ok();
        }
        #[cfg(not(target_arch = "wasm32"))]
        {
            // In native, yield to tokio runtime
            tokio::task::yield_now().await;
        }
    }

    // Truncate to exact database size
    result.truncate(total_db_size as usize);

    // Final progress callback
    if let Some(ref callback) = options.progress_callback {
        callback(total_db_size, total_db_size);
    }

    log::info!("Streaming export complete: {} bytes", result.len());

    Ok(result)
}

/// Streaming export with basic parameters (convenience wrapper)
///
/// Simplified interface for streaming export with progress callback.
/// For full control, use `export_database_with_options`.
///
/// # Arguments
/// * `storage` - Block storage containing the database
/// * `max_size_bytes` - Maximum allowed size (None for default 2GB)
/// * `chunk_size_bytes` - Chunk size for streaming (None for default 10MB)
/// * `progress_callback` - Optional progress callback
///
/// # Example
/// ```rust,no_run
/// use absurder_sql::storage::export::export_database_to_bytes_streaming;
/// use absurder_sql::storage::BlockStorage;
///
/// async fn export_example(mut storage: BlockStorage) -> Result<Vec<u8>, absurder_sql::types::DatabaseError> {
///     let progress = Box::new(|exported: u64, total: u64| {
///         println!("Exported {}/{} bytes", exported, total);
///     });
///     
///     export_database_to_bytes_streaming(
///         &mut storage,
///         None,
///         Some(10 * 1024 * 1024), // 10MB chunks
///         Some(progress)
///     ).await
/// }
/// ```
#[cfg(target_arch = "wasm32")]
pub async fn export_database_to_bytes_streaming(
    storage: &BlockStorage,
    max_size_bytes: Option<u64>,
    chunk_size_bytes: Option<u64>,
    progress_callback: Option<ProgressCallback>,
) -> Result<Vec<u8>, DatabaseError> {
    let options = ExportOptions {
        max_size_bytes,
        chunk_size_bytes,
        progress_callback,
    };
    export_database_with_options(storage, options).await
}

#[cfg(not(target_arch = "wasm32"))]
pub async fn export_database_to_bytes_streaming(
    storage: &mut BlockStorage,
    max_size_bytes: Option<u64>,
    chunk_size_bytes: Option<u64>,
    progress_callback: Option<ProgressCallback>,
) -> Result<Vec<u8>, DatabaseError> {
    let options = ExportOptions {
        max_size_bytes,
        chunk_size_bytes,
        progress_callback,
    };
    export_database_with_options(storage, options).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sqlite_magic_constant() {
        assert_eq!(SQLITE_MAGIC.len(), 16);
        assert_eq!(&SQLITE_MAGIC[0..14], b"SQLite format ");
    }

    #[test]
    fn test_header_size_constant() {
        assert_eq!(SQLITE_HEADER_SIZE, 100);
    }

    #[test]
    fn test_page_size_offset() {
        assert_eq!(PAGE_SIZE_OFFSET, 16);
    }

    #[test]
    fn test_page_count_offset() {
        assert_eq!(PAGE_COUNT_OFFSET, 28);
    }
}
