'use client';

import { useState, useEffect } from 'react';
import { DatabaseProvider, useDatabase } from '@/lib/db/provider';
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

function DatabaseManagementContent() {
  const { db, loading, error } = useDatabase();
  const [status, setStatus] = useState('Ready');
  const [newDbName, setNewDbName] = useState('');
  const [tableCount, setTableCount] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).testDb = db;
    }
  }, [db]);

  const handleCreateDatabase = async () => {
    if (!newDbName.trim()) return;

    try {
      const { DatabaseClient } = await import('@/lib/db/client');
      const newDb = new DatabaseClient();
      await newDb.open(newDbName);
      setStatus(`Database created: ${newDbName}`);
      setCreateDialogOpen(false);
      setNewDbName('');
    } catch (err) {
      setStatus(`Error: ${err}`);
    }
  };

  const handleExport = async () => {
    if (!db) return;

    try {
      const blob = await db.export();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'database.db';
      a.click();
      URL.revokeObjectURL(url);
      setStatus('Database exported');
    } catch (err) {
      setStatus(`Export error: ${err}`);
    }
  };

  const handleImport = async () => {
    if (!db) return;

    const file = (window as any).importFile;
    if (!file) {
      setStatus('No file selected');
      return;
    }

    try {
      await db.import(file);
      // Update window reference after import reopens connection
      (window as any).testDb = db;
      setStatus('Import complete');
    } catch (err) {
      setStatus(`Import error: ${err}`);
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
    if (!db) return;

    try {
      await db.close();
      setStatus('Database deleted');
      setDeleteDialogOpen(false);
    } catch (err) {
      setStatus(`Delete error: ${err}`);
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

    if (!db) {
      setStatus('Error: Database not initialized');
      return;
    }

    try {
      await db.import(file);
      (window as any).testDb = db;
      setStatus('Import complete');
    } catch (err: any) {
      setStatus(`Import error: ${err.message}`);
    }
  };

  return (
    <div id="dbManagement" className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Database Management</h1>

      <div id="status" className="mb-4 p-3 bg-blue-50 rounded">
        {loading ? 'Loading...' : error ? `Error: ${error.message}` : status || 'Ready'}
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
            <div id="dbSelector" className="text-sm text-gray-600 mb-4">
              Current database: database.db
            </div>

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

            <Button id="importDbButton" onClick={handleImport} disabled={!db} className="w-full" variant="outline">
              Import Database
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

export default function DatabaseManagementPage() {
  return (
    <DatabaseProvider dbName="database.db">
      <DatabaseManagementContent />
    </DatabaseProvider>
  );
}
