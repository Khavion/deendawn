import { useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  continueSet,
  currentDhikr,
  currentTarget,
  DHIKR_SET,
  isStreakEnabled,
  loadTasbih,
  recentHistory,
  resetCount,
  roundComplete,
  setCustomTarget,
  setLabel,
  setMode,
  streakDays,
  switchToFree,
  tap,
  type TasbihMode,
} from '../tasbihState';
import { addVolumeKeyListener, VOLUME_KEYS_SUPPORTED } from '../volumeKeys';
import { useSettings } from '../../settings/SettingsContext';
import {
  AppPressable,
  AppText,
  Button,
  Card,
  Divider,
  Marker,
  PeriodEyebrow,
  ProgressRing,
  SectionRule,
  SegmentedRow,
  Sheet,
  WeekBars,
} from '@/src/components/ui';
import { digitLocale, localizeNumber } from '@/src/lib/i18n/format';
import { useHaptics } from '@/src/lib/haptics';
import { celebration, fontScaleCaps, radius, spacing } from '@/src/lib/theme/tokens';
import { useScrollInsets } from '@/src/lib/theme/useScrollInsets';
import { useTokens } from '@/src/lib/theme/useTokens';
import { useDeviceTier } from '@/src/lib/theme/useDeviceTier';

const RING_SIZE = 252;

type SegKey = 'set' | 'free' | 'custom';

export function TasbihScreen() {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const androidInsets = useScrollInsets({ top: false, bottom: 'tabs', baseBottom: spacing.xl });
  const { flat } = useDeviceTier();
  const h = useHaptics();
  const { t: tr, i18n } = useTranslation();
  const { store } = useSettings();

  const [state, setState] = useState(() => loadTasbih(store));
  const [history, setHistory] = useState(() => recentHistory(store, 7));
  const [customOpen, setCustomOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState('');
  const [scrollNeeded, setScrollNeeded] = useState(false);
  const viewportH = useRef(0);
  const contentH = useRef(0);

  const target = currentTarget(state);
  const dhikr = currentDhikr(state);
  const complete = roundComplete(state);
  const streakOn = isStreakEnabled(store);

  const onTap = useCallback(() => {
    const result = tap(store);
    if (result.state.count === state.count && !result.completedRound) {
      // Held at a completed round — taps are inert until Continue (§6).
      return;
    }
    setState(result.state);
    setHistory(recentHistory(store, 7));
    if (result.completedRound) {
      // Celebration grammar (§2): ONE detent.
      h.detent();
      AccessibilityInfo.announceForAccessibility(tr('tasbih.roundAnnounce'));
    } else if (result.hitDetent) {
      h.detent();
    } else {
      h.select();
      // Polite count announcement every 10 (§6).
      if (result.state.count % 10 === 0) {
        AccessibilityInfo.announceForAccessibility(
          localizeNumber(result.state.count, i18n.language)
        );
      }
    }
  }, [store, state.count, h, tr, i18n.language]);

  // Volume-key counting (Android only; DECISIONS 2026-07-31) — subscribed
  // only while this screen is focused so volume behaves normally elsewhere.
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;
  useFocusEffect(
    useCallback(() => {
      const sub = addVolumeKeyListener(() => onTapRef.current());
      return () => sub.remove();
    }, [])
  );

  const eyebrowDhikr = dhikr ? tr(`tasbih.dhikr.${dhikr}`) : state.label || tr('tasbih.custom');
  const eyebrow = complete
    ? tr('tasbih.completeEyebrow', { dhikr: eyebrowDhikr })
    : state.mode === 'set'
      ? tr('tasbih.roundEyebrow', {
          dhikr: eyebrowDhikr,
          round: localizeNumber(state.round + 1, i18n.language),
          total: localizeNumber(DHIKR_SET.length, i18n.language),
        })
      : eyebrowDhikr;

  const nextDhikr = DHIKR_SET[(state.round + 1) % DHIKR_SET.length].key;
  const segValue: SegKey = state.mode;
  const dayLetter = new Intl.DateTimeFormat(digitLocale(i18n.language), { weekday: 'narrow' });
  const weekTotal = history.reduce((n, d) => n + d.count, 0);
  const todayCount = history[history.length - 1]?.count ?? 0;
  const streak = streakOn ? streakDays(store) : 0;

  const applyCustom = () => {
    const n = Number.parseInt(customDraft, 10);
    setState(setCustomTarget(store, Number.isFinite(n) ? n : 100));
    setCustomOpen(false);
  };

  return (
    // Tab screen with no header — the container clears the status bar itself.
    <View
      style={[styles.container, { backgroundColor: t.bgCanvas, paddingTop: insets.top + spacing.m }]}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.scrollContent, androidInsets]}
        keyboardShouldPersistTaps="handled"
        // Scroll ONLY when content genuinely overflows (large Dynamic Type):
        // an always-armed pan recognizer cancels in-flight ring presses after
        // ~10pt of finger travel, silently dropping dhikr counts.
        scrollEnabled={scrollNeeded}
        alwaysBounceVertical={false}
        onLayout={(e) => {
          viewportH.current = e.nativeEvent.layout.height;
          setScrollNeeded(contentH.current > viewportH.current + 1);
        }}
        onContentSizeChange={(_w, ch) => {
          contentH.current = ch;
          setScrollNeeded(ch > viewportH.current + 1);
        }}
      >
        <View style={styles.headerRow}>
          <AppText variant="subtitle">{tr('tasbih.title')}</AppText>
          <AppPressable
            accessibilityRole="button"
            testID="tasbih-reset"
            haptic="warning"
            hitSlop={8}
            onPress={() => setState(resetCount(store))}
          >
            <AppText variant="link">{tr('tasbih.reset')}</AppText>
          </AppPressable>
        </View>

        {/* Full-bleed tap surface (§6): everything above the segmented row counts. */}
        <AppPressable
          accessibilityRole="button"
          accessibilityLabel={tr('tasbih.tapArea')}
          accessibilityValue={{ now: state.count, min: 0, max: target }}
          testID="tasbih-tap"
          onPress={onTap}
          style={styles.tapArea}
        >
          <PeriodEyebrow label={eyebrow} style={styles.eyebrow} />
          <View style={!flat && complete ? celebration.glow : undefined}>
            <ProgressRing
              size={RING_SIZE}
              strokeWidth={6}
              progress={target > 0 ? state.count / target : 0}
              accessibilityLabel={tr('tasbih.tapArea')}
              testID="tasbih-ring"
            >
              <AppText
                variant="numeral"
                color={complete ? t.ochre : t.textPrimary}
                maxFontSizeMultiplier={fontScaleCaps.label}
                testID="tasbih-count"
              >
                {localizeNumber(state.count, i18n.language)}
              </AppText>
              <AppText variant="caption" color={t.textSecondary}>
                {tr('tasbih.ofTarget', { target: localizeNumber(target, i18n.language) })}
              </AppText>
            </ProgressRing>
          </View>

          {/* Dhikr line: transliteration + gloss (Arabic-script slot stays
              OFF until scholar gate #5 — owner decision 2026-07-31). */}
          {dhikr ? (
            // SCHOLAR-REVIEW: dhikr names and glosses (docs/SCHOLAR_REVIEW.md)
            <AppText variant="reading" color={t.textSecondary} style={styles.dhikrLine}>
              {tr('tasbih.dhikrLine', {
                name: tr(`tasbih.dhikr.${dhikr}`),
                gloss: tr(`tasbih.gloss.${dhikr}`),
              })}
            </AppText>
          ) : state.label ? (
            <AppText variant="reading" color={t.textSecondary} style={styles.dhikrLine}>
              {state.label}
            </AppText>
          ) : null}

          {state.mode === 'set' && (
            <View style={styles.roundDots}>
              {DHIKR_SET.map((round, i) => (
                <Marker
                  key={round.key}
                  size={8}
                  tone="ochre"
                  variant={
                    i < state.round || (i === state.round && complete) ? 'filled' : 'outline'
                  }
                />
              ))}
            </View>
          )}

          {complete && state.mode === 'set' ? (
            <View style={styles.completeActions}>
              <Button
                title={tr('tasbih.continueNext', { dhikr: tr(`tasbih.dhikr.${nextDhikr}`) })}
                testID="tasbih-continue"
                haptic="press"
                onPress={() => setState(continueSet(store))}
              />
              <AppPressable
                accessibilityRole="button"
                testID="tasbih-keep-tapping"
                hitSlop={8}
                onPress={() => setState(switchToFree(store))}
              >
                <AppText variant="caption" color={t.textSecondary}>
                  {tr('tasbih.keepTapping')}
                </AppText>
              </AppPressable>
            </View>
          ) : (
            <AppText variant="caption" color={t.textSecondary} style={styles.hint}>
              {VOLUME_KEYS_SUPPORTED ? tr('tasbih.tapHintVolume') : tr('tasbih.tapHint')}
            </AppText>
          )}
        </AppPressable>

        <SegmentedRow<SegKey>
          options={[
            { key: 'set', label: localizeNumber(33, i18n.language), testID: 'target-33' },
            { key: 'free', label: localizeNumber(99, i18n.language), testID: 'target-99' },
            { key: 'custom', label: tr('tasbih.custom'), testID: 'target-custom' },
          ]}
          value={segValue}
          onChange={(key) => {
            if (key === 'custom') {
              setCustomDraft(String(state.customTarget));
              setCustomOpen(true);
            } else {
              setState(setMode(store, key as TasbihMode));
            }
          }}
          accessibilityLabel={tr('tasbih.title')}
          style={styles.segmented}
        />

        <SectionRule label={tr('tasbih.lastSevenDays')} style={styles.sectionRule} />
        <Card style={styles.historyCard}>
          <WeekBars
            days={history.map((d, i) => ({
              label: dayLetter.format(new Date(`${d.date}T12:00:00`)),
              count: d.count,
              isToday: i === history.length - 1,
            }))}
            accessibilityLabel={tr('tasbih.weekSummary', {
              total: localizeNumber(weekTotal, i18n.language),
            })}
            testID="tasbih-weekbars"
          />
          <Divider style={styles.historyDivider} />
          <View style={styles.historyMetaRow}>
            <AppText variant="bodyStrong">
              {tr('tasbih.weekTotal', { count: weekTotal })}
            </AppText>
            <AppText variant="caption" color={t.textSecondary}>
              {streakOn
                ? tr('tasbih.streakKept', { count: streak })
                : tr('tasbih.todayLine', { count: localizeNumber(todayCount, i18n.language) })}
            </AppText>
          </View>
        </Card>
      </ScrollView>

      <Sheet
        visible={customOpen}
        onClose={() => setCustomOpen(false)}
        accessibilityLabel={tr('tasbih.customTitle')}
        testID="tasbih-custom-sheet"
      >
        <AppText variant="subtitle" style={styles.sheetTitle}>
          {tr('tasbih.customTitle')}
        </AppText>
        <TextInput
          testID="tasbih-custom-input"
          value={customDraft}
          onChangeText={setCustomDraft}
          keyboardType="number-pad"
          accessibilityLabel={tr('tasbih.customTitle')}
          placeholderTextColor={t.icon}
          maxFontSizeMultiplier={fontScaleCaps.content}
          style={[styles.sheetInput, { color: t.textPrimary, borderColor: t.border }]}
        />
        <TextInput
          testID="tasbih-custom-label"
          value={state.label}
          onChangeText={(text) => setState(setLabel(store, text))}
          placeholder={tr('tasbih.labelPlaceholder')}
          accessibilityLabel={tr('tasbih.labelPlaceholder')}
          placeholderTextColor={t.icon}
          maxLength={60}
          maxFontSizeMultiplier={fontScaleCaps.content}
          style={[styles.sheetInput, { color: t.textPrimary, borderColor: t.border }]}
        />
        <Button title={tr('tasbih.customApply')} testID="tasbih-custom-apply" onPress={applyCustom} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.s,
  },
  tapArea: { alignItems: 'center', gap: spacing.l, paddingVertical: spacing.l },
  eyebrow: {},
  dhikrLine: { textAlign: 'center' },
  roundDots: { flexDirection: 'row', gap: spacing.m },
  completeActions: { alignItems: 'center', gap: spacing.m, alignSelf: 'stretch' },
  hint: { textAlign: 'center' },
  segmented: { marginTop: spacing.s },
  sectionRule: { marginTop: spacing.xl, marginBottom: spacing.s },
  historyCard: { gap: spacing.m },
  historyDivider: {},
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.m,
  },
  sheetTitle: { marginBottom: spacing.m },
  sheetInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.control,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    marginBottom: spacing.m,
    fontSize: 16,
  },
});
