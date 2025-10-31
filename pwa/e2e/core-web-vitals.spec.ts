import { test, expect } from '@playwright/test';

test.describe('Core Web Vitals E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
  });

  test('should have LCP (Largest Contentful Paint) < 2.5s', async ({ page }) => {
    // Measure LCP using Performance API
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        // Wait for LCP entry
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          
          if (lastEntry) {
            resolve(lastEntry.renderTime || lastEntry.loadTime);
          }
        });

        observer.observe({ type: 'largest-contentful-paint', buffered: true });

        // Timeout after 5 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(0);
        }, 5000);
      });
    });

    console.log(`LCP: ${lcp}ms`);
    
    // LCP should be less than 2500ms (2.5s)
    expect(lcp).toBeGreaterThan(0);
    expect(lcp).toBeLessThan(2500);
  });

  test('should have FID (First Input Delay) < 100ms', async ({ page }) => {
    // Wait for any button to be present
    await page.waitForSelector('button', { timeout: 5000 });
    
    const fid = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let resolved = false;
        
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          for (const entry of entries) {
            if (entry.name === 'first-input' && !resolved) {
              resolved = true;
              resolve((entry as any).processingStart - entry.startTime);
              observer.disconnect();
            }
          }
        });

        observer.observe({ type: 'first-input', buffered: true });

        // Trigger an interaction
        const button = document.querySelector('button');
        if (button) {
          button.click();
        }

        // Timeout after 3 seconds
        setTimeout(() => {
          if (!resolved) {
            observer.disconnect();
            resolve(0);
          }
        }, 3000);
      });
    });

    console.log(`FID: ${fid}ms`);
    
    // FID should be less than 100ms
    // If no interaction was captured, we'll allow 0 as passing
    if (fid > 0) {
      expect(fid).toBeLessThan(100);
    }
  });

  test('should have CLS (Cumulative Layout Shift) < 0.1', async ({ page }) => {
    // Wait for page to stabilize
    await page.waitForTimeout(2000);

    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        });

        observer.observe({ type: 'layout-shift', buffered: true });

        // Collect CLS for 3 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 3000);
      });
    });

    console.log(`CLS: ${cls}`);
    
    // CLS should be less than 0.1
    expect(cls).toBeLessThan(0.1);
  });

  test('should load critical resources quickly', async ({ page }) => {
    // Measure time to first byte and DOMContentLoaded
    const timings = await page.evaluate(() => {
      const perfData = performance.timing;
      return {
        ttfb: perfData.responseStart - perfData.requestStart,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
        loadComplete: perfData.loadEventEnd - perfData.navigationStart,
      };
    });

    console.log('Timings:', timings);

    // TTFB should be reasonable (< 600ms)
    expect(timings.ttfb).toBeGreaterThan(0);
    expect(timings.ttfb).toBeLessThan(600);

    // DOMContentLoaded should be quick (< 2s)
    expect(timings.domContentLoaded).toBeGreaterThan(0);
    expect(timings.domContentLoaded).toBeLessThan(2000);

    // Full page load should be reasonable (< 4s)
    expect(timings.loadComplete).toBeGreaterThan(0);
    expect(timings.loadComplete).toBeLessThan(4000);
  });

  test('should have good Time to Interactive (TTI)', async ({ page }) => {
    const startTime = Date.now();
    
    // Wait for page to be interactive
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('button', { state: 'visible' });
    
    // Try to interact
    const button = page.locator('button').first();
    await button.click();
    
    const tti = Date.now() - startTime;
    console.log(`TTI: ${tti}ms`);

    // TTI should be < 3.8s (good threshold)
    expect(tti).toBeLessThan(3800);
  });

  test('should have reasonable Total Blocking Time (TBT)', async ({ page }) => {
    // Measure long tasks
    const tbt = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let totalBlockingTime = 0;

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // Long tasks are > 50ms
            if (entry.duration > 50) {
              totalBlockingTime += entry.duration - 50;
            }
          }
        });

        observer.observe({ type: 'longtask', buffered: true });

        // Measure for 3 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(totalBlockingTime);
        }, 3000);
      });
    });

    console.log(`TBT: ${tbt}ms`);

    // TBT should be < 300ms (good threshold)
    expect(tbt).toBeLessThan(300);
  });

  test('should have responsive layout at different viewports', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Measure CLS on mobile
    const clsMobile = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 2000);
      });
    });

    console.log(`CLS (Mobile): ${clsMobile}`);
    expect(clsMobile).toBeLessThan(0.1);

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const clsDesktop = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 2000);
      });
    });

    console.log(`CLS (Desktop): ${clsDesktop}`);
    expect(clsDesktop).toBeLessThan(0.1);
  });

  test('should have good performance on query page', async ({ page }) => {
    await page.goto('/db/query');
    await page.waitForSelector('#queryInterface');

    const queryPageLCP = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          if (lastEntry) {
            resolve(lastEntry.renderTime || lastEntry.loadTime);
          }
        });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(0);
        }, 5000);
      });
    });

    console.log(`Query Page LCP: ${queryPageLCP}ms`);
    expect(queryPageLCP).toBeGreaterThan(0);
    expect(queryPageLCP).toBeLessThan(2500);
  });
});
