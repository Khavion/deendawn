import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { qiblaBearing, relativeQibla } from '../bearing';
import { useHeading } from '../useHeading';
import { CityPickerModal } from '../../prayer-times/components/CityPickerModal';
import { useSettings } from '../../settings/SettingsContext';
import { resolveLocation } from '../../settings/settingsStore';
import { AppText } from '@/src/components/ui';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { fonts, fontSize, radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

const RING_SIZE = 280;

export function QiblaScreen() {
  const insets = useSafeAreaInsets();
  const t = useTokens();
  const { t: tr } = useTranslation();
  const { settings, update } = useSettings();
  const [pickerOpen, setPickerOpen] = useState(false);
  const location = resolveLocation(settings);
  const { heading, trueNorth, accuracy, permission, requestPermission } = useHeading();

  const bearing = useMemo(
    () => (location ? qiblaBearing(location) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location?.latitude, location?.longitude]
  );

  const rel = bearing !== null && heading !== null ? relativeQibla(bearing, heading) : null;

  // Haptics: edge-triggered tick on entering the ±3° window; one Success per mount.
  const wasAligned = useRef(false);
  const celebrated = useRef(false);
  useEffect(() => {
    if (!rel) return;
    if (rel.aligned && !wasAligned.current) {
      void Haptics.selectionAsync();
      if (!celebrated.current) {
        celebrated.current = true;
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        <Pressable
          accessibilityRole="button"
          testID="qibla-choose-city"
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
        <Pressable
          accessibilityRole="button"
          testID="qibla-grant"
          onPress={requestPermission}
          style={[styles.primaryButton, { backgroundColor: t.accent }]}
        >
          <AppText variant="bodyStrong" style={{ color: t.textOnAccent }}>
            {tr('qibla.grantPermission')}
          </AppText>
        </Pressable>
      </View>
    );
  }

  const needleRotation = rel ? rel.turn : 0;
  const roseRotation = heading !== null ? -heading : 0;
  const statusText = rel
    ? rel.aligned
      ? tr('qibla.aligned')
      : rel.direction === 'right'
        ? tr('qibla.turnRight', { degrees: Math.round(Math.abs(rel.turn)) })
        : tr('qibla.turnLeft', { degrees: Math.round(Math.abs(rel.turn)) })
    : undefined;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: t.bgCanvas, paddingTop: insets.top + spacing.m },
      ]}
    >
      <AppText variant="title" style={styles.header}>
        {tr('qibla.title')}
      </AppText>

      <View style={styles.compassArea} accessible accessibilityLabel={statusText} testID="compass">
        <View
          style={[
            styles.ring,
            { borderColor: rel?.aligned ? t.success : t.border },
            rel?.aligned && { backgroundColor: t.accentSoft },
          ]}
        >
          {/* Compass rose: N marker rotates opposite the device heading. */}
          <View style={[styles.rose, { transform: [{ rotate: `${roseRotation}deg` }] }]}>
            <AppText variant="caption" style={[styles.north, { color: t.textSecondary }]}>
              {tr('qibla.northMarker')}
            </AppText>
          </View>
          {/* Needle points toward the qibla relative to the device. */}
          <View
            testID="needle"
            style={[styles.needleWrap, { transform: [{ rotate: `${needleRotation}deg` }] }]}
          >
            <View
              style={[styles.needle, { backgroundColor: rel?.aligned ? t.success : t.accent }]}
            />
            <View style={[styles.needleDot, { backgroundColor: t.ochre }]} />
          </View>
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
          <View style={[styles.chip, { backgroundColor: t.ochreSoft }]} testID="magnetic-caveat">
            <AppText variant="caption" style={{ color: t.ochre }}>
              {tr('qibla.magneticCaveat')}
            </AppText>
          </View>
        )}
        {heading !== null && accuracy <= 1 && (
          <View style={[styles.chip, { backgroundColor: t.ochreSoft }]} testID="calibration-chip">
            <AppText variant="caption" style={{ color: t.ochre }}>
              {tr('qibla.calibrate')}
            </AppText>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.xl },
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
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rose: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  north: { marginTop: spacing.s, fontFamily: fonts.sansSemiBold },
  needleWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  needle: {
    width: 4,
    height: RING_SIZE / 2 - spacing.xl,
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
  chips: { alignItems: 'center', gap: spacing.s, marginTop: spacing.xl },
  chip: {
    borderRadius: radius.control,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
  },
});
