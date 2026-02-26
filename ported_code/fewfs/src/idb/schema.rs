//! IndexedDB schema: database open + object store creation.
//!
//! Creates a database with 4 object stores:
//! - `files`     — file metadata (committed flag, block count)
//! - `blocks`    — raw block data keyed by "file_id:block_idx"
//! - `manifests` — path → (file_id, version) mappings
//! - `leader`    — leader election lease data

use indexed_db_futures::prelude::*;
use web_sys::js_sys::JsString;

use crate::error::StorageError;

/// Current schema version. Bump when adding/changing object stores.
const DB_VERSION: u32 = 1;

/// The 4 object stores required by fewfs.
const REQUIRED_STORES: [&str; 4] = ["files", "blocks", "manifests", "leader"];

/// Open (or create) the fewfs IndexedDB database.
///
/// On first open the `onupgradeneeded` callback creates the 4 required
/// object stores. Subsequent opens are idempotent — existing stores are
/// left untouched.
pub async fn open_database(name: &str) -> Result<IdbDatabase, StorageError> {
    let mut db_req = IdbDatabase::open_u32(name, DB_VERSION).map_err(|e| {
        StorageError::idb(format!("Failed to open IndexedDB '{}': {:?}", name, e))
    })?;

    db_req.set_on_upgrade_needed(Some(
        move |evt: &IdbVersionChangeEvent| -> Result<(), wasm_bindgen::JsValue> {
            let db = evt.db();

            for &store_name in &REQUIRED_STORES {
                let already_exists = db
                    .object_store_names()
                    .any(|existing| existing == store_name);

                if !already_exists {
                    db.create_object_store(store_name).map_err(|e| {
                        let msg: JsString = format!(
                            "Failed to create object store '{}': {:?}",
                            store_name, e
                        )
                        .into();
                        wasm_bindgen::JsValue::from(msg)
                    })?;
                }
            }

            Ok(())
        },
    ));

    let db = db_req.await.map_err(|e| {
        StorageError::idb(format!(
            "IndexedDB open request failed for '{}': {:?}",
            name, e
        ))
    })?;

    Ok(db)
}