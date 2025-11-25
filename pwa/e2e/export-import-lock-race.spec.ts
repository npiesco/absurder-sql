/**
 * Test to isolate and reproduce the export/import lock race condition
 * that causes Promises to never resolve, blocking the WASM event loop.
 */

import { test, expect } from '@playwright/test';

test.describe('Export/Import Lock Race Condition', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/db');
    await page.waitForSelector('#dbManagement', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
  });

  test('should handle rapid sequential lock acquisitions without hanging', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const Database = (window as any).Database;
      const results: string[] = [];

      // Create a database
      const dbName = `lock_race_test_${Date.now()}.db`;
      const db = await Database.newDatabase(dbName);
      if (db.allowNonLeaderWrites) await db.allowNonLeaderWrites(true);

      // Create test data
      await db.execute('CREATE TABLE test (id INTEGER, val TEXT)');
      await db.execute("INSERT INTO test VALUES (1, 'data')");

      // Trigger multiple rapid export operations that compete for the lock
      // This reproduces the race condition where:
      // 1. Thread A checks lock (held)
      // 2. Thread B releases lock
      // 3. Thread A creates Promise and try_acquire_or_wait returns true
      // 4. BUT Promise is never resolved (the bug)

      const exportPromises = [];
      for (let i = 0; i < 5; i++) {
        const p = db.exportToFile().then(() => {
          results.push(`export-${i}-success`);
        });
        exportPromises.push(p);
      }

      // Wait for all exports with timeout
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Exports timed out - lock race condition detected')), 5000)
      );

      await Promise.race([
        Promise.all(exportPromises),
        timeout
      ]);

      await db.close();

      return {
        success: true,
        exportCount: results.length,
        results
      };
    });

    expect(result.success).toBe(true);
    expect(result.exportCount).toBe(5);
  });

  test('should handle concurrent import/export without deadlock', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const Database = (window as any).Database;
      const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      // Create source database
      const sourceDb = await Database.newDatabase(`source_${uniqueId}.db`);
      if (sourceDb.allowNonLeaderWrites) await sourceDb.allowNonLeaderWrites(true);
      await sourceDb.execute('CREATE TABLE test (id INTEGER)');
      await sourceDb.execute('INSERT INTO test VALUES (1)');
      const bytes = await sourceDb.exportToFile();
      await sourceDb.close();

      // Now rapidly create multiple databases and import concurrently
      const promises = [];
      for (let i = 0; i < 3; i++) {
        const p = (async () => {
          const db = await Database.newDatabase(`target_${i}_${uniqueId}.db`);
          if (db.allowNonLeaderWrites) await db.allowNonLeaderWrites(true);
          await db.importFromFile(bytes);
          await db.close();

          // Reopen and verify
          const reopened = await Database.newDatabase(`target_${i}_${uniqueId}.db`);
          if (reopened.allowNonLeaderWrites) await reopened.allowNonLeaderWrites(true);
          const result = await reopened.execute('SELECT * FROM test');
          await reopened.close();

          return result.rows.length === 1;
        })();
        promises.push(p);
      }

      // Timeout to catch the race condition
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Import operations timed out - lock race condition detected')), 10000)
      );

      const results = await Promise.race([
        Promise.all(promises),
        timeout
      ]);

      return {
        success: results.every(r => r === true),
        completedCount: results.length
      };
    });

    expect(result.success).toBe(true);
    expect(result.completedCount).toBe(3);
  });

  test('should not hang when lock becomes available during Promise creation', async ({ page }) => {
    // This test specifically targets the race window between:
    // 1. First lock check (locked=true, returns Err)
    // 2. Lock release by another operation
    // 3. Promise creation where try_acquire_or_wait is called

    const result = await page.evaluate(async () => {
      const Database = (window as any).Database;
      const dbName = `race_window_test_${Date.now()}.db`;

      const db = await Database.newDatabase(dbName);
      if (db.allowNonLeaderWrites) await db.allowNonLeaderWrites(true);
      await db.execute('CREATE TABLE test (id INTEGER)');

      // Start a long-running export to hold the lock
      const longExport = db.exportToFile();

      // Immediately queue another export while first is in progress
      // This should wait for lock, then acquire when first completes
      const secondExport = db.exportToFile();

      // Timeout to detect if Promise never resolves
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Second export hung - race condition bug!')), 8000)
      );

      await Promise.race([
        Promise.all([longExport, secondExport]),
        timeout
      ]);

      await db.close();

      return { success: true };
    });

    expect(result.success).toBe(true);
  });
});
