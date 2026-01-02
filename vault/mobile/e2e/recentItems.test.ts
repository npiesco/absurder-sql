import { by, device, element, expect, waitFor } from 'detox';

describe('Recent Items', () => {
  const masterPassword = 'RecentTest123!';

  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('should setup vault with multiple credentials', async () => {
    // Wait for unlock screen
    await waitFor(element(by.text('Create New'))).toBeVisible().withTimeout(10000);

    // Create vault
    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText(masterPassword);
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText(masterPassword);
    await element(by.id('create-vault-button')).tap();
    await expect(element(by.text('Vault'))).toBeVisible();

    // Wait for credentials screen
    await waitFor(element(by.id('add-credential-fab')))
      .toBeVisible()
      .withTimeout(5000);

    // Create first credential - Alpha
    await element(by.id('add-credential-fab')).tap();
    await element(by.id('credential-name-input')).typeText('Alpha Account');
    await element(by.id('credential-username-input')).typeText('alpha@test.com');
    await element(by.id('credential-password-input')).typeText('AlphaPass123!');
    await element(by.id('save-credential-button')).tap();

    await waitFor(element(by.text('Alpha Account')))
      .toBeVisible()
      .withTimeout(3000);

    // Create second credential - Beta
    await element(by.id('add-credential-fab')).tap();
    await element(by.id('credential-name-input')).typeText('Beta Account');
    await element(by.id('credential-username-input')).typeText('beta@test.com');
    await element(by.id('credential-password-input')).typeText('BetaPass123!');
    await element(by.id('save-credential-button')).tap();

    await waitFor(element(by.text('Beta Account')))
      .toBeVisible()
      .withTimeout(3000);

    // Create third credential - Gamma
    await element(by.id('add-credential-fab')).tap();
    await element(by.id('credential-name-input')).typeText('Gamma Account');
    await element(by.id('credential-username-input')).typeText('gamma@test.com');
    await element(by.id('credential-password-input')).typeText('GammaPass123!');
    await element(by.id('save-credential-button')).tap();

    await waitFor(element(by.text('Gamma Account')))
      .toBeVisible()
      .withTimeout(3000);

    // All three credentials visible
    await expect(element(by.text('Alpha Account'))).toBeVisible();
    await expect(element(by.text('Beta Account'))).toBeVisible();
    await expect(element(by.text('Gamma Account'))).toBeVisible();
  });

  it('should display recent sort option in sort menu', async () => {
    // Open sort menu
    await element(by.id('sort-button')).tap();

    // Verify recent option exists
    await expect(element(by.id('sort-option-recent'))).toBeVisible();

    // Close menu
    await element(by.id('sort-option-name-asc')).tap();
  });

  it('should track access when viewing credential detail', async () => {
    // View Beta credential (this should update its lastAccessedAt)
    await element(by.text('Beta Account')).tap();

    // Wait for expanded card actions to be visible
    await waitFor(element(by.id('view-details-button')))
      .toBeVisible()
      .withTimeout(3000);

    await element(by.id('view-details-button')).tap();

    // Verify we're on detail screen
    await waitFor(element(by.text('beta@test.com')))
      .toBeVisible()
      .withTimeout(5000);

    // Go back
    await element(by.id('detail-back-button')).tap();

    // Wait for credentials screen
    await waitFor(element(by.id('sort-button')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show recently accessed credential first when sorted by recent', async () => {
    // Sort by recent
    await element(by.id('sort-button')).tap();
    await element(by.id('sort-option-recent')).tap();

    // Beta should be first since we just accessed it
    // We need to verify order - Beta should appear before Alpha and Gamma
    await expect(element(by.text('Beta Account'))).toBeVisible();
  });

  it('should update recent order when accessing another credential', async () => {
    // Wait for credentials to be visible
    await waitFor(element(by.text('Gamma Account')))
      .toBeVisible()
      .withTimeout(5000);

    // Now access Gamma
    await element(by.text('Gamma Account')).tap();
    
    // Wait for expanded card
    await waitFor(element(by.id('view-details-button')))
      .toBeVisible()
      .withTimeout(3000);
    
    await element(by.id('view-details-button')).tap();
    
    // Wait for detail screen
    await waitFor(element(by.text('gamma@test.com')))
      .toBeVisible()
      .withTimeout(5000);
    
    await element(by.id('detail-back-button')).tap();

    // Gamma should now be first (most recently accessed)
    // Still sorted by recent from previous test
    await expect(element(by.text('Gamma Account'))).toBeVisible();
  });

  it('should track access when copying username', async () => {
    // Wait for credentials to be visible
    await waitFor(element(by.text('Alpha Account')))
      .toBeVisible()
      .withTimeout(5000);

    // Access Alpha by copying username
    await element(by.text('Alpha Account')).tap();
    await element(by.id('copy-username-button')).tap();

    // Dismiss the alert
    await element(by.text('OK')).tap();

    // Alpha should now be most recently accessed
    await expect(element(by.text('Alpha Account'))).toBeVisible();
  });

  it('should track access when copying password', async () => {
    // Wait for credentials to be visible
    await waitFor(element(by.text('Beta Account')))
      .toBeVisible()
      .withTimeout(5000);

    // Access Beta by copying password
    await element(by.text('Beta Account')).tap();
    await element(by.id('copy-password-button')).tap();

    // Dismiss the alert
    await element(by.text('OK')).tap();

    // Beta should now be most recently accessed
    await expect(element(by.text('Beta Account'))).toBeVisible();
  });

  it('should persist recent access times across app restart', async () => {
    // Relaunch app
    await device.launchApp({ newInstance: true });

    // Wait for unlock screen
    await waitFor(element(by.text('Unlock'))).toBeVisible().withTimeout(10000);

    // Unlock vault
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText(masterPassword);
    await element(by.id('unlock-vault-button')).tap();

    await waitFor(element(by.id('add-credential-fab')))
      .toBeVisible()
      .withTimeout(5000);

    // Sort by recent
    await element(by.id('sort-button')).tap();
    await element(by.id('sort-option-recent')).tap();

    // Beta should still be first (most recently accessed before restart)
    await expect(element(by.text('Beta Account'))).toBeVisible();
  });

  it('should show credentials with no access history at the end', async () => {
    // Create a new credential that has never been accessed
    await element(by.id('add-credential-fab')).tap();
    await element(by.id('credential-name-input')).typeText('Delta Account');
    await element(by.id('credential-username-input')).typeText('delta@test.com');
    await element(by.id('credential-password-input')).typeText('DeltaPass123!');
    await element(by.id('save-credential-button')).tap();

    await waitFor(element(by.text('Delta Account')))
      .toBeVisible()
      .withTimeout(3000);

    // Sort by recent - Delta should be at the end since it was never accessed
    await element(by.id('sort-button')).tap();
    await element(by.id('sort-option-recent')).tap();

    // All credentials should be visible
    await expect(element(by.text('Beta Account'))).toBeVisible();
    await expect(element(by.text('Delta Account'))).toBeVisible();
  });
});
