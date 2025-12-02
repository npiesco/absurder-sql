/**
 * AddEditCredentialScreen E2E Test
 *
 * Tests the complete flow of adding a credential to the vault:
 * 1. Create vault with master password
 * 2. Navigate to add credential screen
 * 3. Fill in credential details
 * 4. Save and verify credential appears in list
 */

import { device, element, by, expect } from 'detox';

describe('Add Credential Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should create vault and add a credential', async () => {
    // Step 1: Create new vault (use default vault.db name so unlock works in subsequent tests)
    await element(by.text('Create New')).tap();

    // For password fields, tap to focus and use replaceText to avoid iOS AutoStrong Password
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('SecurePassword123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('SecurePassword123!');
    await element(by.id('create-vault-button')).tap();

    // Step 2: Verify we're on credentials screen
    await expect(element(by.text('Vault'))).toBeVisible();

    // Step 3: Tap FAB to add credential
    await element(by.id('add-credential-fab')).tap();

    // Step 4: Fill in credential details
    await expect(element(by.text('Add Credential'))).toBeVisible();
    await element(by.id('credential-name-input')).typeText('GitHub');
    await element(by.id('credential-username-input')).typeText('testuser@example.com');
    await element(by.id('credential-password-input')).typeText('MyGitHubPassword123!');

    // Scroll down to make URL field visible (keyboard covers it, form is taller with mode toggle)
    await element(by.id('credential-form-scroll')).scroll(400, 'down');
    await element(by.id('credential-url-input')).typeText('https://github.com');

    // Step 5: Save credential
    await element(by.id('save-credential-button')).tap();

    // Step 6: Verify credential appears in list
    await expect(element(by.text('GitHub'))).toBeVisible();
    await expect(element(by.text('testuser@example.com'))).toBeVisible();
  });

  it('should edit an existing credential', async () => {
    // Assumes vault already exists from previous test
    // Step 1: Unlock vault
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('SecurePassword123!');
    await element(by.id('unlock-vault-button')).tap();

    // Step 2: Tap on credential to expand
    await element(by.text('GitHub')).tap();

    // Step 3: Tap edit button
    await element(by.id('edit-credential-button')).tap();

    // Step 4: Modify credential
    await expect(element(by.text('Edit Credential'))).toBeVisible();
    await element(by.id('credential-name-input')).clearText();
    await element(by.id('credential-name-input')).typeText('GitHub Enterprise');

    // Step 5: Save changes
    await element(by.id('save-credential-button')).tap();

    // Step 6: Verify changes
    await expect(element(by.text('GitHub Enterprise'))).toBeVisible();
  });

  it('should validate required fields when adding credential', async () => {
    // Step 1: Unlock vault
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('SecurePassword123!');
    await element(by.id('unlock-vault-button')).tap();

    // Step 2: Tap FAB to add credential
    await element(by.id('add-credential-fab')).tap();

    // Step 3: Try to save without filling required fields
    await element(by.id('save-credential-button')).tap();

    // Step 4: Verify validation error
    await expect(element(by.text('Name is required'))).toBeVisible();
  });

  it('should generate password when requested', async () => {
    // Step 1: Unlock vault
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('SecurePassword123!');
    await element(by.id('unlock-vault-button')).tap();

    // Step 2: Navigate to add credential
    await element(by.id('add-credential-fab')).tap();

    // Step 3: Tap generate password button
    await element(by.id('generate-password-button')).tap();

    // Step 4: Verify password field is populated
    const passwordInput = element(by.id('credential-password-input'));
    await expect(passwordInput).not.toHaveText('');
  });

  it('should delete a credential', async () => {
    // Step 1: Unlock vault
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('SecurePassword123!');
    await element(by.id('unlock-vault-button')).tap();

    // Step 2: Long press on credential to show delete option
    await element(by.text('GitHub Enterprise')).longPress();

    // Step 3: Confirm delete in alert
    await element(by.text('Delete')).tap();

    // Step 4: Verify credential is removed
    await expect(element(by.text('GitHub Enterprise'))).not.toBeVisible();
  });
});
