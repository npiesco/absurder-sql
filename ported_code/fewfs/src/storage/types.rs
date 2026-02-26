//! Core traits that define the fewfs BlockStore abstraction.
//!
//! These traits are intentionally sync at this level. The IndexedDB
//! implementation wraps them in async via the idb module.

use crate::error::Result;

/// Unique identifier for a logical file inside the store.
pub type FileId = u64;

/// Zero-indexed block number within a file.
pub type BlockIdx = u64;

/// Size of every block, in bytes. All blocks in a store share the same size.
pub const BLOCK_SIZE: usize = 4096;

/// Read-only view of the block store.
pub trait BlockReader {
    /// Read a single block. Returns exactly `BLOCK_SIZE` bytes.
    fn get_block(&self, file_id: FileId, block_idx: BlockIdx) -> Result<Vec<u8>>;

    /// Check whether a block exists.
    fn has_block(&self, file_id: FileId, block_idx: BlockIdx) -> Result<bool>;

    /// Total number of committed blocks for a file.
    fn block_count(&self, file_id: FileId) -> Result<u64>;
}

/// Writer half of the block store.
///
/// Writes are buffered until [`BlockWriter::commit`] is called. After
/// commit the file becomes immutable (WORM semantics).
pub trait BlockWriter {
    /// Create a new file and return its `FileId`.
    fn create_file(&mut self) -> Result<FileId>;

    /// Write a block (creates or overwrites if not yet committed).
    fn put_block(&mut self, file_id: FileId, block_idx: BlockIdx, data: &[u8]) -> Result<()>;

    /// Commit all pending blocks for `file_id`.
    ///
    /// After this call the file is immutable — further `put_block` calls
    /// for the same `file_id` MUST return `StorageError::immutable_write`.
    fn commit(&mut self, file_id: FileId) -> Result<u64>;

    /// Atomic small-blob write: create file, write single block, commit.
    ///
    /// Used for Tantivy `atomic_write(path, data)`.
    fn atomic_write(&mut self, data: &[u8]) -> Result<FileId> {
        let fid = self.create_file()?;
        self.put_block(fid, 0, data)?;
        self.commit(fid)?;
        Ok(fid)
    }
}

/// Manifest: maps human-readable paths to immutable `FileId` + version.
///
/// Pointer-swap semantics: updating a path atomically swaps its file_id.
pub trait Manifest {
    /// Resolve a path to its current `(FileId, version)`.
    fn resolve(&self, path: &str) -> Result<Option<(FileId, u64)>>;

    /// Point `path` at `file_id` with the given `version`.
    ///
    /// Returns the previous `(FileId, version)` if any.
    fn publish(&mut self, path: &str, file_id: FileId, version: u64) -> Result<Option<(FileId, u64)>>;

    /// Remove a path mapping.
    fn remove(&mut self, path: &str) -> Result<Option<(FileId, u64)>>;

    /// List all paths currently in the manifest.
    fn list_paths(&self) -> Result<Vec<String>>;
}

/// Combined block store: reader + writer + manifest.
pub trait BlockStore: BlockReader + BlockWriter + Manifest {}

// Blanket impl — any type implementing all three traits is a BlockStore.
impl<T: BlockReader + BlockWriter + Manifest> BlockStore for T {}
