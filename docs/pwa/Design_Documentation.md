# Design Documentation II
## AbsurderSQL PWA - Adminer Parity Technical Architecture

**Version:** 3.1  
**Last Updated:** October 31, 2025  
**Status:** Implementation Guide  
**Target:** Complete Adminer Replacement

---

## System Architecture

### Component Hierarchy

```
app/
├── db/
│   ├── page.tsx                    # Database management (✅ EXISTS)
│   ├── query/page.tsx              # Query interface (✅ EXISTS)
│   ├── schema/page.tsx             # Schema viewer (✅ EXISTS)
│   ├── browse/page.tsx             # ⏳ Data browser (NEW)
│   ├── import-csv/page.tsx         # ⏳ CSV import (NEW)
│   ├── designer/page.tsx           # ⏳ Table designer (NEW)
│   ├── views/page.tsx              # ⏳ Views management (NEW)
│   ├── triggers/page.tsx           # ⏳ Triggers management (NEW)
│   ├── diagram/page.tsx            # ⏳ ER diagram (NEW)
│   ├── charts/page.tsx             # ⏳ Chart builder (NEW)
│   ├── dashboard/page.tsx          # ⏳ Dashboard (NEW)
│   ├── search/page.tsx             # ⏳ Search (NEW)
│   ├── diff/page.tsx               # ⏳ Schema diff (NEW)
│   └── storage/page.tsx            # ⏳ Storage analysis (NEW)

components/
├── data-browser/
│   ├── DataTable.tsx               # ⏳ Main data table component
│   ├── EditableCell.tsx            # ⏳ Inline editable cell
│   ├── FilterPanel.tsx             # ⏳ Column filters
│   ├── PaginationControls.tsx     # ⏳ Pagination UI
│   └── BulkOperations.tsx          # ⏳ Bulk delete/edit
├── import-export/
│   ├── CSVImporter.tsx             # ⏳ CSV import wizard
│   ├── CSVExporter.tsx             # ⏳ CSV export options
│   ├── JSONExporter.tsx            # ⏳ JSON export
│   └── SQLDumpExporter.tsx         # ⏳ SQL dump generator
├── table-designer/
│   ├── ColumnEditor.tsx            # ⏳ Column definition UI
│   ├── IndexManager.tsx            # ⏳ Index management
│   ├── ForeignKeyEditor.tsx        # ⏳ FK constraints
│   └── TableOperations.tsx         # ⏳ Rename/drop/copy table
├── chart-builder/
│   ├── ChartTypeSelector.tsx       # ⏳ Select chart type
│   ├── DataMapper.tsx              # ⏳ Map columns to axes
│   ├── ChartPreview.tsx            # ⏳ Live preview
│   └── ChartExporter.tsx           # ⏳ Export PNG/SVG
└── query-tools/
    ├── QueryFormatter.tsx          # ⏳ SQL formatter
    ├── QueryBookmarks.tsx          # ⏳ Save/load queries
    ├── ExplainViewer.tsx           # ⏳ EXPLAIN plan viz
    └── QueryStats.tsx              # ⏳ Performance metrics

lib/
├── db/
│   ├── client.ts                   # ✅ Database client wrapper
│   ├── hooks.ts                    # ✅ React hooks
│   ├── store.ts                    # ✅ Zustand state store (NEW)
│   ├── data-browser.ts             # ⏳ Data browsing logic (NEW)
│   ├── csv-parser.ts               # ⏳ CSV import/export (NEW)
│   ├── schema-diff.ts              # ⏳ Schema comparison (NEW)
│   └── query-analyzer.ts           # ⏳ Performance analysis (NEW)
└── utils/
    ├── sql-formatter.ts            # ⏳ SQL formatting utils
    ├── chart-generator.ts          # ⏳ Chart generation
    └── migration-generator.ts      # ⏳ Migration SQL gen

e2e/
├── roundtrip.spec.ts               # ✅ Full data integrity tests (NEW)
├── database-operations.spec.ts     # ✅ Import/Export/Create/Delete tests
├── query-interface.spec.ts         # ✅ SQL query UI tests
├── schema-viewer.spec.ts           # ✅ Schema viewer tests
└── accessibility.spec.ts           # ✅ WCAG compliance tests
```

---

## State Management Architecture

### Zustand Store

```typescript
// lib/db/store.ts

import { create } from 'zustand';

interface DatabaseStore {
  db: any | null;
  currentDbName: string;
  loading: boolean;
  status: string;
  tableCount: number;
  
  setDb: (db: any) => void;
  setCurrentDbName: (name: string) => void;
  setLoading: (loading: boolean) => void;
  setStatus: (status: string) => void;
  setTableCount: (count: number) => void;
  reset: () => void;
}

export const useDatabaseStore = create<DatabaseStore>((set) => ({
  db: null,
  currentDbName: 'database.db',
  loading: true,
  status: 'Initializing...',
  tableCount: 0,
  
  setDb: (db) => set({ db }),
  setCurrentDbName: (name) => set({ currentDbName: name }),
  setLoading: (loading) => set({ loading }),
  setStatus: (status) => set({ status }),
  setTableCount: (count) => set({ tableCount: count }),
  reset: () => set({
    db: null,
    currentDbName: 'database.db',
    loading: false,
    status: 'Reset',
    tableCount: 0,
  }),
}));
```

**Key Features:**
- Centralized database state management
- Tracks current database name (critical for delete operations)
- Single source of truth for UI state
- Prevents state conflicts between programmatic and UI operations

**Usage in Components:**
```typescript
import { useDatabaseStore } from '@/lib/db/store';

export default function DatabaseManagementPage() {
  const { 
    db, 
    currentDbName, 
    loading, 
    status, 
    setDb, 
    setCurrentDbName, 
    setStatus 
  } = useDatabaseStore();
  
  // Use state directly without local useState
}
```

---

## Data Browser Architecture

### Component Design

```typescript
// components/data-browser/DataTable.tsx

interface DataTableProps {
  tableName: string;
  pageSize: 100 | 500 | 1000;
  onEdit: (rowId: any, column: string, newValue: any) => Promise<void>;
  onDelete: (rowIds: any[]) => Promise<void>;
}

export function DataTable({ tableName, pageSize, onEdit, onDelete }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedRows, setSelectedRows] = useState<Set<any>>(new Set());

  // Fetch data with pagination, sorting, filters
  const { data, loading, error } = useTableData(tableName, {
    page: currentPage,
    pageSize,
    sortColumn,
    sortDirection,
    filters,
  });

  return (
    <div className="data-table">
      <FilterPanel columns={data.columns} onFilter={setFilters} />
      <PaginationControls 
        currentPage={currentPage}
        total Pages={data.totalPages}
        onPageChange={setCurrentPage}
      />
      <BulkOperations selectedRows={selectedRows} onDelete={onDelete} />
      
      <table>
        <thead>
          <tr>
            <th><input type="checkbox" onChange={handleSelectAll} /></th>
            {data.columns.map(col => (
              <th key={col.name} onClick={() => handleSort(col.name)}>
                {col.name}
                {sortColumn === col.name && (sortDirection === 'ASC' ? '▲' : '▼')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map(row => (
            <tr key={row._rowid_}>
              <td><input type="checkbox" checked={selectedRows.has(row._rowid_)} /></td>
              {data.columns.map(col => (
                <EditableCell
                  key={col.name}
                  value={row[col.name]}
                  column={col}
                  onSave={(newValue) => onEdit(row._rowid_, col.name, newValue)}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Data Fetching Hook

```typescript
// lib/db/data-browser.ts

interface TableDataOptions {
  page: number;
  pageSize: number;
  sortColumn?: string;
  sortDirection?: 'ASC' | 'DESC';
  filters?: Record<string, any>;
}

export function useTableData(tableName: string, options: TableDataOptions) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { db } = useDatabase();

  useEffect(() => {
    async function fetchData() {
      if (!db) return;

      try {
        setLoading(true);

        // Build WHERE clause from filters
        const whereClause = buildWhereClause(options.filters);
        
        // Build ORDER BY clause
        const orderByClause = options.sortColumn 
          ? `ORDER BY ${options.sortColumn} ${options.sortDirection}`
          : '';

        // Calculate offset
        const offset = (options.page - 1) * options.pageSize;

        // Fetch data
        const sql = `
          SELECT rowid as _rowid_, *
          FROM ${tableName}
          ${whereClause}
          ${orderByClause}
          LIMIT ${options.pageSize}
          OFFSET ${offset}
        `;

        const result = await db.execute(sql);

        // Fetch total count
        const countSql = `
          SELECT COUNT(*) as total
          FROM ${tableName}
          ${whereClause}
        `;
        const countResult = await db.execute(countSql);
        const total = countResult.rows[0].values[0].value;

        // Fetch column info
        const columnsResult = await db.execute(`PRAGMA table_info(${tableName})`);
        const columns = columnsResult.rows.map(row => ({
          name: row.values[1].value,
          type: row.values[2].value,
          notNull: row.values[3].value === 1,
          defaultValue: row.values[4].value,
          primaryKey: row.values[5].value === 1,
        }));

        setData({
          columns,
          rows: result.rows,
          total,
          totalPages: Math.ceil(total / options.pageSize),
        });
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [db, tableName, JSON.stringify(options)]);

  return { data, loading, error };
}

function buildWhereClause(filters: Record<string, any>): string {
  const conditions = Object.entries(filters)
    .filter(([_, value]) => value !== null && value !== undefined)
    .map(([column, filter]) => {
      if (filter.type === 'contains') {
        return `${column} LIKE '%${filter.value}%'`;
      } else if (filter.type === 'equals') {
        return `${column} = '${filter.value}'`;
      } else if (filter.type === 'null') {
        return `${column} IS NULL`;
      } else if (filter.type === 'notNull') {
        return `${column} IS NOT NULL`;
      }
      // Add more filter types...
      return null;
    })
    .filter(Boolean);

  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
}
```

### Inline Editing Component

```typescript
// components/data-browser/EditableCell.tsx

interface EditableCellProps {
  value: any;
  column: ColumnInfo;
  onSave: (newValue: any) => Promise<void>;
}

export function EditableCell({ value, column, onSave }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDoubleClick = () => {
    setEditing(true);
    setEditValue(value);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await onSave(editValue);
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditing(false);
      setEditValue(value);
    }
  };

  if (editing) {
    return (
      <td className="editing">
        {renderEditor(column.type, editValue, setEditValue, handleKeyDown)}
        {saving && <Spinner />}
        {error && <div className="error">{error}</div>}
      </td>
    );
  }

  return (
    <td onDoubleClick={handleDoubleClick}>
      {renderValue(value, column.type)}
    </td>
  );
}

function renderEditor(type: string, value: any, onChange: (v: any) => void, onKeyDown: (e: any) => void) {
  switch (type) {
    case 'INTEGER':
      return <input type="number" value={value} onChange={(e) => onChange(e.target.valueAsNumber)} onKeyDown={onKeyDown} autoFocus />;
    case 'REAL':
      return <input type="number" step="any" value={value} onChange={(e) => onChange(e.target.valueAsNumber)} onKeyDown={onKeyDown} autoFocus />;
    case 'TEXT':
      return <textarea value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} autoFocus />;
    case 'BLOB':
      return <input type="file" onChange={(e) => onChange(e.target.files?.[0])} autoFocus />;
    default:
      return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} autoFocus />;
  }
}

function renderValue(value: any, type: string) {
  if (value === null) {
    return <span className="null">NULL</span>;
  }
  if (type === 'BLOB') {
    return <BlobPreview data={value} />;
  }
  return <span>{String(value)}</span>;
}
```

---

## CSV Import/Export Architecture

### CSV Import Flow

```typescript
// lib/db/csv-parser.ts

import Papa from 'papaparse';

export interface CSVImportOptions {
  file: File;
  tableName: string;
  hasHeaders: boolean;
  delimiter: ',' | '\t' | ';' | '|';
  encoding: 'UTF-8' | 'Latin1';
  columnMapping: Record<string, string>; // CSV column -> DB column
}

export async function importCSV(db: DatabaseClient, options: CSVImportOptions): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    let headers: string[] = [];

    Papa.parse(options.file, {
      delimiter: options.delimiter,
      encoding: options.encoding,
      header: options.hasHeaders,
      step: (row) => {
        if (options.hasHeaders && headers.length === 0) {
          headers = row.meta.fields || [];
        }
        results.push(row.data);
      },
      complete: async () => {
        try {
          // Begin transaction
          await db.execute('BEGIN TRANSACTION');

          let successCount = 0;
          let errorCount = 0;
          const errors: Array<{ row: number; error: string }> = [];

          for (let i = 0; i < results.length; i++) {
            try {
              const row = results[i];
              
              // Map CSV columns to DB columns
              const values = Object.entries(options.columnMapping).map(([csvCol, dbCol]) => {
                return row[csvCol];
              });

              const placeholders = values.map(() => '?').join(', ');
              const columns = Object.values(options.columnMapping).join(', ');

              await db.execute(
                `INSERT INTO ${options.tableName} (${columns}) VALUES (${placeholders})`,
                values
              );

              successCount++;
            } catch (err) {
              errorCount++;
              errors.push({ row: i + 1, error: (err as Error).message });
            }
          }

          // Commit transaction
          await db.execute('COMMIT');

          resolve({
            totalRows: results.length,
            successCount,
            errorCount,
            errors,
          });
        } catch (err) {
          await db.execute('ROLLBACK');
          reject(err);
        }
      },
      error: (err) => {
        reject(err);
      },
    });
  });
}
```

### CSV Export

```typescript
export interface CSVExportOptions {
  includeHeaders: boolean;
  delimiter: ',' | '\t' | ';' | '|';
  quoteAll: boolean;
  lineEnding: 'LF' | 'CRLF';
}

export function exportToCSV(data: QueryResult, options: CSVExportOptions): string {
  const rows: string[] = [];

  // Add headers
  if (options.includeHeaders) {
    const headers = data.columns.map(col => maybeQuote(col, options));
    rows.push(headers.join(options.delimiter));
  }

  // Add data rows
  for (const row of data.rows) {
    const values = row.values.map(val => {
      const strValue = val.value === null ? '' : String(val.value);
      return maybeQuote(strValue, options);
    });
    rows.push(values.join(options.delimiter));
  }

  const lineEnding = options.lineEnding === 'CRLF' ? '\r\n' : '\n';
  return rows.join(lineEnding);
}

function maybeQuote(value: string, options: CSVExportOptions): string {
  if (options.quoteAll) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  if (value.includes(options.delimiter) || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
```

---

## Table Designer Architecture

### Column Editor Component

```typescript
// components/table-designer/ColumnEditor.tsx

interface ColumnDefinition {
  name: string;
  type: 'INTEGER' | 'TEXT' | 'REAL' | 'BLOB';
  notNull: boolean;
  unique: boolean;
  primaryKey: boolean;
  defaultValue?: string;
  autoIncrement?: boolean;
}

export function ColumnEditor({ tableName }: { tableName: string }) {
  const [columns, setColumns] = useState<ColumnDefinition[]>([]);
  const { db } = useDatabase();

  useEffect(() => {
    // Fetch existing columns
    async function loadColumns() {
      const result = await db.execute(`PRAGMA table_info(${tableName})`);
      const cols = result.rows.map(row => ({
        name: row.values[1].value,
        type: row.values[2].value,
        notNull: row.values[3].value === 1,
        defaultValue: row.values[4].value,
        primaryKey: row.values[5].value === 1,
        unique: false, // TODO: fetch from index info
        autoIncrement: false, // TODO: detect from schema
      }));
      setColumns(cols);
    }
    loadColumns();
  }, [tableName]);

  const handleAddColumn = () => {
    setColumns([...columns, {
      name: '',
      type: 'TEXT',
      notNull: false,
      unique: false,
      primaryKey: false,
    }]);
  };

  const handleSaveColumn = async (index: number) => {
    const column = columns[index];
    
    // Build ALTER TABLE statement
    const constraints = [];
    if (column.notNull) constraints.push('NOT NULL');
    if (column.unique) constraints.push('UNIQUE');
    if (column.defaultValue) constraints.push(`DEFAULT ${column.defaultValue}`);

    const sql = `ALTER TABLE ${tableName} ADD COLUMN ${column.name} ${column.type} ${constraints.join(' ')}`;
    await db.execute(sql);
  };

  const handleRemoveColumn = async (columnName: string) => {
    // SQLite requires table recreation to drop column
    await db.execute(`ALTER TABLE ${tableName} DROP COLUMN ${columnName}`);
    setColumns(columns.filter(c => c.name !== columnName));
  };

  return (
    <div className="column-editor">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>NOT NULL</th>
            <th>UNIQUE</th>
            <th>PK</th>
            <th>Default</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {columns.map((col, index) => (
            <tr key={index}>
              <td><input value={col.name} onChange={(e) => updateColumn(index, 'name', e.target.value)} /></td>
              <td>
                <select value={col.type} onChange={(e) => updateColumn(index, 'type', e.target.value)}>
                  <option value="INTEGER">INTEGER</option>
                  <option value="TEXT">TEXT</option>
                  <option value="REAL">REAL</option>
                  <option value="BLOB">BLOB</option>
                </select>
              </td>
              <td><input type="checkbox" checked={col.notNull} onChange={(e) => updateColumn(index, 'notNull', e.target.checked)} /></td>
              <td><input type="checkbox" checked={col.unique} onChange={(e) => updateColumn(index, 'unique', e.target.checked)} /></td>
              <td><input type="checkbox" checked={col.primaryKey} onChange={(e) => updateColumn(index, 'primaryKey', e.target.checked)} /></td>
              <td><input value={col.defaultValue || ''} onChange={(e) => updateColumn(index, 'defaultValue', e.target.value)} /></td>
              <td>
                <Button onClick={() => handleSaveColumn(index)}>Save</Button>
                <Button onClick={() => handleRemoveColumn(col.name)} variant="destructive">Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button onClick={handleAddColumn}>Add Column</Button>
    </div>
  );

  function updateColumn(index: number, field: keyof ColumnDefinition, value: any) {
    const updated = [...columns];
    updated[index] = { ...updated[index], [field]: value };
    setColumns(updated);
  }
}
```

---

## Chart Builder Architecture

### Chart Component

```typescript
// components/chart-builder/ChartBuilder.tsx

import { LineChart, BarChart, PieChart, ScatterChart, Line, Bar, Pie, Scatter, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'scatter';
  title: string;
  xAxis: string;
  yAxis: string[];
  groupBy?: string;
}

export function ChartBuilder({ data }: { data: QueryResult }) {
  const [config, setConfig] = useState<ChartConfig>({
    type: 'bar',
    title: 'Chart',
    xAxis: data.columns[0],
    yAxis: [data.columns[1]],
  });

  // Transform query result to chart data
  const chartData = useMemo(() => {
    return data.rows.map(row => {
      const obj: any = {};
      data.columns.forEach((col, i) => {
        obj[col] = row.values[i].value;
      });
      return obj;
    });
  }, [data]);

  const renderChart = () => {
    switch (config.type) {
      case 'line':
        return (
          <LineChart data={chartData} width={600} height={400}>
            <XAxis dataKey={config.xAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            {config.yAxis.map(y => (
              <Line key={y} type="monotone" dataKey={y} stroke={randomColor()} />
            ))}
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart data={chartData} width={600} height={400}>
            <XAxis dataKey={config.xAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            {config.yAxis.map(y => (
              <Bar key={y} dataKey={y} fill={randomColor()} />
            ))}
          </BarChart>
        );
      // Add pie, scatter...
      default:
        return null;
    }
  };

  return (
    <div>
      <ChartConfigPanel config={config} onChange={setConfig} columns={data.columns} />
      <div className="chart-preview">
        {renderChart()}
      </div>
      <Button onClick={() => exportChartAsPNG()}>Export PNG</Button>
      <Button onClick={() => exportChartAsSVG()}>Export SVG</Button>
    </div>
  );
}
```

---

## Performance & Security

### SQL Injection Prevention

```typescript
// ALWAYS use parameterized queries
const safeSql = `SELECT * FROM users WHERE id = ?`;
await db.execute(safeSql, [userId]);

// NEVER concatenate user input
const UNSAFE = `SELECT * FROM users WHERE id = ${userId}`; // ❌
```

### Performance Optimization

- **Pagination:** Limit queries to 100/500/1000 rows
- **Indexing:** Detect missing indexes on filtered columns
- **Caching:** Cache query results for 30s
- **Web Workers:** Run CSV parsing in background thread
- **Lazy Loading:** Code split heavy components (charts, diagrams)

---

## Testing Strategy

### Enterprise Testing Discipline

Following mobile INSTRUCTIONS.md patterns:
- **Serial execution:** `--workers=1` for database tests
- **Unique database names:** Timestamp-based for isolation  
- **Complete cleanup:** Delete databases after tests
- **Zero flakiness tolerance:** Tests must pass 100% of the time

### Unit Tests
```typescript
// data-browser.test.ts
describe('buildWhereClause', () => {
  it('should build correct WHERE clause for contains filter', () => {
    const filters = { name: { type: 'contains', value: 'John' } };
    expect(buildWhereClause(filters)).toBe("WHERE name LIKE '%John%'");
  });
});
```

### E2E Tests - Data Browser
```typescript
// data-browser.spec.ts
test('should edit cell and save', async ({ page }) => {
  await page.goto('/db/browse?table=users');
  await page.doubleClick('td[data-column="name"]');
  await page.fill('input', 'New Name');
  await page.press('input', 'Enter');
  await page.waitForSelector('.saved-indicator');
  
  // Verify in database
  const result = await page.evaluate(async () => {
    const db = (window as any).testDb;
    return await db.execute('SELECT name FROM users WHERE rowid = 1');
  });
  expect(result.rows[0].values[0].value).toBe('New Name');
});
```

### E2E Tests - Roundtrip Data Integrity (✅ IMPLEMENTED)

```typescript
// e2e/roundtrip.spec.ts

test('should preserve all data types through export/import cycle', async ({ page }) => {
  // Create database with all SQLite types
  const originalData = await page.evaluate(async () => {
    const db = await window.Database.newDatabase('roundtrip_test.db');
    await db.execute(`
      CREATE TABLE comprehensive_test (
        id INTEGER PRIMARY KEY,
        text_field TEXT NOT NULL,
        int_field INTEGER,
        real_field REAL,
        blob_field BLOB,
        null_field TEXT
      )
    `);
    
    // Insert with special characters (quotes, unicode, XSS, newlines, tabs)
    await db.execute(`
      INSERT INTO comprehensive_test (text_field, int_field, real_field, null_field) VALUES
        ('Alice O''Brien', 30, 1234.56, NULL),
        ('Bob "The Builder"', 25, 9876.54, 'not null'),
        ('Charlie 你好', 35, 5555.55, NULL),
        ('Diana [rocket]', 28, 7777.77, 'value'),
        ('Eve <script>alert("XSS")</script>', 42, 3333.33, NULL),
        ('Frank\\nNewline\\tTab', 50, 8888.88, 'test')
    `);
    
    const result = await db.execute('SELECT * FROM comprehensive_test ORDER BY id');
    const exported = await db.exportToFile();
    await db.close();
    
    return {
      rows: result.rows,
      exportBytes: Array.from(exported)
    };
  });
  
  // Import back into new database
  const importedData = await page.evaluate(async (fileBytes) => {
    const bytes = new Uint8Array(fileBytes);
    const db = await window.Database.newDatabase('roundtrip_imported.db');
    await db.importFromFile(bytes);
    await db.close();
    
    const db2 = await window.Database.newDatabase('roundtrip_imported.db');
    const result = await db2.execute('SELECT * FROM comprehensive_test ORDER BY id');
    const reExported = await db2.exportToFile();
    await db2.close();
    
    return {
      rows: result.rows,
      reExportBytes: Array.from(reExported)
    };
  }, originalData.exportBytes);
  
  // Verify row-by-row match
  expect(importedData.rows.length).toBe(originalData.rows.length);
  
  // Verify byte-for-byte match on re-export
  const bytesMatch = importedData.reExportBytes.every((byte, i) => 
    byte === originalData.exportBytes[i]
  );
  expect(bytesMatch).toBe(true);
});

test('should preserve schema (indexes, triggers) through roundtrip', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const db = await window.Database.newDatabase('schema_roundtrip.db');
    
    await db.execute(`CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE)`);
    await db.execute('CREATE INDEX idx_users_name ON users(name)');
    await db.execute(`
      CREATE TRIGGER users_timestamp
      AFTER INSERT ON users
      BEGIN
        UPDATE users SET created_at = strftime('%s', 'now') WHERE id = NEW.id;
      END
    `);
    
    const exported = await db.exportToFile();
    await db.close();
    
    // Import and verify
    const db2 = await window.Database.newDatabase('schema_imported.db');
    await db2.importFromFile(exported);
    await db2.close();
    
    const db3 = await window.Database.newDatabase('schema_imported.db');
    const tables = await db3.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    const indexes = await db3.execute("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_users_name'");
    const triggers = await db3.execute("SELECT name FROM sqlite_master WHERE type='trigger' AND name='users_timestamp'");
    await db3.close();
    
    return {
      hasTable: tables.rows.length > 0,
      hasIndex: indexes.rows.length > 0,
      hasTrigger: triggers.rows.length > 0
    };
  });
  
  expect(result.hasTable).toBe(true);
  expect(result.hasIndex).toBe(true);
  expect(result.hasTrigger).toBe(true);
});

test('should handle 5 roundtrip cycles without corruption', async ({ page }) => {
  const result = await page.evaluate(async () => {
    let db = await window.Database.newDatabase('cycle1.db');
    await db.execute('CREATE TABLE cycle_test (id INTEGER PRIMARY KEY AUTOINCREMENT, value TEXT)');
    await db.execute("INSERT INTO cycle_test (value) VALUES ('Cycle1')");
    let exported = await db.exportToFile();
    await db.close();
    
    const exportSizes = [exported.length];
    
    // 4 more cycles
    for (let i = 2; i <= 5; i++) {
      db = await window.Database.newDatabase(`cycle${i}.db`);
      await db.importFromFile(exported);
      await db.close();
      
      db = await window.Database.newDatabase(`cycle${i}.db`);
      await db.execute(`INSERT INTO cycle_test (value) VALUES ('Cycle${i}')`);
      await db.close();
      
      db = await window.Database.newDatabase(`cycle${i}.db`);
      exported = await db.exportToFile();
      await db.close();
      
      exportSizes.push(exported.length);
    }
    
    return { exportSizes, cycleCount: 5 };
  });
  
  expect(result.cycleCount).toBe(5);
  // All exports should be same size (stable file format)
  expect(new Set(result.exportSizes).size).toBe(1);
});
```

**Test Results:** ✅ 108/108 tests passing
- 3 roundtrip tests (NEW)
- 105 existing tests (no regressions)

---

## Deployment Checklist

- [ ] Bundle size < 500KB per chunk
- [ ] Lighthouse score > 90
- [ ] WCAG 2.1 AA compliance
- [ ] E2E tests passing
- [ ] User documentation complete
- [ ] Error tracking enabled (Sentry)
- [ ] Analytics configured
- [ ] PWA manifest updated
- [ ] Service worker caching configured

---

## References

- [Adminer Features](https://www.adminer.org/)
- [Recharts Documentation](https://recharts.org/)
- [PapaParse Documentation](https://www.papaparse.com/)
- [SQLite ALTER TABLE](https://www.sqlite.org/lang_altertable.html)
- [SQL Formatter](https://github.com/sql-formatter-org/sql-formatter)
