use super::metadata::{BlockMetadataPersist, ChecksumManager};
use super::vfs_sync;
use crate::types::DatabaseError;

pub async fn hybrid_persist(
    db_name: &str,
    blocks: Vec<(u64, Vec<u8>)>,
    metadata: Vec<(u64, BlockMetadataPersist)>,
    commit_marker: u64,
    #[cfg(feature = "telemetry")] span_recorder: Option<crate::telemetry::SpanRecorder>,
    #[cfg(feature = "telemetry")] parent_span_id: Option<String>,
) -> Result<(), DatabaseError> {
    if blocks.is_empty() {
        return Ok(());
    }

    super::wasm_opfs::persist_to_opfs(db_name, blocks.clone()).await?;
    super::wasm_indexeddb::persist_to_indexeddb_event_based(
        db_name,
        blocks,
        metadata,
        commit_marker,
        #[cfg(feature = "telemetry")]
        span_recorder,
        #[cfg(feature = "telemetry")]
        parent_span_id,
    )
    .await
}

fn clear_db_state(db_name: &str) {
    vfs_sync::with_global_storage(|storage_map| {
        storage_map.borrow_mut().remove(db_name);
    });
    vfs_sync::with_global_metadata(|metadata_map| {
        metadata_map.borrow_mut().remove(db_name);
    });
    vfs_sync::with_global_allocation_map(|allocation_map| {
        allocation_map.borrow_mut().remove(db_name);
    });
    vfs_sync::with_global_commit_marker(|commit_map| {
        commit_map.borrow_mut().remove(db_name);
    });
}

fn validate_restored_blocks(
    db_name: &str,
    metadata_snapshot: &std::collections::HashMap<
        u64,
        super::wasm_indexeddb::PersistedMetadataEntry,
    >,
) -> Result<(), DatabaseError> {
    let restored_blocks = vfs_sync::with_global_storage(|storage_map| {
        storage_map
            .borrow()
            .get(db_name)
            .cloned()
            .unwrap_or_default()
    });

    let mut validated_blocks = 0usize;
    for (&block_id, entry) in metadata_snapshot {
        if !entry.authoritative_checksum {
            continue;
        }

        let data = restored_blocks.get(&block_id).ok_or_else(|| {
            DatabaseError::new(
                "HYBRID_RESTORE_MISMATCH",
                &format!("Missing restored block {} for {}", block_id, db_name),
            )
        })?;

        let actual_checksum = ChecksumManager::compute_checksum_with(data, entry.metadata.algo);
        if actual_checksum != entry.metadata.checksum {
            return Err(DatabaseError::new(
                "HYBRID_RESTORE_MISMATCH",
                &format!(
                    "Checksum mismatch for {} block {}: expected {}, got {}",
                    db_name, block_id, entry.metadata.checksum, actual_checksum
                ),
            ));
        }

        validated_blocks += 1;
    }

    if validated_blocks == 0 {
        log::info!(
            "Hybrid restore found no authoritative IndexedDB checksums for {}, skipping validation",
            db_name
        );
    } else {
        log::info!(
            "Hybrid restore validated {} OPFS blocks against IndexedDB metadata for {}",
            validated_blocks,
            db_name
        );
    }

    Ok(())
}

pub async fn hybrid_restore(db_name: &str) -> Result<(), DatabaseError> {
    let restored_blocks = super::wasm_opfs::restore_from_opfs(db_name).await?;

    if restored_blocks == 0 {
        log::info!(
            "Hybrid restore found no OPFS blocks for {}, falling back to IndexedDB",
            db_name
        );
        return super::wasm_indexeddb::restore_from_indexeddb(db_name).await;
    }

    let metadata_snapshot =
        super::wasm_indexeddb::restore_metadata_from_indexeddb(db_name, true).await?;
    if metadata_snapshot.is_empty() {
        log::info!(
            "Hybrid restore found no IndexedDB metadata for {}, accepting OPFS state",
            db_name
        );
        return Ok(());
    }

    if let Err(error) = validate_restored_blocks(db_name, &metadata_snapshot) {
        log::warn!(
            "Hybrid restore validation failed for {}: {}. Falling back to IndexedDB.",
            db_name,
            error.message
        );
        clear_db_state(db_name);
        super::wasm_indexeddb::restore_from_indexeddb_force(db_name).await?;
    }

    Ok(())
}
