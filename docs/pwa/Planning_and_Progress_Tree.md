# Planning and Progress Tree II
## AbsurderSQL PWA - Adminer Parity Implementation Roadmap

**Version:** 2.1  
**Last Updated:** October 31, 2025  
**Status:** Active Development  
**Target:** Complete Adminer Parity + Modern Enhancements

---

## Implementation Phases

### Phase 0: Foundation & Testing Infrastructure ✅ COMPLETE

**Goal:** Establish enterprise state management and comprehensive testing  
**Duration:** Completed October 31, 2025

#### 0.1 State Management ✅
- [x] Install Zustand for centralized state
- [x] Create `/lib/db/store.ts` with DatabaseStore
- [x] Track critical state:
  - [x] Database instance (`db`)
  - [x] Current database name (`currentDbName`)
  - [x] Loading state
  - [x] Status messages
  - [x] Table count
- [x] Update `/app/db/page.tsx` to use Zustand
- [x] Fix delete operation using `currentDbName`
- [x] Fix create operation to update `currentDbName`

#### 0.2 Roundtrip Data Integrity Tests ✅
- [x] Create `/e2e/roundtrip.spec.ts`
- [x] Test 1: All data types preserved (TEXT, INTEGER, REAL, BLOB, NULL)
  - [x] Special characters (quotes, unicode, newlines, tabs, XSS)
  - [x] Byte-for-byte match on re-export
- [x] Test 2: Schema preservation (indexes, triggers)
  - [x] Triggers remain functional after roundtrip
- [x] Test 3: Multiple cycles without corruption
  - [x] 5 export/import cycles
  - [x] Stable file sizes

#### 0.3 Test Suite Fixes ✅
- [x] Fix delete test (use UI flow instead of programmatic)
- [x] Fix schema preservation test (use existing testDb)
- [x] Add proper beforeEach hooks for state initialization
- [x] All 108 tests passing with zero regressions

**Status:** ✅ Foundation complete. All tests passing.

---

### Phase 1: Data Browser (PRIORITY 1) ⏳

**Goal:** Implement inline data editing and browsing  
**Duration:** 5-7 days

#### 1.1 Data Table Component ✅ COMPLETE
- [x] Create `/app/db/browse/page.tsx`
- [x] Implement pagination controls (100/500/1000 rows)
- [x] Add table selection dropdown
- [x] Display data in editable table
- [x] Handle NULL values display
- [x] Show loading states
- [x] Add row count indicator
- [x] E2E tests (7 tests passing)

**Test Coverage:**
- Display data browser page
- List all tables in dropdown
- Display table data with pagination
- Change page size (100/500/1000)
- Navigate between pages
- Display NULL values correctly
- Display row count

#### 1.2 Inline Editing ✅ COMPLETE
- [x] Double-click cell to edit
- [x] Input validation by data type
  - [x] TEXT: text input
  - [x] INTEGER: number input
  - [x] REAL: decimal input with step="any"
  - [ ] BLOB: file upload/preview (deferred)
- [x] Save on Enter, cancel on Escape
- [x] Optimistic UI updates
- [x] Error handling (keeps edit mode on error)
- [x] Visual indicators (editing state with CSS class)
- [x] NULL value editing support
- [x] E2E tests (8 tests passing)

**Test Coverage:**
- Enter edit mode on double-click
- Save TEXT edit on Enter key
- Cancel edit on Escape key
- Validate INTEGER input (type="number")
- Validate REAL decimal input (type="number" step="any")
- Show visual feedback for editing state
- Support NULL value editing
- Handle multiline TEXT with textarea (basic)

#### 1.3 Row Operations
- [ ] Add new row button
  - [ ] Auto-populate DEFAULT values
  - [ ] Required field validation
  - [ ] Insert into database
- [ ] Delete row button (with confirmation)
- [ ] Bulk delete with checkboxes
  - [ ] Select all/none checkboxes
  - [ ] Bulk delete confirmation dialog
  - [ ] DELETE query generation

#### 1.4 Filtering & Sorting
- [ ] Column header click to sort (ASC/DESC toggle)
- [ ] Filter panel per column
  - [ ] Text contains/equals/starts with
  - [ ] Number >, <, =, ≠
  - [ ] NULL/NOT NULL filters
  - [ ] Date range picker
- [ ] Multiple filters (AND logic)
- [ ] Clear all filters button
- [ ] WHERE clause preview

#### 1.5 Foreign Key Navigation
- [ ] Detect FK relationships
- [ ] Show clickable FK values
- [ ] Navigate to related table on click
- [ ] Breadcrumb navigation
- [ ] Back button

#### 1.6 BLOB Handling
- [ ] Preview images in-table
- [ ] Download button for files
- [ ] Upload new files
- [ ] Display file size/type
- [ ] Drag-and-drop upload

**Acceptance Criteria:**
- [ ] Can browse any table with pagination
- [ ] Can edit cells inline and save
- [ ] Can add/delete rows
- [ ] Can filter and sort data
- [ ] FK navigation works
- [ ] BLOB upload/download works

---

### Phase 2: Import/Export Formats (PRIORITY 2) ⏳

**Goal:** CSV, JSON, SQL dump support  
**Duration:** 3-4 days

#### 2.1 CSV Import
- [ ] Create `/app/db/import-csv/page.tsx`
- [ ] File upload with drag-and-drop
- [ ] CSV parsing (PapaParse library)
- [ ] Column mapping interface
  - [ ] Auto-detect column names from first row
  - [ ] Map CSV columns to table columns
  - [ ] Data type conversion preview
- [ ] Import options
  - [ ] Skip first row (headers)
  - [ ] Delimiter selection (comma, tab, semicolon)
  - [ ] Quote character
  - [ ] Encoding (UTF-8, Latin1)
- [ ] Preview first 10 rows before import
- [ ] Progress bar for large imports
- [ ] Error handling (show failed rows)

#### 2.2 CSV Export
- [ ] Add to query results page
- [ ] Export options dialog
  - [ ] Include headers checkbox
  - [ ] Delimiter selection
  - [ ] Quote all fields checkbox
  - [ ] Line ending (LF, CRLF)
- [ ] Generate CSV from query results
- [ ] Trigger download
- [ ] Handle NULL values (empty string or "NULL")

#### 2.3 JSON Export
- [ ] Export as array of objects
- [ ] Pretty print option
- [ ] Nested objects for JOINs (optional)
- [ ] Date format options (ISO8601, Unix timestamp)

#### 2.4 SQL Dump Export
- [ ] Generate CREATE TABLE statements
- [ ] Generate INSERT statements
- [ ] Options:
  - [ ] DROP TABLE IF EXISTS
  - [ ] Include indexes
  - [ ] Include triggers
  - [ ] Include views
- [ ] Batch INSERTs (100 rows per statement)
- [ ] Add transaction wrapper

#### 2.5 Partial Export
- [ ] Export filtered data only
- [ ] Export selected rows (checkboxes)
- [ ] Export specific columns
- [ ] Export to all formats (CSV, JSON, SQL)

**Acceptance Criteria:**
- [ ] CSV import with column mapping works
- [ ] CSV export with options works
- [ ] JSON export generates valid JSON
- [ ] SQL dump can be re-imported
- [ ] Partial export exports correct data

---

### Phase 3: Table Structure Editor (PRIORITY 3) ⏳

**Goal:** Visual table designer  
**Duration:** 4-5 days

#### 3.1 Table Designer UI
- [ ] Create `/app/db/designer/page.tsx`
- [ ] Table selection dropdown
- [ ] Visual column list
  - [ ] Column name
  - [ ] Data type dropdown
  - [ ] NOT NULL checkbox
  - [ ] UNIQUE checkbox
  - [ ] PRIMARY KEY indicator
  - [ ] DEFAULT value input
- [ ] Add column button
- [ ] Remove column button
- [ ] Reorder columns (drag-and-drop)

#### 3.2 Column Operations
- [ ] Add new column
  - [ ] ALTER TABLE ADD COLUMN
  - [ ] Set default value for existing rows
- [ ] Modify column
  - [ ] Rename column
  - [ ] Change type (with confirmation)
  - [ ] Add/remove constraints
- [ ] Delete column
  - [ ] Drop confirmation dialog
  - [ ] ALTER TABLE DROP COLUMN

#### 3.3 Primary Key Management
- [ ] Set primary key (single column)
- [ ] Composite primary key support
- [ ] Remove primary key
- [ ] Auto-increment support

#### 3.4 Index Management
- [ ] List existing indexes
- [ ] Create new index
  - [ ] Single or multi-column
  - [ ] UNIQUE index checkbox
  - [ ] Index name
- [ ] Drop index
- [ ] Index usage statistics (optional)

#### 3.5 Foreign Key Management
- [ ] List FK constraints
- [ ] Create FK
  - [ ] Select referenced table
  - [ ] Select referenced column
  - [ ] ON DELETE action
  - [ ] ON UPDATE action
- [ ] Drop FK
- [ ] Validate FK integrity

#### 3.6 Table Operations
- [ ] Rename table
- [ ] Copy table structure
  - [ ] With or without data
  - [ ] New table name input
- [ ] Drop table
  - [ ] Confirmation dialog
  - [ ] Show dependent objects
- [ ] VACUUM table

**Acceptance Criteria:**
- [ ] Can add/remove/modify columns
- [ ] Can manage primary keys
- [ ] Can create/drop indexes
- [ ] Can manage foreign keys
- [ ] Can perform table operations

---

### Phase 4: Advanced Schema Management ⏳

**Goal:** Views, triggers, ER diagrams  
**Duration:** 4-5 days

#### 4.1 Views Management
- [ ] Create `/app/db/views/page.tsx`
- [ ] List all views
- [ ] Create view
  - [ ] View name input
  - [ ] SQL editor for SELECT query
  - [ ] Query validation
- [ ] Edit view (recreate)
- [ ] Drop view
- [ ] Query view data

#### 4.2 Triggers Management
- [ ] Create `/app/db/triggers/page.tsx`
- [ ] List all triggers
- [ ] Create trigger
  - [ ] Trigger name
  - [ ] BEFORE/AFTER
  - [ ] INSERT/UPDATE/DELETE
  - [ ] Table selection
  - [ ] SQL editor for trigger body
- [ ] Edit trigger (recreate)
- [ ] Drop trigger
- [ ] Test trigger (optional)

#### 4.3 ER Diagram
- [ ] Create `/app/db/diagram/page.tsx`
- [ ] Visualize tables as nodes
- [ ] Show FK relationships as edges
- [ ] Interactive diagram
  - [ ] Zoom in/out
  - [ ] Pan
  - [ ] Click table to view details
- [ ] Export diagram as PNG/SVG
- [ ] Auto-layout algorithm (force-directed or hierarchical)

**Acceptance Criteria:**
- [ ] Can create/edit/delete views
- [ ] Can create/edit/delete triggers
- [ ] ER diagram displays correctly
- [ ] Diagram is interactive

---

### Phase 5: Query Management & Bookmarks ⏳

**Goal:** Save and organize queries  
**Duration:** 3-4 days

#### 5.1 Query Bookmarks
- [ ] Add "Save Query" button to query editor
- [ ] Save dialog
  - [ ] Query name input
  - [ ] Query description (optional)
  - [ ] Tags (optional)
  - [ ] Folder selection
- [ ] Store in IndexedDB
  - [ ] Schema: id, name, description, sql, created_at, updated_at, tags, folder
- [ ] Load saved query
  - [ ] Sidebar with query list
  - [ ] Search queries by name/description
  - [ ] Filter by tags
- [ ] Edit saved query
- [ ] Delete saved query
- [ ] Export/import query library (JSON)

#### 5.2 Query Folders
- [ ] Create folders
- [ ] Organize queries into folders
- [ ] Nested folders (optional)
- [ ] Rename/delete folders

#### 5.3 EXPLAIN Query Plan
- [ ] Add "Explain" button to query editor
- [ ] Run EXPLAIN QUERY PLAN
- [ ] Visualize query plan
  - [ ] Tree structure
  - [ ] Table scans highlighted
  - [ ] Index usage shown
  - [ ] Cost estimates (if available)
- [ ] Optimization hints

#### 5.4 Query Performance
- [ ] Measure execution time
- [ ] Track query statistics
  - [ ] Execution count
  - [ ] Average time
  - [ ] Min/max time
- [ ] Slow query log (> 1s)
- [ ] Performance trends over time

**Acceptance Criteria:**
- [ ] Can save queries with names/descriptions
- [ ] Can organize queries in folders
- [ ] Can export/import query library
- [ ] EXPLAIN plan visualization works
- [ ] Query performance metrics accurate

---

### Phase 6: Search & Discovery ⏳

**Goal:** Find data anywhere in database  
**Duration:** 3-4 days

#### 6.1 Full-Text Search
- [ ] Create `/app/db/search/page.tsx`
- [ ] Search input with autocomplete
- [ ] Search scope selection
  - [ ] All tables
  - [ ] Selected tables
  - [ ] Selected columns
- [ ] Search options
  - [ ] Case-sensitive
  - [ ] Exact match
  - [ ] Regex pattern
- [ ] Display results
  - [ ] Table name
  - [ ] Column name
  - [ ] Row ID
  - [ ] Matched value (highlighted)
  - [ ] Context (surrounding data)
- [ ] Click result to view row
- [ ] Export search results

#### 6.2 Column Finder
- [ ] Search columns by name
- [ ] Show table + column type
- [ ] Click to view table schema

#### 6.3 Data Grep
- [ ] Search for value across all columns
- [ ] Support multiple data types
  - [ ] Text (substring match)
  - [ ] Numbers (exact/range)
  - [ ] Dates (range)
- [ ] Limit results (performance)
- [ ] Background search (Web Worker)

**Acceptance Criteria:**
- [ ] Can search across all tables
- [ ] Can find columns by name
- [ ] Data grep returns correct results
- [ ] Search is performant (< 1s for small DBs)

---

### Phase 7: Data Visualization ⏳

**Goal:** Charts and dashboards  
**Duration:** 5-6 days

#### 7.1 Chart Builder
- [ ] Create `/app/db/charts/page.tsx`
- [ ] Query input (reuse query editor)
- [ ] Chart type selection
  - [ ] Line chart
  - [ ] Bar chart
  - [ ] Pie chart
  - [ ] Scatter plot
- [ ] Data mapping
  - [ ] X-axis column
  - [ ] Y-axis column(s)
  - [ ] Group by column
  - [ ] Color column
- [ ] Chart options
  - [ ] Title
  - [ ] Axis labels
  - [ ] Legend position
  - [ ] Colors
- [ ] Live preview
- [ ] Save chart configuration

#### 7.2 Chart Library
- [ ] Integrate Recharts or Chart.js
- [ ] Responsive charts
- [ ] Export charts as PNG/SVG
- [ ] Download chart data as CSV

#### 7.3 Dashboard Builder
- [ ] Create `/app/db/dashboard/page.tsx`
- [ ] Add multiple charts
- [ ] Grid layout (drag-and-drop)
- [ ] Auto-refresh option
- [ ] Save dashboard layout
- [ ] Share dashboard (URL)

**Acceptance Criteria:**
- [ ] Can create charts from queries
- [ ] Multiple chart types supported
- [ ] Charts are interactive and responsive
- [ ] Can export charts
- [ ] Dashboard with multiple charts works

---

### Phase 8: Developer Tools ⏳

**Goal:** Query formatter, schema diff, migration generator  
**Duration:** 4-5 days

#### 8.1 Query Formatter
- [ ] Integrate sql-formatter library
- [ ] Format button in query editor
- [ ] Formatting options
  - [ ] Keyword case (UPPER, lower)
  - [ ] Indentation (2/4 spaces, tabs)
  - [ ] Line length limit
- [ ] Format on paste (optional)

#### 8.2 Schema Diff
- [ ] Create `/app/db/diff/page.tsx`
- [ ] Compare two databases
  - [ ] Upload second .db file
  - [ ] Or select from existing databases
- [ ] Show differences
  - [ ] Tables added/removed
  - [ ] Columns added/removed/modified
  - [ ] Indexes added/removed
  - [ ] Triggers added/removed
- [ ] Color-coded diff view
  - [ ] Green: added
  - [ ] Red: removed
  - [ ] Yellow: modified

#### 8.3 Migration Generator
- [ ] Generate SQL migration script
- [ ] ALTER TABLE statements
- [ ] CREATE/DROP statements
- [ ] Maintain data integrity
- [ ] Rollback script (reverse migration)
- [ ] Download migration files

#### 8.4 Index Analyzer
- [ ] Detect missing indexes
  - [ ] Scan queries for WHERE clauses
  - [ ] Check if indexed
  - [ ] Suggest indexes
- [ ] Index usage statistics
  - [ ] Times used
  - [ ] Last used
  - [ ] Unused indexes
- [ ] Recommend index removal

**Acceptance Criteria:**
- [ ] Query formatter produces readable SQL
- [ ] Schema diff shows all differences
- [ ] Migration generator creates valid SQL
- [ ] Index analyzer provides useful suggestions

---

### Phase 9: Performance Tools ⏳

**Goal:** Optimize database performance  
**Duration:** 3-4 days

#### 9.1 Storage Analysis
- [ ] Create `/app/db/storage/page.tsx`
- [ ] Display database size
- [ ] Table sizes (rows + disk space)
- [ ] Index sizes
- [ ] Fragmentation metrics
- [ ] VACUUM recommendations

#### 9.2 Query Optimizer
- [ ] Analyze query performance
- [ ] Suggest index creation
- [ ] Rewrite slow queries
  - [ ] Suggest JOIN order
  - [ ] Suggest subquery elimination
- [ ] Cache query plans

#### 9.3 Slow Query Log
- [ ] Track queries > 1s
- [ ] Display in performance dashboard
- [ ] Group by query pattern
- [ ] Suggest optimizations

**Acceptance Criteria:**
- [ ] Storage analysis accurate
- [ ] Optimizer provides useful hints
- [ ] Slow query log captures long-running queries

---

## Testing Strategy

### Unit Tests
- [ ] Data browser component tests
- [ ] CSV parser tests
- [ ] Table designer tests
- [ ] Chart builder tests
- [ ] Query formatter tests
- [ ] Schema diff tests

### Integration Tests
- [ ] Import/export flows
- [ ] Data editing flow
- [ ] Foreign key navigation
- [ ] Chart creation flow

### E2E Tests
- [ ] Complete data browsing workflow
- [ ] CSV import and export
- [ ] Table structure modifications
- [ ] Query bookmarking
- [ ] Dashboard creation

---

## Deployment Milestones

### v1.0 Release (Adminer Parity)
- [ ] Data browser ✅
- [ ] CSV import/export ✅
- [ ] Table structure editor ✅
- [ ] Query bookmarks ✅
- [ ] Lighthouse score > 90
- [ ] E2E tests passing
- [ ] Documentation complete

### v2.0 Release (Modern Enhancements)
- [ ] Full-text search ✅
- [ ] Data visualization ✅
- [ ] Schema diff tool ✅
- [ ] Query formatter ✅
- [ ] User feedback collected

### v3.0 Release (Performance & Advanced)
- [ ] Index analyzer ✅
- [ ] Query optimizer ✅
- [ ] Dashboard builder ✅
- [ ] Migration generator ✅

---

## Dependencies

**Libraries to Install:**
```bash
npm install papaparse          # CSV parsing
npm install sql-formatter      # SQL formatting
npm install recharts          # Charts
npm install react-grid-layout # Dashboard layout
npm install d3                # ER diagrams (optional)
```

**Dev Dependencies:**
```bash
npm install -D @types/papaparse
npm install -D @types/d3
```

---

## Success Metrics

### Feature Adoption
- **Goal:** 70% of users use data browser
- **Goal:** 50% of users import CSV
- **Goal:** 40% of users save queries
- **Goal:** 30% of users create charts

### Performance
- **Goal:** Data browser load < 200ms
- **Goal:** CSV import 10K rows < 2s
- **Goal:** Chart render < 500ms

### Quality
- **Goal:** Zero critical bugs in production
- **Goal:** User rating > 4.5/5
- **Goal:** Test coverage > 85%

---

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Data Browser | 7 days | None |
| Phase 2: Import/Export | 4 days | PapaParse |
| Phase 3: Table Editor | 5 days | Phase 1 |
| Phase 4: Schema Mgmt | 5 days | D3 (optional) |
| Phase 5: Query Mgmt | 4 days | Phase 1 |
| Phase 6: Search | 4 days | Phase 1 |
| Phase 7: Visualization | 6 days | Recharts |
| Phase 8: Dev Tools | 5 days | sql-formatter |
| Phase 9: Performance | 4 days | Phase 3, 5 |
| **Total** | **44 days** | |

**Target Completion:** 9 weeks from start

---

## Notes

- Prioritize Phases 1-3 for v1.0 (Adminer parity)
- Phases 6-9 can be done in parallel with different developers
- User testing after Phase 3 completion
- Beta release after Phase 5
