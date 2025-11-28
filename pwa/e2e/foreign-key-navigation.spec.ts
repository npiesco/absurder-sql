/**
 * E2E Tests for Foreign Key Navigation
 * 
 * Tests FK detection, clickable FK values, and navigation to related tables
 * Based on Adminer parity requirement FR-AB1.9
 */

import { test, expect } from '@playwright/test';

test.describe('Foreign Key Navigation - FK Detection', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/db/browse');
    await page.waitForSelector('#dataBrowser', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
  });

  test('should detect foreign key relationships', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      
      // Create parent and child tables with FK relationship
      await db.execute('DROP TABLE IF EXISTS child_table');
      await db.execute('DROP TABLE IF EXISTS parent_table');
      
      await db.execute(`
        CREATE TABLE parent_table (
          id INTEGER PRIMARY KEY,
          name TEXT
        )
      `);
      
      await db.execute(`
        CREATE TABLE child_table (
          id INTEGER PRIMARY KEY,
          parent_id INTEGER,
          description TEXT,
          FOREIGN KEY (parent_id) REFERENCES parent_table(id)
        )
      `);
      
      await db.execute("INSERT INTO parent_table (id, name) VALUES (1, 'Parent A')");
      await db.execute("INSERT INTO child_table (id, parent_id, description) VALUES (1, 1, 'Child of A')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=child_table');
    await page.waitForSelector('table tbody tr');

    // Check if FK column is detected (should have visual indicator)
    const fkCell = page.locator('table tbody tr:first-child td:nth-child(4)'); // parent_id column
    await expect(fkCell).toBeVisible();
    
    // FK cells should be clickable (have a link style or button)
    const isFKClickable = await fkCell.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const hasLink = el.querySelector('a') !== null || el.querySelector('button') !== null;
      const hasCursor = style.cursor === 'pointer';
      return hasLink || hasCursor || el.hasAttribute('data-fk-link');
    });
    
    expect(isFKClickable).toBe(true);
  });

  test('should show FK indicator for foreign key columns', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      
      await db.execute('DROP TABLE IF EXISTS orders');
      await db.execute('DROP TABLE IF EXISTS customers');
      
      await db.execute(`
        CREATE TABLE customers (
          customer_id INTEGER PRIMARY KEY,
          customer_name TEXT
        )
      `);
      
      await db.execute(`
        CREATE TABLE orders (
          order_id INTEGER PRIMARY KEY,
          customer_id INTEGER,
          order_date TEXT,
          FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        )
      `);
      
      await db.execute("INSERT INTO customers (customer_id, customer_name) VALUES (100, 'Alice')");
      await db.execute("INSERT INTO orders (order_id, customer_id, order_date) VALUES (1, 100, '2024-01-01')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=orders');
    await page.waitForSelector('table tbody tr');

    // Check column header has FK indicator
    const customerIdHeader = page.locator('table thead th:has-text("customer_id")');
    const hasIndicator = await customerIdHeader.evaluate((el) => {
      return el.textContent?.includes('→') || 
             el.textContent?.includes('FK') || 
             el.querySelector('[data-fk-indicator]') !== null ||
             el.querySelector('svg') !== null;
    });
    
    expect(hasIndicator).toBe(true);
  });
});

test.describe('Foreign Key Navigation - Click to Navigate', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/db/browse');
    await page.waitForSelector('#dataBrowser', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
  });

  test('should navigate to related table when FK value is clicked', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      
      await db.execute('DROP TABLE IF EXISTS posts');
      await db.execute('DROP TABLE IF EXISTS users');
      
      await db.execute(`
        CREATE TABLE users (
          user_id INTEGER PRIMARY KEY,
          username TEXT
        )
      `);
      
      await db.execute(`
        CREATE TABLE posts (
          post_id INTEGER PRIMARY KEY,
          user_id INTEGER,
          content TEXT,
          FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
      `);
      
      await db.execute("INSERT INTO users (user_id, username) VALUES (5, 'john_doe')");
      await db.execute("INSERT INTO posts (post_id, user_id, content) VALUES (1, 5, 'Hello World')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=posts');
    await page.waitForSelector('table tbody tr');

    // Check if FK button exists and click it
    const fkButton = page.locator('table tbody tr:first-child td:nth-child(4) button');
    await expect(fkButton).toBeVisible();
    await fkButton.click();
    await page.waitForTimeout(1000);

    // Should navigate to users table
    await page.waitForTimeout(1500);
    const cardTitle = await page.locator('[data-table-title]').textContent();
    expect(cardTitle).toBe('users');

    // Should show the related row (user_id = 5)
    await page.waitForSelector('table tbody tr');
    const firstRow = await page.locator('table tbody tr:first-child td:nth-child(2)').textContent(); // rowid column should be 5
    expect(firstRow?.trim()).toBe('5');
  });

  test('should filter to specific row when navigating via FK', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      
      await db.execute('DROP TABLE IF EXISTS comments');
      await db.execute('DROP TABLE IF EXISTS articles');
      
      await db.execute(`
        CREATE TABLE articles (
          article_id INTEGER PRIMARY KEY,
          title TEXT
        )
      `);
      
      await db.execute(`
        CREATE TABLE comments (
          comment_id INTEGER PRIMARY KEY,
          article_id INTEGER,
          comment_text TEXT,
          FOREIGN KEY (article_id) REFERENCES articles(article_id)
        )
      `);
      
      await db.execute("INSERT INTO articles (article_id, title) VALUES (10, 'First Article')");
      await db.execute("INSERT INTO articles (article_id, title) VALUES (20, 'Second Article')");
      await db.execute("INSERT INTO comments (comment_id, article_id, comment_text) VALUES (1, 10, 'Great post!')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=comments');
    await page.waitForSelector('table tbody tr');

    // Click FK value (article_id = 10)
    await page.locator('table tbody tr:first-child td:nth-child(4) button').click();
    await page.waitForTimeout(500);

    // Should navigate to articles table with filter
    await page.waitForTimeout(1500);
    const cardTitle = await page.locator('[data-table-title]').textContent();
    expect(cardTitle).toBe('articles');
    
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(1); // Only one row should be shown (article_id = 10)
    
    const titleCell = await page.locator('table tbody tr:first-child td:nth-child(4)').textContent();
    expect(titleCell).toContain('First Article');
  });

  test('should handle NULL foreign key values', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      
      await db.execute('DROP TABLE IF EXISTS tasks');
      await db.execute('DROP TABLE IF EXISTS projects');
      
      await db.execute(`
        CREATE TABLE projects (
          project_id INTEGER PRIMARY KEY,
          project_name TEXT
        )
      `);
      
      await db.execute(`
        CREATE TABLE tasks (
          task_id INTEGER PRIMARY KEY,
          project_id INTEGER,
          task_name TEXT,
          FOREIGN KEY (project_id) REFERENCES projects(project_id)
        )
      `);
      
      await db.execute("INSERT INTO projects (project_id, project_name) VALUES (1, 'Project A')");
      await db.execute("INSERT INTO tasks (task_id, project_id, task_name) VALUES (1, NULL, 'Unassigned Task')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=tasks');
    await page.waitForSelector('table tbody tr');

    // NULL FK value should not be clickable or should show NULL
    const nullFKCell = page.locator('table tbody tr:first-child td:nth-child(4)');
    const cellText = await nullFKCell.textContent();
    
    expect(cellText).toContain('NULL');
  });
});

test.describe('Foreign Key Navigation - Breadcrumbs & Back', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/db/browse');
    await page.waitForSelector('#dataBrowser', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
  });

  test('should show breadcrumb navigation after FK click', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      
      await db.execute('DROP TABLE IF EXISTS line_items');
      await db.execute('DROP TABLE IF EXISTS invoices');
      
      await db.execute(`
        CREATE TABLE invoices (
          invoice_id INTEGER PRIMARY KEY,
          invoice_number TEXT
        )
      `);
      
      await db.execute(`
        CREATE TABLE line_items (
          line_id INTEGER PRIMARY KEY,
          invoice_id INTEGER,
          description TEXT,
          FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id)
        )
      `);
      
      await db.execute("INSERT INTO invoices (invoice_id, invoice_number) VALUES (99, 'INV-001')");
      await db.execute("INSERT INTO line_items (line_id, invoice_id, description) VALUES (1, 99, 'Item 1')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=line_items');
    await page.waitForSelector('table tbody tr');

    // Click FK to navigate
    await page.locator('table tbody tr:first-child td:nth-child(4) button').click();
    await page.waitForTimeout(500);

    // Should show breadcrumb
    const breadcrumb = page.locator('[data-breadcrumb], nav[aria-label="breadcrumb"], .breadcrumb');
    await expect(breadcrumb).toBeVisible({ timeout: 5000 });
    
    // Breadcrumb should show path
    const breadcrumbText = await breadcrumb.textContent();
    expect(breadcrumbText).toContain('line_items');
    expect(breadcrumbText).toContain('invoices');
  });

  test('should have working back button after FK navigation', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      
      await db.execute('DROP TABLE IF EXISTS reviews');
      await db.execute('DROP TABLE IF EXISTS products');
      
      await db.execute(`
        CREATE TABLE products (
          product_id INTEGER PRIMARY KEY,
          product_name TEXT
        )
      `);
      
      await db.execute(`
        CREATE TABLE reviews (
          review_id INTEGER PRIMARY KEY,
          product_id INTEGER,
          rating INTEGER,
          FOREIGN KEY (product_id) REFERENCES products(product_id)
        )
      `);
      
      await db.execute("INSERT INTO products (product_id, product_name) VALUES (7, 'Widget')");
      await db.execute("INSERT INTO reviews (review_id, product_id, rating) VALUES (1, 7, 5)");
      await db.execute("INSERT INTO reviews (review_id, product_id, rating) VALUES (2, 7, 4)");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=reviews');
    await page.waitForSelector('table tbody tr');

    // Verify we're on reviews table with 2 rows
    let rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(2);

    // Click FK to navigate to products
    await page.locator('table tbody tr:first-child td:nth-child(4) button').click();
    await page.waitForTimeout(500);

    // Should be on products table
    await page.waitForTimeout(1500);
    let cardTitle = await page.locator('[data-table-title]').textContent();
    expect(cardTitle).toBe('products');

    // Click back button
    const backButton = page.locator('button:has-text("Back"), [data-back-button], button[aria-label*="back" i]').first();
    await backButton.click();
    await page.waitForTimeout(500);

    // Should be back on reviews table
    await page.waitForTimeout(1500);
    cardTitle = await page.locator('[data-table-title]').textContent();
    expect(cardTitle).toBe('reviews');
    
    // Should show all rows again (not filtered)
    rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(2);
  });

  test('should support multi-level FK navigation', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      
      await db.execute('DROP TABLE IF EXISTS order_items');
      await db.execute('DROP TABLE IF EXISTS orders_fk');
      await db.execute('DROP TABLE IF EXISTS customers_fk');
      
      await db.execute(`
        CREATE TABLE customers_fk (
          customer_id INTEGER PRIMARY KEY,
          name TEXT
        )
      `);
      
      await db.execute(`
        CREATE TABLE orders_fk (
          order_id INTEGER PRIMARY KEY,
          customer_id INTEGER,
          order_date TEXT,
          FOREIGN KEY (customer_id) REFERENCES customers_fk(customer_id)
        )
      `);
      
      await db.execute(`
        CREATE TABLE order_items (
          item_id INTEGER PRIMARY KEY,
          order_id INTEGER,
          product TEXT,
          FOREIGN KEY (order_id) REFERENCES orders_fk(order_id)
        )
      `);
      
      await db.execute("INSERT INTO customers_fk (customer_id, name) VALUES (1, 'Customer A')");
      await db.execute("INSERT INTO orders_fk (order_id, customer_id, order_date) VALUES (10, 1, '2024-01-01')");
      await db.execute("INSERT INTO order_items (item_id, order_id, product) VALUES (1, 10, 'Product X')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=order_items');
    await page.waitForSelector('table tbody tr');

    // Navigate from order_items -> orders_fk
    await page.locator('table tbody tr:first-child td:nth-child(4) button').click(); // order_id FK
    await page.waitForTimeout(1500);
    
    let cardTitle = await page.locator('[data-table-title]').textContent();
    expect(cardTitle).toBe('orders_fk');

    // Navigate from orders_fk -> customers_fk
    await page.locator('table tbody tr:first-child td:nth-child(4) button').click(); // customer_id FK
    await page.waitForTimeout(1500);
    
    cardTitle = await page.locator('[data-table-title]').textContent();
    expect(cardTitle).toBe('customers_fk');

    // Breadcrumb should show full path
    const breadcrumb = page.locator('[data-breadcrumb], nav[aria-label="breadcrumb"], .breadcrumb');
    const breadcrumbText = await breadcrumb.textContent();
    expect(breadcrumbText).toContain('order_items');
    expect(breadcrumbText).toContain('orders_fk');
    expect(breadcrumbText).toContain('customers_fk');
  });
});

test.describe('Foreign Key Navigation - Composite FKs', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/db/browse');
    await page.waitForSelector('#dataBrowser', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
  });

  test('should handle composite foreign keys', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      
      await db.execute('DROP TABLE IF EXISTS student_courses');
      await db.execute('DROP TABLE IF EXISTS courses');
      
      await db.execute(`
        CREATE TABLE courses (
          course_id INTEGER,
          semester TEXT,
          course_name TEXT,
          PRIMARY KEY (course_id, semester)
        )
      `);
      
      await db.execute(`
        CREATE TABLE student_courses (
          student_id INTEGER,
          course_id INTEGER,
          semester TEXT,
          grade TEXT,
          FOREIGN KEY (course_id, semester) REFERENCES courses(course_id, semester)
        )
      `);
      
      await db.execute("INSERT INTO courses (course_id, semester, course_name) VALUES (101, 'Fall2024', 'Math')");
      await db.execute("INSERT INTO student_courses (student_id, course_id, semester, grade) VALUES (1, 101, 'Fall2024', 'A')");
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=student_courses');
    await page.waitForSelector('table tbody tr');

    // Composite FK should be detected and clickable
    // Either as a combined link or individual FK columns marked
    const hasFKIndicator = await page.locator('table thead th').evaluateAll((headers) => {
      return headers.some(h => 
        h.textContent?.includes('course_id') && (
          h.textContent?.includes('→') ||
          h.textContent?.includes('FK') ||
          h.querySelector('[data-fk-indicator]') !== null
        )
      );
    });
    
    expect(hasFKIndicator).toBe(true);
  });
});
