import { test, expect } from '@playwright/test';

test.describe('Table Designer - Create Index E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Go directly to designer page and let it initialize
    await page.goto('/db/designer');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Create test table with columns
    await page.evaluate(async () => {
      let retries = 0;
      while (!(window as any).testDb && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        retries++;
      }
      
      const db = (window as any).testDb;
      if (!db) {
        throw new Error('Database not initialized after waiting');
      }
      
      // Create a test table
      try {
        await db.execute(`DROP TABLE IF EXISTS test_create_index`);
      } catch (e) {
        // Table might not exist
      }
      
      await db.execute(`
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
      await db.execute(`
        INSERT INTO test_create_index (name, email, age, city, country) 
        VALUES 
          ('John Doe', 'john@example.com', 30, 'New York', 'USA'),
          ('Jane Smith', 'jane@example.com', 25, 'London', 'UK')
      `);
    });
    
    // Click refresh button to update tables list
    await page.click('#refreshTables');
    await page.waitForTimeout(1000);
    
    // Select the test table from dropdown
    await page.click('[data-slot="select-trigger"]');
    await page.waitForTimeout(300);
    await page.locator('[role="option"]').filter({ hasText: 'test_create_index' }).click();
    await page.waitForTimeout(1000);
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
    await page.waitForTimeout(500);
    
    // Should see create index dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Should see dialog title
    await expect(page.locator('[role="dialog"] >> text=/create.*index|add.*index/i').first()).toBeVisible();
  });

  test('should show index name input in dialog', async ({ page }) => {
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should see index name input
    const nameInput = page.locator('#indexName, input[name="indexName"]');
    await expect(nameInput).toBeVisible();
  });

  test('should show column selection checkboxes', async ({ page }) => {
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(800);
    
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
    await page.waitForTimeout(800);
    
    // Should see UNIQUE checkbox
    await expect(page.locator('#indexUnique')).toBeVisible();
    await expect(page.locator('label[for="indexUnique"]')).toBeVisible();
  });

  test('should create single-column index', async ({ page }) => {
    // Open dialog
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(800);
    
    // Enter index name
    await page.fill('#indexName', 'idx_email');
    
    // Select email column  
    await page.click('input[type="checkbox"][data-column="email"]', { force: true });
    await page.waitForTimeout(200);
    
    // Create index
    await page.click('#confirmCreateIndex', { force: true });
    await page.waitForTimeout(1500);
    
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
    await page.waitForTimeout(800);
    await page.fill('#indexName', 'idx_name');
    await page.click('input[type="checkbox"][data-column="name"]', { force: true });
    await page.waitForTimeout(200);
    await page.click('#confirmCreateIndex', { force: true });
    await page.waitForTimeout(1500);
    
    // Should see index in the indexes list table
    await expect(page.locator('table').locator('td:has-text("idx_name")')).toBeVisible();
  });

  test('should create UNIQUE index', async ({ page }) => {
    // Open dialog
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(800);
    
    // Enter index name
    await page.fill('#indexName', 'idx_unique_email');
    
    // Select email column
    await page.click('input[type="checkbox"][data-column="email"]', { force: true });
    
    // Check UNIQUE checkbox
    await page.click('#indexUnique', { force: true });
    await page.waitForTimeout(200);
    
    // Create index
    await page.click('#confirmCreateIndex', { force: true });
    await page.waitForTimeout(1500);
    
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
    await page.waitForTimeout(800);
    
    // Enter index name
    await page.fill('#indexName', 'idx_location');
    
    // Select city and country columns
    await page.click('input[type="checkbox"][data-column="city"]', { force: true });
    await page.click('input[type="checkbox"][data-column="country"]', { force: true });
    await page.waitForTimeout(200);
    
    // Create index
    await page.click('#confirmCreateIndex', { force: true });
    await page.waitForTimeout(1500);
    
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
    await page.waitForTimeout(800);
    
    // Select a column without entering name
    await page.click('input[type="checkbox"][data-column="email"]', { force: true });
    await page.waitForTimeout(200);
    
    // Try to create
    await page.click('#confirmCreateIndex', { force: true });
    await page.waitForTimeout(500);
    
    // Should see error message in the error div
    const errorDiv = page.locator('.bg-destructive\\/10');
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toContainText(/index name.*required|required/i);
  });

  test('should show error if no columns selected', async ({ page }) => {
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(800);
    
    // Enter name but don't select columns
    await page.fill('#indexName', 'idx_test');
    
    // Try to create
    await page.click('#confirmCreateIndex', { force: true });
    await page.waitForTimeout(500);
    
    // Should see error message in the error div
    const errorDiv = page.locator('.bg-destructive\\/10');
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toContainText(/select.*column|column/i);
  });

  test('should show error if index name already exists', async ({ page }) => {
    // Create first index
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(800);
    await page.fill('#indexName', 'idx_duplicate');
    await page.click('input[type="checkbox"][data-column="email"]', { force: true });
    await page.waitForTimeout(200);
    await page.click('#confirmCreateIndex', { force: true });
    await page.waitForTimeout(1500);
    
    // Try to create index with same name
    await page.click('button:has-text("Add Index")', { force: true });
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(800);
    await page.fill('#indexName', 'idx_duplicate');
    await page.click('input[type="checkbox"][data-column="name"]', { force: true });
    await page.waitForTimeout(200);
    await page.click('#confirmCreateIndex', { force: true });
    await page.waitForTimeout(1000);
    
    // Should see error message in the error div (SQLite gives generic error for duplicate index)
    const errorDiv = page.locator('.bg-destructive\\/10');
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toContainText(/error creating index/i);
  });

  test('should close dialog when Cancel is clicked', async ({ page }) => {
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Dialog should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Click cancel
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(500);
    
    // Dialog should be closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should not create index when Cancel is clicked', async ({ page }) => {
    // Try to create but cancel
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(800);
    await page.fill('#indexName', 'idx_cancelled');
    await page.click('input[type="checkbox"][data-column="email"]', { force: true });
    await page.click('button:has-text("Cancel")', { force: true });
    await page.waitForTimeout(700);
    
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
    await page.waitForTimeout(800);
    await page.fill('#indexName', 'idx_success');
    await page.click('input[type="checkbox"][data-column="age"]', { force: true });
    await page.waitForTimeout(200);
    await page.click('#confirmCreateIndex', { force: true });
    await page.waitForTimeout(1500);
    
    // Should see success message in status area
    await expect(page.locator('text="idx_success" created successfully')).toBeVisible();
  });

  test('should show index type badge (UNIQUE vs INDEX)', async ({ page }) => {
    // Create a UNIQUE index
    await page.click('button:has-text("Add Index")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(800);
    await page.fill('#indexName', 'idx_unique_test');
    await page.click('input[type="checkbox"][data-column="email"]', { force: true });
    await page.click('#indexUnique', { force: true });
    await page.waitForTimeout(200);
    await page.click('#confirmCreateIndex', { force: true });
    await page.waitForTimeout(1500);
    
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
    await page.waitForTimeout(800);
    await page.fill('#indexName', 'idx_count_test');
    await page.click('input[type="checkbox"][data-column="city"]', { force: true });
    await page.waitForTimeout(200);
    await page.click('#confirmCreateIndex', { force: true });
    await page.waitForTimeout(1500);
    
    // Verify count increased
    const newText = await page.locator('text=/\\d+\\s+(index|indexes)/i').first().textContent();
    const newCount = parseInt(newText?.match(/\d+/)?.[0] || '0');
    expect(newCount).toBe(initialCount + 1);
  });
});
