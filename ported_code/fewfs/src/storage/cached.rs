//! Read-through cached block store.
//!
//! `CachedBlockStore<S>` wraps any `BlockStore` with an LRU `BlockCache`.
//!
//! - **`get_block`**: check cache first → miss falls through to inner,
//!   result is cached before returning.
//! - **`put_block`**: writes through to inner AND inserts into cache so
//!   subsequent reads never miss for recently-written data.
//! - **`commit`**: delegates to inner; cached blocks are preserved (WORM
//!   data is safe to cache indefinitely after commit).
//! - **`atomic_write`**: create + put + commit + cache in one shot.
//!
//! Observable stats (`cache_hits`, `cache_misses`) allow integration
//! tests to prove caching is actually happening without mocks.

use std::cell::{Cell, RefCell};

use super::cache::{BlockCache, CacheKey};
use super::error::Result;
use super::types::{BlockIdx, BlockReader, BlockWriter, FileId, Manifest};

/// A `BlockStore` wrapper that interposes an LRU block cache between
/// the caller and the inner store.
///
/// Uses `RefCell` for the cache and `Cell` for counters so that
/// `BlockReader::get_block(&self)` can mutate the cache on a miss.
/// This is single-threaded by design (same as `MemBlockStore`).
pub struct CachedBlockStore<S> {
    inner: S,
    cache: RefCell<BlockCache>,
    hits: Cell<u64>,
    misses: Cell<u64>,
}

impl<S> CachedBlockStore<S> {
    /// Wrap `inner` with a cache holding at most `capacity` blocks.
    pub fn new(inner: S, capacity: usize) -> Self {
        Self {
            inner,
            cache: RefCell::new(BlockCache::new(capacity)),
            hits: Cell::new(0),
            misses: Cell::new(0),
        }
    }

    /// Number of cache hits since construction.
    pub fn cache_hits(&self) -> u64 {
        self.hits.get()
    }

    /// Number of cache misses since construction.
    pub fn cache_misses(&self) -> u64 {
        self.misses.get()
    }

    /// Evict all cached blocks for a given file.
    pub fn invalidate_file(&mut self, file_id: FileId) {
        self.cache.borrow_mut().invalidate_file(file_id);
    }

    /// Clear the entire cache.
    pub fn clear_cache(&mut self) {
        self.cache.borrow_mut().clear();
    }

    /// Number of blocks currently in the cache.
    pub fn cached_block_count(&self) -> usize {
        self.cache.borrow().len()
    }
}

// ── BlockReader: read-through caching ───────────────────────────────

impl<S: BlockReader> BlockReader for CachedBlockStore<S> {
    fn get_block(&self, file_id: FileId, block_idx: BlockIdx) -> Result<Vec<u8>> {
        let key = CacheKey::new(file_id, block_idx);

        // Check cache (interior mutability via RefCell)
        {
            let mut cache = self.cache.borrow_mut();
            if let Some(data) = cache.get(&key) {
                self.hits.set(self.hits.get() + 1);
                return Ok(data.clone());
            }
        }

        // Cache miss → fetch from inner store
        let data = self.inner.get_block(file_id, block_idx)?;
        self.misses.set(self.misses.get() + 1);
        self.cache.borrow_mut().insert(key, data.clone());
        Ok(data)
    }

    fn has_block(&self, file_id: FileId, block_idx: BlockIdx) -> Result<bool> {
        self.inner.has_block(file_id, block_idx)
    }

    fn block_count(&self, file_id: FileId) -> Result<u64> {
        self.inner.block_count(file_id)
    }
}

// ── BlockWriter: write-through to both inner and cache ──────────────

impl<S: BlockWriter + BlockReader> BlockWriter for CachedBlockStore<S> {
    fn create_file(&mut self) -> Result<FileId> {
        self.inner.create_file()
    }

    fn put_block(&mut self, file_id: FileId, block_idx: BlockIdx, data: &[u8]) -> Result<()> {
        self.inner.put_block(file_id, block_idx, data)?;

        // Write-through: cache the normalized (padded) block
        let key = CacheKey::new(file_id, block_idx);
        // Re-read from inner to get the padded block — inner pads to BLOCK_SIZE
        let padded = self.inner.get_block(file_id, block_idx)?;
        self.cache.borrow_mut().insert(key, padded);
        Ok(())
    }

    fn commit(&mut self, file_id: FileId) -> Result<u64> {
        // Commit to inner; cached blocks are preserved — WORM data is
        // safe to keep indefinitely.
        self.inner.commit(file_id)
    }
}

// ── Manifest: pure pass-through ─────────────────────────────────────

impl<S: Manifest> Manifest for CachedBlockStore<S> {
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
