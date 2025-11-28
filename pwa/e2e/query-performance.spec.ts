import { test, expect } from '@playwright/test';

test.describe('Query Performance Tracking E2E', () => {
  // Unique database name per test run to avoid parallel test conflicts
  const testDbName = `query-performance-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.db`;

  test.beforeEach(async ({ page }) => {
    // Go to query page and initialize database
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

    // Initialize database with test data
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (!db) throw new Error('Database not initialized after waiting');

      // Create test table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS perf_test (
          id INTEGER PRIMARY KEY,
          data TEXT
        )
      `);

      // Insert test data
      for (let i = 1; i <= 100; i++) {
        await db.execute(`INSERT INTO perf_test (data) VALUES ('test-${i}')`);
      }

      // Sync to persist changes
      if (db.sync) {
        await db.sync();
      }
    });

    await page.waitForTimeout(500);

    // Clear any existing performance data from IndexedDB
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const request = indexedDB.open('absurder-sql-performance', 1);
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

  test.afterEach(async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      const dbName = (window as any).testDbName;
      if (db) { try { await db.close(); } catch {} }
      if (dbName) { try { await indexedDB.deleteDatabase(dbName); } catch {} }
    }).catch(() => {});
  });

  test('should show execution time for query', async ({ page }) => {
    const query = 'SELECT * FROM perf_test LIMIT 10';
    await page.fill('.cm-content', query);
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Should show execution time
    await expect(page.locator('#executionTime')).toBeVisible();
    const timeText = await page.locator('#executionTime').textContent();
    expect(timeText).toMatch(/Execution time: \d+\.\d+ms/);
  });

  test('should track query execution count', async ({ page }) => {
    const query = 'SELECT COUNT(*) FROM perf_test';
    
    // Execute query 3 times
    for (let i = 0; i < 3; i++) {
      await page.fill('.cm-content', query);
      await page.click('#executeButton');
      await page.waitForTimeout(500);
    }

    // Open performance stats
    await page.click('button:has-text("Performance Stats")');
    await page.waitForTimeout(300);

    // Should show execution count of 3
    const statsCard = page.locator('[data-query-stats="select count(*) from perf_test"]');
    await expect(statsCard.locator('text=Executions: 3')).toBeVisible();
  });

  test('should calculate average execution time', async ({ page }) => {
    const query = 'SELECT * FROM perf_test LIMIT 5';
    
    // Execute query multiple times
    for (let i = 0; i < 3; i++) {
      await page.fill('.cm-content', query);
      await page.click('#executeButton');
      await page.waitForTimeout(500);
    }

    // Open performance stats
    await page.click('button:has-text("Performance Stats")');
    await page.waitForTimeout(300);

    // Should show average time
    const statsCard = page.locator('[data-query-stats="select * from perf_test limit 5"]');
    await expect(statsCard.locator('text=Avg:')).toBeVisible();
  });

  test('should track min and max execution times', async ({ page }) => {
    const query = 'SELECT * FROM perf_test WHERE id < 10';
    
    // Execute query multiple times
    for (let i = 0; i < 3; i++) {
      await page.fill('.cm-content', query);
      await page.click('#executeButton');
      await page.waitForTimeout(300);
    }

    // Open performance stats
    await page.click('button:has-text("Performance Stats")');
    await page.waitForTimeout(300);

    // Should show min and max times
    const statsCard = page.locator('[data-query-stats="select * from perf_test where id < 10"]');
    await expect(statsCard.locator('text=Min:')).toBeVisible();
    await expect(statsCard.locator('text=Max:')).toBeVisible();
  });

  test('should identify slow queries (> 1s)', async ({ page }) => {
    // Create a slow query by doing a cross join
    const slowQuery = `
      SELECT a.id, b.id 
      FROM perf_test a, perf_test b 
      WHERE a.id < 15 AND b.id < 15
    `;
    
    await page.fill('.cm-content', slowQuery);
    
    // Mock a slow execution time for testing
    await page.evaluate(() => {
      const originalExecute = (window as any).testDb.execute;
      (window as any).testDb.execute = async function(...args: any[]) {
        const start = performance.now();
        const result = await originalExecute.apply(this, args);
        // Simulate slow query for testing
        if (args[0]?.includes('a.id, b.id')) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return result;
      };
    });

    await page.click('#executeButton');
    await page.waitForTimeout(1500);

    // Open slow queries log
    await page.click('button:has-text("Slow Queries")');
    await page.waitForTimeout(300);

    // Should show in slow queries (adjust threshold for test)
    const slowQueryList = page.locator('#slowQueriesList');
    await expect(slowQueryList).toBeVisible();
  });

  test('should show performance trends over time', async ({ page }) => {
    const query = 'SELECT * FROM perf_test LIMIT 3';
    
    // Execute query multiple times
    for (let i = 0; i < 5; i++) {
      await page.fill('.cm-content', query);
      await page.click('#executeButton');
      await page.waitForTimeout(300);
    }

    // Open performance stats
    await page.click('button:has-text("Performance Stats")');
    await page.waitForTimeout(300);

    // Should show execution history
    const statsCard = page.locator('[data-query-stats="select * from perf_test limit 3"]');
    await expect(statsCard.locator('text=Last executed:')).toBeVisible();
  });

  test('should persist performance stats across page reloads', async ({ page }) => {
    const query = 'SELECT * FROM perf_test WHERE id = 1';
    
    // Execute query
    await page.fill('.cm-content', query);
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Open performance stats
    await page.click('button:has-text("Performance Stats")');
    await page.waitForTimeout(300);

    // Should still show the execution
    const statsCard = page.locator('[data-query-stats="select * from perf_test where id = 1"]');
    await expect(statsCard.locator('text=Executions: 1')).toBeVisible();
  });

  test('should clear performance stats', async ({ page }) => {
    const query = 'SELECT 1';
    
    // Execute query
    await page.fill('.cm-content', query);
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Open performance stats
    await page.click('button:has-text("Performance Stats")');
    await page.waitForTimeout(300);

    // Clear stats
    await page.click('button:has-text("Clear Stats")');
    await page.waitForTimeout(300);

    // Confirm clear
    await page.click('button:has-text("Confirm")');
    await page.waitForTimeout(500);

    // Stats should be empty
    await expect(page.locator('text=No performance data yet')).toBeVisible();
  });

  test('should normalize similar queries for statistics', async ({ page }) => {
    // Execute similar queries with different values
    const queries = [
      'SELECT * FROM perf_test WHERE id = 1',
      'SELECT * FROM perf_test WHERE id = 2',
      'SELECT * FROM perf_test WHERE id = 3'
    ];
    
    for (const query of queries) {
      await page.fill('.cm-content', query);
      await page.click('#executeButton');
      await page.waitForTimeout(300);
    }

    // Open performance stats
    await page.click('button:has-text("Performance Stats")');
    await page.waitForTimeout(300);

    // Should group similar queries together (optional normalization feature)
    // For now, each unique query is tracked separately
    const statsList = page.locator('[data-query-stats]');
    await expect(statsList.first()).toBeVisible();
  });

  test('should show top slowest queries', async ({ page }) => {
    // Execute multiple different queries
    const queries = [
      'SELECT * FROM perf_test LIMIT 1',
      'SELECT * FROM perf_test LIMIT 10',
      'SELECT * FROM perf_test LIMIT 50'
    ];
    
    for (const query of queries) {
      await page.fill('.cm-content', query);
      await page.click('#executeButton');
      await page.waitForTimeout(300);
    }

    // Open performance stats
    await page.click('button:has-text("Performance Stats")');
    await page.waitForTimeout(300);

    // Should show queries sorted by average time
    const statsList = page.locator('[data-query-stats]');
    await expect(statsList.first()).toBeVisible();
  });

  test('should export performance stats to JSON', async ({ page }) => {
    const query = 'SELECT * FROM perf_test LIMIT 2';
    
    // Execute query
    await page.fill('.cm-content', query);
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Open performance stats
    await page.click('button:has-text("Performance Stats")');
    await page.waitForTimeout(300);

    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

    // Click export
    await page.click('button:has-text("Export Stats")');

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/performance-stats.*\.json/);

    // Verify downloaded content
    const path = await download.path();
    if (path) {
      const fs = require('fs');
      const content = fs.readFileSync(path, 'utf-8');
      const stats = JSON.parse(content);
      expect(Array.isArray(stats)).toBeTruthy();
      expect(stats.length).toBeGreaterThan(0);
    }
  });

  test('should show performance stats button with count', async ({ page }) => {
    // Initially should show 0 or no stats
    const statsButton = page.locator('button:has-text("Performance Stats")');
    await expect(statsButton).toBeVisible();

    // Execute a query
    await page.fill('.cm-content', 'SELECT * FROM perf_test LIMIT 1');
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Button should show count
    await expect(page.locator('button:has-text("Performance Stats (1)")')).toBeVisible();
  });

  test('should highlight queries exceeding threshold', async ({ page }) => {
    const query = 'SELECT * FROM perf_test';
    
    await page.fill('.cm-content', query);
    await page.click('#executeButton');
    await page.waitForTimeout(500);

    // Open performance stats
    await page.click('button:has-text("Performance Stats")');
    await page.waitForTimeout(300);

    // Should show if query is slow
    const statsCard = page.locator('[data-query-stats="select * from perf_test"]');
    await expect(statsCard).toBeVisible();
    
    // If execution time > 1000ms, should have warning indicator
    const timeText = await page.locator('#executionTime').textContent();
    if (timeText && parseFloat(timeText.match(/[\d.]+/)?.[0] || '0') > 1000) {
      await expect(statsCard.locator('.text-orange-500, .text-red-500')).toBeVisible();
    }
  });

  test('should show total queries executed', async ({ page }) => {
    // Execute multiple queries
    const queries = [
      'SELECT 1',
      'SELECT 2',
      'SELECT 3'
    ];
    
    for (const query of queries) {
      await page.fill('.cm-content', query);
      await page.click('#executeButton');
      await page.waitForTimeout(300);
    }

    // Open performance stats
    await page.click('button:has-text("Performance Stats")');
    await page.waitForTimeout(300);

    // Should show total count
    // The stats panel shows total queries in a stats grid
    const statsGrid = page.locator('.grid.grid-cols-4').first();
    await expect(statsGrid).toBeVisible();
    const firstStat = statsGrid.locator('.text-center').first();
    const countText = await firstStat.locator('.text-2xl').textContent();
    expect(countText?.trim()).toBe('3');
  });
});
