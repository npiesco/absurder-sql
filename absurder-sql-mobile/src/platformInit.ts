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

/**
 * Initialize platform-specific paths for database operations.
 * 
 * On Android: Sets the app's files directory so relative paths work
 * On iOS: No-op (uses Documents directory by default)
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
      await AbsurderSqlInitializer.initialize();
      initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize Android paths: ${error}`);
    }
  } else {
    // iOS doesn't need special initialization
    initialized = true;
  }
}

/**
 * Check if platform initialization has been completed
 */
export function isInitialized(): boolean {
  return initialized;
}
