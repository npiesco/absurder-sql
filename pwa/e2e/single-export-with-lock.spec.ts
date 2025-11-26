import { test, expect } from '@playwright/test';

test('single export with locking', async ({ page }) => {
  page.on('console', msg => {
    const text = msg.text();
    console.log('[BROWSER]', text);
  });

  await page.goto('/db');
  await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });

  const result = await page.evaluate(async () => {
    const Database = (window as any).Database;

    console.log('[TEST] Creating database...');
    const dbName = 'single_export_test_' + Date.now() + '.db';
    const db = await Database.newDatabase(dbName);
    if (db.allowNonLeaderWrites) await db.allowNonLeaderWrites(true);

    console.log('[TEST] Creating table...');
    await db.execute('CREATE TABLE test (id INTEGER, val TEXT)');
    await db.execute("INSERT INTO test VALUES (1, 'data')");

    console.log('[TEST] Starting SINGLE export with locking...');

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => {
        console.log('[TEST] TIMEOUT!');
        reject(new Error('Single export timed out'));
      }, 5000)
    );

    try {
      const exportData = await Promise.race([
        db.exportToFile(),
        timeout
      ]) as Uint8Array;
      console.log('[TEST] Single export completed! Size:', exportData.length);
      await db.close();
      return { success: true, size: exportData.length };
    } catch (e: any) {
      console.log('[TEST] ERROR:', e.message);
      return { success: false, error: e.message };
    }
  });

  console.log('[RESULT]', result);
  expect(result.success).toBe(true);
  expect(result.size).toBeGreaterThan(0);
});
