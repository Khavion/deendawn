// Preview stub: the browser preview has no notches/home indicators, so the
// safe-area machinery reduces to plain Views. Keeps the web bundle off
// react-native-safe-area-context's native codegen imports.
import React from 'react';
import { View, type ViewProps } from 'react-native';

export type Edge = 'top' | 'right' | 'bottom' | 'left';

export function SafeAreaProvider({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function SafeAreaView({ children, ...rest }: ViewProps & { edges?: readonly Edge[] }) {
  const { edges: _edges, ...viewProps } = rest as { edges?: readonly Edge[] } & ViewProps;
  return <View {...viewProps}>{children}</View>;
}

export function useSafeAreaInsets() {
  return { top: 0, right: 0, bottom: 0, left: 0 };
}
