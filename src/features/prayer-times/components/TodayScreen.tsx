import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CityPickerModal } from './CityPickerModal';
import { VerseOfDayCard } from '../../quran/components/VerseOfDayCard';
import { isRamadan, toHijri } from '../../hijri/hijri';
import { loadNotificationPrefs } from '../../notifications/prefsStore';
import { silenceToday } from '../../notifications/silenceToday';
import { computeDayTimes, isValidTime, nextPrayer } from '../engine';
import { formatTimeInZone } from '../format';
import { digitLocale, localizeNumber } from '@/src/lib/i18n/format';
import { currentPeriod, periodWord } from '../period';
import { PRAYER_NAMES, type PrayerName } from '../types';
import {
  AppPressable,
  AppText,
  Countdown,
  Divider,
  GoldFrameCard,
  Gradient,
  ListCard,
  ListRow,
  Marker,
  PeriodEyebrow,
  SectionRule,
} from '@/src/components/ui';
import { useSettings } from '@/src/features/settings/SettingsContext';
import { resolveLocation, resolvePrayerConfig } from '@/src/features/settings/settingsStore';
import {
  featuredGradient,
  heroWash,
  measure,
  fonts,
  periodWash,
  radius,
  spacing,
  type DayPeriod,
} from '@/src/lib/theme/tokens';
import { withAlpha } from '@/src/lib/color';
import { useThemeMode } from '@/src/lib/theme/ThemeProvider';
import { useScrollInsets } from '@/src/lib/theme/useScrollInsets';
import { useTokens } from '@/src/lib/theme/useTokens';
import { useDeviceTier } from '@/src/lib/theme/useDeviceTier';

/**
 * A clock that ticks exactly on minute boundaries. Prayer times are
 * minute-precise, so the screen recomputes the next prayer / period / dates at
 * the same instant they can change — and only then. The per-second tick lives
 * inside <Countdown> so the rest of the screen never re-renders for it.
 */
function useMinuteNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    const arm = () => {
      const d = new Date();
      const untilNextMinute = 60_000 - (d.getSeconds() * 1000 + d.getMilliseconds());
      id = setTimeout(() => {
        setNow(new Date());
        arm();
      }, untilNextMinute + 20);
    };
    arm();
    return () => clearTimeout(id);
  }, []);
  return now;
}

/** The period a prayer belongs to, for the hero eyebrow's second word. */
const PRAYER_PERIOD: Record<PrayerName, DayPeriod> = {
  fajr: 'fajr',
  sunrise: 'day',
  dhuhr: 'day',
  asr: 'asr',
  maghrib: 'maghrib',
  isha: 'isha',
};

/**
 * The featured hero (handoff §6 screen 01). Interior colors come from the
 * card's content tone (gap 02) — the body is a child component so its hooks
 * resolve the onFeatured palette, with zero hand-passed colors. The period
 * wash overlays the fill at the hero's own intensity.
 */
function NextPrayerHero({
  next,
  timeLocale,
  period,
  muted,
  adhanEnabled,
  onMute,
}: {
  next: NonNullable<ReturnType<typeof nextPrayer>>;
  timeLocale: string;
  period: DayPeriod;
  muted: boolean;
  adhanEnabled: boolean;
  onMute: () => void;
}) {
  const { flat } = useDeviceTier();
  const wash = heroWash[period];
  return (
    <GoldFrameCard gradientColors={featuredGradient.light} style={styles.nextCard} testID="next-hero">
      {wash && !flat ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: wash }]} />
      ) : null}
      <NextPrayerHeroBody
        next={next}
        timeLocale={timeLocale}
        muted={muted}
        adhanEnabled={adhanEnabled}
        onMute={onMute}
      />
    </GoldFrameCard>
  );
}

function NextPrayerHeroBody({
  next,
  timeLocale,
  muted,
  adhanEnabled,
  onMute,
}: {
  next: NonNullable<ReturnType<typeof nextPrayer>>;
  timeLocale: string;
  muted: boolean;
  adhanEnabled: boolean;
  onMute: () => void;
}) {
  const { t: tr } = useTranslation();
  const t = useTokens();
  const eyebrow = `${tr(`prayers.${next.prayer}`)} · ${tr(
    `today.periods.${periodWord(PRAYER_PERIOD[next.prayer])}`
  )}`;
  return (
    <>
      <PeriodEyebrow label={eyebrow} labelColor={t.textSecondary} style={styles.nextEyebrow} />
      <AppText variant="display" color={t.textPrimary} numberOfLines={1} testID="next-time">
        {formatTimeInZone(next.time, { locale: timeLocale })}
      </AppText>
      <Countdown target={next.time} variant="title" color={t.ochre} testID="next-countdown" />
      {adhanEnabled ? (
        <>
          <Divider style={styles.heroRule} />
          <View style={styles.heroCaptionRow}>
            <AppText variant="caption" color={t.textSecondary}>
              {muted ? tr('today.mutedToday') : tr('today.adhanWillSound')}
            </AppText>
            {!muted && (
              <AppPressable
                accessibilityRole="button"
                testID="mute-today"
                hitSlop={8}
                haptic="press"
                onPress={onMute}
              >
                {/* Ivory, not the deck's gold: 13pt gold misses AA on the
                    fill (same call as the hero eyebrow — DECISIONS). */}
                <AppText variant="caption" color={t.textPrimary} style={styles.heroAction}>
                  {tr('today.muteToday')}
                </AppText>
              </AppPressable>
            )}
          </View>
        </>
      ) : null}
    </>
  );
}

export function TodayScreen() {
  const insets = useSafeAreaInsets();
  const androidInsets = useScrollInsets({ baseTop: spacing.m, baseBottom: spacing.l });
  const t = useTokens();
  const mode = useThemeMode();
  const { flat } = useDeviceTier();
  const { t: tr, i18n } = useTranslation();
  const timeLocale = digitLocale(i18n.language);
  const { settings, update, store } = useSettings();
  const [pickerOpen, setPickerOpen] = useState(false);
  const now = useMinuteNow();

  const location = resolveLocation(settings);
  const config = useMemo(() => resolvePrayerConfig(settings), [settings]);

  // Recompute times when the calendar day flips, not every tick.
  const dayKey = now.toDateString();
  const times = useMemo(
    () => (location ? computeDayTimes(location, now, config) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location?.latitude, location?.longitude, config, dayKey]
  );
  const next = location ? nextPrayer(location, now, config) : null;
  const period = times ? currentPeriod(now, times) : 'day';

  // "Mute today" (handoff §6/§7): cancels today's remaining adhans via the
  // same path as the notification action. In-memory per local day — tomorrow
  // resumes normally, matching what silenceToday actually does.
  const [mutedDay, setMutedDay] = useState<string | null>(null);
  const muted = mutedDay === dayKey;
  const adhanEnabled = useMemo(() => {
    if (!next || next.isTomorrow) return false;
    const prefs = loadNotificationPrefs(store);
    return prefs.enabled[next.prayer] && prefs.sound[next.prayer] !== 'silent';
  }, [next, store]);
  const onMute = () => {
    setMutedDay(dayKey);
    void silenceToday(now);
  };

  if (!location) {
    return (
      <View
        style={[
          styles.container,
          styles.empty,
          { backgroundColor: t.bgCanvas, paddingTop: insets.top + spacing.xl },
        ]}
      >
        <Marker size={12} tone="ochre" />
        <AppText variant="title" style={styles.emptyTitle}>
          {tr('today.greeting')}
        </AppText>
        <AppText variant="reading" style={[styles.emptyBody, { color: t.textSecondary }]}>
          {tr('today.emptyBody')}
        </AppText>
        <AppPressable
          accessibilityRole="button"
          testID="choose-city"
          onPress={() => setPickerOpen(true)}
          style={[styles.primaryButton, { backgroundColor: t.accent }]}
        >
          <AppText variant="bodyStrong" style={{ color: t.textOnAccent }}>
            {tr('today.chooseCity')}
          </AppText>
        </AppPressable>
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

  const wash = periodWash[mode][period];
  const hijri = toHijri(now, settings.hijriOffset);
  const hijriLabel = `${localizeNumber(hijri.day, i18n.language)} ${tr(hijri.monthKey)} ${localizeNumber(hijri.year, i18n.language)}`;

  return (
    <View style={[styles.container, { backgroundColor: t.bgCanvas }]}>
      {/* Period wash (handoff gap 01): a quiet tint fading from the top —
          dawn/dusk/night only; day renders nothing. Vertical, so RTL-free. */}
      {wash && (
        <Gradient
          pointerEvents="none"
          colors={[wash.color, withAlpha(wash.color, 0)]}
          flat={flat}
          flatColor={t.bgCanvas}
          style={[styles.ambient, { height: insets.top + wash.height }]}
        />
      )}
      {/* iOS: `automatic` insets the content below the status bar; the DS
          tab bar is in-flow, so no bottom clearance is needed. Android:
          androidInsets supplies the status-bar padding. */}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.scroll, androidInsets]}
      >
        <View style={styles.header}>
          <AppText variant="subtitle" testID="hijri-date">
            {hijriLabel}
          </AppText>
          <AppPressable
            accessibilityRole="button"
            testID="change-city"
            onPress={() => setPickerOpen(true)}
            hitSlop={8}
          >
            <AppText variant="link">{location.label}</AppText>
          </AppPressable>
        </View>
        <AppText variant="caption" style={[styles.gregorian, { color: t.textSecondary }]}>
          {now.toLocaleDateString(timeLocale, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </AppText>

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
                {isValidTime(times.fajr) ? formatTimeInZone(times.fajr, { locale: timeLocale }) : '—'}
              </AppText>
            </View>
            <View style={styles.ramadanRow}>
              <AppText variant="bodyStrong" style={{ color: t.ochre }}>
                {tr('today.iftar')}
              </AppText>
              <AppText variant="bodyStrong" style={{ color: t.ochre }}>
                {isValidTime(times.maghrib) ? formatTimeInZone(times.maghrib, { locale: timeLocale }) : '—'}
              </AppText>
            </View>
          </View>
        )}

        {next && (
          <NextPrayerHero
            next={next}
            timeLocale={timeLocale}
            period={period}
            muted={muted}
            adhanEnabled={adhanEnabled}
            onMute={onMute}
          />
        )}

        <SectionRule label={tr('today.timesSection')} style={styles.sectionRule} />

        {times && (
          <ListCard>
            {PRAYER_NAMES.filter((p) => p !== 'sunrise').map((p) => {
              const time = times[p];
              const isNext = next && !next.isTomorrow && next.prayer === p;
              const isPast = isValidTime(time) && time.getTime() <= now.getTime() && !isNext;
              return (
                <ListRow
                  key={p}
                  testID={`prayer-row-${p}`}
                  label={tr(`prayers.${p}`)}
                  value={isValidTime(time) ? formatTimeInZone(time, { locale: timeLocale }) : '—'}
                  state={isNext ? 'marked' : isPast ? 'past' : 'default'}
                />
              );
            })}
          </ListCard>
        )}

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
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.m,
    paddingBottom: spacing.l,
    maxWidth: measure.content,
    width: '100%',
    alignSelf: 'center',
  },
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.m,
  },
  gregorian: { marginTop: spacing.xs, marginBottom: spacing.l },
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
  heroRule: { marginTop: spacing.m, width: '100%' },
  heroCaptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.s,
    minHeight: 24,
  },
  heroAction: { fontFamily: fonts.sansSemiBold },
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
