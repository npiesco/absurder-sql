import { test, expect } from '@playwright/test';

const STATIC_URL = 'http://localhost:8080/examples/worker-example.html';
const PKG_URL = 'http://localhost:8080/pkg/absurder_sql.js';

test.describe('Worker Hybrid OPFS Backend', () => {
  test('worker auto backend selects Hybrid and writes OPFS data on sync', async ({ page }) => {
    await page.goto(STATIC_URL);

    const result = await page.evaluate(async ({ pkgUrl }) => {
      const dbName = `worker_hybrid_${Date.now()}`;
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

        self.onmessage = async (event) => {
          const logs = [];
          const { dbName } = event.data;

          try {
            await init();
            logs.push('initialized wasm');

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
            const rows = query.rows.map((row) => ({
              id: row.values[0].value,
              value: row.values[1].value,
            }));

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

        worker.postMessage({ dbName });
      });
    }, { pkgUrl: PKG_URL });

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
});