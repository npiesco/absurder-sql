/**
 * Error Handling UI E2E Tests (TDD)
 *
 * Tests error messages and handling:
 * - Wrong password error
 * - Password mismatch on create
 * - Empty required fields
 */

import {by, device, element, expect, waitFor} from 'detox';

describe('Error Handling', () => {
  beforeAll(async () => {
    await device.launchApp({newInstance: true, delete: true});
  });

  it('should show error for password mismatch during vault creation', async () => {
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('Password123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('DifferentPassword!');
    await element(by.id('create-vault-button')).tap();
    
    // Should show error message
    await expect(element(by.text('Passwords do not match'))).toBeVisible();
  });

  it('should show error for wrong password on unlock', async () => {
    // Fresh start - create vault first
    await device.launchApp({newInstance: true, delete: true});
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('Password123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('Password123!');
    await element(by.id('create-vault-button')).tap();
    
    await waitFor(element(by.text('Vault')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Lock vault
    await element(by.id('settings-button')).tap();
    await waitFor(element(by.id('lock-vault-button')))
      .toBeVisible()
      .whileElement(by.id('settings-scroll'))
      .scroll(200, 'down');
    await element(by.id('lock-vault-button')).tap();
    
    // Try wrong password
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('WrongPassword!');
    await element(by.id('unlock-vault-button')).tap();
    
    // Should still be on unlock screen (not navigated to credentials)
    await expect(element(by.id('unlock-vault-button'))).toBeVisible();
  });

  it('should show validation error for empty credential name', async () => {
    // Fresh start
    await device.launchApp({newInstance: true, delete: true});
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('Password123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('Password123!');
    await element(by.id('create-vault-button')).tap();
    
    await waitFor(element(by.text('Vault')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Try to add credential without name
    await element(by.id('add-credential-fab')).tap();
    await element(by.id('credential-username-input')).tap();
    await element(by.id('credential-username-input')).replaceText('testuser');
    await element(by.id('save-credential-button')).tap();
    
    // Should show validation error
    await expect(element(by.text('Name is required'))).toBeVisible();
  });
});
