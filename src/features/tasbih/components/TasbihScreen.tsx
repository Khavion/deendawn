import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

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
import { AppText } from '@/src/components/ui';
import { fonts, radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

export function TasbihScreen() {
  const t = useTokens();
  const { t: tr } = useTranslation();
  const { store } = useSettings();
  const [state, setState] = useState(() => loadTasbih(store));
  const [history, setHistory] = useState(() => recentHistory(store, 7));
  const [milestone, setMilestone] = useState<'detent' | 'round' | null>(null);
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
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      flash('round');
    } else if (result.hitThirtyThree) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      flash('detent');
    } else {
      void Haptics.selectionAsync();
    }
  };

  const ringColor = milestone === 'round' ? t.success : milestone === 'detent' ? t.ochre : t.accent;
  const displayCount = milestone === 'round' ? state.target : state.count;

  return (
    <View style={[styles.container, { backgroundColor: t.bgCanvas }]}>
      <Stack.Screen options={{ title: tr('tasbih.title') }} />

      <TextInput
        testID="tasbih-label"
        value={state.label}
        onChangeText={(text) => setState(setLabel(store, text))}
        placeholder={tr('tasbih.labelPlaceholder')}
        placeholderTextColor={t.icon}
        maxLength={60}
        style={[styles.label, { color: t.textSecondary }]}
        maxFontSizeMultiplier={1.4}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tr('tasbih.tapArea', { count: state.count, target: state.target })}
        testID="tasbih-tap"
        onPress={onTap}
        style={styles.tapArea}
      >
        <View style={[styles.ring, { borderColor: ringColor }]}>
          <AppText style={[styles.count, { color: t.textPrimary }]} testID="tasbih-count">
            {displayCount}
          </AppText>
          <AppText variant="caption" style={{ color: t.textSecondary }}>
            {displayCount}
            {' / '}
            {state.target}
          </AppText>
        </View>
        <AppText variant="caption" style={[styles.hint, { color: t.textSecondary }]}>
          {tr('tasbih.tapAnywhere')}
        </AppText>
      </Pressable>

      <View style={styles.controls}>
        {TASBIH_TARGETS.map((target) => (
          <Pressable
            key={target}
            accessibilityRole="button"
            testID={`target-${target}`}
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
              {target}
            </AppText>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          testID="tasbih-reset"
          onPress={() => setState(resetCount(store))}
          style={[styles.chip, { borderColor: t.border }]}
        >
          <AppText style={{ color: t.textSecondary }}>{tr('tasbih.reset')}</AppText>
        </Pressable>
      </View>

      <View style={styles.history}>
        {history.map((day) => (
          <View key={day.date} style={styles.historyRow}>
            <AppText variant="caption" style={{ color: t.textSecondary }}>
              {day.date.slice(5)}
            </AppText>
            <AppText variant="caption" style={{ color: day.count > 0 ? t.ochre : t.icon }}>
              {day.count}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl },
  label: {
    fontFamily: fonts.serif,
    fontSize: 17,
    textAlign: 'center',
    paddingVertical: spacing.s,
  },
  tapArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.l },
  ring: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
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
  history: { marginTop: spacing.xl, gap: spacing.xs },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
