import React from 'react';
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

  return (
    <View style={[styles.row, style]}>
      <AppText variant="eyebrow" style={{ color: t.ochre }}>
        {label}
      </AppText>
      <Gradient
        colors={[`rgba(${gold},0.5)`, `rgba(${gold},0)`]}
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
