import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, ScrollView, StyleSheet, View } from 'react-native';
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  alignedWithHysteresis,
  compassPoint,
  distanceToKaabaKm,
  qiblaBearing,
  relativeQibla,
} from '../bearing';
import { useHeading } from '../useHeading';
import { CityPickerModal } from '../../prayer-times/components/CityPickerModal';
import { useSettings } from '../../settings/SettingsContext';
import { resolveLocation } from '../../settings/settingsStore';
import { AppPressable, AppText, CompassDial, Marker } from '@/src/components/ui';
import { digitLocale, localizeNumber } from '@/src/lib/i18n/format';
import { useHaptics } from '@/src/lib/haptics';
import { celebration, radius, spacing } from '@/src/lib/theme/tokens';
import { useScrollInsets } from '@/src/lib/theme/useScrollInsets';
import { useTokens } from '@/src/lib/theme/useTokens';
import { useLayout } from '@/src/lib/theme/useLayout';
import { useDeviceTier } from '@/src/lib/theme/useDeviceTier';

const RING_SIZE = 292;

export function QiblaScreen() {
  const insets = useSafeAreaInsets();
  const { wide } = useLayout();
  // The dial scales up on tablet-class widths.
  const ringSize = wide ? 360 : RING_SIZE;
  const t = useTokens();
  // top:true — unlike the other tab screens, Qibla's MAIN state has no
  // insets.top container padding (only its empty/permission branches do).
  const androidInsets = useScrollInsets({
    top: true,
    bottom: 'tabs',
    baseTop: spacing.m,
    baseBottom: spacing.l,
  });
  const { flat } = useDeviceTier();
  const h = useHaptics();
  const { t: tr, i18n } = useTranslation();
  const { settings, update } = useSettings();
  const [pickerOpen, setPickerOpen] = useState(false);
  const location = resolveLocation(settings);
  // Rotation lives on the UI thread at full sensor rate (Reanimated shared
  // values) — React state below only updates at the hook's throttled cadence
  // for logic (alignment styling, chips, haptics). Values are direct
  // assignments, not springs: the rose TRACKS the sensor (functional
  // motion), so Reduce Motion needs no special casing here.
  const roseSv = useSharedValue(0);
  const { heading, trueNorth, accuracy, permission, available, requestPermission } = useHeading(
    (deg) => {
      roseSv.value = -deg;
    }
  );
  const roseStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${roseSv.value}deg` }],
  }));

  const bearing = useMemo(
    () => (location ? qiblaBearing(location) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location?.latitude, location?.longitude]
  );
  const distanceKm = useMemo(
    () => (location ? Math.round(distanceToKaabaKm(location) / 10) * 10 : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location?.latitude, location?.longitude]
  );

  const rel = bearing !== null && heading !== null ? relativeQibla(bearing, heading) : null;

  // Alignment with hysteresis (handoff gap 17): enter ±3°, exit past ±5° —
  // the celebration cannot flutter, and the single detent re-arms only after
  // a real departure.
  const [aligned, setAligned] = useState(false);
  useEffect(() => {
    if (!rel) {
      setAligned(false);
      return;
    }
    setAligned((prev) => alignedWithHysteresis(prev, rel.turn));
  }, [rel?.turn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Celebration grammar (§2): exactly ONE detent on entering alignment.
  const wasAligned = useRef(false);
  useEffect(() => {
    if (aligned && !wasAligned.current) {
      h.detent();
      AccessibilityInfo.announceForAccessibility(tr('qibla.alignedAnnounce'));
    }
    wasAligned.current = aligned;
  }, [aligned]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!location) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: t.bgCanvas, paddingTop: insets.top },
        ]}
      >
        <Marker size={12} tone="ochre" />
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
        <Marker size={12} tone="ochre" />
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

  const noSensor = available === false;
  const guidance = noSensor
    ? tr('qibla.noCompassTitle')
    : rel
      ? aligned
        ? tr('qibla.facingFull')
        : rel.direction === 'right'
          ? tr('qibla.turnGentleRight')
          : tr('qibla.turnGentleLeft')
      : tr('qibla.calibrate');
  const guidanceCaption = noSensor
    ? null
    : rel
      ? aligned
        ? tr('qibla.holdSteady')
        : tr('qibla.toGo', { degrees: localizeNumber(Math.round(Math.abs(rel.turn)), i18n.language) })
      : null;

  const cardinals = {
    north: tr('qibla.northMarker'),
    east: tr('qibla.eastMarker'),
    south: tr('qibla.southMarker'),
    west: tr('qibla.westMarker'),
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bgCanvas }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.scrollContent, androidInsets]}
      >
        <View style={styles.header}>
          <AppText variant="subtitle">{tr('qibla.title')}</AppText>
          {bearing !== null && distanceKm !== null && (
            <AppText variant="caption" style={{ color: t.textSecondary }}>
              {tr('qibla.routeLine', {
                city: location.label,
                distance: new Intl.NumberFormat(digitLocale(i18n.language)).format(distanceKm),
              })}
            </AppText>
          )}
        </View>

        <View
          style={styles.compassArea}
          accessible
          accessibilityLabel={guidance}
          testID="compass"
        >
          {/* Radial bloom behind the dial while aligned (celebration token). */}
          {aligned && !flat && (
            <View
              pointerEvents="none"
              style={[
                styles.bloom,
                {
                  width: celebration.bloomSize,
                  height: celebration.bloomSize,
                  borderRadius: celebration.bloomSize / 2,
                  backgroundColor: celebration.bloomColor,
                },
              ]}
            />
          )}
          {bearing !== null && (
            <CompassDial
              size={ringSize}
              heading={heading}
              bearing={bearing}
              aligned={aligned}
              noSensor={noSensor}
              roseAnimatedStyle={noSensor ? undefined : roseStyle}
              cardinals={cardinals}
              testID="dial"
            >
              {noSensor ? (
                <AppText variant="display" color={t.ochre} testID="qibla-bearing-big">
                  {localizeNumber(Math.round(bearing), i18n.language)}°
                </AppText>
              ) : (
                <>
                  <AppText variant="title" testID="qibla-heading">
                    {heading !== null ? `${localizeNumber(Math.round(heading), i18n.language)}°` : '·'}
                  </AppText>
                  <AppText
                    variant="caption"
                    color={aligned ? t.ochre : t.textSecondary}
                    testID="qibla-center-caption"
                  >
                    {aligned
                      ? tr('qibla.facing')
                      : tr('qibla.bearingAt', {
                          degrees: localizeNumber(Math.round(bearing), i18n.language),
                        })}
                  </AppText>
                </>
              )}
            </CompassDial>
          )}

          {/* The no-compass card below carries its own title — no status echo. */}
          {!noSensor && (
            <AppText
              variant="bodyStrong"
              testID="qibla-status"
              style={[styles.status, aligned && { color: t.success }]}
            >
              {guidance}
            </AppText>
          )}
          {guidanceCaption && (
            <AppText variant="caption" style={{ color: t.textSecondary }}>
              {guidanceCaption}
            </AppText>
          )}
        </View>

        {noSensor && bearing !== null && (
          <View
            style={[styles.noCompassCard, { backgroundColor: t.bgSurface, borderColor: t.border }]}
            testID="no-compass-card"
          >
            <AppText variant="bodyStrong">{tr('qibla.noCompassTitle')}</AppText>
            <AppText variant="reading" style={{ color: t.textSecondary }}>
              {tr('qibla.noCompassGuide', {
                degrees: localizeNumber(Math.round(bearing), i18n.language),
                point: tr(`qibla.points.${compassPoint(bearing)}`),
              })}
            </AppText>
          </View>
        )}

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
                {accuracy <= 0 ? tr('qibla.interference') : tr('qibla.calibrate')}
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
  header: { marginBottom: spacing.l, gap: spacing.xs },
  compassArea: { alignItems: 'center', gap: spacing.l, marginTop: spacing.xl },
  bloom: { position: 'absolute', alignSelf: 'center', top: -spacing.xxl },
  status: { textAlign: 'center' },
  noCompassCard: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.l,
    gap: spacing.s,
    marginTop: spacing.xl,
  },
  chips: { alignItems: 'stretch', gap: spacing.s, marginTop: spacing.xl },
  chip: {
    borderRadius: radius.control,
    borderStartWidth: 3,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
  },
});
