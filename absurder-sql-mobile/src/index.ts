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
 * Database configuration options
 */
export interface DatabaseConfig {
  name: string;
  version?: number;
  cacheSize?: number;
  pageSize?: number;
  autoVacuum?: boolean;
  journalMode?: 'MEMORY' | 'WAL' | 'DELETE';
}

/**
 * AbsurderSQL Database class
 * 
 * Provides a high-performance SQLite database with filesystem persistence
 */
export class AbsurderDatabase {
  private handle: number | null = null;
  private readonly name: string;

  constructor(config: DatabaseConfig | string) {
    this.name = typeof config === 'string' ? config : config.name;
  }

  /**
   * Open/create the database
   */
  async open(): Promise<void> {
    if (this.handle !== null) {
      throw new Error('Database is already open');
    }

    this.handle = await AbsurderSQLNative.createDatabase(this.name);
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
