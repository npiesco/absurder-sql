/**
 * SQL Demo - Test DataSync with real SQL queries
 */

const { Database } = require('./pkg/sqlite_indexeddb_rs.js');

async function main() {
    console.log('🗄️  SQL Demo - DataSync\n');

    // Connect
    const db = await Database.newDatabase('sql_demo');
    console.log('✓ Connected\n');

    // Create tables
    console.log('Creating tables...');
    await db.execute(`
        CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            age INTEGER
        )
    `);
    await db.execute(`
        CREATE TABLE orders (
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            amount REAL,
            status TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `);
    console.log('✓ Tables created\n');

    // Insert
    console.log('Inserting data...');
    await db.execute("INSERT INTO users VALUES (1, 'Alice', 'alice@test.com', 30)");
    await db.execute("INSERT INTO users VALUES (2, 'Bob', 'bob@test.com', 25)");
    await db.execute("INSERT INTO users VALUES (3, 'Charlie', 'charlie@test.com', 35)");
    await db.execute("INSERT INTO orders VALUES (1, 1, 99.99, 'completed')");
    await db.execute("INSERT INTO orders VALUES (2, 1, 149.50, 'pending')");
    await db.execute("INSERT INTO orders VALUES (3, 2, 75.00, 'completed')");
    console.log('✓ Data inserted\n');

    // Query
    console.log('SELECT * FROM users:');
    const users = await db.execute('SELECT * FROM users');
    console.log(JSON.stringify(users, null, 2));
    console.log(`Found ${users.rows.length} users\n`);

    console.log('SELECT * FROM orders:');
    const orders = await db.execute('SELECT * FROM orders');
    console.log(JSON.stringify(orders, null, 2));
    console.log(`Found ${orders.rows.length} orders\n`);

    // JOIN
    console.log('JOIN query - Users with their orders:');
    const joined = await db.execute(`
        SELECT u.name, u.email, o.amount, o.status
        FROM users u
        JOIN orders o ON u.id = o.user_id
        ORDER BY u.name
    `);
    console.log(JSON.stringify(joined, null, 2));

    // Aggregate
    console.log('\nAggregate - Total by user:');
    const agg = await db.execute(`
        SELECT u.name, COUNT(o.id) as order_count, SUM(o.amount) as total
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        GROUP BY u.id
    `);
    console.log(JSON.stringify(agg, null, 2));

    // Update
    console.log('\nUpdating order status...');
    const update = await db.execute("UPDATE orders SET status = 'shipped' WHERE id = 2");
    console.log(`✓ Updated ${update.affected_rows} row(s)`);

    // Delete
    console.log('\nDeleting user...');
    const del = await db.execute('DELETE FROM users WHERE id = 3');
    console.log(`✓ Deleted ${del.affected_rows} row(s)`);

    // Transaction
    console.log('\nTesting transaction...');
    await db.execute('BEGIN TRANSACTION');
    await db.execute("INSERT INTO users VALUES (4, 'Diana', 'diana@test.com', 28)");
    await db.execute("INSERT INTO orders VALUES (4, 4, 200.00, 'pending')");
    await db.execute('COMMIT');
    console.log('✓ Transaction committed');

    // Final count
    const count = await db.execute('SELECT COUNT(*) as count FROM users');
    console.log(`\n📊 Final user count: ${count.rows[0].values[0]}`);

    await db.close();
    console.log('\n✓ Demo complete!');
}

main().catch(console.error);
