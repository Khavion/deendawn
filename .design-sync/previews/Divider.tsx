import React from 'react';
import { View } from 'react-native';
import { AppText, Divider, palette, spacing } from 'deendawn';

/** Hairline rule between content blocks. */
export function BetweenBlocks() {
  return (
    <View style={{ padding: spacing.l, maxWidth: 360, gap: spacing.l }}>
      <AppText variant="body">Prayer times are calculated on your phone.</AppText>
      <Divider />
      <AppText variant="body" color={palette.light.textSecondary}>
        Nothing is sent anywhere — the app works fully offline.
      </AppText>
    </View>
  );
}
