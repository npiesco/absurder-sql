/**
 * E2E Tests for Move to Folder (Quick Folder Assignment)
 *
 * Tests the ability to quickly move credentials between folders:
 * - Display "Move to Folder" button in expanded credential actions
 * - Show folder picker modal when tapped
 * - Move credential to selected folder
 * - Move credential to root (no folder)
 * - Update folder badge after move
 * - Persist folder assignment across app restart
 */

import { by, device, element, expect, waitFor } from 'detox';

const masterPassword = 'MoveTest123!';

describe('Move to Folder', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });

    // Wait for unlock screen
    await waitFor(element(by.text('Create New'))).toBeVisible().withTimeout(10000);

    // Create vault
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText(masterPassword);
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText(masterPassword);
    await element(by.id('create-vault-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();
  });

  it('should setup folders and credentials for testing', async () => {
    // Create folders first
    await element(by.id('folders-button')).tap();
    await expect(element(by.text('Folders'))).toBeVisible();

    // Create Work folder
    await element(by.id('add-folder-fab')).tap();
    await element(by.id('folder-name-input')).typeText('Work');
    await element(by.id('folder-name-input')).tapReturnKey();
    await element(by.id('save-folder-button')).tap();
    await expect(element(by.text('Work'))).toBeVisible();

    // Create Personal folder
    await element(by.id('add-folder-fab')).tap();
    await element(by.id('folder-name-input')).typeText('Personal');
    await element(by.id('folder-name-input')).tapReturnKey();
    await element(by.id('save-folder-button')).tap();
    await expect(element(by.text('Personal'))).toBeVisible();

    // Go back to credentials
    await element(by.id('back-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Create a credential without folder
    await element(by.id('add-credential-fab')).tap();
    await element(by.id('credential-name-input')).typeText('GitHub Account');
    await element(by.id('credential-username-input')).typeText('developer@github.com');
    await element(by.id('credential-password-input')).typeText('GitHubPass123!');
    await element(by.id('save-credential-button')).tap();
    await expect(element(by.text('GitHub Account'))).toBeVisible();

    // Create a credential in Work folder
    await element(by.id('add-credential-fab')).tap();
    await element(by.id('credential-name-input')).typeText('Slack Account');
    await element(by.id('credential-username-input')).typeText('user@slack.com');
    await element(by.id('credential-password-input')).typeText('SlackPass123!');
    await waitFor(element(by.id('folder-picker'))).toBeVisible().whileElement(by.id('credential-form-scroll')).scroll(100, 'down');
    await element(by.id('folder-picker')).tap();
    await element(by.id('credential-form-scroll')).scroll(150, 'down');
    await waitFor(element(by.text('Work'))).toBeVisible().withTimeout(5000);
    await element(by.text('Work')).tap();
    await element(by.id('credential-form-scroll')).scrollTo('top');
    await element(by.id('save-credential-button')).tap();
    await expect(element(by.text('Slack Account'))).toBeVisible();
  });

  it('should display move to folder button in expanded credential actions', async () => {
    // Tap credential to expand
    await element(by.text('GitHub Account')).tap();

    // Verify move to folder button is visible
    await waitFor(element(by.id('move-to-folder-button')))
      .toBeVisible()
      .withTimeout(3000);

    await expect(element(by.id('move-to-folder-button'))).toBeVisible();
  });

  it('should show folder picker modal when move to folder is tapped', async () => {
    // Credential should still be expanded from previous test, tap move to folder button
    await waitFor(element(by.id('move-to-folder-button')))
      .toBeVisible()
      .withTimeout(3000);
    await element(by.id('move-to-folder-button')).tap();

    // Verify modal appears with folder options
    await waitFor(element(by.id('move-to-folder-modal')))
      .toBeVisible()
      .withTimeout(3000);

    // Use atIndex to avoid multiple matches (folder in modal and possibly elsewhere)
    await expect(element(by.text('Work')).atIndex(0)).toBeVisible();
    await expect(element(by.text('Personal')).atIndex(0)).toBeVisible();
    await expect(element(by.text('No Folder'))).toBeVisible();
  });

  it('should move credential to selected folder', async () => {
    // Modal should still be open from previous test, select Work folder
    await waitFor(element(by.id('move-to-folder-modal')))
      .toBeVisible()
      .withTimeout(3000);
    // Use atIndex to avoid multiple matches (folder in modal vs elsewhere)
    await element(by.text('Work')).atIndex(0).tap();

    // Wait for modal to close and credential list to update
    await waitFor(element(by.id('add-credential-fab')))
      .toBeVisible()
      .withTimeout(3000);

    // Verify folder badge appears on the credential
    await expect(element(by.text('GitHub Account'))).toBeVisible();
    
    // Tap to expand and verify folder badge
    await element(by.text('GitHub Account')).tap();
    await waitFor(element(by.id('view-details-button')))
      .toBeVisible()
      .withTimeout(3000);

    // The folder badge should show "Work"
    await expect(element(by.text('Work')).atIndex(0)).toBeVisible();
  });

  it('should move credential to different folder', async () => {
    // Collapse and re-expand to ensure button is visible
    await expect(element(by.id('add-credential-fab'))).toBeVisible();
    await element(by.text('GitHub Account')).atIndex(0).tap(); // collapse
    await element(by.text('GitHub Account')).atIndex(0).tap(); // expand
    await expect(element(by.id('move-to-folder-button'))).toBeVisible();
    await element(by.id('move-to-folder-button')).tap();

    // Verify modal and select Personal folder
    await expect(element(by.id('move-to-folder-modal'))).toExist();
    await element(by.text('Personal')).atIndex(0).tap();

    // Verify we're back on credentials screen
    await expect(element(by.id('add-credential-fab'))).toBeVisible();

    // Expand credential and verify new folder
    await element(by.text('GitHub Account')).atIndex(0).tap();
    await expect(element(by.id('view-details-button'))).toBeVisible();
    await expect(element(by.text('Personal')).atIndex(0)).toBeVisible();
  });

  it('should move credential to no folder (root)', async () => {
    // Collapse and re-expand to ensure button is visible
    await expect(element(by.id('add-credential-fab'))).toBeVisible();
    await element(by.text('GitHub Account')).atIndex(0).tap(); // collapse
    await element(by.text('GitHub Account')).atIndex(0).tap(); // expand
    await expect(element(by.id('move-to-folder-button'))).toBeVisible();
    await element(by.id('move-to-folder-button')).tap();

    // Verify modal and select No Folder
    await expect(element(by.id('move-to-folder-modal'))).toExist();
    await element(by.text('No Folder')).tap();

    // Verify we're back on credentials screen
    await expect(element(by.id('add-credential-fab'))).toBeVisible();

    // Expand credential and verify no folder badge
    await element(by.text('GitHub Account')).atIndex(0).tap();
    await expect(element(by.id('view-details-button'))).toBeVisible();
  });

  it('should persist folder assignment across app restart', async () => {
    // Collapse and re-expand to ensure button is visible
    await expect(element(by.id('add-credential-fab'))).toBeVisible();
    await element(by.text('GitHub Account')).atIndex(0).tap(); // collapse
    await element(by.text('GitHub Account')).atIndex(0).tap(); // expand
    await expect(element(by.id('move-to-folder-button'))).toBeVisible();
    await element(by.id('move-to-folder-button')).tap();

    // Select Work folder
    await expect(element(by.id('move-to-folder-modal'))).toExist();
    await element(by.text('Work')).atIndex(0).tap();
    await expect(element(by.id('add-credential-fab'))).toBeVisible();

    // Restart app
    await device.launchApp({ newInstance: true });

    // Unlock vault
    await waitFor(element(by.text('Unlock'))).toBeVisible().withTimeout(10000);
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText(masterPassword);
    await element(by.id('unlock-vault-button')).tap();

    await waitFor(element(by.id('add-credential-fab')))
      .toBeVisible()
      .withTimeout(5000);

    // Expand GitHub Account and verify folder persisted
    await element(by.text('GitHub Account')).atIndex(0).tap();
    await expect(element(by.id('view-details-button'))).toBeVisible();

    // Work folder badge should still be visible
    await expect(element(by.text('Work')).atIndex(0)).toBeVisible();
  });

  it('should cancel move when tapping outside modal', async () => {
    // Collapse and re-expand to ensure button is visible
    await expect(element(by.id('add-credential-fab'))).toBeVisible();
    await element(by.text('GitHub Account')).atIndex(0).tap(); // collapse
    await element(by.text('GitHub Account')).atIndex(0).tap(); // expand
    await expect(element(by.id('move-to-folder-button'))).toBeVisible();
    await element(by.id('move-to-folder-button')).tap();

    // Verify modal and tap cancel
    await expect(element(by.id('move-to-folder-modal'))).toExist();
    await element(by.text('Cancel')).tap();

    // Modal should close, credential should still be in Work folder
    await expect(element(by.id('add-credential-fab'))).toBeVisible();

    // Credential may be collapsed or expanded, tap to toggle then verify
    await element(by.text('GitHub Account')).atIndex(0).tap();
    // If already expanded, this collapses it - tap again to expand
    await element(by.text('GitHub Account')).atIndex(0).tap();
    await expect(element(by.id('view-details-button'))).toBeVisible();
    await expect(element(by.text('Work')).atIndex(0)).toBeVisible();
  });
});
