/**
 * Platform-specific initialization for AbsurderSQL
 *
 * On Android, this sets up the writable data directory path so that
 * relative database paths get resolved correctly.
 *
 * MUST be called before any database operations.
 */

import { NativeModules, Platform } from 'react-native';

const { AbsurderSqlInitializer } = NativeModules;

let initialized = false;
let androidDataDirectory: string | null = null;

/**
 * Initialize platform-specific paths for database operations.
 *
 * On Android: Gets the app's files directory so relative paths can be resolved
 * On iOS: No-op (uses Documents directory by default via Rust)
 *
 * @returns Promise that resolves when initialization is complete
 * @throws Error if initialization fails
 */
export async function initializePlatform(): Promise<void> {
  if (initialized) {
    return;
  }

  if (Platform.OS === 'android') {
    if (!AbsurderSqlInitializer) {
      throw new Error('AbsurderSqlInitializer native module not found');
    }

    try {
      androidDataDirectory = await AbsurderSqlInitializer.getDataDirectory();
      initialized = true;
    } catch (error) {
      throw new Error(`Failed to get Android data directory: ${error}`);
    }
  } else {
    // iOS doesn't need special initialization - Rust handles path resolution
    initialized = true;
  }
}

/**
 * Check if platform initialization has been completed
 */
export function isInitialized(): boolean {
  return initialized;
}

/**
 * Resolve a database path to an absolute path for the current platform.
 *
 * On Android: Resolves relative paths to {filesDir}/databases/{name}
 * On iOS: Returns path as-is (Rust handles resolution)
 * On other platforms: Returns path as-is
 *
 * @param path - The database path (can be relative or absolute)
 * @returns The resolved absolute path
 */
export function resolveDatabasePath(path: string): string {
  // If already absolute, return as-is
  if (path.startsWith('/')) {
    return path;
  }

  // On Android, resolve relative paths using the data directory
  if (Platform.OS === 'android' && androidDataDirectory) {
    return `${androidDataDirectory}/databases/${path}`;
  }

  // On iOS and other platforms, return as-is (Rust handles it)
  return path;
}
