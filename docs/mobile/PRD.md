# Product Requirements Document (PRD)
## AbsurderSQL Mobile: React Native FFI Integration

**Version:** 1.1  
**Date:** October 20, 2025  
**Status:** Implementation (iOS Complete)  
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
- **[X]** Expo managed workflow (requires custom native code)
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

### Implementation Status (October 20, 2025)

**iOS Platform:** ✅ **Complete and Tested**
- All 18 FFI integration tests passing
- XCFramework built for all iOS targets (device + simulator)
- React Native bridge fully functional
- JSON serialization with camelCase formatting
- Xcode 16 compatibility achieved via React Native 0.82 upgrade

**Key Technical Achievements:**
1. **Xcode 16 Compatibility:** Resolved `fmt` library incompatibility by upgrading to React Native 0.82 (includes Folly with fmt 11.0.2)
2. **JSON Format:** Implemented `#[serde(rename_all = "camelCase")]` for JavaScript-friendly API
3. **Test Coverage:** Comprehensive test suite covering all FFI boundaries, SQL operations, transactions, and error handling
4. **Build System:** Automated iOS build script (`scripts/build_ios.py`) successfully creates universal XCFramework

**Android Platform:** 🚧 **Implementation Complete, Testing Pending**
- JNI bindings implemented
- Native module built for all Android architectures
- Integration testing not yet performed

**Next Milestones:**
- Android integration testing and validation
- React Native E2E testing with example app
- Performance benchmarking
- npm package publishing

---

### Glossary
- **FFI**: Foreign Function Interface - mechanism for calling functions between languages
- **JNI**: Java Native Interface - Android's FFI system
- **XCFramework**: Apple's format for distributing binary frameworks
- **AGPL-3.0**: GNU Affero General Public License v3.0
- **LRU**: Least Recently Used (caching strategy)
- **VFS**: Virtual File System (SQLite's abstraction layer)
- **fmt**: C++ formatting library (Folly dependency that changed in LLVM 19)
