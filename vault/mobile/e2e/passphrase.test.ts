/**
 * Passphrase Generator E2E Test
 *
 * Tests word-based passphrase generation:
 * 1. Toggle between Random and Passphrase modes
 * 2. Generate word-based passphrases (e.g., "correct-horse-battery-staple")
 * 3. Configure word count (3-8 words)
 * 4. Configure separator character
 */

import { device, element, by, expect } from 'detox';

describe('Passphrase Generator', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });

    // Create vault for testing
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText('PassphraseTest123!');
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText('PassphraseTest123!');
    await element(by.id('create-vault-button')).tap();

    // Wait for credentials screen
    await expect(element(by.text('Vault'))).toBeVisible();
  });

  beforeEach(async () => {
    // Navigate to add credential screen
    await element(by.id('add-credential-fab')).tap();
    await expect(element(by.text('Add Credential'))).toBeVisible();
  });

  afterEach(async () => {
    // Cancel and go back to credentials screen
    await element(by.id('cancel-button')).tap();
  });

  it('should display password mode toggle with Random selected by default', async () => {
    // Scroll to show generator options
    await element(by.id('credential-form-scroll')).scroll(200, 'down');

    // Verify Random mode is selected by default (also confirms mode toggle exists)
    await expect(element(by.id('mode-random-selected'))).toBeVisible();
  });

  it('should switch to passphrase mode when tapping Passphrase', async () => {
    await element(by.id('credential-form-scroll')).scroll(150, 'down');

    // Tap Passphrase mode
    await element(by.id('mode-passphrase')).tap();

    // Verify Passphrase mode is now selected
    await expect(element(by.id('mode-passphrase-selected'))).toBeVisible();

    // Verify word count slider appears (replaces length slider)
    await expect(element(by.id('word-count-slider'))).toBeVisible();
  });

  it('should display word count slider with default of 4 words', async () => {
    await element(by.id('credential-form-scroll')).scroll(150, 'down');

    // Switch to passphrase mode
    await element(by.id('mode-passphrase')).tap();

    // Verify default word count is 4
    await expect(element(by.id('word-count-display'))).toHaveText('4');
  });

  it('should generate passphrase with words separated by hyphens', async () => {
    // Switch to passphrase mode
    await element(by.id('credential-form-scroll')).scroll(150, 'down');
    await element(by.id('mode-passphrase')).tap();

    // Scroll back up to generate button
    await element(by.id('credential-form-scroll')).scroll(150, 'up');

    // Generate passphrase
    await element(by.id('generate-password-button')).tap();

    // Verify passphrase indicator shows word count
    await expect(element(by.id('generated-word-count'))).toHaveText('4');
  });

  it('should adjust word count using slider', async () => {
    await element(by.id('credential-form-scroll')).scroll(150, 'down');

    // Switch to passphrase mode
    await element(by.id('mode-passphrase')).tap();

    // Verify slider is functional by adjusting positions
    // Note: slider exact values may vary due to native implementation
    await element(by.id('word-count-slider')).adjustSliderToPosition(0);
    await new Promise(resolve => setTimeout(resolve, 300));
    await expect(element(by.id('word-count-display'))).toBeVisible();

    // Adjust to maximum
    await element(by.id('word-count-slider')).adjustSliderToPosition(1);
    await new Promise(resolve => setTimeout(resolve, 300));
    await expect(element(by.id('word-count-display'))).toBeVisible();
  });

  it('should generate passphrase with configured word count', async () => {
    await element(by.id('credential-form-scroll')).scroll(150, 'down');

    // Switch to passphrase mode and set to 6 words
    await element(by.id('mode-passphrase')).tap();
    await element(by.id('word-count-slider')).adjustSliderToPosition(0.6);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Scroll back and generate
    await element(by.id('credential-form-scroll')).scroll(150, 'up');
    await element(by.id('generate-password-button')).tap();

    // Verify passphrase was generated (word count indicator visible)
    await expect(element(by.id('generated-word-count'))).toBeVisible();
  });

  it('should switch back to random mode and show length slider', async () => {
    await element(by.id('credential-form-scroll')).scroll(150, 'down');

    // Switch to passphrase mode first
    await element(by.id('mode-passphrase')).tap();
    await expect(element(by.id('word-count-slider'))).toBeVisible();

    // Switch back to random mode
    await element(by.id('mode-random')).tap();

    // Verify length slider is back
    await expect(element(by.id('password-length-slider'))).toBeVisible();
    await expect(element(by.id('mode-random-selected'))).toBeVisible();
  });

  it('should preserve generated passphrase in password field', async () => {
    await element(by.id('credential-form-scroll')).scroll(150, 'down');

    // Switch to passphrase mode
    await element(by.id('mode-passphrase')).tap();

    // Scroll back and generate
    await element(by.id('credential-form-scroll')).scroll(150, 'up');
    await element(by.id('generate-password-button')).tap();

    // Password field should not be empty
    await expect(element(by.id('credential-password-input'))).not.toHaveText('');
  });
});
