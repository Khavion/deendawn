import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CityPickerModal } from './CityPickerModal';
import { computeDayTimes, isValidTime, nextPrayer } from '../engine';
import { formatTimeInZone } from '../format';
import { PRAYER_NAMES, PrayerName } from '../types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/src/features/settings/SettingsContext';
import { resolveLocation, resolvePrayerConfig } from '@/src/features/settings/settingsStore';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
  const scheme = useColorScheme() ?? 'light';
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
      <ThemedView style={[styles.container, styles.empty, { paddingTop: insets.top + 24 }]}>
        <IconSymbol name="location.fill" size={48} color={Colors[scheme].tint} />
        <ThemedText type="title" style={styles.emptyTitle}>
          As-salamu alaykum
        </ThemedText>
        <ThemedText style={styles.emptyBody}>
          Choose your city to see today&apos;s prayer times. Everything stays on your phone —
          nothing is sent anywhere.
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          testID="choose-city"
          onPress={() => setPickerOpen(true)}
          style={[styles.primaryButton, { backgroundColor: Colors[scheme].tint }]}
        >
          <ThemedText style={styles.primaryButtonText} lightColor="#fff" darkColor="#10201A">
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
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            testID="change-city"
            onPress={() => setPickerOpen(true)}
            style={styles.cityRow}
          >
            <IconSymbol name="location.fill" size={16} color={Colors[scheme].tint} />
            <ThemedText type="defaultSemiBold">{location.label}</ThemedText>
          </Pressable>
          <ThemedText style={styles.date}>
            {now.toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </ThemedText>
        </View>

        {next && (
          <View style={[styles.nextCard, { backgroundColor: Colors[scheme].tint }]}>
            <ThemedText style={styles.nextLabel} lightColor="#E8FFF6" darkColor="#10201A">
              {next.isTomorrow
                ? `${PRAYER_LABELS[next.prayer]} (tomorrow)`
                : PRAYER_LABELS[next.prayer]}
            </ThemedText>
            <ThemedText type="title" lightColor="#fff" darkColor="#10201A">
              {formatTimeInZone(next.time)}
            </ThemedText>
            <ThemedText style={styles.nextCountdown} lightColor="#E8FFF6" darkColor="#10201A">
              in {formatCountdown(next.time.getTime() - now.getTime())}
            </ThemedText>
          </View>
        )}

        <View style={styles.list}>
          {times &&
            PRAYER_NAMES.map((p) => {
              const t = times[p];
              const isNext = next && !next.isTomorrow && next.prayer === p;
              return (
                <View
                  key={p}
                  testID={`prayer-row-${p}`}
                  style={[
                    styles.row,
                    isNext && { backgroundColor: scheme === 'light' ? '#E4F5EE' : '#173229' },
                  ]}
                >
                  <ThemedText type={isNext ? 'defaultSemiBold' : 'default'}>
                    {PRAYER_LABELS[p]}
                  </ThemedText>
                  <ThemedText type={isNext ? 'defaultSemiBold' : 'default'}>
                    {isValidTime(t) ? formatTimeInZone(t) : '—'}
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { textAlign: 'center' },
  emptyBody: { textAlign: 'center', opacity: 0.8 },
  primaryButton: {
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 8,
  },
  primaryButtonText: { fontWeight: '600' },
  header: { gap: 4, marginBottom: 16 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  date: { opacity: 0.7 },
  nextCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  nextLabel: { fontWeight: '600' },
  nextCountdown: {},
  list: { gap: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
});
