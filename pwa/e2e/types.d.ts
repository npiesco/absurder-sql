/**
 * Type declarations for E2E tests
 */

interface Database {
  newDatabase(name: string): Promise<DatabaseInstance>;
}

interface DatabaseInstance {
  execute(sql: string, params?: any[]): Promise<QueryResult>;
  exportToFile(): Promise<Uint8Array>;
  importFromFile(data: Uint8Array): Promise<void>;
  sync(): Promise<void>;
  close(): Promise<void>;
}

interface QueryResult {
  rows: Array<{
    values: Array<{
      value: any;
    }>;
  }>;
}

declare global {
  interface Window {
    Database: Database;
    testDb: DatabaseInstance;
  }
}

export {};
