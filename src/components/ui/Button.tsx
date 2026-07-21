import React from 'react';
import { Animated, Pressable, type PressableProps, StyleSheet } from 'react-native';

import { AppText } from './AppText';
import { fonts, radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';
import { usePressScale } from '@/src/lib/theme/usePressScale';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  variant?: 'primary' | 'secondary';
};

/**
 * Primary = filled with the brand primary; secondary = hairline outline.
 * Web hover becomes a pressed state (opacity). Tap target ≥ 48pt. A subtle
 * press-scale (tier-gated, off under Reduce Motion) gives tactile feedback.
 */
export function Button({
  title,
  variant = 'primary',
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: ButtonProps) {
  const t = useTokens();
  const press = usePressScale();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={(e) => {
        press.onPressIn();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        press.onPressOut();
        onPressOut?.(e);
      }}
      style={({ pressed }) => [
        styles.base,
        primary
          ? { backgroundColor: t.accent }
          : { borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      {...rest}
    >
      <Animated.View style={press.style}>
        <AppText
          variant="body"
          color={primary ? t.onPrimary : t.textPrimary}
          style={styles.label}
          numberOfLines={1}
        >
          {title}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.m,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: fonts.sansSemiBold },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
