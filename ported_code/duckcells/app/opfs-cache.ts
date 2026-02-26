/**
 * OPFS Cache — Arrow IPC snapshot cache backed by the Origin Private File System.
 *
 * This is an OPTIONAL warm-start layer only. The Rust/WASM CellStore (IndexedDB)
 * remains the sole source of truth. OPFS is a pure performance cache:
 *   - Writing to OPFS never changes IDB data
 *   - Deleting from OPFS never loses data (IDB is always authoritative)
 *   - Stale cache entries are skipped on hydration
 *
 * API:
 *   - isAvailable():                    OPFS is supported in this browser
 *   - cacheSheet(id, bytes, wm?):       Write Arrow IPC bytes for a sheet
 *   - loadCachedSheet(id):              Read Arrow IPC bytes, null if missing
 *   - listCachedSheets():               All cached sheet IDs
 *   - getManifest():                    { sheets: [{sheetId, watermark, byteLength}] }
 *   - deleteCachedSheet(id):            Remove single entry
 *   - clearAll():                       Remove all entries
 *   - hydrateFromCache(db, storeWm?):   Load cached sheets into DuckDB, skip stale
 *
 * @module opfs-cache
 */

import type { DuckDBEngine } from './duckdb-engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CacheManifestEntry {
  sheetId: string;
  watermark: number;
  byteLength: number;
}

export interface CacheManifest {
  sheets: CacheManifestEntry[];
}

export interface OpfsCache {
  isAvailable(): boolean;
  cacheSheet(sheetId: string, bytes: Uint8Array, watermark?: number): Promise<void>;
  loadCachedSheet(sheetId: string): Promise<Uint8Array | null>;
  listCachedSheets(): Promise<string[]>;
  getManifest(): Promise<CacheManifest>;
  deleteCachedSheet(sheetId: string): Promise<void>;
  clearAll(): Promise<void>;
  hydrateFromCache(db: DuckDBEngine, storeWatermark?: number): Promise<string[]>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CACHE_DIR = 'duckcells-cache';
const MANIFEST_FILE = 'manifest.json';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function getCacheDir(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(CACHE_DIR, { create: true });
}

async function readManifestRaw(dir: FileSystemDirectoryHandle): Promise<CacheManifest> {
  try {
    const fileHandle = await dir.getFileHandle(MANIFEST_FILE);
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text) as CacheManifest;
  } catch {
    return { sheets: [] };
  }
}

async function writeManifest(
  dir: FileSystemDirectoryHandle,
  manifest: CacheManifest,
): Promise<void> {
  const fileHandle = await dir.getFileHandle(MANIFEST_FILE, { create: true });
  const writable = await (fileHandle as any).createWritable();
  await writable.write(JSON.stringify(manifest));
  await writable.close();
}

function sheetFileName(sheetId: string): string {
  return `sheet_${sheetId}.arrow`;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createOpfsCache(): OpfsCache {
  return {
    isAvailable(): boolean {
      return (
        typeof navigator !== 'undefined' &&
        typeof navigator.storage?.getDirectory === 'function'
      );
    },

    async cacheSheet(
      sheetId: string,
      bytes: Uint8Array,
      watermark = 0,
    ): Promise<void> {
      const dir = await getCacheDir();

      // Write Arrow bytes
      const fileHandle = await dir.getFileHandle(sheetFileName(sheetId), { create: true });
      const writable = await (fileHandle as any).createWritable();
      await writable.write(bytes);
      await writable.close();

      // Update manifest
      const manifest = await readManifestRaw(dir);
      const existing = manifest.sheets.findIndex((s) => s.sheetId === sheetId);
      const entry: CacheManifestEntry = { sheetId, watermark, byteLength: bytes.length };
      if (existing >= 0) {
        manifest.sheets[existing] = entry;
      } else {
        manifest.sheets.push(entry);
      }
      await writeManifest(dir, manifest);
    },

    async loadCachedSheet(sheetId: string): Promise<Uint8Array | null> {
      try {
        const dir = await getCacheDir();
        const fileHandle = await dir.getFileHandle(sheetFileName(sheetId));
        const file = await fileHandle.getFile();
        const buf = await file.arrayBuffer();
        return new Uint8Array(buf);
      } catch {
        return null;
      }
    },

    async listCachedSheets(): Promise<string[]> {
      try {
        const dir = await getCacheDir();
        const manifest = await readManifestRaw(dir);
        return manifest.sheets.map((s) => s.sheetId);
      } catch {
        return [];
      }
    },

    async getManifest(): Promise<CacheManifest> {
      try {
        const dir = await getCacheDir();
        return readManifestRaw(dir);
      } catch {
        return { sheets: [] };
      }
    },

    async deleteCachedSheet(sheetId: string): Promise<void> {
      const dir = await getCacheDir();

      // Remove the Arrow file (ignore if missing)
      try {
        await dir.removeEntry(sheetFileName(sheetId));
      } catch {
        // File doesn't exist — that's fine
      }

      // Remove from manifest
      const manifest = await readManifestRaw(dir);
      manifest.sheets = manifest.sheets.filter((s) => s.sheetId !== sheetId);
      await writeManifest(dir, manifest);
    },

    async clearAll(): Promise<void> {
      try {
        const root = await navigator.storage.getDirectory();
        // Remove the entire cache directory and recreate it empty
        await root.removeEntry(CACHE_DIR, { recursive: true });
        // Recreate the empty directory so future writes work
        await root.getDirectoryHandle(CACHE_DIR, { create: true });
      } catch {
        // If directory didn't exist, nothing to clear
      }
    },

    async hydrateFromCache(
      db: DuckDBEngine,
      storeWatermark?: number,
    ): Promise<string[]> {
      try {
        const dir = await getCacheDir();
        const manifest = await readManifestRaw(dir);
        const hydrated: string[] = [];

        for (const entry of manifest.sheets) {
          // Skip stale entries: cache watermark is behind the store
          if (
            storeWatermark !== undefined &&
            entry.watermark < storeWatermark
          ) {
            continue;
          }

          const bytes = await this.loadCachedSheet(entry.sheetId);
          if (!bytes) continue;

          // Ingest Arrow IPC into DuckDB as sheet_{id}
          await db.ingestArrow(`sheet_${entry.sheetId}`, bytes);
          hydrated.push(entry.sheetId);
        }

        return hydrated;
      } catch {
        return [];
      }
    },
  };
}
