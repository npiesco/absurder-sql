/**
 * Auto-Lock Service
 *
 * Manages auto-lock settings and clipboard auto-clear functionality.
 * Settings are persisted to AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';

export type AutoLockTimeout = 'immediate' | '1min' | '5min' | '15min' | 'never';
export type ClipboardClearTimeout = '30sec' | '1min' | '5min' | 'never';

const AUTO_LOCK_KEY = '@vault_auto_lock_timeout';
const CLIPBOARD_CLEAR_KEY = '@vault_clipboard_clear_timeout';
const BACKGROUND_TIME_KEY = '@vault_background_time';

class AutoLockService {
  private clipboardTimer: ReturnType<typeof setTimeout> | null = null;

  async getAutoLockTimeout(): Promise<AutoLockTimeout> {
    try {
      const value = await AsyncStorage.getItem(AUTO_LOCK_KEY);
      return (value as AutoLockTimeout) || 'never';
    } catch {
      return 'never';
    }
  }

  async setAutoLockTimeout(timeout: AutoLockTimeout): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTO_LOCK_KEY, timeout);
    } catch (error) {
      console.error('Failed to save auto-lock timeout:', error);
    }
  }

  async getClipboardClearTimeout(): Promise<ClipboardClearTimeout> {
    try {
      const value = await AsyncStorage.getItem(CLIPBOARD_CLEAR_KEY);
      return (value as ClipboardClearTimeout) || 'never';
    } catch {
      return 'never';
    }
  }

  async setClipboardClearTimeout(timeout: ClipboardClearTimeout): Promise<void> {
    try {
      await AsyncStorage.setItem(CLIPBOARD_CLEAR_KEY, timeout);
    } catch (error) {
      console.error('Failed to save clipboard clear timeout:', error);
    }
  }

  async recordBackgroundTime(): Promise<void> {
    try {
      await AsyncStorage.setItem(BACKGROUND_TIME_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to record background time:', error);
    }
  }

  async shouldLockOnForeground(): Promise<boolean> {
    try {
      const timeout = await this.getAutoLockTimeout();
      if (timeout === 'never') {
        return false;
      }

      const backgroundTimeStr = await AsyncStorage.getItem(BACKGROUND_TIME_KEY);
      if (!backgroundTimeStr) {
        return false;
      }

      const backgroundTime = parseInt(backgroundTimeStr, 10);
      const now = Date.now();
      const elapsed = now - backgroundTime;

      const timeoutMs = this.getTimeoutMs(timeout);
      return elapsed >= timeoutMs;
    } catch {
      return false;
    }
  }

  async clearBackgroundTime(): Promise<void> {
    try {
      await AsyncStorage.removeItem(BACKGROUND_TIME_KEY);
    } catch (error) {
      console.error('Failed to clear background time:', error);
    }
  }

  private getTimeoutMs(timeout: AutoLockTimeout): number {
    switch (timeout) {
      case 'immediate':
        return 0;
      case '1min':
        return 60 * 1000;
      case '5min':
        return 5 * 60 * 1000;
      case '15min':
        return 15 * 60 * 1000;
      case 'never':
        return Infinity;
      default:
        return 0;
    }
  }

  startClipboardClearTimer(): void {
    this.getClipboardClearTimeout().then(timeout => {
      if (timeout === 'never') {
        return;
      }

      const timeoutMs = this.getClipboardClearTimeoutMs(timeout);
      
      if (this.clipboardTimer) {
        clearTimeout(this.clipboardTimer);
      }

      this.clipboardTimer = setTimeout(() => {
        Clipboard.setString('');
        this.clipboardTimer = null;
      }, timeoutMs);
    });
  }

  cancelClipboardClearTimer(): void {
    if (this.clipboardTimer) {
      clearTimeout(this.clipboardTimer);
      this.clipboardTimer = null;
    }
  }

  private getClipboardClearTimeoutMs(timeout: ClipboardClearTimeout): number {
    switch (timeout) {
      case '30sec':
        return 30 * 1000;
      case '1min':
        return 60 * 1000;
      case '5min':
        return 5 * 60 * 1000;
      case 'never':
        return Infinity;
      default:
        return 30 * 1000;
    }
  }

  getAutoLockLabel(timeout: AutoLockTimeout): string {
    switch (timeout) {
      case 'immediate':
        return 'Immediately';
      case '1min':
        return 'After 1 minute';
      case '5min':
        return 'After 5 minutes';
      case '15min':
        return 'After 15 minutes';
      case 'never':
        return 'Never';
      default:
        return 'Immediately';
    }
  }

  getClipboardClearLabel(timeout: ClipboardClearTimeout): string {
    switch (timeout) {
      case '30sec':
        return 'After 30 seconds';
      case '1min':
        return 'After 1 minute';
      case '5min':
        return 'After 5 minutes';
      case 'never':
        return 'Never';
      default:
        return 'Never';
    }
  }
}

export const autoLockService = new AutoLockService();
