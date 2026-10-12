import { test, expect } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runBrowserPhase } from './helpers/browser-runtime.js';

for (const backend of ['IndexedDB', 'Hybrid', 'OPFS']) {
  test(`${backend}: concurrent leadership, heartbeat and shared-handle shutdown preserve state`, async ({ baseURL }) => {
    const profile = await mkdtemp(join(tmpdir(), 'aso-'));
    try {
      const result = await runBrowserPhase(profile, baseURL, {
        runtime: './ownership-runtime.js', backend, phase: 'concurrent',
      });
      const expected = Array.from({ length: 12 }, (_, index) => ({
        values: [{ type: 'Integer', value: index }, { type: 'Text', value: `record-${index}\0exact` }],
      }));
      expect(result.before).toEqual(expected);
      expect(result.after).toEqual(expected);
      expect(result.checks).toEqual(Array.from({ length: 12 }, () => [backend === 'IndexedDB', backend === 'IndexedDB']));
      expect(result.stoppedLeader).toBeNull();
      expect(result.laterLeader).toBeNull();
    } finally {
      await rm(profile, { recursive: true, force: true });
    }
  });
}
