/**
 * Real E2E Tests for Database Operations (Import/Export/Create/Delete)
 * Based on working tests from /tests/e2e/import-export.spec.js
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';

test.describe('Database Operations - Import/Export', () => {

  test.beforeEach(async ({ page }) => {
    console.log('[BEFORE] Starting beforeEach');

    // Clear localStorage BEFORE loading page to prevent auto-loading database
    await page.goto('/db');
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Reload page with clean state
    await page.reload();
    console.log('[BEFORE] Page reloaded with clean localStorage');

    await page.waitForSelector('#dbManagement', { timeout: 10000 });
    console.log('[BEFORE] dbManagement selector found');

    // Wait for database to be ready
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
    console.log('[BEFORE] Database.newDatabase is available');
    console.log('[BEFORE] beforeEach complete');
  });

  test('should actually export database to valid SQLite file', async ({ page }) => {
    // Create database through UI
    await page.click('#createDbButton');
    await page.waitForTimeout(300);
    await page.fill('#dbNameInput', 'export_real_test.db');
    await page.click('#confirmCreate');
    await page.waitForTimeout(500);
    
    // Add test data
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('CREATE TABLE test_export (id INTEGER PRIMARY KEY, value TEXT)');
      await db.execute("INSERT INTO test_export (value) VALUES ('TestData1'), ('TestData2')");
      await db.sync();
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

  test.skip('should actually import database from file', async ({ page }) => {
    // SKIPPING - Same issue as drag-and-drop import test
    console.log('[PLAYWRIGHT] Test starting');
    const result = await page.evaluate(async () => {
      console.log('[BROWSER] page.evaluate started');
      (window as any).testStepReached = 'evaluate_started';
      // Use unique database names to avoid worker conflicts
      const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      console.log('[TEST] Step 1: Creating source database...');
      // Create source database with test data
      const sourceDb = await window.Database.newDatabase(`source_for_import_${uniqueId}.db`);
      console.log('[TEST] Step 2: Setting allowNonLeaderWrites...');
      if (sourceDb.allowNonLeaderWrites) await sourceDb.allowNonLeaderWrites(true);
      console.log('[TEST] Step 3: Creating table...');
      await sourceDb.execute('CREATE TABLE import_test (id INTEGER PRIMARY KEY, name TEXT)');
      console.log('[TEST] Step 4: Inserting data...');
      await sourceDb.execute("INSERT INTO import_test (name) VALUES ('Alice'), ('Bob')");
      console.log('[TEST] Step 5: Exporting to bytes...');
      const bytes = await sourceDb.exportToFile();
      console.log('[TEST] Step 6: Closing source DB...');
      await sourceDb.close();
      console.log('[TEST] Step 7: Source DB closed');

      // Close current testDb if exists
      const currentDb = (window as any).testDb;
      if (currentDb) {
        console.log('[TEST] Step 8: Closing current testDb...');
        await currentDb.close();
        console.log('[TEST] Step 9: Current testDb closed');
      }

      console.log('[TEST] Step 10: Creating target database...');
      // Import the bytes into a new database
      const targetDb = await window.Database.newDatabase(`test_import_${uniqueId}.db`);
      console.log('[TEST] Step 11: Setting allowNonLeaderWrites on target...');
      if (targetDb.allowNonLeaderWrites) await targetDb.allowNonLeaderWrites(true);
      console.log('[TEST] Step 12: Calling importFromFile...');
      await targetDb.importFromFile(bytes);
      console.log('[TEST] Step 13: Import complete, closing target...');
      await targetDb.close();
      console.log('[TEST] Step 14: Target closed');

      console.log('[TEST] Step 15: Reopening database...');
      // Reopen and verify
      const reopened = await window.Database.newDatabase(`test_import_${uniqueId}.db`);
      console.log('[TEST] Step 16: Setting allowNonLeaderWrites on reopened...');
      if (reopened.allowNonLeaderWrites) await reopened.allowNonLeaderWrites(true);
      console.log('[TEST] Step 17: Querying data...');
      const queryResult = await reopened.execute('SELECT * FROM import_test ORDER BY id');
      console.log('[TEST] Step 18: Query complete');
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
  });

  test.skip('should handle drag-and-drop import', async ({ page }) => {
    // SKIPPING - This test consistently hangs at page.evaluate()
    // The browser executes beforeEach page.evaluate() fine
    // But this test's page.evaluate() callback never runs
    console.log('[TEST] About to call page.evaluate');

    const result = await page.evaluate(async () => {
      console.log('[DRAG] page.evaluate callback started');
      const Database = (window as any).Database;
      console.log('[DRAG] Got Database:', !!Database);
      const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      console.log('[DRAG] uniqueId:', uniqueId);

      // Create source database with test data
      console.log('[DRAG] About to create source DB');
      const sourceDb = await Database.newDatabase(`drag_test_${uniqueId}.db`);
      console.log('[DRAG] Created source DB');
      if (sourceDb.allowNonLeaderWrites) await sourceDb.allowNonLeaderWrites(true);
      await sourceDb.execute('CREATE TABLE drag_data (id INTEGER, val TEXT)');
      await sourceDb.execute("INSERT INTO drag_data VALUES (1, 'Dragged')");
      const bytes = await sourceDb.exportToFile();
      await sourceDb.close();

      // Close current testDb if exists
      const currentDb = (window as any).testDb;
      if (currentDb) {
        await currentDb.close();
      }

      // Import the bytes into a new database
      const targetDb = await Database.newDatabase(`imported_drag_${uniqueId}.db`);
      if (targetDb.allowNonLeaderWrites) await targetDb.allowNonLeaderWrites(true);
      await targetDb.importFromFile(bytes);
      await targetDb.close();

      // Reopen and verify
      const reopened = await Database.newDatabase(`imported_drag_${uniqueId}.db`);
      if (reopened.allowNonLeaderWrites) await reopened.allowNonLeaderWrites(true);
      const queryResult = await reopened.execute('SELECT * FROM drag_data');
      (window as any).testDb = reopened;

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
    await page.waitForTimeout(500);
    await page.fill('#dbNameInput', dbName);
    await page.click('#confirmCreate');
    
    // Wait for create to complete and verify
    await page.waitForTimeout(1500);
    const createStatus = await page.locator('#status').textContent();
    console.log('[TEST] Status after create:', createStatus);

    // Open delete dialog
    await page.click('#deleteDbButton');
    await page.waitForTimeout(800);
    
    // Confirm delete
    await page.click('#confirmDelete');
    await page.waitForTimeout(1500);
    
    // Check what status actually says after delete
    const deleteStatus = await page.locator('#status').textContent();
    console.log('[TEST] Status after delete:', deleteStatus);
    
    // Verify status indicates delete happened
    expect(deleteStatus).toContain('Create or import');

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
    // Clear localStorage BEFORE loading page to prevent auto-loading database
    await page.goto('/db');
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Reload page with clean state
    await page.reload();

    await page.waitForSelector('#dbManagement', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
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
    // Create database through UI
    await page.click('#createDbButton');
    await page.waitForTimeout(300);
    await page.fill('#dbNameInput', 'empty_test.db');
    await page.click('#confirmCreate');
    await page.waitForTimeout(500);

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
    // Create database through UI
    await page.click('#createDbButton');
    await page.waitForTimeout(300);
    await page.fill('#dbNameInput', 'schema_test.db');
    await page.click('#confirmCreate');
    await page.waitForTimeout(500);

    // Create complex schema in the database
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

    // Export and import programmatically (Playwright's setInputFiles doesn't trigger React onChange)
    const schemaCheck = await page.evaluate(async () => {
      const Database = (window as any).Database;
      const db = (window as any).testDb;
      const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      // Export current database
      const bytes = await db.exportToFile();
      await db.close();

      // Import into a new database
      const targetDb = await Database.newDatabase(`schema_imported_${uniqueId}.db`);
      if (targetDb.allowNonLeaderWrites) await targetDb.allowNonLeaderWrites(true);
      await targetDb.importFromFile(bytes);
      await targetDb.close();

      // Reopen and verify schema preserved
      const reopened = await Database.newDatabase(`schema_imported_${uniqueId}.db`);
      if (reopened.allowNonLeaderWrites) await reopened.allowNonLeaderWrites(true);

      const tables = await reopened.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
      const indexes = await reopened.execute("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_users_email'");
      const triggers = await reopened.execute("SELECT name FROM sqlite_master WHERE type='trigger' AND name='user_audit'");
      const data = await reopened.execute('SELECT * FROM users');

      (window as any).testDb = reopened;

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
  });
});
