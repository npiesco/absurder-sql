//! Write-back buffered block store.
//!
//! `BufferedBlockStore<S>` batches dirty blocks in memory and flushes
//! them to the inner store on `commit()`.
//!
//! - **`put_block`**: writes to an in-memory dirty buffer only.
//! - **`get_block`**: checks the dirty buffer first, falls through to
//!   the inner store on miss.
//! - **`commit`**: flushes all dirty blocks for the file to the inner
//!   store, then delegates `commit()` to inner.
//! - **`atomic_write`**: bypasses the buffer — creates + writes +
//!   commits directly in the inner store.
//!
//! This reduces the number of individual I/O operations (e.g., IndexedDB
//! transactions) by batching writes until commit.

use std::collections::HashMap;

use super::error::{Result, StorageError};
use super::types::{BlockIdx, BlockReader, BlockWriter, FileId, Manifest, BLOCK_SIZE};

/// Key for the dirty buffer: `(FileId, BlockIdx)`.
type DirtyKey = (FileId, BlockIdx);

/// A `BlockStore` wrapper that buffers writes in memory until `commit()`.
///
/// Dirty blocks live in a `HashMap` keyed by `(FileId, BlockIdx)`.
/// On `commit(file_id)`, all dirty blocks for that file are flushed
/// to the inner store, then the inner store's `commit()` is called.
pub struct BufferedBlockStore<S> {
    inner: S,
    dirty: HashMap<DirtyKey, Vec<u8>>,
}

impl<S> BufferedBlockStore<S> {
    /// Wrap `inner` with a write-back buffer.
    pub fn new(inner: S) -> Self {
        Self {
            inner,
            dirty: HashMap::new(),
        }
    }

    /// Number of dirty blocks currently buffered (across all files).
    pub fn pending_block_count(&self) -> usize {
        self.dirty.len()
    }
}

// ── BlockReader: buffer-first, then inner ───────────────────────────

impl<S: BlockReader> BlockReader for BufferedBlockStore<S> {
    fn get_block(&self, file_id: FileId, block_idx: BlockIdx) -> Result<Vec<u8>> {
        // Check dirty buffer first
        if let Some(data) = self.dirty.get(&(file_id, block_idx)) {
            return Ok(data.clone());
        }
        // Fall through to inner store
        self.inner.get_block(file_id, block_idx)
    }

    fn has_block(&self, file_id: FileId, block_idx: BlockIdx) -> Result<bool> {
        if self.dirty.contains_key(&(file_id, block_idx)) {
            return Ok(true);
        }
        self.inner.has_block(file_id, block_idx)
    }

    fn block_count(&self, file_id: FileId) -> Result<u64> {
        // Count unique block indices across buffer + inner.
        // Buffer blocks for this file:
        let buffered_max: Option<BlockIdx> = self
            .dirty
            .keys()
            .filter(|(fid, _)| *fid == file_id)
            .map(|(_, idx)| *idx)
            .max();

        let inner_count = match self.inner.block_count(file_id) {
            Ok(c) => c,
            Err(e) if e.code == "FILE_NOT_FOUND" && buffered_max.is_some() => 0,
            Err(e) => return Err(e),
        };

        match buffered_max {
            Some(max_idx) => Ok(std::cmp::max(inner_count, max_idx + 1)),
            None => Ok(inner_count),
        }
    }
}

// ── BlockWriter: buffer writes, flush on commit ─────────────────────

impl<S: BlockReader + BlockWriter> BlockWriter for BufferedBlockStore<S> {
    fn create_file(&mut self) -> Result<FileId> {
        self.inner.create_file()
    }

    fn put_block(&mut self, file_id: FileId, block_idx: BlockIdx, data: &[u8]) -> Result<()> {
        // Pad to BLOCK_SIZE (matching MemBlockStore's behavior)
        let mut block = vec![0u8; BLOCK_SIZE];
        let len = data.len().min(BLOCK_SIZE);
        block[..len].copy_from_slice(&data[..len]);

        self.dirty.insert((file_id, block_idx), block);
        Ok(())
    }

    fn commit(&mut self, file_id: FileId) -> Result<u64> {
        // Flush all dirty blocks for this file to the inner store
        let keys_to_flush: Vec<DirtyKey> = self
            .dirty
            .keys()
            .filter(|(fid, _)| *fid == file_id)
            .copied()
            .collect();

        for key in &keys_to_flush {
            let data = self
                .dirty
                .remove(key)
                .ok_or_else(|| StorageError::new("BUFFER_ERROR", "dirty block vanished"))?;
            self.inner.put_block(file_id, key.1, &data)?;
        }

        // Delegate commit to inner
        self.inner.commit(file_id)
    }

    fn atomic_write(&mut self, data: &[u8]) -> Result<FileId> {
        // Bypass buffer — create, write, and commit directly in inner
        self.inner.atomic_write(data)
    }
}

// ── Manifest: pure pass-through ─────────────────────────────────────

impl<S: Manifest> Manifest for BufferedBlockStore<S> {
    fn resolve(&self, path: &str) -> Result<Option<(FileId, u64)>> {
        self.inner.resolve(path)
    }

    fn publish(&mut self, path: &str, file_id: FileId, version: u64) -> Result<Option<(FileId, u64)>> {
        self.inner.publish(path, file_id, version)
    }

    fn remove(&mut self, path: &str) -> Result<Option<(FileId, u64)>> {
        self.inner.remove(path)
    }

    fn list_paths(&self) -> Result<Vec<String>> {
        self.inner.list_paths()
    }
}
