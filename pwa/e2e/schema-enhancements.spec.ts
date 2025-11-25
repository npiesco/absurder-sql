import { test, expect } from '@playwright/test';

test.describe('Schema Viewer Enhancements E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/db/schema');
    await page.waitForSelector('#schemaViewer', { timeout: 10000 });
  });

  test('should display row count for each table', async ({ page }) => {
    await page.waitForSelector('#refreshButton:not([disabled])');
    
    // Create test table with data
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS count_test');
      await db.execute('CREATE TABLE count_test (id INTEGER, data TEXT)');
      await db.execute('INSERT INTO count_test VALUES (1, ?)', [{ type: 'Text', value: 'row1' }]);
      await db.execute('INSERT INTO count_test VALUES (2, ?)', [{ type: 'Text', value: 'row2' }]);
      await db.execute('INSERT INTO count_test VALUES (3, ?)', [{ type: 'Text', value: 'row3' }]);
    });

    await page.click('#refreshButton');
    await page.waitForSelector('#tablesList .table-item');

    // Check for row count display
    const tableItem = page.locator('#tablesList .table-item:has-text("count_test")');
    const rowCountText = await tableItem.locator('.row-count').textContent();
    
    expect(rowCountText).toContain('3');

    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS count_test');
    });
  });

  test('should show data preview when table is selected', async ({ page }) => {
    await page.waitForSelector('#refreshButton:not([disabled])');
    
    // Create test table with data
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS preview_test');
      await db.execute('CREATE TABLE preview_test (id INTEGER, name TEXT, age INTEGER)');
      await db.execute('INSERT INTO preview_test VALUES (1, ?, 25)', [{ type: 'Text', value: 'Alice' }]);
      await db.execute('INSERT INTO preview_test VALUES (2, ?, 30)', [{ type: 'Text', value: 'Bob' }]);
    });

    await page.click('#refreshButton');
    await page.waitForSelector('#tablesList .table-item');
    
    // Click on table
    await page.click('#tablesList .table-item:has-text("preview_test")');
    
    // Wait for data preview section
    await page.waitForSelector('#dataPreview');
    
    // Check preview shows data
    const previewTable = page.locator('#dataPreview table');
    await expect(previewTable).toBeVisible();
    
    const rows = await page.locator('#dataPreview tbody tr').count();
    expect(rows).toBeGreaterThan(0);
    expect(rows).toBeLessThanOrEqual(5); // Should limit to 5 rows

    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS preview_test');
    });
  });

  test('should limit data preview to 5 rows', async ({ page }) => {
    await page.waitForSelector('#refreshButton:not([disabled])');
    
    // Create table with more than 5 rows
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS limit_test');
      await db.execute('CREATE TABLE limit_test (id INTEGER)');
      for (let i = 1; i <= 10; i++) {
        await db.execute('INSERT INTO limit_test VALUES (?)', [{ type: 'Integer', value: i }]);
      }
    });

    await page.click('#refreshButton');
    await page.waitForSelector('#tablesList .table-item');
    await page.click('#tablesList .table-item:has-text("limit_test")');
    await page.waitForSelector('#dataPreview');
    
    const rows = await page.locator('#dataPreview tbody tr').count();
    expect(rows).toBe(5);

    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS limit_test');
    });
  });

  test('should display quick query button for SELECT *', async ({ page }) => {
    await page.waitForSelector('#refreshButton:not([disabled])');
    
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS quick_test');
      await db.execute('CREATE TABLE quick_test (id INTEGER)');
    });

    await page.click('#refreshButton');
    await page.waitForSelector('#tablesList .table-item');
    await page.click('#tablesList .table-item:has-text("quick_test")');
    await page.waitForSelector('#tableDetails');
    
    // Check for quick query button
    const selectAllButton = page.locator('#quickSelectAll');
    await expect(selectAllButton).toBeVisible();

    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS quick_test');
    });
  });

  test('should navigate to query page when quick query clicked', async ({ page }) => {
    await page.waitForSelector('#refreshButton:not([disabled])');
    
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS nav_test');
      await db.execute('CREATE TABLE nav_test (id INTEGER)');
    });

    await page.click('#refreshButton');
    await page.waitForSelector('#tablesList .table-item');
    await page.click('#tablesList .table-item:has-text("nav_test")');
    await page.waitForSelector('#quickSelectAll');
    
    // Click quick query button
    await page.click('#quickSelectAll');
    
    // Should navigate to query page
    await page.waitForURL('**/db/query**');
    
    // Wait for query page to load
    await page.waitForSelector('#queryInterface');
    
    // Should have SQL pre-filled
    const sqlEditor = await page.locator('.cm-editor .cm-content').textContent();
    expect(sqlEditor).toContain('SELECT * FROM nav_test');

    // Cleanup - go back to schema page
    await page.goto('/db/schema');
    await page.waitForSelector('#schemaViewer');
    await page.waitForSelector('#refreshButton:not([disabled])');
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS nav_test');
    });
  });

  test('should show empty state for table with no data', async ({ page }) => {
    await page.waitForSelector('#refreshButton:not([disabled])');
    
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS empty_test');
      await db.execute('CREATE TABLE empty_test (id INTEGER)');
    });

    await page.click('#refreshButton');
    await page.waitForSelector('#tablesList .table-item');
    await page.click('#tablesList .table-item:has-text("empty_test")');
    await page.waitForSelector('#dataPreview');
    
    const emptyMessage = await page.textContent('#dataPreview');
    expect(emptyMessage?.toLowerCase()).toContain('no data');

    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS empty_test');
    });
  });

  test('should update row count after data changes', async ({ page }) => {
    await page.waitForSelector('#refreshButton:not([disabled])');
    
    // Create empty table
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS update_test');
      await db.execute('CREATE TABLE update_test (id INTEGER)');
    });

    await page.click('#refreshButton');
    await page.waitForSelector('#tablesList .table-item');
    
    // Check initial count is 0
    let tableItem = page.locator('#tablesList .table-item:has-text("update_test")');
    let rowCount = await tableItem.locator('.row-count').textContent();
    expect(rowCount).toContain('0');

    // Add data
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('INSERT INTO update_test VALUES (1)');
      await db.execute('INSERT INTO update_test VALUES (2)');
    });

    // Refresh
    await page.click('#refreshButton');
    await page.waitForTimeout(500);
    
    // Check updated count
    tableItem = page.locator('#tablesList .table-item:has-text("update_test")');
    rowCount = await tableItem.locator('.row-count').textContent();
    expect(rowCount).toContain('2');

    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS update_test');
    });
  });
});
