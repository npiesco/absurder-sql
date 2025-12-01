'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useDatabaseStore } from '@/lib/db/store';
import { saveBackup, loadBackup, clearBackup } from '@/lib/db/backup';

export default function DatabaseManagementPage() {
  const { db, currentDbName, loading, status, tableCount, showSystemTables, _hasHydrated, setDb, setCurrentDbName, setLoading, setStatus, setTableCount, setShowSystemTables } = useDatabaseStore();
  const [newDbName, setNewDbName] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [wasmReady, setWasmReady] = useState(false);
  const [dbInfo, setDbInfo] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize WASM and expose Database to window (like working vite app)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).Database) return; // Already initialized

    async function initializeWasm() {
      try {
        const init = (await import('@npiesco/absurder-sql')).default;
        const { Database } = await import('@npiesco/absurder-sql');
        
        // Init WASM first
        await init();
        
        // Expose Database class on window IMMEDIATELY after init (like vite app line 66)
        (window as any).Database = Database;
        
        setWasmReady(true);
        setLoading(false);
        setStatus('Ready to load database');
      } catch (err: any) {
        console.error('Failed to initialize:', err);
        setStatus(`Error: ${err.message}`);
        setLoading(false);
      }
    }

    initializeWasm();
  }, []);

  // Load database when currentDbName is available (after Zustand hydration) AND WASM is ready
  useEffect(() => {
    const Database = (window as any).Database;
    console.log('[PWA] loadDatabase useEffect triggered', { wasmReady, hasHydrated: _hasHydrated, hasDb: !!db, currentDbName });

    // CRITICAL: Wait for BOTH WASM init AND Zustand hydration before loading database
    if (!wasmReady || !_hasHydrated || db) return;

    async function loadDatabase() {
      try {
        // CRITICAL: Check for backup FIRST before trying VFS-based restore
        // This avoids sync() corruption issues
        console.log('[PWA] Step 1: Checking for backup...');
        const backup = await loadBackup();

        if (backup) {
          console.log(`[PWA] Step 2: Found backup for ${backup.dbName}, restoring...`);

          // Create temp database for import
          const tempDb = await Database.newDatabase(backup.dbName);

          // Import backup data
          await tempDb.importFromFile(backup.data);
          console.log('[PWA] Step 3: Backup imported, closing temp connection...');

          // Close temp database (importFromFile can corrupt WASM state)
          await tempDb.close();

          // Reopen fresh connection
          console.log('[PWA] Step 4: Reopening with fresh connection...');
          const dbInstance = await Database.newDatabase(backup.dbName);

          setDb(dbInstance);
          setCurrentDbName(backup.dbName);
          (window as any).testDb = dbInstance;

          console.log(`[PWA] Database restored from backup: ${backup.dbName}`);
          setStatus(`Restored: ${backup.dbName}`);
        } else if (currentDbName) {
          // No backup, try VFS-based restore (fallback)
          console.log(`[PWA] No backup found, trying VFS restore: ${currentDbName}`);
          const dbInstance = await Database.newDatabase(currentDbName);
          console.log('[PWA] Database.newDatabase() returned successfully');

          setDb(dbInstance);
          (window as any).testDb = dbInstance;

          console.log(`[PWA] Database restored from VFS: ${currentDbName}`);
          setStatus(`Loaded: ${currentDbName}`);
        } else {
          console.log('[PWA] No backup and no currentDbName - fresh start');
          setStatus('Create or import a database to get started');
        }
      } catch (err: any) {
        console.error('[PWA] Failed to load database:', err);
        setStatus(`Error loading database: ${err.message}`);
      }
    }

    loadDatabase();
  }, [wasmReady, _hasHydrated, currentDbName]);

  // CRITICAL: Persist database to IndexedDB before page unload/refresh
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeUnload = async () => {
      console.log('[PWA] Page unloading, saving backup and closing database');
      if (db && currentDbName) {
        try {
          // Save backup before closing (sync pattern)
          await saveBackup(db, currentDbName);
        } catch (err) {
          console.error('[PWA] Error saving backup on unload:', err);
        }
        // Then close as fallback
        db.close().catch((err: Error) => {
          console.error('[PWA] Error closing database on unload:', err);
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also close on component unmount
      if (db) {
        console.log('[PWA] Component unmounting, closing database');
        db.close().catch((err: Error) => {
          console.error('[PWA] Error closing database on unmount:', err);
        });
      }
    };
  }, [db, currentDbName]);

  const handleCreateDatabase = async () => {
    const Database = (window as any).Database;
    if (!newDbName.trim() || !Database) return;

    try {
      // Close existing database
      if (db) {
        await db.close();
      }

      // Normalize database name (add .db if not present)
      const normalizedName = newDbName.endsWith('.db') ? newDbName : `${newDbName}.db`;

      // Create new database
      const newDb = await Database.newDatabase(normalizedName);
      setDb(newDb);
      setCurrentDbName(normalizedName);
      (window as any).testDb = newDb;

      // Save backup immediately
      await saveBackup(newDb, normalizedName);

      setStatus(`Database created: ${normalizedName}`);
      setCreateDialogOpen(false);
      setNewDbName('');
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  const handleExport = async () => {
    if (!db) return;

    try {
      // Use the WASM export method
      const bytes = await db.exportToFile();
      const blob = new Blob([bytes], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Ensure .db extension if not present
      const filename = currentDbName || 'database.db';
      a.download = filename.endsWith('.db') ? filename : `${filename}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus('Database exported');
    } catch (err: any) {
      setStatus(`Export error: ${err.message}`);
    }
  };

  const handleImport = async () => {
    const Database = (window as any).Database;
    if (!Database) return;

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setStatus('No file selected');
      return;
    }

    try {
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Close existing database if one is open
      if (db) {
        await db.close();
      }

      // Use the imported filename as database name (remove path, keep extension)
      const dbName = file.name;

      // Create new database instance
      const newDb = await Database.newDatabase(dbName);

      // Import the data
      await newDb.importFromFile(uint8Array);

      // Close and reopen (importFromFile can corrupt WASM state)
      await newDb.close();
      const reopenedDb = await Database.newDatabase(dbName);

      setDb(reopenedDb);
      setCurrentDbName(dbName);
      (window as any).testDb = reopenedDb;

      // Save backup immediately after import
      await saveBackup(reopenedDb, dbName);

      setStatus('Import complete');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setStatus(`Import error: ${err.message}`);
    }
  };

  const handleRefreshInfo = async () => {
    if (!db) return;

    try {
      const query = showSystemTables 
        ? "SELECT type, name FROM sqlite_master ORDER BY name"
        : "SELECT type, name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name";
      const result = await db.execute(query);
      setTableCount(result.rows.length);
      
      // Get SQLite version to prove database is working
      const sqliteVersion = await db.execute("SELECT sqlite_version()");
      const version = sqliteVersion.rows[0]?.values[0]?.value || 'unknown';
      
      // Always show what was actually found
      if (result.rows.length > 0) {
        const items = result.rows.map((r: any) => {
          const type = r.values[0].value;
          const name = r.values[1].value;
          return `${name} (${type})`;
        }).join('\n');
        setDbInfo(`SQLite ${version}\n\nObjects found:\n${items}`);
        setStatus('Info refreshed');
      } else {
        // Prove database is real and working, just empty
        setDbInfo(`SQLite ${version}\n\nQuery: ${query}\n\nResult: 0 rows (empty database)`);
        setStatus('Info refreshed');
      }
    } catch (err) {
      setStatus(`Error: ${err}`);
      setDbInfo(`Error executing query: ${err}`);
    }
  };

  // Auto-refresh when showSystemTables toggle changes
  useEffect(() => {
    if (db) {
      handleRefreshInfo();
    }
  }, [showSystemTables]);

  const handleDelete = async () => {
    const Database = (window as any).Database;
    if (!db || !Database) return;

    try {
      await db.close();

      // Delete using WASM API which cleans up all storage
      await Database.deleteDatabase(currentDbName);

      // Clear backup as well
      await clearBackup();

      // Clear state - don't auto-create a new database
      setDb(null);
      setCurrentDbName('');
      (window as any).testDb = null;

      setStatus('Database deleted - create or import a new database');
      setDeleteDialogOpen(false);
    } catch (err: any) {
      setStatus(`Delete error: ${err.message}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    if (!file.name.endsWith('.db') && !file.name.endsWith('.sqlite') && !file.name.endsWith('.sqlite3')) {
      setStatus('Error: Please drop a valid .db file');
      return;
    }

    const Database = (window as any).Database;
    if (!Database) {
      setStatus('Error: WASM not initialized');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Close existing database if open
      if (db) {
        await db.close();
      }

      // Use dropped file's name as database name
      const dbName = file.name;

      const newDb = await Database.newDatabase(dbName);
      await newDb.importFromFile(uint8Array);
      await newDb.close();

      const reopenedDb = await Database.newDatabase(dbName);
      setDb(reopenedDb);
      setCurrentDbName(dbName);
      (window as any).testDb = reopenedDb;

      // Save backup immediately after drop import
      await saveBackup(reopenedDb, dbName);

      setStatus('Import complete');
      setSelectedFile(null);
    } catch (err: any) {
      setStatus(`Import error: ${err.message}`);
    }
  };

  return (
    <div id="dbManagement" className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Database Management</h1>

      <div id="status" className="mb-4 p-3 bg-blue-50 rounded">
        {status}
      </div>

      {/* Drag and Drop Zone */}
      <div
        id="dropZone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mb-6 p-8 border-2 border-dashed rounded-lg text-center transition-colors ${
          isDragOver ? 'border-blue-500 bg-blue-50 drag-over' : 'border-gray-300 bg-gray-50'
        }`}
      >
        <p className="text-gray-600">
          {isDragOver ? 'Drop your .db file here' : 'Drag and drop a .db file here to import'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Database Operations</CardTitle>
            <CardDescription>Manage your database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div id="dbSelector" className="text-sm text-muted-foreground mb-4">
              Current database: {currentDbName || 'None (create or import a database)'}
            </div>
            
            <input 
              ref={fileInputRef}
              id="importFile"
              type="file" 
              accept=".db,.sqlite,.sqlite3"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
            />

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button id="createDbButton" className="w-full">Create New Database</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Database</DialogTitle>
                  <DialogDescription>Enter a name for your new database</DialogDescription>
                </DialogHeader>
                <Input
                  id="dbNameInput"
                  placeholder="my_database"
                  value={newDbName}
                  onChange={(e) => setNewDbName(e.target.value)}
                />
                <DialogFooter>
                  <Button id="confirmCreate" onClick={handleCreateDatabase}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button id="exportDbButton" onClick={handleExport} disabled={!db} className="w-full" variant="outline">
              Export Database
            </Button>

            <Button 
              id="importDbButton" 
              onClick={() => fileInputRef.current?.click()} 
              className="w-full" 
              variant="outline"
            >
              Select File to Import
            </Button>
            
            <Button 
              onClick={handleImport} 
              disabled={!selectedFile} 
              className="w-full" 
              variant="outline"
            >
              Import Selected File
            </Button>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button id="deleteDbButton" disabled={!db} className="w-full" variant="destructive">
                  Delete Database
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Delete</DialogTitle>
                  <DialogDescription>Are you sure you want to delete this database?</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button id="confirmDelete" onClick={handleDelete} variant="destructive">Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Info</CardTitle>
            <CardDescription>Current database statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Tables: </span>
                <span id="tableCount">{tableCount}</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showSystemTables"
                  checked={showSystemTables}
                  onChange={(e) => setShowSystemTables(e.target.checked)}
                  className="cursor-pointer"
                />
                <label htmlFor="showSystemTables" className="text-sm cursor-pointer">
                  Show system tables (sqlite_*)
                </label>
              </div>
              <Button id="refreshInfo" onClick={handleRefreshInfo} disabled={!db} size="sm">
                Refresh Info
              </Button>
              {dbInfo && (
                <pre className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm whitespace-pre-wrap font-mono">
                  {dbInfo}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

