/**
 * Font Size Service
 *
 * Manages dynamic font sizing for accessibility:
 * - Small: 0.85x scale
 * - Medium: 1.0x scale (default)
 * - Large: 1.15x scale
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const FONT_SIZE_KEY = '@vault_font_size';

export type FontSize = 'small' | 'medium' | 'large';

const FONT_SCALE: Record<FontSize, number> = {
  small: 0.85,
  medium: 1.0,
  large: 1.15,
};

class FontSizeService {
  private fontSize: FontSize = 'medium';
  private initialized: boolean = false;
  private listeners: Set<(size: FontSize) => void> = new Set();

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const saved = await AsyncStorage.getItem(FONT_SIZE_KEY);
    if (saved && (saved === 'small' || saved === 'medium' || saved === 'large')) {
      this.fontSize = saved as FontSize;
    }
    this.initialized = true;
  }

  async getFontSize(): Promise<FontSize> {
    await this.initialize();
    return this.fontSize;
  }

  async setFontSize(size: FontSize): Promise<void> {
    this.fontSize = size;
    await AsyncStorage.setItem(FONT_SIZE_KEY, size);
    this.notifyListeners();
  }

  getScale(): number {
    return FONT_SCALE[this.fontSize];
  }

  subscribe(listener: (size: FontSize) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.fontSize));
  }

  getFontSizeLabel(size: FontSize): string {
    switch (size) {
      case 'small': return 'Small';
      case 'medium': return 'Medium';
      case 'large': return 'Large';
    }
  }
}

export const fontSizeService = new FontSizeService();
