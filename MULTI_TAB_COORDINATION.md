# Multi-Tab Write Coordination Implementation Plan

**Status**: Planning Phase  
**Goal**: Enable coordinated multi-tab writes using existing leader election infrastructure  
**Approach**: Leader-only writes with BroadcastChannel notifications (NOT full WAL mode)

## Why This Approach?

**Use Existing Infrastructure**: Leader election already implemented  
**Browser Compatible**: No SharedArrayBuffer requirements  
**Performance**: Better than WAL with async IndexedDB  
**Simpler**: Avoid synchronous -shm coordination complexity  

## Prerequisites (Already Implemented)

- Leader election with localStorage coordination
- BroadcastChannel infrastructure in leader_election.rs
- BlockStorage.is_leader() method
- Database.sync() for IndexedDB persistence
- VFS registration and file operations

## Implementation Phases

---

## Phase 1: JavaScript API Enhancements

**Goal**: Expose leader election and change notifications to JavaScript

### 1.1 Expose Leader Election to Database API ✓ COMPLETE
**File**: `src/lib.rs`

- ✓ Add `is_leader()` method to Database struct (internal)
- ✓ Add `#[wasm_bindgen]` export for `isLeader()` JavaScript method
- ✓ Connect to underlying VFS storage's leader election
- ✓ Add tests in `wasm_integration_tests.rs`

**Expected API**:
```javascript
const db = await Database.newDatabase('mydb');
const isLeader = await db.isLeader(); // true or false
```

**Implementation Notes**:
- Use `STORAGE_REGISTRY` to get BlockStorage for db
- Call `storage.is_leader().await`
- Return boolean to JavaScript

---

### 1.2 Add BroadcastChannel Message System ✓ COMPLETE
**File**: `src/storage/broadcast_notifications.rs` (new module)

- ✓ Create BroadcastNotification enum (DataChanged, SchemaChanged, etc.)
- ✓ Add `send_change_notification()` function
- ✓ Add `register_change_listener()` function with callback
- ✓ Serialize/deserialize messages via serde_json
- ✓ Add to `src/storage/mod.rs` exports

**Message Types**:
```rust
pub enum BroadcastNotification {
    DataChanged { db_name: String, timestamp: u64 },
    SchemaChanged { db_name: String, timestamp: u64 },
    LeaderChanged { db_name: String, new_leader: String },
}
```

**Implementation Notes**:
- Use existing BroadcastChannel from leader_election.rs as reference
- Channel name: `datasync_changes_{db_name}`
- JSON serialization for cross-tab compatibility

---

### 1.3 Integrate Change Notifications with Database ✓ COMPLETE
**File**: `src/lib.rs`

- ✓ Add `on_data_change_callback` field to Database struct
- ✓ Initialize field in `Database::new()` and `Database::open_with_vfs()`
- ✓ Send notification after successful `sync_internal()`
- ✓ Add `#[wasm_bindgen]` method `onDataChange(callback)` for JavaScript

**Expected API**:
```javascript
db.onDataChange((event) => {
  console.log('Data changed:', event);
  // Re-query data
});
```

**Implementation Notes**:
- Store callback in Database struct as `Option<js_sys::Function>`
- Use `wasm_bindgen::closure::Closure` for event handler
- Auto-send notification after every sync()

---

## Phase 2: Write Coordination Enforcement

**Goal**: Ensure only leader can write, provide clear error messages

### 2.1 Add Write Guard Helper ✓ COMPLETE
**File**: `src/lib.rs`

- ✓ Add `check_write_permission()` private method to Database
- ✓ Check `is_leader()` before write operations
- ✓ Return clear error: "Only the leader tab can write to this database"
- ✓ Add `is_write_operation()` helper to classify SQL statements

**Implementation**:
```rust
async fn check_write_permission(&mut self, sql: &str) -> Result<(), DatabaseError> {
    if is_write_operation(sql) && !self.is_leader_for_writes() {
        return Err(DatabaseError::new(
            "WRITE_PERMISSION_DENIED",
            "Only the leader tab can write. Use db.isLeader() to check status."
        ));
    }
    Ok(())
}
```

---

### 2.2 Integrate Write Guard into Execute Methods ✓ COMPLETE
**File**: `src/lib.rs`

- ✓ Call `check_write_permission()` in `execute()` (public WASM method)
- ✓ Call `check_write_permission()` in `execute_with_params()` (public WASM method)
- ✓ Schema changes (CREATE/ALTER) allowed by default via write classification
- ✓ Update error messages with helpful guidance

**SQL Classification**:
```rust
fn is_write_operation(sql: &str) -> bool {
    let upper = sql.trim().to_uppercase();
    upper.starts_with("INSERT") 
        || upper.starts_with("UPDATE")
        || upper.starts_with("DELETE")
        || upper.starts_with("REPLACE")
}
```

---

### 2.3 Add Manual Write Lock Override ✓ COMPLETE
**File**: `src/lib.rs`

- ✓ Add `allowNonLeaderWrites(allow: bool)` method
- ✓ Store `allow_non_leader_writes` flag in Database struct
- ✓ Check flag in write guard before leader check
- ✓ Document use case (single-tab apps, testing)

**Expected API**:
```javascript
// For single-tab apps or testing
db.allowNonLeaderWrites(true);
await db.execute('INSERT INTO users...');
```

---

## Phase 3: Developer Experience

**Goal**: Make multi-tab coordination easy to use

### 3.1 Add Helper Methods ✓ COMPLETE
**File**: `src/lib.rs`

- ✓ `waitForLeadership()` - Promise that resolves when this tab becomes leader
- ✓ `requestLeadership()` - Trigger re-election (if current leader expired)
- ✓ `getLeaderInfo()` - Returns { isLeader, leaderId, leaseExpiry }

**Expected API**:
```javascript
// Wait for leadership before writing
await db.waitForLeadership();
await db.execute('INSERT...');
await db.sync();
```

---

### 3.2 Create Wrapper Utility ✓ COMPLETE
**File**: `examples/multi-tab-wrapper.js` (new)

- ✓ Create `MultiTabDatabase` wrapper class
- ✓ Auto-handle leader election
- ✓ Auto-send notifications after writes
- ✓ Auto-refresh on notifications from other tabs
- ✓ Provide simple callback API

**Example Wrapper**:
```javascript
class MultiTabDatabase {
  async write(sql, params) {
    if (!await this.db.isLeader()) {
      throw new Error('This tab is not the leader');
    }
    await this.db.execute(sql, params);
    await this.db.sync();
    this.notifyOtherTabs();
  }
  
  onRefresh(callback) {
    this.db.onDataChange(callback);
  }
}
```

---

### 3.3 Documentation ✓ COMPLETE
**Files**: 
- `examples/MULTI_TAB_GUIDE.md` (new)
- `examples/multi-tab-demo.html` (new)
- Update `examples/vite-app/` (complete)
- Update `README.md` (complete)

- ✓ Multi-tab coordination guide with examples
- ✓ Common patterns (leader-only, read-only follower)
- ✓ Troubleshooting guide
- ✓ Performance considerations
- ✓ Interactive HTML demo
- ✓ Updated Vite app with multi-tab support
- ✓ Updated README with multi-tab section

**Guide Topics**:
1. Basic leader-follower pattern
2. Handling leadership changes
3. Optimistic UI updates
4. Conflict resolution strategies
5. Single-tab vs multi-tab configuration

---

## Phase 4: Testing & Validation

**Goal**: Comprehensive test coverage for multi-tab scenarios

### 4.1 Unit Tests
**File**: `tests/multi_tab_coordination_tests.rs` (new)

-  Test leader-only write enforcement
-  Test non-leader write rejection
-  Test change notification sending
-  Test change notification receiving
-  Test manual write lock override
-  Test leadership handover during write
-  Test concurrent write attempts

---

### 4.2 Integration Tests
**File**: `tests/multi_tab_integration_tests.rs` (new)

-  Simulate 2-tab scenario (leader writes, follower reads)
-  Simulate 3-tab scenario (leader failover)
-  Test notification propagation timing
-  Test data consistency after leader writes
-  Test sync() before/after leadership change

---

### 4.3 Example Application
**File**: `examples/multi-tab-demo/` (new directory)

-  Create simple multi-tab todo app
-  Show leader badge in UI
-  Disable write UI for non-leaders
-  Auto-refresh list on notifications
-  Show leadership transition messages
-  Include README with setup instructions

**Demo Features**:
- Real-time updates across tabs
- Visual indication of leader status
- Graceful handling of leadership changes
- Performance metrics display

---

## Phase 5: Advanced Features (Optional)

**Goal**: Enhanced coordination capabilities

### 5.1 Write Queuing for Non-Leaders
**File**: `src/storage/write_queue.rs` (new)

-  Queue writes from non-leader tabs
-  Attempt to send to leader via BroadcastChannel
-  Leader processes queued writes
-  Send acknowledgment back to requesting tab
-  Timeout and error handling

**Design**:
```javascript
// Non-leader tab
await db.queueWrite('INSERT INTO users...'); 
// Waits for leader to process and sync
```

---

### 5.2 Optimistic UI Updates
**File**: `src/storage/optimistic_updates.rs` (new)

-  Track pending writes in-memory
-  Apply to query results optimistically
-  Merge with confirmed data after sync
-  Rollback on conflict/error
-  Conflict resolution strategies

---

### 5.3 Performance Monitoring
**File**: `src/storage/coordination_metrics.rs` (new)

-  Track leadership changes per minute
-  Track notification latency
-  Track write conflicts
-  Track follower refresh count
-  Export metrics to JavaScript

---

## Implementation Order

### Sprint 1: Core API
1. Phase 1.1: Expose isLeader()
2. Phase 1.2: BroadcastChannel notifications
3. Phase 1.3: onDataChange callback

### Sprint 2: Write Protection
1. Phase 2.1: Write guard helper
2. Phase 2.2: Integrate into execute methods
3. Phase 2.3: Manual override flag

### Sprint 3: Developer Experience
1. Phase 3.1: Helper methods
2. Phase 3.2: Wrapper utility
3. Phase 3.3: Documentation

### Sprint 4: Testing
1. Phase 4.1: Unit tests
2. Phase 4.2: Integration tests
3. Phase 4.3: Example application

### Sprint 5: Advanced (Optional)
1. Phase 5.1: Write queuing
2. Phase 5.2: Optimistic updates
3. Phase 5.3: Performance monitoring

---

## Success Criteria

### Minimum Viable Product (MVP)
- Leader election working (DONE)
- JavaScript can check `db.isLeader()`
- Non-leaders rejected from writes with clear error
- BroadcastChannel notifications sent after sync()
- Callbacks registered with `db.onDataChange()`
- Documentation with working examples
- 5+ passing multi-tab tests

### Full Release
- All MVP criteria met
- Helper methods (waitForLeadership, etc.)
- Wrapper utility for easy integration
- Multi-tab demo app
- 15+ passing tests covering edge cases
- Performance benchmarks
- Migration guide from single-tab usage

---

## Risk Assessment

### Technical Risks
- **BroadcastChannel latency**: May need caching strategies for high-write scenarios
- **Leadership race conditions**: Already mitigated by localStorage atomic operations
- **Notification ordering**: Not guaranteed; may need sequence numbers

### Mitigation Strategies
1. Add sequence numbers to notifications
2. Implement message deduplication
3. Add retry logic for failed broadcasts
4. Provide configuration for notification batching

---

## Open Questions

1. **Q**: Should reads also check leadership?  
   **A**: No - all tabs can read freely. Only writes require leadership.

2. **Q**: What happens if leader closes mid-write?  
   **A**: Transaction rolls back (SQLite), other tab becomes leader, client retries.

3. **Q**: How to handle schema changes (CREATE, ALTER)?  
   **A**: Treat as write operation, require leadership, broadcast SchemaChanged.

4. **Q**: Should we support multiple databases per tab?  
   **A**: Yes - each database has independent leader election.

5. **Q**: How to test multi-tab coordination in CI?  
   **A**: Use wasm-pack test with multiple BlockStorage instances (simulates tabs).

---

## References

- **Leader Election Memory**: MEMORY[8a606669-2af4-4e6b-bc6d-12ed8e03846a]
- **Existing Tests**: `tests/multi_tab_leader_election_tests.rs`
- **VFS Implementation**: `src/vfs/indexeddb_vfs.rs`
- **Storage Module**: `src/storage/leader_election.rs`

---

## Notes

- This plan avoids full WAL mode implementation (too complex, limited benefit)
- Leverages existing leader election infrastructure
- Focuses on developer experience and clear error messages
- Provides escape hatches (manual override) for single-tab apps
- Designed for incremental implementation and testing
