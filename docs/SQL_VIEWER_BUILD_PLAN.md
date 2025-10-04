# DataSync SQL Viewer - Build Plan

**Project**: Unified SQL Editor/Viewer for DataSync  
**Technology**: Tauri 2.0 + React + TypeScript + CodeMirror  
**Purpose**: Query both Native (fs_persist) and WASM (IndexedDB) modes side-by-side

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                 Tauri 2.0 Desktop App                       │
├─────────────────────────────────────────────────────────────┤
│  React Frontend                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  SQL Editor (CodeMirror 6)                            │  │
│  │  - SQL syntax highlighting                            │  │
│  │  - Auto-complete                                      │  │
│  │  - Multi-query support                                │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Native Mode  │  │  WASM Mode   │  │  Comparison      │  │
│  │ (fs_persist) │  │ (IndexedDB)  │  │  View            │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│  Results Table (@tanstack/react-table)                      │
│  - Sortable columns • Exportable • Pagination               │
├─────────────────────────────────────────────────────────────┤
│  Tauri 2.0 Backend (Rust)                                   │
│  - query_native(sql) → QueryResult                          │
│  - query_wasm(sql) → QueryResult                            │
│  - list_databases() → Vec<DbInfo>                           │
│  - get_schema(db) → SchemaInfo                              │
│  Uses: sqlite_indexeddb_rs::database::SqliteIndexedDB      │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Project Setup

### 1.1 Initialize Tauri 2.0 Project
- [ ] Create new Tauri 2.0 app with React + TypeScript template
  ```bash
  npm create tauri-app@latest datasync-viewer
  # Select: React, TypeScript, npm
  cd datasync-viewer
  ```
- [ ] Verify Tauri CLI version is 2.x
  ```bash
  npm run tauri --version
  ```
- [ ] Test initial app runs successfully
  ```bash
  npm run tauri dev
  ```

### 1.2 Install Frontend Dependencies
- [ ] Install CodeMirror 6 and SQL language support
  ```bash
  npm install @uiw/react-codemirror @codemirror/lang-sql
  ```
- [ ] Install UI framework and utilities
  ```bash
  npm install @tanstack/react-table lucide-react clsx tailwind-merge
  ```
- [ ] Install shadcn/ui (for components)
  ```bash
  npx shadcn-ui@latest init
  # Select: TypeScript, tailwind.config.ts, CSS variables
  ```
- [ ] Install shadcn/ui components we'll need
  ```bash
  npx shadcn-ui@latest add button
  npx shadcn-ui@latest add card
  npx shadcn-ui@latest add tabs
  npx shadcn-ui@latest add table
  npx shadcn-ui@latest add select
  npx shadcn-ui@latest add separator
  npx shadcn-ui@latest add scroll-area
  ```

### 1.3 Configure Tauri Backend Dependencies
- [ ] Add DataSync dependency to `src-tauri/Cargo.toml`
  ```toml
  [dependencies]
  tauri = { version = "2.0", features = [] }
  serde = { version = "1.0", features = ["derive"] }
  serde_json = "1.0"
  tokio = { version = "1.0", features = ["full"] }
  sqlite-indexeddb-rs = { path = "../../", features = ["fs_persist"] }
  ```
- [ ] Run `cargo check` in `src-tauri/` to verify dependencies resolve
- [ ] Configure Tauri permissions in `src-tauri/capabilities/default.json`
  - [ ] Add filesystem read/write permissions
  - [ ] Add HTTP client permissions (for WASM bridge if needed)

---

## Phase 2: Basic UI Layout

### 2.1 Create Project Structure
- [ ] Create component directories
  ```bash
  mkdir -p src/components/editor
  mkdir -p src/components/results
  mkdir -p src/components/database
  mkdir -p src/components/layout
  mkdir -p src/hooks
  mkdir -p src/types
  mkdir -p src/lib
  ```

### 2.2 Define TypeScript Types
- [ ] Create `src/types/database.ts` with shared types
  ```typescript
  export interface QueryResult {
    columns: string[];
    rows: Row[];
    affected_rows: number;
  }
  
  export interface Row {
    values: ColumnValue[];
  }
  
  export interface ColumnValue {
    value: any;
    // Match your Rust ColumnValue enum
  }
  
  export type QueryMode = 'native' | 'wasm';
  
  export interface DbInfo {
    name: string;
    path: string;
    size: number;
  }
  ```

### 2.3 Build Main Layout Component
- [ ] Create `src/components/layout/MainLayout.tsx`
  - [ ] Header with app title and mode selector
  - [ ] Sidebar for database explorer
  - [ ] Main content area for editor and results
- [ ] Create `src/components/layout/SplitPane.tsx`
  - [ ] Resizable split pane for side-by-side comparison
  - [ ] Support horizontal and vertical splits
- [ ] Update `src/App.tsx` to use MainLayout

### 2.4 Style Configuration
- [ ] Configure dark theme in `tailwind.config.ts`
- [ ] Add custom colors matching DataSync branding
- [ ] Create `src/styles/codemirror-theme.ts` for editor theming

---

## Phase 3: SQL Editor Component

### 3.1 Build CodeMirror Editor
- [ ] Create `src/components/editor/SqlEditor.tsx`
  - [ ] Integrate `@uiw/react-codemirror`
  - [ ] Add SQL language support from `@codemirror/lang-sql`
  - [ ] Configure dark theme
  - [ ] Add line numbers and folding
- [ ] Create `src/components/editor/EditorToolbar.tsx`
  - [ ] Execute button (Cmd/Ctrl + Enter)
  - [ ] Clear button
  - [ ] Format SQL button (optional)
  - [ ] Query mode selector (Native vs WASM)

### 3.2 Editor Features
- [ ] Add keyboard shortcuts
  - [ ] Cmd/Ctrl + Enter: Execute query
  - [ ] Cmd/Ctrl + K: Clear editor
- [ ] Add query history state management
- [ ] Add loading state indicator during query execution
- [ ] Add error display for syntax/execution errors

---

## Phase 4: Results Display Component

### 4.1 Build Results Table
- [ ] Create `src/components/results/ResultsTable.tsx`
  - [ ] Integrate `@tanstack/react-table`
  - [ ] Display columns and rows from QueryResult
  - [ ] Add column sorting
  - [ ] Add pagination for large result sets
- [ ] Create `src/components/results/ResultsHeader.tsx`
  - [ ] Show row count and execution time
  - [ ] Export buttons (CSV, JSON, SQL)
  - [ ] Copy to clipboard button

### 4.2 Empty and Error States
- [ ] Create `src/components/results/EmptyState.tsx`
  - [ ] Show when no query has been run
  - [ ] Show helpful tips or sample queries
- [ ] Create `src/components/results/ErrorState.tsx`
  - [ ] Display SQL errors clearly
  - [ ] Show error position if available

### 4.3 Data Formatting
- [ ] Create `src/lib/formatters.ts`
  - [ ] Format NULL values distinctly
  - [ ] Format large numbers with commas
  - [ ] Format timestamps in readable format
  - [ ] Truncate long text with expand option

---

## Phase 5: Native Query Backend (Tauri Commands)

### 5.1 Core Query Command
- [ ] Create `src-tauri/src/commands/native_queries.rs`
  - [ ] Implement `query_native(sql: String, db_name: String)` command
  - [ ] Use SqliteIndexedDB with fs_persist feature
  - [ ] Handle errors and convert to serializable format
  - [ ] Add connection pooling for performance
- [ ] Register command in `src-tauri/src/main.rs`

### 5.2 Database Management Commands
- [ ] Implement `list_native_databases()` command
  - [ ] Scan DATASYNC_FS_BASE directory
  - [ ] Return list of available databases
  - [ ] Include metadata (size, last modified)
- [ ] Implement `get_database_schema(db_name: String)` command
  - [ ] Query `sqlite_master` table
  - [ ] Return table definitions, columns, indexes

### 5.3 Schema Inspection Commands
- [ ] Implement `get_tables(db_name: String)` command
- [ ] Implement `get_table_info(db_name: String, table_name: String)` command
  - [ ] Column names and types
  - [ ] Primary keys and indexes
- [ ] Implement `get_table_row_count(db_name: String, table_name: String)` command

---

## Phase 6: Frontend-Backend Integration

### 6.1 Create Tauri Invoke Hooks
- [ ] Create `src/hooks/useNativeQuery.ts`
  ```typescript
  export function useNativeQuery() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<QueryResult | null>(null);
    
    const execute = async (sql: string, dbName: string) => {
      // Call Tauri command
    };
    
    return { execute, loading, error, result };
  }
  ```
- [ ] Create `src/hooks/useDatabaseList.ts`
- [ ] Create `src/hooks/useSchema.ts`

### 6.2 Connect Editor to Backend
- [ ] Wire up SqlEditor execute button to useNativeQuery
- [ ] Handle loading states in UI
- [ ] Display results in ResultsTable
- [ ] Show errors in ErrorState component

### 6.3 Test Native Mode End-to-End
- [ ] Test creating a new database
- [ ] Test executing CREATE TABLE
- [ ] Test INSERT statements
- [ ] Test SELECT queries
- [ ] Test UPDATE and DELETE
- [ ] Verify data persists to filesystem

---

## Phase 7: Database Explorer Sidebar

### 7.1 Build Database Tree View
- [ ] Create `src/components/database/DatabaseExplorer.tsx`
  - [ ] List all databases
  - [ ] Expandable tree for each database
  - [ ] Show tables under each database
  - [ ] Show column count and row count
- [ ] Create `src/components/database/DatabaseItem.tsx`
  - [ ] Database icon and name
  - [ ] Click to select database
  - [ ] Right-click context menu (refresh, delete)

### 7.2 Table Inspector
- [ ] Create `src/components/database/TableItem.tsx`
  - [ ] Table icon and name
  - [ ] Click to generate SELECT query
  - [ ] Show row count badge
- [ ] Add double-click to insert "SELECT * FROM {table}" in editor

### 7.3 Query Templates
- [ ] Create `src/components/database/QueryTemplates.tsx`
  - [ ] List Tables template
  - [ ] Table Schema template
  - [ ] Sample Data template
  - [ ] Row Count template
- [ ] Add "Use Template" button that populates editor

---

## Phase 8: WASM Integration

### 8.1 Choose WASM Integration Strategy
- [ ] Evaluate Option A: Embedded WebView (Tauri multi-webview)
- [ ] Evaluate Option B: HTTP Bridge (local server)
- [ ] Document chosen approach and reasoning

### 8.2 Implement WASM Query Backend
**If Option A (Embedded WebView):**
- [ ] Create separate webview in Tauri
- [ ] Load WASM module in webview
- [ ] Implement postMessage communication
- [ ] Create `src-tauri/src/commands/wasm_bridge.rs`

**If Option B (HTTP Bridge):**
- [ ] Create `src-tauri/src/wasm_server.rs`
- [ ] Spawn HTTP server serving WASM app
- [ ] Implement REST API for queries
- [ ] Handle server lifecycle (start/stop)

### 8.3 WASM Query Frontend
- [ ] Create `src/hooks/useWasmQuery.ts`
- [ ] Mirror useNativeQuery interface for consistency
- [ ] Handle WASM-specific loading/error states

### 8.4 Test WASM Mode End-to-End
- [ ] Test WASM database creation
- [ ] Test queries execute correctly
- [ ] Test IndexedDB persistence
- [ ] Verify data persists across app restarts

---

## Phase 9: Comparison View

### 9.1 Build Split-Pane Comparison UI
- [ ] Create `src/components/comparison/ComparisonView.tsx`
  - [ ] Left pane: Native results
  - [ ] Right pane: WASM results
  - [ ] Synchronized scrolling
  - [ ] Resizable splitter
- [ ] Add "Compare Mode" toggle in toolbar

### 9.2 Dual Query Execution
- [ ] Implement parallel query execution
  ```typescript
  const executeComparison = async (sql: string, dbName: string) => {
    const [nativeResult, wasmResult] = await Promise.all([
      queryNative(sql, dbName),
      queryWasm(sql, dbName)
    ]);
    return { nativeResult, wasmResult };
  };
  ```
- [ ] Show execution time for each mode
- [ ] Highlight performance differences

### 9.3 Result Diffing
- [ ] Create `src/lib/resultDiffer.ts`
  - [ ] Compare row counts
  - [ ] Compare column names
  - [ ] Compare data values
  - [ ] Highlight differences
- [ ] Create `src/components/comparison/DiffView.tsx`
  - [ ] Show rows that differ
  - [ ] Color-code: green (match), red (differ), yellow (missing)

---

## Phase 10: Advanced Features

### 10.1 Query History
- [ ] Create `src/components/history/QueryHistory.tsx`
  - [ ] List recently executed queries
  - [ ] Show execution time and row count
  - [ ] Click to re-run query
- [ ] Store history in localStorage
- [ ] Add clear history button

### 10.2 Export Functionality
- [ ] Implement CSV export
  ```typescript
  const exportToCSV = (result: QueryResult) => {
    // Convert to CSV and trigger download
  };
  ```
- [ ] Implement JSON export
- [ ] Implement SQL INSERT statements export
- [ ] Add "Copy to Clipboard" for all formats

### 10.3 Block Storage Inspector
- [ ] Create `src/components/inspector/BlockInspector.tsx`
  - [ ] Show allocated blocks
  - [ ] Show block metadata (version, checksum)
  - [ ] Visualize block usage
- [ ] Add Tauri command `get_block_info(db_name: String)`
- [ ] Display block cache statistics

### 10.4 Schema Comparison Tool
- [ ] Create `src/components/schema/SchemaCompare.tsx`
  - [ ] Compare Native vs WASM schemas
  - [ ] Show table differences
  - [ ] Show column differences
  - [ ] Generate ALTER TABLE statements for sync

---

## Phase 11: Polish and Testing

### 11.1 Error Handling
- [ ] Add global error boundary
- [ ] Improve error messages throughout
- [ ] Add retry logic for failed queries
- [ ] Add error logging/reporting

### 11.2 Performance Optimization
- [ ] Implement virtual scrolling for large result sets
- [ ] Add result streaming for very large queries
- [ ] Optimize re-renders with React.memo
- [ ] Add query execution timeout

### 11.3 Keyboard Shortcuts
- [ ] Document all keyboard shortcuts
- [ ] Add shortcuts panel (press `?` to view)
- [ ] Add customizable shortcuts

### 11.4 Accessibility
- [ ] Ensure keyboard navigation works everywhere
- [ ] Add ARIA labels to interactive elements
- [ ] Test with screen readers
- [ ] Add high-contrast mode option

### 11.5 Testing
- [ ] Write unit tests for utility functions
- [ ] Write integration tests for Tauri commands
- [ ] Write E2E tests for critical workflows
- [ ] Test on macOS, Windows, Linux

---

## Phase 12: Documentation and Release

### 12.1 User Documentation
- [ ] Create user guide in `docs/SQL_VIEWER_GUIDE.md`
- [ ] Add screenshots and GIFs
- [ ] Document keyboard shortcuts
- [ ] Create video tutorial (optional)

### 12.2 Developer Documentation
- [ ] Document architecture decisions
- [ ] Create contribution guide
- [ ] Document build process
- [ ] Add API documentation

### 12.3 Build and Package
- [ ] Configure Tauri icons and metadata
- [ ] Test production build
  ```bash
  npm run tauri build
  ```
- [ ] Create installers for each platform
- [ ] Test installers on clean systems

### 12.4 Release
- [ ] Tag release in git
- [ ] Create GitHub release with binaries
- [ ] Update README with download links
- [ ] Announce release

---

## File Structure (Final)

```
datasync-viewer/
├── src/
│   ├── components/
│   │   ├── editor/
│   │   │   ├── SqlEditor.tsx
│   │   │   └── EditorToolbar.tsx
│   │   ├── results/
│   │   │   ├── ResultsTable.tsx
│   │   │   ├── ResultsHeader.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── ErrorState.tsx
│   │   ├── database/
│   │   │   ├── DatabaseExplorer.tsx
│   │   │   ├── DatabaseItem.tsx
│   │   │   ├── TableItem.tsx
│   │   │   └── QueryTemplates.tsx
│   │   ├── comparison/
│   │   │   ├── ComparisonView.tsx
│   │   │   └── DiffView.tsx
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx
│   │   │   └── SplitPane.tsx
│   │   ├── history/
│   │   │   └── QueryHistory.tsx
│   │   ├── inspector/
│   │   │   └── BlockInspector.tsx
│   │   └── schema/
│   │       └── SchemaCompare.tsx
│   ├── hooks/
│   │   ├── useNativeQuery.ts
│   │   ├── useWasmQuery.ts
│   │   ├── useDatabaseList.ts
│   │   └── useSchema.ts
│   ├── lib/
│   │   ├── formatters.ts
│   │   ├── resultDiffer.ts
│   │   └── exporters.ts
│   ├── types/
│   │   └── database.ts
│   ├── styles/
│   │   └── codemirror-theme.ts
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/
│   ├── src/
│   │   ├── commands/
│   │   │   ├── native_queries.rs
│   │   │   └── wasm_bridge.rs
│   │   ├── wasm_server.rs (if using HTTP bridge)
│   │   └── main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── docs/
│   └── SQL_VIEWER_GUIDE.md
└── package.json
```

---

## Success Criteria

The project is complete when:
- ✅ Users can query Native (fs_persist) databases via GUI
- ✅ Users can query WASM (IndexedDB) databases via GUI  
- ✅ Side-by-side comparison mode works correctly
- ✅ Database explorer shows all tables and schemas
- ✅ Results can be exported to CSV, JSON, SQL
- ✅ Query history is preserved
- ✅ App is packaged for macOS, Windows, Linux
- ✅ Documentation is complete and clear

---

## Notes

- Use Tauri 2.0 features and best practices throughout
- Follow React best practices (hooks, functional components)
- Use TypeScript strictly (no `any` types)
- Keep components small and focused
- Test on all target platforms regularly
- Document as you go

**Start Date**: _________________  
**Target Completion**: _________________  
**Actual Completion**: _________________
