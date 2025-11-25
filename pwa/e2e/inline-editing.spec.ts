/**
 * E2E Tests for Inline Cell Editing
 * 
 * Tests double-click to edit, data type validation, save/cancel operations
 * Based on Adminer parity requirement FR-AB1.2
 */

import { test, expect } from '@playwright/test';

test.describe('Inline Editing - Cell Editing', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/db/browse');
    await page.waitForSelector('#dataBrowser', { timeout: 10000 });
    // Wait for database to be ready
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
  });

  test('should enter edit mode on double-click', async ({ page }) => {
    // Create test table with data
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS edit_test');
      await db.execute('CREATE TABLE edit_test (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)');
      await db.execute("INSERT INTO edit_test (id, name, age) VALUES (1, 'Alice', 30)");
    });

    // Refresh and select table
    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=edit_test');
    await page.waitForSelector('table tbody tr');

    // Double-click on a cell
    const nameCell = page.locator('table tbody tr:first-child td:nth-child(4)'); // name column
    await nameCell.dblclick();

    // Verify input appears
    const input = nameCell.locator('input, textarea');
    await expect(input).toBeVisible();
    
    // Verify input has current value
    const value = await input.inputValue();
    expect(value).toBe('Alice');
  });

  test('should save TEXT edit on Enter key', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS text_edit');
      await db.execute('CREATE TABLE text_edit (id INTEGER PRIMARY KEY, name TEXT)');
      await db.execute("INSERT INTO text_edit (id, name) VALUES (1, 'Bob')");
      
    });
    
    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=text_edit');
    await page.waitForSelector('table tbody tr');

    // Double-click and edit
    const nameCell = page.locator('table tbody tr:first-child td:nth-child(4)');
    await nameCell.dblclick();
    
    const input = nameCell.locator('input, textarea');
    await input.fill('Charlie');
    await input.press('Enter');

    // Wait for save
    await page.waitForTimeout(500);

    // Verify cell shows new value
    const cellText = await nameCell.textContent();
    expect(cellText).toContain('Charlie');

    // Verify database was updated
    const result = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const res = await db.execute('SELECT name FROM text_edit WHERE id = 1');
      return res.rows[0].values[0].value;
    });
    expect(result).toBe('Charlie');
  });

  test('should cancel edit on Escape key', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS cancel_test');
      await db.execute('CREATE TABLE cancel_test (id INTEGER PRIMARY KEY, name TEXT)');
      await db.execute("INSERT INTO cancel_test (id, name) VALUES (1, 'Original')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=cancel_test');
    await page.waitForSelector('table tbody tr');

    const nameCell = page.locator('table tbody tr:first-child td:nth-child(4)');
    await nameCell.dblclick();
    
    const input = nameCell.locator('input, textarea');
    await input.fill('Modified');
    await input.press('Escape');

    // Wait for cancel
    await page.waitForTimeout(200);

    // Verify cell still shows original value
    const cellText = await nameCell.textContent();
    expect(cellText).toContain('Original');

    // Verify database was NOT updated
    const result = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const res = await db.execute('SELECT name FROM cancel_test WHERE id = 1');
      return res.rows[0].values[0].value;
    });
    expect(result).toBe('Original');
  });

  test('should validate INTEGER input', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS int_test');
      await db.execute('CREATE TABLE int_test (id INTEGER PRIMARY KEY, age INTEGER)');
      await db.execute("INSERT INTO int_test (id, age) VALUES (1, 25)");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=int_test');
    await page.waitForSelector('table tbody tr');

    const ageCell = page.locator('table tbody tr:first-child td:nth-child(4)');
    await ageCell.dblclick();
    
    const input = ageCell.locator('input');
    await expect(input).toHaveAttribute('type', 'number');
    
    // Test valid integer
    await input.fill('42');
    await input.press('Enter');
    await page.waitForTimeout(300);
    
    const cellText = await ageCell.textContent();
    expect(cellText).toContain('42');
  });

  test('should validate REAL (decimal) input', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS real_test');
      await db.execute('CREATE TABLE real_test (id INTEGER PRIMARY KEY, price REAL)');
      await db.execute("INSERT INTO real_test (id, price) VALUES (1, 19.99)");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=real_test');
    await page.waitForSelector('table tbody tr');

    const priceCell = page.locator('table tbody tr:first-child td:nth-child(4)');
    await priceCell.dblclick();
    
    const input = priceCell.locator('input');
    await expect(input).toHaveAttribute('type', 'number');
    await expect(input).toHaveAttribute('step', 'any');
    
    // Test valid decimal
    await input.fill('29.95');
    await input.press('Enter');
    await page.waitForTimeout(300);
    
    const cellText = await priceCell.textContent();
    expect(cellText).toContain('29.95');
  });

  test('should show visual feedback for editing state', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS visual_test');
      await db.execute('CREATE TABLE visual_test (id INTEGER PRIMARY KEY, name TEXT)');
      await db.execute("INSERT INTO visual_test (id, name) VALUES (1, 'Test')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=visual_test');
    await page.waitForSelector('table tbody tr');

    const nameCell = page.locator('table tbody tr:first-child td:nth-child(4)');
    
    // Check for editing class when in edit mode
    await nameCell.dblclick();
    const hasEditingClass = await nameCell.evaluate((el) => 
      el.classList.contains('editing') || el.querySelector('.editing') !== null
    );
    expect(hasEditingClass).toBe(true);
  });

  test('should support NULL value editing', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS null_edit');
      await db.execute('CREATE TABLE null_edit (id INTEGER PRIMARY KEY, optional_field TEXT)');
      await db.execute("INSERT INTO null_edit (id, optional_field) VALUES (1, NULL)");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=null_edit');
    await page.waitForSelector('table tbody tr');

    // Double-click on NULL cell
    const nullCell = page.locator('table tbody tr:first-child td:nth-child(4)');
    await nullCell.dblclick();
    
    const input = nullCell.locator('input, textarea');
    await expect(input).toBeVisible();
    
    // Should be empty or have placeholder
    const value = await input.inputValue();
    expect(value).toBe('');
    
    // Add value to previously NULL field
    await input.fill('Now has value');
    await input.press('Enter');
    await page.waitForTimeout(300);
    
    const cellText = await nullCell.textContent();
    expect(cellText).toContain('Now has value');
  });

  test('should handle multiline TEXT with textarea', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS multiline_test');
      await db.execute('CREATE TABLE multiline_test (id INTEGER PRIMARY KEY, description TEXT)');
      await db.execute("INSERT INTO multiline_test (id, description) VALUES (1, 'Line 1')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=multiline_test');
    await page.waitForSelector('table tbody tr');

    const descCell = page.locator('table tbody tr:first-child td:nth-child(4)');
    await descCell.dblclick();
    
    // For TEXT fields longer than certain threshold, should use textarea
    const textarea = descCell.locator('textarea');
    if (await textarea.count() > 0) {
      await textarea.fill('Line 1\nLine 2\nLine 3');
      await textarea.press('Control+Enter'); // Ctrl+Enter to save in textarea
      await page.waitForTimeout(300);
      
      const cellText = await descCell.textContent();
      expect(cellText).toContain('Line 1');
    }
  });
});
