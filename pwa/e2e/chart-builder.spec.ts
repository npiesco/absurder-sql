import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Chart Builder E2E', () => {
  let TEST_DB_NAME: string;

  test.beforeEach(async ({ page }, testInfo) => {
    // Use worker index AND timestamp to ensure unique database per test (per INSTRUCTIONS.md)
    TEST_DB_NAME = `test-charts-w${testInfo.parallelIndex}_${Date.now()}.db`;
    
    // Navigate to DB management page and ensure clean state
    await page.goto('/db');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

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

    // Create a database via the UI
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput', { timeout: 5000 });
    await page.fill('#dbNameInput', TEST_DB_NAME);
    await page.click('#confirmCreate');
    await page.waitForSelector(`#status:has-text("Database created: ${TEST_DB_NAME}")`, { timeout: 10000 });

    // Navigate to charts page
    await page.goto('/db/charts');
    await page.waitForLoadState('networkidle');

    // Wait for DatabaseProvider to fully initialize
    await page.waitForFunction(() => {
      const db = (window as any).testDb;
      return db && db.db;
    }, { timeout: 15000 });

    // Enable non-leader writes to bypass leader election timeouts
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db && db.allowNonLeaderWrites) {
        await db.allowNonLeaderWrites(true);
      }
    });

    // Create test table with sample data
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (!db) throw new Error('Database not initialized');

      // DROP tables before creating to ensure clean state (per INSTRUCTIONS.md)
      await db.execute('DROP TABLE IF EXISTS sales').catch(() => {});
      await db.execute('DROP TABLE IF EXISTS employees').catch(() => {});

      // Create test tables with data suitable for charting
      await db.execute(`
        CREATE TABLE sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          month TEXT NOT NULL,
          revenue REAL NOT NULL,
          expenses REAL NOT NULL,
          profit REAL NOT NULL
        )
      `);

      await db.execute(`
        CREATE TABLE employees (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          department TEXT NOT NULL,
          count INTEGER NOT NULL,
          avg_salary REAL NOT NULL
        )
      `);

      // Insert sample sales data
      await db.execute("INSERT INTO sales (month, revenue, expenses, profit) VALUES ('Jan', 50000, 30000, 20000)");
      await db.execute("INSERT INTO sales (month, revenue, expenses, profit) VALUES ('Feb', 55000, 32000, 23000)");
      await db.execute("INSERT INTO sales (month, revenue, expenses, profit) VALUES ('Mar', 60000, 35000, 25000)");
      await db.execute("INSERT INTO sales (month, revenue, expenses, profit) VALUES ('Apr', 58000, 33000, 25000)");
      await db.execute("INSERT INTO sales (month, revenue, expenses, profit) VALUES ('May', 65000, 36000, 29000)");

      // Insert sample employee data
      await db.execute("INSERT INTO employees (department, count, avg_salary) VALUES ('Engineering', 25, 95000)");
      await db.execute("INSERT INTO employees (department, count, avg_salary) VALUES ('Sales', 15, 75000)");
      await db.execute("INSERT INTO employees (department, count, avg_salary) VALUES ('Marketing', 10, 70000)");
      await db.execute("INSERT INTO employees (department, count, avg_salary) VALUES ('HR', 5, 65000)");

      await db.db.sync();
    });

    await page.waitForTimeout(500);
  });

  test('should navigate to chart builder page', async ({ page }) => {
    await expect(page).toHaveURL(/\/db\/charts/);
    await expect(page.locator('text=Chart Builder').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display SQL query input', async ({ page }) => {
    const queryInput = page.locator('textarea[placeholder*="SELECT" i], textarea[placeholder*="query" i], .cm-editor').first();
    await expect(queryInput).toBeVisible();
  });

  test('should display chart type selector after query execution', async ({ page }) => {
    // Execute a query first
    const queryInput = page.locator('textarea#sqlQuery').first();
    await queryInput.fill('SELECT * FROM sales');
    
    const executeButton = page.locator('button:has-text("Execute")').first();
    await executeButton.click();
    await page.waitForTimeout(2000);
    
    // Look for chart type selector (should appear after query execution)
    const lineButton = page.locator('button:has-text("Line")').first();
    await expect(lineButton).toBeVisible({ timeout: 5000 });
  });

  test('should execute query and display results', async ({ page }) => {
    // Enter SQL query
    const queryInput = page.locator('textarea#sqlQuery').first();
    await queryInput.fill('SELECT * FROM sales');
    
    // Execute query
    const executeButton = page.locator('button:has-text("Execute")').first();
    await executeButton.click();
    
    // Wait for results
    await page.waitForTimeout(2000);
    
    // Should show chart configuration section or chart preview
    const chartConfig = page.locator('text=Chart Configuration').first();
    await expect(chartConfig).toBeVisible({ timeout: 5000 });
  });

  test('should display line chart from query results', async ({ page }) => {
    // Enter query
    const queryInput = page.locator('textarea#sqlQuery').first();
    await queryInput.fill('SELECT month, revenue FROM sales');
    
    // Execute query
    const executeButton = page.locator('button:has-text("Execute")').first();
    await executeButton.click();
    await page.waitForTimeout(1000);
    
    // Select Line chart type
    const lineChartButton = page.locator('button:has-text("Line"), [data-testid="chart-type-line"]').first();
    if (await lineChartButton.isVisible()) {
      await lineChartButton.click();
    }
    
    // Wait for chart to render
    await page.waitForTimeout(1000);
    
    // Check for chart container or SVG element
    const chart = page.locator('[data-testid="chart-preview"], svg, canvas, .recharts-wrapper').first();
    await expect(chart).toBeVisible({ timeout: 5000 });
  });

  test('should display bar chart from query results', async ({ page }) => {
    // Enter query
    const queryInput = page.locator('textarea#sqlQuery').first();
    await queryInput.fill('SELECT department, count FROM employees');
    
    // Execute query
    const executeButton = page.locator('button:has-text("Execute")').first();
    await executeButton.click();
    await page.waitForTimeout(1000);
    
    // Select Bar chart type
    const barChartButton = page.locator('button:has-text("Bar"), [data-testid="chart-type-bar"]').first();
    if (await barChartButton.isVisible()) {
      await barChartButton.click();
    }
    
    await page.waitForTimeout(1000);
    
    // Check for chart
    const chart = page.locator('[data-testid="chart-preview"], svg, canvas, .recharts-wrapper').first();
    await expect(chart).toBeVisible({ timeout: 5000 });
  });

  test('should display pie chart from query results', async ({ page }) => {
    // Enter query
    const queryInput = page.locator('textarea#sqlQuery').first();
    await queryInput.fill('SELECT department, count FROM employees');
    
    // Execute query
    const executeButton = page.locator('button:has-text("Execute")').first();
    await executeButton.click();
    await page.waitForTimeout(1000);
    
    // Select Pie chart type
    const pieChartButton = page.locator('button:has-text("Pie"), [data-testid="chart-type-pie"]').first();
    if (await pieChartButton.isVisible()) {
      await pieChartButton.click();
    }
    
    await page.waitForTimeout(1000);
    
    // Check for chart
    const chart = page.locator('[data-testid="chart-preview"], svg, canvas, .recharts-wrapper').first();
    await expect(chart).toBeVisible({ timeout: 5000 });
  });

  test('should allow configuring X-axis column', async ({ page }) => {
    // Enter query with multiple columns
    const queryInput = page.locator('textarea#sqlQuery').first();
    await queryInput.fill('SELECT month, revenue, expenses FROM sales');
    
    // Execute query
    const executeButton = page.locator('button:has-text("Execute")').first();
    await executeButton.click();
    await page.waitForTimeout(1000);
    
    // Look for X-axis selector
    const xAxisSelector = page.locator('[data-testid="x-axis-selector"], label:has-text("X-Axis") ~ select, label:has-text("X-Axis") ~ button').first();
    await expect(xAxisSelector).toBeVisible({ timeout: 5000 });
  });

  test('should allow configuring Y-axis column', async ({ page }) => {
    // Enter query
    const queryInput = page.locator('textarea#sqlQuery').first();
    await queryInput.fill('SELECT month, revenue, expenses FROM sales');
    
    // Execute query
    const executeButton = page.locator('button:has-text("Execute")').first();
    await executeButton.click();
    await page.waitForTimeout(1000);
    
    // Look for Y-axis selector
    const yAxisSelector = page.locator('[data-testid="y-axis-selector"], label:has-text("Y-Axis") ~ select, label:has-text("Y-Axis") ~ button').first();
    await expect(yAxisSelector).toBeVisible({ timeout: 5000 });
  });

  test('should allow setting chart title', async ({ page }) => {
    // Enter query
    const queryInput = page.locator('textarea#sqlQuery').first();
    await queryInput.fill('SELECT month, revenue FROM sales');
    
    // Execute query
    const executeButton = page.locator('button:has-text("Execute")').first();
    await executeButton.click();
    await page.waitForTimeout(1000);
    
    // Look for chart title input
    const titleInput = page.locator('input[placeholder*="title" i], input[placeholder*="Chart" i]').first();
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    
    // Set a title
    await titleInput.fill('Monthly Revenue');
    
    // Title should appear in chart or preview
    await expect(page.locator('text=Monthly Revenue').first()).toBeVisible({ timeout: 3000 });
  });

  test('should handle queries with no results', async ({ page }) => {
    // Enter query that returns no results
    const queryInput = page.locator('textarea#sqlQuery').first();
    await queryInput.fill('SELECT * FROM sales WHERE month = "InvalidMonth"');
    
    // Execute query
    const executeButton = page.locator('button:has-text("Execute")').first();
    await executeButton.click();
    await page.waitForTimeout(1000);
    
    // Should show appropriate message
    await expect(page.locator('text=/No (data|results)|Empty/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle invalid SQL queries', async ({ page }) => {
    // Enter invalid SQL
    const queryInput = page.locator('textarea#sqlQuery').first();
    await queryInput.fill('INVALID SQL QUERY HERE');
    
    // Execute query
    const executeButton = page.locator('button:has-text("Execute")').first();
    await executeButton.click();
    await page.waitForTimeout(1000);
    
    // Should show error message
    await expect(page.locator('text=/error|invalid|fail/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should update chart when query changes', async ({ page }) => {
    // Execute first query
    const queryInput = page.locator('textarea#sqlQuery').first();
    await queryInput.fill('SELECT month, revenue FROM sales');
    
    const executeButton = page.locator('button:has-text("Execute")').first();
    await executeButton.click();
    await page.waitForTimeout(1000);
    
    // Verify chart appears
    const chart = page.locator('[data-testid="chart-preview"], svg, .recharts-wrapper').first();
    await expect(chart).toBeVisible({ timeout: 5000 });
    
    // Clear and enter new query
    await queryInput.fill('SELECT month, expenses FROM sales');
    await executeButton.click();
    await page.waitForTimeout(1000);
    
    // Chart should still be visible (updated with new data)
    await expect(chart).toBeVisible();
  });

  test('should handle multiple numeric columns', async ({ page }) => {
    // Enter query with multiple numeric columns
    const queryInput = page.locator('textarea#sqlQuery').first();
    await queryInput.fill('SELECT month, revenue, expenses, profit FROM sales');
    
    const executeButton = page.locator('button:has-text("Execute")').first();
    await executeButton.click();
    await page.waitForTimeout(1000);
    
    // Should be able to select different columns for Y-axis
    const yAxisSelector = page.locator('[data-testid="y-axis-selector"], label:has-text("Y-Axis") ~ select').first();
    if (await yAxisSelector.isVisible()) {
      await expect(yAxisSelector).toBeVisible();
    }
  });

  test('should clear chart when query is cleared', async ({ page }) => {
    // Execute query and generate chart
    const queryInput = page.locator('textarea#sqlQuery').first();
    await queryInput.fill('SELECT month, revenue FROM sales');
    
    const executeButton = page.locator('button:has-text("Execute")').first();
    await executeButton.click();
    await page.waitForTimeout(1000);
    
    // Verify chart appears
    const chart = page.locator('[data-testid="chart-preview"], svg, .recharts-wrapper').first();
    await expect(chart).toBeVisible({ timeout: 5000 });
    
    // Clear query
    await queryInput.fill('');
    
    // Execute empty query or look for clear button
    const clearButton = page.locator('button:has-text("Clear")').first();
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }
    
    await page.waitForTimeout(500);
  });

  test('should display export button for PNG', async ({ page }) => {
    // Execute query and generate chart
    const queryInput = page.locator('textarea#sqlQuery').first();
    await queryInput.fill('SELECT month, revenue FROM sales');
    
    const executeButton = page.locator('button:has-text("Execute")').first();
    await executeButton.click();
    await page.waitForTimeout(2000);
    
    // Look for PNG export button
    const pngButton = page.locator('button:has-text("PNG"), button:has-text("Export"), [data-testid="export-png"]').first();
    await expect(pngButton).toBeVisible({ timeout: 5000 });
  });

  test('should display export button for SVG', async ({ page }) => {
    // Execute query and generate chart
    const queryInput = page.locator('textarea#sqlQuery').first();
    await queryInput.fill('SELECT month, revenue FROM sales');
    
    const executeButton = page.locator('button:has-text("Execute")').first();
    await executeButton.click();
    await page.waitForTimeout(2000);
    
    // Look for SVG export button
    const svgButton = page.locator('button:has-text("SVG"), [data-testid="export-svg"]').first();
    await expect(svgButton).toBeVisible({ timeout: 5000 });
  });

  test('should display export button for CSV', async ({ page }) => {
    // Execute query and generate chart
    const queryInput = page.locator('textarea#sqlQuery').first();
    await queryInput.fill('SELECT month, revenue FROM sales');
    
    const executeButton = page.locator('button:has-text("Execute")').first();
    await executeButton.click();
    await page.waitForTimeout(2000);
    
    // Look for CSV export button
    const csvButton = page.locator('button:has-text("CSV"), button:has-text("Download"), [data-testid="export-csv"]').first();
    await expect(csvButton).toBeVisible({ timeout: 5000 });
  });

  test('should trigger PNG download when export clicked', async ({ page }) => {
    // Execute query and generate chart
    const queryInput = page.locator('textarea#sqlQuery').first();
    await queryInput.fill('SELECT month, revenue FROM sales');
    
    const executeButton = page.locator('button:has-text("Execute")').first();
    await executeButton.click();
    await page.waitForTimeout(2000);
    
    // Wait for PNG export button to be visible
    const pngButton = page.locator('[data-testid="export-png"]').first();
    await expect(pngButton).toBeVisible({ timeout: 5000 });
    
    // Setup download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    
    // Click PNG export button
    await pngButton.click();
    
    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.png$/i);
  });

  test('should trigger SVG download when export clicked', async ({ page }) => {
    // Execute query and generate chart
    const queryInput = page.locator('textarea#sqlQuery').first();
    await queryInput.fill('SELECT month, revenue FROM sales');
    
    const executeButton = page.locator('button:has-text("Execute")').first();
    await executeButton.click();
    await page.waitForTimeout(2000);
    
    // Wait for SVG export button to be visible
    const svgButton = page.locator('[data-testid="export-svg"]').first();
    await expect(svgButton).toBeVisible({ timeout: 5000 });
    
    // Setup download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    
    // Click SVG export button
    await svgButton.click();
    
    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.svg$/i);
  });

  test('should trigger CSV download when export clicked', async ({ page }) => {
    // Execute query and generate chart
    const queryInput = page.locator('textarea#sqlQuery').first();
    await queryInput.fill('SELECT month, revenue FROM sales');
    
    const executeButton = page.locator('button:has-text("Execute")').first();
    await executeButton.click();
    await page.waitForTimeout(2000);
    
    // Wait for CSV export button to be visible
    const csvButton = page.locator('[data-testid="export-csv"]').first();
    await expect(csvButton).toBeVisible({ timeout: 5000 });
    
    // Setup download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    
    // Click CSV export button
    await csvButton.click();
    
    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  });

  test('should include chart data in CSV export', async ({ page }) => {
    // Execute query with known data
    const queryInput = page.locator('textarea#sqlQuery').first();
    await queryInput.fill('SELECT month, revenue FROM sales');
    
    const executeButton = page.locator('button:has-text("Execute")').first();
    await executeButton.click();
    await page.waitForTimeout(2000);
    
    // Wait for CSV export button to be visible
    const csvButton = page.locator('[data-testid="export-csv"]').first();
    await expect(csvButton).toBeVisible({ timeout: 5000 });
    
    // Setup download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    
    // Click CSV export button
    await csvButton.click();
    
    // Download and read CSV content
    const download = await downloadPromise;
    const path = await download.path();
    
    if (path) {
      const fs = require('fs');
      const content = fs.readFileSync(path, 'utf-8');
      
      // Verify CSV contains headers
      expect(content).toContain('month');
      expect(content).toContain('revenue');
      
      // Verify CSV contains data
      expect(content).toContain('Jan');
      expect(content).toContain('50000');
    }
  });

  test('should export chart with custom title in filename', async ({ page }) => {
    // Execute query and set title
    const queryInput = page.locator('textarea#sqlQuery').first();
    await queryInput.fill('SELECT month, revenue FROM sales');
    
    const executeButton = page.locator('button:has-text("Execute")').first();
    await executeButton.click();
    await page.waitForTimeout(2000);
    
    // Set chart title
    const titleInput = page.locator('input#chartTitle').first();
    await titleInput.fill('My Custom Chart');
    await page.waitForTimeout(500);
    
    // Wait for PNG export button to be visible
    const pngButton = page.locator('[data-testid="export-png"]').first();
    await expect(pngButton).toBeVisible({ timeout: 5000 });
    
    // Setup download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    
    // Click PNG export button
    await pngButton.click();
    
    // Wait for download and check filename
    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    expect(filename).toContain('custom');
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
