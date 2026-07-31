import { Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { daysInHijriMonth, fromHijri, keyDatesFor, toHijri, type HijriOffset } from '../hijri';
import {
  AppPressable,
  AppText,
  CalendarGrid,
  Card,
  ListRow,
  Marker,
  SectionRule,
  type DayCellData,
} from '@/src/components/ui';
import { digitLocale, localizeNumber } from '@/src/lib/i18n/format';
import { useSettings } from '@/src/features/settings/SettingsContext';
import { measure, radius, spacing } from '@/src/lib/theme/tokens';
import { useScrollInsets } from '@/src/lib/theme/useScrollInsets';
import { useTokens } from '@/src/lib/theme/useTokens';

const FRIDAY = 5; // Date.getDay()

/**
 * Hijri calendar (handoff §6 screen 08): pages by HIJRI month ("Muharram
 * 1448" with the Gregorian range as the caption), dual-numeral DayCells
 * (hijri primary), Friday's weekday letter in ochre, observances as filled
 * diamonds (white days 13–15 outlined), and the month's observances listed
 * under "THIS MONTH". Labeled calculated — may differ from moonsighting
 * (existing disclaimer, SCHOLAR_REVIEW).
 */
function buildHijriMonth(
  hYear: number,
  hMonth: number,
  offset: HijriOffset,
  todayKey: string,
  lang: string,
  weekdayNames: Intl.DateTimeFormat,
  monthName: string
) {
  const days = daysInHijriMonth(hYear, hMonth);
  const first = fromHijri(hYear, hMonth, 1, offset);
  const keyDates = keyDatesFor(hMonth);
  const cells: (DayCellData | null)[] = Array.from({ length: first.getDay() }, () => null);
  let firstGreg = first;
  let lastGreg = first;
  for (let d = 1; d <= days; d++) {
    const date = new Date(first.getFullYear(), first.getMonth(), first.getDate() + (d - 1), 12);
    if (d === days) lastGreg = date;
    if (d === 1) firstGreg = date;
    const key = keyDates.find((k) => k.day === d);
    const isToday = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` === todayKey;
    cells.push({
      key: `${hYear}-${hMonth}-${d}`,
      primary: localizeNumber(d, lang),
      secondary: localizeNumber(date.getDate(), lang),
      isToday,
      observance: key ? (key.labelKey === 'hijriDates.whiteDay' ? 'outline' : 'filled') : undefined,
      accessibilityLabel: [
        `${localizeNumber(d, lang)} ${monthName}`,
        weekdayNames.format(date),
        isToday ? 'today' : null,
      ]
        .filter(Boolean)
        .join(', '),
      testID: `cell-${d}`,
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return { cells, firstGreg, lastGreg, keyDates };
}

export function CalendarScreen({ initialDate }: { initialDate?: Date }) {
  const t = useTokens();
  const androidInsets = useScrollInsets({ top: false, bottom: 'nav', baseBottom: spacing.l });
  const { t: tr, i18n } = useTranslation();
  const { settings } = useSettings();
  const today = useMemo(() => initialDate ?? new Date(), [initialDate]);
  const todayHijri = toHijri(today, settings.hijriOffset);
  const [view, setView] = useState({ hYear: todayHijri.year, hMonth: todayHijri.month });

  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const monthName = tr(`hijriMonths.${view.hMonth}`);
  const weekdayLong = useMemo(
    () => new Intl.DateTimeFormat(digitLocale(i18n.language), { weekday: 'long' }),
    [i18n.language]
  );
  const { cells, firstGreg, lastGreg, keyDates } = useMemo(
    () =>
      buildHijriMonth(
        view.hYear,
        view.hMonth,
        settings.hijriOffset,
        todayKey,
        i18n.language,
        weekdayLong,
        monthName
      ),
    [view, settings.hijriOffset, todayKey, i18n.language, weekdayLong, monthName]
  );

  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(digitLocale(i18n.language), { weekday: 'narrow' });
    // Week starts Sunday to match Date.getDay() padding above.
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2026, 7, 2 + i); // a known Sunday
      return { label: fmt.format(d), emphasized: d.getDay() === FRIDAY };
    });
  }, [i18n.language]);

  const rangeFmt = useMemo(
    () => new Intl.DateTimeFormat(digitLocale(i18n.language), { month: 'long', day: 'numeric' }),
    [i18n.language]
  );
  const yearFmt = useMemo(
    () => new Intl.DateTimeFormat(digitLocale(i18n.language), { year: 'numeric' }),
    [i18n.language]
  );
  const gregorianRange = `${rangeFmt.format(firstGreg)} – ${rangeFmt.format(lastGreg)} ${yearFmt.format(lastGreg)}`;

  const move = (delta: number) => {
    setView(({ hYear, hMonth }) => {
      let m = hMonth + delta;
      let y = hYear;
      if (m < 1) {
        m = 12;
        y -= 1;
      } else if (m > 12) {
        m = 1;
        y += 1;
      }
      return { hYear: y, hMonth: m };
    });
  };

  const legend = [...new Map(keyDates.filter((k) => k.labelKey !== 'hijriDates.whiteDay').map((k) => [k.labelKey, k]))].map(
    ([, k]) => k
  );

  return (
    <View style={[styles.container, { backgroundColor: t.bgCanvas }]}>
      <Stack.Screen options={{ title: tr('calendar.title') }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.scroll, androidInsets]}
      >
        <View style={styles.topRow}>
          <AppText variant="subtitle">{tr('calendar.title')}</AppText>
          <AppPressable
            accessibilityRole="button"
            testID="calendar-today"
            hitSlop={8}
            onPress={() => setView({ hYear: todayHijri.year, hMonth: todayHijri.month })}
          >
            <AppText variant="link">{tr('calendar.jumpToday')}</AppText>
          </AppPressable>
        </View>

        <View style={styles.header}>
          <AppPressable
            accessibilityRole="button"
            accessibilityLabel={tr('calendar.prevMonth')}
            testID="prev-month"
            haptic="select"
            onPress={() => move(-1)}
            hitSlop={12}
            style={styles.navTarget}
          >
            <AppText variant="title" style={{ color: t.accent }}>
              ‹
            </AppText>
          </AppPressable>
          <View style={styles.headerTitles}>
            <AppText variant="title" style={styles.centerText} testID="hijri-month-title">
              {monthName} {localizeNumber(view.hYear, i18n.language)}
            </AppText>
            <AppText variant="caption" style={[styles.centerText, { color: t.textSecondary }]}>
              {gregorianRange}
            </AppText>
          </View>
          <AppPressable
            accessibilityRole="button"
            accessibilityLabel={tr('calendar.nextMonth')}
            testID="next-month"
            haptic="select"
            onPress={() => move(1)}
            hitSlop={12}
            style={styles.navTarget}
          >
            <AppText variant="title" style={{ color: t.accent }}>
              ›
            </AppText>
          </AppPressable>
        </View>

        <Card style={styles.gridCard}>
          <CalendarGrid cells={cells} weekdays={weekdays} testID="calendar-grid" />
        </Card>

        {legend.length > 0 && (
          <>
            <SectionRule label={tr('calendar.thisMonth')} style={styles.sectionRule} />
            <Card style={styles.legendCard}>
              {legend.map((k) => (
                <ListRow
                  key={k.labelKey}
                  label={tr(k.labelKey)}
                  value={`${localizeNumber(k.day, i18n.language)} ${monthName}`}
                  leading={<Marker size={7} tone="ochre" />}
                  testID={`observance-${k.day}`}
                />
              ))}
            </Card>
          </>
        )}

        <View style={[styles.disclaimer, { borderStartColor: t.ochre }]}>
          <AppText variant="caption" style={{ color: t.textSecondary }}>
            {tr('calendar.disclaimer')}
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    padding: spacing.l,
    maxWidth: measure.grid,
    width: '100%',
    alignSelf: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.s,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.m,
    marginBottom: spacing.m,
  },
  navTarget: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitles: { flex: 1, gap: 2 },
  centerText: { textAlign: 'center' },
  gridCard: { paddingVertical: spacing.m, paddingHorizontal: spacing.s },
  sectionRule: { marginTop: spacing.l, marginBottom: spacing.s },
  legendCard: { padding: 0 },
  disclaimer: {
    borderStartWidth: 3,
    borderRadius: radius.control,
    paddingStart: spacing.m,
    paddingVertical: spacing.s,
    marginTop: spacing.l,
  },
});
