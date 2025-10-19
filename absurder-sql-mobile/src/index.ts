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
    return JSON.parse(resultJson);
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

// Export types
export type { QueryResult, DatabaseConfig };

// Export default
export default {
  AbsurderDatabase,
  openDatabase,
};
