/**
 * MultiTabDatabase Wrapper
 * 
 * A high-level wrapper around absurder-sql Database that handles
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
 * import init from './pkg/absurder_sql.js';
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
    this.activeOperations = 0;
    this.closePromise = null;
    this.isClosing = false;
    this.isClosed = false;
    this.ignoreNotificationsUntil = 0;
  }

  /**
   * Initialize the database
   * @returns {Promise<void>}
   */
  async init() {
    // Create database instance
    this.db = await this.Database.newDatabase(this.dbName);
    this.closePromise = null;
    this.isClosing = false;
    this.isClosed = false;

    const activeDb = this.db;

    this.db.onDataChange(async (changeType) => {
      if (!this._isActiveDb(activeDb)) {
        return;
      }

      if (Date.now() < this.ignoreNotificationsUntil) {
        return;
      }

      console.log(`[MultiTabDatabase] Data change received: ${changeType}`);
      // Always reload from IndexedDB when receiving a data change notification
      // This ensures we see data written by other tabs, regardless of our leader status
      // (Leadership can change between when data was written and when we receive the notification)
      try {
        console.log(`[MultiTabDatabase] Reloading from IndexedDB...`);
        await this._withTrackedDb(async (db) => {
          if (db !== activeDb || !this._isActiveDb(activeDb)) {
            return;
          }

          await db.reloadFromIndexedDB();
        });

        if (!this._isActiveDb(activeDb)) {
          return;
        }

        console.log(`[MultiTabDatabase] Reloaded from IndexedDB`);
      } catch (error) {
        if (this._isActiveDb(activeDb)) {
          console.error(`[MultiTabDatabase] Failed to reload from IndexedDB:`, error);
        }
      }

      if (!this._isActiveDb(activeDb)) {
        return;
      }

      this._triggerRefreshCallbacks();
    });

    // Set up beforeunload handler to clean up leader election
    this.beforeUnloadHandler = async () => {
      console.log('[MultiTabDatabase] Page unloading, cleaning up leader election');
      try {
        await this.close();
      } catch (error) {
        console.error('[MultiTabDatabase] Error during cleanup:', error);
      }
    };
    window.addEventListener('beforeunload', this.beforeUnloadHandler);

    // Start auto-sync if configured
    if (this.syncIntervalMs > 0) {
      this.syncIntervalId = setInterval(async () => {
        try {
          await this.sync();
        } catch (error) {
          console.error('[MultiTabDatabase] Auto-sync error:', error);
        }
      }, this.syncIntervalMs);
    }
    
    console.log(`[MultiTabDatabase] Initialized database: ${this.dbName}`);
  }

  async isLeader() {
    return await this._withTrackedDb((db) => db.isLeader(), false);
  }

  /**
   * Wait for this tab to become leader
   * @param {number} timeoutMs - Timeout in milliseconds (default: 5000)
   * @returns {Promise<void>}
   */
  async waitForLeadership(timeoutMs = 5000) {
    return await this._withTrackedDb((db) => db.waitForLeadership(timeoutMs));
  }

  /**
   * Request leadership (trigger re-election)
   * @returns {Promise<void>}
   */
  async requestLeadership() {
    return await this._withTrackedDb((db) => db.requestLeadership());
  }

  /**
   * Get leader information
   * @returns {Promise<{isLeader: boolean, leaderId: string, leaseExpiry: number}>}
   */
  async getLeaderInfo() {
    return await this._withTrackedDb(
      (db) => db.getLeaderInfo(),
      () => ({ isLeader: false, leaderId: null, leaseExpiry: 0 })
    );
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
    return await this._withTrackedDb(async (db) => {
      const isLeader = await db.isLeader();

      if (!isLeader) {
        if (this.waitForLeadership) {
          console.log('[MultiTabDatabase] Not leader, waiting for leadership...');
          await db.waitForLeadership();
        } else {
          throw new Error(
            'Cannot write: This tab is not the leader. ' +
            'Use db.waitForLeadership() or db.requestLeadership() to become leader, ' +
            'or set waitForLeadership: true in options.'
          );
        }
      }

      const result = params.length > 0
        ? await db.executeWithParams(sql, params)
        : await db.execute(sql);

      if (this.autoSync) {
        this.ignoreNotificationsUntil = Date.now() + 500;
        await db.sync();
      }

      console.log('[MultiTabDatabase] Write completed and synced');

      return result;
    }, () => ({ rows: [], affected_rows: 0 }));
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
    return await this._withTrackedDb((db) => {
      if (params.length > 0) {
        return db.executeWithParams(sql, params);
      }

      return db.execute(sql);
    }, () => ({ rows: [], affected_rows: 0 }));
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
    return await this._withTrackedDb((db) => {
      this.ignoreNotificationsUntil = Date.now() + 500;
      return db.sync();
    });
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
    if (this.closePromise) {
      return await this.closePromise;
    }

    this.isClosing = true;

    // Stop auto-sync interval
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }

    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }

    const activeDb = this.db;

    this.closePromise = (async () => {
      await this._waitForIdle();

      if (activeDb && this.db === activeDb) {
        await activeDb.close();
        this.db = null;
      }

      this.refreshCallbacks = [];
      this.isClosed = true;

      console.log(`[MultiTabDatabase] Closed database: ${this.dbName}`);
    })();

    return await this.closePromise;
  }

  // ========== Optimistic Updates ==========

  /**
   * Enable or disable optimistic updates mode
   * @param {boolean} enabled - Whether to enable optimistic updates
   * @returns {Promise<void>}
   */
  async enableOptimisticUpdates(enabled) {
    return await this._withTrackedDb((db) => db.enableOptimisticUpdates(enabled));
  }

  /**
   * Check if optimistic mode is enabled
   * @returns {Promise<boolean>}
   */
  async isOptimisticMode() {
    return await this._withTrackedDb((db) => db.isOptimisticMode(), false);
  }

  /**
   * Track an optimistic write
   * @param {string} sql - SQL statement
   * @returns {Promise<string>} Write ID
   */
  async trackOptimisticWrite(sql) {
    return await this._withTrackedDb((db) => db.trackOptimisticWrite(sql), '');
  }

  /**
   * Get count of pending writes
   * @returns {Promise<number>}
   */
  async getPendingWritesCount() {
    return await this._withTrackedDb((db) => db.getPendingWritesCount(), 0);
  }

  /**
   * Clear all optimistic writes
   * @returns {Promise<void>}
   */
  async clearOptimisticWrites() {
    return await this._withTrackedDb((db) => db.clearOptimisticWrites());
  }

  // ========== Coordination Metrics ==========

  /**
   * Enable or disable coordination metrics tracking
   * @param {boolean} enabled - Whether to enable metrics tracking
   * @returns {Promise<void>}
   */
  async enableCoordinationMetrics(enabled) {
    return await this._withTrackedDb((db) => db.enableCoordinationMetrics(enabled));
  }

  /**
   * Check if coordination metrics tracking is enabled
   * @returns {Promise<boolean>}
   */
  async isCoordinationMetricsEnabled() {
    return await this._withTrackedDb((db) => db.isCoordinationMetricsEnabled(), false);
  }

  /**
   * Record a leadership change
   * @param {boolean} becameLeader - Whether this tab became leader
   * @returns {Promise<void>}
   */
  async recordLeadershipChange(becameLeader) {
    return await this._withTrackedDb((db) => db.recordLeadershipChange(becameLeader));
  }

  /**
   * Record notification latency in milliseconds
   * @param {number} latencyMs - Latency in milliseconds
   * @returns {Promise<void>}
   */
  async recordNotificationLatency(latencyMs) {
    return await this._withTrackedDb((db) => db.recordNotificationLatency(latencyMs));
  }

  /**
   * Record a write conflict (non-leader write attempt)
   * @returns {Promise<void>}
   */
  async recordWriteConflict() {
    return await this._withTrackedDb((db) => db.recordWriteConflict());
  }

  /**
   * Record a follower refresh
   * @returns {Promise<void>}
   */
  async recordFollowerRefresh() {
    return await this._withTrackedDb((db) => db.recordFollowerRefresh());
  }

  /**
   * Get coordination metrics as JSON string
   * @returns {Promise<string>} JSON string of metrics
   */
  async getCoordinationMetrics() {
    return await this._withTrackedDb((db) => db.getCoordinationMetrics(), '{}');
  }

  /**
   * Reset all coordination metrics
   * @returns {Promise<void>}
   */
  async resetCoordinationMetrics() {
    return await this._withTrackedDb((db) => db.resetCoordinationMetrics());
  }

  async _withTrackedDb(operation, fallbackValue) {
    const activeDb = this.db;

    if (!activeDb) {
      return this._resolveFallback(fallbackValue);
    }

    this.activeOperations += 1;

    try {
      return await operation(activeDb);
    } finally {
      this.activeOperations = Math.max(0, this.activeOperations - 1);
    }
  }

  async _waitForIdle() {
    while (true) {
      if (this.activeOperations !== 0) {
        await new Promise((resolve) => setTimeout(resolve, 1));
        continue;
      }

      await new Promise((resolve) => setTimeout(resolve, 0));
      if (this.activeOperations === 0) {
        return;
      }
    }
  }

  _isActiveDb(activeDb = this.db) {
    return Boolean(activeDb) && this.db === activeDb && !this.isClosing && !this.isClosed;
  }

  _resolveFallback(fallbackValue) {
    if (typeof fallbackValue === 'function') {
      return fallbackValue();
    }

    return fallbackValue;
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
