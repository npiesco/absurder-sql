'use client';

import { useState, useEffect } from 'react';
import { useDatabaseStore } from '@/lib/db/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Plus, X, AlertCircle } from 'lucide-react';

interface ChartConfig {
  id: string;
  title: string;
  query: string;
  chartType: 'line' | 'bar' | 'pie' | 'scatter';
  xAxis?: string;
  yAxis?: string;
}

interface DashboardLayout {
  [dbName: string]: ChartConfig[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

function DashboardContent() {
  const { db, _hasHydrated, setDb } = useDatabaseStore();
  const currentDbName = useDatabaseStore((state) => state.currentDbName);

  // Track window.testDb for E2E tests
  const [windowTestDb, setWindowTestDb] = useState<any>(null);

  // For E2E tests: check both Zustand store and window.testDb
  const activeDb = db || windowTestDb;
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newChartTitle, setNewChartTitle] = useState('');
  const [newChartQuery, setNewChartQuery] = useState('');
  const [newChartType, setNewChartType] = useState<'line' | 'bar' | 'pie' | 'scatter'>('bar');

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
          console.log('[DashboardPage] Restoring database from currentDbName:', currentDbName);
          const dbInstance = await Database.newDatabase(currentDbName);
          // Add .db property pointing to itself for test compatibility (only if not already set)
          if (!(dbInstance as any).db) (dbInstance as any).db = dbInstance;
          setDb(dbInstance);
          (window as any).testDb = dbInstance;
          console.log('[DashboardPage] Database restored successfully');
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
        console.log('[DashboardPage] Detected window.testDb, updating state');
        setWindowTestDb(testDb);
      }
    };

    checkTestDb();
    const interval = setInterval(checkTestDb, 50);
    return () => clearInterval(interval);
  }, [windowTestDb]);

  // Load dashboard layout from localStorage
  useEffect(() => {
    if (!currentDbName) return;

    const storedLayouts = localStorage.getItem('absurder-sql-dashboard-layouts');
    if (storedLayouts) {
      try {
        const layouts: DashboardLayout = JSON.parse(storedLayouts);
        if (layouts[currentDbName]) {
          setCharts(layouts[currentDbName]);
        }
      } catch (err) {
        console.error('[Dashboard] Failed to load layouts:', err);
      }
    }
  }, [currentDbName]);

  // Save dashboard layout to localStorage whenever charts change
  useEffect(() => {
    if (!currentDbName || charts.length === 0) return;

    const storedLayouts = localStorage.getItem('absurder-sql-dashboard-layouts');
    let layouts: DashboardLayout = {};
    
    if (storedLayouts) {
      try {
        layouts = JSON.parse(storedLayouts);
      } catch (err) {
        console.error('[Dashboard] Failed to parse stored layouts:', err);
      }
    }

    layouts[currentDbName] = charts;
    localStorage.setItem('absurder-sql-dashboard-layouts', JSON.stringify(layouts));
  }, [charts, currentDbName]);

  const handleAddChart = async () => {
    if (!newChartTitle || !newChartQuery) {
      return;
    }

    const newChart: ChartConfig = {
      id: `chart-${Date.now()}`,
      title: newChartTitle,
      query: newChartQuery,
      chartType: newChartType,
    };

    setCharts(prev => [...prev, newChart]);
    
    // Reset form
    setNewChartTitle('');
    setNewChartQuery('');
    setNewChartType('bar');
    setIsAddDialogOpen(false);
  };

  const handleRemoveChart = (chartId: string) => {
    setCharts(prev => prev.filter(chart => chart.id !== chartId));
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Builder</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage multiple charts for your data
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button id="addChartButton">
                <Plus className="w-4 h-4 mr-2" />
                Add Chart
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Chart</DialogTitle>
                <DialogDescription>
                  Configure your chart with a SQL query and visualization type
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="chartTitle">Chart Title</Label>
                  <Input
                    id="chartTitle"
                    placeholder="Enter chart title"
                    value={newChartTitle}
                    onChange={(e) => setNewChartTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chartQuery">SQL Query</Label>
                  <Textarea
                    id="chartQuery"
                    placeholder="SELECT column1, column2 FROM table"
                    rows={6}
                    value={newChartQuery}
                    onChange={(e) => setNewChartQuery(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chartType">Chart Type</Label>
                  <Select value={newChartType} onValueChange={(value: any) => setNewChartType(value)}>
                    <SelectTrigger id="chartType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                      <SelectItem value="scatter">Scatter Plot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddChart}>
                  Add
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Dashboard Grid */}
        {charts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No charts yet</p>
              <p className="text-muted-foreground mb-4">
                Add a chart to get started with your dashboard
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Chart
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="dashboard-grid grid grid-cols-1 md:grid-cols-2 gap-6">
            {charts.map((chart) => (
              <ChartCard
                key={chart.id}
                chart={chart}
                db={db}
                onRemove={() => handleRemoveChart(chart.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ChartCardProps {
  chart: ChartConfig;
  db: any;
  onRemove: () => void;
}

function ChartCard({ chart, db, onRemove }: ChartCardProps) {
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function executeQuery() {
      if (!db) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result = await db.execute(chart.query);
        
        // Transform result to chart data
        const chartData = result.rows.map((row: any) => {
          const obj: any = {};
          result.columns.forEach((col: string, idx: number) => {
            const value = row.values[idx];
            obj[col] = value?.value ?? value;
          });
          return obj;
        });

        setData(chartData);
      } catch (err) {
        console.error('[ChartCard] Query failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to execute query');
      } finally {
        setLoading(false);
      }
    }

    executeQuery();
  }, [db, chart.query]);

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading chart...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-destructive">
          <AlertCircle className="w-8 h-8 mb-2" />
          <p className="font-medium">Error loading chart</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No data available</p>
        </div>
      );
    }

    const keys = Object.keys(data[0] || {});
    const xKey = keys[0];
    const yKey = keys[1] || keys[0];

    switch (chart.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={yKey} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={yKey} stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey={yKey}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {data.map((entry, index) => (
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
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis dataKey={yKey} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name={chart.title} data={data} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="dashboard-chart" data-testid="dashboard-chart">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{chart.title}</CardTitle>
          <CardDescription className="text-xs font-mono mt-1">
            {chart.query.length > 60 ? `${chart.query.substring(0, 60)}...` : chart.query}
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label="Remove chart"
        >
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const currentDbName = useDatabaseStore((state) => state.currentDbName);
  
  return <DashboardContent />;
}
