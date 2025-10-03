# Vite + DataSync Example with Multi-Tab Support

This example demonstrates using `sqlite-indexeddb-rs` in a Vite development environment with **multi-tab coordination**.

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

- ✅ Hot module replacement with Vite
- ✅ SQLite database in the browser
- ✅ IndexedDB persistence
- ✅ **Multi-tab leader election**
- ✅ **Automatic write coordination**
- ✅ **Real-time sync across tabs**
- ✅ Leader/follower badge display
- ✅ Automatic UI updates on tab status change

## Multi-Tab Testing

1. Open http://localhost:5173 in your browser
2. **Open the same URL in additional tabs**
3. Observe the leader badge (👑 LEADER or 📖 FOLLOWER)
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

// Any tab can read
const result = await db.query("SELECT * FROM items");

// Listen for changes from other tabs
db.onRefresh(() => {
  console.log('Data changed in another tab!');
});
```

## Production build

```bash
npm run build
npm run preview
```

The build output in `dist/` is ready to deploy to any static host.

See [MULTI_TAB_GUIDE.md](../MULTI_TAB_GUIDE.md) for complete multi-tab documentation.
