/**
 * E2E Tests for Data Browser
 * 
 * Tests table browsing with pagination, inline editing, filtering, and sorting
 * Based on Adminer parity requirements from PRD_II
 */

import { test, expect } from '@playwright/test';

test.describe('Data Browser - Table Browsing', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/db/browse');
    await page.waitForSelector('#dataBrowser', { timeout: 10000 });
    // Wait for database to be ready
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
  });

  test('should display data browser page', async ({ page }) => {
    // Check page loaded
    const title = await page.textContent('h1');
    expect(title).toContain('Data Browser');
    
    // Check key elements exist
    await expect(page.locator('#tableSelect')).toBeVisible();
    await expect(page.locator('#pageSizeSelect')).toBeVisible();
  });

  test('should list all tables in dropdown', async ({ page }) => {
    // Create test tables
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)');
      await db.execute('CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY, title TEXT)');
      await db.execute('CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY, content TEXT)');
    });

    // Refresh table list to pick up newly created tables
    await page.click('#refreshTables');
    await page.waitForTimeout(500);

    // Click table select to open dropdown
    await page.click('#tableSelect');
    await page.waitForTimeout(200); // Wait for dropdown animation
    
    // Verify tables appear in dropdown (shadcn Select uses div elements)
    const hasUsers = await page.locator('text=users').isVisible();
    const hasPosts = await page.locator('text=posts').isVisible();
    const hasComments = await page.locator('text=comments').isVisible();
    
    expect(hasUsers).toBe(true);
    expect(hasPosts).toBe(true);
    expect(hasComments).toBe(true);
  });

  test('should display table data with pagination', async ({ page }) => {
    // Create test table with data
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS test_data');
      await db.execute('CREATE TABLE test_data (id INTEGER PRIMARY KEY, value TEXT)');
      
      // Insert 150 rows for pagination testing
      for (let i = 1; i <= 150; i++) {
        await db.execute(`INSERT INTO test_data (id, value) VALUES (${i}, 'Row ${i}')`);
      }
    });

    // Refresh and select table
    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=test_data');
    
    // Wait for data to load
    await page.waitForSelector('table tbody tr');
    
    // Verify data loaded
    const rows = await page.locator('table tbody tr').count();
    expect(rows).toBeGreaterThan(0);
    expect(rows).toBeLessThanOrEqual(100); // Default page size is 100
    
    // Verify first row content
    const firstCell = await page.locator('table tbody tr:first-child td:nth-child(2)').textContent();
    expect(firstCell).toBe('1');
  });

  test('should change page size (100/500/1000)', async ({ page }) => {
    // Create test table
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS pagination_test');
      await db.execute('CREATE TABLE pagination_test (id INTEGER PRIMARY KEY)');
      
      // Insert 250 rows
      for (let i = 1; i <= 250; i++) {
        await db.execute(`INSERT INTO pagination_test (id) VALUES (${i})`);
      }
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=pagination_test');
    await page.waitForSelector('table tbody tr');
    
    // Default should be 100
    let rows = await page.locator('table tbody tr').count();
    expect(rows).toBe(100);
    
    // Change to 500
    await page.click('#pageSizeSelect');
    await page.click('text=500');
    await page.waitForTimeout(500); // Wait for re-render
    
    rows = await page.locator('table tbody tr').count();
    expect(rows).toBe(250); // All rows fit in 500 page size
  });

  test('should navigate between pages', async ({ page }) => {
    // Create test data
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS nav_test');
      await db.execute('CREATE TABLE nav_test (id INTEGER PRIMARY KEY, page_num INTEGER)');
      
      for (let i = 1; i <= 150; i++) {
        await db.execute(`INSERT INTO nav_test (id, page_num) VALUES (${i}, ${Math.ceil(i / 100)})`);
      }
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=nav_test');
    await page.waitForSelector('table tbody tr');
    
    // Verify on page 1
    let firstId = await page.locator('table tbody tr:first-child td:nth-child(2)').textContent();
    expect(firstId).toBe('1');
    
    // Navigate to page 2
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    
    // Verify on page 2
    firstId = await page.locator('table tbody tr:first-child td:nth-child(2)').textContent();
    expect(firstId).toBe('101');
    
    // Navigate back to page 1
    await page.click('button:has-text("Previous")');
    await page.waitForTimeout(500);
    
    firstId = await page.locator('table tbody tr:first-child td:nth-child(2)').textContent();
    expect(firstId).toBe('1');
  });

  test('should display NULL values correctly', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS null_test');
      await db.execute('CREATE TABLE null_test (id INTEGER PRIMARY KEY, nullable_field TEXT)');
      await db.execute("INSERT INTO null_test (id, nullable_field) VALUES (1, 'Has Value')");
      await db.execute("INSERT INTO null_test (id, nullable_field) VALUES (2, NULL)");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=null_test');
    await page.waitForSelector('table tbody tr');
    
    // Check NULL is displayed correctly (column index shifted due to checkbox column)
    const nullCell = await page.locator('table tbody tr:nth-child(2) td:nth-child(4)');
    const nullText = await nullCell.textContent();
    expect(nullText).toContain('NULL');
    
    // Verify NULL cell has special styling
    const hasNullClass = await nullCell.evaluate((el) => el.classList.contains('null-value'));
    expect(hasNullClass).toBe(true);
  });

  test('should display row count', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS count_test');
      await db.execute('CREATE TABLE count_test (id INTEGER PRIMARY KEY)');
      
      for (let i = 1; i <= 42; i++) {
        await db.execute(`INSERT INTO count_test (id) VALUES (${i})`);
      }
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=count_test');
    await page.waitForSelector('table tbody tr');
    
    // Verify row count is displayed
    const countText = await page.locator('#rowCount').textContent();
    expect(countText).toContain('42');
  });
});
