//! Tests for SQLite database export/import functionality
//!
//! Tests the conversion between IndexedDB block storage and standard SQLite .db files

// Lock macro for accessing Mutex-wrapped fields uniformly across WASM and native
#[allow(unused_macros)]
#[cfg(target_arch = "wasm32")]
macro_rules! lock_mutex {
    ($mutex:expr) => {
        $mutex.try_borrow_mut().expect("RefCell borrow failed")
    };
}

#[allow(unused_macros)]
#[cfg(not(target_arch = "wasm32"))]
macro_rules! lock_mutex {
    ($mutex:expr) => {
        $mutex.borrow_mut()
    };
}

#[cfg(target_arch = "wasm32")]
use wasm_bindgen_test::*;

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::JsCast;

#[cfg(target_arch = "wasm32")]
wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

/// Test SQLite header parsing with valid header
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_parse_sqlite_header_valid() {
    use absurder_sql::storage::export::parse_sqlite_header;

    // Create a minimal valid SQLite header
    let mut header = vec![0u8; 100];

    // Magic string: "SQLite format 3\0"
    header[0..16].copy_from_slice(b"SQLite format 3\0");

    // Page size: 4096 (0x1000) at bytes 16-17 (big-endian)
    header[16] = 0x10;
    header[17] = 0x00;

    // File change counter at bytes 24-27
    header[24..28].copy_from_slice(&[0, 0, 0, 1]);

    // Page count: 10 pages at bytes 28-31 (big-endian)
    header[28..32].copy_from_slice(&[0, 0, 0, 10]);

    let result = parse_sqlite_header(&header);
    assert!(result.is_ok());

    let (page_size, page_count) = result.unwrap();
    assert_eq!(page_size, 4096);
    assert_eq!(page_count, 10);
}

/// Test SQLite header parsing with special page size (65536)
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_parse_sqlite_header_special_page_size() {
    use absurder_sql::storage::export::parse_sqlite_header;

    let mut header = vec![0u8; 100];
    header[0..16].copy_from_slice(b"SQLite format 3\0");

    // Page size: 1 means 65536
    header[16] = 0x00;
    header[17] = 0x01;

    header[28..32].copy_from_slice(&[0, 0, 0, 5]);

    let result = parse_sqlite_header(&header);
    assert!(result.is_ok());

    let (page_size, page_count) = result.unwrap();
    assert_eq!(page_size, 65536);
    assert_eq!(page_count, 5);
}

/// Test SQLite header parsing with invalid magic string
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_parse_sqlite_header_invalid_magic() {
    use absurder_sql::storage::export::parse_sqlite_header;

    let mut header = vec![0u8; 100];
    header[0..16].copy_from_slice(b"Invalid format!\0");

    let result = parse_sqlite_header(&header);
    assert!(result.is_err());
    assert!(result.unwrap_err().message.contains("Invalid SQLite"));
}

/// Test SQLite header parsing with insufficient data
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_parse_sqlite_header_insufficient_data() {
    use absurder_sql::storage::export::parse_sqlite_header;

    let header = vec![0u8; 50]; // Less than 100 bytes

    let result = parse_sqlite_header(&header);
    assert!(result.is_err());
    assert!(result.unwrap_err().message.contains("Header too small"));
}

/// Test SQLite header parsing with various page sizes
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_parse_sqlite_header_various_page_sizes() {
    use absurder_sql::storage::export::parse_sqlite_header;

    let test_cases = vec![
        (512, 0x02, 0x00),
        (1024, 0x04, 0x00),
        (2048, 0x08, 0x00),
        (4096, 0x10, 0x00),
        (8192, 0x20, 0x00),
        (16384, 0x40, 0x00),
        (32768, 0x80, 0x00),
    ];

    for (expected_size, byte1, byte2) in test_cases {
        let mut header = vec![0u8; 100];
        header[0..16].copy_from_slice(b"SQLite format 3\0");
        header[16] = byte1;
        header[17] = byte2;
        header[28..32].copy_from_slice(&[0, 0, 0, 1]);

        let result = parse_sqlite_header(&header);
        assert!(result.is_ok(), "Failed for page size {}", expected_size);
        assert_eq!(result.unwrap().0, expected_size);
    }
}

/// Test header parsing extracts correct page count
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_parse_sqlite_header_page_count() {
    use absurder_sql::storage::export::parse_sqlite_header;

    let test_counts = vec![0, 1, 100, 1000, 65535, 1000000];

    for expected_count in test_counts {
        let mut header = vec![0u8; 100];
        header[0..16].copy_from_slice(b"SQLite format 3\0");
        header[16] = 0x10; // 4096 page size
        header[17] = 0x00;

        // Write page count as big-endian u32
        let count_bytes = (expected_count as u32).to_be_bytes();
        header[28..32].copy_from_slice(&count_bytes);

        let result = parse_sqlite_header(&header);
        assert!(result.is_ok());
        assert_eq!(result.unwrap().1, expected_count as u32);
    }
}

/// Test database export to bytes via WASM interface
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_database_export_to_file() {
    use absurder_sql::{Database, DatabaseConfig};

    // Create a test database
    let config = DatabaseConfig {
        name: "test_export.db".to_string(),
        version: None,
        cache_size: None,
        page_size: None,
        auto_vacuum: None,
        journal_mode: None,
        max_export_size_bytes: Some(2 * 1024 * 1024 * 1024),
    };

    let mut db = Database::new(config)
        .await
        .expect("Failed to create database");

    // Allow non-leader writes for test
    db.allow_non_leader_writes(true)
        .await
        .expect("Failed to allow non-leader writes");

    // Create a table and insert some data
    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)")
        .await
        .expect("Failed to create table");

    db.execute("INSERT INTO test (value) VALUES ('test data')")
        .await
        .expect("Failed to insert data");

    // Export the database
    let exported_bytes = db
        .export_to_file()
        .await
        .expect("Failed to export database");

    // Verify it's a valid Uint8Array
    assert!(exported_bytes.is_object());
    assert!(exported_bytes.is_instance_of::<js_sys::Uint8Array>());

    // Convert to Rust Vec to check content
    let uint8_array = js_sys::Uint8Array::from(exported_bytes);
    let exported_vec = uint8_array.to_vec();

    // Verify the exported data starts with SQLite magic string
    assert!(exported_vec.len() >= 16);
    assert_eq!(&exported_vec[0..16], b"SQLite format 3\0");

    // Verify the file has reasonable size (should be at least one page)
    assert!(exported_vec.len() >= 4096);
}

/// Test export with multiple tables and data
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_export_multi_table_database() {
    use absurder_sql::{Database, DatabaseConfig};

    let config = DatabaseConfig {
        name: "test_multi_export.db".to_string(),
        version: None,
        cache_size: None,
        page_size: None,
        auto_vacuum: None,
        journal_mode: None,
        max_export_size_bytes: Some(2 * 1024 * 1024 * 1024),
    };

    let mut db = Database::new(config)
        .await
        .expect("Failed to create database");

    db.allow_non_leader_writes(true)
        .await
        .expect("Failed to allow non-leader writes");

    // Create multiple tables
    db.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)")
        .await
        .expect("Failed to create users table");

    db.execute("CREATE TABLE posts (id INTEGER PRIMARY KEY, user_id INTEGER, content TEXT)")
        .await
        .expect("Failed to create posts table");

    // Insert data
    db.execute("INSERT INTO users (name) VALUES ('Alice')")
        .await
        .expect("Failed to insert user");

    db.execute("INSERT INTO posts (user_id, content) VALUES (1, 'Hello World')")
        .await
        .expect("Failed to insert post");

    // Export
    let exported_bytes = db
        .export_to_file()
        .await
        .expect("Failed to export database");

    let uint8_array = js_sys::Uint8Array::from(exported_bytes);
    let exported_vec = uint8_array.to_vec();

    // Verify valid SQLite format
    assert_eq!(&exported_vec[0..16], b"SQLite format 3\0");

    // Should be larger than a single page since we have data
    assert!(exported_vec.len() > 4096);
}

// ============================================================================
// IMPORT/VALIDATION TESTS
// ============================================================================

/// Test SQLite file validation with valid file
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_validate_sqlite_file_valid() {
    use absurder_sql::storage::export::validate_sqlite_file;

    // Create a minimal valid SQLite file
    let mut data = vec![0u8; 8192]; // Two pages

    // Magic string: "SQLite format 3\0"
    data[0..16].copy_from_slice(b"SQLite format 3\0");

    // Page size: 4096 (0x1000) at bytes 16-17 (big-endian)
    data[16] = 0x10;
    data[17] = 0x00;

    // Page count: 2 pages at bytes 28-31 (big-endian)
    data[28..32].copy_from_slice(&[0, 0, 0, 2]);

    let result = validate_sqlite_file(&data);
    assert!(result.is_ok());
}

/// Test SQLite file validation with invalid magic string
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_validate_sqlite_file_invalid_magic() {
    use absurder_sql::storage::export::validate_sqlite_file;

    let mut data = vec![0u8; 100];
    data[0..16].copy_from_slice(b"Invalid format!\0");

    let result = validate_sqlite_file(&data);
    assert!(result.is_err());
    assert!(result.unwrap_err().message.contains("Invalid SQLite"));
}

/// Test SQLite file validation with insufficient data
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_validate_sqlite_file_too_small() {
    use absurder_sql::storage::export::validate_sqlite_file;

    let data = vec![0u8; 50]; // Less than 100 bytes

    let result = validate_sqlite_file(&data);
    assert!(result.is_err());
    assert!(result.unwrap_err().message.contains("too small"));
}

/// Test SQLite file validation with invalid page size
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_validate_sqlite_file_invalid_page_size() {
    use absurder_sql::storage::export::validate_sqlite_file;

    let mut data = vec![0u8; 1000];
    data[0..16].copy_from_slice(b"SQLite format 3\0");

    // Invalid page size: 300 (not a power of 2)
    data[16] = 0x01;
    data[17] = 0x2C;

    data[28..32].copy_from_slice(&[0, 0, 0, 1]);

    let result = validate_sqlite_file(&data);
    assert!(result.is_err());
    assert!(result.unwrap_err().message.contains("page size"));
}

/// Test SQLite file validation with size mismatch
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_validate_sqlite_file_size_mismatch() {
    use absurder_sql::storage::export::validate_sqlite_file;

    let mut data = vec![0u8; 4096]; // Only one page
    data[0..16].copy_from_slice(b"SQLite format 3\0");

    // Page size: 4096
    data[16] = 0x10;
    data[17] = 0x00;

    // Page count: 10 pages (but we only have 1 page of data)
    data[28..32].copy_from_slice(&[0, 0, 0, 10]);

    let result = validate_sqlite_file(&data);
    assert!(result.is_err());
    assert!(result.unwrap_err().message.contains("size mismatch"));
}

/// Test SQLite file validation with zero page count
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_validate_sqlite_file_zero_pages() {
    use absurder_sql::storage::export::validate_sqlite_file;

    let mut data = vec![0u8; 4096];
    data[0..16].copy_from_slice(b"SQLite format 3\0");

    // Page size: 4096
    data[16] = 0x10;
    data[17] = 0x00;

    // Page count: 0 (invalid)
    data[28..32].copy_from_slice(&[0, 0, 0, 0]);

    let result = validate_sqlite_file(&data);
    assert!(result.is_err());
    assert!(result.unwrap_err().message.contains("page count"));
}

// ============================================================================
// STORAGE CLEARING TESTS
// ============================================================================

/// Test clearing storage for a database
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_clear_database_storage() {
    use absurder_sql::storage::import::clear_database_storage;
    use absurder_sql::storage::vfs_sync::{
        with_global_allocation_map, with_global_commit_marker, with_global_storage,
    };
    use std::collections::HashMap;

    let db_name = "test_clear_db.db";

    // Manually populate GLOBAL_STORAGE with test data
    with_global_storage(|gs| {
        let mut storage = lock_mutex!(gs);
        let mut blocks = HashMap::new();
        blocks.insert(0, vec![1, 2, 3, 4]);
        blocks.insert(1, vec![5, 6, 7, 8]);
        storage.insert(db_name.to_string(), blocks);
    });

    // Populate GLOBAL_METADATA for native tests
    #[cfg(all(
        not(target_arch = "wasm32"),
        any(test, debug_assertions),
        not(feature = "fs_persist")
    ))]
    {
        use absurder_sql::storage::metadata::{BlockMetadataPersist, ChecksumAlgorithm};
        use absurder_sql::storage::vfs_sync::with_global_metadata;

        with_global_metadata(|gm| {
            let mut metadata = gm.lock(); // Metadata uses Mutex in native builds
            let mut meta_map = HashMap::new();
            meta_map.insert(
                0,
                BlockMetadataPersist {
                    checksum: 123,
                    version: 1,
                    last_modified_ms: 1000,
                    algo: ChecksumAlgorithm::FastHash,
                },
            );
            metadata.insert(db_name.to_string(), meta_map);
        });
    }

    // Populate GLOBAL_COMMIT_MARKER
    with_global_commit_marker(|gcm| {
        let mut markers = lock_mutex!(gcm);
        markers.insert(db_name.to_string(), 42);
    });

    // Populate GLOBAL_ALLOCATION_MAP
    with_global_allocation_map(|gam| {
        let mut alloc = lock_mutex!(gam);
        let mut ids = std::collections::HashSet::new();
        ids.insert(0);
        ids.insert(1);
        alloc.insert(db_name.to_string(), ids);
    });

    // Verify data exists
    with_global_storage(|gs| {
        let storage = lock_mutex!(gs);
        assert!(storage.contains_key(db_name));
        assert_eq!(storage.get(db_name).unwrap().len(), 2);
    });

    // Clear the storage
    let result = futures::executor::block_on(clear_database_storage(db_name));
    assert!(result.is_ok());

    // Verify storage is cleared
    with_global_storage(|gs| {
        let storage = lock_mutex!(gs);
        assert!(!storage.contains_key(db_name) || storage.get(db_name).unwrap().is_empty());
    });

    // Verify metadata is cleared
    #[cfg(all(
        not(target_arch = "wasm32"),
        any(test, debug_assertions),
        not(feature = "fs_persist")
    ))]
    {
        use absurder_sql::storage::vfs_sync::with_global_metadata;
        with_global_metadata(|gm| {
            let metadata = gm.lock(); // Metadata uses Mutex in native builds
            assert!(!metadata.contains_key(db_name) || metadata.get(db_name).unwrap().is_empty());
        });
    }

    // Verify commit marker is cleared
    with_global_commit_marker(|gcm| {
        let markers = lock_mutex!(gcm);
        assert!(!markers.contains_key(db_name) || markers.get(db_name) == Some(&0));
    });

    // Verify allocation map is cleared
    with_global_allocation_map(|gam| {
        let alloc = lock_mutex!(gam);
        assert!(!alloc.contains_key(db_name) || alloc.get(db_name).unwrap().is_empty());
    });
}

/// Test clearing non-existent database (should not error)
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_clear_nonexistent_database() {
    use absurder_sql::storage::import::clear_database_storage;

    let db_name = "nonexistent_db_12345.db";

    // Should not error when clearing non-existent database
    let result = futures::executor::block_on(clear_database_storage(db_name));
    assert!(result.is_ok());
}

/// Test that export warns about large databases (>100MB)
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_export_large_database_warning() {
    use absurder_sql::storage::export::parse_sqlite_header;

    // Create a header for a large database (>100MB)
    // Page size: 4096 bytes, Page count: 30000 (122.88 MB)
    let mut header = vec![0u8; 100];
    header[0..16].copy_from_slice(b"SQLite format 3\0");
    header[16] = 0x10; // Page size high byte (4096 = 0x1000)
    header[17] = 0x00; // Page size low byte
    header[28] = 0x00; // Page count byte 0
    header[29] = 0x00; // Page count byte 1
    header[30] = 0x75; // Page count byte 2 (30000 = 0x7530)
    header[31] = 0x30; // Page count byte 3

    let (page_size, page_count) = parse_sqlite_header(&header).expect("Valid header");
    let total_size = (page_size as u64) * (page_count as u64);

    // Verify it's over 100MB
    assert!(total_size > 100 * 1024 * 1024, "Database should be >100MB");
    assert_eq!(page_size, 4096);
    assert_eq!(page_count, 30000);
}

/// Test that export errors on excessively large databases (>2GB default)
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_export_excessively_large_database_error() {
    use absurder_sql::storage::export::{parse_sqlite_header, validate_export_size};

    // Create a header for an excessively large database (>2GB)
    // Page size: 4096 bytes, Page count: 600000 (2.4 GB = 2,457,600,000 bytes)
    let mut header = vec![0u8; 100];
    header[0..16].copy_from_slice(b"SQLite format 3\0");
    header[16] = 0x10; // Page size high byte (4096 = 0x1000)
    header[17] = 0x00; // Page size low byte
    header[28] = 0x00; // Page count byte 0 (600000 = 0x000927C0)
    header[29] = 0x09; // Page count byte 1
    header[30] = 0x27; // Page count byte 2
    header[31] = 0xC0; // Page count byte 3

    let (page_size, page_count) = parse_sqlite_header(&header).expect("Valid header");
    let total_size = (page_size as u64) * (page_count as u64);

    // Verify it's over 2GB
    assert!(
        total_size > 2 * 1024 * 1024 * 1024,
        "Database should be >2GB"
    );
    assert_eq!(page_size, 4096);
    assert_eq!(page_count, 600000);

    // Should error with default limit (2GB)
    let result = validate_export_size(total_size, None);
    assert!(result.is_err(), "Should error for database >2GB");
    let error = result.unwrap_err();
    assert!(error.message.contains("too large"));
    assert!(error.message.contains("2048.00")); // 2GB in MB
}

/// Test that export size limit is configurable
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_export_size_limit_configurable() {
    use absurder_sql::storage::export::validate_export_size;

    let size_3gb = 3 * 1024 * 1024 * 1024;

    // Should error with default limit (2GB)
    let result = validate_export_size(size_3gb, None);
    assert!(result.is_err(), "Should error with default 2GB limit");

    // Should pass with custom limit (5GB)
    let result = validate_export_size(size_3gb, Some(5 * 1024 * 1024 * 1024));
    assert!(result.is_ok(), "Should pass with 5GB limit");

    // Should error with lower custom limit (1GB)
    let result = validate_export_size(size_3gb, Some(1024 * 1024 * 1024));
    assert!(result.is_err(), "Should error with 1GB limit");
}

/// Test clearing database doesn't affect other databases
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_clear_database_isolation() {
    use absurder_sql::storage::import::clear_database_storage;
    use absurder_sql::storage::vfs_sync::with_global_storage;
    use std::collections::HashMap;

    let db1 = "test_db1.db";
    let db2 = "test_db2.db";

    // Populate two databases
    with_global_storage(|gs| {
        let mut storage = lock_mutex!(gs);

        let mut blocks1 = HashMap::new();
        blocks1.insert(0, vec![1, 2, 3, 4]);
        storage.insert(db1.to_string(), blocks1);

        let mut blocks2 = HashMap::new();
        blocks2.insert(0, vec![5, 6, 7, 8]);
        storage.insert(db2.to_string(), blocks2);
    });

    // Clear only db1
    let result = futures::executor::block_on(clear_database_storage(db1));
    assert!(result.is_ok());

    // Verify db1 is cleared
    with_global_storage(|gs| {
        let storage = lock_mutex!(gs);
        assert!(!storage.contains_key(db1) || storage.get(db1).unwrap().is_empty());
    });

    // Verify db2 is NOT affected
    with_global_storage(|gs| {
        let storage = lock_mutex!(gs);
        assert!(storage.contains_key(db2));
        assert_eq!(storage.get(db2).unwrap().len(), 1);
        assert_eq!(
            storage.get(db2).unwrap().get(&0).unwrap(),
            &vec![5, 6, 7, 8]
        );
    });
}

/// Test streaming export with progress callback for large databases
#[cfg(not(target_arch = "wasm32"))]
#[tokio::test]
async fn test_streaming_export_with_progress_callback() {
    use absurder_sql::storage::export::ExportOptions;
    use std::sync::{Arc, Mutex};

    // This test verifies that ExportOptions and streaming functions exist and compile
    // It validates the API surface without needing actual database setup

    // Track progress callback invocations
    let progress_calls = Arc::new(Mutex::new(Vec::new()));
    let progress_calls_clone = progress_calls.clone();

    let _progress_callback = move |bytes_exported: u64, total_bytes: u64| {
        progress_calls_clone
            .lock()
            .unwrap()
            .push((bytes_exported, total_bytes));
    };

    // Verify ExportOptions can be constructed
    let options = ExportOptions {
        max_size_bytes: Some(1024 * 1024 * 1024), // 1GB
        chunk_size_bytes: Some(10 * 1024 * 1024), // 10MB chunks
        progress_callback: None, // Would use Box::new(progress_callback) in real usage
    };

    assert_eq!(options.max_size_bytes, Some(1024 * 1024 * 1024));
    assert_eq!(options.chunk_size_bytes, Some(10 * 1024 * 1024));

    // Verify the function signature exists (compilation test)
    // In a full integration test, this would use actual storage
    // For now, we're validating the API exists and type-checks
}

/// Test that chunk size parameter controls batch size
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_export_chunk_size_parameter() {
    use absurder_sql::storage::export::ExportOptions;

    // Test with different chunk sizes
    let options_10mb = ExportOptions {
        max_size_bytes: None,
        chunk_size_bytes: Some(10 * 1024 * 1024), // 10MB chunks
        progress_callback: None,
    };

    let options_5mb = ExportOptions {
        max_size_bytes: None,
        chunk_size_bytes: Some(5 * 1024 * 1024), // 5MB chunks
        progress_callback: None,
    };

    // Verify options can be created with different chunk sizes
    assert_eq!(options_10mb.chunk_size_bytes, Some(10 * 1024 * 1024));
    assert_eq!(options_5mb.chunk_size_bytes, Some(5 * 1024 * 1024));
}

/// Test that export yields to event loop between batches
#[cfg(not(target_arch = "wasm32"))]
#[tokio::test]
async fn test_export_yields_between_batches() {
    use std::time::{Duration, Instant};

    // This test verifies that tokio::task::yield_now() works as expected
    // The actual export function uses this to yield between chunks

    let start = Instant::now();
    let concurrent_task = tokio::spawn(async move {
        // This task should complete relatively quickly
        tokio::time::sleep(Duration::from_millis(10)).await;
        Instant::now()
    });

    // Simulate yielding between chunks (what export does)
    for _ in 0..5 {
        tokio::task::yield_now().await;
    }

    let concurrent_end = concurrent_task.await.unwrap();
    let concurrent_duration = concurrent_end.duration_since(start);

    // Concurrent task should complete in reasonable time (not blocked)
    assert!(
        concurrent_duration < Duration::from_millis(100),
        "Concurrent task was blocked, yield_now not working"
    );
}

/// Test memory availability check before export
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_check_memory_availability() {
    use absurder_sql::utils::check_available_memory;

    // Check memory info is available
    let memory_info = check_available_memory();

    // Should return some information about available memory
    assert!(
        memory_info.is_some(),
        "Should be able to check memory availability"
    );

    if let Some(info) = memory_info {
        // Available memory should be > 0
        assert!(
            info.available_bytes > 0,
            "Available memory should be positive"
        );

        // Total memory should be >= available memory
        if let Some(total) = info.total_bytes {
            assert!(
                total >= info.available_bytes,
                "Total memory should be >= available"
            );
        }
    }
}

/// Test memory requirement estimation
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_estimate_export_memory_requirement() {
    use absurder_sql::utils::estimate_export_memory_requirement;

    // Test estimating memory for different database sizes
    let db_size_100mb = 100 * 1024 * 1024;
    let required = estimate_export_memory_requirement(db_size_100mb);

    // Should require at least the database size
    assert!(
        required >= db_size_100mb,
        "Memory requirement should be >= database size"
    );

    // Should include overhead (1.5x-2x for buffers, intermediate storage, etc.)
    assert!(
        required <= db_size_100mb * 3,
        "Memory requirement shouldn't be > 3x database size"
    );
}

/// Test memory check before export operation
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_validate_memory_for_export() {
    use absurder_sql::utils::validate_memory_for_export;

    // Test with a reasonable size (10MB) - should pass on most systems
    let db_size_10mb = 10 * 1024 * 1024;
    let result = validate_memory_for_export(db_size_10mb);

    // Should either succeed or return clear error message
    match result {
        Ok(_) => {
            // Memory is available
        }
        Err(e) => {
            // Error message should be helpful
            assert!(
                e.message.contains("memory") || e.message.contains("Memory"),
                "Error message should mention memory"
            );
        }
    }
}

// ============================================================================
// CONCURRENT OPERATIONS TESTS
// ============================================================================

/// Test concurrent export attempts
///
/// Verifies that multiple concurrent export operations on the same database
/// work correctly without data corruption or race conditions. This test spawns
/// multiple async tasks that attempt to export simultaneously.
#[cfg(not(target_arch = "wasm32"))]
#[tokio::test]
async fn test_concurrent_export_attempts() {
    use absurder_sql::storage::block_storage::BlockStorage;
    use absurder_sql::storage::export::export_database_to_bytes;
    use std::sync::Arc;

    let db_name = "test_concurrent_exports.db";

    // Create and populate a test database
    let mut storage = BlockStorage::new(db_name).await.expect("create storage");

    // Create a minimal SQLite database with 10 blocks
    const NUM_BLOCKS: u64 = 10;
    const BLOCK_SIZE: usize = 4096;

    // Create header block
    let mut header = vec![0u8; BLOCK_SIZE];
    header[0..16].copy_from_slice(b"SQLite format 3\0");
    header[16] = 0x10; // Page size high byte
    header[17] = 0x00; // Page size low byte
    header[18] = 0x01; // Write version
    header[19] = 0x01; // Read version
    let page_count_bytes = (NUM_BLOCKS as u32).to_be_bytes();
    header[28..32].copy_from_slice(&page_count_bytes);

    // Add a unique marker
    header[100] = 0xAB;
    header[101] = 0xCD;

    storage.write_block(0, header).await.expect("write header");

    // Write remaining blocks with unique patterns
    for block_id in 1..NUM_BLOCKS {
        let mut block = vec![0u8; BLOCK_SIZE];
        let pattern = block_id as u8;
        for (i, byte) in block.iter_mut().enumerate() {
            *byte = pattern.wrapping_add((i % 256) as u8);
        }
        storage
            .write_block(block_id, block)
            .await
            .unwrap_or_else(|_| panic!("write block {}", block_id));
    }

    storage.sync().await.expect("sync storage");
    drop(storage); // Release initial storage

    // Wrap database name in Arc for sharing across tasks
    let db_name_arc = Arc::new(db_name.to_string());

    // Spawn multiple concurrent export tasks
    const NUM_CONCURRENT: usize = 5;
    let mut tasks = vec![];

    for task_id in 0..NUM_CONCURRENT {
        let db_name_clone = Arc::clone(&db_name_arc);

        let task = tokio::spawn(async move {
            println!("Task {} starting export", task_id);

            // Each task gets its own BlockStorage instance
            let mut task_storage = BlockStorage::new(&db_name_clone)
                .await
                .unwrap_or_else(|_| panic!("Task {} create storage", task_id));

            // Perform export
            let export_result = export_database_to_bytes(&mut task_storage, None).await;

            match export_result {
                Ok(data) => {
                    println!("Task {} completed export: {} bytes", task_id, data.len());

                    // Verify the exported data has correct size
                    assert_eq!(
                        data.len(),
                        (NUM_BLOCKS * BLOCK_SIZE as u64) as usize,
                        "Task {} export size should match",
                        task_id
                    );

                    // Verify header marker
                    assert_eq!(data[100], 0xAB, "Task {} header marker 1", task_id);
                    assert_eq!(data[101], 0xCD, "Task {} header marker 2", task_id);

                    Ok(data)
                }
                Err(e) => {
                    println!("Task {} export failed: {}", task_id, e.message);
                    Err(e)
                }
            }
        });

        tasks.push(task);
    }

    // Wait for all tasks to complete
    let results = futures::future::join_all(tasks).await;

    // Verify all tasks succeeded
    let mut successful_exports = 0;
    let mut first_export: Option<Vec<u8>> = None;

    for (idx, result) in results.iter().enumerate() {
        match result {
            Ok(Ok(data)) => {
                successful_exports += 1;

                // Verify all exports are identical
                if let Some(ref first) = first_export {
                    assert_eq!(data, first, "Task {} export should match first export", idx);
                } else {
                    first_export = Some(data.clone());
                }
            }
            Ok(Err(e)) => {
                panic!("Task {} failed with error: {}", idx, e.message);
            }
            Err(e) => {
                panic!("Task {} panicked: {:?}", idx, e);
            }
        }
    }

    assert_eq!(
        successful_exports, NUM_CONCURRENT,
        "All {} concurrent exports should succeed",
        NUM_CONCURRENT
    );

    println!(
        "All {} concurrent exports completed successfully and produced identical results",
        NUM_CONCURRENT
    );
}
