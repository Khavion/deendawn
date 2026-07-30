import React from 'react';
import { Animated, Pressable, type PressableProps } from 'react-native';

import { useHaptics, type HapticVerb } from '@/src/lib/haptics';
import { usePressScale } from '@/src/lib/theme/usePressScale';
import { useTokens } from '@/src/lib/theme/useTokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type AppPressableProps = PressableProps & {
  /** Optional haptic verb fired with onPress (see src/lib/haptics.ts). */
  haptic?: HapticVerb;
};

/**
 * The app's one interactive primitive: a drop-in `Pressable` that gives every
 * touch visible feedback (press-scale on the node itself, so caller layout —
 * row direction, gaps — is untouched) plus an opt-in haptic verb. Scale is
 * tier-gated and off under Reduce Motion via usePressScale. The Android ripple
 * is the entire Android feel budget (portability, not polish).
 */
export function AppPressable({
  haptic: hapticVerb,
  onPress,
  onPressIn,
  onPressOut,
  style,
  android_ripple,
  ...rest
}: AppPressableProps) {
  const h = useHaptics();
  const t = useTokens();
  const press = usePressScale();

  return (
    <AnimatedPressable
      onPressIn={(e) => {
        press.onPressIn();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        press.onPressOut();
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (hapticVerb) h[hapticVerb]();
        onPress?.(e);
      }}
      android_ripple={android_ripple ?? { color: t.border, foreground: true }}
      style={(state) => [typeof style === 'function' ? style(state) : style, press.style]}
      {...rest}
    />
  );
}
