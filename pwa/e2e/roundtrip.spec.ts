/**
 * PWA Roundtrip E2E Test
 * 
 * Complete data integrity test:
 * 1. Create database with complex data (special chars, types, schema)
 * 2. Export to SQLite file
 * 3. Import into new database
 * 4. Verify ALL data matches exactly (byte-for-byte if possible)
 * 
 * Based on: scripts/test_wasm_to_native_interop.py
 */

import { test, expect } from '@playwright/test';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';
import path from 'path';

// Unique suffix per test run to avoid parallel test conflicts
const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

test.describe('PWA Roundtrip - Full Data Integrity', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/db');
    await page.waitForSelector('#dbManagement', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
  });

  test('should preserve all data types through export/import cycle', async ({ page }) => {
    console.log('[TEST] Creating database with all data types...');
    
    // Step 1: Create database with comprehensive test data
    const originalData = await page.evaluate(async (suffix) => {
      const db = await window.Database.newDatabase(`roundtrip_test_${suffix}.db`);
      
      // Create table with all SQLite types
      await db.execute(`
        CREATE TABLE comprehensive_test (
          id INTEGER PRIMARY KEY,
          text_field TEXT NOT NULL,
          int_field INTEGER,
          real_field REAL,
          blob_field BLOB,
          null_field TEXT
        )
      `);
      
      // Insert data with special characters (like Python script)
      await db.execute(`
        INSERT INTO comprehensive_test (text_field, int_field, real_field, null_field) VALUES
          ('Alice O''Brien', 30, 1234.56, NULL),
          ('Bob "The Builder"', 25, 9876.54, 'not null'),
          ('Charlie 你好', 35, 5555.55, NULL),
          ('Diana [rocket]', 28, 7777.77, 'value'),
          ('Eve <script>alert("XSS")</script>', 42, 3333.33, NULL),
          ('Frank\\nNewline\\tTab', 50, 8888.88, 'test')
      `);
      
      // Query all data before export
      const result = await db.execute('SELECT * FROM comprehensive_test ORDER BY id');
      
      // Export to bytes
      const exported = await db.exportToFile();
      await db.close();
      
      return {
        rowCount: result.rows.length,
        rows: result.rows,
        exportSize: exported.length,
        exportBytes: Array.from(exported),
        magic: new TextDecoder().decode(exported.slice(0, 15))
      };
    }, uniqueSuffix);

    console.log(`[OK] Created database with ${originalData.rowCount} rows`);
    console.log(`[OK] Export size: ${originalData.exportSize} bytes`);
    console.log(`[OK] SQLite magic: ${originalData.magic}`);
    
    expect(originalData.rowCount).toBe(6);
    expect(originalData.magic).toBe('SQLite format 3');
    expect(originalData.exportSize).toBeGreaterThan(4096);

    // Step 2: Save export to temp file (simulating file download/upload cycle)
    const tempFilePath = path.join('/tmp', `pwa_roundtrip_test_${uniqueSuffix}.db`);
    writeFileSync(tempFilePath, Buffer.from(originalData.exportBytes as number[]));
    console.log(`[SAVE] Wrote ${originalData.exportSize} bytes to ${tempFilePath}`);

    try {
      // Step 3: Import back into new database
      console.log('[IMPORT] Importing back into new database...');
      
      const importedData = await page.evaluate(async ({ fileBytes, suffix }) => {
        const bytes = new Uint8Array(fileBytes);

        // Create new database instance
        const db = await window.Database.newDatabase(`roundtrip_imported_${suffix}.db`);

        // Import the data
        await db.importFromFile(bytes);
        await db.close();

        // Reopen and verify
        const db2 = await window.Database.newDatabase(`roundtrip_imported_${suffix}.db`);
        const result = await db2.execute('SELECT * FROM comprehensive_test ORDER BY id');
        
        // Export again for byte comparison
        const reExported = await db2.exportToFile();
        await db2.close();
        
        return {
          rowCount: result.rows.length,
          rows: result.rows,
          reExportSize: reExported.length,
          reExportBytes: Array.from(reExported)
        };
      }, { fileBytes: originalData.exportBytes, suffix: uniqueSuffix });

      console.log(`[OK] Imported database has ${importedData.rowCount} rows`);
      
      // Step 4: Verify row counts match
      expect(importedData.rowCount).toBe(originalData.rowCount);
      
      // Step 5: Verify each row matches exactly
      for (let i = 0; i < originalData.rowCount; i++) {
        const origRow = originalData.rows[i];
        const impRow = importedData.rows[i];
        
        console.log(`[CHECK] Row ${i + 1}:`);
        console.log(`  Original: ${JSON.stringify(origRow).substring(0, 100)}`);
        console.log(`  Imported: ${JSON.stringify(impRow).substring(0, 100)}`);
        
        // Compare each value
        expect(impRow.values.length).toBe(origRow.values.length);
        
        for (let j = 0; j < origRow.values.length; j++) {
          const origVal = origRow.values[j].value;
          const impVal = impRow.values[j].value;
          
          if (origVal === null) {
            expect(impVal).toBeNull();
          } else {
            expect(impVal).toBe(origVal);
          }
        }
      }
      
      console.log('[OK] All rows match exactly!');
      
      // Step 6: Verify re-exported bytes match original export (byte-for-byte)
      expect(importedData.reExportSize).toBe(originalData.exportSize);
      
      const bytesMatch = (importedData.reExportBytes as number[]).every((byte, i) => 
        byte === (originalData.exportBytes as number[])[i]
      );
      
      expect(bytesMatch).toBe(true);
      console.log('[SUCCESS] Byte-for-byte match on re-export!');
      
    } finally {
      if (existsSync(tempFilePath)) {
        unlinkSync(tempFilePath);
      }
    }
  });

  test('should preserve schema (indexes, triggers) through roundtrip', async ({ page }) => {
    console.log('[TEST] Creating database with complex schema...');

    const result = await page.evaluate(async (suffix) => {
      const db = await window.Database.newDatabase(`schema_roundtrip_${suffix}.db`);
      
      // Create table
      await db.execute(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          created_at INTEGER
        )
      `);
      
      // Add index
      await db.execute('CREATE INDEX idx_users_name ON users(name)');
      
      // Add trigger
      await db.execute(`
        CREATE TRIGGER users_timestamp
        AFTER INSERT ON users
        BEGIN
          UPDATE users SET created_at = strftime('%s', 'now') WHERE id = NEW.id;
        END
      `);
      
      // Insert data
      await db.execute("INSERT INTO users (name, email) VALUES ('Alice', 'alice@test.com')");
      await db.execute("INSERT INTO users (name, email) VALUES ('Bob', 'bob@test.com')");
      
      // Export
      const exported = await db.exportToFile();
      await db.close();
      
      // Import to new database
      const db2 = await window.Database.newDatabase(`schema_imported_${suffix}.db`);
      await db2.importFromFile(exported);
      await db2.close();

      // Verify schema
      const db3 = await window.Database.newDatabase(`schema_imported_${suffix}.db`);
      
      const tables = await db3.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
      const indexes = await db3.execute("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_users_name'");
      const triggers = await db3.execute("SELECT name FROM sqlite_master WHERE type='trigger' AND name='users_timestamp'");
      const rows = await db3.execute('SELECT * FROM users ORDER BY id');
      
      // Test trigger still works by inserting new row
      await db3.execute("INSERT INTO users (name, email) VALUES ('Charlie', 'charlie@test.com')");
      const newRows = await db3.execute('SELECT * FROM users ORDER BY id');
      const charlieRow = newRows.rows.find(r => r.values.find(v => v.value === 'Charlie'));
      const hasTimestamp = charlieRow?.values[3]?.value !== null; // created_at should be set by trigger
      
      await db3.close();
      
      return {
        hasTable: tables.rows.length > 0,
        hasIndex: indexes.rows.length > 0,
        hasTrigger: triggers.rows.length > 0,
        originalRowCount: rows.rows.length,
        newRowCount: newRows.rows.length,
        triggerWorks: hasTimestamp
      };
    }, uniqueSuffix);
    
    console.log('[VERIFY] Schema elements:');
    console.log(`  Table exists: ${result.hasTable}`);
    console.log(`  Index exists: ${result.hasIndex}`);
    console.log(`  Trigger exists: ${result.hasTrigger}`);
    console.log(`  Trigger functional: ${result.triggerWorks}`);
    
    expect(result.hasTable).toBe(true);
    expect(result.hasIndex).toBe(true);
    expect(result.hasTrigger).toBe(true);
    expect(result.originalRowCount).toBe(2);
    expect(result.newRowCount).toBe(3);
    expect(result.triggerWorks).toBe(true);
    
    console.log('[SUCCESS] Schema fully preserved through roundtrip!');
  });

  test('should handle multiple roundtrip cycles without data corruption', async ({ page }) => {
    console.log('[TEST] Testing multiple export/import cycles...');

    const result = await page.evaluate(async (suffix) => {
      // Cycle 1: Original
      let db = await window.Database.newDatabase(`cycle1_${suffix}.db`);
      await db.execute('CREATE TABLE cycle_test (id INTEGER PRIMARY KEY AUTOINCREMENT, value TEXT)');
      await db.execute("INSERT INTO cycle_test (value) VALUES ('Cycle1')");
      let exported = await db.exportToFile();
      await db.close();
      
      const hashes = [Array.from(exported)];
      
      // Cycles 2-5: Import and re-export
      for (let i = 2; i <= 5; i++) {
        db = await window.Database.newDatabase(`cycle${i}_${suffix}.db`);
        await db.importFromFile(exported);
        await db.close();

        // Reopen to add data
        db = await window.Database.newDatabase(`cycle${i}_${suffix}.db`);
        await db.execute(`INSERT INTO cycle_test (value) VALUES ('Cycle${i}')`);
        await db.close();

        // Reopen and export
        db = await window.Database.newDatabase(`cycle${i}_${suffix}.db`);
        exported = await db.exportToFile();
        await db.close();

        hashes.push(Array.from(exported));
      }

      // Final verification
      db = await window.Database.newDatabase(`cycle5_${suffix}.db`);
      const final = await db.execute('SELECT * FROM cycle_test ORDER BY id');
      await db.close();
      
      return {
        cycleCount: 5,
        finalRowCount: final.rows.length,
        finalRows: final.rows,
        exportSizes: hashes.map(h => h.length)
      };
    }, uniqueSuffix);
    
    console.log(`[OK] Completed ${result.cycleCount} roundtrip cycles`);
    console.log(`[OK] Final row count: ${result.finalRowCount}`);
    console.log(`[OK] Export sizes: ${result.exportSizes.join(', ')} bytes`);
    
    expect(result.finalRowCount).toBe(5);
    
    // Verify all expected rows exist
    const values = result.finalRows.map((r: any) => r.values[1].value);
    expect(values).toContain('Cycle1');
    expect(values).toContain('Cycle2');
    expect(values).toContain('Cycle3');
    expect(values).toContain('Cycle4');
    expect(values).toContain('Cycle5');
    
    console.log('[SUCCESS] All cycles completed without corruption!');
  });
});
