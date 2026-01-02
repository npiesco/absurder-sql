/**
 * Empty States E2E Tests (TDD)
 *
 * Tests empty state UI:
 * - Empty credentials list
 * - Empty search results
 * - Empty TOTP quick view
 */

import {by, device, element, expect, waitFor} from 'detox';

describe('Empty States', () => {
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

  it('should show empty state for credentials list', async () => {
    // Fresh vault should show empty state
    await expect(element(by.text('No credentials yet'))).toBeVisible();
  });
});
