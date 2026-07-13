import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { markOnboarded } from '../onboardingState';
import { ensurePermission, rescheduleAll } from '../../notifications/service';
import { CityPickerModal } from '../../prayer-times/components/CityPickerModal';
import { useSettings } from '../../settings/SettingsContext';
import { resolveLocation } from '../../settings/settingsStore';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

type Step = 'welcome' | 'city' | 'notifications';

export function OnboardingScreen() {
  const t = useTokens();
  const { t: tr } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings, update, store } = useSettings();
  const [step, setStep] = useState<Step>('welcome');
  const [pickerOpen, setPickerOpen] = useState(false);
  const location = resolveLocation(settings);

  const finish = () => {
    markOnboarded(store);
    router.replace('/(tabs)');
  };

  const enableReminders = async () => {
    await ensurePermission(true);
    void rescheduleAll(new Date(), store);
    finish();
  };

  const Button = ({
    label,
    onPress,
    subtle,
    testID,
  }: {
    label: string;
    onPress: () => void;
    subtle?: boolean;
    testID: string;
  }) => (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      style={[
        styles.button,
        subtle ? { borderColor: t.border, borderWidth: 1 } : { backgroundColor: t.accent },
      ]}
    >
      <ThemedText
        type="defaultSemiBold"
        style={{ color: subtle ? t.textSecondary : t.textOnAccent }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: t.bgCanvas,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
    >
      {step === 'welcome' && (
        <View style={styles.step} testID="step-welcome">
          <IconSymbol name="sun.max.fill" size={56} color={t.ochre} />
          <ThemedText type="title" style={styles.center}>
            {tr('onboarding.welcomeTitle')}
          </ThemedText>
          <ThemedText type="serifBody" style={[styles.center, { color: t.textSecondary }]}>
            {tr('onboarding.welcomeBody')}
          </ThemedText>
          <Button
            label={tr('onboarding.begin')}
            onPress={() => setStep('city')}
            testID="ob-begin"
          />
        </View>
      )}

      {step === 'city' && (
        <View style={styles.step} testID="step-city">
          <IconSymbol name="location.fill" size={56} color={t.accent} />
          <ThemedText type="title" style={styles.center}>
            {tr('onboarding.cityTitle')}
          </ThemedText>
          <ThemedText type="serifBody" style={[styles.center, { color: t.textSecondary }]}>
            {tr('onboarding.cityBody')}
          </ThemedText>
          <Button
            label={location ? location.label : tr('onboarding.chooseCity')}
            onPress={() => setPickerOpen(true)}
            testID="ob-city"
          />
          {location && (
            <Button
              label={tr('common.close')}
              onPress={() => setStep('notifications')}
              subtle
              testID="ob-city-next"
            />
          )}
          <CityPickerModal
            visible={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onSelect={(city) => {
              update({ location: { type: 'manual', cityId: city.id } });
              setPickerOpen(false);
              setStep('notifications');
            }}
          />
        </View>
      )}

      {step === 'notifications' && (
        <View style={styles.step} testID="step-notifications">
          <IconSymbol name="sun.max.fill" size={56} color={t.accent} />
          <ThemedText type="title" style={styles.center}>
            {tr('onboarding.notifTitle')}
          </ThemedText>
          <ThemedText type="serifBody" style={[styles.center, { color: t.textSecondary }]}>
            {tr('onboarding.notifBody')}
          </ThemedText>
          <Button
            label={tr('onboarding.enableReminders')}
            onPress={() => void enableReminders()}
            testID="ob-reminders"
          />
          <Button label={tr('onboarding.skip')} onPress={finish} subtle testID="ob-skip" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xxl, justifyContent: 'center' },
  step: { alignItems: 'center', gap: spacing.l },
  center: { textAlign: 'center' },
  button: {
    borderRadius: radius.card,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.l,
    minHeight: 48,
    minWidth: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
