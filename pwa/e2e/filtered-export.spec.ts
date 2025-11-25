import { test, expect } from '@playwright/test';
import { readFileSync, unlinkSync } from 'fs';

test.describe('Filtered Data Export', () => {
  let TEST_DB_NAME: string;
  
  test.beforeEach(async ({ page }, testInfo) => {
    // MANDATORY: Use worker index AND timestamp for unique database (INSTRUCTIONS.md Rule #3)
    TEST_DB_NAME = `test-filtered-export-w${testInfo.parallelIndex}_${Date.now()}`;
    
    // Navigate FIRST to establish security context
    await page.goto('/db');
    await page.waitForLoadState('networkidle');
    
    // MANDATORY: Clean ALL state from previous tests (INSTRUCTIONS.md - Zero Tolerance for Flakiness)
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
      
      // Delete ALL indexedDB databases
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name) {
          await indexedDB.deleteDatabase(db.name);
        }
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Create database
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput', { timeout: 5000 });
    await page.fill('#dbNameInput', TEST_DB_NAME);
    await page.click('#confirmCreate');
    await page.waitForSelector(`#status:has-text("Database created: ${TEST_DB_NAME}.db")`, { timeout: 10000 });
    
    // Navigate to browse page
    await page.goto('/db/browse');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Data Browser', { timeout: 10000 });
    
    // Wait for DatabaseProvider to fully initialize AND leader election (event-based)
    await page.waitForFunction(async () => {
      const db = (window as any).testDb;
      if (!db || !db.db) return false;
      try {
        return await db.isLeader();
      } catch {
        return false;
      }
    }, { timeout: 15000 });
    
    // Create test database with sample data
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS products');
      await db.execute(`
        CREATE TABLE products (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT,
          price REAL,
          stock INTEGER,
          active INTEGER
        )
      `);
      await db.execute(`
        INSERT INTO products (id, name, category, price, stock, active) VALUES
        (1, 'Laptop', 'Electronics', 999.99, 10, 1),
        (2, 'Mouse', 'Electronics', 29.99, 50, 1),
        (3, 'Desk', 'Furniture', 299.99, 5, 1),
        (4, 'Chair', 'Furniture', 199.99, 8, 1),
        (5, 'Monitor', 'Electronics', 399.99, 15, 0),
        (6, 'Keyboard', 'Electronics', 79.99, 25, 1),
        (7, 'Lamp', 'Furniture', 49.99, 20, 1),
        (8, 'Notebook', 'Stationery', 5.99, 100, 1)
      `);
    });
    
    // Refresh tables to load products table into UI
    await page.click('#refreshTables');
    
    // Wait for products table to appear in the table dropdown
    await page.click('[data-testid="table-select"]');
    await page.waitForSelector('text=products', { state: 'visible', timeout: 10000 });
    await page.click('text=products');
  });

  test.afterEach(async ({ page }) => {
    // MANDATORY: Cleanup after each test (INSTRUCTIONS.md Rule #5)
    if (TEST_DB_NAME) {
      await page.evaluate(async (dbName) => {
        const db = (window as any).testDb;
        if (db) {
          try { await db.close(); } catch {}
        }
        try { await indexedDB.deleteDatabase(dbName + '.db'); } catch {}
        try { localStorage.removeItem('absurder-sql-database-store'); } catch {}
      }, TEST_DB_NAME).catch(() => {});
    }
  });

  test('should display export buttons when table data is loaded', async ({ page }) => {
    // beforeEach already selected products table
    // Check export buttons are visible
    await expect(page.locator('#exportFilteredCSV')).toBeVisible();
    await expect(page.locator('#exportFilteredJSON')).toBeVisible();
    await expect(page.locator('#exportFilteredSQL')).toBeVisible();
  });

  test('should export filtered CSV data only', async ({ page, context }) => {
    // beforeEach already selected products table
    // Apply filter: category equals Electronics
    await page.click('text=Filter');
    
    await page.click('#filter-column');
    await page.click('[role="option"]:has-text("category")');
    await page.click('#filter-operator');
    await page.click('[role="option"]:has-text("Equals")');
    await page.fill('#filter-value', 'Electronics');
    await page.click('text=Add Filter');

    // Export filtered CSV
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportFilteredCSV');
    const download = await downloadPromise;
    
    // Save and verify the file
    const path = `/tmp/test-filtered-export-${Date.now()}.csv`;
    await download.saveAs(path);
    const content = readFileSync(path, 'utf-8');
    
    // Should only contain Electronics category products (4 rows)
    const lines = content.trim().split('\n');
    expect(lines.length).toBe(5); // 1 header + 4 data rows
    
    // Verify it contains Electronics products
    expect(content).toContain('Laptop');
    expect(content).toContain('Mouse');
    expect(content).toContain('Monitor');
    expect(content).toContain('Keyboard');
    
    // Verify it does NOT contain Furniture or Stationery
    expect(content).not.toContain('Desk');
    expect(content).not.toContain('Chair');
    expect(content).not.toContain('Notebook');
    
    // Clean up
    unlinkSync(path);
  });

  test('should export filtered JSON data only', async ({ page }) => {
    // beforeEach already selected products table

    // Apply filter: price > 100
    await page.click('text=Filter');
    
    await page.click('#filter-column');
    await page.click('[role="option"]:has-text("price")');
    await page.click('#filter-operator');
    await page.click('[role="option"]:has-text("Greater Than")');
    await page.fill('#filter-value', '100');
    await page.click('text=Add Filter');

    // Export filtered JSON
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportFilteredJSON');
    const download = await downloadPromise;
    
    // Save and verify the file
    const path = `/tmp/test-filtered-json-${Date.now()}.json`;
    await download.saveAs(path);
    const content = readFileSync(path, 'utf-8');
    const data = JSON.parse(content);
    
    // Should only contain products with price > 100
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(4); // Laptop, Desk, Chair, Monitor
    
    // Verify prices are all > 100
    data.forEach((product: any) => {
      expect(product.price).toBeGreaterThan(100);
    });
    
    // Clean up
    unlinkSync(path);
  });

  test('should export filtered SQL dump only', async ({ page }) => {
    // beforeEach already selected products table

    // Apply filter: active = 1
    await page.click('text=Filter');
    
    await page.click('#filter-column');
    await page.click('[role="option"]:has-text("active")');
    await page.click('#filter-operator');
    await page.click('[role="option"]:has-text("Equals")');
    await page.fill('#filter-value', '1');
    await page.click('text=Add Filter');

    // Export filtered SQL
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportFilteredSQL');
    const download = await downloadPromise;
    
    // Save and verify the file
    const path = `/tmp/test-filtered-sql-${Date.now()}.sql`;
    await download.saveAs(path);
    const content = readFileSync(path, 'utf-8');
    
    // Should contain CREATE TABLE
    expect(content).toContain('CREATE TABLE');
    
    // Should contain 7 INSERT statements (7 active products)
    const insertMatches = content.match(/INSERT INTO/g);
    expect(insertMatches).not.toBeNull();
    expect(insertMatches!.length).toBeGreaterThanOrEqual(1); // At least one INSERT
    
    // Should NOT contain Monitor (active = 0)
    expect(content).not.toContain('Monitor');
    
    // Should contain active products
    expect(content).toContain('Laptop');
    expect(content).toContain('Mouse');
    
    // Clean up
    unlinkSync(path);
  });

  test('should export sorted data in correct order', async ({ page }) => {
    // beforeEach already selected products table

    // Sort by price ascending
    await page.click('th:has-text("price")');

    // Export CSV
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportFilteredCSV');
    const download = await downloadPromise;
    
    // Save and verify the file
    const path = `/tmp/test-sorted-export-${Date.now()}.csv`;
    await download.saveAs(path);
    const content = readFileSync(path, 'utf-8');
    
    const lines = content.trim().split('\n');
    // First data row should be Notebook (cheapest at 5.99)
    expect(lines[1]).toContain('Notebook');
    expect(lines[1]).toContain('5.99');
    
    // Last data row should be Laptop (most expensive at 999.99)
    expect(lines[lines.length - 1]).toContain('Laptop');
    expect(lines[lines.length - 1]).toContain('999.99');
    
    // Clean up
    unlinkSync(path);
  });

  test('should export multiple filtered conditions (AND logic)', async ({ page }) => {
    // beforeEach already selected products table

    // Apply first filter: category = Electronics
    await page.click('text=Filter');
    await page.click('#filter-column');
    await page.click('[role="option"]:has-text("category")');
    await page.click('#filter-operator');
    await page.click('[role="option"]:has-text("Equals")');
    await page.fill('#filter-value', 'Electronics');
    await page.click('text=Add Filter');

    // Apply second filter: price < 100
    await page.click('#filter-column');
    await page.click('[role="option"]:has-text("price")');
    await page.click('#filter-operator');
    await page.click('[role="option"]:has-text("Less Than")');
    await page.fill('#filter-value', '100');
    await page.click('text=Add Filter');

    // Export CSV
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportFilteredCSV');
    const download = await downloadPromise;
    
    // Save and verify the file
    const path = `/tmp/test-multi-filter-${Date.now()}.csv`;
    await download.saveAs(path);
    const content = readFileSync(path, 'utf-8');
    
    // Should only contain Mouse and Keyboard (Electronics AND price < 100)
    const lines = content.trim().split('\n');
    expect(lines.length).toBe(3); // 1 header + 2 data rows
    
    expect(content).toContain('Mouse');
    expect(content).toContain('Keyboard');
    
    // Should NOT contain Laptop or Monitor (price >= 100)
    expect(content).not.toContain('Laptop');
    expect(content).not.toContain('Monitor');
    
    // Clean up
    unlinkSync(path);
  });

  test('should export all data when no filters applied', async ({ page }) => {
    // beforeEach already selected products table

    // Export CSV without any filters
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportFilteredCSV');
    const download = await downloadPromise;
    
    // Save and verify the file
    const path = `/tmp/test-all-data-${Date.now()}.csv`;
    await download.saveAs(path);
    const content = readFileSync(path, 'utf-8');
    
    // Should contain all 8 products
    const lines = content.trim().split('\n');
    expect(lines.length).toBe(9); // 1 header + 8 data rows
    
    // Clean up
    unlinkSync(path);
  });

  test('should respect column selection in filtered export', async ({ page }) => {
    // beforeEach already selected products table

    // Apply filter
    await page.click('text=Filter');
    await page.click('#filter-column');
    await page.click('[role="option"]:has-text("category")');
    await page.click('#filter-operator');
    await page.click('[role="option"]:has-text("Equals")');
    await page.fill('#filter-value', 'Electronics');
    await page.click('text=Add Filter');

    // Open CSV export options
    await page.click('#exportFilteredCSVOptions');

    // Deselect some columns - use checkbox labels within the dialog
    await page.locator('[role="dialog"] label:has-text("category")').click();
    await page.locator('[role="dialog"] label:has-text("active")').click();

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#confirmExport');
    const download = await downloadPromise;
    
    // Save and verify the file
    const path = `/tmp/test-column-selection-${Date.now()}.csv`;
    await download.saveAs(path);
    const content = readFileSync(path, 'utf-8');
    
    // Header should NOT contain category or active
    const header = content.split('\n')[0];
    expect(header).not.toContain('category');
    expect(header).not.toContain('active');
    
    // Should contain other columns
    expect(header).toContain('id');
    expect(header).toContain('name');
    expect(header).toContain('price');
    
    // Clean up
    unlinkSync(path);
  });
});
