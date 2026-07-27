'use client';

import { useEffect, useState } from 'react';
import initializeDatabaseRuntime, { Database } from '@/lib/db/database-proxy';

export default function WorkerTestPage() {
  const [status, setStatus] = useState('starting');

  useEffect(() => {
    void initializeDatabaseRuntime().then(
      () => {
        window.Database = Database;
        setStatus('ready');
      },
      (error) => {
        console.error(error);
        setStatus(`error: ${error instanceof Error ? error.message : String(error)}`);
      },
    );
  }, []);

  return (
    <main>
      <h1>AbsurderSQL SharedWorker Test Harness</h1>
      <output data-testid="worker-status">{status}</output>
    </main>
  );
}
