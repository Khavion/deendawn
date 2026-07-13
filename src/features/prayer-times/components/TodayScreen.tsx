import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CityPickerModal } from './CityPickerModal';
import { computeDayTimes, isValidTime, nextPrayer } from '../engine';
import { formatTimeInZone } from '../format';
import { PRAYER_NAMES, PrayerName } from '../types';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSettings } from '@/src/features/settings/SettingsContext';
import { resolveLocation, resolvePrayerConfig } from '@/src/features/settings/settingsStore';
import { fonts, fontSize, radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

const PRAYER_LABELS: Record<PrayerName, string> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
}

export function TodayScreen() {
  const insets = useSafeAreaInsets();
  const t = useTokens();
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
        <ThemedText type="title" style={styles.emptyTitle}>
          As-salamu alaykum
        </ThemedText>
        <ThemedText type="serifBody" style={[styles.emptyBody, { color: t.textSecondary }]}>
          Choose your city to see today&apos;s prayer times. Everything stays on your phone —
          nothing is sent anywhere.
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          testID="choose-city"
          onPress={() => setPickerOpen(true)}
          style={[styles.primaryButton, { backgroundColor: t.accent }]}
        >
          <ThemedText type="defaultSemiBold" style={{ color: t.textOnAccent }}>
            Choose your city
          </ThemedText>
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
            <ThemedText type="defaultSemiBold">{location.label}</ThemedText>
          </Pressable>
          <ThemedText type="caption" style={{ color: t.textSecondary }}>
            {now.toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </ThemedText>
        </View>

        {next && (
          <View style={[styles.nextCard, { backgroundColor: t.accent }]}>
            <ThemedText type="defaultSemiBold" style={{ color: t.textOnAccent, opacity: 0.85 }}>
              {next.isTomorrow
                ? `${PRAYER_LABELS[next.prayer]} (tomorrow)`
                : PRAYER_LABELS[next.prayer]}
            </ThemedText>
            <ThemedText style={[styles.nextTime, { color: t.textOnAccent }]}>
              {formatTimeInZone(next.time)}
            </ThemedText>
            <ThemedText style={{ color: t.textOnAccent, opacity: 0.85 }}>
              in {formatCountdown(next.time.getTime() - now.getTime())}
            </ThemedText>
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
                  <ThemedText
                    type={isNext ? 'defaultSemiBold' : 'default'}
                    style={isNext ? { color: t.textOnAccentSoft } : undefined}
                  >
                    {PRAYER_LABELS[p]}
                  </ThemedText>
                  <ThemedText
                    type={isNext ? 'defaultSemiBold' : 'default'}
                    style={isNext ? { color: t.textOnAccentSoft } : { color: t.textSecondary }}
                  >
                    {isValidTime(time) ? formatTimeInZone(time) : '—'}
                  </ThemedText>
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
