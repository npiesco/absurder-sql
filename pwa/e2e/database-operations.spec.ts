/**
 * Real E2E Tests for Database Operations (Import/Export/Create/Delete)
 * Based on working tests from /tests/e2e/import-export.spec.js
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';

test.describe('Database Operations - Import/Export', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/db');
    await page.waitForSelector('#dbManagement', { timeout: 10000 });
    // Wait for database to be ready
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
  });

  test('should actually export database to valid SQLite file', async ({ page }) => {
    // Create data first
    await page.evaluate(async () => {
      const db = await window.Database.newDatabase('export_real_test.db');
      await db.execute('CREATE TABLE test_export (id INTEGER PRIMARY KEY, value TEXT)');
      await db.execute("INSERT INTO test_export (value) VALUES ('TestData1'), ('TestData2')");
      await db.sync();
      (window as any).testDb = db;
    });

    // Trigger actual export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportDbButton');
    const download = await downloadPromise;

    // Verify it's a real SQLite file
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    const fileBuffer = readFileSync(downloadPath!);
    const magic = fileBuffer.toString('utf-8', 0, 15);
    expect(magic).toBe('SQLite format 3');
    expect(fileBuffer.length).toBeGreaterThan(0);
  });

  test('should actually import database from file', async ({ page }) => {
    // Create a real SQLite file to import (like vite test pattern)
    const testDbData = await page.evaluate(async () => {
      const db = await window.Database.newDatabase('source_for_import.db');
      await db.execute('CREATE TABLE import_test (id INTEGER PRIMARY KEY, name TEXT)');
      await db.execute("INSERT INTO import_test (name) VALUES ('Alice'), ('Bob')");
      const bytes = await db.exportToFile();
      await db.close();
      return Array.from(bytes);
    });

    // Create temp file
    const tempFilePath = path.join('/tmp', 'test_import.db');
    writeFileSync(tempFilePath, Buffer.from(testDbData as number[]));

    try {
      // Set file on hidden input
      const fileInput = await page.locator('#importFile');
      await fileInput.setInputFiles(tempFilePath);

      // Wait a bit for file to be set
      await page.waitForTimeout(100);

      // Click import button - find by text content
      await page.locator('button:has-text("Import Selected File")').click();
      
      // Wait for import to complete
      await page.waitForSelector('#status:has-text("Import complete")', { timeout: 10000 });

      // Verify data was actually imported (close and reopen like vite test)
      const result = await page.evaluate(async () => {
        const db = (window as any).testDb;
        await db.close();
        
        const reopened = await window.Database.newDatabase('database.db');
        const queryResult = await reopened.execute('SELECT * FROM import_test ORDER BY id');
        (window as any).testDb = reopened;
        
        return {
          rowCount: queryResult.rows.length,
          firstRow: queryResult.rows[0]?.values[1]?.value,
          secondRow: queryResult.rows[1]?.values[1]?.value
        };
      });

      expect(result.rowCount).toBe(2);
      expect(result.firstRow).toBe('Alice');
      expect(result.secondRow).toBe('Bob');
    } finally {
      if (existsSync(tempFilePath)) {
        unlinkSync(tempFilePath);
      }
    }
  });

  test('should handle drag-and-drop import', async ({ page }) => {
    // Create test database file
    const testDbData = await page.evaluate(async () => {
      const db = await window.Database.newDatabase('drag_test.db');
      await db.execute('CREATE TABLE drag_data (id INTEGER, val TEXT)');
      await db.execute("INSERT INTO drag_data VALUES (1, 'Dragged')");
      const bytes = await db.exportToFile();
      await db.close();
      return Array.from(bytes);
    });

    // Simulate file drop
    const buffer = Buffer.from(testDbData as number[]);
    const dataTransfer = await page.evaluateHandle((data: number[]) => {
      const dt = new DataTransfer();
      const file = new File([new Uint8Array(data)], 'dropped.db', { type: 'application/x-sqlite3' });
      dt.items.add(file);
      return dt;
    }, Array.from(buffer));

    await page.dispatchEvent('#dropZone', 'drop', { dataTransfer });
    
    // Wait for import
    await page.waitForSelector('#status:has-text("Import complete")', { timeout: 10000 });

    // Verify
    const result = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const queryResult = await db.execute('SELECT * FROM drag_data');
      return {
        hasData: queryResult.rows.length > 0,
        value: queryResult.rows[0]?.values[1]?.value
      };
    });

    expect(result.hasData).toBe(true);
    expect(result.value).toBe('Dragged');
  });

  test('should create new database', async ({ page }) => {
    const dbName = `test_create_${Date.now()}.db`;
    
    // Click create button
    await page.click('#createDbButton');
    
    // Fill in name
    await page.fill('#dbNameInput', dbName);
    
    // Confirm
    await page.click('#confirmCreate');
    
    // Wait for success
    await page.waitForSelector(`#status:has-text("Database created: ${dbName}")`, { timeout: 10000 });

    // Verify database actually exists and is usable
    const canQuery = await page.evaluate(async (name) => {
      try {
        const db = await window.Database.newDatabase(name);
        await db.execute('CREATE TABLE verify (id INTEGER)');
        await db.execute('INSERT INTO verify VALUES (1)');
        const result = await db.execute('SELECT * FROM verify');
        await db.close();
        return result.rows.length === 1;
      } catch (e) {
        return false;
      }
    }, dbName);

    expect(canQuery).toBe(true);
  });

  test('should delete database', async ({ page }) => {
    const dbName = `test_delete_${Date.now()}.db`;
    
    // Create a database using the UI
    await page.click('#createDbButton');
    await page.fill('#dbNameInput', dbName);
    await page.click('#confirmCreate');
    await page.waitForSelector(`#status:has-text("Database created: ${dbName}")`, { timeout: 10000 });

    // Open delete dialog
    await page.click('#deleteDbButton');
    
    // Confirm delete
    await page.click('#confirmDelete');
    
    // Wait for success
    await page.waitForSelector('#status:has-text("Database deleted")', { timeout: 10000 });

    // Verify database was actually deleted from IndexedDB
    const dbStatus = await page.evaluate(async (name) => {
      // List all databases
      const databases = await indexedDB.databases();
      const dbExists = databases.some(db => db.name === name);
      
      console.log('[TEST] All databases:', databases.map(d => d.name));
      console.log('[TEST] Looking for:', name);
      console.log('[TEST] Found:', dbExists);
      
      return {
        exists: dbExists,
        allDatabases: databases.map(d => d.name),
        targetDb: name
      };
    }, dbName);

    console.log('[TEST] Database status:', dbStatus);
    expect(dbStatus.exists).toBe(false);
  });
});

test.describe('Database Operations - Edge Cases', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/db');
    await page.waitForSelector('#dbManagement', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
  });

  test('should reject invalid SQLite file on import', async ({ page }) => {
    // Create invalid file
    const invalidData = Buffer.from('INVALID DATA NOT SQLITE');
    const tempFilePath = path.join('/tmp', 'invalid.db');
    writeFileSync(tempFilePath, invalidData);

    try {
      const fileInput = await page.locator('#importFile');
      await fileInput.setInputFiles(tempFilePath);
      
      // Click import button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const importBtn = buttons.find(btn => btn.textContent?.includes('Import Selected File'));
        importBtn?.click();
      });
      
      // Should show error
      await page.waitForSelector('#status:has-text("error")', { timeout: 10000 });
    } finally {
      if (existsSync(tempFilePath)) {
        unlinkSync(tempFilePath);
      }
    }
  });

  test('should handle export of empty database', async ({ page }) => {
    await page.evaluate(async () => {
      const db = await window.Database.newDatabase('empty_test.db');
      (window as any).testDb = db;
    });

    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportDbButton');
    const download = await downloadPromise;

    const downloadPath = await download.path();
    const fileBuffer = readFileSync(downloadPath!);
    
    // Should still be valid SQLite
    const magic = fileBuffer.toString('utf-8', 0, 15);
    expect(magic).toBe('SQLite format 3');
  });

  test('should preserve schema on export/import cycle', async ({ page }) => {
    // Create complex schema in the UI's database (testDb that's managed by page)
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE
        )
      `);
      await db.execute('CREATE INDEX idx_users_email ON users(email)');
      await db.execute(`
        CREATE TRIGGER user_audit
        AFTER INSERT ON users
        BEGIN
          SELECT 1;
        END
      `);
      await db.execute("INSERT INTO users (name, email) VALUES ('Test', 'test@example.com')");
    });

    // Export using UI
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportDbButton');
    const download = await downloadPromise;
    const exportPath = await download.path();
    const exportedData = readFileSync(exportPath!);

    // Import back using UI
    const tempFilePath = path.join('/tmp', 'schema_import.db');
    writeFileSync(tempFilePath, exportedData);

    try {
      const fileInput = await page.locator('#importFile');
      await fileInput.setInputFiles(tempFilePath);
      
      // Click import button
      await page.locator('button:has-text("Import Selected File")').click();
      
      await page.waitForSelector('#status:has-text("Import complete")', { timeout: 10000 });

      // Verify schema preserved - query the newly imported database
      const schemaCheck = await page.evaluate(async () => {
        const db = (window as any).testDb;
        const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
        const indexes = await db.execute("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_users_email'");
        const triggers = await db.execute("SELECT name FROM sqlite_master WHERE type='trigger' AND name='user_audit'");
        const data = await db.execute('SELECT * FROM users');
        
        return {
          hasTable: tables.rows.length > 0,
          hasIndex: indexes.rows.length > 0,
          hasTrigger: triggers.rows.length > 0,
          hasData: data.rows.length > 0
        };
      });

      expect(schemaCheck.hasTable).toBe(true);
      expect(schemaCheck.hasIndex).toBe(true);
      expect(schemaCheck.hasTrigger).toBe(true);
      expect(schemaCheck.hasData).toBe(true);
    } finally {
      if (existsSync(tempFilePath)) {
        unlinkSync(tempFilePath);
      }
    }
  });
});
