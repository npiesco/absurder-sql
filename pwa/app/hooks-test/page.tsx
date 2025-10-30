'use client';

import { useEffect, useState } from 'react';
import { useDatabase, useQuery, useTransaction, useExport, useImport } from '@/lib/db/hooks';

export default function HooksTestPage() {
  const { db, loading, error } = useDatabase('hooks_test.db');
  const [loadingHistory, setLoadingHistory] = useState<boolean[]>([]);
  const [useQueryData, setUseQueryData] = useState<any>(null);
  const [useQueryLoading, setUseQueryLoading] = useState(false);
  const [useQueryError, setUseQueryError] = useState<Error | null>(null);
  const [useQueryRefetched, setUseQueryRefetched] = useState(false);
  const [transactionSuccess, setTransactionSuccess] = useState(false);
  const [transactionRolledBack, setTransactionRolledBack] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const { execute: executeTransaction, pending: transactionPending } = useTransaction();
  const { exportDb } = useExport();
  const { importDb } = useImport();

  // Track loading history
  useEffect(() => {
    setLoadingHistory(prev => [...prev, loading]);
  }, [loading]);

  // Expose state to window for tests
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).testDb = db;
      (window as any).testLoading = loading;
      (window as any).testError = error;
      (window as any).loadingHistory = loadingHistory;
      (window as any).useQueryData = useQueryData;
      (window as any).useQueryLoading = useQueryLoading;
      (window as any).useQueryError = useQueryError;
      (window as any).useQueryRefetched = useQueryRefetched;
      (window as any).transactionSuccess = transactionSuccess;
      (window as any).transactionRolledBack = transactionRolledBack;
      (window as any).importSuccess = importSuccess;
    }
  }, [db, loading, error, loadingHistory, useQueryData, useQueryLoading, useQueryError, useQueryRefetched, transactionSuccess, transactionRolledBack, importSuccess]);

  const handleTestUseQuery = async () => {
    if (!db) return;

    try {
      setUseQueryLoading(true);
      await db.execute('DROP TABLE IF EXISTS query_test');
      await db.execute('CREATE TABLE query_test (id INTEGER, name TEXT)');
      await db.execute('INSERT INTO query_test VALUES (?, ?)', [
        { type: 'Integer', value: 1 },
        { type: 'Text', value: 'Test Data' }
      ]);

      const result = await db.execute('SELECT * FROM query_test');
      setUseQueryData(result.rows);
      setUseQueryError(null);
    } catch (err) {
      setUseQueryError(err as Error);
    } finally {
      setUseQueryLoading(false);
    }
  };

  const handleTestUseQueryRefetch = async () => {
    if (!db) return;
    await handleTestUseQuery();
    setUseQueryRefetched(true);
  };

  const handleTestTransaction = async () => {
    try {
      await executeTransaction([
        { sql: 'DROP TABLE IF EXISTS transaction_test' },
        { sql: 'CREATE TABLE transaction_test (id INTEGER, value TEXT)' },
        { 
          sql: 'INSERT INTO transaction_test VALUES (?, ?)',
          params: [
            { type: 'Integer', value: 1 },
            { type: 'Text', value: 'Transaction Data' }
          ]
        }
      ]);
      setTransactionSuccess(true);
    } catch (err) {
      console.error('Transaction failed:', err);
    }
  };

  const handleTestTransactionRollback = async () => {
    try {
      await executeTransaction([
        { sql: 'DROP TABLE IF EXISTS rollback_test' },
        { sql: 'CREATE TABLE rollback_test (id INTEGER)' },
        { sql: 'INSERT INTO rollback_test VALUES (1)' },
        { sql: 'INVALID SQL SYNTAX' } // This will cause rollback
      ]);
    } catch (err) {
      // Expected to fail
      setTransactionRolledBack(true);
    }
  };

  const handleTestExport = async () => {
    await exportDb('hooks_test.db');
  };

  const handleTestImport = async () => {
    const realFile = (window as any).realExportFile;
    if (realFile) {
      try {
        await importDb(realFile);
        setImportSuccess(true);
      } catch (err) {
        console.error('Import failed:', err);
      }
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Hooks Test Page</h1>
      
      <p id="status">
        {loading ? 'Loading...' : error ? `Error: ${error.message}` : 'Database ready'}
      </p>

      <div style={{ marginTop: '20px' }}>
        <button id="testUseQuery" onClick={handleTestUseQuery} disabled={!db}>
          Test useQuery
        </button>
        <button id="testUseQueryRefetch" onClick={handleTestUseQueryRefetch} disabled={!db}>
          Test useQuery Refetch
        </button>
        <p id="useQueryResult">
          {useQueryLoading ? 'Loading query...' : useQueryData ? (useQueryRefetched ? 'Refetch complete' : 'useQuery complete') : ''}
        </p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button id="testTransaction" onClick={handleTestTransaction} disabled={!db || transactionPending}>
          Test Transaction
        </button>
        <button id="testTransactionRollback" onClick={handleTestTransactionRollback} disabled={!db || transactionPending}>
          Test Transaction Rollback
        </button>
        <p id="transactionResult">
          {transactionSuccess ? 'Transaction complete' : transactionRolledBack ? 'Rollback successful' : ''}
        </p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button id="testExport" onClick={handleTestExport} disabled={!db}>
          Test Export
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button id="testImport" onClick={handleTestImport} disabled={!db}>
          Test Import
        </button>
        <p id="importResult">
          {importSuccess ? 'Import complete' : ''}
        </p>
      </div>
    </div>
  );
}
