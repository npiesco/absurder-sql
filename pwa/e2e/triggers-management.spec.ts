import { test, expect } from '@playwright/test';

test.describe('Triggers Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Go directly to triggers page and let it initialize
    await page.goto('/db/triggers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Create test tables and triggers
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
        await db.execute(`DROP TRIGGER IF EXISTS test_audit_trigger`);
        await db.execute(`DROP TRIGGER IF EXISTS test_update_timestamp`);
        await db.execute(`DROP TABLE IF EXISTS test_audit_log`);
        await db.execute(`DROP TABLE IF EXISTS test_products`);
      } catch (e) {
        // Items might not exist
      }
      
      await db.execute(`
        CREATE TABLE test_products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price REAL,
          updated_at INTEGER DEFAULT 0
        )
      `);
      
      await db.execute(`
        CREATE TABLE test_audit_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          action TEXT,
          table_name TEXT,
          record_id INTEGER,
          timestamp INTEGER
        )
      `);
      
      // Insert test data
      await db.execute(`
        INSERT INTO test_products (name, price) 
        VALUES 
          ('Product A', 10.99),
          ('Product B', 20.50)
      `);
      
      // Create test triggers
      await db.execute(`
        CREATE TRIGGER test_audit_trigger
        AFTER INSERT ON test_products
        BEGIN
          INSERT INTO test_audit_log (action, table_name, record_id, timestamp)
          VALUES ('INSERT', 'test_products', NEW.id, strftime('%s', 'now'));
        END
      `);
      
      await db.execute(`
        CREATE TRIGGER test_update_timestamp
        BEFORE UPDATE ON test_products
        BEGIN
          UPDATE test_products SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
        END
      `);
      
      // Sync to persist changes to IndexedDB
      await db.sync();
    });
    
    // Trigger a manual triggers and tables reload by calling the page's functions
    await page.evaluate(async () => {
      if ((window as any).loadTriggers) {
        await (window as any).loadTriggers();
      }
      if ((window as any).loadTables) {
        await (window as any).loadTables();
      }
    });

    // Wait for UI to update
    await page.waitForTimeout(500);
  });

  test('should navigate to triggers page', async ({ page }) => {
    await expect(page).toHaveURL(/\/db\/triggers/);
  });

  test('should show Triggers Management heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/triggers/i);
  });

  test('should list all triggers', async ({ page }) => {
    // Should see triggers list (check for card titles)
    await expect(page.locator('[data-slot="card-title"]:has-text("test_audit_trigger")')).toBeVisible();
    await expect(page.locator('[data-slot="card-title"]:has-text("test_update_timestamp")')).toBeVisible();
  });

  test('should show trigger count', async ({ page }) => {
    // Should see count of triggers
    const countText = await page.locator('text=/\\d+\\s+trigger/i').textContent();
    expect(countText).toMatch(/2\s+trigger/i);
  });

  test('should show trigger details including timing and event', async ({ page }) => {
    const triggerCard = page.locator('[data-trigger-card="test_audit_trigger"]');
    
    // Should show AFTER INSERT details
    await expect(triggerCard).toContainText('AFTER');
    await expect(triggerCard).toContainText('INSERT');
    await expect(triggerCard).toContainText('test_products');
  });

  test('should show Create Trigger button', async ({ page }) => {
    await expect(page.locator('button:has-text("Create Trigger")')).toBeVisible();
  });

  test('should open Create Trigger dialog when button is clicked', async ({ page }) => {
    await page.click('button:has-text("Create Trigger")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('[role="dialog"] >> text=/create.*trigger/i').first()).toBeVisible();
  });

  test('should have trigger name input in create dialog', async ({ page }) => {
    await page.click('button:has-text("Create Trigger")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    await expect(page.locator('#triggerName')).toBeVisible();
  });

  test('should have timing selector in create dialog', async ({ page }) => {
    await page.click('button:has-text("Create Trigger")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should have BEFORE/AFTER selector
    await expect(page.locator('#triggerTiming')).toBeVisible();
  });

  test('should have event selector in create dialog', async ({ page }) => {
    await page.click('button:has-text("Create Trigger")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should have INSERT/UPDATE/DELETE selector
    await expect(page.locator('#triggerEvent')).toBeVisible();
  });

  test('should have table selector in create dialog', async ({ page }) => {
    await page.click('button:has-text("Create Trigger")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should have table selector
    await expect(page.locator('#triggerTable')).toBeVisible();
  });

  test('should have SQL body editor in create dialog', async ({ page }) => {
    await page.click('button:has-text("Create Trigger")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Should have SQL textarea
    await expect(page.locator('#triggerBody')).toBeVisible();
  });

  test('should create new trigger successfully', async ({ page }) => {
    await page.click('button:has-text("Create Trigger")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Wait for table options to load (check that the select has our table as an option)
    await page.waitForFunction(
      () => {
        const select = document.querySelector('#triggerTable') as HTMLSelectElement;
        return select && Array.from(select.options).some(opt => opt.value === 'test_products');
      },
      { timeout: 5000 }
    );
    
    // Fill in trigger details
    await page.fill('#triggerName', 'test_new_trigger');
    await page.selectOption('#triggerTiming', 'AFTER');
    await page.selectOption('#triggerEvent', 'DELETE');
    await page.selectOption('#triggerTable', 'test_products');
    await page.fill('#triggerBody', 'DELETE FROM test_audit_log WHERE record_id = OLD.id;');
    
    await page.click('#confirmCreateTrigger', { force: true });
    await page.waitForTimeout(1500);
    
    // Should see success (no error message)
    await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible();
  });

  test('should show newly created trigger in list', async ({ page }) => {
    // Create trigger
    await page.click('button:has-text("Create Trigger")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.waitForFunction(
      () => {
        const select = document.querySelector('#triggerTable') as HTMLSelectElement;
        return select && Array.from(select.options).some(opt => opt.value === 'test_products');
      },
      { timeout: 5000 }
    );
    await page.fill('#triggerName', 'test_new_trigger');
    await page.selectOption('#triggerTiming', 'AFTER');
    await page.selectOption('#triggerEvent', 'DELETE');
    await page.selectOption('#triggerTable', 'test_products');
    await page.fill('#triggerBody', 'SELECT 1;');
    await page.click('#confirmCreateTrigger', { force: true });
    await page.waitForTimeout(1500);
    
    // Should see new trigger in list (check card title specifically)
    await expect(page.locator('[data-slot="card-title"]:has-text("test_new_trigger")')).toBeVisible();
  });

  test('should update trigger count after creating trigger', async ({ page }) => {
    // Create trigger
    await page.click('button:has-text("Create Trigger")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.waitForFunction(
      () => {
        const select = document.querySelector('#triggerTable') as HTMLSelectElement;
        return select && Array.from(select.options).some(opt => opt.value === 'test_products');
      },
      { timeout: 5000 }
    );
    await page.fill('#triggerName', 'test_new_trigger');
    await page.selectOption('#triggerTiming', 'AFTER');
    await page.selectOption('#triggerEvent', 'DELETE');
    await page.selectOption('#triggerTable', 'test_products');
    await page.fill('#triggerBody', 'SELECT 1;');
    await page.click('#confirmCreateTrigger', { force: true });
    await page.waitForTimeout(1500);
    
    // Should see updated count (3 triggers now)
    const countText = await page.locator('text=/\\d+\\s+trigger/i').textContent();
    expect(countText).toMatch(/3\s+trigger/i);
  });

  test('should edit existing trigger successfully', async ({ page }) => {
    const triggerCard = page.locator('[data-trigger-card="test_audit_trigger"]');

    // Open Edit dialog
    await triggerCard.locator('button:has-text("Edit")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);

    // Verify dialog fields are populated
    await expect(page.locator('#editTriggerName')).toHaveValue('test_audit_trigger');
    
    // Update the trigger body
    const newBody = 'INSERT INTO test_audit_log (action, table_name, record_id, timestamp)\n  VALUES (\'INSERT_MODIFIED\', \'test_products\', NEW.id, strftime(\'%s\', \'now\'));';
    await page.fill('#editTriggerBody', newBody);

    // Save changes
    await page.click('#confirmEditTrigger', { force: true });

    // Wait for dialog to close and list to refresh
    await page.waitForSelector('[role="dialog"]', { state: 'detached' });
    await page.waitForTimeout(1500);

    // Validate SQL body updated in UI
    await expect(triggerCard.locator('[data-trigger-sql]')).toContainText('INSERT_MODIFIED');
  });

  test('should show error if trigger name is empty', async ({ page }) => {
    await page.click('button:has-text("Create Trigger")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.waitForFunction(
      () => {
        const select = document.querySelector('#triggerTable') as HTMLSelectElement;
        return select && Array.from(select.options).some(opt => opt.value === 'test_products');
      },
      { timeout: 5000 }
    );
    
    // Try to create without name
    await page.selectOption('#triggerTable', 'test_products');
    await page.fill('#triggerBody', 'SELECT 1;');
    await page.click('#confirmCreateTrigger', { force: true });
    await page.waitForTimeout(500);
    
    // Should see error in dialog
    await expect(page.locator('[data-testid="dialog-error-message"]')).toBeVisible();
  });

  test('should show error if table is not selected', async ({ page }) => {
    await page.click('button:has-text("Create Trigger")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Try to create without table
    await page.fill('#triggerName', 'test_trigger');
    await page.fill('#triggerBody', 'SELECT 1;');
    await page.click('#confirmCreateTrigger', { force: true });
    await page.waitForTimeout(500);
    
    // Should see error in dialog
    await expect(page.locator('[data-testid="dialog-error-message"]')).toBeVisible();
  });

  test('should show error if trigger body is empty', async ({ page }) => {
    await page.click('button:has-text("Create Trigger")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.waitForFunction(
      () => {
        const select = document.querySelector('#triggerTable') as HTMLSelectElement;
        return select && Array.from(select.options).some(opt => opt.value === 'test_products');
      },
      { timeout: 5000 }
    );
    
    // Try to create without body
    await page.fill('#triggerName', 'test_trigger');
    await page.selectOption('#triggerTable', 'test_products');
    await page.click('#confirmCreateTrigger', { force: true });
    await page.waitForTimeout(500);
    
    // Should see error in dialog
    await expect(page.locator('[data-testid="dialog-error-message"]')).toBeVisible();
  });

  test('should show error if trigger name already exists', async ({ page }) => {
    await page.click('button:has-text("Create Trigger")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.waitForFunction(
      () => {
        const select = document.querySelector('#triggerTable') as HTMLSelectElement;
        return select && Array.from(select.options).some(opt => opt.value === 'test_products');
      },
      { timeout: 5000 }
    );
    
    // Try to create with existing name
    await page.fill('#triggerName', 'test_audit_trigger');
    await page.selectOption('#triggerTable', 'test_products');
    await page.fill('#triggerBody', 'SELECT 1;');
    await page.click('#confirmCreateTrigger', { force: true });
    await page.waitForTimeout(500);
    
    // Should see error in dialog
    await expect(page.locator('[data-testid="dialog-error-message"]')).toBeVisible();
  });

  test('should show error if SQL is invalid', async ({ page }) => {
    await page.click('button:has-text("Create Trigger")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.waitForFunction(
      () => {
        const select = document.querySelector('#triggerTable') as HTMLSelectElement;
        return select && Array.from(select.options).some(opt => opt.value === 'test_products');
      },
      { timeout: 5000 }
    );
    
    // Try to create with invalid SQL
    await page.fill('#triggerName', 'test_bad_trigger');
    await page.selectOption('#triggerTable', 'test_products');
    await page.fill('#triggerBody', 'INVALID SQL HERE');
    await page.click('#confirmCreateTrigger', { force: true });
    await page.waitForTimeout(500);
    
    // Should see error in dialog
    await expect(page.locator('[data-testid="dialog-error-message"]')).toBeVisible();
  });

  test('should close create dialog when Cancel is clicked', async ({ page }) => {
    await page.click('button:has-text("Create Trigger")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Cancel")');
    await page.waitForSelector('[role="dialog"]', { state: 'detached' });
    
    // Dialog should be closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should show Drop button for each trigger', async ({ page }) => {
    const triggerCard = page.locator('[data-trigger-card="test_audit_trigger"]');
    await expect(triggerCard.locator('button:has-text("Drop")')).toBeVisible();
  });

  test('should open drop confirmation dialog', async ({ page }) => {
    const triggerCard = page.locator('[data-trigger-card="test_audit_trigger"]');
    await triggerCard.locator('button:has-text("Drop")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('[role="dialog"] >> text=/drop.*trigger/i').first()).toBeVisible();
  });

  test('should show trigger name in drop confirmation', async ({ page }) => {
    const triggerCard = page.locator('[data-trigger-card="test_audit_trigger"]');
    await triggerCard.locator('button:has-text("Drop")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    await expect(page.locator('[role="dialog"]')).toContainText('test_audit_trigger');
  });

  test('should drop trigger successfully', async ({ page }) => {
    const triggerCard = page.locator('[data-trigger-card="test_audit_trigger"]');
    await triggerCard.locator('button:has-text("Drop")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Confirm drop
    await page.click('button:has-text("Drop Trigger")');
    await page.waitForTimeout(1500);
    
    // Should not see error
    await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible();
  });

  test('should remove dropped trigger from list', async ({ page }) => {
    const triggerCard = page.locator('[data-trigger-card="test_audit_trigger"]');
    await triggerCard.locator('button:has-text("Drop")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Confirm drop
    await page.click('button:has-text("Drop Trigger")');
    await page.waitForTimeout(1500);
    
    // Trigger should be removed from list
    await expect(page.locator('[data-slot="card-title"]:has-text("test_audit_trigger")')).not.toBeVisible();
  });

  test('should update trigger count after dropping', async ({ page }) => {
    const triggerCard = page.locator('[data-trigger-card="test_audit_trigger"]');
    await triggerCard.locator('button:has-text("Drop")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    
    // Confirm drop
    await page.click('button:has-text("Drop Trigger")');
    await page.waitForTimeout(1500);
    
    // Should see updated count (1 trigger now)
    const countText = await page.locator('text=/\\d+\\s+trigger/i').textContent();
    expect(countText).toMatch(/1\s+trigger/i);
  });

  test('should show trigger SQL definition', async ({ page }) => {
    const triggerCard = page.locator('[data-trigger-card="test_audit_trigger"]');
    const sqlDisplay = triggerCard.locator('[data-trigger-sql]');
    
    // Should show SQL definition
    await expect(sqlDisplay).toBeVisible();
    await expect(sqlDisplay).toContainText('INSERT INTO test_audit_log');
  });

  test('should handle empty triggers list gracefully', async ({ page }) => {
    // Drop all triggers
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute(`DROP TRIGGER IF EXISTS test_audit_trigger`);
      await db.execute(`DROP TRIGGER IF EXISTS test_update_timestamp`);
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Should show appropriate message
    await expect(page.locator('text="No triggers found. Create one to get started."')).toBeVisible();
  });
});
