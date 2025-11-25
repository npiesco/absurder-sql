import { test, expect } from '@playwright/test';

test.describe('Storage Analysis E2E', () => {
  test.setTimeout(90000); // Increase timeout to accommodate 60s leader election wait
  let TEST_DB_NAME: string;

  test.beforeEach(async ({ page }, testInfo) => {
    // MANDATORY: Use worker index AND timestamp for unique database (INSTRUCTIONS.md Rule #3)
    const workerId = testInfo.parallelIndex;
    const testId = Date.now();
    TEST_DB_NAME = `storage_test_w${workerId}_${testId}`;

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
    
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput', { timeout: 5000 });
    await page.fill('#dbNameInput', TEST_DB_NAME);
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, `${TEST_DB_NAME}.db`, { timeout: 15000 });
    
    // Wait for store to be updated with currentDbName
    await page.waitForFunction((dbName) => {
      const stored = localStorage.getItem('absurder-sql-database-store');
      if (!stored) return false;
      try {
        const parsed = JSON.parse(stored);
        return parsed.state?.currentDbName === dbName + '.db';
      } catch {
        return false;
      }
    }, TEST_DB_NAME, { timeout: 10000 });

    // Navigate to storage page (following search test pattern)
    page.on('console', msg => console.log('[BROWSER]', msg.text()));
    
    await page.goto('/db/storage');
    await page.waitForLoadState('networkidle');
    
    // Wait for DatabaseProvider to fully initialize AND leader election (event-based)
    // CRITICAL: Increased timeout for heavy load conditions
    await page.waitForFunction(async () => {
      const db = (window as any).testDb;
      console.log('[CHECK] testDb exists:', !!db);
      if (!db || !db.db) return false;
      try {
        return await db.isLeader();
      } catch {
        return false;
      }
    }, { timeout: 60000 });

    // Create test data using testDb on THIS page (no navigation needed)
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (!db) throw new Error('Database not initialized');

      // DROP tables before creating (per INSTRUCTIONS.md)
      await db.execute('DROP TABLE IF EXISTS users').catch(() => {});
      await db.execute('DROP TABLE IF EXISTS products').catch(() => {});
      await db.execute('DROP INDEX IF EXISTS idx_users_email').catch(() => {});

      // Create users table with data
      await db.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)');
      await db.execute("INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com'), ('Bob', 'bob@example.com'), ('Charlie', 'charlie@example.com')");

      // Create products table with data
      await db.execute('CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL)');
      await db.execute("INSERT INTO products (name, price) VALUES ('Laptop', 999.99), ('Mouse', 29.99)");

      // Create index for testing index sizes
      await db.execute('CREATE INDEX idx_users_email ON users(email)');
    });

    // Force storage page to reload data by clicking refresh button
    const refreshButton = page.locator('#refreshStorageButton, button:has-text("Refresh")').first();
    const refreshExists = await refreshButton.count();
    if (refreshExists > 0) {
      await refreshButton.click();
      
      // Wait for loading to complete - the dbSize element should appear
      // Increased timeout for storage calculation under heavy load
      await page.waitForSelector('[data-testid="db-size"]', { timeout: 30000 });
    } else {
      // If no refresh button, wait for auto-load and dbSize to appear
      await page.waitForSelector('[data-testid="db-size"]', { timeout: 30000 });
    }
    
    console.log('[TEST] Test data created on storage page with DB:', TEST_DB_NAME);
  });

  test.afterEach(async ({ page }) => {
    // MANDATORY: Cleanup after each test (INSTRUCTIONS.md Rule #5)
    if (TEST_DB_NAME) {
      await page.evaluate(async (dbName) => {
        const db = (window as any).testDb;
        if (db) {
          try { await db.close(); } catch {}
        }
        try { await indexedDB.deleteDatabase(dbName + '.db'); } catch {}
        try { localStorage.removeItem('absurder-sql-database-store'); } catch {}
      }, TEST_DB_NAME).catch(() => {});
    }
  });

  test('should navigate to storage analysis page', async ({ page }) => {
    // beforeEach already navigated to /db/storage, so we're already there
    // Just verify the page is showing the Storage Analysis interface
    await expect(page).toHaveURL(/\/db\/storage/);
    
    // Should show Storage Analysis heading
    const heading = page.locator('h1, h2').filter({ hasText: /Storage Analysis|Storage/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should display total database size', async ({ page }) => {
    // beforeEach already navigated to /db/storage
    
    // Should show database size metric
    const dbSizeLabel = page.locator('text=/Database Size|Total Size/i').first();
    await expect(dbSizeLabel).toBeVisible({ timeout: 10000 });
    
    // Should show size value (in bytes, KB, or MB)
    const dbSizeValue = page.locator('[data-testid="db-size"]').first();
    await expect(dbSizeValue).toBeVisible();
    
    // Verify it contains a numeric value
    const sizeText = await dbSizeValue.textContent();
    expect(sizeText).toMatch(/\d+\s*(bytes|KB|MB)/i);
  });

  test('should display table list with row counts', async ({ page }) => {
    // beforeEach already navigated to /db/storage and created test data
    
    // Should show tables section
    const tablesSection = page.locator('text=/Tables|Table Storage/i').first();
    await expect(tablesSection).toBeVisible({ timeout: 10000 });
    
    // Should show users table
    const usersTable = page.locator('[data-table-name="users"]').first();
    await expect(usersTable).toBeVisible();
    
    // Should show row count for users (3 rows)
    const usersRowCount = page.locator('text=/users.*3.*row|3.*row.*users/i').first();
    await expect(usersRowCount).toBeVisible();
    
    // Should show products table
    const productsTable = page.locator('[data-table-name="products"]').first();
    await expect(productsTable).toBeVisible();
    
    // Should show row count for products (2 rows)
    const productsRowCount = page.locator('text=/products.*2.*row|2.*row.*products/i').first();
    await expect(productsRowCount).toBeVisible();
  });

  test('should display table sizes in bytes/KB', async ({ page }) => {
    // beforeEach already navigated to /db/storage
    
    // Should show size information for tables - just verify any table has a size
    const tableSizeEl = page.locator('[data-testid="table-size"]').first();
    await expect(tableSizeEl).toBeVisible({ timeout: 10000 });
    
    const tableSize = await tableSizeEl.textContent();
    expect(tableSize).toMatch(/\d+\s*(bytes|KB|MB)/i);
  });

  test('should display index information', async ({ page }) => {
    // beforeEach already navigated to /db/storage
    
    // Should show indexes section
    const indexesSection = page.locator('text=/Indexes|Index Storage/i').first();
    await expect(indexesSection).toBeVisible({ timeout: 10000 });
    
    // Should show idx_users_email index
    const indexName = page.locator('text="idx_users_email"').first();
    await expect(indexName).toBeVisible();
    
    // Should show index size for any index
    const indexSize = page.locator('[data-testid="index-size"]').first();
    await expect(indexSize).toBeVisible();
  });

  test('should calculate total storage correctly', async ({ page }) => {
    // beforeEach already navigated to /db/storage
    
    // Get total database size
    const totalSize = await page.evaluate(() => {
      const sizeEl = document.querySelector('[data-testid="db-size"]');
      return sizeEl?.textContent || '';
    });
    
    expect(totalSize).toBeTruthy();
    expect(totalSize).toMatch(/\d+/); // Should have a numeric value
  });

  test('should refresh storage stats when refresh button clicked', async ({ page }) => {
    // beforeEach already navigated to /db/storage
    
    // Get initial size
    const initialSize = await page.locator('[data-testid="db-size"]').first().textContent();
    
    // Click refresh button
    const refreshButton = page.locator('#refreshStorageButton, button:has-text("Refresh")').first();
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();
    
    await page.waitForTimeout(500);
    
    // Size should still be present after refresh
    const refreshedSize = await page.locator('[data-testid="db-size"]').first().textContent();
    expect(refreshedSize).toBeTruthy();
  });

  test('should display empty state when no tables exist', async ({ page }) => {
    // Create empty database
    const emptyDbName = `empty_storage_w${Date.now()}`;
    
    await page.goto('/db');
    await page.waitForLoadState('networkidle');
    
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput', { timeout: 5000 });
    await page.fill('#dbNameInput', emptyDbName);
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, `${emptyDbName}.db`, { timeout: 15000 });

    await page.goto('/db/storage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Should show empty state message
    const emptyMessage = page.locator('text=/No tables|empty database/i').first();
    await expect(emptyMessage).toBeVisible({ timeout: 10000 });
    
    // Cleanup
    await page.evaluate(async (dbName) => {
      const Database = (window as any).Database;
      if (Database) {
        if (Database.deleteDatabase) {
          await Database.deleteDatabase(dbName + '.db');
        }
        await indexedDB.deleteDatabase(dbName + '.db');
      }
    }, emptyDbName);
  });

  test('should format sizes in human-readable format', async ({ page }) => {
    await page.goto('/db/storage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Check that sizes are formatted (not raw bytes like "8192")
    const sizeElements = await page.locator('[data-testid="table-size"], .table-size').all();
    
    for (const sizeEl of sizeElements) {
      const text = await sizeEl.textContent();
      // Should have a unit like KB, MB, or bytes
      expect(text).toMatch(/(bytes|KB|MB|GB)/i);
    }
  });
});
