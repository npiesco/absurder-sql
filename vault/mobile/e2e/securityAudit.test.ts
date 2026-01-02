/**
 * Security Audit E2E Tests
 *
 * Tests for Phase 4.3 Security Audit:
 * - Weak password detection (informative only)
 * - Password age tracking
 * - Security audit dashboard
 */

import { by, device, element, expect, waitFor } from 'detox';

describe('Security Audit', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  // ==================== SETUP ====================

  it('should setup vault with various password strengths', async () => {
    // Create vault - tap Create New first
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('AuditTest123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('AuditTest123!');
    await element(by.id('create-vault-button')).tap();

    await waitFor(element(by.text('Vault')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should create credential with weak password', async () => {
    // Add credential with weak password (short, common)
    await element(by.id('add-credential-fab')).tap();
    await waitFor(element(by.id('credential-name-input')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('credential-name-input')).typeText('Weak Password Account');
    await element(by.id('credential-name-input')).tapReturnKey();
    await element(by.id('credential-username-input')).typeText('weakuser');
    await element(by.id('credential-username-input')).tapReturnKey();
    
    // Type a weak password - short and simple
    await element(by.id('credential-password-input')).typeText('123456');
    await element(by.id('credential-password-input')).tapReturnKey();

    // Save
    await element(by.id('save-credential-button')).tap();
    await expect(element(by.text('Weak Password Account'))).toBeVisible();
  });

  it('should create credential with strong password', async () => {
    // Add credential with strong password
    await element(by.id('add-credential-fab')).tap();
    await waitFor(element(by.id('credential-name-input')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('credential-name-input')).typeText('Strong Password Account');
    await element(by.id('credential-name-input')).tapReturnKey();
    await element(by.id('credential-username-input')).typeText('stronguser');
    await element(by.id('credential-username-input')).tapReturnKey();
    
    // Type a strong password - long, mixed case, numbers, symbols
    await element(by.id('credential-password-input')).typeText('Str0ng&Secure#Pass2024!');
    await element(by.id('credential-password-input')).tapReturnKey();

    // Save
    await element(by.id('save-credential-button')).tap();
    await expect(element(by.text('Strong Password Account'))).toBeVisible();
  });

  it('should create credential with medium password', async () => {
    // Add credential with medium strength password
    await element(by.id('add-credential-fab')).tap();
    await waitFor(element(by.id('credential-name-input')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('credential-name-input')).typeText('Medium Password Account');
    await element(by.id('credential-name-input')).tapReturnKey();
    await element(by.id('credential-username-input')).typeText('mediumuser');
    await element(by.id('credential-username-input')).tapReturnKey();
    
    // Type a medium password - decent length but predictable
    await element(by.id('credential-password-input')).typeText('Password123');
    await element(by.id('credential-password-input')).tapReturnKey();

    // Save
    await element(by.id('save-credential-button')).tap();
    await expect(element(by.text('Medium Password Account'))).toBeVisible();
  });

  // ==================== NAVIGATE TO SECURITY AUDIT ====================

  it('should navigate to settings', async () => {
    await element(by.id('settings-button')).tap();
    await expect(element(by.text('Settings'))).toBeVisible();
  });

  it('should display security audit button in settings', async () => {
    await expect(element(by.id('security-audit-button'))).toBeVisible();
    await expect(element(by.text('Security Audit'))).toBeVisible();
  });

  it('should open security audit dashboard', async () => {
    await element(by.id('security-audit-button')).tap();
    await waitFor(element(by.text('Security Audit')))
      .toBeVisible()
      .withTimeout(5000);
  });

  // ==================== WEAK PASSWORD DETECTION ====================

  it('should display weak passwords section', async () => {
    await expect(element(by.id('weak-passwords-section'))).toExist();
  });

  it('should show weak password count', async () => {
    // Should show at least 1 weak password (123456)
    await expect(element(by.id('weak-password-count'))).toBeVisible();
  });

  it('should list credential with weak password', async () => {
    // The weak password account should be listed
    await expect(element(by.id('weak-password-item-Weak Password Account'))).toBeVisible();
  });

  it('should show password strength indicator for weak password', async () => {
    // Should show at least one "Weak" indicator
    await expect(element(by.id('strength-indicator-weak')).atIndex(0)).toExist();
  });

  it('should not list strong password in weak section', async () => {
    // Strong password account should NOT be in weak passwords list
    await expect(element(by.id('weak-password-item-Strong Password Account'))).not.toBeVisible();
  });

  // ==================== PASSWORD AGE TRACKING ====================

  it('should display password age section exists', async () => {
    // Password age section should exist in the screen
    await expect(element(by.id('password-age-section'))).toExist();
  });

  it('should show old password count exists', async () => {
    // Old password count should exist
    await expect(element(by.id('old-password-count'))).toExist();
  });

  // ==================== DASHBOARD SUMMARY ====================

  it('should display security summary', async () => {
    await expect(element(by.id('security-summary'))).toExist();
  });

  it('should show total credentials count', async () => {
    await expect(element(by.id('total-credentials-count'))).toExist();
  });

  it('should show weak password percentage', async () => {
    await expect(element(by.id('weak-percentage'))).toExist();
  });

  // ==================== NAVIGATION FROM AUDIT ====================

  it('should navigate back to settings from audit', async () => {
    await element(by.id('audit-back-button')).tap();
    await waitFor(element(by.text('Settings')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should navigate back to vault from settings', async () => {
    await element(by.id('settings-back-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();
  });

  // ==================== VERIFY NON-BLOCKING ====================

  it('should still be able to use weak password credential normally', async () => {
    // Tap on the weak password credential
    await element(by.text('Weak Password Account')).tap();
    
    // Should be able to copy password (not blocked)
    await waitFor(element(by.id('copy-password-button')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('copy-password-button')).tap();
    
    // Should show copied confirmation alert
    await waitFor(element(by.text('Password copied to clipboard')))
      .toBeVisible()
      .withTimeout(3000);
    
    // Dismiss alert
    await element(by.text('OK')).tap();
  });
});
