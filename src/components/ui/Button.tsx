import React from 'react';
import { StyleSheet } from 'react-native';

import { AppPressable, type AppPressableProps } from './AppPressable';
import { AppText } from './AppText';
import { fonts, radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

export type ButtonProps = Omit<AppPressableProps, 'style' | 'children'> & {
  title: string;
  variant?: 'primary' | 'secondary';
};

/**
 * Primary = filled with the brand primary; secondary = hairline outline.
 * Built on AppPressable: press-scale + a light haptic by default. Tap target
 * ≥ 48pt; labels wrap (never truncate) at large Dynamic Type.
 */
export function Button({ title, variant = 'primary', disabled, ...rest }: ButtonProps) {
  const t = useTokens();
  const primary = variant === 'primary';
  return (
    <AppPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      haptic="press"
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
      <AppText variant="body" color={primary ? t.onPrimary : t.textPrimary} style={styles.label}>
        {title}
      </AppText>
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
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
