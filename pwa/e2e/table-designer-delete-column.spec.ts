import { test, expect } from '@playwright/test';

test.describe('Table Designer - Delete Column E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/db/designer');
    await page.waitForLoadState('networkidle');

    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });

    await page.evaluate(async () => {
      const Database = (window as any).Database;
      const testDb = await Database.newDatabase('designer-delete-column-test-db');
      await testDb.allowNonLeaderWrites(true);
      (window as any).testDb = testDb;

      await testDb.execute(`DROP TABLE IF EXISTS test_delete_column`);
      await testDb.execute(`
        CREATE TABLE test_delete_column (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT,
          age INTEGER,
          salary REAL,
          notes TEXT,
          created_at TEXT
        )
      `);
      await testDb.execute(`
        INSERT INTO test_delete_column (name, email, age, salary, notes, created_at)
        VALUES ('John Doe', 'john@example.com', 30, 50000.00, 'Test user', '2024-01-01')
      `);
    });

    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
    await page.click('#refreshTables');
    await page.waitForSelector('[data-slot="select-trigger"]', { state: 'visible' });
    await page.click('[data-slot="select-trigger"]');
    await page.waitForSelector('[role="option"]', { state: 'visible' });
    await page.locator('[role="option"]').filter({ hasText: 'test_delete_column' }).click();
    await page.waitForSelector('button:has-text("Delete")', { state: 'visible' });
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db) { try { await db.close(); } catch {} }
      try { await indexedDB.deleteDatabase('designer-delete-column-test-db'); } catch {}
    }).catch(() => {});
  });

  test('should show Delete button for each column', async ({ page }) => {
    const deleteButtons = page.locator('button:has-text("Delete")');
    await expect(deleteButtons.first()).toBeVisible();

    const count = await deleteButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should open confirmation dialog when Delete button is clicked', async ({ page }) => {
    await page.locator('tr:has-text("notes") >> button:has-text("Delete")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('[role="dialog"] >> text=/delete.*column|remove.*column/i').first()).toBeVisible();
  });

  test('should show column name in confirmation dialog', async ({ page }) => {
    await page.locator('tr:has-text("email") >> button:has-text("Delete")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await expect(page.locator('[role="dialog"] >> text=email').first()).toBeVisible();
  });

  test('should show warning about data loss in confirmation dialog', async ({ page }) => {
    await page.locator('tr:has-text("age") >> button:has-text("Delete")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await expect(page.locator('[role="dialog"] >> text=/data.*lost|lose.*data|cannot.*undone/i').first()).toBeVisible();
  });

  test('should close dialog when Cancel is clicked', async ({ page }) => {
    await page.locator('tr:has-text("salary") >> button:has-text("Delete")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should not delete column when Cancel is clicked', async ({ page }) => {
    const columnsBefore = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA table_info(test_delete_column)`);
      return result.rows.length;
    });

    await page.locator('tr:has-text("notes") >> button:has-text("Delete")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('button:has-text("Cancel")');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    const columnsAfter = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA table_info(test_delete_column)`);
      return result.rows.length;
    });

    expect(columnsAfter).toBe(columnsBefore);
  });

  test('should delete column when confirmed', async ({ page }) => {
    const columnExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA table_info(test_delete_column)`);
      return result.rows.some((row: any) => row.values[1].value === 'notes');
    });
    expect(columnExists).toBe(true);

    await page.locator('tr:has-text("notes") >> button:has-text("Delete")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('#confirmDeleteColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    const columnDeleted = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA table_info(test_delete_column)`);
      return !result.rows.some((row: any) => row.values[1].value === 'notes');
    });
    expect(columnDeleted).toBe(true);
  });

  test('should remove column from UI after deletion', async ({ page }) => {
    await expect(page.locator('[data-column-list] >> text="notes"').first()).toBeVisible();

    await page.locator('tr:has-text("notes") >> button:has-text("Delete")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('#confirmDeleteColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    await expect(page.locator('text="notes"').first()).not.toBeVisible();
  });

  test('should update column count after deletion', async ({ page }) => {
    await expect(page.locator('text=/7.*columns?/i')).toBeVisible();

    await page.locator('tr:has-text("notes") >> button:has-text("Delete")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('#confirmDeleteColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    await expect(page.locator('text=/6.*columns?/i')).toBeVisible();
  });

  test('should preserve existing data in remaining columns after deletion', async ({ page }) => {
    const dataBefore = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`SELECT name, email, age FROM test_delete_column WHERE id = 1`);
      const row = result.rows[0];
      return {
        name: row.values[0].value,
        email: row.values[1].value,
        age: row.values[2].value
      };
    });

    await page.locator('tr:has-text("notes") >> button:has-text("Delete")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('#confirmDeleteColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    const dataAfter = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`SELECT name, email, age FROM test_delete_column WHERE id = 1`);
      const row = result.rows[0];
      return {
        name: row.values[0].value,
        email: row.values[1].value,
        age: row.values[2].value
      };
    });

    expect(dataAfter).toEqual(dataBefore);
  });

  test('should not allow deleting PRIMARY KEY column', async ({ page }) => {
    await page.locator('tr:has-text("id") >> button:has-text("Delete")').click();

    await expect(page.locator('text=/primary key|cannot.*delete.*primary/i').first()).toBeVisible();
  });

  test('should handle deletion of column with index', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute(`CREATE INDEX idx_email ON test_delete_column(email)`);
    });

    await page.locator('tr:has-text("email") >> button:has-text("Delete")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('#confirmDeleteColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    const columnDeleted = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA table_info(test_delete_column)`);
      return !result.rows.some((row: any) => row.values[1].value === 'email');
    });
    expect(columnDeleted).toBe(true);

    const indexRemoved = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA index_list(test_delete_column)`);
      return !result.rows.some((row: any) => row.values[1].value === 'idx_email');
    });
    expect(indexRemoved).toBe(true);
  });

  test('should show success message after deletion', async ({ page }) => {
    await page.locator('tr:has-text("notes") >> button:has-text("Delete")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('#confirmDeleteColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    await expect(page.locator('text=/column.*deleted|successfully.*deleted/i')).toBeVisible();
  });
});
