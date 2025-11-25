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

interface GrepResult {
  tableName: string;
  columnName: string;
  rowId: number;
  matchedValue: any;
  rowData: Record<string, any>;
}

const MAX_RESULTS = 1000; // Performance limit

function DataGrepContent() {
  const { db, _hasHydrated, setDb } = useDatabaseStore();
  const currentDbName = useDatabaseStore((state) => state.currentDbName);

  // Track window.testDb for E2E tests
  const [windowTestDb, setWindowTestDb] = useState<any>(null);
  const activeDb = db || windowTestDb;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GrepResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [resultLimit, setResultLimit] = useState(false);

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
          // Add .db property pointing to itself for test compatibility
          (db as any).db = db;
          (window as any).testDb = db;
        } else if (currentDbName) {
          // Restore database from storage if currentDbName exists
          console.log('[GrepPage] Restoring database from currentDbName:', currentDbName);
          const dbInstance = await Database.newDatabase(currentDbName);
          // Add .db property pointing to itself for test compatibility
          (dbInstance as any).db = dbInstance;
          setDb(dbInstance);
          (window as any).testDb = dbInstance;
          console.log('[GrepPage] Database restored successfully');
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

  const performSearch = async () => {
    if (!activeDb) {
      setSearchError('Database not initialized');
      return;
    }

    if (!searchQuery.trim()) {
      setSearchError('Please enter a value to search');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setShowResults(true);
    setResultLimit(false);
    const results: GrepResult[] = [];

    try {
      // Get all tables
      const tablesResult = await activeDb.execute(`
        SELECT name FROM sqlite_master
        WHERE type='table'
        AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);

      const tables = tablesResult.rows.map((row: any) => getValue(row.values[0]) as string);
      const searchLower = searchQuery.toLowerCase();

      // Search each table
      for (const tableName of tables) {
        if (results.length >= MAX_RESULTS) {
          setResultLimit(true);
          break;
        }

        // Get column names
        const columnsResult = await activeDb.execute(`PRAGMA table_info(${tableName})`);
        const columns = columnsResult.rows.map((row: any) => getValue(row.values[1]) as string);

        // Get all rows from this table
        const dataResult = await activeDb.execute(`SELECT rowid, * FROM ${tableName}`);

        // Search through each row
        for (const row of dataResult.rows) {
          if (results.length >= MAX_RESULTS) {
            setResultLimit(true);
            break;
          }

          const rowId = getValue(row.values[0]) as number;
          const rowData: Record<string, any> = {};

          // Check each column value
          for (let i = 0; i < columns.length; i++) {
            const columnName = columns[i];
            const value = getValue(row.values[i + 1]); // +1 because rowid is first
            rowData[columnName] = value;

            // Convert value to string for searching
            const valueStr = value === null ? 'null' : String(value).toLowerCase();
            
            // Check if value matches (case-insensitive substring match)
            if (valueStr.includes(searchLower)) {
              results.push({
                tableName,
                columnName,
                rowId,
                matchedValue: value,
                rowData,
              });
            }
          }
        }
      }

      setSearchResults(results);
    } catch (err) {
      console.error('Data grep search error:', err);
      setSearchError(`Search failed: ${String(err)}`);
    } finally {
      setIsSearching(false);
    }
  };

  const clearResults = () => {
    setSearchResults([]);
    setShowResults(false);
    setSearchError(null);
    setResultLimit(false);
  };

  if (!currentDbName || !activeDb) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p>No database selected. Please create or load a database first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Grep</CardTitle>
          <CardDescription>
            Search for any value across all tables and columns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="searchInput" className="text-sm font-medium">
              Search Value
            </label>
            <Input
              id="searchInput"
              placeholder="Search for a value across all columns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  performSearch();
                }
              }}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={performSearch}
              disabled={!searchQuery.trim() || isSearching}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
            {showResults && (
              <Button
                variant="outline"
                onClick={clearResults}
                disabled={isSearching}
              >
                Clear
              </Button>
            )}
          </div>

          {searchError && (
            <div className="text-red-600 text-sm">
              {searchError}
            </div>
          )}
        </CardContent>
      </Card>

      {showResults && (
        <Card>
          <CardHeader>
            <CardTitle>
              Results
              {searchResults.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                  {resultLimit && ' - limited to first 1000'})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {searchResults.length === 0 ? (
              <p className="text-muted-foreground">No results found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table</TableHead>
                      <TableHead>Column</TableHead>
                      <TableHead>Row ID</TableHead>
                      <TableHead>Matched Value</TableHead>
                      <TableHead>Row Context</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((result, index) => (
                      <TableRow key={index} data-testid="grep-result">
                        <TableCell>
                          <Link
                            href={`/db/designer?table=${encodeURIComponent(result.tableName)}`}
                            className="text-blue-600 hover:underline"
                          >
                            {result.tableName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{result.columnName}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {result.rowId}
                        </TableCell>
                        <TableCell className="font-mono text-sm max-w-xs truncate">
                          {result.matchedValue === null
                            ? <span className="text-muted-foreground">NULL</span>
                            : String(result.matchedValue)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-md">
                          <div className="truncate">
                            {Object.entries(result.rowData)
                              .slice(0, 3)
                              .map(([key, value]) => `${key}: ${value === null ? 'NULL' : String(value)}`)
                              .join(', ')}
                            {Object.keys(result.rowData).length > 3 && '...'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function DataGrepPage() {
  const currentDbName = useDatabaseStore((state) => state.currentDbName);
  
  return <DataGrepContent />;
}
