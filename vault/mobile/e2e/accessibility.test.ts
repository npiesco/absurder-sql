/**
 * Accessibility E2E Tests (TDD)
 *
 * Tests accessibility features:
 * - Accessibility labels on key elements
 * - Button accessibility hints
 */

import {by, device, element, expect, waitFor} from 'detox';

describe('Accessibility', () => {
  beforeAll(async () => {
    await device.launchApp({newInstance: true, delete: true});
    // Wait for app to load and create vault
    await waitFor(element(by.text('Create New')))
      .toBeVisible()
      .withTimeout(30000);
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('TestPassword123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('TestPassword123!');
    await element(by.id('create-vault-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();
  });

  it('should have accessibility label on add credential button', async () => {
    // FAB should have accessibility label
    await expect(element(by.label('Add new credential'))).toExist();
  });

  it('should have accessibility label on settings button', async () => {
    await expect(element(by.label('Open settings'))).toExist();
  });

  it('should have accessibility label on search input', async () => {
    await expect(element(by.label('Search credentials'))).toExist();
  });
});
