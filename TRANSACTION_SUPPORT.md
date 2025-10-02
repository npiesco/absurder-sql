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
   - Data stored in 8KB blocks in IndexedDB
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

### 3. **Concurrency Model**
- Single database instance per page recommended
- Multiple Database instances access same IndexedDB store
- Last sync() wins for conflicting writes
- No multi-tab write coordination

### 4. **Browser Storage Limits**
- Subject to IndexedDB quota (typically 50MB-1GB)
- Large transactions may hit browser limits
- Monitor storage usage in production apps

### 5. **Performance Considerations**
- sync() is async and may take time for large datasets
- Frequent sync() calls can impact performance
- Batch operations when possible

## 🧪 Testing

The transaction support is thoroughly tested with:

- ✅ **Explicit BEGIN/COMMIT transactions**
- ✅ **ROLLBACK transaction cancellation**
- ✅ **Implicit transaction auto-commit**
- ✅ **Cross-instance persistence verification**
- ✅ **Crash consistency guarantees**
- ✅ **Multiple database isolation**

Tests can be run with:
```bash
wasm-pack test --chrome --headless --test transaction_support_test
wasm-pack test --chrome --headless --test wasm_vfs_transactional_tests
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

## 📚 References

- [SQLite Transaction Documentation](https://www.sqlite.org/lang_transaction.html)
- [IndexedDB API Specification](https://www.w3.org/TR/IndexedDB/)
- [DataSync Architecture Overview](./README.md)