import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

/**
 * WeekBars (handoff §5 gap 22): seven quiet columns of 6px bars — accentSoft
 * history, ochre today — with localized day letters beneath. The whole chart
 * is ONE accessibility element carrying a summary sentence; the bars are
 * decorative. Rendered in a plain flex row, so RTL order flips for free.
 */
export type WeekBarDay = { label: string; count: number; isToday?: boolean };

const MAX_BAR = 60;
const MIN_BAR = 4;

export function WeekBars({
  days,
  accessibilityLabel,
  testID,
}: {
  days: readonly WeekBarDay[];
  /** One summary sentence, e.g. "1,254 counts in the last 7 days". */
  accessibilityLabel: string;
  testID?: string;
}) {
  const t = useTokens();
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {days.map((d, i) => (
        <View key={`${d.label}-${i}`} style={styles.col}>
          <View
            style={[
              styles.bar,
              {
                height: d.count === 0 ? MIN_BAR : Math.max(MIN_BAR, (d.count / max) * MAX_BAR),
                backgroundColor: d.isToday ? t.ochre : t.accentSoft,
              },
            ]}
          />
          <AppText variant="caption" color={d.isToday ? t.ochre : t.icon}>
            {d.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.s,
  },
  col: { flex: 1, alignItems: 'center', gap: spacing.xs },
  bar: { width: 6, borderRadius: 3 },
});
