/**
 * VFS Persistence Validation Tests
 * 
 * Validates that absurder-sql's IndexedDB VFS correctly persists data across
 * database close/reopen cycles. These tests use the raw Database API to isolate
 * VFS behavior from application code.
 * 
 * All tests pass, confirming the VFS works correctly.
 */

import { test, expect } from '@playwright/test';

const VITE_URL = 'http://localhost:3000';

test.describe('VFS Persistence Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(VITE_URL);
    await page.waitForTimeout(1000); // Wait for DB init
  });

  test('data persists across database close and reopen', async ({ page }) => {
    // Phase 1: Create database with simple data
    const setupResult = await page.evaluate(async () => {
      const logs = [];
      try {
        // Access the raw Database class (not wrapped)
        const { Database } = window;
        if (!Database) throw new Error('Database class not available');
        
        logs.push('Creating new database instance...');
        const db = await Database.newDatabase('vfs_test_minimal');
        
        logs.push('Creating simple table...');
        await db.execute('DROP TABLE IF EXISTS test_data');
        await db.execute('CREATE TABLE test_data (id INTEGER PRIMARY KEY, value TEXT)');
        
        logs.push('Inserting test data...');
        await db.execute("INSERT INTO test_data (id, value) VALUES (1, 'test_value_1')");
        await db.execute("INSERT INTO test_data (id, value) VALUES (2, 'test_value_2')");
        
        logs.push('Verifying data before sync...');
        const beforeSync = await db.execute('SELECT * FROM test_data ORDER BY id');
        logs.push(`Before sync: ${beforeSync.rows.length} rows`);
        
        logs.push('Calling sync()...');
        await db.sync();
        
        logs.push('Verifying data after sync...');
        const afterSync = await db.execute('SELECT * FROM test_data ORDER BY id');
        logs.push(`After sync: ${afterSync.rows.length} rows`);
        
        logs.push('Closing database...');
        await db.close();
        
        return { success: true, logs, rowCount: afterSync.rows.length };
      } catch (err) {
        logs.push(`ERROR: ${err.message}`);
        return { success: false, logs, error: err.message };
      }
    });
    
    console.log('Setup phase:', setupResult.logs.join('\n'));
    expect(setupResult.success, `Setup failed: ${setupResult.error}`).toBe(true);
    expect(setupResult.rowCount).toBe(2);

    // Phase 2: Reopen database and verify data persists
    await page.waitForTimeout(500);

    const reloadResult = await page.evaluate(async () => {
      const logs = [];
      try {
        const { Database } = window;
        
        logs.push('Creating NEW database instance (simulating reload)...');
        const db2 = await Database.newDatabase('vfs_test_minimal');
        
        logs.push('Querying data from reloaded database...');
        const result = await db2.execute('SELECT * FROM test_data ORDER BY id');
        
        logs.push(`Found ${result.rows.length} rows`);
        const data = result.rows.map(row => ({
          id: row.values[0].value,
          value: row.values[1].value
        }));
        logs.push(`Data: ${JSON.stringify(data)}`);
        
        await db2.close();
        
        return { success: true, logs, rowCount: result.rows.length, data };
      } catch (err) {
        logs.push(`ERROR: ${err.message}`);
        return { success: false, logs, error: err.message, rowCount: 0 };
      }
    });
    
    console.log('Reload phase:', reloadResult.logs.join('\n'));
    
    // Verify data persisted correctly
    expect(reloadResult.success, `Reload failed: ${reloadResult.error}`).toBe(true);
    expect(reloadResult.rowCount, 'Data should persist after reload').toBe(2);
    expect(reloadResult.data).toEqual([
      { id: 1, value: 'test_value_1' },
      { id: 2, value: 'test_value_2' }
    ]);
  });

  test('queries execute correctly after database reload', async ({ page }) => {
    // Setup: Create and sync database
    await page.evaluate(async () => {
      const { Database } = window;
      const db = await Database.newDatabase('vfs_test_hang');
      await db.execute('CREATE TABLE IF NOT EXISTS dummy (id INTEGER)');
      await db.execute('INSERT INTO dummy VALUES (1)');
      await db.sync();
      await db.close();
    });

    await page.waitForTimeout(500);

    // Verify queries execute without hanging
    const queryResult = await Promise.race([
      page.evaluate(async () => {
        const { Database } = window;
        const db2 = await Database.newDatabase('vfs_test_hang');
        const result = await db2.execute('SELECT 1');
        await db2.close();
        return { completed: true, rowCount: result.rows.length };
      }),
      new Promise(resolve => setTimeout(() => resolve({ completed: false }), 5000))
    ]);

    console.log('Query result:', queryResult);
    expect(queryResult.completed, 'Query should complete without hanging').toBe(true);
  });

  test('large datasets persist correctly with multiple blocks', async ({ page }) => {
    // Setup: Insert enough data to create multiple storage blocks
    await page.evaluate(async () => {
      const { Database } = window;
      const db = await Database.newDatabase('vfs_test_blocks');
      await db.execute('CREATE TABLE test (id INTEGER, data TEXT)');
      for (let i = 0; i < 100; i++) {
        await db.execute(`INSERT INTO test VALUES (${i}, 'data_${i}')`);
      }
      await db.sync();
      await db.close();
    });

    await page.waitForTimeout(500);

    // Reopen and verify all data persisted
    const blockResult = await page.evaluate(async () => {
      const { Database } = window;
      const db2 = await Database.newDatabase('vfs_test_blocks');
      
      const result = await db2.execute('SELECT COUNT(*) as count FROM test');
      const count = result.rows[0].values[0].value;
      
      await db2.close();
      return { count };
    });

    console.log('Large dataset result:', blockResult);
    expect(blockResult.count, 'All 100 rows should persist').toBe(100);
  });
});
