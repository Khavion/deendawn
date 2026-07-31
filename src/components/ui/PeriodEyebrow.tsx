import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from './AppText';
import { Marker } from './Marker';
import { spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

/**
 * The prayer-period eyebrow (e.g. "FAJR · DAWN") with the gold diamond marker
 * (handoff §2: the diamond is the only mark). `label` is caller-provided i18n
 * copy — also used for "NOW PLAYING", "STEP 2 OF 3", "ZAKAT DUE · 2.5%".
 */
export function PeriodEyebrow({ label, style }: { label: string; style?: StyleProp<ViewStyle> }) {
  const t = useTokens();
  return (
    <View style={[styles.row, style]}>
      <Marker size={7} tone="ochre" />
      <AppText variant="eyebrow" style={{ color: t.ochre }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.s },
});
