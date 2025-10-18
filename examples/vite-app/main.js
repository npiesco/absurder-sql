import init, { Database } from '../../pkg/absurder_sql.js';
import { MultiTabDatabase } from '../multi-tab-wrapper.js';

let db;
let isLeader = false;
const app = document.getElementById('app');

// Render UI
function renderUI() {
    app.innerHTML = `
        <div style="max-width: 800px; margin: 50px auto; font-family: system-ui;">
            <h1>Vite + AbsurderSQL Demo <span id="leaderBadge" style="font-size: 0.5em; padding: 4px 12px; border-radius: 12px; background: #gray; color: white;">...</span></h1>
            <div id="status" style="padding: 10px; background: #e3f2fd; margin: 20px 0; border-radius: 4px;"></div>
            <div style="margin: 20px 0;">
                <button id="runTest" style="padding: 10px 20px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Run Test</button>
                <button id="clear" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Clear DB</button>
                <button id="requestLeader" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Request Leadership</button>
            </div>
            <div style="padding: 10px; background: #fff3cd; border-left: 4px solid #ffc107; margin: 20px 0;">
                <strong>Multi-Tab Test:</strong> Open this page in multiple tabs. Only the leader tab can write data. Try writing from different tabs to see the coordination in action!
            </div>
            <pre id="output" style="margin-top: 20px; padding: 20px; background: #f5f5f5; border-radius: 4px; overflow-x: auto;"></pre>
        </div>
    `;
}

function log(msg) {
    const output = document.getElementById('output');
    output.textContent += msg + '\n';
}

function status(msg) {
    document.getElementById('status').textContent = msg;
}

async function updateLeaderStatus() {
    try {
        isLeader = await db.isLeader();
        const badge = document.getElementById('leaderBadge');
        const runBtn = document.getElementById('runTest');
        const clearBtn = document.getElementById('clear');
        
        if (isLeader) {
            badge.textContent = '[LEADER]';
            badge.style.background = '#28a745';
            runBtn.disabled = false;
            clearBtn.disabled = false;
            status('This tab is the LEADER - you can write to the database');
        } else {
            badge.textContent = '[FOLLOWER]';
            badge.style.background = '#6c757d';
            runBtn.disabled = true;
            clearBtn.disabled = true;
            status('This tab is a FOLLOWER - read-only mode (click "Request Leadership" to become leader)');
        }
    } catch (err) {
        console.error('Error updating leader status:', err);
    }
}

async function initDB() {
    status('Initializing WASM...');
    await init();
    
    // Expose Database class on window IMMEDIATELY after init
    window.Database = Database;
    
    status('Creating multi-tab database...');
    db = new MultiTabDatabase(Database, 'vite_example', {
        autoSync: true,
        waitForLeadership: false
    });
    
    // Expose db wrapper on window for testing
    window.db = db;
    
    await db.init();
    
    // Create table (DDL operations allowed from any tab)
    await db.execute('CREATE TABLE IF NOT EXISTS items (id INT PRIMARY KEY, name TEXT, value REAL)');
    
    // Set up refresh callback for changes from other tabs
    db.onRefresh(async () => {
        log('🔄 Data changed in another tab - refreshing...');
        try {
            await updateLeaderStatus();
        } catch (err) {
            // Silently ignore borrow conflicts from broadcast messages
            if (!err.message?.includes('recursive use')) {
                console.error('Error in refresh callback:', err);
            }
        }
        // Optionally reload data here
    });
    
    // Update leader status
    await updateLeaderStatus();
    
    // Update status every 2 seconds (with error handling for borrow conflicts)
    setInterval(async () => {
        try {
            await updateLeaderStatus();
        } catch (err) {
            // Silently ignore borrow conflicts during polling
            if (!err.message?.includes('recursive use')) {
                console.error('Error updating leader status:', err);
            }
        }
    }, 2000);
    
    status('Ready!');
}

async function runTest() {
    document.getElementById('output').textContent = '';
    
    try {
        // Check if we're leader (fresh check, not cached)
        const currentlyLeader = await db.isLeader();
        if (!currentlyLeader) {
            log('❌ Cannot write: This tab is not the leader');
            log('Click "Request Leadership" to become leader\n');
            status('⚠️ Write failed - not leader');
            return;
        }
        
        log('Inserting test data...');
        await db.write("INSERT INTO items VALUES (?, ?, ?)", [
            { type: 'Integer', value: 1 },
            { type: 'Text', value: 'Widget' },
            { type: 'Real', value: 19.99 }
        ]);
        await db.write("INSERT INTO items VALUES (?, ?, ?)", [
            { type: 'Integer', value: 2 },
            { type: 'Text', value: 'Gadget' },
            { type: 'Real', value: 49.99 }
        ]);
        await db.write("INSERT INTO items VALUES (?, ?, ?)", [
            { type: 'Integer', value: 3 },
            { type: 'Text', value: 'Tool' },
            { type: 'Real', value: 29.99 }
        ]);
        log('✓ Inserted 3 items (auto-synced)\n');
        
        log('Querying data...');
        const result = await db.query('SELECT * FROM items');
        result.rows.forEach(row => {
            const id = row.values[0].value;
            const name = row.values[1].value;
            const value = row.values[2].value;
            log(`  ${id}: ${name} - $${value}`);
        });
        
        log('\n✓ Test complete! Data persists across page refreshes.');
        log('Open another tab to see multi-tab coordination in action!');
        status('Test passed!');
    } catch (error) {
        log('ERROR: ' + error.message);
        status('Test failed: ' + error.message);
    }
}

async function clearDB() {
    try {
        // Check if we're leader (fresh check, not cached)
        const currentlyLeader = await db.isLeader();
        if (!currentlyLeader) {
            log('❌ Cannot clear: This tab is not the leader');
            status('⚠️ Clear failed - not leader');
            return;
        }
        
        await db.write('DROP TABLE IF EXISTS items');
        await db.execute('CREATE TABLE items (id INT PRIMARY KEY, name TEXT, value REAL)');
        document.getElementById('output').textContent = '';
        log('✓ Database cleared');
        status('Database cleared');
    } catch (error) {
        log('ERROR: ' + error.message);
        status('Clear failed: ' + error.message);
    }
}

async function requestLeadership() {
    try {
        log('Requesting leadership...');
        await db.requestLeadership();
        
        // Wait a bit then check once (avoid polling conflicts)
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Single check to update UI
        try {
            await updateLeaderStatus();
            if (isLeader) {
                log('✓ Leadership acquired - you can now write!');
            } else {
                log('⚠️ Leadership request sent (UI will update when leader)');
            }
        } catch (err) {
            // Ignore borrow conflicts during status check
            log('Leadership request sent (status will update shortly)');
        }
    } catch (error) {
        log('ERROR: ' + error.message);
    }
}

renderUI();
initDB().then(() => {
    document.getElementById('runTest').addEventListener('click', runTest);
    document.getElementById('clear').addEventListener('click', clearDB);
    document.getElementById('requestLeader').addEventListener('click', requestLeadership);
});
