/**
 * Tests for heartbeat closure reentrancy guard
 *
 * The leader election heartbeat uses a setInterval closure that can be
 * invoked recursively if the previous tick hasn't completed. This test
 * verifies that the reentrancy guard prevents "closure invoked recursively" errors.
 */
import { test, expect } from '@playwright/test';

test.describe('Heartbeat Reentrancy Guard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the vite example app
    await page.goto('http://localhost:3000');

    // Wait for the app to load and database to initialize
    await page.waitForFunction(() => {
      return window.__db__ !== undefined;
    }, { timeout: 30000 });
  });

  test('heartbeat closure should not produce recursive invocation errors', async ({ page }) => {
    const closureErrors = [];

    // Capture console errors for closure recursion
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('closure invoked recursively')) {
          closureErrors.push(text);
        }
      }
    });

    // Also capture uncaught exceptions
    page.on('pageerror', err => {
      if (err.message.includes('closure invoked recursively')) {
        closureErrors.push(err.message);
      }
    });

    // Wait for app to initialize
    await page.waitForFunction(() => {
      return window.__db__ !== undefined;
    }, { timeout: 30000 });

    // Wait 5 seconds for heartbeat errors to potentially accumulate
    // Heartbeat fires every 1 second, so 5 seconds = 5 potential invocations
    console.log('[TEST] Waiting 5 seconds for heartbeat cycles...');
    await page.waitForTimeout(5000);

    // Execute some database operations to stress the system
    const results = await page.evaluate(async () => {
      const db = window.__db__;
      const ops = [];

      try {
        // Multiple rapid operations
        for (let i = 0; i < 10; i++) {
          const result = await db.execute(`SELECT ${i + 1} as num`);
          ops.push({ op: `select_${i}`, success: result.rows.length === 1 });
        }
      } catch (e) {
        ops.push({ op: 'error', success: false, error: e.message });
      }

      return ops;
    });

    // Wait another 3 seconds for any delayed errors
    await page.waitForTimeout(3000);

    console.log('[TEST] Closure errors captured:', closureErrors.length);
    console.log('[TEST] Operations completed:', results.length);

    // ASSERTION: No closure recursion errors should occur
    expect(closureErrors.length).toBe(0);

    // All operations should succeed
    for (const result of results) {
      expect(result.success).toBe(true);
    }
  });

  test('database operations work correctly with heartbeat running', async ({ page }) => {
    // Wait for app
    await page.waitForFunction(() => {
      return window.__db__ !== undefined;
    }, { timeout: 30000 });

    // Execute a series of database operations
    const results = await page.evaluate(async () => {
      const db = window.__db__;
      const ops = [];

      try {
        // Create table
        await db.execute('CREATE TABLE IF NOT EXISTS heartbeat_test (id INTEGER PRIMARY KEY, value TEXT)');
        ops.push({ op: 'create_table', success: true });

        // Insert data
        await db.execute("INSERT INTO heartbeat_test (value) VALUES ('test1')");
        ops.push({ op: 'insert', success: true });

        // Read data
        const result = await db.execute('SELECT * FROM heartbeat_test');
        ops.push({ op: 'select', success: result.rows.length >= 1 });

        // Cleanup
        await db.execute('DROP TABLE heartbeat_test');
        ops.push({ op: 'drop_table', success: true });
      } catch (e) {
        ops.push({ op: 'error', success: false, error: e.message });
      }

      return ops;
    });

    console.log('[TEST] Database operations:', JSON.stringify(results, null, 2));

    // All operations should succeed
    for (const result of results) {
      expect(result.success).toBe(true);
    }
  });
});
