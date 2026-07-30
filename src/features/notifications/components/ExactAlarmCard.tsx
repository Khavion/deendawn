import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useExactAlarm } from '../useExactAlarm';
import { AppText, Button } from '@/src/components/ui';
import { spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

/**
 * "Make adhan times exact" — shown ONLY when Android's "Alarms & reminders"
 * special access exists and is denied (Android 14+ denies it by default for
 * new installs; 12/13 auto-grant, so most users never see this). Honest
 * framing: without the grant, adhans still fire but may drift a few minutes
 * under Doze. Never nags — one card, one button, a calm caveat.
 */
export function ExactAlarmCard() {
  const { showCard, openSettings } = useExactAlarm();
  const { t } = useTranslation();
  const tk = useTokens();

  if (!showCard) return null;

  return (
    <View
      testID="exact-alarm-card"
      style={[styles.card, { backgroundColor: tk.bgElevated, borderColor: tk.border }]}
    >
      <AppText variant="bodyStrong">{t('more.exactAlarmTitle')}</AppText>
      <AppText style={[styles.body, { color: tk.textSecondary }]}>
        {t('more.exactAlarmBody')}
      </AppText>
      <Button
        testID="exact-alarm-open-settings"
        title={t('more.exactAlarmButton')}
        onPress={() => void openSettings()}
      />
      <AppText variant="caption" style={[styles.caveat, { color: tk.textSecondary }]}>
        {t('more.exactAlarmCaveat')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.l,
    marginBottom: spacing.m,
    gap: spacing.s,
  },
  body: { marginBottom: spacing.xs },
  caveat: { marginTop: spacing.xs },
});
