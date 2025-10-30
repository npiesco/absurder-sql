'use client';

import { useState } from 'react';
import { DatabaseClient } from '@/lib/db/client';
import {
  DatabaseNotOpenError,
  QueryExecutionError,
  ImportExportError,
  logDatabaseError,
} from '@/lib/db/errors';

export default function ErrorTestPage() {
  const [errorResult, setErrorResult] = useState('');

  const handleNotOpenError = async () => {
    try {
      const client = new DatabaseClient();
      // Try to execute without opening
      await client.execute('SELECT 1');
    } catch (err) {
      const dbError = new DatabaseNotOpenError();
      logDatabaseError(dbError);
      (window as any).lastError = dbError;
      setErrorResult('DatabaseNotOpenError');
    }
  };

  const handleQueryError = async () => {
    try {
      const client = new DatabaseClient();
      await client.open('error_test.db');
      await client.execute('INVALID SQL SYNTAX');
    } catch (err) {
      const dbError = new QueryExecutionError('INVALID SQL SYNTAX', err as Error);
      logDatabaseError(dbError);
      (window as any).lastError = dbError;
      setErrorResult('QueryExecutionError');
    }
  };

  const handleImportError = async () => {
    try {
      const client = new DatabaseClient();
      await client.open('error_test.db');
      
      // Create invalid file
      const invalidFile = new File(['not a database'], 'invalid.db', { type: 'application/x-sqlite3' });
      await client.import(invalidFile);
    } catch (err) {
      const dbError = new ImportExportError('import', err as Error);
      logDatabaseError(dbError);
      (window as any).lastError = dbError;
      setErrorResult('ImportExportError');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Error Handling Test Page</h1>
      
      <p id="status">Ready</p>

      <div style={{ marginTop: '20px' }}>
        <button id="testNotOpenError" onClick={handleNotOpenError}>
          Test DatabaseNotOpenError
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button id="testQueryError" onClick={handleQueryError}>
          Test QueryExecutionError
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button id="testImportError" onClick={handleImportError}>
          Test ImportExportError
        </button>
      </div>

      <p id="errorResult" style={{ marginTop: '20px', color: 'red' }}>
        {errorResult}
      </p>
    </div>
  );
}
