/**
 * High Contrast Mode E2E Tests (TDD)
 *
 * Tests high contrast accessibility setting:
 * - Setting visibility
 * - Toggle on/off
 * - Persistence across restart
 */

import {by, device, element, expect, waitFor} from 'detox';

describe('High Contrast Mode', () => {
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

  it('should display high contrast setting in Settings', async () => {
    await element(by.id('settings-button')).tap();
    
    // Scroll to find high contrast setting
    await waitFor(element(by.id('high-contrast-setting')))
      .toBeVisible()
      .whileElement(by.id('settings-scroll'))
      .scroll(100, 'down');
    
    await expect(element(by.id('high-contrast-setting'))).toBeVisible();
  });

  it('should show high contrast toggle disabled by default', async () => {
    await expect(element(by.id('high-contrast-toggle-disabled'))).toExist();
  });

  it('should toggle high contrast on', async () => {
    await element(by.id('high-contrast-setting')).tap();
    await expect(element(by.id('high-contrast-toggle-enabled'))).toExist();
  });

  it('should persist high contrast across app restart', async () => {
    // High contrast is now enabled from previous test
    
    // Restart app
    await device.launchApp({newInstance: true});
    
    // Unlock vault
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('TestPassword123!');
    await element(by.id('unlock-vault-button')).tap();
    
    // Check setting persisted
    await element(by.id('settings-button')).tap();
    await waitFor(element(by.id('high-contrast-setting')))
      .toBeVisible()
      .whileElement(by.id('settings-scroll'))
      .scroll(100, 'down');
    
    await expect(element(by.id('high-contrast-toggle-enabled'))).toExist();
  });
});
