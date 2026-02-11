# VaultApp Security Model

## Core Principles
- Local-first data storage.
- Encryption at rest for vault contents.
- Explicit user control for export/import.

## Threat Model (High Level)
- Protect stored credentials against casual device compromise.
- Reduce exposure from shoulder-surfing and copied secrets.
- Preserve confidentiality during normal offline operation.

## Controls
- Master password gate for vault unlock.
- Optional biometric unlock convenience path.
- Auto-lock when backgrounded/after timeout.
- Clipboard auto-clear for copied secrets.
- Security audit indicators (weak/old password visibility).

## Data Flow
- Credentials are stored in local encrypted database.
- Export/import is user-initiated and file-based.
- TOTP secrets are stored as part of encrypted credential data.

## Assumptions and Limits
- If device OS is fully compromised, app-level guarantees are reduced.
- Master password loss means vault recovery is not possible by design.
- Production release should use dedicated signing keys and hardened build pipeline.

## Operational Recommendations
- Use a long unique master password.
- Enable biometric unlock only on trusted devices.
- Keep regular encrypted backups.
- Rotate weak or old passwords identified by audit views.
