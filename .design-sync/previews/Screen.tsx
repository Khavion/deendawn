import React from 'react';
import { View } from 'react-native';
import { AppText, Button, Screen, SectionRule, spacing } from 'deendawn';

/** The canvas-background screen container (safe-area aware on device). */
export function CanvasScreen() {
  return (
    <View style={{ height: 420, maxWidth: 360, borderRadius: 8, overflow: 'hidden' }}>
      <Screen style={{ padding: spacing.xl, gap: spacing.l }}>
        <AppText variant="title">Settings</AppText>
        <SectionRule label="PRAYER TIMES" />
        <AppText variant="body">
          Calculation method, Asr madhab, and high-latitude rules live here.
        </AppText>
        <Button title="Choose city" />
      </Screen>
    </View>
  );
}
