import React from 'react';
import { View } from 'react-native';
import { Button, spacing } from 'deendawn';

const col = { gap: spacing.m, padding: spacing.l, maxWidth: 320 } as const;

/** Filled brand-primary button — the one main action per screen. */
export function Primary() {
  return (
    <View style={col}>
      <Button title="Choose city" />
    </View>
  );
}

/** Hairline-outline secondary action. */
export function Secondary() {
  return (
    <View style={col}>
      <Button title="Use my location" variant="secondary" />
    </View>
  );
}

/** Disabled state (50% opacity, still 48pt tap target). */
export function Disabled() {
  return (
    <View style={col}>
      <Button title="Enable notifications" disabled />
      <Button title="Skip for now" variant="secondary" disabled />
    </View>
  );
}

/** Labels wrap rather than truncate at large type sizes. */
export function LongLabel() {
  return (
    <View style={col}>
      <Button title="Open notification settings for adhan sounds" />
    </View>
  );
}
