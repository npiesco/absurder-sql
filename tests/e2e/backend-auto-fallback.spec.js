import { test, expect } from '@playwright/test';

const VITE_URL = 'http://localhost:3000';

test.describe('Backend Auto Detection', () => {
  test('main thread auto backend falls back to IndexedDB and persists across reopen', async ({ page }) => {
    await page.goto(VITE_URL);
    await page.waitForFunction(
      () => window.Database && typeof window.Database.newDatabase === 'function',
      { timeout: 15000 }
    );

    const result = await page.evaluate(async () => {
      const logs = [];
      const dbName = `backend_auto_${Date.now()}`;

      try {
        const { Database, document, navigator } = window;

        logs.push(`main thread: ${typeof document !== 'undefined'}`);
        logs.push(`navigator.storage.getDirectory: ${typeof navigator?.storage?.getDirectory}`);

        const db = await Database.newDatabaseAuto(dbName);
        const selectedBackend = db.getStorageBackend();
        logs.push(`selected backend: ${selectedBackend}`);

        await db.execute('CREATE TABLE IF NOT EXISTS test_data (id INTEGER PRIMARY KEY, value TEXT)');
        await db.execute('DELETE FROM test_data');
        await db.execute("INSERT INTO test_data (id, value) VALUES (1, 'alpha'), (2, 'beta')");
        await db.sync();
        await db.close();

        const reopened = await Database.newDatabaseAuto(dbName);
        const reopenedBackend = reopened.getStorageBackend();
        logs.push(`reopened backend: ${reopenedBackend}`);

        const query = await reopened.execute('SELECT id, value FROM test_data ORDER BY id');
        const rows = query.rows.map((row) => ({
          id: row.values[0].value,
          value: row.values[1].value,
        }));

        await reopened.close();
        await Database.deleteDatabase(dbName);

        return {
          success: true,
          logs,
          selectedBackend,
          reopenedBackend,
          rows,
        };
      } catch (error) {
        logs.push(`ERROR: ${error.message}`);
        return {
          success: false,
          logs,
          error: error.message,
          stack: error.stack ?? null,
        };
      }
    });

    console.log(result.logs.join('\n'));

    expect(result.success, result.error ?? 'newDatabaseAuto flow failed').toBe(true);
    expect(result.selectedBackend).toBe('IndexedDB');
    expect(result.reopenedBackend).toBe('IndexedDB');
    expect(result.rows).toEqual([
      { id: 1, value: 'alpha' },
      { id: 2, value: 'beta' },
    ]);
  });
});