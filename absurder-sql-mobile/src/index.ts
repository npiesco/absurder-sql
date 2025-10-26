/**
 * AbsurderSQL Mobile - React Native FFI bindings
 * 
 * Provides native SQLite database with block-level storage for iOS and Android
 */

import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package '@npiesco/absurder-sql-mobile' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const AbsurderSQLNative = NativeModules.AbsurderSQL
  ? NativeModules.AbsurderSQL
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

/**
 * Query result returned from database operations
 */
export interface QueryResult {
  columns: string[];
  rows: Array<Record<string, any>>;
  rowsAffected: number;
}

/**
 * Prepared SQL statement for repeated execution with different parameters
 * 
 * PreparedStatements eliminate SQL parsing overhead by preparing once
 * and executing multiple times with different parameters.
 * 
 * @example
 * const stmt = await db.prepare('SELECT * FROM users WHERE id = ?');
 * const user1 = await stmt.execute([1]);
 * const user2 = await stmt.execute([2]);
 * await stmt.finalize();
 */
export class PreparedStatement {
  private stmtHandle: number;

  constructor(stmtHandle: number) {
    this.stmtHandle = stmtHandle;
  }

  /**
   * Execute the prepared statement with parameters
   * 
   * @param params Array of parameters to bind to the statement
   * @returns Promise resolving to query result
   * @throws Error if execution fails or statement is finalized
   * 
   * @example
   * const stmt = await db.prepare('INSERT INTO users VALUES (?, ?)');
   * await stmt.execute([1, 'Alice']);
   * await stmt.execute([2, 'Bob']);
   */
  async execute(params: any[]): Promise<QueryResult> {
    const resultJson = await AbsurderSQLNative.stmtExecute(this.stmtHandle, params);
    if (resultJson === null || resultJson === undefined) {
      throw new Error('Native module returned null or undefined');
    }
    return JSON.parse(resultJson);
  }

  /**
   * Finalize the statement and release resources
   * 
   * After calling finalize(), the statement cannot be executed again.
   * Always call finalize() when done with a prepared statement to prevent memory leaks.
   * 
   * @returns Promise that resolves when statement is finalized
   * @throws Error if finalization fails
   * 
   * @example
   * const stmt = await db.prepare('SELECT * FROM users WHERE id = ?');
   * await stmt.execute([1]);
   * await stmt.finalize(); // Release resources
   */
  async finalize(): Promise<void> {
    await AbsurderSQLNative.stmtFinalize(this.stmtHandle);
  }
}

/**
 * Encryption configuration for database
 */
export interface EncryptionConfig {
  /**
   * Encryption key for the database
   * Minimum 8 characters required
   */
  key: string;
}

/**
 * Database configuration options
 */
export interface DatabaseConfig {
  name: string;
  version?: number;
  cacheSize?: number;
  pageSize?: number;
  autoVacuum?: boolean;
  journalMode?: 'MEMORY' | 'WAL' | 'DELETE';
  /**
   * Optional encryption configuration
   * When provided, creates an encrypted database using SQLCipher
   */
  encryption?: EncryptionConfig;
}

/**
 * Options for streaming query results
 */
export interface StreamOptions {
  /**
   * Number of rows to fetch per batch
   * @default 100
   */
  batchSize?: number;
}

/**
 * Schema migration definition
 */
export interface Migration {
  /**
   * Migration version number
   * Must be sequential and unique
   */
  version: number;
  /**
   * SQL to apply the migration (forward)
   */
  up: string;
  /**
   * SQL to rollback the migration (backward)
   */
  down: string;
}

/**
 * AbsurderSQL Database class
 * 
 * Provides a high-performance SQLite database with filesystem persistence
 */
export class AbsurderDatabase {
  private handle: number | null = null;
  private readonly name: string;
  private config: DatabaseConfig | string;

  constructor(config: DatabaseConfig | string) {
    this.name = typeof config === 'string' ? config : config.name;
    this.config = config;
  }

  /**
   * Open/create the database
   */
  async open(): Promise<void> {
    if (this.handle !== null) {
      throw new Error('Database is already open');
    }

    // Check if encryption is requested
    const encryption = typeof this.config === 'object' ? this.config.encryption : undefined;
    
    if (encryption && encryption.key) {
      // Create encrypted database
      this.handle = await AbsurderSQLNative.createEncryptedDatabase(
        this.name,
        encryption.key
      );
    } else {
      // Create regular unencrypted database
      this.handle = await AbsurderSQLNative.createDatabase(this.name);
    }
  }

  /**
   * Execute SQL query
   */
  async execute(sql: string): Promise<QueryResult> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }

    const resultJson = await AbsurderSQLNative.execute(this.handle, sql);
    if (resultJson === null || resultJson === undefined) {
      throw new Error('Native module returned null or undefined');
    }
    return JSON.parse(resultJson);
  }

  /**
   * Execute SQL query with parameters
   */
  async executeWithParams(sql: string, params: any[]): Promise<QueryResult> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }

    const resultJson = await AbsurderSQLNative.executeWithParams(
      this.handle,
      sql,
      params
    );
    if (resultJson === null || resultJson === undefined) {
      throw new Error('Native module returned null or undefined');
    }
    return JSON.parse(resultJson);
  }

  /**
   * Execute SQL query and return only the rows
   * 
   * This is a convenience method that calls execute() and returns just the rows array,
   * which is useful when you only need the data and not metadata like columns or rowsAffected.
   * 
   * @param sql SQL query to execute
   * @returns Promise resolving to array of row objects
   * @throws Error if database is not open or query fails
   * 
   * @example
   * const users = await db.query("SELECT * FROM users WHERE age > 18");
   * console.log(users); // [{ id: 1, name: 'Alice', age: 25 }, ...]
   */
  async query(sql: string): Promise<Array<Record<string, any>>> {
    const result = await this.execute(sql);
    return result.rows;
  }

  /**
   * Export database to file
   */
  async exportToFile(path: string): Promise<void> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }

    await AbsurderSQLNative.exportToFile(this.handle, path);
  }

  /**
   * Import database from file
   */
  async importFromFile(path: string): Promise<void> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }

    await AbsurderSQLNative.importFromFile(this.handle, path);
  }

  /**
   * Begin a database transaction
   * 
   * @returns Promise that resolves when transaction begins
   * @throws Error if database is not open or transaction fails
   * 
   * @example
   * await db.beginTransaction();
   * try {
   *   await db.execute("INSERT INTO users VALUES (1, 'Alice')");
   *   await db.commit();
   * } catch (err) {
   *   await db.rollback();
   *   throw err;
   * }
   */
  async beginTransaction(): Promise<void> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }

    await AbsurderSQLNative.beginTransaction(this.handle);
  }

  /**
   * Commit the current transaction
   * 
   * @returns Promise that resolves when transaction is committed
   * @throws Error if database is not open or no transaction is active
   */
  async commit(): Promise<void> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }

    await AbsurderSQLNative.commit(this.handle);
  }

  /**
   * Rollback the current transaction
   * 
   * @returns Promise that resolves when transaction is rolled back
   * @throws Error if database is not open or no transaction is active
   */
  async rollback(): Promise<void> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }

    await AbsurderSQLNative.rollback(this.handle);
  }

  /**
   * Execute multiple SQL statements as a batch
   * Reduces bridge overhead by making one call instead of N calls
   * 
   * @param statements Array of SQL statements to execute
   * @returns Promise that resolves when all statements are executed
   * @throws Error if database is not open or batch execution fails
   * 
   * @example
   * const statements = [];
   * for (let i = 0; i < 5000; i++) {
   *   statements.push(`INSERT INTO users VALUES (${i}, 'user_${i}')`);
   * }
   * await db.executeBatch(statements);
   */
  async executeBatch(statements: string[]): Promise<void> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }

    await AbsurderSQLNative.executeBatch(this.handle, statements);
  }

  /**
   * Prepare a SQL statement for repeated execution
   * 
   * Prepared statements eliminate SQL parsing overhead by preparing once
   * and executing multiple times with different parameters. This provides
   * significant performance benefits for repeated queries.
   * 
   * @param sql SQL statement to prepare (use ? for parameters)
   * @returns Promise resolving to PreparedStatement instance
   * @throws Error if database is not open or SQL is invalid
   * 
   * @example
   * // Prepare once
   * const stmt = await db.prepare('SELECT * FROM users WHERE id = ?');
   * 
   * // Execute many times with different parameters
   * for (let i = 1; i <= 100; i++) {
   *   const result = await stmt.execute([i]);
   *   console.log(result.rows);
   * }
   * 
   * // Always finalize when done
   * await stmt.finalize();
   */
  async prepare(sql: string): Promise<PreparedStatement> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }

    const stmtHandle = await AbsurderSQLNative.prepare(this.handle, sql);
    return new PreparedStatement(stmtHandle);
  }

  /**
   * Execute a function within a transaction
   * Automatically commits on success or rolls back on error
   * 
   * @param fn Function to execute within transaction
   * @returns Promise with the function's return value
   * @throws Error if database is not open or transaction fails
   * 
   * @example
   * const result = await db.transaction(async () => {
   *   await db.execute("INSERT INTO users VALUES (1, 'Alice')");
   *   await db.execute("INSERT INTO users VALUES (2, 'Bob')");
   *   return { inserted: 2 };
   * });
   */
  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }

    await this.beginTransaction();
    
    try {
      const result = await fn();
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  /**
   * Stream query results using cursor-based pagination
   * 
   * This method returns an AsyncIterator that yields rows one at a time,
   * fetching them in configurable batches to avoid loading large result sets into memory.
   * 
   * The stream automatically cleans up resources when iteration completes or breaks early.
   * 
   * @param sql SQL query to execute
   * @param options Streaming options (batch size, etc.)
   * @returns AsyncIterator that yields individual rows
   * @throws Error if database is not open or query fails
   * 
   * @example
   * // Stream all users
   * for await (const user of db.executeStream('SELECT * FROM users')) {
   *   console.log(user);
   * }
   * 
   * @example
   * // Stream with custom batch size
   * for await (const row of db.executeStream('SELECT * FROM large_table', { batchSize: 50 })) {
   *   console.log(row);
   *   if (someCondition) break; // Automatic cleanup on early break
   * }
   */
  async *executeStream(
    sql: string,
    options?: StreamOptions
  ): AsyncIterable<Record<string, any>> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }

    const batchSize = options?.batchSize ?? 100;
    let streamHandle: number | null = null;

    try {
      // Prepare streaming statement
      streamHandle = await AbsurderSQLNative.prepareStream(this.handle, sql);

      // Fetch and yield rows in batches
      while (true) {
        const batchJson = await AbsurderSQLNative.fetchNext(streamHandle, batchSize);
        const batch: Array<Record<string, any>> = JSON.parse(batchJson);

        // EOF: empty batch means no more rows
        if (batch.length === 0) {
          break;
        }

        // Yield each row individually
        for (const row of batch) {
          yield row;
        }
      }
    } finally {
      // Always cleanup, even on early break or error
      if (streamHandle !== null) {
        await AbsurderSQLNative.closeStream(streamHandle);
      }
    }
  }

  /**
   * Change the encryption key of an open encrypted database
   * 
   * This method allows you to change the encryption key of an already encrypted database.
   * The database must be open when calling this method.
   * 
   * @param newKey The new encryption key (minimum 8 characters)
   * @returns Promise that resolves when rekey operation completes
   * @throws Error if database is not open or rekey fails
   * 
   * @example
   * const db = await openDatabase({
   *   name: 'secure.db',
   *   encryption: { key: 'old-password' }
   * });
   * 
   * // Change the encryption key
   * await db.rekey('new-password-123');
   * 
   * // Database is now encrypted with new key
   * await db.close();
   */
  async rekey(newKey: string): Promise<void> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }

    await AbsurderSQLNative.rekey(this.handle, newKey);
  }

  /**
   * Apply schema migrations to the database
   * 
   * Migrations are applied in order by version number. Only pending migrations
   * (versions higher than current database version) are executed.
   * All migrations are wrapped in a transaction for atomicity.
   * 
   * @param migrations Array of migration definitions sorted by version
   * @returns Promise that resolves when all migrations are applied
   * @throws Error if database is not open, migrations are not sorted, or any migration fails
   * 
   * @example
   * const migrations = [
   *   {
   *     version: 1,
   *     up: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)',
   *     down: 'DROP TABLE users',
   *   },
   *   {
   *     version: 2,
   *     up: 'ALTER TABLE users ADD COLUMN email TEXT',
   *     down: 'ALTER TABLE users DROP COLUMN email',
   *   },
   * ];
   * 
   * await db.migrate(migrations);
   */
  async migrate(migrations: Migration[]): Promise<void> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }

    // Validate migrations are sorted by version
    for (let i = 1; i < migrations.length; i++) {
      if (migrations[i].version <= migrations[i - 1].version) {
        throw new Error('Migrations must be sorted by version');
      }
    }

    // Ensure _migrations table exists
    await this.ensureMigrationsTable();

    // Get current database version
    const currentVersion = await this.getDatabaseVersion();

    // Filter pending migrations
    const pendingMigrations = migrations.filter(m => m.version > currentVersion);

    // No migrations to apply
    if (pendingMigrations.length === 0) {
      return;
    }

    // Apply pending migrations in a transaction
    await this.beginTransaction();
    try {
      for (const migration of pendingMigrations) {
        // Apply the migration
        await this.execute(migration.up);
        
        // Record the migration in _migrations table
        await this.execute(
          `INSERT INTO _migrations (version, applied_at) VALUES (${migration.version}, datetime('now'))`
        );
      }
      await this.commit();
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  /**
   * Get the current schema version from the _migrations table
   * 
   * @returns Promise resolving to current version number (0 if no migrations applied)
   * @throws Error if database is not open
   * 
   * @example
   * const version = await db.getDatabaseVersion();
   * console.log(`Current schema version: ${version}`);
   */
  async getDatabaseVersion(): Promise<number> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }

    await this.ensureMigrationsTable();

    const result = await this.execute(
      'SELECT version FROM _migrations ORDER BY version DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      return 0;
    }

    return result.rows[0].version;
  }

  /**
   * Ensure _migrations table exists
   * @private
   */
  private async ensureMigrationsTable(): Promise<void> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }

    // Check if _migrations table exists
    const tableCheck = await this.execute(
      "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='_migrations'"
    );

    if (tableCheck.rows.length === 0 || tableCheck.rows[0].count === 0) {
      // Create _migrations table
      await this.execute(
        'CREATE TABLE IF NOT EXISTS _migrations (version INTEGER PRIMARY KEY, applied_at TEXT)'
      );
    }
  }

  /**
   * Close the database
   */
  async close(): Promise<void> {
    if (this.handle === null) {
      return;
    }

    await AbsurderSQLNative.close(this.handle);
    this.handle = null;
  }
}

/**
 * Create and open a database
 */
export async function openDatabase(
  config: DatabaseConfig | string
): Promise<AbsurderDatabase> {
  const db = new AbsurderDatabase(config);
  await db.open();
  return db;
}

// Export default
export default {
  AbsurderDatabase,
  openDatabase,
};
