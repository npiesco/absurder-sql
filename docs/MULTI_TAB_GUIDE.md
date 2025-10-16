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

sqlite-indexeddb-rs provides built-in multi-tab coordination using:
- **Leader Election**: Automatic leader selection using localStorage
- **Write Coordination**: Only the leader tab can write to the database
- **Write Queuing**: Non-leaders can queue writes that forward to leader
- **BroadcastChannel**: Automatic change notifications to other tabs
- **Auto-sync**: Immediate IndexedDB persistence after writes
- **Optimistic Updates**: Track pending writes for immediate UI feedback
- **Coordination Metrics**: Monitor performance and coordination events

### Why This Approach?

- ✅ **Browser Compatible**: No SharedArrayBuffer required
- ✅ **Simple**: Leader-only writes avoid conflicts
- ✅ **Performant**: Better than SQLite WAL with async IndexedDB
- ✅ **Reliable**: Automatic leader failover when tabs close
- ✅ **Flexible**: Write queuing allows any tab to initiate writes

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
db.onDataChange((changeType) => {
  console.log('Data changed:', changeType);
  // Refresh UI
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
await db.write("INSERT INTO users (name) VALUES (?)", ['Alice']);

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
- **Lease-based**: 5-second lease with heartbeat
- **Failover**: Automatic re-election when leader closes

```javascript
// Check leader status
const isLeader = await db.isLeader();

// Get detailed info
const info = await db.getLeaderInfo();
// { isLeader: true, leaderId: "abc123", leaseExpiry: 1234567890 }

// Wait to become leader (5s timeout)
await db.waitForLeadership();

// Trigger re-election
await db.requestLeadership();
```

### Write Coordination

Only the leader tab can execute write operations:

```javascript
// ✅ Allowed (leader only)
INSERT, UPDATE, DELETE, REPLACE

// ✅ Allowed (any tab)
SELECT, CREATE TABLE, ALTER TABLE, CREATE INDEX

// DDL operations are not considered writes
```

**Option 1: Manual Error Handling**:
```javascript
try {
  await db.execute("INSERT INTO users (name) VALUES ('Bob')");
} catch (err) {
  if (err.message.includes('WRITE_PERMISSION_DENIED')) {
    // Not leader - wait or request leadership
    await db.waitForLeadership();
    // Retry write
  }
}
```

**Option 2: Queue Write (Recommended for Non-Leaders)** ✨ NEW:
```javascript
// Non-leader can queue writes that forward to leader
await db.queueWrite("INSERT INTO users (name) VALUES ('Bob')");

// With custom timeout (default 5s)
await db.queueWriteWithTimeout("UPDATE users SET active = 1", 10000);
```

**How queueWrite Works**:
- **Leader**: Executes immediately (no queuing overhead)
- **Follower**: Forwards request to leader via BroadcastChannel
- **Returns**: When leader acknowledges completion or timeout
- **Error**: Throws if timeout or leader execution fails

### Change Notifications

Changes broadcast to all tabs via BroadcastChannel:

```javascript
db.onDataChange((changeType) => {
  console.log('Change type:', changeType);
  // Refresh your UI here
  loadData();
});
```

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

#### `db.executeWithParams(sql: string, params: any[]): Promise<QueryResult>`
Execute parameterized SQL.

#### `db.sync(): Promise<void>`
Manually sync to IndexedDB.

#### `db.onDataChange(callback: (changeType: string) => void): void`
Register change notification callback.

#### `db.allowNonLeaderWrites(allow: boolean): Promise<void>`
Override write guard for single-tab mode.

#### `db.queueWrite(sql: string): Promise<void>` ✨ NEW
Queue a write operation. Leaders execute immediately, followers forward to leader.
- **Timeout**: 5 seconds default
- **Returns**: When leader acknowledges or times out
- **Throws**: On timeout or execution error

#### `db.queueWriteWithTimeout(sql: string, timeoutMs: number): Promise<void>` ✨ NEW
Queue write with custom timeout.
- **timeoutMs**: Timeout in milliseconds
- **Use case**: Long-running operations or slow networks

#### `db.close(): Promise<void>`
Close database and cleanup.

#### Advanced Features APIs ✨

**Optimistic Updates (Phase 5.2)**:
- `db.enableOptimisticUpdates(enabled: boolean): Promise<void>` - Enable/disable optimistic mode
- `db.isOptimisticMode(): Promise<boolean>` - Check if optimistic mode is enabled
- `db.trackOptimisticWrite(sql: string): Promise<string>` - Track a pending write, returns unique ID
- `db.getPendingWritesCount(): Promise<number>` - Get count of pending writes
- `db.clearOptimisticWrites(): Promise<void>` - Clear all pending writes

**Coordination Metrics (Phase 5.3)**:
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

#### `db.write(sql: string, params?: any[]): Promise<QueryResult>`
Execute write operation (leader only, auto-syncs).

#### `db.query(sql: string, params?: any[]): Promise<QueryResult>`
Execute read query (any tab).

#### `db.execute(sql: string, params?: any[]): Promise<QueryResult>`
Auto-detect and route to write() or query().

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
  await db.write("INSERT INTO logs (message) VALUES (?)", ['User action']);
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

### Pattern 3: Queue Writes from Any Tab ✨ NEW

```javascript
// Non-leaders forward writes to leader automatically

const db = await Database.newDatabase('myapp.db');

// Works from any tab - leader or follower
try {
  await db.queueWrite("INSERT INTO events (type, data) VALUES ('click', 'button')");
  console.log('Write completed successfully');
} catch (err) {
  if (err.message.includes('timeout')) {
    console.error('Leader not responding');
  } else {
    console.error('Write failed:', err.message);
  }
}

// With custom timeout for long operations
await db.queueWriteWithTimeout("UPDATE large_table SET processed = 1", 30000);
```

**When to use queueWrite**:
- ✅ Multi-tab apps where any tab may need to write
- ✅ Background tasks that don't need immediate leader status
- ✅ Form submissions from follower tabs
- ❌ High-frequency writes (use leader check instead)
- ❌ Operations requiring immediate response (check isLeader first)

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
  await db.write("INSERT INTO messages (text) VALUES (?)", [text]);
  // All other tabs will refresh automatically
}
```

### Pattern 5: Single-Tab Override

```javascript
// Disable multi-tab coordination for single-tab apps

const db = await Database.newDatabase('single-tab.db');
await db.allowNonLeaderWrites(true);

// Now any tab can write without leader check
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

### Phase 5.1: Write Queuing ✅

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
- **Returns**: When leader acknowledges completion or timeout
- **Error**: Throws if timeout or leader execution fails

**Use Cases**:
- ✅ Multi-tab apps where any tab may need to write
- ✅ Background tasks that don't need immediate leader status
- ✅ Form submissions from follower tabs
- ❌ High-frequency writes (check isLeader first)
- ❌ Operations requiring immediate response

### Phase 5.2: Optimistic UI Updates ✅

Track pending writes for immediate UI feedback before leader confirmation:

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

### Phase 5.3: Coordination Metrics ✅

Monitor multi-tab coordination performance and events:

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
- **Leadership changes**: Count of leadership transitions
- **Write conflicts**: Non-leader write attempts
- **Follower refreshes**: How often followers sync from leader
- **Notification latency**: Rolling average of BroadcastChannel latency (last 100 samples)
- **Total notifications**: Count of all notifications sent/received

**Use Cases**:
- Monitor coordination performance
- Debug multi-tab issues
- Optimize notification latency
- Track conflict rates
- Performance dashboards

---

## Troubleshooting

### Issue: "WRITE_PERMISSION_DENIED" Error

**Cause**: Trying to write from a non-leader tab.

**Solutions**:
```javascript
// Option 1: Wait for leadership
await db.waitForLeadership();
await db.write(sql);

// Option 2: Request leadership
await db.requestLeadership();
await new Promise(r => setTimeout(r, 200)); // Brief wait
await db.write(sql);

// Option 3: Use waitForLeadership option
const db = new MultiTabDatabase(Database, 'db', {
  waitForLeadership: true
});
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
await db.write("INSERT ..."); // Auto-syncs
```

### Issue: Multiple Leaders Appearing

**Cause**: Race condition during startup.

**Solutions**:
- This should not happen - the leader election uses atomic localStorage operations
- If it does occur, check browser console for errors
- Ensure all tabs are using the same database name

### Issue: Leader Not Changing After Tab Close

**Cause**: Leader lease not expired yet.

**Wait**: Leader lease expires after 5 seconds of no heartbeat.

**Force**: Call `requestLeadership()` from another tab to trigger immediate re-election.

---

## Performance Considerations

### Write Performance

- **Leader-only writes**: No conflict resolution overhead
- **Auto-sync**: Immediate IndexedDB persistence
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

- **BroadcastChannel**: Instant in-tab notifications (same browser)
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
  await db.execute("INSERT INTO items VALUES (?)", [item]);
}
await db.execute("COMMIT");
await db.sync();

// Bad: Many syncs
for (const item of items) {
  await db.write(item); // Each write syncs
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
