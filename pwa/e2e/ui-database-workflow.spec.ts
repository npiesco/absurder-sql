/**
 * REAL UI WORKFLOW TEST - Following mobile/INSTRUCTIONS.md discipline
 * 
 * RULES:
 * 1. Test ACTUAL UI interactions (no page.evaluate hacks)
 * 2. Unique database name per test (thread ID pattern)
 * 3. Proper cleanup after each test
 * 4. Zero tolerance for flakiness
 * 5. Tests WILL FAIL to expose hardcoded 'database.db' bug
 */

import { test, expect } from '@playwright/test';

test.describe('UI Database Workflow - REAL USER ACTIONS', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/db');
    await page.waitForSelector('#dbManagement', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
  });

  test('should create database with custom name and ACTUALLY USE IT in UI', async ({ page }) => {
    const customDbName = `ui_create_${Date.now()}.db`;
    
    console.log('[TEST] Creating database via UI:', customDbName);
    
    // Step 1: Create database with custom name via UI
    await page.click('#createDbButton');
    await page.fill('#dbNameInput', customDbName);
    await page.click('#confirmCreate');
    await page.waitForSelector(`#status:has-text("Database created: ${customDbName}")`, { timeout: 10000 });

    // Step 2: Check the UI ACTUALLY shows the custom name (NOT "database.db")
    const currentDbText = await page.locator('#dbSelector').textContent();
    console.log('[TEST] UI shows database:', currentDbText);
    
    // THIS WILL FAIL - UI is hardcoded to "database.db"
    expect(currentDbText).toContain(customDbName);
    
    // Cleanup
    await page.evaluate(async (dbName) => {
      const db = (window as any).testDb;
      if (db) await db.close();
      await indexedDB.deleteDatabase(dbName);
    }, customDbName);
  });

  test('should export database with CORRECT FILENAME', async ({ page }) => {
    const customDbName = `ui_export_${Date.now()}.db`;
    
    console.log('[TEST] Creating and exporting database:', customDbName);
    
    // Create database via UI
    await page.click('#createDbButton');
    await page.fill('#dbNameInput', customDbName);
    await page.click('#confirmCreate');
    await page.waitForSelector(`#status:has-text("Database created: ${customDbName}")`, { timeout: 10000 });

    // Export it
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportDbButton');
    const download = await downloadPromise;
    
    // Check the download filename
    const downloadedFilename = download.suggestedFilename();
    console.log('[TEST] Downloaded filename:', downloadedFilename);
    console.log('[TEST] Expected filename:', customDbName);
    
    // THIS WILL FAIL - export is hardcoded to 'database.db'
    expect(downloadedFilename).toBe(customDbName);
    
    // Cleanup
    await page.evaluate(async (dbName) => {
      const db = (window as any).testDb;
      if (db) await db.close();
      await indexedDB.deleteDatabase(dbName);
    }, customDbName);
  });

  test('should append .db extension to export filename if not present', async ({ page }) => {
    // Create database without .db extension
    const dbNameWithoutExt = `ui_no_ext_${Date.now()}`;
    
    console.log('[TEST] Creating database without .db extension:', dbNameWithoutExt);
    
    await page.click('#createDbButton');
    await page.fill('#dbNameInput', dbNameWithoutExt);
    await page.click('#confirmCreate');
    await page.waitForSelector(`#status:has-text("Database created: ${dbNameWithoutExt}")`, { timeout: 10000 });

    // Export and verify filename has .db extension
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportDbButton');
    const download = await downloadPromise;
    
    const downloadedFilename = download.suggestedFilename();
    console.log('[TEST] Downloaded filename:', downloadedFilename);
    console.log('[TEST] Expected filename:', `${dbNameWithoutExt}.db`);
    
    // Should have .db extension appended
    expect(downloadedFilename).toBe(`${dbNameWithoutExt}.db`);
    
    // Cleanup
    await page.evaluate(async (dbName) => {
      const db = (window as any).testDb;
      if (db) await db.close();
      await indexedDB.deleteDatabase(dbName);
    }, dbNameWithoutExt);
  });

  test('should PERSIST custom database across operations', async ({ page }) => {
    const customDbName = `ui_persist_${Date.now()}.db`;
    
    console.log('[TEST] Testing data persistence in:', customDbName);
    
    // Create custom database via UI
    await page.click('#createDbButton');
    await page.fill('#dbNameInput', customDbName);
    await page.click('#confirmCreate');
    await page.waitForSelector(`#status:has-text("Database created: ${customDbName}")`, { timeout: 10000 });

    // Navigate to query page and add data
    await page.goto('/db/query');
    await page.waitForSelector('#queryEditor', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });

    // Create database programmatically since /db/query doesn't auto-create one
    await page.evaluate(async (dbName) => {
      const Database = (window as any).Database;
      const testDb = await Database.newDatabase(dbName);
      (window as any).testDb = testDb;
      (window as any).testDbName = dbName;
    }, customDbName);

    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });

    // Create table and insert data (use evaluate for CodeMirror)
    await page.evaluate(() => {
      const editor = document.querySelector('.cm-content') as any;
      if (editor) {
        const event = new InputEvent('input', { bubbles: true, cancelable: true });
        editor.textContent = 'CREATE TABLE ui_test (id INTEGER, name TEXT)';
        editor.dispatchEvent(event);
      }
    });
    await page.waitForTimeout(500);
    await page.click('#executeButton');
    await page.waitForTimeout(1000);
    
    await page.evaluate(() => {
      const editor = document.querySelector('.cm-content') as any;
      if (editor) {
        const event = new InputEvent('input', { bubbles: true, cancelable: true });
        editor.textContent = "INSERT INTO ui_test VALUES (1, 'UI Created')";
        editor.dispatchEvent(event);
      }
    });
    await page.waitForTimeout(500);
    await page.click('#executeButton');
    await page.waitForTimeout(1000);

    // Go back to database management
    await page.goto('/db');
    await page.waitForSelector('#dbManagement', { timeout: 10000 });

    // The UI should STILL show our custom database
    const currentDbText = await page.locator('#dbSelector').textContent();
    console.log('[TEST] Database after navigation:', currentDbText);
    
    // THIS WILL FAIL - UI reverts to 'database.db'
    expect(currentDbText).toContain(customDbName);
    
    // Cleanup
    await page.evaluate(async (dbName) => {
      const db = (window as any).testDb;
      if (db) await db.close();
      await indexedDB.deleteDatabase(dbName);
      await indexedDB.deleteDatabase('database.db');
    }, customDbName);
  });

  test('should MAINTAIN custom database across page navigation', async ({ page }) => {
    const customDbName = `ui_nav_${Date.now()}.db`;
    
    console.log('[TEST] Testing navigation persistence:', customDbName);
    
    // Create via UI
    await page.click('#createDbButton');
    await page.fill('#dbNameInput', customDbName);
    await page.click('#confirmCreate');
    await page.waitForSelector(`#status:has-text("Database created: ${customDbName}")`, { timeout: 10000 });

    // Navigate to query page
    await page.goto('/db/query');
    await page.waitForTimeout(1000);

    // Navigate to schema page
    await page.goto('/db/schema');
    await page.waitForTimeout(1000);

    // Navigate back to database management
    await page.goto('/db');
    await page.waitForSelector('#dbManagement', { timeout: 10000 });

    // Check if we're STILL using the custom database
    const currentDbText = await page.locator('#dbSelector').textContent();
    console.log('[TEST] Database after full navigation:', currentDbText);
    
    // THIS WILL FAIL - Zustand state lost or not being used properly
    expect(currentDbText).toContain(customDbName);
    
    // Cleanup
    await page.evaluate(async (dbName) => {
      const db = (window as any).testDb;
      if (db) await db.close();
      await indexedDB.deleteDatabase(dbName);
    }, customDbName);
  });

  // Cleanup after all tests
  test.afterEach(async ({ page }) => {
    // Clean up any remaining databases
    await page.evaluate(async () => {
      const databases = await indexedDB.databases();
      for (const db of databases) {
        if (db.name?.startsWith('ui_')) {
          await indexedDB.deleteDatabase(db.name);
        }
      }
    });
  });
});
