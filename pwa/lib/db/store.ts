/**
 * Database State Management Store (Zustand)
 * 
 * Central state for database instance and metadata
 */

import { create } from 'zustand';

interface DatabaseStore {
  db: any | null;
  currentDbName: string;
  loading: boolean;
  status: string;
  tableCount: number;
  
  setDb: (db: any) => void;
  setCurrentDbName: (name: string) => void;
  setLoading: (loading: boolean) => void;
  setStatus: (status: string) => void;
  setTableCount: (count: number) => void;
  reset: () => void;
}

export const useDatabaseStore = create<DatabaseStore>((set) => ({
  db: null,
  currentDbName: 'database.db',
  loading: true,
  status: 'Initializing...',
  tableCount: 0,
  
  setDb: (db) => set({ db }),
  setCurrentDbName: (name) => set({ currentDbName: name }),
  setLoading: (loading) => set({ loading }),
  setStatus: (status) => set({ status }),
  setTableCount: (count) => set({ tableCount: count }),
  reset: () => set({
    db: null,
    currentDbName: 'database.db',
    loading: false,
    status: 'Reset',
    tableCount: 0,
  }),
}));
