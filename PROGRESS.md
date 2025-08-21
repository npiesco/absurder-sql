# DataSync Progress Tracker (Ordered, Checkboxes)

Authoritative progress checklist. Open items first (ordered). Completed items separate. For history/design details, see `PLAN.md`.

Last updated: 2025-08-21 11:07 -0400

## Open (in order)

1. [ ] Crash Consistency & Atomic Batching (Native + IndexedDB)
   - [ ] Native (fs_persist): detailed logging around sync/commit/recovery
   - [ ] IndexedDB: transactional writes {blocks + metadata} with commit marker
   - [ ] IndexedDB: recovery scans to finalize/rollback
   - [ ] Idempotent writes keyed by (block_id, version)
   - [ ] Tests: simulate crash mid-commit; recovery correctness (native + IndexedDB)

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

6. [ ] Auto Sync Manager (native) extraction
   - [ ] Extract dedicated `AutoSyncManager` from `BlockStorage` (keep `SyncPolicy`/debounce/threshold semantics)

---

## Completed (highlights)

- [x] Native AutoSync with `SyncPolicy` (interval, thresholds, debounce), Tokio + std::thread fallback, and `drain_and_shutdown()`; comprehensive tests passing
- [x] Block metadata persistence: checksum, version, last_modified_ms; read-time verification; algorithm selection (FastHash/CRC32)
- [x] Startup Recovery: corruption detection/repair modes; reconciliation of files vs metadata; atomic commit marker; idempotent runs; crash-hardened fsyncs
- [x] Recovery enhancement: delete invalid-sized `block_*.bin` during reconciliation; fsync `blocks/` dir; tests green
- [x] Full test suites green in default and with `fs_persist`; stabilized tests with TempDir-based `DATASYNC_FS_BASE` and `#[serial]`
