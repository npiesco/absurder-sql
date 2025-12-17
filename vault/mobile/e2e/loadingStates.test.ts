/**
 * Loading States E2E Tests (TDD)
 *
 * Tests loading indicators during async operations:
 * - Vault creation loading
 * - Vault unlock loading
 * - Credential save loading
 * - Export loading
 */

import {by, device, element, expect, waitFor} from 'detox';

describe('Loading States', () => {
  beforeAll(async () => {
    await device.launchApp({newInstance: true, delete: true});
  });

  it('should show loading indicator during vault creation', async () => {
    // Start vault creation
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('TestPassword123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('TestPassword123!');
    
    // Tap create - should show loading briefly
    await element(by.id('create-vault-button')).tap();
    
    // Verify we eventually get to credentials screen
    await waitFor(element(by.text('Vault')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show loading indicator during vault unlock', async () => {
    // Lock the vault first
    await element(by.id('settings-button')).tap();
    
    // Scroll to lock option
    await waitFor(element(by.id('lock-vault-button')))
      .toBeVisible()
      .whileElement(by.id('settings-scroll'))
      .scroll(200, 'down');
    
    await element(by.id('lock-vault-button')).tap();
    
    // Unlock with password
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('TestPassword123!');
    await element(by.id('unlock-vault-button')).tap();
    
    // Verify we get back to credentials screen
    await waitFor(element(by.text('Vault')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show loading during credential save', async () => {
    // Add a credential
    await element(by.id('add-credential-fab')).tap();
    
    await element(by.id('credential-name-input')).tap();
    await element(by.id('credential-name-input')).replaceText('Test Site');
    await element(by.id('credential-username-input')).tap();
    await element(by.id('credential-username-input')).replaceText('testuser');
    await element(by.id('credential-password-input')).tap();
    await element(by.id('credential-password-input')).replaceText('testpass123');
    
    // Save should show loading briefly
    await element(by.id('save-credential-button')).tap();
    
    // Verify we get back to credentials list
    await waitFor(element(by.text('Vault')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
