# AbsurderSQL PWA

<p>
  <strong>Next.js 16 + React 19 + WASM + IndexedDB</strong>
</p>

**Tech Stack:**  
[![Next.js](https://img.shields.io/badge/nextjs-16.0.1-black)](https://nextjs.org/)
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

AbsurderSQL PWA is a comprehensive database administration interface built on the [@npiesco/absurder-sql](https://www.npmjs.com/package/@npiesco/absurder-sql) WASM library. It provides a modern alternative to traditional server-based database admin tools like Adminer, running entirely in the browser with SQLite and IndexedDB.

**Architecture:** Browser → WASM SQLite → IndexedDB VFS (4KB block-level I/O)

**Key Capabilities:**
- **100% Browser-Based**: No server infrastructure, all data stays local
- **Offline-First PWA**: Install as desktop/mobile app, works without internet connectivity
- **Native Performance**: Rust-compiled WASM delivers high-performance query execution
- **Multi-Tab Coordination**: Leader election via BroadcastChannel prevents database conflicts
- **Full Portability**: Import/export standard SQLite files for backup and migration

## Features

### Database Management (`/db`)
- Create, import, export, and delete databases
- Drag-and-drop database import
- Real-time database info (size, tables, indexes)
- Persistent storage in IndexedDB

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
- **@npiesco/absurder-sql** (Rust-compiled WASM SQLite)
- Custom IndexedDB Virtual File System (VFS)
- Block-level I/O with 4KB chunks
- LRU cache (128 blocks) for read optimization
- Multi-tab coordination via BroadcastChannel API
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
- **6-worker parallel execution** for concurrency validation
- Zero-flakiness test discipline with event-based waits

## Getting Started

### Installation

**Prerequisites:**
- Node.js 18+
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

# Interactive UI mode
npm run test:ui

# Headed mode (visible browser)
npm run test:headed

# Unit tests with Vitest
npm run test:unit

# Unit tests with coverage
npm run test:unit:coverage

# Run all test suites
npm run test:all
```

**Test Configuration:**
- 6 workers for multi-tab concurrency testing
- Worker-unique database names prevent test pollution
- Event-based waits (no setTimeout/waitForTimeout)
- Idempotent setup with DROP TABLE IF EXISTS

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
│       └── utils.ts          # Helper functions
└── tests/
    └── e2e/                  # Playwright E2E tests
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
// Dynamic import for optimal bundle size
const init = (await import('@npiesco/absurder-sql')).default;
const { Database } = await import('@npiesco/absurder-sql');
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
// Initializes IndexedDB storage with block allocation
```

**Close:**
```javascript
await db.close();
// CRITICAL: Syncs WAL to IndexedDB for persistence
// Triggers leader election cleanup
// Must be called before page navigation
```

**Export:**
```javascript
const sqliteFile = await db.exportToFile();
// Returns Uint8Array of standard SQLite file
```

**Import:**
```javascript
await db.importFromFile(uint8Array);
// Loads SQLite file into IndexedDB block storage
```

### Multi-Tab Coordination Architecture

**Leader Election:**
- Atomic operations on localStorage for leader claim
- BroadcastChannel for cross-tab notifications
- Heartbeat (5s interval) for liveness detection
- Automatic leader transition on tab close

**Write Queue:**
- Non-leader tabs queue writes
- Leader processes queued operations
- Prevents concurrent write conflicts

**Coordination Flow:**
```
Tab 1 (Leader)    Tab 2 (Non-Leader)
     |                    |
     |<--- write request -|
     | process write      |
     |--- notification -->|
     |                    | update UI
```

### Testing Architecture

**Zero-Flakiness Discipline:**

1. **Worker-Unique Database Names**
   ```javascript
   const TEST_DB_NAME = `test-w${testInfo.parallelIndex}_${Date.now()}`;
   ```

2. **Event-Based Waits** (no setTimeout)
   ```javascript
   await page.waitForFunction(() => {
     return (window as any).testDb?.isLeader();
   }, { timeout: 15000 });
   ```

3. **Idempotent Setup**
   ```sql
   DROP TABLE IF EXISTS users;
   CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);
   ```

4. **Comprehensive Cleanup**
   ```javascript
   localStorage.clear();
   const dbs = await indexedDB.databases();
   for (const db of dbs) {
     await indexedDB.deleteDatabase(db.name);
   }
   ```

**Test Isolation:**
- Each worker uses unique database names
- No shared state between test runs
- Full cleanup in beforeEach and afterEach
- Validates WASM async safety under 6-worker concurrency

## Performance Characteristics

### WASM Module Loading

**Lazy Loading Strategy:**
```javascript
// Main bundle: ~500KB (Next.js + React + UI components)
// WASM module: ~1.3MB (~595KB gzipped) - loaded on demand
const init = (await import('@npiesco/absurder-sql')).default;
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

### Future Optimizations

- **Web Workers**: Background query execution
- **Shared Memory**: Zero-copy data transfer
- **Streaming Results**: Large result set pagination

## Browser Compatibility

### Supported Browsers

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome  | 90+ | Full support |
| Edge    | 90+ | Full support |
| Firefox | 89+ | Full support |
| Safari  | 15.4+ | BroadcastChannel since 15.4 |
| Opera   | 76+ | Chromium-based |

### Required Browser APIs

**Core Requirements:**
- **WebAssembly**: All modern browsers (95%+ global coverage)
- **IndexedDB API**: Persistent storage with transaction support
- **ES6 Modules**: Dynamic imports and async/await

**Multi-Tab Features:**
- **BroadcastChannel API**: Cross-tab communication (Safari 15.4+)
- **localStorage**: Leader election coordination

**Optional Enhancements:**
- **Service Workers**: Offline caching (PWA)
- **Web App Manifest**: Install to home screen

### Feature Detection

```javascript
// Check WASM support
const wasmSupported = typeof WebAssembly === 'object';

// Check IndexedDB
const idbSupported = typeof indexedDB !== 'undefined';

// Check BroadcastChannel
const bcSupported = typeof BroadcastChannel !== 'undefined';
```

### Fallback Behavior

- **No BroadcastChannel**: Single-tab mode (no coordination)
- **No localStorage**: Non-leader writes allowed
- **No Service Worker**: Online-only mode

### Mobile Browser Support

- **iOS Safari 15.4+**: Full support
- **Chrome Mobile 90+**: Full support
- **Firefox Mobile 89+**: Full support
- **Samsung Internet 15+**: Full support

## Progressive Web App (PWA) Features

### Installation

**Desktop Installation:**
- Chrome/Edge: "Install" button in address bar
- Firefox: "Install" in page actions menu
- Safari: "Add to Dock" (macOS Sonoma+)

**Mobile Installation:**
- Chrome Android: "Add to Home screen"
- Safari iOS: "Add to Home Screen"
- Appears as native app with custom icon

### Offline Capabilities

**Service Worker Strategy:**
```javascript
// Cache-first for static assets
// Network-first for API calls (when implemented)
// Fallback to cache on network failure
```

**Offline Features:**
- All database operations work offline
- IndexedDB persistence (no network required)
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
  "name": "AbsurderSQL PWA",
  "short_name": "AbsurderSQL",
  "description": "SQLite Database Admin Tool",
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
```

**Icons:**
- 192x192 (Android home screen)
- 512x512 (Android splash screen)
- 180x180 (iOS home screen)
- Maskable icon support

### Storage Persistence

**IndexedDB Quotas:**
- Chrome: ~60% of available disk space
- Firefox: ~50% of available disk space
- Safari: ~1GB (can request more)

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
| **File Size** | Single PHP file (~500KB) | WASM module (~1.3MB, ~595KB gzipped) |
| **Database Support** | MySQL, PostgreSQL, SQLite, MS SQL, Oracle | SQLite only |
| **Server Required** | PHP 5.3+ with web server | None (client-only) |
| **Architecture** | Client → PHP Server → DB | Browser → WASM → IndexedDB |
| **Installation** | Upload PHP file to server | Visit URL or install PWA |
| **Offline Support** | No (requires server) | Yes (full offline PWA) |
| **Multi-Tab** | Server manages sessions | BroadcastChannel coordination |
| **Data Location** | Server filesystem or remote DB | Local browser (IndexedDB) |
| **Export/Import** | SQL, CSV (16 formats) | SQLite files, CSV, JSON |
| **Performance** | Network + server overhead | Local (near-native WASM) |
| **Security Model** | Server-side PHP execution | Client-side isolation |
| **Customization** | PHP plugins and themes | React components |

### Key Differences

**Adminer's Advantages:**
- Supports multiple database types (MySQL, PostgreSQL, Oracle, etc.)
- More export formats (16 vs 3)
- Mature feature set with extensive MySQL/PostgreSQL support
- Can manage remote databases

**AbsurderSQL PWA's Advantages:**
- **Zero server infrastructure** - no PHP, no web server, no database server
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
4. Commit changes (`git commit -m 'Add amazing feature'`)
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
