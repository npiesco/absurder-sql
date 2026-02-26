//! Block cache — LRU with weight-based eviction.
//!
//! Ported from absurder-sql's LRU cache in block_storage.rs,
//! generalized for (FileId, BlockIdx) keys and weight = bytes.

use std::collections::{HashMap, VecDeque};

use super::types::{BlockIdx, FileId, BLOCK_SIZE};

/// Key into the block cache.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct CacheKey {
    pub file_id: FileId,
    pub block_idx: BlockIdx,
}

impl CacheKey {
    pub fn new(file_id: FileId, block_idx: BlockIdx) -> Self {
        Self { file_id, block_idx }
    }
}

/// Simple LRU block cache with byte-weight tracking.
///
/// Eviction fires when entries reach `max_entries`. Weight is counted as
/// `entry_count * BLOCK_SIZE` (all values are exactly one block).
pub struct BlockCache {
    entries: HashMap<CacheKey, Vec<u8>>,
    lru_order: VecDeque<CacheKey>,
    max_entries: usize,
}

impl BlockCache {
    /// Create a cache with `max_entries` slots.
    pub fn new(max_entries: usize) -> Self {
        Self {
            entries: HashMap::with_capacity(max_entries),
            lru_order: VecDeque::with_capacity(max_entries),
            max_entries,
        }
    }

    /// Max weight in bytes.
    pub fn max_weight(&self) -> usize {
        self.max_entries * BLOCK_SIZE
    }

    /// Current weight in bytes.
    pub fn weight(&self) -> usize {
        self.entries.len() * BLOCK_SIZE
    }

    /// Look up a block. Returns `None` on miss. Promotes on hit.
    pub fn get(&mut self, key: &CacheKey) -> Option<&Vec<u8>> {
        if self.entries.contains_key(key) {
            self.promote(key);
            self.entries.get(key)
        } else {
            None
        }
    }

    /// Insert a block into the cache, evicting if necessary.
    pub fn insert(&mut self, key: CacheKey, data: Vec<u8>) {
        if self.entries.contains_key(&key) {
            self.entries.insert(key, data);
            self.promote(&key);
            return;
        }

        while self.entries.len() >= self.max_entries {
            if let Some(evicted) = self.lru_order.pop_front() {
                self.entries.remove(&evicted);
            } else {
                break;
            }
        }

        self.entries.insert(key, data);
        self.lru_order.push_back(key);
    }

    /// Remove a specific entry.
    pub fn remove(&mut self, key: &CacheKey) -> Option<Vec<u8>> {
        if let Some(data) = self.entries.remove(key) {
            self.lru_order.retain(|k| k != key);
            Some(data)
        } else {
            None
        }
    }

    /// Invalidate all entries for a given file.
    pub fn invalidate_file(&mut self, file_id: FileId) {
        self.entries.retain(|k, _| k.file_id != file_id);
        self.lru_order.retain(|k| k.file_id != file_id);
    }

    /// Clear the entire cache.
    pub fn clear(&mut self) {
        self.entries.clear();
        self.lru_order.clear();
    }

    /// Number of entries currently cached.
    pub fn len(&self) -> usize {
        self.entries.len()
    }

    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    fn promote(&mut self, key: &CacheKey) {
        self.lru_order.retain(|k| k != key);
        self.lru_order.push_back(*key);
    }
}
