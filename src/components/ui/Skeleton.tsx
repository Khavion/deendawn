import React, { useEffect, useRef } from 'react';
import { Animated, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';

import { duration, radius as radii } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';
import { useDeviceTier } from '@/src/lib/theme/useDeviceTier';

export type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * A content-shaped loading placeholder. On capable tiers it breathes (opacity
 * pulse on the native driver — no Reanimated, no native rebuild); on the
 * essential tier / Reduce Motion it holds a static muted fill. Compose several
 * to mirror the shape of the content that's loading.
 */
export function Skeleton({ width = '100%', height = 16, radius = radii.control, style }: SkeletonProps) {
  const t = useTokens();
  const { flat, reduceMotion } = useDeviceTier();
  const animate = !flat && !reduceMotion;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!animate) return;
    opacity.setValue(0.35);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.75, duration: duration.slow, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: duration.slow, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animate, opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width, height, borderRadius: radius, backgroundColor: t.border, opacity },
        style,
      ]}
    />
  );
}
