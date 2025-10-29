import { test, expect } from '@playwright/test';

test.describe('DatabaseClient E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test');
    await page.waitForSelector('#status', { timeout: 10000 });
  });

  test('should initialize WASM and open database', async ({ page }) => {
    // Wait for database to be ready
    await page.waitForSelector('#status:has-text("Database ready")', { timeout: 10000 });
    
    const status = await page.textContent('#status');
    expect(status).toBe('Database ready');
    
    // Verify db is exposed on window
    const hasDb = await page.evaluate(() => {
      return typeof (window as any).dbClient !== 'undefined';
    });
    expect(hasDb).toBe(true);
  });

  test('should execute CREATE TABLE', async ({ page }) => {
    await page.waitForSelector('#status:has-text("Database ready")');
    
    const result = await page.evaluate(async () => {
      const db = (window as any).dbClient;
      
      // Clean slate
      await db.execute('DROP TABLE IF EXISTS test_users');
      await db.execute('CREATE TABLE test_users (id INTEGER PRIMARY KEY, email TEXT)');
      
      return true;
    });
    
    expect(result).toBe(true);
    
    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).dbClient;
      await db.execute('DROP TABLE IF EXISTS test_users');
    });
  });

  test('should INSERT and SELECT data', async ({ page }) => {
    await page.waitForSelector('#status:has-text("Database ready")');
    
    const result = await page.evaluate(async () => {
      const db = (window as any).dbClient;
      
      // Clean slate
      await db.execute('DROP TABLE IF EXISTS test_items');
      await db.execute('CREATE TABLE test_items (id INTEGER, name TEXT)');
      
      // Insert with parameters
      await db.execute('INSERT INTO test_items (id, name) VALUES (?, ?)', [
        { type: 'Integer', value: 1 },
        { type: 'Text', value: 'Widget' }
      ]);
      
      // Query
      const queryResult = await db.execute('SELECT * FROM test_items WHERE id = 1');
      
      return {
        rowCount: queryResult.rows.length,
        firstRow: queryResult.rows[0]
      };
    });
    
    expect(result.rowCount).toBe(1);
    expect(result.firstRow.values[0].value).toBe(1);
    expect(result.firstRow.values[1].value).toBe('Widget');
    
    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).dbClient;
      await db.execute('DROP TABLE IF EXISTS test_items');
    });
  });

  test('should export database', async ({ page }) => {
    await page.waitForSelector('#status:has-text("Database ready")');
    
    const hasExport = await page.evaluate(async () => {
      const db = (window as any).dbClient;
      
      // Clean slate
      await db.execute('DROP TABLE IF EXISTS test_export');
      await db.execute('CREATE TABLE test_export (id INTEGER, data TEXT)');
      await db.execute('INSERT INTO test_export VALUES (?, ?)', [
        { type: 'Integer', value: 42 },
        { type: 'Text', value: 'export test data' }
      ]);
      
      // Export
      const blob = await db.export();
      
      return blob.size > 0 && blob.type === 'application/x-sqlite3';
    });
    
    expect(hasExport).toBe(true);
    
    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).dbClient;
      await db.execute('DROP TABLE IF EXISTS test_export');
    });
  });

  test('should handle errors gracefully', async ({ page }) => {
    await page.waitForSelector('#status:has-text("Database ready")');
    
    const errorThrown = await page.evaluate(async () => {
      const db = (window as any).dbClient;
      
      try {
        // Invalid SQL
        await db.execute('INVALID SQL SYNTAX');
        return false;
      } catch (err: any) {
        return err.message.includes('Query failed');
      }
    });
    
    expect(errorThrown).toBe(true);
  });

  test('should run UI test button', async ({ page }) => {
    await page.waitForSelector('#status:has-text("Database ready")');
    
    // Clean slate for UI test
    await page.evaluate(async () => {
      const db = (window as any).dbClient;
      await db.execute('DROP TABLE IF EXISTS test');
    });
    
    // Click the run test button
    await page.click('#runTest');
    
    // Wait for test to complete
    await page.waitForSelector('#status:has-text("Test passed")');
    
    const status = await page.textContent('#status');
    expect(status).toContain('Test passed');
    expect(status).toContain('Rows: 1');
    
    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).dbClient;
      await db.execute('DROP TABLE IF EXISTS test');
    });
  });
});
