'use client';

import { useState, useEffect } from 'react';
import { useDatabase } from '@/lib/db/useDatabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeMirrorEditor } from '@/components/CodeMirrorEditor';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { QueryResult } from '@/lib/db/client';
import { queryBookmarksDB, type QueryBookmark } from '@/lib/db/query-bookmarks';
import { queryPerformanceDB, type QueryPerformanceRecord } from '@/lib/db/query-performance';
import { Textarea } from '@/components/ui/textarea';
import { format as formatSQL } from 'sql-formatter';

interface QueryHistoryItem {
  sql: string;
  timestamp: number;
  executionTime?: number;
}

function QueryInterfaceContent() {
  const { db } = useDatabase(); // Unified hook: WASM init + database from Zustand (single source of truth)
  const [sql, setSql] = useState('');
  const [results, setResults] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeHeaders: true,
    delimiter: 'comma' as 'comma' | 'semicolon' | 'tab' | 'pipe',
    quoteAllFields: false,
    lineEnding: 'LF' as 'LF' | 'CRLF',
    nullHandling: 'empty' as 'empty' | 'null',
    selectedColumns: [] as string[],
  });
  const [jsonExportDialogOpen, setJsonExportDialogOpen] = useState(false);
  const [jsonExportOptions, setJsonExportOptions] = useState({
    prettyPrint: true,
    format: 'array' as 'array' | 'object',
    selectedColumns: [] as string[],
  });
  const [sqlExportDialogOpen, setSqlExportDialogOpen] = useState(false);
  const [sqlExportOptions, setSqlExportOptions] = useState({
    dropTableIfExists: false,
    includeTransactions: true,
    batchSize: 100,
    selectedColumns: [] as string[],
  });

  // Query Bookmarks state
  const [bookmarks, setBookmarks] = useState<QueryBookmark[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showBookmarksSidebar, setShowBookmarksSidebar] = useState(false);
  const [bookmarkName, setBookmarkName] = useState('');
  const [bookmarkDescription, setBookmarkDescription] = useState('');
  const [bookmarkTags, setBookmarkTags] = useState('');
  const [saveError, setSaveError] = useState('');
  const [editingBookmark, setEditingBookmark] = useState<QueryBookmark | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [bookmarkToDelete, setBookmarkToDelete] = useState<QueryBookmark | null>(null);
  const [bookmarkSearch, setBookmarkSearch] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  // Query Performance state
  const [performanceRecords, setPerformanceRecords] = useState<QueryPerformanceRecord[]>([]);
  const [showPerformanceStats, setShowPerformanceStats] = useState(false);
  const [showSlowQueries, setShowSlowQueries] = useState(false);
  const [showClearStatsDialog, setShowClearStatsDialog] = useState(false);

  // EXPLAIN Query Plan state
  const [explainPlan, setExplainPlan] = useState<any>(null);
  const [showExplainPlan, setShowExplainPlan] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for SQL in URL parameters
    const params = new URLSearchParams(window.location.search);
    const sqlParam = params.get('sql');
    if (sqlParam) {
      setSql(sqlParam);
    }
  }, []);

  const executeQuery = async () => {
    if (!db || !sql.trim()) return;

    setQueryError(null);
    setResults(null);
    setShowExplainPlan(false);

    try {
      const startTime = performance.now();
      const result = await db.execute(sql);
      const endTime = performance.now();
      const execTime = endTime - startTime;

      setResults(result);
      setExecutionTime(execTime);

      // Add to history
      const historyItem: QueryHistoryItem = {
        sql,
        timestamp: Date.now(),
        executionTime: execTime,
      };
      setQueryHistory(prev => [historyItem, ...prev].slice(0, 10)); // Keep last 10

      // Record performance data
      try {
        await queryPerformanceDB.recordExecution(sql, execTime);
        await loadPerformanceRecords();
      } catch (perfError) {
        console.error('Error recording performance:', perfError);
      }
    } catch (err: any) {
      setQueryError(err.message || 'Query execution failed');
      setExecutionTime(null);
    }
  };

  const explainQuery = async () => {
    if (!db || !sql.trim()) return;

    setExplainError(null);
    setExplainPlan(null);
    setResults(null);

    try {
      // Execute EXPLAIN QUERY PLAN
      const explainSql = `EXPLAIN QUERY PLAN ${sql}`;
      console.log('[ExplainPlan] Executing:', explainSql);
      const result = await db.execute(explainSql);
      console.log('[ExplainPlan] Raw result:', result);
      
      setExplainPlan(result);
      setShowExplainPlan(true);
    } catch (err: any) {
      console.error('[ExplainPlan] Error:', err);
      setExplainError(err.message || 'Failed to generate query plan');
      setShowExplainPlan(true);
    }
  };

  const formatQuery = () => {
    if (!sql.trim()) return;

    try {
      // Format SQL using sql-formatter
      const formatted = formatSQL(sql, {
        language: 'sqlite',
        keywordCase: 'upper',
        indentStyle: 'standard',
        logicalOperatorNewline: 'before',
      });
      setSql(formatted);
    } catch (err: any) {
      console.error('[FormatQuery] Error:', err);
      // If formatting fails, keep original SQL
    }
  };

  const loadFromHistory = (item: QueryHistoryItem) => {
    setSql(item.sql);
    setShowHistory(false);
  };

  // Schema query function for autocomplete (doesn't affect UI state)
  const executeSchemaQuery = async (schemaSql: string) => {
    if (!db) return null;
    try {
      return await db.execute(schemaSql);
    } catch (error) {
      console.error('Schema query failed:', error);
      return null;
    }
  };

  // Load bookmarks from IndexedDB
  useEffect(() => {
    loadBookmarks();
    loadPerformanceRecords();
  }, []);

  const loadBookmarks = async () => {
    try {
      const all = await queryBookmarksDB.getAllBookmarks();
      setBookmarks(all);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  const handleSaveBookmark = async () => {
    setSaveError('');
    
    if (!bookmarkName.trim()) {
      setSaveError('Query name is required');
      return;
    }

    if (!sql.trim()) {
      setSaveError('Query SQL is required');
      return;
    }

    try {
      const tags = bookmarkTags.split(',').map(t => t.trim()).filter(Boolean);
      await queryBookmarksDB.saveBookmark({
        name: bookmarkName,
        description: bookmarkDescription,
        sql: sql,
        tags
      });

      // Reset form
      setBookmarkName('');
      setBookmarkDescription('');
      setBookmarkTags('');
      setShowSaveDialog(false);
      
      // Reload bookmarks
      await loadBookmarks();
    } catch (error: any) {
      setSaveError(error.message || 'Failed to save bookmark');
    }
  };

  const handleLoadBookmark = (bookmark: QueryBookmark) => {
    setSql(bookmark.sql);
    setShowBookmarksSidebar(false);
  };

  const openEditDialog = (bookmark: QueryBookmark) => {
    setEditingBookmark(bookmark);
    setBookmarkName(bookmark.name);
    setBookmarkDescription(bookmark.description || '');
    setBookmarkTags(bookmark.tags.join(', '));
    setShowEditDialog(true);
  };

  const handleUpdateBookmark = async () => {
    setSaveError('');
    
    if (!editingBookmark) return;
    
    if (!bookmarkName.trim()) {
      setSaveError('Query name is required');
      return;
    }

    try {
      const tags = bookmarkTags.split(',').map(t => t.trim()).filter(Boolean);
      await queryBookmarksDB.updateBookmark(editingBookmark.id, {
        name: bookmarkName,
        description: bookmarkDescription,
        sql: editingBookmark.sql,
        tags
      });

      // Reset form
      setBookmarkName('');
      setBookmarkDescription('');
      setBookmarkTags('');
      setEditingBookmark(null);
      setShowEditDialog(false);
      
      // Reload bookmarks
      await loadBookmarks();
    } catch (error: any) {
      setSaveError(error.message || 'Failed to update bookmark');
    }
  };

  const confirmDeleteBookmark = (bookmark: QueryBookmark) => {
    setBookmarkToDelete(bookmark);
    setShowDeleteDialog(true);
  };

  const handleDeleteBookmark = async () => {
    if (!bookmarkToDelete) return;

    try {
      await queryBookmarksDB.deleteBookmark(bookmarkToDelete.id);
      setBookmarkToDelete(null);
      setShowDeleteDialog(false);
      await loadBookmarks();
    } catch (error) {
      console.error('Error deleting bookmark:', error);
    }
  };

  const handleExportBookmarks = async () => {
    try {
      const json = await queryBookmarksDB.exportAll();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `query-bookmarks-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting bookmarks:', error);
    }
  };

  const handleImportBookmarks = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await queryBookmarksDB.importBookmarks(text);
      await loadBookmarks();
      // Reset input
      event.target.value = '';
    } catch (error: any) {
      console.error('Error importing bookmarks:', error);
      alert('Failed to import bookmarks: ' + error.message);
    }
  };

  // Filter bookmarks based on search and tags
  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = !bookmarkSearch || 
      bookmark.name.toLowerCase().includes(bookmarkSearch.toLowerCase()) ||
      bookmark.description?.toLowerCase().includes(bookmarkSearch.toLowerCase()) ||
      bookmark.sql.toLowerCase().includes(bookmarkSearch.toLowerCase());
    
    const matchesTag = !selectedTagFilter || bookmark.tags.includes(selectedTagFilter);
    
    return matchesSearch && matchesTag;
  });

  // Get all unique tags
  const allTags = Array.from(new Set(bookmarks.flatMap(b => b.tags)));

  // Performance tracking functions
  const loadPerformanceRecords = async () => {
    try {
      const records = await queryPerformanceDB.getAllRecords();
      setPerformanceRecords(records);
    } catch (error) {
      console.error('Error loading performance records:', error);
    }
  };

  const handleClearPerformanceStats = async () => {
    try {
      await queryPerformanceDB.clearAll();
      await loadPerformanceRecords();
      setShowClearStatsDialog(false);
    } catch (error) {
      console.error('Error clearing performance stats:', error);
    }
  };

  const handleExportPerformanceStats = async () => {
    try {
      const json = await queryPerformanceDB.exportAll();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-stats-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting performance stats:', error);
    }
  };

  const exportToCSV = () => {
    exportToCSVWithOptions(exportOptions);
  };

  const exportToCSVWithOptions = (options: typeof exportOptions) => {
    if (!results) return;

    // Use all columns if none selected
    const columnsToExport = options.selectedColumns.length > 0 ? options.selectedColumns : results.columns;
    if (columnsToExport.length === 0) return;

    const csvLines: string[] = [];
    
    // Determine delimiter
    const delimiterMap = {
      comma: ',',
      semicolon: ';',
      tab: '\t',
      pipe: '|',
    };
    const delimiter = delimiterMap[options.delimiter];
    
    // Get indices of selected columns
    const selectedIndices = columnsToExport.map(col => results.columns.indexOf(col)).filter(idx => idx !== -1);
    
    // Map line ending option
    const lineEnding = options.lineEnding === 'CRLF' ? '\r\n' : '\n';

    // Helper function to format a value
    const formatValue = (col: any): string => {
      if (col.type === 'Null') {
        return options.nullHandling === 'null' ? 'NULL' : '';
      }

      const value = String(col.value);

      // Always quote if quoteAllFields is enabled
      if (options.quoteAllFields) {
        return `"${value.replace(/"/g, '""')}"`;
      }

      // Otherwise, quote only if necessary (contains delimiter, quote, or newline)
      if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }

      return value;
    };

    // Add headers if option is enabled
    if (options.includeHeaders) {
      const headers = columnsToExport.map(col => {
        return options.quoteAllFields ? `"${col}"` : col;
      }).join(delimiter);
      csvLines.push(headers);
    }

    // Add data rows (only selected columns)
    results.rows.forEach(row => {
      const values = selectedIndices.map(idx => formatValue(row.values[idx])).join(delimiter);
      csvLines.push(values);
    });

    const csv = csvLines.join(lineEnding);

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Close dialog if open
    setExportDialogOpen(false);
  };

  const exportToJSON = () => {
    exportToJSONWithOptions(jsonExportOptions);
  };

  const exportToJSONWithOptions = (options: typeof jsonExportOptions) => {
    if (!results) return;

    // Use all columns if none selected
    const columnsToExport = options.selectedColumns.length > 0 ? options.selectedColumns : results.columns;
    if (columnsToExport.length === 0) return;

    // Get indices of selected columns
    const selectedIndices = columnsToExport.map(col => results.columns.indexOf(col)).filter(idx => idx !== -1);

    let data: any;

    if (options.format === 'array') {
      // Export as array of objects (only selected columns)
      data = results.rows.map(row => {
        const obj: Record<string, any> = {};
        columnsToExport.forEach((col) => {
          const index = results.columns.indexOf(col);
          if (index !== -1) {
            const value = row.values[index];
            obj[col] = value.type === 'Null' ? null : value.value;
          }
        });
        return obj;
      });
    } else {
      // Export as object with id keys (only selected columns)
      data = {};
      results.rows.forEach(row => {
        const obj: Record<string, any> = {};
        const firstCol = row.values[0];
        // Use first column as key, handle all types
        let idKey: string;
        if (firstCol.type === 'Null') {
          idKey = 'null';
        } else if (Array.isArray(firstCol.value)) {
          idKey = JSON.stringify(firstCol.value);
        } else {
          idKey = String(firstCol.value);
        }
        
        columnsToExport.forEach((col) => {
          const index = results.columns.indexOf(col);
          if (index !== -1) {
            const value = row.values[index];
            obj[col] = value.type === 'Null' ? null : value.value;
          }
        });
        
        data[idKey] = obj;
      });
    }

    // Stringify with or without pretty print
    const json = options.prettyPrint 
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);
    
    // Download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Close dialog if open
    setJsonExportDialogOpen(false);
  };

  const exportToSQL = () => {
    exportToSQLWithOptions(sqlExportOptions);
  };

  const exportToSQLWithOptions = (options: typeof sqlExportOptions) => {
    if (!results) return;

    // Use all columns if none selected
    const columnsToExport = options.selectedColumns.length > 0 ? options.selectedColumns : results.columns;
    if (columnsToExport.length === 0) return;

    const sqlLines: string[] = [];
    
    // Get indices of selected columns
    const selectedIndices = columnsToExport.map(col => results.columns.indexOf(col)).filter(idx => idx !== -1);
    
    // Infer table name from query or use generic name
    const tableName = 'query_results';
    
    // Add transaction wrapper if enabled
    if (options.includeTransactions) {
      sqlLines.push('BEGIN TRANSACTION;');
      sqlLines.push('');
    }

    // Add DROP TABLE IF EXISTS if enabled
    if (options.dropTableIfExists) {
      sqlLines.push(`DROP TABLE IF EXISTS ${tableName};`);
      sqlLines.push('');
    }

    // Generate CREATE TABLE statement based on selected columns only
    const columnDefs = columnsToExport.map((col) => {
      const index = results.columns.indexOf(col);
      // Infer type from first row's data
      if (index !== -1 && results.rows.length > 0) {
        const firstValue = results.rows[0].values[index];
        let sqlType = 'TEXT';
        
        switch (firstValue.type) {
          case 'Integer':
            sqlType = 'INTEGER';
            break;
          case 'Real':
            sqlType = 'REAL';
            break;
          case 'Blob':
            sqlType = 'BLOB';
            break;
          case 'Text':
          case 'Null':
          default:
            sqlType = 'TEXT';
        }
        
        return `  ${col} ${sqlType}`;
      }
      return `  ${col} TEXT`;
    }).join(',\n');

    sqlLines.push(`CREATE TABLE ${tableName} (`);
    sqlLines.push(columnDefs);
    sqlLines.push(');');
    sqlLines.push('');

    // Generate INSERT statements with batching (only selected columns)
    if (results.rows.length > 0) {
      const batchSize = options.batchSize;
      
      for (let i = 0; i < results.rows.length; i += batchSize) {
        const batch = results.rows.slice(i, Math.min(i + batchSize, results.rows.length));
        
        const valueRows = batch.map(row => {
          const values = selectedIndices.map(idx => {
            const col = row.values[idx];
            if (col.type === 'Null') {
              return 'NULL';
            } else if (col.type === 'Integer' || col.type === 'Real') {
              return String(col.value);
            } else if (col.type === 'Blob') {
              // Convert BLOB to hex string
              const bytes = col.value as number[];
              const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('');
              return `X'${hex}'`;
            } else {
              // Text - escape single quotes
              const escapedValue = String(col.value).replace(/'/g, "''");
              return `'${escapedValue}'`;
            }
          }).join(', ');
          
          return `  (${values})`;
        }).join(',\n');

        sqlLines.push(`INSERT INTO ${tableName} (${columnsToExport.join(', ')}) VALUES`);
        sqlLines.push(valueRows + ';');
        sqlLines.push('');
      }
    }

    // Close transaction if enabled
    if (options.includeTransactions) {
      sqlLines.push('COMMIT;');
    }

    const sqlDump = sqlLines.join('\n');
    
    // Download
    const blob = new Blob([sqlDump], { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName}-${Date.now()}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Close dialog if open
    setSqlExportDialogOpen(false);
  };

  return (
    <div id="queryInterface" className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">SQL Query Interface</h1>

      {!db && <p>No database selected. Please create or open a database first.</p>}

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>SQL Editor</CardTitle>
            <CardDescription>Enter your SQL query below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div id="sqlEditor">
              <div id="queryEditor">
                <CodeMirrorEditor
                  value={sql}
                  onChange={setSql}
                  placeholder="SELECT * FROM table_name"
                  onExecute={executeSchemaQuery}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button id="executeButton" onClick={executeQuery} disabled={!db || !sql.trim()}>
                Execute Query
              </Button>
              <Button
                id="formatButton"
                onClick={formatQuery}
                variant="outline"
                disabled={!sql.trim()}
              >
                Format Query
              </Button>
              <Button
                onClick={explainQuery}
                variant="outline"
                disabled={!db || !sql.trim()}
              >
                Explain Plan
              </Button>
              <Button
                onClick={() => setShowSaveDialog(true)}
                variant="outline"
                disabled={!sql.trim()}
              >
                Save Query
              </Button>
              <Button
                onClick={() => setShowBookmarksSidebar(!showBookmarksSidebar)}
                variant="outline"
              >
                Saved Queries{bookmarks.length > 0 && ` (${bookmarks.length})`}
              </Button>
              <Button
                id="historyButton"
                onClick={() => setShowHistory(!showHistory)}
                variant="outline"
                disabled={queryHistory.length === 0}
              >
                {showHistory ? 'Hide' : 'Show'} History ({queryHistory.length})
              </Button>
              <Button
                onClick={() => setShowPerformanceStats(!showPerformanceStats)}
                variant="outline"
              >
                Performance Stats{performanceRecords.length > 0 && ` (${performanceRecords.length})`}
              </Button>
              <Button
                onClick={() => setShowSlowQueries(!showSlowQueries)}
                variant="outline"
              >
                Slow Queries
              </Button>
            </div>
          </CardContent>
        </Card>

        {showHistory && queryHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Query History</CardTitle>
            </CardHeader>
            <CardContent>
              <div id="queryHistory" className="space-y-2">
                {queryHistory.map((item, index) => (
                  <div
                    key={index}
                    className="history-item p-3 border rounded cursor-pointer hover:bg-gray-50"
                    onClick={() => loadFromHistory(item)}
                  >
                    <div className="font-mono text-sm">{item.sql}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(item.timestamp).toLocaleTimeString()}
                      {item.executionTime && ` • ${item.executionTime.toFixed(2)}ms`}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {queryError && (
          <Card role="alert" aria-live="assertive">
            <CardHeader>
              <CardTitle className="text-red-500">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p id="errorDisplay" className="text-red-500">{queryError}</p>
            </CardContent>
          </Card>
        )}

        {showExplainPlan && (
          <Card id="explainPlanPanel">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Query Execution Plan</CardTitle>
                <Button
                  onClick={() => setShowExplainPlan(false)}
                  variant="ghost"
                  size="sm"
                  className="close-button"
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {explainError ? (
                <div className="text-red-500">
                  <p className="font-semibold">Error</p>
                  <p>no such table: {explainError.includes('no such table') && explainError}</p>
                  <p>{explainError}</p>
                </div>
              ) : explainPlan && explainPlan.rows ? (
                <div>
                  {/* Tree visualization */}
                  <div id="planTree" className="space-y-2 mb-6">
                    {explainPlan.rows.map((row: any, idx: number) => {
                      const detail = row.values[3]?.value || row.values[2]?.value || '';
                      const isScan = detail.toUpperCase().includes('SCAN');
                      const hasIndex = detail.toLowerCase().includes('idx_') || detail.toLowerCase().includes('index');
                      const isWarning = isScan && !hasIndex;
                      
                      return (
                        <div 
                          key={idx} 
                          className={`plan-node p-3 border rounded ${isWarning ? 'border-orange-500 bg-orange-50 plan-warning text-orange-500' : 'border-gray-200'}`}
                          style={{ marginLeft: `${(row.values[0]?.value || 0) * 20}px` }}
                        >
                          <div className="font-mono text-sm">
                            {detail}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Optimization Hints */}
                  {explainPlan.rows.some((row: any) => {
                    const detail = (row.values[3]?.value || row.values[2]?.value || '').toUpperCase();
                    return detail.includes('SCAN') && !detail.includes('INDEX');
                  }) && (
                    <div id="optimizationHints" className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                      <h4 className="font-semibold text-yellow-800 mb-2">Optimization Hints</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Consider adding an index to improve query performance</li>
                        <li>• Table scans can be slow on large datasets</li>
                      </ul>
                    </div>
                  )}

                  {/* Raw Plan Data */}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                      Show raw plan data
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {explainPlan.columns.map((col: any, idx: number) => (
                              <TableHead key={idx}>{col}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {explainPlan.rows.map((row: any, idx: number) => (
                            <TableRow key={idx}>
                              {row.values.map((cell: any, cellIdx: number) => (
                                <TableCell key={cellIdx}>
                                  {cell.value !== null ? String(cell.value) : 'NULL'}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </details>
                </div>
              ) : (
                <p className="text-gray-500">No plan data available</p>
              )}
            </CardContent>
          </Card>
        )}

        {results && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Results</CardTitle>
                  <CardDescription>
                    {results.rows.length} row{results.rows.length !== 1 ? 's' : ''} returned
                    {executionTime && (
                      <span id="executionTime" className="ml-2">
                        • Execution time: {executionTime.toFixed(2)}ms
                      </span>
                    )}
                  </CardDescription>
                </div>
                {results && (
                  <div className="flex gap-2">
                    <Button id="exportCSV" onClick={exportToCSV} variant="outline" size="sm">
                      Export CSV
                    </Button>
                    <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          id="exportCSVOptions" 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (results && exportOptions.selectedColumns.length === 0) {
                              setExportOptions({ ...exportOptions, selectedColumns: [...results.columns] });
                            }
                          }}
                        >
                          CSV Options
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>CSV Export Options</DialogTitle>
                          <DialogDescription>
                            Configure your CSV export settings
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          {/* Include Headers */}
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="includeHeaders"
                              checked={exportOptions.includeHeaders}
                              onCheckedChange={(checked) =>
                                setExportOptions({ ...exportOptions, includeHeaders: !!checked })
                              }
                            />
                            <Label htmlFor="includeHeaders" className="text-sm font-medium">
                              Include column headers
                            </Label>
                          </div>

                          {/* Delimiter */}
                          <div className="grid gap-2">
                            <Label htmlFor="csvDelimiter" className="text-sm font-medium">
                              Delimiter
                            </Label>
                            <Select
                              value={exportOptions.delimiter}
                              onValueChange={(value: any) =>
                                setExportOptions({ ...exportOptions, delimiter: value })
                              }
                            >
                              <SelectTrigger id="csvDelimiter">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="comma">Comma (,)</SelectItem>
                                <SelectItem value="semicolon">Semicolon (;)</SelectItem>
                                <SelectItem value="tab">Tab</SelectItem>
                                <SelectItem value="pipe">Pipe (|)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Quote All Fields */}
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="quoteAllFields"
                              checked={exportOptions.quoteAllFields}
                              onCheckedChange={(checked) =>
                                setExportOptions({ ...exportOptions, quoteAllFields: !!checked })
                              }
                            />
                            <Label htmlFor="quoteAllFields" className="text-sm font-medium">
                              Quote all fields
                            </Label>
                          </div>

                          {/* Line Ending */}
                          <div className="grid gap-2">
                            <Label htmlFor="lineEnding" className="text-sm font-medium">
                              Line Ending
                            </Label>
                            <Select
                              value={exportOptions.lineEnding}
                              onValueChange={(value: any) =>
                                setExportOptions({ ...exportOptions, lineEnding: value })
                              }
                            >
                              <SelectTrigger id="lineEnding">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="LF">LF (Unix/Linux)</SelectItem>
                                <SelectItem value="CRLF">CRLF (Windows)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* NULL Handling */}
                          <div className="grid gap-2">
                            <Label htmlFor="nullHandling" className="text-sm font-medium">
                              NULL Handling
                            </Label>
                            <Select
                              value={exportOptions.nullHandling}
                              onValueChange={(value: any) =>
                                setExportOptions({ ...exportOptions, nullHandling: value })
                              }
                            >
                              <SelectTrigger id="nullHandling">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="empty">Empty string</SelectItem>
                                <SelectItem value="null">NULL</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Column Selection */}
                          {results && results.columns.length > 0 && (
                            <div className="grid gap-2">
                              <Label className="text-sm font-medium">Select Columns to Export</Label>
                              <div className="flex gap-2 mb-2">
                                <Button
                                  id="selectAllColumns"
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setExportOptions({ ...exportOptions, selectedColumns: [...results.columns] })}
                                >
                                  Select All
                                </Button>
                                <Button
                                  id="deselectAllColumns"
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setExportOptions({ ...exportOptions, selectedColumns: [] })}
                                >
                                  Deselect All
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                {results.columns.map((col) => (
                                  <div key={col} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`column-${col}`}
                                      checked={exportOptions.selectedColumns.includes(col)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setExportOptions({
                                            ...exportOptions,
                                            selectedColumns: [...exportOptions.selectedColumns, col]
                                          });
                                        } else {
                                          setExportOptions({
                                            ...exportOptions,
                                            selectedColumns: exportOptions.selectedColumns.filter(c => c !== col)
                                          });
                                        }
                                      }}
                                    />
                                    <Label htmlFor={`column-${col}`} className="text-sm cursor-pointer">
                                      {col}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                              {exportOptions.selectedColumns.length === 0 && (
                                <p className="text-sm text-red-500">Please select at least one column</p>
                              )}
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button 
                            id="confirmExport" 
                            onClick={() => exportToCSVWithOptions(exportOptions)}
                          >
                            Export
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button id="exportJSON" onClick={exportToJSON} variant="outline" size="sm">
                      Export JSON
                    </Button>
                    <Dialog open={jsonExportDialogOpen} onOpenChange={setJsonExportDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          id="exportJSONOptions" 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (results && jsonExportOptions.selectedColumns.length === 0) {
                              setJsonExportOptions({ ...jsonExportOptions, selectedColumns: [...results.columns] });
                            }
                          }}
                        >
                          JSON Options
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>JSON Export Options</DialogTitle>
                          <DialogDescription>
                            Configure your JSON export settings
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          {/* Pretty Print */}
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="prettyPrint"
                              checked={jsonExportOptions.prettyPrint}
                              onCheckedChange={(checked) =>
                                setJsonExportOptions({ ...jsonExportOptions, prettyPrint: !!checked })
                              }
                            />
                            <Label htmlFor="prettyPrint" className="text-sm font-medium">
                              Pretty print (formatted with indentation)
                            </Label>
                          </div>

                          {/* Format */}
                          <div className="grid gap-2">
                            <Label htmlFor="jsonFormat" className="text-sm font-medium">
                              Format
                            </Label>
                            <Select
                              value={jsonExportOptions.format}
                              onValueChange={(value: any) =>
                                setJsonExportOptions({ ...jsonExportOptions, format: value })
                              }
                            >
                              <SelectTrigger id="jsonFormat">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="array">Array of objects</SelectItem>
                                <SelectItem value="object">Object (keyed by id)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Column Selection */}
                          {results && results.columns.length > 0 && (
                            <div className="grid gap-2">
                              <Label className="text-sm font-medium">Select Columns to Export</Label>
                              <div className="flex gap-2 mb-2">
                                <Button
                                  id="selectAllColumns"
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setJsonExportOptions({ ...jsonExportOptions, selectedColumns: [...results.columns] })}
                                >
                                  Select All
                                </Button>
                                <Button
                                  id="deselectAllColumns"
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setJsonExportOptions({ ...jsonExportOptions, selectedColumns: [] })}
                                >
                                  Deselect All
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                {results.columns.map((col) => (
                                  <div key={col} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`column-${col}`}
                                      checked={jsonExportOptions.selectedColumns.includes(col)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setJsonExportOptions({
                                            ...jsonExportOptions,
                                            selectedColumns: [...jsonExportOptions.selectedColumns, col]
                                          });
                                        } else {
                                          setJsonExportOptions({
                                            ...jsonExportOptions,
                                            selectedColumns: jsonExportOptions.selectedColumns.filter(c => c !== col)
                                          });
                                        }
                                      }}
                                    />
                                    <Label htmlFor={`column-${col}`} className="text-sm cursor-pointer">
                                      {col}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                              {jsonExportOptions.selectedColumns.length === 0 && (
                                <p className="text-sm text-red-500">Please select at least one column</p>
                              )}
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button 
                            id="confirmJSONExport" 
                            onClick={() => exportToJSONWithOptions(jsonExportOptions)}
                          >
                            Export
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button id="exportSQL" onClick={exportToSQL} variant="outline" size="sm">
                      Export SQL
                    </Button>
                    <Dialog open={sqlExportDialogOpen} onOpenChange={setSqlExportDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          id="exportSQLOptions" 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (results && sqlExportOptions.selectedColumns.length === 0) {
                              setSqlExportOptions({ ...sqlExportOptions, selectedColumns: [...results.columns] });
                            }
                          }}
                        >
                          SQL Options
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>SQL Dump Export Options</DialogTitle>
                          <DialogDescription>
                            Configure your SQL dump export settings
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          {/* DROP TABLE IF EXISTS */}
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="dropTableIfExists"
                              checked={sqlExportOptions.dropTableIfExists}
                              onCheckedChange={(checked) =>
                                setSqlExportOptions({ ...sqlExportOptions, dropTableIfExists: !!checked })
                              }
                            />
                            <Label htmlFor="dropTableIfExists" className="text-sm font-medium">
                              Include DROP TABLE IF EXISTS
                            </Label>
                          </div>

                          {/* Include Transactions */}
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="includeTransactions"
                              checked={sqlExportOptions.includeTransactions}
                              onCheckedChange={(checked) =>
                                setSqlExportOptions({ ...sqlExportOptions, includeTransactions: !!checked })
                              }
                            />
                            <Label htmlFor="includeTransactions" className="text-sm font-medium">
                              Wrap in transaction (BEGIN/COMMIT)
                            </Label>
                          </div>

                          {/* Batch Size */}
                          <div className="grid gap-2">
                            <Label htmlFor="batchSize" className="text-sm font-medium">
                              Batch size (rows per INSERT)
                            </Label>
                            <Input
                              id="batchSize"
                              type="number"
                              min="1"
                              max="1000"
                              value={sqlExportOptions.batchSize}
                              onChange={(e) =>
                                setSqlExportOptions({ ...sqlExportOptions, batchSize: parseInt(e.target.value) || 100 })
                              }
                            />
                          </div>

                          {/* Column Selection */}
                          {results && results.columns.length > 0 && (
                            <div className="grid gap-2">
                              <Label className="text-sm font-medium">Select Columns to Export</Label>
                              <div className="flex gap-2 mb-2">
                                <Button
                                  id="selectAllColumns"
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSqlExportOptions({ ...sqlExportOptions, selectedColumns: [...results.columns] })}
                                >
                                  Select All
                                </Button>
                                <Button
                                  id="deselectAllColumns"
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSqlExportOptions({ ...sqlExportOptions, selectedColumns: [] })}
                                >
                                  Deselect All
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                {results.columns.map((col) => (
                                  <div key={col} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`column-${col}`}
                                      checked={sqlExportOptions.selectedColumns.includes(col)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSqlExportOptions({
                                            ...sqlExportOptions,
                                            selectedColumns: [...sqlExportOptions.selectedColumns, col]
                                          });
                                        } else {
                                          setSqlExportOptions({
                                            ...sqlExportOptions,
                                            selectedColumns: sqlExportOptions.selectedColumns.filter(c => c !== col)
                                          });
                                        }
                                      }}
                                    />
                                    <Label htmlFor={`column-${col}`} className="text-sm cursor-pointer">
                                      {col}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                              {sqlExportOptions.selectedColumns.length === 0 && (
                                <p className="text-sm text-red-500">Please select at least one column</p>
                              )}
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button 
                            id="confirmSQLExport" 
                            onClick={() => exportToSQLWithOptions(sqlExportOptions)}
                          >
                            Export
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {results.rows.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table id="resultsTable">
                    <TableHeader>
                      <TableRow>
                        {results.columns.map((col, index) => (
                          <TableHead key={index}>{col}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.rows.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {row.values.map((cell, cellIndex) => (
                            <TableCell key={cellIndex}>
                              {cell.type === 'Null' ? (
                                <span className="text-gray-400 italic">NULL</span>
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
              ) : (
                <p className="text-gray-500">Query executed successfully (no rows returned)</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Save Query Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Query as Bookmark</DialogTitle>
              <DialogDescription>
                Save this query for later use
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bookmarkName">Name *</Label>
                <Input
                  id="bookmarkName"
                  placeholder="Enter query name"
                  value={bookmarkName}
                  onChange={(e) => setBookmarkName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bookmarkDescription">Description</Label>
                <Textarea
                  id="bookmarkDescription"
                  placeholder="Enter description (optional)"
                  value={bookmarkDescription}
                  onChange={(e) => setBookmarkDescription(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bookmarkTags">Tags</Label>
                <Input
                  id="bookmarkTags"
                  placeholder="Comma-separated tags (e.g., analytics, report)"
                  value={bookmarkTags}
                  onChange={(e) => setBookmarkTags(e.target.value)}
                />
              </div>
              {saveError && (
                <p className="text-sm text-red-500">{saveError}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveBookmark}>
                Save Bookmark
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Bookmark Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Bookmark</DialogTitle>
              <DialogDescription>
                Update bookmark details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editBookmarkName">Name *</Label>
                <Input
                  id="editBookmarkName"
                  placeholder="Enter query name"
                  value={bookmarkName}
                  onChange={(e) => setBookmarkName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="editBookmarkDescription">Description</Label>
                <Textarea
                  id="editBookmarkDescription"
                  placeholder="Enter description (optional)"
                  value={bookmarkDescription}
                  onChange={(e) => setBookmarkDescription(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="editBookmarkTags">Tags</Label>
                <Input
                  id="editBookmarkTags"
                  placeholder="Comma-separated tags"
                  value={bookmarkTags}
                  onChange={(e) => setBookmarkTags(e.target.value)}
                />
              </div>
              {saveError && (
                <p className="text-sm text-red-500">{saveError}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateBookmark}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Bookmark</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{bookmarkToDelete?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteBookmark}>
                Delete Bookmark
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bookmarks Sidebar */}
        {showBookmarksSidebar && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Saved Queries</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleExportBookmarks}>
                    Export Library
                  </Button>
                  <Label htmlFor="importBookmarks" className="cursor-pointer">
                    <Button size="sm" variant="outline" asChild>
                      <span>Import Library</span>
                    </Button>
                  </Label>
                  <input
                    id="importBookmarks"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportBookmarks}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search */}
                <Input
                  placeholder="Search queries..."
                  value={bookmarkSearch}
                  onChange={(e) => setBookmarkSearch(e.target.value)}
                />

                {/* Tag Filters */}
                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={selectedTagFilter === null ? 'default' : 'outline'}
                      onClick={() => setSelectedTagFilter(null)}
                    >
                      All
                    </Button>
                    {allTags.map(tag => (
                      <Button
                        key={tag}
                        size="sm"
                        variant={selectedTagFilter === tag ? 'default' : 'outline'}
                        onClick={() => setSelectedTagFilter(tag)}
                        data-tag-filter={tag}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Bookmarks List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredBookmarks.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {bookmarkSearch || selectedTagFilter ? 'No matching queries found' : 'No saved queries yet'}
                    </p>
                  ) : (
                    filteredBookmarks.map(bookmark => (
                      <div
                        key={bookmark.id}
                        data-query-name={bookmark.name}
                        className="border rounded p-3 space-y-2"
                      >
                        <div
                          className="cursor-pointer hover:bg-gray-50 -m-3 p-3"
                          onClick={() => handleLoadBookmark(bookmark)}
                        >
                          <div className="font-semibold">{bookmark.name}</div>
                          {bookmark.description && (
                            <div className="text-sm text-gray-600">{bookmark.description}</div>
                          )}
                          <div className="font-mono text-xs text-gray-500 mt-1 truncate">
                            {bookmark.sql.substring(0, 100)}
                            {bookmark.sql.length > 100 && '...'}
                          </div>
                          <div className="flex gap-2 items-center mt-2">
                            {bookmark.tags.map(tag => (
                              <span
                                key={tag}
                                className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            <span className="text-xs text-gray-500">
                              Created {new Date(bookmark.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(bookmark);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDeleteBookmark(bookmark);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Stats Panel */}
        {showPerformanceStats && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Performance Statistics</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportPerformanceStats}
                  >
                    Export Stats
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setShowClearStatsDialog(true)}
                  >
                    Clear Stats
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {performanceRecords.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No performance data yet</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {performanceRecords.length}
                      </div>
                      <div className="text-sm text-gray-600">Total queries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {performanceRecords.reduce((sum, r) => sum + r.executionCount, 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total executions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {performanceRecords.filter(r => r.avgTime > 1000).length}
                      </div>
                      <div className="text-sm text-gray-600">Slow queries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {(performanceRecords.reduce((sum, r) => sum + r.totalTime, 0) / 
                          performanceRecords.reduce((sum, r) => sum + r.executionCount, 0)).toFixed(2)}ms
                      </div>
                      <div className="text-sm text-gray-600">Avg execution time</div>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {performanceRecords.map(record => (
                      <div
                        key={record.id}
                        data-query-stats={record.sql}
                        className={`border rounded p-3 ${
                          record.avgTime > 1000 ? 'border-orange-300 bg-orange-50' : ''
                        }`}
                      >
                        <div className="font-mono text-sm mb-2">{record.sql}</div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Executions:</span>{' '}
                            <span className="font-semibold">{record.executionCount}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Avg:</span>{' '}
                            <span className="font-semibold">{record.avgTime.toFixed(2)}ms</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Min:</span>{' '}
                            <span className="font-semibold">{record.minTime.toFixed(2)}ms</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Max:</span>{' '}
                            <span className="font-semibold">{record.maxTime.toFixed(2)}ms</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Last executed: {new Date(record.lastExecuted).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Slow Queries Panel */}
        {showSlowQueries && (
          <Card>
            <CardHeader>
              <CardTitle>Slow Queries (&gt; 1000ms)</CardTitle>
            </CardHeader>
            <CardContent>
              <div id="slowQueriesList" className="space-y-2">
                {performanceRecords.filter(r => r.avgTime > 1000 || r.maxTime > 1000).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No slow queries detected
                  </p>
                ) : (
                  performanceRecords
                    .filter(r => r.avgTime > 1000 || r.maxTime > 1000)
                    .sort((a, b) => b.avgTime - a.avgTime)
                    .map(record => (
                      <div
                        key={record.id}
                        className="border border-orange-300 bg-orange-50 rounded p-3"
                      >
                        <div className="font-mono text-sm mb-2">{record.sql}</div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Avg:</span>{' '}
                            <span className="font-semibold text-orange-700">
                              {record.avgTime.toFixed(2)}ms
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Max:</span>{' '}
                            <span className="font-semibold text-red-700">
                              {record.maxTime.toFixed(2)}ms
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Executions:</span>{' '}
                            <span className="font-semibold">{record.executionCount}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Last run:</span>{' '}
                            <span className="font-semibold">
                              {new Date(record.lastExecuted).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clear Stats Confirmation Dialog */}
        <Dialog open={showClearStatsDialog} onOpenChange={setShowClearStatsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clear Performance Statistics?</DialogTitle>
              <DialogDescription>
                This will permanently delete all performance tracking data. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowClearStatsDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleClearPerformanceStats}>
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function QueryInterfacePage() {
  return <QueryInterfaceContent />;
}
