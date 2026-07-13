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
} from '../../notifications/prefsStore';
import { ADHAN_PRAYERS } from '../../notifications/scheduler';
import { ensurePermission, rescheduleAll } from '../../notifications/service';
import { loadNightWarm, saveNightWarm } from '../../quran/readerState';
import { useSettings } from '../SettingsContext';
import { resolveLocation } from '../settingsStore';
import { CityPickerModal } from '../../prayer-times/components/CityPickerModal';
import { HighLatRuleKey, MadhabKey, METHOD_KEYS, MethodKey } from '../../prayer-times/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import i18n, {
  applyRtlForNextStart,
  LanguageCode,
  LANGUAGES,
  loadLanguage,
  nativeName,
  needsRtlRestart,
  saveLanguage,
} from '@/src/lib/i18n';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
}: {
  visible: boolean;
  title: string;
  options: { key: T; label: string }[];
  selected: T;
  onSelect: (key: T) => void;
  onClose: () => void;
  closeLabel: string;
}) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={[styles.modalContainer, { paddingTop: insets.top + 12 }]}>
        <View style={styles.modalHeader}>
          <ThemedText type="subtitle">{title}</ThemedText>
          <Pressable accessibilityRole="button" testID="close-option-picker" onPress={onClose}>
            <ThemedText type="link">{closeLabel}</ThemedText>
          </Pressable>
        </View>
        <ScrollView>
          {options.map((o) => (
            <Pressable
              key={o.key}
              accessibilityRole="button"
              testID={`option-${o.key}`}
              onPress={() => {
                onSelect(o.key);
                onClose();
              }}
              style={styles.optionRow}
            >
              <ThemedText
                type={o.key === selected ? 'defaultSemiBold' : 'default'}
                style={o.key === selected ? { color: Colors[scheme].tint } : undefined}
              >
                {o.label}
                {o.key === selected ? '  ✓' : ''}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </ThemedView>
    </Modal>
  );
}

export function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { settings, update, store } = useSettings();
  const [open, setOpen] = useState<null | 'city' | 'method' | 'madhab' | 'highlat' | 'language'>(
    null
  );
  const [prefs, setPrefs] = useState(() => loadNotificationPrefs(store));
  const [nightWarm, setNightWarm] = useState(() => loadNightWarm(store));
  const location = resolveLocation(settings);
  const currentLanguage = (loadLanguage(store) ?? i18n.language) as LanguageCode;

  const togglePrayer = async (prayer: (typeof ADHAN_PRAYERS)[number], enabled: boolean) => {
    if (enabled) await ensurePermission(true);
    const next = setPrayerEnabled(prefs, prayer, enabled);
    setPrefs(next);
    saveNotificationPrefs(store, next);
    void rescheduleAll(new Date(), store);
  };

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
  ];

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedText type="title" style={styles.title}>
          {t('more.title')}
        </ThemedText>
        <ThemedText style={styles.sectionHint}>{t('more.hint')}</ThemedText>
        {rows.map((row) => (
          <Pressable
            key={row.id}
            accessibilityRole="button"
            testID={`setting-${row.id}`}
            onPress={row.onPress}
            style={styles.settingRow}
          >
            <ThemedText type="defaultSemiBold">{row.title}</ThemedText>
            <ThemedText style={styles.settingValue}>{row.value}</ThemedText>
          </Pressable>
        ))}
        <ThemedText type="title" style={[styles.title, styles.sectionTitle]}>
          {t('more.notifications')}
        </ThemedText>
        <ThemedText style={styles.sectionHint}>{t('more.notificationsHint')}</ThemedText>
        {ADHAN_PRAYERS.map((prayer) => (
          <View key={prayer} style={styles.settingRowInline}>
            <ThemedText type="defaultSemiBold">{t(`prayers.${prayer}`)}</ThemedText>
            <Switch
              testID={`notif-${prayer}`}
              value={prefs.enabled[prayer]}
              onValueChange={(v) => void togglePrayer(prayer, v)}
            />
          </View>
        ))}
        <ThemedText type="title" style={[styles.title, styles.sectionTitle]}>
          {t('more.reading')}
        </ThemedText>
        <View style={styles.settingRowInline}>
          <View style={styles.rowText}>
            <ThemedText type="defaultSemiBold">{t('more.nightWarm')}</ThemedText>
            <ThemedText style={styles.settingValue}>{t('more.nightWarmDesc')}</ThemedText>
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
        <ThemedText style={styles.privacyNote}>{t('more.privacyNote')}</ThemedText>
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
        visible={open === 'language'}
        title={t('more.language')}
        closeLabel={t('common.close')}
        options={LANGUAGES.map((l) => ({ key: l.code, label: nativeName(l.code) }))}
        selected={currentLanguage}
        onSelect={selectLanguage}
        onClose={() => setOpen(null)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  title: { marginBottom: 8 },
  sectionHint: { opacity: 0.7, marginBottom: 16 },
  settingRow: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.25)',
    gap: 2,
  },
  settingValue: { opacity: 0.6 },
  sectionTitle: { marginTop: 28, fontSize: 24, lineHeight: 30 },
  rowText: { flex: 1, paddingRight: 12, gap: 2 },
  settingRowInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.25)',
  },
  privacyNote: { marginTop: 24, opacity: 0.6, textAlign: 'center' },
  modalContainer: { flex: 1, paddingHorizontal: 20 },
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
