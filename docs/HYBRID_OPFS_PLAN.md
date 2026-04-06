# AbsurderSQL Hybrid OPFS+IDB Storage Backend — Implementation Plan

## Overview

Add an **OPFS (Origin Private File System)** storage backend to AbsurderSQL, alongside the existing IndexedDB backend. The preferred mode is **Hybrid**: OPFS for fast block I/O, IndexedDB for metadata persistence and cross-browser fallback.

This follows the same proven pattern as fewfs's `HybridBlockStore`.

## Progress Update (2026-04-06)

- Completed the first backend-selection foundation slice.
- Added `StorageBackend` state to `BlockStorage`.
- Added `opfs` and `hybrid` feature flags to `Cargo.toml`.
- Added `backend_detect.rs` and real main-thread fallback detection to IndexedDB, with worker-side `SyncAccessHandle` probing.
- Added `new_wasm_with_backend()` / `new_wasm_auto()` in `constructors.rs`.
- Exposed `Database.newDatabaseAuto()` and `db.getStorageBackend()` in the WASM API.
- Added integration test `tests/e2e/backend-auto-fallback.spec.js` validating main-thread auto backend selection and reopen persistence.
- Subsequent branch work also stabilized the broader browser harness and supporting demos; those fixes are already committed on `ft/hybrid-obfs`.
- Added `wasm_opfs.rs` with a single-file OPFS bridge and initial block write/read/delete helpers.
- Wired backend-aware persistence into the current WASM sync paths so worker `Hybrid` / `OPFS` sync mirrors blocks into OPFS while continuing to mirror into IndexedDB.
- Implemented OPFS-first restore in `constructors.rs` for `Hybrid` / `OPFS` backends, with fallback to IndexedDB when no OPFS data exists.
- Added `hybrid_store.rs` so `Hybrid` reopen now restores OPFS blocks, loads IndexedDB metadata, cross-validates checksums, and falls back to IndexedDB when OPFS data is corrupted.
- Added `hybrid_persist()` in `hybrid_store.rs` and routed the existing WASM sync paths through it instead of keeping OPFS+IDB mirroring duplicated inline.
- Upgraded the IndexedDB metadata mirror to persist real block metadata instead of version-only placeholders, with checksum values encoded in a JS-safe format.
- Added integration test `tests/e2e/worker-hybrid-opfs.spec.js` validating worker auto backend selection, real OPFS file creation on sync, OPFS-only reopen when the IndexedDB mirror is deleted, and Hybrid fallback when OPFS bytes are corrupted.
- Current limitation: `hybrid_persist()` is still inlined in existing sync paths, and export/import/recovery flows are not yet OPFS-aware.

Validation completed for this slice:

- `wasm-pack build --dev --target web --out-dir pkg` passed.
- `npm exec -- playwright test tests/e2e/backend-auto-fallback.spec.js --reporter=line` passed.
- `npm exec -- playwright test tests/e2e/backend-auto-fallback.spec.js tests/e2e/worker-hybrid-opfs.spec.js --project=chromium --reporter=line` passed.
- `npm exec -- playwright test tests/e2e/worker-hybrid-opfs.spec.js --project=chromium --reporter=line --grep "restores from OPFS after IndexedDB mirror deletion"` passed.
- `npm exec -- playwright test tests/e2e/worker-hybrid-opfs.spec.js --project=chromium --reporter=line --grep "falls back to IndexedDB when OPFS data is corrupted"` passed.
- Full root Playwright validation for the branch was later brought green during the follow-on harness repair work.
- `cargo test` passed.
- `cargo clippy --all-targets --features telemetry,fs_persist -- -D warnings` passed.
- `cargo fmt --all` passed.

## Why

| Metric | IndexedDB (current) | OPFS SyncAccessHandle |
|--------|---------------------|-----------------------|
| Read 1000 blocks | ~500-2000ms (async, tx overhead) | ~5-50ms (sync, sequential) |
| Write 100 dirty blocks | ~100-500ms (async, tx overhead) | ~1-10ms (sync, sequential) |
| Restore on reload | Slow (deserialize from IDB) | Fast (direct byte reads) |
| API style | Async-only (Promises) | **Synchronous** from Worker context |

OPFS `SyncAccessHandle` is synchronous — a perfect match for SQLite's synchronous VFS callbacks. Currently the VFS writes synchronously to `GLOBAL_STORAGE` (in-memory) and IndexedDB persistence is deferred async. With OPFS, we can optionally persist synchronously in the VFS hot path too.

## Architecture

### Current Flow (IDB-only)
```
VFS x_write → GLOBAL_STORAGE (sync, in-memory) → IndexedDB (async, deferred)
VFS x_read  → GLOBAL_STORAGE (sync, in-memory) ← IndexedDB (async, restore only)
```

### New Flow (Hybrid)
```
VFS x_write → GLOBAL_STORAGE (sync) → OPFS SyncAccessHandle (sync, from Worker)
                                     → IDB metadata (async, deferred)

VFS x_read  → GLOBAL_STORAGE cache  → OPFS SyncAccessHandle (sync, cache miss)
                                     ← OPFS restore (on reload)
                                     ← IDB metadata restore (on reload)
```

### Fallback Flow (IDB-only, no OPFS available)
```
(unchanged — identical to current behavior)
```

---

## Scope: What Changes, What Doesn't

### Unchanged
- `vfs_sync.rs` — `GLOBAL_STORAGE`, `GLOBAL_METADATA`, `GLOBAL_COMMIT_MARKER` thread-locals
- `indexeddb_vfs.rs` — VFS registration, `x_read`/`x_write`/`x_sync` callbacks
- `io_operations.rs` — `read_block_sync`/`write_block_sync` (these write to GLOBAL_STORAGE)
- `metadata.rs` — `ChecksumManager`, `BlockMetadataPersist`
- `leader_election.rs` — localStorage + BroadcastChannel (unchanged)
- All native/mobile code — gated behind `#[cfg(not(target_arch = "wasm32"))]`

### New Files
| File | Purpose | ~LOC |
|------|---------|------|
| `src/storage/wasm_opfs.rs` | OPFS block read/write/delete via `FileSystemSyncAccessHandle` | ~600-800 |
| `src/storage/hybrid_store.rs` | Hybrid orchestrator: OPFS blocks + IDB metadata | ~300-400 |
| `src/storage/backend_detect.rs` | Runtime feature detection (OPFS available?) | ~50-80 |

### Modified Files
| File | Change |
|------|--------|
| `src/storage/mod.rs` | Add `pub mod wasm_opfs;`, `pub mod hybrid_store;`, `pub mod backend_detect;` |
| `src/storage/block_storage.rs` | Add `StorageBackend` enum field, expose backend choice |
| `src/storage/constructors.rs` | New `new_wasm_hybrid()` / `new_wasm_with_backend()` constructors |
| `src/storage/wasm_vfs_sync.rs` | Dispatch sync to OPFS or IDB based on backend |
| `src/storage/sync_operations.rs` | Backend-aware sync dispatch |
| `src/storage/recovery.rs` | OPFS recovery path (directory scan for orphan blocks) |
| `src/storage/export.rs` / `import.rs` | Read blocks from OPFS when exporting |
| `Cargo.toml` | New feature flag `opfs`, `hybrid` |

---

## Detailed Design

### 1. Feature Flags

```toml
# Cargo.toml
[features]
opfs = []           # OPFS-only backend (Worker required)
hybrid = ["opfs"]   # OPFS blocks + IDB metadata (recommended)
```

Both are `#[cfg(target_arch = "wasm32")]` only — mobile/native compilation ignores them entirely.

### 2. `StorageBackend` Enum

```rust
// block_storage.rs
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum StorageBackend {
    IndexedDB,      // Current behavior (default)
    Opfs,           // OPFS-only (requires Worker with SyncAccessHandle)
    Hybrid,         // OPFS for blocks, IDB for metadata (recommended)
}

impl Default for StorageBackend {
    fn default() -> Self {
        StorageBackend::IndexedDB
    }
}
```

Add to `BlockStorage`:
```rust
pub struct BlockStorage {
    // ... existing fields ...
    backend: StorageBackend,
}
```

### 3. `wasm_opfs.rs` — OPFS Block Operations

Mirror the `wasm_indexeddb.rs` API surface:

```rust
/// Persist blocks to OPFS
/// Directory layout: /{db_name}/block_{id}.bin (one file per block)
pub async fn persist_to_opfs(
    db_name: &str,
    blocks: Vec<(u64, Vec<u8>)>,
) -> Result<(), DatabaseError>

/// Restore all blocks from OPFS into GLOBAL_STORAGE
pub async fn restore_from_opfs(db_name: &str) -> Result<(), DatabaseError>

/// Delete specific blocks from OPFS
pub async fn delete_blocks_from_opfs(
    db_name: &str,
    block_ids: &[u64],
) -> Result<(), DatabaseError>

/// Delete entire database directory from OPFS
pub async fn delete_all_from_opfs(db_name: &str) -> Result<(), DatabaseError>

/// Check if OPFS is available (SyncAccessHandle support)
pub fn is_opfs_available() -> bool
```

**OPFS directory structure:**
```
/{db_name}/
  block_0000000000.bin    (4096 bytes each)
  block_0000000001.bin
  ...
  block_NNNNNNNNNN.bin
```

**Alternative (single-file, fewfs-style):**
```
/{db_name}/
  blocks.dat              (contiguous block file, offset = block_id * 4096)
  manifest.json           (block allocation map, commit marker)
```

The single-file approach is faster (one `SyncAccessHandle`, seek to offset) but requires a manifest. The per-file approach is simpler and survives partial writes better. **Recommend: single-file** for performance, since AbsurderSQL already has checksumming for integrity.

### 4. `hybrid_store.rs` — Orchestrator

```rust
/// Persist using hybrid strategy:
/// - Blocks → OPFS (fast, synchronous from Worker)
/// - Metadata (checksums, commit marker, allocation map) → IndexedDB (async)
pub async fn hybrid_persist(
    db_name: &str,
    blocks: Vec<(u64, Vec<u8>)>,
    metadata: Vec<(u64, u64)>,  // (block_id, checksum)
    commit_marker: u64,
) -> Result<(), DatabaseError>

/// Restore using hybrid strategy:
/// - Blocks ← OPFS
/// - Metadata ← IndexedDB
/// - Cross-validate checksums
pub async fn hybrid_restore(db_name: &str) -> Result<(), DatabaseError>
```

### 5. `backend_detect.rs` — Runtime Detection

```rust
/// Probe for OPFS SyncAccessHandle support
/// Returns StorageBackend::Hybrid if available, else StorageBackend::IndexedDB
pub async fn detect_best_backend() -> StorageBackend
```

Implementation: attempt `navigator.storage.getDirectory()`, create a temp file, try `createSyncAccessHandle()`. Clean up and return result. This is the same pattern as fewfs's `shim.js` but in Rust via `web-sys`.

### 6. Constructor Changes

```rust
// constructors.rs
#[cfg(target_arch = "wasm32")]
pub async fn new_wasm_with_backend(
    db_name: &str,
    backend: StorageBackend,
) -> Result<BlockStorage, DatabaseError> {
    match backend {
        StorageBackend::IndexedDB => new_wasm(db_name).await,
        StorageBackend::Opfs => new_wasm_opfs(db_name).await,
        StorageBackend::Hybrid => new_wasm_hybrid(db_name).await,
    }
}

/// Auto-detect best backend and construct
#[cfg(target_arch = "wasm32")]
pub async fn new_wasm_auto(db_name: &str) -> Result<BlockStorage, DatabaseError> {
    let backend = backend_detect::detect_best_backend().await;
    new_wasm_with_backend(db_name, backend).await
}
```

### 7. Sync Dispatch Changes

```rust
// wasm_vfs_sync.rs — modify vfs_sync_database()
match storage.backend {
    StorageBackend::IndexedDB => {
        // existing persist_to_indexeddb_event_based() call
    }
    StorageBackend::Opfs => {
        wasm_opfs::persist_to_opfs(&db_name, blocks).await?;
    }
    StorageBackend::Hybrid => {
        // Blocks → OPFS, metadata → IDB (parallel)
        hybrid_store::hybrid_persist(&db_name, blocks, metadata, commit_marker).await?;
    }
}
```

---

## Implementation Phases

### Phase 1: Foundation (~3-4 days)
- [x] Add `StorageBackend` enum to `block_storage.rs`
- [x] Add `opfs` and `hybrid` feature flags to `Cargo.toml`
- [x] Create `backend_detect.rs` with OPFS feature detection
- [x] Create `wasm_opfs.rs` scaffold with function signatures
- [x] Wire up `mod.rs` with new modules

### Phase 2: OPFS Backend (~4-5 days)
- [x] Implement `persist_to_opfs()` using a wasm-bindgen JS bridge for `SyncAccessHandle`
- [x] Implement `restore_from_opfs()` as the active reload path — read all blocks back into GLOBAL_STORAGE
- [x] Implement `delete_blocks_from_opfs()` and `delete_all_from_opfs()`
- [x] Unit test with browser runner (Playwright)
- [ ] Benchmark: OPFS vs IDB for 100/1000/10000 blocks

### Phase 3: Hybrid Mode (~3-4 days)
- [x] Create `hybrid_store.rs` orchestrator
- [x] Implement `hybrid_persist()` — OPFS blocks + IDB metadata in parallel
- [x] Implement `hybrid_restore()` — cross-validate checksums on load
- [ ] OPFS recovery: detect orphan files, reconcile with IDB metadata

### Phase 4: Integration (~2-3 days)
- [x] Modify `constructors.rs` — `new_wasm_with_backend()`, `new_wasm_auto()`
- [x] Modify `wasm_vfs_sync.rs` — backend-aware sync dispatch
- [ ] Modify `sync_operations.rs` — backend-aware flush
- [ ] Modify `export.rs` / `import.rs` — read from OPFS when applicable
- [ ] Modify `recovery.rs` — OPFS recovery path
- [ ] Expose `StorageBackend` choice in WASM API (`Database::newDatabaseWithBackend()`)

### Phase 5: Testing & Docs (~2 days)
- [x] E2E tests: hybrid persist → close → reload → hybrid restore → verify data
- [x] E2E tests: OPFS unavailable → graceful IDB fallback
- [ ] E2E tests: hybrid crash recovery (kill mid-persist)
- [ ] Update README with OPFS/hybrid documentation
- [ ] Benchmark report

---

## Mobile Impact

**None.** All OPFS code is gated behind `#[cfg(target_arch = "wasm32")]`. Mobile continues to use `rusqlite` + `fs_persist` on real filesystems. No changes to `absurder-sql-mobile/`.

| Platform | Storage Backend | Changed? |
|----------|----------------|----------|
| Browser (WASM) | IDB → **Hybrid (OPFS+IDB)** | Yes |
| Android | rusqlite → `/data/data/{pkg}/files/` | No |
| iOS | rusqlite → `~/Documents/` | No |
| Native CLI | rusqlite → local filesystem | No |

---

## `web-sys` Bindings Needed

The OPFS API requires these `web-sys` features in `Cargo.toml`:

```toml
[dependencies.web-sys]
features = [
    # Existing features...
    # New for OPFS:
    "StorageManager",
    "FileSystemDirectoryHandle",
    "FileSystemFileHandle",
    "FileSystemSyncAccessHandle",
    "FileSystemGetFileOptions",
    "FileSystemGetDirectoryOptions",
    "FileSystemRemoveOptions",
]
```

**Note:** `FileSystemSyncAccessHandle` may not be in `web-sys` yet (it was added to the spec relatively recently). If missing, use `js_sys::Reflect` + `JsValue` to call the methods manually, or use `wasm-bindgen`'s `#[wasm_bindgen]` extern blocks to declare the bindings inline. fewfs's `src/opfs/bridge.rs` has reference code for this approach.

---

## Reference Code (see `ported_code/`)

| Source | File | Relevance |
|--------|------|-----------|
| **fewfs** | `opfs/opfs_store.rs` | OPFS `SyncAccessHandle` block read/write in Rust/WASM |
| **fewfs** | `opfs/hybrid.rs` | Hybrid OPFS+IDB orchestration pattern |
| **fewfs** | `opfs/bridge.rs` | `web-sys` / `js_sys` OPFS API bindings |
| **fewfs** | `storage/types.rs` | `BlockReader`/`BlockWriter`/`Manifest` traits |
| **fewfs** | `idb/idb_store.rs` | IDB block store (for comparison with our `wasm_indexeddb.rs`) |
| **fewfs** | `idb/leader.rs` | Leader election (we already have our own) |
| **fewfs** | `bindings/shim.js` | Runtime OPFS detection (JS reference for `backend_detect.rs`) |
| **duckcells** | `app/opfs-cache.ts` | OPFS as a cache layer (TypeScript reference) |

---

## Open Questions

1. **Single-file vs per-file OPFS layout?** Single-file (`blocks.dat` + manifest) is faster but needs a manifest. Per-file (`block_{id}.bin`) is simpler. Recommend single-file.
2. **Sync writes in VFS hot path?** With `SyncAccessHandle` we *could* persist on every `x_write` instead of deferring. Probably too slow for SQLite's write patterns (many small writes per transaction). Keep the GLOBAL_STORAGE buffer, persist on x_sync or auto-sync.
3. **`web-sys` OPFS coverage?** Need to verify which `FileSystem*` interfaces are in `web-sys` as of 2026. May need manual `wasm-bindgen` extern blocks.
4. **Worker requirement?** `SyncAccessHandle` requires a Worker/SharedWorker/ServiceWorker context (not available on main thread). AbsurderSQL can run on main thread today. Options: (a) require Worker for OPFS mode, (b) fall back to async `FileSystemWritableFileStream` on main thread, (c) auto-detect and use IDB on main thread.
