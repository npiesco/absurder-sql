//! WASM OPFS block persistence helpers.
//!
//! This module provides a minimal write-through OPFS path for browser worker
//! contexts using `FileSystemSyncAccessHandle`. The current slice mirrors block
//! data into OPFS on sync while keeping IndexedDB restoration as the reload path
//! until full OPFS restore/orchestration lands.

use crate::storage::metadata::{BlockMetadataPersist, ChecksumAlgorithm, ChecksumManager};
use crate::storage::vfs_sync;
use crate::types::DatabaseError;
use crate::utils::normalize_db_name;
use wasm_bindgen::prelude::*;

const OPFS_FILE_SUFFIX: &str = ".absurder.blocks.bin";

#[wasm_bindgen(inline_js = r#"
const absurdHandles = new Map();
let absurdNextHandleId = 1;

function absurdGetRoot() {
  if (!globalThis.navigator || !globalThis.navigator.storage || typeof globalThis.navigator.storage.getDirectory !== 'function') {
    throw new Error('OPFS is not available in this context');
  }

  return globalThis.navigator.storage.getDirectory();
}

export async function absurd_opfs_open(fileName, create = true) {
  const root = await absurdGetRoot();
    const fileHandle = await root.getFileHandle(fileName, { create });
  const accessHandle = await fileHandle.createSyncAccessHandle();
  const id = absurdNextHandleId++;
  absurdHandles.set(id, accessHandle);
  return id;
}

export async function absurd_opfs_exists(fileName) {
    try {
        const root = await absurdGetRoot();
        await root.getFileHandle(fileName, { create: false });
        return true;
    } catch (error) {
        if (error && error.name === 'NotFoundError') {
            return false;
        }
        throw error;
    }
}

export function absurd_opfs_read(id, offset, len) {
  const handle = absurdHandles.get(id);
  if (!handle) {
    throw new Error('OPFS handle not found: ' + id);
  }

  const buffer = new Uint8Array(len);
  handle.read(buffer, { at: offset });
  return buffer;
}

export function absurd_opfs_write(id, offset, data) {
  const handle = absurdHandles.get(id);
  if (!handle) {
    throw new Error('OPFS handle not found: ' + id);
  }

  const written = handle.write(data, { at: offset });
  if (written !== data.byteLength) {
    throw new Error('Short OPFS write: ' + written + ' of ' + data.byteLength + ' bytes');
  }
}

export function absurd_opfs_flush(id) {
  const handle = absurdHandles.get(id);
  if (!handle) throw new Error('OPFS handle not found: ' + id);
  handle.flush();
}

export function absurd_opfs_size(id) {
  const handle = absurdHandles.get(id);
  if (!handle) {
    throw new Error('OPFS handle not found: ' + id);
  }

  return handle.getSize();
}

export function absurd_opfs_truncate(id, size) {
    const handle = absurdHandles.get(id);
    if (!handle) {
        throw new Error('OPFS handle not found: ' + id);
    }

    handle.truncate(size);
}

export async function absurd_opfs_close(id) {
  const handle = absurdHandles.get(id);
  if (!handle) {
    return;
  }

  const result = handle.close();
  absurdHandles.delete(id);
  if (result && typeof result.then === 'function') {
    await result;
  }
}

export async function absurd_opfs_delete(fileName) {
  try {
    const root = await absurdGetRoot();
    await root.removeEntry(fileName);
  } catch (error) {
    if (!error || error.name !== 'NotFoundError') {
      throw error;
    }
  }
}

export function absurd_opfs_available() {
  return !!(globalThis.navigator &&
    globalThis.navigator.storage &&
    typeof globalThis.navigator.storage.getDirectory === 'function');
}
"#)]
extern "C" {
    #[wasm_bindgen(js_name = absurd_opfs_open, catch)]
    async fn js_opfs_open(file_name: &str, create: bool) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(js_name = absurd_opfs_exists, catch)]
    async fn js_opfs_exists(file_name: &str) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(js_name = absurd_opfs_read, catch)]
    fn js_opfs_read(handle_id: u32, offset: u32, len: u32) -> Result<js_sys::Uint8Array, JsValue>;

    #[wasm_bindgen(js_name = absurd_opfs_write, catch)]
    fn js_opfs_write(handle_id: u32, offset: u32, data: &[u8]) -> Result<(), JsValue>;

    #[wasm_bindgen(js_name = absurd_opfs_flush, catch)]
    fn js_opfs_flush(handle_id: u32) -> Result<(), JsValue>;

    #[wasm_bindgen(js_name = absurd_opfs_size, catch)]
    fn js_opfs_size(handle_id: u32) -> Result<u32, JsValue>;

    #[wasm_bindgen(js_name = absurd_opfs_truncate, catch)]
    fn js_opfs_truncate(handle_id: u32, size: u32) -> Result<(), JsValue>;

    #[wasm_bindgen(js_name = absurd_opfs_close, catch)]
    async fn js_opfs_close(handle_id: u32) -> Result<(), JsValue>;

    #[wasm_bindgen(js_name = absurd_opfs_delete, catch)]
    async fn js_opfs_delete(file_name: &str) -> Result<(), JsValue>;

    #[wasm_bindgen(js_name = absurd_opfs_available)]
    fn js_opfs_available() -> bool;
}

fn sanitize_opfs_component(value: &str) -> String {
    value
        .chars()
        .map(|ch| match ch {
            '/' | '\\' | ':' => '_',
            _ => ch,
        })
        .collect()
}

fn opfs_file_name(db_name: &str) -> String {
    let normalized = normalize_db_name(db_name);
    format!(
        "{}{}",
        sanitize_opfs_component(&normalized),
        OPFS_FILE_SUFFIX
    )
}

fn map_js_error(code: &str, error: JsValue) -> DatabaseError {
    DatabaseError::new(code, &format!("{:?}", error))
}

async fn with_opfs_lock<F, Fut, T>(db_name: &str, f: F) -> Result<T, DatabaseError>
where
    F: FnOnce() -> Fut,
    Fut: std::future::Future<Output = Result<T, DatabaseError>>,
{
    let lock_name = format!("opfs:{}", opfs_file_name(db_name));
    crate::storage::export_import_lock::with_lock(&lock_name, || async move {
        f().await
            .map_err(|error| JsValue::from_str(&error.to_string()))
    })
    .await
    .map_err(|error| map_js_error("OPFS_LOCK_ERROR", error))
}

async fn open_handle_for_db(db_name: &str, create: bool) -> Result<u32, DatabaseError> {
    let handle_value = js_opfs_open(&opfs_file_name(db_name), create)
        .await
        .map_err(|error| map_js_error("OPFS_OPEN_ERROR", error))?;

    let handle_id = handle_value.as_f64().ok_or_else(|| {
        DatabaseError::new(
            "OPFS_OPEN_ERROR",
            "OPFS bridge did not return a numeric handle",
        )
    })? as u32;

    Ok(handle_id)
}

async fn opfs_file_exists(db_name: &str) -> Result<bool, DatabaseError> {
    let exists = js_opfs_exists(&opfs_file_name(db_name))
        .await
        .map_err(|error| map_js_error("OPFS_EXISTS_ERROR", error))?;

    exists.as_bool().ok_or_else(|| {
        DatabaseError::new(
            "OPFS_EXISTS_ERROR",
            "OPFS exists bridge did not return a boolean",
        )
    })
}

async fn with_handle<T>(
    db_name: &str,
    create: bool,
    operation: impl FnOnce(u32) -> Result<T, DatabaseError>,
) -> Result<T, DatabaseError> {
    let handle = open_handle_for_db(db_name, create).await?;
    let result = operation(handle);
    let closed = js_opfs_close(handle)
        .await
        .map_err(|error| map_js_error("OPFS_CLOSE_ERROR", error));
    match (result, closed) {
        (Ok(value), Ok(())) => Ok(value),
        (Err(error), Ok(())) | (Ok(_), Err(error)) => Err(error),
        (Err(error), Err(close_error)) => Err(DatabaseError::new(
            &error.code,
            &format!(
                "{}; additionally closing the OPFS handle failed: {}",
                error.message, close_error.message
            ),
        )),
    }
}

pub fn is_opfs_available() -> bool {
    js_opfs_available()
}

pub async fn persist_to_opfs(
    db_name: &str,
    blocks: Vec<(u64, Vec<u8>)>,
) -> Result<(), DatabaseError> {
    persist_blocks_to_opfs(db_name, &blocks).await
}

pub(crate) async fn persist_blocks_to_opfs(
    db_name: &str,
    blocks: &[(u64, Vec<u8>)],
) -> Result<(), DatabaseError> {
    let db_name = db_name.to_string();
    let lock_name = db_name.clone();
    with_opfs_lock(&lock_name, move || async move {
        if blocks.is_empty() {
            return Ok(());
        }

        if !is_opfs_available() {
            return Err(DatabaseError::new(
                "OPFS_UNAVAILABLE",
                "Origin Private File System is not available in this context",
            ));
        }

        with_handle(&db_name, true, |handle_id| {
            for (block_id, data) in blocks {
                let offset = block_id
                    .checked_mul(crate::storage::BLOCK_SIZE as u64)
                    .ok_or_else(|| {
                        DatabaseError::new("OPFS_OFFSET_ERROR", "Block offset overflow")
                    })?;
                let offset = u32::try_from(offset).map_err(|_| {
                    DatabaseError::new(
                        "OPFS_OFFSET_ERROR",
                        "Block offset exceeds OPFS bridge range",
                    )
                })?;

                let mut padded = vec![0u8; crate::storage::BLOCK_SIZE];
                let copy_len = data.len().min(crate::storage::BLOCK_SIZE);
                padded[..copy_len].copy_from_slice(&data[..copy_len]);
                js_opfs_write(handle_id, offset, &padded)
                    .map_err(|error| map_js_error("OPFS_WRITE_ERROR", error))?;
            }

            js_opfs_flush(handle_id).map_err(|error| map_js_error("OPFS_FLUSH_ERROR", error))
        })
        .await
    })
    .await
}

pub async fn restore_from_opfs(db_name: &str) -> Result<usize, DatabaseError> {
    let db_name = db_name.to_string();
    let lock_name = db_name.clone();
    with_opfs_lock(&lock_name, move || async move {
        if !is_opfs_available() {
            return Ok(0);
        }

        if !opfs_file_exists(&db_name).await? {
            return Ok(0);
        }

        let restored_blocks = with_handle(&db_name, false, |handle_id| {
            let size = js_opfs_size(handle_id)
                .map_err(|error| map_js_error("OPFS_SIZE_ERROR", error))?
                as u64;
            if size == 0 {
                return Ok(Vec::new());
            }

            let mut block_ids = vfs_sync::with_global_allocation_map(|allocation_map| {
                allocation_map
                    .borrow()
                    .get(&db_name)
                    .map(|entries| entries.iter().copied().collect::<Vec<_>>())
                    .unwrap_or_default()
            });

            if block_ids.is_empty() {
                block_ids = vfs_sync::with_global_metadata(|metadata_map| {
                    metadata_map
                        .borrow()
                        .get(&db_name)
                        .map(|entries| entries.keys().copied().collect::<Vec<_>>())
                        .unwrap_or_default()
                });
            }

            if block_ids.is_empty() {
                let total_blocks = size / crate::storage::BLOCK_SIZE as u64;
                block_ids = (0..total_blocks).collect();
            }

            block_ids.sort_unstable();
            block_ids.dedup();

            let mut restored_blocks = Vec::new();
            for block_id in block_ids {
                let offset = block_id
                    .checked_mul(crate::storage::BLOCK_SIZE as u64)
                    .ok_or_else(|| {
                        DatabaseError::new("OPFS_OFFSET_ERROR", "Block offset overflow")
                    })?;

                if offset >= size {
                    continue;
                }

                let offset = u32::try_from(offset).map_err(|_| {
                    DatabaseError::new("OPFS_OFFSET_ERROR", "Read offset exceeds OPFS bridge range")
                })?;
                let buffer = js_opfs_read(handle_id, offset, crate::storage::BLOCK_SIZE as u32)
                    .map_err(|error| map_js_error("OPFS_READ_ERROR", error))?;
                let mut data = vec![0u8; crate::storage::BLOCK_SIZE];
                buffer.copy_to(&mut data);
                restored_blocks.push((block_id, data));
            }

            Ok(restored_blocks)
        })
        .await?;

        if restored_blocks.is_empty() {
            return Ok(0);
        }

        let restored_count = restored_blocks.len();
        let restored_commit = vfs_sync::with_global_commit_marker(|commit_map| {
            commit_map.borrow().get(&db_name).copied()
        })
        .unwrap_or(0)
        .max(1);
        let restored_version = u32::try_from(restored_commit).unwrap_or(u32::MAX);
        let restored_at_ms = js_sys::Date::now() as u64;

        vfs_sync::with_global_storage(|storage_map| {
            let mut storage_map = storage_map.borrow_mut();
            let db_storage = storage_map
                .entry(db_name.to_string())
                .or_insert_with(std::collections::HashMap::new);
            for (block_id, data) in &restored_blocks {
                db_storage.insert(*block_id, data.clone());
            }
        });

        vfs_sync::with_global_allocation_map(|allocation_map| {
            let mut allocation_map = allocation_map.borrow_mut();
            let allocations = allocation_map
                .entry(db_name.to_string())
                .or_insert_with(std::collections::HashSet::new);
            for (block_id, _) in &restored_blocks {
                allocations.insert(*block_id);
            }
        });

        vfs_sync::with_global_metadata(|metadata_map| {
            let mut metadata_map = metadata_map.borrow_mut();
            let db_metadata = metadata_map
                .entry(db_name.to_string())
                .or_insert_with(std::collections::HashMap::new);

            for (block_id, data) in &restored_blocks {
                db_metadata.insert(
                    *block_id,
                    BlockMetadataPersist {
                        checksum: ChecksumManager::compute_checksum_with(
                            data,
                            ChecksumAlgorithm::FastHash,
                        ),
                        last_modified_ms: restored_at_ms,
                        version: restored_version,
                        algo: ChecksumAlgorithm::FastHash,
                    },
                );
            }
        });

        vfs_sync::with_global_commit_marker(|commit_map| {
            commit_map
                .borrow_mut()
                .insert(db_name.to_string(), restored_commit);
        });

        Ok(restored_count)
    })
    .await
}

pub async fn reconcile_opfs_with_metadata(
    db_name: &str,
    valid_block_ids: &[u64],
) -> Result<(), DatabaseError> {
    let db_name = db_name.to_string();
    let valid_block_ids = valid_block_ids.to_vec();
    let lock_name = db_name.clone();
    with_opfs_lock(&lock_name, move || async move {
        if !is_opfs_available() || valid_block_ids.is_empty() {
            return Ok(());
        }

        if !opfs_file_exists(&db_name).await? {
            return Ok(());
        }

        with_handle(&db_name, false, |handle_id| {
            let current_size = js_opfs_size(handle_id)
                .map_err(|error| map_js_error("OPFS_SIZE_ERROR", error))?
                as u64;
            if current_size == 0 {
                return Ok(());
            }

            let block_size = crate::storage::BLOCK_SIZE as u64;
            let total_blocks = current_size.div_ceil(block_size);
            let valid_blocks = valid_block_ids
                .iter()
                .copied()
                .collect::<std::collections::HashSet<_>>();
            let zero_block = vec![0u8; crate::storage::BLOCK_SIZE];

            for block_id in 0..total_blocks {
                if valid_blocks.contains(&block_id) {
                    continue;
                }

                let offset = block_id.checked_mul(block_size).ok_or_else(|| {
                    DatabaseError::new("OPFS_OFFSET_ERROR", "Block offset overflow")
                })?;
                let offset = u32::try_from(offset).map_err(|_| {
                    DatabaseError::new(
                        "OPFS_OFFSET_ERROR",
                        "Block offset exceeds OPFS bridge range",
                    )
                })?;
                js_opfs_write(handle_id, offset, &zero_block)
                    .map_err(|error| map_js_error("OPFS_WRITE_ERROR", error))?;
            }

            let max_block_id = valid_block_ids.iter().copied().max().unwrap_or(0);
            let expected_size = max_block_id
                .checked_add(1)
                .and_then(|block_count| block_count.checked_mul(block_size))
                .ok_or_else(|| {
                    DatabaseError::new("OPFS_SIZE_ERROR", "Expected OPFS size overflow")
                })?;

            if expected_size < current_size {
                let expected_size = u32::try_from(expected_size).map_err(|_| {
                    DatabaseError::new(
                        "OPFS_SIZE_ERROR",
                        "Expected OPFS size exceeds OPFS bridge range",
                    )
                })?;
                js_opfs_truncate(handle_id, expected_size)
                    .map_err(|error| map_js_error("OPFS_TRUNCATE_ERROR", error))?;
            }

            js_opfs_flush(handle_id).map_err(|error| map_js_error("OPFS_FLUSH_ERROR", error))
        })
        .await
    })
    .await
}

pub async fn delete_blocks_from_opfs(
    db_name: &str,
    block_ids: &[u64],
) -> Result<(), DatabaseError> {
    let db_name = db_name.to_string();
    let block_ids = block_ids.to_vec();
    let lock_name = db_name.clone();
    with_opfs_lock(&lock_name, move || async move {
        if block_ids.is_empty() || !is_opfs_available() {
            return Ok(());
        }

        if !opfs_file_exists(&db_name).await? {
            return Ok(());
        }

        with_handle(&db_name, false, |handle_id| {
            let zero_block = vec![0u8; crate::storage::BLOCK_SIZE];

            for block_id in block_ids {
                let offset = block_id
                    .checked_mul(crate::storage::BLOCK_SIZE as u64)
                    .ok_or_else(|| {
                        DatabaseError::new("OPFS_OFFSET_ERROR", "Block offset overflow")
                    })?;
                let offset = u32::try_from(offset).map_err(|_| {
                    DatabaseError::new(
                        "OPFS_OFFSET_ERROR",
                        "Block offset exceeds OPFS bridge range",
                    )
                })?;
                js_opfs_write(handle_id, offset, &zero_block)
                    .map_err(|error| map_js_error("OPFS_WRITE_ERROR", error))?;
            }

            js_opfs_flush(handle_id).map_err(|error| map_js_error("OPFS_FLUSH_ERROR", error))
        })
        .await
    })
    .await
}

pub async fn delete_all_from_opfs(db_name: &str) -> Result<(), DatabaseError> {
    let db_name = db_name.to_string();
    let lock_name = db_name.clone();
    with_opfs_lock(&lock_name, move || async move {
        if !is_opfs_available() {
            return Ok(());
        }

        js_opfs_delete(&opfs_file_name(&db_name))
            .await
            .map_err(|error| map_js_error("OPFS_DELETE_ERROR", error))
    })
    .await
}
