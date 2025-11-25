'use client';

import { useState, useEffect } from 'react';
import { useDatabaseStore } from '@/lib/db/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';

interface TableInfo {
  name: string;
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
  seq: number;
  name: string;
  unique: number;
  origin: string;
  partial: number;
}

function TableDesignerContent() {
  const { db, _hasHydrated, setDb } = useDatabaseStore();
  const { showSystemTables } = useDatabaseStore();
  const currentDbName = useDatabaseStore((state) => state.currentDbName);
  const [windowTestDb, setWindowTestDb] = useState<any>(null);
  const activeDb = db || windowTestDb;
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [indexes, setIndexes] = useState<IndexInfo[]>([]);
  const [status, setStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Add Column Dialog state
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [newColumn, setNewColumn] = useState({
    name: '',
    type: 'TEXT',
    notNull: false,
    unique: false,
    defaultValue: '',
  });

  // Delete Column Dialog state
  const [deleteColumnOpen, setDeleteColumnOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<ColumnInfo | null>(null);

  // Edit Column Dialog state
  const [editColumnOpen, setEditColumnOpen] = useState(false);
  const [columnToEdit, setColumnToEdit] = useState<ColumnInfo | null>(null);
  const [editedColumnName, setEditedColumnName] = useState('');

  // Create Index Dialog state
  const [createIndexOpen, setCreateIndexOpen] = useState(false);
  const [indexName, setIndexName] = useState('');
  const [indexUnique, setIndexUnique] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  // Drop Index Dialog state
  const [dropIndexOpen, setDropIndexOpen] = useState(false);
  const [indexToDrop, setIndexToDrop] = useState<string | null>(null);

  // Rename Table Dialog state
  const [renameTableOpen, setRenameTableOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');

  // Drop Table Dialog state
  const [dropTableOpen, setDropTableOpen] = useState(false);

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
          console.log('[DesignerPage] Restoring database from currentDbName:', currentDbName);
          const dbInstance = await Database.newDatabase(currentDbName);
          // Add .db property pointing to itself for test compatibility
          (dbInstance as any).db = dbInstance;
          setDb(dbInstance);
          (window as any).testDb = dbInstance;
          console.log('[DesignerPage] Database restored successfully');
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
        console.log('[TableDesigner] Detected window.testDb, updating state');
        setWindowTestDb(testDb);
      }
    };

    checkTestDb();
    const interval = setInterval(checkTestDb, 50);
    return () => clearInterval(interval);
  }, [windowTestDb]);

  const getValue = (col: any): any => {
    return col.type === 'Null' ? null : col.value;
  };

  const refreshTables = async () => {
    if (!activeDb) return;

    try {
      const systemTableFilter = showSystemTables ? '' : " AND name NOT LIKE 'sqlite_%'";
      const result = await activeDb.execute(
        `SELECT name FROM sqlite_master WHERE type='table'${systemTableFilter} ORDER BY name`
      );
      
      const tableList: TableInfo[] = result.rows.map((row: any) => ({
        name: getValue(row.values[0]) as string || '',
      }));
      
      console.log('[TableDesigner] Found tables:', tableList.map(t => t.name));
      setTables(tableList);
      
      // Auto-select first table if none selected
      if (tableList.length > 0 && !selectedTable) {
        console.log('[TableDesigner] Auto-selecting first table:', tableList[0].name);
        setSelectedTable(tableList[0].name);
      }
    } catch (err: any) {
      setStatus(`Error loading tables: ${err.message}`);
      console.error('[TableDesigner] Error loading tables:', err);
    }
  };

  const loadTableStructure = async (tableName: string) => {
    if (!activeDb || !tableName) return;

    try {
      // Load columns
      const columnsResult = await activeDb.execute(`PRAGMA table_info(${tableName})`);
      const cols: ColumnInfo[] = columnsResult.rows.map((row: any) => ({
        cid: getValue(row.values[0]) as number,
        name: getValue(row.values[1]) as string,
        type: getValue(row.values[2]) as string,
        notnull: getValue(row.values[3]) as number,
        dflt_value: getValue(row.values[4]),
        pk: getValue(row.values[5]) as number,
      }));
      setColumns(cols);

      // Load indexes
      const indexesResult = await activeDb.execute(`PRAGMA index_list(${tableName})`);
      const idxs: IndexInfo[] = indexesResult.rows.map((row: any) => ({
        seq: getValue(row.values[0]) as number,
        name: getValue(row.values[1]) as string,
        unique: getValue(row.values[2]) as number,
        origin: getValue(row.values[3]) as string,
        partial: getValue(row.values[4]) as number,
      }));
      setIndexes(idxs);

      setStatus(`Loaded structure for table: ${tableName}`);
    } catch (err: any) {
      setStatus(`Error loading structure: ${err.message}`);
    }
  };

  useEffect(() => {
    if (activeDb) {
      refreshTables();
    }
  }, [activeDb, showSystemTables]);

  useEffect(() => {
    if (selectedTable) {
      loadTableStructure(selectedTable);
    }
  }, [selectedTable]);

  const handleTableChange = (tableName: string) => {
    setSelectedTable(tableName);
  };

  const handleAddColumn = async () => {
    if (!activeDb || !selectedTable) return;
    
    // Validation
    if (!newColumn.name.trim()) {
      setErrorMsg('Column name is required');
      return;
    }
    
    setErrorMsg('');
    setStatus('Adding column...');
    
    try {
      // Build ALTER TABLE statement (SQLite ALTER TABLE ADD COLUMN doesn't support UNIQUE)
      let sql = `ALTER TABLE ${selectedTable} ADD COLUMN ${newColumn.name} ${newColumn.type}`;
      
      // Add constraints (NOT NULL is supported)
      if (newColumn.notNull) {
        sql += ' NOT NULL';
      }
      
      if (newColumn.defaultValue) {
        // Quote text values
        const defaultVal = newColumn.type === 'TEXT' 
          ? `'${newColumn.defaultValue.replace(/'/g, "''")}'`
          : newColumn.defaultValue;
        sql += ` DEFAULT ${defaultVal}`;
      }
      
      console.log('[TableDesigner] Executing:', sql);
      await activeDb.execute(sql);
      
      // If UNIQUE is requested, create a separate index
      if (newColumn.unique) {
        const indexName = `unique_${selectedTable}_${newColumn.name}`;
        const indexSql = `CREATE UNIQUE INDEX ${indexName} ON ${selectedTable}(${newColumn.name})`;
        console.log('[TableDesigner] Creating unique index:', indexSql);
        await activeDb.execute(indexSql);
      }
      
      // Reload table structure
      await loadTableStructure(selectedTable);
      
      // Reset form and close dialog
      setNewColumn({
        name: '',
        type: 'TEXT',
        notNull: false,
        unique: false,
        defaultValue: '',
      });
      setAddColumnOpen(false);
      setStatus(`Column "${newColumn.name}" added successfully`);
    } catch (err: any) {
      setErrorMsg(`Error adding column: ${err.message}`);
      console.error('[TableDesigner] Error adding column:', err);
    }
  };

  const handleDeleteColumnClick = (column: ColumnInfo) => {
    console.log('[TableDesigner] Delete column clicked:', column.name);
    
    // Check if it's a PRIMARY KEY
    if (column.pk === 1) {
      setErrorMsg('Cannot delete PRIMARY KEY column');
      setStatus('Cannot delete PRIMARY KEY column');
      return;
    }
    
    setColumnToDelete(column);
    setDeleteColumnOpen(true);
  };

  const handleDeleteColumn = async () => {
    if (!activeDb || !selectedTable || !columnToDelete) return;
    
    setErrorMsg('');
    setStatus(`Deleting column "${columnToDelete.name}"...`);
    
    try {
      console.log('[TableDesigner] Deleting column:', columnToDelete.name);
      
      // First, check for and drop any indexes on this column
      const indexListResult = await activeDb.execute(`PRAGMA index_list(${selectedTable})`);
      console.log('[TableDesigner] Index list:', indexListResult.rows);
      
      for (const row of indexListResult.rows) {
        const indexName = getValue(row.values[1]);
        
        // Get columns in this index
        const indexInfoResult = await activeDb.execute(`PRAGMA index_info(${indexName})`);
        console.log('[TableDesigner] Index info for', indexName, ':', indexInfoResult.rows);
        
        // Check if this index uses the column we're deleting
        for (const infoRow of indexInfoResult.rows) {
          const columnName = getValue(infoRow.values[2]);
          if (columnName === columnToDelete.name) {
            console.log('[TableDesigner] Dropping index:', indexName);
            await activeDb.execute(`DROP INDEX ${indexName}`);
            break;
          }
        }
      }
      
      // SQLite 3.35.0+ supports ALTER TABLE DROP COLUMN
      const sql = `ALTER TABLE ${selectedTable} DROP COLUMN ${columnToDelete.name}`;
      console.log('[TableDesigner] Executing:', sql);
      await activeDb.execute(sql);
      
      // Reload table structure
      await loadTableStructure(selectedTable);
      
      // Close dialog and reset state
      setDeleteColumnOpen(false);
      setColumnToDelete(null);
      setStatus(`Column "${columnToDelete.name}" deleted successfully`);
    } catch (err: any) {
      setErrorMsg(`Error deleting column: ${err.message}`);
      console.error('[TableDesigner] Error deleting column:', err);
    }
  };

  const handleEditColumnClick = (column: ColumnInfo) => {
    console.log('[TableDesigner] Edit column clicked:', column.name);
    
    // Check if it's a PRIMARY KEY
    if (column.pk === 1) {
      setErrorMsg('Cannot modify PRIMARY KEY column');
      setStatus('Cannot modify PRIMARY KEY column');
      return;
    }
    
    setColumnToEdit(column);
    setEditedColumnName(column.name);
    setEditColumnOpen(true);
  };

  const handleEditColumn = async () => {
    if (!activeDb || !selectedTable || !columnToEdit) return;
    
    // Validation
    if (!editedColumnName.trim()) {
      setErrorMsg('Column name is required');
      return;
    }
    
    // Check if name is unchanged
    if (editedColumnName === columnToEdit.name) {
      setEditColumnOpen(false);
      setColumnToEdit(null);
      setStatus('No changes made');
      return;
    }
    
    setErrorMsg('');
    setStatus(`Renaming column "${columnToEdit.name}" to "${editedColumnName}"...`);
    
    try {
      console.log('[TableDesigner] Renaming column:', columnToEdit.name, 'to', editedColumnName);
      
      // SQLite doesn't support ALTER TABLE RENAME COLUMN directly in older versions
      // We need to use ALTER TABLE RENAME COLUMN (SQLite 3.25.0+)
      const sql = `ALTER TABLE ${selectedTable} RENAME COLUMN ${columnToEdit.name} TO ${editedColumnName}`;
      console.log('[TableDesigner] Executing:', sql);
      await activeDb.execute(sql);
      
      // Reload table structure
      await loadTableStructure(selectedTable);
      
      // Close dialog and reset state
      setEditColumnOpen(false);
      setColumnToEdit(null);
      setEditedColumnName('');
      setStatus(`Column renamed to "${editedColumnName}" successfully`);
    } catch (err: any) {
      setErrorMsg(`Error renaming column: ${err.message}`);
      console.error('[TableDesigner] Error renaming column:', err);
    }
  };

  const handleCreateIndexClick = () => {
    console.log('[TableDesigner] Create index clicked');
    setIndexName('');
    setIndexUnique(false);
    setSelectedColumns([]);
    setErrorMsg('');
    setCreateIndexOpen(true);
  };

  const handleColumnToggle = (columnName: string) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnName)) {
        return prev.filter(c => c !== columnName);
      } else {
        return [...prev, columnName];
      }
    });
  };

  const handleCreateIndex = async () => {
    console.log('[TableDesigner] handleCreateIndex called', { db: !!db, selectedTable, indexName, selectedColumns });
    
    if (!activeDb || !selectedTable) {
      console.log('[TableDesigner] No db or selectedTable, returning');
      return;
    }
    
    // Validation
    if (!indexName.trim()) {
      console.log('[TableDesigner] Index name is empty');
      setErrorMsg('Index name is required');
      return;
    }
    
    if (selectedColumns.length === 0) {
      console.log('[TableDesigner] No columns selected');
      setErrorMsg('Please select at least one column for the index');
      return;
    }
    
    setErrorMsg('');
    setStatus(`Creating index "${indexName}"...`);
    
    try {
      console.log('[TableDesigner] Creating index:', indexName, 'on columns:', selectedColumns, 'unique:', indexUnique);
      
      // Build CREATE INDEX statement
      const uniqueKeyword = indexUnique ? 'UNIQUE ' : '';
      const columnList = selectedColumns.join(', ');
      const sql = `CREATE ${uniqueKeyword}INDEX ${indexName} ON ${selectedTable} (${columnList})`;
      
      console.log('[TableDesigner] Executing SQL:', sql);
      await activeDb.execute(sql);
      console.log('[TableDesigner] Index created successfully');
      
      // Reload table structure to update indexes list
      await loadTableStructure(selectedTable);
      
      // Close dialog and reset state
      setCreateIndexOpen(false);
      setIndexName('');
      setIndexUnique(false);
      setSelectedColumns([]);
      setStatus(`Index "${indexName}" created successfully`);
      console.log('[TableDesigner] Dialog closed, state reset');
    } catch (err: any) {
      setErrorMsg(`Error creating index: ${err.message}`);
      console.error('[TableDesigner] Error creating index:', err);
    }
  };

  const handleDropIndexClick = (indexName: string) => {
    console.log('[TableDesigner] Drop index clicked:', indexName);
    setIndexToDrop(indexName);
    setErrorMsg('');
    setDropIndexOpen(true);
  };

  const handleDropIndex = async () => {
    if (!activeDb || !selectedTable || !indexToDrop) return;
    
    setErrorMsg('');
    setStatus(`Dropping index "${indexToDrop}"...`);
    
    try {
      console.log('[TableDesigner] Dropping index:', indexToDrop);
      
      const sql = `DROP INDEX ${indexToDrop}`;
      console.log('[TableDesigner] Executing SQL:', sql);
      await activeDb.execute(sql);
      console.log('[TableDesigner] Index dropped successfully');
      
      // Reload table structure to update indexes list
      await loadTableStructure(selectedTable);
      
      // Close dialog and reset state
      setDropIndexOpen(false);
      setIndexToDrop(null);
      setStatus(`Index "${indexToDrop}" dropped successfully`);
      console.log('[TableDesigner] Dialog closed, state reset');
    } catch (err: any) {
      setErrorMsg(`Error dropping index: ${err.message}`);
      console.error('[TableDesigner] Error dropping index:', err);
    }
  };

  const handleRenameTableClick = () => {
    console.log('[TableDesigner] Rename table clicked');
    setNewTableName(selectedTable || '');
    setErrorMsg('');
    setRenameTableOpen(true);
  };

  const handleRenameTable = async () => {
    if (!activeDb || !selectedTable) return;
    
    // Validation
    if (!newTableName.trim()) {
      setErrorMsg('Table name is required');
      return;
    }
    
    if (newTableName === selectedTable) {
      setErrorMsg('New table name must be different from current name');
      return;
    }
    
    setErrorMsg('');
    setStatus(`Renaming table "${selectedTable}" to "${newTableName}"...`);
    
    try {
      console.log('[TableDesigner] Renaming table:', selectedTable, 'to', newTableName);
      
      const sql = `ALTER TABLE ${selectedTable} RENAME TO ${newTableName}`;
      console.log('[TableDesigner] Executing SQL:', sql);
      await activeDb.execute(sql);
      console.log('[TableDesigner] Table renamed successfully');
      
      // Update selected table to new name
      setSelectedTable(newTableName);
      
      // Reload table list
      await refreshTables();
      
      // Reload table structure
      await loadTableStructure(newTableName);
      
      // Close dialog and reset state
      setRenameTableOpen(false);
      setNewTableName('');
      setStatus(`Table renamed to "${newTableName}" successfully`);
      console.log('[TableDesigner] Dialog closed, state reset');
    } catch (err: any) {
      setErrorMsg(`Error renaming table: ${err.message}`);
      console.error('[TableDesigner] Error renaming table:', err);
    }
  };

  const handleDropTableClick = () => {
    console.log('[TableDesigner] Drop table clicked');
    setErrorMsg('');
    setDropTableOpen(true);
  };

  const handleDropTable = async () => {
    if (!activeDb || !selectedTable) return;
    
    setErrorMsg('');
    setStatus(`Dropping table "${selectedTable}"...`);
    
    try {
      console.log('[TableDesigner] Dropping table:', selectedTable);
      
      const sql = `DROP TABLE ${selectedTable}`;
      console.log('[TableDesigner] Executing SQL:', sql);
      await activeDb.execute(sql);
      console.log('[TableDesigner] Table dropped successfully');
      
      // Clear selected table
      setSelectedTable('');
      setColumns([]);
      setIndexes([]);
      
      // Reload table list
      await refreshTables();
      
      // Close dialog
      setDropTableOpen(false);
      setStatus(`Table "${selectedTable}" dropped successfully`);
      console.log('[TableDesigner] Dialog closed, state reset');
    } catch (err: any) {
      setErrorMsg(`Error dropping table: ${err.message}`);
      console.error('[TableDesigner] Error dropping table:', err);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Table Designer</h1>
        <p className="text-muted-foreground">
          Visual table structure editor - view and modify table columns, indexes, and constraints
        </p>
      </div>

      {status && (
        <div className="mb-4 p-3 bg-muted rounded-md text-sm">
          {status}
        </div>
      )}

      {!activeDb ? (
        <div className="text-center py-8">
          <p className="mb-4">No database loaded. Please create or import a database first.</p>
          <Button asChild>
            <a href="/db">Go to Database Management</a>
          </Button>
        </div>
      ) : (
        <>
          {/* Table Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Table</CardTitle>
              <CardDescription>Choose a table to view and edit its structure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select value={selectedTable} onValueChange={handleTableChange}>
                    <SelectTrigger id="tableSelect" data-testid="table-select" className="w-full">
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
                <Button
                  id="refreshTables"
                  onClick={refreshTables}
                  variant="outline"
                >
                  Refresh
                </Button>
                {selectedTable && (
                  <>
                    <Button
                      onClick={handleRenameTableClick}
                      variant="outline"
                    >
                      Rename Table
                    </Button>
                    <Button
                      onClick={handleDropTableClick}
                      variant="destructive"
                    >
                      Drop Table
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Table Structure */}
          {selectedTable && (
            <>
              {/* Columns Section */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle data-table-title>
                        Columns - {selectedTable}
                      </CardTitle>
                      <CardDescription>
                        {columns.length} {columns.length === 1 ? 'column' : 'columns'}
                      </CardDescription>
                    </div>
                    <Button 
                      id="addColumn" 
                      variant="outline"
                      onClick={() => setAddColumnOpen(true)}
                    >
                      Add Column
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div data-column-list>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Constraints</TableHead>
                          <TableHead>Default</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {columns.map((col) => (
                          <TableRow key={col.cid}>
                            <TableCell className="font-medium">{col.name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{col.type}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 flex-wrap">
                                {col.pk === 1 && (
                                  <Badge variant="default">Primary Key</Badge>
                                )}
                                {col.notnull === 1 && (
                                  <Badge variant="outline">NOT NULL</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {col.dflt_value !== null ? String(col.dflt_value) : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditColumnClick(col)}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteColumnClick(col)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Indexes Section */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Indexes</CardTitle>
                      <CardDescription>
                        {indexes.length} {indexes.length === 1 ? 'index' : 'indexes'}
                      </CardDescription>
                    </div>
                    <Button variant="outline" onClick={handleCreateIndexClick}>
                      Add Index
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {indexes.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No indexes defined for this table
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Origin</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {indexes.map((idx) => (
                          <TableRow key={idx.name}>
                            <TableCell className="font-medium">{idx.name}</TableCell>
                            <TableCell>
                              <Badge variant={idx.unique === 1 ? 'default' : 'secondary'}>
                                {idx.unique === 1 ? 'UNIQUE' : 'INDEX'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {idx.origin}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                disabled={idx.origin === 'pk'}
                                data-index-name={idx.name}
                                onClick={() => handleDropIndexClick(idx.name)}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* Add Column Dialog */}
      <Dialog open={addColumnOpen} onOpenChange={setAddColumnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Column</DialogTitle>
            <DialogDescription>
              Add a new column to {selectedTable}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {errorMsg && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {errorMsg}
              </div>
            )}

            {/* Column Name */}
            <div className="space-y-2">
              <Label htmlFor="columnName">Column Name</Label>
              <Input
                id="columnName"
                placeholder="e.g., email"
                value={newColumn.name}
                onChange={(e) => setNewColumn({ ...newColumn, name: e.target.value })}
              />
            </div>

            {/* Data Type */}
            <div className="space-y-2">
              <Label htmlFor="columnType">Data Type</Label>
              <Select 
                value={newColumn.type} 
                onValueChange={(value) => setNewColumn({ ...newColumn, type: value })}
              >
                <SelectTrigger id="columnType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEXT">TEXT</SelectItem>
                  <SelectItem value="INTEGER">INTEGER</SelectItem>
                  <SelectItem value="REAL">REAL</SelectItem>
                  <SelectItem value="BLOB">BLOB</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Default Value */}
            <div className="space-y-2">
              <Label htmlFor="defaultValue">Default Value (optional)</Label>
              <Input
                id="defaultValue"
                placeholder="Leave empty for NULL"
                value={newColumn.defaultValue}
                onChange={(e) => setNewColumn({ ...newColumn, defaultValue: e.target.value })}
              />
            </div>

            {/* Constraints */}
            <div className="space-y-3">
              <Label>Constraints</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notNull"
                  checked={newColumn.notNull}
                  onCheckedChange={(checked) => 
                    setNewColumn({ ...newColumn, notNull: checked as boolean })
                  }
                />
                <label
                  htmlFor="notNull"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  NOT NULL
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="unique"
                  checked={newColumn.unique}
                  onCheckedChange={(checked) => 
                    setNewColumn({ ...newColumn, unique: checked as boolean })
                  }
                />
                <label
                  htmlFor="unique"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  UNIQUE
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddColumnOpen(false)}>
              Cancel
            </Button>
            <Button id="confirmAddColumn" onClick={handleAddColumn}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Column Confirmation Dialog */}
      <Dialog open={deleteColumnOpen} onOpenChange={setDeleteColumnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Column</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the column "{columnToDelete?.name}"?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {errorMsg && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                <strong>Warning:</strong> This action cannot be undone. All data in this column will be lost.
              </p>
              
              {columnToDelete && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p><strong>Column:</strong> {columnToDelete.name}</p>
                  <p><strong>Type:</strong> {columnToDelete.type}</p>
                  {columnToDelete.pk === 1 && (
                    <p className="text-destructive mt-2">
                      ⚠️ Cannot delete PRIMARY KEY column
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteColumnOpen(false);
                setColumnToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              id="confirmDeleteColumn"
              variant="destructive"
              onClick={handleDeleteColumn}
              disabled={columnToDelete?.pk === 1}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Column Dialog */}
      <Dialog open={editColumnOpen} onOpenChange={setEditColumnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Column</DialogTitle>
            <DialogDescription>
              Modify column properties. Column name can be changed.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {errorMsg && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              {/* Current column info */}
              {columnToEdit && (
                <div className="p-3 bg-muted rounded-md text-sm">
                  <p><strong>Current column:</strong> {columnToEdit.name}</p>
                  <p><strong>Type:</strong> {columnToEdit.type}</p>
                  {columnToEdit.pk === 1 && (
                    <p className="text-destructive mt-2">
                      ⚠️ Cannot modify PRIMARY KEY column
                    </p>
                  )}
                </div>
              )}

              {/* Column name input */}
              <div className="space-y-2">
                <Label htmlFor="editColumnName">Column Name</Label>
                <Input
                  id="editColumnName"
                  value={editedColumnName}
                  onChange={(e) => setEditedColumnName(e.target.value)}
                  placeholder="Enter new column name"
                />
              </div>

              {/* Type selector (display only for now) */}
              <div className="space-y-2">
                <Label htmlFor="editColumnType">Data Type</Label>
                <Select value={columnToEdit?.type || 'TEXT'} disabled>
                  <SelectTrigger id="editColumnType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEXT">TEXT</SelectItem>
                    <SelectItem value="INTEGER">INTEGER</SelectItem>
                    <SelectItem value="REAL">REAL</SelectItem>
                    <SelectItem value="BLOB">BLOB</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Type modification not yet supported
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setEditColumnOpen(false);
                setColumnToEdit(null);
                setEditedColumnName('');
                setErrorMsg('');
              }}
            >
              Cancel
            </Button>
            <Button 
              id="confirmEditColumn"
              onClick={handleEditColumn}
              disabled={columnToEdit?.pk === 1}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Index Dialog */}
      <Dialog open={createIndexOpen} onOpenChange={setCreateIndexOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Index</DialogTitle>
            <DialogDescription>
              Create a new index on {selectedTable}. Select one or more columns to index.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {errorMsg && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              {/* Index Name */}
              <div className="space-y-2">
                <Label htmlFor="indexName">Index Name</Label>
                <Input
                  id="indexName"
                  value={indexName}
                  onChange={(e) => setIndexName(e.target.value)}
                  placeholder="e.g., idx_email or idx_user_location"
                />
              </div>

              {/* UNIQUE Index Checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="indexUnique"
                  name="unique"
                  checked={indexUnique}
                  onChange={(e) => setIndexUnique(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="indexUnique" className="font-normal cursor-pointer">
                  Create UNIQUE index (enforces uniqueness constraint)
                </Label>
              </div>

              {/* Column Selection */}
              <div className="space-y-2">
                <Label>Select Columns for Index</Label>
                <div className="border rounded-md p-4 space-y-2 max-h-64 overflow-y-auto">
                  {columns.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No columns available</p>
                  ) : (
                    columns.map((col) => (
                      <div key={col.name} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`col-${col.name}`}
                          data-column={col.name}
                          checked={selectedColumns.includes(col.name)}
                          onChange={() => handleColumnToggle(col.name)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor={`col-${col.name}`} className="font-normal cursor-pointer flex-1">
                          <span className="font-medium">{col.name}</span>
                          <span className="text-muted-foreground ml-2">({col.type})</span>
                          {col.pk === 1 && (
                            <span className="ml-2 text-xs text-blue-600">PRIMARY KEY</span>
                          )}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
                {selectedColumns.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedColumns.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setCreateIndexOpen(false);
                setIndexName('');
                setIndexUnique(false);
                setSelectedColumns([]);
                setErrorMsg('');
              }}
            >
              Cancel
            </Button>
            <Button 
              id="confirmCreateIndex"
              onClick={handleCreateIndex}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drop Index Dialog */}
      <Dialog open={dropIndexOpen} onOpenChange={setDropIndexOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Drop Index</DialogTitle>
            <DialogDescription>
              Are you sure you want to drop this index? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {errorMsg && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4">
                {errorMsg}
              </div>
            )}

            {indexToDrop && (
              <div className="p-3 bg-muted rounded-md text-sm">
                <p><strong>Index name:</strong> {indexToDrop}</p>
                <p className="text-destructive mt-2">
                  ⚠️ Dropping this index is permanent and cannot be undone.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDropIndexOpen(false);
                setIndexToDrop(null);
                setErrorMsg('');
              }}
            >
              Cancel
            </Button>
            <Button 
              id="confirmDropIndex"
              variant="destructive"
              onClick={handleDropIndex}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Table Dialog */}
      <Dialog open={renameTableOpen} onOpenChange={setRenameTableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Table</DialogTitle>
            <DialogDescription>
              Enter a new name for the table. All data and indexes will be preserved.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {errorMsg && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="newTableName">New Table Name</Label>
                <Input
                  id="newTableName"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="Enter new table name"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setRenameTableOpen(false);
                setNewTableName('');
                setErrorMsg('');
              }}
            >
              Cancel
            </Button>
            <Button 
              id="confirmRenameTable"
              onClick={handleRenameTable}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drop Table Dialog */}
      <Dialog open={dropTableOpen} onOpenChange={setDropTableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Drop Table</DialogTitle>
            <DialogDescription>
              Are you sure you want to drop this table? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {errorMsg && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4">
                {errorMsg}
              </div>
            )}

            {selectedTable && (
              <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
                <div className="space-y-2">
                  <p className="font-semibold text-destructive">
                    Table: <span className="font-mono">{selectedTable}</span>
                  </p>
                  <p className="text-sm">
                    {columns.length} {columns.length === 1 ? 'column' : 'columns'}, 
                    {' '}{indexes.length} {indexes.length === 1 ? 'index' : 'indexes'}
                  </p>
                  <p className="text-destructive text-sm font-semibold mt-3">
                    ⚠️ All data will be permanently deleted and cannot be recovered!
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDropTableOpen(false);
                setErrorMsg('');
              }}
            >
              Cancel
            </Button>
            <Button 
              id="confirmDropTable"
              variant="destructive"
              onClick={handleDropTable}
            >
              Drop Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TableDesignerPage() {
  const { currentDbName } = useDatabaseStore();
  
  return <TableDesignerContent />;
}
