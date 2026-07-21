import { useRef } from 'react';
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
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (value: number) => {
    if (!enabled) return;
    Animated.timing(scale, {
      toValue: value,
      duration: duration.fast,
      useNativeDriver: true,
    }).start();
  };

  return {
    enabled,
    style: { transform: [{ scale }] },
    onPressIn: () => animate(to),
    onPressOut: () => animate(1),
  };
}
