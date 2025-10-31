'use client';

import { useState, useEffect } from 'react';
import { DatabaseProvider, useDatabase } from '@/lib/db/provider';
import { useDatabaseStore } from '@/lib/db/store';
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
import type { QueryResult } from '@/lib/db/client';

interface QueryHistoryItem {
  sql: string;
  timestamp: number;
  executionTime?: number;
}

function QueryInterfaceContent() {
  const { db, loading, error } = useDatabase();
  const [sql, setSql] = useState('');
  const [results, setResults] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).testDb = db;
      
      // Check for SQL in URL parameters
      const params = new URLSearchParams(window.location.search);
      const sqlParam = params.get('sql');
      if (sqlParam) {
        setSql(sqlParam);
      }
    }
  }, [db]);

  const executeQuery = async () => {
    if (!db || !sql.trim()) return;

    setQueryError(null);
    setResults(null);

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
    } catch (err: any) {
      setQueryError(err.message || 'Query execution failed');
      setExecutionTime(null);
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

  const exportToCSV = () => {
    if (!results || !results.rows.length) return;

    // Build CSV header
    const headers = results.columns.join(',');
    
    // Build CSV rows
    const rows = results.rows.map(row => {
      return row.values.map(col => {
        if (col.type === 'Null') return '';
        const value = String(col.value);
        // Escape quotes and wrap in quotes if contains comma or quote
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });

    const csv = [headers, ...rows].join('\n');
    
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
  };

  const exportToJSON = () => {
    if (!results || !results.rows.length) return;

    // Convert rows to objects
    const data = results.rows.map(row => {
      const obj: Record<string, any> = {};
      results.columns.forEach((col, index) => {
        const value = row.values[index];
        obj[col] = value.type === 'Null' ? null : value.value;
      });
      return obj;
    });

    const json = JSON.stringify(data, null, 2);
    
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
  };

  return (
    <div id="queryInterface" className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">SQL Query Interface</h1>

      {loading && <p>Loading database...</p>}
      {error && <p className="text-red-500">Error: {error.message}</p>}

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
                id="historyButton"
                onClick={() => setShowHistory(!showHistory)}
                variant="outline"
                disabled={queryHistory.length === 0}
              >
                {showHistory ? 'Hide' : 'Show'} History ({queryHistory.length})
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
                {results.rows.length > 0 && (
                  <div className="flex gap-2">
                    <Button id="exportCSV" onClick={exportToCSV} variant="outline" size="sm">
                      Export CSV
                    </Button>
                    <Button id="exportJSON" onClick={exportToJSON} variant="outline" size="sm">
                      Export JSON
                    </Button>
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
      </div>
    </div>
  );
}

export default function QueryInterfacePage() {
  const { currentDbName } = useDatabaseStore();
  
  return (
    <DatabaseProvider dbName={currentDbName || 'database.db'}>
      <QueryInterfaceContent />
    </DatabaseProvider>
  );
}
