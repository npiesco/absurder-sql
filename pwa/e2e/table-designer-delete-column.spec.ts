import { test, expect } from '@playwright/test';

test.describe('Table Designer - Delete Column E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Go directly to designer page and let it initialize
    await page.goto('/db/designer');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Create test table with multiple columns
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
      
      // Create a test table with several columns
      try {
        await db.execute(`DROP TABLE IF EXISTS test_delete_column`);
      } catch (e) {
        // Table might not exist, that's ok
      }
      
      await db.execute(`
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
      
      // Insert some test data
      await db.execute(`
        INSERT INTO test_delete_column (name, email, age, salary, notes, created_at) 
        VALUES ('John Doe', 'john@example.com', 30, 50000.00, 'Test user', '2024-01-01')
      `);
    });
    
    // Click refresh button to update tables list
    await page.click('#refreshTables');
    await page.waitForTimeout(500);
  });

  test('should show Delete button for each column', async ({ page }) => {
    // Should see Delete buttons in the Actions column
    const deleteButtons = page.locator('button:has-text("Delete")');
    await expect(deleteButtons.first()).toBeVisible();
    
    // Should have multiple delete buttons (one per column)
    const count = await deleteButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should open confirmation dialog when Delete button is clicked', async ({ page }) => {
    // Click Delete button for the "notes" column
    await page.locator('tr:has-text("notes") >> button:has-text("Delete")').click();
    
    // Wait for dialog to appear and animations to complete
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should see confirmation dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Should see confirmation message
    await expect(page.locator('[role="dialog"] >> text=/delete.*column|remove.*column/i').first()).toBeVisible();
  });

  test('should show column name in confirmation dialog', async ({ page }) => {
    // Click Delete button for the "email" column
    await page.locator('tr:has-text("email") >> button:has-text("Delete")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should see the column name in the dialog
    await expect(page.locator('[role="dialog"] >> text=email').first()).toBeVisible();
  });

  test('should show warning about data loss in confirmation dialog', async ({ page }) => {
    await page.locator('tr:has-text("age") >> button:has-text("Delete")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should see data loss warning
    await expect(page.locator('[role="dialog"] >> text=/data.*lost|lose.*data|cannot.*undone/i').first()).toBeVisible();
  });

  test('should close dialog when Cancel is clicked', async ({ page }) => {
    await page.locator('tr:has-text("salary") >> button:has-text("Delete")').click();
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

  test('should not delete column when Cancel is clicked', async ({ page }) => {
    // Count columns before
    const columnsBefore = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA table_info(test_delete_column)`);
      return result.rows.length;
    });
    
    // Try to delete but cancel
    await page.locator('tr:has-text("notes") >> button:has-text("Delete")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(700);
    
    // Column count should be unchanged
    const columnsAfter = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA table_info(test_delete_column)`);
      return result.rows.length;
    });
    
    expect(columnsAfter).toBe(columnsBefore);
  });

  test('should delete column when confirmed', async ({ page }) => {
    // Verify column exists
    const columnExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA table_info(test_delete_column)`);
      return result.rows.some((row: any) => row.values[1].value === 'notes');
    });
    expect(columnExists).toBe(true);
    
    // Delete the column
    await page.locator('tr:has-text("notes") >> button:has-text("Delete")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('#confirmDeleteColumn');
    await page.waitForTimeout(1500);
    
    // Verify column was deleted from database
    const columnDeleted = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA table_info(test_delete_column)`);
      return !result.rows.some((row: any) => row.values[1].value === 'notes');
    });
    expect(columnDeleted).toBe(true);
  });

  test('should remove column from UI after deletion', async ({ page }) => {
    // Verify column is visible in UI
    await expect(page.locator('[data-column-list] >> text="notes"').first()).toBeVisible();
    
    // Delete the column
    await page.locator('tr:has-text("notes") >> button:has-text("Delete")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('#confirmDeleteColumn');
    await page.waitForTimeout(1500);
    
    // Column should no longer be visible in UI
    await expect(page.locator('text="notes"').first()).not.toBeVisible();
  });

  test('should update column count after deletion', async ({ page }) => {
    // Initial count should be 7 columns
    await expect(page.locator('text=/7.*columns?/i')).toBeVisible();
    
    // Delete a column
    await page.locator('tr:has-text("notes") >> button:has-text("Delete")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('#confirmDeleteColumn');
    await page.waitForTimeout(1500);
    
    // Count should now be 6 columns
    await expect(page.locator('text=/6.*columns?/i')).toBeVisible();
  });

  test('should preserve existing data in remaining columns after deletion', async ({ page }) => {
    // Get data before deletion
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
    
    // Delete the "notes" column
    await page.locator('tr:has-text("notes") >> button:has-text("Delete")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('#confirmDeleteColumn');
    await page.waitForTimeout(1500);
    
    // Verify data is preserved in remaining columns
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
    // Try to delete the "id" column (PRIMARY KEY)
    await page.locator('tr:has-text("id") >> button:has-text("Delete")').click();
    await page.waitForTimeout(500);
    
    // Should see error or warning about PRIMARY KEY (will show in status message, not dialog)
    await expect(page.locator('text=/primary key|cannot.*delete.*primary/i').first()).toBeVisible();
  });

  test('should handle deletion of column with index', async ({ page }) => {
    // First, create an index on the email column
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute(`CREATE INDEX idx_email ON test_delete_column(email)`);
    });
    
    // Delete the column
    await page.locator('tr:has-text("email") >> button:has-text("Delete")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('#confirmDeleteColumn');
    await page.waitForTimeout(1500);
    
    // Verify column was deleted
    const columnDeleted = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA table_info(test_delete_column)`);
      return !result.rows.some((row: any) => row.values[1].value === 'email');
    });
    expect(columnDeleted).toBe(true);
    
    // Verify index was also removed
    const indexRemoved = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`PRAGMA index_list(test_delete_column)`);
      return !result.rows.some((row: any) => row.values[1].value === 'idx_email');
    });
    expect(indexRemoved).toBe(true);
  });

  test('should show success message after deletion', async ({ page }) => {
    // Delete a column
    await page.locator('tr:has-text("notes") >> button:has-text("Delete")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('#confirmDeleteColumn');
    await page.waitForTimeout(1500);
    
    // Should see success message
    await expect(page.locator('text=/column.*deleted|successfully.*deleted/i')).toBeVisible();
  });
});
