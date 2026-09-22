# Transaction Support in AbsurderSQL

AbsurderSQL uses SQLite transactions with separately awaited browser persistence
to IndexedDB or worker Hybrid/OPFS. **SQL COMMIT and durable backend
acknowledgement are different boundaries.** This guide describes the current
browser API; [Native qualification](NATIVE_QUALIFICATION.md) records the exact
qualified packages and real restart/failure coverage.

## Supported Features

### 1. **Explicit Transactions**
- `BEGIN TRANSACTION` / `BEGIN` - Start a new transaction
- `COMMIT` - Commit all changes made within the transaction
- `ROLLBACK` - Discard all changes made within the transaction

### 2. **Implicit Transactions**
- Single statements (INSERT, UPDATE, DELETE) are automatically wrapped in implicit transactions
- Changes are automatically committed after successful execution

### 3. **Transaction Persistence**  
- Committed transactions (via COMMIT) are in SQLite's in-memory state
- Await `sync()` after COMMIT to observe persistence success or failure for the
  selected backend; background VFS/auto-sync work is not a caller acknowledgement
- Changes survive browser restarts after successful sync

### 4. **Crash Consistency**
- SQLite recovery and backend commit metadata determine the recovered state
- A successful awaited sync establishes the acknowledged durable state
- A failed/interrupted operation is not acknowledged success; recovery may
  preserve a newer commit if persistence completed before response delivery
- Await persistence during normal application work, not only during page unload

## Usage Examples

### JavaScript API (Recommended)

#### Explicit Transaction with Commit
```javascript
import init, { Database } from '@npiesco/absurder-sql';

await init();
const db = await Database.newDatabase('myapp');

// Explicit transaction
await db.execute('BEGIN TRANSACTION');
await db.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
await db.execute("INSERT INTO users (name) VALUES ('Alice')");
await db.execute("INSERT INTO users (name) VALUES ('Bob')");
await db.execute('COMMIT'); // All changes committed to SQLite

// Persist through the selected backend
await db.sync();

await db.close();
```

#### Transaction Rollback
```javascript
await db.execute('BEGIN TRANSACTION');
await db.execute("INSERT INTO users (name) VALUES ('Charlie')");
await db.execute("INSERT INTO users (name) VALUES ('Dave')");
await db.execute('ROLLBACK'); // All changes discarded
```

#### Implicit Transaction
```javascript
// Each statement is automatically wrapped in a transaction by SQLite
await db.execute("INSERT INTO users (name) VALUES ('Eve')"); // Auto-committed
await db.sync(); // Persist through the selected backend
```

## Architecture

### Transaction Layers

1. **SQLite Transaction Manager**
   - Handles BEGIN/COMMIT/ROLLBACK semantics
   - Manages transaction isolation and ACID properties
   - Controls journal file operations

2. **IndexedDB VFS Layer**
   - Buffers synchronous SQLite I/O in memory
   - Dispatches asynchronous persistence to the selected backend
   - WAL/shared-memory state remains runtime-owned

3. **Block Storage System**
   - Data stored in 4KB blocks, with IndexedDB and optional OPFS persistence
   - Each block has metadata with checksums
   - LRU cache for block reads
   - Dirty blocks tracked until sync

### Persistence Flow

1. **Execute SQL** → SQLite processes transaction in memory
2. **COMMIT** → SQLite finalizes transaction (in-memory)
3. **await sync()** → Persists through the selected backend and reports failure

**Important**: Do not infer durability from successful SQL execution or an
auto-sync being scheduled. Await sync before reporting a save as complete.

## ⚡ Performance Characteristics

### Transaction Overhead
- **BEGIN/COMMIT**: Minimal overhead, handled by SQLite
- **Block writes**: Batched and optimized for IndexedDB
- **Sync operations**: Asynchronous, non-blocking

### Concurrency
- Main-thread tabs use leader election for data writes
- Same-runtime handles can share a pooled SQLite connection and transaction state
- Separate runtimes can retain stale page caches; followers must reload after a
  durable change notification
- Readers/transactions can prevent checkpoints; serialize owner operations

## ACID Properties

### **Atomicity** [Supported]
- SQLite transactions are all-or-nothing (within SQL)
- ROLLBACK completely undoes all in-transaction changes
- The IndexedDB persistence transaction commits blocks, metadata, and marker
  together; synchronous request failures and aborts reject
- Hybrid writes OPFS before IndexedDB. These stores are not one atomic
  transaction; recovery validates OPFS against authoritative metadata

### **Consistency** [Supported]
- SQLite enforces database constraints
- Foreign key constraints require SQLite's `PRAGMA foreign_keys = ON`
- Schema changes are transactional within SQLite

### **Isolation** [Limited]
- SQLite controls connection/transaction isolation; this is not a generic
  read-committed promise across independently cached browser runtimes
- A shared same-runtime connection does not give each handle its own transaction
- Leader-only writes are the supported tab coordination model; bypassing the
  guard is not a supported “last sync wins” conflict-resolution protocol

### **Durability** [Two-Step]
- **Two-phase durability model**:
  1. SQL COMMIT → committed in the live SQLite connection
  2. awaited sync() → acknowledged backend persistence
- **WITHOUT an acknowledged sync**: Do not promise survival across termination
- **WITH successful sync**: Real restart tests verify the acknowledged data;
  origin eviction or user-cleared browser storage remains outside that guarantee

## Limitations

### 1. **Awaited Durability Required**
- Background persistence can occur, but scheduling is not acknowledgement
- Call `await db.sync()` after COMMIT to observe backend errors
- Never replay a mutation solely because its later sync failed

### 2. **Journal Mode**
- Packaged JavaScript constructors request **WAL**
- Rust `DatabaseConfig::default()` requests **MEMORY**; callers can configure WAL
- The current in-memory WAL buffer has a 16 MiB bound, not a database-size limit
- Portable export requires a successful complete PASSIVE checkpoint; only the
  returned snapshot's header becomes rollback format, not the live database

### 3. **Multi-Tab Concurrency Model** [Supported]
- **Leader Election**: Data writes should run on the elected main-thread owner
- **Write Guard**: SQLite statement metadata identifies data DML, including CTE
  and commented DML, for both execution methods; it is not a universal
  schema/PRAGMA/transaction ownership lock
- **Write Queue**: Non-leaders can use `queueWrite()` to forward writes to leader
- **Limitations of queueWrite**:
  - Each request executes one statement; separate requests are not an atomic batch
  - Cannot use queueWrite for multi-statement transactions (BEGIN...COMMIT blocks)
  - 5-second default timeout (leader must respond within timeout)
  - Requires active leader tab (fails if no leader present)
  - Acknowledges execution, not a separate awaited durable sync
  - A timeout does not prove the SQL was never executed; blind retry can duplicate it
- **For atomic transactions**: Tab must be leader or call `waitForLeadership()` first

### 4. **Browser Storage Limits**
- Subject to origin/browser quota, available disk, and runtime memory
- Large transactions may hit browser limits
- Monitor storage usage in production apps

### 5. **Performance Considerations**
- sync() is async and may take time for large datasets
- Frequent sync() calls can impact performance
- Batch operations when possible
- **queueWrite() overhead**:
  - Additional latency from BroadcastChannel communication
  - Leader must process and acknowledge each request
  - Not suitable for high-frequency writes (prefer direct leader execution)
  - Best for occasional writes from follower tabs

## Testing

The transaction support is thoroughly tested with:

- **[✓]** **Explicit BEGIN/COMMIT transactions**
- **[✓]** **ROLLBACK transaction cancellation**
- **[✓]** **Implicit transaction auto-commit**
- **[✓]** **Cross-instance persistence verification**
- **[✓]** **Crash consistency guarantees**
- **[✓]** **Multiple database isolation**
- **[✓]** **Multi-tab transaction coordination**

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

## Best Practices

### 1. **Always Call sync() After Writes**
```javascript
// GOOD: Persist changes immediately
await db.execute('INSERT INTO users VALUES (1, "Alice")');
await db.sync();

// BAD: No durable acknowledgement before returning success.
await db.execute('INSERT INTO users VALUES (1, "Alice")');
// No awaited sync; background persistence is not a save guarantee.
```

### 2. **Batch Operations Before Sync**
```javascript
// GOOD: Multiple operations, single sync
await db.execute('BEGIN TRANSACTION');
await db.execute('INSERT INTO users VALUES (1, "Alice")');
await db.execute('INSERT INTO users VALUES (2, "Bob")');
await db.execute('INSERT INTO users VALUES (3, "Charlie")');
await db.execute('COMMIT');
await db.sync(); // Single sync for all changes
```

### 3. **Handle Errors Gracefully**
```javascript
await db.execute('BEGIN TRANSACTION');
try {
  await db.execute('INSERT INTO users VALUES (1, "Alice")');
  await db.execute('COMMIT');
} catch (error) {
  try {
    await db.execute('ROLLBACK');
  } catch (rollbackError) {
    console.error('Rollback also failed:', String(rollbackError));
  }
  throw error;
}

try {
  await db.sync();
} catch (error) {
  // COMMIT already succeeded. Do not issue ROLLBACK or repeat the INSERT.
  // Surface the failure; after addressing its cause, explicitly resync this
  // still-live runtime if appropriate.
  console.error('Persistence not acknowledged:', String(error));
  throw error;
}
```

### 4. **Save Before Reporting Success**

Browsers do not wait for an async `beforeunload` handler. Lifecycle auto-sync is
best effort, not the durability boundary.

```javascript
await db.sync();
showSavedState();
```

### 5. **Monitor Storage Usage**
- Use `navigator.storage.estimate()` for advisory origin quota/usage
- Quota is not available WASM memory and estimates do not reserve space
- Implement data cleanup strategies for large datasets

## Multi-Tab Transactions

### Write Coordination
Keep the complete BEGIN/DML/COMMIT/sync sequence on one serialized owner.
Do not interleave transactions through pooled same-runtime handles or forward
their pieces as separate queued requests.

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

#### Option 2: Queue Transactional Writes
```javascript
// Queue individual writes from any tab
// These are independent statements, not one atomic transaction or durable ack.
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
- **queueWrite** executes a single statement, not a multi-request transaction
- For atomic multi-statement transactions, the tab must be the leader
- Followers can wait for leadership with `waitForLeadership()` before starting transactions
- Raw followers reload persisted state before reading after a notification;
  `MultiTabDatabase` does that refresh for its managed handles

## Related Resources

- [SQLite Transaction Documentation](https://www.sqlite.org/lang_transaction.html)
- [IndexedDB API Specification](https://www.w3.org/TR/IndexedDB/)
- [AbsurderSQL Main README](../README.md) - Project overview
- [Multi-Tab Coordination Guide](MULTI_TAB_GUIDE.md) - Complete multi-tab guide with advanced features
- [Benchmark Results](BENCHMARK.md) - Performance comparisons
- [Demo Guide](../examples/DEMO_GUIDE.md) - Interactive demos