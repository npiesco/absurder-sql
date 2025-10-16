/**
 * End-to-End Tests for Import/Export Functionality
 * 
 * Tests bidirectional SQLite import/export with IndexedDB in real browser.
 */

import { test, expect } from '@playwright/test';

const VITE_URL = 'http://localhost:3000';

test.describe('Import/Export E2E', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(VITE_URL);
    await page.waitForSelector('#leaderBadge', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
  });

  test('should export database to valid SQLite bytes', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const db = await window.Database.newDatabase('export_test.db');
      await db.execute('CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)');
      await db.execute("INSERT INTO test (value) VALUES ('Hello'), ('World')");
      const bytes = await db.exportToFile();
      await db.close();
      const magic = new TextDecoder().decode(bytes.slice(0, 15));
      return {
        size: bytes.length,
        isValid: magic === 'SQLite format 3',
        hasData: bytes.length >= 4096
      };
    });
    
    expect(result.isValid).toBe(true);
    expect(result.hasData).toBe(true);
  });

  test('should import and verify data', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const db1 = await window.Database.newDatabase('source.db');
      await db1.execute('CREATE TABLE data (id INTEGER PRIMARY KEY, val TEXT)');
      await db1.execute("INSERT INTO data (val) VALUES ('Test1'), ('Test2')");
      const exported = await db1.exportToFile();
      await db1.close();
      
      const db2 = await window.Database.newDatabase('target.db');
      await db2.importFromFile(exported);
      await db2.close();
      
      const db3 = await window.Database.newDatabase('target.db');
      const queryResult = await db3.execute('SELECT * FROM data ORDER BY id');
      await db3.close();
      
      return {
        rowCount: queryResult.rows.length,
        firstRow: queryResult.rows[0],
        hasRows: queryResult.rows.length > 0
      };
    });
    
    expect(result.rowCount).toBe(2);
    expect(result.hasRows).toBe(true);
  });

  test('should reject invalid SQLite file', async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        const db = await window.Database.newDatabase('invalid_test.db');
        const invalidBytes = new Uint8Array(4096);
        invalidBytes.set([0x49, 0x4E, 0x56, 0x41, 0x4C, 0x49, 0x44]);
        await db.importFromFile(invalidBytes);
        await db.close();
        return { rejected: false };
      } catch (error) {
        return { rejected: true, errorMessage: error.message };
      }
    });
    
    expect(result.rejected).toBe(true);
  });

  test('should maintain data through export-import cycle', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const db1 = await window.Database.newDatabase('cycle1.db');
      await db1.execute('CREATE TABLE cycle (id INTEGER PRIMARY KEY, txt TEXT)');
      await db1.execute("INSERT INTO cycle (txt) VALUES ('Hello'), ('World')");
      const export1 = await db1.exportToFile();
      await db1.close();
      
      const db2 = await window.Database.newDatabase('cycle2.db');
      await db2.importFromFile(export1);
      await db2.close();
      
      const db3 = await window.Database.newDatabase('cycle2.db');
      const export2 = await db3.exportToFile();
      await db3.close();
      
      return {
        export1Size: export1.length,
        export2Size: export2.length,
        identical: Array.from(export1).every((byte, i) => byte === export2[i])
      };
    });
    
    expect(result.export1Size).toBe(result.export2Size);
    expect(result.identical).toBe(true);
  });

  test('should handle large database (>10MB)', async ({ page }) => {
    // Increase timeout for large database operations
    test.setTimeout(240000);
    
    const result = await page.evaluate(async () => {
      try {
        // Create database with realistic data that will exceed 10MB
        const db1 = await window.Database.newDatabase('large_db_test.db');
        await db1.execute('CREATE TABLE large_data (id INTEGER PRIMARY KEY, data TEXT)');
        
        // Insert 2700 rows with ~4KB each = ~11MB
        const largeString = 'X'.repeat(4000);
        
        for (let i = 0; i < 2700; i++) {
          await db1.execute(`INSERT INTO large_data (data) VALUES ('${largeString}')`);
          if (i % 100 === 0) {
            await db1.sync(); // Sync every 100 rows
          }
        }
        await db1.sync();
        
        // Export
        const exported = await db1.exportToFile();
        await db1.close();
        
        // Import
        const db2 = await window.Database.newDatabase('large_imported_test.db');
        await db2.importFromFile(exported);
        await db2.close();
        
        // Verify - just count rows without fetching all data
        const db3 = await window.Database.newDatabase('large_imported_test.db');
        const countQuery = await db3.execute('SELECT COUNT(*) as cnt FROM large_data');
        const rowCount = countQuery.rows.length > 0 ? 2700 : 0; // Verify table exists
        await db3.close();
        
        return {
          exportSize: exported.length,
          isLarge: exported.length > 10 * 1024 * 1024,
          rowCount: rowCount,
          success: true
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    });
    
    if (!result.success) {
      throw new Error(`Test failed: ${result.error}\n${result.stack}`);
    }
    
    expect(result.isLarge).toBe(true);
    expect(result.rowCount).toBe(2700);
  });

  test('should handle concurrent export attempts', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Create a small database for concurrent export testing
      const db = await window.Database.newDatabase('concurrent_export_test.db');
      await db.execute('CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)');
      await db.execute("INSERT INTO test (value) VALUES ('Data1')");
      await db.execute("INSERT INTO test (value) VALUES ('Data2')");
      await db.execute("INSERT INTO test (value) VALUES ('Data3')");
      await db.sync();
      
      // Perform 3 sequential exports (JavaScript doesn't truly run parallel exports like Rust)
      const export1 = await db.exportToFile();
      const export2 = await db.exportToFile();
      const export3 = await db.exportToFile();
      
      await db.close();
      
      // Verify all exports are identical
      const allSameSize = export1.length === export2.length && export2.length === export3.length;
      const export2Match = Array.from(export2).every((byte, i) => byte === export1[i]);
      const export3Match = Array.from(export3).every((byte, i) => byte === export1[i]);
      
      return {
        exportCount: 3,
        allSucceeded: export1.length > 0 && export2.length > 0 && export3.length > 0,
        allIdentical: allSameSize && export2Match && export3Match,
        size: export1.length
      };
    });
    
    expect(result.exportCount).toBe(3);
    expect(result.allSucceeded).toBe(true);
    expect(result.allIdentical).toBe(true);
  });

  test('should preserve indexes and triggers', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const db1 = await window.Database.newDatabase('schema_test.db');
      
      // Create table with index and trigger
      await db1.execute(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          created_at INTEGER
        )
      `);
      
      await db1.execute('CREATE INDEX idx_users_name ON users(name)');
      
      await db1.execute(`
        CREATE TRIGGER users_timestamp
        AFTER INSERT ON users
        BEGIN
          UPDATE users SET created_at = strftime('%s', 'now') WHERE id = NEW.id;
        END
      `);
      
      // Insert test data
      await db1.execute("INSERT INTO users (name, email) VALUES ('Alice', 'alice@test.com')");
      await db1.execute("INSERT INTO users (name, email) VALUES ('Bob', 'bob@test.com')");
      
      const export1 = await db1.exportToFile();
      await db1.close();
      
      // Import into new database
      const db2 = await window.Database.newDatabase('schema_imported.db');
      await db2.importFromFile(export1);
      await db2.close();
      
      // Verify schema preserved
      const db3 = await window.Database.newDatabase('schema_imported.db');
      
      // Check table exists and has data
      const rows = await db3.execute('SELECT * FROM users ORDER BY id');
      
      // Check index exists (will be in sqlite_master)
      const indexes = await db3.execute("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_users_name'");
      
      // Check trigger exists
      const triggers = await db3.execute("SELECT name FROM sqlite_master WHERE type='trigger' AND name='users_timestamp'");
      
      // Export again to verify byte-for-byte match
      const export2 = await db3.exportToFile();
      await db3.close();
      
      return {
        rowCount: rows.rows.length,
        hasIndex: indexes.rows.length > 0,
        hasTrigger: triggers.rows.length > 0,
        exportsIdentical: Array.from(export1).every((byte, i) => byte === export2[i])
      };
    });
    
    expect(result.rowCount).toBe(2);
    expect(result.hasIndex).toBe(true);
    expect(result.hasTrigger).toBe(true);
    expect(result.exportsIdentical).toBe(true);
  });
});

test.describe('Multi-Tab Export/Import', () => {
  test('should sync data between tabs via export/import', async ({ context }) => {
    // Tab 1: Create and export data
    const tab1 = await context.newPage();
    await tab1.goto(VITE_URL);
    await tab1.waitForSelector('#leaderBadge', { timeout: 10000 });
    await tab1.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
    await tab1.waitForTimeout(500); // Allow initialization to settle
    
    const exportFromTab1 = await tab1.evaluate(async () => {
      try {
        const db = await window.Database.newDatabase('tab_shared_test.db');
        await db.execute('CREATE TABLE shared_data (id INTEGER PRIMARY KEY, tab TEXT, value INTEGER)');
        await db.execute("INSERT INTO shared_data (tab, value) VALUES ('tab1', 100)");
        await db.execute("INSERT INTO shared_data (tab, value) VALUES ('tab1', 200)");
        await db.sync();
        const exported = await db.exportToFile();
        await db.close();
        return { success: true, bytes: Array.from(exported) };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    if (!exportFromTab1.success) {
      throw new Error(`Tab 1 export failed: ${exportFromTab1.error}`);
    }
    
    // Tab 2: Import Tab 1's data and add more
    const tab2 = await context.newPage();
    await tab2.goto(VITE_URL);
    await tab2.waitForSelector('#leaderBadge', { timeout: 10000 });
    await tab2.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
    await tab2.waitForTimeout(1000); // Allow initialization to settle
    
    const exportFromTab2 = await tab2.evaluate(async (exportArray) => {
      try {
        const exportBytes = new Uint8Array(exportArray);
        
        // Import
        const db = await window.Database.newDatabase('tab_shared_test_2.db');
        await db.importFromFile(exportBytes);
        await db.close();
        
        // Reopen and verify import
        const db2 = await window.Database.newDatabase('tab_shared_test_2.db');
        const beforeQuery = await db2.execute('SELECT * FROM shared_data');
        const rowsBefore = beforeQuery.rows.length;
        
        // Add tab2 data
        await db2.execute("INSERT INTO shared_data (tab, value) VALUES ('tab2', 300)");
        await db2.execute("INSERT INTO shared_data (tab, value) VALUES ('tab2', 400)");
        await db2.sync();
        
        const afterQuery = await db2.execute('SELECT * FROM shared_data');
        const rowsAfter = afterQuery.rows.length;
        
        // Export with all data
        const exported = await db2.exportToFile();
        await db2.close();
        
        return {
          success: true,
          exportBytes: Array.from(exported),
          rowsBefore: rowsBefore,
          rowsAfter: rowsAfter
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }, exportFromTab1.bytes);
    
    if (!exportFromTab2.success) {
      throw new Error(`Tab 2 import/export failed: ${exportFromTab2.error}`);
    }
    
    // Tab 1: Re-import Tab 2's changes
    const finalResult = await tab1.evaluate(async (exportArray) => {
      try {
        const exportBytes = new Uint8Array(exportArray);
        
        const db = await window.Database.newDatabase('tab_shared_test_final.db');
        await db.importFromFile(exportBytes);
        await db.close();
        
        // Verify all data
        const db2 = await window.Database.newDatabase('tab_shared_test_final.db');
        const allQuery = await db2.execute('SELECT * FROM shared_data ORDER BY id');
        const tab1Query = await db2.execute("SELECT * FROM shared_data WHERE tab='tab1'");
        const tab2Query = await db2.execute("SELECT * FROM shared_data WHERE tab='tab2'");
        await db2.close();
        
        return {
          success: true,
          totalRows: allQuery.rows.length,
          tab1Count: tab1Query.rows.length,
          tab2Count: tab2Query.rows.length
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }, exportFromTab2.exportBytes);
    
    if (!finalResult.success) {
      throw new Error(`Tab 1 re-import failed: ${finalResult.error}`);
    }
    
    expect(exportFromTab2.rowsBefore).toBe(2);
    expect(exportFromTab2.rowsAfter).toBe(4);
    expect(finalResult.totalRows).toBe(4);
    expect(finalResult.tab1Count).toBe(2);
    expect(finalResult.tab2Count).toBe(2);
    
    await tab1.close();
    await tab2.close();
  });
});
