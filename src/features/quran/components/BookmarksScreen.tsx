import { FlashList } from '@shopify/flash-list';
import { Stack, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { loadBookmarks, toggleBookmark } from '../readerState';
import { AyahRow, getAyahsByRefs, listSurahs } from '../repo';
import { AppText } from '@/src/components/ui';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSettings } from '@/src/features/settings/SettingsContext';
import { fonts, quranType, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

export function BookmarksScreen() {
  const db = useSQLiteContext();
  const { store } = useSettings();
  const { t: tr } = useTranslation();
  const t = useTokens();
  const router = useRouter();
  const [version, setVersion] = useState(0);

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
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              testID={`bookmark-open-${item.surah}-${item.ayah}`}
              onPress={() => router.push(`/surah/${item.surah}?ayah=${item.ayah}`)}
              style={[styles.row, { borderBottomColor: t.border }]}
            >
              <View style={styles.rowHeader}>
                <AppText variant="bodyStrong" style={{ color: t.accent }}>
                  {surahNames.get(item.surah) ?? ''} {item.surah}:{item.ayah}
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={tr('quran.bookmarkRemove')}
                  testID={`bookmark-remove-${item.surah}-${item.ayah}`}
                  hitSlop={12}
                  onPress={() => remove(item)}
                >
                  <AppText style={{ color: t.ochre }}>★</AppText>
                </Pressable>
              </View>
              <AppText
                accessibilityLanguage="ar"
                style={[styles.arabic, { color: t.textPrimary }]}
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
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.s, paddingBottom: spacing.xxl },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.l,
    padding: spacing.xxl,
  },
  emptyText: { textAlign: 'center' },
  row: {
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
