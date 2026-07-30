import React from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { useHaptics, type HapticVerb } from '@/src/lib/haptics';
import { useTokens } from '@/src/lib/theme/useTokens';

export type AppPressableProps = PressableProps & {
  /** Optional haptic verb fired with onPress (see src/lib/haptics.ts). */
  haptic?: HapticVerb;
};

/**
 * The app's one interactive primitive: a drop-in `Pressable` whose pressed
 * state gives instant visible feedback (subtle dim + scale — the native iOS
 * list-highlight idiom) plus an opt-in haptic verb.
 *
 * DELIBERATELY a plain Pressable, not an Animated component: wrapping
 * Pressable in Animated.createAnimatedComponent and merging an animated
 * transform into a function-style broke caller layout styles on RELEASE
 * builds (rows lost flexDirection; found by the Phase-9 evidence sweep).
 * Pressed-state styles are state, not motion — they apply under Reduce
 * Motion too, exactly like native table-row highlights. The Android ripple
 * remains the entire Android feel budget.
 */
export function AppPressable({
  haptic: hapticVerb,
  onPress,
  style,
  android_ripple,
  ...rest
}: AppPressableProps) {
  const h = useHaptics();
  const t = useTokens();

  return (
    <Pressable
      onPress={(e) => {
        if (hapticVerb) h[hapticVerb]();
        onPress?.(e);
      }}
      android_ripple={android_ripple ?? { color: t.border, foreground: true }}
      style={(state) => [
        typeof style === 'function' ? style(state) : style,
        state.pressed && styles.pressed,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
