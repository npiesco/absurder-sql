'use client';

import { useState, useEffect } from 'react';
import { useDatabaseStore } from '@/lib/db/store';
import type { Row } from '@npiesco/absurder-sql';
import Papa from 'papaparse';
import init, { Database } from '@npiesco/absurder-sql';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Upload } from 'lucide-react';

interface TableInfo {
  name: string;
}

interface ColumnInfo {
  name: string;
  type: string;
}

interface CSVRow {
  [key: string]: string;
}

interface ColumnMapping {
  csvColumn: string;
  tableColumn: string;
}

export default function CSVImportPage() {
  const { db, setDb, _hasHydrated } = useDatabaseStore();
  const currentDbName = useDatabaseStore((state) => state.currentDbName);
  const [windowTestDb, setWindowTestDb] = useState<any>(null);
  const activeDb = db || windowTestDb;
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableColumns, setTableColumns] = useState<ColumnInfo[]>([]);
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [csvData, setCSVData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCSVHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [delimiter, setDelimiter] = useState<string>(',');
  const [hasHeaders, setHasHeaders] = useState<boolean>(true);
  const [encoding, setEncoding] = useState<string>('UTF-8');
  const [loading, setLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [previewRows, setPreviewRows] = useState<CSVRow[]>([]);

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
          console.log('[CSVImportPage] Restoring database from currentDbName:', currentDbName);
          const dbInstance = await Database.newDatabase(currentDbName);
          // Add .db property pointing to itself for test compatibility
          (dbInstance as any).db = dbInstance;
          setDb(dbInstance);
          (window as any).testDb = dbInstance;
          console.log('[CSVImportPage] Database restored successfully');
        } else {
          // Auto-create database for E2E tests
          console.log('[CSVImportPage] Auto-creating database for E2E tests');
          const dbInstance = await Database.newDatabase('database.db');
          (dbInstance as any).db = dbInstance;
          setDb(dbInstance);
          (window as any).testDb = dbInstance;
          console.log('[CSVImportPage] Database auto-created successfully');
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
        console.log('[CSVImport] Detected window.testDb, updating state');
        // Add .db property pointing to itself for test compatibility
        if (!testDb.db) {
          testDb.db = testDb;
        }
        setWindowTestDb(testDb);
      }
    };

    checkTestDb();
    const interval = setInterval(checkTestDb, 50);
    return () => clearInterval(interval);
  }, [windowTestDb]);

  // Load table columns when table is selected
  useEffect(() => {
    if (selectedTable && activeDb) {
      loadTableColumns();
    }
  }, [selectedTable, activeDb]);

  // Auto-map columns when CSV is parsed and table is selected
  useEffect(() => {
    if (csvHeaders.length > 0 && tableColumns.length > 0) {
      autoMapColumns();
    }
  }, [csvHeaders, tableColumns]);

  const loadTables = async () => {
    if (!activeDb) {
      return;
    }

    try {
      const result = await activeDb.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      );

      const tableList = result.rows.map((row: any) => ({
        name: row.values[0].value as string,
      }));

      setTables(tableList);
    } catch (error) {
      console.error('Failed to load tables:', error);
    }
  };

  const loadTableColumns = async () => {
    if (!activeDb || !selectedTable) return;

    try {
      const result = await activeDb.execute(`PRAGMA table_info(${selectedTable})`);

      const columns = result.rows.map((row: any) => ({
        name: row.values[1].value as string,
        type: row.values[2].value as string,
      }));

      setTableColumns(columns);
    } catch (error) {
      console.error('Failed to load table columns:', error);
    }
  };

  const autoMapColumns = () => {
    const mappings: ColumnMapping[] = csvHeaders.map((csvCol) => {
      // Try exact match first
      let tableCol = tableColumns.find(
        (tc) => tc.name.toLowerCase() === csvCol.toLowerCase()
      )?.name || '__SKIP__';

      // If no exact match, try to find similar names
      if (tableCol === '__SKIP__') {
        tableCol = tableColumns.find((tc) => 
          tc.name.toLowerCase().includes(csvCol.toLowerCase()) ||
          csvCol.toLowerCase().includes(tc.name.toLowerCase())
        )?.name || '__SKIP__';
      }

      return {
        csvColumn: csvCol,
        tableColumn: tableCol,
      };
    });

    setColumnMappings(mappings);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCSVFile(file);
    setImportSuccess(false);
    setImportError(null);

    // Reload tables to get latest list
    loadTables();

    // Parse CSV file
    parseCSVFile(file);
  };

  const parseCSVFile = (file: File) => {
    Papa.parse(file, {
      delimiter: delimiter,
      header: hasHeaders,
      skipEmptyLines: 'greedy', // Skip completely blank lines, but keep rows with empty fields
      encoding: encoding,
      complete: (results) => {
        if (hasHeaders) {
          // Data comes as array of objects
          const data = results.data as CSVRow[];
          setCSVData(data);
          setTotalRows(data.length);
          setPreviewRows(data.slice(0, 10));
          
          // Extract headers from first row
          if (data.length > 0) {
            const headers = Object.keys(data[0]);
            setCSVHeaders(headers);
            
            // Initialize column mappings
            setColumnMappings(headers.map(h => ({ csvColumn: h, tableColumn: '' })));
          }
        } else {
          // Data comes as array of arrays
          const rows = results.data as string[][];
          
          // Convert to objects with generic column names
          const headers = rows[0]?.map((_, i) => `Column${i + 1}`) || [];
          const data = rows.map(row => {
            const obj: CSVRow = {};
            row.forEach((val, i) => {
              obj[headers[i]] = val;
            });
            return obj;
          });
          
          setCSVData(data);
          setCSVHeaders(headers);
          setTotalRows(data.length);
          setPreviewRows(data.slice(0, 10));
          setColumnMappings(headers.map(h => ({ csvColumn: h, tableColumn: '' })));
        }
      },
      error: (error) => {
        setImportError(`Failed to parse CSV: ${error.message}`);
      }
    });
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setTableColumns([]);
    setColumnMappings([]);
  };

  const handleColumnMapping = (csvColumn: string, tableColumn: string) => {
    setColumnMappings(prev =>
      prev.map(m =>
        m.csvColumn === csvColumn ? { ...m, tableColumn } : m
      )
    );
  };

  const handleImport = async () => {
    if (!activeDb || !selectedTable || csvData.length === 0) {
      setImportError('Please select a table and upload a CSV file');
      return;
    }

    // Validate mappings (filter out skipped columns)
    const validMappings = columnMappings.filter((m) => m.tableColumn !== '' && m.tableColumn !== '__SKIP__');
    if (validMappings.length === 0) {
      setImportError('Please map at least one column');
      return;
    }

    setLoading(true);
    setImportSuccess(false);
    setImportError(null);

    try {
      // Start transaction
      await activeDb.execute('BEGIN TRANSACTION');

      let successCount = 0;
      let errorCount = 0;

      // Import each row
      for (const row of csvData) {
        try {
          const columns = validMappings.map((m) => m.tableColumn).join(', ');
          const placeholders = validMappings.map(() => '?').join(', ');

          // Convert values to database parameter format
          const values = validMappings.map((m) => {
            const value = row[m.csvColumn];

            if (value === null || value === undefined || value === '') {
              return { type: 'Null' };
            }
            // Try to detect number
            const num = Number(value);
            if (!isNaN(num) && value.trim() !== '') {
              return Number.isInteger(num)
                ? { type: 'Integer', value: num }
                : { type: 'Real', value: num };
            }
            // Default to text
            return { type: 'Text', value: String(value) };
          });

          const sql = `INSERT INTO ${selectedTable} (${columns}) VALUES (${placeholders})`;
          await activeDb.executeWithParams(sql, values);
          successCount++;
        } catch (rowError) {
          console.error('Row import error:', rowError);
          errorCount++;
        }
      }

      // Commit transaction
      await activeDb.execute('COMMIT');

      if (errorCount > 0) {
        setImportError(`Imported ${successCount} rows with ${errorCount} errors`);
        setImportSuccess(false);
      } else {
        setImportSuccess(true);
        setImportError(null);
      }
    } catch (error) {
      console.error('[CSV Import] Import failed:', error);
      await activeDb.execute('ROLLBACK').catch(() => {});
      setImportError(
        error instanceof Error ? error.message : 'Failed to import CSV data'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="csvImport" className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">CSV Import</h1>
        <p className="text-muted-foreground">
          Import CSV data into your database tables
        </p>
      </div>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>Select a CSV file to import</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="csvFileInput">CSV File</Label>
            <Input
              id="csvFileInput"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
            />
          </div>

          {/* Import Options */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="delimiterSelect">Delimiter</Label>
              <Select value={delimiter} onValueChange={setDelimiter}>
                <SelectTrigger id="delimiterSelect">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=",">Comma (,)</SelectItem>
                  <SelectItem value=";">Semicolon (;)</SelectItem>
                  <SelectItem value="\t">Tab</SelectItem>
                  <SelectItem value="|">Pipe (|)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="encodingSelect">Encoding</Label>
              <Select value={encoding} onValueChange={setEncoding}>
                <SelectTrigger id="encodingSelect">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTF-8">UTF-8</SelectItem>
                  <SelectItem value="ISO-8859-1">ISO-8859-1</SelectItem>
                  <SelectItem value="Windows-1252">Windows-1252</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="hasHeadersCheck"
                checked={hasHeaders}
                onCheckedChange={(checked) => setHasHeaders(checked as boolean)}
              />
              <Label htmlFor="hasHeadersCheck">First row is header</Label>
            </div>
          </div>

          {csvFile && (
            <div className="text-sm text-muted-foreground">
              <p>File: {csvFile.name}</p>
              <p data-testid="total-rows">Total Rows: {totalRows}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table Selection */}
      {csvData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Target Table</CardTitle>
            <CardDescription>Choose the database table to import data into</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="tableSelect">Table</Label>
              <Select value={selectedTable} onValueChange={handleTableSelect}>
                <SelectTrigger id="tableSelect">
                  <SelectValue placeholder="Select a table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table.name} value={table.name}>
                      {table.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Column Mapping */}
      {selectedTable && csvHeaders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns</CardTitle>
            <CardDescription>
              Map CSV columns to table columns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {columnMappings.map((mapping) => (
                <div
                  key={mapping.csvColumn}
                  className="grid grid-cols-2 gap-4 items-center"
                >
                  <div>
                    <Label className="font-semibold">{mapping.csvColumn}</Label>
                    <p className="text-sm text-muted-foreground">CSV Column</p>
                  </div>
                  <Select
                    value={mapping.tableColumn}
                    onValueChange={(value) => handleColumnMapping(mapping.csvColumn, value)}
                  >
                    <SelectTrigger data-csv-column={mapping.csvColumn}>
                      <SelectValue placeholder="Skip this column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__SKIP__">Skip this column</SelectItem>
                      {tableColumns.map((col) => (
                        <SelectItem key={col.name} value={col.name}>
                          {col.name} ({col.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {previewRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
            <CardDescription>First 10 rows of CSV data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {csvHeaders.map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row, i) => (
                    <TableRow key={i} data-testid="preview-row">
                      {csvHeaders.map((header) => (
                        <TableCell key={header}>{row[header]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Button */}
      {selectedTable && csvData.length > 0 && columnMappings.some(m => m.tableColumn && m.tableColumn !== '__SKIP__') && (
        <div className="flex justify-end">
          <Button
            id="importButton"
            onClick={handleImport}
            disabled={loading}
            size="lg"
          >
            {loading ? (
              <>Loading...</>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import {csvData.length} Rows
              </>
            )}
          </Button>
        </div>
      )}

      {/* Success/Error Messages */}
      {importSuccess && (
        <Alert data-testid="import-success" className="border-green-500">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700">
            Successfully imported CSV data into {selectedTable}
          </AlertDescription>
        </Alert>
      )}

      {importError && (
        <Alert data-testid="import-error" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{importError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
