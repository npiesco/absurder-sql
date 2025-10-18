# Planning and Progress Tree
## AbsurderSQL Mobile: React Native FFI Integration

**Version:** 1.0  
**Last Updated:** October 17, 2025  
**Status:** Planning Phase  
**Target Release:** v0.1.0-mobile

---

## Overview

This document tracks the implementation progress of AbsurderSQL mobile support using a hierarchical checklist structure. Each checkbox represents a concrete deliverable or milestone.

**Legend:**
- **[ ]** Not started
- **[~]** In progress
- **[✓]** Complete
- **[!]** Blocked
- **[?]** Needs review

---

## Phase 1: Foundation & Setup (Weeks 1-2)

### 1.1 Project Structure
- **[ ]** Create `absurder-sql-mobile` workspace crate
  - **[ ]** Create `absurder-sql-mobile/Cargo.toml` with dependencies
  - **[ ]** Set up `crate-type = ["cdylib", "staticlib"]`
  - **[ ]** Add dependency on parent `absurder-sql` crate with `fs_persist` feature
  - **[ ]** Configure build profiles (release optimization)
- **[ ]** Set up npm package structure
  - **[ ]** Create `package.json` for `@npiesco/absurder-sql-mobile`
  - **[ ]** Define peer dependencies (react-native, react)
  - **[ ]** Set up TypeScript configuration
  - **[ ]** Create directory structure (`src/`, `ios/`, `android/`)

### 1.2 Development Environment
- **[ ]** Install Rust mobile targets
  - **[ ]** iOS: `rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim`
  - **[ ]** Android: `rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android`
- **[ ]** Set up Android NDK
  - **[ ]** Install NDK via Android Studio
  - **[ ]** Set `ANDROID_NDK_HOME` environment variable
  - **[ ]** Create `.cargo/config.toml` with NDK linker paths
- **[ ]** Install iOS development tools (macOS only)
  - **[ ]** Xcode 14+ with command-line tools
  - **[ ]** CocoaPods for dependency management
- **[ ]** Set up React Native test app
  - **[ ]** Create `examples/mobile-example` with `npx react-native init`
  - **[ ]** Configure for local package testing

### 1.3 Core FFI Layer
- [ ] Implement C ABI interface (`absurder-sql-mobile/src/lib.rs`)
  - [ ] Define database handle registry (`HashMap<u64, SqliteIndexedDB>`)
  - [ ] Implement `absurder_db_new()` - Create database
      - [ ] Accept C string name parameter
      - [ ] Create `SqliteIndexedDB` with `fs_persist` enabled
      - [ ] Store in registry with unique handle
      - [ ] Return handle (0 on error)
  - [ ] Implement `absurder_db_execute()` - Execute SQL
      - [ ] Accept handle and SQL C string
      - [ ] Look up database from registry
      - [ ] Execute on Tokio runtime (blocking)
      - [ ] Serialize `QueryResult` to JSON
      - [ ] Return JSON C string (NULL on error)
  - [ ] Implement `absurder_db_execute_with_params()` - Parameterized queries
      - [ ] Accept JSON array of parameters
      - [ ] Deserialize to `Vec<ColumnValue>`
      - [ ] Execute prepared statement
  - [ ] Implement `absurder_db_close()` - Close database
      - [ ] Remove from registry
      - [ ] Drop database (cleanup)
  - [ ] Implement `absurder_free_string()` - Free returned strings
      - [ ] Convert to `CString` and drop
  - [ ] Implement `absurder_get_error()` - Get last error
      - [ ] Thread-local error storage
      - [ ] Return error message as C string

### 1.4 Memory Safety & Error Handling
- [ ] Add safety checks in FFI layer
  - [ ] Validate handle exists before use
  - [ ] Check for null pointers
  - [ ] Validate UTF-8 encoding
  - [ ] Catch panics with `catch_unwind`
- [ ] Implement error propagation
  - [ ] Convert Rust errors to error codes
  - [ ] Store detailed error messages
  - [ ] Add logging for debugging
- [ ] Add unit tests for FFI layer
  - [ ] Test successful database creation
  - [ ] Test SQL execution (CREATE, INSERT, SELECT)
  - [ ] Test error cases (invalid handle, bad SQL)
  - [ ] Test memory cleanup (no leaks)
  - [ ] Run with Valgrind/AddressSanitizer

---

## Phase 2: Platform Integration (Weeks 3-4)

### 2.1 iOS Native Bridge
- [ ] Create iOS module structure
  - [ ] Create `ios/AbsurderSQL.xcodeproj`
  - [ ] Create `ios/AbsurderSQL-Bridging-Header.h`
  - [ ] Create `ios/AbsurderSQLBridge.h` (header)
  - [ ] Create `ios/AbsurderSQLBridge.m` (implementation)
- [ ] Implement React Native bridge methods
  - [ ] `RCT_EXPORT_MODULE()` registration
  - [ ] `createDatabase:(NSString *)name resolver:rejecter:`
      - [ ] Convert `NSString` to C string
      - [ ] Call `absurder_db_new()`
      - [ ] Store handle in instance variable
      - [ ] Resolve/reject promise
  - [ ] `execute:(NSString *)sql resolver:rejecter:`
      - [ ] Convert SQL to C string
      - [ ] Call `absurder_db_execute()`
      - [ ] Parse JSON result to `NSDictionary`
      - [ ] Free C string
      - [ ] Resolve/reject promise
  - [ ] `executeWithParams:(NSString *)sql params:(NSArray *)params resolver:rejecter:`
      - [ ] Serialize params to JSON
      - [ ] Call FFI with JSON params
  - [ ] `exportToFile:(NSString *)path resolver:rejecter:`
  - [ ] `importFromFile:(NSString *)path resolver:rejecter:`
  - [ ] `close:resolver:rejecter:`
      - [ ] Call `absurder_db_close()`
      - [ ] Clear instance handle
- [ ] Build static library
  - [ ] Build for `aarch64-apple-ios` (device)
  - [ ] Build for `x86_64-apple-ios` (Intel simulator)
  - [ ] Build for `aarch64-apple-ios-sim` (Apple Silicon simulator)
  - [ ] Create universal simulator library with `lipo`
  - [ ] Create XCFramework with `xcodebuild`
- [ ] CocoaPods integration
  - [ ] Create `AbsurderSQL.podspec`
  - [ ] Specify static library paths
  - [ ] Define dependencies (none required)
  - [ ] Test `pod install` workflow

### 2.2 Android Native Bridge
- [ ] Create Android module structure
  - [ ] Create `android/build.gradle` (module config)
  - [ ] Create `android/src/main/AndroidManifest.xml`
  - [ ] Create package structure (`com.npiesco.absurdersql`)
- [ ] Implement JNI bindings in Rust
  - [ ] Add `jni` dependency to `Cargo.toml`
  - [ ] Implement `Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeCreateDb`
      - [ ] Accept `JString` name parameter
      - [ ] Convert to Rust `String`
      - [ ] Call `absurder_db_new()`
      - [ ] Return handle as `jlong`
  - [ ] Implement `Java_..._nativeExecute`
      - [ ] Accept `jlong` handle and `JString` SQL
      - [ ] Call `absurder_db_execute()`
      - [ ] Convert result to `jstring` (JSON)
  - [ ] Implement `Java_..._nativeExecuteWithParams`
  - [ ] Implement `Java_..._nativeExport`
  - [ ] Implement `Java_..._nativeImport`
  - [ ] Implement `Java_..._nativeClose`
- [ ] Implement Kotlin native module
  - [ ] Create `AbsurderSQLModule.kt`
  - [ ] Extend `ReactContextBaseJavaModule`
  - [ ] Load native library in static block
  - [ ] Implement `@ReactMethod createDatabase(name: String, promise: Promise)`
      - [ ] Call JNI method
      - [ ] Store handle
      - [ ] Resolve/reject promise
  - [ ] Implement `@ReactMethod execute(sql: String, promise: Promise)`
      - [ ] Call JNI method
      - [ ] Parse JSON to `WritableMap`
      - [ ] Resolve/reject promise
  - [ ] Implement `@ReactMethod executeWithParams(...)`
  - [ ] Implement `@ReactMethod exportToFile(...)`
  - [ ] Implement `@ReactMethod importFromFile(...)`
  - [ ] Implement `@ReactMethod close(...)`
  - [ ] Create `AbsurderSQLPackage.kt` (register module)
- [ ] Build shared libraries
  - [ ] Build for `aarch64-linux-android` (ARM64)
  - [ ] Build for `armv7-linux-androideabi` (ARMv7)
  - [ ] Build for `x86_64-linux-android` (x86_64 emulator)
  - [ ] Build for `i686-linux-android` (x86 emulator)
  - [ ] Copy to `android/src/main/jniLibs/` structure
      - [ ] `jniLibs/arm64-v8a/libabsurder_sql_mobile.so`
      - [ ] `jniLibs/armeabi-v7a/libabsurder_sql_mobile.so`
      - [ ] `jniLibs/x86_64/libabsurder_sql_mobile.so`
      - [ ] `jniLibs/x86/libabsurder_sql_mobile.so`
- [ ] Gradle integration
  - [ ] Configure `android/build.gradle`
  - [ ] Add ProGuard rules for JNI methods
  - [ ] Test Gradle sync

### 2.3 JavaScript/TypeScript API
- [ ] Create TypeScript source files
  - [ ] `src/index.ts` - Main entry point
  - [ ] `src/Database.ts` - Database class
  - [ ] `src/types.ts` - TypeScript interfaces
- [ ] Implement `Database` class
  - [ ] Static `create(name: string): Promise<Database>`
      - [ ] Call `NativeModules.AbsurderSQL.createDatabase()`
      - [ ] Return new instance
  - [ ] `execute(sql: string): Promise<QueryResult>`
      - [ ] Call native module
      - [ ] Return typed result
  - [ ] `executeWithParams(sql: string, params: any[]): Promise<QueryResult>`
  - [ ] `query(sql: string): Promise<Array<Record<string, any>>>`
      - [ ] Convenience wrapper returning rows only
  - [ ] `exportToFile(path?: string): Promise<string>`
      - [ ] Default path: Documents directory
      - [ ] Return actual file path
  - [ ] `importFromFile(path: string): Promise<void>`
  - [ ] `close(): Promise<void>`
- [ ] Define TypeScript interfaces
  - [ ] `QueryResult` - rows, rowsAffected, lastInsertId
  - [ ] `DatabaseConfig` - optional settings
  - [ ] `ExportOptions` - path, compression
- [ ] Add JSDoc comments
  - [ ] Document all public methods
  - [ ] Add usage examples
  - [ ] Document error handling
- [ ] Build TypeScript to JavaScript
  - [ ] Configure `tsconfig.json`
  - [ ] Build to `lib/` directory
  - [ ] Generate `.d.ts` declaration files

---

## Phase 3: Testing & Documentation (Week 5)

### 3.1 Unit Testing (Rust)
- [ ] FFI layer tests
  - [ ] Test `absurder_db_new` returns valid handle
  - [ ] Test `absurder_db_new` with invalid name returns 0
  - [ ] Test `absurder_db_execute` with CREATE TABLE
  - [ ] Test `absurder_db_execute` with INSERT
  - [ ] Test `absurder_db_execute` with SELECT returns JSON
  - [ ] Test `absurder_db_execute` with invalid handle returns NULL
  - [ ] Test `absurder_db_execute` with bad SQL returns NULL
  - [ ] Test `absurder_db_close` removes from registry
  - [ ] Test `absurder_free_string` doesn't crash
  - [ ] Test concurrent operations (thread safety)
- [ ] Memory leak tests
  - [ ] Run with Valgrind (Linux)
  - [ ] Run with AddressSanitizer (all platforms)
  - [ ] Verify no memory leaks after 1000 operations
  - [ ] Test handle cleanup on drop

### 3.2 Integration Testing (iOS)
- [ ] Create iOS test app
  - [ ] Xcode test project
  - [ ] Link AbsurderSQL XCFramework
  - [ ] XCTest suite
- [ ] Test native bridge
  - [ ] Test database creation
  - [ ] Test SQL execution (CREATE, INSERT, SELECT)
  - [ ] Test query results parsing
  - [ ] Test error handling (bad SQL, invalid handle)
  - [ ] Test export/import
  - [ ] Test database close
- [ ] Test on simulators
  - [ ] iPhone 14 (x86_64 or ARM64 depending on Mac)
  - [ ] iPad Pro
- [ ] Test on physical devices
  - [ ] iPhone (ARM64)
  - [ ] iPad (ARM64)

### 3.3 Integration Testing (Android)
- [ ] Create Android test app
  - [ ] Android Studio test project
  - [ ] Add module dependency
  - [ ] JUnit + Espresso tests
- [ ] Test native bridge
  - [ ] Test database creation
  - [ ] Test SQL execution
  - [ ] Test query results parsing
  - [ ] Test error handling
  - [ ] Test export/import
  - [ ] Test database close
- [ ] Test on emulators
  - [ ] Pixel 6 (ARM64)
  - [ ] Pixel 6 (x86_64)
- [ ] Test on physical devices
  - [ ] Samsung Galaxy (ARM64)
  - [ ] Pixel (ARM64)

### 3.4 E2E Testing (React Native)
- [ ] Create example React Native app
  - [ ] Initialize with `npx react-native init MobileExample`
  - [ ] Install `@npiesco/absurder-sql-mobile` locally
  - [ ] Link native modules
- [ ] Implement test scenarios
  - [ ] Create database on app launch
  - [ ] Create table and insert sample data
  - [ ] Display data in FlatList
  - [ ] Test CRUD operations
  - [ ] Test export database to Files app (iOS) / Downloads (Android)
  - [ ] Test import database from file picker
  - [ ] Test app persistence (close and reopen)
- [ ] Add Detox E2E tests
  - [ ] Install Detox dependencies
  - [ ] Configure iOS and Android
  - [ ] Write E2E test suite
  - [ ] Run on CI

### 3.5 Performance Benchmarking
- [ ] Create benchmark suite
  - [ ] Simple SELECT (1 row)
  - [ ] Simple SELECT (100 rows)
  - [ ] Bulk INSERT (1000 rows in transaction)
  - [ ] Complex JOIN query
  - [ ] Export 1MB database
  - [ ] Import 1MB database
- [ ] Run benchmarks
  - [ ] iOS (iPhone 14 Pro)
  - [ ] Android (Pixel 6)
- [ ] Compare against competitors
  - [ ] react-native-sqlite-storage
  - [ ] WatermelonDB
  - [ ] Raw SQLite via expo-sqlite
- [ ] Document results in README

### 3.6 Documentation
- [ ] Create user documentation
  - [ ] `docs/mobile/README.md` - Getting started guide
  - [ ] `docs/mobile/INSTALLATION.md` - Installation instructions
  - [ ] `docs/mobile/API.md` - Complete API reference
  - [ ] `docs/mobile/EXAMPLES.md` - Code examples
  - [ ] `docs/mobile/TROUBLESHOOTING.md` - Common issues
  - [ ] `docs/mobile/MIGRATION.md` - Migrating from other SQLite libraries
- [ ] Add inline code documentation
  - [ ] JSDoc comments for all public APIs
  - [ ] Rust doc comments for FFI functions
  - [ ] README in example app
- [ ] Create video tutorial (optional)
  - [ ] 5-minute quickstart video
  - [ ] Upload to YouTube
  - [ ] Link from README

---

## Phase 4: Release & Deployment (Week 6)

### 4.1 Build Automation
- [ ] Create build scripts
  - [ ] `scripts/build-mobile.sh` - Build all platforms
  - [ ] `scripts/build-ios.sh` - iOS-specific build
  - [ ] `scripts/build-android.sh` - Android-specific build
  - [ ] `scripts/test-mobile.sh` - Run all tests
- [ ] Set up GitHub Actions CI/CD
  - [ ] Create `.github/workflows/mobile-ci.yml`
  - [ ] Build on: push to main, PRs
  - [ ] Matrix build: iOS (macOS runner), Android (Linux runner)
  - [ ] Run Rust unit tests
  - [ ] Run iOS integration tests
  - [ ] Run Android integration tests
  - [ ] Run E2E tests with Detox
  - [ ] Cache Rust dependencies
  - [ ] Cache NDK and Xcode tools
- [ ] Set up release workflow
  - [ ] Create `.github/workflows/mobile-release.yml`
  - [ ] Trigger on: git tag `v*-mobile`
  - [ ] Build all platforms
  - [ ] Create GitHub release
  - [ ] Upload artifacts (XCFramework, jniLibs)
  - [ ] Publish to npm automatically

### 4.2 Package Publishing
- [ ] Prepare npm package
  - [ ] Update `package.json` metadata
      - [ ] Name: `@npiesco/absurder-sql-mobile`
      - [ ] Version: `0.1.0-beta.1`
      - [ ] Description, keywords, repository
  - [ ] Create `.npmignore` (exclude tests, examples)
  - [ ] Include compiled artifacts
      - [ ] `lib/` (compiled TypeScript)
      - [ ] `ios/` (XCFramework)
      - [ ] `android/` (jniLibs, Gradle files)
  - [ ] Add `postinstall` script for CocoaPods
- [ ] Test local installation
  - [ ] `npm pack` to create tarball
  - [ ] Install in example app: `npm install ../absurder-sql-mobile-0.1.0.tgz`
  - [ ] Verify iOS and Android work
  - [ ] Test on fresh React Native project
- [ ] Publish to npm
  - [ ] Beta release: `npm publish --tag beta`
  - [ ] Gather feedback from early testers
  - [ ] Fix critical issues
  - [ ] Stable release: `npm publish`
  - **[ ]** Test on fresh React Native project
- **[ ]** Publish to npm
  - **[ ]** Beta release: `npm publish --tag beta`
  - **[ ]** Gather feedback from early testers
  - **[ ]** Fix critical issues
  - **[ ]** Stable release: `npm publish`

### 4.3 Documentation & Announcement
- **[ ]** Update main README
  - **[ ]** Add "Mobile Support" section
  - **[ ]** Link to mobile documentation
  - **[ ]** Add installation instructions
  - **[ ]** Add mobile example code
- **[ ]** Create blog post
  - **[ ]** Announce mobile support
  - **[ ]** Explain architecture and benefits
  - **[ ]** Show code examples
  - **[ ]** Link to documentation
  - **[ ]** Publish on personal blog / dev.to / Medium
- **[ ]** Social media announcement
  - **[ ]** Twitter/X post
  - **[ ]** LinkedIn post
  - **[ ]** Reddit (r/reactnative, r/rust)
  - **[ ]** Hacker News (Show HN)
- **[ ]** Submit to directories
  - **[ ]** React Native Directory
  - **[ ]** Awesome React Native list
  - **[ ]** crates.io (if published separately)

### 4.4 Post-Release Support
- **[ ]** Monitor issues
  - **[ ]** Set up GitHub issue templates
  - **[ ]** Triage new issues within 24 hours
  - **[ ]** Label: bug, enhancement, question
- **[ ]** Community engagement
  - **[ ]** Answer questions in discussions
  - **[ ]** Review pull requests
  - **[ ]** Update documentation based on feedback
- **[ ]** Plan next release
  - **[ ]** Collect feature requests
  - **[ ]** Prioritize roadmap
  - **[ ]** Create v0.2.0 milestone

---

## Future Enhancements (Post v0.1.0)

### Advanced Features
- **[ ]** Transaction support
  - **[ ]** `beginTransaction()` / `commit()` / `rollback()` API
  - **[ ]** Nested transactions
  - **[ ]** Savepoints
- **[ ]** Streaming results
  - **[ ]** Cursor-based pagination
  - **[ ]** Lazy loading for large result sets
- **[ ]** Background operations
  - **[ ]** Export/import on background thread
  - **[ ]** Progress callbacks
- **[ ]** Database encryption
  - **[ ]** SQLCipher integration
  - **[ ]** Key management
- **[ ]** Schema migrations
  - **[ ]** Migration framework
  - **[ ]** Version tracking
  - **[ ]** Rollback support

### Platform Expansions
- **[ ]** Flutter support
  - **[ ]** Dart FFI bindings
  - **[ ]** Flutter plugin
  - **[ ]** Publish to pub.dev
- **[ ]** Expo compatibility
  - **[ ]** Explore Expo modules approach
  - **[ ]** Config plugin for easy setup
- **[ ]** React Native New Architecture
  - **[ ]** Turbo Native Modules
  - **[ ]** Fabric renderer compatibility
  - **[ ]** JSI integration for zero-copy

### Developer Experience
- **[ ]** DevTools integration
  - **[ ]** Database inspector
  - **[ ]** Query builder UI
  - **[ ]** Schema visualizer
- **[ ]** Code generation
  - **[ ]** TypeScript types from schema
  - **[ ]** Query builder utilities
- **[ ]** Testing utilities
  - **[ ]** Mock database for tests
  - **[ ]** Test data fixtures
  - **[ ]** Snapshot testing

---

## Risk Tracking

### Active Risks
- **[!]** **Risk:** FFI memory safety issues
  - **Status:** Not started
  - **Mitigation:** Comprehensive testing with Valgrind/ASan
  - **Owner:** Core team
  
- **[!]** **Risk:** Platform-specific bugs
  - **Status:** Not started
  - **Mitigation:** Test on real devices, not just simulators
  - **Owner:** Platform maintainers

- **[!]** **Risk:** React Native version fragmentation
  - **Status:** Not started
  - **Mitigation:** CI testing across RN 0.68, 0.70, 0.72
  - **Owner:** CI/CD team

### Resolved Risks
- None yet

---

## Dependencies & Prerequisites

### Completed Prerequisites
- **[✓]** AbsurderSQL core (v0.1.7+)
- **[✓]** `fs_persist` feature working
- **[✓]** Export/import functionality tested
- **[✓]** Documentation infrastructure

### Pending Prerequisites
- **[ ]** Rust 1.85.0+ installed
- **[ ]** iOS development environment (macOS + Xcode)
- **[ ]** Android development environment (Android Studio + NDK)
- **[ ]** React Native CLI tools
- **[ ]** Node.js 18+

---

## Success Criteria

### Must Have (v0.1.0)
- **[✓]** Builds successfully for iOS (ARM64, x86_64 sim)
- **[✓]** Builds successfully for Android (ARM64, ARMv7, x86_64, x86)
- **[✓]** Core operations work: create, execute, query, close
- **[✓]** Export/import functionality
- **[✓]** Type-safe TypeScript API
- **[✓]** Example React Native app
- **[✓]** Documentation complete
- **[✓]** Published to npm

### Should Have
- **[ ]** < 5ms query latency (p95)
- **[ ]** < 5MB binary size per architecture
- **[ ]** 80%+ test coverage
- **[ ]** Zero critical bugs
- **[ ]** CI/CD pipeline green

### Nice to Have
- **[ ]** Video tutorial
- **[ ]** Migration guide from competitors
- **[ ]** Performance benchmarks published
- **[ ]** Community contributions (PRs)

---

## Timeline Summary

| Phase | Duration | Status | Target Completion |
|-------|----------|--------|-------------------|
| Phase 1: Foundation | 2 weeks | **[ ]** Not started | Week of Nov 1 |
| Phase 2: Platform Integration | 2 weeks | **[ ]** Not started | Week of Nov 15 |
| Phase 3: Testing & Docs | 1 week | **[ ]** Not started | Week of Nov 22 |
| Phase 4: Release | 1 week | **[ ]** Not started | Week of Nov 29 |
| **Total** | **6 weeks** | **0% complete** | **Nov 29, 2025** |

---

## Notes

### Decision Log
- **Oct 17, 2025**: Chose React Native FFI over Flutter (larger ecosystem, team expertise)
- **Oct 17, 2025**: Decided on handle-based FFI API (safer than raw pointers)
- **Oct 17, 2025**: JSON serialization for results (simplicity over performance)

### Open Questions
- Should we support React Native new architecture (Turbo Modules) in v0.1.0? → **Defer to v0.2.0**
- Separate npm package or monorepo? → **Separate package for cleaner deps**
- Support Expo managed workflow? → **Not in v0.1.0 (requires config plugin)**

### Resources
- [React Native Native Modules Docs](https://reactnative.dev/docs/native-modules-intro)
- [Rust FFI Nomicon](https://doc.rust-lang.org/nomicon/ffi.html)
- [iOS Static Library Guide](https://developer.apple.com/library/archive/technotes/tn2435/)
- [Android JNI Tips](https://developer.android.com/training/articles/perf-jni)

---

**Last Updated:** October 17, 2025  
**Next Review:** Start of Phase 1 (Nov 1, 2025)
