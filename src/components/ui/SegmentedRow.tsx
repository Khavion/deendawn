import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppPressable } from './AppPressable';
import { AppText } from './AppText';
import { radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

/**
 * SegmentedRow (handoff §5 gap 20): equal-width cells inside one hairline
 * border at the control radius; the active cell takes accentSoft +
 * bodyStrong. ≥40pt cells, select haptic, radio semantics announced.
 * Used by: tasbih 33/99/Custom, zakat silver/gold nisab, method groups.
 * RTL mirrors via the flex row for free.
 */
export interface SegmentedOption<K extends string> {
  key: K;
  label: string;
  testID?: string;
}

export function SegmentedRow<K extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  style,
}: {
  options: readonly SegmentedOption<K>[];
  value: K;
  onChange: (key: K) => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTokens();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.frame, { borderColor: t.border }, style]}
    >
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <AppPressable
            key={opt.key}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            haptic="select"
            onPress={() => {
              if (!active) onChange(opt.key);
            }}
            style={[styles.cell, active && { backgroundColor: t.accentSoft }]}
            testID={opt.testID}
          >
            <AppText
              variant={active ? 'bodyStrong' : 'body'}
              color={active ? t.textOnAccentSoft : t.textSecondary}
              numberOfLines={1}
            >
              {opt.label}
            </AppText>
          </AppPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.control,
    overflow: 'hidden',
  },
  cell: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
  },
});
