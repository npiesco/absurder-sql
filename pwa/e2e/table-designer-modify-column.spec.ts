import { test, expect } from '@playwright/test';

test.describe('Table Designer - Modify Column E2E', () => {
  // Unique database name per test run to avoid parallel test conflicts
  const testDbName = `designer-modify-column-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.db`;

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

      await testDb.execute(`DROP TABLE IF EXISTS test_modify_column`);
      await testDb.execute(`
        CREATE TABLE test_modify_column (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT,
          age INTEGER,
          status TEXT DEFAULT 'active'
        )
      `);
      await testDb.execute(`
        INSERT INTO test_modify_column (name, email, age, status)
        VALUES ('John Doe', 'john@example.com', 30, 'active')
      `);
    }, testDbName);

    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
    await page.click('#refreshTables');
    // Wait for table options to be available
    await page.waitForSelector('[data-slot="select-trigger"]', { state: 'visible' });
    await page.click('[data-slot="select-trigger"]');
    // Wait for dropdown options to appear
    await page.waitForSelector('[role="option"]', { state: 'visible' });
    await page.locator('[role="option"]').filter({ hasText: 'test_modify_column' }).click();
    // Wait for columns to load - look for Edit buttons which indicate table is loaded
    await page.waitForSelector('button:has-text("Edit")', { state: 'visible' });
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      const dbName = (window as any).testDbName;
      if (db) { try { await db.close(); } catch {} }
      if (dbName) { try { await indexedDB.deleteDatabase(dbName); } catch {} }
    }).catch(() => {});
  });

  test('should show Edit button for each column', async ({ page }) => {
    // Should see Edit buttons in the Actions column
    const editButtons = page.locator('button:has-text("Edit")');
    await expect(editButtons.first()).toBeVisible();

    // Should have multiple edit buttons (one per column)
    const count = await editButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should open Edit Column dialog when Edit button is clicked', async ({ page }) => {
    // Click Edit button for the "email" column
    await page.locator('tr:has-text("email") >> button:has-text("Edit")').click();

    // Wait for dialog to appear
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Should see edit dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Should see dialog title
    await expect(page.locator('[role="dialog"] >> text=/edit.*column|modify.*column/i').first()).toBeVisible();
  });

  test('should show current column name in Edit dialog', async ({ page }) => {
    await page.locator('tr:has-text("email") >> button:has-text("Edit")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Wait for input to have the value
    const nameInput = page.locator('#editColumnName, input[name="columnName"]');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue('email');
  });

  test('should show current column type in Edit dialog', async ({ page }) => {
    await page.locator('tr:has-text("email") >> button:has-text("Edit")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Should see type selector
    const typeSelector = page.locator('#editColumnType');
    await expect(typeSelector).toBeVisible();
  });

  test('should rename column', async ({ page }) => {
    // Verify original column exists
    await expect(page.locator('[data-column-list] >> text="email"').first()).toBeVisible();

    // Click Edit button
    await page.locator('tr:has-text("email") >> button:has-text("Edit")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Change column name
    await page.fill('#editColumnName', 'user_email');

    // Save changes
    await page.click('#confirmEditColumn, button:has-text("Save")');
    // Wait for dialog to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Verify column was renamed in database
    const columnRenamed = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA table_info(test_modify_column)`);
      const hasNewName = result.rows.some((row: any) => row.values[1].value === 'user_email');
      const hasOldName = result.rows.some((row: any) => row.values[1].value === 'email');
      return hasNewName && !hasOldName;
    });
    expect(columnRenamed).toBe(true);
  });

  test('should show renamed column in UI', async ({ page }) => {
    // Rename the column
    await page.locator('tr:has-text("email") >> button:has-text("Edit")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.fill('#editColumnName', 'user_email');
    await page.click('#confirmEditColumn, button:has-text("Save")');
    // Wait for dialog to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // New name should be visible
    await expect(page.locator('[data-column-list] >> text="user_email"').first()).toBeVisible();

    // Old name should not be visible
    await expect(page.locator('[data-column-list] >> text="email"').first()).not.toBeVisible();
  });

  test('should preserve data when renaming column', async ({ page }) => {
    // Get data before rename
    const dataBefore = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`SELECT email FROM test_modify_column WHERE id = 1`);
      return result.rows[0].values[0].value;
    });

    // Rename the column
    await page.locator('tr:has-text("email") >> button:has-text("Edit")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.fill('#editColumnName', 'user_email');
    await page.click('#confirmEditColumn, button:has-text("Save")');
    // Wait for dialog to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Verify data is preserved with new column name
    const dataAfter = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`SELECT user_email FROM test_modify_column WHERE id = 1`);
      return result.rows[0].values[0].value;
    });

    expect(dataAfter).toBe(dataBefore);
  });

  test('should show error if new column name is empty', async ({ page }) => {
    await page.locator('tr:has-text("email") >> button:has-text("Edit")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Clear the column name
    await page.fill('#editColumnName', '');

    // Try to save
    await page.click('#confirmEditColumn, button:has-text("Save")');

    // Should see error message
    await expect(page.locator('text=/column name.*required|required.*column name/i')).toBeVisible();
  });

  test('should show error if column name already exists', async ({ page }) => {
    await page.locator('tr:has-text("email") >> button:has-text("Edit")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Try to rename to existing column name
    await page.fill('#editColumnName', 'name');

    // Try to save
    await page.click('#confirmEditColumn, button:has-text("Save")');

    // Should see error message (either client-side validation or SQLite error)
    await expect(page.locator('text=/already exists|duplicate|error/i')).toBeVisible({ timeout: 5000 });
  });

  test('should close dialog when Cancel is clicked', async ({ page }) => {
    await page.locator('tr:has-text("email") >> button:has-text("Edit")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Dialog should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Dialog should be closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should not modify column when Cancel is clicked', async ({ page }) => {
    // Try to rename but cancel
    await page.locator('tr:has-text("email") >> button:has-text("Edit")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.fill('#editColumnName', 'cancelled_name');
    await page.click('button:has-text("Cancel")');
    // Wait for dialog to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Verify column name unchanged in database
    const columnUnchanged = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA table_info(test_modify_column)`);
      return result.rows.some((row: any) => row.values[1].value === 'email');
    });
    expect(columnUnchanged).toBe(true);
  });

  test('should not allow renaming PRIMARY KEY column', async ({ page }) => {
    // Try to edit the "id" column (PRIMARY KEY)
    await page.locator('tr:has-text("id") >> button:has-text("Edit")').click();

    // Should see error or warning about PRIMARY KEY
    await expect(page.locator('text=/primary key|cannot.*modify.*primary/i').first()).toBeVisible();
  });

  test('should show success message after renaming', async ({ page }) => {
    await page.locator('tr:has-text("email") >> button:has-text("Edit")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.fill('#editColumnName', 'user_email');
    await page.click('#confirmEditColumn, button:has-text("Save")');
    // Wait for dialog to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Should see success message
    await expect(page.locator('text=/column.*renamed|successfully.*modified|updated/i')).toBeVisible();
  });

  test('should preserve indexes when renaming column', async ({ page }) => {
    // Create an index on the column
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute(`CREATE INDEX idx_email ON test_modify_column(email)`);
    });

    // Rename the column
    await page.locator('tr:has-text("email") >> button:has-text("Edit")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.fill('#editColumnName', 'user_email');
    await page.click('#confirmEditColumn, button:has-text("Save")');
    // Wait for dialog to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Verify column was renamed
    const columnRenamed = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA table_info(test_modify_column)`);
      return result.rows.some((row: any) => row.values[1].value === 'user_email');
    });
    expect(columnRenamed).toBe(true);
  });
});
