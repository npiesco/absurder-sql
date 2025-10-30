import { test, expect } from '@playwright/test';

test.describe('DatabaseProvider E2E', () => {
  test('should provide database context to all components', async ({ page }) => {
    await page.goto('/provider-test');
    await page.waitForSelector('#status', { timeout: 10000 });
    
    // Wait for provider to initialize
    await page.waitForSelector('#status:has-text("Provider ready")', { timeout: 10000 });
    
    // Check that database is available in context
    const hasDb = await page.evaluate(() => {
      return (window as any).contextDb !== null;
    });
    
    expect(hasDb).toBe(true);
  });

  test('should initialize database on app load', async ({ page }) => {
    await page.goto('/provider-test');
    await page.waitForSelector('#status:has-text("Provider ready")', { timeout: 10000 });
    
    const initialized = await page.evaluate(() => {
      return (window as any).dbInitialized === true;
    });
    
    expect(initialized).toBe(true);
  });

  test('should share database instance across components', async ({ page }) => {
    await page.goto('/provider-test');
    await page.waitForSelector('#status:has-text("Provider ready")');
    
    // Component 1 writes data
    await page.click('#component1Write');
    await page.waitForSelector('#component1Result:has-text("Write complete")');
    
    // Component 2 reads the same data
    await page.click('#component2Read');
    await page.waitForSelector('#component2Result:has-text("Read complete")');
    
    const dataMatches = await page.evaluate(() => {
      return (window as any).component2Data === 'shared data';
    });
    
    expect(dataMatches).toBe(true);
  });

  test('should handle database errors in context', async ({ page }) => {
    await page.goto('/provider-test');
    await page.waitForSelector('#status:has-text("Provider ready")');
    
    // Trigger an error
    await page.click('#triggerError');
    
    await page.waitForSelector('#errorDisplay:has-text("Database error")');
    
    const errorCaught = await page.evaluate(() => {
      return (window as any).contextError !== null;
    });
    
    expect(errorCaught).toBe(true);
  });
});
