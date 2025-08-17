# DataSync: Building a Superior AbsurdSQL Alternative

## Project Vision
Create a **better, faster, more efficient** SQLite WASM implementation than AbsurdSQL using Rust, with superior architecture, performance optimizations, and modern tooling.

## Current Status: Foundation Complete 
- [x] Basic SQLite WASM integration working
- [x] IndexedDB persistence layer functional  
- [x] 59 Rust tests passing
- [x] TypeScript bindings generated
- [x] Browser demo operational

---

# Phase 1: Architecture & Performance Foundation

## 1.1 Block-Based Storage System (AbsurdSQL's Core Innovation)
- [ ] **Design block-based storage architecture**
  - [ ] Implement 4KB block size optimization
  - [ ] Create block allocation and deallocation system
  - [ ] Design block metadata tracking
  - [ ] Implement block-level caching with LRU eviction

- [ ] **Enhanced IndexedDB backend**
  - [ ] Replace file-based storage with block-based storage
  - [ ] Implement lazy loading of blocks
  - [ ] Add block compression for storage efficiency
  - [ ] Create batch operations for multiple blocks

- [ ] **Virtual File System (VFS) optimization**
  - [ ] Rewrite IndexedDBVFS for block-based operations
  - [ ] Implement zero-copy block transfers where possible
  - [ ] Add intelligent prefetching based on access patterns
  - [ ] Create block-level dirty tracking

## 1.2 SharedArrayBuffer & CORS Architecture
- [ ] **SharedArrayBuffer integration**
  - [ ] Implement SharedArrayBuffer-based memory management
  - [ ] Add Atomics API for thread-safe operations
  - [ ] Create fallback mode for Safari (without SharedArrayBuffer)
  - [ ] Implement proper CORS headers enforcement

- [ ] **Worker-only architecture**
  - [ ] Enforce Web Worker execution for all database operations
  - [ ] Create main thread proxy for database commands
  - [ ] Implement message passing optimization
  - [ ] Add worker lifecycle management

- [ ] **Memory optimization**
  - [ ] Implement custom allocator for WASM
  - [ ] Add memory pool management for blocks
  - [ ] Create garbage collection optimization
  - [ ] Implement memory pressure handling

---

# Phase 2: Concurrency & Multi-Tab Coordination

## 2.1 Advanced Locking Mechanisms
- [ ] **Multi-tab coordination**
  - [ ] Implement distributed locking via IndexedDB
  - [ ] Create tab discovery and coordination system
  - [ ] Add conflict resolution for concurrent writes
  - [ ] Implement leader election for write coordination

- [ ] **Transaction isolation**
  - [ ] Implement proper ACID transaction support
  - [ ] Add deadlock detection and resolution
  - [ ] Create transaction timeout handling
  - [ ] Implement optimistic concurrency control

- [ ] **Lock-free data structures**
  - [ ] Use atomic operations for metadata updates
  - [ ] Implement lock-free block cache
  - [ ] Create wait-free read operations where possible
  - [ ] Add fine-grained locking for write operations

## 2.2 Performance Monitoring & Optimization
- [ ] **Performance instrumentation**
  - [ ] Add detailed timing metrics for all operations
  - [ ] Implement block access pattern analysis
  - [ ] Create performance dashboard
  - [ ] Add memory usage tracking

- [ ] **Adaptive optimization**
  - [ ] Implement dynamic cache sizing based on usage
  - [ ] Add intelligent prefetching algorithms
  - [ ] Create adaptive block size optimization
  - [ ] Implement query plan optimization hints

---

# Phase 3: Superior Features Beyond AbsurdSQL

## 3.1 Advanced Storage Features
- [ ] **Compression & encryption**
  - [ ] Implement block-level compression (LZ4/Zstd)
  - [ ] Add optional encryption at rest
  - [ ] Create compression ratio optimization
  - [ ] Implement transparent decompression

- [ ] **Backup & synchronization**
  - [ ] Create incremental backup system
  - [ ] Implement cross-device synchronization
  - [ ] Add conflict-free replicated data types (CRDTs)
  - [ ] Create export/import functionality

- [ ] **Advanced indexing**
  - [ ] Implement bloom filters for faster lookups
  - [ ] Add spatial indexing support
  - [ ] Create full-text search optimization
  - [ ] Implement adaptive indexing

## 3.2 Developer Experience Enhancements
- [ ] **Enhanced TypeScript integration**
  - [ ] Generate schema-aware TypeScript types
  - [ ] Add compile-time SQL validation
  - [ ] Create type-safe query builders
  - [ ] Implement automatic migration generation

- [ ] **Development tools**
  - [ ] Create browser DevTools extension
  - [ ] Add SQL query profiler
  - [ ] Implement database schema visualizer
  - [ ] Create performance analysis tools

- [ ] **Testing & debugging**
  - [ ] Add comprehensive test suite (>95% coverage)
  - [ ] Create property-based testing framework
  - [ ] Implement database state inspection tools
  - [ ] Add automated performance regression tests

---

# Phase 4: Benchmarking & Optimization

## 4.1 Performance Benchmarking
- [ ] **Comprehensive benchmarks**
  - [ ] Create benchmarks vs AbsurdSQL
  - [ ] Add benchmarks vs native IndexedDB
  - [ ] Implement real-world application benchmarks
  - [ ] Create memory usage comparisons

- [ ] **Optimization targets**
  - [ ] Achieve >10x performance over IndexedDB (match AbsurdSQL)
  - [ ] Target 50% better performance than AbsurdSQL
  - [ ] Reduce memory usage by 30% vs AbsurdSQL
  - [ ] Improve cold start time by 2x

## 4.2 Production Readiness
- [ ] **Stability & reliability**
  - [ ] Implement comprehensive error recovery
  - [ ] Add data corruption detection and repair
  - [ ] Create graceful degradation modes
  - [ ] Implement automatic health checks

- [ ] **Documentation & examples**
  - [ ] Create comprehensive API documentation
  - [ ] Add migration guide from AbsurdSQL
  - [ ] Create real-world usage examples
  - [ ] Write performance tuning guide

---

# Phase 5: Advanced Features & Ecosystem

## 5.1 Ecosystem Integration
- [ ] **Framework integrations**
  - [ ] Create React hooks and components
  - [ ] Add Vue.js composables
  - [ ] Implement Svelte stores integration
  - [ ] Create Angular services

- [ ] **ORM & query builders**
  - [ ] Implement type-safe ORM layer
  - [ ] Create fluent query builder API
  - [ ] Add schema migration system
  - [ ] Implement relationship mapping

## 5.2 Advanced Database Features
- [ ] **Extensions & plugins**
  - [ ] Create plugin architecture
  - [ ] Implement custom function support
  - [ ] Add virtual table support
  - [ ] Create extension marketplace

- [ ] **Analytics & insights**
  - [ ] Implement query performance analytics
  - [ ] Add usage pattern analysis
  - [ ] Create automated optimization suggestions
  - [ ] Implement predictive caching

---

# Success Metrics

## Performance Targets
- **10x faster** than direct IndexedDB operations
- **2x faster** than AbsurdSQL in common operations
- **50% less memory** usage than AbsurdSQL
- **Sub-100ms** cold start time
- **99.9% uptime** in production environments

## Developer Experience
- **100% type safety** with TypeScript
- **Zero-config** setup for common use cases
- **<5 minutes** from install to first query
- **Comprehensive documentation** with examples
- **Active community** and ecosystem

---

# Implementation Strategy

## Current Architecture Assessment
**Strengths:**
- Real SQLite C API integration via sqlite-wasm-rs
- Solid TypeScript bindings
- Working IndexedDB persistence
- Comprehensive test suite

**Gaps vs AbsurdSQL:**
- No block-based storage (major performance impact)
- No SharedArrayBuffer optimization
- No multi-tab coordination
- No worker-only architecture
- Limited caching and prefetching

## Next Immediate Steps
1. **Block Storage Redesign** - Replace file-based with block-based storage
2. **SharedArrayBuffer Integration** - Add zero-copy memory operations
3. **Worker Architecture** - Enforce worker-only execution
4. **Multi-tab Coordination** - Implement distributed locking
5. **Performance Benchmarking** - Establish baseline vs AbsurdSQL

This plan will create a **superior alternative to AbsurdSQL** with better performance, modern Rust architecture, and enhanced developer experience.

# Technical Implementation Notes

## Key Advantages Over AbsurdSQL

### **Performance Improvements**
1. **Rust's Zero-Cost Abstractions** - Better memory management than JavaScript
2. **Custom WASM Allocator** - Optimized memory allocation vs Emscripten defaults
3. **Native SQLite Integration** - Direct C API calls vs sql.js wrapper overhead
4. **Advanced Block Caching** - LRU + predictive prefetching vs simple caching

### **Architecture Improvements**  
1. **Type-Safe APIs** - Compile-time guarantees vs runtime errors
2. **Modern Async/Await** - Better than callback-based sql.js
3. **Modular Design** - Pluggable storage backends vs monolithic approach
4. **Better Error Handling** - Rust's Result types vs JavaScript exceptions

### **Developer Experience**
1. **Auto-Generated TypeScript** - Always in sync vs manual definitions
2. **Comprehensive Testing** - Property-based + integration tests
3. **Performance Profiling** - Built-in metrics and analysis tools
4. **Migration Tools** - Easy transition from AbsurdSQL

---

## Implementation Priority

**Phase 1** is critical - block-based storage is the foundation that enables all performance gains. Without it, we're just another SQLite WASM wrapper.

**Phase 2** adds the concurrency features that make it production-ready for multi-tab applications.

**Phases 3-5** differentiate us with features AbsurdSQL doesn't have, making this the superior choice for modern web applications.

















---

# Getting Started - First Implementation Steps

Based on the current foundation and AbsurdSQL analysis, here are the **immediate next steps** to begin building the superior alternative:

## Step 1: Block Storage Architecture (Priority 1)
- [ ] **Analyze current IndexedDBVFS implementation**
  - [ ] Review `src/vfs/indexeddb_vfs.rs` structure
  - [ ] Identify file-based storage patterns to replace
  - [ ] Map current storage operations to block operations

- [ ] **Design block-based storage system**
  - [ ] Define 4KB block size standard (matching SQLite page size)
  - [ ] Create block metadata structure (block_id, size, checksum)
  - [ ] Design block allocation bitmap/free list
  - [ ] Plan block-level dirty tracking system

- [ ] **Implement BlockStorage trait**
  - [ ] `read_block(block_id: u64) -> Result<Vec<u8>>`
  - [ ] `write_block(block_id: u64, data: Vec<u8>) -> Result<()>`
  - [ ] `allocate_block() -> Result<u64>`
  - [ ] `deallocate_block(block_id: u64) -> Result<()>`
  - [ ] `sync_blocks() -> Result<()>`

## Step 2: Enhanced IndexedDB Backend (Priority 1)
- [ ] **Replace file operations with block operations**
  - [ ] Update `src/storage/block_storage.rs` to use blocks
  - [ ] Implement LRU cache for frequently accessed blocks
  - [ ] Add batch operations for multiple block reads/writes
  - [ ] Create block compression (optional, for storage efficiency)

- [ ] **Optimize IndexedDB usage**
  - [ ] Use IndexedDB transactions for atomic block operations
  - [ ] Implement block prefetching based on access patterns
  - [ ] Add block-level integrity checking (checksums)
  - [ ] Create background sync for dirty blocks

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