# Mobile Demo (25 Credentials) — Layman Runbook

This creates a ready-to-demo vault with 25 credentials and then runs a set of search queries.
It is fully offline and runs on the Android emulator.

## One-Command Demo (Recommended)

From the repo root:

```bash
cd vault/mobile
npm run detox:test:android -- e2e/credentialsSearchShowcase.test.ts
```

What this does:
- launches the app
- creates a new vault using password `VaultDemoPass123!`
- creates 25 credentials with deterministic names
- runs 10 search queries and verifies expected results

## If You Want to Watch It Live

Make sure an Android emulator is running, then run the same command above.
You can watch the UI as credentials are created and searched.

## After It Finishes

Open the app and use:
- Vault name: `vault.db`
- Password: `VaultDemoPass123!`

Try these demo queries in the search field:
- `canine guardian`
- `plane keeper`
- `sea keeper`
- `doctor guide`

## Troubleshooting (Quick)

- If Metro isn't running, start it:
  ```bash
  cd vault/mobile
  npx react-native start --port 8081 --reset-cache
  ```
- If the app won't launch, reinstall:
  ```bash
  cd vault/mobile/android
  ./gradlew installDebug
  ```
