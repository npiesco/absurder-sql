# DataSync: Building a Superior AbsurdSQL Alternative

## Project Vision
Create a **better, faster, more efficient** SQLite WASM implementation than AbsurdSQL using Rust, with superior architecture, performance optimizations, and modern tooling.

## Current Status: Foundation Complete 
- [x] Basic SQLite WASM integration working
- [x] IndexedDB persistence layer functional  
- [x] 62 Rust tests passing
- [x] TypeScript bindings generated
- [x] Browser demo operational

## Recent Progress (2025-08-17)
- [x] Implemented batch block read/write APIs in `BlockStorage` (`read_blocks`, `write_blocks`) with full LRU/dirty semantics and tests.
- [x] Implemented block checksum metadata and read-time verification in `BlockStorage` (computed on write, verified on read, removed on deallocate) with tests.
- [x] Implemented AutoSync with `SyncPolicy` (interval, max_dirty, max_dirty_bytes, debounce). Native path now uses Tokio-based interval + debounce tasks when a runtime is present (falls back to std::thread otherwise), with clean shutdown via `drain_and_shutdown()` and `Drop`.
- [x] Implemented granular observability metrics in `BlockStorage`: total `sync_count`, separate `timer_sync_count` and `debounce_sync_count`, and `last_sync_duration_ms` with getters. Added tests covering these metrics. All passing.
- [x] Added Tokio as a native dependency and hardened interval test determinism. Wrote Tokio-based tests for: interval time advance flush; threshold immediate flush without debounce; debounce-after-idle flush. All passing.
- [x] Added `verify_after_write` pre-write checksum verification in `write_block_sync()` with targeted tests (success + mismatch) now passing.
- [x] Full native `cargo test` suite green.
- [x] Added test-only getter `get_block_metadata_for_testing()` to inspect persisted `(checksum, version, last_modified_ms)` in native tests.
- [x] Added native tests validating version increment and `last_modified_ms` progression across syncs and across instances.
- [x] Added test ensuring sync without new writes does not bump version or timestamp.
- [x] Ensured metadata removal on deallocate is persisted and visible across instances.
- [x] Decided semantics: same-data writes still bump `version` and `last_modified_ms` upon sync for dirty blocks.
- [x] Added tests: batch write only updates metadata for touched blocks; untouched blocks remain unchanged.

## Recent Progress (2025-08-18)
- [x] Fixed native `fs_persist` read semantics to be metadata/tombstone-driven (no gating on `allocated_blocks`). Reads only error on explicit tombstones; otherwise read block file when present or zeroed data if missing. Resolved native checksum mismatch after restart.
- [x] Full test suite green in both default and `fs_persist` configurations.
- [x] Stabilized native tests to avoid env var races (serialized execution where applicable).

- [x] Added TempDir-based `DATASYNC_FS_BASE` isolation and `#[serial]` across auto-sync, metadata, and integrity native tests to prevent cross-test interference.
- [x] Ensured cross-instance tests reuse a single TempDir per test to preserve persistence semantics, then re-ran suites in default and with `fs_persist` — all passing.
- [x] Updated `fs_persist` prune semantics: during sync, do not prune `metadata.json` entries based on the allocated set; use metadata entries to decide which `block_*.bin` files to keep. Preserves version/timestamp history for written blocks.

## Recent Progress (2025-08-19)
- [x] Implemented auto-sync shutdown tests validating `drain_and_shutdown()` idempotency and that all background workers (timer/debounce) stop; no further background flushes occur after shutdown. Green in both default and with `fs_persist`.
- [x] Documented shutdown semantics in code: final `sync_now()`, disable interval, signal `auto_sync_stop`, join threads, abort Tokio tasks, and reset `threshold_hit`. Safe to call multiple times.

## Recent Progress (2025-08-20)
- [x] Implemented checksum algorithm selection (FastHash/CRC32) with per-block algorithm metadata persistence in `fs_persist` mode.
- [x] Added environment variable `DATASYNC_CHECKSUM_ALGO` to control default algorithm selection.
- [x] Enhanced checksum verification to detect algorithm mismatches and return distinct `ALGO_MISMATCH` error.
- [x] Implemented tolerant JSON parsing for metadata normalization during sync and deallocation operations.
- [x] Fixed failing checksum algorithm test by ensuring explicit block allocation before write/deallocate operations.
- [x] Verified all checksum algorithm tests pass with `fs_persist` enabled and full test suite passes in both configurations.

## Next Steps (Actionable TDD Roadmap)
1. Auto Sync Manager (native first)
   - [x] Introduce `SyncPolicy` (interval_ms, max_dirty, max_bytes, debounce_ms; `verify_after_write` flag present)
   - [x] Add `enable_auto_sync_with_policy()` (kept `enable_auto_sync(u64)` for simple interval) and kept `disable_auto_sync()`
   - [x] Implement Tokio-based interval + debounce background tasks honoring thresholds/debounce, with std::thread fallback when no Tokio runtime; clean shutdown
   - [ ] Optional: Extract dedicated `AutoSyncManager` abstraction separate from `BlockStorage`
   - [x] Add `drain_and_shutdown()`; call in `Drop` and use in tests
   - [x] Tests: timer-based flush; threshold-based flush (count/bytes); debounce behavior; Tokio interval determinism; threshold immediate flush w/o debounce; debounce-after-idle

2. Integrity & Metadata Persistence
   - [x] Persist per-block metadata (checksum value, last_modified, version) with blocks in native `fs_persist` path; checksum algorithm selection TBD
   - [x] Support fast checksum (FastHash/CRC32) with per-block algorithm metadata; store algorithm in metadata
   - [x] Read-time verification uses persisted checksum; optional `verify_after_write` supported
   - [x] Algorithm mismatch detection with distinct `ALGO_MISMATCH` error code
   - [ ] Startup recovery: verify sample or full set; report/repair
   - [x] Tests: persistence across new instance; mismatch detection (native path)
   - [x] Native test-only metadata persistence and verification implemented; WASM/production persistence pending
   - [x] Decided metadata semantics (tested):
     - Version increments and `last_modified_ms` updates on each sync for any dirty block, even if data is unchanged (same-data write).
     - Idle syncs (no dirty blocks) do not modify metadata.
     - Batch writes only affect metadata for blocks actually written; untouched blocks' metadata remains unchanged.

3. Crash Consistency & Atomic Batching
   - [ ] IndexedDB transaction writes {blocks + metadata} with commit marker
   - [ ] Recovery scans markers to finalize/rollback
   - [ ] Idempotent writes keyed by (block_id, version)
   - [ ] Tests: simulate crash mid-commit; recovery correctness

4. Multi-Tab Single-Writer
   - [ ] Leader election (BroadcastChannel + lease lock with expiry)
   - [ ] Non-leader tabs forward writes to leader
   - [ ] Tests: two instances; only leader flushes; leadership handover

5. Observability
  - [x] Metrics: `sync_count`, `timer_sync_count`, `debounce_sync_count`, `last_sync_duration_ms`
  - [ ] Additional metrics: dirty_count, dirty_bytes, throughput, error_rate, checksum_failures
  - [ ] Events/callbacks: on_sync_start/success/failure; backpressure signals

6. WASM AutoSync Manager
   - [ ] Worker-based/SharedWorker timer or requestIdleCallback mirroring native policy
   - [ ] Feature-gated until stable; parity tests in headless Chrome

7. VFS Durability Mapping
   - [ ] Map SQLite VFS `xSync` to `force_sync()` with durability guarantees; add tests

---

# Phase 1: Architecture & Performance Foundation

## 1.1 Block-Based Storage System (AbsurdSQL's Core Innovation)
- [ ] **Design block-based storage architecture**
  - [x] Review `src/vfs/indexeddb_vfs.rs` structure
  - [x] Identify file-based storage patterns to replace
  - [x] Map current storage operations to block operations

- [ ] **Design block-based storage system**
  - [x] Define 4KB block size standard (matching SQLite page size)
  - [x] Create block metadata structure (checksum, version, last_modified_ms)
  - [ ] Design block allocation bitmap/free list
  - [x] Plan block-level dirty tracking system

- [ ] **Implement BlockStorage trait**
  - [x] `read_block(block_id: u64) -> Result<Vec<u8>>`
  - [x] `write_block(block_id: u64, data: Vec<u8>) -> Result<()>`
  - [x] `allocate_block() -> Result<u64>`
  - [x] `deallocate_block(block_id: u64) -> Result<()>`
  - [x] `sync() -> Result<()>`

## Step 2: Enhanced IndexedDB Backend (Priority 1)
- [ ] **Replace file operations with block operations**
  - [ ] Update `src/storage/block_storage.rs` to use blocks
  - [x] Implement LRU cache for frequently accessed blocks
  - [x] Add batch operations for multiple block reads/writes
  - [ ] Create block compression (optional, for storage efficiency)

- [ ] **Optimize IndexedDB usage**
  - [ ] Use IndexedDB transactions for atomic block operations
  - [ ] Implement block prefetching based on access patterns
  - [x] Add block-level integrity checking (checksums)
  - [ ] Create background sync for dirty blocks
    - [x] Operation-triggered auto-sync on reads/writes via `maybe_auto_sync()`
    - [x] Timer-based auto-sync via std::thread fallback when no Tokio runtime (clears dirty set)
    - [x] Tokio-based interval + debounce tasks (native), honoring thresholds/debounce
    - [x] `SyncPolicy` API (interval/thresholds/debounce; `verify_after_write` flag present)
    - [x] `drain_and_shutdown()` and Drop integration
    - [x] Threshold triggers (dirty_count/bytes) and debounce
    - [x] Metrics for sync cycles: separate counts (timer/debounce) and last duration
    - [ ] Events/callbacks and extended metrics (dirty_count/bytes, throughput)

## Step 3: SharedArrayBuffer Integration (Priority 2)
- [ ] **Add SharedArrayBuffer support**
  - [ ] Detect SharedArrayBuffer availability
  - [ ] Implement SharedArrayBuffer-based block cache
  - [ ] Add Atomics API for thread-safe operations
  - [ ] Create fallback mode for Safari (without SharedArrayBuffer)

- [ ] **Implement CORS headers enforcement**
  - [ ] Add runtime checks for required headers
  - [ ] Provide clear error messages when headers missing
  - [ ] Create development server configuration examples

## Step 4: Worker Architecture (Priority 2)
- [ ] **Enforce worker-only execution**
  - [ ] Add runtime checks to prevent main thread usage
  - [ ] Create worker wrapper for database operations
  - [ ] Implement message passing optimization
  - [ ] Add worker lifecycle management

- [ ] **Create main thread proxy**
  - [ ] Design async message passing protocol
  - [ ] Implement command queuing and batching
  - [ ] Add error propagation from worker to main thread
  - [ ] Create TypeScript bindings for worker interface

## Step 5: Performance Benchmarking (Priority 3)
- [ ] **Create benchmark suite**
  - [ ] Implement benchmarks vs current implementation
  - [ ] Add benchmarks vs AbsurdSQL (when available)
  - [ ] Create real-world application scenarios
  - [ ] Add memory usage profiling

- [ ] **Establish performance baselines**
  - [ ] Measure current implementation performance
  - [ ] Set target performance goals (10x IndexedDB, 2x AbsurdSQL)
  - [ ] Create automated performance regression tests
  - [ ] Add performance monitoring dashboard

---

# Success Criteria for Phase 1

## Technical Milestones
- [ ] **Block-based storage working** - Database operations use 4KB blocks instead of files
- [ ] **10x performance improvement** - Faster than direct IndexedDB operations
- [ ] **All existing tests passing** - No regression in functionality
- [ ] **SharedArrayBuffer support** - Zero-copy operations when available
- [ ] **Worker enforcement** - Database only runs in Web Workers

## Performance Targets
- **Read operations**: Sub-10ms for cached blocks, sub-50ms for IndexedDB reads
- **Write operations**: Sub-5ms for cache writes, batched IndexedDB commits
- **Memory usage**: <50MB for typical applications, efficient garbage collection
- **Cold start**: <100ms database initialization time

## Developer Experience
- **Zero breaking changes** - Existing API remains compatible
- **Better error messages** - Clear guidance on CORS headers and worker setup
- **Performance insights** - Built-in timing and profiling information
- **Easy migration** - Drop-in replacement for current implementation

---

This plan transforms DataSync from a basic SQLite WASM wrapper into a **high-performance, production-ready database system** that surpasses AbsurdSQL's capabilities while maintaining the benefits of Rust's type safety and performance.

### Step 9: Build Configuration
**wasm-pack-build.sh:**
```bash
#!/bin/bash
set -e

echo "Building SQLite + IndexedDB WASM module..."

# Build with optimization
wasm-pack build \
    --target web \
    --out-dir pkg \
    --release \
    --typescript

# Optimize the WASM binary
if command -v wasm-opt &> /dev/null; then
    echo "Optimizing WASM binary..."
    wasm-opt pkg/sqlite_indexeddb_rs_bg.wasm -O3 -o pkg/sqlite_indexeddb_rs_bg.wasm
fi

echo "Build complete! Generated files:"
ls -la pkg/

echo "TypeScript definitions generated in pkg/sqlite_indexeddb_rs.d.ts"
```

### Step 10: Package Configuration
**package.json:**
```json
{
  "name": "sqlite-indexeddb-rs",
  "version": "0.1.0",
  "description": "SQLite with IndexedDB persistence, compiled from Rust 2024",
  "main": "pkg/sqlite_indexeddb_rs.js",
  "types": "pkg/sqlite_indexeddb_rs.d.ts",
  "files": [
    "pkg/"
  ],
  "scripts": {
    "build": "./wasm-pack-build.sh",
    "test": "wasm-pack test --chrome --headless",
    "dev": "wasm-pack build --dev && node examples/test.js",
    "docs": "cargo doc --target wasm32-unknown-unknown"
  },
  "keywords": [
    "sqlite",
    "webassembly", 
    "rust",
    "indexeddb",
    "database",
    "wasm",
    "typescript"
  ],
  "license": "MIT OR Apache-2.0",
  "engines": {
    "node": ">=18"
  }
}
```

## Phase 8: Testing & Usage

### Step 11: Integration Tests
**tests/integration/basic_operations.rs:**
```rust
use wasm_bindgen_test::*;
use sqlite_indexeddb_rs::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_database_creation() {
    let config = DatabaseConfig {
        name: "test_db".to_string(),
        version: Some(1),
        cache_size: Some(5000),
        page_size: Some(4096),
        auto_vacuum: Some(true),
    };

    let db = SQLiteDB::new(config).await.unwrap();
    
    // Test table creation
    let result = db.execute(
        "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE)".to_string()
    ).await.unwrap();
    
    assert_eq!(result.affected_rows, 0);
    assert!(result.execution_time_ms > 0.0);
}

#[wasm_bindgen_test]
async fn test_crud_operations() {
    let config = DatabaseConfig::default();
    let db = SQLiteDB::new(config).await.unwrap();
    
    // Create table
    db.execute("CREATE TABLE test_table (id INTEGER PRIMARY KEY, value TEXT)".to_string())
        .await.unwrap();
    
    // Insert data
    let insert_result = db.execute(
        "INSERT INTO test_table (value) VALUES ('Hello, Rust 2024!')".to_string()
    ).await.unwrap();
    
    assert_eq!(insert_result.affected_rows, 1);
    assert!(insert_result.last_insert_id.is_some());
    
    // Query data
    let select_result = db.execute("SELECT * FROM test_table".to_string()).await.unwrap();
    assert_eq!(select_result.rows.len(), 1);
    assert_eq!(select_result.columns, vec!["id", "value"]);
}
```

### Step 12: TypeScript Usage Example
**examples/web-demo/app.ts:**
```typescript
import init, { 
    SQLiteDB, 
    DatabaseConfig, 
    QueryResult, 
    TransactionOptions,
    IsolationLevel 
} from '../../pkg/sqlite_indexeddb_rs.js';

async function main() {
    // Initialize the WASM module
    await init();

    // Create database with full type safety
    const config: DatabaseConfig = {
        name: 'my_app_database',
        version: 1,
        cache_size: 10000,
        page_size: 4096,
        auto_vacuum: true
    };

    console.log('Creating database...');
    const db = new SQLiteDB(config);

    try {
        // Create tables
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // Insert test data with transactions
        const txOptions: TransactionOptions = {
            isolation_level: IsolationLevel.Serializable,
            timeout_ms: 5000
        };

        await db.begin_transaction(txOptions);

        try {
            const userResult: QueryResult = await db.execute(`
                INSERT INTO users (username, email) VALUES 
                ('alice', 'alice@example.com'),
                ('bob', 'bob@example.com')
            `);
            console.log(`Inserted ${userResult.affected_rows} users`);

            const postResult: QueryResult = await db.execute(`
                INSERT INTO posts (user_id, title, content) VALUES 
                (1, 'Hello World', 'This is my first post!'),
                (2, 'Rust + WASM is Amazing', 'Love the type safety and performance')
            `);
            console.log(`Inserted ${postResult.affected_rows} posts`);

            await db.commit();
            console.log('Transaction committed successfully');
        } catch (error) {
            await db.rollback();
            console.error('Transaction failed, rolled back:', error);
            throw error;
        }

        // Query with joins
        const joinResult: QueryResult = await db.execute(`
            SELECT u.username, u.email, p.title, p.content, p.created_at
            FROM users u
            JOIN posts p ON u.id = p.user_id
            ORDER BY p.created_at DESC
        `);

        console.log('Query results:');
        console.log(`Columns: ${joinResult.columns.join(', ')}`);
        console.log(`Execution time: ${joinResult.execution_time_ms.toFixed(2)}ms`);
        
        joinResult.rows.forEach((row, index) => {
            console.log(`Row ${index + 1}:`, row.values.map(v => {
                if (v.type === 'Text') return v.value;
                if (v.type === 'Integer') return v.value;
                if (v.type === 'Null') return null;
                return v.value;
            }));
        });

        // Test persistence - close and reopen
        await db.close();
        
        const db2 = new SQLiteDB(config);
        const persistenceTest: QueryResult = await db2.execute(
            'SELECT COUNT(*) as user_count FROM users'
        );
        
        const userCount = persistenceTest.rows[0].values;
        if (userCount.type === 'Integer' && userCount.value === 2) {
            console.log('✅ Data persistence verified!');
        } else {
            console.error('❌ Data persistence failed');
        }

    } catch (error) {
        console.error('Database operation failed:', error);
    }
}

// Run the demo
main().catch(console.error);
```

### Step 13: HTML Demo Page
**examples/web-demo/index.html:**
```html



    
    SQLite + IndexedDB Demo
    
        body { font-family: Arial, sans-serif; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .code { background: #f5f5f5; padding: 10px; border-radius: 4px; }
        .results { background: #e8f5e8; padding: 10px; border-radius: 4px; margin-top: 10px; }
        .error { background: #ffe8e8; padding: 10px; border-radius: 4px; margin-top: 10px; }
    


    
        SQLite + IndexedDB Demo (Rust 2024)
        This demo shows SQLite running in the browser with persistent storage via IndexedDB.
        
        Loading...
        
    

    
        import { main } from './app.js';
        
        document.getElementById('status').textContent = 'Initializing...';
        
        try {
            await main();
            document.getElementById('status').innerHTML = '✅ Demo completed successfully!';
        } catch (error) {
            document.getElementById('status').innerHTML = `❌ Error: ${error.message}`;
            console.error(error);
        }
    


```

## Phase 9: Final Build & Test

### Step 14: Build Everything
```bash
# Make build script executable
chmod +x wasm-pack-build.sh

# Build the WASM module
./wasm-pack-build.sh

# Run tests
wasm-pack test --chrome --headless

# Build TypeScript example
cd examples/web-demo
npx tsc app.ts --target es2020 --module es2020

# Serve locally for testing
python3 -m http.server 8000
# Navigate to http://localhost:8000/examples/web-demo/
```

## Generated TypeScript Definitions

After building, you'll automatically get **pkg/sqlite_indexeddb_rs.d.ts:**
```typescript
/* tslint:disable */
/* eslint-disable */

export interface DatabaseConfig {
  name: string;
  version?: number;
  cache_size?: number;
  page_size?: number;
  auto_vacuum?: boolean;
}

export interface QueryResult {
  columns: string[];
  rows: Row[];
  affected_rows: number;
  last_insert_id?: number;
  execution_time_ms: number;
}

export interface Row {
  values: ColumnValue[];
}

export type ColumnValue = 
  | { type: "Null" }
  | { type: "Integer", value: number }
  | { type: "Real", value: number }
  | { type: "Text", value: string }
  | { type: "Blob", value: Uint8Array };

export interface TransactionOptions {
  isolation_level: IsolationLevel;
  timeout_ms?: number;
}

export type IsolationLevel = "ReadUncommitted" | "ReadCommitted" | "RepeatableRead" | "Serializable";

export class SQLiteDB {
  free(): void;
  constructor(config: DatabaseConfig);
  execute(sql: string): Promise;
  prepare(sql: string): PreparedStatementId;
  begin_transaction(options: TransactionOptions): Promise;
  commit(): Promise;
  rollback(): Promise;
  close(): Promise;
}

export default function init(module?: WebAssembly.Module | undefined): Promise;
```

This implementation gives you:

✅ **Full TypeScript integration** with automatic type generation  
✅ **Rust 2024 edition** with latest language features  
✅ **No manual FFI bindings** required  
✅ **Production-ready architecture** with proper error handling  
✅ **Complete SQLite functionality** with IndexedDB persistence  
✅ **Modern toolchain** (wasm-pack 0.13.1, Rust 1.85.0+)

The generated TypeScript definitions are automatically kept in sync with your Rust code, giving you full type safety across the boundary!

[1] https://rust-dd.com/post/rust-2024-wrap-up-biggest-changes-and-future-outlook
[2] https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Rust_to_Wasm
[3] https://archlinux.org/packages/extra/x86_64/wasm-pack/
[4] https://doc.rust-lang.org/beta/releases.html
[5] https://dzfrias.dev/blog/rust-wasm-minimal-setup/
[6] https://github.com/rustwasm/wasm-pack/releases
[7] https://codeandbitters.com/rust-2024-upgrade/
[8] http://forum.exercism.org/t/cli-not-working-with-2024-edition/15991
[9] https://sourceforge.net/projects/wasm-pack.mirror/
[10] https://www.reddit.com/r/rust/comments/1gxyhkx/the_2024_edition_was_just_stabilized/
[11] https://doc.rust-lang.org/cargo/reference/manifest.html
[12] https://github.com/drager/wasm-pack
[13] https://blog.rust-lang.org/2025/02/20/Rust-1.85.0.html
[14] https://github.com/bytecodealliance/wasm-tools/blob/main/Cargo.toml
[15] https://rustwasm.github.io/wasm-pack/
[16] https://doc.rust-lang.org/edition-guide/rust-2024/index.html
[17] https://users.rust-lang.org/t/using-wasm-pack-with-a-single-cargo-toml-file-and-many-examples/90401
[18] https://classic.yarnpkg.com/en/package/wasm-pack
[19] https://barretts.club/posts/rust_review_2024/
[20] https://stackoverflow.com/questions/78456357/compiling-rust-with-webback-for-webassembly