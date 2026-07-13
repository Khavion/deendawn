import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  loadNotificationPrefs,
  saveNotificationPrefs,
  setPrayerEnabled,
} from '../../notifications/prefsStore';
import { ADHAN_PRAYERS, AdhanPrayer } from '../../notifications/scheduler';
import { ensurePermission, rescheduleAll } from '../../notifications/service';
import { loadNightWarm, saveNightWarm } from '../../quran/readerState';
import { CityPickerModal } from '../../prayer-times/components/CityPickerModal';
import { METHOD_LABELS } from '../../prayer-times/methods';
import { HighLatRuleKey, MadhabKey, METHOD_KEYS, MethodKey } from '../../prayer-times/types';
import { useSettings } from '../SettingsContext';
import { resolveLocation } from '../settingsStore';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const MADHAB_LABELS: Record<MadhabKey, string> = {
  shafi: 'Standard (Shafi, Maliki, Hanbali)',
  hanafi: 'Hanafi (later Asr)',
};

const HIGH_LAT_LABELS: Record<HighLatRuleKey, string> = {
  auto: 'Automatic (recommended)',
  middleofthenight: 'Middle of the night',
  seventhofthenight: 'Seventh of the night',
  twilightangle: 'Twilight angle',
};

function PickerModal<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { key: T; label: string }[];
  selected: T;
  onSelect: (key: T) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={[styles.modalContainer, { paddingTop: insets.top + 12 }]}>
        <View style={styles.modalHeader}>
          <ThemedText type="subtitle">{title}</ThemedText>
          <Pressable accessibilityRole="button" testID="close-option-picker" onPress={onClose}>
            <ThemedText type="link">Close</ThemedText>
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

const ADHAN_LABELS: Record<AdhanPrayer, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

export function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { settings, update, store } = useSettings();
  const [open, setOpen] = useState<null | 'city' | 'method' | 'madhab' | 'highlat'>(null);
  const [prefs, setPrefs] = useState(() => loadNotificationPrefs(store));
  const [nightWarm, setNightWarm] = useState(() => loadNightWarm(store));
  const location = resolveLocation(settings);

  const togglePrayer = async (prayer: AdhanPrayer, enabled: boolean) => {
    if (enabled) await ensurePermission(true);
    const next = setPrayerEnabled(prefs, prayer, enabled);
    setPrefs(next);
    saveNotificationPrefs(store, next);
    void rescheduleAll(new Date(), store);
  };

  const methodOptions = [
    { key: 'auto' as const, label: 'Automatic (based on your region)' },
    ...METHOD_KEYS.map((k) => ({ key: k, label: METHOD_LABELS[k] })),
  ];

  const rows = [
    {
      id: 'city',
      title: 'Location',
      value: location?.label ?? 'Not set',
      onPress: () => setOpen('city'),
    },
    {
      id: 'method',
      title: 'Calculation method',
      value: settings.method === 'auto' ? 'Automatic' : METHOD_LABELS[settings.method as MethodKey],
      onPress: () => setOpen('method'),
    },
    {
      id: 'madhab',
      title: 'Asr time (madhab)',
      value: MADHAB_LABELS[settings.madhab],
      onPress: () => setOpen('madhab'),
    },
    {
      id: 'highlat',
      title: 'High-latitude nights',
      value: HIGH_LAT_LABELS[settings.highLatRule],
      onPress: () => setOpen('highlat'),
    },
  ];

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedText type="title" style={styles.title}>
          Settings
        </ThemedText>
        <ThemedText style={styles.sectionHint}>
          Prayer time settings. If you are not sure, the automatic options follow the most common
          conventions for your region.
        </ThemedText>
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
          Adhan notifications
        </ThemedText>
        <ThemedText style={styles.sectionHint}>
          Get a reminder at each prayer time. Your phone&apos;s silent switch and Focus modes can
          mute these — that is an iPhone setting, not the app.
        </ThemedText>
        {ADHAN_PRAYERS.map((prayer) => (
          <View key={prayer} style={styles.settingRowInline}>
            <ThemedText type="defaultSemiBold">{ADHAN_LABELS[prayer]}</ThemedText>
            <Switch
              testID={`notif-${prayer}`}
              value={prefs.enabled[prayer]}
              onValueChange={(v) => void togglePrayer(prayer, v)}
            />
          </View>
        ))}
        <ThemedText type="title" style={[styles.title, styles.sectionTitle]}>
          Reading
        </ThemedText>
        <View style={styles.settingRowInline}>
          <View style={styles.rowText}>
            <ThemedText type="defaultSemiBold">Night reading (warm)</ThemedText>
            <ThemedText style={styles.settingValue}>
              Amber tones in the Quran reader, easier on the eyes before dawn
            </ThemedText>
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
        <ThemedText style={styles.privacyNote}>
          DeenDawn stores everything on your phone. No account, no ads, no tracking.
        </ThemedText>
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
        title="Calculation method"
        options={methodOptions}
        selected={settings.method}
        onSelect={(method) => update({ method })}
        onClose={() => setOpen(null)}
      />
      <PickerModal
        visible={open === 'madhab'}
        title="Asr time (madhab)"
        options={(Object.keys(MADHAB_LABELS) as MadhabKey[]).map((k) => ({
          key: k,
          label: MADHAB_LABELS[k],
        }))}
        selected={settings.madhab}
        onSelect={(madhab) => update({ madhab })}
        onClose={() => setOpen(null)}
      />
      <PickerModal
        visible={open === 'highlat'}
        title="High-latitude nights"
        options={(Object.keys(HIGH_LAT_LABELS) as HighLatRuleKey[]).map((k) => ({
          key: k,
          label: HIGH_LAT_LABELS[k],
        }))}
        selected={settings.highLatRule}
        onSelect={(highLatRule) => update({ highLatRule })}
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
