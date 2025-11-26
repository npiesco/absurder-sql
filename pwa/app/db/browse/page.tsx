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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

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

interface Filter {
  column: string;
  operator: string;
  value: string;
}

interface SortConfig {
  column: string;
  direction: 'ASC' | 'DESC';
}

interface ForeignKey {
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
  on_update: string;
  on_delete: string;
  match: string;
}

interface NavigationHistoryItem {
  table: string;
  page: number;
  filters: Filter[];
  sort: SortConfig | null;
}

export default function DataBrowserPage() {
  const { db, setDb, showSystemTables, setShowSystemTables } = useDatabaseStore();

  // Track window.testDb for E2E tests
  const [windowTestDb, setWindowTestDb] = useState<any>(null);

  // For E2E tests: check both Zustand store and window.testDb
  const activeDb = db || windowTestDb;

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
  const [editFile, setEditFile] = useState<File | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk', rowId?: number } | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [newFilter, setNewFilter] = useState<Filter>({ column: '', operator: 'equals', value: '' });
  const [foreignKeys, setForeignKeys] = useState<ForeignKey[]>([]);
  const [navigationHistory, setNavigationHistory] = useState<NavigationHistoryItem[]>([]);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeHeaders: true,
    delimiter: 'comma' as 'comma' | 'semicolon' | 'tab' | 'pipe',
    quoteAllFields: false,
    lineEnding: 'LF' as 'LF' | 'CRLF',
    nullHandling: 'empty' as 'empty' | 'null',
    selectedColumns: [] as string[],
  });
  const [jsonExportDialogOpen, setJsonExportDialogOpen] = useState(false);
  const [jsonExportOptions, setJsonExportOptions] = useState({
    prettyPrint: true,
    format: 'array' as 'array' | 'object',
    selectedColumns: [] as string[],
  });
  const [sqlExportDialogOpen, setSqlExportDialogOpen] = useState(false);
  const [sqlExportOptions, setSqlExportOptions] = useState({
    dropTableIfExists: false,
    includeTransactions: true,
    batchSize: 100,
    selectedColumns: [] as string[],
  });

  // Initialize WASM and expose testDb globally for E2E tests
  useEffect(() => {
    if (typeof window === 'undefined') return;

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
        } else {
          // Auto-create database for E2E tests (browse page needs a database)
          const dbInstance = await Database.newDatabase('database.db');
          // Add .db property pointing to itself for test compatibility (only if not already set)
          if (!(dbInstance as any).db) (dbInstance as any).db = dbInstance;
          setDb(dbInstance);
          (window as any).testDb = dbInstance;
        }

        setInitializing(false);
      } catch (err: any) {
        console.error('Failed to initialize WASM:', err);
        setInitializing(false);
      }
    }

    initializeWasm();
  }, [db]);

  // Sync window.testDb to component state (for E2E tests)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkTestDb = () => {
      const testDb = (window as any).testDb;
      if (testDb && !windowTestDb) {
        console.log('[BrowsePage] Detected window.testDb, updating state');
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

  // Load tables when db is available
  useEffect(() => {
    if (activeDb) {
      loadTables();
    }
  }, [activeDb]);

  // Reload tables when showSystemTables toggle changes
  useEffect(() => {
    if (activeDb) {
      loadTables();
    }
  }, [showSystemTables]);

  // Load data when table, pagination, filters, or sort changes
  useEffect(() => {
    if (selectedTable && activeDb) {
      loadTableData();
    }
  }, [activeDb, selectedTable, currentPage, pageSize, filters, sortConfig]);

  const loadTables = async () => {
    if (!activeDb) return;

    try {
      setLoading(true);
      const query = showSystemTables
        ? "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        : "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name";
      const result = await activeDb.execute(query);

      const tableList: TableInfo[] = [];
      for (const row of result.rows) {
        const tableName = row.values[0].value as string;
        // Get row count for each table
        const countResult = await activeDb.execute(`SELECT COUNT(*) FROM ${tableName}`);
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

  const buildWhereClause = () => {
    if (filters.length === 0) return '';
    
    const conditions = filters.map(filter => {
      const { column, operator, value } = filter;
      
      switch (operator) {
        case 'equals':
          return `${column} = '${value.replace(/'/g, "''")}'`;
        case 'contains':
          return `${column} LIKE '%${value.replace(/'/g, "''")}%'`;
        case 'starts_with':
          return `${column} LIKE '${value.replace(/'/g, "''")}%'`;
        case 'greater_than':
          return `${column} > ${value}`;
        case 'less_than':
          return `${column} < ${value}`;
        case 'greater_equal':
          return `${column} >= ${value}`;
        case 'less_equal':
          return `${column} <= ${value}`;
        case 'not_equal':
          return `${column} != '${value.replace(/'/g, "''")}'`;
        case 'is_null':
          return `${column} IS NULL`;
        case 'is_not_null':
          return `${column} IS NOT NULL`;
        default:
          return `${column} = '${value.replace(/'/g, "''")}'`;
      }
    });
    
    return ` WHERE ${conditions.join(' AND ')}`;
  };

  const buildOrderByClause = () => {
    if (!sortConfig) return '';
    return ` ORDER BY ${sortConfig.column} ${sortConfig.direction}`;
  };

  const loadTableData = async () => {
    if (!activeDb ||!selectedTable) return;

    try {
      setLoading(true);

      // Get column info
      const columnsResult = await activeDb.execute(`PRAGMA table_info(${selectedTable})`);
      const cols: ColumnInfo[] = columnsResult.rows.map((row: any) => ({
        name: row.values[1].value as string,
        type: row.values[2].value as string,
      }));
      setColumns(cols);

      // Get foreign key relationships
      const fkResult = await activeDb.execute(`PRAGMA foreign_key_list(${selectedTable})`);
      const fks: ForeignKey[] = fkResult.rows.map((row: any) => ({
        id: row.values[0].value as number,
        seq: row.values[1].value as number,
        table: row.values[2].value as string,
        from: row.values[3].value as string,
        to: row.values[4].value as string,
        on_update: row.values[5].value as string,
        on_delete: row.values[6].value as string,
        match: row.values[7].value as string,
      }));
      setForeignKeys(fks);

      // Build query with filters and sorting
      const whereClause = buildWhereClause();
      const orderByClause = buildOrderByClause();

      // Get total row count with filters
      const countQuery = `SELECT COUNT(*) FROM ${selectedTable}${whereClause}`;
      const countResult = await activeDb.execute(countQuery);
      const total = countResult.rows[0].values[0].value;
      setTotalRows(total);

      // Get paginated data with filters and sorting
      const offset = (currentPage - 1) * pageSize;
      const dataQuery = `SELECT rowid as _rowid_, * FROM ${selectedTable}${whereClause}${orderByClause} LIMIT ${pageSize} OFFSET ${offset}`;
      const dataResult = await activeDb.execute(dataQuery);

      setData(dataResult.rows);
    } catch (err) {
      console.error('Error loading table data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (tableName: string) => {
    setSelectedTable(tableName);
    setCurrentPage(1);
    setSortConfig(null);
    setFilters([]);
  };

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(parseInt(newSize));
    setCurrentPage(1);
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

  const handleSort = (columnName: string) => {
    if (sortConfig?.column === columnName) {
      // Toggle direction
      setSortConfig({
        column: columnName,
        direction: sortConfig.direction === 'ASC' ? 'DESC' : 'ASC'
      });
    } else {
      // New column, start with ASC
      setSortConfig({ column: columnName, direction: 'ASC' });
    }
    setCurrentPage(1);
  };

  const handleAddFilter = () => {
    if (newFilter.column && newFilter.operator) {
      setFilters([...filters, newFilter]);
      setNewFilter({ column: '', operator: 'equals', value: '' });
      setCurrentPage(1);
    }
  };

  const handleClearFilters = () => {
    setFilters([]);
    setCurrentPage(1);
  };

  const handleRemoveFilter = (index: number) => {
    const updatedFilters = filters.filter((_, i) => i !== index);
    setFilters(updatedFilters);
    setCurrentPage(1);
  };

  const handleForeignKeyClick = (columnName: string, fkValue: any) => {
    // Find the FK relationship for this column
    const fk = foreignKeys.find(fk => fk.from === columnName);
    if (!fk || fkValue === null || fkValue === undefined) return;

    // Save current state to navigation history
    setNavigationHistory([...navigationHistory, {
      table: selectedTable,
      page: currentPage,
      filters: filters,
      sort: sortConfig
    }]);

    // Navigate to related table with filter
    setSelectedTable(fk.table);
    setFilters([{
      column: fk.to,
      operator: 'equals',
      value: String(fkValue)
    }]);
    setCurrentPage(1);
    setSortConfig(null);
  };

  const handleBackNavigation = () => {
    if (navigationHistory.length === 0) return;

    const previous = navigationHistory[navigationHistory.length - 1];
    const newHistory = navigationHistory.slice(0, -1);
    
    setNavigationHistory(newHistory);
    setSelectedTable(previous.table);
    setCurrentPage(previous.page);
    setFilters(previous.filters);
    setSortConfig(previous.sort);
  };

  const isForeignKeyColumn = (columnName: string): boolean => {
    return foreignKeys.some(fk => fk.from === columnName);
  };

  const getForeignKeyInfo = (columnName: string): ForeignKey | undefined => {
    return foreignKeys.find(fk => fk.from === columnName);
  };

  const handleCellDoubleClick = (rowIndex: number, columnIndex: number, value: any) => {
    setEditingCell({ rowIndex, columnIndex, value });
    setEditValue(value !== null && value !== undefined ? String(value) : '');
    setEditFile(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Auto-save immediately with the file
      await handleSaveEditWithFile(file);
    }
  };

  const handleSaveEditWithFile = async (file: File) => {
    if (!editingCell || !activeDb || !selectedTable) return;

    try {
      const row = data[editingCell.rowIndex];
      const rowId = row.values[0].value;
      const column = columns[editingCell.columnIndex];
      
      const arrayBuffer = await file.arrayBuffer();
      const newValue = new Uint8Array(arrayBuffer);
      
      const updateQuery = `UPDATE ${selectedTable} SET ${column.name} = ? WHERE rowid = ?`;
      const params = [
        { type: 'Blob', value: Array.from(newValue) },
        { type: 'Integer', value: rowId }
      ];
      
      await activeDb.executeWithParams(updateQuery, params);

      const newData = [...data];
      newData[editingCell.rowIndex].values[editingCell.columnIndex + 1].value = Array.from(newValue);
      setData(newData);

      setEditingCell(null);
      setEditValue('');
      setEditFile(null);
    } catch (err) {
      console.error('Error saving BLOB:', err);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCell || !activeDb || !selectedTable) return;

    try {
      const row = data[editingCell.rowIndex];
      const rowId = row.values[0].value;
      const column = columns[editingCell.columnIndex];
      
      let newValue: any = editValue;
      
      // Handle BLOB columns
      if (isBlobColumn(column.type)) {
        if (editFile) {
          const arrayBuffer = await editFile.arrayBuffer();
          newValue = new Uint8Array(arrayBuffer);
        } else {
          newValue = null;
        }
      } else if (editValue === '' || editValue.toLowerCase() === 'null') {
        newValue = null;
      } else if (column.type.includes('INT')) {
        newValue = parseInt(editValue);
      } else if (column.type.includes('REAL') || column.type.includes('FLOAT') || column.type.includes('DOUBLE') || column.type.includes('NUMERIC')) {
        newValue = parseFloat(editValue);
      }

      // Update database
      const updateQuery = `UPDATE ${selectedTable} SET ${column.name} = ? WHERE rowid = ?`;
      const params = [
        newValue === null ? { type: 'Null', value: null } : 
        newValue instanceof Uint8Array ? { type: 'Blob', value: Array.from(newValue) } :
        typeof newValue === 'number' && Number.isInteger(newValue) ? { type: 'Integer', value: newValue } :
        typeof newValue === 'number' ? { type: 'Real', value: newValue } :
        { type: 'Text', value: String(newValue) },
        { type: 'Integer', value: rowId }
      ];
      
      // Execute the UPDATE
      await activeDb.executeWithParams(updateQuery, params);

      // Update local data
      const newData = [...data];
      // For BLOB columns, store as number array to match DB format
      const displayValue = newValue instanceof Uint8Array ? Array.from(newValue) : newValue;
      newData[editingCell.rowIndex].values[editingCell.columnIndex + 1].value = displayValue;
      setData(newData);

      // Exit edit mode
      setEditingCell(null);
      setEditValue('');
      setEditFile(null);
    } catch (err) {
      console.error('Error saving edit:', err);
      // Keep in edit mode on error
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
    setEditFile(null);
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
    const type = columnType.toUpperCase();
    if (type.includes('INT')) return 'number';
    if (type.includes('REAL') || type.includes('FLOAT') || type.includes('DOUBLE') || type.includes('NUMERIC')) return 'number';
    if (type.includes('BLOB')) return 'file';
    return 'text';
  };

  const isBlobColumn = (columnType: string): boolean => {
    return columnType.toUpperCase().includes('BLOB');
  };

  const formatBlobSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isImageBlob = (data: Uint8Array): boolean => {
    if (data.length < 4) return false;
    // PNG: 89 50 4E 47
    if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47) return true;
    // JPEG: FF D8 FF
    if (data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF) return true;
    // GIF: 47 49 46
    if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46) return true;
    // WebP: 52 49 46 46 ... 57 45 42 50
    if (data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46 && data.length > 12) {
      if (data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50) return true;
    }
    return false;
  };

  const blobToDataURL = (data: Uint8Array, mimeType: string = 'image/png'): string => {
    const blob = new Blob([data as any], { type: mimeType });
    return URL.createObjectURL(blob);
  };

  const handleBlobDownload = (data: Uint8Array, filename: string = 'download.bin') => {
    const blob = new Blob([data as any]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddRow = async () => {
    if (!activeDb ||!selectedTable) return;

    try {
      setLoading(true);

      // Use simple INSERT with DEFAULT VALUES to let SQLite handle defaults
      await activeDb.execute(`INSERT INTO ${selectedTable} DEFAULT VALUES`);

      // Reload data
      await loadTableData();
    } catch (err) {
      console.error('Error adding row:', err);
      // If DEFAULT VALUES fails, try with explicit NULL values
      try {
        const columnNames = columns.map(col => col.name).join(', ');
        const placeholders = columns.map(() => '?').join(', ');
        const params = columns.map(() => ({ type: 'Null', value: null }));

        await activeDb.executeWithParams(
          `INSERT INTO ${selectedTable} (${columnNames}) VALUES (${placeholders})`,
          params
        );
        await loadTableData();
      } catch (fallbackErr) {
        console.error('Error adding row (fallback):', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRow = (rowId: number) => {
    setDeleteTarget({ type: 'single', rowId });
    setShowDeleteDialog(true);
  };

  const handleDeleteSelected = () => {
    if (selectedRows.size === 0) return;
    setDeleteTarget({ type: 'bulk' });
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!activeDb ||!selectedTable || !deleteTarget) return;

    try {
      setLoading(true);

      if (deleteTarget.type === 'single' && deleteTarget.rowId !== undefined) {
        // Delete single row
        await activeDb.executeWithParams(
          `DELETE FROM ${selectedTable} WHERE rowid = ?`,
          [{ type: 'Integer', value: deleteTarget.rowId }]
        );
      } else if (deleteTarget.type === 'bulk') {
        // Delete multiple rows
        const rowIds = Array.from(selectedRows);
        for (const rowId of rowIds) {
          await activeDb.executeWithParams(
            `DELETE FROM ${selectedTable} WHERE rowid = ?`,
            [{ type: 'Integer', value: rowId }]
          );
        }
        setSelectedRows(new Set());
      }

      // Reload data
      await loadTableData();
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Error deleting row(s):', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setDeleteTarget(null);
  };

  // Export filtered data
  const getFilteredData = async () => {
    if (!activeDb ||!selectedTable) return null;

    const whereClause = buildWhereClause();
    const orderByClause = buildOrderByClause();
    
    // Get ALL filtered data (not paginated)
    const query = `SELECT * FROM ${selectedTable}${whereClause}${orderByClause}`;
    const result = await activeDb.execute(query);
    
    return {
      columns: columns.map(c => c.name),
      rows: result.rows
    };
  };

  const exportToFilteredCSVWithOptions = async (options: typeof exportOptions) => {
    const data = await getFilteredData();
    if (!data) return;

    const columnsToExport = options.selectedColumns.length > 0 ? options.selectedColumns : data.columns;
    if (columnsToExport.length === 0) return;

    const csvLines: string[] = [];
    const delimiterMap = { comma: ',', semicolon: ';', tab: '\t', pipe: '|' };
    const delimiter = delimiterMap[options.delimiter];
    const lineEnding = options.lineEnding === 'CRLF' ? '\r\n' : '\n';

    const formatValue = (col: any): string => {
      if (col.type === 'Null') {
        return options.nullHandling === 'null' ? 'NULL' : '';
      }
      let value = String(col.value);
      if (options.quoteAllFields || value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    if (options.includeHeaders) {
      const headers = columnsToExport.map(col => options.quoteAllFields ? `"${col}"` : col).join(delimiter);
      csvLines.push(headers);
    }

    data.rows.forEach((row: any) => {
      const values = columnsToExport.map(colName => {
        const colIndex = data.columns.indexOf(colName);
        return formatValue(row.values[colIndex]);
      }).join(delimiter);
      csvLines.push(values);
    });

    const csvContent = csvLines.join(lineEnding);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedTable}_filtered.csv`;
    link.click();
    setExportDialogOpen(false);
  };

  const exportToFilteredCSV = () => {
    exportToFilteredCSVWithOptions(exportOptions);
  };

  const exportToFilteredJSONWithOptions = async (options: typeof jsonExportOptions) => {
    const data = await getFilteredData();
    if (!data) return;

    const columnsToExport = options.selectedColumns.length > 0 ? options.selectedColumns : data.columns;
    if (columnsToExport.length === 0) return;

    let jsonData: any;

    if (options.format === 'array') {
      jsonData = data.rows.map((row: any) => {
        const obj: Record<string, any> = {};
        columnsToExport.forEach((col) => {
          const index = data.columns.indexOf(col);
          if (index !== -1) {
            const value = row.values[index];
            obj[col] = value.type === 'Null' ? null : value.value;
          }
        });
        return obj;
      });
    } else {
      jsonData = {};
      data.rows.forEach((row: any) => {
        const obj: Record<string, any> = {};
        const firstCol = row.values[0];
        let idKey: string;
        if (firstCol.type === 'Null') {
          idKey = 'null';
        } else if (Array.isArray(firstCol.value)) {
          idKey = JSON.stringify(firstCol.value);
        } else {
          idKey = String(firstCol.value);
        }
        
        columnsToExport.forEach((col) => {
          const index = data.columns.indexOf(col);
          if (index !== -1) {
            const value = row.values[index];
            obj[col] = value.type === 'Null' ? null : value.value;
          }
        });
        
        jsonData[idKey] = obj;
      });
    }

    const jsonString = options.prettyPrint ? JSON.stringify(jsonData, null, 2) : JSON.stringify(jsonData);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedTable}_filtered.json`;
    link.click();
    setJsonExportDialogOpen(false);
  };

  const exportToFilteredJSON = () => {
    exportToFilteredJSONWithOptions(jsonExportOptions);
  };

  const exportToFilteredSQLWithOptions = async (options: typeof sqlExportOptions) => {
    const data = await getFilteredData();
    if (!data) return;

    const columnsToExport = options.selectedColumns.length > 0 ? options.selectedColumns : data.columns;
    if (columnsToExport.length === 0) return;

    const sqlLines: string[] = [];
    const tableName = selectedTable;

    if (options.includeTransactions) {
      sqlLines.push('BEGIN TRANSACTION;');
      sqlLines.push('');
    }

    if (options.dropTableIfExists) {
      sqlLines.push(`DROP TABLE IF EXISTS ${tableName};`);
      sqlLines.push('');
    }

    // Generate CREATE TABLE
    const columnDefs = columnsToExport.map((col) => {
      const colInfo = columns.find(c => c.name === col);
      const sqlType = colInfo?.type || 'TEXT';
      return `  ${col} ${sqlType}`;
    }).join(',\n');
    sqlLines.push(`CREATE TABLE ${tableName} (`);
    sqlLines.push(columnDefs);
    sqlLines.push(');');
    sqlLines.push('');

    // Generate INSERT statements in batches
    if (data.rows.length > 0) {
      for (let i = 0; i < data.rows.length; i += options.batchSize) {
        const batch = data.rows.slice(i, i + options.batchSize);
        const valueRows = batch.map((row: any) => {
          const values = columnsToExport.map(colName => {
            const colIndex = data.columns.indexOf(colName);
            const col = row.values[colIndex];
            if (col.type === 'Null') {
              return 'NULL';
            } else if (col.type === 'Integer' || col.type === 'Real') {
              return String(col.value);
            } else {
              const escapedValue = String(col.value).replace(/'/g, "''");
              return `'${escapedValue}'`;
            }
          }).join(', ');
          return `  (${values})`;
        }).join(',\n');

        sqlLines.push(`INSERT INTO ${tableName} (${columnsToExport.join(', ')}) VALUES`);
        sqlLines.push(valueRows + ';');
        sqlLines.push('');
      }
    }

    if (options.includeTransactions) {
      sqlLines.push('COMMIT;');
    }

    const sqlContent = sqlLines.join('\n');
    const blob = new Blob([sqlContent], { type: 'application/sql' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedTable}_filtered.sql`;
    link.click();
    setSqlExportDialogOpen(false);
  };

  const exportToFilteredSQL = () => {
    exportToFilteredSQLWithOptions(sqlExportOptions);
  };

  const handleSelectRow = (rowId: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === data.length) {
      // Deselect all
      setSelectedRows(new Set());
    } else {
      // Select all
      const allRowIds = data.map(row => row.values[0].value);
      setSelectedRows(new Set(allRowIds));
    }
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
                  <SelectTrigger id="tableSelect" data-testid="table-select" className="flex-1">
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
            {/* Breadcrumb Navigation */}
            {navigationHistory.length > 0 && (
              <nav aria-label="breadcrumb" data-breadcrumb className="mb-4 flex items-center gap-2">
                <Button
                  onClick={handleBackNavigation}
                  variant="ghost"
                  size="sm"
                  data-back-button
                  aria-label="Go back to previous table"
                >
                  ← Back
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {navigationHistory.map((item, index) => (
                    <span key={index}>
                      {item.table} →
                    </span>
                  ))}
                  <span className="font-semibold text-foreground">{selectedTable}</span>
                </div>
              </nav>
            )}
            
            <div className="flex justify-between items-start">
              <div>
                <CardTitle data-table-title>{selectedTable}</CardTitle>
                <CardDescription>
                  Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalRows)} of {totalRows} rows
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowFilterPanel(!showFilterPanel)} 
                  variant="outline"
                  data-filter-toggle
                >
                  Filters {filters.length > 0 && `(${filters.length})`}
                </Button>
                <Button onClick={handleAddRow} disabled={loading}>
                  Add Row
                </Button>
                {selectedRows.size > 0 && (
                  <Button 
                    onClick={handleDeleteSelected} 
                    variant="destructive"
                    disabled={loading}
                  >
                    Delete Selected ({selectedRows.size})
                  </Button>
                )}
                <Button 
                  id="exportFilteredCSV" 
                  onClick={exportToFilteredCSV} 
                  variant="outline" 
                  size="sm"
                >
                  Export CSV
                </Button>
                <Button 
                  id="exportFilteredJSON" 
                  onClick={exportToFilteredJSON} 
                  variant="outline" 
                  size="sm"
                >
                  Export JSON
                </Button>
                <Button 
                  id="exportFilteredSQL" 
                  onClick={exportToFilteredSQL} 
                  variant="outline" 
                  size="sm"
                >
                  Export SQL
                </Button>
                <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      id="exportFilteredCSVOptions" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (columns.length > 0 && exportOptions.selectedColumns.length === 0) {
                          setExportOptions({ ...exportOptions, selectedColumns: columns.map(c => c.name) });
                        }
                      }}
                    >
                      CSV Options
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>CSV Export Options</DialogTitle>
                      <DialogDescription>
                        Configure your CSV export settings
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {columns.length > 0 && (
                        <div className="grid gap-2">
                          <Label className="text-sm font-medium">Select Columns to Export</Label>
                          <div className="flex gap-2 mb-2">
                            <Button
                              id="selectAllColumns"
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setExportOptions({ ...exportOptions, selectedColumns: columns.map(c => c.name) })}
                            >
                              Select All
                            </Button>
                            <Button
                              id="deselectAllColumns"
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setExportOptions({ ...exportOptions, selectedColumns: [] })}
                            >
                              Deselect All
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                            {columns.map((col) => (
                              <div key={col.name} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`column-${col.name}`}
                                  checked={exportOptions.selectedColumns.includes(col.name)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setExportOptions({
                                        ...exportOptions,
                                        selectedColumns: [...exportOptions.selectedColumns, col.name]
                                      });
                                    } else {
                                      setExportOptions({
                                        ...exportOptions,
                                        selectedColumns: exportOptions.selectedColumns.filter(c => c !== col.name)
                                      });
                                    }
                                  }}
                                />
                                <Label htmlFor={`column-${col.name}`} className="text-sm cursor-pointer">
                                  {col.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button 
                        id="confirmExport" 
                        onClick={() => exportToFilteredCSVWithOptions(exportOptions)}
                      >
                        Export
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filter Panel */}
            {showFilterPanel && (
              <div className="mb-4 p-4 border rounded-md bg-muted/20">
                <div className="space-y-3">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-sm font-medium">Column</label>
                      <Select 
                        value={newFilter.column} 
                        onValueChange={(value) => setNewFilter({...newFilter, column: value})}
                      >
                        <SelectTrigger id="filter-column" data-filter-column>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map(col => (
                            <SelectItem key={col.name} value={col.name}>
                              {col.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium">Operator</label>
                      <Select 
                        value={newFilter.operator} 
                        onValueChange={(value) => setNewFilter({...newFilter, operator: value})}
                      >
                        <SelectTrigger id="filter-operator" data-filter-operator>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Equals</SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="starts_with">Starts With</SelectItem>
                          <SelectItem value="greater_than">Greater Than</SelectItem>
                          <SelectItem value="less_than">Less Than</SelectItem>
                          <SelectItem value="greater_equal">Greater or Equal</SelectItem>
                          <SelectItem value="less_equal">Less or Equal</SelectItem>
                          <SelectItem value="not_equal">Not Equal</SelectItem>
                          <SelectItem value="is_null">Is NULL</SelectItem>
                          <SelectItem value="is_not_null">Is Not NULL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium">Value</label>
                      <input
                        id="filter-value"
                        data-filter-value
                        type="text"
                        className="w-full px-3 py-2 border rounded-md"
                        value={newFilter.value}
                        onChange={(e) => setNewFilter({...newFilter, value: e.target.value})}
                      />
                    </div>
                    <Button 
                      onClick={handleAddFilter}
                      className="mt-auto"
                    >
                      Add Filter
                    </Button>
                  </div>

                  {/* Active Filters */}
                  {filters.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">Active Filters:</label>
                        <Button 
                          onClick={handleClearFilters} 
                          variant="ghost" 
                          size="sm"
                          data-clear-filters
                        >
                          Clear All
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {filters.map((filter, index) => (
                          <div 
                            key={index} 
                            className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-sm"
                          >
                            <span>
                              {filter.column} {filter.operator.replace(/_/g, ' ')} {filter.value || ''}
                            </span>
                            <button
                              onClick={() => handleRemoveFilter(index)}
                              className="text-destructive hover:text-destructive/80"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
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
                        <TableHead className="w-[50px]">
                          <input
                            type="checkbox"
                            checked={selectedRows.size === data.length && data.length > 0}
                            onChange={handleSelectAll}
                            className="cursor-pointer"
                          />
                        </TableHead>
                        <TableHead className="w-[100px]">rowid</TableHead>
                        {columns.map(col => {
                          const fkInfo = getForeignKeyInfo(col.name);
                          return (
                          <TableHead 
                            key={col.name}
                            onClick={() => handleSort(col.name)}
                            className="cursor-pointer hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-1">
                              {col.name}
                              {fkInfo && (
                                <span 
                                  className="text-xs text-blue-500" 
                                  data-fk-indicator
                                  title={`Foreign key to ${fkInfo.table}.${fkInfo.to}`}
                                >
                                  → {fkInfo.table}
                                </span>
                              )}
                              {sortConfig?.column === col.name && (
                                <span className="text-xs">
                                  {sortConfig.direction === 'ASC' ? '↑' : '↓'}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground ml-2">
                                ({col.type})
                              </span>
                            </div>
                          </TableHead>
                        );
                        })}
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((row, rowIndex) => {
                        const rowId = row.values[0].value;
                        return (
                        <TableRow key={rowIndex}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedRows.has(rowId)}
                              onChange={() => handleSelectRow(rowId)}
                              className="cursor-pointer"
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {rowId}
                          </TableCell>
                          {row.values.slice(1).map((cell: any, cellIndex: number) => {
                            const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.columnIndex === cellIndex;
                            const column = columns[cellIndex];
                            const isFK = isForeignKeyColumn(column.name);
                            const cellValue = cell.value;
                            
                            const isBlob = isBlobColumn(column.type) && Array.isArray(cellValue);
                            const blobSize = isBlob ? new Uint8Array(cellValue).length : 0;
                            
                            return (
                              <TableCell 
                                key={cellIndex}
                                className={`
                                  ${cell.value === null || cell.value === undefined ? 'null-value' : ''}
                                  ${isEditing ? 'editing' : 'cursor-pointer hover:bg-muted/50'}
                                `}
                                onDoubleClick={() => !isEditing && handleCellDoubleClick(rowIndex, cellIndex, cell.value)}
                                data-fk-link={isFK && cellValue !== null && cellValue !== undefined ? 'true' : undefined}
                                data-blob-preview={isBlob ? 'true' : undefined}
                                data-blob-size={isBlob ? formatBlobSize(blobSize) : undefined}
                              >
                                {isEditing ? (
                                  isBlobColumn(column.type) ? (
                                    <input
                                      type="file"
                                      onChange={handleFileChange}
                                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                  ) : (
                                    <input
                                      type={getInputType(column.type)}
                                      step={column.type.includes('REAL') || column.type.includes('FLOAT') || column.type.includes('DOUBLE') ? 'any' : undefined}
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onKeyDown={handleKeyDown}
                                      autoFocus
                                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                  )
                                ) : cell.value === null || cell.value === undefined ? (
                                  <span className="italic text-muted-foreground">NULL</span>
                                ) : isBlobColumn(column.type) && Array.isArray(cellValue) ? (
                                  (() => {
                                    const blobData = new Uint8Array(cellValue);
                                    return (
                                      <div className="flex items-center gap-2">
                                        {isImageBlob(blobData) ? (
                                          <img 
                                            src={blobToDataURL(blobData)} 
                                            alt="BLOB preview" 
                                            className="max-w-[100px] max-h-[50px] object-contain"
                                          />
                                        ) : null}
                                        <span className="text-sm text-muted-foreground">
                                          {formatBlobSize(blobData.length)}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleBlobDownload(blobData, `blob-${rowId}-${column.name}.bin`);
                                          }}
                                          className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                                          data-blob-download
                                        >
                                          ↓
                                        </button>
                                      </div>
                                    );
                                  })()
                                ) : isFK ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleForeignKeyClick(column.name, cellValue);
                                    }}
                                    className="text-blue-500 hover:text-blue-700 underline"
                                  >
                                    {String(cellValue)}
                                  </button>
                                ) : (
                                  String(cellValue)
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell>
                            <Button
                              onClick={() => handleDeleteRow(rowId)}
                              variant="ghost"
                              size="sm"
                              disabled={loading}
                              aria-label="Delete row"
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                        );
                      })}
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

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={handleCancelDelete}
        >
          <div 
            role="alertdialog" 
            className="bg-background border rounded-lg p-6 max-w-md mx-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-2">Confirm Delete</h2>
            <p className="text-muted-foreground mb-4">
              {deleteTarget?.type === 'bulk' 
                ? `Are you sure you want to delete ${selectedRows.size} row(s)? This action cannot be undone.`
                : 'Are you sure you want to delete this row? This action cannot be undone.'}
            </p>
            <div className="flex justify-end gap-2">
              <Button 
                onClick={handleCancelDelete} 
                variant="outline"
                type="button"
                id="cancelDeleteButton"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmDelete} 
                variant="destructive"
                type="button"
                id="confirmDeleteButton"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
