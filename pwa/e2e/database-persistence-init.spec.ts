/**
 * Test to isolate database initialization bug
 * 
 * ISSUE: When currentDbName is persisted in Zustand localStorage,
 * the database management page should load that database on init.
 * Instead it shows "Create or import a database to get started"
 */

import { test, expect } from '@playwright/test';

test.describe('Database Initialization Bug', () => {
  
  test('should load persisted database from localStorage on page init', async ({ page }) => {
    const testDbName = 'persisted_db_test.db';
    
    // Step 1: Create a database and verify it persists
    await page.goto('/db');
    await page.waitForSelector('#dbManagement', { timeout: 10000 });
    
    // Create database
    await page.click('#createDbButton');
    await page.fill('#dbNameInput', testDbName);
    await page.click('#confirmCreate');
    await page.waitForSelector(`#status:has-text("Database created: ${testDbName}")`, { timeout: 10000 });
    
    // Verify currentDbName is shown
    const dbSelector = await page.locator('#dbSelector').textContent();
    expect(dbSelector).toContain(testDbName);
    
    // Step 2: Check localStorage has the database name
    const storedState = await page.evaluate(() => {
      const stored = localStorage.getItem('absurder-sql-database-store');
      return stored ? JSON.parse(stored) : null;
    });
    
    console.log('[TEST] Stored state:', JSON.stringify(storedState, null, 2));
    expect(storedState?.state?.currentDbName).toBe(testDbName);
    
    // Step 3: Reload the page (simulating browser refresh)
    await page.reload();
    await page.waitForSelector('#dbManagement', { timeout: 10000 });
    await page.waitForTimeout(1000); // Wait for init
    
    // Step 4: THE BUG - status should show loaded DB, not "Create or import"
    const status = await page.locator('#status').textContent();
    console.log('[TEST] Status after reload:', status);
    
    const dbSelectorAfterReload = await page.locator('#dbSelector').textContent();
    console.log('[TEST] DB selector after reload:', dbSelectorAfterReload);
    
    // This SHOULD pass but currently FAILS
    expect(status).not.toContain('Create or import a database to get started');
    expect(status).toContain(`Loaded: ${testDbName}`);
    expect(dbSelectorAfterReload).toContain(testDbName);
    
    // Step 5: Verify database is actually loaded (can refresh info)
    await page.click('#refreshInfo');
    await page.waitForTimeout(500);
    
    const statusAfterRefresh = await page.locator('#status').textContent();
    console.log('[TEST] Status after refresh:', statusAfterRefresh);
    expect(statusAfterRefresh).not.toContain('Create or import');
    
    // Cleanup
    await page.evaluate(async (dbName) => {
      const db = (window as any).testDb;
      if (db) await db.close();
      await indexedDB.deleteDatabase(dbName);
      localStorage.removeItem('absurder-sql-database-store');
    }, testDbName);
  });

  test('should show sqlite_master when system tables checkbox is enabled', async ({ page }) => {
    const testDbName = 'system_tables_test.db';
    
    await page.goto('/db');
    await page.waitForSelector('#dbManagement', { timeout: 10000 });
    
    // Create database
    await page.click('#createDbButton');
    await page.fill('#dbNameInput', testDbName);
    await page.click('#confirmCreate');
    await page.waitForSelector(`#status:has-text("Database created: ${testDbName}")`, { timeout: 10000 });
    
    // Initially should show 0 tables
    await page.click('#refreshInfo');
    await page.waitForTimeout(500);
    let tableCount = await page.locator('#tableCount').textContent();
    expect(tableCount).toBe('0');
    
    // Enable system tables
    await page.check('#showSystemTables');
    await page.waitForTimeout(500); // Auto-refresh triggers
    
    // Now query sqlite_master directly to see what's there
    const actualTables = await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (!db) return null;
      
      // Query ALL tables including system ones
      const result = await db.execute("SELECT type, name FROM sqlite_master ORDER BY name");
      return result.rows.map((r: any) => ({
        type: r.values[0].value,
        name: r.values[1].value
      }));
    });
    
    console.log('[TEST] Actual sqlite_master contents:', JSON.stringify(actualTables, null, 2));
    
    // Fresh empty database has ZERO rows in sqlite_master
    // sqlite_master exists but returns 0 rows until you create something
    if (actualTables && actualTables.length === 0) {
      console.log('[TEST] Confirmed: Empty database has 0 rows in sqlite_master');
      tableCount = await page.locator('#tableCount').textContent();
      expect(tableCount).toBe('0');
    } else {
      console.log('[TEST] Database has schema objects:', actualTables);
      // If there ARE objects, the count should match
      tableCount = await page.locator('#tableCount').textContent();
      expect(parseInt(tableCount || '0')).toBe(actualTables?.length || 0);
    }
    
    // Cleanup
    await page.evaluate(async (dbName) => {
      const db = (window as any).testDb;
      if (db) await db.close();
      await indexedDB.deleteDatabase(dbName);
    }, testDbName);
  });
});
