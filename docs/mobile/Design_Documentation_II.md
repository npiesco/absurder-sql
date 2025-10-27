# Design Documentation II
## AbsurderSQL Mobile: Phase II Architecture

**Version:** 2.2  
**Last Updated:** October 26, 2025  
**Status:** Phase 4.1 COMPLETE (UniFFI Core), Phase 4.2 IN PROGRESS (iOS Bindings)  
**Target Release:** v0.3.0 (UniFFI Migration)

---

## ✅ Phase 4.1 COMPLETE: UniFFI Core Implementation

**Completed:** October 26, 2025  
**Duration:** 2 weeks  
**Result:** All core UniFFI functions implemented and tested

### Accomplishments

#### Rust Implementation
- ✅ 19 UniFFI exported functions with `#[uniffi::export]` macro
- ✅ Full parity with existing 18 FFI functions
- ✅ Added `create_encrypted_database()` and `rekey_database()` for SQLCipher
- ✅ All functions use proper error handling with `Result<T, DatabaseError>`
- ✅ Zero `unwrap()`/`panic!()` calls in production code

#### Test Coverage
- ✅ 126 tests passing (72 FFI + 54 UniFFI)
- ✅ 7 test modules with comprehensive coverage
- ✅ All tests follow INSTRUCTIONS.md patterns (serial, unique names, cleanup)
- ✅ Zero database files left behind after test runs
- ✅ BLOB support validated in export/import

#### Code Quality
- ✅ Zero TODOs/FIXMEs remaining
- ✅ Zero regressions from existing FFI tests
- ✅ Production-grade error handling throughout
- ✅ Proper resource cleanup and memory management

### What's Next: Phase 4.2 - iOS Binding Generation

**Objective:** Generate Swift bindings and replace Objective-C bridge

**Steps:**
1. Install `uniffi-bindgen-react-native` CLI tool
2. Run binding generator for iOS platform
3. Review generated Swift code
4. Create Turbo Module registration
5. Test on iOS simulator
6. Replace legacy Objective-C bridge (616 lines)

**Expected Timeline:** 3-5 days

---

## UniFFI Migration Analysis (Planned for v0.3.0)

### Overview
[UniFFI for React Native](https://github.com/jhugman/uniffi-bindgen-react-native) is a Mozilla tool that auto-generates TypeScript, JSI C++, iOS, and Android bindings from annotated Rust code. Released December 2024, it's production-ready and offers significant advantages over our current manual FFI approach.

### What Would Be Deleted/Replaced

**Total: ~3,835 lines of manual glue code replaced by UniFFI annotations**

#### 1. Rust FFI Layer (1,434 lines → ~200 lines of UniFFI macros)
- `src/ffi/core.rs` (333 lines) - 20 extern "C" functions
- `src/ffi/encryption.rs` (183 lines)
- `src/ffi/export_import.rs` (189 lines)
- `src/ffi/prepared_statements.rs` (264 lines)
- `src/ffi/streaming.rs` (211 lines)
- `src/ffi/transactions.rs` (241 lines)
- `src/ffi/mod.rs` (13 lines)

**Replace with:** UniFFI proc macros (`#[uniffi::export]`)

#### 2. Android JNI Bindings (747 lines → auto-generated)
- `src/android_jni/bindings.rs` (740 lines) - Manual JNI wrappers
- `src/android_jni/mod.rs` (7 lines)
- `android/src/main/kotlin/com/npiesco/absurdersql/AbsurderSQLModule.kt` (390 lines)

**Replace with:** UniFFI auto-generated Kotlin bindings + Turbo Module

#### 3. iOS Objective-C Bridge (616 lines → auto-generated)
- `ios/AbsurderSQLBridge.m` (616 lines) - Manual Objective-C bridge
- `ios/AbsurderSQLBridge.h` (minimal)
- `ios/AbsurderSQL-Bridging-Header.h` (manual FFI declarations)

**Replace with:** UniFFI auto-generated Swift bindings + Turbo Module

#### 4. TypeScript API (648 lines → mostly preserved, simplified)
- `src/index.ts` (648 lines) - Current: Manual NativeModules wrapper
- **After UniFFI:** Auto-generated TypeScript + manual high-level API

### What Would Be Added

#### New Dependencies
```toml
[dependencies]
uniffi = { version = "0.28", features = ["bindgen"] }
```

#### Build Configuration
- `uniffi.toml` - UniFFI configuration
- Updated `Cargo.toml` with UniFFI features
- `uniffi-bindgen` in build process

#### Generated Code (Auto-created)
- TypeScript bindings with JSI
- C++ JSI bridge layer
- Kotlin bindings (replaces JNI)
- Swift bindings (replaces Objective-C)
- Turbo Module registration

### Architecture Comparison

**Current (Phase II):**
```
TypeScript (648 lines manual)
    ↓
NativeModules Bridge (2-5ms overhead)
    ↓
iOS: Objective-C (616 lines) ←→ Android: Kotlin+JNI (1,137 lines)
    ↓                                ↓
C FFI (1,434 lines)      ←←←←←←←←←←←↓
    ↓
Rust Core (absurder-sql)
```

**After UniFFI Migration:**
```
TypeScript (auto-generated + ~200 lines high-level API)
    ↓
JSI C++ (auto-generated, <1ms overhead)
    ↓
iOS: Swift ←→ Android: Kotlin (both auto-generated)
    ↓              ↓
Rust Core (annotated with #[uniffi::export])
```

### Benefits of UniFFI

#### Code Reduction
- **-3,835 lines** of manual glue code
- **+~200 lines** of UniFFI annotations
- **Net: -3,635 lines (-95% glue code)**

#### Performance
- **<1ms bridge overhead** (vs current 2-5ms)
- **Zero-copy** data transfer with JSI ArrayBuffer
- Direct TypeScript ↔ Rust communication

#### Developer Experience
- **Single source of truth** - annotate Rust once
- **Type safety** across all layers
- **Automatic TypeScript types** from Rust
- **Built-in async/await** support
- **Callbacks** from Rust to TypeScript

#### Maintainability
- No manual synchronization of APIs across layers
- Compiler-verified type safety
- Breaking changes caught at compile time
- Consistent API across platforms

#### Production Ready
- Used in Firefox, Matrix SDK, ChessTiles
- Mozilla-backed, actively maintained
- React Native 0.74+ (New Architecture) support
- Backwards compatible fallback available

### Migration Strategy

**Phase 1: Preparation (Week 1)**
- Add UniFFI dependency
- Create `uniffi.toml` configuration
- Add UniFFI annotations to core Rust functions
- Keep existing FFI as fallback

**Phase 2: iOS Migration (Week 2)**
- Generate Swift bindings
- Replace Objective-C bridge with generated code
- Test all features on iOS simulator
- Validate performance improvements

**Phase 3: Android Migration (Week 3)**
- Generate Kotlin bindings
- Replace JNI/Kotlin bridge with generated code
- Test all features on Android emulator
- Validate performance improvements

**Phase 4: TypeScript Layer (Week 4)**
- Integrate auto-generated TypeScript
- Add high-level API wrapper
- Update React Native integration
- Test Turbo Module functionality

**Phase 5: Testing & Validation (Week 5)**
- Run full test suite (87 tests)
- Performance benchmarking
- Physical device testing
- Documentation updates

**Phase 6: Deprecation (Week 6)**
- Remove old FFI/bridge code
- Clean up build configuration
- Release v0.3.0

### Risk Mitigation

**Risks:**
1. UniFFI learning curve
2. Breaking changes in migration
3. Potential compatibility issues
4. Build system complexity

**Mitigations:**
1. Keep old FFI code until migration complete
2. Comprehensive testing at each phase
3. Phased rollout (iOS → Android → TypeScript)
4. Detailed documentation and examples
5. Community support via Matrix channel

### Success Criteria

- ✅ All 87 tests passing
- ✅ Zero regressions in functionality
- ✅ <1ms bridge overhead measured
- ✅ <200 lines of manual glue code
- ✅ Type safety across all layers
- ✅ Performance improvement documented

---

## Phase I Architecture Summary

### What Was Built

**Core Stack:**
```
React Native (TypeScript)
    ↓
Native Bridge (Objective-C / Kotlin)
    ↓
FFI Layer (C)
    ↓
AbsurderSQL Core (Rust)
    ↓
SQLite (rusqlite)
```

**Key Components:**
- ✅ FFI layer with handle-based API
- ✅ iOS bridge (Objective-C + React Native)
- ✅ Android bridge (Kotlin + JNI)
- ✅ TypeScript API with full type safety
- ✅ PreparedStatement API
- ✅ Transaction support
- ✅ Export/import functionality
- ✅ Streaming API (cursor-based result iteration)

**Performance Results:**
- See [MOBILE_BENCHMARK.md](./MOBILE_BENCHMARK.md) for complete results
- 6-9x faster than react-native-sqlite-storage on INSERTs
- 63x faster than WatermelonDB on complex JOINs (Android)

### Modular Architecture Refactoring (Completed)

**Status:** ✅ Complete (October 2025)

The FFI layer has been refactored from a monolithic 2,443-line `lib.rs` file into a clean modular structure:

```
absurder-sql-mobile/src/
├── lib.rs (631 lines)              # Module declarations & re-exports
├── registry.rs (97 lines)          # Global state management
├── ffi/
│   ├── mod.rs (10 lines)          # FFI module declarations
│   ├── core.rs (333 lines)        # Core database operations
│   ├── transactions.rs (241 lines) # Transaction management
│   ├── prepared_statements.rs (264 lines) # Prepared statements
│   ├── streaming.rs (211 lines)   # Streaming/cursor API
│   └── export_import.rs (189 lines) # Backup/restore
└── android_jni/
    ├── mod.rs (7 lines)           # JNI module declarations
    └── bindings.rs (625 lines)    # Android JNI wrappers
```

**Benefits:**
- **74% reduction** in main lib.rs file size (2,443 → 631 lines)
- **Clear separation of concerns** - each module has a single responsibility
- **Improved maintainability** - easier to navigate and understand
- **Better testability** - 63 comprehensive tests with proper isolation
- **No performance impact** - all tests passing, zero regressions
- **Follows parent repo pattern** - consistent with absurder-sql core structure

**Module Responsibilities:**

1. **`registry.rs`**: Global state management
   - Database handle registry
   - Statement handle registry
   - Async runtime management
   - Error state tracking

2. **`ffi/core.rs`**: Core database operations
   - `absurder_db_new()` - Create database
   - `absurder_db_execute()` - Execute SQL
   - `absurder_db_execute_with_params()` - Parameterized queries
   - `absurder_db_close()` - Close database
   - `absurder_free_string()` - Memory management
   - `absurder_get_error()` - Error retrieval

3. **`ffi/transactions.rs`**: Transaction management
   - `absurder_db_begin_transaction()`
   - `absurder_db_commit()`
   - `absurder_db_rollback()`
   - `absurder_db_execute_batch()`

4. **`ffi/prepared_statements.rs`**: Prepared statement API
   - `absurder_db_prepare()`
   - `absurder_stmt_execute()`
   - `absurder_stmt_finalize()`

5. **`ffi/streaming.rs`**: Cursor-based streaming
   - `absurder_stmt_prepare_stream()`
   - `absurder_stmt_fetch_next()`
   - `absurder_stmt_stream_close()`

6. **`ffi/export_import.rs`**: Database backup/restore
   - `absurder_db_export()` - VACUUM INTO
   - `absurder_db_import()` - Table-by-table restore

7. **`android_jni/bindings.rs`**: Android JNI layer
   - 29 JNI wrapper functions
   - `JNI_OnLoad()` initialization
   - Java ↔ Rust type conversions

---

## Phase II Architecture

### New Components Overview

```
┌─────────────────────────────────────────────────────┐
│           React Native Application                   │
│  ┌──────────────────────────────────────────────┐  │
│  │     TypeScript API (Phase II Extensions)     │  │
│  │  - executeStream() → AsyncIterator           │  │
│  │  - openDatabase({ encryption })              │  │
│  │  - migrate(migrations[])                     │  │
│  └──────────────────────────────────────────────┘  │
│                      ↓                               │
│  ┌──────────────────────────────────────────────┐  │
│  │    Turbo Module (JSI) [Optional, RN 0.74+]  │  │
│  │  - Zero-copy data transfer                   │  │
│  │  - <1ms bridge overhead                      │  │
│  └──────────────────────────────────────────────┘  │
│                      ↓                               │
│  ┌──────────────────────────────────────────────┐  │
│  │   Native Bridge (Fallback for RN <0.74)     │  │
│  │  - iOS: Objective-C                          │  │
│  │  - Android: Kotlin + JNI                     │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│              FFI Layer (C)                           │
│  - absurder_stmt_prepare_stream()                   │
│  - absurder_stmt_fetch_next()                       │
│  - absurder_db_new_encrypted()                      │
│  - absurder_db_rekey()                              │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│         AbsurderSQL Core (Rust)                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  StreamingStatement                          │  │
│  │  - fetch_next(batch_size) → Vec<Row>        │  │
│  │  - Cursor-based iteration                    │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  EncryptedDatabase                           │  │
│  │  - SQLCipher integration                     │  │
│  │  - PBKDF2 key derivation                     │  │
│  │  - rekey() support                           │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│              SQLite / SQLCipher                      │
└─────────────────────────────────────────────────────┘
```

---

## Feature 1: Streaming Results API

### Architecture

**Rust Core:**
```rust
pub struct StreamingStatement<'conn> {
    stmt: rusqlite::Statement<'conn>,
    batch_size: usize,
    current_position: usize,
}

impl StreamingStatement<'_> {
    pub fn fetch_next(&mut self) -> Result<Vec<Row>, DatabaseError> {
        let mut rows = Vec::with_capacity(self.batch_size);
        
        for _ in 0..self.batch_size {
            match self.stmt.next()? {
                Some(row) => rows.push(row_to_json(row)?),
                None => break,
            }
        }
        
        Ok(rows)
    }
    
    pub fn finalize(self) -> Result<(), DatabaseError> {
        // Cleanup
        Ok(())
    }
}
```

**FFI Layer:**
```c
// C API
int64_t absurder_stmt_prepare_stream(int64_t db_handle, const char* sql);
char* absurder_stmt_fetch_next(int64_t stream_handle, int batch_size);
int absurder_stmt_stream_close(int64_t stream_handle);
```

**TypeScript API:**
```typescript
async function* executeStream(
  sql: string,
  params?: any[],
  options?: { batchSize?: number }
): AsyncIterator<Record<string, any>> {
  const streamHandle = await NativeModule.prepareStream(sql, params);
  
  try {
    while (true) {
      const batch = await NativeModule.fetchNext(
        streamHandle,
        options?.batchSize ?? 100
      );
      
      if (batch.length === 0) break;
      
      for (const row of batch) {
        yield row;
      }
    }
  } finally {
    await NativeModule.closeStream(streamHandle);
  }
}

// Usage
for await (const row of db.executeStream('SELECT * FROM large_table')) {
  console.log(row);
  if (someCondition) break; // Automatic cleanup
}
```

### Memory Management

**Handle Registry:**
```rust
static STREAM_REGISTRY: Lazy<Mutex<HashMap<u64, StreamingStatement>>> = 
    Lazy::new(|| Mutex::new(HashMap::new()));

pub fn register_stream(stmt: StreamingStatement) -> u64 {
    let handle = generate_handle();
    STREAM_REGISTRY.lock().unwrap().insert(handle, stmt);
    handle
}

pub fn get_stream(handle: u64) -> Option<&mut StreamingStatement> {
    STREAM_REGISTRY.lock().unwrap().get_mut(&handle)
}

pub fn remove_stream(handle: u64) {
    STREAM_REGISTRY.lock().unwrap().remove(&handle);
}
```

**Cleanup Strategy:**
1. Explicit: User calls `closeStream()`
2. Implicit: Database close removes all streams
3. Timeout: Auto-close after 5 minutes of inactivity

### Performance Characteristics

**Memory Usage:**
- Constant: O(batch_size) regardless of total rows
- Default batch: 100 rows ≈ 10KB
- Configurable: 10-1000 rows

**Latency:**
- First row: <50ms (prepare + first fetch)
- Subsequent batches: <10ms
- Network overhead: ~2ms per fetch (bridge call)

**Throughput:**
- Target: 10K rows/sec
- Bottleneck: JSON serialization (can optimize with JSI)

---

## Feature 2: Database Encryption (SQLCipher)

### Architecture

**Rust Core:**
```rust
pub struct EncryptedDatabase {
    conn: Connection, // rusqlite with sqlcipher feature
    key_hash: [u8; 32], // For validation
}

impl EncryptedDatabase {
    pub fn new_encrypted(path: &str, key: &str) -> Result<Self, DatabaseError> {
        // Derive key with PBKDF2
        let derived_key = derive_key(key, SALT, 100_000);
        
        // Open with SQLCipher
        let conn = Connection::open(path)?;
        conn.execute(&format!("PRAGMA key = 'x{}'", hex::encode(&derived_key)), [])?;
        
        // Verify encryption
        conn.execute("SELECT count(*) FROM sqlite_master", [])?;
        
        Ok(Self {
            conn,
            key_hash: hash_key(&derived_key),
        })
    }
    
    pub fn rekey(&mut self, old_key: &str, new_key: &str) -> Result<(), DatabaseError> {
        // Verify old key
        if hash_key(&derive_key(old_key, SALT, 100_000)) != self.key_hash {
            return Err(DatabaseError::InvalidKey);
        }
        
        // Derive new key
        let new_derived = derive_key(new_key, SALT, 100_000);
        
        // SQLCipher rekey
        self.conn.execute(
            &format!("PRAGMA rekey = 'x{}'", hex::encode(&new_derived)),
            []
        )?;
        
        self.key_hash = hash_key(&new_derived);
        Ok(())
    }
}

fn derive_key(password: &str, salt: &[u8], iterations: u32) -> [u8; 32] {
    use pbkdf2::pbkdf2_hmac;
    use sha2::Sha256;
    
    let mut key = [0u8; 32];
    pbkdf2_hmac::<Sha256>(password.as_bytes(), salt, iterations, &mut key);
    key
}
```

**FFI Layer:**
```c
// C API
int64_t absurder_db_new_encrypted(const char* path, const char* key);
int absurder_db_rekey(int64_t handle, const char* old_key, const char* new_key);
```

**TypeScript API:**
```typescript
interface EncryptionConfig {
  key: string;
  // Future: cipher?: 'aes-256-cbc' | 'aes-128-cbc';
  // Future: kdfIterations?: number;
}

async function openDatabase(config: {
  name: string;
  encryption?: EncryptionConfig;
}): Promise<Database> {
  if (config.encryption) {
    const handle = await NativeModule.createEncryptedDatabase(
      config.name,
      config.encryption.key
    );
    return new Database(handle);
  } else {
    // Regular unencrypted database
    const handle = await NativeModule.createDatabase(config.name);
    return new Database(handle);
  }
}

class Database {
  async rekey(oldKey: string, newKey: string): Promise<void> {
    await NativeModule.rekey(this.handle, oldKey, newKey);
  }
}
```

### Security Considerations

**Key Storage:**
- **iOS**: Use Keychain Services
- **Android**: Use Android Keystore
- **Never**: Store keys in AsyncStorage or plain files

**Key Derivation:**
- Algorithm: PBKDF2-HMAC-SHA256
- Iterations: 100,000 (OWASP recommendation)
- Salt: Device-specific (e.g., device ID)

**Memory Safety:**
- Zero key memory after use: `key.zeroize()`
- Prevent key logging in debug builds
- Validate key length (min 16 characters)

### Performance Impact

**Benchmarks (Target):**
- Encryption overhead: <10% vs unencrypted
- Key derivation: ~100ms (acceptable for login flow)
- Rekey operation: ~500ms for 10MB database

**Optimization:**
- Cache derived key in memory (secure enclave)
- Use hardware AES acceleration when available
- Batch writes to amortize encryption cost

---

## Feature 3: Schema Migrations

### Architecture

**Pure TypeScript Implementation:**
```typescript
interface Migration {
  version: number;
  up: string;
  down: string;
  description?: string;
}

class MigrationEngine {
  constructor(private db: Database) {}
  
  async getCurrentVersion(): Promise<number> {
    try {
      const result = await this.db.query(
        'SELECT MAX(version) as version FROM _migrations'
      );
      return result.rows[0]?.version ?? 0;
    } catch {
      // Table doesn't exist, version 0
      return 0;
    }
  }
  
  async migrate(migrations: Migration[]): Promise<void> {
    // Create migrations table
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        description TEXT,
        applied_at TEXT NOT NULL
      )
    `);
    
    const currentVersion = await this.getCurrentVersion();
    const pending = migrations
      .filter(m => m.version > currentVersion)
      .sort((a, b) => a.version - b.version);
    
    for (const migration of pending) {
      await this.applyMigration(migration);
    }
  }
  
  private async applyMigration(migration: Migration): Promise<void> {
    await this.db.transaction(async () => {
      // Execute migration SQL
      await this.db.execute(migration.up);
      
      // Record in migrations table
      await this.db.execute(
        'INSERT INTO _migrations (version, description, applied_at) VALUES (?, ?, ?)',
        [migration.version, migration.description, new Date().toISOString()]
      );
    });
    
    console.log(`Applied migration ${migration.version}: ${migration.description}`);
  }
  
  async rollback(toVersion: number): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const migrations = await this.getAppliedMigrations();
    
    for (const migration of migrations.reverse()) {
      if (migration.version <= toVersion) break;
      
      await this.db.transaction(async () => {
        await this.db.execute(migration.down);
        await this.db.execute(
          'DELETE FROM _migrations WHERE version = ?',
          [migration.version]
        );
      });
    }
  }
}

// Usage
const migrations: Migration[] = [
  {
    version: 1,
    description: 'Create users table',
    up: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)',
    down: 'DROP TABLE users',
  },
  {
    version: 2,
    description: 'Add email to users',
    up: 'ALTER TABLE users ADD COLUMN email TEXT',
    down: 'ALTER TABLE users DROP COLUMN email',
  },
];

const engine = new MigrationEngine(db);
await engine.migrate(migrations);
```

### Design Decisions

**Why TypeScript?**
- No FFI changes needed
- Easier to test and maintain
- Familiar to React Native developers
- Can use existing `execute()` API

**Why SQL strings?**
- Simple and explicit
- No ORM abstraction
- Easy to review in code reviews
- Compatible with existing SQL tools

**Why version numbers?**
- Simple ordering
- No timestamp conflicts
- Easy to understand

### Best Practices

**Migration Guidelines:**
1. **Idempotent**: Use `IF NOT EXISTS` / `IF EXISTS`
2. **Reversible**: Always provide `down` migration
3. **Atomic**: Wrap in transaction
4. **Tested**: Test both up and down migrations
5. **Documented**: Add description field

**Example Patterns:**
```typescript
// Good: Idempotent
{
  version: 1,
  up: 'CREATE TABLE IF NOT EXISTS users (...)',
  down: 'DROP TABLE IF EXISTS users',
}

// Good: Data transformation
{
  version: 2,
  up: `
    ALTER TABLE users ADD COLUMN full_name TEXT;
    UPDATE users SET full_name = first_name || ' ' || last_name;
    ALTER TABLE users DROP COLUMN first_name;
    ALTER TABLE users DROP COLUMN last_name;
  `,
  down: `
    ALTER TABLE users ADD COLUMN first_name TEXT;
    ALTER TABLE users ADD COLUMN last_name TEXT;
    UPDATE users SET 
      first_name = substr(full_name, 1, instr(full_name, ' ') - 1),
      last_name = substr(full_name, instr(full_name, ' ') + 1);
    ALTER TABLE users DROP COLUMN full_name;
  `,
}

// Bad: Not idempotent
{
  version: 3,
  up: 'ALTER TABLE users ADD COLUMN age INTEGER', // Fails if column exists
  down: 'ALTER TABLE users DROP COLUMN age',
}
```

---

## Feature 4: Turbo Modules (JSI)

### Architecture

**C++ JSI Implementation:**
```cpp
#include <jsi/jsi.h>
#include <ReactCommon/CallInvoker.h>

using namespace facebook;

class AbsurderSQLModule : public jsi::HostObject {
public:
  AbsurderSQLModule(std::shared_ptr<react::CallInvoker> jsCallInvoker)
    : jsCallInvoker_(jsCallInvoker) {}
  
  jsi::Value get(jsi::Runtime& rt, const jsi::PropNameID& name) override {
    auto methodName = name.utf8(rt);
    
    if (methodName == "execute") {
      return jsi::Function::createFromHostFunction(
        rt,
        name,
        2, // argc
        [this](jsi::Runtime& rt, const jsi::Value& thisVal, 
               const jsi::Value* args, size_t count) -> jsi::Value {
          // Zero-copy: Direct access to arguments
          int64_t handle = args[0].asNumber();
          std::string sql = args[1].asString(rt).utf8(rt);
          
          // Call Rust FFI
          const char* result_json = absurder_db_execute(handle, sql.c_str());
          
          // Zero-copy: Return as ArrayBuffer
          auto buffer = jsi::ArrayBuffer(rt, result_json, strlen(result_json));
          absurder_free_string(result_json);
          
          return jsi::Value(rt, buffer);
        }
      );
    }
    
    return jsi::Value::undefined();
  }
  
private:
  std::shared_ptr<react::CallInvoker> jsCallInvoker_;
};

// Installation
extern "C" void installAbsurderSQL(jsi::Runtime& rt, 
                                    std::shared_ptr<react::CallInvoker> jsCallInvoker) {
  auto module = std::make_shared<AbsurderSQLModule>(jsCallInvoker);
  rt.global().setProperty(rt, "__AbsurderSQLTurbo", 
                          jsi::Object::createFromHostObject(rt, module));
}
```

**TypeScript Wrapper:**
```typescript
// Feature detection
const isTurboModuleAvailable = () => {
  return global.__AbsurderSQLTurbo !== undefined;
};

// Unified API
class Database {
  private useTurbo: boolean;
  
  constructor(handle: number) {
    this.handle = handle;
    this.useTurbo = isTurboModuleAvailable();
    console.log(`Using ${this.useTurbo ? 'Turbo Module' : 'Bridge'}`);
  }
  
  async execute(sql: string, params?: any[]): Promise<QueryResult> {
    if (this.useTurbo) {
      // JSI: Zero-copy
      const buffer = global.__AbsurderSQLTurbo.execute(this.handle, sql);
      return JSON.parse(new TextDecoder().decode(buffer));
    } else {
      // Bridge: Fallback
      return await NativeModules.AbsurderSQL.execute(this.handle, sql, params);
    }
  }
}
```

### Performance Comparison

**Bridge (Current):**
- Serialization: ~2-5ms per call
- Memory: Copy data 2x (JS → Native → JS)
- Throughput: ~200 calls/sec

**JSI (Turbo):**
- Serialization: <1ms (zero-copy)
- Memory: Direct access, no copies
- Throughput: ~1000 calls/sec

**Benchmark Results (Target):**
```
Test: 1000 execute() calls
Bridge:  2500ms (2.5ms/call)
Turbo:   800ms (0.8ms/call)
Speedup: 3.1x
```

---

## Testing Strategy

### Unit Tests (Rust)
```rust
#[cfg(test)]
mod tests {
    #[test]
    fn test_streaming_statement() {
        let db = Database::new(":memory:").unwrap();
        db.execute("CREATE TABLE test (id INTEGER, value TEXT)").unwrap();
        
        // Insert 1000 rows
        for i in 0..1000 {
            db.execute(&format!("INSERT INTO test VALUES ({}, 'value{}')", i, i)).unwrap();
        }
        
        // Stream results
        let mut stmt = db.prepare_stream("SELECT * FROM test").unwrap();
        let mut count = 0;
        
        loop {
            let batch = stmt.fetch_next(100).unwrap();
            if batch.is_empty() { break; }
            count += batch.len();
        }
        
        assert_eq!(count, 1000);
    }
    
    #[test]
    fn test_encrypted_database() {
        let db = EncryptedDatabase::new_encrypted(":memory:", "password123").unwrap();
        db.execute("CREATE TABLE test (id INTEGER)").unwrap();
        db.execute("INSERT INTO test VALUES (1)").unwrap();
        
        let result = db.query("SELECT * FROM test").unwrap();
        assert_eq!(result.rows.len(), 1);
    }
}
```

### Integration Tests (React Native)
```typescript
describe('Streaming API', () => {
  it('should handle large result sets', async () => {
    const db = await openDatabase({ name: 'test.db' });
    
    // Insert 10K rows
    await db.transaction(async () => {
      for (let i = 0; i < 10000; i++) {
        await db.execute('INSERT INTO test VALUES (?, ?)', [i, `value${i}`]);
      }
    });
    
    // Stream results
    let count = 0;
    for await (const row of db.executeStream('SELECT * FROM test')) {
      count++;
    }
    
    expect(count).toBe(10000);
  });
  
  it('should cleanup on early break', async () => {
    const db = await openDatabase({ name: 'test.db' });
    
    let count = 0;
    for await (const row of db.executeStream('SELECT * FROM test')) {
      count++;
      if (count === 100) break;
    }
    
    // Verify no memory leaks
    const handles = await db.getActiveStreamHandles();
    expect(handles.length).toBe(0);
  });
});

describe('Encryption', () => {
  it('should encrypt database', async () => {
    const db = await openDatabase({
      name: 'encrypted.db',
      encryption: { key: 'password123' },
    });
    
    await db.execute('CREATE TABLE test (id INTEGER, secret TEXT)');
    await db.execute('INSERT INTO test VALUES (1, "sensitive data")');
    
    // Verify data is encrypted on disk
    const fileContent = await readFile('encrypted.db');
    expect(fileContent).not.toContain('sensitive data');
  });
  
  it('should reject wrong key', async () => {
    await openDatabase({
      name: 'encrypted.db',
      encryption: { key: 'password123' },
    });
    
    await expect(
      openDatabase({
        name: 'encrypted.db',
        encryption: { key: 'wrong-password' },
      })
    ).rejects.toThrow('Invalid encryption key');
  });
});
```

---

## Performance Targets

### Streaming API
- First row latency: <50ms
- Throughput: 10K rows/sec
- Memory: O(batch_size), not O(total_rows)

### Encryption
- Overhead: <10% vs unencrypted
- Key derivation: <100ms
- Rekey: <500ms for 10MB database

### Turbo Modules
- Bridge overhead: <1ms (vs current 2-5ms)
- Throughput: 1000 calls/sec (vs current 200)

### Migrations
- 10 migrations: <100ms
- Rollback: <50ms per migration

---

## Conclusion

Phase II extends AbsurderSQL Mobile with advanced features while maintaining the performance and simplicity established in Phase I. The architecture prioritizes:

1. **Zero-copy where possible** (JSI/Turbo Modules)
2. **Security by default** (SQLCipher integration)
3. **Developer experience** (Migrations, DevTools)
4. **Backward compatibility** (Feature detection, fallbacks)

All features are designed to be optional and composable, allowing developers to adopt only what they need.

---

## Related Documents

- [PRD II](./PRD_II.md) - Product requirements
- [Planning and Progress Tree II](./Planning_and_Progress_Tree_II.md) - Implementation tracking
- [Mobile Benchmarks](./MOBILE_BENCHMARK.md) - Performance results
- [Phase I Design](./Design_Documentation.md) - Original architecture
