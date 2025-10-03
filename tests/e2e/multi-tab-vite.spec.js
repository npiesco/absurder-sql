/**
 * End-to-End Multi-Tab Vite App Test
 * 
 * Tests the MultiTabDatabase wrapper in a real browser environment
 * with multiple tabs to verify leader election and coordination.
 */

import { test, expect } from '@playwright/test';

const VITE_URL = 'http://localhost:3000';

test.describe('Multi-Tab Vite App', () => {
  test('should display leader badge on first tab', async ({ page }) => {
    await page.goto(VITE_URL);
    
    // Wait for initialization
    await page.waitForSelector('#leaderBadge', { timeout: 10000 });
    
    // First tab should become leader
    const badge = await page.locator('#leaderBadge').textContent();
    expect(badge).toContain('LEADER');
    
    // Run Test button should be enabled
    const runBtn = await page.locator('#runTest');
    await expect(runBtn).toBeEnabled();
  });

  test('should coordinate between two tabs', async ({ context }) => {
    // Open first tab (will be leader) - same context = shared localStorage
    const tab1 = await context.newPage();
    await tab1.goto(VITE_URL);
    await tab1.waitForSelector('#leaderBadge');
    
    // Verify tab1 is leader
    let badge1 = await tab1.locator('#leaderBadge').textContent();
    expect(badge1).toContain('LEADER');
    
    // Open second tab (will be follower) - same context
    const tab2 = await context.newPage();
    await tab2.goto(VITE_URL);
    await tab2.waitForSelector('#leaderBadge');
    
    // Wait a bit for leader election to settle
    await tab2.waitForTimeout(1000);
    
    // Verify tab2 is follower
    const badge2 = await tab2.locator('#leaderBadge').textContent();
    expect(badge2).toContain('FOLLOWER');
    
    // Follower's Run Test button should be disabled
    const runBtn2 = await tab2.locator('#runTest');
    await expect(runBtn2).toBeDisabled();
    
    await tab1.close();
    await tab2.close();
  });

  test('should allow leader to write and sync to follower', async ({ context }) => {
    // Open leader tab
    const tab1 = await context.newPage();
    await tab1.goto(VITE_URL);
    await tab1.waitForSelector('#leaderBadge');
    await tab1.waitForTimeout(500);
    
    // Open follower tab
    const tab2 = await context.newPage();
    await tab2.goto(VITE_URL);
    await tab2.waitForSelector('#leaderBadge');
    await tab2.waitForTimeout(1000);
    
    // Leader writes data
    await tab1.click('#runTest');
    await tab1.waitForTimeout(500);
    
    // Check leader's output
    const output1 = await tab1.locator('#output').textContent();
    expect(output1).toContain('Inserted 3 items');
    expect(output1).toContain('Widget');
    
    // Follower should receive notification
    // Wait for cross-tab sync (BroadcastChannel + auto-refresh)
    await tab2.waitForTimeout(1000);
    
    const log2 = await tab2.locator('#output').textContent();
    // Follower should see refresh notification
    expect(log2).toContain('Data changed');
    
    await tab1.close();
    await tab2.close();
  });

  test('should handle leader change when leader tab closes', async ({ context }) => {
    // Open leader tab
    const tab1 = await context.newPage();
    await tab1.goto(VITE_URL);
    await tab1.waitForSelector('#leaderBadge');
    await tab1.waitForTimeout(500);
    
    // Open follower tab
    const tab2 = await context.newPage();
    await tab2.goto(VITE_URL);
    await tab2.waitForSelector('#leaderBadge');
    await tab2.waitForTimeout(1000);
    
    // Verify initial state
    let badge2 = await tab2.locator('#leaderBadge').textContent();
    expect(badge2).toContain('FOLLOWER');
    
    // Explicitly close database to trigger leader cleanup
    await tab1.evaluate(() => window.db.close());
    await tab1.waitForTimeout(200); // Allow cleanup to process
    
    // Close leader tab
    await tab1.close();
    
    // Wait for lease expiry (5 sec) + UI polling interval (2 sec) + processing time
    // Need at least 7 seconds: 5 (lease) + 2 (next poll)
    await tab2.waitForTimeout(8000);
    
    // Tab2 should become leader
    badge2 = await tab2.locator('#leaderBadge').textContent();
    expect(badge2).toContain('LEADER');
    
    // Run Test button should now be enabled
    const runBtn = await tab2.locator('#runTest');
    await expect(runBtn).toBeEnabled();
    
    await tab2.close();
  });

  test('should prevent follower from writing', async ({ context }) => {
    // Open leader tab
    const tab1 = await context.newPage();
    await tab1.goto(VITE_URL);
    await tab1.waitForSelector('#leaderBadge');
    await tab1.waitForTimeout(500);
    
    // Open follower tab
    const tab2 = await context.newPage();
    await tab2.goto(VITE_URL);
    await tab2.waitForSelector('#leaderBadge');
    await tab2.waitForTimeout(1000);
    
    // Verify follower status
    const badge2 = await tab2.locator('#leaderBadge').textContent();
    expect(badge2).toContain('FOLLOWER');
    
    // Try to click Run Test on follower (should be disabled)
    const runBtn2 = await tab2.locator('#runTest');
    const isDisabled = await runBtn2.isDisabled();
    expect(isDisabled).toBe(true);
    
    // Even if we force-click, it should fail
    // (button is disabled so click won't work, but verify the handler would fail)
    
    await tab1.close();
    await tab2.close();
  });

  test('should allow requesting leadership', async ({ context }) => {
    // Open leader tab
    const tab1 = await context.newPage();
    await tab1.goto(VITE_URL);
    await tab1.waitForSelector('#leaderBadge');
    await tab1.waitForTimeout(500);
    
    // Open follower tab
    const tab2 = await context.newPage();
    await tab2.goto(VITE_URL);
    await tab2.waitForSelector('#leaderBadge');
    await tab2.waitForTimeout(1000);
    
    // Verify follower status
    let badge2 = await tab2.locator('#leaderBadge').textContent();
    expect(badge2).toContain('FOLLOWER');
    
    // Explicitly close database to trigger leader cleanup
    await tab1.evaluate(() => window.db.close());
    await tab1.waitForTimeout(200); // Allow cleanup to process
    
    // Close leader tab first
    await tab1.close();
    
    // Wait for lease to expire (5 sec) + buffer
    await tab2.waitForTimeout(6000);
    
    // Click Request Leadership (triggers re-election)
    await tab2.click('#requestLeader');
    
    // Wait for re-election to process and UI to update (2 sec polling)
    await tab2.waitForTimeout(2500);
    
    // Should become leader
    badge2 = await tab2.locator('#leaderBadge').textContent();
    expect(badge2).toContain('LEADER');
    
    await tab2.close();
  });
});
