/**
 * E2E tests for TOTP Quick View navigation
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('TOTP Quick View Navigation', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });

    await waitFor(element(by.text('Create New')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('QuickViewTest123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('QuickViewTest123!');
    await element(by.id('create-vault-button')).tap();

    await waitFor(element(by.text('Vault'))).toBeVisible().withTimeout(5000);

    // Disable sync due to TOTP timer
    await device.disableSynchronization();
  });

  afterAll(async () => {
    await device.enableSynchronization();
  });

  it('should show TOTP quick view button in header', async () => {
    await waitFor(element(by.id('totp-quickview-button')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should navigate to TOTP quick view screen', async () => {
    await element(by.id('totp-quickview-button')).tap();

    await waitFor(element(by.text('Authenticator')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show empty state when no TOTP credentials exist', async () => {
    await waitFor(element(by.text('No 2FA Accounts')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should have back button to return to credentials', async () => {
    await waitFor(element(by.id('totp-quickview-back-button')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should navigate back to credentials list', async () => {
    await element(by.id('totp-quickview-back-button')).tap();

    await waitFor(element(by.text('Vault')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
