/**
 * Master Password E2E Test
 *
 * Tests master password management:
 * 1. Display change password button in settings
 * 2. Show change password modal with validation
 * 3. Require current password verification
 * 4. Require new password confirmation
 * 5. Enforce minimum password length (12 chars)
 * 6. Successfully change master password
 * 7. Verify old password no longer works
 * 8. Verify new password unlocks vault
 * 9. Show password strength meter during change
 * 10. Support optional password hint
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Master Password', () => {
  const ORIGINAL_PASSWORD = 'OriginalPass123!';
  const NEW_PASSWORD = 'NewSecurePass456!';
  const WEAK_PASSWORD = 'weak';
  const PASSWORD_HINT = 'My favorite color';

  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });

    // Create vault with original password
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText(ORIGINAL_PASSWORD);
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText(ORIGINAL_PASSWORD);
    await element(by.id('create-vault-button')).tap();

    // Wait for credentials screen
    await waitFor(element(by.text('Vault'))).toBeVisible().withTimeout(5000);

    // Add a credential to verify data persists after password change
    await element(by.id('add-credential-fab')).tap();
    await element(by.id('credential-name-input')).typeText('Test Account');
    await element(by.id('credential-name-input')).tapReturnKey();
    await element(by.id('credential-username-input')).typeText('test@example.com');
    await element(by.id('credential-username-input')).tapReturnKey();
    await element(by.id('credential-password-input')).typeText('TestPass123!');
    await element(by.id('credential-password-input')).tapReturnKey();
    await element(by.id('save-credential-button')).tap();

    await waitFor(element(by.text('Test Account'))).toBeVisible().withTimeout(5000);
  });

  it('should display change password button in settings', async () => {
    await element(by.id('settings-button')).tap();
    await waitFor(element(by.text('Settings'))).toBeVisible().withTimeout(5000);

    // Scroll to find change password button
    await waitFor(element(by.id('change-password-button')))
      .toBeVisible()
      .whileElement(by.id('settings-scroll'))
      .scroll(200, 'down');

    await expect(element(by.id('change-password-button'))).toBeVisible();
  });

  it('should show change password modal with all fields', async () => {
    await element(by.id('change-password-button')).tap();

    // Verify modal appears with required fields
    await waitFor(element(by.id('current-password-input')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.id('new-password-input'))).toExist();
    await expect(element(by.id('confirm-new-password-input'))).toExist();
    await expect(element(by.id('password-hint-input'))).toExist();
    await expect(element(by.id('save-password-button'))).toExist();
  });

  it('should show password strength meter', async () => {
    // Type a weak password and verify strength indicator shows
    await element(by.id('new-password-input')).tap();
    await element(by.id('new-password-input')).typeText(WEAK_PASSWORD);
    await element(by.id('new-password-input')).tapReturnKey();
    await expect(element(by.id('password-strength-meter'))).toExist();
    await expect(element(by.id('password-strength-weak'))).toExist();

    // Clear and type strong password
    await element(by.id('new-password-input')).clearText();
    await element(by.id('new-password-input')).typeText(NEW_PASSWORD);
    await element(by.id('new-password-input')).tapReturnKey();
    await expect(element(by.id('password-strength-strong'))).toExist();
  });

  it('should reject incorrect current password', async () => {
    // Fill in current password (wrong)
    await element(by.id('current-password-input')).tap();
    await element(by.id('current-password-input')).typeText('WrongPassword123!');
    await element(by.id('current-password-input')).tapReturnKey();
    
    // Fill in confirm password
    await element(by.id('confirm-new-password-input')).tap();
    await element(by.id('confirm-new-password-input')).typeText(NEW_PASSWORD);
    await element(by.id('confirm-new-password-input')).tapReturnKey();
    
    await element(by.id('save-password-button')).tap();

    await waitFor(element(by.text('Current password is incorrect')))
      .toBeVisible()
      .withTimeout(3000);
    await element(by.text('OK')).tap();

    // Clear for next test
    await element(by.id('current-password-input')).clearText();
    await element(by.id('confirm-new-password-input')).clearText();
  });

  it('should reject mismatched new passwords', async () => {
    await element(by.id('current-password-input')).tap();
    await element(by.id('current-password-input')).typeText(ORIGINAL_PASSWORD);
    await element(by.id('current-password-input')).tapReturnKey();
    
    await element(by.id('new-password-input')).clearText();
    await element(by.id('new-password-input')).typeText(NEW_PASSWORD);
    await element(by.id('new-password-input')).tapReturnKey();
    
    await element(by.id('confirm-new-password-input')).tap();
    await element(by.id('confirm-new-password-input')).typeText('DifferentPass123!');
    await element(by.id('confirm-new-password-input')).tapReturnKey();
    
    await element(by.id('save-password-button')).tap();

    await waitFor(element(by.text('New passwords do not match')))
      .toBeVisible()
      .withTimeout(3000);
    await element(by.text('OK')).tap();

    // Clear for next test
    await element(by.id('current-password-input')).clearText();
    await element(by.id('new-password-input')).clearText();
    await element(by.id('confirm-new-password-input')).clearText();
  });

  it('should reject password shorter than 12 characters', async () => {
    await element(by.id('current-password-input')).tap();
    await element(by.id('current-password-input')).typeText(ORIGINAL_PASSWORD);
    await element(by.id('current-password-input')).tapReturnKey();
    
    await element(by.id('new-password-input')).tap();
    await element(by.id('new-password-input')).typeText('Short1!');
    await element(by.id('new-password-input')).tapReturnKey();
    
    await element(by.id('confirm-new-password-input')).tap();
    await element(by.id('confirm-new-password-input')).typeText('Short1!');
    await element(by.id('confirm-new-password-input')).tapReturnKey();
    
    await element(by.id('save-password-button')).tap();

    await waitFor(element(by.text('New password must be at least 12 characters')))
      .toBeVisible()
      .withTimeout(3000);
    await element(by.text('OK')).tap();

    // Clear for next test
    await element(by.id('current-password-input')).clearText();
    await element(by.id('new-password-input')).clearText();
    await element(by.id('confirm-new-password-input')).clearText();
  });

  it('should successfully change master password with hint', async () => {
    await element(by.id('current-password-input')).tap();
    await element(by.id('current-password-input')).typeText(ORIGINAL_PASSWORD);
    await element(by.id('current-password-input')).tapReturnKey();
    
    await element(by.id('new-password-input')).tap();
    await element(by.id('new-password-input')).typeText(NEW_PASSWORD);
    await element(by.id('new-password-input')).tapReturnKey();
    
    await element(by.id('confirm-new-password-input')).tap();
    await element(by.id('confirm-new-password-input')).typeText(NEW_PASSWORD);
    await element(by.id('confirm-new-password-input')).tapReturnKey();
    
    await element(by.id('password-hint-input')).tap();
    await element(by.id('password-hint-input')).typeText(PASSWORD_HINT);
    await element(by.id('password-hint-input')).tapReturnKey();
    
    await element(by.id('save-password-button')).tap();

    // Verify success message
    await waitFor(element(by.text('Password Changed')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text('OK')).tap();

    // Should be back on settings screen
    await waitFor(element(by.text('Settings'))).toBeVisible().withTimeout(5000);
  });

  it('should lock vault and verify old password fails', async () => {
    // Scroll to lock button
    await element(by.id('settings-scroll')).scrollTo('top');
    await waitFor(element(by.id('lock-vault-button')))
      .toBeVisible()
      .whileElement(by.id('settings-scroll'))
      .scroll(200, 'down');
    await element(by.id('lock-vault-button')).tap();

    // Verify on unlock screen
    await waitFor(element(by.id('unlock-vault-button'))).toBeVisible().withTimeout(5000);

    // Try old password
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText(ORIGINAL_PASSWORD);
    await element(by.id('unlock-vault-button')).tap();

    // Should show error - the error container should be visible
    await waitFor(element(by.id('master-password-input')))
      .toBeVisible()
      .withTimeout(5000);
    // We're still on unlock screen (unlock failed)
  });

  it('should unlock vault with new password', async () => {
    // Clear and enter new password
    await element(by.id('master-password-input')).clearText();
    await element(by.id('master-password-input')).replaceText(NEW_PASSWORD);
    await element(by.id('unlock-vault-button')).tap();

    // Should unlock successfully
    await waitFor(element(by.text('Vault'))).toBeVisible().withTimeout(5000);
  });

  it('should preserve data after password change', async () => {
    // Verify credential still exists
    await expect(element(by.text('Test Account'))).toBeVisible();
  });

  it('should show password hint on unlock screen', async () => {
    // Lock vault again
    await element(by.id('settings-button')).tap();
    await waitFor(element(by.text('Settings'))).toBeVisible().withTimeout(5000);

    await element(by.id('settings-scroll')).scrollTo('top');
    await waitFor(element(by.id('lock-vault-button')))
      .toBeVisible()
      .whileElement(by.id('settings-scroll'))
      .scroll(200, 'down');
    await element(by.id('lock-vault-button')).tap();

    // Verify hint is shown
    await waitFor(element(by.id('unlock-vault-button'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('password-hint-display'))).toBeVisible();
    await expect(element(by.text(`Hint: ${PASSWORD_HINT}`))).toBeVisible();
  });

  it('should persist password change across app restart', async () => {
    // Unlock with new password
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText(NEW_PASSWORD);
    await element(by.id('unlock-vault-button')).tap();

    await waitFor(element(by.text('Vault'))).toBeVisible().withTimeout(5000);

    // Restart app
    await device.launchApp({ newInstance: true });

    // Verify unlock screen shows hint
    await waitFor(element(by.id('unlock-vault-button'))).toBeVisible().withTimeout(5000);
    await expect(element(by.text(`Hint: ${PASSWORD_HINT}`))).toBeVisible();

    // Unlock with new password
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText(NEW_PASSWORD);
    await element(by.id('unlock-vault-button')).tap();

    // Verify data persisted
    await waitFor(element(by.text('Vault'))).toBeVisible().withTimeout(5000);
    await expect(element(by.text('Test Account'))).toBeVisible();
  });
});
