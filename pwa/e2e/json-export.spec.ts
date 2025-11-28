import { test, expect } from '@playwright/test';
import path from 'path';
import { readFileSync, existsSync, unlinkSync } from 'fs';

test.describe('JSON Export', () => {
  // Unique database name per test run to avoid parallel test conflicts
  const testDbName = `json-export-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.db`;

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

    // Type something to enable execute button (waits for DB to be ready)
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT 1');
    await page.waitForSelector('#executeButton:not([disabled])', { timeout: 10000 });

    // Enable non-leader writes to bypass leader election timeouts
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db && db.allowNonLeaderWrites) {
        await db.allowNonLeaderWrites(true);
      }
    });

    // Create test database with sample data
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS products');
      await db.execute(`
        CREATE TABLE products (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          price REAL,
          stock INTEGER,
          created_at TEXT,
          metadata TEXT
        )
      `);
      await db.execute(`
        INSERT INTO products (id, name, price, stock, created_at, metadata) VALUES
        (1, 'Laptop', 999.99, 10, '2024-01-15T10:30:00Z', '{"brand":"Dell","color":"silver"}'),
        (2, 'Mouse', 29.99, 50, '2024-02-20T14:45:00Z', '{"brand":"Logitech","wireless":true}'),
        (3, 'Keyboard', 79.99, 25, '2024-03-10T09:15:00Z', '{"brand":"Corsair","mechanical":true}'),
        (4, 'Monitor', 299.99, NULL, '2024-04-05T16:20:00Z', NULL)
      `);
    });

    // Clear the editor for the test
    await page.keyboard.press('Meta+A');
    await page.keyboard.press('Backspace');
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      const dbName = (window as any).testDbName;
      if (db) { try { await db.close(); } catch {} }
      if (dbName) { try { await indexedDB.deleteDatabase(dbName); } catch {} }
    }).catch(() => {});
  });

  test('should display export JSON button when query has results', async ({ page }) => {
    // Run query
    await page.keyboard.type('SELECT * FROM products LIMIT 2');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable', { state: 'visible', timeout: 10000 });

    // Check export button is visible
    const exportButton = await page.locator('#exportJSON');
    await expect(exportButton).toBeVisible();
  });

  test('should export JSON with default options (array of objects, pretty print)', async ({ page, context }) => {
    // Run query
    await page.keyboard.type('SELECT id, name, price FROM products WHERE id <= 3');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable', { state: 'visible', timeout: 10000 });

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportJSON');
    const download = await downloadPromise;

    // Verify filename
    const filename = download.suggestedFilename();
    expect(filename.endsWith('.json')).toBe(true);

    // Verify content
    const downloadPath = await download.path();
    const jsonContent = readFileSync(downloadPath!, 'utf-8');
    const data = JSON.parse(jsonContent);

    // Should be array of objects
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(3);

    // Verify data structure
    expect(data[0]).toEqual({ id: 1, name: 'Laptop', price: 999.99 });
    expect(data[1]).toEqual({ id: 2, name: 'Mouse', price: 29.99 });
    expect(data[2]).toEqual({ id: 3, name: 'Keyboard', price: 79.99 });

    // Verify pretty print (should have indentation)
    expect(jsonContent).toContain('  ');
    expect(jsonContent).toContain('\n');
  });

  test('should open export options dialog and configure settings', async ({ page }) => {
    // Run query
    await page.keyboard.type('SELECT * FROM products LIMIT 1');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable', { state: 'visible', timeout: 10000 });

    // Click export options button
    await page.click('#exportJSONOptions');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Verify dialog opened
    const dialog = await page.locator('[role="dialog"]').filter({ hasText: 'JSON Export Options' });
    await expect(dialog).toBeVisible();

    // Check all options are present
    await expect(page.locator('#prettyPrint')).toBeVisible();
    await expect(page.locator('#jsonFormat')).toBeVisible();
  });

  test('should export JSON in compact mode (no pretty print)', async ({ page, context }) => {
    // Run query
    await page.keyboard.type('SELECT id, name FROM products WHERE id <= 2');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable', { state: 'visible', timeout: 10000 });

    // Open export options
    await page.click('#exportJSONOptions');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Disable pretty print
    await page.click('#prettyPrint');

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#confirmJSONExport');
    const download = await downloadPromise;

    // Verify compact format (no extra whitespace)
    const downloadPath = await download.path();
    const jsonContent = readFileSync(downloadPath!, 'utf-8');

    // Compact should be single line or minimal whitespace
    const lines = jsonContent.split('\n');
    expect(lines.length).toBeLessThan(5); // Should be compact, not many lines
  });

  test('should export as object of objects with ID keys', async ({ page, context }) => {
    // Run query
    await page.keyboard.type('SELECT id, name, price FROM products WHERE id <= 2');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable', { state: 'visible', timeout: 10000 });

    // Open export options
    await page.click('#exportJSONOptions');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Select "Object (keyed by id)" format
    await page.click('#jsonFormat');
    await page.waitForSelector('[role="option"]', { state: 'visible' });
    await page.click('text=Object (keyed by id)');

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#confirmJSONExport');
    const download = await downloadPromise;

    // Verify object format
    const downloadPath = await download.path();
    const jsonContent = readFileSync(downloadPath!, 'utf-8');
    const data = JSON.parse(jsonContent);

    // Should be object with id keys
    expect(Array.isArray(data)).toBe(false);
    expect(typeof data).toBe('object');
    expect(data['1']).toEqual({ id: 1, name: 'Laptop', price: 999.99 });
    expect(data['2']).toEqual({ id: 2, name: 'Mouse', price: 29.99 });
  });

  test('should handle NULL values correctly in JSON', async ({ page, context }) => {
    // Run query with NULL
    await page.keyboard.type('SELECT id, name, stock FROM products WHERE id = 4');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable', { state: 'visible', timeout: 10000 });

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportJSON');
    const download = await downloadPromise;

    // Verify NULL is represented as JSON null
    const downloadPath = await download.path();
    const jsonContent = readFileSync(downloadPath!, 'utf-8');
    const data = JSON.parse(jsonContent);

    expect(data[0].stock).toBe(null);
    expect(jsonContent).toContain('"stock": null');
  });

  test('should export empty results as empty array', async ({ page, context }) => {
    // Run query with no results
    await page.keyboard.type('SELECT id, name, price FROM products WHERE id = 999');
    await page.click('#executeButton');

    // Wait for query execution to complete (either results table, empty state, or "no rows" message)
    await page.waitForFunction(() => {
      const resultsTable = document.getElementById('resultsTable');
      const emptyResults = document.querySelector('[data-testid="empty-results"]');
      const noRowsText = document.body.textContent?.toLowerCase().includes('no rows') ||
                         document.body.textContent?.toLowerCase().includes('no results') ||
                         document.body.textContent?.toLowerCase().includes('0 rows');
      return resultsTable || emptyResults || noRowsText;
    }, { timeout: 10000 });

    // Export should still work
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportJSON');
    const download = await downloadPromise;

    // Verify empty array
    const downloadPath = await download.path();
    const jsonContent = readFileSync(downloadPath!, 'utf-8');
    const data = JSON.parse(jsonContent);

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
    expect(jsonContent.trim()).toBe('[]');
  });

  test('should preserve data types in JSON export', async ({ page, context }) => {
    // Run query
    await page.keyboard.type('SELECT id, name, price, stock FROM products WHERE id = 1');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable', { state: 'visible', timeout: 10000 });

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportJSON');
    const download = await downloadPromise;

    // Verify data types
    const downloadPath = await download.path();
    const jsonContent = readFileSync(downloadPath!, 'utf-8');
    const data = JSON.parse(jsonContent);

    const row = data[0];
    expect(typeof row.id).toBe('number');
    expect(typeof row.name).toBe('string');
    expect(typeof row.price).toBe('number');
    expect(typeof row.stock).toBe('number');
  });

  test('should export large result set efficiently', async ({ page, context }) => {
    // Create large dataset
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('BEGIN TRANSACTION');
      for (let i = 5; i <= 1000; i++) {
        await db.execute(
          `INSERT INTO products (id, name, price, stock, created_at) VALUES (${i}, 'Product ${i}', ${Math.random() * 1000}, ${Math.floor(Math.random() * 100)}, '2024-01-01T00:00:00Z')`
        );
      }
      await db.execute('COMMIT');
    });

    // Run query for all rows
    await page.keyboard.type('SELECT * FROM products');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable', { state: 'visible', timeout: 30000 }); // Allow time for large result set

    // Export
    const start = Date.now();
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportJSON');
    const download = await downloadPromise;
    const exportTime = Date.now() - start;

    // Verify export completed reasonably fast (< 3 seconds)
    expect(exportTime).toBeLessThan(3000);

    // Verify file has correct number of rows
    const downloadPath = await download.path();
    const jsonContent = readFileSync(downloadPath!, 'utf-8');
    const data = JSON.parse(jsonContent);

    expect(data.length).toBe(1000); // 1000 total rows
  });

  test('should handle special characters and Unicode in JSON', async ({ page, context }) => {
    // Insert special data
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute(
        `INSERT INTO products (id, name, price, stock) VALUES
        (1001, 'Product "Special"', 99.99, 10),
        (1002, 'Product 你好', 49.99, 20),
        (1003, 'Product with\nnewline', 29.99, 30)`
      );
    });

    // Run query
    await page.keyboard.type('SELECT id, name FROM products WHERE id >= 1001');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable', { state: 'visible', timeout: 10000 });

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportJSON');
    const download = await downloadPromise;

    // Verify special characters are properly escaped
    const downloadPath = await download.path();
    const jsonContent = readFileSync(downloadPath!, 'utf-8');
    const data = JSON.parse(jsonContent);

    expect(data[0].name).toBe('Product "Special"');
    expect(data[1].name).toBe('Product 你好');
    expect(data[2].name).toBe('Product with\nnewline');
  });
});
