/**
 * E2E tests for CSV Export functionality with configurable options
 * 
 * Tests cover:
 * - Basic CSV export from query results
 * - Export options dialog (headers, delimiter, quotes, line endings)
 * - NULL value handling
 * - Special character escaping
 * - Export with different delimiters
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { readFileSync, existsSync, unlinkSync } from 'fs';

test.describe('CSV Export', () => {
  let TEST_DB_NAME: string;

  test.beforeEach(async ({ page }) => {
    await page.goto('/db/query');
    await page.waitForSelector('#queryInterface', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });

    // Create database programmatically since /db/query doesn't auto-create one
    await page.evaluate(async () => {
      const Database = (window as any).Database;
      const testDb = await Database.newDatabase('test-db');
      (window as any).testDb = testDb;
    });

    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });

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
          description TEXT
        )
      `);
      await db.execute(`
        INSERT INTO products (id, name, price, stock, description) VALUES
        (1, 'Laptop', 999.99, 10, 'High-performance laptop'),
        (2, 'Mouse', 29.99, 50, 'Wireless mouse'),
        (3, 'Keyboard', 79.99, 25, 'Mechanical keyboard'),
        (4, 'Monitor', 299.99, NULL, 'LED monitor with NULL stock'),
        (5, 'Cable, USB-C', 15.99, 100, 'Description with, comma'),
        (6, 'Adapter "Pro"', 49.99, 30, 'Has "quotes" in name'),
        (7, 'Hub\nMultiport', 89.99, 15, 'Name has\nnewline')
      `);
    });
  });

  test('should display export CSV button when query has results', async ({ page }) => {
    // Run query
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT * FROM products LIMIT 3');
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Check export button is visible
    const exportButton = await page.locator('#exportCSV');
    await expect(exportButton).toBeVisible();
  });

  test('should export CSV with default options (comma delimiter, with headers)', async ({ page, context }) => {
    // Run query
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT id, name, price FROM products WHERE id <= 3');
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportCSV');
    const download = await downloadPromise;

    // Verify filename
    const filename = download.suggestedFilename();
    expect(filename).toContain('query-results');
    expect(filename.endsWith('.csv')).toBe(true);

    // Save and read the file
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    const csvContent = readFileSync(downloadPath!, 'utf-8');

    // Verify content
    const lines = csvContent.split('\n');
    expect(lines[0]).toBe('id,name,price'); // Headers
    expect(lines[1]).toBe('1,Laptop,999.99');
    expect(lines[2]).toBe('2,Mouse,29.99');
    expect(lines[3]).toBe('3,Keyboard,79.99');
  });

  test('should open export options dialog and configure settings', async ({ page }) => {
    // Run query
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT * FROM products LIMIT 1');
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Click export options button (separate from direct export)
    await page.click('#exportCSVOptions');
    await page.waitForTimeout(300);

    // Verify dialog opened
    const dialog = await page.locator('[role="dialog"]').filter({ hasText: 'CSV Export Options' });
    await expect(dialog).toBeVisible();

    // Check all options are present
    await expect(page.locator('#includeHeaders')).toBeVisible();
    await expect(page.locator('#csvDelimiter')).toBeVisible();
    await expect(page.locator('#quoteAllFields')).toBeVisible();
    await expect(page.locator('#lineEnding')).toBeVisible();
    await expect(page.locator('#nullHandling')).toBeVisible();
  });

  test('should export CSV without headers when option is disabled', async ({ page }) => {
    // Run query
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT id, name FROM products WHERE id = 1');
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Open export options
    await page.click('#exportCSVOptions');
    await page.waitForTimeout(300);

    // Uncheck include headers
    await page.click('#includeHeaders');
    await page.waitForTimeout(200);

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#confirmExport');
    const download = await downloadPromise;

    // Verify content has no headers
    const downloadPath = await download.path();
    const csvContent = readFileSync(downloadPath!, 'utf-8');
    const lines = csvContent.split('\n');
    
    // First line should be data, not headers
    expect(lines[0]).toBe('1,Laptop');
  });

  test('should export CSV with semicolon delimiter', async ({ page }) => {
    // Run query
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT id, name, price FROM products WHERE id <= 2');
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Open export options
    await page.click('#exportCSVOptions');
    await page.waitForTimeout(300);

    // Select semicolon delimiter
    await page.click('#csvDelimiter');
    await page.waitForTimeout(300);
    await page.click('text=Semicolon (;)');
    await page.waitForTimeout(300);

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#confirmExport');
    const download = await downloadPromise;

    // Verify content uses semicolons
    const downloadPath = await download.path();
    const csvContent = readFileSync(downloadPath!, 'utf-8');
    const lines = csvContent.split('\n');
    
    expect(lines[0]).toBe('id;name;price'); // Headers with semicolon
    expect(lines[1]).toBe('1;Laptop;999.99');
    expect(lines[2]).toBe('2;Mouse;29.99');
  });

  test('should quote all fields when option is enabled', async ({ page }) => {
    // Run query
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT id, name FROM products WHERE id = 1');
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Open export options
    await page.click('#exportCSVOptions');
    await page.waitForTimeout(300);

    // Enable quote all fields
    await page.click('#quoteAllFields');
    await page.waitForTimeout(200);

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#confirmExport');
    const download = await downloadPromise;

    // Verify all fields are quoted
    const downloadPath = await download.path();
    const csvContent = readFileSync(downloadPath!, 'utf-8');
    const lines = csvContent.split('\n');
    
    expect(lines[0]).toBe('"id","name"'); // Quoted headers
    expect(lines[1]).toBe('"1","Laptop"'); // Quoted values
  });

  test('should handle NULL values based on selected option', async ({ page }) => {
    // Run query that includes NULL
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT id, name, stock FROM products WHERE id = 4');
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Test 1: NULL as empty string (default)
    let downloadPromise = page.waitForEvent('download');
    await page.click('#exportCSV');
    let download = await downloadPromise;
    let downloadPath = await download.path();
    let csvContent = readFileSync(downloadPath!, 'utf-8');
    let lines = csvContent.split('\n');
    expect(lines[1]).toBe('4,Monitor,'); // Empty string for NULL

    // Test 2: NULL as "NULL" string
    await page.click('#exportCSVOptions');
    await page.waitForTimeout(300);
    
    // Select NULL as "NULL"
    await page.click('#nullHandling');
    await page.waitForTimeout(300);
    // Use more specific selector to avoid matching NULL in results table
    await page.locator('[role="option"]:has-text("NULL")').click();
    await page.waitForTimeout(300);

    downloadPromise = page.waitForEvent('download');
    await page.click('#confirmExport');
    download = await downloadPromise;
    downloadPath = await download.path();
    csvContent = readFileSync(downloadPath!, 'utf-8');
    lines = csvContent.split('\n');
    expect(lines[1]).toBe('4,Monitor,NULL'); // "NULL" string
  });

  test('should properly escape special characters (commas, quotes, newlines)', async ({ page }) => {
    // Run query with special characters
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT id, name, description FROM products WHERE id IN (5, 6, 7)');
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportCSV');
    const download = await downloadPromise;

    // Verify escaping
    const downloadPath = await download.path();
    const csvContent = readFileSync(downloadPath!, 'utf-8');
    
    // Comma in value should be quoted
    expect(csvContent).toContain('"Cable, USB-C"');
    expect(csvContent).toContain('"Description with, comma"');
    
    // Quotes should be escaped with double quotes
    expect(csvContent).toContain('"Adapter ""Pro"""');
    expect(csvContent).toContain('"Has ""quotes"" in name"');
    
    // Newlines should be quoted (embedded newlines in CSV are valid within quoted fields)
    expect(csvContent).toContain('"Hub\nMultiport"');
    expect(csvContent).toContain('"Name has\nnewline"');
  });

  test('should use CRLF line endings when selected', async ({ page }) => {
    // Run query
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT id, name FROM products WHERE id <= 2');
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Open export options
    await page.click('#exportCSVOptions');
    await page.waitForTimeout(300);

    // Select CRLF line ending
    await page.click('#lineEnding');
    await page.waitForTimeout(300);
    await page.click('text=CRLF (Windows)');
    await page.waitForTimeout(300);

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#confirmExport');
    const download = await downloadPromise;

    // Verify CRLF line endings
    const downloadPath = await download.path();
    const csvContent = readFileSync(downloadPath!, 'utf-8');
    
    // CRLF is \r\n
    expect(csvContent).toContain('\r\n');
    expect(csvContent.split('\r\n').length).toBeGreaterThan(1);
  });

  test('should export empty results with headers only', async ({ page }) => {
    // Run query with no results
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT id, name, price FROM products WHERE id = 999');
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Export should still work
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportCSV');
    const download = await downloadPromise;

    // Verify only headers are present
    const downloadPath = await download.path();
    const csvContent = readFileSync(downloadPath!, 'utf-8');
    const lines = csvContent.split('\n').filter(l => l.trim());
    
    expect(lines.length).toBe(1);
    expect(lines[0]).toBe('id,name,price');
  });

  test('should export large result set (performance test)', async ({ page }) => {
    // Create larger dataset using batch inserts
    await page.evaluate(async () => {
      const db = (window as any).testDb;

      // Build a multi-row INSERT statement (SQLite limit is ~500 rows per statement)
      const batchSize = 100;
      for (let batch = 0; batch < 10; batch++) {
        const values: string[] = [];
        for (let i = 0; i < batchSize; i++) {
          const id = 8 + (batch * batchSize) + i;
          if (id > 1000) break;
          const name = 'Product ' + id;
          const price = (Math.random() * 1000).toFixed(2);
          const stock = Math.floor(Math.random() * 100);
          values.push(`(${id}, '${name}', ${price}, ${stock})`);
        }

        if (values.length > 0) {
          const sql = `INSERT INTO products (id, name, price, stock) VALUES ${values.join(', ')}`;
          await db.execute(sql);
        }
      }
    });

    // Run query for all rows
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT * FROM products');
    await page.click('#executeButton');
    await page.waitForTimeout(2000); // Allow time for large result set

    // Export
    const start = Date.now();
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportCSV');
    const download = await downloadPromise;
    const exportTime = Date.now() - start;

    // Verify export completed reasonably fast (< 3 seconds)
    expect(exportTime).toBeLessThan(3000);

    // Verify file has correct number of rows
    const downloadPath = await download.path();
    const csvContent = readFileSync(downloadPath!, 'utf-8');
    const lines = csvContent.split('\n').filter(l => l.trim());
    
    // Note: Rows 5, 6, 7 have embedded newlines in quoted fields, adding 2 extra line breaks
    // So we expect 1001 logical rows (1000 data + 1 header) but 1003 line breaks
    expect(lines.length).toBeGreaterThanOrEqual(1000); // At least 1000 data rows
  });
});
