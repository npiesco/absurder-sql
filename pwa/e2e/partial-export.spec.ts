import { test, expect } from '@playwright/test';
import { readFileSync, unlinkSync } from 'fs';

test.describe('Partial Export - Column Selection', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/db/query');
    await page.waitForSelector('#queryInterface', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });

    // Create database programmatically since /db/query doesn't auto-create one
    await page.evaluate(async () => {
      const Database = (window as any).Database;
      const testDb = await Database.newDatabase('test-db');
      (window as any).testDb = testDb;
    });

    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });

    // Type something to enable execute button (waits for DB to be ready)
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT 1');
    await page.waitForSelector('#executeButton:not([disabled])', { timeout: 10000 });
    await page.waitForTimeout(500); // Give DB time to initialize

    // Create test database with sample data
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS employees');
      await db.execute(`
        CREATE TABLE employees (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT,
          age INTEGER,
          department TEXT,
          salary REAL
        )
      `);
      await db.execute(`
        INSERT INTO employees (id, name, email, age, department, salary) VALUES
        (1, 'Alice', 'alice@company.com', 30, 'Engineering', 95000.00),
        (2, 'Bob', 'bob@company.com', 25, 'Sales', 75000.00),
        (3, 'Charlie', 'charlie@company.com', 35, 'Engineering', 105000.00)
      `);
    });
    
    // Clear the editor for the test
    await page.keyboard.press('Meta+A');
    await page.keyboard.press('Backspace');
  });

  test('should show column selection checkboxes in CSV export options', async ({ page }) => {
    // Run query
    await page.keyboard.type('SELECT * FROM employees');
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Open CSV export options
    await page.click('#exportCSVOptions');
    await page.waitForTimeout(300);

    // Check that column selection is available
    const columnSelectionLabel = await page.locator('text=Select Columns to Export');
    await expect(columnSelectionLabel).toBeVisible();

    // Check that all columns have checkboxes
    await expect(page.locator('#column-id')).toBeVisible();
    await expect(page.locator('#column-name')).toBeVisible();
    await expect(page.locator('#column-email')).toBeVisible();
    await expect(page.locator('#column-age')).toBeVisible();
    await expect(page.locator('#column-department')).toBeVisible();
    await expect(page.locator('#column-salary')).toBeVisible();
  });

  test('should export only selected columns to CSV', async ({ page }) => {
    // Run query
    await page.keyboard.type('SELECT * FROM employees');
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Open CSV export options
    await page.click('#exportCSVOptions');
    await page.waitForTimeout(300);

    // Deselect some columns (keep only id, name, department)
    await page.click('#column-email');
    await page.click('#column-age');
    await page.click('#column-salary');
    await page.waitForTimeout(200);

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#confirmExport');
    const download = await downloadPromise;

    // Verify content has only selected columns
    const downloadPath = await download.path();
    const csvContent = readFileSync(downloadPath!, 'utf-8');
    
    // Check headers
    expect(csvContent).toContain('id,name,department');
    expect(csvContent).not.toContain('email');
    expect(csvContent).not.toContain('age');
    expect(csvContent).not.toContain('salary');
    
    // Check data rows
    expect(csvContent).toContain('1,Alice,Engineering');
    expect(csvContent).toContain('2,Bob,Sales');
    expect(csvContent).not.toContain('alice@company.com');
    expect(csvContent).not.toContain('95000');
  });

  test('should show column selection in JSON export options', async ({ page }) => {
    // Run query
    await page.keyboard.type('SELECT * FROM employees');
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Open JSON export options
    await page.click('#exportJSONOptions');
    await page.waitForTimeout(300);

    // Check that column selection is available
    const columnSelectionLabel = await page.locator('text=Select Columns to Export');
    await expect(columnSelectionLabel).toBeVisible();

    // Check that all columns have checkboxes
    await expect(page.locator('#column-id')).toBeVisible();
    await expect(page.locator('#column-name')).toBeVisible();
  });

  test('should export only selected columns to JSON', async ({ page }) => {
    // Run query
    await page.keyboard.type('SELECT * FROM employees');
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Open JSON export options
    await page.click('#exportJSONOptions');
    await page.waitForTimeout(300);

    // Deselect some columns (keep only id and name)
    await page.click('#column-email');
    await page.click('#column-age');
    await page.click('#column-department');
    await page.click('#column-salary');
    await page.waitForTimeout(200);

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#confirmJSONExport');
    const download = await downloadPromise;

    // Verify content has only selected columns
    const downloadPath = await download.path();
    const jsonContent = readFileSync(downloadPath!, 'utf-8');
    const data = JSON.parse(jsonContent);

    // Check that only id and name are present
    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('name');
    expect(data[0]).not.toHaveProperty('email');
    expect(data[0]).not.toHaveProperty('age');
    expect(data[0]).not.toHaveProperty('department');
    expect(data[0]).not.toHaveProperty('salary');

    // Verify values
    expect(data[0].id).toBe(1);
    expect(data[0].name).toBe('Alice');
  });

  test('should show column selection in SQL export options', async ({ page }) => {
    // Run query
    await page.keyboard.type('SELECT * FROM employees');
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Open SQL export options
    await page.click('#exportSQLOptions');
    await page.waitForTimeout(300);

    // Check that column selection is available
    const columnSelectionLabel = await page.locator('text=Select Columns to Export');
    await expect(columnSelectionLabel).toBeVisible();
  });

  test('should export only selected columns to SQL dump', async ({ page }) => {
    // Run query
    await page.keyboard.type('SELECT * FROM employees');
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Open SQL export options
    await page.click('#exportSQLOptions');
    await page.waitForTimeout(300);

    // Deselect some columns (keep only id, name, age)
    await page.click('#column-email');
    await page.click('#column-department');
    await page.click('#column-salary');
    await page.waitForTimeout(200);

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#confirmSQLExport');
    const download = await downloadPromise;

    // Verify content has only selected columns
    const downloadPath = await download.path();
    const sqlContent = readFileSync(downloadPath!, 'utf-8');

    // Check CREATE TABLE has only selected columns
    expect(sqlContent).toContain('CREATE TABLE');
    expect(sqlContent).toContain('id INTEGER');
    expect(sqlContent).toContain('name TEXT');
    expect(sqlContent).toContain('age INTEGER');
    expect(sqlContent).not.toContain('email');
    expect(sqlContent).not.toContain('department');
    expect(sqlContent).not.toContain('salary');

    // Check INSERT has only selected columns
    expect(sqlContent).toContain('INSERT INTO query_results (id, name, age)');
    expect(sqlContent).not.toContain('alice@company.com');
    expect(sqlContent).not.toContain('Engineering');
  });

  test('should preserve "select all" / "deselect all" functionality', async ({ page }) => {
    // Run query
    await page.keyboard.type('SELECT * FROM employees');
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Open CSV export options
    await page.click('#exportCSVOptions');
    await page.waitForTimeout(300);

    // Click "Select All" button
    await page.click('#selectAllColumns');
    await page.waitForTimeout(200);

    // Verify all checkboxes are checked
    const idCheckbox = await page.locator('#column-id');
    await expect(idCheckbox).toBeChecked();

    const nameCheckbox = await page.locator('#column-name');
    await expect(nameCheckbox).toBeChecked();

    // Click "Deselect All" button
    await page.click('#deselectAllColumns');
    await page.waitForTimeout(200);

    // Verify all checkboxes are unchecked
    await expect(idCheckbox).not.toBeChecked();
    await expect(nameCheckbox).not.toBeChecked();
  });

  test('should export all columns when none selected (default behavior)', async ({ page, context }) => {
    // Run query
    await page.keyboard.type('SELECT * FROM employees');
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Open CSV export options
    await page.click('#exportCSVOptions');
    await page.waitForTimeout(300);

    // Deselect all columns
    await page.click('#deselectAllColumns');
    await page.waitForTimeout(200);

    // Export - should default to all columns
    const downloadPromise = page.waitForEvent('download');
    await page.click('#confirmExport');
    const download = await downloadPromise;
    
    // Save and verify the file
    const path = `/tmp/test-export-default-${Date.now()}.csv`;
    await download.saveAs(path);
    const content = readFileSync(path, 'utf-8');
    
    // Should contain all columns
    expect(content).toContain('id');
    expect(content).toContain('name');
    expect(content).toContain('email');
    expect(content).toContain('age');
    expect(content).toContain('department');
    expect(content).toContain('salary');
    
    // Clean up
    unlinkSync(path);
  });

  test('should export single column only', async ({ page }) => {
    // Run query
    await page.keyboard.type('SELECT * FROM employees');
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Open CSV export options
    await page.click('#exportCSVOptions');
    await page.waitForTimeout(300);

    // Deselect all columns
    await page.click('#deselectAllColumns');
    await page.waitForTimeout(200);

    // Select only name column
    await page.click('#column-name');
    await page.waitForTimeout(200);

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#confirmExport');
    const download = await downloadPromise;

    // Verify content has only name column
    const downloadPath = await download.path();
    const csvContent = readFileSync(downloadPath!, 'utf-8');
    
    // Should have single column header
    expect(csvContent.split('\n')[0].trim()).toBe('name');
    
    // Should have data
    expect(csvContent).toContain('Alice');
    expect(csvContent).toContain('Bob');
    expect(csvContent).toContain('Charlie');
    
    // Should not have other columns
    expect(csvContent).not.toContain('alice@company.com');
    expect(csvContent).not.toContain('Engineering');
  });

  test('should maintain column selection across dialog closes', async ({ page }) => {
    // Run query
    await page.keyboard.type('SELECT * FROM employees');
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Open CSV export options
    await page.click('#exportCSVOptions');
    await page.waitForTimeout(300);

    // Deselect some columns
    await page.click('#column-email');
    await page.click('#column-age');
    await page.waitForTimeout(200);

    // Close dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Reopen dialog
    await page.click('#exportCSVOptions');
    await page.waitForTimeout(300);

    // Verify selection is maintained
    const emailCheckbox = await page.locator('#column-email');
    await expect(emailCheckbox).not.toBeChecked();

    const ageCheckbox = await page.locator('#column-age');
    await expect(ageCheckbox).not.toBeChecked();

    const nameCheckbox = await page.locator('#column-name');
    await expect(nameCheckbox).toBeChecked();
  });
});
