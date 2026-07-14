import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CityPickerModal } from './CityPickerModal';
import { isRamadan, toHijri } from '../../hijri/hijri';
import { computeDayTimes, isValidTime, nextPrayer } from '../engine';
import { formatTimeInZone } from '../format';
import { PRAYER_NAMES } from '../types';
import { AppText } from '@/src/components/ui';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSettings } from '@/src/features/settings/SettingsContext';
import { resolveLocation, resolvePrayerConfig } from '@/src/features/settings/settingsStore';
import { fonts, fontSize, radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

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

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: t.bgCanvas, paddingTop: insets.top + spacing.m },
      ]}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
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
          <View
            style={[styles.ramadanCard, { backgroundColor: t.ochreSoft }]}
            testID="ramadan-card"
          >
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
          <View style={[styles.nextCard, { backgroundColor: t.accent }]}>
            <AppText variant="bodyStrong" style={{ color: t.textOnAccent, opacity: 0.85 }}>
              {next.isTomorrow
                ? tr('today.tomorrow', { prayer: tr(`prayers.${next.prayer}`) })
                : tr(`prayers.${next.prayer}`)}
            </AppText>
            <AppText style={[styles.nextTime, { color: t.textOnAccent }]}>
              {formatTimeInZone(next.time)}
            </AppText>
            <AppText style={{ color: t.textOnAccent, opacity: 0.85 }}>
              {(() => {
                const p = countdownParts(next.time.getTime() - now.getTime());
                const time =
                  p.hours > 0
                    ? tr('today.hoursMinutes', { hours: p.hours, minutes: p.minutes })
                    : tr('today.minutesSeconds', { minutes: p.minutes, seconds: p.seconds });
                return tr('today.countdown', { time });
              })()}
            </AppText>
          </View>
        )}

        <View style={styles.list}>
          {times &&
            PRAYER_NAMES.map((p) => {
              const time = times[p];
              const isNext = next && !next.isTomorrow && next.prayer === p;
              return (
                <View
                  key={p}
                  testID={`prayer-row-${p}`}
                  style={[styles.row, isNext && { backgroundColor: t.accentSoft }]}
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
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.l,
  },
  nextTime: {
    fontFamily: fonts.serifSemiBold,
    fontSize: fontSize.display,
    lineHeight: 44,
  },
  list: { gap: spacing.xs },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.l - 2,
    paddingHorizontal: spacing.l,
    borderRadius: radius.control,
  },
});
