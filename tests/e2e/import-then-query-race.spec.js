/**
 * Test for closure errors after export/import + rapid queries
 *
 * REPRODUCTION STEPS (from user):
 * 1. Export the database
 * 2. Import the exported database
 * 3. Click back and forth between notes rapidly
 *
 * This reliably triggers:
 * - "closure invoked during destruction"
 * - "RuntimeError: unreachable"
 * - "recursive use of an object detected"
 */
import { test, expect } from '@playwright/test';

// Increase timeout for these tests since they do heavy I/O
test.setTimeout(120000);

test.describe('Import Then Query Race Condition', () => {
  test('BUG: Rapid queries after import cause closure errors', async ({ page }) => {
    const errors = [];

    page.on('pageerror', err => {
      console.log('[PAGE ERROR]', err.message);
      errors.push({ type: 'pageerror', message: err.message });
    });

    // Forward ALL console messages for debugging
    page.on('console', msg => {
      const text = msg.text();
      console.log(`[BROWSER ${msg.type()}]`, text);
      if (msg.type() === 'error') {
        // Capture closure-related errors
        if (text.includes('closure') ||
            text.includes('recursive') ||
            text.includes('unreachable') ||
            text.includes('destruction')) {
          errors.push({ type: 'console', message: text });
        }
      }
    });

    await page.goto('http://localhost:3000');
    // Wait for both __db__ and __Database__ to be available
    await page.waitForFunction(() => {
      return window.__db__ !== undefined && window.__Database__ !== undefined;
    }, { timeout: 30000 });
    console.log('[TEST] Page ready, __db__ and __Database__ available');

    // Step 1: Create a database with data, export it, import it, then query rapidly
    const result = await page.evaluate(async () => {
      const Database = window.__Database__;
      if (!Database) {
        return { error: '__Database__ not exposed on window' };
      }

      const results = {
        phase: '',
        errors: [],
        queryCount: 0,
      };

      try {
        // === PHASE 1: Create database with notes ===
        results.phase = 'create';
        console.log('[TEST] Phase 1: Creating database...');
        const db1 = await Database.newDatabase('import_race_test');
        console.log('[TEST] Database created');

        // Create a notes table like the PWA has
        await db1.execute(`
          CREATE TABLE IF NOT EXISTS notes (
            note_id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            body TEXT,
            created_at TEXT,
            updated_at TEXT
          )
        `);
        console.log('[TEST] Table created');

        // Insert some notes to simulate real data
        for (let i = 1; i <= 10; i++) {
          await db1.execute(`
            INSERT INTO notes (note_id, title, body, created_at, updated_at)
            VALUES ('note_${i}', 'Note ${i}', 'Body content for note ${i}', datetime('now'), datetime('now'))
          `);
        }
        console.log('[TEST] Notes inserted');

        // === PHASE 2: Export the database ===
        results.phase = 'export';
        console.log('[TEST] Phase 2: Exporting...');
        const exportData = await db1.exportToFile();
        console.log('[TEST] Exported', exportData.byteLength, 'bytes');

        // Close the first database
        console.log('[TEST] Closing db1...');
        await db1.close();
        console.log('[TEST] db1 closed');

        // === PHASE 3: Import into a new database ===
        results.phase = 'import';
        console.log('[TEST] Phase 3: Importing...');
        const db2 = await Database.newDatabase('import_race_test_restored');
        console.log('[TEST] db2 created, calling importFromFile...');
        await db2.importFromFile(exportData);
        console.log('[TEST] Import complete');

        // === PHASE 4: Rapid queries (simulating clicking between notes) ===
        results.phase = 'rapid_queries';
        console.log('[TEST] Phase 4: Rapid queries...');

        // Simulate clicking back and forth between notes rapidly
        // This is the exact pattern that triggers the bug
        for (let cycle = 0; cycle < 20; cycle++) {
          const noteId = `note_${(cycle % 10) + 1}`;

          // Query like selecting a note
          try {
            await db2.execute(`SELECT * FROM notes WHERE note_id = '${noteId}'`);
            results.queryCount++;
          } catch (e) {
            results.errors.push(`query_${cycle}: ${e.message}`);
          }

          if (cycle % 10 === 0) {
            console.log('[TEST] Query cycle', cycle);
          }
        }
        console.log('[TEST] Queries complete, total:', results.queryCount);

        // === PHASE 5: Close ===
        results.phase = 'close';
        console.log('[TEST] Phase 5: Closing db2...');
        await db2.close();
        console.log('[TEST] db2 closed');

        results.phase = 'done';

      } catch (e) {
        console.log('[TEST] ERROR in phase', results.phase, ':', e.message);
        results.errors.push(`${results.phase}: ${e.message}`);
      }

      return results;
    });

    console.log('[TEST] Result:', JSON.stringify(result, null, 2));
    console.log('[TEST] Page errors:', JSON.stringify(errors, null, 2));

    // Check for the specific closure errors
    const hasUnreachableError = errors.some(e =>
      e.message.includes('unreachable')
    );
    const hasClosureError = errors.some(e =>
      e.message.includes('closure invoked') ||
      e.message.includes('during destruction') ||
      e.message.includes('recursive use')
    );

    // BUG ASSERTION: These assertions will FAIL until the bug is fixed
    // The bug manifests as "unreachable" or "closure" errors after import + query
    if (hasUnreachableError || hasClosureError) {
      console.log('[TEST] BUG REPRODUCED: Found closure/unreachable error after import!');
    }

    // When the bug is fixed, these should pass:
    expect(errors.length).toBe(0);
    expect(result.errors?.length || 0).toBe(0);
    expect(result.queryCount).toBeGreaterThan(0);
  });

  test('BUG: Import then immediate close triggers closure error', async ({ page }) => {
    const errors = [];

    page.on('pageerror', err => {
      errors.push({ type: 'pageerror', message: err.message });
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({ type: 'console', message: msg.text() });
      }
    });

    await page.goto('http://localhost:3000');
    await page.waitForFunction(() => window.__db__ !== undefined, { timeout: 30000 });

    const result = await page.evaluate(async () => {
      const Database = window.__Database__;
      if (!Database) {
        return { error: '__Database__ not exposed on window' };
      }

      const results = { cycles: 0, errors: [] };

      // Repeat the import/close cycle multiple times
      for (let cycle = 0; cycle < 10; cycle++) {
        try {
          // Create and populate
          const db1 = await Database.newDatabase(`import_close_${cycle}`);
          await db1.execute('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, val TEXT)');
          for (let i = 0; i < 5; i++) {
            await db1.execute(`INSERT INTO test (val) VALUES ('value_${i}')`);
          }

          // Export
          const data = await db1.exportToFile();
          await db1.close();

          // Import and immediately close (this is the pattern from PWA backup restore)
          const db2 = await Database.newDatabase(`import_close_${cycle}_restored`);
          await db2.importFromFile(data);

          // Fire off a query but DON'T await
          const queryPromise = db2.execute('SELECT * FROM test');

          // Close immediately (fire and forget like React cleanup)
          db2.close().catch(() => {});

          // Try to get the query result
          try {
            await queryPromise;
          } catch (e) {
            // This is expected - query might fail due to close
          }

          results.cycles++;
        } catch (e) {
          results.errors.push(`cycle_${cycle}: ${e.message}`);
        }
      }

      return results;
    });

    console.log('[TEST] Import/close cycle result:', JSON.stringify(result, null, 2));
    console.log('[TEST] Errors:', errors.length);

    expect(errors.length).toBe(0);
    expect(result.errors.length).toBe(0);
  });

  test('BUG: Multiple rapid imports cause closure conflicts', async ({ page }) => {
    const errors = [];

    page.on('pageerror', err => {
      errors.push({ type: 'pageerror', message: err.message });
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({ type: 'console', message: msg.text() });
      }
    });

    await page.goto('http://localhost:3000');
    await page.waitForFunction(() => window.__db__ !== undefined, { timeout: 30000 });

    const result = await page.evaluate(async () => {
      const Database = window.__Database__;
      if (!Database) {
        return { error: '__Database__ not exposed on window' };
      }

      const results = { imports: 0, queries: 0, errors: [] };

      try {
        // Create source database
        const source = await Database.newDatabase('multi_import_source');
        await source.execute('CREATE TABLE data (id INTEGER PRIMARY KEY, value TEXT)');
        for (let i = 0; i < 100; i++) {
          await source.execute(`INSERT INTO data (value) VALUES ('item_${i}')`);
        }
        const exportData = await source.exportToFile();
        await source.close();

        // Import the same data into multiple databases rapidly
        const importPromises = [];
        for (let i = 0; i < 5; i++) {
          importPromises.push((async () => {
            const db = await Database.newDatabase(`multi_import_target_${i}`);
            await db.importFromFile(exportData);
            results.imports++;

            // Query immediately after import
            for (let q = 0; q < 10; q++) {
              await db.execute(`SELECT * FROM data WHERE id = ${q + 1}`);
              results.queries++;
            }

            // Close without await
            db.close().catch(() => {});
          })());
        }

        await Promise.allSettled(importPromises);

      } catch (e) {
        results.errors.push(e.message);
      }

      return results;
    });

    console.log('[TEST] Multi-import result:', JSON.stringify(result, null, 2));
    console.log('[TEST] Errors:', errors.length);

    expect(errors.length).toBe(0);
    expect(result.errors.length).toBe(0);
    expect(result.imports).toBe(5);
  });
});
