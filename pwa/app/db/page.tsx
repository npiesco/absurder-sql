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

export default function DatabaseManagementPage() {
  const { db, currentDbName, loading, status, tableCount, setDb, setCurrentDbName, setLoading, setStatus, setTableCount } = useDatabaseStore();
  const [newDbName, setNewDbName] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize WASM and expose Database to window (like working vite app)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    async function initializeWasm() {
      try {
        const init = (await import('@npiesco/absurder-sql')).default;
        const { Database } = await import('@npiesco/absurder-sql');
        
        // Init WASM first
        await init();
        
        // Expose Database class on window IMMEDIATELY after init (like vite app line 66)
        (window as any).Database = Database;
        
        // Open default database
        const dbInstance = await Database.newDatabase('database.db');
        setDb(dbInstance);
        (window as any).testDb = dbInstance;
        
        setStatus('Ready');
        setLoading(false);
      } catch (err: any) {
        console.error('Failed to initialize:', err);
        setStatus(`Error: ${err.message}`);
        setLoading(false);
      }
    }

    initializeWasm();
  }, []);

  const handleCreateDatabase = async () => {
    const Database = (window as any).Database;
    if (!newDbName.trim() || !Database) return;

    try {
      // Close existing database
      if (db) {
        await db.close();
      }
      
      // Create new database
      const newDb = await Database.newDatabase(newDbName);
      setDb(newDb);
      setCurrentDbName(newDbName);
      (window as any).testDb = newDb;
      
      setStatus(`Database created: ${newDbName}`);
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
      a.download = 'database.db';
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
    if (!db || !Database) return;

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setStatus('No file selected');
      return;
    }

    try {
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Close existing database
      await db.close();
      
      // Create new database instance
      const newDb = await Database.newDatabase('database.db');
      
      // Import the data
      await newDb.importFromFile(uint8Array);
      
      // Close and reopen
      await newDb.close();
      const reopenedDb = await Database.newDatabase('database.db');
      
      setDb(reopenedDb);
      (window as any).testDb = reopenedDb;
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
      const result = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      setTableCount(result.rows.length);
      setStatus('Info refreshed');
    } catch (err) {
      setStatus(`Error: ${err}`);
    }
  };

  const handleDelete = async () => {
    const Database = (window as any).Database;
    if (!db || !Database) return;

    try {
      await db.close();
      
      // Actually delete from IndexedDB using current database name
      await new Promise<void>((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase(currentDbName);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });
      
      // Create fresh database with default name
      const defaultName = 'database.db';
      const newDb = await Database.newDatabase(defaultName);
      setDb(newDb);
      setCurrentDbName(defaultName);
      (window as any).testDb = newDb;
      
      setStatus('Database deleted');
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
    if (!db || !Database) {
      setStatus('Error: Database not initialized');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      await db.close();
      const newDb = await Database.newDatabase('database.db');
      await newDb.importFromFile(uint8Array);
      await newDb.close();
      
      const reopenedDb = await Database.newDatabase('database.db');
      setDb(reopenedDb);
      (window as any).testDb = reopenedDb;
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
              Current database: database.db
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
              disabled={!db} 
              className="w-full" 
              variant="outline"
            >
              Select File to Import
            </Button>
            
            <Button 
              onClick={handleImport} 
              disabled={!db || !selectedFile} 
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
              <Button id="refreshInfo" onClick={handleRefreshInfo} disabled={!db} size="sm">
                Refresh Info
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

