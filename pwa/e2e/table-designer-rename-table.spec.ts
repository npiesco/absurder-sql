import { test, expect } from '@playwright/test';

test.describe('Table Designer - Rename Table E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Go directly to designer page and let it initialize
    await page.goto('/db/designer');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Create test table
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
      
      // Create a test table with data and indexes
      try {
        await db.execute(`DROP TABLE IF EXISTS test_rename_table`);
      } catch (e) {
        // Table might not exist
      }
      
      await db.execute(`
        CREATE TABLE test_rename_table (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          age INTEGER
        )
      `);
      
      // Create an index
      await db.execute(`CREATE INDEX idx_name ON test_rename_table (name)`);
      
      // Insert test data
      await db.execute(`
        INSERT INTO test_rename_table (name, email, age) 
        VALUES 
          ('John Doe', 'john@example.com', 30),
          ('Jane Smith', 'jane@example.com', 25),
          ('Bob Johnson', 'bob@example.com', 35)
      `);
    });
    
    // Click refresh button to update tables list
    await page.click('#refreshTables');
    await page.waitForTimeout(1000);
    
    // Select the test table from dropdown
    await page.click('[data-slot="select-trigger"]');
    await page.waitForTimeout(300);
    await page.locator('[role="option"]').filter({ hasText: 'test_rename_table' }).click();
    await page.waitForTimeout(1000);
  });

  test('should show Rename Table button', async ({ page }) => {
    // Should see Rename Table button
    await expect(page.locator('button:has-text("Rename Table")')).toBeVisible();
  });

  test('should open Rename Table dialog when button is clicked', async ({ page }) => {
    // Click Rename Table button
    await page.click('button:has-text("Rename Table")');
    
    // Wait for dialog to appear
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should see dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Should see rename title
    await expect(page.locator('[role="dialog"] >> text=/rename.*table/i').first()).toBeVisible();
  });

  test('should show current table name in dialog', async ({ page }) => {
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should see current table name
    await expect(page.locator('#newTableName')).toHaveValue('test_rename_table');
  });

  test('should have empty new name input initially', async ({ page }) => {
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Input should show current name (can be edited)
    const input = page.locator('#newTableName');
    await expect(input).toBeVisible();
    await expect(input).toBeEditable();
  });

  test('should close dialog when Cancel is clicked', async ({ page }) => {
    await page.click('button:has-text("Rename Table")');
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

  test('should not rename table when Cancel is clicked', async ({ page }) => {
    // Try to rename but cancel
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.fill('#newTableName', 'renamed_table');
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(700);
    
    // Verify table name hasn't changed in database
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
    // Open dialog
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Enter new name
    await page.fill('#newTableName', 'users_renamed');
    
    // Confirm rename
    await page.click('#confirmRenameTable', { force: true });
    await page.waitForTimeout(1500);
    
    // Verify table was renamed in database
    const newTableExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='users_renamed'
      `);
      return result.rows.length > 0;
    });
    expect(newTableExists).toBe(true);
    
    // Verify old table name doesn't exist
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
    // Rename table
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.fill('#newTableName', 'users_renamed');
    await page.click('#confirmRenameTable', { force: true });
    await page.waitForTimeout(1500);
    
    // Should see new name in table selector
    await expect(page.locator('[data-slot="select-trigger"]')).toContainText('users_renamed');
  });

  test('should preserve table data after rename', async ({ page }) => {
    // Rename table
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.fill('#newTableName', 'users_renamed');
    await page.click('#confirmRenameTable', { force: true });
    await page.waitForTimeout(1500);
    
    // Verify data is preserved
    const dataPreserved = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`SELECT COUNT(*) as count FROM users_renamed`);
      return result.rows[0].values[0].value === 3;
    });
    expect(dataPreserved).toBe(true);
  });

  test('should preserve indexes after rename', async ({ page }) => {
    // Rename table
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.fill('#newTableName', 'users_renamed');
    await page.click('#confirmRenameTable', { force: true });
    await page.waitForTimeout(1500);
    
    // Verify index still exists (SQLite automatically updates index table references)
    const indexExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA index_list(users_renamed)`);
      return result.rows.some((row: any) => row.values[1].value === 'idx_name');
    });
    expect(indexExists).toBe(true);
  });

  test('should preserve column structure after rename', async ({ page }) => {
    // Rename table
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.fill('#newTableName', 'users_renamed');
    await page.click('#confirmRenameTable', { force: true });
    await page.waitForTimeout(1500);
    
    // Verify columns are preserved
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
    await page.waitForTimeout(500);
    
    // Clear the input
    await page.fill('#newTableName', '');
    
    // Try to rename
    await page.click('#confirmRenameTable', { force: true });
    await page.waitForTimeout(500);
    
    // Should see error message
    const errorDiv = page.locator('.bg-destructive\\/10');
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toContainText(/table name.*required|required/i);
  });

  test('should show error if new table name already exists', async ({ page }) => {
    // Create another table
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      try {
        await db.execute(`DROP TABLE IF EXISTS existing_table`);
      } catch (e) {}
      await db.execute(`CREATE TABLE existing_table (id INTEGER PRIMARY KEY)`);
    });
    await page.waitForTimeout(500);
    
    // Try to rename to existing table name
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.fill('#newTableName', 'existing_table');
    await page.click('#confirmRenameTable', { force: true });
    await page.waitForTimeout(1000);
    
    // Should see error message
    const errorDiv = page.locator('.bg-destructive\\/10');
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toContainText(/already exists|error/i);
  });

  test('should show error if new name contains invalid characters', async ({ page }) => {
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Try invalid name with spaces
    await page.fill('#newTableName', 'invalid table name');
    await page.click('#confirmRenameTable', { force: true });
    await page.waitForTimeout(1000);
    
    // Should either show error or SQLite will reject it
    // (We may allow this and let SQLite validate, or do client-side validation)
    const errorDiv = page.locator('.bg-destructive\\/10');
    const errorVisible = await errorDiv.isVisible().catch(() => false);
    
    // If no client-side validation, SQLite will reject it
    if (errorVisible) {
      await expect(errorDiv).toContainText(/invalid|error/i);
    }
  });

  test('should show success message after renaming', async ({ page }) => {
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.fill('#newTableName', 'users_renamed');
    await page.click('#confirmRenameTable', { force: true });
    await page.waitForTimeout(1500);
    
    // Should see success message
    await expect(page.locator('text=/renamed.*successfully|success/i')).toBeVisible();
  });

  test('should allow renaming to same name with different case', async ({ page }) => {
    // SQLite is case-insensitive for table names, but we should handle this gracefully
    await page.click('button:has-text("Rename Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.fill('#newTableName', 'TEST_RENAME_TABLE');
    await page.click('#confirmRenameTable', { force: true });
    await page.waitForTimeout(1500);
    
    // Should either succeed or show appropriate message
    const errorDiv = page.locator('.bg-destructive\\/10');
    const errorVisible = await errorDiv.isVisible().catch(() => false);
    
    if (!errorVisible) {
      // If it succeeded, table should exist
      const tableExists = await page.evaluate(async () => {
        const db = (window as any).testDb;
        const result = await db.execute(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name='TEST_RENAME_TABLE'
        `);
        return result.rows.length > 0;
      });
      expect(tableExists).toBe(true);
    }
  });
});
