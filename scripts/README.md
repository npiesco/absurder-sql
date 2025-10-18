# Integration Test Scripts

## WASM → Native Interoperability Test

**Script:** `test_wasm_to_native_interop.py`

### Purpose

This script proves complete bidirectional compatibility between WASM and native code by:

1. **Creating a database in the browser** using WASM/IndexedDB
2. **Exporting to a SQLite .db file** 
3. **Querying the file with native Rust code** (rusqlite)

This validates that:
- **[✓]** WASM can create valid, spec-compliant SQLite files
- **[✓]** Native tools can read WASM-created databases
- **[✓]** Data integrity is maintained (special characters, types, etc.)
- **[✓]** Full round-trip compatibility works

### Prerequisites

1. **Python 3.8+** with pip
2. **Rust and Cargo** installed
3. **Node.js and npm** for running the Vite dev server
4. **Playwright browsers** installed

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

Or use the npm script (if added to package.json):

```bash
npm run test:interop
```

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
9. **Reports success/failure**

### Expected Output

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

### Integration with CI/CD

This script can be added to GitHub Actions or other CI/CD pipelines to continuously verify WASM-native compatibility:

```yaml
- name: Test WASM to Native Interop
  run: |
    python scripts/test_wasm_to_native_interop.py
```
