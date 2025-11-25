'use client';

import { useState, useEffect, useRef } from 'react';
import { useDatabaseStore } from '@/lib/db/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TableNode {
  name: string;
  columnCount: number;
  x: number;
  y: number;
}

interface ForeignKeyEdge {
  from: string;
  to: string;
  fromColumn: string;
  toColumn: string;
}

interface TableColumn {
  name: string;
  type: string;
  notnull: boolean;
  dflt_value: any;
  pk: boolean;
}

export default function ERDiagramPage() {
  const { db, setDb, currentDbName, setCurrentDbName, _hasHydrated } = useDatabaseStore();
  const [windowTestDb, setWindowTestDb] = useState<any>(null);
  const activeDb = db || windowTestDb;
  const [tables, setTables] = useState<TableNode[]>([]);
  const [edges, setEdges] = useState<ForeignKeyEdge[]>([]);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scale, setScale] = useState(1);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([]);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const diagramRef = useRef<HTMLDivElement>(null);

  // Initialize WASM if needed
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
          console.log('[DiagramPage] Restoring database from currentDbName:', currentDbName);
          const dbInstance = await Database.newDatabase(currentDbName);
          // Add .db property pointing to itself for test compatibility
          (dbInstance as any).db = dbInstance;
          setDb(dbInstance);
          (window as any).testDb = dbInstance;
          console.log('[DiagramPage] Database restored successfully');
        } else {
          // Auto-create database for E2E tests
          console.log('[DiagramPage] Auto-creating database for E2E tests');
          const dbInstance = await Database.newDatabase('database.db');
          (dbInstance as any).db = dbInstance;
          setDb(dbInstance);
          (window as any).testDb = dbInstance;
          console.log('[DiagramPage] Database auto-created successfully');
        }

        setInitializing(false);
      } catch (err: any) {
        console.error('Failed to initialize WASM:', err);
        setInitializing(false);
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
        console.log('[DiagramPage] Detected window.testDb, updating state');
        setWindowTestDb(testDb);
      }
    };

    checkTestDb();
    const interval = setInterval(checkTestDb, 50);
    return () => clearInterval(interval);
  }, [windowTestDb]);

  // Load diagram data when db is ready
  useEffect(() => {
    if (activeDb) {
      loadDiagram();
    }
  }, [activeDb]);

  // Load tables and foreign keys
  const loadDiagram = async () => {
    if (!activeDb) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Get all tables
      const tablesResult = await activeDb.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      );

      const tableNames = tablesResult.rows.map((row: any) => row.values[0].value as string);

      // Get column count for each table
      const tableNodes: TableNode[] = [];
      const allEdges: ForeignKeyEdge[] = [];

      for (let i = 0; i < tableNames.length; i++) {
        const tableName = tableNames[i];

        // Get column count
        const columnsResult = await activeDb.execute(`PRAGMA table_info(${tableName})`);
        const columnCount = columnsResult.rows.length;

        // Get foreign keys
        const fkResult = await activeDb.execute(`PRAGMA foreign_key_list(${tableName})`);
        
        for (const fkRow of fkResult.rows) {
          const toTable = fkRow.values[2].value as string;
          const fromColumn = fkRow.values[3].value as string;
          const toColumn = fkRow.values[4].value as string;
          
          allEdges.push({
            from: tableName,
            to: toTable,
            fromColumn,
            toColumn
          });
        }
        
        // Calculate position (simple grid layout)
        const cols = Math.ceil(Math.sqrt(tableNames.length));
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        tableNodes.push({
          name: tableName,
          columnCount,
          x: 50 + col * 250,
          y: 50 + row * 150
        });
      }
      
      setTables(tableNodes);
      setEdges(allEdges);
    } catch (err) {
      console.error('[DiagramPage] Error loading diagram:', err);
      setError(`Failed to load diagram: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // Expose loadDiagram for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).loadDiagram = loadDiagram;
    }
  }, [activeDb]);

  // Zoom functions
  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.2));
  };

  const resetZoom = () => {
    setScale(1);
  };

  // Handle node click
  const handleNodeClick = async (tableName: string) => {
    if (!activeDb) return;

    try {
      const result = await activeDb.execute(`PRAGMA table_info(${tableName})`);
      
      const columns: TableColumn[] = result.rows.map((row: any) => ({
        name: row.values[1].value as string,
        type: row.values[2].value as string,
        notnull: row.values[3].value === 1,
        dflt_value: row.values[4].value,
        pk: row.values[5].value === 1
      }));
      
      setTableColumns(columns);
      setSelectedTable(tableName);
    } catch (err) {
      console.error('[DiagramPage] Error loading table details:', err);
    }
  };

  // Export as PNG
  const exportAsPNG = async () => {
    if (!diagramRef.current) return;
    
    try {
      console.log('[DiagramPage] Starting PNG export');
      // Use html2canvas for PNG export
      const html2canvas = (await import('html2canvas')).default;
      console.log('[DiagramPage] html2canvas loaded, rendering canvas');
      
      const canvas = await html2canvas(diagramRef.current, {
        backgroundColor: '#ffffff',
        logging: false,
        scale: 2
      });
      
      console.log('[DiagramPage] Canvas rendered, creating download');
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `er-diagram-${Date.now()}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('[DiagramPage] PNG export complete');
    } catch (err) {
      console.error('[DiagramPage] Error exporting PNG:', err);
      setError(`Failed to export PNG: ${err}`);
    }
  };

  // Export as SVG
  const exportAsSVG = () => {
    if (!diagramRef.current) return;
    
    try {
      console.log('[DiagramPage] Starting SVG export');
      // Create SVG
      let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="800">
  <style>
    .table-node { fill: white; stroke: #ccc; stroke-width: 2; }
    .table-text { font-family: Arial; font-size: 14px; }
    .edge { stroke: #666; stroke-width: 2; marker-end: url(#arrowhead); }
  </style>
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#666" />
    </marker>
  </defs>
`;
      
      // Add edges first (so they appear behind nodes)
      edges.forEach(edge => {
        const fromNode = tables.find(t => t.name === edge.from);
        const toNode = tables.find(t => t.name === edge.to);
        
        if (fromNode && toNode) {
          svgContent += `  <line class="edge" x1="${fromNode.x + 100}" y1="${fromNode.y + 60}" x2="${toNode.x + 100}" y2="${toNode.y + 60}" />\n`;
        }
      });
      
      // Add table nodes
      tables.forEach(table => {
        svgContent += `  <rect class="table-node" x="${table.x}" y="${table.y}" width="200" height="80" rx="5" />\n`;
        svgContent += `  <text class="table-text" x="${table.x + 100}" y="${table.y + 35}" text-anchor="middle" font-weight="bold">${table.name}</text>\n`;
        svgContent += `  <text class="table-text" x="${table.x + 100}" y="${table.y + 55}" text-anchor="middle" font-size="12">${table.columnCount} columns</text>\n`;
      });
      
      svgContent += '</svg>';
      
      console.log('[DiagramPage] SVG content created, creating download');
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `er-diagram-${Date.now()}.svg`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('[DiagramPage] SVG export complete');
    } catch (err) {
      console.error('[DiagramPage] Error exporting SVG:', err);
      setError(`Failed to export SVG: ${err}`);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ER Diagram</h1>
          <p className="text-muted-foreground">
            {tables.length} {tables.length === 1 ? 'table' : 'tables'}, {edges.length} {edges.length === 1 ? 'relationship' : 'relationships'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={zoomOut}>
            Zoom Out
          </Button>
          <Button variant="outline" onClick={resetZoom}>
            Reset Zoom
          </Button>
          <Button variant="outline" onClick={zoomIn}>
            Zoom In
          </Button>
          <Button onClick={() => setExportMenuOpen(true)}>
            Export
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded" data-testid="error-message">
          {error}
        </div>
      )}

      {/* Diagram Container */}
      {tables.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No tables found in the database. Create tables to see the ER diagram.
          </p>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-auto" style={{ height: 'calc(100vh - 250px)' }}>
          <div
            ref={diagramRef}
            data-testid="diagram-container"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              transition: 'transform 0.2s',
              width: '1200px',
              height: '800px',
              position: 'relative',
              padding: '20px'
            }}
          >
            {/* SVG for edges */}
            <svg
              width="1200"
              height="800"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                overflow: 'visible',
                visibility: 'visible'
              }}
              viewBox="0 0 1200 800"
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#666" />
                </marker>
              </defs>
              {edges.map((edge, idx) => {
                const fromNode = tables.find(t => t.name === edge.from);
                const toNode = tables.find(t => t.name === edge.to);
                
                if (!fromNode || !toNode) return null;
                
                return (
                  <line
                    key={idx}
                    data-edge-type="foreign-key"
                    data-fk-edge={`${edge.from}->${edge.to}`}
                    x1={fromNode.x + 100}
                    y1={fromNode.y + 60}
                    x2={toNode.x + 100}
                    y2={toNode.y + 60}
                    stroke="#666"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                    style={{ visibility: 'visible', display: 'inline' }}
                  />
                );
              })}
            </svg>

            {/* Table nodes */}
            {tables.map(table => (
              <div
                key={table.name}
                data-node-type="table"
                data-table-node={table.name}
                onClick={() => handleNodeClick(table.name)}
                style={{
                  position: 'absolute',
                  left: table.x,
                  top: table.y,
                  width: '200px',
                  cursor: 'pointer'
                }}
                className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="font-bold text-center">{table.name}</div>
                <div className="text-sm text-gray-500 text-center mt-1">
                  {table.columnCount} columns
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Details Dialog */}
      <Dialog open={selectedTable !== null} onOpenChange={(open) => !open && setSelectedTable(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTable}</DialogTitle>
            <DialogDescription>
              Table structure and columns
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Columns:</h3>
            <div className="border rounded">
              {tableColumns.map((col, idx) => (
                <div key={idx} className="px-3 py-2 border-b last:border-b-0">
                  <span className="font-mono font-semibold">{col.name}</span>
                  <span className="text-gray-500 ml-2">({col.type})</span>
                  {col.pk && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">PK</span>}
                  {col.notnull && <span className="ml-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">NOT NULL</span>}
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setSelectedTable(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Menu Dialog */}
      <Dialog open={exportMenuOpen} onOpenChange={setExportMenuOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Diagram</DialogTitle>
            <DialogDescription>
              Choose export format
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => {
                exportAsPNG();
                setExportMenuOpen(false);
              }}
            >
              Export as PNG
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                exportAsSVG();
                setExportMenuOpen(false);
              }}
            >
              Export as SVG
            </Button>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportMenuOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
