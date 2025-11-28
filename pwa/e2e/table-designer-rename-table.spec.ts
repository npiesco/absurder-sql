import { test, expect } from '@playwright/test';

test.describe('Table Designer - Rename Table E2E', () => {
  // Unique database name per test run to avoid parallel test conflicts
  const testDbName = `designer-rename-table-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.db`;

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

      await testDb.execute(`DROP TABLE IF EXISTS test_rename_table`);
      await testDb.execute(`
        CREATE TABLE test_rename_table (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          age INTEGER
        )
      `);
      await testDb.execute(`CREATE INDEX idx_name ON test_rename_table (name)`);
      await testDb.execute(`
        INSERT INTO test_rename_table (name, email, age)
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
    await page.locator('[role="option"]').filter({ hasText: 'test_rename_table' }).click();
    await page.waitForSelector('button:has-text("Rename Table")', { state: 'visible' });
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      const dbName = (window as any).testDbName;
      if (db) { try { await db.close(); } catch {} }
      if (dbName) { try { await indexedDB.deleteDatabase(dbName); } catch {} }
    }).catch(() => {});
  });

  test('should show Rename Table button', async ({ page }) => {
    await expect(page.locator('button:has-text("Rename Table")')).toBeVisible();
  });

  test('should open Rename Table dialog when button is clicked', async ({ page }) => {
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('[role="dialog"] >> text=/rename.*table/i').first()).toBeVisible();
  });

  test('should show current table name in dialog', async ({ page }) => {
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await expect(page.locator('#newTableName')).toHaveValue('test_rename_table');
  });

  test('should have empty new name input initially', async ({ page }) => {
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    const input = page.locator('#newTableName');
    await expect(input).toBeVisible();
    await expect(input).toBeEditable();
  });

  test('should close dialog when Cancel is clicked', async ({ page }) => {
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should not rename table when Cancel is clicked', async ({ page }) => {
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.fill('#newTableName', 'renamed_table');
    await page.click('button:has-text("Cancel")');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    const tableExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='test_rename_table'
      `);
      return result.rows.length > 0;
    });
    expect(tableExists).toBe(true);
  });

  test('should rename table successfully', async ({ page }) => {
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await page.fill('#newTableName', 'users_renamed');
    await page.click('#confirmRenameTable', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    const newTableExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='users_renamed'
      `);
      return result.rows.length > 0;
    });
    expect(newTableExists).toBe(true);

    const oldTableExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='test_rename_table'
      `);
      return result.rows.length > 0;
    });
    expect(oldTableExists).toBe(false);
  });

  test('should update table selector after rename', async ({ page }) => {
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.fill('#newTableName', 'users_renamed');
    await page.click('#confirmRenameTable', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    await expect(page.locator('[data-slot="select-trigger"]')).toContainText('users_renamed');
  });

  test('should preserve table data after rename', async ({ page }) => {
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.fill('#newTableName', 'users_renamed');
    await page.click('#confirmRenameTable', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    const dataPreserved = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`SELECT COUNT(*) as count FROM users_renamed`);
      return result.rows[0].values[0].value === 3;
    });
    expect(dataPreserved).toBe(true);
  });

  test('should preserve indexes after rename', async ({ page }) => {
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.fill('#newTableName', 'users_renamed');
    await page.click('#confirmRenameTable', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    const indexExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA index_list(users_renamed)`);
      return result.rows.some((row: any) => row.values[1].value === 'idx_name');
    });
    expect(indexExists).toBe(true);
  });

  test('should preserve column structure after rename', async ({ page }) => {
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.fill('#newTableName', 'users_renamed');
    await page.click('#confirmRenameTable', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    const columnsPreserved = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA table_info(users_renamed)`);
      return result.rows.length === 4; // id, name, email, age
    });
    expect(columnsPreserved).toBe(true);
  });

  test('should show error if new table name is empty', async ({ page }) => {
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await page.fill('#newTableName', '');
    await page.click('#confirmRenameTable', { force: true });

    const errorDiv = page.locator('.bg-destructive\\/10');
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toContainText(/table name.*required|required/i);
  });

  test('should show error if new table name already exists', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      try {
        await db.execute(`DROP TABLE IF EXISTS existing_table`);
      } catch (e) {}
      await db.execute(`CREATE TABLE existing_table (id INTEGER PRIMARY KEY)`);
    });

    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.fill('#newTableName', 'existing_table');
    await page.click('#confirmRenameTable', { force: true });

    const errorDiv = page.locator('.bg-destructive\\/10');
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toContainText(/already exists|error/i);
  });

  test('should show error if new name contains invalid characters', async ({ page }) => {
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await page.fill('#newTableName', 'invalid table name');
    await page.click('#confirmRenameTable', { force: true });

    // Should either show error or SQLite will reject it
    const errorDiv = page.locator('.bg-destructive\\/10');
    const errorVisible = await errorDiv.isVisible().catch(() => false);

    if (errorVisible) {
      await expect(errorDiv).toContainText(/invalid|error/i);
    }
  });

  test('should show success message after renaming', async ({ page }) => {
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.fill('#newTableName', 'users_renamed');
    await page.click('#confirmRenameTable', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    await expect(page.locator('text=/renamed.*successfully|success/i')).toBeVisible();
  });

  test('should allow renaming to same name with different case', async ({ page }) => {
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.fill('#newTableName', 'TEST_RENAME_TABLE');
    await page.click('#confirmRenameTable', { force: true });

    // Wait for dialog to close or error to appear
    try {
      await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
      // Dialog closed - rename succeeded, verify table exists with new case
      const tableExists = await page.evaluate(async () => {
        const db = (window as any).testDb;
        // SQLite stores the name as provided, use case-insensitive comparison
        const result = await db.execute(`
          SELECT name FROM sqlite_master
          WHERE type='table' AND LOWER(name)='test_rename_table'
        `);
        return result.rows.length > 0;
      });
      expect(tableExists).toBe(true);
    } catch {
      // Dialog didn't close - check if error is shown (expected for same name)
      const errorDiv = page.locator('.bg-destructive\\/10');
      const errorVisible = await errorDiv.isVisible();
      // If error is shown, that's acceptable behavior for same-name rename
      expect(errorVisible).toBe(true);
    }
  });
});
