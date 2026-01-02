/**
 * Theme Toggle E2E Tests
 *
 * Tests dark/light theme toggle functionality:
 * - Theme setting visibility in Settings
 * - Theme picker modal
 * - Theme selection (light, dark, system)
 * - Theme persistence
 */

import {by, device, element, expect} from 'detox';

describe('Theme Toggle', () => {
  beforeAll(async () => {
    await device.launchApp({newInstance: true, delete: true});
    // Create new vault on first launch
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('TestPassword123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('TestPassword123!');
    await element(by.id('create-vault-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();
  });

  it('should display theme setting in Settings', async () => {
    await element(by.id('settings-button')).tap();
    await expect(element(by.id('theme-setting'))).toBeVisible();
    await element(by.id('settings-back-button')).tap();
  });

  it('should show current theme value', async () => {
    await element(by.id('settings-button')).tap();
    await expect(element(by.id('theme-value'))).toBeVisible();
    await element(by.id('settings-back-button')).tap();
  });

  it('should open theme picker modal', async () => {
    await element(by.id('settings-button')).tap();
    await element(by.id('theme-setting')).tap();
    await expect(element(by.id('theme-option-light'))).toBeVisible();
    await expect(element(by.id('theme-option-dark'))).toBeVisible();
    await expect(element(by.id('theme-option-system'))).toBeVisible();
    // Cancel to close modal
    await element(by.text('Cancel')).tap();
    await element(by.id('settings-back-button')).tap();
  });

  it('should select light theme', async () => {
    await element(by.id('settings-button')).tap();
    await element(by.id('theme-setting')).tap();
    await element(by.id('theme-option-light')).tap();
    await expect(element(by.id('theme-value'))).toHaveText('Light');
    await element(by.id('settings-back-button')).tap();
  });

  it('should select dark theme', async () => {
    await element(by.id('settings-button')).tap();
    await element(by.id('theme-setting')).tap();
    await element(by.id('theme-option-dark')).tap();
    await expect(element(by.id('theme-value'))).toHaveText('Dark');
    await element(by.id('settings-back-button')).tap();
  });

  it('should select system theme', async () => {
    await element(by.id('settings-button')).tap();
    await element(by.id('theme-setting')).tap();
    await element(by.id('theme-option-system')).tap();
    await expect(element(by.id('theme-value'))).toHaveText('System');
    await element(by.id('settings-back-button')).tap();
  });

  it('should persist theme preference across app restart', async () => {
    // Set to dark theme
    await element(by.id('settings-button')).tap();
    await element(by.id('theme-setting')).tap();
    await element(by.id('theme-option-dark')).tap();
    await expect(element(by.id('theme-value'))).toHaveText('Dark');

    // Restart app (don't delete data to preserve theme preference)
    await device.launchApp({newInstance: true});
    
    // Unlock existing vault
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('TestPassword123!');
    await element(by.id('unlock-vault-button')).tap();
    
    // Check theme persisted
    await element(by.id('settings-button')).tap();
    await expect(element(by.id('theme-value'))).toHaveText('Dark');
  });
});
