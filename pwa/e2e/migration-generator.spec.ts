import { test, expect } from '@playwright/test';

test.describe('Migration Generator E2E', () => {
  let TEST_DB_SOURCE: string;
  let TEST_DB_TARGET: string;

  test.beforeEach(async ({ page }, testInfo) => {
    // MANDATORY: Use worker index AND timestamp for unique database (INSTRUCTIONS.md Rule #3)
    const workerId = testInfo.parallelIndex;
    const testId = Date.now();
    TEST_DB_SOURCE = `migration_source_w${workerId}_${testId}`;
    TEST_DB_TARGET = `migration_target_w${workerId}_${testId}`;
    
    // Navigate FIRST to establish security context
    await page.goto('/db');
    await page.waitForLoadState('networkidle');
    
    // MANDATORY: Clean ALL state from previous tests (INSTRUCTIONS.md - Zero Tolerance for Flakiness)
    await page.evaluate(async () => {
      const win = window as any;
      try {
        if (win.testDb) {
          await win.testDb.close();
          win.testDb = null;
        }
      } catch (err) {
        console.warn('[TEST] Failed to close existing testDb', err);
      }

      // Clear ALL localStorage
      localStorage.clear();
      
      // Delete ALL indexedDB databases
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name) {
          await indexedDB.deleteDatabase(db.name);
        }
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Enable non-leader writes to bypass leader election timeouts (will activate once testDb exists)
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db && db.allowNonLeaderWrites) {
        await db.allowNonLeaderWrites(true);
      }
    });
  });

  test.afterEach(async ({ page }) => {
    // MANDATORY: Cleanup after each test (INSTRUCTIONS.md Rule #5)
    await page.evaluate(async (dbNames) => {
      const db = (window as any).testDb;
      if (db) {
        try { await db.close(); } catch {}
      }
      
      // Delete both test databases
      for (const dbName of dbNames) {
        try { await indexedDB.deleteDatabase(dbName + '.db'); } catch {}
      }
      try { localStorage.removeItem('absurder-sql-database-store'); } catch {}
    }, [TEST_DB_SOURCE, TEST_DB_TARGET]).catch(() => {});
  });

  test('should show Generate Migration button when differences exist', async ({ page }) => {
    // Create source database with basic schema
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput', { timeout: 5000 });
    await page.fill('#dbNameInput', TEST_DB_SOURCE);
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, `${TEST_DB_SOURCE}.db`, { timeout: 15000 });

    // Create table in source database
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

    const editor = page.locator('.cm-content').first();
    await editor.click();
    // INSTRUCTIONS.md Rule #2: ALWAYS DROP TABLE IF EXISTS before CREATE TABLE
    await editor.fill('DROP TABLE IF EXISTS users');
    await page.click('#executeButton');
    await editor.click();
    await editor.fill('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
    await page.click('#executeButton');
    
    // Close database to persist to IndexedDB
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db && db.close) {
        await db.close();
      }
    });

    // Create target database with additional table
    await page.goto('/db');
    await page.waitForLoadState('networkidle');
    
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput', { timeout: 5000 });
    await page.fill('#dbNameInput', TEST_DB_TARGET);
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, `${TEST_DB_TARGET}.db`, { timeout: 15000 });

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

    await editor.click();
    // INSTRUCTIONS.md Rule #2: ALWAYS DROP TABLE IF EXISTS before CREATE TABLE
    await editor.fill('DROP TABLE IF EXISTS users');
    await page.click('#executeButton');
    await editor.click();
    await editor.fill('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
    await page.click('#executeButton');
    
    await editor.click();
    // INSTRUCTIONS.md Rule #2: DROP TABLE IF EXISTS before CREATE TABLE
    await editor.fill('DROP TABLE IF EXISTS posts');
    await page.click('#executeButton');
    await editor.click();
    await editor.fill('CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT, user_id INTEGER)');
    await page.click('#executeButton');

    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db && db.close) {
        await db.close();
      }
    });

    // Navigate to schema diff and compare
    await page.goto('/db/diff');
    await page.waitForLoadState('networkidle');

    // Select source database
    const sourceSelector = page.locator('#sourceDb').first();
    await sourceSelector.click();
    await page.locator(`[role="option"]:has-text("${TEST_DB_SOURCE}.db")`).click();

    // Select target database
    const targetSelector = page.locator('#targetDb').first();
    await targetSelector.click();
    await page.locator(`[role="option"]:has-text("${TEST_DB_TARGET}.db")`).click();

    // Compare databases
    await page.click('#compareButton');
    await page.waitForSelector('[data-testid="diff-summary"]', { timeout: 10000 });

    // Should show Generate Migration button
    const generateButton = page.locator('#generateMigrationButton, button:has-text("Generate Migration")').first();
    await expect(generateButton).toBeVisible({ timeout: 5000 });
  });

  test('should generate forward migration SQL for added table', async ({ page }) => {
    // Create source and target databases (reusing logic from above)
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput');
    await page.fill('#dbNameInput', TEST_DB_SOURCE);
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, `${TEST_DB_SOURCE}.db`, { timeout: 15000 });

    await page.goto('/db/query');
    await page.waitForLoadState('networkidle');
    
    const editor = page.locator('.cm-content').first();
    await editor.click();
    // INSTRUCTIONS.md Rule #2: ALWAYS DROP TABLE IF EXISTS before CREATE TABLE
    await editor.fill('DROP TABLE IF EXISTS users');
    await page.click('#executeButton');
    await editor.click();
    await editor.fill('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
    await page.click('#executeButton');

    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db && db.close) await db.close();
    });

    await page.goto('/db');
    await page.waitForLoadState('networkidle');
    
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput');
    await page.fill('#dbNameInput', TEST_DB_TARGET);
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, `${TEST_DB_TARGET}.db`, { timeout: 15000 });

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

    await editor.click();
    // INSTRUCTIONS.md Rule #2: ALWAYS DROP TABLE IF EXISTS before CREATE TABLE
    await editor.fill('DROP TABLE IF EXISTS users');
    await page.click('#executeButton');
    await editor.click();
    await editor.fill('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
    await page.click('#executeButton');
    
    await editor.click();
    // INSTRUCTIONS.md Rule #2: ALWAYS DROP TABLE IF EXISTS before CREATE TABLE
    await editor.fill('DROP TABLE IF EXISTS posts');
    await page.click('#executeButton');
    await editor.click();
    await editor.fill('CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT)');
    await page.click('#executeButton');

    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db && db.close) await db.close();
    });

    // Navigate to diff and generate migration
    await page.goto('/db/diff');
    await page.waitForLoadState('networkidle');

    await page.locator('#sourceDb').click();
    await page.locator(`[role="option"]:has-text("${TEST_DB_SOURCE}.db")`).click();
    
    await page.locator('#targetDb').click();
    await page.locator(`[role="option"]:has-text("${TEST_DB_TARGET}.db")`).click();

    await page.click('#compareButton');
    await page.waitForSelector('[data-testid="diff-summary"]');

    // Generate migration
    await page.click('#generateMigrationButton');

    // Should show migration SQL
    const migrationSql = page.locator('#forwardMigrationSql, [data-testid="forward-migration"]').first();
    await expect(migrationSql).toBeVisible();
    
    // Migration should contain CREATE TABLE for posts
    const sqlContent = await migrationSql.textContent();
    expect(sqlContent).toContain('CREATE TABLE posts');
    expect(sqlContent).toContain('id INTEGER PRIMARY KEY');
    expect(sqlContent).toContain('title TEXT');
  });

  test('should generate rollback migration SQL', async ({ page }) => {
    // Create databases with differences (same as above)
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput');
    await page.fill('#dbNameInput', TEST_DB_SOURCE);
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, `${TEST_DB_SOURCE}.db`, { timeout: 15000 });

    await page.goto('/db/query');
    await page.waitForLoadState('networkidle');
    
    const editor = page.locator('.cm-content').first();
    await editor.click();
    // INSTRUCTIONS.md Rule #2: ALWAYS DROP TABLE IF EXISTS before CREATE TABLE
    await editor.fill('DROP TABLE IF EXISTS users');
    await page.click('#executeButton');
    await editor.click();
    await editor.fill('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
    await page.click('#executeButton');

    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db && db.close) await db.close();
    });

    await page.goto('/db');
    await page.waitForLoadState('networkidle');
    
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput');
    await page.fill('#dbNameInput', TEST_DB_TARGET);
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, `${TEST_DB_TARGET}.db`, { timeout: 15000 });

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

    await editor.click();
    // INSTRUCTIONS.md Rule #2: ALWAYS DROP TABLE IF EXISTS before CREATE TABLE
    await editor.fill('DROP TABLE IF EXISTS users');
    await page.click('#executeButton');
    await editor.click();
    await editor.fill('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
    await page.click('#executeButton');
    
    await editor.click();
    // INSTRUCTIONS.md Rule #2: ALWAYS DROP TABLE IF EXISTS before CREATE TABLE
    await editor.fill('DROP TABLE IF EXISTS posts');
    await page.click('#executeButton');
    await editor.click();
    await editor.fill('CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT)');
    await page.click('#executeButton');

    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db && db.close) await db.close();
    });

    await page.goto('/db/diff');
    await page.waitForLoadState('networkidle');

    await page.locator('#sourceDb').click();
    await page.locator(`[role="option"]:has-text("${TEST_DB_SOURCE}.db")`).click();
    
    await page.locator('#targetDb').click();
    await page.locator(`[role="option"]:has-text("${TEST_DB_TARGET}.db")`).click();

    await page.click('#compareButton');
    await page.waitForSelector('[data-testid="diff-summary"]');

    await page.click('#generateMigrationButton');

    // Should show rollback SQL
    const rollbackSql = page.locator('#rollbackMigrationSql, [data-testid="rollback-migration"]').first();
    await expect(rollbackSql).toBeVisible();
    
    // Rollback should contain DROP TABLE for posts
    const sqlContent = await rollbackSql.textContent();
    expect(sqlContent).toContain('DROP TABLE');
    expect(sqlContent).toContain('posts');
  });

  test('should download forward migration SQL', async ({ page }) => {
    // Setup databases with differences
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput');
    await page.fill('#dbNameInput', TEST_DB_SOURCE);
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, `${TEST_DB_SOURCE}.db`, { timeout: 15000 });

    await page.goto('/db/query');
    await page.waitForLoadState('networkidle');
    
    const editor = page.locator('.cm-content').first();
    await editor.click();
    // INSTRUCTIONS.md Rule #2: ALWAYS DROP TABLE IF EXISTS before CREATE TABLE
    await editor.fill('DROP TABLE IF EXISTS users');
    await page.click('#executeButton');
    await editor.click();
    await editor.fill('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
    await page.click('#executeButton');

    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db && db.close) await db.close();
    });

    await page.goto('/db');
    await page.waitForLoadState('networkidle');
    
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput');
    await page.fill('#dbNameInput', TEST_DB_TARGET);
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, `${TEST_DB_TARGET}.db`, { timeout: 15000 });

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

    await editor.click();
    // INSTRUCTIONS.md Rule #2: ALWAYS DROP TABLE IF EXISTS before CREATE TABLE
    await editor.fill('DROP TABLE IF EXISTS users');
    await page.click('#executeButton');
    await editor.click();
    await editor.fill('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
    await page.click('#executeButton');
    
    await editor.click();
    // INSTRUCTIONS.md Rule #2: ALWAYS DROP TABLE IF EXISTS before CREATE TABLE
    await editor.fill('DROP TABLE IF EXISTS posts');
    await page.click('#executeButton');
    await editor.click();
    await editor.fill('CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT)');
    await page.click('#executeButton');

    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db && db.close) await db.close();
    });

    await page.goto('/db/diff');
    await page.waitForLoadState('networkidle');

    await page.locator('#sourceDb').click();
    await page.locator(`[role="option"]:has-text("${TEST_DB_SOURCE}.db")`).click();
    
    await page.locator('#targetDb').click();
    await page.locator(`[role="option"]:has-text("${TEST_DB_TARGET}.db")`).click();

    await page.click('#compareButton');
    await page.waitForSelector('[data-testid="diff-summary"]');

    await page.click('#generateMigrationButton');

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click download forward migration button
    const downloadButton = page.locator('#downloadForwardMigration, button:has-text("Download Forward")').first();
    await expect(downloadButton).toBeVisible();
    await downloadButton.click();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/forward.*\.sql$/i);
  });

  test('should download rollback migration SQL', async ({ page }) => {
    // Setup databases
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput');
    await page.fill('#dbNameInput', TEST_DB_SOURCE);
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, `${TEST_DB_SOURCE}.db`, { timeout: 15000 });

    await page.goto('/db/query');
    await page.waitForLoadState('networkidle');
    
    const editor = page.locator('.cm-content').first();
    await editor.click();
    // INSTRUCTIONS.md Rule #2: ALWAYS DROP TABLE IF EXISTS before CREATE TABLE
    await editor.fill('DROP TABLE IF EXISTS users');
    await page.click('#executeButton');
    await editor.click();
    await editor.fill('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
    await page.click('#executeButton');

    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db && db.close) await db.close();
    });

    await page.goto('/db');
    await page.waitForLoadState('networkidle');
    
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput');
    await page.fill('#dbNameInput', TEST_DB_TARGET);
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, `${TEST_DB_TARGET}.db`, { timeout: 15000 });

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

    await editor.click();
    // INSTRUCTIONS.md Rule #2: ALWAYS DROP TABLE IF EXISTS before CREATE TABLE
    await editor.fill('DROP TABLE IF EXISTS users');
    await page.click('#executeButton');
    await editor.click();
    await editor.fill('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
    await page.click('#executeButton');
    
    await editor.click();
    // INSTRUCTIONS.md Rule #2: ALWAYS DROP TABLE IF EXISTS before CREATE TABLE
    await editor.fill('DROP TABLE IF EXISTS posts');
    await page.click('#executeButton');
    await editor.click();
    await editor.fill('CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT)');
    await page.click('#executeButton');

    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db && db.close) await db.close();
    });

    await page.goto('/db/diff');
    await page.waitForLoadState('networkidle');

    await page.locator('#sourceDb').click();
    await page.locator(`[role="option"]:has-text("${TEST_DB_SOURCE}.db")`).click();
    
    await page.locator('#targetDb').click();
    await page.locator(`[role="option"]:has-text("${TEST_DB_TARGET}.db")`).click();

    await page.click('#compareButton');
    await page.waitForSelector('[data-testid="diff-summary"]');

    await page.click('#generateMigrationButton');

    // Download rollback
    const downloadPromise = page.waitForEvent('download');
    
    const downloadButton = page.locator('#downloadRollbackMigration, button:has-text("Download Rollback")').first();
    await expect(downloadButton).toBeVisible();
    await downloadButton.click();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/rollback.*\.sql$/i);
  });

  test('should generate ALTER TABLE for column additions', async ({ page }) => {
    // Create source database
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput');
    await page.fill('#dbNameInput', TEST_DB_SOURCE);
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, `${TEST_DB_SOURCE}.db`, { timeout: 15000 });

    await page.goto('/db/query');
    await page.waitForLoadState('networkidle');
    
    const editor = page.locator('.cm-content').first();
    await editor.click();
    // INSTRUCTIONS.md Rule #2: ALWAYS DROP TABLE IF EXISTS before CREATE TABLE
    await editor.fill('DROP TABLE IF EXISTS users');
    await page.click('#executeButton');
    await editor.click();
    await editor.fill('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
    await page.click('#executeButton');

    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db && db.close) await db.close();
    });

    // Wait for IndexedDB to persist (critical for database survival)
    await page.waitForTimeout(500);

    // Create target database with additional column
    await page.goto('/db');
    await page.waitForLoadState('networkidle');
    
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput');
    await page.fill('#dbNameInput', TEST_DB_TARGET);
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, `${TEST_DB_TARGET}.db`, { timeout: 15000 });

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

    await editor.click();
    // INSTRUCTIONS.md Rule #2: ALWAYS DROP TABLE IF EXISTS before CREATE TABLE
    await editor.fill('DROP TABLE IF EXISTS users');
    await page.click('#executeButton');
    await editor.click();
    await editor.fill('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)');
    await page.click('#executeButton');

    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db && db.close) await db.close();
    });

    // Wait for IndexedDB to persist (critical for database survival)
    await page.waitForTimeout(500);

    await page.goto('/db/diff');
    await page.waitForLoadState('networkidle');

    await page.locator('#sourceDb').click();
    await page.locator(`[role="option"]:has-text("${TEST_DB_SOURCE}.db")`).click();
    
    await page.locator('#targetDb').click();
    await page.locator(`[role="option"]:has-text("${TEST_DB_TARGET}.db")`).click();

    await page.click('#compareButton');
    await page.waitForSelector('[data-testid="diff-summary"]');

    await page.click('#generateMigrationButton');

    // Should generate ALTER TABLE ADD COLUMN
    const migrationSql = page.locator('#forwardMigrationSql, [data-testid="forward-migration"]').first();
    const sqlContent = await migrationSql.textContent();
    expect(sqlContent).toContain('ALTER TABLE users');
    expect(sqlContent).toContain('ADD COLUMN email');
  });

  test('should handle migration when no differences exist', async ({ page }) => {
    // Create identical databases
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput');
    await page.fill('#dbNameInput', TEST_DB_SOURCE);
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, `${TEST_DB_SOURCE}.db`, { timeout: 15000 });

    await page.goto('/db/query');
    await page.waitForLoadState('networkidle');
    
    const editor = page.locator('.cm-content').first();
    await editor.click();
    // INSTRUCTIONS.md Rule #2: ALWAYS DROP TABLE IF EXISTS before CREATE TABLE
    await editor.fill('DROP TABLE IF EXISTS users');
    await page.click('#executeButton');
    await editor.click();
    await editor.fill('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
    await page.click('#executeButton');

    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db && db.close) await db.close();
    });

    await page.goto('/db');
    await page.waitForLoadState('networkidle');
    
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput');
    await page.fill('#dbNameInput', TEST_DB_TARGET);
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, `${TEST_DB_TARGET}.db`, { timeout: 15000 });

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

    await editor.click();
    await editor.fill('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
    await page.click('#executeButton');

    await page.evaluate(async () => {
      const db = (window as any).testDb;
      if (db && db.close) await db.close();
    });

    await page.goto('/db/diff');
    await page.waitForLoadState('networkidle');

    await page.locator('#sourceDb').click();
    await page.locator(`[role="option"]:has-text("${TEST_DB_SOURCE}.db")`).click();
    
    await page.locator('#targetDb').click();
    await page.locator(`[role="option"]:has-text("${TEST_DB_TARGET}.db")`).click();

    await page.click('#compareButton');

    // Generate Migration button should not be visible when no differences
    const generateButton = page.locator('#generateMigrationButton');
    await expect(generateButton).not.toBeVisible();
  });
});
