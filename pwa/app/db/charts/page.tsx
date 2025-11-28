'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDatabaseStore } from '@/lib/db/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { QueryResult } from '@/lib/db/client';
import { Textarea } from '@/components/ui/textarea';
import html2canvas from 'html2canvas';

// Define ColumnValue type based on WASM package
type ColumnValue = 
  | { type: "Null" } 
  | { type: "Integer"; value: number } 
  | { type: "Real"; value: number } 
  | { type: "Text"; value: string } 
  | { type: "Blob"; value: number[] } 
  | { type: "Date"; value: number } 
  | { type: "BigInt"; value: string };

// Helper to safely extract value from ColumnValue
const getValue = (col: ColumnValue): any => {
  if (col.type === 'Null') return null;
  return (col as any).value;
};

type ChartType = 'line' | 'bar' | 'pie' | 'scatter';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function ChartBuilderContent() {
  const { db, _hasHydrated, setDb } = useDatabaseStore();
  const currentDbName = useDatabaseStore((state) => state.currentDbName);

  const [sql, setSql] = useState('SELECT * FROM your_table');
  const [queryResults, setQueryResults] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const [chartType, setChartType] = useState<ChartType>('line');
  const [chartTitle, setChartTitle] = useState('');
  const [xAxisColumn, setXAxisColumn] = useState<string>('');
  const [yAxisColumn, setYAxisColumn] = useState<string>('');

  const [chartData, setChartData] = useState<any[]>([]);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Track window.testDb for E2E tests
  const [windowTestDb, setWindowTestDb] = useState<any>(null);

  // For E2E tests: check both Zustand store and window.testDb
  const activeDb = db || windowTestDb;

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
          // Add .db property pointing to itself for test compatibility (only if not already set)
          if (!(db as any).db) (db as any).db = db;
          (window as any).testDb = db;
        } else if (currentDbName) {
          // Restore database from storage if currentDbName exists
          console.log('[ChartPage] Restoring database from currentDbName:', currentDbName);
          const dbInstance = await Database.newDatabase(currentDbName);
          // Add .db property pointing to itself for test compatibility (only if not already set)
          if (!(dbInstance as any).db) (dbInstance as any).db = dbInstance;
          setDb(dbInstance);
          (window as any).testDb = dbInstance;
          console.log('[ChartPage] Database restored successfully');
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
        console.log('[CHARTS] Detected window.testDb, updating state');
        setWindowTestDb(testDb);
      }
    };

    // Check immediately
    checkTestDb();

    // Also check periodically in case testDb is set after component mounts
    const interval = setInterval(checkTestDb, 50);

    return () => clearInterval(interval);
  }, [windowTestDb]);

  const executeQuery = async () => {
    if (!activeDb) {
      setQueryError('Database not initialized');
      return;
    }

    if (!sql.trim()) {
      setQueryError('Please enter a SQL query');
      return;
    }

    setIsExecuting(true);
    setQueryError(null);

    try {
      const result = await activeDb.execute(sql);
      setQueryResults(result);
      setQueryError(null);

      // Extract column names
      if (result.columns && result.columns.length > 0) {
        const cols = result.columns;
        setAvailableColumns(cols);
        
        // Auto-select first two columns if not already selected
        if (!xAxisColumn && cols.length > 0) {
          setXAxisColumn(cols[0]);
        }
        if (!yAxisColumn && cols.length > 1) {
          setYAxisColumn(cols[1]);
        } else if (!yAxisColumn && cols.length > 0) {
          setYAxisColumn(cols[0]);
        }

        // Transform data for charting
        const data = result.rows.map((row: any, index: number) => {
          const rowData: any = { _index: index };
          result.columns.forEach((col: string, colIndex: number) => {
            const value = getValue(row.values[colIndex]);
            rowData[col] = value;
          });
          return rowData;
        });
        setChartData(data);
      } else {
        setChartData([]);
        setAvailableColumns([]);
      }
    } catch (err) {
      console.error('Query execution error:', err);
      setQueryError(`Query failed: ${String(err)}`);
      setQueryResults(null);
      setChartData([]);
    } finally {
      setIsExecuting(false);
    }
  };

  const exportToPNG = async () => {
    if (!chartContainerRef.current) {
      console.error('[PNG Export] Chart container ref not found');
      return;
    }
    
    try {
      // Find the SVG element directly
      const svgElement = chartContainerRef.current.querySelector('svg');
      if (!svgElement) return;
      
      // Get SVG dimensions
      const svgRect = svgElement.getBoundingClientRect();
      const canvas = document.createElement('canvas');
      canvas.width = svgRect.width * 2; // 2x for better quality
      canvas.height = svgRect.height * 2;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Fill white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Convert SVG to data URL
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      // Load SVG as image and draw to canvas
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        
        // Download PNG
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        const filename = chartTitle 
          ? `${chartTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_chart.png`
          : 'chart.png';
        link.download = filename;
        link.href = dataUrl;
        link.click();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (err) {
      console.error('PNG export error:', err);
    }
  };

  const exportToSVG = () => {
    if (!chartContainerRef.current) return;
    
    try {
      const svgElement = chartContainerRef.current.querySelector('svg');
      if (!svgElement) return;
      
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const link = document.createElement('a');
      const filename = chartTitle 
        ? `${chartTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_chart.svg`
        : 'chart.svg';
      link.download = filename;
      link.href = svgUrl;
      link.click();
      
      URL.revokeObjectURL(svgUrl);
    } catch (err) {
      console.error('SVG export error:', err);
    }
  };

  const exportToCSV = () => {
    if (!chartData || chartData.length === 0) return;
    
    try {
      // Get all keys from first row (excluding _index)
      const keys = Object.keys(chartData[0]).filter(k => k !== '_index');
      
      // Create CSV header
      const csvLines: string[] = [keys.join(',')];
      
      // Add data rows
      chartData.forEach(row => {
        const values = keys.map(key => {
          const value = row[key];
          // Escape values containing commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvLines.push(values.join(','));
      });
      
      const csvContent = csvLines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      const filename = chartTitle 
        ? `${chartTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_data.csv`
        : 'chart_data.csv';
      link.download = filename;
      link.href = url;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export error:', err);
    }
  };

  const renderChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>No data to display. Execute a query to see results.</p>
        </div>
      );
    }

    const chartProps = {
      data: chartData,
      width: 600,
      height: 400,
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisColumn || availableColumns[0]} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={yAxisColumn || availableColumns[1]} stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisColumn || availableColumns[0]} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={yAxisColumn || availableColumns[1]} fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey={yAxisColumn || availableColumns[1]}
                nameKey={xAxisColumn || availableColumns[0]}
                cx="50%"
                cy="50%"
                outerRadius={120}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisColumn || availableColumns[0]} />
              <YAxis dataKey={yAxisColumn || availableColumns[1]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="Data Points" data={chartData} fill="#2563eb" />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  if (!currentDbName || !activeDb) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p>No database selected. Please create or load a database first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chart Builder</CardTitle>
          <CardDescription>
            Create interactive charts from your SQL queries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sqlQuery">SQL Query</Label>
            <Textarea
              id="sqlQuery"
              placeholder="SELECT column1, column2 FROM your_table"
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              rows={4}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={executeQuery}
              disabled={!sql.trim() || isExecuting}
            >
              {isExecuting ? 'Executing...' : 'Execute'}
            </Button>
            {queryResults && (
              <Button
                variant="outline"
                onClick={() => {
                  setQueryResults(null);
                  setChartData([]);
                  setQueryError(null);
                }}
              >
                Clear
              </Button>
            )}
          </div>

          {queryError && (
            <div className="text-red-600 text-sm">
              {queryError}
            </div>
          )}

          {queryResults && queryResults.rows.length === 0 && (
            <div className="text-muted-foreground text-sm">
              No results returned from query
            </div>
          )}
        </CardContent>
      </Card>

      {queryResults && chartData.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Chart Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chartType">Chart Type</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={chartType === 'line' ? 'default' : 'outline'}
                      onClick={() => setChartType('line')}
                      data-testid="chart-type-line"
                    >
                      Line
                    </Button>
                    <Button
                      variant={chartType === 'bar' ? 'default' : 'outline'}
                      onClick={() => setChartType('bar')}
                      data-testid="chart-type-bar"
                    >
                      Bar
                    </Button>
                    <Button
                      variant={chartType === 'pie' ? 'default' : 'outline'}
                      onClick={() => setChartType('pie')}
                      data-testid="chart-type-pie"
                    >
                      Pie
                    </Button>
                    <Button
                      variant={chartType === 'scatter' ? 'default' : 'outline'}
                      onClick={() => setChartType('scatter')}
                      data-testid="chart-type-scatter"
                    >
                      Scatter
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chartTitle">Chart Title</Label>
                  <Input
                    id="chartTitle"
                    placeholder="Enter chart title"
                    value={chartTitle}
                    onChange={(e) => setChartTitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="xAxis">X-Axis Column</Label>
                  <Select value={xAxisColumn} onValueChange={setXAxisColumn}>
                    <SelectTrigger id="xAxis" data-testid="x-axis-selector">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yAxis">Y-Axis Column</Label>
                  <Select value={yAxisColumn} onValueChange={setYAxisColumn}>
                    <SelectTrigger id="yAxis" data-testid="y-axis-selector">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{chartTitle || 'Chart Preview'}</CardTitle>
              <CardDescription>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToPNG}
                    data-testid="export-png"
                  >
                    Export PNG
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToSVG}
                    data-testid="export-svg"
                  >
                    Export SVG
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToCSV}
                    data-testid="export-csv"
                  >
                    Download CSV
                  </Button>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                data-testid="chart-preview" 
                ref={chartContainerRef}
                style={{ backgroundColor: '#ffffff', padding: '1rem' }}
              >
                {renderChart()}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function ChartBuilderPage() {
  const currentDbName = useDatabaseStore((state) => state.currentDbName);
  
  return <ChartBuilderContent />;
}
