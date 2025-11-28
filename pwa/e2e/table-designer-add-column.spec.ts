import { test, expect } from '@playwright/test';

test.describe('Table Designer - Add Column E2E', () => {
  // Unique database name per test run to avoid parallel test conflicts
  const testDbName = `designer-add-column-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.db`;

  test.beforeEach(async ({ page }) => {
    // Go directly to designer page and let it initialize
    await page.goto('/db/designer');
    await page.waitForLoadState('networkidle');

    // Wait for WASM to be ready
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });

    // Create database programmatically since designer page needs one
    await page.evaluate(async (dbName) => {
      const Database = (window as any).Database;
      const testDb = await Database.newDatabase(dbName);
      await testDb.allowNonLeaderWrites(true);
      (window as any).testDb = testDb;
      (window as any).testDbName = dbName;

      // Create a test table
      await testDb.execute(`DROP TABLE IF EXISTS test_add_column`);
      await testDb.execute(`
        CREATE TABLE test_add_column (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL
        )
      `);
    }, testDbName);

    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });

    // Click refresh button to update tables list
    await page.click('#refreshTables');
    await page.waitForSelector('[data-slot="select-trigger"]', { state: 'visible' });
  });

  test.afterEach(async ({ page }) => {
    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      const dbName = (window as any).testDbName;
      if (db) {
        try { await db.close(); } catch {}
      }
      if (dbName) { try { await indexedDB.deleteDatabase(dbName); } catch {} }
    }).catch(() => {});
  });

  test('should open Add Column dialog when Add Column button is clicked', async ({ page }) => {
    // Click Add Column button
    await page.click('#addColumn');

    // Wait for dialog to be visible and animations to complete
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Should see dialog title
    await expect(page.locator('[role="dialog"] >> text=/add.*column/i').first()).toBeVisible();
  });

  test('should show column name input in Add Column dialog', async ({ page }) => {
    await page.click('#addColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Should see column name input
    await expect(page.locator('#columnName')).toBeVisible();
  });

  test('should show data type selector in Add Column dialog', async ({ page }) => {
    await page.click('#addColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Should see data type selector
    await expect(page.locator('#columnType')).toBeVisible();
  });

  test('should show constraint checkboxes in Add Column dialog', async ({ page }) => {
    await page.click('#addColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Should see NOT NULL checkbox
    await expect(page.locator('#notNull')).toBeVisible();

    // Should see UNIQUE checkbox
    await expect(page.locator('#unique')).toBeVisible();
  });

  test('should show default value input in Add Column dialog', async ({ page }) => {
    await page.click('#addColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Should see default value input
    await expect(page.locator('#defaultValue')).toBeVisible();
  });

  test('should add a new TEXT column to the table', async ({ page }) => {
    // Click Add Column button
    await page.click('#addColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Fill in column details
    await page.fill('#columnName', 'email');

    // Select TEXT type
    await page.click('#columnType');
    await page.waitForSelector('[role="option"]', { state: 'visible' });
    await page.click('[role="option"]:has-text("TEXT")');

    // Click Add button
    await page.click('#confirmAddColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Wait for column to appear
    await page.waitForSelector('[data-column-list] >> text=email', { state: 'visible' });

    // Verify column appears in the list
    await expect(page.locator('[data-column-list] >> text=email')).toBeVisible();

    // Verify column was actually added to database
    const columnExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA table_info(test_add_column)`);
      return result.rows.some((row: any) => row.values[1].value === 'email');
    });
    expect(columnExists).toBe(true);
  });

  test('should add an INTEGER column with NOT NULL constraint', async ({ page }) => {
    await page.click('#addColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Fill in column details
    await page.fill('#columnName', 'age');

    // Select INTEGER type
    await page.click('#columnType');
    await page.waitForSelector('[role="option"]', { state: 'visible' });
    await page.click('[role="option"]:has-text("INTEGER")');

    // Check NOT NULL
    await page.click('#notNull');

    // Click Add button
    await page.click('#confirmAddColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Wait for column to appear
    await page.waitForSelector('[data-column-list] >> text=age', { state: 'visible' });

    // Verify column appears with NOT NULL badge
    await expect(page.locator('[data-column-list] >> text=age').first()).toBeVisible();

    // Verify NOT NULL constraint in database
    const hasNotNull = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA table_info(test_add_column)`);
      const ageColumn = result.rows.find((row: any) => row.values[1].value === 'age');
      return ageColumn && ageColumn.values[3].value === 1; // notnull flag
    });
    expect(hasNotNull).toBe(true);
  });

  test('should add a REAL column with default value', async ({ page }) => {
    await page.click('#addColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Fill in column details
    await page.fill('#columnName', 'price');

    // Select REAL type
    await page.click('#columnType');
    await page.waitForSelector('[role="option"]', { state: 'visible' });
    await page.click('[role="option"]:has-text("REAL")');

    // Set default value
    await page.fill('#defaultValue', '0.0');

    // Click Add button
    await page.click('#confirmAddColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Verify default value in database
    const hasDefault = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA table_info(test_add_column)`);
      const priceColumn = result.rows.find((row: any) => row.values[1].value === 'price');
      return priceColumn && priceColumn.values[4].value === '0.0';
    });
    expect(hasDefault).toBe(true);
  });

  test('should add a UNIQUE column', async ({ page }) => {
    await page.click('#addColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Fill in column details
    await page.fill('#columnName', 'username');

    // Select TEXT type
    await page.click('#columnType');
    await page.waitForSelector('[role="option"]', { state: 'visible' });
    await page.click('[role="option"]:has-text("TEXT")');

    // Check UNIQUE
    await page.click('#unique');

    // Click Add button
    await page.click('#confirmAddColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Wait for column to appear
    await page.waitForSelector('[data-column-list] >> text=username', { state: 'visible' });

    // Verify column was added
    const columnExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA table_info(test_add_column)`);
      return result.rows.some((row: any) => row.values[1].value === 'username');
    });
    expect(columnExists).toBe(true);

    // Verify UNIQUE index was created
    const hasUniqueIndex = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA index_list(test_add_column)`);
      return result.rows.some((row: any) => {
        const indexName = row.values[1].value;
        const isUnique = row.values[2].value === 1;
        return indexName.includes('username') && isUnique;
      });
    });
    expect(hasUniqueIndex).toBe(true);

    // Verify column appears in UI
    await expect(page.locator('[data-column-list] >> text=username').first()).toBeVisible();
  });

  test('should show error if column name is empty', async ({ page }) => {
    await page.click('#addColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Leave column name empty

    // Select a type
    await page.click('#columnType');
    await page.waitForSelector('[role="option"]', { state: 'visible' });
    await page.click('[role="option"]:has-text("TEXT")');

    // Try to add
    await page.click('#confirmAddColumn');

    // Should see error message
    await page.waitForSelector('text=/column name.*required|required.*column name/i', { state: 'visible' });
    await expect(page.locator('text=/column name.*required|required.*column name/i')).toBeVisible();
  });

  test('should close dialog when Cancel is clicked', async ({ page }) => {
    await page.click('#addColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Dialog should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click cancel
    await page.click('button:has-text("Cancel")');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Dialog should be closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should update column count after adding a column', async ({ page }) => {
    // Initial count should be 2 columns
    await expect(page.locator('text=/2.*columns?/i')).toBeVisible();

    // Add a column
    await page.click('#addColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.fill('#columnName', 'status');
    await page.click('#columnType');
    await page.waitForSelector('[role="option"]', { state: 'visible' });
    await page.click('[role="option"]:has-text("TEXT")');
    await page.click('#confirmAddColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Wait for count to update
    await page.waitForSelector('text=/3.*columns?/i', { state: 'visible' });

    // Count should now be 3 columns
    await expect(page.locator('text=/3.*columns?/i')).toBeVisible();
  });
});
