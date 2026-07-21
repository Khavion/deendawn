import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CityPickerModal } from './CityPickerModal';
import { VerseOfDayCard } from '../../quran/components/VerseOfDayCard';
import { isRamadan, toHijri } from '../../hijri/hijri';
import { computeDayTimes, isValidTime, nextPrayer } from '../engine';
import { formatTimeInZone } from '../format';
import { currentPeriod, periodPrayer, periodWord } from '../period';
import { PRAYER_NAMES } from '../types';
import { AppText, GoldFrameCard, Gradient, PeriodEyebrow, SectionRule } from '@/src/components/ui';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSettings } from '@/src/features/settings/SettingsContext';
import { resolveLocation, resolvePrayerConfig } from '@/src/features/settings/settingsStore';
import {
  ambientGradient,
  dimOnFeatured,
  elevation,
  featuredGradient,
  fonts,
  fontSize,
  radius,
  richMode,
  spacing,
  textOnFeatured,
} from '@/src/lib/theme/tokens';
import { useThemeMode } from '@/src/lib/theme/ThemeProvider';
import { useTokens } from '@/src/lib/theme/useTokens';
import { useDeviceTier } from '@/src/lib/theme/useDeviceTier';

function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function countdownParts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export function TodayScreen() {
  const insets = useSafeAreaInsets();
  const t = useTokens();
  const mode = useThemeMode();
  const rm = richMode(mode);
  const { flat } = useDeviceTier();
  const { t: tr, i18n } = useTranslation();
  const { settings, update } = useSettings();
  const [pickerOpen, setPickerOpen] = useState(false);
  const now = useNow(1000);

  const location = resolveLocation(settings);
  const config = useMemo(() => resolvePrayerConfig(settings), [settings]);

  const times = useMemo(
    () => (location ? computeDayTimes(location, now, config) : null),
    // Recompute when the calendar day flips, not every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location?.latitude, location?.longitude, config, now.toDateString()]
  );
  const next = location ? nextPrayer(location, now, config) : null;
  const period = times ? currentPeriod(now, times) : 'day';

  if (!location) {
    return (
      <View
        style={[
          styles.container,
          styles.empty,
          { backgroundColor: t.bgCanvas, paddingTop: insets.top + spacing.xl },
        ]}
      >
        <IconSymbol name="location.fill" size={44} color={t.accent} />
        <AppText variant="title" style={styles.emptyTitle}>
          {tr('today.greeting')}
        </AppText>
        <AppText variant="reading" style={[styles.emptyBody, { color: t.textSecondary }]}>
          {tr('today.emptyBody')}
        </AppText>
        <Pressable
          accessibilityRole="button"
          testID="choose-city"
          onPress={() => setPickerOpen(true)}
          style={[styles.primaryButton, { backgroundColor: t.accent }]}
        >
          <AppText variant="bodyStrong" style={{ color: t.textOnAccent }}>
            {tr('today.chooseCity')}
          </AppText>
        </Pressable>
        <CityPickerModal
          visible={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(city) => {
            update({ location: { type: 'manual', cityId: city.id } });
            setPickerOpen(false);
          }}
        />
      </View>
    );
  }

  const eyebrowLabel = `${tr(`prayers.${periodPrayer(period)}`)} · ${tr(`today.periods.${periodWord(period)}`)}`;

  return (
    <View style={[styles.container, { backgroundColor: t.bgCanvas }]}>
      {/* Ambient dawn-sky gradient — reverent, behind the header + featured card only. */}
      <Gradient
        pointerEvents="none"
        colors={ambientGradient[rm][period]}
        flat={flat}
        flatColor={t.bgCanvas}
        style={[styles.ambient, { height: insets.top + 340 }]}
      />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.m }]}>
        <PeriodEyebrow label={eyebrowLabel} style={styles.periodEyebrow} />

        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            testID="change-city"
            onPress={() => setPickerOpen(true)}
            style={styles.cityRow}
          >
            <IconSymbol name="location.fill" size={14} color={t.accent} />
            <AppText variant="bodyStrong">{location.label}</AppText>
          </Pressable>
          <AppText variant="caption" style={{ color: t.textSecondary }}>
            {now.toLocaleDateString(i18n.language, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
            {' · '}
            {(() => {
              const h = toHijri(now, settings.hijriOffset);
              return `${h.day} ${tr(h.monthKey)} ${h.year}`;
            })()}
          </AppText>
        </View>

        {times && isRamadan(now, settings.hijriOffset) && (
          <View style={[styles.ramadanCard, { backgroundColor: t.ochreSoft }]} testID="ramadan-card">
            <View style={styles.ramadanRow}>
              <AppText variant="bodyStrong" style={{ color: t.ochre }}>
                {tr('today.suhoorEnds')}
              </AppText>
              <AppText variant="bodyStrong" style={{ color: t.ochre }}>
                {isValidTime(times.fajr) ? formatTimeInZone(times.fajr) : '—'}
              </AppText>
            </View>
            <View style={styles.ramadanRow}>
              <AppText variant="bodyStrong" style={{ color: t.ochre }}>
                {tr('today.iftar')}
              </AppText>
              <AppText variant="bodyStrong" style={{ color: t.ochre }}>
                {isValidTime(times.maghrib) ? formatTimeInZone(times.maghrib) : '—'}
              </AppText>
            </View>
          </View>
        )}

        {next && (
          <GoldFrameCard gradientColors={featuredGradient[rm]} style={styles.nextCard}>
            <AppText variant="eyebrow" style={[styles.nextEyebrow, { color: dimOnFeatured[rm] }]}>
              {tr('today.nextPrayer')}
            </AppText>
            <AppText variant="title" style={{ color: textOnFeatured[rm] }}>
              {next.isTomorrow
                ? tr('today.tomorrow', { prayer: tr(`prayers.${next.prayer}`) })
                : tr(`prayers.${next.prayer}`)}
            </AppText>
            <AppText style={[styles.nextTime, { color: textOnFeatured[rm] }]}>
              {formatTimeInZone(next.time)}
            </AppText>
            <AppText variant="body" style={{ color: dimOnFeatured[rm] }}>
              {(() => {
                const p = countdownParts(next.time.getTime() - now.getTime());
                const time =
                  p.hours > 0
                    ? tr('today.hoursMinutes', { hours: p.hours, minutes: p.minutes })
                    : tr('today.minutesSeconds', { minutes: p.minutes, seconds: p.seconds });
                return tr('today.countdown', { time });
              })()}
            </AppText>
          </GoldFrameCard>
        )}

        <SectionRule label={tr('today.timesSection')} style={styles.sectionRule} />

        <View
          style={[
            styles.listCard,
            { backgroundColor: t.bgSurface, borderColor: t.border },
            flat ? undefined : elevation[rm].e2,
          ]}
        >
          {times &&
            PRAYER_NAMES.map((p) => {
              const time = times[p];
              const isNext = next && !next.isTomorrow && next.prayer === p;
              return (
                <View
                  key={p}
                  testID={`prayer-row-${p}`}
                  style={[
                    styles.row,
                    isNext && {
                      backgroundColor: t.accentSoft,
                      borderLeftColor: t.ochre,
                      borderLeftWidth: 3,
                    },
                  ]}
                >
                  <AppText
                    variant={isNext ? 'bodyStrong' : 'body'}
                    style={isNext ? { color: t.textOnAccentSoft } : undefined}
                  >
                    {tr(`prayers.${p}`)}
                  </AppText>
                  <AppText
                    variant={isNext ? 'bodyStrong' : 'body'}
                    style={isNext ? { color: t.textOnAccentSoft } : { color: t.textSecondary }}
                  >
                    {isValidTime(time) ? formatTimeInZone(time) : '—'}
                  </AppText>
                </View>
              );
            })}
        </View>

        <VerseOfDayCard date={now} />
      </ScrollView>
      <CityPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(city) => {
          update({ location: { type: 'manual', cityId: city.id } });
          setPickerOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ambient: { position: 'absolute', top: 0, left: 0, right: 0 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  empty: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.m },
  emptyTitle: { textAlign: 'center' },
  emptyBody: { textAlign: 'center' },
  primaryButton: {
    borderRadius: radius.card,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.l,
    marginTop: spacing.s,
    minHeight: 48,
    justifyContent: 'center',
  },
  periodEyebrow: { marginBottom: spacing.s },
  header: { gap: spacing.xs, marginBottom: spacing.l },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s - 2 },
  ramadanCard: {
    borderRadius: radius.card,
    padding: spacing.l,
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  ramadanRow: { flexDirection: 'row', justifyContent: 'space-between' },
  nextCard: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.l,
  },
  nextEyebrow: { marginBottom: spacing.xs },
  nextTime: {
    fontFamily: fonts.serifSemiBold,
    fontSize: fontSize.display,
    lineHeight: 44,
  },
  sectionRule: { marginBottom: spacing.s },
  listCard: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.l - 2,
    paddingHorizontal: spacing.l,
  },
});
