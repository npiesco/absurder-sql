import { test, expect } from '@playwright/test';

test.describe('SQL Autocomplete E2E', () => {
  // Unique database name per test run to avoid parallel test conflicts
  const testDbName = `sql-autocomplete-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.db`;

  test.beforeEach(async ({ page }) => {
    await page.goto('/db/query');
    await page.waitForSelector('#queryInterface', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });

    // Create database programmatically since /db/query doesn't auto-create one
    await page.evaluate(async (dbName) => {
      const Database = (window as any).Database;
      const testDb = await Database.newDatabase(dbName);
      (window as any).testDb = testDb;
      (window as any).testDbName = dbName;
    }, testDbName);

    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });

    // Create test tables with data
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('CREATE TABLE users (id INTEGER, name TEXT, email TEXT)');
    await page.waitForSelector('#executeButton:not([disabled])');
    await page.click('#executeButton');
    await page.waitForTimeout(500);
    
    // Clear editor
    await page.click('.cm-editor .cm-content');
    await page.keyboard.press('Meta+A');
    await page.keyboard.press('Backspace');
    
    // Create second table
    await page.keyboard.type('CREATE TABLE orders (id INTEGER, user_id INTEGER, amount REAL, status TEXT)');
    await page.waitForSelector('#executeButton:not([disabled])');
    await page.click('#executeButton');
    await page.waitForTimeout(500);
    
    // Clear editor for tests
    await page.click('.cm-editor .cm-content');
    await page.keyboard.press('Meta+A');
    await page.keyboard.press('Backspace');
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      const dbName = (window as any).testDbName;
      if (db) { try { await db.close(); } catch {} }
      if (dbName) { try { await indexedDB.deleteDatabase(dbName); } catch {} }
    }).catch(() => {});
  });

  test('should show SQL keyword completions', async ({ page }) => {
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SEL');
    
    // Wait for autocomplete panel
    await page.waitForSelector('.cm-tooltip-autocomplete', { timeout: 3000 });
    
    // Check for SELECT suggestion
    const completions = await page.textContent('.cm-tooltip-autocomplete');
    expect(completions).toContain('SELECT');
  });

  test('should show table name completions after FROM', async ({ page }) => {
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT * FROM ');
    
    // Trigger autocomplete with Ctrl+Space
    await page.keyboard.press('Control+Space');
    
    // Wait for autocomplete panel
    await page.waitForSelector('.cm-tooltip-autocomplete', { timeout: 3000 });
    
    // Should show table names
    const completions = await page.textContent('.cm-tooltip-autocomplete');
    expect(completions).toContain('users');
    expect(completions).toContain('orders');
  });

  test('should show column name completions for table', async ({ page }) => {
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT ');
    
    // Trigger autocomplete
    await page.keyboard.press('Control+Space');
    
    // Wait for autocomplete panel
    await page.waitForSelector('.cm-tooltip-autocomplete', { timeout: 3000 });
    
    // Should show column names from available tables
    const completions = await page.textContent('.cm-tooltip-autocomplete');
    expect(completions?.toLowerCase()).toContain('name');
    expect(completions?.toLowerCase()).toContain('email');
  });

  test('should navigate completions with arrow keys', async ({ page }) => {
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SEL');
    
    // Wait for autocomplete panel to appear
    await page.waitForSelector('.cm-tooltip-autocomplete', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(300);
    
    // Verify autocomplete items exist
    const autocompleteItems = page.locator('.cm-tooltip-autocomplete .cm-completionLabel');
    await expect(autocompleteItems.first()).toBeVisible();
    
    // Navigate with arrow key
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    
    // Accept with Enter
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    
    // Check that a completion was inserted (should be SELECT or similar)
    const content = await page.locator('.cm-editor .cm-content').textContent();
    expect(content?.trim().length).toBeGreaterThan(3); // More than just 'SEL'
  });

  test('should accept completion with Enter', async ({ page }) => {
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SEL');
    
    // Wait for autocomplete panel to appear and be ready
    await page.waitForSelector('.cm-tooltip-autocomplete', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(300);
    
    // Verify autocomplete items exist
    const autocompleteItems = page.locator('.cm-tooltip-autocomplete .cm-completionLabel');
    await expect(autocompleteItems.first()).toBeVisible();
    
    // Accept with Enter
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    
    // Check that SELECT was inserted
    const content = await page.locator('.cm-editor .cm-content').textContent();
    expect(content).toContain('SELECT');
  });

  test('should show completions after typing partial table name', async ({ page }) => {
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT * FROM use');
    
    // Trigger autocomplete
    await page.keyboard.press('Control+Space');
    
    // Wait for autocomplete panel
    await page.waitForSelector('.cm-tooltip-autocomplete', { timeout: 3000 });
    
    // Should show matching table
    const completions = await page.textContent('.cm-tooltip-autocomplete');
    expect(completions).toContain('users');
  });

  test('should show column completions in WHERE clause', async ({ page }) => {
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT * FROM users WHERE ');
    
    // Trigger autocomplete
    await page.keyboard.press('Control+Space');
    
    // Wait for autocomplete panel
    await page.waitForSelector('.cm-tooltip-autocomplete', { timeout: 3000 });
    
    // Should show column names
    const completions = await page.textContent('.cm-tooltip-autocomplete');
    expect(completions?.toLowerCase()).toContain('name');
    expect(completions?.toLowerCase()).toContain('email');
  });

  test('should dismiss autocomplete with Escape', async ({ page }) => {
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SEL');
    
    // Wait for autocomplete panel
    await page.waitForSelector('.cm-tooltip-autocomplete', { timeout: 3000 });
    
    // Dismiss with Escape
    await page.keyboard.press('Escape');
    
    // Autocomplete should be gone
    const autocomplete = await page.locator('.cm-tooltip-autocomplete').count();
    expect(autocomplete).toBe(0);
  });

  test('should show completions for multiple keywords', async ({ page }) => {
    await page.click('.cm-editor .cm-content');
    
    // Test INSERT
    await page.keyboard.type('INS');
    await page.waitForSelector('.cm-tooltip-autocomplete', { timeout: 3000 });
    let completions = await page.textContent('.cm-tooltip-autocomplete');
    expect(completions).toContain('INSERT');
    
    // Clear and test UPDATE
    await page.keyboard.press('Meta+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('UPD');
    await page.waitForSelector('.cm-tooltip-autocomplete', { timeout: 3000 });
    completions = await page.textContent('.cm-tooltip-autocomplete');
    expect(completions).toContain('UPDATE');
    
    // Clear and test DELETE
    await page.keyboard.press('Meta+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('DEL');
    await page.waitForSelector('.cm-tooltip-autocomplete', { timeout: 3000 });
    completions = await page.textContent('.cm-tooltip-autocomplete');
    expect(completions).toContain('DELETE');
  });

  test('should autocomplete with case-insensitive matching', async ({ page }) => {
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('sel');
    
    // Wait for autocomplete panel
    await page.waitForSelector('.cm-tooltip-autocomplete', { timeout: 3000 });
    
    // Should still show SELECT
    const completions = await page.textContent('.cm-tooltip-autocomplete');
    expect(completions).toContain('SELECT');
  });
});
