/**
 * Unified database hook for all pages
 *
 * Handles WASM initialization and database access consistently
 * - Initializes WASM once and exposes Database class
 * - Returns database from Zustand (single source of truth)
 * - Auto-creates database for E2E tests if needed
 * - All pages use this instead of duplicating logic
 */

import { useEffect, useState } from 'react';
import { useDatabaseStore } from './store';

export function useDatabase() {
  const { db, setDb, currentDbName, _hasHydrated } = useDatabaseStore();
  const [wasmReady, setWasmReady] = useState(false);

  // 1. Initialize WASM once (if not already done)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).Database) {
      setWasmReady(true);
      return;
    }

    async function initWasm() {
      try {
        const init = (await import('@npiesco/absurder-sql')).default;
        await init();

        const { Database } = await import('@npiesco/absurder-sql');
        (window as any).Database = Database;

        setWasmReady(true);
      } catch (err) {
        console.error('Failed to initialize WASM:', err);
      }
    }

    initWasm();
  }, []);

  // 2. Listen for test database override events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleTestDbReady = () => {
      const testDb = (window as any).testDb;
      if (testDb && testDb !== db) {
        setDb(testDb);
      }
    };

    window.addEventListener('testdb-ready', handleTestDbReady);
    return () => window.removeEventListener('testdb-ready', handleTestDbReady);
  }, [db, setDb]);

  // 3. Load or create database - single source of truth in Zustand
  useEffect(() => {
    if (!wasmReady || !_hasHydrated || db) return;

    const Database = (window as any).Database;
    if (!Database) return;

    async function ensureDatabase() {
      try {
        // Priority 1: Test-created database (E2E tests set window.testDb)
        // Check a few times to give tests time to set up (avoid race condition)
        for (let i = 0; i < 20; i++) {
          const testDb = (window as any).testDb;
          if (testDb) {
            setDb(testDb);
            return;
          }
          // Brief wait between checks (total: 20 * 50ms = 1 second max)
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Priority 2: Zustand persisted database
        if (currentDbName) {
          const dbInstance = await Database.newDatabase(currentDbName);
          setDb(dbInstance);
          (window as any).testDb = dbInstance;
          return;
        }

        // Priority 3: Auto-create for pages that need a database
        const autoDb = await Database.newDatabase('database.db');
        setDb(autoDb);
        (window as any).testDb = autoDb;
      } catch (err) {
        console.error('Failed to ensure database:', err);
      }
    }

    ensureDatabase();
  }, [wasmReady, _hasHydrated, db, currentDbName, setDb]);

  return {
    db,
    isReady: wasmReady && _hasHydrated,
  };
}
