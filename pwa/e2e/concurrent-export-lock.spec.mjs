import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    const text = msg.text();
    console.log('[BROWSER]', text);
  });

  await page.goto('http://localhost:3000/db');
  await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });

  // Test if Web Locks API works in JavaScript first
  const locksTest = await page.evaluate(async () => {
    if (!navigator.locks) {
      return { supported: false, error: 'navigator.locks not available' };
    }
    
    try {
      let lockAcquired = false;
      await navigator.locks.request('test-lock', async (lock) => {
        lockAcquired = true;
        console.log('[TEST] Web Locks API works in JS! Lock:', lock);
        // Lock held here
      });
      return { supported: true, lockAcquired };
    } catch (err) {
      return { supported: true, error: err.message };
    }
  });
  
  console.log('[LOCKS TEST]', locksTest);

  const result = await page.evaluate(async () => {
    const Database = window.Database;
    const results = [];

    console.log('[TEST] Creating database...');
    const dbName = 'lock_test_' + Date.now() + '.db';
    const db = await Database.newDatabase(dbName);
    if (db.allowNonLeaderWrites) await db.allowNonLeaderWrites(true);

    console.log('[TEST] Creating table...');
    await db.execute('CREATE TABLE test (id INTEGER, val TEXT)');
    await db.execute("INSERT INTO test VALUES (1, 'data')");

    console.log('[TEST] Starting 5 rapid exports...');
    const exportPromises = [];
    for (let i = 0; i < 5; i++) {
      console.log(`[TEST] Starting export ${i}...`);
      const p = db.exportToFile().then(() => {
        console.log(`[TEST] Export ${i} completed!`);
        results.push(`export-${i}-success`);
      });
      exportPromises.push(p);
    }

    console.log('[TEST] Waiting for all exports...');
    const timeout = new Promise((_, reject) =>
      setTimeout(() => {
        console.log('[TEST] TIMEOUT! Results so far:', results);
        reject(new Error('Exports timed out'));
      }, 5000)
    );

    try {
      await Promise.race([
        Promise.all(exportPromises),
        timeout
      ]);
      console.log('[TEST] All exports completed!');
    } catch (e) {
      console.log('[TEST] ERROR:', e.message);
      return { success: false, error: e.message, exportCount: results.length };
    }

    await db.close();

    return { success: true, exportCount: results.length, results };
  });

  console.log('[RESULT]', result);

  await browser.close();
})();
