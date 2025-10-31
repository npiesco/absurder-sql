# Product Requirements Document (PRD) II
## AbsurderSQL PWA - Modern Adminer Replacement

**Version:** 3.1  
**Last Updated:** October 31, 2025  
**Status:** Active Development  
**Target:** Next.js 15 + React 19 + AbsurderSQL WASM

**Product Vision:** Complete Adminer parity + modern enhancements - zero server setup, drag-and-drop .db files, instant querying, inline editing, data visualization

---

## Foundation Requirements (✅ COMPLETE)

### State Management
- **FR-F1.1:** ✅ Centralized state management using Zustand
- **FR-F1.2:** ✅ Track database instance globally
- **FR-F1.3:** ✅ Track current database name for operations
- **FR-F1.4:** ✅ Unified loading/status messaging
- **FR-F1.5:** ✅ Prevent state conflicts between UI and programmatic operations

### Data Integrity Testing
- **FR-F2.1:** ✅ Roundtrip test: All SQL data types preserved (TEXT, INTEGER, REAL, BLOB, NULL)
- **FR-F2.2:** ✅ Roundtrip test: Special characters preserved (quotes, unicode, newlines, XSS, tabs)
- **FR-F2.3:** ✅ Roundtrip test: Byte-for-byte export match
- **FR-F2.4:** ✅ Roundtrip test: Schema preserved (indexes, triggers)  
- **FR-F2.5:** ✅ Roundtrip test: Triggers remain functional after roundtrip
- **FR-F2.6:** ✅ Roundtrip test: Multiple cycles without corruption (5 cycles)
- **FR-F2.7:** ✅ Zero test regressions (108/108 passing)

---

## Adminer Parity Requirements

### Core Adminer Features (MUST HAVE)

#### 1. Data Browser & Editor
- **FR-AB1.1:** Browse table data with pagination (100/500/1000 rows per page)
- **FR-AB1.2:** Inline cell editing (double-click to edit)
- **FR-AB1.3:** Add new rows inline
- **FR-AB1.4:** Delete rows (single + bulk delete with checkboxes)
- **FR-AB1.5:** Filter columns (WHERE clause builder)
- **FR-AB1.6:** Sort by column (ASC/DESC toggle)
- **FR-AB1.7:** NULL value handling and display
- **FR-AB1.8:** BLOB preview and download
- **FR-AB1.9:** Foreign key navigation (click FK to jump to related table)

#### 2. Import/Export Formats
- **FR-AB2.1:** SQLite file import/export (✅ DONE)
- **FR-AB2.2:** CSV import with column mapping
- **FR-AB2.3:** CSV export with delimiter options
- **FR-AB2.4:** JSON export (array of objects)
- **FR-AB2.5:** SQL dump export (CREATE + INSERT statements)
- **FR-AB2.6:** Partial export (filtered data only)
- **FR-AB2.7:** Parquet format support (optional)

#### 3. Table Structure Editor
- **FR-AB3.1:** Visual table designer
- **FR-AB3.2:** Add/remove columns
- **FR-AB3.3:** Change column data types
- **FR-AB3.4:** Modify column constraints (NOT NULL, UNIQUE, DEFAULT)
- **FR-AB3.5:** Set primary keys
- **FR-AB3.6:** Add/remove indexes
- **FR-AB3.7:** Rename tables
- **FR-AB3.8:** Drop tables with confirmation
- **FR-AB3.9:** Copy table structure

#### 4. Schema Management
- **FR-AB4.1:** List all tables with row counts
- **FR-AB4.2:** List all views
- **FR-AB4.3:** List all triggers
- **FR-AB4.4:** List all indexes
- **FR-AB4.5:** Create/edit/delete views
- **FR-AB4.6:** Create/edit/delete triggers
- **FR-AB4.7:** Foreign key visualization
- **FR-AB4.8:** Table relationships diagram

#### 5. Query Tools
- **FR-AB5.1:** SQL editor with syntax highlighting (✅ DONE)
- **FR-AB5.2:** Query execution with results
- **FR-AB5.3:** Query history (✅ DONE)
- **FR-AB5.4:** Save queries (bookmarks)
- **FR-AB5.5:** Named query library
- **FR-AB5.6:** EXPLAIN query plan viewer
- **FR-AB5.7:** Query time measurement
- **FR-AB5.8:** Multiple result tabs

---

## Modern Enhancements (Beyond Adminer)

### Phase 1: Power User Features

#### 6. Advanced Search
- **FR-MOD6.1:** Full-text search across all tables
- **FR-MOD6.2:** Search by column name
- **FR-MOD6.3:** Data grep (find value anywhere in database)
- **FR-MOD6.4:** Regex search support
- **FR-MOD6.5:** Search results preview

#### 7. Data Visualization
- **FR-MOD7.1:** Chart builder from query results
- **FR-MOD7.2:** Supported charts: Line, Bar, Pie, Scatter
- **FR-MOD7.3:** Real-time chart updates
- **FR-MOD7.4:** Export charts as PNG/SVG
- **FR-MOD7.5:** Dashboard builder (multiple charts)

#### 8. Developer Tools
- **FR-MOD8.1:** Query formatter/beautifier
- **FR-MOD8.2:** Schema diff between two databases
- **FR-MOD8.3:** Migration SQL generator
- **FR-MOD8.4:** Query execution plan visualizer
- **FR-MOD8.5:** Index usage analyzer

### Phase 2: Collaboration & Sharing

#### 9. Sharing & Export
- **FR-MOD9.1:** Share queries via URL (base64 encoded)
- **FR-MOD9.2:** Export query library as JSON
- **FR-MOD9.3:** Import query library
- **FR-MOD9.4:** Public query gallery (optional)

### Phase 3: Performance & Analytics

#### 10. Performance Tools
- **FR-MOD10.1:** Missing index detector
- **FR-MOD10.2:** Query optimizer hints
- **FR-MOD10.3:** Storage usage by table
- **FR-MOD10.4:** Slow query log
- **FR-MOD10.5:** VACUUM analyzer

---

## User Stories (Complete)

### Adminer Replacement Stories

**Story AR-1: Data Inspection**
- **As a** database admin
- **I want to** browse table data with inline editing
- **So that** I can view and modify data without writing SQL

**Story AR-2: CSV Data Migration**
- **As a** data analyst
- **I want to** import CSV files with column mapping
- **So that** I can migrate data from Excel/exports

**Story AR-3: Table Design**
- **As a** database designer
- **I want** a visual table editor
- **So that** I can modify schema without writing DDL

**Story AR-4: Query Management**
- **As a** DevOps engineer
- **I want** to save and organize queries
- **So that** I can reuse common troubleshooting queries

### Modern Enhancement Stories

**Story ME-1: Data Discovery**
- **As a** researcher
- **I want** to search for values across all tables
- **So that** I can find data without knowing the schema

**Story ME-2: Visual Analytics**
- **As a** data analyst
- **I want** to create charts from query results
- **So that** I can present data visually

**Story ME-3: Schema Evolution**
- **As a** developer
- **I want** to compare two database schemas
- **So that** I can generate migration scripts

**Story ME-4: Performance Tuning**
- **As a** DBA
- **I want** to identify missing indexes
- **So that** I can optimize query performance

---

## Technical Requirements

### Functional Requirements (Complete List)

**Database Core** (✅ Complete)
- ✅ FR-1.1: SQLite WASM integration
- ✅ FR-1.2: IndexedDB persistence
- ✅ FR-1.3: Query execution
- ✅ FR-1.4: Parameterized queries
- ✅ FR-1.5: Transaction support
- ✅ FR-1.6: BLOB support

**Data Browser** (❌ Not Started)
- ⏳ FR-2.1: Pagination (100/500/1000 rows)
- ⏳ FR-2.2: Inline editing
- ⏳ FR-2.3: Add/delete rows
- ⏳ FR-2.4: Column filtering
- ⏳ FR-2.5: Column sorting
- ⏳ FR-2.6: NULL handling
- ⏳ FR-2.7: BLOB preview
- ⏳ FR-2.8: FK navigation

**Import/Export** (⚠️ Partial)
- ✅ FR-3.1: SQLite file import/export
- ⏳ FR-3.2: CSV import with mapping
- ⏳ FR-3.3: CSV export options
- ⏳ FR-3.4: JSON export
- ⏳ FR-3.5: SQL dump export
- ⏳ FR-3.6: Partial export

**Table Editor** (❌ Not Started)
- ⏳ FR-4.1: Visual designer
- ⏳ FR-4.2: Add/remove columns
- ⏳ FR-4.3: Modify types
- ⏳ FR-4.4: Constraints editor
- ⏳ FR-4.5: Index management
- ⏳ FR-4.6: Table operations

**Schema Tools** (⚠️ Partial)
- ✅ FR-5.1: List tables
- ✅ FR-5.2: View columns/indexes
- ⏳ FR-5.3: Manage views
- ⏳ FR-5.4: Manage triggers
- ⏳ FR-5.5: FK visualization
- ⏳ FR-5.6: ER diagram

**Query Tools** (⚠️ Partial)
- ✅ FR-6.1: SQL editor + syntax highlighting
- ✅ FR-6.2: Execute queries
- ✅ FR-6.3: Query history
- ⏳ FR-6.4: Save queries
- ⏳ FR-6.5: Query library
- ⏳ FR-6.6: EXPLAIN viewer
- ⏳ FR-6.7: Performance metrics

**Search** (❌ Not Started)
- ⏳ FR-7.1: Full-text search
- ⏳ FR-7.2: Column search
- ⏳ FR-7.3: Data grep
- ⏳ FR-7.4: Regex support

**Visualization** (❌ Not Started)
- ⏳ FR-8.1: Chart builder
- ⏳ FR-8.2: Multiple chart types
- ⏳ FR-8.3: Live updates
- ⏳ FR-8.4: Export charts
- ⏳ FR-8.5: Dashboards

**Developer Tools** (❌ Not Started)
- ⏳ FR-9.1: Query formatter
- ⏳ FR-9.2: Schema diff
- ⏳ FR-9.3: Migration generator
- ⏳ FR-9.4: Plan visualizer
- ⏳ FR-9.5: Index analyzer

**Performance** (❌ Not Started)
- ⏳ FR-10.1: Missing index detection
- ⏳ FR-10.2: Optimizer hints
- ⏳ FR-10.3: Storage analysis
- ⏳ FR-10.4: Slow query log
- ⏳ FR-10.5: VACUUM tools

---

## Non-Functional Requirements

**Performance**
- NFR-1.1: Data browser load < 200ms for 1000 rows
- NFR-1.2: Inline edit commit < 50ms
- NFR-1.3: CSV import 10K rows < 2s
- NFR-1.4: Chart render < 500ms
- NFR-1.5: Search across tables < 1s

**Usability**
- NFR-2.1: Keyboard shortcuts for all major actions
- NFR-2.2: Undo/redo for data edits
- NFR-2.3: Responsive design (mobile + desktop)
- NFR-2.4: Dark mode support
- NFR-2.5: Internationalization (i18n) ready

**Compatibility**
- NFR-3.1: Chrome 90+
- NFR-3.2: Firefox 88+
- NFR-3.3: Safari 14+
- NFR-3.4: Edge 90+
- NFR-3.5: Mobile browsers

---

## Success Metrics

### Adoption
- **Goal:** 5,000 MAU within 6 months
- **Measure:** Analytics tracking

### Feature Usage
- **Goal:** 60% of users use data browser
- **Goal:** 40% of users import CSV
- **Goal:** 30% of users create charts
- **Measure:** Feature usage telemetry

### Performance
- **Goal:** P95 page load < 1s
- **Goal:** P95 query time < 100ms
- **Measure:** RUM (Real User Monitoring)

### Satisfaction
- **Goal:** NPS > 40
- **Goal:** User rating > 4.5/5
- **Measure:** In-app feedback

---

## Release Plan

### v1.0 - Adminer Parity (Target: Q1 2026)
- ✅ Core database operations
- ✅ Basic schema viewer
- ⏳ Data browser with inline editing
- ⏳ CSV import/export
- ⏳ Table structure editor
- ⏳ Query bookmarks

### v2.0 - Modern Enhancements (Target: Q2 2026)
- ⏳ Full-text search
- ⏳ Data visualization
- ⏳ Schema diff tool
- ⏳ Query formatter

### v3.0 - Advanced Features (Target: Q3 2026)
- ⏳ Missing index detector
- ⏳ Query optimizer
- ⏳ Dashboard builder
- ⏳ Migration generator

---

## Dependencies

**Technical**
- ✅ AbsurderSQL WASM package
- ✅ Next.js 15
- ✅ React 19
- ⏳ Charting library (Chart.js or Recharts)
- ⏳ CSV parser library (PapaParse)
- ⏳ SQL formatter (sql-formatter)

**External Services** (Optional)
- Vercel for hosting
- Sentry for error tracking
- Plausible for analytics

---

## Stakeholder Approval

**Product Owner:** Nicholas Piesco  
**Technical Lead:** Nicholas Piesco  
**Status:** Approved  
**Date:** 2025-10-30
