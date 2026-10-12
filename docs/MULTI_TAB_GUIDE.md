# Multi-Tab Coordination Guide

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Core Concepts](#core-concepts)
4. [API Reference](#api-reference)
5. [Common Patterns](#common-patterns)
6. [Advanced Features](#advanced-features)
7. [Troubleshooting](#troubleshooting)
8. [Performance Considerations](#performance-considerations)

---

## Overview

AbsurderSQL provides main-thread IndexedDB multi-tab coordination using:
- **Leader Election**: Automatic leader selection using localStorage
- **Write Coordination**: Only the leader tab can write to the database
- **Write Queuing**: Non-leaders can queue writes that forward to leader
- **BroadcastChannel**: Automatic change notifications to other tabs
- **Auto-sync**: The example wrapper awaits sync after `write()`; raw API callers
  must explicitly await persistence
- **Optimistic Updates**: Track pending writes for immediate UI feedback
- **Coordination Metrics**: Monitor performance and coordination events

### Why This Approach?

- **[✓]** **Browser Compatible**: No SharedArrayBuffer required
- **[✓]** **Simple**: Leader-only writes avoid conflicts
- **[✓]** **WAL-compatible**: Current JavaScript constructors request WAL mode
- **[✓]** **Reliable**: Automatic leader failover when tabs close
- **[✓]** **Flexible**: Write queuing allows any tab to initiate writes

This is not a cross-worker ownership protocol. The PWA has a separate
SharedWorker coordinator and one elected dedicated Hybrid/OPFS runtime worker.
Missing `Window` in a Worker does not supply localStorage leader election.
The qualified ownership changes preserve leases and connection generations
while removing `RefCell` borrows across suspension; see
[SQLite/browser stabilization](SQLITE_STABILIZATION.md) and
[Native qualification](NATIVE_QUALIFICATION.md).

---

## Quick Start

### Method 1: Using the Raw API

```javascript
import init, { Database } from '@npiesco/absurder-sql';

// Initialize WASM
await init();

// Create database
const db = await Database.newDatabase('myapp.db');

// Check if leader
const isLeader = await db.isLeader();

if (isLeader) {
  // Only leader can write
  await db.execute("INSERT INTO users (name) VALUES ('Alice')");
  await db.sync(); // Persist to IndexedDB
}

// Any tab can read
const result = await db.execute("SELECT * FROM users");

// Listen for changes from other tabs
db.onDataChange(async (changeType) => {
  console.log('Data changed:', changeType);
  // Serialize this with other operations on the handle in your application.
  await db.reloadFromIndexedDB();
  // Query the refreshed state and update the UI.
});
```

### Method 2: Using MultiTabDatabase Wrapper

```javascript
import init, { Database } from '@npiesco/absurder-sql';
import { MultiTabDatabase } from './multi-tab-wrapper.js';

await init();

const db = new MultiTabDatabase(Database, 'myapp.db', {
  autoSync: true,  // Auto-sync after writes
  waitForLeadership: false  // Throw error if not leader
});

await db.init();

// Automatically handles leader check + sync
await db.write("INSERT INTO users (name) VALUES (?)", [
  { type: 'Text', value: 'Alice' }
]);

// Read from any tab
const result = await db.query("SELECT * FROM users");

// Listen for changes
db.onRefresh(() => {
  console.log('Refresh UI');
});
```

---

## Core Concepts

### Leader Election

- **Automatic**: First tab becomes leader
- **Deterministic**: Lowest instance ID wins
- **Lease-based**: The current manager uses a 1-second lease and 1-second
  heartbeat interval; browser scheduling can delay either
- **Failover**: Automatic re-election when leader closes

```javascript
// Check leader status
const isLeader = await db.isLeader();

// Get detailed info
const info = await db.getLeaderInfo();
// { isLeader: true, leaderId: "leader_myapp.db", leaseExpiry: <current time> }

// Wait to become leader (5s timeout)
await db.waitForLeadership();

// Trigger re-election
await db.requestLeadership();
```

`getLeaderInfo()` is a simplified status report: `leaderId` is a generated
display value (or `"unknown"`), and `leaseExpiry` is the reporting time, not the
manager's real lease deadline. Do not use it as a fencing token or scheduler.
`requestLeadership()` triggers election; callers must check/wait for leadership
rather than assuming the call grants ownership.

### Write Coordination

Data DML is guarded using SQLite preparation metadata, not the first SQL word.
This includes commented/CTE INSERT, UPDATE, DELETE, and REPLACE on both raw
execution methods. Reads and EXPLAIN do not become writes merely because the
SQL text mentions INSERT.

This guard is not an ownership lock for all DDL, PRAGMAs, or transaction-control
statements. Run schema changes and complete transactions on the coordinated
owner too; do not treat unguarded statements as safe concurrent mutations.

**Option 1: Manual Error Handling**:
```javascript
try {
  await db.execute("INSERT INTO users (name) VALUES ('Bob')");
} catch (err) {
  if (String(err).includes('WRITE_PERMISSION_DENIED')) {
    // Not leader - wait or request leadership
    await db.waitForLeadership();
    // Retry write
  }
}
```

**Option 2: Queue Write (Recommended for Non-Leaders)**:
```javascript
// Non-leader can queue writes that forward to leader
await db.queueWrite("INSERT INTO users (name) VALUES ('Bob')");

// With custom timeout (default 5s)
await db.queueWriteWithTimeout("UPDATE users SET active = 1", 10000);
```

**How queueWrite Works**:
- **Leader**: Executes immediately (no queuing overhead)
- **Follower**: Forwards request to leader via BroadcastChannel
- **Returns**: On execution acknowledgement; rejects on timeout
- **Error**: Throws if timeout or leader execution fails

Queue acknowledgement is not an awaited `sync()`. A timeout does not prove the
write was not executed. Do not replay non-idempotent SQL blindly, and do not
split one transaction across queue requests.

### Change Notifications

Changes broadcast to all tabs via BroadcastChannel:

```javascript
db.onDataChange((changeType) => {
  console.log('Change type:', changeType);
  // Refresh your UI here
  loadData();
});
```

Notifications are refresh signals, not a replacement for reloading a follower's
SQLite page cache. Use `reloadFromIndexedDB()` on the raw handle or the wrapper's
managed refresh callback. Background events do not guarantee unload-time saves.

---

## API Reference

### Database Class (Raw API)

#### `Database.newDatabase(dbName: string): Promise<Database>`
Create a new database instance.

#### `db.isLeader(): Promise<boolean>`
Check if this tab is the leader.

#### `db.waitForLeadership(): Promise<void>`
Wait until this tab becomes leader (5s timeout).

#### `db.requestLeadership(): Promise<void>`
Trigger re-election to become leader.

#### `db.getLeaderInfo(): Promise<LeaderInfo>`
Get leader information.
```typescript
interface LeaderInfo {
  isLeader: boolean;
  leaderId: string;
  leaseExpiry: number;
}
```

#### `db.execute(sql: string): Promise<QueryResult>`
Execute SQL statement.

#### `db.executeWithParams(sql: string, params: ColumnValue[]): Promise<QueryResult>`
Execute parameterized SQL using tagged values, not plain JavaScript primitives:

```javascript
await db.executeWithParams('INSERT INTO messages (text) VALUES (?)', [
  { type: 'Text', value: 'before\0after' }
]);
```

Both execution methods execute the first prepared statement only. RETURNING,
CTEs, VALUES, and PRAGMAs return SQLite's rows. Results have `columns`, typed
`rows`, `affectedRows`, `lastInsertId`, and `executionTimeMs`. TEXT preserves
embedded NUL; use `{ type: 'Blob', value: [0, 255] }` for arbitrary bytes.

#### `db.sync(): Promise<void>`
Await durable persistence through the selected backend; failures reject.

#### `db.onDataChange(callback: (changeType: string) => void): void`
Register change notification callback.

#### `db.allowNonLeaderWrites(allow: boolean): Promise<void>`
Override write guard for single-tab mode.

#### `db.queueWrite(sql: string): Promise<void>`
Queue a write operation. Leaders execute immediately, followers forward to leader.
- **Timeout**: 5 seconds default
- **Returns**: When leader acknowledges or times out
- **Throws**: On timeout or execution error

#### `db.queueWriteWithTimeout(sql: string, timeoutMs: number): Promise<void>` 
Queue write with custom timeout.
- **timeoutMs**: Timeout in milliseconds
- **Use case**: Long-running local leader operations (BroadcastChannel is not a
  network transport)

#### `db.close(): Promise<void>`
Close database and cleanup.

#### Advanced Features APIs

**Optimistic Updates**:
- `db.enableOptimisticUpdates(enabled: boolean): Promise<void>` - Enable/disable optimistic mode
- `db.isOptimisticMode(): Promise<boolean>` - Check if optimistic mode is enabled
- `db.trackOptimisticWrite(sql: string): Promise<string>` - Track a pending write, returns unique ID
- `db.getPendingWritesCount(): Promise<number>` - Get count of pending writes
- `db.clearOptimisticWrites(): Promise<void>` - Clear all pending writes

**Coordination Metrics**:
- `db.enableCoordinationMetrics(enabled: boolean): Promise<void>` - Enable/disable metrics tracking
- `db.isCoordinationMetricsEnabled(): Promise<boolean>` - Check if metrics are enabled
- `db.recordLeadershipChange(becameLeader: boolean): Promise<void>` - Record a leadership transition
- `db.recordNotificationLatency(latencyMs: number): Promise<void>` - Record BroadcastChannel latency
- `db.recordWriteConflict(): Promise<void>` - Record a write conflict event
- `db.recordFollowerRefresh(): Promise<void>` - Record a follower sync operation
- `db.getCoordinationMetrics(): Promise<string>` - Get metrics as JSON string
- `db.resetCoordinationMetrics(): Promise<void>` - Reset all metrics

### MultiTabDatabase Class (Wrapper)

#### Constructor
```javascript
new MultiTabDatabase(Database, dbName, options)
```

Options:
- `autoSync: boolean` - Auto-sync after writes (default: true)
- `waitForLeadership: boolean` - Auto-wait for leadership (default: false)
- `syncIntervalMs: number` - Auto-sync interval (default: 0 = disabled)

#### `db.init(): Promise<void>`
Initialize the database.

#### `db.write(sql: string, params?: ColumnValue[]): Promise<QueryResult>`
Execute write operation (leader only, auto-syncs).

#### `db.query(sql: string, params?: ColumnValue[]): Promise<QueryResult>`
Execute read query (any tab).

#### `db.execute(sql: string, params?: ColumnValue[]): Promise<QueryResult>`
Routes to write() or query() using the example wrapper's prefix classifier.
For commented/CTE DML or other SQL outside that classifier, call `write()`
explicitly to retain the wrapper's awaited auto-sync. The core SQLite-aware
permission guard is not a replacement for wrapper routing.

#### `db.onRefresh(callback: () => void): void`
Register callback for changes from other tabs.

#### `db.offRefresh(callback: () => void): void`
Remove refresh callback.

---

## Common Patterns

### Pattern 1: Leader-Only Writer

```javascript
// Leader writes, all tabs read

const db = new MultiTabDatabase(Database, 'myapp.db');
await db.init();

// Check before writing
if (await db.isLeader()) {
  await db.write("INSERT INTO logs (message) VALUES (?)", [
    { type: 'Text', value: 'User action' }
  ]);
}

// All tabs can read
const logs = await db.query("SELECT * FROM logs");
```

### Pattern 2: Wait for Leadership

```javascript
// Automatically wait to become leader

const db = new MultiTabDatabase(Database, 'myapp.db', {
  waitForLeadership: true  // Auto-wait if not leader
});

await db.init();

// This will wait if not leader, then write
await db.write("INSERT INTO data (value) VALUES (42)");
```

### Pattern 3: Queue Writes from Any Tab

```javascript
// Non-leaders forward writes to leader automatically

const db = await Database.newDatabase('myapp.db');

// Works from any tab - leader or follower
try {
  await db.queueWrite("INSERT INTO events (type, data) VALUES ('click', 'button')");
  console.log('Write completed successfully');
} catch (err) {
  if (String(err).toLowerCase().includes('timeout')) {
    console.error('Leader not responding');
  } else {
    console.error('Write failed:', String(err));
  }
}

// With custom timeout for long operations
await db.queueWriteWithTimeout("UPDATE large_table SET processed = 1", 30000);
```

**When to use queueWrite**:
- **[✓]** Multi-tab apps where any tab may need to write
- **[✓]** Background tasks that don't need immediate leader status
- **[✓]** Form submissions from follower tabs
- **[X]** High-frequency writes (use leader check instead)
- **[X]** Operations requiring immediate response (check isLeader first)

### Pattern 4: Real-time Sync Across Tabs

```javascript
// Keep UI in sync across all tabs

const db = new MultiTabDatabase(Database, 'chat.db');
await db.init();

// Refresh when other tabs make changes
db.onRefresh(async () => {
  const messages = await db.query("SELECT * FROM messages ORDER BY id DESC");
  renderMessages(messages.rows);
});

// Send message (if leader)
async function sendMessage(text) {
  await db.write("INSERT INTO messages (text) VALUES (?)", [
    { type: 'Text', value: text }
  ]);
  // All other tabs will refresh automatically
}
```

### Pattern 5: Single-Tab Override

```javascript
// Bypass the data-write guard only when the app enforces a single owner.

const db = await Database.newDatabase('single-tab.db');
await db.allowNonLeaderWrites(true);

// This does not disable other tabs or provide conflict resolution.
await db.execute("INSERT INTO data VALUES (1)");
```

### Pattern 6: Graceful Leader Handoff

```javascript
// Handle leader changes gracefully

const db = new MultiTabDatabase(Database, 'myapp.db');
await db.init();

async function checkAndUpdate() {
  const wasLeader = isCurrentlyLeader;
  isCurrentlyLeader = await db.isLeader();
  
  if (wasLeader && !isCurrentlyLeader) {
    console.log('Lost leadership - UI to read-only mode');
    disableWriteUI();
  } else if (!wasLeader && isCurrentlyLeader) {
    console.log('Became leader - enable write UI');
    enableWriteUI();
  }
}

setInterval(checkAndUpdate, 1000);
```

---

## Advanced Features

### Write Queuing [Implemented]

Queue writes from non-leader tabs that automatically forward to the leader:

```javascript
// Non-leader can queue writes
await db.queueWrite("INSERT INTO users (name) VALUES ('Bob')");

// With custom timeout (default 5s)
await db.queueWriteWithTimeout("UPDATE users SET active = 1", 10000);
```

**How it works**:
- **Leader**: Executes immediately (no queuing overhead)
- **Follower**: Forwards request to leader via BroadcastChannel
- **Returns**: When leader acknowledges SQL execution, not durable sync
- **Error**: Throws if timeout or leader execution fails

**Use Cases**:
- **[✓]** Multi-tab apps where any tab may need to write
- **[✓]** Background tasks that don't need immediate leader status
- **[✓]** Form submissions from follower tabs
- **[X]** High-frequency writes (check isLeader first)
- **[X]** Operations requiring immediate response

### Optimistic UI Updates [Implemented]

Track pending writes for immediate UI feedback before leader confirmation:

Tracking does not execute SQL, durably save it, or automatically roll back UI.
The application owns those actions and the acknowledgement/error state.

```javascript
// Enable optimistic mode
await db.enableOptimisticUpdates(true);

// Track a pending write
const writeId = await db.trackOptimisticWrite('INSERT INTO users VALUES (1, "Alice")');

// Get pending count for UI
const pendingCount = await db.getPendingWritesCount(); // 1

// Clear all pending writes
await db.clearOptimisticWrites();

// Check if mode is enabled
const isOptimistic = await db.isOptimisticMode(); // true/false
```

**Use Cases**:
- Show writes immediately in UI before sync
- Indicate pending operations with badges/spinners
- Rollback UI on write failures
- Track write state across components

### Coordination Metrics [Implemented]

Monitor multi-tab coordination performance and events:

These manually recorded coordination counters are distinct from optional Rust
`telemetry` metrics and exporters. Enabling them does not expose a Prometheus
HTTP endpoint or install the monitoring stack.

```javascript
// Enable metrics tracking
await db.enableCoordinationMetrics(true);

// Record events
await db.recordLeadershipChange(true);
await db.recordNotificationLatency(15.5); // milliseconds
await db.recordWriteConflict();
await db.recordFollowerRefresh();

// Get metrics as JSON
const metricsJson = await db.getCoordinationMetrics();
const metrics = JSON.parse(metricsJson);

console.log(metrics);
// {
//   leadership_changes: 2,
//   write_conflicts: 1,
//   follower_refreshes: 5,
//   avg_notification_latency_ms: 14.2,
//   total_notifications: 10,
//   start_timestamp: 1696377600000
// }

// Reset all metrics
await db.resetCoordinationMetrics();

// Check if metrics are enabled
const enabled = await db.isCoordinationMetricsEnabled(); // true/false
```

**Metrics Tracked**:
- **Leadership changes**: Calls to record leadership transitions while enabled
- **Write conflicts**: Recorded non-leader write attempts
- **Follower refreshes**: Recorded follower reloads
- **Notification latency**: Rolling average of BroadcastChannel latency (last 100 samples)
- **Total notifications**: Count of recorded latency samples

**Use Cases**:
- Monitor coordination performance
- Debug multi-tab issues
- Optimize notification latency
- Track conflict rates
- Performance dashboards

For native Prometheus/Grafana deployment examples, see
[monitoring documentation](../monitoring/README.md). Do not equate those example
deployments with browser qualification. The optional WASM telemetry variant was
qualified separately with real counters, shared-handle observation, serialized
stats, and an actual HTTP collector; the default packaged runtime is not thereby
a telemetry-enabled build.

---

## Troubleshooting

### Issue: "WRITE_PERMISSION_DENIED" Error

**Cause**: Trying to write from a non-leader tab.

**Solutions**:
```javascript
// Raw Database API: wait for leadership, then execute and persist.
await db.waitForLeadership();
await db.execute(sql);
await db.sync();

// Or trigger election, verify leadership, then execute.
await db.requestLeadership();
await db.waitForLeadership(); // Election is not a fixed-delay guarantee.
await db.execute(sql);
await db.sync();

// Example wrapper: use its waitForLeadership option in the write path.
const wrapper = new MultiTabDatabase(Database, 'db', {
  waitForLeadership: true
});
await wrapper.init();
await wrapper.write(sql);
```

### Issue: Changes Not Propagating to Other Tabs

**Cause**: Missing sync() call or BroadcastChannel not set up.

**Solutions**:
```javascript
// Always sync after writes
await db.execute("INSERT ...");
await db.sync();

// Or use MultiTabDatabase with autoSync
const db = new MultiTabDatabase(Database, 'db', { autoSync: true });
await db.init();
await db.write("INSERT ..."); // Auto-syncs
```

### Issue: Multiple Leaders Appearing

**Possible causes**: Startup races, stale status displays, unavailable localStorage,
or separately owned runtimes.

**Solutions**:
- localStorage get/set calls do not form a cross-tab compare-and-swap transaction
- If it does occur, check browser console for errors
- Ensure all tabs are using the same database name

### Issue: Leader Not Changing After Tab Close

**Cause**: Leader lease not expired yet.

**Wait**: The current lease is 1 second; scheduling/throttling can delay observation.

**Recheck**: Call `requestLeadership()` and then verify leadership; do not assume
that a request immediately grants it.

---

## Performance Considerations

### Write Performance

- **Leader-only writes**: No conflict resolution overhead
- **Auto-sync**: Wrapper `write()` awaits sync when enabled
- **Batch writes**: Use transactions for multiple operations

```javascript
await db.execute("BEGIN TRANSACTION");
await db.execute("INSERT INTO users VALUES (1, 'Alice')");
await db.execute("INSERT INTO users VALUES (2, 'Bob')");
await db.execute("COMMIT");
await db.sync(); // One sync for entire transaction
```

### Read Performance

- **All tabs can read**: No coordination needed
- **In-memory SQLite**: Fast query execution
- **IndexedDB backing**: Persistent storage

### Network/Sync Performance

- **BroadcastChannel**: Asynchronous same-origin notifications between contexts
- **IndexedDB**: Async writes, doesn't block UI
- **VFS buffering**: Efficient block-level persistence

### Optimization Tips

1. **Minimize sync frequency**: Only sync after important writes
2. **Use transactions**: Batch related operations
3. **Debounce refreshes**: Don't refresh UI on every notification
4. **Index properly**: Add SQLite indexes for common queries

```javascript
// Good: One sync for batch
await db.execute("BEGIN");
for (const item of items) {
  await db.executeWithParams("INSERT INTO items VALUES (?)", [
    { type: 'Text', value: item }
  ]);
}
await db.execute("COMMIT");
await db.sync();

// Bad: Many syncs
for (const item of items) {
  await db.executeWithParams("INSERT INTO items VALUES (?)", [
    { type: 'Text', value: item }
  ]);
  await db.sync();
}
```

---

## Testing Multi-Tab Behavior

### Manual Testing

1. Open `multi-tab-demo.html` in multiple tabs
2. Observe leader badge in each tab
3. Try writing from follower tabs (should fail or wait)
4. Make changes in leader tab
5. Verify followers receive notifications and refresh

### Automated Testing

See `tests/wasm_integration_tests.rs` for examples:
- `test_write_guard_prevents_follower_writes`
- `test_wait_for_leadership`
- `test_allow_non_leader_writes_override`

Current real multi-context coverage also lives in `tests/e2e/ownership.spec.js`,
`tests/e2e/durability.spec.js`, and `pwa/e2e/pwa-hybrid-storage.spec.ts`.
Close every tab/worker owner before
[`Database.deleteDatabase()`](EXPORT_IMPORT.md#databasedeletedatabasename-string);
an export/import lock does not make concurrent deletion safe.

---

## Next Steps

- **Explore**: Try the [multi-tab-demo.html](../examples/multi-tab-demo.html) 
- **Build**: Use the [MultiTabDatabase wrapper](../examples/multi-tab-wrapper.js) in your application
- **Test**: Run E2E tests with Playwright (`npm run test:e2e`)
- **Customize**: Extend MultiTabDatabase for your needs
- **Contribute**: Report issues or submit PRs

## Related Documentation

- [README.md](../README.md) - Main documentation
- [DEMO_GUIDE.md](../examples/DEMO_GUIDE.md) - Basic usage guide
- [BENCHMARK.md](BENCHMARK.md) - Performance metrics
- [TRANSACTION_SUPPORT.md](TRANSACTION_SUPPORT.md) - Transaction handling
- [Vite App Example](../examples/vite-app/) - Production-ready multi-tab application
