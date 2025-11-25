import { test, expect } from '@playwright/test';

test.describe('Table Designer - Add Column E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Go directly to designer page and let it initialize
    await page.goto('/db/designer');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Create test table in the active database context
    await page.evaluate(async () => {
      // Wait for testDb to be set by the page
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
        await db.execute(`DROP TABLE IF EXISTS test_add_column`);
      } catch (e) {
        // Table might not exist, that's ok
      }
      
      await db.execute(`
        CREATE TABLE test_add_column (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL
        )
      `);
    });
    
    // Click refresh button to update tables list
    await page.click('#refreshTables');
    await page.waitForTimeout(500);
  });

  test('should open Add Column dialog when Add Column button is clicked', async ({ page }) => {
    // Click Add Column button
    await page.click('#addColumn');
    
    // Wait for dialog to be visible and animations to complete
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should see dialog title
    await expect(page.locator('[role="dialog"] >> text=/add.*column/i').first()).toBeVisible();
  });

  test('should show column name input in Add Column dialog', async ({ page }) => {
    await page.click('#addColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should see column name input
    await expect(page.locator('#columnName')).toBeVisible();
  });

  test('should show data type selector in Add Column dialog', async ({ page }) => {
    await page.click('#addColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should see data type selector
    await expect(page.locator('#columnType')).toBeVisible();
  });

  test('should show constraint checkboxes in Add Column dialog', async ({ page }) => {
    await page.click('#addColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should see NOT NULL checkbox
    await expect(page.locator('#notNull')).toBeVisible();
    
    // Should see UNIQUE checkbox
    await expect(page.locator('#unique')).toBeVisible();
  });

  test('should show default value input in Add Column dialog', async ({ page }) => {
    await page.click('#addColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should see default value input
    await expect(page.locator('#defaultValue')).toBeVisible();
  });

  test('should add a new TEXT column to the table', async ({ page }) => {
    // Click Add Column button
    await page.click('#addColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Fill in column details
    await page.fill('#columnName', 'email');
    
    // Select TEXT type
    await page.click('#columnType');
    await page.waitForTimeout(300);
    await page.click('[role="option"]:has-text("TEXT")');
    await page.waitForTimeout(200);
    
    // Click Add button
    await page.click('#confirmAddColumn');
    await page.waitForTimeout(1500);
    
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
    await page.waitForTimeout(500);
    
    // Fill in column details
    await page.fill('#columnName', 'age');
    
    // Select INTEGER type
    await page.click('#columnType');
    await page.waitForTimeout(300);
    await page.click('[role="option"]:has-text("INTEGER")');
    await page.waitForTimeout(200);
    
    // Check NOT NULL
    await page.click('#notNull');
    await page.waitForTimeout(200);
    
    // Click Add button
    await page.click('#confirmAddColumn');
    await page.waitForTimeout(1500);
    
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
    await page.waitForTimeout(500);
    
    // Fill in column details
    await page.fill('#columnName', 'price');
    
    // Select REAL type
    await page.click('#columnType');
    await page.waitForTimeout(300);
    await page.click('[role="option"]:has-text("REAL")');
    await page.waitForTimeout(200);
    
    // Set default value
    await page.fill('#defaultValue', '0.0');
    
    // Click Add button
    await page.click('#confirmAddColumn');
    await page.waitForTimeout(1500);
    
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
    await page.waitForTimeout(500);
    
    // Fill in column details
    await page.fill('#columnName', 'username');
    
    // Select TEXT type
    await page.click('#columnType');
    await page.waitForTimeout(300);
    await page.click('[role="option"]:has-text("TEXT")');
    await page.waitForTimeout(200);
    
    // Check UNIQUE
    await page.click('#unique');
    await page.waitForTimeout(200);
    
    // Click Add button
    await page.click('#confirmAddColumn');
    await page.waitForTimeout(1500);
    
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
    await page.waitForTimeout(500);
    
    // Leave column name empty
    
    // Select a type
    await page.click('#columnType');
    await page.waitForTimeout(300);
    await page.click('[role="option"]:has-text("TEXT")');
    await page.waitForTimeout(200);
    
    // Try to add
    await page.click('#confirmAddColumn');
    await page.waitForTimeout(500);
    
    // Should see error message
    await expect(page.locator('text=/column name.*required|required.*column name/i')).toBeVisible();
  });

  test('should close dialog when Cancel is clicked', async ({ page }) => {
    await page.click('#addColumn');
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

  test('should update column count after adding a column', async ({ page }) => {
    // Initial count should be 2 columns
    await expect(page.locator('text=/2.*columns?/i')).toBeVisible();
    
    // Add a column
    await page.click('#addColumn');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.fill('#columnName', 'status');
    await page.click('#columnType');
    await page.waitForTimeout(300);
    await page.click('[role="option"]:has-text("TEXT")');
    await page.waitForTimeout(200);
    await page.click('#confirmAddColumn');
    await page.waitForTimeout(1500);
    
    // Count should now be 3 columns
    await expect(page.locator('text=/3.*columns?/i')).toBeVisible();
  });
});
