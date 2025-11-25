import { test, expect } from '@playwright/test';

test.describe('Table Designer - Drop Table E2E', () => {
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
      
      // Create test tables
      try {
        await db.execute(`DROP TABLE IF EXISTS test_drop_table`);
        await db.execute(`DROP TABLE IF EXISTS test_drop_empty`);
      } catch (e) {
        // Tables might not exist
      }
      
      await db.execute(`
        CREATE TABLE test_drop_table (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          age INTEGER
        )
      `);
      
      await db.execute(`
        CREATE TABLE test_drop_empty (
          id INTEGER PRIMARY KEY
        )
      `);
      
      // Create an index
      await db.execute(`CREATE INDEX idx_name ON test_drop_table (name)`);
      
      // Insert test data
      await db.execute(`
        INSERT INTO test_drop_table (name, email, age) 
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
    await page.locator('[role="option"]').filter({ hasText: 'test_drop_table' }).click();
    await page.waitForTimeout(1000);
  });

  test('should show Drop Table button', async ({ page }) => {
    // Should see Drop Table button
    await expect(page.locator('button:has-text("Drop Table")')).toBeVisible();
  });

  test('should open Drop Table confirmation dialog when button is clicked', async ({ page }) => {
    // Click Drop Table button
    await page.click('button:has-text("Drop Table")');
    
    // Wait for dialog to appear
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should see dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Should see drop/delete title
    await expect(page.locator('[role="dialog"] >> text=/drop.*table|delete.*table/i').first()).toBeVisible();
  });

  test('should show table name in confirmation dialog', async ({ page }) => {
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should see the table name
    await expect(page.locator('[role="dialog"] >> text=test_drop_table')).toBeVisible();
  });

  test('should show warning about data loss', async ({ page }) => {
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should see warning message in the destructive box
    const warningBox = page.locator('.border-destructive').filter({ hasText: 'permanently deleted' });
    await expect(warningBox).toBeVisible();
  });

  test('should close dialog when Cancel is clicked', async ({ page }) => {
    await page.click('button:has-text("Drop Table")');
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

  test('should not drop table when Cancel is clicked', async ({ page }) => {
    // Try to drop but cancel
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(700);
    
    // Verify table still exists in database
    const tableExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='test_drop_table'
      `);
      return result.rows.length > 0;
    });
    expect(tableExists).toBe(true);
  });

  test('should drop table successfully', async ({ page }) => {
    // Open dialog
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Confirm drop
    await page.click('#confirmDropTable', { force: true });
    await page.waitForTimeout(1500);
    
    // Verify table was dropped in database
    const tableExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='test_drop_table'
      `);
      return result.rows.length > 0;
    });
    expect(tableExists).toBe(false);
  });

  test('should remove table from selector after drop', async ({ page }) => {
    // Drop table
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('#confirmDropTable', { force: true });
    await page.waitForTimeout(1500);
    
    // Open table selector
    await page.click('[data-slot="select-trigger"]');
    await page.waitForTimeout(500);
    
    // Should not see the dropped table
    const droppedTableOption = page.locator('[role="option"]').filter({ hasText: 'test_drop_table' });
    const count = await droppedTableOption.count();
    expect(count).toBe(0);
  });

  test('should automatically select another table after drop', async ({ page }) => {
    // Drop table
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('#confirmDropTable', { force: true });
    await page.waitForTimeout(1500);
    
    // Should have another table selected (or show no table selected)
    const selectValue = await page.locator('[data-slot="select-trigger"]').textContent();
    expect(selectValue).not.toContain('test_drop_table');
  });

  test('should drop empty table', async ({ page }) => {
    // Switch to empty table
    await page.click('[data-slot="select-trigger"]');
    await page.waitForTimeout(300);
    await page.locator('[role="option"]').filter({ hasText: 'test_drop_empty' }).click();
    await page.waitForTimeout(1000);
    
    // Drop table
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('#confirmDropTable', { force: true });
    await page.waitForTimeout(1500);
    
    // Verify table was dropped
    const tableExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='test_drop_empty'
      `);
      return result.rows.length > 0;
    });
    expect(tableExists).toBe(false);
  });

  test('should drop table with indexes', async ({ page }) => {
    // Drop table (which has idx_name index)
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('#confirmDropTable', { force: true });
    await page.waitForTimeout(1500);
    
    // Verify table and its indexes are dropped
    const indexExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`
        SELECT name FROM sqlite_master 
        WHERE type='index' AND name='idx_name'
      `);
      return result.rows.length > 0;
    });
    expect(indexExists).toBe(false);
  });

  test('should show success message after dropping table', async ({ page }) => {
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('#confirmDropTable', { force: true });
    await page.waitForTimeout(1500);
    
    // Should see success message
    await expect(page.locator('text=/dropped.*successfully|success/i')).toBeVisible();
  });

  test('should show row count warning in dialog', async ({ page }) => {
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should see row count or data warning
    const dialogText = await page.locator('[role="dialog"]').textContent();
    expect(dialogText).toMatch(/row|data|column/i);
  });

  test('should clear table structure display after drop', async ({ page }) => {
    // Drop table
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('#confirmDropTable', { force: true });
    await page.waitForTimeout(1500);
    
    // If no tables remain, should not show column/index sections
    // Or should show a different table
    const hasSelectedTable = await page.locator('[data-table-title]').isVisible().catch(() => false);
    
    if (hasSelectedTable) {
      // Another table was auto-selected
      const titleText = await page.locator('[data-table-title]').textContent();
      expect(titleText).not.toContain('test_drop_table');
    }
  });

  test('should handle dropping last table gracefully', async ({ page }) => {
    // Drop all test tables one by one
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      // Get all user tables
      const result = await db.execute(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);
      
      // Drop all except our test tables (they'll be dropped via UI)
      for (const row of result.rows) {
        const tableName = row.values[0].value;
        if (tableName !== 'test_drop_table' && tableName !== 'test_drop_empty') {
          try {
            await db.execute(`DROP TABLE IF EXISTS ${tableName}`);
          } catch (e) {}
        }
      }
    });
    
    await page.click('#refreshTables');
    await page.waitForTimeout(1000);
    
    // Drop first table
    await page.click('[data-slot="select-trigger"]');
    await page.waitForTimeout(300);
    await page.locator('[role="option"]').filter({ hasText: 'test_drop_table' }).click();
    await page.waitForTimeout(1000);
    
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('#confirmDropTable', { force: true });
    await page.waitForTimeout(1500);
    
    // Drop second table
    await page.click('[data-slot="select-trigger"]');
    await page.waitForTimeout(300);
    await page.locator('[role="option"]').filter({ hasText: 'test_drop_empty' }).click();
    await page.waitForTimeout(1000);
    
    await page.click('button:has-text("Drop Table")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('#confirmDropTable', { force: true });
    await page.waitForTimeout(1500);
    
    // Should show appropriate message (no tables selected or placeholder)
    const selectTrigger = page.locator('[data-slot="select-trigger"]');
    await expect(selectTrigger).toBeVisible();
    const triggerText = await selectTrigger.textContent();
    expect(triggerText).toMatch(/select.*table/i);
  });
});
