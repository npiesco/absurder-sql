//! Import functionality for SQLite databases
//!
//! This module handles importing SQLite .db files into the block-based storage system.

use super::block_storage::BLOCK_SIZE;
use super::export::validate_sqlite_file;
use crate::types::DatabaseError;
use crate::utils::normalize_db_name;

/// Clear all storage data for a specific database
///
/// Removes all blocks, metadata, commit markers, and allocation maps for the specified
/// database from global storage. This is a destructive operation used primarily before
/// importing a new database.
///
/// # Arguments
/// * `db_name` - Name of the database to clear
///
/// # Returns
/// * `Ok(())` - Storage cleared successfully
/// * `Err(DatabaseError)` - If clearing fails
///
/// # Safety
/// This operation clears data from global storage but does not affect:
/// - Open database connections (they may still reference cleared data)
/// - IndexedDB persistence (for WASM, requires separate clearing)
///
/// # Example
/// ```rust,no_run
/// use absurder_sql::storage::import::clear_database_storage;
///
/// # async fn example() -> Result<(), absurder_sql::types::DatabaseError> {
/// // Clear all data for "mydb"
/// clear_database_storage("mydb").await?;
/// # Ok(())
/// # }
/// ```
pub async fn clear_database_storage(db_name: &str) -> Result<(), DatabaseError> {
    use super::vfs_sync::{
        with_global_allocation_map, with_global_commit_marker, with_global_storage,
    };

    // CRITICAL: Normalize db_name to match storage keys
    let db_name = normalize_db_name(db_name);
    let db_name = db_name.as_str();

    log::info!("Clearing storage for database: {}", db_name);

    // CRITICAL: Remove from STORAGE_REGISTRY so a fresh BlockStorage is created on next open
    // This prevents stale state (local cache, dirty_blocks) from being reused
    #[cfg(target_arch = "wasm32")]
    {
        crate::vfs::indexeddb_vfs::remove_storage_from_registry(db_name);
        log::debug!("Removed {} from STORAGE_REGISTRY", db_name);
    }

    // CRITICAL: Force close connection pool entry to reset SQLite internal state
    // Without this, SQLite may use cached pages from the old database
    #[cfg(target_arch = "wasm32")]
    {
        let pool_key = db_name.trim_end_matches(".db");
        crate::connection_pool::force_close_connection(pool_key);
        log::debug!("Force closed connection pool for {}", pool_key);
    }

    // Clear GLOBAL_STORAGE blocks
    with_global_storage(|gs| {
        let mut storage = gs.borrow_mut();
        if let Some(blocks) = storage.get_mut(db_name) {
            let count = blocks.len();
            blocks.clear();
            log::debug!(
                "Cleared {} blocks from GLOBAL_STORAGE for {}",
                count,
                db_name
            );
        }
        // Remove the database entry entirely
        storage.remove(db_name);
    });

    // Clear metadata - platform specific
    #[cfg(target_arch = "wasm32")]
    {
        use super::vfs_sync::with_global_metadata;
        with_global_metadata(|gm| {
            let mut metadata = gm.borrow_mut();
            if let Some(meta) = metadata.get_mut(db_name) {
                let count = meta.len();
                meta.clear();
                log::debug!("Cleared {} metadata entries for {} (WASM)", count, db_name);
            }
            metadata.remove(db_name);
        });
    }

    #[cfg(all(not(target_arch = "wasm32"), not(feature = "fs_persist")))]
    {
        use super::block_storage::GLOBAL_METADATA_TEST;
        GLOBAL_METADATA_TEST.with(|gm| {
            let mut metadata = gm.lock();
            if let Some(meta) = metadata.get_mut(db_name) {
                let count = meta.len();
                meta.clear();
                log::debug!(
                    "Cleared {} metadata entries from GLOBAL_METADATA_TEST for {} (native)",
                    count,
                    db_name
                );
            }
            metadata.remove(db_name);
        });
    }

    // Reset GLOBAL_COMMIT_MARKER
    with_global_commit_marker(|gcm| {
        let mut markers = gcm.borrow_mut();
        if markers.contains_key(db_name) {
            markers.insert(db_name.to_string(), 0);
            log::debug!("Reset commit marker for {}", db_name);
        }
        markers.remove(db_name);
    });

    // Clear GLOBAL_ALLOCATION_MAP
    with_global_allocation_map(|gam| {
        let mut alloc = gam.borrow_mut();
        if let Some(ids) = alloc.get_mut(db_name) {
            let count = ids.len();
            ids.clear();
            log::debug!("Cleared {} allocation IDs for {}", count, db_name);
        }
        alloc.remove(db_name);
    });

    // For WASM, also clear IndexedDB (if needed)
    #[cfg(target_arch = "wasm32")]
    {
        // Note: IndexedDB clearing would be done via JavaScript
        // The VFS layer will handle actual persistence clearing
        log::debug!(
            "WASM: In-memory storage cleared for {}. IndexedDB clearing requires VFS interaction.",
            db_name
        );
    }

    log::info!("Storage cleared successfully for: {}", db_name);
    Ok(())
}

/// Import SQLite database from bytes into BlockStorage
///
/// Takes a complete SQLite .db file and imports it into the block-based storage system.
/// This is the inverse of `export_database_to_bytes()`.
///
/// # Arguments
/// * `db_name` - Name of the database to import into
/// * `data` - Complete SQLite database file as bytes
///
/// # Returns
/// * `Ok(())` - Import successful
/// * `Err(DatabaseError)` - If validation or import fails
///
/// # Process
/// 1. Validate SQLite file format
/// 2. Clear existing storage for the database
/// 3. Split data into BLOCK_SIZE (4096-byte) chunks
/// 4. Pad last block with zeros if needed
/// 5. Write all blocks to GLOBAL_STORAGE
/// 6. Update allocation map
///
/// # Example
/// ```rust,no_run
/// use absurder_sql::storage::import::import_database_from_bytes;
///
/// # async fn example() -> Result<(), absurder_sql::types::DatabaseError> {
/// let db_bytes = std::fs::read("mydb.db").unwrap();
/// import_database_from_bytes("mydb", db_bytes).await?;
/// # Ok(())
/// # }
/// ```
pub async fn import_database_from_bytes(db_name: &str, data: Vec<u8>) -> Result<(), DatabaseError> {
    use super::vfs_sync::{with_global_allocation_map, with_global_storage};
    use std::collections::{HashMap, HashSet};

    // CRITICAL: Normalize db_name to match storage keys
    let db_name = normalize_db_name(db_name);
    let db_name = db_name.as_str();

    log::info!(
        "Starting database import for: {} ({} bytes)",
        db_name,
        data.len()
    );

    // Step 1: Validate SQLite file format
    validate_sqlite_file(&data)?;
    log::debug!("SQLite file validation passed");

    // Step 2: Clear existing storage from memory (this also does registry and connection pool cleanup)
    clear_database_storage(db_name).await?;
    log::debug!("Existing storage cleared from memory");

    // Step 3: Delete ALL old blocks from IndexedDB (without needing to know block IDs)
    // This is critical because close() clears GLOBAL_ALLOCATION_MAP, so we can't rely on it
    // to know which blocks exist. Instead, scan IndexedDB directly.
    #[cfg(target_arch = "wasm32")]
    {
        log::debug!(
            "Deleting all existing blocks from IndexedDB for: {}",
            db_name
        );
        super::wasm_indexeddb::delete_all_database_blocks_from_indexeddb(db_name).await?;
        log::debug!("All old blocks deleted from IndexedDB");
    }

    // Step 4: Split data into BLOCK_SIZE chunks
    let total_blocks = data.len().div_ceil(BLOCK_SIZE);
    log::debug!(
        "Splitting {} bytes into {} blocks of {} bytes",
        data.len(),
        total_blocks,
        BLOCK_SIZE
    );

    let mut blocks = HashMap::new();
    let mut allocated_ids = HashSet::new();

    for block_id in 0..total_blocks {
        let start = block_id * BLOCK_SIZE;
        let end = std::cmp::min(start + BLOCK_SIZE, data.len());

        let mut block_data = Vec::with_capacity(BLOCK_SIZE);
        block_data.extend_from_slice(&data[start..end]);

        // Step 4: Pad last block with zeros if needed
        if block_data.len() < BLOCK_SIZE {
            let padding = BLOCK_SIZE - block_data.len();
            block_data.resize(BLOCK_SIZE, 0);
            log::debug!(
                "Block {} padded with {} zero bytes ({} -> {} bytes)",
                block_id,
                padding,
                end - start,
                BLOCK_SIZE
            );
        }

        blocks.insert(block_id as u64, block_data);
        allocated_ids.insert(block_id as u64);
    }

    log::debug!("Created {} blocks for import", blocks.len());

    // Step 5: Write blocks to GLOBAL_STORAGE
    with_global_storage(|gs| {
        gs.borrow_mut().insert(db_name.to_string(), blocks.clone());
    });

    log::debug!("Blocks written to GLOBAL_STORAGE");

    // Step 6: Update allocation map
    with_global_allocation_map(|gam| {
        gam.borrow_mut()
            .insert(db_name.to_string(), allocated_ids.clone());
    });

    log::debug!("Allocation map updated");

    // Step 7: Set up metadata for imported blocks (for visibility tracking)
    // This ensures imported blocks are immediately visible when read

    // For WASM, set up metadata in global storage
    #[cfg(target_arch = "wasm32")]
    {
        use super::metadata::{BlockMetadataPersist, ChecksumAlgorithm, ChecksumManager};
        use super::vfs_sync::with_global_metadata;

        with_global_metadata(|gm| {
            let mut db_metadata = std::collections::HashMap::new();

            for block_id in allocated_ids.iter() {
                // Calculate checksum for each block using CRC32 (standard algorithm)
                let checksum = if let Some(block_data) = blocks.get(block_id) {
                    ChecksumManager::compute_checksum_with(block_data, ChecksumAlgorithm::CRC32)
                } else {
                    0
                };

                db_metadata.insert(
                    *block_id,
                    BlockMetadataPersist {
                        version: 1, // All imported blocks start at version 1
                        checksum,
                        last_modified_ms: 0,
                        algo: ChecksumAlgorithm::CRC32,
                    },
                );
            }

            gm.borrow_mut().insert(db_name.to_string(), db_metadata);
        });

        log::debug!(
            "Metadata created for {} blocks in global storage (WASM)",
            allocated_ids.len()
        );
    }

    // For native non-fs_persist builds, use GLOBAL_METADATA_TEST directly
    #[cfg(all(not(target_arch = "wasm32"), not(feature = "fs_persist")))]
    {
        use super::block_storage::GLOBAL_METADATA_TEST;
        use super::metadata::{BlockMetadataPersist, ChecksumAlgorithm, ChecksumManager};

        GLOBAL_METADATA_TEST.with(|gm| {
            let mut metadata = gm.lock();
            let mut db_metadata = std::collections::HashMap::new();

            for block_id in allocated_ids.iter() {
                // Calculate checksum for each block using CRC32 (standard algorithm)
                let checksum = if let Some(block_data) = blocks.get(block_id) {
                    ChecksumManager::compute_checksum_with(block_data, ChecksumAlgorithm::CRC32)
                } else {
                    0
                };

                db_metadata.insert(
                    *block_id,
                    BlockMetadataPersist {
                        version: 1, // All imported blocks start at version 1
                        checksum,
                        last_modified_ms: 0,
                        algo: ChecksumAlgorithm::CRC32,
                    },
                );
            }

            metadata.insert(db_name.to_string(), db_metadata);
        });

        log::debug!(
            "Metadata created for {} blocks in GLOBAL_METADATA_TEST (native test)",
            allocated_ids.len()
        );
    }

    // For fs_persist (including tests), write metadata to filesystem
    #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
    {
        use super::metadata::{ChecksumAlgorithm, ChecksumManager};
        use std::path::PathBuf;

        let base_path =
            std::env::var("ABSURDERSQL_FS_BASE").unwrap_or_else(|_| "./test_storage".to_string());
        let mut meta_path = PathBuf::from(&base_path);
        meta_path.push(db_name);

        // Create directory if needed
        if let Err(e) = std::fs::create_dir_all(&meta_path) {
            log::warn!("Failed to create metadata directory during import: {}", e);
        }

        meta_path.push("metadata.json");

        // Build metadata structure
        let mut meta_entries = Vec::new();
        for block_id in allocated_ids.iter() {
            let checksum = if let Some(block_data) = blocks.get(block_id) {
                ChecksumManager::compute_checksum_with(block_data, ChecksumAlgorithm::CRC32)
            } else {
                0
            };

            meta_entries.push((
                *block_id,
                super::metadata::BlockMetadataPersist {
                    version: 1,
                    checksum,
                    last_modified_ms: 0,
                    algo: ChecksumAlgorithm::CRC32,
                },
            ));
        }

        let meta_json = serde_json::json!({
            "entries": meta_entries,
        });

        if let Err(e) = std::fs::write(
            &meta_path,
            serde_json::to_string_pretty(&meta_json).unwrap(),
        ) {
            log::warn!("Failed to write metadata during import: {}", e);
        } else {
            log::debug!(
                "Metadata written to filesystem for {} blocks",
                allocated_ids.len()
            );
        }

        // Write block data files to filesystem
        let mut blocks_dir = PathBuf::from(&base_path);
        blocks_dir.push(db_name);
        blocks_dir.push("blocks");

        if let Err(e) = std::fs::create_dir_all(&blocks_dir) {
            log::warn!("Failed to create blocks directory during import: {}", e);
        }

        for (block_id, block_data) in blocks.iter() {
            let mut block_path = blocks_dir.clone();
            block_path.push(format!("block_{}.bin", block_id));

            if let Err(e) = std::fs::write(&block_path, block_data) {
                log::warn!("Failed to write block {} during import: {}", block_id, e);
            }
        }

        log::debug!("Wrote {} block files to filesystem", blocks.len());

        // Write allocations.json
        let mut alloc_path = PathBuf::from(&base_path);
        alloc_path.push(db_name);
        alloc_path.push("allocations.json");

        let alloc_json = serde_json::json!({
            "allocated": allocated_ids.iter().copied().collect::<Vec<_>>(),
        });

        if let Err(e) = std::fs::write(
            &alloc_path,
            serde_json::to_string_pretty(&alloc_json).unwrap(),
        ) {
            log::warn!("Failed to write allocations during import: {}", e);
        } else {
            log::debug!("Allocations written to filesystem");
        }
    }

    // Step 8: Set commit marker to 1 to make all imported blocks visible
    use super::vfs_sync::with_global_commit_marker;
    with_global_commit_marker(|gcm| {
        gcm.borrow_mut().insert(db_name.to_string(), 1);
    });

    log::debug!("Commit marker set to 1 for immediate visibility");

    // Step 10: For WASM, sync imported data to IndexedDB immediately and WAIT for it
    #[cfg(target_arch = "wasm32")]
    {
        log::debug!("Syncing imported data to IndexedDB for {}", db_name);

        // Advance commit marker
        let next_commit = with_global_commit_marker(|cm| {
            let current = cm.borrow().get(db_name).copied().unwrap_or(0);
            let new_marker = current + 1;
            cm.borrow_mut().insert(db_name.to_string(), new_marker);
            new_marker
        });

        // Collect blocks and metadata to persist
        let (blocks_to_persist, metadata_to_persist) = {
            use super::vfs_sync::with_global_metadata;
            with_global_storage(|storage| {
                let blocks = if let Some(db_storage) = storage.borrow().get(db_name) {
                    db_storage
                        .iter()
                        .map(|(&id, data)| (id, data.clone()))
                        .collect::<Vec<_>>()
                } else {
                    Vec::new()
                };

                let metadata = with_global_metadata(|meta| {
                    if let Some(db_meta) = meta.borrow().get(db_name) {
                        db_meta
                            .iter()
                            .map(|(&id, metadata)| (id, metadata.checksum))
                            .collect::<Vec<_>>()
                    } else {
                        Vec::new()
                    }
                });

                (blocks, metadata)
            })
        };

        if !blocks_to_persist.is_empty() {
            log::debug!(
                "Persisting {} blocks to IndexedDB with commit marker {}",
                blocks_to_persist.len(),
                next_commit
            );

            // CRITICAL: AWAIT the persistence to complete BEFORE returning
            super::wasm_indexeddb::persist_to_indexeddb_event_based(
                db_name,
                blocks_to_persist,
                metadata_to_persist,
                next_commit,
                #[cfg(feature = "telemetry")]
                None,
                #[cfg(feature = "telemetry")]
                None,
            )
            .await
            .map_err(|e| {
                log::error!("Failed to persist imported data to IndexedDB: {}", e);
                DatabaseError::new(
                    "IMPORT_SYNC_FAILED",
                    &format!("Failed to persist imported data: {}", e),
                )
            })?;

            log::debug!("Import sync to IndexedDB complete for {}", db_name);
        } else {
            log::warn!("No blocks to persist to IndexedDB for {}", db_name);
        }
    }

    log::info!(
        "Database import complete: {} ({} blocks, {} bytes)",
        db_name,
        total_blocks,
        data.len()
    );

    // DEBUG: Log what blocks were actually imported
    #[cfg(target_arch = "wasm32")]
    {
        use super::vfs_sync::with_global_storage;
        with_global_storage(|storage_map| {
            if let Some(db_storage) = storage_map.borrow().get(db_name) {
                web_sys::console::log_1(
                    &format!(
                        "[IMPORT] GLOBAL_STORAGE now has {} blocks for {}",
                        db_storage.len(),
                        db_name
                    )
                    .into(),
                );
                for (block_id, data) in db_storage.iter().take(5) {
                    web_sys::console::log_1(
                        &format!(
                            "[IMPORT] Block {} has {} bytes, first 16: {:02x?}",
                            block_id,
                            data.len(),
                            &data[..16.min(data.len())]
                        )
                        .into(),
                    );
                }
            }
        });
    }

    Ok(())
}

/// Invalidate BlockStorage caches for a specific database
///
/// This function removes the BlockStorage from the registry, forcing a fresh
/// instance to be created on next open. This ensures no stale cached data
/// is read after an import operation.
///
/// # Arguments
/// * `db_name` - Name of the database whose caches should be invalidated
///
/// # Example
/// ```rust
/// use absurder_sql::storage::import::invalidate_block_storage_caches;
///
/// // After importing a database, clear caches
/// invalidate_block_storage_caches("mydb");
/// ```
pub fn invalidate_block_storage_caches(db_name: &str) {
    #[cfg(target_arch = "wasm32")]
    {
        crate::vfs::indexeddb_vfs::remove_storage_from_registry(db_name);
        log::info!("Removed BlockStorage from registry for: {}", db_name);
    }

    #[cfg(not(target_arch = "wasm32"))]
    {
        log::info!(
            "Cache invalidation for native not yet implemented for: {}",
            db_name
        );
    }
}
