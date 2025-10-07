# Dual-Mode Persistence Guide

AbsurderSQL is a **dual-mode** library that supports both **Browser (IndexedDB)** and **Native (filesystem)** persistence. This unique capability allows you to build offline-first web applications while maintaining full CLI/server access to the same data.

## 🌐 Browser Mode (WASM)

**Target:** Web applications running in browsers

**Storage Backend:** IndexedDB via custom SQLite VFS

**Key Features:**
- Full SQLite functionality in the browser
- Multi-tab coordination with leader election
- Optimistic updates and write queuing
- Crash consistency and checksums
- Works without CORS headers or SharedArrayBuffer

**Usage:**
```javascript
import init, { Database } from '/pkg/absurder_sql.js';

await init();
const db = await Database.newDatabase('my_app');
await db.execute('CREATE TABLE users (id INTEGER, name TEXT)');
await db.execute("INSERT INTO users VALUES (1, 'Alice')");
const result = await db.execute('SELECT * FROM users');
```

**Data Location:** Browser IndexedDB (`IndexedDB → <db_name>`)

---

## 💻 Native Mode (Rust CLI/Server)

**Target:** Command-line tools, servers, desktop applications

**Storage Backend:** Traditional filesystem with SQLite .db files

**Key Features:**
- Standard SQLite database files (`.sqlite`)
- Compatible with all SQLite tools (sqlite3, DB Browser, etc.)
- BlockStorage metadata for integrity
- Same Rust API as browser mode
- Full filesystem persistence

**Usage:**
```rust
use absurder_sql::database::SqliteIndexedDB;
use absurder_sql::types::{DatabaseConfig, ColumnValue};

let config = DatabaseConfig {
    name: "my_app.db".to_string(),
    cache_size: Some(2000),
    page_size: None,
    journal_mode: None,
    auto_vacuum: None,
    version: Some(1),
};

let mut db = SqliteIndexedDB::new(config).await?;
db.execute("CREATE TABLE users (id INTEGER, name TEXT)").await?;
db.execute("INSERT INTO users VALUES (1, 'Alice')").await?;
let result = db.execute("SELECT * FROM users").await?;
```

**Data Location:** `./datasync_storage/<db_name>/`

**Filesystem Structure:**
```
datasync_storage/
└── my_app/
    ├── database.sqlite      # Standard SQLite database file
    ├── blocks/              # BlockStorage blocks (4KB each)
    │   ├── block_0.bin
    │   ├── block_1.bin
    │   └── ...
    ├── metadata.json        # Block metadata with checksums
    └── allocations.json     # Block allocation tracking
```

---

## 🎯 Use Cases

### 1. Offline-First Web Apps with Server Sync

**Scenario:** Build a web app that works offline, with optional server synchronization.

**Architecture:**
- **Browser:** Users work with data stored in IndexedDB
- **Server:** Periodic sync using CLI tool to process/backup data
- **Benefit:** App works offline, server handles sync/backup when needed

**Example:**
```javascript
// Browser: User creates todo
await db.execute("INSERT INTO todos (text, done) VALUES ('Buy milk', 0)");

// Server: Periodic sync (Rust)
let result = db.execute("SELECT * FROM todos WHERE synced = 0").await?;
// Process and mark as synced
```

### 2. Debug Production Data Locally

**Scenario:** Users report bugs with their data - download and debug locally.

**Workflow:**
1. User exports IndexedDB from browser (built-in browser tools)
2. Developer loads data into local AbsurderSQL CLI
3. Query and analyze using standard SQLite tools
4. Reproduce issue with actual user data

**Example:**
```bash
# Export from browser DevTools → Application → IndexedDB
# Import to local CLI
cargo run --bin cli_query --features fs_persist -- "SELECT * FROM users WHERE issue = 'bug'"
```

### 3. Desktop Apps with Web Preview

**Scenario:** Build desktop apps (Tauri, Electron) with web preview functionality.

**Architecture:**
- **Desktop:** Native AbsurderSQL with filesystem persistence
- **Web Preview:** WASM AbsurderSQL with IndexedDB
- **Benefit:** Same codebase, different persistence backends

### 4. Development Tools

**Scenario:** Inspect browser data using CLI tools during development.

**Workflow:**
```bash
# While web app is running in browser...
# Query the data from CLI
cargo run --bin cli_query --features fs_persist -- ".tables"
cargo run --bin cli_query --features fs_persist -- "SELECT COUNT(*) FROM users"
```

---

## 🔧 CLI Query Tool

AbsurderSQL includes a production-ready CLI tool for querying filesystem databases:

**Installation:**
```bash
cargo build --bin cli_query --features fs_persist --release
```

**Usage:**
```bash
# Create table
cargo run --bin cli_query --features fs_persist -- \
  "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)"

# Insert data
cargo run --bin cli_query --features fs_persist -- \
  "INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com')"

# Query data
cargo run --bin cli_query --features fs_persist -- \
  "SELECT * FROM users"

# Special commands
cargo run --bin cli_query --features fs_persist -- ".tables"
cargo run --bin cli_query --features fs_persist -- ".schema"
```

**Output:**
```
🗄️  AbsurderSQL CLI Query Tool
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📂 Database: cli_demo.db
💾 Storage: ./datasync_storage/cli_demo/

🔍 Executing: SELECT * FROM users

┌────────────────────────────────────────────────────────────┐
│ id                 │ name               │ email              │
├────────────────────────────────────────────────────────────┤
│ 1                  │ Alice              │ alice@example.com  │
└────────────────────────────────────────────────────────────┘

📊 1 row(s) returned
⏱️  Execution time: 0.02ms
```

**Environment Variables:**
- `DATASYNC_FS_BASE`: Override base storage directory (default: `./datasync_storage`)

---

## 🆚 Comparison with absurd-sql

| Feature | absurd-sql | AbsurderSQL |
|---------|------------|----------|
| **Browser Support** | ✅ Yes | ✅ Yes |
| **Native/CLI Support** | ❌ No | ✅ Yes |
| **Filesystem .db files** | ❌ No | ✅ Yes |
| **Standard SQLite tools** | ❌ No | ✅ Yes |
| **Debug production data locally** | ❌ No | ✅ Yes |
| **Server-side processing** | ❌ No | ✅ Yes |

**Key Advantage:** AbsurderSQL supports both modes, absurd-sql is **browser-only**.

---

## 🧪 Testing

AbsurderSQL includes comprehensive tests for dual-mode functionality:

**Unit Tests (Native):**
```bash
cargo test --features fs_persist native_database_persistence_tests
```

**E2E Tests (Browser + CLI):**
```bash
npx playwright test dual_mode_persistence
```

**Manual Testing:**
```bash
# Browser: Open web app, create data in IndexedDB
# CLI: Query filesystem database
cargo run --bin cli_query --features fs_persist -- "SELECT * FROM my_table"
```

---

## 📋 Technical Details

### Browser Mode Implementation
- Uses `wasm-bindgen` for JavaScript interop
- Custom SQLite VFS redirects to IndexedDB
- BlockStorage manages 4KB blocks in IndexedDB
- Multi-tab coordination via localStorage + BroadcastChannel

### Native Mode Implementation
- Uses `rusqlite` for SQLite C API
- Direct filesystem I/O via `std::fs`
- BlockStorage writes to `./datasync_storage/`
- Single-threaded (no multi-process coordination needed)

### Shared Components
- Same Rust core (`AbsurderSQL Core`)
- Same BlockStorage architecture
- Same metadata format
- Same integrity checks (checksums, MVCC)

### Feature Flags
- **Browser:** Default build (WASM target)
- **Native:** Requires `fs_persist` feature flag

**Build Commands:**
```bash
# Browser (WASM)
wasm-pack build --target web

# Native (CLI)
cargo build --features fs_persist
```

---

## 🚀 Getting Started

### Browser Setup
```bash
wasm-pack build --target web
# Use pkg/absurder_sql.js in your web app
```

### Native Setup
```bash
cargo add absurder-sql
# Enable fs_persist feature in Cargo.toml:
# absurder-sql = { version = "0.1", features = ["fs_persist"] }
```

### Example Projects
- **Browser:** `examples/vite-app/` - Full-featured web app
- **Native:** `examples/cli_query.rs` - CLI query tool
- **E2E:** `tests/e2e/dual_mode_persistence.spec.js` - Both modes

---

## 💡 Best Practices

1. **Use consistent database names** between browser and native modes
2. **Enable checksums** for data integrity in both modes
3. **Test both modes** if your app uses dual-mode functionality
4. **Document storage locations** for users/operators
5. **Implement export/import** if users need to migrate data between modes

---

## 🔗 Related Documentation

- [Multi-Tab Coordination Guide](MULTI_TAB_GUIDE.md) - Browser multi-tab features
- [Transaction Support](TRANSACTION_SUPPORT.md) - Transaction handling
- [Benchmark Results](BENCHMARK.md) - Performance metrics
- [Demo Guide](../examples/DEMO_GUIDE.md) - Interactive examples

---

## 📝 Summary

AbsurderSQL's **dual-mode persistence** is a unique capability that allows you to:

✅ Build offline-first web apps with IndexedDB  
✅ Query the same data from CLI/server with filesystem access  
✅ Debug production data locally using standard SQLite tools  
✅ Run the same Rust codebase in browser AND on server  
✅ Maintain data integrity with checksums in both modes  

**No other library** (including absurd-sql) provides this flexibility. AbsurderSQL is truly **universal SQLite**.
