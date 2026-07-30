import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { markOnboarded } from '../onboardingState';
import { ensurePermission, rescheduleAll } from '../../notifications/service';
import { CityPickerModal } from '../../prayer-times/components/CityPickerModal';
import { useSettings } from '../../settings/SettingsContext';
import { resolveLocation } from '../../settings/settingsStore';
import { AppText, Button } from '@/src/components/ui';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { measure, radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

type Step = 'welcome' | 'city' | 'notifications';

/** First-run CTAs ride the shared Button (press feedback + haptic included). */
function StepButton({
  label,
  onPress,
  subtle,
  testID,
}: {
  label: string;
  onPress: () => void;
  subtle?: boolean;
  testID: string;
}) {
  return (
    <Button
      title={label}
      variant={subtle ? 'secondary' : 'primary'}
      onPress={onPress}
      testID={testID}
    />
  );
}

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

  return (
    <View style={[styles.container, { backgroundColor: t.bgCanvas }]}>
      {/* Scrollable so 200% Dynamic Type never pushes the step button off-screen. */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        {step === 'welcome' && (
          <View style={styles.step} testID="step-welcome">
            <IconSymbol name="sun.max.fill" size={56} color={t.ochre} />
            <AppText variant="title" style={styles.center}>
              {tr('onboarding.welcomeTitle')}
            </AppText>
            <AppText variant="reading" style={[styles.center, { color: t.textSecondary }]}>
              {tr('onboarding.welcomeBody')}
            </AppText>
            <StepButton
              label={tr('onboarding.begin')}
              onPress={() => setStep('city')}
              testID="ob-begin"
            />
          </View>
        )}

        {step === 'city' && (
          <View style={styles.step} testID="step-city">
            <IconSymbol name="location.fill" size={56} color={t.accent} />
            <AppText variant="title" style={styles.center}>
              {tr('onboarding.cityTitle')}
            </AppText>
            <AppText variant="reading" style={[styles.center, { color: t.textSecondary }]}>
              {tr('onboarding.cityBody')}
            </AppText>
            <StepButton
              label={location ? location.label : tr('onboarding.chooseCity')}
              onPress={() => setPickerOpen(true)}
              testID="ob-city"
            />
            {location && (
              <StepButton
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
            <AppText variant="title" style={styles.center}>
              {tr('onboarding.notifTitle')}
            </AppText>
            <AppText variant="reading" style={[styles.center, { color: t.textSecondary }]}>
              {tr('onboarding.notifBody')}
            </AppText>
            <StepButton
              label={tr('onboarding.enableReminders')}
              onPress={() => void enableReminders()}
              testID="ob-reminders"
            />
            <StepButton label={tr('onboarding.skip')} onPress={finish} subtle testID="ob-skip" />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    maxWidth: measure.content,
    width: '100%',
    alignSelf: 'center',
  },
  step: { alignItems: 'center', gap: spacing.l },
  center: { textAlign: 'center' },
});
