/**
 * Persistence E2E Test
 *
 * Verifies that multiple credentials persist across full app terminate/relaunch cycles.
 * This tests the encrypted SQLite database backed by absurder-sql-mobile.
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Credential Persistence', () => {
  beforeAll(async () => {
    // Fresh app launch
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('should store multiple credentials and persist across app restart', async () => {
    // Step 1: Create new vault
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('PersistenceTest123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('PersistenceTest123!');
    await element(by.id('create-vault-button')).tap();

    // Verify we're on credentials screen
    await expect(element(by.text('Vault'))).toBeVisible();

    // Step 2: Add first credential (GitHub)
    await element(by.id('add-credential-fab')).tap();
    await expect(element(by.text('Add Credential'))).toBeVisible();
    await element(by.id('credential-name-input')).typeText('GitHub');
    await element(by.id('credential-username-input')).typeText('dev@github.com');
    await element(by.id('credential-password-input')).typeText('GitHubPass123!');
    await element(by.id('save-credential-button')).tap();

    // Verify first credential saved
    await expect(element(by.text('GitHub'))).toBeVisible();
    await expect(element(by.text('dev@github.com'))).toBeVisible();

    // Step 3: Add second credential (Gmail)
    await element(by.id('add-credential-fab')).tap();
    await element(by.id('credential-name-input')).typeText('Gmail');
    await element(by.id('credential-username-input')).typeText('user@gmail.com');
    await element(by.id('credential-password-input')).typeText('GmailPass456!');
    await element(by.id('save-credential-button')).tap();

    // Verify both credentials visible
    await expect(element(by.text('GitHub'))).toBeVisible();
    await expect(element(by.text('Gmail'))).toBeVisible();

    // Step 4: Add third credential (Bank)
    await element(by.id('add-credential-fab')).tap();
    await element(by.id('credential-name-input')).typeText('Bank Account');
    await element(by.id('credential-username-input')).typeText('account123');
    await element(by.id('credential-password-input')).typeText('BankSecure789!');
    await element(by.id('save-credential-button')).tap();

    // Verify all three credentials visible
    await expect(element(by.text('GitHub'))).toBeVisible();
    await expect(element(by.text('Gmail'))).toBeVisible();
    await expect(element(by.text('Bank Account'))).toBeVisible();

    // Step 5: TERMINATE the app completely (cold kill)
    await device.terminateApp();

    // Step 6: RELAUNCH from cold start
    await device.launchApp({ newInstance: false });

    // Step 7: Unlock vault with same password
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('PersistenceTest123!');
    await element(by.id('unlock-vault-button')).tap();

    // Step 8: Verify ALL THREE credentials persisted
    await expect(element(by.text('GitHub'))).toBeVisible();
    await expect(element(by.text('dev@github.com'))).toBeVisible();
    await expect(element(by.text('Gmail'))).toBeVisible();
    await expect(element(by.text('user@gmail.com'))).toBeVisible();
    await expect(element(by.text('Bank Account'))).toBeVisible();
    await expect(element(by.text('account123'))).toBeVisible();
  });

  it('should persist edits across app restart', async () => {
    // App should already be unlocked from previous test, but let's be safe
    // Try to find GitHub - if not visible, we need to unlock
    try {
      await expect(element(by.text('GitHub'))).toBeVisible();
    } catch {
      // Need to unlock
      await element(by.id('master-password-input')).tap();
      await element(by.id('master-password-input')).replaceText('PersistenceTest123!');
      await element(by.id('unlock-vault-button')).tap();
    }

    // Edit the GitHub credential
    await element(by.text('GitHub')).tap();
    await element(by.id('edit-credential-button')).tap();
    await element(by.id('credential-name-input')).clearText();
    await element(by.id('credential-name-input')).typeText('GitHub Enterprise');
    await element(by.id('save-credential-button')).tap();

    // Verify edit applied
    await expect(element(by.text('GitHub Enterprise'))).toBeVisible();
    await expect(element(by.text('GitHub'))).not.toBeVisible();

    // Terminate and relaunch
    await device.terminateApp();
    await device.launchApp({ newInstance: false });

    // Unlock
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('PersistenceTest123!');
    await element(by.id('unlock-vault-button')).tap();

    // Verify edit persisted
    await expect(element(by.text('GitHub Enterprise'))).toBeVisible();
    await expect(element(by.text('Gmail'))).toBeVisible();
    await expect(element(by.text('Bank Account'))).toBeVisible();
  });

  it('should persist deletes across app restart', async () => {
    // Delete Gmail credential
    await waitFor(element(by.text('Gmail')))
      .toBeVisible()
      .whileElement(by.id('credentials-list'))
      .scroll(200, 'down');
    await element(by.text('Gmail')).longPress();
    await element(by.text('Delete')).tap();

    // Verify deleted
    await expect(element(by.text('Gmail'))).not.toBeVisible();
    await expect(element(by.text('GitHub Enterprise'))).toBeVisible();
    await expect(element(by.text('Bank Account'))).toBeVisible();

    // Terminate and relaunch
    await device.terminateApp();
    await device.launchApp({ newInstance: false });

    // Unlock
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('PersistenceTest123!');
    await element(by.id('unlock-vault-button')).tap();

    // Verify delete persisted - Gmail should NOT be there
    await expect(element(by.text('Gmail'))).not.toBeVisible();
    await expect(element(by.text('GitHub Enterprise'))).toBeVisible();
    await expect(element(by.text('Bank Account'))).toBeVisible();
  });
});
