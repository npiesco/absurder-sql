# SQLite IndexedDB Rust Library (DataSync)

A high-performance Rust library that brings full SQLite functionality to web browsers through WebAssembly. DataSync implements a custom Virtual File System (VFS) that seamlessly persists SQLite databases to IndexedDB, enabling production-ready SQL operations in browser environments with crash consistency and multi-tab coordination.

## 📊 Architecture Overview

```mermaid
graph TB
    subgraph "Browser Environment"
        JS["JavaScript/TypeScript Application"]
        WASM["WASM Bridge Layer<br/>(wasm-bindgen)"]
    end
    
    subgraph "DataSync Core (Rust/WASM)"
        DB["Database API<br/>(lib.rs)"]
        SQLITE["SQLite Engine<br/>(sqlite-wasm-rs)"]
        VFS["Custom VFS Layer<br/>(indexeddb_vfs.rs)"]
        
        subgraph "Storage Layer"
            BS["BlockStorage<br/>(block_storage.rs)"]
            SYNC["Sync Operations<br/>(sync_operations.rs)"]
            META["Metadata Manager<br/>(metadata.rs)"]
            CACHE["LRU Cache<br/>(128 blocks default)"]
        end
        
        subgraph "Platform-Specific"
            FS["fs_persist<br/>(Native filesystem)"]
            IDB["wasm_indexeddb<br/>(IndexedDB)"]
        end
        
        subgraph "Multi-Tab Coordination"
            LEADER["Leader Election<br/>(leader_election.rs)"]
            AUTO["Auto-Sync<br/>(auto_sync.rs)"]
        end
    end
    
    subgraph "Browser Storage"
        INDEXEDDB["IndexedDB<br/>(Persistent Storage)"]
    end
    
    JS -->|execute/query| WASM
    WASM -->|calls| DB
    DB -->|SQL| SQLITE
    SQLITE -->|VFS calls| VFS
    VFS -->|block I/O| BS
    BS -->|read/write| CACHE
    BS -->|persist| SYNC
    SYNC -->|metadata| META
    BS -->|native| FS
    BS -->|WASM| IDB
    IDB -->|async| INDEXEDDB
    LEADER -->|coordination| INDEXEDDB
    AUTO -->|triggers| SYNC
    
    style SQLITE fill:#f9f,stroke:#333
    style VFS fill:#9ff,stroke:#333
    style BS fill:#ff9,stroke:#333
    style INDEXEDDB fill:#9f9,stroke:#333
```

## 🗂️ Project Structure

```
DataSync/
├── src/
│   ├── lib.rs              # WASM entry point, Database API exports
│   ├── database.rs         # Native Database implementation
│   ├── types.rs            # Core types (QueryResult, ColumnValue, etc.)
│   ├── utils.rs            # Utility functions
│   ├── storage/            # Storage layer implementation
│   │   ├── mod.rs
│   │   ├── block_storage.rs      # Core block storage with LRU cache
│   │   ├── sync_operations.rs   # Cross-platform sync logic
│   │   ├── io_operations.rs     # Read/write operations
│   │   ├── allocation.rs        # Block allocation/deallocation
│   │   ├── metadata.rs          # Block metadata management
│   │   ├── fs_persist.rs        # Native filesystem persistence
│   │   ├── wasm_indexeddb.rs    # WASM IndexedDB integration
│   │   ├── wasm_vfs_sync.rs     # WASM VFS sync coordination
│   │   ├── recovery.rs          # Crash recovery logic
│   │   ├── auto_sync.rs         # Native auto-sync
│   │   ├── wasm_auto_sync.rs    # WASM auto-sync
│   │   ├── leader_election.rs   # Multi-tab coordination
│   │   ├── observability.rs     # Metrics and monitoring
│   │   └── constructors.rs      # BlockStorage constructors
│   └── vfs/                # SQLite VFS implementation
│       ├── mod.rs
│       └── indexeddb_vfs.rs     # Custom VFS for IndexedDB
│
├── tests/                  # Comprehensive test suite
│   ├── integration_tests.rs     # End-to-end tests
│   ├── wasm_integration_tests.rs
│   ├── vfs_durability_tests.rs
│   ├── lru_cache_tests.rs
│   └── ...                      # 59 test files total
│
├── examples/               # Demos and documentation
│   ├── sql_demo.js         # CLI launcher for SQL demo
│   ├── sql_demo.html       # Interactive SQL demo page
│   ├── web_demo.html       # Full-featured web interface
│   ├── benchmark.html      # Performance comparison tool
│   ├── DEMO_GUIDE.md       # Demo usage guide
│   └── BENCHMARK.md        # Benchmark results and analysis
│
├── pkg/                    # WASM build output (generated)
├── Cargo.toml             # Rust dependencies and config
├── package.json           # Node.js dependencies
└── README.md              # This file
```

## System Architecture

### Core Architecture
The project follows a modular architecture with clear separation of concerns:

**VFS Layer**: Implements a custom SQLite Virtual File System that translates SQLite's file operations to IndexedDB operations. This allows SQLite to work seamlessly with browser storage without modifications to the core SQLite engine.

**Storage Abstraction**: Provides a unified interface for different storage backends, with IndexedDB as the primary target. The design allows for future expansion to other storage mechanisms while maintaining API compatibility.

**WASM Bridge**: Handles the interface between Rust code and JavaScript, managing memory allocation, type conversions, and async operation bridging. Uses `sqlite-wasm-rs` for stable SQLite operations without the hang issues that affected previous implementations. This ensures smooth interoperability between the WASM module and browser JavaScript.

**Type System**: Defines comprehensive data structures for SQL operations, query results, and configuration options, ensuring type safety across the Rust-JavaScript boundary.

### Frontend Architecture
The web demo uses vanilla JavaScript with Bootstrap for styling, demonstrating real-time SQL query execution and result visualization. The frontend architecture emphasizes simplicity and direct WASM integration without complex frameworks.

### Data Storage Design
**Primary Storage**: IndexedDB serves as the persistent storage layer, chosen for its transaction support, large storage capacity, and widespread browser compatibility.

**Memory Management**: The library implements careful memory management for WASM operations, ensuring proper cleanup of allocated memory and efficient data transfer between Rust and JavaScript contexts.

**Transaction Handling**: Leverages SQLite's transaction capabilities while ensuring proper coordination with IndexedDB's transaction model for data consistency.

### Configuration System
The architecture supports configurable database options including cache size, synchronization modes, and VFS-specific settings, allowing optimization for different use cases and performance requirements.

## Getting Started

### Prerequisites
- **Rust 1.85.0+** with the 2024 edition
- **wasm-pack** for building WASM packages
- **Node.js 18+** for running examples

### Build the WASM Package

```bash
# Install wasm-pack if needed
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Build for web
wasm-pack build --target web --out-dir pkg
```

This generates the `pkg/` directory containing:
- `sqlite_indexeddb_rs.js` - JavaScript module
- `sqlite_indexeddb_rs_bg.wasm` - WebAssembly binary
- TypeScript definitions and package files

### Quick Usage Example

```javascript
import init, { Database } from './pkg/sqlite_indexeddb_rs.js';

// Initialize WASM
await init();

// Create database
const db = await Database.newDatabase('myapp');

// Execute SQL
await db.execute('CREATE TABLE users (id INT, name TEXT)');
await db.execute("INSERT INTO users VALUES (1, 'Alice')");
const result = await db.execute('SELECT * FROM users');

// Persist to IndexedDB
await db.sync();

// Close
await db.close();
```

## SQLite WASM Integration

### Architecture Overview
The library provides a robust SQLite implementation for WebAssembly environments using the `sqlite-wasm-rs` crate with precompiled features. This ensures stable, production-ready SQLite functionality without the hang issues that plagued earlier custom implementations.

### Key Features
- **Full SQLite C API Support**: Complete implementation of `sqlite3_prepare_v2`, `sqlite3_step`, `sqlite3_finalize`, and parameter binding
- **Memory Safety**: Proper Rust `Drop` trait implementation for automatic cleanup of SQLite resources
- **Async Operations**: All database operations are async-compatible for seamless integration with browser event loops
- **Type Safety**: Comprehensive `ColumnValue` enum supporting all SQLite data types (NULL, INTEGER, REAL, TEXT, BLOB, BIGINT, DATE)
- **JavaScript Interop**: Complete `wasm-bindgen` exports with `WasmColumnValue` wrapper for seamless JS integration

## 🔄 Multi-Tab Coordination

DataSync includes built-in multi-tab coordination for browser applications, ensuring data consistency across multiple tabs without conflicts.

### Key Features
- **Automatic Leader Election**: First tab becomes leader using localStorage coordination
- **Write Guard**: Only the leader tab can execute write operations (INSERT, UPDATE, DELETE)
- **Write Queuing** ✨ NEW: Non-leaders can queue writes that forward to leader automatically
- **BroadcastChannel Sync**: Automatic change notifications to all tabs
- **Failover Support**: Automatic re-election when leader tab closes
- **Zero Configuration**: Works out of the box, no setup required

### Quick Example

```javascript
import init, { Database } from './pkg/sqlite_indexeddb_rs.js';
import { MultiTabDatabase } from './examples/multi-tab-wrapper.js';

await init();

// Create multi-tab database
const db = new MultiTabDatabase(Database, 'myapp.db', {
  autoSync: true  // Auto-sync after writes
});
await db.init();

// Check leader status
if (await db.isLeader()) {
  // Only leader can write
  await db.write("INSERT INTO users VALUES (1, 'Alice')");
}

// All tabs can read
const result = await db.query("SELECT * FROM users");

// Listen for changes from other tabs
db.onRefresh(() => {
  console.log('Data changed in another tab!');
  // Refresh UI
});
```

### Helper Methods
```javascript
// Wait to become leader
await db.waitForLeadership();

// Request leadership
await db.requestLeadership();

// Queue write from any tab ✨ NEW
await db.queueWrite("INSERT INTO logs VALUES (1, 'event')");

// Queue write with custom timeout
await db.queueWriteWithTimeout("UPDATE data SET processed = 1", 10000);

// Get leader info
const info = await db.getLeaderInfo();
// { isLeader: true, leaderId: "...", leaseExpiry: 123456 }

// Override for single-tab apps
await db.allowNonLeaderWrites(true);
```

### Live Demos
- **[Multi-Tab Demo](examples/multi-tab-demo.html)** - Interactive task list with multi-tab sync
- **[Vite App](examples/vite-app/)** - Production-ready multi-tab example
- **[Complete Guide](examples/MULTI_TAB_GUIDE.md)** - Full documentation and patterns

**Open the demo in multiple browser tabs to see coordination in action!**

---

## Demos & Examples

### Vite Integration (`vite-app/`)
Modern web app example with **multi-tab coordination**:
- ES modules with hot reload
- Multi-tab leader election
- Real-time sync across tabs
- Leader/follower UI indicators
- Production-ready build

**[📖 Full setup guide](examples/vite-app/README.md)**

```bash
cd examples/vite-app
npm install
npm run dev
# Open in multiple tabs!
```

### SQL Demo (`sql_demo.js` / `sql_demo.html`)
Comprehensive SQL operations demo:
- Table creation with foreign keys
- INSERT operations with transactions
- Complex SELECT queries with JOINs and aggregations
- UPDATE and DELETE operations
- Automatic IndexedDB persistence via `sync()` calls

```bash
node examples/sql_demo.js
```

### Interactive Web Demo (`web_demo.html`)
Full-featured interactive SQL interface:
- Visual query editor
- Real-time query execution and result display
- Console output for debugging
- Quick action buttons for common operations
- Automatic sync after write operations

**[📖 Detailed walkthrough](examples/DEMO_GUIDE.md)**

```bash
npm run serve
# Open http://localhost:8080/examples/web_demo.html
```

## Performance Benchmarks

DataSync consistently outperforms absurd-sql and raw IndexedDB across all operations.

**[📖 Full benchmark results and analysis](examples/BENCHMARK.md)**

### Latest Results

| Implementation | Insert | Read | Update | Delete |
|---------------|--------|------|--------|--------|
| **DataSync** 🏆 | **3.2ms** | **1.2ms** | **400μs** | **400μs** |
| absurd-sql | 3.8ms | 2.1ms | 800μs | 700μs |
| Raw IndexedDB | 24.1ms | 1.4ms | 14.1ms | 6.3ms |

### Run Benchmarks

```bash
npm run serve
# Open http://localhost:8080/examples/benchmark.html
```

## External Dependencies

### Rust Dependencies
- **sqlite-wasm-rs**: Production-ready SQLite WASM bindings with precompiled features
- **rusqlite**: Primary SQLite interface for native Rust builds, providing safe bindings to SQLite C library
- **wasm-bindgen**: Facilitates communication between Rust and JavaScript in WASM context
- **js-sys**: Provides bindings to JavaScript's built-in objects and functions
- **web-sys**: Offers bindings to Web APIs including IndexedDB
- **serde**: Handles serialization/deserialization for data exchange
- **tokio**: Provides async runtime support for handling asynchronous operations

### JavaScript Dependencies
- **Bootstrap 5.1.3**: UI framework for responsive design and component styling
- **Feather Icons**: Icon library for user interface elements

### Browser APIs
- **IndexedDB**: Primary storage API for persistent data storage
- **WebAssembly**: Runtime environment for executing the compiled Rust code
- **Fetch API**: Used for loading WASM modules and handling HTTP requests

### Development Tools
- **wasm-pack**: Build tool for generating WASM packages with JavaScript bindings
- **Node.js 18+**: Required for development tooling and testing infrastructure
- **Rust 1.85.0+**: Compiler targeting the 2024 edition for latest language features

The library is designed to work entirely in the browser environment without requiring any server-side components, making it suitable for offline-first applications and client-side data processing scenarios.