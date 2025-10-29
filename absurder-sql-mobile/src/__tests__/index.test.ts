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
const mockPrepare = jest.fn();
const mockStmtExecute = jest.fn();
const mockStmtFinalize = jest.fn();
const mockPrepareStream = jest.fn();
const mockFetchNext = jest.fn();
const mockCloseStream = jest.fn();
const mockCreateEncryptedDatabase = jest.fn();
const mockRekey = jest.fn();

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
      prepare: mockPrepare,
      stmtExecute: mockStmtExecute,
      stmtFinalize: mockStmtFinalize,
      prepareStream: mockPrepareStream,
      fetchNext: mockFetchNext,
      closeStream: mockCloseStream,
      createEncryptedDatabase: mockCreateEncryptedDatabase,
      rekey: mockRekey,
    },
  },
  Platform: {
    select: jest.fn((obj: any) => obj.ios || obj.default),
  },
}));

import { AbsurderDatabase, openDatabase, QueryResult } from '../main';

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
    const mockUniffiResult = {
      columns: ['id', 'name'],
      rows: [JSON.stringify({ values: [{ value: 1 }, { value: 'Alice' }] })],
      rowsAffected: BigInt(1),
    };
    
    const expectedResult = {
      columns: ['id', 'name'],
      rows: [{ id: 1, name: 'Alice' }],
      rowsAffected: 1,
    };

    beforeEach(async () => {
      mockCreateDatabase.mockResolvedValue(42);
      await db.open();
    });

    it('should execute SQL and return parsed result', async () => {
      mockExecute.mockResolvedValue(mockUniffiResult);

      const result = await db.execute('SELECT * FROM users');

      expect(mockExecute).toHaveBeenCalledWith(BigInt(42), 'SELECT * FROM users');
      expect(result).toEqual(expectedResult);
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
    const mockUniffiResult = {
      columns: ['id', 'name'],
      rows: [JSON.stringify({ values: [{ value: 1 }, { value: 'Alice' }] })],
      rowsAffected: BigInt(1),
    };
    
    const expectedResult = {
      columns: ['id', 'name'],
      rows: [{ id: 1, name: 'Alice' }],
      rowsAffected: 1,
    };

    beforeEach(async () => {
      mockCreateDatabase.mockResolvedValue(42);
      await db.open();
    });

    it('should execute parameterized query', async () => {
      mockExecuteWithParams.mockResolvedValue(mockUniffiResult);

      const result = await db.executeWithParams(
        'SELECT * FROM users WHERE id = ?',
        [1]
      );

      expect(mockExecuteWithParams).toHaveBeenCalledWith(
        BigInt(42),
        'SELECT * FROM users WHERE id = ?',
        ['1']
      );
      expect(result).toEqual(expectedResult);
    });

    it('should throw error if database is not open', async () => {
      const unopenedDb = new AbsurderDatabase('test.db');

      await expect(
        unopenedDb.executeWithParams('SELECT 1', [])
      ).rejects.toThrow('Database is not open');
    });

    it('should handle empty params array', async () => {
      mockExecuteWithParams.mockResolvedValue(mockUniffiResult);

      await db.executeWithParams('SELECT * FROM users', []);

      expect(mockExecuteWithParams).toHaveBeenCalledWith(
        BigInt(42),
        'SELECT * FROM users',
        []
      );
    });

    it('should handle multiple parameters', async () => {
      mockExecuteWithParams.mockResolvedValue(mockUniffiResult);

      await db.executeWithParams(
        'INSERT INTO users VALUES (?, ?, ?)',
        [1, 'Alice', 30]
      );

      expect(mockExecuteWithParams).toHaveBeenCalledWith(
        BigInt(42),
        'INSERT INTO users VALUES (?, ?, ?)',
        ['1', 'Alice', '30']
      );
    });
  });

  describe('query()', () => {
    beforeEach(async () => {
      mockCreateDatabase.mockResolvedValue(42);
      await db.open();
    });

    it('should return only rows from execute result', async () => {
      const mockUniffiResult = {
        columns: ['id', 'name'],
        rows: [
          JSON.stringify({ values: [{ value: 1 }, { value: 'Alice' }] }),
          JSON.stringify({ values: [{ value: 2 }, { value: 'Bob' }] }),
        ],
        rowsAffected: BigInt(2),
      };

      mockExecute.mockResolvedValue(mockUniffiResult);

      const rows = await db.query('SELECT * FROM users');

      expect(rows).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]);
      expect(rows).not.toHaveProperty('columns');
      expect(rows).not.toHaveProperty('rowsAffected');
    });

    it('should return empty array for no results', async () => {
      const mockUniffiResult = {
        columns: [],
        rows: [],
        rowsAffected: BigInt(0),
      };

      mockExecute.mockResolvedValue(mockUniffiResult);

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
      const mockUniffiResult = {
        columns: ['id', 'data'],
        rows: Array.from({ length: 10000 }, (_, i) => 
          JSON.stringify({ values: [{ value: i }, { value: `row_${i}` }] })
        ),
        rowsAffected: BigInt(10000),
      };

      mockExecute.mockResolvedValue(mockUniffiResult);

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

  describe('PreparedStatement API', () => {
    beforeEach(async () => {
      mockCreateDatabase.mockResolvedValue(42);
      await db.open();
    });

    describe('prepare()', () => {
      it('should prepare a SQL statement and return PreparedStatement', async () => {
        mockPrepare.mockResolvedValue(100); // statement handle

        const stmt = await db.prepare('SELECT * FROM users WHERE id = ?');

        expect(mockPrepare).toHaveBeenCalledWith(42, 'SELECT * FROM users WHERE id = ?');
        expect(stmt).toBeDefined();
        expect(stmt.execute).toBeInstanceOf(Function);
        expect(stmt.finalize).toBeInstanceOf(Function);
      });

      it('should throw error if database is not open', async () => {
        const unopenedDb = new AbsurderDatabase('test.db');

        await expect(
          unopenedDb.prepare('SELECT * FROM users')
        ).rejects.toThrow('Database is not open');
      });

      it('should propagate prepare errors', async () => {
        mockPrepare.mockRejectedValue(
          new Error('SQL syntax error at position 10')
        );

        await expect(
          db.prepare('SELECT * FROM invalid syntax')
        ).rejects.toThrow('SQL syntax error at position 10');
      });
    });

    describe('PreparedStatement.execute()', () => {
      const mockUniffiResult = {
        columns: ['id', 'name'],
        rows: [JSON.stringify({ values: [{ value: 1 }, { value: 'Alice' }] })],
        rowsAffected: BigInt(1),
      };

      it('should execute statement with parameters', async () => {
        mockPrepare.mockResolvedValue(BigInt(100));
        mockStmtExecute.mockResolvedValue(mockUniffiResult);

        const stmt = await db.prepare('SELECT * FROM users WHERE id = ?');
        const result = await stmt.execute([1]);

        expect(mockStmtExecute).toHaveBeenCalledWith(BigInt(100), ['1']);
        expect(result.rows).toEqual([{ id: 1, name: 'Alice' }]);
      });

      it('should reuse statement for multiple executions', async () => {
        mockPrepare.mockResolvedValue(BigInt(100));
        const result1 = { columns: ['id'], rows: [JSON.stringify({ values: [{ value: 1 }] })], rowsAffected: BigInt(1) };
        const result2 = { columns: ['id'], rows: [JSON.stringify({ values: [{ value: 2 }] })], rowsAffected: BigInt(1) };
        
        mockStmtExecute
          .mockResolvedValueOnce(result1)
          .mockResolvedValueOnce(result2);

        const stmt = await db.prepare('SELECT * FROM users WHERE id = ?');
        const r1 = await stmt.execute([1]);
        const r2 = await stmt.execute([2]);

        expect(mockPrepare).toHaveBeenCalledTimes(1);
        expect(mockStmtExecute).toHaveBeenCalledTimes(2);
        expect(mockStmtExecute).toHaveBeenNthCalledWith(1, BigInt(100), ['1']);
        expect(mockStmtExecute).toHaveBeenNthCalledWith(2, BigInt(100), ['2']);
        expect(r1.rows[0].id).toBe(1);
        expect(r2.rows[0].id).toBe(2);
      });

      it('should handle empty parameters', async () => {
        mockPrepare.mockResolvedValue(BigInt(100));
        mockStmtExecute.mockResolvedValue(
          { columns: [], rows: [], rowsAffected: BigInt(0) }
        );

        const stmt = await db.prepare('SELECT * FROM users');
        await stmt.execute([]);

        expect(mockStmtExecute).toHaveBeenCalledWith(BigInt(100), []);
      });

      it('should handle multiple parameters', async () => {
        mockPrepare.mockResolvedValue(BigInt(100));
        mockStmtExecute.mockResolvedValue(mockUniffiResult);

        const stmt = await db.prepare('INSERT INTO users VALUES (?, ?, ?)');
        await stmt.execute([1, 'Alice', 25]);

        expect(mockStmtExecute).toHaveBeenCalledWith(BigInt(100), ['1', 'Alice', '25']);
      });

      it('should propagate execution errors', async () => {
        mockPrepare.mockResolvedValue(BigInt(100));
        mockStmtExecute.mockRejectedValue(
          new Error('Execution failed: no such table')
        );

        const stmt = await db.prepare('SELECT * FROM nonexistent');
        
        await expect(stmt.execute([])).rejects.toThrow(
          'Execution failed: no such table'
        );
      });

      it('should handle null/undefined results', async () => {
        mockPrepare.mockResolvedValue(100);
        mockStmtExecute.mockResolvedValue(null);

        const stmt = await db.prepare('SELECT 1');
        
        await expect(stmt.execute([])).rejects.toThrow();
      });
    });

    describe('PreparedStatement.finalize()', () => {
      it('should finalize statement and release resources', async () => {
        mockPrepare.mockResolvedValue(100);
        mockStmtFinalize.mockResolvedValue(undefined);

        const stmt = await db.prepare('SELECT * FROM users');
        await stmt.finalize();

        expect(mockStmtFinalize).toHaveBeenCalledWith(100);
      });

      it('should prevent execution after finalize', async () => {
        mockPrepare.mockResolvedValue(100);
        mockStmtFinalize.mockResolvedValue(undefined);
        mockStmtExecute.mockRejectedValue(
          new Error('Statement handle not found')
        );

        const stmt = await db.prepare('SELECT * FROM users');
        await stmt.finalize();

        await expect(stmt.execute([])).rejects.toThrow(
          'Statement handle not found'
        );
      });

      it('should be safe to call finalize multiple times', async () => {
        mockPrepare.mockResolvedValue(100);
        mockStmtFinalize
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(new Error('Statement handle 100 not found'));

        const stmt = await db.prepare('SELECT * FROM users');
        await stmt.finalize();
        
        // Second finalize should propagate error from native
        await expect(stmt.finalize()).rejects.toThrow(
          'Statement handle 100 not found'
        );

        expect(mockStmtFinalize).toHaveBeenCalledTimes(2);
      });
    });

    describe('PreparedStatement lifecycle', () => {
      it('should handle prepare-execute-finalize sequence', async () => {
        const mockUniffiResult = {
          columns: ['count'],
          rows: [JSON.stringify({ values: [{ value: 5 }] })],
          rowsAffected: BigInt(0),
        };

        mockPrepare.mockResolvedValue(BigInt(100));
        mockStmtExecute.mockResolvedValue(mockUniffiResult);
        mockStmtFinalize.mockResolvedValue(undefined);

        // Prepare
        const stmt = await db.prepare('SELECT COUNT(*) as count FROM users WHERE age > ?');
        
        // Execute multiple times
        await stmt.execute([18]);
        await stmt.execute([21]);
        await stmt.execute([30]);
        
        // Finalize
        await stmt.finalize();

        expect(mockPrepare).toHaveBeenCalledTimes(1);
        expect(mockStmtExecute).toHaveBeenCalledTimes(3);
        expect(mockStmtFinalize).toHaveBeenCalledTimes(1);
      });

      it('should handle concurrent statement executions', async () => {
        const mockUniffiResult = {
          columns: ['id'],
          rows: [JSON.stringify({ values: [{ value: 1 }] })],
          rowsAffected: BigInt(0),
        };

        mockPrepare.mockResolvedValue(BigInt(100));
        mockStmtExecute.mockResolvedValue(mockUniffiResult);

        const stmt = await db.prepare('SELECT * FROM users WHERE id = ?');

        const promises = [
          stmt.execute([1]),
          stmt.execute([2]),
          stmt.execute([3]),
        ];

        await Promise.all(promises);

        expect(mockStmtExecute).toHaveBeenCalledTimes(3);
      });
    });

    describe('PreparedStatement vs execute performance benefit', () => {
      it('should prepare once but execute many times', async () => {
        mockPrepare.mockResolvedValue(100);
        mockStmtExecute.mockResolvedValue(
          JSON.stringify({ columns: [], rows: [], rowsAffected: 1 })
        );

        const stmt = await db.prepare('INSERT INTO data VALUES (?, ?)');

        // Execute 100 times
        for (let i = 0; i < 100; i++) {
          await stmt.execute([i, `value_${i}`]);
        }

        await stmt.finalize();

        // Key performance indicator: prepare called once, execute called 100 times
        expect(mockPrepare).toHaveBeenCalledTimes(1);
        expect(mockStmtExecute).toHaveBeenCalledTimes(100);
        expect(mockStmtFinalize).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Streaming API', () => {
    beforeEach(async () => {
      mockCreateDatabase.mockResolvedValue(42);
      await db.open();
    });

    describe('executeStream', () => {
      it('should stream results in batches', async () => {
        mockPrepareStream.mockResolvedValue(100);
        mockFetchNext
          .mockResolvedValueOnce(JSON.stringify([{ id: 1 }, { id: 2 }]))
          .mockResolvedValueOnce(JSON.stringify([{ id: 3 }, { id: 4 }]))
          .mockResolvedValueOnce(JSON.stringify([])); // EOF
        mockCloseStream.mockResolvedValue(true);

        const rows: any[] = [];
        for await (const row of db.executeStream('SELECT * FROM test')) {
          rows.push(row);
        }

        expect(rows).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
        expect(mockPrepareStream).toHaveBeenCalledWith(42, 'SELECT * FROM test');
        expect(mockFetchNext).toHaveBeenCalledTimes(3);
        expect(mockCloseStream).toHaveBeenCalledWith(100);
      });

      it('should support configurable batch size', async () => {
        mockPrepareStream.mockResolvedValue(101);
        mockFetchNext.mockResolvedValue(JSON.stringify([])); // Empty result
        mockCloseStream.mockResolvedValue(true);

        const rows: any[] = [];
        for await (const row of db.executeStream('SELECT * FROM test', { batchSize: 50 })) {
          rows.push(row);
        }

        expect(mockFetchNext).toHaveBeenCalledWith(101, 50);
        expect(mockCloseStream).toHaveBeenCalledWith(101);
      });

      it('should cleanup on early break', async () => {
        mockPrepareStream.mockResolvedValue(102);
        mockFetchNext
          .mockResolvedValueOnce(JSON.stringify([{ id: 1 }, { id: 2 }]))
          .mockResolvedValueOnce(JSON.stringify([{ id: 3 }, { id: 4 }]));
        mockCloseStream.mockResolvedValue(true);

        const rows: any[] = [];
        for await (const row of db.executeStream('SELECT * FROM test')) {
          rows.push(row);
          if (rows.length === 2) {
            break; // Early termination
          }
        }

        expect(rows).toEqual([{ id: 1 }, { id: 2 }]);
        expect(mockCloseStream).toHaveBeenCalledWith(102);
      });

      it('should throw error if database is not open', async () => {
        const closedDb = new AbsurderDatabase('closed.db');

        await expect(async () => {
          for await (const row of closedDb.executeStream('SELECT * FROM test')) {
            // Should not reach here
          }
        }).rejects.toThrow('Database is not open');
      });

      it('should handle empty result set', async () => {
        mockPrepareStream.mockReset().mockResolvedValue(103);
        mockFetchNext.mockReset().mockResolvedValue(JSON.stringify([])); // Empty from start
        mockCloseStream.mockReset().mockResolvedValue(true);

        const rows: any[] = [];
        for await (const row of db.executeStream('SELECT * FROM empty_table')) {
          rows.push(row);
        }

        expect(rows).toEqual([]);
        expect(mockCloseStream).toHaveBeenCalledWith(103);
      });

      it('should handle errors during streaming', async () => {
        mockPrepareStream.mockResolvedValue(104);
        mockFetchNext.mockRejectedValue(new Error('Network error'));
        mockCloseStream.mockResolvedValue(true);

        await expect(async () => {
          for await (const row of db.executeStream('SELECT * FROM test')) {
            // Should not reach here
          }
        }).rejects.toThrow('Network error');

        // Should still cleanup
        expect(mockCloseStream).toHaveBeenCalledWith(104);
      });

      it('should handle large result sets efficiently', async () => {
        mockPrepareStream.mockResolvedValue(105);
        
        // Simulate 10 batches of 100 rows each (1000 total rows)
        const batches = Array.from({ length: 10 }, (_, i) =>
          Array.from({ length: 100 }, (_, j) => ({ id: i * 100 + j }))
        );
        
        mockFetchNext
          .mockImplementation(async (streamHandle: number, batchSize: number) => {
            const batch = batches.shift();
            return JSON.stringify(batch || []);
          });
        mockCloseStream.mockResolvedValue(true);

        const rows: any[] = [];
        for await (const row of db.executeStream('SELECT * FROM large_table', { batchSize: 100 })) {
          rows.push(row);
        }

        expect(rows.length).toBe(1000);
        expect(mockFetchNext).toHaveBeenCalledTimes(11); // 10 batches + 1 EOF check
        expect(mockCloseStream).toHaveBeenCalledWith(105);
      });
    });
  });

  describe('Encryption API', () => {
    describe('openDatabase with encryption', () => {
      it('should create encrypted database with encryption key', async () => {
        mockCreateEncryptedDatabase.mockResolvedValue(42);

        const db = await openDatabase({
          name: 'secure.db',
          encryption: { key: 'my-secure-password' },
        });

        expect(mockCreateEncryptedDatabase).toHaveBeenCalledWith(
          'secure.db',
          'my-secure-password'
        );
        expect(mockCreateDatabase).not.toHaveBeenCalled();
        expect(db).toBeInstanceOf(AbsurderDatabase);
      });

      it('should create unencrypted database without encryption config', async () => {
        mockCreateDatabase.mockResolvedValue(43);

        const db = await openDatabase({ name: 'regular.db' });

        expect(mockCreateDatabase).toHaveBeenCalledWith('regular.db');
        expect(mockCreateEncryptedDatabase).not.toHaveBeenCalled();
        expect(db).toBeInstanceOf(AbsurderDatabase);
      });

      it('should create unencrypted database with string config', async () => {
        mockCreateDatabase.mockResolvedValue(44);

        const db = await openDatabase('simple.db');

        expect(mockCreateDatabase).toHaveBeenCalledWith('simple.db');
        expect(mockCreateEncryptedDatabase).not.toHaveBeenCalled();
      });

      it('should propagate errors from encrypted database creation', async () => {
        mockCreateEncryptedDatabase.mockRejectedValue(
          new Error('Invalid encryption key: minimum 8 characters required')
        );

        await expect(
          openDatabase({
            name: 'secure.db',
            encryption: { key: 'short' },
          })
        ).rejects.toThrow('Invalid encryption key: minimum 8 characters required');
      });

      it('should allow executing queries on encrypted database', async () => {
        mockCreateEncryptedDatabase.mockResolvedValue(42);
        mockExecute.mockResolvedValue(
          JSON.stringify({
            columns: ['secret'],
            rows: [{ secret: 'classified' }],
            rowsAffected: 1,
          })
        );

        const db = await openDatabase({
          name: 'secure.db',
          encryption: { key: 'my-secure-password' },
        });

        const result = await db.execute('SELECT * FROM secrets');

        expect(result.rows[0].secret).toBe('classified');
        expect(mockExecute).toHaveBeenCalledWith(42, 'SELECT * FROM secrets');
      });
    });

    describe('rekey()', () => {
      let encryptedDb: AbsurderDatabase;

      beforeEach(async () => {
        mockCreateEncryptedDatabase.mockResolvedValue(42);
        encryptedDb = await openDatabase({
          name: 'encrypted.db',
          encryption: { key: 'initial-password' },
        });
      });

      it('should change encryption key with new key', async () => {
        mockRekey.mockResolvedValue(undefined);

        await encryptedDb.rekey('new-password');

        expect(mockRekey).toHaveBeenCalledWith(42, 'new-password');
      });

      it('should throw error if database is not open', async () => {
        const unopenedDb = new AbsurderDatabase('test.db');

        await expect(unopenedDb.rekey('new-password')).rejects.toThrow(
          'Database is not open'
        );
      });

      it('should propagate rekey errors', async () => {
        mockRekey.mockRejectedValue(
          new Error('Rekey failed: invalid key length')
        );

        await expect(encryptedDb.rekey('short')).rejects.toThrow(
          'Rekey failed: invalid key length'
        );
      });

      it('should allow operations after successful rekey', async () => {
        mockRekey.mockResolvedValue(undefined);
        mockExecute.mockResolvedValue(
          JSON.stringify({
            columns: ['test'],
            rows: [{ test: 'data' }],
            rowsAffected: 1,
          })
        );

        await encryptedDb.rekey('new-password-12345');
        const result = await encryptedDb.execute('SELECT * FROM test');

        expect(result.rows[0].test).toBe('data');
      });
    });

    describe('Encrypted database lifecycle', () => {
      it('should handle complete encrypted database workflow', async () => {
        // Create encrypted database
        mockCreateEncryptedDatabase.mockResolvedValue(50);
        const db = await openDatabase({
          name: 'workflow.db',
          encryption: { key: 'initial-password' },
        });

        // Execute some operations
        mockExecute.mockResolvedValue(
          JSON.stringify({
            columns: [],
            rows: [],
            rowsAffected: 1,
          })
        );
        await db.execute('CREATE TABLE users (id INTEGER, name TEXT)');
        await db.execute("INSERT INTO users VALUES (1, 'Alice')");

        // Rekey
        mockRekey.mockResolvedValue(undefined);
        await db.rekey('new-password-12345');

        // Continue operations
        const queryResult = {
          columns: ['id', 'name'],
          rows: [{ id: 1, name: 'Alice' }],
          rowsAffected: 0,
        };
        mockExecute.mockResolvedValue(JSON.stringify(queryResult));
        const result = await db.execute('SELECT * FROM users');

        // Close
        mockClose.mockResolvedValue(undefined);
        await db.close();

        expect(mockCreateEncryptedDatabase).toHaveBeenCalledWith(
          'workflow.db',
          'initial-password'
        );
        expect(mockRekey).toHaveBeenCalledWith(50, 'new-password-12345');
        expect(mockClose).toHaveBeenCalledWith(50);
        expect(result.rows[0].name).toBe('Alice');
      });
    });

    describe('Encryption config validation', () => {
      it('should handle encryption config with key property', async () => {
        mockCreateEncryptedDatabase.mockResolvedValue(60);

        await openDatabase({
          name: 'test.db',
          encryption: { key: 'valid-password-123' },
        });

        expect(mockCreateEncryptedDatabase).toHaveBeenCalledWith(
          'test.db',
          'valid-password-123'
        );
      });

      it('should create unencrypted database when encryption is undefined', async () => {
        mockCreateDatabase.mockResolvedValue(61);

        await openDatabase({
          name: 'test.db',
          encryption: undefined,
        });

        expect(mockCreateDatabase).toHaveBeenCalledWith('test.db');
        expect(mockCreateEncryptedDatabase).not.toHaveBeenCalled();
      });
    });
  });
});
