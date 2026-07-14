import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';
import attribution from '@/assets/attribution.json';

interface Artifact {
  id: string;
  kind: string;
  attribution: string;
  license: string;
  url: string;
  devOnly?: boolean;
}

/**
 * About: version, the attribution manifest the content pipeline generates
 * (Tanzil REQUIRES visible attribution), and the local privacy promise.
 */
export function AboutScreen() {
  const t = useTokens();
  const { t: tr } = useTranslation();
  const artifacts = attribution.artifacts as Artifact[];
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={[styles.container, { backgroundColor: t.bgCanvas }]}>
      <Stack.Screen options={{ title: tr('about.title') }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedText type="title">Deen Dawn</ThemedText>
        <ThemedText type="caption" style={{ color: t.textSecondary }}>
          {tr('about.version', { version })}
        </ThemedText>
        <ThemedText type="caption" style={{ color: t.textSecondary }}>
          {tr('about.publisher')}
        </ThemedText>

        <View style={[styles.card, { backgroundColor: t.accentSoft }]}>
          <ThemedText type="defaultSemiBold" style={{ color: t.textOnAccentSoft }}>
            {tr('about.privacyTitle')}
          </ThemedText>
          <ThemedText type="serifBody" style={{ color: t.textOnAccentSoft }}>
            {tr('about.privacyBody')}
          </ThemedText>
        </View>

        <ThemedText type="subtitle" style={styles.section}>
          {tr('about.sources')}
        </ThemedText>
        {artifacts.map((a) => (
          <View key={a.id} style={[styles.sourceRow, { borderBottomColor: t.border }]}>
            <ThemedText type="serifBody">{a.attribution}</ThemedText>
            <ThemedText type="caption" style={{ color: t.textSecondary }}>
              {a.license}
            </ThemedText>
            {a.devOnly && (
              <ThemedText type="caption" style={{ color: t.ochre }}>
                {tr('about.devOnly')}
              </ThemedText>
            )}
          </View>
        ))}

        <ThemedText type="caption" style={[styles.footer, { color: t.textSecondary }]}>
          {tr('about.madeWith')}
        </ThemedText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.xs },
  card: { borderRadius: radius.card, padding: spacing.l, gap: spacing.s, marginTop: spacing.l },
  section: { marginTop: spacing.xl, marginBottom: spacing.s },
  sourceRow: {
    paddingVertical: spacing.m,
    gap: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  footer: { textAlign: 'center', marginTop: spacing.xl },
});
