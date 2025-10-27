# Product Requirements Document (PRD) - Phase II
## AbsurderSQL Mobile: React Native FFI Integration

**Version:** 2.1  
**Last Updated:** October 26, 2025  
**Status:** Phase 4.1 COMPLETE (UniFFI Core), Phase 4.2 IN PROGRESS (iOS Bindings)  
**Target Release:** v0.3.0 (UniFFI Migration)

---

## Executive Summary

Phase I (v0.1.0) successfully delivered core AbsurderSQL functionality to React Native with iOS and Android support. Phase II focuses on advanced features, performance optimizations, and developer experience improvements.

**Phase I Achievements:**
- ✅ Core CRUD operations (create, execute, query, close)
- ✅ Export/import functionality
- ✅ Transaction support (begin, commit, rollback)
- ✅ PreparedStatement API
- ✅ Comprehensive benchmarking vs competitors
- ✅ iOS and Android native bridges
- ✅ TypeScript API with full type safety
- ✅ 8/8 React Native integration tests passing
- ✅ Performance: 6-9x faster than react-native-sqlite-storage on INSERTs

**Phase 4.1 UniFFI Core (COMPLETE - October 26, 2025):**
- ✅ All 19 UniFFI functions implemented with #[uniffi::export]
- ✅ Feature 1 (Streaming Results) - COMPLETE
- ✅ Feature 2 (Database Encryption) - COMPLETE  
- ✅ 126/126 tests passing (72 FFI + 54 UniFFI)
- ✅ Zero regressions, zero TODOs
- ✅ Production-grade error handling
- ✅ BLOB support in export/import

**Phase 4.2 iOS Bindings (IN PROGRESS):**
- 🔄 Generate Swift bindings with uniffi-bindgen-react-native
- ⏳ Replace Objective-C bridge (616 lines → auto-generated)
- ⏳ Test on iOS simulator
- ⏳ Create Turbo Module registration

---

## Phase II Goals

### Primary Goals
1. **Streaming Results** - Cursor-based pagination for large datasets
2. **Database Encryption** - SQLCipher integration for secure storage
3. **Schema Migrations** - Automated migration framework
4. **React Native New Architecture** - Turbo Modules and JSI integration
5. **DevTools Integration** - Database inspector and query builder

### Secondary Goals
1. **Background Operations** - Progress callbacks for long-running operations
2. **Testing Utilities** - Mock database and test fixtures
3. **Code Generation** - TypeScript types from schema
4. **Physical Device Testing** - Validate on real iOS and Android devices

### Non-Goals (Out of Scope for Phase II)
- Flutter FFI support (Phase III consideration)
- Expo managed workflow (requires expo-modules-core)
- Multi-process coordination (single app instance)
- Desktop platforms (Electron/Tauri)

---

## Feature Specifications

### Feature 1: Streaming Results API

**Priority:** High  
**Target Release:** v0.2.0

#### Problem Statement
Current API loads entire result sets into memory, causing performance issues and OOM crashes for large queries (>10K rows). Developers need cursor-based pagination.

#### Solution
Add streaming API that yields rows incrementally:

```typescript
async function* executeStream(sql: string, params?: any[]): AsyncIterator<Record<string, any>> {
  // Yield rows one at a time or in batches
}

// Usage
for await (const row of db.executeStream('SELECT * FROM large_table')) {
  console.log(row);
}
```

#### Success Criteria
- Handle 100K+ row queries without OOM
- <50ms latency for first row
- Batch size configurable (default 100 rows)
- Automatic cleanup on iterator break

#### Technical Design
- Rust: Implement cursor-based `Statement::query_map()` wrapper
- FFI: Add `absurder_stmt_fetch_next()` C function
- React Native: Expose as AsyncIterator in TypeScript

---

### Feature 2: Database Encryption (SQLCipher)

**Priority:** High  
**Target Release:** v0.2.0

#### Problem Statement
Mobile apps handling sensitive data (healthcare, finance, messaging) require encrypted databases. Current implementation stores data in plaintext.

#### Solution
Integrate SQLCipher for transparent encryption:

```typescript
const db = await openDatabase({
  name: 'secure.db',
  encryption: {
    key: 'user-password-or-key',
    cipher: 'aes-256-cbc',
  },
});
```

#### Success Criteria
- AES-256 encryption with minimal performance overhead (<10%)
- Key derivation with PBKDF2 (100K iterations)
- Rekey support for password changes
- Compatible with existing SQLCipher databases

#### Technical Design
- Add `sqlcipher` feature flag to Cargo.toml
- Use `rusqlite` with `bundled-sqlcipher` feature
- FFI: Add `absurder_db_new_encrypted(path, key)` function
- React Native: Add optional `encryption` config parameter

---

### Feature 3: Schema Migrations

**Priority:** Medium  
**Target Release:** v0.2.0

#### Problem Statement
Developers manually write migration SQL, leading to errors and version conflicts. Need automated framework similar to Alembic/Flyway.

#### Solution
Migration framework with version tracking:

```typescript
const migrations = [
  {
    version: 1,
    up: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)',
    down: 'DROP TABLE users',
  },
  {
    version: 2,
    up: 'ALTER TABLE users ADD COLUMN email TEXT',
    down: 'ALTER TABLE users DROP COLUMN email',
  },
];

await db.migrate(migrations);
```

#### Success Criteria
- Track current schema version in `_migrations` table
- Apply pending migrations in order
- Rollback support for failed migrations
- Dry-run mode for testing

#### Technical Design
- Pure TypeScript implementation (no Rust changes needed)
- Store version in `CREATE TABLE _migrations (version INTEGER PRIMARY KEY, applied_at TEXT)`
- Wrap migrations in transactions for atomicity

---

### Feature 4: React Native New Architecture (Turbo Modules)

**Priority:** Medium  
**Target Release:** v0.3.0 (was v0.2.1)  
**Implementation:** UniFFI for React Native

#### Problem Statement
Current bridge-based architecture has serialization overhead (~2-5ms per call). New Architecture with JSI enables zero-copy data transfer. Additionally, we maintain ~3,835 lines of manual glue code across FFI (1,434 lines), Android JNI (747 lines), iOS Objective-C (616 lines), and TypeScript (648 lines).

#### Solution
Use [UniFFI for React Native](https://github.com/jhugman/uniffi-bindgen-react-native) to auto-generate all bindings from annotated Rust code:

```rust
// Annotate existing Rust functions with UniFFI
#[uniffi::export]
pub async fn execute_query(handle: u64, sql: String) -> Result<QueryResult> {
    // Existing Rust implementation
}

// UniFFI auto-generates:
// - TypeScript types and JSI bindings
// - C++ JSI bridge layer
// - Kotlin bindings (Android)
// - Swift bindings (iOS)
// - Turbo Module registration
```

#### Success Criteria
- <1ms bridge overhead (vs current 2-5ms)
- Zero-copy for large result sets
- -95% reduction in manual glue code (3,835 → ~200 lines)
- Type safety across all layers
- Support React Native 0.74+ (New Architecture)
- All 87 tests passing with zero regressions

#### Technical Design

**Code Reduction:**
- Replace 1,434 lines of Rust FFI with ~200 lines of UniFFI annotations
- Replace 747 lines of Android JNI with auto-generated Kotlin
- Replace 616 lines of iOS Objective-C with auto-generated Swift
- Simplify 648 lines of TypeScript to auto-generated bindings + ~200 lines high-level API

**Architecture:**
```
Before (Manual):                  After (UniFFI):
TypeScript (648 lines)           TypeScript (auto-generated)
    ↓                                ↓
Bridge (2-5ms)                   JSI (<1ms, zero-copy)
    ↓                                ↓
iOS: Obj-C (616)  Android: JNI  iOS: Swift  Android: Kotlin
    ↓              ↓ (747)           ↓         ↓ (auto-gen)
C FFI (1,434 lines)               Rust (annotated)
    ↓
Rust Core
```

**Benefits:**
- **Performance:** <1ms bridge overhead, zero-copy with JSI ArrayBuffer
- **Maintainability:** Single source of truth (Rust), type safety across layers
- **Developer Experience:** Breaking changes caught at compile time
- **Production Ready:** Used in Firefox, Matrix SDK, maintained by Mozilla

**Migration Strategy:**
1. Week 1: Add UniFFI annotations, keep old FFI as fallback
2. Week 2: iOS migration with Swift bindings
3. Week 3: Android migration with Kotlin bindings
4. Week 4: TypeScript integration with auto-generated types
5. Week 5: Testing, benchmarking, documentation
6. Week 6: Remove old code, release v0.3.0

---

### Feature 5: DevTools Integration

**Priority:** Low  
**Target Release:** v0.2.2

#### Problem Statement
Developers lack visibility into database state during development. Need inspector similar to Chrome DevTools for SQLite.

#### Solution
React Native DevTools plugin:

```typescript
// In dev mode only
if (__DEV__) {
  enableDevTools(db);
}
```

Features:
- Browse tables and view data
- Execute ad-hoc queries
- View query execution plans
- Schema visualizer

#### Success Criteria
- <100KB bundle size impact
- Works with React Native Debugger
- No performance impact in production builds

#### Technical Design
- Create separate `@absurder-sql/devtools` package
- Use WebSocket to communicate with debugger
- Leverage existing `execute()` API for queries

---

## User Stories

### As a Mobile Developer

**Story 1: Streaming Large Result Sets**
- **I want to** query 50K rows without loading all into memory
- **So that** my app doesn't crash with OOM errors
- **Acceptance Criteria:**
  - Can iterate over result set with `for await`
  - Memory usage stays constant regardless of result size
  - Can break iteration early without leaks

**Story 2: Encrypt Sensitive Data**
- **I want to** encrypt my database with a user password
- **So that** data is protected if device is stolen
- **Acceptance Criteria:**
  - Database file is encrypted on disk
  - Performance overhead <10%
  - Can change encryption key

**Story 3: Automated Migrations**
- **I want to** define migrations as code
- **So that** schema changes are versioned and reproducible
- **Acceptance Criteria:**
  - Migrations run automatically on app start
  - Failed migrations rollback cleanly
  - Can see current schema version

---

## Competitive Analysis

### Phase I Results

**vs react-native-sqlite-storage (Android):**
- 6.61x faster on 1000 INSERTs
- 9.08x faster on 5000 INSERTs (executeBatch)
- 2.18x faster on 100 SELECTs
- 3.67x faster on complex JOINs

**vs WatermelonDB (Android):**
- 1.22x faster on 1000 INSERTs
- 2.21x faster on 5000 INSERTs
- 1.65x slower on 100 SELECTs (WatermelonDB wins due to query caching)
- 63.67x faster on complex JOINs (WatermelonDB's N+1 problem)

**See:** [MOBILE_BENCHMARK.md](./MOBILE_BENCHMARK.md) for full results

### Phase II Competitive Advantages

1. **Streaming Results** - Neither competitor supports cursor-based pagination
2. **SQLCipher Integration** - react-native-sqlite-storage requires manual setup; WatermelonDB doesn't support it
3. **Migration Framework** - WatermelonDB has migrations but tightly coupled to ORM; RNSS has none
4. **Turbo Modules** - First SQLite library with JSI support for zero-copy

---

## Technical Requirements

### Performance Targets
- Streaming: First row in <50ms for any query size
- Encryption: <10% overhead vs unencrypted
- Migrations: <100ms for 10 migrations
- Turbo Modules: <1ms bridge overhead

### Platform Support
- iOS: 13.0+ (ARM64, x86_64 simulator)
- Android: API 21+ (ARM64, ARMv7, x86_64, x86)
- React Native: 0.68+ (old architecture), 0.74+ (new architecture)

### Bundle Size
- Core library: <2MB (current: 1.8MB)
- DevTools: <100KB (dev only)
- SQLCipher: +500KB (optional feature)

---

## Success Metrics

### Phase II KPIs
1. **Adoption**: 1000+ npm downloads/week (current: ~50/week)
2. **Performance**: Maintain 5x+ advantage over competitors
3. **Reliability**: <0.1% crash rate in production
4. **Developer Satisfaction**: 4.5+ stars on npm (current: N/A - new package)

### Release Criteria
- All Phase II features implemented and tested
- Benchmark results documented
- Migration guide from v0.1.0
- Physical device testing complete (iOS + Android)
- Zero critical bugs

---

## Timeline

### Q1 2025 (v0.2.0)
- **Week 1-2**: Streaming Results API
- **Week 3-4**: SQLCipher Integration
- **Week 5-6**: Migration Framework
- **Week 7-8**: Testing and documentation

### Q2 2025 (v0.2.1)
- **Week 1-4**: Turbo Modules implementation
- **Week 5-6**: Physical device testing
- **Week 7-8**: Performance optimization

### Q3 2025 (v0.2.2)
- **Week 1-3**: DevTools integration
- **Week 4-6**: Testing utilities
- **Week 7-8**: Documentation and examples

---

## Open Questions

1. **Q:** Should streaming API support backpressure?
   - **A:** Yes, use AsyncIterator with configurable batch size

2. **Q:** How to handle encryption key storage?
   - **A:** Document best practices (Keychain/Keystore); don't implement key management

3. **Q:** Should migrations support TypeScript?
   - **A:** No, keep as SQL strings for simplicity; code generation is separate feature

4. **Q:** Turbo Modules backward compatibility strategy?
   - **A:** Feature detection at runtime; fallback to bridge for RN <0.74

---

## Appendix

### Related Documents
- [Design Documentation II](./Design_Documentation_II.md) - Technical architecture
- [Planning and Progress Tree II](./Planning_and_Progress_Tree_II.md) - Implementation tracking
- [Mobile Benchmarks](./MOBILE_BENCHMARK.md) - Performance results

### References
- [SQLCipher Documentation](https://www.zetetic.net/sqlcipher/)
- [React Native New Architecture](https://reactnative.dev/docs/the-new-architecture/landing-page)
- [Turbo Modules](https://reactnative.dev/docs/the-new-architecture/pillars-turbomodules)
