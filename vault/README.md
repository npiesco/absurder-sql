# AbsurderSQL Vault

<p>
  <strong>The Password Manager That's Just a File</strong>
</p>

**Tech Stack:**
[![Next.js](https://img.shields.io/badge/nextjs-16.0.1-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/react-19.2.0-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)](https://www.typescriptlang.org/)
[![SQLCipher](https://img.shields.io/badge/sqlcipher-AES--256-green)](https://www.zetetic.net/sqlcipher/)

**Platforms:**
[![PWA](https://img.shields.io/badge/pwa-browser-purple)](https://web.dev/progressive-web-apps/)
[![Desktop](https://img.shields.io/badge/desktop-tauri-orange)](https://tauri.app/)
[![Mobile](https://img.shields.io/badge/mobile-react--native-61dafb)](https://reactnative.dev/)

**Security:**
[![Encryption](https://img.shields.io/badge/encryption-AES--256--CBC-success)](https://www.zetetic.net/sqlcipher/)
[![Zero Cloud](https://img.shields.io/badge/cloud-zero-red)](https://en.wikipedia.org/wiki/Zero-knowledge_proof)
[![Local First](https://img.shields.io/badge/storage-local--first-blue)](https://localfirstweb.dev/)

> *Your passwords. One file. Every device. Forever.*

## The Problem

Every password manager today has the same fundamental issue: **your vault lives in their cloud**.

| Manager | Your Data Location | Trust Model |
|---------|-------------------|-------------|
| 1Password | 1Password servers | Trust them forever |
| LastPass | LastPass servers | [Breached 2022](https://blog.lastpass.com/2022/12/notice-of-recent-security-incident/) |
| Bitwarden | Bitwarden cloud | Trust them (or self-host server) |
| Dashlane | Dashlane servers | Trust them forever |

Even "local" options like KeePass require you to manually sync `.kdbx` files via Dropbox/Google Drive—still cloud dependency.

**Vaultwarden** (self-hosted Bitwarden) uses SQLite but requires running a server 24/7.

## The Solution

**AbsurderSQL Vault** is different:

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR ENCRYPTED VAULT                      │
│                     (SQLCipher .db file)                     │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Browser   │  │   Desktop   │  │   Mobile    │          │
│  │    (PWA)    │  │   (Tauri)   │  │(React Native)│          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         │                │                │                  │
│         └────────────────┼────────────────┘                  │
│                          │                                   │
│                   ┌──────▼──────┐                            │
│                   │  Export →   │                            │
│                   │  AirDrop/   │                            │
│                   │  USB/Email  │                            │
│                   │  → Import   │                            │
│                   └─────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

- **No server.** Not even a self-hosted one.
- **No cloud.** Your file never leaves your device unless YOU move it.
- **No subscription.** It's your file. Forever.
- **No trust.** AES-256 encryption. You control the key.

## Key Features

### Zero-Server Password Management

**Works in browser (PWA):**
- Install from any browser—no download
- Full offline support after initial load
- IndexedDB + WASM SQLCipher encryption
- Export encrypted vault as downloadable file

**Works on desktop (Tauri):**
- Native app for Windows, macOS, Linux
- Same vault file, native performance
- System keychain integration
- Auto-lock on screen lock

**Works on mobile (React Native):**
- iOS and Android native apps
- Same vault file as browser/desktop
- Face ID / Touch ID / Biometric unlock
- SQLCipher encryption at rest

### The "Just a File" Workflow

```
1. Create vault in browser PWA
   └── vault.db (encrypted)

2. Export vault
   └── Downloads/my-vault.db

3. Transfer to phone
   └── AirDrop / USB / Email attachment

4. Import in mobile app
   └── Same passwords, same vault

5. Make changes on mobile
   └── Export → transfer → import in browser

No sync service. No account. No subscription.
```

### Security Model

**Encryption:**
- SQLCipher AES-256-CBC encryption
- PBKDF2-HMAC-SHA512 key derivation (256,000 iterations)
- Per-page IV (Initialization Vector)
- HMAC-SHA512 page authentication

**Zero Knowledge:**
- Master password never stored
- Vault encrypted at rest AND in memory
- No telemetry, no analytics, no network calls
- Open source—audit the code yourself

**Key Derivation:**
```
Master Password
       │
       ▼
┌─────────────────────────────────────┐
│  PBKDF2-HMAC-SHA512                 │
│  256,000 iterations                 │
│  Random salt (stored in vault)      │
└─────────────────────────────────────┘
       │
       ▼
256-bit AES Key → SQLCipher Encryption
```

### Vault Contents

**Credentials:**
- Website/service name
- Username/email
- Password (encrypted)
- URL with auto-match
- TOTP secrets (2FA)
- Custom fields
- Notes (encrypted)
- Tags and folders

**Password Generator:**
- Configurable length (8-128 chars)
- Character sets (upper, lower, digits, symbols)
- Passphrase mode (word-based)
- Pronounceable passwords
- No external API calls

**Security Audit:**
- Weak password detection
- Reused password warnings
- Breach checking (local haveibeenpwned database)
- Password age tracking
- 2FA adoption score

## Architecture

### Browser PWA

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser Environment                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    React 19 UI                       │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │    │
│  │  │ Vault   │ │Generator│ │ Audit   │ │Settings │   │    │
│  │  │ Browser │ │         │ │         │ │         │   │    │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │    │
│  │       └───────────┴───────────┴───────────┘         │    │
│  │                        │                             │    │
│  │              ┌─────────▼─────────┐                   │    │
│  │              │   Zustand Store   │                   │    │
│  │              │ (decrypted state) │                   │    │
│  │              └─────────┬─────────┘                   │    │
│  └────────────────────────┼─────────────────────────────┘    │
│                           │                                   │
│  ┌────────────────────────▼─────────────────────────────┐    │
│  │              AbsurderSQL WASM Layer                   │    │
│  │  ┌─────────────────┐  ┌─────────────────────────┐    │    │
│  │  │ SQLCipher WASM  │  │  IndexedDB VFS          │    │    │
│  │  │ (AES-256)       │  │  (4KB block storage)    │    │    │
│  │  └─────────────────┘  └─────────────────────────┘    │    │
│  └──────────────────────────────────────────────────────┘    │
│                           │                                   │
│                  ┌────────▼────────┐                          │
│                  │   IndexedDB     │                          │
│                  │ (encrypted .db) │                          │
│                  └─────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### Mobile (React Native)

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native App                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    React Native UI                    │    │
│  │         (shared components with PWA)                  │    │
│  └───────────────────────┬───────────────────────────────┘    │
│                          │                                    │
│  ┌───────────────────────▼───────────────────────────────┐   │
│  │              AbsurderSQL Mobile (UniFFI)               │   │
│  │  ┌─────────────────┐  ┌─────────────────────────┐     │   │
│  │  │ SQLCipher       │  │  Device Filesystem      │     │   │
│  │  │ (native libs)   │  │  (iOS: Documents/       │     │   │
│  │  │                 │  │   Android: app data)    │     │   │
│  │  └─────────────────┘  └─────────────────────────┘     │   │
│  └───────────────────────────────────────────────────────┘   │
│                          │                                    │
│  ┌───────────────────────▼───────────────────────────────┐   │
│  │              Biometric Authentication                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │   │
│  │  │  Face ID    │  │  Touch ID   │  │ Fingerprint │   │   │
│  │  │  (iOS)      │  │  (iOS)      │  │ (Android)   │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

```sql
-- Core credentials table
CREATE TABLE credentials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT,
    password_encrypted BLOB NOT NULL,  -- Double-encrypted with item key
    url TEXT,
    totp_secret_encrypted BLOB,
    notes_encrypted BLOB,
    folder_id TEXT,
    favorite INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    password_updated_at INTEGER,
    FOREIGN KEY (folder_id) REFERENCES folders(id)
);

-- Folders for organization
CREATE TABLE folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT,
    icon TEXT,
    color TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES folders(id)
);

-- Tags for flexible categorization
CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT
);

CREATE TABLE credential_tags (
    credential_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (credential_id, tag_id),
    FOREIGN KEY (credential_id) REFERENCES credentials(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Custom fields
CREATE TABLE custom_fields (
    id TEXT PRIMARY KEY,
    credential_id TEXT NOT NULL,
    name TEXT NOT NULL,
    value_encrypted BLOB NOT NULL,
    field_type TEXT DEFAULT 'text',  -- text, hidden, url, email
    FOREIGN KEY (credential_id) REFERENCES credentials(id) ON DELETE CASCADE
);

-- Password history
CREATE TABLE password_history (
    id TEXT PRIMARY KEY,
    credential_id TEXT NOT NULL,
    password_encrypted BLOB NOT NULL,
    changed_at INTEGER NOT NULL,
    FOREIGN KEY (credential_id) REFERENCES credentials(id) ON DELETE CASCADE
);

-- Vault metadata (not encrypted, stores salt)
CREATE TABLE vault_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_credentials_folder ON credentials(folder_id);
CREATE INDEX idx_credentials_updated ON credentials(updated_at DESC);
CREATE INDEX idx_credentials_name ON credentials(name);
CREATE INDEX idx_password_history_credential ON password_history(credential_id);
CREATE VIRTUAL TABLE credentials_fts USING fts5(name, username, url, notes);
```

## Technology Stack

### Frontend (Shared)
- **React 19** with concurrent rendering
- **TypeScript 5.x** for type safety
- **Tailwind CSS 4** + **shadcn/ui** components
- **Zustand** for encrypted state management
- **React Hook Form** + **Zod** for validation

### Browser PWA
- **Next.js 16** (App Router)
- **@npiesco/absurder-sql** (WASM SQLCipher)
- **IndexedDB VFS** (encrypted block storage)
- **Web Crypto API** for additional encryption layers
- **Service Worker** for offline support

### Desktop (Tauri)
- **Tauri 2.0** (Rust backend)
- **Native SQLCipher** (bundled)
- **System Keychain** integration (macOS Keychain, Windows Credential Manager)
- **Auto-updater** with signature verification

### Mobile (React Native)
- **React Native 0.82+**
- **absurder-sql-mobile** (UniFFI bindings)
- **react-native-keychain** for biometrics
- **Expo SecureStore** fallback

### Testing
- **Playwright** for E2E (browser)
- **Detox** for E2E (mobile)
- **Vitest** for unit tests
- **Security audit tests** (encryption validation)

## Getting Started

### Browser PWA (Quickest)

```bash
cd vault
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Create your first vault:**
1. Click "Create New Vault"
2. Enter master password (min 12 characters)
3. Confirm master password
4. Vault created—start adding credentials

### Desktop (Tauri)

```bash
cd vault
npm install
npm run tauri dev
```

**Prerequisites:**
- Rust 1.85+
- [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

### Mobile (React Native)

```bash
cd vault/mobile
npm install

# iOS
npm run ios

# Android
npm run android
```

**Prerequisites:**
- Node.js 18+
- Xcode 14+ (iOS)
- Android Studio (Android)
- See [absurder-sql-mobile setup](../absurder-sql-mobile/README.md)

## Import/Export Workflow

### Export from Browser

```typescript
// In browser PWA
const vault = useVaultStore();

// Export encrypted vault
const exportedFile = await vault.exportToFile();

// Download as file
const blob = new Blob([exportedFile], { type: 'application/octet-stream' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'my-vault.db';
a.click();
```

### Import on Mobile

```typescript
// In React Native app
import { AbsurderDatabase } from 'absurder-sql-mobile';
import DocumentPicker from 'react-native-document-picker';

// Pick vault file
const result = await DocumentPicker.pick({
  type: ['application/octet-stream'],
});

// Import vault
const vault = await AbsurderDatabase.openEncrypted({
  path: result.uri,
  password: masterPassword,
});

// Vault ready—same credentials as browser!
const credentials = await vault.query('SELECT * FROM credentials');
```

### Sync Strategies

**Manual Sync (Recommended):**
```
Browser → Export → AirDrop → Mobile → Import
Mobile → Export → Email to self → Browser → Import
```

**Shared Storage Sync:**
```
Browser → Export to iCloud Drive/Google Drive
Mobile → Import from iCloud Drive/Google Drive
```

**Local Network Sync:**
```
Browser → Export → Local web server
Mobile → Import from local URL
```

## Security Considerations

### What's Encrypted

| Data | Encryption | Location |
|------|-----------|----------|
| Master password | Never stored | Memory only (during session) |
| Vault file | SQLCipher AES-256 | IndexedDB / filesystem |
| Passwords | Double-encrypted (vault + item key) | In vault |
| TOTP secrets | Double-encrypted | In vault |
| Notes | Double-encrypted | In vault |
| Custom fields | Double-encrypted | In vault |
| Folder names | Vault-level encryption | In vault |
| Vault metadata | Plaintext (salt, version) | In vault |

### Threat Model

**Protected Against:**
- Remote server breaches (no server)
- Cloud provider access (no cloud)
- Man-in-the-middle attacks (no network)
- Memory dumps (encrypted in memory)
- Shoulder surfing (masked passwords)

**NOT Protected Against:**
- Compromised device (malware with root access)
- Physical device theft (enable device encryption!)
- Weak master password (use 16+ chars)
- Social engineering (don't share your password)

### Security Best Practices

1. **Master Password:** Use 16+ characters, mix of words/numbers/symbols
2. **Device Security:** Enable full-disk encryption, screen lock
3. **Backup:** Export vault regularly, store backup securely
4. **2FA:** Enable TOTP for all supported services
5. **Updates:** Keep app updated for security patches

## Comparison with Alternatives

### vs KeePass/KeePassXC

| Feature | KeePass | AbsurderSQL Vault |
|---------|---------|-------------------|
| File format | .kdbx (proprietary) | SQLite .db (standard) |
| Browser version | No (plugins only) | Full PWA |
| UI/UX | Dated (1990s feel) | Modern React |
| Mobile | 3rd party apps | Native (same codebase) |
| Browser autofill | Via plugins | Built-in |
| Sync | Manual/cloud | Manual (export/import) |

### vs Bitwarden/Vaultwarden

| Feature | Bitwarden | AbsurderSQL Vault |
|---------|-----------|-------------------|
| Server required | Yes (cloud or self-host) | No |
| Subscription | Free tier / $10/yr | Free forever |
| Data location | Their servers | Your device |
| Offline | Limited | Full |
| File export | JSON/CSV | SQLite .db |
| Mobile | Native app | Native app |

### vs 1Password

| Feature | 1Password | AbsurderSQL Vault |
|---------|-----------|-------------------|
| Price | $36/year | Free |
| Data location | 1Password servers | Your device |
| Server breach risk | Yes | No (no server) |
| Family sharing | Subscription feature | Export/import file |
| Offline | Cached data | Full native |
| Open source | No | Yes |

## Roadmap

### Phase 1: Core Vault (Current)
- [x] Project setup and README
- [ ] SQLCipher WASM integration
- [ ] Master password unlock flow
- [ ] Credential CRUD operations
- [ ] Password generator
- [ ] Export/import .db files
- [ ] PWA offline support

### Phase 2: Browser Experience
- [ ] Browser extension (Chrome/Firefox)
- [ ] Autofill support
- [ ] Domain matching
- [ ] Keyboard shortcuts
- [ ] Search and filtering

### Phase 3: Desktop App
- [ ] Tauri build setup
- [ ] System tray
- [ ] Global hotkey unlock
- [ ] Keychain integration
- [ ] Auto-lock

### Phase 4: Mobile App
- [ ] React Native setup
- [ ] Biometric unlock
- [ ] Autofill service (iOS/Android)
- [ ] Share extension
- [ ] Widget support

### Phase 5: Advanced Features
- [ ] TOTP authenticator
- [ ] Security audit dashboard
- [ ] Breach monitoring (local)
- [ ] Secure notes
- [ ] File attachments

## Contributing

This app is part of the AbsurderSQL monorepo.

**Development Workflow:**
1. Fork the repository
2. Create feature branch (`git checkout -b feature/vault-feature`)
3. Run tests (`npm run test:all`)
4. Commit changes (`git commit -m 'Add vault feature'`)
5. Push to branch (`git push origin feature/vault-feature`)
6. Open Pull Request

**Security Contributions:**
- Security issues: Open private advisory on GitHub
- Encryption review: PRs welcome with test vectors
- Penetration testing: Document findings in security audit

## License

AGPL-3.0 - See main [absurder-sql](../README.md) repository.

**Why AGPL?** If someone forks this and makes it cloud-based, they must open-source their changes. Your passwords stay yours.

---

## Related Documentation

### Core Documentation
- [Main Project README](../README.md) - AbsurderSQL overview
- [Mobile Setup](../absurder-sql-mobile/README.md) - React Native bindings
- [PWA Admin Tool](../pwa/README.md) - Database admin interface

### Security Resources
- [SQLCipher Documentation](https://www.zetetic.net/sqlcipher/documentation/)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [haveibeenpwned API](https://haveibeenpwned.com/API/v3)

### Related Projects
- [AsbsurderSQL PWA](../pwa/) - Database admin tool
- [AbsurderSQL Mobile](../absurder-sql-mobile/) - iOS/Android bindings
