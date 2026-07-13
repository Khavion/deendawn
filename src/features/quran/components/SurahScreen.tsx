import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, Share, StyleSheet, View, ViewToken } from 'react-native';

import {
  isBookmarked,
  loadShowTranslation,
  saveLastRead,
  saveShowTranslation,
  toggleBookmark,
} from '../readerState';
import { AyahRow, buildShareText, getSurah, listAyahs } from '../repo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/src/features/settings/SettingsContext';

export function SurahScreen() {
  const scheme = useColorScheme() ?? 'light';
  const db = useSQLiteContext();
  const { store } = useSettings();
  const params = useLocalSearchParams<{ id: string; ayah?: string }>();
  const surahNumber = Number(params.id);

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

  const listRef = useRef<FlatList<AyahRow>>(null);

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
      <ThemedView style={styles.center}>
        <ThemedText>Surah not found.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
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
              <ThemedText type="link">{showTranslation ? 'Arabic only' : 'Translation'}</ThemedText>
            </Pressable>
          ),
        }}
      />
      <FlatList
        ref={listRef}
        data={ayahs}
        keyExtractor={(a) => String(a.id)}
        initialNumToRender={12}
        initialScrollIndex={initialIndex > 0 ? initialIndex : undefined}
        onScrollToIndexFailed={() => {}}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          showTranslation && __DEV__ ? (
            <View style={styles.devBadge} testID="dev-translation-badge">
              <ThemedText style={styles.devBadgeText}>
                DEV translation (Pickthall, 1930) — final translation pending review
              </ThemedText>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const bookmarked = isBookmarked(store, { surah: item.surah, ayah: item.ayah });
          return (
            <View style={styles.ayahBlock} testID={`ayah-${item.surah}-${item.ayah}`}>
              <ThemedText style={styles.arabic}>{item.text_uthmani}</ThemedText>
              {showTranslation && (
                <ThemedText style={styles.translation} testID={`translation-${item.ayah}`}>
                  {item.text_translation}
                </ThemedText>
              )}
              <View style={styles.ayahFooter}>
                <ThemedText style={[styles.ayahNumber, { color: Colors[scheme].tint }]}>
                  {item.surah}:{item.ayah}
                </ThemedText>
                <View style={styles.actions}>
                  <Pressable
                    accessibilityRole="button"
                    testID={`bookmark-${item.ayah}`}
                    hitSlop={8}
                    onPress={() => {
                      toggleBookmark(store, { surah: item.surah, ayah: item.ayah });
                      setBookmarkVersion((v) => v + 1);
                    }}
                  >
                    <ThemedText style={{ color: Colors[scheme].tint }}>
                      {bookmarked ? '★' : '☆'}
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    testID={`share-${item.ayah}`}
                    hitSlop={8}
                    onPress={() =>
                      void Share.share({
                        message: buildShareText(item, surah, {
                          includeTranslation: showTranslation,
                        }),
                      })
                    }
                  >
                    <ThemedText style={{ color: Colors[scheme].tint }}>Share</ThemedText>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
        extraData={`${showTranslation}-${bookmarkVersion}`}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  devBadge: {
    backgroundColor: 'rgba(255,180,0,0.15)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  devBadgeText: { fontSize: 12, textAlign: 'center', opacity: 0.9 },
  ayahBlock: {
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.25)',
  },
  arabic: {
    fontFamily: 'AmiriQuran',
    fontSize: 26,
    lineHeight: 52,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  translation: { opacity: 0.85, lineHeight: 22 },
  ayahFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ayahNumber: { fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 20 },
});
