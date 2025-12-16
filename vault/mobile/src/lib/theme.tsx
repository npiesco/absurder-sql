/**
 * Theme System for Vault App
 * 
 * Provides dark/light theme support with:
 * - Theme context and provider
 * - Color definitions for both themes
 * - Persistent theme preference
 * - System theme detection
 */

import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {useColorScheme} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_PREFERENCE_KEY = '@vault_theme_preference';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  surfaceVariant: string;
  card: string;
  
  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  
  // Primary colors
  primary: string;
  primaryVariant: string;
  onPrimary: string;
  
  // Accent colors
  accent: string;
  accentVariant: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // UI elements
  border: string;
  divider: string;
  inputBackground: string;
  inputBorder: string;
  placeholder: string;
  
  // Header
  headerBackground: string;
  headerText: string;
  
  // Modal
  modalBackground: string;
  modalOverlay: string;
  
  // Button
  buttonPrimary: string;
  buttonSecondary: string;
  buttonDisabled: string;
  buttonText: string;
  
  // Misc
  shadow: string;
  favorite: string;
  copied: string;
}

const lightColors: ThemeColors = {
  // Backgrounds
  background: '#f5f5f5',
  surface: '#ffffff',
  surfaceVariant: '#f0f0f0',
  card: '#ffffff',
  
  // Text
  text: '#1a1a1a',
  textSecondary: '#666666',
  textMuted: '#999999',
  textInverse: '#ffffff',
  
  // Primary colors
  primary: '#007AFF',
  primaryVariant: '#0055cc',
  onPrimary: '#ffffff',
  
  // Accent colors
  accent: '#5856D6',
  accentVariant: '#4240a8',
  
  // Status colors
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#5AC8FA',
  
  // UI elements
  border: '#e0e0e0',
  divider: '#eeeeee',
  inputBackground: '#f8f8f8',
  inputBorder: '#dddddd',
  placeholder: '#aaaaaa',
  
  // Header
  headerBackground: '#007AFF',
  headerText: '#ffffff',
  
  // Modal
  modalBackground: '#ffffff',
  modalOverlay: 'rgba(0, 0, 0, 0.5)',
  
  // Button
  buttonPrimary: '#007AFF',
  buttonSecondary: '#e0e0e0',
  buttonDisabled: '#cccccc',
  buttonText: '#ffffff',
  
  // Misc
  shadow: 'rgba(0, 0, 0, 0.1)',
  favorite: '#FFD700',
  copied: '#34C759',
};

const darkColors: ThemeColors = {
  // Backgrounds
  background: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceVariant: '#252525',
  card: '#1e1e1e',
  
  // Text
  text: '#ffffff',
  textSecondary: '#aaaaaa',
  textMuted: '#666666',
  textInverse: '#1a1a1a',
  
  // Primary colors
  primary: '#0A84FF',
  primaryVariant: '#0066cc',
  onPrimary: '#ffffff',
  
  // Accent colors
  accent: '#5E5CE6',
  accentVariant: '#4a48b8',
  
  // Status colors
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  info: '#64D2FF',
  
  // UI elements
  border: '#333333',
  divider: '#2a2a2a',
  inputBackground: '#252525',
  inputBorder: '#404040',
  placeholder: '#666666',
  
  // Header
  headerBackground: '#1a1a1a',
  headerText: '#ffffff',
  
  // Modal
  modalBackground: '#1e1e1e',
  modalOverlay: 'rgba(0, 0, 0, 0.7)',
  
  // Button
  buttonPrimary: '#0A84FF',
  buttonSecondary: '#333333',
  buttonDisabled: '#404040',
  buttonText: '#ffffff',
  
  // Misc
  shadow: 'rgba(0, 0, 0, 0.3)',
  favorite: '#FFD60A',
  copied: '#30D158',
};

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({children}: ThemeProviderProps): React.ReactElement {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preference
  useEffect(() => {
    AsyncStorage.getItem(THEME_PREFERENCE_KEY).then(saved => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeModeState(saved);
      }
      setIsLoaded(true);
    });
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_PREFERENCE_KEY, mode);
  };

  // Determine if dark mode based on preference and system
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;

  const value: ThemeContextType = {
    colors,
    isDark,
    themeMode,
    setThemeMode,
  };

  // Render immediately with system default while loading preference
  // This prevents blocking the app startup

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Export color constants for reference
export {lightColors, darkColors};
