/**
 * E2E Tests for Row Operations (Add/Delete)
 * 
 * Tests adding new rows, deleting single rows, and bulk delete operations
 * Based on Adminer parity requirements FR-AB1.3 and FR-AB1.4
 */

import { test, expect } from '@playwright/test';

test.describe('Row Operations - Add Row', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/db/browse');
    await page.waitForSelector('#dataBrowser', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
  });

  test('should show Add Row button when table is selected', async ({ page }) => {
    // Create test table
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS add_row_test');
      await db.execute('CREATE TABLE add_row_test (id INTEGER PRIMARY KEY, name TEXT, value INTEGER)');
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=add_row_test');
    await page.waitForSelector('table tbody tr', { timeout: 5000 }).catch(() => {});

    // Verify Add Row button exists
    const addButton = page.locator('button:has-text("Add Row")');
    await expect(addButton).toBeVisible();
  });

  test('should add new empty row with default values', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS new_row_test');
      await db.execute('CREATE TABLE new_row_test (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, age INTEGER DEFAULT 0)');
      await db.execute("INSERT INTO new_row_test (name, age) VALUES ('Alice', 25)");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=new_row_test');
    await page.waitForSelector('table tbody tr');

    // Initial row count
    let rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(1);

    // Click Add Row
    await page.click('button:has-text("Add Row")');
    await page.waitForTimeout(500);

    // Verify new row was added
    rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(2);

    // Verify database was updated
    const result = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const res = await db.execute('SELECT COUNT(*) FROM new_row_test');
      return res.rows[0].values[0].value;
    });
    expect(result).toBe(2);
  });

  test('should auto-increment PRIMARY KEY when adding row', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS autoincrement_test');
      await db.execute('CREATE TABLE autoincrement_test (id INTEGER PRIMARY KEY AUTOINCREMENT, value TEXT)');
      await db.execute("INSERT INTO autoincrement_test (value) VALUES ('First')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=autoincrement_test');
    await page.waitForSelector('table tbody tr');

    // Add new row
    await page.click('button:has-text("Add Row")');
    await page.waitForTimeout(500);

    // Verify new row has incremented ID
    const newRowId = await page.locator('table tbody tr:nth-child(2) td:nth-child(2)').textContent();
    expect(parseInt(newRowId || '0')).toBe(2);
  });

  test('should handle tables with NOT NULL constraints', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS not_null_test');
      await db.execute('CREATE TABLE not_null_test (id INTEGER PRIMARY KEY, required_field TEXT NOT NULL DEFAULT "default_value")');
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=not_null_test');
    await page.waitForTimeout(500);

    // Add new row - should succeed with default value
    await page.click('button:has-text("Add Row")');
    await page.waitForTimeout(500);

    // Verify row was added
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(1);
  });
});

test.describe('Row Operations - Delete Row', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/db/browse');
    await page.waitForSelector('#dataBrowser', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
  });

  test('should show Delete button for each row', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS delete_button_test');
      await db.execute('CREATE TABLE delete_button_test (id INTEGER PRIMARY KEY, name TEXT)');
      await db.execute("INSERT INTO delete_button_test (id, name) VALUES (1, 'Test')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=delete_button_test');
    await page.waitForSelector('table tbody tr');

    // Verify Delete button exists
    const deleteButton = page.locator('table tbody tr button:has-text("Delete"), table tbody tr button[aria-label*="Delete"]').first();
    await expect(deleteButton).toBeVisible();
  });

  test('should show confirmation dialog before deleting row', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS confirm_delete_test');
      await db.execute('CREATE TABLE confirm_delete_test (id INTEGER PRIMARY KEY, name TEXT)');
      await db.execute("INSERT INTO confirm_delete_test (id, name) VALUES (1, 'ToDelete')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=confirm_delete_test');
    await page.waitForSelector('table tbody tr');

    // Click delete button
    await page.locator('table tbody tr button:has-text("Delete"), table tbody tr button[aria-label*="Delete"]').first().click();
    await page.waitForTimeout(200);

    // Verify confirmation dialog appears
    const dialog = page.locator('[role="alertdialog"], .confirm-dialog, dialog').first();
    await expect(dialog).toBeVisible({ timeout: 2000 });
  });

  test('should delete row when confirmed', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS delete_confirm_test');
      await db.execute('CREATE TABLE delete_confirm_test (id INTEGER PRIMARY KEY, name TEXT)');
      await db.execute("INSERT INTO delete_confirm_test (id, name) VALUES (1, 'First')");
      await db.execute("INSERT INTO delete_confirm_test (id, name) VALUES (2, 'Second')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=delete_confirm_test');
    await page.waitForSelector('table tbody tr');

    // Initial count
    let rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(2);

    // Delete first row
    await page.locator('table tbody tr:first-child button:has-text("Delete"), table tbody tr:first-child button[aria-label*="Delete"]').click();
    await page.waitForTimeout(200);

    // Confirm deletion
    await page.click('#confirmDeleteButton');
    await page.waitForTimeout(500);

    // Verify row was deleted
    rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(1);

    // Verify database was updated
    const result = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const res = await db.execute('SELECT COUNT(*) FROM delete_confirm_test');
      return res.rows[0].values[0].value;
    });
    expect(result).toBe(1);
  });

  test('should not delete row when cancelled', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS delete_cancel_test');
      await db.execute('CREATE TABLE delete_cancel_test (id INTEGER PRIMARY KEY, name TEXT)');
      await db.execute("INSERT INTO delete_cancel_test (id, name) VALUES (1, 'Keep')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=delete_cancel_test');
    await page.waitForSelector('table tbody tr');

    // Delete row
    await page.locator('table tbody tr button:has-text("Delete"), table tbody tr button[aria-label*="Delete"]').first().click();
    await page.waitForTimeout(200);

    // Cancel deletion
    await page.click('#cancelDeleteButton');
    await page.waitForTimeout(300);

    // Verify row still exists
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(1);
  });
});

test.describe('Row Operations - Bulk Delete', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/db/browse');
    await page.waitForSelector('#dataBrowser', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
  });

  test('should show checkboxes for each row', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS checkbox_test');
      await db.execute('CREATE TABLE checkbox_test (id INTEGER PRIMARY KEY, name TEXT)');
      await db.execute("INSERT INTO checkbox_test (id, name) VALUES (1, 'Test')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=checkbox_test');
    await page.waitForSelector('table tbody tr');

    // Verify checkbox exists
    const checkbox = page.locator('table tbody tr input[type="checkbox"]').first();
    await expect(checkbox).toBeVisible();
  });

  test('should show Select All checkbox in header', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS select_all_test');
      await db.execute('CREATE TABLE select_all_test (id INTEGER PRIMARY KEY, name TEXT)');
      await db.execute("INSERT INTO select_all_test (id, name) VALUES (1, 'Row1')");
      await db.execute("INSERT INTO select_all_test (id, name) VALUES (2, 'Row2')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=select_all_test');
    await page.waitForSelector('table tbody tr');

    // Verify select all checkbox exists in header
    const selectAllCheckbox = page.locator('table thead input[type="checkbox"]').first();
    await expect(selectAllCheckbox).toBeVisible();
  });

  test('should select all rows when Select All is checked', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS select_all_rows_test');
      await db.execute('CREATE TABLE select_all_rows_test (id INTEGER PRIMARY KEY, name TEXT)');
      await db.execute("INSERT INTO select_all_rows_test (id, name) VALUES (1, 'Row1')");
      await db.execute("INSERT INTO select_all_rows_test (id, name) VALUES (2, 'Row2')");
      await db.execute("INSERT INTO select_all_rows_test (id, name) VALUES (3, 'Row3')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=select_all_rows_test');
    await page.waitForSelector('table tbody tr');

    // Click select all
    await page.locator('table thead input[type="checkbox"]').first().click();
    await page.waitForTimeout(200);

    // Verify all checkboxes are checked
    const checkedCount = await page.locator('table tbody tr input[type="checkbox"]:checked').count();
    expect(checkedCount).toBe(3);
  });

  test('should show Delete Selected button when rows are selected', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS delete_selected_test');
      await db.execute('CREATE TABLE delete_selected_test (id INTEGER PRIMARY KEY, name TEXT)');
      await db.execute("INSERT INTO delete_selected_test (id, name) VALUES (1, 'Row1')");
      await db.execute("INSERT INTO delete_selected_test (id, name) VALUES (2, 'Row2')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=delete_selected_test');
    await page.waitForSelector('table tbody tr');

    // Select first row
    await page.locator('table tbody tr:first-child input[type="checkbox"]').click();
    await page.waitForTimeout(200);

    // Verify Delete Selected button appears
    const deleteSelectedButton = page.locator('button:has-text("Delete Selected")');
    await expect(deleteSelectedButton).toBeVisible();
  });

  test('should delete multiple selected rows', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS bulk_delete_test');
      await db.execute('CREATE TABLE bulk_delete_test (id INTEGER PRIMARY KEY, name TEXT)');
      await db.execute("INSERT INTO bulk_delete_test (id, name) VALUES (1, 'Delete1')");
      await db.execute("INSERT INTO bulk_delete_test (id, name) VALUES (2, 'Keep')");
      await db.execute("INSERT INTO bulk_delete_test (id, name) VALUES (3, 'Delete2')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=bulk_delete_test');
    await page.waitForSelector('table tbody tr');

    // Select first and third row
    await page.locator('table tbody tr:nth-child(1) input[type="checkbox"]').click();
    await page.locator('table tbody tr:nth-child(3) input[type="checkbox"]').click();
    await page.waitForTimeout(200);

    // Click Delete Selected
    await page.locator('button:has-text("Delete Selected")').click();
    await page.waitForTimeout(200);

    // Confirm deletion
    await page.click('#confirmDeleteButton');
    await page.waitForTimeout(500);

    // Verify rows were deleted
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(1);

    // Verify database was updated
    const result = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const res = await db.execute('SELECT name FROM bulk_delete_test');
      return res.rows[0].values[0].value;
    });
    expect(result).toBe('Keep');
  });

  test('should show count in Delete Selected button', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS delete_count_test');
      await db.execute('CREATE TABLE delete_count_test (id INTEGER PRIMARY KEY, name TEXT)');
      await db.execute("INSERT INTO delete_count_test (id, name) VALUES (1, 'Row1')");
      await db.execute("INSERT INTO delete_count_test (id, name) VALUES (2, 'Row2')");
      await db.execute("INSERT INTO delete_count_test (id, name) VALUES (3, 'Row3')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=delete_count_test');
    await page.waitForSelector('table tbody tr');

    // Select 2 rows
    await page.locator('table tbody tr:nth-child(1) input[type="checkbox"]').click();
    await page.locator('table tbody tr:nth-child(2) input[type="checkbox"]').click();
    await page.waitForTimeout(200);

    // Verify button shows count
    const deleteButton = page.locator('button:has-text("Delete Selected")');
    const buttonText = await deleteButton.textContent();
    expect(buttonText).toContain('2');
  });
});
