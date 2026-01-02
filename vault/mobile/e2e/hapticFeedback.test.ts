/**
 * Haptic Feedback E2E Tests (TDD)
 *
 * Tests haptic feedback settings:
 * - Setting visibility in Settings
 * - Toggle on/off
 * - Persistence across restart
 * 
 * Note: Actual haptic vibration cannot be verified in E2E tests,
 * but we can verify the setting UI and persistence.
 */

import {by, device, element, expect, waitFor} from 'detox';

describe('Haptic Feedback Settings', () => {
  beforeAll(async () => {
    await device.launchApp({newInstance: true, delete: true});
    // Create new vault
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('TestPassword123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('TestPassword123!');
    await element(by.id('create-vault-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();
  });

  it('should display haptic feedback setting and toggle it', async () => {
    // Navigate to settings
    await element(by.id('settings-button')).tap();
    
    // Scroll to find haptic setting (it's in Appearance section)
    await waitFor(element(by.id('haptic-feedback-setting')))
      .toBeVisible()
      .whileElement(by.id('settings-scroll'))
      .scroll(100, 'down');
    
    // Verify setting is visible and tap to toggle off
    await element(by.id('haptic-feedback-setting')).tap();
    
    // Verify toggle is now disabled (exists in view hierarchy)
    await expect(element(by.id('haptic-feedback-toggle-disabled'))).toExist();
    
    // Toggle back on
    await element(by.id('haptic-feedback-setting')).tap();
    await expect(element(by.id('haptic-feedback-toggle-enabled'))).toExist();
    
    await element(by.id('settings-back-button')).tap();
  });

  it('should persist haptic feedback preference across app restart', async () => {
    // Disable haptic feedback
    await element(by.id('settings-button')).tap();
    
    // Scroll to haptic setting
    await waitFor(element(by.id('haptic-feedback-setting')))
      .toBeVisible()
      .whileElement(by.id('settings-scroll'))
      .scroll(100, 'down');
    
    await element(by.id('haptic-feedback-setting')).tap();
    await expect(element(by.id('haptic-feedback-toggle-disabled'))).toExist();

    // Restart app
    await device.launchApp({newInstance: true});
    
    // Unlock vault
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('TestPassword123!');
    await element(by.id('unlock-vault-button')).tap();
    
    // Check setting persisted
    await element(by.id('settings-button')).tap();
    
    // Scroll to haptic setting
    await waitFor(element(by.id('haptic-feedback-setting')))
      .toBeVisible()
      .whileElement(by.id('settings-scroll'))
      .scroll(100, 'down');
    
    await expect(element(by.id('haptic-feedback-toggle-disabled'))).toExist();
  });
});
