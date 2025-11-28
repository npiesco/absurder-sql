/**
 * Test for "closure invoked after being dropped" error
 *
 * Root cause: LeaderElectionManager has no Drop impl, so when the manager
 * is dropped, clearInterval is never called. The setInterval keeps firing
 * and invokes a freed closure.
 *
 * Expected behavior: No errors after database is closed/dropped
 * Current behavior: "closure invoked recursively or after being dropped" errors
 */
import { test, expect } from '@playwright/test';

test.describe('Heartbeat Drop-After-Freed Bug', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to vite app
    await page.goto('http://localhost:3000');

    // Wait for database to be ready (window.__db__ exposed after init)
    await page.waitForFunction(() => window.__db__ !== undefined, { timeout: 30000 });
  });

  test('should NOT error when database is dropped while heartbeat is running', async ({ page }) => {
    const errors = [];

    // Capture all closure-related errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('closure invoked') || text.includes('after being dropped')) {
          errors.push({ type: 'console', text });
        }
      }
    });

    page.on('pageerror', err => {
      if (err.message.includes('closure invoked') || err.message.includes('after being dropped')) {
        errors.push({ type: 'pageerror', text: err.message });
      }
    });

    console.log('[TEST] Database initialized, creating additional databases...');

    // Create and immediately destroy multiple databases to trigger the bug
    const result = await page.evaluate(async () => {
      const results = [];
      const Database = window.Database;

      for (let i = 0; i < 3; i++) {
        try {
          // Create a new database (starts heartbeat via leader election)
          const db = await Database.newDatabase(`drop_test_${i}_${Date.now()}`);
          results.push({ step: `create_${i}`, success: true });

          // Do a quick operation to ensure it's fully initialized
          await db.execute('SELECT 1');
          results.push({ step: `query_${i}`, success: true });

          // Wait a bit to let heartbeat establish
          await new Promise(r => setTimeout(r, 1500));

          // Close/drop the database (should clearInterval, but doesn't!)
          await db.close();
          results.push({ step: `close_${i}`, success: true });

        } catch (e) {
          results.push({ step: `error_${i}`, success: false, error: e.message });
        }
      }

      return results;
    });

    console.log('[TEST] Database operations:', JSON.stringify(result, null, 2));

    // Wait 3 seconds for any post-drop interval fires
    // Heartbeat is 1 second, so 3 seconds = 3 potential ghost invocations per dropped db
    console.log('[TEST] Waiting 3 seconds for ghost heartbeat invocations...');
    await page.waitForTimeout(3000);

    console.log('[TEST] Errors captured:', errors.length);
    if (errors.length > 0) {
      console.log('[TEST] Error details:', JSON.stringify(errors, null, 2));
    }

    // ASSERTION: No "after being dropped" errors should occur
    // This test will FAIL until the Drop impl is added to LeaderElectionManager
    expect(errors.length).toBe(0);
  });

  test('rapid create-destroy cycle should not leak intervals', async ({ page }) => {
    const errors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', err => {
      errors.push(err.message);
    });

    // Rapid create-destroy cycle
    const result = await page.evaluate(async () => {
      const Database = window.Database;
      const ops = [];

      // Rapid fire: create and immediately close 10 databases
      for (let i = 0; i < 10; i++) {
        const db = await Database.newDatabase(`rapid_${i}_${Date.now()}`);
        await db.execute('SELECT 1');
        await db.close();
        ops.push(i);
      }

      return ops;
    });

    console.log('[TEST] Completed rapid cycle:', result.length, 'databases');

    // Wait for potential ghost intervals (10 dbs × 1s heartbeat × 5 seconds = many potential errors)
    await page.waitForTimeout(5000);

    // Filter for closure errors specifically
    const closureErrors = errors.filter(e =>
      e.includes('closure invoked') || e.includes('after being dropped')
    );

    console.log('[TEST] Closure errors after rapid cycle:', closureErrors.length);

    // This will FAIL until Drop impl is added
    expect(closureErrors.length).toBe(0);
  });
});
