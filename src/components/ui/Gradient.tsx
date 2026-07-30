import React, { useMemo } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { parseColor, sampleGradient, toRgbaString } from '@/src/lib/color';

export type GradientProps = ViewProps & {
  /** Two or more color stops (hex or rgba). */
  colors: string[];
  /** Optional stop positions 0..1, same length as colors. */
  locations?: number[];
  direction?: 'vertical' | 'horizontal';
  /** Number of interpolation bands (more = smoother, costlier). */
  bands?: number;
  /** Low-end / reduced-motion: render a single flat fill instead of bands. */
  flat?: boolean;
  /** Flat-mode fill; defaults to the gradient sampled at its midpoint. */
  flatColor?: string;
};

/**
 * A dependency-free linear gradient: a stack of interpolated bands behind
 * `children`. Lets the signature dawn-sky gradient ship without a native
 * rebuild. For a single static background the bands cost nothing at 60fps;
 * low-capability devices get `flat` (one View). Swap the internals for
 * expo-linear-gradient later without changing any call site.
 */
export function Gradient({
  colors,
  locations,
  direction = 'vertical',
  bands = 20,
  flat = false,
  flatColor,
  style,
  children,
  ...rest
}: GradientProps) {
  const stops = useMemo(() => colors.map(parseColor), [colors]);

  const bandColors = useMemo(() => {
    if (flat) {
      const c = flatColor ?? toRgbaString(sampleGradient(stops, 0.5, locations));
      return [c];
    }
    const n = Math.max(2, bands);
    return Array.from({ length: n }, (_, i) =>
      toRgbaString(sampleGradient(stops, (i + 0.5) / n, locations))
    );
  }, [stops, locations, bands, flat, flatColor]);

  const horizontal = direction === 'horizontal';

  // Android rounds flexed band sizes to device pixels, leaving sub-pixel
  // seams where the background bleeds through as hairlines (sweep finding on
  // the featured cards). Fully-opaque gradients overlap each band 1px into
  // the previous one to cover the seams; alpha gradients must stay flush
  // (overlap would double-composite into darker seam lines instead).
  const opaque = useMemo(() => stops.every((s) => s.a >= 1), [stops]);

  return (
    <View style={style} {...rest}>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { flexDirection: horizontal ? 'row' : 'column' }]}
      >
        {bandColors.map((c, i) => (
          <View
            key={i}
            style={[
              styles.band,
              { backgroundColor: c },
              opaque && i > 0 && (horizontal ? styles.overlapH : styles.overlapV),
            ]}
          />
        ))}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  band: { flex: 1 },
  overlapV: { marginTop: -1 },
  overlapH: { marginLeft: -1 },
});
