//! Hybrid block store: OPFS for bulk block data, IDB for metadata.
//!
//! # Architecture
//!
//! ```text
//! ┌──────────────────────────────────────────────┐
//! │              HybridBlockStore                │
//! ├──────────────────────┬───────────────────────┤
//! │  Block data (OPFS)   │  Metadata (IDB)       │
//! │  put_block / get_block│  files, manifest,     │
//! │  via SyncAccessHandle │  block offsets         │
//! └──────────────────────┴───────────────────────┘
//! ```
//!
//! The OPFS `SyncAccessHandle` provides synchronous block I/O.
//! Metadata (file registry, manifest, block offset index) is held
//! in memory for sync access and flushed to IndexedDB asynchronously
//! via `flush_metadata()`.
//!
//! # Why not just OpfsBlockStore?
//!
//! `OpfsBlockStore` loses metadata on reload (in-memory only).
//! `HybridBlockStore` persists metadata to IndexedDB so that the
//! block index, manifest, and file registry survive page reloads.

use std::collections::HashMap;

use wasm_bindgen::prelude::*;

use crate::error::{Result, StorageError};
use crate::idb::idb_store::IdbBlockStore;
use crate::types::*;

use super::bridge;

/// Alias to avoid crate `Result<T>` alias collision in wasm-bindgen methods.
type JsResult<T> = std::result::Result<T, JsValue>;

/// Per-file metadata tracked in memory.
struct FileEntry {
    committed: bool,
    version: u64,
    block_count: u64,
}

/// Hybrid block store: OPFS blocks + IDB metadata persistence.
///
/// Implements the sync `BlockStore` trait (via OPFS SyncAccessHandle).
/// Metadata is kept in memory for sync access and flushed to IDB
/// on demand via `flush_metadata()`.
pub struct HybridBlockStore {
    /// OPFS bridge handle ID (sync I/O).
    bridge_id: u32,
    /// Store name for IDB key prefixes and OPFS file naming.
    #[allow(dead_code)]
    name: String,
    /// IDB store for metadata persistence.
    idb: IdbBlockStore,
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

impl HybridBlockStore {
    /// Open (or create) a hybrid block store.
    ///
    /// 1. Opens the OPFS `SyncAccessHandle` for block data.
    /// 2. Opens the IDB store for metadata persistence.
    /// 3. Loads any persisted metadata from IDB into memory.
    pub async fn open(name: &str) -> Result<Self> {
        // 1. OPFS for block data
        let bridge_result = bridge::opfs_open(&format!("{name}_hybrid"))
            .await
            .map_err(|e| StorageError::new("OPFS_ERROR", format!("{:?}", e)))?;

        let bridge_id = bridge_result
            .as_f64()
            .ok_or_else(|| StorageError::new("OPFS_ERROR", "opfs_open did not return a number"))?
            as u32;

        // 2. IDB for metadata
        let idb = IdbBlockStore::open(&format!("{name}_hybrid_meta")).await?;

        // 3. Load persisted metadata from IDB (if any)
        let (files, manifest, block_offsets, next_file_id, next_offset) =
            Self::load_metadata(&idb).await;

        Ok(Self {
            bridge_id,
            name: name.to_string(),
            idb,
            files,
            manifest,
            next_file_id,
            block_offsets,
            next_offset,
        })
    }

    /// Load persisted metadata from IDB.
    ///
    /// Returns defaults if no metadata exists (fresh store).
    async fn load_metadata(
        idb: &IdbBlockStore,
    ) -> (
        HashMap<FileId, FileEntry>,
        HashMap<String, (FileId, u64)>,
        HashMap<(FileId, BlockIdx), u64>,
        FileId,
        u64,
    ) {
        // Try to load serialized metadata from IDB manifest store
        // using a well-known key. If missing, return defaults.
        match idb.resolve("__hybrid_meta__").await {
            Ok(Some((next_file_id, next_offset))) => {
                // Metadata exists — load the full state
                let mut files = HashMap::new();
                let mut block_offsets = HashMap::new();

                // Load file entries from IDB manifest
                if let Ok(paths) = idb.list_paths().await {
                    for path in &paths {
                        if path.starts_with("__file:") {
                            // Parse: __file:{file_id} → "committed,version,block_count"
                            if let Some(id_str) = path.strip_prefix("__file:") {
                                if let Ok(file_id) = id_str.parse::<u64>() {
                                    if let Ok(Some((committed_flag, ver))) =
                                        idb.resolve(path).await
                                    {
                                        files.insert(
                                            file_id,
                                            FileEntry {
                                                committed: committed_flag > 0,
                                                version: ver,
                                                block_count: 0, // updated below
                                            },
                                        );
                                    }
                                }
                            }
                        } else if path.starts_with("__block:") {
                            // Parse: __block:{file_id}:{block_idx} → offset stored as (file_id=offset, ver=0)
                            if let Some(rest) = path.strip_prefix("__block:") {
                                let parts: Vec<&str> = rest.split(':').collect();
                                if parts.len() == 2 {
                                    if let (Ok(fid), Ok(bidx)) =
                                        (parts[0].parse::<u64>(), parts[1].parse::<u64>())
                                    {
                                        if let Ok(Some((offset, _))) = idb.resolve(path).await {
                                            block_offsets.insert((fid, bidx), offset);
                                            // Update block count
                                            if let Some(entry) = files.get_mut(&fid) {
                                                entry.block_count = block_offsets
                                                    .keys()
                                                    .filter(|(f, _)| *f == fid)
                                                    .count()
                                                    as u64;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Load manifest entries (paths not starting with __)
                let mut manifest = HashMap::new();
                if let Ok(paths) = idb.list_paths().await {
                    for path in &paths {
                        if !path.starts_with("__") {
                            if let Ok(Some((fid, ver))) = idb.resolve(path).await {
                                manifest.insert(path.clone(), (fid, ver));
                            }
                        }
                    }
                }

                (files, manifest, block_offsets, next_file_id, next_offset)
            }
            _ => {
                // Fresh store
                (HashMap::new(), HashMap::new(), HashMap::new(), 1, 0)
            }
        }
    }

    /// Flush in-memory metadata to IndexedDB for persistence.
    ///
    /// Call this after important state changes (commit, publish)
    /// to ensure metadata survives page reload.
    pub async fn flush_metadata(&mut self) -> Result<()> {
        // Store the meta header: next_file_id + next_offset
        self.idb
            .publish("__hybrid_meta__", self.next_file_id, self.next_offset)
            .await?;

        // Store file entries
        for (&file_id, entry) in &self.files {
            let key = format!("__file:{file_id}");
            let committed_flag = if entry.committed { 1u64 } else { 0u64 };
            self.idb.publish(&key, committed_flag, entry.version).await?;
        }

        // Store block offsets
        for (&(file_id, block_idx), &offset) in &self.block_offsets {
            let key = format!("__block:{file_id}:{block_idx}");
            self.idb.publish(&key, offset, 0).await?;
        }

        // Store manifest entries
        for (path, &(file_id, version)) in &self.manifest {
            self.idb.publish(path, file_id, version).await?;
        }

        Ok(())
    }

    /// Close the OPFS handle. IDB connection cleaned up by GC.
    pub fn close(&self) {
        bridge::opfs_close(self.bridge_id);
        // IdbBlockStore::close(self) consumes by value.
        // The IDB connection closes when the struct is dropped / GC'd.
    }

    /// Delete backing OPFS file and IDB database.
    pub async fn destroy(name: &str) {
        let _ = bridge::opfs_delete(&format!("{name}_hybrid")).await;
        let _ = indexed_db_futures::IdbDatabase::delete_by_name(&format!("{name}_hybrid_meta"));
    }
}

// ── BlockReader ─────────────────────────────────────────────────────

impl BlockReader for HybridBlockStore {
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

impl BlockWriter for HybridBlockStore {
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

        // Get existing offset or allocate new one
        let offset = if let Some(&existing) = self.block_offsets.get(&(file_id, block_idx)) {
            existing
        } else {
            let offset = self.next_offset;
            self.next_offset += BLOCK_SIZE as u64;
            self.block_offsets.insert((file_id, block_idx), offset);

            let count = self
                .block_offsets
                .keys()
                .filter(|(fid, _)| *fid == file_id)
                .count() as u64;
            entry.block_count = count;
            offset
        };

        // Write to OPFS (sync)
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

        bridge::opfs_flush(self.bridge_id);

        Ok(entry.version)
    }
}

// ── Manifest ────────────────────────────────────────────────────────

impl Manifest for HybridBlockStore {
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

/// JS-facing wrapper for `HybridBlockStore`.
#[wasm_bindgen(js_name = "JsHybridBlockStore")]
pub struct JsHybridBlockStore {
    inner: HybridBlockStore,
}

#[wasm_bindgen(js_class = "JsHybridBlockStore")]
impl JsHybridBlockStore {
    #[wasm_bindgen]
    pub async fn open(name: &str) -> JsResult<JsHybridBlockStore> {
        let store = HybridBlockStore::open(name)
            .await
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(JsHybridBlockStore { inner: store })
    }

    #[wasm_bindgen]
    pub fn close(&self) {
        self.inner.close();
    }

    #[wasm_bindgen]
    pub async fn destroy(name: &str) -> JsResult<()> {
        HybridBlockStore::destroy(name).await;
        Ok(())
    }

    /// Flush metadata to IDB for persistence.
    #[wasm_bindgen(js_name = "flushMetadata")]
    pub async fn flush_metadata(&mut self) -> JsResult<()> {
        self.inner
            .flush_metadata()
            .await
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen(js_name = "createFile")]
    pub fn create_file(&mut self) -> JsResult<u32> {
        self.inner
            .create_file()
            .map(|id| id as u32)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen(js_name = "putBlock")]
    pub fn put_block(&mut self, file_id: u32, block_idx: u32, data: &[u8]) -> JsResult<()> {
        self.inner
            .put_block(file_id as u64, block_idx as u64, data)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen]
    pub fn commit(&mut self, file_id: u32) -> JsResult<u32> {
        self.inner
            .commit(file_id as u64)
            .map(|v| v as u32)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen(js_name = "getBlock")]
    pub fn get_block(&self, file_id: u32, block_idx: u32) -> JsResult<Vec<u8>> {
        self.inner
            .get_block(file_id as u64, block_idx as u64)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen(js_name = "hasBlock")]
    pub fn has_block(&self, file_id: u32, block_idx: u32) -> JsResult<bool> {
        self.inner
            .has_block(file_id as u64, block_idx as u64)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen(js_name = "blockCount")]
    pub fn block_count(&self, file_id: u32) -> JsResult<u32> {
        self.inner
            .block_count(file_id as u64)
            .map(|c| c as u32)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen(js_name = "atomicWrite")]
    pub fn atomic_write(&mut self, data: &[u8]) -> JsResult<u32> {
        self.inner
            .atomic_write(data)
            .map(|id| id as u32)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

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

    #[wasm_bindgen]
    pub fn publish(&mut self, path: &str, file_id: u32, version: u32) -> JsResult<()> {
        self.inner
            .publish(path, file_id as u64, version as u64)
            .map(|_| ())
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

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

    #[wasm_bindgen(js_name = "listPaths")]
    pub fn list_paths(&self) -> JsResult<Vec<String>> {
        self.inner
            .list_paths()
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }
}
