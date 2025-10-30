import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Drag-and-Drop Import E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/db');
    await page.waitForSelector('#dbManagement', { timeout: 10000 });
  });

  test('should display drop zone', async ({ page }) => {
    const dropZone = await page.locator('#dropZone');
    await expect(dropZone).toBeVisible();
  });

  test('should show drop zone hint text', async ({ page }) => {
    const hint = await page.textContent('#dropZone');
    expect(hint?.toLowerCase()).toContain('drag');
    expect(hint?.toLowerCase()).toContain('drop');
  });

  test('should highlight drop zone on drag over', async ({ page }) => {
    // Wait for database to be ready
    await page.waitForSelector('#exportDbButton:not([disabled])');
    
    // Create a test database file
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS drag_test');
      await db.execute('CREATE TABLE drag_test (id INTEGER, data TEXT)');
      await db.execute('INSERT INTO drag_test VALUES (1, ?)', [{ type: 'Text', value: 'test' }]);
    });

    // Export to get a file
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportDbButton');
    const download = await downloadPromise;
    
    // Simulate drag over with proper dataTransfer
    await page.evaluate(() => {
      const dropZone = document.querySelector('#dropZone');
      const event = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer()
      });
      dropZone?.dispatchEvent(event);
    });
    
    // Wait a bit for styling to apply
    await page.waitForTimeout(100);
    
    // Check if drop zone has active class
    const hasActiveClass = await page.locator('#dropZone').evaluate((el) => {
      return el.classList.contains('drag-over') || el.classList.contains('border-blue-500');
    });
    
    expect(hasActiveClass).toBe(true);
  });

  test('should import database on file drop', async ({ page }) => {
    // Wait for database to be ready
    await page.waitForSelector('#exportDbButton:not([disabled])');
    
    // Create test data and export
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS drop_import_test');
      await db.execute('CREATE TABLE drop_import_test (id INTEGER, data TEXT)');
      await db.execute('INSERT INTO drop_import_test VALUES (1, ?)', [{ type: 'Text', value: 'Dropped' }]);
    });

    // Export the database
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportDbButton');
    const download = await downloadPromise;
    const downloadPath = await download.path();
    
    if (!downloadPath) {
      throw new Error('Download path is null');
    }

    // Read the file using Node.js fs (this runs in Node context, not browser)
    const fs = await import('fs');
    const fileBuffer = fs.readFileSync(downloadPath);
    const fileArray = Array.from(fileBuffer);
    
    // Simulate file drop with real file data
    await page.evaluate(async (fileData: number[]) => {
      const uint8Array = new Uint8Array(fileData);
      const blob = new Blob([uint8Array], { type: 'application/x-sqlite3' });
      const file = new File([blob], 'dropped.db', { type: 'application/x-sqlite3' });
      
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      
      const dropZone = document.querySelector('#dropZone');
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dataTransfer
      });
      
      dropZone?.dispatchEvent(dropEvent);
    }, fileArray);

    // Wait for import to complete
    await page.waitForSelector('#status:has-text("Import complete")', { timeout: 5000 });

    // Verify the data was imported
    const hasData = await page.evaluate(async () => {
      const db = (window as any).testDb;
      try {
        const result = await db.execute('SELECT * FROM drop_import_test WHERE id = 1');
        return result.rows.length > 0;
      } catch (err) {
        console.error('Verification error:', err);
        return false;
      }
    });

    expect(hasData).toBe(true);

    // Cleanup
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS drop_import_test');
    });
  });

  test('should handle invalid file drop', async ({ page }) => {
    // Create a non-database file
    await page.evaluate(() => {
      const file = new File(['invalid content'], 'test.txt', { type: 'text/plain' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      
      const dropZone = document.querySelector('#dropZone');
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dataTransfer
      });
      
      dropZone?.dispatchEvent(dropEvent);
    });

    // Should show error
    await page.waitForTimeout(1000);
    const status = await page.textContent('#status');
    expect(status?.toLowerCase()).toContain('error');
  });

  test('should remove drag-over styling on drag leave', async ({ page }) => {
    // Trigger drag over
    await page.dispatchEvent('#dropZone', 'dragover');
    
    // Trigger drag leave
    await page.dispatchEvent('#dropZone', 'dragleave');
    
    // Check if active class is removed
    const hasActiveClass = await page.locator('#dropZone').evaluate((el) => {
      return el.classList.contains('drag-over') || el.classList.contains('border-blue-500');
    });
    
    expect(hasActiveClass).toBe(false);
  });
});
