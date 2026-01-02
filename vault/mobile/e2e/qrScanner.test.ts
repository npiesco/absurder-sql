/**
 * E2E tests for QR Scanner / Manual TOTP Entry navigation
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('QR Scanner Navigation', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });

    await waitFor(element(by.text('Create New')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('QRScannerTest123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('QRScannerTest123!');
    await element(by.id('create-vault-button')).tap();

    await waitFor(element(by.text('Vault'))).toBeVisible().withTimeout(5000);
  });

  it('should show Scan QR button when adding credential', async () => {
    await element(by.id('add-credential-fab')).tap();

    await waitFor(element(by.id('credential-name-input')))
      .toBeVisible()
      .withTimeout(5000);

    // Scroll to TOTP section
    await element(by.id('credential-form-scroll')).scroll(500, 'down');

    await waitFor(element(by.id('scan-qr-button')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should open QR scanner screen', async () => {
    await element(by.id('scan-qr-button')).tap();

    // Should show manual entry button (camera won't work on simulator)
    await waitFor(element(by.id('manual-entry-button')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should have close button on QR scanner', async () => {
    await waitFor(element(by.id('qr-scanner-close-button')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should open manual entry modal', async () => {
    await element(by.id('manual-entry-button')).tap();

    await waitFor(element(by.text('Enter Secret Manually')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should have secret input field in manual entry', async () => {
    await waitFor(element(by.id('manual-secret-input')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should close manual entry and return to scanner', async () => {
    await element(by.id('manual-entry-close-button')).tap();

    await waitFor(element(by.id('manual-entry-button')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should close QR scanner and return to add credential', async () => {
    await element(by.id('qr-scanner-close-button')).tap();

    await waitFor(element(by.id('credential-name-input')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should cancel and return to credentials list', async () => {
    await element(by.id('cancel-button')).tap();

    await waitFor(element(by.text('Vault')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
