import { test, expect } from '@playwright/test';

test.describe('Query Formatter E2E', () => {
  // Unique database name per test run to avoid parallel test conflicts
  const testDbName = `query-formatter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.db`;

  test.beforeEach(async ({ page }) => {
    // Navigate to query page
    await page.goto('/db/query');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#queryInterface', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });

    // Create database programmatically since /db/query doesn't auto-create one
    await page.evaluate(async (dbName) => {
      const Database = (window as any).Database;
      const testDb = await Database.newDatabase(dbName);
      (window as any).testDb = testDb;
      (window as any).testDbName = dbName;
    }, testDbName);

    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      const dbName = (window as any).testDbName;
      if (db) { try { await db.close(); } catch {} }
      if (dbName) { try { await indexedDB.deleteDatabase(dbName); } catch {} }
    }).catch(() => {});
  });

  test('should show Format Query button', async ({ page }) => {
    const formatButton = page.locator('#formatButton, button:has-text("Format")').first();
    await expect(formatButton).toBeVisible({ timeout: 10000 });
  });

  test('should format unformatted SQL query', async ({ page }) => {
    // Enter messy SQL
    const messySQL = 'select * from users where id=1 and name="test"';

    // Type into CodeMirror
    const editor = page.locator('.cm-content').first();
    await editor.click();
    await editor.fill(messySQL);

    // Click Format button
    const formatButton = page.locator('#formatButton, button:has-text("Format")').first();
    await formatButton.click();

    // Wait for formatting to apply
    await page.waitForFunction(() => {
      const content = document.querySelector('.cm-content')?.textContent || '';
      return content.includes('SELECT') || content.includes('FROM');
    }, { timeout: 5000 });

    // Check that SQL is now formatted (keywords should be uppercase, properly indented)
    const formattedContent = await editor.textContent();
    expect(formattedContent).toContain('SELECT');
    expect(formattedContent).toContain('FROM');
    expect(formattedContent).toContain('WHERE');
  });

  test('should format complex SQL with multiple clauses', async ({ page }) => {
    const messySQL = 'select u.id,u.name,o.total from users u join orders o on u.id=o.user_id where u.active=1 order by o.total desc';

    const editor = page.locator('.cm-content').first();
    await editor.click();
    await editor.fill(messySQL);

    const formatButton = page.locator('#formatButton, button:has-text("Format")').first();
    await formatButton.click();

    // Wait for formatting to apply
    await page.waitForFunction(() => {
      const content = document.querySelector('.cm-content')?.textContent || '';
      return content.includes('SELECT') && content.includes('JOIN');
    }, { timeout: 5000 });

    const formattedContent = await editor.textContent();
    expect(formattedContent).toContain('SELECT');
    expect(formattedContent).toContain('FROM');
    expect(formattedContent).toContain('JOIN');
    expect(formattedContent).toContain('WHERE');
    expect(formattedContent).toContain('ORDER BY');
  });

  test('should format SQL with subqueries', async ({ page }) => {
    const messySQL = 'select * from users where id in (select user_id from orders where total > 100)';

    const editor = page.locator('.cm-content').first();
    await editor.click();
    await editor.fill(messySQL);

    const formatButton = page.locator('#formatButton, button:has-text("Format")').first();
    await formatButton.click();

    // Wait for formatting to apply
    await page.waitForFunction(() => {
      const content = document.querySelector('.cm-content')?.textContent || '';
      return content.includes('SELECT') && content.includes('IN');
    }, { timeout: 5000 });

    const formattedContent = await editor.textContent();
    expect(formattedContent).toContain('SELECT');
    expect(formattedContent).toContain('WHERE');
    expect(formattedContent).toContain('IN');
  });

  test('should handle empty query gracefully', async ({ page }) => {
    const editor = page.locator('.cm-content').first();
    await editor.click();

    // Format button should be disabled when query is empty
    const formatButton = page.locator('#formatButton, button:has-text("Format")').first();
    await expect(formatButton).toBeDisabled();

    // Content should be empty
    const content = await editor.textContent();
    expect(content).toBe('');
  });

  test('should handle invalid SQL gracefully', async ({ page }) => {
    const invalidSQL = 'THIS IS NOT VALID SQL AT ALL;;;';

    const editor = page.locator('.cm-content').first();
    await editor.click();
    await editor.fill(invalidSQL);

    // Format should still work (formatter is lenient)
    const formatButton = page.locator('#formatButton, button:has-text("Format")').first();
    await formatButton.click();

    // Wait for any formatting attempt
    await page.waitForFunction(() => {
      const content = document.querySelector('.cm-content')?.textContent || '';
      return content.length > 0;
    }, { timeout: 5000 });

    // Should not crash - formatter will do best effort
    const content = await editor.textContent();
    expect(content || '').toBeTruthy();
  });

  test('should preserve query functionality after formatting', async ({ page }) => {
    // Create a test database first
    await page.goto('/db');
    await page.waitForLoadState('networkidle');

    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput', { timeout: 5000 });
    await page.fill('#dbNameInput', 'test-formatter.db');
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, 'test-formatter.db', { timeout: 15000 });

    // Create a test table
    await page.goto('/db/query');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.cm-editor', { state: 'visible' });

    const createTableSQL = 'create table test (id integer, name text)';
    let editor = page.locator('.cm-content').first();
    await editor.click();
    await editor.fill(createTableSQL);

    // Format the query
    let formatButton = page.locator('#formatButton, button:has-text("Format")').first();
    await formatButton.click();

    // Wait for formatting
    await page.waitForFunction(() => {
      const content = document.querySelector('.cm-content')?.textContent || '';
      return content.includes('CREATE') || content.includes('create');
    }, { timeout: 5000 });

    // Execute the formatted query
    const executeButton = page.locator('#executeButton').first();
    await executeButton.click();

    // Wait for execution to complete (CREATE TABLE may show success message instead of results table)
    await page.waitForFunction(() => {
      const resultsTable = document.getElementById('resultsTable');
      const errorIndicator = document.querySelector('.bg-destructive\\/10, [role="alert"]');
      const successText = document.body.textContent?.toLowerCase().includes('success') ||
                          document.body.textContent?.toLowerCase().includes('0 rows') ||
                          document.body.textContent?.toLowerCase().includes('query executed');
      return resultsTable || errorIndicator || successText;
    }, { timeout: 10000 });

    // Now insert data with messy SQL
    const insertSQL = 'insert into test values(1,"Alice")';
    editor = page.locator('.cm-content').first();
    await editor.click();
    await editor.fill(insertSQL);

    // Format and execute
    formatButton = page.locator('#formatButton, button:has-text("Format")').first();
    await formatButton.click();

    // Wait for formatting
    await page.waitForFunction(() => {
      const content = document.querySelector('.cm-content')?.textContent || '';
      return content.includes('INSERT') || content.includes('insert');
    }, { timeout: 5000 });

    await executeButton.click();

    // Wait for execution (INSERT may show affected rows message instead of results table)
    await page.waitForFunction(() => {
      const resultsTable = document.getElementById('resultsTable');
      const errorIndicator = document.querySelector('.bg-destructive\\/10, [role="alert"]');
      const successText = document.body.textContent?.toLowerCase().includes('success') ||
                          document.body.textContent?.toLowerCase().includes('row') ||
                          document.body.textContent?.toLowerCase().includes('affected') ||
                          document.body.textContent?.toLowerCase().includes('query executed');
      return resultsTable || errorIndicator || successText;
    }, { timeout: 10000 });

    // Query the data
    const selectSQL = 'select * from test';
    editor = page.locator('.cm-content').first();
    await editor.click();
    await editor.fill(selectSQL);

    formatButton = page.locator('#formatButton, button:has-text("Format")').first();
    await formatButton.click();

    // Wait for formatting
    await page.waitForFunction(() => {
      const content = document.querySelector('.cm-content')?.textContent || '';
      return content.includes('SELECT') || content.includes('select');
    }, { timeout: 5000 });

    await executeButton.click();

    // Should show results - look for the table with results
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Alice').first()).toBeVisible();
  });

  test('should format CREATE TABLE statements', async ({ page }) => {
    const messySQL = 'create table users(id integer primary key,name text not null,email text unique)';

    const editor = page.locator('.cm-content').first();
    await editor.click();
    await editor.fill(messySQL);

    const formatButton = page.locator('#formatButton, button:has-text("Format")').first();
    await formatButton.click();

    // Wait for formatting
    await page.waitForFunction(() => {
      const content = document.querySelector('.cm-content')?.textContent || '';
      return content.includes('CREATE') || content.includes('TABLE');
    }, { timeout: 5000 });

    const formattedContent = await editor.textContent();
    expect(formattedContent).toContain('CREATE');
    expect(formattedContent).toContain('TABLE');
  });

  test('should format UPDATE statements', async ({ page }) => {
    const messySQL = 'update users set name="John",email="john@example.com" where id=1';

    const editor = page.locator('.cm-content').first();
    await editor.click();
    await editor.fill(messySQL);

    const formatButton = page.locator('#formatButton, button:has-text("Format")').first();
    await formatButton.click();

    // Wait for formatting
    await page.waitForFunction(() => {
      const content = document.querySelector('.cm-content')?.textContent || '';
      return content.includes('UPDATE') || content.includes('SET');
    }, { timeout: 5000 });

    const formattedContent = await editor.textContent();
    expect(formattedContent).toContain('UPDATE');
    expect(formattedContent).toContain('SET');
    expect(formattedContent).toContain('WHERE');
  });

  test('should format DELETE statements', async ({ page }) => {
    const messySQL = 'delete from users where id=1 and status="inactive"';

    const editor = page.locator('.cm-content').first();
    await editor.click();
    await editor.fill(messySQL);

    const formatButton = page.locator('#formatButton, button:has-text("Format")').first();
    await formatButton.click();

    // Wait for formatting
    await page.waitForFunction(() => {
      const content = document.querySelector('.cm-content')?.textContent || '';
      return content.includes('DELETE') || content.includes('FROM');
    }, { timeout: 5000 });

    const formattedContent = await editor.textContent();
    expect(formattedContent).toContain('DELETE');
    expect(formattedContent).toContain('FROM');
    expect(formattedContent).toContain('WHERE');
  });

  test('should be accessible via keyboard', async ({ page }) => {
    const messySQL = 'select * from users';

    const editor = page.locator('.cm-content').first();
    await editor.click();
    await editor.fill(messySQL);

    // Focus the format button and press Enter
    const formatButton = page.locator('#formatButton, button:has-text("Format")').first();
    await formatButton.focus();
    await page.keyboard.press('Enter');

    // Wait for formatting
    await page.waitForFunction(() => {
      const content = document.querySelector('.cm-content')?.textContent || '';
      return content.includes('SELECT');
    }, { timeout: 5000 });

    const formattedContent = await editor.textContent();
    expect(formattedContent).toContain('SELECT');
  });
});
