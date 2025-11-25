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
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ViewInfo {
  name: string;
  sql: string;
}

interface ViewDataResult {
  columns: string[];
  rows: any[];
}

export default function ViewsManagementPage() {
  const { db, setDb, currentDbName, setCurrentDbName } = useDatabaseStore();
  const [views, setViews] = useState<ViewInfo[]>([]);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [windowTestDb, setWindowTestDb] = useState<any>(null);
  const activeDb = db || windowTestDb;
  
  // Create View Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewName, setViewName] = useState('');
  const [viewSQL, setViewSQL] = useState('');
  
  // Drop View Dialog
  const [dropDialogOpen, setDropDialogOpen] = useState(false);
  const [viewToDrop, setViewToDrop] = useState<string | null>(null);

  // Edit View Dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewToEdit, setViewToEdit] = useState<ViewInfo | null>(null);
  const [editViewName, setEditViewName] = useState('');
  const [editViewSQL, setEditViewSQL] = useState('');
  
  // View Data
  const [viewDataOpen, setViewDataOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<string | null>(null);
  const [viewData, setViewData] = useState<ViewDataResult | null>(null);

  // Initialize WASM if needed
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
          (window as any).testDb = db;
        }

        setInitializing(false);
      } catch (err: any) {
        console.error('Failed to initialize WASM:', err);
        setInitializing(false);
      }
    }
    initializeWasm();
  }, [db]);

  // Sync window.testDb
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkTestDb = () => {
      const testDb = (window as any).testDb;
      if (testDb && !windowTestDb) setWindowTestDb(testDb);
    };
    checkTestDb();
    const interval = setInterval(checkTestDb, 50);
    return () => clearInterval(interval);
  }, [windowTestDb]);

  // Load views when activeDb is available
  useEffect(() => {
    if (activeDb && !initializing) {
      loadViews();
    }
  }, [activeDb, initializing]);

  const loadViews = async () => {
    if (!activeDb) {
      console.log('[ViewsPage] loadViews: activeDb not available');
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('[ViewsPage] Loading views...');
      const result = await activeDb.execute(
        "SELECT name, sql FROM sqlite_master WHERE type='view' ORDER BY name"
      );

      const viewList: ViewInfo[] = result.rows.map((row: any) => ({
        name: row.values[0].value as string,
        sql: row.values[1].value as string,
      }));

      console.log('[ViewsPage] Loaded views:', viewList);
      setViews(viewList);
    } catch (err: any) {
      console.error('[ViewsPage] Failed to load views:', err);
      setError(`Failed to load views: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateView = async () => {
    if (!activeDb) return;

    setError('');

    // Validation
    if (!viewName.trim()) {
      setError('View name is required');
      return;
    }

    if (!viewSQL.trim()) {
      setError('SQL query is required');
      return;
    }

    try {
      // Check if view already exists
      const existingView = views.find(v => v.name.toLowerCase() === viewName.toLowerCase());
      if (existingView) {
        setError(`View "${viewName}" already exists`);
        return;
      }

      // Create the view
      await activeDb.execute(`CREATE VIEW ${viewName} AS ${viewSQL}`);

      // Sync to persist to IndexedDB
      await activeDb.sync();

      // Reload views
      await loadViews();

      // Close dialog and reset
      setCreateDialogOpen(false);
      setViewName('');
      setViewSQL('');
    } catch (err: any) {
      console.error('Failed to create view:', err);
      setError(`Failed to create view: ${err.message}`);
    }
  };

  const handleDropView = async () => {
    if (!activeDb || !viewToDrop) return;

    try {
      setError('');
      await activeDb.execute(`DROP VIEW IF EXISTS ${viewToDrop}`);

      // Sync to persist to IndexedDB
      await activeDb.sync();

      // Reload views
      await loadViews();

      // Close dialog
      setDropDialogOpen(false);
      setViewToDrop(null);
    } catch (err: any) {
      console.error('Failed to drop view:', err);
      setError(`Failed to drop view: ${err.message}`);
      setDropDialogOpen(false);
      setViewToDrop(null);
    }
  };

  const handleEditView = async () => {
    if (!activeDb || !viewToEdit) return;

    setError('');

    const trimmedName = editViewName.trim();
    const trimmedSQL = editViewSQL.trim();

    if (!trimmedName) {
      setError('View name is required');
      return;
    }

    if (!trimmedSQL) {
      setError('SQL query is required');
      return;
    }

    const nameChanged = trimmedName.toLowerCase() !== viewToEdit.name.toLowerCase();
    if (nameChanged) {
      const duplicate = views.find(
        (v) => v.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicate) {
        setError(`View "${trimmedName}" already exists`);
        return;
      }
    }

    try {
      console.log('[ViewsPage] Editing view:', viewToEdit.name, '->', trimmedName);
      await activeDb.execute('BEGIN');
      await activeDb.execute(`DROP VIEW IF EXISTS ${viewToEdit.name}`);
      await activeDb.execute(`CREATE VIEW ${trimmedName} AS ${trimmedSQL}`);
      await activeDb.execute('COMMIT');

      await activeDb.sync();
      await loadViews();

      setEditDialogOpen(false);
      setViewToEdit(null);
      setEditViewName('');
      setEditViewSQL('');
    } catch (err: any) {
      console.error('Failed to edit view:', err);
      try {
        await activeDb.execute('ROLLBACK');
      } catch (rollbackError) {
        console.error('Failed to rollback edit view transaction:', rollbackError);
      }
      setError(`Failed to edit view: ${err.message}`);
    }
  };

  const handleViewData = async (viewName: string) => {
    if (!activeDb) return;

    try {
      setError('');
      const result = await activeDb.execute(`SELECT * FROM ${viewName}`);

      // Extract column names from first row if available
      const columns = result.rows.length > 0
        ? result.rows[0].values.map((_: any, idx: number) => `column_${idx}`)
        : [];

      setViewData({
        columns,
        rows: result.rows,
      });

      setSelectedView(viewName);
      setViewDataOpen(true);
    } catch (err: any) {
      console.error('Failed to query view:', err);
      setError(`Failed to query view: ${err.message}`);
    }
  };

  const openDropDialog = (viewName: string) => {
    setViewToDrop(viewName);
    setDropDialogOpen(true);
  };

  const openEditDialog = (view: ViewInfo) => {
    setViewToEdit(view);
    setEditViewName(view.name);
    setEditViewSQL(view.sql);
    setEditDialogOpen(true);
  };

  const handleEditDialogOpenChange = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      setViewToEdit(null);
      setEditViewName('');
      setEditViewSQL('');
    }
  };

  if (initializing) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p>Initializing database...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Views Management</h1>
        <p className="text-muted-foreground">
          Create and manage database views
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <Button onClick={() => setCreateDialogOpen(true)}>
          Create View
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Views ({views.length} {views.length === 1 ? 'view' : 'views'})
          </CardTitle>
          <CardDescription>
            Database views and their definitions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading views...</p>
          ) : views.length === 0 ? (
            <p className="text-muted-foreground">No views found. Create one to get started.</p>
          ) : (
            <div className="space-y-4">
              {views.map((view) => (
                <Card key={view.name} data-view-card={view.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{view.name}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditDialog(view)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewData(view.name)}
                        >
                          View Data
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDropDialog(view.name)}
                        >
                          Drop
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="bg-muted p-3 rounded text-sm font-mono overflow-x-auto"
                      data-view-sql={view.name}
                    >
                      {view.sql}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create View Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create View</DialogTitle>
            <DialogDescription>
              Create a new database view with a SELECT query
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="viewName" className="block text-sm font-medium mb-2">
                View Name
              </label>
              <Input
                id="viewName"
                type="text"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder="my_view"
              />
            </div>
            
            <div>
              <label htmlFor="viewSQL" className="block text-sm font-medium mb-2">
                SQL Query
              </label>
              <Textarea
                id="viewSQL"
                value={viewSQL}
                onChange={(e) => setViewSQL(e.target.value)}
                placeholder="SELECT * FROM table_name WHERE condition"
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button id="confirmCreateView" onClick={handleCreateView}>
              Create View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drop View Dialog */}
      <Dialog open={dropDialogOpen} onOpenChange={setDropDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Drop View</DialogTitle>
            <DialogDescription>
              Are you sure you want to drop the view &quot;{viewToDrop}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDropDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              id="confirmDropView"
              variant="destructive"
              onClick={handleDropView}
            >
              Drop View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Data Dialog */}
      <Dialog open={viewDataOpen} onOpenChange={setViewDataOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>View Data: {selectedView}</DialogTitle>
            <DialogDescription>
              Data from the view
            </DialogDescription>
          </DialogHeader>

          {viewData && (
            <div className="overflow-x-auto max-h-96">
              <Table data-view-data-table="true">
                <TableHeader>
                  <TableRow>
                    {viewData.columns.map((col, idx) => (
                      <TableHead key={idx}>{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewData.rows.map((row, rowIdx) => (
                    <TableRow key={rowIdx}>
                      {row.values.map((cell: any, cellIdx: number) => (
                        <TableCell key={cellIdx}>
                          {cell.type === 'Null' ? (
                            <span className="text-muted-foreground italic">NULL</span>
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
          )}

          <DialogFooter>
            <Button onClick={() => setViewDataOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit View Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit View</DialogTitle>
            <DialogDescription>
              Update the view definition. This will recreate the view.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="editViewName" className="block text-sm font-medium mb-2">
                View Name
              </label>
              <Input
                id="editViewName"
                type="text"
                value={editViewName}
                onChange={(e) => setEditViewName(e.target.value)}
                placeholder="my_view"
              />
            </div>

            <div>
              <label htmlFor="editViewSQL" className="block text-sm font-medium mb-2">
                SQL Query
              </label>
              <Textarea
                id="editViewSQL"
                value={editViewSQL}
                onChange={(e) => setEditViewSQL(e.target.value)}
                placeholder="SELECT * FROM table_name WHERE condition"
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button id="confirmEditView" onClick={handleEditView}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
