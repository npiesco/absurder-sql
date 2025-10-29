'use client';

import { useEffect, useState } from 'react';
import { DatabaseClient } from '@/lib/db/client';

export default function TestPage() {
  const [status, setStatus] = useState('Initializing...');
  const [db, setDb] = useState<DatabaseClient | null>(null);

  useEffect(() => {
    async function initDb() {
      try {
        const client = new DatabaseClient();
        await client.initialize();
        await client.open('test_pwa.db');
        
        // Expose on window for Playwright tests
        (window as any).dbClient = client;
        
        setDb(client);
        setStatus('Database ready');
      } catch (err) {
        setStatus(`Error: ${err}`);
      }
    }
    
    initDb();
  }, []);

  const runTest = async () => {
    if (!db) return;
    
    try {
      setStatus('Running test...');
      
      // Create table
      await db.execute('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)');
      
      // Insert data
      await db.execute('INSERT INTO test (id, name) VALUES (?, ?)', [
        { type: 'Integer', value: 1 },
        { type: 'Text', value: 'PWA Test' }
      ]);
      
      // Query data
      const result = await db.execute('SELECT * FROM test');
      
      setStatus(`Test passed! Rows: ${result.rows.length}`);
    } catch (err) {
      setStatus(`Test failed: ${err}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>PWA Database Test</h1>
      <p id="status">{status}</p>
      <button id="runTest" onClick={runTest} disabled={!db}>
        Run Test
      </button>
    </div>
  );
}
