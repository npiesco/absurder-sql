/**
 * AbsurderSQL High-level TypeScript API
 * Wraps UniFFI-generated bindings with a clean, ergonomic interface
 */

import * as uniffi from './generated/absurder_sql_mobile';

export interface QueryResult {
  columns: string[];
  rows: Array<Record<string, any>>;
  rowsAffected: number;
  lastInsertId: number | null;
  executionTimeMs: number;
}

export interface EncryptionConfig {
  key: string;
}

export interface DatabaseConfig {
  name: string;
  encryption?: EncryptionConfig;
  /** Cache size in pages */
  cacheSize?: number;
  /** Page size in bytes (typically 4096) */
  pageSize?: number;
  /** Journal mode: "MEMORY", "WAL", "DELETE" */
  journalMode?: string;
  /** Enable auto-vacuum to keep database compact */
  autoVacuum?: boolean;
}

export interface StreamOptions {
  batchSize?: number;
}

export interface Migration {
  version: number;
  up: string;
  down: string;
}

/**
 * Convert a JSON row string to a plain object keyed by column name
 */
function parseRowJson(rowJson: string, columns: string[]): Record<string, any> {
  const row = JSON.parse(rowJson);
  if (row.values) {
    const mapped: Record<string, any> = {};
    columns.forEach((col, i) => {
      const colValue = row.values[i];
      if (colValue) {
        // Extract value from ColumnValue: {type: "Integer", value: 123}
        mapped[col] = colValue.value !== undefined ? colValue.value : null;
      } else {
        mapped[col] = null;
      }
    });
    return mapped;
  }
  return row;
}

/**
 * Convert UniFFI QueryResult to our QueryResult interface
 */
function convertQueryResult(result: any): QueryResult {
  const rows = result.rows.map((rowJson: string) => parseRowJson(rowJson, result.columns));

  return {
    columns: result.columns,
    rows,
    rowsAffected: Number(result.rowsAffected),
    lastInsertId: result.lastInsertId !== undefined ? Number(result.lastInsertId) : null,
    executionTimeMs: result.executionTimeMs ?? 0,
  };
}

export class PreparedStatement {
  constructor(private stmtHandle: bigint) {}

  async execute(params: any[]): Promise<QueryResult> {
    const stringParams = params.map(p => String(p));
    // executeStatement now returns QueryResult (fixed in Phase 3)
    const result = uniffi.executeStatement(this.stmtHandle, stringParams);
    return convertQueryResult(result);
  }

  async finalize(): Promise<void> {
    uniffi.finalizeStatement(this.stmtHandle);
  }
}

export class AbsurderDatabase {
  private handle: bigint | null = null;
  private readonly name: string;
  private config: DatabaseConfig | string;

  constructor(config: DatabaseConfig | string) {
    this.name = typeof config === 'string' ? config : config.name;
    this.config = config;
  }

  async open(): Promise<void> {
    if (this.handle !== null) {
      throw new Error('Database is already open');
    }

    const cfg = typeof this.config === 'object' ? this.config : { name: this.config };
    const uniffiConfig = {
      name: cfg.name,
      encryptionKey: cfg.encryption?.key,
      cacheSize: cfg.cacheSize !== undefined ? BigInt(cfg.cacheSize) : undefined,
      pageSize: cfg.pageSize !== undefined ? BigInt(cfg.pageSize) : undefined,
      journalMode: cfg.journalMode,
      autoVacuum: cfg.autoVacuum,
    };

    if (cfg.encryption?.key) {
      this.handle = await uniffi.createEncryptedDatabase(uniffiConfig);
    } else {
      this.handle = await uniffi.createDatabase(uniffiConfig);
    }
  }

  async execute(sql: string): Promise<QueryResult> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }

    const result = uniffi.execute(this.handle, sql);
    return convertQueryResult(result);
  }

  async executeWithParams(sql: string, params: any[]): Promise<QueryResult> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }

    const stringParams = params.map(p => String(p));
    const result = uniffi.executeWithParams(this.handle, sql, stringParams);
    return convertQueryResult(result);
  }

  async query(sql: string): Promise<Array<Record<string, any>>> {
    const result = await this.execute(sql);
    return result.rows;
  }

  async exportToFile(path: string): Promise<void> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }

    // Use async uniffi function to avoid blocking JS thread
    await uniffi.exportDatabaseAsync(this.handle, path);
  }

  async importFromFile(path: string): Promise<void> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }
    uniffi.importDatabase(this.handle, path);
  }

  async beginTransaction(): Promise<void> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }
    uniffi.beginTransaction(this.handle);
  }

  async commit(): Promise<void> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }
    uniffi.commit(this.handle);
  }

  async rollback(): Promise<void> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }
    uniffi.rollback(this.handle);
  }

  async executeBatch(statements: string[]): Promise<void> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }
    uniffi.executeBatch(this.handle, statements);
  }

  async prepare(sql: string): Promise<PreparedStatement> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }
    const stmtHandle = uniffi.prepareStatement(this.handle, sql);
    return new PreparedStatement(stmtHandle);
  }

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

  async prepareStream(sql: string): Promise<bigint> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }
    return uniffi.prepareStream(this.handle, sql);
  }

  async fetchNext(streamHandle: bigint, batchSize: number): Promise<any[]> {
    const batch = uniffi.fetchNext(streamHandle, batchSize);
    return batch.rows.map((rowJson: string) => parseRowJson(rowJson, batch.columns));
  }

  async closeStream(streamHandle: bigint): Promise<void> {
    uniffi.closeStream(streamHandle);
  }

  async *executeStream(sql: string, options?: StreamOptions): AsyncIterable<Record<string, any>> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }

    const batchSize = options?.batchSize ?? 100;
    let streamHandle: bigint | null = null;

    try {
      streamHandle = uniffi.prepareStream(this.handle, sql);

      while (true) {
        const batch = uniffi.fetchNext(streamHandle, batchSize);

        if (batch.rows.length === 0) {
          break;
        }

        for (const rowJson of batch.rows) {
          yield parseRowJson(rowJson, batch.columns);
        }
      }
    } finally {
      if (streamHandle !== null) {
        uniffi.closeStream(streamHandle);
      }
    }
  }

  async rekey(newKey: string): Promise<void> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }
    uniffi.rekeyDatabase(this.handle, newKey);
  }

  async migrate(migrations: Migration[]): Promise<void> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }

    // Validate migrations are sorted
    for (let i = 1; i < migrations.length; i++) {
      if (migrations[i].version <= migrations[i - 1].version) {
        throw new Error('Migrations must be sorted by version');
      }
    }

    // Ensure migrations table exists
    await this.ensureMigrationsTable();

    // Get current version
    const currentVersion = await this.getDatabaseVersion();

    // Filter pending migrations
    const pending = migrations.filter(m => m.version > currentVersion);

    if (pending.length === 0) {
      return;
    }

    // Apply each migration in a transaction
    await this.transaction(async () => {
      for (const migration of pending) {
        await this.execute(migration.up);
        await this.execute(
          `INSERT INTO _migrations (version, applied_at) VALUES (${migration.version}, datetime('now'))`
        );
      }
    });
  }

  async getDatabaseVersion(): Promise<number> {
    if (this.handle === null) {
      throw new Error('Database is not open');
    }

    try {
      const result = await this.execute(
        'SELECT MAX(version) as version FROM _migrations'
      );
      return result.rows[0]?.version ?? 0;
    } catch {
      return 0;
    }
  }

  private async ensureMigrationsTable(): Promise<void> {
    await this.execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      )
    `);
  }

  async close(): Promise<void> {
    if (this.handle !== null) {
      uniffi.closeDatabase(this.handle);
      this.handle = null;
    }
  }
}

export async function openDatabase(config: DatabaseConfig | string): Promise<AbsurderDatabase> {
  const db = new AbsurderDatabase(config);
  await db.open();
  return db;
}
