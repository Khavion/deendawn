import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  InteractionManager,
  Pressable,
  Share,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  ViewToken,
} from 'react-native';

import {
  isBookmarked,
  loadNightWarm,
  loadReadingScale,
  loadShowTranslation,
  loadTajweed,
  recordReadingPosition,
  saveShowTranslation,
  toggleBookmark,
} from '../readerState';
import { AyahRow, buildShareText, getSurah, listAyahs } from '../repo';
import { getAyahRuns, TAJWEED_LEGEND } from '../tajweed';
import { TAJWEED_ENABLED } from '../tajweedFlag';
import { AppText } from '@/src/components/ui';
import { SurahAudioBar } from '@/src/features/audio/components/SurahAudioBar';
import { useSettings } from '@/src/features/settings/SettingsContext';
import { fonts, fontSize, quranType, radius, spacing, tajweedColors } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

// Base translation type (latinType.reading) — scaled by the reader size pref.
const TRANSLATION_SIZE = fontSize.body;
const TRANSLATION_LINE_HEIGHT = 26;

export function SurahScreen() {
  const db = useSQLiteContext();
  const { store } = useSettings();
  const { t: tr } = useTranslation();
  const params = useLocalSearchParams<{ id: string; ayah?: string }>();
  const surahNumber = Number(params.id);
  const nightWarm = loadNightWarm(store);
  const t = useTokens(nightWarm ? 'nightWarm' : undefined);
  const scheme = useColorScheme();
  const readingScale = loadReadingScale(store);
  const tajweedOn = TAJWEED_ENABLED && loadTajweed(store);
  const tajPalette = nightWarm || scheme === 'dark' ? tajweedColors.dark : tajweedColors.light;

  const surah = useMemo(() => getSurah(db, surahNumber), [db, surahNumber]);
  const targetAyah = params.ayah ? Number(params.ayah) : null;
  // E7: keep the push animation clean — heavy row materialization waits for the
  // transition to finish (Interactions), then the list mounts. EXCEPTION: when
  // deep-linking to a specific ayah (bookmarks, verse-of-day, search), load the
  // rows synchronously so FlashList's initialScrollIndex lands on that ayah at
  // mount instead of opening at the top.
  const [ayahs, setAyahs] = useState<AyahRow[]>(() =>
    targetAyah ? listAyahs(db, surahNumber) : []
  );
  useEffect(() => {
    if (targetAyah) return;
    const task = InteractionManager.runAfterInteractions(() => {
      setAyahs(listAyahs(db, surahNumber));
    });
    return () => task.cancel();
  }, [db, surahNumber, targetAyah]);
  const [showTranslation, setShowTranslation] = useState(() => loadShowTranslation(store));
  const [bookmarkVersion, setBookmarkVersion] = useState(0);
  const listRef = useRef<FlashListRef<AyahRow>>(null);
  // Don't record a last-read position until any initial deep-link scroll has
  // settled — otherwise the top-of-surah render fires first and overwrites the
  // very position we deep-linked to (continue-reading / bookmark / verse).
  const trackReadingRef = useRef(targetAyah === null);

  const initialIndex = targetAyah
    ? Math.max(
        0,
        ayahs.findIndex((a) => a.ayah === targetAyah)
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
      recordReadingPosition(store, viewableItems[0]?.item as AyahRow | undefined, trackReadingRef.current);
    },
    [store]
  );

  if (!surah) {
    return (
      <View style={[styles.center, { backgroundColor: t.bgCanvas }]}>
        <AppText style={{ color: t.textPrimary }}>{tr('quran.notFound')}</AppText>
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
              <AppText variant="link">
                {showTranslation ? tr('quran.arabicOnly') : tr('quran.translation')}
              </AppText>
            </Pressable>
          ),
        }}
      />
      <View style={styles.audioWrap}>
        <SurahAudioBar
          surah={surah.number}
          title={surah.name_transliteration}
          nightWarm={nightWarm}
        />
      </View>
      <FlashList
        ref={listRef}
        data={ayahs}
        keyExtractor={(a) => String(a.id)}
        onLoad={() => {
          // Scroll to the deep-linked ayah once the list has measured its
          // (variable-height) rows — scrollToIndex is exact, whereas
          // initialScrollIndex only estimates and overshoots for long ayat.
          // Only start recording the last-read position AFTER that scroll, so
          // the deep-linked position isn't clobbered by the top-of-surah render.
          if (initialIndex > 0) {
            void listRef.current
              ?.scrollToIndex({ index: initialIndex, animated: false })
              .finally(() => {
                trackReadingRef.current = true;
              });
          } else {
            trackReadingRef.current = true;
          }
        }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {showTranslation && __DEV__ ? (
              <View
                style={[styles.devBadge, { backgroundColor: t.ochreSoft }]}
                testID="dev-translation-badge"
              >
                <AppText variant="caption" style={{ color: t.ochre, textAlign: 'center' }}>
                  {tr('quran.devBadge')}
                </AppText>
              </View>
            ) : null}
            {tajweedOn ? (
              <View
                style={[
                  styles.tajweedLegend,
                  { backgroundColor: t.bgSurface, borderColor: t.border },
                ]}
                testID="tajweed-legend"
              >
                <AppText variant="caption" style={{ color: t.ochre }}>
                  {tr('quran.tajweed.pendingReview')}
                </AppText>
                <AppText variant="caption" style={{ color: t.textSecondary }}>
                  {tr('quran.tajweed.attribution')}
                </AppText>
                <View style={styles.legendRow}>
                  {TAJWEED_LEGEND.map((entry) => (
                    <View key={entry.colorKey} style={styles.legendItem}>
                      <View
                        style={[styles.legendDot, { backgroundColor: tajPalette[entry.colorKey] }]}
                      />
                      <AppText variant="caption" style={{ color: t.textSecondary }}>
                        {tr(entry.labelKey)}
                      </AppText>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </>
        }
        renderItem={({ item }) => {
          const bookmarked = isBookmarked(store, { surah: item.surah, ayah: item.ayah });
          return (
            <View
              style={[styles.ayahBlock, { borderBottomColor: t.border }]}
              testID={`ayah-${item.surah}-${item.ayah}`}
            >
              <AppText
                accessibilityLanguage="ar"
                style={[
                  styles.arabic,
                  {
                    color: t.textPrimary,
                    fontSize: quranType.ayahSize * readingScale,
                    lineHeight: quranType.ayahLineHeight * readingScale,
                  },
                ]}
              >
                {tajweedOn
                  ? getAyahRuns(item.surah, item.ayah, item.text_uthmani).map((run, i) =>
                      run.colorKey ? (
                        <Text key={i} style={{ color: tajPalette[run.colorKey] }}>
                          {run.text}
                        </Text>
                      ) : (
                        run.text
                      )
                    )
                  : item.text_uthmani}
              </AppText>
              {showTranslation && (
                <AppText
                  variant="reading"
                  style={[
                    styles.translation,
                    {
                      color: t.textSecondary,
                      fontSize: TRANSLATION_SIZE * readingScale,
                      lineHeight: TRANSLATION_LINE_HEIGHT * readingScale,
                    },
                  ]}
                  testID={`translation-${item.ayah}`}
                >
                  {item.text_translation}
                </AppText>
              )}
              <View style={styles.ayahFooter}>
                <AppText variant="caption" style={{ color: t.accent }}>
                  {item.surah}:{item.ayah}
                </AppText>
                <View style={styles.actions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      bookmarked ? tr('quran.bookmarkRemove') : tr('quran.bookmarkAdd')
                    }
                    testID={`bookmark-${item.ayah}`}
                    hitSlop={12}
                    onPress={() => {
                      toggleBookmark(store, { surah: item.surah, ayah: item.ayah });
                      setBookmarkVersion((v) => v + 1);
                    }}
                  >
                    <AppText style={{ color: t.ochre }}>{bookmarked ? '★' : '☆'}</AppText>
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
                    <AppText style={{ color: t.accent }}>{tr('quran.share')}</AppText>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
        extraData={`${showTranslation}-${bookmarkVersion}-${nightWarm}-${tajweedOn}-${readingScale}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  audioWrap: { paddingHorizontal: spacing.xl, paddingTop: spacing.s },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, paddingTop: spacing.s },
  devBadge: {
    borderRadius: radius.control,
    padding: spacing.s,
    marginBottom: spacing.s,
  },
  tajweedLegend: {
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.m,
    marginBottom: spacing.s,
    gap: spacing.s,
  },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.m },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
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
