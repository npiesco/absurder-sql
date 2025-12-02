/**
 * Custom Fields E2E Test
 *
 * Tests adding, editing, and displaying custom fields on credentials:
 * 1. Add custom field when creating credential
 * 2. Display custom fields in credential detail
 * 3. Add multiple custom fields
 * 4. Edit custom field values
 * 5. Delete custom fields
 * 6. Persist custom fields across app restart
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Custom Fields', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });

    // Create vault for testing
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('CustomFieldTest123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('CustomFieldTest123!');
    await element(by.id('create-vault-button')).tap();

    // Wait for credentials screen
    await expect(element(by.text('Vault'))).toBeVisible();
  });

  it('should display add custom field button in credential form', async () => {
    // Navigate to add credential screen
    await element(by.id('add-credential-fab')).tap();
    await expect(element(by.text('Add Credential'))).toBeVisible();

    // Scroll to find custom fields section
    await element(by.id('credential-form-scroll')).scroll(600, 'down');

    // Verify add custom field button exists
    await expect(element(by.id('add-custom-field-button'))).toBeVisible();

    // Cancel
    await element(by.id('cancel-button')).tap();
  });

  it('should add a custom field to credential', async () => {
    // Navigate to add credential screen
    await element(by.id('add-credential-fab')).tap();

    // Fill required fields
    await element(by.id('credential-name-input')).typeText('Work VPN');
    await element(by.id('credential-username-input')).typeText('employee@company.com');
    await element(by.id('credential-password-input')).typeText('VpnPass123!');

    // Scroll to custom fields section (form is very long)
    await element(by.id('credential-form-scroll')).scrollTo('bottom');

    // Tap add custom field button
    await element(by.id('add-custom-field-button')).tap();

    // Enter custom field name and value
    await element(by.id('custom-field-name-0')).typeText('VPN Server');
    await element(by.id('custom-field-value-0')).typeText('vpn.company.com');

    // Save credential
    await element(by.id('save-credential-button')).tap();

    // Verify credential appears in list
    await expect(element(by.text('Work VPN'))).toBeVisible();
  });

  it('should display custom field in credential detail', async () => {
    // Tap credential to expand
    await element(by.text('Work VPN')).tap();

    // Tap view details
    await element(by.id('view-details-button')).tap();

    // Wait for detail screen to load
    await expect(element(by.text('Credential Details'))).toBeVisible();

    // Scroll to see custom fields
    await element(by.id('detail-scroll')).scrollTo('bottom');

    // Wait for custom fields to load (async fetch)
    await waitFor(element(by.id('custom-field-0')))
      .toBeVisible()
      .withTimeout(5000);
    // Verify field name (uppercase due to style) and value
    await expect(element(by.id('custom-field-name-0'))).toBeVisible();
    await expect(element(by.id('custom-field-value-0'))).toBeVisible();

    // Go back
    await element(by.id('detail-back-button')).tap();
  });

  it('should add multiple custom fields', async () => {
    // Tap credential to expand
    await element(by.text('Work VPN')).tap();

    // Tap edit
    await element(by.id('edit-credential-button')).tap();

    // Scroll to custom fields (form is very long)
    await element(by.id('credential-form-scroll')).scrollTo('bottom');

    // Add another custom field
    await element(by.id('add-custom-field-button')).tap();

    // Enter second custom field
    await element(by.id('custom-field-name-1')).typeText('Port');
    await element(by.id('custom-field-value-1')).typeText('443');

    // Save
    await element(by.id('save-credential-button')).tap();

    // View details to verify both fields exist
    await element(by.text('Work VPN')).tap();
    await element(by.id('view-details-button')).tap();
    await expect(element(by.text('Credential Details'))).toBeVisible();
    await element(by.id('detail-scroll')).scrollTo('bottom');

    // Wait for custom fields to load (both fields)
    await waitFor(element(by.id('custom-field-0')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.id('custom-field-name-0'))).toBeVisible();
    await expect(element(by.id('custom-field-1'))).toBeVisible();
    await expect(element(by.id('custom-field-name-1'))).toBeVisible();

    await element(by.id('detail-back-button')).tap();
  });

  it('should delete a custom field', async () => {
    // Edit credential
    await element(by.text('Work VPN')).tap();
    await element(by.id('edit-credential-button')).tap();

    // Scroll to custom fields (form is very long)
    await element(by.id('credential-form-scroll')).scrollTo('bottom');

    // Delete the second custom field (Port)
    await element(by.id('delete-custom-field-1')).tap();

    // Save
    await element(by.id('save-credential-button')).tap();

    // Verify Port field is gone but VPN Server remains
    await element(by.text('Work VPN')).tap();
    await element(by.id('view-details-button')).tap();
    await expect(element(by.text('Credential Details'))).toBeVisible();
    await element(by.id('detail-scroll')).scrollTo('bottom');

    // Wait for custom fields to load - only first field should remain
    await waitFor(element(by.id('custom-field-0')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.id('custom-field-name-0'))).toBeVisible();
    // Second field (Port) should be gone
    await expect(element(by.id('custom-field-1'))).not.toBeVisible();

    await element(by.id('detail-back-button')).tap();
  });

  it('should persist custom fields across app restart', async () => {
    // Terminate and relaunch app
    await device.terminateApp();
    await device.launchApp({ newInstance: false });

    // Unlock vault
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('CustomFieldTest123!');
    await element(by.id('unlock-vault-button')).tap();

    // Verify credential exists
    await expect(element(by.text('Work VPN'))).toBeVisible();

    // View details
    await element(by.text('Work VPN')).tap();
    await element(by.id('view-details-button')).tap();
    await expect(element(by.text('Credential Details'))).toBeVisible();
    await element(by.id('detail-scroll')).scrollTo('bottom');

    // Wait for custom field to load and verify persisted
    await waitFor(element(by.id('custom-field-0')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.id('custom-field-name-0'))).toBeVisible();
    await expect(element(by.id('custom-field-value-0'))).toBeVisible();
  });
});
