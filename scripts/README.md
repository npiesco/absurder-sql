# Integration Test Scripts

You need to know whether a browser-created database survives export, native
SQLite reads, and reopening—not just whether it downloads.

**The qualification scripts exercise the real storage boundaries.**

From the repository root, with browser-test dependencies installed:

```bash
npm run test:deletion -- --retries=0 &&
npm run test:stabilization -- --retries=0
```

The [current qualification](../docs/NATIVE_QUALIFICATION.md) records 13 deletion
and 35 stabilization cases for each default and telemetry package on the
original Apple runtime and isolated Windows x64. It also records the full
native, WASM, telemetry, browser, PWA, lint, release, and rebuild gates and
retains the failed attempts. These commands alone do not repeat that matrix.

## CI and Package Handling

- `ci/fetch_source.py` materializes a verified exact-SHA archive without a Git
  checkout; the installed runner guard enforces owner admission.
- `ci/bootstrap_tools.sh`, `ci/prepare_browser.py`, and `ci/qualify.sh` support
  heavy qualification on the existing trusted self-hosted Linux X64 runner.
- `sync_pwa_package.js` copies the local package's runtime and active snippets
  into the PWA. It does not download a newer npm release.
- Tag-triggered release qualification precedes publication. The hosted job is
  limited to hash-verified npm archive publication through OIDC and release
  metadata; it does not rebuild the runtime.

See [self-hosted CI](../docs/SELF_HOSTED_CI.md) for admission and runner setup.
The candidate package metadata remains `0.1.28`; qualification is not a new
version or a publication receipt.

## WASM → Native Interoperability Test

**Script:** `test_wasm_to_native_interop.py`

This older standalone demonstration is separate from the current qualification
gates. It creates a temporary Cargo project and invokes the external `sqlite3`
CLI. Its final browser assertions check the row count, not every returned value.

### Purpose

This script demonstrates a browser/native round trip by:

1. **Creating a database in the browser** using WASM/IndexedDB
2. **Exporting to a SQLite .db file** 
3. **Querying and adding rows with native Rust code** (rusqlite)
4. **Importing the modified file back into WASM** and checking six returned rows

This validates that:
- **[✓]** WASM can create valid, spec-compliant SQLite files
- **[✓]** Native tools can read WASM-created databases
- The native read checks four rows and the `Alice O'Brien` text value
- The final browser read checks six rows after native writes

### Prerequisites

1. **Python 3.8+** with pip
2. **Rust and Cargo** installed
3. **Node.js and npm** for running the Vite dev server
4. **Playwright browsers** installed
5. **`sqlite3` CLI** on PATH, the Vite app dependencies installed, and a built `pkg`

### Setup

```bash
# Install Python dependencies
cd scripts
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Make script executable (optional)
chmod +x test_wasm_to_native_interop.py
```

### Usage

```bash
# From the root of the repository
# Make sure Vite dev server is NOT running (script expects port 3000 to be free)

# Run the test
python scripts/test_wasm_to_native_interop.py
```

There is no `test:interop` npm script; use the Python command directly.

### What It Does

1. **Starts Playwright** and launches Chromium
2. **Navigates to the Vite app** at `http://localhost:3000`
3. **Waits for WASM initialization** and Database class availability
4. **Creates a test database** with 4 users (various data types and special characters)
5. **Exports the database** to bytes using `exportToFile()`
6. **Saves the .db file** to `test-output/wasm_exported.db`
7. **Creates a temporary Rust project** with rusqlite dependency
8. **Compiles and runs Rust code** that:
   - Opens the exported .db file
   - Queries all rows
   - Verifies data integrity
   - Checks special character preservation
9. **Writes two more rows natively**, runs the `sqlite3` integrity check,
   imports into WASM, and checks the resulting row count
10. **Reports success/failure**

### Historical Output Excerpt

This earlier excerpt covers the export/read phase only; it is not a current
qualification result or the complete round-trip output.

```
======================================================================
WASM → Native Interoperability Test
======================================================================

[BROWSER] Starting Playwright browser automation...
[NAV] Navigating to http://localhost:3000...
[WAIT] Waiting for WASM to initialize...
[DB] Creating test database with sample data...
[OK] Exported 12288 bytes from browser
[SAVE] Saved database to: test-output/wasm_exported.db

[Rust] Running Rust verification with rusqlite...
[BUILD] Compiling Rust verification code...
[OK] Successfully opened WASM-created database with rusqlite
  Row 1: Alice O'Brien | alice@example.com | 30 | 1234.56
  Row 2: Bob "The Builder" | bob@example.com | 25 | 9876.54
  Row 3: Charlie 你好 | charlie@example.com | 35 | 5555.55
  Row 4: Diana [emoji] | diana@example.com | 28 | 7777.77
[OK] Successfully queried 4 rows from WASM-created database
[OK] Special characters preserved correctly

======================================================================
[SUCCESS] WASM -> Native interoperability verified!
======================================================================

Exported database saved at: /path/to/test-output/wasm_exported.db
You can inspect it with: sqlite3 test-output/wasm_exported.db
```

### Inspecting the Output

After a successful run, you can manually inspect the exported database:

```bash
# Open with sqlite3 CLI
sqlite3 test-output/wasm_exported.db

# Run queries
sqlite> .tables
sqlite> SELECT * FROM users;
sqlite> .schema users
sqlite> .quit
```

Or with any SQLite browser/tool.

### Troubleshooting

**Port 3000 already in use:**
- Make sure the Vite dev server is not already running
- Or modify the script to use a different port

**Playwright browsers not installed:**
```bash
playwright install chromium
```

**Rust/Cargo not found:**
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**Script fails at export:**
- Check that WASM build is up to date: `wasm-pack build --target web --out-dir pkg`
- Ensure the vite app is properly configured

### Current Interoperability Gate

The stabilization suite uses real browser storage and native SQLite read-only
opens, including embedded-NUL TEXT/BLOB fidelity and portable exports. Export
must complete a real checkpoint; only the returned snapshot's file-format
bytes 18/19 change, while the live database stays WAL. Use the qualified
suite and its evidence above rather than treating this demonstration's
printed success message as equivalent coverage.
