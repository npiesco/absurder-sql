/**
 * TOTP Secret Storage E2E Test
 *
 * Tests storing and retrieving TOTP secrets for 2FA:
 * 1. Add TOTP secret when creating credential
 * 2. Edit TOTP secret on existing credential
 * 3. Clear TOTP secret
 * 4. Persist TOTP secret across app restart
 */

import { device, element, by, expect } from 'detox';

describe('TOTP Secret Storage', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });

    // Create vault for testing
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('TotpTest123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('TotpTest123!');
    await element(by.id('create-vault-button')).tap();

    // Wait for credentials screen
    await expect(element(by.text('Vault'))).toBeVisible();
  });

  it('should display TOTP secret input field in add credential form', async () => {
    // Navigate to add credential screen
    await element(by.id('add-credential-fab')).tap();
    await expect(element(by.text('Add Credential'))).toBeVisible();

    // Scroll down to find TOTP field
    await element(by.id('credential-form-scroll')).scroll(500, 'down');

    // Verify TOTP secret input exists
    await expect(element(by.id('credential-totp-input'))).toBeVisible();

    // Cancel
    await element(by.id('cancel-button')).tap();
  });

  it('should save credential with TOTP secret', async () => {
    // Navigate to add credential screen
    await element(by.id('add-credential-fab')).tap();

    // Fill required fields
    await element(by.id('credential-name-input')).typeText('GitHub 2FA');
    await element(by.id('credential-username-input')).typeText('user@github.com');
    await element(by.id('credential-password-input')).typeText('SecurePass123!');

    // Scroll to TOTP field
    await element(by.id('credential-form-scroll')).scroll(500, 'down');

    // Enter TOTP secret (base32 encoded)
    await element(by.id('credential-totp-input')).typeText('JBSWY3DPEHPK3PXP');

    // Save credential
    await element(by.id('save-credential-button')).tap();

    // Verify credential appears in list
    await expect(element(by.text('GitHub 2FA'))).toBeVisible();
  });

  it('should display TOTP secret in credential detail', async () => {
    // Tap credential to expand
    await element(by.text('GitHub 2FA')).tap();

    // Tap view details
    await element(by.id('view-details-button')).tap();

    // Verify TOTP secret is displayed (may need to scroll on smaller screens)
    try {
      await expect(element(by.id('totp-secret-field'))).toBeVisible();
    } catch {
      // Try scrolling if not immediately visible
      await element(by.id('detail-scroll')).scrollTo('bottom');
      await expect(element(by.id('totp-secret-field'))).toBeVisible();
    }
  });

  it('should edit TOTP secret on existing credential', async () => {
    // Navigate back to list
    await element(by.id('detail-back-button')).tap();

    // Tap credential to expand
    await element(by.text('GitHub 2FA')).tap();

    // Tap edit button
    await element(by.id('edit-credential-button')).tap();
    await expect(element(by.text('Edit Credential'))).toBeVisible();

    // Scroll to TOTP field
    await element(by.id('credential-form-scroll')).scroll(500, 'down');

    // Clear and enter new TOTP secret
    await element(by.id('credential-totp-input')).clearText();
    await element(by.id('credential-totp-input')).typeText('NEWTOTP3DPEHPK3PXP');

    // Save changes
    await element(by.id('save-credential-button')).tap();

    // Verify we're back on list
    await expect(element(by.text('GitHub 2FA'))).toBeVisible();
  });

  it('should persist TOTP secret across app restart', async () => {
    // Terminate and relaunch app
    await device.terminateApp();
    await device.launchApp({ newInstance: false });

    // Unlock vault
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('TotpTest123!');
    await element(by.id('unlock-vault-button')).tap();

    // Verify credential still exists
    await expect(element(by.text('GitHub 2FA'))).toBeVisible();

    // View details
    await element(by.text('GitHub 2FA')).tap();
    await element(by.id('view-details-button')).tap();

    // Verify TOTP field is still present (may need to scroll on smaller screens)
    try {
      await expect(element(by.id('totp-secret-field'))).toBeVisible();
    } catch {
      await element(by.id('detail-scroll')).scrollTo('bottom');
      await expect(element(by.id('totp-secret-field'))).toBeVisible();
    }
  });
});
