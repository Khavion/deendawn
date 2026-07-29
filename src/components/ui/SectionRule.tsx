import React, { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from './AppText';
import { Gradient } from './Gradient';
import { spacing } from '@/src/lib/theme/tokens';
import { useThemeMode } from '@/src/lib/theme/ThemeProvider';
import { useTokens } from '@/src/lib/theme/useTokens';
import { useDeviceTier } from '@/src/lib/theme/useDeviceTier';

/**
 * A section eyebrow followed by an illuminated gold hairline that fades out to
 * the right (docs/RICH_DESIGN_SPEC.md). `label` is caller-provided i18n copy.
 */
export function SectionRule({ label, style }: { label: string; style?: StyleProp<ViewStyle> }) {
  const t = useTokens();
  const mode = useThemeMode();
  const { flat } = useDeviceTier();
  const gold = mode === 'light' ? '138,100,48' : '198,155,95';
  // Stable identity: Gradient memoizes per-band colors on this array, and a
  // fresh literal each render would recompute all bands on every host render.
  const colors = useMemo(() => [`rgba(${gold},0.5)`, `rgba(${gold},0)`], [gold]);

  return (
    <View style={[styles.row, style]}>
      <AppText variant="eyebrow" style={{ color: t.ochre }}>
        {label}
      </AppText>
      <Gradient
        colors={colors}
        direction="horizontal"
        flat={flat}
        flatColor={`rgba(${gold},0.25)`}
        style={styles.rule}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  rule: { flex: 1, height: 1, marginLeft: spacing.m },
});
