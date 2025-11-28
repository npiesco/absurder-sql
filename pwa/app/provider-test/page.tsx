'use client';

import { useEffect, useState } from 'react';
import { DatabaseProvider, useDatabase } from '@/lib/db/provider';

function Component1() {
  const { db } = useDatabase();
  const [result, setResult] = useState('');

  const handleWrite = async () => {
    if (!db) return;

    try {
      await db.execute('DROP TABLE IF EXISTS shared_data');
      await db.execute('CREATE TABLE shared_data (id INTEGER, value TEXT)');
      await db.execute('INSERT INTO shared_data VALUES (?, ?)', [
        { type: 'Integer', value: 1 },
        { type: 'Text', value: 'shared data' }
      ]);
      setResult('Write complete');
    } catch (err) {
      console.error('Component1 write error:', err);
    }
  };

  return (
    <div>
      <button id="component1Write" onClick={handleWrite} disabled={!db}>
        Component 1 Write
      </button>
      <p id="component1Result">{result}</p>
    </div>
  );
}

function Component2() {
  const { db } = useDatabase();
  const [result, setResult] = useState('');

  const handleRead = async () => {
    if (!db) return;

    try {
      const queryResult = await db.execute('SELECT * FROM shared_data WHERE id = 1');
      if (queryResult.rows.length > 0) {
        const columnValue = queryResult.rows[0].values[1];
        const value = columnValue.type === 'Text' ? columnValue.value : null;
        (window as any).component2Data = value;
        setResult('Read complete');
      }
    } catch (err) {
      console.error('Component2 read error:', err);
    }
  };

  return (
    <div>
      <button id="component2Read" onClick={handleRead} disabled={!db}>
        Component 2 Read
      </button>
      <p id="component2Result">{result}</p>
    </div>
  );
}

function ErrorTrigger() {
  const { db, error } = useDatabase();
  const [localError, setLocalError] = useState<Error | null>(null);

  useEffect(() => {
    if (error) {
      (window as any).contextError = error;
    }
  }, [error]);

  const handleTriggerError = async () => {
    if (!db) return;

    try {
      await db.execute('INVALID SQL SYNTAX');
    } catch (err) {
      setLocalError(err as Error);
      (window as any).contextError = err;
    }
  };

  return (
    <div>
      <button id="triggerError" onClick={handleTriggerError} disabled={!db}>
        Trigger Error
      </button>
      <p id="errorDisplay">
        {(localError || error) ? 'Database error' : ''}
      </p>
    </div>
  );
}

function ProviderTestContent() {
  const { db, loading, error } = useDatabase();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).contextDb = db;
      (window as any).dbInitialized = !loading && db !== null;
    }
  }, [db, loading]);

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Provider Test Page</h1>
      
      <p id="status">
        {loading ? 'Loading...' : error ? `Error: ${error.message}` : 'Provider ready'}
      </p>

      <div style={{ marginTop: '20px' }}>
        <Component1 />
      </div>

      <div style={{ marginTop: '20px' }}>
        <Component2 />
      </div>

      <div style={{ marginTop: '20px' }}>
        <ErrorTrigger />
      </div>
    </div>
  );
}

export default function ProviderTestPage() {
  return (
    <DatabaseProvider dbName="provider_test.db">
      <ProviderTestContent />
    </DatabaseProvider>
  );
}
