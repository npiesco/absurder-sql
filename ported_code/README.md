# Ported Reference Code

Reference files copied from sibling projects for implementing the
**Hybrid OPFS+IDB storage backend** in AbsurderSQL.

See `docs/HYBRID_OPFS_PLAN.md` for the full implementation plan.

## Sources

### `fewfs/` — Offline log forensics workstation (Rust/WASM)
- `src/opfs/` — **Primary reference.** OPFS `SyncAccessHandle` block storage,
  Hybrid OPFS+IDB orchestration, `web-sys`/`js_sys` OPFS bindings.
- `src/idb/` — IndexedDB block store (for comparison).
- `src/storage/` — `BlockReader`/`BlockWriter`/`Manifest` traits, caching,
  checksumming, crash recovery, retry logic.
- `bindings/shim.js` — Runtime OPFS→IDB fallback detection.

### `duckcells/` — Browser spreadsheet powered by DuckDB SQL
- `app/opfs-cache.ts` — OPFS as an Arrow IPC cache layer (TypeScript).

## Usage

These files are **read-only references** — do not edit them directly.
Use them to understand the OPFS patterns, then implement equivalents
in `src/storage/wasm_opfs.rs` and `src/storage/hybrid_store.rs`.
