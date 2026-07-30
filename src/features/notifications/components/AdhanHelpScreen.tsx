import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { ExactAlarmCard } from './ExactAlarmCard';
import { AppText, Button, SectionRule } from '@/src/components/ui';
import { spacing } from '@/src/lib/theme/tokens';
import { useScrollInsets } from '@/src/lib/theme/useScrollInsets';
import { useTokens } from '@/src/lib/theme/useTokens';

/**
 * "Adhan not playing?" — honest Android troubleshooting. Every path here is
 * permission-free: the battery item deep-links to the SYSTEM battery-
 * optimization LIST (never the per-app exemption prompt, which is a
 * Play-sensitive surface), and OEM steps are plain-language instructions.
 */
export function AdhanHelpScreen() {
  const t = useTokens();
  const androidInsets = useScrollInsets({ top: false, bottom: 'nav', baseBottom: spacing.l });
  const { t: tr } = useTranslation();

  const openBatterySettings = async () => {
    if (Platform.OS !== 'android') return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- android-only lazy
    const IntentLauncher = require('expo-intent-launcher');
    await IntentLauncher.startActivityAsync(
      'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS'
    );
  };

  return (
    <ScrollView
      style={{ backgroundColor: t.bgCanvas }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.scroll, androidInsets]}
    >
      <Stack.Screen options={{ title: tr('adhanHelp.title') }} />
      <AppText style={[styles.lead, { color: t.textSecondary }]}>{tr('adhanHelp.lead')}</AppText>

      <SectionRule label={tr('adhanHelp.volumeTitle')} style={styles.rule} />
      <AppText style={styles.body}>{tr('adhanHelp.volumeBody')}</AppText>

      <SectionRule label={tr('adhanHelp.exactTitle')} style={styles.rule} />
      <AppText style={styles.body}>{tr('adhanHelp.exactBody')}</AppText>
      <ExactAlarmCard />

      <SectionRule label={tr('adhanHelp.batteryTitle')} style={styles.rule} />
      <AppText style={styles.body}>{tr('adhanHelp.batteryBody')}</AppText>
      <View style={styles.buttonRow}>
        <Button
          testID="open-battery-settings"
          variant="secondary"
          title={tr('adhanHelp.batteryButton')}
          onPress={() => void openBatterySettings()}
        />
      </View>

      <SectionRule label={tr('adhanHelp.oemTitle')} style={styles.rule} />
      <AppText style={styles.body}>{tr('adhanHelp.oemBody')}</AppText>
      <AppText style={[styles.body, { color: t.textSecondary }]}>
        {tr('adhanHelp.oemSamsung')}
      </AppText>
      <AppText style={[styles.body, { color: t.textSecondary }]}>
        {tr('adhanHelp.oemXiaomi')}
      </AppText>

      <AppText variant="caption" style={[styles.footer, { color: t.textSecondary }]}>
        {tr('adhanHelp.footer')}
      </AppText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, paddingBottom: spacing.l },
  lead: { marginBottom: spacing.m },
  rule: { marginTop: spacing.l, marginBottom: spacing.s },
  body: { marginBottom: spacing.s },
  buttonRow: { marginTop: spacing.xs, marginBottom: spacing.s },
  footer: { marginTop: spacing.xl },
});
