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
- [ ] Create AddEditCredentialScreen
- [ ] Create CredentialDetailScreen
- [ ] Create SettingsScreen

### 1.5 Native Integration
- [ ] Create iOS project (Xcode)
- [ ] Create Android project (Android Studio)
- [ ] Link absurder-sql-mobile native libraries
- [ ] Test on iOS Simulator
- [ ] Test on Android Emulator

---

## Phase 2: Essential Features

### 2.1 Password Generator
- [ ] Create PasswordGenerator component
- [ ] Implement configurable length (8-128 chars)
- [ ] Implement character set options (upper, lower, digits, symbols)
- [ ] Implement passphrase mode (word-based)
- [ ] Add copy-to-clipboard functionality

### 2.2 Credential Management
- [ ] Implement TOTP secret storage
- [ ] Implement custom fields
- [ ] Implement tags/categories
- [ ] Implement favorites
- [ ] Implement credential sorting options

### 2.3 Folders & Organization
- [ ] Create FoldersScreen
- [ ] Implement folder creation/editing
- [ ] Implement folder hierarchy (nested folders)
- [ ] Implement drag-drop credential organization
- [ ] Implement folder icons/colors

### 2.4 Search & Filter
- [ ] Implement full-text search
- [ ] Implement filter by folder
- [ ] Implement filter by tag
- [ ] Implement filter by favorites
- [ ] Implement recent items

---

## Phase 3: Security Features

### 3.1 Biometric Authentication
- [ ] Add react-native-keychain dependency
- [ ] Implement Face ID unlock (iOS)
- [ ] Implement Touch ID unlock (iOS)
- [ ] Implement fingerprint unlock (Android)
- [ ] Implement biometric enrollment flow

### 3.2 Auto-Lock
- [ ] Implement app background detection
- [ ] Implement configurable auto-lock timeout
- [ ] Implement lock on app switch
- [ ] Implement clipboard auto-clear

### 3.3 Security Audit
- [ ] Implement weak password detection
- [ ] Implement duplicate password detection
- [ ] Implement password age tracking
- [ ] Create security audit dashboard
- [ ] Implement 2FA adoption score

### 3.4 Master Password
- [ ] Implement master password change
- [ ] Implement password strength meter
- [ ] Implement password requirements validation
- [ ] Add master password hint (optional)

---

## Phase 4: Import/Export & Sync

### 4.1 File Operations
- [ ] Implement export vault to file
- [ ] Implement import vault from file
- [ ] Add file picker integration
- [ ] Add share sheet integration (iOS)
- [ ] Add share intent integration (Android)

### 4.2 Import from Other Managers
- [ ] Implement 1Password CSV import
- [ ] Implement Bitwarden JSON import
- [ ] Implement LastPass CSV import
- [ ] Implement KeePass XML import
- [ ] Implement Chrome passwords CSV import

### 4.3 Manual Sync Workflow
- [ ] Document AirDrop sync workflow
- [ ] Document USB sync workflow
- [ ] Document email attachment workflow
- [ ] Add sync conflict detection
- [ ] Add merge capability

---

## Phase 5: TOTP Authenticator

### 5.1 TOTP Core
- [ ] Implement TOTP code generation
- [ ] Implement countdown timer
- [ ] Implement QR code scanner
- [ ] Implement manual secret entry

### 5.2 TOTP UI
- [ ] Create TOTP display component
- [ ] Add copy TOTP code functionality
- [ ] Add TOTP to credential detail view
- [ ] Implement TOTP-only quick view

---

## Phase 6: Polish & UX

### 6.1 UI/UX Improvements
- [ ] Implement dark/light theme toggle
- [ ] Add haptic feedback
- [ ] Add loading states
- [ ] Add error handling UI
- [ ] Add empty states

### 6.2 Accessibility
- [ ] Add screen reader support
- [ ] Add dynamic font sizing
- [ ] Add high contrast mode
- [ ] Test with VoiceOver (iOS)
- [ ] Test with TalkBack (Android)

### 6.3 Performance
- [ ] Implement lazy loading for large vaults
- [ ] Optimize search performance
- [ ] Add credential list virtualization
- [ ] Profile and optimize renders

---

## Phase 7: App Store Release

### 7.1 iOS Release
- [ ] Create app icons (all sizes)
- [ ] Create launch screen
- [ ] Write App Store description
- [ ] Create App Store screenshots
- [ ] Submit to App Store Connect
- [ ] Pass App Store review

### 7.2 Android Release
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

- [ ] All Phase 1 items complete
- [ ] All Phase 2 items complete
- [ ] All Phase 3 items complete
- [ ] All Phase 4 items complete
- [ ] All Phase 5 items complete
- [ ] All Phase 6 items complete
- [ ] All Phase 7 items complete (App Store release)
- [ ] All Phase 8 items complete (PWA)
- [ ] All Phase 9 items complete (Desktop)
- [ ] **VAULT 1.0 COMPLETE**

---

*Last updated: 2025-12-01*
