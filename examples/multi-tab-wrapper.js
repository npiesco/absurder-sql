/**
 * MultiTabDatabase Wrapper
 * 
 * A high-level wrapper around sqlite-indexeddb-rs Database that handles
 * multi-tab coordination automatically.
 * 
 * Features:
 * - Automatic leader election coordination
 * - Auto-sync after writes
 * - BroadcastChannel notifications to other tabs
 * - Callback API for data change events
 * - Error handling with clear messages
 * 
 * @example
 * import init from './pkg/sqlite_indexeddb_rs.js';
 * import { MultiTabDatabase } from './multi-tab-wrapper.js';
 * 
 * await init();
 * const db = new MultiTabDatabase('myapp.db');
 * await db.init();
 * 
 * // Write data (only leader can write)
 * await db.write('INSERT INTO users (name) VALUES (?)', ['Alice']);
 * 
 * // Listen for changes from other tabs
 * db.onRefresh(async () => {
 *   console.log('Data changed in another tab, refresh UI');
 *   const users = await db.query('SELECT * FROM users');
 *   updateUI(users);
 * });
 */

export class MultiTabDatabase {
  /**
   * Create a new MultiTabDatabase instance
   * @param {Object} Database - The Database class from pkg
   * @param {string} dbName - Name of the database
   * @param {Object} options - Configuration options
   * @param {boolean} options.autoSync - Auto-sync after writes (default: true)
   * @param {boolean} options.waitForLeadership - Wait for leadership before writes (default: false)
   * @param {number} options.syncIntervalMs - Auto-sync interval in ms (default: 0 = no auto-sync)
   */
  constructor(Database, dbName, options = {}) {
    this.Database = Database;
    this.dbName = dbName;
    this.db = null;
    this.refreshCallbacks = [];
    this.autoSync = options.autoSync !== false;
    this.waitForLeadership = options.waitForLeadership || false;
    this.syncIntervalMs = options.syncIntervalMs || 0;
    this.syncIntervalId = null;
  }

  /**
   * Initialize the database
   * @returns {Promise<void>}
   */
  async init() {
    // Create database instance
    this.db = await this.Database.newDatabase(this.dbName);

    this.db.onDataChange((changeType) => {
      console.log(`[MultiTabDatabase] Data change received: ${changeType}`);
      this._triggerRefreshCallbacks();
    });

    // Set up beforeunload handler to clean up leader election
    this.beforeUnloadHandler = async () => {
      console.log('[MultiTabDatabase] Page unloading, cleaning up leader election');
      try {
        await this.db.close();
      } catch (error) {
        console.error('[MultiTabDatabase] Error during cleanup:', error);
      }
    };
    window.addEventListener('beforeunload', this.beforeUnloadHandler);

    // Start auto-sync if configured
    if (this.syncIntervalMs > 0) {
      this.syncIntervalId = setInterval(async () => {
        try {
          await this.db.sync();
        } catch (error) {
          console.error('[MultiTabDatabase] Auto-sync error:', error);
        }
      }, this.syncIntervalMs);
    }
    
    console.log(`[MultiTabDatabase] Initialized database: ${this.dbName}`);
  }

  async isLeader() {
    return await this.db.isLeader();
  }

  /**
   * Wait for this tab to become leader
   * @param {number} timeoutMs - Timeout in milliseconds (default: 5000)
   * @returns {Promise<void>}
   */
  async waitForLeadership(timeoutMs = 5000) {
    return await this.db.waitForLeadership();
  }

  /**
   * Request leadership (trigger re-election)
   * @returns {Promise<void>}
   */
  async requestLeadership() {
    return await this.db.requestLeadership();
  }

  /**
   * Get leader information
   * @returns {Promise<{isLeader: boolean, leaderId: string, leaseExpiry: number}>}
   */
  async getLeaderInfo() {
    return await this.db.getLeaderInfo();
  }

  /**
   * Execute a write operation (INSERT, UPDATE, DELETE)
   * Only the leader can write. Automatically syncs after write if autoSync is enabled.
   * 
   * @param {string} sql - SQL statement
   * @param {Array} params - Optional parameters for prepared statement
   * @returns {Promise<Object>} Query result
   * @throws {Error} If not leader or write fails
   */
  async write(sql, params = []) {
    // Check if we're the leader
    const isLeader = await this.isLeader();
    
    if (!isLeader) {
      if (this.waitForLeadership) {
        console.log('[MultiTabDatabase] Not leader, waiting for leadership...');
        await this.waitForLeadership();
      } else {
        throw new Error(
          'Cannot write: This tab is not the leader. ' +
          'Use db.waitForLeadership() or db.requestLeadership() to become leader, ' +
          'or set waitForLeadership: true in options.'
        );
      }
    }

    // Execute the write
    let result;
    if (params.length > 0) {
      result = await this.db.executeWithParams(sql, params);
    } else {
      result = await this.db.execute(sql);
    }

    // Auto-sync after write
    if (this.autoSync) {
      await this.db.sync();
    }

    console.log('[MultiTabDatabase] Write completed and synced');

    return result;
  }

  /**
   * Execute a read query (SELECT)
   * Any tab can read.
   * 
   * @param {string} sql - SQL query
   * @param {Array} params - Optional parameters for prepared statement
   * @returns {Promise<Object>} Query result with rows
   */
  async query(sql, params = []) {
    if (params.length > 0) {
      return await this.db.executeWithParams(sql, params);
    } else {
      return await this.db.execute(sql);
    }
  }

  /**
   * Execute any SQL statement (DDL, DML, or DQL)
   * For writes, uses write() method. For reads, executes directly.
   * 
   * @param {string} sql - SQL statement
   * @param {Array} params - Optional parameters
   * @returns {Promise<Object>} Query result
   */
  async execute(sql, params = []) {
    const isWriteOp = this._isWriteOperation(sql);
    
    if (isWriteOp) {
      return await this.write(sql, params);
    } else {
      return await this.query(sql, params);
    }
  }

  /**
   * Manually sync the database to IndexedDB
   * @returns {Promise<void>}
   */
  async sync() {
    return await this.db.sync();
  }

  /**
   * Register a callback to be called when data changes in another tab
   * @param {Function} callback - Callback function to invoke on data change
   */
  onRefresh(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    this.refreshCallbacks.push(callback);
  }

  /**
   * Remove a refresh callback
   * @param {Function} callback - Callback to remove
   */
  offRefresh(callback) {
    const index = this.refreshCallbacks.indexOf(callback);
    if (index > -1) {
      this.refreshCallbacks.splice(index, 1);
    }
  }

  /**
   * Close the database and clean up resources
   * @returns {Promise<void>}
   */
  async close() {
    // Stop auto-sync interval
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }

    // Close database
    if (this.db) {
      await this.db.close();
      this.db = null;
    }

    // Clear callbacks
    this.refreshCallbacks = [];

    console.log(`[MultiTabDatabase] Closed database: ${this.dbName}`);
  }

  /**
   * Check if SQL statement is a write operation
   * @private
   */
  _isWriteOperation(sql) {
    const upper = sql.trim().toUpperCase();
    return (
      upper.startsWith('INSERT') ||
      upper.startsWith('UPDATE') ||
      upper.startsWith('DELETE') ||
      upper.startsWith('REPLACE')
    );
  }

  /**
   * Trigger all registered refresh callbacks
   * @private
   */
  _triggerRefreshCallbacks() {
    for (const callback of this.refreshCallbacks) {
      try {
        callback();
      } catch (err) {
        console.error('[MultiTabDatabase] Error in refresh callback:', err);
      }
    }
  }
}

export default MultiTabDatabase;
