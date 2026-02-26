//! Crash recovery: consistency checking and repair for `MemBlockStore`.
//!
//! After an unexpected crash (tab close, OOM, etc.), the store may
//! contain:
//!
//! - **Orphaned files**: created but never committed — partial writes
//!   from a crashed writer.
//! - **Dangling manifest entries**: paths pointing to file IDs that
//!   don't exist (file was purged or never fully created).
//!
//! `check_consistency()` scans the store and reports all issues.
//! `repair()` fixes them: purges orphans, removes dangling entries.

use super::mem::MemBlockStore;
use super::types::Manifest;

/// A consistency issue found in the store.
#[derive(Debug)]
pub enum ConsistencyIssue {
    /// A file that was created but never committed. Likely a partial
    /// write from a crashed writer.
    OrphanedFile(u64),
    /// A manifest entry pointing to a file ID that doesn't exist in
    /// the store.
    DanglingManifestEntry(String),
}

/// Scan the store for consistency issues without modifying anything.
///
/// Returns an empty vec if the store is consistent.
pub fn check_consistency(store: &MemBlockStore) -> Vec<ConsistencyIssue> {
    let mut issues = Vec::new();

    // 1. Find orphaned files: uncommitted files with no active writer.
    //    After a crash, any uncommitted file is an orphan — there's no
    //    writer to finish it.
    for (file_id, committed) in store.list_files() {
        if !committed {
            issues.push(ConsistencyIssue::OrphanedFile(file_id));
        }
    }

    // 2. Find dangling manifest entries: paths pointing to non-existent files.
    if let Ok(paths) = store.list_paths() {
        for path in paths {
            if let Ok(Some((file_id, _version))) = store.resolve(&path) {
                if !store.file_exists(file_id) {
                    issues.push(ConsistencyIssue::DanglingManifestEntry(path));
                }
            }
        }
    }

    issues
}

/// Repair all consistency issues in the store.
///
/// - Purges orphaned (uncommitted) files and their blocks.
/// - Removes dangling manifest entries.
///
/// Returns the number of issues repaired.
pub fn repair(store: &mut MemBlockStore) -> usize {
    let issues = check_consistency(store);
    let count = issues.len();

    for issue in issues {
        match issue {
            ConsistencyIssue::OrphanedFile(file_id) => {
                let _ = store.purge_file(file_id);
            }
            ConsistencyIssue::DanglingManifestEntry(path) => {
                let _ = store.remove(&path);
            }
        }
    }

    count
}
