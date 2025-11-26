import { test, expect } from '@playwright/test';

test('concurrent lock tests via testLock', async ({ page }) => {
  page.on('console', msg => {
    const text = msg.text();
    console.log('[BROWSER]', text);
  });

  await page.goto('/db');
  await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });

  const result = await page.evaluate(async () => {
    const Database = (window as any).Database;
    const results: Array<{ index: number; result: number }> = [];

    console.log('[TEST] Creating database...');
    const dbName = 'lock_test_' + Date.now() + '.db';
    const db = await Database.newDatabase(dbName);

    console.log('[TEST] Starting 5 concurrent lock tests...');
    const lockPromises: Promise<void>[] = [];
    for (let i = 0; i < 5; i++) {
      console.log(`[TEST] Starting lock test ${i}...`);
      const p = db.testLock(i).then((result: number) => {
        console.log(`[TEST] Lock test ${i} completed with result: ${result}`);
        results.push({ index: i, result });
      });
      lockPromises.push(p);
    }

    console.log('[TEST] Waiting for all lock tests...');
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => {
        console.log('[TEST] TIMEOUT! Results so far:', results);
        reject(new Error('Lock tests timed out'));
      }, 5000)
    );

    try {
      await Promise.race([
        Promise.all(lockPromises),
        timeout
      ]);
      console.log('[TEST] All lock tests completed!');
    } catch (e: any) {
      console.log('[TEST] ERROR:', e.message);
      return { success: false, error: e.message, resultCount: results.length, results };
    }

    await db.close();

    return { success: true, resultCount: results.length, results };
  });

  console.log('[RESULT]', result);
  expect(result.success).toBe(true);
  expect(result.resultCount).toBe(5);
});
