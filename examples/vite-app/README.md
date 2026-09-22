# Vite + AbsurderSQL Example with Multi-Tab Support

You need browser tabs to share a SQLite database without issuing competing
writes.

**This Vite example coordinates writes through AbsurderSQL.**

## Setup

```bash
# From the repository root, use the checked-in qualified default package
cd examples/vite-app && npm install && npm run dev
```

Open `http://localhost:3000`. The example uses the repository's `pkg` directly;
rebuilding it creates a new local candidate, not the already-qualified bytes.
See [native qualification](../../docs/NATIVE_QUALIFICATION.md) for the macOS and
isolated Windows x64 results. Browser storage remains origin-local, and writes
must await their sync result before the application reports persistence.

## Features

### Core Features
- **[✓]** Hot module replacement with Vite
- **[✓]** SQLite database in the browser
- **[✓]** IndexedDB persistence
- **[✓]** **Multi-tab leader election**
- **[✓]** **Automatic write coordination**
- **[✓]** **Real-time sync across tabs**
- **[✓]** Leader/follower badge display
- **[✓]** Automatic UI updates on tab status change

### Additional Library APIs
- **Write Queuing**: `queueWrite` is available on the raw `Database` handle, not `MultiTabDatabase`
- **[✓]** **Optimistic Updates**: Track pending writes
- **[✓]** **Coordination Metrics**: Monitor performance

## Multi-Tab Testing

1. Open http://localhost:3000 in your browser
2. **Open the same URL in additional tabs**
3. Observe the leader badge ([LEADER] or [FOLLOWER])
4. Try clicking "Run Test" in different tabs
5. See how only the leader tab can write
6. Click "Request Leadership" to request re-election, then check the badge
7. Watch how data changes sync across all tabs

## How It Works

- **Leader Election**: First tab becomes leader automatically
- **Write Guard**: Only leader can execute INSERT/UPDATE/DELETE
- **Auto-Sync**: Changes automatically sync to IndexedDB
- **Notifications**: BroadcastChannel notifies other tabs of changes
- **Failover**: When leader tab closes, another tab becomes leader

## Code Highlights

The app uses `MultiTabDatabase` wrapper for simplified multi-tab handling:

```javascript
import init, { Database } from '../../pkg/absurder_sql.js';
import { MultiTabDatabase } from '../multi-tab-wrapper.js';

await init();
const db = new MultiTabDatabase(Database, 'vite_example', {
  autoSync: true,           // Auto-sync after writes
  waitForLeadership: true   // Wait before leader-only writes
});

await db.init();
await db.write(`CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY, name TEXT, price REAL
)`);

// Only leader can write
await db.write("INSERT INTO items (name, price) VALUES ('Item', 9.99)");

// Any tab can read
const result = await db.query("SELECT * FROM items");

// Listen for changes from other tabs
db.onRefresh(() => {
  console.log('Data changed in another tab!');
});

// Advanced Features:

// Optimistic Updates
await db.enableOptimisticUpdates(true);
const writeId = await db.trackOptimisticWrite(
  "INSERT INTO items (name, price) VALUES ('Pending item', 2.99)"
);
const pending = await db.getPendingWritesCount();

// Coordination Metrics
await db.enableCoordinationMetrics(true);
await db.recordLeadershipChange(true);
const metrics = JSON.parse(await db.getCoordinationMetrics());
```

`trackOptimisticWrite` records pending UI state; it does not execute SQL.
Close the wrapper with `await db.close()` when finished. Do not rely on an
asynchronous unload handler to make unsynced writes durable.
For follower write forwarding through a raw `Database` handle, see the
[multi-tab guide](../../docs/MULTI_TAB_GUIDE.md).

## Production build

```bash
npm run build
npm run preview
```

The build output in `dist/` is ready to deploy to any static host.

## Documentation

- [Multi-Tab Coordination Guide](../../docs/MULTI_TAB_GUIDE.md) - Complete guide with all features
- [Demo Guide](../DEMO_GUIDE.md) - How to run interactive demos
- [Main README](../../README.md) - Project overview

## E2E Testing

This app is tested with Playwright. Run tests from repo root:

```bash
npm run test:e2e -- --retries=0
npm run test:deletion -- --retries=0
npm run test:stabilization -- --retries=0
```

The qualified browser/benchmark suite has 79 cases; deletion has 13 and
stabilization has 35. Those library suites are distinct from the full PWA or
mobile application suites.
