/**
 * Persistence on Page Refresh E2E Test
 *
 * Verifies that database data persists across page refreshes using
 * the backup/restore pattern (exportToFile/importFromFile).
 *
 * This pattern avoids the sync() corruption bug by creating atomic
 * snapshots stored in a separate IndexedDB backup store.
 */

import { test, expect } from '@playwright/test';

const BACKUP_DB_NAME = 'absurder-sql-backup';

test.describe('Database Persistence on Refresh', () => {
  const TEST_DB_NAME = `persist_test_${Date.now()}.db`;
  const TEST_TABLE = 'persistence_test';

  test.beforeEach(async ({ page }) => {
    // Navigate to database page
    await page.goto('/db');

    // Wait for WASM to initialize
    await page.waitForFunction(() => {
      return typeof (window as any).Database !== 'undefined';
    }, { timeout: 30000 });
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: Delete test database and backup from IndexedDB
    await page.evaluate(async (config) => {
      const { dbName, backupDbName } = config;

      // Close any open database
      const testDb = (window as any).testDb;
      if (testDb) {
        try { await testDb.close(); } catch {}
      }

      // Delete VFS databases from IndexedDB
      const databases = await indexedDB.databases();
      for (const db of databases) {
        if (db.name?.includes(dbName.replace('.db', ''))) {
          await new Promise<void>((resolve, reject) => {
            const req = indexedDB.deleteDatabase(db.name!);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          });
        }
      }

      // Delete backup database
      await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase(backupDbName);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve(); // Ignore errors
      });

      // Clear localStorage
      localStorage.clear();
    }, { dbName: TEST_DB_NAME, backupDbName: BACKUP_DB_NAME });
  });

  test('should persist data across page refresh using backup/restore pattern', async ({ page }) => {
    // Step 1: Create database and insert data
    const insertedData = await page.evaluate(async (config) => {
      const { dbName, tableName } = config;
      const Database = (window as any).Database;

      // Create database
      const db = await Database.newDatabase(dbName);
      (window as any).testDb = db;

      // Create table
      await db.execute(`CREATE TABLE ${tableName} (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        value INTEGER
      )`);

      // Insert test data
      await db.execute(`INSERT INTO ${tableName} (id, name, value) VALUES (1, 'test_row_1', 100)`);
      await db.execute(`INSERT INTO ${tableName} (id, name, value) VALUES (2, 'test_row_2', 200)`);
      await db.execute(`INSERT INTO ${tableName} (id, name, value) VALUES (3, 'test_row_3', 300)`);

      // Verify data was inserted
      const result = await db.execute(`SELECT * FROM ${tableName} ORDER BY id`);

      // Store dbName in localStorage (simulating what the app does)
      localStorage.setItem('absurder-sql-database-store', JSON.stringify({
        state: { currentDbName: dbName },
        version: 0
      }));

      return {
        rowCount: result.rows.length,
        columns: result.columns
      };
    }, { dbName: TEST_DB_NAME, tableName: TEST_TABLE });

    expect(insertedData.rowCount).toBe(3);
    console.log('[TEST] Inserted 3 rows into database');

    // Step 2: Save backup using exportToFile pattern (what beforeunload does)
    await page.evaluate(async (config) => {
      const { dbName, backupDbName } = config;
      const db = (window as any).testDb;
      if (!db) return;

      console.log('[TEST] Saving backup with exportToFile...');

      // Checkpoint WAL
      await db.execute('PRAGMA wal_checkpoint(TRUNCATE)');

      // Export database
      const exportData = await db.exportToFile();
      console.log('[TEST] Exported', exportData.byteLength, 'bytes');

      // Store in backup IndexedDB
      const currentVersion = await new Promise<number>((resolve) => {
        const checkRequest = indexedDB.open(backupDbName);
        checkRequest.onsuccess = (event: any) => {
          const idb = (event.target as IDBOpenDBRequest).result;
          const version = idb.version;
          idb.close();
          resolve(version);
        };
        checkRequest.onerror = () => resolve(0);
      });

      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(backupDbName, currentVersion + 1);

        request.onupgradeneeded = (event: any) => {
          const idb = (event.target as IDBOpenDBRequest).result;
          if (!idb.objectStoreNames.contains('exports')) {
            idb.createObjectStore('exports');
          }
        };

        request.onsuccess = (event: any) => {
          const idb = (event.target as IDBOpenDBRequest).result;
          const transaction = idb.transaction(['exports'], 'readwrite');
          const store = transaction.objectStore('exports');
          store.put({ data: exportData, dbName }, 'latest');
          transaction.oncomplete = () => {
            console.log('[TEST] Backup saved to IndexedDB');
            idb.close();
            resolve();
          };
          transaction.onerror = () => {
            idb.close();
            reject(transaction.error);
          };
        };
        request.onerror = () => reject(request.error);
      });

      // Close database
      await db.close();
      console.log('[TEST] Database closed');
    }, { dbName: TEST_DB_NAME, backupDbName: BACKUP_DB_NAME });

    console.log('[TEST] Backup saved, data should persist');

    // Step 3: Reload the page
    await page.reload();

    // Wait for WASM to reinitialize
    await page.waitForFunction(() => {
      return typeof (window as any).Database !== 'undefined';
    }, { timeout: 30000 });

    console.log('[TEST] Page reloaded, WASM reinitialized');

    // Step 4: Restore from backup and verify data persisted
    const persistedData = await page.evaluate(async (config) => {
      const { dbName, tableName, backupDbName } = config;
      const Database = (window as any).Database;

      // Load backup from IndexedDB (simulating what loadDatabase does)
      const backup = await new Promise<{ data: Uint8Array; dbName: string } | null>((resolve) => {
        const checkRequest = indexedDB.open(backupDbName);
        checkRequest.onsuccess = (event: any) => {
          const idb = (event.target as IDBOpenDBRequest).result;
          const currentVersion = idb.version;
          idb.close();

          const request = indexedDB.open(backupDbName, currentVersion + 1);
          request.onupgradeneeded = (event: any) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('exports')) {
              db.createObjectStore('exports');
            }
          };
          request.onsuccess = (event: any) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('exports')) {
              db.close();
              resolve(null);
              return;
            }
            const transaction = db.transaction(['exports'], 'readonly');
            const store = transaction.objectStore('exports');
            const getRequest = store.get('latest');
            getRequest.onsuccess = () => {
              const result = getRequest.result;
              db.close();
              if (result && result.data && result.data.byteLength > 0) {
                resolve(result);
              } else {
                resolve(null);
              }
            };
            getRequest.onerror = () => {
              db.close();
              resolve(null);
            };
          };
          request.onerror = () => resolve(null);
        };
        checkRequest.onerror = () => resolve(null);
      });

      if (!backup) {
        return { error: 'No backup found after reload', rowCount: 0 };
      }

      console.log('[TEST] Found backup:', backup.data.byteLength, 'bytes for', backup.dbName);

      // Restore from backup
      const tempDb = await Database.newDatabase(backup.dbName);
      await tempDb.importFromFile(backup.data);
      await tempDb.close();

      // Reopen fresh
      const db = await Database.newDatabase(backup.dbName);
      (window as any).testDb = db;

      // Check if table exists
      const tablesResult = await db.execute(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`
      );

      if (tablesResult.rows.length === 0) {
        return { error: 'Table does not exist after restore', rowCount: 0 };
      }

      // Query the data
      const result = await db.execute(`SELECT * FROM ${tableName} ORDER BY id`);

      return {
        rowCount: result.rows.length,
        rows: result.rows.map((row: any) => {
          const obj: any = {};
          result.columns.forEach((col: string, i: number) => {
            obj[col] = row.values[i]?.value;
          });
          return obj;
        })
      };
    }, { dbName: TEST_DB_NAME, tableName: TEST_TABLE, backupDbName: BACKUP_DB_NAME });

    console.log('[TEST] Persisted data:', persistedData);

    // Verify data persisted
    expect(persistedData.error).toBeUndefined();
    expect(persistedData.rowCount).toBe(3);
    expect(persistedData.rows).toEqual([
      { id: 1, name: 'test_row_1', value: 100 },
      { id: 2, name: 'test_row_2', value: 200 },
      { id: 3, name: 'test_row_3', value: 300 }
    ]);
  });

  test('should persist schema changes across page refresh', async ({ page }) => {
    // Create database with initial table
    await page.evaluate(async (config) => {
      const { dbName, backupDbName } = config;
      const Database = (window as any).Database;
      const db = await Database.newDatabase(dbName);
      (window as any).testDb = db;

      // Create multiple tables
      await db.execute(`CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)`);
      await db.execute(`CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, amount REAL)`);
      await db.execute(`CREATE INDEX idx_orders_user ON orders(user_id)`);

      localStorage.setItem('absurder-sql-database-store', JSON.stringify({
        state: { currentDbName: dbName },
        version: 0
      }));

      // Save backup
      await db.execute('PRAGMA wal_checkpoint(TRUNCATE)');
      const exportData = await db.exportToFile();

      const currentVersion = await new Promise<number>((resolve) => {
        const checkRequest = indexedDB.open(backupDbName);
        checkRequest.onsuccess = (event: any) => {
          const idb = (event.target as IDBOpenDBRequest).result;
          const version = idb.version;
          idb.close();
          resolve(version);
        };
        checkRequest.onerror = () => resolve(0);
      });

      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(backupDbName, currentVersion + 1);
        request.onupgradeneeded = (event: any) => {
          const idb = (event.target as IDBOpenDBRequest).result;
          if (!idb.objectStoreNames.contains('exports')) {
            idb.createObjectStore('exports');
          }
        };
        request.onsuccess = (event: any) => {
          const idb = (event.target as IDBOpenDBRequest).result;
          const transaction = idb.transaction(['exports'], 'readwrite');
          const store = transaction.objectStore('exports');
          store.put({ data: exportData, dbName }, 'latest');
          transaction.oncomplete = () => { idb.close(); resolve(); };
          transaction.onerror = () => { idb.close(); reject(transaction.error); };
        };
        request.onerror = () => reject(request.error);
      });

      await db.close();
    }, { dbName: TEST_DB_NAME, backupDbName: BACKUP_DB_NAME });

    // Reload
    await page.reload();
    await page.waitForFunction(() => (window as any).Database !== undefined, { timeout: 30000 });

    // Verify schema persisted via backup/restore
    const schema = await page.evaluate(async (config) => {
      const { dbName, backupDbName } = config;
      const Database = (window as any).Database;

      // Load backup
      const backup = await new Promise<{ data: Uint8Array; dbName: string } | null>((resolve) => {
        const request = indexedDB.open(backupDbName);
        request.onsuccess = (event: any) => {
          const idb = (event.target as IDBOpenDBRequest).result;
          if (!idb.objectStoreNames.contains('exports')) {
            idb.close();
            resolve(null);
            return;
          }
          const transaction = idb.transaction(['exports'], 'readonly');
          const store = transaction.objectStore('exports');
          const getRequest = store.get('latest');
          getRequest.onsuccess = () => {
            const result = getRequest.result;
            idb.close();
            resolve(result && result.data ? result : null);
          };
          getRequest.onerror = () => { idb.close(); resolve(null); };
        };
        request.onerror = () => resolve(null);
      });

      if (!backup) {
        return { error: 'No backup found', tableCount: 0, tableNames: [], indexCount: 0 };
      }

      // Restore
      const tempDb = await Database.newDatabase(backup.dbName);
      await tempDb.importFromFile(backup.data);
      await tempDb.close();

      const db = await Database.newDatabase(backup.dbName);
      (window as any).testDb = db;

      const tables = await db.execute(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
      );
      const indexes = await db.execute(
        `SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'`
      );

      return {
        tableCount: tables.rows.length,
        tableNames: tables.rows.map((r: any) => r.values[0]?.value),
        indexCount: indexes.rows.length
      };
    }, { dbName: TEST_DB_NAME, backupDbName: BACKUP_DB_NAME });

    expect(schema.tableCount).toBe(2);
    expect(schema.tableNames).toContain('users');
    expect(schema.tableNames).toContain('orders');
    expect(schema.indexCount).toBeGreaterThanOrEqual(1);
  });
});
