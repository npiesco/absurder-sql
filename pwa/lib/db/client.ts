import init, { Database, type QueryResult } from '@npiesco/absurder-sql';

export type { QueryResult };

export class DatabaseClient {
  private db: Database | null = null;
  private dbName: string | null = null;
  private initialized: boolean = false;

  /**
   * Initialize the WASM module. This must be called before any database operations.
   * Safe to call multiple times - will only initialize once.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await init();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize WASM module:', error);
      throw new Error(`WASM initialization failed: ${error}`);
    }
  }

  /**
   * Check if WASM module is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Open a database by name. Creates a new database if it doesn't exist.
   * @param dbName - Name of the database file (e.g., 'myapp.db')
   */
  async open(dbName: string): Promise<void> {
    await this.initialize();

    if (this.db) {
      throw new Error('Database is already open. Close it first.');
    }

    try {
      this.db = await Database.newDatabase(dbName);
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
   */
  async execute(sql: string, params?: any[]): Promise<QueryResult> {
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
   */
  async export(): Promise<Blob> {
    if (!this.db) {
      throw new Error('Database not opened. Call open() first.');
    }

    try {
      const buffer = await this.db.exportToFile();
      return new Blob([buffer as BlobPart], { type: 'application/x-sqlite3' });
    } catch (error) {
      console.error('Database export failed:', error);
      throw new Error(`Export failed: ${error}`);
    }
  }

  /**
   * Import a database from a File
   * Note: This closes the current database connection and reopens it with the imported data
   * @param file - File object containing SQLite database
   */
  async import(file: File): Promise<void> {
    if (!this.db || !this.dbName) {
      throw new Error('Database not opened. Call open() first to create initial database instance.');
    }

    try {
      const buffer = await file.arrayBuffer();
      await this.db.importFromFile(new Uint8Array(buffer));
      
      // importFromFile closes the connection, must reopen with same name
      console.log(`Import complete, reopening database "${this.dbName}"...`);
      this.db = await Database.newDatabase(this.dbName);
      console.log('Database reopened after import');
    } catch (error) {
      console.error('Database import failed:', error);
      throw new Error(`Import failed: ${error}`);
    }
  }

  /**
   * Sync database to IndexedDB (flush WAL)
   * Call this after writes to ensure data is persisted
   */
  async sync(): Promise<void> {
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
   */
  async close(): Promise<void> {
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
   */
  isOpen(): boolean {
    return this.db !== null;
  }

  /**
   * Get the current database name
   */
  getDatabaseName(): string | null {
    return this.dbName;
  }

  /**
   * Export database to a Blob with specified name
   * Alias for export() method to match common naming conventions
   */
  async exportDatabase(): Promise<Blob> {
    return this.export();
  }

  /**
   * Import database from a Blob with a new database name
   * Creates a new database and imports the data
   */
  async importDatabase(dbName: string, blob: Blob): Promise<void> {
    await this.initialize();

    // Close existing database if open
    if (this.db) {
      await this.close();
    }

    try {
      // Create new database
      this.db = await Database.newDatabase(dbName);
      this.dbName = dbName;

      // Import data
      const buffer = await blob.arrayBuffer();
      await this.db.importFromFile(new Uint8Array(buffer));
      
      // importFromFile closes the connection, must reopen
      console.log(`Import complete, reopening database "${dbName}"...`);
      this.db = await Database.newDatabase(dbName);
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
   */
  async deleteDatabase(dbName: string): Promise<void> {
    await this.initialize();

    // Close if this is the current database
    if (this.dbName === dbName && this.db) {
      await this.close();
    }

    try {
      // Delete from IndexedDB directly
      const deleteRequest = indexedDB.deleteDatabase(dbName);
      
      await new Promise<void>((resolve, reject) => {
        deleteRequest.onsuccess = () => {
          console.log(`Deleted database "${dbName}"`);
          resolve();
        };
        deleteRequest.onerror = () => {
          reject(new Error(`Failed to delete database: ${deleteRequest.error}`));
        };
        deleteRequest.onblocked = () => {
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
   */
  getDatabase(): Database | null {
    return this.db;
  }

  /**
   * Check if this instance is the leader (can write to database)
   */
  async isLeader(): Promise<boolean> {
    if (!this.db) {
      throw new Error('Database not opened. Call open() first.');
    }
    return await this.db.isLeader();
  }

  /**
   * Wait for this instance to become leader
   */
  async waitForLeadership(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not opened. Call open() first.');
    }
    return await this.db.waitForLeadership();
  }

  /**
   * Request leadership (triggers re-election)
   */
  async requestLeadership(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not opened. Call open() first.');
    }
    return await this.db.requestLeadership();
  }

  /**
   * Allow non-leader writes (for single-tab apps or testing)
   */
  async allowNonLeaderWrites(allow: boolean): Promise<void> {
    if (!this.db) {
      throw new Error('Database not opened. Call open() first.');
    }
    return await this.db.allowNonLeaderWrites(allow);
  }

  /**
   * Test lock acquisition (for concurrency testing)
   * Acquires an exclusive lock and returns value + 1
   */
  async testLock(value: number): Promise<number> {
    if (!this.db) {
      throw new Error('Database not opened. Call open() first.');
    }
    return await this.db.testLock(value);
  }
}
