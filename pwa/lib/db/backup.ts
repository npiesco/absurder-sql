/**
 * Database Backup/Restore Utilities
 *
 * Uses exportToFile/importFromFile pattern for reliable persistence.
 * This creates atomic snapshots stored in a separate IndexedDB backup store.
 *
 * Note: sync() now works correctly in v0.1.24+ (IndexedDB key bug fixed),
 * but export/import pattern is still recommended for:
 * - Atomic snapshots that can be versioned
 * - Separate backup store isolated from VFS blocks
 * - Easier backup/restore across different databases
 *
 * Pattern from basalt PWA: https://github.com/npiesco/basalt
 */

const BACKUP_DB_NAME = 'absurder-sql-backup';
const BACKUP_STORE_NAME = 'exports';
const BACKUP_KEY = 'latest';

/**
 * Save database snapshot to IndexedDB backup store
 */
export async function saveBackup(db: any, dbName: string): Promise<void> {
  if (!db) return;

  try {
    // Checkpoint WAL first
    await db.execute('PRAGMA wal_checkpoint(TRUNCATE)');

    // Export database to Uint8Array
    const exportData = await db.exportToFile();
    console.log('[BACKUP] Exported database:', exportData.byteLength, 'bytes');

    // Get current IndexedDB version
    const currentVersion = await new Promise<number>((resolve) => {
      const checkRequest = indexedDB.open(BACKUP_DB_NAME);
      checkRequest.onsuccess = (event: any) => {
        const idb = (event.target as IDBOpenDBRequest).result;
        const version = idb.version;
        idb.close();
        resolve(version);
      };
      checkRequest.onerror = () => resolve(0);
    });

    // Store backup with incremented version
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(BACKUP_DB_NAME, currentVersion + 1);

      request.onupgradeneeded = (event: any) => {
        const idb = (event.target as IDBOpenDBRequest).result;
        if (!idb.objectStoreNames.contains(BACKUP_STORE_NAME)) {
          idb.createObjectStore(BACKUP_STORE_NAME);
          console.log('[BACKUP] Created backup object store');
        }
      };

      request.onsuccess = (event: any) => {
        const idb = (event.target as IDBOpenDBRequest).result;
        const transaction = idb.transaction([BACKUP_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(BACKUP_STORE_NAME);

        // Store both the data and the database name
        store.put({ data: exportData, dbName }, BACKUP_KEY);

        transaction.oncomplete = () => {
          console.log('[BACKUP] Saved to IndexedDB (' + exportData.byteLength + ' bytes)');
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
  } catch (err) {
    console.error('[BACKUP] Save failed:', err);
    throw err;
  }
}

/**
 * Load database snapshot from IndexedDB backup store
 */
export async function loadBackup(): Promise<{ data: Uint8Array; dbName: string } | null> {
  try {
    // Check if backup exists
    const checkRequest = indexedDB.open(BACKUP_DB_NAME);

    return await new Promise((resolve) => {
      checkRequest.onsuccess = (event: any) => {
        const idb = (event.target as IDBOpenDBRequest).result;
        const currentVersion = idb.version;
        idb.close();

        // Open with incremented version to ensure store exists
        const request = indexedDB.open(BACKUP_DB_NAME, currentVersion + 1);

        request.onupgradeneeded = (event: any) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(BACKUP_STORE_NAME)) {
            db.createObjectStore(BACKUP_STORE_NAME);
          }
        };

        request.onsuccess = (event: any) => {
          const db = (event.target as IDBOpenDBRequest).result;

          if (!db.objectStoreNames.contains(BACKUP_STORE_NAME)) {
            console.log('[BACKUP] No backup store found');
            db.close();
            resolve(null);
            return;
          }

          const transaction = db.transaction([BACKUP_STORE_NAME], 'readonly');
          const store = transaction.objectStore(BACKUP_STORE_NAME);
          const getRequest = store.get(BACKUP_KEY);

          getRequest.onsuccess = () => {
            const result = getRequest.result;
            db.close();
            if (result && result.data && result.data.byteLength > 0) {
              console.log('[BACKUP] Found backup (' + result.data.byteLength + ' bytes) for db:', result.dbName);
              resolve(result);
            } else {
              console.log('[BACKUP] No backup data found');
              resolve(null);
            }
          };

          getRequest.onerror = () => {
            console.log('[BACKUP] Error reading backup');
            db.close();
            resolve(null);
          };
        };

        request.onerror = () => {
          console.log('[BACKUP] Error opening backup DB');
          resolve(null);
        };
      };

      checkRequest.onerror = () => {
        console.log('[BACKUP] No backup database found (first run)');
        resolve(null);
      };
    });
  } catch (err) {
    console.error('[BACKUP] Load failed:', err);
    return null;
  }
}

/**
 * Clear backup from IndexedDB
 */
export async function clearBackup(): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(BACKUP_DB_NAME);
      request.onsuccess = () => {
        console.log('[BACKUP] Cleared backup database');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('[BACKUP] Clear failed:', err);
  }
}
