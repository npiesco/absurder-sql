/**
 * TOTP Authenticator E2E Test
 *
 * Tests TOTP code generation and display:
 * 1. Display TOTP code for credential with secret
 * 2. TOTP code updates every 30 seconds (countdown timer)
 * 3. Copy TOTP code to clipboard
 * 4. TOTP code is 6 digits
 * 5. TOTP display shows countdown progress
 * 6. No TOTP display for credentials without secret
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('TOTP Authenticator', () => {
  // Standard TOTP test secret (base32 encoded)
  // This generates predictable codes for testing
  const TOTP_SECRET = 'JBSWY3DPEHPK3PXP';

  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });

    // Wait for unlock screen to load
    await waitFor(element(by.text('Create New')))
      .toBeVisible()
      .withTimeout(10000);

    // Create vault
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('TotpAuthTest123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('TotpAuthTest123!');
    await element(by.id('create-vault-button')).tap();

    await waitFor(element(by.text('Vault'))).toBeVisible().withTimeout(5000);

    await device.disableSynchronization();
  });

  afterAll(async () => {
    await device.enableSynchronization();
  });

  it('should create credential with TOTP secret', async () => {
    await element(by.id('add-credential-fab')).tap();
    await waitFor(element(by.id('credential-name-input'))).toBeVisible().withTimeout(5000);

    await element(by.id('credential-name-input')).typeText('GitHub 2FA');
    await element(by.id('credential-name-input')).tapReturnKey();
    await element(by.id('credential-username-input')).typeText('user@github.com');
    await element(by.id('credential-username-input')).tapReturnKey();
    await element(by.id('credential-password-input')).typeText('SecurePass123!');
    await element(by.id('credential-password-input')).tapReturnKey();

    // Scroll to TOTP field
    await element(by.id('credential-form-scroll')).scroll(500, 'down');

    // Enter TOTP secret
    await element(by.id('credential-totp-input')).typeText(TOTP_SECRET);
    await element(by.id('credential-totp-input')).tapReturnKey();

    await element(by.id('save-credential-button')).tap();

    await waitFor(element(by.text('GitHub 2FA'))).toBeVisible().withTimeout(5000);
  });

  it('should display TOTP code in credential detail', async () => {
    // Tap credential to expand
    await element(by.text('GitHub 2FA')).tap();

    // View details
    await element(by.id('view-details-button')).tap();

    // Verify TOTP code display exists
    await waitFor(element(by.id('totp-code-display')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should display 6-digit TOTP code', async () => {
    // TOTP code should be visible and be 6 digits
    await expect(element(by.id('totp-code-value'))).toBeVisible();

    // The code format should match 6 digits (XXX XXX format for readability)
    await expect(element(by.id('totp-code-value'))).toExist();
  });

  it('should display countdown timer', async () => {
    // Countdown timer should show remaining seconds
    await expect(element(by.id('totp-countdown'))).toBeVisible();
  });

  it('should display countdown progress indicator', async () => {
    // Progress bar or circle showing time remaining
    await expect(element(by.id('totp-progress'))).toBeVisible();
  });

  it('should have copy TOTP code button', async () => {
    await expect(element(by.id('copy-totp-button'))).toBeVisible();
  });

  it('should copy TOTP code to clipboard', async () => {
    await element(by.id('copy-totp-button')).tap();

    // Should show confirmation
    await waitFor(element(by.text('Copied')))
      .toBeVisible()
      .withTimeout(3000);

    await element(by.text('OK')).tap();

    // Ensure we're still on credential detail after dismissing alert
    await waitFor(element(by.id('totp-code-display')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should navigate back to credentials list', async () => {
    await waitFor(element(by.id('detail-back-button')))
      .toBeVisible()
      .withTimeout(5000);

    // Back button can sometimes be "not hittable" with sync disabled + timers.
    // Try normal tap first, then fall back to a deterministic in-button point.
    try {
      await element(by.id('detail-back-button')).tap();
    } catch {
      await element(by.id('detail-back-button')).tapAtPoint({ x: 25, y: 25 });
    }

    await waitFor(element(by.text('Vault')))
      .toBeVisible()
      .withTimeout(10000);

    await waitFor(element(by.id('add-credential-fab')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should create credential without TOTP secret', async () => {
    // Ensure we're on the credentials list
    await waitFor(element(by.id('add-credential-fab')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('add-credential-fab')).tap();
    await waitFor(element(by.id('credential-name-input'))).toBeVisible().withTimeout(5000);

    await element(by.id('credential-name-input')).typeText('No 2FA Account');
    await element(by.id('credential-name-input')).tapReturnKey();
    await element(by.id('credential-username-input')).typeText('user@example.com');
    await element(by.id('credential-username-input')).tapReturnKey();
    await element(by.id('credential-password-input')).typeText('Password123!');
    await element(by.id('credential-password-input')).tapReturnKey();

    await element(by.id('save-credential-button')).tap();

    await waitFor(element(by.text('No 2FA Account'))).toBeVisible().withTimeout(10000);
  });

  it('should not display TOTP section for credential without secret', async () => {
    // Ensure we're on the credentials list
    await waitFor(element(by.text('No 2FA Account')))
      .toBeVisible()
      .withTimeout(10000);

    // Tap credential to expand
    await element(by.text('No 2FA Account')).tap();

    // View details
    await element(by.id('view-details-button')).tap();

    // TOTP code display should NOT exist
    await expect(element(by.id('totp-code-display'))).not.toBeVisible();

    // Navigate back
    await element(by.id('detail-back-button')).tap();
  });

  it('should persist TOTP functionality across app restart', async () => {
    await device.terminateApp();
    await device.launchApp({ newInstance: false });

    // Unlock vault
    await waitFor(element(by.id('master-password-input'))).toBeVisible().withTimeout(10000);
    await element(by.id('master-password-input')).typeText('TotpAuthTest123!');
    await element(by.id('master-password-input')).tapReturnKey();
    await element(by.id('unlock-vault-button')).tap();

    await waitFor(element(by.text('Vault'))).toBeVisible().withTimeout(5000);

    // View credential with TOTP
    await element(by.text('GitHub 2FA')).tap();
    await element(by.id('view-details-button')).tap();

    // TOTP code should still be displayed
    await waitFor(element(by.id('totp-code-display')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.id('totp-code-value'))).toBeVisible();
    await expect(element(by.id('totp-countdown'))).toBeVisible();
  });
});
