const { default: init, Database } = await import(
  new URL(import.meta.url).searchParams.get('package') || '../../../pkg/absurder_sql.js'
);
const ready = init();
async function sha(bytes) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function runPhase({ backend, phase, inputURL }) {
  const wasm = await ready;
  const samples = [];
  const sample = stage => samples.push({ stage, wasmLinearBytes: wasm.memory.buffer.byteLength });
  sample('initialized');
  const db = await Database.newDatabaseWithBackend('resources.db', backend);
  await db.allowNonLeaderWrites(true);
  sample('opened');
  const times = {};
  try {
    if (phase === 'import') {
      const bytes = new Uint8Array(await (await fetch(inputURL)).arrayBuffer());
      sample('input-loaded');
      const started = performance.now();
      await db.importFromFile(bytes);
      times.importMs = performance.now() - started;
      sample('imported');
      // Match the normal browser reopen mode before comparing whole-file hashes.
      // Native SQLite fixtures begin in DELETE mode; WAL conversion changes header bytes.
      await db.execute('PRAGMA journal_mode=WAL');
    }
    const query = await db.execute('SELECT payload FROM resource_data WHERE id=1');
    const payload = new Uint8Array(query.rows[0].values[0].value);
    const payloadSha256 = await sha(payload);
    sample('queried');
    const started = performance.now();
    const exported = await db.exportToFile();
    times.exportMs = performance.now() - started;
    sample('exported');
    const exportSha256 = await sha(exported);
    const root = await navigator.storage.getDirectory();
    const file = await root.getFileHandle('resource-readback.sqlite', { create: true });
    const stream = await file.createWritable();
    await stream.write(exported);
    await stream.close();
    await db.close();
    db.free();
    sample('closed');
    return { samples, times, payloadBytes: payload.length, payloadSha256,
      exportBytes: exported.length, exportSha256, exportFile: 'resource-readback.sqlite' };
  } catch (error) {
    await db.close();
    db.free();
    throw error;
  }
}
