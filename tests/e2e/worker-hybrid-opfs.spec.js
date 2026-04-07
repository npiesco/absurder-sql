import { test, expect } from '@playwright/test';

const STATIC_URL = 'http://localhost:8080/examples/worker-example.html';
const PKG_URL = 'http://localhost:8080/pkg/absurder_sql.js';

function makeCrashFinalizeValue(prefix, id) {
  return `${prefix}-${String(id).padStart(3, '0')}-${'x'.repeat(160)}`;
}

async function runWorkerScenario(page, dbNameOrOptions, maybeMode) {
  const options = typeof dbNameOrOptions === 'string'
    ? { dbName: dbNameOrOptions, mode: maybeMode }
    : dbNameOrOptions;

  return await page.evaluate(async ({ pkgUrl, options }) => {
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

      function buildCrashFinalizeValues(prefix) {
        return Array.from({ length: 128 }, (_, index) => {
          const id = index + 1;
          const paddedId = String(id).padStart(3, '0');
          const value = prefix + '-' + paddedId + '-' + 'x'.repeat(160);
          return '(' + id + ", '" + value + "')";
        }).join(', ');
      }

      self.onmessage = async (event) => {
        const logs = [];
        const { dbName, mode, sourceDbName, backendName, cleanupOnClose } = event.data;

        try {
          await init();
          logs.push('initialized wasm');

          if (mode === 'explicit-backend-roundtrip') {
            const db = await Database.newDatabaseWithBackend(dbName, backendName);
            db.allowNonLeaderWrites(true);
            const selectedBackend = db.getStorageBackend();
            logs.push('selected backend: ' + selectedBackend);

            await db.execute('CREATE TABLE IF NOT EXISTS explicit_backend_data (id INTEGER PRIMARY KEY, value TEXT)');
            await db.execute('DELETE FROM explicit_backend_data');
            await db.execute("INSERT INTO explicit_backend_data (id, value) VALUES (1, 'explicit-alpha'), (2, 'explicit-beta')");
            await db.sync();
            await db.close();

            const opfsFile = await findMatchingOpfsFile(dbName);
            logs.push('opfs file: ' + JSON.stringify(opfsFile));

            const reopened = await Database.newDatabaseWithBackend(dbName, backendName);
            reopened.allowNonLeaderWrites(true);
            const reopenedBackend = reopened.getStorageBackend();
            logs.push('reopened backend: ' + reopenedBackend);

            const query = await reopened.execute('SELECT id, value FROM explicit_backend_data ORDER BY id');
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
            });
            return;
          }

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

          if (mode === 'crash-recovery-baseline') {
            const db = await Database.newDatabaseAuto(dbName);
            db.allowNonLeaderWrites(true);
            const selectedBackend = db.getStorageBackend();
            logs.push('selected backend: ' + selectedBackend);

            await db.execute('CREATE TABLE IF NOT EXISTS crash_recovery_data (id INTEGER PRIMARY KEY, value TEXT)');
            await db.execute('DELETE FROM crash_recovery_data');
            await db.execute("INSERT INTO crash_recovery_data (id, value) VALUES (1, 'baseline-alpha'), (2, 'baseline-beta')");
            await db.sync();
            await db.close();

            const opfsFile = await findMatchingOpfsFile(dbName);
            logs.push('opfs file after baseline sync: ' + JSON.stringify(opfsFile));

            self.postMessage({
              success: true,
              logs,
              selectedBackend,
              opfsFile,
            });
            return;
          }

          if (mode === 'crash-recovery-update') {
            const db = await Database.newDatabaseAuto(dbName);
            db.allowNonLeaderWrites(true);
            const selectedBackend = db.getStorageBackend();
            logs.push('selected backend: ' + selectedBackend);

            await db.execute('DELETE FROM crash_recovery_data');
            await db.execute("INSERT INTO crash_recovery_data (id, value) VALUES (1, 'latest-alpha'), (2, 'latest-beta')");
            await db.sync();
            await db.close();

            const opfsFile = await findMatchingOpfsFile(dbName);
            logs.push('opfs file after latest sync: ' + JSON.stringify(opfsFile));

            self.postMessage({
              success: true,
              logs,
              selectedBackend,
              opfsFile,
            });
            return;
          }

          if (mode === 'crash-recovery-check') {
            const reopened = await Database.newDatabaseAuto(dbName);
            reopened.allowNonLeaderWrites(true);
            const reopenedBackend = reopened.getStorageBackend();
            logs.push('reopened backend: ' + reopenedBackend);

            const opfsFile = await findMatchingOpfsFile(dbName);
            logs.push('opfs file: ' + JSON.stringify(opfsFile));

            const query = await reopened.execute('SELECT id, value FROM crash_recovery_data ORDER BY id');
            logs.push('row count: ' + query.rows.length);
            const rows = serializeRows(query);

            await reopened.close();
            if (cleanupOnClose) {
              try {
                await Database.deleteDatabase(dbName);
              } catch (cleanupError) {
                logs.push('cleanup warning: ' + String(cleanupError));
              }
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

          if (mode === 'crash-finalize-baseline') {
            const db = await Database.newDatabaseAuto(dbName);
            db.allowNonLeaderWrites(true);
            const selectedBackend = db.getStorageBackend();
            logs.push('selected backend: ' + selectedBackend);

            await db.execute('CREATE TABLE IF NOT EXISTS crash_finalize_data (id INTEGER PRIMARY KEY, value TEXT)');
            await db.execute('DELETE FROM crash_finalize_data');
            await db.execute('INSERT INTO crash_finalize_data (id, value) VALUES ' + buildCrashFinalizeValues('baseline'));
            await db.sync();
            await db.close();

            const opfsFile = await findMatchingOpfsFile(dbName);
            logs.push('opfs file after baseline sync: ' + JSON.stringify(opfsFile));

            self.postMessage({
              success: true,
              logs,
              selectedBackend,
              opfsFile,
            });
            return;
          }

          if (mode === 'crash-finalize-update') {
            const db = await Database.newDatabaseAuto(dbName);
            db.allowNonLeaderWrites(true);
            const selectedBackend = db.getStorageBackend();
            logs.push('selected backend: ' + selectedBackend);

            await db.execute('DELETE FROM crash_finalize_data');
            await db.execute('INSERT INTO crash_finalize_data (id, value) VALUES ' + buildCrashFinalizeValues('latest'));
            await db.sync();
            await db.close();

            const opfsFile = await findMatchingOpfsFile(dbName);
            logs.push('opfs file after latest sync: ' + JSON.stringify(opfsFile));

            self.postMessage({
              success: true,
              logs,
              selectedBackend,
              opfsFile,
            });
            return;
          }

          if (mode === 'crash-finalize-check') {
            const reopened = await Database.newDatabaseAuto(dbName);
            reopened.allowNonLeaderWrites(true);
            const reopenedBackend = reopened.getStorageBackend();
            logs.push('reopened backend: ' + reopenedBackend);

            const opfsFile = await findMatchingOpfsFile(dbName);
            logs.push('opfs file: ' + JSON.stringify(opfsFile));

            const countQuery = await reopened.execute('SELECT COUNT(*) FROM crash_finalize_data');
            const rowCount = countQuery.rows[0].values[0].value;
            logs.push('row count: ' + rowCount);

            const query = await reopened.execute('SELECT id, value FROM crash_finalize_data WHERE id IN (1, 64, 128) ORDER BY id');
            const rows = serializeRows(query);

            await reopened.close();
            if (cleanupOnClose) {
              try {
                await Database.deleteDatabase(dbName);
              } catch (cleanupError) {
                logs.push('cleanup warning: ' + String(cleanupError));
              }
            }

            self.postMessage({
              success: true,
              logs,
              reopenedBackend,
              opfsFile,
              rowCount,
              rows,
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

          if (mode === 'import-seed') {
            const source = await Database.newDatabaseAuto(sourceDbName);
            source.allowNonLeaderWrites(true);
            const sourceBackend = source.getStorageBackend();
            logs.push('source backend: ' + sourceBackend);

            await source.execute('CREATE TABLE IF NOT EXISTS imported_data (id INTEGER PRIMARY KEY, label TEXT)');
            await source.execute('DELETE FROM imported_data');
            await source.execute("INSERT INTO imported_data (id, label) VALUES (1, 'fresh-alpha'), (2, 'fresh-beta')");
            await source.sync();
            const exported = await source.exportToFile();
            logs.push('export size: ' + exported.length);
            await source.close();

            const target = await Database.newDatabaseAuto(dbName);
            target.allowNonLeaderWrites(true);
            const selectedBackend = target.getStorageBackend();
            logs.push('target backend: ' + selectedBackend);

            await target.execute('CREATE TABLE IF NOT EXISTS stale_data (id INTEGER PRIMARY KEY, value TEXT)');
            await target.execute('DELETE FROM stale_data');
            await target.execute("INSERT INTO stale_data (id, value) VALUES (1, 'stale-before-import')");
            await target.sync();

            const staleOpfsFile = await findMatchingOpfsFile(dbName);
            logs.push('stale opfs file: ' + JSON.stringify(staleOpfsFile));

            await target.importFromFile(exported);

            const importedQuery = await target.execute('SELECT id, label AS value FROM imported_data ORDER BY id');
            const importedRows = serializeRows(importedQuery);
            logs.push('imported row count: ' + importedRows.length);

            const staleTableQuery = await target.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='stale_data'");
            const staleTablePresentAfterImport = staleTableQuery.rows.length > 0;
            logs.push('stale table present after import: ' + staleTablePresentAfterImport);

            await target.close();
            try {
              await Database.deleteDatabase(sourceDbName);
            } catch (cleanupError) {
              logs.push('source cleanup warning: ' + String(cleanupError));
            }

            const opfsFile = await findMatchingOpfsFile(dbName);
            logs.push('target opfs file after import: ' + JSON.stringify(opfsFile));

            self.postMessage({
              success: true,
              logs,
              selectedBackend,
              sourceBackend,
              staleOpfsFile,
              opfsFile,
              importedRows,
              staleTablePresentAfterImport,
            });
            return;
          }

          if (mode === 'reopen-imported') {
            const reopened = await Database.newDatabaseAuto(dbName);
            reopened.allowNonLeaderWrites(true);
            const reopenedBackend = reopened.getStorageBackend();
            logs.push('reopened backend: ' + reopenedBackend);

            const opfsFile = await findMatchingOpfsFile(dbName);
            logs.push('opfs file: ' + JSON.stringify(opfsFile));

            const importedQuery = await reopened.execute('SELECT id, label AS value FROM imported_data ORDER BY id');
            const rows = serializeRows(importedQuery);
            logs.push('imported row count: ' + rows.length);

            const staleTableQuery = await reopened.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='stale_data'");
            const staleTablePresent = staleTableQuery.rows.length > 0;
            logs.push('stale table present after reopen: ' + staleTablePresent);

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
              staleTablePresent,
            });
            return;
          }

          if (mode === 'reload-imported') {
            const reopened = await Database.newDatabaseAuto(dbName);
            reopened.allowNonLeaderWrites(true);
            const reopenedBackend = reopened.getStorageBackend();
            logs.push('reopened backend: ' + reopenedBackend);

            const opfsFile = await findMatchingOpfsFile(dbName);
            logs.push('opfs file before reload: ' + JSON.stringify(opfsFile));

            await reopened.reloadFromIndexedDB();
            logs.push('reload complete');

            const importedQuery = await reopened.execute('SELECT id, label AS value FROM imported_data ORDER BY id');
            const rows = serializeRows(importedQuery);
            logs.push('imported row count after reload: ' + rows.length);

            const staleTableQuery = await reopened.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='stale_data'");
            const staleTablePresent = staleTableQuery.rows.length > 0;
            logs.push('stale table present after reload: ' + staleTablePresent);

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
              staleTablePresent,
            });
            return;
          }

          if (mode === 'seed-and-delete') {
            const db = await Database.newDatabaseAuto(dbName);
            db.allowNonLeaderWrites(true);
            const selectedBackend = db.getStorageBackend();
            logs.push('selected backend: ' + selectedBackend);

            await db.execute('CREATE TABLE IF NOT EXISTS worker_delete_data (id INTEGER PRIMARY KEY, value TEXT)');
            await db.execute('DELETE FROM worker_delete_data');
            await db.execute("INSERT INTO worker_delete_data (id, value) VALUES (1, 'delete-alpha')");
            await db.sync();
            await db.close();

            const opfsFileBeforeDelete = await findMatchingOpfsFile(dbName);
            logs.push('opfs file before delete: ' + JSON.stringify(opfsFileBeforeDelete));

            await Database.deleteDatabase(dbName);
            logs.push('deleteDatabase completed');

            const opfsFileAfterDelete = await findMatchingOpfsFile(dbName);
            logs.push('opfs file after delete: ' + JSON.stringify(opfsFileAfterDelete));

            self.postMessage({
              success: true,
              logs,
              selectedBackend,
              opfsFileBeforeDelete,
              opfsFileAfterDelete,
            });
            return;
          }

          if (mode === 'export-flush-seed') {
            const db = await Database.newDatabaseAuto(dbName);
            db.allowNonLeaderWrites(true);
            const selectedBackend = db.getStorageBackend();
            logs.push('selected backend: ' + selectedBackend);

            await db.execute('CREATE TABLE IF NOT EXISTS export_flush_data (id INTEGER PRIMARY KEY, value TEXT)');
            await db.execute('DELETE FROM export_flush_data');
            await db.execute("INSERT INTO export_flush_data (id, value) VALUES (1, 'flush-alpha'), (2, 'flush-beta')");

            const exported = await db.exportToFile();
            logs.push('export size: ' + exported.length);

            const opfsFile = await findMatchingOpfsFile(dbName);
            logs.push('opfs file after export: ' + JSON.stringify(opfsFile));

            await db.close();

            self.postMessage({
              success: true,
              logs,
              selectedBackend,
              exportedSize: exported.length,
              opfsFile,
            });
            return;
          }

          if (mode === 'reopen-export-flush') {
            const reopened = await Database.newDatabaseAuto(dbName);
            reopened.allowNonLeaderWrites(true);
            const reopenedBackend = reopened.getStorageBackend();
            logs.push('reopened backend: ' + reopenedBackend);

            const opfsFile = await findMatchingOpfsFile(dbName);
            logs.push('opfs file: ' + JSON.stringify(opfsFile));

            const query = await reopened.execute('SELECT id, value FROM export_flush_data ORDER BY id');
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

      worker.postMessage(options);
    });
  }, { pkgUrl: PKG_URL, options });
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

async function snapshotIndexedDbMirror(page, dbName) {
  return await page.evaluate(async ({ dbName }) => {
    const normalizedName = dbName.endsWith('.db') ? dbName : `${dbName}.db`;

    function waitForRequest(request) {
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
      });
    }

    function waitForTransaction(transaction) {
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
        transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
      });
    }

    function collectEntries(store, prefix, mapper) {
      return new Promise((resolve, reject) => {
        const entries = [];
        const range = IDBKeyRange.bound(`${prefix}:`, `${prefix}:\uffff`);
        const request = store.openCursor(range);

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (!cursor) {
            resolve(entries);
            return;
          }

          entries.push(mapper(cursor));
          cursor.continue();
        };

        request.onerror = () => reject(request.error ?? new Error('Failed to iterate IndexedDB cursor'));
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
    const transaction = db.transaction(['blocks', 'metadata'], 'readonly');
    const blocksStore = transaction.objectStore('blocks');
    const metadataStore = transaction.objectStore('metadata');

    const blocks = await collectEntries(blocksStore, normalizedName, (cursor) => {
      const value = cursor.value;
      const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
      return {
        key: String(cursor.key),
        data: Array.from(bytes),
      };
    });
    const metadata = await collectEntries(metadataStore, normalizedName, (cursor) => ({
      key: String(cursor.key),
      value: cursor.value,
    }));

    await waitForTransaction(transaction);
    db.close();

    return {
      normalizedName,
      blocks,
      metadata,
    };
  }, { dbName });
}

async function restoreIndexedDbMirror(page, snapshot) {
  return await page.evaluate(async ({ snapshot }) => {
    function waitForRequest(request) {
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
      });
    }

    function waitForTransaction(transaction) {
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
        transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
      });
    }

    function deleteKeysByPrefix(store, prefix) {
      return new Promise((resolve, reject) => {
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

    const deletedBlocks = await deleteKeysByPrefix(blocksStore, snapshot.normalizedName);
    const deletedMetadata = await deleteKeysByPrefix(metadataStore, snapshot.normalizedName);

    for (const entry of snapshot.blocks) {
      blocksStore.put(Uint8Array.from(entry.data), entry.key);
    }

    for (const entry of snapshot.metadata) {
      metadataStore.put(entry.value, entry.key);
    }

    await waitForTransaction(transaction);
    db.close();

    return {
      normalizedName: snapshot.normalizedName,
      deletedBlocks,
      deletedMetadata,
      restoredBlocks: snapshot.blocks.length,
      restoredMetadata: snapshot.metadata.length,
    };
  }, { snapshot });
}

async function replaceIndexedDbCommitMarker(page, dbName, commitMarker) {
  return await page.evaluate(async ({ dbName, commitMarker }) => {
    const normalizedName = dbName.endsWith('.db') ? dbName : `${dbName}.db`;

    function waitForRequest(request) {
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
      });
    }

    function waitForTransaction(transaction) {
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
        transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
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
    const transaction = db.transaction(['metadata'], 'readwrite');
    const metadataStore = transaction.objectStore('metadata');

    metadataStore.put(Number(commitMarker), `${normalizedName}:commit_marker`);

    await waitForTransaction(transaction);
    db.close();

    return {
      normalizedName,
      commitMarker,
    };
  }, { dbName, commitMarker });
}

async function corruptOpfsMirror(page, dbName) {
  return await page.evaluate(async ({ dbName }) => {
    const root = await navigator.storage.getDirectory();
    const corruptionBytes = new Uint8Array(4096);
    corruptionBytes.fill(0x5a);

    for await (const [entryName, handle] of root.entries()) {
      if (!entryName.includes(dbName) || handle.kind !== 'file') {
        continue;
      }

      const writable = await handle.createWritable({ keepExistingData: true });
      await writable.write({ type: 'write', position: 0, data: corruptionBytes });
      await writable.close();

      const file = await handle.getFile();
      return {
        entryName,
        size: file.size,
        corruptedPrefixBytes: corruptionBytes.length,
      };
    }

    return null;
  }, { dbName });
}

async function appendOrphanOpfsTail(page, dbName) {
  return await page.evaluate(async ({ dbName }) => {
    const root = await navigator.storage.getDirectory();
    const orphanBytes = new Uint8Array(4096);
    orphanBytes.fill(0xa5);

    for await (const [entryName, handle] of root.entries()) {
      if (!entryName.includes(dbName) || handle.kind !== 'file') {
        continue;
      }

      const beforeFile = await handle.getFile();
      const writable = await handle.createWritable({ keepExistingData: true });
      await writable.write({ type: 'write', position: beforeFile.size, data: orphanBytes });
      await writable.close();

      const afterFile = await handle.getFile();
      return {
        entryName,
        sizeBeforeAppend: beforeFile.size,
        sizeAfterAppend: afterFile.size,
        appendedBytes: orphanBytes.length,
      };
    }

    return null;
  }, { dbName });
}

test.describe('Worker Hybrid OPFS Backend', () => {
  test('worker explicit backend constructor can request Hybrid', async ({ page }) => {
    await page.goto(STATIC_URL);

    const dbName = `worker_hybrid_explicit_${Date.now()}`;
    const result = await runWorkerScenario(page, {
      dbName,
      mode: 'explicit-backend-roundtrip',
      backendName: 'Hybrid',
    });

    console.log((result.logs || []).join('\n'));

    expect(result.success, result.error ?? 'worker explicit backend flow failed').toBe(true);
    expect(result.selectedBackend).toBe('Hybrid');
    expect(result.reopenedBackend).toBe('Hybrid');
    expect(result.opfsFile).not.toBeNull();
    expect(result.rows).toEqual([
      { id: 1, value: 'explicit-alpha' },
      { id: 2, value: 'explicit-beta' },
    ]);
  });

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

  test('worker reopen falls back to IndexedDB when OPFS data is corrupted', async ({ page }) => {
    await page.goto(STATIC_URL);

    const dbName = `worker_hybrid_corrupt_${Date.now()}`;

    const seeded = await runWorkerScenario(page, dbName, 'seed');
    console.log((seeded.logs || []).join('\n'));

    expect(seeded.success, seeded.error ?? 'worker hybrid seed failed').toBe(true);
    expect(seeded.selectedBackend).toBe('Hybrid');
    expect(seeded.opfsFile).not.toBeNull();

    const corrupted = await corruptOpfsMirror(page, dbName);
    expect(corrupted).not.toBeNull();
    expect(corrupted.corruptedPrefixBytes).toBe(4096);

    const reopened = await runWorkerScenario(page, dbName, 'reopen');
    console.log((reopened.logs || []).join('\n'));

    expect(reopened.success, reopened.error ?? 'worker Hybrid corruption recovery failed').toBe(true);
    expect(reopened.reopenedBackend).toBe('Hybrid');
    expect(reopened.rows).toEqual([
      { id: 1, value: 'opfs-alpha' },
      { id: 2, value: 'opfs-beta' },
    ]);
  });

  test('worker reopen reconciles orphan OPFS tail against IndexedDB metadata', async ({ page }) => {
    await page.goto(STATIC_URL);

    const dbName = `worker_hybrid_orphan_tail_${Date.now()}`;

    const seeded = await runWorkerScenario(page, dbName, 'seed');
    console.log((seeded.logs || []).join('\n'));

    expect(seeded.success, seeded.error ?? 'worker hybrid seed failed').toBe(true);
    expect(seeded.selectedBackend).toBe('Hybrid');
    expect(seeded.opfsFile).not.toBeNull();

    const inflated = await appendOrphanOpfsTail(page, dbName);
    expect(inflated).not.toBeNull();
    expect(inflated.sizeBeforeAppend).toBe(seeded.opfsFile.size);
    expect(inflated.sizeAfterAppend).toBe(seeded.opfsFile.size + inflated.appendedBytes);

    const reopened = await runWorkerScenario(page, dbName, 'reopen');
    console.log((reopened.logs || []).join('\n'));

    expect(reopened.success, reopened.error ?? 'worker orphan reconciliation failed').toBe(true);
    expect(reopened.reopenedBackend).toBe('Hybrid');
    expect(reopened.rows).toEqual([
      { id: 1, value: 'opfs-alpha' },
      { id: 2, value: 'opfs-beta' },
    ]);
    expect(reopened.opfsFile).not.toBeNull();
    expect(reopened.opfsFile.size).toBe(seeded.opfsFile.size);
  });

  test('worker crash recovery heals torn Hybrid OPFS state after IndexedDB fallback', async ({ page }) => {
    await page.goto(STATIC_URL);

    const dbName = `worker_hybrid_crash_recovery_${Date.now()}`;

    const baseline = await runWorkerScenario(page, {
      dbName,
      mode: 'crash-recovery-baseline',
    });
    console.log((baseline.logs || []).join('\n'));

    expect(baseline.success, baseline.error ?? 'worker crash recovery baseline failed').toBe(true);
    expect(baseline.selectedBackend).toBe('Hybrid');

    const baselineMirror = await snapshotIndexedDbMirror(page, dbName);
    expect(baselineMirror.blocks.length).toBeGreaterThan(0);
    expect(baselineMirror.metadata.some((entry) => entry.key.endsWith(':commit_marker'))).toBe(true);

    const latest = await runWorkerScenario(page, {
      dbName,
      mode: 'crash-recovery-update',
    });
    console.log((latest.logs || []).join('\n'));

    expect(latest.success, latest.error ?? 'worker crash recovery latest sync failed').toBe(true);
    expect(latest.selectedBackend).toBe('Hybrid');

    const restoredMirror = await restoreIndexedDbMirror(page, baselineMirror);
    expect(restoredMirror.restoredBlocks).toBe(baselineMirror.blocks.length);
    expect(restoredMirror.restoredMetadata).toBe(baselineMirror.metadata.length);

    const recovered = await runWorkerScenario(page, {
      dbName,
      mode: 'crash-recovery-check',
    });
    console.log((recovered.logs || []).join('\n'));

    expect(recovered.success, recovered.error ?? 'worker crash recovery reopen failed').toBe(true);
    expect(recovered.reopenedBackend).toBe('Hybrid');
    expect(recovered.rows).toEqual([
      { id: 1, value: 'baseline-alpha' },
      { id: 2, value: 'baseline-beta' },
    ]);

    const deletedMirror = await deleteIndexedDbMirror(page, dbName);
    expect(deletedMirror.deletedAny).toBe(true);

    const healed = await runWorkerScenario(page, {
      dbName,
      mode: 'crash-recovery-check',
      cleanupOnClose: true,
    });
    console.log((healed.logs || []).join('\n'));

    expect(healed.success, healed.error ?? 'worker crash recovery healed reopen failed').toBe(true);
    expect(healed.reopenedBackend).toBe('Hybrid');
    expect(healed.rows).toEqual([
      { id: 1, value: 'baseline-alpha' },
      { id: 2, value: 'baseline-beta' },
    ]);
  });

  test('worker crash recovery finalizes Hybrid data when commit marker lags persisted blocks', async ({ page }) => {
    await page.goto(STATIC_URL);

    const dbName = `worker_hybrid_crash_finalize_${Date.now()}`;

    const baseline = await runWorkerScenario(page, {
      dbName,
      mode: 'crash-finalize-baseline',
    });
    console.log((baseline.logs || []).join('\n'));

    expect(baseline.success, baseline.error ?? 'worker crash recovery baseline failed').toBe(true);
    expect(baseline.selectedBackend).toBe('Hybrid');

    const baselineMirror = await snapshotIndexedDbMirror(page, dbName);
    const baselineCommitMarkerEntry = baselineMirror.metadata.find((entry) => entry.key.endsWith(':commit_marker'));
    expect(baselineCommitMarkerEntry).toBeDefined();
    expect(typeof baselineCommitMarkerEntry.value).toBe('number');

    const latest = await runWorkerScenario(page, {
      dbName,
      mode: 'crash-finalize-update',
    });
    console.log((latest.logs || []).join('\n'));

    expect(latest.success, latest.error ?? 'worker crash recovery latest sync failed').toBe(true);
    expect(latest.selectedBackend).toBe('Hybrid');

  const latestMirror = await snapshotIndexedDbMirror(page, dbName);
  const latestCommitMarkerEntry = latestMirror.metadata.find((entry) => entry.key.endsWith(':commit_marker'));
  expect(latestCommitMarkerEntry).toBeDefined();
  expect(typeof latestCommitMarkerEntry.value).toBe('number');
  expect(latestCommitMarkerEntry.value).toBeGreaterThan(baselineCommitMarkerEntry.value);

    const staleCommit = await replaceIndexedDbCommitMarker(page, dbName, baselineCommitMarkerEntry.value);
    expect(staleCommit.commitMarker).toBe(baselineCommitMarkerEntry.value);

  const rolledBackMirror = await snapshotIndexedDbMirror(page, dbName);
  const rolledBackCommitMarkerEntry = rolledBackMirror.metadata.find((entry) => entry.key.endsWith(':commit_marker'));
  expect(rolledBackCommitMarkerEntry.value).toBe(baselineCommitMarkerEntry.value);

    const recovered = await runWorkerScenario(page, {
      dbName,
      mode: 'crash-finalize-check',
      cleanupOnClose: true,
    });
    console.log((recovered.logs || []).join('\n'));

    expect(recovered.success, recovered.error ?? 'worker crash recovery finalize reopen failed').toBe(true);
    expect(recovered.reopenedBackend).toBe('Hybrid');
    expect(recovered.rowCount).toBe(128);
    expect(recovered.rows).toEqual([
      { id: 1, value: makeCrashFinalizeValue('latest', 1) },
      { id: 64, value: makeCrashFinalizeValue('latest', 64) },
      { id: 128, value: makeCrashFinalizeValue('latest', 128) },
    ]);
  });

  test('worker import updates OPFS so imported data survives IndexedDB mirror deletion', async ({ page }) => {
    await page.goto(STATIC_URL);

    const dbName = `worker_hybrid_import_${Date.now()}`;
    const sourceDbName = `${dbName}_source`;

    const imported = await runWorkerScenario(page, {
      dbName,
      sourceDbName,
      mode: 'import-seed',
    });
    console.log((imported.logs || []).join('\n'));

    expect(imported.success, imported.error ?? 'worker hybrid import seed failed').toBe(true);
    expect(imported.selectedBackend).toBe('Hybrid');
    expect(imported.importedRows).toEqual([
      { id: 1, value: 'fresh-alpha' },
      { id: 2, value: 'fresh-beta' },
    ]);
    expect(imported.staleTablePresentAfterImport).toBe(false);
    expect(imported.opfsFile).not.toBeNull();

    const deletedMirror = await deleteIndexedDbMirror(page, dbName);
    expect(deletedMirror.deletedAny).toBe(true);

    const reopened = await runWorkerScenario(page, {
      dbName,
      mode: 'reopen-imported',
    });
    console.log((reopened.logs || []).join('\n'));

    expect(reopened.success, reopened.error ?? 'worker hybrid imported reopen failed').toBe(true);
    expect(reopened.reopenedBackend).toBe('Hybrid');
    expect(reopened.rows).toEqual([
      { id: 1, value: 'fresh-alpha' },
      { id: 2, value: 'fresh-beta' },
    ]);
    expect(reopened.staleTablePresent).toBe(false);
  });

  test('worker Hybrid reload keeps OPFS-backed data after IndexedDB mirror deletion', async ({ page }) => {
    await page.goto(STATIC_URL);

    const dbName = `worker_hybrid_reload_${Date.now()}`;
    const sourceDbName = `${dbName}_source`;

    const imported = await runWorkerScenario(page, {
      dbName,
      sourceDbName,
      mode: 'import-seed',
    });
    console.log((imported.logs || []).join('\n'));

    expect(imported.success, imported.error ?? 'worker hybrid import seed failed').toBe(true);
    expect(imported.selectedBackend).toBe('Hybrid');

    const deletedMirror = await deleteIndexedDbMirror(page, dbName);
    expect(deletedMirror.deletedAny).toBe(true);

    const reloaded = await runWorkerScenario(page, {
      dbName,
      mode: 'reload-imported',
    });
    console.log((reloaded.logs || []).join('\n'));

    expect(reloaded.success, reloaded.error ?? 'worker hybrid reload after mirror delete failed').toBe(true);
    expect(reloaded.reopenedBackend).toBe('Hybrid');
    expect(reloaded.rows).toEqual([
      { id: 1, value: 'fresh-alpha' },
      { id: 2, value: 'fresh-beta' },
    ]);
    expect(reloaded.staleTablePresent).toBe(false);
  });

  test('worker deleteDatabase succeeds without Window and removes OPFS data', async ({ page }) => {
    await page.goto(STATIC_URL);

    const dbName = `worker_hybrid_delete_${Date.now()}`;

    const deleted = await runWorkerScenario(page, {
      dbName,
      mode: 'seed-and-delete',
    });
    console.log((deleted.logs || []).join('\n'));

    expect(deleted.success, deleted.error ?? 'worker deleteDatabase failed').toBe(true);
    expect(deleted.selectedBackend).toBe('Hybrid');
    expect(deleted.opfsFileBeforeDelete).not.toBeNull();
    expect(deleted.opfsFileAfterDelete).toBeNull();
  });

  test('worker exportToFile flush persists Hybrid data to OPFS before IndexedDB mirror deletion', async ({ page }) => {
    await page.goto(STATIC_URL);

    const dbName = `worker_hybrid_export_flush_${Date.now()}`;

    const seeded = await runWorkerScenario(page, {
      dbName,
      mode: 'export-flush-seed',
    });
    console.log((seeded.logs || []).join('\n'));

    expect(seeded.success, seeded.error ?? 'worker hybrid export flush seed failed').toBe(true);
    expect(seeded.selectedBackend).toBe('Hybrid');
    expect(seeded.exportedSize).toBeGreaterThanOrEqual(4096);
    expect(seeded.opfsFile).not.toBeNull();

    const deletedMirror = await deleteIndexedDbMirror(page, dbName);
    expect(deletedMirror.deletedAny).toBe(true);

    const reopened = await runWorkerScenario(page, {
      dbName,
      mode: 'reopen-export-flush',
    });
    console.log((reopened.logs || []).join('\n'));

    expect(reopened.success, reopened.error ?? 'worker hybrid export flush reopen failed').toBe(true);
    expect(reopened.reopenedBackend).toBe('Hybrid');
    expect(reopened.rows).toEqual([
      { id: 1, value: 'flush-alpha' },
      { id: 2, value: 'flush-beta' },
    ]);
  });
});