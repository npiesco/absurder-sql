/Users/nicholas.piesco/Downloads/DataSync/PROGRESS.md# DataSync Progress Tracker (Ordered, Checkboxes)

Authoritative progress checklist. Open items first (ordered). Completed items separate. For history/design details, see `PLAN.md`.

Last updated: 2025-08-27 14:17 -0400

## Open (in order)

1. [ ] Crash Consistency & Atomic Batching (Native + IndexedDB)
   - [x] Native (fs_persist): detailed logging around sync/commit/recovery (implemented with tests)
   - [x] WASM/native-test: read visibility gated by commit marker in `read_block_sync()`; checksum verification only for committed data
   - [ ] IndexedDB: transactional writes {blocks + metadata} with commit marker
   - [ ] IndexedDB: recovery scans to finalize/rollback
   - [ ] Idempotent writes keyed by (block_id, version)
   - [x] Tests: simulate crash mid-commit; recovery correctness (native fs_persist)
   - [ ] Tests: simulate crash mid-commit; recovery correctness (IndexedDB)

2. [ ] Multi-Tab Single-Writer
   - [ ] Leader election (BroadcastChannel + lease lock with expiry)
   - [ ] Non-leader tabs forward writes to leader
   - [ ] Tests: two instances; only leader flushes; leadership handover

3. [ ] Observability
   - [ ] Metrics: dirty_count, dirty_bytes, throughput, error_rate, checksum_failures
   - [ ] Events/callbacks: on_sync_start/success/failure; backpressure signals

4. [ ] WASM AutoSync Manager
   - [ ] Worker/SharedWorker timer or requestIdleCallback mirroring native policy
   - [ ] Feature-gated until stable; parity tests in headless Chrome

5. [ ] VFS Durability Mapping
   - [ ] Map SQLite VFS `xSync` to `force_sync()` with durability guarantees; add tests

6. [x] Auto Sync Manager (native) extraction
   - [x] Extract dedicated `AutoSyncManager` from `BlockStorage` (keep `SyncPolicy`/debounce/threshold semantics)

---

## Completed (highlights)

- [x] Native AutoSync with `SyncPolicy` (interval, thresholds, debounce), Tokio + std::thread fallback, and `drain_and_shutdown()`; comprehensive tests passing
- [x] Block metadata persistence: checksum, version, last_modified_ms; read-time verification; algorithm selection (FastHash/CRC32)
- [x] Startup Recovery: corruption detection/repair modes; reconciliation of files vs metadata; atomic commit marker; idempotent runs; crash-hardened fsyncs
- [x] Recovery enhancement: delete invalid-sized `block_*.bin` during reconciliation; fsync `blocks/` dir; tests green
- [x] Crash-consistency tests (native fs_persist): finalize/rollback pending metadata; pending deallocation removes stray file; tombstone persists across finalize — all green
- [x] fs_persist sync behavior: do not prune `metadata.json` entries based on allocation set; keep/remove `block_*.bin` strictly per metadata; preserves version/timestamp semantics
- [x] Metadata semantics: same-data writes still bump `version` and `last_modified_ms` for dirty blocks on sync; batch-write tests ensure only touched blocks update
- [x] Full test suites green in default and with `fs_persist`; stabilized tests with TempDir-based `DATASYNC_FS_BASE` and `#[serial]`
- [x] Crash consistency logging (native fs_persist): added tests asserting logs for sync start/success, pending metadata write/finalize, cleanup-only path, alt mirror `(alt)` path when `DATASYNC_FS_BASE` changes, and startup recovery stray cleanup plus summary; all green with/without `fs_persist`
- [x] Test infra: global test logger to capture logs; silenced `dead_code` warnings for helper to keep `-D warnings` builds green
- [x] Allocations.json logging (native fs_persist): info-level logs for allocations.json writes during cleanup-only and dirty sync (primary and `(alt)` mirror paths). Added tests `logs_allocations_write_cleanup_only` and `logs_allocations_write_sync_dirty_alt` in `tests/crash_consistency_logging_tests.rs`. Full suites green with and without `fs_persist`.
- [x] WASM VFS baseline: registered custom VFS name by aliasing default, gated WASM-only imports to avoid unused warnings, and verified native+WASM test suites pass; groundwork laid for IndexedDB-backed VFS methods and transactional semantics.
- [x] Verified WASM commit marker advancement and cross-instance visibility: `BlockStorage::sync_now()` persists blocks/metadata then advances `GLOBAL_COMMIT_MARKER`; `read_block_sync()` gates by metadata version <= marker; `IndexedDBVFS` uses `STORAGE_REGISTRY` to route operations through the gating path.
- [x] **SQLite WASM Hang Issue Resolution**: Completely resolved infinite hang issue in SQLite WASM integration by replacing problematic custom bindings with stable `sqlite-wasm-rs` crate (v0.4 with precompiled features). Root cause was deprecated WASM module initialization parameters causing infinite loops in `sqlite3_step` calls. Implemented comprehensive regression test suite (6 tests) covering operation timeouts, large result sets, concurrent operations, error conditions, and deprecated pattern detection. All 64 WASM tests + 74 native tests now pass without hangs. Production-ready SQLite WASM integration achieved with full C API compatibility, proper memory management, and robust error handling.
- [x] WASM commit-marker gating tests: `wasm_bindgen_test` in `src/storage/block_storage.rs` verifying zeroed reads while marker lags, checksum skip when invisible, and version/marker tracking across syncs; headless Chrome passing.
- [x] fs_persist crash test: mid-commit partial multi-block mixed presence; startup recovery rolls back to prior commit, removes stray files, keeps missing absent (`tests/crash_partial_multi_mixed_presence_tests.rs`).
- [x] Full test matrix green: native, native+fs_persist, and WASM (`wasm-pack test --chrome --headless`).
