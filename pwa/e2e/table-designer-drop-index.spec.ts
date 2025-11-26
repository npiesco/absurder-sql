import { test, expect } from '@playwright/test';

test.describe('Table Designer - Drop Index E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/db/designer');
    await page.waitForLoadState('networkidle');

    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });

    await page.evaluate(async () => {
      const Database = (window as any).Database;
      const testDb = await Database.newDatabase('designer-drop-index-test-db');
      await testDb.allowNonLeaderWrites(true);
      (window as any).testDb = testDb;

      await testDb.execute(`DROP TABLE IF EXISTS test_drop_index`);
      await testDb.execute(`
        CREATE TABLE test_drop_index (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT,
          age INTEGER,
          city TEXT
        )
      `);
      await testDb.execute(`CREATE INDEX idx_email ON test_drop_index (email)`);
      await testDb.execute(`CREATE UNIQUE INDEX idx_unique_name ON test_drop_index (name)`);
      await testDb.execute(`CREATE INDEX idx_location ON test_drop_index (city, age)`);
      await testDb.execute(`
        INSERT INTO test_drop_index (name, email, age, city)
        VALUES
          ('John Doe', 'john@example.com', 30, 'New York'),
          ('Jane Smith', 'jane@example.com', 25, 'London')
      `);
    });

    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
    await page.click('#refreshTables');
    await page.waitForSelector('[data-slot="select-trigger"]', { state: 'visible' });
    await page.click('[data-slot="select-trigger"]');
    await page.waitForSelector('[role="option"]', { state: 'visible' });
    await page.locator('[role="option"]').filter({ hasText: 'test_drop_index' }).click();
    await page.waitForSelector('button[data-index-name]', { state: 'visible' });
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db) { try { await db.close(); } catch {} }
      try { await indexedDB.deleteDatabase('designer-drop-index-test-db'); } catch {}
    }).catch(() => {});
  });

  test('should show Delete button for each index', async ({ page }) => {
    const deleteButtons = page.locator('button[data-index-name]');
    const count = await deleteButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should open confirmation dialog when Delete button is clicked', async ({ page }) => {
    await page.locator('button[data-index-name="idx_email"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('[role="dialog"] >> text=/drop.*index|delete.*index/i').first()).toBeVisible();
  });

  test('should show index name in confirmation dialog', async ({ page }) => {
    await page.locator('button[data-index-name="idx_email"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await expect(page.locator('[role="dialog"] >> text=idx_email')).toBeVisible();
  });

  test('should show warning about irreversible action', async ({ page }) => {
    await page.locator('button[data-index-name="idx_email"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    const warningBox = page.locator('.bg-muted').filter({ hasText: 'permanent and cannot be undone' });
    await expect(warningBox).toBeVisible();
  });

  test('should close dialog when Cancel is clicked', async ({ page }) => {
    await page.locator('button[data-index-name="idx_email"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should not delete index when Cancel is clicked', async ({ page }) => {
    await page.locator('button[data-index-name="idx_email"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('button:has-text("Cancel")');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    const indexExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA index_list(test_drop_index)`);
      return result.rows.some((row: any) => row.values[1].value === 'idx_email');
    });
    expect(indexExists).toBe(true);
  });

  test('should delete index when confirmed', async ({ page }) => {
    await page.locator('button[data-index-name="idx_email"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('#confirmDropIndex', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    const indexExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA index_list(test_drop_index)`);
      return result.rows.some((row: any) => row.values[1].value === 'idx_email');
    });
    expect(indexExists).toBe(false);
  });

  test('should remove index from UI after deletion', async ({ page }) => {
    await page.locator('button[data-index-name="idx_email"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('#confirmDropIndex', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    await expect(page.locator('table').locator('td:has-text("idx_email")')).not.toBeVisible();
  });

  test('should update index count after deletion', async ({ page }) => {
    const initialText = await page.locator('text=/\\d+\\s+(index|indexes)/i').first().textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');

    await page.locator('button[data-index-name="idx_email"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('#confirmDropIndex', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Wait for count to update
    await expect(page.locator(`text=/${initialCount - 1}\\s+(index|indexes)/i`)).toBeVisible();
  });

  test('should preserve table data when dropping index', async ({ page }) => {
    await page.locator('button[data-index-name="idx_email"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('#confirmDropIndex', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    const dataPreserved = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`SELECT COUNT(*) as count FROM test_drop_index`);
      return result.rows[0].values[0].value === 2;
    });
    expect(dataPreserved).toBe(true);
  });

  test('should delete UNIQUE index', async ({ page }) => {
    await page.locator('button[data-index-name="idx_unique_name"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('#confirmDropIndex', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    const indexExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA index_list(test_drop_index)`);
      return result.rows.some((row: any) => row.values[1].value === 'idx_unique_name');
    });
    expect(indexExists).toBe(false);
  });

  test('should delete multi-column index', async ({ page }) => {
    await page.locator('button[data-index-name="idx_location"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('#confirmDropIndex', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    const indexExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA index_list(test_drop_index)`);
      return result.rows.some((row: any) => row.values[1].value === 'idx_location');
    });
    expect(indexExists).toBe(false);
  });

  test('should show success message after dropping index', async ({ page }) => {
    await page.locator('button[data-index-name="idx_email"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.click('#confirmDropIndex', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    await expect(page.locator('text="idx_email" dropped successfully')).toBeVisible();
  });

  test('should be able to drop all indexes', async ({ page }) => {
    const initialText = await page.locator('text=/\\d+\\s+(index|indexes)/i').first().textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');

    for (let i = 0; i < initialCount; i++) {
      const firstDeleteBtn = page.locator('button[data-index-name]').first();
      await firstDeleteBtn.click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      await page.click('#confirmDropIndex', { force: true });
      await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
    }

    await expect(page.locator('text=/no.*indexes/i')).toBeVisible();
  });

  test('should show correct index type (UNIQUE vs INDEX) before deletion', async ({ page }) => {
    const uniqueRow = page.locator('tr:has-text("idx_unique_name")');
    await expect(uniqueRow.locator('.bg-primary').filter({ hasText: 'UNIQUE' })).toBeVisible();

    const regularRow = page.locator('tr:has-text("idx_email")');
    const regularBadge = regularRow.locator('.bg-primary').filter({ hasText: 'UNIQUE' });
    const badgeCount = await regularBadge.count();
    expect(badgeCount).toBe(0);
  });
});
