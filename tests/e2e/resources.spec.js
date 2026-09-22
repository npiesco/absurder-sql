import { test, expect } from '@playwright/test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { runBrowserPhase } from './helpers/browser-runtime.js';

const sizes = (process.env.RESOURCE_SIZES_MIB || '1,8,32').split(',').map(Number);
const native = `
import sqlite3,sys,hashlib,json,os
from pathlib import Path
path,mode=sys.argv[1:3]
if mode=='create':
 with sqlite3.connect(path) as db:
  db.execute('CREATE TABLE resource_data(id INTEGER PRIMARY KEY, payload BLOB NOT NULL)')
  db.execute('INSERT INTO resource_data VALUES(1,?)',(os.urandom(int(sys.argv[3])),))
with sqlite3.connect(Path(path).resolve().as_uri()+'?mode=ro',uri=True) as db:
 assert db.execute('PRAGMA integrity_check').fetchall()==[('ok',)]
 rows=db.execute('SELECT id,payload FROM resource_data').fetchall()
 assert len(rows)==1 and rows[0][0]==1
 payload=rows[0][1]
 print(json.dumps({'bytes':len(payload),'sha256':hashlib.sha256(payload).hexdigest()}))
`;
const readNative = (path, ...args) => JSON.parse(execFileSync(process.env.PYTHON || 'python',
  ['-c', native, path, ...args], { encoding: 'utf8', timeout: 30_000 }));

for (const backend of ['IndexedDB', 'Hybrid']) {
  for (const mib of sizes) {
    test(`${backend}: characterize ${mib}MiB exact import/export and retained linear memory`, async ({ baseURL }, testInfo) => {
      expect(Number.isSafeInteger(mib) && mib > 0).toBe(true);
      const profile = await mkdtemp(join(tmpdir(), 'asm-'));
      const fixtureRoot = resolve('.local', 'resource-fixtures');
      await mkdir(fixtureRoot, { recursive: true });
      const fixtureDir = await mkdtemp(join(fixtureRoot, 'case-'));
      // Fixtures live under the served repository, never under an authenticated browser profile.
      const fixtureName = fixtureDir.split(/[\\/]/).pop();
      const file = join(fixtureDir, 'input.sqlite');
      try {
        const expected = readNative(file, 'create', String(mib * 1024 * 1024));
        const options = { runtime: './resources-runtime.js', backend,
          inputURL: `${baseURL}/.local/resource-fixtures/${fixtureName}/input.sqlite` };
        const importedPath = testInfo.outputPath('imported.sqlite');
        const imported = await runBrowserPhase(profile, baseURL, {
          ...options, phase: 'import', captureExportPath: importedPath,
        });
        const reopenedPath = testInfo.outputPath('reopened.sqlite');
        const reopened = await runBrowserPhase(profile, baseURL, {
          ...options, phase: 'reopen', captureExportPath: reopenedPath,
        });
        for (const [result, path] of [[imported, importedPath], [reopened, reopenedPath]]) {
          expect(result.payloadBytes).toBe(expected.bytes);
          expect(result.payloadSha256).toBe(expected.sha256);
          expect(readNative(path, 'read')).toEqual(expected);
          expect(result.samples.every(sample => Number.isSafeInteger(sample.wasmLinearBytes) && sample.wasmLinearBytes > 0)).toBe(true);
        }
        const evidence = { backend, payloadMiB: mib, expected, imported, reopened,
          measurement: 'WASM linear-memory allocation at stage boundaries, not JS heap/RSS/native process peak or a supported-size ceiling' };
        await writeFile(testInfo.outputPath('resource-characterization.json'), JSON.stringify(evidence, null, 2));
        console.log('RESOURCE CHARACTERIZATION', JSON.stringify(evidence));
        expect(reopened.exportSha256).toBe(imported.exportSha256);
      } finally {
        await rm(profile, { recursive: true, force: true });
        await rm(fixtureDir, { recursive: true, force: true });
      }
    });
  }
}
