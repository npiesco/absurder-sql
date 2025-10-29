# AbsurderSQL Mobile

**React Native bindings for iOS and Android**

[![npm](https://img.shields.io/npm/v/@npiesco/absurder-sql-mobile)](https://www.npmjs.com/package/@npiesco/absurder-sql-mobile)

**Tech Stack:**  
[![Rust](https://img.shields.io/badge/rust-1.85%2B-orange)](../Cargo.toml)
[![UniFFI](https://img.shields.io/badge/uniffi-0.29-blue)](https://mozilla.github.io/uniffi-rs/)
[![React Native](https://img.shields.io/badge/react--native-0.82%2B-61dafb)](https://reactnative.dev/)

**Capabilities:**  
[![iOS](https://img.shields.io/badge/iOS-13%2B-blue)](https://developer.apple.com/ios/)
[![Android](https://img.shields.io/badge/Android-API%2023%2B-green)](https://developer.android.com/)
[![Encryption](https://img.shields.io/badge/encryption-SQLCipher%20AES%20256-success)](https://www.zetetic.net/sqlcipher/)
[![Performance](https://img.shields.io/badge/performance-WAL%20%2B%20LRU-orange)](#performance-features)

> *Native SQLite with filesystem persistence and SQLCipher encryption for React Native*

## What is AbsurderSQL Mobile?

React Native bindings that bring full SQLite functionality to iOS and Android apps using **UniFFI** for automatic cross-language bindings generation. All SQLite features work natively on mobile devices with:

- **Filesystem persistence** - Real `.db` files on device storage
- **AES-256 encryption** - SQLCipher integration for secure data at rest
- **Auto-generated bindings** - TypeScript, Swift, and Kotlin from single Rust codebase
- **Type-safe APIs** - End-to-end type safety from Rust to TypeScript
- **Zero manual glue code** - UniFFI generates all platform bindings

## Architecture

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

## Key Features

### UniFFI Auto-Generated Bindings
- 20 exported Rust functions with `#[uniffi::export]`
- Automatic TypeScript, Kotlin, and Swift bindings
- Type-safe across all layers (Rust → TypeScript)
- Zero manual synchronization

### Database Encryption (SQLCipher)
- **iOS:** Bundled SQLCipher with CommonCrypto
- **Android:** Pre-built SQLCipher 4.6.0 + OpenSSL static libraries
- AES-256 encryption at rest
- `create_encrypted_database()` and `rekey_database()` APIs

### Performance Features
- Cursor-based streaming with O(n) complexity
- Index creation helpers: `create_index(table, columns)`
- Mobile-optimized config: WAL mode, 20K cache pages, auto-vacuum

### Core Operations
- Database creation, queries with parameters
- Transactions (begin, commit, rollback)
- Prepared statements and batch operations
- Export/import via VACUUM INTO
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

**Critical:** Android NDK environment variables contaminate iOS builds. Always use separate terminal sessions.

**For iOS builds:**
```bash
# Check environment is clean
printenv | grep -E "CC|ANDROID|NDK|CLANG|AR_|RANLIB"
# Should return nothing - if polluted, start new terminal
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

```bash
# Rust tests
cargo test
cargo test --features encryption
cargo test --features encryption-ios

# React Native integration tests
cd react-native
npx react-native run-ios --simulator="iPhone 16"
npx react-native run-android
```

---

## License

AGPL-3.0 - See main [absurder-sql](https://github.com/npiesco/absurder-sql) repository.
