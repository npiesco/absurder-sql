'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { DatabaseClient } from './client';

interface DatabaseContextValue {
  db: DatabaseClient | null;
  loading: boolean;
  error: Error | null;
  reinitialize: (dbName: string) => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextValue | undefined>(undefined);

export interface DatabaseProviderProps {
  children: ReactNode;
  dbName: string;
}

export function DatabaseProvider({ children, dbName }: DatabaseProviderProps) {
  const [db, setDb] = useState<DatabaseClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const initializeDatabase = async (name: string) => {
    setLoading(true);
    setError(null);

    try {
      const client = new DatabaseClient();
      await client.open(name);
      setDb(client);
      console.log(`DatabaseProvider: Initialized database "${name}"`);
    } catch (err) {
      console.error('DatabaseProvider: Initialization failed:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeDatabase(dbName);

    return () => {
      if (db) {
        db.close().catch(err => {
          console.error('DatabaseProvider: Failed to close database on unmount:', err);
        });
      }
    };
  }, [dbName]);

  const reinitialize = async (newDbName: string) => {
    if (db) {
      await db.close();
    }
    await initializeDatabase(newDbName);
  };

  const value: DatabaseContextValue = {
    db,
    loading,
    error,
    reinitialize,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase(): DatabaseContextValue {
  const context = useContext(DatabaseContext);
  
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  
  return context;
}
