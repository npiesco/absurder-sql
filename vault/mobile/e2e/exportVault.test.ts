import { by, device, element, expect, waitFor } from 'detox';

describe('Export Vault', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('should setup vault with credentials for export testing', async () => {
    // Create new vault - tap "Create New" tab
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('ExportTest123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('ExportTest123!');
    await element(by.id('create-vault-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Add a credential to export
    await element(by.id('add-credential-fab')).tap();
    await waitFor(element(by.id('credential-name-input'))).toBeVisible().withTimeout(5000);
    await element(by.id('credential-name-input')).typeText('Export Test Credential');
    await element(by.id('credential-name-input')).tapReturnKey();
    await element(by.id('credential-username-input')).typeText('exportuser');
    await element(by.id('credential-username-input')).tapReturnKey();
    await element(by.id('credential-password-input')).typeText('exportpass123');
    await element(by.id('credential-password-input')).tapReturnKey();
    await element(by.id('save-credential-button')).tap();

    // Verify credential was added
    await expect(element(by.text('Export Test Credential'))).toBeVisible();
  });

  it('should navigate to settings screen', async () => {
    await element(by.id('settings-button')).tap();
    await expect(element(by.text('Settings'))).toBeVisible();
  });

  it('should display export vault button', async () => {
    await expect(element(by.id('export-vault-button'))).toBeVisible();
  });

  it('should show export confirmation dialog when tapping export', async () => {
    await element(by.id('export-vault-button')).tap();
    
    // Verify confirmation dialog appears with expected message
    await expect(element(by.text('Export your encrypted vault database file for backup. The file will remain encrypted with your master password.'))).toBeVisible();
    await expect(element(by.text('Cancel'))).toBeVisible();
    await expect(element(by.text('Export'))).toBeVisible();
  });

  it('should cancel export when tapping cancel', async () => {
    await element(by.text('Cancel')).tap();
    
    // Should still be on settings screen
    await expect(element(by.text('Settings'))).toBeVisible();
    await expect(element(by.id('export-vault-button'))).toBeVisible();
  });

  it('should export vault when tapping export button', async () => {
    await element(by.id('export-vault-button')).tap();
    await expect(element(by.text('Export'))).toBeVisible();
    await element(by.text('Export')).tap();
    
    // Should show success message after export completes
    // The message includes the filename and size, so we check for partial text
    await waitFor(element(by.text('Success'))).toBeVisible().withTimeout(10000);
    await expect(element(by.text('OK'))).toBeVisible();
    await expect(element(by.text('Share'))).toBeVisible();
  });

  it('should dismiss success alert and return to settings', async () => {
    // Dismiss success alert
    await element(by.text('OK')).tap();
    
    // Should still be on settings screen after export
    await expect(element(by.text('Settings'))).toBeVisible();
    await expect(element(by.id('export-vault-button'))).toBeVisible();
  });

  it('should persist export capability across app restart', async () => {
    // Navigate back to credentials
    await element(by.id('settings-back-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();
    
    // Terminate and relaunch
    await device.terminateApp();
    await device.launchApp({ newInstance: false });

    // Unlock vault
    await waitFor(element(by.id('master-password-input'))).toBeVisible().withTimeout(10000);
    await element(by.id('master-password-input')).typeText('ExportTest123!');
    await element(by.id('master-password-input')).tapReturnKey();
    await element(by.id('unlock-vault-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Navigate to settings
    await element(by.id('settings-button')).tap();
    await expect(element(by.text('Settings'))).toBeVisible();

    // Export button should still be available
    await expect(element(by.id('export-vault-button'))).toBeVisible();
  });
});
