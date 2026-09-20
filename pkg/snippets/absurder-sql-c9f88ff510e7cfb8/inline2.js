
export function absurd_idb_delete_namespace(factory, dbName) {
  return new Promise((resolve, reject) => {
    const request = factory.open('block_storage', 2);
    let settled = false;
    let failure;
    const fail = error => {
      settled = true;
      reject(error);
    };
    request.onblocked = () => fail(new Error('IndexedDB deletion blocked by an open connection'));
    request.onerror = () => fail(failure || request.error);
    request.onupgradeneeded = () => {
      if (settled) {
        request.transaction.abort();
        return;
      }
      try {
        const db = request.result;
        if (!db.objectStoreNames.contains('blocks')) db.createObjectStore('blocks');
        if (!db.objectStoreNames.contains('metadata')) db.createObjectStore('metadata');
      } catch (error) {
        failure = error;
        request.transaction.abort();
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      if (settled) {
        db.close();
        return;
      }
      let transaction;
      const abort = error => {
        failure = error;
        if (transaction) {
          try {
            transaction.abort();
            return;
          } catch (abortError) {
            failure = new Error(String(error) + '; abort failed: ' + String(abortError));
          }
        }
        db.close();
        fail(failure);
      };
      try {
        transaction = db.transaction(['blocks', 'metadata'], 'readwrite');
        transaction.oncomplete = () => {
          db.close();
          settled = true;
          resolve();
        };
        transaction.onerror = event => {
          failure = event.target.error || new Error('IndexedDB deletion request failed');
        };
        transaction.onabort = () => {
          db.close();
          fail(failure || transaction.error || new Error('IndexedDB deletion aborted'));
        };
        const prefix = dbName + ':';
        const range = IDBKeyRange.bound(prefix, prefix + '\uffff');
        for (const storeName of ['blocks', 'metadata']) {
          const store = transaction.objectStore(storeName);
          const cursorRequest = store.openCursor(range);
          cursorRequest.onsuccess = () => {
            try {
              const cursor = cursorRequest.result;
              if (!cursor) return;
              const suffix = cursor.key.slice(prefix.length);
              // Numeric block IDs, including legacy checksum/version suffixes.
              // A neighboring database name may itself contain the ':' separator.
              if (/^[0-9]+(?::[0-9]+)?$/.test(suffix) ||
                  (storeName === 'metadata' && suffix === 'commit_marker')) {
                cursor.delete();
              }
              cursor.continue();
            } catch (error) {
              abort(error);
            }
          };
        }
        transaction.objectStore('metadata').delete(dbName + '_commit_marker');
      } catch (error) {
        abort(error);
      }
    };
  });
}
