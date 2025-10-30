import { test, expect } from '@playwright/test';

test.describe('Database Management Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/db');
    await page.waitForSelector('#dbManagement', { timeout: 10000 });
  });

  test('should display database selector', async ({ page }) => {
    const selector = await page.locator('#dbSelector');
    await expect(selector).toBeVisible();
  });

  test('should create new database', async ({ page }) => {
    await page.click('#createDbButton');
    
    await page.fill('#dbNameInput', 'test_new_db');
    await page.click('#confirmCreate');
    
    await page.waitForSelector('#status:has-text("Database created")');
    
    const status = await page.textContent('#status');
    expect(status).toContain('test_new_db');
  });

  test('should export database', async ({ page }) => {
    // Database is already initialized by provider
    await page.waitForSelector('#exportDbButton:not([disabled])');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportDbButton');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.db');
  });

  test('should import database', async ({ page }) => {
    await page.waitForSelector('#exportDbButton:not([disabled])');
    
    // Create test data and export
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS export_test');
      await db.execute('CREATE TABLE export_test (id INTEGER, data TEXT)');
      await db.execute('INSERT INTO export_test VALUES (99, ?)', [{ type: 'Text', value: 'exported' }]);
    });
    
    // Export the database
    const exportedBlob = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const blob = await db.export();
      const arrayBuffer = await blob.arrayBuffer();
      return Array.from(new Uint8Array(arrayBuffer));
    });
    
    // Create file from exported data
    await page.evaluate((data) => {
      const uint8Array = new Uint8Array(data);
      const blob = new Blob([uint8Array], { type: 'application/x-sqlite3' });
      const file = new File([blob], 'import.db', { type: 'application/x-sqlite3' });
      (window as any).importFile = file;
    }, exportedBlob);
    
    // Import it back
    await page.click('#importDbButton');
    await page.waitForSelector('#status:has-text("Import complete")');
    await page.waitForTimeout(500);
    
    // Verify the imported data exists
    const hasData = await page.evaluate(async () => {
      const db = (window as any).testDb;
      console.log('Verifying import, db:', db);
      try {
        // First check what tables exist
        const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('Tables after import:', tables);
        
        const result = await db.execute('SELECT * FROM export_test WHERE id = 99');
        console.log('Query result:', result);
        return result.rows.length > 0 && result.rows[0].values[1].value === 'exported';
      } catch (err) {
        console.error('Import verification failed:', err);
        return false;
      }
    });
    
    expect(hasData).toBe(true);
    
    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS export_test');
    });
  });

  test('should display database info', async ({ page }) => {
    await page.waitForSelector('#refreshInfo:not([disabled])');
    
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS users');
      await db.execute('DROP TABLE IF EXISTS posts');
      await db.execute('CREATE TABLE users (id INTEGER, name TEXT)');
      await db.execute('CREATE TABLE posts (id INTEGER, title TEXT)');
    });
    
    await page.click('#refreshInfo');
    
    await page.waitForSelector('#tableCount:has-text("2")');
    
    const tableCount = await page.textContent('#tableCount');
    expect(tableCount).toContain('2');
    
    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS users');
      await db.execute('DROP TABLE IF EXISTS posts');
    });
  });

  test('should delete database', async ({ page }) => {
    await page.waitForSelector('#deleteDbButton:not([disabled])');
    
    await page.click('#deleteDbButton');
    await page.click('#confirmDelete');
    
    await page.waitForSelector('#status:has-text("Database deleted")');
    
    const status = await page.textContent('#status');
    expect(status).toContain('deleted');
  });
});
