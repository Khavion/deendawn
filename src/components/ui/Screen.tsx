import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { useTokens } from '@/src/lib/theme/useTokens';

export type ScreenProps = ViewProps & {
  /** Safe-area edges to inset (default: top + bottom). */
  edges?: readonly Edge[];
  /** Skip the safe-area wrapper (e.g. under a navigation header). */
  noSafeArea?: boolean;
};

/** Full-bleed screen container on the canvas background, safe-area aware. */
export function Screen({
  children,
  style,
  edges = ['top', 'bottom'],
  noSafeArea,
  ...rest
}: ScreenProps) {
  const t = useTokens();
  const base = [styles.fill, { backgroundColor: t.bgCanvas }, style];
  if (noSafeArea) {
    return (
      <View style={base} {...rest}>
        {children}
      </View>
    );
  }
  return (
    <SafeAreaView style={base} edges={edges} {...rest}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
