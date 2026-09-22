# Testing Instructions - AbsurderSQL Mobile

**API review: 2026-09-21.** These are host-side UniFFI test patterns, not a claim
of current Android/iOS device qualification. See
[UniFFI status](../MOBILE_UNIFFI_PROGRESS.md) and
[Native qualification](../NATIVE_QUALIFICATION.md) for the distinction.
Paths in the references below are relative to `absurder-sql-mobile`.

`create_database` is async. Synchronous `#[test]` functions in this crate use the
existing `crate::registry::RUNTIME` to await creation; ordinary exported
`execute`/`close_database` calls remain synchronous. Supply every current
`DatabaseConfig` field.

## Critical Testing Patterns

### 1. Use Serial Test Execution for Database Tests

**MANDATORY**: All tests that create databases or interact with database state MUST use `#[serial]` annotation.

Use `#[test]` with `#[serial]` and the existing runtime as shown in the complete
[test template](#test-template) below. Tests without shared state do not require
serialization.

**When to use `#[serial]`**:
- Tests that call `create_database()`
- Tests that interact with database handles
- Tests that modify shared registry state
- Tests that access database files

**When NOT needed**:
- Pure unit tests with no database
- Tests with no shared state

An API/type-existence assertion is not database behavior coverage.

### 2. Reset Intentionally Reused Fixtures and Assert Errors

For an intentionally reused test-owned database, reset the relevant table
before creation and assert cleanup succeeds. A fresh isolated database does not
need DROP before every CREATE. Never erase a persistence/recovery fixture before
asserting the state the test is meant to recover.

```rust
// [x] CORRECT
execute(handle, "DROP TABLE IF EXISTS users".to_string())
    .expect("Failed to reset test table");
execute(handle, "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)".to_string())
    .expect("Failed to create table");
```

**Why**: 
- Tests may run on databases that weren't properly cleaned up
- Explicit fixture ownership prevents cross-test state
- Assert reset failures rather than hiding them with `.ok()`

### 3. Use Test-Owned Unique Database Names

Include a test-specific prefix and an invocation discriminator. A thread ID
alone can repeat in later processes and is not a complete isolation boundary.

```rust
let thread_id = std::thread::current().id();
let invocation = std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH).expect("Clock before epoch").as_nanos();
let config = DatabaseConfig {
    name: format!("uniffi_test_name_{}_{thread_id:?}_{invocation}.db", std::process::id()),
    encryption_key: None,
    cache_size: None,
    page_size: None,
    journal_mode: None,
    auto_vacuum: None,
};
```

**Why**: Serial execution protects registry/environment interactions; unique
names separately protect each fixture's persisted data.

### 4. Always Close Databases in Tests

**MANDATORY**: Every test that creates a database MUST close it.

```rust
let handle = RUNTIME.block_on(create_database(config)).expect("Failed to create database");

// ... test operations ...

close_database(handle).expect("Failed to close database");
```

**Why**: Prevents handle leakage and ensures proper cleanup of resources.

### 5. Always Delete Database Files After Tests

Delete the actual test-owned persistence after closing every handle. For a
plain `fs_persist` database, `config.name` is a logical name, not the physical
SQLite filename. Removing `<name>.db` in the working directory misses the real
`absurdersql_storage/<name-without-.db>/database.sqlite` and block bookkeeping.

```rust
let name = config.name.clone(); // A uniquely owned relative name from above.
let handle = RUNTIME.block_on(create_database(config)).expect("Failed to create database");

// ... test operations ...

close_database(handle).expect("Failed to close database");

let base = std::path::PathBuf::from(
    std::env::var("ABSURDERSQL_FS_BASE").unwrap_or_else(|_| "./absurdersql_storage".into())
);
let logical = name.strip_suffix(".db").unwrap_or(&name);
for path in [base.join(logical), base.join(&name)] {
    if path.exists() {
        std::fs::remove_dir_all(&path).expect("Failed to remove owned fixture");
    }
}
```

Encrypted databases instead use the configured file path and separate
`_vfs_*` bookkeeping. Match cleanup to the actual constructor under test;
never remove a shared storage root or another test's files.

## Test Template

This template exercises a real host-side database operation. Extend its
assertions and boundary coverage for the feature under test; a same-handle query
alone does not prove persistence after process restart.

```rust
use crate::registry::RUNTIME;
use crate::uniffi_api::*;
use serial_test::serial;

#[test]
#[serial]
fn test_my_feature() {
    let _ = env_logger::builder().is_test(true).try_init();
    
    let thread_id = std::thread::current().id();
    let invocation = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH).expect("Clock before epoch").as_nanos();
    let config = DatabaseConfig {
        name: format!("uniffi_myfeature_{}_{thread_id:?}_{invocation}.db", std::process::id()),
        encryption_key: None,
        cache_size: None,
        page_size: None,
        journal_mode: None,
        auto_vacuum: None,
    };
    
    let name = config.name.clone();
    let handle = RUNTIME.block_on(create_database(config)).expect("Failed to create database");
    
    execute(handle, "CREATE TABLE my_table (id INTEGER PRIMARY KEY)".to_string())
        .expect("Failed to create table");
    
    execute(handle, "INSERT INTO my_table VALUES (42)".to_string())
        .expect("Failed to insert");
    let result = execute(handle, "SELECT id FROM my_table".to_string())
        .expect("Failed to query");
    assert_eq!(result.rows.len(), 1);
    assert_eq!(result.rows[0].values[0], ColumnValue::Integer { value: 42 });
    
    // Always close
    close_database(handle).expect("Failed to close database");
    
    let base = std::path::PathBuf::from(
        std::env::var("ABSURDERSQL_FS_BASE").unwrap_or_else(|_| "./absurdersql_storage".into())
    );
    let logical = name.strip_suffix(".db").unwrap_or(&name);
    for path in [base.join(logical), base.join(&name)] {
        if path.exists() {
            std::fs::remove_dir_all(&path).expect("Failed to remove owned fixture");
        }
    }
}
```

## Common Mistakes to Avoid

### [ ] Missing Serial Annotation
```rust
#[test]  // WRONG - no #[serial]
fn test_something() {
    // Will cause race conditions
}
```

### [ ] Ignoring Fixture Reset Errors
```rust
// WRONG - hides a real failure in a deliberately reused fixture.
execute(handle, "DROP TABLE IF EXISTS test".to_string()).ok();
```

### [ ] Shared Database Names
```rust
// WRONG - all tests use same database
let config = DatabaseConfig {
    name: "test.db".to_string(),  // No thread ID
    encryption_key: None,
    cache_size: None,
    page_size: None,
    journal_mode: None,
    auto_vacuum: None,
};
```

### [ ] Not Closing Database
```rust
let handle = RUNTIME.block_on(create_database(config)).expect("Failed to create database");
// ... test operations ...
// WRONG - missing close_database(handle)
```

### [ ] Not Deleting Database File
```rust
let handle = RUNTIME.block_on(create_database(config)).expect("Failed to create database");
// ... test operations ...
close_database(handle).expect("Failed to close database");
// WRONG - missing cleanup of the actual filesystem fixture
```

## Batch Operations

For batch tests, apply the same pattern to each table:

Reset only a deliberately reused test-owned fixture; do not reset data before
checking persistence or recovery.

```rust
let statements = vec![
    "DROP TABLE IF EXISTS users".to_string(),
    "CREATE TABLE users (id INTEGER PRIMARY KEY)".to_string(),
    "INSERT INTO users (id) VALUES (1)".to_string(),
];
execute_batch(handle, statements).expect("Batch should succeed");
```

## Testing Philosophy

### Enterprise Event-Based Architecture
- Tests must be isolated and independent
- No shared state between tests
- Proper cleanup ensures deterministic behavior
- Serial execution prevents race conditions

### Zero Tolerance for Flakiness
- Tests must pass 100% of the time
- No "it works in isolation" excuses
- Proper isolation/cleanup is mandatory
- Race conditions are unacceptable
- Real filesystem/process boundaries require real integration tests, not mocked
  persistence or source-text checks
- Keep failed attempts labelled; repeated success does not erase earlier failures

## Checklist for New Tests

Before submitting a test, verify:

- [ ] Uses `#[serial]` annotation
- [ ] Uses a test-specific, invocation-unique database name
- [ ] Creates fresh fixtures or asserts intentional reset succeeds
- [ ] Awaits `create_database` and uses the complete current configuration
- [ ] Database handle is closed at end of test
- [ ] Actual SQLite file and test-owned bookkeeping are deleted after closing
- [ ] Test passes when run alone
- [ ] Test passes when run with all other tests
- [ ] Test passes 3+ times in a row without failures
- [ ] No test-owned database files or bookkeeping directories remain

## Reference Examples

See these existing files for API usage and real behavior assertions; use the
explicit ownership/cleanup rules above rather than copying ignored errors:
- `src/__tests__/uniffi_execute_test.rs`
- `src/__tests__/uniffi_execute_params_test.rs`
- `src/__tests__/uniffi_transactions_test.rs`
- `src/__tests__/uniffi_export_import_test.rs`
- `src/__tests__/uniffi_batch_test.rs`

## Summary

**The Golden Rules:**
1. `#[serial]` on every database test
2. Assert fixture setup/reset; never erase recovery evidence before readback
3. Unique, test-owned database names
4. Close every database handle
5. Delete the actual test-owned files/bookkeeping after closing

Follow these rules religiously. No exceptions.
