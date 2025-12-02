/**
 * CredentialDetailScreen E2E Test
 *
 * Tests the credential detail view functionality:
 * 1. Navigate to detail screen from credentials list
 * 2. View all credential fields
 * 3. Toggle password visibility
 * 4. Copy fields to clipboard
 * 5. Navigate to edit from detail
 */

import { device, element, by, expect } from 'detox';

describe('Credential Detail Screen', () => {
  beforeAll(async () => {
    // Fresh app with clean data
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('should setup vault with test credential', async () => {
    // Create vault
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('DetailTest123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('DetailTest123!');
    await element(by.id('create-vault-button')).tap();

    // Verify on credentials screen
    await expect(element(by.text('Vault'))).toBeVisible();

    // Add a credential with all fields filled
    await element(by.id('add-credential-fab')).tap();
    await element(by.id('credential-name-input')).typeText('Test Bank');
    await element(by.id('credential-username-input')).typeText('banking@example.com');
    await element(by.id('credential-password-input')).typeText('SuperSecret$123');

    // Scroll to URL field (slider made form taller)
    await element(by.id('credential-form-scroll')).scroll(350, 'down');
    await element(by.id('credential-url-input')).typeText('https://bank.example.com');

    // Scroll more to reach notes field above keyboard
    await element(by.id('credential-form-scroll')).scroll(150, 'down');
    await element(by.id('credential-notes-input')).typeText('Security questions: Pet name is Fluffy');
    await element(by.id('save-credential-button')).tap();

    // Verify credential saved
    await expect(element(by.text('Test Bank'))).toBeVisible();
  });

  it('should navigate to detail screen when tapping view details', async () => {
    // Tap credential to expand
    await element(by.text('Test Bank')).tap();

    // Tap "View Details" button (we need to add this)
    await element(by.id('view-details-button')).tap();

    // Verify we're on detail screen
    await expect(element(by.text('Credential Details'))).toBeVisible();
    await expect(element(by.text('Test Bank'))).toBeVisible();
  });

  it('should display all credential fields', async () => {
    // Verify all fields are visible
    await expect(element(by.text('banking@example.com'))).toBeVisible();
    await expect(element(by.text('https://bank.example.com'))).toBeVisible();
    await expect(element(by.text('Security questions: Pet name is Fluffy'))).toBeVisible();

    // Password should be hidden by default (dots/asterisks)
    await expect(element(by.id('password-display'))).toBeVisible();
  });

  it('should toggle password visibility', async () => {
    // Tap show password toggle
    await element(by.id('toggle-password-visibility')).tap();

    // Password should now be visible
    await expect(element(by.text('SuperSecret$123'))).toBeVisible();

    // Tap again to hide
    await element(by.id('toggle-password-visibility')).tap();

    // Password should be hidden again (text not visible)
    await expect(element(by.text('SuperSecret$123'))).not.toBeVisible();
  });

  it('should copy username to clipboard', async () => {
    // Tap copy username button
    await element(by.id('copy-username-button')).tap();

    // Verify feedback (alert or toast)
    await expect(element(by.text('Copied'))).toBeVisible();
  });

  it('should copy password to clipboard', async () => {
    // Dismiss previous alert if present
    try {
      await element(by.text('OK')).tap();
    } catch {
      // No alert to dismiss
    }

    // Tap copy password button
    await element(by.id('copy-password-button')).tap();

    // Verify feedback
    await expect(element(by.text('Copied'))).toBeVisible();
  });

  it('should navigate to edit from detail screen', async () => {
    // Dismiss alert if present
    try {
      await element(by.text('OK')).tap();
    } catch {
      // No alert to dismiss
    }

    // Tap edit button
    await element(by.id('detail-edit-button')).tap();

    // Verify we're on edit screen
    await expect(element(by.text('Edit Credential'))).toBeVisible();

    // Verify fields are pre-populated
    const nameInput = element(by.id('credential-name-input'));
    await expect(nameInput).toHaveText('Test Bank');
  });

  it('should navigate back to credentials list', async () => {
    // Cancel edit
    await element(by.text('Cancel')).tap();

    // Should be back on detail screen or credentials list
    // Let's go back to list from detail
    await element(by.id('back-button')).tap();

    // Verify we're on credentials list
    await expect(element(by.text('Vault'))).toBeVisible();
    await expect(element(by.text('Test Bank'))).toBeVisible();
  });
});
