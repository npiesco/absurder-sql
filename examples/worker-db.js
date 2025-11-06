import init, { Database } from '../pkg/absurder_sql.js';

let db = null;

// Message handler
self.onmessage = async function(e) {
    const { type, id, count } = e.data;
    
    try {
        switch (type) {
            case 'init':
                await init();
                db = await Database.newDatabase('worker_demo.db');
                
                // Workers don't have localStorage for leader election
                // so we enable non-leader writes
                db.allowNonLeaderWrites(true);
                
                self.postMessage({ 
                    type, 
                    id, 
                    success: true, 
                    message: 'Database initialized in worker' 
                });
                break;
                
            case 'createTable':
                await db.execute('DROP TABLE IF EXISTS benchmark');
                await db.execute(`
                    CREATE TABLE benchmark (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT,
                        value REAL,
                        created_at INTEGER
                    )
                `);
                self.postMessage({ 
                    type, 
                    id, 
                    success: true, 
                    message: 'Table created successfully' 
                });
                break;
                
            case 'insertData':
                const startInsert = performance.now();
                const insertCount = count || 1000;
                
                await db.execute('BEGIN TRANSACTION');
                for (let i = 0; i < insertCount; i++) {
                    await db.execute(
                        'INSERT INTO benchmark (name, value, created_at) VALUES (?, ?, ?)',
                        [
                            { type: 'Text', value: `Item ${i}` },
                            { type: 'Real', value: Math.random() * 100 },
                            { type: 'Integer', value: Date.now() }
                        ]
                    );
                }
                await db.execute('COMMIT');
                
                const insertDuration = Math.round(performance.now() - startInsert);
                
                self.postMessage({ 
                    type, 
                    id, 
                    success: true, 
                    message: `Inserted ${insertCount} rows in ${insertDuration}ms`,
                    data: { count: insertCount, duration: insertDuration }
                });
                break;
                
            case 'queryData':
                const startQuery = performance.now();
                const result = await db.execute('SELECT COUNT(*) as count FROM benchmark');
                const queryDuration = Math.round(performance.now() - startQuery);
                
                const rowCount = result.rows.length > 0 ? result.rows[0].values[0].value : 0;
                
                self.postMessage({ 
                    type, 
                    id, 
                    success: true, 
                    data: { count: rowCount, duration: queryDuration }
                });
                break;
                
            case 'sync':
                await db.sync();
                self.postMessage({ 
                    type, 
                    id, 
                    success: true, 
                    message: 'Database synced to IndexedDB' 
                });
                break;
                
            case 'clear':
                await db.execute('DROP TABLE IF EXISTS benchmark');
                await db.sync();
                self.postMessage({ 
                    type, 
                    id, 
                    success: true, 
                    message: 'Database cleared' 
                });
                break;
                
            default:
                throw new Error(`Unknown message type: ${type}`);
        }
    } catch (error) {
        console.error(`[Worker] Error in ${type}:`, error);
        self.postMessage({ 
            type, 
            id, 
            success: false, 
            error: error.toString() 
        });
    }
};

// Log when worker is loaded
console.log('[Worker] AbsurderSQL worker loaded');
