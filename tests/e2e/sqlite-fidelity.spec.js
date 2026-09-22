import { test, expect } from '@playwright/test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { runBrowserPhase } from './helpers/browser-runtime.js';

const text = "\0start caf\u00e9 \u65e5\u672c \ud83d\ude80 e\u0301\0middle\0end\0";
const blob = Array.from({ length: 8193 }, (_, index) => index % 256);
const value = (type, value) => type === 'Null' ? { type } : { type, value };
const expectedRow = [
  value('Integer', 41), value('Text', text), value('Blob', blob),
  value('Real', 1.25), value('Null'),
];
const runtime = './sqlite-fidelity-runtime.js';
const nativeRead = `
import json,sqlite3,sys
from pathlib import Path
with sqlite3.connect(Path(sys.argv[1]).resolve().as_uri()+'?mode=ro',uri=True) as db:
 assert db.execute('PRAGMA integrity_check').fetchall()==[('ok',)]
 print(json.dumps([[i,t,list(b),v,n] for i,t,b,v,n in db.execute('SELECT * FROM records ORDER BY id')],ensure_ascii=True))
`;

for (const backend of ['IndexedDB', 'Hybrid', 'OPFS']) {
  test(`${backend}: standalone export is read-only portable without changing the live WAL database`, async ({ baseURL }, testInfo) => {
    const profile = await mkdtemp(join(tmpdir(), 'ase-'));
    try {
      const result = await runBrowserPhase(profile, baseURL, {
        runtime: './export-portability-runtime.js', backend,
      });
      const path = testInfo.outputPath('standalone.sqlite');
      await writeFile(path, Buffer.from(result.bytes));
      const native = JSON.parse(execFileSync(process.env.PYTHON || 'python', ['-c', `
import hashlib,json,sqlite3,sys
from pathlib import Path
path=Path(sys.argv[1])
before=hashlib.sha256(path.read_bytes()).hexdigest()
with sqlite3.connect(path.resolve().as_uri()+'?mode=ro',uri=True) as db:
 assert db.execute('PRAGMA integrity_check').fetchall()==[('ok',)]
 print(json.dumps({'rows':db.execute('SELECT id,payload FROM exported ORDER BY id').fetchall(),
  'mode':db.execute('PRAGMA journal_mode').fetchone()[0]}))
assert hashlib.sha256(path.read_bytes()).hexdigest()==before
`, path], { encoding: 'utf8', timeout: 30_000 }));
      expect(native).toEqual({ rows: [[41, 'early\0tail']], mode: 'delete' });
      expect(result).toMatchObject({ modeBefore: 'wal', modeAfter: 'wal', count: 2 });
      expect(result.activeReaderError).toMatch(/checkpoint/i);
    } finally {
      await rm(profile, { recursive: true, force: true });
    }
  });

  test(`${backend}: exact NUL Unicode text and binary survive browser restart and native SQLite`, async ({ baseURL }, testInfo) => {
    const profile = await mkdtemp(join(tmpdir(), 'asf-'));
    try {
      const seed = await runBrowserPhase(profile, baseURL, { runtime, backend, phase: 'seed', text, blob });
      const reopened = await runBrowserPhase(profile, baseURL, { runtime, backend, phase: 'read' });
      await writeFile(testInfo.outputPath('fidelity-readback.json'), JSON.stringify({ seed, reopened }));
      for (const [name, result] of Object.entries({ seed, reopened })) {
        const path = testInfo.outputPath(`${name}.sqlite`);
        await writeFile(path, Buffer.from(result.bytes));
        const native = JSON.parse(execFileSync(process.env.PYTHON || 'python', ['-c', nativeRead, path], { encoding: 'utf8', timeout: 30_000 }));
        expect.soft(native).toEqual([[41, text, blob, 1.25, null], [42, '', [], null, null]]);
        expect.soft(result.select.rows).toEqual([expectedRow, [
          value('Integer', 42), value('Text', ''), value('Blob', []), value('Null'), value('Null'),
        ]]);
        expect.soft(result.parameterizedSelect.rows).toEqual(result.select.rows);
        expect.soft(result.select.affectedRows).toBe(0);
        expect.soft(result.select.lastInsertId).toBeNull();
      }
      expect(seed.insert.affectedRows).toBe(1);
      expect(seed.insert.lastInsertId).toBe(41);
    } finally {
      await rm(profile, { recursive: true, force: true });
    }
  });

  for (const parameterized of [false, true]) {
    test(`${backend}: ${parameterized ? 'parameterized' : 'normal'} returning CTE and values preserve all SQLite types and metadata`, async ({ baseURL }, testInfo) => {
      const profile = await mkdtemp(join(tmpdir(), 'asf-'));
      try {
        const result = await runBrowserPhase(profile, baseURL, { runtime, backend, phase: 'statements', parameterized });
        await writeFile(testInfo.outputPath('statement-readback.json'), JSON.stringify(result));
        const row = [
          value('Integer', 41), value('Text', 'start\0end'), value('Blob', [0, 1, 255, 128]),
          value('Real', 1.25), value('Null'),
        ];
        for (const name of ['insert', 'select', 'cte', 'commented', 'values', 'update', 'cteUpdate', 'delete']) {
          expect.soft(result[name].error, name).toBeUndefined();
          const expected = row.map(cell => ({ ...cell }));
          if (name === 'update') expected[3] = value('Real', 2.5);
          if (name === 'cteUpdate' || name === 'delete') expected[3] = value('Real', 3.75);
          expect.soft(result[name].result?.rows, name).toEqual([expected]);
        }
        for (const name of ['insert', 'update', 'cteUpdate', 'delete', 'plainInsert', 'plainUpdate']) {
          expect.soft(result[name].result?.affectedRows, name).toBe(1);
          expect.soft(result[name].result?.lastInsertId, name).toBe(name.toLowerCase().includes('insert') ? 41 : null);
        }
        for (const name of ['select', 'cte', 'commented', 'values', 'emptySelect', 'noMatch', 'pragma']) {
          expect.soft(result[name].result?.affectedRows, name).toBe(0);
          expect.soft(result[name].result?.lastInsertId, name).toBeNull();
        }
        expect(result.cteInsert.result).toMatchObject({ affectedRows: 1, lastInsertId: 57,
          rows: [[value('Integer', 57), value('Text', 'cte')]] });
        expect(result.duplicate.error).toContain('UNIQUE constraint failed');
        expect(result.afterError.result).toMatchObject({ affectedRows: 0, lastInsertId: null,
          rows: [[value('Integer', 2)]] });
        expect(result.ignoredInsert.result).toMatchObject({ affectedRows: 0, lastInsertId: 57 });
        expect(result.invalidText.error).toContain('not valid UTF-8');
        expect(result.readAfterInvalid.result.rows).toEqual([[value('Text', 'still-open')]]);
        expect(result.explain.result).toMatchObject({ affectedRows: 0, lastInsertId: null });
        expect(result.afterExplain.result.rows).toEqual([[value('Integer', 2)]]);
        expect(result.createAfterWrite.result.affectedRows).toBe(0);
        expect(result.triggeredUpdate.result).toMatchObject({ affectedRows: 2, lastInsertId: null,
          rows: [[value('Integer', 41)], [value('Integer', 57)]] });
        expect(result.transactionalInsert.result).toMatchObject({ affectedRows: 1, lastInsertId: 71 });
        expect(result.rollback.result).toMatchObject({ affectedRows: 0, lastInsertId: null });
        expect(result.afterRollback.result.rows).toEqual([[value('Integer', 2)]]);
        expect(result.boundReturning.result).toMatchObject({ affectedRows: 1, lastInsertId: 88,
          rows: [[value('Text', 'bound\0\u65e5\u672c\ud83d\ude80\0end'), value('Blob', [0, 255, 0])]] });
      } finally {
        await rm(profile, { recursive: true, force: true });
      }
    });
  }
}
