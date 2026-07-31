import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';
import { StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { loadLastRead } from '../readerState';
import { AyahRow, listSurahs, searchAyahs } from '../repo';
import { AppPressable, AppText, GoldFrameCard, SectionRule } from '@/src/components/ui';
import { useSettings } from '@/src/features/settings/SettingsContext';
import { useDebouncedValue } from '@/src/lib/useDebouncedValue';
import {
  elevation,
  featuredGradient,
  fonts,
  fontScaleCaps,
  quranType,
  radius,
  richMode,
  spacing,
  textOnFeatured,
} from '@/src/lib/theme/tokens';
import { listCellDirection } from '@/src/lib/theme/direction';
import { localizeNumber } from '@/src/lib/i18n/format';
import { useThemeMode } from '@/src/lib/theme/ThemeProvider';
import { useScrollInsets } from '@/src/lib/theme/useScrollInsets';
import { useTokens } from '@/src/lib/theme/useTokens';
import { useDeviceTier } from '@/src/lib/theme/useDeviceTier';

export function SurahListScreen() {
  const insets = useSafeAreaInsets();
  const tk = useTokens();
  const androidInsets = useScrollInsets({ top: false, bottom: 'tabs', baseBottom: spacing.m });
  const mode = useThemeMode();
  const rm = richMode(mode);
  const { flat } = useDeviceTier();
  const router = useRouter();
  const db = useSQLiteContext();
  const { store } = useSettings();
  const { t, i18n } = useTranslation();
  // In Arabic and Urdu the calligraphic Arabic name IS the primary title —
  // leading with an English transliteration in an RTL UI was the sweep's
  // locale finding. English keeps the transliteration-primary layout with
  // the Arabic name trailing.
  const arabicPrimary = i18n.language === 'ar' || i18n.language === 'ur';
  const [query, setQuery] = useState('');
  // Force a re-render each time the tab regains focus so `lastRead` (read below)
  // reflects where you actually stopped reading, not a stale memoized value.
  const [, bumpFocus] = useState(0);
  useFocusEffect(
    useCallback(() => {
      bumpFocus((n) => n + 1);
    }, [])
  );

  const surahs = useMemo(() => listSurahs(db), [db]);
  const lastRead = loadLastRead(store);
  const debouncedQuery = useDebouncedValue(query, 150);
  const results: AyahRow[] = useMemo(
    () => (debouncedQuery.trim().length >= 2 ? searchAyahs(db, debouncedQuery, 50) : []),
    [db, debouncedQuery]
  );
  const searching = query.trim().length >= 2;

  const listCard = [
    styles.listCard,
    { backgroundColor: tk.bgSurface, borderColor: tk.border },
    flat ? undefined : elevation[rm].e2,
  ];

  return (
    <View style={[styles.container, { backgroundColor: tk.bgCanvas, paddingTop: insets.top + 12 }]}>
      <View style={styles.headerRow}>
        <AppText variant="title" style={styles.title}>
          {t('quran.title')}
        </AppText>
        <View style={styles.headerLinks}>
          <AppPressable
            accessibilityRole="button"
            testID="quran-ask"
            onPress={() => router.push('/quran/ask')}
            hitSlop={8}
          >
            <AppText variant="link">{t('tabs.ask')}</AppText>
          </AppPressable>
          <AppPressable
            accessibilityRole="button"
            testID="quran-bookmarks"
            onPress={() => router.push('/bookmarks')}
            hitSlop={8}
            style={styles.bookmarksLink}
          >
            <AppText style={{ color: tk.ochre }}>★</AppText>
            <AppText variant="link">{t('quran.bookmarksTitle')}</AppText>
          </AppPressable>
        </View>
      </View>
      <TextInput
        testID="quran-search"
        value={query}
        onChangeText={setQuery}
        placeholder={t('quran.searchPlaceholder')}
        accessibilityLabel={t('quran.searchPlaceholder')}
        placeholderTextColor={tk.icon}
        autoCorrect={false}
        maxFontSizeMultiplier={fontScaleCaps.content}
        style={[styles.input, { color: tk.textPrimary, borderColor: tk.border }]}
      />

      {searching ? (
        <View style={listCard}>
          <FlashList
            data={results}
            keyExtractor={(a) => String(a.id)}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={[styles.listContent, androidInsets]}
            ListEmptyComponent={<AppText style={styles.hint}>{t('quran.noMatches')}</AppText>}
            renderItem={({ item }) => (
              <AppPressable
                accessibilityRole="button"
                testID={`result-${item.surah}-${item.ayah}`}
                onPress={() => router.push(`/surah/${item.surah}?ayah=${item.ayah}`)}
                style={[styles.resultRow, listCellDirection()]}
              >
                <AppText variant="bodyStrong">
                  {localizeNumber(item.surah, i18n.language)}:
                  {localizeNumber(item.ayah, i18n.language)}
                </AppText>
                <AppText numberOfLines={2} style={styles.resultText}>
                  {item.text_translation}
                </AppText>
              </AppPressable>
            )}
          />
        </View>
      ) : (
        <>
          {lastRead && (
            <AppPressable
              accessibilityRole="button"
              testID="continue-reading"
              onPress={() => router.push(`/surah/${lastRead.surah}?ayah=${lastRead.ayah}`)}
            >
              <GoldFrameCard gradientColors={featuredGradient[rm]} style={styles.continueChip}>
                <AppText variant="bodyStrong" style={{ color: textOnFeatured[rm] }}>
                  {t('quran.continueReading', { surah: lastRead.surah, ayah: lastRead.ayah })}
                </AppText>
              </GoldFrameCard>
            </AppPressable>
          )}
          <SectionRule label={t('quran.surahsSection')} style={styles.sectionRule} />
          <View style={listCard}>
            <FlashList
              data={surahs}
              keyExtractor={(s) => String(s.number)}
              contentInsetAdjustmentBehavior="automatic"
              contentContainerStyle={[styles.listContent, androidInsets]}
              renderItem={({ item }) => (
                <AppPressable
                  accessibilityRole="button"
                  testID={`surah-${item.number}`}
                  onPress={() => router.push(`/surah/${item.number}`)}
                  style={[styles.row, listCellDirection(), { borderBottomColor: tk.border }]}
                >
                  <View style={[styles.numberBadge, { borderColor: tk.accent }]}>
                    <AppText
                      maxFontSizeMultiplier={fontScaleCaps.label}
                      style={{ color: tk.accent }}
                    >
                      {localizeNumber(item.number, i18n.language)}
                    </AppText>
                  </View>
                  {arabicPrimary ? (
                    <View style={styles.names}>
                      <AppText
                        accessibilityLanguage="ar"
                        maxFontSizeMultiplier={fontScaleCaps.label}
                        style={styles.arabicPrimaryName}
                      >
                        {item.name_arabic}
                      </AppText>
                      <AppText style={[styles.sub, { color: tk.textSecondary }]}>
                        {item.name_transliteration} · {t('quran.verses', { count: item.ayah_count })}
                      </AppText>
                    </View>
                  ) : (
                    <>
                      <View style={styles.names}>
                        <AppText variant="bodyStrong">{item.name_transliteration}</AppText>
                        <AppText style={[styles.sub, { color: tk.textSecondary }]}>
                          {item.name_english} · {t('quran.verses', { count: item.ayah_count })}
                        </AppText>
                      </View>
                      {/* maxFontSizeMultiplier={1}: Android paints scaled
                          Amiri with unscaled glyph advances (letters clip or
                          gap — fs2.0 sweep finding, reproduced three ways).
                          This trailing name is decorative — the flexible
                          column carries the readable, scaling text — so it
                          keeps its proven 1.0 rendering at every scale. */}
                      <View style={styles.arabicNameBox}>
                        <AppText
                          accessibilityLanguage="ar"
                          maxFontSizeMultiplier={1}
                          numberOfLines={1}
                          style={styles.arabicName}
                        >
                          {item.name_arabic}
                        </AppText>
                      </View>
                    </>
                  )}
                </AppPressable>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.s,
  },
  title: {},
  headerLinks: { flexDirection: 'row', alignItems: 'center', gap: spacing.l },
  bookmarksLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
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
  // The card passes under the floating tab bar; `automatic` insets the rows
  // so the last one is never trapped beneath it.
  listContent: { paddingBottom: spacing.m },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  // NO aspectRatio here: inside virtualized row cells (FlashList + New
  // Architecture) an aspectRatio child resolves against an indefinite size
  // and explodes to fill the cell — verified on release builds. Min-dims
  // grow into a pill at extreme Dynamic Type instead, which never breaks.
  numberBadge: {
    minWidth: 36,
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  names: { flex: 1, gap: 2 },
  sub: { fontSize: 13 },
  /** Owns the row-flex constraints so the Text is never shrink-measured.
      minWidth pads out Android's few-dp underestimate of RTL text width in
      an LTR layout (it wrapped "Aal Imraan" and painted only line 1);
      numberOfLines=1 on the Text is the belt-and-braces guard. */
  arabicNameBox: { flexShrink: 0, maxWidth: '50%', minWidth: 120 },
  arabicName: {
    fontFamily: fonts.quran,
    fontSize: quranType.surahNameSize,
    lineHeight: quranType.surahNameLineHeight,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  /** ar/ur rows: the Arabic name leads inside the flexible column, where it
      has the full width and stays single-line even at the label cap. */
  arabicPrimaryName: {
    fontFamily: fonts.quran,
    fontSize: quranType.surahNameSize,
    lineHeight: quranType.surahNameLineHeight,
    writingDirection: 'rtl',
  },
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
