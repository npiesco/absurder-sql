# AbsurderSQL Web Demo Guide

## What You're Looking At

The web demo (`examples/web_demo.html`) is a **fully interactive SQLite playground** running entirely in your browser.

## How to Run It

### 1. **Build for Web**

The checked-in `pkg` contains the qualified default runtime. To build a new
local candidate instead, run from the repository root:

```bash
npm run build
```

### 2. **Start Web Server**
```bash
npm run serve
```

Keep this server in its terminal; stop it with Ctrl+C when finished.

### 3. **Open the Demo**
Navigate to: `http://localhost:8080/examples/web_demo.html`

### 4. **Connect to Database**
- You'll see a "Connect to Database" button
- Click it to initialize SQLite with IndexedDB backend
- Watch the console output show the connection process

### 5. **Try the Quick Actions** (Pre-made queries)

**Create Demo Table:**
```sql
CREATE TABLE demo_users (
    id INTEGER PRIMARY KEY, 
    name TEXT, 
    email TEXT, 
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Insert Sample Data:**
```sql
INSERT INTO demo_users (name, email) 
VALUES ('John Doe', 'john@example.com');
```

**View All Users:**
```sql
SELECT * FROM demo_users ORDER BY id DESC;
```

**List Tables:**
```sql
SELECT name FROM sqlite_master WHERE type='table';
```

### 6. **Write Your Own SQL**
Type any SQL query in the textarea:
```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL,
    stock INTEGER
);

INSERT INTO products VALUES (1, 'Laptop', 999.99, 10);
INSERT INTO products VALUES (2, 'Mouse', 29.99, 50);

SELECT * FROM products WHERE price > 50;
```

### 7. **See Real-Time Results**
- Query results appear in a formatted table
- Console shows execution logs
- Statistics update (queries executed, rows affected, execution time)

### 8. **Test Persistence**
1. Insert some data
2. Refresh the page
3. Reconnect to the database
4. Query the data again. Await a successful `sync()` or `close()` before
   navigating away in application code; failed persistence rejects instead
   of being reported as a durable write.

## What Makes This Special

**[✓]** **No Backend** - Everything runs in the browser  
**[✓]** **Real SQLite** - Full SQL support with transactions  
**[✓]** **Persistent** - Data survives page refreshes (IndexedDB)  
**Measured** - Query duration is displayed for the current workload
**[✓]** **Type-Safe** - Proper data types (INTEGER, TEXT, REAL, BLOB)  
**[✓]** **Multi-Tab Ready** - Built-in coordination (leader election, write queuing, optimistic updates, metrics)  

## Features You Can Demo

### Basic Operations
- CREATE TABLE with constraints
- INSERT, UPDATE, DELETE
- SELECT with WHERE, ORDER BY, LIMIT

### Advanced SQL
- JOINs (INNER, LEFT, RIGHT)
- Aggregations (COUNT, SUM, AVG, MIN, MAX)
- GROUP BY and HAVING
- Subqueries
- Transactions (BEGIN, COMMIT, ROLLBACK)

### Real-World Scenarios
```sql
-- Create related tables
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE orders (
    id INTEGER PRIMARY KEY, 
    customer_id INTEGER, 
    total REAL,
    FOREIGN KEY(customer_id) REFERENCES customers(id)
);

-- Insert data
INSERT INTO customers VALUES (1, 'Alice'), (2, 'Bob');
INSERT INTO orders VALUES (1, 1, 99.99), (2, 1, 149.50), (3, 2, 75.00);

-- Complex query
SELECT 
    c.name, 
    COUNT(o.id) as order_count, 
    SUM(o.total) as total_spent
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id
ORDER BY total_spent DESC;
```

## Console Output

Watch the console for:
- ✓ Connection status
- ✓ Query execution time
- ✓ Rows affected
- ✓ Error messages (if any)
- ✓ Success confirmations

## Statistics Panel

Tracks:
- Total queries executed
- Total rows affected  
- Average execution time
- Tables created

## Browser DevTools

Open DevTools (F12) and check:
- **Application → IndexedDB** - See your data stored
- **Console** - View detailed logs
- **Network** - See WASM module loading

## Try These Demos

### 1. **Todo List**
```sql
CREATE TABLE todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO todos (task) VALUES 
    ('Learn AbsurderSQL'),
    ('Build an app'),
    ('Deploy to production');

SELECT * FROM todos WHERE completed = 0;
```

### 2. **Blog Posts**
```sql
CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    title TEXT,
    content TEXT,
    views INTEGER DEFAULT 0,
    published_at TEXT
);

INSERT INTO posts VALUES 
    (1, 'Getting Started', 'Welcome to my blog...', 100, '2024-01-01'),
    (2, 'Advanced Tips', 'Here are some tips...', 250, '2024-01-15');

SELECT title, views FROM posts ORDER BY views DESC;
```

### 3. **E-commerce**
```sql
CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL, category TEXT);
CREATE TABLE cart (id INTEGER PRIMARY KEY, product_id INTEGER, quantity INTEGER);

INSERT INTO products VALUES 
    (1, 'Laptop', 999.99, 'Electronics'),
    (2, 'Mouse', 29.99, 'Electronics'),
    (3, 'Desk', 299.99, 'Furniture');

INSERT INTO cart VALUES (1, 1, 1), (2, 2, 2);

SELECT p.name, p.price, c.quantity, (p.price * c.quantity) as subtotal
FROM cart c
JOIN products p ON c.product_id = p.id;
```

## Qualification and Portability

The demo is an interactive example. Current evidence is in
[Native qualification](../docs/NATIVE_QUALIFICATION.md), including the original
Apple Python 3.9.6 / SQLite 3.51.0 runtime and isolated Windows Server 2025 x64.
The 79 browser/benchmark, 13 deletion, and 35 stabilization cases cover more
than manually running the queries above; earlier failed attempts remain
recorded there.

`exportToFile()` requires a complete SQLite checkpoint. It returns a standalone
SQLite snapshot whose file-format bytes 18/19 use rollback-journal format;
the live database remains in WAL mode. Blocked or incomplete checkpoints reject.
`Database.deleteDatabase(name)` requires closed connections in every runtime
and physically removes only that exact database's OPFS and shared-IndexedDB
namespace, preserving similarly prefixed databases.
