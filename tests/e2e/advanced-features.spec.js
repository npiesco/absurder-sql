/**
 * End-to-End Tests for Advanced Multi-Tab Features
 * 
 * Tests Optimistic Updates and Coordination Metrics
 * in a real browser environment.
 */

import { test, expect } from '@playwright/test';

const VITE_URL = 'http://localhost:3000';

test.describe('Advanced Multi-Tab Features', () => {
  
  test.describe('Optimistic Updates', () => {
    test('should enable and disable optimistic mode', async ({ page }) => {
      await page.goto(VITE_URL);
      await page.waitForSelector('#leaderBadge', { timeout: 10000 });
      
      // Enable optimistic updates
      const result = await page.evaluate(async () => {
        await window.db.enableOptimisticUpdates(true);
        return await window.db.isOptimisticMode();
      });
      
      expect(result).toBe(true);
      
      // Disable optimistic updates
      const result2 = await page.evaluate(async () => {
        await window.db.enableOptimisticUpdates(false);
        return await window.db.isOptimisticMode();
      });
      
      expect(result2).toBe(false);
    });

    test('should track pending writes in optimistic mode', async ({ page }) => {
      await page.goto(VITE_URL);
      await page.waitForSelector('#leaderBadge', { timeout: 10000 });
      
      const result = await page.evaluate(async () => {
        // Enable optimistic mode
        await window.db.enableOptimisticUpdates(true);
        
        // Track some pending writes
        const id1 = await window.db.trackOptimisticWrite("INSERT INTO items VALUES (1, 'test1')");
        const id2 = await window.db.trackOptimisticWrite("INSERT INTO items VALUES (2, 'test2')");
        
        // Get pending count
        const count = await window.db.getPendingWritesCount();
        
        return { id1, id2, count };
      });
      
      expect(result.id1).toBeTruthy();
      expect(result.id2).toBeTruthy();
      expect(result.count).toBe(2);
    });

    test('should clear all pending writes', async ({ page }) => {
      await page.goto(VITE_URL);
      await page.waitForSelector('#leaderBadge', { timeout: 10000 });
      
      const result = await page.evaluate(async () => {
        // Enable optimistic mode
        await window.db.enableOptimisticUpdates(true);
        
        // Track some pending writes
        await window.db.trackOptimisticWrite("INSERT INTO items VALUES (1, 'test1')");
        await window.db.trackOptimisticWrite("INSERT INTO items VALUES (2, 'test2')");
        
        const countBefore = await window.db.getPendingWritesCount();
        
        // Clear all
        await window.db.clearOptimisticWrites();
        
        const countAfter = await window.db.getPendingWritesCount();
        
        return { countBefore, countAfter };
      });
      
      expect(result.countBefore).toBe(2);
      expect(result.countAfter).toBe(0);
    });
  });

  test.describe('Coordination Metrics', () => {
    test('should enable and disable coordination metrics', async ({ page }) => {
      await page.goto(VITE_URL);
      await page.waitForSelector('#leaderBadge', { timeout: 10000 });
      
      const result = await page.evaluate(async () => {
        await window.db.enableCoordinationMetrics(true);
        return await window.db.isCoordinationMetricsEnabled();
      });
      
      expect(result).toBe(true);
      
      const result2 = await page.evaluate(async () => {
        await window.db.enableCoordinationMetrics(false);
        return await window.db.isCoordinationMetricsEnabled();
      });
      
      expect(result2).toBe(false);
    });

    test('should track leadership changes', async ({ page }) => {
      await page.goto(VITE_URL);
      await page.waitForSelector('#leaderBadge', { timeout: 10000 });
      
      const result = await page.evaluate(async () => {
        await window.db.enableCoordinationMetrics(true);
        
        // Record a leadership change
        await window.db.recordLeadershipChange(true);
        
        // Get metrics
        const metricsJson = await window.db.getCoordinationMetrics();
        const metrics = JSON.parse(metricsJson);
        
        return metrics.leadership_changes;
      });
      
      expect(result).toBeGreaterThanOrEqual(1);
    });

    test('should track notification latency', async ({ page }) => {
      await page.goto(VITE_URL);
      await page.waitForSelector('#leaderBadge', { timeout: 10000 });
      
      const result = await page.evaluate(async () => {
        await window.db.enableCoordinationMetrics(true);
        
        // Record some latencies
        await window.db.recordNotificationLatency(10.5);
        await window.db.recordNotificationLatency(15.2);
        await window.db.recordNotificationLatency(12.8);
        
        // Get metrics
        const metricsJson = await window.db.getCoordinationMetrics();
        const metrics = JSON.parse(metricsJson);
        
        return {
          avgLatency: metrics.avg_notification_latency_ms,
          totalNotifications: metrics.total_notifications
        };
      });
      
      expect(result.totalNotifications).toBe(3);
      expect(result.avgLatency).toBeCloseTo(12.83, 1);
    });

    test('should track write conflicts', async ({ page }) => {
      await page.goto(VITE_URL);
      await page.waitForSelector('#leaderBadge', { timeout: 10000 });
      
      const result = await page.evaluate(async () => {
        await window.db.enableCoordinationMetrics(true);
        
        // Record some write conflicts
        await window.db.recordWriteConflict();
        await window.db.recordWriteConflict();
        
        // Get metrics
        const metricsJson = await window.db.getCoordinationMetrics();
        const metrics = JSON.parse(metricsJson);
        
        return metrics.write_conflicts;
      });
      
      expect(result).toBe(2);
    });

    test('should track follower refreshes', async ({ page }) => {
      await page.goto(VITE_URL);
      await page.waitForSelector('#leaderBadge', { timeout: 10000 });
      
      const result = await page.evaluate(async () => {
        await window.db.enableCoordinationMetrics(true);
        
        // Record some follower refreshes
        await window.db.recordFollowerRefresh();
        await window.db.recordFollowerRefresh();
        await window.db.recordFollowerRefresh();
        
        // Get metrics
        const metricsJson = await window.db.getCoordinationMetrics();
        const metrics = JSON.parse(metricsJson);
        
        return metrics.follower_refreshes;
      });
      
      expect(result).toBe(3);
    });

    test('should reset coordination metrics', async ({ page }) => {
      await page.goto(VITE_URL);
      await page.waitForSelector('#leaderBadge', { timeout: 10000 });
      
      const result = await page.evaluate(async () => {
        await window.db.enableCoordinationMetrics(true);
        
        // Record some metrics
        await window.db.recordLeadershipChange(true);
        await window.db.recordWriteConflict();
        await window.db.recordFollowerRefresh();
        
        const metricsBefore = JSON.parse(await window.db.getCoordinationMetrics());
        
        // Reset
        await window.db.resetCoordinationMetrics();
        
        const metricsAfter = JSON.parse(await window.db.getCoordinationMetrics());
        
        return {
          before: metricsBefore,
          after: metricsAfter
        };
      });
      
      expect(result.before.leadership_changes).toBeGreaterThan(0);
      expect(result.before.write_conflicts).toBeGreaterThan(0);
      expect(result.before.follower_refreshes).toBeGreaterThan(0);
      
      expect(result.after.leadership_changes).toBe(0);
      expect(result.after.write_conflicts).toBe(0);
      expect(result.after.follower_refreshes).toBe(0);
    });

    test('should track metrics across multiple tabs', async ({ context }) => {
      // Open leader tab
      const tab1 = await context.newPage();
      await tab1.goto(VITE_URL);
      await tab1.waitForSelector('#leaderBadge');
      await tab1.waitForTimeout(500);
      
      // Enable metrics on leader
      await tab1.evaluate(async () => {
        await window.db.enableCoordinationMetrics(true);
        await window.db.recordLeadershipChange(true);
      });
      
      // Open follower tab
      const tab2 = await context.newPage();
      await tab2.goto(VITE_URL);
      await tab2.waitForSelector('#leaderBadge');
      await tab2.waitForTimeout(1000);
      
      // Enable metrics on follower and record events
      const result = await tab2.evaluate(async () => {
        await window.db.enableCoordinationMetrics(true);
        await window.db.recordFollowerRefresh();
        await window.db.recordNotificationLatency(20.5);
        
        const metricsJson = await window.db.getCoordinationMetrics();
        return JSON.parse(metricsJson);
      });
      
      expect(result.follower_refreshes).toBeGreaterThanOrEqual(1);
      expect(result.total_notifications).toBeGreaterThanOrEqual(1);
      
      await tab1.close();
      await tab2.close();
    });

    test('should export all metrics in correct format', async ({ page }) => {
      await page.goto(VITE_URL);
      await page.waitForSelector('#leaderBadge', { timeout: 10000 });
      
      const result = await page.evaluate(async () => {
        await window.db.enableCoordinationMetrics(true);
        
        // Record various metrics
        await window.db.recordLeadershipChange(true);
        await window.db.recordNotificationLatency(15.0);
        await window.db.recordWriteConflict();
        await window.db.recordFollowerRefresh();
        
        const metricsJson = await window.db.getCoordinationMetrics();
        const metrics = JSON.parse(metricsJson);
        
        return {
          hasLeadershipChanges: typeof metrics.leadership_changes === 'number',
          hasWriteConflicts: typeof metrics.write_conflicts === 'number',
          hasFollowerRefreshes: typeof metrics.follower_refreshes === 'number',
          hasAvgLatency: typeof metrics.avg_notification_latency_ms === 'number',
          hasTotalNotifications: typeof metrics.total_notifications === 'number',
          hasStartTimestamp: typeof metrics.start_timestamp === 'number',
          allFieldsPresent: Object.keys(metrics).length === 6
        };
      });
      
      expect(result.hasLeadershipChanges).toBe(true);
      expect(result.hasWriteConflicts).toBe(true);
      expect(result.hasFollowerRefreshes).toBe(true);
      expect(result.hasAvgLatency).toBe(true);
      expect(result.hasTotalNotifications).toBe(true);
      expect(result.hasStartTimestamp).toBe(true);
      expect(result.allFieldsPresent).toBe(true);
    });
  });
});
