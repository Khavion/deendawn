import { Stack } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import {
  loadTasbih,
  recentHistory,
  resetCount,
  setLabel,
  setTarget,
  tap,
  TASBIH_TARGETS,
} from '../tasbihState';
import { useSettings } from '../../settings/SettingsContext';
import { AppPressable, AppText, Gradient } from '@/src/components/ui';
import { formatDayKey, localizeNumber } from '@/src/lib/i18n/format';
import { useHaptics } from '@/src/lib/haptics';
import {
  ambientGradient,
  elevation,
  fonts,
  fontScaleCaps,
  radius,
  richMode,
  spacing,
} from '@/src/lib/theme/tokens';
import { useThemeMode } from '@/src/lib/theme/ThemeProvider';
import { useScrollInsets } from '@/src/lib/theme/useScrollInsets';
import { useTokens } from '@/src/lib/theme/useTokens';
import { useDeviceTier } from '@/src/lib/theme/useDeviceTier';

export function TasbihScreen() {
  const t = useTokens();
  const androidInsets = useScrollInsets({ top: false, bottom: 'nav', baseBottom: spacing.xl });
  const mode = useThemeMode();
  const rm = richMode(mode);
  const { flat } = useDeviceTier();
  const h = useHaptics();
  const { t: tr, i18n } = useTranslation();
  const { store } = useSettings();
  const [state, setState] = useState(() => loadTasbih(store));
  const [history, setHistory] = useState(() => recentHistory(store, 7));
  const [milestone, setMilestone] = useState<'detent' | 'round' | null>(null);
  const [scrollNeeded, setScrollNeeded] = useState(false);
  const viewportH = useRef(0);
  const contentH = useRef(0);
  const milestoneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = (kind: 'detent' | 'round') => {
    setMilestone(kind);
    if (milestoneTimer.current) clearTimeout(milestoneTimer.current);
    milestoneTimer.current = setTimeout(() => setMilestone(null), 700);
  };

  const onTap = () => {
    const result = tap(store);
    setState(result.state);
    setHistory(recentHistory(store, 7));
    if (result.completedRound) {
      h.success();
      AccessibilityInfo.announceForAccessibility(tr('tasbih.roundAnnounce'));
      flash('round');
    } else if (result.hitThirtyThree) {
      h.detent();
      flash('detent');
    } else {
      h.select();
    }
  };

  const ringColor = milestone === 'round' ? t.success : milestone === 'detent' ? t.ochre : t.accent;
  const displayCount = milestone === 'round' ? state.target : state.count;

  return (
    <View style={[styles.container, { backgroundColor: t.bgCanvas }]}>
      <Stack.Screen options={{ title: tr('tasbih.title') }} />
      <Gradient
        pointerEvents="none"
        colors={ambientGradient[rm].day}
        flat={flat}
        flatColor={t.bgCanvas}
        style={styles.ambient}
      />

      {/* Scrollable so large Dynamic Type degrades by scrolling — the ring,
          hint and history stop colliding; `automatic` clears the home
          indicator on this pushed screen. */}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.scrollContent, androidInsets]}
        keyboardShouldPersistTaps="handled"
        // Scroll ONLY when content genuinely overflows (large Dynamic Type):
        // an always-armed pan recognizer cancels in-flight ring presses after
        // ~10pt of finger travel, silently dropping dhikr counts (ultra-review
        // finding). Static when everything fits — like the pre-scroll layout.
        scrollEnabled={scrollNeeded}
        alwaysBounceVertical={false}
        onLayout={(e) => {
          viewportH.current = e.nativeEvent.layout.height;
          setScrollNeeded(contentH.current > viewportH.current + 1);
        }}
        onContentSizeChange={(_w, h) => {
          contentH.current = h;
          setScrollNeeded(h > viewportH.current + 1);
        }}
      >
        <TextInput
          testID="tasbih-label"
          value={state.label}
          onChangeText={(text) => setState(setLabel(store, text))}
          placeholder={tr('tasbih.labelPlaceholder')}
          accessibilityLabel={tr('tasbih.labelPlaceholder')}
          placeholderTextColor={t.icon}
          maxLength={60}
          style={[styles.label, { color: t.textSecondary }]}
          maxFontSizeMultiplier={fontScaleCaps.content}
        />

        <AppPressable
          accessibilityRole="button"
          accessibilityLabel={tr('tasbih.tapArea')}
          accessibilityValue={{ now: state.count, min: 0, max: state.target }}
          testID="tasbih-tap"
          onPress={onTap}
          style={styles.tapArea}
        >
          <View
            style={[
              styles.ring,
              { borderColor: ringColor, backgroundColor: t.bgSurface },
              !flat && milestone === 'round' && { shadowColor: t.success, ...styles.ringGlow },
            ]}
          >
            <AppText
              maxFontSizeMultiplier={fontScaleCaps.label}
              style={[styles.count, { color: t.textPrimary }]}
              testID="tasbih-count"
            >
              {localizeNumber(displayCount, i18n.language)}
            </AppText>
            <AppText variant="caption" style={{ color: t.textSecondary }}>
              {localizeNumber(displayCount, i18n.language)}
              {' / '}
              {localizeNumber(state.target, i18n.language)}
            </AppText>
          </View>
          <AppText variant="caption" style={[styles.hint, { color: t.textSecondary }]}>
            {tr('tasbih.tapAnywhere')}
          </AppText>
        </AppPressable>

        <View style={styles.controls}>
          {TASBIH_TARGETS.map((target) => (
            <AppPressable
              key={target}
              accessibilityRole="button"
              accessibilityState={{ selected: state.target === target }}
              testID={`target-${target}`}
              haptic="select"
              onPress={() => setState(setTarget(store, target))}
              style={[
                styles.chip,
                { borderColor: t.border },
                state.target === target && { backgroundColor: t.accentSoft, borderColor: t.accent },
              ]}
            >
              <AppText
                variant={state.target === target ? 'bodyStrong' : 'body'}
                style={state.target === target ? { color: t.textOnAccentSoft } : undefined}
              >
                {localizeNumber(target, i18n.language)}
              </AppText>
            </AppPressable>
          ))}
          <AppPressable
            accessibilityRole="button"
            testID="tasbih-reset"
            haptic="warning"
            onPress={() => setState(resetCount(store))}
            style={[styles.chip, { borderColor: t.border }]}
          >
            <AppText style={{ color: t.textSecondary }}>{tr('tasbih.reset')}</AppText>
          </AppPressable>
        </View>

        <View
          style={[
            styles.history,
            { backgroundColor: t.bgSurface, borderColor: t.border },
            flat ? undefined : elevation[rm].e2,
          ]}
        >
          {history.map((day) => (
            <View key={day.date} style={styles.historyRow}>
              <AppText variant="caption" style={{ color: t.textSecondary }}>
                {formatDayKey(day.date, i18n.language)}
              </AppText>
              <AppText variant="caption" style={{ color: day.count > 0 ? t.ochre : t.icon }}>
                {localizeNumber(day.count, i18n.language)}
              </AppText>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // flexGrow keeps the tap ring vertically centered when content fits; at
  // large type sizes the same content simply scrolls instead of overlapping.
  scrollContent: { flexGrow: 1, padding: spacing.xl },
  ambient: { position: 'absolute', top: 0, left: 0, right: 0, height: 360 },
  label: {
    fontFamily: fonts.serif,
    fontSize: 17,
    textAlign: 'center',
    paddingVertical: spacing.s,
  },
  tapArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.l },
  ring: {
    // Min-dims + aspectRatio keep the circle while letting large Dynamic Type
    // grow it instead of clipping the numeral (borderRadius 999 stays circular
    // at any size).
    minWidth: 260,
    minHeight: 260,
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.l,
  },
  ringGlow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 12,
  },
  count: { fontFamily: fonts.serifSemiBold, fontSize: 80, lineHeight: 96 },
  hint: { opacity: 0.8 },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.m,
    marginTop: spacing.l,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    minWidth: 56,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  history: {
    marginTop: spacing.xl,
    gap: spacing.xs,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.l,
  },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
