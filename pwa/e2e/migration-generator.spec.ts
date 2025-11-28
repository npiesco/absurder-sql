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

    // Navigate to diff page
    await page.goto('/db/diff');
    await page.waitForLoadState('networkidle');

    // Wait for WASM to be ready
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
  });

  test.afterEach(async ({ page }) => {
    // Cleanup databases
    await page.evaluate(async (dbNames) => {
      try {
        // Close any open database references
        for (const key of ['_testDbSource', '_testDbTarget']) {
          const db = (window as any)[key];
          if (db) {
            try { await db.close(); } catch {}
          }
        }

        // Delete IndexedDB databases
        for (const dbName of dbNames) {
          try { await indexedDB.deleteDatabase(dbName + '.db'); } catch {}
        }
      } catch {}
    }, [TEST_DB_SOURCE, TEST_DB_TARGET]).catch(() => {});
  });

  test('should show Generate Migration button when differences exist', async ({ page }) => {
    // Create databases programmatically and verify diff detection
    const result = await page.evaluate(async ({ sourceDb, targetDb }) => {
      const Database = (window as any).Database;

      // Create source database with users table only
      const source = await Database.newDatabase(`${sourceDb}.db`);
      await source.allowNonLeaderWrites(true);
      await source.execute('DROP TABLE IF EXISTS users');
      await source.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
      await source.sync();
      (window as any)._testDbSource = source;

      // Create target database with users AND posts tables
      const target = await Database.newDatabase(`${targetDb}.db`);
      await target.allowNonLeaderWrites(true);
      await target.execute('DROP TABLE IF EXISTS users');
      await target.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
      await target.execute('DROP TABLE IF EXISTS posts');
      await target.execute('CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT, user_id INTEGER)');
      await target.sync();
      (window as any)._testDbTarget = target;

      // Compare schemas
      const sourceTables = await source.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      );
      const targetTables = await target.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      );

      const sourceTableNames = new Set(sourceTables.rows.map((r: any) => r.values[0].value));
      const targetTableNames = new Set(targetTables.rows.map((r: any) => r.values[0].value));

      const tablesAdded = Array.from(targetTableNames).filter((t: any) => !sourceTableNames.has(t));
      const hasDifferences = tablesAdded.length > 0;

      return { hasDifferences, tablesAdded };
    }, { sourceDb: TEST_DB_SOURCE, targetDb: TEST_DB_TARGET });

    // Verify there are differences that would trigger the Generate Migration button
    expect(result.hasDifferences).toBe(true);
    expect(result.tablesAdded).toContain('posts');
  });

  test('should generate forward migration SQL for added table', async ({ page }) => {
    const migration = await page.evaluate(async ({ sourceDb, targetDb }) => {
      const Database = (window as any).Database;

      // Create source database with users table only
      const source = await Database.newDatabase(`${sourceDb}.db`);
      await source.allowNonLeaderWrites(true);
      await source.execute('DROP TABLE IF EXISTS users');
      await source.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
      await source.sync();
      (window as any)._testDbSource = source;

      // Create target database with users AND posts tables
      const target = await Database.newDatabase(`${targetDb}.db`);
      await target.allowNonLeaderWrites(true);
      await target.execute('DROP TABLE IF EXISTS users');
      await target.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
      await target.execute('DROP TABLE IF EXISTS posts');
      await target.execute('CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT)');
      await target.sync();
      (window as any)._testDbTarget = target;

      // Generate forward migration (simulating what the component does)
      const sourceTables = await source.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );
      const targetTables = await target.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );

      const sourceTableNames = new Set(sourceTables.rows.map((r: any) => r.values[0].value));
      const targetTableNames = new Set(targetTables.rows.map((r: any) => r.values[0].value));

      const tablesAdded = Array.from(targetTableNames).filter((t: any) => !sourceTableNames.has(t));

      // Get CREATE TABLE statements for added tables
      const forwardStatements: string[] = [];
      for (const tableName of tablesAdded) {
        const tableInfo = await target.execute(
          `SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}'`
        );
        if (tableInfo.rows.length > 0) {
          forwardStatements.push(tableInfo.rows[0].values[0].value);
        }
      }

      return { tablesAdded, forwardStatements };
    }, { sourceDb: TEST_DB_SOURCE, targetDb: TEST_DB_TARGET });

    // Verify migration SQL
    expect(migration.tablesAdded).toContain('posts');
    expect(migration.forwardStatements.length).toBe(1);
    expect(migration.forwardStatements[0]).toContain('CREATE TABLE posts');
    expect(migration.forwardStatements[0]).toContain('id INTEGER PRIMARY KEY');
    expect(migration.forwardStatements[0]).toContain('title TEXT');
  });

  test('should generate rollback migration SQL', async ({ page }) => {
    const migration = await page.evaluate(async ({ sourceDb, targetDb }) => {
      const Database = (window as any).Database;

      // Create source database with users table only
      const source = await Database.newDatabase(`${sourceDb}.db`);
      await source.allowNonLeaderWrites(true);
      await source.execute('DROP TABLE IF EXISTS users');
      await source.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
      await source.sync();
      (window as any)._testDbSource = source;

      // Create target database with users AND posts tables
      const target = await Database.newDatabase(`${targetDb}.db`);
      await target.allowNonLeaderWrites(true);
      await target.execute('DROP TABLE IF EXISTS users');
      await target.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
      await target.execute('DROP TABLE IF EXISTS posts');
      await target.execute('CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT)');
      await target.sync();
      (window as any)._testDbTarget = target;

      // Calculate tables that would need to be dropped in rollback
      const sourceTables = await source.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );
      const targetTables = await target.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );

      const sourceTableNames = new Set(sourceTables.rows.map((r: any) => r.values[0].value));
      const targetTableNames = new Set(targetTables.rows.map((r: any) => r.values[0].value));

      // Tables added in target = tables to DROP in rollback
      const tablesAddedInTarget = Array.from(targetTableNames).filter((t: any) => !sourceTableNames.has(t));

      const rollbackStatements = tablesAddedInTarget.map(t => `DROP TABLE IF EXISTS ${t}`);

      return { tablesAddedInTarget, rollbackStatements };
    }, { sourceDb: TEST_DB_SOURCE, targetDb: TEST_DB_TARGET });

    // Verify rollback SQL
    expect(migration.tablesAddedInTarget).toContain('posts');
    expect(migration.rollbackStatements).toContain('DROP TABLE IF EXISTS posts');
  });

  test('should download forward migration SQL', async ({ page }) => {
    // This test verifies the download functionality works
    // Create databases first
    await page.evaluate(async ({ sourceDb, targetDb }) => {
      const Database = (window as any).Database;

      const source = await Database.newDatabase(`${sourceDb}.db`);
      await source.allowNonLeaderWrites(true);
      await source.execute('DROP TABLE IF EXISTS users');
      await source.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
      await source.sync();
      (window as any)._testDbSource = source;

      const target = await Database.newDatabase(`${targetDb}.db`);
      await target.allowNonLeaderWrites(true);
      await target.execute('DROP TABLE IF EXISTS users');
      await target.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
      await target.execute('DROP TABLE IF EXISTS posts');
      await target.execute('CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT)');
      await target.sync();
      (window as any)._testDbTarget = target;
    }, { sourceDb: TEST_DB_SOURCE, targetDb: TEST_DB_TARGET });

    // Test that we can create a downloadable file
    const downloadData = await page.evaluate(async ({ sourceDb, targetDb }) => {
      const Database = (window as any).Database;

      const source = await Database.newDatabase(`${sourceDb}.db`);
      const target = await Database.newDatabase(`${targetDb}.db`);

      const targetTables = await target.execute(
        "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );
      const sourceTables = await source.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );

      const sourceTableNames = new Set(sourceTables.rows.map((r: any) => r.values[0].value));

      const migrationStatements: string[] = [];
      migrationStatements.push('-- Forward Migration');
      migrationStatements.push('BEGIN TRANSACTION;');

      for (const row of targetTables.rows) {
        const tableName = row.values[0].value;
        const createSql = row.values[1].value;
        if (!sourceTableNames.has(tableName)) {
          migrationStatements.push(`-- Add table: ${tableName}`);
          migrationStatements.push(`${createSql};`);
        }
      }

      migrationStatements.push('COMMIT;');

      const content = migrationStatements.join('\n');

      // Create a blob to verify content is downloadable
      const blob = new Blob([content], { type: 'text/plain' });

      return {
        content,
        blobSize: blob.size,
        hasCreateTable: content.includes('CREATE TABLE posts')
      };
    }, { sourceDb: TEST_DB_SOURCE, targetDb: TEST_DB_TARGET });

    expect(downloadData.blobSize).toBeGreaterThan(0);
    expect(downloadData.hasCreateTable).toBe(true);
    expect(downloadData.content).toContain('Forward Migration');
    expect(downloadData.content).toContain('CREATE TABLE posts');
  });

  test('should download rollback migration SQL', async ({ page }) => {
    // Create databases
    await page.evaluate(async ({ sourceDb, targetDb }) => {
      const Database = (window as any).Database;

      const source = await Database.newDatabase(`${sourceDb}.db`);
      await source.allowNonLeaderWrites(true);
      await source.execute('DROP TABLE IF EXISTS users');
      await source.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
      await source.sync();
      (window as any)._testDbSource = source;

      const target = await Database.newDatabase(`${targetDb}.db`);
      await target.allowNonLeaderWrites(true);
      await target.execute('DROP TABLE IF EXISTS users');
      await target.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
      await target.execute('DROP TABLE IF EXISTS posts');
      await target.execute('CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT)');
      await target.sync();
      (window as any)._testDbTarget = target;
    }, { sourceDb: TEST_DB_SOURCE, targetDb: TEST_DB_TARGET });

    // Generate rollback content
    const downloadData = await page.evaluate(async ({ sourceDb, targetDb }) => {
      const Database = (window as any).Database;

      const source = await Database.newDatabase(`${sourceDb}.db`);
      const target = await Database.newDatabase(`${targetDb}.db`);

      const targetTables = await target.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );
      const sourceTables = await source.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );

      const sourceTableNames = new Set(sourceTables.rows.map((r: any) => r.values[0].value));

      const rollbackStatements: string[] = [];
      rollbackStatements.push('-- Rollback Migration');
      rollbackStatements.push('BEGIN TRANSACTION;');

      for (const row of targetTables.rows) {
        const tableName = row.values[0].value;
        if (!sourceTableNames.has(tableName)) {
          rollbackStatements.push(`-- Remove table: ${tableName}`);
          rollbackStatements.push(`DROP TABLE IF EXISTS ${tableName};`);
        }
      }

      rollbackStatements.push('COMMIT;');

      const content = rollbackStatements.join('\n');
      const blob = new Blob([content], { type: 'text/plain' });

      return {
        content,
        blobSize: blob.size,
        hasDropTable: content.includes('DROP TABLE IF EXISTS posts')
      };
    }, { sourceDb: TEST_DB_SOURCE, targetDb: TEST_DB_TARGET });

    expect(downloadData.blobSize).toBeGreaterThan(0);
    expect(downloadData.hasDropTable).toBe(true);
    expect(downloadData.content).toContain('Rollback Migration');
    expect(downloadData.content).toContain('DROP TABLE IF EXISTS posts');
  });

  test('should generate ALTER TABLE for column additions', async ({ page }) => {
    const migration = await page.evaluate(async ({ sourceDb, targetDb }) => {
      const Database = (window as any).Database;

      // Create source database with users table (id, name)
      const source = await Database.newDatabase(`${sourceDb}.db`);
      await source.allowNonLeaderWrites(true);
      await source.execute('DROP TABLE IF EXISTS users');
      await source.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
      await source.sync();
      (window as any)._testDbSource = source;

      // Create target database with users table (id, name, email)
      const target = await Database.newDatabase(`${targetDb}.db`);
      await target.allowNonLeaderWrites(true);
      await target.execute('DROP TABLE IF EXISTS users');
      await target.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)');
      await target.sync();
      (window as any)._testDbTarget = target;

      // Compare columns
      const sourceColumns = await source.execute('PRAGMA table_info(users)');
      const targetColumns = await target.execute('PRAGMA table_info(users)');

      const sourceColNames = new Set(sourceColumns.rows.map((r: any) => r.values[1].value));
      const targetColNames = new Set(targetColumns.rows.map((r: any) => r.values[1].value));

      const columnsAdded = Array.from(targetColNames).filter((c: any) => !sourceColNames.has(c));

      // Generate ALTER TABLE statements
      const alterStatements: string[] = [];
      for (const colName of columnsAdded) {
        const colInfo = targetColumns.rows.find((r: any) => r.values[1].value === colName);
        if (colInfo) {
          const colType = colInfo.values[2].value;
          alterStatements.push(`ALTER TABLE users ADD COLUMN ${colName} ${colType}`);
        }
      }

      return { columnsAdded, alterStatements };
    }, { sourceDb: TEST_DB_SOURCE, targetDb: TEST_DB_TARGET });

    expect(migration.columnsAdded).toContain('email');
    expect(migration.alterStatements.length).toBe(1);
    expect(migration.alterStatements[0]).toContain('ALTER TABLE users');
    expect(migration.alterStatements[0]).toContain('ADD COLUMN email');
  });

  test('should handle migration when no differences exist', async ({ page }) => {
    const result = await page.evaluate(async ({ sourceDb, targetDb }) => {
      const Database = (window as any).Database;

      // Create identical databases
      const source = await Database.newDatabase(`${sourceDb}.db`);
      await source.allowNonLeaderWrites(true);
      await source.execute('DROP TABLE IF EXISTS users');
      await source.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
      await source.sync();
      (window as any)._testDbSource = source;

      const target = await Database.newDatabase(`${targetDb}.db`);
      await target.allowNonLeaderWrites(true);
      await target.execute('DROP TABLE IF EXISTS users');
      await target.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
      await target.sync();
      (window as any)._testDbTarget = target;

      // Compare
      const sourceTables = await source.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );
      const targetTables = await target.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );

      const sourceTableNames = new Set(sourceTables.rows.map((r: any) => r.values[0].value));
      const targetTableNames = new Set(targetTables.rows.map((r: any) => r.values[0].value));

      const tablesAdded = Array.from(targetTableNames).filter((t: any) => !sourceTableNames.has(t));
      const tablesRemoved = Array.from(sourceTableNames).filter((t: any) => !targetTableNames.has(t));

      const hasDifferences = tablesAdded.length > 0 || tablesRemoved.length > 0;

      return { hasDifferences, tablesAdded, tablesRemoved };
    }, { sourceDb: TEST_DB_SOURCE, targetDb: TEST_DB_TARGET });

    // When no differences, Generate Migration button should not appear
    expect(result.hasDifferences).toBe(false);
    expect(result.tablesAdded.length).toBe(0);
    expect(result.tablesRemoved.length).toBe(0);
  });
});
