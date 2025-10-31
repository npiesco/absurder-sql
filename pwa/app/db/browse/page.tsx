'use client';

import { useState, useEffect } from 'react';
import { useDatabaseStore } from '@/lib/db/store';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TableInfo {
  name: string;
  rowCount: number;
}

interface ColumnInfo {
  name: string;
  type: string;
}

interface EditingCell {
  rowIndex: number;
  columnIndex: number;
  value: any;
}

export default function DataBrowserPage() {
  const { db, setDb } = useDatabaseStore();
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Initialize WASM if needed
  useEffect(() => {
    if (typeof window === 'undefined') return;

    async function initializeWasm() {
      try {
        // If db already exists in Zustand (from main page), just use it
        if (db) {
          (window as any).testDb = db;
          setInitializing(false);
          return;
        }

        const init = (await import('@npiesco/absurder-sql')).default;
        const { Database } = await import('@npiesco/absurder-sql');
        
        // Init WASM first
        await init();
        
        // Expose Database class on window
        (window as any).Database = Database;
        
        // Only create new database if none exists
        const dbInstance = await Database.newDatabase('database.db');
        setDb(dbInstance);
        (window as any).testDb = dbInstance;
        
        setInitializing(false);
      } catch (err: any) {
        console.error('Failed to initialize:', err);
        setInitializing(false);
      }
    }

    initializeWasm();
  }, []);

  // Load tables when db is available
  useEffect(() => {
    if (db) {
      loadTables();
    }
  }, [db]);

  // Load data when table or pagination changes
  useEffect(() => {
    if (selectedTable) {
      loadTableData();
    }
  }, [selectedTable, pageSize, currentPage]);

  const loadTables = async () => {
    if (!db) return;

    try {
      setLoading(true);
      const result = await db.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      );

      const tableList: TableInfo[] = [];
      for (const row of result.rows) {
        const tableName = row.values[0].value as string;
        // Get row count for each table
        const countResult = await db.execute(`SELECT COUNT(*) FROM ${tableName}`);
        const rowCount = countResult.rows[0].values[0].value as number;
        tableList.push({ name: tableName, rowCount });
      }

      setTables(tableList);
    } catch (err) {
      console.error('Error loading tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async () => {
    if (!db || !selectedTable) return;

    try {
      setLoading(true);

      // Get column info
      const columnsResult = await db.execute(`PRAGMA table_info(${selectedTable})`);
      const cols: ColumnInfo[] = columnsResult.rows.map((row: any) => ({
        name: row.values[1].value as string,
        type: row.values[2].value as string,
      }));
      setColumns(cols);

      // Get total row count
      const countResult = await db.execute(`SELECT COUNT(*) FROM ${selectedTable}`);
      const total = countResult.rows[0].values[0].value;
      setTotalRows(total);

      // Get paginated data
      const offset = (currentPage - 1) * pageSize;
      const dataResult = await db.execute(
        `SELECT rowid as _rowid_, * FROM ${selectedTable} LIMIT ${pageSize} OFFSET ${offset}`
      );

      setData(dataResult.rows);
    } catch (err) {
      console.error('Error loading table data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (tableName: string) => {
    setSelectedTable(tableName);
    setCurrentPage(1); // Reset to first page
  };

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(parseInt(newSize));
    setCurrentPage(1); // Reset to first page
  };

  const handleNextPage = () => {
    const totalPages = Math.ceil(totalRows / pageSize);
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleCellDoubleClick = (rowIndex: number, columnIndex: number, currentValue: any) => {
    setEditingCell({ rowIndex, columnIndex, value: currentValue });
    setEditValue(currentValue === null || currentValue === undefined ? '' : String(currentValue));
  };

  const handleSaveEdit = async () => {
    if (!editingCell || !db || !selectedTable) return;

    try {
      const row = data[editingCell.rowIndex];
      const rowId = row.values[0].value; // rowid is first column
      const column = columns[editingCell.columnIndex];
      
      
      // Determine the value to save based on column type
      let valueToSave: any = editValue;
      if (editValue === '') {
        valueToSave = null;
      } else if (column.type.includes('INT')) {
        valueToSave = parseInt(editValue, 10);
      } else if (column.type.includes('REAL') || column.type.includes('FLOAT') || column.type.includes('DOUBLE')) {
        valueToSave = parseFloat(editValue);
      }

      // Update database
      const updateQuery = `UPDATE ${selectedTable} SET ${column.name} = ? WHERE rowid = ?`;
      const params = [
        valueToSave === null ? { type: 'Null', value: null } : 
        typeof valueToSave === 'number' && Number.isInteger(valueToSave) ? { type: 'Integer', value: valueToSave } :
        typeof valueToSave === 'number' ? { type: 'Real', value: valueToSave } :
        { type: 'Text', value: String(valueToSave) },
        { type: 'Integer', value: rowId }
      ];
      
      // Execute the UPDATE
      await db.executeWithParams(updateQuery, params);

      // Update local data
      const newData = [...data];
      newData[editingCell.rowIndex].values[editingCell.columnIndex + 1].value = valueToSave;
      setData(newData);

      // Exit edit mode
      setEditingCell(null);
      setEditValue('');
    } catch (err) {
      console.error('Error saving edit:', err);
      // Keep in edit mode on error
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const getInputType = (columnType: string): string => {
    if (columnType.includes('INT')) return 'number';
    if (columnType.includes('REAL') || columnType.includes('FLOAT') || columnType.includes('DOUBLE')) return 'number';
    return 'text';
  };

  const totalPages = Math.ceil(totalRows / pageSize);

  return (
    <div id="dataBrowser" className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Browser</h1>
        <p className="text-muted-foreground mt-2">
          Browse and view table data with pagination
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Table Selection</CardTitle>
          <CardDescription>Choose a table to browse its data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label htmlFor="tableSelect" className="text-sm font-medium mb-2 block">
                Select Table
              </label>
              <div className="flex gap-2">
                <Select value={selectedTable} onValueChange={handleTableChange}>
                  <SelectTrigger id="tableSelect" className="flex-1">
                    <SelectValue placeholder="Choose a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map(table => (
                      <SelectItem key={table.name} value={table.name}>
                        {table.name} ({table.rowCount} rows)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  id="refreshTables"
                  onClick={loadTables}
                  variant="outline"
                  disabled={loading}
                >
                  Refresh
                </Button>
              </div>
            </div>

            <div className="w-32">
              <label htmlFor="pageSizeSelect" className="text-sm font-medium mb-2 block">
                Page Size
              </label>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger id="pageSizeSelect">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                  <SelectItem value="1000">1000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedTable && (
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <div id="rowCount">
                Total: <span className="font-semibold">{totalRows}</span> rows
              </div>
              <div>
                Page {currentPage} of {totalPages || 1}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTable && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedTable}</CardTitle>
            <CardDescription>
              Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalRows)} of {totalRows} rows
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p>{initializing ? 'Initializing...' : 'Loading...'}</p>
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No data in this table</p>
              </div>
            ) : (
              <>
                <div className="border rounded-md overflow-auto max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">rowid</TableHead>
                        {columns.map(col => (
                          <TableHead key={col.name}>
                            {col.name}
                            <span className="text-xs text-muted-foreground ml-2">
                              ({col.type})
                            </span>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          <TableCell className="font-mono text-sm">
                            {row.values[0].value}
                          </TableCell>
                          {row.values.slice(1).map((cell: any, cellIndex: number) => {
                            const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.columnIndex === cellIndex;
                            const column = columns[cellIndex];
                            
                            return (
                              <TableCell 
                                key={cellIndex}
                                className={`
                                  ${cell.value === null || cell.value === undefined ? 'null-value' : ''}
                                  ${isEditing ? 'editing' : 'cursor-pointer hover:bg-muted/50'}
                                `}
                                onDoubleClick={() => !isEditing && handleCellDoubleClick(rowIndex, cellIndex, cell.value)}
                              >
                                {isEditing ? (
                                  <input
                                    type={getInputType(column.type)}
                                    step={column.type.includes('REAL') || column.type.includes('FLOAT') || column.type.includes('DOUBLE') ? 'any' : undefined}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                    className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                  />
                                ) : (
                                  cell.value === null || cell.value === undefined ? (
                                    <span className="italic text-muted-foreground">NULL</span>
                                  ) : (
                                    String(cell.value)
                                  )
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <Button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
