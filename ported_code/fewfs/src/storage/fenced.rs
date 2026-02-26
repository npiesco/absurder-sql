//! Fenced block store — write guard using monotonic fencing tokens.
//!
//! `FencedBlockStore<S>` wraps any `BlockStore` and validates a fencing
//! token before every mutating operation. Reads are always allowed
//! (followers can read), but writes require a valid (non-stale) fence.
//!
//! This enforces the cross-tab invariant: when a new tab claims
//! leadership and bumps the global fencing token, any tab still
//! holding the old token is prevented from mutating the store.
//!
//! Two fence values:
//! - `my_fence`: this instance's current token (set at construction,
//!   bumped on re-election).
//! - `required_fence`: the minimum token accepted for writes (bumped
//!   externally when another tab claims leadership).

use super::error::{Result, StorageError};
use super::types::{BlockIdx, BlockReader, BlockWriter, FileId, Manifest};

/// A `BlockStore` wrapper that rejects stale writers.
///
/// - Reads (`get_block`, `has_block`, `block_count`, `resolve`,
///   `list_paths`) always pass through.
/// - Writes (`create_file`, `put_block`, `commit`, `publish`,
///   `remove`) require `my_fence >= required_fence`.
pub struct FencedBlockStore<S> {
    inner: S,
    my_fence: u64,
    required_fence: u64,
}

impl<S> FencedBlockStore<S> {
    /// Wrap `inner` with fence validation. `initial_fence` is both
    /// the instance's token and the required minimum.
    pub fn new(inner: S, initial_fence: u64) -> Self {
        Self {
            inner,
            my_fence: initial_fence,
            required_fence: initial_fence,
        }
    }

    /// Update the minimum required fence (simulates another tab
    /// claiming leadership with a higher token).
    pub fn set_required_fence(&mut self, fence: u64) {
        self.required_fence = fence;
    }

    /// Bump this instance's fence (re-election).
    pub fn bump_fence(&mut self, fence: u64) {
        self.my_fence = fence;
    }

    /// Current fence token held by this instance.
    pub fn my_fence(&self) -> u64 {
        self.my_fence
    }

    /// Minimum fence required for writes.
    pub fn required_fence(&self) -> u64 {
        self.required_fence
    }

    /// Validate that this instance's fence is not stale.
    fn validate(&self) -> Result<()> {
        if self.my_fence < self.required_fence {
            return Err(StorageError::stale_writer(format!(
                "fencing token {} is stale, required >= {}",
                self.my_fence, self.required_fence
            )));
        }
        Ok(())
    }
}

// ── BlockReader: always pass-through (followers can read) ───────────

impl<S: BlockReader> BlockReader for FencedBlockStore<S> {
    fn get_block(&self, file_id: FileId, block_idx: BlockIdx) -> Result<Vec<u8>> {
        self.inner.get_block(file_id, block_idx)
    }

    fn has_block(&self, file_id: FileId, block_idx: BlockIdx) -> Result<bool> {
        self.inner.has_block(file_id, block_idx)
    }

    fn block_count(&self, file_id: FileId) -> Result<u64> {
        self.inner.block_count(file_id)
    }
}

// ── BlockWriter: fence-validated ────────────────────────────────────

impl<S: BlockWriter> BlockWriter for FencedBlockStore<S> {
    fn create_file(&mut self) -> Result<FileId> {
        self.validate()?;
        self.inner.create_file()
    }

    fn put_block(&mut self, file_id: FileId, block_idx: BlockIdx, data: &[u8]) -> Result<()> {
        self.validate()?;
        self.inner.put_block(file_id, block_idx, data)
    }

    fn commit(&mut self, file_id: FileId) -> Result<u64> {
        self.validate()?;
        self.inner.commit(file_id)
    }
}

// ── Manifest: reads pass-through, writes fence-validated ────────────

impl<S: Manifest> Manifest for FencedBlockStore<S> {
    fn resolve(&self, path: &str) -> Result<Option<(FileId, u64)>> {
        // Read — always allowed
        self.inner.resolve(path)
    }

    fn publish(&mut self, path: &str, file_id: FileId, version: u64) -> Result<Option<(FileId, u64)>> {
        self.validate()?;
        self.inner.publish(path, file_id, version)
    }

    fn remove(&mut self, path: &str) -> Result<Option<(FileId, u64)>> {
        self.validate()?;
        self.inner.remove(path)
    }

    fn list_paths(&self) -> Result<Vec<String>> {
        // Read — always allowed
        self.inner.list_paths()
    }
}
