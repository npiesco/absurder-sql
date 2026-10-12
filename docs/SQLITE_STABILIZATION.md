# SQLite/browser stabilization

This record covers stabilization after the physical-deletion checkpoint
`52af0dcdd2e0755a44b9472ac407dc281e3b331e`. As of 2026-09-21, the repaired
working-tree runtime is qualified on the original Apple runtime and the isolated
Windows Server 2025 x64 SYSTEM lane. It is not a publication or an all-platform
release qualification. Original deletion and pre-portability candidates remain
immutable; the later repaired packages have separate identities.

## Current qualified runtime

[Native qualification](NATIVE_QUALIFICATION.md) is the authority for the final
real runs, retained failures, package alignment, and hash-verified evidence.
The qualified `src/lib.rs` SHA-256 is
`19c57e0c144caeae5e212a2ef604ce27a422935c0589b784cd1df6b64427ecbe`.
The physical-deletion checkpoint alone does not identify this repaired runtime.

Both the original Apple Python 3.9.6 / SQLite 3.51.0 lane and the final Windows
Server 2025 x64 SYSTEM lane passed 214 native tests plus the existing ignored
documentation example, 298 default WASM, 16 enabled-telemetry, 79 browser/benchmark,
13 deletion, 35 stabilization, and 3 production PWA tests. Formatting, all three
strict Clippy gates, native release, and tested/rebuilt runtime identity passed.
Default and telemetry packaged variants each passed 13 deletion plus 35
stabilization cases. The final Windows run completed all 21 stages and all four
packaged-suite contracts; this does not turn earlier attempts into passing runs.

| Repaired candidate | npm archive SHA-256 | WASM SHA-256 |
| --- | --- | --- |
| Default | `ea561585e1c146698501ea3c431eabc51b4b11cc64b25d09d6a0b73f9717a31d` | `c6e60c83dcbb46bb51e30955f71041e51586916464ec44c09f508f814edca821` |
| Telemetry | `573e33e4cb8cf64bbb153f4753c0803b8f47851accbefe45941c0745b023a59b` | `52057a35893baf282e16f74b0fa8e911a6ce000621eebcec0007459b493281f9` |

The working-tree package's runtime, declarations, snippets, and metadata remain
byte-identical to the repaired default candidate, and the PWA runtime remains
aligned. The subsequent README refresh produced a different documentation-only
`npm pack` archive: 723,944 bytes, SHA-256
`245ca331325ef61d51b86a14c3d8074efa630fba3b0bb3fce5ab9508a3037d2e`.
Comparison of all 16 archive members against the immutable `ea561585…` candidate
found only `README.md` and `pkg/README.md` changed. That new archive was not
itself rerun through browser qualification; the retained candidate and hashes
above remain the authority for the recorded tests. This is runtime-byte
identity, not whole-archive equality.

Earlier ARM64-laptop browser failures remain recorded; the owner
identified other concurrent Playwright automations as the contention source.
The earlier VM run B abort remains unexplained. Verified evidence custody and
zero-survivor VM cleanup are recorded separately from workload qualification.

## Standalone export portability

The final repair addresses the original Apple SQLite refusal to open a
standalone WAL-format export with `mode=ro`. Export calls the real
`sqlite3_wal_checkpoint_v2` with `SQLITE_CHECKPOINT_PASSIVE` for `main`, checks
both the return code and complete WAL frame counts, then reuses the existing
locked reload/sync/export path. Only the returned owned snapshot's file-format
bytes 18 and 19 become rollback-journal format; the live WAL is unchanged.
Incomplete or refused checkpoints reject. The three added real IndexedDB,
Hybrid, and OPFS cases cover refusal, explicit transaction rollback, native
read-only consumption with exact embedded-NUL content, and a subsequent write.
They extend the earlier 32-case matrix to the current 35 cases.

## Exact values and statement results

The optimized baseline had three distinct SQLite-boundary defects:

| Boundary | Actual failure | Repair |
| --- | --- | --- |
| Parameter binding | Text parameters removed every embedded NUL before reaching SQLite. Native SQLite readback proved the bytes were missing on disk. | `sqlite3_bind_text64` and `sqlite3_bind_blob64` receive explicit byte lengths and `SQLITE_TRANSIENT`; input bytes are not sanitized. |
| Result reading | `CStr` stopped text at its first NUL. The non-SELECT reader also discarded BLOB and REAL values. | All rows use one typed reader, with `sqlite3_column_text` plus `sqlite3_column_bytes`. Invalid UTF-8 in SQLite TEXT rejects explicitly rather than replacing bytes. BLOB remains the arbitrary-byte type. |
| Statement execution | The parameterized path treated only a `SELECT` prefix as row-producing, rejecting RETURNING/CTEs/VALUES/PRAGMAs. A read after a write could inherit stale `affectedRows`. Error text could be collected after finalization reset it. | SQLite's column count and ROW/DONE step results drive collection. SQLite authorizer/read-only/EXPLAIN metadata identify writes; changes are reported only when the statement changed data. Errors are captured before RAII finalization. |

Normal and parameterized execution share the statement implementation and
telemetry path. INSERT/UPDATE/DELETE RETURNING, commented SELECT, CTE SELECT and
DML, VALUES, PRAGMA, empty results, constraint failures followed by successful
queries, trigger side effects, rollback, empty TEXT/BLOB, and NULL are exercised
through real optimized browser packages. Tests compare whole text, typed values,
binary payloads, and native SQLite files, not just expected hex strings.

`lastInsertId` follows SQLite's connection-local `last_insert_rowid` for INSERT
statements; it is not an affected-row count or a guarantee that an ignored
INSERT added a row. Non-INSERT results do not inherit an earlier insert ID.

The existing **first prepared statement** behavior is preserved. These APIs are
not newly promoted to batch execution: issue separate calls for separate
statements, with explicit BEGIN/COMMIT/ROLLBACK when a transaction is required.

## Async ownership and lint

The six RefCell-across-await diagnostics were around leader-election operations
whose actual browser work is synchronous localStorage/BroadcastChannel access.
The implementation now exposes synchronous internal operations while retaining
the public asynchronous methods. It does not take the manager out of its owner
across a suspension, discard lease/generation state, or replace coordination with
a retry loop. Concurrent main-thread and worker scenarios were established before
the refactor and rerun afterward, including heartbeat ticks after shutdown and
shared-handle reopen.

WASM-only `Arc<RefCell<...>>` dirty-block ownership became `Rc`; native threaded
ownership remains `Arc<Mutex<...>>`. Mechanical compiler suggestions addressed the
remaining lint findings. The original 40 diagnostics were **not 40 demonstrated
runtime bugs**. Strict WASM library Clippy and the native CI feature-matrix Clippy
passed after this work, without adding warning suppressions. These gates were
rerun for the repaired final artifacts above; future runtime changes require
qualification of their own bytes.

Enabling optional WASM telemetry exposed additional compilation gaps in metrics
propagation, platform-specific test construction/cache access, and stats
serialization. These were fixed rather than disabling the feature. Native Rust
and public JavaScript signatures are unchanged. The WASM-only Rust
`BlockStorage::metrics(&self)` signature changes from `Option<&Metrics>` to
`Option<Metrics>`: the returned clone shares the same counter handles, not copied
counter values. This prevents an unguarded reference escaping a RefCell. A real
browser test obtains a handle before queries and observes later query/error
increments through that same handle.

The real enabled-feature test also exposed prepare-error instrumentation outside
the query boundary. Permission inspection, preparation, execution, and error
recording now share the instrumented boundary. Successful parameterized DML does
not increment `errors_total`; real prepare and UNIQUE failures do. Runtime checks
cover query/error/sync counters, finite durations, typed values, serialized stats,
and exact span bytes received by an actual loopback HTTP collector. A collector
that parsed and reserialized JSON changed `1.0` to `1`; retaining the wire body
fixed that harness comparison, not a product data defect.

## Real storage failures and crash boundaries

**OPFS quota RED:** a persistent, isolated Chromium profile had a native origin
quota of 65,536 bytes, confirmed through the browser's quota manager. An actual
SQLite random BLOB write followed by sync caused
`FileSystemSyncAccessHandle.write` to throw `QuotaExceededError`. The uncaught
FFI exception left the library's exported promise unsettled. The consuming app
observed physical-worker loss, not a handled database error.

The OPFS read/write/flush/size/truncate bindings now catch browser exceptions.
The existing handle lifecycle is shared by all operations: close is awaited on
both success and failure, and a close failure is surfaced without hiding the
original cause. Short writes reject instead of acknowledging truncated output.
The tests prove bounded rejection, immediate acquisition of another exclusive
handle, and explicit same-runtime resync after quota relief **without replaying
the mutation**. SHA-256 verifies the original pending payload after a complete
browser restart. Terminating before successful resync instead preserves the last
acknowledged IndexedDB recovery copy.

**IndexedDB refusal RED:** a real incompatible object-store key path caused
`put(value, key)` to throw. Those request-creation errors were discarded, so an
empty transaction completed and sync falsely acknowledged. The write and
namespace-deletion paths now share an event-driven transaction executor:
handlers are installed before requests; synchronous request failures abort;
request/abort causes propagate; connections close; only `oncomplete` acknowledges.
Mutex/queue behavior and the metadata/checksum/commit-marker formats are retained.

The late-metadata hardening case starts with real native SQLite bytes and valid
committed CRC32 metadata. An incompatible unique-generation index causes a real
metadata request failure after valid block writes have been queued. The entire
transaction rolls back: every persisted block byte still matches the baseline,
and native SQLite integrity and rows remain exact. Subsequent aborted-request
events initially replaced the initiating ConstraintError with AbortError. The
executor now preserves the first cause, retains DOM exception identity, and does
not retry permanent constraint/data/version failures.

**Reopen RED:** after a real version-only upgrade of the shared IndexedDB
database, fresh IndexedDB and Hybrid constructors reported success despite the
authoritative VersionError. This proves false-successful open, not persisted
data loss; baseline records remained unchanged. Restoration now propagates
errors. Hybrid establishes authoritative metadata access before installing OPFS
state, preserving the legitimate absent-metadata OPFS path and validated
checksum fallback. Three attempts in the same WASM instance reject with the same
VersionError while all persisted SQLite bytes remain unchanged.

Blocked upgrades reject explicitly; late upgrade events are aborted and late
connections closed. Initialization and SQLite-open reservations use scoped
cleanup, and only the constructing call's pending connection reference is
released on failure. This is not a purge of a live same-name owner, another
generation, or prefix-neighbor caches. Existing registered ownership still uses
the normal fast path. Real blocked-open/retry and corrupt-SQLite
delete/recreate scenarios verify cleanup without extending deadlines.

The Chromium quota override did **not** enforce the requested quota against
IndexedDB in this environment: real usage grew beyond it and writes committed.
That observation is not an IndexedDB library defect and is not credited as a
quota-refusal test. The real schema refusal covers an independently demonstrated
IndexedDB error boundary.

The crash matrix does not relabel edited mirrors as crashes:

- Before IndexedDB commit, a separate real readwrite transaction holds its stores
  while the worker physically updates OPFS. The owned worker is terminated before
  acknowledgement; a new browser process recovers the old acknowledged rows.
- After IndexedDB commit, a real Web Lock delays the test worker's response
  delivery. A separate transaction observes the advanced commit marker, then the
  worker is terminated without delivering its response. Reopen preserves the new
  committed rows.

The response-delivery barrier exists only in the test worker. No mock storage,
synthesized storage exception, test-only production switch, or origin-wide purge
is used. OPFS, IndexedDB, and localStorage do not form one atomic transaction;
an error can follow partial work and must never be interpreted as successful
erasure or permission to replace uncertain data with an empty database.

## Buffer characterization and bounds

Real native SQLite fixtures contain incompressible payloads of 1, 8, and 32 MiB.
The library imports and exports them in both IndexedDB and Hybrid contexts, then
reopens in another complete browser process. Browser-generated downloads are
queried by native SQLite, including `integrity_check`, exact payload SHA-256, and
whole-file hashes after explicit normalization to the normal WAL runtime mode.
Without that normalization, six header bytes changed at reopen (journal mode,
change counters, and SQLite writer version); payload hashes and integrity were
already correct. That was not payload corruption.

Measurement is **WASM linear-memory allocation at stage boundaries**, not JS heap,
RSS, total native process peak, or a supported database-size ceiling. Linear
memory retains its high-water allocation even after objects are released.

For the 32 MiB fixture, removing redundant persistence clones reduced the
post-import linear allocation from 206,307,328 to 138,084,352 bytes in both tested
backends. The imported run's later high-water was 171,704,320 bytes. Reopen plus a
full-payload query still reached 242,745,344 bytes (231.5 MiB) of allocated linear memory;
the work does not claim that all memory amplification was removed.

The persistence helpers borrow immutable buffers across their existing attempts
instead of cloning the entire database for each layer. Export retains one
temporary block, validates address-size conversion, uses fallible reservation,
and rejects short blocks. The existing export-size policy remains; no new ceiling
is inferred from these measurements. Browser/OS termination under extreme memory
pressure cannot be guaranteed recoverable by Rust allocation error handling.
The current WAL buffer has its existing 16 MiB bound; a real large DML refusal
test verifies rollback, subsequent successful operations, and restart integrity.
That bound is not a database/import size ceiling. The export `None` setting uses
the implementation's existing default size policy; it is not evidence of
unlimited safe memory.

## Reproducing the qualification gates

Commands for the checked-in real suites:

```text
npm run test:stabilization
npm run test:deletion
cargo fmt --all -- --check
cargo clippy --target wasm32-unknown-unknown --lib -- -D warnings
cargo clippy --target wasm32-unknown-unknown --lib --features telemetry -- -D warnings
cargo clippy --all-targets --features telemetry,fs_persist -- -D warnings
cargo test
```

`PYTHON` selects the native SQLite oracle executable; `RESOURCE_SIZES_MIB` selects
the characterization inputs. Both are test configuration, not production paths.
Existing `export_config_test` cases exercise the configured export-size failure
and successful export paths in a real browser.

## Historical pre-portability candidate results (2026-09-21)

The earlier immutable default and telemetry packages each passed the **32-case**
stabilization matrix and **13-case** physical-deletion suite, with zero retries
or skipped cases. The exact default source/package also passes all **79**
existing browser/CLI cases, including the opt-in benchmark sweep. Native Rust
passes **214** tests, with the one existing ignored documentation example
explicitly retained in the report. Formatting and strict default-WASM,
telemetry-WASM, and native CI-feature Clippy pass.

The complete default WASM sweep executes **298** tests with zero failures,
ignored cases, or filtered cases across 78 test-bearing binaries. Its other 57
Cargo artifacts contain no tests for that target/feature combination. Enabled
telemetry/export-bound qualification executes **16** real browser tests across
four binaries, including actual HTTP collection and shared-handle observation.

Native release build passes. Both standard `-Oz` WASM variants were rebuilt after
regression and reproduce their immutable candidate bytes. Independent source
reviews reported no significant issues through the frozen runtime snapshot
`dad352949c595058bac96b74f22d4e663e0e867cda7e3489aff57ec0c9a25bd5`.
The final test-only adjustment handles an OPFS File snapshot becoming
`NotReadableError` while the real writer changes it: the existing observation
poll waits for a readable snapshot, with the same deadline and data assertions.
It is not a production retry or a storage failure.

See [the frozen pre-portability qualification record](SQLITE_STABILIZATION_QUALIFICATION.json)
for those earlier package/WASM hashes, commands, scope, and limitations. It is
not rewritten to assign the later 35-case results to older bytes. Later parent
application results are version-scoped downstream evidence, not substitutes for
these upstream gates. These are unpublished candidates; merging, committing,
pushing, releasing, and npm publication are separate actions. The current
commit/push/PR request is not authorization for a version bump, tag, CI dispatch,
or registry publication.

Host contention caused
startup/shutdown timing failures during earlier native runs; the owner identified
these as contention, not storage REDs. No production deadline was increased.
These distinctions, exact artifact hashes, and any still-failing gate belong in
the PR narrative. This evidence record itself does not publish a package.

Runner failures remain separate evidence. An initial container without an init
reaper accumulated zombies and exhausted its unchanged 2,048 PID budget. Its
filesystem, caches, and diagnostics were preserved; the replacement uses an
init reaper with identical CPU/memory/PID/shared-memory limits. The complete gate
was rerun, not resumed as if interrupted tests passed. Two unconfigured browser
tests initially ran under Node; the full corrected sweep explicitly selects
browser mode. Example-app tests also now wait for actual initialization rather
than an early badge/wrapper placeholder. None of these harness corrections
weakens the storage assertions.
