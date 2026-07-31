import { useRouter } from 'expo-router';
import * as Localization from 'expo-localization';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { markOnboarded } from '../onboardingState';
import { ensurePermission, rescheduleAll } from '../../notifications/service';
import { DEFAULT_NOTIFICATION_PREFS } from '../../notifications/scheduler';
import { saveNotificationPrefs } from '../../notifications/prefsStore';
import { CityPickerModal } from '../../prayer-times/components/CityPickerModal';
import { computeDayTimes, isValidTime } from '../../prayer-times/engine';
import { formatTimeInZone } from '../../prayer-times/format';
import { defaultMethodForLocale, METHOD_LABELS } from '../../prayer-times/methods';
import { METHOD_KEYS, type MethodKey, PRAYER_NAMES } from '../../prayer-times/types';
import { useSettings } from '../../settings/SettingsContext';
import { resolveLocation, resolvePrayerConfig } from '../../settings/settingsStore';
import {
  AppPressable,
  AppText,
  BrandMark,
  Button,
  Card,
  PeriodEyebrow,
  RadioRow,
  SectionRule,
  Sheet,
} from '@/src/components/ui';
import { digitLocale, localizeNumber } from '@/src/lib/i18n/format';
import { measure, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

type Step = 'welcome' | 'city' | 'notifications';
type AdhanChoice = 'adhan' | 'chime' | 'none';

const ADHAN_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

/**
 * Onboarding (handoff §6 screen 06): three value-first steps — the dawn-arc
 * intro, city + method with a live times preview, and an honest notification
 * ask that attributes the system dialog to the system. Copy verbatim §7
 * (except "full recitation" → the honest clip wording; DECISIONS). City
 * entry is manual (privacy-first; a GPS-once flow is a logged follow-up —
 * manual entry is the constitutional baseline).
 */
export function OnboardingScreen() {
  const t = useTokens();
  const { t: tr, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings, update, store } = useSettings();
  const [step, setStep] = useState<Step>('welcome');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [methodsOpen, setMethodsOpen] = useState(false);
  const [adhanChoice, setAdhanChoice] = useState<AdhanChoice>('adhan');
  const location = resolveLocation(settings);
  const timeLocale = digitLocale(i18n.language);

  const localeTag = Localization.getLocales()[0]?.languageTag ?? null;
  const suggested = useMemo(() => defaultMethodForLocale(localeTag), [localeTag]);
  const regionCode = (localeTag ?? '')
    .split('-')
    .find((p) => p.length === 2 && /^[A-Za-z]{2}$/.test(p));
  const regionName = useMemo(() => {
    try {
      return regionCode
        ? new Intl.DisplayNames([i18n.language], { type: 'region' }).of(regionCode.toUpperCase())
        : null;
    } catch {
      return null;
    }
  }, [regionCode, i18n.language]);

  const chosenMethod: MethodKey | 'auto' = settings.method;
  const effectiveMethod: MethodKey = chosenMethod === 'auto' ? suggested : chosenMethod;

  // Live preview recomputes on city/method change (§6 step 2).
  const preview = useMemo(() => {
    if (!location) return null;
    const config = resolvePrayerConfig(settings, localeTag);
    return computeDayTimes(location, new Date(), config);
  }, [location, settings, localeTag]);

  const finish = () => {
    markOnboarded(store);
    router.replace('/(tabs)');
  };

  const applyNotificationChoice = async () => {
    if (adhanChoice === 'none') {
      saveNotificationPrefs(store, {
        ...DEFAULT_NOTIFICATION_PREFS,
        enabled: Object.fromEntries(
          ADHAN_PRAYERS.map((p) => [p, false])
        ) as (typeof DEFAULT_NOTIFICATION_PREFS)['enabled'],
      });
      finish();
      return;
    }
    const sound = adhanChoice === 'adhan' ? 'clip' : 'default';
    saveNotificationPrefs(store, {
      enabled: Object.fromEntries(
        ADHAN_PRAYERS.map((p) => [p, true])
      ) as (typeof DEFAULT_NOTIFICATION_PREFS)['enabled'],
      sound: Object.fromEntries(
        ADHAN_PRAYERS.map((p) => [p, sound])
      ) as (typeof DEFAULT_NOTIFICATION_PREFS)['sound'],
    });
    await ensurePermission(true);
    void rescheduleAll(new Date(), store);
    finish();
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bgCanvas }]}>
      {/* Scrollable so 200% Dynamic Type never pushes the step button off-screen. */}
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'welcome' && (
          <View style={styles.stepBody} testID="step-welcome">
            <BrandMark testID="brand-mark" />
            <View style={styles.brandRow}>
              <AppText variant="display">{tr('onboarding.brandDeen')}</AppText>
              <AppText variant="displayAccent">{tr('onboarding.brandDawn')}</AppText>
            </View>
            <AppText variant="reading" color={t.textSecondary} style={styles.centered}>
              {tr('onboarding.intro')}
            </AppText>
            <View style={styles.actions}>
              <Button
                title={tr('onboarding.begin')}
                testID="ob-begin"
                onPress={() => setStep('city')}
              />
              <AppText variant="caption" color={t.textSecondary} style={styles.centered}>
                {tr('onboarding.underMinute')}
              </AppText>
            </View>
          </View>
        )}

        {step === 'city' && (
          <View style={styles.stepColumn} testID="step-city">
            <PeriodEyebrow
              label={tr('onboarding.stepOf', {
                n: localizeNumber(2, i18n.language),
                total: localizeNumber(3, i18n.language),
              })}
            />
            <AppText variant="title">{tr('onboarding.whereTitle')}</AppText>
            <AppText variant="reading" color={t.textSecondary}>
              {tr('onboarding.wherePrivacy')}
            </AppText>

            <Card>
              <View style={styles.cityRow}>
                <View style={styles.cityText}>
                  <AppText variant="bodyStrong" testID="ob-city-label">
                    {location ? location.label : tr('today.chooseCity')}
                  </AppText>
                  <AppText variant="caption" color={t.textSecondary}>
                    {tr('onboarding.changeableAnyTime')}
                  </AppText>
                </View>
                <AppPressable
                  accessibilityRole="button"
                  testID="ob-city"
                  hitSlop={8}
                  onPress={() => setPickerOpen(true)}
                >
                  <AppText variant="link">{tr('onboarding.change')}</AppText>
                </AppPressable>
              </View>
            </Card>

            <RadioRow
              label={METHOD_LABELS[suggested]}
              sub={
                regionName
                  ? tr('onboarding.suggestedFor', { region: regionName })
                  : tr('more.methodAutoRegion')
              }
              selected={chosenMethod === 'auto' || effectiveMethod === suggested}
              onPress={() => update({ method: 'auto' })}
              testID="ob-method-suggested"
            />
            {suggested !== 'MuslimWorldLeague' && (
              <RadioRow
                label={METHOD_LABELS.MuslimWorldLeague}
                sub={tr('onboarding.changeableAnyTime')}
                selected={chosenMethod === 'MuslimWorldLeague'}
                onPress={() => update({ method: 'MuslimWorldLeague' })}
                testID="ob-method-mwl"
              />
            )}
            <AppPressable
              accessibilityRole="button"
              testID="ob-more-methods"
              hitSlop={8}
              onPress={() => setMethodsOpen(true)}
              style={styles.moreMethods}
            >
              <AppText variant="link">{tr('onboarding.moreMethods')}</AppText>
            </AppPressable>

            {location && preview && (
              <>
                <SectionRule
                  label={tr('onboarding.todayIn', { city: location.label })}
                  style={styles.previewRule}
                />
                <Card testID="ob-preview">
                  <View style={styles.previewRow}>
                    {PRAYER_NAMES.filter((p) => p !== 'sunrise').map((p) => (
                      <View key={p} style={styles.previewCol}>
                        <AppText variant="caption" color={t.textSecondary} numberOfLines={1}>
                          {tr(`prayers.${p}`)}
                        </AppText>
                        <AppText variant="bodyStrong" style={styles.previewTime} numberOfLines={1}>
                          {isValidTime(preview[p])
                            ? formatTimeInZone(preview[p], { locale: timeLocale })
                            : '—'}
                        </AppText>
                      </View>
                    ))}
                  </View>
                </Card>
              </>
            )}

            <View style={styles.actions}>
              <Button
                title={tr('onboarding.continue')}
                testID="ob-city-next"
                onPress={() => setStep('notifications')}
                disabled={!location}
              />
              <AppPressable
                accessibilityRole="button"
                testID="ob-back-1"
                hitSlop={8}
                onPress={() => setStep('welcome')}
              >
                <AppText variant="caption" color={t.textSecondary} style={styles.centered}>
                  {tr('onboarding.back')}
                </AppText>
              </AppPressable>
            </View>
          </View>
        )}

        {step === 'notifications' && (
          <View style={styles.stepColumn} testID="step-notifications">
            <PeriodEyebrow
              label={tr('onboarding.stepOf', {
                n: localizeNumber(3, i18n.language),
                total: localizeNumber(3, i18n.language),
              })}
            />
            <AppText variant="title">{tr('onboarding.adhanTitle')}</AppText>
            <AppText variant="reading" color={t.textSecondary}>
              {tr('onboarding.adhanBody')}
            </AppText>

            <RadioRow
              label={tr('onboarding.optionAdhan')}
              sub={tr('onboarding.optionAdhanSub')}
              selected={adhanChoice === 'adhan'}
              onPress={() => setAdhanChoice('adhan')}
              testID="ob-reminders"
            />
            <RadioRow
              label={tr('onboarding.optionChime')}
              selected={adhanChoice === 'chime'}
              onPress={() => setAdhanChoice('chime')}
              testID="ob-chime"
            />
            <RadioRow
              label={tr('onboarding.optionNone')}
              selected={adhanChoice === 'none'}
              onPress={() => setAdhanChoice('none')}
              testID="ob-skip"
            />

            <AppText variant="caption" color={t.textSecondary}>
              {tr('onboarding.systemDialog')}
            </AppText>

            <View style={styles.actions}>
              <Button
                title={tr('onboarding.finishToday')}
                testID="ob-finish"
                onPress={() => void applyNotificationChoice()}
              />
              <AppPressable
                accessibilityRole="button"
                testID="ob-back-2"
                hitSlop={8}
                onPress={() => setStep('city')}
              >
                <AppText variant="caption" color={t.textSecondary} style={styles.centered}>
                  {tr('onboarding.back')}
                </AppText>
              </AppPressable>
            </View>
          </View>
        )}
      </ScrollView>

      <CityPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(city) => {
          update({ location: { type: 'manual', cityId: city.id } });
          setPickerOpen(false);
        }}
      />

      <Sheet
        visible={methodsOpen}
        onClose={() => setMethodsOpen(false)}
        accessibilityLabel={tr('more.method')}
        testID="ob-methods-sheet"
      >
        <AppText variant="subtitle" style={styles.sheetTitle}>
          {tr('more.method')}
        </AppText>
        <ScrollView style={styles.methodList}>
          {METHOD_KEYS.map((key) => (
            <RadioRow
              key={key}
              label={METHOD_LABELS[key]}
              selected={effectiveMethod === key}
              onPress={() => {
                update({ method: key });
                setMethodsOpen(false);
              }}
              testID={`ob-method-${key}`}
            />
          ))}
        </ScrollView>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    maxWidth: measure.content,
    width: '100%',
    alignSelf: 'center',
  },
  stepBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  stepColumn: { gap: spacing.l },
  brandRow: { flexDirection: 'row', gap: spacing.s, alignItems: 'baseline' },
  centered: { textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: spacing.m, marginTop: spacing.l },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.m,
  },
  cityText: { flex: 1, gap: 2 },
  moreMethods: { paddingHorizontal: spacing.m, minHeight: 40, justifyContent: 'center' },
  previewRule: { marginTop: spacing.s },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs },
  previewCol: { alignItems: 'center', gap: spacing.xs, flexShrink: 1 },
  previewTime: { fontSize: 13, lineHeight: 18 },
  sheetTitle: { marginBottom: spacing.m },
  methodList: { maxHeight: 420 },
});
