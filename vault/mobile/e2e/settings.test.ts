/**
 * SettingsScreen E2E Test
 *
 * Tests the settings screen functionality:
 * 1. Navigate to settings from credentials list
 * 2. View vault statistics
 * 3. Lock vault from settings
 * 4. Export vault database
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Settings Screen', () => {
  beforeAll(async () => {
    // Fresh app with clean data
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('should setup vault with credentials for testing', async () => {
    // Create vault
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('SettingsTest123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('SettingsTest123!');
    await element(by.id('create-vault-button')).tap();

    // Verify on credentials screen
    await expect(element(by.text('Vault'))).toBeVisible();

    // Add a test credential
    await element(by.id('add-credential-fab')).tap();
    await element(by.id('credential-name-input')).typeText('Test Account');
    await element(by.id('credential-username-input')).typeText('test@example.com');
    await element(by.id('credential-password-input')).typeText('TestPassword123!');
    await element(by.id('save-credential-button')).tap();

    // Verify credential saved
    await expect(element(by.text('Test Account'))).toBeVisible();
  });

  it('should navigate to settings screen', async () => {
    // Tap settings button in header
    await element(by.id('settings-button')).tap();

    // Verify we're on settings screen
    await expect(element(by.text('Settings'))).toBeVisible();
  });

  it('should display vault statistics', async () => {
    // Verify vault name is displayed
    await expect(element(by.id('vault-name-display'))).toBeVisible();

    // Verify credential count is displayed
    await expect(element(by.id('credential-count'))).toBeVisible();
    await expect(element(by.text('1 credential'))).toBeVisible();
  });

  it('should display security section', async () => {
    // Verify lock vault option
    await expect(element(by.id('lock-vault-button'))).toBeVisible();

    // Verify export option
    await expect(element(by.id('export-vault-button'))).toBeVisible();
  });

  it('should display about section', async () => {
    // About section should exist - use testID for reliable matching
    await element(by.id('settings-scroll')).scrollTo('bottom');

    // Verify about section exists (visibility threshold can fail on some devices)
    await expect(element(by.id('about-section'))).toExist();
    await expect(element(by.text('v1.0.0'))).toExist();
  });

  it('should navigate back to credentials', async () => {
    // Tap back button
    await element(by.id('settings-back-button')).tap();

    // Verify we're back on credentials screen
    await expect(element(by.text('Vault'))).toBeVisible();
    await expect(element(by.text('Test Account'))).toBeVisible();
  });

  it('should lock vault from settings', async () => {
    // Navigate to settings
    await element(by.id('settings-button')).tap();
    await expect(element(by.text('Settings'))).toBeVisible();

    // Tap lock vault
    await element(by.id('lock-vault-button')).tap();

    // Verify we're on unlock screen
    await expect(element(by.text('AbsurderSQL Vault'))).toBeVisible();
    await expect(element(by.id('master-password-input'))).toBeVisible();
  });

  it('should show export confirmation when tapping export', async () => {
    // Unlock vault first
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('SettingsTest123!');
    await element(by.id('unlock-vault-button')).tap();

    // Navigate to settings
    await element(by.id('settings-button')).tap();

    // Tap export
    await element(by.id('export-vault-button')).tap();

    // Verify export confirmation/dialog appears - look for dialog content
    await expect(element(by.text('Export your encrypted vault database file for backup. The file will remain encrypted with your master password.'))).toBeVisible();
  });
});
