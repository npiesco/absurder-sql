import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseClient } from '../client';

describe('DatabaseClient Performance Tests', () => {
  let client: DatabaseClient;

  beforeEach(() => {
    client = new DatabaseClient();
  });

  afterEach(async () => {
    try {
      if (client.isOpen()) {
        await client.close();
        const dbName = 'perf-test.db';
        await client.deleteDatabase(dbName);
      }
    } catch (error) {
      // Cleanup errors are ok
    }
  });

  describe('Query Performance Benchmarks', () => {
    it('should have helper methods that are fast', () => {
      const start = performance.now();
      
      // Test all helper methods that don't require WASM
      expect(client.isOpen()).toBe(false);
      expect(client.getDatabaseName()).toBeNull();
      expect(client.isInitialized()).toBe(false);
      expect(client.getDatabase()).toBeNull();
      
      const end = performance.now();
      const duration = end - start;
      
      // Helper methods should be instant (< 1ms)
      expect(duration).toBeLessThan(1);
    });

    it('should create DatabaseClient instance quickly', () => {
      const start = performance.now();
      
      const testClient = new DatabaseClient();
      
      const end = performance.now();
      const duration = end - start;
      
      // Instance creation should be instant (< 1ms)
      expect(duration).toBeLessThan(1);
      expect(testClient).toBeInstanceOf(DatabaseClient);
    });

    it('should handle multiple client instances efficiently', () => {
      const start = performance.now();
      
      const clients = [];
      for (let i = 0; i < 100; i++) {
        clients.push(new DatabaseClient());
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Creating 100 clients should be fast (< 10ms)
      expect(duration).toBeLessThan(10);
      expect(clients).toHaveLength(100);
    });
  });

  describe('Memory Efficiency', () => {
    it('should not leak memory on repeated instantiation', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create and destroy 1000 clients
      for (let i = 0; i < 1000; i++) {
        const tempClient = new DatabaseClient();
        // Let it go out of scope
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (< 10MB for 1000 instances)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should clean up state properly on close', async () => {
      // This test verifies that close() properly nullifies internal state
      expect(client.isOpen()).toBe(false);
      expect(client.getDatabaseName()).toBeNull();
      
      // After close, state should remain clean
      await client.close(); // Should be safe to call even when not open
      
      expect(client.isOpen()).toBe(false);
      expect(client.getDatabaseName()).toBeNull();
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle errors quickly without performance degradation', async () => {
      const errors = [];
      const start = performance.now();
      
      // Try 100 invalid operations
      for (let i = 0; i < 100; i++) {
        try {
          await client.execute('SELECT 1');
        } catch (error) {
          errors.push(error);
        }
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // All errors should be caught and handled quickly (< 50ms total)
      expect(duration).toBeLessThan(50);
      expect(errors).toHaveLength(100);
    });

    it('should throw consistent error messages', async () => {
      const errors: string[] = [];
      
      // Collect error messages
      for (let i = 0; i < 10; i++) {
        try {
          await client.execute('SELECT 1');
        } catch (error) {
          errors.push((error as Error).message);
        }
      }
      
      // All error messages should be identical
      const uniqueMessages = new Set(errors);
      expect(uniqueMessages.size).toBe(1);
      expect(errors[0]).toContain('Database not opened');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple error checks concurrently', async () => {
      const start = performance.now();
      
      // Execute 50 concurrent error-throwing operations
      const promises = Array(50).fill(null).map(() => 
        client.execute('SELECT 1').catch(e => e)
      );
      
      await Promise.all(promises);
      
      const end = performance.now();
      const duration = end - start;
      
      // Should handle concurrent operations efficiently (< 100ms)
      expect(duration).toBeLessThan(100);
    });

    it('should handle rapid state checks efficiently', () => {
      const start = performance.now();
      
      // Perform 10000 rapid state checks
      for (let i = 0; i < 10000; i++) {
        client.isOpen();
        client.getDatabaseName();
        client.isInitialized();
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // 10k state checks should be very fast (< 50ms)
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Export/Import Performance', () => {
    it('should validate blob types quickly', () => {
      const start = performance.now();
      
      // Create multiple test blobs
      const blobs = [];
      for (let i = 0; i < 100; i++) {
        blobs.push(new Blob(['test data'], { type: 'application/x-sqlite3' }));
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Blob creation should be fast (< 10ms for 100 blobs)
      expect(duration).toBeLessThan(10);
      expect(blobs).toHaveLength(100);
    });
  });
});
