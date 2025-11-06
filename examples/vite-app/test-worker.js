import init, { Database } from '../../pkg/absurder_sql.js';

self.onmessage = async function(e) {
  try {
    console.log('[Worker] Starting initialization...');
    await init();
    console.log('[Worker] WASM initialized');
    
    console.log('[Worker] Creating database...');
    const db = await Database.newDatabase('worker_test.db');
    console.log('[Worker] Database created successfully');
    
    // Workers don't have localStorage for leader election, so allow non-leader writes
    console.log('[Worker] Allowing non-leader writes for worker context...');
    db.allowNonLeaderWrites(true);
    
    console.log('[Worker] Creating table...');
    await db.execute('CREATE TABLE IF NOT EXISTS test (id INTEGER, value TEXT)');
    
    console.log('[Worker] Inserting data...');
    await db.execute("INSERT INTO test VALUES (1, 'hello from worker')");
    
    console.log('[Worker] Syncing to IndexedDB...');
    await db.sync();
    console.log('[Worker] Sync complete');
    
    console.log('[Worker] Querying data...');
    const result = await db.execute('SELECT * FROM test');
    console.log('[Worker] Query returned ' + result.rows.length + ' rows');
    
    await db.close();
    
    self.postMessage({ 
      success: true, 
      rowCount: result.rows.length 
    });
  } catch (error) {
    console.error('[Worker] Error:', error.toString());
    console.error('[Worker] Error stack:', error.stack);
    self.postMessage({ 
      success: false, 
      error: error.toString(),
      stack: error.stack
    });
  }
};
