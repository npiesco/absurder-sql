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

interface TriggerInfo {
  name: string;
  tbl_name: string;
  sql: string;
}

interface TriggerDetails {
  name: string;
  timing: 'BEFORE' | 'AFTER';
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  body: string;
}

export default function TriggersManagementPage() {
  const { db, setDb, currentDbName, setCurrentDbName } = useDatabaseStore();
  const [triggers, setTriggers] = useState<TriggerInfo[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [windowTestDb, setWindowTestDb] = useState<any>(null);
  const activeDb = db || windowTestDb;
  
  // Create Trigger Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [triggerName, setTriggerName] = useState('');
  const [triggerTiming, setTriggerTiming] = useState<'BEFORE' | 'AFTER'>('AFTER');
  const [triggerEvent, setTriggerEvent] = useState<'INSERT' | 'UPDATE' | 'DELETE'>('INSERT');
  const [triggerTable, setTriggerTable] = useState('');
  const [triggerBody, setTriggerBody] = useState('');
  
  // Drop Trigger Dialog
  const [dropDialogOpen, setDropDialogOpen] = useState(false);
  const [triggerToDrop, setTriggerToDrop] = useState<string | null>(null);

  // Edit Trigger Dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [triggerToEdit, setTriggerToEdit] = useState<TriggerDetails | null>(null);
  const [editTriggerName, setEditTriggerName] = useState('');
  const [editTriggerTiming, setEditTriggerTiming] = useState<'BEFORE' | 'AFTER'>('AFTER');
  const [editTriggerEvent, setEditTriggerEvent] = useState<'INSERT' | 'UPDATE' | 'DELETE'>('INSERT');
  const [editTriggerTable, setEditTriggerTable] = useState('');
  const [editTriggerBody, setEditTriggerBody] = useState('');

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

  // Load triggers
  const loadTriggers = async () => {
    if (!activeDb) {
      console.error('[TriggersPage] loadTriggers called but activeDb is null');
      return;
    }

    console.log('[TriggersPage] loadTriggers called');

    try {
      setLoading(true);
      setError('');

      const result = await activeDb.execute(
        "SELECT name, tbl_name, sql FROM sqlite_master WHERE type='trigger' ORDER BY name"
      );

      console.log('[TriggersPage] Loaded triggers:', result.rows.length);

      setTriggers(result.rows.map((row: any) => ({
        name: row.values[0].value as string,
        tbl_name: row.values[1].value as string,
        sql: row.values[2].value as string
      })));
    } catch (err) {
      console.error('[TriggersPage] Error loading triggers:', err);
      setError(`Failed to load triggers: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // Load tables for dropdown
  const loadTables = async () => {
    if (!activeDb) return;

    try {
      const result = await activeDb.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      );

      const tableList = result.rows.map((row: any) => row.values[0].value as string);
      setTables(tableList);
    } catch (err) {
      console.error('[TriggersPage] Error loading tables:', err);
    }
  };

  useEffect(() => {
    if (activeDb && !initializing) {
      loadTriggers();
      loadTables();

      // Expose functions for testing
      (window as any).loadTriggers = loadTriggers;
      (window as any).loadTables = loadTables;
    }
  }, [activeDb, initializing]);

  // Parse trigger SQL to extract details
  const parseTriggerSQL = (sql: string): TriggerDetails | null => {
    try {
      // Example SQL: CREATE TRIGGER test_audit_trigger AFTER INSERT ON test_products BEGIN ... END
      const nameMatch = sql.match(/CREATE\s+TRIGGER\s+(\w+)/i);
      const timingMatch = sql.match(/\s+(BEFORE|AFTER)\s+/i);
      const eventMatch = sql.match(/\s+(INSERT|UPDATE|DELETE)\s+/i);
      const tableMatch = sql.match(/\s+ON\s+(\w+)/i);
      const bodyMatch = sql.match(/BEGIN\s+([\s\S]+)\s+END/i);
      
      if (!nameMatch || !timingMatch || !eventMatch || !tableMatch || !bodyMatch) {
        return null;
      }
      
      return {
        name: nameMatch[1],
        timing: timingMatch[1].toUpperCase() as 'BEFORE' | 'AFTER',
        event: eventMatch[1].toUpperCase() as 'INSERT' | 'UPDATE' | 'DELETE',
        table: tableMatch[1],
        body: bodyMatch[1].trim()
      };
    } catch (err) {
      console.error('[TriggersPage] Error parsing trigger SQL:', err);
      return null;
    }
  };

  // Create trigger
  const handleCreateTrigger = async () => {
    if (!activeDb) return;

    setError('');

    // Validation
    if (!triggerName.trim()) {
      setError('Trigger name is required');
      return;
    }

    if (!triggerTable.trim()) {
      setError('Table must be selected');
      return;
    }

    if (!triggerBody.trim()) {
      setError('Trigger body is required');
      return;
    }

    // Check if trigger already exists
    const existingTrigger = triggers.find(t => t.name.toLowerCase() === triggerName.toLowerCase());
    if (existingTrigger) {
      setError(`Trigger "${triggerName}" already exists`);
      return;
    }

    try {
      setLoading(true);

      const sql = `CREATE TRIGGER ${triggerName}
${triggerTiming} ${triggerEvent} ON ${triggerTable}
BEGIN
  ${triggerBody}
END`;

      console.log('[TriggersPage] Creating trigger with SQL:', sql);

      await activeDb.execute(sql);
      await activeDb.sync();

      console.log('[TriggersPage] Trigger created successfully');

      // Close dialog and reset
      setCreateDialogOpen(false);
      setTriggerName('');
      setTriggerTiming('AFTER');
      setTriggerEvent('INSERT');
      setTriggerTable('');
      setTriggerBody('');

      // Reload triggers
      await loadTriggers();
    } catch (err) {
      console.error('[TriggersPage] Error creating trigger:', err);
      setError(`Failed to create trigger: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // Drop trigger
  const handleDropTrigger = async () => {
    if (!activeDb || !triggerToDrop) return;

    setError('');

    try {
      setLoading(true);

      console.log('[TriggersPage] Dropping trigger:', triggerToDrop);

      await activeDb.execute(`DROP TRIGGER ${triggerToDrop}`);
      await activeDb.sync();

      console.log('[TriggersPage] Trigger dropped successfully');

      // Close dialog and reset
      setDropDialogOpen(false);
      setTriggerToDrop(null);

      // Reload triggers
      await loadTriggers();
    } catch (err) {
      console.error('[TriggersPage] Error dropping trigger:', err);
      setError(`Failed to drop trigger: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // Open drop dialog
  const openDropDialog = (triggerName: string) => {
    setTriggerToDrop(triggerName);
    setDropDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (trigger: TriggerInfo) => {
    const details = parseTriggerSQL(trigger.sql);
    if (!details) {
      setError('Failed to parse trigger SQL for editing');
      return;
    }
    
    setTriggerToEdit(details);
    setEditTriggerName(details.name);
    setEditTriggerTiming(details.timing);
    setEditTriggerEvent(details.event);
    setEditTriggerTable(details.table);
    setEditTriggerBody(details.body);
    setEditDialogOpen(true);
  };

  // Edit trigger (recreate)
  const handleEditTrigger = async () => {
    if (!activeDb || !triggerToEdit) return;

    setError('');

    // Validation
    if (!editTriggerName.trim()) {
      setError('Trigger name is required');
      return;
    }

    if (!editTriggerTable.trim()) {
      setError('Table must be selected');
      return;
    }

    if (!editTriggerBody.trim()) {
      setError('Trigger body is required');
      return;
    }

    // Check for duplicate name (if name changed)
    if (editTriggerName !== triggerToEdit.name) {
      const existingTrigger = triggers.find(t => t.name.toLowerCase() === editTriggerName.toLowerCase());
      if (existingTrigger) {
        setError(`Trigger "${editTriggerName}" already exists`);
        return;
      }
    }

    try {
      setLoading(true);

      // Use transaction to drop and recreate
      await activeDb.execute('BEGIN TRANSACTION');

      try {
        console.log('[TriggersPage] Dropping old trigger:', triggerToEdit.name);
        await activeDb.execute(`DROP TRIGGER ${triggerToEdit.name}`);

        const sql = `CREATE TRIGGER ${editTriggerName}
${editTriggerTiming} ${editTriggerEvent} ON ${editTriggerTable}
BEGIN
  ${editTriggerBody}
END`;

        console.log('[TriggersPage] Creating updated trigger with SQL:', sql);
        await activeDb.execute(sql);

        await activeDb.execute('COMMIT');
        await activeDb.sync();

        console.log('[TriggersPage] Trigger edited successfully');

        // Close dialog and reset
        setEditDialogOpen(false);
        setTriggerToEdit(null);
        setEditTriggerName('');
        setEditTriggerTiming('AFTER');
        setEditTriggerEvent('INSERT');
        setEditTriggerTable('');
        setEditTriggerBody('');

        // Reload triggers
        await loadTriggers();
      } catch (err) {
        console.error('[TriggersPage] Error during trigger edit, rolling back:', err);
        await activeDb.execute('ROLLBACK');
        throw err;
      }
    } catch (err) {
      console.error('[TriggersPage] Error editing trigger:', err);
      setError(`Failed to edit trigger: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Initializing database...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Triggers Management</h1>
          <p className="text-muted-foreground mt-1">
            {triggers.length} {triggers.length === 1 ? 'trigger' : 'triggers'}
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          Create Trigger
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded" data-testid="error-message">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-muted-foreground">
          Loading...
        </div>
      )}

      {triggers.length === 0 && !loading ? (
        <div className="text-center py-12 text-muted-foreground">
          No triggers found. Create one to get started.
        </div>
      ) : (
        <div className="grid gap-4">
          {triggers.map((trigger) => {
            const details = parseTriggerSQL(trigger.sql);
            return (
              <Card key={trigger.name} data-trigger-card={trigger.name}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle data-slot="card-title">{trigger.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {details ? (
                          <>
                            <span className="font-medium">{details.timing}</span>
                            {' '}
                            <span className="font-medium">{details.event}</span>
                            {' on '}
                            <span className="font-medium">{details.table}</span>
                          </>
                        ) : (
                          `On ${trigger.tbl_name}`
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(trigger)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDropDialog(trigger.name)}
                      >
                        Drop
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-3 rounded text-sm font-mono overflow-x-auto" data-trigger-sql>
                    {trigger.sql}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Trigger Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Trigger</DialogTitle>
            <DialogDescription>
              Create a new database trigger
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded text-sm" data-testid="dialog-error-message">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="triggerName" className="text-sm font-medium">
                Trigger Name
              </label>
              <Input
                id="triggerName"
                value={triggerName}
                onChange={(e) => setTriggerName(e.target.value)}
                placeholder="my_trigger"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="triggerTiming" className="text-sm font-medium">
                  Timing
                </label>
                <select
                  id="triggerTiming"
                  value={triggerTiming}
                  onChange={(e) => setTriggerTiming(e.target.value as 'BEFORE' | 'AFTER')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="BEFORE">BEFORE</option>
                  <option value="AFTER">AFTER</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="triggerEvent" className="text-sm font-medium">
                  Event
                </label>
                <select
                  id="triggerEvent"
                  value={triggerEvent}
                  onChange={(e) => setTriggerEvent(e.target.value as 'INSERT' | 'UPDATE' | 'DELETE')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="INSERT">INSERT</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="triggerTable" className="text-sm font-medium">
                Table
              </label>
              <select
                id="triggerTable"
                value={triggerTable}
                onChange={(e) => setTriggerTable(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select a table...</option>
                {tables.map(table => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="triggerBody" className="text-sm font-medium">
                Trigger Body (SQL between BEGIN and END)
              </label>
              <Textarea
                id="triggerBody"
                value={triggerBody}
                onChange={(e) => setTriggerBody(e.target.value)}
                placeholder="INSERT INTO audit_log (action) VALUES ('something');"
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button id="confirmCreateTrigger" onClick={handleCreateTrigger} disabled={loading}>
              {loading ? 'Creating...' : 'Create Trigger'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Trigger Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Trigger</DialogTitle>
            <DialogDescription>
              Edit the trigger (will drop and recreate)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded text-sm" data-testid="dialog-error-message">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="editTriggerName" className="text-sm font-medium">
                Trigger Name
              </label>
              <Input
                id="editTriggerName"
                value={editTriggerName}
                onChange={(e) => setEditTriggerName(e.target.value)}
                placeholder="my_trigger"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="editTriggerTiming" className="text-sm font-medium">
                  Timing
                </label>
                <select
                  id="editTriggerTiming"
                  value={editTriggerTiming}
                  onChange={(e) => setEditTriggerTiming(e.target.value as 'BEFORE' | 'AFTER')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="BEFORE">BEFORE</option>
                  <option value="AFTER">AFTER</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="editTriggerEvent" className="text-sm font-medium">
                  Event
                </label>
                <select
                  id="editTriggerEvent"
                  value={editTriggerEvent}
                  onChange={(e) => setEditTriggerEvent(e.target.value as 'INSERT' | 'UPDATE' | 'DELETE')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="INSERT">INSERT</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="editTriggerTable" className="text-sm font-medium">
                Table
              </label>
              <select
                id="editTriggerTable"
                value={editTriggerTable}
                onChange={(e) => setEditTriggerTable(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select a table...</option>
                {tables.map(table => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="editTriggerBody" className="text-sm font-medium">
                Trigger Body (SQL between BEGIN and END)
              </label>
              <Textarea
                id="editTriggerBody"
                value={editTriggerBody}
                onChange={(e) => setEditTriggerBody(e.target.value)}
                placeholder="INSERT INTO audit_log (action) VALUES ('something');"
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button id="confirmEditTrigger" onClick={handleEditTrigger} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drop Trigger Dialog */}
      <Dialog open={dropDialogOpen} onOpenChange={setDropDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Drop Trigger</DialogTitle>
            <DialogDescription>
              Are you sure you want to drop the trigger "{triggerToDrop}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDropDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDropTrigger} disabled={loading}>
              {loading ? 'Dropping...' : 'Drop Trigger'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
