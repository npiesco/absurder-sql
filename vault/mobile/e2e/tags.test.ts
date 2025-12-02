/**
 * Tags E2E Test
 *
 * Tests tagging credentials for categorization:
 * 1. Display tag input in credential form
 * 2. Create and assign tag when saving credential
 * 3. Display tags on credential in list and detail
 * 4. Add multiple tags to credential
 * 5. Remove tag from credential
 * 6. Tags persist across app restart
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Tags', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });

    // Create vault for testing
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('TagsTest123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('TagsTest123!');
    await element(by.id('create-vault-button')).tap();

    // Wait for credentials screen
    await expect(element(by.text('Vault'))).toBeVisible();
  });

  it('should display add tag button in credential form', async () => {
    // Navigate to add credential screen
    await element(by.id('add-credential-fab')).tap();
    await expect(element(by.text('Add Credential'))).toBeVisible();

    // Scroll to find tags section
    await element(by.id('credential-form-scroll')).scrollTo('bottom');

    // Verify add tag button exists
    await expect(element(by.id('add-tag-button'))).toBeVisible();

    // Cancel
    await element(by.id('cancel-button')).tap();
  });

  it('should create and assign tag when saving credential', async () => {
    // Navigate to add credential screen
    await element(by.id('add-credential-fab')).tap();

    // Fill required fields
    await element(by.id('credential-name-input')).typeText('Work Email');
    await element(by.id('credential-username-input')).typeText('work@company.com');
    await element(by.id('credential-password-input')).typeText('WorkPass123!');

    // Scroll to tags section
    await element(by.id('credential-form-scroll')).scrollTo('bottom');

    // Add a tag
    await element(by.id('add-tag-button')).tap();
    await element(by.id('tag-input')).typeText('Work');
    await element(by.id('save-tag-button')).tap();

    // Verify tag chip appears
    await expect(element(by.id('tag-chip-Work'))).toBeVisible();

    // Save credential
    await element(by.id('save-credential-button')).tap();

    // Verify credential appears in list
    await expect(element(by.text('Work Email'))).toBeVisible();
  });

  it('should display tag on credential in list', async () => {
    // Verify tag badge is visible in list
    await expect(element(by.id('credential-tag-Work Email-Work'))).toBeVisible();
  });

  it('should display tag in credential detail', async () => {
    // Navigate to detail screen
    await element(by.text('Work Email')).tap();
    await element(by.id('view-details-button')).tap();

    // Scroll to see tags
    await element(by.id('detail-scroll')).scrollTo('bottom');

    // Verify tag is displayed
    await waitFor(element(by.id('detail-tag-Work')))
      .toBeVisible()
      .withTimeout(3000);

    // Go back
    await element(by.id('detail-back-button')).tap();
  });

  it('should add multiple tags to credential', async () => {
    // Edit credential
    await element(by.text('Work Email')).tap();
    await element(by.id('edit-credential-button')).tap();

    // Scroll to tags
    await element(by.id('credential-form-scroll')).scrollTo('bottom');

    // Add another tag
    await element(by.id('add-tag-button')).tap();
    await element(by.id('tag-input')).typeText('Email');
    await element(by.id('save-tag-button')).tap();

    // Verify both tags visible
    await expect(element(by.id('tag-chip-Work'))).toBeVisible();
    await expect(element(by.id('tag-chip-Email'))).toBeVisible();

    // Save
    await element(by.id('save-credential-button')).tap();

    // Verify in detail
    await element(by.text('Work Email')).tap();
    await element(by.id('view-details-button')).tap();
    await element(by.id('detail-scroll')).scrollTo('bottom');

    await expect(element(by.id('detail-tag-Work'))).toBeVisible();
    await expect(element(by.id('detail-tag-Email'))).toBeVisible();

    await element(by.id('detail-back-button')).tap();
  });

  it('should remove tag from credential', async () => {
    // Edit credential
    await element(by.text('Work Email')).tap();
    await element(by.id('edit-credential-button')).tap();

    // Scroll to tags
    await element(by.id('credential-form-scroll')).scrollTo('bottom');

    // Remove Email tag
    await element(by.id('remove-tag-Email')).tap();

    // Verify Email tag gone, Work remains
    await expect(element(by.id('tag-chip-Email'))).not.toBeVisible();
    await expect(element(by.id('tag-chip-Work'))).toBeVisible();

    // Save
    await element(by.id('save-credential-button')).tap();

    // Verify in detail
    await element(by.text('Work Email')).tap();
    await element(by.id('view-details-button')).tap();
    await element(by.id('detail-scroll')).scrollTo('bottom');

    await expect(element(by.id('detail-tag-Work'))).toBeVisible();
    await expect(element(by.id('detail-tag-Email'))).not.toBeVisible();

    await element(by.id('detail-back-button')).tap();
  });

  it('should persist tags across app restart', async () => {
    // Terminate and relaunch app
    await device.terminateApp();
    await device.launchApp({ newInstance: false });

    // Unlock vault
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('TagsTest123!');
    await element(by.id('unlock-vault-button')).tap();

    // Verify credential exists
    await expect(element(by.text('Work Email'))).toBeVisible();

    // Verify tag persisted in list
    await expect(element(by.id('credential-tag-Work Email-Work'))).toBeVisible();

    // Verify in detail
    await element(by.text('Work Email')).tap();
    await element(by.id('view-details-button')).tap();
    await element(by.id('detail-scroll')).scrollTo('bottom');

    await expect(element(by.id('detail-tag-Work'))).toBeVisible();
  });
});
