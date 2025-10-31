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
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk', rowId?: number } | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [newFilter, setNewFilter] = useState<Filter>({ column: '', operator: 'equals', value: '' });
  const [foreignKeys, setForeignKeys] = useState<ForeignKey[]>([]);
  const [navigationHistory, setNavigationHistory] = useState<NavigationHistoryItem[]>([]);

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

  // Load data when table, pagination, filters, or sort changes
  useEffect(() => {
    if (selectedTable && db) {
      loadTableData();
    }
  }, [db, selectedTable, currentPage, pageSize, filters, sortConfig]);

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

      // Get foreign key relationships
      const fkResult = await db.execute(`PRAGMA foreign_key_list(${selectedTable})`);
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
      const countResult = await db.execute(countQuery);
      const total = countResult.rows[0].values[0].value;
      setTotalRows(total);

      // Get paginated data with filters and sorting
      const offset = (currentPage - 1) * pageSize;
      const dataQuery = `SELECT rowid as _rowid_, * FROM ${selectedTable}${whereClause}${orderByClause} LIMIT ${pageSize} OFFSET ${offset}`;
      const dataResult = await db.execute(dataQuery);

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

  const handleAddRow = async () => {
    if (!db || !selectedTable) return;

    try {
      setLoading(true);

      // Use simple INSERT with DEFAULT VALUES to let SQLite handle defaults
      await db.execute(`INSERT INTO ${selectedTable} DEFAULT VALUES`);

      // Reload data
      await loadTableData();
    } catch (err) {
      console.error('Error adding row:', err);
      // If DEFAULT VALUES fails, try with explicit NULL values
      try {
        const columnNames = columns.map(col => col.name).join(', ');
        const placeholders = columns.map(() => '?').join(', ');
        const params = columns.map(() => ({ type: 'Null', value: null }));

        await db.executeWithParams(
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
    if (!db || !selectedTable || !deleteTarget) return;

    try {
      setLoading(true);

      if (deleteTarget.type === 'single' && deleteTarget.rowId !== undefined) {
        // Delete single row
        await db.executeWithParams(
          `DELETE FROM ${selectedTable} WHERE rowid = ?`,
          [{ type: 'Integer', value: deleteTarget.rowId }]
        );
      } else if (deleteTarget.type === 'bulk') {
        // Delete multiple rows
        const rowIds = Array.from(selectedRows);
        for (const rowId of rowIds) {
          await db.executeWithParams(
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
                        <SelectTrigger id="filterColumn" data-filter-column>
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
                        <SelectTrigger id="filterOperator" data-filter-operator>
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
                        id="filterValue"
                        data-filter-value
                        type="text"
                        className="w-full px-3 py-2 border rounded-md"
                        value={newFilter.value}
                        onChange={(e) => setNewFilter({...newFilter, value: e.target.value})}
                        disabled={newFilter.operator === 'is_null' || newFilter.operator === 'is_not_null'}
                      />
                    </div>
                    <Button onClick={handleAddFilter} data-apply-filter>
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
                            
                            return (
                              <TableCell 
                                key={cellIndex}
                                className={`
                                  ${cell.value === null || cell.value === undefined ? 'null-value' : ''}
                                  ${isEditing ? 'editing' : 'cursor-pointer hover:bg-muted/50'}
                                `}
                                onDoubleClick={() => !isEditing && handleCellDoubleClick(rowIndex, cellIndex, cell.value)}
                                data-fk-link={isFK && cellValue !== null && cellValue !== undefined ? 'true' : undefined}
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
                                ) : cell.value === null || cell.value === undefined ? (
                                  <span className="italic text-muted-foreground">NULL</span>
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
