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

  const result = await page.evaluate(async () => {
    const Database = window.Database;
    const results = [];

    console.log('[TEST] Creating database...');
    const dbName = 'lock_test_' + Date.now() + '.db';
    const db = await Database.newDatabase(dbName);

    console.log('[TEST] Starting 5 concurrent lock tests...');
    const lockPromises = [];
    for (let i = 0; i < 5; i++) {
      console.log(`[TEST] Starting lock test ${i}...`);
      const p = db.testLock(i).then((result) => {
        console.log(`[TEST] Lock test ${i} completed with result: ${result}`);
        results.push({ index: i, result });
      });
      lockPromises.push(p);
    }

    console.log('[TEST] Waiting for all lock tests...');
    const timeout = new Promise((_, reject) =>
      setTimeout(() => {
        console.log('[TEST] TIMEOUT! Results so far:', results);
        reject(new Error('Lock tests timed out'));
      }, 5000)
    );

    try {
      await Promise.race([
        Promise.all(lockPromises),
        timeout
      ]);
      console.log('[TEST] All lock tests completed!');
    } catch (e) {
      console.log('[TEST] ERROR:', e.message);
      return { success: false, error: e.message, resultCount: results.length, results };
    }

    await db.close();

    return { success: true, resultCount: results.length, results };
  });

  console.log('[RESULT]', result);

  await browser.close();
})();
