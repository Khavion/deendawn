import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { loadLastRead } from '../readerState';
import { AyahRow, listSurahs, searchAyahs } from '../repo';
import { AppText } from '@/src/components/ui';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/src/features/settings/SettingsContext';
import { useTokens } from '@/src/lib/theme/useTokens';

export function SurahListScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const tk = useTokens();
  const router = useRouter();
  const db = useSQLiteContext();
  const { store } = useSettings();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const surahs = useMemo(() => listSurahs(db), [db]);
  const lastRead = useMemo(() => loadLastRead(store), [store]);
  const results: AyahRow[] = useMemo(
    () => (query.trim().length >= 2 ? searchAyahs(db, query, 50) : []),
    [db, query]
  );
  const searching = query.trim().length >= 2;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <AppText variant="title" style={styles.title}>
        {t('quran.title')}
      </AppText>
      <TextInput
        testID="quran-search"
        value={query}
        onChangeText={setQuery}
        placeholder={t('quran.searchPlaceholder')}
        placeholderTextColor={Colors[scheme].icon}
        autoCorrect={false}
        style={[styles.input, { color: Colors[scheme].text, borderColor: Colors[scheme].icon }]}
      />

      {searching ? (
        <FlashList
          data={results}
          keyExtractor={(a) => String(a.id)}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<AppText style={styles.hint}>{t('quran.noMatches')}</AppText>}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              testID={`result-${item.surah}-${item.ayah}`}
              onPress={() => router.push(`/surah/${item.surah}?ayah=${item.ayah}`)}
              style={styles.resultRow}
            >
              <AppText variant="bodyStrong">
                {item.surah}:{item.ayah}
              </AppText>
              <AppText numberOfLines={2} style={styles.resultText}>
                {item.text_translation}
              </AppText>
            </Pressable>
          )}
        />
      ) : (
        <FlashList
          data={surahs}
          keyExtractor={(s) => String(s.number)}
          ListHeaderComponent={
            lastRead ? (
              <Pressable
                accessibilityRole="button"
                testID="continue-reading"
                onPress={() => router.push(`/surah/${lastRead.surah}?ayah=${lastRead.ayah}`)}
                style={[styles.continueChip, { backgroundColor: Colors[scheme].tint }]}
              >
                <AppText variant="bodyStrong" color={tk.textOnAccent}>
                  {t('quran.continueReading', { surah: lastRead.surah, ayah: lastRead.ayah })}
                </AppText>
              </Pressable>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              testID={`surah-${item.number}`}
              onPress={() => router.push(`/surah/${item.number}`)}
              style={styles.row}
            >
              <View style={[styles.numberBadge, { borderColor: Colors[scheme].tint }]}>
                <AppText style={{ color: Colors[scheme].tint }}>{item.number}</AppText>
              </View>
              <View style={styles.names}>
                <AppText variant="bodyStrong">{item.name_transliteration}</AppText>
                <AppText style={styles.sub}>
                  {item.name_english} · {t('quran.verses', { count: item.ayah_count })}
                </AppText>
              </View>
              <AppText style={styles.arabicName}>{item.name_arabic}</AppText>
            </Pressable>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  title: { marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  hint: { textAlign: 'center', marginTop: 24, opacity: 0.7 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.25)',
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  names: { flex: 1, gap: 2 },
  sub: { opacity: 0.6, fontSize: 13 },
  arabicName: { fontFamily: 'AmiriQuran', fontSize: 20, lineHeight: 36 },
  continueChip: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  resultRow: {
    paddingVertical: 12,
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.25)',
  },
  resultText: { opacity: 0.8 },
});
