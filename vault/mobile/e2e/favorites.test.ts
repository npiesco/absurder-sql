/**
 * Favorites E2E Test
 *
 * Tests marking credentials as favorites:
 * 1. Toggle favorite from credential detail screen
 * 2. Favorite badge displays in list
 * 3. Toggle favorite from expanded credential card
 * 4. Unfavorite removes badge
 * 5. Favorites persist across app restart
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Favorites', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });

    // Create vault for testing
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('FavoritesTest123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('FavoritesTest123!');
    await element(by.id('create-vault-button')).tap();

    // Wait for credentials screen
    await expect(element(by.text('Vault'))).toBeVisible();

    // Create a test credential
    await element(by.id('add-credential-fab')).tap();
    await element(by.id('credential-name-input')).typeText('Test Account');
    await element(by.id('credential-username-input')).typeText('testuser');
    await element(by.id('credential-password-input')).typeText('TestPass123!');
    await element(by.id('save-credential-button')).tap();
    await expect(element(by.text('Test Account'))).toBeVisible();
  });

  it('should display favorite toggle button in credential detail', async () => {
    // Navigate to detail screen
    await element(by.text('Test Account')).tap();
    await element(by.id('view-details-button')).tap();

    // Verify favorite toggle button exists
    await expect(element(by.id('favorite-toggle-button'))).toBeVisible();

    // Go back
    await element(by.id('detail-back-button')).tap();
  });

  it('should toggle favorite from detail screen', async () => {
    // Navigate to detail screen
    await element(by.text('Test Account')).tap();
    await element(by.id('view-details-button')).tap();

    // Credential should not be favorite initially
    await expect(element(by.id('favorite-icon-filled'))).not.toBeVisible();

    // Tap favorite toggle
    await element(by.id('favorite-toggle-button')).tap();

    // Should now show filled star
    await expect(element(by.id('favorite-icon-filled'))).toBeVisible();

    // Go back
    await element(by.id('detail-back-button')).tap();
  });

  it('should display favorite badge in credentials list', async () => {
    // Verify favorite badge is visible in list
    await expect(element(by.id('favorite-badge-Test Account'))).toBeVisible();
  });

  it('should toggle favorite from expanded credential card', async () => {
    // Expand credential card
    await element(by.text('Test Account')).tap();

    // Verify favorite toggle in expanded card
    await expect(element(by.id('card-favorite-toggle'))).toBeVisible();

    // Unfavorite from card
    await element(by.id('card-favorite-toggle')).tap();

    // Collapse card by tapping elsewhere or go to detail
    await element(by.id('view-details-button')).tap();

    // Verify unfavorited
    await expect(element(by.id('favorite-icon-filled'))).not.toBeVisible();

    // Go back
    await element(by.id('detail-back-button')).tap();
  });

  it('should not show favorite badge after unfavoriting', async () => {
    // Badge should be gone from list
    await expect(element(by.id('favorite-badge-Test Account'))).not.toBeVisible();
  });

  it('should persist favorite status across app restart', async () => {
    // Mark as favorite again
    await element(by.text('Test Account')).tap();
    await element(by.id('view-details-button')).tap();
    await element(by.id('favorite-toggle-button')).tap();
    await expect(element(by.id('favorite-icon-filled'))).toBeVisible();
    await element(by.id('detail-back-button')).tap();

    // Terminate and relaunch app
    await device.terminateApp();
    await device.launchApp({ newInstance: false });

    // Unlock vault
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('FavoritesTest123!');
    await element(by.id('unlock-vault-button')).tap();

    // Verify favorite badge persisted
    await expect(element(by.id('favorite-badge-Test Account'))).toBeVisible();

    // Verify in detail screen
    await element(by.text('Test Account')).tap();
    await element(by.id('view-details-button')).tap();
    await expect(element(by.id('favorite-icon-filled'))).toBeVisible();
  });
});
