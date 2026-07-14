import React from 'react';
import { Pressable, type PressableProps, StyleSheet } from 'react-native';

import { AppText } from './AppText';
import { fonts, radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  variant?: 'primary' | 'secondary';
};

/**
 * Primary = filled with the brand primary; secondary = hairline outline.
 * Web hover becomes a pressed state (opacity). Tap target ≥ 48pt.
 */
export function Button({ title, variant = 'primary', disabled, ...rest }: ButtonProps) {
  const t = useTokens();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
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
      <AppText
        variant="body"
        color={primary ? t.onPrimary : t.textPrimary}
        style={styles.label}
        numberOfLines={1}
      >
        {title}
      </AppText>
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
