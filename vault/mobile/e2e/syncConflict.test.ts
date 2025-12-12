/**
 * E2E Tests for Sync Conflict Detection and Merge
 *
 * Tests the sync conflict detection and merge functionality:
 * 1. Detect when imported vault has conflicting credentials
 * 2. Show conflict resolution UI
 * 3. Allow user to choose resolution strategy (keep local, keep remote, keep both)
 * 4. Merge non-conflicting credentials automatically
 * 5. Persist merge results correctly
 */

import { by, device, element, expect, waitFor } from 'detox';

describe('Sync Conflict Detection', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('should setup vault with initial credentials', async () => {
    // Create new vault
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('SyncTest123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('SyncTest123!');
    await element(by.id('create-vault-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Add first credential
    await element(by.id('add-credential-fab')).tap();
    await waitFor(element(by.id('credential-name-input'))).toBeVisible().withTimeout(5000);
    await element(by.id('credential-name-input')).typeText('Sync Test Account');
    await element(by.id('credential-name-input')).tapReturnKey();
    await element(by.id('credential-username-input')).typeText('sync@test.com');
    await element(by.id('credential-username-input')).tapReturnKey();
    await element(by.id('credential-password-input')).typeText('OriginalPass123!');
    await element(by.id('credential-password-input')).tapReturnKey();
    await element(by.id('save-credential-button')).tap();
    await expect(element(by.text('Sync Test Account'))).toBeVisible();

    // Add second credential (will not conflict)
    await element(by.id('add-credential-fab')).tap();
    await waitFor(element(by.id('credential-name-input'))).toBeVisible().withTimeout(5000);
    await element(by.id('credential-name-input')).typeText('No Conflict Account');
    await element(by.id('credential-name-input')).tapReturnKey();
    await element(by.id('credential-username-input')).typeText('noconflict@test.com');
    await element(by.id('credential-username-input')).tapReturnKey();
    await element(by.id('credential-password-input')).typeText('NoConflictPass!');
    await element(by.id('credential-password-input')).tapReturnKey();
    await element(by.id('save-credential-button')).tap();
    await expect(element(by.text('No Conflict Account'))).toBeVisible();
  });

  it('should export vault as baseline', async () => {
    // Navigate to settings
    await element(by.id('settings-button')).tap();
    await expect(element(by.text('Settings'))).toBeVisible();

    // Export vault
    await element(by.id('export-vault-button')).tap();
    await expect(element(by.text('Export'))).toBeVisible();
    await element(by.text('Export')).tap();

    // Wait for success
    await waitFor(element(by.text('Success'))).toBeVisible().withTimeout(10000);
    await element(by.text('OK')).tap();

    // Navigate back
    await element(by.id('settings-back-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();
  });

  it('should modify credential to create conflict scenario', async () => {
    // Tap on credential to expand
    await element(by.text('Sync Test Account')).tap();

    // Edit the credential
    await element(by.id('edit-credential-button')).tap();
    await waitFor(element(by.id('credential-password-input'))).toBeVisible().withTimeout(5000);

    // Change the password (this creates a conflict with the exported version)
    await element(by.id('credential-password-input')).clearText();
    await element(by.id('credential-password-input')).typeText('ModifiedPass456!');
    await element(by.id('credential-password-input')).tapReturnKey();

    // Save changes
    await element(by.id('save-credential-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();
  });

  it('should add new credential after export (will be merged)', async () => {
    // Add a new credential that wasn't in the export
    await element(by.id('add-credential-fab')).tap();
    await waitFor(element(by.id('credential-name-input'))).toBeVisible().withTimeout(5000);
    await element(by.id('credential-name-input')).typeText('New After Export');
    await element(by.id('credential-name-input')).tapReturnKey();
    await element(by.id('credential-username-input')).typeText('newafter@test.com');
    await element(by.id('credential-username-input')).tapReturnKey();
    await element(by.id('credential-password-input')).typeText('NewAfterPass!');
    await element(by.id('credential-password-input')).tapReturnKey();
    await element(by.id('save-credential-button')).tap();
    await expect(element(by.text('New After Export'))).toBeVisible();
  });

  it('should detect conflicts when importing older backup', async () => {
    // Navigate to settings
    await element(by.id('settings-button')).tap();
    await expect(element(by.text('Settings'))).toBeVisible();

    // Tap import
    await element(by.id('import-vault-button')).tap();
    await waitFor(element(by.text('Recent Backups'))).toBeVisible().withTimeout(3000);
    await element(by.text('Recent Backups')).tap();

    // Select the backup file
    await waitFor(element(by.id('backup-file-item-0'))).toBeVisible().withTimeout(5000);
    await element(by.id('backup-file-item-0')).tap();

    // Should show conflict detection modal
    await waitFor(element(by.text('Conflicts Detected'))).toBeVisible().withTimeout(10000);
    await expect(element(by.text('1 credential has conflicts'))).toBeVisible();
  });

  it('should display conflict details', async () => {
    // Verify conflict details are shown
    await expect(element(by.text('Sync Test Account'))).toBeVisible();
    await expect(element(by.text('Local version'))).toBeVisible();
    await expect(element(by.text('Backup version'))).toBeVisible();
  });

  it('should allow keeping local version', async () => {
    // Select "Keep Local" for the conflict
    await element(by.id('keep-local-button')).tap();

    // Verify selection is shown
    await expect(element(by.id('conflict-resolved-local'))).toBeVisible();
  });

  it('should complete merge with selected resolution', async () => {
    // Tap "Complete Merge" button
    await element(by.id('complete-merge-button')).tap();

    // Wait for merge to complete
    await waitFor(element(by.text('Merge Complete'))).toBeVisible().withTimeout(10000);
    await element(by.text('OK')).tap();
    
    // Wait for alert to dismiss
    await waitFor(element(by.id('settings-back-button'))).toBeVisible().withTimeout(3000);
  });

  it('should verify local version was kept', async () => {
    // Navigate back to credentials (alert should be dismissed from previous test)
    await element(by.id('settings-back-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Tap on the credential
    await element(by.text('Sync Test Account')).tap();

    // View details
    await element(by.id('view-details-button')).tap();

    // Verify the local (modified) password is still there
    // Toggle password visibility
    await element(by.id('toggle-password-visibility')).tap();
    await expect(element(by.text('ModifiedPass456!'))).toBeVisible();

    // Navigate back
    await element(by.id('detail-back-button')).tap();
  });

  it('should preserve credentials added after export', async () => {
    // Verify the credential added after export still exists
    await expect(element(by.text('New After Export'))).toBeVisible();
  });

  it('should preserve non-conflicting credentials', async () => {
    // Verify the non-conflicting credential still exists
    await expect(element(by.text('No Conflict Account'))).toBeVisible();
  });
});

describe('Sync Merge - Keep Remote', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('should setup vault and create conflict scenario', async () => {
    // Create new vault
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('MergeTest123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('MergeTest123!');
    await element(by.id('create-vault-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Add credential
    await element(by.id('add-credential-fab')).tap();
    await waitFor(element(by.id('credential-name-input'))).toBeVisible().withTimeout(5000);
    await element(by.id('credential-name-input')).typeText('Remote Test Account');
    await element(by.id('credential-name-input')).tapReturnKey();
    await element(by.id('credential-username-input')).typeText('remote@test.com');
    await element(by.id('credential-username-input')).tapReturnKey();
    await element(by.id('credential-password-input')).typeText('BackupPassword!');
    await element(by.id('credential-password-input')).tapReturnKey();
    await element(by.id('save-credential-button')).tap();
    await expect(element(by.text('Remote Test Account'))).toBeVisible();
  });

  it('should export vault as baseline', async () => {
    await element(by.id('settings-button')).tap();
    await element(by.id('export-vault-button')).tap();
    await element(by.text('Export')).tap();
    await waitFor(element(by.text('Success'))).toBeVisible().withTimeout(10000);
    await element(by.text('OK')).tap();
    await element(by.id('settings-back-button')).tap();
  });

  it('should modify credential locally', async () => {
    await element(by.text('Remote Test Account')).tap();
    await element(by.id('edit-credential-button')).tap();
    await waitFor(element(by.id('credential-password-input'))).toBeVisible().withTimeout(5000);
    await element(by.id('credential-password-input')).clearText();
    await element(by.id('credential-password-input')).typeText('LocalModified!');
    await element(by.id('credential-password-input')).tapReturnKey();
    await element(by.id('save-credential-button')).tap();
  });

  it('should import and choose keep remote', async () => {
    await element(by.id('settings-button')).tap();
    await element(by.id('import-vault-button')).tap();
    await element(by.text('Recent Backups')).tap();
    await waitFor(element(by.id('backup-file-item-0'))).toBeVisible().withTimeout(5000);
    await element(by.id('backup-file-item-0')).tap();

    // Wait for conflict modal
    await waitFor(element(by.text('Conflicts Detected'))).toBeVisible().withTimeout(10000);

    // Choose keep remote
    await element(by.id('keep-remote-button')).tap();
    await element(by.id('complete-merge-button')).tap();

    await waitFor(element(by.text('Merge Complete'))).toBeVisible().withTimeout(10000);
    await element(by.text('OK')).tap();
  });

  it('should verify remote version was applied', async () => {
    await element(by.id('settings-back-button')).tap();
    await element(by.text('Remote Test Account')).tap();
    await element(by.id('view-details-button')).tap();
    await element(by.id('toggle-password-visibility')).tap();

    // Should show the backup password, not the local modified one
    await expect(element(by.text('BackupPassword!'))).toBeVisible();

    await element(by.id('detail-back-button')).tap();
  });
});

describe('Sync Merge - Keep Both', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('should setup vault and create conflict scenario', async () => {
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('BothTest123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('BothTest123!');
    await element(by.id('create-vault-button')).tap();

    await element(by.id('add-credential-fab')).tap();
    await waitFor(element(by.id('credential-name-input'))).toBeVisible().withTimeout(5000);
    await element(by.id('credential-name-input')).typeText('Both Test Account');
    await element(by.id('credential-name-input')).tapReturnKey();
    await element(by.id('credential-username-input')).typeText('both@test.com');
    await element(by.id('credential-username-input')).tapReturnKey();
    await element(by.id('credential-password-input')).typeText('OriginalBoth!');
    await element(by.id('credential-password-input')).tapReturnKey();
    await element(by.id('save-credential-button')).tap();
  });

  it('should export vault as baseline', async () => {
    await element(by.id('settings-button')).tap();
    await element(by.id('export-vault-button')).tap();
    await element(by.text('Export')).tap();
    await waitFor(element(by.text('Success'))).toBeVisible().withTimeout(10000);
    await element(by.text('OK')).tap();
    await element(by.id('settings-back-button')).tap();
  });

  it('should modify credential locally', async () => {
    await element(by.text('Both Test Account')).tap();
    await element(by.id('edit-credential-button')).tap();
    await waitFor(element(by.id('credential-password-input'))).toBeVisible().withTimeout(5000);
    await element(by.id('credential-password-input')).clearText();
    await element(by.id('credential-password-input')).typeText('ModifiedBoth!');
    await element(by.id('credential-password-input')).tapReturnKey();
    await element(by.id('save-credential-button')).tap();
  });

  it('should import and choose keep both', async () => {
    await element(by.id('settings-button')).tap();
    await element(by.id('import-vault-button')).tap();
    await element(by.text('Recent Backups')).tap();
    await waitFor(element(by.id('backup-file-item-0'))).toBeVisible().withTimeout(5000);
    await element(by.id('backup-file-item-0')).tap();

    await waitFor(element(by.text('Conflicts Detected'))).toBeVisible().withTimeout(10000);

    // Choose keep both
    await element(by.id('keep-both-button')).tap();
    await element(by.id('complete-merge-button')).tap();

    await waitFor(element(by.text('Merge Complete'))).toBeVisible().withTimeout(10000);
    await element(by.text('OK')).tap();
  });

  it('should have both versions as separate credentials', async () => {
    await element(by.id('settings-back-button')).tap();

    // Should see both the original and a copy
    await expect(element(by.text('Both Test Account'))).toBeVisible();
    await expect(element(by.text('Both Test Account (from backup)'))).toBeVisible();
  });

  it('should persist merge results across app restart', async () => {
    await device.terminateApp();
    await device.launchApp({ newInstance: false });

    await waitFor(element(by.id('master-password-input'))).toBeVisible().withTimeout(10000);
    await element(by.id('master-password-input')).typeText('BothTest123!');
    await element(by.id('master-password-input')).tapReturnKey();
    await element(by.id('unlock-vault-button')).tap();

    // Verify both versions still exist
    await expect(element(by.text('Both Test Account'))).toBeVisible();
    await expect(element(by.text('Both Test Account (from backup)'))).toBeVisible();
  });
});
