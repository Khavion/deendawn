import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Share, StyleSheet, View, ViewToken } from 'react-native';

import {
  isBookmarked,
  loadNightWarm,
  loadShowTranslation,
  saveLastRead,
  saveShowTranslation,
  toggleBookmark,
} from '../readerState';
import { AyahRow, buildShareText, getSurah, listAyahs } from '../repo';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/src/features/settings/SettingsContext';
import { fonts, quranType, radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

export function SurahScreen() {
  const db = useSQLiteContext();
  const { store } = useSettings();
  const { t: tr } = useTranslation();
  const params = useLocalSearchParams<{ id: string; ayah?: string }>();
  const surahNumber = Number(params.id);
  const nightWarm = loadNightWarm(store);
  const t = useTokens(nightWarm ? 'nightWarm' : undefined);

  const surah = useMemo(() => getSurah(db, surahNumber), [db, surahNumber]);
  const ayahs = useMemo(() => listAyahs(db, surahNumber), [db, surahNumber]);
  const [showTranslation, setShowTranslation] = useState(() => loadShowTranslation(store));
  const [bookmarkVersion, setBookmarkVersion] = useState(0);

  const initialIndex = params.ayah
    ? Math.max(
        0,
        ayahs.findIndex((a) => a.ayah === Number(params.ayah))
      )
    : 0;

  const onToggleTranslation = () => {
    setShowTranslation((v) => {
      saveShowTranslation(store, !v);
      return !v;
    });
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0]?.item as AyahRow | undefined;
      if (first) saveLastRead(store, { surah: first.surah, ayah: first.ayah });
    },
    [store]
  );

  if (!surah) {
    return (
      <View style={[styles.center, { backgroundColor: t.bgCanvas }]}>
        <ThemedText style={{ color: t.textPrimary }}>{tr('quran.notFound')}</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.bgCanvas }]}>
      <Stack.Screen
        options={{
          title: `${surah.number}. ${surah.name_transliteration}`,
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              testID="toggle-translation"
              onPress={onToggleTranslation}
              hitSlop={8}
            >
              <ThemedText type="link">
                {showTranslation ? tr('quran.arabicOnly') : tr('quran.translation')}
              </ThemedText>
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={ayahs}
        keyExtractor={(a) => String(a.id)}
        initialNumToRender={10}
        initialScrollIndex={initialIndex > 0 ? initialIndex : undefined}
        onScrollToIndexFailed={() => {}}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          showTranslation && __DEV__ ? (
            <View
              style={[styles.devBadge, { backgroundColor: t.ochreSoft }]}
              testID="dev-translation-badge"
            >
              <ThemedText type="caption" style={{ color: t.ochre, textAlign: 'center' }}>
                {tr('quran.devBadge')}
              </ThemedText>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const bookmarked = isBookmarked(store, { surah: item.surah, ayah: item.ayah });
          return (
            <View
              style={[styles.ayahBlock, { borderBottomColor: t.border }]}
              testID={`ayah-${item.surah}-${item.ayah}`}
            >
              <ThemedText style={[styles.arabic, { color: t.textPrimary }]}>
                {item.text_uthmani}
              </ThemedText>
              {showTranslation && (
                <ThemedText
                  type="serifBody"
                  style={[styles.translation, { color: t.textSecondary }]}
                  testID={`translation-${item.ayah}`}
                >
                  {item.text_translation}
                </ThemedText>
              )}
              <View style={styles.ayahFooter}>
                <ThemedText type="caption" style={{ color: t.accent }}>
                  {item.surah}:{item.ayah}
                </ThemedText>
                <View style={styles.actions}>
                  <Pressable
                    accessibilityRole="button"
                    testID={`bookmark-${item.ayah}`}
                    hitSlop={12}
                    onPress={() => {
                      toggleBookmark(store, { surah: item.surah, ayah: item.ayah });
                      setBookmarkVersion((v) => v + 1);
                    }}
                  >
                    <ThemedText style={{ color: t.ochre }}>{bookmarked ? '★' : '☆'}</ThemedText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    testID={`share-${item.ayah}`}
                    hitSlop={12}
                    onPress={() =>
                      void Share.share({
                        message: buildShareText(item, surah, {
                          includeTranslation: showTranslation,
                        }),
                      })
                    }
                  >
                    <ThemedText style={{ color: t.accent }}>{tr('quran.share')}</ThemedText>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
        extraData={`${showTranslation}-${bookmarkVersion}-${nightWarm}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, paddingTop: spacing.s },
  devBadge: {
    borderRadius: radius.control,
    padding: spacing.s,
    marginBottom: spacing.s,
  },
  ayahBlock: {
    paddingVertical: spacing.l,
    gap: spacing.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  arabic: {
    fontFamily: fonts.quran,
    fontSize: quranType.ayahSize,
    lineHeight: quranType.ayahLineHeight,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  translation: { maxWidth: 560 },
  ayahFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: spacing.xl },
});
