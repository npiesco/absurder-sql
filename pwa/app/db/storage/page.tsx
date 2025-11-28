'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDatabaseStore } from '@/lib/db/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, Table, List, HardDrive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TableInfo {
  name: string;
  rowCount: number;
  size: number;
}

interface IndexInfo {
  name: string;
  tableName: string;
  size: number;
}

function StorageAnalysisContent() {
  const { db, _hasHydrated, setDb } = useDatabaseStore();
  const currentDbName = useDatabaseStore((state) => state.currentDbName);

  // Track window.testDb for E2E tests
  const [windowTestDb, setWindowTestDb] = useState<any>(null);
  const activeDb = db || windowTestDb;

  const [loading, setLoading] = useState(false);
  const [dbSize, setDbSize] = useState<number>(0);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [indexes, setIndexes] = useState<IndexInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize WASM and expose testDb globally for E2E tests
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Wait for Zustand hydration before attempting database restoration
    if (!_hasHydrated) return;

    async function initializeWasm() {
      try {
        // ALWAYS initialize WASM first, even if db exists
        const init = (await import('@npiesco/absurder-sql')).default;
        await init();

        // Then expose Database class
        const { Database } = await import('@npiesco/absurder-sql');
        (window as any).Database = Database;

        // If db exists from Zustand, expose it as testDb
        if (db) {
          // Add .db property pointing to itself for test compatibility (only if not already set)
          if (!(db as any).db) (db as any).db = db;
          (window as any).testDb = db;
        } else if (currentDbName) {
          // Restore database from storage if currentDbName exists
          console.log('[StoragePage] Restoring database from currentDbName:', currentDbName);
          const dbInstance = await Database.newDatabase(currentDbName);
          // Add .db property pointing to itself for test compatibility (only if not already set)
          if (!(dbInstance as any).db) (dbInstance as any).db = dbInstance;
          setDb(dbInstance);
          (window as any).testDb = dbInstance;
          console.log('[StoragePage] Database restored successfully');
        }
      } catch (err: any) {
        console.error('Failed to initialize WASM:', err);
      }
    }

    initializeWasm();
  }, [db, currentDbName, _hasHydrated, setDb]);

  // Sync window.testDb to component state (for E2E tests)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkTestDb = () => {
      const testDb = (window as any).testDb;
      if (testDb && !windowTestDb) {
        setWindowTestDb(testDb);
      }
    };

    // Check immediately
    checkTestDb();

    // Also check periodically in case testDb is set after component mounts
    const interval = setInterval(checkTestDb, 50);

    return () => clearInterval(interval);
  }, [windowTestDb]);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 bytes';
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const calculatePageSize = async (): Promise<number> => {
    try {
      if (!activeDb) {
        return 4096; // Default SQLite page size
      }

      const result = await activeDb.execute('PRAGMA page_size');
      if (result.rows && result.rows.length > 0) {
        const val = result.rows[0].values[0];
        return (val as any).value as number;
      }
      return 4096;
    } catch (err) {
      return 4096;
    }
  };

  const calculateTableSize = async (tableName: string): Promise<number> => {
    try {
      if (!activeDb) return 0;

      // Get page count for the table
      const pageSize = await calculatePageSize();

      // Query the internal SQLite table for page counts
      const result = await activeDb.execute(
        `SELECT SUM(pgsize) as size FROM dbstat WHERE name='${tableName}'`
      );

      if (result.rows && result.rows.length > 0) {
        const val = result.rows[0].values[0];
        if ((val as any).value) {
          return (val as any).value as number;
        }
      }

      // Fallback: estimate based on row count
      const countResult = await activeDb.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
      if (countResult.rows && countResult.rows.length > 0) {
        const rowCount = (countResult.rows[0].values[0] as any).value as number;
        // Rough estimate: 100 bytes per row minimum
        return rowCount * 100;
      }

      return 0;
    } catch (err) {
      // Fallback estimation
      try {
        const countResult = await activeDb!.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        if (countResult.rows && countResult.rows.length > 0) {
          const rowCount = (countResult.rows[0].values[0] as any).value as number;
          return rowCount * 100; // Estimate 100 bytes per row
        }
      } catch (fallbackErr) {
        // Silent failure
      }
      return 0;
    }
  };

  const calculateIndexSize = async (indexName: string): Promise<number> => {
    try {
      if (!activeDb) return 0;

      // Try to get index size from dbstat
      const result = await activeDb.execute(
        `SELECT SUM(pgsize) as size FROM dbstat WHERE name='${indexName}'`
      );

      if (result.rows && result.rows.length > 0) {
        const val = result.rows[0].values[0];
        if ((val as any).value) {
          return (val as any).value as number;
        }
      }

      // Fallback: estimate based on indexed table row count
      return 1024; // Minimum 1KB estimate for indexes
    } catch (err) {
      return 1024; // Default estimate
    }
  };

  const loadStorageInfo = useCallback(async () => {
    if (!activeDb) {
      setError('No database connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get all tables
      const tablesResult = await activeDb.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );

      const tableInfoPromises = tablesResult.rows.map(async (row: any) => {
        const tableName = (row.values[0] as any).value as string;

        // Get row count
        const countResult = await activeDb.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        const rowCount = (countResult.rows[0].values[0] as any).value as number;

        // Calculate size
        const size = await calculateTableSize(tableName);

        return {
          name: tableName,
          rowCount,
          size,
        };
      });

      const tableInfos = await Promise.all(tableInfoPromises);
      setTables(tableInfos);

      // Get all indexes
      const indexesResult = await activeDb.execute(
        "SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
      );

      const indexInfoPromises = indexesResult.rows.map(async (row: any) => {
        const indexName = (row.values[0] as any).value as string;
        const tableName = (row.values[1] as any).value as string;
        const size = await calculateIndexSize(indexName);

        return {
          name: indexName,
          tableName,
          size,
        };
      });

      const indexInfos = await Promise.all(indexInfoPromises);
      setIndexes(indexInfos);

      // Calculate total database size
      const totalTableSize = tableInfos.reduce((sum: number, table: TableInfo) => sum + table.size, 0);
      const totalIndexSize = indexInfos.reduce((sum: number, index: IndexInfo) => sum + index.size, 0);
      const totalSize = totalTableSize + totalIndexSize;

      setDbSize(totalSize > 0 ? totalSize : 8192); // Minimum SQLite database is 8KB

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load storage information');
    } finally {
      setLoading(false);
    }
  }, [activeDb]);

  useEffect(() => {
    if (activeDb) {
      loadStorageInfo();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDb]);

  const handleRefresh = () => {
    loadStorageInfo();
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Storage Analysis</h1>
          <p className="text-muted-foreground">
            Analyze database storage usage and optimize performance
          </p>
        </div>
        <Button
          id="refreshStorageButton"
          onClick={handleRefresh}
          disabled={loading}
          variant="outline"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Database Size Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Size
          </CardTitle>
          <CardDescription>Total storage used by the database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold" data-testid="db-size">
            {formatSize(dbSize)}
          </div>
        </CardContent>
      </Card>

      {/* Tables Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            Tables
          </CardTitle>
          <CardDescription>Storage breakdown by table</CardDescription>
        </CardHeader>
        <CardContent>
          {tables.length === 0 ? (
            <p className="text-muted-foreground">No tables found in this database.</p>
          ) : (
            <div className="space-y-4">
              {tables.map((table) => (
                <div
                  key={table.name}
                  data-table={table.name}
                  data-table-name={table.name}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                >
                  <div className="flex-1">
                    <div className="font-medium">{table.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {table.rowCount} {table.rowCount === 1 ? 'row' : 'rows'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium table-size" data-testid="table-size">
                      {formatSize(table.size)}
                    </div>
                    <Badge variant="secondary" className="mt-1">
                      <HardDrive className="h-3 w-3 mr-1" />
                      Table
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Indexes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Indexes
          </CardTitle>
          <CardDescription>Storage used by indexes</CardDescription>
        </CardHeader>
        <CardContent>
          {indexes.length === 0 ? (
            <p className="text-muted-foreground">No indexes found in this database.</p>
          ) : (
            <div className="space-y-4">
              {indexes.map((index) => (
                <div
                  key={index.name}
                  data-index={index.name}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                >
                  <div className="flex-1">
                    <div className="font-medium">{index.name}</div>
                    <div className="text-sm text-muted-foreground">
                      on table: {index.tableName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium index-size" data-testid="index-size">
                      {formatSize(index.size)}
                    </div>
                    <Badge variant="secondary" className="mt-1">
                      <List className="h-3 w-3 mr-1" />
                      Index
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function StorageAnalysisPage() {
  const currentDbName = useDatabaseStore((state) => state.currentDbName);
  
  // Don't render until we have a database name from the store
  if (!currentDbName) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center text-gray-600">
          No database selected. Please create or open a database first.
        </div>
      </div>
    );
  }
  
  return <StorageAnalysisContent />;
}
