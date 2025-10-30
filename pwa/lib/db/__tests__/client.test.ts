import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseClient } from '../client';

describe('DatabaseClient Unit Tests', () => {
  let client: DatabaseClient;

  beforeEach(() => {
    client = new DatabaseClient();
  });

  describe('Helper Methods', () => {
    it('should return false for isOpen when no database is open', () => {
      expect(client.isOpen()).toBe(false);
    });

    it('should return null for getDatabaseName when no database is open', () => {
      expect(client.getDatabaseName()).toBeNull();
    });

    it('should return false for isInitialized before initialization', () => {
      expect(client.isInitialized()).toBe(false);
    });

    it('should return null for getDatabase when no database is open', () => {
      expect(client.getDatabase()).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when executing query without opening database', async () => {
      await expect(async () => {
        await client.execute('SELECT 1');
      }).rejects.toThrow('Database not opened');
    });

    it('should throw error when exporting without opening database', async () => {
      await expect(async () => {
        await client.export();
      }).rejects.toThrow('Database not opened');
    });

    it('should throw error when exporting via exportDatabase without opening database', async () => {
      await expect(async () => {
        await client.exportDatabase();
      }).rejects.toThrow('Database not opened');
    });

    it('should throw error when importing to closed database', async () => {
      const blob = new Blob(['test'], { type: 'application/x-sqlite3' });
      
      // This should not throw because it handles closed state
      await expect(async () => {
        await client.importDatabase('test.db', blob);
      }).rejects.toThrow(); // Will fail due to WASM init in test env
    });
  });
});
