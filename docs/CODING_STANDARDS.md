# AbsurderSQL Coding Standards

**Last Updated:** 2025-01-08  
**Status:** Active Guidelines

This document defines the coding standards, patterns, and best practices for contributing to AbsurderSQL. These guidelines ensure consistency, maintainability, and production readiness across the codebase.

---

## 📋 Table of Contents

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
2. **Internal Invariants**: Use `.unwrap()` or `.expect()` only for programming assertions (see [REMAINING_UNWRAPS.md](REMAINING_UNWRAPS.md))
3. **Context Propagation**: Include meaningful error context using `DatabaseError::new(code, message)`

### Error Handling Patterns

#### ✅ DO: Return Errors for User Operations

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

#### ✅ DO: Use Expect for Documented Invariants

```rust
// Safe: null bytes removed before this call
let text_cstr = CString::new(sanitized.as_str())
    .expect("CString::new should not fail after null byte removal");
```

#### ❌ DON'T: Use Unwrap in User-Facing Code

```rust
// BAD - can panic on user input
pub fn parse_config(json: &str) -> Config {
    serde_json::from_str(json).unwrap()  // ❌
}

// GOOD - returns error
pub fn parse_config(json: &str) -> Result<Config, DatabaseError> {
    serde_json::from_str(json)
        .map_err(|e| DatabaseError::new("INVALID_CONFIG", &e.to_string()))
}
```

### Safe Unwrap Contexts

Per [REMAINING_UNWRAPS.md](REMAINING_UNWRAPS.md), unwraps are acceptable in:

1. **JavaScript Event Closures** - Browser APIs guarantee properties exist
2. **Window/LocalStorage Access** - Environmental prerequisites (WASM only)
3. **File Path Operations** - Validated upstream in call chain
4. **Sync Primitives** - Architectural guarantees (oneshot channels)

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

#### ✅ DO: Use Structured Logging

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

#### ✅ DO: Use Debug Level for Development

```rust
#[cfg(target_arch = "wasm32")]
log::debug!("WASM: Syncing {} blocks to IndexedDB", count);

#[cfg(not(target_arch = "wasm32"))]
log::debug!("Native: Writing {} blocks to filesystem", count);
```

#### ❌ DON'T: Use console.log in Production Code

```rust
// BAD - Phase 1 eliminated all of these
#[cfg(target_arch = "wasm32")]
web_sys::console::log_1(&"Debug message".into());  // ❌

// GOOD - use log crate
log::debug!("Debug message");  // ✅
```

### WASM Console Integration

In WASM builds, logs are automatically forwarded to browser console via `console_log`:

```toml
# Cargo.toml - already configured
[dependencies]
log = "0.4"
console_log = { version = "1.0", optional = true }

[features]
default = ["console_log"]
```

Browser output:
```
[INFO] absurder_sql: Leader election complete: true
[DEBUG] absurder_sql: Block cache hit: block_id=42
```

---

## Mutex and Concurrency

### Mutex Library: parking_lot

AbsurderSQL uses `parking_lot::Mutex` instead of `std::sync::Mutex` for:
- **No Poisoning** - Eliminates unwrap() on lock acquisition
- **Better Performance** - Faster lock/unlock operations
- **Cleaner API** - Direct `.lock()` without error handling

#### ✅ DO: Use parking_lot::Mutex

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

#### ❌ DON'T: Use std::sync::Mutex

```rust
// BAD - requires unwrap or error handling
use std::sync::Mutex;

let state = self.state.lock().unwrap();  // ❌ Can poison
```

### Lock Ordering

To prevent deadlocks, always acquire locks in this order:

1. **Global locks** (STORAGE_REGISTRY)
2. **Database-level locks** (BlockStorage state)
3. **Block-level locks** (individual block metadata)

```rust
// ✅ Correct order
let storage = STORAGE_REGISTRY.lock();
let state = self.state.lock();
let block_meta = self.metadata.lock();

// ❌ Wrong order - potential deadlock
let block_meta = self.metadata.lock();  // Acquired first
let storage = STORAGE_REGISTRY.lock();   // Global lock acquired later - DEADLOCK RISK!
```

### RefCell for Single-Threaded WASM

In WASM (single-threaded), use `RefCell` instead of `Mutex`:

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

Always sanitize strings before creating `CString` for FFI:

```rust
// ✅ Safe - removes null bytes
let sanitized = user_input.replace('\0', "");
let c_string = CString::new(sanitized)
    .expect("CString::new cannot fail after null byte removal");
```

### Window/DOM Access

Window and DOM APIs can fail in non-browser environments:

```rust
// ✅ Graceful handling
if let Some(window) = web_sys::window() {
    if let Ok(Some(storage)) = window.local_storage() {
        // Use storage
    } else {
        log::warn!("localStorage unavailable");
    }
} else {
    log::error!("Window unavailable - not in browser context");
}
```

### Event Handler Unwraps

Event handlers from browser APIs are safe to unwrap (see [REMAINING_UNWRAPS.md](REMAINING_UNWRAPS.md)):

```rust
// ✅ Safe - browser guarantees event.target exists
let success_callback = Closure::wrap(Box::new(move |event: web_sys::Event| {
    let target = event.target().unwrap();  // Safe: browser API guarantee
    let request: web_sys::IdbRequest = target.unchecked_into();
    let result = request.result().unwrap();  // Safe: called only on success
    // ...
}) as Box<dyn FnMut(_)>);
```

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

### Test Structure

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_handling() {
        // Arrange
        let db = setup_test_db();
        
        // Act
        let result = db.execute("");
        
        // Assert
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err().code,
            "INVALID_SQL"
        );
    }
}
```

### WASM Test Example

```rust
#![cfg(target_arch = "wasm32")]

use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_indexeddb_persistence() {
    let config = DatabaseConfig {
        name: "test_db.db".to_string(),
        ..Default::default()
    };
    
    let mut db = Database::new(config).await
        .expect("Should create database");
    
    db.execute("CREATE TABLE test (id INT)").await
        .expect("Should create table");
    
    db.sync().await
        .expect("Should sync to IndexedDB");
}
```

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
```

---

## Code Review Checklist

Before submitting a PR, verify:

### Error Handling ✅
- [ ] All user-facing functions return `Result<T, DatabaseError>`
- [ ] Unwraps are only in safe contexts (see [REMAINING_UNWRAPS.md](REMAINING_UNWRAPS.md))
- [ ] Error messages include helpful context
- [ ] Fallback behavior is documented

### Logging ✅
- [ ] No `web_sys::console::log` or `println!` in production code
- [ ] Log levels are appropriate (error/warn/info/debug/trace)
- [ ] Structured logging with context included
- [ ] Debug logs are helpful for troubleshooting

### Concurrency ✅
- [ ] Uses `parking_lot::Mutex` (not `std::sync::Mutex`)
- [ ] Lock ordering is correct (no deadlock risk)
- [ ] RefCell used for WASM single-threaded code
- [ ] No data races in multi-threaded native code

### WASM Safety ✅
- [ ] Strings sanitized before CString creation
- [ ] Window/DOM access handles None gracefully
- [ ] Async operations use wasm_bindgen_futures
- [ ] Memory cleanup in Drop implementations

### Testing ✅
- [ ] Unit tests for new functions
- [ ] Integration test for feature
- [ ] WASM test if browser-specific
- [ ] Native test if filesystem-specific
- [ ] All tests pass: `cargo test && cargo test --features fs_persist && wasm-pack test --chrome --headless`

### Documentation ✅
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

- **[CODE_QUALITY_PLAN.md](../CODE_QUALITY_PLAN.md)** - Quality improvement roadmap
- **[REMAINING_UNWRAPS.md](REMAINING_UNWRAPS.md)** - Unwrap safety analysis
- **[MULTI_TAB_GUIDE.md](MULTI_TAB_GUIDE.md)** - Multi-tab coordination patterns
- **[BENCHMARK.md](BENCHMARK.md)** - Performance expectations

---

## Questions?

For questions about these standards or to propose changes:
1. Open an issue on GitHub
2. Reference this document in your PR
3. Discuss in code review comments

**Remember:** These standards exist to ensure AbsurderSQL remains production-ready, maintainable, and performant. When in doubt, favor safety and clarity over brevity.
