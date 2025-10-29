# Testing Instructions - AbsurderSQL Mobile

## Critical Testing Patterns

### 1. Use Serial Test Execution for Database Tests

**MANDATORY**: All tests that create databases or interact with database state MUST use `#[serial]` annotation.

```rust
use serial_test::serial;

#[test]
#[serial]  // Required for database tests
fn test_database_feature() {
    let handle = create_database(config).expect("Failed to create database");
    // test implementation
}

#[test]
// No #[serial] needed - no database interaction
fn test_pure_logic() {
    assert_eq!(2 + 2, 4);
}
```

**When to use `#[serial]`**:
- Tests that call `create_database()`
- Tests that interact with database handles
- Tests that modify shared registry state
- Tests that access database files

**When NOT needed**:
- Pure unit tests with no database
- Tests that only check module existence
- Tests that validate types/interfaces
- Tests with no shared state

### 2. ALWAYS Use DROP TABLE IF EXISTS Before CREATE TABLE

**MANDATORY**: Every `CREATE TABLE` statement MUST be preceded by `DROP TABLE IF EXISTS`.

```rust
// [x] CORRECT
execute(handle, "DROP TABLE IF EXISTS users".to_string()).ok();
execute(handle, "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)".to_string())
    .expect("Failed to create table");

// [ ] WRONG - Will cause test interference
execute(handle, "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)".to_string())
    .expect("Failed to create table");
```

**Why**: 
- Tests may run on databases that weren't properly cleaned up
- Parallel test execution can leave tables in unexpected states
- Ensures idempotent test behavior
- Prevents "table already exists" errors

### 3. Use Thread-Based Unique Database Names

**MANDATORY**: All test databases MUST use thread ID for uniqueness.

```rust
let thread_id = std::thread::current().id();
let config = DatabaseConfig {
    name: format!("uniffi_test_name_{:?}.db", thread_id),
    encryption_key: None,
};
```

**Why**: Ensures each test has its own isolated database even if tests somehow run in parallel.

### 4. Always Close Databases in Tests

**MANDATORY**: Every test that creates a database MUST close it.

```rust
let handle = create_database(config).expect("Failed to create database");

// ... test operations ...

close_database(handle).expect("Failed to close database");
```

**Why**: Prevents handle leakage and ensures proper cleanup of resources.

### 5. Always Delete Database Files After Tests

**MANDATORY**: Every test that creates a database MUST delete the file after closing it.

```rust
let thread_id = std::thread::current().id();
let config = DatabaseConfig {
    name: format!("uniffi_test_{:?}.db", thread_id),
    encryption_key: None,
};

let handle = create_database(config).expect("Failed to create database");

// ... test operations ...

close_database(handle).expect("Failed to close database");

// Cleanup: delete test database file
let db_path = format!("uniffi_test_{:?}.db", thread_id);
let _ = std::fs::remove_file(&db_path);
```

**Why**: Prevents accumulation of test database files in the repository.

## Test Template

Use this template for all new UniFFI tests:

```rust
#[test]
#[serial]
fn test_my_feature() {
    let _ = env_logger::builder().is_test(true).try_init();
    
    let thread_id = std::thread::current().id();
    let config = DatabaseConfig {
        name: format!("uniffi_myfeature_{:?}.db", thread_id),
        encryption_key: None,
    };
    
    let handle = create_database(config).expect("Failed to create database");
    
    // DROP before CREATE - ALWAYS
    execute(handle, "DROP TABLE IF EXISTS my_table".to_string()).ok();
    execute(handle, "CREATE TABLE my_table (id INTEGER PRIMARY KEY)".to_string())
        .expect("Failed to create table");
    
    // Test operations here
    
    // Always close
    close_database(handle).expect("Failed to close database");
    
    // Cleanup: delete test database file
    let db_path = format!("uniffi_myfeature_{:?}.db", thread_id);
    let _ = std::fs::remove_file(&db_path);
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

### [ ] Missing DROP TABLE
```rust
// WRONG - no DROP TABLE IF EXISTS
execute(handle, "CREATE TABLE test (id INTEGER)".to_string())
    .expect("Failed to create table");
```

### [ ] Shared Database Names
```rust
// WRONG - all tests use same database
let config = DatabaseConfig {
    name: "test.db".to_string(),  // No thread ID
    encryption_key: None,
};
```

### [ ] Not Closing Database
```rust
let handle = create_database(config).expect("Failed to create database");
// ... test operations ...
// WRONG - missing close_database(handle)
```

### [ ] Not Deleting Database File
```rust
let handle = create_database(config).expect("Failed to create database");
// ... test operations ...
close_database(handle).expect("Failed to close database");
// WRONG - missing std::fs::remove_file cleanup
```

## Batch Operations

For batch tests, apply the same pattern to each table:

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

## Checklist for New Tests

Before submitting a test, verify:

- [ ] Uses `#[serial]` annotation
- [ ] Uses thread-based unique database name
- [ ] Every CREATE TABLE has DROP TABLE IF EXISTS before it
- [ ] Database handle is closed at end of test
- [ ] Database file is deleted after closing (std::fs::remove_file)
- [ ] Test passes when run alone
- [ ] Test passes when run with all other tests
- [ ] Test passes 3+ times in a row without failures
- [ ] No .db files remain after running tests

## Reference Examples

See these files for correct patterns:
- `src/__tests__/uniffi_execute_test.rs`
- `src/__tests__/uniffi_execute_params_test.rs`
- `src/__tests__/uniffi_transactions_test.rs`
- `src/__tests__/uniffi_export_import_test.rs`
- `src/__tests__/uniffi_batch_test.rs`

## Summary

**The Golden Rules:**
1. `#[serial]` on every database test
2. `DROP TABLE IF EXISTS` before every `CREATE TABLE`
3. Thread ID in every database name
4. Close every database handle
5. Delete every database file after closing

Follow these rules religiously. No exceptions.
