import { test, expect } from '@playwright/test';

test.describe('Table Designer - Create Index E2E', () => {
  // Unique database name per test run to avoid parallel test conflicts
  const testDbName = `designer-create-index-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.db`;

  test.beforeEach(async ({ page }) => {
    // Go directly to designer page and let it initialize
    await page.goto('/db/designer');
    await page.waitForLoadState('networkidle');

    // Wait for WASM to be ready
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });

    // Create database programmatically
    await page.evaluate(async (dbName) => {
      const Database = (window as any).Database;
      const testDb = await Database.newDatabase(dbName);
      await testDb.allowNonLeaderWrites(true);
      (window as any).testDb = testDb;
      (window as any).testDbName = dbName;

      // Create a test table
      await testDb.execute(`DROP TABLE IF EXISTS test_create_index`);
      await testDb.execute(`
        CREATE TABLE test_create_index (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT,
          age INTEGER,
          city TEXT,
          country TEXT
        )
      `);

      // Insert test data
      await testDb.execute(`
        INSERT INTO test_create_index (name, email, age, city, country)
        VALUES
          ('John Doe', 'john@example.com', 30, 'New York', 'USA'),
          ('Jane Smith', 'jane@example.com', 25, 'London', 'UK')
      `);
    }, testDbName);

    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });

    // Click refresh button to update tables list
    await page.click('#refreshTables');
    await page.waitForSelector('[data-slot="select-trigger"]', { state: 'visible' });

    // Select the test table from dropdown
    await page.click('[data-slot="select-trigger"]');
    await page.waitForSelector('[role="option"]', { state: 'visible' });
    await page.locator('[role="option"]').filter({ hasText: 'test_create_index' }).click();
    await page.waitForSelector('button:has-text("Add Index")', { state: 'visible' });
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

  test('should show Add Index button', async ({ page }) => {
    // Should see Add Index button in the indexes section
    await expect(page.locator('button:has-text("Add Index")')).toBeVisible();
  });

  test('should open Create Index dialog when Add Index button is clicked', async ({ page }) => {
    // Click Add Index button
    await page.click('button:has-text("Add Index")');

    // Wait for dialog to appear
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Should see create index dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Should see dialog title
    await expect(page.locator('[role="dialog"] >> text=/create.*index|add.*index/i').first()).toBeVisible();
  });

  test('should show index name input in dialog', async ({ page }) => {
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Should see index name input
    const nameInput = page.locator('#indexName, input[name="indexName"]');
    await expect(nameInput).toBeVisible();
  });

  test('should show column selection checkboxes', async ({ page }) => {
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Wait for checkboxes to appear
    await page.waitForSelector('input[type="checkbox"][data-column]', { state: 'visible' });

    // Should see column checkboxes label
    await expect(page.locator('label:has-text("Select Columns for Index")')).toBeVisible();

    // Should see at least one column checkbox (excluding id which is PRIMARY KEY)
    const checkboxes = page.locator('input[type="checkbox"][data-column]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show UNIQUE index checkbox', async ({ page }) => {
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Wait for UNIQUE checkbox to appear
    await page.waitForSelector('#indexUnique', { state: 'visible' });

    // Should see UNIQUE checkbox
    await expect(page.locator('#indexUnique')).toBeVisible();
    await expect(page.locator('label[for="indexUnique"]')).toBeVisible();
  });

  test('should create single-column index', async ({ page }) => {
    // Open dialog
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForSelector('input[type="checkbox"][data-column]', { state: 'visible' });

    // Enter index name
    await page.fill('#indexName', 'idx_email');

    // Select email column
    await page.click('input[type="checkbox"][data-column="email"]', { force: true });

    // Create index
    await page.click('#confirmCreateIndex', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Verify index was created in database
    const indexExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA index_list(test_create_index)`);
      return result.rows.some((row: any) => row.values[1].value === 'idx_email');
    });
    expect(indexExists).toBe(true);
  });

  test('should show created index in UI', async ({ page }) => {
    // Create index
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForSelector('input[type="checkbox"][data-column]', { state: 'visible' });
    await page.fill('#indexName', 'idx_name');
    await page.click('input[type="checkbox"][data-column="name"]', { force: true });
    await page.click('#confirmCreateIndex', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Should see index in the indexes list table
    await page.waitForSelector('table td:has-text("idx_name")', { state: 'visible' });
    await expect(page.locator('table').locator('td:has-text("idx_name")')).toBeVisible();
  });

  test('should create UNIQUE index', async ({ page }) => {
    // Open dialog
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForSelector('input[type="checkbox"][data-column]', { state: 'visible' });

    // Enter index name
    await page.fill('#indexName', 'idx_unique_email');

    // Select email column
    await page.click('input[type="checkbox"][data-column="email"]', { force: true });

    // Check UNIQUE checkbox
    await page.click('#indexUnique', { force: true });

    // Create index
    await page.click('#confirmCreateIndex', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Verify index is UNIQUE in database
    const isUnique = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA index_list(test_create_index)`);
      const idx = result.rows.find((row: any) => row.values[1].value === 'idx_unique_email');
      return idx && idx.values[2].value === 1; // unique flag
    });
    expect(isUnique).toBe(true);
  });

  test('should create multi-column index', async ({ page }) => {
    // Open dialog
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForSelector('input[type="checkbox"][data-column]', { state: 'visible' });

    // Enter index name
    await page.fill('#indexName', 'idx_location');

    // Select city and country columns
    await page.click('input[type="checkbox"][data-column="city"]', { force: true });
    await page.click('input[type="checkbox"][data-column="country"]', { force: true });

    // Create index
    await page.click('#confirmCreateIndex', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Verify multi-column index was created
    const indexExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA index_info(idx_location)`);
      return result.rows.length === 2; // Should have 2 columns
    });
    expect(indexExists).toBe(true);
  });

  test('should show error if index name is empty', async ({ page }) => {
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForSelector('input[type="checkbox"][data-column]', { state: 'visible' });

    // Select a column without entering name
    await page.click('input[type="checkbox"][data-column="email"]', { force: true });

    // Try to create
    await page.click('#confirmCreateIndex', { force: true });

    // Should see error message in the error div
    await page.waitForSelector('.bg-destructive\\/10', { state: 'visible' });
    const errorDiv = page.locator('.bg-destructive\\/10');
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toContainText(/index name.*required|required/i);
  });

  test('should show error if no columns selected', async ({ page }) => {
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForSelector('input[type="checkbox"][data-column]', { state: 'visible' });

    // Enter name but don't select columns
    await page.fill('#indexName', 'idx_test');

    // Try to create
    await page.click('#confirmCreateIndex', { force: true });

    // Should see error message in the error div
    await page.waitForSelector('.bg-destructive\\/10', { state: 'visible' });
    const errorDiv = page.locator('.bg-destructive\\/10');
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toContainText(/select.*column|column/i);
  });

  test('should show error if index name already exists', async ({ page }) => {
    // Create first index
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForSelector('input[type="checkbox"][data-column]', { state: 'visible' });
    await page.fill('#indexName', 'idx_duplicate');
    await page.click('input[type="checkbox"][data-column="email"]', { force: true });
    await page.click('#confirmCreateIndex', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Try to create index with same name
    await page.click('button:has-text("Add Index")', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForSelector('input[type="checkbox"][data-column]', { state: 'visible' });
    await page.fill('#indexName', 'idx_duplicate');
    await page.click('input[type="checkbox"][data-column="name"]', { force: true });
    await page.click('#confirmCreateIndex', { force: true });

    // Should see error message in the error div (SQLite gives generic error for duplicate index)
    await page.waitForSelector('.bg-destructive\\/10', { state: 'visible' });
    const errorDiv = page.locator('.bg-destructive\\/10');
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toContainText(/error creating index/i);
  });

  test('should close dialog when Cancel is clicked', async ({ page }) => {
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Dialog should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click cancel
    await page.click('button:has-text("Cancel")');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Dialog should be closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should not create index when Cancel is clicked', async ({ page }) => {
    // Try to create but cancel
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForSelector('input[type="checkbox"][data-column]', { state: 'visible' });
    await page.fill('#indexName', 'idx_cancelled');
    await page.click('input[type="checkbox"][data-column="email"]', { force: true });
    await page.click('button:has-text("Cancel")', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Verify index was NOT created in database
    const indexExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA index_list(test_create_index)`);
      return result.rows.some((row: any) => row.values[1].value === 'idx_cancelled');
    });
    expect(indexExists).toBe(false);
  });

  test('should show success message after creating index', async ({ page }) => {
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForSelector('input[type="checkbox"][data-column]', { state: 'visible' });
    await page.fill('#indexName', 'idx_success');
    await page.click('input[type="checkbox"][data-column="age"]', { force: true });
    await page.click('#confirmCreateIndex', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Should see success message in status area
    await page.waitForSelector('text="idx_success" created successfully', { state: 'visible' });
    await expect(page.locator('text="idx_success" created successfully')).toBeVisible();
  });

  test('should show index type badge (UNIQUE vs INDEX)', async ({ page }) => {
    // Create a UNIQUE index
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForSelector('input[type="checkbox"][data-column]', { state: 'visible' });
    await page.fill('#indexName', 'idx_unique_test');
    await page.click('input[type="checkbox"][data-column="email"]', { force: true });
    await page.click('#indexUnique', { force: true });
    await page.click('#confirmCreateIndex', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Wait for row to appear
    await page.waitForSelector('tr:has-text("idx_unique_test")', { state: 'visible' });

    // Should see UNIQUE badge in the row
    const row = page.locator('tr:has-text("idx_unique_test")');
    await expect(row.locator('.bg-primary').filter({ hasText: 'UNIQUE' })).toBeVisible();
  });

  test('should update index count after creating index', async ({ page }) => {
    // Get initial count
    const initialText = await page.locator('text=/\\d+\\s+(index|indexes)/i').first().textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');

    // Create index
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForSelector('input[type="checkbox"][data-column]', { state: 'visible' });
    await page.fill('#indexName', 'idx_count_test');
    await page.click('input[type="checkbox"][data-column="city"]', { force: true });
    await page.click('#confirmCreateIndex', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Wait for count to update
    await page.waitForSelector(`text=/${initialCount + 1}\\s+(index|indexes)/i`, { state: 'visible' });

    // Verify count increased
    const newText = await page.locator('text=/\\d+\\s+(index|indexes)/i').first().textContent();
    const newCount = parseInt(newText?.match(/\d+/)?.[0] || '0');
    expect(newCount).toBe(initialCount + 1);
  });
});
