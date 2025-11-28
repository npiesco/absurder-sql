/**
 * E2E Tests for Filtering & Sorting
 * 
 * Tests column sorting (ASC/DESC) and filtering functionality
 * Based on Adminer parity requirements FR-AB1.5 and FR-AB1.6
 */

import { test, expect } from '@playwright/test';

test.describe('Filtering & Sorting - Column Sorting', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/db/browse');
    await page.waitForSelector('#dataBrowser', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
  });

  test('should show sort indicators on column headers', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS sort_test');
      await db.execute('CREATE TABLE sort_test (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)');
      await db.execute("INSERT INTO sort_test (id, name, age) VALUES (1, 'Alice', 30)");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=sort_test');
    await page.waitForSelector('table tbody tr');

    // Check that column headers are clickable
    const nameHeader = page.locator('table thead th:has-text("name")');
    await expect(nameHeader).toBeVisible();
    
    // Should have cursor pointer or sort indicator
    const isSortable = await nameHeader.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.cursor === 'pointer' || el.classList.contains('sortable') || el.querySelector('[data-sort]') !== null;
    });
    expect(isSortable).toBe(true);
  });

  test('should sort column ascending on first click', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS sort_asc_test');
      await db.execute('CREATE TABLE sort_asc_test (id INTEGER PRIMARY KEY, name TEXT)');
      await db.execute("INSERT INTO sort_asc_test (id, name) VALUES (3, 'Charlie')");
      await db.execute("INSERT INTO sort_asc_test (id, name) VALUES (1, 'Alice')");
      await db.execute("INSERT INTO sort_asc_test (id, name) VALUES (2, 'Bob')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=sort_asc_test');
    await page.waitForSelector('table tbody tr');

    // Click name column to sort ascending
    await page.locator('table thead th:has-text("name")').click();
    await page.waitForTimeout(500);

    // Verify order is ascending
    const firstRow = await page.locator('table tbody tr:first-child td:nth-child(4)').textContent();
    expect(firstRow).toContain('Alice');
  });

  test('should sort column descending on second click', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS sort_desc_test');
      await db.execute('CREATE TABLE sort_desc_test (id INTEGER PRIMARY KEY, name TEXT)');
      await db.execute("INSERT INTO sort_desc_test (id, name) VALUES (1, 'Alice')");
      await db.execute("INSERT INTO sort_desc_test (id, name) VALUES (2, 'Bob')");
      await db.execute("INSERT INTO sort_desc_test (id, name) VALUES (3, 'Charlie')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=sort_desc_test');
    await page.waitForSelector('table tbody tr');

    // Click twice to sort descending
    const nameHeader = page.locator('table thead th:has-text("name")');
    await nameHeader.click();
    await page.waitForTimeout(300);
    await nameHeader.click();
    await page.waitForTimeout(500);

    // Verify order is descending
    const firstRow = await page.locator('table tbody tr:first-child td:nth-child(4)').textContent();
    expect(firstRow).toContain('Charlie');
  });

  test('should show sort direction indicator', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS sort_indicator_test');
      await db.execute('CREATE TABLE sort_indicator_test (id INTEGER PRIMARY KEY, value INTEGER)');
      await db.execute("INSERT INTO sort_indicator_test (id, value) VALUES (1, 100)");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=sort_indicator_test');
    await page.waitForSelector('table tbody tr');

    // Click to sort
    await page.locator('table thead th:has-text("value")').click();
    await page.waitForTimeout(300);

    // Check for sort indicator (arrow, icon, or text)
    const header = page.locator('table thead th:has-text("value")');
    const hasIndicator = await header.evaluate((el) => {
      return el.textContent?.includes('↑') || 
             el.textContent?.includes('↓') || 
             el.textContent?.includes('▲') || 
             el.textContent?.includes('▼') ||
             el.querySelector('[data-sort-direction]') !== null ||
             el.querySelector('svg') !== null;
    });
    expect(hasIndicator).toBe(true);
  });

  test('should sort numeric columns correctly', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS numeric_sort_test');
      await db.execute('CREATE TABLE numeric_sort_test (id INTEGER PRIMARY KEY, value INTEGER)');
      await db.execute("INSERT INTO numeric_sort_test (id, value) VALUES (1, 100)");
      await db.execute("INSERT INTO numeric_sort_test (id, value) VALUES (2, 5)");
      await db.execute("INSERT INTO numeric_sort_test (id, value) VALUES (3, 50)");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=numeric_sort_test');
    await page.waitForSelector('table tbody tr');

    // Sort by value ascending
    await page.locator('table thead th:has-text("value")').click();
    await page.waitForTimeout(500);

    // Verify numeric order (5, 50, 100) not string order
    const firstValue = await page.locator('table tbody tr:first-child td:nth-child(4)').textContent();
    expect(firstValue?.trim()).toBe('5');
  });
});

test.describe('Filtering & Sorting - Text Filters', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/db/browse');
    await page.waitForSelector('#dataBrowser', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
  });

  test('should show filter button or panel', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS filter_button_test');
      await db.execute('CREATE TABLE filter_button_test (id INTEGER PRIMARY KEY, name TEXT)');
      await db.execute("INSERT INTO filter_button_test (id, name) VALUES (1, 'Test')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=filter_button_test');
    await page.waitForSelector('table tbody tr');

    // Look for filter button or panel
    const filterButton = page.locator('button:has-text("Filter"), button:has-text("Filters"), [data-filter-toggle]').first();
    await expect(filterButton).toBeVisible({ timeout: 5000 });
  });

  test('should filter text column with contains operator', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS text_filter_test');
      await db.execute('CREATE TABLE text_filter_test (id INTEGER PRIMARY KEY, name TEXT)');
      await db.execute("INSERT INTO text_filter_test (id, name) VALUES (1, 'Apple')");
      await db.execute("INSERT INTO text_filter_test (id, name) VALUES (2, 'Banana')");
      await db.execute("INSERT INTO text_filter_test (id, name) VALUES (3, 'Cherry')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=text_filter_test');
    await page.waitForSelector('table tbody tr');

    // Initial count should be 3
    let rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(3);

    // Open filter panel
    await page.locator('button:has-text("Filters")').click();
    await page.waitForTimeout(500);
    
    // Wait for filter panel to be visible
    await page.waitForSelector('#filter-column', { state: 'visible', timeout: 5000 });

    // Add filter: name contains "an"
    await page.click('#filter-column');
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: 'name' }).click();
    await page.waitForTimeout(200);
    
    await page.click('#filter-operator');
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: 'Contains' }).click();
    await page.waitForTimeout(200);
    
    await page.locator('#filter-value').fill('an');
    await page.waitForTimeout(200);
    
    // Apply filter
    await page.locator('button:has-text("Add Filter")').click();
    await page.waitForTimeout(500);

    // Should only show Banana
    rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(1);
    
    const visibleName = await page.locator('table tbody tr td:nth-child(4)').textContent();
    expect(visibleName).toContain('Banana');
  });

  test('should filter text column with equals operator', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS equals_filter_test');
      await db.execute('CREATE TABLE equals_filter_test (id INTEGER PRIMARY KEY, status TEXT)');
      await db.execute("INSERT INTO equals_filter_test (id, status) VALUES (1, 'active')");
      await db.execute("INSERT INTO equals_filter_test (id, status) VALUES (2, 'inactive')");
      await db.execute("INSERT INTO equals_filter_test (id, status) VALUES (3, 'active')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=equals_filter_test');
    await page.waitForSelector('table tbody tr');

    // Open filter
    await page.locator('button:has-text("Filters")').click();
    await page.waitForTimeout(500);
    await page.waitForSelector('#filter-column', { state: 'visible', timeout: 5000 });

    // Filter: status equals "active"
    await page.click('#filter-column');
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: 'status' }).click();
    await page.waitForTimeout(200);
    await page.click('#filter-operator');
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: 'Equals' }).click();
    await page.waitForTimeout(200);
    await page.locator('#filter-value').fill('active');
    await page.waitForTimeout(200);
    await page.locator('button:has-text("Add Filter")').click();
    await page.waitForTimeout(500);

    // Should show 2 active rows
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(2);
  });
});

test.describe('Filtering & Sorting - Number Filters', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/db/browse');
    await page.waitForSelector('#dataBrowser', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
  });

  test('should filter numeric column with greater than operator', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS number_gt_test');
      await db.execute('CREATE TABLE number_gt_test (id INTEGER PRIMARY KEY, score INTEGER)');
      await db.execute("INSERT INTO number_gt_test (id, score) VALUES (1, 50)");
      await db.execute("INSERT INTO number_gt_test (id, score) VALUES (2, 75)");
      await db.execute("INSERT INTO number_gt_test (id, score) VALUES (3, 100)");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=number_gt_test');
    await page.waitForSelector('table tbody tr');

    // Open filter
    await page.locator('button:has-text("Filters")').click();
    await page.waitForTimeout(500);
    await page.waitForSelector('#filter-column', { state: 'visible', timeout: 5000 });

    // Filter: score > 60
    await page.click('#filter-column');
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: 'score' }).click();
    await page.waitForTimeout(200);
    await page.click('#filter-operator');
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: 'Greater Than' }).click();
    await page.waitForTimeout(200);
    await page.locator('#filter-value').fill('60');
    await page.waitForTimeout(200);
    await page.locator('button:has-text("Add Filter")').click();
    await page.waitForTimeout(500);

    // Should show 2 rows (75, 100)
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(2);
  });

  test('should filter numeric column with less than operator', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS number_lt_test');
      await db.execute('CREATE TABLE number_lt_test (id INTEGER PRIMARY KEY, age INTEGER)');
      await db.execute("INSERT INTO number_lt_test (id, age) VALUES (1, 20)");
      await db.execute("INSERT INTO number_lt_test (id, age) VALUES (2, 30)");
      await db.execute("INSERT INTO number_lt_test (id, age) VALUES (3, 40)");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=number_lt_test');
    await page.waitForSelector('table tbody tr');

    // Open filter
    await page.locator('button:has-text("Filters")').click();
    await page.waitForTimeout(500);
    await page.waitForSelector('#filter-column', { state: 'visible', timeout: 5000 });

    // Filter: age < 35
    await page.click('#filter-column');
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: 'age' }).click();
    await page.waitForTimeout(200);
    await page.click('#filter-operator');
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: 'Less Than' }).click();
    await page.waitForTimeout(200);
    await page.locator('#filter-value').fill('35');
    await page.waitForTimeout(200);
    await page.locator('button:has-text("Add Filter")').click();
    await page.waitForTimeout(500);

    // Should show 2 rows (20, 30)
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(2);
  });
});

test.describe('Filtering & Sorting - NULL Filters', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/db/browse');
    await page.waitForSelector('#dataBrowser', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
  });

  test('should filter for NULL values', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS null_filter_test');
      await db.execute('CREATE TABLE null_filter_test (id INTEGER PRIMARY KEY, optional TEXT)');
      await db.execute("INSERT INTO null_filter_test (id, optional) VALUES (1, 'HasValue')");
      await db.execute("INSERT INTO null_filter_test (id, optional) VALUES (2, NULL)");
      await db.execute("INSERT INTO null_filter_test (id, optional) VALUES (3, NULL)");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=null_filter_test');
    await page.waitForSelector('table tbody tr');

    // Open filter
    await page.locator('button:has-text("Filters")').click();
    await page.waitForTimeout(500);
    await page.waitForSelector('#filter-column', { state: 'visible', timeout: 5000 });

    // Filter: optional IS NULL
    await page.click('#filter-column');
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: 'optional' }).click();
    await page.waitForTimeout(200);
    await page.click('#filter-operator');
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: 'Is NULL' }).click();
    await page.waitForTimeout(200);
    await page.locator('button:has-text("Add Filter")').click();
    await page.waitForTimeout(500);

    // Should show 2 NULL rows
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(2);
  });

  test('should filter for NOT NULL values', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS not_null_filter_test');
      await db.execute('CREATE TABLE not_null_filter_test (id INTEGER PRIMARY KEY, required TEXT)');
      await db.execute("INSERT INTO not_null_filter_test (id, required) VALUES (1, 'Value1')");
      await db.execute("INSERT INTO not_null_filter_test (id, required) VALUES (2, NULL)");
      await db.execute("INSERT INTO not_null_filter_test (id, required) VALUES (3, 'Value2')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=not_null_filter_test');
    await page.waitForSelector('table tbody tr');

    // Open filter
    await page.locator('button:has-text("Filters")').click();
    await page.waitForTimeout(500);
    await page.waitForSelector('#filter-column', { state: 'visible', timeout: 5000 });

    // Filter: required IS NOT NULL
    await page.click('#filter-column');
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: 'required' }).click();
    await page.waitForTimeout(200);
    await page.click('#filter-operator');
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: 'Is Not NULL' }).click();
    await page.waitForTimeout(200);
    await page.locator('button:has-text("Add Filter")').click();
    await page.waitForTimeout(500);

    // Should show 2 non-NULL rows
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(2);
  });
});

test.describe('Filtering & Sorting - Multiple Filters', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/db/browse');
    await page.waitForSelector('#dataBrowser', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });

    // Enable non-leader writes to bypass leader election timeouts
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db && db.allowNonLeaderWrites) {
        await db.allowNonLeaderWrites(true);
      }
    });
  });

  test('should apply multiple filters with AND logic', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS multi_filter_test');
      await db.execute('CREATE TABLE multi_filter_test (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)');
      await db.execute("INSERT INTO multi_filter_test (id, name, age) VALUES (1, 'Alice', 25)");
      await db.execute("INSERT INTO multi_filter_test (id, name, age) VALUES (2, 'Bob', 30)");
      await db.execute("INSERT INTO multi_filter_test (id, name, age) VALUES (3, 'Alice', 35)");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=multi_filter_test');
    await page.waitForSelector('table tbody tr');

    // Open filter
    await page.locator('button:has-text("Filters")').click();
    await page.waitForTimeout(500);
    await page.waitForSelector('#filter-column', { state: 'visible', timeout: 5000 });

    // First filter: name equals "Alice"
    await page.click('#filter-column');
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: 'name' }).click();
    await page.waitForTimeout(200);
    await page.click('#filter-operator');
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: 'Equals' }).click();
    await page.waitForTimeout(200);
    await page.locator('#filter-value').fill('Alice');
    await page.waitForTimeout(200);
    await page.locator('button:has-text("Add Filter")').click();
    await page.waitForTimeout(500);

    // Should show 2 Alice rows
    let rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(2);

    // Add second filter: age > 30
    await page.click('#filter-column');
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: 'age' }).click();
    await page.waitForTimeout(200);
    await page.click('#filter-operator');
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: 'Greater Than' }).click();
    await page.waitForTimeout(200);
    await page.locator('#filter-value').fill('30');
    await page.waitForTimeout(200);
    await page.locator('button:has-text("Add Filter")').click();
    await page.waitForTimeout(500);

    // Should show 1 row (Alice, 35)
    rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(1);
  });

  test('should show Clear Filters button when filters are active', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS clear_filter_test');
      await db.execute('CREATE TABLE clear_filter_test (id INTEGER PRIMARY KEY, name TEXT)');
      await db.execute("INSERT INTO clear_filter_test (id, name) VALUES (1, 'Test')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=clear_filter_test');
    await page.waitForSelector('table tbody tr');

    // Open filter and add one
    await page.locator('button:has-text("Filters")').click();
    await page.waitForTimeout(500);
    await page.waitForSelector('#filter-column', { state: 'visible', timeout: 5000 });
    await page.click('#filter-column');
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: 'name' }).click();
    await page.waitForTimeout(200);
    await page.click('#filter-operator');
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: 'Contains' }).click();
    await page.waitForTimeout(200);
    await page.locator('#filter-value').fill('Test');
    await page.waitForTimeout(200);
    await page.locator('button:has-text("Add Filter")').click();
    await page.waitForTimeout(500);

    // Clear Filters button should be visible
    const clearButton = page.locator('button:has-text("Clear Filters"), button:has-text("Clear All"), [data-clear-filters]').first();
    await expect(clearButton).toBeVisible();
  });

  test('should clear all filters when Clear Filters clicked', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS clear_all_test');
      await db.execute('CREATE TABLE clear_all_test (id INTEGER PRIMARY KEY, value TEXT)');
      await db.execute("INSERT INTO clear_all_test (id, value) VALUES (1, 'One')");
      await db.execute("INSERT INTO clear_all_test (id, value) VALUES (2, 'Two')");
      await db.execute("INSERT INTO clear_all_test (id, value) VALUES (3, 'Three')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=clear_all_test');
    await page.waitForSelector('table tbody tr');

    // Add filter
    await page.locator('button:has-text("Filters")').click();
    await page.waitForTimeout(500);
    await page.waitForSelector('#filter-column', { state: 'visible', timeout: 5000 });
    await page.click('#filter-column');
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: 'value' }).click();
    await page.waitForTimeout(200);
    await page.click('#filter-operator');
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: 'Equals' }).click();
    await page.waitForTimeout(200);
    await page.locator('#filter-value').fill('One');
    await page.waitForTimeout(200);
    await page.locator('button:has-text("Add Filter")').click();
    await page.waitForTimeout(500);

    // Should be filtered to 1 row
    let rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(1);

    // Clear filters
    await page.locator('button:has-text("Clear Filters"), button:has-text("Clear All"), [data-clear-filters]').first().click();
    await page.waitForTimeout(500);

    // Should show all 3 rows again
    rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(3);
  });
});
