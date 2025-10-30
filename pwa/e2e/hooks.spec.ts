import { test, expect } from '@playwright/test';

test.describe('React Hooks E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/hooks-test');
    await page.waitForSelector('#status', { timeout: 10000 });
  });

  test('useDatabase should initialize and return database instance', async ({ page }) => {
    await page.waitForSelector('#status:has-text("Database ready")', { timeout: 10000 });
    
    const result = await page.evaluate(() => {
      return {
        hasDb: (window as any).testDb !== null,
        loading: (window as any).testLoading,
        error: (window as any).testError
      };
    });
    
    expect(result.hasDb).toBe(true);
    expect(result.loading).toBe(false);
    expect(result.error).toBe(null);
  });

  test('useDatabase should handle loading state transition', async ({ page }) => {
    await page.waitForSelector('#status:has-text("Database ready")');
    
    const loadingWasTrue = await page.evaluate(() => {
      return (window as any).loadingHistory?.includes(true);
    });
    
    expect(loadingWasTrue).toBe(true);
  });

  test('useQuery should execute and return data', async ({ page }) => {
    await page.waitForSelector('#status:has-text("Database ready")');
    
    await page.click('#testUseQuery');
    
    await page.waitForSelector('#useQueryResult:has-text("useQuery complete")', { timeout: 10000 });
    
    const result = await page.evaluate(() => {
      return {
        hasData: (window as any).useQueryData !== null && (window as any).useQueryData.length > 0,
        loading: (window as any).useQueryLoading,
        error: (window as any).useQueryError
      };
    });
    
    expect(result.hasData).toBe(true);
    expect(result.loading).toBe(false);
    expect(result.error).toBe(null);
  });

  test('useQuery should refetch data', async ({ page }) => {
    await page.waitForSelector('#status:has-text("Database ready")');
    
    await page.click('#testUseQuery');
    await page.waitForSelector('#useQueryResult:has-text("useQuery complete")');
    
    await page.click('#testUseQueryRefetch');
    await page.waitForSelector('#useQueryResult:has-text("Refetch complete")');
    
    const refetched = await page.evaluate(() => {
      return (window as any).useQueryRefetched;
    });
    
    expect(refetched).toBe(true);
  });

  test('useTransaction should execute multiple queries atomically', async ({ page }) => {
    await page.waitForSelector('#status:has-text("Database ready")');
    
    await page.click('#testTransaction');
    
    await page.waitForSelector('#transactionResult:has-text("Transaction complete")', { timeout: 10000 });
    
    // Verify data was actually inserted
    const dataExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      const result = await db.execute('SELECT * FROM transaction_test WHERE id = 1');
      return result.rows.length > 0;
    });
    
    expect(dataExists).toBe(true);
  });

  test('useTransaction should rollback on error', async ({ page }) => {
    await page.waitForSelector('#status:has-text("Database ready")');
    
    await page.click('#testTransactionRollback');
    
    await page.waitForSelector('#transactionResult:has-text("Rollback successful")', { timeout: 10000 });
    
    // Verify data was NOT inserted due to rollback
    const dataNotExists = await page.evaluate(async () => {
      const db = (window as any).testDb;
      try {
        const result = await db.execute('SELECT * FROM rollback_test');
        return result.rows.length === 0;
      } catch (err) {
        // Table doesn't exist = rollback worked
        return true;
      }
    });
    
    expect(dataNotExists).toBe(true);
  });

  test('useExport should download real database file', async ({ page }) => {
    await page.waitForSelector('#status:has-text("Database ready")');
    
    // Create some data first
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS export_data');
      await db.execute('CREATE TABLE export_data (id INTEGER, value TEXT)');
      await db.execute('INSERT INTO export_data VALUES (?, ?)', [
        { type: 'Integer', value: 42 },
        { type: 'Text', value: 'export test' }
      ]);
    });
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('#testExport');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('hooks_test.db');
    
    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS export_data');
    });
  });

  test('useImport should load real exported database', async ({ page }) => {
    await page.waitForSelector('#status:has-text("Database ready")');
    
    // Create and export a real database
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS import_source');
      await db.execute('CREATE TABLE import_source (id INTEGER, data TEXT)');
      await db.execute('INSERT INTO import_source VALUES (?, ?)', [
        { type: 'Integer', value: 999 },
        { type: 'Text', value: 'imported data' }
      ]);
      
      console.log('About to export database...');
      const blob = await db.export();
      console.log('Export blob size:', blob.size);
      const file = new File([blob], 'import_test.db', { type: 'application/x-sqlite3' });
      (window as any).realExportFile = file;
      console.log('Export file created');
    });
    
    await page.click('#testImport');
    
    await page.waitForSelector('#importResult:has-text("Import complete")', { timeout: 10000 });
    
    // Verify imported data exists
    const result = await page.evaluate(async () => {
      const db = (window as any).testDb;
      try {
        const result = await db.execute('SELECT * FROM import_source WHERE id = 999');
        if (result.rows.length > 0) {
          const row = result.rows[0];
          const id = row.values[0].type === 'Null' ? null : row.values[0].value;
          const data = row.values[1].type === 'Null' ? null : row.values[1].value;
          console.log('Import verification - ID:', id, 'Data:', data);
        }
        return {
          exists: result.rows.length > 0 && result.rows[0].values[1].value === 'imported data',
          rowCount: result.rows.length
        };
      } catch (err: any) {
        console.error('Import verification error:', err.message);
        return { exists: false, error: err.message };
      }
    });
    
    expect(result.exists).toBe(true);
    
    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS import_source');
    });
  });
});
