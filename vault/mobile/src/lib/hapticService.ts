/**
 * Haptic Feedback Service
 *
 * Provides haptic feedback throughout the app:
 * - Light: UI feedback (button taps, toggles)
 * - Medium: Success actions (copy, save)
 * - Heavy: Important actions (delete, lock)
 * - Selection: Selection changes
 * - Error: Error feedback
 */

import {Platform} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { HapticFeedbackTypes } from 'react-native-haptic-feedback';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HAPTIC_ENABLED_KEY = '@vault_haptic_enabled';

class HapticService {
  private enabled: boolean = true;
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    const saved = await AsyncStorage.getItem(HAPTIC_ENABLED_KEY);
    if (saved !== null) {
      this.enabled = saved === 'true';
    }
    this.initialized = true;
  }

  async isEnabled(): Promise<boolean> {
    await this.initialize();
    return this.enabled;
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.enabled = enabled;
    await AsyncStorage.setItem(HAPTIC_ENABLED_KEY, enabled.toString());
  }

  private trigger(type: HapticFeedbackTypes): void {
    if (!this.enabled || Platform.OS === 'android') return;
    
    ReactNativeHapticFeedback.trigger(type, {
      enableVibrateFallback: false,
      ignoreAndroidSystemSettings: false,
    });
  }

  /**
   * Light feedback for UI interactions (button taps, toggles)
   */
  light(): void {
    this.trigger(HapticFeedbackTypes.impactLight);
  }

  /**
   * Medium feedback for success actions (copy, save)
   */
  medium(): void {
    this.trigger(HapticFeedbackTypes.impactMedium);
  }

  /**
   * Heavy feedback for important actions (delete, lock)
   */
  heavy(): void {
    this.trigger(HapticFeedbackTypes.impactHeavy);
  }

  /**
   * Selection feedback for picker/selection changes
   */
  selection(): void {
    this.trigger(HapticFeedbackTypes.selection);
  }

  /**
   * Success notification feedback
   */
  success(): void {
    this.trigger(HapticFeedbackTypes.notificationSuccess);
  }

  /**
   * Warning notification feedback
   */
  warning(): void {
    this.trigger(HapticFeedbackTypes.notificationWarning);
  }

  /**
   * Error notification feedback
   */
  error(): void {
    this.trigger(HapticFeedbackTypes.notificationError);
  }
}

export const hapticService = new HapticService();
