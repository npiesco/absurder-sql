/**
 * E2E Tests for Import Vault functionality
 *
 * Tests import vault from file with round-trip verification:
 * 1. Create vault with credentials
 * 2. Export vault to file
 * 3. Delete credentials from vault
 * 4. Import from exported file (same vault, same encryption key)
 * 5. Verify all data was restored correctly
 * 
 * Note: Import works within the same vault (same encryption key).
 * Cross-vault import requires the exported file to be unencrypted or
 * re-encrypted with the destination vault's key.
 */

import { by, device, element, expect, waitFor } from 'detox';

describe('Import Vault', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('should setup vault with credentials for export', async () => {
    // Create new vault
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('ImportTest123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('ImportTest123!');
    await element(by.id('create-vault-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Add first credential
    await element(by.id('add-credential-fab')).tap();
    await waitFor(element(by.id('credential-name-input'))).toBeVisible().withTimeout(5000);
    await element(by.id('credential-name-input')).typeText('Round Trip Account');
    await element(by.id('credential-name-input')).tapReturnKey();
    await element(by.id('credential-username-input')).typeText('roundtrip@test.com');
    await element(by.id('credential-username-input')).tapReturnKey();
    await element(by.id('credential-password-input')).typeText('RoundTripPass123!');
    await element(by.id('credential-password-input')).tapReturnKey();
    await element(by.id('save-credential-button')).tap();
    await expect(element(by.text('Round Trip Account'))).toBeVisible();

    // Add second credential
    await element(by.id('add-credential-fab')).tap();
    await waitFor(element(by.id('credential-name-input'))).toBeVisible().withTimeout(5000);
    await element(by.id('credential-name-input')).typeText('Second Account');
    await element(by.id('credential-name-input')).tapReturnKey();
    await element(by.id('credential-username-input')).typeText('second@test.com');
    await element(by.id('credential-username-input')).tapReturnKey();
    await element(by.id('credential-password-input')).typeText('SecondPass456!');
    await element(by.id('credential-password-input')).tapReturnKey();
    await element(by.id('save-credential-button')).tap();
    await expect(element(by.text('Second Account'))).toBeVisible();
  });

  it('should export vault for later import', async () => {
    // Navigate to settings
    await element(by.id('settings-button')).tap();
    await expect(element(by.text('Settings'))).toBeVisible();

    // Scroll to export button and tap
    await waitFor(element(by.id('export-vault-button')))
      .toBeVisible()
      .whileElement(by.id('settings-scroll'))
      .scroll(200, 'down');
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

  it('should display import vault button in settings', async () => {
    await element(by.id('settings-button')).tap();
    await waitFor(element(by.text('Settings')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Scroll to import button
    await waitFor(element(by.id('import-vault-button')))
      .toBeVisible()
      .whileElement(by.id('settings-scroll'))
      .scroll(200, 'down');
  });

  it('should show import confirmation dialog when tapping import', async () => {
    await element(by.id('import-vault-button')).tap();

    // Verify import modal appears with options
    await expect(element(by.text('Import credentials from a previously exported vault backup. This will merge the imported data with your current vault.'))).toBeVisible();
    await expect(element(by.text('Cancel'))).toBeVisible();
    await expect(element(by.text('Browse Files'))).toBeVisible();
    await expect(element(by.text('Recent Backups'))).toBeVisible();
  });

  it('should cancel import when tapping cancel', async () => {
    await element(by.text('Cancel')).tap();

    // Should still be on settings screen
    await expect(element(by.text('Settings'))).toBeVisible();
    
    // Scroll to top and navigate back to credentials
    await element(by.id('settings-scroll')).scrollTo('top');
    await element(by.id('settings-back-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();
  });

  it('should delete credentials to simulate data loss', async () => {
    // Delete first credential using long press
    await element(by.text('Round Trip Account')).longPress();
    // Confirm delete in alert
    await waitFor(element(by.text('Delete Credential'))).toBeVisible().withTimeout(3000);
    await element(by.text('Delete')).tap();

    // Wait for deletion to complete
    await waitFor(element(by.text('Round Trip Account'))).not.toBeVisible().withTimeout(5000);

    // Delete second credential using long press
    await element(by.text('Second Account')).longPress();
    await waitFor(element(by.text('Delete Credential'))).toBeVisible().withTimeout(3000);
    await element(by.text('Delete')).tap();

    // Verify credentials are gone
    await waitFor(element(by.text('Second Account'))).not.toBeVisible().withTimeout(5000);
  });

  it('should import vault from exported file to restore data', async () => {
    // Navigate to settings
    await element(by.id('settings-button')).tap();
    await waitFor(element(by.text('Settings')))
      .toBeVisible()
      .withTimeout(5000);

    // Scroll to import button
    await waitFor(element(by.id('import-vault-button')))
      .toBeVisible()
      .whileElement(by.id('settings-scroll'))
      .scroll(200, 'down');
    await element(by.id('import-vault-button')).tap();
    
    // Use Recent Backups to import
    await waitFor(element(by.text('Recent Backups')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text('Recent Backups')).tap();
    
    // Select the first backup file
    await waitFor(element(by.id('backup-file-item-0'))).toBeVisible().withTimeout(5000);
    await element(by.id('backup-file-item-0')).tap();

    // Wait for import to complete
    await waitFor(element(by.text('Import Successful'))).toBeVisible().withTimeout(15000);
    await element(by.text('OK')).tap();
  });

  it('should verify restored credentials match original', async () => {
    // Navigate back to credentials
    await element(by.id('settings-back-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Verify both credentials were restored
    await expect(element(by.text('Round Trip Account'))).toBeVisible();
    await expect(element(by.text('Second Account'))).toBeVisible();
  });

  it('should verify restored credential details are correct', async () => {
    // Tap on first credential to expand
    await element(by.text('Round Trip Account')).tap();

    // View details
    await element(by.id('view-details-button')).tap();

    // Verify username
    await expect(element(by.text('roundtrip@test.com'))).toBeVisible();

    // Navigate back
    await element(by.id('detail-back-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();
  });

  it('should persist restored data across app restart', async () => {
    // Terminate and relaunch
    await device.terminateApp();
    await device.launchApp({ newInstance: false });

    // Unlock vault
    await waitFor(element(by.id('master-password-input'))).toBeVisible().withTimeout(10000);
    await element(by.id('master-password-input')).typeText('ImportTest123!');
    await element(by.id('master-password-input')).tapReturnKey();
    await element(by.id('unlock-vault-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Verify credentials still present
    await expect(element(by.text('Round Trip Account'))).toBeVisible();
    await expect(element(by.text('Second Account'))).toBeVisible();
  });
});
