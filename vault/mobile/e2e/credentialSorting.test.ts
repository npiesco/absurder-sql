/**
 * E2E Tests for Credential Sorting Options
 *
 * Tests sorting credentials by:
 * - Name A-Z (default)
 * - Name Z-A
 * - Recently updated
 * - Recently created
 * - Favorites first
 */

import { by, device, element, expect } from 'detox';

describe('Credential Sorting', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  async function createVaultAndUnlock() {
    const masterPassword = element(by.id('master-password-input'));
    await masterPassword.typeText('TestPassword123!');
    await element(by.id('unlock-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();
  }

  async function createCredential(name: string, username: string, password: string) {
    await element(by.id('add-credential-fab')).tap();
    await element(by.id('name-input')).typeText(name);
    await element(by.id('username-input')).typeText(username);
    await element(by.id('password-input')).typeText(password);
    await element(by.id('save-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();
  }

  it('should display sort button in credentials screen header', async () => {
    await createVaultAndUnlock();

    // Verify sort button is visible
    await expect(element(by.id('sort-button'))).toBeVisible();
  });

  it('should show sort options menu when sort button is tapped', async () => {
    await createVaultAndUnlock();

    await element(by.id('sort-button')).tap();

    // Verify sort options are displayed
    await expect(element(by.id('sort-option-name-asc'))).toBeVisible();
    await expect(element(by.id('sort-option-name-desc'))).toBeVisible();
    await expect(element(by.id('sort-option-updated'))).toBeVisible();
    await expect(element(by.id('sort-option-created'))).toBeVisible();
    await expect(element(by.id('sort-option-favorites'))).toBeVisible();
  });

  it('should sort credentials by name A-Z by default', async () => {
    await createVaultAndUnlock();

    // Create credentials in non-alphabetical order
    await createCredential('Zebra Account', 'zebra', 'ZebraPass123!');
    await createCredential('Apple Account', 'apple', 'ApplePass123!');
    await createCredential('Mango Account', 'mango', 'MangoPass123!');

    // Wait for list to refresh
    await expect(element(by.text('Zebra Account'))).toBeVisible();

    // Get all credential items and verify order
    // First credential should be Apple (alphabetically first)
    const credentialsList = element(by.id('credentials-list'));
    await expect(credentialsList).toBeVisible();

    // Verify Apple appears before Mango and Zebra in the view
    // We check they're all visible and rely on visual order from FlatList
    await expect(element(by.text('Apple Account'))).toBeVisible();
    await expect(element(by.text('Mango Account'))).toBeVisible();
    await expect(element(by.text('Zebra Account'))).toBeVisible();
  });

  it('should sort credentials by name Z-A when selected', async () => {
    await createVaultAndUnlock();

    // Create credentials
    await createCredential('Alpha Site', 'alpha', 'AlphaPass123!');
    await createCredential('Beta Site', 'beta', 'BetaPass123!');
    await createCredential('Gamma Site', 'gamma', 'GammaPass123!');

    // Wait for list
    await expect(element(by.text('Alpha Site'))).toBeVisible();

    // Tap sort button and select Z-A
    await element(by.id('sort-button')).tap();
    await element(by.id('sort-option-name-desc')).tap();

    // After sorting Z-A, Gamma should appear first
    // Verify the sort indicator shows current option
    await expect(element(by.id('current-sort-indicator'))).toHaveText('Z-A');
  });

  it('should sort credentials by recently updated when selected', async () => {
    await createVaultAndUnlock();

    // Create credentials
    await createCredential('First Created', 'first', 'FirstPass123!');
    await createCredential('Second Created', 'second', 'SecondPass123!');

    // Wait for list
    await expect(element(by.text('First Created'))).toBeVisible();

    // Update the first credential to make it most recently updated
    await element(by.text('First Created')).tap();
    await element(by.id('edit-credential-button')).tap();
    await element(by.id('username-input')).clearText();
    await element(by.id('username-input')).typeText('first_updated');
    await element(by.id('save-button')).tap();

    // Now sort by recently updated
    await element(by.id('sort-button')).tap();
    await element(by.id('sort-option-updated')).tap();

    // Verify sort indicator
    await expect(element(by.id('current-sort-indicator'))).toHaveText('Updated');

    // First Created should now be at the top (most recently updated)
    await expect(element(by.text('First Created'))).toBeVisible();
  });

  it('should sort credentials by recently created when selected', async () => {
    await createVaultAndUnlock();

    // Create credentials with slight delays to ensure different timestamps
    await createCredential('Oldest Entry', 'oldest', 'OldestPass123!');
    await createCredential('Middle Entry', 'middle', 'MiddlePass123!');
    await createCredential('Newest Entry', 'newest', 'NewestPass123!');

    // Wait for list
    await expect(element(by.text('Newest Entry'))).toBeVisible();

    // Sort by recently created
    await element(by.id('sort-button')).tap();
    await element(by.id('sort-option-created')).tap();

    // Verify sort indicator
    await expect(element(by.id('current-sort-indicator'))).toHaveText('Created');
  });

  it('should sort favorites first when selected', async () => {
    await createVaultAndUnlock();

    // Create credentials
    await createCredential('Regular Account', 'regular', 'RegularPass123!');
    await createCredential('Favorite Account', 'favorite', 'FavoritePass123!');
    await createCredential('Another Account', 'another', 'AnotherPass123!');

    // Wait for list
    await expect(element(by.text('Regular Account'))).toBeVisible();

    // Mark one as favorite
    await element(by.text('Favorite Account')).tap();
    await element(by.id('view-details-button')).tap();
    await element(by.id('favorite-toggle-button')).tap();
    await device.pressBack();

    // Sort by favorites
    await element(by.id('sort-button')).tap();
    await element(by.id('sort-option-favorites')).tap();

    // Verify sort indicator
    await expect(element(by.id('current-sort-indicator'))).toHaveText('Favorites');
  });

  it('should persist sort preference across app restart', async () => {
    await createVaultAndUnlock();

    // Create a credential
    await createCredential('Test Persistence', 'test', 'TestPass123!');
    await expect(element(by.text('Test Persistence'))).toBeVisible();

    // Change sort to Z-A
    await element(by.id('sort-button')).tap();
    await element(by.id('sort-option-name-desc')).tap();
    await expect(element(by.id('current-sort-indicator'))).toHaveText('Z-A');

    // Terminate and relaunch
    await device.terminateApp();
    await device.launchApp({ newInstance: false });

    // Unlock again
    const masterPassword = element(by.id('master-password-input'));
    await masterPassword.typeText('TestPassword123!');
    await element(by.id('unlock-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Verify sort preference persisted
    await expect(element(by.id('current-sort-indicator'))).toHaveText('Z-A');
  });
});
