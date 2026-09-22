# SQLite Storage Backend Benchmark

Compare the performance of different SQLite-in-browser implementations.

**Measurement scope:** The dated tables below are historical runs, not fresh
measurements of the September 2026 repaired candidate. The current 79-case
browser qualification includes the opt-in durable sweep, but passing it does
not assign new timing results to an old table. See
[Native qualification](NATIVE_QUALIFICATION.md) for exact runtime identities and
[Self-hosted CI](SELF_HOSTED_CI.md) for the owner-admitted workflow.

## Implementations Compared

1. **AbsurderSQL IndexedDB** - Rust/WASM SQLite with an explicit IndexedDB backend on the main thread
2. **AbsurderSQL Hybrid** - Rust/WASM SQLite in a Worker, using OPFS blocks plus
   an IndexedDB block/metadata recovery copy
3. **absurd-sql** - James Long's JavaScript SQLite implementation
4. **Raw IndexedDB** - Direct IndexedDB API usage (baseline)

## Recorded Local Measurements (Historical)

### Durable Backend Sweep (2026-07-25)

Captured with system Chrome `150.0.7871.184` on Windows ARM64 using `BENCHMARK_SWEEP=1`, a 100-byte row payload, batches of up to 100 rows, and explicit `sync()` after each write phase:

| Rows | Backend | Insert | Read | Update | Delete |
|------|---------|--------|------|--------|--------|
| 100 | IndexedDB | 30.5ms | 4.3ms | 12.2ms | 12.6ms |
| 100 | Hybrid | 37.1ms | 3.4ms | 32.7ms | 23.8ms |
| 1,000 | IndexedDB | 89.6ms | 12.2ms | 30.6ms | 21.9ms |
| 1,000 | Hybrid | 152.7ms | 8.3ms | 67.2ms | 55.9ms |
| 10,000 | IndexedDB | 711.1ms | 47.0ms | 225.9ms | 122.3ms |
| 10,000 | Hybrid | 1.07s | 47.9ms | 432.4ms | 378.7ms |

This run validates both durable paths at the planned workload sizes; it is not
a universal performance claim. Hybrid used a dedicated worker with OPFS and an
IndexedDB recovery mirror.

### Four-Way Comparison (2026-04-07)

Captured on 2026-04-07 from the benchmark page using Playwright on this machine with:
- `1000` rows
- `100` batch size
- `100` byte row payload
- `PRAGMA journal_mode=MEMORY`
- explicit `sync()` included in the AbsurderSQL IndexedDB and Hybrid write timings

| Implementation | Insert | Read | Update | Delete |
|---------------|--------|------|--------|--------|
| AbsurderSQL IndexedDB | 160.0ms | 39.4ms | 68.4ms | 48.1ms |
| AbsurderSQL Hybrid | 178.7ms | 26.0ms | 100.2ms | 54.5ms |
| absurd-sql | 70.4ms | 23.3ms | 19.8ms | 9.0ms |
| Raw IndexedDB | 42.8ms | 7.1ms | 28.8ms | 22.5ms |

### Notes

- This run is machine- and browser-specific; treat it as a dated reference, not a universal claim.
- Hybrid improved AbsurderSQL read latency versus explicit IndexedDB in this run, but it did not win the write-heavy operations.
- Because AbsurderSQL write timings now include `sync()`, these numbers reflect durable backend persistence rather than only SQLite's in-memory execution time.

## Legacy Results

The table below preserves an earlier undated IndexedDB-only benchmark run before
explicit IndexedDB and Hybrid variants were added. Its durable-sync scope was
not established in this record; it must not be compared as equivalent durable
work or used to characterize the current candidate.

| Implementation | Insert | Read | Update | Delete |
|---------------|--------|------|--------|--------|
| **AbsurderSQL IndexedDB** 🏆 | **3.2ms** | **1.2ms** | **400μs** | **400μs** |
| absurd-sql | 3.8ms | 2.1ms | 800μs | 700μs |
| Raw IndexedDB | 24.1ms | 1.4ms | 14.1ms | 6.3ms |

### Claims Recorded with the Legacy Run (Not Current Qualification)

- **[✓]** **16% faster INSERT** than absurd-sql (3.2ms vs 3.8ms)
- **[✓]** **43% faster READ** than absurd-sql (1.2ms vs 2.1ms)
- **[✓]** **50% faster UPDATE** than absurd-sql (400μs vs 800μs)
- **[✓]** **43% faster DELETE** than absurd-sql (400μs vs 700μs)
- **[✓]** **7.5x faster INSERT** than raw IndexedDB
- **[✓]** **Zero console logging overhead** in release builds
- **[✓]** **PRAGMA journal_mode=MEMORY** working correctly

## Running the Benchmark

1. Build the WASM module:
```bash
wasm-pack build --target web
```

2. Start a local server:
```bash
python3 -m http.server 8080
```

3. Open in browser:
```
http://localhost:8080/examples/benchmark.html
```

The page now compares:
- AbsurderSQL IndexedDB via `Database.newDatabaseWithBackend(..., 'IndexedDB')`
- AbsurderSQL Hybrid via a dedicated Worker using `Database.newDatabaseWithBackend(..., 'Hybrid')`
- absurd-sql in its existing Worker harness
- Raw IndexedDB

AbsurderSQL write timings now include an explicit `sync()` so the benchmark captures durable backend persistence rather than only SQLite's in-memory work.

There is also a browser smoke test for the page in `tests/e2e/benchmark-page.spec.js` which runs the real benchmark page with smaller inputs and verifies that the explicit IndexedDB and Hybrid variants both complete.

The same spec contains the formal durable workload sweep at 100, 1,000, and 10,000 rows. It is opt-in locally because the 10,000-row case is intentionally slower:

```bash
BENCHMARK_SWEEP=1 npx playwright test tests/e2e/benchmark-page.spec.js --reporter=line
```

The benchmark honors the configured batch size for both AbsurderSQL backends and
calls `sync()` after each write phase. The qualification script enables the sweep
and prints a `BENCHMARK_SWEEP_RESULTS` JSON record; do not treat those
machine-specific timings as a universal performance claim. Configuring that
script is not evidence of a GitHub-scheduled run.

## Benchmark Tests

### 1. INSERT Performance
- Batch inserts of configurable row count
- Measures time to insert N rows in batches
- Tests write throughput and transaction overhead

### 2. READ Performance
- Full table scan (SELECT *)
- Measures query execution and data retrieval speed
- Tests read throughput

### 3. UPDATE Performance
- Updates 50% of rows
- Measures modification speed
- Tests write performance on existing data

### 4. DELETE Performance
- Deletes 25% of rows
- Measures deletion speed
- Tests cleanup performance

## Configuration Options

- **Number of Rows**: Total rows to insert (100-100,000)
- **Batch Size**: Rows per transaction (1-1,000)
- **Row Size**: Data size per row in bytes (10-10,000)

## Expected Results

### AbsurderSQL Advantages
- **[✓]** Full SQL support (joins, indexes, transactions)
- **[✓]** SQLite transactions with a separately awaited backend durability boundary
- **[✓]** Restart persistence after successful sync (subject to browser storage retention)
- **[✓]** Multi-tab coordination (leader election, write queuing, optimistic updates, metrics)
- **[✓]** Block-level storage with checksums

### Raw IndexedDB Advantages
- **[✓]** Lower overhead (no SQL parsing)
- **[✓]** Direct key-value access
- **[✓]** Simpler API for basic operations

### Trade-offs
- **AbsurderSQL**: Higher overhead for simple operations, but better for complex queries
- **Raw IndexedDB**: Faster for simple CRUD, but no SQL capabilities

## Interpreting Results

- **Green highlighting**: Winner for that metric
- **🏆 Badge**: Overall best performer
- **Time format**: Automatically scales (μs, ms, s)

## Comparison with absurd-sql

absurd-sql is an excellent project by James Long that pioneered SQLite-in-IndexedDB. Here's a detailed comparison:

### Similarities

Both projects share these core concepts:
- **[✓]** **IndexedDB Backend**: Use IndexedDB as persistent storage
- **[✓]** **Block/Page Storage**: Store data in chunks, not as a single file
- **[✓]** **SQLite in Browser**: Full SQLite functionality in the browser
- **[✓]** **Persistence**: Data survives page refreshes
- Performance depends on workload and measured durability scope; the historical
  durable tables above do not show a universal win over direct IndexedDB

### Architecture Differences

| Feature | **absurd-sql** | **AbsurderSQL** |
|---------|----------------|--------------|
| **SQLite Engine** | sql.js (Emscripten-compiled) | sqlite-wasm-rs (Direct C API) |
| **Language** | JavaScript | Rust/WASM |
| **Storage Unit** | SQLite pages (configurable, suggested 8KB) | Fixed 4KB blocks |
| **Worker Requirement** | Optional (SAB mode needs Worker) | Can run on main thread |
| **SharedArrayBuffer** | Optional (faster with SAB, has fallback) | Not used |
| **CORS Headers** | Optional (only for SAB mode) | Not required |

### Multi-Tab Coordination

| Feature | **absurd-sql** | **AbsurderSQL** |
|---------|----------------|--------------|
| **Primary Mode** | SharedArrayBuffer + Atomics (if available) | localStorage-based leader election |
| **Fallback Mode** | FileOpsFallback (works everywhere) | Same coordination mechanism |
| **Multi-Tab Writes** | Throws error if multiple tabs write | Coordinated with write queuing |
| **Leadership** | No concept of leader | Automatic leader election |
| **Write from Follower** | Not supported (errors) | Supported via `queueWrite()` |
| **Cross-Tab Sync** | Limited in fallback mode | BroadcastChannel refresh signals; followers reload persisted state |

### Technical Implementation

**absurd-sql:**
- Uses sql.js VFS API to intercept file operations
- Two modes: SAB mode (Worker + SharedArrayBuffer) or FileOpsFallback
- SAB mode provides synchronous cross-thread communication
- Fallback mode works without Worker/SAB but has limitations
- Reads SQLite page size from database header
- Fallback mode has "one writer at a time" limitation

**AbsurderSQL:**
- Custom IndexedDB VFS implementation in Rust
- localStorage and BroadcastChannel coordinate a leader; the protocol is not
  an atomic cross-tab compare-and-swap or a cross-worker ownership lock
- Can run on main thread (though worker recommended)
- Fixed block size with checksums and versioning
- MVCC-style block metadata with commit markers
- Full multi-tab write coordination with leader election

### Performance Characteristics

**absurd-sql Strengths:**
- SAB mode enables synchronous operations (when available)
- Fallback mode works everywhere without special headers
- Optimized for worker-based architecture when using SAB
- Page-level granularity matches SQLite internals

**AbsurderSQL Strengths:**
- No worker/headers requirement (easier deployment)
- Block-level checksums for data integrity
- LRU block cache
- Coordinated main-thread data writes, with explicit failure handling
- Separate PWA coordinator for the worker-owned Hybrid runtime

## Performance Tips

1. **Increase batch size** for better insert performance
2. **Use transactions** to group operations
3. **Create indexes** for frequently queried columns
4. **Monitor IndexedDB size** in DevTools

## Known Limitations

- First run may be slower (WASM compilation)
- Browser throttling affects results
- IndexedDB quota limits apply
- Once dependencies load, the timed storage work is local

## Related Documentation

- [Main README](../README.md) - Project overview and features
- [Multi-Tab Coordination Guide](MULTI_TAB_GUIDE.md) - Complete guide with advanced features
- [Transaction Support](TRANSACTION_SUPPORT.md) - Transaction handling details
- [Demo Guide](../examples/DEMO_GUIDE.md) - Interactive demo instructions
- [Vite App Example](../examples/vite-app/README.md) - Production-ready multi-tab application
