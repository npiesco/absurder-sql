// Type declarations for react-native-safe-area-context
declare module 'react-native-safe-area-context' {
  import { ComponentType, ReactNode } from 'react';
  import { ViewProps, StyleProp, ViewStyle } from 'react-native';

  export interface EdgeInsets {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }

  export interface SafeAreaProviderProps {
    children?: ReactNode;
    initialMetrics?: EdgeInsets;
  }

  export interface SafeAreaViewProps extends ViewProps {
    children?: ReactNode;
    edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
    mode?: 'padding' | 'margin';
    style?: StyleProp<ViewStyle>;
  }

  export const SafeAreaProvider: ComponentType<SafeAreaProviderProps>;
  export const SafeAreaView: ComponentType<SafeAreaViewProps>;
  export function useSafeAreaInsets(): EdgeInsets;
  export function useSafeAreaFrame(): { x: number; y: number; width: number; height: number };
}
