/**
 * E2E Test for Web Worker Support with IndexedDB
 * Tests that @npiesco/absurder-sql works correctly inside Web Workers
 * Issue #3: https://github.com/npiesco/absurder-sql/issues/3
 * 
 * This test uses the actual published npm package
 */

import { test, expect } from '@playwright/test';
import { writeFileSync } from 'fs';
import path from 'path';

const VITE_URL = 'http://localhost:3000';

test.describe('Web Worker Support (Issue #3)', () => {
  
  test('should NOT throw "Window unavailable" error when using absurder-sql in Web Worker', async ({ page }) => {
    console.log('🔧 Testing @npiesco/absurder-sql in Web Worker...\n');

    await page.goto(VITE_URL);
    await page.waitForSelector('#leaderBadge', { timeout: 10000 });
    
    // Capture all console messages
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({ type: msg.type(), text });
      console.log(`[${msg.type()}] ${text}`);
    });

    // Test using absurder-sql in a worker
    const workerResult = await page.evaluate(async () => {
      return new Promise((resolve) => {
        try {
          const worker = new Worker('/test-worker.js', { type: 'module' });
          
          worker.onmessage = (e) => {
            console.log('[Main] Worker response:', e.data);
            resolve(e.data);
          };
          
          worker.onerror = (error) => {
            console.error('[Main] Worker error:', error);
            resolve({ success: false, error: error.message });
          };
          
          worker.postMessage({ type: 'init' });
          
          setTimeout(() => {
            resolve({ success: false, error: 'Timeout after 15s' });
          }, 15000);
        } catch (error) {
          resolve({ success: false, error: error.toString() });
        }
      });
    });

    console.log('\n📊 Worker Result:', workerResult);

    // Check for the specific error from Issue #3
    const windowErrors = consoleMessages.filter(msg => 
      msg.text.includes('Window unavailable for IndexedDB') ||
      msg.text.includes('Window object not available') ||
      msg.text.includes('WINDOW_UNAVAILABLE')
    );

    if (windowErrors.length > 0) {
      console.log('\n❌ Found Window errors:');
      windowErrors.forEach(err => console.log(`  - ${err.text}`));
    }

    // ASSERTIONS
    if (!workerResult.success) {
      console.log('\n❌ Worker failed with error:', workerResult.error);
    }
    
    // The worker should succeed
    expect(workerResult.success).toBe(true);
    
    // Should NOT have the window unavailable error
    expect(windowErrors.length).toBe(0);
    
    // Should have retrieved data
    expect(workerResult.rowCount).toBeGreaterThan(0);
    
    console.log('\n✅ Test passed! absurder-sql works in Web Workers');
  });
});
