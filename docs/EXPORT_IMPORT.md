# Export/Import Guide

**AbsurderSQL's export/import feature enables full database backup, migration, and data portability in the browser.**

Unlike absurd-sql which provides no export/import functionality, AbsurderSQL allows you to:
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

// Import (this closes the current connection)
let db = await Database.newDatabase('myapp.db');
await db.importFromFile(uint8Array);

// Reopen to use imported data
db = await Database.newDatabase('myapp.db');
const result = await db.execute('SELECT * FROM users');
console.log(result.rows);

await db.close();
```

---

## API Reference

### `Database.exportToFile()`

Exports the entire database to a standard SQLite file format.

**Returns**: `Promise<Uint8Array>` - The exported database as a byte array

**Behavior**:
- Exports all tables, indexes, triggers, and data
- Produces a standard SQLite 3 file compatible with other SQLite tools
- Uses export/import lock to prevent concurrent operations (30 second timeout)
- Respects `DatabaseConfig.max_export_size_bytes` limit (default: 2GB)

**Example**:
```javascript
const exportedData = await db.exportToFile();
console.log(`Exported ${exportedData.length} bytes`);
```

**Throws**:
- `DatabaseError` if database size exceeds configured limit
- `DatabaseError` if export/import lock acquisition times out
- `DatabaseError` if SQLite export operation fails

---

### `Database.importFromFile(fileData: Uint8Array)`

Imports a database from a standard SQLite file, replacing all existing data.

**Parameters**:
- `fileData` - Uint8Array containing SQLite database file

**Returns**: `Promise<void>`

**Behavior**:
- **Destructive operation**: Replaces ALL existing database data
- Closes the current database connection
- Validates SQLite file header before import
- Uses export/import lock to prevent concurrent operations (30 second timeout)
- Clears all caches and forces fresh reload on next open
- Database must be reopened after import to query data

**Example**:
```javascript
let db = await Database.newDatabase('myapp.db');
await db.importFromFile(uint8Array);
// db connection is now closed

// Reopen to use imported data
db = await Database.newDatabase('myapp.db');
```

**Throws**:
- `DatabaseError` if file is not a valid SQLite database
- `DatabaseError` if import/export lock acquisition times out
- `DatabaseError` if SQLite import operation fails

**Important**: Always reopen the database after import - the connection is closed automatically.

---

## Architecture

### Export Process

```
1. Acquire export/import lock (prevents concurrent export/import)
2. Read database size and validate against limit
3. Call SQLite VFS to serialize database to memory
4. Return Uint8Array with complete SQLite file
5. Release lock
```

The exported file is a **standard SQLite 3 database file** that can be:
- Opened with sqlite3 CLI
- Imported into other SQLite tools
- Imported back into AbsurderSQL
- Opened with rusqlite (native Rust)

### Import Process

```
1. Acquire export/import lock (prevents concurrent export/import)
2. Validate SQLite file header
3. Close current database connection
4. Clear all IndexedDB storage for this database
5. Write imported blocks to IndexedDB
6. Clear all caches (LRU, checksums, metadata)
7. Set up fresh metadata (version=1, commit_marker=1)
8. Release lock
```

After import, you **must reopen** the database to access the imported data.

### Locking Mechanism

Export and import operations are mutually exclusive using a lock stored in IndexedDB:

- **Lock Storage**: `{db_name}_export_import_lock` key in IndexedDB
- **Lock Timeout**: 30 seconds
- **Lock Poll Interval**: 100ms
- **Purpose**: Prevents data corruption from concurrent export/import operations

If another operation is in progress, the new operation will wait up to 30 seconds for the lock to be released.

---

## Examples

### Example 1: Export with Progress Tracking

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
        if (error.message.includes('quota')) {
            console.error('Storage quota exceeded');
        } else if (error.message.includes('size')) {
            console.error('Database too large');
        } else {
            console.error('Export failed:', error.message);
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
        let db = await Database.newDatabase('myapp.db');
        await db.importFromFile(uint8Array);
        
        // Reopen
        db = await Database.newDatabase('myapp.db');
        
        // Verify import
        const result = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('Imported tables:', result.rows.map(r => r.values[0].value));
        
        await db.close();
        
    } catch (error) {
        console.error('Import failed:', error.message);
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
    let db2 = await Database.newDatabase('imported.db');
    await db2.importFromFile(exported);
    
    // Reopen and verify
    db2 = await Database.newDatabase('imported.db');
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
    
    // Store backup (could be localStorage, server upload, etc.)
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
    let db = await Database.newDatabase('app_data.db');
    await db.importFromFile(backupData);
    
    // Reopen and verify
    db = await Database.newDatabase('app_data.db');
    const result = await db.execute('SELECT COUNT(*) as count FROM users');
    console.log(`Restored ${result.rows[0].values[0].value} records`);
    
    await db.close();
}
```

---

## Best Practices

### 1. Always Close Before Import

Import automatically closes the database connection. Always reopen:

```javascript
let db = await Database.newDatabase('myapp.db');
await db.importFromFile(data);
// db is now closed!

// REQUIRED: Reopen to use
db = await Database.newDatabase('myapp.db');
```

### 2. Handle Export Size Limits

Configure size limits based on your use case:

```javascript
const config = {
    name: 'large_app.db',
    max_export_size_bytes: 5 * 1024 * 1024 * 1024, // 5GB
    // Or set to null for unlimited (not recommended)
};

const db = await Database.newDatabase(config);
```

Default limit: **2GB** (balances IndexedDB capacity with browser memory limits)

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
    if (error.message.includes('timeout')) {
        console.error('Another export/import in progress - please wait');
    } else if (error.message.includes('size')) {
        console.error('Database exceeds size limit');
    } else {
        console.error('Export failed:', error.message);
    }
}
```

### 5. Check Storage Quota Before Large Exports

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

- **Default Maximum**: 2GB per export
  - Configurable via `DatabaseConfig.max_export_size_bytes`
  - Can be set to `null` for unlimited (not recommended)
  - Rationale: Balances IndexedDB capacity (10GB+) with browser memory limits (2-4GB/tab)

- **Browser Memory**: Large exports load entirely into memory
  - For very large databases (>100MB), monitor memory usage
  - Consider periodic backups of smaller databases

### Performance

- **Export Speed**: ~100-500 MB/s (varies by browser and hardware)
- **Import Speed**: ~50-200 MB/s (slower due to IndexedDB writes)
- **Blocking**: Export/import operations block other database operations

### Browser Compatibility

All modern browsers support export/import:

| Browser | Export | Import | Max Tested Size |
|---------|--------|--------|-----------------|
| **Chrome 131** | ✅ | ✅ | 500MB |
| **Firefox 143** | ✅ | ✅ | 500MB |
| **Safari 26** | ✅ | ✅ | 500MB |

### Multi-Tab Coordination

- Only one export or import can run at a time across all tabs
- Operations use a 30-second timeout lock
- If lock acquisition fails, operation throws an error
- Recommendation: Perform exports/imports when no other tabs are active

---

## Troubleshooting

### Error: "Database too large to export"

**Cause**: Database size exceeds `max_export_size_bytes` limit

**Solution**:
```javascript
// Option 1: Increase limit
const config = {
    name: 'myapp.db',
    max_export_size_bytes: 5 * 1024 * 1024 * 1024, // 5GB
};

// Option 2: Remove limit (not recommended)
const config = {
    name: 'myapp.db',
    max_export_size_bytes: null,
};

// Option 3: Reduce database size
await db.execute('VACUUM'); // Reclaim unused space
```

### Error: "Export/import lock acquisition timeout"

**Cause**: Another export/import operation is in progress

**Solution**:
- Wait for the other operation to complete (max 30 seconds)
- Close other tabs that might be performing operations
- Retry after a delay:
  ```javascript
  await new Promise(resolve => setTimeout(resolve, 5000));
  const exported = await db.exportToFile();
  ```

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

**Cause**: Forgot to reopen database after import

**Solution**:
```javascript
let db = await Database.newDatabase('myapp.db');
await db.importFromFile(data);
// db is closed here!

// MUST reopen:
db = await Database.newDatabase('myapp.db');
const result = await db.execute('SELECT * FROM users');
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

**Cause**: Not enough IndexedDB storage for import

**Solution**:
```javascript
// Check quota before import
const estimate = await navigator.storage.estimate();
const availableMB = (estimate.quota - estimate.usage) / (1024 * 1024);
console.log(`Available: ${availableMB.toFixed(2)} MB`);

if (fileSize > estimate.quota - estimate.usage) {
    // Request persistent storage
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

## Comparison with absurd-sql

| Feature | absurd-sql | AbsurderSQL |
|---------|-----------|-------------|
| **Export to File** | ❌ Not supported | ✅ Full support |
| **Import from File** | ❌ Not supported | ✅ Full support |
| **Database Backup** | ❌ Not possible | ✅ Standard SQLite files |
| **Data Migration** | ❌ Manual only | ✅ Automated |
| **File Portability** | ❌ Locked in IndexedDB | ✅ Standard SQLite format |
| **Multi-Device Sync** | ❌ Not possible | ✅ Export/import workflow |
| **Disaster Recovery** | ❌ No backups | ✅ Full backup/restore |
| **CLI/Tool Integration** | ❌ No file access | ✅ Use sqlite3, DB Browser |

**AbsurderSQL provides complete data portability that absurd-sql cannot offer.**

---

## See Also

- [Multi-Tab Guide](MULTI_TAB_GUIDE.md) - Multi-tab coordination
- [Dual Mode Guide](DUAL_MODE.md) - Browser + Native persistence
- [Transaction Support](TRANSACTION_SUPPORT.md) - Transaction handling
- [Benchmark Results](BENCHMARK.md) - Performance metrics

---

## License

AGPL-3.0 - See [LICENSE.md](../LICENSE.md)
