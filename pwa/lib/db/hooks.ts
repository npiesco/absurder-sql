'use client';

import { useEffect, useState, useCallback } from 'react';
import { DatabaseClient, type QueryResult } from './client';

// Singleton database client
let dbClient: DatabaseClient | null = null;

export interface UseDatabaseReturn {
  db: DatabaseClient | null;
  loading: boolean;
  error: Error | null;
}

export function useDatabase(dbName: string): UseDatabaseReturn {
  const [db, setDb] = useState<DatabaseClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function openDb() {
      try {
        if (!dbClient) {
          dbClient = new DatabaseClient();
        }
        
        await dbClient.open(dbName);
        
        if (mounted) {
          setDb(dbClient);
          setLoading(false);
        }
      } catch (err) {
        console.error('useDatabase error:', err);
        if (mounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    }

    openDb();

    return () => {
      mounted = false;
    };
  }, [dbName]);

  return { db, loading, error };
}

export interface UseQueryReturn<T = any> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useQuery<T = any>(
  sql: string,
  params?: any[]
): UseQueryReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!dbClient) {
      setError(new Error('Database not initialized'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await dbClient.execute(sql, params);
      setData(result.rows as T);
      setError(null);
    } catch (err) {
      console.error('useQuery error:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [sql, JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export interface UseTransactionReturn {
  execute: (queries: Array<{ sql: string; params?: any[] }>) => Promise<void>;
  pending: boolean;
  error: Error | null;
}

export function useTransaction(): UseTransactionReturn {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (queries: Array<{ sql: string; params?: any[] }>) => {
      if (!dbClient) {
        throw new Error('Database not initialized');
      }

      setPending(true);
      setError(null);

      try {
        await dbClient.execute('BEGIN TRANSACTION');

        for (const query of queries) {
          await dbClient.execute(query.sql, query.params);
        }

        await dbClient.execute('COMMIT');
      } catch (err) {
        console.error('Transaction error:', err);
        try {
          await dbClient.execute('ROLLBACK');
        } catch (rollbackErr) {
          console.error('Rollback error:', rollbackErr);
        }
        setError(err as Error);
        throw err;
      } finally {
        setPending(false);
      }
    },
    []
  );

  return { execute, pending, error };
}

export interface UseExportReturn {
  exportDb: (filename?: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

export function useExport(): UseExportReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportDb = useCallback(async (filename: string = 'database.db') => {
    if (!dbClient) {
      throw new Error('Database not initialized');
    }

    setLoading(true);
    setError(null);

    try {
      const blob = await dbClient.export();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { exportDb, loading, error };
}

export interface UseImportReturn {
  importDb: (file: File) => Promise<void>;
  loading: boolean;
  progress: number;
  error: Error | null;
}

export function useImport(): UseImportReturn {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const importDb = useCallback(async (file: File) => {
    if (!dbClient) {
      throw new Error('Database not initialized');
    }

    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      setProgress(50);
      await dbClient.import(file);
      setProgress(100);
    } catch (err) {
      console.error('Import error:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { importDb, loading, progress, error };
}
