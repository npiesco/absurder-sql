import { test, expect, chromium } from '@playwright/test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

async function open(profile, baseURL) {
  const context = await chromium.launchPersistentContext(profile, { headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
  });
  const page = await context.newPage();
  await page.goto(`${baseURL}/tests/e2e/fixtures/physical-deletion.html`);
  await page.evaluate(packageURL => {
    window.outcomes = {};
    window.startWorker = () => {
      const url = new URL('./durability-worker.js', location.href);
      if (packageURL) url.searchParams.set('package', packageURL);
      window.worker = new Worker(url, { type: 'module' });
      window.worker.onmessage = ({ data }) => { window.outcomes[data.id] = data; };
      window.worker.onerror = event => { window.workerError = event.message; };
    };
    window.startWorker();
    window.send = (id, action, backend) => window.worker.postMessage({ id, action, backend });
  }, process.env.DELETION_PACKAGE_URL);
  return { context, page };
}

async function command(page, id, action, backend) {
  await page.evaluate(args => window.send(...args), [id, action, backend]);
  try {
    await expect.poll(() => page.evaluate(id => window.outcomes[id], id), {
      timeout: 30_000, message: `${backend}/${action} must settle through its real API`,
    }).toBeTruthy();
  } catch (error) {
    throw new Error(`${error.message}; actual worker error: ${await page.evaluate(() => window.workerError)}`, { cause: error });
  }
  return page.evaluate(id => window.outcomes[id], id);
}

async function holdIndexedDB(page) {
  await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('block_storage', 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['blocks', 'metadata'], 'readwrite');
      let hold = true;
      let started = false;
      const keepActive = () => {
        const read = transaction.objectStore('blocks').get('test-lock-no-data');
        read.onsuccess = () => {
          if (!started) { started = true; resolve(); }
          if (hold) keepActive();
        };
      };
      window.releaseIDB = () => { hold = false; };
      transaction.oncomplete = () => db.close();
      transaction.onabort = () => { db.close(); reject(transaction.error); };
      keepActive();
    };
  }));
}

test('Hybrid: failed SQLite open releases ownership for a legitimate delete and recreate', async ({ baseURL }, testInfo) => {
  const profile = await mkdtemp(join(tmpdir(), 'ase-'));
  let context;
  try {
    const file = testInfo.outputPath('corrupt.sqlite');
    const fixture = JSON.parse(execFileSync(process.env.PYTHON || 'python', ['-c',
      "import sqlite3,sys,json,zlib; from pathlib import Path; db=sqlite3.connect(sys.argv[1]); db.execute('CREATE TABLE records(id INTEGER PRIMARY KEY,txt TEXT,payload BLOB)'); db.commit(); db.close(); raw=bytearray(Path(sys.argv[1]).read_bytes()); raw[:16]=b'not a SQLite db!'; Path(sys.argv[1]).write_bytes(raw); print(json.dumps({'bytes':list(raw),'checksums':[str(zlib.crc32(raw[i:i+4096])) for i in range(0,len(raw),4096)]}))", file],
    { encoding: 'utf8', timeout: 30_000 }));
    const running = await open(profile, baseURL);
    context = running.context;
    const { page } = running;
    await page.evaluate(({ bytes, checksums }) => new Promise((resolve, reject) => {
      const request = indexedDB.open('block_storage', 2);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('blocks');
        request.result.createObjectStore('metadata');
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(['blocks', 'metadata'], 'readwrite');
        for (let offset = 0; offset < bytes.length; offset += 4096) {
          const index = offset / 4096;
          const key = `durability.db:${index}`;
          tx.objectStore('blocks').put(new Uint8Array(bytes.slice(offset, offset + 4096)), key);
          tx.objectStore('metadata').put({ checksum: checksums[index], last_modified_ms: 1, version: 1, algo: 'CRC32' }, key);
        }
        tx.objectStore('metadata').put(1, 'durability.db:commit_marker');
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onabort = () => { db.close(); reject(tx.error); };
      };
    }), fixture);
    const failed = await command(page, 1, 'open', 'Hybrid');
    expect(failed.status).toBe('rejected');
    expect(failed.error).toContain('not a database');
    const recreated = await command(page, 2, 'recreate', 'Hybrid');
    expect(recreated.status, recreated.error).toBe('acknowledged');
    expect(recreated.result).toBe('usable-after-open-failure');
  } finally {
    if (context) await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});

test('Hybrid: real blocked upgrade rejects and later open has no leaked reservation', async ({ baseURL }) => {
  const profile = await mkdtemp(join(tmpdir(), 'asb-'));
  let context;
  try {
    const running = await open(profile, baseURL);
    context = running.context;
    const { page } = running;
    await page.evaluate(() => new Promise((resolve, reject) => {
      const request = indexedDB.open('block_storage', 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('blocks');
        request.result.createObjectStore('metadata');
      };
      request.onsuccess = () => { window.blockingConnection = request.result; resolve(); };
      request.onerror = () => reject(request.error);
    }));
    const blocked = await command(page, 1, 'open', 'Hybrid');
    expect(blocked.status).toBe('rejected');
    expect(blocked.error).toContain('blocked');
    await page.evaluate(() => window.blockingConnection.close());
    const opened = await command(page, 2, 'open', 'Hybrid');
    expect(opened.status, opened.error).toBe('acknowledged');
  } finally {
    if (context) await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});

for (const backend of ['Hybrid', 'OPFS']) {
  for (const resume of [false, true]) {
  test(`${backend}: quota refusal rejects and ${resume ? 'explicit same-runtime sync preserves pending bytes' : 'restart preserves last acknowledgement'}`, async ({ baseURL }, testInfo) => {
    const profile = await mkdtemp(join(tmpdir(), 'asq-'));
    let context;
    try {
      const running = await open(profile, baseURL);
      context = running.context;
      const { page } = running;
      const seeded = await command(page, 1, 'seed', backend);
      expect(seeded.status).toBe('acknowledged');
      await page.evaluate(() => window.worker.terminate());
      const session = await context.newCDPSession(page);
      await session.send('Storage.overrideQuotaForOrigin', { origin: baseURL, quotaSize: 65536 });
      const quota = await session.send('Storage.getUsageAndQuota', { origin: baseURL });
      await writeFile(testInfo.outputPath('quota.json'), JSON.stringify(quota));
      expect(quota.overrideActive).toBe(true);
      expect(quota.quota).toBe(65536);
      await page.evaluate(() => window.startWorker());
      expect((await command(page, 10, 'open', backend)).status).toBe('acknowledged');
      const result = await command(page, 2, 'quota', backend);
      const afterQuota = await session.send('Storage.getUsageAndQuota', { origin: baseURL });
      console.log('QUOTA OUTCOME', JSON.stringify({ backend, result, afterQuota }));
      expect(result.status).toBe('rejected');
      expect(result.error).toMatch(/quota|Quota|OPFS|Transaction/);
      if (backend !== 'IndexedDB') {
        expect((await command(page, 20, 'probe-handle', backend)).status).toBe('acknowledged');
      }
      await session.send('Storage.overrideQuotaForOrigin', { origin: baseURL });
      if (resume) {
        const synced = await command(page, 21, 'sync', backend);
        expect(synced.status).toBe('acknowledged');
        expect(synced.result).toBe(result.pendingDigest);
      }
      await page.evaluate(() => window.worker.terminate());
      await context.close();
      context = undefined;
      const reopened = await open(profile, baseURL);
      context = reopened.context;
      const read = await command(reopened.page, 3, 'read-digest', backend);
      expect(read.status).toBe('acknowledged');
      if (resume) {
        expect(read.result.rows[0].slice(0, 3)).toEqual([1, 'quota-refused', 8388608]);
        expect(read.result.digest).toBe(result.pendingDigest);
      } else {
        expect(read.result.rows).toEqual([[1, 'baseline', 3, '0001FF']]);
      }
    } finally {
      if (context) await context.close();
      await rm(profile, { recursive: true, force: true });
    }
  });
  }
}

test('Hybrid: real worker termination after IDB commit before delivery preserves committed data', async ({ baseURL }) => {
  const profile = await mkdtemp(join(tmpdir(), 'asa-'));
  let context;
  try {
    const running = await open(profile, baseURL);
    context = running.context;
    const { page } = running;
    expect((await command(page, 1, 'seed', 'Hybrid')).status).toBe('acknowledged');
    await page.evaluate(() => new Promise(resolve => {
      navigator.locks.request('durability-ack-barrier', async () => {
        resolve();
        await new Promise(release => { window.releaseAck = release; });
      });
    }));
    const commit = await page.evaluate(() => new Promise((resolve, reject) => {
      const request = indexedDB.open('block_storage', 2);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const read = db.transaction('metadata').objectStore('metadata').get('durability.db:commit_marker');
        read.onsuccess = () => { db.close(); resolve(read.result); };
        read.onerror = () => reject(read.error);
      };
    }));
    await page.evaluate(() => window.send(2, 'update-held-ack', 'Hybrid'));
    await expect.poll(() => page.evaluate(() => new Promise((resolve, reject) => {
      const request = indexedDB.open('block_storage', 2);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const read = db.transaction('metadata').objectStore('metadata').get('durability.db:commit_marker');
        read.onsuccess = () => { db.close(); resolve(read.result); };
        read.onerror = () => reject(read.error);
      };
    })), { timeout: 30_000 }).toBeGreaterThan(commit);
    expect(await page.evaluate(() => window.outcomes[2])).toBeUndefined();
    await page.evaluate(() => { window.worker.terminate(); window.releaseAck(); });
    await context.close();
    const reopened = await open(profile, baseURL);
    context = reopened.context;
    const read = await command(reopened.page, 3, 'read', 'Hybrid');
    expect(read.status).toBe('acknowledged');
    expect(read.result.rows).toEqual([[1, 'committed-without-ack', 3, 'AA00FF']]);
  } finally {
    if (context) await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});

test('IndexedDB: incompatible real object-store schema rejects writes rather than falsely acknowledging', async ({ baseURL }) => {
  const profile = await mkdtemp(join(tmpdir(), 'asi-'));
  let context;
  try {
    const running = await open(profile, baseURL);
    context = running.context;
    const { page } = running;
    await page.evaluate(() => new Promise((resolve, reject) => {
      const request = indexedDB.open('block_storage', 2);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('blocks', { keyPath: 'id' });
        request.result.createObjectStore('metadata', { keyPath: 'id' });
      };
      request.onsuccess = () => { request.result.close(); resolve(); };
      request.onerror = () => reject(request.error);
    }));
    const result = await command(page, 1, 'seed', 'IndexedDB');
    expect(result.status).toBe('rejected');
    expect(result.error).toMatch(/DataError|key|schema|store/);
  } finally {
    if (context) await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});

test('IndexedDB: metadata refusal aborts already queued block changes and preserves native SQLite', async ({ baseURL }, testInfo) => {
  const profile = await mkdtemp(join(tmpdir(), 'ast-'));
  let context;
  try {
    const beforeFile = testInfo.outputPath('before.sqlite');
    const checksums = JSON.parse(execFileSync(process.env.PYTHON || 'python', ['-c',
      "import sqlite3,sys,json,zlib; from pathlib import Path; db=sqlite3.connect(sys.argv[1]); db.execute('CREATE TABLE records(id INTEGER PRIMARY KEY,txt TEXT,payload BLOB)'); db.execute(\"INSERT INTO records VALUES(1,'baseline',X'0001FF')\"); db.commit(); db.close(); raw=Path(sys.argv[1]).read_bytes(); print(json.dumps([str(zlib.crc32(raw[i:i+4096])) for i in range(0,len(raw),4096)]))", beforeFile],
    { encoding: 'utf8', timeout: 30_000 }));
    const original = await readFile(beforeFile);
    const running = await open(profile, baseURL);
    context = running.context;
    const { page } = running;
    await page.evaluate(({ bytes, checksums }) => new Promise((resolve, reject) => {
      const request = indexedDB.open('block_storage', 2);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('blocks');
        request.result.createObjectStore('metadata').createIndex('unique_version', 'version', { unique: true });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['blocks', 'metadata'], 'readwrite');
        for (let offset = 0; offset < bytes.length; offset += 4096) {
          const index = offset / 4096;
          const id = `durability.db:${index}`;
          transaction.objectStore('blocks').put(new Uint8Array(bytes.slice(offset, offset + 4096)), id);
          // Valid committed generations differ initially; one new commit must use a shared generation.
          transaction.objectStore('metadata').put({ checksum: checksums[index],
            last_modified_ms: 1, version: index + 1, algo: 'CRC32' }, id);
        }
        transaction.objectStore('metadata').put(checksums.length, 'durability.db:commit_marker');
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onabort = () => { db.close(); reject(transaction.error); };
      };
    }), { bytes: Array.from(original), checksums });
    const opened = await command(page, 1, 'open', 'IndexedDB');
    expect(opened.status, opened.error).toBe('acknowledged');
    const precondition = await command(page, 2, 'inspect', 'IndexedDB');
    expect(precondition.status, precondition.error).toBe('acknowledged');
    expect(precondition.result).toEqual([[1, 'baseline', '0001FF']]);
    const failed = await command(page, 3, 'update', 'IndexedDB');
    expect(failed.status).toBe('rejected');
    expect.soft(failed.error).toContain('ConstraintError');
    const blocks = await page.evaluate(() => new Promise((resolve, reject) => {
      const request = indexedDB.open('block_storage', 2);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction('blocks');
        const store = transaction.objectStore('blocks');
        const keys = store.getAllKeys();
        const values = store.getAll();
        transaction.oncomplete = () => {
          db.close();
          resolve(keys.result.map((key, index) => [Number(key.split(':')[1]), Array.from(values.result[index])]).sort((a, b) => a[0] - b[0]));
        };
        transaction.onabort = () => { db.close(); reject(transaction.error); };
      };
    }));
    const after = Buffer.concat(blocks.map(([, bytes]) => Buffer.from(bytes)));
    expect(after).toEqual(original);
    const afterFile = testInfo.outputPath('after-refusal.sqlite');
    await writeFile(afterFile, after);
    const native = execFileSync(process.env.PYTHON || 'python', ['-c',
      "import sqlite3,sys,json; db=sqlite3.connect(sys.argv[1]); assert db.execute('pragma integrity_check').fetchall()==[('ok',)]; print(json.dumps(db.execute('select id,txt,hex(payload) from records').fetchall()))", afterFile],
    { encoding: 'utf8', timeout: 30_000 });
    expect(JSON.parse(native)).toEqual([[1, 'baseline', '0001FF']]);
  } finally {
    if (context) await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});

for (const backend of ['IndexedDB', 'Hybrid']) {
  test(`${backend}: unavailable authoritative schema rejects reopen instead of creating empty state`, async ({ baseURL }) => {
    const profile = await mkdtemp(join(tmpdir(), 'asv-'));
    let context;
    try {
      const running = await open(profile, baseURL);
      context = running.context;
      const { page } = running;
      const seeded = await command(page, 1, 'seed', backend);
      expect(seeded.status).toBe('acknowledged');
      await page.evaluate(() => window.worker.terminate());
      const readPersistedBlocks = () => page.evaluate(() => new Promise((resolve, reject) => {
        const request = indexedDB.open('block_storage');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('blocks');
          const store = tx.objectStore('blocks');
          const keys = store.getAllKeys();
          const values = store.getAll();
          tx.oncomplete = () => {
            db.close();
            resolve(keys.result.map((key, index) => [key, Array.from(values.result[index])]));
          };
          tx.onabort = () => { db.close(); reject(tx.error); };
        };
      }));
      const persistedBefore = await readPersistedBlocks();
      expect(persistedBefore.length).toBeGreaterThan(0);
      await page.evaluate(() => new Promise((resolve, reject) => {
        const request = indexedDB.open('block_storage', 3);
        request.onsuccess = () => { request.result.close(); resolve(); };
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error('Fixture upgrade unexpectedly blocked'));
      }));
      const results = [];
      if (backend === 'IndexedDB') {
        results.push(...await page.evaluate(async packageURL => {
          const module = await import(packageURL || '../../../pkg/absurder_sql.js');
          await module.default();
          const outcomes = [];
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              await module.Database.newDatabaseWithBackend('durability.db', 'IndexedDB');
              outcomes.push({ status: 'acknowledged' });
            } catch (error) {
              outcomes.push({ status: 'rejected', error: String(error) });
            }
          }
          return outcomes;
        }, process.env.DELETION_PACKAGE_URL));
      } else {
        await page.evaluate(() => window.startWorker());
        for (let attempt = 2; attempt < 5; attempt++) {
          results.push(await command(page, attempt, 'open', backend));
        }
      }
      for (const result of results) {
        expect(result.status).toBe('rejected');
        expect(result.error).toContain('VersionError');
        expect(result.error).toBe(results[0].error);
      }
      // Portable export headers differ from the live WAL file; compare raw persisted bytes.
      expect(await readPersistedBlocks()).toEqual(persistedBefore);
    } finally {
      if (context) await context.close();
      await rm(profile, { recursive: true, force: true });
    }
  });

  test(`${backend}: existing WAL buffer bound rejects atomically and leaves a usable database`, async ({ baseURL }) => {
    const profile = await mkdtemp(join(tmpdir(), 'asw-'));
    let context;
    try {
      const running = await open(profile, baseURL);
      context = running.context;
      const { page } = running;
      expect((await command(page, 1, 'seed', backend)).status).toBe('acknowledged');
      const refused = await command(page, 2, 'wal-limit', backend);
      expect(refused.status).toBe('rejected');
      expect(refused.error).toContain('disk I/O error');
      expect((await command(page, 3, 'usable-after-limit', backend)).status).toBe('acknowledged');
      await page.evaluate(() => window.worker.terminate());
      await context.close();
      const reopened = await open(profile, baseURL);
      context = reopened.context;
      const read = await command(reopened.page, 4, 'read', backend);
      expect(read.status).toBe('acknowledged');
      expect(read.result.rows).toEqual([[1, 'baseline', 3, '0001FF'], [2, 'usable-after-limit', 2, 'ABCD']]);
    } finally {
      if (context) await context.close();
      await rm(profile, { recursive: true, force: true });
    }
  });
}

test('Hybrid: worker termination after physical OPFS write but before IDB commit keeps last acknowledgement', async ({ baseURL }, testInfo) => {
  const profile = await mkdtemp(join(tmpdir(), 'asc-'));
  let context;
  try {
    const running = await open(profile, baseURL);
    context = running.context;
    const { page } = running;
    expect((await command(page, 1, 'seed', 'Hybrid')).status).toBe('acknowledged');
    await holdIndexedDB(page);
    await page.evaluate(() => window.send(2, 'update', 'Hybrid'));
    await expect.poll(async () => page.evaluate(async () => {
      const root = await navigator.storage.getDirectory();
      const handle = await root.getFileHandle('durability.db.absurder.blocks.bin');
      try {
        const bytes = await (await handle.getFile()).arrayBuffer();
        return new TextDecoder().decode(bytes).includes('unacknowledged-new-value');
      } catch (error) {
        // A File snapshot can be invalidated while the real writer is changing it.
        if (error.name === 'NotReadableError') return false;
        throw error;
      }
    }), { timeout: 30_000 }).toBe(true);
    expect(await page.evaluate(() => window.outcomes[2])).toBeUndefined();
    await page.evaluate(() => { window.worker.terminate(); window.releaseIDB(); });
    await context.close();
    context = undefined;
    const reopened = await open(profile, baseURL);
    context = reopened.context;
    const read = await command(reopened.page, 3, 'read', 'Hybrid');
    expect(read.status).toBe('acknowledged');
    expect(read.result.rows).toEqual([[1, 'baseline', 3, '0001FF']]);
    const path = testInfo.outputPath('recovered.sqlite');
    await writeFile(path, Buffer.from(read.result.bytes));
    const native = execFileSync(process.env.PYTHON || 'python', ['-c',
      "import sqlite3,sys,json; db=sqlite3.connect(sys.argv[1]); assert db.execute('pragma integrity_check').fetchall()==[('ok',)]; print(json.dumps(db.execute('select id,txt,hex(payload) from records').fetchall()))", path],
    { encoding: 'utf8', timeout: 30_000 });
    expect(JSON.parse(native)).toEqual([[1, 'baseline', '0001FF']]);
  } finally {
    if (context) await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});
