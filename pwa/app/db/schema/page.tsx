'use client';

import { useState, useEffect } from 'react';
import { useDatabaseStore } from '@/lib/db/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TableInfo {
  name: string;
  rowCount?: number;
}

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

interface IndexInfo {
  name: string;
  unique: number;
  origin: string;
  partial: number;
}

function SchemaViewerContent() {
  const { db, _hasHydrated, setDb } = useDatabaseStore();
  const currentDbName = useDatabaseStore((state) => state.currentDbName);
  const [windowTestDb, setWindowTestDb] = useState<any>(null);
  const activeDb = db || windowTestDb;
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [indexes, setIndexes] = useState<IndexInfo[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [errorDisplay, setErrorDisplay] = useState('');
  
  const [createTableOpen, setCreateTableOpen] = useState(false);
  const [tableName, setTableName] = useState('');
  const [columnDefs, setColumnDefs] = useState('');
  
  const [createIndexOpen, setCreateIndexOpen] = useState(false);
  const [indexName, setIndexName] = useState('');
  const [indexColumns, setIndexColumns] = useState('');

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
          console.log('[SchemaPage] Restoring database from currentDbName:', currentDbName);
          const dbInstance = await Database.newDatabase(currentDbName);
          // Add .db property pointing to itself for test compatibility
          (dbInstance as any).db = dbInstance;
          setDb(dbInstance);
          (window as any).testDb = dbInstance;
          console.log('[SchemaPage] Database restored successfully');
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
        console.log('[SCHEMA] Detected window.testDb, updating state');
        setWindowTestDb(testDb);
      }
    };

    // Check immediately
    checkTestDb();

    // Also check periodically in case testDb is set after component mounts
    const interval = setInterval(checkTestDb, 50);

    return () => clearInterval(interval);
  }, [windowTestDb]);

  const getValue = (col: any): any => {
    return col.type === 'Null' ? null : col.value;
  };

  const refreshTables = async () => {
    if (!activeDb) return;

    try {
      const result = await activeDb.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      );
      
      const tableList: TableInfo[] = await Promise.all(
        result.rows.map(async (row: any) => {
          const tableName = getValue(row.values[0]) as string || '';
          
          // Get row count for each table
          try {
            const countResult = await activeDb.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
            const rowCount = getValue(countResult.rows[0].values[0]) as number || 0;
            return { name: tableName, rowCount };
          } catch {
            return { name: tableName, rowCount: 0 };
          }
        })
      );
      
      setTables(tableList);
      setStatus('Tables refreshed');
      setErrorDisplay('');
    } catch (err: any) {
      setErrorDisplay(`Error loading tables: ${err.message}`);
    }
  };

  const selectTable = async (tableName: string) => {
    if (!activeDb) return;

    setSelectedTable(tableName);

    try {
      // Get column info
      const colResult = await activeDb.execute(`PRAGMA table_info(${tableName})`);
      const cols: ColumnInfo[] = colResult.rows.map((row: any) => ({
        cid: getValue(row.values[0]) as number,
        name: getValue(row.values[1]) as string,
        type: getValue(row.values[2]) as string,
        notnull: getValue(row.values[3]) as number,
        dflt_value: getValue(row.values[4]),
        pk: getValue(row.values[5]) as number,
      }));
      setColumns(cols);

      // Get indexes
      const idxResult = await activeDb.execute(`PRAGMA index_list(${tableName})`);
      const idxs: IndexInfo[] = idxResult.rows.map((row: any) => ({
        name: getValue(row.values[1]) as string,
        unique: getValue(row.values[2]) as number,
        origin: getValue(row.values[3]) as string,
        partial: getValue(row.values[4]) as number,
      }));
      setIndexes(idxs);

      // Get preview data (first 5 rows)
      const previewResult = await activeDb.execute(`SELECT * FROM ${tableName} LIMIT 5`);
      setPreviewData(previewResult);
      
      setErrorDisplay('');
    } catch (err: any) {
      setErrorDisplay(`Error loading table details: ${err.message}`);
    }
  };

  const handleCreateTable = async () => {
    if (!activeDb || !tableName.trim() || !columnDefs.trim()) {
      console.log('Create table validation failed:', { db: !!db, tableName, columnDefs });
      return;
    }

    try {
      const sql = `CREATE TABLE ${tableName} (${columnDefs})`;
      console.log('Executing create table:', sql);
      await activeDb.execute(sql);
      console.log('Table created successfully');
      setStatus(`Table created: ${tableName}`);
      setCreateTableOpen(false);
      setTableName('');
      setColumnDefs('');
      setErrorDisplay('');
      await refreshTables();
    } catch (err: any) {
      console.error('Create table error:', err);
      setErrorDisplay(`Error creating table: ${err.message}`);
    }
  };

  const handleCreateIndex = async () => {
    if (!activeDb || !selectedTable || !indexName.trim() || !indexColumns.trim()) return;

    try {
      const sql = `CREATE INDEX ${indexName} ON ${selectedTable}(${indexColumns})`;
      await activeDb.execute(sql);
      setStatus(`Index created: ${indexName}`);
      setCreateIndexOpen(false);
      setIndexName('');
      setIndexColumns('');
      setErrorDisplay('');
      await selectTable(selectedTable);
    } catch (err: any) {
      setErrorDisplay(`Error creating index: ${err.message}`);
    }
  };

  return (
    <div id="schemaViewer" className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Schema Viewer</h1>

      {!activeDb && <p>No database selected. Please create or open a database first.</p>}

      <div className="mb-4">
        <p id="status" className="text-sm text-gray-600">{status || 'Ready'}</p>
      </div>

      {errorDisplay && (
        <div id="errorDisplay" className="mb-4 p-3 bg-red-50 text-red-600 rounded">
          {errorDisplay}
        </div>
      )}

      {/* Hidden input for test synchronization */}
      <input id="sqlEditor" type="hidden" />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tables</CardTitle>
            <CardDescription>Database tables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <Button id="refreshButton" onClick={refreshTables} disabled={!activeDb} size="sm">
                Refresh Tables
              </Button>
              <Dialog open={createTableOpen} onOpenChange={setCreateTableOpen}>
                <DialogTrigger asChild>
                  <Button id="createTableButton" disabled={!activeDb} size="sm" variant="outline" className="ml-2">
                    Create Table
                  </Button>
                </DialogTrigger>
                <DialogContent id="createTableDialog">
                  <DialogHeader>
                    <DialogTitle>Create New Table</DialogTitle>
                    <DialogDescription>Enter table name and column definitions</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      id="tableNameInput"
                      placeholder="table_name"
                      value={tableName}
                      onChange={(e) => setTableName(e.target.value)}
                    />
                    <Textarea
                      id="columnDefinitions"
                      placeholder="id INTEGER PRIMARY KEY, name TEXT"
                      value={columnDefs}
                      onChange={(e) => setColumnDefs(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <DialogFooter>
                    <Button id="confirmCreateTable" onClick={handleCreateTable}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div id="tablesList" className="space-y-1">
              {tables.length === 0 ? (
                <p className="text-sm text-gray-500">No tables found</p>
              ) : (
                tables.map((table) => (
                  <div
                    key={table.name}
                    className={`table-item p-2 rounded cursor-pointer hover:bg-gray-100 ${
                      selectedTable === table.name ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => selectTable(table.name)}
                  >
                    <div className="flex justify-between items-center">
                      <span>{table.name}</span>
                      <span className="row-count text-xs text-gray-500">
                        {table.rowCount !== undefined ? `${table.rowCount} rows` : ''}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Table Details</CardTitle>
            <CardDescription>
              {selectedTable ? `Details for ${selectedTable}` : 'Select a table to view details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTable ? (
              <div className="space-y-4">
                <div id="tableDetails">
                  <h3 className="font-semibold mb-2">Columns</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Constraints</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {columns.map((col) => (
                        <TableRow key={col.cid} className="column-row">
                          <TableCell className="font-mono">{col.name}</TableCell>
                          <TableCell>{col.type}</TableCell>
                          <TableCell>
                            {col.pk ? 'PRIMARY KEY ' : ''}
                            {col.notnull ? 'NOT NULL ' : ''}
                            {col.dflt_value !== null ? `DEFAULT ${col.dflt_value}` : ''}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div id="indexesList">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Indexes</h3>
                    <Dialog open={createIndexOpen} onOpenChange={setCreateIndexOpen}>
                      <DialogTrigger asChild>
                        <Button id="createIndexButton" size="sm" variant="outline">
                          Create Index
                        </Button>
                      </DialogTrigger>
                      <DialogContent id="createIndexDialog">
                        <DialogHeader>
                          <DialogTitle>Create New Index</DialogTitle>
                          <DialogDescription>
                            Create an index on {selectedTable}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            id="indexNameInput"
                            placeholder="idx_column_name"
                            value={indexName}
                            onChange={(e) => setIndexName(e.target.value)}
                          />
                          <Input
                            id="indexColumns"
                            placeholder="column1, column2"
                            value={indexColumns}
                            onChange={(e) => setIndexColumns(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button id="confirmCreateIndex" onClick={handleCreateIndex}>
                            Create
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {indexes.length === 0 ? (
                    <p className="text-sm text-gray-500">No indexes</p>
                  ) : (
                    <div className="space-y-1">
                      {indexes.map((idx) => (
                        <div key={idx.name} className="p-2 border rounded text-sm">
                          <span className="font-mono">{idx.name}</span>
                          {idx.unique === 1 && (
                            <span className="ml-2 text-xs text-blue-600">UNIQUE</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Query Button */}
                <div className="pt-4 border-t">
                  <Button
                    id="quickSelectAll"
                    onClick={() => {
                      if (selectedTable) {
                        window.location.href = `/db/query?sql=${encodeURIComponent(`SELECT * FROM ${selectedTable}`)}`;
                      }
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Quick Query: SELECT *
                  </Button>
                </div>

                {/* Data Preview */}
                <div id="dataPreview" className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Data Preview (First 5 Rows)</h3>
                  {previewData && previewData.rows.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {previewData.columns.map((col: string, index: number) => (
                              <TableHead key={index}>{col}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewData.rows.map((row: any, rowIndex: number) => (
                            <TableRow key={rowIndex}>
                              {row.values.map((cell: any, cellIndex: number) => (
                                <TableCell key={cellIndex}>
                                  {cell.type === 'Null' ? (
                                    <span className="text-gray-400 italic">NULL</span>
                                  ) : (
                                    String(cell.value)
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No data in table</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No table selected</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SchemaViewerPage() {
  const { currentDbName } = useDatabaseStore();
  
  return <SchemaViewerContent />;
}
