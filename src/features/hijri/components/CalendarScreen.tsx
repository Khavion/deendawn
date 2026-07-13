import { Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { keyDatesFor, toHijri } from '../hijri';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/src/features/settings/SettingsContext';
import { radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

interface Cell {
  gregorianDay: number;
  hijriDay: number;
  hijriMonth: number;
  isToday: boolean;
  isKeyDate: boolean;
  keyLabel?: string;
}

function buildMonth(year: number, month: number, hijriOffset: -1 | 0 | 1, todayKey: string) {
  const first = new Date(year, month, 1, 12);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = first.getDay(); // 0 = Sunday
  const cells: (Cell | null)[] = Array.from({ length: leading }, () => null);
  const hijriMonthsSeen = new Map<number, { month: number; year: number }>();

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d, 12);
    const h = toHijri(date, hijriOffset);
    hijriMonthsSeen.set(h.month * 10000 + h.year, { month: h.month, year: h.year });
    const key = keyDatesFor(h.month).find((k) => k.day === h.day);
    cells.push({
      gregorianDay: d,
      hijriDay: h.day,
      hijriMonth: h.month,
      isToday: `${year}-${month}-${d}` === todayKey,
      isKeyDate: !!key,
      keyLabel: key?.labelKey,
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return { cells, hijriMonths: [...hijriMonthsSeen.values()] };
}

export function CalendarScreen({ initialDate }: { initialDate?: Date }) {
  const t = useTokens();
  const { t: tr, i18n } = useTranslation();
  const { settings } = useSettings();
  const today = useMemo(() => initialDate ?? new Date(), [initialDate]);
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const { cells, hijriMonths } = useMemo(
    () => buildMonth(view.year, view.month, settings.hijriOffset, todayKey),
    [view, settings.hijriOffset, todayKey]
  );

  const gregorianTitle = new Date(view.year, view.month, 1).toLocaleDateString(i18n.language, {
    month: 'long',
    year: 'numeric',
  });
  const hijriTitle = hijriMonths
    .map((m) => `${tr(`hijriMonths.${m.month}`)} ${m.year}`)
    .join(' – ');
  const todayHijri = toHijri(today, settings.hijriOffset);

  const move = (delta: number) => {
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  // Legend of key dates present in the viewed month
  const legend = [
    ...new Map(
      cells
        .filter((c): c is Cell => !!c && c.isKeyDate && c.keyLabel !== 'hijriDates.whiteDay')
        .map((c) => [c.keyLabel!, c])
    ).keys(),
  ];

  return (
    <View style={[styles.container, { backgroundColor: t.bgCanvas }]}>
      <Stack.Screen options={{ title: tr('calendar.title') }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            testID="prev-month"
            onPress={() => move(-1)}
            hitSlop={12}
          >
            <ThemedText type="title" style={{ color: t.accent }}>
              ‹
            </ThemedText>
          </Pressable>
          <View style={styles.headerTitles}>
            <ThemedText type="subtitle" style={styles.centerText}>
              {gregorianTitle}
            </ThemedText>
            <ThemedText type="caption" style={[styles.centerText, { color: t.textSecondary }]}>
              {hijriTitle}
            </ThemedText>
          </View>
          <Pressable
            accessibilityRole="button"
            testID="next-month"
            onPress={() => move(1)}
            hitSlop={12}
          >
            <ThemedText type="title" style={{ color: t.accent }}>
              ›
            </ThemedText>
          </Pressable>
        </View>

        <ThemedText type="caption" style={[styles.todayLine, { color: t.textSecondary }]}>
          {tr('calendar.today')}: {todayHijri.day} {tr(`hijriMonths.${todayHijri.month}`)}{' '}
          {todayHijri.year}
        </ThemedText>

        <View style={styles.grid} testID="calendar-grid">
          {cells.map((cell, i) => (
            <View
              key={i}
              style={[
                styles.cell,
                cell?.isToday && { backgroundColor: t.accentSoft, borderRadius: radius.control },
              ]}
              testID={cell ? `cell-${cell.gregorianDay}` : undefined}
            >
              {cell && (
                <>
                  <ThemedText
                    type={cell.isToday ? 'defaultSemiBold' : 'default'}
                    style={cell.isToday ? { color: t.textOnAccentSoft } : undefined}
                  >
                    {cell.gregorianDay}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: t.textSecondary }}>
                    {cell.hijriDay}
                  </ThemedText>
                  {cell.isKeyDate && (
                    <View
                      style={[styles.dot, { backgroundColor: t.ochre }]}
                      testID={`key-${cell.gregorianDay}`}
                    />
                  )}
                </>
              )}
            </View>
          ))}
        </View>

        {legend.length > 0 && (
          <View style={styles.legend}>
            {legend.map((key) => (
              <View key={key} style={styles.legendRow}>
                <View style={[styles.dot, { backgroundColor: t.ochre }]} />
                <ThemedText type="caption" style={{ color: t.textSecondary }}>
                  {tr(key)}
                </ThemedText>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.disclaimer, { backgroundColor: t.bgElevated }]}>
          <ThemedText type="caption" style={{ color: t.textSecondary, textAlign: 'center' }}>
            {tr('calendar.disclaimer')}
          </ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitles: { flex: 1, gap: 2 },
  centerText: { textAlign: 'center' },
  todayLine: { textAlign: 'center', marginTop: spacing.s, marginBottom: spacing.l },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: spacing.s,
    minHeight: 56,
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
  legend: { gap: spacing.xs, marginTop: spacing.l },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s },
  disclaimer: {
    marginTop: spacing.xl,
    borderRadius: radius.control,
    padding: spacing.m,
  },
});
