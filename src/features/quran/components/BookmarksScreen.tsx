import { FlashList } from '@shopify/flash-list';
import { Stack, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { loadBookmarks, loadReadingScale, toggleBookmark } from '../readerState';
import { AyahRow, getAyahsByRefs, listSurahs } from '../repo';
import { AppPressable, AppText } from '@/src/components/ui';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSettings } from '@/src/features/settings/SettingsContext';
import {
  fonts,
  fontScaleCaps,
  MAX_ARABIC_EFFECTIVE_SCALE,
  measure,
  quranType,
  spacing,
} from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

export function BookmarksScreen() {
  const db = useSQLiteContext();
  const { store } = useSettings();
  const { t: tr } = useTranslation();
  const t = useTokens();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [version, setVersion] = useState(0);
  // Same sizing rule as the reader: the user's A−/A+ pref applies here too,
  // and its product with system Dynamic Type is clamped, never compounded.
  const [readingScale] = useState(() => loadReadingScale(store));
  const arabicCap = Math.min(fontScaleCaps.content, MAX_ARABIC_EFFECTIVE_SCALE / readingScale);

  // Newest bookmark first. `version` forces a refresh after a removal.
  const rows = useMemo(() => {
    const refs = loadBookmarks(store).slice().reverse();
    return getAyahsByRefs(db, refs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, store, version]);

  const surahNames = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of listSurahs(db)) map.set(s.number, s.name_transliteration);
    return map;
  }, [db]);

  const remove = (row: AyahRow) => {
    toggleBookmark(store, { surah: row.surah, ayah: row.ayah });
    setVersion((v) => v + 1);
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bgCanvas }]}>
      <Stack.Screen options={{ title: tr('quran.bookmarksTitle') }} />
      {rows.length === 0 ? (
        <View style={styles.empty}>
          <IconSymbol name="book.fill" size={40} color={t.ochre} />
          <AppText variant="reading" style={[styles.emptyText, { color: t.textSecondary }]}>
            {tr('quran.bookmarksEmpty')}
          </AppText>
        </View>
      ) : (
        <FlashList
          data={rows}
          keyExtractor={(a) => `${a.surah}:${a.ayah}`}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.xl }]}
          renderItem={({ item }) => (
            <AppPressable
              accessibilityRole="button"
              testID={`bookmark-open-${item.surah}-${item.ayah}`}
              onPress={() => router.push(`/surah/${item.surah}?ayah=${item.ayah}`)}
              style={[styles.row, { borderBottomColor: t.border }]}
            >
              <View style={styles.rowHeader}>
                <AppText variant="bodyStrong" style={{ color: t.accent }}>
                  {surahNames.get(item.surah) ?? ''} {item.surah}:{item.ayah}
                </AppText>
                <AppPressable
                  accessibilityRole="button"
                  accessibilityLabel={tr('quran.bookmarkRemove')}
                  haptic="select"
                  testID={`bookmark-remove-${item.surah}-${item.ayah}`}
                  hitSlop={12}
                  onPress={() => remove(item)}
                >
                  <AppText style={{ color: t.ochre }}>★</AppText>
                </AppPressable>
              </View>
              <AppText
                accessibilityLanguage="ar"
                maxFontSizeMultiplier={arabicCap}
                style={[
                  styles.arabic,
                  {
                    color: t.textPrimary,
                    fontSize: quranType.ayahSize * readingScale,
                    lineHeight: quranType.ayahLineHeight * readingScale,
                  },
                ]}
              >
                {item.text_uthmani}
              </AppText>
              <AppText
                variant="reading"
                numberOfLines={2}
                style={[styles.translation, { color: t.textSecondary }]}
              >
                {item.text_translation}
              </AppText>
            </AppPressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.s },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.l,
    padding: spacing.xxl,
  },
  emptyText: { textAlign: 'center' },
  row: {
    maxWidth: measure.reading,
    width: '100%',
    alignSelf: 'center',
    paddingVertical: spacing.l,
    gap: spacing.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  arabic: {
    fontFamily: fonts.quran,
    fontSize: quranType.ayahSize,
    lineHeight: quranType.ayahLineHeight,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  translation: { maxWidth: 560 },
});
