# Vite + DataSync Example

Minimal example showing how to integrate DataSync with Vite.

## Setup

```bash
cd examples/vite-app
npm install
npm run dev
```

Open `http://localhost:3000`

## How it works

1. **Imports DataSync**: `import init, { Database } from '../../pkg/sqlite_indexeddb_rs.js'`
2. **Initializes WASM**: `await init()`
3. **Opens database**: `const db = await Database.newDatabase('myapp')`
4. **Runs SQL**: `await db.execute('SELECT...')`
5. **Persists changes**: `await db.sync()` after any writes

That's it. Data automatically persists to IndexedDB.

## Key differences from plain HTML

- Vite handles module resolution automatically
- No need for manual HTTP server
- Hot module reloading during development
- Can use npm packages directly

## Production build

```bash
npm run build
npm run preview
```

The build output in `dist/` is ready to deploy to any static host.
