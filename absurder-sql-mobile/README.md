# AbsurderSQL Mobile

React Native bindings for iOS and Android using **UniFFI** for auto-generated bindings, providing native SQLite with filesystem persistence and SQLCipher encryption.

## Status: Production Ready [x]

**Version:** 0.3.0 (Phase 4.2 Complete)  
**Last Updated:** October 29, 2025  
**Architecture:** UniFFI 0.29 + React Native Turbo Modules  
**Test Coverage:** 
- 141 Rust tests (69 FFI + 72 UniFFI) - all passing
- 13 React Native integration tests - all passing
- Zero regressions

**Platforms:**
- [x] iOS (encryption via CommonCrypto)
- [x] Android (encryption via pre-built SQLCipher + OpenSSL)

---

## Architecture Overview

### Current Architecture (UniFFI-based)

```
┌─────────────────────────────────────────┐
│   React Native App (TypeScript)         │
│   - Auto-generated TypeScript bindings  │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌─────────────┐  ┌─────────────────┐
│iOS (Swift)  │  │Android (Kotlin) │
│Auto-generated│  │Auto-generated   │
│via UniFFI   │  │via UniFFI       │
└──────┬──────┘  └──────┬──────────┘
       │                │
       └────────┬───────┘
                ▼
       ┌─────────────────────┐
       │  Rust UniFFI API    │
       │  20 exported funcs  │
       │  src/uniffi_api/    │
       └────────┬────────────┘
                ▼
       ┌─────────────────────┐
       │ AbsurderSQL Core    │
       │ (Rust + SQLite)     │
       └─────────────────────┘
```

### What Changed from Phase I

**Removed (3,835 lines of manual glue code):**
- ~~Android JNI bindings~~ (747 lines) → Replaced by UniFFI auto-generated Kotlin
- Manual FFI still exists for backward compatibility (1,434 lines kept)
- iOS Objective-C bridge still in use (616 lines) - Swift migration pending

**Added:**
- `src/uniffi_api/` - UniFFI exported functions (core.rs, types.rs, mod.rs)
- `ubrn.config.yaml` - UniFFI bindgen React Native configuration
- Auto-generated TypeScript, Kotlin, and C++ bindings
- Pre-built SQLCipher libraries for Android (all ABIs)

---

## Key Features

### 1. UniFFI Auto-Generated Bindings
- **20 exported functions** with `#[uniffi::export]` macro
- Automatic TypeScript, Kotlin, and Swift bindings
- Type-safe across all layers (Rust → TypeScript)
- Zero manual synchronization needed

### 2. Database Encryption (SQLCipher)
- **iOS:** Uses `encryption-ios` feature with bundled SQLCipher + CommonCrypto
- **Android:** Pre-built SQLCipher 4.6.0 + OpenSSL 1.1.1w static libraries
- AES-256 encryption at rest
- `create_encrypted_database()` and `rekey_database()` APIs

### 3. Performance Optimizations
- **Cursor-based streaming:** O(n) complexity with `WHERE rowid > last_rowid`
- **Index creation helpers:** `create_index(table, columns)` API
- **Mobile-optimized config:** WAL mode, 20K cache pages, auto-vacuum

### 4. Core Database Operations
- Create, execute, query with params
- Transactions (begin, commit, rollback)
- Prepared statements
- Export/import (VACUUM INTO)
- Batch operations
- BLOB support

---

## Encryption Setup - Critical Details

### Android: Pre-Built SQLCipher Libraries

**The Problem We Solved:**
- Rust requires Position Independent Code (`-fPIC`) for Android shared libraries
- Building SQLCipher from source during Rust compilation was slow and unreliable
- Environment pollution from Android NDK broke iOS builds

**The Solution:**
Pre-built static libraries with `-fPIC` flag for all Android ABIs.

**Directory Structure:**
```
android/src/main/jni/sqlcipher-libs/
├── arm64-v8a/
│   ├── libsqlcipher.a  (1.6MB)
│   ├── libcrypto.a     (4.8MB)
│   └── libssl.a        (997KB)
├── armeabi-v7a/        (same structure)
├── x86/                (same structure)
├── x86_64/             (same structure)
└── include/
    ├── sqlite3.h
    └── openssl/        (full header tree)
```

**How We Built Them:**

1. **OpenSSL 1.1.1w** (for each ABI):
```bash
# Example for arm64-v8a
export ANDROID_NDK_HOME=$HOME/Library/Android/sdk/ndk/27.1.12297006
cd /tmp && tar xzf openssl-1.1.1w.tar.gz && cd openssl-1.1.1w

./Configure android-arm64 \
  -D__ANDROID_API__=23 \
  no-shared \
  no-asm \        # Critical: Avoids assembly PIC issues
  -fPIC \         # Critical: Position Independent Code
  --prefix=/tmp/openssl-arm64-v8a

make -j8 && make install_sw
```

2. **SQLCipher 4.6.0** (for each ABI):
```bash
cd /tmp && tar xzf sqlcipher.tar.gz && cd sqlcipher-4.6.0

export TOOLCHAIN=$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/darwin-x86_64
export CC="$TOOLCHAIN/bin/clang --target=aarch64-linux-android23"
export AR=$TOOLCHAIN/bin/llvm-ar
export RANLIB=$TOOLCHAIN/bin/llvm-ranlib

./configure \
  --host=aarch64-linux-android \
  --with-crypto-lib=openssl \
  --enable-tempstore=yes \
  --disable-tcl \
  CFLAGS="-D__ANDROID_API__=23 -DSQLITE_HAS_CODEC -fPIC -I/tmp/openssl-arm64-v8a/include" \
  CPPFLAGS="-I/tmp/openssl-arm64-v8a/include" \
  LDFLAGS="-L/tmp/openssl-arm64-v8a/lib" \
  LIBS="-lcrypto -lssl"

make -j8

# Extract sqlite3.o and archive it
cd .libs
llvm-ar rcs libsqlcipher.a sqlite3.o
cp libsqlcipher.a ~/path/to/android/src/main/jni/sqlcipher-libs/arm64-v8a/
cp /tmp/openssl-arm64-v8a/lib/libcrypto.a ~/path/to/android/src/main/jni/sqlcipher-libs/arm64-v8a/
cp /tmp/openssl-arm64-v8a/lib/libssl.a ~/path/to/android/src/main/jni/sqlcipher-libs/arm64-v8a/
```

**Rust Configuration:**

`.cargo/config.toml`:
```toml
[target.aarch64-linux-android]
linker = "aarch64-linux-android21-clang"
ar = "llvm-ar"
rustflags = [
    "-C", "relocation-model=pic",
    "-L", "native=absurder-sql-mobile/android/src/main/jni/sqlcipher-libs/arm64-v8a"
]

[target.armv7-linux-androideabi]
linker = "armv7a-linux-androideabi21-clang"
ar = "llvm-ar"
rustflags = [
    "-C", "relocation-model=pic",
    "-L", "native=absurder-sql-mobile/android/src/main/jni/sqlcipher-libs/armeabi-v7a"
]

[target.i686-linux-android]
linker = "i686-linux-android21-clang"
ar = "llvm-ar"
rustflags = [
    "-C", "relocation-model=pic",
    "-L", "native=absurder-sql-mobile/android/src/main/jni/sqlcipher-libs/x86"
]

[target.x86_64-linux-android]
linker = "x86_64-linux-android21-clang"
ar = "llvm-ar"
rustflags = [
    "-C", "relocation-model=pic",
    "-L", "native=absurder-sql-mobile/android/src/main/jni/sqlcipher-libs/x86_64"
]
```

`build.rs`:
```rust
fn main() {
    let target = env::var("TARGET").unwrap();
    
    // For Android: Use pre-built SQLCipher and OpenSSL static libraries
    if target.contains("android") {
        let abi = if target.contains("aarch64") {
            "arm64-v8a"
        } else if target.contains("armv7") {
            "armeabi-v7a"
        } else if target.contains("i686") {
            "x86"
        } else if target.contains("x86_64") {
            "x86_64"
        } else {
            "arm64-v8a" // default
        };
        
        let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
        let lib_dir = manifest_dir.join(format!("android/src/main/jni/sqlcipher-libs/{}", abi));
        let include_dir = manifest_dir.join("android/src/main/jni/sqlcipher-libs/include");
        
        println!("cargo:rustc-link-search=native={}", lib_dir.display());
        println!("cargo:rustc-link-lib=static=sqlcipher");
        println!("cargo:rustc-link-lib=static=crypto");
        
        // Tell libsqlite3-sys to use our prebuilt SQLCipher
        unsafe {
            env::set_var("SQLCIPHER_LIB_DIR", lib_dir.to_str().unwrap());
            env::set_var("SQLCIPHER_INCLUDE_DIR", include_dir.to_str().unwrap());
            env::set_var("LIBSQLITE3_SYS_USE_PKG_CONFIG", "0");
        }
    }
}
```

### iOS: Bundled SQLCipher with CommonCrypto

**Much Simpler:**
- Uses `encryption-ios` feature in Cargo.toml
- Compiles SQLCipher from source with CommonCrypto
- No OpenSSL dependency (CommonCrypto is built into iOS)

**Cargo.toml features:**
```toml
[features]
encryption = ["absurder-sql/encryption", "fs_persist"]  # Android
encryption-ios = ["absurder-sql/encryption-ios", "fs_persist"]  # iOS
```

**Parent crate's Cargo.toml:**
```toml
encryption = ["rusqlite", "rusqlite/sqlcipher"]  # Android: expects pre-built libs
encryption-commoncrypto = ["rusqlite", "rusqlite/bundled-sqlcipher"]  # iOS: builds from source
encryption-ios = ["encryption-commoncrypto"]  # Alias for convenience
```

---

## Building

### Requirements

- **Rust:** 1.85.0+
- **Node.js:** 18+ (for React Native)
- **Python:** 3.x (for build scripts)

**For iOS:**
- Xcode 14+
- CocoaPods
- iOS Simulator or device

**For Android:**
- Android Studio
- Android NDK 27.1.12297006 (or compatible)
- Android SDK with API 23+
- Emulator or device

### Rust Targets

Install all required targets:

```bash
# iOS
rustup target add aarch64-apple-ios           # ARM64 devices
rustup target add aarch64-apple-ios-sim       # Apple Silicon simulator

# Android
rustup target add aarch64-linux-android       # ARM64 devices
rustup target add armv7-linux-androideabi     # ARMv7 devices
rustup target add i686-linux-android          # x86 emulator
rustup target add x86_64-linux-android        # x86_64 emulator
```

### Build Process

#### iOS Build

```bash
cd absurder-sql-mobile

# Build Rust + generate UniFFI bindings
npm run ubrn:ios

# Install CocoaPods
cd react-native/ios && pod install && cd ../..

# Run on simulator
cd react-native
npx react-native run-ios --simulator="iPhone 16"
```

The `npm run ubrn:ios` script:
- Builds Rust for `aarch64-apple-ios` and `aarch64-apple-ios-sim`
- Generates Swift bindings via UniFFI
- Creates `.xcframework`
- Generates TypeScript bindings

#### Android Build

```bash
cd absurder-sql-mobile

# Build Rust + generate UniFFI bindings + fix RN 0.82 compatibility
npm run ubrn:android

# Bundle React Native app and build APK
cd react-native
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
cd android && ./gradlew assembleDebug

# Install to emulator/device
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.absurdersqltestapp/.MainActivity
```

The `npm run ubrn:android` script:
- Builds Rust for all 4 Android ABIs (arm64-v8a, armeabi-v7a, x86, x86_64)
- Generates Kotlin bindings via UniFFI
- Copies `.a` libraries to `jniLibs/`
- Generates TypeScript bindings
- **Runs `scripts/fix_cpp_adapter.py`** to fix React Native 0.82 compatibility issues

**Critical:** The `fix_cpp_adapter.py` script replaces UniFFI's generated `cpp-adapter.cpp` with a React Native 0.82-compatible version. This step is required because UniFFI generates code that's incompatible with RN 0.82's `CallInvokerHolder` API.

### Important: Clean Build Environments

**Critical Lesson Learned:**
Android NDK environment variables contaminate iOS builds. Always use separate terminal sessions.

**For iOS builds, ensure no Android NDK in environment:**
```bash
# Check environment is clean
printenv | grep -E "CC|ANDROID|NDK|CLANG|AR_|RANLIB"
# Should return nothing

# If polluted, start a new terminal session
```

**For Android builds, environment variables are okay.**

---

## Configuration Files

### ubrn.config.yaml

Configures UniFFI bindgen for React Native:

```yaml
name: AbsurderSQL

rust:
  directory: .
  manifestPath: Cargo.toml

ios:
  enabled: true
  deploymentTarget: "13.0"
  targets:
    - aarch64-apple-ios           # iOS devices
    - aarch64-apple-ios-sim       # iOS simulator (Apple Silicon)
  cargoExtras:
    - --features
    - uniffi-bindings,encryption-ios,fs_persist

android:
  enabled: true
  targets:
    - arm64-v8a                   # ARM64 devices
    - armeabi-v7a                 # ARMv7 devices
    - x86                         # x86 emulator
    - x86_64                      # x86_64 emulator
  cargoExtras:
    - --features
    - uniffi-bindings,encryption,fs_persist

turboModule:
  entrypoint: "src/index.ts"
```

### Cargo.toml

Key dependencies and features:

```toml
[dependencies]
absurder-sql = { path = "..", features = ["fs_persist"], default-features = false }
uniffi = { version = "0.29", features = ["tokio"], optional = true }
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

[target.'cfg(target_os = "android")'.dependencies]
jni = { version = "0.21", default-features = false }
android_logger = "0.14"

[features]
default = ["bundled-sqlite"]
fs_persist = ["absurder-sql/fs_persist"]
bundled-sqlite = ["absurder-sql/bundled-sqlite", "fs_persist"]
encryption = ["absurder-sql/encryption", "fs_persist"]  # Android
encryption-ios = ["absurder-sql/encryption-ios", "fs_persist"]  # iOS
uniffi-bindings = ["uniffi"]
```

---

## API Reference

### TypeScript API (Auto-Generated by UniFFI)

```typescript
import { 
  createDatabase, 
  createEncryptedDatabase,
  execute,
  executeWithParams,
  closeDatabase,
  createIndex,
  DatabaseConfig 
} from 'absurder-sql-mobile';

// Create regular database
const config: DatabaseConfig = {
  name: 'myapp.db',
  encryptionKey: null,
};
const handle = await createDatabase(config);

// Create encrypted database
const encryptedConfig: DatabaseConfig = {
  name: 'secure.db',
  encryptionKey: 'my-secret-key-min-8-chars',
};
const encHandle = await createEncryptedDatabase(encryptedConfig);

// Execute SQL
const result = await execute(handle, 'SELECT * FROM users');
// result: { columns: string[], rows: any[], rowsAffected: number }

// Parameterized query
const params = JSON.stringify([{ type: 'Text', value: 'john@example.com' }]);
const result2 = await executeWithParams(handle, 
  'SELECT * FROM users WHERE email = ?', params);

// Create index for performance
await createIndex(handle, 'users', 'email');  // Single column
await createIndex(handle, 'orders', 'user_id,created_at');  // Multi-column

// Close database
await closeDatabase(handle);
```

### Rust UniFFI API (src/uniffi_api/core.rs)

All functions are exported with `#[uniffi::export]`:

**Database Management:**
- `create_database(config: DatabaseConfig) -> Result<u64, DatabaseError>`
- `create_encrypted_database(config: DatabaseConfig) -> Result<u64, DatabaseError>`
- `close_database(handle: u64) -> Result<(), DatabaseError>`
- `rekey_database(handle: u64, new_key: String) -> Result<(), DatabaseError>`

**Execution:**
- `execute(handle: u64, sql: String) -> Result<QueryResult, DatabaseError>`
- `execute_with_params(handle: u64, sql: String, params_json: String) -> Result<QueryResult, DatabaseError>`
- `execute_batch(handle: u64, statements: Vec<String>) -> Result<(), DatabaseError>`

**Transactions:**
- `begin_transaction(handle: u64) -> Result<(), DatabaseError>`
- `commit_transaction(handle: u64) -> Result<(), DatabaseError>`
- `rollback_transaction(handle: u64) -> Result<(), DatabaseError>`

**Prepared Statements:**
- `prepare_statement(handle: u64, sql: String) -> Result<u64, DatabaseError>`
- `execute_statement(stmt_handle: u64, params_json: String) -> Result<QueryResult, DatabaseError>`
- `finalize_statement(stmt_handle: u64) -> Result<(), DatabaseError>`

**Streaming:**
- `prepare_stream(handle: u64, sql: String, params_json: String) -> Result<u64, DatabaseError>`
- `fetch_next(stream_handle: u64, batch_size: u32) -> Result<Vec<serde_json::Value>, DatabaseError>`
- `close_stream(stream_handle: u64) -> Result<(), DatabaseError>`

**Export/Import:**
- `export_database(handle: u64, dest_path: String) -> Result<(), DatabaseError>`
- `import_database(handle: u64, source_path: String) -> Result<(), DatabaseError>`

**Performance:**
- `create_index(handle: u64, table: String, columns: String) -> Result<(), DatabaseError>`

---

## Testing

### Run Rust Tests

```bash
cd absurder-sql-mobile

# All tests (141 total)
cargo test

# FFI tests only (69 tests)
cargo test --test '*ffi*'

# UniFFI tests only (72 tests)
cargo test --test '*uniffi*'

# With encryption
cargo test --features encryption
cargo test --features encryption-ios
```

### Run React Native Integration Tests

```bash
cd react-native

# iOS
npx react-native run-ios --simulator="iPhone 16"
# Then run tests in the app

# Android  
npx react-native run-android
# Then run tests in the app
```

### Test Results (Current)

- [x] **141 Rust tests** - All passing
  - 69 FFI tests (legacy C API)
  - 72 UniFFI tests (new API)
- [x] **13 React Native integration tests** - All passing on iOS and Android
- [x] **Zero regressions** from UniFFI migration
- [x] **Encryption tests passing** on both platforms

---

## Key Discoveries & Lessons Learned

### 1. Position Independent Code (`-fPIC`) is Critical for Android

Android shared libraries MUST be compiled with `-fPIC`. Without it, you get linker errors:
```
ld.lld: error: relocation R_AARCH64_ADR_PREL_PG_HI21 cannot be used against symbol
```

**Solution:** Pre-build all libraries with `-fPIC` and configure Rust via `.cargo/config.toml`.

### 2. OpenSSL Assembly Code Causes PIC Issues

OpenSSL's assembly optimizations don't work well with PIC on Android.

**Solution:** Build OpenSSL with `no-asm` flag.

### 3. Environment Pollution Breaks Cross-Platform Builds

Android NDK adds itself to `PATH` and sets `CC`, `RANLIB`, etc. These contaminate iOS builds.

**Solution:** Use separate terminal sessions for iOS and Android builds.

### 4. iOS is Much Simpler with CommonCrypto

iOS has built-in CommonCrypto, so no need to pre-build anything.

**Solution:** Use `encryption-ios` feature which maps to `rusqlite/bundled-sqlcipher`.

### 5. UniFFI Proc Macros > Manual Bindings

UniFFI's `#[uniffi::export]` is far superior to maintaining 3,835 lines of manual glue code.

**Benefits:**
- Type safety across all layers
- Automatic TypeScript types
- No manual synchronization
- Compile-time error checking

### 6. Serial Tests Required for Database Tests

Database tests MUST use `#[serial]` annotation to prevent race conditions.

See `docs/mobile/INSTRUCTIONS.md` for complete testing patterns.

---

## Project Structure

```
absurder-sql-mobile/
├── src/
│   ├── uniffi_api/          # UniFFI exported functions
│   │   ├── core.rs          # All 20 exported functions
│   │   ├── types.rs         # DatabaseConfig, QueryResult types
│   │   └── mod.rs
│   ├── ffi/                 # Legacy C FFI (kept for compatibility)
│   │   ├── core.rs
│   │   ├── encryption.rs
│   │   ├── transactions.rs
│   │   ├── prepared_statements.rs
│   │   ├── streaming.rs
│   │   └── export_import.rs
│   ├── registry.rs          # Global handle management
│   ├── lib.rs               # Module declarations
│   └── __tests__/           # 141 Rust tests
├── android/
│   └── src/main/
│       ├── jni/sqlcipher-libs/  # Pre-built libraries
│       │   ├── arm64-v8a/
│       │   ├── armeabi-v7a/
│       │   ├── x86/
│       │   ├── x86_64/
│       │   └── include/
│       └── jniLibs/         # Copied .a files (auto-generated)
├── ios/
│   └── AbsurderSqlMobileFramework.xcframework/
├── react-native/            # Example React Native app
│   ├── ios/
│   ├── android/
│   └── __tests__/           # 13 integration tests
├── .cargo/
│   └── config.toml          # Android linker + PIC configuration
├── build.rs                 # Links pre-built Android libraries
├── ubrn.config.yaml         # UniFFI bindgen configuration
├── Cargo.toml
└── README.md
```

---

## Documentation

- **[INSTRUCTIONS.md](docs/mobile/INSTRUCTIONS.md)** - Testing patterns and best practices
- **[Design_Documentation_II.md](docs/mobile/Design_Documentation_II.md)** - Architecture and design decisions
- **[Planning_and_Progress_Tree_II.md](docs/mobile/Planning_and_Progress_Tree_II.md)** - Project roadmap and progress
- **[PRD_II.md](docs/mobile/PRD_II.md)** - Product requirements

---

## License

AGPL-3.0

---

## Support

For issues, questions, or contributions, see the main [absurder-sql](https://github.com/npiesco/absurder-sql) repository.
