# AbsurderSQL Mobile

React Native bindings for iOS and Android, providing native SQLite with filesystem persistence.

## Status: Core Implementation Complete ✓

**55 tests passing** across all layers.

## Completed Components

### ✓ Core FFI Layer (Rust)
- C ABI interface with handle-based database management
- Thread-safe registry using `Arc<Mutex<HashMap>>`
- JSON serialization for query results
- Tokio runtime for async operations
- 10 unit tests covering all FFI functions

**Functions:**
- `absurder_db_new(name)` - Create/open database
- `absurder_db_execute(handle, sql)` - Execute SQL, returns JSON
- `absurder_db_close(handle)` - Close and cleanup
- `absurder_free_string(ptr)` - Free returned strings

### ✓ iOS Bridge (Objective-C)
- React Native module with promise-based API
- Objective-C bridge to C FFI
- 9 integration tests

**Files:**
- `ios/AbsurderSQL-Bridging-Header.h` - FFI declarations
- `ios/AbsurderSQLBridge.h` - Module interface
- `ios/AbsurderSQLBridge.m` - Module implementation

**Methods:**
- `createDatabase(name)` 
- `execute(handle, sql)`
- `close(handle)`
- `exportToFile(handle, path)` (stub)
- `importFromFile(handle, path)` (stub)

### ✓ Android Bridge (Kotlin + JNI)
- React Native module in Kotlin
- JNI bindings in Rust for Android target
- Gradle build configuration
- 12 Kotlin tests + 6 JNI tests

**Files:**
- `android/build.gradle` - Module config
- `android/src/main/AndroidManifest.xml`
- `android/src/main/kotlin/com/npiesco/absurdersql/AbsurderSQLModule.kt`
- `android/src/main/kotlin/com/npiesco/absurdersql/AbsurderSQLPackage.kt`
- `src/lib.rs` (android_jni module) - JNI bindings

**JNI Functions:**
- `Java_..._nativeCreateDb(name)` -> jlong
- `Java_..._nativeExecute(handle, sql)` -> jstring  
- `Java_..._nativeClose(handle)`

### ✓ TypeScript API
- Type-safe JavaScript/TypeScript interface
- Promise-based async API
- JSDoc documentation
- 10 structure tests + 8 package tests

**Files:**
- `src/index.ts` - Main entry point
- `package.json` - NPM package config
- `tsconfig.json` - TypeScript config

**API:**
```typescript
import { openDatabase, AbsurderDatabase } from '@npiesco/absurder-sql-mobile';

// Open database
const db = await openDatabase('myapp.db');

// Execute SQL
const result = await db.execute('SELECT * FROM users');
// result: { columns: string[], rows: any[], rowsAffected: number }

// Close
await db.close();
```

## Test Coverage

| Layer | Tests | Status |
|-------|-------|--------|
| FFI Core | 10 | ✓ All pass |
| iOS Bridge | 9 | ✓ All pass |
| Android Bridge | 12 | ✓ All pass |
| JNI Bindings | 6 | ✓ All pass |
| Package Structure | 8 | ✓ All pass |
| TypeScript Build | 10 | ✓ All pass |
| **Total** | **55** | **✓ All pass** |

## Building

### Requirements
- Rust 1.85.0+
- Node.js 18+
- TypeScript 5.0+
- For iOS: Xcode 14+, CocoaPods
- For Android: Android Studio, NDK r25+

### Rust Library
```bash
cd absurder-sql-mobile
cargo build --release
```

### TypeScript
```bash
npm install
npm run build  # Compiles to lib/
```

## Architecture

```
┌─────────────────────────────────────┐
│   React Native App (TypeScript)    │
│   src/index.ts                      │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌─────────────┐  ┌─────────────┐
│ iOS Bridge  │  │Android Bridge│
│ .m + .h     │  │ .kt + JNI   │
└──────┬──────┘  └──────┬───────┘
       │                │
       └────────┬───────┘
                ▼
       ┌─────────────────┐
       │   Rust FFI      │
       │   src/lib.rs    │
       └────────┬────────┘
                ▼
       ┌─────────────────┐
       │ AbsurderSQL Core│
       │ (SQLite + FS)   │
       └─────────────────┘
```

## Future Work

### Build & Distribution
- [ ] iOS: Build XCFramework for device + simulator
- [ ] Android: Build .so for ARM64, ARMv7, x86_64, x86
- [ ] CocoaPods integration (`.podspec`)
- [ ] Gradle packaging

### Features
- [ ] Parameterized queries (`executeWithParams`)
- [ ] Export/import functionality
- [ ] Transaction support
- [ ] Streaming results for large queries

### Testing
- [ ] iOS integration tests (XCTest)
- [ ] Android instrumentation tests
- [ ] React Native E2E tests
- [ ] Memory leak tests (Valgrind/ASan)
- [ ] Thread safety tests

## License

AGPL-3.0

## Links

- [PRD](../docs/mobile/PRD.md)
- [Design Documentation](../docs/mobile/Design_Documentation.md)
- [Planning & Progress Tree](../docs/mobile/Planning_and_Progress_Tree.md)
