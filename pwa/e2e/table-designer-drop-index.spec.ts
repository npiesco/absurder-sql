import { test, expect } from '@playwright/test';

test.describe('Table Designer - Drop Index E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Go directly to designer page and let it initialize
    await page.goto('/db/designer');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Create test table with columns and indexes
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
        await db.execute(`DROP TABLE IF EXISTS test_drop_index`);
      } catch (e) {
        // Table might not exist
      }
      
      await db.execute(`
        CREATE TABLE test_drop_index (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT,
          age INTEGER,
          city TEXT
        )
      `);
      
      // Create some indexes
      await db.execute(`CREATE INDEX idx_email ON test_drop_index (email)`);
      await db.execute(`CREATE UNIQUE INDEX idx_unique_name ON test_drop_index (name)`);
      await db.execute(`CREATE INDEX idx_location ON test_drop_index (city, age)`);
      
      // Insert test data
      await db.execute(`
        INSERT INTO test_drop_index (name, email, age, city) 
        VALUES 
          ('John Doe', 'john@example.com', 30, 'New York'),
          ('Jane Smith', 'jane@example.com', 25, 'London')
      `);
    });
    
    // Click refresh button to update tables list
    await page.click('#refreshTables');
    await page.waitForTimeout(1000);
    
    // Select the test table from dropdown
    await page.click('[data-slot="select-trigger"]');
    await page.waitForTimeout(300);
    await page.locator('[role="option"]').filter({ hasText: 'test_drop_index' }).click();
    await page.waitForTimeout(1000);
  });

  test('should show Delete button for each index', async ({ page }) => {
    // Should see at least one delete button with data-index-name attribute
    const deleteButtons = page.locator('button[data-index-name]');
    const count = await deleteButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should open confirmation dialog when Delete button is clicked', async ({ page }) => {
    // Click first delete button
    await page.locator('button[data-index-name="idx_email"]').click();
    
    // Wait for dialog to appear
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should see confirmation dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Should see drop/delete title
    await expect(page.locator('[role="dialog"] >> text=/drop.*index|delete.*index/i').first()).toBeVisible();
  });

  test('should show index name in confirmation dialog', async ({ page }) => {
    await page.locator('button[data-index-name="idx_email"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should see the index name
    await expect(page.locator('[role="dialog"] >> text=idx_email')).toBeVisible();
  });

  test('should show warning about irreversible action', async ({ page }) => {
    await page.locator('button[data-index-name="idx_email"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should see warning message in the muted box
    const warningBox = page.locator('.bg-muted').filter({ hasText: 'permanent and cannot be undone' });
    await expect(warningBox).toBeVisible();
  });

  test('should close dialog when Cancel is clicked', async ({ page }) => {
    await page.locator('button[data-index-name="idx_email"]').click();
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

  test('should not delete index when Cancel is clicked', async ({ page }) => {
    // Try to delete but cancel
    await page.locator('button[data-index-name="idx_email"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(700);
    
    // Verify index still exists in database
    const indexExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA index_list(test_drop_index)`);
      return result.rows.some((row: any) => row.values[1].value === 'idx_email');
    });
    expect(indexExists).toBe(true);
  });

  test('should delete index when confirmed', async ({ page }) => {
    // Open dialog
    await page.locator('button[data-index-name="idx_email"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Confirm deletion
    await page.click('#confirmDropIndex', { force: true });
    await page.waitForTimeout(1500);
    
    // Verify index was deleted in database
    const indexExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA index_list(test_drop_index)`);
      return result.rows.some((row: any) => row.values[1].value === 'idx_email');
    });
    expect(indexExists).toBe(false);
  });

  test('should remove index from UI after deletion', async ({ page }) => {
    // Delete index
    await page.locator('button[data-index-name="idx_email"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('#confirmDropIndex', { force: true });
    await page.waitForTimeout(1500);
    
    // Should not see the index in the list anymore
    await expect(page.locator('table').locator('td:has-text("idx_email")')).not.toBeVisible();
  });

  test('should update index count after deletion', async ({ page }) => {
    // Get initial count
    const initialText = await page.locator('text=/\\d+\\s+(index|indexes)/i').first().textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');
    
    // Delete index
    await page.locator('button[data-index-name="idx_email"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('#confirmDropIndex', { force: true });
    await page.waitForTimeout(1500);
    
    // Verify count decreased
    const newText = await page.locator('text=/\\d+\\s+(index|indexes)/i').first().textContent();
    const newCount = parseInt(newText?.match(/\d+/)?.[0] || '0');
    expect(newCount).toBe(initialCount - 1);
  });

  test('should preserve table data when dropping index', async ({ page }) => {
    // Delete index
    await page.locator('button[data-index-name="idx_email"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('#confirmDropIndex', { force: true });
    await page.waitForTimeout(1500);
    
    // Verify data is still there
    const dataPreserved = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`SELECT COUNT(*) as count FROM test_drop_index`);
      return result.rows[0].values[0].value === 2;
    });
    expect(dataPreserved).toBe(true);
  });

  test('should delete UNIQUE index', async ({ page }) => {
    // Delete UNIQUE index
    await page.locator('button[data-index-name="idx_unique_name"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('#confirmDropIndex', { force: true });
    await page.waitForTimeout(1500);
    
    // Verify index was deleted
    const indexExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA index_list(test_drop_index)`);
      return result.rows.some((row: any) => row.values[1].value === 'idx_unique_name');
    });
    expect(indexExists).toBe(false);
  });

  test('should delete multi-column index', async ({ page }) => {
    // Delete multi-column index
    await page.locator('button[data-index-name="idx_location"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('#confirmDropIndex', { force: true });
    await page.waitForTimeout(1500);
    
    // Verify index was deleted
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
    await page.waitForTimeout(500);
    await page.click('#confirmDropIndex', { force: true });
    await page.waitForTimeout(1500);
    
    // Should see success message
    await expect(page.locator('text="idx_email" dropped successfully')).toBeVisible();
  });

  test('should be able to drop all indexes', async ({ page }) => {
    // Get initial count
    const initialText = await page.locator('text=/\\d+\\s+(index|indexes)/i').first().textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');
    
    // Drop all indexes one by one
    for (let i = 0; i < initialCount; i++) {
      // Always click the first delete button (since the list updates after each deletion)
      const firstDeleteBtn = page.locator('button[data-index-name]').first();
      await firstDeleteBtn.click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      await page.waitForTimeout(500);
      await page.click('#confirmDropIndex', { force: true });
      await page.waitForTimeout(1500);
    }
    
    // Should show "No indexes" message
    await expect(page.locator('text=/no.*indexes/i')).toBeVisible();
  });

  test('should show correct index type (UNIQUE vs INDEX) before deletion', async ({ page }) => {
    // Check that UNIQUE index shows UNIQUE badge
    const uniqueRow = page.locator('tr:has-text("idx_unique_name")');
    await expect(uniqueRow.locator('.bg-primary').filter({ hasText: 'UNIQUE' })).toBeVisible();
    
    // Check that regular index doesn't have UNIQUE badge in the same way
    const regularRow = page.locator('tr:has-text("idx_email")');
    const regularBadge = regularRow.locator('.bg-primary').filter({ hasText: 'UNIQUE' });
    const badgeCount = await regularBadge.count();
    expect(badgeCount).toBe(0);
  });
});
