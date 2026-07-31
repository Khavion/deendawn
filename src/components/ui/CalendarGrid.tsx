import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { Marker } from './Marker';
import { fonts, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

/**
 * CalendarGrid / DayCell (handoff §5 gap 29): dual-numeral cells — the hijri
 * day primary in the serif, the Gregorian day small in the icon color —
 * today on the quiet ochre wash, observances marked by the diamond (filled
 * for the named days, outline for the white days). ≥44pt cells, ONE
 * accessibility label per cell ("16 Muharram, 31 July, today, Friday").
 * Rendered with plain flex rows, so RTL column order flips for free.
 */
export type DayCellData = {
  key: string;
  /** Hijri day, localized (primary numeral). */
  primary: string;
  /** Gregorian day, localized (secondary numeral). */
  secondary: string;
  isToday?: boolean;
  observance?: 'filled' | 'outline';
  accessibilityLabel: string;
  testID?: string;
};

export function CalendarGrid({
  cells,
  weekdays,
  testID,
}: {
  /** Leading/trailing nulls pad the first and last weeks. */
  cells: readonly (DayCellData | null)[];
  /** Seven localized letters, in week order; `emphasized` = Friday's ochre. */
  weekdays: readonly { label: string; emphasized?: boolean }[];
  testID?: string;
}) {
  const t = useTokens();
  return (
    <View testID={testID}>
      <View style={styles.week}>
        {weekdays.map((d, i) => (
          <View key={`${d.label}-${i}`} style={styles.cellSlot}>
            <AppText variant="caption" color={d.emphasized ? t.ochre : t.icon}>
              {d.label}
            </AppText>
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((cell, i) =>
          cell ? (
            <View
              key={cell.key}
              accessible
              accessibilityLabel={cell.accessibilityLabel}
              style={[
                styles.cellSlot,
                styles.dayCell,
                cell.isToday && { backgroundColor: t.ochreSoft, borderRadius: 6 },
              ]}
              testID={cell.testID}
            >
              <AppText
                style={[styles.primary, { color: t.textPrimary }]}
                maxFontSizeMultiplier={1.4}
              >
                {cell.primary}
              </AppText>
              <AppText style={[styles.secondary, { color: t.icon }]} maxFontSizeMultiplier={1.4}>
                {cell.secondary}
              </AppText>
              <View style={styles.markerSlot}>
                {cell.observance ? (
                  <Marker size={5} tone="ochre" variant={cell.observance} />
                ) : null}
              </View>
            </View>
          ) : (
            <View key={`pad-${i}`} style={styles.cellSlot} />
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  week: { flexDirection: 'row', marginBottom: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cellSlot: { width: `${100 / 7}%`, alignItems: 'center' },
  dayCell: { minHeight: 44, paddingVertical: spacing.xs, gap: 1 },
  primary: { fontFamily: fonts.serifMedium, fontSize: 17, lineHeight: 22 },
  secondary: { fontFamily: fonts.sans, fontSize: 10, lineHeight: 13 },
  markerSlot: { height: 7, justifyContent: 'center' },
});
