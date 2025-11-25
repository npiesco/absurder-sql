'use client';

import React, { useState, useEffect } from 'react';
import { DatabaseProvider, useDatabase } from '@/lib/db/provider';
import { useDatabaseStore } from '@/lib/db/store';
import { useSearchStore } from '@/lib/db/search-store';
import { Database } from '@npiesco/absurder-sql';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

interface SearchResult {
  table: string;
  column: string;
  rowId: number;
  value: string;
  matchedText: string;
  context: Record<string, any>;
}

function SearchPageContent() {
  const { db, loading, error } = useDatabase();
  const { _hasHydrated, setDb } = useDatabaseStore();
  const currentDbName = useDatabaseStore((state) => state.currentDbName);

  // Track window.testDb for E2E tests
  const [windowTestDb, setWindowTestDb] = useState<any>(null);
  const activeDb = db || windowTestDb;

  // Use Zustand store for table state (enterprise event-based state management)
  const { availableTables, selectedTables, setAvailableTables, setSelectedTables } = useSearchStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [resultCount, setResultCount] = useState(0);

  // Search options
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [exactMatch, setExactMatch] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [searchScope, setSearchScope] = useState<'all' | 'selected'>('all');

  const [showResults, setShowResults] = useState(false);

  // Store local state in refs for direct access (bypass React render cycles)
  const showResultsRef = React.useRef(showResults);
  const isSearchingRef = React.useRef(isSearching);
  showResultsRef.current = showResults;
  isSearchingRef.current = isSearching;

  // Initialize WASM for E2E tests
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
          console.log('[SearchPage] Restoring database from currentDbName:', currentDbName);
          const dbInstance = await Database.newDatabase(currentDbName);
          // Add .db property pointing to itself for test compatibility
          (dbInstance as any).db = dbInstance;
          setDb(dbInstance);
          (window as any).testDb = dbInstance;
          console.log('[SearchPage] Database restored successfully');
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

  // Expose search state to window for E2E tests - reads DIRECTLY from Zustand and refs
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).getSearchState = () => {
        const zustandState = useSearchStore.getState();
        return {
          availableTables: zustandState.availableTables,
          selectedTables: zustandState.selectedTables,
          showResults: showResultsRef.current,
          executing: isSearchingRef.current,
        };
      };
    }
  }, []); // Only set once - function reads fresh state every time

  const loadTables = React.useCallback(async () => {
    if (!activeDb) return;

    try {
      const result = await activeDb.execute(`
        SELECT name FROM sqlite_master
        WHERE type='table'
        AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);

      const tables = result.rows.map(row => getValue(row.values[0]) as string);
      setAvailableTables(tables);
      setSelectedTables(tables); // Select all by default
    } catch (err) {
      console.error('Error loading tables:', err);
    }
  }, [activeDb, setAvailableTables, setSelectedTables]);

  // Expose testDb, Database class, reloadSearchTables, and Zustand store subscribe for event-based testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).testDb = activeDb;
      (window as any).reloadSearchTables = loadTables;
      // Use separate name to avoid overwriting getSearchState from line 79
      (window as any).getZustandSearchState = () => useSearchStore.getState();
      (window as any).subscribeToSearchStore = useSearchStore.subscribe;

      // Expose Database class synchronously for programmatic DB creation in tests
      (window as any).Database = Database;
    }
  }, [activeDb, loadTables]);

  // Initialize database and load tables
  useEffect(() => {
    if (activeDb && currentDbName) {
      loadTables();
    }
  }, [activeDb, currentDbName, loadTables]);

  // Set data attribute when tables are loaded and component has rendered (for testing)
  useEffect(() => {
    if (typeof window !== 'undefined' && availableTables.length > 0) {
      document.body.setAttribute('data-search-tables-ready', 'true');
    }
  }, [availableTables]);

  const performSearch = async () => {
    if (!activeDb || !searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setShowResults(false);

    try {
      const results: SearchResult[] = [];

      // CRITICAL: Always read fresh state from Zustand to avoid closure staleness
      const freshState = useSearchStore.getState();
      const tablesToSearch = searchScope === 'all' ? freshState.availableTables : freshState.selectedTables;

      console.log('[SEARCH] Executing search:', {
        searchScope,
        query: searchQuery,
        availableCount: freshState.availableTables.length,
        selectedCount: freshState.selectedTables.length,
        tablesToSearchCount: tablesToSearch.length,
        tablesToSearch
      });

      for (const tableName of tablesToSearch) {
        console.log('[SEARCH] Processing table:', tableName, 'type:', typeof tableName);
        // Get table columns
        const tableInfo = await activeDb.execute(`PRAGMA table_info(${tableName})`);
        const columns = tableInfo.rows.map(row => ({
          name: getValue(row.values[1]) as string,
          type: getValue(row.values[2]) as string,
        }));

        // Get primary key column for row ID
        const pkColumn = columns.find(col => col.name === 'id' || col.name === 'rowid') || columns[0];

        // Search each column
        for (const column of columns) {
          // Skip binary or blob columns
          if (column.type.toUpperCase() === 'BLOB') continue;

          let sql: string;
          const searchValue = searchQuery;

          if (useRegex) {
            // SQLite doesn't support REGEXP by default, so we'll fetch all rows and filter in JS
            sql = `SELECT * FROM ${tableName}`;
          } else if (exactMatch) {
            if (caseSensitive) {
              sql = `SELECT * FROM ${tableName} WHERE ${column.name} = '${searchValue.replace(/'/g, "''")}'`;
            } else {
              sql = `SELECT * FROM ${tableName} WHERE LOWER(${column.name}) = LOWER('${searchValue.replace(/'/g, "''")}')`;  
            }
          } else {
            if (caseSensitive) {
              // SQLite LIKE is case-insensitive, use GLOB for case-sensitive, but GLOB uses * instead of %
              // Easier to fetch all and filter in JS for case-sensitive partial match
              sql = `SELECT * FROM ${tableName}`;
            } else {
              sql = `SELECT * FROM ${tableName} WHERE LOWER(${column.name}) LIKE LOWER('%${searchValue.replace(/'/g, "''")}%')`;
            }
          }

          try {
            console.log('[SEARCH] Executing SQL:', sql);
            const result = await activeDb.execute(sql);
            console.log('[SEARCH] SQL succeeded, rows:', result.rows.length);
            
            // Find column indices in result
            const pkColIndex = result.columns.indexOf(pkColumn.name);
            const searchColIndex = result.columns.indexOf(column.name);
            
            for (const row of result.rows) {
              const columnValue = String(getValue(row.values[searchColIndex]) || '');
              const rowId = getValue(row.values[pkColIndex]) as number;

              // For regex search, filter in JavaScript
              if (useRegex) {
                try {
                  const regex = new RegExp(searchValue, caseSensitive ? '' : 'i');
                  if (!regex.test(columnValue)) {
                    continue;
                  }
                } catch (regexError) {
                  setSearchError('Invalid regex pattern');
                  setIsSearching(false);
                  return;
                }
              }

              // For case-sensitive partial match, filter in JavaScript
              if (!useRegex && !exactMatch && caseSensitive) {
                if (!columnValue.includes(searchValue)) {
                  continue;
                }
              }

              // Build context from all columns
              const context: Record<string, any> = {};
              for (let i = 0; i < result.columns.length; i++) {
                const colName = result.columns[i];
                const colValue = getValue(row.values[i]);
                context[colName] = colValue;
              }

              results.push({
                table: tableName,
                column: column.name,
                rowId,
                value: columnValue,
                matchedText: searchValue,
                context,
              });
            }
          } catch (colError) {
            console.error(`Error searching column ${column.name} in ${tableName}:`, colError);
          }
        }
      }

      setSearchResults(results);
      setResultCount(results.length);
      setShowResults(true);
      
      console.log('[SEARCH] Completed successfully:', {
        resultCount: results.length,
        showResults: true
      });
    } catch (error) {
      console.error('[SEARCH] Error:', error);
      setSearchError(error instanceof Error ? error.message : 'Search failed');
      setShowResults(true); // Show results even on error so tests can proceed
    } finally {
      setIsSearching(false);
    }
  };

  const handleExportResults = () => {
    if (searchResults.length === 0) return;

    const csvHeader = 'Table,Column,Row ID,Value\n';
    const csvRows = searchResults.map(result => 
      `"${result.table}","${result.column}",${result.rowId},"${result.value.replace(/"/g, '""')}"`
    ).join('\n');

    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearResults = () => {
    setSearchResults([]);
    setShowResults(false);
    setResultCount(0);
    setSearchError(null);
  };

  const highlightMatch = (text: string, searchTerm: string): React.ReactElement => {
    if (!searchTerm || !text) return <span>{text}</span>;

    let parts: React.ReactElement[];
    
    if (useRegex) {
      try {
        const regex = new RegExp(`(${searchTerm})`, caseSensitive ? 'g' : 'gi');
        const splitParts = text.split(regex);
        parts = splitParts.map((part, index) => {
          if (regex.test(part)) {
            return <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">{part}</mark>;
          }
          return <span key={index}>{part}</span>;
        });
      } catch {
        return <span>{text}</span>;
      }
    } else if (exactMatch) {
      if (caseSensitive ? text === searchTerm : text.toLowerCase() === searchTerm.toLowerCase()) {
        return <mark className="bg-yellow-200 dark:bg-yellow-800">{text}</mark>;
      }
      return <span>{text}</span>;
    } else {
      const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, caseSensitive ? 'g' : 'gi');
      const splitParts = text.split(regex);
      parts = splitParts.map((part, index) => {
        const matches = caseSensitive ? part === searchTerm : part.toLowerCase() === searchTerm.toLowerCase();
        if (matches) {
          return <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">{part}</mark>;
        }
        return <span key={index}>{part}</span>;
      });
    }

    return <>{parts}</>;
  };

  const toggleTableSelection = (tableName: string) => {
    if (selectedTables.includes(tableName)) {
      setSelectedTables(selectedTables.filter((t: string) => t !== tableName));
    } else {
      setSelectedTables([...selectedTables, tableName]);
    }
  };

  if (loading) {
    return <div className="p-8">Loading database...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {String(error)}</div>;
  }

  if (!currentDbName) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>No Database Selected</CardTitle>
            <CardDescription>
              Please create or load a database from the database management page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Full-Text Search</h1>
        <p className="text-muted-foreground">
          Search for data across all tables and columns in your database
        </p>
      </div>

      {/* Search Input */}
      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
          <CardDescription>Enter your search query</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              id="searchInput"
              type="text"
              placeholder="Search for data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  performSearch();
                }
              }}
              className="flex-1"
            />
            <Button
              id="searchButton"
              onClick={performSearch}
              disabled={!searchQuery.trim() || isSearching}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
            {showResults && (
              <Button
                id="clearResults"
                variant="outline"
                onClick={handleClearResults}
              >
                Clear
              </Button>
            )}
          </div>

          {/* Search Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="caseSensitive"
                checked={caseSensitive}
                onCheckedChange={(checked) => setCaseSensitive(checked as boolean)}
              />
              <Label htmlFor="caseSensitive" className="text-sm font-normal">
                Case-sensitive
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="exactMatch"
                checked={exactMatch}
                onCheckedChange={(checked) => setExactMatch(checked as boolean)}
              />
              <Label htmlFor="exactMatch" className="text-sm font-normal">
                Exact match
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="useRegex"
                checked={useRegex}
                onCheckedChange={(checked) => setUseRegex(checked as boolean)}
              />
              <Label htmlFor="useRegex" className="text-sm font-normal">
                Regex pattern
              </Label>
            </div>
          </div>

          {/* Search Scope */}
          <div className="space-y-3 pt-4 border-t">
            <Label htmlFor="searchScope">Search Scope</Label>
            <Select
              value={searchScope}
              onValueChange={(value: 'all' | 'selected') => setSearchScope(value)}
            >
              <SelectTrigger id="searchScope">
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tables</SelectItem>
                <SelectItem value="selected">Selected tables</SelectItem>
              </SelectContent>
            </Select>

            {searchScope === 'selected' && (
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                <Label className="text-sm font-medium">Select Tables</Label>
                {availableTables.map((table) => (
                  <div key={table} className="flex items-center space-x-2">
                    <Checkbox
                      id={`table-${table}`}
                      value={table}
                      checked={selectedTables.includes(table)}
                      onCheckedChange={() => toggleTableSelection(table)}
                    />
                    <Label
                      htmlFor={`table-${table}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {table}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Error */}
      {searchError && (
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <p className="text-red-600">{searchError}</p>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {showResults && (
        <Card id="searchResults" data-testid="search-results">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Search Results</CardTitle>
                <CardDescription id="resultCount">
                  {resultCount} {resultCount === 1 ? 'result' : 'results'} found
                </CardDescription>
              </div>
              {resultCount > 0 && (
                <Button
                  id="exportResults"
                  variant="outline"
                  onClick={handleExportResults}
                >
                  Export Results
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {resultCount === 0 ? (
              <p className="text-muted-foreground">No results found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead data-column="table">Table</TableHead>
                      <TableHead data-column="column">Column</TableHead>
                      <TableHead data-column="rowId">Row ID</TableHead>
                      <TableHead>Matched Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell className="result-table">{result.table}</TableCell>
                        <TableCell className="result-column">{result.column}</TableCell>
                        <TableCell className="row-id">{result.rowId}</TableCell>
                        <TableCell className="max-w-md truncate">
                          {highlightMatch(result.value, result.matchedText)}
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

export default function SearchPage() {
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

  return (
    <DatabaseProvider dbName={currentDbName}>
      <SearchPageContent />
    </DatabaseProvider>
  );
}
