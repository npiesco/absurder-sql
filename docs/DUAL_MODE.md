# Dual-Mode Persistence Guide

AbsurderSQL supports **browser IndexedDB / worker Hybrid OPFS** and **native
filesystem** persistence. These are separate storage locations, not a shared
live database: use explicit [SQLite export/import](EXPORT_IMPORT.md) to move
data between them. The current qualified runtime and platform limits are in
[Native qualification](NATIVE_QUALIFICATION.md).

## Browser Mode (WASM)

**Target:** Web applications running in browsers

**Storage Backend:** Buffered custom SQLite VFS, persisted to IndexedDB or a
worker Hybrid/OPFS backend

**Key Features:**
- Full SQLite functionality in the browser
- Multi-tab coordination with leader election
- Optimistic updates and write queuing
- Crash consistency and checksums
- Works without CORS headers or SharedArrayBuffer

**Usage:**
```javascript
import init, { Database } from '@npiesco/absurder-sql';

await init();
const db = await Database.newDatabase('my_app');
await db.execute('CREATE TABLE users (id INTEGER, name TEXT)');
await db.execute("INSERT INTO users VALUES (1, 'Alice')");
const result = await db.execute('SELECT * FROM users');
await db.sync(); // Await durable persistence before reporting a saved state.
await db.close();
```

`newDatabase(name)` selects IndexedDB. `newDatabaseAuto(name)` chooses Hybrid
only when worker OPFS capability is available; main-thread auto mode falls back
to IndexedDB. `newDatabaseWithBackend(name, 'Hybrid')` selects it explicitly in
a suitable worker.

**Data Location:** The origin's shared IndexedDB `block_storage` database holds
namespaced blocks, metadata, and commit markers. Hybrid/OPFS also uses the root
OPFS file `<normalized-name>.absurder.blocks.bin`; the current persistence path
retains an IndexedDB block recovery copy, not only metadata.

---

## Native Mode (Rust CLI/Server)

**Target:** Command-line tools, servers, desktop applications

**Storage Backend:** Traditional filesystem with SQLite .db files

**Key Features:**
- Standard SQLite database files (`.sqlite`)
- Compatible with all SQLite tools (sqlite3, DB Browser, etc.)
- BlockStorage metadata for integrity
- Shared configuration/result types; target-specific database APIs
- Full filesystem persistence

**Usage:**
```rust
use absurder_sql::{DatabaseConfig, SqliteIndexedDB};

let config = DatabaseConfig {
    name: "my_app.db".to_string(),
    cache_size: Some(2000),
    ..Default::default()
};

let mut db = SqliteIndexedDB::new(config).await?;
db.execute("CREATE TABLE users (id INTEGER, name TEXT)").await?;
db.execute("INSERT INTO users VALUES (1, 'Alice')").await?;
let result = db.execute("SELECT * FROM users").await?;
db.close().await?;
```

Enable `fs_persist` for real native files; without it the native database is
in-memory. SQLite's own file locking applies; this does not implement browser
leader election for native processes.

**Data Location:** `./absurdersql_storage/<name-without-.db>/database.sqlite`,
or the corresponding path beneath `ABSURDERSQL_FS_BASE`.

**Filesystem Structure:**
```
absurdersql_storage/
├── my_app/
│   └── database.sqlite      # Standard native SQLite database
└── my_app.db/               # Separate BlockStorage bookkeeping
    ├── blocks/
    └── metadata.json
```

---

## Use Cases

### 1. Offline-First Web Apps with Server Sync

**Scenario:** Build a web app that works offline, with optional server synchronization.

**Architecture:**
- **Browser:** Users work with data stored in IndexedDB
- **Server:** Application-managed snapshot transfer or synchronization protocol
- **Benefit:** App works offline, server handles sync/backup when needed

**Example:**
```javascript
// Browser: User creates todo
await db.execute("INSERT INTO todos (text, done) VALUES ('Buy milk', 0)");
await db.sync();
```

```rust
// Server: Query a separately transferred/imported native database.
let result = db.execute("SELECT * FROM todos WHERE synced = 0").await?;
// Process and mark as synced
```

### 2. Debug Production Data Locally

**Scenario:** Users report bugs with their data - download and debug locally.

**Workflow:**
1. User downloads `await db.exportToFile()` as a standalone SQLite file
2. Developer opens that file using a native SQLite tool
3. Query and analyze using standard SQLite tools
4. Reproduce issue with actual user data

**Example:**
```bash
# After downloading my_app.db from exportToFile()
sqlite3 my_app.db "SELECT * FROM users WHERE issue = 'bug'"
```

DevTools' IndexedDB records are not themselves a SQLite file. Export rejects a
refused or incomplete PASSIVE checkpoint; the returned snapshot has rollback
header bytes while the live browser database remains in WAL mode.

### 3. Desktop Apps with Web Preview

**Scenario:** Build desktop apps (Tauri, Electron) with web preview functionality.

**Architecture:**
- **Desktop:** Native AbsurderSQL with filesystem persistence
- **Web Preview:** WASM AbsurderSQL with IndexedDB
- **Benefit:** Same codebase, different persistence backends

### 4. Development Tools

**Scenario:** Inspect a native database or an explicitly downloaded browser
snapshot during development.

**Workflow:**
```bash
# Query the native cli_demo.db database, not the browser's origin storage.
cargo run --bin cli_query --features fs_persist -- ".tables"
cargo run --bin cli_query --features fs_persist -- "SELECT COUNT(*) FROM users"
```

---

## CLI Query Tool

AbsurderSQL includes a CLI query example for filesystem databases:

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

**Illustrative output (timing depends on the run):**
```
  AbsurderSQL CLI Query Tool
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Database: cli_demo.db
SQLite File: ./absurdersql_storage/cli_demo/database.sqlite
Block Storage: ./absurdersql_storage/cli_demo.db/

Executing: SELECT * FROM users

┌────────────────────────────────────────────────────────────┐
│ id                 │ name              │ email             │
├────────────────────────────────────────────────────────────┤
│ 1                  │ Alice             │ alice@example.com │
└────────────────────────────────────────────────────────────┘

1 row(s) returned
Execution time: 0.02ms
```

**Environment Variables:**
- `ABSURDERSQL_FS_BASE`: Override base storage directory (default: `./absurdersql_storage`)
- `DATASYNC_DB`: Select the logical native database name (default: `cli_demo.db`);
  this is not an arbitrary downloaded-file argument

---

## Comparison with absurd-sql

| Feature | absurd-sql | AbsurderSQL |
|---------|------------|----------|
| **Browser Support** | **[✓]** Yes | **[✓]** Yes |
| **Native/CLI Support** | **[X]** No | **[✓]** Yes |
| **Filesystem .db files** | **[X]** No | **[✓]** Yes |
| **Standard SQLite tools** | **[X]** No | **[✓]** Yes |
| **Debug production data locally** | **[X]** No | **[✓]** Yes |
| **Server-side processing** | **[X]** No | **[✓]** Yes |

**Key Advantage:** AbsurderSQL supports both modes, absurd-sql is **browser-only**.

---

## Testing

AbsurderSQL includes comprehensive tests for dual-mode functionality:

**Native persistence tests:**
```bash
cargo test --features fs_persist --test native_database_persistence_tests
```

**E2E Tests (Browser + CLI):**
```bash
npx playwright test dual_mode_persistence
```

**Manual Testing:**
```bash
# Query the native filesystem database; browser transfer is a separate step.
cargo run --bin cli_query --features fs_persist -- "SELECT * FROM my_table"
```

---

## Technical Details

### Browser Mode Implementation
- Uses `wasm-bindgen` for JavaScript interop
- Custom SQLite VFS buffers blocks and persists through the selected backend
- BlockStorage manages 4KB blocks, checksums, and commit metadata
- Multi-tab coordination via localStorage + BroadcastChannel

### Native Mode Implementation
- Uses `rusqlite` for SQLite C API
- Direct filesystem I/O via `std::fs`
- BlockStorage writes to `./absurdersql_storage/`
- Native SQLite handles file-level locking; applications still coordinate
  concurrent users and snapshot transfer

### Shared Components
- Same Rust core (`AbsurderSQL Core`)
- Same BlockStorage architecture
- Shared block metadata/checksum machinery; browser IDB records and native files
  are not interchangeable storage directories

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

## Getting Started

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
- **Native:** `src/bin/cli_query.rs` - CLI query tool
- **E2E:** `tests/e2e/dual_mode_persistence.spec.js` - Both modes

---

## Best Practices

1. **Transfer snapshots explicitly**; matching names do not share storage
2. **Enable checksums** for data integrity in both modes
3. **Test both modes** if your app uses dual-mode functionality
4. **Document storage locations** for users/operators
5. **Implement export/import** if users need to migrate data between modes

---

## Related Documentation

- [Multi-Tab Coordination Guide](MULTI_TAB_GUIDE.md) - Browser multi-tab features
- [Transaction Support](TRANSACTION_SUPPORT.md) - Transaction handling
- [Export/Import Guide](EXPORT_IMPORT.md) - Portable snapshots and physical deletion
- [Benchmark Results](BENCHMARK.md) - Performance metrics
- [Demo Guide](../examples/DEMO_GUIDE.md) - Interactive examples

---

## Summary

AbsurderSQL's **dual-mode persistence** is a unique capability that allows you to:

**[✓]** Build offline-first web apps with IndexedDB  
**[✓]** Query transferred snapshots from CLI/server with filesystem access
**[✓]** Debug production data locally using standard SQLite tools  
**[✓]** Run the same Rust codebase in browser AND on server  
**[✓]** Maintain data integrity with checksums in both modes  

Browser storage and native files remain separate authorities. Successful transfer,
not a matching database name, is what makes the same data available in both modes.
