/* eslint-disable react/jsx-no-literals -- dev-only design preview; labels are not user-facing i18n copy */
import { Stack } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Divider, Screen } from '@/src/components/ui';
import { useTheme, type ThemePref } from '@/src/lib/theme/ThemeProvider';
import { ColorTokens, palette, radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

/**
 * DEV-ONLY design-system preview. Not linked from any navigation; reachable by
 * route only, and renders nothing in production. Flip the theme at the top to
 * review every token + component in light / dark / night-warm on an SE viewport.
 */
export default function ThemePreviewRoute() {
  if (!__DEV__) return null;
  // Uses the ROOT <AppThemeProvider> (from _layout) so the theme switcher drives
  // the whole app — nav chrome included — not just this screen.
  return (
    <Screen noSafeArea>
      <Stack.Screen options={{ title: 'Theme preview' }} />
      <Preview />
    </Screen>
  );
}

const PREFS: ThemePref[] = ['system', 'light', 'dark', 'nightWarm'];
const TOKEN_KEYS: (keyof ColorTokens)[] = [
  'bgCanvas',
  'bgSurface',
  'bgElevated',
  'textPrimary',
  'textSecondary',
  'accent',
  'accentSoft',
  'ochre',
  'ochreSoft',
  'success',
  'border',
  'icon',
];

function Preview() {
  const t = useTokens();
  const { pref, setPref } = useTheme();

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <AppText variant="eyebrow" style={styles.gap}>
        Khavion · Design system
      </AppText>
      <AppText variant="display">
        Deen <AppText variant="displayAccent">Dawn</AppText>
      </AppText>

      {/* Theme switcher */}
      <View style={styles.row}>
        {PREFS.map((p) => (
          <Button
            key={p}
            title={p}
            variant={pref === p ? 'primary' : 'secondary'}
            onPress={() => setPref(p)}
          />
        ))}
      </View>

      <Section label="Type scale">
        <AppText variant="display">Display 32</AppText>
        <AppText variant="title">Title 22</AppText>
        <AppText variant="body">Body 16 — Public Sans, the reading and UI face.</AppText>
        <AppText variant="eyebrow">Eyebrow · label</AppText>
        <AppText variant="caption">Caption 13, muted supporting text.</AppText>
      </Section>

      <Section label="Buttons">
        <Button title="Primary" onPress={() => {}} />
        <Button title="Secondary" variant="secondary" onPress={() => {}} />
        <Button title="Disabled" onPress={() => {}} disabled />
      </Section>

      <Section label="Card + Divider">
        <Card>
          <AppText variant="title">Card</AppText>
          <AppText variant="body">Surface with a hairline border, radius 8.</AppText>
          <Divider style={styles.gap} />
          <AppText variant="caption">Below the divider.</AppText>
        </Card>
      </Section>

      <Section label={`Color tokens · ${pref}`}>
        {TOKEN_KEYS.map((k) => (
          <View key={k} style={styles.swatchRow}>
            <View style={[styles.swatch, { backgroundColor: t[k], borderColor: t.border }]} />
            <AppText variant="body" style={styles.swatchName}>
              {k}
            </AppText>
            <AppText variant="caption">{t[k]}</AppText>
          </View>
        ))}
      </Section>

      <Section label="All palettes (side by side)">
        <View style={styles.row}>
          {(['light', 'dark', 'nightWarm'] as const).map((mode) => (
            <View key={mode} style={styles.paletteCol}>
              <AppText variant="caption">{mode}</AppText>
              {(['bgCanvas', 'accent', 'ochre', 'textPrimary'] as const).map((k) => (
                <View key={k} style={[styles.paletteChip, { backgroundColor: palette[mode][k] }]} />
              ))}
            </View>
          ))}
        </View>
      </Section>

      <AppText variant="caption" style={styles.note}>
        Arabic stack (Amiri Quran / Noto Nastaliq) is unchanged and rendered by the Quran/Urdu
        components, not shown here.
      </AppText>
    </ScrollView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="eyebrow" style={styles.gap}>
        {label}
      </AppText>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, gap: spacing.l, paddingBottom: spacing.xxxl },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s },
  gap: { marginTop: spacing.s },
  section: { gap: spacing.s },
  sectionBody: { gap: spacing.s },
  swatchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.m },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
  },
  swatchName: { flex: 1 },
  paletteCol: { gap: spacing.xs, alignItems: 'center' },
  paletteChip: { width: 44, height: 20, borderRadius: 4 },
  note: { marginTop: spacing.l, opacity: 0.7 },
});
