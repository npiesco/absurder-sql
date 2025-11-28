'use client';

import React, { useState, useEffect } from 'react';
import { useDatabaseStore } from '@/lib/db/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { QueryResult } from '@/lib/db/client';

// Define ColumnValue type based on WASM package
type ColumnValue = 
  | { type: "Null" } 
  | { type: "Integer"; value: number } 
  | { type: "Real"; value: number } 
  | { type: "Text"; value: string } 
  | { type: "Blob"; value: number[] } 
  | { type: "Date"; value: number } 
  | { type: "BigInt"; value: string };

// Helper to safely extract value from ColumnValue
const getValue = (col: ColumnValue): any => {
  if (col.type === 'Null') return null;
  return (col as any).value;
};

interface ColumnInfo {
  tableName: string;
  columnName: string;
  columnType: string;
  notNull: boolean;
  defaultValue: string | null;
  primaryKey: boolean;
  unique: boolean;
}

function ColumnFinderContent() {
  const { db, _hasHydrated, setDb } = useDatabaseStore();
  const currentDbName = useDatabaseStore((state) => state.currentDbName);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ColumnInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Track window.testDb for E2E tests
  const [windowTestDb, setWindowTestDb] = useState<any>(null);

  // For E2E tests: check both Zustand store and window.testDb
  const activeDb = db || windowTestDb;

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
          console.log('[ColumnsPage] Restoring database from currentDbName:', currentDbName);
          const dbInstance = await Database.newDatabase(currentDbName);
          // Add .db property pointing to itself for test compatibility (only if not already set)
          if (!(dbInstance as any).db) (dbInstance as any).db = dbInstance;
          setDb(dbInstance);
          (window as any).testDb = dbInstance;
          console.log('[ColumnsPage] Database restored successfully');
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
        console.log('[COLUMNS] Detected window.testDb, updating state');
        setWindowTestDb(testDb);
      }
    };

    // Check immediately
    checkTestDb();

    // Also check periodically in case testDb is set after component mounts
    const interval = setInterval(checkTestDb, 50);

    return () => clearInterval(interval);
  }, [windowTestDb]);

  const performSearch = async () => {
    if (!activeDb) {
      setSearchError('Database not initialized');
      return;
    }

    if (!searchQuery.trim()) {
      setSearchError('Please enter a column name to search');
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    setShowResults(true);
    const results: ColumnInfo[] = [];

    try {
      // Get all tables
      const tablesResult = await activeDb.execute(`
        SELECT name FROM sqlite_master
        WHERE type='table'
        AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);

      const tables = tablesResult.rows.map((row: any) => getValue(row.values[0]) as string);

      // Search each table for columns matching the query
      for (const tableName of tables) {
        // Get column info using PRAGMA table_info
        const columnsResult = await activeDb.execute(`PRAGMA table_info(${tableName})`);

        // Get unique constraints
        const indexesResult = await activeDb.execute(`PRAGMA index_list(${tableName})`);
        const uniqueColumns = new Set<string>();

        for (const idxRow of indexesResult.rows) {
          const indexName = getValue(idxRow.values[1]) as string;
          const unique = getValue(idxRow.values[2]) === 1;

          if (unique) {
            const indexInfoResult = await activeDb.execute(`PRAGMA index_info(${indexName})`);
            for (const colRow of indexInfoResult.rows) {
              const colName = getValue(colRow.values[2]) as string;
              uniqueColumns.add(colName);
            }
          }
        }

        // Filter columns by search query (case-insensitive)
        const searchLower = searchQuery.toLowerCase();
        
        for (const row of columnsResult.rows) {
          const columnName = getValue(row.values[1]) as string;
          const columnType = getValue(row.values[2]) as string;
          const notNull = getValue(row.values[3]) === 1;
          const defaultValue = getValue(row.values[4]) as string | null;
          const primaryKey = getValue(row.values[5]) === 1;
          
          // Check if column name matches search query (case-insensitive, partial match)
          if (columnName.toLowerCase().includes(searchLower)) {
            results.push({
              tableName,
              columnName,
              columnType,
              notNull,
              defaultValue,
              primaryKey,
              unique: uniqueColumns.has(columnName) && !primaryKey,
            });
          }
        }
      }

      setSearchResults(results);
    } catch (err) {
      console.error('Column finder search error:', err);
      setSearchError(`Search failed: ${String(err)}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setSearchResults([]);
    setShowResults(false);
    setSearchQuery('');
    setSearchError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      performSearch();
    }
  };

  if (!currentDbName || !activeDb) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>No Database Selected</CardTitle>
            <CardDescription>
              Please create or open a database to use the column finder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/db">
              <Button>Go to Database Management</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Column Finder</h1>
      <Card>
        <CardHeader>
          <CardTitle>Search Columns</CardTitle>
          <CardDescription>
            Search for columns by name across all tables in {currentDbName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Search for column name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={performSearch} 
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
            {showResults && (
              <Button 
                onClick={handleClear} 
                variant="outline"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Error Display */}
          {searchError && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md">
              {searchError}
            </div>
          )}

          {/* Results Display */}
          {showResults && !searchError && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {searchResults.length} {searchResults.length === 1 ? 'column' : 'columns'} found
                </p>
              </div>

              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No columns found matching &quot;{searchQuery}&quot;
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Table</TableHead>
                        <TableHead>Column Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Constraints</TableHead>
                        <TableHead>Default</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.map((result, index) => (
                        <TableRow key={`${result.tableName}-${result.columnName}-${index}`} className="column-result" data-testid="column-result">
                          <TableCell>
                            <Link 
                              href={`/db/designer?table=${encodeURIComponent(result.tableName)}`}
                              className="text-blue-600 hover:underline"
                            >
                              {result.tableName}
                            </Link>
                          </TableCell>
                          <TableCell className="font-mono">
                            {result.columnName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{result.columnType}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {result.primaryKey && (
                                <Badge variant="default">PRIMARY KEY</Badge>
                              )}
                              {result.unique && (
                                <Badge variant="outline">UNIQUE</Badge>
                              )}
                              {result.notNull && !result.primaryKey && (
                                <Badge variant="outline">NOT NULL</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {result.defaultValue ? (
                              <span className="text-muted-foreground">
                                DEFAULT {result.defaultValue}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Use</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>• Enter a column name or partial name to search across all tables</p>
          <p>• Search is case-insensitive and supports partial matches</p>
          <p>• Click on a table name to view its full schema in the designer</p>
          <p>• Results show column type, constraints, and default values</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ColumnFinderPage() {
  const currentDbName = useDatabaseStore((state) => state.currentDbName);

  return <ColumnFinderContent />;
}
