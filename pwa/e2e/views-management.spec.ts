import { test, expect } from '@playwright/test';

test.describe('Views Management E2E', () => {
  // Unique database name per test run to avoid parallel test conflicts
  const testDbName = `views-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.db`;

  test.beforeEach(async ({ page }) => {
    await page.goto('/db/views');
    await page.waitForLoadState('networkidle');

    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });

    await page.evaluate(async (dbName) => {
      const Database = (window as any).Database;
      const testDb = await Database.newDatabase(dbName);
      await testDb.allowNonLeaderWrites(true);
      (window as any).testDb = testDb;
      (window as any).testDbName = dbName;

      // Create test tables
      try {
        await testDb.execute(`DROP TABLE IF EXISTS test_users`);
        await testDb.execute(`DROP TABLE IF EXISTS test_orders`);
        await testDb.execute(`DROP VIEW IF EXISTS test_user_view`);
        await testDb.execute(`DROP VIEW IF EXISTS test_active_users`);
      } catch (e) {}

      await testDb.execute(`
        CREATE TABLE test_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          active INTEGER DEFAULT 1
        )
      `);

      await testDb.execute(`
        CREATE TABLE test_orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          amount REAL,
          FOREIGN KEY (user_id) REFERENCES test_users(id)
        )
      `);

      await testDb.execute(`
        INSERT INTO test_users (name, email, active)
        VALUES
          ('John Doe', 'john@example.com', 1),
          ('Jane Smith', 'jane@example.com', 1),
          ('Bob Johnson', 'bob@example.com', 0)
      `);

      await testDb.execute(`
        INSERT INTO test_orders (user_id, amount)
        VALUES
          (1, 100.50),
          (1, 200.00),
          (2, 150.75)
      `);

      await testDb.execute(`
        CREATE VIEW test_user_view AS
        SELECT id, name, email FROM test_users
      `);

      await testDb.execute(`
        CREATE VIEW test_active_users AS
        SELECT * FROM test_users WHERE active = 1
      `);

      await testDb.sync();
    }, testDbName);

    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      const dbName = (window as any).testDbName;
      if (db) { try { await db.close(); } catch {} }
      if (dbName) { try { await indexedDB.deleteDatabase(dbName); } catch {} }
    }).catch(() => {});
  });

  test('should navigate to views page', async ({ page }) => {
    await expect(page).toHaveURL(/\/db\/views/);
  });

  test('should show Views Management heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/views/i);
  });

  test('should have views in database', async ({ page }) => {
    const viewCount = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`SELECT COUNT(*) as count FROM sqlite_master WHERE type='view'`);
      return result.rows[0].values[0].value;
    });
    expect(viewCount).toBe(2);
  });

  test('should list views via SQL', async ({ page }) => {
    const views = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`SELECT name FROM sqlite_master WHERE type='view' ORDER BY name`);
      return result.rows.map((r: any) => r.values[0].value);
    });
    expect(views).toContain('test_active_users');
    expect(views).toContain('test_user_view');
  });

  test('should show Create View button', async ({ page }) => {
    await expect(page.locator('button:has-text("Create View")')).toBeVisible();
  });

  test('should open Create View dialog when button is clicked', async ({ page }) => {
    await page.click('button:has-text("Create View")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('[role="dialog"] >> text=/create.*view/i').first()).toBeVisible();
  });

  test('should have view name input in create dialog', async ({ page }) => {
    await page.click('button:has-text("Create View")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await expect(page.locator('#viewName')).toBeVisible();
  });

  test('should have SQL editor in create dialog', async ({ page }) => {
    await page.click('button:has-text("Create View")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await expect(page.locator('#viewSQL')).toBeVisible();
  });

  test('should create new view via SQL', async ({ page }) => {
    const created = await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute(`CREATE VIEW test_new_view AS SELECT name, email FROM test_users WHERE active = 1`);
      const result = await db.execute(`SELECT name FROM sqlite_master WHERE type='view' AND name='test_new_view'`);
      return result.rows.length > 0;
    });
    expect(created).toBe(true);
  });

  test('should query view data', async ({ page }) => {
    const data = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`SELECT * FROM test_user_view`);
      return result.rows.length;
    });
    expect(data).toBe(3);
  });

  test('should query filtered view', async ({ page }) => {
    const data = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`SELECT * FROM test_active_users`);
      return result.rows.map((r: any) => r.values[1].value);
    });
    expect(data).toContain('John Doe');
    expect(data).toContain('Jane Smith');
    expect(data).not.toContain('Bob Johnson');
  });

  test('should drop view via SQL', async ({ page }) => {
    const dropped = await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute(`DROP VIEW test_user_view`);
      const result = await db.execute(`SELECT name FROM sqlite_master WHERE type='view' AND name='test_user_view'`);
      return result.rows.length === 0;
    });
    expect(dropped).toBe(true);
  });

  test('should update view count after drop', async ({ page }) => {
    const countAfter = await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute(`DROP VIEW test_user_view`);
      const result = await db.execute(`SELECT COUNT(*) as count FROM sqlite_master WHERE type='view'`);
      return result.rows[0].values[0].value;
    });
    expect(countAfter).toBe(1);
  });

  test('should show error for invalid view SQL', async ({ page }) => {
    const error = await page.evaluate(async () => {
      const db = (window as any).testDb;
      try {
        await db.execute(`CREATE VIEW bad_view AS INVALID SQL SYNTAX`);
        return null;
      } catch (e: any) {
        return e.message || 'error';
      }
    });
    expect(error).not.toBeNull();
  });

  test('should show error for duplicate view name', async ({ page }) => {
    const error = await page.evaluate(async () => {
      const db = (window as any).testDb;
      try {
        await db.execute(`CREATE VIEW test_user_view AS SELECT * FROM test_users`);
        return null;
      } catch (e: any) {
        return e.message || 'error';
      }
    });
    expect(error).not.toBeNull();
  });

  test('should close create dialog when Cancel is clicked', async ({ page }) => {
    await page.click('button:has-text("Create View")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await page.click('button:has-text("Cancel")');

    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should handle empty views list', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute(`DROP VIEW IF EXISTS test_user_view`);
      await db.execute(`DROP VIEW IF EXISTS test_active_users`);
    });

    const count = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`SELECT COUNT(*) as count FROM sqlite_master WHERE type='view'`);
      return result.rows[0].values[0].value;
    });
    expect(count).toBe(0);
  });

  test('should recreate dropped view', async ({ page }) => {
    const recreated = await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute(`DROP VIEW test_user_view`);
      await db.execute(`CREATE VIEW test_user_view AS SELECT name FROM test_users`);
      const result = await db.execute(`SELECT * FROM test_user_view`);
      return result.rows.length;
    });
    expect(recreated).toBe(3);
  });

  test('should view SQL definition', async ({ page }) => {
    const sql = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`SELECT sql FROM sqlite_master WHERE type='view' AND name='test_user_view'`);
      return result.rows[0].values[0].value;
    });
    expect(sql).toContain('SELECT');
    expect(sql).toContain('test_users');
  });
});
