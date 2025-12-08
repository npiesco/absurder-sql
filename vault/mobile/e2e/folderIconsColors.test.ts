/**
 * Folder Icons & Colors E2E Test
 *
 * Tests folder customization functionality:
 * 1. Display icon and color pickers in folder modal
 * 2. Create folder with custom icon and color
 * 3. Edit folder icon and color
 * 4. Persist icon and color across app restart
 * 5. Default icon when none selected
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Folder Icons & Colors', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });

    // Create vault for testing
    await waitFor(element(by.text('Create New'))).toBeVisible().withTimeout(10000);
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('IconsTest123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('IconsTest123!');
    await element(by.id('create-vault-button')).tap();

    // Wait for credentials screen
    await expect(element(by.text('Vault'))).toBeVisible();

    // Navigate to folders screen
    await element(by.id('folders-button')).tap();
    await expect(element(by.text('Folders'))).toBeVisible();
  });

  it('should display icon and color pickers in folder creation modal', async () => {
    // Open create folder modal
    await element(by.id('add-folder-fab')).tap();

    // Verify pickers are visible
    await expect(element(by.id('folder-icon-picker'))).toBeVisible();
    await expect(element(by.id('folder-color-picker'))).toBeVisible();

    // Verify icon options appear when tapping
    await element(by.id('folder-icon-picker')).tap();
    await expect(element(by.id('icon-option-work'))).toBeVisible();
    await expect(element(by.id('icon-option-personal'))).toBeVisible();
    await element(by.id('icon-option-default')).tap(); // Close picker

    // Verify color options appear when tapping
    await element(by.id('folder-color-picker')).tap();
    await expect(element(by.id('color-option-blue'))).toBeVisible();
    await expect(element(by.id('color-option-green'))).toBeVisible();
    await element(by.id('color-option-default')).tap(); // Close picker

    // Cancel to close modal
    await element(by.text('Cancel')).tap();
    
    // Verify modal closed
    await waitFor(element(by.id('add-folder-fab'))).toBeVisible().withTimeout(5000);
  });

  it('should create folder with custom icon and color', async () => {
    // Open modal
    await element(by.id('add-folder-fab')).tap();
    await waitFor(element(by.id('folder-icon-picker'))).toBeVisible().withTimeout(5000);

    // Select work icon
    await element(by.id('folder-icon-picker')).tap();
    await waitFor(element(by.id('icon-option-work'))).toBeVisible().withTimeout(3000);
    await element(by.id('icon-option-work')).tap();
    
    // Verify icon selected by checking label changed to 'Work'
    await expect(element(by.text('Work'))).toBeVisible();

    // Select blue color
    await element(by.id('folder-color-picker')).tap();
    await waitFor(element(by.id('color-option-blue'))).toBeVisible().withTimeout(3000);
    await element(by.id('color-option-blue')).tap();
    
    // Verify color selected by checking label changed to 'Blue'
    await expect(element(by.text('Blue'))).toBeVisible();

    // Enter folder name
    await element(by.id('folder-name-input')).tap();
    await element(by.id('folder-name-input')).typeText('Work Projects');
    
    // Dismiss keyboard before tapping save
    await element(by.id('folder-name-input')).tapReturnKey();
    
    // Save folder
    await waitFor(element(by.id('save-folder-button'))).toBeVisible().withTimeout(5000);
    await element(by.id('save-folder-button')).tap();

    // Verify modal closed
    await waitFor(element(by.id('add-folder-fab'))).toBeVisible().withTimeout(5000);

    // Verify folder appears with custom icon and color
    await expect(element(by.text('Work Projects'))).toBeVisible();
    await expect(element(by.id('folder-item-Work Projects-work-blue'))).toBeVisible();
  });

  it('should create folder with different icon and color', async () => {
    // Open modal
    await element(by.id('add-folder-fab')).tap();
    await waitFor(element(by.id('folder-icon-picker'))).toBeVisible().withTimeout(5000);

    // Select personal icon
    await element(by.id('folder-icon-picker')).tap();
    await waitFor(element(by.id('icon-option-personal'))).toBeVisible().withTimeout(3000);
    await element(by.id('icon-option-personal')).tap();

    // Select green color
    await element(by.id('folder-color-picker')).tap();
    await waitFor(element(by.id('color-option-green'))).toBeVisible().withTimeout(3000);
    await element(by.id('color-option-green')).tap();

    // Enter name and save
    await element(by.id('folder-name-input')).tap();
    await element(by.id('folder-name-input')).typeText('Personal');
    
    // Dismiss keyboard before tapping save
    await element(by.id('folder-name-input')).tapReturnKey();
    await element(by.id('save-folder-button')).tap();

    // Verify modal closed
    await waitFor(element(by.id('add-folder-fab'))).toBeVisible().withTimeout(5000);

    // Verify folder appears with custom icon and color
    await expect(element(by.text('Personal'))).toBeVisible();
    await expect(element(by.id('folder-item-Personal-personal-green'))).toBeVisible();
  });

  it('should edit folder icon and color', async () => {
    // Tap folder to show actions
    await element(by.text('Work Projects')).tap();
    await waitFor(element(by.id('edit-folder-button'))).toBeVisible().withTimeout(5000);
    await element(by.id('edit-folder-button')).tap();

    // Verify modal opened with current values
    await waitFor(element(by.id('folder-icon-picker'))).toBeVisible().withTimeout(5000);

    // Change icon to finance
    await element(by.id('folder-icon-picker')).tap();
    await waitFor(element(by.id('icon-option-finance'))).toBeVisible().withTimeout(3000);
    await element(by.id('icon-option-finance')).tap();

    // Change color to purple
    await element(by.id('folder-color-picker')).tap();
    await waitFor(element(by.id('color-option-purple'))).toBeVisible().withTimeout(3000);
    await element(by.id('color-option-purple')).tap();

    // Save changes
    await element(by.id('save-folder-button')).tap();

    // Verify modal closed
    await waitFor(element(by.id('add-folder-fab'))).toBeVisible().withTimeout(5000);

    // Verify folder shows updated icon and color
    await expect(element(by.id('folder-item-Work Projects-finance-purple'))).toBeVisible();
  });

  it('should persist folder icons and colors across app restart', async () => {
    // Terminate and relaunch
    await device.terminateApp();
    await device.launchApp({ newInstance: false });

    // Unlock vault
    await waitFor(element(by.id('master-password-input'))).toBeVisible().withTimeout(10000);
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('IconsTest123!');
    await element(by.id('unlock-vault-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Navigate to folders
    await element(by.id('folders-button')).tap();

    // Verify folders have persisted icons and colors
    await expect(element(by.id('folder-item-Work Projects-finance-purple'))).toBeVisible();
    await expect(element(by.id('folder-item-Personal-personal-green'))).toBeVisible();
  });

  it('should display default icon when no icon selected', async () => {
    // Open modal
    await element(by.id('add-folder-fab')).tap();
    await waitFor(element(by.id('folder-name-input'))).toBeVisible().withTimeout(5000);

    // Enter name without selecting icon/color
    await element(by.id('folder-name-input')).typeText('Default Folder');
    
    // Dismiss keyboard before tapping save
    await element(by.id('folder-name-input')).tapReturnKey();
    await element(by.id('save-folder-button')).tap();

    // Verify modal closed
    await waitFor(element(by.id('add-folder-fab'))).toBeVisible().withTimeout(5000);

    // Verify folder has default icon and color
    await expect(element(by.text('Default Folder'))).toBeVisible();
    await expect(element(by.id('folder-item-Default Folder-default-default'))).toBeVisible();
  });
});
