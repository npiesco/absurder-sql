/* tslint:disable */
/* eslint-disable */
export function init_logger(): void;
export interface DatabaseError {
    code: string;
    message: string;
    sql: string | null;
}

export type ColumnValue = { type: "Null" } | { type: "Integer"; value: number } | { type: "Real"; value: number } | { type: "Text"; value: string } | { type: "Blob"; value: number[] } | { type: "Date"; value: number } | { type: "BigInt"; value: string };

export interface TransactionOptions {
    isolation_level: IsolationLevel;
    timeout_ms: number | null;
}

export interface Row {
    values: ColumnValue[];
}

export interface DatabaseConfig {
    name: string;
    version: number | null;
    cache_size: number | null;
    page_size: number | null;
    auto_vacuum: boolean | null;
    journal_mode: string | null;
    max_export_size_bytes: number | null;
}

export interface QueryResult {
    columns: string[];
    rows: Row[];
    affectedRows: number;
    lastInsertId: number | null;
    executionTimeMs: number;
}

export type IsolationLevel = "ReadUncommitted" | "ReadCommitted" | "RepeatableRead" | "Serializable";

export class Database {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
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
   */
  queueWrite(sql: string): Promise<void>;
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
   */
  exportToFile(): Promise<Uint8Array>;
  isLeader(): Promise<any>;
  /**
   * Delete a database from storage
   *
   * Removes database from both STORAGE_REGISTRY and GLOBAL_STORAGE
   */
  static deleteDatabase(name: string): Promise<void>;
  /**
   * Get leader information
   */
  getLeaderInfo(): Promise<any>;
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
   */
  importFromFile(file_data: Uint8Array): Promise<void>;
  /**
   * Get all database names stored in IndexedDB
   *
   * Returns an array of database names (sorted alphabetically)
   */
  static getAllDatabases(): Promise<any>;
  /**
   * Check if optimistic mode is enabled
   */
  isOptimisticMode(): Promise<boolean>;
  /**
   * Request leadership (triggers re-election check)
   */
  requestLeadership(): Promise<void>;
  executeWithParams(sql: string, params: any): Promise<any>;
  onDataChange(callback: Function): void;
  /**
   * Wait for this instance to become leader
   */
  waitForLeadership(): Promise<void>;
  /**
   * Record a write conflict (non-leader write attempt)
   */
  recordWriteConflict(): Promise<void>;
  /**
   * Force close connection and remove from pool (for test cleanup)
   */
  forceCloseConnection(): Promise<void>;
  /**
   * Reload data from IndexedDB into memory
   * Call this when another tab has written data and you need to see the changes
   * This closes and reopens the SQLite connection to invalidate its page cache
   */
  reloadFromIndexedDB(): Promise<void>;
  /**
   * Track an optimistic write
   */
  trackOptimisticWrite(sql: string): Promise<string>;
  /**
   * Allow non-leader writes (for single-tab apps or testing)
   */
  allowNonLeaderWrites(allow: boolean): Promise<void>;
  /**
   * Clear all optimistic writes
   */
  clearOptimisticWrites(): Promise<void>;
  /**
   * Record a follower refresh
   */
  recordFollowerRefresh(): Promise<void>;
  /**
   * Get coordination metrics as JSON string
   */
  getCoordinationMetrics(): Promise<string>;
  /**
   * Get count of pending writes
   */
  getPendingWritesCount(): Promise<number>;
  /**
   * Queue a write operation with a specific timeout
   *
   * # Arguments
   * * `sql` - SQL statement to execute
   * * `timeout_ms` - Timeout in milliseconds
   */
  queueWriteWithTimeout(sql: string, timeout_ms: number): Promise<void>;
  /**
   * Record a leadership change
   */
  recordLeadershipChange(became_leader: boolean): Promise<void>;
  /**
   * Enable or disable optimistic updates mode
   */
  enableOptimisticUpdates(enabled: boolean): Promise<void>;
  /**
   * Reset all coordination metrics
   */
  resetCoordinationMetrics(): Promise<void>;
  /**
   * Enable or disable coordination metrics tracking
   */
  enableCoordinationMetrics(enabled: boolean): Promise<void>;
  /**
   * Record a notification latency in milliseconds
   */
  recordNotificationLatency(latency_ms: number): Promise<void>;
  /**
   * Check if coordination metrics tracking is enabled
   */
  isCoordinationMetricsEnabled(): Promise<boolean>;
  sync(): Promise<void>;
  close(): Promise<void>;
  execute(sql: string): Promise<any>;
  static newDatabase(name: string): Promise<Database>;
  /**
   * Check if this instance is the leader (non-wasm version for internal use/tests)
   */
  is_leader(): Promise<boolean>;
  /**
   * Test method for concurrent locking - simple increment counter
   */
  testLock(value: number): Promise<number>;
  /**
   * Get the database name
   */
  readonly name: string;
}
export class WasmColumnValue {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  static createBlob(value: Uint8Array): WasmColumnValue;
  static createDate(timestamp: number): WasmColumnValue;
  static createNull(): WasmColumnValue;
  static createReal(value: number): WasmColumnValue;
  static createText(value: string): WasmColumnValue;
  static createBigInt(value: string): WasmColumnValue;
  static fromJsValue(value: any): WasmColumnValue;
  static createInteger(value: bigint): WasmColumnValue;
  static blob(value: Uint8Array): WasmColumnValue;
  static date(timestamp_ms: number): WasmColumnValue;
  static null(): WasmColumnValue;
  static real(value: number): WasmColumnValue;
  static text(value: string): WasmColumnValue;
  static big_int(value: string): WasmColumnValue;
  static integer(value: number): WasmColumnValue;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_database_free: (a: number, b: number) => void;
  readonly __wbg_wasmcolumnvalue_free: (a: number, b: number) => void;
  readonly database_allowNonLeaderWrites: (a: number, b: number) => any;
  readonly database_clearOptimisticWrites: (a: number) => any;
  readonly database_close: (a: number) => any;
  readonly database_deleteDatabase: (a: number, b: number) => any;
  readonly database_enableCoordinationMetrics: (a: number, b: number) => any;
  readonly database_enableOptimisticUpdates: (a: number, b: number) => any;
  readonly database_execute: (a: number, b: number, c: number) => any;
  readonly database_executeWithParams: (a: number, b: number, c: number, d: any) => any;
  readonly database_exportToFile: (a: number) => any;
  readonly database_forceCloseConnection: (a: number) => any;
  readonly database_getAllDatabases: () => any;
  readonly database_getCoordinationMetrics: (a: number) => any;
  readonly database_getLeaderInfo: (a: number) => any;
  readonly database_getPendingWritesCount: (a: number) => any;
  readonly database_importFromFile: (a: number, b: any) => any;
  readonly database_isCoordinationMetricsEnabled: (a: number) => any;
  readonly database_isLeader: (a: number) => any;
  readonly database_isOptimisticMode: (a: number) => any;
  readonly database_is_leader: (a: number) => any;
  readonly database_name: (a: number) => [number, number];
  readonly database_newDatabase: (a: number, b: number) => any;
  readonly database_onDataChange: (a: number, b: any) => [number, number];
  readonly database_queueWrite: (a: number, b: number, c: number) => any;
  readonly database_queueWriteWithTimeout: (a: number, b: number, c: number, d: number) => any;
  readonly database_recordFollowerRefresh: (a: number) => any;
  readonly database_recordLeadershipChange: (a: number, b: number) => any;
  readonly database_recordNotificationLatency: (a: number, b: number) => any;
  readonly database_recordWriteConflict: (a: number) => any;
  readonly database_reloadFromIndexedDB: (a: number) => any;
  readonly database_requestLeadership: (a: number) => any;
  readonly database_resetCoordinationMetrics: (a: number) => any;
  readonly database_sync: (a: number) => any;
  readonly database_testLock: (a: number, b: number) => any;
  readonly database_trackOptimisticWrite: (a: number, b: number, c: number) => any;
  readonly database_waitForLeadership: (a: number) => any;
  readonly init_logger: () => void;
  readonly wasmcolumnvalue_big_int: (a: number, b: number) => number;
  readonly wasmcolumnvalue_blob: (a: number, b: number) => number;
  readonly wasmcolumnvalue_createBigInt: (a: number, b: number) => number;
  readonly wasmcolumnvalue_createBlob: (a: number, b: number) => number;
  readonly wasmcolumnvalue_createDate: (a: number) => number;
  readonly wasmcolumnvalue_createInteger: (a: bigint) => number;
  readonly wasmcolumnvalue_createNull: () => number;
  readonly wasmcolumnvalue_createReal: (a: number) => number;
  readonly wasmcolumnvalue_createText: (a: number, b: number) => number;
  readonly wasmcolumnvalue_fromJsValue: (a: any) => number;
  readonly wasmcolumnvalue_integer: (a: number) => number;
  readonly wasmcolumnvalue_date: (a: number) => number;
  readonly wasmcolumnvalue_text: (a: number, b: number) => number;
  readonly wasmcolumnvalue_real: (a: number) => number;
  readonly wasmcolumnvalue_null: () => number;
  readonly rust_sqlite_wasm_shim_acosh: (a: number) => number;
  readonly rust_sqlite_wasm_shim_asinh: (a: number) => number;
  readonly rust_sqlite_wasm_shim_atanh: (a: number) => number;
  readonly rust_sqlite_wasm_shim_calloc: (a: number, b: number) => number;
  readonly rust_sqlite_wasm_shim_free: (a: number) => void;
  readonly rust_sqlite_wasm_shim_localtime: (a: number) => number;
  readonly rust_sqlite_wasm_shim_malloc: (a: number) => number;
  readonly rust_sqlite_wasm_shim_memchr: (a: number, b: number, c: number) => number;
  readonly rust_sqlite_wasm_shim_realloc: (a: number, b: number) => number;
  readonly rust_sqlite_wasm_shim_sqrt: (a: number) => number;
  readonly rust_sqlite_wasm_shim_strchr: (a: number, b: number) => number;
  readonly rust_sqlite_wasm_shim_strcmp: (a: number, b: number) => number;
  readonly rust_sqlite_wasm_shim_strcspn: (a: number, b: number) => number;
  readonly rust_sqlite_wasm_shim_strncmp: (a: number, b: number, c: number) => number;
  readonly rust_sqlite_wasm_shim_strrchr: (a: number, b: number) => number;
  readonly rust_sqlite_wasm_shim_strspn: (a: number, b: number) => number;
  readonly rust_sqlite_wasm_shim_trunc: (a: number) => number;
  readonly sqlite3_os_init: () => number;
  readonly wasm_bindgen__convert__closures_____invoke__h7f337ef9eafd31ce: (a: number, b: number, c: any) => void;
  readonly wasm_bindgen__closure__destroy__hd6eb0d215b976ad9: (a: number, b: number) => void;
  readonly wasm_bindgen__convert__closures_____invoke__h6867d68f48037fa4: (a: number, b: number, c: any) => any;
  readonly wasm_bindgen__closure__destroy__h6182d69b68c5e453: (a: number, b: number) => void;
  readonly wasm_bindgen__convert__closures_____invoke__h11d242e614582409: (a: number, b: number, c: any) => void;
  readonly wasm_bindgen__convert__closures_____invoke__h6e615bff0930c4eb: (a: number, b: number) => void;
  readonly wasm_bindgen__closure__destroy__h42a040f85db23dc2: (a: number, b: number) => void;
  readonly wasm_bindgen__convert__closures_____invoke__h159594d1cf3e00ce: (a: number, b: number, c: any) => void;
  readonly wasm_bindgen__convert__closures_____invoke__h1ad58e6badc0dc17: (a: number, b: number, c: any, d: any) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
