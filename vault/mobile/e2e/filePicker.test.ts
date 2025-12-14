/**
 * E2E Tests for File Picker Integration
 *
 * Tests the import modal with Browse Files and Recent Backups options.
 * Note: System file picker (Browse Files) cannot be tested with Detox,
 * so we focus on Recent Backups functionality.
 */

import { by, device, element, expect, waitFor } from 'detox';

describe('File Picker', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('should setup vault with credentials for export', async () => {
    // Create new vault
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('FilePickerTest123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('FilePickerTest123!');
    await element(by.id('create-vault-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Add credential
    await element(by.id('add-credential-fab')).tap();
    await waitFor(element(by.id('credential-name-input'))).toBeVisible().withTimeout(5000);
    await element(by.id('credential-name-input')).typeText('File Picker Test');
    await element(by.id('credential-name-input')).tapReturnKey();
    await element(by.id('credential-username-input')).typeText('filepicker@test.com');
    await element(by.id('credential-username-input')).tapReturnKey();
    await element(by.id('credential-password-input')).typeText('FilePickerPass123!');
    await element(by.id('credential-password-input')).tapReturnKey();
    await element(by.id('save-credential-button')).tap();
    await expect(element(by.text('File Picker Test'))).toBeVisible();
  });

  it('should export vault to create backup file', async () => {
    // Navigate to settings
    await element(by.id('settings-button')).tap();
    await expect(element(by.text('Settings'))).toBeVisible();

    // Export vault
    await element(by.id('export-vault-button')).tap();
    await expect(element(by.text('Export'))).toBeVisible();
    await element(by.text('Export')).tap();

    // Wait for success
    await waitFor(element(by.text('Success'))).toBeVisible().withTimeout(10000);
    await element(by.text('OK')).tap();

    // Navigate back
    await element(by.id('settings-back-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();
  });

  it('should display import modal with Browse Files and Recent Backups options', async () => {
    // Navigate to settings
    await element(by.id('settings-button')).tap();
    await waitFor(element(by.text('Settings')))
      .toBeVisible()
      .withTimeout(5000);

    // Scroll to make import button visible and tap
    await waitFor(element(by.id('import-vault-button')))
      .toBeVisible()
      .whileElement(by.id('settings-scroll'))
      .scroll(200, 'down');
    await element(by.id('import-vault-button')).tap();

    // Wait for modal to appear
    await waitFor(element(by.text('Browse Files')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.text('Recent Backups'))).toBeVisible();
    await expect(element(by.text('Cancel'))).toBeVisible();
  });

  it('should cancel import modal', async () => {
    // Cancel and verify we're back on settings
    await element(by.text('Cancel')).tap();
    await expect(element(by.text('Settings'))).toBeVisible();
    await expect(element(by.id('import-vault-button'))).toBeVisible();
  });

  it('should show recent backups list when tapping Recent Backups', async () => {
    // Open import modal again
    await element(by.id('import-vault-button')).tap();
    
    // Tap Recent Backups
    await element(by.text('Recent Backups')).tap();

    // Should show list of backup files
    await waitFor(element(by.id('backup-file-list'))).toBeVisible().withTimeout(5000);
    
    // Should show at least one backup file (from our export)
    await expect(element(by.id('backup-file-item-0'))).toBeVisible();
  });

  it('should cancel backup list and return to settings', async () => {
    await element(by.id('backup-cancel-button')).tap();
    await expect(element(by.text('Settings'))).toBeVisible();
    
    // Navigate back to credentials for next test
    await element(by.id('settings-back-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();
  });

  it('should delete credential to simulate data loss', async () => {
    // Delete the credential
    await element(by.text('File Picker Test')).longPress();
    await waitFor(element(by.text('Delete Credential'))).toBeVisible().withTimeout(3000);
    await element(by.text('Delete')).tap();
    await waitFor(element(by.text('File Picker Test'))).not.toBeVisible().withTimeout(5000);
  });

  it('should import from recent backup to restore data', async () => {
    // Navigate to settings
    await element(by.id('settings-button')).tap();
    await waitFor(element(by.text('Settings')))
      .toBeVisible()
      .withTimeout(5000);

    // Scroll to import button and tap
    await waitFor(element(by.id('import-vault-button')))
      .toBeVisible()
      .whileElement(by.id('settings-scroll'))
      .scroll(200, 'down');
    await element(by.id('import-vault-button')).tap();

    // Wait for modal and tap Recent Backups
    await waitFor(element(by.text('Recent Backups')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text('Recent Backups')).tap();

    // Select backup file
    await waitFor(element(by.id('backup-file-item-0'))).toBeVisible().withTimeout(5000);
    await element(by.id('backup-file-item-0')).tap();

    // Wait for import success
    await waitFor(element(by.text('Import Successful'))).toBeVisible().withTimeout(15000);
    await element(by.text('OK')).tap();
  });

  it('should verify credential was restored from backup', async () => {
    // Navigate back to credentials
    await element(by.id('settings-back-button')).tap();
    await waitFor(element(by.text('Vault')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify credential was restored
    await waitFor(element(by.text('File Picker Test')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should persist restored data across app restart', async () => {
    // Terminate and relaunch
    await device.terminateApp();
    await device.launchApp({ newInstance: false });

    // Unlock vault
    await waitFor(element(by.id('master-password-input'))).toBeVisible().withTimeout(10000);
    await element(by.id('master-password-input')).typeText('FilePickerTest123!');
    await element(by.id('master-password-input')).tapReturnKey();
    await element(by.id('unlock-vault-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Verify credential still present
    await expect(element(by.text('File Picker Test'))).toBeVisible();
  });
});
