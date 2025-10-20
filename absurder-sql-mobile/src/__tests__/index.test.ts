/**
 * Unit tests for AbsurderSQL Mobile TypeScript API
 * Tests the Database class logic, error handling, and native module integration
 */

// Mock the React Native NativeModules
const mockCreateDatabase = jest.fn();
const mockExecute = jest.fn();
const mockExecuteWithParams = jest.fn();
const mockExportToFile = jest.fn();
const mockImportFromFile = jest.fn();
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
      exportToFile: mockExportToFile,
      importFromFile: mockImportFromFile,
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

import { AbsurderDatabase, openDatabase, QueryResult } from '../index';

describe('AbsurderDatabase', () => {
  let db: AbsurderDatabase;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    db = new AbsurderDatabase('test.db');
  });

  describe('Constructor', () => {
    it('should create database instance with string config', () => {
      const db = new AbsurderDatabase('mydb.db');
      expect(db).toBeInstanceOf(AbsurderDatabase);
    });

    it('should create database instance with object config', () => {
      const db = new AbsurderDatabase({ name: 'mydb.db' });
      expect(db).toBeInstanceOf(AbsurderDatabase);
    });
  });

  describe('open()', () => {
    it('should open database and store handle', async () => {
      mockCreateDatabase.mockResolvedValue(42);

      await db.open();

      expect(mockCreateDatabase).toHaveBeenCalledWith('test.db');
      expect(mockCreateDatabase).toHaveBeenCalledTimes(1);
    });

    it('should throw error if database is already open', async () => {
      mockCreateDatabase.mockResolvedValue(42);

      await db.open();

      await expect(db.open()).rejects.toThrow('Database is already open');
    });

    it('should propagate native module errors', async () => {
      mockCreateDatabase.mockRejectedValue(
        new Error('Failed to create database')
      );

      await expect(db.open()).rejects.toThrow('Failed to create database');
    });
  });

  describe('execute()', () => {
    const mockResult: QueryResult = {
      columns: ['id', 'name'],
      rows: [{ id: 1, name: 'Alice' }],
      rowsAffected: 1,
    };

    beforeEach(async () => {
      mockCreateDatabase.mockResolvedValue(42);
      await db.open();
    });

    it('should execute SQL and return parsed result', async () => {
      mockExecute.mockResolvedValue(JSON.stringify(mockResult));

      const result = await db.execute('SELECT * FROM users');

      expect(mockExecute).toHaveBeenCalledWith(42, 'SELECT * FROM users');
      expect(result).toEqual(mockResult);
    });

    it('should throw error if database is not open', async () => {
      const unopenedDb = new AbsurderDatabase('test.db');

      await expect(unopenedDb.execute('SELECT 1')).rejects.toThrow(
        'Database is not open'
      );
    });

    it('should handle SQL execution errors', async () => {
      mockExecute.mockRejectedValue(
        new Error('SQL syntax error')
      );

      await expect(db.execute('INVALID SQL')).rejects.toThrow('SQL syntax error');
    });

    it('should handle JSON parsing errors', async () => {
      mockExecute.mockResolvedValue('invalid json');

      await expect(db.execute('SELECT 1')).rejects.toThrow();
    });
  });

  describe('executeWithParams()', () => {
    const mockResult: QueryResult = {
      columns: ['id', 'name'],
      rows: [{ id: 1, name: 'Bob' }],
      rowsAffected: 1,
    };

    beforeEach(async () => {
      mockCreateDatabase.mockResolvedValue(42);
      await db.open();
    });

    it('should execute parameterized query', async () => {
      mockExecuteWithParams.mockResolvedValue(
        JSON.stringify(mockResult)
      );

      const result = await db.executeWithParams(
        'SELECT * FROM users WHERE id = ?',
        [1]
      );

      expect(mockExecuteWithParams).toHaveBeenCalledWith(
        42,
        'SELECT * FROM users WHERE id = ?',
        [1]
      );
      expect(result).toEqual(mockResult);
    });

    it('should throw error if database is not open', async () => {
      const unopenedDb = new AbsurderDatabase('test.db');

      await expect(
        unopenedDb.executeWithParams('SELECT 1', [])
      ).rejects.toThrow('Database is not open');
    });

    it('should handle empty params array', async () => {
      mockExecuteWithParams.mockResolvedValue(
        JSON.stringify(mockResult)
      );

      await db.executeWithParams('SELECT * FROM users', []);

      expect(mockExecuteWithParams).toHaveBeenCalledWith(
        42,
        'SELECT * FROM users',
        []
      );
    });

    it('should handle multiple parameters', async () => {
      mockExecuteWithParams.mockResolvedValue(
        JSON.stringify(mockResult)
      );

      await db.executeWithParams(
        'INSERT INTO users VALUES (?, ?, ?)',
        [1, 'Alice', 30]
      );

      expect(mockExecuteWithParams).toHaveBeenCalledWith(
        42,
        'INSERT INTO users VALUES (?, ?, ?)',
        [1, 'Alice', 30]
      );
    });
  });

  describe('query()', () => {
    beforeEach(async () => {
      mockCreateDatabase.mockResolvedValue(42);
      await db.open();
    });

    it('should return only rows from execute result', async () => {
      const mockResult: QueryResult = {
        columns: ['id', 'name'],
        rows: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        rowsAffected: 2,
      };

      mockExecute.mockResolvedValue(JSON.stringify(mockResult));

      const rows = await db.query('SELECT * FROM users');

      expect(rows).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]);
      expect(rows).not.toHaveProperty('columns');
      expect(rows).not.toHaveProperty('rowsAffected');
    });

    it('should return empty array for no results', async () => {
      const mockResult: QueryResult = {
        columns: [],
        rows: [],
        rowsAffected: 0,
      };

      mockExecute.mockResolvedValue(JSON.stringify(mockResult));

      const rows = await db.query('SELECT * FROM empty_table');

      expect(rows).toEqual([]);
    });
  });

  describe('exportToFile()', () => {
    beforeEach(async () => {
      mockCreateDatabase.mockResolvedValue(42);
      await db.open();
    });

    it('should export database to file', async () => {
      mockExportToFile.mockResolvedValue(undefined);

      await db.exportToFile('/tmp/export.db');

      expect(mockExportToFile).toHaveBeenCalledWith(
        42,
        '/tmp/export.db'
      );
    });

    it('should throw error if database is not open', async () => {
      const unopenedDb = new AbsurderDatabase('test.db');

      await expect(unopenedDb.exportToFile('/tmp/export.db')).rejects.toThrow(
        'Database is not open'
      );
    });

    it('should propagate export errors', async () => {
      mockExportToFile.mockRejectedValue(
        new Error('Export failed: permission denied')
      );

      await expect(db.exportToFile('/tmp/export.db')).rejects.toThrow(
        'Export failed: permission denied'
      );
    });
  });

  describe('importFromFile()', () => {
    beforeEach(async () => {
      mockCreateDatabase.mockResolvedValue(42);
      await db.open();
    });

    it('should import database from file', async () => {
      mockImportFromFile.mockResolvedValue(undefined);

      await db.importFromFile('/tmp/import.db');

      expect(mockImportFromFile).toHaveBeenCalledWith(
        42,
        '/tmp/import.db'
      );
    });

    it('should throw error if database is not open', async () => {
      const unopenedDb = new AbsurderDatabase('test.db');

      await expect(unopenedDb.importFromFile('/tmp/import.db')).rejects.toThrow(
        'Database is not open'
      );
    });

    it('should propagate import errors', async () => {
      mockImportFromFile.mockRejectedValue(
        new Error('Import failed: file not found')
      );

      await expect(db.importFromFile('/tmp/import.db')).rejects.toThrow(
        'Import failed: file not found'
      );
    });
  });

  describe('Transaction methods', () => {
    beforeEach(async () => {
      mockCreateDatabase.mockResolvedValue(42);
      await db.open();
    });

    describe('beginTransaction()', () => {
      it('should begin a transaction', async () => {
        mockBeginTransaction.mockResolvedValue(undefined);

        await db.beginTransaction();

        expect(mockBeginTransaction).toHaveBeenCalledWith(42);
      });

      it('should throw error if database is not open', async () => {
        const unopenedDb = new AbsurderDatabase('test.db');

        await expect(unopenedDb.beginTransaction()).rejects.toThrow(
          'Database is not open'
        );
      });
    });

    describe('commit()', () => {
      it('should commit a transaction', async () => {
        mockCommit.mockResolvedValue(undefined);

        await db.commit();

        expect(mockCommit).toHaveBeenCalledWith(42);
      });

      it('should throw error if database is not open', async () => {
        const unopenedDb = new AbsurderDatabase('test.db');

        await expect(unopenedDb.commit()).rejects.toThrow(
          'Database is not open'
        );
      });
    });

    describe('rollback()', () => {
      it('should rollback a transaction', async () => {
        mockRollback.mockResolvedValue(undefined);

        await db.rollback();

        expect(mockRollback).toHaveBeenCalledWith(42);
      });

      it('should throw error if database is not open', async () => {
        const unopenedDb = new AbsurderDatabase('test.db');

        await expect(unopenedDb.rollback()).rejects.toThrow(
          'Database is not open'
        );
      });
    });

    describe('transaction()', () => {
      it('should execute function within transaction and commit on success', async () => {
        mockBeginTransaction.mockResolvedValue(undefined);
        mockCommit.mockResolvedValue(undefined);
        mockExecute.mockResolvedValue(
          JSON.stringify({ columns: [], rows: [], rowsAffected: 1 })
        );

        const result = await db.transaction(async () => {
          await db.execute('INSERT INTO users VALUES (1, "Alice")');
          return { success: true };
        });

        expect(mockBeginTransaction).toHaveBeenCalledWith(42);
        expect(mockCommit).toHaveBeenCalledWith(42);
        expect(mockRollback).not.toHaveBeenCalled();
        expect(result).toEqual({ success: true });
      });

      it('should rollback transaction on error', async () => {
        mockBeginTransaction.mockResolvedValue(undefined);
        mockRollback.mockResolvedValue(undefined);

        const error = new Error('Transaction failed');

        await expect(
          db.transaction(async () => {
            throw error;
          })
        ).rejects.toThrow('Transaction failed');

        expect(mockBeginTransaction).toHaveBeenCalledWith(42);
        expect(mockRollback).toHaveBeenCalledWith(42);
        expect(mockCommit).not.toHaveBeenCalled();
      });

      it('should throw error if database is not open', async () => {
        const unopenedDb = new AbsurderDatabase('test.db');

        await expect(
          unopenedDb.transaction(async () => {})
        ).rejects.toThrow('Database is not open');
      });

      it('should return function result', async () => {
        mockBeginTransaction.mockResolvedValue(undefined);
        mockCommit.mockResolvedValue(undefined);

        const result = await db.transaction(async () => {
          return 42;
        });

        expect(result).toBe(42);
      });
    });
  });

  describe('close()', () => {
    it('should close database and clear handle', async () => {
      mockCreateDatabase.mockResolvedValue(42);
      mockClose.mockResolvedValue(undefined);

      await db.open();
      await db.close();

      expect(mockClose).toHaveBeenCalledWith(42);
      
      // Verify subsequent operations fail
      await expect(db.execute('SELECT 1')).rejects.toThrow(
        'Database is not open'
      );
    });

    it('should be safe to call close multiple times', async () => {
      mockCreateDatabase.mockResolvedValue(42);
      mockClose.mockResolvedValue(undefined);

      await db.open();
      await db.close();
      await db.close(); // Should not throw

      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('should be safe to call close on unopened database', async () => {
      await db.close(); // Should not throw
      expect(mockClose).not.toHaveBeenCalled();
    });
  });

  describe('openDatabase() helper', () => {
    it('should create and open database with string config', async () => {
      mockCreateDatabase.mockResolvedValue(42);

      const db = await openDatabase('mydb.db');

      expect(db).toBeInstanceOf(AbsurderDatabase);
      expect(mockCreateDatabase).toHaveBeenCalledWith('mydb.db');
    });

    it('should create and open database with object config', async () => {
      mockCreateDatabase.mockResolvedValue(42);

      const db = await openDatabase({ name: 'mydb.db' });

      expect(db).toBeInstanceOf(AbsurderDatabase);
      expect(mockCreateDatabase).toHaveBeenCalledWith('mydb.db');
    });

    it('should propagate open errors', async () => {
      mockCreateDatabase.mockRejectedValue(
        new Error('Failed to create')
      );

      await expect(openDatabase('mydb.db')).rejects.toThrow('Failed to create');
    });
  });

  describe('Error handling scenarios', () => {
    beforeEach(async () => {
      mockCreateDatabase.mockResolvedValue(42);
      await db.open();
    });

    it('should handle native module returning null', async () => {
      mockExecute.mockResolvedValue(null);

      await expect(db.execute('SELECT 1')).rejects.toThrow();
    });

    it('should handle native module returning undefined', async () => {
      mockExecute.mockResolvedValue(undefined);

      await expect(db.execute('SELECT 1')).rejects.toThrow();
    });

    it('should handle very large result sets', async () => {
      const largeResult: QueryResult = {
        columns: ['id', 'data'],
        rows: Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          data: `row_${i}`,
        })),
        rowsAffected: 10000,
      };

      mockExecute.mockResolvedValue(JSON.stringify(largeResult));

      const result = await db.execute('SELECT * FROM large_table');

      expect(result.rows.length).toBe(10000);
    });
  });

  describe('Concurrent operations', () => {
    beforeEach(async () => {
      mockCreateDatabase.mockResolvedValue(42);
      await db.open();
    });

    it('should handle multiple concurrent execute calls', async () => {
      mockExecute.mockImplementation((handle, sql) =>
        Promise.resolve(
          JSON.stringify({
            columns: ['result'],
            rows: [{ result: sql }],
            rowsAffected: 1,
          })
        )
      );

      const promises = [
        db.execute('SELECT 1'),
        db.execute('SELECT 2'),
        db.execute('SELECT 3'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockExecute).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent transaction and execute', async () => {
      mockBeginTransaction.mockResolvedValue(undefined);
      mockCommit.mockResolvedValue(undefined);
      mockExecute.mockResolvedValue(
        JSON.stringify({ columns: [], rows: [], rowsAffected: 1 })
      );

      const transactionPromise = db.transaction(async () => {
        await db.execute('INSERT INTO users VALUES (1, "Alice")');
      });

      // This might not be a realistic scenario, but tests concurrent calls
      const executePromise = db.execute('SELECT * FROM users');

      await Promise.all([transactionPromise, executePromise]);

      expect(mockExecute).toHaveBeenCalled();
    });
  });
});
