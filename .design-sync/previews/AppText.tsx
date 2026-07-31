import React from 'react';
import { View } from 'react-native';
import { AppText, palette, spacing } from 'deendawn';

const col = { gap: spacing.s, padding: spacing.l } as const;

/** The full Latin type scale — Newsreader display serif over Public Sans UI. */
export function TypeScale() {
  return (
    <View style={col}>
      <AppText variant="display">Deen Dawn</AppText>
      <AppText variant="displayAccent">rooted in stillness</AppText>
      <AppText variant="title">Next Prayer</AppText>
      <AppText variant="subtitle">Today&apos;s Times</AppText>
      <AppText variant="body">Maghrib arrives at sunset, 8:16 PM in Houston.</AppText>
      <AppText variant="bodyStrong">Asr · 5:04 PM</AppText>
      <AppText variant="caption">Calculated — may differ from local moonsighting</AppText>
      <AppText variant="eyebrow">TODAY&apos;S TIMES</AppText>
      <AppText variant="link">View attribution</AppText>
    </View>
  );
}

/** Reading prose in the serif reading voice. */
export function Reading() {
  return (
    <View style={[col, { maxWidth: 420 }]}>
      <AppText variant="reading">
        The reader sets long-form passages in a generous serif with open leading, tuned for
        unhurried reading at dawn — no glare, no clutter, the text simply breathes.
      </AppText>
    </View>
  );
}

/** Token-driven color overrides. */
export function Colors() {
  const t = palette.light;
  return (
    <View style={col}>
      <AppText variant="bodyStrong" color={t.accent}>
        Forest green — the brand primary
      </AppText>
      <AppText variant="bodyStrong" color={t.ochre}>
        Bronze gold — the accent voice
      </AppText>
      <AppText variant="body" color={t.textSecondary}>
        Secondary text for supporting detail
      </AppText>
    </View>
  );
}
