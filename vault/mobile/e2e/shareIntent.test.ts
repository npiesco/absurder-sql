/**
 * Android Share Intent (Kioku-style deep link) E2E Test
 */

import { by, device, element, expect, waitFor } from 'detox';

describe('Android Share Intent', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('opens settings and prompts for shared import after unlock', async () => {
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('ShareIntentTest123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('ShareIntentTest123!');
    await element(by.id('create-vault-button')).tap();

    await waitFor(element(by.text('Vault'))).toBeVisible().withTimeout(10000);
    await device.launchApp({
      newInstance: false,
      url: 'vault://import?path=file%3A%2F%2F%2Ftmp%2Fshared-backup.db&name=shared-backup.db',
    });

    await waitFor(element(by.text('Settings'))).toBeVisible().withTimeout(10000);
    await waitFor(element(by.text('Import Shared Backup'))).toBeVisible().withTimeout(5000);
    await element(by.text('Cancel')).tap();
    await expect(element(by.text('Settings'))).toBeVisible();
  });
});
