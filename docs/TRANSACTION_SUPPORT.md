# Transaction Support in DataSync

DataSync provides **full transactional support** for SQLite operations with IndexedDB persistence in WASM environments. This document outlines the transactional capabilities, limitations, and usage patterns.

## ✅ Supported Features

### 1. **Explicit Transactions**
- `BEGIN TRANSACTION` / `BEGIN` - Start a new transaction
- `COMMIT` - Commit all changes made within the transaction
- `ROLLBACK` - Discard all changes made within the transaction

### 2. **Implicit Transactions**
- Single statements (INSERT, UPDATE, DELETE) are automatically wrapped in implicit transactions
- Changes are automatically committed after successful execution

### 3. **Transaction Persistence**  
- Committed transactions (via COMMIT) are in SQLite's in-memory state
- Data persists to IndexedDB only after calling `sync()`
- Changes survive browser restarts after successful sync

### 4. **Crash Consistency**
- Uncommitted changes are not visible after crash (in-memory only)
- Data persisted via sync() survives crashes and restarts
- Must call sync() before page unload to ensure durability

## 🔧 Usage Examples

### JavaScript API (Recommended)

#### Explicit Transaction with Commit
```javascript
import init, { Database } from './pkg/sqlite_indexeddb_rs.js';

await init();
const db = await Database.newDatabase('myapp');

// Explicit transaction
await db.execute('BEGIN TRANSACTION');
await db.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
await db.execute("INSERT INTO users (name) VALUES ('Alice')");
await db.execute("INSERT INTO users (name) VALUES ('Bob')");
await db.execute('COMMIT'); // ✅ All changes committed to SQLite

// Persist to IndexedDB
await db.sync();

await db.close();
```

#### Transaction Rollback
```javascript
await db.execute('BEGIN TRANSACTION');
await db.execute("INSERT INTO users (name) VALUES ('Charlie')");
await db.execute("INSERT INTO users (name) VALUES ('Dave')");
await db.execute('ROLLBACK'); // ❌ All changes discarded
```

#### Implicit Transaction
```javascript
// Each statement is automatically wrapped in a transaction by SQLite
await db.execute("INSERT INTO users (name) VALUES ('Eve')"); // ✅ Auto-committed
await db.sync(); // Persist to IndexedDB
```

## 🏗️ Architecture

### Transaction Layers

1. **SQLite Transaction Manager**
   - Handles BEGIN/COMMIT/ROLLBACK semantics
   - Manages transaction isolation and ACID properties
   - Controls journal file operations

2. **IndexedDB VFS Layer**
   - Translates SQLite file operations to IndexedDB
   - Provides persistent storage backend
   - Handles async operations

3. **Block Storage System**
   - Data stored in 4KB blocks in IndexedDB
   - Each block has metadata with checksums
   - LRU cache (128 blocks default) for performance
   - Dirty blocks tracked until sync

### Persistence Flow

1. **Execute SQL** → SQLite processes transaction in memory
2. **COMMIT** → SQLite finalizes transaction (in-memory)
3. **sync()** → Writes dirty blocks to IndexedDB (persistent)

**Important**: Changes are not persisted to IndexedDB until `sync()` is called!

## ⚡ Performance Characteristics

### Transaction Overhead
- **BEGIN/COMMIT**: Minimal overhead, handled by SQLite
- **Block writes**: Batched and optimized for IndexedDB
- **Sync operations**: Asynchronous, non-blocking

### Concurrency
- Multiple database instances can read committed data
- Writer blocks are isolated until commit
- No reader-writer conflicts for committed data

## 🔒 ACID Properties

### **Atomicity** ✅
- SQLite transactions are all-or-nothing (within SQL)
- ROLLBACK completely undoes all in-transaction changes
- sync() atomically writes all dirty blocks to IndexedDB

### **Consistency** ✅
- SQLite enforces database constraints
- Foreign key relationships maintained
- Schema changes are transactional within SQLite

### **Isolation** ⚠️
- SQLite provides read committed isolation in-memory
- Multiple Database instances operate independently
- No cross-instance transaction coordination
- Last sync() wins for conflicting writes

### **Durability** ⚠️
- **Two-phase durability model**:
  1. SQL COMMIT → durable in SQLite's in-memory state
  2. sync() → durable in IndexedDB (persistent storage)
- **WITHOUT sync()**: Changes lost on page refresh/crash
- **WITH sync()**: Survives browser restarts and crashes

## 🚫 Limitations

### 1. **Manual Sync Required**
- **CRITICAL**: Changes are NOT automatically persisted to IndexedDB
- Must call `await db.sync()` after write operations to persist
- Without sync(), data is lost on page refresh/crash

### 2. **Journal Mode**
- MEMORY journal mode used (journal in-memory only)
- WAL mode not currently supported
- Journal operations don't persist until sync()

### 3. **Multi-Tab Concurrency Model** ✅
- **Leader Election**: Only leader tab can execute write operations
- **Write Guard**: Non-leaders are blocked from direct writes via `execute()`
- **Write Queue** (Phase 5.1): Non-leaders can use `queueWrite()` to forward writes to leader
- **Limitations of queueWrite**:
  - Each queued write is a **separate transaction** (not atomic with other queued writes)
  - Cannot use queueWrite for multi-statement transactions (BEGIN...COMMIT blocks)
  - 5-second default timeout (leader must respond within timeout)
  - Requires active leader tab (fails if no leader present)
- **For atomic transactions**: Tab must be leader or call `waitForLeadership()` first

### 4. **Browser Storage Limits**
- Subject to IndexedDB quota (typically 50MB-1GB)
- Large transactions may hit browser limits
- Monitor storage usage in production apps

### 5. **Performance Considerations**
- sync() is async and may take time for large datasets
- Frequent sync() calls can impact performance
- Batch operations when possible
- **queueWrite() overhead** (Phase 5.1):
  - Additional latency from BroadcastChannel communication
  - Leader must process and acknowledge each request
  - Not suitable for high-frequency writes (prefer direct leader execution)
  - Best for occasional writes from follower tabs

## 🧪 Testing

The transaction support is thoroughly tested with:

- ✅ **Explicit BEGIN/COMMIT transactions**
- ✅ **ROLLBACK transaction cancellation**
- ✅ **Implicit transaction auto-commit**
- ✅ **Cross-instance persistence verification**
- ✅ **Crash consistency guarantees**
- ✅ **Multiple database isolation**
- ✅ **Multi-tab transaction coordination**

Tests can be run with:
```bash
# WASM tests
wasm-pack test --chrome --headless

# Native tests
cargo test
cargo test --features fs_persist

# E2E tests
npm run test:e2e
```

## 🎯 Best Practices

### 1. **Always Call sync() After Writes**
```javascript
// ✅ GOOD: Persist changes immediately
await db.execute('INSERT INTO users VALUES (1, "Alice")');
await db.sync();

// ❌ BAD: Changes lost on page refresh!
await db.execute('INSERT INTO users VALUES (1, "Alice")');
// Forgot to sync!
```

### 2. **Batch Operations Before Sync**
```javascript
// ✅ GOOD: Multiple operations, single sync
await db.execute('BEGIN TRANSACTION');
await db.execute('INSERT INTO users VALUES (1, "Alice")');
await db.execute('INSERT INTO users VALUES (2, "Bob")');
await db.execute('INSERT INTO users VALUES (3, "Charlie")');
await db.execute('COMMIT');
await db.sync(); // Single sync for all changes
```

### 3. **Handle Errors Gracefully**
```javascript
try {
  await db.execute('BEGIN TRANSACTION');
  await db.execute('INSERT INTO users VALUES (1, "Alice")');
  await db.execute('COMMIT');
  await db.sync();
} catch (error) {
  await db.execute('ROLLBACK');
  console.error('Transaction failed:', error);
}
```

### 4. **Sync Before Page Unload**
```javascript
window.addEventListener('beforeunload', async (e) => {
  if (hasUnsyncedChanges) {
    await db.sync();
  }
});
```

### 5. **Monitor Storage Usage**
- IndexedDB quota: typically 50MB-1GB per origin
- Check storage API for available space
- Implement data cleanup strategies for large datasets

## 🔄 Multi-Tab Transactions

### Write Coordination
In multi-tab environments, only the leader tab can execute write operations (including transactions).

#### Option 1: Leader-Only Transactions
```javascript
const db = await Database.newDatabase('myapp');

// Check if leader before starting transaction
if (await db.isLeader()) {
  await db.execute('BEGIN TRANSACTION');
  await db.execute('INSERT INTO users VALUES (1, "Alice")');
  await db.execute('INSERT INTO orders VALUES (1, 1, 99.99)');
  await db.execute('COMMIT');
  await db.sync();
}
```

#### Option 2: Queue Transactional Writes (Phase 5.1)
```javascript
// Queue individual writes from any tab
// Note: Each queued write is a separate transaction
await db.queueWrite('INSERT INTO users VALUES (1, "Alice")');
await db.queueWrite('INSERT INTO orders VALUES (1, 1, 99.99)');

// For multi-statement transactions, wait for leadership:
await db.waitForLeadership();
await db.execute('BEGIN TRANSACTION');
await db.execute('INSERT INTO users VALUES (1, "Alice")');
await db.execute('INSERT INTO orders VALUES (1, 1, 99.99)');
await db.execute('COMMIT');
await db.sync();
```

### Important Notes
- **queueWrite** executes each SQL statement as a separate transaction
- For atomic multi-statement transactions, the tab must be the leader
- Followers can wait for leadership with `waitForLeadership()` before starting transactions
- All tabs see committed changes after sync via BroadcastChannel notifications

## 📚 Related Resources

- [SQLite Transaction Documentation](https://www.sqlite.org/lang_transaction.html)
- [IndexedDB API Specification](https://www.w3.org/TR/IndexedDB/)
- [DataSync Main README](../README.md) - Project overview
- [Multi-Tab Coordination Guide](MULTI_TAB_GUIDE.md) - Complete multi-tab guide with Phase 5 advanced features
- [Benchmark Results](BENCHMARK.md) - Performance comparisons
- [Demo Guide](../examples/DEMO_GUIDE.md) - Interactive demos