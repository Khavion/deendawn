import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { READING_SCALES } from '../readerState';
import { AppPressable, AppText, CheckRow, Sheet } from '@/src/components/ui';
import { spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

/**
 * Reading preferences ("Aa" — handoff gap 12): the ayah-size stepper (scales
 * AyahBlock only, independent of OS font scale), the translation toggle, and
 * the reader's night-warm palette. Served from the reader's own Sheet — the
 * old native-header controls moved here.
 */
export function ReaderPrefsSheet({
  visible,
  onClose,
  scale,
  onStep,
  showTranslation,
  onToggleTranslation,
  nightWarm,
  onToggleNightWarm,
}: {
  visible: boolean;
  onClose: () => void;
  scale: number;
  onStep: (dir: 1 | -1) => void;
  showTranslation: boolean;
  onToggleTranslation: () => void;
  nightWarm: boolean;
  onToggleNightWarm: () => void;
}) {
  const t = useTokens();
  const { t: tr } = useTranslation();
  const atMin = scale <= READING_SCALES[0];
  const atMax = scale >= READING_SCALES[READING_SCALES.length - 1];

  return (
    <Sheet visible={visible} onClose={onClose} accessibilityLabel={tr('more.reading')} testID="reader-prefs-sheet">
      <AppText variant="subtitle" style={styles.title}>
        {tr('more.reading')}
      </AppText>
      <View style={styles.stepperRow}>
        <AppText variant="body">{tr('more.readingSize')}</AppText>
        <View style={styles.stepper}>
          <AppPressable
            accessibilityRole="button"
            accessibilityLabel={tr('more.readingSizeSmaller')}
            testID="reader-size-dec"
            haptic="select"
            disabled={atMin}
            onPress={() => onStep(-1)}
            style={[styles.stepBtn, { borderColor: t.border }, atMin && styles.disabled]}
          >
            <AppText variant="link" style={styles.small}>
              {tr('quran.aa').slice(0, 1)}
            </AppText>
          </AppPressable>
          <AppText variant="caption" color={t.textSecondary} style={styles.pct}>
            {Math.round(scale * 100)}%
          </AppText>
          <AppPressable
            accessibilityRole="button"
            accessibilityLabel={tr('more.readingSizeLarger')}
            testID="reader-size-inc"
            haptic="select"
            disabled={atMax}
            onPress={() => onStep(1)}
            style={[styles.stepBtn, { borderColor: t.border }, atMax && styles.disabled]}
          >
            <AppText variant="link" style={styles.large}>
              {tr('quran.aa').slice(0, 1)}
            </AppText>
          </AppPressable>
        </View>
      </View>
      <CheckRow
        label={tr('quran.translation')}
        selected={showTranslation}
        onPress={onToggleTranslation}
        washed={false}
        testID="toggle-translation"
      />
      <CheckRow
        label={tr('more.nightWarm')}
        sub={tr('more.nightWarmDesc')}
        selected={nightWarm}
        onPress={onToggleNightWarm}
        washed={false}
        testID="toggle-nightwarm"
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.m },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: spacing.m,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.m },
  stepBtn: {
    minWidth: 48,
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  small: { fontSize: 14 },
  large: { fontSize: 20 },
  pct: { minWidth: 44, textAlign: 'center' },
});
