# Vite + AbsurderSQL Example with Multi-Tab Support

This example demonstrates using `absurder-sql` in a Vite development environment with **comprehensive multi-tab coordination**.

## Setup

```bash
# Install dependencies
npm install

# Build the WASM package (from repo root)
cd ../..
wasm-pack build --target web --out-dir pkg
cd examples/vite-app

# Start dev server
npm run dev
```

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

### Advanced Features
- **[✓]** **Write Queuing**: Queue writes from any tab
- **[✓]** **Optimistic Updates**: Track pending writes
- **[✓]** **Coordination Metrics**: Monitor performance

## Multi-Tab Testing

1. Open http://localhost:5173 in your browser
2. **Open the same URL in additional tabs**
3. Observe the leader badge ([LEADER] or [FOLLOWER])
4. Try clicking "Run Test" in different tabs
5. See how only the leader tab can write
6. Click "Request Leadership" to become leader
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
import { MultiTabDatabase } from '../multi-tab-wrapper.js';

const db = new MultiTabDatabase(Database, 'vite_example', {
  autoSync: true,           // Auto-sync after writes
  waitForLeadership: false  // Error if not leader
});

await db.init();

// Only leader can write
await db.write("INSERT INTO items VALUES (1, 'Item', 9.99)");

// OR use queueWrite from any tab
await db.queueWrite("INSERT INTO items VALUES (1, 'Item', 9.99)");
// Leaders execute immediately, followers forward to leader

// Any tab can read
const result = await db.query("SELECT * FROM items");

// Listen for changes from other tabs
db.onRefresh(() => {
  console.log('Data changed in another tab!');
});

// Advanced Features:

// Optimistic Updates
await db.enableOptimisticUpdates(true);
const writeId = await db.trackOptimisticWrite("INSERT ...");
const pending = await db.getPendingWritesCount();

// Coordination Metrics
await db.enableCoordinationMetrics(true);
await db.recordLeadershipChange(true);
const metrics = JSON.parse(await db.getCoordinationMetrics());
```

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
npm run test:e2e
```
