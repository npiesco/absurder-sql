import init, { Database } from '../../pkg/sqlite_indexeddb_rs.js';

let db;
const app = document.getElementById('app');

// Render UI
function renderUI() {
    app.innerHTML = `
        <div style="max-width: 800px; margin: 50px auto; font-family: system-ui;">
            <h1>Vite + DataSync Demo</h1>
            <div id="status" style="padding: 10px; background: #e3f2fd; margin: 20px 0; border-radius: 4px;"></div>
            <button id="runTest" style="padding: 10px 20px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Run Test</button>
            <button id="clear" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Clear DB</button>
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

async function initDB() {
    status('Initializing WASM...');
    await init();
    
    status('Opening database...');
    db = await Database.newDatabase('vite_example');
    
    await db.execute('CREATE TABLE IF NOT EXISTS items (id INT PRIMARY KEY, name TEXT, value REAL)');
    await db.sync();
    
    status('Ready!');
}

async function runTest() {
    document.getElementById('output').textContent = '';
    
    try {
        log('Inserting test data...');
        await db.execute("INSERT INTO items VALUES (1, 'Widget', 19.99)");
        await db.execute("INSERT INTO items VALUES (2, 'Gadget', 49.99)");
        await db.execute("INSERT INTO items VALUES (3, 'Tool', 29.99)");
        await db.sync();
        log('✓ Inserted 3 items\n');
        
        log('Querying data...');
        const result = await db.execute('SELECT * FROM items');
        result.rows.forEach(row => {
            const id = row.values[0].value;
            const name = row.values[1].value;
            const value = row.values[2].value;
            log(`  ${id}: ${name} - $${value}`);
        });
        
        log('\n✓ Test complete! Data persists across page refreshes.');
        status('Test passed!');
    } catch (error) {
        log('ERROR: ' + error.message);
        status('Test failed');
    }
}

async function clearDB() {
    await db.execute('DROP TABLE IF EXISTS items');
    await db.execute('CREATE TABLE items (id INT PRIMARY KEY, name TEXT, value REAL)');
    await db.sync();
    document.getElementById('output').textContent = '';
    status('Database cleared');
}

renderUI();
initDB().then(() => {
    document.getElementById('runTest').addEventListener('click', runTest);
    document.getElementById('clear').addEventListener('click', clearDB);
});
