//! In-memory `BlockStore` implementation.
//!
//! Used for:
//! - Integration tests (no IndexedDB needed)
//! - Native / server-side usage where persistence is not required
//! - Benchmarking pure computation without I/O

use std::collections::{BTreeMap, HashMap};
use std::sync::atomic::{AtomicU64, Ordering};

use super::error::{Result, StorageError};
use super::types::*;

/// File metadata tracked by the in-memory store.
struct FileEntry {
    blocks: BTreeMap<BlockIdx, Vec<u8>>,
    committed: bool,
    version: u64,
}

/// In-memory block store. Single-threaded (not `Send`/`Sync`).
pub struct MemBlockStore {
    files: HashMap<FileId, FileEntry>,
    manifest: HashMap<String, (FileId, u64)>,
    next_file_id: AtomicU64,
}

impl Default for MemBlockStore {
    fn default() -> Self {
        Self::new()
    }
}

impl MemBlockStore {
    pub fn new() -> Self {
        Self {
            files: HashMap::new(),
            manifest: HashMap::new(),
            next_file_id: AtomicU64::new(1),
        }
    }

    fn file(&self, file_id: FileId) -> Result<&FileEntry> {
        self.files
            .get(&file_id)
            .ok_or_else(|| StorageError::new("FILE_NOT_FOUND", format!("file_id={file_id}")))
    }

    fn file_mut(&mut self, file_id: FileId) -> Result<&mut FileEntry> {
        self.files
            .get_mut(&file_id)
            .ok_or_else(|| StorageError::new("FILE_NOT_FOUND", format!("file_id={file_id}")))
    }

    /// List all file IDs and their committed status.
    ///
    /// Used by the consistency checker to enumerate files.
    pub fn list_files(&self) -> Vec<(FileId, bool)> {
        self.files
            .iter()
            .map(|(id, entry)| (*id, entry.committed))
            .collect()
    }

    /// Completely remove a file and all its blocks.
    ///
    /// Used by the consistency checker to purge orphaned files.
    pub fn purge_file(&mut self, file_id: FileId) -> Result<()> {
        self.files
            .remove(&file_id)
            .ok_or_else(|| StorageError::new("FILE_NOT_FOUND", format!("file_id={file_id}")))?;
        Ok(())
    }

    /// Check if a file exists (regardless of committed status).
    pub fn file_exists(&self, file_id: FileId) -> bool {
        self.files.contains_key(&file_id)
    }
}

impl BlockReader for MemBlockStore {
    fn get_block(&self, file_id: FileId, block_idx: BlockIdx) -> Result<Vec<u8>> {
        let entry = self.file(file_id)?;
        entry
            .blocks
            .get(&block_idx)
            .cloned()
            .ok_or_else(|| StorageError::block_not_found(file_id, block_idx))
    }

    fn has_block(&self, file_id: FileId, block_idx: BlockIdx) -> Result<bool> {
        let entry = self.file(file_id)?;
        Ok(entry.blocks.contains_key(&block_idx))
    }

    fn block_count(&self, file_id: FileId) -> Result<u64> {
        let entry = self.file(file_id)?;
        Ok(entry.blocks.len() as u64)
    }
}

impl BlockWriter for MemBlockStore {
    fn create_file(&mut self) -> Result<FileId> {
        let id = self.next_file_id.fetch_add(1, Ordering::Relaxed);
        self.files.insert(
            id,
            FileEntry {
                blocks: BTreeMap::new(),
                committed: false,
                version: 0,
            },
        );
        Ok(id)
    }

    fn put_block(&mut self, file_id: FileId, block_idx: BlockIdx, data: &[u8]) -> Result<()> {
        let entry = self.file_mut(file_id)?;
        if entry.committed {
            return Err(StorageError::immutable_write(file_id));
        }

        // Pad or truncate to BLOCK_SIZE
        let mut block = vec![0u8; BLOCK_SIZE];
        let len = data.len().min(BLOCK_SIZE);
        block[..len].copy_from_slice(&data[..len]);

        entry.blocks.insert(block_idx, block);
        Ok(())
    }

    fn commit(&mut self, file_id: FileId) -> Result<u64> {
        let entry = self.file_mut(file_id)?;
        if entry.committed {
            return Err(StorageError::immutable_write(file_id));
        }
        entry.version += 1;
        entry.committed = true;
        Ok(entry.version)
    }
}

impl Manifest for MemBlockStore {
    fn resolve(&self, path: &str) -> Result<Option<(FileId, u64)>> {
        Ok(self.manifest.get(path).copied())
    }

    fn publish(&mut self, path: &str, file_id: FileId, version: u64) -> Result<Option<(FileId, u64)>> {
        Ok(self.manifest.insert(path.to_owned(), (file_id, version)))
    }

    fn remove(&mut self, path: &str) -> Result<Option<(FileId, u64)>> {
        Ok(self.manifest.remove(path))
    }

    fn list_paths(&self) -> Result<Vec<String>> {
        Ok(self.manifest.keys().cloned().collect())
    }
}
