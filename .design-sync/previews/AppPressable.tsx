import React from 'react';
import { View } from 'react-native';
import { AppPressable, AppText, Card, palette, spacing } from 'deendawn';

/** The one interactive primitive — rows and tappables ride it (press dim + haptic verb). */
export function TappableRow() {
  return (
    <View style={{ padding: spacing.l, maxWidth: 360 }}>
      <Card style={{ padding: 0 }}>
        <AppPressable
          haptic="press"
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: spacing.l,
          }}
        >
          <AppText variant="body">Calculation method</AppText>
          <AppText variant="body" color={palette.light.textSecondary}>
            Automatic
          </AppText>
        </AppPressable>
      </Card>
    </View>
  );
}

/** A tappable chip with the selection haptic verb. */
export function SelectChip() {
  return (
    <View style={{ padding: spacing.l, flexDirection: 'row', gap: spacing.s }}>
      <AppPressable
        haptic="select"
        style={{
          backgroundColor: palette.light.accentSoft,
          borderRadius: 6,
          paddingHorizontal: spacing.l,
          paddingVertical: spacing.s,
        }}
      >
        <AppText variant="bodyStrong" color={palette.light.textOnAccentSoft}>
          33
        </AppText>
      </AppPressable>
      <AppPressable
        haptic="select"
        style={{
          borderWidth: 1,
          borderColor: palette.light.border,
          borderRadius: 6,
          paddingHorizontal: spacing.l,
          paddingVertical: spacing.s,
        }}
      >
        <AppText variant="body">99</AppText>
      </AppPressable>
    </View>
  );
}
