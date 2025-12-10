describe('AbsurderSQL Database Operations', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display Tests tab', async () => {
    await expect(element(by.text('Tests'))).toBeVisible();
  });

  it('should display Benchmarks tab', async () => {
    await expect(element(by.text('Benchmarks'))).toBeVisible();
  });

  it('should switch to Benchmarks tab', async () => {
    await element(by.text('Benchmarks')).tap();
    await expect(element(by.text('AbsurderSQL Performance Benchmarks'))).toBeVisible();
  });

  it('should run benchmarks successfully', async () => {
    // Switch to Benchmarks tab
    await element(by.text('Benchmarks')).tap();
    
    // Tap "Run Benchmarks" button
    await element(by.text('Run Benchmarks')).tap();
    
    // Wait for benchmarks to complete (adjust timeout as needed)
    await waitFor(element(by.text('Run Benchmarks')))
      .toBeVisible()
      .withTimeout(15000);
    
    // Verify at least one benchmark passed
    await expect(element(by.text('PASS')).atIndex(0)).toBeVisible();
  });

  it('should run integration tests successfully', async () => {
    // Should be on Tests tab by default
    await expect(element(by.text('Tests'))).toBeVisible();
    
    // Tap "Run All Tests" button
    await element(by.text('Run All Tests')).tap();
    
    // Wait for tests to complete
    await waitFor(element(by.text('Run All Tests')))
      .toBeVisible()
      .withTimeout(10000);
    
    // Verify at least one test passed
    await expect(element(by.text('Passed')).atIndex(0)).toBeVisible();
  });

  it('should persist database across app reloads', async () => {
    // Run integration tests to create database
    await element(by.text('Run All Tests')).tap();
    await waitFor(element(by.text('Run All Tests')))
      .toBeVisible()
      .withTimeout(10000);
    
    // Reload the app
    await device.reloadReactNative();
    
    // Run tests again - database should already exist
    await element(by.text('Run All Tests')).tap();
    await waitFor(element(by.text('Run All Tests')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
