import { test, expect } from '@playwright/test';

test.describe('Schema Viewer E2E', () => {
  // Unique database name per test run to avoid parallel test conflicts
  const testDbName = `schema-viewer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.db`;

  test.beforeEach(async ({ page }) => {
    await page.goto('/db/schema');
    await page.waitForSelector('#schemaViewer', { timeout: 10000 });

    // Wait for WASM to be ready
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });

    // Create database programmatically since schema page needs one
    await page.evaluate(async (dbName) => {
      const Database = (window as any).Database;
      const testDb = await Database.newDatabase(dbName);
      await testDb.allowNonLeaderWrites(true);
      (window as any).testDb = testDb;
      (window as any).testDbName = dbName;
    }, testDbName);

    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
  });

  test.afterEach(async ({ page }) => {
    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      const dbName = (window as any).testDbName;
      if (db) {
        try { await db.close(); } catch {}
      }
      if (dbName) { try { await indexedDB.deleteDatabase(dbName); } catch {} }
    }).catch(() => {});
  });

  test('should display tables list', async ({ page }) => {
    // Wait for database to be ready
    await page.waitForSelector('#refreshButton:not([disabled])', { timeout: 15000 });
    
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS users');
      await db.execute('DROP TABLE IF EXISTS posts');
      await db.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
      await db.execute('CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT)');
    });

    await page.click('#refreshButton');
    await page.waitForSelector('#tablesList');

    const tables = await page.locator('#tablesList .table-item').allTextContents();
    expect(tables.some(t => t.includes('users'))).toBe(true);
    expect(tables.some(t => t.includes('posts'))).toBe(true);

    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS users');
      await db.execute('DROP TABLE IF EXISTS posts');
    });
  });

  test('should display table details when selected', async ({ page }) => {
    await page.waitForSelector('#refreshButton:not([disabled])', { timeout: 15000 });

    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS test_table');
      await db.execute('CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT NOT NULL, age INTEGER)');
    });

    await page.click('#refreshButton');
    await page.waitForSelector('#tablesList .table-item');

    // Click on table
    await page.click('#tablesList .table-item:has-text("test_table")');

    // Wait for table details
    await page.waitForSelector('#tableDetails');

    // Check columns are displayed
    const columns = await page.locator('#tableDetails .column-row').count();
    expect(columns).toBe(3);

    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS test_table');
    });
  });

  test('should display column types and constraints', async ({ page }) => {
    await page.waitForSelector('#refreshButton:not([disabled])', { timeout: 15000 });

    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS constraints_test');
      await db.execute('CREATE TABLE constraints_test (id INTEGER PRIMARY KEY, email TEXT UNIQUE, age INTEGER NOT NULL)');
    });

    await page.click('#refreshButton');
    await page.waitForSelector('#tablesList .table-item');
    await page.click('#tablesList .table-item:has-text("constraints_test")');
    await page.waitForSelector('#tableDetails');

    // Check column details
    const detailsText = await page.textContent('#tableDetails');
    expect(detailsText).toContain('id');
    expect(detailsText).toContain('INTEGER');
    expect(detailsText).toContain('PRIMARY KEY');

    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS constraints_test');
    });
  });

  test('should display indexes list', async ({ page }) => {
    await page.waitForSelector('#refreshButton:not([disabled])', { timeout: 15000 });

    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS indexed_table');
      await db.execute('DROP INDEX IF EXISTS idx_name');
      await db.execute('CREATE TABLE indexed_table (id INTEGER, name TEXT)');
      await db.execute('CREATE INDEX idx_name ON indexed_table(name)');
    });

    await page.click('#refreshButton');
    await page.waitForSelector('#tablesList .table-item');
    await page.click('#tablesList .table-item:has-text("indexed_table")');
    await page.waitForSelector('#indexesList');

    const indexesText = await page.textContent('#indexesList');
    expect(indexesText).toContain('idx_name');

    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP INDEX IF EXISTS idx_name');
      await db.execute('DROP TABLE IF EXISTS indexed_table');
    });
  });

  test('should create new table', async ({ page }) => {
    await page.waitForSelector('#refreshButton:not([disabled])', { timeout: 15000 });

    await page.click('#createTableButton');
    await page.waitForSelector('#createTableDialog');

    await page.fill('#tableNameInput', 'new_test_table');
    await page.fill('#columnDefinitions', 'id INTEGER PRIMARY KEY, name TEXT');
    await page.click('#confirmCreateTable');

    // Wait for dialog to close
    await page.waitForSelector('#createTableDialog', { state: 'hidden' });

    // Verify table exists in list
    await page.click('#refreshButton');
    await page.waitForSelector('#tablesList .table-item');
    const tables = await page.locator('#tablesList .table-item').allTextContents();
    expect(tables.some(t => t.includes('new_test_table'))).toBe(true);

    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS new_test_table');
    });
  });

  test('should create new index', async ({ page }) => {
    await page.waitForSelector('#refreshButton:not([disabled])', { timeout: 15000 });

    // Create table first
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS index_test_table');
      await db.execute('CREATE TABLE index_test_table (id INTEGER, name TEXT)');
    });

    await page.click('#refreshButton');
    await page.waitForSelector('#tablesList .table-item');
    await page.click('#tablesList .table-item:has-text("index_test_table")');

    await page.click('#createIndexButton');
    await page.waitForSelector('#createIndexDialog');

    await page.fill('#indexNameInput', 'idx_test_name');
    await page.fill('#indexColumns', 'name');
    await page.click('#confirmCreateIndex');

    await page.waitForSelector('#status:has-text("Index created")');

    // Verify index exists
    await page.click('#refreshButton');
    await page.waitForSelector('#tablesList .table-item');
    await page.click('#tablesList .table-item:has-text("index_test_table")');
    await page.waitForSelector('#indexesList');

    const indexesText = await page.textContent('#indexesList');
    expect(indexesText).toContain('idx_test_name');

    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP INDEX IF EXISTS idx_test_name');
      await db.execute('DROP TABLE IF EXISTS index_test_table');
    });
  });

  test('should handle table creation errors', async ({ page }) => {
    await page.waitForSelector('#refreshButton:not([disabled])', { timeout: 15000 });

    await page.click('#createTableButton');
    await page.waitForSelector('#createTableDialog');

    // Try to create with invalid SQL (syntax error)
    await page.fill('#tableNameInput', 'bad_table');
    await page.fill('#columnDefinitions', 'id INTEGER,, name TEXT');
    await page.click('#confirmCreateTable');

    // Wait for error to appear
    await page.waitForSelector('#errorDisplay', { timeout: 5000 });
    
    const errorText = await page.textContent('#errorDisplay');
    expect(errorText?.toLowerCase()).toContain('error');
  });
});
