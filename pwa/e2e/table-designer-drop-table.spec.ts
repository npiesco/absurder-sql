import { test, expect } from '@playwright/test';

test.describe('Table Designer - Drop Table E2E', () => {
  // Unique database name per test run to avoid parallel test conflicts
  const testDbName = `designer-drop-table-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.db`;

  test.beforeEach(async ({ page }) => {
    await page.goto('/db/designer');
    await page.waitForLoadState('networkidle');

    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });

    await page.evaluate(async (dbName) => {
      const Database = (window as any).Database;
      const testDb = await Database.newDatabase(dbName);
      await testDb.allowNonLeaderWrites(true);
      (window as any).testDb = testDb;
      (window as any).testDbName = dbName;

      await testDb.execute(`DROP TABLE IF EXISTS test_drop_table`);
      await testDb.execute(`DROP TABLE IF EXISTS test_drop_empty`);
      await testDb.execute(`
        CREATE TABLE test_drop_table (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          age INTEGER
        )
      `);
      await testDb.execute(`CREATE TABLE test_drop_empty (id INTEGER PRIMARY KEY)`);
      await testDb.execute(`CREATE INDEX idx_name ON test_drop_table (name)`);
      await testDb.execute(`
        INSERT INTO test_drop_table (name, email, age)
        VALUES
          ('John Doe', 'john@example.com', 30),
          ('Jane Smith', 'jane@example.com', 25),
          ('Bob Johnson', 'bob@example.com', 35)
      `);
    }, testDbName);

    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
    await page.click('#refreshTables');
    await page.waitForSelector('[data-slot="select-trigger"]', { state: 'visible' });
    await page.click('[data-slot="select-trigger"]');
    await page.waitForSelector('[role="option"]', { state: 'visible' });
    await page.locator('[role="option"]').filter({ hasText: 'test_drop_table' }).click();
    await page.waitForSelector('button:has-text("Drop Table")', { state: 'visible' });
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      const dbName = (window as any).testDbName;
      if (db) { try { await db.close(); } catch {} }
      if (dbName) { try { await indexedDB.deleteDatabase(dbName); } catch {} }
    }).catch(() => {});
  });

  test('should show Drop Table button', async ({ page }) => {
    await expect(page.locator('button:has-text("Drop Table")')).toBeVisible();
  });

  test('should open Drop Table confirmation dialog when button is clicked', async ({ page }) => {
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('[role="dialog"] >> text=/drop.*table|delete.*table/i').first()).toBeVisible();
  });

  test('should show table name in confirmation dialog', async ({ page }) => {
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await expect(page.locator('[role="dialog"] >> text=test_drop_table')).toBeVisible();
  });

  test('should show warning about data loss', async ({ page }) => {
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    const warningBox = page.locator('.border-destructive').filter({ hasText: 'permanently deleted' });
    await expect(warningBox).toBeVisible();
  });

  test('should close dialog when Cancel is clicked', async ({ page }) => {
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should not drop table when Cancel is clicked', async ({ page }) => {
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('button:has-text("Cancel")');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    const tableExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='test_drop_table'
      `);
      return result.rows.length > 0;
    });
    expect(tableExists).toBe(true);
  });

  test('should drop table successfully', async ({ page }) => {
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('#confirmDropTable', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    const tableExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='test_drop_table'
      `);
      return result.rows.length > 0;
    });
    expect(tableExists).toBe(false);
  });

  test('should remove table from selector after drop', async ({ page }) => {
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('#confirmDropTable', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    await page.click('[data-slot="select-trigger"]');
    await page.waitForSelector('[role="listbox"]', { state: 'visible' });

    const droppedTableOption = page.locator('[role="option"]').filter({ hasText: 'test_drop_table' });
    const count = await droppedTableOption.count();
    expect(count).toBe(0);
  });

  test('should automatically select another table after drop', async ({ page }) => {
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('#confirmDropTable', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    const selectValue = await page.locator('[data-slot="select-trigger"]').textContent();
    expect(selectValue).not.toContain('test_drop_table');
  });

  test('should drop empty table', async ({ page }) => {
    await page.click('[data-slot="select-trigger"]');
    await page.waitForSelector('[role="option"]', { state: 'visible' });
    await page.locator('[role="option"]').filter({ hasText: 'test_drop_empty' }).click();
    await page.waitForSelector('button:has-text("Drop Table")', { state: 'visible' });

    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('#confirmDropTable', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    const tableExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='test_drop_empty'
      `);
      return result.rows.length > 0;
    });
    expect(tableExists).toBe(false);
  });

  test('should drop table with indexes', async ({ page }) => {
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('#confirmDropTable', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    const indexExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`
        SELECT name FROM sqlite_master
        WHERE type='index' AND name='idx_name'
      `);
      return result.rows.length > 0;
    });
    expect(indexExists).toBe(false);
  });

  test('should show success message after dropping table', async ({ page }) => {
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('#confirmDropTable', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    await expect(page.locator('text=/dropped.*successfully|success/i')).toBeVisible();
  });

  test('should show row count warning in dialog', async ({ page }) => {
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    const dialogText = await page.locator('[role="dialog"]').textContent();
    expect(dialogText).toMatch(/row|data|column/i);
  });

  test('should clear table structure display after drop', async ({ page }) => {
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('#confirmDropTable', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    const hasSelectedTable = await page.locator('[data-table-title]').isVisible().catch(() => false);

    if (hasSelectedTable) {
      const titleText = await page.locator('[data-table-title]').textContent();
      expect(titleText).not.toContain('test_drop_table');
    }
  });

  test('should handle dropping last table gracefully', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);

      for (const row of result.rows) {
        const tableName = row.values[0].value;
        if (tableName !== 'test_drop_table' && tableName !== 'test_drop_empty') {
          try {
            await db.execute(`DROP TABLE IF EXISTS ${tableName}`);
          } catch (e) {}
        }
      }
    });

    await page.click('#refreshTables');
    await page.waitForSelector('[data-slot="select-trigger"]', { state: 'visible' });

    // Drop first table
    await page.click('[data-slot="select-trigger"]');
    await page.waitForSelector('[role="option"]', { state: 'visible' });
    await page.locator('[role="option"]').filter({ hasText: 'test_drop_table' }).click();
    await page.waitForSelector('button:has-text("Drop Table")', { state: 'visible' });

    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('#confirmDropTable', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Drop second table
    await page.click('[data-slot="select-trigger"]');
    await page.waitForSelector('[role="option"]', { state: 'visible' });
    await page.locator('[role="option"]').filter({ hasText: 'test_drop_empty' }).click();
    await page.waitForSelector('button:has-text("Drop Table")', { state: 'visible' });

    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('#confirmDropTable', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Should show appropriate message (no tables selected or placeholder)
    const selectTrigger = page.locator('[data-slot="select-trigger"]');
    await expect(selectTrigger).toBeVisible();
    const triggerText = await selectTrigger.textContent();
    expect(triggerText).toMatch(/select.*table/i);
  });
});
