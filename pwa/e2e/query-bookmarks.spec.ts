import { test, expect } from '@playwright/test';

test.describe('Query Bookmarks E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Go to query page and initialize database
    await page.goto('/db/query');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#queryInterface', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });

    // Create database programmatically since /db/query doesn't auto-create one
    await page.evaluate(async () => {
      const Database = (window as any).Database;
      const testDb = await Database.newDatabase('test-db');
      (window as any).testDb = testDb;
    });

    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });

    // Initialize database with test data
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (!db) throw new Error('Database not initialized after waiting');
      
      // Create test table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS test_bookmarks (
          id INTEGER PRIMARY KEY,
          name TEXT,
          value INTEGER
        )
      `);
      
      await db.execute(`INSERT INTO test_bookmarks (name, value) VALUES ('test1', 100), ('test2', 200)`);
      
      // Sync to persist changes
      if (db.sync) {
        await db.sync();
      }
    });
    
    await page.waitForTimeout(500);
    
    // Clear any existing bookmarks from IndexedDB
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const request = indexedDB.open('absurder-sql-bookmarks', 1);
        request.onsuccess = () => {
          const db = request.result;
          if (db.objectStoreNames.contains('queries')) {
            const transaction = db.transaction(['queries'], 'readwrite');
            const store = transaction.objectStore('queries');
            store.clear();
            transaction.oncomplete = () => resolve();
          } else {
            resolve();
          }
        };
        request.onerror = () => resolve();
      });
    });
  });

  test('should show save query button', async ({ page }) => {
    await expect(page.locator('button:has-text("Save Query")')).toBeVisible();
  });

  test('should open save dialog when save query clicked', async ({ page }) => {
    await page.fill('.cm-content', 'SELECT 1');
    await page.click('button:has-text("Save Query")');
    await page.waitForTimeout(300);
    await expect(page.locator('text=Save Query as Bookmark')).toBeVisible();
    await expect(page.locator('input[placeholder*="query name" i]')).toBeVisible();
  });

  test('should save query with name and description', async ({ page }) => {
    // Enter query
    const queryText = 'SELECT * FROM test_bookmarks';
    await page.fill('.cm-content', queryText);
    
    // Click save query
    await page.click('button:has-text("Save Query")');
    await page.waitForTimeout(300);
    
    // Fill in save dialog
    await page.fill('#bookmarkName', 'My Test Query');
    await page.fill('#bookmarkDescription', 'This is a test query');
    
    // Save
    await page.click('button:has-text("Save Bookmark")');
    await page.waitForTimeout(500);
    
    // Verify saved (dialog should close)
    await expect(page.locator('text=Save Query as Bookmark')).not.toBeVisible();
    
    // Verify bookmark appears in saved queries sidebar/list
    await page.click('button:has-text("Saved Queries")');
    await expect(page.locator('text=My Test Query')).toBeVisible();
  });

  test('should save query with tags', async ({ page }) => {
    const queryText = 'SELECT id, name FROM test_bookmarks WHERE value > 50';
    await page.fill('.cm-content', queryText);
    
    await page.click('button:has-text("Save Query")');
    await page.waitForTimeout(300);
    
    await page.fill('#bookmarkName', 'Tagged Query');
    await page.fill('#bookmarkTags', 'analytics,report');
    
    await page.click('button:has-text("Save Bookmark")');
    await page.waitForTimeout(500);
    
    // Open saved queries
    await page.click('button:has-text("Saved Queries")');
    await expect(page.locator('text=Tagged Query')).toBeVisible();
    
    // Verify tags are shown in the bookmark card
    const taggedCard = page.locator('[data-query-name="Tagged Query"]');
    await expect(taggedCard.locator('.text-xs.bg-blue-100:has-text("analytics")')).toBeVisible();
    await expect(taggedCard.locator('.text-xs.bg-blue-100:has-text("report")')).toBeVisible();
  });

  test('should load saved query into editor', async ({ page }) => {
    // Save a query first
    const queryText = 'SELECT * FROM test_bookmarks ORDER BY value DESC';
    await page.fill('.cm-content', queryText);
    await page.click('button:has-text("Save Query")');
    await page.waitForTimeout(300);
    await page.fill('#bookmarkName', 'Load Test Query');
    await page.click('button:has-text("Save Bookmark")');
    await page.waitForTimeout(500);
    
    // Clear editor
    await page.fill('.cm-content', '');
    
    // Open saved queries and load
    await page.click('button:has-text("Saved Queries")');
    await page.click('text=Load Test Query');
    await page.waitForTimeout(300);
    
    // Verify query is loaded into editor
    const editorContent = await page.locator('.cm-content').textContent();
    expect(editorContent).toContain('SELECT * FROM test_bookmarks');
  });

  test('should show saved queries sidebar', async ({ page }) => {
    // Save multiple queries
    const queries = [
      { name: 'Query 1', sql: 'SELECT * FROM test_bookmarks WHERE id = 1' },
      { name: 'Query 2', sql: 'SELECT name FROM test_bookmarks' },
      { name: 'Query 3', sql: 'SELECT COUNT(*) FROM test_bookmarks' }
    ];
    
    for (const query of queries) {
      await page.fill('.cm-content', query.sql);
      await page.click('button:has-text("Save Query")');
      await page.waitForTimeout(300);
      await page.fill('#bookmarkName', query.name);
      await page.click('button:has-text("Save Bookmark")');
      await page.waitForTimeout(500);
    }
    
    // Open sidebar
    await page.click('button:has-text("Saved Queries")');
    
    // Verify all queries are listed
    await expect(page.locator('text=Query 1')).toBeVisible();
    await expect(page.locator('text=Query 2')).toBeVisible();
    await expect(page.locator('text=Query 3')).toBeVisible();
  });

  test('should search queries by name', async ({ page }) => {
    // Save queries with different names
    const queries = [
      { name: 'Customer Report', sql: 'SELECT * FROM test_bookmarks' },
      { name: 'Sales Analysis', sql: 'SELECT value FROM test_bookmarks' },
      { name: 'Customer Details', sql: 'SELECT name FROM test_bookmarks' }
    ];
    
    for (const query of queries) {
      await page.fill('.cm-content', query.sql);
      await page.click('button:has-text("Save Query")');
      await page.waitForTimeout(300);
      await page.fill('#bookmarkName', query.name);
      await page.click('button:has-text("Save Bookmark")');
      await page.waitForTimeout(500);
    }
    
    // Open sidebar and search
    await page.click('button:has-text("Saved Queries")');
    await page.fill('input[placeholder="Search queries..."]', 'Customer');
    await page.waitForTimeout(300);
    
    // Should show only matching queries
    await expect(page.locator('text=Customer Report')).toBeVisible();
    await expect(page.locator('text=Customer Details')).toBeVisible();
    await expect(page.locator('text=Sales Analysis')).not.toBeVisible();
  });

  test('should filter queries by tag', async ({ page }) => {
    // Save queries with different tags
    const queries = [
      { name: 'Query A', sql: 'SELECT * FROM test_bookmarks', tags: 'analytics' },
      { name: 'Query B', sql: 'SELECT name FROM test_bookmarks', tags: 'report' },
      { name: 'Query C', sql: 'SELECT value FROM test_bookmarks', tags: 'analytics,report' }
    ];
    
    for (const query of queries) {
      await page.fill('.cm-content', query.sql);
      await page.click('button:has-text("Save Query")');
      await page.waitForTimeout(300);
      await page.fill('#bookmarkName', query.name);
      await page.fill('#bookmarkTags', query.tags);
      await page.click('button:has-text("Save Bookmark")');
      await page.waitForTimeout(500);
    }
    
    // Open sidebar and filter by tag
    await page.click('button:has-text("Saved Queries")');
    
    // Click analytics tag filter
    await page.click('[data-tag-filter="analytics"]');
    await page.waitForTimeout(300);
    
    // Should show only analytics queries
    await expect(page.locator('[data-query-name="Query A"]')).toBeVisible();
    await expect(page.locator('[data-query-name="Query C"]')).toBeVisible();
    await expect(page.locator('[data-query-name="Query B"]')).not.toBeVisible();
  });

  test('should edit saved query', async ({ page }) => {
    // Save initial query
    await page.fill('.cm-content', 'SELECT * FROM test_bookmarks');
    await page.click('button:has-text("Save Query")');
    await page.waitForTimeout(300);
    await page.fill('#bookmarkName', 'Editable Query');
    await page.fill('#bookmarkDescription', 'Original description');
    await page.click('button:has-text("Save Bookmark")');
    await page.waitForTimeout(500);
    
    // Open saved queries
    await page.click('button:has-text("Saved Queries")');
    
    // Click edit button for the query
    await page.click('[data-query-name="Editable Query"] button:has-text("Edit")');
    await page.waitForTimeout(300);
    
    // Edit dialog should open
    await expect(page.locator('text=Edit Bookmark')).toBeVisible();
    
    // Modify name and description
    await page.fill('#editBookmarkName', 'Updated Query Name');
    await page.fill('#editBookmarkDescription', 'Updated description');
    
    // Save changes
    await page.click('button:has-text("Save Changes")');
    await page.waitForTimeout(500);
    
    // Verify updated name appears
    await expect(page.locator('text=Updated Query Name')).toBeVisible();
    await expect(page.locator('text=Editable Query')).not.toBeVisible();
  });

  test('should delete saved query', async ({ page }) => {
    // Save query
    await page.fill('.cm-content', 'SELECT * FROM test_bookmarks');
    await page.click('button:has-text("Save Query")');
    await page.waitForTimeout(300);
    await page.fill('#bookmarkName', 'Query to Delete');
    await page.click('button:has-text("Save Bookmark")');
    await page.waitForTimeout(500);
    
    // Open saved queries
    await page.click('button:has-text("Saved Queries")');
    await expect(page.locator('text=Query to Delete')).toBeVisible();
    
    // Click delete button
    await page.click('[data-query-name="Query to Delete"] button:has-text("Delete")');
    await page.waitForTimeout(300);
    
    // Confirm deletion
    await page.click('button:has-text("Confirm Delete"), button:has-text("Delete Bookmark")');
    await page.waitForTimeout(500);
    
    // Query should be removed
    await expect(page.locator('text=Query to Delete')).not.toBeVisible();
  });

  test('should export query library as JSON', async ({ page }) => {
    // Save multiple queries
    const queries = [
      { name: 'Export Query 1', sql: 'SELECT * FROM test_bookmarks', desc: 'First query' },
      { name: 'Export Query 2', sql: 'SELECT name FROM test_bookmarks', desc: 'Second query' }
    ];
    
    for (const query of queries) {
      await page.fill('.cm-content', query.sql);
      await page.click('button:has-text("Save Query")');
      await page.waitForTimeout(300);
      await page.fill('#bookmarkName', query.name);
      await page.fill('#bookmarkDescription', query.desc);
      await page.click('button:has-text("Save Bookmark")');
      await page.waitForTimeout(500);
    }
    
    // Open saved queries
    await page.click('button:has-text("Saved Queries")');
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    
    // Click export button
    await page.click('button:has-text("Export Library")');
    
    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/);
    
    // Verify download content
    const path = await download.path();
    if (path) {
      const fs = require('fs');
      const content = fs.readFileSync(path, 'utf-8');
      const exported = JSON.parse(content);
      expect(Array.isArray(exported)).toBeTruthy();
      expect(exported.length).toBeGreaterThanOrEqual(2);
      expect(exported.some((q: any) => q.name === 'Export Query 1')).toBeTruthy();
      expect(exported.some((q: any) => q.name === 'Export Query 2')).toBeTruthy();
    }
  });

  test('should import query library from JSON', async ({ page }) => {
    // Open saved queries
    await page.click('button:has-text("Saved Queries")');
    await page.waitForTimeout(300);
    
    // Create test import file
    const importData = [
      {
        id: 'import-1',
        name: 'Imported Query 1',
        description: 'First imported query',
        sql: 'SELECT * FROM test_bookmarks WHERE id > 0',
        tags: ['imported'],
        created_at: Date.now(),
        updated_at: Date.now()
      },
      {
        id: 'import-2',
        name: 'Imported Query 2',
        description: 'Second imported query',
        sql: 'SELECT COUNT(*) FROM test_bookmarks',
        tags: ['imported', 'count'],
        created_at: Date.now(),
        updated_at: Date.now()
      }
    ];
    
    // Set file input
    const fileInput = page.locator('input[type="file"]');
    const buffer = Buffer.from(JSON.stringify(importData));
    await fileInput.setInputFiles({
      name: 'import.json',
      mimeType: 'application/json',
      buffer
    });
    
    await page.waitForTimeout(1000);
    
    // Verify imported queries appear
    await expect(page.locator('text=Imported Query 1')).toBeVisible();
    await expect(page.locator('text=Imported Query 2')).toBeVisible();
  });

  test('should show query count in saved queries button', async ({ page }) => {
    // Initially should show 0 or no count
    const initialButton = page.locator('button:has-text("Saved Queries")');
    await expect(initialButton).toBeVisible();
    
    // Save a query
    await page.fill('.cm-content', 'SELECT * FROM test_bookmarks');
    await page.click('button:has-text("Save Query")');
    await page.waitForTimeout(300);
    await page.fill('#bookmarkName', 'Count Test');
    await page.click('button:has-text("Save Bookmark")');
    await page.waitForTimeout(500);
    
    // Button should now show count
    await expect(page.locator('button:has-text("Saved Queries (1)")')).toBeVisible();
  });

  test('should persist bookmarks across page reloads', async ({ page }) => {
    // Save query
    await page.fill('.cm-content', 'SELECT * FROM test_bookmarks WHERE id = 42');
    await page.click('button:has-text("Save Query")');
    await page.waitForTimeout(300);
    await page.fill('#bookmarkName', 'Persistent Query');
    await page.click('button:has-text("Save Bookmark")');
    await page.waitForTimeout(500);
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Open saved queries
    await page.click('button:has-text("Saved Queries")');
    
    // Query should still be there
    await expect(page.locator('text=Persistent Query')).toBeVisible();
  });

  test('should show creation and update timestamps', async ({ page }) => {
    // Save query
    await page.fill('.cm-content', 'SELECT * FROM test_bookmarks');
    await page.click('button:has-text("Save Query")');
    await page.waitForTimeout(300);
    await page.fill('#bookmarkName', 'Timestamped Query');
    await page.click('button:has-text("Save Bookmark")');
    await page.waitForTimeout(500);
    
    // Open saved queries
    await page.click('button:has-text("Saved Queries")');
    
    // Should show timestamp info
    await expect(page.locator('text=Created')).toBeVisible();
  });

  test('should close save dialog when cancelled', async ({ page }) => {
    await page.fill('.cm-content', 'SELECT * FROM test_bookmarks');
    await page.click('button:has-text("Save Query")');
    await page.waitForTimeout(300);
    
    // Dialog should be open
    await expect(page.locator('text=Save Query as Bookmark')).toBeVisible();
    
    // Click cancel
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(300);
    
    // Dialog should close
    await expect(page.locator('text=Save Query as Bookmark')).not.toBeVisible();
  });

  test('should not save bookmark with empty name', async ({ page }) => {
    await page.fill('.cm-content', 'SELECT * FROM test_bookmarks');
    await page.click('button:has-text("Save Query")');
    await page.waitForTimeout(300);
    
    // Try to save with empty name
    await page.click('button:has-text("Save Bookmark")');
    await page.waitForTimeout(300);
    
    // Should show validation error
    await expect(page.locator('text=name is required')).toBeVisible();
  });

  test('should show SQL preview in bookmark list', async ({ page }) => {
    const sql = 'SELECT id, name, value FROM test_bookmarks WHERE value > 100 ORDER BY id DESC';
    await page.fill('.cm-content', sql);
    await page.click('button:has-text("Save Query")');
    await page.waitForTimeout(300);
    await page.fill('#bookmarkName', 'Preview Test');
    await page.click('button:has-text("Save Bookmark")');
    await page.waitForTimeout(500);
    
    // Open saved queries
    await page.click('button:has-text("Saved Queries")');
    
    // Should show SQL preview (truncated or full)
    const preview = page.locator('[data-query-name="Preview Test"] .font-mono');
    await expect(preview).toContainText('SELECT id');
  });
});
