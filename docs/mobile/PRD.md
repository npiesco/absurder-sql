# Product Requirements Document (PRD)
## AbsurderSQL Mobile: React Native FFI Integration

**Version:** 1.2  
**Date:** October 22, 2025  
**Status:** Implementation Complete (iOS & Android)  
**Owner:** Nicholas G. Piesco

---

## Executive Summary

Extend AbsurderSQL's dual-mode architecture to support **iOS and Android mobile applications** through React Native FFI (Foreign Function Interface). This enables developers to use the same high-performance SQLite + block storage engine from browser, CLI/server, and now **mobile platforms**, providing a unified database solution across all deployment targets.

---

## Problem Statement

### Current State
AbsurderSQL currently supports:
- **[✓]** **Browser (WASM)**: SQLite → IndexedDB with multi-tab coordination
- **[✓]** **Native (CLI/Server)**: SQLite → Filesystem via `rusqlite` and `fs_persist`

### Gap
- **[X]** **Mobile platforms** (iOS/Android) are not directly supported
- **[X]** Developers wanting to use AbsurderSQL in React Native apps must resort to WebView embedding (performance overhead, limited native integration)
- **[X]** No first-class mobile SDK with native performance

### Market Opportunity
- **React Native** has 700K+ weekly npm downloads
- **Flutter** has similar adoption but different FFI approach
- Mobile-first applications need offline-first, high-performance local databases
- Competitive landscape: SQLite wrappers (react-native-sqlite-storage, WatermelonDB) lack AbsurderSQL's unique features (export/import, block-level caching, crash recovery)

---

## Project Goals

### Primary Goals
1. **Enable React Native Integration**: Provide C FFI bindings that React Native can consume via native modules
2. **Maintain Performance**: Native SQLite speed (~1-3ms query latency) vs. WebView overhead (~5-10ms)
3. **Cross-Platform Support**: Single Rust codebase compiles to iOS (ARM64, x86_64 sim) and Android (ARM64, ARMv7, x86_64)
4. **Feature Parity**: All core features available on mobile (export/import, crash recovery, LRU caching)
5. **Developer Experience**: Simple API matching browser/native patterns

### Secondary Goals
1. **Binary Size Optimization**: Keep mobile binaries under 5MB (vs. 1.3MB WASM)
2. **Documentation**: Complete integration guides for iOS and Android
3. **Testing**: Mobile-specific test suite covering FFI boundaries

### Non-Goals (Out of Scope)
- **[X]** Flutter FFI support (future consideration)
- **[X]** Expo managed workflow (requires custom native code and expo-modules-core gradle plugin)
- **[X]** expo-sqlite comparison (requires Expo infrastructure incompatible with bare React Native)
- **[X]** Multi-process coordination (single app instance on mobile)
- **[X]** Cloud sync (developers can build on top using export/import)

---

## User Stories

### As a React Native Developer
1. **Story 1: Basic Database Operations**
   - **I want to** install AbsurderSQL as a React Native package
   - **So that I can** create, query, and manage SQLite databases in my mobile app
   - **Acceptance Criteria:**
     - Install via `npm install @npiesco/absurder-sql-mobile`
     - Link native modules with `pod install` (iOS) and Gradle sync (Android)
     - Execute SQL queries with async/await API
     - Receive typed results compatible with JavaScript

2. **Story 2: Data Export/Import**
   - **I want to** export my app's database to a file
   - **So that I can** implement backup/restore and data migration features
   - **Acceptance Criteria:**
     - Export database as standard SQLite file
     - Save to app's Documents directory (iOS) or internal storage (Android)
     - Import database from file picker or cloud download
     - Validate data integrity after import

3. **Story 3: Offline-First App**
   - **I want to** use AbsurderSQL for offline data storage
   - **So that my** app works without internet connectivity
   - **Acceptance Criteria:**
     - Database persists across app launches
     - Crash recovery ensures committed transactions survive
     - LRU caching provides fast repeated queries
     - No dependency on backend server

4. **Story 4: Performance-Critical App**
   - **I want to** achieve native SQLite performance
   - **So that my** app can handle thousands of records smoothly
   - **Acceptance Criteria:**
     - Query latency under 5ms for typical queries
     - Bulk inserts handle 1000+ records efficiently
     - Memory footprint remains reasonable (< 30MB)
     - No UI freezes during database operations

### As a Mobile App Publisher
1. **Story 5: App Store Compliance**
   - **I want to** use a well-licensed database library
   - **So that my** app meets App Store and Play Store requirements
   - **Acceptance Criteria:**
     - Clear AGPL-3.0 license documentation
     - No GPL violations from static linking
     - Binary size stays within reasonable limits
     - Works on all supported iOS/Android versions

2. **Story 6: User Data Portability**
   - **I want to** let users export their data
   - **So that I** comply with GDPR and user rights
   - **Acceptance Criteria:**
     - Users can trigger database export from settings
     - Exported file is standard SQLite (opens in DB Browser)
     - Share exported file via system share sheet
     - Clear data deletion workflow

---

## Functional Requirements

### FR-1: C FFI Layer
- **FR-1.1**: Expose C ABI functions for database lifecycle (create, execute, close)
- **FR-1.2**: Handle string encoding (UTF-8 C strings ↔ Rust String)
- **FR-1.3**: Memory management with explicit free functions
- **FR-1.4**: Thread-safe global database registry
- **FR-1.5**: Error handling via return codes and error messages

### FR-2: iOS Native Bridge
- **FR-2.1**: Objective-C/Swift module wrapping C FFI
- **FR-2.2**: Build for `aarch64-apple-ios` (devices) and `x86_64-apple-ios` (simulator)
- **FR-2.3**: XCFramework packaging for universal library
- **FR-2.4**: CocoaPods integration for dependency management
- **FR-2.5**: Promise-based JavaScript API via React Native bridge

### FR-3: Android Native Bridge
- **FR-3.1**: JNI bindings for Kotlin/Java interop
- **FR-3.2**: Build for `aarch64-linux-android`, `armv7-linux-androideabi`, `x86_64-linux-android`
- **FR-3.3**: Gradle integration with jniLibs directory structure
- **FR-3.4**: Promise-based JavaScript API via React Native native modules
- **FR-3.5**: ProGuard rules for release builds

### FR-4: JavaScript API
- **FR-4.1**: Database class with async methods (execute, query, close)
- **FR-4.2**: Export/import methods returning Promises
- **FR-4.3**: TypeScript definitions for type safety
- **FR-4.4**: Error handling with descriptive error messages
- **FR-4.5**: Lifecycle management (proper cleanup on unmount)

### FR-5: Storage Layer
- **FR-5.1**: iOS: Store in `~/Library/Application Support/` (backed up to iCloud)
- **FR-5.2**: Android: Store in `/data/data/com.yourapp/databases/` (private)
- **FR-5.3**: Leverage existing `fs_persist` feature for filesystem operations
- **FR-5.4**: Maintain block-level metadata and checksums
- **FR-5.5**: Support database directory customization

### FR-6: Testing and Quality
- **FR-6.1**: Unit tests for FFI boundary (Rust side)
- **FR-6.2**: Integration tests for iOS native bridge
- **FR-6.3**: Integration tests for Android native bridge
- **FR-6.4**: Performance benchmarks vs. competitors

---

## Non-Functional Requirements

### NFR-1: Performance
- Query latency: < 5ms (p95) for simple SELECT queries
- Bulk insert: 1000 records in < 100ms
- Export: 1MB database in < 500ms
- Memory usage: < 30MB for typical app usage
- Binary size: iOS < 4MB, Android < 5MB per architecture

### NFR-2: Compatibility
- iOS: 15.1+ (React Native 0.82 minimum, Xcode 16 compatible)
- Android: API Level 21+ (Android 5.0+)
- React Native: 0.82+ (Required for Xcode 16 - Folly includes fmt 11.0.2)
- Rust: 1.85.0+ (2024 edition)
- Node.js: 18+ for development
- Xcode: 16+ (LLVM 19 with breaking fmt library changes)

### NFR-3: Reliability
- Zero crashes from FFI boundary violations
- Memory leaks prevented via RAII and explicit cleanup
- Crash recovery restores database to last committed state
- Checksums detect data corruption
- Thread-safe operations

### NFR-4: Usability
- Installation in < 5 minutes
- API familiar to existing AbsurderSQL users
- Example app demonstrates common patterns
- Clear error messages with actionable guidance
- Migration guide from SQLite wrappers

### NFR-5: Maintainability
- Single Rust codebase for all platforms
- Automated builds for iOS and Android
- CI/CD pipeline with mobile tests
- Semantic versioning aligned with main package
- Comprehensive inline documentation

---

## Technical Constraints

### Dependencies
- **Existing:** `rusqlite`, `parking_lot`, `tokio`, `serde`, `serde_json`
- **New:** `jni` (Android), `core-foundation` (iOS), `safer-ffi` or `cbindgen`
- **Build:** `wasm-pack` not used; `cargo` with target flags

### Licensing
- AGPL-3.0 applies to mobile builds
- Static linking acceptable for AGPL (source disclosure required)
- Document license implications for app developers

### Platform Limitations
- iOS: No dynamic library loading (use static lib)
- Android: JNI overhead minimal but measurable
- React Native: Bridge overhead ~1-2ms per call
- No Web Workers on mobile (async/await sufficient)

---

## Success Metrics

### Adoption Metrics
- npm downloads: 1000+ in first month
- GitHub stars: 100+ on mobile repo

### Performance Metrics
- Query latency < 5ms (measured via integration tests)
- 10x faster than WebView-based solutions
- < 5% overhead vs. native rusqlite

### Quality Metrics
- Test coverage: > 80%
- Documentation completeness: 100% of APIs documented

### Developer Satisfaction
- Positive sentiment in GitHub issues
- Low volume of "how to" questions (indicates good docs)
- Community contributions (PRs, examples)

---

## Risks and Mitigation

### Risk 1: FFI Complexity
- **Impact:** High (can cause crashes, memory leaks)
- **Likelihood:** Medium
- **Mitigation:**
  - Use `safer-ffi` crate for type-safe FFI
  - Comprehensive unit tests at FFI boundary
  - Valgrind/AddressSanitizer in CI
  - Gradual rollout with alpha/beta releases

### Risk 2: Platform-Specific Issues
- **Impact:** Medium (blocks specific platform)
- **Likelihood:** Medium
- **Mitigation:**
  - Test on real iOS and Android devices (not just simulators)
  - Support oldest versions first (iOS 13, Android 5)
  - Maintain platform-specific test suites

### Risk 3: Binary Size
- **Impact:** Low (app store limits, user download size)
- **Likelihood:** Low
- **Mitigation:**
  - Build with `opt-level = "z"` and LTO
  - Strip symbols in release builds
  - Profile binary size and remove unused features
  - Document size in release notes

### Risk 4: React Native Version Fragmentation
- **Impact:** Medium (incompatibilities across RN versions)
- **Likelihood:** Medium
- **Mitigation:**
  - Target React Native 0.68+ (stable API)
  - Test against multiple RN versions in CI
  - Document supported versions clearly

### Risk 5: Maintenance Burden
- **Impact:** High (two new platforms to support)
- **Likelihood:** Medium
- **Mitigation:**
  - Leverage existing `fs_persist` code (95% reuse)
  - Automate builds with GitHub Actions
  - Clear contribution guidelines
  - Active community engagement

---

## Milestones and Timeline

### Foundation (Weeks 1-2)
- Set up mobile FFI crate structure
- Implement C ABI layer with core functions
- Build for iOS and Android targets
- Basic unit tests

### Platform Integration (Weeks 3-4)
- iOS Objective-C bridge
- Android JNI bridge
- JavaScript wrapper API
- TypeScript definitions

### Testing and Examples (Week 5)
- Integration tests for iOS/Android
- Performance benchmarks
- Documentation

### Polish and Release (Week 6)
- CI/CD pipeline
- Release automation
- npm package publishing
- Blog post and announcement

**Total Duration:** 6 weeks for v0.1.0 mobile release

---

## Open Questions

1. **Q:** Should we support React Native's new architecture (Fabric, Turbo Modules)?
   - **A:** Start with legacy bridge (wider compatibility), add Turbo Modules in v0.2.0

2. **Q:** How to handle async operations without blocking the main thread?
   - **A:** Use Tokio runtime in FFI layer, expose async via Promises

3. **Q:** Should we publish separate npm packages or monorepo?
   - **A:** Separate package (`@npiesco/absurder-sql-mobile`) for cleaner dependency tree

4. **Q:** What about database migration support?
   - **A:** Document manual migration; auto-migration in future release

5. **Q:** Should we support Expo?
   - **A:** Not initially (requires custom native code); explore in future

---

## Appendix

### Related Documents
- [Design Documentation](./Design_Documentation.md)
- [Planning and Progress Tree](./Planning_and_Progress_Tree.md)
- [DUAL_MODE.md](../DUAL_MODE.md) - Existing dual-mode architecture
- [CODING_STANDARDS.md](../CODING_STANDARDS.md) - Development practices

### References
- React Native Native Modules: https://reactnative.dev/docs/native-modules-intro
- Rust FFI Best Practices: https://doc.rust-lang.org/nomicon/ffi.html
- iOS Static Library Guide: https://developer.apple.com/library/archive/technotes/tn2435/
- Android JNI Guide: https://developer.android.com/training/articles/perf-jni

### Implementation Status (October 21, 2025)

**iOS Platform:** ✅ **Complete and Tested** (No Regressions)
- All 17 FFI integration tests passing
- XCFramework built for all iOS targets (device + simulator)
- React Native bridge fully functional
- JSON serialization with camelCase formatting
- Xcode 16 compatibility achieved via React Native 0.82 upgrade
- Regression testing completed after Android changes

**Android Platform:** ✅ **Complete and Tested**
- All 17 instrumentation tests passing
- All 8 React Native integration tests passing
- JNI bindings fully functional
- Native libraries built for all architectures (arm64-v8a, armeabi-v7a, x86_64, x86)
- React Native bridge tested on emulator (Pixel API 33)
- Background thread execution for export operations

**Key Technical Achievements:**
1. **Xcode 16 Compatibility:** Resolved `fmt` library incompatibility by upgrading to React Native 0.82 (includes Folly with fmt 11.0.2)
2. **JSON Format:** Implemented `#[serde(rename_all = "camelCase")]` for JavaScript-friendly API
3. **Android JNI Integration:** Full JNI implementation with Promise-based React Native bridge
4. **Export Operation Fix:** Resolved React Native bridge blocking by moving export to background thread
   - Diagnosed hanging issue using isolated ExportHangTest
   - Implemented `Thread {}.start()` wrapper for long-running operations
   - Added CoRT pattern: auto-delete export file before VACUUM INTO
5. **Test Coverage:** 42 total mobile tests (17 iOS + 17 Android instrumentation + 8 React Native integration)
6. **Build System:** Automated build scripts for both iOS (`scripts/build_ios.py`) and Android (`scripts/build_android.py`)

**React Native Integration:** ✅ **Complete and Tested**
- Full test app with 8 comprehensive integration tests
- UI test runner with real-time status updates
- Tests cover: database creation, CRUD, transactions, export, cleanup
- All tests passing on Android emulator
- Database path properly configured for Android app sandbox

**Next Milestones:**
- Performance benchmarking vs. competitors
  - ✅ react-native-sqlite-storage **COMPLETE**
  - 🔄 WatermelonDB **IN PROGRESS**
  - ⏳ expo-sqlite **PENDING**
- Documentation and API reference
- npm package publishing preparation
- CI/CD pipeline setup

---

## Competitive Analysis

### Performance Benchmarking vs. react-native-sqlite-storage (October 22, 2025)

**Tested Against:** react-native-sqlite-storage v6.0.1
**Status:** ✅ Complete on both iOS and Android

#### Android Results (test_avd, Android 13, ARM64)

| Test | AbsurderSQL | react-native-sqlite-storage | Performance Gain |
|------|-------------|----------------------------|------------------|
| 1000 INSERTs (transaction) | 385ms | 2800ms | **7.06x faster** |
| 5000 INSERTs (executeBatch) | 43ms | 520ms | **8.34x faster** |
| 100 SELECT queries | 38ms | 100ms | **3.97x faster** |
| Complex JOIN (5K+ records) | 12ms | 58ms | **4.56x faster** |

#### iOS Results (iPhone 16 Simulator, iOS 18.4)

| Test | AbsurderSQL | react-native-sqlite-storage | Performance Gain |
|------|-------------|----------------------------|------------------|
| 1000 INSERTs (transaction) | 46ms | 200ms | **4.36x faster** |
| 5000 INSERTs (executeBatch) | 18ms | 48ms | **2.66x faster** |
| 100 SELECT queries | 5ms | 10ms | **2.08x faster** |
| Complex JOIN (5K+ records) | 11ms | 19ms | **1.70x faster** |

**Key Findings:**
1. **executeBatch() API** delivers exceptional performance (8.34x on Android, 2.66x on iOS) by reducing React Native bridge overhead from N calls to 1 call
2. **Consistent advantages** across all operation types on both platforms
3. **Android shows higher peak performance** while iOS demonstrates exceptional stability
4. **Native Rust implementation** with zero-copy optimization delivers measurable real-world benefits

**Competitive Differentiation:**
- ✅ **executeBatch() API** - Not available in react-native-sqlite-storage
- ✅ **Export/Import functionality** - Native VACUUM INTO support
- ✅ **Rust-based FFI** - Memory-safe, zero-copy performance
- ✅ **Unified codebase** - Same core engine across web, CLI, and mobile

### WatermelonDB Benchmarking (October 23, 2025)

**Status:** ✅ Complete on iOS
**Package Version:** @nozbe/watermelondb@0.25.5

WatermelonDB is a reactive database framework built on top of SQLite with observables and automatic React component updates. Unlike react-native-sqlite-storage which provides direct SQLite access, WatermelonDB adds a higher-level ORM layer.

#### iOS Results (iPhone 16 Simulator, iOS 18.4)

**4 Test Runs Averaged:**

| Test | AbsurderSQL (avg) | WatermelonDB (avg) | Performance Gain |
|------|-------------------|-------------------|------------------|
| 1000 INSERTs (individual) | 7.53ms | 55ms | **7.30x faster** |
| 5000 INSERTs (batch) | 1.21ms | 1.5ms | **1.24x faster** |
| 100 SELECT queries | 1.63ms | 2.8ms | **1.72x faster** |
| Complex JOIN (5K users, 20K orders) | 21.64ms | 45ms | **2.08x faster** |

**Individual Run Data:**
- Run 1: 7.23ms, 1.24ms, 1.75ms, 23ms
- Run 2: 8.35ms, 1.31ms, 1.75ms, 20.33ms
- Run 3: 7.4ms, 1.11ms, 1.5ms, 22.88ms
- Run 4: 7.13ms, 1.18ms, 1.5ms, 20.33ms

**Key Findings:**
1. **AbsurderSQL wins all 4 tests** - Consistent performance advantage across all operation types
2. **Batch operations are competitive** - WatermelonDB's `unsafeExecute()` with bulk inserts performs well (only 1.24x difference)
3. **Individual INSERTs show largest gap** - 7.3x advantage demonstrates AbsurderSQL's superior transaction handling
4. **JOIN operations 2.08x faster** - WatermelonDB lacks eager loading (Issue #763), requiring N+1 queries for related data
5. **ORM overhead is measurable** - WatermelonDB's reactive layer and schema validation add consistent ~1.5-2x overhead

**Competitive Differentiation:**
- ✅ **Raw SQL performance** - No ORM abstraction overhead
- ✅ **Simpler API** - Direct SQL execution vs. complex Model/Query/Relation patterns
- ✅ **No schema migrations required** - Flexible schema evolution
- ✅ **Better JOIN support** - Single-query JOINs vs. WatermelonDB's N+1 problem (no eager loading)
- ✅ **executeBatch() API** - Optimized bulk operations

**Note:** WatermelonDB is designed for reactive UI updates and observable queries, not raw SQL performance. It's an excellent choice for apps prioritizing developer experience with React integration, while AbsurderSQL targets performance-critical applications needing maximum speed.

---

## Feature: PreparedStatement API (October 23, 2025)

**Status:** 🚧 Planned  
**Priority:** High  
**Target Release:** v1.3

### Problem Statement

Current `execute()` API re-parses SQL on every call, adding unnecessary overhead for repeated queries:
- **100 SELECTs** with same SQL → 100x SQL parsing  
- Bridge overhead (25-30ms) masks the parsing cost
- WatermelonDB achieves parity on SELECT benchmarks potentially due to statement caching

### Proposed Solution

Expose **prepared statement** interface for statement reuse:

```typescript
// Current approach - re-parses SQL 100 times
for (let i = 0; i < 100; i++) {
  await AbsurderSQL.execute(handle, 'SELECT * FROM users WHERE id = ?', [i]);
}

// Optimized approach - parse SQL once, reuse 100 times
const stmt = await AbsurderSQL.prepare(handle, 'SELECT * FROM users WHERE id = ?');
for (let i = 0; i < 100; i++) {
  const result = await stmt.execute([i]);
}
await stmt.finalize();
```

### API Specification

#### Core Library (Rust)

```rust
// In src/database.rs
impl SqliteIndexedDB {
    pub fn prepare(&mut self, sql: &str) -> Result<PreparedStatement, DatabaseError>;
}

pub struct PreparedStatement<'conn> {
    stmt: rusqlite::Statement<'conn>,
}

impl PreparedStatement<'_> {
    pub async fn execute(&mut self, params: &[ColumnValue]) -> Result<QueryResult, DatabaseError>;
    pub fn finalize(self) -> Result<(), DatabaseError>;
}
```

#### Mobile FFI (C API)

```c
// Returns statement handle (u64)
uint64_t absurder_db_prepare(uint64_t db_handle, const char* sql);

// Execute prepared statement with JSON params
const char* absurder_stmt_execute(uint64_t stmt_handle, const char* params_json);

// Cleanup statement
int absurder_stmt_finalize(uint64_t stmt_handle);
```

#### React Native (TypeScript)

```typescript
interface PreparedStatement {
  execute(params: any[]): Promise<QueryResult>;
  finalize(): Promise<void>;
}

interface AbsurderSQL {
  prepare(handle: number, sql: string): Promise<PreparedStatement>;
}
```

### Performance Target

**Baseline (execute):**  
- 100 SELECTs: ~30ms (0.3ms per query including bridge overhead)

**With PreparedStatement:**  
- 1x prepare + 100x execute: ~15-20ms (0.15-0.20ms per query)
- **Target: 1.5-2x improvement**

### Implementation Phases

1. **Phase 1: Core Rust** - `PreparedStatement` struct + tests
2. **Phase 2: Lifecycle** - Statement handle registry + thread safety
3. **Phase 3: Parameters** - Positional + named parameter binding
4. **Phase 4: Mobile FFI** - C bindings for iOS/Android
5. **Phase 5: React Native** - TypeScript API integration
6. **Phase 6: Benchmarking** - Update ComparisonBenchmark.tsx

### Success Metrics

- ✅ 100% test coverage for prepared statement lifecycle
- ✅ Zero memory leaks (statement cleanup verified)
- ✅ 1.5-2x performance improvement on repeated queries
- ✅ API matches SQLite's prepared statement semantics
- ✅ Comprehensive documentation with examples

### expo-sqlite Benchmarking (Pending)

**Status:** ⏳ Pending
**Package Version:** TBD

expo-sqlite is the official SQLite library for Expo-managed React Native projects. It provides a Promise-based API similar to react-native-sqlite-storage but with Expo-specific integration.

**Planned Test Coverage:**
- Same 4 benchmark tests (1000 INSERTs, 5000 INSERTs, 100 SELECTs, Complex JOIN)
- Both iOS and Android platforms
- Note: May require bare React Native workflow or Expo development build for testing

---

## Appendix

### Related Documents
- [Design Documentation](./Design_Documentation.md)
- [Planning and Progress Tree](./Planning_and_Progress_Tree.md)
- [DUAL_MODE.md](../DUAL_MODE.md) - Existing dual-mode architecture
- [CODING_STANDARDS.md](../CODING_STANDARDS.md) - Development practices

### References
- React Native Native Modules: https://reactnative.dev/docs/native-modules-intro
- Rust FFI Best Practices: https://doc.rust-lang.org/nomicon/ffi.html
- iOS Static Library Guide: https://developer.apple.com/library/archive/technotes/tn2435/
- Android JNI Guide: https://developer.android.com/training/articles/perf-jni

### Glossary
- **FFI**: Foreign Function Interface - mechanism for calling functions between languages
- **JNI**: Java Native Interface - Android's FFI system
- **XCFramework**: Apple's format for distributing binary frameworks
- **AGPL-3.0**: GNU Affero General Public License v3.0
- **LRU**: Least Recently Used (caching strategy)
- **VFS**: Virtual File System (SQLite's abstraction layer)
- **fmt**: C++ formatting library (Folly dependency that changed in LLVM 19)
