import React from 'react';
import { View } from 'react-native';
import { SectionRule, spacing } from 'deendawn';

/** Eyebrow + illuminated gold hairline fading away from the label. */
export function TodaysTimes() {
  return (
    <View style={{ padding: spacing.l, maxWidth: 360 }}>
      <SectionRule label="TODAY'S TIMES" />
    </View>
  );
}

/** Works at any label length. */
export function LongLabel() {
  return (
    <View style={{ padding: spacing.l, maxWidth: 360 }}>
      <SectionRule label="VERSE OF THE DAY" />
    </View>
  );
}
