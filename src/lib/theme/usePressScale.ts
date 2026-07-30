import { useState } from 'react';
import { Animated } from 'react-native';

import { duration } from './tokens';
import { useDeviceTier } from './useDeviceTier';

/**
 * A small, reusable press-scale micro-interaction (docs/DESIGN_AUDIT.md motion
 * pass). Uses the built-in `Animated` API on the native driver — no Reanimated,
 * no native rebuild. Disabled on the essential tier / Reduce Motion, where it
 * collapses to no scaling (60fps floor + accessibility always win).
 *
 * Usage:
 *   const press = usePressScale();
 *   <Pressable onPressIn={press.onPressIn} onPressOut={press.onPressOut}>
 *     <Animated.View style={press.style}>...</Animated.View>
 *   </Pressable>
 */
export function usePressScale(to = 0.97) {
  const { flat, reduceMotion } = useDeviceTier();
  const enabled = !flat && !reduceMotion;
  const [scale] = useState(() => new Animated.Value(1));

  const animate = (value: number, ms: number) => {
    if (!enabled) return;
    Animated.timing(scale, {
      toValue: value,
      duration: ms,
      useNativeDriver: true,
    }).start();
  };

  return {
    enabled,
    style: { transform: [{ scale }] },
    // Down is near-instant (laggy press-in reads as jank); release settles.
    onPressIn: () => animate(to, duration.pressIn),
    onPressOut: () => animate(1, duration.pressOut),
  };
}
