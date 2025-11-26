import { test, expect } from '@playwright/test';

test('Web Locks API availability', async ({ page }) => {
  await page.goto('/db');

  const locksTest = await page.evaluate(async () => {
    if (!navigator.locks) {
      return { supported: false, error: 'navigator.locks not available' };
    }

    try {
      let lockAcquired = false;
      await navigator.locks.request('test-lock', async (lock) => {
        lockAcquired = true;
        console.log('[TEST] Web Locks API works in JS! Lock:', lock);
      });
      return { supported: true, lockAcquired };
    } catch (err: any) {
      return { supported: true, error: err.message };
    }
  });

  console.log('[LOCKS TEST]', locksTest);
  expect(locksTest.supported).toBe(true);
  expect(locksTest.lockAcquired).toBe(true);
});

test('concurrent exports with locking', async ({ page }) => {
  page.on('console', msg => {
    const text = msg.text();
    console.log('[BROWSER]', text);
  });

  await page.goto('/db');
  await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });

  const result = await page.evaluate(async () => {
    const Database = (window as any).Database;
    const results: string[] = [];

    console.log('[TEST] Creating database...');
    const dbName = 'lock_test_' + Date.now() + '.db';
    const db = await Database.newDatabase(dbName);
    if (db.allowNonLeaderWrites) await db.allowNonLeaderWrites(true);

    console.log('[TEST] Creating table...');
    await db.execute('CREATE TABLE test (id INTEGER, val TEXT)');
    await db.execute("INSERT INTO test VALUES (1, 'data')");

    console.log('[TEST] Starting 5 rapid exports...');
    const exportPromises: Promise<void>[] = [];
    for (let i = 0; i < 5; i++) {
      console.log(`[TEST] Starting export ${i}...`);
      const p = db.exportToFile().then(() => {
        console.log(`[TEST] Export ${i} completed!`);
        results.push(`export-${i}-success`);
      });
      exportPromises.push(p);
    }

    console.log('[TEST] Waiting for all exports...');
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => {
        console.log('[TEST] TIMEOUT! Results so far:', results);
        reject(new Error('Exports timed out'));
      }, 5000)
    );

    try {
      await Promise.race([
        Promise.all(exportPromises),
        timeout
      ]);
      console.log('[TEST] All exports completed!');
    } catch (e: any) {
      console.log('[TEST] ERROR:', e.message);
      return { success: false, error: e.message, exportCount: results.length };
    }

    await db.close();

    return { success: true, exportCount: results.length, results };
  });

  console.log('[RESULT]', result);
  expect(result.success).toBe(true);
  expect(result.exportCount).toBe(5);
});
