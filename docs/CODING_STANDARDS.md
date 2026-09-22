# AbsurderSQL Coding Standards

**Last Updated:** 2026-09-21
**Status:** Active Guidelines

This document defines the coding standards, patterns, and best practices for contributing to AbsurderSQL. These guidelines ensure consistency, maintainability, and production readiness across the codebase.

---

## Table of Contents

- [Error Handling](#error-handling)
- [Logging Strategy](#logging-strategy)
- [Mutex and Concurrency](#mutex-and-concurrency)
- [WASM-Specific Patterns](#wasm-specific-patterns)
- [Testing Requirements](#testing-requirements)
- [Code Review Checklist](#code-review-checklist)

---

## Error Handling

### General Principles

1. **User-Facing Paths**: Always return `Result<T, DatabaseError>` for operations that can fail
2. **Internal Invariants**: Any `.unwrap()` or `.expect()` needs a local proof
   that it cannot consume user/environment failure; the
   [historical unwrap analysis](REMAINING_UNWRAPS.md) is not a blanket exemption
3. **Context Propagation**: Include meaningful error context using `DatabaseError::new(code, message)`

### Error Handling Patterns

#### DO: Return Errors for User Operations

```rust
pub async fn execute(&mut self, sql: &str) -> Result<JsValue, DatabaseError> {
    if sql.trim().is_empty() {
        return Err(DatabaseError::new(
            "INVALID_SQL",
            "SQL query cannot be empty"
        ));
    }
    
    // Execute and handle errors
    self.internal_execute(sql)
        .await
        .map_err(|e| DatabaseError::new("EXECUTION_ERROR", &e.to_string()))
}
```

#### DO: Use Expect for Documented Invariants

```rust
// A fixed SQL literal has no interior NUL.
let sql = c"PRAGMA journal_mode";
```

#### DON'T: Use Unwrap in User-Facing Code

```rust
// BAD - can panic on user input
pub fn parse_config(json: &str) -> Config {
    serde_json::from_str(json).unwrap()  // BAD
}

// GOOD - returns error
pub fn parse_config(json: &str) -> Result<Config, DatabaseError> {
    serde_json::from_str(json)
        .map_err(|e| DatabaseError::new("INVALID_CONFIG", &e.to_string()))
}
```

### Safe Unwrap Contexts

Do not assume safety from a category of API. `Window` can be absent in a Worker,
storage can be denied, IndexedDB request creation can throw, and a receiver can
be dropped. Handle those outcomes and preserve the initiating error. A failed
durable open/sync/delete must not become a successful in-memory fallback.

Use the event-driven transaction executor in `src/storage/wasm_indexeddb.rs`
and the scoped OPFS access-handle lifecycle in `src/storage/wasm_opfs.rs`.
Register completion/abort handlers before submitting requests, acknowledge only
transaction completion, and close handles on both success and failure.

### DatabaseError Usage

```rust
// Error codes should be SCREAMING_SNAKE_CASE
DatabaseError::new("SQLITE_ERROR", "Failed to prepare statement")
DatabaseError::new("INDEXEDDB_ERROR", "Block write failed")
DatabaseError::new("LEADER_ELECTION_ERROR", "Failed to claim leadership")
```

**Standard Error Codes:**
- `SQLITE_ERROR` - SQLite operation failures
- `INDEXEDDB_ERROR` - IndexedDB persistence failures
- `VFS_ERROR` - Virtual file system errors
- `LEADER_ELECTION_ERROR` - Multi-tab coordination errors
- `INVALID_SQL` - User input validation errors
- `SYNC_ERROR` - Data synchronization failures

---

## Logging Strategy

### Log Levels

AbsurderSQL uses the `log` crate with the following level conventions:

| Level | Usage | Example |
|-------|-------|---------|
| **error!** | Unrecoverable errors, data loss risk | `error!("Failed to sync to IndexedDB: {}", err)` |
| **warn!** | Recoverable errors, fallback used | `warn!("SystemTime before UNIX_EPOCH, using fallback")` |
| **info!** | Important state changes | `info!("Leader election complete: {}", is_leader)` |
| **debug!** | Development debugging | `debug!("Block cache hit: block_id={}", id)` |
| **trace!** | Verbose execution flow | `trace!("VFS read: offset={}, len={}", off, len)` |

### Logging Patterns

#### DO: Use Structured Logging

```rust
// Good - includes context
log::info!(
    "Block allocated: id={}, size={}, checksum={:x}",
    block_id,
    size,
    checksum
);

// Good - errors include full context
log::error!(
    "IndexedDB sync failed: db={}, block={}, error={}",
    db_name,
    block_id,
    err
);
```

#### DO: Use Debug Level for Development

```rust
#[cfg(target_arch = "wasm32")]
log::debug!("WASM: Syncing {} blocks to IndexedDB", count);

#[cfg(not(target_arch = "wasm32"))]
log::debug!("Native: Writing {} blocks to filesystem", count);
```

#### DON'T: Use console.log in Production Code

```rust
// Avoid adding unstructured production diagnostics.
#[cfg(target_arch = "wasm32")]
web_sys::console::log_1(&"Debug message".into());  // BAD

// GOOD - use log crate
log::debug!("Debug message");  // GOOD
```

### WASM Console Integration

In WASM builds, logs are automatically forwarded to browser console via `console_log`:

```toml
# Cargo.toml - already configured
[dependencies]
log = "0.4"
console_log = { version = "0.2", optional = true }

[features]
default = ["console_error_panic_hook", "console_log", "bundled-sqlite"]
```

Browser output:
```
[INFO] absurder_sql: Leader election complete: true
[DEBUG] absurder_sql: Block cache hit: block_id=42
```

---

## Mutex and Concurrency

### Mutex Library: parking_lot

The core uses `parking_lot::Mutex` for synchronous native state:
- **No Poisoning** - Eliminates unwrap() on lock acquisition
- **Better Performance** - Faster lock/unlock operations
- **Cleaner API** - Direct `.lock()` without error handling

#### DO: Use parking_lot::Mutex

```rust
use parking_lot::Mutex;

struct Database {
    state: Mutex<DatabaseState>,
}

impl Database {
    fn update_state(&self) {
        let mut state = self.state.lock();  // No unwrap needed!
        state.last_sync = SystemTime::now();
    }
}
```

#### DON'T: Use std::sync::Mutex

```rust
// BAD - requires unwrap or error handling
use std::sync::Mutex;

let state = self.state.lock().unwrap();  // BAD - Can poison
```

### Lock Ordering

To prevent deadlocks, always acquire locks in this order:

1. **Global locks** (STORAGE_REGISTRY)
2. **Database-level locks** (BlockStorage state)
3. **Block-level locks** (individual block metadata)

```rust
// Correct order
let storage = STORAGE_REGISTRY.lock();
let state = self.state.lock();
let block_meta = self.metadata.lock();

// Wrong order - potential deadlock
let block_meta = self.metadata.lock();  // Acquired first
let storage = STORAGE_REGISTRY.lock();   // Global lock acquired later - DEADLOCK RISK!
```

### RefCell for Single-Threaded WASM

In WASM (single-threaded), use `Rc<RefCell<T>>` where shared interior mutability
is needed, not `Arc<RefCell<T>>`. Never retain a `Ref`/`RefMut` across `.await`.
Keep synchronous localStorage/BroadcastChannel work in synchronous internal
helpers, preserving the owner, generation, and lease state.

```rust
#[cfg(target_arch = "wasm32")]
use std::cell::RefCell;

#[cfg(target_arch = "wasm32")]
struct LeaderElection {
    state: RefCell<LeaderState>,  // Single-threaded
}

#[cfg(not(target_arch = "wasm32"))]
use parking_lot::Mutex;

#[cfg(not(target_arch = "wasm32"))]
struct LeaderElection {
    state: Mutex<LeaderState>,  // Multi-threaded
}
```

---

## WASM-Specific Patterns

### String Safety

Never remove NUL bytes from database values. SQL **source** containing NUL
must reject explicitly; SQL TEXT/BLOB **parameters** use explicit byte lengths.
The shared `src/wasm_statement.rs::Statement` owns preparation, binding, row
reading, and RAII finalization for both browser execution methods.

```rust
let sql = std::ffi::CString::new(sql)
    .map_err(|_| DatabaseError::new("INVALID_SQL", "SQL contains a NUL byte"))?;
```

Bind TEXT with `sqlite3_bind_text64` and BLOB with `sqlite3_bind_blob64`, explicit
lengths, and `SQLITE_TRANSIENT`. Read TEXT with `sqlite3_column_bytes`, not a
NUL-terminated `CStr`; reject invalid UTF-8 rather than replacing it. BLOB is
the arbitrary-byte type. Capture SQLite errors before finalization can replace
them, and derive row production/write metadata from SQLite rather than SQL
prefix guesses.

### Window/DOM Access

`Window` is absent in dedicated browser Workers as well as non-browser
environments. Window-dependent coordination must handle that explicitly; durable
storage failures must not be reduced to log-only success:

```rust
let window = web_sys::window()
    .ok_or_else(|| DatabaseError::new("NO_WINDOW", "Window coordination unavailable"))?;
let storage = window.local_storage()
    .map_err(|_| DatabaseError::new("STORAGE_ERROR", "localStorage access denied"))?
    .ok_or_else(|| DatabaseError::new("STORAGE_ERROR", "localStorage unavailable"))?;
```

Worker storage uses its worker-capable backend path; it does not acquire a
Window by pretending the missing API succeeded.

### Event Handler Errors

Handle missing targets, failed casts, rejected request results, transaction
aborts, and dropped receivers explicitly. An error callback must settle the
pending operation; a log alone is not a rejected promise. Do not relabel browser
exceptions or the first request cause as a later generic abort.

### Async/Await Patterns

Use `wasm_bindgen_futures` for async operations:

```rust
use wasm_bindgen_futures::JsFuture;

pub async fn sync_to_indexeddb(&self) -> Result<(), JsValue> {
    let promise = self.create_sync_promise()?;
    let js_future = JsFuture::from(promise);
    js_future.await?;
    Ok(())
}
```

---

## Testing Requirements

### Test Coverage Standards

Every new feature must include:

1. **Unit Tests** - Test individual functions/methods
2. **Integration Tests** - Test feature end-to-end
3. **WASM Tests** - Browser-specific functionality
4. **Native Tests** - Filesystem persistence (with `fs_persist` feature)

### Runtime Evidence

Cross-process/storage changes require real browser/native boundaries: actual
OPFS/IndexedDB, a complete browser restart, real SQLite readback, and a real
HTTP collector when testing telemetry. Do not substitute mocked storage,
source-text assertions, or API-existence checks. Establish the runtime failure
before the repair; test the repaired bytes, then verify the release rebuild
matches those bytes. Preserve failed attempts and immutable older candidates.

### WASM Test Example

```rust
#![cfg(target_arch = "wasm32")]

use wasm_bindgen_test::*;
use absurder_sql::{ColumnValue, Database, DatabaseConfig};

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_indexeddb_persistence() {
    let config = DatabaseConfig {
        name: format!("persistence_{}.db", js_sys::Date::now()),
        ..Default::default()
    };
    
    let mut db = Database::new(config.clone()).await
        .expect("Should create database");
    
    db.execute("CREATE TABLE test (id INT)").await
        .expect("Should create table");
    db.execute("INSERT INTO test VALUES (42)").await
        .expect("Should insert");
    
    db.sync().await
        .expect("Should sync to IndexedDB");
    db.close().await.expect("Should close");

    let mut reopened = Database::new(config.clone()).await.expect("Should reopen");
    let result = reopened.execute_internal("SELECT id FROM test").await
        .expect("Should query");
    assert!(matches!(result.rows[0].values[0], ColumnValue::Integer(42)));
    reopened.close().await.expect("Should close reopened database");
    Database::delete_database(config.name).await.expect("Should delete fixture");
}
```

Same-runtime reopen is useful, but is not a replacement for the independent
process-restart assertions in `tests/e2e/durability.spec.js`.

### Test Commands

```bash
# Run all standard tests
cargo test

# Run native filesystem tests
cargo test --features fs_persist

# Run WASM browser tests
wasm-pack test --chrome --headless

# Run specific test
cargo test test_error_handling

# Run tests with logging
RUST_LOG=debug cargo test

# Qualified failure/ownership/resource and physical-deletion suites
npm run test:stabilization
npm run test:deletion

# Strict native/default-WASM/telemetry-WASM lint gates
cargo fmt --all -- --check
cargo clippy --all-targets --features telemetry,fs_persist -- -D warnings
cargo clippy --target wasm32-unknown-unknown --lib -- -D warnings
cargo clippy --target wasm32-unknown-unknown --lib --features telemetry -- -D warnings
```

---

## Code Review Checklist

Before submitting a PR, verify:

### Error Handling **[✓]**
- [ ] All user-facing functions return `Result<T, DatabaseError>`
- [ ] Fallible browser/storage results propagate; any invariant assertion has a local proof
- [ ] Error messages include helpful context
- [ ] Fallback behavior is documented

### Logging **[✓]**
- [ ] No `web_sys::console::log` or `println!` in production code
- [ ] Log levels are appropriate (error/warn/info/debug/trace)
- [ ] Structured logging with context included
- [ ] Debug logs are helpful for troubleshooting

### Concurrency **[✓]**
- [ ] Uses `parking_lot::Mutex` (not `std::sync::Mutex`)
- [ ] Lock ordering is correct (no deadlock risk)
- [ ] RefCell used for WASM single-threaded code
- [ ] No RefCell guard crosses suspension; connection generation/owner state is retained
- [ ] No data races in multi-threaded native code

### WASM Safety **[✓]**
- [ ] SQL source rejects interior NUL; TEXT/BLOB values preserve exact bytes
- [ ] Window/DOM access handles None gracefully
- [ ] Async operations use wasm_bindgen_futures
- [ ] Memory cleanup in Drop implementations

### Testing **[✓]**
- [ ] Unit tests for new functions
- [ ] Integration test for feature
- [ ] Real restart/storage-failure coverage for changes crossing those boundaries
- [ ] WASM test if browser-specific
- [ ] Native test if filesystem-specific
- [ ] All tests pass: `cargo test && cargo test --features fs_persist && wasm-pack test --chrome --headless`

### Documentation **[✓]**
- [ ] Public APIs have doc comments (`///`)
- [ ] Complex logic has inline comments
- [ ] README updated if user-facing changes
- [ ] Architecture docs updated if design changes

---

## Quick Reference

### Import Standards

```rust
// External crates
use serde::{Deserialize, Serialize};
use parking_lot::Mutex;
use log::{debug, error, info, warn};

// Internal modules
use crate::types::{DatabaseError, QueryResult};
use crate::storage::BlockStorage;

// Conditional compilation
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

#[cfg(not(target_arch = "wasm32"))]
use rusqlite::Connection;
```

### Error Creation

```rust
// Simple error
Err(DatabaseError::new("CODE", "message"))

// With context
Err(DatabaseError::new(
    "SYNC_ERROR",
    &format!("Failed to sync block {}: {}", block_id, err)
))

// From another error
.map_err(|e| DatabaseError::new("PARSE_ERROR", &e.to_string()))
```

### Logging

```rust
log::error!("Critical failure: {}", err);
log::warn!("Fallback used: {}", reason);
log::info!("State change: {} -> {}", old, new);
log::debug!("Internal state: {:?}", state);
log::trace!("Function entry: param={}", param);
```

---

## Additional Resources

- **[SQLITE_STABILIZATION.md](SQLITE_STABILIZATION.md)** - Current boundary contracts and evidence
- **[NATIVE_QUALIFICATION.md](NATIVE_QUALIFICATION.md)** - Final qualified runtimes and retained failures
- **[REMAINING_UNWRAPS.md](REMAINING_UNWRAPS.md)** - Historical analysis, not a current safety exemption
- **[MULTI_TAB_GUIDE.md](MULTI_TAB_GUIDE.md)** - Multi-tab coordination patterns
- **[BENCHMARK.md](BENCHMARK.md)** - Performance expectations

---

## Questions?

For questions about these standards or to propose changes:
1. Open an issue on GitHub
2. Reference this document in your PR
3. Discuss in code review comments

**Remember:** These standards exist to ensure AbsurderSQL remains production-ready, maintainable, and performant. When in doubt, favor safety and clarity over brevity.
