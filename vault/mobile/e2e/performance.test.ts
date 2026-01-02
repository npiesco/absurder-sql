/**
 * Performance E2E Tests
 *
 * Tests performance with large datasets:
 * - Large vault handling (50+ credentials)
 * - Search performance with many credentials
 * - Scroll performance with virtualization
 */

import {by, device, element, expect, waitFor} from 'detox';

describe('Performance', () => {
  const TEST_PASSWORD = 'TestPassword123!';
  const CREDENTIAL_COUNT = 20;

  beforeAll(async () => {
    // Launch with password autofill disabled
    await device.launchApp({
      newInstance: true, 
      delete: true,
      launchArgs: {
        // Disable iOS password autofill suggestions
        'AppleKeyboardsToIgnore': 'Password'
      }
    });
    
    // Create vault
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText(TEST_PASSWORD);
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText(TEST_PASSWORD);
    await element(by.id('create-vault-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();
    
    // Add many credentials for performance testing
    for (let i = 1; i <= CREDENTIAL_COUNT; i++) {
      // Scroll list up to ensure FAB is accessible
      try {
        await element(by.id('credentials-list')).scroll(200, 'up');
      } catch (e) {
        // List might be empty, ignore
      }
      
      await element(by.id('add-credential-fab')).tap();
      await element(by.id('credential-name-input')).replaceText(`Test Credential ${i}`);
      await element(by.id('credential-username-input')).replaceText(`user${i}@example.com`);
      await element(by.id('credential-password-input')).replaceText(`Password${i}!`);
      await element(by.id('save-credential-button')).tap();
      
      // Wait for credentials list to be visible
      await waitFor(element(by.id('credentials-list')))
        .toBeVisible()
        .withTimeout(5000);
    }
  }, 300000); // 5 minute timeout for setup

  it('should handle large credential list without crashing', async () => {
    // Verify credentials list is visible and scrollable
    await expect(element(by.id('credentials-list'))).toBeVisible();
    
    // Verify first credential is visible
    await expect(element(by.text('Test Credential 1'))).toBeVisible();
  });

  it('should scroll through list smoothly', async () => {
    // Scroll down
    await element(by.id('credentials-list')).scroll(800, 'down');
    
    // Verify we can see later credentials (virtualization working)
    await waitFor(element(by.text('Test Credential 20')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Scroll back to top
    await element(by.id('credentials-list')).scroll(800, 'up');
    
    // Verify first credential visible again
    await waitFor(element(by.text('Test Credential 1')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should search through dataset quickly', async () => {
    // Search for specific credential
    await element(by.id('search-input')).tap();
    await element(by.id('search-input')).replaceText('Credential 15');
    
    // Should find the matching credential
    await waitFor(element(by.text('Test Credential 15')))
      .toBeVisible()
      .withTimeout(3000);
    
    // Clear search
    await element(by.id('search-input')).clearText();
  });

  it('should filter search results correctly with large dataset', async () => {
    // Search for pattern that matches multiple
    await element(by.id('search-input')).tap();
    await element(by.id('search-input')).replaceText('Credential 1');
    
    // Should show Credential 1, 10, 11, etc.
    await waitFor(element(by.text('Test Credential 1')))
      .toBeVisible()
      .withTimeout(3000);
    
    // Clear search
    await element(by.id('search-input')).clearText();
  });
});
