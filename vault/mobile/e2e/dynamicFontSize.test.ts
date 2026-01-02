/**
 * Dynamic Font Size E2E Tests (TDD)
 *
 * Tests font size settings:
 * - Font size setting visibility
 * - Font size options (small, medium, large)
 * - Persistence across restart
 */

import {by, device, element, expect, waitFor} from 'detox';

describe('Dynamic Font Size', () => {
  beforeAll(async () => {
    await device.launchApp({newInstance: true, delete: true});
    // Create vault
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('TestPassword123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('TestPassword123!');
    await element(by.id('create-vault-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();
  });

  it('should display font size setting in Settings', async () => {
    await element(by.id('settings-button')).tap();
    
    // Scroll to find font size setting
    await waitFor(element(by.id('font-size-setting')))
      .toBeVisible()
      .whileElement(by.id('settings-scroll'))
      .scroll(100, 'down');
    
    await expect(element(by.id('font-size-setting'))).toBeVisible();
  });

  it('should show current font size value', async () => {
    // Default should be Medium
    await expect(element(by.id('font-size-value'))).toHaveText('Medium');
  });

  it('should change font size to Large', async () => {
    await element(by.id('font-size-setting')).tap();
    await element(by.id('font-size-option-large')).tap();
    await expect(element(by.id('font-size-value'))).toHaveText('Large');
  });

  it('should change font size to Small', async () => {
    await element(by.id('font-size-setting')).tap();
    await element(by.id('font-size-option-small')).tap();
    await expect(element(by.id('font-size-value'))).toHaveText('Small');
  });

  it('should persist font size across app restart', async () => {
    // Set to Large
    await element(by.id('font-size-setting')).tap();
    await element(by.id('font-size-option-large')).tap();
    
    // Restart app
    await device.launchApp({newInstance: true});
    
    // Unlock vault
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('TestPassword123!');
    await element(by.id('unlock-vault-button')).tap();
    
    // Check setting persisted
    await element(by.id('settings-button')).tap();
    await waitFor(element(by.id('font-size-setting')))
      .toBeVisible()
      .whileElement(by.id('settings-scroll'))
      .scroll(100, 'down');
    
    await expect(element(by.id('font-size-value'))).toHaveText('Large');
  });
});
