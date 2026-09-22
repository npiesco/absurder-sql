# AbsurderSQL PWA

You want to inspect and edit a local SQLite database without sending it to a
database server.

**AbsurderSQL PWA keeps the database in your browser.**

Inside a client-side PWA module:

```typescript
import init, { Database } from '@/lib/db/database-proxy';

await init();
const db = await Database.newDatabase('example.db');
const result = await db.execute("SELECT 'SQLite in a worker' AS message");
console.log(result.rows[0].values);
await db.close();
```

The PWA needs HTTPS or localhost, SharedWorker and dedicated-worker support,
and browser storage. The first load needs the app's HTTP server; offline use
requires the service worker to finish caching the app and WASM.

**Tech Stack:**  
[![Next.js](https://img.shields.io/badge/nextjs-16.3.0--preview.6-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/react-19.2.0-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)](https://www.typescriptlang.org/)
[![WASM](https://img.shields.io/badge/wasm-@npiesco/absurder--sql-orange)](https://www.npmjs.com/package/@npiesco/absurder-sql)

**Features:**  
[![PWA](https://img.shields.io/badge/pwa-installable-green)](https://web.dev/progressive-web-apps/)
[![Offline](https://img.shields.io/badge/offline-first-green)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_work_offline)
[![Multi-Tab](https://img.shields.io/badge/multi--tab-coordination-purple)](../docs/MULTI_TAB_GUIDE.md)
[![Testing](https://img.shields.io/badge/tests-playwright%20%2B%20vitest-red)](https://playwright.dev/)

> *Browser-based SQLite database administration tool with zero server requirements*

## Overview

AbsurderSQL PWA is a database administration interface built on this
repository's locally generated AbsurderSQL WASM package, using SQLite, OPFS,
and IndexedDB.

**Architecture:** Browser tabs → typed `Database` proxy → SharedWorker coordinator → elected dedicated WASM worker → Hybrid OPFS blocks + IndexedDB metadata (with IndexedDB fallback)

**Dependency security:** The PWA pins Next.js / `eslint-config-next` 16.3.0-preview.6 because the configured CFS feed's newest stable release, 16.2.10, remains in the affected audit ranges. Scoped overrides select patched PostCSS and Sharp releases, and `vendor/brace-expansion-compat` preserves the legacy callable API while delegating to the audited `@isaacs/brace-expansion` implementation.

**Qualified scope (2026-09-22 UTC):** The current default runtime in `pkg` and
`pwa/lib` passed the [native qualification](../docs/NATIVE_QUALIFICATION.md)
on the original Apple Python 3.9.6 / SQLite 3.51.0 runtime and isolated Windows
Server 2025 x64 as SYSTEM. The three production PWA cases cover Hybrid
close/reopen, multi-tab ownership handoff, and offline reload. The broader
PWA application and mobile suites have separate qualification gates. Package
provenance remains `0.1.28`; no newer release is implied.

**Key Capabilities:**
- **Browser-Based Database**: SQL and persistence run locally; an HTTP server serves the app's initial assets
- **Offline-First PWA**: Install as desktop/mobile app, works without internet connectivity
- **WASM Execution**: SQLite executes in the elected dedicated worker
- **Multi-Tab Coordination**: One SharedWorker elects a dedicated OPFS-capable runtime, queues tab requests, and hands ownership to a standby runtime when its owning tab closes
- **Full Portability**: Import/export standard SQLite files for backup and migration

## Features

### Database Management (`/db`)
- Create, import, export, and delete databases
- Drag-and-drop database import
- Real-time database info (size, tables, indexes)
- Hybrid OPFS blocks with shared IndexedDB metadata, or IndexedDB fallback

### SQL Query Interface (`/db/query`)
- Interactive SQL editor with CodeMirror 6
- Syntax highlighting and autocomplete
- Query history with execution time tracking
- Export results to CSV/JSON
- Multi-query execution support

### Schema Tools
- **Schema Viewer** (`/db/schema`) - Browse tables, indexes, triggers, views
- **Table Browser** (`/db/browse`) - View and paginate table data
- **Column Finder** (`/db/columns`) - Search columns across all tables
- **Schema Designer** (`/db/designer`) - Visual table creation wizard
- **Schema Diff** (`/db/diff`) - Compare database schemas and generate migrations

### Data Tools
- **CSV Import** (`/db/import-csv`) - Import CSV files with schema inference
- **Data Grep** (`/db/grep`) - Full-text search across all tables
- **Full-Text Search** (`/db/search`) - Create and query FTS5 indexes
- **Filtered Export** - Export tables with WHERE conditions

### Visualization
- **Dashboard** (`/db/dashboard`) - Database overview and statistics
- **Chart Builder** (`/db/charts`) - Create bar, line, pie, and area charts from queries
- **ER Diagram** (`/db/diagram`) - Generate entity-relationship diagrams
- **Storage Analysis** (`/db/storage`) - Analyze IndexedDB usage and block storage

### Advanced Features
- **Views Manager** (`/db/views`) - Create and manage SQL views
- **Triggers Manager** (`/db/triggers`) - Create and manage database triggers
- **Migration Generator** - Auto-generate SQL migrations from schema changes

## Technology Stack

### Frontend Framework
- **Next.js 16** (App Router architecture)
- **React 19** with concurrent rendering
- **TypeScript 5.x** for type safety and developer experience
- **Tailwind CSS 4** + **shadcn/ui** component library
- **Lucide React** icon system
- **Zustand** for global state management

### Database Layer
- Locally generated AbsurderSQL package (`../pkg` synced into `pwa/lib`)
- Typed main-thread proxy with a SharedWorker coordinator and elected dedicated WASM runtime
- Hybrid OPFS block persistence with IndexedDB metadata and fallback
- Custom SQLite Virtual File System (VFS)
- Block-level I/O with 4KB chunks
- LRU cache (128 blocks) for read optimization
- Multi-tab ownership via SharedWorker and MessagePorts
- WAL (Write-Ahead Logging) mode for concurrent reads

### SQL Editor
- **CodeMirror 6** extensible editor framework
- SQL language server with autocomplete
- Syntax highlighting with @codemirror/lang-sql
- **sql-formatter** for query beautification
- Keyboard shortcuts and search/replace

### Data Visualization
- **Recharts** for responsive charting (bar, line, pie, area)
- **html2canvas** for exporting diagrams
- Custom ER diagram generator with foreign key detection
- **PapaParse** for CSV import/export

### Testing Infrastructure
- **Playwright 1.56+** for E2E browser testing
- **Vitest 4.0+** for unit testing with coverage
- **Testing Library** for React component testing
- General E2E configuration: six local workers, one in CI
- Production PWA gate: one worker and explicit `--retries=0` during qualification

## Getting Started

### Installation

**Prerequisites:**
- Node.js 24 (used in qualification)
- npm 9+ or pnpm 8+

```bash
# Install dependencies
npm install
```

### Development Server

```bash
# Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Development Features:**
- Hot Module Replacement (HMR)
- Fast Refresh for React components
- TypeScript error checking
- ESLint integration

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

**Build Output:**
- Optimized JavaScript bundles
- Static page pre-rendering
- Image optimization
- Code splitting and tree shaking

### Testing

```bash
# E2E tests with Playwright (6 parallel workers)
npm test

# Production PWA gate (builds and serves on port 3100)
npm run test:pwa -- --retries=0

# Interactive UI mode
npm run test:ui

# Headed mode (visible browser)
npm run test:headed

# Unit tests with Vitest
npm run test:unit

# Unit tests with coverage
npm run test:unit:coverage

# Run unit tests and the general E2E configuration
npm run test:all
```

**Test Configuration:**
- General E2E: six local workers / one CI worker on port 3000
- Dedicated production gate: one worker on port 3100; three qualified cases
- Worker-unique database names prevent test pollution
- Wait for observable runtime readiness and persisted query results
- Idempotent setup with DROP TABLE IF EXISTS

The general configurations default to two retries in CI. Qualification
overrides this with `--retries=0`; a retry or browser-cleanup failure is not
counted as a passing qualification run.

### Bundle Analysis

```bash
# Analyze bundle size and dependencies
npm run analyze
```

## Project Structure

```
pwa/
├── app/
│   ├── db/                    # Database admin pages
│   │   ├── browse/           # Table browser
│   │   ├── charts/           # Chart builder
│   │   ├── columns/          # Column finder
│   │   ├── dashboard/        # Overview dashboard
│   │   ├── designer/         # Schema designer
│   │   ├── diagram/          # ER diagram
│   │   ├── diff/             # Schema diff tool
│   │   ├── grep/             # Data grep
│   │   ├── import-csv/       # CSV importer
│   │   ├── query/            # SQL query interface
│   │   ├── schema/           # Schema viewer
│   │   ├── search/           # Full-text search
│   │   ├── storage/          # Storage analysis
│   │   ├── triggers/         # Triggers manager
│   │   └── views/            # Views manager
│   ├── layout.tsx            # Root layout with navigation
│   └── page.tsx              # Landing page
├── components/
│   └── ui/                   # shadcn/ui components
├── lib/
│   └── db/                   # Database utilities
│       ├── store.ts          # Zustand database store
│       ├── database-proxy.ts # Typed browser API
│       ├── database.shared-worker.ts # Cross-tab runtime owner
│       └── database.worker.ts # Dedicated WASM runtime
└── e2e/                      # Playwright E2E tests
```

## Architecture

### State Management Pattern

The PWA uses a **single database instance** pattern via Zustand to avoid dual-connection issues:

```typescript
// Centralized database store
interface DatabaseStore {
  db: Database | null;
  currentDbName: string;
  loading: boolean;
  status: string;
  tableCount: number;
  showSystemTables: boolean;
  _hasHydrated: boolean;
}
```

**Key Design Decisions:**
- Single source of truth prevents data inconsistency
- `currentDbName` persists to localStorage for session restoration
- Hydration-aware initialization prevents race conditions
- Removed dual DatabaseProvider pattern (was causing test failures)

### WASM Integration Strategy

**Code Splitting:**
```javascript
// Dynamic import of the local coordinated-worker facade
const init = (await import('@/lib/db/database-proxy')).default;
const { Database } = await import('@/lib/db/database-proxy');
await init();
```

**Global Exposure:**
- `window.Database` exposed for E2E testing
- `window.testDb` stores test database instance
- Graceful error handling for WASM initialization failures

### Database Lifecycle

**Create:**
```javascript
const db = await Database.newDatabase('myapp.db');
console.log(db.getStorageBackend()); // Hybrid when available, otherwise IndexedDB
```

**Export:**
```javascript
const sqliteFile = await db.exportToFile();
```

Export requires a complete SQLite WAL checkpoint. The returned `Uint8Array`
is a standalone SQLite snapshot with rollback-journal format bytes 18/19;
the live database stays WAL. A blocked or incomplete checkpoint rejects.

**Import:**
```javascript
await db.importFromFile(sqliteFile);
```

Import replaces the current database. If persistent storage cannot reopen,
the operation fails closed rather than opening an empty in-memory database.

**Close:**
```javascript
await db.close();
```

Await `db.sync()` when acknowledging durable writes, and `db.close()` when
releasing the handle. The worker drains queued operations and syncs/closes
the physical connection when its last handle closes. Propagate rejections;
page unload is not a durability acknowledgement.

**Delete:**
```javascript
// After closing the handle above and every other user of this name:
await Database.deleteDatabase('myapp.db');
```

Close every user of this name before deletion. The PWA coordinator closes its
owned connection, then the library physically removes the exact OPFS and
shared-IndexedDB namespace. Similarly prefixed database names survive.
Deletion errors reject; clearing an origin's entire IndexedDB store is not
an equivalent operation.

### Multi-Tab Coordination Architecture

The SharedWorker elects one dedicated worker to own the WASM runtime. Each
tab supplies a runtime candidate and sends proxy requests over MessagePorts.
The elected runtime shares one connection per database name and serializes
operations on that connection. When the owning tab closes, the coordinator
activates a standby runtime and reopens handles on demand.

This is separate from the library's direct-tab IndexedDB leader-election
API. The PWA does not elect its runtime through localStorage or a five-second
tab heartbeat.

**Coordination Flow:**
```
Tab 1 proxy ─┐
             ├─ SharedWorker coordinator ─ elected dedicated WASM worker
Tab 2 proxy ─┘                                      │
                                        Hybrid / IndexedDB storage
```

### Testing Architecture

**Isolation and Observable Completion:**

1. **Worker-Unique Database Names**
   ```javascript
   const TEST_DB_NAME = `test-w${testInfo.parallelIndex}_${Date.now()}`;
   ```

2. **Runtime Readiness**
   ```javascript
   await page.goto('/worker-test');
   await expect(page.getByTestId('worker-status')).toHaveText('ready');
   ```

3. **Idempotent Setup**
   ```sql
   DROP TABLE IF EXISTS users;
   CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);
   ```

4. **Comprehensive Cleanup**
   ```javascript
   // After all handles/tabs using TEST_DB_NAME have closed:
   await page.evaluate(async (name) => {
     await window.Database.deleteDatabase(name);
   }, TEST_DB_NAME);
   ```

**Test Isolation:**
- Each worker uses unique database names
- No shared state between test runs
- Close test-owned handles and delete only their exact database names
- Library ownership/resource tests separately exercise async lifetime safety

## Performance Notes

The sizes, cache-hit rates, and transaction timings retained below are
undated historical estimates, not measurements of the current qualified
package. See [native qualification](../docs/NATIVE_QUALIFICATION.md) for the
current browser/benchmark evidence; workload and runtime affect these values.

### WASM Module Loading

**Lazy Loading Strategy:**
```javascript
// Main bundle: ~500KB (Next.js + React + UI components)
// WASM module: ~1.3MB (~595KB gzipped) - loaded on demand
const init = (await import('@/lib/db/database-proxy')).default;
```

**Benefits:**
- Faster initial page load
- WASM parsed only when database features accessed
- Optimal code splitting for route-based loading

### Storage Layer Optimizations

**Block-Level I/O:**
- 4KB block size (SQLite page size)
- Reads/writes operate on individual blocks
- Avoids serializing entire database on each operation

**LRU Cache:**
- 128-block cache (512KB memory footprint)
- Frequently accessed blocks stay in memory
- Reduces IndexedDB transaction overhead

**Cache Hit Rates:**
- Typical workload: 85-95% cache hit rate
- Sequential scans: 40-60% hit rate
- Point queries: 95%+ hit rate

### Transaction Performance

**WAL Mode (Write-Ahead Logging):**
- Concurrent reads during write operations
- Checkpoint on database close
- Reduces lock contention

**Batch Operations:**
```javascript
// Single query: ~10ms overhead per query
for (let i = 0; i < 1000; i++) {
  await db.execute(`INSERT INTO data VALUES (${i})`);
}
// Total: ~10,000ms

// Transaction: Single sync on COMMIT
await db.execute('BEGIN TRANSACTION');
for (let i = 0; i < 1000; i++) {
  await db.execute(`INSERT INTO data VALUES (${i})`);
}
await db.execute('COMMIT');
// Total: ~100ms (100x faster)
```

### Unimplemented Optimization Ideas

- **Shared Memory**: Zero-copy data transfer
- **Streaming Results**: Large result set pagination

## Browser Compatibility

### Qualified Browser Runtime

The current PWA qualification uses Chromium 153 on macOS ARM64 and Windows
x64. Other browsers must support the APIs below; an older WASM or
BroadcastChannel minimum version does not establish PWA compatibility.

### Required Browser APIs

**Core Requirements:**
- **WebAssembly**: The generated module must initialize successfully
- **IndexedDB API**: Persistent storage with transaction support
- **ES6 Modules**: Dynamic imports and async/await

**Worker Runtime:**
- **SharedWorker** and **MessageChannel**: Cross-tab ownership and proxy requests
- **Dedicated Worker**: WASM execution and OPFS synchronous access when available

**Optional Enhancements:**
- **Service Workers**: Offline caching (PWA)
- **Web App Manifest**: Install to home screen

### Feature Detection

```javascript
// Check WASM support
const wasmSupported = typeof WebAssembly === 'object';

// Check IndexedDB
const idbSupported = typeof indexedDB !== 'undefined';

// Check the PWA's worker requirements
const workersSupported = 'SharedWorker' in window && 'Worker' in window;
```

### Fallback Behavior

- **No SharedWorker**: Initialization rejects; there is no single-tab proxy fallback
- **No usable OPFS synchronous access**: Automatic backend selection uses IndexedDB
- **No Service Worker**: Online-only mode

### Mobile Browser Support

Mobile browser support depends on the same worker and storage APIs. The
desktop qualification does not establish a mobile-browser or React Native pass.

## Progressive Web App (PWA) Features

### Installation

**Desktop Installation:**
- Chrome/Edge: "Install" button in address bar
- Firefox: Installation UI depends on platform/version; the web app still needs the APIs above
- Safari: "Add to Dock" (macOS Sonoma+)

**Mobile Installation:**
- Chrome Android: "Add to Home screen"
- Safari iOS: "Add to Home Screen"
- Appears as native app with custom icon

### Offline Capabilities

**Service Worker Strategy:**
```javascript
// Cache-first for static assets
// Network-first for same-origin navigations
// Cached navigation or root-page fallback when offline
```

**Offline Features:**
- Database operations require no network after the runtime is cached
- OPFS/IndexedDB persistence requires no network
- Cached UI assets and JavaScript bundles
- Export databases while offline

**Online-Only Features:**
- Initial WASM module download
- Documentation links
- External imports (if using network resources)

### App Manifest

**Configuration:**
```json
{
  "name": "AbsurderSQL - SQLite Admin Tool",
  "short_name": "AbsurderSQL",
  "description": "Browser-based SQLite database admin tool with zero server setup",
  "start_url": "/",
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#2563eb",
  "background_color": "#ffffff"
}
```

**Icons:**
- 192x192 (Android home screen)
- 512x512 (Android splash screen)
- Maskable icon support

### Storage Persistence

**Storage Quotas:** Browser policy, free disk space, and persistence permission
determine the origin's quota. Query `navigator.storage.estimate()` rather than
assuming a fixed per-browser limit.

**Persistent Storage API:**
```javascript
if (navigator.storage && navigator.storage.persist) {
  const isPersisted = await navigator.storage.persist();
  console.log('Storage persisted:', isPersisted);
}
```

## Comparison with Traditional Database Admin Tools

### AbsurderSQL PWA vs Adminer

[Adminer](https://www.adminer.org/) is a lightweight database management tool in a single PHP file (~500KB), supporting MySQL, PostgreSQL, SQLite, MS SQL, Oracle, and more. While Adminer is significantly lighter than phpMyAdmin, it still requires PHP server infrastructure.

| Feature | Adminer | AbsurderSQL PWA |
|---------|---------|----------------|
| **File Size** | Single PHP file (~500KB) | Build-dependent; historical estimates above |
| **Database Support** | MySQL, PostgreSQL, SQLite, MS SQL, Oracle | SQLite only |
| **Server Required** | PHP with web server | Initial app hosting; no database server |
| **Architecture** | Client → PHP Server → DB | Browser → worker coordinator → WASM → OPFS/IndexedDB |
| **Installation** | Upload PHP file to server | Visit URL or install PWA |
| **Offline Support** | No (requires server) | Yes (full offline PWA) |
| **Multi-Tab** | Server manages sessions | SharedWorker ownership and queued requests |
| **Data Location** | Server filesystem or remote DB | Local browser (OPFS/IndexedDB) |
| **Export/Import** | SQL, CSV (16 formats) | SQLite files, CSV, JSON |
| **Performance** | Network + server execution | Local WASM execution |
| **Security Model** | Server-side PHP execution | Client-side isolation |
| **Customization** | PHP plugins and themes | React components |

### Key Differences

**Adminer's Advantages:**
- Supports multiple database types (MySQL, PostgreSQL, Oracle, etc.)
- More export formats (16 vs 3)
- Mature feature set with extensive MySQL/PostgreSQL support
- Can manage remote databases

**AbsurderSQL PWA's Advantages:**
- **No database server** - an HTTP server supplies the app's initial assets
- **Fully offline** - works without internet after initial load
- **Local-first privacy** - data never leaves the device
- **PWA installable** - runs as native desktop/mobile app
- **Multi-tab safe** - automatic coordination prevents conflicts
- **Modern UI** - React 19 with Tailwind CSS

### Use Cases

**AbsurderSQL PWA is ideal for:**
- Local development and prototyping without server setup
- Offline-first applications and client-side data analysis
- Privacy-sensitive applications (data never leaves device)
- SQLite file inspection, debugging, and migration
- Learning SQL without LAMP/WAMP/XAMPP installation
- Mobile/desktop SQLite database management
- Developing offline-capable web applications

**Adminer is better for:**
- Managing remote production MySQL/PostgreSQL servers
- Multi-database-type administration (not just SQLite)
- Server-side database operations
- Team environments with shared database access
- Advanced PostgreSQL/MySQL-specific features

## Contributing

This PWA is part of the AbsurderSQL monorepo.

**Development Workflow:**
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm run test:all`)
4. Commit changes (`git commit -m 'Add feature [skip ci]'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open Pull Request

**Code Standards:**
- Follow ESLint rules
- Write tests for new features
- Update documentation
- Maintain zero-flakiness test discipline

See the main [README](../README.md) for detailed contribution guidelines.

## License

See the main repository LICENSE file.

---

## Related Documentation

### Core Documentation
- [Main Project README](../README.md) - Project overview and architecture
- [Native Qualification](../docs/NATIVE_QUALIFICATION.md) - Current gates, package identity, and retained failed attempts
- [WASM Package](https://www.npmjs.com/package/@npiesco/absurder-sql) - npm package documentation

### Feature Guides
- [Dual Mode Guide](../docs/DUAL_MODE.md) - Browser + Native persistence
- [Multi-Tab Guide](../docs/MULTI_TAB_GUIDE.md) - Multi-tab coordination
- [Export/Import Guide](../docs/EXPORT_IMPORT.md) - Database portability
- [Transaction Support](../docs/TRANSACTION_SUPPORT.md) - Transaction handling

### Examples
- [Vite Demo App](../examples/vite-app/) - Production reference implementation
- [Export/Import Demo](../examples/export_import_demo.html) - Interactive wizard
- [Multi-Tab Demo](../examples/multi-tab-demo.html) - Coordination testing

### Monitoring (Optional)
- [Prometheus Metrics](../monitoring/prometheus/) - Production metrics
- [Grafana Dashboards](../monitoring/grafana/) - Pre-built dashboards
- [DevTools Extension](../browser-extension/) - Browser debugging
