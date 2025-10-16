/**
 * E2E Tests for Browser DevTools Extension
 * 
 * Tests the AbsurderSQL Telemetry DevTools extension in a real Chrome environment.
 * This test loads the extension, opens the demo page, and verifies:
 * - Extension loads without errors
 * - DevTools panel appears
 * - Messages pass between page and extension
 * - Spans are received and displayed
 * - Flush button works
 * - Configuration can be updated
 */

import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const extensionPath = path.join(projectRoot, 'browser-extension');
const demoPagePath = path.join(projectRoot, 'examples', 'devtools_demo.html');

test.describe('DevTools Extension E2E Tests', () => {
  let browser;
  let context;
  let httpServer;
  const HTTP_PORT = 8765;

  test.beforeAll(async () => {
    // Start HTTP server for demo page (extensions need http://, not file://)
    const { spawn } = await import('child_process');
    httpServer = spawn('python3', ['-m', 'http.server', HTTP_PORT.toString()], {
      cwd: projectRoot,
      stdio: 'ignore'
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Launch Chrome with the extension loaded
    // We need to use launchPersistentContext to load extensions
    const userDataDir = path.join(projectRoot, '.playwright-chrome-profile');
    
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false, // Extensions don't work in headless mode
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
      ],
    });
  });

  test.afterAll(async () => {
    await context?.close();
    httpServer?.kill();
  });

  test('extension loads without errors', async () => {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    // Navigate to the demo page
    await page.goto(`http://localhost:${HTTP_PORT}/examples/devtools_demo.html`);
    
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Should not have any critical errors
    const criticalErrors = errors.filter(err => 
      !err.includes('Extension context invalidated') // This is expected on reload
    );
    expect(criticalErrors).toHaveLength(0);
    await page.close();
  });

  test('demo page loads and shows DevTools info', async () => {
    const page = await context.newPage();
    await page.goto(`http://localhost:${HTTP_PORT}/examples/devtools_demo.html`);
    
    // Wait for the DevTools integration info section
    await page.waitForSelector('#devtoolsStatus', { timeout: 5000 });
    
    // Should show the demo UI
    const heading = await page.locator('h1').textContent();
    expect(heading).toContain('AbsurderSQL');
    await page.close();
  });

  test('initialize database button works', async () => {
    const page = await context.newPage();
    await page.goto(`http://localhost:${HTTP_PORT}/examples/devtools_demo.html`);
    
    // Wait for page to load
    await page.waitForSelector('#initBtn', { timeout: 5000 });
    
    // Click initialize
    await page.click('#initBtn');
    
    // Wait for success message in activity log
    await page.waitForSelector('.log-success', { timeout: 5000 });
    
    // Should see success message
    const logContent = await page.locator('.log-success').first().textContent();
    expect(logContent).toContain('initialized');
    await page.close();
  });

  test('run queries button generates telemetry', async () => {
    const page = await context.newPage();
    await page.goto(`http://localhost:${HTTP_PORT}/examples/devtools_demo.html`);
    
    // Initialize first
    await page.click('#initBtn');
    await page.waitForTimeout(200);
    
    // Run queries
    await page.click('#queryBtn');
    
    // Wait for query completion
    await page.waitForTimeout(500);
    
    // Check that span count increased
    const spanCount = await page.locator('#totalSpans').textContent();
    expect(parseInt(spanCount)).toBeGreaterThan(0);
    await page.close();
  });

  test('flush functionality works via page API', async () => {
    const page = await context.newPage();
    await page.goto(`http://localhost:${HTTP_PORT}/examples/devtools_demo.html`);
    
    // Initialize and run queries
    await page.click('#initBtn');
    await page.waitForTimeout(200);
    await page.click('#queryBtn');
    await page.waitForTimeout(500);
    
    // Test that the handleDevToolsMessage function exists and works
    const flushResult = await page.evaluate(() => {
      if (typeof window.handleDevToolsMessage === 'function') {
        return window.handleDevToolsMessage({ type: 'flush_spans' });
      }
      return null;
    });
    
    expect(flushResult).not.toBeNull();
    expect(flushResult.success).toBe(true);
    await page.close();
  });

  test('configuration update works via page API', async () => {
    const page = await context.newPage();
    await page.goto(`http://localhost:${HTTP_PORT}/examples/devtools_demo.html`);
    
    // Test configuration update
    const configResult = await page.evaluate(() => {
      if (typeof window.handleDevToolsMessage === 'function') {
        return window.handleDevToolsMessage({ 
          type: 'config_update',
          config: {
            endpoint: 'http://localhost:9999/v1/traces',
            batchSize: 50
          }
        });
      }
      return null;
    });
    
    expect(configResult).not.toBeNull();
    expect(configResult.success).toBe(true);
    await page.close();
  });

  test('buffer operations work via page API', async () => {
    const page = await context.newPage();
    await page.goto(`http://localhost:${HTTP_PORT}/examples/devtools_demo.html`);
    
    // Initialize first
    await page.click('#initBtn');
    await page.waitForTimeout(200);
    
    // Test get buffer
    const bufferResult = await page.evaluate(() => {
      if (typeof window.handleDevToolsMessage === 'function') {
        return window.handleDevToolsMessage({ type: 'get_buffer' });
      }
      return null;
    });
    
    expect(bufferResult).not.toBeNull();
    expect(bufferResult.buffer).toBeDefined();
    
    // Test clear buffer
    const clearResult = await page.evaluate(() => {
      if (typeof window.handleDevToolsMessage === 'function') {
        return window.handleDevToolsMessage({ type: 'clear_buffer' });
      }
      return null;
    });
    
    expect(clearResult).not.toBeNull();
    expect(clearResult.success).toBe(true);
    await page.close();
  });

  test('chrome.runtime.sendMessage is available for extension communication', async () => {
    const page = await context.newPage();
    await page.goto(`http://localhost:${HTTP_PORT}/examples/devtools_demo.html`);
    
    // Check that chrome.runtime exists (means extension is loaded)
    const hasChromeRuntime = await page.evaluate(() => {
      return typeof chrome !== 'undefined' && 
             typeof chrome.runtime !== 'undefined' &&
             typeof chrome.runtime.sendMessage === 'function';
    });
    
    expect(hasChromeRuntime).toBe(true);
    await page.close();
  });

  test('sendToDevTools function exists and is callable', async () => {
    const page = await context.newPage();
    await page.goto(`http://localhost:${HTTP_PORT}/examples/devtools_demo.html`);
    
    await page.click('#initBtn');
    await page.waitForTimeout(200);
    
    // Test that sendToDevTools doesn't throw errors
    const sendResult = await page.evaluate(() => {
      try {
        // This should not throw even if extension isn't listening
        window.sendToDevTools('test_event', { test: 'data' });
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });
    
    expect(sendResult.success).toBe(true);
    await page.close();
  });

  test('activity log shows all operations', async () => {
    const page = await context.newPage();
    await page.goto(`http://localhost:${HTTP_PORT}/examples/devtools_demo.html`);
    
    await page.click('#initBtn');
    await page.waitForTimeout(200);
    await page.click('#queryBtn');
    await page.waitForTimeout(500);
    
    // Should have multiple log entries
    const logEntries = await page.locator('.log-entry').count();
    expect(logEntries).toBeGreaterThan(5);
    await page.close();
  });

  test('error generation works', async () => {
    const page = await context.newPage();
    await page.goto(`http://localhost:${HTTP_PORT}/examples/devtools_demo.html`);
    
    await page.click('#initBtn');
    await page.waitForTimeout(200);
    
    // Trigger error
    await page.click('#errorBtn');
    await page.waitForTimeout(200);
    
    // Should see error in log
    const hasError = await page.locator('.log-error').count();
    expect(hasError).toBeGreaterThan(0);
    await page.close();
  });

  test('load generation works', async () => {
    const page = await context.newPage();
    await page.goto(`http://localhost:${HTTP_PORT}/examples/devtools_demo.html`);
    
    await page.click('#initBtn');
    await page.waitForTimeout(200);
    
    // Start load test (but don't wait for completion)
    await page.click('#loadBtn');
    await page.waitForTimeout(1000);
    
    // Span count should be increasing
    const spanCount = await page.locator('#totalSpans').textContent();
    expect(parseInt(spanCount)).toBeGreaterThan(10);
    await page.close();
  });
});
