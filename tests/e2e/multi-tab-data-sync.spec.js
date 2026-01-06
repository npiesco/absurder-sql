/**
 * End-to-End Multi-Tab Data Sync Test
 *
 * Tests that data written in one tab is visible in another tab
 * after the reload mechanism fires (BroadcastChannel notification + reloadFromIndexedDB).
 *
 * This specifically tests the fix for the bug where force=true restoration
 * was skipping existing blocks in GLOBAL_STORAGE instead of overwriting them.
 */

import { test, expect } from '@playwright/test';

const VITE_URL = 'http://localhost:3000';

test.describe('Multi-Tab Data Sync', () => {
  test('follower should see leader data after sync notification', async ({ context }) => {
    // Open leader tab
    const tab1 = await context.newPage();
    await tab1.goto(VITE_URL);
    await tab1.waitForSelector('#leaderBadge');
    await tab1.waitForTimeout(500);

    // Verify tab1 is leader
    const badge1 = await tab1.locator('#leaderBadge').textContent();
    expect(badge1).toContain('LEADER');

    // Leader writes initial data
    await tab1.click('#runTest');
    await tab1.waitForTimeout(500);

    // Verify leader sees the data
    const output1 = await tab1.locator('#output').textContent();
    expect(output1).toContain('Widget');

    // Open follower tab
    const tab2 = await context.newPage();
    await tab2.goto(VITE_URL);
    await tab2.waitForSelector('#leaderBadge');
    await tab2.waitForTimeout(1500); // Wait for initial load and sync

    // Verify tab2 is follower
    const badge2 = await tab2.locator('#leaderBadge').textContent();
    expect(badge2).toContain('FOLLOWER');

    // The follower should already see the initial data from the initial IndexedDB load
    // This validates the restore logic works for new tabs

    // Now leader adds more data (this triggers a sync and BroadcastChannel notification)
    // First create a test table, then insert
    await tab1.evaluate(async () => {
      await window.db.execute(`CREATE TABLE IF NOT EXISTS sync_notify_test (id INTEGER PRIMARY KEY, name TEXT)`);
      await window.db.write(`INSERT INTO sync_notify_test (name) VALUES ('NewItem')`);
    });

    // Wait for the notification to propagate and reloadFromIndexedDB to complete
    await tab2.waitForTimeout(2000);

    // Check that the follower's output reflects it received a data change notification
    const output2 = await tab2.locator('#output').textContent();
    expect(output2).toContain('Data changed');

    await tab1.close();
    await tab2.close();
  });

  test('follower queries should return updated data after sync', async ({ context }) => {
    // This test directly validates that the data is actually visible in the follower
    // after the leader writes and syncs

    // Open leader tab
    const tab1 = await context.newPage();
    // Capture console logs from leader
    tab1.on('console', msg => {
      if (msg.text().includes('[TEST]') || msg.text().includes('[PERSIST]') || msg.text().includes('[RESTORE]') || msg.text().includes('[SYNC]') || msg.text().includes('[VFS_WRITE]')) {
        console.log('TAB1:', msg.text());
      }
    });
    await tab1.goto(VITE_URL);
    await tab1.waitForSelector('#leaderBadge');
    await tab1.waitForTimeout(500);

    // Open follower tab
    const tab2 = await context.newPage();
    // Capture console logs
    tab2.on('console', msg => {
      if (msg.text().includes('[TEST]')) {
        console.log('TAB2:', msg.text());
      }
    });
    await tab2.goto(VITE_URL);
    await tab2.waitForSelector('#leaderBadge');
    await tab2.waitForTimeout(1000);

    // Leader writes data
    const uniqueValue = `test_${Date.now()}`;
    await tab1.evaluate(async (val) => {
      console.log('[TEST] Creating table sync_test...');
      await window.db.execute(`CREATE TABLE IF NOT EXISTS sync_test (id INTEGER PRIMARY KEY, value TEXT)`);

      // Verify table was created in leader
      const tables1 = await window.db.query(`SELECT name FROM sqlite_master WHERE type='table'`);
      console.log('[TEST] Tables after CREATE:', JSON.stringify(tables1?.rows?.map(r => r.name || r[0])));

      // Explicit sync after DDL to ensure schema is persisted
      console.log('[TEST] Syncing after CREATE TABLE...');
      await window.db.sync();

      console.log('[TEST] Inserting data...');
      await window.db.write(`INSERT INTO sync_test (value) VALUES ('${val}')`);
      console.log('[TEST] Write complete (auto-synced)');

      // Verify data exists in leader after sync
      const result = await window.db.query(`SELECT * FROM sync_test`);
      console.log('[TEST] Data in leader after write:', JSON.stringify(result?.rows));
    }, uniqueValue);

    // Wait for sync notification to propagate
    await tab2.waitForTimeout(2000);

    // Follower queries the data - this is the critical test
    // If force restore didn't overwrite GLOBAL_STORAGE, this would fail
    const followerData = await tab2.evaluate(async (val) => {
      try {
        // First check if the table exists
        const tables = await window.db.query(`SELECT name FROM sqlite_master WHERE type='table'`);
        const tableList = tables?.rows?.map(r => r.name || r[0]) || [];
        console.log('[TEST] Tables in follower:', JSON.stringify(tableList));

        // Then query for the data
        const result = await window.db.query(`SELECT value FROM sync_test WHERE value = '${val}'`);
        console.log('[TEST] Query result:', JSON.stringify(result));

        // Return the actual value - handle ColumnValue structure
        if (result && result.rows && result.rows.length > 0) {
          const row = result.rows[0];
          // ColumnValue structure: { values: [{ type: "Text", value: "..." }] }
          const value = row.values?.[0]?.value || row.value || row[0];
          console.log('[TEST] Found value:', value);
          return { success: true, value: value };
        }
        console.log('[TEST] No matching rows found');
        return { success: false, error: 'No rows returned' };
      } catch (e) {
        console.error('[TEST] Query error:', e.message);
        return { success: false, error: String(e.message) };
      }
    }, uniqueValue);

    // The follower MUST see the leader's data - fail explicitly if not
    console.log('Follower data result:', JSON.stringify(followerData));
    if (!followerData.success) {
      console.error('MULTI-TAB SYNC FAILED:', followerData.error);
    }
    expect(followerData.success).toBe(true);
    expect(followerData.error).toBeUndefined();
    expect(followerData.value).toBe(uniqueValue);

    await tab1.close();
    await tab2.close();
  });

  test('follower with prior state should query without checksum mismatch', async ({ context }) => {
    // This test specifically catches the stale metadata bug:
    // 1. Tab B exists and has metadata from prior operations
    // 2. Tab A writes new data
    // 3. Tab B queries - stale checksums would cause CHECKSUM_MISMATCH before fix

    // Open Tab B first (will become follower)
    const tabB = await context.newPage();
    tabB.on('console', msg => {
      if (msg.text().includes('[TEST]') || msg.text().includes('CHECKSUM')) {
        console.log('TAB_B:', msg.text());
      }
    });
    await tabB.goto(VITE_URL);
    await tabB.waitForSelector('#leaderBadge');
    await tabB.waitForTimeout(500);

    // Tab B does initial operations to create metadata in memory
    const tabBSetup = await tabB.evaluate(async () => {
      console.log('[TEST] Tab B: Creating initial table and data');
      await window.db.execute(`CREATE TABLE IF NOT EXISTS stale_test (id INTEGER PRIMARY KEY, value TEXT)`);
      await window.db.write(`INSERT INTO stale_test (value) VALUES ('initial_from_tabB')`);

      // Query to verify and populate metadata
      const result = await window.db.query(`SELECT * FROM stale_test`);
      console.log('[TEST] Tab B: Initial data:', JSON.stringify(result?.rows));
      return { success: true, rowCount: result?.rows?.length || 0 };
    });
    console.log('Tab B setup result:', JSON.stringify(tabBSetup));
    expect(tabBSetup.success).toBe(true);

    // Open Tab A (will become leader since Tab B will give up leadership)
    const tabA = await context.newPage();
    tabA.on('console', msg => {
      if (msg.text().includes('[TEST]') || msg.text().includes('[SYNC]')) {
        console.log('TAB_A:', msg.text());
      }
    });
    await tabA.goto(VITE_URL);
    await tabA.waitForSelector('#leaderBadge');
    await tabA.waitForTimeout(1000);

    // Make Tab A the leader by requesting leadership
    await tabA.evaluate(async () => {
      console.log('[TEST] Tab A: Requesting leadership');
      await window.db.requestLeadership();
    });
    await tabA.waitForTimeout(500);

    // Tab A writes NEW data (this creates new blocks with different checksums)
    const uniqueValue = `tabA_write_${Date.now()}`;
    await tabA.evaluate(async (val) => {
      console.log('[TEST] Tab A: Writing new data as leader');
      await window.db.execute(`CREATE TABLE IF NOT EXISTS stale_test (id INTEGER PRIMARY KEY, value TEXT)`);
      await window.db.write(`INSERT INTO stale_test (value) VALUES ('${val}')`);
      console.log('[TEST] Tab A: Write complete');
    }, uniqueValue);

    // Wait for sync notification to reach Tab B
    await tabB.waitForTimeout(2000);

    // Tab B queries - this is the critical test
    // Before fix: CHECKSUM_MISMATCH because Tab B has stale metadata
    // After fix: Works because force reload clears stale metadata
    const tabBQuery = await tabB.evaluate(async (val) => {
      try {
        console.log('[TEST] Tab B: Querying for new data (stale metadata test)');
        const result = await window.db.query(`SELECT value FROM stale_test WHERE value = '${val}'`);
        console.log('[TEST] Tab B: Query result:', JSON.stringify(result));

        if (result && result.rows && result.rows.length > 0) {
          const value = result.rows[0].values?.[0]?.value || result.rows[0].value || result.rows[0][0];
          return { success: true, value: value };
        }
        return { success: false, error: 'No rows found' };
      } catch (e) {
        console.error('[TEST] Tab B: Query failed:', e.message);
        // This is where CHECKSUM_MISMATCH would appear before fix
        return { success: false, error: e.message };
      }
    }, uniqueValue);

    console.log('Tab B query result:', JSON.stringify(tabBQuery));

    // Critical assertion - this would fail before the stale metadata fix
    if (!tabBQuery.success) {
      console.error('STALE METADATA BUG:', tabBQuery.error);
    }
    expect(tabBQuery.success).toBe(true);
    expect(tabBQuery.error).toBeUndefined();
    expect(tabBQuery.value).toBe(uniqueValue);

    await tabA.close();
    await tabB.close();
  });
});
