const { default: init, Database } = await import(
  new URL(import.meta.url).searchParams.get('package') || '../../../pkg/absurder_sql.js'
);

const ready = init();

async function open(name, backend) {
  const db = await Database.newDatabaseWithBackend(name, backend);
  await db.allowNonLeaderWrites(true);
  return db;
}

async function snapshot(name, backend) {
  const db = await open(name, backend);
  try {
    const schema = await db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    const tables = schema.rows.map(row => row.values[0].value);
    const query = tables.includes('records')
      ? await db.execute('SELECT id, value, hex(payload) FROM records ORDER BY id')
      : { rows: [] };
    return {
      backend: db.getStorageBackend(),
      tables,
      rows: query.rows.map(row => row.values.map(value => value.value)),
      bytes: Array.from(await db.exportToFile()),
    };
  } finally {
    await db.close();
  }
}

async function storedKeys() {
  return await new Promise((resolve, reject) => {
    const request = indexedDB.open('block_storage', 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['blocks', 'metadata'], 'readonly');
      const blocks = transaction.objectStore('blocks').getAllKeys();
      const metadata = transaction.objectStore('metadata').getAllKeys();
      transaction.oncomplete = () => {
        db.close();
        resolve({ blocks: blocks.result, metadata: metadata.result });
      };
      transaction.onabort = () => {
        db.close();
        reject(transaction.error || new Error('Storage inspection aborted'));
      };
    };
  });
}

async function storedFiles() {
  const root = await navigator.storage.getDirectory();
  const files = [];
  for await (const [name] of root.entries()) files.push(name);
  return files.sort();
}

export async function runPhase({ phase, target, neighbors, backend }) {
  await ready;
  const names = [target, ...neighbors];
  if (phase.startsWith('idb-')) {
    const version = phase === 'idb-blocked' ? 1 : phase === 'idb-version' ? 3 : 2;
    const connection = await new Promise((resolve, reject) => {
      const request = indexedDB.open('block_storage', version);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('blocks');
        if (phase !== 'idb-schema') request.result.createObjectStore('metadata');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    let error = null;
    try {
      await Database.deleteDatabase(target);
    } catch (failure) {
      error = String(failure);
    } finally {
      connection.close();
    }
    if (phase === 'idb-blocked' && error !== null) {
      // The blocked request must abort its late upgrade and release its connection.
      await Database.deleteDatabase(target);
    }
    return { error };
  }
  if (phase === 'seed') {
    const snapshots = [];
    for (const [index, name] of names.entries()) {
      const db = await open(name, backend);
      try {
        await db.execute('CREATE TABLE records (id INTEGER PRIMARY KEY, value TEXT NOT NULL, payload BLOB NOT NULL)');
        await db.execute(`INSERT INTO records VALUES (1, 'original-${index}', X'000102FF'), (7, '${'retained-'.repeat(800)}${index}', X'FEFF00')`);
        await db.sync();
      } finally {
        await db.close();
      }
      snapshots.push(await snapshot(name, backend));
    }
    return { snapshots, keys: await storedKeys(), files: await storedFiles() };
  }
  if (phase === 'delete') {
    const before = [];
    for (const name of names) before.push(await snapshot(name, backend));
    await Database.deleteDatabase(target);
    const keys = await storedKeys();
    const files = await storedFiles();
    // Exercise clearing local allocation/cache state before terminating this runtime too.
    const after = await snapshot(target, backend);
    await Database.deleteDatabase(target);
    await Database.deleteDatabase(target);
    return { before, after, keys, files };
  }
  if (phase === 'live-neighbor') {
    const targetDb = await open(target, backend);
    const neighbor = await open(neighbors[0], backend);
    try {
      await targetDb.execute('SELECT * FROM records');
      await neighbor.execute('SELECT * FROM records');
      await neighbor.execute('BEGIN IMMEDIATE');
      await neighbor.execute("INSERT INTO records VALUES (11, 'written-after-neighbor-delete', X'ABCD')");
      await targetDb.close();
      targetDb.free();
      await Database.deleteDatabase(target);
      await neighbor.execute('COMMIT');
      await neighbor.sync();
      const result = await neighbor.execute('SELECT id, value, hex(payload) FROM records ORDER BY id');
      return { rows: result.rows.map(row => row.values.map(value => value.value)) };
    } finally {
      await neighbor.close();
    }
  }
  if (phase === 'retained-handle') {
    const original = await open(target, backend);
    await original.close();
    await Database.deleteDatabase(target);
    const replacement = await open(target, backend);
    try {
      await replacement.execute('CREATE TABLE replacement (value TEXT)');
      original.free();
      await replacement.execute("INSERT INTO replacement VALUES ('new-generation')");
      await replacement.sync();
      const query = await replacement.execute('SELECT value FROM replacement');
      return { rows: query.rows.map(row => row.values.map(value => value.value)) };
    } finally {
      await replacement.close();
    }
  }
  if (phase === 'read') {
    const snapshots = [];
    const keys = await storedKeys();
    const files = await storedFiles();
    for (const name of names) snapshots.push(await snapshot(name, backend));
    return { snapshots, keys, files };
  }
  if (phase === 'locked-opfs') {
    const before = await snapshot(target, backend);
    const root = await navigator.storage.getDirectory();
    const file = await root.getFileHandle(`${target}.absurder.blocks.bin`);
    const handle = await file.createSyncAccessHandle();
    let error = null;
    try {
      await Database.deleteDatabase(target);
    } catch (failure) {
      error = String(failure);
    } finally {
      handle.close();
    }
    return { error, before, after: await snapshot(target, backend) };
  }
  throw new Error(`Unknown deletion test phase: ${phase}`);
}
