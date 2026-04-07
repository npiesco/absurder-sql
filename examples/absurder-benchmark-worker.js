import init, { Database } from '../pkg/absurder_sql.js';

let initPromise = null;

async function ensureInit() {
  if (!initPromise) {
    initPromise = init();
  }
  await initPromise;
}

function buildInsertValues(numRows, testData) {
  const values = [];
  for (let index = 0; index < numRows; index += 1) {
    values.push(`(${index + 1}, '${testData}')`);
  }
  return values.join(', ');
}

async function runBenchmark(dbName, backendName, numRows, rowSize) {
  const db = await Database.newDatabaseWithBackend(dbName, backendName);
  db.allowNonLeaderWrites(true);

  await db.execute('PRAGMA journal_mode=MEMORY');
  await db.execute('PRAGMA page_size=8192');
  await db.execute('CREATE TABLE IF NOT EXISTS benchmark (id INTEGER PRIMARY KEY, data TEXT)');

  const testData = 'x'.repeat(rowSize);
  const allValues = buildInsertValues(numRows, testData);

  const insertStart = performance.now();
  await db.execute(`INSERT INTO benchmark VALUES ${allValues}`);
  await db.sync();
  const insertTime = performance.now() - insertStart;

  const readStart = performance.now();
  await db.execute('SELECT * FROM benchmark');
  const readTime = performance.now() - readStart;

  const updateStart = performance.now();
  await db.execute(`UPDATE benchmark SET data = '${testData}updated' WHERE id <= ${Math.floor(numRows / 2)}`);
  await db.sync();
  const updateTime = performance.now() - updateStart;

  const deleteStart = performance.now();
  await db.execute(`DELETE FROM benchmark WHERE id <= ${Math.floor(numRows / 4)}`);
  await db.sync();
  const deleteTime = performance.now() - deleteStart;

  await db.execute('DROP TABLE benchmark');
  await db.sync();

  const selectedBackend = db.getStorageBackend();
  await db.close();

  return {
    selectedBackend,
    metrics: {
      insert: insertTime,
      read: readTime,
      update: updateTime,
      delete: deleteTime,
    },
  };
}

self.onmessage = async (event) => {
  const { id, type, dbName, backendName, numRows, rowSize } = event.data;

  if (type !== 'runBenchmark') {
    self.postMessage({
      id,
      success: false,
      error: `Unknown message type: ${type}`,
    });
    return;
  }

  try {
    await ensureInit();
    const result = await runBenchmark(dbName, backendName, numRows, rowSize);
    self.postMessage({
      id,
      success: true,
      ...result,
    });
  } catch (error) {
    self.postMessage({
      id,
      success: false,
      error: error?.message ?? String(error),
      stack: error?.stack ?? null,
    });
  }
};