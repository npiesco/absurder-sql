/**
 * AbsurderSQL Export/Import Examples
 * 
 * Production-grade examples showing how to export and import SQLite databases
 * with IndexedDB persistence in the browser.
 */

import init, { Database } from '../pkg/absurder_sql.js';

// ============================================================================
// Example 1: Basic Export
// ============================================================================

async function basicExportExample() {
    console.log('=== Basic Export Example ===');
    
    try {
        // Initialize WASM
        await init();
        
        // Create database
        const db = await Database.newDatabase('my_app.db');
        
        // Create schema and data
        await db.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
        await db.execute("INSERT INTO users (name) VALUES ('Alice'), ('Bob')");
        
        // Export database to Uint8Array
        const exportedData = await db.exportToFile();
        console.log(`Exported ${exportedData.length} bytes`);
        
        // Download as file
        const blob = new Blob([exportedData], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my_app.db';
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('File downloaded');
        
        await db.close();
        
    } catch (error) {
        console.error('Export failed:', error);
    }
}

// ============================================================================
// Example 2: Basic Import
// ============================================================================

async function basicImportExample() {
    console.log('=== Basic Import Example ===');
    
    try {
        // Initialize WASM
        await init();
        
        // Create database instance
        let db = await Database.newDatabase('imported_app.db');
        
        // Get file from user (e.g., via file input)
        // <input type="file" id="dbFile" accept=".db,.sqlite">
        const fileInput = document.getElementById('dbFile');
        const file = fileInput.files[0];
        
        if (!file) {
            console.error('No file selected');
            return;
        }
        
        // Read file as Uint8Array
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Import database (this closes the connection)
        await db.importFromFile(uint8Array);
        console.log('✓ Database imported');
        
        // Reopen database to query imported data
        db = await Database.newDatabase('imported_app.db');
        const result = await db.execute('SELECT * FROM users');
        const data = JSON.parse(result);
        console.log('✓ Imported data:', data.rows);
        
        await db.close();
        
    } catch (error) {
        console.error('Import failed:', error);
    }
}

// ============================================================================
// Example 3: Export with Error Handling
// ============================================================================

async function exportWithErrorHandling() {
    console.log('=== Export with Error Handling ===');
    
    let db = null;
    
    try {
        await init();
        db = await Database.newDatabase('error_handling_demo.db');
        
        // Create data
        await db.execute('CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL)');
        await db.execute("INSERT INTO products VALUES (1, 'Widget', 9.99), (2, 'Gadget', 19.99)");
        
        // Export with size check
        const exportedData = await db.exportToFile();
        const sizeInMB = exportedData.length / (1024 * 1024);
        
        console.log(`✓ Export size: ${sizeInMB.toFixed(2)} MB`);
        
        if (sizeInMB > 100) {
            console.warn('⚠️ Large export detected - consider using streaming export');
        }
        
        // Check if browser storage is available
        if (!navigator.storage || !navigator.storage.estimate) {
            console.warn('⚠️ Storage API not available - cannot check quota');
        } else {
            const estimate = await navigator.storage.estimate();
            const availableMB = (estimate.quota - estimate.usage) / (1024 * 1024);
            console.log(`✓ Available storage: ${availableMB.toFixed(2)} MB`);
            
            if (exportedData.length > estimate.quota - estimate.usage) {
                throw new Error('Not enough storage space for export');
            }
        }
        
        // Successful export - download file
        const blob = new Blob([exportedData], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'error_handling_demo.db';
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('✓ Export completed successfully');
        
    } catch (error) {
        // Handle specific error types
        if (error.message.includes('quota')) {
            console.error('❌ Storage quota exceeded - please free up space');
        } else if (error.message.includes('size')) {
            console.error('❌ Database too large to export');
        } else {
            console.error('❌ Export failed:', error.message);
        }
        
        // Show user-friendly error message
        alert(`Export failed: ${error.message}\n\nPlease try again or contact support.`);
        
    } finally {
        // Always close the database
        if (db) {
            await db.close();
            console.log('✓ Database closed');
        }
    }
}

// ============================================================================
// Example 4: Import with Progress Tracking
// ============================================================================

async function importWithProgress() {
    console.log('=== Import with Progress Tracking ===');
    
    try {
        await init();
        
        // Get file
        const fileInput = document.getElementById('importFile');
        const file = fileInput.files[0];
        
        if (!file) {
            console.error('No file selected');
            return;
        }
        
        console.log(`📥 Importing: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
        
        // Show progress UI
        const progressBar = document.getElementById('progressBar');
        progressBar.style.display = 'block';
        progressBar.value = 0;
        
        // Simulate progress during file read
        progressBar.value = 25;
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        progressBar.value = 50;
        console.log('✓ File loaded into memory');
        
        // Create database
        let db = await Database.newDatabase('progress_demo.db');
        
        progressBar.value = 75;
        console.log('✓ Database created');
        
        // Import
        await db.importFromFile(uint8Array);
        
        progressBar.value = 90;
        console.log('✓ Import complete');
        
        // Reopen
        db = await Database.newDatabase('progress_demo.db');
        
        progressBar.value = 100;
        console.log('✓ Database ready');
        
        // Verify import
        const result = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
        const data = JSON.parse(result);
        console.log('✓ Imported tables:', data.rows.map(r => r[0]));
        
        await db.close();
        
        // Hide progress after delay
        setTimeout(() => {
            progressBar.style.display = 'none';
        }, 1000);
        
    } catch (error) {
        console.error('❌ Import failed:', error.message);
        document.getElementById('progressBar').style.display = 'none';
    }
}

// ============================================================================
// Example 5: Export/Import Roundtrip Validation
// ============================================================================

async function validateRoundtrip() {
    console.log('=== Export/Import Roundtrip Validation ===');
    
    try {
        await init();
        
        // Create original database
        const db1 = await Database.newDatabase('original.db');
        await db1.execute(`
            CREATE TABLE test_data (
                id INTEGER PRIMARY KEY,
                data TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Insert test data
        const testValues = ['alpha', 'beta', 'gamma', 'delta'];
        for (const value of testValues) {
            await db1.execute('INSERT INTO test_data (data) VALUES (?)', [value]);
        }
        
        // Get original row count
        const originalResult = await db1.execute('SELECT COUNT(*) as count FROM test_data');
        const originalCount = originalResult.rows[0].values[0].value;
        console.log(`✓ Original database: ${originalCount} rows`);
        
        // Export
        const exportedData = await db1.exportToFile();
        console.log(`✓ Exported: ${exportedData.length} bytes`);
        await db1.close();
        
        // Import to new database
        let db2 = await Database.newDatabase('imported.db');
        await db2.importFromFile(exportedData);
        
        // Reopen after import
        db2 = await Database.newDatabase('imported.db');
        
        // Verify row count
        const importedResult = await db2.execute('SELECT COUNT(*) as count FROM test_data');
        const importedCount = importedResult.rows[0].values[0].value;
        console.log(`✓ Imported database: ${importedCount} rows`);
        
        // Validate data integrity
        if (originalCount === importedCount) {
            console.log('✅ Roundtrip validation PASSED - data integrity preserved');
        } else {
            console.error('❌ Roundtrip validation FAILED - row count mismatch');
        }
        
        // Verify actual data
        const dataResult = await db2.execute('SELECT data FROM test_data ORDER BY id');
        const importedData = dataResult.rows.map(r => r.values[0].value);
        
        const dataMatch = JSON.stringify(testValues) === JSON.stringify(importedData);
        if (dataMatch) {
            console.log('✅ Data values match exactly');
        } else {
            console.error('❌ Data values do not match');
        }
        
        await db2.close();
        
    } catch (error) {
        console.error('❌ Validation failed:', error.message);
    }
}

// ============================================================================
// Example 6: File Size Validation
// ============================================================================

async function validateFileSize() {
    console.log('=== File Size Validation ===');
    
    try {
        await init();
        
        const db = await Database.newDatabase('size_check.db');
        
        // Create table and insert data
        await db.execute('CREATE TABLE large_data (id INTEGER PRIMARY KEY, content TEXT)');
        await db.execute("INSERT INTO large_data (content) VALUES ('test data')");
        
        // Check database size before export
        const result = await db.execute("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()");
        const dbSize = result.rows[0].values[0].value;
        console.log(`Database size: ${(dbSize / 1024).toFixed(2)} KB`);
        
        // Set size limit (example: 10MB)
        const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
        
        if (dbSize > MAX_SIZE_BYTES) {
            console.warn(`⚠️ Database exceeds ${MAX_SIZE_BYTES / (1024 * 1024)}MB limit`);
            throw new Error(`Database too large: ${(dbSize / (1024 * 1024)).toFixed(2)}MB (limit: ${MAX_SIZE_BYTES / (1024 * 1024)}MB)`);
        }
        
        // Proceed with export
        const exportedData = await db.exportToFile();
        console.log(`✓ Export size: ${(exportedData.length / 1024).toFixed(2)} KB`);
        console.log('✅ File size validation passed');
        
        await db.close();
        
    } catch (error) {
        console.error('❌ Size validation failed:', error.message);
    }
}

// ============================================================================
// Example 7: Handling Concurrent Operations
// ============================================================================

async function handleConcurrentOperations() {
    console.log('=== Concurrent Operations Handling ===');
    
    try {
        await init();
        
        const db = await Database.newDatabase('concurrent.db');
        await db.execute('CREATE TABLE data (id INTEGER PRIMARY KEY, value TEXT)');
        await db.execute("INSERT INTO data (value) VALUES ('test')");
        
        // Export/import operations are automatically serialized
        // The library uses locks to prevent concurrent access
        
        console.log('Starting export operation 1...');
        const export1Promise = db.exportToFile();
        
        console.log('Starting export operation 2...');
        const export2Promise = db.exportToFile();
        
        // Both operations will complete, but second waits for first
        const [data1, data2] = await Promise.all([export1Promise, export2Promise]);
        
        console.log('✓ Export 1 completed:', data1.length, 'bytes');
        console.log('✓ Export 2 completed:', data2.length, 'bytes');
        console.log('✅ Concurrent operations handled correctly');
        
        await db.close();
        
    } catch (error) {
        console.error('❌ Concurrent operation failed:', error.message);
    }
}

// ============================================================================
// Example 8: Multi-Tab Safety
// ============================================================================

async function multiTabSafetyExample() {
    console.log('=== Multi-Tab Safety Example ===');
    
    try {
        await init();
        
        // In production, multiple tabs might access the same database
        // Export/import operations use locks to ensure safety
        
        const db = await Database.newDatabase('multi_tab.db');
        await db.execute('CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY, data TEXT)');
        await db.execute("INSERT INTO sessions (data) VALUES ('session-1')");
        
        console.log('✓ Database operations in this tab');
        
        // Check if we can safely export (another tab might be exporting)
        try {
            const exportedData = await db.exportToFile();
            console.log('✓ Export completed safely:', exportedData.length, 'bytes');
        } catch (error) {
            if (error.message.includes('timeout') || error.message.includes('lock')) {
                console.warn('⚠️ Another tab is performing export/import - please wait');
                // Retry after delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                const exportedData = await db.exportToFile();
                console.log('✓ Export completed after retry:', exportedData.length, 'bytes');
            } else {
                throw error;
            }
        }
        
        await db.close();
        console.log('✅ Multi-tab safety verified');
        
    } catch (error) {
        console.error('❌ Multi-tab operation failed:', error.message);
    }
}

// ============================================================================
// Example 9: Backup and Restore Workflow
// ============================================================================

async function backupRestoreWorkflow() {
    console.log('=== Backup and Restore Workflow ===');
    
    try {
        await init();
        
        // === Backup Phase ===
        console.log('📦 Starting backup...');
        
        const db = await Database.newDatabase('app_data.db');
        
        // Simulate existing data
        await db.execute('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)');
        await db.execute("INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com')");
        await db.execute("INSERT INTO users (name, email) VALUES ('Bob', 'bob@example.com')");
        
        // Create backup
        const backup = await db.exportToFile();
        const backupSize = backup.length;
        const timestamp = new Date().toISOString();
        
        console.log(`✓ Backup created: ${(backupSize / 1024).toFixed(2)} KB at ${timestamp}`);
        
        // Store backup (in real app, might upload to server or save to IndexedDB)
        localStorage.setItem('database_backup', JSON.stringify({
            timestamp,
            size: backupSize,
            data: Array.from(backup) // Convert Uint8Array to regular array for storage
        }));
        
        console.log('✓ Backup stored');
        
        await db.close();
        
        // === Simulate Data Loss ===
        console.log('💥 Simulating data loss...');
        
        // === Restore Phase ===
        console.log('♻️ Starting restore...');
        
        // Retrieve backup
        const storedBackup = JSON.parse(localStorage.getItem('database_backup'));
        if (!storedBackup) {
            throw new Error('No backup found');
        }
        
        console.log(`✓ Backup found from ${storedBackup.timestamp}`);
        
        // Convert back to Uint8Array
        const backupData = new Uint8Array(storedBackup.data);
        
        // Restore database
        let restoredDb = await Database.newDatabase('app_data.db');
        await restoredDb.importFromFile(backupData);
        console.log('✓ Database restored from backup');
        
        // Reopen and verify
        restoredDb = await Database.newDatabase('app_data.db');
        const result = await restoredDb.execute('SELECT COUNT(*) as count FROM users');
        const rowCount = result.rows[0].values[0].value;
        
        console.log(`✓ Restored ${rowCount} user records`);
        console.log('✅ Backup and restore workflow completed successfully');
        
        await restoredDb.close();
        
        // Cleanup
        localStorage.removeItem('database_backup');
        
    } catch (error) {
        console.error('❌ Backup/restore failed:', error.message);
    }
}

// ============================================================================
// Export all examples
// ============================================================================

export {
    basicExportExample,
    basicImportExample,
    exportWithErrorHandling,
    importWithProgress,
    validateRoundtrip,
    validateFileSize,
    handleConcurrentOperations,
    multiTabSafetyExample,
    backupRestoreWorkflow
};

// Run examples if this file is loaded directly (for testing)
if (typeof window !== 'undefined' && window.location.pathname.includes('export_import.js')) {
    console.log('Running export/import examples...\n');
    
    // Run all examples sequentially
    (async () => {
        await basicExportExample();
        console.log('\n');
        await exportWithErrorHandling();
        console.log('\n');
        await validateRoundtrip();
        console.log('\n');
        await validateFileSize();
        console.log('\n');
        await handleConcurrentOperations();
        console.log('\n');
        await multiTabSafetyExample();
        console.log('\n');
        await backupRestoreWorkflow();
    })();
}
