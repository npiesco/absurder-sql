let db;
let pendingDigest;
const ready = import(new URL(import.meta.url).searchParams.get('package') || '../../../pkg/absurder_sql.js')
  .then(async module => { await module.default(); return module.Database; });
async function digestPayload() {
  const query = await db.execute('SELECT payload FROM records WHERE id=1');
  const bytes = new Uint8Array(query.rows[0].values[0].value);
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
}
self.onmessage = async ({ data: { id, action, backend } }) => {
  try {
    const Database = await ready;
    let result;
    if (action === 'seed') {
      db = await Database.newDatabaseWithBackend('durability.db', backend);
      await db.allowNonLeaderWrites(true);
      await db.execute('CREATE TABLE records (id INTEGER PRIMARY KEY, txt TEXT, payload BLOB)');
      await db.execute("INSERT INTO records VALUES(1,'baseline',X'0001FF')");
      await db.sync();
      result = Array.from(await db.exportToFile());
    } else if (action === 'open') {
      db = await Database.newDatabaseWithBackend('durability.db', backend);
      await db.allowNonLeaderWrites(true);
    } else if (action === 'inspect') {
      const query = await db.execute('SELECT id,txt,hex(payload) FROM records ORDER BY id');
      result = query.rows.map(row => row.values.map(cell => cell.value));
    } else if (action === 'recreate') {
      await Database.deleteDatabase('durability.db');
      db = await Database.newDatabaseWithBackend('durability.db', backend);
      await db.allowNonLeaderWrites(true);
      await db.execute('CREATE TABLE fresh(value TEXT)');
      await db.execute("INSERT INTO fresh VALUES('usable-after-open-failure')");
      await db.sync();
      result = (await db.execute('SELECT value FROM fresh')).rows[0].values[0].value;
    } else if (action === 'update') {
      await db.execute("UPDATE records SET txt='unacknowledged-new-value', payload=zeroblob(131072)");
      await db.sync();
    } else if (action === 'quota') {
      await db.execute("UPDATE records SET txt='quota-refused', payload=randomblob(8388608)");
      pendingDigest = await digestPayload();
      await db.sync();
    } else if (action === 'sync') {
      await db.sync();
      result = await digestPayload();
    } else if (action === 'wal-limit') {
      await db.execute("UPDATE records SET txt='must-rollback', payload=randomblob(16777216)");
    } else if (action === 'usable-after-limit') {
      await db.execute("INSERT INTO records VALUES(2,'usable-after-limit',X'ABCD')");
      await db.sync();
    } else if (action === 'update-held-ack') {
      await db.execute("UPDATE records SET txt='committed-without-ack', payload=X'AA00FF'");
      await db.sync();
      await navigator.locks.request('durability-ack-barrier', () => {});
    } else if (action === 'read' || action === 'read-digest') {
      db = await Database.newDatabaseWithBackend('durability.db', backend);
      const query = await db.execute('SELECT id,txt,length(payload),hex(substr(payload,1,3)) FROM records');
      result = {
        rows: query.rows.map(row => row.values.map(cell => cell.value)),
        ...(action === 'read' ? { bytes: Array.from(await db.exportToFile()) } : {}),
        digest: await digestPayload(),
      };
    } else if (action === 'invalid-import') {
      await db.importFromFile(new Uint8Array(4096));
    } else if (action === 'probe-handle') {
      const root = await navigator.storage.getDirectory();
      const file = await root.getFileHandle('durability.db.absurder.blocks.bin');
      const handle = await file.createSyncAccessHandle();
      result = handle.getSize();
      handle.close();
    } else if (action === 'close') {
      await db.close();
      db.free();
    } else {
      throw new Error(`Unknown durability action ${action}`);
    }
    self.postMessage({ id, result, status: 'acknowledged' });
  } catch (error) {
    self.postMessage({ id, error: String(error), pendingDigest, status: 'rejected' });
  }
};
