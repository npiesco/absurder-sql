# Vault Planning & Progress Tree

Sequential development checklist from scaffold to finished app.

---

## Phase 1: Mobile Core (Current)

### 1.1 Project Setup
- [x] Create vault/mobile directory structure
- [x] Create package.json with absurder-sql-mobile dependency
- [x] Create tsconfig.json
- [x] Create babel.config.js
- [x] Create app.json and index.js entry points

### 1.2 Database Layer
- [x] Create VaultDatabase wrapper class
- [x] Implement vault schema (credentials, folders, tags, history)
- [x] Implement credential CRUD operations
- [x] Implement folder operations
- [x] Implement password history tracking
- [x] Implement export/import for vault sync

### 1.3 State Management
- [x] Create Zustand store
- [x] Implement unlock/lock actions
- [x] Implement credentials cache
- [x] Implement search functionality

### 1.4 Core Screens
- [x] Create UnlockScreen (master password entry)
- [x] Create CredentialsScreen (list with search)
- [x] Create AddEditCredentialScreen (with validation + password generation)
- [x] Create CredentialDetailScreen (password reveal, copy, edit navigation)
- [x] Create SettingsScreen (vault stats, lock, export, about section)

### 1.5 Native Integration
- [x] Create iOS project (Xcode) - VaultApp.xcworkspace
- [x] Create Android project (Android Studio) - android/
- [x] Link absurder-sql-mobile native libraries (CocoaPods)
- [x] Test on iOS Simulator (builds successfully)
- [x] Test on Android Emulator (Detox tests passing)

### 1.6 E2E Testing (Detox)
- [x] Configure Detox for iOS
- [x] Configure Detox for Android
- [x] Write addCredential E2E test (5 tests passing)
- [x] Validation test passing
- [x] Password generation test passing
- [x] Full vault creation flow test
- [x] Persistence test suite (3 tests - multiple credentials, terminate/relaunch cycles)
- [x] CredentialDetail E2E test (8 tests - view, toggle password, copy, edit navigation)
- [x] Settings E2E test (8 tests - vault stats, security, about, lock, export)
- [x] PasswordGenerator E2E test (6 tests - slider, configurable length 8-128)

---

## Phase 2: Essential Features

### 2.1 Password Generator
- [x] Create PasswordGenerator component (integrated in AddEditCredentialScreen)
- [x] Implement 20-char strong password generation (upper, lower, digits, symbols)
- [x] Implement configurable length (8-128 chars) with slider UI
- [x] Implement passphrase mode (word-based, 3-8 words, 8 E2E tests)
- [x] Add copy-to-clipboard functionality

### 2.2 Credential Management
- [x] Implement TOTP secret storage
- [x] Implement custom fields (6 E2E tests - add, display, edit, delete, persist)
- [x] Implement tags/categories (7 E2E tests - create, assign, display, multiple, remove, persist)
- [x] Implement favorites (6 E2E tests - toggle from detail, toggle from card, persist)
- [x] Implement credential sorting options (8 E2E tests - A-Z, Z-A, updated, created, favorites, persist)

### 2.3 Folders & Organization
- [x] Create FoldersScreen (6 E2E tests - create, edit, delete, assign, filter, persist)
- [x] Implement folder creation/editing
- [x] Implement folder hierarchy (nested folders) (12 E2E tests - subfolder CRUD, expand/collapse, nested paths, persist)
- [x] Implement move-to-folder modal (8 E2E tests - display button, show modal, move to folder, change folder, move to root, persist, cancel)
- [x] Implement folder icons/colors (6 E2E tests - icon picker, color picker, create with style, edit, persist, default)

### 2.4 Search & Filter
- [x] Implement full-text search (existing search functionality)
- [x] Implement filter by folder (included in folders feature)
- [x] Implement filter by tag (included in tags feature)
- [x] Implement filter by favorites (included in sorting/favorites)
- [x] Implement recent items (9 E2E tests - sort option, track on view/copy, persist, nulls last)

---

## Phase 3: Import/Export & Sync

### 3.1 File Operations
- [x] Implement export vault to file (8 E2E tests - setup, navigate, display button, confirmation dialog, cancel, export, dismiss, persist)
- [x] Implement import vault from file (10 E2E tests - setup, export, display button, confirmation dialog, cancel, delete credentials, import, verify restored, verify details, persist)
- [x] Add file picker integration (10 E2E tests - setup, export, display modal, cancel modal, recent backups list, cancel backup list, delete credential, import from backup, verify restored, persist)
- [x] Add share sheet integration (iOS) (included in export)

### 3.2 Manual Sync Workflow
- [x] Add sync conflict detection (22 E2E tests - syncService.ts analyzes backup vs local)
- [x] Add merge capability (conflict resolution UI: keep local, keep backup, keep both)

---

## Phase 4: Security Features

### 4.1 Biometric Authentication (iOS)
- [x] Add react-native-keychain dependency
- [x] Implement Face ID/Touch ID unlock (10 E2E tests - setup, toggle display, enable, show prompt, unlock success, password fallback, persist enabled, disable, no prompt after disable, persist disabled)
- [x] Implement biometric enrollment flow (enable/disable toggle in Settings)
- [x] Store encrypted master password in Keychain (biometricService.ts)

### 4.2 Auto-Lock
- [x] Implement app background detection (14 E2E tests - AppState listener in App.tsx)
- [x] Implement configurable auto-lock timeout (immediate, 1min, 5min, 15min, never)
- [x] Implement lock on app switch (autoLockService.ts with background time tracking)
- [x] Implement clipboard auto-clear (configurable: 30sec, 1min, 5min, never)

### 4.3 Security Audit
- [x] Implement weak password detection (informative only, not blocking)
- [x] Implement password age tracking (show old passwords that should be rotated)
- [x] Create security audit dashboard (summary view of vault health)

### 4.4 Master Password
- [x] Implement master password change (12 E2E tests - display button, modal fields, strength meter, reject incorrect password, reject mismatch, reject short password, change with hint, verify old fails, unlock with new, preserve data, show hint on unlock, persist across restart)
- [x] Implement password strength meter (informative only)
- [x] Add master password hint (optional)

---

## Phase 5: TOTP Authenticator

### 5.1 TOTP Core
- [x] Implement TOTP code generation (11 E2E tests - create credential with TOTP secret, display TOTP code in detail, display 6-digit code, countdown timer, progress indicator, copy button, copy to clipboard, navigate back, create without TOTP, no TOTP section without secret, persist across restart)
- [x] Implement countdown timer
- [x] Implement QR code scanner (8 E2E tests - scan QR button visible, open scanner, close button, manual entry modal, secret input field, close manual entry, return to add credential, cancel flow)
- [x] Implement manual secret entry

### 5.2 TOTP UI
- [x] Create TOTP display component
- [x] Add copy TOTP code functionality
- [x] Add TOTP to credential detail view
- [x] Implement TOTP-only quick view (5 E2E tests - quick view button in header, navigate to screen, empty state, back button, navigate back)

---

## Phase 6: Polish & UX

### 6.1 UI/UX Improvements
- [x] Implement dark/light theme toggle (7 E2E tests - display setting, show value, open picker, select light, select dark, select system, persist across restart)
- [x] Add haptic feedback (2 E2E tests - display/toggle setting, persist across restart)
- [x] Add loading states (3 E2E tests - vault creation, vault unlock, credential save)
- [x] Add error handling UI (3 E2E tests - password mismatch, wrong unlock password, empty credential name)
- [x] Add empty states (1 E2E test - empty credentials list)

### 6.2 Accessibility
- [x] Add screen reader support (3 E2E tests - accessibility labels on FAB, settings, search)
- [x] Add dynamic font sizing (5 E2E tests - display setting, show value, change to large, change to small, persist)
- [x] Add high contrast mode (4 E2E tests - display setting, show disabled, toggle on, persist)

### 6.3 Performance (4 E2E tests)
- [x] Implement lazy loading for large vaults (FlatList virtualization props)
- [x] Optimize search performance (debounced search, memoized filtering)
- [x] Add credential list virtualization (removeClippedSubviews, windowSize, maxToRenderPerBatch)
- [x] Profile and optimize renders (useMemo, useCallback for expensive operations)
- [x] E2E tests: large list handling, scroll performance, search performance, filter performance

---

## Phase 7: App Store Release

### 7.1 iOS Release
- [ ] Create app icons (all sizes)
- [ ] Create launch screen
- [ ] Write App Store description
- [ ] Create App Store screenshots
- [ ] Submit to App Store Connect
- [ ] Pass App Store review

### 7.2 Android Build & Release
- [ ] Build Rust for Android targets (aarch64, armv7, x86_64)
- [ ] Wire up Kotlin UniFFI bindings
- [ ] Test on Android Emulator
- [ ] Implement fingerprint unlock (Android)
- [ ] Add share intent integration (Android)
- [ ] Create app icons (all sizes)
- [ ] Create splash screen
- [ ] Write Play Store description
- [ ] Create Play Store screenshots
- [ ] Generate signed APK/AAB
- [ ] Submit to Google Play Console
- [ ] Pass Play Store review

### 7.3 Documentation
- [ ] Write user guide
- [ ] Create FAQ
- [ ] Document security model
- [ ] Create privacy policy
- [ ] Create terms of service

---

## Phase 8: PWA (Browser Version)

### 8.1 PWA Setup
- [ ] Create vault/pwa directory
- [ ] Set up Next.js project
- [ ] Integrate @npiesco/absurder-sql WASM
- [ ] Implement service worker for offline

### 8.2 PWA Features
- [ ] Port UnlockScreen to web
- [ ] Port CredentialsScreen to web
- [ ] Port password generator to web
- [ ] Implement IndexedDB backup pattern
- [ ] Test offline functionality

### 8.3 Browser Extension
- [ ] Create Chrome extension scaffold
- [ ] Implement autofill detection
- [ ] Implement credential suggestion
- [ ] Implement keyboard shortcuts
- [ ] Submit to Chrome Web Store

---

## Phase 9: Desktop (Tauri)

### 9.1 Tauri Setup
- [ ] Create vault/desktop directory
- [ ] Set up Tauri project
- [ ] Configure native SQLCipher
- [ ] Build for macOS
- [ ] Build for Windows
- [ ] Build for Linux

### 9.2 Desktop Features
- [ ] Implement system tray
- [ ] Implement global hotkey unlock
- [ ] Implement system keychain integration
- [ ] Implement auto-lock on screen lock
- [ ] Implement auto-updater

---

## Completion Checklist

- [x] All Phase 1 items complete (except Android testing)
- [x] All Phase 2 items complete
- [x] All Phase 3 items complete (Import/Export)
- [x] All Phase 4 items complete (Security)
- [x] All Phase 5 items complete (TOTP Authenticator)
- [ ] All Phase 6 items complete
- [ ] All Phase 7 items complete (App Store release)
- [ ] All Phase 8 items complete (PWA)
- [ ] All Phase 9 items complete (Desktop)
- [ ] **VAULT 1.0 COMPLETE**

---

*Last updated: 2025-12-16*
