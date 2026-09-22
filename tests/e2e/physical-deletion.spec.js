import { test, expect } from '@playwright/test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runBrowserPhase as phase } from './helpers/browser-runtime.js';

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
