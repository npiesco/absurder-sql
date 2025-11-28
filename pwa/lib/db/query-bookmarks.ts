// IndexedDB service for query bookmarks

export interface QueryBookmark {
  id: string;
  name: string;
  description?: string;
  sql: string;
  tags: string[];
  folder?: string;
  created_at: number;
  updated_at: number;
}

const DB_NAME = 'absurder-sql-bookmarks';
const DB_VERSION = 1;
const STORE_NAME = 'queries';

class QueryBookmarksDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[QueryBookmarksDB] Error opening database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[QueryBookmarksDB] Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          objectStore.createIndex('name', 'name', { unique: false });
          objectStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          objectStore.createIndex('created_at', 'created_at', { unique: false });
          objectStore.createIndex('updated_at', 'updated_at', { unique: false });
          console.log('[QueryBookmarksDB] Object store created');
        }
      };
    });
  }

  async saveBookmark(bookmark: Omit<QueryBookmark, 'id' | 'created_at' | 'updated_at'>): Promise<QueryBookmark> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const now = Date.now();
    const newBookmark: QueryBookmark = {
      id: `bookmark-${now}-${Math.random().toString(36).substr(2, 9)}`,
      ...bookmark,
      created_at: now,
      updated_at: now
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(newBookmark);

      request.onsuccess = () => {
        console.log('[QueryBookmarksDB] Bookmark saved:', newBookmark.id);
        resolve(newBookmark);
      };

      request.onerror = () => {
        console.error('[QueryBookmarksDB] Error saving bookmark:', request.error);
        reject(request.error);
      };
    });
  }

  async updateBookmark(id: string, updates: Partial<Omit<QueryBookmark, 'id' | 'created_at'>>): Promise<QueryBookmark> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const existing = await this.getBookmark(id);
    if (!existing) throw new Error('Bookmark not found');

    const updated: QueryBookmark = {
      ...existing,
      ...updates,
      id: existing.id,
      created_at: existing.created_at,
      updated_at: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(updated);

      request.onsuccess = () => {
        console.log('[QueryBookmarksDB] Bookmark updated:', id);
        resolve(updated);
      };

      request.onerror = () => {
        console.error('[QueryBookmarksDB] Error updating bookmark:', request.error);
        reject(request.error);
      };
    });
  }

  async getBookmark(id: string): Promise<QueryBookmark | null> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('[QueryBookmarksDB] Error getting bookmark:', request.error);
        reject(request.error);
      };
    });
  }

  async getAllBookmarks(): Promise<QueryBookmark[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const bookmarks = request.result || [];
        // Sort by updated_at descending
        bookmarks.sort((a, b) => b.updated_at - a.updated_at);
        resolve(bookmarks);
      };

      request.onerror = () => {
        console.error('[QueryBookmarksDB] Error getting all bookmarks:', request.error);
        reject(request.error);
      };
    });
  }

  async deleteBookmark(id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('[QueryBookmarksDB] Bookmark deleted:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('[QueryBookmarksDB] Error deleting bookmark:', request.error);
        reject(request.error);
      };
    });
  }

  async searchBookmarks(query: string): Promise<QueryBookmark[]> {
    const all = await this.getAllBookmarks();
    const lowerQuery = query.toLowerCase();
    
    return all.filter(bookmark => 
      bookmark.name.toLowerCase().includes(lowerQuery) ||
      bookmark.description?.toLowerCase().includes(lowerQuery) ||
      bookmark.sql.toLowerCase().includes(lowerQuery)
    );
  }

  async filterByTags(tags: string[]): Promise<QueryBookmark[]> {
    const all = await this.getAllBookmarks();
    
    return all.filter(bookmark =>
      tags.some(tag => bookmark.tags.includes(tag))
    );
  }

  async exportAll(): Promise<string> {
    const bookmarks = await this.getAllBookmarks();
    return JSON.stringify(bookmarks, null, 2);
  }

  async importBookmarks(jsonString: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    let bookmarks: QueryBookmark[];
    try {
      bookmarks = JSON.parse(jsonString);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }

    if (!Array.isArray(bookmarks)) {
      throw new Error('Import data must be an array');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      let completed = 0;
      const total = bookmarks.length;

      if (total === 0) {
        resolve();
        return;
      }

      for (const bookmark of bookmarks) {
        // Ensure required fields exist
        if (!bookmark.id || !bookmark.name || !bookmark.sql) {
          console.warn('[QueryBookmarksDB] Skipping invalid bookmark:', bookmark);
          completed++;
          if (completed === total) resolve();
          continue;
        }

        const request = store.put(bookmark);

        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            console.log('[QueryBookmarksDB] Import completed:', total);
            resolve();
          }
        };

        request.onerror = () => {
          console.error('[QueryBookmarksDB] Error importing bookmark:', request.error);
          reject(request.error);
        };
      }
    });
  }

  async clearAll(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[QueryBookmarksDB] All bookmarks cleared');
        resolve();
      };

      request.onerror = () => {
        console.error('[QueryBookmarksDB] Error clearing bookmarks:', request.error);
        reject(request.error);
      };
    });
  }
}

// Singleton instance
export const queryBookmarksDB = new QueryBookmarksDB();
