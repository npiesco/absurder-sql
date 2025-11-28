# Mobile UniFFI Alignment Progress Tracker

## Current Status: Phase 1 - Export Row/ColumnValue Types ✅ COMPLETE (Rust tests)

---

## Critical Issues to Fix

| Issue | Severity | Status | Phase |
|-------|----------|--------|-------|
| Row/ColumnValue not exported | 🔴 High | ✅ DONE | 1 |
| QueryResult incomplete (missing last_insert_id, execution_time_ms) | 🔴 High | ⬜ TODO | 2 |
| PreparedStatement broken (execute_statement returns void) | 🔴 High | ⬜ TODO | 3 |
| DatabaseConfig simplified (missing cache_size, page_size, journal_mode) | 🟡 Medium | ⬜ TODO | 4 |
| TypeScript wrapper JSON parsing workarounds | 🟡 Medium | ⬜ TODO | 5 |

---

## TDD Methodology

For each phase:
1. **RED**: Write the test, run it, watch it fail
2. **GREEN**: Write production code to pass the test
3. **DEBUG**: If fail, add logging, repeat until pass
4. **REGRESSION**: Run ALL tests to ensure no regressions
5. **MOBILE VERIFY**: Test on Android emulator AND iOS simulator
6. **PROCEED**: If everything green, move to next phase

---

## Phase 1: Export Row/ColumnValue Types

### Files Modified
- `absurder-sql-mobile/src/uniffi_api/types.rs` - Added Row, ColumnValue types
- `absurder-sql-mobile/src/uniffi_api/core.rs` - Added convert_row(), convert_column_value()
- `absurder-sql-mobile/src/__tests__/uniffi_row_columnvalue_test.rs` - New test file

### TDD Steps

| Step | Description | Status |
|------|-------------|--------|
| 1.1 | Write test for Row/ColumnValue type exports | ✅ DONE |
| 1.2 | Run test - verify it FAILS (RED) | ✅ DONE |
| 1.3 | Implement Row struct with `#[derive(uniffi::Record)]` | ✅ DONE |
| 1.4 | Implement ColumnValue enum with `#[derive(uniffi::Enum)]` | ✅ DONE |
| 1.5 | Update execute() to return typed rows instead of JSON | ✅ DONE |
| 1.6 | Run test - verify it PASSES (GREEN) | ✅ DONE (4/4 tests pass) |
| 1.7 | Run ALL mobile tests - no regressions | ✅ DONE (54/54 tests pass) |
| 1.8 | Android emulator verification | ⬜ TODO |
| 1.9 | iOS simulator verification | ⬜ TODO |

### Verification Commands

```bash
# Run mobile tests
cd /Users/nicholas.piesco/Downloads/absurder-sql/absurder-sql-mobile
cargo test --features uniffi-bindings

# Android build & deploy
npx uniffi-bindgen-react-native build android --and-generate
cd react-native && npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res && cd android && ./gradlew assembleDebug
$HOME/Library/Android/sdk/platform-tools/adb install -r /Users/nicholas.piesco/Downloads/absurder-sql/absurder-sql-mobile/react-native/android/app/build/outputs/apk/debug/app-debug.apk
$HOME/Library/Android/sdk/platform-tools/adb logcat -c && $HOME/Library/Android/sdk/platform-tools/adb shell am start -n com.absurdersqltestapp/.MainActivity

# iOS build & deploy
npx uniffi-bindgen-react-native build ios --and-generate
cd react-native/ios && pod install && cd ../..
cd react-native && npx react-native run-ios --simulator="iPhone 16"
```

---

## Phase 2: Fix QueryResult Fields

### Files to Modify
- `absurder-sql-mobile/src/uniffi_api/types.rs`
- `absurder-sql-mobile/src/uniffi_api/core.rs`

### TDD Steps

| Step | Description | Status |
|------|-------------|--------|
| 2.1 | Write test for last_insert_id field | ⬜ TODO |
| 2.2 | Write test for execution_time_ms field | ⬜ TODO |
| 2.3 | Run tests - verify they FAIL (RED) | ⬜ TODO |
| 2.4 | Add last_insert_id to QueryResult struct | ⬜ TODO |
| 2.5 | Add execution_time_ms to QueryResult struct | ⬜ TODO |
| 2.6 | Update execute() to populate new fields | ⬜ TODO |
| 2.7 | Run tests - verify they PASS (GREEN) | ⬜ TODO |
| 2.8 | Run ALL mobile tests - no regressions | ⬜ TODO |
| 2.9 | Android emulator verification | ⬜ TODO |
| 2.10 | iOS simulator verification | ⬜ TODO |

---

## Phase 3: Fix PreparedStatement Result Return

### Files to Modify
- `absurder-sql-mobile/src/uniffi_api/core.rs`

### TDD Steps

| Step | Description | Status |
|------|-------------|--------|
| 3.1 | Write test for execute_statement returning QueryResult | ⬜ TODO |
| 3.2 | Run test - verify it FAILS (RED) | ⬜ TODO |
| 3.3 | Change execute_statement signature: `Result<(), _>` → `Result<QueryResult, _>` | ⬜ TODO |
| 3.4 | Implement result population in execute_statement | ⬜ TODO |
| 3.5 | Run test - verify it PASSES (GREEN) | ⬜ TODO |
| 3.6 | Run ALL mobile tests - no regressions | ⬜ TODO |
| 3.7 | Android emulator verification | ⬜ TODO |
| 3.8 | iOS simulator verification | ⬜ TODO |

---

## Phase 4: Align DatabaseConfig with Core

### Files to Modify
- `absurder-sql-mobile/src/uniffi_api/types.rs`
- `absurder-sql-mobile/src/uniffi_api/core.rs`

### TDD Steps

| Step | Description | Status |
|------|-------------|--------|
| 4.1 | Write test for extended DatabaseConfig options | ⬜ TODO |
| 4.2 | Run test - verify it FAILS (RED) | ⬜ TODO |
| 4.3 | Add cache_size, page_size, journal_mode, auto_vacuum to DatabaseConfig | ⬜ TODO |
| 4.4 | Update create_database() to use new config fields | ⬜ TODO |
| 4.5 | Add mobile_optimized() helper | ⬜ TODO |
| 4.6 | Run test - verify it PASSES (GREEN) | ⬜ TODO |
| 4.7 | Run ALL mobile tests - no regressions | ⬜ TODO |
| 4.8 | Android emulator verification | ⬜ TODO |
| 4.9 | iOS simulator verification | ⬜ TODO |

---

## Phase 5: Update TypeScript Wrapper

### Files to Modify
- `absurder-sql-mobile/src/AbsurderDatabase.ts`

### TDD Steps

| Step | Description | Status |
|------|-------------|--------|
| 5.1 | Remove JSON parsing workarounds for rows | ⬜ TODO |
| 5.2 | Update PreparedStatement.execute() to return results | ⬜ TODO |
| 5.3 | Add new DatabaseConfig options to TypeScript interface | ⬜ TODO |
| 5.4 | Run ALL mobile tests - no regressions | ⬜ TODO |
| 5.5 | Android emulator verification | ⬜ TODO |
| 5.6 | iOS simulator verification | ⬜ TODO |
| 5.7 | Final integration test - both platforms | ⬜ TODO |

---

## What Already Works (DO NOT BREAK)

- ✅ Basic execute/query operations
- ✅ Encryption (feature-gated)
- ✅ Streaming API (cursors)
- ✅ Export/import operations
- ✅ Batch execution
- ✅ Build system (SQLCipher, Android NDK)

---

## Quick Reference Commands

### List Available Emulators/Simulators
```bash
# Android
~/Library/Android/sdk/emulator/emulator -list-avds

# iOS
xcrun simctl list devices | grep "iPhone 16"
```

### Full Rebuild Commands
```bash
# Full Android rebuild (from absurder-sql-mobile directory)
npx uniffi-bindgen-react-native build android --and-generate && cd react-native && npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res && cd android && ./gradlew assembleDebug && cd ../../.. && $HOME/Library/Android/sdk/platform-tools/adb install -r react-native/android/app/build/outputs/apk/debug/app-debug.apk

# Full iOS rebuild (from absurder-sql-mobile directory)
npx uniffi-bindgen-react-native build ios --and-generate && cd react-native && npx react-native run-ios --simulator="iPhone 16"
```

### Refresh App (Android)
```bash
$HOME/Library/Android/sdk/platform-tools/adb shell input text "RR"
```
