// IndexedDB service for query performance tracking

export interface QueryPerformanceRecord {
  id: string;
  sql: string; // Normalized SQL query
  executionCount: number;
  totalTime: number; // Sum of all execution times in ms
  minTime: number; // Minimum execution time in ms
  maxTime: number; // Maximum execution time in ms
  avgTime: number; // Average execution time in ms
  lastExecuted: number; // Timestamp of last execution
  createdAt: number; // Timestamp of first execution
  executions: ExecutionRecord[]; // History of individual executions
}

export interface ExecutionRecord {
  timestamp: number;
  duration: number; // in ms
}

const DB_NAME = 'absurder-sql-performance';
const DB_VERSION = 1;
const STORE_NAME = 'queries';
const SLOW_QUERY_THRESHOLD = 1000; // ms
const MAX_EXECUTION_HISTORY = 50; // Keep last 50 executions per query

class QueryPerformanceDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[QueryPerformanceDB] Error opening database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[QueryPerformanceDB] Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          objectStore.createIndex('sql', 'sql', { unique: false });
          objectStore.createIndex('avgTime', 'avgTime', { unique: false });
          objectStore.createIndex('executionCount', 'executionCount', { unique: false });
          objectStore.createIndex('lastExecuted', 'lastExecuted', { unique: false });
          console.log('[QueryPerformanceDB] Object store created');
        }
      };
    });
  }

  /**
   * Normalize SQL query by trimming whitespace and converting to lowercase
   */
  private normalizeSQL(sql: string): string {
    return sql.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  /**
   * Record a query execution
   */
  async recordExecution(sql: string, duration: number): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const normalizedSQL = this.normalizeSQL(sql);
    const executionRecord: ExecutionRecord = {
      timestamp: Date.now(),
      duration
    };

    // Try to find existing record
    const existing = await this.getPerformanceRecord(normalizedSQL);

    if (existing) {
      // Update existing record
      const executions = [...existing.executions, executionRecord].slice(-MAX_EXECUTION_HISTORY);
      const totalTime = existing.totalTime + duration;
      const executionCount = existing.executionCount + 1;
      const updated: QueryPerformanceRecord = {
        ...existing,
        executionCount,
        totalTime,
        minTime: Math.min(existing.minTime, duration),
        maxTime: Math.max(existing.maxTime, duration),
        avgTime: totalTime / executionCount,
        lastExecuted: executionRecord.timestamp,
        executions
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(updated);

        request.onsuccess = () => {
          console.log('[QueryPerformanceDB] Performance record updated:', normalizedSQL);
          resolve();
        };

        request.onerror = () => {
          console.error('[QueryPerformanceDB] Error updating record:', request.error);
          reject(request.error);
        };
      });
    } else {
      // Create new record
      const now = Date.now();
      const newRecord: QueryPerformanceRecord = {
        id: `perf-${now}-${Math.random().toString(36).substr(2, 9)}`,
        sql: normalizedSQL,
        executionCount: 1,
        totalTime: duration,
        minTime: duration,
        maxTime: duration,
        avgTime: duration,
        lastExecuted: executionRecord.timestamp,
        createdAt: now,
        executions: [executionRecord]
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(newRecord);

        request.onsuccess = () => {
          console.log('[QueryPerformanceDB] New performance record created:', normalizedSQL);
          resolve();
        };

        request.onerror = () => {
          console.error('[QueryPerformanceDB] Error creating record:', request.error);
          reject(request.error);
        };
      });
    }
  }

  /**
   * Get performance record for a specific query
   */
  private async getPerformanceRecord(normalizedSQL: string): Promise<QueryPerformanceRecord | null> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('sql');
      const request = index.get(normalizedSQL);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('[QueryPerformanceDB] Error getting record:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all performance records
   */
  async getAllRecords(): Promise<QueryPerformanceRecord[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result || [];
        // Sort by last executed descending
        records.sort((a, b) => b.lastExecuted - a.lastExecuted);
        resolve(records);
      };

      request.onerror = () => {
        console.error('[QueryPerformanceDB] Error getting all records:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get slow queries (execution time > threshold)
   */
  async getSlowQueries(threshold: number = SLOW_QUERY_THRESHOLD): Promise<QueryPerformanceRecord[]> {
    const all = await this.getAllRecords();
    return all.filter(record => record.avgTime > threshold || record.maxTime > threshold);
  }

  /**
   * Get top N slowest queries by average time
   */
  async getTopSlowQueries(limit: number = 10): Promise<QueryPerformanceRecord[]> {
    const all = await this.getAllRecords();
    return all.sort((a, b) => b.avgTime - a.avgTime).slice(0, limit);
  }

  /**
   * Get performance statistics summary
   */
  async getStats(): Promise<{
    totalQueries: number;
    totalExecutions: number;
    slowQueries: number;
    avgExecutionTime: number;
  }> {
    const all = await this.getAllRecords();
    const totalQueries = all.length;
    const totalExecutions = all.reduce((sum, r) => sum + r.executionCount, 0);
    const slowQueries = all.filter(r => r.avgTime > SLOW_QUERY_THRESHOLD).length;
    const totalTime = all.reduce((sum, r) => sum + r.totalTime, 0);
    const avgExecutionTime = totalExecutions > 0 ? totalTime / totalExecutions : 0;

    return {
      totalQueries,
      totalExecutions,
      slowQueries,
      avgExecutionTime
    };
  }

  /**
   * Clear all performance data
   */
  async clearAll(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[QueryPerformanceDB] All performance data cleared');
        resolve();
      };

      request.onerror = () => {
        console.error('[QueryPerformanceDB] Error clearing data:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Export all performance data as JSON
   */
  async exportAll(): Promise<string> {
    const records = await this.getAllRecords();
    return JSON.stringify(records, null, 2);
  }

  /**
   * Delete a specific performance record
   */
  async deleteRecord(id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('[QueryPerformanceDB] Record deleted:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('[QueryPerformanceDB] Error deleting record:', request.error);
        reject(request.error);
      };
    });
  }
}

// Singleton instance
export const queryPerformanceDB = new QueryPerformanceDB();
