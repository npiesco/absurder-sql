//! IndexedDB-backed `BlockStore` implementation.
//!
//! Async mirror of `MemBlockStore` — every operation hits real IndexedDB.
//! Uses `indexed_db_futures` for ergonomic async access.

use indexed_db_futures::prelude::*;
use wasm_bindgen::JsValue;
use web_sys::IdbTransactionMode;

use crate::error::{Result, StorageError};
use crate::types::{BlockIdx, FileId, BLOCK_SIZE};

use super::schema;

/// Block key format: "file_id:block_idx" → deterministic string key.
fn block_key(file_id: FileId, block_idx: BlockIdx) -> JsValue {
    JsValue::from_str(&format!("{}:{}", file_id, block_idx))
}

/// File metadata key format: "file:file_id"
fn file_key(file_id: FileId) -> JsValue {
    JsValue::from_str(&format!("file:{}", file_id))
}

/// Manifest entry key: the path itself.
fn manifest_key(path: &str) -> JsValue {
    JsValue::from_str(path)
}

/// IndexedDB-backed block store.
///
/// All operations are async. Implements the same semantics as `MemBlockStore`:
/// - WORM: files are immutable after commit
/// - `put_block` pads/truncates data to `BLOCK_SIZE`
/// - Manifest is a path → (file_id, version) mapping
pub struct IdbBlockStore {
    db: IdbDatabase,
    name: String,
}

impl IdbBlockStore {
    /// Open (or create) the IndexedDB-backed store.
    pub async fn open(name: &str) -> Result<Self> {
        let db = schema::open_database(name).await?;
        Ok(Self {
            db,
            name: name.to_string(),
        })
    }

    /// The database name this store was opened with.
    pub fn db_name(&self) -> &str {
        &self.name
    }

    /// Close the underlying database handle.
    pub fn close(self) {
        self.db.close();
    }

    // ── File metadata helpers ──

    /// Read file metadata from the "files" store.
    /// Returns (committed, version, block_count) or None if missing.
    async fn get_file_meta(&self, file_id: FileId) -> Result<Option<(bool, u64, u64)>> {
        let tx = self.db.transaction_on_one("files").map_err(|e| {
            StorageError::idb(format!("Failed to open files transaction: {:?}", e))
        })?;
        let store = tx.object_store("files").map_err(|e| {
            StorageError::idb(format!("Failed to access files store: {:?}", e))
        })?;

        let key = file_key(file_id);
        let val: Option<JsValue> = store
            .get(&key)
            .map_err(|e| StorageError::idb(format!("get file meta failed: {:?}", e)))?
            .await
            .map_err(|e| StorageError::idb(format!("get file meta await failed: {:?}", e)))?;

        match val {
            None => Ok(None),
            Some(js) => {
                // Stored as JSON string: "committed,version,block_count"
                let s = js
                    .as_string()
                    .ok_or_else(|| StorageError::idb("file metadata is not a string"))?;
                let parts: Vec<&str> = s.split(',').collect();
                if parts.len() != 3 {
                    return Err(StorageError::idb(format!(
                        "invalid file metadata format: {}",
                        s
                    )));
                }
                let committed = parts[0] == "true";
                let version: u64 = parts[1]
                    .parse()
                    .map_err(|_| StorageError::idb("invalid version in file metadata"))?;
                let block_count: u64 = parts[2]
                    .parse()
                    .map_err(|_| StorageError::idb("invalid block_count in file metadata"))?;
                Ok(Some((committed, version, block_count)))
            }
        }
    }

    /// Write file metadata to the "files" store.
    async fn put_file_meta(
        &self,
        file_id: FileId,
        committed: bool,
        version: u64,
        block_count: u64,
    ) -> Result<()> {
        let tx = self
            .db
            .transaction_on_one_with_mode("files", IdbTransactionMode::Readwrite)
            .map_err(|e| {
                StorageError::idb(format!("Failed to open files rw transaction: {:?}", e))
            })?;
        let store = tx.object_store("files").map_err(|e| {
            StorageError::idb(format!("Failed to access files store: {:?}", e))
        })?;

        let key = file_key(file_id);
        let val = JsValue::from_str(&format!("{},{},{}", committed, version, block_count));
        store
            .put_key_val(&key, &val)
            .map_err(|e| StorageError::idb(format!("put file meta failed: {:?}", e)))?;
        tx.await
            .into_result()
            .map_err(|e| StorageError::idb(format!("file meta tx commit failed: {:?}", e)))?;
        Ok(())
    }

    // ── Next file ID ──

    /// Allocate the next file_id using an atomic counter stored in "files" store.
    async fn next_file_id(&self) -> Result<FileId> {
        let tx = self
            .db
            .transaction_on_one_with_mode("files", IdbTransactionMode::Readwrite)
            .map_err(|e| {
                StorageError::idb(format!("Failed to open files rw transaction: {:?}", e))
            })?;
        let store = tx.object_store("files").map_err(|e| {
            StorageError::idb(format!("Failed to access files store: {:?}", e))
        })?;

        let counter_key = JsValue::from_str("__next_file_id__");
        let current: Option<JsValue> = store
            .get(&counter_key)
            .map_err(|e| StorageError::idb(format!("get counter failed: {:?}", e)))?
            .await
            .map_err(|e| StorageError::idb(format!("get counter await failed: {:?}", e)))?;

        let next_id: u64 = match current {
            Some(val) => {
                let s = val.as_string().unwrap_or_else(|| "1".to_string());
                s.parse().unwrap_or(1)
            }
            None => 1,
        };

        // Store incremented counter
        let new_counter = JsValue::from_str(&(next_id + 1).to_string());
        store
            .put_key_val(&counter_key, &new_counter)
            .map_err(|e| StorageError::idb(format!("put counter failed: {:?}", e)))?;

        tx.await
            .into_result()
            .map_err(|e| StorageError::idb(format!("counter tx commit failed: {:?}", e)))?;

        Ok(next_id)
    }

    // ── BlockReader (async) ──

    /// Read a single block. Returns exactly `BLOCK_SIZE` bytes.
    pub async fn get_block(&self, file_id: FileId, block_idx: BlockIdx) -> Result<Vec<u8>> {
        // Verify file exists
        let meta = self.get_file_meta(file_id).await?;
        if meta.is_none() {
            return Err(StorageError::new(
                "FILE_NOT_FOUND",
                format!("file_id={}", file_id),
            ));
        }

        let tx = self.db.transaction_on_one("blocks").map_err(|e| {
            StorageError::idb(format!("Failed to open blocks transaction: {:?}", e))
        })?;
        let store = tx.object_store("blocks").map_err(|e| {
            StorageError::idb(format!("Failed to access blocks store: {:?}", e))
        })?;

        let key = block_key(file_id, block_idx);
        let val: Option<JsValue> = store
            .get(&key)
            .map_err(|e| StorageError::idb(format!("get block failed: {:?}", e)))?
            .await
            .map_err(|e| StorageError::idb(format!("get block await failed: {:?}", e)))?;

        match val {
            None => Err(StorageError::block_not_found(file_id, block_idx)),
            Some(js) => {
                // Stored as Uint8Array
                let array = js_sys::Uint8Array::new(&js);
                let mut data = vec![0u8; array.length() as usize];
                array.copy_to(&mut data);
                Ok(data)
            }
        }
    }

    /// Check whether a block exists.
    pub async fn has_block(&self, file_id: FileId, block_idx: BlockIdx) -> Result<bool> {
        // Verify file exists
        let meta = self.get_file_meta(file_id).await?;
        if meta.is_none() {
            return Err(StorageError::new(
                "FILE_NOT_FOUND",
                format!("file_id={}", file_id),
            ));
        }

        let tx = self.db.transaction_on_one("blocks").map_err(|e| {
            StorageError::idb(format!("Failed to open blocks transaction: {:?}", e))
        })?;
        let store = tx.object_store("blocks").map_err(|e| {
            StorageError::idb(format!("Failed to access blocks store: {:?}", e))
        })?;

        let key = block_key(file_id, block_idx);
        let val: Option<JsValue> = store
            .get(&key)
            .map_err(|e| StorageError::idb(format!("get block for has_block failed: {:?}", e)))?
            .await
            .map_err(|e| {
                StorageError::idb(format!("get block for has_block await failed: {:?}", e))
            })?;

        Ok(val.is_some())
    }

    /// Total number of blocks for a file.
    pub async fn block_count(&self, file_id: FileId) -> Result<u64> {
        let meta = self
            .get_file_meta(file_id)
            .await?
            .ok_or_else(|| StorageError::new("FILE_NOT_FOUND", format!("file_id={}", file_id)))?;
        Ok(meta.2) // block_count field
    }

    // ── BlockWriter (async) ──

    /// Create a new file and return its `FileId`.
    pub async fn create_file(&mut self) -> Result<FileId> {
        let file_id = self.next_file_id().await?;
        self.put_file_meta(file_id, false, 0, 0).await?;
        Ok(file_id)
    }

    /// Write a block (creates or overwrites if not yet committed).
    pub async fn put_block(
        &mut self,
        file_id: FileId,
        block_idx: BlockIdx,
        data: &[u8],
    ) -> Result<()> {
        let meta = self
            .get_file_meta(file_id)
            .await?
            .ok_or_else(|| StorageError::new("FILE_NOT_FOUND", format!("file_id={}", file_id)))?;

        if meta.0 {
            return Err(StorageError::immutable_write(file_id));
        }

        // Pad or truncate to BLOCK_SIZE
        let mut block = vec![0u8; BLOCK_SIZE];
        let len = data.len().min(BLOCK_SIZE);
        block[..len].copy_from_slice(&data[..len]);

        // Write block data
        let tx = self
            .db
            .transaction_on_one_with_mode("blocks", IdbTransactionMode::Readwrite)
            .map_err(|e| {
                StorageError::idb(format!("Failed to open blocks rw transaction: {:?}", e))
            })?;
        let store = tx.object_store("blocks").map_err(|e| {
            StorageError::idb(format!("Failed to access blocks store: {:?}", e))
        })?;

        let key = block_key(file_id, block_idx);
        let array = js_sys::Uint8Array::new_with_length(BLOCK_SIZE as u32);
        array.copy_from(&block);
        store
            .put_key_val(&key, &array)
            .map_err(|e| StorageError::idb(format!("put block failed: {:?}", e)))?;

        tx.await
            .into_result()
            .map_err(|e| StorageError::idb(format!("block write tx commit failed: {:?}", e)))?;

        // Update block count: check if this is a new block or an overwrite
        let was_existing = {
            let check_tx = self.db.transaction_on_one("blocks").map_err(|e| {
                StorageError::idb(format!("Failed to open blocks check transaction: {:?}", e))
            })?;
            // Block was just written, so we need to count how many blocks we have for this file.
            // Use a prefix scan approach — count all keys matching "file_id:*"
            // Since IDB doesn't have prefix queries easily, track count in metadata.
            // We already wrote the block, so check if block_idx >= current block_count.
            drop(check_tx);
            block_idx >= meta.2
        };

        if was_existing {
            // New block index (or overwrite of highest) — update count.
            // Simple approach: count = max(current_count, block_idx + 1)
            let new_count = std::cmp::max(meta.2, block_idx + 1);
            self.put_file_meta(file_id, false, meta.1, new_count)
                .await?;
        }

        Ok(())
    }

    /// Commit all blocks for `file_id`. File becomes immutable.
    pub async fn commit(&mut self, file_id: FileId) -> Result<u64> {
        let meta = self
            .get_file_meta(file_id)
            .await?
            .ok_or_else(|| StorageError::new("FILE_NOT_FOUND", format!("file_id={}", file_id)))?;

        if meta.0 {
            return Err(StorageError::immutable_write(file_id));
        }

        let new_version = meta.1 + 1;
        self.put_file_meta(file_id, true, new_version, meta.2)
            .await?;
        Ok(new_version)
    }

    /// Atomic small-blob write: create file, write single block, commit.
    pub async fn atomic_write(&mut self, data: &[u8]) -> Result<FileId> {
        let fid = self.create_file().await?;
        self.put_block(fid, 0, data).await?;
        self.commit(fid).await?;
        Ok(fid)
    }

    // ── Manifest (async) ──

    /// Resolve a path to its current `(FileId, version)`.
    pub async fn resolve(&self, path: &str) -> Result<Option<(FileId, u64)>> {
        let tx = self.db.transaction_on_one("manifests").map_err(|e| {
            StorageError::idb(format!("Failed to open manifests transaction: {:?}", e))
        })?;
        let store = tx.object_store("manifests").map_err(|e| {
            StorageError::idb(format!("Failed to access manifests store: {:?}", e))
        })?;

        let key = manifest_key(path);
        let val: Option<JsValue> = store
            .get(&key)
            .map_err(|e| StorageError::idb(format!("get manifest failed: {:?}", e)))?
            .await
            .map_err(|e| StorageError::idb(format!("get manifest await failed: {:?}", e)))?;

        match val {
            None => Ok(None),
            Some(js) => {
                let s = js.as_string().ok_or_else(|| {
                    StorageError::idb("manifest entry is not a string")
                })?;
                let parts: Vec<&str> = s.split(',').collect();
                if parts.len() != 2 {
                    return Err(StorageError::idb(format!(
                        "invalid manifest format: {}",
                        s
                    )));
                }
                let file_id: u64 = parts[0]
                    .parse()
                    .map_err(|_| StorageError::idb("invalid file_id in manifest"))?;
                let version: u64 = parts[1]
                    .parse()
                    .map_err(|_| StorageError::idb("invalid version in manifest"))?;
                Ok(Some((file_id, version)))
            }
        }
    }

    /// Point `path` at `file_id` with the given `version`.
    /// Returns the previous `(FileId, version)` if any.
    pub async fn publish(
        &mut self,
        path: &str,
        file_id: FileId,
        version: u64,
    ) -> Result<Option<(FileId, u64)>> {
        // Read existing value first
        let previous = self.resolve(path).await?;

        let tx = self
            .db
            .transaction_on_one_with_mode("manifests", IdbTransactionMode::Readwrite)
            .map_err(|e| {
                StorageError::idb(format!("Failed to open manifests rw transaction: {:?}", e))
            })?;
        let store = tx.object_store("manifests").map_err(|e| {
            StorageError::idb(format!("Failed to access manifests store: {:?}", e))
        })?;

        let key = manifest_key(path);
        let val = JsValue::from_str(&format!("{},{}", file_id, version));
        store
            .put_key_val(&key, &val)
            .map_err(|e| StorageError::idb(format!("put manifest failed: {:?}", e)))?;

        tx.await
            .into_result()
            .map_err(|e| StorageError::idb(format!("manifest write tx commit failed: {:?}", e)))?;

        Ok(previous)
    }

    /// Remove a path mapping. Returns the previous `(FileId, version)` if any.
    pub async fn remove(&mut self, path: &str) -> Result<Option<(FileId, u64)>> {
        let previous = self.resolve(path).await?;

        if previous.is_some() {
            let tx = self
                .db
                .transaction_on_one_with_mode("manifests", IdbTransactionMode::Readwrite)
                .map_err(|e| {
                    StorageError::idb(format!(
                        "Failed to open manifests rw transaction: {:?}",
                        e
                    ))
                })?;
            let store = tx.object_store("manifests").map_err(|e| {
                StorageError::idb(format!("Failed to access manifests store: {:?}", e))
            })?;

            let key = manifest_key(path);
            store
                .delete(&key)
                .map_err(|e| StorageError::idb(format!("delete manifest failed: {:?}", e)))?;

            tx.await.into_result().map_err(|e| {
                StorageError::idb(format!("manifest delete tx commit failed: {:?}", e))
            })?;
        }

        Ok(previous)
    }

    /// List all paths currently in the manifest.
    pub async fn list_paths(&self) -> Result<Vec<String>> {
        let tx = self.db.transaction_on_one("manifests").map_err(|e| {
            StorageError::idb(format!("Failed to open manifests transaction: {:?}", e))
        })?;
        let store = tx.object_store("manifests").map_err(|e| {
            StorageError::idb(format!("Failed to access manifests store: {:?}", e))
        })?;

        let keys = store
            .get_all_keys()
            .map_err(|e| StorageError::idb(format!("get_all_keys failed: {:?}", e)))?
            .await
            .map_err(|e| StorageError::idb(format!("get_all_keys await failed: {:?}", e)))?;

        let mut paths = Vec::new();
        for i in 0..keys.length() {
            let js_key = keys.get(i);
            if let Some(s) = js_key.as_string() {
                paths.push(s);
            }
        }

        Ok(paths)
    }
}
