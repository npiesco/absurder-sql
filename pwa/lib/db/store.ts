/**
 * Database State Management Store (Zustand)
 * 
 * Central state for database instance and metadata
 * Uses localStorage persistence to maintain state across page navigations
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

export const useDatabaseStore = create<DatabaseStore>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'absurder-sql-database-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields (not db instance)
      partialize: (state) => ({
        currentDbName: state.currentDbName,
        tableCount: state.tableCount,
      }),
    }
  )
);
