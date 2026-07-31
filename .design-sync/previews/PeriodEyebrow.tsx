import React from 'react';
import { View } from 'react-native';
import { PeriodEyebrow, spacing } from 'deendawn';

/** The prayer-period marker: gold diamond + eyebrow (font-independent, aniconism-safe). */
export function Periods() {
  return (
    <View style={{ padding: spacing.l, gap: spacing.m }}>
      <PeriodEyebrow label="FAJR · DAWN" />
      <PeriodEyebrow label="DHUHR · DAY" />
      <PeriodEyebrow label="MAGHRIB · DUSK" />
      <PeriodEyebrow label="ISHA · NIGHT" />
    </View>
  );
}
