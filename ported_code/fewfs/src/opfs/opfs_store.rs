//! OPFS-backed `BlockStore` implementation.
//!
//! Uses a single OPFS file per store (via `SyncAccessHandle`) with an
//! append-only layout for block data. An in-memory index maps
//! `(FileId, BlockIdx)` to byte offsets within the file.
//!
//! # Layout
//!
//! ```text
//! ┌──────────────────────────────────────────────┐
//! │ Block data region (append-only)              │
//! │  offset 0: first put_block's 4096 bytes      │
//! │  offset 4096: second put_block's 4096 bytes   │
//! │  …                                            │
//! └──────────────────────────────────────────────┘
//! ```
//!
//! Metadata (file registry, manifest, block offsets) lives in memory.
//! Full persistence of metadata is handled by Phase 7.3 (HybridBlockStore)
//! which stores metadata in IndexedDB.
//!
//! # Worker-only
//!
//! `SyncAccessHandle` is only available in dedicated Worker contexts.
//! The async `open()` obtains the handle; all `BlockStore` trait methods
//! are synchronous after that.

use std::collections::HashMap;

use wasm_bindgen::prelude::*;

use crate::error::{Result, StorageError};
use crate::types::*;

use super::bridge;

/// Alias to disambiguate from crate's `Result<T>`.
type JsResult<T> = std::result::Result<T, JsValue>;

/// Per-file metadata tracked in memory.
struct FileEntry {
    committed: bool,
    version: u64,
    block_count: u64,
}

/// OPFS-backed block store.
///
/// Block data is stored in a single OPFS file via `SyncAccessHandle`.
/// Metadata (file registry + manifest) lives in memory.
pub struct OpfsBlockStore {
    /// Integer ID referencing the JS-side SyncAccessHandle.
    bridge_id: u32,
    /// Store name (used for file naming and cleanup).
    name: String,
    /// File registry: FileId → metadata.
    files: HashMap<FileId, FileEntry>,
    /// Manifest: path → (FileId, version).
    manifest: HashMap<String, (FileId, u64)>,
    /// Next FileId to allocate.
    next_file_id: FileId,
    /// Maps (FileId, BlockIdx) → byte offset in the OPFS file.
    block_offsets: HashMap<(FileId, BlockIdx), u64>,
    /// Next available byte offset for appending a new block.
    next_offset: u64,
}

impl OpfsBlockStore {
    /// Open (or create) an OPFS-backed block store.
    ///
    /// Acquires an OPFS `SyncAccessHandle` for a file named `{name}.blk`.
    /// This is the only async operation — all trait methods are sync after this.
    pub async fn open(name: &str) -> Result<Self> {
        let result = bridge::opfs_open(name)
            .await
            .map_err(|e| StorageError::new("OPFS_ERROR", format!("{:?}", e)))?;

        let bridge_id = result
            .as_f64()
            .ok_or_else(|| StorageError::new("OPFS_ERROR", "opfs_open did not return a number"))?
            as u32;

        Ok(Self {
            bridge_id,
            name: name.to_string(),
            files: HashMap::new(),
            manifest: HashMap::new(),
            next_file_id: 1,
            block_offsets: HashMap::new(),
            next_offset: 0,
        })
    }

    /// Close the SyncAccessHandle. After this, all operations will fail.
    pub fn close(&self) {
        bridge::opfs_close(self.bridge_id);
    }

    /// Delete the backing OPFS file. Call after `close()`.
    pub async fn destroy(name: &str) {
        let _ = bridge::opfs_delete(name).await;
    }

    /// The store name.
    pub fn store_name(&self) -> &str {
        &self.name
    }

    /// Whether OPFS is available in this context.
    pub fn is_available() -> bool {
        bridge::opfs_available()
    }
}

// ── BlockReader ─────────────────────────────────────────────────────

impl BlockReader for OpfsBlockStore {
    fn get_block(&self, file_id: FileId, block_idx: BlockIdx) -> Result<Vec<u8>> {
        if !self.files.contains_key(&file_id) {
            return Err(StorageError::new(
                "FILE_NOT_FOUND",
                format!("file_id={file_id}"),
            ));
        }

        let &offset = self
            .block_offsets
            .get(&(file_id, block_idx))
            .ok_or_else(|| StorageError::block_not_found(file_id, block_idx))?;

        let array = bridge::opfs_read(self.bridge_id, offset as u32, BLOCK_SIZE as u32);
        let mut buf = vec![0u8; BLOCK_SIZE];
        array.copy_to(&mut buf);
        Ok(buf)
    }

    fn has_block(&self, file_id: FileId, block_idx: BlockIdx) -> Result<bool> {
        if !self.files.contains_key(&file_id) {
            return Err(StorageError::new(
                "FILE_NOT_FOUND",
                format!("file_id={file_id}"),
            ));
        }
        Ok(self.block_offsets.contains_key(&(file_id, block_idx)))
    }

    fn block_count(&self, file_id: FileId) -> Result<u64> {
        let entry = self.files.get(&file_id).ok_or_else(|| {
            StorageError::new("FILE_NOT_FOUND", format!("file_id={file_id}"))
        })?;
        Ok(entry.block_count)
    }
}

// ── BlockWriter ─────────────────────────────────────────────────────

impl BlockWriter for OpfsBlockStore {
    fn create_file(&mut self) -> Result<FileId> {
        let id = self.next_file_id;
        self.next_file_id += 1;
        self.files.insert(
            id,
            FileEntry {
                committed: false,
                version: 0,
                block_count: 0,
            },
        );
        Ok(id)
    }

    fn put_block(&mut self, file_id: FileId, block_idx: BlockIdx, data: &[u8]) -> Result<()> {
        let entry = self.files.get_mut(&file_id).ok_or_else(|| {
            StorageError::new("FILE_NOT_FOUND", format!("file_id={file_id}"))
        })?;

        if entry.committed {
            return Err(StorageError::immutable_write(file_id));
        }

        // Pad or truncate to BLOCK_SIZE
        let mut block = vec![0u8; BLOCK_SIZE];
        let len = data.len().min(BLOCK_SIZE);
        block[..len].copy_from_slice(&data[..len]);

        // Get existing offset or allocate a new one
        let offset = if let Some(&existing) = self.block_offsets.get(&(file_id, block_idx)) {
            existing
        } else {
            let offset = self.next_offset;
            self.next_offset += BLOCK_SIZE as u64;
            self.block_offsets.insert((file_id, block_idx), offset);
            // Update block count: count distinct block indices for this file
            let count = self
                .block_offsets
                .keys()
                .filter(|(fid, _)| *fid == file_id)
                .count() as u64;
            entry.block_count = count;
            offset
        };

        // Write to OPFS via SyncAccessHandle (sync)
        bridge::opfs_write(self.bridge_id, offset as u32, &block);

        Ok(())
    }

    fn commit(&mut self, file_id: FileId) -> Result<u64> {
        let entry = self.files.get_mut(&file_id).ok_or_else(|| {
            StorageError::new("FILE_NOT_FOUND", format!("file_id={file_id}"))
        })?;

        if entry.committed {
            return Err(StorageError::immutable_write(file_id));
        }

        entry.version += 1;
        entry.committed = true;

        // Flush to ensure data is persistent
        bridge::opfs_flush(self.bridge_id);

        Ok(entry.version)
    }
}

// ── Manifest ────────────────────────────────────────────────────────

impl Manifest for OpfsBlockStore {
    fn resolve(&self, path: &str) -> Result<Option<(FileId, u64)>> {
        Ok(self.manifest.get(path).copied())
    }

    fn publish(
        &mut self,
        path: &str,
        file_id: FileId,
        version: u64,
    ) -> Result<Option<(FileId, u64)>> {
        Ok(self.manifest.insert(path.to_owned(), (file_id, version)))
    }

    fn remove(&mut self, path: &str) -> Result<Option<(FileId, u64)>> {
        Ok(self.manifest.remove(path))
    }

    fn list_paths(&self) -> Result<Vec<String>> {
        Ok(self.manifest.keys().cloned().collect())
    }
}

// ── wasm-bindgen JS API ─────────────────────────────────────────────

/// JS-facing wrapper for `OpfsBlockStore`.
///
/// Exposes all `BlockStore` trait methods via `#[wasm_bindgen]` so
/// Playwright tests can exercise the real OPFS path in a Worker.
#[wasm_bindgen(js_name = "JsOpfsBlockStore")]
pub struct JsOpfsBlockStore {
    inner: OpfsBlockStore,
}

#[wasm_bindgen(js_class = "JsOpfsBlockStore")]
impl JsOpfsBlockStore {
    /// Open an OPFS-backed block store. Returns a Promise.
    #[wasm_bindgen]
    pub async fn open(name: &str) -> JsResult<JsOpfsBlockStore> {
        let store = OpfsBlockStore::open(name)
            .await
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(JsOpfsBlockStore { inner: store })
    }

    /// Close the underlying SyncAccessHandle.
    #[wasm_bindgen]
    pub fn close(&self) {
        self.inner.close();
    }

    /// Delete the backing OPFS file. Call after close().
    #[wasm_bindgen]
    pub async fn destroy(name: &str) -> JsResult<()> {
        OpfsBlockStore::destroy(name).await;
        Ok(())
    }

    /// Create a new file. Returns the FileId.
    #[wasm_bindgen(js_name = "createFile")]
    pub fn create_file(&mut self) -> JsResult<u32> {
        self.inner
            .create_file()
            .map(|id| id as u32)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Write a block of data for a file at a given block index.
    #[wasm_bindgen(js_name = "putBlock")]
    pub fn put_block(
        &mut self,
        file_id: u32,
        block_idx: u32,
        data: &[u8],
    ) -> JsResult<()> {
        self.inner
            .put_block(file_id as u64, block_idx as u64, data)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Commit a file (makes it immutable). Returns the version.
    #[wasm_bindgen]
    pub fn commit(&mut self, file_id: u32) -> JsResult<u32> {
        self.inner
            .commit(file_id as u64)
            .map(|v| v as u32)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Read a block. Returns a Uint8Array of BLOCK_SIZE bytes.
    #[wasm_bindgen(js_name = "getBlock")]
    pub fn get_block(&self, file_id: u32, block_idx: u32) -> JsResult<Vec<u8>> {
        self.inner
            .get_block(file_id as u64, block_idx as u64)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Check if a block exists.
    #[wasm_bindgen(js_name = "hasBlock")]
    pub fn has_block(&self, file_id: u32, block_idx: u32) -> JsResult<bool> {
        self.inner
            .has_block(file_id as u64, block_idx as u64)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Number of blocks for a file.
    #[wasm_bindgen(js_name = "blockCount")]
    pub fn block_count(&self, file_id: u32) -> JsResult<u32> {
        self.inner
            .block_count(file_id as u64)
            .map(|c| c as u32)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Atomic write: create file, write single block, commit. Returns FileId.
    #[wasm_bindgen(js_name = "atomicWrite")]
    pub fn atomic_write(&mut self, data: &[u8]) -> JsResult<u32> {
        self.inner
            .atomic_write(data)
            .map(|id| id as u32)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Resolve a manifest path. Returns [fileId, version] or null.
    #[wasm_bindgen]
    pub fn resolve(&self, path: &str) -> JsResult<JsValue> {
        match self
            .inner
            .resolve(path)
            .map_err(|e| JsValue::from_str(&e.to_string()))?
        {
            Some((fid, ver)) => {
                let arr = js_sys::Array::new();
                arr.push(&JsValue::from_f64(fid as f64));
                arr.push(&JsValue::from_f64(ver as f64));
                Ok(arr.into())
            }
            None => Ok(JsValue::NULL),
        }
    }

    /// Publish a path → (file_id, version) mapping.
    #[wasm_bindgen]
    pub fn publish(&mut self, path: &str, file_id: u32, version: u32) -> JsResult<()> {
        self.inner
            .publish(path, file_id as u64, version as u64)
            .map(|_| ())
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Remove a manifest entry. Returns the previous [fileId, version] or null.
    #[wasm_bindgen]
    pub fn remove(&mut self, path: &str) -> JsResult<JsValue> {
        match self
            .inner
            .remove(path)
            .map_err(|e| JsValue::from_str(&e.to_string()))?
        {
            Some((fid, ver)) => {
                let arr = js_sys::Array::new();
                arr.push(&JsValue::from_f64(fid as f64));
                arr.push(&JsValue::from_f64(ver as f64));
                Ok(arr.into())
            }
            None => Ok(JsValue::NULL),
        }
    }

    /// List all manifest paths. Returns an array of strings.
    #[wasm_bindgen(js_name = "listPaths")]
    pub fn list_paths(&self) -> JsResult<Vec<String>> {
        self.inner
            .list_paths()
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }
}
