import { test, expect } from '@playwright/test';

test.describe('Export Query Results E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/db/query');
    await page.waitForSelector('#queryInterface', { timeout: 10000 });
  });

  test('should display export buttons when results exist', async ({ page }) => {
    // Execute a query to get results
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT 1 as id, "test" as name');
    await page.waitForSelector('#executeButton:not([disabled])');
    await page.click('#executeButton');
    
    await page.waitForSelector('#resultsTable');
    
    // Check for export buttons
    const csvButton = await page.locator('#exportCSV');
    const jsonButton = await page.locator('#exportJSON');
    
    await expect(csvButton).toBeVisible();
    await expect(jsonButton).toBeVisible();
  });

  test('should not display export buttons when no results', async ({ page }) => {
    const csvButton = page.locator('#exportCSV');
    const jsonButton = page.locator('#exportJSON');
    
    await expect(csvButton).not.toBeVisible();
    await expect(jsonButton).not.toBeVisible();
  });

  test('should export results to CSV format', async ({ page }) => {
    // Create test data
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT 1');
    await page.waitForSelector('#executeButton:not([disabled])');
    
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS export_test');
      await db.execute('CREATE TABLE export_test (id INTEGER, name TEXT, age INTEGER)');
      await db.execute('INSERT INTO export_test VALUES (1, ?, 25)', [{ type: 'Text', value: 'Alice' }]);
      await db.execute('INSERT INTO export_test VALUES (2, ?, 30)', [{ type: 'Text', value: 'Bob' }]);
    });
    
    await page.keyboard.press('Meta+A');
    await page.keyboard.type('SELECT * FROM export_test');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable');
    
    // Export to CSV
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportCSV');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('.csv');
    
    // Read and verify CSV content
    const path = await download.path();
    if (path) {
      const fs = await import('fs');
      const content = fs.readFileSync(path, 'utf-8');
      
      // Check CSV header
      expect(content).toContain('id,name,age');
      // Check CSV data
      expect(content).toContain('1,Alice,25');
      expect(content).toContain('2,Bob,30');
    }
    
    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS export_test');
    });
  });

  test('should export results to JSON format', async ({ page }) => {
    // Create test data
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT 1');
    await page.waitForSelector('#executeButton:not([disabled])');
    
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS json_test');
      await db.execute('CREATE TABLE json_test (id INTEGER, data TEXT)');
      await db.execute('INSERT INTO json_test VALUES (1, ?)', [{ type: 'Text', value: 'test1' }]);
      await db.execute('INSERT INTO json_test VALUES (2, ?)', [{ type: 'Text', value: 'test2' }]);
    });
    
    await page.keyboard.press('Meta+A');
    await page.keyboard.type('SELECT * FROM json_test');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable');
    
    // Export to JSON
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportJSON');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('.json');
    
    // Read and verify JSON content
    const path = await download.path();
    if (path) {
      const fs = await import('fs');
      const content = fs.readFileSync(path, 'utf-8');
      const data = JSON.parse(content);
      
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0]).toEqual({ id: 1, data: 'test1' });
      expect(data[1]).toEqual({ id: 2, data: 'test2' });
    }
    
    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS json_test');
    });
  });

  test('should handle NULL values in CSV export', async ({ page }) => {
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT 1');
    await page.waitForSelector('#executeButton:not([disabled])');
    
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS null_test');
      await db.execute('CREATE TABLE null_test (id INTEGER, name TEXT)');
      await db.execute('INSERT INTO null_test VALUES (1, NULL)');
    });
    
    await page.keyboard.press('Meta+A');
    await page.keyboard.type('SELECT * FROM null_test');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportCSV');
    const download = await downloadPromise;
    
    const path = await download.path();
    if (path) {
      const fs = await import('fs');
      const content = fs.readFileSync(path, 'utf-8');
      
      // NULL should be empty or explicit
      expect(content).toContain('1,');
    }
    
    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS null_test');
    });
  });

  test('should handle NULL values in JSON export', async ({ page }) => {
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT 1');
    await page.waitForSelector('#executeButton:not([disabled])');
    
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS null_json_test');
      await db.execute('CREATE TABLE null_json_test (id INTEGER, value TEXT)');
      await db.execute('INSERT INTO null_json_test VALUES (1, NULL)');
    });
    
    await page.keyboard.press('Meta+A');
    await page.keyboard.type('SELECT * FROM null_json_test');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportJSON');
    const download = await downloadPromise;
    
    const path = await download.path();
    if (path) {
      const fs = await import('fs');
      const content = fs.readFileSync(path, 'utf-8');
      const data = JSON.parse(content);
      
      expect(data[0]).toEqual({ id: 1, value: null });
    }
    
    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS null_json_test');
    });
  });

  test('should handle special characters in CSV export', async ({ page }) => {
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT 1');
    await page.waitForSelector('#executeButton:not([disabled])');
    
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS special_test');
      await db.execute('CREATE TABLE special_test (id INTEGER, text TEXT)');
      await db.execute('INSERT INTO special_test VALUES (1, ?)', [{ type: 'Text', value: 'Hello, "World"' }]);
    });
    
    await page.keyboard.press('Meta+A');
    await page.keyboard.type('SELECT * FROM special_test');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportCSV');
    const download = await downloadPromise;
    
    const path = await download.path();
    if (path) {
      const fs = await import('fs');
      const content = fs.readFileSync(path, 'utf-8');
      
      // Quotes should be escaped
      expect(content).toContain('"Hello, ""World"""');
    }
    
    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS special_test');
    });
  });
});
