import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, I18nManager, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { duration } from '@/src/lib/theme/tokens';
import { withAlpha } from '@/src/lib/color';
import { useTokens } from '@/src/lib/theme/useTokens';
import { useDeviceTier } from '@/src/lib/theme/useDeviceTier';

/**
 * ProgressRing (handoff §5 gap 14): an ochre arc over a faint ochre track,
 * drawn with Skia. Starts at 12 o'clock; runs counter-clockwise in RTL so
 * progress reads in the writing direction. Buffering renders a dashed ring
 * rotating at the slow duration — an opacity pulse instead under Reduce
 * Motion. The center is a child slot (play control, tasbih numeral).
 * Used at 96px (player), 252px (tasbih), and for the qibla rim treatment.
 */
export type ProgressRingProps = {
  size: number;
  strokeWidth?: 3 | 4 | 5 | 6;
  /** 0–1; clamped. Ignored while buffering. */
  progress: number;
  state?: 'determinate' | 'buffering';
  /** Track alpha (spec range .14–.16). */
  trackAlpha?: number;
  children?: React.ReactNode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

export function ProgressRing({
  size,
  strokeWidth = 4,
  progress,
  state = 'determinate',
  trackAlpha = 0.15,
  children,
  accessibilityLabel,
  style,
  testID,
}: ProgressRingProps) {
  const t = useTokens();
  const { reduceMotion, flat } = useDeviceTier();
  const pulse = reduceMotion || flat;
  const spin = useRef(new Animated.Value(0)).current;

  const inset = strokeWidth / 2 + 1;
  const rect = useMemo(
    () => Skia.XYWHRect(inset, inset, size - inset * 2, size - inset * 2),
    [inset, size]
  );

  const trackPath = useMemo(
    () => Skia.PathBuilder.Make().addArc(rect, 0, 360).detach(),
    [rect]
  );

  const arcPath = useMemo(() => {
    const sweep = clamp01(progress) * 360;
    // Start at 12 o'clock (-90°); mirror the sweep for RTL.
    return Skia.PathBuilder.Make()
      .addArc(rect, -90, I18nManager.isRTL ? -sweep : sweep)
      .detach();
  }, [rect, progress]);

  // Buffering motion: rotate the dashed ring (or pulse under Reduce Motion).
  useEffect(() => {
    if (state !== 'buffering') return;
    spin.setValue(0);
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: pulse ? duration.slow * 4 : duration.slow * 6,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [state, pulse, spin]);

  const spinStyle = pulse
    ? {
        opacity: spin.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.45, 1, 0.45],
        }),
      }
    : {
        transform: [
          {
            rotate: spin.interpolate({
              inputRange: [0, 1],
              outputRange: I18nManager.isRTL ? ['0deg', '-360deg'] : ['0deg', '360deg'],
            }),
          },
        ],
      };

  return (
    <View
      style={[{ width: size, height: size }, style]}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={
        state === 'determinate' ? { min: 0, max: 100, now: Math.round(clamp01(progress) * 100) } : undefined
      }
      testID={testID}
    >
      {state === 'determinate' ? (
        <Canvas style={StyleSheet.absoluteFill}>
          <Path
            path={trackPath}
            style="stroke"
            strokeWidth={strokeWidth}
            color={withAlpha(t.ochre, trackAlpha)}
          />
          <Path
            path={arcPath}
            style="stroke"
            strokeWidth={strokeWidth}
            strokeCap="round"
            color={t.ochre}
          />
        </Canvas>
      ) : (
        <Animated.View style={[StyleSheet.absoluteFill, spinStyle]}>
          <Canvas style={StyleSheet.absoluteFill}>
            <BufferingRing rect={rect} strokeWidth={strokeWidth} color={t.ochre} />
          </Canvas>
        </Animated.View>
      )}
      <View style={styles.center} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

/** Dashed circle drawn as discrete arc segments (12 dashes at 55% duty). */
function BufferingRing({
  rect,
  strokeWidth,
  color,
}: {
  rect: ReturnType<typeof Skia.XYWHRect>;
  strokeWidth: number;
  color: string;
}) {
  const path = useMemo(() => {
    const b = Skia.PathBuilder.Make();
    const segments = 12;
    const sweep = 360 / segments;
    for (let i = 0; i < segments; i++) {
      b.addArc(rect, i * sweep, sweep * 0.55);
    }
    return b.detach();
  }, [rect]);
  return <Path path={path} style="stroke" strokeWidth={strokeWidth} strokeCap="round" color={color} />;
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
