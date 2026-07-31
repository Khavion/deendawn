import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AccessibilityInfo,
  Share,
  StyleSheet,
  useColorScheme,
  View,
  ViewToken,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { AyahActionsSheet } from './AyahActionsSheet';
import { ReaderChrome, CHROME_HEIGHT } from './ReaderChrome';
import { ReaderPrefsSheet } from './ReaderPrefsSheet';
import {
  loadBookmarks,
  loadNightWarm,
  loadReadingScale,
  loadShowTranslation,
  loadTajweed,
  recordReadingPosition,
  saveNightWarm,
  saveReadingScale,
  saveShowTranslation,
  stepReadingScale,
  toggleBookmark,
} from '../readerState';
import { AyahRow, buildShareText, getSurah, listAyahs } from '../repo';
import { getAyahRuns, TAJWEED_LEGEND } from '../tajweed';
import { TAJWEED_ENABLED } from '../tajweedFlag';
import { AppPressable, AppText, AyahBlock, Card } from '@/src/components/ui';
import { SurahAudioBar } from '@/src/features/audio/components/SurahAudioBar';
import { useSettings } from '@/src/features/settings/SettingsContext';
import { localizeNumber } from '@/src/lib/i18n/format';
import { measure, radius, spacing, tajweedColors } from '@/src/lib/theme/tokens';
import { listCellDirection } from '@/src/lib/theme/direction';
import { useTokens } from '@/src/lib/theme/useTokens';

const HIDE_AFTER_OFFSET = 24;
const DIRECTION_SLOP = 4;

export function SurahScreen() {
  const db = useSQLiteContext();
  const { store } = useSettings();
  const { t: tr, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; ayah?: string }>();
  const insets = useSafeAreaInsets();
  const surahNumber = Number(params.id);
  const [nightWarm, setNightWarm] = useState(() => loadNightWarm(store));
  const t = useTokens(nightWarm ? 'nightWarm' : undefined);
  const scheme = useColorScheme();
  const [readingScale, setReadingScale] = useState(() => loadReadingScale(store));
  const tajweedOn = TAJWEED_ENABLED && loadTajweed(store);
  const tajPalette = nightWarm || scheme === 'dark' ? tajweedColors.dark : tajweedColors.light;

  const surah = useMemo(() => getSurah(db, surahNumber), [db, surahNumber]);
  const targetAyah = params.ayah ? Number(params.ayah) : null;
  // Rows load synchronously: the bundled db read is millisecond-fast and
  // FlashList v2 mounts rows lazily, so the push stays clean and the reader
  // never shows an empty page.
  const ayahs = useMemo(() => listAyahs(db, surahNumber), [db, surahNumber]);
  const [showTranslation, setShowTranslation] = useState(() => loadShowTranslation(store));
  const [bookmarkVersion, setBookmarkVersion] = useState(0);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [actionsFor, setActionsFor] = useState<AyahRow | null>(null);
  // Chrome hide/reveal (gap 13) + reading-progress hairline.
  const [chromeHidden, setChromeHidden] = useState(false);
  const [progress, setProgress] = useState(0);
  const lastOffset = useRef(0);
  // One bookmark read per change, not one KV read + JSON parse per visible row
  // per render — that was directly on the 60fps scroll budget.
  const bookmarkSet = useMemo(() => {
    return new Set(loadBookmarks(store).map((b) => `${b.surah}:${b.ayah}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, bookmarkVersion]);
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

  const changeReadingScale = (dir: 1 | -1) => {
    setReadingScale((current) => {
      const next = stepReadingScale(current, dir);
      saveReadingScale(store, next);
      AccessibilityInfo.announceForAccessibility(
        `${tr('more.readingSize')} ${Math.round(next * 100)}%`
      );
      return next;
    });
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      recordReadingPosition(
        store,
        viewableItems[0]?.item as AyahRow | undefined,
        trackReadingRef.current
      );
    },
    [store]
  );

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const y = contentOffset.y;
    const dy = y - lastOffset.current;
    lastOffset.current = y;
    const span = contentSize.height - layoutMeasurement.height;
    if (span > 0) setProgress(Math.min(1, Math.max(0, y / span)));
    if (dy > DIRECTION_SLOP && y > HIDE_AFTER_OFFSET) setChromeHidden(true);
    else if (dy < -DIRECTION_SLOP || y <= HIDE_AFTER_OFFSET) setChromeHidden(false);
  }, []);

  if (!surah) {
    return (
      <View style={[styles.center, { backgroundColor: t.bgCanvas }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <AppText style={{ color: t.textPrimary }}>{tr('quran.notFound')}</AppText>
      </View>
    );
  }

  const subtitle = tr('quran.surahSubtitle', {
    name: surah.name_english,
    ayat: tr('quran.ayat', { count: surah.ayah_count }),
  });

  return (
    <View style={[styles.container, { backgroundColor: t.bgCanvas }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <FlashList
        ref={listRef}
        data={ayahs}
        keyExtractor={(a) => String(a.id)}
        onLoad={() => {
          // Scroll to the deep-linked ayah once the list has measured its
          // (variable-height) rows — scrollToIndex is exact, whereas
          // initialScrollIndex only estimates and overshoots for long ayat.
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
        onScroll={onScroll}
        scrollEventThrottle={32}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: insets.top + CHROME_HEIGHT + spacing.m,
            paddingBottom: insets.bottom + 96 + spacing.xl,
          },
        ]}
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
        renderItem={({ item }) => (
          <Card style={[styles.ayahCard, listCellDirection()]}>
            <AppPressable
              haptic="select"
              accessibilityRole="button"
              accessibilityLabel={tr('quran.actionsTitle', {
                surah: localizeNumber(item.surah, i18n.language),
                ayah: localizeNumber(item.ayah, i18n.language),
              })}
              testID={`ayah-${item.surah}-${item.ayah}`}
              onPress={() => {
                setChromeHidden(false);
                setActionsFor(item);
              }}
              style={styles.ayahInner}
            >
              <AyahBlock
                text={item.text_uthmani}
                runs={
                  tajweedOn
                    ? getAyahRuns(item.surah, item.ayah, item.text_uthmani).map((run) => ({
                        text: run.text,
                        color: run.colorKey ? tajPalette[run.colorKey] : undefined,
                      }))
                    : undefined
                }
                translation={showTranslation ? item.text_translation : undefined}
                ayahNumber={`${localizeNumber(item.surah, i18n.language)}:${localizeNumber(item.ayah, i18n.language)}`}
                scale={readingScale}
                testID={`ayah-block-${item.ayah}`}
              />
            </AppPressable>
          </Card>
        )}
        extraData={`${showTranslation}-${bookmarkVersion}-${nightWarm}-${tajweedOn}-${readingScale}`}
      />

      <ReaderChrome
        hidden={chromeHidden}
        title={`${localizeNumber(surah.number, i18n.language)}. ${surah.name_transliteration}`}
        subtitle={subtitle}
        backLabel={tr('quran.backToSurahs')}
        prefsLabel={tr('quran.aa')}
        onBack={() => router.back()}
        onPrefs={() => setPrefsOpen(true)}
        progress={progress}
        topInset={insets.top}
      />

      <View style={[styles.audioDock, { paddingBottom: insets.bottom }]} pointerEvents="box-none">
        <SurahAudioBar
          surah={surah.number}
          title={surah.name_transliteration}
          nightWarm={nightWarm}
        />
      </View>

      <ReaderPrefsSheet
        visible={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        scale={readingScale}
        onStep={changeReadingScale}
        showTranslation={showTranslation}
        onToggleTranslation={() => {
          setShowTranslation((v) => {
            saveShowTranslation(store, !v);
            return !v;
          });
        }}
        nightWarm={nightWarm}
        onToggleNightWarm={() => {
          setNightWarm((v) => {
            saveNightWarm(store, !v);
            return !v;
          });
        }}
      />

      <AyahActionsSheet
        visible={actionsFor !== null}
        onClose={() => setActionsFor(null)}
        surah={actionsFor?.surah ?? surah.number}
        ayah={actionsFor?.ayah ?? 0}
        bookmarked={actionsFor ? bookmarkSet.has(`${actionsFor.surah}:${actionsFor.ayah}`) : false}
        onToggleBookmark={() => {
          if (!actionsFor) return;
          toggleBookmark(store, { surah: actionsFor.surah, ayah: actionsFor.ayah });
          setBookmarkVersion((v) => v + 1);
        }}
        onShare={() => {
          if (!actionsFor) return;
          void Share.share({
            message: buildShareText(actionsFor, surah, { includeTranslation: showTranslation }),
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: {
    paddingHorizontal: spacing.l,
    maxWidth: measure.reading,
    width: '100%',
    alignSelf: 'center',
  },
  ayahCard: { marginBottom: spacing.m, padding: 0 },
  ayahInner: { padding: spacing.l },
  devBadge: {
    borderRadius: radius.control,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    marginBottom: spacing.m,
  },
  tajweedLegend: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.m,
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.m },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  audioDock: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
