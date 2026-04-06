import { test, expect } from '@playwright/test';

const STATIC_URL = 'http://localhost:8080/examples/worker-example.html';
const PKG_URL = 'http://localhost:8080/pkg/absurder_sql.js';

async function runWorkerScenario(page, dbName, mode) {
  return await page.evaluate(async ({ pkgUrl, dbName, mode }) => {
    const workerSource = `
      import init, { Database } from '${pkgUrl}';

      const blockSize = 4096;

      async function findMatchingOpfsFile(nameFragment) {
        const root = await navigator.storage.getDirectory();
        for await (const [entryName, handle] of root.entries()) {
          if (entryName.includes(nameFragment) && handle.kind === 'file') {
            const file = await handle.getFile();
            return { entryName, size: file.size };
          }
        }
        return null;
      }

      function serializeRows(query) {
        return query.rows.map((row) => ({
          id: row.values[0].value,
          value: row.values[1].value,
        }));
      }

      self.onmessage = async (event) => {
        const logs = [];
        const { dbName, mode } = event.data;

        try {
          await init();
          logs.push('initialized wasm');

          if (mode === 'roundtrip') {
            const db = await Database.newDatabaseAuto(dbName);
            db.allowNonLeaderWrites(true);
            const selectedBackend = db.getStorageBackend();
            logs.push('selected backend: ' + selectedBackend);

            await db.execute('CREATE TABLE IF NOT EXISTS worker_data (id INTEGER PRIMARY KEY, value TEXT)');
            await db.execute('DELETE FROM worker_data');
            await db.execute("INSERT INTO worker_data (id, value) VALUES (1, 'opfs-alpha'), (2, 'opfs-beta')");
            await db.sync();
            await db.close();

            const opfsFile = await findMatchingOpfsFile(dbName);
            logs.push('opfs file: ' + JSON.stringify(opfsFile));

            const reopened = await Database.newDatabaseAuto(dbName);
            reopened.allowNonLeaderWrites(true);
            const reopenedBackend = reopened.getStorageBackend();
            logs.push('reopened backend: ' + reopenedBackend);

            const query = await reopened.execute('SELECT id, value FROM worker_data ORDER BY id');
            logs.push('row count: ' + query.rows.length);
            const rows = serializeRows(query);

            await reopened.close();
            try {
              await Database.deleteDatabase(dbName);
            } catch (cleanupError) {
              logs.push('cleanup warning: ' + String(cleanupError));
            }

            self.postMessage({
              success: true,
              logs,
              selectedBackend,
              reopenedBackend,
              opfsFile,
              rows,
              expectedMinimumBytes: blockSize,
            });
            return;
          }

          if (mode === 'seed') {
            const db = await Database.newDatabaseAuto(dbName);
            db.allowNonLeaderWrites(true);
            const selectedBackend = db.getStorageBackend();
            logs.push('selected backend: ' + selectedBackend);

            await db.execute('CREATE TABLE IF NOT EXISTS worker_data (id INTEGER PRIMARY KEY, value TEXT)');
            await db.execute('DELETE FROM worker_data');
            await db.execute("INSERT INTO worker_data (id, value) VALUES (1, 'opfs-alpha'), (2, 'opfs-beta')");
            await db.sync();
            await db.close();

            const opfsFile = await findMatchingOpfsFile(dbName);
            logs.push('opfs file: ' + JSON.stringify(opfsFile));

            self.postMessage({
              success: true,
              logs,
              selectedBackend,
              opfsFile,
              expectedMinimumBytes: blockSize,
            });
            return;
          }

          if (mode === 'reopen') {
            const reopened = await Database.newDatabaseAuto(dbName);
            reopened.allowNonLeaderWrites(true);
            const reopenedBackend = reopened.getStorageBackend();
            logs.push('reopened backend: ' + reopenedBackend);

            const opfsFile = await findMatchingOpfsFile(dbName);
            logs.push('opfs file: ' + JSON.stringify(opfsFile));

            const query = await reopened.execute('SELECT id, value FROM worker_data ORDER BY id');
            logs.push('row count: ' + query.rows.length);
            const rows = serializeRows(query);

            await reopened.close();
            try {
              await Database.deleteDatabase(dbName);
            } catch (cleanupError) {
              logs.push('cleanup warning: ' + String(cleanupError));
            }

            self.postMessage({
              success: true,
              logs,
              reopenedBackend,
              opfsFile,
              rows,
            });
            return;
          }

          throw new Error('Unknown worker mode: ' + mode);
        } catch (error) {
          const errorMessage = error?.message ?? String(error);
          logs.push('ERROR: ' + errorMessage);
          try {
            await Database.deleteDatabase(dbName);
          } catch (_) {
            // Best-effort cleanup only.
          }

          self.postMessage({
            success: false,
            logs,
            error: errorMessage,
            stack: error.stack ?? null,
          });
        }
      };
    `;

    const workerUrl = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
    const worker = new Worker(workerUrl, { type: 'module' });

    return await new Promise((resolve) => {
      worker.onmessage = (event) => {
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        resolve(event.data);
      };

      worker.postMessage({ dbName, mode });
    });
  }, { pkgUrl: PKG_URL, dbName, mode });
}

async function deleteIndexedDbMirror(page, dbName) {
  return await page.evaluate(async ({ dbName }) => {
    const normalizedName = dbName.endsWith('.db') ? dbName : `${dbName}.db`;

    function waitForRequest(request) {
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
      });
    }

    async function deleteKeysByPrefix(store, prefix) {
      return await new Promise((resolve, reject) => {
        const range = IDBKeyRange.bound(`${prefix}:`, `${prefix}:\uffff`);
        const request = store.openCursor(range);
        let deleted = 0;

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (!cursor) {
            resolve(deleted);
            return;
          }

          cursor.delete();
          deleted += 1;
          cursor.continue();
        };

        request.onerror = () => reject(request.error ?? new Error('Failed to iterate IndexedDB keys'));
      });
    }

    const openRequest = indexedDB.open('block_storage', 2);
    openRequest.onupgradeneeded = () => {
      const db = openRequest.result;
      if (!db.objectStoreNames.contains('blocks')) {
        db.createObjectStore('blocks');
      }
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata');
      }
    };

    const db = await waitForRequest(openRequest);
    const transaction = db.transaction(['blocks', 'metadata'], 'readwrite');
    const blocksStore = transaction.objectStore('blocks');
    const metadataStore = transaction.objectStore('metadata');

    const blocksDeleted = await deleteKeysByPrefix(blocksStore, normalizedName);
    const metadataDeleted = await deleteKeysByPrefix(metadataStore, normalizedName);

    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB delete transaction failed'));
      transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB delete transaction aborted'));
    });

    db.close();

    return {
      normalizedName,
      blocksDeleted,
      metadataDeleted,
      deletedAny: blocksDeleted > 0 || metadataDeleted > 0,
    };
  }, { dbName });
}

test.describe('Worker Hybrid OPFS Backend', () => {
  test('worker auto backend selects Hybrid and writes OPFS data on sync', async ({ page }) => {
    await page.goto(STATIC_URL);

    const dbName = `worker_hybrid_${Date.now()}`;
    const result = await runWorkerScenario(page, dbName, 'roundtrip');

    console.log((result.logs || []).join('\n'));

    expect(result.success, result.error ?? 'worker hybrid OPFS flow failed').toBe(true);
    expect(result.selectedBackend).toBe('Hybrid');
    expect(result.reopenedBackend).toBe('Hybrid');
    expect(result.opfsFile).not.toBeNull();
    expect(result.opfsFile.size).toBeGreaterThanOrEqual(result.expectedMinimumBytes);
    expect(result.rows).toEqual([
      { id: 1, value: 'opfs-alpha' },
      { id: 2, value: 'opfs-beta' },
    ]);
  });

  test('worker reopen restores from OPFS after IndexedDB mirror deletion', async ({ page }) => {
    await page.goto(STATIC_URL);

    const dbName = `worker_hybrid_restore_${Date.now()}`;

    const seeded = await runWorkerScenario(page, dbName, 'seed');
    console.log((seeded.logs || []).join('\n'));

    expect(seeded.success, seeded.error ?? 'worker hybrid seed failed').toBe(true);
    expect(seeded.selectedBackend).toBe('Hybrid');
    expect(seeded.opfsFile).not.toBeNull();
    expect(seeded.opfsFile.size).toBeGreaterThanOrEqual(seeded.expectedMinimumBytes);

    const deletedMirror = await deleteIndexedDbMirror(page, dbName);
    expect(deletedMirror.deletedAny).toBe(true);

    const reopened = await runWorkerScenario(page, dbName, 'reopen');
    console.log((reopened.logs || []).join('\n'));

    expect(reopened.success, reopened.error ?? 'worker OPFS restore reopen failed').toBe(true);
    expect(reopened.reopenedBackend).toBe('Hybrid');
    expect(reopened.opfsFile).not.toBeNull();
    expect(reopened.rows).toEqual([
      { id: 1, value: 'opfs-alpha' },
      { id: 2, value: 'opfs-beta' },
    ]);
  });
});