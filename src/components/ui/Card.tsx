import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

/** Surface card with a hairline border and the default radius. No heavy shadow. */
export function Card({ children, style, ...rest }: ViewProps) {
  const t = useTokens();
  return (
    <View
      style={[styles.card, { backgroundColor: t.bgSurface, borderColor: t.border }, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.l,
  },
});
