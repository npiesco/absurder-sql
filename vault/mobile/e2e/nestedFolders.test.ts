/**
 * Nested Folders E2E Test
 *
 * Tests folder hierarchy functionality:
 * 1. Create a subfolder inside a parent folder
 * 2. Display nested folder structure with indentation
 * 3. Expand/collapse parent folders to show/hide subfolders
 * 4. Move credential to nested folder
 * 5. Filter credentials by nested folder
 * 6. Delete parent folder moves subfolders to root
 * 7. Persist nested folder structure across app restart
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Nested Folders', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });

    // Create vault for testing
    await waitFor(element(by.text('Create New'))).toBeVisible().withTimeout(10000);
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('NestedTest123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('NestedTest123!');
    await element(by.id('create-vault-button')).tap();

    // Wait for credentials screen
    await expect(element(by.text('Vault'))).toBeVisible();

    // Navigate to folders screen
    await element(by.id('folders-button')).tap();
    await expect(element(by.text('Folders'))).toBeVisible();
  });

  it('should create a parent folder', async () => {
    // Create parent folder
    await element(by.id('add-folder-fab')).tap();
    await element(by.id('folder-name-input')).typeText('Work');
    await element(by.id('folder-name-input')).tapReturnKey();
    await element(by.id('save-folder-button')).tap();
    await waitFor(element(by.id('add-folder-fab'))).toBeVisible().withTimeout(5000);

    // Verify folder appears
    await expect(element(by.text('Work'))).toBeVisible();
  });

  it('should display create subfolder option when folder is expanded', async () => {
    // Expand Work folder
    await element(by.text('Work')).tap();

    // Verify create subfolder button appears
    await expect(element(by.id('create-subfolder-button'))).toBeVisible();
  });

  it('should create a subfolder inside parent folder', async () => {
    // Tap create subfolder
    await element(by.id('create-subfolder-button')).tap();

    // Enter subfolder name
    await element(by.id('folder-name-input')).typeText('Projects');
    await element(by.id('folder-name-input')).tapReturnKey();
    await element(by.id('save-folder-button')).tap();
    await waitFor(element(by.id('add-folder-fab'))).toBeVisible().withTimeout(5000);

    // Verify subfolder appears with indentation indicator
    await expect(element(by.text('Projects'))).toBeVisible();
    await expect(element(by.id('subfolder-indicator-Projects'))).toBeVisible();
  });

  it('should create another subfolder', async () => {
    // Expand Work folder again if collapsed
    await element(by.text('Work')).tap();
    await element(by.id('create-subfolder-button')).tap();
    await element(by.id('folder-name-input')).typeText('Documents');
    await element(by.id('folder-name-input')).tapReturnKey();
    await element(by.id('save-folder-button')).tap();
    await waitFor(element(by.id('add-folder-fab'))).toBeVisible().withTimeout(5000);

    // Verify both subfolders visible
    await expect(element(by.text('Projects'))).toBeVisible();
    await expect(element(by.text('Documents'))).toBeVisible();
  });

  it('should collapse parent folder to hide subfolders', async () => {
    // Collapse Work folder by tapping the collapse icon
    await element(by.id('collapse-folder-Work')).tap();

    // Subfolders should not be visible
    await expect(element(by.text('Projects'))).not.toBeVisible();
    await expect(element(by.text('Documents'))).not.toBeVisible();

    // Parent should still be visible
    await expect(element(by.text('Work'))).toBeVisible();
  });

  it('should expand parent folder to show subfolders', async () => {
    // Expand Work folder
    await element(by.id('expand-folder-Work')).tap();

    // Subfolders should be visible again
    await expect(element(by.text('Projects'))).toBeVisible();
    await expect(element(by.text('Documents'))).toBeVisible();
  });

  it('should create deeply nested folder (3 levels)', async () => {
    // Expand Projects subfolder
    await element(by.text('Projects')).tap();
    await element(by.id('create-subfolder-button')).tap();
    await element(by.id('folder-name-input')).typeText('Active');
    await element(by.id('folder-name-input')).tapReturnKey();
    await element(by.id('save-folder-button')).tap();
    await waitFor(element(by.id('add-folder-fab'))).toBeVisible().withTimeout(5000);

    // Verify deeply nested folder appears
    await expect(element(by.text('Active'))).toBeVisible();
    await expect(element(by.id('subfolder-indicator-Active'))).toBeVisible();
  });

  it('should navigate back and assign credential to nested folder', async () => {
    // Go back to credentials screen
    await element(by.id('back-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Create a credential
    await element(by.id('add-credential-fab')).tap();
    await element(by.id('credential-name-input')).typeText('GitHub Work');
    await element(by.id('credential-username-input')).typeText('dev@work.com');
    await element(by.id('credential-password-input')).typeText('WorkPass123!');

    // Dismiss keyboard by tapping elsewhere
    await element(by.id('credential-form-scroll')).tap();

    // Scroll to folder picker
    await waitFor(element(by.id('folder-picker'))).toBeVisible().whileElement(by.id('credential-form-scroll')).scroll(100, 'down');
    await element(by.id('folder-picker')).tap();

    // Scroll more to see nested folder options in the dropdown
    await element(by.id('credential-form-scroll')).scroll(200, 'down');

    // Wait for and select nested folder (Work > Projects > Active)
    // The folder picker shows full paths for nested folders
    await waitFor(element(by.text('Work / Projects / Active'))).toBeVisible().whileElement(by.id('credential-form-scroll')).scroll(50, 'down');
    await element(by.text('Work / Projects / Active')).tap();

    // Save credential
    await element(by.id('credential-form-scroll')).scrollTo('top');
    await element(by.id('save-credential-button')).tap();

    // Verify credential appears
    await waitFor(element(by.text('GitHub Work'))).toBeVisible().withTimeout(5000);
  });

  it('should show folder path badge on credential', async () => {
    // Verify folder path badge shows nested path
    await expect(element(by.id('folder-badge-GitHub Work'))).toBeVisible();
  });

  it('should filter by nested folder', async () => {
    // Create another credential in root
    await element(by.id('add-credential-fab')).tap();
    await element(by.id('credential-name-input')).typeText('Personal Email');
    await element(by.id('credential-username-input')).typeText('me@personal.com');
    await element(by.id('credential-password-input')).typeText('PersonalPass123!');
    await element(by.id('save-credential-button')).tap();

    // Both credentials visible
    await expect(element(by.text('GitHub Work'))).toBeVisible();
    await expect(element(by.text('Personal Email'))).toBeVisible();

    // Filter by nested folder
    await element(by.id('folder-filter-button')).tap();
    await element(by.text('Work / Projects / Active')).atIndex(0).tap();

    // Only GitHub Work should be visible
    await expect(element(by.text('GitHub Work'))).toBeVisible();
    await expect(element(by.text('Personal Email'))).not.toBeVisible();

    // Clear filter
    await element(by.id('folder-filter-button')).tap();
    await element(by.text('All Folders')).tap();
  });

  it('should persist nested folder structure across app restart', async () => {
    // Terminate and relaunch
    await device.terminateApp();
    await device.launchApp({ newInstance: false });

    // Unlock vault
    await waitFor(element(by.id('master-password-input'))).toBeVisible().withTimeout(10000);
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('NestedTest123!');
    await element(by.id('unlock-vault-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Navigate to folders
    await element(by.id('folders-button')).tap();

    // Verify parent folder exists
    await expect(element(by.text('Work'))).toBeVisible();

    // Expand to see nested structure
    await element(by.id('expand-folder-Work')).tap();
    await expect(element(by.text('Projects'))).toBeVisible();
    await expect(element(by.text('Documents'))).toBeVisible();

    // Expand Projects to see Active subfolder
    // Projects has children so it should have an expand button
    await waitFor(element(by.id('expand-folder-Projects'))).toBeVisible().withTimeout(5000);
    await element(by.id('expand-folder-Projects')).tap();
    await expect(element(by.text('Active'))).toBeVisible();
  });

  it('should delete parent folder and move subfolders to root', async () => {
    // Collapse Projects first using the collapse button
    await element(by.id('collapse-folder-Projects')).tap();

    // Delete Work folder
    await element(by.text('Work')).tap();
    await element(by.id('delete-folder-button')).tap();

    // Confirm deletion
    await waitFor(element(by.text('Delete Folder'))).toBeVisible().withTimeout(5000);
    await element(by.text('Delete').withAncestor(by.type('_UIAlertControllerActionView'))).tap();

    // Work should be gone
    await waitFor(element(by.text('Work'))).not.toBeVisible().withTimeout(5000);

    // Subfolders should now be at root level (no longer nested)
    await expect(element(by.text('Projects'))).toBeVisible();
    await expect(element(by.text('Documents'))).toBeVisible();

    // Projects should no longer have subfolder indicator
    await expect(element(by.id('subfolder-indicator-Projects'))).not.toBeVisible();
  });
});
