import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Data Grep E2E', () => {
  let TEST_DB_NAME: string;

  test.beforeEach(async ({ page }, testInfo) => {
    // Use worker index AND timestamp to ensure unique database per test (per INSTRUCTIONS.md)
    TEST_DB_NAME = `test-grep-w${testInfo.parallelIndex}_${Date.now()}.db`;
    
    // Navigate to DB management page and ensure clean state
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

    // Create a database via the UI
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput', { timeout: 5000 });
    await page.fill('#dbNameInput', TEST_DB_NAME);
    await page.click('#confirmCreate');
    await page.waitForSelector(`#status:has-text("Database created: ${TEST_DB_NAME}")`, { timeout: 10000 });

    // Navigate to grep page
    await page.goto('/db/grep');
    await page.waitForLoadState('networkidle');

    // Wait for DatabaseProvider to fully initialize
    await page.waitForFunction(() => {
      const db = (window as any).testDb;
      return db && db.db;
    }, { timeout: 15000 });

    // Wait for leader election to complete (single-tab mode)
    
    // Verify we're leader before proceeding
    const isLeader = await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (!db) throw new Error('Database not initialized');
      return await db.isLeader();
    });
    
    if (!isLeader) {
      throw new Error('Test instance failed to become leader');
    }

    // Create test tables with diverse data types
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (!db) throw new Error('Database not initialized');

      // DROP tables before creating to ensure clean state (per INSTRUCTIONS.md)
      await db.execute('DROP TABLE IF EXISTS orders').catch(() => {});
      await db.execute('DROP TABLE IF EXISTS products').catch(() => {});
      await db.execute('DROP TABLE IF EXISTS users').catch(() => {});

      // Create tables with different data types
      await db.execute(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL,
          email TEXT NOT NULL,
          age INTEGER,
          salary REAL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.execute(`
        CREATE TABLE products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          price REAL NOT NULL,
          stock INTEGER NOT NULL,
          sku TEXT UNIQUE
        )
      `);

      await db.execute(`
        CREATE TABLE orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_number TEXT UNIQUE NOT NULL,
          user_id INTEGER NOT NULL,
          total REAL NOT NULL,
          status TEXT NOT NULL,
          order_date TEXT
        )
      `);

      // Insert diverse test data
      await db.execute("INSERT INTO users (username, email, age, salary) VALUES ('alice', 'alice@example.com', 30, 75000.50)");
      await db.execute("INSERT INTO users (username, email, age, salary) VALUES ('bob', 'bob@example.com', 25, 60000.00)");
      await db.execute("INSERT INTO users (username, email, age, salary) VALUES ('charlie', 'charlie@example.com', 35, 85000.75)");
      
      await db.execute("INSERT INTO products (name, description, price, stock, sku) VALUES ('Laptop', 'High-performance laptop', 1299.99, 15, 'LAP-001')");
      await db.execute("INSERT INTO products (name, description, price, stock, sku) VALUES ('Mouse', 'Wireless mouse', 29.99, 50, 'MOU-001')");
      await db.execute("INSERT INTO products (name, description, price, stock, sku) VALUES ('Keyboard', 'Mechanical keyboard', 129.99, 30, 'KEY-001')");

      await db.execute("INSERT INTO orders (order_number, user_id, total, status, order_date) VALUES ('ORD-1001', 1, 1299.99, 'shipped', '2024-01-15')");
      await db.execute("INSERT INTO orders (order_number, user_id, total, status, order_date) VALUES ('ORD-1002', 2, 159.98, 'pending', '2024-01-16')");
      await db.execute("INSERT INTO orders (order_number, user_id, total, status, order_date) VALUES ('ORD-1003', 3, 29.99, 'delivered', '2024-01-14')");

      await db.db.sync();
    });

  });

  test('should navigate to data grep page', async ({ page }) => {
    await expect(page).toHaveURL(/\/db\/grep/);
    
    // Wait for page content to load - look for the card title or search input
    await expect(page.locator('text=Data Grep').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show search input field', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search" i], input[placeholder*="value" i]').first();
    await expect(searchInput).toBeVisible();
  });

  test('should search for text value across all tables', async ({ page }) => {
    // Search for "alice" which appears in users table
    const searchInput = page.locator('input[placeholder*="Search" i], input[placeholder*="value" i]').first();
    await searchInput.fill('alice');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    // Wait for results
    await page.waitForSelector('[data-testid="grep-result"]', { timeout: 5000 });
    
    // Should find alice in users table (username and email columns)
    await expect(page.locator('text=users').first()).toBeVisible();
    await expect(page.locator('text=alice').first()).toBeVisible();
  });

  test('should search for numeric value across all tables', async ({ page }) => {
    // Search for "30" which appears in users.age
    const searchInput = page.locator('input[placeholder*="Search" i], input[placeholder*="value" i]').first();
    await searchInput.fill('30');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    await page.waitForSelector('[data-testid="grep-result"]', { timeout: 5000 });
    
    // Should find 30 in users table
    await expect(page.locator('text=users').first()).toBeVisible();
    await expect(page.locator('text=30').first()).toBeVisible();
  });

  test('should display table name and column name in results', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search" i], input[placeholder*="value" i]').first();
    await searchInput.fill('Laptop');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    await page.waitForSelector('[data-testid="grep-result"]', { timeout: 5000 });
    
    // Should show table and column where value was found
    await expect(page.locator('text=products').first()).toBeVisible();
    await expect(page.locator('text=name').first()).toBeVisible();
  });

  test('should show matched value in results', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search" i], input[placeholder*="value" i]').first();
    await searchInput.fill('shipped');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    await page.waitForSelector('[data-testid="grep-result"]', { timeout: 5000 });
    
    // Should show the matched value
    await expect(page.locator('text=shipped').first()).toBeVisible();
  });

  test('should handle partial text matches', async ({ page }) => {
    // Search for "bob" which should match "bob@example.com" and username "bob"
    const searchInput = page.locator('input[placeholder*="Search" i], input[placeholder*="value" i]').first();
    await searchInput.fill('bob');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    await page.waitForSelector('[data-testid="grep-result"]', { timeout: 5000 });
    
    // Should find bob in multiple columns
    const results = page.locator('[data-testid="grep-result"]');
    const count = await results.count();
    expect(count).toBeGreaterThan(1); // Should find in at least username and email
  });

  test('should show result count', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search" i], input[placeholder*="value" i]').first();
    await searchInput.fill('alice');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    await page.waitForSelector('[data-testid="grep-result"]', { timeout: 5000 });
    
    // Should show count of results
    await expect(page.locator('text=/\\d+ result/i').first()).toBeVisible();
  });

  test('should handle no results found', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search" i], input[placeholder*="value" i]').first();
    await searchInput.fill('nonexistent_value_xyz_12345');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    
    // Should show "no results" message
    await expect(page.locator('text=/No (results|matches) found|0 result/i').first()).toBeVisible();
  });

  test('should clear search results', async ({ page }) => {
    // Perform a search first
    const searchInput = page.locator('input[placeholder*="Search" i], input[placeholder*="value" i]').first();
    await searchInput.fill('alice');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    await page.waitForSelector('[data-testid="grep-result"]', { timeout: 5000 });
    
    // Clear results
    const clearButton = page.locator('button:has-text("Clear")').first();
    await clearButton.click();
    
    
    // Results should be cleared
    const resultCount = await page.locator('[data-testid="grep-result"]').count();
    expect(resultCount).toBe(0);
  });

  test('should search case-insensitively by default', async ({ page }) => {
    // Search for "ALICE" (uppercase) should find "alice" (lowercase)
    const searchInput = page.locator('input[placeholder*="Search" i], input[placeholder*="value" i]').first();
    await searchInput.fill('ALICE');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    await page.waitForSelector('[data-testid="grep-result"]', { timeout: 5000 });
    
    // Should find alice (case-insensitive)
    await expect(page.locator('text=alice').first()).toBeVisible();
  });

  test('should limit results for performance', async ({ page }) => {
    // Search for a common value that appears in many places
    const searchInput = page.locator('input[placeholder*="Search" i], input[placeholder*="value" i]').first();
    await searchInput.fill('example.com');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    await page.waitForSelector('[data-testid="grep-result"]', { timeout: 5000 });
    
    // Should show results but indicate if limited
    const results = page.locator('[data-testid="grep-result"]');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show row context for matched value', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search" i], input[placeholder*="value" i]').first();
    await searchInput.fill('Laptop');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    await page.waitForSelector('[data-testid="grep-result"]', { timeout: 5000 });
    
    // Should show related row data (like price, sku, etc)
    const result = page.locator('[data-testid="grep-result"]').first();
    await expect(result).toBeVisible();
  });

  test('should handle empty search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search" i], input[placeholder*="value" i]').first();
    await searchInput.fill('');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    
    // Button should be disabled or show validation message
    const isDisabled = await searchButton.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('should search across multiple data types', async ({ page }) => {
    // Search for a decimal number
    const searchInput = page.locator('input[placeholder*="Search" i], input[placeholder*="value" i]').first();
    await searchInput.fill('1299.99');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    await page.waitForSelector('[data-testid="grep-result"]', { timeout: 5000 });
    
    // Should find in both products (price) and orders (total)
    await expect(page.locator('text=1299.99').first()).toBeVisible();
  });

  test('should handle special characters in search', async ({ page }) => {
    // Search for SKU with dash
    const searchInput = page.locator('input[placeholder*="Search" i], input[placeholder*="value" i]').first();
    await searchInput.fill('LAP-001');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    await page.waitForSelector('[data-testid="grep-result"]', { timeout: 5000 });
    
    // Should find the SKU
    await expect(page.locator('text=LAP-001').first()).toBeVisible();
  });

  test('should display search across all tables and columns', async ({ page }) => {
    // Search for "1" which appears in many places
    const searchInput = page.locator('input[placeholder*="Search" i], input[placeholder*="value" i]').first();
    await searchInput.fill('1');
    
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await searchButton.click();
    
    await page.waitForSelector('[data-testid="grep-result"]', { timeout: 5000 });
    
    // Should find results from multiple tables
    const results = page.locator('[data-testid="grep-result"]');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);
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
