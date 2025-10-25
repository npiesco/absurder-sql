# Database Encryption Guide

AbsurderSQL supports optional database encryption using SQLCipher for native applications (not available in WASM/browser mode).

## Overview

When enabled with the `encryption` feature flag, AbsurderSQL provides:
- **AES-256 encryption** for data at rest
- **Key-based access control** - wrong key = no access
- **Re-keying capability** - change encryption keys without re-creating database
- **Zero performance impact** when disabled (optional feature)

## Feature Flag

Add to your `Cargo.toml`:

```toml
[dependencies]
absurder-sql = { version = "0.1", features = ["encryption", "fs_persist"] }
```

Or build with:
```bash
cargo build --features encryption,fs_persist
```

## Usage

### Creating an Encrypted Database

```rust
use absurder_sql::{Database, DatabaseConfig};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = DatabaseConfig {
        name: "secure.db".to_string(),
        ..Default::default()
    };
    
    let encryption_key = "your-secure-key-min-8-chars";
    let mut db = Database::new_encrypted(config, encryption_key).await?;
    
    // Use database normally
    db.execute("CREATE TABLE secrets (id INTEGER, data TEXT)").await?;
    db.execute("INSERT INTO secrets VALUES (1, 'confidential')").await?;
    
    Ok(())
}
```

### Changing Encryption Key (Re-keying)

```rust
let new_key = "new-secure-key-min-8-chars";
db.rekey(new_key).await?;

// Old key no longer works
// New key is required to access database
```

### Opening Existing Encrypted Database

```rust
let config = DatabaseConfig {
    name: "secure.db".to_string(),
    ..Default::default()
};

// Must use the correct key
let db = Database::new_encrypted(config, "your-secure-key-min-8-chars").await?;
```

## Key Management Best Practices

### Mobile Applications

#### iOS
Store encryption keys in **iOS Keychain**:
```swift
// Store key securely
let keyData = key.data(using: .utf8)!
let query: [String: Any] = [
    kSecClass as String: kSecClassGenericPassword,
    kSecAttrAccount as String: "database_encryption_key",
    kSecValueData as String: keyData
]
SecItemAdd(query as CFDictionary, nil)

// Retrieve key
let searchQuery: [String: Any] = [
    kSecClass as String: kSecClassGenericPassword,
    kSecAttrAccount as String: "database_encryption_key",
    kSecReturnData as String: true
]
var result: AnyObject?
SecItemCopyMatching(searchQuery as CFDictionary, &result)
```

#### Android
Store encryption keys in **Android Keystore**:
```kotlin
// Generate or retrieve key
val keyStore = KeyStore.getInstance("AndroidKeyStore")
keyStore.load(null)

val keyGenerator = KeyGenerator.getInstance(
    KeyProperties.KEY_ALGORITHM_AES,
    "AndroidKeyStore"
)
val keyGenSpec = KeyGenParameterSpec.Builder(
    "database_key",
    KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
)
    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
    .build()

keyGenerator.init(keyGenSpec)
val secretKey = keyGenerator.generateKey()
```

### Server/CLI Applications

- Store keys in **environment variables** (not in code)
- Use **secrets management** (HashiCorp Vault, AWS Secrets Manager)
- Implement **key rotation** policies
- Never commit keys to version control

## Security Considerations

### Key Length
- **Minimum**: 8 characters (enforced)
- **Recommended**: 16+ characters
- **Best**: 32+ random characters

### Key Derivation
SQLCipher automatically applies PBKDF2 key derivation:
- 256,000 iterations (SQLCipher 4.x)
- Makes brute-force attacks computationally expensive

### Wrong Key Behavior
Attempting to open an encrypted database with the wrong key will:
1. Either fail immediately with an error, OR
2. Succeed in opening but fail on first query attempt

This is SQLCipher's security-by-design behavior.

## Performance

### Overhead
- **Encryption overhead**: < 10% (typical)
- **Query performance**: Nearly identical to unencrypted
- **File size**: Same as unencrypted database

### Benchmarks
```bash
# Run encryption benchmarks
cargo test --features encryption,fs_persist --test encryption_tests
```

## Platform Support

| Platform | Encryption Support |
|----------|-------------------|
| Native (Rust) | [x] Full support |
| iOS (React Native) | [x] Via FFI (Phase II) |
| Android (React Native) | [x] Via FFI (Phase II) |
| WASM/Browser | [ ] Not supported |

> **Note**: Browser environments cannot use SQLCipher. For browser encryption, use Web Crypto API separately.

## Compliance

SQLCipher encryption helps meet:
- **HIPAA** - Healthcare data protection
- **GDPR** - EU data privacy
- **PCI DSS** - Payment card data security
- **SOC 2** - Security controls

**Important**: Encryption alone doesn't guarantee compliance. Consult with legal/compliance teams.

## Troubleshooting

### Database Locked Error
```
ENCRYPTION_ERROR: Database is locked
```
**Solution**: Ensure no other process has the database open.

### Wrong Key Error
```
ENCRYPTION_ERROR: Failed to set encryption key
```
**Solution**: Verify you're using the correct encryption key.

### File Not Encrypted
```
# Check if database is encrypted (will fail if encrypted)
sqlite3 secure.db "SELECT * FROM sqlite_master"
# Error: file is not a database
```

This confirms the database is properly encrypted.

## Examples

See `/tests/encryption_tests.rs` for comprehensive examples:
- Creating encrypted databases
- Re-keying
- Persistence validation
- Error handling

## FAQ

**Q: Can I convert an unencrypted database to encrypted?**  
A: Not directly. You must export data, create new encrypted database, and re-import.

**Q: Can I use encryption in browser/WASM?**  
A: No. SQLCipher requires native compilation. Use Web Crypto API for browser encryption.

**Q: What happens if I lose the encryption key?**  
A: The data is **permanently inaccessible**. There is no recovery mechanism.

**Q: Can I change the encryption algorithm?**  
A: SQLCipher uses AES-256 by default. This cannot be changed.

**Q: Is the encryption FIPS 140-2 compliant?**  
A: SQLCipher itself can be FIPS-compliant when built with appropriate OpenSSL. Check SQLCipher documentation.

## Related Documentation

- [SQLCipher Official Documentation](https://www.zetetic.net/sqlcipher/)
- [Mobile FFI Integration](./mobile/Design_Documentation_II.md)
- [Security Best Practices](./CODING_STANDARDS.md)

## Version History

- **v0.1.7** - Initial encryption support (native only)
- **v0.2.0** - Mobile FFI support (planned)
