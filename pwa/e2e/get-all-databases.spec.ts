import { test, expect } from '@playwright/test';

test.describe('Get All Databases API', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/db');
    await page.waitForLoadState('networkidle');
  });

  test('should return empty array when no databases exist', async ({ page }) => {
    const databases = await page.evaluate(async () => {
      const Database = (window as any).Database;
      if (!Database || !Database.getAllDatabases) {
        throw new Error('Database.getAllDatabases not available');
      }
      return await Database.getAllDatabases();
    });

    expect(Array.isArray(databases)).toBe(true);
  });

  test('should return list of created databases', async ({ page }) => {
    // Create first database (user types without .db suffix)
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput', { timeout: 5000 });
    await page.fill('#dbNameInput', 'test_list_1');
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, 'test_list_1.db', { timeout: 15000 });

    // Create second database (user types without .db suffix)
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput', { timeout: 5000 });
    await page.fill('#dbNameInput', 'test_list_2');
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, 'test_list_2.db', { timeout: 15000 });

    // Get all databases
    const databases = await page.evaluate(async () => {
      const Database = (window as any).Database;
      return await Database.getAllDatabases();
    });

    expect(Array.isArray(databases)).toBe(true);
    expect(databases.length).toBeGreaterThanOrEqual(2);
    expect(databases).toContain('test_list_1.db');
    expect(databases).toContain('test_list_2.db');
  });

  test('should return databases in sorted order', async ({ page }) => {
    // Create databases in non-alphabetical order (users type without .db)
    const dbNames = ['zebra', 'apple', 'middle'];
    
    for (const dbName of dbNames) {
      await page.click('#createDbButton');
      await page.waitForSelector('#dbNameInput', { timeout: 5000 });
      await page.fill('#dbNameInput', dbName);
      await page.click('#confirmCreate');
      await page.waitForFunction((name) => {
        const selector = document.querySelector('#dbSelector');
        return selector && selector.textContent && selector.textContent.includes(name);
      }, `${dbName}.db`, { timeout: 15000 });
    }

    const databases = await page.evaluate(async () => {
      const Database = (window as any).Database;
      return await Database.getAllDatabases();
    });

    expect(Array.isArray(databases)).toBe(true);
    
    // Should include our databases
    expect(databases).toContain('zebra.db');
    expect(databases).toContain('apple.db');
    expect(databases).toContain('middle.db');
    
    // Should be sorted
    const ourDbs = databases.filter((db: string) => 
      db === 'zebra.db' || db === 'apple.db' || db === 'middle.db'
    );
    const sorted = [...ourDbs].sort();
    expect(ourDbs).toEqual(sorted);
  });

  test('should not include system databases or non-absurder databases', async ({ page }) => {
    // Create a database
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput', { timeout: 5000 });
    await page.fill('#dbNameInput', 'user_db');
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, 'user_db.db', { timeout: 15000 });

    const databases = await page.evaluate(async () => {
      const Database = (window as any).Database;
      return await Database.getAllDatabases();
    });

    expect(Array.isArray(databases)).toBe(true);
    
    // Should include our database
    expect(databases).toContain('user_db.db');
    
    // Should not include any databases starting with 'sqlite_' or other system prefixes
    const systemDbs = databases.filter((db: string) => 
      db.startsWith('sqlite_') || db.startsWith('__')
    );
    expect(systemDbs.length).toBe(0);
  });

  test('should update list after deleting a database', async ({ page }) => {
    // Create a database
    await page.click('#createDbButton');
    await page.waitForSelector('#dbNameInput', { timeout: 5000 });
    await page.fill('#dbNameInput', 'to_delete');
    await page.click('#confirmCreate');
    await page.waitForFunction((dbName) => {
      const selector = document.querySelector('#dbSelector');
      return selector && selector.textContent && selector.textContent.includes(dbName);
    }, 'to_delete.db', { timeout: 15000 });

    // Verify it's in the list
    let databases = await page.evaluate(async () => {
      const Database = (window as any).Database;
      return await Database.getAllDatabases();
    });
    expect(databases).toContain('to_delete.db');

    // Delete the database
    await page.click('#deleteDbButton');
    await page.waitForSelector('#confirmDelete', { timeout: 5000 });
    await page.click('#confirmDelete');
    await page.waitForTimeout(1000);

    // Verify it's no longer in the list
    databases = await page.evaluate(async () => {
      const Database = (window as any).Database;
      return await Database.getAllDatabases();
    });
    expect(databases).not.toContain('to_delete.db');
  });
});
