import { test, expect } from '@playwright/test';

test.describe('Error Handling E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/error-test');
    await page.waitForSelector('#status', { timeout: 10000 });
  });

  test('should handle DatabaseNotOpenError', async ({ page }) => {
    await page.waitForSelector('#status:has-text("Ready")');
    
    await page.click('#testNotOpenError');
    
    await page.waitForSelector('#errorResult:has-text("DatabaseNotOpenError")');
    
    const errorDetails = await page.evaluate(() => {
      return {
        code: (window as any).lastError?.code,
        message: (window as any).lastError?.message,
      };
    });
    
    expect(errorDetails.code).toBe('DB_NOT_OPEN');
    expect(errorDetails.message).toContain('not opened');
  });

  test('should handle QueryExecutionError', async ({ page }) => {
    await page.waitForSelector('#status:has-text("Ready")');
    
    await page.click('#testQueryError');
    
    await page.waitForSelector('#errorResult:has-text("QueryExecutionError")');
    
    const errorDetails = await page.evaluate(() => {
      return {
        code: (window as any).lastError?.code,
        sql: (window as any).lastError?.sql,
      };
    });
    
    expect(errorDetails.code).toBe('QUERY_FAILED');
    expect(errorDetails.sql).toBeTruthy();
  });

  test('should handle ImportExportError', async ({ page }) => {
    await page.waitForSelector('#status:has-text("Ready")');
    
    await page.click('#testImportError');
    
    await page.waitForSelector('#errorResult:has-text("ImportExportError")');
    
    const errorDetails = await page.evaluate(() => {
      return {
        code: (window as any).lastError?.code,
        operation: (window as any).lastError?.operation,
      };
    });
    
    expect(errorDetails.code).toBe('IMPORT_FAILED');
    expect(errorDetails.operation).toBe('import');
  });

  test('should log errors with context', async ({ page }) => {
    await page.waitForSelector('#status:has-text("Ready")');
    
    // Clear console logs
    await page.evaluate(() => {
      (window as any).consoleLogs = [];
      const originalError = console.error;
      console.error = (...args: any[]) => {
        (window as any).consoleLogs.push(args.join(' '));
        originalError.apply(console, args);
      };
    });
    
    await page.click('#testQueryError');
    await page.waitForSelector('#errorResult:has-text("QueryExecutionError")');
    
    const logged = await page.evaluate(() => {
      return (window as any).consoleLogs.length > 0;
    });
    
    expect(logged).toBe(true);
  });

  test('should provide error recovery suggestions', async ({ page }) => {
    await page.waitForSelector('#status:has-text("Ready")');
    
    await page.click('#testNotOpenError');
    await page.waitForSelector('#errorResult:has-text("DatabaseNotOpenError")');
    
    const suggestion = await page.evaluate(() => {
      return (window as any).lastError?.suggestion;
    });
    
    expect(suggestion).toBeTruthy();
    expect(suggestion).toContain('open');
  });
});
