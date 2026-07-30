import React from 'react';
import { Animated, StyleSheet } from 'react-native';

import { AppPressable, type AppPressableProps } from './AppPressable';
import { AppText } from './AppText';
import { fonts, radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';
import { usePressScale } from '@/src/lib/theme/usePressScale';

export type ButtonProps = Omit<AppPressableProps, 'style' | 'children'> & {
  title: string;
  variant?: 'primary' | 'secondary';
};

/**
 * Primary = filled with the brand primary; secondary = hairline outline.
 * Rides AppPressable (instant pressed dim + press haptic); the label
 * additionally gets the animated press-scale on an INNER Animated.View —
 * layout-safe because it wraps only the centered label, never row content.
 * Tap target ≥ 48pt; labels wrap (never truncate) at large Dynamic Type.
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
    <AppPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      haptic="press"
      onPressIn={(e) => {
        press.onPressIn();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        press.onPressOut();
        onPressOut?.(e);
      }}
      style={[
        styles.base,
        primary
          ? { backgroundColor: t.accent }
          : { borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
        disabled && styles.disabled,
      ]}
      {...rest}
    >
      <Animated.View style={press.style}>
        <AppText variant="body" color={primary ? t.onPrimary : t.textPrimary} style={styles.label}>
          {title}
        </AppText>
      </Animated.View>
    </AppPressable>
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
  label: { fontFamily: fonts.sansSemiBold, textAlign: 'center' },
  disabled: { opacity: 0.5 },
});
