import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { loadLastRead } from '../readerState';
import { AyahRow, listSurahs, searchAyahs } from '../repo';
import { AppText, GoldFrameCard, SectionRule } from '@/src/components/ui';
import { useSettings } from '@/src/features/settings/SettingsContext';
import {
  elevation,
  featuredGradient,
  radius,
  richMode,
  spacing,
  textOnFeatured,
} from '@/src/lib/theme/tokens';
import { useThemeMode } from '@/src/lib/theme/ThemeProvider';
import { useTokens } from '@/src/lib/theme/useTokens';
import { useDeviceTier } from '@/src/lib/theme/useDeviceTier';

export function SurahListScreen() {
  const insets = useSafeAreaInsets();
  const tk = useTokens();
  const mode = useThemeMode();
  const rm = richMode(mode);
  const { flat } = useDeviceTier();
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

  const listCard = [
    styles.listCard,
    { backgroundColor: tk.bgSurface, borderColor: tk.border },
    flat ? undefined : elevation[rm].e2,
  ];

  return (
    <View
      style={[styles.container, { backgroundColor: tk.bgCanvas, paddingTop: insets.top + 12 }]}
    >
      <AppText variant="title" style={styles.title}>
        {t('quran.title')}
      </AppText>
      <TextInput
        testID="quran-search"
        value={query}
        onChangeText={setQuery}
        placeholder={t('quran.searchPlaceholder')}
        placeholderTextColor={tk.icon}
        autoCorrect={false}
        style={[styles.input, { color: tk.textPrimary, borderColor: tk.border }]}
      />

      {searching ? (
        <View style={listCard}>
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
        </View>
      ) : (
        <>
          {lastRead && (
            <Pressable
              accessibilityRole="button"
              testID="continue-reading"
              onPress={() => router.push(`/surah/${lastRead.surah}?ayah=${lastRead.ayah}`)}
            >
              <GoldFrameCard gradientColors={featuredGradient[rm]} style={styles.continueChip}>
                <AppText variant="bodyStrong" style={{ color: textOnFeatured[rm] }}>
                  {t('quran.continueReading', { surah: lastRead.surah, ayah: lastRead.ayah })}
                </AppText>
              </GoldFrameCard>
            </Pressable>
          )}
          <SectionRule label={t('quran.surahsSection')} style={styles.sectionRule} />
          <View style={listCard}>
            <FlashList
              data={surahs}
              keyExtractor={(s) => String(s.number)}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  testID={`surah-${item.number}`}
                  onPress={() => router.push(`/surah/${item.number}`)}
                  style={[styles.row, { borderBottomColor: tk.border }]}
                >
                  <View style={[styles.numberBadge, { borderColor: tk.accent }]}>
                    <AppText style={{ color: tk.accent }}>{item.number}</AppText>
                  </View>
                  <View style={styles.names}>
                    <AppText variant="bodyStrong">{item.name_transliteration}</AppText>
                    <AppText style={[styles.sub, { color: tk.textSecondary }]}>
                      {item.name_english} · {t('quran.verses', { count: item.ayah_count })}
                    </AppText>
                  </View>
                  <AppText accessibilityLanguage="ar" style={styles.arabicName}>
                    {item.name_arabic}
                  </AppText>
                </Pressable>
              )}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.l },
  title: { marginBottom: spacing.s },
  input: {
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    fontSize: 16,
    marginBottom: spacing.m,
  },
  hint: { textAlign: 'center', marginTop: spacing.xl, opacity: 0.7 },
  sectionRule: { marginBottom: spacing.s },
  listCard: {
    flex: 1,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  sub: { fontSize: 13 },
  arabicName: { fontFamily: 'AmiriQuran', fontSize: 20, lineHeight: 36 },
  continueChip: {
    padding: spacing.l,
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  resultRow: {
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    gap: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.25)',
  },
  resultText: { opacity: 0.8 },
});
