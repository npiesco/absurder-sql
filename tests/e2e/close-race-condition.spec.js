/**
 * Tests for close race condition bugs
 *
 * These tests reproduce two bugs that occur when database.close() is called
 * while a database operation is in flight (e.g., during HMR rapid remount):
 *
 * 1. RuntimeError: unreachable - WASM panic when close races with query
 * 2. recursive use of an object detected - concurrent mutable borrow during close
 *
 * Both errors originate from the same closure pattern where RefCell borrows
 * overlap during concurrent access.
 *
 * Root cause: BroadcastChannel callbacks capture JavaScript function references.
 * When the component unmounts, those JS functions become invalid, but the
 * WASM closure still tries to call them if a broadcast message arrives.
 */
import { test, expect } from '@playwright/test';

test.describe('Close Race Condition Bugs', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the vite example app
    await page.goto('http://localhost:3000');

    // Wait for the app to load and database to initialize
    await page.waitForFunction(() => {
      return window.__db__ !== undefined;
    }, { timeout: 30000 });
  });

  test('BUG: RuntimeError unreachable when close() races with execute()', async ({ page }) => {
    /**
     * This test reproduces the WASM panic:
     * RuntimeError: unreachable at absurder_sql_bg.wasm:0xf6c05
     *
     * Trigger: Call close() while execute() is still in flight
     * Root cause: WASM code hits unreachable instruction during torn-down state
     */
    const errors = [];

    page.on('pageerror', err => {
      errors.push({ type: 'pageerror', message: err.message });
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({ type: 'console', message: msg.text() });
      }
    });

    // Execute the race condition scenario
    const result = await page.evaluate(async () => {
      const db = window.__db__;
      const results = {
        executeStarted: false,
        closeStarted: false,
        executeError: null,
        closeError: null,
      };

      try {
        // Start a query but DON'T await it
        const queryPromise = (async () => {
          results.executeStarted = true;
          // Long-running query to increase race window
          for (let i = 0; i < 100; i++) {
            await db.execute(`SELECT ${i} as num, 'padding_' || ${i} as text`);
          }
        })();

        // Immediately call close() while query is in flight
        // This creates the race condition
        results.closeStarted = true;

        // Small delay to let the query start, but not finish
        await new Promise(r => setTimeout(r, 5));

        try {
          await db.close();
        } catch (e) {
          results.closeError = e.message;
        }

        // Wait for the query to finish (or fail)
        try {
          await queryPromise;
        } catch (e) {
          results.executeError = e.message;
        }
      } catch (e) {
        results.unexpectedError = e.message;
      }

      return results;
    });

    console.log('[TEST] Race condition result:', JSON.stringify(result, null, 2));
    console.log('[TEST] Errors captured:', JSON.stringify(errors, null, 2));

    // BUG ASSERTION: This test should PASS when the bug is FIXED
    // Currently, we expect either:
    // 1. RuntimeError: unreachable
    // 2. Some error in the execute or close
    // 3. Errors captured in page errors

    const hasUnreachableError = errors.some(e =>
      e.message.includes('unreachable') ||
      e.message.includes('RuntimeError')
    ) || (result.executeError && result.executeError.includes('unreachable'));

    const hasAnyError = errors.length > 0 || !!result.executeError || !!result.closeError;

    // When fixed: no errors should occur - operations should be serialized or gracefully handled
    // Currently: we expect errors due to the race condition
    expect(hasAnyError).toBe(false);
  });

  test('BUG: recursive use of object detected when close() concurrent with operation', async ({ page }) => {
    /**
     * This test reproduces the RefCell borrow error:
     * "recursive use of an object detected which would lead to unsafe aliasing in rust"
     *
     * Trigger: Multiple concurrent accesses to RefCell-wrapped state
     * Root cause: borrow() called while borrow_mut() is still held
     */
    const errors = [];

    page.on('pageerror', err => {
      errors.push({ type: 'pageerror', message: err.message });
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({ type: 'console', message: msg.text() });
      }
    });

    // Execute multiple concurrent operations to trigger RefCell conflict
    const result = await page.evaluate(async () => {
      const db = window.__db__;
      const results = {
        concurrentOps: 0,
        errors: [],
      };

      try {
        // Fire multiple operations concurrently without awaiting
        const promises = [];

        // Start 10 concurrent queries
        for (let i = 0; i < 10; i++) {
          promises.push(
            db.execute(`SELECT ${i} as id, 'data' as value`)
              .then(() => { results.concurrentOps++; })
              .catch(e => { results.errors.push(`query_${i}: ${e.message}`); })
          );
        }

        // Also fire close() concurrently
        promises.push(
          db.close()
            .then(() => { results.closedOk = true; })
            .catch(e => { results.errors.push(`close: ${e.message}`); })
        );

        // Wait for all to settle
        await Promise.allSettled(promises);
      } catch (e) {
        results.unexpectedError = e.message;
      }

      return results;
    });

    console.log('[TEST] Concurrent ops result:', JSON.stringify(result, null, 2));
    console.log('[TEST] Errors captured:', JSON.stringify(errors, null, 2));

    // BUG ASSERTION: This test should PASS when the bug is FIXED
    const hasRecursiveError = errors.some(e =>
      e.message.includes('recursive use') ||
      e.message.includes('unsafe aliasing')
    ) || result.errors.some(e =>
      e.includes('recursive use') ||
      e.includes('unsafe aliasing')
    );

    const hasAnyError = errors.length > 0 || result.errors.length > 0;

    // When fixed: operations should be serialized or gracefully cancelled
    // Currently: we expect "recursive use of an object detected" error
    expect(hasAnyError).toBe(false);
  });

  test('BUG: HMR-style rapid mount/unmount causes closure errors', async ({ page }) => {
    /**
     * This test simulates HMR behavior where:
     * 1. Database is created and operation starts
     * 2. Component "unmounts" (close called)
     * 3. New database created immediately
     * 4. Repeat rapidly
     *
     * This reproduces the actual user scenario that triggers both bugs.
     */
    const errors = [];

    page.on('pageerror', err => {
      errors.push({ type: 'pageerror', message: err.message });
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({ type: 'console', message: msg.text() });
      }
    });

    // Simulate HMR rapid remount cycles using window.__Database__ exposed by vite-app
    const result = await page.evaluate(async () => {
      // Use the Database class exposed by the vite-app
      const Database = window.__Database__;
      if (!Database) {
        return { error: '__Database__ not exposed on window' };
      }

      const results = {
        cycles: 0,
        errors: [],
      };

      // Simulate 5 HMR cycles
      for (let cycle = 0; cycle < 5; cycle++) {
        try {
          // Create new database (like component mount)
          const db = await Database.newDatabase(`hmr_test_${cycle}`);

          // Start an operation but DON'T await (simulating in-flight query when HMR triggers)
          const queryPromise = db.execute('SELECT 1 as test');

          // Immediately close (simulating component unmount during HMR)
          // This is the race condition - close while query in flight
          const closePromise = db.close();

          // Wait for both to settle (one or both may error)
          await Promise.allSettled([queryPromise, closePromise]);

          results.cycles++;
        } catch (e) {
          results.errors.push(`cycle_${cycle}: ${e.message}`);
        }

        // Small delay between cycles (simulating HMR debounce)
        await new Promise(r => setTimeout(r, 10));
      }

      return results;
    });

    console.log('[TEST] HMR simulation result:', JSON.stringify(result, null, 2));
    console.log('[TEST] Errors captured:', JSON.stringify(errors, null, 2));

    // Skip this test if __Database__ is not exposed (test infrastructure issue, not bug)
    if (result.error && result.error.includes('__Database__ not exposed')) {
      console.log('[TEST] Skipping - __Database__ not exposed by vite-app');
      // For now, just use the existing db and simulate multiple close calls
      const fallbackResult = await page.evaluate(async () => {
        const db = window.__db__;
        const results = { cycles: 0, errors: [] };

        // Rapid operations followed by close
        for (let i = 0; i < 10; i++) {
          const queryPromise = db.execute(`SELECT ${i} as num`);
          // Don't await - fire and forget
        }

        // Now close while queries might still be in flight
        try {
          await db.close();
          results.closedOk = true;
        } catch (e) {
          results.errors.push(`close: ${e.message}`);
        }

        return results;
      });

      console.log('[TEST] Fallback result:', JSON.stringify(fallbackResult, null, 2));
      expect(errors.length).toBe(0);
      expect(fallbackResult.errors.length).toBe(0);
      return;
    }

    // BUG ASSERTION: When fixed, no errors should occur during rapid mount/unmount
    expect(errors.length).toBe(0);
    expect(result.errors.length).toBe(0);
  });

  test('BUG: BroadcastChannel callback invoked during database destruction', async ({ page }) => {
    /**
     * This test targets the specific bug where:
     * 1. A database registers a BroadcastChannel listener
     * 2. The listener closure captures a JS callback reference
     * 3. The database is closed/dropped
     * 4. A BroadcastChannel message arrives and tries to invoke the stale callback
     *
     * Error: "closure invoked during destruction of closure h7f337ef9eafd31ce"
     */
    const errors = [];

    page.on('pageerror', err => {
      errors.push({ type: 'pageerror', message: err.message });
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({ type: 'console', message: msg.text() });
      }
    });

    // Simulate the race condition with BroadcastChannel
    const result = await page.evaluate(async () => {
      const results = {
        channelCreated: false,
        messagesPosted: 0,
        closeCalled: false,
        errors: [],
      };

      try {
        const db = window.__db__;
        const dbName = 'vite_example'; // Match the database name used in vite-app

        // Create a BroadcastChannel that will send messages
        const channel = new BroadcastChannel(`absurder_sql_${dbName}_changes`);
        results.channelCreated = true;

        // Start posting messages rapidly (simulating multi-tab activity)
        const messageInterval = setInterval(() => {
          try {
            channel.postMessage({
              type: 'data_change',
              timestamp: Date.now(),
              table: 'test_table',
            });
            results.messagesPosted++;
          } catch (e) {
            results.errors.push(`postMessage: ${e.message}`);
          }
        }, 10); // Every 10ms

        // Let some messages flow
        await new Promise(r => setTimeout(r, 50));

        // Now close the database while messages are still flowing
        results.closeCalled = true;
        const closePromise = db.close();

        // Continue posting messages during close
        await new Promise(r => setTimeout(r, 100));

        // Stop the message flood
        clearInterval(messageInterval);

        // Wait for close to complete (or fail)
        try {
          await closePromise;
          results.closeSuccess = true;
        } catch (e) {
          results.errors.push(`close: ${e.message}`);
        }

        // Clean up
        channel.close();

      } catch (e) {
        results.errors.push(`unexpected: ${e.message}`);
      }

      return results;
    });

    console.log('[TEST] BroadcastChannel race result:', JSON.stringify(result, null, 2));
    console.log('[TEST] Errors captured:', JSON.stringify(errors, null, 2));

    // Check for closure-related errors
    const hasClosureError = errors.some(e =>
      e.message.includes('closure invoked') ||
      e.message.includes('during destruction') ||
      e.message.includes('recursive use') ||
      e.message.includes('unreachable')
    );

    // BUG ASSERTION: When fixed, no closure errors should occur
    expect(errors.length).toBe(0);
    expect(result.errors.length).toBe(0);
  });

  test('BUG: Multiple tabs cause closure conflicts on close', async ({ page, context }) => {
    /**
     * This test simulates the multi-tab scenario where:
     * 1. Tab A has a database with callbacks registered
     * 2. Tab B sends a message via BroadcastChannel
     * 3. Tab A receives the message and tries to invoke callback
     * 4. But Tab A is in the middle of closing
     *
     * This creates the "recursive use of an object" error.
     */
    const errors = [];

    page.on('pageerror', err => {
      errors.push({ type: 'pageerror', message: err.message });
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({ type: 'console', message: msg.text() });
      }
    });

    // Open a second tab to send messages
    const page2 = await context.newPage();
    await page2.goto('http://localhost:3000');
    await page2.waitForFunction(() => window.__db__ !== undefined, { timeout: 30000 });

    // Execute operations from both tabs
    const result = await Promise.all([
      // Tab 1: Start operations then close
      page.evaluate(async () => {
        const db = window.__db__;
        const results = { tab: 1, errors: [] };

        try {
          // Do some operations
          for (let i = 0; i < 5; i++) {
            await db.execute(`SELECT ${i} as num`);
          }

          // Close the database
          await db.close();
          results.closed = true;
        } catch (e) {
          results.errors.push(e.message);
        }

        return results;
      }),

      // Tab 2: Send messages while Tab 1 is closing
      page2.evaluate(async () => {
        const results = { tab: 2, errors: [], messagesPosted: 0 };

        try {
          const channel = new BroadcastChannel('absurder_sql_vite_example_changes');

          // Rapidly send messages
          for (let i = 0; i < 20; i++) {
            channel.postMessage({ type: 'data_change', i });
            results.messagesPosted++;
            await new Promise(r => setTimeout(r, 5));
          }

          channel.close();
        } catch (e) {
          results.errors.push(e.message);
        }

        return results;
      }),
    ]);

    console.log('[TEST] Multi-tab result:', JSON.stringify(result, null, 2));
    console.log('[TEST] Errors captured:', JSON.stringify(errors, null, 2));

    await page2.close();

    // BUG ASSERTION: When fixed, no errors from the race
    expect(errors.length).toBe(0);
  });

  test('BUG: React-style fire-and-forget close during HMR', async ({ page }) => {
    /**
     * This test simulates the EXACT React pattern that causes the bug:
     *
     * The PWA does this in useEffect cleanup:
     *   dbRef.current.close().catch(err => console.error(err));
     *
     * This is fire-and-forget - cleanup returns before close() finishes.
     * When HMR triggers, the new component mounts immediately while close()
     * is still running, causing:
     * - "closure invoked during destruction"
     * - "RuntimeError: unreachable"
     * - "recursive use of an object detected"
     */
    const errors = [];

    page.on('pageerror', err => {
      errors.push({ type: 'pageerror', message: err.message });
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({ type: 'console', message: msg.text() });
      }
    });

    // Simulate React HMR cycles
    const result = await page.evaluate(async () => {
      const Database = window.__Database__;
      if (!Database) {
        return { error: '__Database__ not exposed' };
      }

      const results = {
        cycles: 0,
        errors: [],
        closureErrors: 0,
      };

      // Simulate 10 rapid HMR cycles
      for (let cycle = 0; cycle < 10; cycle++) {
        try {
          // === MOUNT PHASE ===
          const db = await Database.newDatabase(`hmr_react_${cycle}`);

          // Start an operation (query, backup, whatever)
          const queryPromise = db.execute('SELECT 1 as test');

          // === UNMOUNT PHASE (fire-and-forget close) ===
          // This is EXACTLY what the PWA does:
          db.close().catch(err => {
            results.errors.push(`close_${cycle}: ${err.message}`);
            if (err.message.includes('closure') || err.message.includes('recursive')) {
              results.closureErrors++;
            }
          });
          // Note: NO await - returns immediately

          // === IMMEDIATELY REMOUNT (like HMR) ===
          // Wait just a tiny bit (mimicking React's cleanup -> mount timing)
          await new Promise(r => setTimeout(r, 1));

          // Try to use the query result (it might fail because close() is racing)
          try {
            await queryPromise;
          } catch (e) {
            // Expected - the close() might have killed the query
          }

          results.cycles++;
        } catch (e) {
          results.errors.push(`cycle_${cycle}: ${e.message}`);
        }
      }

      return results;
    });

    console.log('[TEST] React HMR simulation result:', JSON.stringify(result, null, 2));
    console.log('[TEST] Errors captured:', JSON.stringify(errors, null, 2));

    // BUG ASSERTION: When fixed, no closure errors should occur
    const hasClosureError = errors.some(e =>
      e.message.includes('closure invoked') ||
      e.message.includes('during destruction') ||
      e.message.includes('recursive use') ||
      e.message.includes('unreachable')
    );

    expect(errors.length).toBe(0);
    expect(result.closureErrors || 0).toBe(0);
  });

  test('BUG: Stress test - 50 rapid close/open cycles', async ({ page }) => {
    /**
     * Stress test to increase the chance of hitting the race window.
     * The bug is timing-dependent, so more iterations = more chances.
     */
    const errors = [];

    page.on('pageerror', err => {
      errors.push({ type: 'pageerror', message: err.message });
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({ type: 'console', message: msg.text() });
      }
    });

    const result = await page.evaluate(async () => {
      const Database = window.__Database__;
      if (!Database) {
        return { error: '__Database__ not exposed' };
      }

      const results = {
        cycles: 0,
        errors: [],
      };

      // Run 50 cycles as fast as possible
      for (let i = 0; i < 50; i++) {
        try {
          const db = await Database.newDatabase(`stress_${i}`);

          // Fire off multiple operations without awaiting
          const promises = [
            db.execute('SELECT 1'),
            db.execute('SELECT 2'),
            db.execute('SELECT 3'),
          ];

          // Close immediately (fire and forget)
          db.close().catch(() => {});

          // Wait for all to settle
          await Promise.allSettled(promises);

          results.cycles++;
        } catch (e) {
          results.errors.push(`cycle_${i}: ${e.message}`);
        }
      }

      return results;
    });

    console.log('[TEST] Stress test result:', JSON.stringify(result, null, 2));
    console.log('[TEST] Errors captured:', errors.length);

    // BUG ASSERTION: No uncaught errors
    expect(errors.length).toBe(0);
  });
});
