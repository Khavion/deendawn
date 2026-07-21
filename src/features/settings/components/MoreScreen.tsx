import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  DevSettings,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  loadNotificationPrefs,
  saveNotificationPrefs,
  setPrayerEnabled,
  setPrayerSound,
} from '../../notifications/prefsStore';
import { ADHAN_PRAYERS, AdhanPrayer, SoundKey } from '../../notifications/scheduler';
import { ensurePermission, rescheduleAll } from '../../notifications/service';
import { loadNightWarm, loadTajweed, saveNightWarm, saveTajweed } from '../../quran/readerState';
import { TAJWEED_ENABLED } from '../../quran/tajweedFlag';
import { TierBCard } from '../../ask/tierb/components/TierBCard';
import {
  formatBytes,
  initialControllerState,
  selectArtifacts,
  totalBytes,
} from '../../ask/tierb/tierbController';
import { useSettings } from '../SettingsContext';
import { resolveLocation } from '../settingsStore';
import { CityPickerModal } from '../../prayer-times/components/CityPickerModal';
import { HighLatRuleKey, MadhabKey, METHOD_KEYS, MethodKey } from '../../prayer-times/types';
import { AppText, GoldFrameCard, SectionRule } from '@/src/components/ui';
import i18n, {
  applyRtlForNextStart,
  LanguageCode,
  LANGUAGES,
  loadLanguage,
  nativeName,
  needsRtlRestart,
  saveLanguage,
} from '@/src/lib/i18n';
import { elevation, radius, richMode, spacing } from '@/src/lib/theme/tokens';
import { useThemeMode } from '@/src/lib/theme/ThemeProvider';
import { useTokens } from '@/src/lib/theme/useTokens';
import { useDeviceTier } from '@/src/lib/theme/useDeviceTier';

const MADHABS: MadhabKey[] = ['shafi', 'hanafi'];
const HIGH_LAT_RULES: HighLatRuleKey[] = [
  'auto',
  'middleofthenight',
  'seventhofthenight',
  'twilightangle',
];

function PickerModal<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  closeLabel,
  hint,
}: {
  visible: boolean;
  title: string;
  options: { key: T; label: string }[];
  selected: T;
  onSelect: (key: T) => void;
  onClose: () => void;
  closeLabel: string;
  hint?: string;
}) {
  const insets = useSafeAreaInsets();
  const tk = useTokens();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View
        style={[
          styles.modalContainer,
          { backgroundColor: tk.bgCanvas, paddingTop: insets.top + 12 },
        ]}
      >
        <View style={styles.modalHeader}>
          <AppText variant="subtitle">{title}</AppText>
          <Pressable accessibilityRole="button" testID="close-option-picker" onPress={onClose}>
            <AppText variant="link">{closeLabel}</AppText>
          </Pressable>
        </View>
        {hint ? <AppText style={styles.sectionHint}>{hint}</AppText> : null}
        <ScrollView>
          {options.map((o) => (
            <Pressable
              key={o.key}
              accessibilityRole="button"
              accessibilityState={{ selected: o.key === selected }}
              testID={`option-${o.key}`}
              onPress={() => {
                onSelect(o.key);
                onClose();
              }}
              style={styles.optionRow}
            >
              <AppText
                variant={o.key === selected ? 'bodyStrong' : 'body'}
                style={o.key === selected ? { color: tk.accent } : undefined}
              >
                {o.label}
                {o.key === selected ? '  ✓' : ''}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

export function MoreScreen() {
  const insets = useSafeAreaInsets();
  const tk = useTokens();
  const mode = useThemeMode();
  const rm = richMode(mode);
  const { flat } = useDeviceTier();
  const { t } = useTranslation();
  const router = useRouter();
  const groupCard = [
    styles.groupCard,
    { backgroundColor: tk.bgSurface, borderColor: tk.border },
    flat ? undefined : elevation[rm].e2,
  ];
  const { settings, update, store } = useSettings();
  const [open, setOpen] = useState<
    null | 'city' | 'method' | 'madhab' | 'highlat' | 'language' | 'hijri' | 'suhoor'
  >(null);
  const [prefs, setPrefs] = useState(() => loadNotificationPrefs(store));
  const [nightWarm, setNightWarm] = useState(() => loadNightWarm(store));
  const [tajweed, setTajweed] = useState(() => loadTajweed(store));
  const [soundPickerFor, setSoundPickerFor] = useState<AdhanPrayer | null>(null);
  const location = resolveLocation(settings);
  const currentLanguage = (loadLanguage(store) ?? i18n.language) as LanguageCode;

  const togglePrayer = async (prayer: (typeof ADHAN_PRAYERS)[number], enabled: boolean) => {
    if (enabled) await ensurePermission(true);
    const next = setPrayerEnabled(prefs, prayer, enabled);
    setPrefs(next);
    saveNotificationPrefs(store, next);
    void rescheduleAll(new Date(), store);
  };

  const selectSound = (prayer: AdhanPrayer, sound: SoundKey) => {
    const next = setPrayerSound(prefs, prayer, sound);
    setPrefs(next);
    saveNotificationPrefs(store, next);
    void rescheduleAll(new Date(), store);
  };

  const SOUND_KEYS: SoundKey[] = ['default', 'clip', 'fullAdhan', 'silent'];

  const selectLanguage = (code: LanguageCode) => {
    saveLanguage(store, code);
    if (needsRtlRestart(code)) {
      // Bilingual confirm: current language + target language wording.
      const target = i18n.getFixedT(code);
      Alert.alert(
        `${t('more.restartTitle')} · ${target('more.restartTitle')}`,
        `${t('more.restartBody')}\n\n${target('more.restartBody')}`,
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: `${t('common.restart')} · ${target('common.restart')}`,
            onPress: () => {
              applyRtlForNextStart(code);
              Updates.reloadAsync().catch(() => DevSettings.reload());
            },
          },
        ]
      );
    } else {
      void i18n.changeLanguage(code);
    }
  };

  const methodOptions = [
    { key: 'auto' as const, label: t('more.methodAutoRegion') },
    ...METHOD_KEYS.map((k) => ({ key: k, label: t(`methods.${k}`) })),
  ];

  const rows = [
    {
      id: 'city',
      title: t('more.location'),
      value: location?.label ?? t('more.notSet'),
      onPress: () => setOpen('city'),
    },
    {
      id: 'method',
      title: t('more.method'),
      value:
        settings.method === 'auto'
          ? t('more.methodAuto')
          : t(`methods.${settings.method as MethodKey}`),
      onPress: () => setOpen('method'),
    },
    {
      id: 'madhab',
      title: t('more.asr'),
      value: t(`more.madhab_${settings.madhab}`),
      onPress: () => setOpen('madhab'),
    },
    {
      id: 'highlat',
      title: t('more.highLat'),
      value: t(`more.highLat_${settings.highLatRule}`),
      onPress: () => setOpen('highlat'),
    },
    {
      id: 'language',
      title: t('more.language'),
      value: nativeName(currentLanguage),
      onPress: () => setOpen('language'),
    },
    {
      id: 'tasbih',
      title: t('more.tasbih'),
      value: t('tasbih.tapAnywhere'),
      onPress: () => router.push('/tasbih'),
    },
    {
      id: 'about',
      title: t('more.about'),
      value: t('about.madeWith'),
      onPress: () => router.push('/about'),
    },
    {
      id: 'tips',
      title: t('more.tips'),
      value: t('tips.heading'),
      onPress: () => router.push('/tips'),
    },
    {
      id: 'library',
      title: t('more.library'),
      value: t('library.reviewPending').split('—')[0].trim(),
      onPress: () => router.push('/library'),
    },
    {
      id: 'zakat',
      title: t('more.zakat'),
      value: t('zakat.disclaimer').split('.')[0] + '.',
      onPress: () => router.push('/zakat'),
    },
    {
      id: 'calendar',
      title: t('more.calendar'),
      value: t('calendar.disclaimer').split('—')[0].trim(),
      onPress: () => router.push('/calendar'),
    },
    {
      id: 'hijri',
      title: t('more.hijriOffset'),
      value: t(
        `more.hijriOffset_${settings.hijriOffset === -1 ? 'minus1' : settings.hijriOffset === 1 ? 'plus1' : '0'}`
      ),
      onPress: () => setOpen('hijri'),
    },
    {
      id: 'suhoor',
      title: t('more.suhoorReminder'),
      value:
        settings.suhoorReminderMinutes === null
          ? t('more.suhoorReminder_off')
          : t('more.suhoorReminder_minutes', { count: settings.suhoorReminderMinutes }),
      onPress: () => setOpen('suhoor'),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: tk.bgCanvas, paddingTop: insets.top + 12 }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppText variant="title" style={styles.title}>
          {t('more.title')}
        </AppText>
        <AppText style={[styles.sectionHint, { color: tk.textSecondary }]}>{t('more.hint')}</AppText>
        <View style={groupCard}>
          {rows.map((row) => (
            <Pressable
              key={row.id}
              accessibilityRole="button"
              testID={`setting-${row.id}`}
              onPress={row.onPress}
              style={[styles.settingRow, { borderBottomColor: tk.border }]}
            >
              <AppText variant="bodyStrong">{row.title}</AppText>
              <AppText style={[styles.settingValue, { color: tk.textSecondary }]}>
                {row.value}
              </AppText>
            </Pressable>
          ))}
        </View>
        <SectionRule label={t('more.notifications')} style={styles.sectionRule} />
        <AppText style={[styles.sectionHint, { color: tk.textSecondary }]}>
          {t('more.notificationsHint')}
        </AppText>
        <View style={groupCard}>
          {ADHAN_PRAYERS.map((prayer) => (
            <View
              key={prayer}
              style={[styles.settingRowInline, { borderBottomColor: tk.border }]}
            >
              <Pressable
                accessibilityRole="button"
                testID={`sound-${prayer}`}
                style={styles.rowText}
                onPress={() => setSoundPickerFor(prayer)}
              >
                <AppText variant="bodyStrong">{t(`prayers.${prayer}`)}</AppText>
                <AppText style={[styles.settingValue, { color: tk.textSecondary }]}>
                  {t(`more.sound_${prefs.sound[prayer]}`)}
                </AppText>
              </Pressable>
              <Switch
                testID={`notif-${prayer}`}
                value={prefs.enabled[prayer]}
                onValueChange={(v) => void togglePrayer(prayer, v)}
              />
            </View>
          ))}
        </View>
        <SectionRule label={t('more.reading')} style={styles.sectionRule} />
        <View style={groupCard}>
          <View style={[styles.settingRowInline, { borderBottomColor: tk.border }]}>
            <View style={styles.rowText}>
              <AppText variant="bodyStrong">{t('more.nightWarm')}</AppText>
              <AppText style={[styles.settingValue, { color: tk.textSecondary }]}>
                {t('more.nightWarmDesc')}
              </AppText>
            </View>
            <Switch
              testID="night-warm"
              value={nightWarm}
              onValueChange={(v) => {
                setNightWarm(v);
                saveNightWarm(store, v);
              }}
            />
          </View>
          {TAJWEED_ENABLED && (
            <View style={[styles.settingRowInline, { borderBottomColor: tk.border }]}>
              <View style={styles.rowText}>
                <AppText variant="bodyStrong">{t('more.tajweed')}</AppText>
                <AppText style={[styles.settingValue, { color: tk.textSecondary }]}>
                  {t('more.tajweedDesc')}
                </AppText>
              </View>
              <Switch
                testID="tajweed-toggle"
                value={tajweed}
                onValueChange={(v) => {
                  setTajweed(v);
                  saveTajweed(store, v);
                }}
              />
            </View>
          )}
        </View>
        {/* Tier B (on-device AI answers). GATE 7: TierBCard self-gates on
            TIER_B_ENABLED and renders nothing until Zohaib + scholar sign-off.
            Wired here so enabling is a one-line flag flip. Model files are
            PENDING-UPLOAD (BLOCKERS A) → honest "not published yet" block; the
            real download/delete handlers land with the upload. */}
        <View style={styles.tierbWrap}>
          <TierBCard
            state={initialControllerState(selectArtifacts('rich'), true)}
            sizeLabel={formatBytes(totalBytes(selectArtifacts('rich')))}
            onDownload={() => {}}
            onDelete={() => {}}
          />
        </View>
        <GoldFrameCard style={styles.privacyCard}>
          <AppText style={[styles.privacyNote, { color: tk.textSecondary }]}>
            {t('more.privacyNote')}
          </AppText>
        </GoldFrameCard>
      </ScrollView>

      <CityPickerModal
        visible={open === 'city'}
        onClose={() => setOpen(null)}
        onSelect={(city) => {
          update({ location: { type: 'manual', cityId: city.id } });
          setOpen(null);
        }}
      />
      <PickerModal
        visible={open === 'method'}
        title={t('more.method')}
        closeLabel={t('common.close')}
        options={methodOptions}
        selected={settings.method}
        onSelect={(method) => update({ method })}
        onClose={() => setOpen(null)}
      />
      <PickerModal
        visible={open === 'madhab'}
        title={t('more.asr')}
        closeLabel={t('common.close')}
        options={MADHABS.map((k) => ({ key: k, label: t(`more.madhab_${k}`) }))}
        selected={settings.madhab}
        onSelect={(madhab) => update({ madhab })}
        onClose={() => setOpen(null)}
      />
      <PickerModal
        visible={open === 'highlat'}
        title={t('more.highLat')}
        closeLabel={t('common.close')}
        options={HIGH_LAT_RULES.map((k) => ({ key: k, label: t(`more.highLat_${k}`) }))}
        selected={settings.highLatRule}
        onSelect={(highLatRule) => update({ highLatRule })}
        onClose={() => setOpen(null)}
      />
      <PickerModal
        visible={open === 'hijri'}
        title={t('more.hijriOffset')}
        closeLabel={t('common.close')}
        hint={t('calendar.disclaimer')}
        options={[
          { key: '-1', label: t('more.hijriOffset_minus1') },
          { key: '0', label: t('more.hijriOffset_0') },
          { key: '1', label: t('more.hijriOffset_plus1') },
        ]}
        selected={String(settings.hijriOffset) as '-1' | '0' | '1'}
        onSelect={(k) => update({ hijriOffset: Number(k) as -1 | 0 | 1 })}
        onClose={() => setOpen(null)}
      />
      <PickerModal
        visible={open === 'suhoor'}
        title={t('more.suhoorReminder')}
        closeLabel={t('common.close')}
        options={[
          { key: 'off', label: t('more.suhoorReminder_off') },
          ...[20, 30, 45, 60].map((n) => ({
            key: String(n),
            label: t('more.suhoorReminder_minutes', { count: n }),
          })),
        ]}
        selected={
          settings.suhoorReminderMinutes === null ? 'off' : String(settings.suhoorReminderMinutes)
        }
        onSelect={(k) => {
          update({ suhoorReminderMinutes: k === 'off' ? null : Number(k) });
          void rescheduleAll(new Date(), store);
        }}
        onClose={() => setOpen(null)}
      />
      <PickerModal
        visible={soundPickerFor !== null}
        title={t('more.sound')}
        closeLabel={t('common.close')}
        hint={t('more.fullAdhanHonesty')}
        options={SOUND_KEYS.map((k) => ({ key: k, label: t(`more.sound_${k}`) }))}
        selected={soundPickerFor ? prefs.sound[soundPickerFor] : 'default'}
        onSelect={(sound) => soundPickerFor && selectSound(soundPickerFor, sound)}
        onClose={() => setSoundPickerFor(null)}
      />
      <PickerModal
        visible={open === 'language'}
        title={t('more.language')}
        closeLabel={t('common.close')}
        options={LANGUAGES.map((l) => ({ key: l.code, label: nativeName(l.code) }))}
        selected={currentLanguage}
        onSelect={selectLanguage}
        onClose={() => setOpen(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: spacing.l, paddingBottom: spacing.xxl },
  title: { marginBottom: spacing.s },
  sectionHint: { marginBottom: spacing.m },
  sectionRule: { marginTop: spacing.xl, marginBottom: spacing.s },
  groupCard: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingHorizontal: spacing.l,
  },
  settingRow: {
    paddingVertical: spacing.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  settingValue: {},
  rowText: { flex: 1, paddingRight: spacing.m, gap: 2 },
  settingRowInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  privacyCard: { marginTop: spacing.xl, padding: spacing.l },
  privacyNote: { textAlign: 'center' },
  tierbWrap: { marginTop: spacing.xl },
  modalContainer: { flex: 1, paddingHorizontal: spacing.l },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionRow: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.25)',
  },
});
