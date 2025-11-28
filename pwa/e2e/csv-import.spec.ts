/**
 * E2E Tests for CSV Import
 *
 * Tests CSV file upload, parsing, column mapping, and data import
 * Based on FR-AB2.2: CSV import with column mapping from PRD
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('CSV Import', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/db/import-csv');
    await page.waitForSelector('#csvImport', { timeout: 10000 });
    // Wait for database to be ready
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
  });

  test('should display CSV import page', async ({ page }) => {
    // Check page loaded
    const title = await page.textContent('h1');
    expect(title).toContain('CSV Import');

    // Check key elements exist
    await expect(page.locator('#csvFileInput')).toBeVisible();
    await expect(page.locator('#delimiterSelect')).toBeVisible();
    // Note: tableSelect only visible after CSV upload
  });

  test('should upload and parse CSV file with headers', async ({ page }) => {
    // Create test table
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, age INTEGER)');
    });

    // Create test CSV file
    const csvContent = 'name,email,age\nJohn Doe,john@example.com,30\nJane Smith,jane@example.com,25';
    const csvPath = path.join(__dirname, '..', 'test-data', 'users.csv');
    const csvDir = path.dirname(csvPath);

    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }
    fs.writeFileSync(csvPath, csvContent);

    try {
      // Upload CSV file
      await page.setInputFiles('#csvFileInput', csvPath);

      // Wait for preview to appear
      await page.waitForSelector('[data-testid="preview-row"]', { state: 'visible', timeout: 10000 });

      // Check that CSV was parsed
      const rowCount = await page.locator('[data-testid="preview-row"]').count();
      expect(rowCount).toBeGreaterThan(0);

      // Check headers detected
      const hasNameColumn = await page.locator('text=name').isVisible();
      const hasEmailColumn = await page.locator('text=email').isVisible();
      const hasAgeColumn = await page.locator('text=age').isVisible();
      expect(hasNameColumn).toBeTruthy();
      expect(hasEmailColumn).toBeTruthy();
      expect(hasAgeColumn).toBeTruthy();
    } finally {
      // Cleanup
      if (fs.existsSync(csvPath)) {
        fs.unlinkSync(csvPath);
      }
    }
  });

  test('should show column mapping interface', async ({ page }) => {
    // Create test table with different column names
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('CREATE TABLE IF NOT EXISTS contacts (contact_id INTEGER PRIMARY KEY, full_name TEXT, email_address TEXT, phone TEXT)');
    });

    // Create test CSV file
    const csvContent = 'name,email\nJohn Doe,john@example.com';
    const csvPath = path.join(__dirname, '..', 'test-data', 'contacts.csv');
    const csvDir = path.dirname(csvPath);

    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }
    fs.writeFileSync(csvPath, csvContent);

    try {
      // Upload CSV file (this triggers table reload)
      await page.setInputFiles('#csvFileInput', csvPath);

      // Wait for preview
      await page.waitForSelector('[data-testid="preview-row"]', { state: 'visible', timeout: 10000 });

      // Select target table using keyboard to avoid click issues
      await page.waitForSelector('#tableSelect', { timeout: 5000 });
      await page.click('#tableSelect');
      await page.waitForSelector('[role="option"]', { state: 'visible' });

      // Use keyboard navigation to select
      await page.keyboard.press('ArrowDown'); // Move to first option
      await page.keyboard.press('Enter'); // Select it

      // Wait for column mapping section to appear
      await page.waitForSelector('[data-csv-column="name"]', { timeout: 10000 });

      // Check column mapping dropdowns exist
      const nameMapping = await page.locator('[data-csv-column="name"]').isVisible();
      const emailMapping = await page.locator('[data-csv-column="email"]').isVisible();
      expect(nameMapping).toBeTruthy();
      expect(emailMapping).toBeTruthy();

      // Map CSV columns to table columns using keyboard
      await page.click('[data-csv-column="name"]');
      await page.waitForSelector('[role="option"]', { state: 'visible' });
      await page.keyboard.press('ArrowDown'); // Move past __SKIP__
      await page.keyboard.press('ArrowDown'); // Move to full_name
      await page.keyboard.press('Enter');

      await page.click('[data-csv-column="email"]');
      await page.waitForSelector('[role="option"]', { state: 'visible' });
      await page.keyboard.press('ArrowDown'); // Move past __SKIP__
      await page.keyboard.press('ArrowDown'); // Move past contact_id
      await page.keyboard.press('ArrowDown'); // Move past full_name
      await page.keyboard.press('ArrowDown'); // Move to email_address
      await page.keyboard.press('Enter');
    } finally {
      // Cleanup
      if (fs.existsSync(csvPath)) {
        fs.unlinkSync(csvPath);
      }
    }
  });

  test('should import CSV data into database', async ({ page }) => {
    // Create test table
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT, price REAL, stock INTEGER)');
    });

    // Create test CSV file
    const csvContent = 'name,price,stock\nLaptop,999.99,10\nMouse,29.99,50\nKeyboard,79.99,25';
    const csvPath = path.join(__dirname, '..', 'test-data', 'products.csv');
    const csvDir = path.dirname(csvPath);

    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }
    fs.writeFileSync(csvPath, csvContent);

    try {
      // Upload CSV file
      await page.setInputFiles('#csvFileInput', csvPath);

      // Wait for preview
      await page.waitForSelector('[data-testid="preview-row"]', { state: 'visible', timeout: 10000 });

      // Select target table using keyboard
      await page.click('#tableSelect');
      await page.waitForSelector('[role="option"]', { state: 'visible' });
      await page.keyboard.press('ArrowDown'); // Move to first option
      await page.keyboard.press('Enter');

      // Wait for import button to appear
      await page.waitForSelector('#importButton', { timeout: 10000 });

      // Auto-map columns (same names)
      // Click import button
      await page.click('#importButton');

      // Wait for import success
      await page.waitForSelector('[data-testid="import-success"]', { state: 'visible', timeout: 15000 });

      // Verify import success message
      const successMessage = await page.locator('[data-testid="import-success"]').isVisible();
      expect(successMessage).toBeTruthy();

      // Verify data was imported
      const rowsImported = await page.evaluate(async () => {
        const db = (window as any).testDb;
        const result = await db.execute('SELECT COUNT(*) as count FROM products');
        return result.rows[0].values[0].value;
      });
      expect(rowsImported).toBe(3);

      // Verify actual data
      const products = await page.evaluate(async () => {
        const db = (window as any).testDb;
        const result = await db.execute('SELECT name, price, stock FROM products ORDER BY name');
        return result.rows.map((r: any) => ({
          name: r.values[0].value,
          price: r.values[1].value,
          stock: r.values[2].value
        }));
      });

      expect(products).toEqual([
        { name: 'Keyboard', price: 79.99, stock: 25 },
        { name: 'Laptop', price: 999.99, stock: 10 },
        { name: 'Mouse', price: 29.99, stock: 50 }
      ]);
    } finally {
      // Cleanup
      if (fs.existsSync(csvPath)) {
        fs.unlinkSync(csvPath);
      }
    }
  });

  test('should handle import options (delimiter, headers)', async ({ page }) => {
    // Create test table
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY, product TEXT, quantity INTEGER, revenue REAL)');
    });

    // Create test CSV file with semicolon delimiter
    const csvContent = 'product;quantity;revenue\nLaptop;5;4999.95\nMouse;20;599.80';
    const csvPath = path.join(__dirname, '..', 'test-data', 'sales.csv');
    const csvDir = path.dirname(csvPath);

    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }
    fs.writeFileSync(csvPath, csvContent);

    try {
      // Upload CSV file
      await page.setInputFiles('#csvFileInput', csvPath);

      // Wait for file to be processed
      await page.waitForFunction(() => {
        const input = document.getElementById('csvFileInput') as HTMLInputElement;
        return input && input.files && input.files.length > 0;
      }, { timeout: 5000 });

      // Change delimiter to semicolon
      await page.click('#delimiterSelect');
      await page.waitForSelector('[role="option"]', { state: 'visible' });
      await page.click('text=Semicolon (;)');

      // Wait for re-parse with new delimiter
      await page.waitForSelector('[data-testid="preview-row"]', { state: 'visible', timeout: 10000 });

      // Select target table using keyboard
      await page.click('#tableSelect');
      await page.waitForSelector('[role="option"]', { state: 'visible' });
      await page.keyboard.press('ArrowDown'); // Move to first option
      await page.keyboard.press('Enter');

      // Wait for import button to indicate table selected
      await page.waitForSelector('#importButton', { timeout: 10000 });

      // Ensure "Has Headers" checkbox is checked (should always be visible)
      const hasHeadersCheckbox = await page.locator('#hasHeadersCheck');
      const isChecked = await hasHeadersCheckbox.isChecked();
      if (!isChecked) {
        await hasHeadersCheckbox.check();
      }

      // Import
      await page.click('#importButton');

      // Wait for import success
      await page.waitForSelector('[data-testid="import-success"]', { state: 'visible', timeout: 15000 });

      // Verify data was imported correctly
      const rowsImported = await page.evaluate(async () => {
        const db = (window as any).testDb;
        const result = await db.execute('SELECT COUNT(*) as count FROM sales');
        return result.rows[0].values[0].value;
      });
      expect(rowsImported).toBe(2);
    } finally {
      // Cleanup
      if (fs.existsSync(csvPath)) {
        fs.unlinkSync(csvPath);
      }
    }
  });

  test('should show preview of first 10 rows', async ({ page }) => {
    // Create test CSV file with 15 rows
    let csvContent = 'id,name\n';
    for (let i = 1; i <= 15; i++) {
      csvContent += `${i},User ${i}\n`;
    }
    const csvPath = path.join(__dirname, '..', 'test-data', 'preview.csv');
    const csvDir = path.dirname(csvPath);

    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }
    fs.writeFileSync(csvPath, csvContent.trim());

    try {
      // Upload CSV file
      await page.setInputFiles('#csvFileInput', csvPath);

      // Wait for preview
      await page.waitForSelector('[data-testid="preview-row"]', { state: 'visible', timeout: 10000 });

      // Check preview shows max 10 rows
      const previewRows = await page.locator('[data-testid="preview-row"]').count();
      expect(previewRows).toBeLessThanOrEqual(10);

      // Check total row count is displayed
      const totalRowsText = await page.locator('[data-testid="total-rows"]').textContent();
      expect(totalRowsText).toContain('15');
    } finally {
      // Cleanup
      if (fs.existsSync(csvPath)) {
        fs.unlinkSync(csvPath);
      }
    }
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Create test table
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('CREATE TABLE IF NOT EXISTS strict_users (id INTEGER PRIMARY KEY, name TEXT)');
    });

    // Create CSV with duplicate IDs (PRIMARY KEY constraint violation)
    const csvContent = 'id,name\n1,John Doe\n1,Jane Smith\n2,Bob Jones';
    const csvPath = path.join(__dirname, '..', 'test-data', 'invalid.csv');
    const csvDir = path.dirname(csvPath);

    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }
    fs.writeFileSync(csvPath, csvContent);

    try {
      // Upload CSV file
      await page.setInputFiles('#csvFileInput', csvPath);

      // Wait for preview
      await page.waitForSelector('[data-testid="preview-row"]', { state: 'visible', timeout: 10000 });

      // Select target table
      await page.click('#tableSelect');
      await page.waitForSelector('[role="option"]', { state: 'visible' });
      await page.click('text=strict_users');

      // Wait for import button to appear
      await page.waitForSelector('#importButton', { timeout: 10000 });

      // Try to import
      await page.click('#importButton');

      // Check for error message
      await page.waitForSelector('[data-testid="import-error"]', { state: 'visible', timeout: 15000 });
      const errorMessage = await page.locator('[data-testid="import-error"]').isVisible();
      expect(errorMessage).toBeTruthy();
    } finally {
      // Cleanup
      if (fs.existsSync(csvPath)) {
        fs.unlinkSync(csvPath);
      }
    }
  });
});
