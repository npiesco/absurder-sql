import initSqlJs from '@jlongster/sql.js';
import { SQLiteFS } from 'absurd-sql';
import IndexedDBBackend from 'absurd-sql/dist/indexeddb-backend.js';

let db = null;

async function initDatabase() {
    const SQL = await initSqlJs({ 
        locateFile: file => `/node_modules/@jlongster/sql.js/dist/${file}` 
    });
    const sqlFS = new SQLiteFS(SQL.FS, new IndexedDBBackend());
    SQL.register_for_idb(sqlFS);

    SQL.FS.mkdir('/sql');
    SQL.FS.mount(sqlFS, {}, '/sql');

    const path = '/sql/benchmark.sqlite';
    
    // Handle SharedArrayBuffer fallback
    if (typeof SharedArrayBuffer === 'undefined') {
        try {
            let stream = SQL.FS.open(path, 'a+');
            await stream.node.contents.readIfFallback();
            SQL.FS.close(stream);
        } catch (e) {
            console.warn('SharedArrayBuffer fallback failed, continuing anyway:', e);
        }
    }

    db = new SQL.Database(path, { filename: true });
    db.exec(`
        PRAGMA page_size=8192;
        PRAGMA journal_mode=MEMORY;
    `);
    
    return true;
}

// Message handler
self.onmessage = async function(e) {
    const { type, sql, id } = e.data;
    
    try {
        if (type === 'init') {
            await initDatabase();
            self.postMessage({ type: 'init', success: true, id });
        } else if (type === 'exec') {
            const start = performance.now();
            db.exec(sql);
            const duration = performance.now() - start;
            self.postMessage({ type: 'exec', success: true, duration, id });
        } else if (type === 'close') {
            if (db) {
                db.close();
                db = null;
            }
            self.postMessage({ type: 'close', success: true, id });
        }
    } catch (error) {
        self.postMessage({ 
            type: type, 
            success: false, 
            error: error.message,
            id 
        });
    }
};
