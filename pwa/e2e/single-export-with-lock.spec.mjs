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

    console.log('[TEST] Creating database...');
    const dbName = 'single_export_test_' + Date.now() + '.db';
    const db = await Database.newDatabase(dbName);
    if (db.allowNonLeaderWrites) await db.allowNonLeaderWrites(true);

    console.log('[TEST] Creating table...');
    await db.execute('CREATE TABLE test (id INTEGER, val TEXT)');
    await db.execute("INSERT INTO test VALUES (1, 'data')");

    console.log('[TEST] Starting SINGLE export with locking...');
    
    const timeout = new Promise((_, reject) =>
      setTimeout(() => {
        console.log('[TEST] TIMEOUT!');
        reject(new Error('Single export timed out'));
      }, 5000)
    );

    try {
      const exportData = await Promise.race([
        db.exportToFile(),
        timeout
      ]);
      console.log('[TEST] Single export completed! Size:', exportData.length);
      await db.close();
      return { success: true, size: exportData.length };
    } catch (e) {
      console.log('[TEST] ERROR:', e.message);
      return { success: false, error: e.message };
    }
  });

  console.log('[RESULT]', result);

  await browser.close();
})();
