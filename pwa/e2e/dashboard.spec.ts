import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Dashboard Builder E2E', () => {
  let TEST_DB_NAME: string;

  test.beforeEach(async ({ page }, testInfo) => {
    // MANDATORY: Use worker index AND timestamp for unique database (INSTRUCTIONS.md Rule #3)
    TEST_DB_NAME = `test-dashboard-w${testInfo.parallelIndex}_${Date.now()}.db`;
    
    // Navigate FIRST to establish security context
    await page.goto('/db');
    await page.waitForLoadState('networkidle');

    // MANDATORY: Clean ALL state from previous tests (INSTRUCTIONS.md - Zero Tolerance for Flakiness)
    await page.evaluate(async () => {
      const win = window as any;
      try {
        if (win.testDb) {
          await win.testDb.close();
          win.testDb = null;
        }
      } catch (err) {
        console.warn('[TEST] Failed to close existing testDb', err);
      }

      // Clear ALL localStorage
      localStorage.clear();
      
      // Delete ALL indexedDB databases
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name) {
          await indexedDB.deleteDatabase(db.name);
        }
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#dbManagement', { timeout: 10000 });

    // Create database
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput', { timeout: 5000 });
    await page.fill('#dbNameInput', TEST_DB_NAME);
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, TEST_DB_NAME, { timeout: 15000 });

    // Navigate to dashboard page
    await page.goto('/db/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for database to be ready
    await page.waitForFunction(() => {
      const db = (window as any).testDb;
      return db && db.db;
    }, { timeout: 15000 });

    // Poll until database can execute queries
    let isReady = false;
    for (let i = 0; i < 100 && !isReady; i++) {
      isReady = await page.evaluate(async () => {
        try {
          const db = (window as any).testDb;
          if (!db) return false;
          await db.db.allowNonLeaderWrites(true);
          await db.execute('SELECT 1');
          return true;
        } catch {
          return false;
        }
      });
      if (!isReady) {
        }
    }

    if (!isReady) {
      throw new Error('Database did not become ready within timeout');
    }

    // Create test table with data for charts
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (!db) throw new Error('Database not initialized');
      
      await db.execute('DROP TABLE IF EXISTS sales');
      await db.execute(`
        CREATE TABLE sales (
          id INTEGER PRIMARY KEY,
          product TEXT NOT NULL,
          amount REAL NOT NULL,
          date TEXT NOT NULL
        )
      `);
      
      await db.execute("INSERT INTO sales (product, amount, date) VALUES ('Laptop', 1299.99, '2025-01-01')");
      await db.execute("INSERT INTO sales (product, amount, date) VALUES ('Mouse', 29.99, '2025-01-02')");
      await db.execute("INSERT INTO sales (product, amount, date) VALUES ('Keyboard', 89.99, '2025-01-03')");
      await db.execute("INSERT INTO sales (product, amount, date) VALUES ('Monitor', 349.99, '2025-01-04')");
      await db.execute("INSERT INTO sales (product, amount, date) VALUES ('Laptop', 1299.99, '2025-01-05')");
      
      await db.db.sync();
    });
  });

  test('should navigate to dashboard page', async ({ page }) => {
    await expect(page).toHaveURL(/\/db\/dashboard/);
  });

  test('should show Dashboard Builder heading', async ({ page }) => {
    await expect(page.locator('h1, h2').filter({ hasText: /Dashboard/i })).toBeVisible({ timeout: 10000 });
  });

  test('should show Add Chart button', async ({ page }) => {
    const addChartButton = page.locator('#addChartButton, button:has-text("Add Chart")').first();
    await expect(addChartButton).toBeVisible({ timeout: 10000 });
  });

  test('should open Add Chart dialog when button clicked', async ({ page }) => {
    const addChartButton = page.locator('#addChartButton, button:has-text("Add Chart")').first();
    await addChartButton.click();
    
    // Dialog should be visible
    const dialog = page.locator('[role="dialog"], .dialog').first();
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });

  test('should have query input in Add Chart dialog', async ({ page }) => {
    await page.locator('#addChartButton, button:has-text("Add Chart")').first().click();
    await page.waitForSelector('[role="dialog"], .dialog', { timeout: 5000 });
    
    const queryInput = page.locator('#chartQuery, textarea[placeholder*="query" i]').first();
    await expect(queryInput).toBeVisible();
  });

  test('should have chart title input in Add Chart dialog', async ({ page }) => {
    await page.locator('#addChartButton, button:has-text("Add Chart")').first().click();
    await page.waitForSelector('[role="dialog"], .dialog', { timeout: 5000 });
    
    const titleInput = page.locator('#chartTitle, input[placeholder*="title" i]').first();
    await expect(titleInput).toBeVisible();
  });

  test('should have chart type selector in Add Chart dialog', async ({ page }) => {
    await page.locator('#addChartButton, button:has-text("Add Chart")').first().click();
    await page.waitForSelector('[role="dialog"], .dialog', { timeout: 5000 });
    
    const chartTypeSelect = page.locator('#chartType, select, [role="combobox"]').first();
    await expect(chartTypeSelect).toBeVisible();
  });

  test('should add chart to dashboard successfully', async ({ page }) => {
    // Open Add Chart dialog
    await page.locator('#addChartButton, button:has-text("Add Chart")').first().click();
    await page.waitForSelector('[role="dialog"], .dialog', { timeout: 5000 });
    
    // Fill in chart details
    await page.locator('#chartTitle, input[placeholder*="title" i]').first().fill('Sales by Product');
    await page.locator('#chartQuery, textarea[placeholder*="query" i]').first().fill('SELECT product, SUM(amount) as total FROM sales GROUP BY product');
    
    // Chart type defaults to bar, no need to change it
    
    // Add the chart
    const addButton = page.locator('[role="dialog"] button:has-text("Add")').first();
    await addButton.click();
    
    // Chart should appear on dashboard
    await expect(page.locator('.dashboard-chart, [data-testid="dashboard-chart"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display chart with title', async ({ page }) => {
    // Add a chart
    await page.locator('#addChartButton, button:has-text("Add Chart")').first().click();
    await page.waitForSelector('[role="dialog"], .dialog', { timeout: 5000 });
    
    await page.locator('#chartTitle, input[placeholder*="title" i]').first().fill('Product Sales');
    await page.locator('#chartQuery, textarea[placeholder*="query" i]').first().fill('SELECT product, amount FROM sales');
    await page.locator('[role="dialog"] button:has-text("Add")').first().click();
    
    // Check title is displayed
    await expect(page.locator('.dashboard-chart, [data-testid="dashboard-chart"]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Product Sales').first()).toBeVisible();
  });

  test('should allow adding multiple charts', async ({ page }) => {
    // Add first chart
    await page.locator('#addChartButton, button:has-text("Add Chart")').first().click();
    await page.waitForSelector('[role="dialog"], .dialog', { timeout: 5000 });
    await page.locator('#chartTitle, input[placeholder*="title" i]').first().fill('Chart 1');
    await page.locator('#chartQuery, textarea[placeholder*="query" i]').first().fill('SELECT product, amount FROM sales LIMIT 3');
    await page.locator('[role="dialog"] button:has-text("Add")').first().click();
    await expect(page.locator('.dashboard-chart, [data-testid="dashboard-chart"]').first()).toBeVisible({ timeout: 10000 });
    
    // Add second chart
    await page.locator('#addChartButton, button:has-text("Add Chart")').first().click();
    await page.waitForSelector('[role="dialog"], .dialog', { timeout: 5000 });
    await page.locator('#chartTitle, input[placeholder*="title" i]').first().fill('Chart 2');
    await page.locator('#chartQuery, textarea[placeholder*="query" i]').first().fill('SELECT date, amount FROM sales LIMIT 3');
    await page.locator('[role="dialog"] button:has-text("Add")').first().click();
    
    // Should have 2 charts
    await expect(page.locator('.dashboard-chart, [data-testid="dashboard-chart"]')).toHaveCount(2, { timeout: 10000 });
  });

  test('should show Remove button for each chart', async ({ page }) => {
    // Add a chart
    await page.locator('#addChartButton, button:has-text("Add Chart")').first().click();
    await page.waitForSelector('[role="dialog"], .dialog', { timeout: 5000 });
    await page.locator('#chartTitle, input[placeholder*="title" i]').first().fill('Test Chart');
    await page.locator('#chartQuery, textarea[placeholder*="query" i]').first().fill('SELECT * FROM sales LIMIT 1');
    await page.locator('[role="dialog"] button:has-text("Add")').first().click();
    await expect(page.locator('.dashboard-chart, [data-testid="dashboard-chart"]').first()).toBeVisible({ timeout: 10000 });
    
    // Remove button should be visible
    const removeButton = page.locator('.dashboard-chart, [data-testid="dashboard-chart"]').first().locator('button:has-text("Remove"), button[aria-label*="Remove" i]').first();
    await expect(removeButton).toBeVisible();
  });

  test('should remove chart from dashboard', async ({ page }) => {
    // Add a chart
    await page.locator('#addChartButton, button:has-text("Add Chart")').first().click();
    await page.waitForSelector('[role="dialog"], .dialog', { timeout: 5000 });
    await page.locator('#chartTitle, input[placeholder*="title" i]').first().fill('Removable Chart');
    await page.locator('#chartQuery, textarea[placeholder*="query" i]').first().fill('SELECT * FROM sales LIMIT 1');
    await page.locator('[role="dialog"] button:has-text("Add")').first().click();
    await expect(page.locator('.dashboard-chart, [data-testid="dashboard-chart"]').first()).toBeVisible({ timeout: 10000 });
    
    // Remove the chart
    const removeButton = page.locator('.dashboard-chart, [data-testid="dashboard-chart"]').first().locator('button:has-text("Remove"), button[aria-label*="Remove" i]').first();
    await removeButton.click();
    
    // Chart should be removed
    await expect(page.locator('.dashboard-chart, [data-testid="dashboard-chart"]')).toHaveCount(0, { timeout: 5000 });
  });

  test('should save dashboard layout to localStorage', async ({ page }) => {
    // Add a chart
    await page.locator('#addChartButton, button:has-text("Add Chart")').first().click();
    await page.waitForSelector('[role="dialog"], .dialog', { timeout: 5000 });
    await page.locator('#chartTitle, input[placeholder*="title" i]').first().fill('Persistent Chart');
    await page.locator('#chartQuery, textarea[placeholder*="query" i]').first().fill('SELECT * FROM sales');
    await page.locator('[role="dialog"] button:has-text("Add")').first().click();
    await expect(page.locator('.dashboard-chart, [data-testid="dashboard-chart"]').first()).toBeVisible({ timeout: 10000 });
    
    // Check localStorage has the dashboard layout
    const savedLayout = await page.evaluate(() => {
      const stored = localStorage.getItem('absurder-sql-dashboard-layouts');
      return stored ? JSON.parse(stored) : null;
    });
    
    expect(savedLayout).toBeTruthy();
    expect(savedLayout[TEST_DB_NAME]).toBeTruthy();
    expect(savedLayout[TEST_DB_NAME].length).toBe(1);
  });

  test('should restore dashboard layout on page load', async ({ page }) => {
    // Add a chart
    await page.locator('#addChartButton, button:has-text("Add Chart")').first().click();
    await page.waitForSelector('[role="dialog"], .dialog', { timeout: 5000 });
    await page.locator('#chartTitle, input[placeholder*="title" i]').first().fill('Restored Chart');
    await page.locator('#chartQuery, textarea[placeholder*="query" i]').first().fill('SELECT * FROM sales LIMIT 2');
    await page.locator('[role="dialog"] button:has-text("Add")').first().click();
    await expect(page.locator('.dashboard-chart, [data-testid="dashboard-chart"]').first()).toBeVisible({ timeout: 10000 });
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Chart should be restored
    await expect(page.locator('.dashboard-chart, [data-testid="dashboard-chart"]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Restored Chart').first()).toBeVisible();
  });

  test('should show grid layout for multiple charts', async ({ page }) => {
    // Add multiple charts
    for (let i = 1; i <= 3; i++) {
      await page.locator('#addChartButton, button:has-text("Add Chart")').first().click();
      await page.waitForSelector('[role="dialog"], .dialog', { timeout: 5000 });
      await page.locator('#chartTitle, input[placeholder*="title" i]').first().fill(`Chart ${i}`);
      await page.locator('#chartQuery, textarea[placeholder*="query" i]').first().fill(`SELECT * FROM sales LIMIT ${i}`);
      await page.locator('[role="dialog"] button:has-text("Add")').first().click();
    }
    
    // Should have 3 charts in grid
    await expect(page.locator('.dashboard-chart, [data-testid="dashboard-chart"]')).toHaveCount(3, { timeout: 10000 });
    
    // Check grid layout is applied
    const gridContainer = page.locator('.dashboard-grid, [class*="grid"]').first();
    await expect(gridContainer).toBeVisible();
  });

  test('should show empty state when no charts', async ({ page }) => {
    // No charts added - should show empty state
    const emptyMessage = page.locator('text=/no charts|add a chart|get started/i').first();
    await expect(emptyMessage).toBeVisible({ timeout: 10000 });
  });

  test('should handle chart with invalid SQL gracefully', async ({ page }) => {
    // Add chart with invalid SQL
    await page.locator('#addChartButton, button:has-text("Add Chart")').first().click();
    await page.waitForSelector('[role="dialog"], .dialog', { timeout: 5000 });
    await page.locator('#chartTitle, input[placeholder*="title" i]').first().fill('Invalid Chart');
    await page.locator('#chartQuery, textarea[placeholder*="query" i]').first().fill('SELECT * FROM nonexistent_table');
    await page.locator('[role="dialog"] button:has-text("Add")').first().click();
    
    // Should show error or chart with error message
    const errorMessage = page.locator('text=/error|failed|invalid/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('should close Add Chart dialog when Cancel clicked', async ({ page }) => {
    await page.locator('#addChartButton, button:has-text("Add Chart")').first().click();
    await page.waitForSelector('[role="dialog"], .dialog', { timeout: 5000 });
    
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    await cancelButton.click();
    
    // Dialog should be closed
    const dialog = page.locator('[role="dialog"], .dialog').first();
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });

  test.afterEach(async ({ page }) => {
    // MANDATORY: Cleanup after each test (INSTRUCTIONS.md Rule #5)
    if (TEST_DB_NAME) {
      await page.evaluate(async (dbName) => {
        const db = (window as any).testDb;
        if (db) {
          try { await db.close(); } catch {}
        }
        try { await indexedDB.deleteDatabase(dbName); } catch {}
        try { localStorage.removeItem('absurder-sql-database-store'); } catch {}
      }, TEST_DB_NAME).catch(() => {});
    }
  });
});
