//! JS bridge for OPFS `SyncAccessHandle` operations.
//!
//! Embeds a minimal JavaScript module via `inline_js` that manages
//! `FileSystemSyncAccessHandle` instances keyed by integer IDs.
//! The Rust side only stores the `u32` handle ID — no `JsValue` —
//! so `OpfsBlockStore` is naturally `Send + Sync`.

use wasm_bindgen::prelude::*;

#[wasm_bindgen(inline_js = r#"
const handles = new Map();
let nextId = 1;

export async function opfs_open(name) {
    const root = await navigator.storage.getDirectory();
    const fh = await root.getFileHandle(name + '.blk', { create: true });
    const ah = await fh.createSyncAccessHandle();
    const id = nextId++;
    handles.set(id, ah);
    return id;
}

export function opfs_read(id, offset, len) {
    const h = handles.get(id);
    if (!h) throw new Error('OPFS handle not found: ' + id);
    const buf = new Uint8Array(len);
    h.read(buf, { at: offset });
    return buf;
}

export function opfs_write(id, offset, data) {
    const h = handles.get(id);
    if (!h) throw new Error('OPFS handle not found: ' + id);
    h.write(data, { at: offset });
}

export function opfs_flush(id) {
    const h = handles.get(id);
    if (h) h.flush();
}

export function opfs_size(id) {
    const h = handles.get(id);
    if (!h) return 0;
    return h.getSize();
}

export function opfs_truncate(id, size) {
    const h = handles.get(id);
    if (h) h.truncate(size);
}

export function opfs_close(id) {
    const h = handles.get(id);
    if (h) {
        h.close();
        handles.delete(id);
    }
}

export async function opfs_delete(name) {
    try {
        const root = await navigator.storage.getDirectory();
        await root.removeEntry(name + '.blk');
    } catch (_) {
        // Ignore — file may not exist
    }
}

export function opfs_available() {
    return !!(globalThis.navigator &&
              globalThis.navigator.storage &&
              typeof globalThis.navigator.storage.getDirectory === 'function');
}
"#)]
extern "C" {
    /// Open (or create) an OPFS file and return a handle ID.
    /// Async: acquires directory + SyncAccessHandle.
    #[wasm_bindgen(js_name = "opfs_open", catch)]
    pub async fn opfs_open(name: &str) -> Result<JsValue, JsValue>;

    /// Read `len` bytes starting at `offset`. Returns a `Uint8Array`.
    #[wasm_bindgen(js_name = "opfs_read")]
    pub fn opfs_read(id: u32, offset: u32, len: u32) -> js_sys::Uint8Array;

    /// Write `data` at `offset`.
    #[wasm_bindgen(js_name = "opfs_write")]
    pub fn opfs_write(id: u32, offset: u32, data: &[u8]);

    /// Flush pending writes to disk.
    #[wasm_bindgen(js_name = "opfs_flush")]
    pub fn opfs_flush(id: u32);

    /// Current file size in bytes.
    #[wasm_bindgen(js_name = "opfs_size")]
    pub fn opfs_size(id: u32) -> u32;

    /// Truncate file to `size` bytes.
    #[wasm_bindgen(js_name = "opfs_truncate")]
    pub fn opfs_truncate(id: u32, size: u32);

    /// Close the SyncAccessHandle and release OS resources.
    #[wasm_bindgen(js_name = "opfs_close")]
    pub fn opfs_close(id: u32);

    /// Delete the OPFS file. Async.
    #[wasm_bindgen(js_name = "opfs_delete", catch)]
    pub async fn opfs_delete(name: &str) -> Result<JsValue, JsValue>;

    /// Feature-detect OPFS availability (navigator.storage.getDirectory).
    #[wasm_bindgen(js_name = "opfs_available")]
    pub fn opfs_available() -> bool;
}
