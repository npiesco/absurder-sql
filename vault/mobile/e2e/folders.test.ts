/**
 * E2E Tests for Folders & Organization
 *
 * Tests folder management:
 * - Navigate to folders screen
 * - Create folder
 * - Edit folder name
 * - Delete folder
 * - Assign credential to folder
 * - Filter credentials by folder
 * - Persist folders across app restart
 */

import { by, device, element, expect, waitFor } from 'detox';

describe('Folders', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });

    // Wait for unlock screen to load
    await waitFor(element(by.text('Create New'))).toBeVisible().withTimeout(10000);

    // Create vault for all tests
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('FoldersTest123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('FoldersTest123!');
    await element(by.id('create-vault-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();
  });

  it('should display folders button in credentials screen header', async () => {
    await expect(element(by.id('folders-button'))).toBeVisible();
  });

  it('should navigate to folders screen when folders button is tapped', async () => {
    await element(by.id('folders-button')).tap();
    await expect(element(by.text('Folders'))).toBeVisible();
    await expect(element(by.id('add-folder-fab'))).toBeVisible();
  });

  it('should create a new folder', async () => {
    // Tap add folder button
    await element(by.id('add-folder-fab')).tap();

    // Enter folder name
    await expect(element(by.id('folder-name-input'))).toBeVisible();
    await element(by.id('folder-name-input')).typeText('Work');
    await element(by.id('folder-name-input')).tapReturnKey();
    await element(by.id('save-folder-button')).tap();

    // Verify folder appears in list
    await expect(element(by.text('Work'))).toBeVisible();
  });

  it('should create multiple folders', async () => {
    // Create second folder
    await element(by.id('add-folder-fab')).tap();
    await element(by.id('folder-name-input')).typeText('Personal');
    await element(by.id('folder-name-input')).tapReturnKey();
    await element(by.id('save-folder-button')).tap();
    await waitFor(element(by.id('add-folder-fab'))).toBeVisible().withTimeout(5000);
    await expect(element(by.text('Personal'))).toBeVisible();

    // Create third folder
    await element(by.id('add-folder-fab')).tap();
    await element(by.id('folder-name-input')).typeText('Finance');
    await element(by.id('folder-name-input')).tapReturnKey();
    await element(by.id('save-folder-button')).tap();
    await expect(element(by.text('Finance'))).toBeVisible();

    // Verify all folders are visible
    await expect(element(by.text('Work'))).toBeVisible();
    await expect(element(by.text('Personal'))).toBeVisible();
    await expect(element(by.text('Finance'))).toBeVisible();
  });

  it('should edit folder name', async () => {
    // Tap on folder to expand options
    await element(by.text('Work')).tap();
    await element(by.id('edit-folder-button')).tap();

    // Edit name
    await element(by.id('folder-name-input')).clearText();
    await element(by.id('folder-name-input')).typeText('Work Projects');
    await element(by.id('folder-name-input')).tapReturnKey();
    await element(by.id('save-folder-button')).tap();

    // Verify updated name
    await expect(element(by.text('Work Projects'))).toBeVisible();
  });

  it('should delete folder', async () => {
    // Tap on folder to expand options
    await element(by.text('Finance')).tap();
    await element(by.id('delete-folder-button')).tap();

    // Wait for and confirm deletion alert
    await waitFor(element(by.text('Delete Folder'))).toBeVisible().withTimeout(5000);
    await element(by.text('Delete').withAncestor(by.type('_UIAlertControllerActionView'))).tap();

    // Verify folder is removed
    await waitFor(element(by.text('Finance'))).not.toBeVisible().withTimeout(5000);
  });

  it('should navigate back to credentials screen', async () => {
    // Wait for any alerts to clear
    await waitFor(element(by.id('back-button'))).toBeVisible().withTimeout(5000);
    await element(by.id('back-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();
  });

  it('should assign credential to folder', async () => {
    // Create a credential
    await element(by.id('add-credential-fab')).tap();
    await element(by.id('credential-name-input')).typeText('GitHub');
    await element(by.id('credential-username-input')).typeText('developer');
    await element(by.id('credential-password-input')).typeText('GitHubPass123!');

    // Scroll to folder picker and assign to folder
    await waitFor(element(by.id('folder-picker'))).toBeVisible().whileElement(by.id('credential-form-scroll')).scroll(100, 'down');
    await element(by.id('folder-picker')).tap();
    // Scroll more to see dropdown options
    await element(by.id('credential-form-scroll')).scroll(150, 'down');
    await waitFor(element(by.text('Work Projects'))).toBeVisible().withTimeout(5000);
    await element(by.text('Work Projects')).tap();

    // Scroll back up and save credential
    await element(by.id('credential-form-scroll')).scrollTo('top');
    await element(by.id('save-credential-button')).tap();
    await expect(element(by.text('GitHub'))).toBeVisible();
  });

  it('should filter credentials by folder', async () => {
    // Create another credential in different folder
    await element(by.id('add-credential-fab')).tap();
    await element(by.id('credential-name-input')).typeText('Netflix');
    await element(by.id('credential-username-input')).typeText('user');
    await element(by.id('credential-password-input')).typeText('NetflixPass123!');
    await waitFor(element(by.id('folder-picker'))).toBeVisible().whileElement(by.id('credential-form-scroll')).scroll(100, 'down');
    await element(by.id('folder-picker')).tap();
    await element(by.id('credential-form-scroll')).scroll(150, 'down');
    await waitFor(element(by.text('Personal'))).toBeVisible().withTimeout(5000);
    await element(by.text('Personal')).tap();
    await element(by.id('credential-form-scroll')).scrollTo('top');
    await element(by.id('save-credential-button')).tap();

    // Create credential with no folder
    await element(by.id('add-credential-fab')).tap();
    await element(by.id('credential-name-input')).typeText('Random Site');
    await element(by.id('credential-username-input')).typeText('random');
    await element(by.id('credential-password-input')).typeText('RandomPass123!');
    await element(by.id('save-credential-button')).tap();

    // All credentials should be visible initially
    await expect(element(by.text('GitHub'))).toBeVisible();
    await expect(element(by.text('Netflix'))).toBeVisible();
    await expect(element(by.text('Random Site'))).toBeVisible();

    // Filter by Work Projects folder
    await element(by.id('folder-filter-button')).tap();
    await element(by.text('Work Projects')).atIndex(0).tap();

    // Only GitHub should be visible
    await expect(element(by.text('GitHub'))).toBeVisible();
    await expect(element(by.text('Netflix'))).not.toBeVisible();
    await expect(element(by.text('Random Site'))).not.toBeVisible();

    // Clear filter
    await element(by.id('folder-filter-button')).tap();
    await element(by.text('All Folders')).tap();

    // All credentials visible again
    await expect(element(by.text('GitHub'))).toBeVisible();
    await expect(element(by.text('Netflix'))).toBeVisible();
    await expect(element(by.text('Random Site'))).toBeVisible();
  });

  it('should persist folders across app restart', async () => {
    // Terminate and relaunch
    await device.terminateApp();
    await device.launchApp({ newInstance: false });

    // Unlock vault
    await waitFor(element(by.id('master-password-input'))).toBeVisible().withTimeout(10000);
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('FoldersTest123!');
    await element(by.id('unlock-vault-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Navigate to folders
    await element(by.id('folders-button')).tap();

    // Verify folders persisted
    await expect(element(by.text('Work Projects'))).toBeVisible();
    await expect(element(by.text('Personal'))).toBeVisible();
  });

  it('should show folder badge on credential in list', async () => {
    // Go back to credentials
    await element(by.id('back-button')).tap();

    // Verify folder badge on GitHub credential
    await expect(element(by.id('folder-badge-GitHub'))).toBeVisible();
  });
});
