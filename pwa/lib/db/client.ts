import init, { Database, type QueryResult } from '@npiesco/absurder-sql';

export type { QueryResult };

export class DatabaseClient {
  private db: Database | null = null;
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
    } catch (error) {
      console.error('Failed to open database:', error);
      throw new Error(`Database open failed: ${error}`);
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
   * @param file - File object containing SQLite database
   */
  async import(file: File): Promise<void> {
    if (!this.db) {
      throw new Error('Database not opened. Call open() first to create initial database instance.');
    }

    try {
      const buffer = await file.arrayBuffer();
      await this.db.importFromFile(new Uint8Array(buffer));
    } catch (error) {
      console.error('Database import failed:', error);
      throw new Error(`Import failed: ${error}`);
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
      } catch (error) {
        console.error('Database close failed:', error);
        throw new Error(`Close failed: ${error}`);
      }
    }
  }

  /**
   * Get the current database instance (for advanced use)
   */
  getDatabase(): Database | null {
    return this.db;
  }
}
