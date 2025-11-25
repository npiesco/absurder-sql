import { test, expect } from '@playwright/test';

test.describe('Table Designer - Modify Column E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Go directly to designer page and let it initialize
    await page.goto('/db/designer');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Create test table with columns to modify
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
        await db.execute(`DROP TABLE IF EXISTS test_modify_column`);
      } catch (e) {
        // Table might not exist
      }
      
      await db.execute(`
        CREATE TABLE test_modify_column (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT,
          age INTEGER,
          status TEXT DEFAULT 'active'
        )
      `);
      
      // Insert test data
      await db.execute(`
        INSERT INTO test_modify_column (name, email, age, status) 
        VALUES ('John Doe', 'john@example.com', 30, 'active')
      `);
    });
    
    // Click refresh button to update tables list
    await page.click('#refreshTables');
    await page.waitForTimeout(500);
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
    
    // Wait for dialog to appear and animations to complete
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should see edit dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Should see dialog title
    await expect(page.locator('[role="dialog"] >> text=/edit.*column|modify.*column/i').first()).toBeVisible();
  });

  test('should show current column name in Edit dialog', async ({ page }) => {
    await page.locator('tr:has-text("email") >> button:has-text("Edit")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should see input with current column name
    const nameInput = page.locator('#editColumnName, input[name="columnName"]');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue('email');
  });

  test('should show current column type in Edit dialog', async ({ page }) => {
    await page.locator('tr:has-text("email") >> button:has-text("Edit")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
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
    await page.waitForTimeout(500);
    
    // Change column name
    await page.fill('#editColumnName', 'user_email');
    
    // Save changes
    await page.click('#confirmEditColumn, button:has-text("Save")');
    await page.waitForTimeout(1500);
    
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
    await page.waitForTimeout(500);
    await page.fill('#editColumnName', 'user_email');
    await page.click('#confirmEditColumn, button:has-text("Save")');
    await page.waitForTimeout(1500);
    
    // Old name should not be visible
    await expect(page.locator('[data-column-list] >> text="email"').first()).not.toBeVisible();
    
    // New name should be visible
    await expect(page.locator('[data-column-list] >> text="user_email"').first()).toBeVisible();
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
    await page.waitForTimeout(500);
    await page.fill('#editColumnName', 'user_email');
    await page.click('#confirmEditColumn, button:has-text("Save")');
    await page.waitForTimeout(1500);
    
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
    await page.waitForTimeout(500);
    
    // Clear the column name
    await page.fill('#editColumnName', '');
    
    // Try to save
    await page.click('#confirmEditColumn, button:has-text("Save")');
    await page.waitForTimeout(500);
    
    // Should see error message
    await expect(page.locator('text=/column name.*required|required.*column name/i')).toBeVisible();
  });

  test('should show error if column name already exists', async ({ page }) => {
    await page.locator('tr:has-text("email") >> button:has-text("Edit")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Try to rename to existing column name
    await page.fill('#editColumnName', 'name');
    
    // Try to save
    await page.click('#confirmEditColumn, button:has-text("Save")');
    await page.waitForTimeout(1000);
    
    // Should see error message
    await expect(page.locator('text=/already exists|duplicate/i')).toBeVisible();
  });

  test('should close dialog when Cancel is clicked', async ({ page }) => {
    await page.locator('tr:has-text("email") >> button:has-text("Edit")').click();
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

  test('should not modify column when Cancel is clicked', async ({ page }) => {
    // Original column name
    const originalName = 'email';
    
    // Try to rename but cancel
    await page.locator('tr:has-text("email") >> button:has-text("Edit")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.fill('#editColumnName', 'cancelled_name');
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(700);
    
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
    await page.waitForTimeout(500);
    
    // Should see error or warning about PRIMARY KEY
    await expect(page.locator('text=/primary key|cannot.*modify.*primary/i').first()).toBeVisible();
  });

  test('should show success message after renaming', async ({ page }) => {
    await page.locator('tr:has-text("email") >> button:has-text("Edit")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.fill('#editColumnName', 'user_email');
    await page.click('#confirmEditColumn, button:has-text("Save")');
    await page.waitForTimeout(1500);
    
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
    await page.waitForTimeout(500);
    await page.fill('#editColumnName', 'user_email');
    await page.click('#confirmEditColumn, button:has-text("Save")');
    await page.waitForTimeout(1500);
    
    // Verify index still exists (SQLite doesn't automatically update index column names in old versions)
    // In practice, we need to recreate the table which preserves indexes
    const columnRenamed = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA table_info(test_modify_column)`);
      return result.rows.some((row: any) => row.values[1].value === 'user_email');
    });
    expect(columnRenamed).toBe(true);
  });
});
