/**
 * E2E Tests for BLOB Handling
 * 
 * Tests image preview, file download, file upload, size/type display
 * Based on Adminer parity requirement FR-AB1.8
 * Following mobile/INSTRUCTIONS.md discipline
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';

test.describe('BLOB Handling - Image Preview', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/db/browse');
    await page.waitForSelector('#dataBrowser', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
  });

  test('should display image preview for BLOB column with image data', async ({ page }) => {
    // Create table with BLOB column containing image data
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS blob_test');
      await db.execute('CREATE TABLE blob_test (id INTEGER PRIMARY KEY, name TEXT, image BLOB, file_type TEXT)');
      
      // Create small 1x1 red PNG (base64 encoded)
      const pngData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
      const binaryString = atob(pngData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      await db.executeWithParams(
        'INSERT INTO blob_test (name, image, file_type) VALUES (?, ?, ?)',
        [
          { type: 'Text', value: 'test.png' },
          { type: 'Blob', value: Array.from(bytes) },
          { type: 'Text', value: 'image/png' }
        ]
      );
    });

    // Select table
    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=blob_test');
    await page.waitForSelector('table tbody tr');

    // Check for image preview in BLOB column
    const blobCell = page.locator('table tbody tr:first-child td[data-blob-preview]');
    await expect(blobCell).toBeVisible();
    
    // Should show an img tag for image BLOBs
    const img = blobCell.locator('img');
    await expect(img).toBeVisible();
    
    // Image should have blob URL (using URL.createObjectURL)
    const src = await img.getAttribute('src');
    expect(src).toMatch(/^blob:/);
  });

  test('should display file size for BLOB column', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS blob_size_test');
      await db.execute('CREATE TABLE blob_size_test (id INTEGER PRIMARY KEY, data BLOB)');
      
      // Insert 100 byte BLOB
      const bytes = new Uint8Array(100);
      for (let i = 0; i < 100; i++) bytes[i] = i;
      
      await db.executeWithParams('INSERT INTO blob_size_test (data) VALUES (?)', [
        { type: 'Blob', value: Array.from(bytes) }
      ]);
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=blob_size_test');
    await page.waitForSelector('table tbody tr');

    // Should show file size
    const blobCell = page.locator('table tbody tr:first-child td[data-blob-size]');
    const sizeText = await blobCell.textContent();
    expect(sizeText).toContain('100');
    expect(sizeText).toContain('B'); // bytes
  });

  test('should show download button for BLOB column', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS blob_download_test');
      await db.execute('CREATE TABLE blob_download_test (id INTEGER PRIMARY KEY, file BLOB, filename TEXT)');
      
      const bytes = new Uint8Array([1, 2, 3, 4, 5]);
      await db.executeWithParams(
        'INSERT INTO blob_download_test (file, filename) VALUES (?, ?)',
        [
          { type: 'Blob', value: Array.from(bytes) },
          { type: 'Text', value: 'test.bin' }
        ]
      );
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=blob_download_test');
    await page.waitForSelector('table tbody tr');

    // Should show download button
    const downloadBtn = page.locator('table tbody tr:first-child button[data-blob-download]');
    await expect(downloadBtn).toBeVisible();
    
    // Button should have download icon or text
    const btnText = await downloadBtn.textContent();
    expect(btnText?.toLowerCase()).toMatch(/download|↓/);
  });

  test('should handle NULL BLOB values', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS blob_null_test');
      await db.execute('CREATE TABLE blob_null_test (id INTEGER PRIMARY KEY, data BLOB)');
      await db.execute('INSERT INTO blob_null_test (id, data) VALUES (1, NULL)');
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=blob_null_test');
    await page.waitForSelector('table tbody tr');

    // NULL BLOB should show NULL text, not error
    // Column indices: 0=checkbox, 1=rowid, 2=id (primary key), 3=data (BLOB)
    const blobCell = page.locator('table tbody tr:first-child td').nth(3);
    const cellText = await blobCell.textContent();
    expect(cellText).toContain('NULL');
  });
});

test.describe('BLOB Handling - File Upload', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/db/browse');
    await page.waitForSelector('#dataBrowser', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
  });

  test('should show file upload input when editing BLOB cell', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS blob_edit_test');
      await db.execute('CREATE TABLE blob_edit_test (id INTEGER PRIMARY KEY, data BLOB)');
      await db.execute('INSERT INTO blob_edit_test (id, data) VALUES (1, NULL)');
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=blob_edit_test');
    await page.waitForSelector('table tbody tr');

    // Double-click BLOB cell to edit
    // Column indices: 0=checkbox, 1=rowid, 2=id, 3=data
    const blobCell = page.locator('table tbody tr:first-child td').nth(3);
    await blobCell.dblclick();

    // Should show file input
    const fileInput = blobCell.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
  });

  test('should upload file to BLOB column', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS blob_upload_test');
      await db.execute('CREATE TABLE blob_upload_test (id INTEGER PRIMARY KEY, data BLOB)');
      await db.execute('INSERT INTO blob_upload_test (id, data) VALUES (1, NULL)');
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=blob_upload_test');
    await page.waitForSelector('table tbody tr');

    // Create temp file to upload
    const tempFilePath = path.join('/tmp', 'blob_test.txt');
    writeFileSync(tempFilePath, 'Test BLOB content');

    try {
      // Double-click to edit
      // Column indices: 0=checkbox, 1=rowid, 2=id, 3=data
      const blobCell = page.locator('table tbody tr:first-child td').nth(3);
      await blobCell.dblclick();

      // Set file
      const fileInput = blobCell.locator('input[type="file"]');
      await fileInput.setInputFiles(tempFilePath);

      // Press Enter or click save to commit
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Verify BLOB was saved - should show file size
      const cellText = await blobCell.textContent();
      expect(cellText).toMatch(/\d+\s*B/); // Should show size in bytes
    } finally {
      unlinkSync(tempFilePath);
    }
  });

  test('should show file info after upload', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS blob_info_test');
      await db.execute('CREATE TABLE blob_info_test (id INTEGER PRIMARY KEY, file BLOB, file_name TEXT, file_type TEXT)');
      
      const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      await db.executeWithParams(
        'INSERT INTO blob_info_test (file, file_name, file_type) VALUES (?, ?, ?)',
        [
          { type: 'Blob', value: Array.from(bytes) },
          { type: 'Text', value: 'hello.txt' },
          { type: 'Text', value: 'text/plain' }
        ]
      );
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=blob_info_test');
    await page.waitForSelector('table tbody tr');

    // Should show filename
    // Column indices: 0=checkbox, 1=rowid, 2=id, 3=file (BLOB), 4=file_name, 5=file_type
    const filenameCell = page.locator('table tbody tr:first-child td').nth(4);
    const filename = await filenameCell.textContent();
    expect(filename).toContain('hello.txt');

    // Should show file type
    const typeCell = page.locator('table tbody tr:first-child td').nth(5);
    const fileType = await typeCell.textContent();
    expect(fileType).toContain('text/plain');
  });
});

test.describe('BLOB Handling - File Download', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/db/browse');
    await page.waitForSelector('#dataBrowser', { timeout: 10000 });
    await page.waitForFunction(() => window.Database && typeof window.Database.newDatabase === 'function', { timeout: 10000 });
    await page.waitForFunction(() => (window as any).testDb, { timeout: 10000 });
  });

  test('should download BLOB data when download button clicked', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).testDb;
      await db.execute('DROP TABLE IF EXISTS blob_dl_test');
      await db.execute('CREATE TABLE blob_dl_test (id INTEGER PRIMARY KEY, data BLOB, filename TEXT)');
      
      const testData = new TextEncoder().encode('Test download content');
      await db.executeWithParams(
        'INSERT INTO blob_dl_test (data, filename) VALUES (?, ?)',
        [
          { type: 'Blob', value: Array.from(testData) },
          { type: 'Text', value: 'download.txt' }
        ]
      );
    });

    await page.click('#refreshTables');
    await page.waitForTimeout(500);
    await page.click('#tableSelect');
    await page.click('text=blob_dl_test');
    await page.waitForSelector('table tbody tr');

    // Click download button
    const downloadPromise = page.waitForEvent('download');
    const downloadBtn = page.locator('table tbody tr:first-child button[data-blob-download]');
    await downloadBtn.click();
    
    const download = await downloadPromise;
    
    // Verify download
    const suggestedFilename = download.suggestedFilename();
    // Filename is blob-{rowid}-{columnname}.bin
    expect(suggestedFilename).toMatch(/^blob-\d+-data\.bin$/);
    
    // Verify content
    const downloadPath = await download.path();
    const content = readFileSync(downloadPath!, 'utf-8');
    expect(content).toBe('Test download content');
  });
});

// Cleanup after all tests
test.afterEach(async ({ page }) => {
  await page.evaluate(async () => {
    const db = (window as any).testDb;
    const tables = ['blob_test', 'blob_size_test', 'blob_download_test', 'blob_null_test', 
                    'blob_edit_test', 'blob_upload_test', 'blob_info_test', 'blob_dl_test'];
    for (const table of tables) {
      try {
        await db.execute(`DROP TABLE IF EXISTS ${table}`);
      } catch (e) {
        // Ignore errors
      }
    }
  });
});
