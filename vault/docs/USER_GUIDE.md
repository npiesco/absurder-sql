# VaultApp User Guide

## 1. Create Your Vault
1. Open VaultApp.
2. Enter a strong master password.
3. Confirm the password and create the vault.

## 2. Unlock and Lock
1. Use your master password to unlock.
2. From Settings, lock the vault manually at any time.
3. Optional: enable biometric unlock in Settings.

## 3. Add Credentials
1. Tap `+` on the credentials screen.
2. Fill name, username/email, password, and optional notes.
3. Save to add the credential.

## 4. Generate Strong Passwords
1. In add/edit form, open password generator.
2. Choose length and complexity (or passphrase mode).
3. Insert generated password and save.

## 5. Organize Credentials
1. Create folders and nested folders.
2. Add tags and favorites.
3. Use sorting and search to find items quickly.

## 6. TOTP Codes
1. Add a TOTP secret to a credential.
2. Open credential detail to view rotating code and timer.
3. Copy the code when needed.

## 7. Backup and Restore
1. Open Settings and export vault to a backup file.
2. Use import to restore from a backup.
3. Resolve conflicts if local and backup data differ.

## 8. Security Settings
1. Set auto-lock timeout.
2. Configure clipboard auto-clear.
3. Review security audit indicators for weak/old passwords.

## 9. Troubleshooting
- If app cannot load in debug, verify Metro on `8081` and `adb reverse tcp:8081 tcp:8081`.
- If biometric unlock fails, verify device biometric enrollment and re-enable the toggle.
- If import fails, verify backup file integrity and retry.
