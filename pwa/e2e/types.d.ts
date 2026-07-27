import type { Database as DatabaseProxy } from '../lib/db/database-proxy';

declare global {
  interface Window {
    Database: typeof DatabaseProxy;
    testDb: DatabaseProxy;
  }
}

export {};
