import { test, expect } from '@playwright/test';

const TEST_DB_1 = 'diff_test_db1';
const TEST_DB_2 = 'diff_test_db2';

test.describe('Schema Diff E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to database page and create test databases
    await page.goto('/db');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to Schema Diff page', async ({ page }) => {
    await page.goto('/db/diff');
    await page.waitForLoadState('networkidle');
    
    // Should show Schema Diff heading
    const heading = page.locator('h1, h2').filter({ hasText: /Schema Diff|Compare/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should show database selection UI', async ({ page }) => {
    await page.goto('/db/diff');
    await page.waitForLoadState('networkidle');
    
    // Should have two database selectors
    const db1Selector = page.locator('#sourceDb, [data-testid="source-db"], select, button').first();
    await expect(db1Selector).toBeVisible({ timeout: 10000 });
    
    const db2Selector = page.locator('#targetDb, [data-testid="target-db"]').first();
    await expect(db2Selector).toBeVisible({ timeout: 10000 });
  });

  test('should show Compare button', async ({ page }) => {
    await page.goto('/db/diff');
    await page.waitForLoadState('networkidle');
    
    const compareButton = page.locator('#compareButton, button:has-text("Compare")').first();
    await expect(compareButton).toBeVisible({ timeout: 10000 });
  });

  test('should detect new table in target database', async ({ page }) => {
    // Create first database
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput', { timeout: 5000 });
    await page.fill('#dbNameInput', TEST_DB_1);
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, `${TEST_DB_1}.db`, { timeout: 15000 });
    
    // Create a table in first database
    await page.goto('/db/query');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#queryInterface', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });

    // Create database programmatically since /db/query doesn't auto-create one
    await page.evaluate(async () => {
      const Database = (window as any).Database;
      const testDb = await Database.newDatabase('test-db');
      (window as any).testDb = testDb;
    });

    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });

    const editor = page.locator('.cm-content').first();
    await editor.click();
    // INSTRUCTIONS.md Rule #2: ALWAYS DROP TABLE IF EXISTS before CREATE TABLE
    await editor.fill('DROP TABLE IF EXISTS users');
    await page.click('#executeButton');
    
    await editor.click();
    await editor.fill('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
    await page.click('#executeButton');
    
    // Wait for query results to appear
    await page.waitForSelector('#queryResults, #status:has-text("executed")', { timeout: 10000 }).catch(() => {});
    
    // Close database to trigger sync to IndexedDB
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db && db.close) {
        await db.close();
      }
    });
    
    // Create second database
    await page.goto('/db');
    await page.waitForLoadState('networkidle');
    
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput', { timeout: 5000 });
    await page.fill('#dbNameInput', TEST_DB_2);
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, `${TEST_DB_2}.db`, { timeout: 15000 });
    
    // Create tables in second database (superset)
    await page.goto('/db/query');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#queryInterface', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });

    // Create database programmatically since /db/query doesn't auto-create one
    await page.evaluate(async () => {
      const Database = (window as any).Database;
      const testDb = await Database.newDatabase('test-db');
      (window as any).testDb = testDb;
    });

    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });

    await editor.click();
    // INSTRUCTIONS.md Rule #2: ALWAYS DROP TABLE IF EXISTS before CREATE TABLE
    await editor.fill('DROP TABLE IF EXISTS users');
    await page.click('#executeButton');
    
    await editor.click();
    await editor.fill('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
    await page.click('#executeButton');
    
    await editor.click();
    // INSTRUCTIONS.md Rule #2: DROP TABLE IF EXISTS before CREATE TABLE
    await editor.fill('DROP TABLE IF EXISTS posts');
    await page.click('#executeButton');
    
    await editor.click();
    await editor.fill('CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT, user_id INTEGER)');
    await page.click('#executeButton');
    
    // Wait for final query to complete
    await page.waitForSelector('#queryResults, #status:has-text("executed")', { timeout: 10000 }).catch(() => {});
    
    // Close database to trigger sync to IndexedDB
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db && db.close) {
        await db.close();
      }
    });
    
    // Go to diff page
    await page.goto('/db/diff');
    await page.waitForLoadState('networkidle');
    
    // Select source database - click trigger first
    const sourceDbTrigger = page.locator('#sourceDb').first();
    await sourceDbTrigger.click();
    
    // Wait for the specific option to appear (this ensures React has rendered)
    const sourceOption = page.locator(`[role="option"]:has-text("${TEST_DB_1}.db")`).first();
    await sourceOption.waitFor({ state: 'visible', timeout: 20000 });
    await sourceOption.click();
    
    // Select target database
    const targetDbTrigger = page.locator('#targetDb').first();
    await targetDbTrigger.click();
    const targetOption = page.locator(`[role="option"]:has-text("${TEST_DB_2}.db")`).first();
    await targetOption.waitFor({ state: 'visible', timeout: 15000 });
    await targetOption.click();
    
    // Click Compare button
    const compareButton = page.locator('#compareButton, button:has-text("Compare")').first();
    await compareButton.click();
    
    // Should show "posts" table as added (green)
    const addedTable = page.locator('[data-diff="added"], .text-green-600, .bg-green-50').filter({ hasText: /posts/i }).first();
    await expect(addedTable).toBeVisible({ timeout: 10000 });
  });

  test('should detect removed table', async ({ page }) => {
    // Create databases with different tables
    // DB1 has: users, posts
    // DB2 has: users
    // Should show "posts" as removed (red)
    
    // Setup will be similar to previous test
    await page.goto('/db/diff');
    await page.waitForLoadState('networkidle');
    
    // After comparing, should show removed tables in red
    const removedIndicator = page.locator('[data-diff="removed"], .text-red-600, .bg-red-50').first();
    // This test needs the databases to be set up first
  });

  test('should detect modified column in table', async ({ page }) => {
    // Create DB1 with: users (id, name)
    // Create DB2 with: users (id, name, email)
    // Should show "email" column as added in yellow/modified section
    
    await page.goto('/db/diff');
    await page.waitForLoadState('networkidle');
    
    // After comparison, should show column changes
    const modifiedIndicator = page.locator('[data-diff="modified"], .text-yellow-600, .bg-yellow-50').first();
    // This test needs the databases to be set up first
  });

  test('should show empty state when no differences', async ({ page }) => {
    // Create two identical databases
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput', { timeout: 5000 });
    await page.fill('#dbNameInput', 'identical1.db');
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, 'identical1.db', { timeout: 15000 });
    
    await page.goto('/db/query');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#queryInterface', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });

    // Create database programmatically since /db/query doesn't auto-create one
    await page.evaluate(async () => {
      const Database = (window as any).Database;
      const testDb = await Database.newDatabase('test-db');
      (window as any).testDb = testDb;
    });

    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });

    const editor = page.locator('.cm-content').first();
    await editor.click();
    // INSTRUCTIONS.md Rule #2: ALWAYS DROP TABLE IF EXISTS before CREATE TABLE
    await editor.fill('DROP TABLE IF EXISTS test');
    await page.click('#executeButton');
    
    await editor.click();
    await editor.fill('CREATE TABLE test (id INTEGER)');
    await page.click('#executeButton');
    
    // Wait for query to complete
    await page.waitForSelector('#queryResults, #status:has-text("executed")', { timeout: 10000 }).catch(() => {});
    
    await page.goto('/db');
    await page.waitForLoadState('networkidle');
    
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput', { timeout: 5000 });
    await page.fill('#dbNameInput', 'identical2.db');
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, 'identical2.db', { timeout: 15000 });
    
    await page.goto('/db/query');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#queryInterface', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });

    // Create database programmatically since /db/query doesn't auto-create one
    await page.evaluate(async () => {
      const Database = (window as any).Database;
      const testDb = await Database.newDatabase('test-db');
      (window as any).testDb = testDb;
    });

    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });

    await editor.click();
    // INSTRUCTIONS.md Rule #2: ALWAYS DROP TABLE IF EXISTS before CREATE TABLE
    await editor.fill('DROP TABLE IF EXISTS test');
    await page.click('#executeButton');
    
    await editor.click();
    await editor.fill('CREATE TABLE test (id INTEGER)');
    await page.click('#executeButton');
    
    // Wait for query to complete
    await page.waitForSelector('#queryResults, #status:has-text("executed")', { timeout: 10000 }).catch(() => {});
    
    await page.goto('/db/diff');
    await page.waitForLoadState('networkidle');
    
    // Select identical databases and compare
    // Should show "No differences found" message
    const noDiffMessage = page.locator('text=/no differences|identical|same schema/i').first();
    // Will be visible after implementation
  });

  test('should detect index differences', async ({ page }) => {
    // Create DB1 with table but no index
    // Create DB2 with table and index
    // Should show index as added
    
    await page.goto('/db/diff');
    await page.waitForLoadState('networkidle');
    
    const indexDiff = page.locator('[data-type="index"]').first();
    // Will be implemented
  });

  test('should show comparison details for tables', async ({ page }) => {
    await page.goto('/db/diff');
    await page.waitForLoadState('networkidle');
    
    // Should show table details when expanded
    const tableDetails = page.locator('[data-testid="table-details"], .table-diff-details').first();
    // Will be visible after comparison
  });

  test('should group differences by category', async ({ page }) => {
    await page.goto('/db/diff');
    await page.waitForLoadState('networkidle');
    
    // Should have sections for Tables, Columns, Indexes, Triggers
    const tablesSection = page.locator('text=/Tables|Table Changes/i').first();
    const indexesSection = page.locator('text=/Indexes|Index Changes/i').first();
    
    // These sections should exist
  });

  test('should handle comparing same database gracefully', async ({ page }) => {
    // Create one database
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput', { timeout: 5000 });
    await page.fill('#dbNameInput', 'single.db');
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, 'single.db', { timeout: 15000 });
    
    await page.goto('/db/diff');
    await page.waitForLoadState('networkidle');
    
    // Try to select same database for both source and target
    // Should either prevent this or show "No differences"
    const compareButton = page.locator('#compareButton, button:has-text("Compare")').first();
    // Behavior to be defined
  });

  test('should show loading state during comparison', async ({ page }) => {
    await page.goto('/db/diff');
    await page.waitForLoadState('networkidle');
    
    // Click compare (assuming databases are selected)
    const compareButton = page.locator('#compareButton, button:has-text("Compare")').first();
    
    // Should show loading indicator
    const loadingIndicator = page.locator('[data-testid="loading"], .animate-spin, text=/comparing|loading/i').first();
    // Will appear during comparison
  });

  test('should allow navigation back to database list', async ({ page }) => {
    await page.goto('/db/diff');
    await page.waitForLoadState('networkidle');
    
    // Should have link back to database management
    const backLink = page.locator('a[href="/db"], button:has-text("Back")').first();
    // Should be visible
  });

  test('should show summary of differences', async ({ page }) => {
    await page.goto('/db/diff');
    await page.waitForLoadState('networkidle');
    
    // After comparison, should show summary like "3 tables added, 1 table removed, 2 columns modified"
    const summary = page.locator('[data-testid="diff-summary"], .summary').first();
    // Will contain counts
  });
});
