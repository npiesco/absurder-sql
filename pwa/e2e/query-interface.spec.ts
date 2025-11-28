import { test, expect } from '@playwright/test';

test.describe('Query Interface E2E', () => {
  // Unique database name per test run to avoid parallel test conflicts
  const testDbName = `query-interface-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.db`;

  test.beforeEach(async ({ page }) => {
    await page.goto('/db/query');
    await page.waitForSelector('#queryInterface', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });

    // Create database programmatically since /db/query doesn't auto-create one
    await page.evaluate(async (dbName) => {
      const Database = (window as any).Database;
      const testDb = await Database.newDatabase(dbName);
      (window as any).testDb = testDb;
      (window as any).testDbName = dbName;
    }, testDbName);

    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      const dbName = (window as any).testDbName;
      if (db) { try { await db.close(); } catch {} }
      if (dbName) { try { await indexedDB.deleteDatabase(dbName); } catch {} }
    }).catch(() => {});
  });

  test('should display SQL editor', async ({ page }) => {
    const editor = await page.locator('#sqlEditor');
    await expect(editor).toBeVisible();
  });

  test('should execute SQL query and display results', async ({ page }) => {
    // Enter query first (button is disabled without SQL)
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT 1');
    
    // Wait for database to be ready
    await page.waitForSelector('#executeButton:not([disabled])');
    
    // Setup test data
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS query_test');
      await db.execute('CREATE TABLE query_test (id INTEGER, name TEXT)');
      await db.execute('INSERT INTO query_test VALUES (1, ?)', [{ type: 'Text', value: 'Alice' }]);
      await db.execute('INSERT INTO query_test VALUES (2, ?)', [{ type: 'Text', value: 'Bob' }]);
    });

    // Enter actual query
    await page.keyboard.press('Meta+A');
    await page.keyboard.type('SELECT * FROM query_test');
    
    // Execute
    await page.click('#executeButton');
    
    // Wait for results
    await page.waitForSelector('#resultsTable');
    
    // Verify results
    const rowCount = await page.locator('#resultsTable tbody tr').count();
    expect(rowCount).toBe(2);
    
    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS query_test');
    });
  });

  test('should display query execution error', async ({ page }) => {
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT * FROM nonexistent_table');
    await page.click('#executeButton');
    
    await page.waitForSelector('#errorDisplay');
    
    const errorText = await page.textContent('#errorDisplay');
    expect(errorText?.toLowerCase()).toContain('failed');
  });

  test('should save query to history', async ({ page }) => {
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT 1');
    await page.click('#executeButton');
    
    await page.waitForSelector('#resultsTable');
    
    // Check history
    await page.click('#historyButton');
    await page.waitForSelector('#queryHistory');
    
    const historyItems = await page.locator('#queryHistory .history-item').count();
    expect(historyItems).toBeGreaterThan(0);
  });

  test('should load query from history', async ({ page }) => {
    const testQuery = 'SELECT 42 as answer';
    
    // Execute a query
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type(testQuery);
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable');
    
    // Clear editor
    await page.keyboard.press('Meta+A');
    await page.keyboard.press('Backspace');
    
    // Open history and load query
    await page.click('#historyButton');
    await page.waitForSelector('#queryHistory');
    await page.click('#queryHistory .history-item:first-child');
    
    // Verify query loaded
    const editorValue = await page.locator('.cm-editor .cm-content').textContent();
    expect(editorValue).toBe(testQuery);
  });

  test('should display column names in results', async ({ page }) => {
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT 1');
    await page.waitForSelector('#executeButton:not([disabled])');
    
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS cols_test');
      await db.execute('CREATE TABLE cols_test (id INTEGER, name TEXT, age INTEGER)');
      await db.execute('INSERT INTO cols_test VALUES (1, ?, 25)', [{ type: 'Text', value: 'Test' }]);
    });

    await page.keyboard.press('Meta+A');
    await page.keyboard.type('SELECT * FROM cols_test');
    await page.click('#executeButton');
    
    await page.waitForSelector('#resultsTable');
    
    // Check column headers
    const headers = await page.locator('#resultsTable thead th').allTextContents();
    expect(headers).toContain('id');
    expect(headers).toContain('name');
    expect(headers).toContain('age');
    
    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS cols_test');
    });
  });

  test('should show execution time', async ({ page }) => {
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT 1');
    await page.click('#executeButton');
    
    await page.waitForSelector('#executionTime');
    
    const timeText = await page.textContent('#executionTime');
    expect(timeText).toMatch(/\d+(\.\d+)?\s*ms/);
  });
});
