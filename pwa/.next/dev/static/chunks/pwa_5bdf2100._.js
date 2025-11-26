(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/pwa/lib/db/client.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DatabaseClient",
    ()=>DatabaseClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$npiesco$2f$absurder$2d$sql$2f$absurder_sql$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/@npiesco/absurder-sql/absurder_sql.js [app-client] (ecmascript)");
;
class DatabaseClient {
    db = null;
    dbName = null;
    initialized = false;
    /**
   * Initialize the WASM module. This must be called before any database operations.
   * Safe to call multiple times - will only initialize once.
   */ async initialize() {
        if (this.initialized) {
            return;
        }
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$npiesco$2f$absurder$2d$sql$2f$absurder_sql$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])();
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize WASM module:', error);
            throw new Error(`WASM initialization failed: ${error}`);
        }
    }
    /**
   * Check if WASM module is initialized
   */ isInitialized() {
        return this.initialized;
    }
    /**
   * Open a database by name. Creates a new database if it doesn't exist.
   * @param dbName - Name of the database file (e.g., 'myapp.db')
   */ async open(dbName) {
        await this.initialize();
        if (this.db) {
            throw new Error('Database is already open. Close it first.');
        }
        try {
            this.db = await __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$npiesco$2f$absurder$2d$sql$2f$absurder_sql$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Database"].newDatabase(dbName);
            this.dbName = dbName;
            console.log(`DatabaseClient: Opened database "${dbName}"`);
        } catch (error) {
            console.error('DatabaseClient: Failed to open database:', error);
            throw new Error(`Failed to open database: ${error}`);
        }
    }
    /**
   * Execute a SQL query with optional parameters
   * @param sql - SQL query string
   * @param params - Optional array of parameters for prepared statement
   */ async execute(sql, params) {
        if (!this.db) {
            throw new Error('Database not opened. Call open() first.');
        }
        try {
            if (params && params.length > 0) {
                return await this.db.executeWithParams(sql, params);
            } else {
                return await this.db.execute(sql);
            }
        } catch (error) {
            console.error('Query execution failed:', error);
            throw new Error(`Query failed: ${error}`);
        }
    }
    /**
   * Export database to a Blob (downloadable .db file)
   */ async export() {
        if (!this.db) {
            throw new Error('Database not opened. Call open() first.');
        }
        try {
            const buffer = await this.db.exportToFile();
            return new Blob([
                buffer
            ], {
                type: 'application/x-sqlite3'
            });
        } catch (error) {
            console.error('Database export failed:', error);
            throw new Error(`Export failed: ${error}`);
        }
    }
    /**
   * Import a database from a File
   * Note: This closes the current database connection and reopens it with the imported data
   * @param file - File object containing SQLite database
   */ async import(file) {
        if (!this.db || !this.dbName) {
            throw new Error('Database not opened. Call open() first to create initial database instance.');
        }
        try {
            const buffer = await file.arrayBuffer();
            await this.db.importFromFile(new Uint8Array(buffer));
            // importFromFile closes the connection, must reopen with same name
            console.log(`Import complete, reopening database "${this.dbName}"...`);
            this.db = await __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$npiesco$2f$absurder$2d$sql$2f$absurder_sql$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Database"].newDatabase(this.dbName);
            console.log('Database reopened after import');
        } catch (error) {
            console.error('Database import failed:', error);
            throw new Error(`Import failed: ${error}`);
        }
    }
    /**
   * Sync database to IndexedDB (flush WAL)
   * Call this after writes to ensure data is persisted
   */ async sync() {
        if (!this.db) {
            throw new Error('Database not opened. Call open() first.');
        }
        try {
            await this.db.sync();
        } catch (error) {
            console.error('Database sync failed:', error);
            throw new Error(`Sync failed: ${error}`);
        }
    }
    /**
   * Close the database connection
   */ async close() {
        if (this.db) {
            try {
                await this.db.close();
                this.db = null;
                this.dbName = null;
            } catch (error) {
                console.error('Database close failed:', error);
                throw new Error(`Close failed: ${error}`);
            }
        }
    }
    /**
   * Check if database is currently open
   */ isOpen() {
        return this.db !== null;
    }
    /**
   * Get the current database name
   */ getDatabaseName() {
        return this.dbName;
    }
    /**
   * Export database to a Blob with specified name
   * Alias for export() method to match common naming conventions
   */ async exportDatabase() {
        return this.export();
    }
    /**
   * Import database from a Blob with a new database name
   * Creates a new database and imports the data
   */ async importDatabase(dbName, blob) {
        await this.initialize();
        // Close existing database if open
        if (this.db) {
            await this.close();
        }
        try {
            // Create new database
            this.db = await __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$npiesco$2f$absurder$2d$sql$2f$absurder_sql$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Database"].newDatabase(dbName);
            this.dbName = dbName;
            // Import data
            const buffer = await blob.arrayBuffer();
            await this.db.importFromFile(new Uint8Array(buffer));
            // importFromFile closes the connection, must reopen
            console.log(`Import complete, reopening database "${dbName}"...`);
            this.db = await __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$npiesco$2f$absurder$2d$sql$2f$absurder_sql$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Database"].newDatabase(dbName);
            console.log('Database reopened after import');
        } catch (error) {
            console.error('Database import failed:', error);
            this.db = null;
            this.dbName = null;
            throw new Error(`Import failed: ${error}`);
        }
    }
    /**
   * Delete a database by name
   * Warning: This permanently removes the database from IndexedDB
   */ async deleteDatabase(dbName) {
        await this.initialize();
        // Close if this is the current database
        if (this.dbName === dbName && this.db) {
            await this.close();
        }
        try {
            // Delete from IndexedDB directly
            const deleteRequest = indexedDB.deleteDatabase(dbName);
            await new Promise((resolve, reject)=>{
                deleteRequest.onsuccess = ()=>{
                    console.log(`Deleted database "${dbName}"`);
                    resolve();
                };
                deleteRequest.onerror = ()=>{
                    reject(new Error(`Failed to delete database: ${deleteRequest.error}`));
                };
                deleteRequest.onblocked = ()=>{
                    console.warn(`Delete blocked for database "${dbName}". Close all connections first.`);
                };
            });
        } catch (error) {
            console.error(`Failed to delete database "${dbName}":`, error);
            throw new Error(`Delete failed: ${error}`);
        }
    }
    /**
   * Get the current database instance (for advanced use)
   */ getDatabase() {
        return this.db;
    }
    /**
   * Check if this instance is the leader (can write to database)
   */ async isLeader() {
        if (!this.db) {
            throw new Error('Database not opened. Call open() first.');
        }
        return await this.db.isLeader();
    }
    /**
   * Wait for this instance to become leader
   */ async waitForLeadership() {
        if (!this.db) {
            throw new Error('Database not opened. Call open() first.');
        }
        return await this.db.waitForLeadership();
    }
    /**
   * Request leadership (triggers re-election)
   */ async requestLeadership() {
        if (!this.db) {
            throw new Error('Database not opened. Call open() first.');
        }
        return await this.db.requestLeadership();
    }
    /**
   * Allow non-leader writes (for single-tab apps or testing)
   */ async allowNonLeaderWrites(allow) {
        if (!this.db) {
            throw new Error('Database not opened. Call open() first.');
        }
        return await this.db.allowNonLeaderWrites(allow);
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/pwa/lib/db/hooks.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useDatabase",
    ()=>useDatabase,
    "useExport",
    ()=>useExport,
    "useImport",
    ()=>useImport,
    "useQuery",
    ()=>useQuery,
    "useTransaction",
    ()=>useTransaction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$db$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/lib/db/client.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature(), _s4 = __turbopack_context__.k.signature();
'use client';
;
;
;
// Singleton database client
let dbClient = null;
function useDatabase(dbName) {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(8);
    if ($[0] !== "1eac1a006b9319a3ec15f837937cbab2c7fe5f607f7f602d804ed4253d4b309f") {
        for(let $i = 0; $i < 8; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "1eac1a006b9319a3ec15f837937cbab2c7fe5f607f7f602d804ed4253d4b309f";
    }
    const [db, setDb] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    let t0;
    let t1;
    if ($[1] !== dbName) {
        t0 = ({
            "useDatabase[useEffect()]": ()=>{
                let mounted = true;
                const openDb = async function openDb() {
                    ;
                    try {
                        if (!dbClient) {
                            dbClient = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$db$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DatabaseClient"]();
                        }
                        await dbClient.open(dbName);
                        if (mounted) {
                            setDb(dbClient);
                            setLoading(false);
                        }
                    } catch (t2) {
                        const err = t2;
                        console.error("useDatabase error:", err);
                        if (mounted) {
                            setError(err);
                            setLoading(false);
                        }
                    }
                };
                openDb();
                return ()=>{
                    mounted = false;
                };
            }
        })["useDatabase[useEffect()]"];
        t1 = [
            dbName
        ];
        $[1] = dbName;
        $[2] = t0;
        $[3] = t1;
    } else {
        t0 = $[2];
        t1 = $[3];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])(t0, t1);
    let t2;
    if ($[4] !== db || $[5] !== error || $[6] !== loading) {
        t2 = {
            db,
            loading,
            error
        };
        $[4] = db;
        $[5] = error;
        $[6] = loading;
        $[7] = t2;
    } else {
        t2 = $[7];
    }
    return t2;
}
_s(useDatabase, "sJGvslcC2sfUaK79CCQHQ1KUgaQ=");
function useQuery(sql, params) {
    _s1();
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const fetchData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useQuery.useCallback[fetchData]": async ()=>{
            if (!dbClient) {
                setError(new Error('Database not initialized'));
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const result = await dbClient.execute(sql, params);
                setData(result.rows);
                setError(null);
            } catch (err) {
                console.error('useQuery error:', err);
                setError(err);
            } finally{
                setLoading(false);
            }
        }
    }["useQuery.useCallback[fetchData]"], [
        sql,
        JSON.stringify(params)
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useQuery.useEffect": ()=>{
            fetchData();
        }
    }["useQuery.useEffect"], [
        fetchData
    ]);
    return {
        data,
        loading,
        error,
        refetch: fetchData
    };
}
_s1(useQuery, "3VOdwmYM+Xfn1K8AA3J0x5968ms=");
function useTransaction() {
    _s2();
    const [pending, setPending] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const execute = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useTransaction.useCallback[execute]": async (queries)=>{
            if (!dbClient) {
                throw new Error('Database not initialized');
            }
            setPending(true);
            setError(null);
            try {
                await dbClient.execute('BEGIN TRANSACTION');
                for (const query of queries){
                    await dbClient.execute(query.sql, query.params);
                }
                await dbClient.execute('COMMIT');
            } catch (err) {
                console.error('Transaction error:', err);
                try {
                    await dbClient.execute('ROLLBACK');
                } catch (rollbackErr) {
                    console.error('Rollback error:', rollbackErr);
                }
                setError(err);
                throw err;
            } finally{
                setPending(false);
            }
        }
    }["useTransaction.useCallback[execute]"], []);
    return {
        execute,
        pending,
        error
    };
}
_s2(useTransaction, "9NPdWtLa6PUmiVKChYjcCsHxNkI=");
function useExport() {
    _s3();
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const exportDb = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useExport.useCallback[exportDb]": async (filename = 'database.db')=>{
            if (!dbClient) {
                throw new Error('Database not initialized');
            }
            setLoading(true);
            setError(null);
            try {
                const blob = await dbClient.export();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error('Export error:', err);
                setError(err);
                throw err;
            } finally{
                setLoading(false);
            }
        }
    }["useExport.useCallback[exportDb]"], []);
    return {
        exportDb,
        loading,
        error
    };
}
_s3(useExport, "8pWpfdhAyMFEFGWOSSrH1f8bsUQ=");
function useImport() {
    _s4();
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [progress, setProgress] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const importDb = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useImport.useCallback[importDb]": async (file)=>{
            if (!dbClient) {
                throw new Error('Database not initialized');
            }
            setLoading(true);
            setProgress(0);
            setError(null);
            try {
                setProgress(50);
                await dbClient.import(file);
                setProgress(100);
            } catch (err) {
                console.error('Import error:', err);
                setError(err);
                throw err;
            } finally{
                setLoading(false);
            }
        }
    }["useImport.useCallback[importDb]"], []);
    return {
        importDb,
        loading,
        progress,
        error
    };
}
_s4(useImport, "Y0MDhU3LsEw8WFe6RhldKP9mtzk=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/pwa/app/hooks-test/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HooksTestPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$db$2f$hooks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/lib/db/hooks.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function HooksTestPage() {
    _s();
    const { db, loading, error } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$db$2f$hooks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDatabase"])('hooks_test.db');
    const [loadingHistory, setLoadingHistory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [useQueryData, setUseQueryData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [useQueryLoading, setUseQueryLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [useQueryError, setUseQueryError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [useQueryRefetched, setUseQueryRefetched] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [transactionSuccess, setTransactionSuccess] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [transactionRolledBack, setTransactionRolledBack] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [importSuccess, setImportSuccess] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const { execute: executeTransaction, pending: transactionPending } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$db$2f$hooks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransaction"])();
    const { exportDb } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$db$2f$hooks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useExport"])();
    const { importDb } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$db$2f$hooks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useImport"])();
    // Track loading history
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HooksTestPage.useEffect": ()=>{
            setLoadingHistory({
                "HooksTestPage.useEffect": (prev)=>[
                        ...prev,
                        loading
                    ]
            }["HooksTestPage.useEffect"]);
        }
    }["HooksTestPage.useEffect"], [
        loading
    ]);
    // Expose state to window for tests
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HooksTestPage.useEffect": ()=>{
            if ("TURBOPACK compile-time truthy", 1) {
                window.testDb = db;
                window.testLoading = loading;
                window.testError = error;
                window.loadingHistory = loadingHistory;
                window.useQueryData = useQueryData;
                window.useQueryLoading = useQueryLoading;
                window.useQueryError = useQueryError;
                window.useQueryRefetched = useQueryRefetched;
                window.transactionSuccess = transactionSuccess;
                window.transactionRolledBack = transactionRolledBack;
                window.importSuccess = importSuccess;
            }
        }
    }["HooksTestPage.useEffect"], [
        db,
        loading,
        error,
        loadingHistory,
        useQueryData,
        useQueryLoading,
        useQueryError,
        useQueryRefetched,
        transactionSuccess,
        transactionRolledBack,
        importSuccess
    ]);
    const handleTestUseQuery = async ()=>{
        if (!db) return;
        try {
            setUseQueryLoading(true);
            await db.execute('DROP TABLE IF EXISTS query_test');
            await db.execute('CREATE TABLE query_test (id INTEGER, name TEXT)');
            await db.execute('INSERT INTO query_test VALUES (?, ?)', [
                {
                    type: 'Integer',
                    value: 1
                },
                {
                    type: 'Text',
                    value: 'Test Data'
                }
            ]);
            const result = await db.execute('SELECT * FROM query_test');
            setUseQueryData(result.rows);
            setUseQueryError(null);
        } catch (err) {
            setUseQueryError(err);
        } finally{
            setUseQueryLoading(false);
        }
    };
    const handleTestUseQueryRefetch = async ()=>{
        if (!db) return;
        await handleTestUseQuery();
        setUseQueryRefetched(true);
    };
    const handleTestTransaction = async ()=>{
        try {
            await executeTransaction([
                {
                    sql: 'DROP TABLE IF EXISTS transaction_test'
                },
                {
                    sql: 'CREATE TABLE transaction_test (id INTEGER, value TEXT)'
                },
                {
                    sql: 'INSERT INTO transaction_test VALUES (?, ?)',
                    params: [
                        {
                            type: 'Integer',
                            value: 1
                        },
                        {
                            type: 'Text',
                            value: 'Transaction Data'
                        }
                    ]
                }
            ]);
            setTransactionSuccess(true);
        } catch (err_0) {
            console.error('Transaction failed:', err_0);
        }
    };
    const handleTestTransactionRollback = async ()=>{
        try {
            await executeTransaction([
                {
                    sql: 'DROP TABLE IF EXISTS rollback_test'
                },
                {
                    sql: 'CREATE TABLE rollback_test (id INTEGER)'
                },
                {
                    sql: 'INSERT INTO rollback_test VALUES (1)'
                },
                {
                    sql: 'INVALID SQL SYNTAX'
                } // This will cause rollback
            ]);
        } catch (err_1) {
            // Expected to fail
            setTransactionRolledBack(true);
        }
    };
    const handleTestExport = async ()=>{
        await exportDb('hooks_test.db');
    };
    const handleTestImport = async ()=>{
        const realFile = window.realExportFile;
        if (realFile) {
            try {
                await importDb(realFile);
                setImportSuccess(true);
            } catch (err_2) {
                console.error('Import failed:', err_2);
            }
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            padding: '20px',
            fontFamily: 'system-ui'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                children: "Hooks Test Page"
            }, void 0, false, {
                fileName: "[project]/pwa/app/hooks-test/page.tsx",
                lineNumber: 134,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                id: "status",
                children: loading ? 'Loading...' : error ? `Error: ${error.message}` : 'Database ready'
            }, void 0, false, {
                fileName: "[project]/pwa/app/hooks-test/page.tsx",
                lineNumber: 136,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginTop: '20px'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        id: "testUseQuery",
                        onClick: handleTestUseQuery,
                        disabled: !db,
                        children: "Test useQuery"
                    }, void 0, false, {
                        fileName: "[project]/pwa/app/hooks-test/page.tsx",
                        lineNumber: 143,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        id: "testUseQueryRefetch",
                        onClick: handleTestUseQueryRefetch,
                        disabled: !db,
                        children: "Test useQuery Refetch"
                    }, void 0, false, {
                        fileName: "[project]/pwa/app/hooks-test/page.tsx",
                        lineNumber: 146,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        id: "useQueryResult",
                        children: useQueryLoading ? 'Loading query...' : useQueryData ? useQueryRefetched ? 'Refetch complete' : 'useQuery complete' : ''
                    }, void 0, false, {
                        fileName: "[project]/pwa/app/hooks-test/page.tsx",
                        lineNumber: 149,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pwa/app/hooks-test/page.tsx",
                lineNumber: 140,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginTop: '20px'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        id: "testTransaction",
                        onClick: handleTestTransaction,
                        disabled: !db || transactionPending,
                        children: "Test Transaction"
                    }, void 0, false, {
                        fileName: "[project]/pwa/app/hooks-test/page.tsx",
                        lineNumber: 157,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        id: "testTransactionRollback",
                        onClick: handleTestTransactionRollback,
                        disabled: !db || transactionPending,
                        children: "Test Transaction Rollback"
                    }, void 0, false, {
                        fileName: "[project]/pwa/app/hooks-test/page.tsx",
                        lineNumber: 160,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        id: "transactionResult",
                        children: transactionSuccess ? 'Transaction complete' : transactionRolledBack ? 'Rollback successful' : ''
                    }, void 0, false, {
                        fileName: "[project]/pwa/app/hooks-test/page.tsx",
                        lineNumber: 163,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pwa/app/hooks-test/page.tsx",
                lineNumber: 154,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginTop: '20px'
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    id: "testExport",
                    onClick: handleTestExport,
                    disabled: !db,
                    children: "Test Export"
                }, void 0, false, {
                    fileName: "[project]/pwa/app/hooks-test/page.tsx",
                    lineNumber: 171,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/pwa/app/hooks-test/page.tsx",
                lineNumber: 168,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginTop: '20px'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        id: "testImport",
                        onClick: handleTestImport,
                        disabled: !db,
                        children: "Test Import"
                    }, void 0, false, {
                        fileName: "[project]/pwa/app/hooks-test/page.tsx",
                        lineNumber: 179,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        id: "importResult",
                        children: importSuccess ? 'Import complete' : ''
                    }, void 0, false, {
                        fileName: "[project]/pwa/app/hooks-test/page.tsx",
                        lineNumber: 182,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pwa/app/hooks-test/page.tsx",
                lineNumber: 176,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/pwa/app/hooks-test/page.tsx",
        lineNumber: 130,
        columnNumber: 10
    }, this);
}
_s(HooksTestPage, "pANa7uoRBlLVlor6qvu3U+yb44Y=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$db$2f$hooks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDatabase"],
        __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$db$2f$hooks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransaction"],
        __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$db$2f$hooks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useExport"],
        __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$db$2f$hooks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useImport"]
    ];
});
_c = HooksTestPage;
var _c;
__turbopack_context__.k.register(_c, "HooksTestPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/pwa/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/**
 * @license React
 * react-jsx-dev-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/pwa/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch(type){
            case REACT_FRAGMENT_TYPE:
                return "Fragment";
            case REACT_PROFILER_TYPE:
                return "Profiler";
            case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
            case REACT_SUSPENSE_TYPE:
                return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
                return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
                return "ViewTransition";
        }
        if ("object" === typeof type) switch("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof){
            case REACT_PORTAL_TYPE:
                return "Portal";
            case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
            case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                    return getComponentNameFromType(type(innerType));
                } catch (x) {}
        }
        return null;
    }
    function testStringCoercion(value) {
        return "" + value;
    }
    function checkKeyStringCoercion(value) {
        try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
        } catch (e) {
            JSCompiler_inline_result = !0;
        }
        if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
            return testStringCoercion(value);
        }
    }
    function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
        } catch (x) {
            return "<...>";
        }
    }
    function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
        return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return !1;
        }
        return void 0 !== config.key;
    }
    function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = !0;
        Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: !0
        });
    }
    function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
            enumerable: !1,
            value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null
        });
        Object.defineProperty(type, "_debugStack", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
            for(isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
        } else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
                return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
            maybeKey = {};
            for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        return ReactElement(type, children, maybeKey, getOwner(), debugStack, debugTask);
    }
    function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
    }
    function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    var React = __turbopack_context__.r("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
    };
    React = {
        react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
        }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function(type, config, maybeKey, isStaticChildren) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
        } else debugStackDEV = unknownOwnerDebugStack;
        return jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStackDEV, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
}();
}),
"[project]/pwa/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/pwa/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = __turbopack_context__.r("[project]/pwa/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)");
}
}),
"[project]/pwa/node_modules/@npiesco/absurder-sql/absurder_sql_bg.wasm (static in ecmascript)", ((__turbopack_context__) => {

__turbopack_context__.v("/_next/static/media/absurder_sql_bg.4b006aa8.wasm");}),
"[project]/pwa/node_modules/@npiesco/absurder-sql/absurder_sql.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Database",
    ()=>Database,
    "WasmColumnValue",
    ()=>WasmColumnValue,
    "default",
    ()=>__TURBOPACK__default__export__,
    "initSync",
    ()=>initSync,
    "init_logger",
    ()=>init_logger
]);
const __TURBOPACK__import$2e$meta__ = {
    get url () {
        return `file://${__turbopack_context__.P("pwa/node_modules/@npiesco/absurder-sql/absurder_sql.js")}`;
    }
};
let wasm;
let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}
let cachedTextDecoder = new TextDecoder('utf-8', {
    ignoreBOM: true,
    fatal: true
});
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', {
            ignoreBOM: true,
            fatal: true
        });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}
function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}
let WASM_VECTOR_LEN = 0;
const cachedTextEncoder = new TextEncoder();
if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function(arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}
function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }
    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;
    const mem = getUint8ArrayMemory0();
    let offset = 0;
    for(; offset < len; offset++){
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);
        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }
    WASM_VECTOR_LEN = offset;
    return ptr;
}
let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}
function isLikeNone(x) {
    return x === undefined || x === null;
}
function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++){
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}
function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}
function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}
function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}
const CLOSURE_DTORS = typeof FinalizationRegistry === 'undefined' ? {
    register: ()=>{},
    unregister: ()=>{}
} : new FinalizationRegistry((state)=>state.dtor(state.a, state.b));
function makeMutClosure(arg0, arg1, dtor, f) {
    const state = {
        a: arg0,
        b: arg1,
        cnt: 1,
        dtor
    };
    const real = (...args)=>{
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally{
            state.a = a;
            real._wbg_cb_unref();
        }
    };
    real._wbg_cb_unref = ()=>{
        if (--state.cnt === 0) {
            state.dtor(state.a, state.b);
            state.a = 0;
            CLOSURE_DTORS.unregister(state);
        }
    };
    CLOSURE_DTORS.register(real, state, state);
    return real;
}
function init_logger() {
    wasm.init_logger();
}
function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}
function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}
function wasm_bindgen__convert__closures_____invoke__h3ba5f0fbfb39f2bc(arg0, arg1, arg2) {
    wasm.wasm_bindgen__convert__closures_____invoke__h3ba5f0fbfb39f2bc(arg0, arg1, arg2);
}
function wasm_bindgen__convert__closures_____invoke__h4a40dd3e40c810c9(arg0, arg1, arg2) {
    wasm.wasm_bindgen__convert__closures_____invoke__h4a40dd3e40c810c9(arg0, arg1, arg2);
}
function wasm_bindgen__convert__closures_____invoke__h22534da7d54bf13b(arg0, arg1) {
    wasm.wasm_bindgen__convert__closures_____invoke__h22534da7d54bf13b(arg0, arg1);
}
function wasm_bindgen__convert__closures_____invoke__h0645e20ee34c432f(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen__convert__closures_____invoke__h0645e20ee34c432f(arg0, arg1, arg2, arg3);
}
const __wbindgen_enum_IdbTransactionMode = [
    "readonly",
    "readwrite",
    "versionchange",
    "readwriteflush",
    "cleanup"
];
const DatabaseFinalization = typeof FinalizationRegistry === 'undefined' ? {
    register: ()=>{},
    unregister: ()=>{}
} : new FinalizationRegistry((ptr)=>wasm.__wbg_database_free(ptr >>> 0, 1));
class Database {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Database.prototype);
        obj.__wbg_ptr = ptr;
        DatabaseFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DatabaseFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_database_free(ptr, 0);
    }
    /**
     * @param {string} name
     * @returns {Promise<Database>}
     */ static newDatabase(name) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.database_newDatabase(ptr0, len0);
        return ret;
    }
    /**
     * Get all database names stored in IndexedDB
     *
     * Returns an array of database names (sorted alphabetically)
     * @returns {Promise<any>}
     */ static getAllDatabases() {
        const ret = wasm.database_getAllDatabases();
        return ret;
    }
    /**
     * Delete a database from storage
     *
     * Removes database from both STORAGE_REGISTRY and GLOBAL_STORAGE
     * @param {string} name
     * @returns {Promise<void>}
     */ static deleteDatabase(name) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.database_deleteDatabase(ptr0, len0);
        return ret;
    }
    /**
     * @param {string} sql
     * @returns {Promise<any>}
     */ execute(sql) {
        const ptr0 = passStringToWasm0(sql, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.database_execute(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @param {string} sql
     * @param {any} params
     * @returns {Promise<any>}
     */ executeWithParams(sql, params) {
        const ptr0 = passStringToWasm0(sql, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.database_executeWithParams(this.__wbg_ptr, ptr0, len0, params);
        return ret;
    }
    /**
     * @returns {Promise<void>}
     */ close() {
        const ret = wasm.database_close(this.__wbg_ptr);
        return ret;
    }
    /**
     * Force close connection and remove from pool (for test cleanup)
     * @returns {Promise<void>}
     */ forceCloseConnection() {
        const ret = wasm.database_forceCloseConnection(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<void>}
     */ sync() {
        const ret = wasm.database_sync(this.__wbg_ptr);
        return ret;
    }
    /**
     * Allow non-leader writes (for single-tab apps or testing)
     * @param {boolean} allow
     * @returns {Promise<void>}
     */ allowNonLeaderWrites(allow) {
        const ret = wasm.database_allowNonLeaderWrites(this.__wbg_ptr, allow);
        return ret;
    }
    /**
     * Export database to SQLite .db file format
     *
     * Returns the complete database as a Uint8Array that can be downloaded
     * or saved as a standard SQLite .db file.
     *
     * # Example
     * ```javascript
     * const dbBytes = await db.exportToFile();
     * const blob = new Blob([dbBytes], { type: 'application/x-sqlite3' });
     * const url = URL.createObjectURL(blob);
     * const a = document.createElement('a');
     * a.href = url;
     * a.download = 'database.db';
     * a.click();
     * ```
     * @returns {Promise<Uint8Array>}
     */ exportToFile() {
        const ret = wasm.database_exportToFile(this.__wbg_ptr);
        return ret;
    }
    /**
     * Import SQLite database from .db file bytes
     *
     * Replaces the current database contents with the imported data.
     * This will close the current database connection and clear all existing data.
     *
     * # Arguments
     * * `file_data` - SQLite .db file as Uint8Array
     *
     * # Returns
     * * `Ok(())` - Import successful
     * * `Err(JsValue)` - Import failed (invalid file, validation error, etc.)
     *
     * # Example
     * ```javascript
     * // From file input
     * const fileInput = document.getElementById('dbFile');
     * const file = fileInput.files[0];
     * const arrayBuffer = await file.arrayBuffer();
     * const uint8Array = new Uint8Array(arrayBuffer);
     *
     * await db.importFromFile(uint8Array);
     *
     * // Database is now replaced - you may need to reopen connections
     * ```
     *
     * # Warning
     * This operation is destructive and will replace all existing database data.
     * The database connection will be closed and must be reopened after import.
     * @param {Uint8Array} file_data
     * @returns {Promise<void>}
     */ importFromFile(file_data) {
        const ret = wasm.database_importFromFile(this.__wbg_ptr, file_data);
        return ret;
    }
    /**
     * Wait for this instance to become leader - DIAGNOSTIC: DISABLED
     * @returns {Promise<void>}
     */ waitForLeadership() {
        const ret = wasm.database_waitForLeadership(this.__wbg_ptr);
        return ret;
    }
    /**
     * Request leadership (triggers re-election check)
     * @returns {Promise<void>}
     */ requestLeadership() {
        const ret = wasm.database_requestLeadership(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get leader information
     * @returns {Promise<any>}
     */ getLeaderInfo() {
        const ret = wasm.database_getLeaderInfo(this.__wbg_ptr);
        return ret;
    }
    /**
     * Queue a write operation to be executed by the leader
     *
     * Non-leader tabs can use this to request writes from the leader.
     * The write is forwarded via BroadcastChannel and executed by the leader.
     *
     * # Arguments
     * * `sql` - SQL statement to execute (must be a write operation)
     *
     * # Returns
     * Result indicating success or failure
     * @param {string} sql
     * @returns {Promise<void>}
     */ queueWrite(sql) {
        const ptr0 = passStringToWasm0(sql, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.database_queueWrite(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * Queue a write operation with a specific timeout
     *
     * # Arguments
     * * `sql` - SQL statement to execute
     * * `timeout_ms` - Timeout in milliseconds
     * @param {string} sql
     * @param {number} timeout_ms
     * @returns {Promise<void>}
     */ queueWriteWithTimeout(sql, timeout_ms) {
        const ptr0 = passStringToWasm0(sql, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.database_queueWriteWithTimeout(this.__wbg_ptr, ptr0, len0, timeout_ms);
        return ret;
    }
    /**
     * @returns {Promise<any>}
     */ isLeader() {
        const ret = wasm.database_isLeader(this.__wbg_ptr);
        return ret;
    }
    /**
     * Check if this instance is the leader (non-wasm version for internal use/tests)
     * @returns {Promise<boolean>}
     */ is_leader() {
        const ret = wasm.database_is_leader(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {Function} callback
     */ onDataChange(callback) {
        const ret = wasm.database_onDataChange(this.__wbg_ptr, callback);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Enable or disable optimistic updates mode
     * @param {boolean} enabled
     * @returns {Promise<void>}
     */ enableOptimisticUpdates(enabled) {
        const ret = wasm.database_enableOptimisticUpdates(this.__wbg_ptr, enabled);
        return ret;
    }
    /**
     * Check if optimistic mode is enabled
     * @returns {Promise<boolean>}
     */ isOptimisticMode() {
        const ret = wasm.database_isOptimisticMode(this.__wbg_ptr);
        return ret;
    }
    /**
     * Track an optimistic write
     * @param {string} sql
     * @returns {Promise<string>}
     */ trackOptimisticWrite(sql) {
        const ptr0 = passStringToWasm0(sql, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.database_trackOptimisticWrite(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * Get count of pending writes
     * @returns {Promise<number>}
     */ getPendingWritesCount() {
        const ret = wasm.database_getPendingWritesCount(this.__wbg_ptr);
        return ret;
    }
    /**
     * Clear all optimistic writes
     * @returns {Promise<void>}
     */ clearOptimisticWrites() {
        const ret = wasm.database_clearOptimisticWrites(this.__wbg_ptr);
        return ret;
    }
    /**
     * Enable or disable coordination metrics tracking
     * @param {boolean} enabled
     * @returns {Promise<void>}
     */ enableCoordinationMetrics(enabled) {
        const ret = wasm.database_enableCoordinationMetrics(this.__wbg_ptr, enabled);
        return ret;
    }
    /**
     * Check if coordination metrics tracking is enabled
     * @returns {Promise<boolean>}
     */ isCoordinationMetricsEnabled() {
        const ret = wasm.database_isCoordinationMetricsEnabled(this.__wbg_ptr);
        return ret;
    }
    /**
     * Record a leadership change
     * @param {boolean} became_leader
     * @returns {Promise<void>}
     */ recordLeadershipChange(became_leader) {
        const ret = wasm.database_recordLeadershipChange(this.__wbg_ptr, became_leader);
        return ret;
    }
    /**
     * Record a notification latency in milliseconds
     * @param {number} latency_ms
     * @returns {Promise<void>}
     */ recordNotificationLatency(latency_ms) {
        const ret = wasm.database_recordNotificationLatency(this.__wbg_ptr, latency_ms);
        return ret;
    }
    /**
     * Record a write conflict (non-leader write attempt)
     * @returns {Promise<void>}
     */ recordWriteConflict() {
        const ret = wasm.database_recordWriteConflict(this.__wbg_ptr);
        return ret;
    }
    /**
     * Record a follower refresh
     * @returns {Promise<void>}
     */ recordFollowerRefresh() {
        const ret = wasm.database_recordFollowerRefresh(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get coordination metrics as JSON string
     * @returns {Promise<string>}
     */ getCoordinationMetrics() {
        const ret = wasm.database_getCoordinationMetrics(this.__wbg_ptr);
        return ret;
    }
    /**
     * Reset all coordination metrics
     * @returns {Promise<void>}
     */ resetCoordinationMetrics() {
        const ret = wasm.database_resetCoordinationMetrics(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) Database.prototype[Symbol.dispose] = Database.prototype.free;
const WasmColumnValueFinalization = typeof FinalizationRegistry === 'undefined' ? {
    register: ()=>{},
    unregister: ()=>{}
} : new FinalizationRegistry((ptr)=>wasm.__wbg_wasmcolumnvalue_free(ptr >>> 0, 1));
class WasmColumnValue {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmColumnValue.prototype);
        obj.__wbg_ptr = ptr;
        WasmColumnValueFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmColumnValueFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmcolumnvalue_free(ptr, 0);
    }
    /**
     * @returns {WasmColumnValue}
     */ static createNull() {
        const ret = wasm.wasmcolumnvalue_createNull();
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {bigint} value
     * @returns {WasmColumnValue}
     */ static createInteger(value) {
        const ret = wasm.wasmcolumnvalue_createInteger(value);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {number} value
     * @returns {WasmColumnValue}
     */ static createReal(value) {
        const ret = wasm.wasmcolumnvalue_createReal(value);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {string} value
     * @returns {WasmColumnValue}
     */ static createText(value) {
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmcolumnvalue_createText(ptr0, len0);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {Uint8Array} value
     * @returns {WasmColumnValue}
     */ static createBlob(value) {
        const ptr0 = passArray8ToWasm0(value, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmcolumnvalue_createBlob(ptr0, len0);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {string} value
     * @returns {WasmColumnValue}
     */ static createBigInt(value) {
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmcolumnvalue_createBigInt(ptr0, len0);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {number} timestamp
     * @returns {WasmColumnValue}
     */ static createDate(timestamp) {
        const ret = wasm.wasmcolumnvalue_createDate(timestamp);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {any} value
     * @returns {WasmColumnValue}
     */ static fromJsValue(value) {
        const ret = wasm.wasmcolumnvalue_fromJsValue(value);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @returns {WasmColumnValue}
     */ static null() {
        const ret = wasm.wasmcolumnvalue_createNull();
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {number} value
     * @returns {WasmColumnValue}
     */ static integer(value) {
        const ret = wasm.wasmcolumnvalue_integer(value);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {number} value
     * @returns {WasmColumnValue}
     */ static real(value) {
        const ret = wasm.wasmcolumnvalue_createReal(value);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {string} value
     * @returns {WasmColumnValue}
     */ static text(value) {
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmcolumnvalue_createText(ptr0, len0);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {Uint8Array} value
     * @returns {WasmColumnValue}
     */ static blob(value) {
        const ptr0 = passArray8ToWasm0(value, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmcolumnvalue_blob(ptr0, len0);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {string} value
     * @returns {WasmColumnValue}
     */ static big_int(value) {
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmcolumnvalue_big_int(ptr0, len0);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {number} timestamp_ms
     * @returns {WasmColumnValue}
     */ static date(timestamp_ms) {
        const ret = wasm.wasmcolumnvalue_createDate(timestamp_ms);
        return WasmColumnValue.__wrap(ret);
    }
}
if (Symbol.dispose) WasmColumnValue.prototype[Symbol.dispose] = WasmColumnValue.prototype.free;
const EXPECTED_RESPONSE_TYPES = new Set([
    'basic',
    'cors',
    'default'
]);
async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && EXPECTED_RESPONSE_TYPES.has(module.type);
                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
                } else {
                    throw e;
                }
            }
        }
        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);
        if (instance instanceof WebAssembly.Instance) {
            return {
                instance,
                module
            };
        } else {
            return instance;
        }
    }
}
function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_Error_e83987f665cf5504 = function(arg0, arg1) {
        const ret = Error(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_Number_bb48ca12f395cd08 = function(arg0) {
        const ret = Number(arg0);
        return ret;
    };
    imports.wbg.__wbg_String_8f0eb39a4a4c2f66 = function(arg0, arg1) {
        const ret = String(arg1);
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg___wbindgen_bigint_get_as_i64_f3ebc5a755000afd = function(arg0, arg1) {
        const v = arg1;
        const ret = typeof v === 'bigint' ? v : undefined;
        getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg___wbindgen_boolean_get_6d5a1ee65bab5f68 = function(arg0) {
        const v = arg0;
        const ret = typeof v === 'boolean' ? v : undefined;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg___wbindgen_debug_string_df47ffb5e35e6763 = function(arg0, arg1) {
        const ret = debugString(arg1);
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg___wbindgen_in_bb933bd9e1b3bc0f = function(arg0, arg1) {
        const ret = arg0 in arg1;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_is_bigint_cb320707dcd35f0b = function(arg0) {
        const ret = typeof arg0 === 'bigint';
        return ret;
    };
    imports.wbg.__wbg___wbindgen_is_function_ee8a6c5833c90377 = function(arg0) {
        const ret = typeof arg0 === 'function';
        return ret;
    };
    imports.wbg.__wbg___wbindgen_is_null_5e69f72e906cc57c = function(arg0) {
        const ret = arg0 === null;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_is_object_c818261d21f283a4 = function(arg0) {
        const val = arg0;
        const ret = typeof val === 'object' && val !== null;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_is_string_fbb76cb2940daafd = function(arg0) {
        const ret = typeof arg0 === 'string';
        return ret;
    };
    imports.wbg.__wbg___wbindgen_is_undefined_2d472862bd29a478 = function(arg0) {
        const ret = arg0 === undefined;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_jsval_eq_6b13ab83478b1c50 = function(arg0, arg1) {
        const ret = arg0 === arg1;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_jsval_loose_eq_b664b38a2f582147 = function(arg0, arg1) {
        const ret = arg0 == arg1;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_number_get_a20bf9b85341449d = function(arg0, arg1) {
        const obj = arg1;
        const ret = typeof obj === 'number' ? obj : undefined;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg___wbindgen_string_get_e4f06c90489ad01b = function(arg0, arg1) {
        const obj = arg1;
        const ret = typeof obj === 'string' ? obj : undefined;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg___wbindgen_throw_b855445ff6a94295 = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg__wbg_cb_unref_2454a539ea5790d9 = function(arg0) {
        arg0._wbg_cb_unref();
    };
    imports.wbg.__wbg_bound_bcd18f6fa2e57078 = function() {
        return handleError(function(arg0, arg1) {
            const ret = IDBKeyRange.bound(arg0, arg1);
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_call_525440f72fbfc0ea = function() {
        return handleError(function(arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_call_e762c39fa8ea36bf = function() {
        return handleError(function(arg0, arg1) {
            const ret = arg0.call(arg1);
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_cancelIdleCallback_415499de61339350 = function(arg0, arg1) {
        arg0.cancelIdleCallback(arg1 >>> 0);
    };
    imports.wbg.__wbg_clearInterval_0675249bbe52da7b = function(arg0, arg1) {
        arg0.clearInterval(arg1);
    };
    imports.wbg.__wbg_close_209083eb02f34c98 = function(arg0) {
        arg0.close();
    };
    imports.wbg.__wbg_close_74386af11ef5ae35 = function(arg0) {
        arg0.close();
    };
    imports.wbg.__wbg_contains_9f431f3a4577dba6 = function(arg0, arg1, arg2) {
        const ret = arg0.contains(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_continue_a31229352363abe4 = function() {
        return handleError(function(arg0) {
            arg0.continue();
        }, arguments);
    };
    imports.wbg.__wbg_createObjectStore_7df0fb1da746f44d = function() {
        return handleError(function(arg0, arg1, arg2) {
            const ret = arg0.createObjectStore(getStringFromWasm0(arg1, arg2));
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_data_ee4306d069f24f2d = function(arg0) {
        const ret = arg0.data;
        return ret;
    };
    imports.wbg.__wbg_database_new = function(arg0) {
        const ret = Database.__wrap(arg0);
        return ret;
    };
    imports.wbg.__wbg_debug_f4b0c59db649db48 = function(arg0) {
        console.debug(arg0);
    };
    imports.wbg.__wbg_document_725ae06eb442a6db = function(arg0) {
        const ret = arg0.document;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_done_2042aa2670fb1db1 = function(arg0) {
        const ret = arg0.done;
        return ret;
    };
    imports.wbg.__wbg_entries_e171b586f8f6bdbf = function(arg0) {
        const ret = Object.entries(arg0);
        return ret;
    };
    imports.wbg.__wbg_error_a7f8fbb0523dae15 = function(arg0) {
        console.error(arg0);
    };
    imports.wbg.__wbg_eval_89be3645cf120ed3 = function() {
        return handleError(function(arg0, arg1) {
            const ret = eval(getStringFromWasm0(arg0, arg1));
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_getDate_5a70d2f6a482d99f = function(arg0) {
        const ret = arg0.getDate();
        return ret;
    };
    imports.wbg.__wbg_getDay_a150a3fd757619d1 = function(arg0) {
        const ret = arg0.getDay();
        return ret;
    };
    imports.wbg.__wbg_getFullYear_8240d5a15191feae = function(arg0) {
        const ret = arg0.getFullYear();
        return ret;
    };
    imports.wbg.__wbg_getHours_5e476e0b9ebc42d1 = function(arg0) {
        const ret = arg0.getHours();
        return ret;
    };
    imports.wbg.__wbg_getItem_89f57d6acc51a876 = function() {
        return handleError(function(arg0, arg1, arg2, arg3) {
            const ret = arg1.getItem(getStringFromWasm0(arg2, arg3));
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        }, arguments);
    };
    imports.wbg.__wbg_getMinutes_c95dfb65f1ea8f02 = function(arg0) {
        const ret = arg0.getMinutes();
        return ret;
    };
    imports.wbg.__wbg_getMonth_25c1c5a601d72773 = function(arg0) {
        const ret = arg0.getMonth();
        return ret;
    };
    imports.wbg.__wbg_getSeconds_8113bf8709718eb2 = function(arg0) {
        const ret = arg0.getSeconds();
        return ret;
    };
    imports.wbg.__wbg_getTime_14776bfb48a1bff9 = function(arg0) {
        const ret = arg0.getTime();
        return ret;
    };
    imports.wbg.__wbg_getTimezoneOffset_d391cb11d54969f8 = function(arg0) {
        const ret = arg0.getTimezoneOffset();
        return ret;
    };
    imports.wbg.__wbg_get_7bed016f185add81 = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_get_e7f29cbc382cd519 = function(arg0, arg1, arg2) {
        const ret = arg1[arg2 >>> 0];
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_efcb449f58ec27c2 = function() {
        return handleError(function(arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_get_fb1fa70beb44a754 = function() {
        return handleError(function(arg0, arg1) {
            const ret = arg0.get(arg1);
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_get_with_ref_key_1dc361bd10053bfe = function(arg0, arg1) {
        const ret = arg0[arg1];
        return ret;
    };
    imports.wbg.__wbg_info_e674a11f4f50cc0c = function(arg0) {
        console.info(arg0);
    };
    imports.wbg.__wbg_instanceof_ArrayBuffer_70beb1189ca63b38 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof ArrayBuffer;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_IdbDatabase_fcf75ffeeec3ec8c = function(arg0) {
        let result;
        try {
            result = arg0 instanceof IDBDatabase;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_IdbFactory_b39cfd3ab00cea49 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof IDBFactory;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_IdbOpenDbRequest_08e4929084e51476 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof IDBOpenDBRequest;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Map_8579b5e2ab5437c7 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Map;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Uint8Array_20c8e73002f7af98 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Uint8Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Window_4846dbb3de56c84c = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Window;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_isArray_96e0af9891d0945d = function(arg0) {
        const ret = Array.isArray(arg0);
        return ret;
    };
    imports.wbg.__wbg_isSafeInteger_d216eda7911dde36 = function(arg0) {
        const ret = Number.isSafeInteger(arg0);
        return ret;
    };
    imports.wbg.__wbg_iterator_e5822695327a3c39 = function() {
        const ret = Symbol.iterator;
        return ret;
    };
    imports.wbg.__wbg_key_d84f6472d959b974 = function() {
        return handleError(function(arg0) {
            const ret = arg0.key;
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_length_69bca3cb64fc8748 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_a95b69f903b746c4 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_cdd215e10d9dd507 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_efec72473f10bc42 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_localStorage_3034501cd2b3da3f = function() {
        return handleError(function(arg0) {
            const ret = arg0.localStorage;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments);
    };
    imports.wbg.__wbg_log_8cec76766b8c0e33 = function(arg0) {
        console.log(arg0);
    };
    imports.wbg.__wbg_new_0_f9740686d739025c = function() {
        const ret = new Date();
        return ret;
    };
    imports.wbg.__wbg_new_1acc0b6eea89d040 = function() {
        const ret = new Object();
        return ret;
    };
    imports.wbg.__wbg_new_3c3d849046688a66 = function(arg0, arg1) {
        try {
            var state0 = {
                a: arg0,
                b: arg1
            };
            var cb0 = (arg0, arg1)=>{
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h0645e20ee34c432f(a, state0.b, arg0, arg1);
                } finally{
                    state0.a = a;
                }
            };
            const ret = new Promise(cb0);
            return ret;
        } finally{
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_new_5a79be3ab53b8aa5 = function(arg0) {
        const ret = new Uint8Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_67069b49258d9f2a = function() {
        return handleError(function(arg0, arg1) {
            const ret = new BroadcastChannel(getStringFromWasm0(arg0, arg1));
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_new_93d9417ed3fb115d = function(arg0) {
        const ret = new Date(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_e17d9f43105b08be = function() {
        const ret = new Array();
        return ret;
    };
    imports.wbg.__wbg_new_from_slice_92f4d78ca282a2d2 = function(arg0, arg1) {
        const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_no_args_ee98eee5275000a4 = function(arg0, arg1) {
        const ret = new Function(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_with_length_01aa0dc35aa13543 = function(arg0) {
        const ret = new Uint8Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_year_month_day_6236812cf591750d = function(arg0, arg1, arg2) {
        const ret = new Date(arg0 >>> 0, arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_next_020810e0ae8ebcb0 = function() {
        return handleError(function(arg0) {
            const ret = arg0.next();
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_next_2c826fe5dfec6b6a = function(arg0) {
        const ret = arg0.next;
        return ret;
    };
    imports.wbg.__wbg_now_793306c526e2e3b6 = function() {
        const ret = Date.now();
        return ret;
    };
    imports.wbg.__wbg_objectStoreNames_cfcd75f76eff34e4 = function(arg0) {
        const ret = arg0.objectStoreNames;
        return ret;
    };
    imports.wbg.__wbg_objectStore_2aab1d8b165c62a6 = function() {
        return handleError(function(arg0, arg1, arg2) {
            const ret = arg0.objectStore(getStringFromWasm0(arg1, arg2));
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_openCursor_da22e71977afb7d7 = function() {
        return handleError(function(arg0, arg1) {
            const ret = arg0.openCursor(arg1);
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_open_9d8c51d122a5a6ea = function() {
        return handleError(function(arg0, arg1, arg2, arg3) {
            const ret = arg0.open(getStringFromWasm0(arg1, arg2), arg3 >>> 0);
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_parse_2a704d6b78abb2b8 = function() {
        return handleError(function(arg0, arg1) {
            const ret = JSON.parse(getStringFromWasm0(arg0, arg1));
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_postMessage_2e1248c7fe808340 = function() {
        return handleError(function(arg0, arg1) {
            arg0.postMessage(arg1);
        }, arguments);
    };
    imports.wbg.__wbg_prototypesetcall_2a6620b6922694b2 = function(arg0, arg1, arg2) {
        Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
    };
    imports.wbg.__wbg_push_df81a39d04db858c = function(arg0, arg1) {
        const ret = arg0.push(arg1);
        return ret;
    };
    imports.wbg.__wbg_put_88678dd575c85637 = function() {
        return handleError(function(arg0, arg1, arg2) {
            const ret = arg0.put(arg1, arg2);
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_queueMicrotask_34d692c25c47d05b = function(arg0) {
        const ret = arg0.queueMicrotask;
        return ret;
    };
    imports.wbg.__wbg_queueMicrotask_9d76cacb20c84d58 = function(arg0) {
        queueMicrotask(arg0);
    };
    imports.wbg.__wbg_random_babe96ffc73e60a2 = function() {
        const ret = Math.random();
        return ret;
    };
    imports.wbg.__wbg_removeEventListener_aa21ef619e743518 = function() {
        return handleError(function(arg0, arg1, arg2, arg3) {
            arg0.removeEventListener(getStringFromWasm0(arg1, arg2), arg3);
        }, arguments);
    };
    imports.wbg.__wbg_removeItem_0e1e70f1687b5304 = function() {
        return handleError(function(arg0, arg1, arg2) {
            arg0.removeItem(getStringFromWasm0(arg1, arg2));
        }, arguments);
    };
    imports.wbg.__wbg_resolve_caf97c30b83f7053 = function(arg0) {
        const ret = Promise.resolve(arg0);
        return ret;
    };
    imports.wbg.__wbg_result_25e75004b82b9830 = function() {
        return handleError(function(arg0) {
            const ret = arg0.result;
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_setInterval_6714a9bec1e91fa3 = function() {
        return handleError(function(arg0, arg1, arg2) {
            const ret = arg0.setInterval(arg1, arg2);
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_setItem_64dfb54d7b20d84c = function() {
        return handleError(function(arg0, arg1, arg2, arg3, arg4) {
            arg0.setItem(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        }, arguments);
    };
    imports.wbg.__wbg_setTimeout_780ac15e3df4c663 = function() {
        return handleError(function(arg0, arg1, arg2) {
            const ret = arg0.setTimeout(arg1, arg2);
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_set_3f1d0b984ed272ed = function(arg0, arg1, arg2) {
        arg0[arg1] = arg2;
    };
    imports.wbg.__wbg_set_9e6516df7b7d0f19 = function(arg0, arg1, arg2) {
        arg0.set(getArrayU8FromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_set_c213c871859d6500 = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_set_c2abbebe8b9ebee1 = function() {
        return handleError(function(arg0, arg1, arg2) {
            const ret = Reflect.set(arg0, arg1, arg2);
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_set_oncomplete_71dbeb19a31158ae = function(arg0, arg1) {
        arg0.oncomplete = arg1;
    };
    imports.wbg.__wbg_set_onerror_2a8ad6135dc1ec74 = function(arg0, arg1) {
        arg0.onerror = arg1;
    };
    imports.wbg.__wbg_set_onerror_dc82fea584ffccaa = function(arg0, arg1) {
        arg0.onerror = arg1;
    };
    imports.wbg.__wbg_set_onmessage_86d8d65dbed3a751 = function(arg0, arg1) {
        arg0.onmessage = arg1;
    };
    imports.wbg.__wbg_set_onsuccess_f367d002b462109e = function(arg0, arg1) {
        arg0.onsuccess = arg1;
    };
    imports.wbg.__wbg_set_onupgradeneeded_0a519a73284a1418 = function(arg0, arg1) {
        arg0.onupgradeneeded = arg1;
    };
    imports.wbg.__wbg_slice_3e7e2fc0da7cc625 = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_static_accessor_GLOBAL_89e1d9ac6a1b250e = function() {
        const ret = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : /*TURBOPACK member replacement*/ __turbopack_context__.g;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_GLOBAL_THIS_8b530f326a9e48ac = function() {
        const ret = typeof globalThis === 'undefined' ? null : globalThis;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_SELF_6fdf4b64710cc91b = function() {
        const ret = typeof self === 'undefined' ? null : self;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_WINDOW_b45bfc5a37f6cfa2 = function() {
        const ret = typeof window === 'undefined' ? null : window;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_stringify_b5fb28f6465d9c3e = function() {
        return handleError(function(arg0) {
            const ret = JSON.stringify(arg0);
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_target_1447f5d3a6fa6fe0 = function(arg0) {
        const ret = arg0.target;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_then_4f46f6544e6b4a28 = function(arg0, arg1) {
        const ret = arg0.then(arg1);
        return ret;
    };
    imports.wbg.__wbg_then_70d05cf780a18d77 = function(arg0, arg1, arg2) {
        const ret = arg0.then(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_toString_331854e6e3c16849 = function() {
        return handleError(function(arg0, arg1) {
            const ret = arg0.toString(arg1);
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_transaction_b93f1b2d9bd57727 = function() {
        return handleError(function(arg0, arg1, arg2) {
            const ret = arg0.transaction(getStringFromWasm0(arg1, arg2));
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_transaction_cd940bd89781f616 = function() {
        return handleError(function(arg0, arg1, arg2) {
            const ret = arg0.transaction(arg1, __wbindgen_enum_IdbTransactionMode[arg2]);
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_transaction_e90346abb797e13b = function() {
        return handleError(function(arg0, arg1) {
            const ret = arg0.transaction(arg1);
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_value_692627309814bb8c = function(arg0) {
        const ret = arg0.value;
        return ret;
    };
    imports.wbg.__wbg_value_bf03593c8a7b58b8 = function() {
        return handleError(function(arg0) {
            const ret = arg0.value;
            return ret;
        }, arguments);
    };
    imports.wbg.__wbg_warn_1d74dddbe2fd1dbb = function(arg0) {
        console.warn(arg0);
    };
    imports.wbg.__wbindgen_cast_2241b6af4c4b2941 = function(arg0, arg1) {
        // Cast intrinsic for `Ref(String) -> Externref`.
        const ret = getStringFromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_cast_4625c577ab2ec9ee = function(arg0) {
        // Cast intrinsic for `U64 -> Externref`.
        const ret = BigInt.asUintN(64, arg0);
        return ret;
    };
    imports.wbg.__wbindgen_cast_57a169896fc88a99 = function(arg0, arg1) {
        // Cast intrinsic for `Closure(Closure { dtor_idx: 187, function: Function { arguments: [NamedExternref("Event")], shim_idx: 188, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
        const ret = makeMutClosure(arg0, arg1, wasm.wasm_bindgen__closure__destroy__h2f37bf16a5f8f009, wasm_bindgen__convert__closures_____invoke__h4a40dd3e40c810c9);
        return ret;
    };
    imports.wbg.__wbindgen_cast_5ad24f94af76dc58 = function(arg0, arg1) {
        // Cast intrinsic for `Closure(Closure { dtor_idx: 187, function: Function { arguments: [NamedExternref("MessageEvent")], shim_idx: 188, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
        const ret = makeMutClosure(arg0, arg1, wasm.wasm_bindgen__closure__destroy__h2f37bf16a5f8f009, wasm_bindgen__convert__closures_____invoke__h4a40dd3e40c810c9);
        return ret;
    };
    imports.wbg.__wbindgen_cast_835f1eef5edca652 = function(arg0, arg1) {
        // Cast intrinsic for `Closure(Closure { dtor_idx: 875, function: Function { arguments: [Externref], shim_idx: 876, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
        const ret = makeMutClosure(arg0, arg1, wasm.wasm_bindgen__closure__destroy__hddca379abe978273, wasm_bindgen__convert__closures_____invoke__h3ba5f0fbfb39f2bc);
        return ret;
    };
    imports.wbg.__wbindgen_cast_9ae0607507abb057 = function(arg0) {
        // Cast intrinsic for `I64 -> Externref`.
        const ret = arg0;
        return ret;
    };
    imports.wbg.__wbindgen_cast_ca47f5f1baddc70e = function(arg0, arg1) {
        // Cast intrinsic for `Closure(Closure { dtor_idx: 187, function: Function { arguments: [], shim_idx: 191, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
        const ret = makeMutClosure(arg0, arg1, wasm.wasm_bindgen__closure__destroy__h2f37bf16a5f8f009, wasm_bindgen__convert__closures_____invoke__h22534da7d54bf13b);
        return ret;
    };
    imports.wbg.__wbindgen_cast_d6cd19b81560fd6e = function(arg0) {
        // Cast intrinsic for `F64 -> Externref`.
        const ret = arg0;
        return ret;
    };
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_externrefs;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
        ;
    };
    return imports;
}
function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}
function initSync(module) {
    if (wasm !== undefined) return wasm;
    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({ module } = module);
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead');
        }
    }
    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}
async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;
    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({ module_or_path } = module_or_path);
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead');
        }
    }
    if (typeof module_or_path === 'undefined') {
        module_or_path = new __turbopack_context__.U(__turbopack_context__.r("[project]/pwa/node_modules/@npiesco/absurder-sql/absurder_sql_bg.wasm (static in ecmascript)"));
    }
    const imports = __wbg_get_imports();
    if (typeof module_or_path === 'string' || typeof Request === 'function' && module_or_path instanceof Request || typeof URL === 'function' && module_or_path instanceof URL) {
        module_or_path = fetch(module_or_path);
    }
    const { instance, module } = await __wbg_load(await module_or_path, imports);
    return __wbg_finalize_init(instance, module);
}
;
const __TURBOPACK__default__export__ = __wbg_init;
}),
]);

//# sourceMappingURL=pwa_5bdf2100._.js.map