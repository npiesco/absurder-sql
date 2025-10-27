/**
 * Unit tests for Schema Migrations
 * Tests the migration framework with version tracking and rollback support
 */

// Mock the React Native NativeModules
const mockCreateDatabase = jest.fn();
const mockExecute = jest.fn();
const mockExecuteWithParams = jest.fn();
const mockBeginTransaction = jest.fn();
const mockCommit = jest.fn();
const mockRollback = jest.fn();
const mockClose = jest.fn();

jest.mock('react-native', () => ({
  NativeModules: {
    AbsurderSQL: {
      createDatabase: mockCreateDatabase,
      execute: mockExecute,
      executeWithParams: mockExecuteWithParams,
      beginTransaction: mockBeginTransaction,
      commit: mockCommit,
      rollback: mockRollback,
      close: mockClose,
    },
  },
  Platform: {
    select: jest.fn((obj: any) => obj.ios || obj.default),
  },
}));

import { AbsurderDatabase, Migration } from '../main';

describe('Schema Migrations', () => {
  let db: AbsurderDatabase;

  beforeEach(() => {
    jest.clearAllMocks();
    db = new AbsurderDatabase('test_migrations.db');
  });

  describe('Migration Interface', () => {
    it('should accept valid migration objects', () => {
      const migration: Migration = {
        version: 1,
        up: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)',
        down: 'DROP TABLE users',
      };
      
      expect(migration.version).toBe(1);
      expect(migration.up).toBeTruthy();
      expect(migration.down).toBeTruthy();
    });
  });

  describe('migrate()', () => {
    it('should create _migrations table on first run', async () => {
      mockCreateDatabase.mockResolvedValue(1);
      // migrate() calls ensureMigrationsTable():
      //   1. Check if _migrations table exists (count: 0)
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: ['count'],
        rows: [{ count: 0 }],
        rowsAffected: 0,
      }));
      //   2. Create _migrations table
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: [],
        rows: [],
        rowsAffected: 0,
      }));
      // migrate() calls getDatabaseVersion() which calls ensureMigrationsTable():
      //   3. Check if _migrations table exists (count: 1 now)
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: ['count'],
        rows: [{ count: 1 }],
        rowsAffected: 0,
      }));
      //   4. Get current version (empty)
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: ['version'],
        rows: [],
        rowsAffected: 0,
      }));
      mockBeginTransaction.mockResolvedValue(undefined);
      mockCommit.mockResolvedValue(undefined);

      await db.open();
      await db.migrate([]);

      // Check that _migrations table was created
      expect(mockExecute).toHaveBeenCalledWith(
        1,
        expect.stringContaining('CREATE TABLE IF NOT EXISTS _migrations')
      );
    });

    it('should apply pending migrations in order', async () => {
      mockCreateDatabase.mockResolvedValue(1);
      // migrate() calls ensureMigrationsTable():
      //   1. Check if _migrations table exists
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: ['count'],
        rows: [{ count: 1 }],
        rowsAffected: 0,
      }));
      // migrate() calls getDatabaseVersion() which calls ensureMigrationsTable():
      //   2. Check if _migrations table exists
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: ['count'],
        rows: [{ count: 1 }],
        rowsAffected: 0,
      }));
      //   3. Get current version (none)
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: ['version'],
        rows: [],
        rowsAffected: 0,
      }));
      mockBeginTransaction.mockResolvedValue(undefined);
      // Apply migration 1 up
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: [],
        rows: [],
        rowsAffected: 0,
      }));
      // Record migration 1
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: [],
        rows: [],
        rowsAffected: 1,
      }));
      // Apply migration 2 up
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: [],
        rows: [],
        rowsAffected: 0,
      }));
      // Record migration 2
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: [],
        rows: [],
        rowsAffected: 1,
      }));
      mockCommit.mockResolvedValue(undefined);

      const migrations: Migration[] = [
        {
          version: 1,
          up: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)',
          down: 'DROP TABLE users',
        },
        {
          version: 2,
          up: 'ALTER TABLE users ADD COLUMN email TEXT',
          down: 'ALTER TABLE users DROP COLUMN email',
        },
      ];

      await db.open();
      await db.migrate(migrations);

      // Verify migrations were applied in order
      expect(mockExecute).toHaveBeenCalledWith(1, migrations[0].up);
      expect(mockExecute).toHaveBeenCalledWith(1, migrations[1].up);
      expect(mockCommit).toHaveBeenCalled();
    });

    it('should skip already applied migrations', async () => {
      mockCreateDatabase.mockResolvedValue(1);
      // migrate() calls ensureMigrationsTable():
      //   1. Check _migrations table exists
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: ['count'],
        rows: [{ count: 1 }],
        rowsAffected: 0,
      }));
      // migrate() calls getDatabaseVersion() which calls ensureMigrationsTable():
      //   2. Check _migrations table exists
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: ['count'],
        rows: [{ count: 1 }],
        rowsAffected: 0,
      }));
      //   3. Get current version (version 1 already applied)
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: ['version'],
        rows: [{ version: 1 }],
        rowsAffected: 0,
      }));
      mockBeginTransaction.mockResolvedValue(undefined);
      // Apply migration 2 up
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: [],
        rows: [],
        rowsAffected: 0,
      }));
      // Record migration 2
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: [],
        rows: [],
        rowsAffected: 1,
      }));
      mockCommit.mockResolvedValue(undefined);

      const migrations: Migration[] = [
        {
          version: 1,
          up: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)',
          down: 'DROP TABLE users',
        },
        {
          version: 2,
          up: 'ALTER TABLE users ADD COLUMN email TEXT',
          down: 'ALTER TABLE users DROP COLUMN email',
        },
      ];

      await db.open();
      await db.migrate(migrations);

      // Verify only migration 2 was applied
      const executeCalls = mockExecute.mock.calls.map(call => call[1]);
      expect(executeCalls).not.toContain(migrations[0].up);
      expect(executeCalls).toContain(migrations[1].up);
    });

    it('should rollback on migration failure', async () => {
      mockCreateDatabase.mockResolvedValue(1);
      // migrate() calls ensureMigrationsTable():
      //   1. Check _migrations table exists
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: ['count'],
        rows: [{ count: 1 }],
        rowsAffected: 0,
      }));
      // migrate() calls getDatabaseVersion() which calls ensureMigrationsTable():
      //   2. Check _migrations table exists
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: ['count'],
        rows: [{ count: 1 }],
        rowsAffected: 0,
      }));
      //   3. Get current version
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: ['version'],
        rows: [],
        rowsAffected: 0,
      }));
      mockBeginTransaction.mockResolvedValue(undefined);
      // Migration SQL fails
      mockExecute.mockRejectedValueOnce(new Error('SQL error: invalid syntax'));
      mockRollback.mockResolvedValue(undefined);

      const migrations: Migration[] = [
        {
          version: 1,
          up: 'INVALID SQL HERE',
          down: 'DROP TABLE users',
        },
      ];

      await db.open();
      await expect(db.migrate(migrations)).rejects.toThrow('SQL error');
      expect(mockRollback).toHaveBeenCalled();
      expect(mockCommit).not.toHaveBeenCalled();
    });

    it('should validate migrations are sorted by version', async () => {
      mockCreateDatabase.mockResolvedValue(1);

      const migrations: Migration[] = [
        {
          version: 2,
          up: 'ALTER TABLE users ADD COLUMN email TEXT',
          down: 'ALTER TABLE users DROP COLUMN email',
        },
        {
          version: 1,
          up: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)',
          down: 'DROP TABLE users',
        },
      ];

      await db.open();
      await expect(db.migrate(migrations)).rejects.toThrow(
        'Migrations must be sorted by version'
      );
    });

    it('should throw error if database is not open', async () => {
      const migrations: Migration[] = [
        {
          version: 1,
          up: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)',
          down: 'DROP TABLE users',
        },
      ];

      await expect(db.migrate(migrations)).rejects.toThrow(
        'Database is not open'
      );
    });

    it('should handle empty migrations array', async () => {
      mockCreateDatabase.mockResolvedValue(1);
      // migrate() calls ensureMigrationsTable():
      //   1. Check _migrations table exists
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: ['count'],
        rows: [{ count: 1 }],
        rowsAffected: 0,
      }));
      // migrate() calls getDatabaseVersion() which calls ensureMigrationsTable():
      //   2. Check _migrations table exists
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: ['count'],
        rows: [{ count: 1 }],
        rowsAffected: 0,
      }));
      //   3. Get current version
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: ['version'],
        rows: [],
        rowsAffected: 0,
      }));

      await db.open();
      await db.migrate([]);

      // Should not call beginTransaction or commit
      expect(mockBeginTransaction).not.toHaveBeenCalled();
      expect(mockCommit).not.toHaveBeenCalled();
    });
  });

  describe('getDatabaseVersion()', () => {
    it('should return current schema version', async () => {
      mockCreateDatabase.mockResolvedValue(1);
      // Check _migrations table exists
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: ['count'],
        rows: [{ count: 1 }],
        rowsAffected: 0,
      }));
      // Get current version
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: ['version'],
        rows: [{ version: 5 }],
        rowsAffected: 0,
      }));

      await db.open();
      const version = await db.getDatabaseVersion();

      expect(version).toBe(5);
    });

    it('should return 0 if no migrations applied', async () => {
      mockCreateDatabase.mockResolvedValue(1);
      // Check _migrations table exists
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: ['count'],
        rows: [{ count: 1 }],
        rowsAffected: 0,
      }));
      // Get current version (empty)
      mockExecute.mockResolvedValueOnce(JSON.stringify({
        columns: ['version'],
        rows: [],
        rowsAffected: 0,
      }));

      await db.open();
      const version = await db.getDatabaseVersion();

      expect(version).toBe(0);
    });

    it('should throw error if database is not open', async () => {
      await expect(db.getDatabaseVersion()).rejects.toThrow(
        'Database is not open'
      );
    });
  });
});
