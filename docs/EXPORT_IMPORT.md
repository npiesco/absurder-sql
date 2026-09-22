# Export/Import Guide

**AbsurderSQL's export/import feature enables full database backup, migration, and data portability in the browser.**

AbsurderSQL allows you to:
- Export entire databases to standard SQLite files
- Import databases from SQLite files
- Migrate data between tabs, browsers, or devices
- Create backups for disaster recovery
- Share databases as downloadable files

## Table of Contents

- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Architecture](#architecture)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Limitations](#limitations)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Basic Export

```javascript
import init, { Database } from '@npiesco/absurder-sql';

await init();
const db = await Database.newDatabase('myapp.db');

// Create some data
await db.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
await db.execute("INSERT INTO users VALUES (1, 'Alice')");

// Export to Uint8Array
const exportedData = await db.exportToFile();

// Download as file
const blob = new Blob([exportedData], { type: 'application/octet-stream' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'myapp.db';
a.click();
URL.revokeObjectURL(url);

await db.close();
```

### Basic Import

```javascript
import init, { Database } from '@npiesco/absurder-sql';

await init();

// Get file from user (e.g., via <input type="file">)
const fileInput = document.getElementById('dbFile');
const file = fileInput.files[0];
const arrayBuffer = await file.arrayBuffer();
const uint8Array = new Uint8Array(arrayBuffer);

// Import and use immediately (no reopen needed)
let db = await Database.newDatabase('myapp.db');
await db.importFromFile(uint8Array);

// Database is immediately usable after import
const result = await db.execute('SELECT * FROM users');
console.log(result.rows);

await db.close();
```

---

## API Reference

### Query and value fidelity

Browser `execute` and `executeWithParams` collect every row returned by SQLite,
including RETURNING, CTEs, VALUES, and PRAGMAs. TEXT parameters and results retain
embedded NUL and valid UTF-8; BLOB preserves arbitrary bytes, including empty
blobs. Invalid UTF-8 stored as SQLite TEXT rejects rather than silently replacing
bytes. Read-only results do not inherit `affectedRows` from an earlier write.
Only the first prepared statement is executed; use separate calls and explicit
transactions instead of assuming batch semantics.

Storage errors are not successful syncs. In particular, an OPFS quota refusal
rejects with its cause and closes the access handle. After addressing the quota,
the caller can explicitly sync the still-live runtime without replaying its SQL
mutation. A terminated runtime can only recover the last durable state.

`exportToFile()` produces a standalone rollback-journal-format snapshot after a
real SQLite PASSIVE checkpoint succeeds and reports every WAL frame checkpointed.
The live database keeps its journal mode. If a transaction or reader prevents
checkpoint completion,
export rejects; finish that transaction before explicitly exporting again.
Only the returned copy's SQLite file-format version bytes 18 and 19 are normalized, so
read-only consumers do not need WAL/SHM sidecars or an `immutable=1` workaround.

See [SQLite/browser stabilization](SQLITE_STABILIZATION.md) for the actual
RED/GREEN evidence and buffer measurements, and
[Native qualification](NATIVE_QUALIFICATION.md) for the repaired candidate's
original-Apple and isolated-Windows results.

### `Database.deleteDatabase(name: string)`

Physically removes one database. Close its connections in **all tabs and workers**
before calling this static method, and prevent new opens or writes until it finishes.
Names with and without the `.db` suffix identify the same database.

```javascript
await db.close();
await Database.deleteDatabase('myapp.db');
```

The returned `Promise<void>` resolves only after the OPFS mirror is removed and
the shared IndexedDB `block_storage` transaction commits deletion of that
database's blocks, metadata, and commit markers. The library then clears its
local storage registry, connection pool, allocation map, caches, WAL/shared-memory
state, and database-list entry. Prefix-sharing neighbors are not deleted, and
late disposal of an old wrapper cannot close a replacement connection. Reopening the name creates an
empty database, including after browser restart. Repeated deletion is safe.

OPFS locks, IndexedDB open/transaction failures, and database-list failures reject
the promise; they are not successful deletion. There is no atomic transaction
across OPFS, IndexedDB, and localStorage: a rejection can follow partial cleanup.
Do not interpret a rejection as proof that the original database is intact, or
silently replace it with an empty database. An OPFS removal failure occurs before
the IndexedDB recovery copy or in-memory state is cleared.

The real browser restart and failure tests run with
`npx playwright test --config playwright.deletion.config.js`. Set
`PLAYWRIGHT_EXECUTABLE_PATH` to use an installed Chromium-compatible browser.
The tests use short, isolated temporary profiles and never an authenticated profile.

### `db.exportToFile()`

Exports the entire database to a standard SQLite file format.

**Returns**: `Promise<Uint8Array>` - The exported database as a byte array

**Behavior**:
- Exports all tables, indexes, triggers, and data
- Produces a standard SQLite 3 file compatible with other SQLite tools
- Serializes export/import through a Web Lock on the main thread; workers use
  a runtime-local lock, not a cross-worker lock
- Rejects refused or incomplete WAL checkpoints before returning a snapshot
- Respects `DatabaseConfig.max_export_size_bytes` (default: 2 GiB); the packaged
  JavaScript constructors accept names, not configuration objects

**Example**:
```javascript
const exportedData = await db.exportToFile();
console.log(`Exported ${exportedData.length} bytes`);
```

**Throws**:
- A rejected promise if database size exceeds the configured limit
- A rejected promise if lock acquisition, checkpoint, sync, or export fails

JavaScript rejections are not uniformly `Error` instances; use `String(error)`
when displaying a failure rather than assuming `error.message` exists.

---

### `db.importFromFile(fileData: Uint8Array)`

Imports a database from a standard SQLite file, replacing all existing data.

**Parameters**:
- `fileData` - Uint8Array containing SQLite database file

**Returns**: `Promise<void>`

**Behavior**:
- **Destructive operation**: Replaces ALL existing database data
- Temporarily closes and reopens the database connection internally
- Validates SQLite file header before import
- Uses the same main-thread Web Lock / worker-local serialization as export
- Persists through the selected backend and clears stale OPFS mirrors
- Clears all caches and forces fresh reload
- Database is immediately usable after import (no reopen needed)

**Example**:
```javascript
let db = await Database.newDatabase('myapp.db');
await db.importFromFile(uint8Array);

// Database is immediately usable after import
const result = await db.execute('SELECT * FROM imported_table');
```

**Throws**:
- A rejected promise if the file fails SQLite validation
- A rejected promise if lock acquisition, storage replacement, or reopen fails

Use a single coordinated owner during import: close other handles, tabs, and
workers first. Replacement is destructive, not an atomic transaction spanning
OPFS and IndexedDB. A rejected import can leave the handle closed or storage
partially replaced; retain a separate verified backup.

---

## Architecture

### Export Process

```
1. Acquire export/import lock (prevents concurrent export/import)
2. Run a PASSIVE checkpoint for main; require success and complete frame counts
3. Reload the block cache from the checkpointed state and await backend sync
4. Validate size and copy allocated blocks into an owned SQLite snapshot
5. Set only snapshot bytes 18/19 to rollback-journal format
6. Return Uint8Array and release lock
```

The exported file is a **standard SQLite 3 database file** that can be:
- Opened with sqlite3 CLI
- Imported into other SQLite tools
- Imported back into AbsurderSQL
- Opened with rusqlite (native Rust)

### Import Process

```
1. Acquire export/import lock (prevents concurrent export/import)
2. Close the current connection and remove its pooled connection
3. Validate the SQLite file before clearing the old block namespace
4. Clear this database's memory/IndexedDB state and stale OPFS mirror
5. Build imported blocks, allocation state, checksums, and fresh metadata
6. Persist via IndexedDB or the selected Hybrid/OPFS path
7. Reopen the connection internally and release lock
```

The database is immediately usable after import completes.

### Locking Mechanism

`src/storage/export_import_lock.rs::with_lock` uses an exclusive Web Lock named
for the database in a Window context. It does not store a lock record in
IndexedDB and does not impose a 30-second acquisition timeout. In a Worker,
it uses a runtime-local lock with a 10ms wait between acquisition attempts.

That fallback does not coordinate independent workers or a worker with a tab.
Neither lock serializes every SQL call, close, or delete. Applications must
serialize those operations at the database owner; the PWA does this with its
coordinator and dedicated runtime worker.

---

## Examples

### Example 1: Export with Size Reporting

The JavaScript export method returns the complete buffer; it does not expose a
progress callback. This example reports size after completion.

See `examples/export_import.js` - `exportWithErrorHandling()`

```javascript
async function exportWithProgress() {
    const db = await Database.newDatabase('myapp.db');
    
    try {
        const exported = await db.exportToFile();
        const sizeInMB = exported.length / (1024 * 1024);
        
        console.log(`Export size: ${sizeInMB.toFixed(2)} MB`);
        
        if (sizeInMB > 100) {
            console.warn('Large export detected');
        }
        
        // Check storage quota
        const estimate = await navigator.storage.estimate();
        const availableMB = (estimate.quota - estimate.usage) / (1024 * 1024);
        console.log(`Available storage: ${availableMB.toFixed(2)} MB`);
        
        // Download file
        const blob = new Blob([exported], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'backup.db';
        a.click();
        URL.revokeObjectURL(url);
        
    } catch (error) {
        const message = String(error);
        if (message.toLowerCase().includes('quota')) {
            console.error('Storage quota exceeded');
        } else if (message.toLowerCase().includes('size')) {
            console.error('Database too large');
        } else {
            console.error('Export failed:', message);
        }
    } finally {
        await db.close();
    }
}
```

### Example 2: Import with Validation

See `examples/export_import.js` - `importWithProgress()`

```javascript
async function importWithValidation(file) {
    try {
        console.log(`Importing: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
        
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Import
        const db = await Database.newDatabase('myapp.db');
        await db.importFromFile(uint8Array);

        // Database is immediately usable after import
        // Verify import
        const result = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('Imported tables:', result.rows.map(r => r.values[0].value));
        
        await db.close();
        
    } catch (error) {
        console.error('Import failed:', String(error));
    }
}
```

### Example 3: Export/Import Roundtrip Test

See `examples/export_import.js` - `validateRoundtrip()`

```javascript
async function testRoundtrip() {
    // Create original database
    const db1 = await Database.newDatabase('original.db');
    await db1.execute('CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT)');
    await db1.execute("INSERT INTO test VALUES (1, 'alpha'), (2, 'beta')");
    
    // Export
    const exported = await db1.exportToFile();
    await db1.close();
    
    // Import to new database
    const db2 = await Database.newDatabase('imported.db');
    await db2.importFromFile(exported);

    // Verify (no reopen needed)
    const result = await db2.execute('SELECT COUNT(*) as count FROM test');
    const count = result.rows[0].values[0].value;
    
    console.log(count === 2 ? 'Roundtrip PASSED' : 'Roundtrip FAILED');
    
    await db2.close();
}
```

### Example 4: Backup and Restore

See `examples/export_import.js` - `backupRestoreWorkflow()`

```javascript
async function createBackup() {
    const db = await Database.newDatabase('app_data.db');
    
    // Export database
    const backup = await db.exportToFile();
    const timestamp = new Date().toISOString();
    
    // Tiny demonstration only: localStorage is synchronous and quota-limited.
    // Use a downloaded file or a separate durable backup service for real backups.
    localStorage.setItem('database_backup', JSON.stringify({
        timestamp,
        size: backup.length,
        data: Array.from(backup)
    }));
    
    await db.close();
    console.log(`Backup created: ${timestamp}`);
}

async function restoreBackup() {
    // Retrieve backup
    const storedBackup = JSON.parse(localStorage.getItem('database_backup'));
    const backupData = new Uint8Array(storedBackup.data);
    
    // Restore database
    const db = await Database.newDatabase('app_data.db');
    await db.importFromFile(backupData);

    // Verify restoration (no reopen needed)
    const result = await db.execute('SELECT COUNT(*) as count FROM users');
    console.log(`Restored ${result.rows[0].values[0].value} records`);
    
    await db.close();
}
```

---

## Best Practices

### 1. Database is Usable Immediately After Import

Import automatically handles connection management internally. No manual reopen is needed:

```javascript
const db = await Database.newDatabase('myapp.db');
await db.importFromFile(data);

// Database is immediately usable
const result = await db.execute('SELECT * FROM imported_table');
```

### 2. Handle Export Size Limits

Rust WASM embedders can configure a limit through `DatabaseConfig`:

```rust
let config = absurder_sql::DatabaseConfig {
    name: "large_app.db".to_string(),
    max_export_size_bytes: Some(64 * 1024 * 1024),
    ..Default::default()
};
let db = absurder_sql::Database::new(config).await?;
```

The packaged JavaScript API is `Database.newDatabase(name: string)` (or a
named backend constructor), not `newDatabase(config)`. It exposes no export-limit
setter. The implementation uses **2 GiB** when the Rust option is `None`;
`null`/`None` is not an unlimited-export switch. The limit is a policy check,
not evidence that a browser can safely allocate that much memory.

### 3. Validate Files Before Import

```javascript
function validateSQLiteFile(uint8Array) {
    // Check SQLite header magic number
    const header = new TextDecoder().decode(uint8Array.slice(0, 16));
    if (!header.startsWith('SQLite format 3')) {
        throw new Error('Not a valid SQLite database');
    }
    
    // Check file size
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (uint8Array.length > maxSize) {
        throw new Error(`File too large: ${(uint8Array.length / (1024 * 1024)).toFixed(2)}MB`);
    }
}
```

### 4. Use Error Handling

```javascript
try {
    const exported = await db.exportToFile();
} catch (error) {
    const message = String(error);
    if (message.toLowerCase().includes('size')) {
        console.error('Database exceeds size limit');
    } else {
        console.error('Export failed:', message);
    }
}
```

### 5. Estimate Storage Before Import or Backup Storage

Origin quota is not available JavaScript/WASM memory. This estimate is advisory,
not a reservation or proof that export allocation will succeed.

```javascript
if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const available = estimate.quota - estimate.usage;
    const dbSize = 50 * 1024 * 1024; // Estimated size
    
    if (dbSize > available) {
        throw new Error('Not enough storage space');
    }
}
```

### 6. Clean Up Resources

```javascript
try {
    const exported = await db.exportToFile();
    const url = URL.createObjectURL(new Blob([exported]));
    // Use URL...
    URL.revokeObjectURL(url); // Always revoke!
} finally {
    await db.close(); // Always close!
}
```

---

## Limitations

### Size Limits

- **Default Maximum**: 2 GiB per export
  - Configurable through the Rust `DatabaseConfig.max_export_size_bytes`
  - `None` selects the default limit, not unlimited output
  - Not a qualified database-size or available-memory ceiling

- **Browser Memory**: Large exports load entirely into memory
  - For very large databases (>100MB), monitor memory usage
  - Consider periodic backups of smaller databases

### Performance

- Export includes checkpointing, durable sync, block reads, and a complete
  returned buffer; import includes storage replacement and reopen
- No current cross-browser throughput or peak-memory guarantee is claimed
- Serialize other database operations explicitly while export/import runs

### Browser Compatibility

Current qualification uses real Chromium browser processes and native SQLite
oracles, including the original Apple runtime's read-only consumer. Resource
characterization uses 1, 8, and 32 MiB incompressible payload fixtures, not a
500MB supported-size claim or a Firefox/Safari qualification.
See [Native qualification](NATIVE_QUALIFICATION.md) for exact host/browser scope.

### Multi-Tab Coordination

- Main-thread operations with the same lock name serialize through Web Locks
- Worker fallback locks are local to that runtime, not origin-wide
- Lock/storage failures reject rather than producing a successful snapshot
- Use one coordinated owner, with other connections closed during replacement

---

## Troubleshooting

### Error: "Database too large to export"

**Cause**: Database size exceeds `max_export_size_bytes` limit

**Solution**: Reduce the database or set an appropriate Rust-side limit before
opening it. JavaScript constructors do not accept a configuration object.

```javascript
// Reclaim unused space before exporting; keep the operation on the owner.
await db.execute('VACUUM'); // Reclaim unused space
```

### Export/Import Waits for a Lock

**Possible cause**: Another operation still owns the same lock.

**Solution**:
- Identify and finish the owning operation; do not launch overlapping retries
- Serialize application calls and inspect the original rejection, if any
- There is no built-in 30-second lock timeout. An application-side timeout does
  not cancel an already-running operation

### Error: "Export checkpoint failed" or "Export checkpoint incomplete"

**Cause**: SQLite refused the PASSIVE checkpoint or not all WAL frames could be
checkpointed, for example while a transaction or reader is active.

**Solution**: Complete or explicitly roll back the transaction, release the
reader, and then request another export. Do not patch a live database header,
discard WAL bytes, or use `immutable=1` to hide an incomplete snapshot.

### Error: "Not a valid SQLite database"

**Cause**: Imported file is not a valid SQLite file

**Solution**:
```javascript
// Validate before import
function validateSQLiteFile(data) {
    const header = new TextDecoder().decode(data.slice(0, 16));
    if (!header.startsWith('SQLite format 3')) {
        throw new Error('Invalid SQLite file');
    }
}

validateSQLiteFile(uint8Array);
await db.importFromFile(uint8Array);
```

### Import Completes But Data is Missing

**Possible cause**: Wrong input file, schema/query mismatch, or an unhandled
rejection. A successful promise alone is not an application-level data check.

**Solution**:
```javascript
const db = await Database.newDatabase('myapp.db');

try {
    await db.importFromFile(data);
    // Verify the import succeeded
    const result = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Imported tables:', result.rows.map(r => r.values[0].value));
} catch (error) {
    console.error('Import failed:', String(error));
}
```

### Out of Memory During Export

**Cause**: Database too large for available browser memory

**Solution**:
- Close unnecessary tabs
- Use a browser with more available memory
- Split data into smaller databases
- Check available memory:
  ```javascript
  if (performance && performance.memory) {
      const memoryMB = performance.memory.usedJSHeapSize / (1024 * 1024);
      console.log(`Memory used: ${memoryMB.toFixed(2)} MB`);
  }
  ```

### Storage Quota Exceeded

**Possible cause**: Insufficient origin storage for IndexedDB or OPFS persistence.

**Solution**:
```javascript
// Check quota before import
const estimate = await navigator.storage.estimate();
const availableMB = (estimate.quota - estimate.usage) / (1024 * 1024);
console.log(`Available: ${availableMB.toFixed(2)} MB`);

if (fileSize > estimate.quota - estimate.usage) {
    // Request eviction protection, not extra quota.
    await navigator.storage.persist();
    
    // Or ask user to free up space
    alert('Please free up storage space');
}
```

---

## Interactive Demos

### Full-Featured Demo

`examples/export_import_demo.html` - Complete 4-step wizard:
1. Create sample database with tables, indexes, triggers
2. Export database with progress tracking
3. Import database from file upload
4. Verify imported data integrity

**Run**: Open http://localhost:8080/examples/export_import_demo.html

### Automated Tests

`examples/test_export_import_examples.html` - Validation suite:
- Test 1: Basic Export
- Test 2: Basic Import
- Test 3: Export/Import Roundtrip
- Test 4: Complex Schema Preservation
- Test 5: File Size Validation

**Run**: Open http://localhost:8080/examples/test_export_import_examples.html

### JavaScript Examples

`examples/export_import.js` - 9 production examples:
- `basicExportExample()` - Simple export workflow
- `basicImportExample()` - Simple import workflow
- `exportWithErrorHandling()` - Production error handling
- `importWithProgress()` - Progress tracking
- `validateRoundtrip()` - Data integrity verification
- `validateFileSize()` - Size validation
- `handleConcurrentOperations()` - Concurrency handling
- `multiTabSafetyExample()` - Multi-tab coordination
- `backupRestoreWorkflow()` - Complete backup/restore

---

## Portability Boundary

The qualified AbsurderSQL workflow exports standard standalone SQLite bytes and
imports a complete database through its selected backend. It is a snapshot
transfer mechanism, not automatic multi-device synchronization or conflict
resolution. Keep backups outside the database's own origin if they must survive
origin eviction or user-cleared browser data.

---

## See Also

- [Multi-Tab Guide](MULTI_TAB_GUIDE.md) - Multi-tab coordination
- [Dual Mode Guide](DUAL_MODE.md) - Browser + Native persistence
- [Transaction Support](TRANSACTION_SUPPORT.md) - Transaction handling
- [Benchmark Results](BENCHMARK.md) - Performance metrics

---

## License

AGPL-3.0 - See [LICENSE.md](../LICENSE.md)
