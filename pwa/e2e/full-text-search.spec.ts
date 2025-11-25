import { test, expect } from '@playwright/test';

test.describe('Full-Text Search E2E', () => {
  test.setTimeout(120000); // 120s to accommodate 75s leader election + operations under 554-test parallel load
  let TEST_DB_NAME: string;

  test.beforeEach(async ({ page }, testInfo) => {
    // CRITICAL: Unique database name per test to prevent ALL cross-test interference
    TEST_DB_NAME = `search_test_w${testInfo.parallelIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Enable console logging for debugging
    page.on('console', msg => {
      if (msg.text().includes('[TEST]') || msg.text().includes('[SEARCH]')) {
        console.log('[BROWSER]', msg.text());
      }
    });

    // ✅ CRITICAL: Inject workerIndex into page context for worker-specific database isolation
    await page.addInitScript(`window.workerIndex = ${testInfo.parallelIndex};`);

    // ✅ CORRECT PATTERN: Create DB with UI, sync after data, navigate to search
    // sync() persists to IndexedDB, navigation restores quickly without full leadership wait

    // Navigate to DB management page
    await page.goto('/db');
    await page.waitForLoadState('networkidle');
    
    // MANDATORY: Complete cleanup BEFORE test (INSTRUCTIONS.md Rule #5)
    await page.evaluate(async () => {
      const win = window as any;
      
      // Close existing DB if any
      try {
        if (win.testDb) {
          await win.testDb.close();
          win.testDb = null;
        }
      } catch (err) {
        console.warn('[CLEANUP] Failed to close existing testDb', err);
      }

      // CRITICAL: Clear localStorage leader keys (INSTRUCTIONS.md Rule #2)
      const testPrefix = `search_test_w${(window as any).workerIndex || 0}`;
      const dbKey = `${testPrefix}.db`;

      // Explicitly clear leader election keys
      localStorage.removeItem(`datasync_leader_${dbKey}`);
      localStorage.removeItem(`datasync_instances_${dbKey}`);
      localStorage.removeItem(`datasync_heartbeat_${dbKey}`);

      // Also clear any other test-related keys
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(testPrefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Delete only THIS test worker's database (not ALL databases - prevents interference)
      const testDbName = testPrefix; // Will match search_test_w0_*, search_test_w1_*, etc
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name && db.name.startsWith(testDbName)) {
          await indexedDB.deleteDatabase(db.name);
        }
      }
    });

    // Reload to apply cleanup
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Create database with UI
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput');
    await page.fill('#dbNameInput', TEST_DB_NAME);
    await page.click('#confirmCreate');
    await page.waitForSelector(`#status:has-text("Database created: ${TEST_DB_NAME}.db")`);

    // Navigate to search page FIRST (exact storage-analysis pattern)
    await page.goto('/db/search');
    await page.waitForLoadState('networkidle');
    
    // Wait for database to be initialized
    await page.waitForFunction(() => {
      const db = (window as any).testDb;
      return db && db.db; // Just verify connection exists
    }, { timeout: 10000 });

    // Enable non-leader writes for single-worker test mode (bypasses leader election)
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db && db.allowNonLeaderWrites) {
        await db.allowNonLeaderWrites(true);
        console.log('[TEST] ✓ Non-leader writes enabled');
      }
    });

    // Create test data on THIS page (no navigation needed - storage-analysis pattern)
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (!db) throw new Error('Database not initialized');

      // DROP tables before creating (INSTRUCTIONS.md Rule #2)
      await db.execute(`DROP TABLE IF EXISTS users`).catch(() => {});
      await db.execute(`DROP TABLE IF EXISTS products`).catch(() => {});
      await db.execute(`DROP TABLE IF EXISTS orders`).catch(() => {});

      await db.execute(`CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, role TEXT)`);
      await db.execute(`INSERT INTO users (name, email, role) VALUES ('Alice Admin', 'alice@example.com', 'admin')`);
      await db.execute(`INSERT INTO users (name, email, role) VALUES ('Bob User', 'bob@example.com', 'user')`);
      await db.execute(`INSERT INTO users (name, email, role) VALUES ('Charlie Manager', 'charlie@example.com', 'manager')`);

      await db.execute(`CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, description TEXT, price REAL, category TEXT)`);
      await db.execute(`INSERT INTO products (name, description, price, category) VALUES ('Laptop', 'High-performance laptop for developers', 1299.99, 'Electronics')`);
      await db.execute(`INSERT INTO products (name, description, price, category) VALUES ('Keyboard', 'Mechanical keyboard for gaming', 149.99, 'Electronics')`);
      await db.execute(`INSERT INTO products (name, description, price, category) VALUES ('Notebook', 'Professional notebook for meetings', 12.50, 'Office')`);

      await db.execute(`CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, product_id INTEGER, quantity INTEGER, status TEXT, notes TEXT)`);
      await db.execute(`INSERT INTO orders (user_id, product_id, quantity, status, notes) VALUES (1, 1, 1, 'shipped', 'Express delivery requested')`);
      await db.execute(`INSERT INTO orders (user_id, product_id, quantity, status, notes) VALUES (2, 2, 2, 'pending', 'Customer requested gift wrap')`);
      await db.execute(`INSERT INTO orders (user_id, product_id, quantity, status, notes) VALUES (3, 3, 1, 'delivered', 'Left at front door')`);
      
      console.log('[TEST] ✓ Data created');
    });
    
    // Trigger table reload in UI (event-based)
    await page.evaluate(async () => {
      const reload = (window as any).reloadSearchTables;
      await reload();
    });
    
    // Wait for UI to render with tables loaded
    await page.waitForFunction(() => {
      const getState = (window as any).getSearchState;
      if (!getState) return false;
      const state = getState();
      return document.querySelector('#searchScope') && state.availableTables.length === 3;
    }, { timeout: 10000 });
  });

  test.afterEach(async ({ page }) => {
    // MANDATORY: Cleanup after test (INSTRUCTIONS.md Rules #4 and #5)
    if (!TEST_DB_NAME) return;
    
    try {
      // Check if page is still valid before attempting cleanup
      if (page.isClosed()) {
        console.warn('[CLEANUP] Page already closed, skipping cleanup');
        return;
      }
      
      // CRITICAL: No timeout - cleanup MUST complete fully
      await page.evaluate(async (dbName) => {
        const db = (window as any).testDb;

        // Rule #4: Always close database and force-remove from connection pool
        if (db) {
          console.log('[CLEANUP] Calling forceCloseConnection for', dbName);
          await db.forceCloseConnection();
          console.log('[CLEANUP] forceCloseConnection completed for', dbName);
          (window as any).testDb = null;
        }

        // Rule #5: Always delete database file
        const dbKey = `${dbName}.db`;
        console.log('[CLEANUP] Deleting IndexedDB:', dbKey);
        await indexedDB.deleteDatabase(dbKey);
        console.log('[CLEANUP] IndexedDB deleted:', dbKey);

        // Wait for deletion to fully complete
        await new Promise(resolve => setTimeout(resolve, 100));
      }, TEST_DB_NAME);
    } catch (err: any) {
      // Gracefully handle cleanup failures (e.g., page already closed, timeout)
      console.warn('[CLEANUP] Cleanup skipped:', err.message);
    }
  });

  test('should navigate to search page', async ({ page }) => {
    // beforeEach already navigated to /db/search, so we're already there
    // Just verify the page is showing the search interface
    await expect(page).toHaveURL(/\/db\/search/);
    await expect(page.locator('h1, h2').filter({ hasText: /Search/i })).toBeVisible();
  });

  test('should show search input field', async ({ page }) => {
    // beforeEach already navigated to /db/search
    // Should have search input
    const searchInput = page.locator('#searchInput, input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();
  });

  test('should perform basic text search across all tables', async ({ page }) => {
    // beforeEach already navigated to /db/search
    // Test data already created in beforeEach

    // Search for "alice"
    await page.fill('#searchInput, input[placeholder*="Search"]', 'alice');
    await page.click('#searchButton, button:has-text("Search")');
    
    // Wait for search to complete (event-based)
    await page.waitForFunction(() => {
      const state = (window as any).getSearchState?.();
      return state && state.showResults === true;
    }, { timeout: 15000 });
    
    // Wait for results to load
    await expect(page.locator('#resultCount')).toBeVisible();
    await expect(page.locator('#resultCount')).not.toHaveText(/0 results?/i);

    // Should show results
    const resultsContainer = page.locator('#searchResults, [data-testid="search-results"]');
    await expect(resultsContainer).toBeVisible();
    
    // Should find alice_admin in users table
    await expect(page.locator('.result-table', { hasText: 'users' }).first()).toBeVisible();
    await expect(page.locator('.result-column', { hasText: 'email' }).first()).toBeVisible();
    await expect(page.locator('.max-w-md').filter({ hasText: /alice/i }).first()).toBeVisible();
  });

  test('should search with case-sensitive option', async ({ page }) => {
    // beforeEach already navigated to /db/search
    // Test data already created in beforeEach

    // Enable case-sensitive search
    const caseSensitiveCheckbox = page.getByRole('checkbox', { name: 'Case-sensitive' });
    await caseSensitiveCheckbox.click();

    // Search for "ALICE" (uppercase)
    await page.fill('#searchInput, input[placeholder*="Search"]', 'ALICE');
    await page.click('#searchButton, button:has-text("Search")');
    
    // Wait for search to complete (event-based)
    await page.waitForFunction(() => {
      const state = (window as any).getSearchState?.();
      return state && state.showResults === true;
    }, { timeout: 15000 });
    
    // Wait for search to complete
    await expect(page.locator('#resultCount')).toBeVisible();

    // Should show no results (data is lowercase)
    await expect(page.locator('#resultCount')).toHaveText(/0 results?/i);
  });

  test('should search with exact match option', async ({ page }) => {
    // beforeEach already navigated to /db/search
    // Test data already created in beforeEach

    // Enable exact match
    const exactMatchCheckbox = page.getByRole('checkbox', { name: 'Exact match' });
    await exactMatchCheckbox.click();

    // Search for exact value "laptop" (should not match "High-performance laptop")
    await page.fill('#searchInput, input[placeholder*="Search"]', 'laptop');
    await page.click('#searchButton, button:has-text("Search")');
    
    // Wait for search to complete (event-based)
    await page.waitForFunction(() => {
      const state = (window as any).getSearchState?.();
      return state && state.showResults === true;
    }, { timeout: 15000 });
    
    // Wait for search to complete
    await expect(page.locator('#resultCount')).toBeVisible();

    // Should only match the "Laptop" product name exactly
    const results = page.locator('#searchResults, [data-testid="search-results"]');
    await expect(results).toBeVisible();
  });

  test('should display search results with table and column information', async ({ page }) => {
    // beforeEach already navigated to /db/search
    // Test data already created in beforeEach

    // Search for "developer"
    await page.fill('#searchInput, input[placeholder*="Search"]', 'developer');
    await page.click('#searchButton, button:has-text("Search")');
    
    // Wait for search to complete (event-based)
    await page.waitForFunction(() => {
      const state = (window as any).getSearchState?.();
      return state && state.showResults === true;
    }, { timeout: 15000 });
    
    // Wait for results to appear
    await expect(page.locator('#resultCount')).toBeVisible();
    await expect(page.locator('#resultCount')).not.toHaveText(/0 results?/i);

    // Results should show table name
    const tableColumn = page.locator('[data-column="table"], .result-table').first();
    await expect(tableColumn).toBeVisible();

    // Results should show column name
    const columnColumn = page.locator('[data-column="column"], .result-column').first();
    await expect(columnColumn).toBeVisible();
  });

  test('should highlight matched value in results', async ({ page }) => {
    // beforeEach already navigated to /db/search
    // Test data already created in beforeEach

    // Search for "example.com"
    await page.fill('#searchInput, input[placeholder*="Search"]', 'example.com');
    await page.click('#searchButton, button:has-text("Search")');
    
    // Wait for search to complete (event-based)
    await page.waitForFunction(() => {
      const state = (window as any).getSearchState?.();
      return state && state.showResults === true;
    }, { timeout: 15000 });
    
    // Wait for results
    await expect(page.locator('#resultCount')).toBeVisible();
    await expect(page.locator('#resultCount')).not.toHaveText(/0 results?/i);

    // Should highlight the matched text
    const highlighted = page.locator('mark, .highlight, .search-match').first();
    await expect(highlighted).toBeVisible();
  });

  test('should allow selecting search scope - all tables', async ({ page }) => {
    // beforeEach already navigated to /db/search
    // Test data already created in beforeEach

    // Debug: Check initial state
    await page.evaluate(() => {
      const state = (window as any).getSearchState();
      console.log('[TEST] Initial state:', { available: state.availableTables.length, selected: state.selectedTables.length });
    });

    // Select "All tables" scope
    const scopeTrigger = page.getByRole('combobox', { name: 'Search Scope' });
    await scopeTrigger.click();
    const allTablesOption = page.getByRole('option', { name: 'All tables' });
    await allTablesOption.click();

    // Wait for dropdown to close (event-based - option should disappear)
    await allTablesOption.waitFor({ state: 'hidden', timeout: 5000 });

    // Debug: Check state after scope change
    await page.evaluate(() => {
      const state = (window as any).getSearchState();
      console.log('[TEST] After scope change:', { available: state.availableTables.length, selected: state.selectedTables.length });
    });

    // Search
    await page.fill('#searchInput, input[placeholder*="Search"]', 'shipped');

    // Wait for search button to be enabled (React state update) and click
    const searchButton = page.locator('#searchButton, button:has-text("Search")');
    await searchButton.waitFor({ state: 'visible', timeout: 5000 });
    await expect(searchButton).toBeEnabled({ timeout: 5000 });
    await searchButton.click();

    // Wait for search to complete (event-based - wait for showResults)
    await page.waitForFunction(() => {
      const state = (window as any).getSearchState?.();
      return state && state.showResults === true && !state.executing;
    }, { timeout: 15000, polling: 'raf' });

    // Wait for results with retry
    await expect(page.locator('#resultCount')).toBeVisible({ timeout: 10000 });

    // Should find results in orders table
    await expect(page.locator('.result-table', { hasText: 'orders' }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should allow selecting specific tables to search', async ({ page }) => {
    // beforeEach already navigated to /db/search
    // Test data already created in beforeEach

    // Debug: Check initial state
    await page.evaluate(() => {
      const state = (window as any).getSearchState();
      console.log('[TEST] Initial state:', { available: state.availableTables.length, selected: state.selectedTables.length });
    });

    // Change scope to selected tables
    const scopeTrigger = page.getByRole('combobox', { name: 'Search Scope' });
    await scopeTrigger.click();
    const selectedTablesOption = page.getByRole('option', { name: 'Selected tables' });
    await selectedTablesOption.click();

    // Wait for dropdown to close (event-based - option should disappear)
    await selectedTablesOption.waitFor({ state: 'hidden', timeout: 5000 });

    // Debug: Check state after scope change
    await page.evaluate(() => {
      const state = (window as any).getSearchState();
      console.log('[TEST] After scope to selected:', { available: state.availableTables.length, selected: state.selectedTables.length });
    });

    // Uncheck orders and products, leaving only users selected
    const ordersCheckbox = page.getByRole('checkbox', { name: 'orders' });
    await ordersCheckbox.waitFor({ state: 'visible', timeout: 5000 });
    await ordersCheckbox.click();

    // Wait for checkbox to actually be unchecked (event-based)
    await ordersCheckbox.waitFor({ state: 'attached', timeout: 5000 });
    await expect(ordersCheckbox).not.toBeChecked({ timeout: 5000 });

    const productsCheckbox = page.getByRole('checkbox', { name: 'products' });
    await productsCheckbox.waitFor({ state: 'visible', timeout: 5000 });
    await productsCheckbox.click();

    // Wait for checkbox to actually be unchecked (event-based)
    await productsCheckbox.waitFor({ state: 'attached', timeout: 5000 });
    await expect(productsCheckbox).not.toBeChecked({ timeout: 5000 });

    // Wait for state to update after unchecking (event-based)
    await page.waitForFunction(() => {
      const state = (window as any).getSearchState?.();
      return state && state.selectedTables.length === 1 && state.selectedTables.includes('users');
    }, { timeout: 10000, polling: 'raf' });

    // Search for "admin" (exists in users table)
    await page.fill('#searchInput, input[placeholder*="Search"]', 'admin');

    // Wait for search button to be enabled (React state update) before clicking
    const searchButton = page.locator('#searchButton, button:has-text("Search")');
    await searchButton.waitFor({ state: 'visible', timeout: 5000 });
    await expect(searchButton).toBeEnabled({ timeout: 5000 });
    await searchButton.click();

    // Wait for search to complete (event-based - wait for both executing to become false AND showResults)
    await page.waitForFunction(() => {
      const state = (window as any).getSearchState?.();
      return state && !state.executing && state.showResults === true;
    }, { timeout: 15000, polling: 'raf' });

    // Wait for results with retry
    await expect(page.locator('#resultCount')).toBeVisible({ timeout: 15000 });

    // Should find results in users table
    const results = page.locator('#searchResults, [data-testid="search-results"]');
    await expect(results).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.result-table', { hasText: 'users' }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should show row count in results', async ({ page }) => {
    // beforeEach already navigated to /db/search
    // Test data already created in beforeEach

    // Search for common term
    await page.fill('#searchInput, input[placeholder*="Search"]', 'user');
    await page.click('#searchButton, button:has-text("Search")');
    
    // Wait for search to complete (event-based)
    await page.waitForFunction(() => {
      const state = (window as any).getSearchState?.();
      return state && state.showResults === true;
    }, { timeout: 15000 });
    
    // Wait for results
    await expect(page.locator('#resultCount')).toBeVisible();

    // Should display result count
    await expect(page.locator('#resultCount')).toHaveText(/\d+ results?/i);
  });

  test('should allow exporting search results', async ({ page }) => {
    // beforeEach already navigated to /db/search
    // Test data already created in beforeEach

    // Perform search
    await page.fill('#searchInput, input[placeholder*="Search"]', 'alice');
    await page.click('#searchButton, button:has-text("Search")');
    
    // Wait for search to complete (event-based)
    await page.waitForFunction(() => {
      const state = (window as any).getSearchState?.();
      return state && state.showResults === true;
    }, { timeout: 15000 });
    
    // Wait for results
    await expect(page.locator('#resultCount')).toBeVisible();
    await expect(page.locator('#resultCount')).not.toHaveText(/0 results?/i);

    // Export button should be visible
    const exportButton = page.locator('#exportResults');
    await expect(exportButton).toBeVisible();
  });

  test('should handle empty search input', async ({ page }) => {
    // beforeEach already navigated to /db/search
    // Try to search with empty input
    await page.fill('#searchInput, input[placeholder*="Search"]', '');
    
    // Search button should be disabled or show validation message
    const searchButton = page.locator('#searchButton, button:has-text("Search")').first();
    const isDisabled = await searchButton.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('should handle search with no results', async ({ page }) => {
    // beforeEach already navigated to /db/search
    // Test data already created in beforeEach

    // Search for term that doesn't exist
    await page.fill('#searchInput, input[placeholder*="Search"]', 'zzz_nonexistent_xyz');
    await page.click('#searchButton, button:has-text("Search")');

    // Wait for search to complete (event-based)
    await page.waitForFunction(() => {
      const state = (window as any).getSearchState?.();
      return state && state.showResults === true;
    }, { timeout: 15000 });

    // Wait for result count element to appear with 0 results text
    await expect(page.locator('#resultCount')).toBeVisible();
    await expect(page.locator('#resultCount')).toHaveText(/0 results?/i);
  });

  test('should support regex pattern search', async ({ page }) => {
    // beforeEach already navigated to /db/search
    // Test data already created in beforeEach

    // Enable regex option
    const regexCheckbox = page.getByRole('checkbox', { name: 'Regex pattern' });
    await regexCheckbox.click();

    // Search with regex pattern for email addresses
    await page.fill('#searchInput, input[placeholder*="Search"]', '.*@example\\.com');
    await page.click('#searchButton, button:has-text("Search")');
    
    // Wait for search to complete (event-based)
    await page.waitForFunction(() => {
      const state = (window as any).getSearchState?.();
      return state && state.showResults === true;
    }, { timeout: 15000 });
    
    // Wait for results
    await expect(page.locator('#resultCount')).toBeVisible();

    // Should find users with example.com emails
    const results = page.locator('#searchResults, [data-testid="search-results"]');
    await expect(results).toBeVisible();
    // Should find multiple email addresses matching the pattern
    await expect(page.locator('.max-w-md').filter({ hasText: /@example\.com/i }).first()).toBeVisible();
  });

  test('should show context data around matched value', async ({ page }) => {
    // beforeEach already navigated to /db/search
    // Test data already created in beforeEach

    // Search for a value
    await page.fill('#searchInput, input[placeholder*="Search"]', 'bob_user');
    await page.click('#searchButton, button:has-text("Search")');
    
    // Wait for search to complete (event-based)
    await page.waitForFunction(() => {
      const state = (window as any).getSearchState?.();
      return state && state.showResults === true;
    }, { timeout: 15000 });
    
    // Wait for results
    await expect(page.locator('#resultCount')).toBeVisible();
    await expect(page.locator('#resultCount')).not.toHaveText(/0 results?/i);

    // Should show row ID and context
    const rowIdColumn = page.locator('[data-column="rowId"], .row-id').first();
    await expect(rowIdColumn).toBeVisible();
  });

  test('should clear search results', async ({ page }) => {
    // beforeEach already navigated to /db/search
    // Test data already created in beforeEach

    // Verify search input is visible before searching
    const searchInput = page.locator('#searchInput, input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();
    
    // Perform search
    await searchInput.fill('alice');
    const searchButton = page.locator('#searchButton, button:has-text("Search")').first();
    await searchButton.click();
    
    // Wait for search to complete (event-based)
    await page.waitForFunction(() => {
      const state = (window as any).getSearchState?.();
      return state && state.showResults === true;
    }, { timeout: 15000 });
    
    // Wait for results to load by checking result count appears
    await expect(page.locator('#resultCount')).toBeVisible();
    await expect(page.locator('#resultCount')).not.toHaveText(/0 results?/i);

    // Clear results
    const clearButton = page.locator('#clearResults, button:has-text("Clear")').first();
    await expect(clearButton).toBeVisible();
    await clearButton.click();

    // Results should be hidden
    const results = page.locator('#searchResults, [data-testid="search-results"]');
    await expect(results).not.toBeVisible();
  });
});
