# SQLite IndexedDB Performance Benchmark

Compare the performance of different SQLite-in-browser implementations.

## Implementations Compared

1. **DataSync** (This library) - Rust/WASM SQLite with custom IndexedDB VFS backend 🏆
2. **absurd-sql** - James Long's JavaScript SQLite implementation
3. **Raw IndexedDB** - Direct IndexedDB API usage (baseline)

## Latest Results

| Implementation | Insert | Read | Update | Delete |
|---------------|--------|------|--------|--------|
| **DataSync** 🏆 | **3.2ms** | **1.2ms** | **400μs** | **400μs** |
| absurd-sql | 3.8ms | 2.1ms | 800μs | 700μs |
| Raw IndexedDB | 24.1ms | 1.4ms | 14.1ms | 6.3ms |

### Key Achievements

- ✅ **16% faster INSERT** than absurd-sql (3.2ms vs 3.8ms)
- ✅ **43% faster READ** than absurd-sql (1.2ms vs 2.1ms)
- ✅ **50% faster UPDATE** than absurd-sql (400μs vs 800μs)
- ✅ **43% faster DELETE** than absurd-sql (400μs vs 700μs)
- ✅ **7.5x faster INSERT** than raw IndexedDB
- ✅ **Zero console logging overhead** in release builds
- ✅ **PRAGMA journal_mode=MEMORY** working correctly

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

### DataSync Advantages
- ✅ Full SQL support (joins, indexes, transactions)
- ✅ ACID compliance
- ✅ Persistent across page reloads
- ✅ Multi-tab coordination (leader election, write queuing, optimistic updates, metrics)
- ✅ Block-level storage with checksums

### Raw IndexedDB Advantages
- ✅ Lower overhead (no SQL parsing)
- ✅ Direct key-value access
- ✅ Simpler API for basic operations

### Trade-offs
- **DataSync**: Higher overhead for simple operations, but better for complex queries
- **Raw IndexedDB**: Faster for simple CRUD, but no SQL capabilities

## Interpreting Results

- **Green highlighting**: Winner for that metric
- **🏆 Badge**: Overall best performer
- **Time format**: Automatically scales (μs, ms, s)

## Comparison with absurd-sql

absurd-sql is an excellent project by James Long that pioneered SQLite-in-IndexedDB. Here's a detailed comparison:

### Similarities

Both projects share these core concepts:
- ✅ **IndexedDB Backend**: Use IndexedDB as persistent storage
- ✅ **Block/Page Storage**: Store data in chunks, not as a single file
- ✅ **SQLite in Browser**: Full SQLite functionality in the browser
- ✅ **Persistence**: Data survives page refreshes
- ✅ **Better than Raw IndexedDB**: Significant performance improvements over direct IndexedDB usage

### Architecture Differences

| Feature | **absurd-sql** | **DataSync** |
|---------|----------------|--------------|
| **SQLite Engine** | sql.js (Emscripten-compiled) | sqlite-wasm-rs (Direct C API) |
| **Language** | JavaScript | Rust/WASM |
| **Storage Unit** | SQLite pages (configurable, suggested 8KB) | Fixed 4KB blocks |
| **Worker Requirement** | **MUST** run in Web Worker | Can run on main thread |
| **SharedArrayBuffer** | Required (with fallback mode) | Not required |
| **CORS Headers** | Required (`COEP`, `COOP`) | Not required |

### Multi-Tab Coordination

| Feature | **absurd-sql** | **DataSync** |
|---------|----------------|--------------|
| **Primary Mode** | SharedArrayBuffer + Atomics | localStorage-based leader election |
| **Fallback Mode** | FileOpsFallback (Safari) | Same coordination mechanism |
| **Multi-Tab Writes** | Throws error if multiple tabs write | Coordinated with write queuing |
| **Leadership** | No concept of leader | Automatic leader election |
| **Write from Follower** | Not supported (errors) | Supported via `queueWrite()` |
| **Cross-Tab Sync** | Limited in fallback mode | Full BroadcastChannel coordination |

### Technical Implementation

**absurd-sql:**
- Uses sql.js VFS API to intercept file operations
- SharedArrayBuffer provides synchronous cross-thread communication
- Worker-based architecture (mandatory)
- Reads SQLite page size from database header
- Fallback mode has "one writer at a time" limitation

**DataSync:**
- Custom IndexedDB VFS implementation in Rust
- localStorage provides atomic coordination primitives
- Can run on main thread (though worker recommended)
- Fixed block size with checksums and versioning
- MVCC-style block metadata with commit markers
- Full multi-tab write coordination with leader election

### Performance Characteristics

**absurd-sql Strengths:**
- SharedArrayBuffer enables synchronous operations
- Optimized for worker-based architecture
- Page-level granularity matches SQLite internals

**DataSync Strengths:**
- No worker/headers requirement (easier deployment)
- Block-level checksums for data integrity
- LRU cache (128 blocks default)
- Coordinated multi-tab writes (no errors)
- Production-ready multi-tab coordination

## Performance Tips

1. **Increase batch size** for better insert performance
2. **Use transactions** to group operations
3. **Create indexes** for frequently queried columns
4. **Monitor IndexedDB size** in DevTools

## Known Limitations

- First run may be slower (WASM compilation)
- Browser throttling affects results
- IndexedDB quota limits apply
- Network conditions don't affect local benchmarks

## 📚 Related Documentation

- [Main README](../README.md) - Project overview and features
- [Multi-Tab Coordination Guide](MULTI_TAB_GUIDE.md) - Complete guide with Phase 5 features
- [Transaction Support](TRANSACTION_SUPPORT.md) - Transaction handling details
- [Demo Guide](../examples/DEMO_GUIDE.md) - Interactive demo instructions
- [Vite App Example](../examples/vite-app/README.md) - Production-ready multi-tab application
