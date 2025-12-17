/**
 * High Contrast Service
 *
 * Manages high contrast mode for accessibility
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const HIGH_CONTRAST_KEY = '@vault_high_contrast';

class HighContrastService {
  private enabled: boolean = false;
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const saved = await AsyncStorage.getItem(HIGH_CONTRAST_KEY);
    this.enabled = saved === 'true';
    this.initialized = true;
  }

  async isEnabled(): Promise<boolean> {
    await this.initialize();
    return this.enabled;
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.enabled = enabled;
    await AsyncStorage.setItem(HIGH_CONTRAST_KEY, enabled ? 'true' : 'false');
  }
}

export const highContrastService = new HighContrastService();
