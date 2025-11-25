//! Recovery operations for BlockStorage
//! This module contains startup recovery and integrity verification functionality

use crate::types::DatabaseError;
use super::block_storage::{BlockStorage, RecoveryOptions, RecoveryMode, CorruptionAction, RecoveryReport};

// Lock macro for accessing BlockStorage Mutex-wrapped fields
#[allow(unused_macros)]
#[cfg(target_arch = "wasm32")]
macro_rules! lock_mutex {
    ($mutex:expr) => {
        $mutex.try_borrow_mut()
            .expect("RefCell borrow failed - reentrancy detected in recovery.rs")
    };
}

#[allow(unused_macros)]
#[cfg(not(target_arch = "wasm32"))]
macro_rules! lock_mutex {
    ($mutex:expr) => {
        $mutex.lock()
    };
}

#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
use std::collections::HashMap;
#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
use std::io::Read;
#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
use crate::storage::{BLOCK_SIZE, ChecksumAlgorithm};

#[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
use std::{fs, io::Write};

/// Perform startup recovery verification on a BlockStorage instance
pub async fn perform_startup_recovery(storage: &mut BlockStorage, opts: RecoveryOptions) -> Result<(), DatabaseError> {
    let start_time = BlockStorage::now_millis();
    log::info!("Starting startup recovery with mode: {:?}", opts.mode);

    // Handle pending metadata commit markers (fs_persist only)
    #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
    {
        use std::io::Write;

        let mut db_dir = storage.base_dir.clone();
        db_dir.push(&storage.db_name);
        let meta_path = db_dir.join("metadata.json");
        let meta_pending_path = db_dir.join("metadata.json.pending");
        let blocks_dir = db_dir.join("blocks");

        if let Ok(pending_content) = std::fs::read_to_string(&meta_pending_path) {
            log::warn!(
                "Found pending metadata commit marker at startup: {:?}",
                meta_pending_path
            );

            let mut finalize = true;
            let mut parsed_val: Option<serde_json::Value> = None;
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&pending_content) {
                parsed_val = Some(val.clone());
                if let Some(entries) = val.get("entries").and_then(|v| v.as_array()) {
                    for entry in entries {
                        if let Some(arr) = entry.as_array() {
                            if arr.len() == 2 {
                                if let Some(block_id) = arr.get(0).and_then(|v| v.as_u64()) {
                                    let bpath = blocks_dir.join(format!("block_{}.bin", block_id));
                                    match std::fs::metadata(&bpath) {
                                        Ok(meta) => {
                                            if !meta.is_file() || meta.len() as usize != BLOCK_SIZE {
                                                log::warn!(
                                                    "Pending commit references block {} but file invalid: {:?}",
                                                    block_id, bpath
                                                );
                                                finalize = false;
                                                break;
                                            }
                                        }
                                        Err(_) => {
                                            log::warn!(
                                                "Pending commit references missing block file for id {}: {:?}",
                                                block_id, bpath
                                            );
                                            finalize = false;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                // Malformed pending file -> rollback
                log::error!("Malformed metadata.json.pending; rolling back");
                finalize = false;
            }

            if finalize {
                // Finalize: write pending content to metadata.json and remove pending
                if let Ok(mut f) = std::fs::File::create(&meta_path) {
                    let _ = f.write_all(pending_content.as_bytes());
                }
                let _ = std::fs::remove_file(&meta_pending_path);
                log::info!("Finalized pending metadata commit to {:?}", meta_path);

                // Update in-memory checksum and algo maps from finalized metadata
                if let Some(val) = parsed_val {
                    let mut checksums_new: std::collections::HashMap<u64, u64> = std::collections::HashMap::new();
                    let mut algos_new: std::collections::HashMap<u64, ChecksumAlgorithm> = std::collections::HashMap::new();
                    if let Some(entries) = val.get("entries").and_then(|v| v.as_array()) {
                        for entry in entries.iter() {
                            if let Some(arr) = entry.as_array() {
                                if arr.len() == 2 {
                                    if let (Some(bid), Some(meta)) = (
                                        arr.get(0).and_then(|v| v.as_u64()),
                                        arr.get(1).and_then(|v| v.as_object()),
                                    ) {
                                        if let Some(csum) = meta.get("checksum").and_then(|v| v.as_u64()) {
                                            checksums_new.insert(bid, csum);
                                        }
                                        let algo_str = meta.get("algo").and_then(|v| v.as_str()).unwrap_or("");
                                        let algo = match algo_str {
                                            "CRC32" => Some(ChecksumAlgorithm::CRC32),
                                            "FastHash" => Some(ChecksumAlgorithm::FastHash),
                                            _ => None,
                                        };
                                        if let Some(a) = algo { algos_new.insert(bid, a); }
                                    }
                                }
                            }
                        }
                    }
                    storage.checksum_manager.replace_all(checksums_new, algos_new);
                }
            } else {
                // Rollback: just remove the pending file, retain existing metadata.json
                let _ = std::fs::remove_file(&meta_pending_path);
                log::info!("Rolled back pending metadata commit; kept {:?}", meta_path);
            }
        }
    }

    // Extended scan/reconciliation of blocks vs metadata (fs_persist only)
    #[cfg(all(not(target_arch = "wasm32"), feature = "fs_persist"))]
    {
        use std::collections::HashSet as Set;

        let mut db_dir = storage.base_dir.clone();
        db_dir.push(&storage.db_name);
        let meta_path = db_dir.join("metadata.json");
        let meta_pending_path = db_dir.join("metadata.json.pending");
        let blocks_dir = db_dir.join("blocks");

        // Load current metadata entries (preserve fields to keep version/last_modified)
        let mut entries_val: Vec<serde_json::Value> = Vec::new();
        let mut meta_ids: Set<u64> = Set::new();
        if let Ok(mut f) = fs::File::open(&meta_path) {
            let mut s = String::new();
            if f.read_to_string(&mut s).is_ok() {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&s) {
                    if let Some(entries) = val.get("entries").and_then(|v| v.as_array()).cloned() {
                        entries_val = entries;
                        for entry in entries_val.iter() {
                            if let Some(arr) = entry.as_array() {
                                if let Some(id) = arr.get(0).and_then(|v| v.as_u64()) {
                                    meta_ids.insert(id);
                                }
                            }
                        }
                    }
                }
            }
        }

        // Collect block file IDs from disk
        let mut file_ids: Set<u64> = Set::new();
        if let Ok(entries) = fs::read_dir(&blocks_dir) {
            for entry in entries.flatten() {
                if let Ok(ft) = entry.file_type() {
                    if ft.is_file() {
                        if let Some(name) = entry.file_name().to_str() {
                            if let Some(id_str) = name.strip_prefix("block_").and_then(|s| s.strip_suffix(".bin")) {
                                if let Ok(id) = id_str.parse::<u64>() { file_ids.insert(id); }
                            }
                        }
                    }
                }
            }
        }

        // Remove stray files without metadata
        let stray: Vec<u64> = file_ids.difference(&meta_ids).copied().collect();
        if !stray.is_empty() {
            log::warn!("[fs] Found {} stray block files with no metadata: {:?}", stray.len(), stray);
            for id in &stray {
                let p = blocks_dir.join(format!("block_{}.bin", id));
                match fs::remove_file(&p) {
                    Ok(()) => log::info!("[fs] Removed stray block file {:?}", p),
                    Err(e) => log::error!("[fs] Failed to remove stray block file {:?}: {}", p, e),
                }
            }
            // Fsync blocks directory to persist deletions (best-effort on Unix)
            #[cfg(unix)]
            if let Ok(dirf) = fs::OpenOptions::new().read(true).open(&blocks_dir) {
                let _ = dirf.sync_all();
            }
        }

        // Remove metadata entries whose files are missing/invalid
        let before_len = entries_val.len();
        // Track deletions of invalid-sized files to fsync directory after
        let mut deleted_invalid_files: usize = 0;
        if before_len > 0 {
            entries_val.retain(|entry| {
                if let Some(arr) = entry.as_array() {
                    if let Some(id) = arr.get(0).and_then(|v| v.as_u64()) {
                        let p = blocks_dir.join(format!("block_{}.bin", id));
                        match fs::metadata(&p) {
                            Ok(meta) => {
                                if meta.is_file() && meta.len() as usize == BLOCK_SIZE {
                                    true
                                } else {
                                    // Invalid-sized or non-regular file: drop metadata and delete file now
                                    log::warn!(
                                        "[fs] Removing metadata for block {} due to invalid file (len={} bytes); deleting {:?}",
                                        id, meta.len(), p
                                    );
                                    match fs::remove_file(&p) {
                                        Ok(()) => {
                                            deleted_invalid_files += 1;
                                            log::info!("[fs] Deleted invalid-sized block file {:?}", p);
                                        }
                                        Err(e) => {
                                            log::error!("[fs] Failed to delete invalid-sized block file {:?}: {}", p, e);
                                        }
                                    }
                                    false
                                }
                            }
                            Err(_) => {
                                log::warn!("[fs] Removing metadata entry for block {} due to missing file {:?}", id, p);
                                false
                            }
                        }
                    } else {
                        true
                    }
                } else {
                    true
                }
            });
        }
        // If we deleted any invalid-sized files, fsync the blocks directory (best-effort on Unix)
        if deleted_invalid_files > 0 {
            #[cfg(unix)]
            if let Ok(dirf) = fs::OpenOptions::new().read(true).open(&blocks_dir) {
                let _ = dirf.sync_all();
            }
            log::info!("[fs] Deleted {} invalid-sized block file(s) during reconciliation", deleted_invalid_files);
        }
        let meta_changed = entries_val.len() != before_len;

        // If metadata changed, rewrite atomically and update in-memory maps
        let mut kept_ids: Set<u64> = Set::new();
        if meta_changed {
            for entry in entries_val.iter() {
                if let Some(arr) = entry.as_array() {
                    if let Some(id) = arr.get(0).and_then(|v| v.as_u64()) { kept_ids.insert(id); }
                }
            }
            let new_val = serde_json::json!({ "entries": entries_val });
            if let Ok(mut f) = fs::File::create(&meta_pending_path) {
                let _ = f.write_all(serde_json::to_string(&new_val).unwrap_or_else(|_| "{\"entries\":[]}".into()).as_bytes());
                let _ = f.sync_all();
            }
            let _ = fs::rename(&meta_pending_path, &meta_path);
            // Fsync metadata.json and its parent dir
            if let Ok(f) = fs::File::open(&meta_path) { let _ = f.sync_all(); }
            #[cfg(unix)]
            if let Ok(dirf) = fs::OpenOptions::new().read(true).open(&db_dir) { let _ = dirf.sync_all(); }
            log::info!("[fs] Rewrote metadata.json after reconciliation; entries={} ", kept_ids.len());

            // Update in-memory checksum and algo maps to match filtered metadata
            let mut checksums_new: HashMap<u64, u64> = HashMap::new();
            let mut algos_new: HashMap<u64, ChecksumAlgorithm> = HashMap::new();
            if let Some(entries) = new_val.get("entries").and_then(|v| v.as_array()) {
                for entry in entries.iter() {
                    if let Some(arr) = entry.as_array() {
                        if let (Some(bid), Some(meta)) = (arr.get(0).and_then(|v| v.as_u64()), arr.get(1).and_then(|v| v.as_object())) {
                            if let Some(csum) = meta.get("checksum").and_then(|v| v.as_u64()) { checksums_new.insert(bid, csum); }
                            let algo = match meta.get("algo").and_then(|v| v.as_str()) {
                                Some("CRC32") => Some(ChecksumAlgorithm::CRC32),
                                Some("FastHash") => Some(ChecksumAlgorithm::FastHash),
                                _ => None,
                            };
                            if let Some(a) = algo { algos_new.insert(bid, a); }
                        }
                    }
                }
            }
            storage.checksum_manager.replace_all(checksums_new, algos_new);
        } else {
            kept_ids = meta_ids;
        }

        // Reconcile allocations to the metadata IDs
        let needs_update = {
            let allocated = lock_mutex!(storage.allocated_blocks);
            *allocated != kept_ids
        };
        
        if needs_update {
            *lock_mutex!(storage.allocated_blocks) = kept_ids.clone();
            let max_id = lock_mutex!(storage.allocated_blocks).iter().copied().max().unwrap_or(0);
            storage.next_block_id.store(max_id + 1, std::sync::atomic::Ordering::SeqCst);

            // Persist allocations.json atomically via temp rename
            let alloc_path = db_dir.join("allocations.json");
            let alloc_tmp = db_dir.join("allocations.json.tmp");
            let mut allocated_vec: Vec<u64> = lock_mutex!(storage.allocated_blocks).iter().copied().collect();
            allocated_vec.sort_unstable();
            let alloc_json = serde_json::json!({ "allocated": allocated_vec });
            if let Ok(mut f) = fs::File::create(&alloc_tmp) {
                let _ = f.write_all(serde_json::to_string(&alloc_json).unwrap_or_else(|_| "{\"allocated\":[]}".into()).as_bytes());
                let _ = f.sync_all();
            }
            let _ = fs::rename(&alloc_tmp, &alloc_path);
            // Fsync allocations.json and directory (best-effort)
            if let Ok(f) = fs::File::open(&alloc_path) { let _ = f.sync_all(); }
            #[cfg(unix)]
            if let Ok(dirf) = fs::OpenOptions::new().read(true).open(&db_dir) { let _ = dirf.sync_all(); }
            let allocated_len = lock_mutex!(storage.allocated_blocks).len();
            log::info!("[fs] Rewrote allocations.json after reconciliation; allocated={}", allocated_len);
        }
    }

    let mut corrupted_blocks = Vec::new();
    let mut repaired_blocks = Vec::new();

    // Skip recovery if requested
    if matches!(opts.mode, RecoveryMode::Skip) {
        log::info!("Startup recovery skipped by configuration");
        storage.recovery_report = RecoveryReport {
            total_blocks_verified: 0,
            corrupted_blocks: Vec::new(),
            repaired_blocks: Vec::new(),
            verification_duration_ms: BlockStorage::now_millis() - start_time,
        };
        return Ok(());
    }

    // Get list of blocks to verify based on mode
    let blocks_to_verify = storage.get_blocks_for_verification(&opts.mode).await?;
    let total_verified = blocks_to_verify.len();

    log::info!("Verifying {} blocks during startup recovery", total_verified);

    // Verify each block
    for block_id in blocks_to_verify {
        match storage.verify_block_integrity(block_id).await {
            Ok(true) => {
                log::debug!("Block {} passed integrity check", block_id);
            }
            Ok(false) => {
                log::warn!("Block {} failed integrity check", block_id);
                corrupted_blocks.push(block_id);
                
                // Handle corruption based on policy
                match opts.on_corruption {
                    CorruptionAction::Report => {
                        log::info!("Corruption in block {} reported", block_id);
                    }
                    CorruptionAction::Repair => {
                        if storage.repair_corrupted_block(block_id).await? {
                            log::info!("Successfully repaired block {}", block_id);
                            repaired_blocks.push(block_id);
                        } else {
                            log::error!("Failed to repair block {}", block_id);
                        }
                    }
                    CorruptionAction::Fail => {
                        return Err(DatabaseError::new(
                            "STARTUP_RECOVERY_FAILED",
                            &format!("Corrupted block {} detected and failure policy is active", block_id)
                        ));
                    }
                }
            }
            Err(e) => {
                log::error!("Error verifying block {}: {}", block_id, e.message);
                if matches!(opts.on_corruption, CorruptionAction::Fail) {
                    return Err(e);
                }
            }
        }
    }

    let duration = BlockStorage::now_millis() - start_time;
    log::info!(
        "Startup recovery completed: {} blocks verified, {} corrupted, {} repaired in {}ms",
        total_verified, corrupted_blocks.len(), repaired_blocks.len(), duration
    );

    storage.recovery_report = RecoveryReport {
        total_blocks_verified: total_verified,
        corrupted_blocks,
        repaired_blocks,
        verification_duration_ms: duration,
    };

    Ok(())
}
