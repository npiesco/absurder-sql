import { expect, test, type BrowserContext, type Page } from '@playwright/test';

async function openHarness(page: Page): Promise<void> {
  await page.goto('/worker-test');
  await expect(page.getByTestId('worker-status')).toHaveText('ready', { timeout: 30_000 });
}

async function deleteDatabase(context: BrowserContext, name: string): Promise<void> {
  context.setDefaultTimeout(30_000);
  const cleanup = await context.newPage();
  await openHarness(cleanup);
  await cleanup.evaluate(async (databaseName) => {
    await window.Database!.deleteDatabase(databaseName);
  }, name);
  await cleanup.close();
}

test('selects Hybrid in the worker and survives close/reopen', async ({ page }) => {
  const dbName = `pwa-hybrid-${Date.now()}.db`;
  await openHarness(page);

  try {
    const result = await page.evaluate(async (name) => {
      const db = await window.Database!.newDatabaseAuto(name);
      const backend = db.getStorageBackend();
      await db.execute('CREATE TABLE durable_rows (id INTEGER PRIMARY KEY, value TEXT)');
      await db.execute("INSERT INTO durable_rows (value) VALUES ('persisted')");
      await db.sync();
      await db.close();

      const reopened = await window.Database!.newDatabaseAuto(name);
      const rows = await reopened.execute('SELECT value FROM durable_rows ORDER BY id');
      const reopenedBackend = reopened.getStorageBackend();
      await reopened.close();
      const cell = rows.rows[0]?.values[0];
      return { backend, reopenedBackend, value: cell && 'value' in cell ? cell.value : null };
    }, dbName);

    expect(result).toEqual({
      backend: 'Hybrid',
      reopenedBackend: 'Hybrid',
      value: 'persisted',
    });
  } finally {
    await deleteDatabase(page.context(), dbName);
  }
});

test('shares one live owner across tabs and remains writable after a tab closes', async ({ context }) => {
  const dbName = `pwa-multitab-${Date.now()}.db`;
  const first = await context.newPage();
  const second = await context.newPage();
  await openHarness(first);
  await openHarness(second);

  try {
    await first.evaluate(async (name) => {
      const db = await window.Database!.newDatabaseAuto(name);
      await db.execute('CREATE TABLE shared_rows (id INTEGER PRIMARY KEY, value TEXT)');
      await db.execute("INSERT INTO shared_rows (value) VALUES ('first-tab')");
      await db.sync();
      window.testDb = db;
    }, dbName);

    const seenBySecond = await second.evaluate(async (name) => {
      const db = await window.Database!.newDatabaseAuto(name);
      window.testDb = db;
      const result = await db.execute('SELECT value FROM shared_rows ORDER BY id');
      const cell = result.rows[0]?.values[0];
      return cell && 'value' in cell ? cell.value : null;
    }, dbName);
    expect(seenBySecond).toBe('first-tab');

    const runtimeHandoff = second.evaluate(
      () => new Promise<void>((resolve) => {
        window.addEventListener('absurder-sql-runtime-ready', () => resolve(), { once: true });
      }),
    );
    await first.close();
    await runtimeHandoff;
    const count = await second.evaluate(async () => {
      const db = window.testDb;
      await db.execute("INSERT INTO shared_rows (value) VALUES ('second-tab')");
      await db.sync();
      const result = await db.execute('SELECT COUNT(*) FROM shared_rows');
      const cell = result.rows[0]?.values[0];
      return cell && 'value' in cell ? cell.value : null;
    });
    expect(count).toBe(2);
  } finally {
    if (!first.isClosed()) await first.close();
    await second.close();
    await deleteDatabase(context, dbName);
  }
});

test('reloads and reopens persisted data while offline', async ({ context, page }) => {
  const dbName = `pwa-offline-${Date.now()}.db`;
  await openHarness(page);

  try {
    await page.evaluate(async (name) => {
      const db = await window.Database!.newDatabaseAuto(name);
      await db.execute('CREATE TABLE offline_rows (value TEXT)');
      await db.execute("INSERT INTO offline_rows VALUES ('available-offline')");
      await db.sync();
      await db.close();
      await navigator.serviceWorker.ready;
    }, dbName);

    // Reload once under service-worker control so the navigation response is in
    // the runtime cache as well as the generated build assets.
    await page.reload();
    await expect(page.getByTestId('worker-status')).toHaveText('ready');
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByTestId('worker-status')).toHaveText('ready');

    const result = await page.evaluate(async (name) => {
      const db = await window.Database!.newDatabaseAuto(name);
      const rows = await db.execute('SELECT value FROM offline_rows');
      const backend = db.getStorageBackend();
      await db.close();
      const cell = rows.rows[0]?.values[0];
      return { backend, value: cell && 'value' in cell ? cell.value : null };
    }, dbName);

    expect(result).toEqual({ backend: 'Hybrid', value: 'available-offline' });
  } finally {
    await context.setOffline(false);
    await deleteDatabase(context, dbName);
  }
});
