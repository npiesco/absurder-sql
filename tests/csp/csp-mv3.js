// External module script (MV3 extensions forbid inline scripts under strict CSP,
// so this MUST be loaded via <script type="module" src="./csp-mv3.js">). It drives
// the real absurder-sql code paths that today go through eval / new Function:
//   - db.sync()  -> fs_persist / sync_operations open block_storage -> js_sys::Function::new_no_args(...)
//   - Database.deleteDatabase() -> js_sys::eval("indexedDB.deleteDatabase(...)")
import init, { Database } from '/pkg/absurder_sql.js';

const out = document.getElementById('out');
const log = (m) => { out.textContent += '\n' + m; };

window.__cspErrors = [];
// Real CSP violations surface here (eval / new Function under strict script-src)
window.addEventListener('securitypolicyviolation', (e) => {
  window.__cspErrors.push(
    `${e.violatedDirective} blocked ${e.blockedURI || 'inline'} @ ${e.sourceFile || ''}:${e.lineNumber || ''}`
  );
});

window.runCspTest = async () => {
  const r = { init: false, created: false, wrote: false, synced: false, deleted: false, error: null };
  try {
    await init();
    r.init = true;
    const db = await Database.newDatabase('csp_mv3_test');
    r.created = true;
    await db.execute("CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, v TEXT)");
    await db.execute("INSERT INTO t (v) VALUES ('hello')");
    r.wrote = true;
    await db.sync();
    r.synced = true;
    await db.close();
    await Database.deleteDatabase('csp_mv3_test');
    r.deleted = true;
  } catch (e) {
    r.error = String(e && e.message ? e.message : e);
  }
  r.cspErrors = window.__cspErrors.slice();
  window.__cspResult = r;
  return r;
};

init().then(() => log('wasm init ok — run window.runCspTest()')).catch((e) => log('init failed: ' + e));
