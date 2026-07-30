import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { qiblaBearing, relativeQibla } from '../bearing';
import { useHeading } from '../useHeading';
import { CityPickerModal } from '../../prayer-times/components/CityPickerModal';
import { useSettings } from '../../settings/SettingsContext';
import { resolveLocation } from '../../settings/settingsStore';
import { AppPressable, AppText } from '@/src/components/ui';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useHaptics } from '@/src/lib/haptics';
import { elevation, fonts, fontSize, radius, richMode, spacing } from '@/src/lib/theme/tokens';
import { useThemeMode } from '@/src/lib/theme/ThemeProvider';
import { useScrollInsets } from '@/src/lib/theme/useScrollInsets';
import { useTokens } from '@/src/lib/theme/useTokens';
import { useLayout } from '@/src/lib/theme/useLayout';
import { useDeviceTier } from '@/src/lib/theme/useDeviceTier';

const RING_SIZE = 280;

export function QiblaScreen() {
  const insets = useSafeAreaInsets();
  const { wide } = useLayout();
  // The dial scales up on tablet-class widths; useWindowDimensions keeps it
  // live across iPad window resizes.
  const ringSize = wide ? 360 : RING_SIZE;
  const t = useTokens();
  const androidInsets = useScrollInsets({ top: false, bottom: 'tabs', baseBottom: spacing.l });
  const mode = useThemeMode();
  const rm = richMode(mode);
  const { flat } = useDeviceTier();
  const h = useHaptics();
  const { t: tr } = useTranslation();
  const { settings, update } = useSettings();
  const [pickerOpen, setPickerOpen] = useState(false);
  const location = resolveLocation(settings);
  // Rotation lives on the UI thread at full sensor rate (Reanimated shared
  // values) — React state below only updates at the hook's throttled cadence
  // for logic (alignment styling, chips, haptics). Values are direct
  // assignments, not springs: the needle TRACKS the sensor (functional
  // motion), so Reduce Motion needs no special casing here.
  const roseSv = useSharedValue(0);
  const needleSv = useSharedValue(0);
  const bearingRef = useRef<number | null>(null);
  const { heading, trueNorth, accuracy, permission, requestPermission } = useHeading((deg) => {
    roseSv.value = -deg;
    if (bearingRef.current !== null) {
      needleSv.value = relativeQibla(bearingRef.current, deg).turn;
    }
  });
  const roseStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${roseSv.value}deg` }],
  }));
  const needleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${needleSv.value}deg` }],
  }));

  const bearing = useMemo(
    () => (location ? qiblaBearing(location) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location?.latitude, location?.longitude]
  );
  useEffect(() => {
    bearingRef.current = bearing;
  }, [bearing]);

  const rel = bearing !== null && heading !== null ? relativeQibla(bearing, heading) : null;

  // Haptics: edge-triggered tick on entering the ±3° window; one Success per mount.
  const wasAligned = useRef(false);
  const celebrated = useRef(false);
  useEffect(() => {
    if (!rel) return;
    if (rel.aligned && !wasAligned.current) {
      h.select();
      AccessibilityInfo.announceForAccessibility(tr('qibla.alignedAnnounce'));
      if (!celebrated.current) {
        celebrated.current = true;
        h.success();
      }
    }
    wasAligned.current = rel.aligned;
  }, [rel?.aligned]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!location) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: t.bgCanvas, paddingTop: insets.top },
        ]}
      >
        <IconSymbol name="safari.fill" size={44} color={t.accent} />
        <AppText variant="title" style={styles.centerText}>
          {tr('qibla.title')}
        </AppText>
        <AppText variant="reading" style={[styles.centerText, { color: t.textSecondary }]}>
          {tr('qibla.chooseCityFirst')}
        </AppText>
        <AppPressable
          accessibilityRole="button"
          testID="qibla-choose-city"
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

  if (permission === 'denied') {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: t.bgCanvas, paddingTop: insets.top },
        ]}
      >
        <IconSymbol name="safari.fill" size={44} color={t.accent} />
        <AppText variant="reading" style={[styles.centerText, { color: t.textSecondary }]}>
          {tr('qibla.permissionNeeded')}
        </AppText>
        <AppPressable
          accessibilityRole="button"
          testID="qibla-grant"
          onPress={requestPermission}
          style={[styles.primaryButton, { backgroundColor: t.accent }]}
        >
          <AppText variant="bodyStrong" style={{ color: t.textOnAccent }}>
            {tr('qibla.grantPermission')}
          </AppText>
        </AppPressable>
      </View>
    );
  }

  const statusText = rel
    ? rel.aligned
      ? tr('qibla.aligned')
      : rel.direction === 'right'
        ? tr('qibla.turnRight', { degrees: Math.round(Math.abs(rel.turn)) })
        : tr('qibla.turnLeft', { degrees: Math.round(Math.abs(rel.turn)) })
    : undefined;

  return (
    <View style={[styles.container, { backgroundColor: t.bgCanvas }]}>
      {/* Scrollable so large type sizes degrade by scrolling instead of
          pushing the calibration chips off-screen; `automatic` handles the
          status-bar top and the floating tab bar bottom. */}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.scrollContent, androidInsets]}
      >
        <AppText variant="title" style={styles.header}>
          {tr('qibla.title')}
        </AppText>

        <View
          style={styles.compassArea}
          accessible
          accessibilityLabel={statusText}
          testID="compass"
        >
          <View
            style={[
              styles.ring,
              {
                width: ringSize,
                height: ringSize,
                borderRadius: ringSize / 2,
                backgroundColor: rel?.aligned ? t.accentSoft : t.bgSurface,
                borderColor: rel?.aligned ? t.success : t.border,
              },
              flat ? undefined : elevation[rm].e2,
            ]}
          >
            {/* Compass rose: N marker rotates opposite the device heading. */}
            <Animated.View style={[styles.rose, roseStyle]}>
              <AppText variant="caption" style={[styles.north, { color: t.textSecondary }]}>
                {tr('qibla.northMarker')}
              </AppText>
            </Animated.View>
            {/* Needle points toward the qibla relative to the device. */}
            <Animated.View testID="needle" style={[styles.needleWrap, needleStyle]}>
              <View
                style={[
                  styles.needle,
                  {
                    backgroundColor: rel?.aligned ? t.success : t.accent,
                    height: ringSize / 2 - spacing.xl,
                  },
                ]}
              />
              <View style={[styles.needleDot, { backgroundColor: t.ochre }]} />
            </Animated.View>
          </View>

          <AppText
            variant="bodyStrong"
            testID="qibla-status"
            style={[styles.status, rel?.aligned && { color: t.success }]}
          >
            {statusText ?? '—'}
          </AppText>
          {bearing !== null && (
            <AppText variant="caption" style={{ color: t.textSecondary }}>
              {tr('qibla.bearingLabel', { degrees: Math.round(bearing) })} · {location.label}
            </AppText>
          )}
        </View>

        <View style={styles.chips}>
          {heading !== null && !trueNorth && (
            <View
              style={[styles.chip, { backgroundColor: t.ochreSoft, borderStartColor: t.ochre }]}
              testID="magnetic-caveat"
            >
              <AppText variant="caption" style={{ color: t.ochre }}>
                {tr('qibla.magneticCaveat')}
              </AppText>
            </View>
          )}
          {heading !== null && accuracy <= 1 && (
            <View
              style={[styles.chip, { backgroundColor: t.ochreSoft, borderStartColor: t.ochre }]}
              testID="calibration-chip"
            >
              <AppText variant="caption" style={{ color: t.ochre }}>
                {tr('qibla.calibrate')}
              </AppText>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.m, paddingBottom: spacing.l },
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.m, padding: spacing.xxl },
  centerText: { textAlign: 'center' },
  primaryButton: {
    borderRadius: radius.card,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.l,
    marginTop: spacing.s,
    minHeight: 48,
    justifyContent: 'center',
  },
  header: { marginBottom: spacing.l },
  compassArea: { alignItems: 'center', gap: spacing.l, marginTop: spacing.xl },
  ring: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rose: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  north: { marginTop: spacing.s, fontFamily: fonts.sansSemiBold },
  needleWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  needle: {
    width: 4,
    borderRadius: 2,
    marginTop: spacing.xl,
  },
  needleDot: {
    position: 'absolute',
    top: spacing.xl - 6,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  status: { fontSize: fontSize.h2, lineHeight: 28 },
  chips: { alignItems: 'stretch', gap: spacing.s, marginTop: spacing.xl },
  chip: {
    borderRadius: radius.control,
    borderStartWidth: 3,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
  },
});
