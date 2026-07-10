/* @ts-self-types="./absurder_sql.d.ts" */

export class Database {
    static __wrap(ptr) {
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
     * Allow non-leader writes (for single-tab apps or testing)
     * @param {boolean} allow
     * @returns {Promise<void>}
     */
    allowNonLeaderWrites(allow) {
        const ret = wasm.database_allowNonLeaderWrites(this.__wbg_ptr, allow);
        return ret;
    }
    /**
     * Clear all optimistic writes
     * @returns {Promise<void>}
     */
    clearOptimisticWrites() {
        const ret = wasm.database_clearOptimisticWrites(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<void>}
     */
    close() {
        const ret = wasm.database_close(this.__wbg_ptr);
        return ret;
    }
    /**
     * Delete a database from storage
     *
     * Removes database from both STORAGE_REGISTRY and GLOBAL_STORAGE
     * @param {string} name
     * @returns {Promise<void>}
     */
    static deleteDatabase(name) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.database_deleteDatabase(ptr0, len0);
        return ret;
    }
    /**
     * Enable or disable coordination metrics tracking
     * @param {boolean} enabled
     * @returns {Promise<void>}
     */
    enableCoordinationMetrics(enabled) {
        const ret = wasm.database_enableCoordinationMetrics(this.__wbg_ptr, enabled);
        return ret;
    }
    /**
     * Enable or disable optimistic updates mode
     * @param {boolean} enabled
     * @returns {Promise<void>}
     */
    enableOptimisticUpdates(enabled) {
        const ret = wasm.database_enableOptimisticUpdates(this.__wbg_ptr, enabled);
        return ret;
    }
    /**
     * @param {string} sql
     * @returns {Promise<any>}
     */
    execute(sql) {
        const ptr0 = passStringToWasm0(sql, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.database_execute(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @param {string} sql
     * @param {any} params
     * @returns {Promise<any>}
     */
    executeWithParams(sql, params) {
        const ptr0 = passStringToWasm0(sql, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.database_executeWithParams(this.__wbg_ptr, ptr0, len0, params);
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
     */
    exportToFile() {
        const ret = wasm.database_exportToFile(this.__wbg_ptr);
        return ret;
    }
    /**
     * Force close connection and remove from pool (for test cleanup)
     * @returns {Promise<void>}
     */
    forceCloseConnection() {
        const ret = wasm.database_forceCloseConnection(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get all database names stored in IndexedDB
     *
     * Returns an array of database names (sorted alphabetically)
     * @returns {Promise<any>}
     */
    static getAllDatabases() {
        const ret = wasm.database_getAllDatabases();
        return ret;
    }
    /**
     * Get coordination metrics as JSON string
     * @returns {Promise<string>}
     */
    getCoordinationMetrics() {
        const ret = wasm.database_getCoordinationMetrics(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get leader information
     * @returns {Promise<any>}
     */
    getLeaderInfo() {
        const ret = wasm.database_getLeaderInfo(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get count of pending writes
     * @returns {Promise<number>}
     */
    getPendingWritesCount() {
        const ret = wasm.database_getPendingWritesCount(this.__wbg_ptr);
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
     * // Database is immediately usable after import (no reopen needed)
     * const result = await db.execute('SELECT * FROM imported_table');
     * ```
     *
     * # Warning
     * This operation is destructive and will replace all existing database data.
     * @param {Uint8Array} file_data
     * @returns {Promise<void>}
     */
    importFromFile(file_data) {
        const ret = wasm.database_importFromFile(this.__wbg_ptr, file_data);
        return ret;
    }
    /**
     * Check if coordination metrics tracking is enabled
     * @returns {Promise<boolean>}
     */
    isCoordinationMetricsEnabled() {
        const ret = wasm.database_isCoordinationMetricsEnabled(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<any>}
     */
    isLeader() {
        const ret = wasm.database_isLeader(this.__wbg_ptr);
        return ret;
    }
    /**
     * Check if optimistic mode is enabled
     * @returns {Promise<boolean>}
     */
    isOptimisticMode() {
        const ret = wasm.database_isOptimisticMode(this.__wbg_ptr);
        return ret;
    }
    /**
     * Check if this instance is the leader (non-wasm version for internal use/tests)
     * @returns {Promise<boolean>}
     */
    is_leader() {
        const ret = wasm.database_is_leader(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get the database name
     * @returns {string}
     */
    get name() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.database_name(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} name
     * @returns {Promise<Database>}
     */
    static newDatabase(name) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.database_newDatabase(ptr0, len0);
        return ret;
    }
    /**
     * @param {Function} callback
     */
    onDataChange(callback) {
        const ret = wasm.database_onDataChange(this.__wbg_ptr, callback);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
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
     */
    queueWrite(sql) {
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
     */
    queueWriteWithTimeout(sql, timeout_ms) {
        const ptr0 = passStringToWasm0(sql, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.database_queueWriteWithTimeout(this.__wbg_ptr, ptr0, len0, timeout_ms);
        return ret;
    }
    /**
     * Record a follower refresh
     * @returns {Promise<void>}
     */
    recordFollowerRefresh() {
        const ret = wasm.database_recordFollowerRefresh(this.__wbg_ptr);
        return ret;
    }
    /**
     * Record a leadership change
     * @param {boolean} became_leader
     * @returns {Promise<void>}
     */
    recordLeadershipChange(became_leader) {
        const ret = wasm.database_recordLeadershipChange(this.__wbg_ptr, became_leader);
        return ret;
    }
    /**
     * Record a notification latency in milliseconds
     * @param {number} latency_ms
     * @returns {Promise<void>}
     */
    recordNotificationLatency(latency_ms) {
        const ret = wasm.database_recordNotificationLatency(this.__wbg_ptr, latency_ms);
        return ret;
    }
    /**
     * Record a write conflict (non-leader write attempt)
     * @returns {Promise<void>}
     */
    recordWriteConflict() {
        const ret = wasm.database_recordWriteConflict(this.__wbg_ptr);
        return ret;
    }
    /**
     * Reload data from IndexedDB into memory
     * Call this when another tab has written data and you need to see the changes
     * This closes and reopens the SQLite connection to invalidate its page cache
     * @returns {Promise<void>}
     */
    reloadFromIndexedDB() {
        const ret = wasm.database_reloadFromIndexedDB(this.__wbg_ptr);
        return ret;
    }
    /**
     * Request leadership (triggers re-election check)
     * @returns {Promise<void>}
     */
    requestLeadership() {
        const ret = wasm.database_requestLeadership(this.__wbg_ptr);
        return ret;
    }
    /**
     * Reset all coordination metrics
     * @returns {Promise<void>}
     */
    resetCoordinationMetrics() {
        const ret = wasm.database_resetCoordinationMetrics(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<void>}
     */
    sync() {
        const ret = wasm.database_sync(this.__wbg_ptr);
        return ret;
    }
    /**
     * Test method for concurrent locking - simple increment counter
     * @param {number} value
     * @returns {Promise<number>}
     */
    testLock(value) {
        const ret = wasm.database_testLock(this.__wbg_ptr, value);
        return ret;
    }
    /**
     * Track an optimistic write
     * @param {string} sql
     * @returns {Promise<string>}
     */
    trackOptimisticWrite(sql) {
        const ptr0 = passStringToWasm0(sql, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.database_trackOptimisticWrite(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * Wait for this instance to become leader
     * @returns {Promise<void>}
     */
    waitForLeadership() {
        const ret = wasm.database_waitForLeadership(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) Database.prototype[Symbol.dispose] = Database.prototype.free;

export class WasmColumnValue {
    static __wrap(ptr) {
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
     * @param {string} value
     * @returns {WasmColumnValue}
     */
    static big_int(value) {
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmcolumnvalue_big_int(ptr0, len0);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {Uint8Array} value
     * @returns {WasmColumnValue}
     */
    static blob(value) {
        const ptr0 = passArray8ToWasm0(value, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmcolumnvalue_blob(ptr0, len0);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {string} value
     * @returns {WasmColumnValue}
     */
    static createBigInt(value) {
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmcolumnvalue_createBigInt(ptr0, len0);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {Uint8Array} value
     * @returns {WasmColumnValue}
     */
    static createBlob(value) {
        const ptr0 = passArray8ToWasm0(value, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmcolumnvalue_createBlob(ptr0, len0);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {number} timestamp
     * @returns {WasmColumnValue}
     */
    static createDate(timestamp) {
        const ret = wasm.wasmcolumnvalue_createDate(timestamp);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {bigint} value
     * @returns {WasmColumnValue}
     */
    static createInteger(value) {
        const ret = wasm.wasmcolumnvalue_createInteger(value);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @returns {WasmColumnValue}
     */
    static createNull() {
        const ret = wasm.wasmcolumnvalue_createNull();
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {number} value
     * @returns {WasmColumnValue}
     */
    static createReal(value) {
        const ret = wasm.wasmcolumnvalue_createReal(value);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {string} value
     * @returns {WasmColumnValue}
     */
    static createText(value) {
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmcolumnvalue_createText(ptr0, len0);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {number} timestamp_ms
     * @returns {WasmColumnValue}
     */
    static date(timestamp_ms) {
        const ret = wasm.wasmcolumnvalue_date(timestamp_ms);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {any} value
     * @returns {WasmColumnValue}
     */
    static fromJsValue(value) {
        const ret = wasm.wasmcolumnvalue_fromJsValue(value);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {number} value
     * @returns {WasmColumnValue}
     */
    static integer(value) {
        const ret = wasm.wasmcolumnvalue_integer(value);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @returns {WasmColumnValue}
     */
    static null() {
        const ret = wasm.wasmcolumnvalue_null();
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {number} value
     * @returns {WasmColumnValue}
     */
    static real(value) {
        const ret = wasm.wasmcolumnvalue_real(value);
        return WasmColumnValue.__wrap(ret);
    }
    /**
     * @param {string} value
     * @returns {WasmColumnValue}
     */
    static text(value) {
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmcolumnvalue_text(ptr0, len0);
        return WasmColumnValue.__wrap(ret);
    }
}
if (Symbol.dispose) WasmColumnValue.prototype[Symbol.dispose] = WasmColumnValue.prototype.free;

export function init_logger() {
    wasm.init_logger();
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_Error_92b29b0548f8b746: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_Number_9a4e0ecb0fa16705: function(arg0) {
            const ret = Number(arg0);
            return ret;
        },
        __wbg_String_8564e559799eccda: function(arg0, arg1) {
            const ret = String(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_bigint_get_as_i64_d968e41184ae354f: function(arg0, arg1) {
            const v = arg1;
            const ret = typeof(v) === 'bigint' ? v : undefined;
            getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_boolean_get_fa956cfa2d1bd751: function(arg0) {
            const v = arg0;
            const ret = typeof(v) === 'boolean' ? v : undefined;
            return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
        },
        __wbg___wbindgen_debug_string_c25d447a39f5578f: function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_in_aca499c5de7ff5e5: function(arg0, arg1) {
            const ret = arg0 in arg1;
            return ret;
        },
        __wbg___wbindgen_is_bigint_2f76dc55065b4273: function(arg0) {
            const ret = typeof(arg0) === 'bigint';
            return ret;
        },
        __wbg___wbindgen_is_function_1ff95bcc5517c252: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_null_ea9085d691f535d3: function(arg0) {
            const ret = arg0 === null;
            return ret;
        },
        __wbg___wbindgen_is_object_a27215656b807791: function(arg0) {
            const val = arg0;
            const ret = typeof(val) === 'object' && val !== null;
            return ret;
        },
        __wbg___wbindgen_is_string_ea5e6cc2e4141dfe: function(arg0) {
            const ret = typeof(arg0) === 'string';
            return ret;
        },
        __wbg___wbindgen_is_undefined_c05833b95a3cf397: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_jsval_eq_e659fcf7b0e32763: function(arg0, arg1) {
            const ret = arg0 === arg1;
            return ret;
        },
        __wbg___wbindgen_jsval_loose_eq_db4c3b15f63fc170: function(arg0, arg1) {
            const ret = arg0 == arg1;
            return ret;
        },
        __wbg___wbindgen_number_get_394265ed1e1b84ee: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'number' ? obj : undefined;
            getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_string_get_b0ca35b86a603356: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_344f42d3211c4765: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg__wbg_cb_unref_fffb441def202758: function(arg0) {
            arg0._wbg_cb_unref();
        },
        __wbg_bound_0382866a50c2df81: function() { return handleError(function (arg0, arg1) {
            const ret = IDBKeyRange.bound(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_call_8a2dd23819f8a60a: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.call(arg1);
            return ret;
        }, arguments); },
        __wbg_call_a6e5c5dce5018821: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_cancelIdleCallback_b9e469156370a1e5: function(arg0, arg1) {
            arg0.cancelIdleCallback(arg1 >>> 0);
        },
        __wbg_catch_c1a60df4c30d76d3: function(arg0, arg1) {
            const ret = arg0.catch(arg1);
            return ret;
        },
        __wbg_clearInterval_2e2069e95ad09d4f: function(arg0, arg1) {
            arg0.clearInterval(arg1);
        },
        __wbg_close_463f5a813b1d0317: function(arg0) {
            arg0.close();
        },
        __wbg_close_4c3686e8e8c6d353: function(arg0) {
            arg0.close();
        },
        __wbg_contains_72b3d3ec2e94729e: function(arg0, arg1, arg2) {
            const ret = arg0.contains(getStringFromWasm0(arg1, arg2));
            return ret;
        },
        __wbg_continue_97ad9c8cd4cf7f86: function() { return handleError(function (arg0) {
            arg0.continue();
        }, arguments); },
        __wbg_createObjectStore_ff668af6e79f0433: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.createObjectStore(getStringFromWasm0(arg1, arg2));
            return ret;
        }, arguments); },
        __wbg_data_328de4280640da92: function(arg0) {
            const ret = arg0.data;
            return ret;
        },
        __wbg_database_new: function(arg0) {
            const ret = Database.__wrap(arg0);
            return ret;
        },
        __wbg_debug_87fd9b1a625b7efb: function(arg0) {
            console.debug(arg0);
        },
        __wbg_deleteDatabase_bc48a4a52aa773e4: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.deleteDatabase(getStringFromWasm0(arg1, arg2));
            return ret;
        }, arguments); },
        __wbg_delete_e7e50168de5ef96e: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.delete(arg1);
            return ret;
        }, arguments); },
        __wbg_delete_fe65145d652e46c8: function() { return handleError(function (arg0) {
            const ret = arg0.delete();
            return ret;
        }, arguments); },
        __wbg_document_179650d6cb13c263: function(arg0) {
            const ret = arg0.document;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_done_89b2b13e91a60321: function(arg0) {
            const ret = arg0.done;
            return ret;
        },
        __wbg_entries_015dc610cd81ede0: function(arg0) {
            const ret = Object.entries(arg0);
            return ret;
        },
        __wbg_error_744744ff0c9861e6: function(arg0) {
            console.error(arg0);
        },
        __wbg_getDate_a1a40c1c5f40fe3b: function(arg0) {
            const ret = arg0.getDate();
            return ret;
        },
        __wbg_getDay_aa318cce5da74c49: function(arg0) {
            const ret = arg0.getDay();
            return ret;
        },
        __wbg_getFullYear_6af8b229792ae254: function(arg0) {
            const ret = arg0.getFullYear();
            return ret;
        },
        __wbg_getHours_9f6561095682ce51: function(arg0) {
            const ret = arg0.getHours();
            return ret;
        },
        __wbg_getItem_b96269ddc16cf24a: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            const ret = arg1.getItem(getStringFromWasm0(arg2, arg3));
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        }, arguments); },
        __wbg_getMinutes_b0d5cd90bf9b8f22: function(arg0) {
            const ret = arg0.getMinutes();
            return ret;
        },
        __wbg_getMonth_fffe29d654d5eb69: function(arg0) {
            const ret = arg0.getMonth();
            return ret;
        },
        __wbg_getSeconds_40c565b3a6cb05fe: function(arg0) {
            const ret = arg0.getSeconds();
            return ret;
        },
        __wbg_getTime_d6f070c088c9b5ed: function(arg0) {
            const ret = arg0.getTime();
            return ret;
        },
        __wbg_getTimezoneOffset_dc9862c79e5a81a3: function(arg0) {
            const ret = arg0.getTimezoneOffset();
            return ret;
        },
        __wbg_get_4771b0fab98477d2: function(arg0, arg1, arg2) {
            const ret = arg1[arg2 >>> 0];
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_get_507a50627bffa49b: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        },
        __wbg_get_78f252d074a84d0b: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_get_c7eb1f358a7654df: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_get_cefddcaffca4fbb7: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.get(arg1);
            return ret;
        }, arguments); },
        __wbg_get_unchecked_6e0ad6d2a41b06f6: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        },
        __wbg_get_with_ref_key_6412cf3094599694: function(arg0, arg1) {
            const ret = arg0[arg1];
            return ret;
        },
        __wbg_info_eadbe775a8e2e9eb: function(arg0) {
            console.info(arg0);
        },
        __wbg_instanceof_ArrayBuffer_4480b9e0068a8adb: function(arg0) {
            let result;
            try {
                result = arg0 instanceof ArrayBuffer;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_IdbDatabase_1cc734ba1b040dd7: function(arg0) {
            let result;
            try {
                result = arg0 instanceof IDBDatabase;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_IdbFactory_85ccbbe95ef25434: function(arg0) {
            let result;
            try {
                result = arg0 instanceof IDBFactory;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_IdbOpenDbRequest_c34a5f3bfadf1d88: function(arg0) {
            let result;
            try {
                result = arg0 instanceof IDBOpenDBRequest;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Map_e5b5e3db98422fcc: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Map;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Uint8Array_309b927aaf7a3fc7: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Uint8Array;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Window_05ba1ee4f6781663: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Window;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_isArray_0677c962b281d01a: function(arg0) {
            const ret = Array.isArray(arg0);
            return ret;
        },
        __wbg_isSafeInteger_04f36e4056f1b851: function(arg0) {
            const ret = Number.isSafeInteger(arg0);
            return ret;
        },
        __wbg_iterator_6f722e4a93058b71: function() {
            const ret = Symbol.iterator;
            return ret;
        },
        __wbg_key_b74c6cd401e5906b: function() { return handleError(function (arg0) {
            const ret = arg0.key;
            return ret;
        }, arguments); },
        __wbg_length_02c64e687322fa34: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_length_1f0964f4a5e2c6d8: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_length_370319915dc99107: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_length_e01fceeaca9c95fd: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_localStorage_5bf6ce3f8e51412a: function() { return handleError(function (arg0) {
            const ret = arg0.localStorage;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_log_d267660666346fb3: function(arg0) {
            console.log(arg0);
        },
        __wbg_navigator_99621db14b3f1099: function(arg0) {
            const ret = arg0.navigator;
            return ret;
        },
        __wbg_new_0_3da9e97f24fc69be: function() {
            const ret = new Date();
            return ret;
        },
        __wbg_new_245322ac8cd2a4ae: function() { return handleError(function (arg0, arg1) {
            const ret = new BroadcastChannel(getStringFromWasm0(arg0, arg1));
            return ret;
        }, arguments); },
        __wbg_new_32b398fb48b6d94a: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_new_aec3e25493d729fe: function(arg0, arg1) {
            try {
                var state0 = {a: arg0, b: arg1};
                var cb0 = (arg0, arg1) => {
                    const a = state0.a;
                    state0.a = 0;
                    try {
                        return wasm_bindgen_4a6891ba067a060a___convert__closures_____invoke___js_sys_a35f79cb92043d9c___Function_fn_wasm_bindgen_4a6891ba067a060a___JsValue_____wasm_bindgen_4a6891ba067a060a___sys__Undefined___js_sys_a35f79cb92043d9c___Function_fn_wasm_bindgen_4a6891ba067a060a___JsValue_____wasm_bindgen_4a6891ba067a060a___sys__Undefined_______true_(a, state0.b, arg0, arg1);
                    } finally {
                        state0.a = a;
                    }
                };
                const ret = new Promise(cb0);
                return ret;
            } finally {
                state0.a = 0;
            }
        },
        __wbg_new_cc984128914cfc6f: function(arg0) {
            const ret = new Date(arg0);
            return ret;
        },
        __wbg_new_cd45aabdf6073e84: function(arg0) {
            const ret = new Uint8Array(arg0);
            return ret;
        },
        __wbg_new_da52cf8fe3429cb2: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_new_from_slice_77cdfb7977362f3c: function(arg0, arg1) {
            const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_typed_1824d93f294193e5: function(arg0, arg1) {
            try {
                var state0 = {a: arg0, b: arg1};
                var cb0 = (arg0, arg1) => {
                    const a = state0.a;
                    state0.a = 0;
                    try {
                        return wasm_bindgen_4a6891ba067a060a___convert__closures_____invoke___js_sys_a35f79cb92043d9c___Function_fn_wasm_bindgen_4a6891ba067a060a___JsValue_____wasm_bindgen_4a6891ba067a060a___sys__Undefined___js_sys_a35f79cb92043d9c___Function_fn_wasm_bindgen_4a6891ba067a060a___JsValue_____wasm_bindgen_4a6891ba067a060a___sys__Undefined_______true_(a, state0.b, arg0, arg1);
                    } finally {
                        state0.a = a;
                    }
                };
                const ret = new Promise(cb0);
                return ret;
            } finally {
                state0.a = 0;
            }
        },
        __wbg_new_with_length_e6785c33c8e4cce8: function(arg0) {
            const ret = new Uint8Array(arg0 >>> 0);
            return ret;
        },
        __wbg_new_with_year_month_day_f2354b74b4b2a4f3: function(arg0, arg1, arg2) {
            const ret = new Date(arg0 >>> 0, arg1, arg2);
            return ret;
        },
        __wbg_next_6dbf2c0ac8cde20f: function(arg0) {
            const ret = arg0.next;
            return ret;
        },
        __wbg_next_71f2aa1cb3d1e37e: function() { return handleError(function (arg0) {
            const ret = arg0.next();
            return ret;
        }, arguments); },
        __wbg_now_86c0d4ba3fa605b8: function() {
            const ret = Date.now();
            return ret;
        },
        __wbg_objectStoreNames_146ab25540bff6db: function(arg0) {
            const ret = arg0.objectStoreNames;
            return ret;
        },
        __wbg_objectStore_d5f47956b6c741e3: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.objectStore(getStringFromWasm0(arg1, arg2));
            return ret;
        }, arguments); },
        __wbg_openCursor_04059a89749928f3: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.openCursor(arg1);
            return ret;
        }, arguments); },
        __wbg_open_72e5234a49d5f85d: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            const ret = arg0.open(getStringFromWasm0(arg1, arg2), arg3 >>> 0);
            return ret;
        }, arguments); },
        __wbg_parse_1c0d8a8656d7e016: function() { return handleError(function (arg0, arg1) {
            const ret = JSON.parse(getStringFromWasm0(arg0, arg1));
            return ret;
        }, arguments); },
        __wbg_postMessage_dd820b768b365613: function() { return handleError(function (arg0, arg1) {
            arg0.postMessage(arg1);
        }, arguments); },
        __wbg_prototypesetcall_4770620bbe4688a0: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        },
        __wbg_push_d2ae3af0c1217ae6: function(arg0, arg1) {
            const ret = arg0.push(arg1);
            return ret;
        },
        __wbg_put_a368805e3dcab3a7: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.put(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_queueMicrotask_0ab5b2d2393e99b9: function(arg0) {
            const ret = arg0.queueMicrotask;
            return ret;
        },
        __wbg_queueMicrotask_6a09b7bc46549209: function(arg0) {
            queueMicrotask(arg0);
        },
        __wbg_random_039a7d5d06e0d333: function() {
            const ret = Math.random();
            return ret;
        },
        __wbg_removeEventListener_a3f23c70077bdcc1: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            arg0.removeEventListener(getStringFromWasm0(arg1, arg2), arg3);
        }, arguments); },
        __wbg_removeItem_78e03a38da96e0ae: function() { return handleError(function (arg0, arg1, arg2) {
            arg0.removeItem(getStringFromWasm0(arg1, arg2));
        }, arguments); },
        __wbg_request_218ac9398c76c73b: function(arg0, arg1, arg2, arg3, arg4) {
            const ret = arg0.request(getStringFromWasm0(arg1, arg2), arg3, arg4);
            return ret;
        },
        __wbg_resolve_2191a4dfe481c25b: function(arg0) {
            const ret = Promise.resolve(arg0);
            return ret;
        },
        __wbg_result_2b1294a2bf8dc773: function() { return handleError(function (arg0) {
            const ret = arg0.result;
            return ret;
        }, arguments); },
        __wbg_setInterval_93ec7461c3650c76: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.setInterval(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_setItem_364a11cf21db9039: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.setItem(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_setTimeout_cfa2cf195c3738db: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.setTimeout(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_set_4d7dd76f3dae2926: function(arg0, arg1, arg2) {
            arg0.set(getArrayU8FromWasm0(arg1, arg2));
        },
        __wbg_set_6be42768c690e380: function(arg0, arg1, arg2) {
            arg0[arg1] = arg2;
        },
        __wbg_set_8535240470bf2500: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = Reflect.set(arg0, arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_set_8a16b38e4805b298: function(arg0, arg1, arg2) {
            arg0[arg1 >>> 0] = arg2;
        },
        __wbg_set_oncomplete_e6abb66d0ad42731: function(arg0, arg1) {
            arg0.oncomplete = arg1;
        },
        __wbg_set_onerror_3488a474171ed56d: function(arg0, arg1) {
            arg0.onerror = arg1;
        },
        __wbg_set_onerror_f8d31be44335c633: function(arg0, arg1) {
            arg0.onerror = arg1;
        },
        __wbg_set_onmessage_7fa6f7ccf8ee2d7a: function(arg0, arg1) {
            arg0.onmessage = arg1;
        },
        __wbg_set_onsuccess_cd0c3642a2873e66: function(arg0, arg1) {
            arg0.onsuccess = arg1;
        },
        __wbg_set_onupgradeneeded_7b2cf4ba1c57e655: function(arg0, arg1) {
            arg0.onupgradeneeded = arg1;
        },
        __wbg_slice_50189eefc9ab9fe9: function(arg0, arg1, arg2) {
            const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
            return ret;
        },
        __wbg_static_accessor_GLOBAL_4ef717fb391d88b7: function() {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_GLOBAL_THIS_8d1badc68b5a74f4: function() {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_SELF_146583524fe1469b: function() {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_WINDOW_f2829a2234d7819e: function() {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_stringify_b54333f60f1e4dad: function() { return handleError(function (arg0) {
            const ret = JSON.stringify(arg0);
            return ret;
        }, arguments); },
        __wbg_target_e759594a8d965ed7: function(arg0) {
            const ret = arg0.target;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_then_16d107c451e9905d: function(arg0, arg1, arg2) {
            const ret = arg0.then(arg1, arg2);
            return ret;
        },
        __wbg_then_6ec10ae38b3e92f7: function(arg0, arg1) {
            const ret = arg0.then(arg1);
            return ret;
        },
        __wbg_toString_693a6de9f92aacb6: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.toString(arg1);
            return ret;
        }, arguments); },
        __wbg_transaction_25acf9ee4108bc2f: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.transaction(arg1);
            return ret;
        }, arguments); },
        __wbg_transaction_a00de84491e23887: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.transaction(getStringFromWasm0(arg1, arg2));
            return ret;
        }, arguments); },
        __wbg_transaction_f212158274461f32: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.transaction(arg1, __wbindgen_enum_IdbTransactionMode[arg2]);
            return ret;
        }, arguments); },
        __wbg_value_361064aa58a53344: function() { return handleError(function (arg0) {
            const ret = arg0.value;
            return ret;
        }, arguments); },
        __wbg_value_a5d5488a9589444a: function(arg0) {
            const ret = arg0.value;
            return ret;
        },
        __wbg_warn_b1370d804fa3e259: function(arg0) {
            console.warn(arg0);
        },
        __wbindgen_cast_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [Externref], shim_idx: 408, ret: NamedExternref("Promise<any>"), inner_ret: Some(NamedExternref("Promise<any>")) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen_4a6891ba067a060a___convert__closures_____invoke___wasm_bindgen_4a6891ba067a060a___JsValue__js_sys_a35f79cb92043d9c___Promise__true_);
            return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [Externref], shim_idx: 410, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen_4a6891ba067a060a___convert__closures_____invoke___wasm_bindgen_4a6891ba067a060a___JsValue______true_);
            return ret;
        },
        __wbindgen_cast_0000000000000003: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [Externref], shim_idx: 977, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen_4a6891ba067a060a___convert__closures_____invoke___wasm_bindgen_4a6891ba067a060a___JsValue__core_7d5f0a2ba6a62c33___result__Result_____wasm_bindgen_4a6891ba067a060a___JsError___true_);
            return ret;
        },
        __wbindgen_cast_0000000000000004: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [NamedExternref("Event")], shim_idx: 306, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen_4a6891ba067a060a___convert__closures_____invoke___web_sys_912ccd4ee1bace81___features__gen_MessageEvent__MessageEvent______true_);
            return ret;
        },
        __wbindgen_cast_0000000000000005: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [NamedExternref("MessageEvent")], shim_idx: 306, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen_4a6891ba067a060a___convert__closures_____invoke___web_sys_912ccd4ee1bace81___features__gen_MessageEvent__MessageEvent______true__4);
            return ret;
        },
        __wbindgen_cast_0000000000000006: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [], shim_idx: 309, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen_4a6891ba067a060a___convert__closures_____invoke_______true_);
            return ret;
        },
        __wbindgen_cast_0000000000000007: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000008: function(arg0) {
            // Cast intrinsic for `I64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000009: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_000000000000000a: function(arg0) {
            // Cast intrinsic for `U64 -> Externref`.
            const ret = BigInt.asUintN(64, arg0);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./absurder_sql_bg.js": import0,
    };
}

function wasm_bindgen_4a6891ba067a060a___convert__closures_____invoke_______true_(arg0, arg1) {
    wasm.wasm_bindgen_4a6891ba067a060a___convert__closures_____invoke_______true_(arg0, arg1);
}

function wasm_bindgen_4a6891ba067a060a___convert__closures_____invoke___wasm_bindgen_4a6891ba067a060a___JsValue______true_(arg0, arg1, arg2) {
    wasm.wasm_bindgen_4a6891ba067a060a___convert__closures_____invoke___wasm_bindgen_4a6891ba067a060a___JsValue______true_(arg0, arg1, arg2);
}

function wasm_bindgen_4a6891ba067a060a___convert__closures_____invoke___web_sys_912ccd4ee1bace81___features__gen_MessageEvent__MessageEvent______true_(arg0, arg1, arg2) {
    wasm.wasm_bindgen_4a6891ba067a060a___convert__closures_____invoke___web_sys_912ccd4ee1bace81___features__gen_MessageEvent__MessageEvent______true_(arg0, arg1, arg2);
}

function wasm_bindgen_4a6891ba067a060a___convert__closures_____invoke___web_sys_912ccd4ee1bace81___features__gen_MessageEvent__MessageEvent______true__4(arg0, arg1, arg2) {
    wasm.wasm_bindgen_4a6891ba067a060a___convert__closures_____invoke___web_sys_912ccd4ee1bace81___features__gen_MessageEvent__MessageEvent______true__4(arg0, arg1, arg2);
}

function wasm_bindgen_4a6891ba067a060a___convert__closures_____invoke___wasm_bindgen_4a6891ba067a060a___JsValue__js_sys_a35f79cb92043d9c___Promise__true_(arg0, arg1, arg2) {
    const ret = wasm.wasm_bindgen_4a6891ba067a060a___convert__closures_____invoke___wasm_bindgen_4a6891ba067a060a___JsValue__js_sys_a35f79cb92043d9c___Promise__true_(arg0, arg1, arg2);
    return ret;
}

function wasm_bindgen_4a6891ba067a060a___convert__closures_____invoke___wasm_bindgen_4a6891ba067a060a___JsValue__core_7d5f0a2ba6a62c33___result__Result_____wasm_bindgen_4a6891ba067a060a___JsError___true_(arg0, arg1, arg2) {
    const ret = wasm.wasm_bindgen_4a6891ba067a060a___convert__closures_____invoke___wasm_bindgen_4a6891ba067a060a___JsValue__core_7d5f0a2ba6a62c33___result__Result_____wasm_bindgen_4a6891ba067a060a___JsError___true_(arg0, arg1, arg2);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

function wasm_bindgen_4a6891ba067a060a___convert__closures_____invoke___js_sys_a35f79cb92043d9c___Function_fn_wasm_bindgen_4a6891ba067a060a___JsValue_____wasm_bindgen_4a6891ba067a060a___sys__Undefined___js_sys_a35f79cb92043d9c___Function_fn_wasm_bindgen_4a6891ba067a060a___JsValue_____wasm_bindgen_4a6891ba067a060a___sys__Undefined_______true_(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen_4a6891ba067a060a___convert__closures_____invoke___js_sys_a35f79cb92043d9c___Function_fn_wasm_bindgen_4a6891ba067a060a___JsValue_____wasm_bindgen_4a6891ba067a060a___sys__Undefined___js_sys_a35f79cb92043d9c___Function_fn_wasm_bindgen_4a6891ba067a060a___JsValue_____wasm_bindgen_4a6891ba067a060a___sys__Undefined_______true_(arg0, arg1, arg2, arg3);
}


const __wbindgen_enum_IdbTransactionMode = ["readonly", "readwrite", "versionchange", "readwriteflush", "cleanup"];
const DatabaseFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_database_free(ptr, 1));
const WasmColumnValueFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmcolumnvalue_free(ptr, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => wasm.__wbindgen_destroy_closure(state.a, state.b));

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
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
        for(let i = 1; i < length; i++) {
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

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function makeMutClosure(arg0, arg1, f) {
    const state = { a: arg0, b: arg1, cnt: 1 };
    const real = (...args) => {

        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            state.a = a;
            real._wbg_cb_unref();
        }
    };
    real._wbg_cb_unref = () => {
        if (--state.cnt === 0) {
            wasm.__wbindgen_destroy_closure(state.a, state.b);
            state.a = 0;
            CLOSURE_DTORS.unregister(state);
        }
    };
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
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

    for (; offset < len; offset++) {
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

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
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


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('absurder_sql_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
