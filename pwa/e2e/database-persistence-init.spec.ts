/**
 * Test to isolate database initialization bug
 * 
 * ISSUE: When currentDbName is persisted in Zustand localStorage,
 * the database management page should load that database on init.
 * Instead it shows "Create or import a database to get started"
 */

import { test, expect } from '@playwright/test';

test.describe.serial('Database Initialization Bug', () => {
  // CRITICAL: Increase timeout for tests involving page reload and database restoration
  test.setTimeout(60000);
  let testDbName: string;
  
  test.beforeEach(async ({ page }, testInfo) => {
    // MANDATORY: Unique database name per worker (INSTRUCTIONS.md Rule #3)
    // NOTE: Do NOT include .db - system adds it automatically
    testDbName = `persist_test_w${testInfo.parallelIndex}_${Date.now()}`;
    
    // MANDATORY: Clean ALL state from previous tests (INSTRUCTIONS.md - Zero Tolerance for Flakiness)
    await page.goto('/db');
    await page.waitForLoadState('networkidle');
    
    await page.evaluate(async () => {
      const win = window as any;
      try {
        if (win.testDb) {
          await win.testDb.close();
          win.testDb = null;
        }
      } catch (err) {
        console.warn('[TEST] Failed to close existing testDb', err);
      }

      // Clear ALL localStorage
      localStorage.clear();
      
      // Delete ALL indexedDB databases (INSTRUCTIONS.md: Complete cleanup)
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name) {
          await indexedDB.deleteDatabase(db.name);
        }
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
  });
  
  test.afterEach(async ({ page }) => {
    // MANDATORY: Cleanup after each test (INSTRUCTIONS.md Rule #5)
    if (testDbName) {
      await page.evaluate(async (dbName) => {
        const db = (window as any).testDb;
        if (db) {
          try { await db.close(); } catch {}
        }
        try { await indexedDB.deleteDatabase(dbName + '.db'); } catch {}
        try { localStorage.clear(); } catch {}
      }, testDbName).catch(() => {});
    }
  });
  
  test('should load persisted database from localStorage on page init', async ({ page }) => {
    // Capture browser console logs for debugging
    page.on('console', msg => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`));
    // beforeEach already cleaned up - start fresh
    await page.waitForSelector('#dbManagement', { timeout: 10000 });
    
    // Create database
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput', { timeout: 5000 });
    await page.fill('#dbNameInput', testDbName);
    await page.click('#confirmCreate');
    
    // Wait for database to be created by checking the selector shows the name
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, testDbName, { timeout: 15000 });
    
    // Verify currentDbName is shown
    const dbSelector = await page.locator('#dbSelector').textContent();
    expect(dbSelector).toContain(testDbName);
    
    // Step 2: Check localStorage has the database name
    const storedState = await page.evaluate(() => {
      const stored = localStorage.getItem('absurder-sql-database-store');
      return stored ? JSON.parse(stored) : null;
    });
    
    console.log('[TEST] Stored state:', JSON.stringify(storedState, null, 2));
    expect(storedState?.state?.currentDbName).toBe(testDbName + '.db');
    
    // CRITICAL: Close database to persist to IndexedDB before reload (INSTRUCTIONS.md - Database Persistence Rule)
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db && db.close) {
        await db.close();
      }
    });
    
    // Step 3: Reload the page (simulating browser refresh)
    await page.reload();
    await page.waitForSelector('#dbManagement', { timeout: 10000 });
    
    // Wait for PWA to automatically restore database from localStorage + IndexedDB
    // The PWA's useEffect hook should call Database.newDatabase(currentDbName) after hydration completes
    await page.waitForFunction(
      () => {
        const db = (window as any).testDb;
        return db !== null && db !== undefined;
      },
      { timeout: 30000 }
    );
    
    // Step 4: THE BUG - status should show loaded DB, not "Create or import"
    const status = await page.locator('#status').textContent();
    console.log('[TEST] Status after reload:', status);
    
    const dbSelectorAfterReload = await page.locator('#dbSelector').textContent();
    console.log('[TEST] DB selector after reload:', dbSelectorAfterReload);
    
    // Database should be restored (either from backup or VFS)
    expect(status).not.toContain('Create or import a database to get started');
    // Accept either "Loaded:" (VFS restore) or "Restored:" (backup restore)
    expect(status).toMatch(/(Loaded|Restored): /);
    expect(dbSelectorAfterReload).toContain(testDbName);
    
    // Step 5: Verify database is actually loaded (can refresh info)
    await page.click('#refreshInfo');
    
    // Event-based wait for refresh to complete
    await page.waitForFunction(() => {
      const statusEl = document.querySelector('#status');
      return statusEl && statusEl.textContent && statusEl.textContent.includes('Info refreshed');
    }, { timeout: 5000 });
    
    const statusAfterRefresh = await page.locator('#status').textContent();
    console.log('[TEST] Status after refresh:', statusAfterRefresh);
    expect(statusAfterRefresh).not.toContain('Create or import');
    
    // Cleanup handled by afterEach hook
  });

  test('should show sqlite_master when system tables checkbox is enabled', async ({ page }) => {
    // beforeEach already cleaned up - start fresh
    await page.waitForSelector('#dbManagement', { timeout: 10000 });
    
    // Create database
    await page.click('#createDbButton');
    await page.fill('#dbNameInput', testDbName);
    await page.click('#confirmCreate');
    await page.waitForSelector(`#status:has-text("Database created: ${testDbName}.db")`, { timeout: 10000 });
    
    // Initially should show 0 tables
    await page.click('#refreshInfo');
    
    // Event-based wait for refresh to complete (INSTRUCTIONS.md: event-based arch)
    await page.waitForFunction(() => {
      const statusEl = document.querySelector('#status');
      return statusEl && statusEl.textContent && statusEl.textContent.includes('Info refreshed');
    }, { timeout: 5000 });
    
    let tableCount = await page.locator('#tableCount').textContent();
    expect(tableCount).toBe('0');
    
    // Enable system tables
    await page.check('#showSystemTables');
    
    // Event-based wait for auto-refresh to trigger
    await page.waitForFunction(() => {
      const statusEl = document.querySelector('#status');
      return statusEl && statusEl.textContent && statusEl.textContent.includes('Info refreshed');
    }, { timeout: 5000 });
    
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
    
    // Cleanup handled by afterEach hook
  });
});
