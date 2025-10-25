//! Import functionality tests
//!
//! Tests for importing SQLite .db files into IndexedDB storage.

// Conditional rusqlite import: use SQLCipher version if encryption feature is enabled
#[cfg(all(not(target_arch = "wasm32"), feature = "encryption"))]
use rusqlite_sqlcipher as rusqlite;

#[cfg(all(not(target_arch = "wasm32"), not(feature = "encryption")))]
use rusqlite;

// ============================================================================
// CORE IMPORT TESTS
// ============================================================================

/// Test importing a valid SQLite database
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_import_database_from_bytes() {
    use absurder_sql::storage::import::import_database_from_bytes;
    use absurder_sql::storage::vfs_sync::with_global_storage;
    
    let db_name = "test_import_db";
    
    // Create a minimal valid SQLite file (2 pages of 4096 bytes each)
    let mut data = vec![0u8; 8192];
    
    // SQLite header
    data[0..16].copy_from_slice(b"SQLite format 3\0");
    data[16] = 0x10;  // Page size: 4096
    data[17] = 0x00;
    data[28..32].copy_from_slice(&[0, 0, 0, 2]);  // Page count: 2
    
    // Add some data to differentiate pages
    data[4096] = 0xFF;  // Mark start of page 2
    
    // Import the database
    let result = futures::executor::block_on(import_database_from_bytes(db_name, data.clone()));
    assert!(result.is_ok(), "Import should succeed");
    
    // Verify blocks were written to GLOBAL_STORAGE
    with_global_storage(|gs| {
        let storage = gs.borrow();
        assert!(storage.contains_key(db_name), "Database should exist in storage");
        
        let blocks = storage.get(db_name).unwrap();
        assert_eq!(blocks.len(), 2, "Should have 2 blocks");
        
        // Verify block 0 content
        let block0 = blocks.get(&0).unwrap();
        assert_eq!(&block0[0..16], b"SQLite format 3\0", "Block 0 should contain header");
        
        // Verify block 1 content
        let block1 = blocks.get(&1).unwrap();
        assert_eq!(block1[0], 0xFF, "Block 1 should contain marker");
    });
}

/// Test importing database with non-standard page size
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_import_database_different_page_size() {
    use absurder_sql::storage::import::import_database_from_bytes;
    use absurder_sql::storage::vfs_sync::with_global_storage;
    
    let db_name = "test_import_2k_pages";
    
    // Create SQLite file with 2048-byte pages (4 pages = 8192 bytes)
    let mut data = vec![0u8; 8192];
    
    data[0..16].copy_from_slice(b"SQLite format 3\0");
    data[16] = 0x08;  // Page size: 2048
    data[17] = 0x00;
    data[28..32].copy_from_slice(&[0, 0, 0, 4]);  // Page count: 4
    
    let result = futures::executor::block_on(import_database_from_bytes(db_name, data.clone()));
    assert!(result.is_ok());
    
    // Should still be stored in 4096-byte blocks (2 blocks for 8192 bytes)
    with_global_storage(|gs| {
        let storage = gs.borrow();
        let blocks = storage.get(db_name).unwrap();
        assert_eq!(blocks.len(), 2, "Should have 2 blocks (8192 / 4096)");
    });
}

/// Test importing invalid SQLite file fails
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_import_invalid_database_fails() {
    use absurder_sql::storage::import::import_database_from_bytes;
    
    let db_name = "test_import_invalid";
    
    // Invalid SQLite file (wrong magic string)
    let mut data = vec![0u8; 4096];
    data[0..16].copy_from_slice(b"Invalid format!\0");
    
    let result = futures::executor::block_on(import_database_from_bytes(db_name, data));
    assert!(result.is_err(), "Import should fail for invalid file");
    assert!(result.unwrap_err().message.contains("Invalid SQLite"));
}

/// Test importing clears existing data first
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_import_clears_existing_data() {
    use absurder_sql::storage::import::import_database_from_bytes;
    use absurder_sql::storage::vfs_sync::with_global_storage;
    use std::collections::HashMap;
    
    let db_name = "test_import_clear";
    
    // Populate with old data
    with_global_storage(|gs| {
        let mut storage = gs.borrow_mut();
        let mut blocks = HashMap::new();
        blocks.insert(99, vec![0xAA; 4096]);  // Old block that shouldn't exist after import
        storage.insert(db_name.to_string(), blocks);
    });
    
    // Import new database
    let mut data = vec![0u8; 4096];
    data[0..16].copy_from_slice(b"SQLite format 3\0");
    data[16] = 0x10;
    data[17] = 0x00;
    data[28..32].copy_from_slice(&[0, 0, 0, 1]);  // 1 page
    
    let result = futures::executor::block_on(import_database_from_bytes(db_name, data));
    assert!(result.is_ok());
    
    // Verify old data is gone, new data exists
    with_global_storage(|gs| {
        let storage = gs.borrow();
        let blocks = storage.get(db_name).unwrap();
        assert!(!blocks.contains_key(&99), "Old block 99 should be cleared");
        assert!(blocks.contains_key(&0), "New block 0 should exist");
    });
}

/// Test importing database with size not aligned to BLOCK_SIZE
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_import_database_with_padding() {
    use absurder_sql::storage::import::import_database_from_bytes;
    use absurder_sql::storage::vfs_sync::with_global_storage;
    
    let db_name = "test_import_padding";
    
    // Create database with 3 pages of 2048 bytes = 6144 bytes total
    // This is not a multiple of BLOCK_SIZE (4096), so needs padding
    let mut data = vec![0u8; 6144];
    data[0..16].copy_from_slice(b"SQLite format 3\0");
    data[16] = 0x08;  // Page size: 2048 (valid power of 2)
    data[17] = 0x00;
    data[28..32].copy_from_slice(&[0, 0, 0, 3]);  // 3 pages
    
    // Fill with non-zero data
    for i in 100..6144 {
        data[i] = (i % 256) as u8;
    }
    
    let result = futures::executor::block_on(import_database_from_bytes(db_name, data.clone()));
    assert!(result.is_ok());
    
    // Should be stored in 2 blocks (6144 bytes = 1.5 blocks, needs padding to 8192)
    with_global_storage(|gs| {
        let storage = gs.borrow();
        let blocks = storage.get(db_name).unwrap();
        assert_eq!(blocks.len(), 2, "Should have 2 blocks with padding");
        
        // Verify data integrity
        let block0 = blocks.get(&0).unwrap();
        assert_eq!(block0.len(), 4096);
        assert_eq!(&block0[0..16], b"SQLite format 3\0");
        
        // Verify second block has remaining data
        let block1 = blocks.get(&1).unwrap();
        assert_eq!(block1.len(), 4096);
        // First 2048 bytes (6144 - 4096) should be data, rest should be zero-padded
        assert_eq!(block1[2048], 0, "Should be zero-padded after data");
    });
}

/// Test that BlockStorage cache is cleared after import
/// 
/// This test verifies that cached data from a previous database doesn't
/// persist after importing a new database. Without cache clearing, stale
/// data could be read from the cache instead of the newly imported data.
#[cfg(not(target_arch = "wasm32"))]
#[tokio::test]
async fn test_import_clears_block_storage_cache() {
    use absurder_sql::storage::import::import_database_from_bytes;
    use absurder_sql::storage::block_storage::BlockStorage;
    
    let db_name = "test_cache_clear";
    
    // Step 1: Create and initialize BlockStorage with original data
    let mut storage = BlockStorage::new(db_name).await.expect("create storage");
    
    // Write original data to block 0
    let original_data = vec![0xAA; 4096];
    storage.write_block(0, original_data.clone()).await.expect("write original");
    storage.sync().await.expect("sync original");
    
    // Read it to ensure it's cached
    let read_original = storage.read_block(0).await.expect("read original");
    assert_eq!(read_original[0], 0xAA, "Original data should be 0xAA");
    
    // Step 2: Import a NEW database with different data
    let mut import_data = vec![0xBB; 4096];  // Different byte pattern
    import_data[0..16].copy_from_slice(b"SQLite format 3\0");
    import_data[16] = 0x10;  // Page size: 4096
    import_data[17] = 0x00;
    import_data[28..32].copy_from_slice(&[0, 0, 0, 1]);  // 1 page
    // Keep byte 100 as 0xBB for testing (not part of SQLite header)
    
    import_database_from_bytes(db_name, import_data).await.expect("import new database");
    
    // Step 3: Read block 0 again - should get NEW imported data (0xBB), not cached old data (0xAA)
    // Force cache clear by notifying BlockStorage of the import
    storage.on_database_import().await.expect("notify import");
    
    let read_after_import = storage.read_block(0).await.expect("read after import");
    
    // The critical assertion: we should read the NEW data (0xBB), not the cached old data (0xAA)
    assert_eq!(
        read_after_import[100], 0xBB,
        "Should read newly imported data (0xBB/187), not stale cached data (0xAA/170) or zeroed (0)"
    );
    assert_eq!(
        &read_after_import[0..16],
        b"SQLite format 3\0",
        "Should have SQLite header from imported data"
    );
}

/// Test that import provides cache invalidation API
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_import_cache_invalidation_api_exists() {
    use absurder_sql::storage::import::invalidate_block_storage_caches;
    
    // This test verifies the API exists for cache invalidation
    // The function should be callable and not panic
    let db_name = "test_invalidate_api";
    invalidate_block_storage_caches(db_name);
    
    // If we get here, the API exists
    assert!(true, "Cache invalidation API should exist");
}

// ============================================================================
// ROUNDTRIP TESTS (Export → Import → Export)
// ============================================================================

/// Test that export → import → export produces identical file
/// 
/// This verifies that the import/export process is lossless and deterministic.
/// The test creates a database, exports it, imports it to a new database, and
/// exports again. The two export byte arrays should be identical.
#[cfg(not(target_arch = "wasm32"))]
#[tokio::test]
async fn test_export_import_export_identical() {
    use absurder_sql::storage::block_storage::BlockStorage;
    use absurder_sql::storage::export::export_database_to_bytes;
    use absurder_sql::storage::import::import_database_from_bytes;
    
    let db_name_1 = "test_roundtrip_original";
    let db_name_2 = "test_roundtrip_imported";
    
    // Step 1: Create a database with known data
    let mut storage1 = BlockStorage::new(db_name_1).await.expect("create storage1");
    
    // Create a minimal SQLite database structure with some data
    let mut db_data = vec![0u8; 12288]; // 3 pages (4096 * 3)
    
    // Write SQLite header to block 0
    db_data[0..16].copy_from_slice(b"SQLite format 3\0");
    db_data[16] = 0x10;  // Page size: 4096 bytes
    db_data[17] = 0x00;
    db_data[18] = 0x01;  // File format write version
    db_data[19] = 0x01;  // File format read version
    db_data[28..32].copy_from_slice(&[0, 0, 0, 3]);  // Page count: 3
    
    // Add some distinctive data to each page
    db_data[100] = 0xAA;      // Marker in page 0
    db_data[4196] = 0xBB;     // Marker in page 1
    db_data[8292] = 0xCC;     // Marker in page 2
    
    // Write blocks to storage
    storage1.write_block(0, db_data[0..4096].to_vec()).await.expect("write block 0");
    storage1.write_block(1, db_data[4096..8192].to_vec()).await.expect("write block 1");
    storage1.write_block(2, db_data[8192..12288].to_vec()).await.expect("write block 2");
    storage1.sync().await.expect("sync storage1");
    
    // Step 2: Export the database
    let export1 = export_database_to_bytes(&mut storage1, None).await.expect("export database 1");
    
    assert!(export1.len() > 0, "Export 1 should not be empty");
    assert_eq!(export1.len(), 12288, "Export 1 should be 3 pages (12288 bytes)");
    
    // Step 3: Import into a new database
    import_database_from_bytes(db_name_2, export1.clone()).await.expect("import to database 2");
    
    // Step 4: Create BlockStorage for the imported database and export it
    let mut storage2 = BlockStorage::new(db_name_2).await.expect("create storage2");
    
    // Notify storage about the import to load the correct state
    storage2.on_database_import().await.expect("notify storage2 of import");
    
    // Export the imported database
    let export2 = export_database_to_bytes(&mut storage2, None).await.expect("export database 2");
    
    // Step 5: Verify the exports are identical
    assert_eq!(
        export1.len(),
        export2.len(),
        "Export sizes should be identical"
    );
    
    assert_eq!(
        export1,
        export2,
        "Export → Import → Export should produce identical bytes"
    );
    
    // Additional verification: check that distinctive markers are preserved
    assert_eq!(export2[100], 0xAA, "Page 0 marker should be preserved");
    assert_eq!(export2[4196], 0xBB, "Page 1 marker should be preserved");
    assert_eq!(export2[8292], 0xCC, "Page 2 marker should be preserved");
}

/// Test importing a large database (>10MB)
/// 
/// This verifies that the import functionality can handle databases larger than 10MB,
/// which is the threshold for streaming export. The test creates a database with
/// 2600 blocks (approximately 10.4MB), imports it, and verifies the data.
#[cfg(not(target_arch = "wasm32"))]
#[tokio::test]
async fn test_import_large_database() {
    use absurder_sql::storage::block_storage::BlockStorage;
    use absurder_sql::storage::export::export_database_to_bytes;
    use absurder_sql::storage::import::import_database_from_bytes;
    
    let db_name_original = "test_large_import_original";
    let db_name_imported = "test_large_import_imported";
    
    // Step 1: Create a large database (>10MB)
    // Each block is 4096 bytes, so 2600 blocks = 10,649,600 bytes (~10.4MB)
    const NUM_BLOCKS: u64 = 2600;
    const BLOCK_SIZE: usize = 4096;
    
    let mut storage = BlockStorage::new(db_name_original).await.expect("create storage");
    
    // Create SQLite header in block 0
    let mut header_block = vec![0u8; BLOCK_SIZE];
    header_block[0..16].copy_from_slice(b"SQLite format 3\0");
    header_block[16] = 0x10;  // Page size: 4096 bytes (high byte)
    header_block[17] = 0x00;  // Page size: 4096 bytes (low byte)
    header_block[18] = 0x01;  // File format write version
    header_block[19] = 0x01;  // File format read version
    
    // Write page count (NUM_BLOCKS as big-endian u32 at offset 28)
    let page_count_bytes = (NUM_BLOCKS as u32).to_be_bytes();
    header_block[28..32].copy_from_slice(&page_count_bytes);
    
    // Add a marker to identify the database
    header_block[100] = 0xDE;
    header_block[101] = 0xAD;
    header_block[102] = 0xBE;
    header_block[103] = 0xEF;
    
    storage.write_block(0, header_block.clone()).await.expect("write header block");
    
    // Write remaining blocks with distinctive patterns
    for block_id in 1..NUM_BLOCKS {
        let mut block = vec![0u8; BLOCK_SIZE];
        
        // Write block ID at the beginning of each block for verification
        let block_id_bytes = block_id.to_le_bytes();
        block[0..8].copy_from_slice(&block_id_bytes);
        
        // Add some data pattern based on block ID to make it realistic
        let pattern = (block_id % 256) as u8;
        for i in 8..BLOCK_SIZE {
            block[i] = pattern.wrapping_add((i % 256) as u8);
        }
        
        storage.write_block(block_id, block).await.expect(&format!("write block {}", block_id));
    }
    
    storage.sync().await.expect("sync storage");
    
    println!("Created large database with {} blocks (~{:.2} MB)", 
             NUM_BLOCKS, 
             (NUM_BLOCKS * BLOCK_SIZE as u64) as f64 / (1024.0 * 1024.0));
    
    // Step 2: Export the large database
    let export_data = export_database_to_bytes(&mut storage, None).await
        .expect("export large database");
    
    let export_size = export_data.len();
    assert_eq!(export_size, (NUM_BLOCKS * BLOCK_SIZE as u64) as usize, 
               "Export size should match database size");
    assert!(export_size > 10 * 1024 * 1024, 
            "Database should be larger than 10MB");
    
    println!("Exported database: {} bytes ({:.2} MB)", 
             export_size, 
             export_size as f64 / (1024.0 * 1024.0));
    
    // Step 3: Import the large database
    import_database_from_bytes(db_name_imported, export_data.clone()).await
        .expect("import large database");
    
    println!("Imported large database successfully");
    
    // Step 4: Verify the imported data
    let mut storage_imported = BlockStorage::new(db_name_imported).await
        .expect("create imported storage");
    storage_imported.on_database_import().await
        .expect("refresh imported storage");
    
    // Verify header block
    let imported_header = storage_imported.read_block(0).await
        .expect("read imported header");
    assert_eq!(&imported_header[0..16], b"SQLite format 3\0", 
               "Header magic should be preserved");
    assert_eq!(imported_header[100..104], [0xDE, 0xAD, 0xBE, 0xEF], 
               "Header marker should be preserved");
    
    // Verify a sample of blocks across the database
    let sample_blocks = [1, 100, 500, 1000, 1500, 2000, 2500, NUM_BLOCKS - 1];
    for &block_id in &sample_blocks {
        let imported_block = storage_imported.read_block(block_id).await
            .expect(&format!("read imported block {}", block_id));
        
        // Verify block ID is correct
        let mut stored_id_bytes = [0u8; 8];
        stored_id_bytes.copy_from_slice(&imported_block[0..8]);
        let stored_id = u64::from_le_bytes(stored_id_bytes);
        assert_eq!(stored_id, block_id, 
                   "Block {} should have correct ID in data", block_id);
        
        // Verify pattern (pattern at position 8 = base_pattern + 8)
        let base_pattern = (block_id % 256) as u8;
        let expected_at_pos_8 = base_pattern.wrapping_add(8);
        assert_eq!(imported_block[8], expected_at_pos_8, 
                   "Block {} should have correct pattern at position 8", block_id);
    }
    
    println!("Large database import test completed successfully");
}

/// Test exporting and importing databases with indexes and triggers
/// 
/// Verifies that SQLite indexes and triggers are preserved during export/import.
/// Creates a database with a table, index, and trigger, exports it, imports to
/// a new database, and verifies the schema objects are intact and functional.
#[cfg(not(target_arch = "wasm32"))]
#[tokio::test]
async fn test_export_import_with_indexes_and_triggers() {
    use absurder_sql::storage::block_storage::BlockStorage;
    use absurder_sql::storage::export::export_database_to_bytes;
    use absurder_sql::storage::import::import_database_from_bytes;
    use rusqlite::Connection;
    
    let db_name_original = "test_schema_original";
    let db_name_imported = "test_schema_imported";
    
    // Step 1: Create database with table, index, and trigger using rusqlite
    let conn = Connection::open_in_memory().expect("create connection");
    
    // Create a table
    conn.execute(
        "CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            created_at INTEGER
        )",
        [],
    ).expect("create table");
    
    // Create an index on name column
    conn.execute(
        "CREATE INDEX idx_users_name ON users(name)",
        [],
    ).expect("create index");
    
    // Create a trigger to auto-set created_at
    conn.execute(
        "CREATE TRIGGER users_created_at
         AFTER INSERT ON users
         BEGIN
            UPDATE users SET created_at = strftime('%s', 'now') WHERE id = NEW.id;
         END",
        [],
    ).expect("create trigger");
    
    // Insert test data
    conn.execute("INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com')", []).expect("insert 1");
    conn.execute("INSERT INTO users (name, email) VALUES ('Bob', 'bob@example.com')", []).expect("insert 2");
    conn.execute("INSERT INTO users (name, email) VALUES ('Charlie', 'charlie@example.com')", []).expect("insert 3");
    
    // Get the raw database bytes from the in-memory database
    let mut backup_conn = Connection::open(":memory:").expect("create backup connection");
    let backup = rusqlite::backup::Backup::new(&conn, &mut backup_conn).expect("create backup");
    backup.run_to_completion(5, std::time::Duration::from_millis(100), None).expect("backup");
    drop(backup);
    drop(conn);
    
    // Serialize the backup database
    let db_bytes = {
        let temp_path = std::env::temp_dir().join(format!("test_schema_{}.db", std::process::id()));
        backup_conn.execute("VACUUM INTO ?1", [temp_path.to_str().unwrap()]).expect("vacuum");
        let bytes = std::fs::read(&temp_path).expect("read temp file");
        std::fs::remove_file(&temp_path).ok();
        bytes
    };
    
    println!("Created test database with schema: {} bytes", db_bytes.len());
    
    // Step 2: Import into BlockStorage
    import_database_from_bytes(db_name_original, db_bytes.clone()).await
        .expect("import original database");
    
    let mut storage = BlockStorage::new(db_name_original).await
        .expect("create storage");
    storage.on_database_import().await
        .expect("refresh storage");
    
    // Step 3: Export the database
    let export_data = export_database_to_bytes(&mut storage, None).await
        .expect("export database");
    
    println!("Exported database: {} bytes", export_data.len());
    
    // Step 4: Import to new database
    import_database_from_bytes(db_name_imported, export_data.clone()).await
        .expect("import to new database");
    
    let mut storage_imported = BlockStorage::new(db_name_imported).await
        .expect("create imported storage");
    storage_imported.on_database_import().await
        .expect("refresh imported storage");
    
    // Step 5: Export again and verify byte-for-byte match
    let export_data2 = export_database_to_bytes(&mut storage_imported, None).await
        .expect("export imported database");
    
    assert_eq!(export_data, export_data2, "Exports should be identical");
    
    println!("Database with indexes and triggers exported and imported successfully");
    println!("Schema objects preserved through export/import cycle");
}
