import { test, expect } from '@playwright/test';

test.describe('EXPLAIN Query Plan E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Go to query page and initialize database
    await page.goto('/db/query');
    await page.waitForSelector('#queryInterface', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });

    // Create database programmatically
    await page.evaluate(async () => {
      const Database = (window as any).Database;
      const testDb = await Database.newDatabase('test-db');
      (window as any).testDb = testDb;
      // Notify useDatabase hook that testDb is ready
      window.dispatchEvent(new Event('testdb-ready'));
    });

    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });

    // Initialize database with test data
    await page.evaluate(async () => {
      const db = (window as any).testDb;

      // Create test tables with indexes
      await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          age INTEGER
        )
      `);

      await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
      `);

      await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_users_age ON users(age)
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY,
          user_id INTEGER,
          amount REAL,
          created_at TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)
      `);

      // Insert test data in batches
      const userValues = [];
      for (let i = 1; i <= 100; i++) {
        userValues.push(`('User${i}', 'user${i}@test.com', ${20 + (i % 50)})`);
      }
      await db.execute(`INSERT INTO users (name, email, age) VALUES ${userValues.join(', ')}`);

      const orderValues = [];
      for (let i = 1; i <= 200; i++) {
        orderValues.push(`(${(i % 100) + 1}, ${Math.random() * 1000}, '2024-01-${(i % 28) + 1}')`);
      }
      await db.execute(`INSERT INTO orders (user_id, amount, created_at) VALUES ${orderValues.join(', ')}`);

      // Sync to persist changes
      if (db.sync) {
        await db.sync();
      }
    });
  });

  test('should show Explain Plan button in query editor', async ({ page }) => {
    await expect(page.locator('button:has-text("Explain Plan")')).toBeVisible();
  });

  test('should execute EXPLAIN QUERY PLAN for simple SELECT', async ({ page }) => {
    const query = 'SELECT * FROM users WHERE id = 1';
    await page.fill('.cm-content', query);
    
    // Click Explain Plan button
    await page.click('button:has-text("Explain Plan")');

    // Should show query plan panel
    await expect(page.locator('#explainPlanPanel')).toBeVisible();
    await expect(page.locator('text=Query Execution Plan')).toBeVisible();
  });

  test('should show table scan for query without index', async ({ page }) => {
    const query = 'SELECT * FROM users WHERE name = "User1"';
    await page.fill('.cm-content', query);
    
    await page.click('button:has-text("Explain Plan")');

    // Should show SCAN operation
    const planPanel = page.locator('#explainPlanPanel');
    const planTree = planPanel.locator('#planTree');
    await expect(planTree.locator('.plan-node').first()).toBeVisible();
    const firstNodeText = await planTree.locator('.plan-node').first().textContent();
    expect(firstNodeText).toContain('SCAN');
  });

  test('should show index usage when indexed column is queried', async ({ page }) => {
    const query = 'SELECT * FROM users WHERE email = "user1@test.com"';
    await page.fill('.cm-content', query);
    
    await page.click('button:has-text("Explain Plan")');

    // Should show index usage (either explicit or auto-generated from UNIQUE constraint)
    const planPanel = page.locator('#explainPlanPanel');
    const planTree = planPanel.locator('#planTree');
    const firstNodeText = await planTree.locator('.plan-node').first().textContent();
    expect(firstNodeText).toContain('INDEX');
    expect(firstNodeText).toContain('email');
  });

  test('should show query plan for JOIN operation', async ({ page }) => {
    const query = `
      SELECT u.name, o.amount 
      FROM users u 
      JOIN orders o ON u.id = o.user_id 
      WHERE u.age > 30
    `;
    await page.fill('.cm-content', query);
    
    await page.click('button:has-text("Explain Plan")');

    const planPanel = page.locator('#explainPlanPanel');
    await expect(planPanel).toBeVisible();
    // Should show both tables in plan
    const planTree = planPanel.locator('#planTree');
    const allNodesText = await planTree.textContent();
    expect(allNodesText).toContain('users');
    expect(allNodesText).toContain('orders');
  });

  test('should visualize query plan as tree structure', async ({ page }) => {
    const query = 'SELECT * FROM users WHERE age > 30 ORDER BY name';
    await page.fill('.cm-content', query);
    
    await page.click('button:has-text("Explain Plan")');

    // Should show tree structure
    const planTree = page.locator('#planTree');
    await expect(planTree).toBeVisible();
    
    // Should have plan nodes
    await expect(page.locator('.plan-node').first()).toBeVisible();
  });

  test('should highlight table scans with warning', async ({ page }) => {
    const query = 'SELECT * FROM users WHERE name LIKE "%User%"';
    await page.fill('.cm-content', query);
    
    await page.click('button:has-text("Explain Plan")');

    // Table scan should have warning indicator
    const planPanel = page.locator('#explainPlanPanel');
    await expect(planPanel.locator('.plan-warning, .text-orange-500, .text-yellow-600')).toBeVisible();
  });

  test('should show optimization hints for inefficient queries', async ({ page }) => {
    const query = 'SELECT * FROM orders WHERE created_at > "2024-01-01"';
    await page.fill('.cm-content', query);
    
    await page.click('button:has-text("Explain Plan")');

    // Should show hints section
    const hintsSection = page.locator('#optimizationHints');
    await expect(hintsSection).toBeVisible();
  });

  test('should close query plan panel', async ({ page }) => {
    const query = 'SELECT * FROM users LIMIT 10';
    await page.fill('.cm-content', query);
    
    await page.click('button:has-text("Explain Plan")');

    const planPanel = page.locator('#explainPlanPanel');
    await expect(planPanel).toBeVisible();

    // Close the panel
    await page.click('#explainPlanPanel button:has-text("Close"), #explainPlanPanel .close-button');

    await expect(planPanel).not.toBeVisible();
  });

  test('should show estimated rows in query plan', async ({ page }) => {
    const query = 'SELECT * FROM users WHERE age > 50';
    await page.fill('.cm-content', query);
    
    await page.click('button:has-text("Explain Plan")');

    const planPanel = page.locator('#explainPlanPanel');
    // Should show some estimation info
    await expect(planPanel).toBeVisible();
  });

  test('should handle complex queries with subqueries', async ({ page }) => {
    const query = `
      SELECT * FROM users 
      WHERE id IN (
        SELECT user_id FROM orders WHERE amount > 500
      )
    `;
    await page.fill('.cm-content', query);
    
    await page.click('button:has-text("Explain Plan")');

    const planPanel = page.locator('#explainPlanPanel');
    await expect(planPanel).toBeVisible();
  });

  test('should show different plan for aggregate queries', async ({ page }) => {
    const query = 'SELECT age, COUNT(*) as count FROM users GROUP BY age HAVING count > 5';
    await page.fill('.cm-content', query);
    
    await page.click('button:has-text("Explain Plan")');

    const planPanel = page.locator('#explainPlanPanel');
    await expect(planPanel).toBeVisible();
    // Should show plan details
    const planTree = planPanel.locator('#planTree');
    await expect(planTree).toBeVisible();
  });

  test('should handle invalid SQL gracefully', async ({ page }) => {
    const query = 'SELECT * FROM nonexistent_table';
    await page.fill('.cm-content', query);
    
    await page.click('button:has-text("Explain Plan")');

    // Should show error message
    await expect(page.locator('text=Error').first()).toBeVisible();
    const errorText = await page.locator('#explainPlanPanel').textContent();
    expect(errorText).toContain('no such table');
  });

  test('should update plan when query changes', async ({ page }) => {
    // First query
    await page.fill('.cm-content', 'SELECT * FROM users WHERE id = 1');
    await page.click('button:has-text("Explain Plan")');

    let planPanel = page.locator('#explainPlanPanel');
    await expect(planPanel).toBeVisible();

    // Change query
    await page.fill('.cm-content', 'SELECT * FROM orders WHERE user_id = 1');
    await page.click('button:has-text("Explain Plan")');

    // Plan should update to show orders table
    const planTree = planPanel.locator('#planTree');
    const treeText = await planTree.textContent();
    expect(treeText).toContain('orders');
  });

  test('should toggle between explain plan and normal execution', async ({ page }) => {
    const query = 'SELECT COUNT(*) FROM users';
    await page.fill('.cm-content', query);
    
    // Execute normally first
    await page.click('#executeButton');
    await expect(page.locator('text=Results')).toBeVisible();

    // Then show explain plan
    await page.click('button:has-text("Explain Plan")');
    await expect(page.locator('#explainPlanPanel')).toBeVisible();

    // Execute again normally
    await page.click('#executeButton');
    await expect(page.locator('text=Results')).toBeVisible();
  });
});
