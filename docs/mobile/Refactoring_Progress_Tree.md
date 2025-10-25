# Mobile FFI Refactoring Progress Tree

**Goal:** Refactor monolithic `lib.rs` (2,442 lines) into modular structure matching parent repo architecture

**Priority:** Medium  
**Target:** v0.2.0 (Week 3)  
**Status:** 🚧 Planning

---

## Current State

- **lib.rs**: 2,442 lines - monolithic file with all FFI functions
- **Issues**: 
  - Hard to navigate and maintain
  - Doesn't follow parent repo's modular pattern
  - All code in single file makes testing and changes difficult

## Target Structure

```
absurder-sql-mobile/src/
├── lib.rs (main entry, re-exports)
├── ffi/
│   ├── mod.rs
│   ├── core.rs (db_new, execute, close, error handling)
│   ├── transactions.rs (begin, commit, rollback, batch)
│   ├── prepared_statements.rs (prepare, execute)
│   ├── streaming.rs (prepare_stream, fetch_next, close_stream)
│   └── export_import.rs (export, import)
├── registry.rs (all global registries and handles)
├── android_jni/
│   ├── mod.rs
│   └── bindings.rs (JNI wrappers)
└── __tests__/
    ├── prepared_statement_ffi_test.rs
    └── streaming_api_test.rs
```

---

## Refactoring Steps

### Phase 1: Setup Module Structure ✅
- [✓] Create `src/ffi/` directory
- [✓] Create `src/android_jni/` directory
- [✓] Create empty module files with proper declarations

### Phase 2: Extract Registry Module ✅
- [✓] **Write test**: Verify registry functions work after extraction
- [✓] **Extract code**: Move all `Lazy<>` statics to `src/registry.rs`
  - [✓] `DB_REGISTRY`
  - [✓] `STMT_REGISTRY`
  - [✓] `STREAM_REGISTRY`
  - [✓] `HANDLE_COUNTER`
  - [✓] `STMT_HANDLE_COUNTER`
  - [✓] `STREAM_HANDLE_COUNTER`
  - [✓] `RUNTIME`
  - [✓] `LAST_ERROR` thread-local
- [✓] **Extract helpers**: Move `set_last_error()`, `clear_last_error()`, `get_last_error_internal()`
- [✓] **Run tests**: All 41 tests passing (36 original + 5 new)
- [✓] **Commit**: "refactor: extract registry module"

### Phase 3: Extract FFI Core Module ✅
- [✓] **Write test**: Verify core FFI functions work after extraction
- [✓] **Create** `src/ffi/core.rs` (219 lines)
- [✓] **Move functions**:
  - [✓] `absurder_db_new()`
  - [✓] `absurder_db_execute()`
  - [✓] `absurder_db_close()`
  - [✓] `absurder_free_string()`
  - [✓] `absurder_get_error()`
- [✓] **Update** `src/ffi/mod.rs` to include core module
- [✓] **Run tests**: All 47 tests passing (41 original + 6 new)
- [✓] **Commit**: "refactor: extract ffi/core module"

### Phase 4: Extract FFI Transactions Module ✅
- [✓] **Write test**: Verify transaction functions work after extraction
- [✓] **Create** `src/ffi/transactions.rs` (241 lines)
- [✓] **Move functions**:
  - [✓] `absurder_db_begin_transaction()`
  - [✓] `absurder_db_commit()`
  - [✓] `absurder_db_rollback()`
  - [✓] `absurder_db_execute_batch()`
- [✓] **Update** `src/ffi/mod.rs` to include transactions module
- [✓] **Run tests**: All 52 tests passing (47 original + 5 new)
- [✓] **Commit**: "refactor: extract ffi/transactions module"

### Phase 5: Extract FFI Prepared Statements Module ✅
- [✓] **Write test**: Verify prepared statement functions work after extraction
- [✓] **Create** `src/ffi/prepared_statements.rs` (264 lines)
- [✓] **Move structs**:
  - [✓] `PreparedStatementWrapper` (moved to registry)
- [✓] **Move functions**:
  - [✓] `absurder_db_prepare()`
  - [✓] `absurder_stmt_execute()`
  - [✓] `absurder_stmt_finalize()`
- [✓] **Update** `src/ffi/mod.rs` to include prepared_statements module
- [✓] **Run tests**: All 56 tests passing (52 original + 4 new)
- [✓] **Fix test isolation**: Fixed parallel test conflicts with unique DB names
- [✓] **Commit**: "refactor: extract ffi/prepared_statements module"

### Phase 6: Extract FFI Streaming Module ✅
- [✓] **Write test**: Verify streaming functions work after extraction
- [✓] **Create** `src/ffi/streaming.rs` (211 lines)
- [✓] **Move structs**:
  - [✓] `StreamingStatement` (already in registry)
- [✓] **Move functions**:
  - [✓] `absurder_stmt_prepare_stream()`
  - [✓] `absurder_stmt_fetch_next()`
  - [✓] `absurder_stmt_stream_close()`
- [✓] **Update** `src/ffi/mod.rs` to include streaming module
- [✓] **Run tests**: All 60 tests passing (56 original + 4 new)
- [✓] **Fix test isolation**: Added DROP TABLE IF EXISTS to all new tests
- [✓] **Commit**: "refactor: extract ffi/streaming module"

### Phase 7: Extract FFI Export/Import Module
- [ ] **Write test**: Verify export/import functions work after extraction
- [ ] **Create** `src/ffi/export_import.rs`
- [ ] **Move functions**:
  - [ ] `absurder_db_export()`
  - [ ] `absurder_db_import()`
- [ ] **Update** `src/ffi/mod.rs` to re-export
- [ ] **Run tests**: Ensure all existing tests pass
- [ ] **Commit**: "refactor: extract ffi/export_import module"

### Phase 8: Extract Android JNI Module
- [ ] **Write test**: Verify JNI bindings work after extraction
- [ ] **Create** `src/android_jni/bindings.rs`
- [ ] **Move entire** `mod android_jni` block
- [ ] **Move functions**:
  - [ ] `JNI_OnLoad()`
  - [ ] All `Java_com_npiesco_absurdersql_*` functions
- [ ] **Update** `src/android_jni/mod.rs` to re-export
- [ ] **Run tests**: Ensure all existing tests pass
- [ ] **Build Android**: Verify native library builds
- [ ] **Commit**: "refactor: extract android_jni module"

### Phase 9: Clean Up Main lib.rs
- [ ] **Update** `src/lib.rs` to only contain:
  - [ ] Module declarations (`pub mod ffi;`, `pub mod registry;`, etc.)
  - [ ] Re-exports (`pub use ffi::*;`)
  - [ ] Top-level documentation
  - [ ] Test module declarations
- [ ] **Run all tests**: Rust + TypeScript + iOS + Android
- [ ] **Verify**: Line count of `lib.rs` should be < 100 lines
- [ ] **Commit**: "refactor: finalize modular structure"

### Phase 10: Documentation & Validation
- [ ] **Update** `Design_Documentation_II.md` with new structure
- [ ] **Add** module-level documentation to each file
- [ ] **Run benchmarks**: Ensure no performance regression
- [ ] **Test on device**: iOS and Android
- [ ] **Update** this progress tree to mark complete
- [ ] **Commit**: "docs: update architecture documentation for modular FFI"

---

## Success Criteria

- ✅ All existing tests pass
- ✅ No performance regression in benchmarks
- ✅ `lib.rs` reduced from 2,442 lines to < 100 lines
- ✅ Each module has clear responsibility and documentation
- ✅ Follows parent repo's modular pattern
- ✅ iOS and Android builds work without changes
- ✅ TypeScript API continues to work unchanged

---

## Benefits

1. **Maintainability**: Easier to find and modify specific functionality
2. **Testability**: Each module can be tested independently
3. **Readability**: Clear separation of concerns
4. **Consistency**: Matches parent repo architecture
5. **Scalability**: Easier to add new features in appropriate modules

---

## Notes

- This is a pure refactoring - no functional changes
- All tests must pass at each step
- Commit after each successful module extraction
- If any step breaks tests, fix before proceeding
