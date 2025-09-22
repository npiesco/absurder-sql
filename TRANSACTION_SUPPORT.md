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
- Committed transactions persist across database instances
- Data remains consistent after database close/reopen
- Changes are durable in IndexedDB storage

### 4. **Crash Consistency**
- Uncommitted changes are not visible to other database instances
- System ensures data integrity during unexpected failures
- Commit markers ensure only complete transactions are persisted

## 🔧 Usage Examples

### Explicit Transaction with Commit
```rust
// Using raw SQLite API with IndexedDB VFS
let vfs = IndexedDBVFS::new("my_database.db").await?;
vfs.register("indexeddb")?;

let (db, _) = open_with_vfs("file:my_database.db", "indexeddb");

unsafe {
    exec_sql(db, "BEGIN TRANSACTION");
    exec_sql(db, "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)");
    exec_sql(db, "INSERT INTO users (name) VALUES ('Alice')");
    exec_sql(db, "INSERT INTO users (name) VALUES ('Bob')");
    exec_sql(db, "COMMIT"); // ✅ All changes persisted

    sqlite3_close(db);
}
```

### Transaction Rollback
```rust
unsafe {
    exec_sql(db, "BEGIN TRANSACTION");
    exec_sql(db, "INSERT INTO users (name) VALUES ('Charlie')");
    exec_sql(db, "INSERT INTO users (name) VALUES ('Dave')");
    exec_sql(db, "ROLLBACK"); // ❌ All changes discarded
}
```

### Implicit Transaction
```rust
unsafe {
    // Each statement is automatically wrapped in a transaction
    exec_sql(db, "INSERT INTO users (name) VALUES ('Eve')"); // ✅ Auto-committed
}
```

## 🏗️ Architecture

### VFS Integration
- Transactions are handled by SQLite's built-in transaction manager
- IndexedDB VFS provides durable storage through commit markers
- Block-level storage ensures atomic operations

### Commit Markers
- Each database has a commit marker that advances on successful transactions
- Only blocks with valid commit markers are visible to reads
- Ensures crash consistency and isolation

### Block Storage
- Data is stored in 8KB blocks in IndexedDB
- Each block has metadata with checksums and commit markers
- Global storage registry manages multiple databases

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
- Transactions are all-or-nothing
- Failed transactions leave no partial changes
- Rollbacks completely undo all changes

### **Consistency** ✅
- Database constraints are enforced
- Foreign key relationships maintained
- Schema changes are transactional

### **Isolation** ✅
- Uncommitted changes are invisible to other instances
- Read committed isolation level
- No dirty reads or lost updates

### **Durability** ✅
- Committed changes persist in IndexedDB
- Survives browser restarts and crashes
- Cross-instance persistence guaranteed

## 🚫 Limitations

### 1. **Journal Mode Restrictions**
- WAL mode is not fully supported with current VFS
- MEMORY journal mode recommended for testing
- DELETE journal mode works for production

### 2. **Concurrency Model**
- Single-writer, multiple-reader model
- No true concurrent writers to same database
- Cross-instance reads of committed data only

### 3. **Browser Storage Limits**
- Subject to IndexedDB storage quotas
- Large transactions may hit browser limits
- Consider chunking very large operations

### 4. **Async Constraints**
- Some operations are inherently asynchronous
- Sync operations may have performance implications
- Background persistence happens asynchronously

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

### 1. **Keep Transactions Short**
- Minimize transaction duration to reduce conflicts
- Batch related operations within single transactions
- Avoid user interaction within transactions

### 2. **Handle Errors Gracefully**
- Always check return codes from SQL operations
- Use ROLLBACK for error recovery
- Implement retry logic for transient failures

### 3. **Use Appropriate Isolation**
- Read committed isolation is default and recommended
- Consider transaction boundaries carefully
- Avoid long-running read transactions

### 4. **Monitor Storage Usage**
- IndexedDB has browser-specific quota limits
- Implement storage monitoring for production apps
- Consider data archival strategies for large datasets

## 📚 References

- [SQLite Transaction Documentation](https://www.sqlite.org/lang_transaction.html)
- [IndexedDB API Specification](https://www.w3.org/TR/IndexedDB/)
- [DataSync Architecture Overview](./README.md)