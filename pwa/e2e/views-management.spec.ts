import { test, expect } from '@playwright/test';

test.describe('Views Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Go directly to views page and let it initialize
    await page.goto('/db/views');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Create test tables and views
    await page.evaluate(async () => {
      let retries = 0;
      while (!(window as any).testDb && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        retries++;
      }
      
      const db = (window as any).testDb;
      if (!db) {
        throw new Error('Database not initialized after waiting');
      }
      
      // Create test tables
      try {
        await db.execute(`DROP TABLE IF EXISTS test_users`);
        await db.execute(`DROP TABLE IF EXISTS test_orders`);
        await db.execute(`DROP VIEW IF EXISTS test_user_view`);
        await db.execute(`DROP VIEW IF EXISTS test_active_users`);
      } catch (e) {
        // Items might not exist
      }
      
      await db.execute(`
        CREATE TABLE test_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          active INTEGER DEFAULT 1
        )
      `);
      
      await db.execute(`
        CREATE TABLE test_orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          amount REAL,
          FOREIGN KEY (user_id) REFERENCES test_users(id)
        )
      `);
      
      // Insert test data
      await db.execute(`
        INSERT INTO test_users (name, email, active) 
        VALUES 
          ('John Doe', 'john@example.com', 1),
          ('Jane Smith', 'jane@example.com', 1),
          ('Bob Johnson', 'bob@example.com', 0)
      `);
      
      await db.execute(`
        INSERT INTO test_orders (user_id, amount) 
        VALUES 
          (1, 100.50),
          (1, 200.00),
          (2, 150.75)
      `);
      
      // Create test views
      await db.execute(`
        CREATE VIEW test_user_view AS
        SELECT id, name, email FROM test_users
      `);
      
      await db.execute(`
        CREATE VIEW test_active_users AS
        SELECT * FROM test_users WHERE active = 1
      `);
      
      // Sync to persist changes to IndexedDB
      await db.sync();
    });
    
    // Trigger a manual views reload by calling the page's loadViews function
    await page.evaluate(async () => {
      if ((window as any).loadViews) {
        await (window as any).loadViews();
      }
    });
    
    // Wait for UI to update
    await page.waitForTimeout(500);
  });

  test('should navigate to views page', async ({ page }) => {
    await expect(page).toHaveURL(/\/db\/views/);
  });

  test('should show Views Management heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/views/i);
  });

  test('should list all views', async ({ page }) => {
    // Should see views list (check for card titles, not SQL text)
    await expect(page.locator('[data-slot="card-title"]:has-text("test_user_view")')).toBeVisible();
    await expect(page.locator('[data-slot="card-title"]:has-text("test_active_users")')).toBeVisible();
  });

  test('should show view count', async ({ page }) => {
    // Should see count of views
    const countText = await page.locator('text=/\\d+\\s+view/i').textContent();
    expect(countText).toMatch(/2\s+view/i);
  });

  test('should show Create View button', async ({ page }) => {
    await expect(page.locator('button:has-text("Create View")')).toBeVisible();
  });

  test('should open Create View dialog when button is clicked', async ({ page }) => {
    await page.click('button:has-text("Create View")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('[role="dialog"] >> text=/create.*view/i').first()).toBeVisible();
  });

  test('should have view name input in create dialog', async ({ page }) => {
    await page.click('button:has-text("Create View")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    await expect(page.locator('#viewName')).toBeVisible();
  });

  test('should have SQL editor in create dialog', async ({ page }) => {
    await page.click('button:has-text("Create View")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should have SQL input/textarea
    await expect(page.locator('#viewSQL')).toBeVisible();
  });

  test('should create new view successfully', async ({ page }) => {
    await page.click('button:has-text("Create View")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Fill in view details
    await page.fill('#viewName', 'test_new_view');
    await page.fill('#viewSQL', 'SELECT name, email FROM test_users WHERE active = 1');
    
    // Click create button
    await page.click('#confirmCreateView', { force: true });
    await page.waitForTimeout(1500);
    
    // Verify view was created
    const viewExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`
        SELECT name FROM sqlite_master 
        WHERE type='view' AND name='test_new_view'
      `);
      return result.rows.length > 0;
    });
    expect(viewExists).toBe(true);
  });

  test('should show newly created view in list', async ({ page }) => {
    // Create view
    await page.click('button:has-text("Create View")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.fill('#viewName', 'test_new_view');
    await page.fill('#viewSQL', 'SELECT * FROM test_users');
    await page.click('#confirmCreateView', { force: true });
    await page.waitForTimeout(1500);
    
    // Should see new view in list (check card title specifically)
    await expect(page.locator('[data-slot="card-title"]:has-text("test_new_view")')).toBeVisible();
  });

  test('should update view count after creating view', async ({ page }) => {
    // Create view
    await page.click('button:has-text("Create View")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.fill('#viewName', 'test_new_view');
    await page.fill('#viewSQL', 'SELECT * FROM test_users');
    await page.click('#confirmCreateView', { force: true });
    await page.waitForTimeout(1500);
    
    // Should see updated count (3 views now)
    const countText = await page.locator('text=/\\d+\\s+view/i').textContent();
    expect(countText).toMatch(/3\s+view/i);
  });

  test('should edit existing view successfully', async ({ page }) => {
    const viewCard = page.locator('[data-view-card="test_user_view"]');

    // Ensure initial SQL is rendered
    await expect(viewCard.locator('[data-view-sql]')).toContainText('SELECT id, name, email FROM test_users');

    // Open Edit dialog
    await viewCard.locator('button:has-text("Edit")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);

    // Verify dialog fields are populated
    await expect(page.locator('#editViewName')).toHaveValue('test_user_view');
    await expect(page.locator('#editViewSQL')).toContainText('SELECT id, name, email FROM test_users');

    // Update the SQL definition
    const newSql = 'SELECT name FROM test_users WHERE active = 1 ORDER BY name';
    await page.fill('#editViewSQL', newSql);

    // Save changes
    await page.click('#confirmEditView', { force: true });

    // Wait for dialog to close and list to refresh
    await page.waitForSelector('[role="dialog"]', { state: 'detached' });
    await page.waitForTimeout(1500);

    // Validate SQL definition updated in UI
    await expect(viewCard.locator('[data-view-sql]')).toContainText(newSql);

    // Validate underlying data reflects new definition
    await viewCard.locator('button:has-text("View Data")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await expect(page.locator('[data-view-data-table]')).toContainText('John Doe');
    await expect(page.locator('[data-view-data-table]')).not.toContainText('Bob Johnson');
    await page.click('button:has-text("Close")');
    await page.waitForSelector('[role="dialog"]', { state: 'detached' });
  });

  test('should show error if view name is empty', async ({ page }) => {
    await page.click('button:has-text("Create View")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Try to create without name
    await page.fill('#viewSQL', 'SELECT * FROM test_users');
    await page.click('#confirmCreateView', { force: true });
    await page.waitForTimeout(500);
    
    // Should see error
    const errorDiv = page.locator('.bg-destructive\\/10');
    await expect(errorDiv).toBeVisible();
  });

  test('should show error if SQL is empty', async ({ page }) => {
    await page.click('button:has-text("Create View")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Try to create without SQL
    await page.fill('#viewName', 'test_new_view');
    await page.click('#confirmCreateView', { force: true });
    await page.waitForTimeout(500);
    
    // Should see error
    const errorDiv = page.locator('.bg-destructive\\/10');
    await expect(errorDiv).toBeVisible();
  });

  test('should show error if view name already exists', async ({ page }) => {
    await page.click('button:has-text("Create View")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Try to create with existing name
    await page.fill('#viewName', 'test_user_view');
    await page.fill('#viewSQL', 'SELECT * FROM test_users');
    await page.click('#confirmCreateView', { force: true });
    await page.waitForTimeout(1000);
    
    // Should see error
    const errorDiv = page.locator('.bg-destructive\\/10');
    await expect(errorDiv).toBeVisible();
  });

  test('should show error if SQL is invalid', async ({ page }) => {
    await page.click('button:has-text("Create View")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Try to create with invalid SQL
    await page.fill('#viewName', 'test_invalid_view');
    await page.fill('#viewSQL', 'INVALID SQL SYNTAX HERE');
    await page.click('#confirmCreateView', { force: true });
    await page.waitForTimeout(1000);
    
    // Should see error
    const errorDiv = page.locator('.bg-destructive\\/10');
    await expect(errorDiv).toBeVisible();
  });

  test('should close create dialog when Cancel is clicked', async ({ page }) => {
    await page.click('button:has-text("Create View")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(500);
    
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should show Drop button for each view', async ({ page }) => {
    // Should see drop buttons
    const dropButtons = page.locator('button').filter({ hasText: /drop|delete/i });
    const count = await dropButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should open drop confirmation dialog', async ({ page }) => {
    // Find first drop button and click it
    const firstDropButton = page.locator('button').filter({ hasText: /drop|delete/i }).first();
    await firstDropButton.click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('[role="dialog"] >> text=/drop.*view/i').first()).toBeVisible();
  });

  test('should show view name in drop confirmation', async ({ page }) => {
    const firstDropButton = page.locator('button').filter({ hasText: /drop|delete/i }).first();
    await firstDropButton.click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should show a view name in the dialog
    const dialogText = await page.locator('[role="dialog"]').textContent();
    expect(dialogText).toMatch(/test_user_view|test_active_users/i);
  });

  test('should drop view successfully', async ({ page }) => {
    // Click drop on first view
    const firstDropButton = page.locator('button').filter({ hasText: /drop|delete/i }).first();
    await firstDropButton.click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Confirm drop
    await page.click('#confirmDropView', { force: true });
    await page.waitForTimeout(1500);
    
    // Verify one view was dropped (should have 1 view now)
    const viewCount = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute(`
        SELECT COUNT(*) as count FROM sqlite_master WHERE type='view'
      `);
      return result.rows[0].values[0].value;
    });
    expect(viewCount).toBe(1);
  });

  test('should remove dropped view from list', async ({ page }) => {
    // Get the name of the first view
    const firstViewText = await page.locator('text=/test_user_view|test_active_users/').first().textContent();
    
    // Drop it
    const firstDropButton = page.locator('button').filter({ hasText: /drop|delete/i }).first();
    await firstDropButton.click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('#confirmDropView', { force: true });
    await page.waitForTimeout(1500);
    
    // Should not see the dropped view (may still see the other one)
    const countAfter = await page.locator(`text=${firstViewText}`).count();
    expect(countAfter).toBe(0);
  });

  test('should update view count after dropping', async ({ page }) => {
    // Drop a view
    const firstDropButton = page.locator('button').filter({ hasText: /drop|delete/i }).first();
    await firstDropButton.click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.click('#confirmDropView', { force: true });
    await page.waitForTimeout(1500);
    
    // Should see updated count (1 view)
    const countText = await page.locator('text=/\\d+\\s+view/i').textContent();
    expect(countText).toMatch(/1\s+view/i);
  });

  test('should show View Data button for each view', async ({ page }) => {
    // Should see view data buttons
    const viewDataButtons = page.locator('button').filter({ hasText: /view.*data|query/i });
    const count = await viewDataButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should show view data when View Data clicked', async ({ page }) => {
    // Click View Data on first view
    const firstViewDataButton = page.locator('button').filter({ hasText: /view.*data|query/i }).first();
    await firstViewDataButton.click();
    await page.waitForTimeout(1000);
    
    // Should show data (could be in dialog or expanded section)
    // Data from test_user_view or test_active_users should appear
    await expect(page.locator('text=/John Doe|Jane Smith/').first()).toBeVisible();
  });

  test('should show view SQL definition', async ({ page }) => {
    // Should show SQL definition for views
    // This might be in a tooltip, expanded section, or always visible
    const sqlPattern = /SELECT.*FROM.*test_users/i;
    const hasSql = await page.locator(`text=${sqlPattern}`).count();
    expect(hasSql).toBeGreaterThanOrEqual(1);
  });

  test('should handle empty views list gracefully', async ({ page }) => {
    // Drop all views
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute(`DROP VIEW IF EXISTS test_user_view`);
      await db.execute(`DROP VIEW IF EXISTS test_active_users`);
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Should show appropriate message
    await expect(page.locator('text="No views found. Create one to get started."')).toBeVisible();
  });
});
