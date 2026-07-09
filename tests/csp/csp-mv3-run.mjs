// Real integration check: load absurder-sql under an MV3-equivalent CSP
// (script-src 'self' 'wasm-unsafe-eval' — wasm allowed, eval/new Function forbidden)
// and drive real DB ops. RED if CSP blocks eval/new Function; GREEN once the
// source uses web-sys/Closures instead.
import { chromium } from '@playwright/test';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url)); // tests/csp/ -> repo root
const PORT = 8129;
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.wasm': 'application/wasm', '.json': 'application/json', '.css': 'text/css',
  '.ts': 'text/plain', '.map': 'application/json',
};

const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/tests/csp/csp-mv3.html';
    const fp = normalize(join(ROOT, p));
    if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    const data = await readFile(fp);
    res.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('not found: ' + req.url);
  }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const browser = await chromium.launch(
  process.env.PW_EXECUTABLE_PATH ? { executablePath: process.env.PW_EXECUTABLE_PATH } : {}
);
const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') pageErrors.push('console.error: ' + m.text()); });

await page.goto(`http://127.0.0.1:${PORT}/tests/csp/csp-mv3.html`, { waitUntil: 'load' });

// Wait for the module script to define the entry point; if it never does,
// the pkg glue threw at import/init time (the RED signal we care about).
let hasEntry = false;
for (let i = 0; i < 40; i++) {
  hasEntry = await page.evaluate(() => typeof window.runCspTest === 'function');
  if (hasEntry) break;
  await new Promise((r) => setTimeout(r, 250));
}

let result;
if (hasEntry) {
  result = await page.evaluate(() => window.runCspTest());
} else {
  result = {
    init: false, created: false, wrote: false, synced: false, deleted: false,
    error: 'module import/init failed before runCspTest was defined',
    cspErrors: await page.evaluate(() => window.__cspErrors || []),
  };
}

console.log('=== CSP MV3 test result ===');
console.log(JSON.stringify(result, null, 2));
console.log('pageErrors:', JSON.stringify(pageErrors, null, 2));

const green = result.synced && result.deleted
  && (!result.cspErrors || result.cspErrors.length === 0)
  && !result.error;
console.log(green
  ? 'CSP_RESULT: GREEN — sync + deleteDatabase succeeded under MV3 CSP (no eval/new Function)'
  : 'CSP_RESULT: RED — CSP blocked eval/new Function; sync/delete failed');

await browser.close();
server.close();
process.exit(green ? 0 : 1);
