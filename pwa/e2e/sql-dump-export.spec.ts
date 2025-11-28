import { test, expect } from '@playwright/test';
import path from 'path';
import { readFileSync, existsSync, unlinkSync } from 'fs';

test.describe('SQL Dump Export', () => {
  // Unique database name per test run to avoid parallel test conflicts
  const testDbName = `sql-dump-export-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.db`;

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

    // Type something to enable execute button (waits for DB to be ready)
    await page.click('.cm-editor .cm-content');
    await page.keyboard.type('SELECT 1');
    await page.waitForSelector('#executeButton:not([disabled])', { timeout: 10000 });

    // Create test database with sample data
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS users');
      await db.execute(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          age INTEGER,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await db.execute(`
        INSERT INTO users (name, email, age) VALUES
        ('Alice', 'alice@example.com', 30),
        ('Bob', 'bob@example.com', 25),
        ('Charlie', 'charlie@example.com', 35)
      `);

      // Create index
      await db.execute('CREATE INDEX idx_users_email ON users(email)');
    });

    // Clear the editor for the test
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

  test('should display export SQL dump button when query has results', async ({ page }) => {
    // Run query
    await page.keyboard.type('SELECT * FROM users LIMIT 2');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable', { state: 'visible', timeout: 10000 });

    // Check export button is visible
    const exportButton = await page.locator('#exportSQL');
    await expect(exportButton).toBeVisible();
  });

  test('should export SQL dump with CREATE and INSERT statements', async ({ page }) => {
    // Run query
    await page.keyboard.type('SELECT * FROM users');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable', { state: 'visible', timeout: 10000 });

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportSQL');
    const download = await downloadPromise;

    // Verify filename
    const filename = download.suggestedFilename();
    expect(filename.endsWith('.sql')).toBe(true);

    // Verify content
    const downloadPath = await download.path();
    const sqlContent = readFileSync(downloadPath!, 'utf-8');

    // Should have CREATE TABLE statement (inferred from results)
    expect(sqlContent).toContain('CREATE TABLE');

    // Should have INSERT statements
    expect(sqlContent).toContain('INSERT INTO');
    expect(sqlContent).toContain('Alice');
    expect(sqlContent).toContain('Bob');
    expect(sqlContent).toContain('Charlie');
  });

  test('should open export options dialog and configure settings', async ({ page }) => {
    // Run query
    await page.keyboard.type('SELECT * FROM users LIMIT 1');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable', { state: 'visible', timeout: 10000 });

    // Click export options button
    await page.click('#exportSQLOptions');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Verify dialog opened
    const dialog = await page.locator('[role="dialog"]').filter({ hasText: 'SQL Dump Export Options' });
    await expect(dialog).toBeVisible();

    // Check all options are present
    await expect(page.locator('#dropTableIfExists')).toBeVisible();
    await expect(page.locator('#includeTransactions')).toBeVisible();
    await expect(page.locator('#batchSize')).toBeVisible();
  });

  test('should include DROP TABLE IF EXISTS when option is enabled', async ({ page }) => {
    // Run query
    await page.keyboard.type('SELECT * FROM users');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable', { state: 'visible', timeout: 10000 });

    // Open export options
    await page.click('#exportSQLOptions');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Enable DROP TABLE IF EXISTS
    await page.click('#dropTableIfExists');

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#confirmSQLExport');
    const download = await downloadPromise;

    // Verify DROP TABLE is included
    const downloadPath = await download.path();
    const sqlContent = readFileSync(downloadPath!, 'utf-8');

    expect(sqlContent).toContain('DROP TABLE IF EXISTS');
  });

  test('should wrap statements in transaction when option is enabled', async ({ page }) => {
    // Run query
    await page.keyboard.type('SELECT * FROM users');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable', { state: 'visible', timeout: 10000 });

    // Open export options
    await page.click('#exportSQLOptions');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Transaction is enabled by default, just export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#confirmSQLExport');
    const download = await downloadPromise;

    // Verify transaction wrapper
    const downloadPath = await download.path();
    const sqlContent = readFileSync(downloadPath!, 'utf-8');

    expect(sqlContent).toContain('BEGIN TRANSACTION');
    expect(sqlContent).toContain('COMMIT');
  });

  test('should batch INSERT statements with configurable size', async ({ page }) => {
    // Create more test data
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('BEGIN TRANSACTION');
      for (let i = 4; i <= 250; i++) {
        const age = 20 + (i % 50);
        await db.execute(
          `INSERT INTO users (name, email, age) VALUES ('User ${i}', 'user${i}@example.com', ${age})`
        );
      }
      await db.execute('COMMIT');
    });

    // Run query for all rows
    await page.keyboard.type('SELECT * FROM users');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable', { state: 'visible', timeout: 30000 });

    // Open export options
    await page.click('#exportSQLOptions');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Set batch size to 100
    await page.fill('#batchSize', '100');

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#confirmSQLExport');
    const download = await downloadPromise;

    // Verify batching (250 rows = 3 INSERT statements with batch size 100)
    const downloadPath = await download.path();
    const sqlContent = readFileSync(downloadPath!, 'utf-8');

    const insertCount = (sqlContent.match(/INSERT INTO/g) || []).length;
    expect(insertCount).toBe(3); // 100, 100, 50
  });

  test('should handle NULL values correctly in SQL dump', async ({ page }) => {
    // Insert row with NULL
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute(
        `INSERT INTO users (name, email, age) VALUES ('NullAge', 'null@example.com', NULL)`
      );
    });

    // Run query
    await page.keyboard.type('SELECT * FROM users WHERE age IS NULL');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable', { state: 'visible', timeout: 10000 });

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportSQL');
    const download = await downloadPromise;

    // Verify NULL is represented correctly
    const downloadPath = await download.path();
    const sqlContent = readFileSync(downloadPath!, 'utf-8');

    expect(sqlContent).toContain('NULL');
    expect(sqlContent).toContain('NullAge');
  });

  test('should properly escape special characters in SQL dump', async ({ page }) => {
    // Insert special data
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute(
        `INSERT INTO users (name, email, age) VALUES
        ("User with 'quotes'", 'quotes@example.com', 40),
        ('User with "double quotes"', 'double@example.com', 41),
        ("User with\nnewline", 'newline@example.com', 42)`
      );
    });

    // Run query
    await page.keyboard.type('SELECT * FROM users WHERE age >= 40');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable', { state: 'visible', timeout: 10000 });

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportSQL');
    const download = await downloadPromise;

    // Verify special characters are properly escaped
    const downloadPath = await download.path();
    const sqlContent = readFileSync(downloadPath!, 'utf-8');

    expect(sqlContent).toContain("'User with ''quotes'''");
    expect(sqlContent).toContain('User with "double quotes"');
  });

  test('should export empty results with CREATE TABLE only (no INSERTs)', async ({ page }) => {
    // Run query with no results
    await page.keyboard.type('SELECT * FROM users WHERE id = 999');
    await page.click('#executeButton');

    // Wait for query execution to complete (results table or empty message)
    await page.waitForFunction(() => {
      const resultsTable = document.getElementById('resultsTable');
      const emptyResults = document.querySelector('[data-testid="empty-results"]');
      const noResultsText = document.body.textContent?.toLowerCase().includes('no results') ||
                            document.body.textContent?.toLowerCase().includes('no rows');
      return resultsTable || emptyResults || noResultsText;
    }, { timeout: 10000 });
    await page.waitForSelector('#exportSQL', { state: 'visible', timeout: 5000 });

    // Export should still work
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportSQL');
    const download = await downloadPromise;

    // Verify only CREATE TABLE, no INSERTs
    const downloadPath = await download.path();
    const sqlContent = readFileSync(downloadPath!, 'utf-8');

    expect(sqlContent).toContain('CREATE TABLE');
    expect(sqlContent).not.toContain('INSERT INTO');
  });

  test('should generate valid SQL that can be re-imported', async ({ page }) => {
    // Run query
    await page.keyboard.type('SELECT * FROM users');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable', { state: 'visible', timeout: 10000 });

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportSQL');
    const download = await downloadPromise;

    // Read exported SQL
    const downloadPath = await download.path();
    const sqlContent = readFileSync(downloadPath!, 'utf-8');

    // Try to execute the exported SQL in a new table
    const result = await page.evaluate(async (sql: string) => {
      try {
        const db = (window as any).testDb;

        // Modify SQL to create a new table name
        const modifiedSql = sql.replace(/query_results/g, 'users_imported');

        console.log('[SQL IMPORT TEST] Modified SQL:', modifiedSql.substring(0, 500));

        // Execute the dump
        const statements = modifiedSql.split(';').filter(s => s.trim());
        console.log('[SQL IMPORT TEST] Statements count:', statements.length);

        for (const stmt of statements) {
          if (stmt.trim()) {
            console.log('[SQL IMPORT TEST] Executing:', stmt.substring(0, 100));
            await db.execute(stmt.trim());
          }
        }

        // Verify data was imported
        const result = await db.execute('SELECT COUNT(*) as count FROM users_imported');
        return {
          success: true,
          count: result.rows[0].values[0].value
        };
      } catch (error: any) {
        console.error('[SQL IMPORT TEST] Error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    }, sqlContent);

    console.log('[SQL IMPORT TEST] Result:', result);

    expect(result.success).toBe(true);
    expect(result.count).toBe(3); // Original 3 rows
  });

  test('should handle large result set efficiently', async ({ page }) => {
    // Create large dataset
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('BEGIN TRANSACTION');
      for (let i = 4; i <= 1000; i++) {
        const age = 20 + (i % 50);
        await db.execute(
          `INSERT INTO users (name, email, age) VALUES ('User ${i}', 'user${i}@example.com', ${age})`
        );
      }
      await db.execute('COMMIT');
    });

    // Run query for all rows
    await page.keyboard.type('SELECT * FROM users');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable', { state: 'visible', timeout: 30000 });

    // Export
    const start = Date.now();
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportSQL');
    const download = await downloadPromise;
    const exportTime = Date.now() - start;

    // Verify export completed reasonably fast (< 5 seconds)
    expect(exportTime).toBeLessThan(5000);

    // Verify file is not empty and has reasonable size
    const downloadPath = await download.path();
    const sqlContent = readFileSync(downloadPath!, 'utf-8');

    expect(sqlContent.length).toBeGreaterThan(1000); // Should have substantial content
    expect(sqlContent).toContain('INSERT INTO');
  });

  test('should preserve data types in SQL dump', async ({ page }) => {
    // Run query
    await page.keyboard.type('SELECT id, name, email, age FROM users WHERE id = 1');
    await page.click('#executeButton');
    await page.waitForSelector('#resultsTable', { state: 'visible', timeout: 10000 });

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportSQL');
    const download = await downloadPromise;

    // Verify data types are preserved in INSERT
    const downloadPath = await download.path();
    const sqlContent = readFileSync(downloadPath!, 'utf-8');

    // Integer without quotes
    expect(sqlContent).toMatch(/\b1\b/); // id
    expect(sqlContent).toMatch(/\b30\b/); // age

    // Text with quotes
    expect(sqlContent).toContain("'Alice'");
    expect(sqlContent).toContain("'alice@example.com'");
  });
});
