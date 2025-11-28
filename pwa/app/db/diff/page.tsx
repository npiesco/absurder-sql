'use client';

import { useState, useEffect } from 'react';
import { useDatabaseStore } from '@/lib/db/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface TableInfo {
  name: string;
  sql: string;
}

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

interface IndexInfo {
  name: string;
  sql: string;
}

interface SchemaDiff {
  tablesAdded: string[];
  tablesRemoved: string[];
  tablesModified: {
    name: string;
    columnsAdded: string[];
    columnsRemoved: string[];
    columnsModified: string[];
  }[];
  indexesAdded: string[];
  indexesRemoved: string[];
}

function SchemaDiffContent() {
  const { db: currentDb } = useDatabaseStore();
  const [allDatabases, setAllDatabases] = useState<string[]>([]);
  const [sourceDbName, setSourceDbName] = useState<string>('');
  const [targetDbName, setTargetDbName] = useState<string>('');
  const [diff, setDiff] = useState<SchemaDiff | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasmReady, setWasmReady] = useState(false);
  const [forwardMigration, setForwardMigration] = useState<string>('');
  const [rollbackMigration, setRollbackMigration] = useState<string>('');
  const [showMigration, setShowMigration] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize WASM
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).Database) {
      setWasmReady(true);
      return; // Already initialized
    }

    async function initializeWasm() {
      try {
        const { default: init, Database } = await import('@npiesco/absurder-sql');
        await init();
        (window as any).Database = Database;
        setWasmReady(true);
      } catch (err: any) {
        console.error('Failed to initialize WASM:', err);
      }
    }

    initializeWasm();
  }, []);

  // Load list of all databases from IndexedDB
  useEffect(() => {
    if (!wasmReady) return;
    
    async function loadDatabases() {
      try {
        const Database = (window as any).Database;
        if (Database && Database.getAllDatabases) {
          const dbNames = await Database.getAllDatabases();
          setAllDatabases(dbNames);
        }
      } catch (err) {
        console.error('Failed to load databases:', err);
      }
    }

    loadDatabases();
  }, [wasmReady]);

  const compareDatabases = async () => {
    if (!sourceDbName || !targetDbName) {
      setError('Please select both source and target databases');
      return;
    }

    if (sourceDbName === targetDbName) {
      setDiff({
        tablesAdded: [],
        tablesRemoved: [],
        tablesModified: [],
        indexesAdded: [],
        indexesRemoved: [],
      });
      return;
    }

    setIsComparing(true);
    setError(null);
    setDiff(null);

    try {
      // Load both databases using Database class
      const Database = (window as any).Database;
      if (!Database) {
        throw new Error('Database API not available');
      }

      const sourceDb = await Database.newDatabase(sourceDbName);
      const targetDb = await Database.newDatabase(targetDbName);

      // Get schema information from both databases
      const sourceTables = await sourceDb.execute(
        "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      );
      const targetTables = await targetDb.execute(
        "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      );

      const sourceIndexes = await sourceDb.execute(
        "SELECT name, sql FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      );
      const targetIndexes = await targetDb.execute(
        "SELECT name, sql FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      );

      // Build sets for comparison
      const sourceTableNames = new Set<string>(sourceTables.rows.map((r: any) => r.values[0].value as string));
      const targetTableNames = new Set<string>(targetTables.rows.map((r: any) => r.values[0].value as string));
      const sourceIndexNames = new Set<string>(sourceIndexes.rows.map((r: any) => r.values[0].value as string));
      const targetIndexNames = new Set<string>(targetIndexes.rows.map((r: any) => r.values[0].value as string));

      // Calculate differences
      const tablesAdded = Array.from(targetTableNames).filter(t => !sourceTableNames.has(t));
      const tablesRemoved = Array.from(sourceTableNames).filter(t => !targetTableNames.has(t));
      const indexesAdded = Array.from(targetIndexNames).filter(i => !sourceIndexNames.has(i));
      const indexesRemoved = Array.from(sourceIndexNames).filter(i => !targetIndexNames.has(i));

      // Check for modified tables (tables in both but with different columns)
      const tablesModified: SchemaDiff['tablesModified'] = [];
      const commonTables = Array.from(sourceTableNames).filter(t => targetTableNames.has(t));

      for (const tableName of commonTables) {
        try {
          const sourceColumns = await sourceDb.execute(`PRAGMA table_info(${tableName})`);
          const targetColumns = await targetDb.execute(`PRAGMA table_info(${tableName})`);

          const sourceColNames = new Set<string>(sourceColumns.rows.map((r: any) => r.values[1].value as string));
          const targetColNames = new Set<string>(targetColumns.rows.map((r: any) => r.values[1].value as string));

          const columnsAdded: string[] = Array.from(targetColNames).filter(c => !sourceColNames.has(c));
          const columnsRemoved: string[] = Array.from(sourceColNames).filter(c => !targetColNames.has(c));

          if (columnsAdded.length > 0 || columnsRemoved.length > 0) {
            tablesModified.push({
              name: tableName,
              columnsAdded,
              columnsRemoved,
              columnsModified: [],
            });
          }
        } catch (err) {
          console.error(`Error comparing table ${tableName}:`, err);
        }
      }

      // Close temporary databases
      await sourceDb.close();
      await targetDb.close();

      setDiff({
        tablesAdded,
        tablesRemoved,
        tablesModified,
        indexesAdded,
        indexesRemoved,
      });
    } catch (err: any) {
      console.error('[SchemaDiff] Error comparing databases:', err);
      setError(err.message || 'Failed to compare databases');
    } finally {
      setIsComparing(false);
    }
  };

  const hasDifferences = diff && (
    diff.tablesAdded.length > 0 ||
    diff.tablesRemoved.length > 0 ||
    diff.tablesModified.length > 0 ||
    diff.indexesAdded.length > 0 ||
    diff.indexesRemoved.length > 0
  );

  const generateMigrationSQL = async () => {
    if (!diff || !hasDifferences) return;

    setIsGenerating(true);
    try {
      const Database = (window as any).Database;
      if (!Database) {
        throw new Error('Database API not available');
      }

      const targetDb = await Database.newDatabase(targetDbName);
      const sourceDb = await Database.newDatabase(sourceDbName);

      // Build forward migration (source → target)
      const forwardStatements: string[] = [];
      const rollbackStatements: string[] = [];

      forwardStatements.push('-- Forward Migration');
      forwardStatements.push(`-- Migrate ${sourceDbName} to ${targetDbName} schema`);
      forwardStatements.push('-- Generated: ' + new Date().toISOString());
      forwardStatements.push('');
      forwardStatements.push('BEGIN TRANSACTION;');
      forwardStatements.push('');

      rollbackStatements.push('-- Rollback Migration');
      rollbackStatements.push(`-- Rollback ${targetDbName} to ${sourceDbName} schema`);
      rollbackStatements.push('-- Generated: ' + new Date().toISOString());
      rollbackStatements.push('');
      rollbackStatements.push('BEGIN TRANSACTION;');
      rollbackStatements.push('');

      // Handle table additions (forward: CREATE TABLE, rollback: DROP TABLE)
      for (const tableName of diff.tablesAdded) {
        try {
          const tableInfo = await targetDb.execute(
            `SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}'`
          );
          if (tableInfo.rows.length > 0) {
            const createSql = tableInfo.rows[0].values[0].value;
            forwardStatements.push(`-- Add table: ${tableName}`);
            forwardStatements.push(createSql + ';');
            forwardStatements.push('');

            rollbackStatements.push(`-- Remove table: ${tableName}`);
            rollbackStatements.push(`DROP TABLE IF EXISTS ${tableName};`);
            rollbackStatements.push('');
          }
        } catch (err) {
          console.error(`Error getting CREATE statement for ${tableName}:`, err);
        }
      }

      // Handle table removals (forward: DROP TABLE, rollback: CREATE TABLE)
      for (const tableName of diff.tablesRemoved) {
        try {
          const tableInfo = await sourceDb.execute(
            `SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}'`
          );
          if (tableInfo.rows.length > 0) {
            const createSql = tableInfo.rows[0].values[0].value;
            forwardStatements.push(`-- Remove table: ${tableName}`);
            forwardStatements.push(`DROP TABLE IF EXISTS ${tableName};`);
            forwardStatements.push('');

            rollbackStatements.push(`-- Restore table: ${tableName}`);
            rollbackStatements.push(createSql + ';');
            rollbackStatements.push('');
          }
        } catch (err) {
          console.error(`Error getting DROP statement for ${tableName}:`, err);
        }
      }

      // Handle modified tables (ALTER TABLE statements)
      for (const table of diff.tablesModified) {
        try {
          // Get column details from target for added columns
          const targetColumns = await targetDb.execute(`PRAGMA table_info(${table.name})`);
          
          // Handle column additions
          for (const colName of table.columnsAdded) {
            const colInfo = targetColumns.rows.find((r: any) => r.values[1].value === colName);
            if (colInfo) {
              const colType = colInfo.values[2].value;
              const notNull = colInfo.values[3].value === 1;
              const dfltValue = colInfo.values[4].value;
              
              let alterStmt = `ALTER TABLE ${table.name} ADD COLUMN ${colName} ${colType}`;
              if (notNull) alterStmt += ' NOT NULL';
              if (dfltValue !== null) {
                alterStmt += ` DEFAULT ${dfltValue}`;
              }
              
              forwardStatements.push(`-- Add column to ${table.name}`);
              forwardStatements.push(alterStmt + ';');
              forwardStatements.push('');

              // SQLite doesn't support DROP COLUMN in older versions
              // We note this in the rollback
              rollbackStatements.push(`-- Note: SQLite DROP COLUMN requires table recreation`);
              rollbackStatements.push(`-- Column ${colName} was added to ${table.name}`);
              rollbackStatements.push('');
            }
          }

          // Handle column removals
          for (const colName of table.columnsRemoved) {
            // Note: SQLite doesn't support DROP COLUMN easily
            forwardStatements.push(`-- Note: Removing column ${colName} from ${table.name}`);
            forwardStatements.push(`-- SQLite requires table recreation for column removal`);
            forwardStatements.push(`-- Consider manual migration or backup/restore`);
            forwardStatements.push('');

            rollbackStatements.push(`-- Note: Column ${colName} was removed from ${table.name}`);
            rollbackStatements.push(`-- Would require ALTER TABLE ADD COLUMN`);
            rollbackStatements.push('');
          }
        } catch (err) {
          console.error(`Error generating ALTER statements for ${table.name}:`, err);
        }
      }

      // Handle index additions
      for (const indexName of diff.indexesAdded) {
        try {
          const indexInfo = await targetDb.execute(
            `SELECT sql FROM sqlite_master WHERE type='index' AND name='${indexName}'`
          );
          if (indexInfo.rows.length > 0 && indexInfo.rows[0].values[0].value) {
            const createSql = indexInfo.rows[0].values[0].value;
            forwardStatements.push(`-- Add index: ${indexName}`);
            forwardStatements.push(createSql + ';');
            forwardStatements.push('');

            rollbackStatements.push(`-- Remove index: ${indexName}`);
            rollbackStatements.push(`DROP INDEX IF EXISTS ${indexName};`);
            rollbackStatements.push('');
          }
        } catch (err) {
          console.error(`Error getting CREATE INDEX for ${indexName}:`, err);
        }
      }

      // Handle index removals
      for (const indexName of diff.indexesRemoved) {
        try {
          const indexInfo = await sourceDb.execute(
            `SELECT sql FROM sqlite_master WHERE type='index' AND name='${indexName}'`
          );
          if (indexInfo.rows.length > 0 && indexInfo.rows[0].values[0].value) {
            const createSql = indexInfo.rows[0].values[0].value;
            forwardStatements.push(`-- Remove index: ${indexName}`);
            forwardStatements.push(`DROP INDEX IF EXISTS ${indexName};`);
            forwardStatements.push('');

            rollbackStatements.push(`-- Restore index: ${indexName}`);
            rollbackStatements.push(createSql + ';');
            rollbackStatements.push('');
          }
        } catch (err) {
          console.error(`Error getting DROP INDEX for ${indexName}:`, err);
        }
      }

      forwardStatements.push('COMMIT;');
      rollbackStatements.push('COMMIT;');

      await targetDb.close();
      await sourceDb.close();

      setForwardMigration(forwardStatements.join('\n'));
      setRollbackMigration(rollbackStatements.join('\n'));
      setShowMigration(true);
    } catch (err: any) {
      console.error('[MigrationGenerator] Error generating migration:', err);
      setError(err.message || 'Failed to generate migration');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadForwardMigration = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(forwardMigration, `forward_migration_${timestamp}.sql`);
  };

  const downloadRollbackMigration = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(rollbackMigration, `rollback_migration_${timestamp}.sql`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Schema Diff</h1>
      <Card>
        <CardHeader>
          <CardTitle>Compare Databases</CardTitle>
          <CardDescription>
            Compare schema differences between two databases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="sourceDb" className="text-sm font-medium">
                Source Database
              </label>
              <Select value={sourceDbName} onValueChange={setSourceDbName}>
                <SelectTrigger id="sourceDb">
                  <SelectValue placeholder="Select source database" />
                </SelectTrigger>
                <SelectContent>
                  {allDatabases.map((dbName) => (
                    <SelectItem key={dbName} value={dbName}>
                      {dbName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="targetDb" className="text-sm font-medium">
                Target Database
              </label>
              <Select value={targetDbName} onValueChange={setTargetDbName}>
                <SelectTrigger id="targetDb">
                  <SelectValue placeholder="Select target database" />
                </SelectTrigger>
                <SelectContent>
                  {allDatabases.map((dbName) => (
                    <SelectItem key={dbName} value={dbName}>
                      {dbName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            id="compareButton"
            onClick={compareDatabases}
            disabled={!sourceDbName || !targetDbName || isComparing}
          >
            {isComparing ? 'Comparing...' : 'Compare Databases'}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {diff && !hasDifferences && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No differences found. The databases have identical schemas.
            </p>
          </CardContent>
        </Card>
      )}

      {diff && hasDifferences && (
        <div className="space-y-4" data-testid="diff-summary">
          <Card>
            <CardContent className="py-4">
              <Button
                id="generateMigrationButton"
                onClick={generateMigrationSQL}
                disabled={isGenerating}
                className="w-full md:w-auto"
              >
                {isGenerating ? 'Generating...' : 'Generate Migration'}
              </Button>
            </CardContent>
          </Card>

          {showMigration && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Forward Migration SQL</CardTitle>
                    <Button
                      id="downloadForwardMigration"
                      onClick={downloadForwardMigration}
                      variant="outline"
                      size="sm"
                    >
                      Download Forward
                    </Button>
                  </div>
                  <CardDescription>
                    Apply these changes to migrate from {sourceDbName} to {targetDbName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre
                    id="forwardMigrationSql"
                    data-testid="forward-migration"
                    className="p-4 bg-gray-50 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre"
                  >
                    {forwardMigration}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Rollback Migration SQL</CardTitle>
                    <Button
                      id="downloadRollbackMigration"
                      onClick={downloadRollbackMigration}
                      variant="outline"
                      size="sm"
                    >
                      Download Rollback
                    </Button>
                  </div>
                  <CardDescription>
                    Use this to revert the migration and restore {sourceDbName} schema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre
                    id="rollbackMigrationSql"
                    data-testid="rollback-migration"
                    className="p-4 bg-gray-50 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre"
                  >
                    {rollbackMigration}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Difference Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {diff.tablesAdded.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    +{diff.tablesAdded.length}
                  </Badge>
                  <span className="text-sm">
                    {diff.tablesAdded.length === 1 ? 'table' : 'tables'} added
                  </span>
                </div>
              )}
              {diff.tablesRemoved.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-red-50 text-red-700">
                    -{diff.tablesRemoved.length}
                  </Badge>
                  <span className="text-sm">
                    {diff.tablesRemoved.length === 1 ? 'table' : 'tables'} removed
                  </span>
                </div>
              )}
              {diff.tablesModified.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    ~{diff.tablesModified.length}
                  </Badge>
                  <span className="text-sm">
                    {diff.tablesModified.length === 1 ? 'table' : 'tables'} modified
                  </span>
                </div>
              )}
              {diff.indexesAdded.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    +{diff.indexesAdded.length}
                  </Badge>
                  <span className="text-sm">
                    {diff.indexesAdded.length === 1 ? 'index' : 'indexes'} added
                  </span>
                </div>
              )}
              {diff.indexesRemoved.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-red-50 text-red-700">
                    -{diff.indexesRemoved.length}
                  </Badge>
                  <span className="text-sm">
                    {diff.indexesRemoved.length === 1 ? 'index' : 'indexes'} removed
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tables Added */}
          {diff.tablesAdded.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Tables Added</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {diff.tablesAdded.map((table) => (
                    <div
                      key={table}
                      className="p-3 bg-green-50 border border-green-200 rounded"
                      data-diff="added"
                    >
                      <span className="font-mono text-sm">{table}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tables Removed */}
          {diff.tablesRemoved.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-700">Tables Removed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {diff.tablesRemoved.map((table) => (
                    <div
                      key={table}
                      className="p-3 bg-red-50 border border-red-200 rounded"
                      data-diff="removed"
                    >
                      <span className="font-mono text-sm">{table}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tables Modified */}
          {diff.tablesModified.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-yellow-700">Tables Modified</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {diff.tablesModified.map((table) => (
                    <div
                      key={table.name}
                      className="p-4 bg-yellow-50 border border-yellow-200 rounded space-y-3"
                      data-diff="modified"
                    >
                      <div className="font-mono font-semibold">{table.name}</div>
                      
                      {table.columnsAdded.length > 0 && (
                        <div className="ml-4 space-y-1">
                          <div className="text-sm font-medium text-green-700">
                            Columns Added:
                          </div>
                          {table.columnsAdded.map((col) => (
                            <div key={col} className="ml-4 text-sm font-mono text-green-600">
                              + {col}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {table.columnsRemoved.length > 0 && (
                        <div className="ml-4 space-y-1">
                          <div className="text-sm font-medium text-red-700">
                            Columns Removed:
                          </div>
                          {table.columnsRemoved.map((col) => (
                            <div key={col} className="ml-4 text-sm font-mono text-red-600">
                              - {col}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Indexes Added */}
          {diff.indexesAdded.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Indexes Added</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {diff.indexesAdded.map((index) => (
                    <div
                      key={index}
                      className="p-3 bg-green-50 border border-green-200 rounded"
                      data-type="index"
                      data-diff="added"
                    >
                      <span className="font-mono text-sm">{index}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Indexes Removed */}
          {diff.indexesRemoved.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-700">Indexes Removed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {diff.indexesRemoved.map((index) => (
                    <div
                      key={index}
                      className="p-3 bg-red-50 border border-red-200 rounded"
                      data-type="index"
                      data-diff="removed"
                    >
                      <span className="font-mono text-sm">{index}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default function SchemaDiffPage() {
  const currentDbName = useDatabaseStore((state) => state.currentDbName);
  
  return <SchemaDiffContent />;
}
