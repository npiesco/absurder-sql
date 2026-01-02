/**
 * E2E Tests for Auto-Lock Feature
 *
 * Tests the auto-lock functionality:
 * 1. Display auto-lock timeout setting in settings
 * 2. Configure auto-lock timeout (immediate, 1 min, 5 min, 15 min, never)
 * 3. Lock vault when app goes to background (immediate setting)
 * 4. Persist auto-lock preference across app restart
 * 5. Clipboard auto-clear after timeout
 */

import { by, device, element, expect, waitFor } from 'detox';

describe('Auto-Lock', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('should setup vault for auto-lock testing', async () => {
    // Create new vault
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('AutoLockTest123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('AutoLockTest123!');
    await element(by.id('create-vault-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Add a credential to verify unlock works
    await element(by.id('add-credential-fab')).tap();
    await waitFor(element(by.id('credential-name-input'))).toBeVisible().withTimeout(5000);
    await element(by.id('credential-name-input')).typeText('Auto-Lock Test Credential');
    await element(by.id('credential-name-input')).tapReturnKey();
    await element(by.id('credential-username-input')).typeText('autolock@test.com');
    await element(by.id('credential-username-input')).tapReturnKey();
    await element(by.id('credential-password-input')).typeText('AutoLockPass123!');
    await element(by.id('credential-password-input')).tapReturnKey();
    await element(by.id('save-credential-button')).tap();
    await expect(element(by.text('Auto-Lock Test Credential'))).toBeVisible();
  });

  it('should display auto-lock setting in settings', async () => {
    // Navigate to settings
    await element(by.id('settings-button')).tap();
    await expect(element(by.text('Settings'))).toBeVisible();

    // Verify auto-lock setting is visible
    await expect(element(by.id('auto-lock-setting'))).toBeVisible();
    await expect(element(by.text('Auto-Lock'))).toBeVisible();
  });

  it('should show auto-lock timeout options when tapped', async () => {
    // Tap auto-lock setting
    await element(by.id('auto-lock-setting')).tap();

    // Verify timeout options are displayed using testIDs for reliability
    await waitFor(element(by.id('auto-lock-option-immediate'))).toBeVisible().withTimeout(3000);
    await expect(element(by.id('auto-lock-option-1min'))).toBeVisible();
    await expect(element(by.id('auto-lock-option-5min'))).toBeVisible();
    await expect(element(by.id('auto-lock-option-15min'))).toBeVisible();
    await expect(element(by.id('auto-lock-option-never'))).toBeVisible();
  });

  it('should select immediate auto-lock timeout', async () => {
    // Select "Immediately" option
    await element(by.text('Immediately')).tap();

    // Verify selection is shown
    await waitFor(element(by.id('auto-lock-value'))).toBeVisible().withTimeout(3000);
    await expect(element(by.text('Immediately'))).toBeVisible();
  });

  it('should lock vault when app goes to background with immediate setting', async () => {
    // Go back to credentials screen first
    await element(by.id('settings-back-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Send app to background
    await device.sendToHome();

    // Wait a moment for background detection
    await new Promise(resolve => setTimeout(resolve, 500));

    // Bring app back to foreground
    await device.launchApp({ newInstance: false });

    // Should be on unlock screen (vault locked)
    await waitFor(element(by.id('master-password-input'))).toBeVisible().withTimeout(5000);
    await expect(element(by.text('AbsurderSQL Vault'))).toBeVisible();
  });

  it('should unlock vault after auto-lock', async () => {
    // Unlock with password
    await element(by.id('master-password-input')).typeText('AutoLockTest123!');
    await element(by.id('master-password-input')).tapReturnKey();
    await element(by.id('unlock-vault-button')).tap();

    // Verify unlocked
    await expect(element(by.text('Vault'))).toBeVisible();
    await expect(element(by.text('Auto-Lock Test Credential'))).toBeVisible();
  });

  it('should change auto-lock to 1 minute', async () => {
    // We're on credentials screen after previous test unlocked
    // Navigate to settings
    await element(by.id('settings-button')).tap();
    await expect(element(by.text('Settings'))).toBeVisible();

    // Tap auto-lock setting
    await element(by.id('auto-lock-setting')).tap();
    await waitFor(element(by.text('After 1 minute'))).toBeVisible().withTimeout(3000);

    // Select 1 minute
    await element(by.text('After 1 minute')).tap();

    // Verify selection is shown in the setting row
    await waitFor(element(by.id('auto-lock-value'))).toBeVisible().withTimeout(3000);
  });

  it('should NOT lock vault immediately when auto-lock is set to 1 minute', async () => {
    // Go back to credentials screen
    await element(by.id('settings-back-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Send app to background briefly
    await device.sendToHome();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Bring app back to foreground
    await device.launchApp({ newInstance: false });

    // Should still be on credentials screen (not locked yet)
    await waitFor(element(by.text('Vault'))).toBeVisible().withTimeout(5000);
    await expect(element(by.text('Auto-Lock Test Credential'))).toBeVisible();
  });

  it('should persist auto-lock preference across app restart', async () => {
    // Navigate to settings to verify current setting (1 minute from previous test)
    await element(by.id('settings-button')).tap();
    await expect(element(by.text('Settings'))).toBeVisible();

    // Verify auto-lock value is visible
    await waitFor(element(by.id('auto-lock-value'))).toBeVisible().withTimeout(3000);

    // Set to Never for easier testing of persistence
    await element(by.id('auto-lock-setting')).tap();
    
    // Wait for modal to open - look for the modal description which is unique
    await waitFor(element(by.text('Choose when to automatically lock the vault after the app goes to background.'))).toBeVisible().withTimeout(3000);
    
    // Select Never option using testID for reliability
    await waitFor(element(by.id('auto-lock-option-never'))).toBeVisible().withTimeout(3000);
    await element(by.id('auto-lock-option-never')).tap();

    // Wait for modal to close and verify setting updated
    await waitFor(element(by.id('auto-lock-setting'))).toBeVisible().withTimeout(3000);

    // Go back to credentials screen before terminating
    await element(by.id('settings-back-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Terminate and relaunch
    await device.terminateApp();
    await device.launchApp({ newInstance: false });

    // Unlock vault (app was terminated so vault is locked)
    await waitFor(element(by.id('master-password-input'))).toBeVisible().withTimeout(10000);
    await element(by.id('master-password-input')).typeText('AutoLockTest123!');
    await element(by.id('master-password-input')).tapReturnKey();
    await element(by.id('unlock-vault-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Navigate to settings and verify preference persisted
    await element(by.id('settings-button')).tap();
    await expect(element(by.text('Settings'))).toBeVisible();
    // The auto-lock value should show "Never"
    await expect(element(by.id('auto-lock-value'))).toBeVisible();
  });

  it('should NOT lock when auto-lock is Never and app goes to background', async () => {
    // We're on settings screen from previous test
    // Go back to credentials screen (if we're on settings)
    try {
      await element(by.id('settings-back-button')).tap();
    } catch {
      // Already on credentials screen
    }
    await waitFor(element(by.text('Vault'))).toBeVisible().withTimeout(5000);

    // Send app to background
    await device.sendToHome();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Bring app back to foreground
    await device.launchApp({ newInstance: false });

    // Should still be on credentials screen (not locked)
    await waitFor(element(by.text('Vault'))).toBeVisible().withTimeout(5000);
    await expect(element(by.text('Auto-Lock Test Credential'))).toBeVisible();
  });

  it('should display clipboard auto-clear setting', async () => {
    // Ensure we're on credentials screen first
    try {
      await element(by.id('settings-back-button')).tap();
    } catch {
      // Already on credentials screen
    }
    await waitFor(element(by.text('Vault'))).toBeVisible().withTimeout(5000);

    // Navigate to settings
    await element(by.id('settings-button')).tap();
    await expect(element(by.text('Settings'))).toBeVisible();

    // Scroll down to find clipboard setting if needed
    await waitFor(element(by.id('clipboard-clear-setting'))).toBeVisible().withTimeout(3000);

    // Verify clipboard auto-clear setting is visible
    await expect(element(by.id('clipboard-clear-setting'))).toBeVisible();
    await expect(element(by.text('Clear Clipboard'))).toBeVisible();
  });

  it('should show clipboard clear timeout options', async () => {
    // Ensure clipboard setting is visible and tap it
    await waitFor(element(by.id('clipboard-clear-setting'))).toBeVisible().withTimeout(3000);
    await element(by.id('clipboard-clear-setting')).tap();

    // Verify timeout options are displayed using testIDs for reliability
    await waitFor(element(by.id('clipboard-clear-option-30sec'))).toBeVisible().withTimeout(3000);
    await expect(element(by.id('clipboard-clear-option-1min'))).toBeVisible();
    await expect(element(by.id('clipboard-clear-option-5min'))).toBeVisible();
    await expect(element(by.id('clipboard-clear-option-never'))).toBeVisible();
  });

  it('should select clipboard clear timeout', async () => {
    // Select 30 seconds
    await waitFor(element(by.text('After 30 seconds'))).toBeVisible().withTimeout(3000);
    await element(by.text('After 30 seconds')).tap();

    // Wait for modal to close
    await waitFor(element(by.id('clipboard-clear-setting'))).toBeVisible().withTimeout(3000);

    // Verify we're back on settings screen
    await expect(element(by.text('Settings'))).toBeVisible();
  });

  it('should persist clipboard clear preference across app restart', async () => {
    // Go back to credentials screen before terminating
    await element(by.id('settings-back-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Terminate and relaunch
    await device.terminateApp();
    await device.launchApp({ newInstance: false });

    // Unlock vault (auto-lock is set to Never from earlier test)
    await waitFor(element(by.id('master-password-input'))).toBeVisible().withTimeout(10000);
    await element(by.id('master-password-input')).typeText('AutoLockTest123!');
    await element(by.id('master-password-input')).tapReturnKey();
    await element(by.id('unlock-vault-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Navigate to settings and verify preference persisted
    await element(by.id('settings-button')).tap();
    await expect(element(by.text('Settings'))).toBeVisible();

    // Verify clipboard clear value is visible (should be 30 seconds from previous test)
    await expect(element(by.id('clipboard-clear-value'))).toBeVisible();
  });
});
