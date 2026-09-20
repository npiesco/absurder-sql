import { test, expect, chromium } from '@playwright/test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function phase(profile, baseURL, options) {
  const logs = [];
  const context = await chromium.launchPersistentContext(profile, {
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
  });
  try {
    const page = await context.newPage();
    page.on('console', message => {
      logs.push(message.text());
      if (logs.length > 60) logs.shift();
    });
    await page.goto(`${baseURL}/tests/e2e/fixtures/physical-deletion.html`);
    return await page.evaluate(async options => {
      const moduleURL = new URL('./physical-deletion-runtime.js', location.href);
      if (options.packageURL) moduleURL.searchParams.set('package', options.packageURL);
      const url = moduleURL.href;
      if (options.backend === 'IndexedDB') {
        const { runPhase } = await import(url);
        return await runPhase(options);
      }
      const source = `const runtime = import(${JSON.stringify(url)});
        self.addEventListener('error', event => {
          self.postMessage({ error: String(event.error || event.message), stack: event.error?.stack });
        });
        self.onmessage = async event => {
          try { self.postMessage({ result: await (await runtime).runPhase(event.data) }); }
          catch (error) { self.postMessage({ error: String(error), stack: error.stack }); }
        };`;
      const workerURL = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
      const worker = new Worker(workerURL, { type: 'module' });
      try {
        return await new Promise((resolve, reject) => {
          worker.onmessage = event => event.data.error
            ? reject(new Error(`${event.data.error}\n${event.data.stack || ''}`))
            : resolve(event.data.result);
          worker.onerror = event => reject(new Error(event.message));
          worker.postMessage(options);
        });
      } finally {
        worker.terminate();
        URL.revokeObjectURL(workerURL);
      }
    }, { ...options, packageURL: process.env.DELETION_PACKAGE_URL });
  } catch (error) {
    throw new Error(`${options.backend}/${options.phase}: ${error.stack}\nBrowser log:\n${logs.join('\n')}`, { cause: error });
  } finally {
    // Closing a persistent context exits its browser process; the next phase has no WASM/RAM state.
    await context.close();
  }
}

function expectErased(result, target) {
  expect(result.keys.blocks.filter(key => key.startsWith(`${target}:`))).toEqual([]);
  expect(result.keys.metadata.filter(key => key.startsWith(`${target}:`) || key === `${target}_commit_marker`)).toEqual([]);
  expect(result.files).not.toContain(`${target}.absurder.blocks.bin`);
}

for (const backend of ['IndexedDB', 'Hybrid', 'OPFS']) {
  test(`${backend}: physical deletion survives browser termination without erasing prefix neighbors`, async ({ baseURL }, testInfo) => {
    const profile = await mkdtemp(join(tmpdir(), 'asd-'));
    const target = 'physical-delete.db';
    const neighbors = ['physical-delete.db-neighbor.db', 'physical-delete-neighbor.db'];
    const options = { target, neighbors, backend };
    try {
      const seed = await phase(profile, baseURL, { ...options, phase: 'seed' });
      for (const [index, snapshot] of seed.snapshots.entries()) {
        expect(snapshot.backend).toBe(backend);
        expect(snapshot.tables).toEqual(['records']);
        expect(snapshot.rows).toEqual([
          [1, `original-${index}`, '000102FF'],
          [7, `${'retained-'.repeat(800)}${index}`, 'FEFF00'],
        ]);
        expect(Buffer.from(snapshot.bytes).subarray(0, 16).toString()).toBe('SQLite format 3\0');
      }
      expect(seed.keys.blocks.some(key => key.startsWith(`${target}:`))).toBe(true);
      if (backend !== 'IndexedDB') expect(seed.files).toContain(`${target}.absurder.blocks.bin`);

      const deleted = await phase(profile, baseURL, { ...options, phase: 'delete' });
      const restarted = await phase(profile, baseURL, { ...options, phase: 'read' });
      const evidence = testInfo.outputPath('physical-delete-readback.json');
      await writeFile(evidence, JSON.stringify({ seed, deleted, restarted }));
      await testInfo.attach('physical-delete-readback', { path: evidence, contentType: 'application/json' });
      expect(deleted.before).toEqual(seed.snapshots);
      expect(deleted.after.tables).toEqual([]);
      expect(deleted.after.rows).toEqual([]);
      expect(restarted.snapshots[0].tables).toEqual([]);
      expect(restarted.snapshots[0].rows).toEqual([]);
      expect(restarted.snapshots.slice(1)).toEqual(seed.snapshots.slice(1));
      expectErased(deleted, target);
      expectErased(restarted, target);
    } finally {
      await rm(profile, { recursive: true, force: true });
    }
  });
  test(`${backend}: live prefix neighbor survives target close and deletion`, async ({ baseURL }) => {
    const profile = await mkdtemp(join(tmpdir(), 'asd-'));
    const options = { target: 'live-delete.db', neighbors: ['live-delete.db-neighbor.db'], backend };
    try {
      const seed = await phase(profile, baseURL, { ...options, phase: 'seed' });
      const expectedRows = [...seed.snapshots[1].rows, [11, 'written-after-neighbor-delete', 'ABCD']];
      const deleted = await phase(profile, baseURL, { ...options, phase: 'live-neighbor' });
      expect(deleted.rows).toEqual(expectedRows);
      const restarted = await phase(profile, baseURL, { ...options, phase: 'read' });
      expect(restarted.snapshots[0].tables).toEqual([]);
      expect(restarted.snapshots[1].rows).toEqual(expectedRows);
    } finally {
      await rm(profile, { recursive: true, force: true });
    }
  });
  test(`${backend}: releasing a deleted handle cannot close its replacement`, async ({ baseURL }) => {
    const profile = await mkdtemp(join(tmpdir(), 'asd-'));
    try {
      const result = await phase(profile, baseURL, {
        phase: 'retained-handle', target: 'generation-delete.db', neighbors: [], backend,
      });
      expect(result.rows).toEqual([['new-generation']]);
    } finally {
      await rm(profile, { recursive: true, force: true });
    }
  });
}

test('Hybrid: a real locked OPFS file rejects deletion without reporting success', async ({ baseURL }) => {
  const profile = await mkdtemp(join(tmpdir(), 'asd-'));
  const options = { target: 'locked-delete.db', neighbors: [], backend: 'Hybrid' };
  try {
    await phase(profile, baseURL, { ...options, phase: 'seed' });
    const locked = await phase(profile, baseURL, { ...options, phase: 'locked-opfs' });
    expect(locked.error).toMatch(/OPFS_DELETE_ERROR|OPFS_LOCK_ERROR/);
    expect(locked.after).toEqual(locked.before);
    const restarted = await phase(profile, baseURL, { ...options, phase: 'read' });
    expect(restarted.snapshots[0]).toEqual(locked.before);
    const deleted = await phase(profile, baseURL, { ...options, phase: 'delete' });
    expect(deleted.after.tables).toEqual([]);
    expectErased(deleted, options.target);
  } finally {
    await rm(profile, { recursive: true, force: true });
  }
});

for (const fault of ['blocked', 'version', 'schema']) {
  test(`IndexedDB: real ${fault} failure rejects deletion`, async ({ baseURL }) => {
    const profile = await mkdtemp(join(tmpdir(), 'asd-'));
    try {
      const result = await phase(profile, baseURL, {
        phase: `idb-${fault}`, target: 'failed-delete.db', neighbors: [], backend: 'IndexedDB',
      });
      expect(result.error).toContain('INDEXEDDB_ERROR');
      expect(result.error).toContain(
        fault === 'blocked' ? 'blocked' : fault === 'version' ? 'VersionError' : 'NotFoundError',
      );
    } finally {
      await rm(profile, { recursive: true, force: true });
    }
  });
}
