import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Column Finder E2E', () => {
  let TEST_DB_NAME: string;

  test.beforeEach(async ({ page }, testInfo) => {
    // Use worker index AND timestamp to ensure unique database per test (per INSTRUCTIONS.md)
    TEST_DB_NAME = `test-column-finder-w${testInfo.parallelIndex}_${Date.now()}.db`;
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

    // Create a database via the UI (dialog-based)
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput', { timeout: 5000 });
    await page.fill('#dbNameInput', TEST_DB_NAME);
    await page.click('#confirmCreate');
    await page.waitForSelector(`#status:has-text("Database created: ${TEST_DB_NAME}")`, { timeout: 10000 });

    // Navigate to columns page first
    await page.goto('/db/columns');
    await page.waitForLoadState('networkidle');

    // Wait for DatabaseProvider to fully initialize and expose testDb
    await page.waitForFunction(() => {
      const db = (window as any).testDb;
      return db && db.db; // Ensure DatabaseClient is initialized with db instance
    }, { timeout: 15000 });

    // Enable non-leader writes to bypass leader election timeouts
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db && db.allowNonLeaderWrites) {
        await db.allowNonLeaderWrites(true);
      }
    });

    // Create test tables with various columns
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (!db) throw new Error('Database not initialized');

      // DROP tables before creating to ensure clean state (per INSTRUCTIONS.md)
      await db.execute('DROP TABLE IF EXISTS orders').catch(() => {});
      await db.execute('DROP TABLE IF EXISTS products').catch(() => {});
      await db.execute('DROP TABLE IF EXISTS users').catch(() => {});

      // Create tables with different column patterns
      await db.execute(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER UNIQUE NOT NULL,
          username TEXT NOT NULL,
          email TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT
        )
      `);

      await db.execute(`
        CREATE TABLE products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          price REAL NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.execute(`
        CREATE TABLE orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id TEXT UNIQUE NOT NULL,
          user_id INTEGER NOT NULL,
          product_id TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(user_id),
          FOREIGN KEY (product_id) REFERENCES products(product_id)
        )
      `);

      await db.execute(`
        CREATE TABLE settings (
          setting_key TEXT PRIMARY KEY,
          setting_value TEXT NOT NULL,
          description TEXT
        )
      `);

      // Sync database to persist changes
      await db.db.sync();
    });

    // Wait for tables to be created and synced
    await page.waitForTimeout(500);
  });

  test('should navigate to column finder page', async ({ page }) => {
    // Verify we're on the column finder page
    await expect(page).toHaveURL(/\/db\/columns/);
    
    // Verify page title/heading
    const heading = page.locator('h1, h2').filter({ hasText: /column/i }).first();
    await expect(heading).toBeVisible();
  });

  test('should display search input for column names', async ({ page }) => {
    // Verify search input exists
    const searchInput = page.locator('input[placeholder*="column" i], input[placeholder*="search" i]').first();
    await expect(searchInput).toBeVisible();
    
    // Verify search button exists
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await expect(searchButton).toBeVisible();
  });

  test('should search for columns by exact name', async ({ page }) => {
    // Search for "id" column
    const searchInput = page.locator('input[placeholder*="column" i], input[placeholder*="search" i]').first();
    await searchInput.fill('id');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    // Wait for results to appear
    await page.waitForSelector('[data-testid="column-result"]', { timeout: 5000 });
    
    // Should find "id" column in multiple tables
    await expect(page.locator('text=users').first()).toBeVisible();
    await expect(page.locator('text=products').first()).toBeVisible();
    await expect(page.locator('text=orders').first()).toBeVisible();
    
    // Verify column name is shown
    const results = page.locator('[data-testid="column-result"]');
    await expect(results.first()).toBeVisible();
  });

  test('should search for columns with partial match', async ({ page }) => {
    // Search for columns containing "_id"
    const searchInput = page.locator('input[placeholder*="column" i], input[placeholder*="search" i]').first();
    await searchInput.fill('_id');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    await page.waitForSelector('[data-testid="column-result"]', { timeout: 5000 });
    
    // Should find user_id, product_id, order_id
    await expect(page.locator('text=user_id').first()).toBeVisible();
    await expect(page.locator('text=product_id').first()).toBeVisible();
    await expect(page.locator('text=order_id').first()).toBeVisible();
  });

  test('should display table name and column type for each result', async ({ page }) => {
    // Search for "created_at" column which exists in multiple tables
    const searchInput = page.locator('input[placeholder*="column" i], input[placeholder*="search" i]').first();
    await searchInput.fill('created_at');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    await page.waitForSelector('[data-testid="column-result"]', { timeout: 5000 });
    
    // Verify results show table names
    await expect(page.locator('text=users').first()).toBeVisible();
    await expect(page.locator('text=products').first()).toBeVisible();
    await expect(page.locator('text=orders').first()).toBeVisible();
    
    // Verify column type is shown (TEXT for created_at)
    await expect(page.locator('text=TEXT').first()).toBeVisible();
  });

  test('should show column constraints', async ({ page }) => {
    // Search for "email" which has NOT NULL constraint
    const searchInput = page.locator('input[placeholder*="column" i], input[placeholder*="search" i]').first();
    await searchInput.fill('email');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    await page.waitForSelector('[data-testid="column-result"]', { timeout: 5000 });
    
    // Should show NOT NULL constraint
    await expect(page.locator('text=/NOT\\s*NULL/i').first()).toBeVisible();
  });

  test('should show PRIMARY KEY constraint', async ({ page }) => {
    // Search for "id" which is PRIMARY KEY
    const searchInput = page.locator('input[placeholder*="column" i], input[placeholder*="search" i]').first();
    await searchInput.fill('id');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    await page.waitForSelector('[data-testid="column-result"]', { timeout: 5000 });
    
    // Should show PRIMARY KEY or PK indicator
    await expect(page.locator('text=/PRIMARY/i').first()).toBeVisible();
  });

  test('should show UNIQUE constraint', async ({ page }) => {
    // Search for "user_id" which has UNIQUE constraint
    const searchInput = page.locator('input[placeholder*="column" i], input[placeholder*="search" i]').first();
    await searchInput.fill('user_id');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    await page.waitForSelector('[data-testid="column-result"]', { timeout: 5000 });
    
    // Should show UNIQUE constraint
    await expect(page.locator('text=UNIQUE').first()).toBeVisible();
  });

  test('should show DEFAULT value', async ({ page }) => {
    // Search for "quantity" which has DEFAULT 1
    const searchInput = page.locator('input[placeholder*="column" i], input[placeholder*="search" i]').first();
    await searchInput.fill('quantity');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    await page.waitForSelector('[data-testid="column-result"]', { timeout: 5000 });
    
    // Should show DEFAULT value
    await expect(page.locator('text=/DEFAULT/i').first()).toBeVisible();
  });

  test('should handle case-insensitive search', async ({ page }) => {
    // Search for "USERNAME" (uppercase)
    const searchInput = page.locator('input[placeholder*="column" i], input[placeholder*="search" i]').first();
    await searchInput.fill('USERNAME');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    await page.waitForSelector('[data-testid="column-result"]', { timeout: 5000 });
    
    // Should find "username" column (lowercase)
    await expect(page.locator('text=username').first()).toBeVisible();
    await expect(page.locator('text=users').first()).toBeVisible();
  });

  test('should handle no results found', async ({ page }) => {
    // Search for non-existent column
    const searchInput = page.locator('input[placeholder*="column" i], input[placeholder*="search" i]').first();
    await searchInput.fill('nonexistent_column_xyz');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    await page.waitForTimeout(500);
    
    // Should show "no results" message
    await expect(page.locator('text=/No (columns|results) found|0 (columns|results)/i').first()).toBeVisible();
  });

  test('should clear search results', async ({ page }) => {
    // Perform a search first
    const searchInput = page.locator('input[placeholder*="column" i], input[placeholder*="search" i]').first();
    await searchInput.fill('id');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    // Wait for results
    await page.waitForSelector('[data-testid="column-result"]', { timeout: 5000 });
    
    // Verify results are shown
    await expect(page.locator('text=users').first()).toBeVisible();
    
    // Clear results
    const clearButton = page.locator('button:has-text("Clear")').first();
    await clearButton.click();
    
    await page.waitForTimeout(300);
    
    // Results should be cleared - check that the table is not visible
    const resultCount = await page.locator('[data-testid="column-result"]').count();
    expect(resultCount).toBe(0);
  });

  test('should show result count', async ({ page }) => {
    // Search for "id" which appears in multiple tables
    const searchInput = page.locator('input[placeholder*="column" i], input[placeholder*="search" i]').first();
    await searchInput.fill('id');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    await page.waitForSelector('[data-testid="column-result"]', { timeout: 5000 });
    
    // Should show result count (4 tables have "id" column)
    await expect(page.locator('text=/\\d+ (column|result)/i').first()).toBeVisible();
  });

  test('should click on result to view table schema', async ({ page }) => {
    // Search for "email"
    const searchInput = page.locator('input[placeholder*="column" i], input[placeholder*="search" i]').first();
    await searchInput.fill('email');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    await page.waitForSelector('[data-testid="column-result"]', { timeout: 5000 });
    
    // Verify table name is a clickable link to designer
    const resultLink = page.locator('a[href*="/db/designer"]').filter({ hasText: /users/i }).first();
    await expect(resultLink).toBeVisible();
    
    // Verify the link has correct href
    const href = await resultLink.getAttribute('href');
    expect(href).toContain('/db/designer');
    expect(href).toContain('users');
  });

  test('should handle empty search input gracefully', async ({ page }) => {
    // Try to search with empty input
    const searchInput = page.locator('input[placeholder*="column" i], input[placeholder*="search" i]').first();
    await searchInput.fill('');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    
    // Button should be disabled or clicking should show message
    const isDisabled = await searchButton.isDisabled();
    if (!isDisabled) {
      await searchButton.click();
      await page.waitForTimeout(300);
      // Should show validation message
      await expect(page.locator('text=/enter.*search/i, text=/provide.*column/i').first()).toBeVisible();
    } else {
      expect(isDisabled).toBe(true);
    }
  });

  test('should search across all tables in database', async ({ page }) => {
    // Search for "description" which exists in products and settings
    const searchInput = page.locator('input[placeholder*="column" i], input[placeholder*="search" i]').first();
    await searchInput.fill('description');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    await page.waitForSelector('[data-testid="column-result"]', { timeout: 5000 });
    
    // Should find in both tables
    await expect(page.locator('text=products').first()).toBeVisible();
    await expect(page.locator('text=settings').first()).toBeVisible();
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
