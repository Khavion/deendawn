import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from './AppText';
import { spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

/**
 * The prayer-period eyebrow (e.g. "FAJR · DAWN") with a small gold diamond
 * marker (docs/RICH_DESIGN_SPEC.md). A rotated square, not a glyph, so it's
 * font-independent and aniconism-safe. `label` is caller-provided i18n copy.
 */
export function PeriodEyebrow({ label, style }: { label: string; style?: StyleProp<ViewStyle> }) {
  const t = useTokens();
  return (
    <View style={[styles.row, style]}>
      <View style={[styles.diamond, { backgroundColor: t.ochre }]} />
      <AppText variant="eyebrow" style={{ color: t.ochre }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.s },
  diamond: { width: 7, height: 7, transform: [{ rotate: '45deg' }] },
});
