/**
 * DIAGNOSTIC TEST - Isolate database creation hang
 * This test does the MINIMUM needed to create a database programmatically
 */
import { test, expect } from '@playwright/test';

test.describe('DIAGNOSTIC: Database Creation', () => {
  test('should create database programmatically with full logging', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.log(`[BROWSER ERROR] ${err.message}`));

    console.log('[TEST] Step 1: Navigate to /db/query');
    await page.goto('/db/query');

    console.log('[TEST] Step 2: Wait for page load');
    await page.waitForLoadState('networkidle');

    console.log('[TEST] Step 3: Wait for queryInterface selector');
    const interfaceFound = await page.waitForSelector('#queryInterface', { timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    console.log(`[TEST] queryInterface found: ${interfaceFound}`);

    console.log('[TEST] Step 4: Check if window.Database exists');
    const databaseExists = await page.evaluate(() => {
      return typeof (window as any).Database !== 'undefined';
    });
    console.log(`[TEST] window.Database exists: ${databaseExists}`);

    console.log('[TEST] Step 5: Check if Database.newDatabase exists');
    const newDatabaseExists = await page.evaluate(() => {
      const Database = (window as any).Database;
      return Database && typeof Database.newDatabase === 'function';
    });
    console.log(`[TEST] Database.newDatabase exists: ${newDatabaseExists}`);

    console.log('[TEST] Step 6: Call Database.newDatabase() with logging');
    const result = await page.evaluate(async () => {
      const Database = (window as any).Database;
      console.log('[EVAL] About to call Database.newDatabase("diagnostic-test")');

      try {
        const startTime = Date.now();
        console.log('[EVAL] Calling newDatabase...');
        const testDb = await Database.newDatabase('diagnostic-test');
        const endTime = Date.now();
        console.log(`[EVAL] newDatabase completed in ${endTime - startTime}ms`);

        (window as any).testDb = testDb;
        console.log('[EVAL] testDb assigned to window');

        return { success: true, time: endTime - startTime };
      } catch (error: any) {
        console.error('[EVAL] Error creating database:', error);
        return { success: false, error: error.message };
      }
    });

    console.log(`[TEST] Database creation result:`, result);
    expect(result.success).toBe(true);

    console.log('[TEST] Step 7: Verify testDb exists on window');
    const testDbExists = await page.evaluate(() => {
      return typeof (window as any).testDb !== 'undefined';
    });
    console.log(`[TEST] testDb exists: ${testDbExists}`);
    expect(testDbExists).toBe(true);

    console.log('[TEST] ✅ ALL STEPS PASSED');
  });
});
