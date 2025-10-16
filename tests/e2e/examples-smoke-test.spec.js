/**
 * Smoke Tests for Example Files
 * 
 * Verifies that all example HTML files load correctly and don't have
 * JavaScript errors after the Phase 5.2 and 5.3 updates.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8080';

test.describe('Example Files Smoke Tests', () => {
  
  test('sql_demo.html loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    await page.goto(`${BASE_URL}/examples/sql_demo.html`);
    
    // Wait for WASM to initialize
    await page.waitForSelector('#output', { timeout: 10000 });
    
    // Check that demo ran (it shows demo completion message)
    const output = await page.locator('#output').textContent();
    expect(output).toContain('Demo complete');
    
    // Should not have any errors
    expect(errors).toHaveLength(0);
  });

  test('web_demo.html loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    await page.goto(`${BASE_URL}/examples/web_demo.html`);
    
    // Wait for page to load
    await page.waitForSelector('#dbName', { timeout: 10000 });
    
    // Page should load successfully
    const title = await page.title();
    expect(title).toContain('SQLite IndexedDB Demo');
    
    // Should not have any errors
    expect(errors).toHaveLength(0);
  });

  test('multi-tab-demo.html loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    await page.goto(`${BASE_URL}/examples/multi-tab-demo.html`);
    
    // Wait for initialization
    await page.waitForSelector('#leaderBadge', { timeout: 10000 });
    
    // Should show leader badge
    const badge = await page.locator('#leaderBadge').textContent();
    expect(badge).toContain('LEADER');
    
    // Should not have any errors
    expect(errors).toHaveLength(0);
  });

  test('benchmark.html loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    await page.goto(`${BASE_URL}/examples/benchmark.html`);
    
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Page should load successfully
    const h1 = await page.locator('h1').textContent();
    expect(h1).toContain('Benchmark');
    
    // Should not have any errors (module loading errors are ok since absurd-sql may not be installed)
    // Just check that our WASM module doesn't cause errors
    const hasWasmErrors = errors.some(err => err.includes('absurder_sql'));
    expect(hasWasmErrors).toBe(false);
  });

  test('multi-tab-wrapper.js has new methods', async ({ page }) => {
    await page.goto(`${BASE_URL}/examples/multi-tab-demo.html`);
    await page.waitForSelector('#leaderBadge', { timeout: 10000 });
    
    // Check that new methods are available
    const hasNewMethods = await page.evaluate(() => {
      return (
        typeof window.db.enableOptimisticUpdates === 'function' &&
        typeof window.db.enableCoordinationMetrics === 'function' &&
        typeof window.db.getCoordinationMetrics === 'function' &&
        typeof window.db.trackOptimisticWrite === 'function'
      );
    });
    
    expect(hasNewMethods).toBe(true);
  });
});
