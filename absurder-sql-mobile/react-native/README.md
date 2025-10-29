# AbsurderSQL Mobile Test App

React Native test application for AbsurderSQL mobile bindings with comprehensive integration tests and performance benchmarks.

## What This App Tests

### 1. Integration Tests (13 tests)
- Database creation and management
- Table operations (CREATE, INSERT, SELECT)
- Transaction support (COMMIT, ROLLBACK)
- Export/import functionality
- Encryption (SQLCipher)
  - Encrypted database creation
  - Encrypted data operations
  - Key rekeying
  - Persistence verification

### 2. Performance Benchmarks
- Simple SELECT queries (1 row, 100 rows)
- Bulk INSERT (1000 rows)
- Transaction performance
- Indexed vs non-indexed queries
- Complex JOINs
- Batch operations

### 3. Comparison Benchmarks
Head-to-head performance comparison against:
- **react-native-sqlite-storage** (popular SQLite wrapper)
- **WatermelonDB** (reactive database with sync)

Tests same operations on all three libraries to measure relative performance.

## Running the App

### iOS

```bash
cd /path/to/absurder-sql-mobile/react-native

# Install CocoaPods (first time only)
cd ios && pod install && cd ..

# Run on simulator
npx react-native run-ios --simulator="iPhone 16"
```

### Android

```bash
cd /path/to/absurder-sql-mobile/react-native

# Ensure emulator is running
# List available: ~/Library/Android/sdk/emulator/emulator -list-avds
# Start emulator: ~/Library/Android/sdk/emulator/emulator -avd <avd_name>

# Run on emulator
npx react-native run-android
```

## Using the App

The app has three tabs:

1. **Tests** - Run all 13 integration tests
   - Tap "Run Tests" to execute
   - Each test shows PASS/FAIL status
   - Execution time displayed

2. **Benchmarks** - Performance tests with requirements
   - Tap "Run Benchmarks" to execute
   - Shows actual vs required duration
   - Green = PASS, Red = FAIL

3. **Comparison** - Compare against other libraries
   - Tests AbsurderSQL vs react-native-sqlite-storage vs WatermelonDB
   - Side-by-side performance metrics
   - Shows percentage differences

## Test Files

- `AbsurderSQLTest.tsx` - Integration tests
- `AbsurderSQLBenchmark.tsx` - Performance benchmarks
- `ComparisonBenchmark.tsx` - Library comparison
- `App.tsx` - Main app with tab navigation

## Viewing Logs

Check Metro console for detailed test output:

```bash
# Metro should already be running, but if not:
npx react-native start
```

Logs show:
- Test execution steps
- SQL queries executed
- Error messages (if any)
- Performance metrics
